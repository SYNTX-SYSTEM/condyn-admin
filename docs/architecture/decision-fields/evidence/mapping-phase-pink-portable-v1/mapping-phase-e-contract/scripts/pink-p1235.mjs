/**
 * PINK · PHASE-E · independent verification of GELB's §16 numbers for P-1, P-2, P-3, P-5 on PINK's own render at
 * 716a1941, served by the plain static façade (reading A, auto-match COMPLETED → settled, breath LIVE).
 *   P-1  L0 beams: count + every data-beam-rank PRIMARY (GELB: 3 PRIMARY for 5 bodies).
 *   P-2  evidence bands PER FOCUSED GROUP from data-evidence-luminance, bucketed by data-evidence-step; closest
 *        cross-band ratio ≥ 1.6× (GELB: SEMANTIC 1.000 / LEXICAL 0.528 / NONE 0.232, ratios 1.89 and 2.28).
 *   P-3  selecting a capability sets its bodies into one shared-phase query oscillation: computed animationName,
 *        duration (GELB 1.4s), delay 0s, iteration infinite; --mf-query-amp = 1.5px·k.
 *   P-5  the field ring breathes: data-breath LIVE, animationName mappingFieldRingBreath, duration (GELB 10s).
 */
import { playwright, provenance } from "../../../mapping-phase-pink-tools/pink-tools.mjs";
const chromium = await playwright();
const PINK_PROV_716a1941 = await provenance({ declaredCommit: "716a1941" });
const BASE = process.env.PINK_BASE ?? "http://127.0.0.1:3120";
const AN = "CAN_00000000000000000000000000000002";
const L0 = `${BASE}/career/demo?focus=MAPPING&investigationMode=PERSON&analysisId=${AN}`;
const POOL_ALL = "JPOOL_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", ROLE_ALL = "role_all";
const browser = await chromium.launch();
const report = { commit: PINK_PROV_716a1941.observedCommit, base: BASE };

async function openL0(page) {
  await page.goto(L0, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForSelector('[data-testid="mapping-field"]', { timeout: 30000 });
  await page.waitForTimeout(1500);
  if (await page.locator('[data-testid="guided-onboarding-overlay"]').count() > 0) {
    await page.locator('[data-testid="onboarding-close-btn"]').first().click().catch(() => {});
    await page.waitForTimeout(300);
  }
}

// ---- P-1 + P-5 at L0 ----
{
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, reducedMotion: "no-preference" });
  const page = await ctx.newPage();
  await openL0(page);
  report.P1 = await page.evaluate(() => {
    const field = document.querySelector('[data-testid="mapping-field"]');
    const beams = [...field.querySelectorAll('[data-testid^="mapping-beam-"]')];
    return {
      beamCount: beams.length,
      ranks: [...new Set(beams.map(b => b.getAttribute("data-beam-rank")))],
      allPrimary: beams.length > 0 && beams.every(b => b.getAttribute("data-beam-rank") === "PRIMARY"),
      fieldBeamsAttr: field.getAttribute("data-beams"),
      undrawn: field.querySelector('[data-testid="mapping-primary-undrawn"]')?.getAttribute("data-count") ?? null,
      bodies: field.querySelectorAll('[data-testid^="mapping-body-"]').length
    };
  });
  report.P5 = await page.evaluate(() => {
    const ring = document.querySelector('[data-testid="mapping-ring-field"]');
    if (!ring) return { error: "no ring-field" };
    const cs = getComputedStyle(ring);
    return { dataBreath: ring.getAttribute("data-breath"), animationName: cs.animationName, durationMs: cs.animationDuration, iteration: cs.animationIterationCount, timing: cs.animationTimingFunction };
  });
  await ctx.close();
}

// ---- P-2 per focused group: open role_all (spans all states) ----
{
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, reducedMotion: "no-preference" });
  const page = await ctx.newPage();
  await openL0(page);
  await page.locator(`[data-testid="mapping-pool-${POOL_ALL}"]`).first().click().catch(() => {});
  await page.waitForTimeout(300);
  await page.locator(`[data-testid="mapping-body-${POOL_ALL}:${ROLE_ALL}"]`).first().click().catch(() => {});
  await page.waitForTimeout(500);
  report.P2 = await page.evaluate(() => {
    const field = document.querySelector('[data-testid="mapping-field"]');
    const arcs = [...field.querySelectorAll('[data-evidence-luminance]')].map(a => ({
      id: a.getAttribute("data-testid") || a.getAttribute("data-arc-line") !== null ? "arc-line" : a.tagName,
      step: a.getAttribute("data-evidence-step"),
      lum: +a.getAttribute("data-evidence-luminance"),
      stateLum: a.getAttribute("data-luminance"),
      opacity: +(+getComputedStyle(a).opacity).toFixed(3)
    }));
    // bucket distinct band luminances by evidence step
    const byStep = {};
    for (const a of arcs) { (byStep[a.step] ??= new Set()).add(a.lum); }
    const bands = Object.fromEntries(Object.entries(byStep).map(([k, v]) => [k, [...v].sort((x, y) => y - x)]));
    // closest cross-step ratio: sort all band extremes, adjacent ratio
    const allLums = [...new Set(arcs.map(a => a.lum))].sort((x, y) => y - x);
    const ratios = [];
    for (let i = 0; i + 1 < allLums.length; i++) ratios.push(+(allLums[i] / allLums[i + 1]).toFixed(3));
    return { arcCount: arcs.length, bands, distinctLums: allLums, adjacentRatios: ratios, minRatio: ratios.length ? Math.min(...ratios) : null, sample: arcs.slice(0, 12) };
  });
  await ctx.close();
}

// ---- P-3: select a capability → query oscillation ----
{
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, reducedMotion: "no-preference" });
  const page = await ctx.newPage();
  await openL0(page);
  // find a capability node and click it
  const cap = page.locator('[data-testid^="mapping-capability-"]').first();
  const capId = (await cap.count()) ? await cap.getAttribute("data-testid") : null;
  if (capId) { await cap.click().catch(() => {}); await page.waitForTimeout(600); }
  report.P3 = await page.evaluate(() => {
    const field = document.querySelector('[data-testid="mapping-field"]');
    const q = [...field.querySelectorAll('[data-motion="QUERY"]')];
    if (q.length === 0) return { queryCount: 0, note: "no QUERY element after capability select" };
    const el = q[0];
    const cs = getComputedStyle(el);
    const host = field.querySelector('[data-testid="mapping-field-svg"]') || field;
    const amp = getComputedStyle(field.querySelector('[style*="--mf-query-amp"]') || field).getPropertyValue("--mf-query-amp");
    // read --mf-query-amp from any element that declares it
    let ampDecl = null;
    for (const e of field.querySelectorAll("*")) { const v = e.style?.getPropertyValue?.("--mf-query-amp"); if (v) { ampDecl = v; break; } }
    return { queryCount: q.length, animationName: cs.animationName, durationMs: cs.animationDuration, delay: cs.animationDelay, iteration: cs.animationIterationCount, timing: cs.animationTimingFunction, queryAmp: ampDecl };
  });
  await ctx.close();
}

console.log(JSON.stringify(report, null, 1));
await browser.close();
