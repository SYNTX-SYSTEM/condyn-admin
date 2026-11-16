/**
 * PINK · PHASE-E · P-5/E-6 corroboration at idle (COMPLETED, nothing selected): the ONLY thing that moves is the
 * field ring's breath. Sample every drawn element's geometry+opacity twice 2.6 s apart; report which moved and the
 * ring's scale amplitude (P-5 ≤ 1.5%) and opacity swing. (GELB §18: exactly one element moves — mapping-ring-field,
 * opacity 0.9998→0.9604.)
 */
import { playwright, provenance } from "../../../mapping-phase-pink-tools/pink-tools.mjs";
const chromium = await playwright();
const PINK_PROV_9cc06f84 = await provenance({ declaredCommit: "9cc06f84" });
const BASE = process.env.PINK_BASE ?? "http://127.0.0.1:3120";
const AN = "CAN_00000000000000000000000000000002";
const L0 = `${BASE}/career/demo?focus=MAPPING&investigationMode=PERSON&analysisId=${AN}`;
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, reducedMotion: "no-preference" });
const page = await ctx.newPage();
await page.goto(L0, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForSelector('[data-testid="mapping-field"]', { timeout: 30000 });
await page.waitForTimeout(1500);
if (await page.locator('[data-testid="guided-onboarding-overlay"]').count() > 0) { await page.locator('[data-testid="onboarding-close-btn"]').first().click().catch(() => {}); await page.waitForTimeout(300); }
const SNAP = () => { const f = document.querySelector('[data-testid="mapping-field"]'); const out = {}; for (const el of [f, ...f.querySelectorAll("*")]) { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); out[(el.getAttribute("data-testid") || el.tagName) + "#" + [...f.querySelectorAll("*")].indexOf(el)] = { x: +r.x.toFixed(2), y: +r.y.toFixed(2), w: +r.width.toFixed(2), op: +(+cs.opacity).toFixed(4), tr: cs.transform }; } return out; };
// sample the ring over a full-ish window to catch peak scale/opacity
const ringSeries = [];
for (let i = 0; i < 26; i++) { ringSeries.push(await page.evaluate(() => { const r = document.querySelector('[data-testid="mapping-ring-field"]'); const cs = getComputedStyle(r); const m = new DOMMatrixReadOnly(cs.transform); return { scale: +m.a.toFixed(5), op: +(+cs.opacity).toFixed(4) }; })); await page.waitForTimeout(450); }
const s1 = await page.evaluate(SNAP); await page.waitForTimeout(2600); const s2 = await page.evaluate(SNAP);
const moved = Object.keys(s1).filter(k => JSON.stringify(s1[k]) !== JSON.stringify(s2[k]));
const scales = ringSeries.map(r => r.scale), ops = ringSeries.map(r => r.op);
console.log(JSON.stringify({ commit: PINK_PROV_9cc06f84.observedCommit, movedAtIdle: moved, movedCount: moved.length,
  ringScale: { min: Math.min(...scales), max: Math.max(...scales), amplitudePct: +(((Math.max(...scales) - Math.min(...scales)) / 2) * 100).toFixed(3) },
  ringOpacity: { min: Math.min(...ops), max: Math.max(...ops), swing: +(Math.max(...ops) - Math.min(...ops)).toFixed(4) } }, null, 1));
await ctx.close(); await browser.close();
