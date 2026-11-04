import { describe, expect, it } from "vitest";
import layoutSpec from "../../../docs/architecture/decision-fields/mapping-spec/layout-spec.json";
import signTable from "../../../docs/architecture/decision-fields/mapping-spec/sign-table.json";
import { buildMappingView, capabilitiesOfProjection } from "../../../lib/career/mapping/view";
import { layoutConstellation, layoutRoles } from "../../../lib/career/mapping/layout";
import { runSign } from "../../../lib/career/mapping/signs";
import { diffRankings } from "../../../lib/career/mapping/delta";
import { FOCUS_ACTIONS, FOCUS_INITIAL, type FocusAction, type FocusState } from "../../../lib/career/mapping/focus";
import { AUTO_MATCH_STATES } from "../../../lib/career/ui/auto-match";
import {
  CLASS_LINE, FIELD_ACTIONS, bodyMovements, fieldFocusReduce, fieldLevel, fieldViewBox, mappingFieldModel, markedBody, roleKey, sectorViewBox, type MappingFieldModel
} from "../../../lib/career/view-model/mapping-field";
import { deepFreeze, isDeepFrozen } from "../mapping/fixtures";
import { POOL_A, POOL_B, available, classRoles, crowdedRoles, lex, projectionOf, rankingOf, sem, standardRanking, standardRoles, watchOf } from "./support";

/**
 * MAP-C · the field model (phase C, L0/L1): it composes the released engine and adds nothing to it. Every position is the layout's,
 * every line the sign table's, every level the focus machine's — held here by computing the engine's own answer beside it.
 */
const model = (ranking = standardRanking(), state: Parameters<typeof watchOf>[0] = "COMPLETED", patch: Record<string, unknown> = {}) =>
  mappingFieldModel({ projection: projectionOf(), ranking: available(ranking), watch: watchOf(state, patch) })!;

