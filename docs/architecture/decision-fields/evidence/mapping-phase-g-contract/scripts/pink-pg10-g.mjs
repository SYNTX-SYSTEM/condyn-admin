/** PINK · PHASE G · PG-10 MEASURED on 3ec8457d, in BOTH motion states (GELB §46 / A-G167).
 *
 *  PIN, as amended:  A-G22 restated PG-10 on the VISIBLE GLOW (mean luminance >= 2 x local ground):
 *      limb 1   >= 25 % of pixels swing >= 0.004
 *      limb 2   median Weber fraction in [10 %, 35 %]
 *      limb 3   max swing <= 0.030                     (A-G26's suspension lifted; returns as written)
 *      negative limb (A-G48)  the SHELF glows' swing lies within the run's own static floor
 *  CARRIER  `.mf-wave-halo` -- field glows only (A-G48; PersonJobMappingField.tsx:670).
 *  DOMAIN   outside the body's own seat, which A-G97 makes an occluder.
 *  STATES   (a) unselected LIVE  and  (b) a capability selected, where `[data-selection="CAPABILITY"]`
 *           sets `--mf-wave-gain: 0.35` (:275), so the halo's opacity swing falls from 0.235 p-p
 *           (mean 0.8825 +/- 0.1175, :274) to 0.08225.
 *  PROVENANCE, carried per A-G143: 0.004 UNDERIVED, 0.25 UNDERIVED, [10 %, 35 %]
 *           CITED-WITHOUT-A-NUMBER (R17 named for the ceiling, no figure in the record). A clear is
 *           NOT reported as "PG-10 met".
 *
 *  ATTEMPT 1 WAS VOID (outputs/3ec8457d-tip/PG10-VOID-ATTEMPT1.json) ON THREE DEFECTS, ALL MINE:
 *   D1  the window was frame-driven (36 frames = 3.8 .. 8.2 s) against WAVE.periodMs = 10000, so every
 *       swing was a max-min over a FRACTION of one cycle -- 0.38 .. 0.82 periods. Now TIME-driven:
 *       capture until >= 13 s has elapsed, and refuse to emit a verdict if coverage < 1 full period.
 *   D2  the carrier was a GEOMETRIC annulus (seatEdge < d <= haloR), not the `.mf-wave-halo` element's
 *       own pixels. Travelling light, beams, arcs and text cross that annulus and their motion was
 *       counted as the breath. Proof it was wrong: the three RESTING shelf glows (animationName:none,
 *       A-F8) returned maxSwing up to 0.7925 -- a resting element cannot swing, so A-G48's negative
 *       limb falsified the instrument rather than the build. Now the carrier is a MEASURED MASK:
 *       the pixels where hiding `.mf-wave-halo` changes the static render, minus the pixels where
 *       hiding the foreign carriers changes it. Nothing is suppressed in the measured frames -- the
 *       masks are derived in a separate static pass and every element stays drawn (defect nineteen).
 *   D3  local ground was sampled over a region that still contained foreign light, so it read low and
 *       the ">= 2 x local ground" visibility test admitted 63 .. 79 % of the annulus -- near-vacuous
 *       for a ramp that decays to 0 at its edge. Now sampled only outside every measured mask.
 *
 *  THE WEBER FRACTION HAS NO DECLARED READING. A-G22 gives "median Weber fraction" and a value
 *  (20.6 % / 22.6 %) but never the ratio. Four readings are defensible and they do not agree, so this
 *  instrument reports ALL FOUR rather than picking one -- the A-G16-criterion error, not repeated.
 */
