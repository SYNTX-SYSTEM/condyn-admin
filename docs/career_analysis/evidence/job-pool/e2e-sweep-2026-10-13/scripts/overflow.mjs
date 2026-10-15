import { readFileSync } from "node:fs";
import { chromium, BASE, DIR, closeOnboarding } from "./common.mjs";
const A = JSON.parse(readFileSync(`${DIR}/state-A.json`, "utf8"));
const browser = await chromium.launch({ headless: true });
for (const vp of [[1600, 1000], [1280, 720], [1440, 900], [1920, 1080]]) {
  for (const focus of ["FIELD", "CAPABILITY"]) {
    const page = await browser.newPage({ viewport: { width: vp[0], height: vp[1] } });
    await page.goto(`${BASE}/career/demo?focus=${focus}&analysisId=${A.analyses.ENG.analysisId}&jobPoolUploadId=${A.uploads.DLL_JOBPOOL_ENGINEERING}`, { waitUntil: "domcontentloaded" }); await closeOnboarding(page); await page.waitForTimeout(3500);
    const m = await page.evaluate(() => { const f = document.querySelector('[data-testid="syntx-field"]'); const fr = f?.getBoundingClientRect(); const s = document.querySelector('[data-testid="job-pool-non-claims"]')?.getBoundingClientRect(); return { docHeight: document.scrollingElement.scrollHeight, field: fr ? [Math.round(fr.top), Math.round(fr.bottom)] : null, footerStatement: s ? [Math.round(s.top), Math.round(s.bottom)] : null }; });
    console.log(JSON.stringify({ vp: vp.join("x"), focus, ...m, overflowPx: m.docHeight - vp[1] }));
    await page.close();
  }
}
await browser.close();
