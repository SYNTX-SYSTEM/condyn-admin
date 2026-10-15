import { readFileSync } from "node:fs";
const { chromium } = await import("/home/codi/Entwicklung/nquiry/node_modules/playwright/index.mjs");
const st = JSON.parse(readFileSync("/tmp/claude-1000/-home-codi-Entwicklung-condyn-admin-hr-dock/9dcc4453-2a41-4995-9a96-3a0c05b242a5/scratchpad/lab/state.json", "utf8"));
const browser = await chromium.launch({ headless: true });
for (const [w, h] of [[1600, 1000], [1280, 720]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.goto(`${st.base}/career/demo?focus=FIELD&analysisId=${st.analysisId}`, { waitUntil: "domcontentloaded" });
  await page.locator('[data-testid="syntx-field"][data-field-state="NO_POOL"]').waitFor({ timeout: 120000 });
  const r = await page.evaluate(() => { const all = [...document.querySelectorAll("*")].filter(e => [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.includes("PRESENTED != EVALUATED"))); const f = all[all.length - 1]; const b = f.getBoundingClientRect(); const g = document.querySelector('[data-testid="syntx-no-pool"]').getBoundingClientRect(); return { footer: [Math.round(b.left), Math.round(b.top), Math.round(b.right), Math.round(b.bottom)], giantWithRing: [Math.round(g.left - 14), Math.round(g.top - 14), Math.round(g.right + 14), Math.round(g.bottom + 14)], docH: document.documentElement.scrollHeight }; });
  console.log(`${w}x${h}`, JSON.stringify(r)); await page.close();
}
await browser.close();
