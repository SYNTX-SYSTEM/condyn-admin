/**
 * PINK independent verification of the owner's SFE job-scope invariant ("no Gemini call without a valid, selected job
 * scope") and the expected behaviour of the mandate "SFE — INDEPENDENT VERIFICATION" (2026-10-14):
 *
 *   G-01 application open → Job Pool screen
 *   G-02 no valid pool → Capability OFF
 *   G-03 pool loaded, no job selected → Capability OFF
 *   G-04 valid pool + valid job selected → Capability ON, and the request carries exactly that scope
 *   G-05 job selection removed or invalid → Capability OFF
 *   G-06 direct analysis call without a valid selection → backend REJECT, nothing enqueued
 *   G-08 the selected scope (or its absence) is visible in both fields, at every depth, at 1600 and 1280 px
 *   G-09 semiotic grammar: no closure glyph introduced by the scope selection
 *   G-10 one rule for "valid": the frontend's VALID and the backend's acceptance agree on the same stored role id
 *        (owner decision 2026-10-14, variant A: the role id is taken exactly as stored, only "" is refused)
 *   G-11 every execution path: the legacy page /career/analyze starts an analysis only with a VALID scope
 *
 * "Capability ON/OFF" is read on two surfaces and reported separately, because the mandate names both: (a) the
 * ANALYZE trigger (the invariant's gate: present, enabled, no request without scope) and (b) the Capability field
 * itself (reachable via `field-focus-capability-btn`). A run records every check and fails once at the end, so one run
 * lists every deviation. No worker runs here: an accepted request is only enqueued in the disposable database, so no
 * Gemini call can happen. The tip under test names the evidence directory (JOB_SCOPE_TIP=<hash>).
 */
import { spawn, type ChildProcess } from "node:child_process";
import { createHash } from "node:crypto";
import { once } from "node:events";
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { createServer } from "node:net";
import { resolve } from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PostgresCareerAnalysisRepository } from "../../lib/career/repositories/postgres";
import { createJobPoolPostgresWorld, type JobPoolWorld } from "../career/job-pool/fixtures/job-pool-postgres-world";
import { buildVerifiedAnalysis } from "./fixtures/analysis";
import { clonePool, draftPool, validationPool } from "./fixtures/pool";

function resolvePlaywright(): string | null {
  const explicit = process.env.CONDYN_PLAYWRIGHT_MODULE;
  if (explicit !== undefined && explicit.length > 0) return explicit;
  try { return createRequire(resolve(process.cwd(), "package.json")).resolve("playwright"); } catch { return null; }
}
const playwrightModule = resolvePlaywright();
const TIP = process.env.JOB_SCOPE_TIP ?? "cb3d33f";
const EVIDENCE_DIR = resolve(process.cwd(), `docs/architecture/decision-fields/evidence/job-scope-gate-${TIP}`);
const ANALYSIS_ID = "ANL_PINK_JOB_SCOPE_GATE";
const ROLE_ID = "role_pink_alpha_architect";
const OTHER_ROLE_ID = "role_pink_beta_platform";
// The owner's sentence (owner GO 2026-10-15, GELB e643e96; before: "Bitte wählen Sie einen Job aus."). One sentence for the
// backend (G-06) and the interface (G-02/03/05/11): a surface still showing the earlier sentence is a deviation.
const MESSAGE = "Bitte wähle einen Job aus einem Pool aus.";
const UNKNOWN_POOL = `JPOOL_${"0".repeat(32)}`;
const SPACED_ROLE_ID = "role pink beta platform";
const PADDED_ROLE_ID = "  role pink padded  ";
const CLOSURE_GLYPHS = /✓|✔|☑|checkmark/;

let world: JobPoolWorld;
let server: ChildProcess | undefined;
let port = 0;
let serverOutput = "";
const base = () => `http://127.0.0.1:${port}`;
const delay = (ms: number) => new Promise<void>((done) => setTimeout(done, ms));
const sha256 = (buffer: Buffer | string) => createHash("sha256").update(buffer).digest("hex");

async function availablePort(): Promise<number> {
  const listener = createServer();
  await new Promise<void>((ok, fail) => { listener.once("error", fail); listener.listen(0, "127.0.0.1", () => ok()); });
  const address = listener.address();
  if (address === null || typeof address === "string") throw new Error("no port");
  await new Promise<void>((ok, fail) => listener.close((error) => (error ? fail(error) : ok())));
  return address.port;
}

interface Check { id: string; name: string; ok: boolean; detail: string }

