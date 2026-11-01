import type { RankedRequirement, RankedRole, RoleRanking } from "../ui/auto-match";
import type { MappingRoleId } from "./view";

/**
 * PERSON × JOB mapping, phase B · the difference between two readings of the ranking: a plain list of state changes over stable ids —
 * a role by (jobPoolUploadId, poolRoleId), a requirement by its poolRequirementId inside its role. No time, no animation parameter,
 * no dependence on the order of the inputs: the list is sorted. Equal readings give an empty list, and Delta(b, a) is Delta(a, b)
 * mirrored (from and to swapped, added and removed exchanged). The capability key is compared as `capabilityKey ?? null`.
 */
export type MappingChangeKind =
  | "ROLE_ADDED" | "ROLE_REMOVED" | "ROLE_RANK_CHANGED" | "ROLE_TIER_CHANGED" | "ROLE_FIT_CHANGED"
  | "REQUIREMENT_ADDED" | "REQUIREMENT_REMOVED" | "REQUIREMENT_STATE_CHANGED" | "REQUIREMENT_KEY_CHANGED";
export interface RoleSummary { rank: number; tier: RankedRole["tier"]; fit: number | null }
export interface RequirementSummary { source: RankedRequirement["source"]; state: RankedRequirement["state"]; capabilityKey: string | null }
export interface RelationState { source: RankedRequirement["source"]; state: RankedRequirement["state"] }
export type MappingChange = { role: MappingRoleId; poolRequirementId: string | null } & (
  | { kind: "ROLE_ADDED"; from: null; to: RoleSummary }
  | { kind: "ROLE_REMOVED"; from: RoleSummary; to: null }
  | { kind: "ROLE_RANK_CHANGED"; from: number; to: number }
  | { kind: "ROLE_TIER_CHANGED"; from: RankedRole["tier"]; to: RankedRole["tier"] }
  | { kind: "ROLE_FIT_CHANGED"; from: number | null; to: number | null }
  | { kind: "REQUIREMENT_ADDED"; from: null; to: RequirementSummary }
  | { kind: "REQUIREMENT_REMOVED"; from: RequirementSummary; to: null }
  | { kind: "REQUIREMENT_STATE_CHANGED"; from: RelationState; to: RelationState }
  | { kind: "REQUIREMENT_KEY_CHANGED"; from: string | null; to: string | null });

/** The order of the kinds inside one role or requirement. An added or removed entry is the only change of its id, so its place never ties. */
const KIND_ORDER: Record<MappingChangeKind, number> = {
  ROLE_ADDED: 0, ROLE_REMOVED: 0, ROLE_RANK_CHANGED: 1, ROLE_TIER_CHANGED: 2, ROLE_FIT_CHANGED: 3,
  REQUIREMENT_ADDED: 4, REQUIREMENT_REMOVED: 4, REQUIREMENT_STATE_CHANGED: 5, REQUIREMENT_KEY_CHANGED: 6
};
const byText = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
const keyOf = (q: RankedRequirement) => q.capabilityKey ?? null;
const roleSummary = (r: RankedRole): RoleSummary => ({ rank: r.rank, tier: r.tier, fit: r.fit });
const requirementSummary = (q: RankedRequirement): RequirementSummary => ({ source: q.source, state: q.state, capabilityKey: keyOf(q) });

function rolesOf(ranking: RoleRanking | null): Map<string, { id: MappingRoleId; role: RankedRole; requirements: Map<string, RankedRequirement> }> {
  const out = new Map<string, { id: MappingRoleId; role: RankedRole; requirements: Map<string, RankedRequirement> }>();
  for (const role of ranking?.ranks ?? []) {
    const id = { jobPoolUploadId: role.role.jobPoolUploadId, poolRoleId: role.role.poolRoleId };
    const key = `${id.jobPoolUploadId}\u0000${id.poolRoleId}`;
    if (out.has(key)) throw new Error(`ERR_MAPPING_DELTA_DUPLICATE_ROLE:${id.jobPoolUploadId}/${id.poolRoleId}`);
    const requirements = new Map<string, RankedRequirement>();
    for (const q of role.requirements) {
      if (requirements.has(q.poolRequirementId)) throw new Error(`ERR_MAPPING_DELTA_DUPLICATE_REQUIREMENT:${id.poolRoleId}/${q.poolRequirementId}`);
      requirements.set(q.poolRequirementId, q);
    }
    out.set(key, { id, role, requirements });
  }
  return out;
}

export function diffRankings(prev: RoleRanking | null, next: RoleRanking | null): MappingChange[] {
  const before = rolesOf(prev), after = rolesOf(next);
  const changes: MappingChange[] = [];
  for (const key of new Set([...before.keys(), ...after.keys()])) {
    const a = before.get(key), b = after.get(key);
    const id = { ...(a ?? b)!.id };
    if (a === undefined) { changes.push({ kind: "ROLE_ADDED", role: id, poolRequirementId: null, from: null, to: roleSummary(b!.role) }); continue; }
    if (b === undefined) { changes.push({ kind: "ROLE_REMOVED", role: id, poolRequirementId: null, from: roleSummary(a.role), to: null }); continue; }
    if (a.role.rank !== b.role.rank) changes.push({ kind: "ROLE_RANK_CHANGED", role: id, poolRequirementId: null, from: a.role.rank, to: b.role.rank });
    if (a.role.tier !== b.role.tier) changes.push({ kind: "ROLE_TIER_CHANGED", role: id, poolRequirementId: null, from: a.role.tier, to: b.role.tier });
    if (a.role.fit !== b.role.fit) changes.push({ kind: "ROLE_FIT_CHANGED", role: id, poolRequirementId: null, from: a.role.fit, to: b.role.fit });
    for (const requirementId of new Set([...a.requirements.keys(), ...b.requirements.keys()])) {
      const x = a.requirements.get(requirementId), y = b.requirements.get(requirementId);
      const at = { role: { ...id }, poolRequirementId: requirementId };
      if (x === undefined) { changes.push({ kind: "REQUIREMENT_ADDED", ...at, from: null, to: requirementSummary(y!) }); continue; }
      if (y === undefined) { changes.push({ kind: "REQUIREMENT_REMOVED", ...at, from: requirementSummary(x), to: null }); continue; }
      if (x.source !== y.source || x.state !== y.state) changes.push({ kind: "REQUIREMENT_STATE_CHANGED", ...at, from: { source: x.source, state: x.state }, to: { source: y.source, state: y.state } });
      if (keyOf(x) !== keyOf(y)) changes.push({ kind: "REQUIREMENT_KEY_CHANGED", ...at, from: keyOf(x), to: keyOf(y) });
    }
  }
  return changes.sort((p, q) => byText(p.role.jobPoolUploadId, q.role.jobPoolUploadId) || byText(p.role.poolRoleId, q.role.poolRoleId)
    || byText(p.poolRequirementId ?? "", q.poolRequirementId ?? "") || KIND_ORDER[p.kind] - KIND_ORDER[q.kind]);
}
