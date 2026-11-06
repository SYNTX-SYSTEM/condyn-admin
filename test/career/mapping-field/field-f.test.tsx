import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import { browser, instance } from "../pxj-first-screen/harness";
import { CAPS, POOL_A, available, projectionOf, rankingOf, sem, standardRoles, watchOf } from "./support";
import { allStates, keyCases } from "./support-d";

/**
 * MAP-F-FIELD · PERSON_X_JOB_MAPPING_PHASE_F.md at the drawing (GRÜN). The medium's perceptual bounds (PF-1 … PF-11, PF-15) are pixel
 * readings and are taken in a running browser (GRÜN's and PINK's instruments); here are the structural parts a render can decide:
 * the medium is not a sign (no state, no data, not interactive), every sign and structure has its still seat, depth rides the body's
 * core and halo only, the halo follows exactly a LAYOUT body (A-F15), and the breath is CSS keyed on LIVE.
 */
vi.mock("react", async (importOriginal) => (await import("../pxj-first-screen/harness")).mockReact(await importOriginal<object>()));
import { MAPPING_FIELD_CSS, PersonJobMappingField, SEAT, VOLUME, WAVE, depthGain, waveAt, type PersonJobMappingFieldProps } from "../../../app/components/career/demo/PersonJobMappingField";

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
const dataKeys = (e: Tree) => Object.keys(e.props ?? {}).filter(k => k.startsWith("data-"));
const HANDLERS = ["onClick", "onKeyDown", "onMouseEnter", "onMouseLeave", "onFocus", "onBlur"];

let tab: ReturnType<typeof browser>;
beforeEach(() => {
  tab = browser("http://127.0.0.1/career/demo?focus=MAPPING&investigationMode=PERSON&analysisId=CAN_00000000000000000000000000000002");
  vi.stubGlobal("window", tab.window);
  vi.stubGlobal("fetch", async () => ({ status: 500, json: async () => ({}) }));
});
afterEach(() => { vi.unstubAllGlobals(); });
const props = (rs = [allStates(), keyCases(), ...standardRoles()]): PersonJobMappingFieldProps => ({ locale: "en", projection: projectionOf(CAPS), ranking: available(rankingOf(rs)), watch: watchOf("COMPLETED") });

describe("MAP-F-FIELD · F-1 … F-6 — the medium carries no sign", () => {
  it("REPRODUCE: the medium (ground, wave layers, wedges, halos) is one aria-hidden, pointer-less group with no data and no handlers", () => {
    const view = instance<PersonJobMappingFieldProps>(PersonJobMappingField);
    const tree = view.settle(props());
    const medium = byTestId(tree, "mapping-medium")!;
    expect([medium.props["aria-hidden"], medium.props.pointerEvents]).toEqual(["true", "none"]);
    const inside = all(medium.props.children, () => true);
    expect(inside.filter(e => cls(e).includes("mf-wave-ground")).length, "the wave's layers").toBe(WAVE.layers);
    for (const e of inside) {
      expect(dataKeys(e), "no data on the medium").toEqual([]);
      expect(HANDLERS.filter(h => e.props[h] !== undefined)).toEqual([]);
      expect(e.props.tabIndex).toBeUndefined();
    }
    // F-6 · the breath is CSS keyed on LIVE (PF-14: never WAAPI or SMIL), and the field's blanket under reduce reaches it
    expect(all(byTestId(tree, "mapping-field-svg"), e => ["animate", "animateTransform", "animateMotion", "set"].includes(String(e.type)))).toEqual([]);
    expect(MAPPING_FIELD_CSS).toMatch(/\[data-testid="mapping-field"\]\[data-breath="LIVE"\] \.mf-wave \{ animation: mappingFieldWave 10000ms linear infinite; \}/);
    view.unmount();
  });

  it("PF-12: everything phase F adds is out of the a11y tree and out of hit-testing — no new focusable, no new handler", () => {
    const view = instance<PersonJobMappingFieldProps>(PersonJobMappingField);
    const tree = view.settle(props());
    const added = all(byTestId(tree, "mapping-field-svg"), e => /\bmf-/.test(cls(e)) || e.props?.["aria-hidden"] === "true");
    expect(added.length).toBeGreaterThan(0);
    for (const e of added) {
      expect(e.props["aria-hidden"] === "true" || e.props.pointerEvents === "none" || /mf-(wave|core|halo)/.test(cls(e)), `${String(e.type)} ${cls(e)}`).toBe(true);
      expect(HANDLERS.filter(h => e.props[h] !== undefined)).toEqual([]);
      expect([e.props.tabIndex, e.props.role]).toEqual([undefined, undefined]);
    }
    for (const seat of all(byTestId(tree, "mapping-field-svg"), e => cls(e) === "mf-seat" || (e.props?.["aria-hidden"] === "true" && e.props?.pointerEvents === "none")))
      expect(seat.props.pointerEvents, "a seat is never a hit target").toBe("none");
    view.unmount();
  });
});

