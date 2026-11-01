import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { FOCUS_ACTIONS, FOCUS_INITIAL, focusReduce, reverseView, type FocusAction, type FocusState } from "../../../lib/career/mapping/focus";
import { buildMappingView } from "../../../lib/career/mapping/view";
import { CAPS, POOL_A, POOL_B, rankingOf, sem, standardRanking, standardRoles } from "./fixtures";

/** MAPPING_FOCUS · the pure focus automaton L0 → L3 with selection and reverse view. No navigation, no URL, no effect, no job scope. */
const RA = { jobPoolUploadId: POOL_A, poolRoleId: "role_platform" }, RB = { jobPoolUploadId: POOL_B, poolRoleId: "role_platform" };
const run = (...actions: FocusAction[]) => actions.reduce<FocusState>((s, a) => focusReduce(s, a), FOCUS_INITIAL);
const at = (s: FocusState) => [s.level, s.pool, s.role, s.requirement];

describe("MAP-FOCUS · levels", () => {
  it("L0 → L1 (pool) → L2 (role) → L3 (requirement), and UP walks back one level at a time to L0", () => {
    expect(at(FOCUS_INITIAL)).toEqual(["L0", null, null, null]);
    const l1 = run({ type: "OPEN_POOL", jobPoolUploadId: POOL_A });
    expect(at(l1)).toEqual(["L1", POOL_A, null, null]);
    const l2 = focusReduce(l1, { type: "OPEN_ROLE", role: RA });
    expect(at(l2)).toEqual(["L2", POOL_A, RA, null]);
    const l3 = focusReduce(l2, { type: "OPEN_REQUIREMENT", poolRequirementId: "q_ts" });
    expect(at(l3)).toEqual(["L3", POOL_A, RA, "q_ts"]);
    expect(at(focusReduce(l3, { type: "UP" }))).toEqual(at(l2));
    expect(at(focusReduce(l2, { type: "UP" }))).toEqual(at(l1));
    expect(focusReduce(l1, { type: "UP" })).toEqual(FOCUS_INITIAL);
  });

  it("a role opens from any level and brings its own pool; another requirement or role replaces the open one", () => {
    expect(at(run({ type: "OPEN_ROLE", role: RB }))).toEqual(["L2", POOL_B, RB, null]);
    expect(at(run({ type: "OPEN_POOL", jobPoolUploadId: POOL_A }, { type: "OPEN_ROLE", role: RB }))).toEqual(["L2", POOL_B, RB, null]);
    expect(at(run({ type: "OPEN_ROLE", role: RA }, { type: "OPEN_REQUIREMENT", poolRequirementId: "q_ts" }, { type: "OPEN_REQUIREMENT", poolRequirementId: "q_pg" }))).toEqual(["L3", POOL_A, RA, "q_pg"]);
    expect(at(run({ type: "OPEN_ROLE", role: RA }, { type: "OPEN_REQUIREMENT", poolRequirementId: "q_ts" }, { type: "OPEN_POOL", jobPoolUploadId: POOL_B }))).toEqual(["L1", POOL_B, null, null]);
    expect(at(run({ type: "OPEN_ROLE", role: RA }, { type: "OPEN_REQUIREMENT", poolRequirementId: "q_ts" }, { type: "OPEN_ROLE", role: RA }))).toEqual(["L2", POOL_A, RA, null]);
  });

  it("INVERSE: inadmissible transitions change nothing — the very same object comes back", () => {
    const l2 = run({ type: "OPEN_ROLE", role: RA });
    const cases: Array<[FocusState, FocusAction]> = [
      [FOCUS_INITIAL, { type: "UP" }], [FOCUS_INITIAL, { type: "RESET" }], [FOCUS_INITIAL, { type: "CLEAR_SELECTION" }],
      [FOCUS_INITIAL, { type: "OPEN_REQUIREMENT", poolRequirementId: "q_ts" }],
      [run({ type: "OPEN_POOL", jobPoolUploadId: POOL_A }), { type: "OPEN_REQUIREMENT", poolRequirementId: "q_ts" }],
      [run({ type: "OPEN_POOL", jobPoolUploadId: POOL_A }), { type: "OPEN_POOL", jobPoolUploadId: POOL_A }],
      [l2, { type: "OPEN_ROLE", role: RA }], [l2, { type: "OPEN_ROLE", role: { jobPoolUploadId: "", poolRoleId: "x" } }],
      [l2, { type: "OPEN_POOL", jobPoolUploadId: "" }], [l2, { type: "OPEN_REQUIREMENT", poolRequirementId: "" }],
      [l2, { type: "SELECT_CAPABILITY", capabilityKey: "" }], [l2, { type: "SELECT_CAPABILITY", capabilityKey: null as never }],
      [run({ type: "SELECT_CAPABILITY", capabilityKey: "PCAP_TS" }), { type: "SELECT_CAPABILITY", capabilityKey: "PCAP_TS" }],
      [l2, { type: "SELECT_JOB" } as never], [l2, { type: "SET_JOB_SCOPE", jobScope: { jobPoolUploadId: POOL_A } } as never], [l2, {} as never], [l2, null as never]
    ];
    for (const [state, action] of cases) expect(focusReduce(state, action), JSON.stringify(action)).toBe(state);
  });

  it("RESET returns to L0 without selection from anywhere; the states are frozen and the input state is never written", () => {
    const deep = run({ type: "OPEN_ROLE", role: RA }, { type: "OPEN_REQUIREMENT", poolRequirementId: "q_ts" }, { type: "SELECT_CAPABILITY", capabilityKey: "PCAP_TS" });
    expect(focusReduce(deep, { type: "RESET" })).toBe(FOCUS_INITIAL);
    expect(Object.isFrozen(deep)).toBe(true);
    expect(Object.isFrozen(deep.role)).toBe(true);
    expect(Object.isFrozen(deep.selection)).toBe(true);
    const before = JSON.stringify(deep);
    focusReduce(deep, { type: "UP" });
    expect(JSON.stringify(deep)).toBe(before);
    const role = { ...RA };
    const opened = run({ type: "OPEN_ROLE", role });
    role.poolRoleId = "changed later";
    expect(opened.role).toEqual(RA);
  });
});

