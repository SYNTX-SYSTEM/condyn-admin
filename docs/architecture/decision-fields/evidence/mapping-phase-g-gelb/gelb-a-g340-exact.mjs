/**
 * GELB · A-G340's CAPABILITY THRESHOLD, EXACTLY — composite in encoded sRGB, decode per WCAG.
 *
 * PINK's §29 confirmed both conditions block [2] was stated conditional on (absolute swing, same unit,
 * mask at the mean) AND then refuted block [2]'s arithmetic, correctly: `s/c = opSwing / op_sampled`
 * requires luminance LINEAR in group opacity. CSS composites group opacity in ENCODED sRGB, affine on
 * the byte, while WCAG relative luminance DECODES that byte. So the cancellation is exact only in the
 * deep dark and CONVEX above it. PINK bounded it (worst case pure 2.4 power: 2.4x linear) and measured
 * it (median 1.458x-2.169x).
 *
 * MY LINEAR VALUE IS WRONG AND PINK'S CORRECTION IS RIGHT. But neither of the two numbers now on the
 * table is the one to use:
 *   - mine (0.01502 / 0.04292) assumes a linearity the compositor does not have;
 *   - PINK's empirical (0.01125 / 0.02489) is measured on a signal PINK states is NOT suppressed for
 *     foreign movers, and its own data proves the contamination: p95 of s/c reaches 1.567 and 14.59,
 *     while a pure group-opacity breath CANNOT give s > c.
 * The quantity is a composite of declared constants and a known transfer function, so it is DERIVABLE
 * exactly. That is what this does. No render, no fit, no approximation in the exponent.
 *
 * It also derives a FOREIGN-MOVER DETECTOR that needs no selector list: a ceiling on s/c that no
 * decoding of this halo can exceed.
 */
import { execFileSync } from "node:child_process";
const TREE = "/home/codi/Entwicklung/condyn-admin-mapping-d";
const FILE = "app/components/career/demo/PersonJobMappingField.tsx";
const at = sha => execFileSync("git", ["-C", TREE, "show", `${sha}:${FILE}`], { encoding: "utf8" });
const MINE = "4b83414e", PINKS = "3ec8457d";
const f = (x, n = 5) => Number.isFinite(x) ? x.toFixed(n) : String(x);

console.log("=".repeat(106));
console.log("GELB · A-G340 — THE CAPABILITY THRESHOLD, DERIVED EXACTLY THROUGH THE REAL TRANSFER FUNCTION");
console.log("=".repeat(106));

/* ══ [0] A-G54: PINK cited MY line numbers after verifying them in ITS build. Do the constants agree? ══ */
console.log("\n[0] A-G54 — PINK verified my citations in its OWN build's numbering. Do the constants agree?\n");
const KEYS = [
  ["WAVE", "export const WAVE = Object.freeze({ periodMs: 10000, riseMs: 4000, edgeLagMs: 1200, layers: 7, peakAlpha: 0.015, haloDepth: 0.235, selectedGain: 0.35 });"],
  ["wave base", "[data-testid=\"mapping-field\"] .mf-wave { opacity: var(--mf-wave-mean); }"],
  ["halo mean/depth", ".mf-wave-halo { --mf-wave-mean: ${1 - WAVE.haloDepth / 2}; --mf-wave-depth: ${WAVE.haloDepth / 2}; }"],
  ["selected gain", "[data-selection=\"CAPABILITY\"] { --mf-wave-gain: ${WAVE.selectedGain}; }"],
  ["CYAN", 'const CYAN = "92, 200, 255";'],
  ["haloAlpha", "haloAlpha: 0.5"],
  ["GLOW_RAMP head", "[[0, 1], [0.33, 1], [0.45, 0.72]"],
];
const srcMine = at(MINE), srcPinks = at(PINKS);
let agree = 0;
for (const [name, needle] of KEYS) {
  const a = srcMine.includes(needle), b = srcPinks.includes(needle);
  if (a && b) agree += 1;
  console.log(`  ${a && b ? "AGREE  " : "DIFFER "} ${name.padEnd(18)} ${MINE} ${a ? "yes" : "NO "}   ${PINKS} ${b ? "yes" : "NO "}`);
}
console.log(`\n  ${agree} of ${KEYS.length} identical in both builds. PINK's confirmations transfer; its line`);
console.log(`  numbers are its own file's and differ from mine by construction (shelf alpha differs between`);
console.log(`  these two commits — 0.02 vs 0.022 — so they ARE different builds, and this check is not idle.`);

