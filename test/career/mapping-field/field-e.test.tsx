import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import signTable from "../../../docs/architecture/decision-fields/mapping-spec/sign-table.json";
import { browser, instance } from "../pxj-first-screen/harness";
import { CAPS, POOL_A, POOL_B, available, classRoles, lex, projectionOf, rankingOf, sem, standardRoles, watchOf } from "./support";
import { STATES, allStates, keyCases, manyCapabilities, reqOf } from "./support-d";
import { mappingFieldModel, type MappingFieldModel } from "../../../lib/career/view-model/mapping-field";

/**
 * MAP-E-FIELD · PERSON_X_JOB_MAPPING_PHASE_E.md §7 at the drawing (GRÜN), read from what the component renders — attributes, styles,
 * sizes — and held to the CONTRACT's numbers, written here a second time. The window measurements of P-7 and the running clock of
 * P-3/P-6 are taken in a real browser (GRÜN's measurement record); here are the parts a render can decide.
 */
vi.mock("react", async (importOriginal) => (await import("../pxj-first-screen/harness")).mockReact(await importOriginal<object>()));
import { PersonJobMappingField, type PersonJobMappingFieldProps } from "../../../app/components/career/demo/PersonJobMappingField";

const CONTRACT = Object.freeze({ primaryLuminance: 0.22, bandStep: 1.6, strokePx: 1.2, beamPx: 1.0, textPx: 11, floorPx: 12, queryPx: 1.5, contextGain: 0.18 });

type Tree = ReactElement<Record<string, unknown>>;
function byTestId(node: unknown, id: string): Tree | null {
  if (!node || typeof node !== "object") return null;
  if (Array.isArray(node)) { for (const child of node) { const hit = byTestId(child, id); if (hit) return hit; } return null; }
  const element = node as Tree;
  if (element.props?.["data-testid"] === id) return element;
  return byTestId(element.props?.children, id);
}
function all(node: unknown, match: (e: Tree) => boolean, out: Tree[] = []): Tree[] {
  if (!node || typeof node !== "object") return out;
  if (Array.isArray(node)) { for (const child of node) all(child, match, out); return out; }
  const element = node as Tree;
  if (match(element)) out.push(element);
  all(element.props?.children, match, out);
  return out;
}
const byPrefix = (node: unknown, prefix: string) => all(node, e => typeof e.props?.["data-testid"] === "string" && (e.props["data-testid"] as string).startsWith(prefix));
const bodies = (node: unknown) => all(node, e => e.props?.["data-mapping-body"] === true);
const fire = (node: Tree | null, handler: string, event: Record<string, unknown> = {}) => {
  expect(node, handler).not.toBeNull();
  (node!.props[handler] as (e: unknown) => void)({ stopPropagation: () => undefined, preventDefault: () => undefined, key: "Escape", ...event });
};
const textOf = (node: unknown): string => !node ? "" : typeof node === "string" || typeof node === "number" ? String(node) : Array.isArray(node) ? node.map(textOf).join("") : textOf((node as Tree).props?.children);

let fetches = 0, storage = 0;
let tab: ReturnType<typeof browser>;
beforeEach(() => {
  fetches = 0; storage = 0;
  tab = browser("http://127.0.0.1/career/demo?focus=MAPPING&investigationMode=PERSON&analysisId=CAN_00000000000000000000000000000002");
  vi.stubGlobal("window", tab.window);
  vi.stubGlobal("fetch", async () => { fetches += 1; return { status: 500, json: async () => ({}) }; });
  vi.stubGlobal("localStorage", { getItem: () => { storage += 1; return null; }, setItem: () => { storage += 1; } });
  vi.stubGlobal("sessionStorage", { getItem: () => { storage += 1; return null; }, setItem: () => { storage += 1; } });
});
afterEach(() => { vi.unstubAllGlobals(); });

/** The standard reading of phase D's visual acceptance: the ten states, the key cases, the three standard roles. */
const roles = () => [allStates(), keyCases(), ...standardRoles()];
const props = (rs = roles(), caps: ReadonlyArray<{ key: string; name: string }> = CAPS, watch = watchOf("COMPLETED")): PersonJobMappingFieldProps =>
  ({ locale: "en", projection: projectionOf(caps), ranking: available(rankingOf(rs)), watch });
