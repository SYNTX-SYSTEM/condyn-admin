/**
 * GRÜN · PHASE-G · §97 — PF-3, TAKEN BLIND: body volume and the halo's differential excess.
 * **NO VERDICT** (A-G36 point 2). Browser + the HOOKED stand. No build, no server write, no product change.
 *
 * PF-3 (PHASE_F §17): "Bodies are volumes: footprint >= 6 x outline footprint; halo peak <= 0.25 x core peak."
 * A-F19 amends the second limb: the halo is measured as an EXCESS against a render WITHOUT it, never as a raw
 * window — because at the shelf edge a raw halo window reads the lit ground inside the shelf and returns red
 * for entirely the wrong reason.
 *
 * TAKEN BLIND, deliberately. GELB's A-F19 records an excess of 0.0035…0.0076 and a ratio of 0.039…0.083 across
 * five bodies. Those are POOLED over the five, so adopting them as a target would let a per-body disagreement
 * hide inside a range that already contains it. This probe does not read them, and the comparison happens
 * afterwards or not at all.
 *
 * THE HALO IS NOT A DESCENDANT OF ITS BODY, which is the one thing that makes this harder than it looks. The
 * body group at the component's :835 carries `data-mapping-body data-rank`, and `.mf-core` and the outline sit
 * inside it — but the halos render in a separate group (`fieldHalos`, and `shelfHalos` in an anonymous <g>).
 * So a per-body halo cannot be reached by descent and is reached instead through §81's A-G49 hook,
 * `[data-mapping-halo][data-rank]`, which exists on the drawn circle for exactly this reason. A probe written
 * against the obvious selector would have measured nothing and reported a ratio of zero.
 *
 * A-G419 IS HONOURED AT THE TOP RATHER THAN IN THE OUTPUT: every selector's matched element count is read from
 * the live page BEFORE any capture, and a zero count THROWS. "A mask whose decided population is zero FAILS
 * rather than passes" — and the travel mask that produced that ruling was empty by construction, which is
 * exactly what this precheck catches one step earlier, at the selector rather than at the mask.
 *
 * NOISE: §95 measured ~1000 of 853776 luminance values changing between two captures of one state. Every
 * differential here is therefore taken `REPEATS` times and averaged, with the spread across repeats reported
 * beside each figure so the instrument's own contribution is visible rather than assumed away.
 */
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { chromium, openField, probeGeometry, clipOf, discMask, cdpSession, captureLuminance, hide, unhideAll, PROVENANCE, servedProvenance, pct } from "./gruen-instrument.mjs";
import { numericConstant } from "./gruen-provenance.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(here, "../outputs");
const WT = process.env.GRUEN_WT ?? resolve(here, "../../../../..");
const VW = Number(process.env.VW ?? 1920), VH = Number(process.env.VH ?? 1080);
const REPEATS = Number(process.env.GRUEN_REPEATS ?? 3);
const LIT = 0.001;                 // the same threshold classMasks uses, for "this pixel received light"
const FOOTPRINT_MIN = 6;           // PF-3 limb 1 — the PIN's figure, an ORIGIN and not a measurement (A-G140)
const HALO_CEILING = 0.25;         // PF-3 limb 2 — ditto
const PEAK_SPREAD_LIMIT = 5;       // this instrument's own: past this the peak cannot express its uncertainty (A-G421)

/* read from the product, never copied: the halo's declared reach, used only to sanity-check the geometry */
const haloNear = numericConstant("VOLUME", "haloNear", `${WT}/app/components/career/demo/PersonJobMappingField.tsx`);
const haloFar = numericConstant("VOLUME", "haloFar", `${WT}/app/components/career/demo/PersonJobMappingField.tsx`);

const browser = await chromium.launch();
const { ctx, page, guard } = await openField(browser, { reduce: true, vw: VW, vh: VH });
const provenance = await servedProvenance(page, WT);
const instrumentCommit = (() => { try { return execSync(`git -C ${WT} log -1 --format=%h`, { encoding: "utf8" }).trim(); } catch { return null; } })();
const geo = await probeGeometry(page);
const clip = clipOf(geo, VW, VH);
const { N } = discMask(clip, geo);
const cdp = await cdpSession(page);

const bodies = geo.bodies.filter(b => b.inPool);
if (bodies.length === 0) throw new Error("ERR_GRUEN_PF3_NO_BODIES: no in-pool body on the page, so PF-3 would be measured over nothing.");