const PW = process.env.CONDYN_PLAYWRIGHT_MODULE ?? "/home/codi/Entwicklung/nquiry/node_modules/playwright/index.mjs";
const SHARP = process.env.CONDYN_SHARP_MODULE ?? "/home/codi/Entwicklung/condyn-admin-pink-visual-g/node_modules/sharp/lib/index.js";
const { chromium } = await import(PW);
const sharp = (await import(SHARP)).default;
const BASE = process.env.PINK_BASE ?? "http://127.0.0.1:3122";
const AN = "CAN_00000000000000000000000000000002";
const URL = `${BASE}/career/demo?focus=MAPPING&investigationMode=PERSON&analysisId=${AN}`;
const LUT = new Float64Array(256);
for (let i = 0; i < 256; i++) { const c = i / 255; LUT[i] = c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
const PERIOD_MS = 10000, WINDOW_MS = +(process.env.PINK_WINDOW_MS || 13000), MASK_EPS = 1e-4;
const FOREIGN = '.mf-travel, .mf-beam-glow, [data-beam], text, [data-mapping-arc], [data-mapping-node], [data-mapping-trail], [data-testid^="mapping-measure-"]';
const median = a => { if (!a.length) return null; const s = Float64Array.from(a).sort(); const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

const clipOf = page => page.evaluate(() => {
  const svg = document.querySelector('[data-testid="mapping-field-svg"]') ?? document.querySelector('[data-mapping-body]')?.closest('svg');
  const r = svg.getBoundingClientRect();
  return { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) };
});

const geometry = page => page.evaluate(() => {
  const svg = document.querySelector('[data-testid="mapping-field-svg"]') ?? document.querySelector('[data-mapping-body]')?.closest('svg');
  const sr = svg.getBoundingClientRect();
  const ox = Math.round(sr.x), oy = Math.round(sr.y);
  const field = document.querySelector('[data-testid="mapping-field"]');
  const bodies = [...document.querySelectorAll('[data-mapping-body]')].map(el => {
    const sh = el.querySelector('[data-mapping-body-shape]'), r = sh.getBoundingClientRect();
    const marked = el.getAttribute("data-marked") === "true";
    return { rank: +el.getAttribute("data-rank"), cls: el.getAttribute("data-class"),
             shelf: el.getAttribute("data-shelf") === "true", marked,
             cx: r.x + r.width / 2 - ox, cy: r.y + r.height / 2 - oy,
             rBody: (r.width - (marked ? 2 : 1.2 * 1.002)) / 2,
             seatHalf: marked ? 1.8 : (1.2 * 1.002 + 1.6) / 2 };
  });
  const carriers = [...document.querySelectorAll('.mf-halo')].map(g => {
    const c = g.querySelector('circle'), r = c.getBoundingClientRect(), cs = getComputedStyle(c);
    return { isField: c.classList.contains('mf-wave-halo'),
             animationName: cs.animationName, animationDuration: cs.animationDuration,
             cx: r.x + r.width / 2 - ox, cy: r.y + r.height / 2 - oy, haloR: r.width / 2 };
  });
  for (const c of carriers) {
    let best = null, bd = Infinity;
    for (const b of bodies) { const d = Math.hypot(b.cx - c.cx, b.cy - c.cy); if (d < bd) { bd = d; best = b; } }
    c.rank = best?.rank ?? null; c.cls = best?.cls ?? null; c.rBody = best?.rBody ?? null;
    c.seatEdgeR = best ? best.rBody + best.seatHalf : null; c.centreDelta = +bd.toFixed(3);
  }
  const hv = el => getComputedStyle(el);
  return { carriers, bodies, selection: field?.getAttribute("data-selection") ?? "",
    waveGain: hv(document.querySelector('.mf-wave-halo') ?? field).getPropertyValue('--mf-wave-gain').trim(),
    waveMean: hv(document.querySelector('.mf-wave-halo') ?? field).getPropertyValue('--mf-wave-mean').trim(),
    waveDepth: hv(document.querySelector('.mf-wave-halo') ?? field).getPropertyValue('--mf-wave-depth').trim() };
});

async function grab(cdp, sharpFn, clip, N) {
  const { data } = await cdp.send("Page.captureScreenshot", { format: "png", clip: { ...clip, scale: 1 }, optimizeForSpeed: true });
  const s = await sharpFn(Buffer.from(data, "base64")).raw().toBuffer({ resolveWithObject: true });
  const ch = s.info.channels, d = s.data, L = new Float32Array(N);
  for (let i = 0; i < N; i++) { const q = i * ch; L[i] = 0.2126 * LUT[d[q]] + 0.7152 * LUT[d[q + 1]] + 0.0722 * LUT[d[q + 2]]; }
  return L;
}

/** D2: derive the carrier and foreign footprints by HIDING each in a separate STATIC pass and
 *  differencing. The measured frames are taken with everything drawn. */
async function masks(page, cdp, clip, N) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForTimeout(1200);
  const base = await grab(cdp, sharp, clip, N);
  const hide = async sel => { const h = await page.addStyleTag({ content: `${sel} { visibility: hidden !important; }` });
    await page.waitForTimeout(500); const L = await grab(cdp, sharp, clip, N);
    await page.evaluate(() => {}); await h.evaluate(e => e.remove()); await page.waitForTimeout(400); return L; };
  const noCarrier = await hide('.mf-wave-halo');
  const noForeign = await hide(FOREIGN);
  const carrier = new Uint8Array(N), foreign = new Uint8Array(N);
  for (let i = 0; i < N; i++) {
    if (Math.abs(base[i] - noCarrier[i]) > MASK_EPS) carrier[i] = 1;
    if (Math.abs(base[i] - noForeign[i]) > MASK_EPS) foreign[i] = 1;
  }
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.waitForTimeout(900);
  let nc = 0, nf = 0, both = 0;
  for (let i = 0; i < N; i++) { if (carrier[i]) nc++; if (foreign[i]) nf++; if (carrier[i] && foreign[i]) both++; }
  return { carrier, foreign, counts: { carrierPx: nc, foreignPx: nf, overlapPx: both } };
}

