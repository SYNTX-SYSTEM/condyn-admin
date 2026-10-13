import { readFileSync } from "node:fs";
const { chromium } = await import("/home/codi/Entwicklung/nquiry/node_modules/playwright/index.mjs");
const st = JSON.parse(readFileSync("/tmp/claude-1000/-home-codi-Entwicklung-condyn-admin-hr-dock/9dcc4453-2a41-4995-9a96-3a0c05b242a5/scratchpad/lab/state.json", "utf8"));
const browser = await chromium.launch({ headless: true }); const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto(`${st.base}/career/demo?focus=FIELD&analysisId=${st.analysisId}`, { waitUntil: "domcontentloaded" });
try { await page.getByTestId("guided-onboarding-overlay").waitFor({ timeout: 15000 }); await page.getByTestId("onboarding-close-btn").click(); } catch {}
await page.locator('[data-testid="syntx-field"][data-field-state="NO_POOL"]').waitFor({ timeout: 120000 }); await page.mouse.move(1275, 715); await page.waitForTimeout(1500);
await page.evaluate(() => { for (const a of document.querySelector('[data-testid="syntx-no-pool"]').getAnimations({ subtree: true })) { if (!a.animationName?.startsWith("sxGiant")) continue; a.pause(); a.currentTime = 4600 + (a.animationName === "sxGiantRing" ? 350 : 0); } });
await page.waitForTimeout(300); await page.screenshot({ path: process.argv[2] });
const r = await page.evaluate(() => { const rr = e => { const b = e.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top), Math.round(b.right), Math.round(b.bottom)]; }; return { membranes: [...document.querySelectorAll("[data-sx-giant-membrane]")].map(rr), orient: rr(document.querySelector("[data-sx-orient]")), selector: rr(document.querySelector('[data-testid="field-focus-strip"]')), poolList: rr(document.querySelector('[data-testid="job-pool-list"]')) }; });
console.log(JSON.stringify(r)); await browser.close();
