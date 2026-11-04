import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import { browser, instance } from "../pxj-first-screen/harness";
import { POOL_A, POOL_B, available, projectionOf, rankingOf, sem, standardRanking, standardRoles, watchOf } from "./support";

/**
 * MAP-C-FOCUS-UI · the field's own state across renders (harness ../pxj-first-screen/harness.ts): a pool opens to L1 and back to L0
 * (button, sector, body, Escape); a body is marked on hover/focus, a highlight only; on L1 a body opens nothing (L2 is a later
 * phase). No interaction reads, writes or navigates: no fetch, no history entry, no storage — and no job scope (B-3).
 * A changed reading moves only the body whose own evidence changed, with a trail; an unchanged re-read moves nothing.
 */
vi.mock("react", async (importOriginal) => (await import("../pxj-first-screen/harness")).mockReact(await importOriginal<object>()));
import { PersonJobMappingField, type PersonJobMappingFieldProps } from "../../../app/components/career/demo/PersonJobMappingField";

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

  it("inverse: on L1 a click on a body opens nothing deeper (L2 is a later phase) and chooses nothing", () => {
    const view = instance<PersonJobMappingFieldProps>(PersonJobMappingField);
    const p = props();
    let tree = view.settle(p);
    fire(byTestId(tree, `mapping-pool-${POOL_A}`), "onClick");
    tree = view.settle(p);
    const before = JSON.stringify(byTestId(tree, "mapping-field")!.props["data-level"]);
    fire(byTestId(tree, bodyId(POOL_A, "role_platform")), "onClick");
    tree = view.settle(p);
    expect(JSON.stringify(byTestId(tree, "mapping-field")!.props["data-level"])).toBe(before);
    expect(byTestId(tree, "mapping-field")!.props["data-level"]).toBe("L1");
    // The field takes no job-scope callback and offers no "select this job" (B-3, B-4 stays the Job Field's).
    expect(Object.keys(p).sort()).toEqual(["locale", "projection", "ranking", "watch"]);
    expect(allByPrefix(tree, "mapping-select")).toEqual([]);
    expect([fetches, storage, tab.writes.length]).toEqual([0, 0, 0]);
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
});
