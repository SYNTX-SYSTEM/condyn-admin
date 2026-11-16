/**
 * PINK · PHASE-E · P-6 JS-BRANCH mutant (N-3's second mutant). The stage re-frame is a JS rAF tween of the SVG
 * viewBox (component :334-342), gated by reducedMotion(). The CSS blanket guard does NOT touch viewBox, so only
 * P-6 half (b) "nothing moves" can catch it. Under prefers-reduced-motion, open a body (a boxKey change) and watch
 * the viewBox + drawn elements across the transition.
 *   UNMUTATED: reducedMotion() true ⇒ the frame CUTS (one viewBox, data-stage SETTLED) ⇒ P-6 green.
 *   MUTANT (reducedMotion()→false): the viewBox TWEENS over many frames ⇒ the field moves under reduce ⇒ P-6 RED.
 */
import { playwright, provenance } from "../../../mapping-phase-pink-tools/pink-tools.mjs";
const chromium = await playwright();
const PINK_PROV_9cc06f84 = await provenance({ declaredCommit: "9cc06f84" });
const BASE = process.env.PINK_BASE ?? "http://127.0.0.1:3120";
const AN = "CAN_00000000000000000000000000000002";
const L0 = `${BASE}/career/demo?focus=MAPPING&investigationMode=PERSON&analysisId=${AN}`;
const POOL = "JPOOL_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
const tag = process.env.TAG ?? "unknown";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, reducedMotion: "reduce" });
const page = await ctx.newPage();
await page.goto(L0, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForSelector('[data-testid="mapping-field"]', { timeout: 30000 });
await page.waitForTimeout(1400);
if (await page.locator('[data-testid="guided-onboarding-overlay"]').count() > 0) { await page.locator('[data-testid="onboarding-close-btn"]').first().click().catch(() => {}); await page.waitForTimeout(300); }
// install an in-page rAF recorder of the viewBox + a sample body rect, then open a body to trigger the boxKey change
const recP = page.evaluate(() => new Promise(resolve => {
  const svg = document.querySelector('[data-testid="mapping-field-svg"]');
  const vbs = new Set(); const stages = new Set(); let frames = 0; const t0 = performance.now();
  const body0 = () => { const b = document.querySelector('[data-mapping-body]'); return b ? JSON.stringify(b.getBoundingClientRect()) : null; }
  const bodyRects = new Set();
  function f() { vbs.add(svg.getAttribute("viewBox")); const sec = document.querySelector('[data-stage]'); if (sec) stages.add(sec.getAttribute("data-stage")); const br = body0(); if (br) bodyRects.add(br); frames++; if (performance.now() - t0 < 900) requestAnimationFrame(f); else resolve({ distinctViewBoxes: vbs.size, stagesSeen: [...stages], distinctBodyRects: bodyRects.size, frames }); }
  requestAnimationFrame(f);
}));
await new Promise(r => setTimeout(r, 50));
await page.locator(`[data-testid="mapping-pool-${POOL}"]`).first().click().catch(() => {});
await page.locator(`[data-testid="mapping-body-${POOL}:role_all"]`).first().click().catch(() => {});
const rec = await recP;
await ctx.close(); await browser.close();
// A discrete re-frame (opening a body) legitimately changes the viewBox ONCE under reduce — that is a CUT, not
// motion. Continuous motion is the rAF tween: data-stage reaches "GEOMETRY" and the viewBox passes through many
// interpolated values. That is the only P-6(b) failure.
const tweened = rec.stagesSeen.includes("GEOMETRY");
console.log(JSON.stringify({ commit: PINK_PROV_9cc06f84.observedCommit, build: tag, reducedMotion: true, ...rec,
  tweenRanUnderReduce: tweened,
  P6_b_verdict: tweened ? "RED (viewBox tweened under reduce — JS motion the CSS guard cannot catch)" : "green (re-frame cut to SETTLED; discrete viewBox change is not motion)" }, null, 1));
