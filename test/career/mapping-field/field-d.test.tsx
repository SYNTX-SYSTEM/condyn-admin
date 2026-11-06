import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import signTable from "../../../docs/architecture/decision-fields/mapping-spec/sign-table.json";
import { browser, instance } from "../pxj-first-screen/harness";
import { CAPS, POOL_A, POOL_B, available, lex, projectionOf, rankingOf, sem, standardRoles, watchOf } from "./support";
import { STATES, allStates, keyCases, manyCapabilities, reqOf } from "./support-d";
import { MAPPING_FIELD_COPY } from "../../../app/components/career/demo/mapping-field-copy";
import { luminanceOf } from "../../../lib/career/view-model/mapping-field";
import type { CouplingClass } from "../../../lib/career/mapping/signs";

/**
 * MAP-D-FIELD · the phase-D field across renders (harness ../pxj-first-screen/harness.ts): L0 → L1 → L2 → L3 by its own controls;
 * every arc drawn from its sign only, in one ink (§8.1, §8.5); the newly admitted actions DRIVEN and nothing written (§8.8, PINK's
 * condition on the hold); the provenance line on every level and after every driven action (§8.11); movement means evidence (§8.9);
 * beams with and without a start point (D-Q2); the reverse view (§2.2); the collar's count (D-Q3).
 */
vi.mock("react", async (importOriginal) => (await import("../pxj-first-screen/harness")).mockReact(await importOriginal<object>()));
import { BEAM_STROKE, LINE_DASH, PersonJobMappingField, type PersonJobMappingFieldProps } from "../../../app/components/career/demo/PersonJobMappingField";

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
const fire = (node: Tree | null, handler: string, event: Record<string, unknown> = {}) => {
  expect(node, handler).not.toBeNull();
  (node!.props[handler] as (e: unknown) => void)({ stopPropagation: () => undefined, preventDefault: () => undefined, ...event });
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
});
afterEach(() => { vi.unstubAllGlobals(); });

const roles = () => [allStates(), keyCases(), ...standardRoles()];
const props = (rs = roles(), caps: ReadonlyArray<{ key: string; name: string }> = CAPS): PersonJobMappingFieldProps =>
  ({ locale: "en", projection: projectionOf(caps), ranking: available(rankingOf(rs)), watch: watchOf("COMPLETED") });
const field = (tree: unknown) => byTestId(tree, "mapping-field")!;
const quiet = () => expect([fetches, storage, tab.writes.length], "nothing read, stored, written or navigated").toEqual([0, 0, 0]);
/** Opens pool → role (→ requirement) by the field's own controls. */
function open(view: ReturnType<typeof instance<PersonJobMappingFieldProps>>, p: PersonJobMappingFieldProps, pool: string, role: string, requirement?: string) {
  let tree = view.settle(p);
  fire(byTestId(tree, `mapping-pool-${pool}`), "onClick");
  tree = view.settle(p);
  fire(byTestId(tree, `mapping-body-${pool}:${role}`), "onClick");
  tree = view.settle(p);
  if (requirement !== undefined) { fire(byTestId(tree, `mapping-arc-${requirement}`), "onClick"); tree = view.settle(p); }
  return tree;
}

