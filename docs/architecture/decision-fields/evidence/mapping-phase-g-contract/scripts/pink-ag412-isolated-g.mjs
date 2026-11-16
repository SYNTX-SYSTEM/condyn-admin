/** PINK · PHASE G · §33 limb 3 / A-G412 — the swing ratio with the HALO ALONE IN MOTION.
 *  Stand: PINK :3122, commit 3ec8457d. Third and final instrument for GELB's centre of 2.8571.
 *
 *  WHY LIMBS 1 AND 2 COULD NOT ANSWER IT, which is the finding and not an excuse.
 *  An enumeration of every animated element inside the field (computed animationName, both states) gives
 *  FOUR keyframe families, not one:
 *      mappingFieldWave      10s    7 × circle.mf-wave.mf-wave-ground   +  2 × circle.mf-wave.mf-wave-halo
 *      mappingFieldTravel    10s    3 × line.mf-travel  UNSELECTED  ->  4 × line.mf-travel  SELECTED
 *      mappingFieldEvidence  0.28s  6 × g               both states
 *      mappingFieldQuery     1.4s   ABSENT unselected   ->  1 × g  SELECTED
 *  Three consequences, each fatal to "at any pixel, on any backdrop":
 *   (a) peak-to-peak is an EXTREME-VALUE statistic over the SUM of all carriers at a pixel. A carrier
 *       swinging 80–99 codes buries one swinging 7–13, so max−min at a mixed pixel is not the halo's swing.
 *       §28's lesson, one level up: I applied it to my noise floor and not to my signal statistic.
 *   (b) SELECTION CHANGES THE CARRIER POPULATION. It does not merely scale the wave: it adds a fourth
 *       travel line and a query group. So the two states are not the same scene at different gain, and a
 *       swing ratio over the raw scene is a ratio between two different compositions.
 *   (c) mappingFieldEvidence runs at 0.28s. No practical screenshot cadence resolves it — at 310ms it is
 *       aliased outright. Its peak-to-peak is sampled essentially at random, in BOTH states.
 *  Limb 2's suppression mask could not repair (a): hiding a carrier removes it, but what contaminates the
 *  halo's peak-to-peak is the OTHER carriers' excursions at the same pixels, so the pooled ratio came out
 *  1.33–1.48 (1920) and 1.12–1.43 (1280) — nowhere near the centre, and the deficit was my statistic.
 *
 *  THE REPAIR. Every animation in the field is PAUSED and only `.mf-wave.mf-wave-halo` is left running, in
 *  BOTH states. Pausing freezes the backdrop without removing anything from the composite, so the halo
 *  still composites over the same stack it normally does. Then max−min at a pixel IS the halo's own swing.
 *  Asserted, not assumed: the eval reads animationPlayState back and aborts unless the halo is `running`
 *  and the travel and ground are `paused`.
 *
 *  AND THE BACKDROP IS HELD IDENTICAL BY A CRITERION INDEPENDENT OF THE RATIO. Because selection adds
 *  carriers, a paused selected scene can still differ from a paused unselected one at a pixel the new
 *  travel line or query group covers. Such pixels are excluded by their MIDPOINT DRIFT — |mid_sel −
 *  mid_unsel| > MAX_DRIFT codes — which is a statement about the static backdrop and says nothing about
 *  the swing. ΔE = Δa·(S−D) is affine in the group opacity, so with D equal in both states the encoded
 *  swing ratio is Δa_unsel/Δa_sel = 1/selectedGain EXACTLY, whatever D is.
 *
 *  ESTIMATOR: POOLED Σ(unsel)/Σ(sel), never median-of-ratios, which limb 1 showed to be a LATTICE
 *  statistic returning exactly 2.000 with a bootstrap of [2.000, 2.000] — a zero-width interval on a value
 *  30% wrong. The lattice median is still printed beside it as the control.
 *  TOLERANCE from this stand: quantisation (dominant), sampling (bounded, common-mode), aggregation
 *  (bootstrapped over pixels). The ladder is reported WHOLE, per §31 — no single rung is the answer.
 */
