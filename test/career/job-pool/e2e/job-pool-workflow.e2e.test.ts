/**
 * Job Pool workflow e2e: real `next dev` server on a disposable PostgreSQL database with one
 * directly seeded VERIFIED analysis, real HTTP against the job-pool routes, and (when Playwright
 * is resolvable) a real Chromium session driving the SYNTX field: upload → explicit selection →
 * FIELD → ORGANIZATION → ROLE → REQUIREMENT → EVIDENCE → RETURN.
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
import { decodeAnalysisSources } from "../../../../lib/career/job-pool/analysis-sources";
import { createJobPoolPostgresWorld, JOB_POOL_E2E_SOURCE, JOB_POOL_E2E_TARGET as T, JOB_POOL_E2E_UPLOADER, type JobPoolWorld } from "../fixtures/job-pool-postgres-world";

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

  it("serves the analysis sources the SYNTX aperture may join: the seeded document title, the capability evidence location, no projection", async () => {
    const response = await fetch(`${base()}/api/career/analyses/${world.analysisId}`);
    const bodyText = await response.text();
    expect(response.status, bodyText).toBe(200);
    const sources = decodeAnalysisSources(world.analysisId, JSON.parse(bodyText));
    expect(sources.documents).toEqual([{ docId: JOB_POOL_E2E_SOURCE.docId, title: JOB_POOL_E2E_SOURCE.title }]);
    expect(sources.capabilityEvidence.find(item => item.capabilityEntityId === T.capabilityEntityId && item.quote === T.quote)).toMatchObject({ docId: T.docId, location: "page 1" });
    expect(sources.proposalEvidence).toEqual([]);
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

  it("server-renders the field-state strip on the capability field and the SYNTX field for an exact upload, never a dock without an exact DCTXREV", async () => {
    const html = await (await fetch(`${base()}/career/demo?analysisId=${world.analysisId}`)).text();
    expect(html).toContain('data-testid="job-pool-panel-toggle"');
    expect(html).not.toContain('data-testid="syntx-field"');
    expect(html).not.toContain("hr-decision-loop-dock");
    const open = await (await fetch(`${base()}/career/demo?analysisId=${world.analysisId}&jobPoolUploadId=${uploadedId}`)).text();
    expect(open).toMatch(/data-testid="syntx-field"[^>]*data-field-grammar="SYNTX_FIELD_V1"/);
    expect(open).toContain(`data-job-pool-upload="${uploadedId}"`);
    expect(open).toContain('data-analysis-source="URL"');
    expect(open).toContain('data-field-focus="FIELD"');
  }, 60_000);
});

describe.skipIf(playwrightModule === null)("SYNTX field in a real browser: FIELD → ORGANIZATION → ROLE → REQUIREMENT → EVIDENCE → RETURN", () => {
  type Browser = { newPage(options: { viewport: { width: number; height: number }; reducedMotion?: "reduce" | "no-preference" }): Promise<Page>; close(): Promise<void> };
  type Locator = { waitFor(options?: { timeout?: number; state?: string }): Promise<void>; count(): Promise<number>; textContent(): Promise<string | null>; getAttribute(name: string): Promise<string | null>; click(options?: { position?: { x: number; y: number } }): Promise<void>; fill(value: string): Promise<void>; isDisabled(): Promise<boolean>; setInputFiles(files: string | string[]): Promise<void>; first(): Locator; hover(): Promise<void>; isVisible(): Promise<boolean>; focus(): Promise<void>; evaluate<T, A = undefined>(fn: (element: Element, arg: A) => T, arg?: A): Promise<T> };
  type Page = { goto(url: string, options?: { waitUntil?: string; timeout?: number }): Promise<unknown>; reload(options?: { waitUntil?: string }): Promise<unknown>; url(): string; locator(selector: string): Locator; getByTestId(id: string): Locator; screenshot(options: { path: string; fullPage?: boolean }): Promise<unknown>; waitForTimeout(ms: number): Promise<void>; keyboard: { press(key: string): Promise<void> }; mouse: { click(x: number, y: number): Promise<void> }; on(event: string, handler: (payload: unknown) => void): void; close(): Promise<void> };
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
  /** The camera recenters with a .78 s transition and the entrance may idle at time 0 in headless Chromium: read a frame only once no animation runs (PINK J-12). */
  async function settled(page: Page, selector = '[data-testid="syntx-field"]'): Promise<void> {
    const deadline = Date.now() + 10_000;
    while (Date.now() < deadline) {
      // Ambient loops of the living field (infinite iterations: sxOrbit, sxBreathe, sxSuspend) never settle; only finite transitions are awaited.
      const running = await page.locator(selector).first().evaluate(element => element.getAnimations({ subtree: true }).filter(animation => animation.playState === "running" && !(animation as CSSAnimation).animationName?.startsWith("sxSuspend") && animation.effect?.getTiming().iterations !== Infinity).length);
      if (running === 0) break;
      await page.waitForTimeout(120);
    }
    await page.waitForTimeout(200);
  }
  const params = (page: Page) => new URL(page.url()).searchParams;
  /** SVG labels wrap into tspans: compare names without whitespace. */
  const squash = (text: string | null) => (text ?? "").replace(/\s+/g, "");
  /** A region is clicked on its own body (bottom of the circle, where no contained role sits); a ring on its stroke (top), never at the bounding-box centre. */
  const bottomOf = (locator: Locator) => locator.evaluate(element => { const box = element.getBoundingClientRect(); return { x: box.width / 2, y: box.height - 6 }; });
  const topOf = (locator: Locator) => locator.evaluate(element => { const box = element.getBoundingClientRect(); return { x: box.width / 2, y: 5 }; });
  /** A point on a trace's visible path in viewport coordinates (the field's levels are unscaled SVG in screen space: the path's screen CTM). */
  const alongTrace = (locator: Locator, fraction: number) => locator.evaluate((element, fraction) => {
    const path = element.querySelector("path:not([data-sx-hit])") as SVGPathElement;
    const point = path.getPointAtLength(path.getTotalLength() * fraction);
    const screen = new DOMPoint(point.x, point.y).matrixTransform(path.getScreenCTM() as DOMMatrix);
    return { x: screen.x, y: screen.y };
  }, fraction);
  /**
   * A satellite of a cosmos moves on the shared orbital clock, so a pointer acts on its current centre — and only where the satellite itself owns
   * the pointer there (elementFromPoint), which is stronger than an actionability wait (a moving target is never "stable" for Playwright).
   */
  const clickCentre = async (page: Page, locator: Locator) => {
    const point = await locator.evaluate(element => { const box = element.getBoundingClientRect(); const x = box.left + box.width / 2; const y = box.top + box.height / 2; const hit = element.ownerDocument.elementFromPoint(x, y); return { x, y, owned: hit !== null && element.contains(hit) }; });
    expect(point.owned, "the satellite owns the pointer at its centre").toBe(true);
    await page.mouse.click(point.x, point.y);
  };
  /** Perceptual closure checks over the rendered levels (F-SX-2 pointer ownership, O-SX-2 title clearance, O-SX-4 reach), in screen space. */
  const ecologyGeometry = (page: Page) => page.getByTestId("syntx-field").evaluate(root => {
    const roleId = (root.querySelector('[data-testid="syntx-ecology"]') as HTMLElement).getAttribute("data-role-id");
    const roleCentre = root.querySelector(`[data-testid="syntx-role-${roleId}"][data-manifestation-form="centre"]`) as HTMLElement;
    const roleLabel = (Array.from(roleCentre.querySelectorAll("span")).find(span => span.textContent !== null && span.textContent.trim().length > 0 && getComputedStyle(span).textTransform === "uppercase") as HTMLElement).getBoundingClientRect();
    const stage = (root.querySelector('[data-testid="syntx-stage"]') as HTMLElement).getBoundingClientRect();
    const traces = Array.from(root.querySelectorAll('[data-testid^="syntx-trace-"]')).map(trace => {
      const path = trace.querySelector("path:not([data-sx-hit])") as SVGPathElement;
      const length = path.getTotalLength();
      const ctm = path.getScreenCTM() as DOMMatrix;
      const samples = Array.from({ length: 15 }, (_, index) => { const p = path.getPointAtLength((length * (index + 1)) / 16); return new DOMPoint(p.x, p.y).matrixTransform(ctm); });
      const crossesRoleLabel = samples.some(point => point.x >= roleLabel.left && point.x <= roleLabel.right && point.y >= roleLabel.top && point.y <= roleLabel.bottom);
      const owned = samples.filter(point => { const hit = document.elementFromPoint(point.x, point.y); return hit !== null && trace.contains(hit); }).length;
      return { id: trace.getAttribute("data-sign-id"), state: trace.getAttribute("data-sign-state"), bow: trace.getAttribute("data-trace-bow"), d: path.getAttribute("d"), crossesRoleLabel, owned, hitFirst: trace.firstElementChild?.hasAttribute("data-sx-hit") === true, level: trace.closest("[data-sx-level]")?.getAttribute("data-sx-level") ?? null };
    });
    // A source's extent is its body and its card (its own box is a positioning origin).
    const sources = Array.from(root.querySelectorAll('[data-testid^="syntx-source-"]')).map(source => {
      const rects = [source, ...Array.from(source.querySelectorAll("*"))].map(element => element.getBoundingClientRect()).filter(rect => rect.width > 0 && rect.height > 0);
      const rect = { left: Math.min(...rects.map(item => item.left)), right: Math.max(...rects.map(item => item.right)), top: Math.min(...rects.map(item => item.top)), bottom: Math.max(...rects.map(item => item.bottom)) };
      return { docId: source.getAttribute("data-proof-doc-id"), state: source.getAttribute("data-sign-state"), inside: rects.length > 0 && rect.left >= stage.left && rect.right <= stage.right && rect.top >= stage.top && rect.bottom <= stage.bottom };
    });
    return { traces, sources };
  });
  const field = (page: Page) => page.getByTestId("syntx-field");

  beforeAll(async () => {
    const playwright = await import(playwrightModule as string) as { chromium: { launch(options: { headless: boolean }): Promise<Browser> } };
    browser = await playwright.chromium.launch({ headless: true });
    mkdirSync(EVIDENCE_DIR, { recursive: true });
  }, 120_000);

  afterAll(async () => { if (browser) await browser.close(); }, 30_000);

  it("enters the field, uploads a second pool version through the edge intake, lists it without selecting it, selects it explicitly, and walks FIELD → ORGANIZATION → ROLE → REQUIREMENT → EVIDENCE → RETURN", async () => {
    pageErrors = [];
    const page = await openPage(`/career/demo?analysisId=${world.analysisId}`);
    expect(await page.locator('[data-testid^="hr-decision-loop"]').count()).toBe(0);
    expect(await page.getByTestId("semantic-career-intelligence-field").getAttribute("data-field-focus")).toBe("CAPABILITY");
    expect(await page.getByTestId("field-focus-job-btn").count()).toBe(0);
    await page.getByTestId("job-pool-panel-toggle").click();
    // Entering the field is a change of field state: the planetarium recedes, the field opens, the URL names the focus.
    await page.locator('[data-testid="semantic-career-intelligence-field"][data-field-focus="FIELD"]').waitFor({ timeout: 30_000 });
    expect(params(page).get("focus")).toBe("FIELD");
    await field(page).waitFor({ timeout: 30_000 });
    expect(await field(page).getAttribute("data-field-grammar")).toBe("SYNTX_FIELD_V1");
    expect(await field(page).getAttribute("data-observation-kind")).toBe("FIELD");
    expect(await field(page).getAttribute("data-field-state")).toBe("NO_POOL");
    expect(await page.getByTestId("job-pool-panel-toggle").getAttribute("data-field-focus-active")).toBe("true");
    // Nothing at the field: the pools aperture is the contextual action; the intake opens only on explicit action.
    await page.locator('[data-testid="job-pool-list"][data-pool-count="2"]').waitFor({ timeout: 60_000 });
    expect(await field(page).getAttribute("data-pools-visible")).toBe("true");
    expect(await page.getByTestId("job-pool-upload").isVisible()).toBe(false);
    expect(await field(page).getAttribute("data-selected-pool")).toBe("");
    expect(await field(page).getAttribute("data-matches-state")).toBe("IDLE");
    await page.getByTestId("job-pool-intake-toggle").click();
    await page.getByTestId("job-pool-upload").waitFor({ state: "visible", timeout: 10_000 });
    expect(await page.getByTestId("job-pool-upload-btn").isDisabled()).toBe(true);
    await settled(page);
    await page.screenshot({ path: resolve(EVIDENCE_DIR, "21-syntx-field-no-pool-edge-apertures.png") });

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
    const newId = (await result.getAttribute("data-upload-id")) ?? "";
    expect(newId).toMatch(/^JPOOL_[0-9A-F]{32}$/);
    expect((await result.textContent()) ?? "").toContain("UPLOADED != SELECTED");
    expect([uploadedId, draftUploadId]).not.toContain(newId);
    await page.locator('[data-testid="job-pool-list"][data-pool-count="3"]').waitFor({ timeout: 60_000 });
    expect(await field(page).getAttribute("data-selected-pool")).toBe("");
    expect(await field(page).getAttribute("data-matches-state")).toBe("IDLE");
    await page.getByTestId("job-pool-intake-toggle").click();
    await page.getByTestId("job-pool-upload").waitFor({ state: "hidden", timeout: 10_000 });

    // FIELD: explicit selection; the pool becomes the total field — organizations as named regions, roles inside them, no score anywhere.
    await page.getByTestId(`job-pool-select-${newId}`).click();
    await page.locator('[data-testid="syntx-field"][data-field-state="AVAILABLE"][data-matching-delivered="true"]').waitFor({ timeout: 60_000 });
    expect(params(page).get("jobPoolUploadId")).toBe(newId);
    expect(params(page).get("analysisId")).toBe(world.analysisId);
    expect(await field(page).getAttribute("data-observation-kind")).toBe("FIELD");
    expect(await field(page).getAttribute("data-observation-id")).toBe(newId);
    expect(await field(page).getAttribute("data-pools-visible")).toBe("false");
    expect(await field(page).getAttribute("data-organization-count")).toBe(String(world.samplePool.organizations.length));
    expect(await field(page).getAttribute("data-role-count")).toBe(String(world.samplePool.roles.length));
    expect(await page.locator('[data-testid^="syntx-organization-"]').count()).toBe(world.samplePool.organizations.length);
    expect(await page.locator('[data-testid^="syntx-role-"]').count()).toBe(world.samplePool.roles.length);
    for (const organization of world.samplePool.organizations) {
      const region = page.getByTestId(`syntx-organization-${organization.id}`);
      expect(await region.getAttribute("data-role-count")).toBe(String(world.samplePool.roles.filter(role => role.organization_id === organization.id).length));
      expect(await region.getAttribute("data-sign-relation")).toBe("contains");
      expect(await region.getAttribute("data-proof-organization-id")).toBe(organization.id);
      expect(squash(await region.textContent())).toContain(squash(organization.name));
    }
    for (const role of world.samplePool.roles) {
      const carrier = page.getByTestId(`syntx-role-${role.id}`);
      expect(await carrier.getAttribute("data-proof-organization-id")).toBe(role.organization_id);
      expect(await carrier.getAttribute("data-requirement-count")).toBe(String(world.samplePool.requirements.filter(requirement => requirement.role_id === role.id).length));
      expect(await carrier.getAttribute("data-sign-manifestation")).toBe("carrier");
      expect(squash(await carrier.textContent())).toContain(squash(role.title));
      // Containment as geometry (screen space): the role is a moon inside its organization's region (the orbit of its moons).
      const inside = await carrier.evaluate(element => {
        const organizationId = element.getAttribute("data-proof-organization-id");
        const region = element.ownerDocument.querySelector(`[data-testid="syntx-organization-${organizationId}"] circle`) as SVGCircleElement;
        const body = element.querySelector("circle") as SVGCircleElement;
        const centre = (circle: SVGCircleElement) => { const box = circle.getBoundingClientRect(); return { x: box.left + box.width / 2, y: box.top + box.height / 2, r: box.width / 2 }; };
        const r = centre(region), b = centre(body);
        return Math.hypot(b.x - r.x, b.y - r.y) < r.r;
      });
      expect(inside).toBe(true);
      // Organizations first: in the planetarium a role is a moon — a sign with its proofs, not yet selectable, not in the tab order.
      expect(await carrier.getAttribute("data-manifestation-form")).toBe("moon");
      expect(await carrier.getAttribute("data-sign-interaction")).toBe("none");
      expect(await carrier.getAttribute("tabindex")).toBe("-1");
    }
    expect(await page.locator('[data-resonance-score]').count()).toBe(0);
    expect(await page.getByTestId("syntx-canvas").textContent()).not.toMatch(/\d+(\.\d+)?%/);
    expect(await page.getByTestId("syntx-canvas").getAttribute("data-camera-scale")).toBe("1");
    expect(await page.getByTestId("syntx-canvas").getAttribute("data-depth")).toBe("0");
    expect(await page.getByTestId("syntx-ecology").count()).toBe(0);
    expect((await page.getByTestId("syntx-summary").textContent()) ?? "").toContain(`${world.samplePool.organizations.length} organizations containing ${world.samplePool.roles.length} roles`);
    // No permanent panel: the boundary (labels, canonical mapping state, sweep state) is an edge aperture opened on demand.
    expect(await page.getByTestId("job-pool-matches").isVisible()).toBe(false);
    await page.getByTestId("syntx-boundary-toggle").click();
    await page.getByTestId("job-pool-matches").waitFor({ state: "visible", timeout: 10_000 });
    for (const label of ["DETERMINISTIC_PRESENTATION", "NOT_A_CANONICAL_EVALUATION", "NOT_A_DECISION"]) expect(await page.getByTestId(`job-pool-label-${label}`).count()).toBe(1);
    expect(await page.getByTestId("job-pool-ranking").getAttribute("data-ranking")).toBe("MONOTONE_BY_RESONANCE");
    expect(await page.locator('[data-testid="job-pool-canonical-mapping"][data-mapping-state="MAPPED"][data-proposal-state="PROPOSAL_ONLY"][data-authority-state="NONE"]').count()).toBe(1);
    expect(await page.getByTestId("job-pool-capability-sweep").getAttribute("data-sweep-state")).toBe("NOT_PRODUCED");
    expect(await page.getByTestId("job-pool-capability-sweep").getAttribute("data-scored")).toBe("false");
    await page.getByTestId("syntx-boundary-toggle").click();
    await page.getByTestId("job-pool-matches").waitFor({ state: "hidden", timeout: 10_000 });
    expect(await page.getByTestId("job-pool-non-claims").textContent()).toContain("COVERED != SCORED");
    // Preservation: planetarium geometry rendered underneath; no dock without an exact DCTXREV.
    for (const stage of ["01", "02", "03", "04", "05", "06"]) expect(await page.getByTestId(`focus-transition-stage-shell-${stage}`).count()).toBe(1);
    expect(await page.locator('[data-testid^="hr-decision-loop"]').count()).toBe(0);
    await settled(page);
    await page.screenshot({ path: resolve(EVIDENCE_DIR, "22-syntx-field-pool-containment.png") });

    // ORGANIZATION: selecting a region recenters it and recedes the others; the roles stay contained.
    const organizationId = world.samplePool.roles.find(role => role.id === T.roleId)!.organization_id;
    await page.getByTestId(`syntx-organization-${organizationId}`).click({ position: await bottomOf(page.getByTestId(`syntx-organization-${organizationId}`)) });
    await page.locator('[data-testid="syntx-field"][data-observation-kind="ORGANIZATION"]').waitFor({ timeout: 10_000 });
    expect(await field(page).getAttribute("data-observation-id")).toBe(organizationId);
    expect(params(page).get("jobOrganizationId")).toBe(organizationId);
    expect(await page.getByTestId(`syntx-organization-${organizationId}`).getAttribute("data-sign-state")).toBe("organization_selected");
    expect(await page.locator('[data-testid^="syntx-organization-"][data-sign-state="receded"]').count()).toBe(world.samplePool.organizations.length - 1);
    expect(Number(await page.getByTestId("syntx-canvas").getAttribute("data-camera-scale"))).toBeGreaterThan(1);
    expect(await page.getByTestId("syntx-canvas").getAttribute("data-depth")).toBe("1");
    // The organization's roles unfold as the satellites of its cosmos and become selectable.
    expect(await page.getByTestId(`syntx-role-${T.roleId}`).getAttribute("data-sign-state")).toBe("field");
    expect(await page.getByTestId(`syntx-role-${T.roleId}`).getAttribute("data-manifestation-form")).toBe("satellite");
    expect(await page.getByTestId(`syntx-role-${T.roleId}`).getAttribute("data-sign-interaction")).toBe("select");
    expect(await page.getByTestId("syntx-path-ORGANIZATION").getAttribute("data-current")).toBe("true");
    await settled(page);
    await page.screenshot({ path: resolve(EVIDENCE_DIR, "23-syntx-organization-recentered.png") });

    // ROLE: the role becomes the centre of its constraint ecology; requirements are anchors by support, evidence is trace substrate, one suspended boundary.
    const delivered = await fetchJobPoolMatches(newId, world.analysisId, serverFetch);
    expect(delivered.state).toBe("AVAILABLE");
    if (delivered.state !== "AVAILABLE") return;
    const roleMatch = delivered.matches.roleMatches.find(role => role.poolRoleId === T.roleId)!;
    await settled(page);
    await clickCentre(page, page.getByTestId(`syntx-role-${T.roleId}`));
    await page.locator('[data-testid="syntx-field"][data-observation-kind="ROLE"]').waitFor({ timeout: 10_000 });
    expect(await field(page).getAttribute("data-observation-id")).toBe(T.roleId);
    expect(params(page).get("jobRoleId")).toBe(T.roleId);
    expect(await page.getByTestId(`syntx-role-${T.roleId}`).getAttribute("data-sign-state")).toBe("role_selected");
    expect(await page.locator('[data-testid^="syntx-role-"][data-sign-state="receded"]').count()).toBe(world.samplePool.roles.length - 1);
    expect(await page.getByTestId("syntx-ecology").getAttribute("data-role-id")).toBe(T.roleId);
    const requirementIds = world.samplePool.requirements.filter(requirement => requirement.role_id === T.roleId).map(requirement => requirement.id);
    expect(await page.locator('[data-testid^="syntx-requirement-"]').count()).toBe(requirementIds.length);
    expect(await field(page).getAttribute("data-requirement-count")).toBe(String(requirementIds.length));
    const supportOf = (id: string) => roleMatch.matched.some(item => item.poolRequirementId === id) ? "SUPPORTED" : roleMatch.weakEvidence.some(item => item.poolRequirementId === id) ? "WEAK" : roleMatch.missing.find(item => item.poolRequirementId === id)!.sweepProposal !== null ? "SWEEP_ONLY" : "OPEN";
    for (const id of requirementIds) {
      const anchor = page.getByTestId(`syntx-requirement-${id}`);
      expect(await anchor.getAttribute("data-support")).toBe(supportOf(id));
      expect(await anchor.getAttribute("data-evaluation-state")).toBe("NOT_EVALUATED");
      expect(squash(await anchor.textContent())).toContain(squash(world.samplePool.requirements.find(requirement => requirement.id === id)!.capability_name));
    }
    expect(supportOf(T.requirementId)).toBe("SUPPORTED");
    expect(supportOf("req_003")).toBe("WEAK");
    expect(supportOf("req_005")).toBe("OPEN");
    // Relation-state geometry (§9.2): supported anchors sit closer to the role than weak ones, open ones at the boundary (screen space, while the cosmos turns).
    const distanceOf = (id: string) => page.getByTestId(`syntx-requirement-${id}`).evaluate(element => {
      const centre = (circle: Element) => { const box = circle.getBoundingClientRect(); return { x: box.left + box.width / 2, y: box.top + box.height / 2 }; };
      const role = centre(element.ownerDocument.querySelector('[data-sign-state="role_selected"] circle') as SVGCircleElement);
      const anchor = centre(element.querySelector('[data-sign-manifestation="anchor"] circle') as SVGCircleElement);
      return Math.hypot(anchor.x - role.x, anchor.y - role.y);
    });
    expect(await distanceOf(T.requirementId)).toBeLessThan(await distanceOf("req_003"));
    expect(await distanceOf("req_003")).toBeLessThan(await distanceOf("req_005"));
    // Traces: one per delivered quote, stable for scored, thin for weak; none for the open requirement, whose boundary faces outward.
    const expectedTraces = [...roleMatch.matched, ...roleMatch.weakEvidence].reduce((sum, item) => sum + item.evidence.length, 0);
    expect(await page.locator('[data-testid^="syntx-trace-"]').count()).toBe(expectedTraces);
    expect(await page.locator('[data-testid^="syntx-trace-"][data-sign-manifestation="trace_stable"]').count()).toBe(roleMatch.matched.reduce((sum, item) => sum + item.evidence.length, 0));
    expect(await page.locator('[data-testid^="syntx-trace-"][data-sign-manifestation="trace_thin"]').count()).toBe(roleMatch.weakEvidence.reduce((sum, item) => sum + item.evidence.length, 0));
    expect(await page.locator('[data-testid^="syntx-trace-"][data-sign-manifestation="trace_dotted"]').count()).toBe(0);
    expect(await page.getByTestId("syntx-open-req_005").getAttribute("data-sign-relation")).toBe("missing_support");
    expect(await page.getByTestId("syntx-open-req_005").getAttribute("data-sign-manifestation")).toBe("open_boundary");
    // One source carrier per delivered document; its title resolves through the exact join into the seeded analysis.
    const docIds = new Set([...roleMatch.matched, ...roleMatch.weakEvidence].flatMap(item => item.evidence.map(quote => quote.docId)));
    expect(await page.locator('[data-testid^="syntx-source-"]').count()).toBe(docIds.size);
    await page.locator('[data-testid="syntx-field"]:not([data-sources-state="LOADING"]):not([data-sources-state="IDLE"])').waitFor({ timeout: 30_000 });
    expect(await field(page).getAttribute("data-sources-state")).toBe("AVAILABLE");
    await page.locator(`[data-testid="syntx-source-${T.docId}"][data-source-title-state="RESOLVED"]`).waitFor({ timeout: 30_000 });
    expect(squash(await page.getByTestId(`syntx-source-${T.docId}`).textContent())).toContain(squash(JOB_POOL_E2E_SOURCE.title));
    // The one suspended boundary of the ecology carries the pending evaluation with every TRQREV as proof; no closure anywhere.
    const pending = page.getByTestId(`syntx-pending-${T.roleId}`);
    expect(await pending.getAttribute("data-sign-relation")).toBe("pending_evaluation");
    expect(await pending.getAttribute("data-sign-manifestation")).toBe("suspended_boundary");
    expect(await pending.getAttribute("data-proof-target-id")).toBe(roleMatch.canonical.targetRoleProfileRevisionId);
    expect(((await pending.getAttribute("data-proof-trqrev-id")) ?? "").split(" ")).toEqual(roleMatch.canonical.targetRequirementRevisionIds);
    expect(await page.locator('[data-sign-relation="pending_evaluation"]').count()).toBe(1);
    expect(await page.locator('[data-sign-manifestation*="closed"]').count()).toBe(0);
    // Proof ids and the score are attributes, never default-state text; the score appears only in an aperture.
    const stageText = (await page.getByTestId("syntx-stage").textContent()) ?? "";
    expect(stageText).not.toMatch(/CAP_|PCAP_|TRQREV_|TRPREV_|DOC_0|ANL_|JPOOL_/);
    expect(stageText).not.toMatch(/\d+(\.\d+)?%/);
    expect(stageText).not.toContain(T.quote);
    expect((await page.getByTestId("syntx-summary").textContent()) ?? "").toContain("Canonical evaluation is pending");
    await settled(page);
    // Perceptual closure at ROLE: every trace is a path whose hit path comes first; every trace owns pointer points on its own visible path (F-SX-2);
    // no trace crosses the role carrier's title (O-SX-2); every carrier of the ecology lies inside the stage.
    const roleGeometry = await ecologyGeometry(page);
    expect(roleGeometry.traces.length).toBe(expectedTraces);
    for (const trace of roleGeometry.traces) {
      expect(trace.hitFirst, `${trace.id} hit path first`).toBe(true);
      expect(trace.d, `${trace.id} path`).toMatch(/^M [\d.-]+ [\d.-]+ Q /);
      expect(trace.owned, `${trace.id} owns pointer points`).toBeGreaterThan(0);
      expect(trace.crossesRoleLabel, `${trace.id} crosses the role title`).toBe(false);
    }
    expect(new Set(roleGeometry.traces.map(trace => trace.d)).size).toBe(roleGeometry.traces.length);
    for (const source of roleGeometry.sources) expect(source.inside, `${source.docId} inside the stage at ROLE`).toBe(true);
    await page.screenshot({ path: resolve(EVIDENCE_DIR, "24-syntx-role-constraint-ecology.png") });

    // REQUIREMENT: the anchor becomes the observation point; its traces are inspectable, everything else recedes.
    await clickCentre(page, page.locator(`[data-sign-id="req:${T.requirementId}"]`));
    await page.locator('[data-testid="syntx-field"][data-observation-kind="REQUIREMENT"]').waitFor({ timeout: 10_000 });
    expect(await field(page).getAttribute("data-observation-id")).toBe(T.requirementId);
    expect(params(page).get("jobRequirementId")).toBe(T.requirementId);
    expect(await page.locator(`[data-sign-id="req:${T.requirementId}"]`).getAttribute("data-sign-state")).toBe("requirement_selected");
    expect(await page.locator(`[data-sign-id^="trace:${T.requirementId}:"]`).first().getAttribute("data-sign-state")).toBe("inspectable");
    expect(await page.locator('[data-sign-id="req:req_003"]').getAttribute("data-sign-state")).toBe("receded");
    expect(await field(page).getAttribute("data-aperture-open")).toBe("false");
    // Deep focus: the requirement is the nucleus, the planetarium anchor stays the organization's body at 1.12; nothing zooms.
    expect(await page.getByTestId("syntx-canvas").getAttribute("data-depth")).toBe("3");
    expect(await page.getByTestId("syntx-canvas").getAttribute("data-camera-scale")).toBe("1.12");
    // O-SX-1: the inspectable traces are drawn in the deep-focus level above every receded trace (they own the pointer there).
    expect(await page.getByTestId("syntx-field").evaluate(root => Array.from(root.querySelectorAll('[data-testid^="syntx-trace-"]')).every(trace => (trace.getAttribute("data-sign-state") === "inspectable") === (trace.closest('[data-sx-level="requirement"]') !== null)))).toBe(true);
    await settled(page);
    // Perceptual closure at REQUIREMENT: the inspectable traces own pointer points and avoid the role title; the reached carrier is inside the stage (O-SX-4);
    // the reading agrees in number (O-SX-3).
    const requirementGeometry = await ecologyGeometry(page);
    for (const trace of requirementGeometry.traces.filter(trace => trace.state === "inspectable")) {
      expect(trace.owned, `${trace.id} owns pointer points`).toBeGreaterThan(0);
      expect(trace.crossesRoleLabel, `${trace.id} crosses the role title`).toBe(false);
    }
    for (const source of requirementGeometry.sources.filter(source => source.state === "inspectable")) expect(source.inside, `${source.docId} inside the stage at REQUIREMENT`).toBe(true);
    expect(requirementGeometry.sources.filter(source => source.state === "inspectable").length).toBeGreaterThan(0);
    expect((await page.getByTestId("syntx-summary").textContent()) ?? "").toMatch(/ 1 evidence trace from 1 source\./);
    expect((await page.getByTestId("syntx-summary").textContent()) ?? "").not.toMatch(/\b1 (sources|traces|requirements|roles|organizations)\b/);
    await page.screenshot({ path: resolve(EVIDENCE_DIR, "25-syntx-requirement-observation.png") });

    // EVIDENCE: inspecting a trace opens the temporary aperture with the quote verbatim, the resolved source title and the authority boundary.
    const trace = page.locator(`[data-testid^="syntx-trace-trace:${T.requirementId}:supports:${T.docId}:"]`).first();
    const traceId = (await trace.getAttribute("data-sign-id")) ?? "";
    expect(await trace.getAttribute("data-proof-capability-id")).toBe(T.capabilityEntityId);
    expect(await trace.getAttribute("data-proof-doc-id")).toBe(T.docId);
    expect(await trace.getAttribute("data-proof-analysis-id")).toBe(world.analysisId);
    expect(await trace.getAttribute("data-proof-evidence-id")).toBeNull();
    await settled(page);
    const tracePoint = await alongTrace(trace, 0.72);
    await page.mouse.click(tracePoint.x, tracePoint.y);
    await page.locator('[data-testid="syntx-field"][data-aperture-open="true"]').waitFor({ timeout: 10_000 });
    const aperture = page.getByTestId("syntx-aperture");
    expect(await aperture.getAttribute("data-aperture-for")).toBe(traceId);
    expect(await aperture.getAttribute("data-sign-manifestation")).toBe("temporary_aperture");
    expect(await page.getByTestId("syntx-aperture-quote").textContent()).toContain(T.quote);
    expect(await page.getByTestId("syntx-aperture-source").getAttribute("data-source-title-state")).toBe("RESOLVED");
    expect(await page.getByTestId("syntx-aperture-source").textContent()).toContain(JOB_POOL_E2E_SOURCE.title);
    expect(await page.getByTestId("syntx-aperture-contribution").textContent()).toContain(String(roleMatch.matched.find(item => item.poolRequirementId === T.requirementId)!.contribution));
    expect(((await page.getByTestId("syntx-aperture-authority").textContent()) ?? "").toLowerCase()).toContain("authority none");
    expect(await field(page).getAttribute("data-observation-kind")).toBe("REQUIREMENT");
    await settled(page);
    await page.screenshot({ path: resolve(EVIDENCE_DIR, "26-syntx-evidence-aperture.png") });

    // RETURN: Escape closes the aperture, Escape again returns to the role, the return affordance to the organization, the path to the field. Reversible, nothing mutated.
    await page.keyboard.press("Escape");
    await page.locator('[data-testid="syntx-field"][data-aperture-open="false"]').waitFor({ timeout: 10_000 });
    expect(await field(page).getAttribute("data-observation-kind")).toBe("REQUIREMENT");
    await page.keyboard.press("Escape");
    await page.locator('[data-testid="syntx-field"][data-observation-kind="ROLE"]').waitFor({ timeout: 10_000 });
    expect(params(page).get("jobRequirementId")).toBeNull();
    await page.getByTestId("syntx-return-btn").click();
    await page.locator('[data-testid="syntx-field"][data-observation-kind="ORGANIZATION"]').waitFor({ timeout: 10_000 });
    expect(params(page).get("jobRoleId")).toBeNull();
    await page.getByTestId("syntx-path-FIELD").click();
    await page.locator('[data-testid="syntx-field"][data-observation-kind="FIELD"]').waitFor({ timeout: 10_000 });
    expect(params(page).get("jobOrganizationId")).toBeNull();
    expect(await page.getByTestId("syntx-canvas").getAttribute("data-camera-scale")).toBe("1");
    expect(await page.locator('[data-sign-state="receded"]').count()).toBe(0);
    // Keyboard: Tab reaches the carriers, Enter selects (organization first, then its role); Escape returns at every level even when the focused sign unmounts (F-SX-1).
    const focusInside = () => page.getByTestId("syntx-field").evaluate(element => { const active = element.ownerDocument.activeElement; return { inside: active !== null && element.contains(active), signId: active?.getAttribute("data-sign-id") ?? active?.getAttribute("data-testid") ?? active?.tagName ?? null }; });
    await page.getByTestId(`syntx-organization-${organizationId}`).focus();
    await page.keyboard.press("Enter");
    await page.locator('[data-testid="syntx-field"][data-observation-kind="ORGANIZATION"]').waitFor({ timeout: 10_000 });
    await page.getByTestId(`syntx-role-${T.roleId}`).focus();
    await page.keyboard.press("Enter");
    await page.locator('[data-testid="syntx-field"][data-observation-kind="ROLE"]').waitFor({ timeout: 10_000 });
    await page.locator(`[data-sign-id="req:${T.requirementId}"]`).focus();
    await page.keyboard.press("Enter");
    await page.locator('[data-testid="syntx-field"][data-observation-kind="REQUIREMENT"]').waitFor({ timeout: 10_000 });
    await page.locator(`[data-sign-id="${traceId}"]`).focus();
    await page.keyboard.press("Enter");
    await page.locator('[data-testid="syntx-field"][data-aperture-open="true"]').waitFor({ timeout: 10_000 });
    await page.getByTestId("syntx-aperture-close").focus();
    await page.keyboard.press("Escape");
    await page.locator('[data-testid="syntx-field"][data-aperture-open="false"]').waitFor({ timeout: 10_000 });
    expect(await focusInside(), "focus after the aperture closed").toMatchObject({ inside: true });
    await page.keyboard.press("Escape");
    await page.locator('[data-testid="syntx-field"][data-observation-kind="ROLE"]').waitFor({ timeout: 10_000 });
    // The anchor stays mounted at ROLE level, so focus may stay on it; it must only never leave the field.
    expect(await focusInside(), "focus after REQUIREMENT → ROLE").toMatchObject({ inside: true });
    await page.keyboard.press("Escape");
    await page.locator('[data-testid="syntx-field"][data-observation-kind="ORGANIZATION"]').waitFor({ timeout: 10_000 });
    expect(await focusInside(), "focus after ROLE → ORGANIZATION (the ecology unmounted)").toMatchObject({ inside: true, signId: `org:${organizationId}` });
    await page.keyboard.press("Escape");
    await page.locator('[data-testid="syntx-field"][data-observation-kind="FIELD"]').waitFor({ timeout: 10_000 });
    expect(await focusInside(), "focus after ORGANIZATION → FIELD").toMatchObject({ inside: true });
    // The matching read is unchanged by the walk (no selection mutates stored analysis).
    const after = await fetchJobPoolMatches(newId, world.analysisId, serverFetch);
    expect(after).toEqual(delivered);
    // Exit to the ground state through the field; the explicit exit survives a reload (B-POOL-INITIAL-FOCUS).
    await page.getByTestId("syntx-exit-btn").click();
    await page.locator('[data-testid="semantic-career-intelligence-field"][data-field-focus="CAPABILITY"]').waitFor({ timeout: 30_000 });
    expect(await field(page).count()).toBe(0);
    expect(params(page).get("focus")).toBe("CAPABILITY");
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.locator('[data-testid="semantic-career-intelligence-field"][data-field-focus="CAPABILITY"]').waitFor({ timeout: 60_000 });
    expect(await field(page).count()).toBe(0);
    expect(pageErrors).toEqual([]);
    await page.close();
  }, 400_000);

  it("reopens the exact selection from the URL and shows a DRAFT pool as inactive instead of matching it; its structure stays a containment field without a matching read", async () => {
    pageErrors = [];
    const page = await openPage(`/career/demo?analysisId=${world.analysisId}&jobPoolUploadId=${uploadedId}`);
    await page.locator('[data-testid="syntx-field"][data-field-state="AVAILABLE"]').waitFor({ timeout: 60_000 });
    expect(await field(page).getAttribute("data-selection-kind")).toBe("LISTED");
    expect(await field(page).getAttribute("data-selected-pool")).toBe(uploadedId);
    await page.getByTestId("syntx-pools-toggle").click();
    await page.getByTestId(`job-pool-select-${draftUploadId}`).click();
    await page.locator('[data-testid="syntx-field"][data-matches-state="INACTIVE_POOL"]').waitFor({ timeout: 60_000 });
    expect(await page.getByTestId("syntx-state").textContent()).toContain("POOL IS NOT ACTIVE");
    expect(await page.getByTestId(`job-pool-item-${draftUploadId}`).getAttribute("data-pool-status")).toBe("DRAFT");
    expect(params(page).get("jobPoolUploadId")).toBe(draftUploadId);
    expect(await field(page).getAttribute("data-matching-delivered")).toBe("false");
    const draftOrganization = page.getByTestId(`syntx-organization-${world.samplePool.roles.find(role => role.id === T.roleId)!.organization_id}`);
    await draftOrganization.click({ position: await bottomOf(draftOrganization) });
    await page.locator('[data-testid="syntx-field"][data-observation-kind="ORGANIZATION"]').waitFor({ timeout: 10_000 });
    await settled(page);
    await clickCentre(page, page.getByTestId(`syntx-role-${T.roleId}`));
    await page.locator('[data-testid="syntx-field"][data-observation-kind="ROLE"]').waitFor({ timeout: 10_000 });
    expect(await page.locator('[data-testid^="syntx-requirement-"][data-support="UNREAD"]').count()).toBe(world.samplePool.requirements.filter(requirement => requirement.role_id === T.roleId).length);
    expect(await page.locator('[data-testid^="syntx-trace-"]').count()).toBe(0);
    expect(await page.locator('[data-testid^="syntx-pending-"]').count()).toBe(0);
    await settled(page);
    await page.screenshot({ path: resolve(EVIDENCE_DIR, "04-draft-pool-inactive-no-matching.png") });
    expect(pageErrors).toEqual([]);
    await page.close();
  }, 240_000);

  it("reopens the field at an exact requirement from the URL, accepts the legacy JOB focus name, names a stale role id, and preserves meaning under reduced motion", async () => {
    pageErrors = [];
    const page = await openPage(`/career/demo?focus=JOB&analysisId=${world.analysisId}&jobPoolUploadId=${uploadedId}&jobRoleId=${T.roleId}&jobRequirementId=req_003`);
    await page.locator('[data-testid="syntx-field"][data-observation-kind="REQUIREMENT"][data-field-state="AVAILABLE"]').waitFor({ timeout: 120_000 });
    expect(await page.getByTestId("semantic-career-intelligence-field").getAttribute("data-field-focus")).toBe("FIELD");
    expect(await field(page).getAttribute("data-observation-id")).toBe("req_003");
    expect(await page.getByTestId("syntx-requirement-req_003").getAttribute("data-support")).toBe("WEAK");
    expect(await field(page).getAttribute("data-aperture-open")).toBe("false");
    // The thin trace of weak support inspects to the weak-evidence text and reason; weak support never closes.
    const weakTrace = page.locator('[data-testid^="syntx-trace-trace:req_003:weakly_supports:"]').first();
    await settled(page);
    const weakPoint = await alongTrace(weakTrace, 0.72);
    await page.mouse.click(weakPoint.x, weakPoint.y);
    await page.locator('[data-testid="syntx-field"][data-aperture-open="true"]').waitFor({ timeout: 10_000 });
    expect(await page.getByTestId("syntx-aperture").getAttribute("data-sign-relation")).toBe("weakly_supports");
    expect(await page.getByTestId("syntx-aperture").textContent()).toContain("Evidence exists but contributes limited matching support.");
    // The open boundary of a requirement without delivered support inspects to the neutral text, never a failure.
    await page.getByTestId("syntx-aperture-close").click();
    await page.locator('[data-testid="syntx-field"][data-aperture-open="false"]').waitFor({ timeout: 10_000 });
    await page.getByTestId("syntx-return-btn").click();
    await page.locator('[data-testid="syntx-field"][data-observation-kind="ROLE"]').waitFor({ timeout: 10_000 });
    await settled(page);
    await clickCentre(page, page.getByTestId("syntx-open-req_005"));
    await page.locator('[data-testid="syntx-field"][data-observation-kind="REQUIREMENT"][data-aperture-open="true"]').waitFor({ timeout: 10_000 });
    expect(await page.getByTestId("syntx-aperture").getAttribute("data-aperture-kind")).toBe("open");
    expect(await page.getByTestId("syntx-aperture-open-text").textContent()).toBe("No delivered support is available for this requirement in the current analysis.");
    expect(((await page.getByTestId("syntx-aperture").textContent()) ?? "").toLowerCase()).not.toMatch(/fail|incompet|disqualif/);
    // The suspended boundary inspects to the authority statement; the score appears here, numerically, and nowhere before.
    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");
    await page.locator('[data-testid="syntx-field"][data-observation-kind="ROLE"][data-aperture-open="false"]').waitFor({ timeout: 10_000 });
    await settled(page);
    await page.getByTestId(`syntx-pending-${T.roleId}`).click({ position: await topOf(page.getByTestId(`syntx-pending-${T.roleId}`)) });
    await page.locator('[data-testid="syntx-field"][data-observation-kind="ROLE"][data-aperture-open="true"]').waitFor({ timeout: 10_000 });
    expect(await page.getByTestId("syntx-aperture-pending-text").textContent()).toBe("Authoritative evaluation has not occurred for this relation.");
    expect(await page.getByTestId("syntx-aperture-resonance").count()).toBe(1);
    expect(await page.getByTestId("syntx-aperture").textContent()).toContain("POOL RESONANCE (PRESENTATION)");
    await page.close();

    const stale = await openPage(`/career/demo?focus=FIELD&analysisId=${world.analysisId}&jobPoolUploadId=${uploadedId}&jobRoleId=role_stale`);
    await stale.locator('[data-testid="syntx-stale"][data-stale-kind="ROLE"][data-stale-id="role_stale"]').waitFor({ timeout: 120_000 });
    expect(await stale.getByTestId("syntx-field").getAttribute("data-observation-kind")).toBe("FIELD");
    await stale.close();

    // prefers-reduced-motion: instant topology change, no animation, every sign and its meaning stays.
    const calm = await browser.newPage({ viewport: { width: 1600, height: 1000 }, reducedMotion: "reduce" });
    calm.on("pageerror", (error: unknown) => pageErrors.push(String(error)));
    await calm.goto(`${base()}/career/demo?focus=FIELD&analysisId=${world.analysisId}&jobPoolUploadId=${uploadedId}&jobRoleId=${T.roleId}`, { waitUntil: "domcontentloaded", timeout: 120_000 });
    await calm.locator('[data-testid="syntx-field"][data-field-state="AVAILABLE"][data-motion-mode="REDUCED"][data-observation-kind="ROLE"]').waitFor({ timeout: 120_000 });
    // REDUCED is total: the focus transformation has no transition, nothing animates, the role cosmos does not turn (its clock never starts).
    expect(await calm.locator('[data-testid^="focus-transition-stage-shell-syntx-"]').first().evaluate(element => getComputedStyle(element).transitionDuration)).toBe("0s");
    const rotation = await calm.getByTestId("syntx-ecology").getAttribute("data-rotation");
    await calm.waitForTimeout(1500);
    expect(await calm.getByTestId("syntx-ecology").getAttribute("data-rotation")).toBe(rotation);
    expect(rotation).toBe("0.000000");
    expect(await calm.getByTestId("syntx-field").evaluate(element => element.getAnimations({ subtree: true }).filter(animation => animation.playState === "running").length)).toBe(0);
    expect(await calm.locator("[data-sx-photon]").count()).toBe(0);
    expect(await calm.locator(`[data-testid="syntx-pending-${T.roleId}"] circle:not([data-sx-hit])`).evaluate(element => getComputedStyle(element).animationName)).toBe("none");
    expect(await calm.getByTestId(`syntx-requirement-${T.requirementId}`).getAttribute("data-support")).toBe("SUPPORTED");
    expect(await calm.locator('[data-testid^="syntx-trace-"]').count()).toBeGreaterThan(0);
    expect(await calm.getByTestId(`syntx-pending-${T.roleId}`).count()).toBe(1);
    await calm.close();

    const noPool = await openPage(`/career/demo?focus=FIELD&analysisId=${world.analysisId}`);
    await noPool.locator('[data-testid="syntx-field"][data-field-state="NO_POOL"]').waitFor({ timeout: 120_000 });
    await noPool.getByTestId(`job-pool-select-${uploadedId}`).waitFor({ timeout: 60_000 });
    await noPool.getByTestId(`job-pool-select-${uploadedId}`).click();
    await noPool.locator('[data-testid="syntx-field"][data-field-state="AVAILABLE"]').waitFor({ timeout: 120_000 });
    expect(params(noPool).get("jobPoolUploadId")).toBe(uploadedId);
    expect(pageErrors).toEqual([]);
    await noPool.close();
  }, 400_000);

  it("names a stale selection that is not among the persisted uploads and leaves the field without a dock", async () => {
    pageErrors = [];
    const page = await openPage(`/career/demo?jobPoolUploadId=JPOOL_STALE_SELECTION`);
    await page.locator('[data-testid="syntx-field"][data-pools-state="AVAILABLE"]').waitFor({ timeout: 60_000 });
    expect(await field(page).getAttribute("data-selection-kind")).toBe("NOT_LISTED");
    expect(await page.getByTestId("job-pool-selection-not-listed").count()).toBe(1);
    expect(await field(page).getAttribute("data-matches-state")).toBe("IDLE");
    expect(await page.locator('[data-testid^="hr-decision-loop"]').count()).toBe(0);
    await page.screenshot({ path: resolve(EVIDENCE_DIR, "05-stale-selection-named-no-analysis.png") });
    expect(pageErrors).toEqual([]);
    await page.close();
  }, 240_000);
});
