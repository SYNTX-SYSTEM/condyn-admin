/**
 * GRÜN · PHASE-G · §102 — THE HALO'S CHROMA SHARE, which turns §94's requirement from a lower bound into a figure.
 * **NO VERDICT** (A-G36 point 2). Browser + the HOOKED stand. No build, no server write, no product change.
 *
 * WHAT §94 ASSUMED AND SHOULD NOT HAVE. §94 derived the chroma a pixel needs to time the breath to a relative
 * precision p: c >= 2q / (p * relSwing), with relSwing read from the stylesheet. It used the pixel's TOTAL
 * chroma as c. But the breath modulates the HALO's contribution, not the pixel's whole chroma — the medium,
 * the ground wave and anything else under that pixel contribute chroma the halo's swing does not move. So the
 * honest form is
 *
 *     c_total >= 2q / (p * relSwing * share),        share = the halo's own chroma contribution / c_total
 *
 * and §94's 75.1 and 214.6 are therefore a LOWER BOUND on the requirement, not the requirement. GELB ruled
 * that this measurement can only move the unselected limb toward DECIDED and never away, because share <= 1
 * makes the requirement larger and the gap wider. That is exactly why it must still be taken: a lower bound
 * stated as a figure is what A-G140 exists to stop, and "it can only help my conclusion" is the worst possible
 * reason to leave a number unmeasured.
 *
 * THE SHARE IS A DIFFERENTIAL, NOT A DECOMPOSITION. C* is not additive over layers, so (C_all - C_without)/C_all
 * is not "the halo's share of the chroma" in any algebraic sense — it is the chroma the halo CONTRIBUTES at that
 * pixel, measured as A-F19 requires: an excess against a render without it, never a raw window. Stated here
 * because a ratio of two measured quantities invites being read as a partition, and this one is not.
 *
 * SPREAD DOMAIN (GELB's ruling): every spread in this file is WITHIN ONE RUN — repeat-to-repeat across
 * suppression cycles in a single browser launch, after a discarded warm-up. The run-to-run domain is not
 * sampled here, and §99 measured that the two differ by roughly a factor of two on a comparable quantity.
 */
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import {
  chromium, openField, probeGeometry, clipOf, discMask, cdpSession, captureChroma, labOf, hide, unhideAll,
  classMasks, CLASS_SELECTOR, PROVENANCE, servedProvenance, pct
} from "./gruen-instrument.mjs";
import { numericConstant } from "./gruen-provenance.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(here, "../outputs");
const WT = process.env.GRUEN_WT ?? resolve(here, "../../../../..");
const VW = Number(process.env.VW ?? 1920), VH = Number(process.env.VH ?? 1080);
const REPEATS = Number(process.env.GRUEN_REPEATS ?? 3);
const RUNG = 10;              // §94's, GELB's origin
const PRODUCT = `${WT}/app/components/career/demo/PersonJobMappingField.tsx`;
const haloDepth = numericConstant("WAVE", "haloDepth", PRODUCT);
const selectedGain = numericConstant("WAVE", "selectedGain", PRODUCT);
const haloMean = 1 - haloDepth / 2, haloAmp = haloDepth / 2;
const relSwing = gain => 2 * haloAmp * gain / haloMean;

const qCache = new Map();
function quantumAt(r, g, b) {                       // §94's: half an LSB per channel, SUMMED
  const key = (r << 16) | (g << 8) | b;
  const hit = qCache.get(key); if (hit !== undefined) return hit;
  const base = labOf(r, g, b).C, t = [r, g, b];
  let sum = 0;
  for (let ch = 0; ch < 3; ch += 1) {
    let worst = 0;
    for (const d of [1, -1]) { const u = [...t]; u[ch] = Math.max(0, Math.min(255, u[ch] + d)); if (u[ch] !== t[ch]) worst = Math.max(worst, Math.abs(labOf(...u).C - base)); }
    sum += worst;
  }
  const out = { c: base, q: 0.5 * sum };
  qCache.set(key, out); return out;
}

