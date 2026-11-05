import { describe, expect, it } from "vitest";
import layoutSpec from "../../../docs/architecture/decision-fields/mapping-spec/layout-spec.json";
import signTable from "../../../docs/architecture/decision-fields/mapping-spec/sign-table.json";
import { layoutRequirementArcs } from "../../../lib/career/mapping/layout";
import { couplingSign } from "../../../lib/career/mapping/signs";
import { FOCUS_INITIAL, reverseView, type FocusAction, type FocusState } from "../../../lib/career/mapping/focus";
import {
  COLLAR_MIN_ARC_PX, collarSplit, fieldFocusReduce, levelBeams, mappingFieldModel, roleKey, selectedCapability, type FieldArc, type MappingFieldModel
} from "../../../lib/career/view-model/mapping-field";
import { POOL_A, POOL_B, available, crowdedRoles, lex, projectionOf, rankingOf, sem, standardRoles, watchOf } from "./support";
import { STATES, allStates, keyCases, manyCapabilities, reqOf } from "./support-d";

/**
 * MAP-D-SIGNS · the phase-D model against the sign table (PERSON_X_JOB_MAPPING_PHASE_D.md §2, §8.1 – §8.7, §8.11, §8.17; D-Q1 –
 * D-Q3). Every requirement's arc carries exactly the table's sign for its coupling state; the collar and the ring are one output; a
 * beam needs a drawn start point; the reverse view couples over capabilityKey only.
 */
const model = (roles = [allStates(), keyCases(), ...standardRoles()], caps?: ReadonlyArray<{ key: string; name: string }>, state: Parameters<typeof watchOf>[0] = "COMPLETED") =>
  mappingFieldModel({ projection: projectionOf(caps), ranking: available(rankingOf(roles)), watch: watchOf(state) })!;
const run = (actions: FocusAction[], start: FocusState = FOCUS_INITIAL) => actions.reduce((s, a) => fieldFocusReduce(s, a), start);
const ALL = { jobPoolUploadId: POOL_A, poolRoleId: "role_all" };
const KEYS = { jobPoolUploadId: POOL_B, poolRoleId: "role_keys" };
const bodyOf = (m: MappingFieldModel, id: typeof ALL) => m.bodies.find(b => b.key === roleKey(id))!;
const arcOf = (m: MappingFieldModel, id: typeof ALL, req: string) => bodyOf(m, id).arcs.find(a => a.poolRequirementId === req)!;
const table = signTable.couplingStates as Record<string, Record<string, unknown>>;