const PW = process.env.CONDYN_PLAYWRIGHT_MODULE ?? "/home/codi/Entwicklung/nquiry/node_modules/playwright/index.mjs";
const SHARP = process.env.CONDYN_SHARP_MODULE ?? "/home/codi/Entwicklung/condyn-admin-pink-visual-g/node_modules/sharp/lib/index.js";
const { chromium } = await import(PW);
const sharp = (await import(SHARP)).default;
const BASE = process.env.PINK_BASE ?? "http://127.0.0.1:3122";
const AN = "CAN_00000000000000000000000000000002";
const URL = `${BASE}/career/demo?focus=MAPPING&investigationMode=PERSON&analysisId=${AN}`;

const SEL_GAIN = 0.35, SEL_CAPABILITY = "PCAP_PG", EXPECT = 1 / SEL_GAIN;
const FRAMES = 41, STEP_MS = 250;
const SAMPLING_MISS = 1 - Math.cos((Math.PI * (STEP_MS / 2)) / 4000);
const MAX_DRIFT = 1;                       // codes of static-backdrop drift tolerated between states
const RUNGS = [3, 4, 6, 8, 12, 16, 24];    // unselected green swing, codes
const BOOT = 600;
const ISOLATE = `[data-testid="mapping-field"], [data-testid="mapping-field"] * { animation-play-state: paused !important; }
                 circle.mf-wave.mf-wave-halo { animation-play-state: running !important; }`;

