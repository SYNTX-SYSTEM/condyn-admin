/**
 * GRÜN · PHASE-G · PG-12's MEASURABILITY — what does a chroma instrument resolve?  **NO VERDICT** (A-G36 p2).
 *
 * ┌─ SPLIT SCOPE (A-G109 / A-G111 / A-G117) ─────────────────────────────────────────────────────────┐
 * │ PG-12 has been measured by NO lane, so its verdict-bearing quantity is SEALED (A-G109).          │
 * │ PUBLISHABLE — the chroma channel's RESOLUTION: the raster's chroma quantum at the levels in      │
 * │               play, the medium's own C* against it, and therefore whether the bound is           │
 * │               expressible at all. Measurability is not sealed (A-G111).                          │
 * │ SEALED      — the hue-carrying class's C* and the medium/hue ratio. By A-G117 the seal covers    │
 * │               any set from which the sealed quantity is derivable, so publishing the medium's C* │
 * │               means the hue class's C* must be sealed, not merely the quotient.                   │
 * └──────────────────────────────────────────────────────────────────────────────────────────────────┘
 *
 * Why this exists: §35 A-G119 records that GELB wrote PG-12's bound "before anyone asked what a chroma
 * instrument would resolve", and owes PG-12 the new fifth A-G95 field — what observation would make it FAIL on
 * an otherwise compliant build. That field cannot be written without knowing the channel's resolution, and
 * A-G111's own reason for publishing measurability is that withholding it makes another lane spend a run
 * discovering something already known. So the resolution is supplied; the reading is sealed.
 *
 * PG-12: "Hue containment. Hue lives on the semantics and never leaks to the ground: on medium pixels, chroma
 * <= 2 % of the chroma on the hue-carrying class."
 */
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import {
  chromium, openField, probeGeometry, clipOf, discMask, cdpSession, captureChroma, chromaQuantumFloor, labOf,
  classMasks, servedProvenance, PROVENANCE, median, pct, e4
} from "./gruen-instrument.mjs";
import { writeSealed } from "./gruen-provenance.mjs";

const here = dirname(fileURLToPath(import.meta.url));
/* §82: the worktree whose .next/BUILD_ID and git state the provenance block records. Defaults to THIS
   worktree, so every existing reading is unaffected; GRUEN_WT points it at a second build served on its own
   port, which is how the A-G49 hooks are verified without rebuilding — or overwriting — the build the eight
   sealed readings were taken against. */
const WT = process.env.GRUEN_WT ?? resolve(here, "../../../../..");
const VW = Number(process.env.VW ?? 1920), VH = Number(process.env.VH ?? 1080);
const BOUND = 0.02;   // PG-12: medium chroma <= 2 % of the hue-carrying class's

const browser = await chromium.launch();
const { ctx, page, guard } = await openField(browser, { reduce: true, vw: VW, vh: VH });
const provenance = await servedProvenance(page, WT);
const instrumentCommit = (() => { try { return execSync(`git -C ${WT} log -1 --format=%h -- docs/career_analysis/evidence/mapping-phase-g/scripts`, { encoding: "utf8" }).trim(); } catch { return null; } })();
const geo = await probeGeometry(page);
const clip = clipOf(geo, VW, VH);
const geom = discMask(clip, geo);
const { disc, N, W, H } = geom;
const cdp = await cdpSession(page);
const k = geo.unitsToPx;

const { masks } = await classMasks(page, cdp, clip, N, ["glowsAll", "bodyOutlines", "bodyNames", "arcs", "beams", "beamGlow", "travel", "nodes", "sectorText"]);
const isGlow = new Uint8Array(N); for (const i of masks.glowsAll) isGlow[i] = 1;
const notMedium = new Uint8Array(N);
for (const cls of ["glowsAll", "bodyOutlines", "bodyNames", "arcs", "beams", "beamGlow", "travel", "nodes", "sectorText"]) for (const i of masks[cls]) notMedium[i] = 1;

const { C, rgb } = await captureChroma(cdp, clip, N);
await ctx.close(); await browser.close();

