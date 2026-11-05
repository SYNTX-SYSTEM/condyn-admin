import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import { browser, instance } from "../pxj-first-screen/harness";
import { POOL_A, POOL_B, available, crowdedRoles, lex, projectionOf, rankingOf, sem, standardRanking, standardRoles, watchOf } from "./support";
import { layoutRoles } from "../../../lib/career/mapping/layout";
import { CLASS_LINE, mappingFieldModel } from "../../../lib/career/view-model/mapping-field";

/**
 * MAP-C-FOCUS-UI · the field's own state across renders (harness ../pxj-first-screen/harness.ts): a pool opens to L1 and back to L0
 * (button, sector, body, Escape); a body is marked on hover/focus, a highlight only; on L1 a body opens nothing (L2 is a later
 * phase). No interaction reads, writes or navigates: no fetch, no history entry, no storage — and no job scope (B-3).
 * A changed reading moves only the body whose own evidence changed, with a trail; an unchanged re-read moves nothing.
 */
vi.mock("react", async (importOriginal) => (await import("../pxj-first-screen/harness")).mockReact(await importOriginal<object>()));
import { LINE_DASH, PersonJobMappingField, type PersonJobMappingFieldProps } from "../../../app/components/career/demo/PersonJobMappingField";

type Tree = ReactElement<Record<string, unknown>>;
function byTestId(node: unknown, id: string): Tree | null {
  if (!node || typeof node !== "object") return null;
  if (Array.isArray(node)) { for (const child of node) { const hit = byTestId(child, id); if (hit) return hit; } return null; }
  const element = node as Tree;
  if (element.props?.["data-testid"] === id) return element;
  return byTestId(element.props?.children, id);
}
function allByPrefix(node: unknown, prefix: string, out: Tree[] = []): Tree[] {
  if (!node || typeof node !== "object") return out;
  if (Array.isArray(node)) { for (const child of node) allByPrefix(child, prefix, out); return out; }
  const element = node as Tree;
  if (typeof element.props?.["data-testid"] === "string" && (element.props["data-testid"] as string).startsWith(prefix)) out.push(element);
  allByPrefix(element.props?.children, prefix, out);
  return out;
}
const fire = (node: Tree | null, handler: string, event: Record<string, unknown> = {}) => {
  expect(node, handler).not.toBeNull();
  (node!.props[handler] as (e: unknown) => void)({ stopPropagation: () => undefined, preventDefault: () => undefined, ...event });
};
const textOf = (node: unknown): string => !node ? "" : typeof node === "string" || typeof node === "number" ? String(node) : Array.isArray(node) ? node.map(textOf).join("") : textOf((node as Tree).props?.children);

let fetches = 0, storage = 0;
let tab: ReturnType<typeof browser>;
beforeEach(() => {
  fetches = 0; storage = 0;
  tab = browser("http://127.0.0.1/career/demo?focus=CAPABILITY&investigationMode=PERSON&analysisId=CAN_00000000000000000000000000000002");
  vi.stubGlobal("window", tab.window);
  vi.stubGlobal("fetch", async () => { fetches += 1; return { status: 500, json: async () => ({}) }; });
  vi.stubGlobal("localStorage", { getItem: () => { storage += 1; return null; }, setItem: () => { storage += 1; } });
});
afterEach(() => { vi.unstubAllGlobals(); });

const props = (ranking = standardRanking()): PersonJobMappingFieldProps => ({ locale: "en", projection: projectionOf(), ranking: available(ranking), watch: watchOf("COMPLETED") });
const bodyId = (pool: string, role: string) => `mapping-body-${pool}:${role}`;

