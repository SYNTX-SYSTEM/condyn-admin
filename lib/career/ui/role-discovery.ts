"use client";

import { useEffect, useRef, useState } from "react";
import type { PoolRoleDiscovery, RoleLexicalStatus } from "../job-pool/pool-role-discovery";
import type { SemanticInvestigationPlan } from "../job-pool/relation-cache";
import { SEMANTIC_ROLES_HARD_CAP } from "../job-pool/semantic-limits";

/**
 * Role discovery, the read (owner "OWNER_DECISION_ROLE_DISCOVERY" D-RD-1 = B; GELB stage 2, RD-READ). GET only:
 *
 *   GET /api/career/analyses/{analysisId}/role-discovery?jobPoolUploadId=A&jobPoolUploadId=B   (POOL_ROLE_DISCOVERY_V1)
 *
 * Read only for a PERSON analysis on view and the pools the user released (never "all", never a latest pool). The decoder is strict:
 * a body that is not exactly the contract — its version, its fixed authority (lexical, not semantic, not scored, no ranking, no
 * decision), the analysis and the pools that were asked for, the five status groups in their fixed order, every requirement's
 * semantic NOT_EXECUTED, the semantic plan and the start control — is FAILED, never a partial success. Every refusal of the route has its own state.
 */
type Fetcher = (input: string, init: { method: "GET"; cache: "no-store"; signal?: AbortSignal }) => Promise<{ status: number; json(): Promise<unknown> }>;
const defaultFetcher: Fetcher = (input, init) => fetch(input, init);

export const ROLE_DISCOVERY_STATUSES: readonly RoleLexicalStatus[] = ["ALL_REQUIREMENTS_NAME_RELATED", "PARTIAL_NAME_RELATED", "WEAK_LEXICAL_ONLY", "NO_LEXICAL_RELATION", "NO_REQUIREMENTS"];
const BASES = ["NAME_EXACT", "NAME_ALIAS", "NAME_COMPOSITE_CONSTITUENT", "WEAK_TOKEN_CONTAINMENT", "NONE"];
const AUTHORITY: Record<string, unknown> = { relationBasis: "LEXICAL_NAME_COVERAGE", operand: "PERSON_CAPABILITY_PROPOSAL_PROJECTION", semanticRelationState: "NOT_EXECUTED", scored: false, ranking: false, authorityState: "NONE", decision: false };

/** Beside the plan (GELB 0e03f69): whether an explicit start is configured at all, and the role limit of one start (READY only). */
export type SemanticEngineState = "NOT_CONFIGURED" | "PROVIDER_NOT_AUTHORIZED" | "READY";
export interface RoleDiscoveryStartControl { engineState: SemanticEngineState; maxRoles: number | null }
export type RoleDiscoveryWithPlan = PoolRoleDiscovery & { semanticPlan: SemanticInvestigationPlan; startControl: RoleDiscoveryStartControl };

export type RoleDiscoveryState =
  | { state: "IDLE" }
  | { state: "LOADING" }
  | { state: "AVAILABLE"; discovery: RoleDiscoveryWithPlan }
  /** 409: the analysis is not a PERSON analysis (PERSON × JOB proposals were named for one role). */
  | { state: "NOT_PERSON" }
  /** 409: no scope-free capability proposal projection for this analysis. */
  | { state: "PROJECTION_ABSENT" }
  | { state: "BOUNDARY_UNRESOLVED"; reason: string | null }
  | { state: "ANALYSIS_NOT_FOUND" }
  | { state: "POOL_NOT_FOUND"; jobPoolUploadId: string | null }
  | { state: "POOL_INACTIVE"; jobPoolUploadId: string | null }
  | { state: "POOLS_REQUIRED" }
  | { state: "POOLS_INVALID" }
  | { state: "NOT_PROVISIONED" }
  | { state: "FAILED"; code: string | null };

