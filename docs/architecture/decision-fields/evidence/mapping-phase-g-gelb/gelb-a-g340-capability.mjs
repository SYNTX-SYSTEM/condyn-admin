/**
 * GELB · A-G340 LIMB 1 — WHICH PIXELS ARE "THE VISIBLE GLOW", decided from the product's constants.
 *
 * PINK's §28 put one verdict to this lane and declined to pick it, correctly: A-G340 required the mask's
 * inclusion threshold to be ≤ 0.004 and BOTH candidate readings satisfy that, so the amendment does not
 * adjudicate its own question. PINK's two candidates:
 *   (a) t = 0.004      — "a pixel whose ENTIRE halo contribution is under 0.004 cannot swing 0.004"
 *   (b) t → 1e-9       — every pixel the glow reaches
 * PINK said only 1280-unselected turns on it. This instrument finds that EIGHT more cells turn on it, and
 * that neither candidate is the right threshold.
 *
 * ASSUMPTION, STATED BECAUSE THE RULING IS CONDITIONAL ON IT: limb 1's swing test is an ABSOLUTE luminance
 * delta of ≥ 0.004 over one period, and PINK's mask threshold t is in the SAME unit (a pixel's halo
 * contribution in luminance). If either is relative rather than absolute, block [2] below does not hold and
 * the ruling must be re-taken. PINK is the only lane that can confirm this; it is the first thing I ask.
 *
 * Everything else here is read from the committed product, not from a render.
 */
import { execFileSync } from "node:child_process";
const TREE = "/home/codi/Entwicklung/condyn-admin-mapping-d", SHA = "4b83414e";
const FILE = "app/components/career/demo/PersonJobMappingField.tsx";
const src = execFileSync("git", ["-C", TREE, "show", `${SHA}:${FILE}`], { encoding: "utf8" });
const lines = src.split("\n");
const need = n => { const h = lines.map((l, i) => l.includes(n) ? i + 1 : 0).filter(Boolean);
  if (h.length !== 1) throw new Error(`UNVERIFIED ${n} → ${h.length} hits`); return h[0]; };
const f = (x, n = 5) => x.toFixed(n);

/* ── the constants, located ── */
const L_WAVE = need("export const WAVE = Object.freeze(");
const L_MEAN = need(".mf-wave-halo { --mf-wave-mean");
const L_GAIN = need('[data-selection="CAPABILITY"] { --mf-wave-gain');
const L_KEY  = need("var(--mf-wave-mean) + var(--mf-wave-depth) * var(--mf-wave-gain, 1)");
const L_BASE = need(".mf-wave { opacity: var(--mf-wave-mean)");
const HALO_DEPTH = 0.235, SELECTED_GAIN = 0.35, SWING = 0.004;
const OP_MEAN = 1 - HALO_DEPTH / 2, OP_DEPTH = HALO_DEPTH / 2;
if (!lines[L_WAVE - 1].includes(`haloDepth: ${HALO_DEPTH}`)) throw new Error("haloDepth moved");
if (!lines[L_WAVE - 1].includes(`selectedGain: ${SELECTED_GAIN}`)) throw new Error("selectedGain moved");

console.log("=".repeat(104));
console.log(`GELB · A-G340 LIMB 1 — the mask threshold is DERIVABLE. Product @ ${SHA}`);
console.log("=".repeat(104));
console.log(`\n[1] THE CONSTANTS, LOCATED IN THE PRODUCT\n`);
console.log(`  :${L_WAVE}  WAVE.haloDepth    = ${HALO_DEPTH}     the halo breathes this, peak-to-peak, about its own mean`);
console.log(`  :${L_WAVE}  WAVE.selectedGain = ${SELECTED_GAIN}      "while a capability is selected the amplitude is selectedGain of itself (F-7)"`);
console.log(`  :${L_MEAN}  .mf-wave-halo → --mf-wave-mean = ${f(OP_MEAN, 4)}, --mf-wave-depth = ${f(OP_DEPTH, 4)}`);
console.log(`  :${L_GAIN}  [data-selection="CAPABILITY"] → --mf-wave-gain = ${SELECTED_GAIN}`);
console.log(`  :${L_KEY}  keyframe: opacity = mean + depth × gain × w`);
console.log(`  :${L_BASE}  .mf-wave { opacity: var(--mf-wave-mean) }  ← the UN-ANIMATED base`);
console.log(`\n  THE MODULATION IS ON THE HALO GROUP'S OPACITY, NOT ON ITS ALPHA DIRECTLY, and it swings about a`);
console.log(`  MEAN OF ${f(OP_MEAN, 4)} — not about 1. That is the whole reason the threshold below is not simply`);
console.log(`  ${f(SWING, 3)} / haloDepth. And :${L_BASE} is a useful check: under \`reduce\` the animation is gone and the`);
console.log(`  halo rests at exactly \`--mf-wave-mean\` = ${f(OP_MEAN, 4)}, so a static capture samples the MEAN.`);

