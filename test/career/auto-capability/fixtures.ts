/**
 * AUTO_CAPABILITY fixtures (GELB §3.5, shapes confirmed 2026-10-30): one auto-match body per run state and one ROLE_RANKING_V1 body
 * — two SEMANTIC roles, two LEXICAL_ONLY roles (one without requirements, at the tier's end). Quotes are invented placeholders,
 * never CV text. Every builder returns a fresh object, so a test can break exactly one field.
 */
import type { AutoMatchRunState } from "../../../lib/career/ui/auto-match";

export const ANALYSIS = "CAN_00000000000000000000000000000001";
export const POOL_A = "JPOOL_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
export const POOL_B = "JPOOL_BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB";
export const RINV = "RINV_0123456789ABCDEF0123456789ABCDEF";
export const POOLS = [{ jobPoolUploadId: POOL_A, poolName: "Pool Alpha" }, { jobPoolUploadId: POOL_B, poolName: "Pool Beta" }];
const T0 = "2026-10-30T10:00:00.000Z", T1 = "2026-10-30T10:01:30.000Z";
const TP = "2026-10-30T10:00:40.000Z", TL = "2026-10-30T10:01:10.000Z";
/** The three-point fields (GELB backend/three-point): no run → no lease; a first run is revision 0; callsUsed null = not registered. */
const unsynced = { revision: 0, lastProgressAt: null, leaseExpiresAt: null };
const budgetOf = (rolesPlanned: number, rolesEvaluated: number, callsLimit: number) => ({ rolesPlanned, rolesEvaluated, callsLimit, callsUsed: null, callsJobLimit: null });

export function autoMatch(state: AutoMatchRunState, patch: Record<string, unknown> = {}): Record<string, unknown> {
  const base: Record<AutoMatchRunState, Record<string, unknown>> = {
    NOT_STARTED: { state, reason: null, evidenceClass: null, pools: [], budget: null, investigationId: null, startedAt: null, finishedAt: null, ...unsynced },
    DISABLED: { state, reason: "SEMANTIC_NOT_CONFIGURED", evidenceClass: null, pools: [], budget: null, investigationId: null, startedAt: null, finishedAt: T1, ...unsynced },
    RUNNING: { state, reason: null, evidenceClass: "STAND_IN", pools: POOLS.map(p => ({ ...p })), budget: budgetOf(4, 1, 25), investigationId: RINV, startedAt: T0, finishedAt: null, revision: 0, lastProgressAt: TP, leaseExpiresAt: T1 },
    STALLED: { state, reason: "WORKER_LOST", evidenceClass: "STAND_IN", pools: POOLS.map(p => ({ ...p })), budget: budgetOf(4, 2, 25), investigationId: RINV, startedAt: T0, finishedAt: null, revision: 0, lastProgressAt: TP, leaseExpiresAt: TL },
    COMPLETED: { state, reason: null, evidenceClass: "STAND_IN", pools: POOLS.map(p => ({ ...p })), budget: budgetOf(4, 4, 25), investigationId: RINV, startedAt: T0, finishedAt: T1, revision: 0, lastProgressAt: T1, leaseExpiresAt: null },
    PARTIAL: { state, reason: "ROLES_BEYOND_BUDGET", evidenceClass: "STAND_IN", pools: POOLS.map(p => ({ ...p })), budget: budgetOf(2, 2, 2), investigationId: RINV, startedAt: T0, finishedAt: T1, revision: 0, lastProgressAt: T1, leaseExpiresAt: null },
    FAILED: { state, reason: "ERR_SEMANTIC_PROVIDER_FAILED", evidenceClass: "STAND_IN", pools: POOLS.map(p => ({ ...p })), budget: null, investigationId: null, startedAt: T0, finishedAt: T1, ...unsynced },
    SKIPPED: { state, reason: "NO_ACTIVE_POOLS", evidenceClass: null, pools: [], budget: null, investigationId: null, startedAt: null, finishedAt: T1, ...unsynced }
  };
  return { ...base[state], ...patch };
}
/** The same run as an answer from before the three-point contract: no revision/progress/lease, a budget without its calls. */
export function legacyAutoMatch(state: AutoMatchRunState, patch: Record<string, unknown> = {}): Record<string, unknown> {
  const { revision: _r, lastProgressAt: _p, leaseExpiresAt: _l, ...rest } = autoMatch(state);
  const budget = rest.budget as Record<string, unknown> | null;
  const old = budget === null ? null : { rolesPlanned: budget.rolesPlanned, rolesEvaluated: budget.rolesEvaluated, callsLimit: budget.callsLimit };
  return { ...rest, budget: old, ...patch };
}
export const autoMatchBody = (state: AutoMatchRunState, patch: Record<string, unknown> = {}) => ({ success: true, autoMatch: autoMatch(state, patch) });