const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
const isString = (value: unknown): value is string => typeof value === "string";
const isCount = (value: unknown): value is number => typeof value === "number" && Number.isInteger(value) && value >= 0;
const same = (value: unknown, expected: Record<string, unknown>) => isRecord(value) && Object.keys(value).length === Object.keys(expected).length && Object.entries(expected).every(([key, item]) => value[key] === item);

/** Strict decoder of POOL_ROLE_DISCOVERY_V1 (+ semanticPlan) for exactly this analysis and these pools. */
export function decodeRoleDiscovery(value: unknown, analysisId: string, pools: readonly string[]): RoleDiscoveryWithPlan | null {
  if (!isRecord(value) || value.discoveryVersion !== "POOL_ROLE_DISCOVERY_V1" || !same(value.authority, AUTHORITY)) return null;
  const analysis = value.analysis;
  if (!isRecord(analysis) || analysis.analysisId !== analysisId || analysis.mode !== "PERSON") return null;
  if (!Array.isArray(value.pools) || value.pools.length !== pools.length || !value.pools.every((pool, at) => isRecord(pool) && pool.jobPoolUploadId === pools[at] && isString(pool.poolName) && isCount(pool.roleCount))) return null;
  if (!Array.isArray(value.proposals) || !value.proposals.every(p => isRecord(p) && isString(p.id) && isString(p.name) && Array.isArray(p.evidence) && p.evidence.every(e => isRecord(e) && isString(e.sourceDocumentId) && isString(e.exactQuote)))) return null;
  const proposalIds = new Set((value.proposals as Array<{ id: string }>).map(p => p.id));
  if (!Array.isArray(value.roles)) return null;
  const roleKeys = new Set<string>();
  for (const role of value.roles) {
    if (!isRecord(role) || !isRecord(role.key) || !isString(role.key.jobPoolUploadId) || !isString(role.key.poolRoleId) || !isString(role.title) || !isString(role.organizationName)) return null;
    if (!ROLE_DISCOVERY_STATUSES.includes(role.status as RoleLexicalStatus) || !isRecord(role.semantic) || role.semantic.state !== "NOT_EXECUTED" || !isRecord(role.counts) || !Array.isArray(role.requirements)) return null;
    if (!pools.includes(role.key.jobPoolUploadId)) return null;
    for (const requirement of role.requirements) {
      if (!isRecord(requirement) || !isRecord(requirement.key) || !isString(requirement.requirementText) || !isRecord(requirement.lexical) || !isRecord(requirement.semantic) || requirement.semantic.state !== "NOT_EXECUTED") return null;
      const lexical = requirement.lexical;
      if (!BASES.includes(lexical.basis as string)) return null;
      if (lexical.basis === "NONE" ? lexical.proposalId !== null : !isString(lexical.proposalId) || !proposalIds.has(lexical.proposalId) || typeof lexical.quoteNamesRequirement !== "boolean" || !Array.isArray(lexical.evidence)) return null;
    }
    roleKeys.add(`${role.key.jobPoolUploadId}\u0000${role.key.poolRoleId}`);
  }
  if (!Array.isArray(value.groups) || value.groups.length !== ROLE_DISCOVERY_STATUSES.length || !value.groups.every((group, at) => isRecord(group) && group.status === ROLE_DISCOVERY_STATUSES[at] && Array.isArray(group.roles) && group.roles.every(key => isRecord(key) && roleKeys.has(`${key.jobPoolUploadId}\u0000${key.poolRoleId}`)))) return null;
  if (!isSemanticPlan(value.semanticPlan, value.roles as Array<{ key: { jobPoolUploadId: string; poolRoleId: string } }>)) return null;
  if (!isStartControl(value.startControl, value.semanticPlan as SemanticInvestigationPlan)) return null;
  return value as unknown as RoleDiscoveryWithPlan;
}

