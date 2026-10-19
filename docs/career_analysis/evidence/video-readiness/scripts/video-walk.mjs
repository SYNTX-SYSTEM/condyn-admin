// END-TO-END VIDEO WALK (owner "SFE — GELB | END-TO-END VIDEO READINESS", 2026-10-19). Run from the repository root against a FRESH
// video lab (video-lab.ts: empty disposable database, real server and worker, loopback Gemini stand-in, no live Gemini):
//
//   CONDYN_PLAYWRIGHT_MODULE=<playwright/index.js> node <this file> <lab state.json> <out dir> [width] [height]
//
// The walk is the video's storyboard as an executable check. Every step names what the viewer sees (V-xx) and asserts it on the
// rendered DOM. Moving bodies (capability nodes, organization bodies, orbiting role cards) are activated with a DOM click event
// (dispatchEvent), because a pointer click waits for a stable element; see the readiness document for what that means for a
// recording agent. Inputs: docs/examples/cv.synthetic.pdf and docs/examples/job-pool-tests/DLL_JOBPOOL_ENGINEERING.json.
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const playwright = await import(pathToFileURL(process.env.CONDYN_PLAYWRIGHT_MODULE).href);
const { chromium } = playwright.chromium ? playwright : playwright.default;
const [STATE, OUT, W = "1600", H = "1000"] = process.argv.slice(2);
const st = JSON.parse(readFileSync(STATE, "utf8"));
const BASE = st.base;
const PDF = resolve(process.cwd(), "docs/examples/cv.synthetic.pdf");
const POOL_FILE = resolve(process.cwd(), "docs/examples/job-pool-tests/DLL_JOBPOOL_ENGINEERING.json");
const POOL = "JPOOL_B94850C439974E27496FE3B1A9A076B5", ORG = "org_kestrel", ROLE = "role_kestrel_fullstack", JOB_ROLE = "role_kestrel_frontend_architect";
const PDF_TEXT_LINE = "Focus on TypeScript, React and Node.js, relational databases and automated testing.";

const results = [];
const ok = (id, name, cond, extra = "") => { results.push({ id, name, pass: Boolean(cond), extra: String(extra).slice(0, 400) }); console.log(`${cond ? "PASS" : "FAIL"} ${id} ${name}${extra ? " — " + String(extra).slice(0, 300) : ""}`); };
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: Number(W), height: Number(H) } });
const page = await ctx.newPage();
const errors = []; page.on("pageerror", e => errors.push(String(e)));
const analyzeBodies = []; page.on("request", r => { if (r.url().endsWith("/api/career/analyze") && r.method() === "POST") { const body = JSON.parse(r.postData() ?? "null"); analyzeBodies.push({ investigation: body?.investigation ?? null, jobScope: body?.jobScope ?? null, documents: (body?.documents ?? []).map(d => ({ type: d.type, title: d.title ?? null })) }); } });
const t = id => page.getByTestId(id);
const attr = (id, name) => t(id).getAttribute(name);
const rootAttr = name => t("semantic-career-intelligence-field").getAttribute(name);
const waitRoot = (name, value, timeout = 30000) => page.locator(`[data-testid="semantic-career-intelligence-field"][${name}="${value}"]`).waitFor({ timeout });
const params = () => new URL(page.url()).searchParams;
const text = async id => ((await t(id).textContent().catch(() => "")) ?? "").replace(/\s+/g, " ").trim();
let shotNo = 0;
const shot = async name => { shotNo += 1; await page.waitForTimeout(700); await page.screenshot({ path: `${OUT}/${String(shotNo).padStart(2, "0")}-${name}-${W}.png` }); };
const tap = async locator => { await locator.waitFor({ timeout: 30000 }); await locator.dispatchEvent("click"); };
const timings = {};
const step = async (id, fn) => { try { await fn(); } catch (error) { ok(id, "step threw", false, String(error).split("\n")[0]); await shot(`ERROR-${id}`); } };