describe("MAP-C-FOCUS-UI · L0 ⇄ L1", () => {
  it("REPRODUCE: pool button → L1 (its view box, its title, an up button); up → L0; Escape → L0; nothing read, written or navigated", () => {
    const view = instance<PersonJobMappingFieldProps>(PersonJobMappingField);
    const p = props();
    let tree = view.settle(p);
    const l0Box = byTestId(tree, "mapping-field-svg")!.props.viewBox;
    expect(byTestId(tree, "mapping-field")!.props["data-level"]).toBe("L0");
    expect(byTestId(tree, "mapping-up")).toBeNull();

    fire(byTestId(tree, `mapping-pool-${POOL_B}`), "onClick");
    tree = view.settle(p);
    expect(byTestId(tree, "mapping-field")!.props).toMatchObject({ "data-level": "L1", "data-pool": POOL_B });
    expect(byTestId(tree, "mapping-field-svg")!.props.viewBox).not.toBe(l0Box);
    expect(textOf(byTestId(tree, "mapping-l1-title"))).toBe("Pool Alpha · 2 jobs");
    expect(byTestId(tree, "mapping-pools"), "the pool chips give way to the level's own header").toBeNull();
    // Bodies of other pools recede and leave the tab order.
    for (const b of allByPrefix(tree, "mapping-body-")) {
      const inPool = (b.props["data-testid"] as string).startsWith(`mapping-body-${POOL_B}:`);
      expect([b.props.opacity, b.props.tabIndex]).toEqual(inPool ? [1, 0] : [0.18, -1]);
    }

    fire(byTestId(tree, "mapping-up"), "onClick");
    tree = view.settle(p);
    expect(byTestId(tree, "mapping-field")!.props["data-level"]).toBe("L0");
    expect(byTestId(tree, "mapping-field-svg")!.props.viewBox).toBe(l0Box);

    fire(byTestId(tree, `mapping-sector-${POOL_A}`), "onClick");
    tree = view.settle(p);
    expect(byTestId(tree, "mapping-field")!.props).toMatchObject({ "data-level": "L1", "data-pool": POOL_A });
    fire(byTestId(tree, "mapping-field"), "onKeyDown", { key: "Escape" });
    tree = view.settle(p);
    expect(byTestId(tree, "mapping-field")!.props["data-level"]).toBe("L0");

    expect([fetches, storage, tab.writes.length]).toEqual([0, 0, 0]);
    view.unmount();
  });

  it("REPRODUCE: a body marks on hover and focus (its line beneath the field), clears on leave and blur; on L0 a click opens its pool", () => {
    const view = instance<PersonJobMappingFieldProps>(PersonJobMappingField);
    const p = props();
    let tree = view.settle(p);
    const id = bodyId(POOL_A, "role_platform");
    fire(byTestId(tree, id), "onMouseEnter");
    tree = view.settle(p);
    expect(byTestId(tree, id)!.props["data-marked"]).toBe("true");
    expect(textOf(byTestId(tree, "mapping-marked"))).toBe("1 · Platform Engineer · Org of Platform Engineer · Pool Beta");
    fire(byTestId(tree, id), "onMouseLeave");
    tree = view.settle(p);
    expect(byTestId(tree, id)!.props["data-marked"]).toBe("false");
    expect(textOf(byTestId(tree, "mapping-marked"))).toBe("");
    fire(byTestId(tree, id), "onFocus");
    tree = view.settle(p);
    expect(byTestId(tree, id)!.props["data-marked"]).toBe("true");
    fire(byTestId(tree, id), "onBlur");
    tree = view.settle(p);
    expect(byTestId(tree, id)!.props["data-marked"]).toBe("false");

    fire(byTestId(tree, id), "onClick");
    tree = view.settle(p);
    expect(byTestId(tree, "mapping-field")!.props).toMatchObject({ "data-level": "L1", "data-pool": POOL_A });
    expect([fetches, storage, tab.writes.length]).toEqual([0, 0, 0]);
    view.unmount();
  });

  it("phase D: on L1 a click on a body of the open pool opens its role (L2) — a look, and it chooses nothing", () => {
    const view = instance<PersonJobMappingFieldProps>(PersonJobMappingField);
    const p = props();
    let tree = view.settle(p);
    fire(byTestId(tree, `mapping-pool-${POOL_A}`), "onClick");
    tree = view.settle(p);
    fire(byTestId(tree, bodyId(POOL_A, "role_platform")), "onClick");
    tree = view.settle(p);
    expect(byTestId(tree, "mapping-field")!.props).toMatchObject({ "data-level": "L2", "data-pool": POOL_A, "data-role": `${POOL_A}:role_platform` });
    // The field takes no job-scope callback and offers no "select this job" (B-3, B-4 stays the Job Field's).
    expect(Object.keys(p).sort()).toEqual(["locale", "projection", "ranking", "watch"]);
    expect(allByPrefix(tree, "mapping-select")).toEqual([]);
    expect([fetches, storage, tab.writes.length]).toEqual([0, 0, 0]);
    view.unmount();
  });
});

