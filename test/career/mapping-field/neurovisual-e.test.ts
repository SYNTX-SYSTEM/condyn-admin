import { describe, expect, it } from "vitest";
import signTable from "../../../docs/architecture/decision-fields/mapping-spec/sign-table.json";
import { BEAM_STROKE, MAPPING_FIELD_CSS, MOTION, RING_LUMINANCE } from "../../../app/components/career/demo/PersonJobMappingField";
import { EVIDENCE_BAND, EVIDENCE_STEP, luminanceOf } from "../../../lib/career/view-model/mapping-field";
import { COUPLING_STATES, couplingSign, type CouplingClass } from "../../../lib/career/mapping/signs";

/**
 * MAP-E-NEURO · the numeric bounds of PERSON_X_JOB_MAPPING_PHASE_E.md §2/§3 as assertions (GRÜN). The numbers below are the
 * CONTRACT's, written here a second time on purpose: the stylesheet and the model are read and held to them, so a drift in either
 * turns this red. Nothing here reads my constants to check my constants, except where the contract names no number (the staging
 * tween is a script, so its 420 ms is read from MOTION and the CSS evidence delay must equal it).
 */
const CONTRACT = Object.freeze({
  bandStep: 1.6,
  query: { periodS: 1.4, amplitudePx: 1.5 },
  transient: { riseMs: 180, decayMs: 600, peak: 1.8 },
  layout: { ms: 900 },
  stage: { geometryMs: 420, evidenceFromMs: 420 },
  breath: { hz: 0.1, radius: 0.015, opacity: 0.04 },
  flashHz: 3
});

/** The CSS, read as rules: selector → declarations (top level and inside the reduced-motion block separately). */
function rules(css: string): Array<{ selector: string; body: string; reduced: boolean }> {
  const out: Array<{ selector: string; body: string; reduced: boolean }> = [];
  const media = /@media \(prefers-reduced-motion: reduce\) \{([\s\S]*)\}\s*$/.exec(css);
  const top = media === null ? css : css.slice(0, media.index);
  const read = (text: string, reduced: boolean) => {
    for (const m of text.replace(/@keyframes [\w-]+ \{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, "").matchAll(/([^{}]+)\{([^{}]*)\}/g)) out.push({ selector: m[1].trim(), body: m[2].trim(), reduced });
  };
  read(top, false);
  if (media !== null) read(media[1], true);
  return out;
}
function keyframes(css: string, name: string): Array<{ at: number; body: string }> {
  const block = new RegExp(`@keyframes ${name} \\{((?:[^{}]*\\{[^{}]*\\})*)[^{}]*\\}`).exec(css)?.[1];
  if (block === undefined) return [];
  return [...block.matchAll(/(from|to|[\d.]+%)\s*\{([^}]*)\}/g)].map(m => ({ at: m[1] === "from" ? 0 : m[1] === "to" ? 100 : Number(m[1].slice(0, -1)), body: m[2] }));
}
const ruleFor = (marker: string, reduced = false) => rules(MAPPING_FIELD_CSS).filter(r => r.reduced === reduced && r.selector.includes(marker));
const seconds = (value: string) => value.endsWith("ms") ? Number(value.slice(0, -2)) / 1000 : Number(value.slice(0, -1));
/** `animation: name duration timing [delay] …` → its parts. */
function animation(body: string): { name: string; duration: number; timing: string; delay: number; iterations: string } | null {
  const m = /animation:\s*([\w-]+)\s+([\d.]+m?s)\s+([\w-]+(?:\([^)]*\))?)(?:\s+([\d.]+m?s))?(?:\s+(infinite|\d+|both))?/.exec(body);
  return m === null ? null : { name: m[1], duration: seconds(m[2]), timing: m[3], delay: m[4] ? seconds(m[4]) : 0, iterations: m[5] ?? "1" };
}
const numbersOf = (body: string, fn: string) => [...body.matchAll(new RegExp(`${fn}\\(([^)]*)\\)`, "g"))].map(m => m[1]);

