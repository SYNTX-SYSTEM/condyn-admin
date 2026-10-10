/**
 * PINK JP-B: independent browser walk of the Job Pool panel (GRÜN's frontend field, a62b6f9) with PINK's own pool
 * and analysis fixtures. The proof closes the inverse DOM ↔ HTTP ↔ PostgreSQL: every rank, score, basis, constituent,
 * evidence quote and canonical id rendered in a real Chromium equals the matches body of the same server, and every
 * TRQREV id shown resolves through the target repositories on the disposable database.
 *
 * Real `next dev --webpack` on a disposable database (GRÜN's world fixture), Chromium through the Playwright module
 * named by CONDYN_PLAYWRIGHT_MODULE (or the package when installed); skipped with a reason otherwise.
 */
import { spawn, type ChildProcess } from "node:child_process";
import { once } from "node:events";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PostgresCareerAnalysisRepository } from "../../lib/career/repositories/postgres";
import { createJobPoolPostgresWorld, type JobPoolWorld } from "../career/job-pool/fixtures/job-pool-postgres-world";
import { careerChainRepositories } from "../decision-integration/fixtures/postgres-career-chain";
import { buildVerifiedAnalysis, validationCapabilities } from "./fixtures/analysis";
import { validationPool } from "./fixtures/pool";

function resolvePlaywright(): string | null {
  const explicit = process.env.CONDYN_PLAYWRIGHT_MODULE;
  if (explicit !== undefined && explicit.length > 0) return explicit;
  try { return createRequire(resolve(process.cwd(), "package.json")).resolve("playwright"); } catch { return null; }
}
const playwrightModule = resolvePlaywright();
const EVIDENCE_DIR = resolve(process.cwd(), "docs/architecture/decision-fields/evidence/job-pool-validation");
const ANALYSIS_ID = "ANL_PINK_BROWSER_WALK";

let world: JobPoolWorld;
let server: ChildProcess | undefined;
let port = 0;
let serverOutput = "";
const base = () => `http://127.0.0.1:${port}`;
const delay = (ms: number) => new Promise<void>((done) => setTimeout(done, ms));

async function availablePort(): Promise<number> {
  const listener = createServer();
  await new Promise<void>((ok, fail) => { listener.once("error", fail); listener.listen(0, "127.0.0.1", () => ok()); });
  const address = listener.address();
  if (address === null || typeof address === "string") throw new Error("no port");
  await new Promise<void>((ok, fail) => listener.close((error) => (error ? fail(error) : ok())));
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
  throw new Error(`server not ready:\n${serverOutput}`);
}

