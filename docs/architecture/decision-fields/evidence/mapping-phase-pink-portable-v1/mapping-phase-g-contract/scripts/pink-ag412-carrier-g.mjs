/** PINK · PHASE G · §33 limb 2 / A-G412 — the swing ratio ON THE CARRIER, with a POOLED estimator.
 *  Stand: PINK :3122, commit 3ec8457d. Follows pink-ag412-swingratio-g.mjs, whose two defects it repairs.
 *
 *  LIMB 1 FOUND TWO THINGS AND BOTH CHANGE THE INSTRUMENT.
 *
 *  (A) GELB's "at any pixel, on any backdrop" is FALSE as stated, and not because the ratio is wrong.
 *      Above an unselected green swing of ~12 codes the disc is dominated by a DIFFERENT animated
 *      population — 1191 px at 1920, 882 at 1280, median swing 99 codes, swing ratio EXACTLY 1.000 and
 *      measured/predicted 2.81–2.85, i.e. a carrier whose swing selection does not scale at all. The halo
 *      wave is not the only thing moving inside the disc, so a pixel is not a member of the claim's support
 *      merely by swinging. The claim is a property of the HALO CARRIER's pixels. A-F11's support problem
 *      again — this time in the probe's specification, not in my estimator.
 *      The mask is therefore defined BY SUPPRESSION, never by the ratio being tested: a pixel is
 *      halo-governed iff its live swing COLLAPSES when `.mf-wave-halo` is hidden. That criterion is
 *      independent of the hypothesis. Selecting pixels by "ratio ≈ 2.857" would be circular and is not done.
 *      A fourth sweep hides `.mf-travel` so the other carrier is NAMED rather than left as "something else".
 *
 *  (B) MY OWN ESTIMATOR WAS THE SECOND DEFECT, AND ITS CONFIDENCE INTERVAL WAS ZERO WIDE.
 *      median(gU/gS) over small integers is a LATTICE statistic: with median gU = 7 and gS = 3 it returns
 *      exactly 2.000, −30% from the centre, and the bootstrap reported [2.000, 2.000] — perfect precision
 *      on a value that is 30% wrong, because resampling cannot move a median off a lattice point. A
 *      zero-width interval is not a tight measurement; it is the signature of an estimator that cannot
 *      express the uncertainty it has. So the ratio is estimated POOLED — Σ gU / Σ gS over the mask — where
 *      the per-pixel quantisation residues average instead of locking, and the bootstrap can actually move.
 *      Both estimators are reported side by side so the lattice artefact is visible rather than fixed
 *      silently. §31's rule stands: the ladder is reported WHOLE.
 *
 *  WHAT THE CENTRE IS, AND IN WHICH SPACE. 2.8571 = 1/selectedGain is EXACT in encoded sRGB, because CSS
 *  composites group opacity affinely on the byte and both states share the mean (:274) and differ only in
 *  the depth multiplier (:275). WCAG luminance decodes that byte, so ratio_L carries a convexity factor
 *  above 1 (g''' > 0 for the 2.4 power) — reported, and predicted per pixel from each pixel's own measured
 *  midpoint and half-width by applying the decode rather than a Taylor series.
 *
 *  TOLERANCE IS THIS STAND's, NOT GELB's 0.16% MODEL BAND: quantisation (dominant, ~1 code / selected
 *  swing), sampling (bounded below, common-mode between states), aggregation (bootstrapped, not assumed).
 */
import { playwright, sharpModule, provenance } from "../../../mapping-phase-pink-tools/pink-tools.mjs";
const PINK_PROV_3ec8457d = await provenance({ declaredCommit: "3ec8457d" });
const chromium = await playwright();
const sharp = await sharpModule();
const BASE = process.env.PINK_BASE ?? "http://127.0.0.1:3122";
const AN = "CAN_00000000000000000000000000000002";
const URL = `${BASE}/career/demo?focus=MAPPING&investigationMode=PERSON&analysisId=${AN}`;