const browser = await chromium.launch();
const { ctx, page, guard } = await openField(browser, { reduce: true, vw: VW, vh: VH });
const provenance = await servedProvenance(page, WT);
const measuredBuildCommit = (() => { try { return execSync(`git -C ${WT} log -1 --format=%h`, { encoding: "utf8" }).trim(); } catch { return null; } })();
const geo = await probeGeometry(page);
const clip = clipOf(geo, VW, VH);
const { disc, N, W } = discMask(clip, geo);
const cdp = await cdpSession(page);
const k = geo.unitsToPx;

/* A-G419: the selector must match before anything is captured */
const haloCount = await page.$$eval(CLASS_SELECTOR.glowsAll, els => els.length).catch(() => 0);
if (haloCount === 0) throw new Error(`ERR_GRUEN_SHARE_NO_HALOS: "${CLASS_SELECTOR.glowsAll}" matches no element, so a halo differential would measure nothing and report a share of 0.`);

const { masks } = await classMasks(page, cdp, clip, N, ["glowsAll"]);
const isGlow = new Uint8Array(N); for (const i of masks.glowsAll) isGlow[i] = 1;
const gapBodies = geo.bodies.filter(b => b.inPool && b.requiredGaps > 0);
const inAnyHalo = (bodies, i) => { const x = i % W, y = (i - x) / W; return bodies.some(b => Math.hypot(x - (b.cx - clip.x), y - (b.cy - clip.y)) <= 3.0 * b.drawnRadiusUnits * k); };
const hueIx = []; for (let i = 0; i < N; i += 1) if (isGlow[i] && inAnyHalo(gapBodies, i)) hueIx.push(i);
if (hueIx.length === 0) throw new Error("ERR_GRUEN_SHARE_NO_HUE_POPULATION: no hue-carrying glow pixel, so there is nothing to take a share of.");

/* warm-up discarded (§97: the first suppression cycle of a selector disagrees with the rest) */
await hide(page, CLASS_SELECTOR.glowsAll); await captureChroma(cdp, clip, N); await unhideAll(page);

const shareAcc = new Float64Array(N), cAcc = new Float64Array(N);
const perCycleMedian = [];
for (let r = 0; r < REPEATS; r += 1) {
  const all = await captureChroma(cdp, clip, N);
  await hide(page, CLASS_SELECTOR.glowsAll);
  const without = await captureChroma(cdp, clip, N);
  await unhideAll(page);
  const cycle = [];
  for (const i of hueIx) {
    const cAll = all.C[i], contributed = cAll - without.C[i];
    shareAcc[i] += cAll <= 0 ? 0 : contributed / cAll;
    cAcc[i] += cAll;
    cycle.push(cAll <= 0 ? 0 : contributed / cAll);
  }
  cycle.sort((a, b) => a - b);
  perCycleMedian.push(+pct(Float64Array.from(cycle), 0.5).toFixed(5));
  if (r === REPEATS - 1) { for (const i of hueIx) { shareAcc[i] /= REPEATS; cAcc[i] /= REPEATS; } }
}
const lastAll = await captureChroma(cdp, clip, N);
await ctx.close(); await browser.close();

const stats = v => { const a = Float64Array.from(v); a.sort(); return a.length === 0 ? { n: 0 } : { n: a.length, min: +a[0].toFixed(5), p10: +pct(a, 0.10).toFixed(5), p50: +pct(a, 0.5).toFixed(5), p90: +pct(a, 0.9).toFixed(5), max: +a[a.length - 1].toFixed(5), mean: +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(5) }; };
const shares = [], ratios = [], required = [], requiredSel = [];
let meetsUnsel = 0, meetsSel = 0, bestRatio = 0, bestShare = 0;
for (const i of hueIx) {
  const share = Math.max(0, Math.min(1, shareAcc[i]));
  const { c, q } = quantumAt(lastAll.rgb[i * 3], lastAll.rgb[i * 3 + 1], lastAll.rgb[i * 3 + 2]);
  if (q <= 0 || share <= 0) continue;
  const ratio = c / q, needU = 2 / (0.10 * relSwing(1) * share), needS = 2 / (0.10 * relSwing(selectedGain) * share);
  shares.push(share); ratios.push(ratio); required.push(needU); requiredSel.push(needS);
  if (ratio >= needU) meetsUnsel += 1;
  if (ratio >= needS) meetsSel += 1;
  if (ratio > bestRatio) { bestRatio = ratio; bestShare = share; }
}

