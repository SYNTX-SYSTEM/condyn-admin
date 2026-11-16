/**
 * PINK · PHASE-E · A-8 — "strongest coupling" is a TOTAL order, so PINK's render picks the same PRIMARY beam as
 * GRÜN's. Two independent checks on PINK's own render at 9cc06f84:
 *  (1) DETERMINISM: three reloads pick byte-identical beam requirement ids per body — a nondeterministic tie-break
 *      would vary. (The build is GRÜN's; a deterministic pick here is the pick GRÜN's render makes too.)
 *  (2) RULE: for each beamed body, open it (L2) and confirm the beamed requirement has the MAXIMUM requirement
 *      value (from its state) among the body's beam-bearing arcs; any tie at the max is resolved to the lower ring
 *      order (DOM order) then poolRequirementId.
 */
import { playwright, provenance } from "../../../mapping-phase-pink-tools/pink-tools.mjs";
const chromium = await playwright();
const PINK_PROV_9cc06f84 = await provenance({ declaredCommit: "9cc06f84" });
const BASE = process.env.PINK_BASE ?? "http://127.0.0.1:3120";
const AN = "CAN_00000000000000000000000000000002";
const L0 = `${BASE}/career/demo?focus=MAPPING&investigationMode=PERSON&analysisId=${AN}`;
const VALUE = { EQUIVALENT: 1, COVERS: 1, PARTIAL: 0.5, DIFFERENT: 0, UNCLEAR: 0, NAME_EXACT: 0.5, NAME_ALIAS: 0.5, NAME_COMPOSITE_CONSTITUENT: 0, WEAK_TOKEN_CONTAINMENT: 0, NONE: 0 };
const browser = await chromium.launch();
async function openL0(page) {
  await page.goto(L0, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForSelector('[data-testid="mapping-field"]', { timeout: 30000 });
  await page.waitForTimeout(1200);
  if (await page.locator('[data-testid="guided-onboarding-overlay"]').count() > 0) { await page.locator('[data-testid="onboarding-close-btn"]').first().click().catch(() => {}); await page.waitForTimeout(300); }
}
const beamMap = () => Object.fromEntries([...document.querySelectorAll('[data-testid^="mapping-beam-"]')].map(b => {
  const id = b.getAttribute("data-testid").replace("mapping-beam-", ""); const i = id.lastIndexOf(":");
  return [id.slice(0, i), id.slice(i + 1)]; // body -> poolRequirementId
}).sort());

// (1) determinism across 3 reloads
const loads = [];
for (let i = 0; i < 3; i++) { const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } }); const page = await ctx.newPage(); await openL0(page); loads.push(await page.evaluate(beamMap)); await ctx.close(); }
const deterministic = JSON.stringify(loads[0]) === JSON.stringify(loads[1]) && JSON.stringify(loads[1]) === JSON.stringify(loads[2]);

// (2) rule per beamed body
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
const page = await ctx.newPage(); await openL0(page);
const beams = loads[0];
const ruleRows = [];
for (const [body, reqId] of Object.entries(beams)) {
  const [pool, role] = body.split(":");
  await page.locator(`[data-testid="mapping-pool-${pool}"]`).first().click().catch(() => {}); await page.waitForTimeout(200);
  await page.locator(`[data-testid="mapping-body-${pool}:${role}"]`).first().click().catch(() => {}); await page.waitForTimeout(350);
  const arcs = await page.evaluate(() => [...document.querySelectorAll('[data-mapping-arc]')].map((a, domOrder) => ({ req: a.getAttribute("data-requirement"), state: a.getAttribute("data-state"), beam: a.getAttribute("data-beam"), domOrder })));
  const bearing = arcs.filter(a => a.beam && a.beam !== "none").map(a => ({ ...a, v: VALUE[a.state] ?? 0 }));
  const maxV = Math.max(...bearing.map(a => a.v));
  const top = bearing.filter(a => a.v === maxV).sort((x, y) => x.domOrder - y.domOrder || (x.req < y.req ? -1 : 1));
  const expected = top[0]?.req ?? null;
  ruleRows.push({ body, beamReq: reqId, beamState: arcs.find(a => a.req === reqId)?.state, expectedByRule: expected, ok: expected === reqId, bearingCount: bearing.length, maxV });
  // back to L0
  await page.keyboard.press("Escape").catch(() => {}); await page.waitForTimeout(150); await page.keyboard.press("Escape").catch(() => {}); await page.waitForTimeout(200);
}
await ctx.close();
await browser.close();
console.log(JSON.stringify({ commit: PINK_PROV_9cc06f84.observedCommit, deterministic, loads, ruleAllOk: ruleRows.every(r => r.ok), ruleRows }, null, 1));
