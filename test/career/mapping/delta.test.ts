import { describe, expect, it } from "vitest";
import { diffRankings, type MappingChange } from "../../../lib/career/mapping/delta";
import type { RoleRanking } from "../../../lib/career/ui/auto-match";
import { POOL_A, POOL_B, deepFreeze, lex, rankingOf, sem, shuffled, standardRanking, standardRoles, type RoleSpec } from "./fixtures";

/** MAPPING_DELTA · the pure difference of two rankings over stable ids. DETERMINISTIC_FIXTURE: no database, no network, no model. */
const mirror = (changes: readonly MappingChange[]) => changes.map(c => ({ ...c, kind: c.kind === "ROLE_ADDED" ? "ROLE_REMOVED" : c.kind === "ROLE_REMOVED" ? "ROLE_ADDED"
  : c.kind === "REQUIREMENT_ADDED" ? "REQUIREMENT_REMOVED" : c.kind === "REQUIREMENT_REMOVED" ? "REQUIREMENT_ADDED" : c.kind, from: c.to, to: c.from }));
const edit = (change: (roles: RoleSpec[]) => void): RoleRanking => { const roles = standardRoles(); change(roles); return rankingOf(roles); };
const kinds = (changes: readonly MappingChange[]) => changes.map(c => [c.kind, c.role.jobPoolUploadId, c.role.poolRoleId, c.poolRequirementId]);