/** the hue-carrying class: glow pixels belonging to a body with an unmet REQUIRED requirement (G-4's one hue) */
const gapBodies = geo.bodies.filter(b => b.inPool && b.requiredGaps > 0);
const plainBodies = geo.bodies.filter(b => b.inPool && b.requiredGaps === 0);
const inAnyHalo = (bodies, i) => {
  const x = i % W, y = (i - x) / W;
  return bodies.some(b => Math.hypot(x - (b.cx - clip.x), y - (b.cy - clip.y)) <= 3.0 * b.drawnRadiusUnits * k);
};
const hueIx = [], plainGlowIx = [], mediumIx = [];
for (let i = 0; i < N; i += 1) {
  if (isGlow[i]) { if (inAnyHalo(gapBodies, i)) hueIx.push(i); else if (inAnyHalo(plainBodies, i)) plainGlowIx.push(i); continue; }
  if (disc[i] && !notMedium[i]) mediumIx.push(i);
}
const statsC = ix => {
  const v = Float64Array.from(ix.map(i => C[i])); v.sort();
  return v.length === 0 ? { n: 0 } : { n: v.length, p50: +pct(v, 0.5).toFixed(4), p90: +pct(v, 0.9).toFixed(4), p99: +pct(v, 0.99).toFixed(4), max: +v[v.length - 1].toFixed(4), mean: +(v.reduce((a, b) => a + b, 0) / v.length).toFixed(4) };
};
const mediumC = statsC(mediumIx), hueC = statsC(hueIx), plainC = statsC(plainGlowIx);
/** the medium's own modal triple, and the raster's chroma quantum there */
const medianTriple = (() => {
  const r = [], g = [], b = [];
  for (const i of mediumIx) { r.push(rgb[i * 3]); g.push(rgb[i * 3 + 1]); b.push(rgb[i * 3 + 2]); }
  return [Math.round(median(r)), Math.round(median(g)), Math.round(median(b))];
})();
const floor = chromaQuantumFloor(...medianTriple);

const common = {
  verdict: PROVENANCE.verdict, provenance: { ...provenance, instrumentCommit }, instrument: PROVENANCE, guard,
  viewport: `${VW}x${VH}`, level: "L0", motion: "resting (reducedMotion:reduce)",
  chromaDefinition: "CIELAB C* = hypot(a*, b*), D65, from linearised sRGB. C* is zero on any neutral grey, so the field's near-neutral ink and the one hue separate on it, where a hue ANGLE is undefined at zero chroma."
};

