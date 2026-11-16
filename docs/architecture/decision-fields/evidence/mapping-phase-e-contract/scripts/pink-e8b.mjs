/**
 * PINK · PHASE-E · E-8b bound 3 — the clamp is SCROLL-INVARIANT and resize-convergent one-pass. PINK owns this.
 * At each size: baseline stage box; then scroll host to bottom and back; then resize away and back; then measure
 * WHILE scrolled. The stage box and containment (P-7) must be identical at every step — a clamp that measured in
 * raw viewport coords would drift when measured scrolled; one that overshoots would need a second pass to settle.
 */
import { chromium } from "/home/codi/Entwicklung/nquiry/node_modules/playwright/index.mjs";
const BASE = process.env.PINK_BASE ?? "http://127.0.0.1:3120";
const AN = "CAN_00000000000000000000000000000002";
const L0 = `${BASE}/career/demo?focus=MAPPING&investigationMode=PERSON&analysisId=${AN}`;
const browser = await chromium.launch();

const MEASURE = () => {
  const svg = document.querySelector('[data-testid="mapping-field-svg"]');
  const r = svg.getBoundingClientRect();
  const drawn = [...document.querySelectorAll('[data-mapping-body],[data-mapping-node],[data-mapping-arc],[data-testid^="mapping-sector-name-"],[data-testid^="mapping-ring"]')];
  const sx = window.scrollX, sy = window.scrollY;
  // document-coordinate stage box (viewport rect + scroll) — scroll-invariant if the clamp is correct
  const stageDoc = { top: +(r.top + sy).toFixed(1), left: +(r.left + sx).toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) };
  const inside = drawn.every(d => { const b = d.getBoundingClientRect(); return b.top >= r.top - 0.6 && b.bottom <= r.bottom + 0.6 && b.left >= r.left - 0.6 && b.right <= r.right + 0.6; });
  return { stageDoc, w: +r.width.toFixed(1), h: +r.height.toFixed(1), allInside: inside, scrollY: sy };
};
async function open(page) {
  await page.goto(L0, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForSelector('[data-testid="mapping-field"]', { timeout: 30000 });
  await page.waitForTimeout(1400);
  if (await page.locator('[data-testid="guided-onboarding-overlay"]').count() > 0) { await page.locator('[data-testid="onboarding-close-btn"]').first().click().catch(() => {}); await page.waitForTimeout(300); }
}
const report = { commit: "716a1941", sizes: [] };
for (const [S, Alt] of [[{ w: 1829, h: 912 }, { w: 1280, h: 800 }], [{ w: 1280, h: 800 }, { w: 2560, h: 1300 }]]) {
  const ctx = await browser.newContext({ viewport: { width: S.w, height: S.h } });
  const page = await ctx.newPage();
  await open(page);
  const baseline = await page.evaluate(MEASURE);
  // scroll host to bottom then back to top
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(500);
  const whileScrolled = await page.evaluate(MEASURE);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
  const afterScroll = await page.evaluate(MEASURE);
  // resize away and back
  await page.setViewportSize({ width: Alt.w, height: Alt.h }); await page.waitForTimeout(500);
  await page.setViewportSize({ width: S.w, height: S.h }); await page.waitForTimeout(600);
  const afterResize = await page.evaluate(MEASURE);
  const dims = [baseline, afterScroll, afterResize].map(m => `${m.w}x${m.h}`);
  const stageDocSame = JSON.stringify(baseline.stageDoc) === JSON.stringify(afterScroll.stageDoc) && JSON.stringify(baseline.stageDoc) === JSON.stringify(afterResize.stageDoc);
  report.sizes.push({
    size: S,
    baseline, whileScrolled_W_H: `${whileScrolled.w}x${whileScrolled.h}`, afterScroll_W_H: `${afterScroll.w}x${afterScroll.h}`, afterResize_W_H: `${afterResize.w}x${afterResize.h}`,
    scrollInvariant: dims[0] === dims[1] && stageDocSame,
    resizeConvergent: dims[0] === dims[2],
    containedWhileScrolled: whileScrolled.allInside,
    pass: dims[0] === dims[1] && dims[0] === dims[2] && stageDocSame && whileScrolled.allInside && baseline.allInside
  });
  await ctx.close();
}
console.log(JSON.stringify(report, null, 1));
await browser.close();
