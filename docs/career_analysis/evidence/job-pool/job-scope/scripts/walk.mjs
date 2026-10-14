import { chromium } from "/home/codi/Entwicklung/nquiry/node_modules/playwright/index.mjs";
const OUT = process.argv[2];
const B = "http://127.0.0.1:41803/career/demo";
const POOL = "JPOOL_30F7145E21F34BEF0FCE510DFC75837B", ROLE = "role_fullstack";
const results = []; const ok = (name, cond, extra = "") => { results.push(`${cond ? "PASS" : "FAIL"} ${name}${extra ? " — " + extra : ""}`); };
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
await ctx.addInitScript(() => { try { localStorage.setItem("condyn_onboarding_seen", "1"); } catch {} });
const page = await ctx.newPage();
const errors = []; page.on("pageerror", e => errors.push(String(e)));
const chip = () => page.getByTestId("job-scope-indicator");
const state = async () => chip().getAttribute("data-job-scope-state");
const centreClick = async (loc) => { const b = await loc.boundingBox(); await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2); };
const stageText = async (text) => { await page.getByTestId("add-text-source-btn").click(); await page.getByTestId("source-text-input").fill(text); await page.getByTestId("submit-source-btn").click(); };

// 1. No job: chip NONE in Capability; ANALYZE blocked with the exact sentence; no POST.
let posts = 0; page.on("request", r => { if (r.method() === "POST" && r.url().endsWith("/api/career/analyze")) posts += 1; });
await page.goto(B, { waitUntil: "networkidle" }); await page.waitForTimeout(800);
ok("1a chip NONE in Capability", await state() === "NONE", await chip().innerText());
await stageText("Built the billing service in TypeScript with strict typing. PostgreSQL schema design.");
const btn = page.getByTestId("start-intake-analysis-btn");
ok("1b ANALYZE disabled without job", await btn.isDisabled());
ok("1c exact sentence at ANALYZE", (await page.getByTestId("analyze-job-scope-required").innerText()) === "Bitte wählen Sie einen Job aus.");
await btn.click({ force: true }); await page.waitForTimeout(600);
ok("1d forced click sends no POST", posts === 0, `posts=${posts}`);
await page.screenshot({ path: `${OUT}/01-capability-no-job-1600.png` });

// 2. Chip opens the Job Field; select pool, open the role, SELECT AS JOB.
await chip().click();
await page.getByTestId("syntx-field").waitFor();
ok("2a chip NONE in Job Field", await state() === "NONE");
if (await page.locator(`[data-testid="job-pool-select-${POOL}"]`).count()) await page.getByTestId(`job-pool-select-${POOL}`).click();
await page.locator('[data-testid="syntx-field"][data-field-state]:not([data-field-state="NO_POOL"])').waitFor({ timeout: 20000 });
await page.waitForTimeout(1500);
await centreClick(page.getByTestId("syntx-organization-org_nordlicht"));
await page.locator('[data-testid="syntx-field"][data-observation-kind="ORGANIZATION"]').waitFor({ timeout: 15000 });
ok("2a' no select action at ORGANIZATION", (await page.getByTestId("syntx-job-scope-select").count()) === 0);
await page.waitForTimeout(1200);
await centreClick(page.getByTestId(`syntx-role-${ROLE}`));
await page.locator(`[data-testid="syntx-field"][data-observation-kind="ROLE"][data-observation-id="${ROLE}"]`).waitFor({ timeout: 15000 });
ok("2b select action at ROLE", await page.getByTestId("syntx-job-scope-select").innerText() === "◎ SELECT AS JOB");
await page.screenshot({ path: `${OUT}/02-role-before-select-1600.png` });
await page.getByTestId("syntx-job-scope-select").click();
await page.locator('[data-testid="job-scope-indicator"][data-job-scope-state="VALID"]').waitFor({ timeout: 15000 });
ok("2c chip VALID names role", (await chip().innerText()).includes("Senior Full-Stack Engineer"), (await chip().innerText()).replace(/\n/g, " | "));
ok("2d select action marked", (await page.getByTestId("syntx-job-scope-select").getAttribute("data-job-scope-selected")) === "true");
const u1 = new URL(page.url());
ok("2e URL carries scope", u1.searchParams.get("jobScopePoolUploadId") === POOL && u1.searchParams.get("jobScopeRoleId") === ROLE, u1.search);
await page.waitForTimeout(900); await page.screenshot({ path: `${OUT}/03-role-selected-1600.png` });

