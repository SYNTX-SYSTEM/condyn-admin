/**
 * PERSON × JOB phase B fixtures: ROLE_RANKING_V1 bodies with and without capabilityKey, built in the backend's own order and held to the
 * client's strict decoder (a fixture the decoder refuses throws here, so no test runs on a shape the system cannot produce). Quotes are
 * invented placeholders, never CV text. Every builder returns a fresh object.
 */
import { decodeRoleRanking, type RankedRequirement, type RankedRole, type RoleRanking } from "../../../lib/career/ui/auto-match";
import { formula } from "../auto-capability/fixtures";

export const ANALYSIS = "CAN_00000000000000000000000000000002";
export const POOL_A = "JPOOL_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
export const POOL_B = "JPOOL_BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB";
export const POOL_NAMES: Record<string, string> = { [POOL_A]: "Pool Beta", [POOL_B]: "Pool Alpha" };
/** The PERSON proposals (CapabilityProposalProjection.capabilities id / name). */
export const CAPS = [{ key: "PCAP_TS", name: "TypeScript" }, { key: "PCAP_PG", name: "PostgreSQL" }, { key: "PCAP_K8", name: "Kubernetes" }];

type N = RankedRequirement["necessity"];
const WEIGHT: Record<N, number> = { REQUIRED: 3, PREFERRED: 2, OPTIONAL: 1, UNKNOWN: 1 };
const SEMANTIC_VALUE = { EQUIVALENT: 1, COVERS: 1, PARTIAL: 0.5, DIFFERENT: 0, UNCLEAR: 0 } as const;
const LEXICAL_VALUE = { NAME_EXACT: 0.5, NAME_ALIAS: 0.5, NAME_COMPOSITE_CONSTITUENT: 0, WEAK_TOKEN_CONTAINMENT: 0, NONE: 0 } as const;
const quote = (id: string) => [{ sourceDocumentId: "DOC_1", exactQuote: `placeholder quote ${id}` }];
/** key: a text or null is sent; undefined is an older payload without the field. */
type Key = string | null | undefined;
const withKey = (r: Omit<RankedRequirement, "capabilityKey">, key: Key): RankedRequirement => (key === undefined ? { ...r } : { ...r, capabilityKey: key });

export function sem(id: string, necessity: N, state: keyof typeof SEMANTIC_VALUE, key: Key, name = `Capability ${id}`): RankedRequirement {
  const weight = WEIGHT[necessity], value = SEMANTIC_VALUE[state];
  return withKey({ poolRequirementId: id, requirementText: `Requirement ${id}`, necessity, weight, source: "SEMANTIC", state, value, contribution: weight * value,
    capabilityName: name, explanation: `Statement ${id}.`, evidenceLimitation: `Limitation ${id}.`, quotes: state === "DIFFERENT" || state === "UNCLEAR" ? [] : quote(id) }, key);
}
export function lex(id: string, necessity: N, basis: keyof typeof LEXICAL_VALUE, key: Key, name = `Capability ${id}`): RankedRequirement {
  const weight = WEIGHT[necessity], value = LEXICAL_VALUE[basis], none = basis === "NONE";
  return withKey({ poolRequirementId: id, requirementText: `Requirement ${id}`, necessity, weight, source: none ? "NONE" : "LEXICAL", state: basis, value, contribution: weight * value,
    capabilityName: none ? null : name, explanation: null, evidenceLimitation: null, quotes: none ? [] : quote(id) }, none ? (key === undefined ? undefined : null) : key);
}

export interface RoleSpec { pool: string; roleId: string; title: string; requirements: RankedRequirement[] }
export function rankingOf(roles: RoleSpec[], patch: Partial<RoleRanking> = {}): RoleRanking {
  const built = roles.map(r => {
    const weights = r.requirements.reduce((n, q) => n + q.weight, 0);
    const fit = r.requirements.length === 0 ? null : r.requirements.reduce((n, q) => n + q.contribution, 0) / weights;
    const evaluated = r.requirements.filter(q => q.source === "SEMANTIC").length;
    return { tier: evaluated > 0 ? "SEMANTIC" as const : "LEXICAL_ONLY" as const, fit, requiredGaps: r.requirements.filter(q => q.necessity === "REQUIRED" && q.value === 0).length,
      role: { jobPoolUploadId: r.pool, poolRoleId: r.roleId, title: r.title, organizationName: `Org of ${r.title}`, poolName: POOL_NAMES[r.pool] },
      semanticCoverage: { evaluated, total: r.requirements.length }, requirements: r.requirements.map(q => ({ ...q, quotes: q.quotes.map(x => ({ ...x })) })) };
  });
  const text = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
  built.sort((a, b) => (a.tier === b.tier ? 0 : a.tier === "SEMANTIC" ? -1 : 1) || (a.fit === null ? 1 : 0) - (b.fit === null ? 1 : 0) || (b.fit ?? 0) - (a.fit ?? 0)
    || a.requiredGaps - b.requiredGaps || text(a.role.title, b.role.title) || text(a.role.jobPoolUploadId, b.role.jobPoolUploadId) || text(a.role.poolRoleId, b.role.poolRoleId));
  const ranks: RankedRole[] = built.map((r, at) => ({ rank: at + 1, ...r }));
  const pools = [POOL_A, POOL_B].map(id => ({ jobPoolUploadId: id, poolName: POOL_NAMES[id] }));
  const body: RoleRanking = { rankingVersion: "ROLE_RANKING_V1", authority: { ranking: true, decision: false, authorityState: "NONE" }, analysisId: ANALYSIS,
    evidenceClass: ranks.some(r => r.tier === "SEMANTIC") ? "STAND_IN" : null, pools, poolsDropped: [], formula: formula(), counts: { pools: 2, roles: ranks.length, ranked: ranks.length }, ranks, ...patch };
  const decoded = decodeRoleRanking(JSON.parse(JSON.stringify(body)), ANALYSIS);
  if (decoded === null) throw new Error("fixture refused by decodeRoleRanking");
  return decoded;
}

/** Three roles in two pools: a checked role with known, foreign and absent keys; a name-only role; the same poolRoleId in the other pool. */
export const standardRoles = (): RoleSpec[] => [
  { pool: POOL_A, roleId: "role_platform", title: "Platform Engineer", requirements: [
    sem("q_ts", "REQUIRED", "EQUIVALENT", "PCAP_TS", "TypeScript"), sem("q_pg", "PREFERRED", "PARTIAL", "PCAP_PG", "PostgreSQL"),
    sem("q_go", "REQUIRED", "DIFFERENT", "PCAP_GONE", "Go"), lex("q_none", "OPTIONAL", "NONE", null)] },
  { pool: POOL_B, roleId: "role_platform", title: "Platform Engineer", requirements: [
    lex("q_k8", "REQUIRED", "NAME_EXACT", "PCAP_K8", "Kubernetes"), lex("q_ts2", "PREFERRED", "NAME_ALIAS", undefined, "TypeScript")] },
  { pool: POOL_B, roleId: "role_empty", title: "Unspecified Role", requirements: [] }
];
export const standardRanking = () => rankingOf(standardRoles());

export function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.freeze(value); for (const item of Object.values(value)) deepFreeze(item); }
  return value;
}
export function isDeepFrozen(value: unknown): boolean {
  if (!value || typeof value !== "object") return true;
  return Object.isFrozen(value) && Object.values(value).every(isDeepFrozen);
}
/** A stable permutation (reverse, then rotate by one) — no randomness. */
export const shuffled = <T,>(items: readonly T[]): T[] => { const r = [...items].reverse(); return r.length > 1 ? [...r.slice(1), r[0]] : r; };