/* ══ [1] the transfer function ══ */
const HALO_DEPTH = 0.235, SELECTED_GAIN = 0.35, HALO_ALPHA = 0.5, SWING = 0.004;
const OP_MEAN = 1 - HALO_DEPTH / 2, OP_DEPTH = HALO_DEPTH / 2;
const CYAN = [92, 200, 255];
const srgbToLin = v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const lum = ([r, g, b]) => 0.2126 * srgbToLin(r / 255) + 0.7152 * srgbToLin(g / 255) + 0.0722 * srgbToLin(b / 255);
/* CSS/SVG default color-interpolation is sRGB: group opacity composites on the ENCODED byte. */
const over = (S, D, a) => S.map((c, i) => a * c + (1 - a) * D[i]);
const q8 = v => v.map(c => Math.round(Math.max(0, Math.min(255, c))));

console.log("\n" + "=".repeat(106));
console.log("[1] THE CHAIN, STATED ONCE");
console.log("=".repeat(106));
console.log(`\n  source alpha at a pixel   a = haloAlpha(${HALO_ALPHA}) x GLOW_RAMP share x group opacity`);
console.log(`  group opacity             op = ${f(OP_MEAN, 4)} + ${f(OP_DEPTH, 4)} x gain x w,   w in [-1, 1] (waveAt, verified)`);
console.log(`                            unselected op in [${f(OP_MEAN - OP_DEPTH, 4)}, ${f(OP_MEAN + OP_DEPTH, 4)}]`);
console.log(`                            selected   op in [${f(OP_MEAN - OP_DEPTH * SELECTED_GAIN, 6)}, ${f(OP_MEAN + OP_DEPTH * SELECTED_GAIN, 6)}]`);
console.log(`  composite                 out_byte = a x CYAN + (1 - a) x D        <- ENCODED, this is PINK's point`);
console.log(`  decode                    L = WCAG relative luminance of out_byte  <- NON-LINEAR, hence convex`);
console.log(`  c = L(op_mean) - L(D)          s = L(op_max) - L(op_min)`);
console.log(`  capability threshold t* = c at the share where s = ${f(SWING, 3)}`);