describe("MAP-D-FIELD · L0 → L3 by the field's own controls", () => {
  it("REPRODUCE: pool → role (its full ring, the open role at the centre) → arc (its evidence, verbatim); ↑ and Escape go back level by level", () => {
    const view = instance<PersonJobMappingFieldProps>(PersonJobMappingField);
    const p = props();
    let tree = open(view, p, POOL_A, "role_platform");
    expect(field(tree).props).toMatchObject({ "data-level": "L2", "data-role": `${POOL_A}:role_platform` });
    const ring = byTestId(tree, "mapping-ring")!;
    expect(ring.props["data-arcs"]).toBe(4);
    expect(byPrefix(tree, "mapping-body-").map(b => b.props["data-testid"]), "L2 draws the open role only").toEqual([`mapping-body-${POOL_A}:role_platform`]);
    expect(byPrefix(tree, "mapping-sector-"), "and no sector").toEqual([]);
    expect(textOf(byTestId(tree, "mapping-l2-title"))).toBe("Platform Engineer");
    fire(byTestId(tree, "mapping-arc-q_pg"), "onClick");
    tree = view.settle(p);
    expect(field(tree).props).toMatchObject({ "data-level": "L3", "data-requirement": "q_pg" });
    const l3 = byTestId(tree, "mapping-l3")!;
    expect(l3.props).toMatchObject({ "data-state": "PARTIAL", "data-key-status": "KNOWN" });
    expect(textOf(byTestId(tree, "mapping-l3-text"))).toBe("Requirement q_pg");
    expect(textOf(byTestId(tree, "mapping-l3-explanation"))).toBe("Statement q_pg.");
    expect(textOf(byTestId(tree, "mapping-l3-limitation"))).toBe("Limitation: Limitation q_pg.");
    expect(byPrefix(tree, "mapping-l3-quote").map(q => textOf(q))).toEqual(["placeholder quote q_pgsource DOC_1"]);
    fire(byTestId(tree, "mapping-up"), "onClick");
    tree = view.settle(p);
    expect(field(tree).props["data-level"]).toBe("L2");
    fire(field(tree), "onKeyDown", { key: "Escape" });
    tree = view.settle(p);
    expect(field(tree).props["data-level"]).toBe("L1");
    fire(field(tree), "onKeyDown", { key: "Escape" });
    tree = view.settle(p);
    expect(field(tree).props).toMatchObject({ "data-level": "L0", "data-selection": "" });
    quiet();
    view.unmount();
  });

  // Phase E (E-7) supersedes "no text but the pool names": capability nodes carry their name at every level; body names stay
  // off at L0 unless marked or selected (BODY_NAMES_AT_L0 = false, OTTAVIO's question).
  it("L0 carries the pool names at the sectors and the capability names (phase E · E-7), no body name; titles appear from L1", () => {
    const view = instance<PersonJobMappingFieldProps>(PersonJobMappingField);
    const p = props();
    let tree = view.settle(p);
    const svgText = (t: unknown) => all(byTestId(t, "mapping-field-svg"), e => e.type === "text").map(e => textOf(e));
    const names = all(byTestId(tree, "mapping-field-svg"), e => e.type === "textPath").map(e => textOf(e));
    expect(names.sort()).toEqual(["Pool Alpha", "Pool Beta"]);
    expect(all(byTestId(tree, "mapping-field-svg"), e => e.type === "text" && String(e.props["data-testid"] ?? "").startsWith("mapping-capability-name-")).map(e => textOf(e)).sort())
      .toEqual(["Kubernetes", "PostgreSQL", "TypeScript"]);
    expect(svgText(tree).filter(t => ["All States", "Platform Engineer", "Named"].some(name => t.includes(name))), "no body name at L0").toEqual([]);
    fire(byTestId(tree, `mapping-pool-${POOL_A}`), "onClick");
    tree = view.settle(p);
    expect(svgText(tree)).toContain("All States");
    view.unmount();
  });
});

