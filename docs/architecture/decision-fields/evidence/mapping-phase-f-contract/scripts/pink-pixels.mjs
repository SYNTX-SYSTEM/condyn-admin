/**
 * PINK · PHASE-F red-first baseline · INDEPENDENT PIXEL INSTRUMENT (own render, own code).
 * Reads the RENDERED IMAGE, not the DOM. Screenshots -> sharp raw RGBA -> WCAG relative luminance per pixel.
 * Measures the REGION (every pixel), never a sample of points. Asserts the onboarding overlay is ABSENT first.
 * Build 9cc06f84, variant default, served by PINK's own prod(3121)+facade(3120). Measured at the viewport
 * OTTAVIO judged (1920x1080), deviceScaleFactor 1 so 1 screenshot px == 1 CSS px.
 */
import { chromium } from "/home/codi/Entwicklung/nquiry/node_modules/playwright/index.mjs";
import sharp from "/home/codi/Entwicklung/condyn-admin-pink-visual-e/node_modules/sharp/lib/index.js";
import { writeFileSync, mkdirSync } from "node:fs";

const BASE = "http://127.0.0.1:3120";
const AN = "CAN_00000000000000000000000000000002";
const URL = `${BASE}/career/demo?focus=MAPPING&investigationMode=PERSON&analysisId=${AN}`;
const VW = Number(process.env.VW ?? 1920), VH = Number(process.env.VH ?? 1080);
const SHOTS = "/tmp/claude-1000/-home-codi-Entwicklung/a060e5e1-d3f6-49b1-ab41-8710c6e835d7/scratchpad/phase-e/shots/f";
mkdirSync(SHOTS, { recursive: true });

// --- WCAG relative luminance -------------------------------------------------
const LUT = new Float64Array(256);
for (let i = 0; i < 256; i++) { const c = i / 255; LUT[i] = c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
function lumArray(raw, w, h, ch) {
  const L = new Float32Array(w * h);
  for (let p = 0, q = 0; p < w * h; p++, q += ch) L[p] = 0.2126 * LUT[raw[q]] + 0.7152 * LUT[raw[q + 1]] + 0.0722 * LUT[raw[q + 2]];
  return L;
}
const pct = (sortedAsc, f) => sortedAsc[Math.min(sortedAsc.length - 1, Math.max(0, Math.floor(f * (sortedAsc.length - 1))))];
function stats(vals) { // vals: Float32Array subset already collected
  const a = Float64Array.from(vals); a.sort();
  const n = a.length; let s = 0; for (let i = 0; i < n; i++) s += a[i];
  const frac = t => { let c = 0; for (let i = n - 1; i >= 0 && a[i] > t; i--) c++; return +(c / n).toFixed(5); };
  return { n, mean: +(s / n).toExponential(4), p50: +pct(a, .5).toExponential(4), p90: +pct(a, .9).toExponential(4),
    p99: +pct(a, .99).toExponential(4), p999: +pct(a, .999).toExponential(4), max: +a[n - 1].toExponential(4),
    fracAbove: { "0.005": frac(0.005), "0.02": frac(0.02), "0.05": frac(0.05) } };
}

async function shot(page, clip) { return sharp(await page.screenshot({ clip, animations: "allow" })).raw().toBuffer({ resolveWithObject: true }); }

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: 1, reducedMotion: "no-preference" });
const page = await ctx.newPage();
const apiResp = [];
page.on("response", r => { try { const p = new URL(r.url()).pathname; if (p.startsWith("/api")) apiResp.push(`${r.status()} ${p.replace(/CAN_[0-9A-Z]+/, "CAN_…")}`); } catch {} });
await page.goto(URL, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForSelector('[data-testid="mapping-field"]', { timeout: 30000 });
await page.waitForTimeout(1800);

// --- GELB warning 1: the onboarding overlay/scrim MUST be absent before measuring ---
const overlay = () => page.locator('[data-testid="guided-onboarding-overlay"]').count();
const overlayInitial = await overlay();
let dismissAttempts = 0;
while ((await overlay()) > 0 && dismissAttempts < 4) {
  dismissAttempts++;
  for (const sel of ['[data-testid="onboarding-close-btn"]', '[data-testid="guided-onboarding-overlay"] button', '[aria-label="Close"]']) {
    if (await page.locator(sel).count() > 0) { await page.locator(sel).first().click().catch(() => {}); await page.waitForTimeout(400); break; }
  }
  await page.keyboard.press("Escape").catch(() => {});
  await page.waitForTimeout(300);
}
const overlayFinal = await overlay();
// scrim assertion: the element under the field centre must belong to the svg, not an overlay layer
const centreOwner = await page.evaluate(() => {
  const r = document.querySelector('[data-testid="mapping-field-svg"]').getBoundingClientRect();
  const el = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
  let node = el, insideSvg = false, overlayAbove = null;
  while (node) { if (node.tagName && node.tagName.toLowerCase() === "svg") insideSvg = true;
    if (node.getAttribute && /overlay|onboarding|scrim|backdrop/i.test(node.getAttribute("data-testid") || node.className?.toString?.() || "")) overlayAbove = node.getAttribute("data-testid") || node.className?.toString?.();
    node = node.parentElement; }
  return { topTag: el?.tagName, insideSvg, overlayAbove };
});
if (overlayFinal > 0 || !centreOwner.insideSvg || centreOwner.overlayAbove) {
  console.log(JSON.stringify({ ABORT: "overlay/scrim present at measure time — measurement invalid", overlayInitial, overlayFinal, centreOwner }, null, 1));
  await ctx.close(); await browser.close(); process.exit(2);
}

// --- geometry (page coords) ---
const geo = await page.evaluate(() => {
  const bb = el => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; };
  const svg = document.querySelector('[data-testid="mapping-field-svg"]');
  const ring = document.querySelector('[data-testid="mapping-ring-field"]');
  const rr = ring.getBoundingClientRect();
  const bodies = [...document.querySelectorAll('[data-mapping-body]')].map(e => ({ id: e.getAttribute("data-testid").replace(/^mapping-body-/, ""), ...bb(e) }));
  const caps = [...document.querySelectorAll('[data-mapping-node]')].map(e => ({ id: e.getAttribute("data-testid") || e.getAttribute("data-capability") || "node", ...bb(e) }));
  return { svg: bb(svg), ringC: { x: rr.x + rr.width / 2, y: rr.y + rr.height / 2 }, ringR: rr.width / 2, bodies, caps };
});
const clip = { x: Math.round(geo.svg.x), y: Math.round(geo.svg.y), width: Math.round(geo.svg.w), height: Math.round(geo.svg.h) };
clip.width = Math.min(clip.width, VW - clip.x); clip.height = Math.min(clip.height, VH - clip.y);
const W = clip.width, H = clip.height;
// disc mask (clip-local)
const cx = geo.ringC.x - clip.x, cy = geo.ringC.y - clip.y, R = geo.ringR;
const disc = new Uint8Array(W * H); let discN = 0;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const dx = x - cx, dy = y - cy; if (dx * dx + dy * dy <= R * R) { disc[y * W + x] = 1; discN++; } }
const sub = (arr, mask) => { const o = new Float32Array(mask ? discN : arr.length); let k = 0; if (mask) { for (let i = 0; i < arr.length; i++) if (disc[i]) o[k++] = arr[i]; return o; } return arr; };