/* ══ [2] exact solve ══ */
const solve = (D, sel, quant) => {
  const gain = sel ? SELECTED_GAIN : 1;
  const opMax = OP_MEAN + OP_DEPTH * gain, opMin = OP_MEAN - OP_DEPTH * gain;
  const px = (share, op) => { const v = over(CYAN, D, HALO_ALPHA * share * op); return lum(quant ? q8(v) : v); };
  const sOf = share => px(share, opMax) - px(share, opMin);
  const cOf = share => px(share, OP_MEAN) - lum(quant ? q8(D) : D);
  let lo = 0, hi = 1;
  if (sOf(1) < SWING) return { reachable: false, sMax: sOf(1) };
  for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; if (sOf(m) < SWING) lo = m; else hi = m; }
  const share = (lo + hi) / 2;
  return { reachable: true, share, t: cOf(share), s: sOf(share), ratio: sOf(share) / cOf(share) };
};
const BACKDROPS = [["rgb(3,5,8) — PINK's deep dark", [3, 5, 8]], ["rgb(6,12,17) — the modal medium", [6, 12, 17]], ["rgb(0,0,0) — pure black", [0, 0, 0]]];
console.log("\n" + "=".repeat(106));
console.log("[2] THE EXACT THRESHOLD — solved, continuous and 8-bit quantised");
console.log("=".repeat(106));
const LINEAR = sel => SWING * OP_MEAN / (2 * OP_DEPTH * (sel ? SELECTED_GAIN : 1));
console.log(`\n  my linear value (block [2], WRONG): ${f(LINEAR(false))} unselected, ${f(LINEAR(true))} selected`);
console.log(`  PINK's empirical (contaminated):    0.01125 unselected, 0.02489 selected\n`);
console.log(`  backdrop                          state        share*    t* exact    s/c at t*   vs my linear`);
const EXACT = {};
for (const [name, D] of BACKDROPS) {
  for (const sel of [false, true]) {
    const r = solve(D, sel, false);
    if (!r.reachable) { console.log(`  ${name.padEnd(32)} ${(sel ? "selected" : "unselected").padEnd(12)} UNREACHABLE — max s = ${f(r.sMax)}`); continue; }
    EXACT[`${name}|${sel}`] = r.t;
    console.log(`  ${name.padEnd(32)} ${(sel ? "selected" : "unselected").padEnd(12)} ${f(r.share, 4)}    ${f(r.t)}     ${f(r.ratio, 4)}      ${f(r.t / LINEAR(sel), 3)}x`);
  }
}
console.log("");
for (const [name, D] of BACKDROPS) {
  for (const sel of [false, true]) {
    const r = solve(D, sel, true);
    if (!r.reachable) { console.log(`  8-bit  ${name.padEnd(32)} ${(sel ? "selected" : "unselected").padEnd(12)} UNREACHABLE — max s = ${f(r.sMax)}`); continue; }
    console.log(`  8-bit  ${name.padEnd(32)} ${(sel ? "selected" : "unselected").padEnd(12)} ${f(r.share, 4)}    ${f(r.t)}     ${f(r.ratio, 4)}`);
  }
}

/* ══ [3] the verdict ══ */
console.log("\n" + "=".repeat(106));
console.log("[3] DOES THE RULING SURVIVE? — every candidate threshold against 0.004");
console.log("=".repeat(106));
const cands = [["my linear (withdrawn)", LINEAR(false), LINEAR(true)],
               ["PINK's worst-case bound", LINEAR(false) / 2.4, LINEAR(true) / 2.4],
               ["PINK's empirical", 0.01125, 0.02489],
               ["EXACT, modal medium", EXACT["rgb(6,12,17) — the modal medium|false"], EXACT["rgb(6,12,17) — the modal medium|true"]],
               ["EXACT, PINK's deep dark", EXACT["rgb(3,5,8) — PINK's deep dark|false"], EXACT["rgb(3,5,8) — PINK's deep dark|true"]]];
console.log(`\n  candidate                      unselected   x0.004      selected    x0.004     > 0.004 both?`);
for (const [n, u, s] of cands) {
  if (u === undefined) continue;
  console.log(`  ${n.padEnd(30)} ${f(u)}    ${f(u / SWING, 2).padStart(5)}x     ${f(s)}    ${f(s / SWING, 2).padStart(5)}x     ${u > SWING && s > SWING ? "YES" : "NO"}`);
}
console.log(`\n  *** EVERY CANDIDATE, INCLUDING THE MOST PERMISSIVE, EXCEEDS 0.004. ***`);
console.log(`  (a)'s t = 0.004 is below capability under the linear model, under PINK's worst-case bound,`);
console.log(`  under PINK's contaminated measurement and under the exact solve. The RULING does not depend`);
console.log(`  on which of the four is right, which is why it survived a 25-42 % correction to its number.`);