describe("MAP-DELTA · what changed between two reads", () => {
  it("equal readings, also of separately built and shuffled objects, give an empty delta; two nulls too", () => {
    expect(diffRankings(standardRanking(), standardRanking())).toEqual([]);
    const r = standardRanking();
    expect(diffRankings(r, { ...r, ranks: shuffled(r.ranks).map(x => ({ ...x, requirements: shuffled(x.requirements) })) })).toEqual([]);
    expect(diffRankings(null, null)).toEqual([]);
  });

  it("a semantic finding arrives: the requirement's source/state change, the role's fit, tier and rank follow — each its own change", () => {
    const next = edit(roles => { roles[1].requirements[0] = sem("q_k8", "REQUIRED", "COVERS", "PCAP_K8", "Kubernetes"); });
    const changes = diffRankings(standardRanking(), next);
    expect(changes.map(c => c.kind).sort()).toEqual(["REQUIREMENT_STATE_CHANGED", "ROLE_FIT_CHANGED", "ROLE_RANK_CHANGED", "ROLE_RANK_CHANGED", "ROLE_TIER_CHANGED"]);
    expect(changes.find(c => c.kind === "REQUIREMENT_STATE_CHANGED")).toEqual({ kind: "REQUIREMENT_STATE_CHANGED", role: { jobPoolUploadId: POOL_B, poolRoleId: "role_platform" }, poolRequirementId: "q_k8",
      from: { source: "LEXICAL", state: "NAME_EXACT" }, to: { source: "SEMANTIC", state: "COVERS" } });
    expect(changes.find(c => c.kind === "ROLE_FIT_CHANGED")).toMatchObject({ role: { jobPoolUploadId: POOL_B, poolRoleId: "role_platform" }, from: 0.5, to: 0.8 });
    expect(changes.find(c => c.kind === "ROLE_TIER_CHANGED")).toMatchObject({ from: "LEXICAL_ONLY", to: "SEMANTIC" });
    expect(changes.filter(c => c.kind === "ROLE_RANK_CHANGED").map(c => [c.role.jobPoolUploadId, c.from, c.to])).toEqual([[POOL_A, 1, 2], [POOL_B, 2, 1]]);
    // Sorted: role id, then the role's own changes before its requirements', then kind.
    expect(kinds(changes)).toEqual([["ROLE_RANK_CHANGED", POOL_A, "role_platform", null], ["ROLE_RANK_CHANGED", POOL_B, "role_platform", null],
      ["ROLE_TIER_CHANGED", POOL_B, "role_platform", null], ["ROLE_FIT_CHANGED", POOL_B, "role_platform", null], ["REQUIREMENT_STATE_CHANGED", POOL_B, "role_platform", "q_k8"]]);
  });

  it("a key change alone (same state) is a KEY change; absent and null are the same key", () => {
    const next = edit(roles => { roles[0].requirements[1] = sem("q_pg", "PREFERRED", "PARTIAL", "PCAP_K8", "PostgreSQL"); });
    expect(kinds(diffRankings(standardRanking(), next))).toEqual([["REQUIREMENT_KEY_CHANGED", POOL_A, "role_platform", "q_pg"]]);
    expect(diffRankings(standardRanking(), next)[0]).toMatchObject({ from: "PCAP_PG", to: "PCAP_K8" });
    const explicitNull = edit(roles => { roles[1].requirements[1] = lex("q_ts2", "PREFERRED", "NAME_ALIAS", null, "TypeScript"); });
    expect(diffRankings(standardRanking(), explicitNull)).toEqual([]);
    const keyed = edit(roles => { roles[1].requirements[1] = lex("q_ts2", "PREFERRED", "NAME_ALIAS", "PCAP_TS", "TypeScript"); });
    expect(diffRankings(standardRanking(), keyed)).toEqual([{ kind: "REQUIREMENT_KEY_CHANGED", role: { jobPoolUploadId: POOL_B, poolRoleId: "role_platform" }, poolRequirementId: "q_ts2", from: null, to: "PCAP_TS" }]);
  });

  it("a change of the source alone is a state change (NONE/NONE → LEXICAL/NONE, which the decoder admits)", () => {
    const next = edit(roles => { roles[0].requirements[3] = { ...lex("q_none", "OPTIONAL", "NONE", null), source: "LEXICAL" }; });
    expect(diffRankings(standardRanking(), next)).toEqual([{ kind: "REQUIREMENT_STATE_CHANGED", role: { jobPoolUploadId: POOL_A, poolRoleId: "role_platform" }, poolRequirementId: "q_none",
      from: { source: "NONE", state: "NONE" }, to: { source: "LEXICAL", state: "NONE" } }]);
  });

  it("roles and requirements that come and go are named by their stable ids; a ranking that appears is every role added", () => {
    const next = edit(roles => { roles.splice(2, 1); roles[0].requirements.push(lex("q_new", "UNKNOWN", "NONE", null)); roles.push({ pool: POOL_A, roleId: "role_new", title: "New Role", requirements: [] }); });
    const changes = diffRankings(standardRanking(), next);
    expect(changes.filter(c => c.kind.endsWith("ADDED") || c.kind.endsWith("REMOVED"))).toEqual([
      { kind: "ROLE_ADDED", role: { jobPoolUploadId: POOL_A, poolRoleId: "role_new" }, poolRequirementId: null, from: null, to: { rank: 3, tier: "LEXICAL_ONLY", fit: null } },
      { kind: "REQUIREMENT_ADDED", role: { jobPoolUploadId: POOL_A, poolRoleId: "role_platform" }, poolRequirementId: "q_new", from: null, to: { source: "NONE", state: "NONE", capabilityKey: null } },
      { kind: "ROLE_REMOVED", role: { jobPoolUploadId: POOL_B, poolRoleId: "role_empty" }, poolRequirementId: null, from: { rank: 3, tier: "LEXICAL_ONLY", fit: null }, to: null }]);
    expect(diffRankings(null, standardRanking()).map(c => c.kind)).toEqual(["ROLE_ADDED", "ROLE_ADDED", "ROLE_ADDED"]);
    expect(diffRankings(standardRanking(), null).map(c => c.kind)).toEqual(["ROLE_REMOVED", "ROLE_REMOVED", "ROLE_REMOVED"]);
  });

  it("MIRROR: Delta(b, a) is Delta(a, b) with from/to swapped and added/removed exchanged, for every pair of the fixtures", () => {
    const states: Array<RoleRanking | null> = [null, standardRanking(), rankingOf([]),
      edit(roles => { roles[1].requirements[0] = sem("q_k8", "REQUIRED", "COVERS", "PCAP_K8", "Kubernetes"); }),
      edit(roles => { roles.reverse(); roles[0].requirements.push(sem("q_more", "OPTIONAL", "UNCLEAR", "PCAP_TS", "TypeScript")); }),
      edit(roles => { roles[0].requirements[1] = sem("q_pg", "PREFERRED", "PARTIAL", "PCAP_K8", "PostgreSQL"); roles.splice(1, 1); })];
    let compared = 0;
    for (const a of states) for (const b of states) { expect(diffRankings(b, a)).toEqual(mirror(diffRankings(a, b))); compared += 1; }
    expect(compared).toBe(36);
  });

  it("ORDER and PURITY: the output is sorted by role id, then requirement id, then kind; frozen input is read without a write", () => {
    const a = deepFreeze(standardRanking()), b = deepFreeze(edit(roles => { roles.reverse(); roles[2].requirements.push(sem("q_more", "OPTIONAL", "UNCLEAR", "PCAP_TS", "TypeScript")); }));
    const once = diffRankings(a, b);
    expect(diffRankings(a, b)).toEqual(once);
    expect(diffRankings({ ...a, ranks: shuffled(a.ranks) }, { ...b, ranks: shuffled(b.ranks) })).toEqual(once);
    const keys = once.map(c => [c.role.jobPoolUploadId, c.role.poolRoleId, c.poolRequirementId ?? ""].join("\u0000"));
    expect([...keys].sort((x, y) => (x < y ? -1 : x > y ? 1 : 0))).toEqual(keys);
    for (const c of once) expect(Object.keys(c).sort()).toEqual(["from", "kind", "poolRequirementId", "role", "to"]);
  });

  it("INVERSE: a ranking that names one role or one requirement twice is refused", () => {
    const r = standardRanking();
    expect(() => diffRankings(r, { ...r, ranks: [...r.ranks, r.ranks[0]] })).toThrow(/ERR_MAPPING_DELTA_DUPLICATE_ROLE/);
    expect(() => diffRankings({ ...r, ranks: [{ ...r.ranks[0], requirements: [...r.ranks[0].requirements, r.ranks[0].requirements[0]] }] }, null)).toThrow(/ERR_MAPPING_DELTA_DUPLICATE_REQUIREMENT/);
  });
});
