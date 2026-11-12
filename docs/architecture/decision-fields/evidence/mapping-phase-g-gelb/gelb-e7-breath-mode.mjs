/**
 * GELB · §90 A-G406 — E-7's four-ring ladder is asserted at a breath trough no element visits.
 *
 * This instrument exists because of §89's owed item, not in spite of it. The owed item was "GROUND,
 * MOTION, RING_WIDTH_PX into the coverage set" — the three constants A-G405 identified as unwatched in
 * BOTH lanes at once. The first of them read turned out to hold a dead figure, which is A-G405 earning
 * itself in one step: the cross-lane gap was where the defect was.
 *
 * Every product value is READ from gelb-product-constants.mjs (§88's top rung: no copy is held here).
 * Every consumer count is produced by `git grep` at a named build, not typed.
 */
import { execFileSync } from "node:child_process";
import * as P from "./gelb-product-constants.mjs";
import { REPO_ROOT, peerRef } from "./gelb-paths.mjs"; // A-G469: derived, never declared

const TREE = REPO_ROOT;
const FIELD = P.SOURCES.FIELD;
const TEST = "test/career/mapping-field/neurovisual-e.test.ts";
const git = (...a) => execFileSync("git", ["-C", TREE, ...a], { encoding: "utf8" });
const grep = (pat, rev) => { try { return git("grep", "-n", "-E", pat, rev, "--", ".").trim().split("\n").filter(Boolean); } catch { return []; } };
const show = (rev, path) => git("show", `${rev}:${path}`);
const f = (x, n = 4) => Number(x).toFixed(n);
const rule = (c = "=") => console.log(c.repeat(104));
const PEER = peerRef(TREE); const HEAD = PEER.sha; // was "HEAD" of a sibling worktree; now a NAMED peer ref (A-G469)

rule();
console.log(`GELB · §90 A-G406 — E-7's BREATH TROUGH. Product @ ${P.SHA}, cross-checked at ${PEER.ref} ${HEAD}`);
rule();

/* ────────────────────────────────────────────────────────────────────────────────────────────────── */
console.log(`\n[1] THE BREATH GROUPS THAT EXIST IN THE PRODUCT — read from the stylesheet, not assumed\n`);
const groups = Object.entries(P.WAVE_GROUPS);
console.log(`  the keyframe's law, read from the product:  ${P.WAVE_KEYFRAME}`);
console.log(`  waveAt returns w ∈ [−1, 1], so each group sweeps mean ± depth:\n`);
console.log(`    group              mean        depth       trough      peak        peak-to-peak`);
for (const [k, g] of groups) {
  console.log(`    .mf-wave-${k.padEnd(8)} ${f(g.mean)}      ${f(g.depth)}      ${f(g.mean - g.depth)}      ${f(g.mean + g.depth)}      ${f(2 * g.depth)}`);
}
const halo = P.WAVE_GROUPS.halo, ground = P.WAVE_GROUPS.ground;
console.log(`\n  *** ${groups.length} GROUPS BREATHE AND NEITHER IS A RING. *** The halo's mean is not stored here: it is`);
console.log(`  checked to BE 1 − haloDepth/2 = ${f(1 - P.HALO_DEPTH / 2)} and its depth to BE haloDepth/2 = ${f(P.HALO_DEPTH / 2)}, from`);
console.log(`  WAVE.haloDepth = ${P.HALO_DEPTH}. A relation verified beats a number stored (§88).`);