// V-01 · the empty field, onboarding closed.
await step("V-01", async () => {
  await page.goto(`${BASE}/career/demo`, { waitUntil: "networkidle" });
  await t("guided-onboarding-overlay").waitFor({ timeout: 30000 });
  ok("V-01a", "first visit shows the onboarding; it closes with its close button (Escape does not close it)", await t("onboarding-close-btn").count() === 1);
  await t("onboarding-close-btn").click();
  await t("guided-onboarding-overlay").waitFor({ state: "detached", timeout: 10000 });
  const ground = [await rootAttr("data-investigation-mode"), await rootAttr("data-capability-gate"), await t("job-pool-list-empty").count(), await t("syntx-no-pool").count()];
  ok("V-01b", "ground state: PERSON × JOB, Capability gated (AWAITING_JOB), no pool", ground[0] === "PERSON_X_JOB" && ground[1] === "AWAITING_JOB" && ground[3] === 1, JSON.stringify(ground));
  await shot("empty-field");
});

// V-02 · PERSON: the explicit boundary without a job; the PDF in the dock; the analysis.
let personAnalysis = null;
await step("V-02", async () => {
  await t("investigation-mode-PERSON").click();
  await waitRoot("data-investigation-mode", "PERSON");
  ok("V-02a", "PERSON chosen: Capability open without a job, indicator NO JOB SCOPE · PERSON", await rootAttr("data-capability-gate") === "OPEN" && (await text("job-scope-indicator")).includes("PERSON"));
  await t("field-focus-capability-btn").click();
  await waitRoot("data-field-focus", "CAPABILITY");
  await t("source-dock-file-input").setInputFiles(PDF);
  await t("analyze-investigation").waitFor({ timeout: 20000 });
  ok("V-02b", "PDF staged; the dock names the boundary PERSON at the trigger", (await text("source-dock")).includes("cv.synthetic.pdf") && await attr("analyze-investigation", "data-investigation-mode") === "PERSON");
  await shot("person-pdf-staged");
  const t0 = Date.now();
  await t("start-intake-analysis-btn").click();
  await t("intake-success-banner").waitFor({ timeout: 300000 });
  timings.personAnalysisMs = Date.now() - t0;
  const body = analyzeBodies.at(-1);
  ok("V-02c", "one ANALYZE request: one PDF document, investigation { mode: PERSON }, no job scope", analyzeBodies.length === 1 && body.documents.length === 1 && body.documents[0].type === "pdf" && JSON.stringify(body.investigation) === '{"mode":"PERSON"}' && body.jobScope === null, JSON.stringify(body));
  ok("V-02d", "success banner: PERSON · WITHOUT A JOB SCOPE", await attr("intake-success-investigation", "data-investigation-mode") === "PERSON", await text("intake-success-banner"));
  await shot("person-analysis-done");
});

// V-03 · Capability Field and evidence: the proposals of this analysis, one opened down to its verbatim quote from the PDF.
await step("V-03", async () => {
  await t("focused-stage-bubble-02").click();
  await page.locator('[data-testid^="capability-cosmos-node-"]').first().waitFor({ timeout: 30000 });
  const names = await page.locator('[data-testid^="capability-cosmos-node-"]').allTextContents();
  ok("V-03a", "Capability Field (02) opens the proposal cosmos: every proposal PROPOSED with its evidence state", names.length >= 5 && names.every(n => /PROPOSED/.test(n)), `${names.length} proposals`);
  await shot("capability-cosmos");
  await tap(page.locator('[data-testid^="capability-cosmos-node-"]', { hasText: "TypeScript" }).first());
  await t("capability-focus-evidence-surface").waitFor({ timeout: 20000 });
  const surface = await text("capability-focus-evidence-surface");
  ok("V-03b", "TypeScript in deep focus: the evidence surface names the PDF and quotes it verbatim (SOURCE MATCHING ONLY)", surface.includes("cv.synthetic.pdf") && surface.includes(PDF_TEXT_LINE) && /SOURCE MATCHING ONLY/.test(surface), surface);
  await shot("capability-evidence");
  // Back out (Escape does not leave the Capability deep focus): the nucleus returns to the cosmos, the cosmos centre to the field.
  await page.locator('[data-testid^="capability-focus-nucleus-"]').first().click();
  await waitRoot("data-zoom-level", "1");
  await tap(t("capability-cosmos-center"));
  await waitRoot("data-zoom-level", "0");
  ok("V-03c", "nucleus → cosmos, cosmos centre → field (zoom 0): the dock usable again", await rootAttr("data-zoom-level") === "0");
});

