import { chromium } from "/home/codi/Entwicklung/nquiry/node_modules/playwright/index.mjs";
const OUT = process.argv[2];
const B = "http://127.0.0.1:41803/career/demo";
const POOL = "JPOOL_30F7145E21F34BEF0FCE510DFC75837B", ORG = "org_nordlicht", ROLE = "role_fullstack";
const results = []; const ok = (name, cond, extra = "") => results.push(`${cond ? "PASS" : "FAIL"} ${name}${extra ? " — " + extra : ""}`);
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
await ctx.addInitScript(() => { try { localStorage.setItem("condyn_onboarding_seen", "1"); } catch {} });
const page = await ctx.newPage();
const errors = []; page.on("pageerror", e => errors.push(String(e)));
const root = () => page.getByTestId("semantic-career-intelligence-field");
const focus = () => root().getAttribute("data-field-focus");
const gate = () => root().getAttribute("data-capability-gate");
const brand = async () => (await page.getByTestId("shell-brand-dll").count()) ? "DLL" : "CONDYN";
const centreClick = async (loc) => { const b = await loc.boundingBox(); await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2); };

// 1. Opening: the Job Pool picture first, Capability gated.
await page.goto(B, { waitUntil: "networkidle" }); await page.waitForTimeout(1000);
ok("1a opens in the Job Field", await focus() === "FIELD" && await page.getByTestId("syntx-field").isVisible());
ok("1b gate AWAITING_JOB", await gate() === "AWAITING_JOB");
ok("1c header = Job Field brand (DLL)", await brand() === "DLL");
const cap = page.getByTestId("field-focus-capability-btn");
ok("1d Capability option disabled + hint", await cap.isDisabled() && (await cap.getAttribute("data-field-gate")) === "AWAITING_JOB" && ((await cap.getAttribute("title")) ?? "").startsWith("Select a job"));
ok("1e exit to Capability disabled", await page.getByTestId("syntx-exit-btn").isDisabled());
ok("1f Capability manifestation hidden (not interactive)", await page.evaluate(() => getComputedStyle(document.querySelector('[data-testid="focus-transition-stage-shell-02"]')).visibility) === "hidden");
await page.screenshot({ path: `${OUT}/01-opening-job-pool-first-1600.png` });
await cap.click({ force: true }); await page.waitForTimeout(500);
ok("1g forced click on Capability changes nothing", await focus() === "FIELD" && !new URL(page.url()).searchParams.get("focus"));
await page.getByTestId("job-pool-panel-toggle").focus(); await page.keyboard.press("ArrowLeft"); await page.waitForTimeout(400);
ok("1h ArrowLeft / Home on the selector changes nothing", await focus() === "FIELD");
await page.keyboard.press("Home"); await page.waitForTimeout(300);
ok("1h' Home changes nothing", await focus() === "FIELD");
await page.getByTestId("syntx-field").focus(); await page.keyboard.press("Escape"); await page.waitForTimeout(300);
ok("1i Escape at FIELD stays in the Job Field", await focus() === "FIELD");

// 2. Requested Capability without a valid job stays the Job Field.
await page.goto(`${B}?focus=CAPABILITY`, { waitUntil: "networkidle" }); await page.waitForTimeout(800);
ok("2a focus=CAPABILITY without a job → Job Field", await focus() === "FIELD" && await gate() === "AWAITING_JOB");
await page.goto(`${B}?focus=CAPABILITY&jobScopePoolUploadId=${POOL}&jobScopeRoleId=role_does_not_exist`, { waitUntil: "networkidle" });
await page.locator('[data-testid="job-scope-indicator"][data-job-scope-state="INVALID"]').waitFor({ timeout: 15000 });
ok("2b focus=CAPABILITY with an invalid job → Job Field, gated", await focus() === "FIELD" && await gate() === "AWAITING_JOB" && await cap.isDisabled());

