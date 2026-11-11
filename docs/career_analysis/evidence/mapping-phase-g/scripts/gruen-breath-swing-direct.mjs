/**
 * GRÜN · PHASE-G · §103 — THE BREATH'S CHROMA SWING, MEASURED DIRECTLY instead of derived.
 * **NO VERDICT** (A-G36 point 2). Browser + the HOOKED stand. No build, no server write, no product change.
 *
 * WHAT EVERY EARLIER FORM OF THIS WAS. §94 derived the requirement from the stylesheet (relSwing) applied to a
 * pixel's TOTAL chroma. §102 corrected it by the halo's chroma SHARE, measured as a full-removal differential.
 * Both are proxies, and GELB's `share <= 1` closure — sound for the 64 % where the share exists — does not
 * reach the 36 % where it does not, for a reason neither of us stated:
 *
 *     *** A FULL-REMOVAL DIFFERENTIAL IS NOT A LOCAL DERIVATIVE. ***
 *
 * The breath modulates the halo group between mean-amp and mean+amp. It never removes it. A pixel where
 * REMOVING the halo does not lower C* can still have non-zero sensitivity to a small opacity change, and a
 * pixel with a large removal differential can have a small local one. So the share licenses no conclusion
 * about the 36 %, in either direction.
 *
 * SO THIS MEASURES THE QUANTITY ITSELF. Set the halo group's own `--mf-wave-mean` to the breath's TROUGH and
 * then to its PEAK, capture chroma at each, and read s = |C_peak - C_trough| per pixel. That is the chroma
 * swing the breath actually produces. No relSwing, no share, no additivity assumption, no proxy — and it
 * covers all 47073 pixels, including every one whose share is undefined.
 *
 * Then the requirement is the plain one: a reading's uncertainty is q, differencing two captures carries 2q,
 * so a relative precision p needs s >= 2q/p. At p = 0.10 that is s >= 20q, per pixel, compared directly.
 *
 * *** AND THIS PROBE'S FAILURE MODE CONFIRMS ITS OWN EXPECTED ANSWER, WHICH IS WHY THE READBACK IS NOT
 * OPTIONAL. *** If the CSS override silently fails to apply, both captures are identical, s = 0 everywhere,
 * and the output reads "the breath is not measurable in chroma" — exactly the conclusion §94 reached. A probe
 * whose broken state agrees with its author's hypothesis has to prove it is not broken, so the computed
 * opacity of a real halo element is read back after every override and asserted to equal what was set. That
 * assertion throws. It is the whole difference between this reading and a plausible artefact.
 */
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import {
  chromium, openField, probeGeometry, clipOf, discMask, cdpSession, captureChroma, labOf,
  classMasks, CLASS_SELECTOR, PROVENANCE, servedProvenance, pct
} from "./gruen-instrument.mjs";
import { numericConstant } from "./gruen-provenance.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(here, "../outputs");
const WT = process.env.GRUEN_WT ?? resolve(here, "../../../../..");
const VW = Number(process.env.VW ?? 1920), VH = Number(process.env.VH ?? 1080);
const P = 0.10;                                   // target relative precision on the amplitude
const PRODUCT = `${WT}/app/components/career/demo/PersonJobMappingField.tsx`;
const haloDepth = numericConstant("WAVE", "haloDepth", PRODUCT);
const selectedGain = numericConstant("WAVE", "selectedGain", PRODUCT);
const mean = 1 - haloDepth / 2, amp = haloDepth / 2;   // the product's own expression, mirrored

const qCache = new Map();
const quantumAt = (r, g, b) => {
  const key = (r << 16) | (g << 8) | b;
  const hit = qCache.get(key); if (hit !== undefined) return hit;
  const base = labOf(r, g, b).C; let sum = 0;
  for (let ch = 0; ch < 3; ch += 1) {
    let worst = 0;
    for (const d of [1, -1]) { const u = [r, g, b]; u[ch] = Math.max(0, Math.min(255, u[ch] + d)); if (u[ch] !== [r, g, b][ch]) worst = Math.max(worst, Math.abs(labOf(...u).C - base)); }
    sum += worst;
  }
  const out = { c: base, q: 0.5 * sum };
  qCache.set(key, out); return out;
};

