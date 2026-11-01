import type { CapabilityProposalProjection } from "../capability-core/projection";
import type { AutoMatchRunState, EvidenceClass, Necessity, RankedRequirement, RoleRanking } from "../ui/auto-match";

/**
 * PERSON × JOB mapping, phase B · the view model (docs/architecture/decision-fields/PERSON_X_JOB_MAPPING_SPEC.md). It owns no entity
 * (B-5): capabilities come from PERSON, roles and requirements from the ranking. It reads only (B-7) and claims no decision (B-6).
 *
 * Data identity: a coupling rests on `capabilityKey`, taken 1:1 from the ranking. An absent key (an older payload) is null and stays
 * uncoupled on the key; the capability's name is a label only and never couples anything, even when it equals a PERSON name. A key
 * that is not among the PERSON capabilities is kept and marked as such. Pure and deterministic: the inputs are never written, any
 * order of them gives the same, deeply frozen view.
 */
export interface MappingCapability { readonly key: string; readonly name: string }
export interface MappingRoleId { readonly jobPoolUploadId: string; readonly poolRoleId: string }
/** KNOWN: the key is a PERSON capability; NOT_IN_PERSON: a key none of them carries; ABSENT: no key (null or an older payload). */
export type CouplingKeyStatus = "KNOWN" | "NOT_IN_PERSON" | "ABSENT";
export interface MappingRequirement {
  readonly poolRequirementId: string;
  readonly requirementText: string;
  readonly necessity: Necessity;
  readonly weight: number;
  readonly source: RankedRequirement["source"];
  readonly state: RankedRequirement["state"];
  readonly value: number;
  readonly capabilityKey: string | null;
}
export interface MappingRole {
  readonly id: MappingRoleId;
  readonly title: string;
  readonly organizationName: string;
  readonly rank: number;
  readonly tier: "SEMANTIC" | "LEXICAL_ONLY";
  readonly fit: number | null;
  readonly weightSum: number;
  /** In ring order: REQUIRED, PREFERRED, OPTIONAL, UNKNOWN, then heavier first, then id. */
  readonly requirements: readonly MappingRequirement[];
}
/** Requirement → capability, one per requirement that names a capability (a NONE requirement couples nothing). */
export interface MappingCoupling {
  readonly role: MappingRoleId;
  readonly poolRequirementId: string;
  readonly source: RankedRequirement["source"];
  readonly state: RankedRequirement["state"];
  readonly capabilityKey: string | null;
  /** A label only. */
  readonly capabilityName: string;
  readonly keyStatus: CouplingKeyStatus;
  readonly explanation: string | null;
  readonly evidenceLimitation: string | null;
  readonly quotes: readonly { readonly sourceDocumentId: string; readonly exactQuote: string }[];
}
export interface MappingPool { readonly id: string; readonly name: string; readonly roles: number }
export interface MappingRun { readonly state: AutoMatchRunState; readonly resumePending: boolean }
export interface MappingView {
  readonly viewVersion: "MAPPING_VIEW_V1";
  readonly authority: { readonly ranking: true; readonly decision: false; readonly authorityState: "NONE" };
  readonly evidenceClass: EvidenceClass | null;
  readonly run: MappingRun;
  /** Why nothing is mapped: no ranking was read, or the ranking holds no role. null when there are roles. */
  readonly empty: "NO_RANKING" | "NO_ROLES" | null;
  /** By pool name, then id. */
  readonly pools: readonly MappingPool[];
  /** By rank. */
  readonly roles: readonly MappingRole[];
  /** By role rank, then ring order. */
  readonly couplings: readonly MappingCoupling[];
  /** The person's capabilities, by name then key (the constellation's order). */
  readonly constellation: readonly MappingCapability[];
}
export interface MappingViewInput {
  capabilities: readonly MappingCapability[];
  ranking: RoleRanking | null;
  run: MappingRun;
  evidenceClass: EvidenceClass | null;
}

const NECESSITY_ORDER: readonly Necessity[] = ["REQUIRED", "PREFERRED", "OPTIONAL", "UNKNOWN"];
const byText = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
const roleKey = (id: MappingRoleId) => `${id.jobPoolUploadId}\u0000${id.poolRoleId}`;

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) { for (const item of Object.values(value)) deepFreeze(item); Object.freeze(value); }
  return value;
}

