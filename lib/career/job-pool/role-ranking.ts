import type { DiscoveryRequirement, DiscoveryRole, PoolRoleDiscovery } from "./pool-role-discovery";
import type { SemanticRelationState } from "./relation-cache";

/**
 * ROLE_RANKING_V1 — the explainable job ranking (owner mandate AUTOMATED_CAPABILITY_TO_JOB_EXECUTE, 2026-10-30; D-RD-4 superseded).
 * A pure function over the lexical discovery and the stored semantic findings: no database, no network, no model. Nothing in it is
 * hidden: every rank carries, per requirement, the state it rests on, its source, its weight, its value, its contribution, the model
 * statement with its limitation and the source quotes. The ranking is derived from UNVERIFIED model statements and name matches;
 * it is a ranking, never a decision (`decision: false`, `authorityState: "NONE"`).
 */
export const ROLE_RANKING_VERSION = "ROLE_RANKING_V1" as const;

export interface SemanticFinding {
  state: SemanticRelationState; capabilityName: string; explanation: string; evidenceLimitation: string;
  quotes: Array<{ sourceDocumentId: string; exactQuote: string }>;
}

const SEMANTIC_VALUE: Record<SemanticRelationState, number> = { EQUIVALENT: 1, COVERS: 1, PARTIAL: 0.5, DIFFERENT: 0, UNCLEAR: 0 };
const SEMANTIC_ORDER: Record<SemanticRelationState, number> = { EQUIVALENT: 0, COVERS: 1, PARTIAL: 2, DIFFERENT: 3, UNCLEAR: 4 };
const LEXICAL_VALUE: Record<string, number> = { NAME_EXACT: 0.5, NAME_ALIAS: 0.5, NAME_COMPOSITE_CONSTITUENT: 0, WEAK_TOKEN_CONTAINMENT: 0 };
const NECESSITY_WEIGHT = { REQUIRED: 3, PREFERRED: 2, OPTIONAL: 1, UNKNOWN: 1 } as const;
type Necessity = keyof typeof NECESSITY_WEIGHT;

export const ROLE_RANKING_FORMULA = Object.freeze({
  semanticValue: SEMANTIC_VALUE, lexicalValue: LEXICAL_VALUE, necessityWeight: NECESSITY_WEIGHT,
  requirement: "contribution = weight × value; the best semantic relation of all proposals carries the requirement, else the lexical basis (at most 0.5), else 0",
  fit: "fit = Σ(weight × value) / Σ(weight); null for a role without requirements",
  order: "tier SEMANTIC before LEXICAL_ONLY; fit descending (null last); required gaps ascending; title; pool and role id"
} as const);

/** The best of several findings for ONE requirement: highest value; a tie by state (EQUIVALENT, COVERS, PARTIAL), then capability name. */
export function pickBestFinding(candidates: SemanticFinding[]): SemanticFinding | null {
  if (candidates.length === 0) return null;
  return [...candidates].sort((a, b) => SEMANTIC_VALUE[b.state] - SEMANTIC_VALUE[a.state] || SEMANTIC_ORDER[a.state] - SEMANTIC_ORDER[b.state] || (a.capabilityName < b.capabilityName ? -1 : a.capabilityName > b.capabilityName ? 1 : 0))[0];
}

export interface RankedRequirement {
  poolRequirementId: string; requirementText: string; necessity: Necessity; weight: number;
  source: "SEMANTIC" | "LEXICAL" | "NONE"; state: string; value: number; contribution: number;
  capabilityName: string | null; explanation: string | null; evidenceLimitation: string | null;
  quotes: Array<{ sourceDocumentId: string; exactQuote: string }>;
}
export interface RankedRole {
  rank: number; tier: "SEMANTIC" | "LEXICAL_ONLY";
  role: { jobPoolUploadId: string; poolRoleId: string; title: string; organizationName: string; poolName: string };
  fit: number | null; requiredGaps: number; semanticCoverage: { evaluated: number; total: number }; requirements: RankedRequirement[];
}
export interface RoleRanking {
  rankingVersion: typeof ROLE_RANKING_VERSION;
  authority: { ranking: true; decision: false; authorityState: "NONE" };
  analysisId: string; evidenceClass: string | null;
  pools: Array<{ jobPoolUploadId: string; poolName: string }>; poolsDropped: string[];
  formula: typeof ROLE_RANKING_FORMULA;
  counts: { pools: number; roles: number; ranked: number };
  ranks: RankedRole[];
}