// V-04 · GEMINI OUTPUT of the PERSON analysis (Job Field, beside BOUNDARY; lab inspector token).
await step("V-04", async () => {
  await t("job-pool-panel-toggle").click();
  await waitRoot("data-field-focus", "FIELD");
  await t("syntx-gemini-output-toggle").click();
  await t("syntx-gemini-output").waitFor({ timeout: 20000 });
  await t("syntx-gemini-token").fill(st.token);
  await t("syntx-gemini-read").click();
  await page.locator('[data-testid="syntx-gemini-output"][data-inspection-state="AVAILABLE"]').waitFor({ timeout: 30000 });
  personAnalysis = await attr("syntx-gemini-output", "data-analysis-id");
  const api = await (await fetch(`${BASE}/api/career/analyses/${personAnalysis}/gemini-result`, { headers: { "x-condyn-result-inspector-token": st.token } })).json();
  const shown = await t("syntx-gemini-original-text").textContent();
  ok("V-04a", "ORIGINAL RESPONSE retained and byte-identical to the archived exchange", await attr("syntx-gemini-original", "data-original-state") === "RETAINED" && shown === api.inspection.originalGeminiResponse.text, personAnalysis);
  await shot("person-gemini-output");
  await t("syntx-gemini-view-SCOPE").click();
  ok("V-04b", "SCOPE view: PERSON, UNSCOPED", await attr("syntx-gemini-scope", "data-scope-state") === "UNSCOPED");
  await t("syntx-gemini-view-PROCESSING").click();
  const processing = await text("syntx-gemini-processing");
  ok("V-04c", "PROCESSING view: parser, verification (the invented claim REJECTED) and convergence apart", processing.includes("REJECTED"), processing.slice(0, 200));
  await shot("person-gemini-processing");
  await t("syntx-gemini-output-toggle").click();
});

// V-05 · Job pool: upload through the intake, select it explicitly (UPLOADED != SELECTED).
await step("V-05", async () => {
  await t("job-pool-intake-toggle").click();
  await t("job-pool-upload").waitFor({ state: "visible", timeout: 10000 });
  await t("job-pool-file-input").setInputFiles(POOL_FILE);
  await t("job-pool-actor-input").fill("DLL_VIDEO_OPERATOR");
  await page.locator('[data-testid="job-pool-upload-btn"]:not([disabled])').waitFor({ timeout: 10000 });
  await t("job-pool-upload-btn").click();
  await page.locator('[data-testid="job-pool-upload-result"][data-upload-outcome="CREATED"]').waitFor({ timeout: 60000 });
  ok("V-05a", "UPLOAD PERSISTED (NEW) with the content-derived upload id", (await text("job-pool-upload-result")).includes(POOL), await text("job-pool-upload-result"));
  await shot("pool-uploaded");
  await t("job-pool-intake-toggle").click();
  await t(`job-pool-select-${POOL}`).click();
  await page.locator(`[data-testid="syntx-organization-${ORG}"]`).waitFor({ timeout: 30000 });
  ok("V-05b", "pool selected: URL carries jobPoolUploadId; 3 organizations, 9 roles", params().get("jobPoolUploadId") === POOL && await page.locator('[data-testid^="syntx-organization-"]').count() === 3, await text("syntx-summary"));
  await shot("pool-field");
});