/* ══ [2] the capability threshold ══ */
console.log("\n" + "=".repeat(104));
console.log("[2] A PIXEL CAN ONLY SWING WHAT IT CARRIES — and the threshold is STATE-DEPENDENT");
console.log("=".repeat(104));
const gainOf = sel => sel ? SELECTED_GAIN : 1;
const opSwing = sel => 2 * OP_DEPTH * gainOf(sel);            /* peak-to-peak of the group opacity */
/* a pixel's halo contribution measured AT THE MEAN is  c = alpha_grad × OP_MEAN × (S−D);
   its luminance swing is                               s = alpha_grad × opSwing × (S−D)
   so  s = c × opSwing / OP_MEAN,  and the capability threshold is  SWING × OP_MEAN / opSwing.      */
const capMean = sel => SWING * OP_MEAN / opSwing(sel);
const capPeak = sel => SWING * (OP_MEAN + OP_DEPTH * gainOf(sel)) / opSwing(sel);
console.log(`\n  A pixel's halo contribution c and its luminance swing s share the SAME gradient alpha, so the`);
console.log(`  (S − D) term and the gradient cancel and the ratio is pure opacity:`);
console.log(`      s / c = opSwing / op_sampled        →  capability threshold = ${f(SWING, 3)} × op_sampled / opSwing`);
console.log(`  which means THE THRESHOLD DEPENDS ON WHERE THE MASK WAS SAMPLED. Both variants given.\n`);
console.log(`    state        opacity p-p   mask sampled at MEAN   mask sampled at PEAK`);
console.log(`    unselected   ${f(opSwing(false), 5)}       ${f(capMean(false), 5)}                ${f(capPeak(false), 5)}`);
console.log(`    selected     ${f(opSwing(true), 5)}       ${f(capMean(true), 5)}                ${f(capPeak(true), 5)}`);
console.log(`\n    selected / unselected = ${f(capMean(true) / capMean(false), 4)} = 1 / selectedGain, either way.`);
const capable = capMean;
console.log(`\n  SO NEITHER CANDIDATE IS THE THRESHOLD:`);
console.log(`    (b) t → 1e-9    admits pixels ${(capable(false) / 1e-9).toExponential(2)}× below capability, unselected`);
console.log(`    (a) t = 0.004   admits pixels down to 0.004 — still ${f(capable(false) / 0.004, 2)}× below capability unselected,`);
console.log(`                    and ${f(capable(true) / 0.004, 2)}× below it selected`);
console.log(`\n  *** DERIVED, for a mask sampled at the mean (which a \`reduce\` capture is, by :${L_BASE}):`);
console.log(`      t = ${f(SWING, 3)} × ${f(OP_MEAN, 4)} / (haloDepth × gain)  →  ${f(capable(false), 5)} unselected, ${f(capable(true), 5)} selected. ***`);
console.log(`  That is the set of pixels CAPABLE of the swing the limb tests. It is not a choice between two`);
console.log(`  readings of "visible"; it is the only threshold that makes the denominator answerable by the`);
console.log(`  numerator. (a) is in the right direction and PINK's reason for it is the right reason — it is`);
console.log(`  simply not far enough, because the limb's threshold is a SWING and the mask's is a LEVEL.`);