describe("MAP-D-SIGNS · §8.1 sign fidelity, §8.2 – §8.4", () => {
  it("REPRODUCE §8.1: each of the ten states' arc carries exactly the table's sign — the table's own object, every channel equal", () => {
    const m = model();
    for (const state of STATES) {
      const arc = arcOf(m, ALL, reqOf(state));
      expect(arc.state, state).toBe(state);
      expect(arc.sign, state).toBe(couplingSign(arc.class, state));
      const { class: cls, ...channels } = table[state];
      expect(arc.class, state).toBe(cls);
      expect({ arcLine: arc.sign.arcLine, arcFill: arc.sign.arcFill, luminance: arc.sign.luminance, beam: arc.sign.beam, phaseLocked: arc.sign.phaseLocked, mark: arc.sign.mark }, state).toEqual(channels);
    }
  });

  it("§8.2: DIFFERENT, WEAK_TOKEN_CONTAINMENT and NONE never draw a beam — at L2, at L3, and in the reverse view", () => {
    const m = model();
    const l2 = run([{ type: "OPEN_POOL", jobPoolUploadId: POOL_A }, { type: "OPEN_ROLE", role: ALL }]);
    const beamless: readonly string[] = ["DIFFERENT", "WEAK_TOKEN_CONTAINMENT", "NONE"];
    const beams = levelBeams(l2, m);
    expect(beams.map(b => b.arc.state).sort(), "every other state of the role draws one").toEqual(STATES.filter(s => !beamless.includes(s)).sort());
    for (const state of ["DIFFERENT", "WEAK_TOKEN_CONTAINMENT", "NONE"] as const) {
      expect(levelBeams(fieldFocusReduce(l2, { type: "OPEN_REQUIREMENT", poolRequirementId: reqOf(state) }), m), state).toEqual([]);
    }
    const reverse = levelBeams(fieldFocusReduce(FOCUS_INITIAL, { type: "SELECT_CAPABILITY", capabilityKey: "PCAP_TS" }), m);
    expect(reverse.filter(b => beamless.includes(b.arc.state))).toEqual([]);
  });

  it("§8.3: the three absences differ in line and mark, not only in luminance — judged different, could not tell, not evidenced", () => {
    const m = model();
    const sig = (state: string) => { const s = arcOf(m, ALL, reqOf(state as typeof STATES[number])).sign; return `${s.arcLine}/${s.mark}`; };
    expect([sig("DIFFERENT"), sig("UNCLEAR"), sig("NONE")]).toEqual(["open/counterTick", "broken/none", "open/none"]);
    expect(new Set([sig("DIFFERENT"), sig("UNCLEAR"), sig("NONE")]).size).toBe(3);
    // All ten states differ in the signature that carries meaning (arcLine + arcFill + beam + mark), never by luminance alone.
    const full = (state: string) => { const s = arcOf(m, ALL, reqOf(state as typeof STATES[number])).sign; return `${s.arcLine}/${s.arcFill}/${s.beam}/${s.mark}`; };
    expect(new Set(STATES.map(full)).size).toBe(10);
  });

  it("§8.4: a name relation is never phase locked, never fully filled, never solid — on every arc of every level's ring", () => {
    const m = model();
    for (const ring of m.rings) for (const arc of ring.arcs.filter(a => a.class === "LEXICAL")) {
      expect([arc.sign.phaseLocked, arc.sign.arcFill <= 0.5, arc.sign.arcLine !== "solid"], arc.poolRequirementId).toEqual([false, true, true]);
    }
    const l2 = run([{ type: "OPEN_POOL", jobPoolUploadId: POOL_A }, { type: "OPEN_ROLE", role: ALL }]);
    for (const beam of levelBeams(l2, m).filter(b => b.arc.class === "LEXICAL")) expect([beam.phaseLocked, beam.beam === "solid"], beam.id).toEqual([false, false]);
  });
});

describe("MAP-D-SIGNS · §8.6 recursion identity — the collar and the ring are one output (D-Q3)", () => {
  it("REPRODUCE: a body's collar IS its ring (the same frozen array), in layoutRequirementArcs' order and geometry, one sign per requirement", () => {
    const m = model();
    for (const body of m.bodies) {
      const ring = m.rings.find(r => r.key === body.key)!;
      expect(body.arcs, body.key).toBe(ring.arcs);
      expect(Object.isFrozen(ring.arcs) && ring.arcs.every(Object.isFrozen)).toBe(true);
      const role = m.view.roles.find(r => roleKey(r.id) === body.key)!;
      const arcs = layoutRequirementArcs(role.requirements.map(q => ({ id: q.poolRequirementId, necessity: q.necessity, weight: q.weight, value: q.value })));
      expect(ring.arcs.map(a => [a.poolRequirementId, a.startDegrees, a.endDegrees, a.spanDegrees])).toEqual(arcs.map(a => [a.id, a.startDegrees, a.endDegrees, a.spanDegrees]));
      for (const arc of ring.arcs) expect(arc.sign, arc.poolRequirementId).toBe(couplingSign(arc.class, arc.state));
    }
    // Order, gap and start come from the layout spec's `arcs`, never from a second ordering here.
    const ring = bodyOf(m, ALL).arcs;
    expect(ring[0].startDegrees).toBeCloseTo(layoutSpec.arcs.startDegrees + layoutSpec.arcs.gapDegrees / 2, 6);
    expect(ring.map(a => a.necessity).every(n => n === "REQUIRED")).toBe(true);
  });

  it("the L2 arc of q and the L0 tick of q resolve to the same arc object (a magnification never changes a mark)", () => {
    const m = model();
    const l3 = run([{ type: "OPEN_POOL", jobPoolUploadId: POOL_A }, { type: "OPEN_ROLE", role: ALL }, { type: "OPEN_REQUIREMENT", poolRequirementId: reqOf("PARTIAL") }]);
    const beam = levelBeams(l3, m)[0];
    expect(beam.arc).toBe(arcOf(m, ALL, reqOf("PARTIAL")));
  });
});

