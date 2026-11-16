/** PINK · PHASE G · §33 / A-G412 probe — the sel/unsel SWING RATIO on actual bytes.
 *  Stand: PINK :3122, commit 3ec8457d, same build as §10/§27/§28/§29/§30/§31 (150944-byte façade).
 *
 *  GELB (§91) hands down the CENTRE and leaves the WIDTH to this lane: "Measure the sel/unsel SWING ratio
 *  — not the share ratio — on actual bytes, at any pixel, on any backdrop. It must be 2.8571." Its 0.16%
 *  band is a property of a double-precision model and it says so; the tolerance is to come from this stand's
 *  own quantisation floor. A-G139 applied to its own figure before anyone had to.
 *
 *  TWO CORRECTIONS TO THE PROBE BEFORE IT IS WORTH RUNNING.
 *
 *  (i) NAMING. 2.8571 = 1/selectedGain = 1/0.35 is the UNSELECTED swing over the SELECTED swing. GELB wrote
 *      "sel/unsel", whose value is 0.35. The quantity is reported here as ratio = unsel/sel so the number it
 *      stated is the number this instrument prints; sel/unsel is printed beside it.
 *
 *  (ii) THE SPACE. **2.8571 is EXACT in encoded sRGB and is NOT the luminance ratio.** §29 established the
 *      mechanism and this probe is where it bites. CSS composites group opacity on the ENCODED channel,
 *      v = a·S + (1−a)·D, affine in `a`; both states share the same mean (0.8825, :274) and differ only in
 *      the depth multiplier (:275), so the encoded value sweeps E0 ± A unselected and E0 ± 0.35A selected
 *      about the SAME midpoint. Peak-to-peak in encoded space therefore has ratio exactly 1/0.35.
 *      WCAG luminance DECODES that byte. For a peak-to-peak about a fixed midpoint the even terms cancel:
 *          ΔL = 2A·g'(E0) + (A³/3)·g'''(E0) + O(A⁵)
 *      so  ratio_L = (1/0.35) · [1 + (A²/6)(g'''/g')] / [1 + (0.1225A²/6)(g'''/g')].
 *      For the 2.4 power g''' > 0, so **ratio_L is biased ABOVE 2.8571, by a predictable amount**, and a
 *      measurement that returns 2.8571 in luminance would be the suspicious outcome, not the clean one.
 *      Both limbs are therefore measured: ratio_E (must be 1/0.35) and ratio_L (must exceed it, by the
 *      amount predicted from each pixel's own measured E0 and A — no Taylor series, the decode is applied).
 *
 *  (iii) A POINT PREDICTION, which is stronger than either ratio. From the unselected state's measured
 *      per-channel (Emin, Emax) alone, the selected range is PREDICTED as mid ± 0.35·half, decoded, and the
 *      predicted selected luminance swing compared against the measured one per pixel. A ratio can be right
 *      for compensating reasons; a point prediction per pixel cannot.
 *
 *  TOLERANCE, DERIVED FROM THIS STAND AND NOT FROM GELB's BAND. Three terms, reported separately:
 *    · QUANTISATION, the dominant one. Peak-to-peak of a byte-quantised signal is an integer; the selected
 *      swing is a few codes (§31: selected s/q median 4.70 at 1920, 3.94 at 1280, never 10 at 1280). The
 *      per-pixel relative resolution is ~1 code / selected swing, i.e. tens of percent. Reported as a ladder
 *      in the unselected swing magnitude, because that is the only axis along which it shrinks.
 *    · SAMPLING. Peak-to-peak from discrete frames UNDERESTIMATES the extremes. At STEP_MS over the faster
 *      cosine branch (rise 4000ms, :174/:175) the miss is 1−cos(π·STEP/2/4000) ≈ 0.48% at 250ms; it is
 *      COMMON-MODE between the states (same waveform, same cadence) so it largely cancels in the ratio.
 *      Bounded and reported, not assumed away.
 *    · AGGREGATION. The per-pixel floor is tens of percent; the MEDIAN over thousands of pixels can be far
 *      tighter, but only if the quantisation residues are effectively dithered across pixels. That is not
 *      assumed: the interval is BOOTSTRAPPED over pixels and the empirical width is what is reported.
 *
 *  §31's LESSON IS BINDING HERE. The ladder is reported WHOLE. A single rung that happens to sit on 2.8571
 *  is a rung choice, not a convergence — that was §30's withdrawn finding and it will not be repeated. The
 *  ladder is checked for monotonicity and the crossing, if any, is named.
 *
 *  ONE SHARED MASK, per §29: the pixel set is defined ONCE in the unselected state and both states are
 *  measured on it, so the ratio is a ratio over the same pixels. A-F11's seventh instance was exactly the
 *  failure to check that two numbers describe the same support.
 */