describe("MAP-E-NEURO · P-2 / E-1 — the evidence bands (A-3)", () => {
  it("REPRODUCE: three disjoint bands, ordered CHECKED > NAME_ONLY > NONE, adjacent bands ≥ 1.6× apart at their closest points", () => {
    expect(Object.keys(EVIDENCE_STEP).sort(), "exactly the table's three classes (B-5)").toEqual(["LEXICAL", "NONE", "SEMANTIC"]);
    const band = (cls: CouplingClass) => EVIDENCE_BAND[EVIDENCE_STEP[cls]];
    const [checked, named, none] = [band("SEMANTIC"), band("LEXICAL"), band("NONE")];
    for (const [lo, hi] of [checked, named, none]) expect(lo).toBeLessThanOrEqual(hi);
    expect(checked[0] / named[1], "CHECKED over NAME_ONLY").toBeGreaterThanOrEqual(CONTRACT.bandStep);
    expect(named[0] / none[1], "NAME_ONLY over NONE").toBeGreaterThanOrEqual(CONTRACT.bandStep);
  });

  it("every one of the ten states lands inside its class's band; inside a band the table's per-state luminance keeps its order", () => {
    const table = signTable.couplingStates as Record<string, { class: CouplingClass; luminance: number }>;
    expect(COUPLING_STATES.length).toBe(10);
    for (const state of COUPLING_STATES) {
      const s = couplingSign(table[state].class, state);
      const [lo, hi] = EVIDENCE_BAND[EVIDENCE_STEP[s.class]];
      const l = luminanceOf(s);
      expect(l, state).toBeGreaterThanOrEqual(lo);
      expect(l, state).toBeLessThanOrEqual(hi);
      for (const other of COUPLING_STATES) {
        const o = couplingSign(table[other].class, other);
        if (o.class === s.class && o.luminance < s.luminance) expect(luminanceOf(o), `${other} < ${state}`).toBeLessThan(l);
      }
    }
  });

  it("the luminance is derived from the sign only — the table's own value is never rewritten (B-5)", () => {
    const table = signTable.couplingStates as Record<string, { class: CouplingClass; luminance: number }>;
    for (const state of COUPLING_STATES) expect(couplingSign(table[state].class, state).luminance, state).toBe(table[state].luminance);
    expect(() => luminanceOf({ class: "INVENTED" as CouplingClass, luminance: 1 })).toThrow(/ERR_MAPPING_FIELD_UNKNOWN_CLASS/);
  });
});

describe("MAP-E-NEURO · E-7 — the four rings by luminance, one ink", () => {
  it("REPRODUCE: each ring ≥ 1.6× the next, also at the breath's trough for the breathing field ring", () => {
    const { shelf, best, field, horizon } = RING_LUMINANCE;
    const trough = field * (MOTION.breath.opacityMean - MOTION.breath.opacityAmplitude), peak = field * (MOTION.breath.opacityMean + MOTION.breath.opacityAmplitude);
    expect(best / shelf).toBeGreaterThanOrEqual(CONTRACT.bandStep);
    expect(trough / best).toBeGreaterThanOrEqual(CONTRACT.bandStep);
    expect(horizon / Math.min(1, peak)).toBeGreaterThanOrEqual(CONTRACT.bandStep);
  });
});

describe("MAP-E-NEURO · P-3 / E-3 — the query motion", () => {
  it("REPRODUCE: one rule, on data-motion=QUERY, period 1.4 s, infinite, sinusoidal translation of amplitude 1.5 px in ONE direction", () => {
    const [rule] = ruleFor('[data-motion="QUERY"]');
    expect(rule, "the query rule exists").toBeDefined();
    const a = animation(rule.body)!;
    expect([a.duration, a.iterations, a.timing, a.delay]).toEqual([CONTRACT.query.periodS, "infinite", "linear", 0]);
    const frames = keyframes(MAPPING_FIELD_CSS, a.name);
    expect(frames.length, "dense keyframes").toBeGreaterThanOrEqual(12);
    for (const f of frames) {
      const m = /translate\(calc\(var\(--mf-query-amp[^)]*\) \* (-?[\d.e-]+)\), ([^)]+)\)/.exec(f.body);
      expect(m, `${f.at}%: a translation by the stage's 1.5 px (--mf-query-amp) times a sample`).not.toBeNull();
      expect(Number(m![1]), `${f.at}% is a sample of sin`).toBeCloseTo(Math.sin((2 * Math.PI * f.at) / 100), 4);
      expect(m![2], "one direction of motion (common fate)").toBe("0px");
    }
    expect([frames[0].at, frames[frames.length - 1].at, Number(/\* (-?[\d.e-]+)\)/.exec(frames[0].body)?.[1])]).toEqual([0, 100, 0]);
    expect(MOTION.query.amplitudePx).toBe(CONTRACT.query.amplitudePx);
  });
});

