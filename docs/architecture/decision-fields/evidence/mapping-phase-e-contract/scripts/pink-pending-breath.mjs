/**
 * PINK · PHASE-E · P-5/E-6 "the breath stops while pending". Served through the p13 façade phase A (auto-match
 * RUNNING ⇒ pending). The field ring must read data-breath="STILL", carry no breath animation, and not move.
 */
import { chromium } from "/home/codi/Entwicklung/nquiry/node_modules/playwright/index.mjs";
const BASE = process.env.PINK_BASE ?? "http://127.0.0.1:3120";
const AN = "CAN_00000000000000000000000000000002";
const L0 = `${BASE}/career/demo?focus=MAPPING&investigationMode=PERSON&analysisId=${AN}`;
const browser = await chromium.launch();
await fetch(`${BASE}/__pink/reset`).catch(() => {}); // ensure phase A (RUNNING) if p13 façade; harmless otherwise
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, reducedMotion: "no-preference" });
const page = await ctx.newPage();
await page.goto(L0, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForSelector('[data-testid="mapping-field"]', { timeout: 30000 });
await page.waitForTimeout(1600);
if (await page.locator('[data-testid="guided-onboarding-overlay"]').count() > 0) { await page.locator('[data-testid="onboarding-close-btn"]').first().click().catch(() => {}); await page.waitForTimeout(300); }
const read = () => { const f = document.querySelector('[data-testid="mapping-field"]'); const ring = document.querySelector('[data-testid="mapping-ring-field"]'); const cs = ring ? getComputedStyle(ring) : null; const snap = {}; for (const el of [f, ...f.querySelectorAll("*")]) { const r = el.getBoundingClientRect(); const c = getComputedStyle(el); snap[(el.getAttribute("data-testid") || el.tagName)] = `${r.x.toFixed(2)},${r.y.toFixed(2)},${(+c.opacity).toFixed(3)},${new DOMMatrixReadOnly(c.transform).a.toFixed(4)}`; } return { pendingBreath: f.getAttribute("data-pending-breath"), fieldBreath: f.getAttribute("data-breath"), runState: f.getAttribute("data-run-state"), ringBreath: ring?.getAttribute("data-breath"), ringAnim: cs?.animationName, ringDur: cs?.animationDuration, snap }; };
const a = await page.evaluate(read); await page.waitForTimeout(2600); const b = await page.evaluate(read);
const moved = Object.keys(a.snap).filter(k => a.snap[k] !== b.snap[k]);
await ctx.close(); await browser.close();
console.log(JSON.stringify({ commit: "9cc06f84", runState: a.runState, pendingBreath: a.pendingBreath, fieldBreath: a.fieldBreath, ringBreath: a.ringBreath, ringAnim: a.ringAnim, ringDur: a.ringDur, movedWhilePending: moved, movedCount: moved.length, pass: a.ringBreath === "STILL" && (a.ringAnim === "none" || a.ringAnim === undefined) && moved.length === 0 }, null, 1));