import { playwright, sharpModule, provenance } from "../../../mapping-phase-pink-tools/pink-tools.mjs";
const PINK_PROV_3ec8457d = await provenance({ declaredCommit: "3ec8457d" });
const chromium = await playwright();
const sharp = await sharpModule();
const BASE = process.env.PINK_BASE ?? "http://127.0.0.1:3122";
const AN = "CAN_00000000000000000000000000000002";
const URL = `${BASE}/career/demo?focus=MAPPING&investigationMode=PERSON&analysisId=${AN}`;

const MEAN = 0.8825, DEPTH = 0.1175, SEL_GAIN = 0.35;      // :274 / :275, waveAt ∈ [−1,1] per :174
const EXPECT_RATIO = 1 / SEL_GAIN;                          // 2.857142857… , GELB's centre
const SEL_CAPABILITY = "PCAP_PG";   // the capability ID clicked, as in §29; data-selection then reads CAPABILITY
const FRAMES = 41, STEP_MS = 250;                           // 10.25s > one 10000ms period
const SAMPLING_MISS = 1 - Math.cos((Math.PI * (STEP_MS / 2)) / 4000);
const RUNGS = [4, 6, 8, 12, 16, 24, 32, 48, 64];            // unselected GREEN swing, in codes
const BOOT = 400;