const MEAN = 0.8825, DEPTH = 0.1175, SEL_GAIN = 0.35, SEL_CAPABILITY = "PCAP_PG";
const EXPECT = 1 / SEL_GAIN;
const FRAMES = 33, STEP_MS = 310;
const SAMPLING_MISS = 1 - Math.cos((Math.PI * (STEP_MS / 2)) / 4000);
const COLLAPSE = 2;            // halo-governed iff swing with the halo hidden is <= 2 codes
const RUNGS = [4, 6, 8, 12, 16, 24, 32];
const BOOT = 600;

const LUT = new Float64Array(256);
for (let i = 0; i < 256; i++) { const c = i / 255; LUT[i] = c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
const W = [0.2126, 0.7152, 0.0722];
const gf = v => { const c = Math.min(1, Math.max(0, v / 255)); return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
const med = a => { if (!a.length) return null; const s = Float64Array.from(a).sort(); const n = s.length;
  return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
const pct = (a, p) => { if (!a.length) return null; const s = Float64Array.from(a).sort();
  return s[Math.min(s.length - 1, Math.max(0, Math.round(p * (s.length - 1))))]; };
const r5 = v => v === null || v === undefined ? null : +v.toFixed(5);

async function boot(VW, VH, select, hide) {
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
  if (hide) { await page.addStyleTag({ content: `${hide}{visibility:hidden !important}` }); await page.waitForTimeout(500); }
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
      animation: cs ? cs.animationName : null,
      counts: { halo: document.querySelectorAll('.mf-wave-halo').length,
                travel: document.querySelectorAll('.mf-travel').length,
                ground: document.querySelectorAll('.mf-wave-ground').length,
                wave: document.querySelectorAll('.mf-wave').length } };
  });
  const cdp = await page.context().newCDPSession(page);
  return { b, ctx, page, cdp, geo };
}

/** per-pixel per-channel min/max byte over one full period */
async function sweep(h, clip, idx) {
  const n = idx.length;
  const mn = new Uint8Array(n * 3).fill(255), mx = new Uint8Array(n * 3);
  for (let f = 0; f < FRAMES; f++) {
    const { data } = await h.cdp.send("Page.captureScreenshot", { format: "png", clip: { ...clip, scale: 1 }, optimizeForSpeed: true });
    const s = await sharp(Buffer.from(data, "base64")).raw().toBuffer({ resolveWithObject: true });
    const ch = s.info.channels, d = s.data;
    for (let j = 0; j < n; j++) {
      const p = idx[j] * ch, o = j * 3;
      for (let k = 0; k < 3; k++) { const v = d[p + k];
        if (v < mn[o + k]) mn[o + k] = v; if (v > mx[o + k]) mx[o + k] = v; }
    }
    if (f < FRAMES - 1) await h.page.waitForTimeout(STEP_MS);
  }
  return { mn, mx };
}

function bootPooled(num, den, seedIn) {
  const n = num.length; if (n < 2) return null;
  const bs = new Float64Array(BOOT); let seed = seedIn | 1;
  const rnd = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return ((seed >>> 0) / 4294967296); };
  for (let b = 0; b < BOOT; b++) { let a = 0, c = 0;
    for (let i = 0; i < n; i++) { const k = (rnd() * n) | 0; a += num[k]; c += den[k]; }
    bs[b] = c > 0 ? a / c : NaN; }
  const ok = Array.from(bs).filter(v => Number.isFinite(v));
  return [r5(pct(ok, 0.025)), r5(pct(ok, 0.975))];
}