/* ────────────────────────────────────────────────────────────────────────────────────────────────── */
rule();
console.log(`[2] MOTION.breath — DECLARED, AND READ BY EXACTLY ONE CONSUMER IN THE WHOLE TREE`);
rule();
console.log(`\n  MOTION.breath as the product declares it: ${JSON.stringify(P.MOTION_BREATH)}\n`);
const pat = 'MOTION\\.breath|opacityMean|opacityAmplitude';
for (const rev of [P.SHA, PEER.sha]) {
  const hits = grep(pat, rev).map(l => l.replace(`${rev}:`, ""));
  const decl = hits.filter(h => h.startsWith(FIELD));
  const tests = hits.filter(h => h.startsWith("test/"));
  const other = hits.filter(h => !decl.includes(h) && !tests.includes(h));
  console.log(`  @ ${rev}:  ${hits.length} hit(s) — ${decl.length} in the drawing surface (declaration + its own docstring), ${tests.length} in test, ${other.length} elsewhere`);
  for (const h of hits) console.log(`      ${h.split(":").slice(0, 2).join(":")}`);
  const consumers = hits.filter(h => !h.startsWith(FIELD));
  console.log(`    render-path readers: ${hits.filter(h => h.startsWith(FIELD) && !/^\S+:(80|84):/.test(h)).length}      non-declaring consumers: ${consumers.length}`);
}
const motionKeys = [...new Set(grep('MOTION\\.[a-z]+\\.', P.SHA).join("\n").match(/MOTION\.[a-z]+/g) || [])].sort();
console.log(`\n  every MOTION sub-object the tree mentions: ${motionKeys.join(", ")}`);
const fieldSrc = show(P.SHA, FIELD);
const usedKeys = [...new Set((fieldSrc.match(/MOTION\.[a-z]+/g) || []))].sort();
console.log(`  the ones the DRAWING SURFACE reads:        ${usedKeys.join(", ")}`);
const deadKeys = motionKeys.filter(k => !usedKeys.includes(k));
console.log(`\n  *** ${deadKeys.length} SUB-OBJECT(S) OF MOTION ARE READ BY NO RENDER PATH: ${deadKeys.join(", ") || "(none)"} ***`);

/* ────────────────────────────────────────────────────────────────────────────────────────────────── */
rule();
console.log(`[3] THE FIELD RING DOES NOT BREATHE — and the product says so in its own words`);
rule();
const lines = fieldSrc.split("\n");
const ringLine = lines.findIndex(l => l.includes('data-testid="mapping-ring-field"')) + 1;
const ring = lines[ringLine - 1];
const waveSel = lines.map((l, i) => [i + 1, l]).filter(([, l]) => /\[data-breath="LIVE"\]/.test(l));
/* the FIRST form of this filter was /className=\{?["'][^"']*mf-wave/ and it found ONE element, because
   the halo's class sits inside a CONDITIONAL — className={b.shelf ? undefined : "mf-wave mf-wave-halo"} —
   so the quote does not follow the brace. See the A-G407 block below: that miscount is the finding. */
const waveCls = lines.map((l, i) => [i + 1, l]).filter(([, l]) => /className=.*mf-wave/.test(l));
const waveClsNames = waveCls.map(([, l]) => [...l.matchAll(/mf-wave-([a-z]+)/g)].map(m => m[1]).join("+"));
console.log(`\n  the ring, at :${ringLine} —`);
console.log(`      carries data-breath:            ${/data-breath=/.test(ring)}`);
console.log(`      carries a .mf-wave class:       ${/mf-wave/.test(ring)}`);
console.log(`      sits under an .mf-wave group:   ${/mf-wave/.test(lines.slice(900, ringLine - 1).filter(l => /<g /.test(l)).join(""))}`);
console.log(`\n  every CSS rule the breath state drives (${waveSel.length}):`);
for (const [n, l] of waveSel) console.log(`      :${n}  ${l.trim().slice(0, 96)}`);
console.log(`\n  every element that carries a wave class (${waveCls.length}):`);
waveCls.forEach(([n, l], i) => console.log(`      :${n}  mf-wave-${waveClsNames[i]}   ${/\?/.test(l.slice(l.indexOf("className"), l.indexOf("className") + 40)) ? "(written as a conditional — the form the first scan missed)" : "(a plain string literal)"}`));
const comment = lines.findIndex(l => l.includes("the breath itself is the medium's")) + 1;
console.log(`\n  AND THE ARCHITECTURE IS NOT AMBIGUOUS — the product states it at :${comment}:`);
console.log(`      "${lines[comment - 1].trim().replace(/\*\/$/, "").trim()}"`);
console.log(`\n  *** SO data-breath ON THE RING IS A STATE MARKER, BY DESIGN. *** Both selectors require a`);
console.log(`  .mf-wave DESCENDANT of the field root; the ring is neither a descendant of itself nor a`);
console.log(`  wave element. ${waveCls.length} element(s) breathe — ${waveClsNames.join(", ")} — and the ring's alpha is static.`);
if (waveCls.length !== groups.length) throw new Error(`ERR: ${waveCls.length} wave-carrying elements but ${groups.length} wave groups defined in CSS — one of the two scans is wrong`);