// 3. Pool loaded + a valid role selected → gate opens; the job is kept across both fields.
await page.goto(B, { waitUntil: "networkidle" }); await page.waitForTimeout(800);
// A click before hydration completes is lost in headless Chromium (as in PINK's walk): repeat until the field answers.
for (let attempt = 0; attempt < 10; attempt += 1) {
  await page.getByTestId(`job-pool-select-${POOL}`).click();
  try { await page.locator('[data-testid="syntx-field"]:not([data-field-state="NO_POOL"])').waitFor({ timeout: 3000 }); break; } catch { if (attempt === 9) throw new Error("pool selection never answered"); }
}
ok("3a pool loaded, no job yet: still gated", await gate() === "AWAITING_JOB" && await cap.isDisabled());
await page.waitForTimeout(1200);
await centreClick(page.getByTestId(`syntx-organization-${ORG}`));
await page.locator('[data-testid="syntx-field"][data-observation-kind="ORGANIZATION"]').waitFor({ timeout: 15000 });
await page.waitForTimeout(1200);
await centreClick(page.getByTestId(`syntx-role-${ROLE}`));
await page.locator(`[data-testid="syntx-field"][data-observation-kind="ROLE"][data-observation-id="${ROLE}"]`).waitFor({ timeout: 15000 });
ok("3b role observed (navigation) is not a selection: still gated", await gate() === "AWAITING_JOB");
await page.getByTestId("syntx-job-scope-select").click();
await page.locator('[data-testid="semantic-career-intelligence-field"][data-capability-gate="OPEN"]').waitFor({ timeout: 15000 });
ok("3c job selected → gate OPEN, Capability option enabled, still in the Job Field", !(await cap.isDisabled()) && await focus() === "FIELD");
await page.waitForTimeout(700); await page.screenshot({ path: `${OUT}/02-job-selected-gate-open-1600.png` });
await cap.click();
await page.locator('[data-testid="semantic-career-intelligence-field"][data-field-focus="CAPABILITY"]').waitFor({ timeout: 15000 });
const b3d = await brand(); const s3d = await page.getByTestId("job-scope-indicator").getAttribute("data-job-scope-state");
await page.waitForTimeout(600); const b3dLater = await brand();
ok("3d Capability entered; header = CONDYN; job kept", b3dLater === "CONDYN" && s3d === "VALID", `brand immediately ${b3d}, after 600 ms ${b3dLater}, scope ${s3d}`);
ok("3e URL: focus=CAPABILITY + job scope", new URL(page.url()).searchParams.get("focus") === "CAPABILITY" && new URL(page.url()).searchParams.get("jobScopeRoleId") === ROLE, new URL(page.url()).search);
await page.waitForTimeout(700); await page.screenshot({ path: `${OUT}/03-capability-entered-1600.png` });
await page.getByTestId("job-pool-panel-toggle").click();
await page.locator('[data-testid="semantic-career-intelligence-field"][data-field-focus="FIELD"]').waitFor({ timeout: 15000 });
ok("3f back to the Job Field: job kept, gate OPEN, header DLL", (await page.getByTestId("job-scope-indicator").getAttribute("data-job-scope-state")) === "VALID" && await gate() === "OPEN" && await brand() === "DLL");
await page.getByTestId("syntx-exit-btn").click();
await page.locator('[data-testid="semantic-career-intelligence-field"][data-field-focus="CAPABILITY"]').waitFor({ timeout: 15000 });
ok("3g exit button reaches Capability with a job", true);

// 4. Reload in Capability with the job: the field returns to Capability after the job is checked.
await page.reload({ waitUntil: "networkidle" });
await page.locator('[data-testid="semantic-career-intelligence-field"][data-field-focus="CAPABILITY"]').waitFor({ timeout: 20000 });
ok("4 reload: Capability restored with the valid job", await gate() === "OPEN" && await brand() === "CONDYN");
ok("pageerrors", errors.length === 0, errors.join(" / "));
await ctx.close();

// 5. Opening at 1280×720 and reduced motion.
const c2 = await browser.newContext({ viewport: { width: 1280, height: 720 }, reducedMotion: "reduce" });
await c2.addInitScript(() => { try { localStorage.setItem("condyn_onboarding_seen", "1"); } catch {} });
const p2 = await c2.newPage(); await p2.goto(B, { waitUntil: "networkidle" }); await p2.waitForTimeout(800);
ok("5 1280×720 opening: Job Field, gated", (await p2.getByTestId("semantic-career-intelligence-field").getAttribute("data-field-focus")) === "FIELD" && await p2.getByTestId("field-focus-capability-btn").isDisabled());
await p2.screenshot({ path: `${OUT}/04-opening-1280.png` });
await browser.close();
console.log(results.join("\n"));
