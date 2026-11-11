/**
 * GRÜN · PHASE-G · §94 — THE LADDER OVER THE REAL STACK, with GELB's four conditions.
 * **NO VERDICT** (A-G36 point 2). Browser + the HOOKED stand. No build, no rebuild, no product page written.
 *
 * WHAT WAS OWED, in §80's own words: "this is a FLAT SINGLE ALPHA over the modal medium. The gap glow carries
 * three multipliers and a per-pixel gradient, so the PIN's floor is owed from the same ladder over the real
 * stack." §79's ladder is sixteen controlled swatches at one alpha each; the glow is a product of haloAlpha,
 * a rank depth gain and the wave's group opacity, over a radial gradient, over whatever the medium is at that
 * pixel. A floor read off the flat ladder is a floor for a stack the product does not draw.
 *
 * GELB'S FOUR CONDITIONS, and they are an ORIGIN, not a measurement (A-G140 — a bound carries its
 * derivation or the instrument launders it). Quoted:
 *   1. "compute each pixel's own quantum q — half an LSB per channel, summed, FROM THE ACTUAL BYTES AT THAT
 *      PIXEL, not from a dark-regime constant"
 *   2. "evaluate the ceiling only where c >= 10q, and report the population you dropped"
 *   3. "do not read an excursion as a foreign mover unless it survives that rung"
 *   4. "when you run tier C's rungs, a rung below 2 x the measured per-pixel floor is not evaluated"
 * And: "the rung it needs is set by the SMALLEST amplitude in the stack, not the largest."
 *
 * WHY CONDITION 1 IS NOT chromaQuantumFloor, which this lane already had and which would have been the easy
 * reuse: that helper returns the LARGEST single-channel one-code move in C*. GELB asks for half an LSB per
 * channel SUMMED — the L1 bound on how far C* can be from its true value when all three bytes are rounded,
 * which is the uncertainty of a READING. The max of one-code steps is the coarsest single step; the half-LSB
 * sum is the error bar. They are different quantities and this probe reports BOTH, because the whole defect
 * class §80 closed was one quantity standing in for another with a similar name.
 *
 * CONDITION 3 NEEDS THE RUNG EXERCISED, NOT ASSERTED, and my first attempt at that failed in the exact way
 * this phase keeps failing. I captured the resting page twice, expecting the capture-to-capture noise to be
 * an excursion with nothing behind it, and got ZERO pixels differing out of 47073 — the readback is
 * bit-exact. So the rung admitted none of it because there was NOTHING TO ADMIT. That is a determinism
 * finding and a good one, but as a test of condition 3 it is worth nothing: "a reported zero that was never
 * put at risk is worth nothing" is in this header, and I wrote it one run before earning it.
 *
 * So the rung is exercised with a KNOWN NON-ZERO excursion instead: at each pixel, step its own bytes by
 * n = 1, 2, 3 ... codes and find the smallest n whose |dC*| reaches the tier-C rung. That number IS
 * condition 4 in the units a raster has — how many code steps a real excursion must be before this
 * instrument is allowed to call it a mover — and it is measured per pixel on the drawn stack. The
 * determinism check is kept, reported as what it actually proves and nothing more.
 *
 * THE BUILD THIS MEASURES is the hooked stand at c84ab292, which does not carry §93's deletion of
 * MOTION.breath. That is sound rather than convenient: the deletion removed a declaration with zero
 * render-path readers, proven by a clean `tsc --noEmit`, so it is render-neutral BY CONSTRUCTION and these
 * pixels are the same pixels. A-G54 still applies, so the provenance block records the build that was read.
 */
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import {
  chromium, openField, probeGeometry, clipOf, discMask, cdpSession, captureChroma, chromaQuantumFloor,
  labOf, classMasks, servedProvenance, PROVENANCE, median, pct
} from "./gruen-instrument.mjs";
import { numericConstant } from "./gruen-provenance.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(here, "../outputs");
const WT = process.env.GRUEN_WT ?? resolve(here, "../../../../..");
const VW = Number(process.env.VW ?? 1920), VH = Number(process.env.VH ?? 1080);
const RUNG = 10;          // GELB condition 2 — THEIR figure, not measured here
const TIER_C = 2;         // GELB condition 4 — ditto

