/**
 * PINK · PHASE-E · P-11 (P-2, P-5) + P-6 guard red-first, by faithful runtime injection on the plain façade.
 *   MUT-P2-COLLAPSE: force every arc's rendered luminance (opacity) to one value → the three bands coincide →
 *     closest cross-band ratio 1.0 < 1.6 → P-2 RED.
 *   MUT-P5-3.1HZ: force the breath animation-duration to 323 ms (3.1 Hz) → P-5 RED (0.1 Hz ± 0 broken; 3.1 > 3/30).
 *   MUT-P6-GUARD: re-enable animation UNDER prefers-reduced-motion (simulating the omitted guard) → an element
 *     animates and moves under reduce → P-6 RED.
 */
import { chromium } from "/home/codi/Entwicklung/nquiry/node_modules/playwright/index.mjs";
const BASE = process.env.PINK_BASE ?? "http://127.0.0.1:3120";
const AN = "CAN_00000000000000000000000000000002";
const L0 = `${BASE}/career/demo?focus=MAPPING&investigationMode=PERSON&analysisId=${AN}`;
const POOL = "JPOOL_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
const MUT = process.env.MUT ?? "P2";
const browser = await chromium.launch();
async function openL0(page, reduce = false) {
  await page.goto(L0, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForSelector('[data-testid="mapping-field"]', { timeout: 30000 });
  await page.waitForTimeout(1400);
  if (await page.locator('[data-testid="guided-onboarding-overlay"]').count() > 0) { await page.locator('[data-testid="onboarding-close-btn"]').first().click().catch(() => {}); await page.waitForTimeout(300); }
}
let out = { commit: "9cc06f84", mutant: MUT };
if (MUT === "P2") {
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } }); const page = await ctx.newPage(); await openL0(page);
  await page.locator(`[data-testid="mapping-pool-${POOL}"]`).first().click().catch(() => {}); await page.waitForTimeout(250);
  await page.locator(`[data-testid="mapping-body-${POOL}:role_all"]`).first().click().catch(() => {}); await page.waitForTimeout(400);
  const before = await page.evaluate(() => { const a = [...document.querySelectorAll('[data-evidence-luminance]')]; const byStep = {}; a.forEach(e => (byStep[e.getAttribute("data-evidence-step")] ??= new Set()).add(+(+getComputedStyle(e).opacity).toFixed(3))); const lums = [...new Set(a.map(e => +(+getComputedStyle(e).opacity).toFixed(3)))].sort((x, y) => y - x); const ratios = []; for (let i = 0; i + 1 < lums.length; i++) ratios.push(+(lums[i] / lums[i + 1]).toFixed(3)); return { byStep: Object.fromEntries(Object.entries(byStep).map(([k, v]) => [k, [...v]])), minRatio: ratios.length ? Math.min(...ratios) : null }; });
  await page.addStyleTag({ content: `[data-testid="mapping-field"] [data-mapping-arc], [data-testid="mapping-field"] [data-mapping-arc] *{opacity:0.8 !important}` });
  await page.waitForTimeout(300);
  const after = await page.evaluate(() => { const a = [...document.querySelectorAll('[data-evidence-luminance]')]; const byStep = {}; a.forEach(e => (byStep[e.getAttribute("data-evidence-step")] ??= new Set()).add(+(+getComputedStyle(e).opacity).toFixed(3))); const perStepMax = Object.fromEntries(Object.entries(byStep).map(([k, v]) => [k, Math.max(...v)])); const vals = Object.values(perStepMax).sort((x, y) => y - x); const ratios = []; for (let i = 0; i + 1 < vals.length; i++) ratios.push(+(vals[i] / vals[i + 1]).toFixed(3)); return { perStepRenderedOpacity: perStepMax, minCrossBandRatio: ratios.length ? Math.min(...ratios) : null }; });
  out = { ...out, before, after, P2_turnedRed: after.minCrossBandRatio !== null && after.minCrossBandRatio < 1.6 };
  await ctx.close();
} else if (MUT === "P5") {
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } }); const page = await ctx.newPage(); await openL0(page);
  const before = await page.evaluate(() => getComputedStyle(document.querySelector('[data-testid="mapping-ring-field"]')).animationDuration);
  await page.addStyleTag({ content: `[data-testid="mapping-field"] [data-testid="mapping-ring-field"][data-breath="LIVE"]{animation-duration:323ms !important}` });
  await page.waitForTimeout(300);
  const after = await page.evaluate(() => { const r = document.querySelector('[data-testid="mapping-ring-field"]'); return { dur: getComputedStyle(r).animationDuration }; });
  const hz = 1000 / parseFloat(after.dur) ; // 323ms → ~3.1 Hz
  out = { ...out, beforeDur: before, afterDur: after.dur, approxHz: +hz.toFixed(2), P5_turnedRed: parseFloat(after.dur) < 9000 };
  await ctx.close();
} else if (MUT === "P6") {
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, reducedMotion: "reduce" }); const page = await ctx.newPage(); await openL0(page, true);
  // guard intact baseline
  const guarded = await page.evaluate(() => { const f = document.querySelector('[data-testid="mapping-field"]'); let off = 0; for (const e of [f, ...f.querySelectorAll("*")]) { const cs = getComputedStyle(e); if (parseFloat(cs.animationDuration) > 0 || parseFloat(cs.transitionDuration) > 0) off++; } return off; });
  // simulate the OMITTED guard: re-enable animations under reduce (higher specificity + !important beats the blanket *)
  await page.addStyleTag({ content: `@media (prefers-reduced-motion: reduce){ [data-testid="mapping-field"] [data-testid="mapping-ring-field"][data-breath="LIVE"]{animation:mappingFieldRingBreath 10000ms linear infinite !important} }` });
  await page.waitForTimeout(400);
  const snap = () => { const r = document.querySelector('[data-testid="mapping-ring-field"]'); const cs = getComputedStyle(r); return { dur: cs.animationDuration, m: new DOMMatrixReadOnly(cs.transform).a.toFixed(5), op: (+cs.opacity).toFixed(4) }; };
  const s1 = await page.evaluate(snap); await page.waitForTimeout(2200); const s2 = await page.evaluate(snap);
  const moved = JSON.stringify(s1) !== JSON.stringify(s2);
  out = { ...out, guardIntactOffenders: guarded, afterInject: { ringDur: s1.dur, movedOver2_2s: moved, s1, s2 }, P6_turnedRed: parseFloat(s1.dur) > 0 && moved };
  await ctx.close();
}
console.log(JSON.stringify(out, null, 1));
await browser.close();
