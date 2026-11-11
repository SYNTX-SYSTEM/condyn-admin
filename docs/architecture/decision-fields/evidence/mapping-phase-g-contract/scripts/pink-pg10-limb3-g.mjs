/** PINK · PHASE G · PG-10 LIMB 3: THE FLOOR ON THE CARRIER MASK, which is the thing both lanes already
 *  agreed was binding and which neither has measured.
 *
 *  A-G195 (§50) says limb 3 is not runnable, for two reasons:
 *    (i)  "the static noise floor is 0.031872, above both numbers"
 *    (ii) "the co-registration step does not exist in either lane's instrument"
 *  Both are answered by the table in GELB's OWN record at the section that lifted A-G26's suspension:
 *    - 0.031872 is the WHOLE-REGION max at `9cc06f84` on the translucent ground. On `3ec8457d` the same
 *      record prints disc max 0.000000 / 0.000000 and whole-region max 0.005939 / 0.006077. A-G54 --
 *      GELB's own rule, "a floor is a property of a build, not of a lane" -- forbids carrying 0.031872
 *      onto this build, and that section applied A-G54 to THIS limb and restored it "as written
 *      (<= 0.030)", explicitly retiring A-G26's distributional ceiling "as unnecessary".
 *    - a static swing of exactly 0.000000 inside the disc over 24 frames, with the field provably
 *      motionless, IS a co-registration measurement. Sub-pixel registration error cannot give zero
 *      swing at an interior edge. So co-registration is measured on this build, not assumed.
 *  What is genuinely NOT yet measured is the floor on the CARRIER MASK. That is PINK's own §4 caveat,
 *  which GELB adopted verbatim as binding: field halo pixels can reach r/R ~ 1 where the disc-edge
 *  floor is ~0.006 rather than 0, so "the per-run floor must be measured on the carrier mask, not on
 *  the disc, or the limb inherits a floor it was never measured against."
 *
 *  This measures, on the SAME carrier mask, in the SAME run:
 *    STATIC floor  (reducedMotion: reduce, field motionless) -- per-pixel swing distribution
 *    LIVE  swing   (reducedMotion: no-preference, >= 1 breath period) -- per-pixel swing distribution
 *  and reports percentiles for both, so the verdict is distributional (A-F11) and the bound is compared
 *  against the floor of the thing it bounds (asymmetric admissibility: a RED needs signal clearly above
 *  the floor). A-G26's p999.9 is reported alongside, read as the 99.99th percentile.
 */