const round6 = (n: number) => Math.round(n * 1e6) / 1e6;
const text = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
const necessityOf = (value: string): Necessity => (value === "REQUIRED" || value === "PREFERRED" || value === "OPTIONAL" ? value : "UNKNOWN");

function rankRequirement(requirement: DiscoveryRequirement, finding: SemanticFinding | null): RankedRequirement {
  const necessity = necessityOf(requirement.necessity);
  const weight = NECESSITY_WEIGHT[necessity];
  const base = { poolRequirementId: requirement.key.poolRequirementId, requirementText: requirement.requirementText, necessity, weight };
  if (finding) {
    const value = SEMANTIC_VALUE[finding.state];
    return { ...base, source: "SEMANTIC", state: finding.state, value, contribution: weight * value, capabilityName: finding.capabilityName, explanation: finding.explanation, evidenceLimitation: finding.evidenceLimitation, quotes: finding.quotes.map(q => ({ ...q })) };
  }
  if (requirement.lexical.basis !== "NONE") {
    const value = LEXICAL_VALUE[requirement.lexical.basis] ?? 0;
    return { ...base, source: "LEXICAL", state: requirement.lexical.basis, value, contribution: weight * value, capabilityName: requirement.lexical.proposalName, explanation: null, evidenceLimitation: null, quotes: requirement.lexical.evidence.map(q => ({ ...q })) };
  }
  return { ...base, source: "NONE", state: "NONE", value: 0, contribution: 0, capabilityName: null, explanation: null, evidenceLimitation: null, quotes: [] };
}

function rankRole(role: DiscoveryRole, poolName: string, findingFor: (requirement: DiscoveryRequirement) => SemanticFinding | null): Omit<RankedRole, "rank"> {
  const requirements = role.requirements.map(r => rankRequirement(r, findingFor(r)));
  const weights = requirements.reduce((n, r) => n + r.weight, 0);
  const evaluated = requirements.filter(r => r.source === "SEMANTIC").length;
  return {
    tier: evaluated > 0 ? "SEMANTIC" : "LEXICAL_ONLY",
    role: { jobPoolUploadId: role.key.jobPoolUploadId, poolRoleId: role.key.poolRoleId, title: role.title, organizationName: role.organizationName, poolName },
    fit: weights > 0 ? round6(requirements.reduce((n, r) => n + r.contribution, 0) / weights) : null,
    requiredGaps: requirements.filter(r => r.necessity === "REQUIRED" && r.value === 0).length,
    semanticCoverage: { evaluated, total: requirements.length }, requirements
  };
}

export function buildRoleRanking(input: {
  analysisId: string; discovery: PoolRoleDiscovery; findingFor: (requirement: DiscoveryRequirement) => SemanticFinding | null; evidenceClass: string | null; poolsDropped: string[];
}): RoleRanking {
  const poolNames = new Map(input.discovery.pools.map(p => [p.jobPoolUploadId, p.poolName] as const));
  const unranked = input.discovery.roles.map(r => rankRole(r, poolNames.get(r.key.jobPoolUploadId) ?? r.key.jobPoolUploadId, input.findingFor));
  const tierOrder = { SEMANTIC: 0, LEXICAL_ONLY: 1 } as const;
  unranked.sort((a, b) => tierOrder[a.tier] - tierOrder[b.tier]
    || (a.fit === null ? 1 : 0) - (b.fit === null ? 1 : 0) || (b.fit ?? 0) - (a.fit ?? 0) || a.requiredGaps - b.requiredGaps
    || text(a.role.title, b.role.title) || text(a.role.jobPoolUploadId, b.role.jobPoolUploadId) || text(a.role.poolRoleId, b.role.poolRoleId));
  return {
    rankingVersion: ROLE_RANKING_VERSION, authority: { ranking: true, decision: false, authorityState: "NONE" },
    analysisId: input.analysisId, evidenceClass: input.evidenceClass,
    pools: input.discovery.pools.map(p => ({ jobPoolUploadId: p.jobPoolUploadId, poolName: p.poolName })), poolsDropped: [...input.poolsDropped],
    formula: ROLE_RANKING_FORMULA,
    counts: { pools: input.discovery.pools.length, roles: input.discovery.roles.length, ranked: unranked.length },
    ranks: unranked.map((r, i) => ({ rank: i + 1, ...r }))
  };
}