const modelOf = (p: PersonJobMappingFieldProps) => mappingFieldModel({ projection: p.projection, ranking: p.ranking, watch: p.watch })!;
const field = (tree: unknown) => byTestId(tree, "mapping-field")!;
/** User units per screen pixel of the drawing as rendered (the harness has no layout, so the stage's own fallback width applies). */
const kOf = (tree: unknown) => {
  const svg = byTestId(tree, "mapping-field-svg")!;
  const width = Number((svg.props.viewBox as string).split(" ")[2]);
  return width / Number(svg.props["data-drawn-px"] ?? 960);
};
const quiet = () => expect([fetches, storage, tab.writes.length], "nothing read, stored, written or navigated").toEqual([0, 0, 0]);
function open(view: ReturnType<typeof instance<PersonJobMappingFieldProps>>, p: PersonJobMappingFieldProps, pool: string, role?: string, requirement?: string) {
  let tree = view.settle(p);
  fire(byTestId(tree, `mapping-pool-${pool}`), "onClick"); tree = view.settle(p);
  if (role !== undefined) { fire(byTestId(tree, `mapping-body-${pool}:${role}`), "onClick"); tree = view.settle(p); }
  if (requirement !== undefined) { fire(byTestId(tree, `mapping-arc-${requirement}`), "onClick"); tree = view.settle(p); }
  return tree;
}

/** E-2 / A-8 recomputed here from the model's rings, independently of the component: the strongest beam-bearing coupling per body. */
function expectedPrimary(model: MappingFieldModel) {
  const nodes = new Set(model.constellation.nodes.map(n => n.key));
  return model.bodies.map(body => {
    const candidates = body.arcs.map((arc, index) => ({ arc, index })).filter(({ arc }) => arc.coupling !== null && arc.sign.beam !== "none");
    candidates.sort((a, b) => b.arc.value - a.arc.value || a.index - b.index || (a.arc.poolRequirementId < b.arc.poolRequirementId ? -1 : 1));
    const best = candidates[0]?.arc ?? null;
    const drawable = best !== null && best.coupling!.keyStatus === "KNOWN" && best.coupling!.capabilityKey !== null && nodes.has(best.coupling!.capabilityKey);
    return { key: `${body.id.jobPoolUploadId}:${body.id.poolRoleId}`, best, drawable };
  });
}

describe("MAP-E-FIELD · P-1 / E-2 — relation ink at L0", () => {
  it("REPRODUCE: at L0 the drawn beams are exactly one per body with a drawable strongest coupling, faint, PRIMARY — and > 0 for the standard reading", () => {
    const view = instance<PersonJobMappingFieldProps>(PersonJobMappingField);
    const p = props();
    const tree = view.settle(p);
    const expected = expectedPrimary(modelOf(p));
    const beams = byPrefix(tree, "mapping-beam-");
    expect(beams.length, "kills M-1").toBeGreaterThan(0);
    expect(beams.length).toBe(expected.filter(e => e.drawable).length);
    expect(beams.map(b => b.props["data-testid"]).sort()).toEqual(expected.filter(e => e.drawable).map(e => `mapping-beam-${e.key}:${e.best!.poolRequirementId}`).sort());
    for (const b of beams) {
      expect(b.props["data-beam-rank"]).toBe("PRIMARY");
      expect(String(b.props.stroke)).toMatch(new RegExp(`, ${CONTRACT.primaryLuminance}\\)$`));
    }
    expect(field(tree).props["data-beams"]).toBe(beams.length);
    view.unmount();
  });

  it("a body whose strongest coupling starts nowhere in the person draws none — the field says so; a weaker drawable one is NOT drawn instead", () => {
    const view = instance<PersonJobMappingFieldProps>(PersonJobMappingField);
    const p = props();
    const tree = view.settle(p);
    const keys = expectedPrimary(modelOf(p)).find(e => e.key === `${POOL_B}:role_keys`)!;
    expect([keys.best?.poolRequirementId, keys.drawable], "precondition: the strongest is the coupling to a capability not in the person").toEqual(["q_foreign", false]);
    expect(byPrefix(tree, `mapping-beam-${POOL_B}:role_keys`)).toEqual([]);
    expect(byTestId(tree, "mapping-primary-undrawn")!.props["data-count"]).toBe(1);
    view.unmount();
  });

  it("beyond the constellation: no beam, and the phase-D undrawn counter keeps counting at L0", () => {
    const view = instance<PersonJobMappingFieldProps>(PersonJobMappingField);
    const p = props([{ pool: POOL_A, roleId: "role_far", title: "Far", requirements: [lex("q_far", "REQUIRED", "NAME_EXACT", "PCAP_074", "Capability 074")] }], manyCapabilities(75));
    const tree = view.settle(p);
    expect(byPrefix(tree, "mapping-beam-")).toEqual([]);
    expect(byTestId(tree, "mapping-beams-undrawn")!.props["data-count"]).toBe(1);
    view.unmount();
  });

  it("beyond the strongest stays on selection: L1 without a mark draws none; a capability's selection adds its own beams as SELECTION", () => {
    const view = instance<PersonJobMappingFieldProps>(PersonJobMappingField);
    const p = props();
    let tree = view.settle(p);
    fire(byTestId(tree, "mapping-capability-PCAP_TS"), "onClick"); tree = view.settle(p);
    const ranks = byPrefix(tree, "mapping-beam-").map(b => b.props["data-beam-rank"]);
    expect(ranks).toContain("SELECTION");
    fire(byTestId(tree, "mapping-capability-PCAP_TS"), "onClick"); tree = view.settle(p);
    fire(byTestId(tree, `mapping-pool-${POOL_A}`), "onClick"); tree = view.settle(p);
    expect(byPrefix(tree, "mapping-beam-")).toEqual([]);
    view.unmount();
  });
});

