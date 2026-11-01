import { describe, expect, it } from "vitest";
import { buildMappingView, capabilitiesOfProjection, type MappingViewInput } from "../../../lib/career/mapping/view";
import type { CapabilityProposalProjection } from "../../../lib/career/capability-core/projection";
import { CAPS, POOL_A, POOL_B, deepFreeze, isDeepFrozen, lex, rankingOf, sem, shuffled, standardRanking, standardRoles } from "./fixtures";

/** MAPPING_VIEW · phase B: the read-only view of PERSON × JOB. DETERMINISTIC_FIXTURE: no database, no network, no model. */
const input = (patch: Partial<MappingViewInput> = {}): MappingViewInput => ({
  capabilities: CAPS.map(c => ({ ...c })), ranking: standardRanking(), run: { state: "COMPLETED", resumePending: false }, evidenceClass: "STAND_IN", ...patch
});
const couplingOf = (view: ReturnType<typeof buildMappingView>, pool: string, roleId: string, requirementId: string) =>
  view.couplings.find(c => c.role.jobPoolUploadId === pool && c.role.poolRoleId === roleId && c.poolRequirementId === requirementId);

describe("MAP-VIEW · the view of a ranking", () => {
  it("REPRODUCE: pools by name, roles by rank with rank/tier/fit/weightSum, requirements in ring order, couplings, constellation, run, evidence class, no authority", () => {
    const view = buildMappingView(input());
    expect(view.authority).toEqual({ ranking: true, decision: false, authorityState: "NONE" });
    expect(view.evidenceClass).toBe("STAND_IN");
    expect(view.run).toEqual({ state: "COMPLETED", resumePending: false });
    expect(view.empty).toBeNull();
    expect(view.pools).toEqual([{ id: POOL_B, name: "Pool Alpha", roles: 2 }, { id: POOL_A, name: "Pool Beta", roles: 1 }]);
    expect(view.roles.map(r => [r.id.jobPoolUploadId, r.id.poolRoleId, r.rank, r.tier, r.fit, r.weightSum])).toEqual([
      [POOL_A, "role_platform", 1, "SEMANTIC", 4 / 9, 9], [POOL_B, "role_platform", 2, "LEXICAL_ONLY", 0.5, 5], [POOL_B, "role_empty", 3, "LEXICAL_ONLY", null, 0]]);
    const first = view.roles[0];
    expect(first.title).toBe("Platform Engineer");
    // Ring order: REQUIRED, PREFERRED, OPTIONAL, UNKNOWN; heavier first; then id.
    expect(first.requirements.map(q => q.poolRequirementId)).toEqual(["q_go", "q_ts", "q_pg", "q_none"]);
    expect(first.requirements[1]).toEqual({ poolRequirementId: "q_ts", requirementText: "Requirement q_ts", necessity: "REQUIRED", weight: 3, source: "SEMANTIC", state: "EQUIVALENT", value: 1, capabilityKey: "PCAP_TS" });
    expect(view.constellation).toEqual([{ key: "PCAP_K8", name: "Kubernetes" }, { key: "PCAP_PG", name: "PostgreSQL" }, { key: "PCAP_TS", name: "TypeScript" }]);
    // Couplings: one per requirement that names a capability, in role rank then ring order; NONE couples nothing.
    expect(view.couplings.map(c => [c.role.jobPoolUploadId, c.role.poolRoleId, c.poolRequirementId, c.keyStatus])).toEqual([
      [POOL_A, "role_platform", "q_go", "NOT_IN_PERSON"], [POOL_A, "role_platform", "q_ts", "KNOWN"], [POOL_A, "role_platform", "q_pg", "KNOWN"],
      [POOL_B, "role_platform", "q_k8", "KNOWN"], [POOL_B, "role_platform", "q_ts2", "ABSENT"]]);
    expect(couplingOf(view, POOL_A, "role_platform", "q_ts")).toEqual({ role: { jobPoolUploadId: POOL_A, poolRoleId: "role_platform" }, poolRequirementId: "q_ts", source: "SEMANTIC", state: "EQUIVALENT",
      capabilityKey: "PCAP_TS", capabilityName: "TypeScript", keyStatus: "KNOWN", explanation: "Statement q_ts.", evidenceLimitation: "Limitation q_ts.", quotes: [{ sourceDocumentId: "DOC_1", exactQuote: "placeholder quote q_ts" }] });
  });

  it("DATA IDENTITY: the key is taken 1:1 from the requirement; the name is a label only", () => {
    const view = buildMappingView(input());
    for (const role of view.roles) for (const q of role.requirements) {
      const c = couplingOf(view, role.id.jobPoolUploadId, role.id.poolRoleId, q.poolRequirementId);
      if (c) expect(c.capabilityKey, q.poolRequirementId).toBe(q.capabilityKey);
    }
    // A coupling with a known key keeps it even when its label differs from the PERSON name.
    const renamed = buildMappingView(input({ ranking: rankingOf([{ pool: POOL_A, roleId: "r", title: "R", requirements: [sem("q", "REQUIRED", "COVERS", "PCAP_PG", "Postgres (alias label)")] }]) }));
    expect(renamed.couplings[0]).toMatchObject({ capabilityKey: "PCAP_PG", capabilityName: "Postgres (alias label)", keyStatus: "KNOWN" });
  });

  it("INVERSE: an absent key (older payload) stays uncoupled on the key — even when its name equals a PERSON capability's name exactly", () => {
    const view = buildMappingView(input());
    const c = couplingOf(view, POOL_B, "role_platform", "q_ts2")!;
    expect(c.capabilityName).toBe("TypeScript");
    expect(CAPS.some(x => x.name === c.capabilityName)).toBe(true);
    expect([c.capabilityKey, c.keyStatus]).toEqual([null, "ABSENT"]);
    expect(view.roles[1].requirements.find(q => q.poolRequirementId === "q_ts2")!.capabilityKey).toBeNull();
    // An explicit null is the same as absent.
    const explicit = buildMappingView(input({ ranking: rankingOf([{ pool: POOL_A, roleId: "r", title: "R", requirements: [sem("q", "REQUIRED", "COVERS", null, "TypeScript")] }]) }));
    expect([explicit.couplings[0].capabilityKey, explicit.couplings[0].keyStatus]).toEqual([null, "ABSENT"]);
  });

  it("INVERSE: a key that is not among the PERSON capabilities is marked as such, kept as it came, and not resolved to anything", () => {
    const c = couplingOf(buildMappingView(input()), POOL_A, "role_platform", "q_go")!;
    expect([c.capabilityKey, c.keyStatus]).toEqual(["PCAP_GONE", "NOT_IN_PERSON"]);
    // Without any PERSON capability every key is NOT_IN_PERSON.
    expect(buildMappingView(input({ capabilities: [] })).couplings.filter(x => x.capabilityKey !== null).every(x => x.keyStatus === "NOT_IN_PERSON")).toBe(true);
  });

  it("the role id is (jobPoolUploadId, poolRoleId): the same poolRoleId in two pools is two roles, each in its own pool", () => {
    const view = buildMappingView(input());
    const same = view.roles.filter(r => r.id.poolRoleId === "role_platform");
    expect(same.map(r => r.id.jobPoolUploadId)).toEqual([POOL_A, POOL_B]);
    expect(view.pools.find(p => p.id === POOL_A)!.roles).toBe(1);
  });

  it("no ranking: an empty, honest view with its reason; the person's constellation and the run stay", () => {
    const view = buildMappingView(input({ ranking: null, run: { state: "PARTIAL", resumePending: true }, evidenceClass: null }));
    expect(view).toMatchObject({ empty: "NO_RANKING", pools: [], roles: [], couplings: [], evidenceClass: null, run: { state: "PARTIAL", resumePending: true } });
    expect(view.authority.decision).toBe(false);
    expect(view.constellation).toHaveLength(3);
    const none = buildMappingView(input({ ranking: rankingOf([]) }));
    expect([none.empty, none.roles.length, none.pools.length]).toEqual(["NO_ROLES", 0, 2]);
  });

  it("DETERMINISM: shuffled ranks, requirements, pools and capabilities give the same view, byte for byte", () => {
    const once = JSON.stringify(buildMappingView(input()));
    const r = standardRanking();
    const mixed = { ...r, pools: shuffled(r.pools), ranks: shuffled(r.ranks).map(x => ({ ...x, requirements: shuffled(x.requirements) })) };
    expect(JSON.stringify(buildMappingView(input({ ranking: mixed, capabilities: shuffled(CAPS) })))).toBe(once);
    expect(JSON.stringify(buildMappingView(input()))).toBe(once);
  });

  it("READ-ONLY: frozen input is read without a write; the input is unchanged; the view itself is deeply frozen", () => {
    const given = deepFreeze(input());
    const before = JSON.stringify(given);
    const view = buildMappingView(given);
    expect(JSON.stringify(given)).toBe(before);
    expect(isDeepFrozen(view)).toBe(true);
    expect(view.roles[0].requirements).not.toBe(given.ranking!.ranks[0].requirements);
  });

  it("INVERSE: a role of an unknown pool and two PERSON capabilities under one key are refused, not guessed", () => {
    const r = standardRanking();
    expect(() => buildMappingView(input({ ranking: { ...r, pools: r.pools.filter(p => p.jobPoolUploadId === POOL_A) } }))).toThrow(/ERR_MAPPING_VIEW_UNKNOWN_POOL/);
    expect(() => buildMappingView(input({ capabilities: [...CAPS, { key: "PCAP_TS", name: "TypeScript again" }] }))).toThrow(/ERR_MAPPING_VIEW_DUPLICATE_CAPABILITY/);
    const twice = { ...r, ranks: [...r.ranks, { ...r.ranks[0], rank: 4 }] };
    expect(() => buildMappingView(input({ ranking: twice }))).toThrow(/ERR_MAPPING_VIEW_DUPLICATE_ROLE/);
  });

  it("the run state of every kind is carried as it is, and the requirements' states are untouched", () => {
    for (const state of ["NOT_STARTED", "RUNNING", "STALLED", "FAILED"] as const) expect(buildMappingView(input({ run: { state, resumePending: state === "STALLED" } })).run).toEqual({ state, resumePending: state === "STALLED" });
    const lexical = buildMappingView(input({ ranking: rankingOf([{ pool: POOL_A, roleId: "r", title: "R", requirements: [lex("q", "REQUIRED", "WEAK_TOKEN_CONTAINMENT", "PCAP_TS")] }]) }));
    expect(lexical.roles[0].requirements[0]).toMatchObject({ source: "LEXICAL", state: "WEAK_TOKEN_CONTAINMENT", value: 0, capabilityKey: "PCAP_TS" });
  });
});

describe("MAP-VIEW · the PERSON capabilities, adapted by type only", () => {
  it("CapabilityProposalProjection.capabilities → { key: id, name }; no projection → none", () => {
    const projection = { capabilities: [{ id: "PCAP_TS", name: "TypeScript", domain: null, scope: "ATOMIC" }, { id: "PCAP_PG", name: "PostgreSQL", domain: null, scope: "COMPOSITE" }] } as unknown as CapabilityProposalProjection;
    expect(capabilitiesOfProjection(projection)).toEqual([{ key: "PCAP_TS", name: "TypeScript" }, { key: "PCAP_PG", name: "PostgreSQL" }]);
    expect(capabilitiesOfProjection(null)).toEqual([]);
    expect(standardRoles()).toHaveLength(3);
  });
});
