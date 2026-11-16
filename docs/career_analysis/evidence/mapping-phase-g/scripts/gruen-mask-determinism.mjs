/**
 * GRÜN · PHASE-G · §95 — WHY classMasks IS NOT REPRODUCIBLE: the suspect was innocent.
 * **NO VERDICT** (A-G36 point 2). Browser only. No build, no server write, no product change.
 *
 * §94 found the instability by accident — plainGlow 50070 on one run, 50067 on the next, same page, same
 * viewport — and GELB §91 ruled it not optional: either the mask becomes reproducible, or every figure derived
 * from the hue/plain split carries the instability in its statement. PF-3's differential is POOLED over that
 * partition, which is the one case where three pixels can move a conclusion.
 *
 * MY FIRST SUSPECT WAS A TIMING CONSTANT AND IT IS EXONERATED. `hide()` injects a style tag and waits a FIXED
 * 340 ms, which is an assumed settle rather than a checked one, so I expected to find the page still
 * repainting. A first diagnostic appeared to confirm it: captures taken 0/200/600/1500 ms after the fixed wait
 * diverged monotonically from the capture classMasks actually uses, 791 → 2542 pixels, and the mask grew
 * 97218 → 97404. A convincing settle story.
 *
 * IT WAS WRONG, AND THE CONTROL THAT KILLED IT IS THE ONE I HAD NOT RUN: the same capture sequence with NO
 * HIDE AT ALL. Six captures of a completely unchanged page differ from each other by 828…1260 pixels and drift
 * from the first by 1260 → 1975 — the same magnitude and the same random-walk shape. The "settle drift" was
 * per-capture noise accumulating, present with no state change whatsoever. A monotonic series is not evidence
 * of a process; it is what a random walk away from a fixed reference looks like.
 *
 * THE REAL CAUSE IS NOISE MEETING A STRICT INEQUALITY. ~1000 of 853776 luminance values change between two
 * captures of one state, and membership is decided by `base - hidden > 0.001`. Every pixel whose delta sits
 * within the noise of that threshold flips. No wait can fix that, which is exactly why the wrong diagnosis
 * mattered: a longer timeout would have looked like a fix for as long as nobody counted.
 *
 * AND IT CORRECTS SOMETHING I TOLD GELB. §94 reported captureChroma as bit-exact across captures. That reading
 * was taken over the hue-carrying GLOW — 47073 pixels — where it is true, and I stated it as a property of the
 * instrument. Over the whole clip it is false. The scope error is the same one GELB made three times today
 * with the coverage denominator and the worktree restoration, and mine is in the same message that named
 * theirs. Corrected here with the figure that shows it.
 */
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  chromium, openField, probeGeometry, clipOf, discMask, cdpSession, captureLuminance, hide, unhideAll,
  classMasksStable, CLASS_SELECTOR, PROVENANCE, servedProvenance, pct
} from "./gruen-instrument.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(here, "../outputs");
const WT = process.env.GRUEN_WT ?? resolve(here, "../../../../..");
const VW = Number(process.env.VW ?? 1920), VH = Number(process.env.VH ?? 1080);
const THRESHOLD = 0.001;
const CLASSES = ["glowsAll", "bodyOutlines", "bodyNames", "arcs", "beams", "beamGlow", "travel", "nodes", "sectorText"];

const browser = await chromium.launch();
const { ctx, page, guard } = await openField(browser, { reduce: true, vw: VW, vh: VH });
const provenance = await servedProvenance(page, WT);
const geo = await probeGeometry(page);
const clip = clipOf(geo, VW, VH);
const { disc, N } = discMask(clip, geo);
const cdp = await cdpSession(page);
const diff = (a, b) => { let d = 0; for (let i = 0; i < N; i += 1) if (a[i] !== b[i]) d += 1; return d; };
const diffSplit = (a, b) => { let inD = 0, outD = 0; for (let i = 0; i < N; i += 1) if (a[i] !== b[i]) { if (disc[i]) inD += 1; else outD += 1; } return { insideDisc: inD, outsideDisc: outD }; };
const stats = v => { const a = Float64Array.from(v); a.sort(); return a.length === 0 ? { n: 0 } : { n: a.length, p50: +pct(a, 0.5).toExponential(3), p99: +pct(a, 0.99).toExponential(3), max: +a[a.length - 1].toExponential(3) }; };