async function run(VW, VH, withTravelLimb) {
  const A = await boot(VW, VH, null, null);
  const clip = A.geo.clip, Wd = clip.width, Hd = clip.height;
  const cx = A.geo.cx - clip.x, cy = A.geo.cy - clip.y, R = A.geo.R;
  const tmp = [];
  for (let y = 0; y < Hd; y++) for (let x = 0; x < Wd; x++) { const dx = x - cx, dy = y - cy;
    if (dx * dx + dy * dy <= R * R) tmp.push(y * Wd + x); }
  const idx = Int32Array.from(tmp);
  if (A.geo.breath !== "LIVE") throw new Error(`ABORT breath ${A.geo.breath}`);
  if (!A.geo.animation || A.geo.animation === "none") throw new Error(`ABORT no animation: ${A.geo.animation}`);
  if (A.geo.waveGain !== "" && A.geo.waveGain !== "1") throw new Error(`ABORT unselected gain ${A.geo.waveGain}`);
  const counts = A.geo.counts;
  const U = await sweep(A, clip, idx);
  await A.ctx.close(); await A.b.close();

  // halo suppressed, unselected: the mask criterion, independent of the hypothesis
  const Hh = await boot(VW, VH, null, ".mf-wave-halo");
  if (Hh.geo.clip.width !== clip.width || Hh.geo.clip.height !== clip.height) throw new Error("ABORT clip moved (halo-hidden pass)");
  const NH = await sweep(Hh, clip, idx);
  await Hh.ctx.close(); await Hh.b.close();

  const S = await boot(VW, VH, SEL_CAPABILITY, null);
  if (S.geo.selection !== "CAPABILITY") throw new Error(`ABORT data-selection ${S.geo.selection}`);
  if (Math.abs(parseFloat(S.geo.waveGain) - SEL_GAIN) > 1e-9) throw new Error(`ABORT selected gain ${S.geo.waveGain}`);
  if (S.geo.clip.width !== clip.width || S.geo.clip.height !== clip.height) throw new Error("ABORT clip moved (selected pass)");
  const SS = await sweep(S, clip, idx);
  await S.ctx.close(); await S.b.close();

  let travel = null;
  if (withTravelLimb) {
    const T = await boot(VW, VH, null, ".mf-travel");
    const NT = await sweep(T, clip, idx);
    await T.ctx.close(); await T.b.close();
    travel = NT;
  }

  const n = idx.length;
  const halo = [], foreign = [];
  for (let j = 0; j < n; j++) {
    const o = j * 3;
    const gU = U.mx[o + 1] - U.mn[o + 1];
    if (gU < RUNGS[0]) continue;
    const gH = NH.mx[o + 1] - NH.mn[o + 1];
    const gS = SS.mx[o + 1] - SS.mn[o + 1];
    const gT = travel ? travel.mx[o + 1] - travel.mn[o + 1] : null;
    let sumU = 0, sumS = 0, predL = 0, lU = 0, lS = 0, q = 0, midDrift = 0;
    for (let k = 0; k < 3; k++) {
      const uMin = U.mn[o + k], uMax = U.mx[o + k], sMin = SS.mn[o + k], sMax = SS.mx[o + k];
      sumU += uMax - uMin; sumS += sMax - sMin;
      const mid = (uMax + uMin) / 2, half = (uMax - uMin) / 2;
      midDrift = Math.max(midDrift, Math.abs((sMax + sMin) / 2 - mid));
      predL += W[k] * (gf(mid + SEL_GAIN * half) - gf(mid - SEL_GAIN * half));
      lU += W[k] * (gf(uMax) - gf(uMin)); lS += W[k] * (gf(sMax) - gf(sMin));
      q += W[k] * Math.abs(gf(Math.min(255, mid + 1)) - gf(mid));
    }
    q *= 0.5;
    const row = { gU, gS, gH, gT, sumU, sumS, lU, lS, predL, midDrift, q };
    (gH <= COLLAPSE ? halo : foreign).push(row);
  }

  const estimate = (rows, label) => RUNGS.map(t => {
    const sel = rows.filter(r => r.gU >= t);
    if (!sel.length) return { rung: t, pixels: 0 };
    const num = sel.map(r => r.gU), den = sel.map(r => r.gS);
    const pooledE = num.reduce((a, b) => a + b, 0) / Math.max(1e-12, den.reduce((a, b) => a + b, 0));
    const pooledSum = sel.reduce((a, r) => a + r.sumU, 0) / Math.max(1e-12, sel.reduce((a, r) => a + r.sumS, 0));
    const pooledL = sel.reduce((a, r) => a + r.lU, 0) / Math.max(1e-12, sel.reduce((a, r) => a + r.lS, 0));
    const medRatio = med(sel.filter(r => r.gS > 0).map(r => r.gU / r.gS));
    const predRatio = sel.reduce((a, r) => a + r.lS, 0) / Math.max(1e-12, sel.reduce((a, r) => a + r.predL, 0));
    return { rung: t, pixels: sel.length, label,
      medianSwing_unsel: med(num), medianSwing_sel: med(den),
      pooled_ratio_E_green: r5(pooledE), pooled_dev_pct: r5(100 * (pooledE - EXPECT) / EXPECT),
      pooled_boot95: bootPooled(num, den, 0x9e3779b9 ^ (t * 7919) ^ VW),
      pooled_ratio_E_sumRGB: r5(pooledSum),
      pooled_ratio_L: r5(pooledL), pooled_ratio_L_dev_pct: r5(100 * (pooledL - EXPECT) / EXPECT),
      LATTICE_median_of_ratios: r5(medRatio),
      LATTICE_median_dev_pct: medRatio === null ? null : r5(100 * (medRatio - EXPECT) / EXPECT),
      pointPrediction_measuredOverPredicted: r5(predRatio),
      median_selSwing_quanta: r5(med(sel.map(r => r.q > 0 ? r.lS / r.q : 0))),
      perPixel_quantResolution_median: r5(med(sel.filter(r => r.gS > 0).map(r => 1 / r.gS))),
      median_midpointDrift_codes: med(sel.map(r => r.midDrift)) };
  });

  const foreignTravelShare = travel && foreign.length
    ? r5(foreign.filter(r => r.gT !== null && r.gT <= COLLAPSE).length / foreign.length) : null;

  return { viewport: `${VW}x${VH}`, discPixels: idx.length,
    classCounts: { haloGoverned: halo.length, foreign: foreign.length,
      criterion: `halo-governed iff green swing with .mf-wave-halo hidden <= ${COLLAPSE} codes`,
      domCounts: counts },
    foreign_collapsesWhenTravelHidden_share: foreignTravelShare,
    foreign_medianSwing_unsel: med(foreign.map(r => r.gU)), foreign_medianSwing_sel: med(foreign.map(r => r.gS)),
    foreign_pooled_ratio_E_green: foreign.length ? r5(foreign.reduce((a, r) => a + r.gU, 0) / Math.max(1e-12, foreign.reduce((a, r) => a + r.gS, 0))) : null,
    framesPerState: FRAMES, stepMs: STEP_MS, samplingMissBound_frac: +SAMPLING_MISS.toFixed(6),
    centre: +EXPECT.toFixed(6),
    ladder_haloGoverned: estimate(halo, "halo"),
    ladder_foreign: estimate(foreign, "foreign") };
}

const out = { commit: PINK_PROV_3ec8457d.observedCommit, stand: BASE, pin: "A-G412 limb 2 (PINK §33)",
  claimUnderTest: "unselected swing / selected swing = 1/selectedGain = 2.857142857, on the HALO carrier",
  maskNote: "defined by SUPPRESSION of .mf-wave-halo, never by the ratio under test",
  estimatorNote: "pooled sum-ratio; median-of-ratios reported beside it as the lattice control",
  sourceFacts: { "WAVE.selectedGain@:122": SEL_GAIN, "mf-wave-halo mean@:274": MEAN, "depth@:274": DEPTH },
  runs: [] };
out.runs.push(await run(1920, 1080, true));
out.runs.push(await run(1280, 800, false));
console.log(JSON.stringify(out, null, 1));