const LUT = new Float64Array(256);
for (let i = 0; i < 256; i++) { const c = i / 255; LUT[i] = c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
const W = [0.2126, 0.7152, 0.0722];
/** luminance of a float encoded triple in [0,255] — the SAME decode, applied off the integer grid so the
 *  prediction limb is not forced back onto it. */
const gf = v => { const c = Math.min(1, Math.max(0, v / 255)); return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
const lumf = (r, g, b) => W[0] * gf(r) + W[1] * gf(g) + W[2] * gf(b);

const med = a => { if (a.length === 0) return null; const s = Float64Array.from(a).sort(); const n = s.length;
  return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
const pct = (a, p) => { if (a.length === 0) return null; const s = Float64Array.from(a).sort();
  return s[Math.min(s.length - 1, Math.max(0, Math.round(p * (s.length - 1))))]; };

async function boot(VW, VH, select) {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: 1, reducedMotion: "no-preference" });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForSelector('[data-testid="mapping-field"]', { timeout: 30000 });
  await page.waitForTimeout(1800);
  while (await page.locator('[data-testid="guided-onboarding-overlay"]').count() > 0) {
    await page.locator('[data-testid="onboarding-close-btn"]').first().click().catch(() => {});
    await page.keyboard.press("Escape").catch(() => {}); await page.waitForTimeout(400); }
  if (await page.locator('[data-testid="guided-onboarding-overlay"]').count() !== 0) throw new Error("ABORT overlay present");
  if (select) { await page.locator(`[data-testid="mapping-capability-${select}"]`).click({ force: true }).catch(() => {});
    await page.waitForTimeout(700); }
  const geo = await page.evaluate(() => {
    const svg = document.querySelector('[data-testid="mapping-field-svg"]');
    const sr = svg.getBoundingClientRect();
    const fr = document.querySelector('[data-testid="mapping-ring-field"]').getBoundingClientRect();
    const fe = document.querySelector('[data-testid="mapping-field"]');
    const halo = document.querySelector('.mf-wave-halo');
    const cs = halo ? getComputedStyle(halo) : null;
    return { clip: { x: Math.round(sr.x), y: Math.round(sr.y), width: Math.round(sr.width), height: Math.round(sr.height) },
      cx: fr.x + fr.width / 2, cy: fr.y + fr.height / 2, R: fr.width / 2,
      selection: fe.getAttribute('data-selection'), breath: fe.getAttribute('data-breath'),
      waveGain: cs ? cs.getPropertyValue('--mf-wave-gain').trim() : null,
      animation: cs ? cs.animationName : null };
  });
  const cdp = await page.context().newCDPSession(page);
  return { b, ctx, page, cdp, geo };
}

/** Per-pixel per-channel min/max byte and min/max luminance over one full period, inside the disc. */
async function sweep(h, clip, idx) {
  const n = idx.length;
  const mn = new Uint8Array(n * 3).fill(255), mx = new Uint8Array(n * 3);
  const lmn = new Float64Array(n).fill(Infinity), lmx = new Float64Array(n).fill(-Infinity);
  for (let f = 0; f < FRAMES; f++) {
    const { data } = await h.cdp.send("Page.captureScreenshot", { format: "png", clip: { ...clip, scale: 1 }, optimizeForSpeed: true });
    const s = await sharp(Buffer.from(data, "base64")).raw().toBuffer({ resolveWithObject: true });
    const ch = s.info.channels, d = s.data;
    for (let j = 0; j < n; j++) {
      const p = idx[j] * ch, o = j * 3;
      const r = d[p], g = d[p + 1], bl = d[p + 2];
      if (r < mn[o]) mn[o] = r; if (r > mx[o]) mx[o] = r;
      if (g < mn[o + 1]) mn[o + 1] = g; if (g > mx[o + 1]) mx[o + 1] = g;
      if (bl < mn[o + 2]) mn[o + 2] = bl; if (bl > mx[o + 2]) mx[o + 2] = bl;
      const L = W[0] * LUT[r] + W[1] * LUT[g] + W[2] * LUT[bl];
      if (L < lmn[j]) lmn[j] = L; if (L > lmx[j]) lmx[j] = L;
    }
    if (f < FRAMES - 1) await h.page.waitForTimeout(STEP_MS);
  }
  return { mn, mx, lmn, lmx };
}

async function run(VW, VH) {
  // ---- pass 1: UNSELECTED. defines the shared pixel set and the reference ranges.
  const A = await boot(VW, VH, null);
  const clip = A.geo.clip, Wd = clip.width, Hd = clip.height, N = Wd * Hd;
  const cx = A.geo.cx - clip.x, cy = A.geo.cy - clip.y, R = A.geo.R;
  const idxAll = [];
  for (let y = 0; y < Hd; y++) for (let x = 0; x < Wd; x++) { const dx = x - cx, dy = y - cy;
    if (dx * dx + dy * dy <= R * R) idxAll.push(y * Wd + x); }
  const idx = Int32Array.from(idxAll);
  if (A.geo.waveGain !== "" && A.geo.waveGain !== null && A.geo.waveGain !== "1")
    throw new Error(`ABORT unselected --mf-wave-gain = ${A.geo.waveGain}`);
  if (A.geo.breath !== "LIVE") throw new Error(`ABORT breath ${A.geo.breath} in the live pass`);
  if (!A.geo.animation || A.geo.animation === "none") throw new Error(`ABORT no animation on .mf-wave-halo: ${A.geo.animation}`);
  const U = await sweep(A, clip, idx);
  const unselGeo = { selection: A.geo.selection, waveGain: A.geo.waveGain, animation: A.geo.animation, breath: A.geo.breath };
  await A.ctx.close(); await A.b.close();

  // ---- pass 2: SELECTED. same viewport, same clip, SAME pixel set.
  const B = await boot(VW, VH, SEL_CAPABILITY);
  if (B.geo.selection !== "CAPABILITY") throw new Error(`ABORT data-selection = ${B.geo.selection}, expected CAPABILITY`);
  if (B.geo.clip.x !== clip.x || B.geo.clip.y !== clip.y || B.geo.clip.width !== clip.width || B.geo.clip.height !== clip.height)
    throw new Error(`ABORT clip moved between states: ${JSON.stringify(B.geo.clip)} vs ${JSON.stringify(clip)}`);
  const gainSeen = parseFloat(B.geo.waveGain);
  if (!(Math.abs(gainSeen - SEL_GAIN) < 1e-9)) throw new Error(`ABORT selected --mf-wave-gain = ${B.geo.waveGain}, expected ${SEL_GAIN}`);
  const S = await sweep(B, clip, idx);
  const selGeo = { selection: B.geo.selection, waveGain: B.geo.waveGain, animation: B.geo.animation, breath: B.geo.breath };
  await B.ctx.close(); await B.b.close();

  // ---- per-pixel quantities
  const n = idx.length;
  const rows = [];
  for (let j = 0; j < n; j++) {
    const o = j * 3;
    const eU = [U.mx[o] - U.mn[o], U.mx[o + 1] - U.mn[o + 1], U.mx[o + 2] - U.mn[o + 2]];
    const eS = [S.mx[o] - S.mn[o], S.mx[o + 1] - S.mn[o + 1], S.mx[o + 2] - S.mn[o + 2]];
    const gU = eU[1], gS = eS[1];                                  // green: 0.7152 of luminance
    if (gU < RUNGS[0]) continue;
    const sumU = eU[0] + eU[1] + eU[2], sumS = eS[0] + eS[1] + eS[2];
    const lU = U.lmx[j] - U.lmn[j], lS = S.lmx[j] - S.lmn[j];
    // midpoint-preservation check and the point prediction, from the UNSELECTED range only
    let predL = 0, midDrift = 0;
    for (let k = 0; k < 3; k++) {
      const midU = (U.mx[o + k] + U.mn[o + k]) / 2, halfU = (U.mx[o + k] - U.mn[o + k]) / 2;
      const midS = (S.mx[o + k] + S.mn[o + k]) / 2;
      midDrift = Math.max(midDrift, Math.abs(midS - midU));
      predL += W[k] * (gf(midU + SEL_GAIN * halfU) - gf(midU - SEL_GAIN * halfU));
    }
    // per-pixel luminance quantum (§30's measure), at the unselected midpoint
    let q = 0;
    for (let k = 0; k < 3; k++) { const v = (U.mx[o + k] + U.mn[o + k]) / 2;
      q += W[k] * Math.abs(gf(Math.min(255, v + 1)) - gf(v)); }
    q *= 0.5;
    rows.push({ gU, gS, sumU, sumS, lU, lS, predL, midDrift, q,
      rE_green: gS > 0 ? gU / gS : null, rE_sum: sumS > 0 ? sumU / sumS : null,
      rL: lS > 0 ? lU / lS : null, pred: predL > 0 ? lS / predL : null,
      resol: gS > 0 ? 1 / gS : null, sq: q > 0 ? lS / q : null });
  }

  // ---- the ladder, reported WHOLE (§31)
  const ladder = RUNGS.map(t => {
    const sel = rows.filter(r => r.gU >= t);
    const rE = sel.map(r => r.rE_green).filter(v => v !== null);
    const rEs = sel.map(r => r.rE_sum).filter(v => v !== null);
    const rL = sel.map(r => r.rL).filter(v => v !== null);
    const pr = sel.map(r => r.pred).filter(v => v !== null);
    const mE = med(rE);
    // bootstrap the median of ratio_E over PIXELS — the aggregation term, measured not assumed
    let lo = null, hi = null;
    if (rE.length > 1) {
      const arr = Float64Array.from(rE), bs = new Float64Array(BOOT);
      let seed = 0x9e3779b9 ^ t;
      const rnd = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return ((seed >>> 0) / 4294967296); };
      for (let b = 0; b < BOOT; b++) { const smp = new Float64Array(arr.length);
        for (let i = 0; i < arr.length; i++) smp[i] = arr[(rnd() * arr.length) | 0];
        bs[b] = med(smp); }
      lo = pct(bs, 0.025); hi = pct(bs, 0.975);
    }
    return { rung_unselGreenSwing_codes: t, pixels: sel.length,
      medianGreenSwing_unsel: med(sel.map(r => r.gU)), medianGreenSwing_sel: med(sel.map(r => r.gS)),
      ratio_E_green_median: mE === null ? null : +mE.toFixed(5),
      ratio_E_green_p05: pct(rE, 0.05) === null ? null : +pct(rE, 0.05).toFixed(5),
      ratio_E_green_p95: pct(rE, 0.95) === null ? null : +pct(rE, 0.95).toFixed(5),
      ratio_E_green_boot95: lo === null ? null : [+lo.toFixed(5), +hi.toFixed(5)],
      ratio_E_sumRGB_median: med(rEs) === null ? null : +med(rEs).toFixed(5),
      ratio_L_median: med(rL) === null ? null : +med(rL).toFixed(5),
      pointPrediction_measuredOverPredicted_median: med(pr) === null ? null : +med(pr).toFixed(5),
      medianMidpointDrift_codes: med(sel.map(r => r.midDrift)),
      median_selSwing_in_quanta: med(sel.map(r => r.sq)) === null ? null : +med(sel.map(r => r.sq)).toFixed(3),
      perPixelQuantResolution_median: med(sel.map(r => r.resol)) === null ? null : +med(sel.map(r => r.resol)).toFixed(5),
      devFromCentre_pct: mE === null ? null : +(100 * (mE - EXPECT_RATIO) / EXPECT_RATIO).toFixed(3) };
  });
  const seq = ladder.map(r => r.ratio_E_green_median).filter(v => v !== null);
  let mono = "monotone"; let crossings = 0;
  for (let i = 1; i < seq.length; i++) {
    const a = seq[i - 1] - EXPECT_RATIO, b = seq[i] - EXPECT_RATIO;
    if (a === 0 || b === 0 || a * b < 0) crossings++;
  }
  for (let i = 2; i < seq.length; i++) if ((seq[i] - seq[i - 1]) * (seq[i - 1] - seq[i - 2]) < 0) mono = "NOT monotone";

  return { viewport: `${VW}x${VH}`, discPixels: idx.length, rowsAboveFloor: rows.length,
    unselGeo, selGeo, sharedMask: true, maskDefinedIn: "unselected, live, disc-scoped, green swing >= 4 codes",
    framesPerState: FRAMES, stepMs: STEP_MS,
    samplingMissBound_frac: +SAMPLING_MISS.toFixed(6),
    centre: +EXPECT_RATIO.toFixed(6), ladder,
    ladderMonotonicity: mono, centreCrossings: crossings };
}

const out = { commit: PINK_PROV_3ec8457d.observedCommit, stand: BASE, pin: "A-G412 probe (PINK §33)",
  claimUnderTest: "unselected swing / selected swing = 1/selectedGain = 2.857142857",
  spaceNote: "exact in ENCODED sRGB (compositing affine there); luminance ratio carries a convexity factor > 1",
  sourceFacts: { "WAVE.haloDepth@:122": 0.235, "WAVE.selectedGain@:122": SEL_GAIN,
    "mf-wave-halo mean@:274": MEAN, "mf-wave-halo depth@:274": DEPTH, "selected gain@:275": SEL_GAIN },
  runs: [] };
for (const [w, h] of [[1920, 1080], [1280, 800]]) out.runs.push(await run(w, h));
console.log(JSON.stringify(out, null, 1));