describe("MAP-D-FIELD · §8.1 every arc drawn from its sign, §8.5 in one ink", () => {
  it("REPRODUCE §8.1: at L2 each of the ten states' arc carries the table's channels and draws them — line, ends, fill band, mark", () => {
    const view = instance<PersonJobMappingFieldProps>(PersonJobMappingField);
    const tree = open(view, props(), POOL_A, "role_all");
    const table = signTable.couplingStates as Record<string, { arcLine: string; arcFill: number; luminance: number; beam: string; phaseLocked: boolean; mark: string }>;
    for (const state of STATES) {
      const arc = byTestId(tree, `mapping-arc-${reqOf(state)}`)!;
      const s = table[state];
      expect({ line: arc.props["data-line"], fill: arc.props["data-fill"], beam: arc.props["data-beam"], locked: arc.props["data-phase-locked"], mark: arc.props["data-mark"] }, state)
        .toEqual({ line: s.arcLine, fill: s.arcFill, beam: s.beam, locked: String(s.phaseLocked), mark: s.mark });
      const line = all(arc, e => e.props?.["data-arc-line"] !== undefined), ends = all(arc, e => e.props?.["data-arc-end"] !== undefined);
      const fill = all(arc, e => e.props?.["data-arc-fill"] !== undefined), marks = all(arc, e => e.props?.["data-arc-mark"] !== undefined);
      if (s.arcLine === "open") expect([line.length, ends.length], `${state}: an open arc is its two ends and nothing between`).toEqual([0, 2]);
      else {
        expect([line.length, ends.length], state).toEqual([1, 0]);
        const k = Number((byTestId(tree, "mapping-field-svg")!.props.viewBox as string).split(" ")[2]) / 960;
        expect(line[0].props.strokeDasharray, state).toBe(LINE_DASH[s.arcLine](k, 0));
      }
      expect(fill.length, `${state}: a fill band only where the table fills`).toBe(s.arcFill > 0 ? 1 : 0);
      expect(marks.map(m => m.props["data-arc-mark"]), state).toEqual(s.mark === "none" ? [] : [s.mark]);
      // Phase E (E-1, A-3): the drawn luminance is the class band's, the table's own value placed inside it; the table value stays on the element.
      expect([arc.props.opacity, arc.props["data-luminance"]], `${state}: luminance is the evidence band`).toEqual([luminanceOf({ class: arc.props["data-class"] as CouplingClass, luminance: s.luminance }), s.luminance]);
    }
    view.unmount();
  });

  it("§8.5: colour carries nothing — every stroke and fill of the ring is the one ink at some alpha; the ten states differ without it", () => {
    const view = instance<PersonJobMappingFieldProps>(PersonJobMappingField);
    const tree = open(view, props(), POOL_A, "role_all");
    const ring = byTestId(tree, "mapping-ring")!;
    const paints = new Set(all(ring, () => true).flatMap(e => [e.props.stroke, e.props.fill]).filter((v): v is string => typeof v === "string" && v !== "none"));
    for (const paint of paints) expect(paint).toMatch(/^rgba\((205, 240, 255|92, 200, 255|0, 0, 0), [0-9.]+\)$/);
    // Greyscale signature: drop every colour and opacity, keep the geometry of what is drawn.
    const grey = (state: string) => {
      const arc = byTestId(tree, `mapping-arc-${reqOf(state as typeof STATES[number])}`)!;
      return JSON.stringify(all(arc, e => e.type !== "g" && e.props?.["data-mapping-hit"] === undefined).map(e => [e.type, e.props["data-arc-line"] !== undefined, e.props["data-arc-end"] !== undefined, e.props["data-arc-fill"] !== undefined, e.props["data-arc-mark"] ?? null, e.props.strokeDasharray ?? null, e.props["data-arc-fill"] !== undefined ? e.props.d : null]));
    };
    expect(new Set(STATES.map(grey)).size, "every distinction survives in greyscale").toBe(10);
    view.unmount();
  });
});