describe("MAP-D-SIGNS · §8.17 the ring-order overflow of a small collar (D-Q3)", () => {
  const arcsOf = (n: number): FieldArc[] => {
    const reqs = [
      ...Array.from({ length: n }, (_, i) => lex(`q_opt_${String(i).padStart(2, "0")}`, "OPTIONAL", "NAME_EXACT", "PCAP_TS", "TypeScript")),
      sem("q_req", "REQUIRED", "COVERS", "PCAP_TS", "TypeScript"), sem("q_pref", "PREFERRED", "PARTIAL", "PCAP_PG", "PostgreSQL")
    ];
    return [...model([{ pool: POOL_A, roleId: "role_many", title: "Many", requirements: reqs }]).bodies[0].arcs];
  };
  it("REPRODUCE: what cannot be carried is counted from the END of ring order — the lightest and least necessary; each drawn tick is one requirement", () => {
    const arcs = arcsOf(30);
    expect(arcs.slice(0, 2).map(a => a.poolRequirementId), "ring order begins at REQUIRED, then PREFERRED").toEqual(["q_req", "q_pref"]);
    const radiusPx = 9;
    const split = collarSplit(arcs, radiusPx);
    const capacity = Math.floor((2 * Math.PI * radiusPx) / (COLLAR_MIN_ARC_PX + (2 * Math.PI * radiusPx * layoutSpec.arcs.gapDegrees) / 360));
    expect([split.drawn.length, split.hidden]).toEqual([capacity, arcs.length - capacity]);
    expect(split.drawn, "a prefix of ring order — never an arbitrary pick, never a merge").toEqual(arcs.slice(0, capacity));
    expect(split.drawn.every((a, i) => a === arcs[i])).toBe(true);
    const hidden = arcs.slice(capacity);
    expect(hidden.every(h => h.necessity === "OPTIONAL")).toBe(true);
    expect(Math.max(...hidden.map(h => h.weight))).toBeLessThanOrEqual(Math.min(...split.drawn.map(d => d.weight)));
  });

  it("inverse: a collar with room draws everything and counts nothing; a larger radius never draws fewer", () => {
    const arcs = arcsOf(3);
    expect(collarSplit(arcs, 40)).toEqual({ drawn: arcs, hidden: 0 });
    const many = arcsOf(30);
    let previous = 0;
    for (const r of [4, 8, 12, 20, 40]) { const n = collarSplit(many, r).drawn.length; expect(n, String(r)).toBeGreaterThanOrEqual(previous); previous = n; }
  });
});

describe("MAP-D-SIGNS · beams per level, and three cases without a start point (§2.1, D-Q2)", () => {
  it("REPRODUCE: L0 none; L1 the marked role's; L2 all of the open role's; L3 the open arc's only", () => {
    const m = model();
    expect(levelBeams(FOCUS_INITIAL, m)).toEqual([]);
    const l1 = run([{ type: "OPEN_POOL", jobPoolUploadId: POOL_A }]);
    expect(levelBeams(l1, m)).toEqual([]);
    const marked = levelBeams(fieldFocusReduce(l1, { type: "MARK_ROLE", role: ALL }), m);
    expect(new Set(marked.map(b => b.roleKey))).toEqual(new Set([roleKey(ALL)]));
    const l2 = fieldFocusReduce(l1, { type: "OPEN_ROLE", role: ALL });
    expect(levelBeams(l2, m).map(b => b.id).sort()).toEqual(marked.map(b => b.id).sort());
    const l3 = levelBeams(fieldFocusReduce(l2, { type: "OPEN_REQUIREMENT", poolRequirementId: reqOf("COVERS") }), m);
    expect(l3.map(b => b.arc.poolRequirementId)).toEqual([reqOf("COVERS")]);
    expect([l3[0].beam, l3[0].phaseLocked, l3[0].from]).toEqual(["solid", true, { x: m.constellation.nodes.find(n => n.key === "PCAP_TS")!.x, y: m.constellation.nodes.find(n => n.key === "PCAP_TS")!.y }]);
  });

  it("D-Q2: NOT_IN_PERSON and an absent key have no start point; a known key does — the arc's own sign is never weakened for it", () => {
    const m = model();
    const beams = levelBeams(run([{ type: "OPEN_POOL", jobPoolUploadId: POOL_B }, { type: "OPEN_ROLE", role: KEYS }]), m);
    const byReq = Object.fromEntries(beams.map(b => [b.arc.poolRequirementId, [b.missing, b.from === null]]));
    expect(byReq).toEqual({ q_known: [null, false], q_foreign: ["NOT_IN_PERSON", true], q_absent: ["KEY_ABSENT", true] });
    for (const req of ["q_foreign", "q_absent"]) expect(arcOf(m, KEYS, req).sign, req).toBe(couplingSign("LEXICAL", arcOf(m, KEYS, req).state));
  });

  it("D-Q2: a capability beyond the constellation (the 70th and later) has no start point; it is counted as CONSTELLATION_OVERFLOW", () => {
    const caps = manyCapabilities(75);
    const roles = [{ pool: POOL_A, roleId: "role_far", title: "Far", requirements: [lex("q_near", "REQUIRED", "NAME_EXACT", "PCAP_000", "Capability 000"), lex("q_far", "REQUIRED", "NAME_EXACT", "PCAP_074", "Capability 074")] }];
    const m = model(roles, caps);
    expect([m.constellation.nodes.length, m.constellation.overflowCount], "13 + 23 + 33 = 69 drawn").toEqual([69, 6]);
    const beams = levelBeams(run([{ type: "OPEN_POOL", jobPoolUploadId: POOL_A }, { type: "OPEN_ROLE", role: { jobPoolUploadId: POOL_A, poolRoleId: "role_far" } }]), m);
    expect(Object.fromEntries(beams.map(b => [b.arc.poolRequirementId, b.missing]))).toEqual({ q_near: null, q_far: "CONSTELLATION_OVERFLOW" });
  });
});

