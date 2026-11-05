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
  CLASS_LINE, FIELD_ACTIONS, bodyMovements, fieldFocusReduce, fieldLevel, fieldViewBox, mappingFieldModel, markedArc, markedBody, ringRadius, roleKey, roleViewBox, sectorViewBox,
  selectedCapability, type MappingFieldModel
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

describe("MAP-D-FOCUS · L0 to L3; a look, never a choice", () => {
  const m = model();
  const platformA = { jobPoolUploadId: POOL_A, poolRoleId: "role_platform" };
  it("REPRODUCE (§8.12): L0 → L1 → L2 → L3 → UP × 3 returns the identical initial state object; each level is the field's", () => {
    let s: FocusState = FOCUS_INITIAL;
    s = fieldFocusReduce(s, { type: "OPEN_POOL", jobPoolUploadId: POOL_A });
    expect(fieldLevel(s, m)).toMatchObject({ level: "L1", pool: POOL_A, body: null, arc: null });
    s = fieldFocusReduce(s, { type: "OPEN_ROLE", role: platformA });
    const l2 = fieldLevel(s, m);
    expect([l2.level, l2.pool, l2.body?.key, l2.arc]).toEqual(["L2", POOL_A, roleKey(platformA), null]);
    s = fieldFocusReduce(s, { type: "OPEN_REQUIREMENT", poolRequirementId: "q_pg" });
    const l3 = fieldLevel(s, m);
    expect([l3.level, l3.body?.key, l3.arc?.poolRequirementId]).toEqual(["L3", roleKey(platformA), "q_pg"]);
    expect(l3.arc, "the open arc is the very arc of the body's ring").toBe(l3.body!.arcs.find(a => a.poolRequirementId === "q_pg"));
    s = fieldFocusReduce(fieldFocusReduce(fieldFocusReduce(s, { type: "UP" }), { type: "UP" }), { type: "UP" });
    expect(s).toBe(FOCUS_INITIAL);
  });

  it("phase D admits the machine's full action set, MARK_REQUIREMENT included; a mark is a highlight beside the level", () => {
    expect(FIELD_ACTIONS).toBe(FOCUS_ACTIONS);
    let s = fieldFocusReduce(fieldFocusReduce(FOCUS_INITIAL, { type: "OPEN_POOL", jobPoolUploadId: POOL_B }), { type: "MARK_ROLE", role: m.bodies.find(b => b.id.jobPoolUploadId === POOL_B)!.id });
    expect(markedBody(s, m)?.id.jobPoolUploadId).toBe(POOL_B);
    s = fieldFocusReduce(s, { type: "OPEN_ROLE", role: platformA });
    expect(markedBody(s, m), "a role mark is an L0/L1 highlight").toBeNull();
    s = fieldFocusReduce(s, { type: "MARK_REQUIREMENT", role: platformA, poolRequirementId: "q_ts" });
    expect([fieldLevel(s, m).level, markedArc(s, m)?.poolRequirementId]).toEqual(["L2", "q_ts"]);
    expect(markedArc(fieldFocusReduce(s, { type: "MARK_REQUIREMENT", role: { jobPoolUploadId: POOL_B, poolRoleId: "role_platform" }, poolRequirementId: "q_k8" }), m), "an arc of another role is not marked here").toBeNull();
    s = fieldFocusReduce(s, { type: "SELECT_CAPABILITY", capabilityKey: "PCAP_TS" });
    expect([fieldLevel(s, m).level, selectedCapability(s, m)?.key, markedArc(s, m)]).toEqual(["L2", "PCAP_TS", null]);
  });

  it("every sequence of the full action set keeps the state's five fields — it never names a job scope (B-3, D-7)", () => {
    const role = m.bodies[0].id;
    const actions: FocusAction[] = [{ type: "OPEN_POOL", jobPoolUploadId: POOL_A }, { type: "OPEN_ROLE", role }, { type: "OPEN_REQUIREMENT", poolRequirementId: "q_ts" },
      { type: "SELECT_CAPABILITY", capabilityKey: "PCAP_TS" }, { type: "MARK_ROLE", role }, { type: "MARK_REQUIREMENT", role, poolRequirementId: "q_ts" }, { type: "CLEAR_SELECTION" }, { type: "UP" }, { type: "RESET" }];
    expect(actions.map(a => a.type).sort()).toEqual([...FOCUS_ACTIONS].sort());
    let states: FocusState[] = [FOCUS_INITIAL];
    for (let depth = 0; depth < 3; depth += 1) states = states.flatMap(s => actions.map(a => fieldFocusReduce(s, a)));
    for (const s of states) expect(Object.keys(s).sort()).toEqual(["level", "pool", "requirement", "role", "selection"]);
    expect(new Set(states.map(s => s.level))).toEqual(new Set(["L0", "L1", "L2", "L3"]));
  });

  it("what is no longer drawn reads one level up: a gone requirement → L2, an undrawn role → L1, a gone pool → L0; the state itself is kept", () => {
    const l3 = [{ type: "OPEN_POOL", jobPoolUploadId: POOL_A }, { type: "OPEN_ROLE", role: platformA }, { type: "OPEN_REQUIREMENT", poolRequirementId: "q_pg" }].reduce<FocusState>((s, a) => fieldFocusReduce(s, a as FocusAction), FOCUS_INITIAL);
    const roles = standardRoles();
    roles[0].requirements.splice(1, 1);
    expect(fieldLevel(l3, model(rankingOf(roles))).level).toBe("L2");
    expect(fieldLevel(l3, model(rankingOf(standardRoles().slice(1)))), "the role is gone, its pool stays in the field").toMatchObject({ level: "L1", pool: POOL_A, body: null });
    expect(l3.level).toBe("L3");
    const gone = fieldFocusReduce(FOCUS_INITIAL, { type: "OPEN_POOL", jobPoolUploadId: "JPOOL_GONE" });
    expect(fieldLevel(gone, m)).toMatchObject({ level: "L0", pool: null });
    const inA = m.bodies.find(b => b.id.jobPoolUploadId === POOL_A)!.id;
    expect(markedBody(fieldFocusReduce(fieldFocusReduce(FOCUS_INITIAL, { type: "MARK_ROLE", role: inA }), { type: "OPEN_POOL", jobPoolUploadId: POOL_B }), m)).toBeNull();
  });

  it("the cameras: L0 the whole field; L1 holds every drawn body of its pool; L2 holds the open ring and the person's constellation", () => {
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
    expect(fieldViewBox().width / 2).toBeGreaterThan(layoutSpec.field.radius);
    for (const b of crowded.bodies) {
      const box = roleViewBox(b), r = ringRadius(b);
      expect(box.width).toBe(box.height);
      expect([b.x - r >= box.x, b.x + r <= box.x + box.width, b.y - r >= box.y, b.y + r <= box.y + box.height], b.key).toEqual([true, true, true, true]);
      for (const n of crowded.constellation.nodes) expect(n.x >= box.x && n.x <= box.x + box.width && n.y >= box.y && n.y <= box.y + box.height, n.key).toBe(true);
      expect(r, "the ring is a magnification of the body (rounded to 1e-3)").toBeGreaterThanOrEqual(3 * b.radius - 0.001);
    }
  });
});

