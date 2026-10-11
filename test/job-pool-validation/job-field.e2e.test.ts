/**
 * PINK browser proof for the owner's Job Field (GRÜN contract of 2026-10-11, JOB focus) with PINK's pool and a
 * seeded analysis (sweep NOT_PRODUCED). Every rendered value is checked against the matches and upload bodies of
 * the same server; the pending kinds, the nearest-role rule, distance = 1 − score, delivered order, source labels
 * and the absence of canonical relation ids are bound here. Skips while the field has no JOB focus.
 */
import { spawn, type ChildProcess } from "node:child_process";
import { once } from "node:events";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { createServer } from "node:net";
import { resolve } from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PostgresCareerAnalysisRepository } from "../../lib/career/repositories/postgres";
import { createJobPoolPostgresWorld, type JobPoolWorld } from "../career/job-pool/fixtures/job-pool-postgres-world";
import { buildVerifiedAnalysis } from "./fixtures/analysis";
import { draftPool, validationPool } from "./fixtures/pool";

function resolvePlaywright(): string | null {
  const explicit = process.env.CONDYN_PLAYWRIGHT_MODULE;
  if (explicit !== undefined && explicit.length > 0) return explicit;
  try { return createRequire(resolve(process.cwd(), "package.json")).resolve("playwright"); } catch { return null; }
}
const playwrightModule = resolvePlaywright();
const fieldSource = resolve(process.cwd(), "app/components/career/demo/SemanticCareerIntelligenceField.tsx");
const jobFocusPresent = existsSync(fieldSource) && /data-field-focus/.test(readFileSync(fieldSource, "utf8"));
const EVIDENCE_DIR = resolve(process.cwd(), "docs/architecture/decision-fields/evidence/job-pool-validation");
const ANALYSIS_ID = "ANL_PINK_JOB_FIELD";

let world: JobPoolWorld;
let server: ChildProcess | undefined;
let port = 0;
let serverOutput = "";
const base = () => `http://127.0.0.1:${port}`;
const delay = (ms: number) => new Promise<void>((done) => setTimeout(done, ms));
const near = (a: number, b: number) => Math.abs(a - b) < 1e-3;

async function availablePort(): Promise<number> {
  const listener = createServer();
  await new Promise<void>((ok, fail) => { listener.once("error", fail); listener.listen(0, "127.0.0.1", () => ok()); });
  const address = listener.address();
  if (address === null || typeof address === "string") throw new Error("no port");
  await new Promise<void>((ok, fail) => listener.close((error) => (error ? fail(error) : ok())));
  return address.port;
}

