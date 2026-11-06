import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import { browser, instance } from "../pxj-first-screen/harness";
import { CAPS, POOL_A, available, crowdedRoles, projectionOf, rankingOf, standardRoles, watchOf } from "./support";
import { allStates, keyCases } from "./support-d";
import { fieldViewBox, mappingFieldModel } from "../../../lib/career/view-model/mapping-field";

/**
 * MAP-G-FIELD · PERSON_X_JOB_MAPPING_PHASE_G.md at the drawing (GRÜN). The light budget (PG-1/2/6/10/11/12/13) and the frame and
 * occlusion bounds on pixels (PG-14/15) are measured in a running browser; here are the structural parts a render can decide.
 */
vi.mock("react", async (importOriginal) => (await import("../pxj-first-screen/harness")).mockReact(await importOriginal<object>()));
import { BODY_BUDGET, CROWDING, DISC_OCCLUSION, l0Margin, GAP_HUE, MAPPING_FIELD_CSS, PersonJobMappingField, TRAVEL, WAVE, type PersonJobMappingFieldProps } from "../../../app/components/career/demo/PersonJobMappingField";
import { MAPPING_FIELD_COPY } from "../../../app/components/career/demo/mapping-field-copy";

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
const cls = (e: Tree) => String(e.props?.className ?? "");
const textOf = (node: unknown): string => !node ? "" : typeof node === "string" || typeof node === "number" ? String(node) : Array.isArray(node) ? node.map(textOf).join("") : textOf((node as Tree).props?.children);
const bodies = (t: unknown) => all(t, e => e.props?.["data-mapping-body"] === true);
const fire = (node: Tree | null, handler: string) => { expect(node, handler).not.toBeNull(); (node!.props[handler] as (e: unknown) => void)({ stopPropagation: () => undefined, preventDefault: () => undefined, key: "Enter" }); };

let tab: ReturnType<typeof browser>;
beforeEach(() => {
  tab = browser("http://127.0.0.1/career/demo?focus=MAPPING&investigationMode=PERSON&analysisId=CAN_00000000000000000000000000000002");
  vi.stubGlobal("window", tab.window);
  vi.stubGlobal("fetch", async () => ({ status: 500, json: async () => ({}) }));
});
afterEach(() => { vi.unstubAllGlobals(); });
const props = (rs = [allStates(), keyCases(), ...standardRoles()]): PersonJobMappingFieldProps => ({ locale: "en", projection: projectionOf(CAPS), ranking: available(rankingOf(rs)), watch: watchOf("COMPLETED") });
const modelOf = (p: PersonJobMappingFieldProps) => mappingFieldModel({ projection: p.projection, ranking: p.ranking, watch: p.watch })!;