describe("MAP-D-FIELD · §8.8 no scope write — the newly admitted actions DRIVEN, nothing written", () => {
  it("REPRODUCE: OPEN_ROLE, OPEN_REQUIREMENT, SELECT_CAPABILITY and MARK_REQUIREMENT (the last two at L2) are driven; no fetch, no storage, no URL or history write", () => {
    const view = instance<PersonJobMappingFieldProps>(PersonJobMappingField);
    const p = props();
    let tree = open(view, p, POOL_A, "role_all");                                  // OPEN_POOL, OPEN_ROLE
    expect(field(tree).props["data-level"]).toBe("L2"); quiet();
    fire(byTestId(tree, `mapping-arc-${reqOf("COVERS")}`), "onMouseEnter");          // MARK_REQUIREMENT at L2
    tree = view.settle(p);
    expect([field(tree).props["data-selection"], byTestId(tree, `mapping-arc-${reqOf("COVERS")}`)!.props["data-marked"]]).toEqual(["REQUIREMENT", "true"]); quiet();
    fire(byTestId(tree, `mapping-arc-${reqOf("COVERS")}`), "onFocus");               // MARK_REQUIREMENT by keyboard focus
    tree = view.settle(p); quiet();
    fire(byTestId(tree, "mapping-capability-PCAP_TS"), "onClick");                  // SELECT_CAPABILITY at L2
    tree = view.settle(p);
    expect([field(tree).props["data-level"], field(tree).props["data-capability"]]).toEqual(["L2", "PCAP_TS"]); quiet();
    fire(byTestId(tree, `mapping-arc-${reqOf("NAME_EXACT")}`), "onClick");           // OPEN_REQUIREMENT
    tree = view.settle(p);
    expect(field(tree).props).toMatchObject({ "data-level": "L3", "data-requirement": reqOf("NAME_EXACT") }); quiet();
    fire(byTestId(tree, `mapping-arc-${reqOf("PARTIAL")}`), "onKeyDown", { key: "Enter" }); // OPEN_REQUIREMENT by keyboard, at L3
    tree = view.settle(p);
    expect(field(tree).props["data-requirement"]).toBe(reqOf("PARTIAL")); quiet();
    fire(byTestId(tree, "mapping-capability-PCAP_TS"), "onKeyDown", { key: "Enter" }); // the selection cleared again
    tree = view.settle(p);
    expect(field(tree).props["data-capability"]).toBe("");
    quiet();
    // The field holds no scope to write: its props carry none, and the location is the one it started on.
    expect(Object.keys(p).sort()).toEqual(["locale", "projection", "ranking", "watch"]);
    expect(tab.window.location.href).toBe("http://127.0.0.1/career/demo?focus=MAPPING&investigationMode=PERSON&analysisId=CAN_00000000000000000000000000000002");
    view.unmount();
  });
});

describe("MAP-D-FIELD · §8.11 budget honesty — the provenance line on every level, and after every driven action", () => {
  const namesOnly = () => [keyCases(), { pool: POOL_A, roleId: "role_lex", title: "Lex", requirements: [lex("q_l", "REQUIRED", "NAME_EXACT", "PCAP_TS", "TypeScript"), lex("q_n", "REQUIRED", "NONE", null)] }];
  it("REPRODUCE: names only (GEMINI_JOB_CALL_LIMIT = 0 in production) → the line stands at L0, L1, L2, L3, with a capability selected and an arc marked", () => {
    const view = instance<PersonJobMappingFieldProps>(PersonJobMappingField);
    const p = props(namesOnly());
    const line = (tree: unknown) => textOf(byTestId(tree, "mapping-provenance"));
    const sentence = MAPPING_FIELD_COPY.en.namesOnly;
    let tree = view.settle(p);
    expect([field(tree).props["data-names-only"], line(tree)]).toEqual(["true", sentence]);
    fire(byTestId(tree, `mapping-pool-${POOL_A}`), "onClick"); tree = view.settle(p); expect(line(tree), "L1").toBe(sentence);
    fire(byTestId(tree, `mapping-body-${POOL_A}:role_lex`), "onClick"); tree = view.settle(p); expect([field(tree).props["data-level"], line(tree)]).toEqual(["L2", sentence]);
    fire(byTestId(tree, "mapping-capability-PCAP_TS"), "onClick"); tree = view.settle(p); expect(line(tree), "a capability selected").toBe(sentence);
    fire(byTestId(tree, "mapping-arc-q_l"), "onMouseEnter"); tree = view.settle(p); expect(line(tree), "an arc marked").toBe(sentence);
    fire(byTestId(tree, "mapping-arc-q_l"), "onClick"); tree = view.settle(p); expect([field(tree).props["data-level"], line(tree)]).toEqual(["L3", sentence]);
    // Nothing anywhere says a model checked something: no checked state word, no model badge.
    const all3 = JSON.stringify(textOf(tree));
    expect(all3).not.toMatch(/\(checked\)|GEMINI · model statements/);
    view.unmount();
  });

  it("inverse: one SEMANTIC coupling in the reading and the line is gone — it speaks about the reading, never about a configuration", () => {
    const view = instance<PersonJobMappingFieldProps>(PersonJobMappingField);
    const tree = view.settle(props());
    expect([field(tree).props["data-names-only"], byTestId(tree, "mapping-provenance")]).toEqual(["false", null]);
    view.unmount();
  });
});