describe("MAP-F-FIELD · A-F5 / A-F8 / A-F9 — every sign and structure on its still seat", () => {
  it("REPRODUCE: each arc (collar tick and ring arc) is preceded by a black seat of its own parts, outside its opacity", () => {
    const view = instance<PersonJobMappingFieldProps>(PersonJobMappingField);
    let tree = view.settle(props());
    const check = (t: unknown) => {
      const arcs = all(t, e => e.props?.["data-mapping-arc"] === true);
      const seats = all(t, e => cls(e) === "mf-seat" && e.type === "g");
      expect(arcs.length).toBeGreaterThan(0);
      expect(seats.length, "one seat per arc").toBe(arcs.length);
      for (const seat of seats) {
        expect(seat.props.opacity, "the seat is opaque: no opacity of its own").toBeUndefined();
        const parts = all(seat.props.children, e => typeof e.type === "string" && e.type !== "g");
        expect(parts.length).toBeGreaterThan(0);
        for (const p of parts) { expect(p.props.stroke).toBe(SEAT); expect(dataKeys(p)).toEqual([]); }
      }
    };
    check(tree);
    // L2: the ring's arcs, and the ring's paints stay one ink or black (field-d :152)
    const [pool, role] = [POOL_A, "role_states"];
    const p = props();
    tree = view.settle(p);
    const bodyId = all(tree, e => e.props?.["data-mapping-body"] === true).map(b => String(b.props["data-testid"])).find(id => id.includes(pool))!;
    (byTestId(tree, `mapping-pool-${pool}`)!.props.onClick as () => void)(); tree = view.settle(p);
    (byTestId(tree, bodyId)!.props.onClick as () => void)(); tree = view.settle(p);
    expect(byTestId(tree, "mapping-ring"), role).not.toBeNull();
    check(byTestId(tree, "mapping-ring"));
    view.unmount();
  });

  it("the four rings and every text: rings on a black seat, solid; text painted on a black outline under its fill", () => {
    const view = instance<PersonJobMappingFieldProps>(PersonJobMappingField);
    const tree = view.settle(props());
    const svg = byTestId(tree, "mapping-field-svg")!;
    const kids = all(svg, e => typeof e.type === "string");
    for (const id of ["mapping-ring-best", "mapping-ring-horizon", "mapping-ring-field", "mapping-ring-shelf"]) {
      const ring = byTestId(svg, id)!;
      const at = kids.indexOf(ring);
      const seat = kids.slice(0, at).reverse().find(e => e.type === "circle" && e.props.r === ring.props.r && e.props.stroke === SEAT);
      expect(seat, `${id} has its seat under it`).toBeDefined();
      expect(Number(seat!.props.strokeWidth)).toBeGreaterThanOrEqual(Number(ring.props.strokeWidth));
      expect([ring.props.strokeDasharray, ring.props.pointerEvents], id).toEqual([undefined, "none"]);
    }
    for (const t of all(svg, e => e.type === "text")) expect([t.props.paintOrder, t.props.stroke], String(t.props["data-testid"])).toEqual(["stroke", SEAT]);
    view.unmount();
  });
});

