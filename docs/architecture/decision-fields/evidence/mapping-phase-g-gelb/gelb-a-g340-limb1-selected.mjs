/**
 * GELB · §91 A-G412 — A-G340 limb 1's EIGHT SELECTED CELLS ARE RETIRED, and the remedy I named in §81
 * is the reason they cannot be rescued rather than the way to rescue them.
 *
 * §81 ruled the selected cells NOT EVALUABLE "until the limb states its swing threshold as a FRACTION of
 * the state's own amplitude rather than an absolute". That is a condition, not an action — A-G403 says a
 * ruling that requires an argument is not a probe, and this one had been sitting as a preference for ten
 * sections. So: EXECUTE IT. State the threshold fractionally, and see what the limb then measures.
 *
 * It measures nothing. That is the finding, and it is A-G128's second limb turned on my own remedy.
 *
 * Every product value is READ from gelb-product-constants.mjs. No literal is held here.
 */
import * as P from "./gelb-product-constants.mjs";

const f = (x, n = 5) => Number(x).toFixed(n);
const e = (x) => Number(x).toExponential(4);
const rule = () => console.log("=".repeat(104));

/* ── the composite, in the space CSS actually composites in, and the decode WCAG actually applies ── */
const srgbToLin = v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const lum = ([r, g, b]) => 0.2126 * srgbToLin(r / 255) + 0.7152 * srgbToLin(g / 255) + 0.0722 * srgbToLin(b / 255);
/** source-over in ENCODED sRGB — PINK's point, and the reason a linear cancellation is only approximate. */
const over = (S, D, a) => S.map((c, i) => a * c + (1 - a) * D[i]);

const MEAN = P.WAVE_GROUPS.halo.mean, DEPTH = P.WAVE_GROUPS.halo.depth, GAIN = P.SELECTED_GAIN;
const S = P.CYAN;
/** the luminance swing of a pixel whose own halo alpha is `a`, in a group breathing at `gain`. */
const swing = (a, gain, D) => lum(over(S, D, a * (MEAN + gain * DEPTH))) - lum(over(S, D, a * (MEAN - gain * DEPTH)));

const BACKDROPS = [["PINK's deep dark  rgb(3,5,8)", [3, 5, 8]], ["the modal medium  rgb(6,12,17)", [6, 12, 17]], ["pure black        rgb(0,0,0)", [0, 0, 0]]];
const ALPHAS = [0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.35, 0.5, 0.7, 0.85, 1.0];
const ABS_THRESHOLD = 0.004;   // limb 1's swing threshold as the pin states it. READ as a pin figure below.

rule();
console.log(`GELB · §91 A-G412 — LIMB 1'S SELECTED CELLS. Product @ ${P.SHA}`);
rule();
console.log(`
  THE PIN. Limb 1 asks: what share of the mask's pixels swing at least ${ABS_THRESHOLD} in luminance over one
  breath? §81 decided the two UNSELECTED cells (both clear, one by monotonicity from PINK's own sweep) and
  left the EIGHT SELECTED cells NOT EVALUABLE, because a fixed absolute threshold applied to a state whose
  amplitude is deliberately reduced to selectedGain = ${GAIN} of itself penalises the build for complying
  with PF-10. The stated condition for evaluating them was a FRACTIONAL threshold. Here it is, executed.`);