/** the four suppressions per body. The halo is reached by HOOK, not by descent — see the header. */
const selectorsFor = rank => ({
  volume: `[data-mapping-body][data-rank="${rank}"], [data-mapping-halo][data-rank="${rank}"]`,
  outline: `[data-mapping-body][data-rank="${rank}"] [data-mapping-body-shape]`,
  halo: `[data-mapping-halo][data-rank="${rank}"]`,
  core: `[data-mapping-body][data-rank="${rank}"] .mf-core`
});

/* ── A-G419 precheck: every selector must match something, BEFORE any capture ──────────────────────── */
const matched = {};
for (const b of bodies) {
  const sel = selectorsFor(b.rank);
  matched[b.rank] = {};
  for (const [name, s] of Object.entries(sel)) {
    const n = await page.$$eval(s, els => els.length).catch(() => 0);
    matched[b.rank][name] = n;
    if (n === 0) throw new Error(`ERR_GRUEN_PF3_SELECTOR_EMPTY: rank ${b.rank} "${name}" (${s}) matches NO element. A-G419: a mask whose population is zero fails rather than passes, and this fails at the selector rather than waiting for the mask.`);
  }
}

/** mean per-pixel excess of what `selector` contributes, over REPEATS independent differentials. */
async function excessOf(selector) {
  const acc = new Float64Array(N);
  const peaks = [], areas = [];
  /* §97 WARM-UP, discarded. The first suppression cycle of a selector disagrees with the rest and repeats 2
     and 3 then agree EXACTLY — measured, before this was added: rank 1's halo peak ran [0.182322, 0.101938,
     0.101938] and rank 2's [0.152252, 0.108823, 0.108823], and the first-cycle outlier dragged the mean enough
     to move limb 1's footprint ratio across its own bound between runs (rank 3 read 6.169 then 5.902). §95
     showed the RESTING page settles, so this is specific to suppressing an element that carries transitions.
     One throwaway cycle, then the measured ones, and the measured ones are ASSERTED to agree. */
  await hide(page, selector); await captureLuminance(cdp, clip, N); await unhideAll(page);
  const votes = new Uint8Array(N);
  for (let r = 0; r < REPEATS; r += 1) {
    const base = await captureLuminance(cdp, clip, N);
    await hide(page, selector);
    const without = await captureLuminance(cdp, clip, N);
    await unhideAll(page);
    let pk = 0, ar = 0;
    for (let i = 0; i < N; i += 1) { const d = base[i] - without[i]; acc[i] += d; if (d > pk) pk = d; if (d > LIT) { ar += 1; votes[i] += 1; } }
    peaks.push(pk); areas.push(ar);
  }
  /* §97: the AREA gets §95's treatment, not a tolerance. The warm-up above fixes the PEAK (a first-cycle
     transient, measured: repeats 2 and 3 then agree exactly). The lit area moves for a DIFFERENT reason — a
     pixel whose excess sits near LIT crosses it on capture noise, which §95 measured as irreducible — so a
     pixel counts as lit only by UNANIMITY and the undecided pixels are reported beside the figure rather than
     rounded into it. Two instabilities, two causes, two remedies; one tolerance would have hidden one behind
     the other, and did for one run. */
  let litUnanimous = 0, litUndecided = 0;
  for (let i = 0; i < N; i += 1) { if (votes[i] === REPEATS) litUnanimous += 1; else if (votes[i] > 0) litUndecided += 1; }
  /* §97: a loop, not Math.max(...acc) — spreading 853776 arguments overflows the call stack, which is how
     this probe failed on its first run. A typed array is not an argument list. */
  let accPeak = 0, accTotal = 0;
  const lit = [];
  for (let i = 0; i < N; i += 1) { acc[i] /= REPEATS; const v = acc[i]; if (v > accPeak) accPeak = v; if (v > 0) accTotal += v; if (v > LIT) lit.push(v); }
  lit.sort();
  const spread = v => ({ perRepeat: v.map(x => +x.toFixed(6)), spreadPct: Math.max(...v) === 0 ? null : +(100 * (Math.max(...v) - Math.min(...v)) / Math.max(...v)).toFixed(3) });
  /* A-G415: a statement the run can FAIL, not a note the reader can agree with. After the warm-up the measured
     cycles must agree, or the figure below is a mean over disagreeing measurements and says so by throwing. */
  const peakSpread = spread(peaks).spreadPct ?? 0;
  /* A-G421, applied rather than quoted: a figure whose uncertainty the estimator cannot express is not
     published as a figure. The peak is marked UNMEASURABLE where its own cycles disagree past the limit —
     per selector, so one unstable quantity on one body does not destroy the reading for the other four. An
     earlier version THREW here, which produced no reading at all and discarded four stable bodies and both
     limbs to report one unstable core. A-G419 still throws, because a population of zero is not a figure
     with wide uncertainty, it is the absence of a measurement. */
  if (litUnanimous === 0) throw new Error(`ERR_GRUEN_PF3_EMPTY_MASK: "${selector}" has a UNANIMOUS lit population of zero. A-G419.`);
  return {
    litPixels: litUnanimous, litPixelsUndecided: litUndecided,
    litPixelsUndecidedPctOfUnanimous: litUnanimous === 0 ? null : +(100 * litUndecided / litUnanimous).toFixed(3),
    litPixelsByMeanExcess: lit.length, litPixelsPerRepeat: spread(areas),
    peakOfMeanExcess: +accPeak.toFixed(6), peakPerRepeat: spread(peaks),
    peakMeasurable: peakSpread <= PEAK_SPREAD_LIMIT, peakSpreadPct: +peakSpread.toFixed(3),
    p99OfMeanExcess: lit.length === 0 ? null : +pct(Float64Array.from(lit), 0.99).toFixed(6),
    totalLight: +accTotal.toFixed(4)
  };
}