describe("MAP-E-FIELD · P-2 / E-1 — evidence on luminance alone, per group (A-3, A-6)", () => {
  const bandsOf = (arcs: Tree[]) => {
    const by: Record<string, number[]> = {};
    for (const a of arcs) (by[String(a.props["data-class"])] ??= []).push(Number(a.props.opacity));
    return by;
  };
  const separated = (by: Record<string, number[]>, label: string) => {
    const order = ["SEMANTIC", "LEXICAL", "NONE"].filter(c => by[c] !== undefined);
    expect(order.length, `${label}: more than one class in view`).toBeGreaterThan(1);
    for (let i = 0; i + 1 < order.length; i += 1) {
      const lowOfHigher = Math.min(...by[order[i]]), highOfLower = Math.max(...by[order[i + 1]]);
      expect(lowOfHigher / highOfLower, `${label}: ${order[i]} over ${order[i + 1]}`).toBeGreaterThanOrEqual(CONTRACT.bandStep);
    }
  };

  it("REPRODUCE (kills M-4, M-4a): at L2 the ten states' arcs fall into three luminance bands, ordered and ≥ 1.6× apart", () => {
    const view = instance<PersonJobMappingFieldProps>(PersonJobMappingField);
    const tree = open(view, props(), POOL_A, "role_all");
    const arcs = all(byTestId(tree, "mapping-ring"), e => e.props?.["data-mapping-arc"] === true);
    expect(arcs.length).toBe(10);
    separated(bandsOf(arcs), "L2 ring");
    view.unmount();
  });

  it("the focused group is never dimmed: L2 with a capability selected and L3 with an arc open keep every arc's own band", () => {
    const view = instance<PersonJobMappingFieldProps>(PersonJobMappingField);
    const p = props();
    let tree = open(view, p, POOL_A, "role_all", reqOf("PARTIAL"));
    separated(bandsOf(all(byTestId(tree, "mapping-ring"), e => e.props?.["data-mapping-arc"] === true)), "L3");
    fire(byTestId(tree, "mapping-up"), "onClick"); tree = view.settle(p);
    fire(byTestId(tree, "mapping-capability-PCAP_TS"), "onClick"); tree = view.settle(p);
    const arcs = all(byTestId(tree, "mapping-ring"), e => e.props?.["data-mapping-arc"] === true);
    separated(bandsOf(arcs), "L2 with selection");
    expect(arcs.some(a => a.props["data-emphasis"] === "true"), "the query emphasis rides the width").toBe(true);
    view.unmount();
  });

  it("at L0 the collars of the whole field read the same bands; at L1 another pool is context at one common gain — its internal ratios kept", () => {
    const view = instance<PersonJobMappingFieldProps>(PersonJobMappingField);
    const p = props();
    let tree = view.settle(p);
    separated(bandsOf(all(tree, e => e.props?.["data-mapping-arc"] === true)), "L0 collars");
    fire(byTestId(tree, `mapping-pool-${POOL_B}`), "onClick"); tree = view.settle(p);
    const context = bodies(tree).filter(b => b.props["data-in-pool"] === "false");
    expect(context.length).toBeGreaterThan(0);
    for (const b of context) expect(b.props.opacity, "one common gain on the context group").toBe(CONTRACT.contextGain);
    for (const b of bodies(tree).filter(b => b.props["data-in-pool"] === "true")) expect(b.props.opacity, "the focused group is never dimmed").toBe(1);
    view.unmount();
  });
});

