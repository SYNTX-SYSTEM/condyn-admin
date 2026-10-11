/**
 * Job Pool workflow e2e: real `next dev` server on a disposable PostgreSQL database with one
 * directly seeded VERIFIED analysis, real HTTP against the job-pool routes, and (when Playwright
 * is resolvable) a real Chromium session driving upload → explicit selection → role matches.
 *
 * Playwright is not a dependency of this repository. Point CONDYN_PLAYWRIGHT_MODULE at a
 * `playwright` package directory to run the browser section; otherwise it is reported as
 * skipped, never as passed.
 */
import { createRequire } from "node:module";
import { once } from "node:events";
import { createServer } from "node:net";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawn, type ChildProcess } from "node:child_process";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { decodeJobPoolMatchPresentation, decodeJobPoolUploadView, describeRanking } from "../../../../lib/career/job-pool/frontend-presentation";
import { fetchJobPoolMatches, listJobPools, readJobPoolUpload, uploadJobPool } from "../../../../lib/career/ui/useJobPool";
import { createJobPoolPostgresWorld, JOB_POOL_E2E_TARGET as T, JOB_POOL_E2E_UPLOADER, type JobPoolWorld } from "../fixtures/job-pool-postgres-world";

const EVIDENCE_DIR = resolve(process.cwd(), "docs/career_analysis/evidence/job-pool");

function resolvePlaywright(): string | null {
  const explicit = process.env.CONDYN_PLAYWRIGHT_MODULE;
  if (explicit !== undefined && explicit.length > 0) return explicit;
  try { return createRequire(resolve(process.cwd(), "package.json")).resolve("playwright"); } catch { return null; }
}
const playwrightModule = resolvePlaywright();

let world: JobPoolWorld;
let server: ChildProcess;
let port: number;
let serverOutput = "";
let uploadedId = "";
let draftUploadId = "";
const base = () => `http://127.0.0.1:${port}`;
const delay = (ms: number) => new Promise<void>(done => setTimeout(done, ms));
const serverFetch: typeof fetch = (input, init) => fetch(typeof input === "string" && input.startsWith("/") ? `${base()}${input}` : input, init);

async function availablePort(): Promise<number> {
  const listener = createServer();
  await new Promise<void>((ok, fail) => { listener.once("error", fail); listener.listen(0, "127.0.0.1", () => ok()); });
  const address = listener.address();
  if (address === null || typeof address === "string") throw new Error("no port");
  await new Promise<void>((ok, fail) => listener.close(error => error ? fail(error) : ok()));
  return address.port;
}

async function waitForReadiness(): Promise<void> {
  for (let attempt = 0; attempt < 160; attempt += 1) {
    try {
      const response = await fetch(`${base()}/api/career/job-pools`);
      if (response.status === 200) { await response.json(); return; }
    } catch { /* not ready */ }
    await delay(500);
  }
  throw new Error(`Job Pool server did not become ready. Output:\n${serverOutput}`);
}

async function stopServer(): Promise<void> {
  if (server === undefined || server.exitCode !== null || server.signalCode !== null) return;
  server.kill("SIGTERM");
  await Promise.race([once(server, "exit"), delay(10_000)]);
  if (server.exitCode === null && server.signalCode === null) { server.kill("SIGKILL"); await once(server, "exit"); }
}

beforeAll(async () => {
  world = await createJobPoolPostgresWorld();
  port = await availablePort();
  // Turbopack rejects a node_modules symlink that points outside the project root (worktrees share one install); webpack does not.
  server = spawn(process.execPath, [resolve(process.cwd(), "node_modules/next/dist/bin/next"), "dev", "--webpack", "-p", String(port), "-H", "127.0.0.1"], {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: world.databaseUrl, NEXT_TELEMETRY_DISABLED: "1" },
    stdio: ["ignore", "pipe", "pipe"]
  });
  server.stdout?.on("data", chunk => { serverOutput += String(chunk); });
  server.stderr?.on("data", chunk => { serverOutput += String(chunk); });
  await waitForReadiness();
}, 240_000);

afterAll(async () => {
  await stopServer();
  if (world) await world.destroy();
}, 60_000);

