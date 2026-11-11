/**
 * GELB · THE 0.5503 CEILING IS WITHDRAWN — and my own instrument printed the counterexample 39 lines below it.
 *
 * PINK's §30 refutes block [4] of gelb-a-g340-exact.mjs: the ceiling bounds the NUMERATOR. `s/c` has a
 * QUANTISED DENOMINATOR, so a true c of 1.9 LSB landing on 1 LSB nearly doubles s/c with no foreign mover
 * anywhere near the pixel. Correct, and worse than PINK puts it:
 *
 *   gelb-a-g340-exact.out.txt:77   "*** s/c > 0.5503 IS IMPOSSIBLE FOR THIS HALO ... ***"
 *   gelb-a-g340-exact.out.txt:116  "c >= 1 code(s)  unselected  [0.0000, 10.9058]"
 *
 * Thirty-nine lines apart, one file, one commit (e5d207cb). Block [5] withdrew the ENVELOPE and I left
 * block [4]'s CEILING standing, then asserted it in §82 as "foreign movers, derived, with no selector
 * list". A-G372 confessed the envelope defect and did not notice it also destroyed the ceiling — the
 * same defect, in adjacent blocks, with one half withdrawn and the other half published.
 *
 * PINK's measurement settles it empirically: at c >= 10q the p95 of s/c falls BELOW 0.5503 in all four
 * cells, and the 1280 excursion goes 13.54 -> 0.476 on ADMISSIBILITY ALONE. The travel was the obvious
 * candidate and the quantiser is the answer.
 *
 * This instrument does two things:
 *  [1] states exactly what survives of the ceiling, which is not nothing;
 *  [2] tests PINK's attribution of the one thing that did NOT converge — selected at 12.5 % / 5.2 % high
 *      where unselected lands inside 1.4 %. PINK reads it as residual movement biting hardest where the
 *      signal is smallest. There is a second candidate PINK did not name, and it is PINK's own rule.
 */
const f = (x, n = 5) => Number.isFinite(x) ? x.toFixed(n) : String(x);
/* §87 A-G395: these were FORKED copies of product constants with no check. They now come from
   gelb-product-constants.mjs, which reads the product at a pinned build and THROWS if any of the
   twelve moved — so this instrument cannot run on a stale constant. The numbers below are
   unchanged by the wiring, which is the point: a check that moves a figure is a different edit. */
import { HALO_DEPTH, SELECTED_GAIN, HALO_ALPHA, CYAN } from "./gelb-product-constants.mjs";
const SWING = 0.004;
const OP_MEAN = 1 - HALO_DEPTH / 2, OP_DEPTH = HALO_DEPTH / 2;

const srgbToLin = v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const lum = ([r, g, b]) => 0.2126 * srgbToLin(r / 255) + 0.7152 * srgbToLin(g / 255) + 0.0722 * srgbToLin(b / 255);
const over = (S, D, a) => S.map((c, i) => a * c + (1 - a) * D[i]);
const q8 = v => v.map(c => Math.round(Math.max(0, Math.min(255, c))));
const waveAt = x => { const rise = 0.4; return x <= rise ? -Math.cos(Math.PI * x / rise) : Math.cos(Math.PI * (x - rise) / (1 - rise)); };

console.log("=".repeat(104));
console.log("GELB · THE s/c CEILING, WITHDRAWN AS A BOUND ON THE RATIO — and what survives of it");
console.log("=".repeat(104));

/* ══ [1] what survives ══ */
console.log("\n[1] WHAT THE CEILING DOES AND DOES NOT BOUND\n");
console.log("  SURVIVES — a bound on the NUMERATOR. Rounding cannot manufacture swing the opacity range");
console.log("    does not contain, so s <= 0.5503 x c_true. That is physics and PINK agrees with it.");
console.log("  WITHDRAWN — a bound on the RATIO as measured. c is a difference of two 8-bit luminances, so");
console.log("    measured c can fall below c_true by up to one quantum and inflate s/c without limit.");
console.log("  WITHDRAWN — \"p95 at 1.567 and 14.59 are foreign movers, derived\". They are the quantiser.");
console.log("    §82's A-G372 is wrong on that sentence and the correction is PINK's, not mine.");
console.log("\n  THE CORRECT FORM OF MY OWN TEST IS THE ONE PINK BUILT: a ceiling on s/c is a test only where");
console.log("  c is resolved, i.e. stated with an admissibility rung in units of the pixel's own quantum.");
console.log("  PINK's ladder IS my test, repaired. I asked for a fraction and was handed the guard my test");
console.log("  was missing.");