// V-06 · Organization → concrete role (Kestrel → Senior Full-Stack Engineer – Shipment Tracking); the PERSON analysis compares nothing.
await step("V-06", async () => {
  await tap(t(`syntx-organization-${ORG}`));
  await page.locator(`[data-testid="syntx-role-${ROLE}"]`).waitFor({ timeout: 30000 });
  ok("V-06a", "organization cosmos of Kestrel with its three role cards", params().get("jobOrganizationId") === ORG && await page.locator('[data-testid^="syntx-role-role_kestrel_"]').count() >= 3);
  await shot("organization-kestrel");
  await tap(t(`syntx-role-${ROLE}`));
  await page.locator(`[data-testid="syntx-field"][data-observation-kind="ROLE"][data-observation-id="${ROLE}"]`).waitFor({ timeout: 30000 });
  ok("V-06b", "role level: the role's requirements (9); the PERSON analysis is not compared (analysis source NONE)", await page.locator('[data-testid^="syntx-requirement-"]').count() >= 9 && await attr("syntx-field", "data-analysis-source") === "NONE", `requirements=${await page.locator('[data-testid^="syntx-requirement-"]').count()}`);
  await shot("role-person-no-comparison");
});

// V-07 · The architectural answer, shown: the existing PERSON analysis cannot be assigned to this role.
await step("V-07", async () => {
  const b2 = await fetch(`${BASE}/api/career/analyses/${personAnalysis}/job-comparison?jobPoolUploadId=${POOL}&poolRoleId=${ROLE}`);
  const b2Body = await b2.json();
  const matches = await fetch(`${BASE}/api/career/job-pools/${POOL}/matches?analysisId=${personAnalysis}`);
  const matchesBody = await matches.json();
  ok("V-07a", "B2 refuses the PERSON analysis for the role (ERR_JOB_COMPARISON_NOT_SCOPED); /matches refuses it (409)", b2Body?.issues?.[0]?.code === "ERR_JOB_COMPARISON_NOT_SCOPED" && matches.status === 409 && matchesBody?.error?.code === "ERR_JOB_POOL_MATCHES_PERSON_ANALYSIS", `${b2.status} ${b2Body?.issues?.[0]?.code} / ${matches.status} ${matchesBody?.error?.code}`);
});

// V-08 · PERSON × JOB: the job selected first (JOB POOL FIRST), then a NEW analysis of the same PDF bounded by this role.
let pxjAnalysis = null;
await step("V-08", async () => {
  await t("investigation-mode-PERSON_X_JOB").click();
  await waitRoot("data-investigation-mode", "PERSON_X_JOB");
  await t("syntx-job-scope-select").click();
  await waitRoot("data-capability-gate", "OPEN");
  ok("V-08a", "job scope selected: the indicator names the role; Capability open again", await attr("job-scope-indicator", "data-job-scope-state") === "VALID" && (await text("job-scope-indicator")).includes("Shipment Tracking"), await text("job-scope-indicator"));
  await shot("job-scope-selected");
  await t("field-focus-capability-btn").click();
  await waitRoot("data-field-focus", "CAPABILITY");
  const staged = (await text("source-dock")).includes("cv.synthetic.pdf");
  if (!staged) await t("source-dock-file-input").setInputFiles(PDF);
  ok("V-08b", "the PDF is still staged after the PERSON analysis and the field switches", staged);
  ok("V-08c", "the dock names the boundary PERSON × JOB with the role at the trigger", await attr("analyze-investigation", "data-investigation-mode") === "PERSON_X_JOB", await text("analyze-investigation"));
  await shot("pxj-staged");
  const before = analyzeBodies.length, t0 = Date.now();
  await t("start-intake-analysis-btn").click();
  await page.locator('[data-testid="intake-success-investigation"][data-investigation-mode="PERSON_X_JOB"]').waitFor({ timeout: 300000 });
  timings.pxjAnalysisMs = Date.now() - t0;
  const body = analyzeBodies.at(-1);
  ok("V-08d", "one new ANALYZE request: the same PDF, investigation PERSON_X_JOB, jobScope exactly this pool and role", analyzeBodies.length === before + 1 && body.documents[0]?.type === "pdf" && JSON.stringify(body.investigation) === '{"mode":"PERSON_X_JOB"}' && JSON.stringify(body.jobScope) === JSON.stringify({ jobPoolUploadId: POOL, poolRoleId: ROLE }), JSON.stringify(body));
  await shot("pxj-analysis-done");
});