// 3. Depths and field change keep it.
const req = page.locator('[data-testid^="syntx-requirement-"]').first();
await centreClick(req);
await page.locator('[data-testid="syntx-field"][data-observation-kind="REQUIREMENT"]').waitFor({ timeout: 15000 });
ok("3a REQUIREMENT: chip VALID + visible", await state() === "VALID" && await chip().isVisible());
await page.waitForTimeout(900); await page.screenshot({ path: `${OUT}/04-requirement-1600.png` });
await page.keyboard.press("Escape"); await page.keyboard.press("Escape"); await page.keyboard.press("Escape");
await page.locator('[data-testid="syntx-field"][data-observation-kind="FIELD"]').waitFor({ timeout: 15000 });
ok("3b back at FIELD: chip VALID", await state() === "VALID");
await page.getByTestId("field-focus-capability-btn").click();
await page.locator('[data-testid="semantic-career-intelligence-field"][data-field-focus="CAPABILITY"]').waitFor();
ok("3c Capability: chip VALID", await state() === "VALID");
const u2 = new URL(page.url());
ok("3d field change keeps scope in URL, clears observation", u2.searchParams.get("jobScopeRoleId") === ROLE && !u2.searchParams.get("jobRoleId"), u2.search);
ok("3e ANALYZE admitted", !(await page.getByTestId("start-intake-analysis-btn").isDisabled()) && (await page.getByTestId("analyze-job-scope-required").count()) === 0);
await page.screenshot({ path: `${OUT}/05-capability-job-selected-1600.png` });
// Capability L1/L2 depth via the HUD (orbit 02 focus)
await centreClick(page.getByTestId("focus-transition-stage-shell-02"));
await page.waitForTimeout(1200);
ok("3f Capability orbit focus: chip visible on top", await chip().isVisible() && await page.evaluate(() => { const c = document.querySelector('[data-testid="job-scope-indicator"]').getBoundingClientRect(); const e = document.elementFromPoint(c.left + c.width / 2, c.top + c.height / 2); return !!e && !!e.closest('[data-testid="job-scope-indicator"]'); }));
await page.screenshot({ path: `${OUT}/06-capability-orbit-focus-1600.png` });
await page.keyboard.press("Escape");

// 4. Reload restores the scope; chip reopens the role in the Job Field.
await page.reload({ waitUntil: "networkidle" });
await page.locator('[data-testid="job-scope-indicator"][data-job-scope-state="VALID"]').waitFor({ timeout: 15000 });
ok("4a reload restores VALID scope", true);
await chip().click();
await page.locator(`[data-testid="syntx-field"][data-observation-kind="ROLE"][data-observation-id="${ROLE}"]`).waitFor({ timeout: 15000 });
ok("4b chip opens the job's role", true);
await page.getByTestId("syntx-exit-btn").click();

// 5. ANALYZE with scope: body carries exactly jobScope; mock worker succeeds; Job Field reads the JOB_RESULT.
await stageText("Built the billing service in TypeScript with strict typing.");
const reqP = page.waitForRequest(r => r.method() === "POST" && r.url().endsWith("/api/career/analyze"));
await page.getByTestId("start-intake-analysis-btn").click();
const body = JSON.parse((await reqP).postData());
ok("5a POST body jobScope exact", JSON.stringify(body.jobScope) === JSON.stringify({ jobPoolUploadId: POOL, poolRoleId: ROLE }), JSON.stringify(body.jobScope));
ok("5b POST keys", JSON.stringify(Object.keys(body).sort()) === JSON.stringify(["documents", "jobScope"]), Object.keys(body).join(","));
await page.getByTestId("intake-success-banner").waitFor({ timeout: 120000 });
ok("5c analysis succeeded (mock worker)", true);
await page.getByTestId("job-pool-panel-toggle").click();
await page.locator('[data-testid="syntx-field"][data-analysis-source="JOB_RESULT"]').waitFor({ timeout: 20000 });
ok("5d Job Field reads JOB_RESULT", true);
await page.getByTestId("field-focus-capability-btn").click();