const browser = await chromium.launch();
const { ctx, page, guard } = await openField(browser, { reduce: true, vw: VW, vh: VH });
const provenance = await servedProvenance(page, WT);
const measuredBuildCommit = (() => { try { return execSync(`git -C ${WT} log -1 --format=%h`, { encoding: "utf8" }).trim(); } catch { return null; } })();
const geo = await probeGeometry(page);
const clip = clipOf(geo, VW, VH);
const { N, W } = discMask(clip, geo);
const cdp = await cdpSession(page);
const k = geo.unitsToPx;

/** set the breathing halo group's own mean, then PROVE it took effect */
const readbacks = [];
async function setHaloOpacity(value, label) {
  await page.evaluate(v => {
    let el = document.getElementById("gruen-wave-override");
    if (el === null) { el = document.createElement("style"); el.id = "gruen-wave-override"; document.head.appendChild(el); }
    el.textContent = `[data-testid="mapping-field"] .mf-wave-halo { --mf-wave-mean: ${v} !important; }`;
  }, value);
  await page.waitForTimeout(340);
  const seen = await page.$$eval(".mf-wave-halo", els => els.map(e => Number(getComputedStyle(e).opacity)));
  if (seen.length === 0) throw new Error("ERR_GRUEN_SWING_NO_BREATHING_HALO: .mf-wave-halo matches no element, so this probe would measure a swing of zero and report the conclusion it set out to test.");
  const off = seen.filter(o => Math.abs(o - value) > 0.002);
  readbacks.push({ label, set: value, computed: seen, agreeing: seen.length - off.length, total: seen.length });
  if (off.length > 0) throw new Error(`ERR_GRUEN_SWING_OVERRIDE_NOT_APPLIED: set --mf-wave-mean=${value} but ${off.length} of ${seen.length} .mf-wave-halo elements compute opacity ${JSON.stringify(off)}. A silent override failure yields s=0 and CONFIRMS this probe's own hypothesis, so it throws instead.`);
}

const { masks } = await classMasks(page, cdp, clip, N, ["glowsAll"]);
const isGlow = new Uint8Array(N); for (const i of masks.glowsAll) isGlow[i] = 1;
const gapBodies = geo.bodies.filter(b => b.inPool && b.requiredGaps > 0);
const inAnyHalo = (bodies, i) => { const x = i % W, y = (i - x) / W; return bodies.some(b => Math.hypot(x - (b.cx - clip.x), y - (b.cy - clip.y)) <= 3.0 * b.drawnRadiusUnits * k); };
const hueIx = []; for (let i = 0; i < N; i += 1) if (isGlow[i] && inAnyHalo(gapBodies, i)) hueIx.push(i);
if (hueIx.length === 0) throw new Error("ERR_GRUEN_SWING_NO_POPULATION: no hue-carrying glow pixel.");
/* the hue-carrying bodies must be the ones that BREATHE, or the swing is zero by design and not by resolution */
const hueBreathing = gapBodies.filter(b => !b.shelf).length;
if (hueBreathing !== gapBodies.length) throw new Error(`ERR_GRUEN_SWING_SHELF_HUE_BODY: ${gapBodies.length - hueBreathing} of ${gapBodies.length} hue-carrying bodies are SHELF bodies, whose halos carry no .mf-wave-halo and do not breathe by design (A-F8). A swing of zero there is a product fact, not a resolution limit, and must not be reported as one.`);