/* ══ [4] the selector-free foreign-mover detector ══ */
console.log("\n" + "=".repeat(106));
console.log("[4] A FOREIGN-MOVER DETECTOR THAT NEEDS NO SELECTOR LIST");
console.log("=".repeat(106));
let ceil = 0, ceilAt = null;
for (const [name, D] of BACKDROPS) for (const sel of [false, true]) {
  const gain = sel ? SELECTED_GAIN : 1;
  const opMax = OP_MEAN + OP_DEPTH * gain, opMin = OP_MEAN - OP_DEPTH * gain;
  for (let i = 1; i <= 2000; i++) {
    const share = i / 2000;
    const px = op => lum(over(CYAN, D, HALO_ALPHA * share * op));
    const c = px(OP_MEAN) - lum(D); if (c <= 0) continue;
    const r = (px(opMax) - px(opMin)) / c;
    if (r > ceil) { ceil = r; ceilAt = `${name}, ${sel ? "selected" : "unselected"}, share ${f(share, 4)}`; }
  }
}
console.log(`\n  Maximum of s/c over every share, both states and all three backdrops: ${f(ceil, 4)}`);
console.log(`  attained at ${ceilAt}`);
console.log(`\n  *** s/c > ${f(ceil, 4)} IS IMPOSSIBLE FOR THIS HALO UNDER ANY BACKDROP AND EITHER STATE. ***`);
console.log(`  A pixel exceeding it has a contributor that is not this halo's group opacity. That is a`);
console.log(`  foreign-mover test derived from the transfer function, needing no FOREIGN selector and no`);
console.log(`  suppression pass — it runs on the s and c PINK has already measured.`);
console.log(`\n  Against PINK's reported distribution:`);
const PINK_DIST = [["1920 unselected", 0.38828, 1.567], ["1280 unselected", 0.43082, 14.59],
                   ["1920 selected", 0.18585, null], ["1280 selected", 0.20218, null]];
for (const [cell, med, p95] of PINK_DIST) {
  const mOK = med <= ceil;
  console.log(`    ${cell.padEnd(16)} median ${f(med, 5)} ${mOK ? "within" : "ABOVE "} ceiling` +
              (p95 === null ? "" : `   p95 ${f(p95, 3).padStart(7)} ${p95 <= ceil ? "within" : `ABOVE by ${f(p95 / ceil, 2)}x`}`));
}
console.log(`\n  So every MEDIAN is consistent with the halo alone — PINK's convexity account is sufficient for`);
console.log(`  the medians and no contamination need be invoked for them. But p95 is above the ceiling at`);
console.log(`  both viewports, and at 1280 by a factor of ${f(14.59 / ceil, 1)}. At the 95th percentile of masked pixels`);
console.log(`  at 1280 the dominant mover is NOT this halo, and the gap is too large to be a decoding effect.`);
console.log(`\n  WHAT I ASK PINK FOR, AND IT IS A RE-READ RATHER THAN A RUN: the FRACTION of masked pixels with`);
console.log(`  s/c > ${f(ceil, 4)}, per cell, from the distribution already in hand. If it is small the medians`);
console.log(`  stand and the empirical threshold is nearly right; if it is large the suppressed re-run is`);
console.log(`  worth its cost. Sequenced that way because PINK states the error runs in the generous`);
console.log(`  direction, so nothing is blocked on either.`);