/* ────────────────────────────────────────────────────────────────────────────────────────────────── */
rule();
console.log(`[1] THE STATE-TO-STATE SWING RATIO — the quantity the fractional form needs, and it is a CONSTANT`);
rule();
console.log(`
  Both states breathe about the SAME mean (${f(MEAN, 4)}); only the depth differs, by the factor gain. So for a
  pixel of halo alpha a, the two swings are s(a, 1) and s(a, ${GAIN}), and the fractional form needs their ratio.
  If that ratio is a constant, the fractional threshold is well-posed. Computed, not assumed:
`);
let all = [];
for (const [name, D] of BACKDROPS) {
  console.log(`  ${name}        a       s(unselected)   s(selected)     ratio`);
  const rs = [];
  for (const a of ALPHAS) {
    const su = swing(a, 1, D), ss = swing(a, GAIN, D), r = su / ss;
    rs.push(r); all.push(r);
    console.log(`  ${" ".repeat(name.length)}   ${f(a, 3).padStart(6)}   ${e(su)}      ${e(ss)}      ${f(r)}`);
  }
  console.log(`  ${" ".repeat(name.length)}   ratio over ${rs.length} alphas: min ${f(Math.min(...rs))}  max ${f(Math.max(...rs))}  spread ${f((Math.max(...rs) / Math.min(...rs) - 1) * 100, 3)} %\n`);
}
const RMIN = Math.min(...all), RMAX = Math.max(...all), LINEAR = 1 / GAIN;
console.log(`  over all ${all.length} (alpha, backdrop) pairs:  min ${f(RMIN)}   max ${f(RMAX)}   spread ${f((RMAX / RMIN - 1) * 100, 3)} %`);
console.log(`  1 / selectedGain = ${f(LINEAR)}`);
console.log(`  worst departure from 1/selectedGain: ${f(Math.max(Math.abs(RMAX / LINEAR - 1), Math.abs(RMIN / LINEAR - 1)) * 100, 3)} %`);
console.log(`
  *** THE RATIO IS 1 / selectedGain TO WITHIN ${f((RMAX / RMIN - 1) * 100, 2)} %, ACROSS THE WHOLE ALPHA RANGE AND ALL
  ${BACKDROPS.length} BACKDROPS. *** And the reason is not luck: both states swing about the same mean, so to first
  order s = (dL/dop) × Δop and Δop is EXACTLY proportional to gain. The encoded composite and the WCAG
  decode are both nonlinear, but they are evaluated at the same operating point in both states, so the
  nonlinearity enters only at second order — which is the ${f((RMAX / RMIN - 1) * 100, 2)} % residual and nothing more.`);

/* ────────────────────────────────────────────────────────────────────────────────────────────────── */
rule();
console.log(`[2] AND THIS IS NOT THE 2.50x OF §82 — THREE QUANTITIES IN THREE SPACES, ONE OF WHICH I TYPED`);
rule();
/* the capability threshold in c-space: the alpha at which a pixel first achieves the absolute swing. */
const cMin = (gain, D) => {
  let lo = 1e-9, hi = 1;
  if (swing(hi, gain, D) < ABS_THRESHOLD) return NaN;
  /* swing is monotone increasing in a at fixed gain, which is WHY a bisection is admissible here — §81
     bisected a NON-MONOTONE function once and this comment is the guard against repeating it. */
  if (!(swing(0.5, gain, D) > swing(0.25, gain, D))) throw new Error("swing is not monotone in alpha; bisection inadmissible");
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (swing(mid, gain, D) < ABS_THRESHOLD) lo = mid; else hi = mid;
  }
  return hi;
};
/** the pixel's halo LUMINANCE CONTRIBUTION at the sampled opacity — §82's space, not alpha-space. */
const contribution = (a, D) => lum(over(S, D, a * MEAN)) - lum(D);
const rows82 = BACKDROPS.map(([name, D]) => {
  const au = cMin(1, D), as = cMin(GAIN, D);
  return { name, alphaU: au, alphaS: as, alphaRatio: as / au,
           cU: contribution(au, D), cS: contribution(as, D), cRatio: contribution(as, D) / contribution(au, D),
           swingRatio: swing(0.5, 1, D) / swing(0.5, GAIN, D) };
});
const r82 = rows82.map(r => r.cRatio), rAlpha = rows82.map(r => r.alphaRatio);
console.log(`
  §82's exact solve reported a "capability penalty" and block [1] reports ${f(LINEAR, 4)}x. The first form of this
  paragraph TYPED 2.50 as the threshold ratio and the table below computed ${f(Math.min(...rAlpha), 2)}–${f(Math.max(...rAlpha), 2)} — so the paragraph
  disagreed with its own adjacent output, which is A-G407's family in the section that rules A-G407's
  second limb. Recomputed here rather than cited, and the answer is that there are THREE ratios in three
  spaces, all of which could be called "the capability penalty":
`);
console.log(`    backdrop                        min alpha    min alpha   alpha    §82's c-space      swing`);
console.log(`                                    unselected   selected    ratio    threshold ratio    ratio`);
for (const r of rows82) {
  console.log(`    ${r.name.padEnd(32)} ${f(r.alphaU, 6)}     ${f(r.alphaS, 6)}    ${f(r.alphaRatio, 4)}   ${f(r.cRatio, 4)}             ${f(r.swingRatio, 4)}`);
}
console.log(`
    SWING ratio, luminance swing of a GIVEN pixel          ${f(Math.min(...all), 4)} … ${f(Math.max(...all), 4)}   = 1/selectedGain
    §82's C-SPACE threshold ratio, halo contribution       ${f(Math.min(...r82), 4)} … ${f(Math.max(...r82), 4)}   bent by convexity in a
    ALPHA-SPACE threshold ratio, the gradient's own alpha  ${f(Math.min(...rAlpha), 4)} … ${f(Math.max(...rAlpha), 4)}   bent twice over

  *** THREE QUANTITIES, THREE ANSWERS, AND §82's 2.50 IS THE MIDDLE ONE — reproduced here independently at
  ${f(Math.min(...r82), 3)}–${f(Math.max(...r82), 3)}, which agrees with §82 and so cross-checks both. *** The pin's own question decides which one
  is wanted: the fractional threshold rescales the pin's SWING BOUND, so it needs the swing ratio, and the
  swing ratio is the one that is a clean constant. §82 needed the c-space ratio because it was deriving a
  MASK threshold, and a mask selects on contribution rather than on swing. Neither figure was ever wrong;
  what was missing was the sentence saying they answer different questions — and this is the fourth time
  in this record that two correct figures of mine sat together without it.`);