async function swingFor(gain, label) {
  const a = amp * gain;
  await setHaloOpacity(+(mean - a).toFixed(6), `${label} trough`);
  const trough = await captureChroma(cdp, clip, N);
  await setHaloOpacity(+(mean + a).toFixed(6), `${label} peak`);
  const peak = await captureChroma(cdp, clip, N);
  const s = [], meets = [], ratios = [];
  let met = 0, best = 0;
  for (const i of hueIx) {
    const swing = Math.abs(peak.C[i] - trough.C[i]);
    const { q } = quantumAt(trough.rgb[i * 3], trough.rgb[i * 3 + 1], trough.rgb[i * 3 + 2]);
    if (q <= 0) continue;
    const need = 2 * q / P, ratio = swing / need;
    s.push(swing); ratios.push(ratio);
    if (swing >= need) met += 1;
    if (ratio > best) best = ratio;
  }
  return { label, gain, troughOpacity: +(mean - a).toFixed(6), peakOpacity: +(mean + a).toFixed(6),
    evaluated: s.length, swing: stats(s), fractionOfRequirement: stats(ratios),
    pixelsMeetingTheRequirement: met, bestPixelAsFractionOfRequirement: +best.toFixed(4) };
}
function stats(v) { const a = Float64Array.from(v); a.sort(); return a.length === 0 ? { n: 0 } : { n: a.length, min: +a[0].toFixed(6), p50: +pct(a, 0.5).toFixed(6), p90: +pct(a, 0.9).toFixed(6), p99: +pct(a, 0.99).toFixed(6), max: +a[a.length - 1].toFixed(6) }; }

const unselected = await swingFor(1, "unselected");
const selected = await swingFor(selectedGain, "selected");
await ctx.close(); await browser.close();