describe("MAP-D-DELTA · movement means evidence, always and only (A3, D-Q5)", () => {
  const snap = (m: MappingFieldModel) => ({ analysisId: m.analysisId, ranking: m.ranking, bodies: m.bodies });
  const evidenceKeys = (moves: ReturnType<typeof bodyMovements>) => [...moves].filter(([, v]) => v.kind === "EVIDENCE").map(([k]) => k);
  it("REPRODUCE: a changed fit moves that body once (EVIDENCE), with a trail from its previous drawn place", () => {
    const before = model(standardRanking());
    const roles = standardRoles();
    roles[0].requirements[1] = sem("q_pg", "PREFERRED", "COVERS", "PCAP_PG", "PostgreSQL");
    const after = model(rankingOf(roles));
    const moves = bodyMovements(snap(before), snap(after));
    const key = roleKey({ jobPoolUploadId: POOL_A, poolRoleId: "role_platform" });
    expect(evidenceKeys(moves)).toEqual([key]);
    const was = before.bodies.find(b => b.key === key)!;
    expect(moves.get(key)).toEqual({ kind: "EVIDENCE", moved: true, from: { x: was.x, y: was.y } });
  });

  it("a changed tier moves the body (fit and tier of one read are one movement); a new role appears with no movement at all", () => {
    const roles = standardRoles();
    const before = model(rankingOf(roles));
    roles[1].requirements[0] = sem("q_k8", "REQUIRED", "COVERS", "PCAP_K8", "Kubernetes");
    roles.push({ pool: POOL_A, roleId: "role_new", title: "New", requirements: [lex("q_new", "OPTIONAL", "NAME_ALIAS", "PCAP_TS", "TypeScript")] });
    const after = model(rankingOf(roles));
    const moves = bodyMovements(snap(before), snap(after));
    expect(evidenceKeys(moves)).toContain(roleKey({ jobPoolUploadId: POOL_B, poolRoleId: "role_platform" }));
    expect(moves.has(roleKey({ jobPoolUploadId: POOL_A, poolRoleId: "role_new" })), "appearing is NONE (D-Q5)").toBe(false);
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
    expect(otherAnalysis.analysisId).not.toBe(before.analysisId);
    expect(changeKinds(before, otherAnalysis, key)).toContain("ROLE_FIT_CHANGED");
    expect(evidenceKeys(bodyMovements(snap(before), snap(sameAnalysis)))).toEqual([key]);
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
    expect([was.tier, now.tier]).toEqual(["LEXICAL_ONLY", "SEMANTIC"]);
    expect(diffRankings(before.ranking, after.ranking).filter(c => c.kind.startsWith("ROLE_")).map(c => c.kind)).toEqual(["ROLE_TIER_CHANGED"]);
    const moves = bodyMovements(snap(before), snap(after));
    expect(evidenceKeys(moves)).toEqual([key]);
    expect(moves.get(key)).toEqual({ kind: "EVIDENCE", moved: true, from: { x: was.x, y: was.y } });
  });

  it("T1 inverse and §8.9: a rank-only change is never EVIDENCE; the body that only shifted is LAYOUT — told, not animated", () => {
    const roleOf = (y: ReturnType<typeof sem>) => [
      { pool: POOL_A, roleId: "role_x", title: "Steady", requirements: [sem("q_x", "REQUIRED", "PARTIAL", "PCAP_TS", "TypeScript")] },
      { pool: POOL_A, roleId: "role_y", title: "Rising", requirements: [y] }
    ];
    const before = model(rankingOf(roleOf(sem("q_y", "REQUIRED", "DIFFERENT", "PCAP_PG", "PostgreSQL"))));
    const after = model(rankingOf(roleOf(sem("q_y", "REQUIRED", "COVERS", "PCAP_PG", "PostgreSQL"))));
    const steady = roleKey({ jobPoolUploadId: POOL_A, poolRoleId: "role_x" }), rising = roleKey({ jobPoolUploadId: POOL_A, poolRoleId: "role_y" });
    expect(changeKinds(before, after, steady)).toEqual(["ROLE_RANK_CHANGED"]);
    expect(changeKinds(before, after, rising)).toContain("ROLE_FIT_CHANGED");
    const was = before.bodies.find(b => b.key === steady)!, now = after.bodies.find(b => b.key === steady)!;
    expect([was.x, was.y], "precondition: the steady body took a new place (the rank index in its sector, A3)").not.toEqual([now.x, now.y]);
    const moves = bodyMovements(snap(before), snap(after));
    expect(evidenceKeys(moves)).toEqual([rising]);
    expect(moves.get(steady)).toEqual({ kind: "LAYOUT", moved: false, from: { x: was.x, y: was.y } });
  });

  it("D-Q5: a body that goes into overflow is not a movement (an absence, told by the count); one that comes out of it is NONE", () => {
    const base = [...crowdedRoles(40, POOL_A), ...standardRoles()];
    // 300 roles of the same fit whose titles sort first: they take the field's room ahead of the 40 (ranking ties break by title).
    const ahead = crowdedRoles(300, POOL_A).map((r, i) => ({ ...r, roleId: `role_ahead_${i}`, title: `Ahead ${String(i).padStart(3, "0")}` }));
    const many = model(rankingOf([...ahead, ...base])), few = model(rankingOf(base));
    const gone = few.bodies.filter(b => !many.bodies.some(x => x.key === b.key)).map(b => b.key);
    expect(gone.length, "precondition: some drawn bodies are overflow in the crowded reading").toBeGreaterThan(0);
    const into = bodyMovements(snap(few), snap(many)), outOf = bodyMovements(snap(many), snap(few));
    for (const key of gone) { expect(into.has(key), key).toBe(false); expect(outOf.has(key), key).toBe(false); }
    expect(many.overflowCount).toBeGreaterThan(few.overflowCount);
  });
});

describe("MAP-D-MODEL · displaced is either displacement (PINK §3.98 M8)", () => {
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