console.log(`
  *** A-G407, AND IT IS ABOUT A-G396 RATHER THAN ABOUT THE PRODUCT. *** The first form of the scan above
  printed ${1} where it now prints ${waveCls.length}, because the halo's class is written as a CONDITIONAL and my pattern
  required a quote right after the brace. A-G396 says every numeral in a narrative line must be an
  interpolated variable, so the sentence beside it printed the same wrong number — and in §80 through §89
  it was precisely a TYPED numeral DISAGREEING with its own adjacent output that caught twelve defects.
  *** INTERPOLATION MADE THE NARRATIVE AGREE WITH THE SCAN BY CONSTRUCTION, WHICH REMOVED THE DETECTOR
  ALONG WITH THE ERROR CLASS. *** A-G396 moved the failure from "the prose is wrong" to "the prose is
  faithfully wrong", which is harder to see, not easier. THE RULE STANDS AND GAINS A SECOND LIMB: an
  interpolated count must be accompanied by an INDEPENDENT ASSERTION on the same quantity — above, that
  the number of wave-carrying ELEMENTS equals the number of wave GROUPS the stylesheet defines, which is
  the throw one line up and which fails loudly on the old pattern. A count with no second opinion is not
  verified by being computed; it is only consistent with itself.`);

/* ────────────────────────────────────────────────────────────────────────────────────────────────── */
rule();
console.log(`[4] THE LADDER UNDER EVERY BREATH THE PRODUCT COULD SUPPLY — and the rung that is tightest`);
rule();
const testSrc = show(P.SHA, TEST);
const bandStep = Number((/bandStep:\s*([0-9.]+)/.exec(testSrc) || [])[1]);
if (!Number.isFinite(bandStep)) throw new Error("could not read CONTRACT.bandStep from the test");
const { shelf, best, field, horizon } = P.RING_LUMINANCE;
console.log(`\n  RING_LUMINANCE, read from the product: ${JSON.stringify(P.RING_LUMINANCE)}`);
console.log(`  CONTRACT.bandStep, read from the test:  ${bandStep}   (= LUMINANCE_STEP_MIN ${P.LUMINANCE_STEP_MIN} in the model file: ${bandStep === P.LUMINANCE_STEP_MIN})`);
console.log(`\n  the three rungs E-7 asserts, as the test computes them:`);
console.log(`      best/shelf ≥ bandStep        trough/best ≥ bandStep        horizon/min(1,peak) ≥ bandStep`);
console.log(`  where trough = field × (mean − amp) and peak = field × (mean + amp).\n`);
const HYP = [
  ["AS WRITTEN — MOTION.breath", P.MOTION_BREATH.opacityMean, P.MOTION_BREATH.opacityAmplitude, "read by no render path"],
  ["the halo's actual breath", halo.mean, halo.depth, "a group that does breathe"],
  ["the ground's actual breath", ground.mean, ground.depth, "a group that does breathe"],
  ["NO BREATH — the ring as drawn", 1, 0, "what the product actually paints"],
];
console.log(`    hypothesis                      mean      amp       trough    peak      r1      r2      r3      verdict`);
const rows = [];
for (const [label, mean, amp, note] of HYP) {
  const trough = field * (mean - amp), peak = field * (mean + amp);
  const r1 = best / shelf, r2 = trough / best, r3 = horizon / Math.min(1, peak);
  const pass = r1 >= bandStep && r2 >= bandStep && r3 >= bandStep;
  rows.push({ label, mean, amp, trough, peak, r1, r2, r3, pass, note });
  console.log(`    ${label.padEnd(31)} ${f(mean, 4)}    ${f(amp, 4)}    ${f(trough)}    ${f(peak)}    ${f(r1, 3)}   ${f(r2, 3)}   ${f(r3, 3)}   ${pass ? "PASS" : "FAIL"}`);
}
const asWritten = rows[0], noBreath = rows[3];
const failing = rows.filter(r => !r.pass);
console.log(`\n  ${failing.length} of ${rows.length} hypotheses FAIL, and they are exactly the ${failing.filter(r => /actual/.test(r.label)).length} that name a group that really breathes:`);
for (const r of failing) {
  const which = [["r1 best/shelf", r.r1], ["r2 trough/best", r.r2], ["r3 horizon/peak", r.r3]].filter(([, v]) => v < bandStep);
  console.log(`      ${r.label.padEnd(31)} fails ${which.map(([n, v]) => `${n} = ${f(v, 3)} < ${bandStep}`).join(", ")}`);
}
const margins = [["best/shelf", asWritten.r1], ["trough/best", asWritten.r2], ["horizon/min(1,peak)", asWritten.r3]]
  .map(([n, v]) => [n, v, (v / bandStep - 1) * 100]).sort((a, b) => a[2] - b[2]);