/* ══ [2] s is a max-minus-min — PINK's own rule, applied to PINK's numerator ══ */
console.log("\n" + "=".repeat(104));
console.log("[2] A SECOND CANDIDATE FOR THE SELECTED NON-CONVERGENCE — and it is PINK's own rule");
console.log("=".repeat(104));
console.log("\n  PINK's s is `max L - min L` over frames. *** THAT IS AN EXTREME-VALUE STATISTIC. *** A-F11");
console.log("  retired maxima for the measured quantity; A-G366 (PINK's) bound the ESTIMATOR; §30 applied it");
console.log("  to the DIVISOR. It has not been applied to s itself, and quantisation noise inflates a");
console.log("  max-minus-min by a roughly FIXED ABSOLUTE amount — so it bites small signals proportionally");
console.log("  harder, which is the exact shape of the asymmetry PINK reports.\n");

const FRAMES = 64;
const sim = (D, sel, share) => {
  const gain = sel ? SELECTED_GAIN : 1;
  let loT = Infinity, hiT = -Infinity, loQ = Infinity, hiQ = -Infinity;
  for (let i = 0; i < FRAMES; i++) {
    const op = OP_MEAN + OP_DEPTH * gain * waveAt(i / FRAMES);
    const v = over(CYAN, D, HALO_ALPHA * share * op);
    const lt = lum(v), lq = lum(q8(v));
    if (lt < loT) loT = lt; if (lt > hiT) hiT = lt;
    if (lq < loQ) loQ = lq; if (lq > hiQ) hiQ = lq;
  }
  const cT = lum(over(CYAN, D, HALO_ALPHA * share * OP_MEAN)) - lum(D);
  const cQ = lum(q8(over(CYAN, D, HALO_ALPHA * share * OP_MEAN))) - lum(q8(D));
  return { sT: hiT - loT, sQ: hiQ - loQ, cT, cQ };
};
/* the quantum, PINK's definition: half an LSB per channel, summed, in luminance */
const quantumAt = (D, share, op) => {
  const v = over(CYAN, D, HALO_ALPHA * share * op).map(Math.round);
  const W = [0.2126, 0.7152, 0.0722];
  return v.reduce((acc, c, i) => acc + W[i] * Math.abs(srgbToLin(Math.min(255, c + 0.5) / 255) - srgbToLin(Math.max(0, c - 0.5) / 255)) / 2, 0);
};
const D = [6, 12, 17];
console.log("  Simulated at the share where each state's TRUE c equals 10 quanta — PINK's strictest rung:\n");
console.log("    state        share    c_true     s_true     s_quant   s_q/s_t   s_true/c  s_q/c_q   exact s/c");
const EXACT_SC = { false: 0.3756, true: 0.1504 };
const RESULT = {};
for (const sel of [false, true]) {
  /* find share where c_true = 10q */
  let lo = 0, hi = 1;
  for (let i = 0; i < 120; i++) {
    const m = (lo + hi) / 2, r = sim(D, sel, m);
    if (r.cT < 10 * quantumAt(D, m, OP_MEAN)) lo = m; else hi = m;
  }
  const share = (lo + hi) / 2, r = sim(D, sel, share);
  RESULT[sel] = { share, ...r, ratioT: r.sT / r.cT, ratioQ: r.sQ / r.cQ };
  console.log(`    ${(sel ? "selected" : "unselected").padEnd(12)} ${f(share, 4)}  ${r.cT.toExponential(3)}  ${r.sT.toExponential(3)}  ${r.sQ.toExponential(3)}  ${f(r.sQ / r.sT, 4)}   ${f(r.sT / r.cT, 4)}   ${f(r.sQ / r.cQ, 4)}    ${f(EXACT_SC[sel], 4)}`);
}
const inflU = RESULT[false].sQ / RESULT[false].sT, inflS = RESULT[true].sQ / RESULT[true].sT;
console.log(`\n  QUANTISATION INFLATES THE MAX-MINUS-MIN BY ${f((inflU - 1) * 100, 1)} % UNSELECTED AND ${f((inflS - 1) * 100, 1)} % SELECTED.`);
console.log(`  PINK measures the median s/c at c >= 10q as 0.37582 unselected (exact ${f(EXACT_SC[false], 4)}, +0.06 %)`);
console.log(`  and 0.16919 selected (exact ${f(EXACT_SC[true], 4)}, +12.5 %).`);
console.log(`\n  *** MY HYPOTHESIS IS REFUTED BY MY OWN SIMULATION, AND I AM WRITING THAT HERE RATHER THAN`);
console.log(`  RESHAPING THE SENTENCE. *** I predicted an UPWARD bias in both states, larger for selected.`);
console.log(`  Unselected is +${f((inflU - 1) * 100, 1)} %, upward as predicted. Selected is ${f((inflS - 1) * 100, 1)} % — DOWNWARD, and not slightly.`);
console.log(`  Quantisation does not inflate the selected max-minus-min; it DESTROYS it. The selected swing`);
console.log(`  at this rung spans under a code, so rounding collapses it toward zero and s/c reads ${f(RESULT[true].ratioQ, 4)}`);
console.log(`  against the exact ${f(EXACT_SC[true], 4)} — eight times too LOW, in the opposite direction from PINK's +12.5 %.`);
console.log(`\n  SO PINK'S ATTRIBUTION STANDS AND MINE IS WITHDRAWN. Residual movement remains the explanation`);
console.log(`  for the selected non-convergence, and §83 records that this lane proposed a mechanism with the`);
console.log(`  wrong sign — A-G368's own rule turned on me, one section after I ruled it: I predicted a sign`);
console.log(`  for a quantity that does not admit one, because quantisation inflates a max-minus-min when the`);
console.log(`  swing spans many codes and annihilates it when the swing spans less than one.`);
console.log(`\n  BUT THE SIMULATION FOUND SOMETHING ELSE, AND IT IS WORTH MORE THAN THE HYPOTHESIS IT KILLED.`);
console.log(`  *** PINK'S 10q RUNG RESOLVES THE DENOMINATOR AND NOT THE NUMERATOR. *** At c_true = 10 quanta`);
console.log(`  the selected s is attenuated to ${f(inflS * 100, 1)} % of its true value while c is resolved to 10 %.`);
console.log(`  An admissibility clause on c does not make s measurable, and nothing in the ladder checks s.`);
console.log(`\n  That is the FIFTH instance of A-F11 / A-G366 in four sections, and the cleanest: the rule has`);
console.log(`  now been applied to the measured quantity (A-F11), to the noise floor (PINK's §29), to the`);
console.log(`  divisor (PINK's §30) and to my envelope's region (A-G372) — and not once to the DIVIDEND.`);
console.log(`\n  WHAT RUNG WOULD RESOLVE s? Solved below rather than guessed:`);
const rungFor = (sel, tol) => {
  let lo = 0.0001, hi = 1;
  for (let i = 0; i < 200; i++) {
    const m = (lo + hi) / 2, r = sim(D, sel, m);
    if (Math.abs(r.sQ / r.sT - 1) > tol) lo = m; else hi = m;
  }
  const share = (lo + hi) / 2, r = sim(D, sel, share);
  return { share, quanta: r.cT / quantumAt(D, share, OP_MEAN) };
};
for (const tol of [0.10, 0.05]) for (const sel of [false, true]) {
  const r = rungFor(sel, tol);
  console.log(`    s within ${f(tol * 100, 0)} % of true: ${(sel ? "selected" : "unselected").padEnd(11)} needs c >= ${f(r.quanta, 1).padStart(6)} quanta  (share ${f(r.share, 4)})`);
}
const r10u = rungFor(false, 0.10).quanta, r10s = rungFor(true, 0.10).quanta;
const r05u = rungFor(false, 0.05).quanta, r05s = rungFor(true, 0.05).quanta;
console.log(`\n  *** AND THERE IS THE ASYMMETRY, DERIVED RATHER THAN OBSERVED: the selected state needs a`);
console.log(`  STRICTER rung than the unselected one for the same numerator accuracy — ${f(r10s / r10u, 2)}x stricter at a`);
console.log(`  10 % tolerance and ${f(r05s / r05u, 2)}x at 5 %. *** The ratio is NOT 1/selectedGain and NOT a constant:`);
console.log(`  I wrote ${f(1 / SELECTED_GAIN, 2)}x here first, from the amplitude ratio, and the solve says ${f(r10s / r10u, 2)} and ${f(r05s / r05u, 2)}. The`);
console.log(`  tolerance and the quantiser both enter, so a single number does not describe it — which is`);
console.log(`  A-G368 a second time in one block, and the reason the figures above are solved and not typed.`);
console.log(`  A single rung applied to both states cannot be right for both. *** This is A-G365's`);
console.log(`  resolution ground arriving from the opposite direction to PINK's, and it is no longer the`);
console.log(`  0.2 % footnote I recorded in §82 — it is a structural property of the ladder.`);
console.log(`\n  WHAT WOULD SEPARATE THE TWO MECHANISMS IF ANYONE EVER NEEDS TO: a max-minus-min versus a`);
console.log(`  FITTED AMPLITUDE at the breath's frequency over the same frames. Quantisation noise is`);
console.log(`  incoherent and a fit rejects it; a foreign mover at another frequency is rejected too, but`);
console.log(`  one AT the breath's frequency survives — which is A-G42's collision, already in the record.`);
console.log(`  Not asked for: it moves no verdict, per block [3].`);