describe.skipIf(playwrightModule === null)("PINK JP-B: Job Pool panel in a real browser against PINK's fixtures", () => {
  let browser: any;
  const pageErrors: string[] = [];

  beforeAll(async () => {
    world = await createJobPoolPostgresWorld();
    await new PostgresCareerAnalysisRepository(drizzle(world.sql)).save(buildVerifiedAnalysis(ANALYSIS_ID));
    port = await availablePort();
    server = spawn(process.execPath, [resolve(process.cwd(), "node_modules/next/dist/bin/next"), "dev", "--webpack", "-p", String(port), "-H", "127.0.0.1"], {
      cwd: process.cwd(), env: { ...process.env, DATABASE_URL: world.databaseUrl, NEXT_TELEMETRY_DISABLED: "1" }, stdio: ["ignore", "pipe", "pipe"]
    });
    server.stdout?.on("data", (chunk) => { serverOutput += String(chunk); });
    server.stderr?.on("data", (chunk) => { serverOutput += String(chunk); });
    await waitForReadiness();
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

  it("uploads PINK's pool through the file chooser, selects it, and renders exactly the matches body and the persisted canonical ids", async () => {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    page.on("pageerror", (error: unknown) => pageErrors.push(String(error)));
    await page.goto(`${base()}/career/demo?analysisId=${ANALYSIS_ID}`, { waitUntil: "domcontentloaded", timeout: 120_000 });
    await page.getByTestId("guided-onboarding-overlay").waitFor({ timeout: 120_000 });
    await page.getByTestId("onboarding-close-btn").click();
    await page.getByTestId("guided-onboarding-overlay").waitFor({ state: "detached", timeout: 30_000 });
    expect(await page.locator('[data-testid^="hr-decision-loop"]').count()).toBe(0);

    await page.getByTestId("job-pool-panel-toggle").click();
    const panel = page.getByTestId("job-pool-panel");
    await panel.waitFor({ timeout: 30_000 });
    await page.getByTestId("job-pool-list").waitFor({ timeout: 60_000 });
    expect(await panel.getAttribute("data-selected-pool")).toBe("");

    const poolPath = join(mkdtempSync(join(tmpdir(), "pink-job-pool-")), "pink-validation-pool.json");
    writeFileSync(poolPath, JSON.stringify(validationPool, null, 2));
    await page.getByTestId("job-pool-file-input").setInputFiles(poolPath);
    await page.getByTestId("job-pool-actor-input").fill("PINK_BROWSER_WALK");
    await page.locator('[data-testid="job-pool-upload-btn"]:not([disabled])').waitFor({ timeout: 10_000 });
    await page.getByTestId("job-pool-upload-btn").click();
    const result = page.locator('[data-testid="job-pool-upload-result"][data-upload-outcome="CREATED"]');
    await result.waitFor({ timeout: 60_000 });
    const uploadId = (await result.getAttribute("data-upload-id")) ?? "";
    expect(uploadId).toMatch(/^JPOOL_[0-9A-F]{32}$/);
    expect(await panel.getAttribute("data-selected-pool")).toBe("");

    await page.getByTestId(`job-pool-select-${uploadId}`).click();
    await page.locator('[data-testid="job-pool-matches"][data-matches-state="AVAILABLE"]').waitFor({ timeout: 60_000 });
    expect(new URL(page.url()).searchParams.get("jobPoolUploadId")).toBe(uploadId);

    // The same server's bodies are the oracle for everything rendered.
    const view = await (await fetch(`${base()}/api/career/job-pools/${uploadId}`)).json();
    const matches = await (await fetch(`${base()}/api/career/job-pools/${uploadId}/matches?analysisId=${ANALYSIS_ID}`)).json();
    expect(view.uploadedByActorRef).toBe("JOB_POOL_UPLOADER:PINK_BROWSER_WALK");
    expect(matches.candidateCapabilityCount).toBe(validationCapabilities.length);

    for (const label of ["DETERMINISTIC_PRESENTATION", "NOT_A_CANONICAL_EVALUATION", "NOT_A_DECISION"]) expect(await page.getByTestId(`job-pool-label-${label}`).count()).toBe(1);
    expect(await page.getByTestId("job-pool-ranking").getAttribute("data-ranking")).toBe("MONOTONE_BY_RESONANCE");
    expect(await page.getByTestId("job-pool-role-list").getAttribute("data-role-count")).toBe(String(matches.roleMatches.length));

    const repositories = careerChainRepositories(drizzle(world.sql));
    for (const [index, role] of (matches.roleMatches as any[]).entries()) {
      const row = page.getByTestId(`job-pool-role-${role.poolRoleId}`);
      expect(await row.getAttribute("data-rank")).toBe(String(index + 1));
      expect(await row.getAttribute("data-resonance-score")).toBe(String(role.resonanceScore));
      expect(await row.getAttribute("data-matched-count")).toBe(String(role.matched.length));
      for (const item of role.matched) {
        const hit = page.getByTestId(`job-pool-role-${role.poolRoleId}-matched-${item.poolRequirementId}`);
        expect(await hit.getAttribute("data-match-basis")).toBe(item.matchBasis);
        const text = (await hit.textContent()) ?? "";
        for (const quote of item.evidence) expect(text).toContain(quote.quote);
        if (item.matchBasis === "COMPOSITE_CONSTITUENT") {
          expect(await hit.getByTestId("job-pool-matched-constituent").textContent()).toContain(item.matchedConstituent);
        }
      }
      for (const item of role.weakEvidence) {
        const hit = page.getByTestId(`job-pool-role-${role.poolRoleId}-weak-${item.poolRequirementId}`);
        expect(await hit.getAttribute("data-match-basis")).toBe(item.matchBasis);
      }
      for (const item of role.missing) expect(await page.getByTestId(`job-pool-role-${role.poolRoleId}-missing-${item.poolRequirementId}`).count()).toBe(1);
      const canonical = page.getByTestId(`job-pool-role-${role.poolRoleId}-canonical`);
      expect(await canonical.getAttribute("data-relation-state")).toBe("NOT_EVALUATED");
      expect(await canonical.getAttribute("data-relation-reason")).toBe("VERIFIED_CAPABILITY_SNAPSHOT_ABSENT");
      expect((await canonical.textContent()) ?? "").toContain(role.canonical.targetRoleProfileRevisionId);
      for (const id of role.canonical.targetRequirementRevisionIds) {
        expect(await page.getByTestId(`job-pool-trqrev-${id}`).count()).toBe(1);
        const revision = await repositories.requirement.getRevisionById(id);
        expect(revision?.targetRequirementRevisionId).toBe(id);
        expect(revision?.targetRoleProfileRevisionId).toBe(role.canonical.targetRoleProfileRevisionId);
      }
    }
    expect(await page.locator('[data-testid^="job-pool-trqrev-"]').count()).toBe(validationPool.requirements.length);

    // Sweep coverage (GRÜN 5839762): a seeded analysis has no capability sweep; the panel says so and shows no coverage line.
    const sweep = page.getByTestId("job-pool-capability-sweep");
    expect(await sweep.getAttribute("data-sweep-state")).toBe(matches.capabilitySweep.state);
    expect(await sweep.getAttribute("data-sweep-state")).toBe("NOT_PRODUCED");
    expect(await sweep.getAttribute("data-proposal-count")).toBe("0");
    expect(await sweep.getAttribute("data-scored")).toBe("false");
    expect(await page.locator('[data-testid^="job-pool-role-"][data-testid$="-sweep"]').count()).toBe(0);
    for (const role of matches.roleMatches as any[]) {
      expect(await page.getByTestId(`job-pool-role-${role.poolRoleId}-sweep-only`).getAttribute("data-count")).toBe(String(role.sweepOnlyCoverageCount));
      expect(role.sweepOnlyCoverageCount).toBe(0);
    }

    // PINK's fixture facts, as rendered.
    const beta = (matches.roleMatches as any[]).find((role) => role.poolRoleId === "role_pink_beta_platform");
    expect(beta.matched.map((item: any) => [item.poolRequirementId, item.matchBasis, item.matchedConstituent])).toEqual([["req_pink_beta_1", "ALIAS", null], ["req_pink_beta_3", "COMPOSITE_CONSTITUENT", "Node.js"]]);
    expect(await page.getByTestId("job-pool-role-role_pink_beta_platform").getAttribute("data-rank")).toBe("1");
    expect(await page.locator('[data-testid^="hr-decision-loop"]').count()).toBe(0);
    expect((await page.getByTestId("job-pool-non-claims").textContent()) ?? "").toContain("PRESENTED != EVALUATED");
    await page.screenshot({ path: resolve(EVIDENCE_DIR, "pink-01-browser-walk-ranked-matches.png") });
    expect(pageErrors).toEqual([]);
    await page.close();
  }, 300_000);
});