// ===== Q-F1 (whole svg square) & Q-F4 (disc interior) =====
const base = await shot(page, clip); const chB = base.info.channels; const Lbase = lumArray(base.data, W, H, chB);
writeFileSync(`${SHOTS}/stage-${VW}x${VH}.png`, await page.screenshot({ clip }));
const QF1 = stats(Lbase);
const QF4 = stats(sub(Lbase, true));

// ===== Q-F5 (bodies & capability nodes vs local surround) =====
function nodeContrast(L, g, pad) {
  const bx = Math.max(0, Math.floor(g.x - clip.x)), by = Math.max(0, Math.floor(g.y - clip.y));
  const bw = Math.ceil(g.w), bh = Math.ceil(g.h);
  let peak = 0; const inside = [];
  for (let y = by; y < by + bh && y < H; y++) for (let x = bx; x < bx + bw && x < W; x++) { const v = L[y * W + x]; if (v > peak) peak = v; inside.push(v); }
  // surrounding band: pixels in the padded box but OUTSIDE the inner box
  const band = [];
  for (let y = by - pad; y < by + bh + pad; y++) for (let x = bx - pad; x < bx + bw + pad; x++) {
    if (x < 0 || y < 0 || x >= W || y >= H) continue;
    if (x >= bx && x < bx + bw && y >= by && y < by + bh) continue;
    band.push(L[y * W + x]);
  }
  band.sort((a, b) => a - b); const med = band.length ? band[Math.floor(band.length / 2)] : 0;
  return { peak: +peak.toExponential(4), surroundMedian: +med.toExponential(4), diff: +(peak - med).toExponential(4),
    weberRatio: +(med > 0 ? peak / med : Infinity).toFixed(3), weberContrast: +(med > 0 ? (peak - med) / med : Infinity).toFixed(3) };
}
const QF5 = {
  bodies: geo.bodies.map(g => ({ id: g.id, box: `${g.w.toFixed(0)}x${g.h.toFixed(0)}`, ...nodeContrast(Lbase, g, 10) })),
  caps: geo.caps.map(g => ({ id: g.id, box: `${g.w.toFixed(0)}x${g.h.toFixed(0)}`, ...nodeContrast(Lbase, g, 10) }))
};

