/** PINK · separate breath signal from antialiasing noise floor. For each frame decode RAW and 2px-BLUR; keep
 *  per-pixel min/max + step accumulators for both. Signal = reducedMotion off (11s, full breath period).
 *  Floor = reducedMotion reduce (nothing animates @9cc06f84). If blur collapses the floor but keeps the signal,
 *  the breath is real above noise and blur-based area luminance is the correct instrument for PF-8/F-6. */
import { playwright, sharpModule, provenance } from "../../../mapping-phase-pink-tools/pink-tools.mjs";
const chromium = await playwright();
const sharp = await sharpModule();
const PINK_PROV_9cc06f84 = await provenance({ declaredCommit: "9cc06f84" });
const BASE = "http://127.0.0.1:3120", AN = "CAN_00000000000000000000000000000002";
const URL = `${BASE}/career/demo?focus=MAPPING&investigationMode=PERSON&analysisId=${AN}`;
const LUT = new Float64Array(256); for (let i = 0; i < 256; i++) { const c = i / 255; LUT[i] = c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
const lum = (raw, n, ch) => { const L = new Float32Array(n); for (let p = 0, q = 0; p < n; p++, q += ch) L[p] = 0.2126 * LUT[raw[q]] + 0.7152 * LUT[raw[q + 1]] + 0.0722 * LUT[raw[q + 2]]; return L; };
async function series(reduce, durMs) {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1, reducedMotion: reduce ? "reduce" : "no-preference" });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForSelector('[data-testid="mapping-field"]', { timeout: 30000 });
  await page.waitForTimeout(1500);
  while (await page.locator('[data-testid="guided-onboarding-overlay"]').count() > 0) { await page.locator('[data-testid="onboarding-close-btn"]').first().click().catch(() => {}); await page.keyboard.press("Escape").catch(() => {}); await page.waitForTimeout(400); }
  const g = await page.evaluate(() => { const r = document.querySelector('[data-testid="mapping-field-svg"]').getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; });
  const clip = { x: g.x, y: g.y, width: g.w, height: g.h }, N = clip.width * clip.height;
  const grab = async () => { const png = await page.screenshot({ clip, animations: "allow" });
    const raw = await sharp(png).raw().toBuffer({ resolveWithObject: true });
    const blr = await sharp(png).blur(2).raw().toBuffer({ resolveWithObject: true });
    return { R: lum(raw.data, N, raw.info.channels), B: lum(blr.data, N, blr.info.channels) }; };
  const acc = kind => ({ kind, mn: null, mx: null, prev: null, sumAbs: 0, stepGt: 0 });
  const A = { R: acc("raw"), B: acc("blur") };
  let f0 = await grab(); for (const k of ["R", "B"]) { A[k].mn = Float32Array.from(f0[k]); A[k].mx = Float32Array.from(f0[k]); A[k].prev = f0[k]; }
  let steps = 0, t0 = Date.now();
  while (Date.now() - t0 < durMs) { const tS = Date.now(); const f = await grab();
    for (const k of ["R", "B"]) { const a = A[k], L = f[k]; for (let i = 0; i < N; i++) { if (L[i] < a.mn[i]) a.mn[i] = L[i]; if (L[i] > a.mx[i]) a.mx[i] = L[i]; const d = Math.abs(L[i] - a.prev[i]); a.sumAbs += d; if (d > 0.002) a.stepGt++; } a.prev = L; }
    steps++; const sp = Date.now() - tS; if (sp < 150) await page.waitForTimeout(150 - sp); }
  await ctx.close(); await b.close();
  const summ = a => { let swMax = 0, swGt004 = 0, swGt002 = 0; for (let i = 0; i < N; i++) { const s = a.mx[i] - a.mn[i]; if (s > swMax) swMax = s; if (s > 0.004) swGt004++; if (s > 0.002) swGt002++; } return { swing_max: +swMax.toExponential(4), pixSwingGt004: swGt004, fracSwingGt004: +(swGt004 / N).toFixed(4), pixSwingGt002: swGt002, meanAbsStep: +(a.sumAbs / (steps * N)).toExponential(4), pixPerStepGt002: +(a.stepGt / steps).toFixed(0) }; };
  return { reduce, frames: steps + 1, spanMs: Date.now() - t0, N, raw: summ(A.R), blur: summ(A.B) };
}
const signal = await series(false, 11000);
const floor = await series(true, 3000);
console.log(JSON.stringify({ commit: PINK_PROV_9cc06f84.observedCommit, note: "raw vs 2px-blur; signal=motion, floor=reduce(static)", signal, floor }, null, 1));
