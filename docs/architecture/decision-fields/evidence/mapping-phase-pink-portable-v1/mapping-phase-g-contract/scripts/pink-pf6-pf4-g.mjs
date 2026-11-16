/** PINK · PHASE G · PF-6's TWO ROWS re-measured on 3ec8457d, and PF-4's third limb measured. (GELB §68.)
 *
 *  PF-6 (phase F line 324, amended at 416): *"Breath ceiling: no pixel swings > 0.030; stage mean |ΔL| over
 *  the disc between two renders 500 ms apart <= 0.0025."* **TWO ROWS, ONE VERDICT — A-G144's hazard again**,
 *  so each row is reported separately with its own floor and its own distribution, and no single figure is
 *  offered for "PF-6".
 *
 *  ROW 1 IS PG-10 LIMB 3's BOUND ON A LARGER SET, WHICH MATTERS FOR WHAT §12's BREACH DOES AND DOES NOT SAY.
 *  GELB is right that one bound and one quantity are shared. But §12 measured the CARRIER MASK (the halo),
 *  and PF-6 says *disc*. The carrier is a SUBSET of the disc, so the breach transfers a fortiori -- what does
 *  NOT transfer is its extent: 105 of 51 289 carrier pixels says nothing about how many DISC pixels breach,
 *  because any other carrier in the disc could breach too and was never in the mask. **A breach inherited
 *  from a subset is a lower bound on the superset's breach, never its measurement.** So row 1 is measured
 *  over the whole disc here, and the two readings are reported side by side rather than one cited as the other.
 *
 *  ROW 2 WAS MEASURED IN PHASE F (0.0001 against 0.0025) AND THAT FIGURE IS NOT ADMISSIBLE HERE — rule 1 /
 *  A-G54: a floor, and any absolute reading, is a property of a BUILD. A-G17 replaced a lit translucent plate
 *  with cheap occlusion between `9cc06f84` and `3ec8457d`, which is exactly the kind of change that moves a
 *  per-frame difference. Re-measured, with its own static floor.
 *
 *  THE FLOOR IS MEASURED FOR BOTH ROWS, under `reduce`, on the same disc and the same statistic. A static
 *  frame series must return ~0 for both; if it does not, the instrument is reporting its own noise (A-G197's
 *  negative limb, and the defect that voided my first PG-10 attempt when resting glows "swung" 0.7925).
 *
 *  PF-4 (phase F line 322): *"Depth is monotone in rank, ratio rank 1 : last in [1.5, 3.0]; AND same-class
 *  marks on different bodies differ by <= 2 % -- i.e. depth did not touch evidence."* **THREE limbs, and
 *  GELB's §68 ruling cites only the ratio.** Limbs 1 and 2 are arithmetic over the gain law and are settled
 *  in §18/§21. Limb 3 is measured here, from the DOM: `depthGain` is applied ONLY to `.mf-core` (`:697`) and
 *  the halo group (`:669`); the body group carries `opacity={opacity}`, a different quantity, and the evidence
 *  marks live outside the body group entirely. That is a SOURCE reading, so it is checked against the rendered
 *  tree: same-class marks are grouped by `data-class` and their rendered opacities compared.
 *
 *  Disc = the FIELD ring's outer edge. `field` (r=500 user) is the OUTERMOST ring, not `horizon` (400) --
 *  the §19 defect, asserted here rather than assumed.
 */