const W = [0.2126, 0.7152, 0.0722];
const gf = v => { const c = Math.min(1, Math.max(0, v / 255)); return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
const med = a => { if (!a.length) return null; const s = Float64Array.from(a).sort(); const n = s.length;
  return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
const pct = (a, p) => { if (!a.length) return null; const s = Float64Array.from(a).sort();
  return s[Math.min(s.length - 1, Math.max(0, Math.round(p * (s.length - 1))))]; };
const r5 = v => (v === null || v === undefined || !Number.isFinite(v)) ? null : +v.toFixed(5);

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
  await page.addStyleTag({ content: ISOLATE });
  await page.waitForTimeout(600);
  const geo = await page.evaluate(() => {
    const svg = document.querySelector('[data-testid="mapping-field-svg"]');
    const sr = svg.getBoundingClientRect();
    const fr = document.querySelector('[data-testid="mapping-ring-field"]').getBoundingClientRect();
    const fe = document.querySelector('[data-testid="mapping-field"]');
    const state = sel => { const out = []; document.querySelectorAll(sel).forEach(el => {
      const cs = getComputedStyle(el); out.push(`${cs.animationName}:${cs.animationPlayState}`); }); return out; };
    const halo = document.querySelector('.mf-wave-halo');
    const cs = halo ? getComputedStyle(halo) : null;
    return { clip: { x: Math.round(sr.x), y: Math.round(sr.y), width: Math.round(sr.width), height: Math.round(sr.height) },
      cx: fr.x + fr.width / 2, cy: fr.y + fr.height / 2, R: fr.width / 2,
      selection: fe.getAttribute('data-selection'), breath: fe.getAttribute('data-breath'),
      waveGain: cs ? cs.getPropertyValue('--mf-wave-gain').trim() : null,
      playState: { halo: state('circle.mf-wave.mf-wave-halo'), ground: state('circle.mf-wave.mf-wave-ground'),
                   travel: state('line.mf-travel') } };
  });
  const cdp = await page.context().newCDPSession(page);
  return { b, ctx, page, cdp, geo };
}

function assertIsolated(g, where) {
  if (!g.playState.halo.length) throw new Error(`ABORT ${where}: no halo found`);
  for (const s of g.playState.halo) if (!s.endsWith(":running")) throw new Error(`ABORT ${where}: halo not running (${s})`);
  for (const k of ["ground", "travel"]) for (const s of g.playState[k])
    if (!s.endsWith(":paused")) throw new Error(`ABORT ${where}: ${k} not paused (${s})`);
}

async function sweep(h, clip, idx) {
  const n = idx.length;
  const mn = new Uint8Array(n * 3).fill(255), mx = new Uint8Array(n * 3);
  for (let f = 0; f < FRAMES; f++) {
    const { data } = await h.cdp.send("Page.captureScreenshot", { format: "png", clip: { ...clip, scale: 1 }, optimizeForSpeed: true });
    const s = await sharp(Buffer.from(data, "base64")).raw().toBuffer({ resolveWithObject: true });
    const ch = s.info.channels, d = s.data;
    for (let j = 0; j < n; j++) { const p = idx[j] * ch, o = j * 3;
      for (let k = 0; k < 3; k++) { const v = d[p + k];
        if (v < mn[o + k]) mn[o + k] = v; if (v > mx[o + k]) mx[o + k] = v; } }
    if (f < FRAMES - 1) await h.page.waitForTimeout(STEP_MS);
  }
  return { mn, mx };
}

function bootPooled(num, den, seedIn) {
  const n = num.length; if (n < 2) return null;
  const bs = []; let seed = (seedIn | 1) >>> 0;
  const rnd = () => { seed ^= seed << 13; seed >>>= 0; seed ^= seed >>> 17; seed ^= seed << 5; seed >>>= 0; return seed / 4294967296; };
  for (let b = 0; b < BOOT; b++) { let a = 0, c = 0;
    for (let i = 0; i < n; i++) { const k = (rnd() * n) | 0; a += num[k]; c += den[k]; }
    if (c > 0) bs.push(a / c); }
  return bs.length ? [r5(pct(bs, 0.025)), r5(pct(bs, 0.975))] : null;
}

async function run(VW, VH) {
  const A = await boot(VW, VH, null);
  assertIsolated(A.geo, "unselected");
  if (A.geo.breath !== "LIVE") throw new Error(`ABORT breath ${A.geo.breath}`);
  if (A.geo.waveGain !== "" && A.geo.waveGain !== "1") throw new Error(`ABORT unselected gain "${A.geo.waveGain}"`);
  const clip = A.geo.clip, Wd = clip.width, Hd = clip.height;
  const cx = A.geo.cx - clip.x, cy = A.geo.cy - clip.y, R = A.geo.R;
  const tmp = [];
  for (let y = 0; y < Hd; y++) for (let x = 0; x < Wd; x++) { const dx = x - cx, dy = y - cy;
    if (dx * dx + dy * dy <= R * R) tmp.push(y * Wd + x); }
  const idx = Int32Array.from(tmp);
  const U = await sweep(A, clip, idx);
  await A.ctx.close(); await A.b.close();

  const S = await boot(VW, VH, SEL_CAPABILITY);
  assertIsolated(S.geo, "selected");
  if (S.geo.selection !== "CAPABILITY") throw new Error(`ABORT data-selection ${S.geo.selection}`);
  if (Math.abs(parseFloat(S.geo.waveGain) - SEL_GAIN) > 1e-9) throw new Error(`ABORT selected gain ${S.geo.waveGain}`);
  if (S.geo.clip.width !== clip.width || S.geo.clip.height !== clip.height) throw new Error("ABORT clip moved");
  const SS = await sweep(S, clip, idx);
  await S.ctx.close(); await S.b.close();

  const rows = [], dropped = [];
  for (let j = 0; j < idx.length; j++) {
    const o = j * 3;
    const gU = U.mx[o + 1] - U.mn[o + 1];
    if (gU < RUNGS[0]) continue;
    let drift = 0, sumU = 0, sumS = 0, lU = 0, lS = 0, predL = 0, q = 0;
    for (let k = 0; k < 3; k++) {
      const uMin = U.mn[o + k], uMax = U.mx[o + k], sMin = SS.mn[o + k], sMax = SS.mx[o + k];
      const mid = (uMax + uMin) / 2, half = (uMax - uMin) / 2;
      drift = Math.max(drift, Math.abs((sMax + sMin) / 2 - mid));
      sumU += uMax - uMin; sumS += sMax - sMin;
      lU += W[k] * (gf(uMax) - gf(uMin)); lS += W[k] * (gf(sMax) - gf(sMin));
      predL += W[k] * (gf(mid + SEL_GAIN * half) - gf(mid - SEL_GAIN * half));
      q += W[k] * Math.abs(gf(Math.min(255, mid + 1)) - gf(mid));
    }
    q *= 0.5;
    const row = { gU, gS: SS.mx[o + 1] - SS.mn[o + 1], sumU, sumS, lU, lS, predL, q, drift };
    (drift <= MAX_DRIFT ? rows : dropped).push(row);
  }

  const ladder = RUNGS.map(t => {
    const sel = rows.filter(r => r.gU >= t);
    if (!sel.length) return { rung: t, pixels: 0 };
    const num = sel.map(r => r.gU), den = sel.map(r => r.gS);
    const sum = a => a.reduce((x, y) => x + y, 0);
    const pooledE = sum(num) / Math.max(1e-12, sum(den));
    const pooledSum = sum(sel.map(r => r.sumU)) / Math.max(1e-12, sum(sel.map(r => r.sumS)));
    const pooledL = sum(sel.map(r => r.lU)) / Math.max(1e-12, sum(sel.map(r => r.lS)));
    const lat = med(sel.filter(r => r.gS > 0).map(r => r.gU / r.gS));
    return { rung: t, pixels: sel.length,
      medianSwing_unsel: med(num), medianSwing_sel: med(den),
      pooled_ratio_E_green: r5(pooledE), dev_pct: r5(100 * (pooledE - EXPECT) / EXPECT),
      pooled_boot95: bootPooled(num, den, 0x9e3779b9 ^ (t * 7919) ^ VW),
      pooled_ratio_E_sumRGB: r5(pooledSum),
      pooled_ratio_L: r5(pooledL), ratio_L_dev_pct: r5(100 * (pooledL - EXPECT) / EXPECT),
      LATTICE_median_of_ratios: r5(lat),
      pointPrediction_measuredOverPredicted: r5(sum(sel.map(r => r.lS)) / Math.max(1e-12, sum(sel.map(r => r.predL)))),
      median_selSwing_quanta: r5(med(sel.map(r => r.q > 0 ? r.lS / r.q : 0))),
      perPixel_quantResolution_median: r5(med(sel.filter(r => r.gS > 0).map(r => 1 / r.gS))),
      median_drift_codes: med(sel.map(r => r.drift)) };
  });
  const seq = ladder.filter(l => l.pixels).map(l => l.pooled_ratio_E_green);
  let mono = "monotone";
  for (let i = 2; i < seq.length; i++) if ((seq[i] - seq[i - 1]) * (seq[i - 1] - seq[i - 2]) < 0) mono = "NOT monotone";

  return { viewport: `${VW}x${VH}`, discPixels: idx.length,
    isolation: "all field animations paused; only circle.mf-wave.mf-wave-halo running — asserted via animationPlayState",
    playState_unsel: A.geo.playState, playState_sel: S.geo.playState,
    kept: rows.length, droppedForBackdropDrift: dropped.length, maxDriftCodes: MAX_DRIFT,
    framesPerState: FRAMES, stepMs: STEP_MS, samplingMissBound_frac: +SAMPLING_MISS.toFixed(6),
    centre: +EXPECT.toFixed(6), ladder, ladderMonotonicity: mono };
}

const out = { commit: "3ec8457d", stand: BASE, pin: "A-G412 limb 3 (PINK §33)",
  claimUnderTest: "unselected swing / selected swing = 1/selectedGain = 2.857142857",
  spaceNote: "exact in ENCODED sRGB; the luminance ratio carries a convexity factor above 1",
  runs: [] };
for (const [w, h] of [[1920, 1080], [1280, 800]]) out.runs.push(await run(w, h));
console.log(JSON.stringify(out, null, 1));