// ===== Q-F2 (breath, temporal) & Q-F3 (motion at rest) over >=10s, NO interaction =====
const mn = Float32Array.from(Lbase), mx = Float32Array.from(Lbase);
let prev = Lbase; const stepAbsSum = new Float64Array(1); // mean |Δ| accumulator handled below
let sumAbs = 0, stepCountTotal = 0, stepCountMax = 0, steps = 0;
const ts = [performance.now?.() ?? Date.now()];
const t0 = Date.now();
while (Date.now() - t0 < 10800) {
  const tStart = Date.now();
  const s = await shot(page, clip); const L = lumArray(s.data, W, H, s.info.channels);
  // temporal min/max
  for (let i = 0; i < L.length; i++) { if (L[i] < mn[i]) mn[i] = L[i]; if (L[i] > mx[i]) mx[i] = L[i]; }
  // step delta vs prev
  let stepCount = 0; for (let i = 0; i < L.length; i++) { const d = Math.abs(L[i] - prev[i]); sumAbs += d; if (d > 0.002) stepCount++; }
  stepCountTotal += stepCount; if (stepCount > stepCountMax) stepCountMax = stepCount; steps++;
  prev = L; ts.push(Date.now());
  const spent = Date.now() - tStart; if (spent < 200) await page.waitForTimeout(200 - spent);
}
const nFrames = steps + 1, spanMs = Date.now() - t0;
// swing per pixel
const swing = new Float32Array(W * H); for (let i = 0; i < swing.length; i++) swing[i] = mx[i] - mn[i];
const swingSorted = Float64Array.from(swing); swingSorted.sort();
let swGt = 0; for (let i = 0; i < swing.length; i++) if (swing[i] > 0.002) swGt++;
// radial distribution of swinging pixels (bins of r/R)
const BINS = 11; const binSwingPix = new Array(BINS).fill(0), binTotPix = new Array(BINS).fill(0), binMeanSwing = new Float64Array(BINS);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x; const dx = x - cx, dy = y - cy; const rr = Math.sqrt(dx * dx + dy * dy) / R; const b = Math.min(BINS - 1, Math.floor(rr / (1.2 / BINS))); binTotPix[b]++; binMeanSwing[b] += swing[i]; if (swing[i] > 0.002) binSwingPix[b]++; }
const radial = []; for (let b = 0; b < BINS; b++) radial.push({ rOverR: +((b + 0.5) * (1.2 / BINS)).toFixed(2), swingPix: binSwingPix[b], ofTotal: +(binSwingPix[b] / (binTotPix[b] || 1)).toFixed(4), meanSwing: +(binMeanSwing[b] / (binTotPix[b] || 1)).toExponential(3) });
const QF2 = { nFrames, spanMs, cadenceMs: +(spanMs / steps).toFixed(0), swing_p999: +pct(swingSorted, .999).toExponential(4), swing_max: +swingSorted[swingSorted.length - 1].toExponential(4),
  fracSwingGt002: +(swGt / swing.length).toFixed(5), swingPixCount: swGt, radial };
const QF3 = { meanAbsStep: +(sumAbs / (steps * W * H)).toExponential(4), pixPerStepGt002_mean: +(stepCountTotal / steps).toFixed(1), pixPerStepGt002_max: stepCountMax, steps };

// ===== Q-F6 (ground purity: suppress field drawing, re-measure disc) =====
await page.addStyleTag({ content: `[data-testid="mapping-field-svg"]{visibility:hidden !important}` });
await page.waitForTimeout(400);
const grd = await shot(page, clip); const Lgrd = lumArray(grd.data, W, H, grd.info.channels);
writeFileSync(`${SHOTS}/ground-${VW}x${VH}.png`, await page.screenshot({ clip }));
const QF6disc = stats(sub(Lgrd, true));
// locate bright ground pixels inside disc (host bleed): bbox of pixels > 0.02
let gminx = W, gminy = H, gmaxx = 0, gmaxy = 0, gcnt = 0;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x; if (disc[i] && Lgrd[i] > 0.02) { gcnt++; if (x < gminx) gminx = x; if (y < gminy) gminy = y; if (x > gmaxx) gmaxx = x; if (y > gmaxy) gmaxy = y; } }
const QF6 = { disc: QF6disc, brightGt02: { count: gcnt, fracOfDisc: +(gcnt / discN).toFixed(5), bboxLocal: gcnt ? { x: gminx, y: gminy, w: gmaxx - gminx, h: gmaxy - gminy } : null } };

await ctx.close(); await browser.close();
const out = { commit: "9cc06f84", variant: "default", viewport: `${VW}x${VH}`, deviceScaleFactor: 1, url: URL,
  overlay: { initial: overlayInitial, finalAfterDismiss: overlayFinal, dismissAttempts, centreOwner },
  apiResponses: apiResp, region: { svgSquarePx: `${W}x${H}`, fieldCentre: { x: +cx.toFixed(1), y: +cy.toFixed(1) }, ringRadiusPx: +R.toFixed(1), discPixels: discN },
  "Q-F1_stageSquare": QF1, "Q-F4_discInterior": QF4, "Q-F5_nodesVsSurround": QF5, "Q-F2_breathTemporal": QF2, "Q-F3_motionAtRest": QF3, "Q-F6_groundPurity": QF6 };
console.log(JSON.stringify(out, null, 1));
writeFileSync(`${SHOTS}/QF-${VW}x${VH}.json`, JSON.stringify(out, null, 1));
