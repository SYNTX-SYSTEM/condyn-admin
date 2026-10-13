export const BASE = "http://127.0.0.1:41803";
export async function analyzedField(page) {
  await page.goto(`${BASE}/career/demo`, { waitUntil: "domcontentloaded", timeout: 180000 });
  try { await page.getByTestId("guided-onboarding-overlay").waitFor({ timeout: 20000 }); await page.getByTestId("onboarding-close-btn").click(); await page.getByTestId("guided-onboarding-overlay").waitFor({ state: "detached", timeout: 15000 }); } catch {}
  await page.getByTestId("add-text-source-btn").click();
  await page.getByTestId("source-text-input").fill("Synthetic lab profile for the red-field typography pass. Built distributed systems in TypeScript and PostgreSQL.");
  await page.getByTestId("submit-source-btn").click();
  await page.getByTestId("start-intake-analysis-btn").click();
  await page.locator('[data-attention-state="EMPTY_PROJECTION_ATTENTION"]').first().waitFor({ timeout: 180000 });
  await page.mouse.move(5, 995); await page.waitForTimeout(2500);
}