describe("MAP-C-MODEL · consumes the engine, adds no rule", () => {
  it("REPRODUCE: the drawn bodies are exactly the layout's non-overflow bodies of the view, in rank order", () => {
    const ranking = standardRanking();
    const m = model(ranking);
    const view = buildMappingView({ capabilities: capabilitiesOfProjection(projectionOf()), ranking, run: { state: "COMPLETED", resumePending: false }, evidenceClass: ranking.evidenceClass });
    const layout = layoutRoles(view.pools.map(p => ({ id: p.id, name: p.name })), view.roles.map(r => ({ poolId: r.id.jobPoolUploadId, roleId: r.id.poolRoleId, rank: r.rank, tier: r.tier, fit: r.fit, weightSum: r.weightSum })));
    expect(m.view).toEqual(view);
    expect(m.bodies.map(b => [b.id.jobPoolUploadId, b.id.poolRoleId, b.rank, b.x, b.y, b.radius, b.shelf])).toEqual(
      layout.bodies.filter(b => !b.overflow).map(b => [b.poolId, b.roleId, b.rank, b.x, b.y, b.bodyRadius, b.shelf]));
    expect(m.sectors.map(s => [s.poolId, s.startDegrees, s.spanDegrees, s.roles])).toEqual(layout.sectors.map(s => [s.poolId, s.startDegrees, s.spanDegrees, s.roles]));
    expect(m.overflowCount).toBe(layout.overflowCount);
    const ranks = m.bodies.map(b => b.rank);
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
  });

  it("the person constellation is the engine's, keyed by the projection's proposal ids", () => {
    const m = model();
    const placed = layoutConstellation(capabilitiesOfProjection(projectionOf()).map(c => ({ key: c.key, name: c.name })));
    expect(m.constellation.nodes.map(n => [n.key, n.x, n.y])).toEqual(placed.nodes.map(n => [n.key, n.x, n.y]));
    expect(m.constellation.overflowCount).toBe(placed.overflowCount);
    expect(m.constellation.nodes.map(n => n.name).sort()).toEqual(["Kubernetes", "PostgreSQL", "TypeScript"]);
  });

  it("the geometry is the layout specification's rings, not a second copy", () => {
    expect(model().geometry).toEqual({ fieldRadius: layoutSpec.field.radius, personRadius: layoutSpec.field.personRadius, bestFit: layoutSpec.rings.bestFit,
      horizon: layoutSpec.rings.horizon, shelfNear: layoutSpec.rings.shelfNear, shelfFar: layoutSpec.rings.shelfFar, nodeRadius: layoutSpec.constellation.nodeRadius });
  });

  it("crowded: bodies without room are counted (per pool and in all), not drawn; drawn + overflow = roles", () => {
    const m = model(rankingOf(crowdedRoles(320)));
    expect(m.overflowCount).toBeGreaterThan(0);
    expect(m.bodies.length + m.overflowCount).toBe(320);
    const a = m.sectors.find(s => s.poolId === POOL_A)!;
    expect([a.roles, a.drawn, a.overflow]).toEqual([320, m.bodies.length, m.overflowCount]);
    expect(m.sectors.find(s => s.poolId === POOL_B)!).toMatchObject({ roles: 0, drawn: 0, overflow: 0 });
  });

  it("deterministic and pure: the same input gives the same model; frozen inputs are read, never written", () => {
    const ranking = deepFreeze(standardRanking()), projection = deepFreeze(projectionOf()), watch = deepFreeze(watchOf("RUNNING"));
    const a = mappingFieldModel({ projection, ranking: available(ranking), watch })!, b = mappingFieldModel({ projection, ranking: available(ranking), watch })!;
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(isDeepFrozen(ranking) && isDeepFrozen(projection)).toBe(true);
    expect(Object.isFrozen(a) && Object.isFrozen(a.bodies) && a.bodies.every(Object.isFrozen)).toBe(true);
  });

  it("inverse: no field without a ranking or without a run; an empty ranking is a model without bodies (view.empty says why)", () => {
    for (const ranking of [{ state: "IDLE" }, { state: "LOADING" }, { state: "NOT_PERSON" }, { state: "FAILED", code: null }] as const) {
      expect(mappingFieldModel({ projection: projectionOf(), ranking, watch: watchOf("COMPLETED") })).toBeNull();
    }
    expect(mappingFieldModel({ projection: projectionOf(), ranking: available(standardRanking()), watch: { read: { state: "LOADING" }, waitedOut: false } })).toBeNull();
    const empty = model(rankingOf([]));
    expect([empty.view.empty, empty.bodies.length]).toEqual(["NO_ROLES", 0]);
    // No projection: the constellation is empty, the roles are still drawn (the mapping needs no job scope and no PERSON key to place them).
    const bare = mappingFieldModel({ projection: null, ranking: available(standardRanking()), watch: watchOf("COMPLETED") })!;
    expect([bare.constellation.nodes.length, bare.bodies.length]).toEqual([0, 3]);
  });
});