/**
 * RD-PLAN: the semantic plan exactly in one of the four forms of SemanticInvestigationPlan (lib/career/job-pool/relation-cache.ts),
 * one entry per discovered role in the discovery's order, its numbers adding up:
 *   ENGINE_NOT_SPECIFIED — no engine; nothing cached (0), every pair pending; not executable; no cache issue.
 *   PLANNED              — an engine; the cache read: cached + pending = pairs; executable; no cache issue.
 *   CACHE_UNAVAILABLE / CACHE_CORRUPT — an engine, the cache not trusted: cached / pending / calls unknown (null, never guessed),
 *                          per role too; not executable; the cache issue named.
 * Anything else (another state, a guessed number under a cache failure, a ranking) is not this contract.
 */
function isSemanticPlan(plan: unknown, roles: Array<{ key: { jobPoolUploadId: string; poolRoleId: string } }>): boolean {
  if (!isRecord(plan) || plan.cacheVersion !== "PROPOSAL_REQUIREMENT_RELATION_CACHE_V1" || !isCount(plan.pairs) || !Array.isArray(plan.roles) || plan.roles.length !== roles.length) return false;
  const allowed = ["cacheVersion", "engineVersionHash", "state", "executable", "cacheIssue", "pairs", "cachedPairs", "pendingPairs", "callsNeeded", "roles"];
  if (Object.keys(plan).some(key => !allowed.includes(key))) return false;
  const known = plan.state === "ENGINE_NOT_SPECIFIED" || plan.state === "PLANNED";
  const failed = plan.state === "CACHE_UNAVAILABLE" || plan.state === "CACHE_CORRUPT";
  if (!known && !failed) return false;
  if (plan.state === "ENGINE_NOT_SPECIFIED" ? plan.engineVersionHash !== null : !isString(plan.engineVersionHash)) return false;
  if (plan.executable !== (plan.state === "PLANNED")) return false;
  if (failed ? !isString(plan.cacheIssue) : plan.cacheIssue !== null) return false;
  const counts = (pairs: unknown, cached: unknown, pending: unknown) => known
    ? isCount(pairs) && isCount(cached) && isCount(pending) && cached + pending === pairs && (plan.state === "PLANNED" || cached === 0)
    : isCount(pairs) && cached === null && pending === null;
  if (!counts(plan.pairs, plan.cachedPairs, plan.pendingPairs) || (known ? !isCount(plan.callsNeeded) : plan.callsNeeded !== null)) return false;
  let pairs = 0;
  const entries = plan.roles as unknown[];
  for (let at = 0; at < entries.length; at += 1) {
    const entry = entries[at];
    if (!isRecord(entry) || entry.jobPoolUploadId !== roles[at].key.jobPoolUploadId || entry.poolRoleId !== roles[at].key.poolRoleId || !counts(entry.pairs, entry.cachedPairs, entry.pendingPairs)) return false;
    pairs += entry.pairs as number;
  }
  return pairs === plan.pairs;
}

/**
 * RI-CONTROL: the start control exactly — READY names an engine (the plan is not ENGINE_NOT_SPECIFIED) and a role limit 1 … 25;
 * NOT_CONFIGURED and PROVIDER_NOT_AUTHORIZED name none (the plan has no engine, the limit is null). No provider name, no other key.
 */
function isStartControl(control: unknown, plan: SemanticInvestigationPlan): boolean {
  if (!isRecord(control) || Object.keys(control).length !== 2 || !("maxRoles" in control)) return false;
  if (control.engineState === "READY") return plan.state !== "ENGINE_NOT_SPECIFIED" && isCount(control.maxRoles) && control.maxRoles >= 1 && control.maxRoles <= SEMANTIC_ROLES_HARD_CAP;
  return (control.engineState === "NOT_CONFIGURED" || control.engineState === "PROVIDER_NOT_AUTHORIZED") && control.maxRoles === null && plan.state === "ENGINE_NOT_SPECIFIED";
}

export function roleDiscoveryUrl(analysisId: string, pools: readonly string[]): string {
  return `/api/career/analyses/${encodeURIComponent(analysisId)}/role-discovery?${pools.map(id => `jobPoolUploadId=${encodeURIComponent(id)}`).join("&")}`;
}