async function measure(page, cdp, clip, N, W, H, mask, label) {
  const geo = await geometry(page);
  const mn = new Float32Array(N).fill(Infinity), mx = new Float32Array(N).fill(-Infinity), sum = new Float64Array(N);
  const t0 = Date.now(); let frames = 0;
  while (Date.now() - t0 < WINDOW_MS) {
    const L = await grab(cdp, sharp, clip, N);
    for (let i = 0; i < N; i++) { if (L[i] < mn[i]) mn[i] = L[i]; if (L[i] > mx[i]) mx[i] = L[i]; sum[i] += L[i]; }
    frames++;
  }
  const elapsed = Date.now() - t0;

  const perCarrier = [];
  for (const c of geo.carriers) {
    if (c.seatEdgeR == null) continue;
    const R2 = c.haloR * 1.30;
    const x0 = Math.max(0, Math.floor(c.cx - R2)), x1 = Math.min(W - 1, Math.ceil(c.cx + R2));
    const y0 = Math.max(0, Math.floor(c.cy - R2)), y1 = Math.min(H - 1, Math.ceil(c.cy + R2));
    // local ground: outside the halo, inside the disc, and in NEITHER measured mask
    const gnd = [];
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const d = Math.hypot(x - c.cx, y - c.cy), i = y * W + x;
      if (d > c.haloR * 1.05 && d <= R2 && !mask.carrier[i] && !mask.foreign[i]) gnd.push(sum[i] / frames);
    }
    const localGround = median(gnd);
    // carrier domain: the MEASURED carrier mask, outside the seat, with foreign pixels excluded
    const sw = [], me = [], mi = [];
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const d = Math.hypot(x - c.cx, y - c.cy), i = y * W + x;
      if (d <= c.seatEdgeR || d > c.haloR) continue;
      if (!mask.carrier[i] || mask.foreign[i]) continue;
      sw.push(mx[i] - mn[i]); me.push(sum[i] / frames); mi.push(mn[i]);
    }
    const idxVis = localGround != null ? me.map((v, j) => (v >= 2 * localGround ? j : -1)).filter(j => j >= 0) : [];
    const stat = idx => {
      if (!idx.length) return { n: 0 };
      const S = idx.map(j => sw[j]);
      return { n: idx.length,
        fracSwingGe004: +(S.filter(v => v >= 0.004).length / idx.length).toFixed(5),
        maxSwing: +Math.max(...S).toFixed(6), medianSwing: +median(S).toFixed(6),
        W_mod: +median(idx.map(j => sw[j] / me[j])).toFixed(5),
        W_min: +median(idx.map(j => sw[j] / Math.max(mi[j], 1e-9))).toFixed(5),
        W_grd: localGround ? +median(idx.map(j => sw[j] / localGround)).toFixed(5) : null,
        W_sta: localGround ? +median(idx.map(j => (me[j] - localGround) / localGround)).toFixed(5) : null };
    };
    perCarrier.push({ isField: c.isField, rank: c.rank, cls: c.cls,
      animationName: c.animationName, animationDuration: c.animationDuration,
      rBody: +c.rBody.toFixed(3), seatEdgeR: +c.seatEdgeR.toFixed(3), haloR: +c.haloR.toFixed(3),
      centreDelta: c.centreDelta, localGround: localGround != null ? +localGround.toFixed(7) : null,
      carrierMaskPx: sw.length, visiblePx: idxVis.length,
      visibleShare: sw.length ? +(idxVis.length / sw.length).toFixed(5) : null,
      carrierMask: stat(sw.map((_, j) => j)), visibleGlow: stat(idxVis) });
  }
  const fieldC = perCarrier.filter(c => c.isField && c.visibleGlow.n > 0);
  const shelfC = perCarrier.filter(c => !c.isField);
  return { label, selection: geo.selection, waveGain: geo.waveGain || "(unset => 1)",
    waveMean: geo.waveMean, waveDepth: geo.waveDepth,
    frames, elapsedMs: elapsed, periodsCovered: +(elapsed / PERIOD_MS).toFixed(2),
    periodCoverageAdequate: elapsed >= PERIOD_MS,
    verdictAdmissible: elapsed >= PERIOD_MS,
    maskCounts: mask.counts, region: `${W}x${H}`,
    perCarrier,
    limb1_fracPerFieldCarrier: fieldC.map(c => c.visibleGlow.fracSwingGe004),
    limb1_pass: fieldC.length ? fieldC.every(c => c.visibleGlow.fracSwingGe004 >= 0.25) : null,
    limb2_W_mod_perFieldCarrier: fieldC.map(c => c.visibleGlow.W_mod),
    limb2_W_grd_perFieldCarrier: fieldC.map(c => c.visibleGlow.W_grd),
    limb3_maxSwing: fieldC.length ? +Math.max(...fieldC.map(c => c.visibleGlow.maxSwing)).toFixed(6) : null,
    limb3_pass: fieldC.length ? fieldC.every(c => c.visibleGlow.maxSwing <= 0.030) : null,
    negativeLimb_shelfMaxSwing: shelfC.length ? +Math.max(...shelfC.map(c => c.carrierMask.maxSwing ?? 0)).toFixed(6) : null,
    negativeLimb_perShelfCarrier: shelfC.map(c => ({ rank: c.rank, animationName: c.animationName, maxSwing: c.carrierMask.maxSwing })) };
}