// V-09 · Back at the role: the comparison of THIS analysis, a requirement opened down to its quote, then B2 coverage.
await step("V-09", async () => {
  await t("job-scope-indicator").click();
  await page.locator(`[data-testid="syntx-field"][data-observation-kind="ROLE"][data-observation-id="${ROLE}"]`).waitFor({ timeout: 30000 });
  await page.locator('[data-testid="syntx-field"][data-analysis-source="JOB_RESULT"]').waitFor({ timeout: 30000 });
  const support = await page.locator('[data-testid^="syntx-requirement-"]').evaluateAll(list => list.map(el => `${el.getAttribute("data-testid").replace("syntx-requirement-", "")}:${el.getAttribute("data-support")}`));
  ok("V-09a", "the role compares this PERSON × JOB analysis (source JOB_RESULT); requirement support as delivered", support.length >= 9, JSON.stringify(support));
  await shot("pxj-role-comparison");
  await t("syntx-investigation-toggle").click();
  await page.locator('[data-testid="syntx-coverage"][data-coverage-state="AVAILABLE"]').waitFor({ timeout: 30000 });
  pxjAnalysis = await attr("syntx-coverage", "data-binding-analysis");
  const covered = await attr("syntx-coverage", "data-covered"), notCovered = await attr("syntx-coverage", "data-not-covered");
  const rows = await page.locator('[data-testid^="syntx-coverage-req-"]').evaluateAll(list => list.map(el => `${el.getAttribute("data-testid").replace("syntx-coverage-req-", "")}:${el.getAttribute("data-coverage")}/${el.getAttribute("data-match-basis") ?? ""}`));
  ok("V-09b", "B2: unconfirmed name coverage for exactly this role, bound to this analysis; scored false", Number(covered) >= 1 && await attr("syntx-coverage", "data-scored") === "false" && pxjAnalysis !== null && pxjAnalysis !== personAnalysis, `covered=${covered} notCovered=${notCovered} ${JSON.stringify(rows)}`);
  await shot("b2-coverage");
  await page.keyboard.press("Escape");
});

// V-10 · GEMINI OUTPUT of the PERSON × JOB analysis: the scope text retained and named as never evidence.
await step("V-10", async () => {
  await t("syntx-gemini-output-toggle").click();
  await t("syntx-gemini-token").fill(st.token);
  await t("syntx-gemini-read").click();
  await page.locator('[data-testid="syntx-gemini-output"][data-inspection-state="AVAILABLE"]').waitFor({ timeout: 30000 });
  await t("syntx-gemini-view-SCOPE").click();
  ok("V-10a", "SCOPE view: RETAINED, carries the role", await attr("syntx-gemini-scope", "data-scope-state") === "RETAINED" && (await t("syntx-gemini-scope-text").textContent()).includes(ROLE));
  await shot("pxj-gemini-scope");
  await page.keyboard.press("Escape");
});