describe("MAP-E-FIELD · P-3 / E-3 — the query moves exactly one group, at one phase", () => {
  it("REPRODUCE: selecting a capability sets exactly its coupled bodies in motion, no other; another selection moves only its own; clearing stops it", () => {
    const view = instance<PersonJobMappingFieldProps>(PersonJobMappingField);
    const p = props();
    const model = modelOf(p);
    let tree = view.settle(p);
    expect(all(tree, e => e.props?.["data-motion"] === "QUERY")).toEqual([]);
    for (const key of ["PCAP_K8", "PCAP_TS"]) {
      fire(byTestId(tree, `mapping-capability-${key}`), "onClick"); tree = view.settle(p);
      const coupled = new Set(model.view.couplings.filter(c => c.capabilityKey === key).map(c => `${c.role.jobPoolUploadId}:${c.role.poolRoleId}`));
      const moving = bodies(tree).filter(b => all(b, e => e.props?.["data-motion"] === "QUERY").length > 0).map(b => String(b.props["data-testid"]).replace("mapping-body-", ""));
      expect(moving.sort(), key).toEqual([...coupled].filter(k => model.bodies.some(b => `${b.id.jobPoolUploadId}:${b.id.poolRoleId}` === k)).sort());
      expect(moving.length, `${key}: a group exists`).toBeGreaterThan(0);
      // One phase: no member carries anything of its own that could shift it (delay, duration, inline animation).
      for (const m of all(tree, e => e.props?.["data-motion"] === "QUERY")) expect(m.props.style, key).toBeUndefined();
      // One group: every moving element belongs to the one selected capability.
      expect(field(tree).props["data-capability"]).toBe(key);
      fire(byTestId(tree, `mapping-capability-${key}`), "onClick"); tree = view.settle(p);
      expect(all(tree, e => e.props?.["data-motion"] === "QUERY"), `${key} cleared`).toEqual([]);
    }
    view.unmount();
  });

  it("the amplitude is 1.5 screen px in the drawing's own units", () => {
    const view = instance<PersonJobMappingFieldProps>(PersonJobMappingField);
    const tree = view.settle(props());
    expect((field(tree).props.style as Record<string, string>)["--mf-query-amp"]).toBe(`${Math.round(CONTRACT.queryPx * kOf(tree) * 1000) / 1000}px`);
    view.unmount();
  });
});

describe("MAP-E-FIELD · P-4 / E-4 — evidence is cut and lit; layout eases", () => {
  it("REPRODUCE: own fit changes → data-change=EVIDENCE at its new place; a neighbour only displaced → data-change=LAYOUT; both stated (E-9)", () => {
    const view = instance<PersonJobMappingFieldProps>(PersonJobMappingField);
    const rs = (x: ReturnType<typeof sem>) => [
      { pool: POOL_A, roleId: "role_y", title: "Steady", requirements: [sem("q_y", "REQUIRED", "PARTIAL", "PCAP_TS", "TypeScript")] },
      { pool: POOL_A, roleId: "role_x", title: "Rising", requirements: [x] }
    ];
    let tree = view.settle(props(rs(sem("q_x", "REQUIRED", "DIFFERENT", "PCAP_PG", "PostgreSQL"))));
    const before = Object.fromEntries(bodies(tree).map(b => [b.props["data-testid"], (b.props.style as Record<string, string>).transform]));
    tree = view.settle(props(rs(sem("q_x", "REQUIRED", "COVERS", "PCAP_PG", "PostgreSQL"))));
    const x = byTestId(tree, `mapping-body-${POOL_A}:role_x`)!, y = byTestId(tree, `mapping-body-${POOL_A}:role_y`)!;
    expect([x.props["data-change"], y.props["data-change"]]).toEqual(["EVIDENCE", "LAYOUT"]);
    expect((x.props.style as Record<string, string>).transform, "own evidence: the place is the new one at once (cut)").not.toBe(before[`mapping-body-${POOL_A}:role_x`]);
    for (const b of [x, y]) expect(Object.keys(b.props.style as object).filter(k => /transition|animation|filter|opacity/i.test(k)), "no inline motion: the forms are the stylesheet's").toEqual([]);
    expect([x.props.opacity, y.props.opacity], "a LAYOUT change has no luminance change").toEqual([1, 1]);
    expect(byTestId(tree, "mapping-delta-evidence")!.props["data-count"]).toBe(1);
    expect(byTestId(tree, "mapping-layout-shifts")!.props["data-count"]).toBe(1);
    expect([byTestId(tree, `mapping-trail-${POOL_A}:role_x`) !== null, byTestId(tree, `mapping-layout-shift-${POOL_A}:role_y`) !== null], "each marked on itself").toEqual([true, true]);
    // An equal re-read: nothing changes, nothing is stated.
    tree = view.settle(props(rs(sem("q_x", "REQUIRED", "COVERS", "PCAP_PG", "PostgreSQL"))));
    expect(bodies(tree).map(b => b.props["data-change"] ?? null)).toEqual(bodies(tree).map(() => null));
    expect([byTestId(tree, "mapping-delta-evidence"), byTestId(tree, "mapping-layout-shifts")]).toEqual([null, null]);
    view.unmount();
  });
});