async function run(VW, VH) {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: 1, reducedMotion: "no-preference" });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForSelector('[data-testid="mapping-field"]', { timeout: 30000 });
  await page.waitForTimeout(2000);
  while (await page.locator('[data-testid="guided-onboarding-overlay"]').count() > 0) {
    await page.locator('[data-testid="onboarding-close-btn"]').first().click().catch(() => {});
    await page.keyboard.press("Escape").catch(() => {});
    await page.waitForTimeout(400);
  }
  const cdp = await page.context().newCDPSession(page);
  const clip = await clipOf(page), W = clip.width, H = clip.height, N = W * H;
  const states = [];
  let mask = await masks(page, cdp, clip, N);
  states.push(await measure(page, cdp, clip, N, W, H, mask, "(a) unselected LIVE"));
  const cap = page.locator('[data-testid^="mapping-capability-"][data-mapping-node]').first();
  if (await cap.count() > 0) {
    await cap.click({ force: true }).catch(() => {});
    await page.waitForTimeout(1500);
    const sel = await page.getAttribute('[data-testid="mapping-field"]', "data-selection").catch(() => null);
    if (sel === "CAPABILITY") {
      mask = await masks(page, cdp, clip, N);   // selection changes what is drawn -> re-derive
      states.push(await measure(page, cdp, clip, N, W, H, mask, "(b) capability selected, gain 0.35"));
    } else states.push({ label: "(b) capability selected", notRun: `click did not reach CAPABILITY (data-selection=${sel})` });
  } else states.push({ label: "(b) capability selected", notRun: "no capability node at this level" });
  await ctx.close(); await b.close();
  return { viewport: `${VW}x${VH}`, states };
}

console.log(JSON.stringify({
  commit: "3ec8457d", buildId: "xCD8LBxdjnP97-2Gjs5yr",
  pin: "PG-10 (A-G22 restated, A-G48 carrier, A-G26 max limb restored, A-G97 seat occluder)",
  limbs: { limb1: ">= 25 % of visible-glow pixels swing >= 0.004", limb2: "median Weber in [10 %, 35 %]",
           limb3: "max swing <= 0.030", negative: "shelf glows rest within the run's static floor" },
  provenance: { "0.004": "UNDERIVED", "0.25": "UNDERIVED", "[10%,35%]": "CITED-WITHOUT-A-NUMBER (R17, no figure in record)",
                note: "a clear is NOT reported as 'PG-10 met' (A-G143)" },
  weberReadingUndeclared: ["W_mod=(max-min)/mean", "W_min=(max-min)/min", "W_grd=(max-min)/localGround", "W_sta=(mean-localGround)/localGround"],
  method: { carrier: "MEASURED mask: pixels where hiding .mf-wave-halo changes the static render, minus foreign-mask pixels",
            foreign: FOREIGN, maskEps: MASK_EPS, windowMs: WINDOW_MS, periodMs: PERIOD_MS,
            note: "masks derived in a separate static pass; every element stays drawn in the measured frames" },
  waveModel: { periodMs: PERIOD_MS, haloMean: 0.8825, haloDepth: 0.1175, pkpk_unselected: 0.235, selectedGain: 0.35, pkpk_selected: 0.08225 },
  runs: [await run(1920, 1080), await run(1280, 800)],
}, null, 1));
