/** PINK · PHASE G · (1) the r/R distribution of PG-10 limb 3's breaching pixels (A-G210's ask), WITH
 *  the control that makes it a concentration statement, and (2) PG-23 measured on the shelf glows.
 *
 *  A-G210 asks where the 105 breaching pixels sit radially: beyond r/R 0.98 would make the breach a
 *  statement about the field's outer edge (A-G59's caveat, A-G8's shelf rim past the field ring);
 *  spread through the annulus would make it about the breath.
 *
 *  THE ASK NEEDS A CONTROL OR IT CANNOT ANSWER ITS OWN QUESTION. "The breaching pixels lie beyond
 *  0.98" is uninformative on its own, because the carrier mask's OWN radial distribution is not
 *  uniform -- §12 measured it spanning 0.331 … 1.075 at 1920. If 40 % of the mask already lies beyond
 *  0.98, then 40 % of the breaches lying there is no concentration at all. So this reports BOTH
 *  distributions in the same bins and the ratio per bin (breach rate), which is the quantity that
 *  answers the question.
 *
 *  PG-23 (new, GELB §52): "a resting glow's per-pixel swing is zero to the run's own measured static
 *  floor, on every body whose halo carries no breath." Carrier: the SHELF halos. Their circle carries
 *  no class, testid or data-* (`className={b.shelf ? undefined : …}`, :670, inside the anonymous <g>
 *  at :884), so the only selector is `.mf-halo circle:not(.mf-wave-halo)` -- which exists only
 *  because shelf is the `undefined` branch. That is A-G49's defect, and PG-23 is measurable today
 *  only by exploiting it. Recorded as a dependency of the pin, not a property of the build.
 */