describe("MAP-C-SIGNS · L0 shows the class, the run its time sign", () => {
  it("REPRODUCE: class per role — checked (SEMANTIC tier), name relation only, no relation; the line is the sign table's", () => {
    const m = model(rankingOf(classRoles()));
    const cls = Object.fromEntries(m.bodies.map(b => [b.id.poolRoleId, [b.class, b.line]]));
    expect(cls).toEqual({
      role_checked: ["SEMANTIC", signTable.couplingStates.EQUIVALENT.arcLine],
      role_named: ["LEXICAL", signTable.couplingStates.NAME_EXACT.arcLine],
      role_none: ["NONE", signTable.couplingStates.NONE.arcLine],
      role_bare: ["NONE", signTable.couplingStates.NONE.arcLine]
    });
    expect(CLASS_LINE).toEqual({ SEMANTIC: "solid", LEXICAL: "dotted", NONE: "open" });
    // One channel, one meaning: the three classes differ in their line.
    expect(new Set(Object.values(CLASS_LINE)).size).toBe(3);
  });

  it("REPRODUCE: the run's sign is the engine's for every state; the breath only while roles are pending (evaluated < planned)", () => {
    // The decoder refuses resumePending on NOT_STARTED (no run, nothing to continue): that pair cannot reach the field.
    for (const state of AUTO_MATCH_STATES) for (const resumePending of state === "NOT_STARTED" ? [false] : [false, true]) {
      const m = model(standardRanking(), state, { resumePending });
      expect(m.run.sign, `${state}/${resumePending}`).toEqual(runSign(state, resumePending));
      expect(m.run.pendingBreath, state).toBe(state === "RUNNING");
    }
    const done = model(standardRanking(), "RUNNING", { budget: { rolesPlanned: 4, rolesEvaluated: 4, callsLimit: 25, callsUsed: null, callsJobLimit: null } });
    expect(done.run.pendingBreath, "every planned role evaluated: no breath").toBe(false);
    expect(model(standardRanking(), "STALLED", { resumePending: true }).run.sign).toMatchObject({ frozen: true, resumePulse: false });
    expect(model(standardRanking(), "PARTIAL", { resumePending: true }).run.sign).toMatchObject({ frozen: false, resumePulse: true });
  });

  it("the authority and the evidence class stand with the field (B-6)", () => {
    const m = model();
    expect(m.authority).toEqual({ ranking: true, decision: false, authorityState: "NONE" });
    expect(m.evidenceClass).toBe("STAND_IN");
    expect(model(rankingOf([standardRoles()[1]])).evidenceClass).toBeNull();
  });
});

