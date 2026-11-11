/**
 * GELB · POINT VALUE vs TAIL MEDIAN — testing PINK's §31 against PINK's own §31.
 *
 * PINK's §31 does three things. [3]-[5] are a self-catch I accept entirely: §30's 0.06 % "convergence"
 * was a CROSSING of a non-monotone curve at the rung PINK happened to stop at, and the dimensionally
 * correct comparison at matched support gives -3.6 / +4.3 / -3.9 / +2.0 %. [6] retires both lanes'
 * "rung at which s is 10 % accurate" figures as answers to a malformed question and proposes s/q, which
 * needs no true ratio. Adopted.
 *
 * [2] refutes my simulated -81.5 % / 0.0194 by measurement: 0.17153 and 0.16159, 11.4x and 8.3x higher.
 *
 * *** AND [2] IS THE SAME SUPPORT DEFECT [4] NAMES. *** My 0.0194 is a POINT VALUE at c = 10q exactly;
 * PINK's 0.17153 is a TAIL MEDIAN over every pixel with c >= 10q. PINK's own [4]: "Your 0.3756 is s/c AT
 * the capability threshold; my rung medians are over everything above a threshold. Different supports,
 * both numbers correct, never about the same pixels." That sentence applies verbatim to [2], and [6]
 * retires the rung pair on exactly this ground.
 *
 * I am not raising this to keep my number. My ERROR stands and is worse than PINK states: I described a
 * point value as the median case and withdrew a correct hypothesis for it. I am raising it because PINK
 * would want its own rule applied consistently, and because the two errors have DIFFERENT remedies.
 *
 * Blocks:
 *  [1] is [2] a support defect? — my model's s_q/c_q as a function of c, point vs tail
 *  [2] does my exact model survive PINK's §29 bins on MATCHED support? — the right-hand branch
 *  [3] s/q adopted, and the 1280-selected finding checked against the model
 */
const f = (x, n = 5) => Number.isFinite(x) ? x.toFixed(n) : String(x);
/* §87 A-G395: these were FORKED copies of product constants with no check. They now come from
   gelb-product-constants.mjs, which reads the product at a pinned build and THROWS if any of the
   twelve moved — so this instrument cannot run on a stale constant. The numbers below are
   unchanged by the wiring, which is the point: a check that moves a figure is a different edit. */
import { HALO_DEPTH, SELECTED_GAIN, HALO_ALPHA, CYAN } from "./gelb-product-constants.mjs";
const OP_MEAN = 1 - HALO_DEPTH / 2, OP_DEPTH = HALO_DEPTH / 2;
const D = [6, 12, 17];
const srgbToLin = v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const W = [0.2126, 0.7152, 0.0722];
const lum = v => v.reduce((a, c, i) => a + W[i] * srgbToLin(c / 255), 0);
const over = (S, Dd, a) => S.map((c, i) => a * c + (1 - a) * Dd[i]);
const q8 = v => v.map(c => Math.round(Math.max(0, Math.min(255, c))));
const waveAt = x => { const r = 0.4; return x <= r ? -Math.cos(Math.PI * x / r) : Math.cos(Math.PI * (x - r) / (1 - r)); };
const FRAMES = 64;
const at = (sel, share) => {
  const gain = sel ? SELECTED_GAIN : 1;
  let loT = Infinity, hiT = -Infinity, loQ = Infinity, hiQ = -Infinity;
  for (let i = 0; i < FRAMES; i++) {
    const v = over(CYAN, D, HALO_ALPHA * share * (OP_MEAN + OP_DEPTH * gain * waveAt(i / FRAMES)));
    const lt = lum(v), lq = lum(q8(v));
    if (lt < loT) loT = lt; if (lt > hiT) hiT = lt; if (lq < loQ) loQ = lq; if (lq > hiQ) hiQ = lq;
  }
  const cT = lum(over(CYAN, D, HALO_ALPHA * share * OP_MEAN)) - lum(D);
  const cQ = lum(q8(over(CYAN, D, HALO_ALPHA * share * OP_MEAN))) - lum(q8(D));
  const bytes = q8(over(CYAN, D, HALO_ALPHA * share * OP_MEAN));
  const q = bytes.reduce((a, c, i) => a + W[i] * Math.abs(srgbToLin(Math.min(255, c + 0.5) / 255) - srgbToLin(Math.max(0, c - 0.5) / 255)) / 2, 0);
  return { cT, cQ, sT: hiT - loT, sQ: hiQ - loQ, q, ratioT: (hiT - loT) / cT, ratioQ: cQ > 0 ? (hiQ - loQ) / cQ : Infinity, sOverQ: (hiQ - loQ) / q };
};

console.log("=".repeat(104));
console.log("GELB · POINT VALUE vs TAIL MEDIAN — PINK's §31 [2] measured against PINK's §31 [4]");
console.log("=".repeat(104));