describe("MAP-E-FIELD · P-5 / E-6 — the breath stops while anything is pending", () => {
  it("REPRODUCE: LIVE only when the run is settled and nothing is due; RUNNING, STALLED and a due continuation are STILL — with a still outline each", () => {
    const view = instance<PersonJobMappingFieldProps>(PersonJobMappingField);
    const ring = (tree: unknown) => byTestId(tree, "mapping-ring-field")!.props["data-breath"];
    const at = (watch: ReturnType<typeof watchOf>) => view.settle(props(roles(), CAPS, watch));
    expect(ring(at(watchOf("COMPLETED")))).toBe("LIVE");
    const running = at(watchOf("RUNNING"));
    expect([ring(running), field(running).props["data-pending-breath"]]).toEqual(["STILL", "true"]);
    expect(ring(at(watchOf("STALLED")))).toBe("STILL");
    const due = at(watchOf("PARTIAL", { resumePending: true }));
    expect([ring(due), byTestId(due, "mapping-resume-outline") !== null]).toEqual(["STILL", true]);
    const outline = byTestId(due, "mapping-resume-outline")!, pending = byTestId(due, "mapping-pending-outline")!;
    expect([outline.props.strokeDasharray, outline.props.r], "visually distinct from the pending outline").not.toEqual([pending.props.strokeDasharray, pending.props.r]);
    for (const b of bodies(running)) expect(b.props.style, "no body breathes while pending").not.toHaveProperty("animation");
    view.unmount();
  });
});