describe("Job Pool workflow over HTTP against the production routes", () => {
  it("lists no upload on a fresh verified database, persists the sample pool once, and reports an identical re-upload as existing", async () => {
    expect(await listJobPools(serverFetch)).toEqual({ state: "EMPTY" });
    const created = await uploadJobPool(world.samplePoolText, JOB_POOL_E2E_UPLOADER, serverFetch);
    expect(created.state).toBe("CREATED");
    if (created.state !== "CREATED") return;
    uploadedId = created.upload.jobPoolUploadId;
    expect(uploadedId).toMatch(/^JPOOL_/);
    expect(created.upload.poolId).toBe(world.samplePool.pool.id);
    expect(created.upload.roleCount).toBe(world.samplePool.roles.length);
    expect(created.upload.requirementCount).toBe(world.samplePool.requirements.length);
    expect(created.upload.canonicalMapping.roles).toHaveLength(world.samplePool.roles.length);
    // ONE TargetSourceRevision per upload (PINK refinement): every role carries the same TSREV id.
    expect(new Set(created.upload.canonicalMapping.roles.map(role => role.targetSourceRevisionId)).size).toBe(1);
    const again = await uploadJobPool(world.samplePoolText, JOB_POOL_E2E_UPLOADER, serverFetch);
    expect(again.state).toBe("IDENTICAL_EXISTS");
    if (again.state === "IDENTICAL_EXISTS") expect(again.upload.jobPoolUploadId).toBe(uploadedId);
    const listed = await listJobPools(serverFetch);
    expect(listed.state === "AVAILABLE" && listed.jobPools.map(pool => pool.jobPoolUploadId)).toEqual([uploadedId]);
    const raw = await fetch(`${base()}/api/career/job-pools/${uploadedId}`);
    expect(raw.status).toBe(200);
    expect(decodeJobPoolUploadView(await raw.json())).not.toBeNull();
    expect(await readJobPoolUpload("JPOOL_" + "0".repeat(16), serverFetch)).toEqual({ state: "NOT_FOUND", jobPoolUploadId: "JPOOL_" + "0".repeat(16) });
  }, 120_000);

  it("refuses what the contract refuses: invalid JSON, schema violations, broken references", async () => {
    const post = (body: string) => fetch(`${base()}/api/career/job-pools`, { method: "POST", headers: { "content-type": "application/json" }, body });
    const invalid = await post("{");
    expect(invalid.status).toBe(400);
    expect((await invalid.json()).error.code).toBe("ERR_JOB_POOL_JSON_INVALID");
    const schema = await post(JSON.stringify({ pool: { id: "X" } }));
    expect(schema.status).toBe(422);
    const schemaBody = await schema.json();
    expect(schemaBody.error.code).toBe("ERR_JOB_POOL_SCHEMA_INVALID");
    expect(Array.isArray(schemaBody.error.issues) && schemaBody.error.issues.length > 0).toBe(true);
    const broken = JSON.parse(world.samplePoolText) as { roles: Array<{ organization_id: string }> };
    broken.roles[0].organization_id = "ORG_DOES_NOT_EXIST";
    const reference = await post(JSON.stringify(broken));
    expect(reference.status).toBe(422);
    expect((await reference.json()).error.code).toBe("ERR_JOB_POOL_REFERENCE_INVALID");
    const viaClient = await uploadJobPool("{", "", serverFetch);
    expect(viaClient).toEqual({ state: "REJECTED", status: 400, code: "ERR_JOB_POOL_JSON_INVALID", message: expect.any(String), issues: [] });
  }, 60_000);

  it("reads the presentation matching for the exact analysis and the exact upload, ranked as delivered, with evidence quotes and the canonical NOT_EVALUATED state", async () => {
    const result = await fetchJobPoolMatches(uploadedId, world.analysisId, serverFetch);
    expect(result.state).toBe("AVAILABLE");
    if (result.state !== "AVAILABLE") return;
    const matches = result.matches;
    expect(matches.presentation).toEqual({ kind: "DETERMINISTIC_RESONANCE_PRESENTATION", policyVersion: "JOB_POOL_PRESENTATION_MATCHING_V1", authorityState: "NONE", canonicalEvaluation: false, decision: false, weakEvidenceThreshold: expect.any(Number) });
    expect(matches.roleMatches).toHaveLength(world.samplePool.roles.length);
    expect(describeRanking(matches.roleMatches)).toBe("MONOTONE_BY_RESONANCE");
    // The directly seeded analysis has no capability sweep: coverage is NOT_PRODUCED, nothing is covered, scores stand alone.
    expect(matches.capabilitySweep).toEqual({ state: "NOT_PRODUCED", proposalCount: 0, scored: false });
    for (const role of matches.roleMatches) {
      expect(role.sweepOnlyCoverageCount).toBe(0);
      for (const item of [...role.matched, ...role.weakEvidence, ...role.missing]) expect(item.sweepProposal).toBeNull();
    }
    const targetRole = matches.roleMatches.find(role => role.poolRoleId === T.roleId)!;
    expect(targetRole).toBeDefined();
    const hit = targetRole.matched.find(item => item.poolRequirementId === T.requirementId)!;
    expect(hit).toBeDefined();
    expect(hit.matchBasis).toBe("EXACT");
    expect(hit.matchedCapabilityEntityId).toBe(T.capabilityEntityId);
    expect(hit.evidence).toEqual([{ docId: T.docId, quote: T.quote }]);
    // Documented bases of the fixture: React via ALIAS (React.js), Node.js by TOKEN_CONTAINMENT under weak evidence, Automated Testing missing.
    expect(targetRole.matched.find(item => item.poolRequirementId === "req_002")?.matchBasis).toBe("ALIAS");
    expect(targetRole.weakEvidence.find(item => item.poolRequirementId === "req_003")?.matchBasis).toBe("TOKEN_CONTAINMENT");
    expect(targetRole.weakEvidence.find(item => item.poolRequirementId === "req_003")?.reason).toEqual(expect.any(String));
    expect(targetRole.missing.map(item => item.poolRequirementId)).toContain("req_005");
    // Inverse: every requirement of the role appears in exactly one of the three presentation sets.
    for (const requirement of world.samplePool.requirements.filter(item => item.role_id === T.roleId)) {
      const presence = [targetRole.matched, targetRole.weakEvidence, targetRole.missing].filter(set => set.some(item => item.poolRequirementId === requirement.id)).length;
      expect(presence).toBe(1);
    }
    expect(matches.roleMatches[0].poolRoleId).toBe(T.roleId);
    for (const role of matches.roleMatches) {
      expect(role.canonical.capabilityRequirementRelationState).toBe("NOT_EVALUATED");
      expect(role.canonical.reason).toBe("VERIFIED_CAPABILITY_SNAPSHOT_ABSENT");
      expect(role.canonical.targetRequirementRevisionIds).toHaveLength(world.samplePool.requirements.filter(requirement => requirement.role_id === role.poolRoleId).length);
      expect(role.matched.length + role.weakEvidence.length + role.missing.length).toBe(role.canonical.targetRequirementRevisionIds.length);
    }
    const raw = await fetch(`${base()}/api/career/job-pools/${uploadedId}/matches?analysisId=${world.analysisId}`);
    expect(raw.status).toBe(200);
    expect(decodeJobPoolMatchPresentation(await raw.json())).toEqual(matches);
    const absentAnalysis = await fetchJobPoolMatches(uploadedId, "ANL_DOES_NOT_EXIST", serverFetch);
    expect(absentAnalysis.state).toBe("NOT_FOUND");
    const absentPool = await fetchJobPoolMatches("JPOOL_" + "0".repeat(16), world.analysisId, serverFetch);
    expect(absentPool.state).toBe("NOT_FOUND");
  }, 60_000);

  it("persists a DRAFT copy of the pool and refuses matching for it with 409, so an inactive pool is visible as inactive", async () => {
    const draft = JSON.parse(world.samplePoolText) as { pool: { id: string; status: string; name: string } };
    draft.pool.status = "DRAFT";
    draft.pool.name = `${draft.pool.name} (draft copy)`;
    const created = await uploadJobPool(JSON.stringify(draft), JOB_POOL_E2E_UPLOADER, serverFetch);
    expect(created.state).toBe("CREATED");
    if (created.state !== "CREATED") return;
    draftUploadId = created.upload.jobPoolUploadId;
    expect(draftUploadId).not.toBe(uploadedId);
    expect(created.upload.poolStatus).toBe("DRAFT");
    const result = await fetchJobPoolMatches(draftUploadId, world.analysisId, serverFetch);
    expect(result.state).toBe("INACTIVE_POOL");
  }, 60_000);

  it("server-renders the collapsed panel toggle on the field and never a dock without an exact DCTXREV", async () => {
    const html = await (await fetch(`${base()}/career/demo?analysisId=${world.analysisId}`)).text();
    expect(html).toContain('data-testid="job-pool-panel-toggle"');
    expect(html).not.toContain("hr-decision-loop-dock");
    const open = await (await fetch(`${base()}/career/demo?analysisId=${world.analysisId}&jobPoolUploadId=${uploadedId}`)).text();
    expect(open).toContain('data-testid="job-pool-panel"');
    expect(open).toContain(`data-job-pool-upload="${uploadedId}"`);
    expect(open).toContain('data-analysis-source="URL"');
  }, 60_000);
});

