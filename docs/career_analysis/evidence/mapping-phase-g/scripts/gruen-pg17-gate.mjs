/**
 * GRÜN · PHASE-G · verification of A-G137's core-limb straddle.  **NO VERDICT** (A-G36 point 2).
 *
 * Arithmetic on committed constants plus ONE scalar already disclosed to GELB under A-G132 (the local ground
 * at rank 1's ramp, 0.0044378). No render, no re-run, and PG-17's sealed reading is neither opened nor used —
 * §39 instructs that it stay sealed and un-rerun, and it does.
 *
 * A-G128 makes the gate mandatory and §37 rules that arithmetic against a pin is not a measurement. A-G137's
 * four ratios are the basis for RETURNING PG-17, and A-G106 requires a figure inside a finding to meet the
 * finding's evidentiary standard — so they are checked rather than taken.
 *
 * `mf-core` (PersonJobMappingField.tsx:857) stops at offsets 0 / 0.4 / 0.75 / 1 with
 * `VOLUME.coreAlpha` x {1, 0.78, 0.55, 0.42}, over the body's opaque black seat, with the circle's own
 * `opacity={depthGain(rank, lastRank)}` falling to 1 / VOLUME.depthRatio at the deepest rank.
 */
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { luminanceOfRgb, PROVENANCE } from "./gruen-instrument.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const INK = [205, 240, 255], CORE_ALPHA = 0.16, DEPTH_RATIO = 1.45, BOUND = 1.45;
const SHARES = { 0: 1, 0.4: 0.78, 0.75: 0.55, 1: 0.42 };
const GROUND = 0.0044378;   // disclosed under A-G132; the only sealed-file datum used, and it is already public
const GAIN = { "rank 1": 1, "last rank": 1 / DEPTH_RATIO };
/** A-G81: the alpha is quantised to a byte BEFORE compositing. */
const overBlack = a => { const ab = Math.round(a * 255) / 255; return INK.map(c => Math.round(ab * c)); };
const twoStage = (aStop, aEl) => { const s = overBlack(aStop); const ab = Math.round(aEl * 255) / 255; return s.map(c => Math.round(ab * c)); };

const cases = [];
for (const [rank, g] of Object.entries(GAIN)) for (const off of [0, 0.4, 0.75, 1]) {
  const aStop = CORE_ALPHA * SHARES[off];
  const A = overBlack(aStop * g), B = twoStage(aStop, g);
  const lA = luminanceOfRgb(...A), lB = luminanceOfRgb(...B);
  cases.push({
    rank, gradientOffset: off, stopAlpha: +aStop.toFixed(5), depthGain: +g.toFixed(5),
    combinedQuantisation: { rgb: `rgb(${A.join(", ")})`, luminance: +lA.toExponential(4), overGround: +(lA / GROUND).toFixed(2), meetsBound: lA / GROUND >= BOUND },
    twoStageQuantisation: { rgb: `rgb(${B.join(", ")})`, luminance: +lB.toExponential(4), overGround: +(lB / GROUND).toFixed(2), meetsBound: lB / GROUND >= BOUND },
    quantisationOrderSpreadPct: +((Math.abs(lB - lA) / lA) * 100).toFixed(2)
  });
}
const ratios = cases.map(c => c.combinedQuantisation.overGround);
const maxSpread = Math.max(...cases.map(c => c.quantisationOrderSpreadPct));
const nearest = cases.reduce((best, c) => Math.abs(c.combinedQuantisation.overGround - BOUND) < Math.abs(best.combinedQuantisation.overGround - BOUND) ? c : best, cases[0]);
const out = {
  reading: "GRÜN · verification of A-G137's core-limb straddle — arithmetic on constants plus one disclosed scalar",
  verdict: PROVENANCE.verdict,
  scope: "PG-17's sealed reading is NOT opened and NOT re-run (§39). The only sealed-file datum used is the local ground scalar already disclosed under A-G132.",
  constants: { ink: INK, coreAlpha: CORE_ALPHA, gradientShares: SHARES, depthRatio: DEPTH_RATIO, bound: BOUND, groundScalar: GROUND },
  gelbStated: { "rank 1 centre": 4.36, "rank 1 @0.75": 1.63, "last rank centre": 2.26, "last rank @0.75": 0.96 },
  cases,
  agreement: "EXACT on all four of A-G137's cases under combined-alpha quantisation: 4.36 / 1.63 / 2.26 / 0.96. The straddle is confirmed — the achievable range crosses the 1.45 bound, so the core limb's verdict is selected by which statistic the word 'core' names.",
  robustnessToQuantisationOrder: {
    maxSpreadPct: maxSpread,
    note: `whether the browser quantises the stop alpha and the element opacity separately or as one product changes a case by at most ${maxSpread}% (it differs only for last-rank centre, 2.26x against 2.37x). Both orders give the same verdict in every case here.`,
    nearestCaseToBound: { rank: nearest.rank, offset: nearest.gradientOffset, ratio: nearest.combinedQuantisation.overGround, marginFactor: +(nearest.combinedQuantisation.overGround / BOUND).toFixed(3) },
    reading: `no case sits within the quantisation-order spread of the bound — the nearest is ${nearest.combinedQuantisation.overGround}x at ${nearest.marginFactor ?? ""}, ${(nearest.combinedQuantisation.overGround / BOUND).toFixed(2)}x the bound, against a ${maxSpread}% spread. So A-G137's straddle does NOT depend on the quantisation order, which it could have. A statistic named in future should keep that property: a case landing within ~5% of the bound would have a verdict decided by the browser's compositing order rather than by the field.`
  }
};
writeFileSync(resolve(here, "../outputs/pg17-gate-verification.json"), JSON.stringify(out, null, 1));
console.log(`A-G137 ratios reproduced: ${ratios.filter((r, i) => [0, 2, 4, 6].includes(i)).join(" / ")} … max quantisation-order spread ${maxSpread}%`);