import { playwright, sharpModule, provenance } from "../../../mapping-phase-pink-tools/pink-tools.mjs";
const PINK_PROV_3ec8457d = await provenance({ declaredCommit: "3ec8457d", declaredBuildId: "xCD8LBxdjnP97-2Gjs5yr" });
const chromium = await playwright();
const sharp = await sharpModule();
const BASE = process.env.PINK_BASE ?? "http://127.0.0.1:3122";
const URL = `${BASE}/career/demo?focus=MAPPING&investigationMode=PERSON&analysisId=CAN_00000000000000000000000000000002`;
const LUT = new Float64Array(256);
for (let i = 0; i < 256; i++) { const c = i / 255; LUT[i] = c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
const PERIOD_MS = 10000, LIVE_MS = 13000, STATIC_FRAMES = 24, MASK_EPS = 1e-4, CEILING = 0.030, BIN = 0.05;
const FOREIGN = '.mf-travel, .mf-beam-glow, [data-beam], text, [data-mapping-arc], [data-mapping-node], [data-mapping-trail], [data-testid^="mapping-measure-"]';
const SHELF_SEL = '.mf-halo circle:not(.mf-wave-halo)';
const pct = (s, p) => s.length ? s[Math.min(s.length - 1, Math.max(0, Math.ceil(p * s.length) - 1))] : null;
const dist = a => { const s = Float64Array.from(a).sort(); return { n: s.length,
  median: +pct(s, 0.5).toFixed(7), p99: +pct(s, 0.99).toFixed(7), p999: +pct(s, 0.999).toFixed(7),
  p9999: +pct(s, 0.9999).toFixed(7), max: +s[s.length - 1].toFixed(7) }; };

async function grab(cdp, clip, N) {
  const { data } = await cdp.send("Page.captureScreenshot", { format: "png", clip: { ...clip, scale: 1 }, optimizeForSpeed: true });
  const s = await sharp(Buffer.from(data, "base64")).raw().toBuffer({ resolveWithObject: true });
  const ch = s.info.channels, d = s.data, L = new Float32Array(N);
  for (let i = 0; i < N; i++) { const q = i * ch; L[i] = 0.2126 * LUT[d[q]] + 0.7152 * LUT[d[q + 1]] + 0.0722 * LUT[d[q + 2]]; }
  return L;
}
const swingOver = async (cdp, clip, N, stop) => {
  const mn = new Float32Array(N).fill(Infinity), mx = new Float32Array(N).fill(-Infinity);
  const t0 = Date.now(); let f = 0;
  while (!stop(f, Date.now() - t0)) { const L = await grab(cdp, clip, N);
    for (let i = 0; i < N; i++) { if (L[i] < mn[i]) mn[i] = L[i]; if (L[i] > mx[i]) mx[i] = L[i]; } f++; }
  const sw = new Float32Array(N); for (let i = 0; i < N; i++) sw[i] = mx[i] - mn[i];
  return { sw, frames: f, elapsed: Date.now() - t0 };
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
  const shelfCount = await page.locator(SHELF_SEL).count();

  const base = await grab(cdp, clip, N);
  const hide = async sel => { const h = await page.addStyleTag({ content: `${sel} { visibility: hidden !important; }` });
    await page.waitForTimeout(500); const L = await grab(cdp, clip, N); await h.evaluate(e => e.remove()); await page.waitForTimeout(400); return L; };
  const noField = await hide('.mf-wave-halo'), noShelf = await hide(SHELF_SEL), noForeign = await hide(FOREIGN);
  const seats = await page.evaluate(() => {
    const s = document.querySelector('[data-testid="mapping-field-svg"]') ?? document.querySelector('[data-mapping-body]').closest('svg');
    const sr = s.getBoundingClientRect(), ox = Math.round(sr.x), oy = Math.round(sr.y);
    return [...document.querySelectorAll('[data-mapping-body]')].map(el => {
      const sh = el.querySelector('[data-mapping-body-shape]'), r = sh.getBoundingClientRect();
      const m = el.getAttribute("data-marked") === "true", rB = (r.width - (m ? 2 : 1.2 * 1.002)) / 2;
      return { cx: r.x + r.width / 2 - ox, cy: r.y + r.height / 2 - oy, seatEdgeR: rB + (m ? 1.8 : (1.2 * 1.002 + 1.6) / 2) }; });
  });
  const ring = await page.evaluate(() => { const r = document.querySelector('[data-testid="mapping-ring-field"]')?.getBoundingClientRect();
    return r ? { cx: r.x + r.width / 2, cy: r.y + r.height / 2, R: r.width / 2 } : null; });
  const rcx = ring.cx - clip.x, rcy = ring.cy - clip.y, R = ring.R;

  const fieldM = new Uint8Array(N), shelfM = new Uint8Array(N), rr = new Float32Array(N);
  let nF = 0, nS = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x; rr[i] = Math.hypot(x - rcx, y - rcy) / R;
    const isForeign = Math.abs(base[i] - noForeign[i]) > MASK_EPS;
    if (isForeign) continue;
    if (seats.some(sb => Math.hypot(x - sb.cx, y - sb.cy) <= sb.seatEdgeR)) continue;
    if (Math.abs(base[i] - noField[i]) > MASK_EPS) { fieldM[i] = 1; nF++; }
    else if (Math.abs(base[i] - noShelf[i]) > MASK_EPS) { shelfM[i] = 1; nS++; }
  }

  const st = await swingOver(cdp, clip, N, f => f >= STATIC_FRAMES);
  const fFloor = [], sFloor = [];
  for (let i = 0; i < N; i++) { if (fieldM[i]) fFloor.push(st.sw[i]); else if (shelfM[i]) sFloor.push(st.sw[i]); }

  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.waitForTimeout(1200);
  const lv = await swingOver(cdp, clip, N, (f, ms) => ms >= LIVE_MS);
  const fLive = [], sLive = [];
  const bins = new Map();   // bin -> {mask, breach}
  for (let i = 0; i < N; i++) {
    if (fieldM[i]) { fLive.push(lv.sw[i]);
      const k = Math.floor(rr[i] / BIN) * BIN, e = bins.get(k) ?? { mask: 0, breach: 0 };
      e.mask++; if (lv.sw[i] > CEILING) e.breach++; bins.set(k, e);
    } else if (shelfM[i]) sLive.push(lv.sw[i]);
  }
  await ctx.close(); await b.close();

  const breachTotal = [...bins.values()].reduce((a, e) => a + e.breach, 0);
  const histogram = [...bins.entries()].sort((a, b2) => a[0] - b2[0])
    .map(([k, e]) => ({ rOverR: `${k.toFixed(2)}–${(k + BIN).toFixed(2)}`, maskPx: e.mask, breachPx: e.breach,
      shareOfMask: +(e.mask / nF).toFixed(5), shareOfBreaches: breachTotal ? +(e.breach / breachTotal).toFixed(5) : 0,
      breachRateInBin: +(e.breach / e.mask).toFixed(6) }))
    .filter(r => r.maskPx > 0);
  const beyond098 = histogram.filter(r => parseFloat(r.rOverR) >= 0.95);
  const fFl = dist(fFloor), fLv = dist(fLive), sFl = sFloor.length ? dist(sFloor) : null, sLv = sLive.length ? dist(sLive) : null;
  return { viewport: `${VW}x${VH}`, region: `${W}x${H}`, fieldMaskPx: nF, shelfMaskPx: nS,
    shelfElementsMatched: shelfCount, fieldRingR_px: +R.toFixed(2),
    limb3_breachPx: breachTotal, limb3_breachRateOverall: +(breachTotal / nF).toFixed(6),
    radialHistogram: histogram,
    concentrationCheck: { maskShareBeyond095: +(beyond098.reduce((a, r) => a + r.maskPx, 0) / nF).toFixed(5),
      breachShareBeyond095: breachTotal ? +(beyond098.reduce((a, r) => a + r.breachPx, 0) / breachTotal).toFixed(5) : 0 },
    fieldFloor: fFl, fieldLive: fLv, livePeriods: +(lv.elapsed / PERIOD_MS).toFixed(2),
    PG23_shelf: sLv ? { floor: sFl, live: sLv,
      verdict: sLv.max <= sFl.max ? "CLEARS (live max within the run's own static floor)" : "EXCEEDS",
      liveMaxOverFloorMax: sFl.max > 0 ? +(sLv.max / sFl.max).toFixed(3) : null } : { notRun: "shelf mask empty" } };
}

console.log(JSON.stringify({
  commit: PINK_PROV_3ec8457d.observedCommit, buildId: PINK_PROV_3ec8457d.observedBuildId,
  asks: { "A-G210": "r/R distribution of PG-10 limb 3's breaching pixels, WITH the mask's own distribution as control",
          "PG-23": "a resting glow's per-pixel swing is zero to the run's own measured static floor" },
  shelfSelectorCaveat: "the shelf halo circle has no class/testid/data-*; only `.mf-halo circle:not(.mf-wave-halo)` reaches it, i.e. the `undefined` branch (A-G49)",
  ceiling: CEILING, binWidth: BIN,
  runs: [await run(1920, 1080), await run(1280, 800)],
}, null, 1));