describe.skipIf(playwrightModule === null)("PINK G: job-scope gate — Job Pool first, Capability OFF/ON, backend reject, display, preservation of the semiotic grammar", () => {
  let browser: any;
  let uploadId = "";
  let draftId = "";
  let requirementId = "";
  let spacedUploadId = "";
  let spacedUploadStatus = 0;
  const checks: Check[] = [];
  const pageErrors: string[] = [];
  const analyzePosts: Array<{ body: unknown; status: number | null }> = [];
  const check = (id: string, name: string, ok: boolean, detail: unknown = "") => { checks.push({ id, name, ok: !!ok, detail: typeof detail === "string" ? detail : JSON.stringify(detail) }); };
  const jobCount = async () => Number((await world.sql`select count(*)::int as n from career_analysis_jobs`)[0].n);

  async function open(path: string, viewport = { width: 1600, height: 1000 }) {
    const page = await browser.newPage({ viewport });
    page.on("pageerror", (error: unknown) => pageErrors.push(`${path}: ${String(error)}`));
    page.on("request", (request: any) => {
      if (request.method() === "POST" && request.url().endsWith("/api/career/analyze")) {
        const entry = { body: (() => { try { return JSON.parse(request.postData() ?? "null"); } catch { return request.postData(); } })(), status: null as number | null };
        analyzePosts.push(entry);
        request.response().then((response: any) => { entry.status = response?.status() ?? null; }).catch(() => {});
      }
    });
    await page.goto(`${base()}${path}`, { waitUntil: "domcontentloaded", timeout: 120_000 });
    await page.getByTestId("field-focus-strip").waitFor({ timeout: 120_000 });
    // The guided onboarding mounts late; dismiss it when it comes, never wait for it when it does not.
    const overlay = page.getByTestId("guided-onboarding-overlay");
    try { await overlay.waitFor({ timeout: 20_000 }); await page.getByTestId("onboarding-close-btn").click(); await overlay.waitFor({ state: "detached", timeout: 30_000 }); } catch { /* no overlay */ }
    return page;
  }
  const focusOf = async (page: any) => page.getByTestId("field-focus-strip").getAttribute("data-field-focus");
  /** The scope indicator's settled state (CHECKING resolves to NONE / VALID / INVALID), or null when absent. */
  async function scopeState(page: any): Promise<string | null> {
    const indicator = page.getByTestId("job-scope-indicator");
    for (let attempt = 0; attempt < 60; attempt += 1) {
      if ((await indicator.count()) === 0) { await delay(250); continue; }
      const state = await indicator.getAttribute("data-job-scope-state");
      if (state !== "CHECKING") return state;
      await delay(250);
    }
    return (await indicator.count()) === 0 ? null : indicator.getAttribute("data-job-scope-state");
  }
  /** Visible = inside the viewport and owning its own centre point (not covered by another surface). */
  const indicatorVisible = (page: any) => page.evaluate(() => {
    const element = document.querySelector('[data-testid="job-scope-indicator"]') as HTMLElement | null;
    if (element === null) return { present: false, inViewport: false, owned: false, text: "" };
    const box = element.getBoundingClientRect();
    const inViewport = box.width > 0 && box.height > 0 && box.left >= 0 && box.top >= 0 && box.right <= innerWidth && box.bottom <= innerHeight;
    const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
    return { present: true, inViewport, owned: hit !== null && element.contains(hit), text: (element.textContent ?? "").replace(/\s+/g, " ").trim(), opacity: getComputedStyle(element).opacity, visibility: getComputedStyle(element).visibility };
  });
  /** Capability field reachable: the selector's capability button switches the shell to CAPABILITY. */
  async function capabilityReachable(page: any): Promise<{ reachable: boolean; disabled: boolean; focusAfter: string | null }> {
    const button = page.getByTestId("field-focus-capability-btn");
    if ((await button.count()) === 0) return { reachable: false, disabled: true, focusAfter: await focusOf(page) };
    const disabled = await button.evaluate((element: HTMLButtonElement) => element.disabled || element.getAttribute("aria-disabled") === "true");
    if (!disabled) { await button.click({ timeout: 5_000 }).catch(() => {}); await delay(700); }
    const focusAfter = await focusOf(page);
    return { reachable: !disabled && focusAfter === "CAPABILITY", disabled, focusAfter };
  }
  /** The other ways into the Capability field (URL focus=CAPABILITY, ←/Home, syntx-exit-btn) and the root gate attribute. */
  async function otherWays(page: any): Promise<{ gate: string | null; exitDisabled: boolean | null; focusAfterKeys: string | null; focusAfterExit: string | null }> {
    const gate = await page.getByTestId("semantic-career-intelligence-field").getAttribute("data-capability-gate").catch(() => null);
    await page.getByTestId("syntx-field").focus().catch(() => {});
    for (const key of ["ArrowLeft", "Home"]) { await page.keyboard.press(key); await delay(500); }
    const focusAfterKeys = await focusOf(page);
    const exit = page.getByTestId("syntx-exit-btn");
    const exitDisabled = (await exit.count()) === 0 ? null : await exit.evaluate((element: HTMLButtonElement) => element.disabled || element.getAttribute("aria-disabled") === "true");
    if (exitDisabled === false) { await exit.click({ timeout: 5_000 }).catch(() => {}); await delay(700); }
    return { gate, exitDisabled, focusAfterKeys, focusAfterExit: await focusOf(page) };
  }
  /** Stages one text source in the SourceDock (only possible where the dock is reachable) and reads the ANALYZE trigger. */
  async function analyzeTrigger(page: any): Promise<{ staged: boolean; present: boolean; disabled: boolean; blockedAttr: string | null; message: string | null; postsOnForcedClick: number }> {
    const add = page.getByTestId("add-text-source-btn");
    let staged = false;
    await add.waitFor({ state: "visible", timeout: 10_000 }).catch(() => {});
    if ((await add.count()) > 0 && await add.isVisible().catch(() => false)) {
      try {
        await add.click({ timeout: 5_000 });
        await page.getByTestId("source-text-input").fill("PINK job-scope gate probe: Software architect with eight years of platform design.");
        await page.getByTestId("submit-source-btn").click({ timeout: 5_000 });
        staged = true;
      } catch { staged = false; }
    }
    const trigger = page.getByTestId("start-intake-analysis-btn");
    const present = (await trigger.count()) > 0;
    if (!present) return { staged, present, disabled: true, blockedAttr: null, message: null, postsOnForcedClick: 0 };
    const disabled = await trigger.evaluate((element: HTMLButtonElement) => element.disabled);
    const blockedAttr = await trigger.getAttribute("data-job-scope-blocked");
    const messageNode = page.getByTestId("analyze-job-scope-required");
    const message = (await messageNode.count()) > 0 ? ((await messageNode.textContent()) ?? "").trim() : null;
    const before = analyzePosts.length;
    if (disabled) {
      // A disabled trigger is dispatched a DOM click anyway: no request may leave the page.
      await trigger.evaluate((element: HTMLButtonElement) => element.click());
      await delay(800);
    }
    return { staged, present, disabled, blockedAttr, message, postsOnForcedClick: analyzePosts.length - before };
  }
  const offState = (trigger: Awaited<ReturnType<typeof analyzeTrigger>>) => (!trigger.present || trigger.disabled) && trigger.postsOnForcedClick === 0;

  beforeAll(async () => {
    world = await createJobPoolPostgresWorld();
    await new PostgresCareerAnalysisRepository(drizzle(world.sql)).save(buildVerifiedAnalysis(ANALYSIS_ID));
    port = await availablePort();
    server = spawn(process.execPath, [resolve(process.cwd(), "node_modules/next/dist/bin/next"), "dev", "--webpack", "-p", String(port), "-H", "127.0.0.1"], {
      // No worker is started: an accepted analysis request is only enqueued, so no Gemini call can happen in this run.
      cwd: process.cwd(), env: { ...process.env, DATABASE_URL: world.databaseUrl, NEXT_TELEMETRY_DISABLED: "1", GEMINI_API_KEY: "" }, stdio: ["ignore", "pipe", "pipe"]
    });
    server.stdout?.on("data", (chunk) => { serverOutput += String(chunk); });
    server.stderr?.on("data", (chunk) => { serverOutput += String(chunk); });
    for (let attempt = 0; attempt < 160; attempt += 1) {
      try { const response = await fetch(`${base()}/api/career/job-pools`); if (response.status === 200) { await response.json(); break; } } catch { /* not ready */ }
      await delay(500);
      if (attempt === 159) throw new Error(`server not ready:\n${serverOutput}`);
    }
    const post = async (body: unknown) => (await fetch(`${base()}/api/career/job-pools`, { method: "POST", headers: { "content-type": "application/json", "x-condyn-principal-actor-id": "PINK_JOB_SCOPE_GATE" }, body: JSON.stringify(body) })).json();
    uploadId = (await post(validationPool)).jobPoolUploadId;
    draftId = (await post(draftPool())).jobPoolUploadId;
    // G-10 fixture: the pool schema admits any non-empty id; one role id carries spaces (frontend and backend must agree on it).
    const spaced = clonePool() as any;
    spaced.pool.id = "pool_pink_scope_id_probe"; spaced.pool.name = "PINK scope id probe";
    for (const list of [spaced.organizations, spaced.roles]) for (const item of list) item.pool_id = spaced.pool.id;
    for (const role of spaced.roles) if (role.id === OTHER_ROLE_ID) role.id = SPACED_ROLE_ID;
    for (const requirement of spaced.requirements) if (requirement.role_id === OTHER_ROLE_ID) requirement.role_id = SPACED_ROLE_ID;
    for (const role of spaced.roles) if (role.id === "role_pink_beta_empty") role.id = PADDED_ROLE_ID;
    const spacedResponse = await fetch(`${base()}/api/career/job-pools`, { method: "POST", headers: { "content-type": "application/json", "x-condyn-principal-actor-id": "PINK_JOB_SCOPE_GATE" }, body: JSON.stringify(spaced) });
    spacedUploadStatus = spacedResponse.status;
    spacedUploadId = (await spacedResponse.json().catch(() => ({})))?.jobPoolUploadId ?? "";
    const view = await (await fetch(`${base()}/api/career/job-pools/${uploadId}`)).json();
    requirementId = view.canonicalMapping.roles.find((role: any) => role.poolRoleId === ROLE_ID).requirements[0].poolRequirementId;
    mkdirSync(EVIDENCE_DIR, { recursive: true });
    writeFileSync(resolve(EVIDENCE_DIR, "G-00-pools.json"), `${JSON.stringify({ uploadId, draftId, poolStatus: view.poolStatus, mappingState: view.canonicalMapping?.mappingState, roles: view.canonicalMapping.roles.map((role: any) => role.poolRoleId) }, null, 2)}\n`);
    const playwright = await import(playwrightModule as string);
    browser = await playwright.chromium.launch({ headless: true });
  }, 300_000);

  afterAll(async () => {
    if (browser) await browser.close();
    if (server && server.exitCode === null && server.signalCode === null) {
      server.kill("SIGTERM");
      await Promise.race([once(server, "exit"), delay(10_000)]);
      if (server.exitCode === null && server.signalCode === null) { server.kill("SIGKILL"); await once(server, "exit"); }
    }
    if (world) await world.destroy();
    if (checks.length > 0) {
      const failed = checks.filter((entry) => !entry.ok);
      writeFileSync(resolve(EVIDENCE_DIR, "G-report.json"), `${JSON.stringify({ tip: TIP, recordedAt: new Date().toISOString(), passed: checks.length - failed.length, total: checks.length, deviations: failed, checks, analyzePosts, pageErrors }, null, 2)}\n`);
      writeFileSync(resolve(EVIDENCE_DIR, "G-report.txt"), `${checks.map((entry) => `${entry.ok ? "ok  " : "DEV "} ${entry.id} ${entry.name}${entry.detail ? ` · ${entry.detail}` : ""}`).join("\n")}\n\n${checks.length - failed.length}/${checks.length} checks ok\n`);
      const manifest = readdirSync(EVIDENCE_DIR).filter((name) => name !== "manifest.sha256").sort().map((name) => `${sha256(readFileSync(resolve(EVIDENCE_DIR, name)))}  ${name}`).join("\n");
      writeFileSync(resolve(EVIDENCE_DIR, "manifest.sha256"), `${manifest}\n`);
    }
  }, 60_000);

  it("walks G-01 … G-11 and lists every deviation", async () => {
    // ---- G-01 application open → Job Pool screen ------------------------------------------------------------------------
    const start = await open("/career/demo");
    const startFocus = await focusOf(start);
    check("G-01", "application opens on the Job Pool screen (shell focus FIELD)", startFocus === "FIELD", `focus ${startFocus}`);
    const startScope = await scopeState(start);
    check("G-01", "no job is selected at open (indicator NONE)", startScope === "NONE", `indicator ${startScope}`);
    await start.screenshot({ path: resolve(EVIDENCE_DIR, "G-01-open.png") });

    // ---- G-02 no valid pool → Capability OFF ----------------------------------------------------------------------------
    const noPoolCap = await capabilityReachable(start);
    check("G-02", "no valid pool: Capability field locked", !noPoolCap.reachable, noPoolCap);
    const noPoolTrigger = await analyzeTrigger(start);
    check("G-02", "no valid pool: ANALYZE not executable, no request leaves the page", offState(noPoolTrigger), noPoolTrigger);
    check("G-02", "no valid pool: the owner's sentence stands at the trigger when it is shown", !noPoolTrigger.present || noPoolTrigger.message === MESSAGE, noPoolTrigger.message);
    await start.screenshot({ path: resolve(EVIDENCE_DIR, "G-02-no-pool.png") });
    await start.close();
    const unknownPool = await open(`/career/demo?focus=FIELD&jobPoolUploadId=${UNKNOWN_POOL}`);
    const unknownCap = await capabilityReachable(unknownPool);
    check("G-02", "unknown pool in the URL: Capability field locked", !unknownCap.reachable, unknownCap);
    const unknownTrigger = await analyzeTrigger(unknownPool);
    check("G-02", "unknown pool in the URL: ANALYZE not executable", offState(unknownTrigger), unknownTrigger);
    await unknownPool.close();

    // ---- G-03 pool loaded, no job selected → Capability OFF -------------------------------------------------------------
    const askCapability = await open(`/career/demo?focus=CAPABILITY&analysisId=${ANALYSIS_ID}&jobPoolUploadId=${uploadId}`);
    await delay(1_500);
    const askedFocus = await focusOf(askCapability);
    check("G-03", "URL focus=CAPABILITY without a job: the shell stays on the Job Field", askedFocus === "FIELD", `focus ${askedFocus}`);
    await askCapability.close();
    const poolOnly = await open(`/career/demo?focus=FIELD&analysisId=${ANALYSIS_ID}&jobPoolUploadId=${uploadId}`);
    await poolOnly.locator('[data-testid="syntx-field"][data-field-state="AVAILABLE"]').waitFor({ timeout: 120_000 });
    const ways = await otherWays(poolOnly);
    check("G-03", "pool without a job: ←/Home and syntx-exit-btn do not open the Capability field", ways.focusAfterKeys === "FIELD" && ways.focusAfterExit === "FIELD", ways);
    check("G-03", "pool loaded without a job: indicator NONE", (await scopeState(poolOnly)) === "NONE", await scopeState(poolOnly));
    const poolOnlyCap = await capabilityReachable(poolOnly);
    check("G-03", "pool loaded without a job: Capability field locked", !poolOnlyCap.reachable, poolOnlyCap);
    const poolOnlyTrigger = await analyzeTrigger(poolOnly);
    check("G-03", "pool loaded without a job: ANALYZE not executable, no request", offState(poolOnlyTrigger), poolOnlyTrigger);
    check("G-03", "pool loaded without a job: the owner's sentence verbatim at the trigger when shown", !poolOnlyTrigger.present || poolOnlyTrigger.message === MESSAGE, poolOnlyTrigger.message);
    await poolOnly.screenshot({ path: resolve(EVIDENCE_DIR, "G-03-pool-no-job.png") });
    await poolOnly.close();

    // ---- G-04 valid pool + valid job → Capability ON --------------------------------------------------------------------
    const select = await open(`/career/demo?focus=FIELD&analysisId=${ANALYSIS_ID}&jobPoolUploadId=${uploadId}&jobRoleId=${ROLE_ID}`);
    await select.locator('[data-testid="syntx-field"][data-observation-kind="ROLE"]').waitFor({ timeout: 120_000 });
    const selectButton = select.getByTestId("syntx-job-scope-select");
    check("G-04", "ROLE: an explicit job selection action exists", (await selectButton.count()) === 1, await selectButton.count());
    if ((await selectButton.count()) === 1) await selectButton.click();
    await select.locator('[data-testid="job-scope-indicator"]:is([data-job-scope-state="VALID"], [data-job-scope-state="INVALID"])').waitFor({ timeout: 20_000 }).catch(() => {});
    const selectedState = await scopeState(select);
    const selectedParams = new URL(select.url()).searchParams;
    check("G-04", "after the explicit selection the indicator is VALID and names the role", selectedState === "VALID" && (await indicatorVisible(select)).text.length > 0, { state: selectedState, text: (await indicatorVisible(select)).text });
    check("G-04", "the selection is the exact scope in the URL (pool + role)", selectedParams.get("jobScopePoolUploadId") === uploadId && selectedParams.get("jobScopeRoleId") === ROLE_ID, Object.fromEntries(selectedParams));
    await select.screenshot({ path: resolve(EVIDENCE_DIR, "G-04-role-selected.png") });
    // G-09: the selection must not introduce a closure glyph into the field's visible text (R1 / B-SYNTX-CLOSURE).
    const stageText = ((await select.getByTestId("syntx-stage").textContent().catch(() => "")) ?? "").replace(/\s+/g, " ");
    const glyph = stageText.match(CLOSURE_GLYPHS);
    check("G-09", "no closure glyph (✓ ✔ ☑) in the Job Field after the job selection (R1 / B-SYNTX-CLOSURE)", glyph === null, glyph === null ? "" : `found "${glyph[0]}" in: …${stageText.slice(Math.max(0, (glyph.index ?? 0) - 40), (glyph.index ?? 0) + 40)}…`);
    // G-08: visible at every depth of the Job Field (REQUIREMENT → ROLE → ORGANIZATION → FIELD) and in the Capability field.
    const depthVisibility: Record<string, unknown> = {};
    // Every depth is opened from its URL with the same scope (the click chain is the SYNTX walk's subject, not this one's).
    const scopeQuery = `&jobScopePoolUploadId=${uploadId}&jobScopeRoleId=${ROLE_ID}`;
    const depthPaths: Record<string, string> = {
      FIELD: `/career/demo?focus=FIELD&analysisId=${ANALYSIS_ID}&jobPoolUploadId=${uploadId}${scopeQuery}`,
      ORGANIZATION: `/career/demo?focus=FIELD&analysisId=${ANALYSIS_ID}&jobPoolUploadId=${uploadId}&jobOrganizationId=org_pink_alpha${scopeQuery}`,
      ROLE: `/career/demo?focus=FIELD&analysisId=${ANALYSIS_ID}&jobPoolUploadId=${uploadId}&jobOrganizationId=org_pink_alpha&jobRoleId=${ROLE_ID}${scopeQuery}`,
      REQUIREMENT: `/career/demo?focus=FIELD&analysisId=${ANALYSIS_ID}&jobPoolUploadId=${uploadId}&jobOrganizationId=org_pink_alpha&jobRoleId=${ROLE_ID}&jobRequirementId=${requirementId}${scopeQuery}`
    };
    for (const [expected, path] of Object.entries(depthPaths)) {
      const page = await open(path);
      await page.locator(`[data-testid="syntx-field"][data-observation-kind="${expected}"]`).waitFor({ timeout: 60_000 }).catch(() => {});
      const kind = await page.getByTestId("syntx-field").getAttribute("data-observation-kind");
      depthVisibility[expected] = { kind, state: await scopeState(page), ...(await indicatorVisible(page)) };
      await page.screenshot({ path: resolve(EVIDENCE_DIR, `G-08-depth-${expected}.png`) });
      await page.close();
    }
    const allDepths = Object.entries(depthVisibility).every(([expected, entry]: [string, any]) => entry.kind === expected && entry.present && entry.inViewport && entry.owned && entry.state === "VALID");
    check("G-08", "VALID scope visible and uncovered at REQUIREMENT, ROLE, ORGANIZATION and FIELD (1600 px)", allDepths, depthVisibility);
    const scopedAsk = await open(`/career/demo?focus=CAPABILITY&analysisId=${ANALYSIS_ID}&jobPoolUploadId=${uploadId}&jobScopePoolUploadId=${uploadId}&jobScopeRoleId=${ROLE_ID}`);
    await scopedAsk.locator('[data-testid="field-focus-strip"][data-field-focus="CAPABILITY"]').waitFor({ timeout: 30_000 }).catch(() => {});
    check("G-04", "URL focus=CAPABILITY with a valid job: the Capability field opens once the scope is VALID", (await focusOf(scopedAsk)) === "CAPABILITY", `focus ${await focusOf(scopedAsk)}`);
    await scopedAsk.close();
    const validCap = await capabilityReachable(select);
    check("G-04", "valid pool + valid job: Capability field reachable", validCap.reachable, validCap);
    const capVisible = await indicatorVisible(select);
    check("G-08", "VALID scope visible and uncovered in the Capability field (1600 px)", capVisible.present && capVisible.inViewport && capVisible.owned && (await scopeState(select)) === "VALID", capVisible);
    const validTrigger = await analyzeTrigger(select);
    check("G-04", "valid pool + valid job: ANALYZE present and enabled, no blocking sentence", validTrigger.present && !validTrigger.disabled && validTrigger.message === null, validTrigger);
    const before = analyzePosts.length;
    const jobsBeforeUi = await jobCount();
    if (validTrigger.present && !validTrigger.disabled) await select.getByTestId("start-intake-analysis-btn").click();
    // The first request compiles the route in next dev: wait for the response, not for a fixed time.
    for (let attempt = 0; attempt < 240 && (analyzePosts.length === before || analyzePosts[before].status === null); attempt += 1) await delay(250);
    const sent = analyzePosts.slice(before);
    const sentScope = (sent[0]?.body as any)?.jobScope ?? null;
    check("G-04", "ANALYZE sends exactly one request carrying exactly { jobPoolUploadId, poolRoleId } of the selection", sent.length === 1 && sentScope !== null && Object.keys(sentScope).sort().join() === "jobPoolUploadId,poolRoleId" && sentScope.jobPoolUploadId === uploadId && sentScope.poolRoleId === ROLE_ID, { requests: sent.length, jobScope: sentScope });
    check("G-04", "the scoped request is accepted (202) and enqueued once (no worker runs: no Gemini call)", sent[0]?.status === 202 && (await jobCount()) === jobsBeforeUi + 1, { status: sent[0]?.status ?? null, enqueued: (await jobCount()) - jobsBeforeUi });
    await select.screenshot({ path: resolve(EVIDENCE_DIR, "G-04-capability-on.png") });
    // Owner decision 2026-10-14 (G-05): the removal is an explicit action at the selected role in the Job Field; the shell
    // indicator leads there from the Capability field (locating step proposed by GRÜN as a diff, adopted here by PINK).
    await select.getByTestId("job-scope-indicator").click().catch(() => {});
    await select.locator('[data-testid="syntx-field"][data-observation-kind="ROLE"]').waitFor({ timeout: 20_000 }).catch(() => undefined);
    const removeControls = select.locator('[data-testid*="job-scope"][data-testid*="clear"], [data-testid*="job-scope"][data-testid*="remove"], [data-testid*="job-scope"][data-testid*="deselect"]');
    const removable = await removeControls.count();
    check("G-05", "an explicit way to remove the job selection exists in the UI (reached from the Capability field via the indicator)", removable > 0, `${removable} control(s)`);
    if (removable > 0) {
      const postsBeforeClear = analyzePosts.length;
      await removeControls.first().click();
      await select.locator('[data-testid="job-scope-indicator"][data-job-scope-state="NONE"]').waitFor({ timeout: 20_000 }).catch(() => {});
      const clearedState = await scopeState(select);
      const clearedVisible = await indicatorVisible(select);
      const clearedParams = new URL(select.url()).searchParams;
      check("G-05", "after the removal the indicator shows NONE, visible and uncovered", clearedState === "NONE" && clearedVisible.present && clearedVisible.inViewport && clearedVisible.owned, { state: clearedState, ...clearedVisible });
      check("G-05", "after the removal the scope parameters are gone from the URL, the analysis stays", !clearedParams.has("jobScopePoolUploadId") && !clearedParams.has("jobScopeRoleId") && clearedParams.get("analysisId") === ANALYSIS_ID, Object.fromEntries(clearedParams));
      const clearedGate = await select.getByTestId("semantic-career-intelligence-field").getAttribute("data-capability-gate").catch(() => null);
      check("G-05", "after the removal the shell is on the Job Field and the Capability gate is closed", (await focusOf(select)) === "FIELD" && clearedGate === "AWAITING_JOB", { focus: await focusOf(select), gate: clearedGate });
      check("G-05", "the removal itself sends no analysis request", analyzePosts.length === postsBeforeClear, `${analyzePosts.length - postsBeforeClear} request(s)`);
      await select.screenshot({ path: resolve(EVIDENCE_DIR, "G-05-removed.png") });
      const clearedCap = await capabilityReachable(select);
      check("G-05", "after the removal: Capability field locked", !clearedCap.reachable, clearedCap);
      const clearedWays = await otherWays(select);
      check("G-05", "after the removal: ←/Home and syntx-exit-btn do not open the Capability field", clearedWays.focusAfterKeys === "FIELD" && clearedWays.focusAfterExit === "FIELD", clearedWays);
      // Here the analysis sent under G-04 is still in flight (enqueued, no worker): the dock shows its running state, so
      // the sentence is not expected here; it is checked below on a removal without an analysis in flight.
      const clearedTrigger = await analyzeTrigger(select);
      check("G-05", "after the removal with an analysis in flight: ANALYZE not executable, no request", offState(clearedTrigger), clearedTrigger);
      await select.reload({ waitUntil: "domcontentloaded" });
      await select.getByTestId("field-focus-strip").waitFor({ timeout: 120_000 });
      check("G-05", "after the removal and a reload the job stays removed (indicator NONE)", (await scopeState(select)) === "NONE", await scopeState(select));
    }
    await select.close();
    // The removal with staged sources and no analysis in flight: the sources stay, ANALYZE is blocked with the owner's sentence.
    const staged = await open(`/career/demo?focus=FIELD&analysisId=${ANALYSIS_ID}&jobPoolUploadId=${uploadId}&jobOrganizationId=org_pink_alpha&jobRoleId=${ROLE_ID}&jobScopePoolUploadId=${uploadId}&jobScopeRoleId=${ROLE_ID}`);
    await staged.locator('[data-testid="job-scope-indicator"][data-job-scope-state="VALID"]').waitFor({ timeout: 30_000 }).catch(() => {});
    const stagedCap = await capabilityReachable(staged);
    const stagedBefore = stagedCap.reachable ? await analyzeTrigger(staged) : null;
    check("G-05", "removal without an analysis in flight: a source is staged and ANALYZE is enabled before the removal", stagedBefore !== null && stagedBefore.staged && stagedBefore.present && !stagedBefore.disabled, { capability: stagedCap, trigger: stagedBefore });
    await staged.getByTestId("job-scope-indicator").click().catch(() => {});
    await staged.locator('[data-testid="syntx-field"][data-observation-kind="ROLE"]').waitFor({ timeout: 20_000 }).catch(() => undefined);
    const postsBeforeStagedClear = analyzePosts.length;
    await staged.getByTestId("syntx-job-scope-clear").click({ timeout: 10_000 }).catch(() => {});
    await staged.locator('[data-testid="job-scope-indicator"][data-job-scope-state="NONE"]').waitFor({ timeout: 20_000 }).catch(() => {});
    const stagedTrigger = staged.getByTestId("start-intake-analysis-btn");
    const stagedAfter = {
      state: await scopeState(staged),
      sourceStillStaged: (await stagedTrigger.count()) > 0,
      disabled: (await stagedTrigger.count()) > 0 ? await stagedTrigger.evaluate((element: HTMLButtonElement) => element.disabled) : null,
      message: (await staged.getByTestId("analyze-job-scope-required").count()) > 0 ? ((await staged.getByTestId("analyze-job-scope-required").textContent()) ?? "").trim() : null
    };
    if ((await stagedTrigger.count()) > 0) { await stagedTrigger.evaluate((element: HTMLButtonElement) => element.click()); await delay(800); }
    check("G-05", "removal without an analysis in flight: indicator NONE, the staged source stays, ANALYZE disabled with the owner's sentence verbatim, no request", stagedAfter.state === "NONE" && stagedAfter.sourceStillStaged && stagedAfter.disabled === true && stagedAfter.message === MESSAGE && analyzePosts.length === postsBeforeStagedClear, { ...stagedAfter, requests: analyzePosts.length - postsBeforeStagedClear });
    await staged.screenshot({ path: resolve(EVIDENCE_DIR, "G-05-removed-staged.png") });
    await staged.close();

    // ---- G-05 selection removed or invalid → Capability OFF ---------------------------------------------------------------
    const invalidCases: Array<[string, string]> = [
      ["removed (scope parameters absent)", `/career/demo?focus=FIELD&analysisId=${ANALYSIS_ID}&jobPoolUploadId=${uploadId}`],
      ["role not in the pool", `/career/demo?focus=FIELD&analysisId=${ANALYSIS_ID}&jobPoolUploadId=${uploadId}&jobScopePoolUploadId=${uploadId}&jobScopeRoleId=role_pink_does_not_exist`],
      ["pool not ACTIVE (DRAFT)", `/career/demo?focus=FIELD&analysisId=${ANALYSIS_ID}&jobPoolUploadId=${uploadId}&jobScopePoolUploadId=${draftId}&jobScopeRoleId=${ROLE_ID}`],
      ["pool unknown", `/career/demo?focus=FIELD&analysisId=${ANALYSIS_ID}&jobPoolUploadId=${uploadId}&jobScopePoolUploadId=${UNKNOWN_POOL}&jobScopeRoleId=${ROLE_ID}`],
      ["scope malformed", `/career/demo?focus=FIELD&analysisId=${ANALYSIS_ID}&jobPoolUploadId=${uploadId}&jobScopePoolUploadId=not-a-pool&jobScopeRoleId=${ROLE_ID}`]
    ];
    for (const [label, path] of invalidCases) {
      const page = await open(path);
      const state = await scopeState(page);
      const visible = await indicatorVisible(page);
      check("G-05", `${label}: indicator shows the absence or invalidity`, (state === "NONE" || state === "INVALID") && visible.present && visible.inViewport && visible.owned, { state, ...visible });
      const cap = await capabilityReachable(page);
      check("G-05", `${label}: Capability field locked`, !cap.reachable, cap);
      const trigger = await analyzeTrigger(page);
      check("G-05", `${label}: ANALYZE not executable, no request`, offState(trigger), trigger);
      await page.close();
    }

    // ---- G-08 display at 1280 × 720 ------------------------------------------------------------------------------------
    for (const [label, path] of [["NONE", `/career/demo?focus=FIELD&analysisId=${ANALYSIS_ID}&jobPoolUploadId=${uploadId}`], ["VALID", `/career/demo?focus=FIELD&analysisId=${ANALYSIS_ID}&jobPoolUploadId=${uploadId}&jobScopePoolUploadId=${uploadId}&jobScopeRoleId=${ROLE_ID}`]] as const) {
      const page = await open(path, { width: 1280, height: 720 });
      const state = await scopeState(page);
      const visible = await indicatorVisible(page);
      check("G-08", `${label} scope visible and uncovered in the Job Field at 1280 × 720`, state === label && visible.present && visible.inViewport && visible.owned, { state, ...visible });
      await page.screenshot({ path: resolve(EVIDENCE_DIR, `G-08-1280-${label}.png`) });
      await page.close();
    }

    // ---- G-06 direct analysis call without a valid selection → backend REJECT ------------------------------------------
    const documents = [{ type: "text", title: "PINK direct call", content: "PINK job-scope gate probe: Software architect with eight years of platform design." }];
    const direct = async (label: string, body: Record<string, unknown>, expectedStatus: number, expectedCode: string) => {
      const jobsBefore = await jobCount();
      const response = await fetch(`${base()}/api/career/analyze`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const payload = await response.json().catch(() => null);
      const issue = payload?.issues?.[0] ?? null;
      const enqueued = (await jobCount()) - jobsBefore;
      check("G-06", `direct POST, ${label}: ${expectedStatus} ${expectedCode}, the owner's sentence, nothing enqueued`, response.status === expectedStatus && issue?.code === expectedCode && issue?.message === MESSAGE && enqueued === 0, { status: response.status, code: issue?.code ?? null, message: issue?.message ?? null, jobId: payload?.jobId ?? null, enqueued });
    };
    await direct("no jobScope", { documents }, 400, "ERR_JOB_SCOPE_REQUIRED");
    await direct("jobScope null", { documents, jobScope: null }, 400, "ERR_JOB_SCOPE_REQUIRED");
    await direct("jobScope malformed", { documents, jobScope: { jobPoolUploadId: "not-a-pool", poolRoleId: ROLE_ID } }, 400, "ERR_JOB_SCOPE_REQUIRED");
    await direct("jobScope with an extra key", { documents, jobScope: { jobPoolUploadId: uploadId, poolRoleId: ROLE_ID, analysisId: ANALYSIS_ID } }, 400, "ERR_JOB_SCOPE_REQUIRED");
    await direct("pool unknown", { documents, jobScope: { jobPoolUploadId: UNKNOWN_POOL, poolRoleId: ROLE_ID } }, 422, "ERR_JOB_SCOPE_INVALID");
    await direct("pool not ACTIVE", { documents, jobScope: { jobPoolUploadId: draftId, poolRoleId: ROLE_ID } }, 422, "ERR_JOB_SCOPE_INVALID");
    await direct("role not in the pool", { documents, jobScope: { jobPoolUploadId: uploadId, poolRoleId: "role_pink_does_not_exist" } }, 422, "ERR_JOB_SCOPE_INVALID");
    const jobsBeforeValid = await jobCount();
    const valid = await fetch(`${base()}/api/career/analyze`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ documents, jobScope: { jobPoolUploadId: uploadId, poolRoleId: OTHER_ROLE_ID } }) });
    check("G-06", "direct POST with a valid scope is accepted (202) and enqueued once (no worker: no Gemini call)", valid.status === 202 && (await jobCount()) === jobsBeforeValid + 1, { status: valid.status, enqueued: (await jobCount()) - jobsBeforeValid });

    // ---- G-10 one rule for "valid": the frontend's VALID and the backend's acceptance agree on the same stored role ----------
    if (spacedUploadId.length > 0) {
      for (const [label, roleId] of [["role id with inner spaces", SPACED_ROLE_ID], ["role id padded with spaces", PADDED_ROLE_ID]] as const) {
        const page = await open(`/career/demo?focus=FIELD&analysisId=${ANALYSIS_ID}&jobPoolUploadId=${spacedUploadId}&jobScopePoolUploadId=${spacedUploadId}&jobScopeRoleId=${encodeURIComponent(roleId)}`);
        const frontState = await scopeState(page);
        await page.close();
        const jobsBefore = await jobCount();
        const response = await fetch(`${base()}/api/career/analyze`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ documents, jobScope: { jobPoolUploadId: spacedUploadId, poolRoleId: roleId } }) });
        const backend = { status: response.status, code: (await response.json().catch(() => null))?.issues?.[0]?.code ?? null, enqueued: (await jobCount()) - jobsBefore };
        const agree = (frontState === "VALID") === (backend.status === 202);
        check("G-10", `${label} in an ACTIVE, mapped pool: frontend and backend agree on validity`, agree, { roleId, frontend: frontState, backend });
        // The same id chosen by the explicit action at its role: selected verbatim, kept over a reload, sent verbatim.
        const rolePage = await open(`/career/demo?focus=FIELD&analysisId=${ANALYSIS_ID}&jobPoolUploadId=${spacedUploadId}&jobRoleId=${encodeURIComponent(roleId)}`);
        await rolePage.locator('[data-testid="syntx-field"][data-observation-kind="ROLE"]').waitFor({ timeout: 60_000 }).catch(() => {});
        const roleSelect = rolePage.getByTestId("syntx-job-scope-select");
        if ((await roleSelect.count()) === 1) await roleSelect.click();
        await rolePage.locator('[data-testid="job-scope-indicator"]:is([data-job-scope-state="VALID"], [data-job-scope-state="INVALID"])').waitFor({ timeout: 20_000 }).catch(() => {});
        const pickedState = await scopeState(rolePage);
        const pickedRole = new URL(rolePage.url()).searchParams.get("jobScopeRoleId");
        check("G-10", `${label}: the explicit selection at the role sets the stored id verbatim (indicator VALID, URL exact)`, pickedState === "VALID" && pickedRole === roleId, { state: pickedState, urlRoleId: pickedRole });
        await rolePage.reload({ waitUntil: "domcontentloaded" });
        await rolePage.getByTestId("field-focus-strip").waitFor({ timeout: 120_000 });
        const reloadedState = await scopeState(rolePage);
        check("G-10", `${label}: the selection is restored after a reload`, reloadedState === "VALID" && new URL(rolePage.url()).searchParams.get("jobScopeRoleId") === roleId, { state: reloadedState });
        const roleCap = await capabilityReachable(rolePage);
        const roleTrigger = roleCap.reachable ? await analyzeTrigger(rolePage) : null;
        const postsBefore = analyzePosts.length;
        const jobsBeforeRole = await jobCount();
        if (roleTrigger !== null && roleTrigger.present && !roleTrigger.disabled) await rolePage.getByTestId("start-intake-analysis-btn").click();
        for (let attempt = 0; attempt < 240 && (analyzePosts.length === postsBefore || analyzePosts[postsBefore].status === null); attempt += 1) await delay(250);
        const roleSent = analyzePosts.slice(postsBefore);
        const roleScope = (roleSent[0]?.body as any)?.jobScope ?? null;
        check("G-10", `${label}: ANALYZE sends the stored id verbatim and the backend accepts it (202, enqueued once)`, roleSent.length === 1 && roleScope?.jobPoolUploadId === spacedUploadId && roleScope?.poolRoleId === roleId && roleSent[0]?.status === 202 && (await jobCount()) === jobsBeforeRole + 1, { capability: roleCap, requests: roleSent.length, jobScope: roleScope, status: roleSent[0]?.status ?? null, enqueued: (await jobCount()) - jobsBeforeRole });
        await rolePage.close();
      }
    } else check("G-10", "role id with spaces: the pool upload refuses it, so no divergence is reachable", true, `upload status ${spacedUploadStatus}`);

    // ---- G-11 every execution path: the legacy page /career/analyze ----------------------------------------------------
    const legacy = async (label: string, query: string, expected: "NONE" | "INVALID" | "VALID", expectedRole: string) => {
      const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
      page.on("pageerror", (error: unknown) => pageErrors.push(`legacy ${label}: ${String(error)}`));
      page.on("request", (request: any) => {
        if (request.method() === "POST" && request.url().endsWith("/api/career/analyze")) {
          const entry = { body: (() => { try { return JSON.parse(request.postData() ?? "null"); } catch { return request.postData(); } })(), status: null as number | null };
          analyzePosts.push(entry);
          request.response().then((response: any) => { entry.status = response?.status() ?? null; }).catch(() => {});
        }
      });
      await page.goto(`${base()}/career/analyze${query}`, { waitUntil: "domcontentloaded", timeout: 120_000 });
      const shown = page.getByTestId("analyze-job-scope");
      await shown.waitFor({ timeout: 120_000 }).catch(() => {});
      // The page renders NONE first and reads the URL scope in an effect: wait for the settled state the case names.
      if (expected === "NONE") await delay(2_000);
      else await page.locator('[data-testid="analyze-job-scope"]:is([data-job-scope-state="VALID"], [data-job-scope-state="INVALID"])').waitFor({ timeout: 30_000 }).catch(() => {});
      const state = (await shown.count()) > 0 ? await shown.getAttribute("data-job-scope-state") : null;
      await page.getByTestId("doc-content-textarea").fill("PINK job-scope gate probe (legacy page): Software architect with eight years of platform design.").catch(() => {});
      await delay(300);
      const start = page.getByTestId("start-analysis-button");
      const disabled = (await start.count()) === 0 ? true : await start.evaluate((element: HTMLButtonElement) => element.disabled);
      const requiredNode = page.getByTestId("analyze-job-scope-required");
      const message = (await requiredNode.count()) > 0 ? ((await requiredNode.textContent()) ?? "").trim() : null;
      const before = analyzePosts.length;
      const jobsBeforeLegacy = await jobCount();
      if (expected === "VALID") { if (!disabled) await start.click(); } else await start.evaluate((element: HTMLButtonElement) => element.click()).catch(() => {});
      for (let attempt = 0; attempt < (expected === "VALID" ? 240 : 4) && (analyzePosts.length === before || analyzePosts[before].status === null); attempt += 1) await delay(250);
      const sent = analyzePosts.slice(before);
      await page.screenshot({ path: resolve(EVIDENCE_DIR, `G-11-legacy-${expected}.png`) });
      await page.close();
      if (expected === "VALID") {
        const scope = (sent[0]?.body as any)?.jobScope ?? null;
        check("G-11", `legacy page, ${label}: scope shown VALID, start enabled, no blocking sentence`, state === "VALID" && !disabled && message === null, { state, disabled, message });
        check("G-11", `legacy page, ${label}: one request with exactly the URL scope, accepted (202) and enqueued once`, sent.length === 1 && scope !== null && Object.keys(scope).sort().join() === "jobPoolUploadId,poolRoleId" && scope.jobPoolUploadId === uploadId && scope.poolRoleId === expectedRole && sent[0]?.status === 202 && (await jobCount()) === jobsBeforeLegacy + 1, { requests: sent.length, jobScope: scope, status: sent[0]?.status ?? null });
      } else {
        check("G-11", `legacy page, ${label}: scope shown ${expected}, start disabled, the owner's sentence verbatim, no request on a forced click`, state === expected && disabled && message === MESSAGE && sent.length === 0 && (await jobCount()) === jobsBeforeLegacy, { state, disabled, message, requests: sent.length });
      }
    };
    await legacy("no scope in the URL", "", "NONE", "");
    await legacy("role not in the pool", `?jobScopePoolUploadId=${uploadId}&jobScopeRoleId=role_pink_does_not_exist`, "INVALID", "");
    await legacy("pool not ACTIVE (DRAFT)", `?jobScopePoolUploadId=${draftId}&jobScopeRoleId=${ROLE_ID}`, "INVALID", "");
    await legacy("valid scope in the URL", `?jobScopePoolUploadId=${uploadId}&jobScopeRoleId=${ROLE_ID}`, "VALID", ROLE_ID);

    check("G-00", "no page error in any step", pageErrors.length === 0, pageErrors.slice(0, 5));
    const failed = checks.filter((entry) => !entry.ok).map((entry) => `${entry.id} ${entry.name} · ${entry.detail}`);
    expect(failed, `deviations on ${TIP} (every check is in G-report.txt)`).toEqual([]);
  }, 900_000);
});