// V-11 · JOB ONLY: an independent mode; the job itself, no analysis, no Gemini.
await step("V-11", async () => {
  await page.goto(`${BASE}/career/demo?focus=FIELD&jobPoolUploadId=${POOL}&jobOrganizationId=${ORG}&jobRoleId=${JOB_ROLE}&jobScopePoolUploadId=${POOL}&jobScopeRoleId=${JOB_ROLE}&investigationMode=JOB`, { waitUntil: "networkidle" });
  await page.locator('[data-testid="job-scope-indicator"][data-job-scope-state="VALID"]').waitFor({ timeout: 30000 });
  ok("V-11a", "JOB: Capability closed (JOB_MODE), the Job Field reads no analysis", await rootAttr("data-investigation-mode") === "JOB" && await rootAttr("data-capability-gate") === "JOB_MODE" && await attr("syntx-field", "data-analysis-source") === "NONE");
  await t("syntx-investigation-toggle").click();
  await page.locator('[data-testid="syntx-job-structure"][data-structure-state="AVAILABLE"]').waitFor({ timeout: 30000 });
  ok("V-11b", "JOB_STRUCTURE_V1: the role's requirements in pool order with pool-source lines and findings", await page.locator('[data-testid^="syntx-structure-req-"]').count() >= 8, `rows=${await page.locator('[data-testid^="syntx-structure-req-"]').count()} findings=${await attr("syntx-job-structure", "data-finding-count")}`);
  await shot("job-structure");
  await page.keyboard.press("Escape");
  await t("syntx-gemini-output-toggle").click();
  ok("V-11c", "GEMINI OUTPUT in JOB: no Gemini call in this mode", await attr("syntx-gemini-output", "data-inspection-state") === "NO_GEMINI");
  await shot("job-no-gemini");
  await page.keyboard.press("Escape");
});

// V-12 · Deep links for a recording agent: the finished PERSON × JOB analysis at its role, and the PERSON analysis there.
await step("V-12", async () => {
  const link = analysisId => `${BASE}/career/demo?analysisId=${analysisId}&focus=FIELD&jobPoolUploadId=${POOL}&jobOrganizationId=${ORG}&jobRoleId=${ROLE}&jobScopePoolUploadId=${POOL}&jobScopeRoleId=${ROLE}`;
  await page.goto(link(pxjAnalysis), { waitUntil: "networkidle" });
  await t("syntx-investigation-toggle").click();
  await page.locator('[data-testid="syntx-coverage"][data-coverage-state="AVAILABLE"]').waitFor({ timeout: 30000 });
  ok("V-12a", "deep link to the PERSON × JOB analysis at its role: B2 AVAILABLE again", await attr("syntx-coverage", "data-binding-analysis") === pxjAnalysis);
  await page.keyboard.press("Escape");
  await page.goto(link(personAnalysis), { waitUntil: "networkidle" });
  await t("syntx-investigation-toggle").click();
  await page.locator('[data-testid="syntx-coverage"]:not([data-coverage-state="LOADING"])').waitFor({ timeout: 30000 });
  ok("V-12b", "deep link to the PERSON analysis at the same role: NOT_SCOPED, no job comparison", await attr("syntx-coverage", "data-coverage-state") === "NOT_SCOPED", await text("syntx-coverage"));
  await shot("person-at-role-not-scoped");
});

const urls = { start: `${BASE}/career/demo`, pxjAtRole: pxjAnalysis && `${BASE}/career/demo?analysisId=${pxjAnalysis}&focus=FIELD&jobPoolUploadId=${POOL}&jobOrganizationId=${ORG}&jobRoleId=${ROLE}&jobScopePoolUploadId=${POOL}&jobScopeRoleId=${ROLE}`, jobOnly: `${BASE}/career/demo?focus=FIELD&jobPoolUploadId=${POOL}&jobOrganizationId=${ORG}&jobRoleId=${JOB_ROLE}&jobScopePoolUploadId=${POOL}&jobScopeRoleId=${JOB_ROLE}&investigationMode=JOB` };
ok("V-99", "no page error during the walk", errors.length === 0, JSON.stringify(errors));
await browser.close();
const failed = results.filter(r => !r.pass);
writeFileSync(`${OUT}/walk-results-${W}.json`, JSON.stringify({ viewport: `${W}x${H}`, personAnalysis, pxjAnalysis, timings, analyzeBodies, urls: Object.fromEntries(Object.entries(urls).map(([k, v]) => [k, v && v.replace(BASE, "<BASE>")])), results }, null, 2));
console.log(`${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length === 0 ? 0 : 1);