/* ── CONTROL: the same capture sequence with NO state change. The limb the first diagnosis lacked. ──── */
const noHide = [];
let prev = await captureLuminance(cdp, clip, N);
const firstNoHide = prev;
for (let i = 1; i < 6; i += 1) {
  const s = await captureLuminance(cdp, clip, N);
  noHide.push({ capture: i + 1, vsPrevious: diff(prev, s), vsFirst: diff(firstNoHide, s), vsFirstSplit: diffSplit(firstNoHide, s) });
  prev = s;
}

/* ── the SAME sequence after one hide(), to be compared against the control and not against zero ────── */
await hide(page, CLASS_SELECTOR.glowsAll);
const afterHide = [];
let p2 = await captureLuminance(cdp, clip, N);
const firstAfterHide = p2;
for (let i = 1; i < 6; i += 1) {
  await page.waitForTimeout(250);
  const s = await captureLuminance(cdp, clip, N);
  afterHide.push({ atMsAfterTheFixedWait: i * 250, vsPrevious: diff(p2, s), vsFirstAfterHide: diff(firstAfterHide, s) });
  p2 = s;
}
await unhideAll(page);

/* ── the noise's own magnitude, and where it lives ─────────────────────────────────────────────────── */
const a1 = await captureLuminance(cdp, clip, N), a2 = await captureLuminance(cdp, clip, N);
const noisyDeltas = [];
let noisyInside = 0, noisyOutside = 0;
for (let i = 0; i < N; i += 1) if (a1[i] !== a2[i]) { noisyDeltas.push(Math.abs(a1[i] - a2[i])); if (disc[i]) noisyInside += 1; else noisyOutside += 1; }

/* ── the fix, measured: unanimity over repeated derivations, with the undecided population reported ── */
const stable = await classMasksStable(page, cdp, clip, N, CLASSES, { threshold: THRESHOLD, repeats: 3 });

/* ── what the undecided pixels actually AFFECT, because a share without its denominator cannot be audited ──
   The classes are used two ways and only two: glowsAll POSITIVELY (it builds the glow populations) and the
   UNION as an EXCLUSION from the medium. An undecided fraction of 50 % on a 2498-pixel class is alarming on
   its face and may still be irrelevant to every figure taken — or not. This measures which. */
const decidedUnion = new Uint8Array(N), undecidedUnion = new Uint8Array(N);
for (const cls of CLASSES) { for (const i of stable.masks[cls]) decidedUnion[i] = 1; for (const i of stable.undecidedIx[cls]) undecidedUnion[i] = 1; }
let mediumDecided = 0, mediumAtRisk = 0;
for (let i = 0; i < N; i += 1) if (disc[i] && !decidedUnion[i]) { if (undecidedUnion[i]) mediumAtRisk += 1; else mediumDecided += 1; }
const glowUndecidedInsideDisc = stable.undecidedIx.glowsAll.filter(i => disc[i]).length;
await ctx.close(); await browser.close();

const ctlPrev = noHide.map(r => r.vsPrevious), hidePrev = afterHide.map(r => r.vsPrevious);
const ctlGrowth = noHide[noHide.length - 1].vsFirst, hideGrowth = afterHide[afterHide.length - 1].vsFirstAfterHide;
const settleExonerated = Math.max(...hidePrev) <= 2 * Math.max(...ctlPrev) && hideGrowth <= 2 * ctlGrowth;