describe("MAP-G-FIELD · G-1 / PG-21 — one dark field: no lit plate, only occlusion", () => {
  it("REPRODUCE: the one opaque disc is OCCLUSION in the stage's own ground colour (no light of its own); the medium is the faint ground and its wave; the glows are their own group, outside the medium", () => {
    const view = instance<PersonJobMappingFieldProps>(PersonJobMappingField);
    const tree = view.settle(props());
    const medium = byTestId(tree, "mapping-medium")!;
    const opaque = all(medium.props.children, e => e.type === "circle" && /^rgb\(/.test(String(e.props.fill)));
    expect(opaque.map(e => [e.props.fill, e.props.r]), "occlusion only, in the stage's ground colour (rgb 3, 5, 8: the section's own dark at alpha 1)").toEqual(DISC_OCCLUSION ? [["rgb(3, 5, 8)", 500]] : []);
    expect(all(medium.props.children, e => /\bmf-halo\b/.test(cls(e))), "no glow in the medium").toEqual([]);
    const glows = byTestId(tree, "mapping-glows")!;
    expect([glows.props["aria-hidden"], glows.props.pointerEvents]).toEqual(["true", "none"]);
    view.unmount();
  });
});

describe("MAP-G-FIELD · G-2 / PG-4 / A-G9 — a body is named, and measured without a figure", () => {
  it("REPRODUCE: every drawn body at L0 carries its name and its measure — rank and tier in words; no percent, no fit, no score", () => {
    const view = instance<PersonJobMappingFieldProps>(PersonJobMappingField);
    const p = props();
    const tree = view.settle(p);
    const drawn = bodies(tree);
    expect(drawn.length).toBeGreaterThan(0);
    for (const b of drawn) {
      const id = String(b.props["data-testid"]).replace("mapping-body-", "");
      expect(byTestId(b, `mapping-name-${id}`), `${id} named`).not.toBeNull();
      const measure = textOf(byTestId(b, `mapping-measure-${id}`));
      expect(measure, id).toBe(MAPPING_FIELD_COPY.en.measure(Number(b.props["data-rank"]), b.props["data-tier"] === "SEMANTIC"));
      expect(measure, id).not.toMatch(/%|\bfit\b|score/i);
    }
    view.unmount();
  });

  it("PG-3 / V1.1: the drawn radius is the model's (the layout's collision radius), monotone in requirement mass, never smaller than the mass radius", () => {
    const view = instance<PersonJobMappingFieldProps>(PersonJobMappingField);
    const p = props();
    const tree = view.settle(p);
    const m = modelOf(p);
    for (const b of bodies(tree)) {
      const body = m.bodies.find(x => `mapping-body-${x.id.jobPoolUploadId}:${x.id.poolRoleId}` === b.props["data-testid"])!;
      expect(Number(b.props["data-drawn-radius"]), body.title).toBeGreaterThanOrEqual(body.drawnRadius - 1e-3);
      expect(body.drawnRadius, body.title).toBeGreaterThan(body.radius);
    }
    view.unmount();
  });
});

describe("MAP-G-FIELD · PG-5 — presence is a budget, stated on its own", () => {
  // PG-16 (R23): the spacing wins and the budget shrinks — the drawn set is greedy by rank under the crowding bound, at most the budget.
  it("REPRODUCE: L0 draws by rank, at most BODY_BUDGET.L0, every pair spaced ≥ CROWDING × eccentricity (a stronger body that would crowd one drawn is left to the list); L1 likewise of its pool; the rest is mapping-beyond-budget, overflow stays overflow", () => {
    const view = instance<PersonJobMappingFieldProps>(PersonJobMappingField);
    const p = props([...crowdedRoles(30, POOL_A), ...standardRoles()]);
    const m = modelOf(p);
    let tree = view.settle(p);
    const drawnBodies = bodies(tree).map(b => m.bodies.find(x => `mapping-body-${x.id.jobPoolUploadId}:${x.id.poolRoleId}` === b.props["data-testid"])!);
    expect(m.bodies.length, "precondition: more bodies have room than L0 draws").toBeGreaterThan(BODY_BUDGET.L0);
    expect(drawnBodies.length).toBeLessThanOrEqual(BODY_BUDGET.L0);
    const spacedOk = (a: typeof drawnBodies[number], b: typeof drawnBodies[number]) => Math.hypot(a.x - b.x, a.y - b.y) - a.drawnRadius - b.drawnRadius >= CROWDING * Math.max(Math.hypot(a.x, a.y), Math.hypot(b.x, b.y));
    for (let i = 0; i < drawnBodies.length; i++) for (let j = i + 1; j < drawnBodies.length; j++) expect(spacedOk(drawnBodies[i], drawnBodies[j]), `${drawnBodies[i].title}/${drawnBodies[j].title}`).toBe(true);
    const lastDrawn = Math.max(...drawnBodies.map(b => b.rank));
    for (const skipped of m.bodies.filter(b => b.rank < lastDrawn && !drawnBodies.includes(b)))
      expect(drawnBodies.filter(d => d.rank < skipped.rank).some(d => !spacedOk(d, skipped)), `rank ${skipped.rank} left out only because it crowds a stronger drawn body`).toBe(true);
    expect(drawnBodies.some(b => b.rank === 1), "the strongest is always drawn").toBe(true);
    expect(byTestId(tree, "mapping-beyond-budget")!.props["data-count"]).toBe(m.bodies.length - drawnBodies.length);
    expect(byTestId(tree, "mapping-overflow")?.props["data-count"] ?? 0, "overflow is its own count").toBe(m.overflowCount);
    fire(byTestId(tree, `mapping-pool-${POOL_A}`), "onClick"); tree = view.settle(p);
    const inPool = bodies(tree).filter(b => b.props["data-in-pool"] === "true");
    const poolBodies = m.bodies.filter(b => b.id.jobPoolUploadId === POOL_A);
    expect(inPool.length, "L1: at most the pool's twelve").toBeLessThanOrEqual(Math.min(BODY_BUDGET.L1, poolBodies.length));
    expect(inPool.length).toBeGreaterThan(0);
    expect(byTestId(tree, "mapping-beyond-budget")?.props["data-count"] ?? 0).toBe(poolBodies.length - inPool.length);
    // every drawn beam belongs to a drawn body
    const drawnKeys = new Set(bodies(tree).map(b => String(b.props["data-testid"]).replace("mapping-body-", "")));
    for (const beam of all(tree, e => String(e.props?.["data-testid"] ?? "").startsWith("mapping-beam-"))) expect(drawnKeys.has(String(beam.props["data-testid"]).replace("mapping-beam-", "").split(":").slice(0, 2).join(":"))).toBe(true);
    view.unmount();
  });
});

describe("MAP-G-FIELD · G-4 / PG-8 — hue answers exactly one question", () => {
  it("REPRODUCE: the one hue sits exactly on the glows of bodies with an unmet REQUIRED requirement, and nowhere else in the field", () => {
    const view = instance<PersonJobMappingFieldProps>(PersonJobMappingField);
    const p = props();
    const tree = view.settle(p);
    const m = modelOf(p);
    const gaps = new Map<string, number>(m.ranking.ranks.map(r => [`${r.role.jobPoolUploadId}:${r.role.poolRoleId}`, r.requiredGaps]));
    let withGap = 0, without = 0;
    for (const b of bodies(tree)) {
      const id = String(b.props["data-testid"]).replace("mapping-body-", "");
      expect(b.props["data-required-gaps"], id).toBe(gaps.get(id));
      if (gaps.get(id)! > 0) withGap += 1; else without += 1;
    }
    expect([withGap > 0, without > 0], "precondition: both kinds drawn").toEqual([true, true]);
    // every glow — the field's and the shelf's — carries the hue exactly when its own body has an unmet REQUIRED requirement
    const glowGroups = all(byTestId(tree, "mapping-field-svg"), e => /\bmf-halo\b/.test(cls(e)));
    expect(glowGroups.length, "one glow per drawn body").toBe(withGap + without);
    for (const g of glowGroups) {
      const key = String(g.key).replace(/^halo\|/, "").replace(/#.*$/, "").replace("\u0000", ":");
      const fill = all(g.props.children, e => e.type === "circle")[0].props.fill;
      expect(fill, key).toBe(gaps.get(key)! > 0 ? "url(#mf-halo-gap)" : "url(#mf-halo)");
    }
    // nowhere else: no element in the field svg paints the hue except the gap gradient's stops
    const svg = byTestId(tree, "mapping-field-svg")!;
    const hued = all(svg, e => [e.props?.stroke, e.props?.fill, e.props?.stopColor].some(v => typeof v === "string" && v.includes(GAP_HUE)));
    expect(hued.every(e => e.type === "stop"), "only the gap gradient carries the hue").toBe(true);
    view.unmount();
  });
});

describe("MAP-G-FIELD · G-3 / PG-7 — relations carry their own light", () => {
  it("REPRODUCE: each drawn relation has its glow under it and one travelling light over it; the sign's stroke, dash and data are untouched", () => {
    const view = instance<PersonJobMappingFieldProps>(PersonJobMappingField);
    const tree = view.settle(props());
    const group = byTestId(tree, "mapping-beams")!;
    const beams = all(group, e => String(e.props?.["data-testid"] ?? "").startsWith("mapping-beam-"));
    expect(beams.length).toBeGreaterThan(0);
    expect(all(group, e => cls(e) === "mf-travel").length).toBe(beams.length);
    expect(all(group, e => cls(e) === "mf-beam-glow").length).toBe(beams.length);
    for (const t of all(group, e => cls(e) === "mf-travel" || cls(e) === "mf-beam-glow")) expect([t.props["aria-hidden"], t.props.pointerEvents, Object.keys(t.props).filter(k => k.startsWith("data-"))]).toEqual(["true", "none", []]);
    view.unmount();
  });

  it("PG-7: the travel is CSS keyed on the breath, its period an exact integer divisor of the breath's, hidden under reduced motion", () => {
    expect(MAPPING_FIELD_CSS).toContain(`[data-testid="mapping-field"][data-breath="LIVE"] .mf-travel { opacity: 1; animation: mappingFieldTravel ${TRAVEL.periodMs}ms linear infinite; }`);
    expect(Number.isInteger(WAVE.periodMs / TRAVEL.periodMs)).toBe(true);
    expect(MAPPING_FIELD_CSS).toMatch(/@media \(prefers-reduced-motion: reduce\) \{[\s\S]*\.mf-travel \{ visibility: hidden; \}/);
  });
});

describe("MAP-G-FIELD · PG-14 / PG-15 — framed whole, rings behind", () => {
  // PG-14: the widening exists for what a drawn body carries beyond its rim — the name above and the measure below (the rims of the
  // existing inputs never leave the base frame: a body on the shelf sits off the frame's axes). Read from the rendered text elements.
  it("REPRODUCE: L0 and L1 frame every drawn body whole — rim, name above, measure below — inside the viewBox; at L2 the open role's ring lies outside its drawn disc", () => {
    const view = instance<PersonJobMappingFieldProps>(PersonJobMappingField);
    const p = props();
    let tree = view.settle(p);
    const inside = (t: unknown, level: string) => {
      const [x, y, w, h] = String(byTestId(t, "mapping-field-svg")!.props.viewBox).split(" ").map(Number);
      let checked = 0;
      for (const b of bodies(t).filter(b => b.props["data-in-pool"] === "true")) {
        const [bx, by] = /translate\(([-\d.]+)px, ([-\d.]+)px\)/.exec(String((b.props.style as Record<string, string>).transform))!.slice(1).map(Number);
        const r = Number(b.props["data-drawn-radius"]), id = String(b.props["data-testid"]).replace("mapping-body-", "");
        expect(bx - r >= x && bx + r <= x + w && by - r >= y && by + r <= y + h, `${level} ${id} rim`).toBe(true);
        for (const tid of [`mapping-name-${id}`, `mapping-measure-${id}`]) {
          const text = byTestId(b, tid); if (text === null) continue;
          const font = Number(text.props.fontSize), ty = by + Number(text.props.y), half = (textOf(text).length * 0.62 * font) / 2;
          expect(ty - font >= y && ty + 0.3 * font <= y + h && bx - half >= x && bx + half <= x + w, `${level} ${tid}`).toBe(true);
          checked += 1;
        }
      }
      return checked;
    };
    const base = fieldViewBox(l0Margin(960, 500));
    expect(Number(String(byTestId(tree, "mapping-field-svg")!.props.viewBox).split(" ")[2]), "precondition: the L0 frame was widened beyond its base to hold them").toBeGreaterThan(base.width);
    expect(inside(tree, "L0")).toBeGreaterThan(0);
    fire(byTestId(tree, `mapping-pool-${POOL_A}`), "onClick"); tree = view.settle(p);
    inside(tree, "L1");
    const open = bodies(tree).find(b => b.props["data-in-pool"] === "true")!;
    fire(open, "onClick"); tree = view.settle(p);
    const ring = byTestId(tree, "mapping-ring")!;
    expect(Number(ring.props["data-radius"]), "the ring outside the drawn disc").toBeGreaterThan(Number(bodies(tree)[0].props["data-drawn-radius"]));
    view.unmount();
  });
});

describe("MAP-G-FIELD · PG-20 — the mark glyphs gain an icon for their own question", () => {
  it("REPRODUCE: DIFFERENT's two open ends splay outward (they point apart); NONE's open ends stay radial; CONSTITUENT nests a shorter arc; ALIAS echoes the arc", () => {
    const view = instance<PersonJobMappingFieldProps>(PersonJobMappingField);
    const p = props();
    let tree = view.settle(p);
    fire(byTestId(tree, `mapping-pool-${POOL_A}`), "onClick"); tree = view.settle(p);
    fire(byTestId(tree, `mapping-body-${POOL_A}:role_all`), "onClick"); tree = view.settle(p);
    const ring = byTestId(tree, "mapping-ring")!;
    const angleOf = (x: number, y: number, ox: number, oy: number) => Math.atan2(y - oy, x - ox);
    const body = bodies(tree)[0];
    const [bx, by] = /translate\(([-\d.]+)px, ([-\d.]+)px\)/.exec(String((body.props.style as Record<string, string>).transform))!.slice(1).map(Number);
    const tilt = (state: string) => all(ring, e => e.props?.["data-mapping-arc"] === true && e.props["data-state"] === state).flatMap(arc =>
      all(arc, e => e.props?.["data-arc-end"] === true).map(e => {
        const [x1, y1, x2, y2] = ["x1", "y1", "x2", "y2"].map(k => Number(e.props[k]));
        return angleOf(x2, y2, bx, by) - angleOf(x1, y1, bx, by);
      }));
    const different = tilt("DIFFERENT"), none = tilt("NONE");
    expect([different.length, none.length], "precondition: both open states drawn with their two ends").toEqual([2, 2]);
    for (const t of none) expect(Math.abs(t), "NONE: radial (to the coordinates' rounding)").toBeLessThan(1e-4);
    for (const t of different) expect(Math.abs(t), "DIFFERENT: a visible splay, far above rounding").toBeGreaterThan(0.01);
    expect(Math.sign(different[0]) * Math.sign(different[1]), "DIFFERENT: the two ends lean opposite ways").toBe(-1);
    expect(different[0], "DIFFERENT: the start end leans back, away from the end").toBeLessThan(0);
    expect(different[1], "DIFFERENT: the end end leans forward, away from the start").toBeGreaterThan(0);
    const parts = (state: string) => all(ring, e => e.props?.["data-mapping-arc"] === true && e.props["data-state"] === state).flatMap(arc => all(arc, e => e.type === "path" && e.props["data-mapping-hit"] === undefined));
    expect(parts("NAME_COMPOSITE_CONSTITUENT").length, "CONSTITUENT: the arc line and its nested arc").toBeGreaterThan(parts("WEAK_TOKEN_CONTAINMENT").length);
    expect(parts("NAME_ALIAS").length, "ALIAS: the arc, its fill and its echo").toBeGreaterThan(parts("NAME_EXACT").length);
    view.unmount();
  });
});