const PW = process.env.CONDYN_PLAYWRIGHT_MODULE ?? "/home/codi/Entwicklung/nquiry/node_modules/playwright/index.mjs";
const SHARP = process.env.CONDYN_SHARP_MODULE ?? "/home/codi/Entwicklung/condyn-admin-pink-visual-g/node_modules/sharp/lib/index.js";
const { chromium } = await import(PW);
const sharp = (await import(SHARP)).default;
const BASE = process.env.PINK_BASE ?? "http://127.0.0.1:3122";
const URL = `${BASE}/career/demo?focus=MAPPING&investigationMode=PERSON&analysisId=CAN_00000000000000000000000000000002`;
const LUT = new Float64Array(256);
for (let i = 0; i < 256; i++) { const c = i / 255; LUT[i] = c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
const PERIOD_MS = 10000, LIVE_MS = 13000, STATIC_FRAMES = 24, MASK_EPS = 1e-4, CEILING = 0.030;
const FOREIGN = '.mf-travel, .mf-beam-glow, [data-beam], text, [data-mapping-arc], [data-mapping-node], [data-mapping-trail], [data-testid^="mapping-measure-"]';
const pct = (sorted, p) => { if (!sorted.length) return null; const i = Math.min(sorted.length - 1, Math.max(0, Math.ceil(p * sorted.length) - 1)); return sorted[i]; };
const dist = arr => { const s = Float64Array.from(arr).sort(); return { n: s.length,
  median: +pct(s, 0.5).toFixed(7), p99: +pct(s, 0.99).toFixed(7), p999: +pct(s, 0.999).toFixed(7),
  p9999: +pct(s, 0.9999).toFixed(7), max: +s[s.length - 1].toFixed(7),
  fracOverCeiling: +(arr.filter(v => v > CEILING).length / s.length).toFixed(7) }; };

async function grab(cdp, clip, N) {
  const { data } = await cdp.send("Page.captureScreenshot", { format: "png", clip: { ...clip, scale: 1 }, optimizeForSpeed: true });
  const s = await sharp(Buffer.from(data, "base64")).raw().toBuffer({ resolveWithObject: true });
  const ch = s.info.channels, d = s.data, L = new Float32Array(N);
  for (let i = 0; i < N; i++) { const q = i * ch; L[i] = 0.2126 * LUT[d[q]] + 0.7152 * LUT[d[q + 1]] + 0.0722 * LUT[d[q + 2]]; }
  return L;
}
const swingOver = async (cdp, clip, N, stop) => {
  const mn = new Float32Array(N).fill(Infinity), mx = new Float32Array(N).fill(-Infinity);
  const t0 = Date.now(); let frames = 0;
  while (!stop(frames, Date.now() - t0)) {
    const L = await grab(cdp, clip, N);
    for (let i = 0; i < N; i++) { if (L[i] < mn[i]) mn[i] = L[i]; if (L[i] > mx[i]) mx[i] = L[i]; }
    frames++;
  }
  const sw = new Float32Array(N);
  for (let i = 0; i < N; i++) sw[i] = mx[i] - mn[i];
  return { sw, frames, elapsed: Date.now() - t0 };
};

async function run(VW, VH) {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: 1, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForSelector('[data-testid="mapping-field"]', { timeout: 30000 });
  await page.waitForTimeout(2000);
  while (await page.locator('[data-testid="guided-onboarding-overlay"]').count() > 0) {
    await page.locator('[data-testid="onboarding-close-btn"]').first().click().catch(() => {});
    await page.keyboard.press("Escape").catch(() => {}); await page.waitForTimeout(400);
  }
  const cdp = await page.context().newCDPSession(page);
  const clip = await page.evaluate(() => { const s = document.querySelector('[data-testid="mapping-field-svg"]') ?? document.querySelector('[data-mapping-body]').closest('svg');
    const r = s.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) }; });
  const W = clip.width, H = clip.height, N = W * H;

  // carrier mask, static pass, everything drawn in the measured frames
  const base = await grab(cdp, clip, N);
  const hide = async sel => { const h = await page.addStyleTag({ content: `${sel} { visibility: hidden !important; }` });
    await page.waitForTimeout(500); const L = await grab(cdp, clip, N); await h.evaluate(e => e.remove()); await page.waitForTimeout(400); return L; };
  const noCarrier = await hide('.mf-wave-halo'), noForeign = await hide(FOREIGN);
  // A-G97: the body's seat is an area OCCLUDER, so pixels inside r + seatHalf are not carrier domain.
  // §10 applied this; an earlier revision of THIS script did not, and the near-body ring where the halo
  // overlays the body's own bright outline then dominated the max. That omission was the defect.
  const seats = await page.evaluate(() => {
    const svg = document.querySelector('[data-testid="mapping-field-svg"]') ?? document.querySelector('[data-mapping-body]').closest('svg');
    const sr = svg.getBoundingClientRect(), ox = Math.round(sr.x), oy = Math.round(sr.y);
    return [...document.querySelectorAll('[data-mapping-body]')].map(el => {
      const sh = el.querySelector('[data-mapping-body-shape]'), r = sh.getBoundingClientRect();
      const marked = el.getAttribute("data-marked") === "true";
      const rBody = (r.width - (marked ? 2 : 1.2 * 1.002)) / 2;
      return { cx: r.x + r.width / 2 - ox, cy: r.y + r.height / 2 - oy,
               seatEdgeR: rBody + (marked ? 1.8 : (1.2 * 1.002 + 1.6) / 2) };
    });
  });
  const keep = new Uint8Array(N); let nKeep = 0, nSeatExcluded = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    const isC = Math.abs(base[i] - noCarrier[i]) > MASK_EPS, isF = Math.abs(base[i] - noForeign[i]) > MASK_EPS;
    if (!isC || isF) continue;
    if (seats.some(sb => Math.hypot(x - sb.cx, y - sb.cy) <= sb.seatEdgeR)) { nSeatExcluded++; continue; }
    keep[i] = 1; nKeep++;
  }
  // radial position of the carrier mask relative to the field ring -- the §4 caveat's own question
  const ring = await page.evaluate(() => { const r = document.querySelector('[data-testid="mapping-ring-field"]')?.getBoundingClientRect();
    return r ? { cx: r.x + r.width / 2, cy: r.y + r.height / 2, R: r.width / 2 } : null; });
  let rMin = Infinity, rMax = -Infinity;
  if (ring) { const cx = ring.cx - clip.x, cy = ring.cy - clip.y;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (keep[y * W + x]) {
      const rr = Math.hypot(x - cx, y - cy) / ring.R; if (rr < rMin) rMin = rr; if (rr > rMax) rMax = rr; } }

  // STATIC floor on the carrier mask (still under reduce)
  const anims = await page.evaluate(() => { let n = 0; for (const e of document.querySelectorAll('.mf-wave-halo')) {
    const s = getComputedStyle(e); if (s.animationName !== 'none' && s.animationDuration !== '0s') n++; } return n; });
  const st = await swingOver(cdp, clip, N, f => f >= STATIC_FRAMES);
  const floorVals = []; for (let i = 0; i < N; i++) if (keep[i]) floorVals.push(st.sw[i]);

  // LIVE swing on the SAME mask
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.waitForTimeout(1200);
  const animsLive = await page.evaluate(() => { let n = 0; for (const e of document.querySelectorAll('.mf-wave-halo')) {
    const s = getComputedStyle(e); if (s.animationName !== 'none' && s.animationDuration !== '0s') n++; } return n; });
  const lv = await swingOver(cdp, clip, N, (f, ms) => ms >= LIVE_MS);
  const liveVals = []; for (let i = 0; i < N; i++) if (keep[i]) liveVals.push(lv.sw[i]);

  await ctx.close(); await b.close();
  const floor = dist(floorVals), live = dist(liveVals);
  return { viewport: `${VW}x${VH}`, region: `${W}x${H}`, carrierMaskPx: nKeep, seatExcludedPx: nSeatExcluded,
    carrierRadialExtent_rOverR: ring ? { min: +rMin.toFixed(4), max: +rMax.toFixed(4) } : null,
    animatedCarriersUnderReduce: anims, animatedCarriersLive: animsLive,
    staticFloorOnCarrierMask: { frames: st.frames, elapsedMs: st.elapsed, ...floor },
    liveSwingOnCarrierMask: { frames: lv.frames, elapsedMs: lv.elapsed, periodsCovered: +(lv.elapsed / PERIOD_MS).toFixed(2), ...live },
    limb3: { ceiling: CEILING,
      floorP9999: floor.p9999, floorMax: floor.max,
      liveP9999: live.p9999, liveMax: live.max,
      ceilingOverFloorMax: floor.max > 0 ? +(CEILING / floor.max).toFixed(1) : Infinity,
      admissibleByAsymmetry: floor.p9999 < CEILING / 5,
      verdict_p9999_vs_ceiling: live.p9999 <= CEILING ? "CLEARS" : "EXCEEDS",
      verdict_max_vs_ceiling: live.max <= CEILING ? "CLEARS" : "EXCEEDS" } };
}

console.log(JSON.stringify({
  commit: "3ec8457d", buildId: "xCD8LBxdjnP97-2Gjs5yr",
  pin: "PG-10 limb 3 (max swing <= 0.030), restored 'as written' at the A-G26 suspension lift",
  against: "A-G195 (§50 @ e6078e0b): 'not runnable' on (i) floor 0.031872 and (ii) no co-registration",
  statisticNote: "A-G26's p999.9 read as the 99.99th percentile; reported beside p99.9, p99 and the max",
  runs: [await run(1920, 1080), await run(1280, 800)],
}, null, 1));