console.log(`\n  AND THE RUNG MEASURED AGAINST THE DEAD CONSTANT IS THE TIGHTEST ONE IN THE LADDER:`);
for (const [n, v, m] of margins) console.log(`      ${n.padEnd(21)} ${f(v, 4)}  = bandStep × ${f(v / bandStep, 4)}   margin ${m >= 0 ? "+" : ""}${f(m, 2)} %`);
console.log(`\n  *** THE LADDER'S WHOLE MARGIN SITS ON ${margins[0][0]} AT ${f(margins[0][2], 2)} %, AND THAT IS THE ONLY RUNG`);
console.log(`  WHOSE VALUE COMES FROM A CONSTANT NOTHING RENDERS. *** Under the halo's real breath the same`);
console.log(`  rung reads ${f(rows[1].r2, 3)} against ${bandStep} — short by ${f((1 - rows[1].r2 / bandStep) * 100, 1)} %. The static ring, which is what the`);
console.log(`  product paints, clears every rung: ${f(noBreath.r1, 3)}, ${f(noBreath.r2, 3)}, ${f(noBreath.r3, 3)}.`);

/* ────────────────────────────────────────────────────────────────────────────────────────────────── */
rule();
console.log(`[5] A-G128 ON E-7's BREATH CLAUSE — can the product make this rung fail?`);
rule();
const consumersOfMean = grep('opacityMean', P.SHA).filter(l => !l.includes(`:${FIELD}:`));
console.log(`\n  LIMB 1, arithmetic: the rung admits a pass and a fail — ${f(asWritten.r2, 3)} passes, ${f(rows[1].r2, 3)} would fail. SATISFIABLE.`);
console.log(`  LIMB 2, A-G268 enforcement: does the PRODUCT evaluate this predicate? The only reader of`);
console.log(`      MOTION.breath.opacityMean outside its own declaration is:`);
for (const l of consumersOfMean) console.log(`        ${l.replace(`${P.SHA}:`, "").split(":").slice(0, 2).join(":")}`);
console.log(`      — the assertion itself. *** THE TEST IS THE ONLY CONSUMER OF THE CONSTANT IT TESTS AGAINST. ***`);
console.log(`      No change to anything the product DRAWS can move this rung; only editing the constant can,`);
console.log(`      and the constant is read by the test that reads it. ZERO-BY-CONSTRUCTION, in the §80 sense:`);
console.log(`      the rung cannot report a defect in the drawn output because it never reads the drawn output.`);
console.log(`  LIMB 3, A-G313 motion-mode: the pin names a MULTIPLICATIVE MODULATION OF A STROKE'S OWN ALPHA on`);
console.log(`      the field ring. The quantity that exists is GROUP OPACITY on the medium. Different subject,`);
console.log(`      different mode, different magnitude — amp ${f(P.MOTION_BREATH.opacityAmplitude)} named, ${f(halo.depth)} and ${f(ground.depth)} real`);
console.log(`      (${f(halo.depth / P.MOTION_BREATH.opacityAmplitude, 2)}× and ${f(ground.depth / P.MOTION_BREATH.opacityAmplitude, 2)}× the named figure). NOT THE SAME QUANTITY.`);