describe("MAP-C-FOCUS · L0 and L1 only; a look, never a choice", () => {
  const m = model();
  it("REPRODUCE: OPEN_POOL → L1, UP → L0, RESET → the initial state; a mark is a highlight beside the level", () => {
    let s: FocusState = FOCUS_INITIAL;
    s = fieldFocusReduce(s, { type: "OPEN_POOL", jobPoolUploadId: POOL_B });
    expect(fieldLevel(s, m)).toEqual({ level: "L1", pool: POOL_B });
    const role = m.bodies.find(b => b.id.jobPoolUploadId === POOL_B)!.id;
    s = fieldFocusReduce(s, { type: "MARK_ROLE", role });
    expect(markedBody(s, m)?.key).toBe(roleKey(role));
    s = fieldFocusReduce(s, { type: "UP" });
    expect(fieldLevel(s, m)).toEqual({ level: "L0", pool: null });
    expect(markedBody(s, m)?.key, "the mark stays on L0").toBe(roleKey(role));
    s = fieldFocusReduce(s, { type: "RESET" });
    expect(s).toBe(FOCUS_INITIAL);
  });

  it("inverse: L2/L3 are not phase C — OPEN_ROLE, OPEN_REQUIREMENT, SELECT_CAPABILITY, MARK_REQUIREMENT return the very same state", () => {
    const role = m.bodies[0].id;
    const refused: FocusAction[] = [
      { type: "OPEN_ROLE", role }, { type: "OPEN_REQUIREMENT", poolRequirementId: "q_ts" },
      { type: "SELECT_CAPABILITY", capabilityKey: "PCAP_TS" }, { type: "MARK_REQUIREMENT", role, poolRequirementId: "q_ts" }
    ];
    for (const start of [FOCUS_INITIAL, fieldFocusReduce(FOCUS_INITIAL, { type: "OPEN_POOL", jobPoolUploadId: POOL_A })]) {
      for (const action of refused) expect(fieldFocusReduce(start, action), action.type).toBe(start);
    }
    expect([...FIELD_ACTIONS].sort()).toEqual(["CLEAR_SELECTION", "MARK_ROLE", "OPEN_POOL", "RESET", "UP"]);
    expect(FOCUS_ACTIONS.filter(a => !(FIELD_ACTIONS as readonly string[]).includes(a)).sort()).toEqual(["MARK_REQUIREMENT", "OPEN_REQUIREMENT", "OPEN_ROLE", "SELECT_CAPABILITY"]);
  });

  it("every sequence of admitted actions stays on L0/L1, and the state never names a job scope (B-3)", () => {
    const role = m.bodies[0].id;
    const actions = [{ type: "OPEN_POOL", jobPoolUploadId: POOL_A }, { type: "OPEN_POOL", jobPoolUploadId: POOL_B }, { type: "UP" }, { type: "RESET" }, { type: "MARK_ROLE", role }, { type: "CLEAR_SELECTION" }] as const;
    let states: FocusState[] = [FOCUS_INITIAL];
    for (let depth = 0; depth < 4; depth += 1) states = states.flatMap(s => actions.map(a => fieldFocusReduce(s, a)));
    for (const s of states) {
      expect(["L0", "L1"]).toContain(s.level);
      expect(Object.keys(s).sort()).toEqual(["level", "pool", "requirement", "role", "selection"]);
      expect([s.role, s.requirement]).toEqual([null, null]);
    }
  });

  it("a pool that is no longer in the field reads as L0; a marked role outside the open pool is not marked", () => {
    const gone = fieldFocusReduce(FOCUS_INITIAL, { type: "OPEN_POOL", jobPoolUploadId: "JPOOL_GONE" });
    expect(fieldLevel(gone, m)).toEqual({ level: "L0", pool: null });
    const inA = m.bodies.find(b => b.id.jobPoolUploadId === POOL_A)!.id;
    const s = fieldFocusReduce(fieldFocusReduce(FOCUS_INITIAL, { type: "MARK_ROLE", role: inA }), { type: "OPEN_POOL", jobPoolUploadId: POOL_B });
    expect(markedBody(s, m)).toBeNull();
  });

  it("L1's view box holds every drawn body of its pool; L0's the whole field", () => {
    const crowded = model(rankingOf([...crowdedRoles(40, POOL_A), ...standardRoles()]));
    for (const sector of crowded.sectors) {
      const box = sectorViewBox(sector);
      for (const b of crowded.bodies.filter(x => x.id.jobPoolUploadId === sector.poolId)) {
        expect(b.x - b.radius, b.key).toBeGreaterThanOrEqual(box.x);
        expect(b.x + b.radius).toBeLessThanOrEqual(box.x + box.width);
        expect(b.y - b.radius).toBeGreaterThanOrEqual(box.y);
        expect(b.y + b.radius).toBeLessThanOrEqual(box.y + box.height);
      }
      expect(box.width).toBe(box.height);
    }
    const all = fieldViewBox();
    expect(all.width / 2).toBeGreaterThan(layoutSpec.field.radius);
  });
});