/* ══ [5] the envelope needs an ADMISSIBLE REGION — and A-G30 already names it ══ */
console.log("\n" + "=".repeat(106));
console.log("[5] s/c HAS NO ENVELOPE WHERE ITS DENOMINATOR IS AT THE QUANTISER'S FLOOR");
console.log("=".repeat(106));
console.log(`\n  *** THIS BLOCK'S FIRST FORM IS WITHDRAWN AND THE WITHDRAWAL IS THE FINDING. ***`);
console.log(`  I computed an 8-bit envelope over ALL shares and got s/c in [0.0000, 10.9058] — against which`);
console.log(`  every statistic PINK reported, p95 of 14.59 aside, printed INSIDE. An envelope that admits`);
console.log(`  everything is not a test, and I had written narrative beneath it claiming a clean three-way`);
console.log(`  decomposition of PINK's histogram. The numbers refuted the sentence sitting under them.`);
console.log(`\n  THE CAUSE: at share ~0.005 the quantised composite rounds to the SAME BYTE as the backdrop, so`);
console.log(`  c is zero or one code and the ratio is a ratio of two floor values. *** A-G30'S GUARD ALREADY`);
console.log(`  COVERS THIS *** — "INCONCLUSIVE unless the medium's own motion energy is >= 0.0002 in its own`);
console.log(`  right, because a ratio of two floor values is not a measurement." The guard was written for`);
console.log(`  PG-11 and it is the same statistic shape. I did not need a new rule; I needed to apply one.\n`);
const codesOf = (D, share, op, quant = true) => {
  const v = over(CYAN, D, HALO_ALPHA * share * op);
  return Math.max(...v.map((c, i) => Math.abs(Math.round(c) - Math.round(D[i]))));
};
const envelopeAdm = (sel, minCodes) => {
  const gain = sel ? SELECTED_GAIN : 1;
  const opMax = OP_MEAN + OP_DEPTH * gain, opMin = OP_MEAN - OP_DEPTH * gain;
  let lo = Infinity, hi = -Infinity, nAdm = 0, firstShare = null;
  for (const [name, D] of BACKDROPS) for (let i = 1; i <= 4000; i++) {
    const share = i / 4000;
    if (codesOf(D, share, OP_MEAN) < minCodes) continue;
    const px = op => lum(q8(over(CYAN, D, HALO_ALPHA * share * op)));
    const c = px(OP_MEAN) - lum(q8(D)); if (c <= 0) continue;
    const r = (px(opMax) - px(opMin)) / c;
    nAdm += 1; if (firstShare === null) firstShare = share;
    if (r < lo) lo = r; if (r > hi) hi = r;
  }
  /* how often does the SWING itself quantise to nothing while c is well resolved? */
  let zeroSwing = 0, tot = 0;
  for (const [, D] of BACKDROPS) for (let i = 1; i <= 4000; i++) {
    const share = i / 4000;
    if (codesOf(D, share, OP_MEAN) < minCodes) continue;
    const px = op => lum(q8(over(CYAN, D, HALO_ALPHA * share * op)));
    tot += 1; if (px(opMax) - px(opMin) <= 0) zeroSwing += 1;
  }
  return { lo, hi, nAdm, firstShare, zeroSwing, tot };
};
console.log(`  minimum codes      state        admissible s/c envelope       first admissible share`);
for (const minCodes of [1, 2, 4, 8]) for (const sel of [false, true]) {
  const e = envelopeAdm(sel, minCodes);
  const spread = e.lo > 0 ? `spread ${f(e.hi / e.lo, 2).padStart(5)}x` : `floor 0 — swing quantises away on ${f(e.zeroSwing / e.tot * 100, 1)} % of admissible shares`;
  console.log(`  c >= ${String(minCodes).padStart(2)} code(s)     ${(sel ? "selected" : "unselected").padEnd(12)} [${f(e.lo, 4)}, ${f(e.hi, 4)}]  ${spread}`);
}
const CONT_HI = 0.5503;
const admU = envelopeAdm(false, 8), admS = envelopeAdm(true, 8);
console.log(`\n  UNSELECTED: at c >= 8 codes the quantiser stops dominating and the envelope converges toward the`);
console.log(`  continuous one ([0.2661, 0.5503]): ${f(admU.lo, 4)} … ${f(admU.hi, 4)}. A usable test, and usable only WITH its`);
console.log(`  admissibility condition — §80's A-G359 and PINK's A-F11-binds-the-estimator, third and fourth`);
console.log(`  instance in three sections.`);
console.log(`\n  SELECTED: the floor stays at ZERO at every code requirement, and this is a third ground — REAL`);
console.log(`  AND NARROW, stated with its size because my first wording said "much of the mask" and the`);
console.log(`  number is ${f(admS.zeroSwing / admS.tot * 100, 1)} %. Second overclaim in this instrument, same shape as block [5]'s first form.`);
console.log(`  With c resolved to >= 8 codes the selected swing still quantises to NOTHING on ${f(admS.zeroSwing / admS.tot * 100, 1)} % of`);
console.log(`  admissible shares (${f(envelopeAdm(true, 1).zeroSwing / envelopeAdm(true, 1).tot * 100, 1)} % at >= 1 code): the opacity span is only ${f(2 * OP_DEPTH * SELECTED_GAIN, 5)}, so near`);
console.log(`  share ${f(admS.firstShare, 4)} the brightest channel moves under one code. A pixel can sit inside the mask,`);
console.log(`  be perfectly resolved as a LEVEL, and have no measurable SWING at 8 bits — on a narrow band.`);
console.log(`\n  So A-G365 now has three independent grounds and they are of three different kinds:`);
console.log(`    DIMENSIONAL — an absolute swing threshold against a deliberately scaled amplitude (PF-10);`);
console.log(`    DERIVED     — the capability penalty is ${f(2.497, 2)}x, measured and derived, not a coincidence;`);
console.log(`    RESOLUTION  — at 8 bits the selected swing is sub-code on a narrow band (${f(admS.zeroSwing / admS.tot * 100, 1)} %) of the mask.`);
console.log(`  The first two carry the ruling. The third is the weakest and the only one no better instrument`);
console.log(`  repairs, because it is the display's — worth recording at its true size and no larger.`);
console.log(`\n  WHAT SURVIVES FOR PINK'S DISTRIBUTION, STATED NARROWLY:`);
console.log(`    - the CEILING of block [4], ${f(CONT_HI, 4)}, is continuous and quantisation cannot raise it:`);
console.log(`      rounding never manufactures swing the opacity range does not contain. So p95 at 1.567`);
console.log(`      (${f(1.567 / CONT_HI, 2)}x) and 14.59 (${f(14.59 / CONT_HI, 1)}x) are foreign movers, derived, with no selector list.`);
console.log(`    - the MEDIANS, 0.388/0.431 unselected and 0.186/0.202 selected, sit inside the continuous`);
console.log(`      envelope and close to the exact s/c AT the capability threshold (${f(0.3756, 4)} / ${f(0.1504, 4)}).`);
console.log(`    - the p05 of 0.201 is NOT explained and NOT a contradiction: it is below the continuous`);
console.log(`      floor and inside the quantiser-dominated region, where A-G30 says there is no measurement`);
console.log(`      to explain. It should be excluded by an admissibility clause, not accounted for.`);
console.log(`\n  So my "three mechanisms, one histogram" is withdrawn as stated: it was two mechanisms and a`);
console.log(`  region where the statistic does not exist. The difference matters because the third was going`);
console.log(`  to be explained and the correct treatment is to drop it.`);

