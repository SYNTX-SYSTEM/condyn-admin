// Owner decision 2026-10-14 (G-10 variant A, G-05 removal, every analysis path): browser walk against GRÜN's isolated lab (:41803,
// disposable DB, mock worker, no Gemini). Every POST /api/career/analyze is intercepted and aborted: nothing is executed.
// argv: <out dir> <lab state.json>
import { readFileSync } from "node:fs";
import { chromium } from "/home/codi/Entwicklung/nquiry/node_modules/playwright/index.mjs";
const [OUT, STATE] = process.argv.slice(2);
const state = JSON.parse(readFileSync(STATE, "utf8"));
const BASE = "http://127.0.0.1:41803";
const PADDED = " role pink padded ", ORIGINAL_ROLE = "role_pink_alpha_architect", ORG = "org_pink_alpha";
const results = []; const ok = (name, cond, extra = "") => results.push(`${cond ? "PASS" : "FAIL"} ${name}${extra ? " — " + extra : ""}`);

// Setup: the validation pool as a new pool whose first role id is padded (the pool schema admits it; the id is used verbatim).
const swap = value => Array.isArray(value) ? value.map(swap) : value !== null && typeof value === "object" ? Object.fromEntries(Object.entries(value).map(([k, v]) => [k, swap(v)])) : value === ORIGINAL_ROLE ? PADDED : value === "pool_pink_validation_v1" ? "pool_gruen_padded_role_v1" : value;
const pool = swap(state.pool);
pool.pool.name = "GRÜN padded role pool";
const uploaded = await (await fetch(`${BASE}/api/career/job-pools`, { method: "POST", headers: { "content-type": "application/json", "x-condyn-principal-actor-id": "GRUEN_LAB" }, body: JSON.stringify(pool) })).json();
const UP = uploaded.jobPoolUploadId ?? uploaded.upload?.jobPoolUploadId;
ok("0 padded pool uploaded through the real upload route", typeof UP === "string" && UP.startsWith("JPOOL_"), UP);
const DEMO = `${BASE}/career/demo?analysisId=${state.analysisId}`;
const roleLink = `${DEMO}&focus=FIELD&jobPoolUploadId=${UP}&jobOrganizationId=${ORG}&jobRoleId=${encodeURIComponent(PADDED)}`;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
await ctx.addInitScript(() => { try { localStorage.setItem("condyn_onboarding_seen", "1"); } catch {} });
const page = await ctx.newPage();
const errors = []; page.on("pageerror", e => errors.push(String(e)));
const analyzeBodies = [];
await page.route("**/api/career/analyze", route => { analyzeBodies.push(route.request().postData()); return route.abort(); });
const root = () => page.getByTestId("semantic-career-intelligence-field");
const attr = (testId, name) => page.getByTestId(testId).getAttribute(name);
const gate = () => root().getAttribute("data-capability-gate");
const focus = () => root().getAttribute("data-field-focus");
const scopeState = () => attr("job-scope-indicator", "data-job-scope-state");
const params = () => new URL(page.url()).searchParams;
const cap = page.getByTestId("field-focus-capability-btn");
const roleObserved = () => page.locator(`[data-testid="syntx-field"][data-observation-kind="ROLE"][data-observation-id="${PADDED}"]`).waitFor({ timeout: 20000 });
// textContent, not innerText: in the Job Field the Capability layer (and its dock) is rendered but visibility-hidden.
const stagedCount = async () => Number(((await page.getByTestId("source-dock").textContent()).match(/\((\d+)\)/) ?? [])[1] ?? -1);

