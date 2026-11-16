/** PINK · PHASE G · PF-11 at its LIVE form (`:907`), and PF-6's two rows RE-MEASURED ON BLURRED FRAMES
 *  because §21 measured them unblurred and PF-6's live form requires blur. On 3ec8457d.
 *
 *  PF-11, `:862` / `:907` -- NOT `:329`: *"blurred, disc-scoped: at thresholds 0.001 / 0.002 / 0.004 / 0.008,
 *  the count changing between samples >= 2 s apart <= 1.5x the back-to-back count AT EVERY THRESHOLD; plus no
 *  element with a non-zero computed animation or transition duration."* At base: 6.43 / 4.48 / 13.7 / inf.
 *  **Four thresholds reported SEPARATELY and the computed-style clause under its OWN verdict** (GELB's ask):
 *  the conjunction is the defect, and a pin carried by its worst rung cannot say which regime moved.
 *
 *  A RUNG WITH NO SIGNAL IS NOT A PASS. If the back-to-back count is 0 and the 2 s count is positive the ratio
 *  is infinite; if BOTH are 0 the ratio is 0/0 and the rung has measured nothing. The base reading's `inf` at
 *  0.008 is the first case. **Both are reported as their own states and neither as "clears"** -- A-G197's
 *  negative limb, and PF-8 tier C's own `:1354`/`:1356` not-evaluated rules are the precedent for saying so.
 *
 *  §21's DEFECT, MINE, AND IT IS THE THIRD INSTANCE OF ONE CLASS IN THIS EXCHANGE. I measured PF-6 from `:324`
 *  and its row-2 amendment at `:416`, and missed the restatement at **`:715`: *"PF-6 -- ceiling on 2 px-blurred
 *  frames: no blurred disc pixel swings > 0.030; mean |dL| per 500 ms <= 0.0025."*** So §21's figures are on
 *  UNBLURRED frames and PF-6's live form is blurred. Row 1 is a per-pixel extreme and blur suppresses exactly
 *  that, so the 104 breaching pixels may not survive it; row 2 is an area mean and should move little.
 *    **GELB read the bound amendment and missed the scope amendment on PF-8; I read the row amendment and
 *    missed the frame amendment on PF-6. Same cause, found by following PF-11's blur spec to its source.**
 *  Blur is `sharp(png).blur(2)`, byte-identical to the call my phase-F instruments used, so the figures are
 *  comparable to that lane's rather than merely to each other.
 *
 *  Disc = the FIELD ring's outer edge (`field` r=500 user is the OUTERMOST ring, not `horizon` -- §19's defect,
 *  asserted here). Floors MEASURED, never chosen (rule 6), and taken over the DISC rather than the whole clip
 *  (§24's defect, which took the floor over the clip and let host pixels set it).
 */
