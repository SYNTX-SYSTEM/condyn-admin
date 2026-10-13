import { readFileSync } from "node:fs";
const { chromium } = await import("/home/codi/Entwicklung/nquiry/node_modules/playwright/index.mjs");
const st = JSON.parse(readFileSync("/tmp/claude-1000/-home-codi-Entwicklung-condyn-admin-hr-dock/9dcc4453-2a41-4995-9a96-3a0c05b242a5/scratchpad/lab/state.json", "utf8"));
const browser = await chromium.launch({ headless: true });
for (const motion of ["no-preference", "reduce"]) {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, reducedMotion: motion });
  const nonGet = []; page.on("request", r => { if (r.method() !== "GET") nonGet.push(r.url()); }); const errors = []; page.on("pageerror", e => errors.push(String(e)));
  await page.goto(`${st.base}/career/demo?focus=FIELD&analysisId=${st.analysisId}`, { waitUntil: "domcontentloaded" });
  try { await page.getByTestId("guided-onboarding-overlay").waitFor({ timeout: 15000 }); await page.getByTestId("onboarding-close-btn").click(); } catch {}
  await page.locator('[data-testid="syntx-field"][data-field-state="NO_POOL"]').waitFor({ timeout: 120000 });
  const before = await page.getByTestId("syntx-no-pool").count();
  const anim = await page.getByTestId("syntx-no-pool").evaluate(g => g.getAnimations({ subtree: true }).map(a => `${a.animationName}:${a.effect.getTiming().iterations}`));
  await page.getByTestId(`job-pool-select-${st.uploadId}`).click();
  await page.locator('[data-testid="syntx-field"][data-field-state="AVAILABLE"]').waitFor({ timeout: 120000 });
  const after = { giant: await page.getByTestId("syntx-no-pool").count(), pool: await page.getByTestId("syntx-pool").count(), url: new URL(page.url()).searchParams.get("jobPoolUploadId") };
  await page.keyboard.press("Escape"); await page.waitForTimeout(800);
  const afterEsc = await page.getByTestId("syntx-field").getAttribute("data-field-state");
  console.log(motion, JSON.stringify({ giantBefore: before, giantAnimations: anim, after, afterEsc, nonGet, errors }));
  await page.close();
}
await browser.close();