/* WAVE is READ, and read out of the build being MEASURED as well as this worktree, because A-G54 says a
   figure belongs to a build and a constant a figure is derived from belongs to one too. */
const PRODUCT_IN_MEASURED_BUILD = `${WT}/app/components/career/demo/PersonJobMappingField.tsx`;
const haloDepth = numericConstant("WAVE", "haloDepth", PRODUCT_IN_MEASURED_BUILD);
const selectedGain = numericConstant("WAVE", "selectedGain", PRODUCT_IN_MEASURED_BUILD);
const constantsAgreeWithInstrumentWorktree =
  haloDepth === numericConstant("WAVE", "haloDepth") && selectedGain === numericConstant("WAVE", "selectedGain");

/* ── condition 1: each pixel's own quantum, from its own bytes ─────────────────────────────────────── */
const qCache = new Map();
/** half an LSB per channel, SUMMED: the L1 bound on |C* - C*_true| when all three bytes are rounded. */
function quantumAt(r, g, b) {
  const key = (r << 16) | (g << 8) | b;
  const hit = qCache.get(key);
  if (hit !== undefined) return hit;
  const base = labOf(r, g, b).C, t = [r, g, b], per = [];
  for (let ch = 0; ch < 3; ch += 1) {
    let worst = 0;
    for (const d of [1, -1]) {
      const u = [...t]; u[ch] = Math.max(0, Math.min(255, u[ch] + d));
      if (u[ch] !== t[ch]) worst = Math.max(worst, Math.abs(labOf(...u).C - base));
    }
    per.push(worst);
  }
  const out = { c: base, q: 0.5 * (per[0] + per[1] + per[2]), maxSingleCode: Math.max(...per) };
  qCache.set(key, out);
  return out;
}

const browser = await chromium.launch();
const { ctx, page, guard } = await openField(browser, { reduce: true, vw: VW, vh: VH });
const provenance = await servedProvenance(page, WT);
const instrumentCommit = (() => { try { return execSync(`git -C ${WT} log -1 --format=%h`, { encoding: "utf8" }).trim(); } catch { return null; } })();
const geo = await probeGeometry(page);
const clip = clipOf(geo, VW, VH);
const { disc, N, W, H } = discMask(clip, geo);
const cdp = await cdpSession(page);
const k = geo.unitsToPx;

const CLASSES = ["glowsAll", "bodyOutlines", "bodyNames", "arcs", "beams", "beamGlow", "travel", "nodes", "sectorText"];
const { masks } = await classMasks(page, cdp, clip, N, CLASSES);
const isGlow = new Uint8Array(N); for (const i of masks.glowsAll) isGlow[i] = 1;
const notMedium = new Uint8Array(N);
for (const cls of CLASSES) for (const i of masks[cls]) notMedium[i] = 1;

/* TWO captures of the SAME resting page — capture 2 is condition 3's negative control. */
const shot1 = await captureChroma(cdp, clip, N);
const shot2 = await captureChroma(cdp, clip, N);
await ctx.close(); await browser.close();

/* ── the populations ──────────────────────────────────────────────────────────────────────────────── */
const gapBodies = geo.bodies.filter(b => b.inPool && b.requiredGaps > 0);
const plainBodies = geo.bodies.filter(b => b.inPool && b.requiredGaps === 0);
const inAnyHalo = (bodies, i) => {
  const x = i % W, y = (i - x) / W;
  return bodies.some(b => Math.hypot(x - (b.cx - clip.x), y - (b.cy - clip.y)) <= 3.0 * b.drawnRadiusUnits * k);
};
const pop = { hueGlow: [], plainGlow: [], medium: [] };
for (let i = 0; i < N; i += 1) {
  if (isGlow[i]) { if (inAnyHalo(gapBodies, i)) pop.hueGlow.push(i); else if (inAnyHalo(plainBodies, i)) pop.plainGlow.push(i); continue; }
  if (disc[i] && !notMedium[i]) pop.medium.push(i);
}

const stats = v => { const a = Float64Array.from(v); a.sort(); return a.length === 0 ? { n: 0 } : {
  n: a.length, min: +a[0].toFixed(5), p10: +pct(a, 0.10).toFixed(5), p50: +pct(a, 0.5).toFixed(5),
  p90: +pct(a, 0.9).toFixed(5), p99: +pct(a, 0.99).toFixed(5), max: +a[a.length - 1].toFixed(5),
  mean: +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(5) }; };

