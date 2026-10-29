import { createHash } from "node:crypto";
import type { CapabilityProposalProjection } from "../capability-core";
import type { PoolCapabilityRequirement } from "../matching/pool";
import type { PoolRoleDiscovery } from "./pool-role-discovery";

/**
 * Content-addressed cache of semantic proposal → requirement relations (owner D-RD-2 = B, D-RD-3 = A; directive „persistentes
 * Caching“, 2026-10-24). GELB architecture:
 *
 * - Pools and capabilities are already content-addressed in the existing system: a pool upload's id is its canonical sha256
 *   (`jobPoolUploadIdFor`), a re-upload creates nothing; a Discovery / Convergence run's id is the hash of its identity
 *   (source bundle, kernel, prompt checksum, provider, model, schema, scope), a repeated analysis of the same source reuses it
 *   without a model call. Nothing of that is duplicated here.
 * - The lexical layer (POOL_ROLE_DISCOVERY_V1) is computed on read (measured 33–55 ms for 4 pools / 78 roles / 507 requirements
 *   including every database read); caching it would add invalidation without measurable gain.
 * - The expensive layer is the semantic relation (one model call per role, D-RD-3). Each evaluated pair is stored ONCE under a
 *   key that is the hash of what it depends on: the proposal's content, the requirement's content and the engine identity.
 *   Nothing is invalidated: changed content or a changed engine yields a new key, the old record stays as history. A new pool
 *   upload that repeats requirements of an earlier one hits the cache for every unchanged requirement (incremental update);
 *   a second analysis of the same source with the same proposals hits it entirely.
 * - Records are immutable (insert once; an attempt to store a different record under an existing key is refused).
 * - A record never becomes verified competence: the state is a model classification with its explanation and its evidence
 *   limitation, authority NONE.
 *
 * This module has no I/O and calls no model. The engine itself (prompt, provider, budget enforcement) is a separate contract.
 */
export const RELATION_CACHE_VERSION = "PROPOSAL_REQUIREMENT_RELATION_CACHE_V1" as const;
export const SEMANTIC_RELATION_STATES = ["EQUIVALENT", "COVERS", "PARTIAL", "DIFFERENT", "UNCLEAR"] as const;
export type SemanticRelationState = typeof SEMANTIC_RELATION_STATES[number];

/** Everything a model evaluation depends on besides the two operands. A change of any field is a different engine. */
export interface RelationEngineIdentity { contractVersion: string; promptChecksum: string; provider: string; model: string }

