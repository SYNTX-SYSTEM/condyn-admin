import { readFileSync } from "node:fs";
import { chromium } from "/home/codi/Entwicklung/nquiry/node_modules/playwright/index.mjs";
const [STATE, OUT] = process.argv.slice(2);
const st = JSON.parse(readFileSync(STATE, "utf8"));
const browser = await chromium.launch();
const rect = (page, sel) => page.evaluate(s => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom }; }, sel);
const ov = (a, b) => !!a && !!b && a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b;
for (const [w, h] of [[1280, 720], [1440, 900], [1600, 1000], [1920, 1080]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  await ctx.addInitScript(() => { try { localStorage.setItem("condyn_onboarding_seen", "1"); } catch {} });
  const page = await ctx.newPage();
  for (const [field, q] of [["CAPABILITY", "investigationMode=PERSON&focus=CAPABILITY"], ["FIELD", "investigationMode=PERSON&focus=FIELD"]]) {
    await page.goto(`${st.base}/career/demo?${q}&jobPoolUploadId=${st.validationUploadId}`, { waitUntil: "networkidle" });
    await page.locator(`[data-testid="semantic-career-intelligence-field"][data-field-focus="${field}"]`).waitFor({ timeout: 30000 });
    await page.waitForTimeout(800);
    const sel = await rect(page, '[data-testid="investigation-mode-selector"]');
    const strip = await rect(page, '[data-testid="field-focus-strip"]');
    const ind = await rect(page, '[data-testid="job-scope-indicator"]');
    const buttons = await page.evaluate(() => [...document.querySelectorAll("button")].filter(b => /SEMANTIC GUIDE|HOW THIS WORKS|SYSTEM CODEX/.test(b.textContent ?? "")).map(b => { const r = b.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom }; }));
    const hits = [strip, ind, ...buttons].filter(b => ov(sel, b)).length;
    console.log(`${w}x${h} ${field}: selector ${Math.round(sel.l)}–${Math.round(sel.r)} overlaps=${hits} inViewport=${sel.r <= w}`);
    if (OUT) await page.screenshot({ path: `${OUT}/shell-${field}-${w}.png`, clip: { x: 0, y: 0, width: w, height: 140 } });
  }
  await ctx.close();
}
await browser.close();
