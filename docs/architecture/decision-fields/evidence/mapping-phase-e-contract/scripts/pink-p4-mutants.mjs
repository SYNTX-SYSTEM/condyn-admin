/**
 * PINK · PHASE-E · P-4 red-first + the surviving mutant, by faithful runtime injection (reproduces the mutated
 * RENDER without a rebuild).
 *   MUT-LAYOUT-TRANSIENT (P-11): give LAYOUT a luminance transient → the Steady body must brighten → P-4 RED.
 *   MUT-EVIDENCE-EASES (GELB's surviving mutant): put a transform transition on data-change="EVIDENCE". The body
 *     REMOUNTS (new key ⇒ new element ⇒ nothing to transition from), so it must STILL CUT — the mutant SURVIVES,
 *     and the cut is shown to be structural (the remount), not a property of the stylesheet. Dropping the remount
 *     is a JS change (separate source build).
 */
import { chromium } from "/home/codi/Entwicklung/nquiry/node_modules/playwright/index.mjs";
const BASE = process.env.PINK_BASE ?? "http://127.0.0.1:3120";
const AN = "CAN_00000000000000000000000000000002";
const L0 = `${BASE}/career/demo?focus=MAPPING&investigationMode=PERSON&analysisId=${AN}`;
const POOL = "JPOOL_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
const RISING = `mapping-body-${POOL}:role_x`, STEADY = `mapping-body-${POOL}:role_y`;
const browser = await chromium.launch();
async function ctl(p) { return (await fetch(`${BASE}${p}`)).json(); }
async function run(css, watch) {
  await ctl("/__pink/flip?to=A").catch(() => {}); // facade p4 has no reset; A is initial via fresh — handled below
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, reducedMotion: "no-preference" });
  const page = await ctx.newPage();
  await page.goto(L0, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForSelector('[data-testid="mapping-field"]', { timeout: 30000 });
  await page.waitForTimeout(1400);
  if (await page.locator('[data-testid="guided-onboarding-overlay"]').count() > 0) { await page.locator('[data-testid="onboarding-close-btn"]').first().click().catch(() => {}); await page.waitForTimeout(300); }
  await page.addStyleTag({ content: css });
  const rec = page.evaluate(({ watch }) => new Promise(resolve => {
    const r = { bright: [], tr: new Set(), change: new Set() }; let started = null;
    function f(now) { const e = document.querySelector(`[data-testid="${watch}"]`); if (e) { const ch = e.getAttribute("data-change"); if (started === null && ch) started = now; if (started !== null) { const cs = getComputedStyle(e); const m = /brightness\(([^)]+)\)/.exec(cs.filter); r.bright.push(m ? parseFloat(m[1]) : 1); r.tr.add(cs.transform); if (ch) r.change.add(ch); if (now - started > 1400) { resolve({ peakBright: Math.max(1, ...r.bright), distinctTr: r.tr.size, changes: [...r.change], frames: r.bright.length }); return; } } } requestAnimationFrame(f); }
    requestAnimationFrame(f);
    setTimeout(() => resolve({ peakBright: Math.max(1, ...r.bright), distinctTr: r.tr.size, changes: [...r.change], frames: r.bright.length, timedOut: true }), 9000);
  }), { watch });
  await new Promise(r => setTimeout(r, 200));
  await ctl("/__pink/flip?to=B");
  const out = await rec;
  await ctx.close();
  return out;
}
// Note: the p4 façade starts at phase A on process start; each run re-opens the page while phase is whatever the
// previous run left. We re-create the façade state by flipping to A is unsupported, so run LAYOUT-transient first
// (needs the A→B transition) on a FRESH façade, then restart façade externally for the second. To keep it simple
// here we only rely on the FIRST transition; the runner script restarts the façade between the two mutants.
const which = process.env.MUT ?? "LAYOUT";
let result;
if (which === "LAYOUT") {
  result = { mutant: "MUT-LAYOUT-TRANSIENT", watch: "STEADY(role_y)",
    ...(await run(`[data-testid="mapping-field"] [data-mapping-body][data-change="LAYOUT"]{animation:mappingFieldTransient 780ms linear 1 !important}`, STEADY)) };
  result.P4_turnedRed = result.peakBright > 1.3; // LAYOUT now carries luminance ⇒ P-4 red
} else {
  result = { mutant: "MUT-EVIDENCE-EASES", watch: "RISING(role_x)",
    ...(await run(`[data-testid="mapping-field"] [data-mapping-body][data-change="EVIDENCE"],[data-testid="mapping-field"] [data-mapping-arc][data-change="EVIDENCE"]{transition:transform 900ms linear !important}`, RISING)) };
  result.survived_stillCut = result.distinctTr <= 3; // remount ⇒ no glide ⇒ cut survives
}
console.log(JSON.stringify({ commit: "9cc06f84", ...result }, null, 1));
await browser.close();