describe("MAP-D-SIGNS · §8.7 the reverse view couples over capabilityKey only", () => {
  it("REPRODUCE: selecting a capability collects exactly the couplings that carry its key, across all pools — the engine's reverseView", () => {
    const m = model();
    const selected = selectedCapability(fieldFocusReduce(FOCUS_INITIAL, { type: "SELECT_CAPABILITY", capabilityKey: "PCAP_K8" }), m)!;
    expect(selected.reverse).toEqual(reverseView(m.view, "PCAP_K8"));
    expect(selected.reverse.couplings.every(c => c.capabilityKey === "PCAP_K8")).toBe(true);
    expect([...selected.roles].sort()).toEqual([roleKey(KEYS), roleKey({ jobPoolUploadId: POOL_B, poolRoleId: "role_platform" })].sort());
  });

  it("inverse: a coupling that only shares the capability's NAME, or has no key, is never collected", () => {
    // q_absent names "TypeScript" with no key; the standard POOL_B role names "TypeScript" with no key (undefined) as well.
    const m = model();
    const ts = selectedCapability(fieldFocusReduce(FOCUS_INITIAL, { type: "SELECT_CAPABILITY", capabilityKey: "PCAP_TS" }), m)!;
    expect(ts.reverse.couplings.some(c => c.poolRequirementId === "q_absent" || c.capabilityKey === null)).toBe(false);
    expect(ts.roles.has(roleKey(KEYS)), "the key-cases role couples TypeScript only by name").toBe(false);
    const beams = levelBeams(fieldFocusReduce(FOCUS_INITIAL, { type: "SELECT_CAPABILITY", capabilityKey: "PCAP_TS" }), m);
    expect(beams.every(b => b.arc.coupling?.capabilityKey === "PCAP_TS")).toBe(true);
    expect(beams.length).toBeGreaterThan(0);
  });
});

describe("MAP-D-SIGNS · D-Q1 the provenance hangs on the reading", () => {
  it("REPRODUCE: names only — the line's condition holds when there is a requirement and none of them is SEMANTIC", () => {
    const names = model([keyCases(), { pool: POOL_A, roleId: "role_lex", title: "Lex", requirements: [lex("q_l", "REQUIRED", "NAME_EXACT", "PCAP_TS", "TypeScript")] }]);
    expect(names.namesOnly).toBe(true);
  });
  it("inverse: one SEMANTIC requirement anywhere ends it; a reading without requirements never carries it (its empty sentence speaks)", () => {
    expect(model().namesOnly).toBe(false);
    expect(model([{ pool: POOL_A, roleId: "role_bare", title: "Bare", requirements: [] }]).namesOnly).toBe(false);
    expect(model([]).namesOnly).toBe(false);
    // A partial run: some SEMANTIC already, some not — the line falls away; the unevaluated relations keep their own signs.
    const partial = model([...crowdedRoles(2, POOL_A), keyCases()], undefined, "RUNNING");
    expect([partial.namesOnly, partial.run.pendingBreath]).toEqual([false, true]);
  });
});