const out = {
  reading: "GRÜN · §95 — classMasks's non-reproducibility: cause isolated, timing suspect exonerated, reproducible variant measured",
  verdict: PROVENANCE.verdict, provenance, instrument: PROVENANCE, guard,
  viewport: `${VW}x${VH}`, clipPixels: N, threshold: THRESHOLD,
  whyThisExists: "§94 observed plainGlow 50070 then 50067 across two runs of one page. GELB §91: either the mask becomes reproducible or every figure from that split carries the instability. PF-3's differential is pooled over it.",

  control_noStateChange: { what: "six captures of an unchanged page. THE LIMB THE FIRST DIAGNOSIS LACKED.", probes: noHide },
  afterOneHide: { what: "the same sequence after one hide(), compared against the control rather than against zero", fixedWaitInHide: "340 ms", probes: afterHide },
  settleVerdictOnMyOwnSuspect: {
    suspect: "the fixed 340 ms wait in hide() — an assumed settle rather than a checked condition",
    exonerated: settleExonerated,
    reading: settleExonerated
      ? `EXONERATED. Consecutive-capture differences after a hide (${hidePrev.join(", ")}) are the same order as with NO hide at all (${ctlPrev.join(", ")}), and the drift from the first capture is ${hideGrowth} after a hide against ${ctlGrowth} with no hide. The page is not failing to settle; the captures are noisy. My first diagnostic read a random walk as a process because it had no control.`
      : `NOT exonerated: differences after a hide exceed the no-change control, so the fixed wait is genuinely short.`,
    whyThisMatters: "a longer timeout would have looked like a fix for as long as nobody counted, and would have left the real cause — noise against a strict inequality — in place under a figure that appeared stable."
  },
  captureNoise: {
    pixelsDifferingBetweenTwoCapturesOfOneState: noisyDeltas.length,
    asPctOfClip: +(100 * noisyDeltas.length / N).toFixed(4),
    insideDisc: noisyInside, outsideDisc: noisyOutside,
    luminanceDeltaMagnitude: stats(noisyDeltas),
    correctionToWhatIToldGELB: `§94 reported captureChroma bit-exact across captures. That is true over the hue-carrying GLOW (47073 px, 0 differing) and FALSE over the clip (${noisyDeltas.length} of ${N}). I stated a property of one population as a property of the instrument — the same scope error I had just named in GELB's coverage denominator, in the same message.`
  },
  theRealCause: {
    mechanism: `membership is decided by a strict \`base - hidden > ${THRESHOLD}\`. ~${noisyDeltas.length} pixels per capture pair move by a noise delta whose p99 is ${stats(noisyDeltas).p99}, so every pixel whose true delta sits within that of the threshold flips between derivations.`,
    whyNoWaitFixesIt: "the noise is present with no state change, so it is not a settling artefact and cannot be waited out."
  },
  theFix_classMasksStable: {
    rule: "a pixel is IN only by UNANIMITY over repeated independent derivations; a pixel some derivations include and others do not is UNDECIDED and returned as a population, never pushed silently to one side.",
    repeats: 3, noiseFloorPixelsMeasuredInThatCall: stable.noiseFloorPixels, noiseFloorAsPctOfClip: stable.noiseFloorAsPctOfClip,
    perClass: stable.stability,
    whyUnanimityAndNotAveraging: "averaging K captures lowers the noise but keeps a strict inequality at the end, so it moves the knife edge instead of admitting that one exists. Unanimity makes the instrument state which pixels it cannot decide, which is the quantity a pooled differential needs.",
    whatTheUndecidedPixelsAffect: {
      why: "GELB §91's own rule, applied to this reading: a share without its denominator cannot be audited. Several classes have undecided fractions above 20 % of their decided sets, which is alarming on its face and says nothing until the affected population is named.",
      theOnlyTwoUsesInThisRecord: "glowsAll POSITIVELY, to build the glow populations; the UNION of all classes as an EXCLUSION from the medium.",
      glowsAll_undecided: null, glowsAll_undecidedInsideDisc: null, glowsAll_decided: null,
      medium_decided: null, medium_atRiskFromAnUndecidedClassPixel: null, medium_atRiskPct: null
    },
    classMasksLeftUnchanged: "every mask-derived figure already committed was taken with the original function; changing it would move committed numbers. It is documented as non-reproducible and new work uses the stable variant."
  },
  finding: null
};
const g = stable.stability.glowsAll;
const aff = out.theFix_classMasksStable.whatTheUndecidedPixelsAffect;
aff.glowsAll_undecided = g.undecided; aff.glowsAll_undecidedInsideDisc = glowUndecidedInsideDisc; aff.glowsAll_decided = g.decidedIn;
aff.medium_decided = mediumDecided; aff.medium_atRiskFromAnUndecidedClassPixel = mediumAtRisk;
aff.medium_atRiskPct = +(100 * mediumAtRisk / (mediumDecided + mediumAtRisk)).toFixed(4);
out.finding =
`CAUSE ISOLATED, AND MY SUSPECT WAS INNOCENT. I expected the fixed 340 ms wait in hide() to be short, and a first diagnostic agreed: captures after the wait diverged monotonically, 791 to 2542 pixels. The control I had not run — the same sequence with NO HIDE — produces the same magnitudes (${ctlPrev.join(", ")} between consecutive captures) and the same drift (${ctlGrowth} from the first). A monotonic series away from a fixed reference is what a random walk looks like; it is not evidence of a process.
THE CAUSE IS ${noisyDeltas.length} NOISY PIXELS OF ${N} (${(100 * noisyDeltas.length / N).toFixed(3)} %, ${noisyInside} inside the disc) MEETING A STRICT INEQUALITY. Membership is \`base - hidden > ${THRESHOLD}\` and the noise's p99 delta is ${stats(noisyDeltas).p99}, so pixels near the threshold flip between derivations. No wait removes it, which is why the wrong diagnosis was dangerous rather than merely wrong.
THE FIX IS MEASURED, NOT ASSERTED: classMasksStable decides by unanimity over 3 derivations and reports what it cannot decide. For glowsAll that is ${g.decidedIn} decided IN and ${g.undecided} UNDECIDED (${g.undecidedAsPctOfDecided} % of the decided set). That undecided count is the quantity PF-3's pooled differential needs and the quantity the old function never produced.
AND IT CORRECTS ME: §94's "captureChroma is bit-exact" holds over the hue glow (0 of 47073) and NOT over the clip (${noisyDeltas.length} of ${N}). A property of one population stated as a property of the instrument — the scope error I named in GELB's lane in the same message I made it in mine.
AND THE ALARMING PERCENTAGES NEED THEIR DENOMINATORS, which is GELB's own §91 rule turned on this reading. bodyNames is ${stable.stability.bodyNames.undecidedAsPctOfDecided} % undecided and arcs ${stable.stability.arcs.undecidedAsPctOfDecided} %, and travel is ${stable.stability.travel.decidedIn} pixel(s) decided against ${stable.stability.travel.undecided} undecided — a mask of nothing, because the travelling light does not render under reducedMotion:reduce. (Those three numerals were TYPED from a previous run when I first wrote this sentence, which is A-G396's own defect class committed in the act of reporting it; they are interpolated now, and the fact that they moved between runs is itself the finding about thin-stroke classes.) But these classes are used in exactly two ways here: glowsAll POSITIVELY (${g.decidedIn} decided, ${g.undecided} undecided, ${glowUndecidedInsideDisc} of them inside the disc) and the UNION as an EXCLUSION from the medium (${mediumDecided} decided medium pixels, ${mediumAtRisk} at risk from an undecided class pixel = ${(100 * mediumAtRisk / (mediumDecided + mediumAtRisk)).toFixed(4)} %). So the thin-stroke and text classes are unstable where they are thinnest and that instability reaches the figures this record actually states at well under one per cent. Both halves belong in the sentence: the masks ARE bad, and the figures taken from them are not.
NO VERDICT (A-G36 point 2).`;

writeFileSync(resolve(OUT, "mask-determinism.json"), JSON.stringify(out, null, 1));
console.log(`control (no hide), consecutive: ${ctlPrev.join(", ")}  drift from first: ${ctlGrowth}`);
console.log(`after hide,        consecutive: ${hidePrev.join(", ")}  drift from first: ${hideGrowth}`);
console.log(`settle suspect exonerated: ${settleExonerated}`);
console.log(`capture noise: ${noisyDeltas.length} of ${N} px (${(100 * noisyDeltas.length / N).toFixed(3)} %) · inside disc ${noisyInside} · outside ${noisyOutside}`);
console.log(`classMasksStable noise floor in-call: ${stable.noiseFloorPixels} px`);
for (const [c, v] of Object.entries(stable.stability)) console.log(`   ${c.padEnd(13)} decided ${String(v.decidedIn).padStart(7)}  undecided ${String(v.undecided).padStart(6)}  (${v.undecidedAsPctOfDecided} % of decided)`);
console.log(`\n${out.finding}`);