describe("MAP-E-FIELD · P-8 / E-7 — legible at every level", () => {
  it("REPRODUCE: every SVG text ≥ 11 px, every structure stroke ≥ 1.2 px, every beam ≥ 1.0 px; every HTML text ≥ 11 px — at L0, L1, L2, L3", () => {
    const view = instance<PersonJobMappingFieldProps>(PersonJobMappingField);
    const p = props();
    const check = (tree: unknown, level: string) => {
      const k = kOf(tree);
      const svg = byTestId(tree, "mapping-field-svg")!;
      for (const t of all(svg, e => e.type === "text")) expect(Number(t.props.fontSize) / k, `${level} text "${textOf(t).slice(0, 20)}"`).toBeGreaterThanOrEqual(CONTRACT.textPx);
      const beams = new Set(byPrefix(tree, "mapping-beam-"));
      for (const s of all(svg, e => ["circle", "path", "line", "rect"].includes(String(e.type)) && e.props.stroke !== undefined && e.props.stroke !== "none")) {
        if (String(s.props.stroke).endsWith(", 0)") || s.props["data-mapping-hit"] !== undefined || s.props.strokeWidth === undefined) continue;
        if (s.props["data-testid"] === "mapping-ring-shelf") continue; // a band, its width is the shelf itself
        const width = Number(s.props.strokeWidth) / k;
        if (Number(s.props.strokeWidth) === 0) continue;
        expect(width, `${level} ${String(s.props["data-testid"] ?? s.type)}`).toBeGreaterThanOrEqual(beams.has(s) ? CONTRACT.beamPx : CONTRACT.strokePx);
      }
      for (const e of all(tree, e => typeof e.props?.style === "object" && e.props.style !== null && "fontSize" in (e.props.style as object)))
        expect(parseFloat(String((e.props.style as Record<string, string>).fontSize)), `${level} HTML ${String(e.props["data-testid"] ?? e.type)}`).toBeGreaterThanOrEqual(CONTRACT.textPx);
    };
    let tree = view.settle(p);
    check(tree, "L0");
    fire(byTestId(tree, "mapping-capability-PCAP_TS"), "onClick"); tree = view.settle(p);
    check(tree, "L0+selection");
    fire(byTestId(tree, "mapping-capability-PCAP_TS"), "onClick"); tree = view.settle(p);
    fire(byTestId(tree, `mapping-pool-${POOL_A}`), "onClick"); tree = view.settle(p);
    check(tree, "L1");
    fire(byTestId(tree, `mapping-body-${POOL_A}:role_all`), "onMouseEnter"); tree = view.settle(p);
    check(tree, "L1+mark");
    fire(byTestId(tree, `mapping-body-${POOL_A}:role_all`), "onClick"); tree = view.settle(p);
    check(tree, "L2");
    fire(byTestId(tree, `mapping-arc-${reqOf("UNCLEAR")}`), "onClick"); tree = view.settle(p);
    check(tree, "L3");
    view.unmount();
  });

  it("REPRODUCE: a body below the 12 px floor is drawn AT the floor and says so; one above keeps its own size and says nothing", () => {
    const view = instance<PersonJobMappingFieldProps>(PersonJobMappingField);
    const p = props();
    const tree = view.settle(p);
    const k = kOf(tree);
    const model = modelOf(p);
    let floored = 0;
    for (const body of model.bodies) {
      const b = byTestId(tree, `mapping-body-${body.id.jobPoolUploadId}:${body.id.poolRoleId}`)!;
      const below = (2 * body.radius) / k < CONTRACT.floorPx;
      const drawn = all(b, e => e.props?.["data-mapping-body-shape"] === true)[0].props.r as number;
      expect(b.props["data-size-floor"], body.title).toBe(String(below));
      if (below) { expect((2 * drawn) / k, body.title).toBeGreaterThanOrEqual(CONTRACT.floorPx); expect((2 * drawn) / k, body.title).toBeLessThan(CONTRACT.floorPx + 0.01); }
      else expect(drawn, `${body.title}: its own size`).toBe(body.radius);
      if (below) floored += 1;
    }
    expect(floored, "the standard reading has bodies at the floor (M-3)").toBeGreaterThan(0);
    expect(byTestId(tree, "mapping-size-floor")!.props["data-count"]).toBe(floored);
    view.unmount();
  });

  it("REPRODUCE: capability nodes carry their name at every level; body names at L1+ and on mark or selection at L0", () => {
    const view = instance<PersonJobMappingFieldProps>(PersonJobMappingField);
    const p = props();
    const names = (tree: unknown) => byPrefix(tree, "mapping-capability-name-").map(t => textOf(t)).sort();
    const bodyNames = (tree: unknown) => byPrefix(tree, "mapping-name-").map(t => textOf(t)).sort();
    let tree = view.settle(p);
    expect(names(tree)).toEqual(CAPS.map(c => c.name).sort());
    expect(bodyNames(tree), "L0: none by default").toEqual([]);
    fire(byTestId(tree, `mapping-body-${POOL_A}:role_all`), "onMouseEnter"); tree = view.settle(p);
    expect(bodyNames(tree), "L0: the marked one").toEqual(["All States"]);
    fire(byTestId(tree, `mapping-body-${POOL_A}:role_all`), "onMouseLeave"); tree = view.settle(p);
    fire(byTestId(tree, "mapping-capability-PCAP_K8"), "onClick"); tree = view.settle(p);
    expect(bodyNames(tree).length, "L0: the selected capability's roles").toBe(2);
    fire(byTestId(tree, "mapping-capability-PCAP_K8"), "onClick"); tree = view.settle(p);
    fire(byTestId(tree, `mapping-pool-${POOL_A}`), "onClick"); tree = view.settle(p);
    expect(names(tree)).toEqual(CAPS.map(c => c.name).sort());
    expect(bodyNames(tree).length, "L1: the open pool's").toBe(modelOf(p).bodies.filter(b => b.id.jobPoolUploadId === POOL_A).length);
    fire(byTestId(tree, `mapping-body-${POOL_A}:role_all`), "onClick"); tree = view.settle(p);
    expect([names(tree), bodyNames(tree)]).toEqual([CAPS.map(c => c.name).sort(), ["All States"]]);
    view.unmount();
  });
});