describe("MAP-C-FOCUS-UI · L1 keeps its pool; its overflow and the legend (PINK §3.98 F-PC-T2)", () => {
  it("inverse: on L1 a click on a receded body of another pool changes nothing — the open pool stays, no level, no mark, no read", () => {
    const view = instance<PersonJobMappingFieldProps>(PersonJobMappingField);
    const p = props();
    let tree = view.settle(p);
    fire(byTestId(tree, `mapping-pool-${POOL_A}`), "onClick");
    tree = view.settle(p);
    const other = byTestId(tree, bodyId(POOL_B, "role_platform"))!;
    expect([other.props.opacity, other.props.tabIndex], "the other pool's body has receded").toEqual([0.18, -1]);
    fire(other, "onClick");
    tree = view.settle(p);
    expect(byTestId(tree, "mapping-field")!.props).toMatchObject({ "data-level": "L1", "data-pool": POOL_A });
    expect(textOf(byTestId(tree, "mapping-l1-title"))).toBe("Pool Beta · 1 job");
    for (const b of allByPrefix(tree, "mapping-body-")) {
      const inPool = (b.props["data-testid"] as string).startsWith(`mapping-body-${POOL_A}:`);
      expect(b.props.opacity, String(b.props["data-testid"])).toBe(inPool ? 1 : 0.18);
    }
    expect([fetches, storage, tab.writes.length]).toEqual([0, 0, 0]);
    view.unmount();
  });

  it("the overflow count follows the level: on L0 all roles not drawn, on L1 only the open pool's — none for a pool that has room", () => {
    const roles = [...crowdedRoles(320, POOL_A), ...standardRoles().filter(r => r.pool === POOL_B)];
    const ranking = rankingOf(roles);
    const m = mappingFieldModel({ projection: projectionOf(), ranking: available(ranking), watch: watchOf("COMPLETED") })!;
    const a = m.sectors.find(s => s.poolId === POOL_A)!, b = m.sectors.find(s => s.poolId === POOL_B)!;
    // Preconditions: pool A overflows, pool B has room, and the sector's count is not the total (so L1 cannot pass with L0's figure).
    expect(a.overflow).toBeGreaterThan(0);
    expect(b.overflow).toBe(0);
    const view = instance<PersonJobMappingFieldProps>(PersonJobMappingField);
    const p = props(ranking);
    let tree = view.settle(p);
    expect(byTestId(tree, "mapping-overflow")!.props["data-count"]).toBe(m.overflowCount);
    fire(byTestId(tree, `mapping-pool-${POOL_B}`), "onClick");
    tree = view.settle(p);
    expect(byTestId(tree, "mapping-field")!.props["data-pool"]).toBe(POOL_B);
    expect(byTestId(tree, "mapping-overflow"), "the open pool has room: no count on L1").toBeNull();
    fire(byTestId(tree, "mapping-up"), "onClick");
    tree = view.settle(p);
    fire(byTestId(tree, `mapping-pool-${POOL_A}`), "onClick");
    tree = view.settle(p);
    expect(byTestId(tree, "mapping-overflow")!.props["data-count"]).toBe(a.overflow);
    expect(textOf(byTestId(tree, "mapping-overflow"))).toBe(`+${a.overflow} not drawn · in the list`);
    view.unmount();
  });

  it("the overflow count on L1 is the open pool's own, also when both pools overflow", () => {
    const ranking = rankingOf([...crowdedRoles(320, POOL_A), ...crowdedRoles(200, POOL_B)]);
    const m = mappingFieldModel({ projection: projectionOf(), ranking: available(ranking), watch: watchOf("COMPLETED") })!;
    const view = instance<PersonJobMappingFieldProps>(PersonJobMappingField);
    const p = props(ranking);
    for (const pool of [POOL_A, POOL_B]) {
      const sector = m.sectors.find(s => s.poolId === pool)!;
      expect(sector.overflow, pool).toBeGreaterThan(0);
      expect(sector.overflow, "a sector's count is not the total").toBeLessThan(m.overflowCount);
      let tree = view.settle(p);
      fire(byTestId(tree, `mapping-pool-${pool}`), "onClick");
      tree = view.settle(p);
      expect(byTestId(tree, "mapping-overflow")!.props["data-count"], pool).toBe(sector.overflow);
      fire(byTestId(tree, "mapping-up"), "onClick");
    }
    view.unmount();
  });

  it("the legend draws each class with its own line from the sign table: SEMANTIC solid, LEXICAL dotted, NONE open — three different dashes", () => {
    const view = instance<PersonJobMappingFieldProps>(PersonJobMappingField);
    const tree = view.settle(props());
    const circleOf = (node: unknown): Tree | null => {
      if (!node || typeof node !== "object") return null;
      if (Array.isArray(node)) { for (const child of node) { const hit = circleOf(child); if (hit) return hit; } return null; }
      const element = node as Tree;
      return element.type === "circle" ? element : circleOf(element.props?.children);
    };
    const dashes = (["SEMANTIC", "LEXICAL", "NONE"] as const).map(cls => {
      const circle = circleOf(byTestId(tree, `mapping-legend-${cls}`));
      expect(circle, cls).not.toBeNull();
      expect(circle!.props.strokeDasharray, cls).toBe(LINE_DASH[CLASS_LINE[cls]](1, 2 * Math.PI * 5));
      return circle!.props.strokeDasharray as string | undefined;
    });
    expect(dashes[0], "SEMANTIC is solid").toBeUndefined();
    expect(dashes[1], "LEXICAL is dotted").toBeTypeOf("string");
    expect(dashes[2], "NONE is open").toBeTypeOf("string");
    expect(new Set(dashes).size).toBe(3);
    view.unmount();
  });
});