describe.skipIf(playwrightModule === null || !jobFocusPresent)("PINK Job Field: JOB focus renders exactly the delivered presentation with its pending kinds", () => {
  let browser: any;
  const pageErrors: string[] = [];
  let uploadId = "";
  let draftId = "";
  let view: any;
  let matches: any;

  async function open(path: string) {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    page.on("pageerror", (error: unknown) => pageErrors.push(String(error)));
    await page.goto(`${base()}${path}`, { waitUntil: "domcontentloaded", timeout: 120_000 });
    await page.getByTestId("guided-onboarding-overlay").waitFor({ timeout: 120_000 });
    await page.getByTestId("onboarding-close-btn").click();
    await page.getByTestId("guided-onboarding-overlay").waitFor({ state: "detached", timeout: 30_000 });
    return page;
  }

  beforeAll(async () => {
    world = await createJobPoolPostgresWorld();
    await new PostgresCareerAnalysisRepository(drizzle(world.sql)).save(buildVerifiedAnalysis(ANALYSIS_ID));
    port = await availablePort();
    server = spawn(process.execPath, [resolve(process.cwd(), "node_modules/next/dist/bin/next"), "dev", "--webpack", "-p", String(port), "-H", "127.0.0.1"], {
      cwd: process.cwd(), env: { ...process.env, DATABASE_URL: world.databaseUrl, NEXT_TELEMETRY_DISABLED: "1" }, stdio: ["ignore", "pipe", "pipe"]
    });
    server.stdout?.on("data", (chunk) => { serverOutput += String(chunk); });
    server.stderr?.on("data", (chunk) => { serverOutput += String(chunk); });
    for (let attempt = 0; attempt < 160; attempt += 1) {
      try { const response = await fetch(`${base()}/api/career/job-pools`); if (response.status === 200) { await response.json(); break; } } catch { /* not ready */ }
      await delay(500);
      if (attempt === 159) throw new Error(`server not ready:\n${serverOutput}`);
    }
    const post = async (body: unknown) => (await fetch(`${base()}/api/career/job-pools`, { method: "POST", headers: { "content-type": "application/json", "x-condyn-principal-actor-id": "PINK_JOB_FIELD" }, body: JSON.stringify(body) })).json();
    view = await post(validationPool);
    uploadId = view.jobPoolUploadId;
    draftId = (await post(draftPool())).jobPoolUploadId;
    matches = await (await fetch(`${base()}/api/career/job-pools/${uploadId}/matches?analysisId=${ANALYSIS_ID}`)).json();
    const playwright = await import(playwrightModule as string);
    browser = await playwright.chromium.launch({ headless: true });
    mkdirSync(EVIDENCE_DIR, { recursive: true });
  }, 300_000);

  afterAll(async () => {
    if (browser) await browser.close();
    if (server && server.exitCode === null && server.signalCode === null) {
      server.kill("SIGTERM");
      await Promise.race([once(server, "exit"), delay(10_000)]);
      if (server.exitCode === null && server.signalCode === null) { server.kill("SIGKILL"); await once(server, "exit"); }
    }
    if (world) await world.destroy();
  }, 60_000);

  it("AVAILABLE: roles, organisations, core, nearest role, distance, pending kinds and requirement provenance equal the bodies", async () => {
    const page = await open(`/career/demo?focus=JOB&analysisId=${ANALYSIS_ID}&jobPoolUploadId=${uploadId}`);
    expect(await page.getByTestId("semantic-career-intelligence-field").getAttribute("data-field-focus")).toBe("JOB");
    for (const stage of ["01", "02", "03", "04", "05", "06"]) expect(await page.getByTestId(`focus-transition-stage-shell-${stage}`).count()).toBe(1);
    expect(await page.locator('[data-testid^="hr-decision-loop"]').count()).toBe(0);
    const field = page.getByTestId("job-field");
    await page.locator('[data-testid="job-field"][data-field-state="AVAILABLE"]').waitFor({ timeout: 60_000 });
    expect(await field.getAttribute("data-analysis-id")).toBe(ANALYSIS_ID);
    expect(await field.getAttribute("data-pool-id")).toBe(validationPool.pool.id);
    expect(await field.getAttribute("data-role-count")).toBe(String(matches.roleMatches.length));
    expect(await field.getAttribute("data-sweep-state")).toBe(matches.capabilitySweep.state);
    expect(await page.getByTestId("job-field-core").getAttribute("data-candidate-capability-count")).toBe(String(matches.candidateCapabilityCount));

    const roles: any[] = matches.roleMatches;
    const nearest = roles.find((role) => role.resonanceScore > 0 && role.matched.length > 0);
    expect(await field.getAttribute("data-nearest-role")).toBe(nearest ? nearest.poolRoleId : "");
    if (nearest) expect(await page.getByTestId("job-field-nearest").getAttribute("data-role-id")).toBe(nearest.poolRoleId);
    else expect(await page.getByTestId("job-field-no-nearest").count()).toBe(1);

    const requirementCountOf = (poolRoleId: string) => view.canonicalMapping.roles.find((r: any) => r.poolRoleId === poolRoleId).requirements.length;
    for (const [index, role] of roles.entries()) {
      const row = page.getByTestId(`job-field-role-${role.poolRoleId}`);
      expect(await row.getAttribute("data-delivered-rank")).toBe(String(index + 1));
      expect(Number(await row.getAttribute("data-resonance-score"))).toBe(role.resonanceScore);
      expect(near(Number(await row.getAttribute("data-distance")), 1 - role.resonanceScore)).toBe(true);
      expect(await row.getAttribute("data-scored-match")).toBe(String(role.matched.length > 0));
      expect(await row.getAttribute("data-nearest")).toBe(String(nearest?.poolRoleId === role.poolRoleId));
      const covered = [...role.weakEvidence, ...role.missing].filter((item: any) => item.sweepProposal !== null).length;
      const noEvidence = role.missing.filter((item: any) => item.sweepProposal === null).length;
      const counts = { matched: Number(await row.getAttribute("data-matched")), unresolved: Number(await row.getAttribute("data-unresolved")), covered: Number(await row.getAttribute("data-covered-unscored")), none: Number(await row.getAttribute("data-no-evidence")) };
      expect(counts).toEqual({ matched: role.matched.length, unresolved: role.weakEvidence.length, covered, none: noEvidence });
      expect(counts.matched + counts.unresolved + counts.covered + counts.none).toBe(requirementCountOf(role.poolRoleId));
    }
    for (const organization of matches.organizationMatches) {
      expect(await page.getByTestId(`job-field-organization-${organization.poolOrganizationId}`).getAttribute("data-role-count")).toBe(String(organization.roleCount));
    }

    const legend = (await page.getByTestId("job-field-legend").textContent()) ?? "";
    expect(legend).toContain("POOL RESONANCE (PRESENTATION)");
    expect(legend.toLowerCase()).toContain("authority none");
    expect(await page.getByTestId("job-field-non-claims").count()).toBe(1);
    const fieldText = (await field.innerHTML()) ?? "";
    expect(fieldText).not.toMatch(/\b(RRL|TSN|EIS|RCP)_[A-Z0-9]/);

    // Role detail and pending kinds for the role with weak evidence and a missing requirement.
    const focus = roles.find((role) => role.poolRoleId === "role_pink_alpha_architect");
    await page.getByTestId(`job-field-role-${focus.poolRoleId}`).click();
    await page.locator(`[data-testid="job-field-role-detail"][data-role-id="${focus.poolRoleId}"]`).waitFor({ timeout: 30_000 });
    expect(await field.getAttribute("data-selected-role")).toBe(focus.poolRoleId);
    const expectState = async (item: any, state: string, provenance: string) => {
      const line = page.getByTestId(`job-field-requirement-${item.poolRequirementId}`);
      expect(await line.getAttribute("data-state")).toBe(state);
      expect(await line.getAttribute("data-provenance")).toBe(provenance);
    };
    for (const item of focus.matched) { await expectState(item, "MATCHED", "ANALYSIS_CAPABILITY"); expect(await page.getByTestId(`job-field-requirement-${item.poolRequirementId}`).getAttribute("data-basis")).toBe(item.matchBasis); }
    for (const item of focus.weakEvidence) await expectState(item, "UNRESOLVED", "ANALYSIS_CAPABILITY");
    for (const item of focus.missing) await expectState(item, item.sweepProposal ? "COVERED_UNSCORED" : "NO_EVIDENCE_DELIVERED", item.sweepProposal ? "SWEEP_PROPOSAL" : "NONE");

    const pending = page.getByTestId("job-field-pending");
    expect(await pending.getAttribute("data-role-id")).toBe(focus.poolRoleId);
    const pendingCount = async (kind: string) => Number(await page.getByTestId(`job-field-pending-${kind}`).getAttribute("data-count"));
    expect(await pendingCount("UNPROVEN_CANONICAL")).toBe(requirementCountOf(focus.poolRoleId));
    expect(await pendingCount("UNRESOLVED_EVIDENCE")).toBe(focus.weakEvidence.length);
    expect(await pendingCount("UNSCORED_COVERAGE")).toBe([...focus.weakEvidence, ...focus.missing].filter((item: any) => item.sweepProposal !== null).length);
    expect(await pendingCount("NO_EVIDENCE_DELIVERED")).toBe(focus.missing.filter((item: any) => item.sweepProposal === null).length);
    const unprovenIds = ((await page.getByTestId("job-field-pending-UNPROVEN_CANONICAL").getAttribute("data-ids")) ?? "").split(",").filter(Boolean);
    expect(unprovenIds.length).toBe(requirementCountOf(focus.poolRoleId));
    const reason = (await page.getByTestId("job-field-pending-reason").textContent()) ?? "";
    expect(reason).toContain("NOT_EVALUATED");
    expect(reason).toContain("VERIFIED_CAPABILITY_SNAPSHOT_ABSENT");
    await page.screenshot({ path: resolve(EVIDENCE_DIR, "pink-04-job-field-job-focus.png") });
    expect(pageErrors).toEqual([]);
    await page.close();
  }, 300_000);

  it("states NO_ANALYSIS, NO_POOL and INACTIVE_POOL as distinct field states", async () => {
    const noAnalysis = await open(`/career/demo?focus=JOB&jobPoolUploadId=${uploadId}`);
    await noAnalysis.locator('[data-testid="job-field"][data-field-state="NO_ANALYSIS"]').waitFor({ timeout: 60_000 });
    expect(await noAnalysis.getByTestId("job-field-no-analysis").count()).toBe(1);
    await noAnalysis.close();
    const noPool = await open(`/career/demo?focus=JOB&analysisId=${ANALYSIS_ID}`);
    await noPool.locator('[data-testid="job-field"][data-field-state="NO_POOL"]').waitFor({ timeout: 60_000 });
    expect(await noPool.getByTestId(`job-field-select-pool-${uploadId}`).count()).toBe(1);
    await noPool.close();
    const inactive = await open(`/career/demo?focus=JOB&analysisId=${ANALYSIS_ID}&jobPoolUploadId=${draftId}`);
    await inactive.locator('[data-testid="job-field"][data-field-state="INACTIVE_POOL"]').waitFor({ timeout: 60_000 });
    await inactive.close();
    expect(pageErrors).toEqual([]);
  }, 300_000);
});