describe("MAP-D-FIELD · §8.9 A3 — movement means evidence, always and only", () => {
  // Phase E (E-4, A-2) changed the FORM, not the model: own evidence is cut and lit once (data-change="EVIDENCE"), a body displaced
  // by others eases to its place without any luminance change (data-change="LAYOUT"); the forms live in MAPPING_FIELD_CSS.
  it("REPRODUCE: X's fit changes, Y only shifts: X is cut and lit, with a trail; Y eases, no trail, data-layout-shift, a still mark; the field states the count", () => {
    const view = instance<PersonJobMappingFieldProps>(PersonJobMappingField);
    const rs = (y: ReturnType<typeof sem>) => [
      { pool: POOL_A, roleId: "role_y", title: "Steady", requirements: [sem("q_y", "REQUIRED", "PARTIAL", "PCAP_TS", "TypeScript")] },
      { pool: POOL_A, roleId: "role_x", title: "Rising", requirements: [y] }
    ];
    let tree = view.settle(props(rs(sem("q_x", "REQUIRED", "DIFFERENT", "PCAP_PG", "PostgreSQL"))));
    const before = byTestId(tree, `mapping-body-${POOL_A}:role_y`)!.props.style as Record<string, string>;
    tree = view.settle(props(rs(sem("q_x", "REQUIRED", "COVERS", "PCAP_PG", "PostgreSQL"))));
    const x = byTestId(tree, `mapping-body-${POOL_A}:role_x`)!, y = byTestId(tree, `mapping-body-${POOL_A}:role_y`)!;
    expect((y.props.style as Record<string, string>).transform, "precondition: Y took a new place").not.toBe(before.transform);
    expect([x.props["data-movement"], x.props["data-moved"], x.props["data-change"], (x.props.style as Record<string, string>).transition]).toEqual(["EVIDENCE", "true", "EVIDENCE", undefined]);
    expect([y.props["data-movement"], y.props["data-moved"], y.props["data-layout-shift"], y.props["data-change"], (y.props.style as Record<string, string>).transition]).toEqual(["LAYOUT", "false", "true", "LAYOUT", undefined]);
    expect(byPrefix(tree, "mapping-trail-").map(t => t.props["data-testid"])).toEqual([`mapping-trail-${POOL_A}:role_x`]);
    expect(byTestId(tree, `mapping-layout-shift-${POOL_A}:role_y`)).not.toBeNull();
    expect(byTestId(tree, `mapping-layout-shift-${POOL_A}:role_x`)).toBeNull();
    expect([byTestId(tree, "mapping-layout-shifts")!.props["data-count"], textOf(byTestId(tree, "mapping-layout-shifts"))]).toEqual([1, MAPPING_FIELD_COPY.en.layoutShifts(1)]);
    expect(field(tree).props["data-layout-shifts"]).toBe(1);
    view.unmount();
  });
});