describe("MAP-C-TIME · movement on new evidence only", () => {
  it("REPRODUCE: a new reading with one changed fit moves that body with a trail; an equal re-read moves nothing", () => {
    const view = instance<PersonJobMappingFieldProps>(PersonJobMappingField);
    const first = props(standardRanking());
    let tree = view.settle(first);
    expect(allByPrefix(tree, "mapping-trail-")).toEqual([]);
    const roles = standardRoles();
    roles[0].requirements[1] = sem("q_pg", "PREFERRED", "COVERS", "PCAP_PG", "PostgreSQL");
    const changed = { ...first, ranking: available(rankingOf(roles)) };
    tree = view.settle(changed);
    const id = bodyId(POOL_A, "role_platform");
    expect(byTestId(tree, id)!.props["data-moved"]).toBe("true");
    expect((byTestId(tree, id)!.props.style as Record<string, string>).transition).toMatch(/^transform 0\.8s/);
    expect(allByPrefix(tree, "mapping-trail-").map(t => t.props["data-testid"])).toEqual([`mapping-trail-${POOL_A}:role_platform`]);
    for (const b of allByPrefix(tree, "mapping-body-")) if (b.props["data-testid"] !== id) expect(b.props["data-moved"], String(b.props["data-testid"])).toBe("false");

    // The same content read again (a new object): nothing moves, no trail.
    tree = view.settle({ ...changed, ranking: available(rankingOf(roles)), watch: watchOf("COMPLETED") });
    expect(allByPrefix(tree, "mapping-trail-")).toEqual([]);
    expect(allByPrefix(tree, "mapping-body-").every(b => b.props["data-moved"] === "false")).toBe(true);
    expect([fetches, storage, tab.writes.length]).toEqual([0, 0, 0]);
    view.unmount();
  });
  it("T3: a tier-only change marks the body moved, its trail from where it was; T1 inverse: a rank-only change marks nothing (PINK §3.98)", () => {
    const view = instance<PersonJobMappingFieldProps>(PersonJobMappingField);
    const roles = (r: ReturnType<typeof sem>, y: ReturnType<typeof sem>) => [
      { pool: POOL_A, roleId: "role_r", title: "Tiered", requirements: [r] },
      { pool: POOL_B, roleId: "role_x", title: "Steady", requirements: [sem("q_x", "REQUIRED", "PARTIAL", "PCAP_TS", "TypeScript")] },
      { pool: POOL_B, roleId: "role_y", title: "Rising", requirements: [y] }
    ];
    const lexical = lex("q_r", "REQUIRED", "NAME_EXACT", "PCAP_K8", "Kubernetes"), semantic = sem("q_r", "REQUIRED", "PARTIAL", "PCAP_K8", "Kubernetes");
    const low = sem("q_y", "REQUIRED", "DIFFERENT", "PCAP_PG", "PostgreSQL"), high = sem("q_y", "REQUIRED", "COVERS", "PCAP_PG", "PostgreSQL");
    let tree = view.settle(props(rankingOf(roles(lexical, low))));
    const tiered = bodyId(POOL_A, "role_r");
    const was = byTestId(tree, tiered)!.props["data-tier"];
    // Step 1, tier only: role_r's tier changes, its fit and the others stay.
    tree = view.settle(props(rankingOf(roles(semantic, low))));
    expect([was, byTestId(tree, tiered)!.props["data-tier"]]).toEqual(["LEXICAL_ONLY", "SEMANTIC"]);
    expect(byTestId(tree, tiered)!.props["data-moved"]).toBe("true");
    expect(allByPrefix(tree, "mapping-trail-").map(t => t.props["data-testid"])).toEqual([`mapping-trail-${POOL_A}:role_r`]);
    // Step 2, rank only for role_x: role_y's fit rises past it in pool B; role_x keeps tier and fit.
    const steady = bodyId(POOL_B, "role_x");
    const rankBefore = byTestId(tree, steady)!.props["data-rank"];
    tree = view.settle(props(rankingOf(roles(semantic, high))));
    expect(byTestId(tree, steady)!.props["data-rank"], "precondition: role_x's rank changed").not.toBe(rankBefore);
    expect(byTestId(tree, steady)!.props["data-moved"]).toBe("false");
    expect(byTestId(tree, bodyId(POOL_B, "role_y"))!.props["data-moved"]).toBe("true");
    expect(allByPrefix(tree, "mapping-trail-").map(t => t.props["data-testid"])).toEqual([`mapping-trail-${POOL_B}:role_y`]);
    view.unmount();
  });

  it("C13: only a body marked moved carries the movement transition — every other body has none, in every reading (PINK §3.99 F-RC-T1)", () => {
    const view = instance<PersonJobMappingFieldProps>(PersonJobMappingField);
    const transitions = (tree: unknown) => allByPrefix(tree, "mapping-body-").map(b => [b.props["data-testid"], b.props["data-moved"], (b.props.style as Record<string, string>).transition] as const);
    const holds = (tree: unknown, step: string) => {
      const all = transitions(tree);
      expect(all.length, step).toBeGreaterThan(0);
      for (const [id, moved, transition] of all) {
        if (moved === "true") expect(transition, `${step} ${String(id)}`).toMatch(/^transform 0\.8s/);
        else expect(transition, `${step} ${String(id)}`).toBe("none");
      }
      return all.filter(([, moved]) => moved === "true").map(([id]) => id);
    };
    const roles = (y: ReturnType<typeof sem>) => [
      { pool: POOL_B, roleId: "role_x", title: "Steady", requirements: [sem("q_x", "REQUIRED", "PARTIAL", "PCAP_TS", "TypeScript")] },
      { pool: POOL_B, roleId: "role_y", title: "Rising", requirements: [y] },
      ...crowdedRoles(40, POOL_A)
    ];
    const low = sem("q_y", "REQUIRED", "DIFFERENT", "PCAP_PG", "PostgreSQL"), high = sem("q_y", "REQUIRED", "COVERS", "PCAP_PG", "PostgreSQL");
    // First reading: nothing has moved. Then role_y's fit rises past role_x (rank only for role_x, and the layout may place it anew — A3).
    expect(holds(view.settle(props(rankingOf(roles(low)))), "first reading")).toEqual([]);
    const tree = view.settle(props(rankingOf(roles(high))));
    expect(holds(tree, "fit change"), "only the role with new evidence").toEqual([bodyId(POOL_B, "role_y")]);
    expect(byTestId(tree, bodyId(POOL_B, "role_x"))!.props["data-moved"], "precondition: role_x changed rank only").toBe("false");
    // The same content again: nothing moves, so no body has a transition.
    expect(holds(view.settle(props(rankingOf(roles(high)))), "equal re-read")).toEqual([]);
    view.unmount();
  });
});