/* ────────────────────────────────────────────────────────────────────────────────────────────────── */
rule();
console.log(`[3] THE THREE FORMS THE THRESHOLD COULD TAKE, AND WHAT EACH ONE MEASURES`);
rule();
const forms = [
  { name: "ABSOLUTE — as the pin stands", sel: ABS_THRESHOLD,
    equiv: ABS_THRESHOLD * LINEAR,
    verdict: "measures the DECLARED GAIN" },
  { name: `FRACTIONAL by declared gain`, sel: ABS_THRESHOLD * GAIN,
    equiv: ABS_THRESHOLD * GAIN * LINEAR,
    verdict: "measures THE UNSELECTED CELL AGAIN" },
  { name: `FRACTIONAL by measured ratio`, sel: ABS_THRESHOLD / RMAX * 1,
    equiv: ABS_THRESHOLD / RMAX * LINEAR,
    verdict: "measures THE UNSELECTED CELL AGAIN" },
];
console.log(`
  A selected pixel clears threshold t_sel exactly when its UNSELECTED swing clears t_sel × (swing ratio).
  So every form of the selected predicate is equivalent to an unselected predicate at some bound — and the
  only question is WHICH bound. Limb 1's own unselected bound is ${ABS_THRESHOLD}.
`);
console.log(`    form                             t_selected    equivalent unselected bound    vs ${ABS_THRESHOLD}        what it measures`);
for (const fm of forms) {
  const factor = fm.equiv / ABS_THRESHOLD;
  console.log(`    ${fm.name.padEnd(32)} ${f(fm.sel, 6)}      ${f(fm.equiv, 6)}                       ${f(factor, 4)}x      ${fm.verdict}`);
}
const dup = forms.filter(fm => Math.abs(fm.equiv / ABS_THRESHOLD - 1) < 0.02);
console.log(`
  *** ${dup.length} OF THE ${forms.length} FORMS COLLAPSE ONTO LIMB 1'S OWN UNSELECTED PREDICATE, within ${f(2, 0)} %. ***

  READ THE TABLE DOWNWARD AND THE PIN HAS NO INFORMATIVE OPTION:
    · ABSOLUTE keeps the selected cell distinct, but what distinguishes it is the factor ${f(LINEAR, 3)} — which is
      1 / selectedGain, a CSS constant. The cell reports the value of a declaration. It cannot fail for any
      reason to do with the glow, and it cannot pass for one either.
    · FRACTIONAL, in either flavour, makes the selected predicate the unselected predicate. The cell then
      cannot DISAGREE with the unselected cell by more than the ${f((RMAX / RMIN - 1) * 100, 2)} % residual — which is far below any
      share resolution PINK's stand can deliver, since a share is a count over a mask of finite pixels.

  *** SO THE CONDITION §81 SET FOR EVALUATING THESE CELLS IS THE PROOF THAT THEY CANNOT BE EVALUATED. ***
  I stated that condition as though meeting it would settle the eight cells. Meeting it dissolves them.
  That is A-G128's second limb — "does the product evaluate the predicate and decline to emit a
  counterexample" — applied to MY OWN REMEDY, which is the test I have failed most often in this record
  (A-G349, A-G390, §86's separability premise, and now this one makes four).`);