describe.skipIf(playwrightModule === null)("Job Pool workflow in a real browser", () => {
  type Browser = { newPage(options: { viewport: { width: number; height: number } }): Promise<Page>; close(): Promise<void> };
  type Locator = { waitFor(options?: { timeout?: number; state?: string }): Promise<void>; count(): Promise<number>; textContent(): Promise<string | null>; getAttribute(name: string): Promise<string | null>; click(): Promise<void>; fill(value: string): Promise<void>; isDisabled(): Promise<boolean>; setInputFiles(files: string | string[]): Promise<void>; first(): Locator };
  type Page = { goto(url: string, options?: { waitUntil?: string; timeout?: number }): Promise<unknown>; url(): string; locator(selector: string): Locator; getByTestId(id: string): Locator; screenshot(options: { path: string; fullPage?: boolean }): Promise<unknown>; on(event: string, handler: (payload: unknown) => void): void; close(): Promise<void> };
  let browser: Browser;
  let pageErrors: string[] = [];

  async function openPage(path: string): Promise<Page> {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    page.on("pageerror", error => pageErrors.push(String(error)));
    await page.goto(`${base()}${path}`, { waitUntil: "domcontentloaded", timeout: 120_000 });
    // First visit: the existing guided onboarding opens over the field (preserved behavior); a human closes it first.
    await page.getByTestId("guided-onboarding-overlay").waitFor({ timeout: 120_000 });
    await page.getByTestId("onboarding-close-btn").click();
    await page.getByTestId("guided-onboarding-overlay").waitFor({ state: "detached", timeout: 30_000 });
    return page;
  }

  beforeAll(async () => {
    const playwright = await import(playwrightModule as string) as { chromium: { launch(options: { headless: boolean }): Promise<Browser> } };
    browser = await playwright.chromium.launch({ headless: true });
    mkdirSync(EVIDENCE_DIR, { recursive: true });
  }, 120_000);

  afterAll(async () => { if (browser) await browser.close(); }, 30_000);

  it("uploads a second pool version through the file chooser, lists it without selecting it, selects it explicitly, and renders ranked role matches with the three layer labels", async () => {
    pageErrors = [];
    const page = await openPage(`/career/demo?analysisId=${world.analysisId}`);
    expect(await page.locator('[data-testid^="hr-decision-loop"]').count()).toBe(0);
    await page.getByTestId("job-pool-panel-toggle").click();
    const panel = page.getByTestId("job-pool-panel");
    await panel.waitFor({ timeout: 30_000 });
    await page.locator('[data-testid="job-pool-list"][data-pool-count="2"]').waitFor({ timeout: 60_000 });
    expect(await panel.getAttribute("data-analysis-source")).toBe("URL");
    expect(await panel.getAttribute("data-selected-pool")).toBe("");
    expect(await panel.getAttribute("data-matches-state")).toBe("IDLE");
    expect(await page.getByTestId("job-pool-upload-btn").isDisabled()).toBe(true);
    await page.screenshot({ path: resolve(EVIDENCE_DIR, "01-panel-open-two-uploads-none-selected.png") });

    // A new pool version is a new upload with new canonical entities (B-JP-CONTINUITY); the browser sends the file bytes.
    const versionTwo = JSON.parse(world.samplePoolText) as { pool: { version: number } };
    versionTwo.pool.version = world.samplePool.pool.version + 1;
    const versionTwoPath = join(mkdtempSync(join(tmpdir(), "job-pool-e2e-")), "job-pool.sample.v2.json");
    writeFileSync(versionTwoPath, JSON.stringify(versionTwo, null, 2));
    await page.getByTestId("job-pool-file-input").setInputFiles(versionTwoPath);
    await page.getByTestId("job-pool-actor-input").fill("JOB_POOL_BROWSER_UPLOADER");
    await page.locator('[data-testid="job-pool-upload-btn"]:not([disabled])').waitFor({ timeout: 10_000 });
    await page.getByTestId("job-pool-upload-btn").click();
    const result = page.locator('[data-testid="job-pool-upload-result"][data-upload-outcome="CREATED"]');
    await result.waitFor({ timeout: 60_000 });
    const resultText = (await result.textContent()) ?? "";
    const newId = (await result.getAttribute("data-upload-id")) ?? "";
    expect(newId).toMatch(/^JPOOL_[0-9A-F]{32}$/);
    expect(resultText).toContain(newId);
    expect([uploadedId, draftUploadId]).not.toContain(newId);
    expect(resultText).toContain("UPLOADED != SELECTED");
    await page.locator('[data-testid="job-pool-list"][data-pool-count="3"]').waitFor({ timeout: 60_000 });
    expect(await panel.getAttribute("data-selected-pool")).toBe("");
    expect(await panel.getAttribute("data-matches-state")).toBe("IDLE");
    await page.screenshot({ path: resolve(EVIDENCE_DIR, "02-upload-persisted-not-selected.png") });

    await page.getByTestId(`job-pool-select-${newId}`).click();
    await page.locator('[data-testid="job-pool-matches"][data-matches-state="AVAILABLE"]').waitFor({ timeout: 60_000 });
    expect(new URL(page.url()).searchParams.get("jobPoolUploadId")).toBe(newId);
    expect(new URL(page.url()).searchParams.get("analysisId")).toBe(world.analysisId);
    expect(await page.getByTestId(`job-pool-item-${newId}`).getAttribute("data-selected")).toBe("true");
    expect(await page.getByTestId(`job-pool-item-${uploadedId}`).getAttribute("data-selected")).toBe("false");
    await page.locator('[data-testid="job-pool-canonical-mapping"][data-mapping-state="MAPPED"][data-proposal-state="PROPOSAL_ONLY"][data-authority-state="NONE"]').waitFor({ timeout: 30_000 });
    for (const label of ["DETERMINISTIC_PRESENTATION", "NOT_A_CANONICAL_EVALUATION", "NOT_A_DECISION"]) expect(await page.getByTestId(`job-pool-label-${label}`).count()).toBe(1);
    const labels = (await page.getByTestId("job-pool-presentation-labels").textContent()) ?? "";
    expect(labels).toContain("DETERMINISTIC PRESENTATION");
    expect(labels).toContain("NOT A CANONICAL EVALUATION");
    expect(labels).toContain("NOT A DECISION");
    expect(await page.getByTestId("job-pool-ranking").getAttribute("data-ranking")).toBe("MONOTONE_BY_RESONANCE");
    expect(await page.getByTestId("job-pool-capability-sweep").getAttribute("data-sweep-state")).toBe("NOT_PRODUCED");
    expect(await page.getByTestId("job-pool-capability-sweep").getAttribute("data-scored")).toBe("false");
    expect(await page.getByTestId("job-pool-capability-sweep").textContent()).toContain("UNSCORED");
    expect(await page.locator('[data-testid$="-sweep"][data-sweep-basis]').count()).toBe(0);
    expect(await page.getByTestId("job-pool-role-list").getAttribute("data-role-count")).toBe(String(world.samplePool.roles.length));
    const first = page.getByTestId(`job-pool-role-${T.roleId}`);
    expect(await first.getAttribute("data-rank")).toBe("1");
    const hit = page.getByTestId(`job-pool-role-${T.roleId}-matched-${T.requirementId}`);
    expect(await hit.getAttribute("data-match-basis")).toBe("EXACT");
    expect(await hit.textContent()).toContain(T.quote);
    expect(await page.getByTestId(`job-pool-role-${T.roleId}-matched-req_002`).getAttribute("data-match-basis")).toBe("ALIAS");
    expect(await page.getByTestId(`job-pool-role-${T.roleId}-weak-req_003`).getAttribute("data-match-basis")).toBe("TOKEN_CONTAINMENT");
    expect(await page.getByTestId(`job-pool-role-${T.roleId}-missing-req_005`).count()).toBe(1);
    const canonical = page.getByTestId(`job-pool-role-${T.roleId}-canonical`);
    expect(await canonical.getAttribute("data-relation-state")).toBe("NOT_EVALUATED");
    expect(await canonical.getAttribute("data-relation-reason")).toBe("VERIFIED_CAPABILITY_SNAPSHOT_ABSENT");
    expect(await canonical.textContent()).toContain("TRPREV");
    expect(await page.locator('[data-testid^="job-pool-trqrev-"]').count()).toBe(world.samplePool.requirements.length);
    expect(await page.getByTestId("job-pool-non-claims").textContent()).toContain("COVERED != SCORED");
    // Preservation: planetarium geometry and the absence of any dock without an exact DCTXREV.
    for (const stage of ["01", "02", "03", "04", "05", "06"]) expect(await page.getByTestId(`focus-transition-stage-shell-${stage}`).count()).toBe(1);
    expect(await page.getByTestId("semantic-zoom-telemetry").count()).toBe(1);
    expect(await page.locator('[data-testid^="hr-decision-loop"]').count()).toBe(0);
    await page.screenshot({ path: resolve(EVIDENCE_DIR, "03-selected-upload-ranked-role-matches.png"), fullPage: false });
    expect(pageErrors).toEqual([]);
    await page.close();
  }, 300_000);

  it("reopens the exact selection from the URL and shows a DRAFT pool as inactive instead of matching it", async () => {
    pageErrors = [];
    const page = await openPage(`/career/demo?analysisId=${world.analysisId}&jobPoolUploadId=${uploadedId}`);
    const panel = page.getByTestId("job-pool-panel");
    await panel.waitFor({ timeout: 30_000 });
    await page.locator('[data-testid="job-pool-matches"][data-matches-state="AVAILABLE"]').waitFor({ timeout: 60_000 });
    expect(await panel.getAttribute("data-selection-kind")).toBe("LISTED");
    expect(await panel.getAttribute("data-selected-pool")).toBe(uploadedId);
    await page.getByTestId(`job-pool-select-${draftUploadId}`).click();
    await page.locator('[data-testid="job-pool-matches"][data-matches-state="INACTIVE_POOL"]').waitFor({ timeout: 60_000 });
    expect(await page.getByTestId("job-pool-matches-inactive").textContent()).toContain("POOL IS NOT ACTIVE");
    expect(await page.getByTestId(`job-pool-item-${draftUploadId}`).getAttribute("data-pool-status")).toBe("DRAFT");
    expect(new URL(page.url()).searchParams.get("jobPoolUploadId")).toBe(draftUploadId);
    await page.screenshot({ path: resolve(EVIDENCE_DIR, "04-draft-pool-inactive-no-matching.png") });
    expect(pageErrors).toEqual([]);
    await page.close();
  }, 240_000);

  it("opens the Job Field: the pool as the central field with roles by pool resonance, the nearest presented role, exact role navigation with pending kinds, and the planetarium receded but preserved", async () => {
    pageErrors = [];
    const page = await openPage(`/career/demo?analysisId=${world.analysisId}&jobPoolUploadId=${uploadedId}`);
    expect(await page.getByTestId("semantic-career-intelligence-field").getAttribute("data-field-focus")).toBe("CAPABILITY");
    expect(await page.getByTestId("field-focus-job-btn").getAttribute("data-field-focus-active")).toBe("false");
    await page.getByTestId("field-focus-job-btn").click();
    const field = page.locator('[data-testid="job-field"][data-field-state="AVAILABLE"]');
    await field.waitFor({ timeout: 120_000 });
    expect(await page.getByTestId("semantic-career-intelligence-field").getAttribute("data-field-focus")).toBe("JOB");
    expect(new URL(page.url()).searchParams.get("focus")).toBe("JOB");
    expect(await field.getAttribute("data-role-count")).toBe(String(world.samplePool.roles.length));
    expect(await field.getAttribute("data-ranking")).toBe("MONOTONE_BY_RESONANCE");
    expect(await field.getAttribute("data-nearest-role")).toBe(T.roleId);
    expect(await field.getAttribute("data-selected-role")).toBe("");
    expect(await field.getAttribute("data-sweep-state")).toBe("NOT_PRODUCED");
    expect(await page.getByTestId("job-field-core").getAttribute("data-candidate-capability-count")).toBe("6");
    expect(await page.locator('[data-testid^="job-field-organization-"]').count()).toBe(world.samplePool.organizations.length);
    const nearest = page.getByTestId(`job-field-role-${T.roleId}`);
    expect(await nearest.getAttribute("data-delivered-rank")).toBe("1");
    expect(await nearest.getAttribute("data-nearest")).toBe("true");
    expect(await nearest.getAttribute("data-scored-match")).toBe("true");
    // Resonance and distance are the delivered value and its complement, never re-scored.
    const delivered = await fetchJobPoolMatches(uploadedId, world.analysisId, serverFetch);
    expect(delivered.state).toBe("AVAILABLE");
    if (delivered.state !== "AVAILABLE") return;
    for (const role of delivered.matches.roleMatches) {
      const node = page.getByTestId(`job-field-role-${role.poolRoleId}`);
      expect(await node.getAttribute("data-resonance-score")).toBe(String(role.resonanceScore));
      expect(Number(await node.getAttribute("data-distance"))).toBeCloseTo(1 - role.resonanceScore, 10);
      const counts = ["data-matched", "data-unresolved", "data-covered-unscored", "data-no-evidence"];
      const sum = (await Promise.all(counts.map(name => node.getAttribute(name)))).reduce((total, value) => total + Number(value), 0);
      expect(sum).toBe(role.canonical.targetRequirementRevisionIds.length);
      expect(await node.getAttribute("data-scored-match")).toBe(role.resonanceScore > 0 && role.matched.length > 0 ? "true" : "false");
    }
    expect(await page.locator('[data-testid^="job-field-role-"][data-scored-match="false"]').count()).toBeGreaterThan(0);
    expect(await page.getByTestId("job-field-nearest").getAttribute("data-role-id")).toBe(T.roleId);
    expect(await page.getByTestId("job-field-nearest").textContent()).toContain("not a role relation (RRL) · not a recommendation (RCP) · not a decision");
    expect(await page.getByTestId("job-field-legend").textContent()).toContain("POOL RESONANCE (PRESENTATION)");
    expect(await page.getByTestId("job-field-legend").textContent()).toContain("absence of evidence is not absence of capability");
    expect(await page.getByTestId("job-field-non-claims").textContent()).toContain("NEAREST != CHOSEN");
    const fieldText = (await page.getByTestId("job-field").textContent()) ?? "";
    expect(fieldText).not.toMatch(/\b(RRL|TSN|EIS|RCP|DCTXREV|DCR|DREV)_[0-9A-Z]/);
    expect(fieldText).not.toContain("verified capability");
    // The planetarium recedes but stays rendered; no dock without an exact DCTXREV.
    for (const stage of ["01", "02", "03", "04", "05", "06"]) expect(await page.getByTestId(`focus-transition-stage-shell-${stage}`).count()).toBe(1);
    expect(await page.locator('[data-testid^="hr-decision-loop"]').count()).toBe(0);
    await page.screenshot({ path: resolve(EVIDENCE_DIR, "17-job-field-overview-nearest-presented-role.png") });

    await page.getByTestId(`job-field-role-${T.roleId}`).click();
    await page.locator(`[data-testid="job-field-role-detail"][data-role-id="${T.roleId}"]`).waitFor({ timeout: 30_000 });
    expect(new URL(page.url()).searchParams.get("jobRoleId")).toBe(T.roleId);
    expect(await field.getAttribute("data-selected-role")).toBe(T.roleId);
    const hit = page.getByTestId(`job-field-requirement-${T.requirementId}`);
    expect(await hit.getAttribute("data-state")).toBe("MATCHED");
    expect(await hit.getAttribute("data-provenance")).toBe("ANALYSIS_CAPABILITY");
    expect(await hit.getAttribute("data-basis")).toBe("EXACT");
    expect(await hit.textContent()).toContain(T.quote);
    expect(await page.getByTestId(`job-field-requirement-req_003`).getAttribute("data-state")).toBe("UNRESOLVED");
    expect(await page.getByTestId(`job-field-requirement-req_005`).getAttribute("data-state")).toBe("NO_EVIDENCE_DELIVERED");
    expect(await page.getByTestId(`job-field-requirement-req_005`).getAttribute("data-provenance")).toBe("NONE");
    expect(await page.getByTestId("job-field-pending").getAttribute("data-role-id")).toBe(T.roleId);
    expect(await page.getByTestId("job-field-pending-UNPROVEN_CANONICAL").getAttribute("data-count")).toBe("5");
    expect(await page.getByTestId("job-field-pending-UNRESOLVED_EVIDENCE").getAttribute("data-ids")).toBe("req_003");
    expect(await page.getByTestId("job-field-pending-UNSCORED_COVERAGE").getAttribute("data-count")).toBe("0");
    expect(await page.getByTestId("job-field-pending-NO_EVIDENCE_DELIVERED").getAttribute("data-ids")).toBe("req_005");
    expect(await page.getByTestId("job-field-pending-reason").textContent()).toContain("VERIFIED_CAPABILITY_SNAPSHOT_ABSENT");
    await page.screenshot({ path: resolve(EVIDENCE_DIR, "18-job-field-role-pending.png") });

    await page.getByTestId("job-field-role-back").click();
    await page.locator('[data-testid="job-field"][data-selected-role=""]').waitFor({ timeout: 10_000 });
    expect(new URL(page.url()).searchParams.get("jobRoleId")).toBeNull();
    await page.getByTestId("job-field-exit-btn").click();
    await page.locator('[data-testid="semantic-career-intelligence-field"][data-field-focus="CAPABILITY"]').waitFor({ timeout: 10_000 });
    expect(await page.getByTestId("job-field").count()).toBe(0);
    expect(new URL(page.url()).searchParams.get("focus")).toBeNull();
    expect(await page.getByTestId("semantic-zoom-telemetry").count()).toBe(1);
    expect(pageErrors).toEqual([]);
    await page.close();
  }, 300_000);

  it("reopens the Job Field from the URL with an exact role, names a stale role id, and shows the pool selection when no pool is selected", async () => {
    pageErrors = [];
    const page = await openPage(`/career/demo?focus=JOB&analysisId=${world.analysisId}&jobPoolUploadId=${uploadedId}&jobRoleId=${T.roleId}`);
    await page.locator(`[data-testid="job-field-role-detail"][data-role-id="${T.roleId}"]`).waitFor({ timeout: 120_000 });
    expect(await page.getByTestId("semantic-career-intelligence-field").getAttribute("data-field-focus")).toBe("JOB");
    await page.close();
    const stale = await openPage(`/career/demo?focus=JOB&analysisId=${world.analysisId}&jobPoolUploadId=${uploadedId}&jobRoleId=role_stale`);
    await stale.getByTestId("job-field-role-not-delivered").waitFor({ timeout: 120_000 });
    expect(await stale.getByTestId("job-field").getAttribute("data-selected-role")).toBe("");
    await stale.close();
    const noPool = await openPage(`/career/demo?focus=JOB&analysisId=${world.analysisId}`);
    await noPool.locator('[data-testid="job-field"][data-field-state="NO_POOL"]').waitFor({ timeout: 120_000 });
    await noPool.getByTestId(`job-field-select-pool-${uploadedId}`).waitFor({ timeout: 60_000 });
    await noPool.getByTestId(`job-field-select-pool-${uploadedId}`).click();
    await noPool.locator('[data-testid="job-field"][data-field-state="AVAILABLE"]').waitFor({ timeout: 120_000 });
    expect(new URL(noPool.url()).searchParams.get("jobPoolUploadId")).toBe(uploadedId);
    await noPool.screenshot({ path: resolve(EVIDENCE_DIR, "19-job-field-selected-from-field.png") });
    expect(pageErrors).toEqual([]);
    await noPool.close();
  }, 300_000);

  it("names a stale selection that is not among the persisted uploads and leaves the field without a dock", async () => {
    pageErrors = [];
    const page = await openPage(`/career/demo?jobPoolUploadId=JPOOL_STALE_SELECTION`);
    await page.locator('[data-testid="job-pool-panel"][data-pools-state="AVAILABLE"]').waitFor({ timeout: 60_000 });
    expect(await page.getByTestId("job-pool-selection-not-listed").count()).toBe(1);
    expect(await page.getByTestId("job-pool-analysis-none").count()).toBe(1);
    expect(await page.getByTestId("job-pool-panel").getAttribute("data-matches-state")).toBe("IDLE");
    expect(await page.locator('[data-testid^="hr-decision-loop"]').count()).toBe(0);
    await page.screenshot({ path: resolve(EVIDENCE_DIR, "05-stale-selection-named-no-analysis.png") });
    expect(pageErrors).toEqual([]);
    await page.close();
  }, 240_000);
});