// 6. Backend rejections (simulated responses, GELB contract) and a worker FAILED.
for (const [status, code] of [[400, "ERR_JOB_SCOPE_REQUIRED"], [422, "ERR_JOB_SCOPE_INVALID"]]) {
  await page.route("**/api/career/analyze", route => route.fulfill({ status, contentType: "application/json", body: JSON.stringify({ success: false, status: "FAILED", issues: [{ code, message: "Bitte wählen Sie einen Job aus." }] }) }));
  await stageText(`probe ${status}`);
  await page.getByTestId("start-intake-analysis-btn").click();
  const banner = page.getByTestId("intake-error-banner"); await banner.waitFor({ timeout: 10000 });
  const text = await banner.innerText();
  ok(`6 ${status} banner: title/code/sentence/HTTP`, text.includes("NO VALID JOB SCOPE") && text.includes(`[${code}]`) && text.includes("Bitte wählen Sie einen Job aus.") && text.includes(`HTTP ${status}`) && !text.includes("SEMANTIC BOUNDARY"), text.replace(/\n/g, " | "));
  await page.screenshot({ path: `${OUT}/07-banner-${status}-1600.png` });
  await page.unroute("**/api/career/analyze");
}
await page.route("**/api/career/analyze", route => route.fulfill({ status: 202, contentType: "application/json", body: JSON.stringify({ jobId: "JOB_SIMULATED", status: "PENDING", statusUrl: "/api/career/jobs/JOB_SIMULATED" }) }));
await page.route("**/api/career/jobs/JOB_SIMULATED", route => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ status: "FAILED", errorCode: "ERR_JOB_SCOPE_INVALID", errorSummary: "Bitte wählen Sie einen Job aus." }) }));
await page.getByTestId("retry-intake-btn").click();
await page.locator('[data-testid="intake-error-banner"][data-http-status=""]').waitFor({ timeout: 10000 });
const wtext = await page.getByTestId("intake-error-banner").innerText();
ok("6c worker FAILED: code, sentence, no HTTP", wtext.includes("[ERR_JOB_SCOPE_INVALID]") && !wtext.includes("HTTP "), wtext.replace(/\n/g, " | "));
await page.unroute("**/api/career/analyze"); await page.unroute("**/api/career/jobs/JOB_SIMULATED");

// 7. Invalid scope from the URL: chip INVALID, ANALYZE blocked.
await page.goto(`${B}?jobScopePoolUploadId=${POOL}&jobScopeRoleId=role_does_not_exist`, { waitUntil: "networkidle" });
await page.locator('[data-testid="job-scope-indicator"][data-job-scope-state="INVALID"]').waitFor({ timeout: 15000 });
await stageText("probe invalid");
ok("7 invalid scope blocks ANALYZE", await page.getByTestId("start-intake-analysis-btn").isDisabled() && (await page.getByTestId("analyze-job-scope-required").innerText()) === "Bitte wählen Sie einen Job aus.");
await page.screenshot({ path: `${OUT}/08-invalid-scope-1600.png` });
ok("pageerrors", errors.length === 0, errors.join(" / "));
await ctx.close();

// 8. Geometry at 1600×1000 and 1280×720 (Capability L0, Job Field FIELD/ROLE): chip clear of selector, header and orientation surface.
for (const [w, h] of [[1600, 1000], [1280, 720]]) {
  const c2 = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: "reduce" });
  await c2.addInitScript(() => { try { localStorage.setItem("condyn_onboarding_seen", "1"); } catch {} });
  const p = await c2.newPage();
  for (const [name, q] of [["cap", ""], ["field", `focus=FIELD&jobPoolUploadId=${POOL}&analysisId=ANL_JOB_POOL_E2E_0001`], ["role", `focus=FIELD&jobPoolUploadId=${POOL}&analysisId=ANL_JOB_POOL_E2E_0001&jobOrganizationId=org_nordlicht&jobRoleId=${ROLE}`]]) {
    await p.goto(`${B}?${q}${q ? "&" : ""}jobScopePoolUploadId=${POOL}&jobScopeRoleId=${ROLE}`, { waitUntil: "networkidle" });
    await p.locator('[data-testid="job-scope-indicator"][data-job-scope-state="VALID"]').waitFor({ timeout: 15000 });
    await p.waitForTimeout(800);
    const r = await p.evaluate(() => { const g = s => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top), Math.round(b.right), Math.round(b.bottom)]; }; return { chip: g('[data-testid="job-scope-indicator"]'), strip: g('[data-testid="field-focus-strip"]'), orient: g('[data-sx-surface="header"]'), header: g('[data-testid="career-intelligence-dashboard"] > div:first-child'), anim: document.querySelector('[data-testid="job-scope-indicator"]').getAnimations().length }; });
    const overlap = (a, b) => a && b && a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];
    ok(`8 ${name}@${w}: no overlap (strip/orient/header)`, !overlap(r.chip, r.strip) && !overlap(r.chip, r.orient) && !overlap(r.chip, r.header) && r.anim === 0, JSON.stringify(r));
    await p.screenshot({ path: `${OUT}/09-${name}-${w}.png` });
  }
  await c2.close();
}
await browser.close();
console.log(results.join("\n"));