const contractBreath = /breath:\s*\{([^}]*)\}/.exec(testSrc);
const cbKeys = contractBreath ? [...contractBreath[1].matchAll(/(\w+):\s*([0-9.]+)/g)].map(m => [m[1], Number(m[2])]) : [];
const cbUsed = cbKeys.filter(([k]) => new RegExp(`CONTRACT\\.breath\\.${k}\\b`).test(testSrc));
console.log(`\n  AND THE ROOT CAUSE, WHICH IS NOT CARELESSNESS: the test holds its OWN contract copy — the right`);
console.log(`  shape, since a test that reads the product's constant cannot fail. CONTRACT.breath declares`);
console.log(`  ${cbKeys.length} figures (${cbKeys.map(([k, v]) => `${k} ${v}`).join(", ")}) and asserts ${cbUsed.length} of them (${cbUsed.map(([k]) => k).join(", ") || "none"}).`);
console.log(`  *** IT DECLARES NO MEAN. *** The clause needs a mean to locate a trough, the contract does not`);
console.log(`  state one, so the test reached into the product for it — and reached a dead declaration.`);
console.log(`  ${cbKeys.length - cbUsed.length} of the contract's own breath figures (${cbKeys.filter(([k]) => !cbUsed.some(([u]) => u === k)).map(([k]) => k).join(", ")}) are asserted nowhere.`);

/* ────────────────────────────────────────────────────────────────────────────────────────────────── */
rule();
console.log(`[6] VERDICT, AND WHAT EACH LANE OWES`);
rule();
console.log(`
  A-G406, RULED. E-7's breath clause is INCONCLUSIVE BY CONSTRUCTION (A-G364's state, third instance):
  the instrument resolves perfectly and resolves something the pin does not name. The ladder's STATIC
  three rungs hold on the shipping build with margin — ${f(noBreath.r1, 3)}, ${f(noBreath.r2, 3)}, ${f(noBreath.r3, 3)} against ${bandStep} — and that is the
  ladder E-7 should assert, because the ring E-7 orders is static BY THE PRODUCT'S OWN DESIGN (:${comment}).

  NOT A DEFECT IN THE BUILD. The build is coherent: the breath migrated to the medium in phase F and the
  component says so where it draws. The defect is a TEST and a DECLARATION left behind by that migration,
  and A-G54 read forwards is why it matters — a figure is a property of a build, and ${f(P.MOTION_BREATH.opacityAmplitude)} is a property
  of no build that ships.

  GRÜN OWES, and it is an ACTION rather than an argument (A-G403):
    1. DELETE MOTION.breath from the drawing surface. The constant-provenance ladder (§88) says the right
       move for a dead VALUE is to delete the copy, not to guard it. Deleting it BREAKS the test, which is
       how the defect surfaces — that is the remedy working, not the remedy failing.
    2. RE-POINT E-7 at the static ladder: best/shelf, field/best, horizon/field, each ≥ bandStep. No mean,
       no trough, no borrowed constant.
    3. The docstring at :84 goes with it. It states a contract ("field ring is at opacityMean −
       opacityAmplitude of its value") that nothing executes, and it is the SECOND docstring this phase to
       quote a figure the product does not use — SEAT_PAD_PX's at :118 was the first (§80).

  PINK OWES A PROBE, not a ruling, because this lane cannot execute it (A-G393): the ground group sweeps
  its opacity over [${f(ground.mean - ground.depth)}, ${f(ground.mean + ground.depth)}] across ${P.WAVE_LAYERS} staggered layers, with base stops ${P.GROUND_STOPS.map(([, a]) => a).join(" … ")}.
  E-7 orders RINGS and says nothing about the medium behind them. *** IS THE GROUND AT ITS BREATH PEAK
  EVER ≥ bandStep-ordered against the shelf ring at ${shelf}? *** The two do not overlap spatially at this
  build (the ground discs stop at shelfNear, the shelf band starts there), so this is a PIXEL question on
  the real stack and not a source question. It is raised as the open obligation E-7 never stated, and it
  is NOT counted as a defect until measured.
`);
rule();
console.log(`CONSTANT PROVENANCE OF THIS INSTRUMENT: every product value above is READ from`);
console.log(`gelb-product-constants.mjs (${Object.keys(P.READ).length} values parsed at ${P.SHA}, no literal held). This file holds no copy.`);
const cov = P.coverage();
console.log(`That module's scope after §90: ${cov.declared} declarations across ${Object.keys(P.SOURCES).length} files, ${cov.covered} covered, ${cov.uncovered} not.`);
console.log(`Names the drawing surface IMPORTS and this module cannot reach: ${cov.outOfScope.length} — §89's scope defect discharged.`);
rule();