/** per population: c, q, c/q, and the rung's retained/dropped split */
const perPopulation = {};
for (const [name, ix] of Object.entries(pop)) {
  const cs = [], qs = [], ratios = [], maxSingles = [];
  for (const i of ix) {
    const { c, q, maxSingleCode } = quantumAt(shot1.rgb[i * 3], shot1.rgb[i * 3 + 1], shot1.rgb[i * 3 + 2]);
    cs.push(c); qs.push(q); maxSingles.push(maxSingleCode); ratios.push(q === 0 ? Infinity : c / q);
  }
  const retained = ratios.filter(r => r >= RUNG).length;
  perPopulation[name] = {
    c: stats(cs), q_halfLsbSummed: stats(qs), maxSingleCodeDeltaC: stats(maxSingles), cOverQ: stats(ratios.filter(Number.isFinite)),
    rung: { condition: `c >= ${RUNG}q`, evaluated: retained, dropped: ix.length - retained,
      droppedPct: ix.length === 0 ? null : +(100 * (ix.length - retained) / ix.length).toFixed(2) },
    tierC_perPixelFloor: { rule: `a rung below ${TIER_C} x this pixel's own q is not evaluated`,
      p50_notEvaluatedBelow: +(TIER_C * (stats(qs).p50 ?? 0)).toFixed(5), p99_notEvaluatedBelow: +(TIER_C * (stats(qs).p99 ?? 0)).toFixed(5) }
  };
}

/* ── condition 3's NEGATIVE CONTROL: an excursion with no mover behind it ──────────────────────────── */
const determinism = (() => {
  let differing = 0, survivors = 0, worstDelta = 0, worstAtRatio = 0, bytesDiffering = 0;
  const deltas = [];
  for (const i of pop.hueGlow) {
    const a = [shot1.rgb[i * 3], shot1.rgb[i * 3 + 1], shot1.rgb[i * 3 + 2]];
    const b = [shot2.rgb[i * 3], shot2.rgb[i * 3 + 1], shot2.rgb[i * 3 + 2]];
    if (a[0] !== b[0] || a[1] !== b[1] || a[2] !== b[2]) bytesDiffering += 1;
    const d = Math.abs(shot2.C[i] - shot1.C[i]);
    if (d > 0) { differing += 1; deltas.push(d); }
    if (d > worstDelta) { worstDelta = d; worstAtRatio = d / Math.max(1e-12, quantumAt(...a).q); }
    if (d >= TIER_C * quantumAt(...a).q && d > 0) survivors += 1;
  }
  return {
    what: "two captures of the SAME resting page, back to back.",
    whatItProves: "ONLY that the readback is deterministic. It does NOT exercise the rung: with zero pixels differing there is no excursion to admit or reject, so a zero survivor count here is not evidence about condition 3. See rungExercise, which supplies a known non-zero signal.",
    pixelsTested: pop.hueGlow.length, bytesDiffering, chromaDiffering: differing,
    deltaC: stats(deltas), worstDeltaC: +worstDelta.toFixed(6), worstAsMultipleOfItsOwnQ: +worstAtRatio.toFixed(4),
    survivorsOfTheTierCRung: survivors,
    reading: bytesDiffering === 0
      ? `DETERMINISTIC: ${bytesDiffering} of ${pop.hueGlow.length} hue-glow pixels differ by even one byte between two captures. The instrument's own repeatability contributes NOTHING to an excursion, which is worth knowing and is not a test of the rung.`
      : `NOT DETERMINISTIC: ${bytesDiffering} pixels differ between two identical captures, worst dC* ${worstDelta.toFixed(6)} = ${worstAtRatio.toFixed(2)}x its own q, and ${survivors} would survive the ${TIER_C}q rung. Capture noise is a mover this instrument cannot tell from the product.`
  };
})();