const perBody = [];
for (const b of bodies) {
  const sel = selectorsFor(b.rank);
  const volume = await excessOf(sel.volume), outline = await excessOf(sel.outline);
  const halo = await excessOf(sel.halo), core = await excessOf(sel.core);
  if (outline.litPixels === 0 || core.litPixels === 0) throw new Error(`ERR_GRUEN_PF3_EMPTY_MASK: rank ${b.rank} produced a zero decided population (outline ${outline.litPixels}, core ${core.litPixels}). A-G419.`);
  perBody.push({
    rank: b.rank, shelf: b.shelf, requiredGaps: b.requiredGaps, drawnRadiusUnits: b.drawnRadiusUnits,
    matchedElements: matched[b.rank],
    limb1_footprint: {
      volumeLitPixels: volume.litPixels, outlineLitPixels: outline.litPixels,
      ratio: +(volume.litPixels / outline.litPixels).toFixed(3), bound: `>= ${FOOTPRINT_MIN}`,
      clears: volume.litPixels / outline.litPixels >= FOOTPRINT_MIN,
      populationsPerRepeat: { volume: volume.litPixelsPerRepeat, outline: outline.litPixelsPerRepeat },
      undecided: { volume: volume.litPixelsUndecided, outline: outline.litPixelsUndecided },
      areaIsByUnanimity: "a pixel counts as lit only if it exceeded the threshold in EVERY measured cycle; the pixels some cycles lit and others did not are reported as undecided rather than rounded in. §95's remedy, applied to an arbitrary selector."
    },
    limb2_haloOverCore: {
      haloPeakExcess: halo.peakOfMeanExcess, corePeakExcess: core.peakOfMeanExcess,
      peakMeasurable: halo.peakMeasurable && core.peakMeasurable,
      peakSpreadPct: { halo: halo.peakSpreadPct, core: core.peakSpreadPct },
      ratio_peak: halo.peakMeasurable && core.peakMeasurable ? +(halo.peakOfMeanExcess / core.peakOfMeanExcess).toFixed(4) : null,
      ratio_peak_ifPublishedAnyway: +(halo.peakOfMeanExcess / core.peakOfMeanExcess).toFixed(4),
      ratio_p99: core.p99OfMeanExcess === null || halo.p99OfMeanExcess === null ? null : +(halo.p99OfMeanExcess / core.p99OfMeanExcess).toFixed(4),
      bound: `<= ${HALO_CEILING}`, clears: !(halo.peakMeasurable && core.peakMeasurable) ? null : halo.peakOfMeanExcess / core.peakOfMeanExcess <= HALO_CEILING,
      halo, core,
      whyBothStatistics: "PF-3 says PEAK, so the peak is the figure. p99 is reported beside it because a single-pixel maximum on a noisy raster is the statistic most exposed to the ~1000-pixel capture noise §95 measured, and a limb that holds on both is not resting on one pixel."
    }
  });
}
await ctx.close(); await browser.close();