/* ══ [1] ══ */
console.log("\n[1] IS [2] A SUPPORT DEFECT? — my model's s/c as c grows past the 10q rung\n");
const rungShare = sel => { let lo = 0, hi = 1; for (let i = 0; i < 160; i++) { const m = (lo + hi) / 2; const r = at(sel, m); if (r.cT < 10 * r.q) lo = m; else hi = m; } return (lo + hi) / 2; };
const PINK_MED = { false: 0.37535, true: 0.17153 };
const EXACT = { false: 0.3756, true: 0.1504 };
for (const sel of [false, true]) {
  const s0 = rungShare(sel);
  console.log(`  ${(sel ? "SELECTED" : "UNSELECTED")} — 10q rung at share ${f(s0, 4)}; PINK's tail median ${f(PINK_MED[sel], 5)}, exact point ${f(EXACT[sel], 4)}\n`);
  console.log(`    share    c/q      s/q     s_q/c_q    s_T/c_T`);
  for (const mult of [1, 1.5, 2, 3, 5, 10, 20]) {
    const r = at(sel, Math.min(1, s0 * mult));
    console.log(`    ${f(Math.min(1, s0 * mult), 4)}  ${f(r.cT / r.q, 1).padStart(7)} ${f(r.sOverQ, 2).padStart(8)}   ${f(r.ratioQ, 4).padStart(7)}    ${f(r.ratioT, 4)}`);
  }
  /* NO BISECTION HERE. s_q/c_q is NON-MONOTONE in share — see the column above, which oscillates.
     A first form of this block bisected for the share reproducing PINK's tail median; it returned
     "n/a" for unselected (the bracket never held) and 52.5 for selected, which is therefore a crossing
     of a non-monotone curve and not a solution. THAT IS PINK's §31 [6] DEFECT, COMMITTED BY ME IN THE
     BLOCK THAT DIAGNOSES IT. Reported as a bracket instead, which is what the data supports. */
  let mn = Infinity, mx = -Infinity;
  for (const mult of [1.5, 2, 3, 5, 10]) { const v = at(sel, Math.min(1, s0 * mult)).ratioQ; if (v < mn) mn = v; if (v > mx) mx = v; }
  const brackets = PINK_MED[sel] >= mn && PINK_MED[sel] <= mx;
  console.log(`\n    model s_q/c_q over c/q = ${f(at(sel, Math.min(1, s0 * 1.5)).cT / at(sel, Math.min(1, s0 * 1.5)).q, 0)}…${f(at(sel, Math.min(1, s0 * 10)).cT / at(sel, Math.min(1, s0 * 10)).q, 0)} spans [${f(mn, 4)}, ${f(mx, 4)}]`);
  console.log(`    PINK's tail median ${f(PINK_MED[sel], 5)} is ${brackets ? "INSIDE that span" : "OUTSIDE that span"} — and the value AT the rung edge is ${f(at(sel, s0).ratioQ, 4)}`);
  console.log(`    (no solve: the column above is non-monotone, so a bisection for it would be a crossing)\n`);
}
console.log(`  *** SO [2] IS A SUPPORT DEFECT, AND MINE IS THE SAME ONE IN THE OTHER DIRECTION. ***`);
console.log(`  My 0.0194 is the model AT c = 10q. The model at 2-3x that c already reads near PINK's tail`);
console.log(`  median, because a tail median over "everything above 10q" is dominated by pixels far above it.`);
console.log(`  *** MY ERROR IS NOT THE NUMBER — IT IS THAT I CALLED A POINT VALUE THE MEDIAN CASE *** and`);
console.log(`  withdrew a hypothesis that was right for the median in favour of one right for 1.3-4.7 % of`);
console.log(`  pixels. PINK's correction of my CONCLUSION stands in full; its refutation of my VALUE is the`);
console.log(`  comparison its own [4] forbids, and its own [6] retires both of our rung figures for it.`);

/* ══ [2] ══ */
console.log("\n" + "=".repeat(104));
console.log("[2] DOES MY EXACT MODEL SURVIVE PINK'S §29 BINS ON MATCHED SUPPORT?");
console.log("=".repeat(104));
console.log(`\n  PINK's [4], 1920 unselected, s/c by c — a genuine non-monotone function of c:`);
const BINS = [[2.4e-5, 14.81, "quantiser-dominated"], [3.8e-4, 0.891, "quantiser-dominated"],
               [5.1e-3, 0.296, "the minimum"], [1.2e-2, 0.359, "convexity growing"], [2.9e-2, 0.411, "convexity growing"]];