describe("MAP-E-NEURO · P-4 / E-4 — the capture boundary", () => {
  it("REPRODUCE: EVIDENCE is a luminance transient (rise 180 ms, decay 600 ms, peak ×1.8) with no position change", () => {
    const evidence = ruleFor('[data-change="EVIDENCE"]');
    expect(evidence.length, "body and requirement (E-4b)").toBe(2);
    expect(evidence[0].body, "no position transition on own evidence").not.toMatch(/transition/);
    const a = animation(evidence[0].body)!;
    expect([a.duration * 1000, a.iterations]).toEqual([CONTRACT.transient.riseMs + CONTRACT.transient.decayMs, "1"]);
    const frames = keyframes(MAPPING_FIELD_CSS, a.name);
    for (const f of frames) expect(f.body, "a transient of luminance only").not.toMatch(/transform|translate|scale/);
    const peak = frames.reduce((best, f) => Number(numbersOf(f.body, "brightness")[0]) > Number(numbersOf(best.body, "brightness")[0]) ? f : best);
    expect(Number(numbersOf(peak.body, "brightness")[0])).toBe(CONTRACT.transient.peak);
    expect(Math.round((peak.at / 100) * a.duration * 1000)).toBe(CONTRACT.transient.riseMs);
    expect([frames[0].body, frames[frames.length - 1].body].map(b => Number(numbersOf(b, "brightness")[0]))).toEqual([1, 1]);
  });

  it("REPRODUCE: LAYOUT is a position gradient (900 ms, slow-in/slow-out) with no luminance change at all", () => {
    const layout = ruleFor('[data-change="LAYOUT"]');
    expect(layout.length).toBe(1);
    expect(layout[0].body).toMatch(new RegExp(`^transition: transform ${CONTRACT.layout.ms}ms cubic-bezier\\(0\\.42, 0, 0\\.58, 1\\);$`));
    expect(layout[0].body, "no animation, no filter, no opacity").not.toMatch(/animation|filter|opacity|brightness/);
  });

  it("inverse (position half restated, phase F §12/A-F15): no other rule gives a transient to anything but EVIDENCE, and no rule gives a position transition to EVIDENCE or to a sign", () => {
    const transient = keyframes(MAPPING_FIELD_CSS, "mappingFieldTransient").length > 0 ? "mappingFieldTransient" : "";
    const users = rules(MAPPING_FIELD_CSS).filter(r => !r.reduced && transient !== "" && r.body.includes(transient));
    // E-4b: the same transient on the body whose own evidence moved it, and on the requirement whose own evidence changed in place.
    expect(users.map(r => r.selector)).toEqual(['[data-testid="mapping-field"] [data-mapping-body][data-change="EVIDENCE"]', '[data-testid="mapping-field"] [data-mapping-arc][data-change="EVIDENCE"]']);
    for (const r of users) expect(r.body, r.selector).toBe(users[0].body);
    // PHASE F §12 / A-F15 (adjudicated before the change): the position-transition half pinned one selector — a MECHANISM. Restated to
    // its meaning: a position transition applies only to LAYOUT bodies and to the medium of exactly those bodies (the halo, class
    // mf-layout — field-f.test.tsx holds the class to the body's LAYOUT state and the EVIDENCE halo to its remount); never to EVIDENCE,
    // never to a sign or a structure.
    const positional = rules(MAPPING_FIELD_CSS).filter(r => !r.reduced && /transition:[^;]*transform/.test(r.body));
    expect(positional.map(r => r.selector).sort()).toEqual(['[data-testid="mapping-field"] .mf-layout', '[data-testid="mapping-field"] [data-mapping-body][data-change="LAYOUT"]'].sort());
    for (const r of positional) expect(r.body, r.selector).toBe(positional[0].body);
    // (4) by category: no rule that could reach a sign or a structure carries any transition but the LAYOUT body's
    const signs = /data-mapping-(arc|node|sector|hit)|data-testid="mapping-(ring|beam|arc|tick|capability|collar|sector|person)|data-change="EVIDENCE"|data-stage-part/;
    for (const r of rules(MAPPING_FIELD_CSS).filter(r => !r.reduced && /transition:\s*(?!none)/.test(r.body))) expect(signs.test(r.selector), r.selector).toBe(false);
  });
});