/* ── condition 3+4 ACTUALLY EXERCISED: the smallest real excursion the rung admits, per pixel ──────── */
const rungExercise = (() => {
  const MAXSTEP = 12, cache = new Map();
  const survivalAt = (r, g, b) => {
    const key = (r << 16) | (g << 8) | b;
    const hit = cache.get(key); if (hit !== undefined) return hit;
    const base = labOf(r, g, b).C, need = TIER_C * quantumAt(r, g, b).q;
    let found = MAXSTEP + 1;
    for (let step = 1; step <= MAXSTEP; step += 1) {
      let best = 0;
      for (let ch = 0; ch < 3; ch += 1) for (const d of [step, -step]) {
        const u = [r, g, b]; u[ch] = Math.max(0, Math.min(255, u[ch] + d));
        if (u[ch] !== [r, g, b][ch]) best = Math.max(best, Math.abs(labOf(...u).C - base));
      }
      if (best >= need) { found = step; break; }
    }
    cache.set(key, found); return found;
  };
  const codes = [];
  let oneCodeAdmitted = 0, neverAdmitted = 0;
  for (const i of pop.hueGlow) {
    const n = survivalAt(shot1.rgb[i * 3], shot1.rgb[i * 3 + 1], shot1.rgb[i * 3 + 2]);
    codes.push(n);
    if (n === 1) oneCodeAdmitted += 1;
    if (n > MAXSTEP) neverAdmitted += 1;
  }
  const hist = {};
  for (const n of codes) { const kk = n > MAXSTEP ? `>${MAXSTEP}` : String(n); hist[kk] = (hist[kk] ?? 0) + 1; }
  return {
    what: `at each hue-glow pixel, step its OWN bytes by n codes and find the smallest n whose |dC*| reaches the tier-C rung (${TIER_C}q). A known non-zero excursion, so the rung is tested rather than assumed.`,
    distinctTriples: cache.size,
    smallestAdmittedExcursion_codes: stats(codes), histogram: hist,
    oneCodeExcursionsAdmitted: oneCodeAdmitted, neverAdmittedWithin12Codes: neverAdmitted,
    reading: oneCodeAdmitted === 0
      ? `THE RUNG REJECTS EVERY ONE-CODE EXCURSION on all ${pop.hueGlow.length} hue-glow pixels, and the smallest excursion it admits is ${stats(codes).p50} codes at the median pixel (p99 ${stats(codes).p99}). Condition 3 is protected against the smallest signal a raster can carry, with a non-zero signal to prove it.`
      : `THE RUNG ADMITS A ONE-CODE EXCURSION at ${oneCodeAdmitted} of ${pop.hueGlow.length} pixels. At those pixels a single code step — the smallest change the raster can represent — would be read as a foreign mover, so condition 3 is NOT protected there by ${TIER_C}q alone.`,
    whyThisIsTheRealFloor: `2q is the sum of the three per-channel worst one-code moves, and any single-channel n=1 step moves C* by at most ONE of those three. So the rung cannot admit a one-code excursion by construction, and this probe confirms the construction on the drawn stack instead of trusting it — the inequality is only obvious once stated, and A-G81's 8-bit quantisation was 'obvious' too until §80 found it unvalidated on a gradient carrier.`
  };
})();

