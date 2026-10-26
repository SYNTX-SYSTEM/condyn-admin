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
  if (!Array.isArray(record.sourceEvidence) || record.sourceEvidence.length === 0 || record.sourceEvidence.some(e => !text(e.sourceDocumentId) || !text(e.exactQuote))) fail("sourceEvidence");
  if (record.authorityState !== "NONE") fail("authorityState");
  if (engineVersionHash(record.engine) !== record.engineVersionHash) fail("engineVersionHash");
  if (relationKey(record.proposalContentHash, record.requirementContentHash, record.engineVersionHash) !== record.relationKey) fail("relationKey");
}

/** Read side of the cache: the records present for the given keys. */
export interface RelationCacheReader { getByKeys(keys: string[]): Promise<CachedRelation[]> }
export interface RelationCacheWriter { saveIfAbsent(records: CachedRelation[]): Promise<{ inserted: number; existing: number }> }

/** Provider boundary for one role batch. Implementations must return evidence-grounded relation states only. */
export interface SemanticRelationProvider {
  execute(input: { engine: RelationEngineIdentity; proposals: Proposal[]; requirements: Requirement[] }): Promise<Array<{
    proposalName: string; requirementText: string; state: SemanticRelationState; relationExplanation: string;
    evidenceLimitation: string; sourceEvidence: Array<{ sourceDocumentId: string; exactQuote: string }>;
    rawOutput: string;
  }>>;
}

/** Persist a provider batch through the same immutable relation cache used by planning/ranking. */
export async function evaluateSemanticRelations(input: {
  engine: RelationEngineIdentity; proposals: Proposal[]; requirements: Requirement[]; provider: SemanticRelationProvider; writer: RelationCacheWriter; now?: () => string;
}): Promise<CachedRelation[]> {
  const output = await input.provider.execute({ engine: input.engine, proposals: input.proposals, requirements: input.requirements });
  const proposals = new Map(input.proposals.map(value => [value.name, value]));
  const requirements = new Map(input.requirements.map(value => [value.capability_name, value]));
  const expected = new Set(input.requirements.flatMap(requirement => input.proposals.map(proposal => `${proposal.name}\u0000${requirement.capability_name}`)));
  const received = new Set<string>();
  const records = output.map(item => {
    const proposal = proposals.get(item.proposalName), requirement = requirements.get(item.requirementText);
    if (!proposal || !requirement || !item.rawOutput || !item.relationExplanation || !item.evidenceLimitation || item.sourceEvidence.length === 0) throw new Error("ERR_RELATION_PROVIDER_OUTPUT_INVALID");
    const pair = `${item.proposalName}\u0000${item.requirementText}`;
    if (!expected.has(pair) || received.has(pair) || item.sourceEvidence.some(evidence => !proposal.evidence.some(source => source.sourceDocumentId === evidence.sourceDocumentId && source.exactQuote === evidence.exactQuote))) throw new Error("ERR_RELATION_PROVIDER_OUTPUT_INVALID");
    received.add(pair);
    const proposalHash = proposalContentHash(proposal), requirementHash = requirementContentHash(requirement), version = engineVersionHash(input.engine);
    return { relationKey: relationKey(proposalHash, requirementHash, version), proposalContentHash: proposalHash, requirementContentHash: requirementHash, engineVersionHash: version, engine: input.engine,
      state: item.state, capabilityName: proposal.name, requirementText: requirement.capability_name, sourceEvidence: item.sourceEvidence,
      relationExplanation: item.relationExplanation, evidenceLimitation: item.evidenceLimitation, rawOutputSha256: sha256(item.rawOutput), authorityState: "NONE" as const, createdAt: (input.now ?? (() => new Date().toISOString()))() };
  });
  if (received.size !== expected.size) throw new Error("ERR_RELATION_PROVIDER_OUTPUT_INCOMPLETE");
  for (const record of records) assertCachedRelation(record);
  await input.writer.saveIfAbsent(records);
  return records;
}

export interface SemanticInvestigationPlan {
  cacheVersion: typeof RELATION_CACHE_VERSION;
  engineVersionHash: string | null;
  /** ENGINE_NOT_SPECIFIED until the semantic engine contract exists: pairs are counted, nothing can be looked up or executed. */
  state: "ENGINE_NOT_SPECIFIED" | "PLANNED";
  pairs: number;
  cachedPairs: number;
  pendingPairs: number;
  /** D-RD-3 A: one batched call per role with at least one pending pair (an upper bound before any execution). */
  callsNeeded: number;
  roles: Array<{ jobPoolUploadId: string; poolRoleId: string; pairs: number; cachedPairs: number; pendingPairs: number }>;
}