describe("MAP-F-FIELD · F-2 / F-3 — volumes, and depth on the volume only", () => {
  it("REPRODUCE: depth is one monotone gain in rank, first : last within [1.5, 3.0] in alpha; it reaches core and halo and nothing else", () => {
    for (let r = 2; r <= 12; r++) expect(depthGain(r, 12)).toBeLessThanOrEqual(depthGain(r - 1, 12));
    expect(depthGain(1, 12) / depthGain(12, 12)).toBeCloseTo(VOLUME.depthRatio, 5);
    const view = instance<PersonJobMappingFieldProps>(PersonJobMappingField);
    const tree = view.settle(props());
    const bodies = all(tree, e => e.props?.["data-mapping-body"] === true);
    const last = Math.max(...bodies.map(b => Number(b.props["data-rank"])));
    for (const b of bodies) {
      const core = all(b.props.children, e => cls(e) === "mf-core");
      expect(core.length, "one core per body").toBe(1);
      expect(core[0].props.opacity).toBe(depthGain(Number(b.props["data-rank"]), last));
      expect(core[0].props.fill, "the same form on every body").toBe("url(#mf-core)");
      expect([1, 0.18], "the body's own gain is A-6's, never depth").toContain(b.props.opacity);
      for (const arc of all(b.props.children, e => e.props?.["data-mapping-arc"] === true)) expect(arc.props.opacity, "an arc keeps its band").toBe(arc.props["data-evidence-luminance"]);
    }
    view.unmount();
  });
});

describe("MAP-F-FIELD · A-F15 — the medium follows exactly a LAYOUT body", () => {
  it("REPRODUCE: the displaced body's halo eases with it (mf-layout); the body with its own evidence cuts, and so does its halo", () => {
    const view = instance<PersonJobMappingFieldProps>(PersonJobMappingField);
    const rs = (x: ReturnType<typeof sem>) => [
      { pool: POOL_A, roleId: "role_y", title: "Steady", requirements: [sem("q_y", "REQUIRED", "PARTIAL", "PCAP_TS", "TypeScript")] },
      { pool: POOL_A, roleId: "role_x", title: "Rising", requirements: [x] }
    ];
    view.settle(props(rs(sem("q_x", "REQUIRED", "DIFFERENT", "PCAP_PG", "PostgreSQL"))));
    const tree = view.settle(props(rs(sem("q_x", "REQUIRED", "COVERS", "PCAP_PG", "PostgreSQL"))));
    const halos = all(byTestId(tree, "mapping-medium"), e => /\bmf-halo\b/.test(cls(e)));
    const bodies = all(tree, e => e.props?.["data-mapping-body"] === true);
    expect(halos.length).toBe(bodies.length);
    for (const b of bodies) {
      const at = (b.props.style as Record<string, string>).transform;
      const halo = halos.find(h => (h.props.style as Record<string, string>).transform === at)!;
      expect(halo, String(b.props["data-testid"])).toBeDefined();
      expect(cls(halo).includes("mf-layout"), String(b.props["data-testid"])).toBe(b.props["data-change"] === "LAYOUT");
      expect(String(halo.key).includes("#"), "an EVIDENCE body's halo is a new element, as the body is").toBe(b.props["data-change"] === "EVIDENCE");
    }
    // (4) no sign or structure carries an inline transition; the class is never on a sign
    for (const e of all(tree, e => dataKeys(e).length > 0 || typeof e.props?.["data-testid"] === "string")) {
      expect(cls(e).includes("mf-layout"), String(e.props["data-testid"])).toBe(false);
      const style = (e.props.style ?? {}) as Record<string, string>;
      expect(Object.entries(style).filter(([k, v]) => /transition/i.test(k) && v !== "none"), String(e.props["data-testid"])).toEqual([]);
    }
    view.unmount();
  });
});

describe("MAP-F-NEURO · F-6 / F-7 — the wave's form", () => {
  it("REPRODUCE: 4 s rise : 6 s fall, trough at 0 and 1, peak at 0.4; selection lowers the amplitude to ≤ 45 % (F-7)", () => {
    expect([waveAt(0), waveAt(0.4), waveAt(1)]).toEqual([-1, 1, -1]);
    for (let i = 1; i <= 100; i++) expect(Math.sign(waveAt(i / 100) - waveAt((i - 1) / 100)), String(i)).toBe(i <= 40 ? 1 : -1);
    expect(WAVE.periodMs).toBe(10000);
    expect(WAVE.selectedGain).toBeLessThanOrEqual(0.45);
    expect(MAPPING_FIELD_CSS).toContain(`[data-testid="mapping-field"][data-selection="CAPABILITY"] { --mf-wave-gain: ${WAVE.selectedGain}; }`);
  });
});