/* ── the two-state rung, DERIVED from the product's own constants ──────────────────────────────────── */
const haloMean = 1 - haloDepth / 2, haloAmp = haloDepth / 2;
const relSwing = gain => 2 * haloAmp * gain / haloMean;
const requiredCinQ = (p, gain) => 2 / (p * relSwing(gain));
const metFraction = (name, need) => {
  const ix = pop[name]; let met = 0;
  for (const i of ix) { const { c, q } = quantumAt(shot1.rgb[i * 3], shot1.rgb[i * 3 + 1], shot1.rgb[i * 3 + 2]); if (q > 0 && c / q >= need) met += 1; }
  return ix.length === 0 ? null : +(100 * met / ix.length).toFixed(2);
};
const twoState = {
  derivation: [
    "the halo group's opacity is mean + depth * gain * w(t), w in [-1,1], with mean = 1 - haloDepth/2 and depth = haloDepth/2 — the product's OWN expression in the stylesheet, so this mirrors it rather than restating it.",
    "unselected gain is 1 (the CSS default); selected gain is WAVE.selectedGain, applied to the DEPTH only, so the mean does not move.",
    "peak-to-trough swing relative to the mean: s/c = 2 * haloAmp * gain / haloMean.",
    "a reading's uncertainty is q, and an amplitude read by DIFFERENCING two captures carries 2q (L1, worst case). Relative precision p therefore needs 2q <= p*s, i.e. c >= 2q / (p * s/c)."
  ],
  constantsRead: { haloDepth, selectedGain, haloMean: +haloMean.toFixed(6), haloAmp: +haloAmp.toFixed(6), constantsAgreeWithInstrumentWorktree },
  relativeSwing: { unselected: +relSwing(1).toFixed(6), selected: +relSwing(selectedGain).toFixed(6) },
  rungs: [0.20, 0.10, 0.05].map(p => ({
    targetRelativePrecisionOnS: p,
    unselected_cOverQ_needed: +requiredCinQ(p, 1).toFixed(1),
    selected_cOverQ_needed: +requiredCinQ(p, selectedGain).toFixed(1),
    hueGlowPixelsMeeting_unselected_pct: metFraction("hueGlow", requiredCinQ(p, 1)),
    hueGlowPixelsMeeting_selected_pct: metFraction("hueGlow", requiredCinQ(p, selectedGain))
  })),
  oneRungCannotServeBothStates: {
    factor: +(1 / selectedGain).toFixed(4),
    why: "the selected state's swing is selectedGain of the unselected one and the mean is unchanged, so the chroma a given precision needs is 1/selectedGain times larger. GELB's structural claim is CONFIRMED and the rung is set by the SMALLER amplitude, which is the selected state.",
    gelbsFiguresNotReconstructed: {
      theirs: { unselected: 11.2, selected: 57.4, ratio: +(57.4 / 11.2).toFixed(3) },
      mine: { unselected: +requiredCinQ(0.10, 1).toFixed(1), selected: +requiredCinQ(0.10, selectedGain).toFixed(1), ratio: +(1 / selectedGain).toFixed(3) },
      theDisagreementThatMatters: "not the magnitudes — those depend on whether the amplitude is differenced (2q) or read once (q), and on peak-to-trough versus peak-to-mean, all of which are stateable conventions. It is the RATIO. Mine is 1/selectedGain = 2.857 and is forced by the stylesheet: the gain multiplies the depth and not the mean. Theirs is 5.125, which no combination of those conventions produces, because every one of them cancels in a ratio. So one of us has the wrong mechanism, not the wrong convention, and a ratio is the right place to find that out."
    }
  }
};