describe("MAP-C-DELTA · a body moves only on its own new evidence", () => {
  const snap = (m: MappingFieldModel) => ({ analysisId: m.analysisId, ranking: m.ranking, bodies: m.bodies });
  it("REPRODUCE: a changed fit moves that body once, with a trail from its previous drawn place; the others do not move", () => {
    const before = model(standardRanking());
    const roles = standardRoles();
    roles[0].requirements[1] = sem("q_pg", "PREFERRED", "COVERS", "PCAP_PG", "PostgreSQL");
    const after = model(rankingOf(roles));
    const moves = bodyMovements(snap(before), snap(after));
    const key = roleKey({ jobPoolUploadId: POOL_A, poolRoleId: "role_platform" });
    expect([...moves.keys()]).toEqual([key]);
    const was = before.bodies.find(b => b.key === key)!;
    expect(moves.get(key)).toEqual({ moved: true, from: { x: was.x, y: was.y } });
  });

  it("a changed tier moves the body (fit and tier of one read are one movement); a new role appears without a trail", () => {
    const roles = standardRoles();
    const before = model(rankingOf(roles));
    roles[1].requirements[0] = sem("q_k8", "REQUIRED", "COVERS", "PCAP_K8", "Kubernetes");
    roles.push({ pool: POOL_A, roleId: "role_new", title: "New", requirements: [lex("q_new", "OPTIONAL", "NAME_ALIAS", "PCAP_TS", "TypeScript")] });
    const after = model(rankingOf(roles));
    const moves = bodyMovements(snap(before), snap(after));
    expect([...moves.keys()]).toContain(roleKey({ jobPoolUploadId: POOL_B, poolRoleId: "role_platform" }));
    expect(moves.has(roleKey({ jobPoolUploadId: POOL_A, poolRoleId: "role_new" }))).toBe(false);
    expect([...moves.values()].every(v => v.moved)).toBe(true);
  });

  it("inverse: a re-read that changed nothing moves nothing; nothing moves from no previous reading", () => {
    const a = model(standardRanking()), b = model(standardRanking());
    expect(a.ranking).not.toBe(b.ranking);
    expect(bodyMovements(snap(a), snap(b)).size).toBe(0);
    expect(bodyMovements(null, snap(b)).size).toBe(0);
  });

  // PINK §3.98 F-PC-T1 (T1–T3): timeMovement.rule — "A body moves only when new evidence changes its tier or fit".
  const changeKinds = (before: MappingFieldModel, after: MappingFieldModel, key: string) =>
    diffRankings(before.ranking, after.ranking).filter(c => roleKey(c.role) === key).map(c => c.kind).sort();

  it("T2 inverse: across analyses nothing moves — even when the same role's fit really changed between the two readings", () => {
    const before = model(standardRanking());
    const roles = standardRoles();
    roles[0].requirements[1] = sem("q_pg", "PREFERRED", "COVERS", "PCAP_PG", "PostgreSQL");
    const sameAnalysis = model(rankingOf(roles));
    const otherAnalysis = mappingFieldModel({ projection: projectionOf(), ranking: available({ ...rankingOf(roles), analysisId: "CAN_00000000000000000000000000000009" }), watch: watchOf("COMPLETED") })!;
    const key = roleKey({ jobPoolUploadId: POOL_A, poolRoleId: "role_platform" });
    // Preconditions: the change is there (the engine's delta names it) and within one analysis it does move the body.
    expect(otherAnalysis.analysisId).not.toBe(before.analysisId);
    expect(changeKinds(before, otherAnalysis, key)).toContain("ROLE_FIT_CHANGED");
    expect([...bodyMovements(snap(before), snap(sameAnalysis)).keys()]).toEqual([key]);
    // The rule: a reading of another analysis is not new evidence about these bodies.
    expect(bodyMovements(snap(before), snap(otherAnalysis)).size).toBe(0);
    expect(bodyMovements(snap(otherAnalysis), snap(before)).size).toBe(0);
  });

  it("T3: a tier-only change (fit and rank equal) moves the body, with its trail starting at its previous drawn place", () => {
    const roleOf = (requirement: ReturnType<typeof sem>) => [
      { pool: POOL_A, roleId: "role_r", title: "Tiered", requirements: [requirement] },
      { pool: POOL_B, roleId: "role_x", title: "Other", requirements: [lex("q_x", "REQUIRED", "NONE", null)] }
    ];
    const before = model(rankingOf(roleOf(lex("q_r", "REQUIRED", "NAME_EXACT", "PCAP_K8", "Kubernetes"))));
    const after = model(rankingOf(roleOf(sem("q_r", "REQUIRED", "PARTIAL", "PCAP_K8", "Kubernetes"))));
    const key = roleKey({ jobPoolUploadId: POOL_A, poolRoleId: "role_r" });
    const was = before.bodies.find(b => b.key === key)!, now = after.bodies.find(b => b.key === key)!;
    // Preconditions: only the tier changed — same fit, same rank; the other role did not change at all.
    expect([was.tier, now.tier]).toEqual(["LEXICAL_ONLY", "SEMANTIC"]);
    expect(changeKinds(before, after, key).filter(k => k.startsWith("ROLE_"))).toEqual(["ROLE_TIER_CHANGED"]);
    expect(diffRankings(before.ranking, after.ranking).filter(c => c.kind.startsWith("ROLE_")).map(c => c.kind)).toEqual(["ROLE_TIER_CHANGED"]);
    const moves = bodyMovements(snap(before), snap(after));
    expect([...moves.keys()]).toEqual([key]);
    expect(moves.get(key)).toEqual({ moved: true, from: { x: was.x, y: was.y } });
  });

  it("T1 inverse: a rank-only change (tier and fit equal) is not a movement — the role that changed its fit moves, the one it passed does not", () => {
    const roleOf = (y: ReturnType<typeof sem>) => [
      { pool: POOL_A, roleId: "role_x", title: "Steady", requirements: [sem("q_x", "REQUIRED", "PARTIAL", "PCAP_TS", "TypeScript")] },
      { pool: POOL_A, roleId: "role_y", title: "Rising", requirements: [y] }
    ];
    const before = model(rankingOf(roleOf(sem("q_y", "REQUIRED", "DIFFERENT", "PCAP_PG", "PostgreSQL"))));
    const after = model(rankingOf(roleOf(sem("q_y", "REQUIRED", "COVERS", "PCAP_PG", "PostgreSQL"))));
    const steady = roleKey({ jobPoolUploadId: POOL_A, poolRoleId: "role_x" }), rising = roleKey({ jobPoolUploadId: POOL_A, poolRoleId: "role_y" });
    // Preconditions: the steady role changed its rank and nothing else; the rising one changed its fit.
    expect(changeKinds(before, after, steady)).toEqual(["ROLE_RANK_CHANGED"]);  // no requirement of it changed either
    expect(changeKinds(before, after, rising)).toContain("ROLE_FIT_CHANGED");
    // Only the movement mark is held here — where the layout now draws the steady body is the layout's (A3), not asserted.
    expect([...bodyMovements(snap(before), snap(after)).keys()]).toEqual([rising]);
  });
});