const sharesS = stats(shares), ratiosS = stats(ratios), reqS = stats(required);
const out = {
  reading: "GRÜN · §102 — the halo's chroma share, and §94's requirement corrected from a lower bound to a figure",
  verdict: PROVENANCE.verdict,
  provenance: { ...provenance, measuredBuildCommit, measuredWorktree: WT },
  instrument: PROVENANCE, guard, viewport: `${VW}x${VH}`, level: "L0", motion: "resting (reducedMotion:reduce)", repeats: REPEATS,
  whatWasOwed: "§94 used each pixel's TOTAL chroma as the c in c >= 2q/(p*relSwing). The breath modulates only the HALO's contribution, so the requirement is larger by 1/share and §94's 75.1 / 214.6 were a LOWER BOUND.",
  whyTakeItAnyway: "GELB ruled it can only move the unselected limb toward decided, never away. A figure that can only help the conclusion is exactly the figure A-G140 forbids leaving unmeasured.",
  shareIsADifferential: "C* is not additive over layers, so (C_all - C_without)/C_all is NOT an algebraic share. It is the chroma the halo CONTRIBUTES at that pixel, measured as A-F19 requires — an excess against a render without it, never a raw window. A ratio of two measured quantities invites being read as a partition; this one is not one.",
  spreadDomain: { everySpreadHere: "WITHIN ONE RUN — repeat-to-repeat across suppression cycles in a single browser launch, after a discarded warm-up.", excluded: "browser launch and page load. §99 measured those two domains differing by roughly a factor of two on a comparable quantity.", perCycleMedianShare_overALLHueGlowPixels: perCycleMedian,
    twoMediansAndWhyTheyDiffer: "the per-cycle median above is taken over ALL hue-glow pixels INCLUDING those whose differential contribution is <= 0; the haloChromaShare block below is over the EVALUATED (positive-contribution) subset only. Both are medians of a 'share' and they are 0.475 and 0.728 respectively. Named because two differently-filtered medians under one word is the A-G417 shape — a property of a sub-population read as a property of the whole — and a reader comparing them would conclude the instrument was inconsistent." },
  constantsRead: { haloDepth, selectedGain, haloMean: +haloMean.toFixed(6), relSwingUnselected: +relSwing(1).toFixed(6), relSwingSelected: +relSwing(selectedGain).toFixed(6) },
  population: {
    hueCarryingGlowPixels: hueIx.length, evaluated: shares.length, haloElementsMatched: haloCount,
    droppedFromTheShareFigure: hueIx.length - shares.length,
    droppedPct: +(100 * (hueIx.length - shares.length) / hueIx.length).toFixed(2),
    whyTheyWereDropped: "at these pixels the halo's DIFFERENTIAL chroma contribution is <= 0 — hiding the halo did not reduce C*, and at some pixels it raised it. That is not an error: compositing is not additive, and a cyan layer at low alpha over a dark near-neutral ground can leave the ground's own chroma MORE dominant when removed, which is §79's finding reaching a share figure. A share is undefined where the contribution is not positive, so those pixels carry no corrected requirement.",
    andTheyTravelWithEveryFigureBelow: "GELB §91: a share without its denominator cannot be audited. Every figure in this reading is over the EVALUATED population and says so."
  },
  haloChromaShare: sharesS,
  cOverQ: ratiosS,
  requiredCOverQ_at10pct: { unselected: reqS, selectedMedian: +stats(requiredSel).p50?.toFixed(1) ?? null },
  pixelsMeetingTheCorrectedRequirement: { unselected: meetsUnsel, selected: meetsSel, ofEvaluated: shares.length },
  theCeilingAfterCorrection: {
    bestPixel_cOverQ: +bestRatio.toFixed(4), itsHaloShare: +bestShare.toFixed(5),
    itsCorrectedRequirement_unselected: +(2 / (0.10 * relSwing(1) * Math.max(1e-9, bestShare))).toFixed(1),
    shortfallFactor: +((2 / (0.10 * relSwing(1) * Math.max(1e-9, bestShare))) / Math.max(1e-9, bestRatio)).toFixed(2),
    note: "§94's uncorrected figures were 75.1 unselected and 214.6 selected against a best pixel of 73.20."
  },
  finding: null
};
out.finding =
`THE HALO'S CHROMA SHARE, over the EVALUATED population of ${shares.length} of ${hueIx.length} hue-glow pixels (${(100 * (hueIx.length - shares.length) / hueIx.length).toFixed(1)} % DROPPED, because hiding the halo there did not reduce C* — compositing is not additive and removing a cyan layer over a dark ground can leave the ground's chroma more dominant, which is §79 reaching a share figure): median ${sharesS.p50}, p10 ${sharesS.p10}, p90 ${sharesS.p90}, max ${sharesS.max}. So at the median pixel the halo contributes ${(100 * sharesS.p50).toFixed(1)} % of the chroma, and the breath can only modulate THAT part.
§94's REQUIREMENT WAS A LOWER BOUND AND IS NOW A FIGURE: corrected for share, 10 % precision on the UNSELECTED amplitude needs c/q >= ${reqS.p50} at the median pixel (§94 said 75.1 for every pixel), and ${meetsUnsel} of ${shares.length} pixels meet it. Selected needs ${stats(requiredSel).p50} at the median and ${meetsSel} meet it.
THE CEILING MOVED THE WAY GELB SAID IT COULD ONLY MOVE: the brightest pixel reaches c/q ${bestRatio.toFixed(2)} with a halo share of ${bestShare.toFixed(4)}, so its corrected requirement is ${(2 / (0.10 * relSwing(1) * Math.max(1e-9, bestShare))).toFixed(1)} — a shortfall of ${((2 / (0.10 * relSwing(1) * Math.max(1e-9, bestShare))) / Math.max(1e-9, bestRatio)).toFixed(2)}x where the uncorrected comparison was 75.1 against 73.20, a shortfall of 1.03x. The 2.5 % that GELB ruled INCONCLUSIVE is not 2.5 % once the share is carried.
NO VERDICT (A-G36 point 2): this is a resolution and a population. PG-12 IS ESTABLISHED UNSATISFIABLE BY ANY BUILD (§36 — THIS LANE'S OWN finding, already recorded in gruen-pg12-chroma.mjs: the hue's own chroma is half the bound), so there is NO verdict to refer. These are measurability readings about a CHANNEL, not evidence toward an open pin. The earlier form of this sentence said {{WAS: whether PG-12 is satisfied is PINK's}} — referring a settled negative to another lane, which is the exact waste A-G111 exists to prevent, and the settlement was in my own record when I wrote it.`;

writeFileSync(resolve(OUT, "halo-chroma-share.json"), JSON.stringify(out, null, 1));
console.log(`halo elements matched: ${haloCount} · hue-glow pixels: ${hueIx.length} · evaluated: ${shares.length}`);
console.log(`halo chroma share: p10 ${sharesS.p10}  p50 ${sharesS.p50}  p90 ${sharesS.p90}  max ${sharesS.max}`);
console.log(`per-cycle median share (within-run spread): ${JSON.stringify(perCycleMedian)}`);
console.log(`c/q: p50 ${ratiosS.p50}  max ${ratiosS.max}`);
console.log(`corrected requirement @10%% unselected: p50 ${reqS.p50} · pixels meeting it: ${meetsUnsel}/${shares.length} · selected: ${meetsSel}/${shares.length}`);
console.log(`\n${out.finding}`);