/* ── PUBLISHABLE: the channel's resolution ─────────────────────────────────────────────────────────── */
const publishable = {
  ...common,
  reading: "GRÜN · PG-12 MEASURABILITY — the chroma channel's resolution at the levels in play",
  scope: "PUBLISHABLE per A-G111. The hue-carrying class's C* and the medium/hue ratio are SEALED in the companion file — by A-G117 a seal covers any set from which the sealed quantity is derivable, so publishing the medium's C* requires sealing the hue class's.",
  whyThisExists: "§35 A-G119: PG-12's bound was written before anyone asked what a chroma instrument would resolve, and GELB owes PG-12 the fifth A-G95 field — what observation would make it fail on an otherwise compliant build. That field cannot be written without the channel's resolution.",
  definitions: {
    medium: "disc pixels that are not glow, not any sign, and not a relation carrier — the same comparator PG-11 uses",
    chromaQuantum: "the C* produced by a +/-1 sRGB code step at a given triple: the raster's own chroma resolution there. Near black it is LARGE relative to the chroma being measured.",
    bound: `PG-12: medium chroma <= ${BOUND} x the hue-carrying class's chroma`
  },
  mediumChroma: mediumC,
  mediumModalTriple: medianTriple,
  chromaQuantumFloorAtMedium: floor,
  mediumC50_overQuantum: +(mediumC.p50 / Math.max(1e-9, floor.maxOneCodeDeltaC)).toFixed(2),
  referenceChromas: { gapHueAtFullStrength_rgb245_166_35: +labOf(245, 166, 35).C.toFixed(2), fieldInkAtFullStrength_rgb205_240_255: +labOf(205, 240, 255).C.toFixed(2), stagePlate_rgb3_5_8: +labOf(3, 5, 8).C.toFixed(2) },
  resolutionReading:
    `the medium's median C* is ${mediumC.p50} and one sRGB code step at its own modal triple [${medianTriple}] moves C* by up to ${floor.maxOneCodeDeltaC}. ` +
    `So the medium's chroma is ${(mediumC.p50 / Math.max(1e-9, floor.maxOneCodeDeltaC)).toFixed(2)} x the raster's chroma quantum there. ` +
    `A bound of ${BOUND} x another class's chroma is expressible only if that target sits well ABOVE this quantum; whether it does is in the sealed file, and the comparison is the fifth field's to make.`,
  /**
   * THE FORM FINDING, derived from PUBLISHED quantities plus a SOURCE CONSTANT — no sealed value is used.
   * A-G116 puts a pin's FORM outside the seal: this is about whether PG-12 can be satisfied by ANY build,
   * not about whether this artifact complies.
   */
  satisfiability: (() => {
    const required = mediumC.p50 / BOUND;                       // the hue class's C* the bound demands
    const hueFullStrength = labOf(245, 166, 35).C;              // GAP_HUE at alpha 1 — the most chroma this hue can have
    return {
      mediumChromaP50: mediumC.p50,
      hueClassChromaRequiredByBound: +required.toFixed(2),
      hueChromaAtFullStrength: +hueFullStrength.toFixed(2),
      headroomFactor: +(hueFullStrength / required).toFixed(3),
      satisfiableAtAnyAlpha: hueFullStrength >= required,
      reading: hueFullStrength >= required
        ? "the bound is reachable in principle; whether this build reaches it is sealed"
        : `the bound demands the hue-carrying class reach C* ${required.toFixed(2)} while GAP_HUE at FULL strength (alpha 1, rgb 245,166,35) has C* only ${hueFullStrength.toFixed(2)}. No alpha can exceed the hue's own chroma, and the glow is a low-alpha gradient over near-black, so NO rendering of this hue can satisfy the bound. PG-12 as written cannot be satisfied by any build — the mirror of PG-11, which cannot return a verdict on a compliant one.`,
      metricCaveat: "CONDITIONAL ON THE METRIC. PG-12 says 'chroma' without naming a colour space or a reference white. This is CIELAB C* (D65). A different definition — relative saturation, chroma in a cone-opponent space, a ratio against each pixel's own lightness — could change the conclusion, and some would make it satisfiable. That the pin's verdict depends on an unnamed metric is itself an A-G95 gap: the carrier is named (hue, on medium pixels) and the QUANTITY is not.",
      notAnOpinionOnCompliance: "this says the pin cannot be met by any artifact, which A-G116 places outside the seal. It says nothing about this build's reading, which is in the sealed file."
    };
  })(),
  nonNeutralityNote: "the stage plate rgb(3, 5, 8) is NOT neutral — its own C* is " + labOf(3, 5, 8).C.toFixed(2) + ", because the three codes differ. So the medium carries a non-zero chroma FLOOR from the plate colour alone, independent of any hue leak, and PG-12's 'never leaks to the ground' cannot mean C* = 0."
};
writeFileSync(resolve(here, `../outputs/pg12-chroma-resolution-${VW}x${VH}.json`), JSON.stringify(publishable, null, 1));

/* ── SEALED: the verdict-bearing quantity ──────────────────────────────────────────────────────────── */
const ratio = hueC.p50 > 0 ? mediumC.p50 / hueC.p50 : null;
const sealedBody = {
  SEALED: "A-G109 — PG-12's verdict-bearing quantity. Published to NOBODY, including GELB, until PINK's verdict on PG-12 is recorded. A-G117: the hue class's C* is sealed as well as the ratio, since the medium's C* is published and one division would recover this.",
  ...common,
  hueCarryingClassChroma: hueC, plainGlowChroma: plainC, mediumChroma: mediumC,
  mediumOverHue: ratio === null ? null : +ratio.toFixed(5), boundForReference: `<= ${BOUND}`,
  hueClassIdentification: "glow pixels within haloFar of a body with data-required-gaps > 0 (G-4's one hue, the mf-halo-gap gradient). Plain-glow chroma is reported beside it as a control: the two glow fills differ only in hue, so a chroma channel that cannot separate them is not resolving hue at all."
};
/* §88: A-G109 in code — refuses to replace an existing seal unless GRUEN_RESEAL=1. The UNSEALED companion
   above (pg12-chroma-resolution-*.json) is written normally, so it can be refreshed without a re-seal. */
const sealOutcome = writeSealed(resolve(here, `../outputs/SEALED-pg12-ratio-${VW}x${VH}.json`), sealedBody);
console.log(`seal ${sealOutcome.outcome}: ${sealOutcome.path.split("/").pop()}`);

console.log(JSON.stringify({ viewport: `${VW}x${VH}`, mediumChromaP50: mediumC.p50, mediumPixels: mediumC.n,
  modalTriple: medianTriple, chromaQuantumMax: floor.maxOneCodeDeltaC, mediumOverQuantum: publishable.mediumC50_overQuantum,
  platesOwnChroma: publishable.referenceChromas.stagePlate_rgb3_5_8, hueLimb: "SEALED" }, null, 1));