// G-10 · a padded role id is selected, kept and restored exactly.
await page.goto(roleLink, { waitUntil: "networkidle" });
await roleObserved();
ok("G10-1 padded role observed, no job yet: gated", await gate() === "AWAITING_JOB" && await scopeState() === "NONE");
for (let attempt = 0; attempt < 10; attempt += 1) {
  await page.getByTestId("syntx-job-scope-select").click();
  try { await page.locator('[data-testid="semantic-career-intelligence-field"][data-capability-gate="OPEN"]').waitFor({ timeout: 3000 }); break; } catch { if (attempt === 9) throw new Error("selection never answered"); }
}
ok("G10-2 SELECT AS JOB on the padded role → VALID, gate OPEN", await scopeState() === "VALID" && !(await cap.isDisabled()));
ok("G10-3 URL carries the role id verbatim (untrimmed)", params().get("jobScopeRoleId") === PADDED && params().get("jobScopePoolUploadId") === UP, JSON.stringify(params().get("jobScopeRoleId")));
ok("G10-4 indicator names the role", (await page.getByTestId("job-scope-indicator").innerText()).includes("Distributed Systems Architect"));
await page.waitForTimeout(700); await page.screenshot({ path: `${OUT}/01-padded-role-selected-1600.png` });
await page.reload({ waitUntil: "networkidle" });
await page.locator('[data-testid="job-scope-indicator"][data-job-scope-state="VALID"]').waitFor({ timeout: 20000 });
ok("G10-5 reload restores the padded scope exactly", params().get("jobScopeRoleId") === PADDED);

// Capability with the padded job: one source staged; ANALYZE sends the id verbatim (intercepted, aborted).
await cap.click();
await page.locator('[data-testid="semantic-career-intelligence-field"][data-field-focus="CAPABILITY"]').waitFor({ timeout: 15000 });
await page.getByTestId("add-text-source-btn").click();
await page.getByTestId("source-text-input").fill("Synthetic lab source: distributed edge platforms, Kubernetes, TypeScript.");
await page.getByTestId("submit-source-btn").click();
await page.waitForTimeout(400);
ok("G10-6 one source staged, ANALYZE admitted", await stagedCount() === 1 && (await attr("start-intake-analysis-btn", "data-job-scope-blocked")) === "false");
await page.getByTestId("start-intake-analysis-btn").click();
await page.waitForTimeout(800);
const sent = analyzeBodies.length === 1 ? JSON.parse(analyzeBodies[0]).jobScope : null;
ok("G10-7 the request carries exactly { jobPoolUploadId, poolRoleId: ' role pink padded ' }", sent !== null && JSON.stringify(sent) === JSON.stringify({ jobPoolUploadId: UP, poolRoleId: PADDED }), JSON.stringify(sent));
ok("G10-8 staged source still there after the (aborted) request", await stagedCount() === 1);

// G-05 · removal by an explicit action at the selected role.
await page.getByTestId("job-scope-indicator").click();
await roleObserved();
ok("G05-1 indicator opens the selected role in the Job Field; REMOVE JOB offered", await focus() === "FIELD" && await page.getByTestId("syntx-job-scope-clear").isVisible());
const matchesBefore = await attr("syntx-state", "data-state");
await page.waitForTimeout(700); await page.screenshot({ path: `${OUT}/02-remove-offered-1600.png` });
const requestsBefore = analyzeBodies.length;
await page.getByTestId("syntx-job-scope-clear").click();
await page.locator('[data-testid="job-scope-indicator"][data-job-scope-state="NONE"]').waitFor({ timeout: 10000 });
ok("G05-2 no job scope selected afterwards", await scopeState() === "NONE" && !params().has("jobScopeRoleId") && !params().has("jobScopePoolUploadId"), new URL(page.url()).search);
ok("G05-3 Capability gate closed; the Job Field stays the field", await gate() === "AWAITING_JOB" && await cap.isDisabled() && await focus() === "FIELD" && params().get("focus") === "FIELD");
ok("G05-4 ANALYZE blocked with the owner's sentence", (await attr("start-intake-analysis-btn", "data-job-scope-blocked")) === "true" && await page.getByTestId("start-intake-analysis-btn").isDisabled() && (await page.getByTestId("analyze-job-scope-required").textContent()) === "Bitte wählen Sie einen Job aus.");
const keptAfterRemoval = await stagedCount();
ok("G05-5 staged source kept", keptAfterRemoval === 1, String(keptAfterRemoval));
ok("G05-6 existing analysis kept (analysisId in the URL, matching state unchanged)", params().get("analysisId") === state.analysisId && await attr("syntx-state", "data-state") === matchesBefore, `${matchesBefore}`);
ok("G05-7 SELECT AS JOB offered again; REMOVE gone", (await attr("syntx-job-scope-select", "data-job-scope-selected")) === "false" && await page.getByTestId("syntx-job-scope-clear").count() === 0);
ok("G05-8 removal sent no request", analyzeBodies.length === requestsBefore);
await page.waitForTimeout(700); await page.screenshot({ path: `${OUT}/03-job-removed-1600.png` });
// Re-selecting the role re-opens the gate; back in Capability the source staged before the removal is there and ANALYZE is admitted.
await page.getByTestId("syntx-job-scope-select").click();
await page.locator('[data-testid="semantic-career-intelligence-field"][data-capability-gate="OPEN"]').waitFor({ timeout: 15000 });
await cap.click();
await page.locator('[data-testid="semantic-career-intelligence-field"][data-field-focus="CAPABILITY"]').waitFor({ timeout: 15000 });
ok("G05-9a re-selected → Capability: same source staged, ANALYZE admitted", await stagedCount() === 1 && (await attr("start-intake-analysis-btn", "data-job-scope-blocked")) === "false");
await page.getByTestId("job-scope-indicator").click();
await roleObserved();
await page.getByTestId("syntx-job-scope-clear").click();
await page.locator('[data-testid="job-scope-indicator"][data-job-scope-state="NONE"]').waitFor({ timeout: 10000 });
await page.reload({ waitUntil: "networkidle" }); await page.waitForTimeout(1500);
ok("G05-9 reload after removal: still no job, still gated", await scopeState() === "NONE" && await gate() === "AWAITING_JOB");