describe("MAP-E-NEURO · E-5 — staged recursion", () => {
  it("REPRODUCE: geometry 420 ms, evidence from 420 ms — never simultaneous", () => {
    expect(MOTION.stage.geometryMs).toBe(CONTRACT.stage.geometryMs);
    const [rule] = ruleFor('[data-stage-part="EVIDENCE"]');
    const a = animation(rule.body)!;
    expect(a.delay * 1000, "the evidence starts when the geometry has ended").toBe(CONTRACT.stage.evidenceFromMs);
    expect(a.delay * 1000).toBeGreaterThanOrEqual(MOTION.stage.geometryMs);
    expect(keyframes(MAPPING_FIELD_CSS, a.name).map(f => f.body.trim())).toEqual(["opacity: 0;", "opacity: 1;"]);
  });
});

describe("MAP-E-NEURO · P-5 / E-6 — the breath", () => {
  // PHASE F §12 (PERSON_X_JOB_MAPPING_PHASE_F.md, adjudicated before the change): this test pinned phase E's MECHANISM — one ring,
  // a ±1.5 % scale, a symmetric sine — which F-6 replaces (M-F5: that mechanism is the defect OTTAVIO rejected). Restated to its
  // meaning: the breath is 0.1 Hz, ≥ 30× under the flash threshold, 4 s rise : 6 s fall, CSS inside the field, and only while LIVE.
  it("REPRODUCE (restated, phase F §12): every breath rule is keyed on LIVE and selects inside the field; 0.1 Hz exactly; 4 s rise : 6 s fall; ≥ 30× under 3 Hz", () => {
    const live = ruleFor('[data-breath="LIVE"]').filter(r => /animation:/.test(r.body));
    expect(live.length, "the breath exists").toBeGreaterThan(0);
    for (const r of live) {
      expect(r.selector.startsWith('[data-testid="mapping-field"]'), r.selector).toBe(true);
      const a = animation(r.body)!;
      expect(1 / a.duration, "0.1 Hz ± 0").toBe(CONTRACT.breath.hz);
      expect([a.iterations, a.timing]).toEqual(["infinite", "linear"]);
      expect(1 / a.duration).toBeLessThanOrEqual(CONTRACT.flashHz / 30);
      // the waveform: the keyframes' modulation term w ∈ [-1, 1], at its trough at 0 % and 100 %, at its peak at 40 % (4 s of 10 s)
      const w = keyframes(MAPPING_FIELD_CSS, a.name).map(f => ({ at: f.at, w: Number(/\*\s*(-?[\d.]+)\);\s*$/.exec(f.body.trim())?.[1]) }));
      expect(w.every(f => Number.isFinite(f.w)), "every keyframe states its phase").toBe(true);
      const peak = w.reduce((m, f) => (f.w > m.w ? f : m)), trough = w.reduce((m, f) => (f.w < m.w ? f : m));
      expect([peak.at, peak.w, trough.w]).toEqual([40, 1, -1]);
      expect([w[0].w, w[w.length - 1].w]).toEqual([-1, -1]);
      for (let i = 1; i < w.length; i++) expect(Math.sign(w[i].w - w[i - 1].w) || 0, `monotone limbs at ${w[i].at}%`).toBe(w[i].at <= 40 ? 1 : -1);
    }
    // STILL ⇒ no breath: nothing outside a LIVE-keyed rule runs the breath's keyframes
    const name = animation(live[0].body)!.name;
    for (const r of rules(MAPPING_FIELD_CSS).filter(r => !r.reduced && r.body.includes(name))) expect(r.selector, "the breath only while LIVE").toContain('[data-breath="LIVE"]');
  });

  // PHASE F §12, restated: the calm guard keeps its full force; only the count of permitted layers changes.
  it("no other ambient motion (restated, phase F §12): nothing animates infinitely but rules keyed on LIVE and the user's own query", () => {
    const infinite = rules(MAPPING_FIELD_CSS).filter(r => !r.reduced && /animation:[^;]*infinite/.test(r.body)).map(r => r.selector);
    expect(infinite.length).toBeGreaterThan(0);
    for (const selector of infinite) expect(selector === '[data-testid="mapping-field"] [data-motion="QUERY"]' || selector.includes('[data-breath="LIVE"]'), selector).toBe(true);
    expect(MAPPING_FIELD_CSS, "the phase-lock pulse is gone (A-4)").not.toMatch(/\[data-phase-locked="true"\]\s*\{[^}]*animation/);
    expect(MAPPING_FIELD_CSS, "the resume pulse is gone (A-5)").not.toMatch(/mappingFieldPulse/);
  });
});