describe("MAP-C-MODEL · displaced is either displacement (PINK §3.98 M8)", () => {
  it("a body the layout pushed only along its sector (radial 0, angular ≠ 0) is displaced, as is one pushed only outward", () => {
    const ranking = rankingOf([...crowdedRoles(40, POOL_A), ...standardRoles()]);
    const m = model(ranking);
    const layout = layoutRoles(m.view.pools.map(p => ({ id: p.id, name: p.name })), m.view.roles.map(r => ({ poolId: r.id.jobPoolUploadId, roleId: r.id.poolRoleId, rank: r.rank, tier: r.tier, fit: r.fit, weightSum: r.weightSum })));
    const kind = (d: [number, number]) => (d[0] === 0 && d[1] === 0 ? "none" : d[0] === 0 ? "angular" : d[1] === 0 ? "radial" : "both");
    const byKey = new Map(m.bodies.map(b => [b.key, b] as const));
    const seen = new Set<string>();
    for (const placed of layout.bodies.filter(b => !b.overflow)) {
      const body = byKey.get(roleKey({ jobPoolUploadId: placed.poolId, poolRoleId: placed.roleId }))!;
      seen.add(kind(placed.displacement));
      expect(body.displaced, `${placed.roleId} ${kind(placed.displacement)}`).toBe(kind(placed.displacement) !== "none");
    }
    // Precondition: the fixture has angular-only, radial-only and undisplaced bodies.
    expect([...seen].sort()).toEqual(expect.arrayContaining(["angular", "none", "radial"]));
  });
});
