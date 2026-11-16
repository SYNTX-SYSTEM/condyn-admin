/** PINK · PHASE G · taxonomy re-probe on 3ec8457d. Counts RENDERED elements per candidate mask selector at
 *  L0/L1/L2, so the phase-F masks can be checked for coverage against the phase-G drawing. No luminance. */
import { chromium } from "/home/codi/Entwicklung/nquiry/node_modules/playwright/index.mjs";
const BASE = "http://127.0.0.1:3122", AN = "CAN_00000000000000000000000000000002";
const URL = `${BASE}/career/demo?focus=MAPPING&investigationMode=PERSON&analysisId=${AN}`;
// phase-F PF-8 per-class masks (as committed) + PG-1 SEM selector + the phase-G carriers found in source
const SEL = {
  "PF8 rings":    '[data-testid^="mapping-ring"]',
  "PF8 arcs":     '[data-mapping-arc]',
  "PF8 beams":    '[data-beam]',
  "PF8 nodes":    '[data-mapping-node]',
  "PF8 text":     'text',
  "PF8 outlines": '[data-mapping-body-shape]',
  "PG1 SEM(committed)": '[data-mapping-body],[data-mapping-arc],[data-beam],[data-mapping-node],[data-mapping-sector]',
  "NEW glows(g)":   '[data-testid="mapping-glows"]',
  "NEW glows(kids)":'[data-testid="mapping-glows"] *',
  "NEW mf-travel":  '.mf-travel',
  "NEW mf-beam-glow":'.mf-beam-glow',
  "NEW mf-halo-gap":'[fill="url(#mf-halo-gap)"], .mf-halo-gap',
  "NEW trail":      '[data-mapping-trail]',
  "NEW body-content":'[data-mapping-body-content]',
  "NEW measure":    '[data-testid^="mapping-measure-"]',
  "NEW beyond-budget":'[data-testid="mapping-beyond-budget"]',
  "seats(mf-seat)": '.mf-seat',
  "bodies":         '[data-mapping-body]',
};
const b = await chromium.launch();
const ctx = await b.newContext({ viewport:{width:1920,height:1080}, deviceScaleFactor:1, reducedMotion:"reduce" });
const page = await ctx.newPage();
await page.goto(URL, { waitUntil:"networkidle", timeout:60000 });
await page.waitForSelector('[data-testid="mapping-field"]', { timeout:30000 });
await page.waitForTimeout(1200);
while (await page.locator('[data-testid="guided-onboarding-overlay"]').count() > 0) {
  await page.locator('[data-testid="onboarding-close-btn"]').first().click().catch(()=>{});
  await page.keyboard.press("Escape").catch(()=>{});
  await page.waitForTimeout(400);
}
const overlay = await page.locator('[data-testid="guided-onboarding-overlay"]').count();
const count = async () => Object.fromEntries(await Promise.all(
  Object.entries(SEL).map(async ([k,s]) => [k, await page.locator(s).count().catch(()=>-1)])));
const out = { commit:"3ec8457d", buildId:"xCD8LBxdjnP97-2Gjs5yr", viewport:"1920x1080", overlay, levels:{} };
out.levels.L0 = await count();
out.levels.L0.breath = await page.getAttribute('[data-testid="mapping-field"]','data-breath').catch(()=>null);
out.levels.L0.level  = await page.getAttribute('[data-testid="mapping-field"]','data-level').catch(()=>null);
// L1: open a pool.  L2: then open a body.
const pool = page.locator('[data-mapping-sector]').first();
if (await pool.count() > 0) { await pool.click({force:true}).catch(()=>{}); await page.waitForTimeout(900);
  out.levels.L1 = await count(); out.levels.L1.level = await page.getAttribute('[data-testid="mapping-field"]','data-level').catch(()=>null); }
const body = page.locator('[data-mapping-body]').first();
if (await body.count() > 0) { await body.click({force:true}).catch(()=>{}); await page.waitForTimeout(900);
  out.levels.L2 = await count(); out.levels.L2.level = await page.getAttribute('[data-testid="mapping-field"]','data-level').catch(()=>null); }
await ctx.close(); await b.close();
console.log(JSON.stringify(out,null,1));
