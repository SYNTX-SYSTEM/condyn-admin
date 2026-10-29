import { readFileSync } from "node:fs"; import { pathToFileURL } from "node:url";
const [STATE, ANALYSIS] = process.argv.slice(2);
const pw = await import(pathToFileURL(process.env.CONDYN_PLAYWRIGHT_MODULE).href); const { chromium } = pw.chromium ? pw : pw.default;
const S = JSON.parse(readFileSync(STATE, "utf8"));
const browser = await chromium.launch();
for (const [w, h] of [[960, 540], [640, 360]]) for (const [name, q, sel] of [["entry", `investigationMode=PERSON&analysisId=${ANALYSIS}`, '[data-testid="rd-entry"]'], ["panel", `investigationMode=PERSON&analysisId=${ANALYSIS}&discoveryPoolUploadId=${S.validationUploadId}`, '[data-testid="role-discovery-panel"]'], ["b2-pxj", `investigationMode=PERSON_X_JOB&jobPoolUploadId=${S.validationUploadId}&jobScopePoolUploadId=${S.validationUploadId}&jobScopeRoleId=role_pink_alpha_architect`, '[data-testid="pxj-first-screen"]']]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
  await ctx.addInitScript(() => { try { localStorage.setItem("condyn_onboarding_seen", "1"); } catch {} });
  const page = await ctx.newPage();
  await page.goto(`${S.base}/career/demo?focus=CAPABILITY&${q}`, { waitUntil: "networkidle" });
  await page.waitForSelector(sel, { timeout: 60000 }).catch(() => null); await page.waitForTimeout(1500);
  const m = await page.evaluate(sel => { const a = document.querySelector(sel)?.getBoundingClientRect(); const s = document.querySelector('[data-testid="focus-transition-stage-shell-01"]')?.getBoundingClientRect(); const b = document.querySelector('[data-testid="orbital-bubble-body-01"], [data-testid="focused-stage-bubble-01"]')?.getBoundingClientRect(); const stage = document.querySelector('svg[data-testid="resonance-energy-paths"]')?.parentElement?.getBoundingClientRect(); return a && s ? { boxBottom: Math.round(a.bottom), shell01Top: Math.round(s.top), bubble01Top: b ? Math.round(b.top) : null, stageTop: stage ? Math.round(stage.top) : null } : { absent: true }; }, sel);
  console.log(`${w}x${h} ${name}`, JSON.stringify(m));
  await ctx.close();
}
await browser.close();