import { playwright, sharpModule, provenance } from "../../../mapping-phase-pink-tools/pink-tools.mjs";
const PINK_PROV_3ec8457d = await provenance({ declaredCommit: "3ec8457d", declaredBuildId: "xCD8LBxdjnP97-2Gjs5yr" });
const chromium = await playwright();
const sharp = await sharpModule();
const BASE = process.env.PINK_BASE ?? "http://127.0.0.1:3122";
const AN = "CAN_00000000000000000000000000000002";
const URL = `${BASE}/career/demo?focus=MAPPING&investigationMode=PERSON&analysisId=${AN}`;
const RUNGS = [0.001, 0.002, 0.004, 0.008], RATIO_BOUND = 1.5;
const PF6_CEIL = 0.030, PF6_MEAN = 0.0025;
const FOREIGN = '.mf-travel, .mf-beam-glow, [data-beam], text, [data-mapping-arc], [data-mapping-node], [data-mapping-trail], [data-testid^="mapping-measure-"]';
const LUT = new Float64Array(256);
for (let i = 0; i < 256; i++) { const c = i / 255; LUT[i] = c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
const pct = (a, p) => { if (!a.length) return null; const s = Float64Array.from(a).sort();
  const i = (s.length - 1) * p, lo = Math.floor(i), hi = Math.ceil(i);
  return +((lo === hi ? s[lo] : s[lo] + (s[hi] - s[lo]) * (i - lo))).toExponential(6); };

async function open(VW, VH, motion, hideForeign) {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: 1, reducedMotion: motion });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForSelector('[data-testid="mapping-field"]', { timeout: 30000 });
  await page.waitForTimeout(1800);
  while (await page.locator('[data-testid="guided-onboarding-overlay"]').count() > 0) {
    await page.locator('[data-testid="onboarding-close-btn"]').first().click().catch(() => {});
    await page.keyboard.press("Escape").catch(() => {}); await page.waitForTimeout(400); }
  if (await page.locator('[data-testid="guided-onboarding-overlay"]').count() !== 0) throw new Error("ABORT overlay present");
  if (hideForeign) { await page.addStyleTag({ content: `${FOREIGN}{visibility:hidden !important}` }); await page.waitForTimeout(600); }
  const geo = await page.evaluate(() => {
    const svg = document.querySelector('[data-testid="mapping-field-svg"]');
    const sr = svg.getBoundingClientRect();
    const vb = svg.getAttribute('viewBox').split(/\s+/).map(Number), k = sr.width / vb[2];
    const rad = {}; for (const key of ["shelf", "best", "field", "horizon"]) {
      const el = document.querySelector(`[data-testid="mapping-ring-${key}"]`);
      rad[key] = Number(el.getAttribute('r')) * k; }
    const fe = document.querySelector('[data-testid="mapping-ring-field"]');
    const fieldFar = Number(fe.getAttribute('r')) * k + Number(fe.getAttribute('stroke-width')) * k / 2;
    const fr = fe.getBoundingClientRect();
    return { clip: { x: Math.round(sr.x), y: Math.round(sr.y), width: Math.round(sr.width), height: Math.round(sr.height) },
      cx: fr.x + fr.width / 2, cy: fr.y + fr.height / 2, discR: fieldFar,
      outermostRing: Object.entries(rad).reduce((a, [kk, v]) => v > a[1] ? [kk, v] : a, ["", -1])[0] };
  });
  return { b, ctx, page, geo };
}

function discIndex(geo) {
  const W = geo.clip.width, H = geo.clip.height;
  const cx = geo.cx - geo.clip.x, cy = geo.cy - geo.clip.y, R = geo.discR;
  const idx = []; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const dx = x - cx, dy = y - cy; if (dx * dx + dy * dy <= R * R) idx.push(y * W + x); }
  return idx;
}

async function makeGrab(page, geo, idx) {
  const cdp = await page.context().newCDPSession(page);
  return async () => {
    const { data } = await cdp.send("Page.captureScreenshot", { format: "png", clip: { ...geo.clip, scale: 1 }, optimizeForSpeed: true });
    const s = await sharp(Buffer.from(data, "base64")).blur(2).raw().toBuffer({ resolveWithObject: true });
    const ch = s.info.channels, d = s.data, L = new Float64Array(idx.length);
    for (let j = 0; j < idx.length; j++) { const q = idx[j] * ch; L[j] = 0.2126 * LUT[d[q]] + 0.7152 * LUT[d[q + 1]] + 0.0722 * LUT[d[q + 2]]; }
    return L; };
}
const countsAbove = (A, B) => RUNGS.map(t => { let n = 0; for (let j = 0; j < A.length; j++) if (Math.abs(A[j] - B[j]) > t) n++; return n; });