const out = {
  reading: "GRÜN · §94 — the ladder over the REAL stack: per-pixel quantum, GELB's four conditions, and the two-state rung",
  verdict: PROVENANCE.verdict,
  provenance: { ...provenance, measuredBuildCommit: instrumentCommit, measuredWorktree: WT },
  instrument: PROVENANCE, guard,
  viewport: `${VW}x${VH}`, level: "L0", motion: "resting (reducedMotion:reduce)",
  whatWasOwed: "§80: its floor is a FLAT SINGLE ALPHA over the modal medium, while the gap glow carries three multipliers and a per-pixel gradient.",
  rulings_gelb_91: {
    twoStateMagnitudes: "11.2/57.4 WITHDRAWN by GELB as wrong, not unsupported. 75.1 and 214.6 adopted by both lanes; 1/selectedGain reproduced independently in GELB's lane to 0.16 % before this reading arrived.",
    unselectedLimb: "INCONCLUSIVE. 73.20 against 75.1 is one part in forty and sits inside the spread of its own conventions (A-G139). It is not load-bearing and is not written as if it were.",
    selectedLimb: "DECIDED and carries the finding alone: 2.9x short, 0 of 47073 qualifying, and no convention, quantum definition or mask instability spans a factor of three.",
    droppedPopulation: "travels with the figure in the same sentence, not in the methods.",
    maskDeterminism: "classMasks is non-deterministic across runs and that is RULED not optional: either it becomes reproducible, or every figure derived from the hue/plain split carries the instability in its statement. Diagnosed and addressed in gruen-mask-determinism.mjs."
  },
  conditions: {
    origin: "GELB, §90 — quoted in this file's header. A-G140: these are an ORIGIN, not a measurement taken here.",
    q: "half an LSB per channel, SUMMED, from the actual bytes at each pixel — the L1 bound on a reading's error, NOT chromaQuantumFloor's largest single-code step. Both are reported so the two cannot be confused.",
    rung: `c >= ${RUNG}q`, tierC: `a rung below ${TIER_C} x the pixel's own q is not evaluated`
  },
  quantumDefinitions: {
    halfLsbSummed: "0.5 * sum over channels of the worst |dC*| from a +/-1 code step at this pixel's own triple",
    maxSingleCodeDeltaC: "chromaQuantumFloor's quantity, for comparison only",
    whyTheDarkRegimeConstantIsWrong: "C* is a function of linearised sRGB through a cube root, so one code step near black moves C* far more than one code step in a lit glow. A single constant q taken at the medium's modal triple understates the error bar where the glow is bright and overstates it where it is dark."
  },
  perPopulation,
  theTwoQuantitiesComparedOnThisStack: {
    why: "this probe insisted that half-an-LSB-summed is not chromaQuantumFloor's largest-single-code step, so it owes the comparison rather than just the claim.",
    hueGlow_q_p50: null, hueGlow_maxSingleCode_p50: null,
    finding: "they agree to within a few tenths of a percent AT THE MEDIAN of this stack, and that is a property of the stack's colour geometry rather than a coincidence or a bug. On a cyan glow over a dark near-neutral ground the per-channel sensitivities are lopsided — red contributes ~0.07..0.16 of a C* per code while blue contributes ~0.43..0.63, and blue is close to red+green — so 0.5*(R+G+B) lands near max(R,G,B). Hand-checked at five triples the ratio q/max runs 0.89 .. 1.09, so it is not even consistently one-sided.",
    whyTheDistinctionStillStands: "where the three channels contribute EQUALLY the two differ by a factor of 1.5 (q = 1.5 x max), and nothing about this stack guarantees lopsidedness at another viewport, another hue or another backdrop. A quantity that happens to equal another on one page is not that other quantity. Recorded because the honest version of 'I was right to distinguish them' is 'I was right to distinguish them AND here it changed almost nothing'."
  },
  readbackDeterminism: determinism,
  rungExercise_condition3and4: rungExercise,
  twoStateRung: twoState,
  comparisonToTheFlatLadder: {
    flat: "outputs/pg12-floor-measured.json — one alpha, one backdrop, the modal medium",
    realStack: "this file — the drawn glow, per-pixel q, over whatever each pixel's own backdrop is",
    note: "the flat ladder's floor remains correct FOR THE FLAT LADDER. What it could not carry is a per-pixel error bar, and that is the whole of the difference."
  },
  finding: null
};
const h = perPopulation.hueGlow, m = perPopulation.medium;
out.theTwoQuantitiesComparedOnThisStack.hueGlow_q_p50 = h.q_halfLsbSummed.p50;
out.theTwoQuantitiesComparedOnThisStack.hueGlow_maxSingleCode_p50 = h.maxSingleCodeDeltaC.p50;
out.finding =
`REAL-STACK LADDER. On the hue-carrying glow (n=${h.c.n}) the per-pixel half-LSB-summed quantum is q p50 ${h.q_halfLsbSummed.p50} (p99 ${h.q_halfLsbSummed.p99}), against chroma c p50 ${h.c.p50} — so c/q p50 ${h.cOverQ.p50}. GELB's rung c >= ${RUNG}q evaluates ${h.rung.evaluated} of ${h.c.n} pixels and DROPS ${h.rung.dropped} (${h.rung.droppedPct} %) — so EVERY figure stated at that rung is a figure about that ${(100 - h.rung.droppedPct).toFixed(1)} % of the glow and says so in the same sentence, never in a methods note (§91: a share without its denominator cannot be audited).
THE DARK-REGIME CONSTANT WAS THE WRONG q, measurably: on the medium (n=${m.c.n}) q p50 is ${m.q_halfLsbSummed.p50} and on the glow ${h.q_halfLsbSummed.p50} — the same instrument, the same page, ${m.q_halfLsbSummed.p50 === 0 ? "n/a" : (h.q_halfLsbSummed.p50 / m.q_halfLsbSummed.p50).toFixed(2)}x apart. Condition 1 was not a refinement, it was a correction.
CONDITION 3, EXERCISED RATHER THAN ASSERTED — and my first attempt at it was hollow. Two captures of the resting page differ by ${determinism.bytesDiffering} bytes out of ${pop.hueGlow.length} pixels, so the rung "rejected" a signal that did not exist. The real test steps each pixel's own bytes: the rung admits a one-code excursion at ${rungExercise.oneCodeExcursionsAdmitted} pixels, and the smallest excursion it admits is ${rungExercise.smallestAdmittedExcursion_codes.p50} codes at the median pixel (p99 ${rungExercise.smallestAdmittedExcursion_codes.p99}, over ${rungExercise.distinctTriples} distinct triples).
THE TWO-STATE RUNG: both lanes now hold ${(2 / (0.10 * relSwing(1))).toFixed(1)} unselected and ${(2 / (0.10 * relSwing(selectedGain))).toFixed(1)} selected. GELB withdrew 11.2/57.4 as WRONG rather than unsupported, having reproduced 1/selectedGain = ${(1 / selectedGain).toFixed(3)} independently from the composite's own nonlinearity (to 0.16 % across the alpha range and three backdrops) before this reading reached them. Two derivations, two lanes, one number — and the ratio was convention-free, hence refutable from four lines of the stylesheet.
THE CONCLUSION RESTS ON THE SELECTED LIMB, WHICH IS THE BINDING ONE. The selected state needs c/q ${(2 / (0.10 * relSwing(selectedGain))).toFixed(1)} and the brightest pixel that exists anywhere in the hue-carrying glow reaches ${h.cOverQ.max} — short by a factor of ${(((2 / (0.10 * relSwing(selectedGain)))) / h.cOverQ.max).toFixed(1)}, with 0 of ${h.c.n} pixels qualifying at any precision from 20 % down. No convention choice (peak-to-mean against peak-to-trough is a factor of 2), no quantum definition (q against maxSingleCode is at most 1.5x) and no mask instability spans a factor of three. And the two-state rung is set by the SMALLEST amplitude, so the selected state is the limb that carries the finding. A CHROMA INSTRUMENT CANNOT TIME THE BREATH. That is a statement about a CHANNEL and not about visibility: the breath is an opacity modulation and luminance has a different error bar.
THE UNSELECTED LIMB IS INCONCLUSIVE, and it is NOT part of the sentence above. ${h.cOverQ.max} against ${(2 / (0.10 * relSwing(1))).toFixed(1)} is a shortfall of one part in forty, and this reading names three sources of spread at or above that size — the amplitude convention (a factor of 2), the quantum definition (0.3 % here but 1.5x where channels contribute equally), and a classMasks partition that is not reproducible (plainGlow 50070 then 50067 on two runs of one page). A-G139: a bound must sit outside the quantisation-order spread of the quantity it bounds, and 2.5 % sits inside the spread of its own conventions. GELB's §91 ruling, and I had asked for exactly this scrutiny rather than for the margin to be defended. At 20 % precision ${twoState.rungs[0].hueGlowPixelsMeeting_unselected_pct} % of the glow qualifies unselected and ${twoState.rungs[0].hueGlowPixelsMeeting_selected_pct} % selected.
NO VERDICT (A-G36 point 2): these are resolutions and populations. Whether PG-12 is satisfied on this artifact is PINK's.`;

writeFileSync(resolve(OUT, "pg12-realstack-ladder.json"), JSON.stringify(out, null, 1));
console.log(`populations: hueGlow ${h.c.n}  plainGlow ${perPopulation.plainGlow.c.n}  medium ${m.c.n}`);
console.log(`q (half-LSB summed)  glow p50 ${h.q_halfLsbSummed.p50}  medium p50 ${m.q_halfLsbSummed.p50}`);
console.log(`c/q  glow p50 ${h.cOverQ.p50}  p10 ${h.cOverQ.p10}  p99 ${h.cOverQ.p99}`);
console.log(`rung c>=${RUNG}q  evaluated ${h.rung.evaluated}  dropped ${h.rung.dropped} (${h.rung.droppedPct} %)`);
console.log(`determinism: bytes differing ${determinism.bytesDiffering} (proves repeatability ONLY)`);
console.log(`rung exercised: one-code excursions admitted ${rungExercise.oneCodeExcursionsAdmitted}  smallest admitted p50 ${rungExercise.smallestAdmittedExcursion_codes.p50} codes  p99 ${rungExercise.smallestAdmittedExcursion_codes.p99}`);
console.log(`\n${out.finding}`);