/* ══ [3] does any verdict move? ══ */
console.log("\n" + "=".repeat(104));
console.log("[3] DOES ANY VERDICT MOVE? — the question that decides whether this is worth a run");
console.log("=".repeat(104));
const EXACT_T = { false: 0.01065, true: 0.02659 };
console.log(`\n  The capability rung, in quanta, at the modal medium:\n`);
for (const sel of [false, true]) {
  const t = EXACT_T[sel];
  let lo = 0, hi = 1;
  for (let i = 0; i < 120; i++) { const m = (lo + hi) / 2; if (sim(D, sel, m).cT < t) lo = m; else hi = m; }
  const share = (lo + hi) / 2, q = quantumAt(D, share, OP_MEAN);
  console.log(`    ${(sel ? "selected" : "unselected").padEnd(12)} t* = ${f(t)}  at share ${f(share, 4)}  = ${f(t / q, 1)} quanta  -> ${t / q >= 10 ? "ADMISSIBLE at PINK's 10q rung" : "BELOW the 10q rung"}`);
}
console.log(`\n  PINK reaches the same place from its own bytes: 0.01125 and 0.01147 are 35.6 and 48.6 quanta.`);
console.log(`  *** SO THE MASK THAT DECIDES LIMB 1 IS ENTIRELY ADMISSIBLE AND NO VERDICT MOVES. *** The`);
console.log(`  quantiser population lives in the loose rungs only, and PINK states its direction there with`);
console.log(`  the sign attached: tiny c means tiny s, so those pixels land in the denominator and not the`);
console.log(`  numerator, DEPRESSING the loose-rung shares. Excluding them raises those shares, which moves`);
console.log(`  a clear further into the clear.`);
console.log(`\n  BY MY OWN SEQUENCING CRITERION, THEREFORE: the residue above the ceiling is 1.35 / 0.32 / 3.22 /`);
console.log(`  0.48 %, that is small, the medians stand, and *** THE FOREIGN-SUPPRESSED RE-RUN DOES NOT EARN`);
console.log(`  ITS COST. *** I set that criterion before the answer and I am held to it.`);
console.log(`  The ONE thing I would still spend a run on is block [2]'s discriminator, and only because it`);
console.log(`  decides whether A-G366 has a fifth instance or PINK has a travel at the shared harmonics —`);
console.log(`  and neither of those moves a verdict either, so it is not asked for.`);