describe("MAP-FOCUS · selection and the reverse view", () => {
  it("selection is its own axis: opening never selects, selecting never opens; navigation keeps the selection, CLEAR_SELECTION drops it", () => {
    const opened = run({ type: "OPEN_ROLE", role: RA });
    expect(opened.selection).toBeNull();
    const selected = run({ type: "SELECT_ROLE", role: RB });
    expect([selected.level, selected.selection]).toEqual(["L0", { kind: "ROLE", role: RB }]);
    const both = run({ type: "SELECT_CAPABILITY", capabilityKey: "PCAP_TS" }, { type: "OPEN_ROLE", role: RA }, { type: "UP" });
    expect([both.level, both.selection]).toEqual(["L1", { kind: "CAPABILITY", capabilityKey: "PCAP_TS" }]);
    expect(run({ type: "SELECT_REQUIREMENT", role: RA, poolRequirementId: "q_ts" }).selection).toEqual({ kind: "REQUIREMENT", role: RA, poolRequirementId: "q_ts" });
    expect(focusReduce(both, { type: "CLEAR_SELECTION" }).selection).toBeNull();
  });

  it("REVERSE VIEW: a chosen capability shows the requirements and roles it couples — over capabilityKey only, never over the name", () => {
    const view = buildMappingView({ capabilities: CAPS, ranking: standardRanking(), run: { state: "COMPLETED", resumePending: false }, evidenceClass: "STAND_IN" });
    const ts = reverseView(view, "PCAP_TS");
    expect(ts.known).toBe(true);
    // q_ts2 names "TypeScript" but carries no key: it is not in TypeScript's reverse view.
    expect(ts.couplings.map(c => [c.role.jobPoolUploadId, c.poolRequirementId])).toEqual([[POOL_A, "q_ts"]]);
    expect(ts.roles).toEqual([RA]);
    const foreign = reverseView(view, "PCAP_GONE");
    expect([foreign.known, foreign.couplings.map(c => c.poolRequirementId)]).toEqual([false, ["q_go"]]);
    expect(reverseView(view, "PCAP_NOWHERE")).toEqual({ capabilityKey: "PCAP_NOWHERE", known: false, couplings: [], roles: [] });
    const twice = buildMappingView({ capabilities: CAPS, run: { state: "COMPLETED", resumePending: false }, evidenceClass: "STAND_IN",
      ranking: rankingOf([...standardRoles(), { pool: POOL_A, roleId: "role_b", title: "B", requirements: [sem("q_x", "REQUIRED", "COVERS", "PCAP_TS", "TS label")] }]) });
    // In rank order: role_b (fit 1) before the platform role.
    expect(reverseView(twice, "PCAP_TS").roles).toEqual([{ jobPoolUploadId: POOL_A, poolRoleId: "role_b" }, RA]);
    expect(Object.isFrozen(ts)).toBe(true);
  });
});

describe("MAP-FOCUS · B-3: opening is not selecting for B2", () => {
  const SCOPE = /scope|b2|choose|commit|navigat|url|route/i;

  it("the state has no job-scope field, at any level and with any selection", () => {
    const states = [FOCUS_INITIAL, run({ type: "OPEN_POOL", jobPoolUploadId: POOL_A }), run({ type: "OPEN_ROLE", role: RA }, { type: "OPEN_REQUIREMENT", poolRequirementId: "q_ts" }),
      run({ type: "SELECT_ROLE", role: RA }), run({ type: "SELECT_CAPABILITY", capabilityKey: "PCAP_TS" }), run({ type: "SELECT_REQUIREMENT", role: RA, poolRequirementId: "q_ts" })];
    const keys = (v: unknown): string[] => (v && typeof v === "object" ? Object.entries(v).flatMap(([k, x]) => [k, ...keys(x)]) : []);
    for (const s of states) { expect(Object.keys(s).sort()).toEqual(["level", "pool", "requirement", "role", "selection"]); expect(keys(s).filter(k => SCOPE.test(k))).toEqual([]); }
  });

  it("no action name writes a scope or names B2; the automaton knows exactly its nine actions", () => {
    expect([...FOCUS_ACTIONS]).toEqual(["OPEN_POOL", "OPEN_ROLE", "OPEN_REQUIREMENT", "SELECT_CAPABILITY", "SELECT_ROLE", "SELECT_REQUIREMENT", "CLEAR_SELECTION", "UP", "RESET"]);
    expect(FOCUS_ACTIONS.filter(name => SCOPE.test(name) || /JOB/.test(name))).toEqual([]);
  });

  it("the module imports nothing of the job scope, the URL or navigation", () => {
    const source = readFileSync(join(__dirname, "../../../lib/career/mapping/focus.ts"), "utf8");
    expect(source).not.toMatch(/job-scope|jobScope|JobScope|useRouter|next\/|window|history|location/);
  });
});