import { playwright, sharpModule, provenance } from "../../../mapping-phase-pink-tools/pink-tools.mjs";
const PINK_PROV_3ec8457d = await provenance({ declaredCommit: "3ec8457d", declaredBuildId: "xCD8LBxdjnP97-2Gjs5yr" });
const chromium = await playwright();
const sharp = await sharpModule();
const BASE = process.env.PINK_BASE ?? "http://127.0.0.1:3122";
const AN = "CAN_00000000000000000000000000000002";
const URL = `${BASE}/career/demo?focus=MAPPING&investigationMode=PERSON&analysisId=${AN}`;
const STEP_MS = 500, WINDOW_MS = 13000, CEIL = 0.030, MEAN_BOUND = 0.0025;
const LUT = new Float64Array(256);
for (let i = 0; i < 256; i++) { const c = i / 255; LUT[i] = c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
const pct = (a, p) => { if (!a.length) return null; const s = Float64Array.from(a).sort();
  const i = (s.length - 1) * p, lo = Math.floor(i), hi = Math.ceil(i);
  return +((lo === hi ? s[lo] : s[lo] + (s[hi] - s[lo]) * (i - lo))).toExponential(6); };

// PF-6 row 1 says "no pixel" and names no carrier, so a disc-wide reading cannot tell the BREATH from the
// deliberate travelling light that A-G17/G-4 put in the same disc. A max of 0.69 is a pixel going from near
// black to near white, which no translucent breath does -- it is the signature that voided my first PG-10
// attempt (resting glows "swinging" 0.7925). So the same window is re-run with foreign MOTION suppressed,
// and the two readings are reported together: if the breach survives the mask it is the breath, and if it
// collapses it was the travel and PF-6's row 1 does not bound what its words say it bounds.
const FOREIGN = '.mf-travel, .mf-beam-glow, [data-beam], text, [data-mapping-arc], [data-mapping-node], [data-mapping-trail], [data-testid^="mapping-measure-"]';

async function run(VW, VH, motion, hideForeign) {
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
  // The mask is applied BEFORE the window and left in place: this is a suppression reading, declared as such,
  // not the mask-by-diff of §10-§14. Every remaining sign stays drawn.
  if (hideForeign) { await page.addStyleTag({ content: `${FOREIGN}{visibility:hidden !important}` }); await page.waitForTimeout(600); }

  const geo = await page.evaluate(() => {
    const svg = document.querySelector('[data-testid="mapping-field-svg"]');
    const sr = svg.getBoundingClientRect();
    const vb = svg.getAttribute('viewBox').split(/\s+/).map(Number), k = sr.width / vb[2];
    const rad = {}; for (const key of ["shelf", "best", "field", "horizon"]) {
      const el = document.querySelector(`[data-testid="mapping-ring-${key}"]`);
      rad[key] = { r: Number(el.getAttribute('r')) * k, w: Number(el.getAttribute('stroke-width')) * k }; }
    const fr = document.querySelector('[data-testid="mapping-ring-field"]').getBoundingClientRect();
    // PF-4 limb 3: same-class marks across bodies, from the rendered tree.
    const bodies = [...document.querySelectorAll('[data-mapping-body]')].map(el => ({
      rank: Number(el.getAttribute('data-rank')), cls: el.getAttribute('data-class'),
      shelf: el.getAttribute('data-shelf'), groupOpacity: Number(getComputedStyle(el).opacity),
      coreOpacity: (() => { const c = el.querySelector('circle.mf-core'); return c ? Number(getComputedStyle(c).opacity) : null; })(),
      shapeStroke: (() => { const c = el.querySelector('[data-mapping-body-shape]'); return c ? getComputedStyle(c).stroke : null; })(),
      shapeOpacity: (() => { const c = el.querySelector('[data-mapping-body-shape]'); return c ? Number(getComputedStyle(c).opacity) : null; })() }));
    const markGainInheritance = {
      coreCarriesGain: bodies.some(x => x.coreOpacity !== null && x.coreOpacity < 1),
      bodyGroupCarriesGain: new Set(bodies.map(x => x.groupOpacity)).size > 1,
      marksOutsideBodyGroup: { arcs: document.querySelectorAll('[data-mapping-body] [data-mapping-arc]').length,
        beams: document.querySelectorAll('[data-mapping-body] [data-beam]').length,
        nodes: document.querySelectorAll('[data-mapping-body] [data-mapping-node]').length } };
    return { clip: { x: Math.round(sr.x), y: Math.round(sr.y), width: Math.round(sr.width), height: Math.round(sr.height) },
      cx: fr.x + fr.width / 2, cy: fr.y + fr.height / 2, k, rad, bodies, markGainInheritance,
      outermostRing: Object.entries(rad).reduce((a, [key, v]) => v.r > a[1] ? [key, v.r] : a, ["", -1])[0] };
  });
  const clip = geo.clip, W = clip.width, H = clip.height, N = W * H;
  const cx = geo.cx - clip.x, cy = geo.cy - clip.y;
  const discR = geo.rad.field.r + geo.rad.field.w / 2;
  const idx = []; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const dx = x - cx, dy = y - cy;
    if (dx * dx + dy * dy <= discR * discR) idx.push(y * W + x); }
  const M = idx.length;

  const cdp = await page.context().newCDPSession(page);
  const grab = async () => { const { data } = await cdp.send("Page.captureScreenshot", { format: "png", clip: { ...clip, scale: 1 }, optimizeForSpeed: true });
    const s = await sharp(Buffer.from(data, "base64")).raw().toBuffer({ resolveWithObject: true });
    const ch = s.info.channels, d = s.data, L = new Float64Array(M);
    for (let j = 0; j < M; j++) { const q = idx[j] * ch; L[j] = 0.2126 * LUT[d[q]] + 0.7152 * LUT[d[q + 1]] + 0.0722 * LUT[d[q + 2]]; }
    return L; };

  const nFrames = Math.floor(WINDOW_MS / STEP_MS) + 1;
  const mins = new Float64Array(M).fill(Infinity), maxs = new Float64Array(M).fill(-Infinity);
  const pairMeans = [];
  let prev = null;
  for (let f = 0; f < nFrames; f++) {
    const L = await grab();
    for (let j = 0; j < M; j++) { if (L[j] < mins[j]) mins[j] = L[j]; if (L[j] > maxs[j]) maxs[j] = L[j]; }
    if (prev) { let s = 0; for (let j = 0; j < M; j++) s += Math.abs(L[j] - prev[j]); pairMeans.push(s / M); }
    prev = L;
    if (f < nFrames - 1) await page.waitForTimeout(STEP_MS);
  }
  await ctx.close(); await b.close();

  const swing = new Float64Array(M); for (let j = 0; j < M; j++) swing[j] = maxs[j] - mins[j];
  let above = 0; for (let j = 0; j < M; j++) if (swing[j] > CEIL) above++;
  const meanOfMeans = pairMeans.reduce((a, v) => a + v, 0) / pairMeans.length;
  return { viewport: `${VW}x${VH}`, motion, foreignMotionSuppressed: !!hideForeign, framesCaptured: nFrames, stepMs: STEP_MS, windowMs: WINDOW_MS,
    discRadiusDevicePx: +discR.toFixed(3), discPixels: M, outermostRing: geo.outermostRing,
    row1_perPixelSwing: { bound: `<= ${CEIL}`,
      max: pct(swing, 1), p999_9: pct(swing, 0.9999), p99_9: pct(swing, 0.999), p99: pct(swing, 0.99),
      p50: pct(swing, 0.5), p05: pct(swing, 0.05),
      pixelsAboveCeiling: above, fractionAboveCeiling: +(above / M).toExponential(4),
      clears: above === 0 },
    row2_meanAbsDeltaPer500ms: { bound: `<= ${MEAN_BOUND}`,
      meanOfPairMeans: +meanOfMeans.toExponential(6), maxPairMean: +Math.max(...pairMeans).toExponential(6),
      minPairMean: +Math.min(...pairMeans).toExponential(6), pairs: pairMeans.length,
      clears: Math.max(...pairMeans) <= MEAN_BOUND, clearsOnMean: meanOfMeans <= MEAN_BOUND },
    PF4_limb3_sameClassMarks: { bodies: geo.bodies, inheritance: geo.markGainInheritance } };
}

const out = { commit: PINK_PROV_3ec8457d.observedCommit, buildId: PINK_PROV_3ec8457d.observedBuildId,
  reading: "PINK — PF-6's two rows re-measured on 3ec8457d (GELB §68), each with its own floor; PF-4 limb 3 from the DOM",
  note: "PF-6 carries TWO rows under ONE verdict and PF-4 carries THREE limbs under one. Each is reported separately; no single figure is offered for either pin.",
  scope: "one fixture, one analysisId, five bodies (2 field / 3 shelf), L0 — §63",
  runs: [] };
for (const [w, h, m, hf] of [[1920, 1080, "reduce", false], [1920, 1080, "no-preference", false],
                             [1920, 1080, "no-preference", true], [1280, 800, "no-preference", true]])
  out.runs.push(await run(w, h, m, hf));
console.log(JSON.stringify(out, null, 2));