/* ────────────────────────────────────────────────────────────────────────────────────────────────── */
rule();
console.log(`[4] WHAT §81's WITHDRAWN CORROBORATION LOOKS LIKE NOW — right number, wrong reason`);
rule();
console.log(`
  §81 corroborated the derived threshold by noting that PINK's measured sel/none SHARE ratio had mean
  0.3244 against selectedGain ${GAIN}, and A-G370 withdrew that corroboration because the ratio was computed
  from the per-state construction I diagnosed as broken four paragraphs later. The withdrawal stands. But
  block [1] now says something sharper about it:

  *** THE SWING RATIO REALLY IS selectedGain, TO ${f((RMAX / RMIN - 1) * 100, 2)} %. THE SHARE RATIO IS NOT THE SWING RATIO. ***

  A share is the measure of a set defined by a THRESHOLD CROSSING, and the map from "every swing halves"
  to "the share of swings above a fixed bound halves" is not the identity — it depends on the swing
  distribution near the bound. So §81's 0.3244 was not a measurement of selectedGain that happened to be
  confounded; it was a DIFFERENT QUANTITY that happened to land near selectedGain. A-G370 withdrew it for
  the right reason, and had the reason been wrong the conclusion would still have been right —
  which is the only kind of luck worth recording.`);

/* ────────────────────────────────────────────────────────────────────────────────────────────────── */
rule();
console.log(`[5] RULED`);
rule();
console.log(`
  A-G412. THE EIGHT SELECTED CELLS ARE RETIRED FROM A-G340 LIMB 1 — not inconclusive, not pending a
  form, RETIRED. There is no statement of limb 1's threshold under which the selected state carries
  information about the glow: absolute, the cell reports 1 / selectedGain; fractional, the cell reports the
  unselected cell. A pin with no informative reading is not a pin that needs a better instrument.

  LIMB 1 MEASURES THE UNSELECTED STATE. Its two unselected cells were decided in §81 and stay decided.

  THE SELECTED STATE IS NOT UNMEASURED — IT HAS ITS OWN PIN, AND THAT PIN CAN FAIL. PF-10: "with a
  capability selected, the measured breath amplitude is at most 45 % of its unselected value." That is a
  statement about the RATIO, which is the quantity that actually changes between the states, and it is
  satisfied with margin at ${GAIN} against 0.45. Limb 1 was measuring PF-10's compliance badly; PF-10
  measures it well. *** TWO PINS WERE FIGHTING AND ONE OF THEM WAS THE WRONG SHAPE. ***

  AND PINK GETS A BETTER PROBE OUT OF THE RETIREMENT, which is an ACTION and not an argument (A-G403):
  block [1] is a falsifiable prediction about the real stack. Measure the sel/unsel SWING ratio — not the
  share ratio — on actual bytes, at any pixel, on any backdrop. *** IT MUST BE ${f(LINEAR, 4)} TO WITHIN ABOUT
  ${f((RMAX / RMIN - 1) * 100, 2)} %, AND IF IT IS NOT, SOMETHING OTHER THAN selectedGain IS MODULATING THE SELECTED STATE. ***
  That is a cheap check with a sharp failure mode, it needs no mask and no threshold, and it is well-posed
  in A-G384's sense: it needs no true ratio to compare against, only the product's own two states.

  A-G139 CHECKED BEFORE STATING THE TOLERANCE: the ${f((RMAX / RMIN - 1) * 100, 2)} % band is a property of the DOUBLE-PRECISION
  model above. A real 8-bit capture quantises luminance, and at the small swings in block [1] that
  quantisation is the dominant term by orders of magnitude — so PINK must set the tolerance from its own
  quantisation floor and NOT from this band. *** THIS LANE DOES NOT HAND DOWN THAT TOLERANCE, BECAUSE A
  BOUND MUST SIT OUTSIDE THE QUANTISATION-ORDER SPREAD OF THE QUANTITY IT BOUNDS AND ONLY PINK'S STAND
  KNOWS ITS OWN SPREAD. *** What this lane hands down is the CENTRE: ${f(LINEAR, 4)}.
`);
rule();
console.log(`CONSTANT PROVENANCE: ${Object.keys(P.READ).length} values parsed from the product at ${P.SHA}; this file holds no copy.`);
console.log(`The pin figure ${ABS_THRESHOLD} and the bound 0.45 are CONTRACT figures, not product constants — they live in`);
console.log(`PHASE_F/PHASE_G, not in the drawing surface, so they are stated here and cannot be read from it.`);
rule();