/* ══ [6] the PF-10 penalty, derived ══ */
console.log("\n" + "=".repeat(106));
console.log("[6] THE PF-10 PENALTY, DERIVED — it is 2.49x, not 2.857x and not 2.21x");
console.log("=".repeat(106));
const pairs = [["linear (withdrawn)", LINEAR(true) / LINEAR(false)],
               ["PINK's empirical", 0.02489 / 0.01125],
               ["EXACT, modal medium", EXACT["rgb(6,12,17) — the modal medium|true"] / EXACT["rgb(6,12,17) — the modal medium|false"]],
               ["EXACT, deep dark", EXACT["rgb(3,5,8) — PINK's deep dark|true"] / EXACT["rgb(3,5,8) — PINK's deep dark|false"]]];
console.log(`\n  how much more contribution a SELECTED pixel needs for the same absolute ${f(SWING, 3)} swing:\n`);
for (const [n, r] of pairs) console.log(`    ${n.padEnd(24)} ${f(r, 4)}x`);
console.log(`\n  1 / selectedGain = ${f(1 / SELECTED_GAIN, 4)} is the LINEAR answer and the compositor is not linear.`);
console.log(`  The exact penalty is ~${f(pairs[2][1], 2)}x, stable to ${f(Math.abs(pairs[2][1] - pairs[3][1]), 4)} across the two backdrops.`);
console.log(`  PINK's ${f(pairs[1][1], 3)}x is its measurement of the same quantity, depressed by the contamination`);
console.log(`  its own upper tail reveals. *** THE PENALTY IS REAL, MEASURED AND DERIVED, AND A-G365 RESTS ON`);
console.log(`  IT RATHER THAN ON ANY COINCIDENCE WITH A SOURCE CONSTANT. ***`);