describe("MAP-D-FIELD · beams (§2.1), the cases without a start point (D-Q2), the reverse view (§2.2), the collar (D-Q3)", () => {
  it("REPRODUCE: L1 draws the marked role's beams, L2 all of the open role's, L3 the open arc's; each in its state's beam", () => {
    const view = instance<PersonJobMappingFieldProps>(PersonJobMappingField);
    const p = props();
    let tree = view.settle(p);
    // Phase E (E-2): L0 draws each body's primary beam, nothing else; L1 draws none until a role is marked.
    expect(byPrefix(tree, "mapping-beam-").every(b => b.props["data-beam-rank"] === "PRIMARY")).toBe(true);
    fire(byTestId(tree, `mapping-pool-${POOL_A}`), "onClick"); tree = view.settle(p);
    expect(byPrefix(tree, "mapping-beam-")).toEqual([]);
    fire(byTestId(tree, `mapping-body-${POOL_A}:role_all`), "onMouseEnter"); tree = view.settle(p);
    const marked = byPrefix(tree, "mapping-beam-").map(b => [b.props["data-state"], b.props["data-beam"]]);
    expect(marked.map(([state]) => state).sort()).toEqual(["COVERS", "EQUIVALENT", "NAME_ALIAS", "NAME_COMPOSITE_CONSTITUENT", "NAME_EXACT", "PARTIAL", "UNCLEAR"]);
    for (const [state, beam] of marked) {
      expect(beam, String(state)).toBe((signTable.couplingStates as Record<string, { beam: string }>)[String(state)].beam);
      const line = byPrefix(tree, "mapping-beam-").find(b => b.props["data-state"] === state)!;
      expect(line.props.strokeDasharray, String(state)).toBe(BEAM_STROKE[String(beam)](Number((byTestId(tree, "mapping-field-svg")!.props.viewBox as string).split(" ")[2]) / 960).dash);
    }
    // §8.4 at the drawing, independent of the stroke table: a name relation's beam is never drawn solid — it carries a dash;
    // only the table's solid and thin beams are continuous lines.
    const LEXICAL_STATES = ["NAME_EXACT", "NAME_ALIAS", "NAME_COMPOSITE_CONSTITUENT", "WEAK_TOKEN_CONTAINMENT"];
    for (const line of byPrefix(tree, "mapping-beam-")) {
      const dash = line.props.strokeDasharray as string | undefined;
      const continuous = line.props["data-beam"] === "solid" || line.props["data-beam"] === "thin";
      expect(continuous ? dash === undefined : typeof dash === "string" && dash.trim().length > 0, String(line.props["data-testid"])).toBe(true);
      if (LEXICAL_STATES.includes(String(line.props["data-state"]))) expect([dash !== undefined, line.props["data-phase-locked"]], String(line.props["data-state"])).toEqual([true, "false"]);
    }
    fire(byTestId(tree, `mapping-body-${POOL_A}:role_all`), "onClick"); tree = view.settle(p);
    expect(byPrefix(tree, "mapping-beam-").length).toBe(7);
    fire(byTestId(tree, `mapping-arc-${reqOf("PARTIAL")}`), "onClick"); tree = view.settle(p);
    expect(byPrefix(tree, "mapping-beam-").map(b => [b.props["data-state"], b.props["data-beam"], b.props["data-phase-locked"]])).toEqual([["PARTIAL", "thin", "true"]]);
    expect(byTestId(tree, "mapping-capability-PCAP_TS")!.props["data-phase-locked"], "the node pulses in phase with its locked beam").toBe("true");
    view.unmount();
  });

  it("D-Q2: NOT_IN_PERSON names the capability with 'not in the person'; an absent key says the KEY is absent at L3 — never that the relation is", () => {
    const view = instance<PersonJobMappingFieldProps>(PersonJobMappingField);
    const p = props();
    let tree = open(view, p, POOL_B, "role_keys");
    expect(byPrefix(tree, "mapping-beam-").map(b => b.props["data-testid"])).toEqual([`mapping-beam-${POOL_B}:role_keys:q_known`]);
    expect(textOf(byTestId(tree, "mapping-arc-key-q_foreign"))).toBe("Rust · not in the person");
    expect(byTestId(tree, "mapping-arc-key-q_absent"), "the absent key is named at L3").toBeNull();
    fire(byTestId(tree, "mapping-arc-q_absent"), "onClick"); tree = view.settle(p);
    expect(textOf(byTestId(tree, "mapping-l3-capability"))).toBe(MAPPING_FIELD_COPY.en.keyAbsent);
    expect(textOf(byTestId(tree, "mapping-l3-state"))).toBe("an alias of the name · a name relation, nothing checked");
    expect(byTestId(tree, "mapping-arc-q_absent")!.props["data-line"], "the arc keeps its own sign").toBe("dotted");
    view.unmount();
  });

  it("D-Q2: a capability beyond the constellation draws no beam; the field counts the undrawn source", () => {
    const view = instance<PersonJobMappingFieldProps>(PersonJobMappingField);
    const p = props([{ pool: POOL_A, roleId: "role_far", title: "Far", requirements: [lex("q_near", "REQUIRED", "NAME_EXACT", "PCAP_000", "Capability 000"), lex("q_far", "REQUIRED", "NAME_EXACT", "PCAP_074", "Capability 074")] }], manyCapabilities(75));
    const tree = open(view, p, POOL_A, "role_far");
    expect(byPrefix(tree, "mapping-beam-").map(b => b.props["data-testid"])).toEqual([`mapping-beam-${POOL_A}:role_far:q_near`]);
    expect([byTestId(tree, "mapping-beams-undrawn")!.props["data-count"], byTestId(tree, "mapping-person-overflow")!.props["data-count"]]).toEqual([1, 6]);
    view.unmount();
  });

  it("§2.2 REPRODUCE: selecting a node lights every role it couples across all pools, with beams to exactly those arcs; selecting it again clears", () => {
    const view = instance<PersonJobMappingFieldProps>(PersonJobMappingField);
    const p = props();
    let tree = view.settle(p);
    fire(byTestId(tree, "mapping-capability-PCAP_K8"), "onClick"); tree = view.settle(p);
    const lit = byPrefix(tree, "mapping-body-").filter(b => b.props["data-lit"] === "true").map(b => b.props["data-testid"]).sort();
    expect(lit).toEqual([`mapping-body-${POOL_B}:role_keys`, `mapping-body-${POOL_B}:role_platform`].sort());
    // Phase E (E-2): the L0 primary beams stand beside the selection's; the selection's are exactly the capability's.
    const selection = (t: unknown) => byPrefix(t, "mapping-beam-").filter(b => b.props["data-beam-rank"] === "SELECTION");
    expect(selection(tree).every(b => b.props["data-capability"] === "PCAP_K8")).toBe(true);
    expect(selection(tree).length).toBe(2);
    expect(byTestId(tree, "mapping-reverse")!.props).toMatchObject({ "data-capability": "PCAP_K8", "data-roles": 2 });
    fire(byTestId(tree, "mapping-capability-PCAP_K8"), "onClick"); tree = view.settle(p);
    expect([byTestId(tree, "mapping-reverse"), selection(tree).length]).toEqual([null, 0]);
    quiet();
    view.unmount();
  });

  it("D-Q3: at L0 each body wears its collar — one tick per requirement in ring order; what a small body cannot carry is counted, and said", () => {
    const view = instance<PersonJobMappingFieldProps>(PersonJobMappingField);
    const many = { pool: POOL_A, roleId: "role_many", title: "Many", requirements: Array.from({ length: 40 }, (_, i) => lex(`q_${String(i).padStart(2, "0")}`, "OPTIONAL", "NAME_EXACT", "PCAP_TS", "TypeScript")) };
    const tree = view.settle(props([allStates(), many]));
    const collar = byTestId(tree, `mapping-collar-${POOL_A}:role_all`)!;
    expect(byPrefix(collar, `mapping-tick-${POOL_A}:role_all:`).length + Number(collar.props["data-hidden"])).toBe(10);
    const crowded = byTestId(tree, `mapping-collar-${POOL_A}:role_many`)!;
    const drawn = byPrefix(crowded, `mapping-tick-${POOL_A}:role_many:`).map(t => t.props["data-requirement"]);
    expect(Number(crowded.props["data-hidden"])).toBeGreaterThan(0);
    expect(drawn, "a prefix of ring order").toEqual(Array.from({ length: drawn.length }, (_, i) => `q_${String(i).padStart(2, "0")}`));
    expect(byTestId(tree, "mapping-collar-hidden")!.props["data-count"]).toBe(Number(collar.props["data-hidden"]) + Number(crowded.props["data-hidden"]));
    view.unmount();
  });
});
