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
    expect(evidence.length).toBe(1);
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

  it("inverse: no other rule gives a transient to anything but EVIDENCE, and no rule gives a position transition to EVIDENCE", () => {
    const transient = keyframes(MAPPING_FIELD_CSS, "mappingFieldTransient").length > 0 ? "mappingFieldTransient" : "";
    const users = rules(MAPPING_FIELD_CSS).filter(r => !r.reduced && transient !== "" && r.body.includes(transient));
    expect(users.map(r => r.selector)).toEqual(['[data-testid="mapping-field"] [data-mapping-body][data-change="EVIDENCE"]']);
    const positional = rules(MAPPING_FIELD_CSS).filter(r => !r.reduced && /transition:\s*transform/.test(r.body));
    expect(positional.map(r => r.selector)).toEqual(['[data-testid="mapping-field"] [data-mapping-body][data-change="LAYOUT"]']);
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
  it("REPRODUCE: on the outer ring only, while LIVE: 0.1 Hz exactly, radius amplitude ≤ 1.5 %, opacity ± 0.04 about its mean; ≥ 30× under 3 Hz", () => {
    const live = ruleFor('[data-breath="LIVE"]');
    expect(live.map(r => r.selector)).toEqual(['[data-testid="mapping-field"] [data-testid="mapping-ring-field"][data-breath="LIVE"]']);
    const a = animation(live[0].body)!;
    expect(1 / a.duration, "0.1 Hz ± 0").toBe(CONTRACT.breath.hz);
    expect([a.iterations, a.timing]).toEqual(["infinite", "linear"]);
    expect(1 / a.duration).toBeLessThanOrEqual(CONTRACT.flashHz / 30);
    const frames = keyframes(MAPPING_FIELD_CSS, a.name);
    const scales = frames.map(f => Number(numbersOf(f.body, "scale")[0])), opacities = frames.map(f => Number(/opacity:\s*([\d.]+)/.exec(f.body)?.[1]));
    expect(Math.max(...scales.map(s => Math.abs(s - 1))), "radius amplitude").toBeLessThanOrEqual(CONTRACT.breath.radius + 1e-9);
    expect(Math.max(...scales.map(s => Math.abs(s - 1))), "it does breathe").toBeGreaterThan(0);
    const mean = (Math.max(...opacities) + Math.min(...opacities)) / 2;
    expect((Math.max(...opacities) - Math.min(...opacities)) / 2).toBeCloseTo(CONTRACT.breath.opacity, 6);
    const [base] = ruleFor('[data-testid="mapping-ring-field"]').filter(r => !r.selector.includes("data-breath"));
    expect(Number(/opacity:\s*([\d.]+)/.exec(base.body)?.[1]), "still, the ring rests at its mean").toBeCloseTo(mean, 6);
    for (const f of frames) expect(Number(/opacity:\s*([\d.]+)/.exec(f.body)?.[1]) - mean).toBeCloseTo(CONTRACT.breath.opacity * Math.sin((2 * Math.PI * f.at) / 100), 5);
  });

  it("no other ambient motion: nothing animates infinitely but the breath (LIVE) and the user's own query", () => {
    const infinite = rules(MAPPING_FIELD_CSS).filter(r => !r.reduced && /animation:[^;]*infinite/.test(r.body)).map(r => r.selector);
    expect(infinite.sort()).toEqual(['[data-testid="mapping-field"] [data-motion="QUERY"]', '[data-testid="mapping-field"] [data-testid="mapping-ring-field"][data-breath="LIVE"]'].sort());
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