/** The PERSON capabilities of an analysis, adapted by type only: a proposal's id is its key. */
export function capabilitiesOfProjection(projection: CapabilityProposalProjection | null): MappingCapability[] {
  return projection === null ? [] : projection.capabilities.map(capability => ({ key: capability.id, name: capability.name }));
}

export function buildMappingView(input: MappingViewInput): MappingView {
  const constellation = [...input.capabilities].sort((a, b) => byText(a.name, b.name) || byText(a.key, b.key)).map(c => ({ key: c.key, name: c.name }));
  const personKeys = new Set<string>();
  for (const c of constellation) { if (personKeys.has(c.key)) throw new Error(`ERR_MAPPING_VIEW_DUPLICATE_CAPABILITY:${c.key}`); personKeys.add(c.key); }
  const head = {
    viewVersion: "MAPPING_VIEW_V1" as const, authority: { ranking: true as const, decision: false as const, authorityState: "NONE" as const },
    evidenceClass: input.evidenceClass, run: { state: input.run.state, resumePending: input.run.resumePending }
  };
  if (input.ranking === null) return deepFreeze({ ...head, empty: "NO_RANKING" as const, pools: [], roles: [], couplings: [], constellation });

  const pools = [...input.ranking.pools].sort((a, b) => byText(a.poolName, b.poolName) || byText(a.jobPoolUploadId, b.jobPoolUploadId));
  const poolIds = new Set(pools.map(p => p.jobPoolUploadId));
  const ranks = [...input.ranking.ranks].sort((a, b) => a.rank - b.rank);
  const seen = new Set<string>();
  const roles: MappingRole[] = [];
  const couplings: MappingCoupling[] = [];
  for (const ranked of ranks) {
    const id = { jobPoolUploadId: ranked.role.jobPoolUploadId, poolRoleId: ranked.role.poolRoleId };
    if (!poolIds.has(id.jobPoolUploadId)) throw new Error(`ERR_MAPPING_VIEW_UNKNOWN_POOL:${id.jobPoolUploadId}`);
    if (seen.has(roleKey(id))) throw new Error(`ERR_MAPPING_VIEW_DUPLICATE_ROLE:${id.jobPoolUploadId}/${id.poolRoleId}`);
    seen.add(roleKey(id));
    const ordered = [...ranked.requirements].sort((a, b) => NECESSITY_ORDER.indexOf(a.necessity) - NECESSITY_ORDER.indexOf(b.necessity) || b.weight - a.weight || byText(a.poolRequirementId, b.poolRequirementId));
    const requirements = ordered.map(q => ({ poolRequirementId: q.poolRequirementId, requirementText: q.requirementText, necessity: q.necessity, weight: q.weight,
      source: q.source, state: q.state, value: q.value, capabilityKey: q.capabilityKey ?? null }));
    for (const q of ordered) {
      if (q.capabilityName === null) continue;
      const key = q.capabilityKey ?? null;
      couplings.push({ role: { ...id }, poolRequirementId: q.poolRequirementId, source: q.source, state: q.state, capabilityKey: key, capabilityName: q.capabilityName,
        keyStatus: key === null ? "ABSENT" : personKeys.has(key) ? "KNOWN" : "NOT_IN_PERSON", explanation: q.explanation, evidenceLimitation: q.evidenceLimitation,
        quotes: q.quotes.map(x => ({ sourceDocumentId: x.sourceDocumentId, exactQuote: x.exactQuote })) });
    }
    roles.push({ id, title: ranked.role.title, organizationName: ranked.role.organizationName, rank: ranked.rank, tier: ranked.tier, fit: ranked.fit,
      weightSum: ranked.requirements.reduce((sum, q) => sum + q.weight, 0), requirements });
  }
  const counts = new Map<string, number>();
  for (const role of roles) counts.set(role.id.jobPoolUploadId, (counts.get(role.id.jobPoolUploadId) ?? 0) + 1);
  return deepFreeze({ ...head, empty: roles.length === 0 ? "NO_ROLES" as const : null, pools: pools.map(p => ({ id: p.jobPoolUploadId, name: p.poolName, roles: counts.get(p.jobPoolUploadId) ?? 0 })),
    roles, couplings, constellation });
}