describe("MAP-C-RENDER · displaced (PINK §3.98 M8)", () => {
  it("a body pushed only along its sector (radial 0, angular ≠ 0) is drawn as displaced", () => {
    const ranking = rankingOf([...crowdedRoles(40, POOL_A), ...standardRoles()]);
    const m = mappingFieldModel({ projection: projectionOf(), ranking: available(ranking), watch: watchOf("COMPLETED") })!;
    const layout = layoutRoles(m.view.pools.map(p => ({ id: p.id, name: p.name })), m.view.roles.map(r => ({ poolId: r.id.jobPoolUploadId, roleId: r.id.poolRoleId, rank: r.rank, tier: r.tier, fit: r.fit, weightSum: r.weightSum })));
    const angularOnly = layout.bodies.filter(b => !b.overflow && b.displacement[0] === 0 && b.displacement[1] !== 0);
    const still = layout.bodies.filter(b => !b.overflow && b.displacement[0] === 0 && b.displacement[1] === 0);
    expect(angularOnly.length, "precondition: the fixture has angular-only bodies").toBeGreaterThan(0);
    const view = instance<PersonJobMappingFieldProps>(PersonJobMappingField);
    const tree = view.settle(props(ranking));
    for (const b of angularOnly) expect(byTestId(tree, bodyId(b.poolId, b.roleId))!.props["data-displaced"], b.roleId).toBe("true");
    for (const b of still) expect(byTestId(tree, bodyId(b.poolId, b.roleId))!.props["data-displaced"], b.roleId).toBe("false");
    view.unmount();
  });
});
