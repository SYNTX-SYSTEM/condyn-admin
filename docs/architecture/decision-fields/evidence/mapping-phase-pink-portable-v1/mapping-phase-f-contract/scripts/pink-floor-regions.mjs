/** PINK · attribute the under-reduce swing floor to its sources: (a) MARK boxes (bodies/arcs/nodes, dilated 2px)
 *  = antialiasing on the marks' own edges; (b) QUIET mid-disc annulus r/R 0.30-0.60 minus marks = host motion
 *  through the translucent ground (A-F4's bleed; vanishes with DISC_GROUND_OPAQUE); (c) outside the disc = host.
 *  Tells us what residual swing survives an opaque ground, i.e. whether PF-8 max<=0.006 and PF-11 "identical"
 *  are testable at 9cc06f84 geometry. reducedMotion:reduce so the FIELD contributes no motion. */
import { playwright, sharpModule, provenance } from "../../../mapping-phase-pink-tools/pink-tools.mjs";
const chromium = await playwright();
const sharp = await sharpModule();
const PINK_PROV_9cc06f84 = await provenance({ declaredCommit: "9cc06f84" });
const BASE = process.env.PINK_BASE ?? "http://127.0.0.1:3120", AN = "CAN_00000000000000000000000000000002";
const URL = `${BASE}/career/demo?focus=MAPPING&investigationMode=PERSON&analysisId=${AN}`;
const LUT = new Float64Array(256); for (let i = 0; i < 256; i++) { const c = i / 255; LUT[i] = c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
const lum = (raw, n, ch) => { const L = new Float32Array(n); for (let p = 0, q = 0; p < n; p++, q += ch) L[p] = 0.2126 * LUT[raw[q]] + 0.7152 * LUT[raw[q + 1]] + 0.0722 * LUT[raw[q + 2]]; return L; };
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1, reducedMotion: "reduce" });
const page = await ctx.newPage();
await page.goto(URL, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForSelector('[data-testid="mapping-field"]', { timeout: 30000 });
await page.waitForTimeout(1500);
while (await page.locator('[data-testid="guided-onboarding-overlay"]').count() > 0) { await page.locator('[data-testid="onboarding-close-btn"]').first().click().catch(() => {}); await page.keyboard.press("Escape").catch(() => {}); await page.waitForTimeout(400); }
const geo = await page.evaluate(() => {
  const svg = document.querySelector('[data-testid="mapping-field-svg"]').getBoundingClientRect();
  const ring = document.querySelector('[data-testid="mapping-ring-field"]').getBoundingClientRect();
  const boxes = [...document.querySelectorAll('[data-mapping-body],[data-mapping-node],[data-mapping-arc]')].map(e => { const r = e.getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; });
  return { svg: { x: Math.round(svg.x), y: Math.round(svg.y), w: Math.round(svg.width), h: Math.round(svg.height) }, cx: ring.x + ring.width / 2, cy: ring.y + ring.height / 2, R: ring.width / 2, boxes };
});
const clip = { x: geo.svg.x, y: geo.svg.y, width: geo.svg.w, height: geo.svg.h }, W = clip.width, H = clip.height, N = W * H;
const cx = geo.cx - clip.x, cy = geo.cy - clip.y, R = geo.R;
const markMask = new Uint8Array(N);
for (const [x, y, w, h] of geo.boxes) { const bx = Math.floor(x - clip.x - 2), by = Math.floor(y - clip.y - 2), bw = Math.ceil(w + 4), bh = Math.ceil(h + 4); for (let yy = by; yy < by + bh; yy++) for (let xx = bx; xx < bx + bw; xx++) if (xx >= 0 && yy >= 0 && xx < W && yy < H) markMask[yy * W + xx] = 1; }
const shot = async () => { const s = await sharp(await page.screenshot({ clip, animations: "allow" })).raw().toBuffer({ resolveWithObject: true }); return lum(s.data, N, s.info.channels); };
let f0 = await shot(); const mn = Float32Array.from(f0), mx = Float32Array.from(f0); let steps = 0, t0 = Date.now();
while (Date.now() - t0 < 2600) { await page.waitForTimeout(250); const L = await shot(); for (let i = 0; i < N; i++) { if (L[i] < mn[i]) mn[i] = L[i]; if (L[i] > mx[i]) mx[i] = L[i]; } steps++; }
await ctx.close(); await b.close();
const bucket = { mark: { n: 0, gt002: 0, gt006: 0, gt030: 0, max: 0 }, quietDisc: { n: 0, gt002: 0, gt006: 0, gt030: 0, max: 0 }, outsideDisc: { n: 0, gt002: 0, gt006: 0, gt030: 0, max: 0 } };
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x; const s = mx[i] - mn[i]; const dx = x - cx, dy = y - cy; const rr = Math.sqrt(dx * dx + dy * dy) / R;
  let k; if (markMask[i]) k = "mark"; else if (rr <= 1) k = (rr >= 0.30 && rr <= 0.60) ? "quietDisc" : null; else k = "outsideDisc";
  if (!k) continue; const bk = bucket[k]; bk.n++; if (s > bk.max) bk.max = s; if (s > 0.002) bk.gt002++; if (s > 0.006) bk.gt006++; if (s > 0.030) bk.gt030++; }
const fmt = o => ({ n: o.n, max: +o.max.toExponential(3), fracGt002: +(o.gt002 / o.n).toExponential(2), fracGt006: +(o.gt006 / o.n).toExponential(2), gt030: o.gt030, fracGt030: +(o.gt030 / o.n).toExponential(2) });
console.log(JSON.stringify({ commit: PINK_PROV_9cc06f84.observedCommit, probe: "under-reduce swing bucketed by source", frames: steps + 1, region: `${W}x${H}`,
  mark_AAedge: fmt(bucket.mark), quietMidDisc_hostBleed: fmt(bucket.quietDisc), outsideDisc_host: fmt(bucket.outsideDisc),
  reading: "mark bucket = antialiasing residual that an opaque ground will NOT remove; quietMidDisc = host-through-ground that DISC_GROUND_OPAQUE removes; outsideDisc = host (PF-11 scoped out by A-F4)." }, null, 1));