// Legacy page /career/analyze · the same rule.
await page.goto(`${BASE}/career/analyze`, { waitUntil: "networkidle" }); await page.waitForTimeout(800);
await page.getByTestId("doc-content-textarea").fill("Synthetic lab text.");
ok("L-1 no job: state NONE, owner sentence, start disabled even with input", (await attr("analyze-job-scope", "data-job-scope-state")) === "NONE" && (await page.getByTestId("analyze-job-scope-required").textContent()) === "Bitte wählen Sie einen Job aus." && await page.getByTestId("start-analysis-button").isDisabled());
await page.screenshot({ path: `${OUT}/04-legacy-page-blocked-1600.png` });
await page.goto(`${BASE}/career/analyze?jobScopePoolUploadId=${UP}&jobScopeRoleId=role_does_not_exist`, { waitUntil: "networkidle" });
await page.locator('[data-testid="analyze-job-scope"][data-job-scope-state="INVALID"]').waitFor({ timeout: 15000 });
await page.getByTestId("doc-content-textarea").fill("Synthetic lab text.");
ok("L-2 unknown role: INVALID, start disabled", await page.getByTestId("start-analysis-button").isDisabled());
await page.goto(`${BASE}/career/analyze?jobScopePoolUploadId=${UP}&jobScopeRoleId=${encodeURIComponent(PADDED)}`, { waitUntil: "networkidle" });
await page.locator('[data-testid="analyze-job-scope"][data-job-scope-state="VALID"]').waitFor({ timeout: 15000 });
await page.getByTestId("doc-content-textarea").fill("Synthetic lab text.");
ok("L-3 padded role: VALID, named, start enabled", !(await page.getByTestId("start-analysis-button").isDisabled()) && (await page.getByTestId("analyze-job-scope").innerText()).includes("Distributed Systems Architect"));
await page.screenshot({ path: `${OUT}/05-legacy-page-valid-1600.png` });
const beforeLegacy = analyzeBodies.length;
await page.getByTestId("start-analysis-button").click(); await page.waitForTimeout(800);
const legacy = analyzeBodies.length === beforeLegacy + 1 ? JSON.parse(analyzeBodies.at(-1)) : null;
ok("L-4 the request carries the exact job scope", legacy !== null && JSON.stringify(legacy.jobScope) === JSON.stringify({ jobPoolUploadId: UP, poolRoleId: PADDED }), JSON.stringify(legacy?.jobScope));

ok("analyze requests seen (all intercepted, none executed)", analyzeBodies.length === 2, String(analyzeBodies.length));
ok("pageerrors", errors.length === 0, errors.join(" / "));
await browser.close();
console.log(results.join("\n"));
console.log(`${results.filter(r => r.startsWith("PASS")).length}/${results.length} PASS`);