async function pf11(VW, VH) {
  const { b, page, geo } = await open(VW, VH, "reduce", false);
  const idx = discIndex(geo), grab = await makeGrab(page, geo, idx);
  const styles = await page.evaluate(() => {
    const out = []; for (const el of document.querySelectorAll('[data-testid="mapping-field"], [data-testid="mapping-field"] *')) {
      const cs = getComputedStyle(el);
      const ad = cs.animationDuration || "0s", td = cs.transitionDuration || "0s";
      const nz = v => v.split(',').some(x => { const f = parseFloat(x); return Number.isFinite(f) && f !== 0; });
      if ((cs.animationName !== "none" && nz(ad)) || nz(td))
        out.push({ tag: el.tagName, testid: el.getAttribute('data-testid'), cls: el.getAttribute('class'),
          animationName: cs.animationName, animationDuration: ad, transitionDuration: td });
    } return out; });
  const a1 = await grab(), a2 = await grab();            // back-to-back
  const backToBack = countsAbove(a1, a2);
  await page.waitForTimeout(2400);                        // >= 2 s
  const a3 = await grab();
  const apart = countsAbove(a1, a3);
  await b.close();
  const rungs = RUNGS.map((t, i) => {
    const bb = backToBack[i], ap = apart[i];
    const state = bb === 0 && ap === 0 ? "NO SIGNAL — both counts zero, ratio 0/0, rung measured nothing"
      : bb === 0 ? "UNBOUNDED — back-to-back count is zero and the 2 s count is not; ratio infinite"
      : "measured";
    return { threshold: t, backToBackCount: bb, apartCount: ap,
      ratio: bb === 0 ? (ap === 0 ? null : Infinity) : +(ap / bb).toFixed(4),
      bound: `<= ${RATIO_BOUND}`, state,
      clears: bb === 0 ? (ap === 0 ? null : false) : ap / bb <= RATIO_BOUND };
  });
  return { viewport: `${VW}x${VH}`, motion: "reduce", blur: "sharp.blur(2)", outermostRing: geo.outermostRing,
    discPixels: idx.length,
    limb_thresholds_REPORTED_SEPARATELY: rungs,
    rungsClearing: rungs.filter(r => r.clears === true).length,
    rungsFailing: rungs.filter(r => r.clears === false).length,
    rungsNotEvaluable: rungs.filter(r => r.clears === null).length,
    limb_computedStyle_OWN_VERDICT: { offenders: styles.length, clears: styles.length === 0, sample: styles.slice(0, 6) },
    conjunctionVerdict_forContrastOnly: rungs.every(r => r.clears === true) && styles.length === 0 };
}

async function pf6blurred(VW, VH, motion, hideForeign) {
  const { b, page, geo } = await open(VW, VH, motion, hideForeign);
  const idx = discIndex(geo), grab = await makeGrab(page, geo, idx);
  const M = idx.length, nF = 27;
  const mins = new Float64Array(M).fill(Infinity), maxs = new Float64Array(M).fill(-Infinity);
  const pairMeans = []; let prev = null;
  for (let f = 0; f < nF; f++) {
    const L = await grab();
    for (let j = 0; j < M; j++) { if (L[j] < mins[j]) mins[j] = L[j]; if (L[j] > maxs[j]) maxs[j] = L[j]; }
    if (prev) { let s = 0; for (let j = 0; j < M; j++) s += Math.abs(L[j] - prev[j]); pairMeans.push(s / M); }
    prev = L; if (f < nF - 1) await page.waitForTimeout(500);
  }
  await b.close();
  const sw = new Float64Array(M); for (let j = 0; j < M; j++) sw[j] = maxs[j] - mins[j];
  let above = 0; for (let j = 0; j < M; j++) if (sw[j] > PF6_CEIL) above++;
  const mom = pairMeans.reduce((a, v) => a + v, 0) / pairMeans.length;
  return { viewport: `${VW}x${VH}`, motion, foreignSuppressed: !!hideForeign, blur: "sharp.blur(2)", discPixels: M,
    row1_blurred: { bound: `<= ${PF6_CEIL}`, max: pct(sw, 1), p999_9: pct(sw, 0.9999), p99_9: pct(sw, 0.999),
      p99: pct(sw, 0.99), p50: pct(sw, 0.5), pixelsAbove: above, clears: above === 0 },
    row2_blurred: { bound: `<= ${PF6_MEAN}`, meanOfPairMeans: +mom.toExponential(6),
      maxPairMean: +Math.max(...pairMeans).toExponential(6), clears: Math.max(...pairMeans) <= PF6_MEAN } };
}

const out = { commit: PINK_PROV_3ec8457d.observedCommit, buildId: PINK_PROV_3ec8457d.observedBuildId,
  pins: { "PF-11": "live form at :862/:907, NOT :329 — four thresholds separate, computed-style clause own verdict",
          "PF-6": "live form at :715 — on 2 px-BLURRED frames; §21 measured unblurred and is corrected here" },
  scope: "one fixture, one analysisId, L0 — §63", pf11: [], pf6: [] };
for (const [w, h] of [[1920, 1080], [1280, 800]]) out.pf11.push(await pf11(w, h));
out.pf6.push(await pf6blurred(1920, 1080, "reduce", false));
out.pf6.push(await pf6blurred(1920, 1080, "no-preference", true));
out.pf6.push(await pf6blurred(1920, 1080, "no-preference", false));
console.log(JSON.stringify(out, null, 2));