const quote = (n: number) => [{ sourceDocumentId: "DOC_1", exactQuote: `placeholder quote ${n}` }];
export function semantic(id: string, necessity: "REQUIRED" | "PREFERRED" | "OPTIONAL" | "UNKNOWN", state: "EQUIVALENT" | "COVERS" | "PARTIAL" | "DIFFERENT" | "UNCLEAR"): Record<string, unknown> {
  const weight = { REQUIRED: 3, PREFERRED: 2, OPTIONAL: 1, UNKNOWN: 1 }[necessity];
  const value = { EQUIVALENT: 1, COVERS: 1, PARTIAL: 0.5, DIFFERENT: 0, UNCLEAR: 0 }[state];
  return { poolRequirementId: id, requirementText: `Requirement ${id}`, necessity, weight, source: "SEMANTIC", state, value, contribution: weight * value,
    capabilityName: `Capability ${id}`, explanation: `Explanation for ${id}.`, evidenceLimitation: `Limitation for ${id}.`, quotes: state === "DIFFERENT" || state === "UNCLEAR" ? [] : quote(1) };
}
export function lexical(id: string, necessity: "REQUIRED" | "PREFERRED" | "OPTIONAL" | "UNKNOWN", state: "NAME_EXACT" | "NAME_ALIAS" | "NAME_COMPOSITE_CONSTITUENT" | "WEAK_TOKEN_CONTAINMENT" | "NONE"): Record<string, unknown> {
  const weight = { REQUIRED: 3, PREFERRED: 2, OPTIONAL: 1, UNKNOWN: 1 }[necessity];
  const value = state === "NAME_EXACT" || state === "NAME_ALIAS" ? 0.5 : 0;
  return { poolRequirementId: id, requirementText: `Requirement ${id}`, necessity, weight, source: state === "NONE" ? "NONE" : "LEXICAL", state, value, contribution: weight * value,
    capabilityName: state === "NONE" ? null : `Capability ${id}`, explanation: null, evidenceLimitation: null, quotes: state === "NONE" ? [] : quote(2) };
}
function rank(n: number, pool: number, roleId: string, title: string, requirements: Array<Record<string, unknown>>): Record<string, unknown> {
  const weights = requirements.reduce((sum, r) => sum + (r.weight as number), 0);
  const fit = requirements.length === 0 ? null : requirements.reduce((sum, r) => sum + (r.contribution as number), 0) / weights;
  const evaluated = requirements.filter(r => r.source === "SEMANTIC").length;
  return {
    rank: n, tier: evaluated > 0 ? "SEMANTIC" : "LEXICAL_ONLY",
    role: { jobPoolUploadId: POOLS[pool].jobPoolUploadId, poolRoleId: roleId, title, organizationName: `Org of ${title}`, poolName: POOLS[pool].poolName },
    fit, requiredGaps: requirements.filter(r => r.necessity === "REQUIRED" && r.value === 0).length, semanticCoverage: { evaluated, total: requirements.length }, requirements
  };
}
/** The backend's published formula (lib/career/job-pool/role-ranking.ts ROLE_RANKING_FORMULA, GELB 1325f7a), as it is sent. */
export const formula = () => ({
  semanticValue: { EQUIVALENT: 1, COVERS: 1, PARTIAL: 0.5, DIFFERENT: 0, UNCLEAR: 0 },
  lexicalValue: { NAME_EXACT: 0.5, NAME_ALIAS: 0.5, NAME_COMPOSITE_CONSTITUENT: 0, WEAK_TOKEN_CONTAINMENT: 0 },
  necessityWeight: { REQUIRED: 3, PREFERRED: 2, OPTIONAL: 1, UNKNOWN: 1 },
  requirement: "contribution = weight × value", fit: "fit = Σ(weight × value) / Σ(weight)", order: "tier, fit, gaps, title, ids"
});
export function ranking(patch: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    rankingVersion: "ROLE_RANKING_V1", authority: { ranking: true, decision: false, authorityState: "NONE" }, analysisId: ANALYSIS, evidenceClass: "STAND_IN",
    pools: POOLS.map(p => ({ ...p })), poolsDropped: [], formula: formula(), counts: { pools: 2, roles: 4, ranked: 4 },
    ranks: [
      // fit (3·1 + 2·0.5) / 5 = 0.8
      rank(1, 0, "role_platform", "Platform Engineer", [semantic("r1", "REQUIRED", "EQUIVALENT"), semantic("r2", "PREFERRED", "PARTIAL")]),
      // fit (3·0 + 1·0.5) / 4 = 0.125 — semantic on one requirement, lexical on the other
      rank(2, 1, "role_data", "Data Engineer", [semantic("r3", "REQUIRED", "DIFFERENT"), lexical("r4", "OPTIONAL", "NAME_ALIAS")]),
      // fit (3·0.5 + 3·0) / 6 = 0.25
      rank(3, 1, "role_ops", "Operations Lead", [lexical("r5", "REQUIRED", "NAME_EXACT"), lexical("r6", "REQUIRED", "NONE")]),
      rank(4, 0, "role_empty", "Unspecified Role", [])
    ],
    ...patch
  };
}
export const rankingBody = (patch: Record<string, unknown> = {}) => ({ success: true, ranking: ranking(patch) });