const sha256 = (value: string) => createHash("sha256").update(value, "utf8").digest("hex");
/** Canonical JSON: object keys sorted at every depth, arrays kept in their given order. */
export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value as object).sort().map(k => `${JSON.stringify(k)}:${canonicalJson((value as Record<string, unknown>)[k])}`).join(",")}}`;
  return JSON.stringify(value);
}

type Proposal = Pick<CapabilityProposalProjection["capabilities"][number], "name" | "scope" | "structuralDefinition" | "evidence">;
/** The proposal as the model would see it: name, scope, definition and its evidence quotes (sorted); never its run-bound id. */
export function proposalContentHash(proposal: Proposal): string {
  return sha256(canonicalJson({ kind: "PROPOSAL", name: proposal.name, scope: proposal.scope, structuralDefinition: proposal.structuralDefinition,
    evidence: proposal.evidence.map(e => e.exactQuote).sort() }));
}

type Requirement = Pick<PoolCapabilityRequirement, "capability_name" | "aliases" | "required_level" | "requirement_type" | "domain" | "necessity">;
/** The requirement as the model would see it, independent of the upload, role and requirement ids it appears under. */
export function requirementContentHash(requirement: Requirement): string {
  return sha256(canonicalJson({ kind: "REQUIREMENT", text: requirement.capability_name, aliases: [...(requirement.aliases ?? [])].sort(),
    requiredLevel: requirement.required_level, requirementType: requirement.requirement_type ?? "CAPABILITY", domain: requirement.domain, necessity: requirement.necessity ?? null }));
}

export function engineVersionHash(engine: RelationEngineIdentity): string {
  return sha256(canonicalJson({ kind: "ENGINE", ...engine }));
}

export function relationKey(proposalHash: string, requirementHash: string, engineHash: string): string {
  return `PRREL_${sha256(canonicalJson({ cache: RELATION_CACHE_VERSION, proposal: proposalHash, requirement: requirementHash, engine: engineHash })).slice(0, 40).toUpperCase()}`;
}

/** One stored evaluation. Every field the owner named for a relation is mandatory (D-RD-2). */
export interface CachedRelation {
  relationKey: string;
  proposalContentHash: string;
  requirementContentHash: string;
  engineVersionHash: string;
  engine: RelationEngineIdentity;
  state: SemanticRelationState;
  capabilityName: string;
  requirementText: string;
  sourceEvidence: Array<{ sourceDocumentId: string; exactQuote: string }>;
  relationExplanation: string;
  evidenceLimitation: string;
  rawOutputSha256: string;
  authorityState: "NONE";
  createdAt: string;
}

const text = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
/** Refuses a record that misses an owner-mandated field, carries an unknown state, claims authority or has a key not derived from its own parts. */
export function assertCachedRelation(record: CachedRelation): void {
  const fail = (detail: string): never => { throw new Error(`ERR_RELATION_CACHE_RECORD_INVALID:${detail}`); };
  if (!SEMANTIC_RELATION_STATES.includes(record.state)) fail("state");
  for (const field of ["capabilityName", "requirementText", "relationExplanation", "evidenceLimitation", "rawOutputSha256", "proposalContentHash", "requirementContentHash", "engineVersionHash", "createdAt"] as const) if (!text(record[field])) fail(field);
  if (!Array.isArray(record.sourceEvidence) || record.sourceEvidence.some(e => !text(e.sourceDocumentId) || !text(e.exactQuote)) || (record.sourceEvidence.length === 0 && record.state !== "DIFFERENT" && record.state !== "UNCLEAR")) fail("sourceEvidence");
  if (record.authorityState !== "NONE") fail("authorityState");
  if (engineVersionHash(record.engine) !== record.engineVersionHash) fail("engineVersionHash");
  if (relationKey(record.proposalContentHash, record.requirementContentHash, record.engineVersionHash) !== record.relationKey) fail("relationKey");
}

/** Read side of the cache: the records present for the given keys. */
export interface RelationCacheReader { getByKeys(keys: string[]): Promise<CachedRelation[]> }

export interface SemanticInvestigationPlan {
  cacheVersion: typeof RELATION_CACHE_VERSION;
  engineVersionHash: string | null;
  /**
   * ENGINE_NOT_SPECIFIED: no engine contract yet — pairs are counted, nothing is looked up or executed.
   * PLANNED: cache read; cached / pending / calls are exact and an execution may be planned on them.
   * CACHE_UNAVAILABLE / CACHE_CORRUPT: the cache cannot be trusted or reached — the semantic layer fails closed (nothing cached is
   * served, nothing may execute: without the cache, idempotency is not guaranteed); the lexical discovery is unaffected.
   */
  state: "ENGINE_NOT_SPECIFIED" | "PLANNED" | "CACHE_UNAVAILABLE" | "CACHE_CORRUPT";
  executable: boolean;
  cacheIssue: string | null;
  pairs: number;
  /** null when the cache could not be read (unknown, never guessed). */
  cachedPairs: number | null;
  pendingPairs: number | null;
  /** D-RD-3 A: one batched call per role with at least one pending pair (an upper bound before any execution); null when unknown. */
  callsNeeded: number | null;
  roles: Array<{ jobPoolUploadId: string; poolRoleId: string; pairs: number; cachedPairs: number | null; pendingPairs: number | null }>;
}

export type RelationCacheState = { state: "AVAILABLE"; reader: RelationCacheReader } | { state: "NOT_PROVISIONED" } | { state: "UNAVAILABLE"; code: string };

/**
 * The actual call volume before anything runs (D-RD-3 precondition): every (proposal, requirement) pair of the discovery, minus the
 * pairs already in the cache for this engine. Identical pairs inside one discovery (the same requirement text in several roles or
 * uploads) are counted once per role, because the call is per role, but share one cache key.
 */
export async function planSemanticInvestigation(input: {
  discovery: Pick<PoolRoleDiscovery, "roles">;
  proposals: Proposal[];
  requirementsByKey: (key: { jobPoolUploadId: string; poolRoleId: string; poolRequirementId: string }) => Requirement | null;
  engine: RelationEngineIdentity | null;
  cache: RelationCacheState | null;
}): Promise<SemanticInvestigationPlan> {
  const proposalHashes = input.proposals.map(proposalContentHash);
  const engineHash = input.engine ? engineVersionHash(input.engine) : null;
  const perRole = input.discovery.roles.map(role => {
    const keys: string[] = [];
    for (const requirement of role.requirements) {
      const content = input.requirementsByKey(requirement.key);
      if (content === null) throw new Error("ERR_RELATION_PLAN_REQUIREMENT_UNKNOWN");
      const requirementHash = requirementContentHash(content);
      for (const proposalHash of proposalHashes) keys.push(engineHash ? relationKey(proposalHash, requirementHash, engineHash) : `${proposalHash}:${requirementHash}`);
    }
    return { role, keys };
  });
  const pairs = perRole.reduce((n, r) => n + r.keys.length, 0);
  const unknown = (state: SemanticInvestigationPlan["state"], cacheIssue: string | null): SemanticInvestigationPlan => ({
    cacheVersion: RELATION_CACHE_VERSION, engineVersionHash: engineHash, state, executable: false, cacheIssue, pairs,
    cachedPairs: state === "ENGINE_NOT_SPECIFIED" ? 0 : null, pendingPairs: state === "ENGINE_NOT_SPECIFIED" ? pairs : null,
    callsNeeded: state === "ENGINE_NOT_SPECIFIED" ? perRole.filter(r => r.keys.length > 0).length : null,
    roles: perRole.map(({ role, keys }) => ({ jobPoolUploadId: role.key.jobPoolUploadId, poolRoleId: role.key.poolRoleId, pairs: keys.length,
      cachedPairs: state === "ENGINE_NOT_SPECIFIED" ? 0 : null, pendingPairs: state === "ENGINE_NOT_SPECIFIED" ? keys.length : null }))
  });
  if (engineHash === null) return unknown("ENGINE_NOT_SPECIFIED", null);
  if (input.cache === null || input.cache.state !== "AVAILABLE") {
    return unknown("CACHE_UNAVAILABLE", input.cache === null ? "ERR_RELATION_CACHE_NOT_OPENED" : input.cache.state === "UNAVAILABLE" ? input.cache.code : "ERR_RELATION_CACHE_NOT_PROVISIONED");
  }
  const distinct = [...new Set(perRole.flatMap(r => r.keys))];
  let cached: Set<string>;
  try { cached = new Set(distinct.length ? (await input.cache.reader.getByKeys(distinct)).map(r => r.relationKey) : []); } catch (error) {
    const message = error instanceof Error ? error.message : "";
    return unknown(message.startsWith("ERR_RELATION_CACHE_RECORD_CORRUPT") ? "CACHE_CORRUPT" : "CACHE_UNAVAILABLE", message.startsWith("ERR_") ? message.split(":")[0] : "ERR_RELATION_CACHE_READ_FAILED");
  }
  const roles = perRole.map(({ role, keys }) => {
    const hit = keys.filter(k => cached.has(k)).length;
    return { jobPoolUploadId: role.key.jobPoolUploadId, poolRoleId: role.key.poolRoleId, pairs: keys.length, cachedPairs: hit, pendingPairs: keys.length - hit };
  });
  const cachedPairs = roles.reduce((n, r) => n + r.cachedPairs, 0);
  return {
    cacheVersion: RELATION_CACHE_VERSION, engineVersionHash: engineHash, state: "PLANNED", executable: true, cacheIssue: null,
    pairs, cachedPairs, pendingPairs: pairs - cachedPairs, callsNeeded: roles.filter(r => r.pendingPairs > 0).length, roles
  };
}