export async function readRoleDiscovery(analysisId: string, pools: readonly string[], fetcher: Fetcher = defaultFetcher, signal?: AbortSignal): Promise<RoleDiscoveryState> {
  let response, body: unknown = null;
  try { response = await fetcher(roleDiscoveryUrl(analysisId, pools), { method: "GET", cache: "no-store", signal }); } catch { return { state: "FAILED", code: null }; }
  try { body = await response.json(); } catch { /* an undecodable body is FAILED below */ }
  const issue = isRecord(body) && Array.isArray(body.issues) && isRecord(body.issues[0]) ? body.issues[0] : null;
  const code = isString(issue?.code) ? issue.code : null;
  const pool = isString(issue?.jobPoolUploadId) ? issue.jobPoolUploadId : null;
  if (response.status === 200) {
    const discovery = isRecord(body) && body.success === true ? decodeRoleDiscovery(body.discovery, analysisId, pools) : null;
    return discovery === null ? { state: "FAILED", code: null } : { state: "AVAILABLE", discovery };
  }
  if (code === "ERR_ROLE_DISCOVERY_OPERAND_NOT_PERSON") return { state: "NOT_PERSON" };
  if (code === "ERR_ROLE_DISCOVERY_PROJECTION_ABSENT") return { state: "PROJECTION_ABSENT" };
  if (code === "ERR_ROLE_DISCOVERY_BOUNDARY_UNRESOLVED") return { state: "BOUNDARY_UNRESOLVED", reason: isString(issue?.reason) ? issue.reason : null };
  if (code === "ERR_ROLE_DISCOVERY_ANALYSIS_NOT_FOUND") return { state: "ANALYSIS_NOT_FOUND" };
  if (code === "ERR_ROLE_DISCOVERY_POOL_NOT_FOUND") return { state: "POOL_NOT_FOUND", jobPoolUploadId: pool };
  if (code === "ERR_ROLE_DISCOVERY_POOL_INACTIVE") return { state: "POOL_INACTIVE", jobPoolUploadId: pool };
  if (code === "ERR_ROLE_DISCOVERY_POOLS_REQUIRED") return { state: "POOLS_REQUIRED" };
  if (code === "ERR_ROLE_DISCOVERY_POOLS_INVALID") return { state: "POOLS_INVALID" };
  if (response.status === 503 && code === "ERR_JOB_POOL_PERSISTENCE_NOT_PROVISIONED") return { state: "NOT_PROVISIONED" };
  return { state: "FAILED", code };
}

/** The read for the analysis on view and the released pools; nothing without both. A change discards, aborts and drops a late answer. */
export function useRoleDiscovery(analysisId: string | null, pools: readonly string[] | null, fetcher?: Fetcher, revision = 0): RoleDiscoveryState {
  // RI-START: `revision` is the user's explicit "re-read the plan" (GET again, nothing else changes).
  const key = analysisId === null || pools === null || pools.length === 0 ? null : JSON.stringify([analysisId, ...pools, revision]);
  const [entry, setEntry] = useState<{ key: string | null; value: RoleDiscoveryState }>({ key: null, value: { state: "IDLE" } });
  const generation = useRef(0);
  useEffect(() => {
    const current = generation.current + 1;
    generation.current = current;
    if (key === null) { setEntry({ key: null, value: { state: "IDLE" } }); return; }
    const controller = new AbortController();
    setEntry({ key, value: { state: "LOADING" } });
    void readRoleDiscovery(analysisId!, pools!, fetcher, controller.signal)
      .catch((): RoleDiscoveryState => ({ state: "FAILED", code: null }))
      .then(value => { if (generation.current === current && !controller.signal.aborted) setEntry({ key, value }); });
    return () => controller.abort();
  }, [key]);
  return entry.key === key ? entry.value : key === null ? { state: "IDLE" } : { state: "LOADING" };
}