/* ══ [3] why (b) is not merely permissive but perverse ══ */
console.log("\n" + "=".repeat(104));
console.log("[3] WHY (b) IS NOT MERELY PERMISSIVE — IT IS ANTI-MONOTONE IN THE THING THE PIN REWARDS");
console.log("=".repeat(104));
console.log(`\n  share = (# pixels swinging ≥ ${f(SWING, 3)}) / (# pixels in mask).`);
console.log(`  Under (b) the mask is every pixel the glow reaches. Widen the glow's reach — paint further out,`);
console.log(`  which is the mechanism PG-1 and F-3 exist to certify — and the denominator grows while the`);
console.log(`  numerator cannot, because the added pixels are below capability by construction.`);
console.log(`\n  *** UNDER (b), A STRICTLY BETTER GLOW READS WORSE. *** The pin punishes the mechanism it certifies.`);
console.log(`  That is not a bias to be corrected; it is the wrong sign on the derivative, and it is why this`);
console.log(`  is a contract question and not a tolerance question.`);
console.log(`\n  (a) and the derived form have the OPPOSITE failure mode, and it must be guarded: shrink the glow`);
console.log(`  to a tiny bright core and the mask shrinks with it, so the share → 1. PINK named this exact`);
console.log(`  artefact for blur — "a mask that keeps only the bright core is where spreading always wins".`);
console.log(`  RULED WITH THE THRESHOLD: the mask POPULATION is reported beside every share. A share without`);
console.log(`  its denominator cannot be audited for this, and A-G340's four numbers did not carry one.`);

/* ══ [4] PINK's own sweep says the selected cells are measuring selectedGain ══ */
console.log("\n" + "=".repeat(104));
console.log("[4] PINK'S SWEEP, RE-READ — the selected column is PF-10's compliance, not the glow's liveness");
console.log("=".repeat(104));
const SWEEP = [
  ["old whole-clip", 0.8096, 0.2383, 0.8528, 0.1769],
  ["t = 0.004", 0.6135, 0.2139, 0.5852, 0.1664],
  ["t = 0.002", 0.5312, 0.1935, 0.4847, 0.1491],
  ["t = 0.001", 0.4455, 0.1689, 0.3638, 0.1216],
  ["disc floor → 1e-9", 0.3739, 0.1478, 0.2251, 0.0739],
];
console.log(`\n  FIRST, THE DISCRIMINATOR I NEARLY USED, AND WHY IT IS THE WRONG WAY ROUND. I was going to write`);
console.log(`  "if this were an independent observation, sel/none would vary with the rung". The arithmetic says`);
console.log(`  the opposite: with ONE mask M shared by both states, share = N/M, so sel/none = N_sel/N_none and`);
console.log(`  M cancels — the ratio is RUNG-INDEPENDENT by construction. And every pixel capable of the swing`);
console.log(`  is already inside the t = 0.004 mask (capability ${f(SWING * OP_MEAN / (2 * OP_DEPTH), 5)} > 0.004), so dropping t adds only`);
console.log(`  incapable pixels, which change M and not N. The ratio should be FLAT.\n`);
console.log(`    rung                 1920 sel/none   1280 sel/none`);
const ratios = [];
for (const [name, n19, s19, n12, s12] of SWEEP) {
  const r19 = s19 / n19, r12 = s12 / n12; ratios.push(r19, r12);
  console.log(`    ${name.padEnd(20)} ${f(r19, 4).padStart(9)}       ${f(r12, 4).padStart(9)}`);
}
const mean = ratios.reduce((a, b) => a + b) / ratios.length;
const sd = Math.sqrt(ratios.reduce((a, b) => a + (b - mean) ** 2, 0) / ratios.length);
const drift19 = SWEEP[4][2] / SWEEP[4][1] - SWEEP[1][2] / SWEEP[1][1];
const drift12 = SWEEP[4][4] / SWEEP[4][3] - SWEEP[1][4] / SWEEP[1][3];
console.log(`\n    mean ${f(mean, 4)}   sd ${f(sd, 4)}   span ${f(Math.min(...ratios), 4)} … ${f(Math.max(...ratios), 4)}`);
console.log(`    WAVE.selectedGain = ${SELECTED_GAIN}          |mean − selectedGain| = ${f(Math.abs(mean - SELECTED_GAIN), 4)}`);
console.log(`\n  IT IS NOT FLAT. Over the four t rungs it drifts ${f(drift19, 4)} at 1920 and ${f(drift12, 4)} at 1280, both upward`);
console.log(`  as t falls. *** THAT IS A SECOND FINDING AND IT IS ABOUT THE MASK, NOT THE GLOW: *** a shared,`);
console.log(`  state-independent mask cannot produce a t-dependent ratio. Either the mask is built PER STATE,`);
console.log(`  or the 2 px blur is mixing pixels across the mask boundary so that changing M changes the`);
console.log(`  measured swings too. Both are checkable on PINK's stand and neither is visible in the shares.`);
console.log(`\n  WHAT SURVIVES THE CORRECTION, AND IT IS THE POINT: ten cells, five rungs, two viewports, and the`);
console.log(`  ratio sits at mean ${f(mean, 4)}, sd ${f(sd, 4)} — ${f(Math.abs(mean - SELECTED_GAIN) / SELECTED_GAIN * 100, 1)} % from the declared selectedGain of ${SELECTED_GAIN}. A`);
console.log(`  share measuring "does a quarter of the glow breathe" has no reason to land on a CSS constant.`);
console.log(`  To first order the selected column is selectedGain re-measured; the drift is the residual.`);
console.log(`\n  AND PF-10 REQUIRES IT. PF-10: "with a capability selected, the measured breath amplitude is`);
console.log(`  ≤ 45 % of its unselected value." selectedGain = ${SELECTED_GAIN} ≤ 0.45, satisfied with margin.`);
console.log(`\n  *** SO LIMB 1'S SELECTED READING PENALISES THE BUILD FOR COMPLYING WITH PF-10. *** A fixed`);
console.log(`  absolute swing threshold against a deliberately reduced amplitude is a pin fighting a pin.`);
console.log(`  "Selected fails 10 of 10" is not a defect in the build; it is the limb measuring the wrong`);
console.log(`  quantity in that state.`);

