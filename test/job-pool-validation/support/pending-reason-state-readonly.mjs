const { chromium } = await import(process.env.CONDYN_PLAYWRIGHT_MODULE ?? "/home/codi/Entwicklung/nquiry/node_modules/playwright/index.mjs");
const [BASE, ANALYSIS, UPLOAD, ROLE] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1600, height: 1000 } });
await p.goto(`${BASE}/career/demo?focus=JOB&analysisId=${ANALYSIS}&jobPoolUploadId=${UPLOAD}`, { waitUntil: "domcontentloaded" });
await p.getByTestId("guided-onboarding-overlay").waitFor({ timeout: 60000 }); await p.getByTestId("onboarding-close-btn").click();
await p.locator('[data-testid="job-field"][data-field-state="AVAILABLE"]').waitFor({ timeout: 90000 });
await p.getByTestId(`job-field-role-${ROLE}`).click();
await p.locator(`[data-testid="job-field-lens"][data-role-id="${ROLE}"]`).waitFor({ timeout: 30000 });
await p.getByTestId("job-field-pending-why").focus(); await p.keyboard.press("Enter");
await p.locator('[data-testid="job-field-pending-reason"][data-jf-reveal="true"]').waitFor({ timeout: 10000 });
const samples = [];
for (let t = 0; t <= 2400; t += 200) { samples.push(await p.getByTestId("job-field-pending-reason").evaluate(el => { const a = el.getAnimations()[0]; return { o: getComputedStyle(el).opacity, play: a?.playState ?? "-", time: a?.currentTime ?? null, display: getComputedStyle(el).display, hidden: el.hidden }; })); await p.waitForTimeout(200); }
console.log("SAMPLES", JSON.stringify(samples));
await p.screenshot({ path: "delta-reason.png" });
console.log("REASON", JSON.stringify(await p.getByTestId("job-field-pending-reason").evaluate(el => { const c = getComputedStyle(el); return { inlineOpacity: el.style.opacity, computedOpacity: c.opacity, animationName: c.animationName, fillMode: c.animationFillMode }; })));
console.log("LENS", JSON.stringify(await p.getByTestId("job-field-lens").evaluate(el => { const c = getComputedStyle(el); return { computedOpacity: c.opacity, fillMode: c.animationFillMode, transform: c.transform }; })));
await b.close();