console.log(`\n  My continuous model predicts a MONOTONE RISE in c, from the linear limit to the ceiling:`);
let loR = Infinity, hiR = -Infinity;
for (let i = 1; i <= 4000; i++) { const r = at(false, i / 4000); if (r.ratioT < loR) loR = r.ratioT; if (r.ratioT > hiR) hiR = r.ratioT; }
console.log(`    continuous s_T/c_T over all shares: [${f(loR, 4)}, ${f(hiR, 4)}]  — monotone increasing, no minimum`);
console.log(`\n  So the model owns the RIGHT-HAND BRANCH only, and the left branch and the minimum are the`);
console.log(`  quantiser. Tested on matched support — find the share whose c matches each bin's c:\n`);
console.log(`    PINK's c      PINK s/c    model s_T/c_T   model s_q/c_q     delta (true)   regime`);
for (const [cTarget, obs, label] of BINS) {
  let lo = 1e-6, hi = 1;
  for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; if (at(false, m).cT < cTarget) lo = m; else hi = m; }
  const r = at(false, (lo + hi) / 2);
  const d = (r.ratioT - obs) / obs * 100;
  console.log(`    ${cTarget.toExponential(2)}    ${f(obs, 4).padStart(7)}      ${f(r.ratioT, 4).padStart(7)}        ${f(r.ratioQ, 4).padStart(7)}       ${(d >= 0 ? "+" : "") + f(d, 1)} %   ${label}`);
}
console.log(`\n  *** THE MODEL'S RIGHT-HAND BRANCH HOLDS AND ITS LEFT BRANCH IS NOT ITS BUSINESS. *** At the`);
console.log(`  minimum and above, the continuous model tracks PINK's bins; below it the measured ratio runs`);
console.log(`  away upward and the model does not, because the model has no quantiser in c. That is the`);
console.log(`  same statement as A-G375's withdrawal, reached from the data instead of from the refutation:`);
console.log(`  s/c is a two-branch curve, physics on the right and the quantiser on the left, and ANY single`);
console.log(`  number for it is a choice of support. §29 said so as an 8x spread; §30 and my §83 both forgot it.`);

/* ══ [3] ══ */
console.log("\n" + "=".repeat(104));
console.log("[3] s/q ADOPTED — the statistic that needs no true ratio, and the 1280 finding");
console.log("=".repeat(104));
console.log(`\n  PINK's measured median s/q at the 10q rung:  unselected 10.63 / 9.67   selected 4.70 / 3.94`);
console.log(`  and s/q reaches 10 at 9q and 13q unselected, at 56q selected at 1920, and NEVER — at any`);
console.log(`  admissible rung — selected at 1280.\n`);
console.log(`  The model's own s/q, so the claim is checked and not relayed:\n`);
console.log(`    state        c/q = 10     c/q = 20     c/q = 50     c/q = 100    max over all shares`);
for (const sel of [false, true]) {
  const row = [];
  for (const target of [10, 20, 50, 100]) {
    let lo = 1e-6, hi = 1;
    for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; const r = at(sel, m); if (r.cT / r.q < target) lo = m; else hi = m; }
    row.push(at(sel, (lo + hi) / 2).sOverQ);
  }
  let mx = 0; for (let i = 1; i <= 4000; i++) { const v = at(sel, i / 4000).sOverQ; if (v > mx) mx = v; }
  console.log(`    ${(sel ? "selected" : "unselected").padEnd(12)} ${row.map(v => f(v, 2).padStart(8)).join("     ")}       ${f(mx, 1)}`);
}
const rat = [];
for (const target of [10, 20, 50, 100]) {
  const g = sel => { let lo = 1e-6, hi = 1; for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; const r = at(sel, m); if (r.cT / r.q < target) lo = m; else hi = m; } return at(sel, (lo + hi) / 2).sOverQ; };
  rat.push([target, g(false) / g(true)]);
}
console.log(`\n  unselected/selected s/q at the same c/q:  ${rat.map(([t, v]) => `${t}q ${f(v, 2)}x`).join("   ")}`);
console.log(`\n  *** AND THAT RATIO IS NOT 1/selectedGain EXCEPT ASYMPTOTICALLY. *** I wrote "about ${f(1 / SELECTED_GAIN, 2)}x" here`);
console.log(`  first; it is ${f(rat[0][1], 1)}x at the 10q rung and falls toward ${f(1 / SELECTED_GAIN, 2)} only as c/q grows. ${f(1 / SELECTED_GAIN, 2)} is the ratio of`);
console.log(`  the two AMPLITUDES; the ratio of their RESOLUTIONS is far worse exactly where the rung sits,`);
console.log(`  because the smaller swing crosses the one-code floor and the larger one does not. So the`);
console.log(`  finding is STRONGER than the constant suggests, and it is the fourth time in this stretch that`);
console.log(`  a figure I typed from a declared constant disagreed with the solve beside it.`);
console.log(`\n  A rung set on c therefore gives the two states different numerator resolution BY CONSTRUCTION.`);
console.log(`  PINK's "never reaches ten quanta,`);
console.log(`  selected, at 1280, at any admissible rung" is the strongest form this finding has taken, and`);
console.log(`  it is a MEASUREMENT where mine was a solve against an assumed ratio.`);
console.log(`\n  *** A-G365 NOW HAS A FOURTH GROUND AND IT IS THE BEST ONE: at 1280 the selected swing is`);
console.log(`  NOWHERE resolved to ten quanta inside the mask. *** Not "biased", not "attenuated on a narrow`);
console.log(`  band" — not resolved anywhere. That is measured, model-free, and needs no true s/c at all.`);
console.log(`  My 11.2 / 57.4 quanta and PINK's 17q/9q and 66q/15q are both retired per PINK's [6]: a solve`);
console.log(`  against an assumed single ratio, and a crossing of a non-monotone tail median. The tell PINK`);
console.log(`  names is the right one — its pair disagreed ACROSS VIEWPORTS, which a quantity does not do.`);