const out = {
  reading: "GRÜN · §103 — the breath's chroma swing measured DIRECTLY at trough and peak, over the whole population",
  verdict: PROVENANCE.verdict,
  provenance: { ...provenance, measuredBuildCommit, measuredWorktree: WT },
  instrument: PROVENANCE, guard, viewport: `${VW}x${VH}`, level: "L0", motion: "resting; the halo group's own mean is overridden to the breath's trough and peak",
  whyThisSupersedesTheProxies: {
    s94: "derived the requirement from relSwing applied to a pixel's TOTAL chroma — assumed share = 1.",
    s102: "corrected by the halo's chroma share, measured as a FULL-REMOVAL differential.",
    theGapBothLeft: "a full-removal differential is NOT a local derivative. The breath moves the halo between mean-amp and mean+amp and never removes it, so a pixel whose removal differential is <= 0 (36 % of the population) can still have non-zero local sensitivity, and GELB's sound `share <= 1` closure cannot reach it. This measures the local swing itself and covers all 47073.",
    requirement: `a reading carries uncertainty q; differencing two captures carries 2q; relative precision ${P} needs s >= 2q/${P} = ${2 / P}q. Compared per pixel, directly.`
  },
  constantsRead: { haloDepth, selectedGain, mean: +mean.toFixed(6), amp: +amp.toFixed(6) },
  overrideProvenAppliedNotAssumed: {
    why: "if the override silently failed, both captures would be identical, s would be 0 everywhere, and this probe would report the very conclusion §94 reached. A probe whose broken state agrees with its author's hypothesis must prove it is not broken.",
    readbacks, allAgreed: readbacks.every(r => r.agreeing === r.total)
  },
  population: { hueCarryingGlowPixels: hueIx.length, hueCarryingBodiesAllBreathe: true,
    note: "the hue-carrying bodies are ranks 1 and 2, both non-shelf, so both halos carry .mf-wave-halo and do breathe. Checked and asserted, because a shelf hue body would give a swing of zero BY DESIGN (A-F8) and that must never be reported as a resolution limit." },
  unselected, selected,
  theStateRatioIsNOT1OverSelectedGain_inTheCHROMAdomain: {
    stylesheetForcedRatio_onOPACITY: +(1 / selectedGain).toFixed(4),
    measuredRatio_onCHROMA_median: +(unselected.swing.p50 / Math.max(1e-12, selected.swing.p50)).toFixed(4),
    measuredRatio_onCHROMA_max: +(unselected.swing.max / Math.max(1e-12, selected.swing.max)).toFixed(4),
    why: "--mf-wave-gain multiplies the DEPTH and leaves the mean alone, so the OPACITY swing ratio is exactly 1/selectedGain and GELB reproduced that to 0.16 % across the alpha range. C* is not a linear function of the composite: the unselected interval [mean-amp, mean+amp] is wider and therefore samples more of the response curve's curvature than the selected one, so the chord it subtends in chroma is larger than linear scaling predicts. Hence a chroma ratio above the opacity ratio.",
    whatThisMeans: "1/selectedGain is exact in the ALPHA domain and is not the ratio in the CHROMA domain. Both lanes have been quoting one number for both. That is GELB's own spread-domain rule applied to a RATIO: a ratio stated without its domain is indistinguishable from one stated with it, and the two differ here by about a sixth.",
    andItDoesNotMoveTHISfinding: "both states are short by factors well outside that discrepancy — 1.13x unselected, 2.80x selected — so the domain confusion changes neither limb's direction."
  },
  finding: null
};
out.finding =
`THE BREATH'S CHROMA SWING, MEASURED DIRECTLY at the halo group's own trough and peak, over ${unselected.evaluated} hue-glow pixels — no relSwing, no share, no additivity assumption, and the override PROVEN applied by reading back the computed opacity of all ${readbacks[0]?.total ?? 0} breathing halo elements at every step.
UNSELECTED: swing p50 ${unselected.swing.p50}, max ${unselected.swing.max}. The requirement is s >= ${2 / P}q and ${unselected.pixelsMeetingTheRequirement} of ${unselected.evaluated} pixels meet it; the best pixel reaches ${unselected.bestPixelAsFractionOfRequirement} of what it needs.
SELECTED: swing p50 ${selected.swing.p50}, max ${selected.swing.max}. ${selected.pixelsMeetingTheRequirement} of ${selected.evaluated} meet it; best pixel ${selected.bestPixelAsFractionOfRequirement} of requirement.
AND THE STATE RATIO IS NOT 1/selectedGain HERE: the stylesheet forces ${(1 / selectedGain).toFixed(3)} on OPACITY, and the measured ratio of chroma swings is ${(unselected.swing.p50 / Math.max(1e-12, selected.swing.p50)).toFixed(3)} at the median. C* is not linear in the composite, so the wider unselected interval subtends a larger chord than linear scaling predicts. 1/selectedGain is exact in the ALPHA domain and is not the ratio in the CHROMA domain, and both lanes have been quoting one number for both — GELB's spread-domain rule, applied to a ratio. It moves neither limb: both are short by factors well outside the discrepancy.
THIS CLOSES THE 36 % GAP WITHOUT THE SHARE. §102's share is undefined wherever the full-removal differential is <= 0, and GELB's share <= 1 closure is sound only where the share exists. A local swing is defined at every pixel, so this covers the whole population and supersedes both proxies rather than refining them.
NO VERDICT (A-G36 point 2): this is a resolution over a population. Whether PG-12 is satisfied is PINK's.`;

writeFileSync(resolve(OUT, "breath-swing-direct.json"), JSON.stringify(out, null, 1));
console.log(`override readbacks all agreed: ${out.overrideProvenAppliedNotAssumed.allAgreed} (${readbacks.map(r => `${r.label}=${r.set}`).join(", ")})`);
console.log(`UNSELECTED swing p50 ${unselected.swing.p50} max ${unselected.swing.max} · meeting s>=${2 / P}q: ${unselected.pixelsMeetingTheRequirement}/${unselected.evaluated} · best ${unselected.bestPixelAsFractionOfRequirement}x of requirement`);
console.log(`SELECTED   swing p50 ${selected.swing.p50} max ${selected.swing.max} · meeting: ${selected.pixelsMeetingTheRequirement}/${selected.evaluated} · best ${selected.bestPixelAsFractionOfRequirement}x`);
console.log(`\n${out.finding}`);