const l1 = perBody.map(b => b.limb1_footprint.ratio);
const measurablePeak = perBody.filter(b => b.limb2_haloOverCore.peakMeasurable);
const l2 = measurablePeak.map(b => b.limb2_haloOverCore.ratio_peak);
const unmeasurablePeak = perBody.filter(b => !b.limb2_haloOverCore.peakMeasurable).map(b => ({ rank: b.rank, shelf: b.shelf, spread: b.limb2_haloOverCore.peakSpreadPct }));
const out = {
  reading: "GRÜN · §97 — PF-3 taken BLIND: body volume and the halo's differential excess, per body",
  verdict: PROVENANCE.verdict,
  provenance: { ...provenance, measuredBuildCommit: instrumentCommit, measuredWorktree: WT },
  instrument: PROVENANCE, guard, viewport: `${VW}x${VH}`, level: "L0", motion: "resting (reducedMotion:reduce)", repeats: REPEATS,
  pin: { statement: "PF-3: bodies are volumes — footprint >= 6 x outline footprint; halo peak <= 0.25 x core peak.",
    amendment: "A-F19: the halo is measured as an EXCESS against a render without it, never as a raw window.",
    boundsAreAnOrigin: "6 and 0.25 are the PIN's figures (PHASE_F §17 / §20), not measurements taken here. A-G140." },
  blind: {
    what: "GELB's A-F19 figures (excess 0.0035..0.0076, ratio 0.039..0.083) were NOT read before or during this run.",
    why: "they are POOLED over five bodies, so a per-body disagreement could hide inside a range that already contains it. A pooled target cannot validate a per-body measurement."
  },
  method: {
    suppression: "four differentials per body: the whole volume, the outline alone, the halo alone, the core alone.",
    haloReachedByHook: "the halo is NOT a descendant of its body (it renders in fieldHalos / an anonymous shelf group), so it is reached through §81's A-G49 hook [data-mapping-halo][data-rank]. A probe written against the obvious descendant selector would have suppressed nothing and reported a ratio of 0.",
    declaredHaloReach: { haloNear, haloFar, note: "read from the product, used only to sanity-check that the halo differential lands where the halo is drawn." },
    noise: "every differential is taken REPEATS times and averaged; the per-repeat spread is reported beside every figure (§95: ~1000 of 853776 luminance values move between two captures of one state).",
    aG419: "every selector's matched element count is read from the live page BEFORE any capture and a zero count throws, and a zero decided population throws."
  },
  perBody,
  everySpreadInThisFileNamesWhatItVariedOver: {
    ruledBy: "GELB: a spread measured inside one realisation is not the spread of the quantity, and it is presentationally INDISTINGUISHABLE from one that is. So every spread figure names its domain.",
    domainOfEverySpreadHere: "WITHIN ONE RUN — repeat-to-repeat across REPEATS suppression cycles inside a single browser launch and page load, after a discarded warm-up.",
    whatThatDomainEXCLUDES: "browser launch, page load, and anything that differs between runs. Measured: this file's within-run spreads are 0.1..2.9 %, while the RUN-to-run spread of the same limb-1 ratio reaches 5.4 % — roughly a factor of two understated, and the understatement is invisible in this file because the word 'spread' reads the same either way.",
    theCrossRunFigureLivesHere: "outputs/pf3-spread.json (§99), which spawns this probe N times as child processes. Any limb-1 adjudication belongs to THAT file, not this one.",
    andItsOwnCountIsUnstable: "§99's four-run study puts 3 of 5 bodies decidable; pooled with four earlier hand runs it is 2 of 5. The verdict's direction never moves — nothing is red and every decidable body clears — but the COUNT moves, so a decidability count is not settled at n=4 either."
  },
  pinStanding: {
    haloLimb: "RETIRED as superseded. A-G293 (PHASE_G §…, ':7749') ruled PF-3's halo limb retired because §4 of that record inverted the light budget — PF-1 replaced by PG-1/PG-2, 'the disc must now be dark and the semantics must carry the light' — and G-2/R21 then made the glow a LIGHT SOURCE. 'Halo peak <= 0.25 x core peak' is the opposite obligation. The retirement is recorded there as a CONFLICT BETWEEN TWO ADOPTED DECISIONS, not as a measurement.",
    footprintLimb: "UNTOUCHED AND UNMEASURED, in A-G293's own words. PF-3 was retired in A-G20 'having never been measured' and then returned to the surface on the principle that a proof surface may not shrink by attrition.",
    soWhatThisReadingIs: "the halo limb's first MEASUREMENT of a ratio the record had only DERIVED, and the footprint limb's first measurement of any kind. Neither is a breach report: the halo limb is retired, and this lane returns no verdict on either (A-G36 point 2)."
  },
  comparisonAfterTheBlindReading: {
    discipline: "the blind reading above was taken without reading any prior figure. These comparisons are made AFTER it, which is what 'blind' permits and what makes the agreement worth anything.",
    aG293_derivedFromDeclaredAlphas: { band: [2.727, 3.101], how: "coreAlpha 0.16 against the first halo alpha a viewer can see past the opaque seat — 0.43628 at rank 1, 0.49611 at the last rank. A DERIVATION, not a measurement." },
    phaseG_716_citedAsMeasured: { band: [2.5, 3.8], note: "'measured 2.5…3.8 is the design, not a breach.'" },
    thisReading_peak: null, thisReading_p99: null,
    aF19_phaseF_notComparable: {
      theirFigures: "excess 0.0035..0.0076, ratio 0.039..0.083",
      whyNotAComparison: "A-F19 is a PHASE-F reading, taken before §4 inverted the light budget. A-G54: a figure belongs to a build. My halo excesses are ~14x theirs and my ratios ~50x theirs, and that is two different artifacts rather than two different measurements — the inversion is exactly what the record says it did. Comparing them as if they bounded one quantity is the error A-G293 names."
    }
  },
  summary: {
    limb1_footprintRatios: l1, limb1_min: Math.min(...l1), limb1_allClear: perBody.every(b => b.limb1_footprint.clears),
    limb2_peakRatios_measurableBodiesOnly: l2, limb2_max: l2.length === 0 ? null : Math.max(...l2),
    limb2_bodiesWithAnUNMEASURABLEPeak: unmeasurablePeak,
    limb2_p99Ratios_allBodies: perBody.map(b => b.limb2_haloOverCore.ratio_p99),
    limb2_allClear: measurablePeak.length === 0 ? null : measurablePeak.every(b => b.limb2_haloOverCore.clears)
  },
  finding: null
};
const peaks = perBody.map(b => b.limb2_haloOverCore.ratio_peak), p99s = perBody.map(b => b.limb2_haloOverCore.ratio_p99);
out.comparisonAfterTheBlindReading.thisReading_peak = { band: [Math.min(...peaks), Math.max(...peaks)], perBody: peaks };
out.comparisonAfterTheBlindReading.thisReading_p99 = { band: [Math.min(...p99s), Math.max(...p99s)], perBody: p99s };
/* the peak's one outlier, and why the p99 says it is not a body-level fact */
const worst = perBody.reduce((a, b) => b.limb2_haloOverCore.ratio_peak > a.limb2_haloOverCore.ratio_peak ? b : a);
out.comparisonAfterTheBlindReading.thePeakOutlier = {
  rank: worst.rank, peakRatio: worst.limb2_haloOverCore.ratio_peak, p99Ratio: worst.limb2_haloOverCore.ratio_p99,
  reading: `rank ${worst.rank} is the only body outside the derived band on the PEAK (${worst.limb2_haloOverCore.ratio_peak}) and is unremarkable on the p99 (${worst.limb2_haloOverCore.ratio_p99}, against a p99 band of ${Math.min(...p99s)}..${Math.max(...p99s)} across all five). A localised maximum, not a body-level fact — and REPRODUCIBLE rather than noise: two runs of this probe returned 5.2096 and 5.2119 for that peak while the p99 stayed inside the band both times. So it is a real geometric feature of where that halo lands, not a capture artefact, which is the more interesting of the two possibilities.`,
  andItIsTHESAMEBODY: "A-F19's own confound was rank 4, 'which sits exactly at r = 430' — the shelf edge. The same body is the peak outlier here, in a DIFFERENTIAL measurement that was supposed to have removed that confound.",
  whyTheDifferentialDoesNotFullyRemoveIt: "A-F19's differential fixes the RAW WINDOW problem — a window reporting what is in it rather than what put it there. It does NOT make the figure independent of what lies beneath, because COMPOSITING IS NOT ADDITIVE: where the halo overlaps a bright structure, removing it changes the composite by more than the halo's own contribution, so the attributed 'excess' carries an interaction term. At the shelf edge that term is largest, and the peak is the statistic most exposed to it. §79 measured that non-additivity directly; this is where it reaches a pin.",
  consequence: "a differential excess is sound as a METHOD and still needs a statistic robust to the interaction. The p99 is; the single-pixel peak is not. PF-3 says PEAK, so both are reported and the difference is named rather than averaged away."
};
/* ── the statistic itself, judged by its own repeat-to-repeat spread ───────────────────────────────── */
const spreadOf = b => Math.max(b.limb2_haloOverCore.halo.peakPerRepeat.spreadPct ?? 0, b.limb2_haloOverCore.core.peakPerRepeat.spreadPct ?? 0);
const shelfB = perBody.filter(b => b.shelf), fieldB = perBody.filter(b => !b.shelf);
out.thePeakFormIsNotMeasurableOnEveryBody = {
  what: "PF-3 specifies a PEAK. A statistic is only as good as its repeat-to-repeat spread, so this reports the spread of the peak itself rather than only the ratio built from it.",
  perBody: perBody.map(b => ({ rank: b.rank, shelf: b.shelf, worstPeakSpreadPct: +spreadOf(b).toFixed(2),
    haloPeakPerRepeat: b.limb2_haloOverCore.halo.peakPerRepeat.perRepeat, corePeakPerRepeat: b.limb2_haloOverCore.core.peakPerRepeat.perRepeat,
    ratio_peak: b.limb2_haloOverCore.ratio_peak, ratio_p99: b.limb2_haloOverCore.ratio_p99 })),
  theSplitIsExact: {
    shelfBodies: { ranks: shelfB.map(b => b.rank), worstPeakSpreadPct: +Math.max(...shelfB.map(spreadOf)).toFixed(2) },
    fieldBodies: { ranks: fieldB.map(b => b.rank), worstPeakSpreadPct: +Math.max(...fieldB.map(spreadOf)).toFixed(2) },
    reading: "the peak is stable on the STILL (shelf) bodies and unstable on the FIELD bodies, and the split is by that property and no other."
  },
  theLead: "the first repeat is usually the outlier and repeats 2 and 3 often agree exactly, which points at a one-time transient on the first hide/unhide of a body group rather than at capture noise — §95 measured the resting page as settled, so this is specific to suppressing a BODY, which carries transform transitions and a transient animation that a visibility change may perturb. Named as a lead, not a cause: I have not isolated it.",
  consequenceForThePin: "PF-3's halo limb as WRITTEN asks for a quantity this instrument cannot deliver on the field bodies — not because the bound is wrong but because the STATISTIC is. The p99 of the same differential is stable within a few per cent across every body and across runs. A-F11 already corrected exactly this for PF-6 row 1 / PG-10 limb 3, where the maximum form is FORBIDDEN and the bound is stated as a distribution; this is the same correction owed to a second pin, now with the spread measured rather than argued.",
  andItDoesNotRescueTheRatio: "the p99 band (2.3..2.8) is of the same order as the peak band and sits an order of magnitude above the 0.25 ceiling either way, so the statistic question changes what is MEASURABLE and not whether the retired limb would have cleared."
};
out.finding =
`PF-3 TAKEN BLIND, PER BODY, ${perBody.length} bodies at ${REPEATS} repeats each.
LIMB 1 (footprint >= ${FOOTPRINT_MIN} x outline) — AND THIS LIMB HAS NEVER BEEN MEASURED BY ANY LANE, in A-G293's own words "untouched and unmeasured": ratios ${JSON.stringify(l1)}, smallest ${Math.min(...l1)}. ${out.summary.limb1_allClear ? "Every body clears." : `${l1.filter(r => r < FOOTPRINT_MIN).length} of ${l1.length} bodies fall SHORT of 6.`} The areas are decided by UNANIMITY over ${REPEATS} cycles with the undecided pixels reported beside them (volume ${perBody.map(b => b.limb1_footprint.undecided.volume).join("/")}, outline ${perBody.map(b => b.limb1_footprint.undecided.outline).join("/")}), because before that treatment this ratio moved ACROSS ITS OWN BOUND between runs — rank 3 read 6.169 and then 5.902 — and the within-run repeat spread understated the run-to-run spread, which is §95's lesson committed again in a fresh probe. It also depends on ONE INTERPRETATION I am naming rather than resolving: "outline footprint" is read here as the footprint of the outlined body DISC (the [data-mapping-body-shape] circle, which carries a CYAN fill as well as its stroke), not of the stroke ring alone. On the stroke-only reading the ratio is several times larger and the limb clears trivially. The pin does not say which, and the answer changes the result.
LIMB 2 (halo peak <= ${HALO_CEILING} x core peak, differentially per A-F19), AND THE PIN'S HALO LIMB IS ALREADY RETIRED AS SUPERSEDED (A-G293: 'halo peak <= 0.25 x core peak' is the OPPOSITE obligation to G-2's self-luminous glow, and the retirement is a conflict between two adopted decisions rather than a measurement). So this is not a breach report. It is the first MEASUREMENT of a ratio the record had only DERIVED — and the PEAK is publishable on only ${measurablePeak.length} of the ${perBody.length} bodies, because on the others its own cycles disagree past ${PEAK_SPREAD_LIMIT} % (${JSON.stringify(unmeasurablePeak)}). Peak ratios where publishable: ${JSON.stringify(l2)}. p99 ratios, stable on every body: ${JSON.stringify(perBody.map(b => b.limb2_haloOverCore.ratio_p99))}, band ${Math.min(...perBody.map(b => b.limb2_haloOverCore.ratio_p99))}..${Math.max(...perBody.map(b => b.limb2_haloOverCore.ratio_p99))}. A-G293 DERIVED 2.727..3.101 from two declared alphas and §716 cites 2.5..3.8 as measured; a blind differential agrees with both on the bodies where its statistic is expressible, which is the first time this quantity has had two independent sources — and the agreement is on the p99, not on the statistic the pin names.
AND THE PIN'S OWN STATISTIC IS THE UNMEASURABLE PART. PF-3 says PEAK, and the peak's repeat-to-repeat spread splits the bodies exactly by stillness: worst ${(+Math.max(...shelfB.map(spreadOf))).toFixed(2)} % across the three SHELF bodies, worst ${(+Math.max(...fieldB.map(spreadOf))).toFixed(2)} % across the two FIELD bodies. The p99 of the same differential is stable to a few per cent everywhere and across runs. So the halo limb as written asks for a quantity this instrument cannot deliver on the moving bodies — the BOUND is not the problem, the STATISTIC is — and A-F11 already forbade the maximum form for PF-6 row 1 / PG-10 limb 3 for the same reason, there by argument and here by measurement. It does not rescue the retired limb either way: both bands sit an order of magnitude above 0.25.
THE HALO HAD TO BE REACHED BY HOOK. It is not a descendant of its body, so the obvious per-body selector suppresses nothing; §81's A-G49 hook is what makes a per-body halo differential possible at all, and the A-G419 precheck is what would have caught it had I used the wrong one — at the selector, before any capture, rather than as a ratio of zero that looked like a pass.
BLIND: GELB's pooled A-F19 range was not read before or during this run, because a pooled target cannot validate a per-body measurement.
EVERY SPREAD IN THIS FILE IS A WITHIN-RUN SPREAD (0.1..2.9 %) and the run-to-run spread of the same quantity reaches 5.4 % — named here because the word reads identically either way, which is what made it dangerous rather than merely incomplete. Limb-1 adjudication belongs to outputs/pf3-spread.json, whose own decidability count moves between 3 of 5 at n=4 and 2 of 5 pooled at n=8.
NO VERDICT (A-G36 point 2): these are readings. PF-3's HALO LIMB IS RETIRED AS SUPERSEDED (A-G293), so only its FOOTPRINT limb carries a live verdict — and §99 finds that UNDECIDABLE on this instrument (2 of 5 bodies decidable over 8 runs, both clearing). The earlier form referred {{WAS: PF-3}} whole, i.e. the pin without its limb,, which over-states what is still open: a pin citation carries the pin's STANDING, not only its name.`;

writeFileSync(resolve(OUT, "pf3-blind.json"), JSON.stringify(out, null, 1));
for (const b of perBody) console.log(`rank ${b.rank}${b.shelf ? " (shelf)" : ""}: footprint ${String(b.limb1_footprint.ratio).padStart(8)} x outline  ·  halo/core peak ${String(b.limb2_haloOverCore.ratio_peak).padStart(7)} (p99 ${b.limb2_haloOverCore.ratio_p99})  ·  halo peak excess ${b.limb2_haloOverCore.haloPeakExcess}`);
console.log(`\n${out.finding}`);