describe("MAP-E-FIELD · E-8 / A-1 — the stage against its own box", () => {
  it("REPRODUCE (kills M-5): sized against the section (container units) and its clamp, never the window's 100vh; the clamp is carried", () => {
    const view = instance<PersonJobMappingFieldProps>(PersonJobMappingField);
    const tree = view.settle(props());
    const style = byTestId(tree, "mapping-field-svg")!.props.style as Record<string, string>;
    expect(style.width).not.toMatch(/vh/);
    expect(style.width).toMatch(/100cqh/);
    expect((field(tree).props.style as Record<string, string>).containerType).toBe("size");
    expect(byTestId(tree, "mapping-field-svg")!.props).toHaveProperty("data-stage-clamp");
    view.unmount();
  });

  it("the sector names run on the rim inside the frame, never sideways out of it", () => {
    const view = instance<PersonJobMappingFieldProps>(PersonJobMappingField);
    const tree = view.settle(props());
    for (const name of byPrefix(tree, "mapping-sector-name-")) expect(all(name, e => e.type === "textPath").length, String(name.props["data-testid"])).toBe(1);
    view.unmount();
  });
});

describe("MAP-E-FIELD · A-4 — the phase lock's absence is stated, not left to an attribute", () => {
  it("phase-locked couplings on view → the statement stands; none on view → it does not", () => {
    const view = instance<PersonJobMappingFieldProps>(PersonJobMappingField);
    expect(byTestId(view.settle(props()), "mapping-phase-lock-still")).not.toBeNull();
    view.unmount();
    const other = instance<PersonJobMappingFieldProps>(PersonJobMappingField);
    expect(byTestId(other.settle(props(classRoles().filter(r => r.roleId !== "role_checked"))), "mapping-phase-lock-still")).toBeNull();
    other.unmount();
  });
});

describe("MAP-E-FIELD · P-10 / B-4 — model purity at the drawing", () => {
  it("REPRODUCE: L0 → selection → L1 → mark → L2 → L3 → back: 0 fetches, 0 storage reads, 0 navigations", () => {
    const view = instance<PersonJobMappingFieldProps>(PersonJobMappingField);
    const p = props();
    let tree = view.settle(p);
    fire(byTestId(tree, "mapping-capability-PCAP_TS"), "onClick"); tree = view.settle(p);
    fire(byTestId(tree, "mapping-capability-PCAP_TS"), "onClick"); tree = view.settle(p);
    tree = open(view, p, POOL_A, "role_all", reqOf("COVERS"));
    fire(field(tree), "onKeyDown"); tree = view.settle(p);
    fire(field(tree), "onKeyDown"); tree = view.settle(p);
    fire(field(tree), "onKeyDown"); tree = view.settle(p);
    expect(field(tree).props["data-level"]).toBe("L0");
    quiet();
    view.unmount();
  });
});

describe("MAP-E-FIELD · P-12 / B-5 — the ten states and their signs, unchanged", () => {
  it("REPRODUCE: each state's arc carries exactly the table's line, fill, beam, mark, phase lock and own luminance value", () => {
    const view = instance<PersonJobMappingFieldProps>(PersonJobMappingField);
    const tree = open(view, props(), POOL_A, "role_all");
    const table = signTable.couplingStates as Record<string, { class: string; arcLine: string; arcFill: number; luminance: number; beam: string; phaseLocked: boolean; mark: string }>;
    expect(Object.keys(table).sort()).toEqual([...STATES].sort());
    for (const state of STATES) {
      const a = byTestId(tree, `mapping-arc-${reqOf(state)}`)!;
      const s = table[state];
      expect({ state: a.props["data-state"], cls: a.props["data-class"], line: a.props["data-line"], fill: a.props["data-fill"], beam: a.props["data-beam"], mark: a.props["data-mark"], locked: a.props["data-phase-locked"], lum: a.props["data-luminance"] }, state)
        .toEqual({ state, cls: s.class, line: s.arcLine, fill: s.arcFill, beam: s.beam, mark: s.mark, locked: String(s.phaseLocked), lum: s.luminance });
    }
    view.unmount();
  });
});