describe("MAP-E-NEURO · P-6 — reduced motion collapses everything (WCAG 2.3.3), with a positive control", () => {
  it("POSITIVE CONTROL: outside reduced motion the field DOES move — breath, query, transient, layout gradient, staging", () => {
    const moving = rules(MAPPING_FIELD_CSS).filter(r => !r.reduced && /(animation|transition):\s*(?!none)/.test(r.body)).map(r => r.selector);
    for (const marker of ['[data-breath="LIVE"]', '[data-motion="QUERY"]', '[data-change="EVIDENCE"]', '[data-change="LAYOUT"]', '[data-stage-part="EVIDENCE"]'])
      expect(moving.some(s => s.includes(marker)), marker).toBe(true);
  });

  it("REPRODUCE: under prefers-reduced-motion one rule takes every animation and transition of the field and everything in it to none, !important", () => {
    const reduced = rules(MAPPING_FIELD_CSS).filter(r => r.reduced);
    const all = reduced.find(r => r.selector === '[data-testid="mapping-field"], [data-testid="mapping-field"] *');
    expect(all?.body).toBe("animation: none !important; transition: none !important;");
    // Every moving rule outside the block selects inside the field, so the one rule reaches it; none is !important, so none escapes it.
    for (const r of rules(MAPPING_FIELD_CSS).filter(r => !r.reduced && /(animation|transition):/.test(r.body))) {
      expect(r.selector.startsWith('[data-testid="mapping-field"]'), r.selector).toBe(true);
      expect(r.body.includes("!important") ? /: none !important/.test(r.body) : true, r.selector).toBe(true);
    }
  });

  it("the static luminance highlight exists ONLY under reduced motion (A-6): the focused group is never dimmed in motion", () => {
    expect(rules(MAPPING_FIELD_CSS).filter(r => !r.reduced && r.selector.includes('[data-lit="false"]'))).toEqual([]);
    const dim = rules(MAPPING_FIELD_CSS).filter(r => r.reduced && r.selector.includes('[data-lit="false"]'));
    expect(dim.length).toBe(1);
    expect(dim[0].selector).toContain('[data-in-pool="true"]');
  });
});

describe("MAP-E-NEURO · A-7 — beams at one common gain", () => {
  it("the table's beam weights keep their ratios; the thinnest reaches ≥ 1.0 px", async () => {
    const { BEAM_WIDTH_GAIN } = await import("../../../app/components/career/demo/PersonJobMappingField");
    const widths = Object.fromEntries(Object.entries(BEAM_STROKE).map(([k, f]) => [k, f(1).width * BEAM_WIDTH_GAIN]));
    expect(Math.min(...Object.values(widths))).toBeGreaterThanOrEqual(1.0 - 1e-9);
    expect(widths.solid / widths.thin).toBeCloseTo(BEAM_STROKE.solid(1).width / BEAM_STROKE.thin(1).width, 9);
  });
});
