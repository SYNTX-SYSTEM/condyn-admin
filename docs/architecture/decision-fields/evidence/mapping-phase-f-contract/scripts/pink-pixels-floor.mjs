/** PINK · instrument noise-floor + PF-11 preview. reducedMotion:reduce ⇒ nothing animates at 9cc06f84 ⇒
 *  any frame-to-frame swing is pure screenshot/antialias nondeterminism. Same WCAG luminance pipeline. */
import { chromium } from "/home/codi/Entwicklung/nquiry/node_modules/playwright/index.mjs";
import sharp from "/home/codi/Entwicklung/condyn-admin-pink-visual-e/node_modules/sharp/lib/index.js";
const BASE = "http://127.0.0.1:3120", AN = "CAN_00000000000000000000000000000002";
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
const g = await page.evaluate(() => { const r = document.querySelector('[data-testid="mapping-field-svg"]').getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; });
const clip = { x: g.x, y: g.y, width: g.w, height: g.h }; const N = clip.width * clip.height;
const shot = async () => { const s = await sharp(await page.screenshot({ clip, animations: "allow" })).raw().toBuffer({ resolveWithObject: true }); return lum(s.data, N, s.info.channels); };
let prev = await shot(); const mn = Float32Array.from(prev), mx = Float32Array.from(prev);
let sumAbs = 0, stepGt = 0, steps = 0, spanStart = Date.now();
while (Date.now() - spanStart < 2200) { await page.waitForTimeout(250); const L = await shot(); for (let i = 0; i < N; i++) { if (L[i] < mn[i]) mn[i] = L[i]; if (L[i] > mx[i]) mx[i] = L[i]; const d = Math.abs(L[i] - prev[i]); sumAbs += d; if (d > 0.002) stepGt++; } prev = L; steps++; }
let swGt002 = 0, swGt0005 = 0, swMax = 0; for (let i = 0; i < N; i++) { const s = mx[i] - mn[i]; if (s > swMax) swMax = s; if (s > 0.002) swGt002++; if (s > 0.0005) swGt0005++; }
await ctx.close(); await b.close();
console.log(JSON.stringify({ probe: "noise-floor / PF-11-preview @9cc06f84 reduce", region: `${clip.width}x${clip.height}`, frames: steps + 1, spanMs: Date.now() - spanStart,
  swing_max: +swMax.toExponential(4), pixSwingGt002: swGt002, fracSwingGt002: +(swGt002 / N).toExponential(3), pixSwingGt0005: swGt0005,
  meanAbsStep: +(sumAbs / (steps * N)).toExponential(4), pixPerStepGt002_mean: +(stepGt / steps).toFixed(1),
  PF11_preview_identical: swMax <= 0.002 }, null, 1));