/**
 * Read-only semantic ranking over immutable cache records.  This deliberately
 * does not invent a relation when a pair is absent: incomplete cache coverage
 * is reported and the role is not ranked.  Ranking is presentation only;
 * authority remains NONE and no hiring decision is derived here.
 */
export interface SemanticRoleRanking {
  jobPoolUploadId: string;
  poolRoleId: string;
  score: number | null;
  evaluatedPairs: number;
  totalPairs: number;
  complete: boolean;
  matched: number;
}

const semanticWeight: Record<SemanticRelationState, number> = {
  EQUIVALENT: 1, COVERS: 0.9, PARTIAL: 0.5, UNCLEAR: 0.25, DIFFERENT: 0
};
const necessityWeight = (value: string): number => value === "REQUIRED" ? 1 : value === "PREFERRED" ? 0.7 : value === "OPTIONAL" ? 0.4 : 0.5;

/** Compute deterministic role scores from already persisted semantic relations. */
export function rankSemanticRoles(input: {
  discovery: Pick<PoolRoleDiscovery, "roles">;
  proposals: Proposal[];
  requirementsByKey: (key: { jobPoolUploadId: string; poolRoleId: string; poolRequirementId: string }) => Requirement | null;
  relations: CachedRelation[];
  engineVersionHash: string;
}): SemanticRoleRanking[] {
  const byKey = new Map(input.relations.map(relation => [relation.relationKey, relation]));
  return input.discovery.roles.map(role => {
    let evaluatedPairs = 0, totalPairs = 0, matched = 0, numerator = 0, denominator = 0;
    for (const requirement of role.requirements) {
      const content = input.requirementsByKey(requirement.key);
      if (content === null) continue;
      const weight = necessityWeight(content.necessity ?? "UNKNOWN");
      denominator += weight;
      let best: CachedRelation | null = null;
      for (const proposal of input.proposals) {
        totalPairs += 1;
        const key = relationKey(proposalContentHash(proposal), requirementContentHash(content), input.engineVersionHash);
        const relation = byKey.get(key);
        if (relation) { evaluatedPairs += 1; if (!best || semanticWeight[relation.state] > semanticWeight[best.state]) best = relation; }
      }
      if (best) { matched += semanticWeight[best.state] > 0 ? 1 : 0; numerator += weight * semanticWeight[best.state]; }
    }
    const complete = totalPairs > 0 && evaluatedPairs === totalPairs;
    return { jobPoolUploadId: role.key.jobPoolUploadId, poolRoleId: role.key.poolRoleId, score: complete && denominator > 0 ? Number((numerator / denominator).toFixed(4)) : null, evaluatedPairs, totalPairs, complete, matched };
  }).sort((a, b) => (b.score ?? -1) - (a.score ?? -1) || a.jobPoolUploadId.localeCompare(b.jobPoolUploadId) || a.poolRoleId.localeCompare(b.poolRoleId));
}

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
  cache: RelationCacheReader | null;
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
  const distinct = [...new Set(perRole.flatMap(r => r.keys))];
  const cached = engineHash && input.cache && distinct.length ? new Set((await input.cache.getByKeys(distinct)).map(r => r.relationKey)) : new Set<string>();
  const roles = perRole.map(({ role, keys }) => {
    const hit = keys.filter(k => cached.has(k)).length;
    return { jobPoolUploadId: role.key.jobPoolUploadId, poolRoleId: role.key.poolRoleId, pairs: keys.length, cachedPairs: hit, pendingPairs: keys.length - hit };
  });
  const sum = (f: (r: typeof roles[number]) => number) => roles.reduce((n, r) => n + f(r), 0);
  return {
    cacheVersion: RELATION_CACHE_VERSION, engineVersionHash: engineHash, state: engineHash ? "PLANNED" : "ENGINE_NOT_SPECIFIED",
    pairs: sum(r => r.pairs), cachedPairs: sum(r => r.cachedPairs), pendingPairs: sum(r => r.pendingPairs), callsNeeded: roles.filter(r => r.pendingPairs > 0).length, roles
  };
}