/* ══ [5] what survives ══ */
console.log("\n" + "=".repeat(104));
console.log("[5] WHAT THE LIMB CAN AND CANNOT DECIDE");
console.log("=".repeat(104));
const BOUND = 0.25;
const RUNG_T = [0.004, 0.002, 0.001, 1e-9];
const asc = RUNG_T.map((t, i) => [t, SWEEP[i + 1][3]]).sort((a, b) => a[0] - b[0]);
const t12 = asc.map(r => r[1]);
const monotone = t12.every((v, i) => i === 0 || v >= t12[i - 1]) || t12.every((v, i) => i === 0 || v <= t12[i - 1]);
console.log(`\n  *** THE VERDICT PINK COULD NOT PICK IS DECIDED, AND WITHOUT A RE-RUN. ***`);
console.log(`  The derived threshold ${f(capable(false), 5)} lies ABOVE every rung PINK swept (0.004 is the highest).`);
console.log(`  Raising t shrinks the mask by removing incapable pixels only, so the share is MONOTONE`);
console.log(`  INCREASING in t — and PINK's own 1280-unselected column confirms it, listed in ASCENDING t:`);
console.log(`      ${asc.map(([t, v]) => `t=${t === 1e-9 ? "1e-9" : f(t, 3)} → ${f(v, 4)}`).join("   ")}`);
console.log(`  monotone increasing in t: ${monotone ? "yes" : "NO — re-check"}`);
console.log(`  So at t = ${f(capable(false), 5)} the 1280 unselected share is ≥ its t = 0.004 value of ${f(SWEEP[1][3], 4)},`);
console.log(`  against a bound of ${f(BOUND, 2)}. **1280 UNSELECTED CLEARS, by at least ${f(SWEEP[1][3] - BOUND, 4)}.**`);
console.log(`  1920 unselected clears at every rung PINK ran, so it clears at the derived threshold too.`);
console.log(`  (b)'s 1e-9 floor was the only reading that failed it, and block [3] rules (b) out on its own.`);
console.log(`\n  NOT EVALUABLE — selected, at any threshold, until the limb states its swing threshold as a`);
console.log(`  FRACTION of the state's own amplitude rather than an absolute. Eight of PINK's cells.`);
console.log(`\n  This is a THIRD inconclusive state, and it is not A-G277's: PG-11 is INCONCLUSIVE BY MEASUREMENT`);
console.log(`  (the instrument cannot resolve it). This is INCONCLUSIVE BY CONSTRUCTION — the instrument`);
console.log(`  resolves it perfectly and the quantity it resolves is not the one the pin names.`);
