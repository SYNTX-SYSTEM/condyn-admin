/**
 * PINK JP-LIVE: the manual workflow PDF → Gemini Capability Sweep → JSON Job Pool → Job Matching reproduced in a
 * real browser on a disposable database, with the production worker (scripts/run-career-worker.ts) calling the
 * real model. Runs only when GEMINI_API_KEY is present in the environment of this process (B-GEMINI: the key is read
 * into the child processes and never printed or stored); otherwise the suite is skipped with that reason.
 *
 * Inverse closed here: every sweep line rendered in the browser equals the matches body of the same server, the
 * projection reference of the job exists on the database, and the proposals the F11 reader returns count exactly
 * as the body's proposalCount. Model name and timings are written next to the screenshots as evidence.
 */
import { spawn, type ChildProcess } from "node:child_process";
import { randomBytes } from "node:crypto";
import { once } from "node:events";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createCapabilityProposalProjectionReader, PostgresCapabilityCoreRepository, PostgresCapabilityProposalProjectionReferenceRepository } from "../../lib/career/capability-core";
import { registerJobPoolPersistenceSchema } from "../../lib/career/job-pool/persistence-schema";
import { createJobPoolPostgresWorld, type JobPoolWorld } from "../career/job-pool/fixtures/job-pool-postgres-world";
import { validationPool } from "./fixtures/pool";

function resolvePlaywright(): string | null {
  const explicit = process.env.CONDYN_PLAYWRIGHT_MODULE;
  if (explicit !== undefined && explicit.length > 0) return explicit;
  try { return createRequire(resolve(process.cwd(), "package.json")).resolve("playwright"); } catch { return null; }
}
const playwrightModule = resolvePlaywright();
const liveKeyPresent = typeof process.env.GEMINI_API_KEY === "string" && process.env.GEMINI_API_KEY.length > 0;
const EVIDENCE_DIR = resolve(process.cwd(), "docs/architecture/decision-fields/evidence/job-pool-validation");
const PDF = resolve(process.cwd(), "docs/examples/cv.synthetic.pdf");

let world: JobPoolWorld;
let server: ChildProcess | undefined;
let worker: ChildProcess | undefined;
let port = 0;
let serverOutput = "";
let workerOutput = "";
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

async function stop(child: ChildProcess | undefined): Promise<void> {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  child.kill("SIGTERM");
  await Promise.race([once(child, "exit"), delay(10_000)]);
  if (child.exitCode === null && child.signalCode === null) { child.kill("SIGKILL"); await once(child, "exit"); }
}

/** Child environments carry the verified disposable URL only; no shared-database opt-in of any name is forwarded. */
function childEnvironment(extra: Record<string, string | undefined>): NodeJS.ProcessEnv {
  const inherited = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith("CONDYN_ALLOW_")));
  return { ...inherited, ...extra, DATABASE_URL: world.databaseUrl, NEXT_TELEMETRY_DISABLED: "1" };
}

describe.skipIf(playwrightModule === null || !liveKeyPresent)("PINK JP-LIVE: PDF → Gemini sweep → JSON Job Pool → matching in a real browser", () => {
  let browser: any;
  const pageErrors: string[] = [];
  const startedAt = Date.now();

  beforeAll(async () => {
    world = await createJobPoolPostgresWorld();
    await registerJobPoolPersistenceSchema(world.sql);
    port = await availablePort();
    server = spawn(process.execPath, [resolve(process.cwd(), "node_modules/next/dist/bin/next"), "dev", "--webpack", "-p", String(port), "-H", "127.0.0.1"], {
      cwd: process.cwd(), env: childEnvironment({}), stdio: ["ignore", "pipe", "pipe"]
    });
    server.stdout?.on("data", (chunk) => { serverOutput += String(chunk); });
    server.stderr?.on("data", (chunk) => { serverOutput += String(chunk); });
    worker = spawn(process.execPath, [resolve(process.cwd(), "node_modules/tsx/dist/cli.mjs"), resolve(process.cwd(), "scripts/run-career-worker.ts")], {
      cwd: process.cwd(), stdio: ["ignore", "pipe", "pipe"],
      env: childEnvironment({ PROMPT_ENCRYPTION_KEY: randomBytes(32).toString("base64"), CAREER_WORKER_ID: "pink-live-worker" })
    });
    worker.stdout?.on("data", (chunk) => { workerOutput += String(chunk); });
    worker.stderr?.on("data", (chunk) => { workerOutput += String(chunk); });
    for (let attempt = 0; attempt < 240; attempt += 1) {
      try { const response = await fetch(`${base()}/api/career/job-pools`); if (response.status === 200) { await response.json(); break; } } catch { /* not ready */ }
      await delay(500);
      if (attempt === 239) throw new Error(`server not ready:\n${serverOutput}`);
    }
    const playwright = await import(playwrightModule as string);
    browser = await playwright.chromium.launch({ headless: true });
    mkdirSync(EVIDENCE_DIR, { recursive: true });
  }, 300_000);

  afterAll(async () => {
    if (browser) await browser.close();
    await stop(worker);
    await stop(server);
    if (world) await world.destroy();
  }, 60_000);

  it("runs the real sweep from the browser and renders the unscored sweep coverage exactly as served", async () => {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    page.on("pageerror", (error: unknown) => pageErrors.push(String(error)));
    await page.goto(`${base()}/career/demo`, { waitUntil: "domcontentloaded", timeout: 120_000 });
    await page.getByTestId("guided-onboarding-overlay").waitFor({ timeout: 120_000 });
    await page.getByTestId("onboarding-close-btn").click();
    await page.getByTestId("guided-onboarding-overlay").waitFor({ state: "detached", timeout: 30_000 });

    // PDF into the source dock, then the real intake analysis through the production worker.
    await page.getByTestId("add-pdf-source-btn").click();
    await page.getByTestId("source-dock-file-input").setInputFiles(PDF);
    await page.locator('[data-testid="start-intake-analysis-btn"]:not([disabled])').waitFor({ timeout: 30_000 });
    const sweepStartedAt = Date.now();
    await page.getByTestId("start-intake-analysis-btn").click();
    await page.getByTestId("intake-success-banner").waitFor({ timeout: 480_000 });
    const sweepSeconds = Math.round((Date.now() - sweepStartedAt) / 1000);
    await page.screenshot({ path: resolve(EVIDENCE_DIR, "pink-02-live-sweep-completed.png") });

    await page.getByTestId("job-pool-panel-toggle").click();
    const panel = page.getByTestId("job-pool-panel");
    await panel.waitFor({ timeout: 30_000 });
    await page.locator('[data-testid="job-pool-panel"][data-analysis-source="JOB_RESULT"]').waitFor({ timeout: 30_000 });
    const analysisId = (await panel.getAttribute("data-analysis-id")) ?? "";
    expect(analysisId).toMatch(/^ANL_/);

    const poolPath = join(mkdtempSync(join(tmpdir(), "pink-live-pool-")), "pink-validation-pool.json");
    writeFileSync(poolPath, JSON.stringify(validationPool, null, 2));
    await page.getByTestId("job-pool-file-input").setInputFiles(poolPath);
    await page.getByTestId("job-pool-actor-input").fill("PINK_LIVE_WALK");
    await page.locator('[data-testid="job-pool-upload-btn"]:not([disabled])').waitFor({ timeout: 10_000 });
    await page.getByTestId("job-pool-upload-btn").click();
    const result = page.locator('[data-testid="job-pool-upload-result"][data-upload-outcome="CREATED"]');
    await result.waitFor({ timeout: 60_000 });
    const uploadId = (await result.getAttribute("data-upload-id")) ?? "";
    await page.getByTestId(`job-pool-select-${uploadId}`).click();
    await page.locator('[data-testid="job-pool-matches"][data-matches-state="AVAILABLE"]').waitFor({ timeout: 60_000 });

    // Oracle: the same server's bodies and the database behind it.
    const analysisResponse = await fetch(`${base()}/api/career/analyses/${analysisId}`);
    expect(analysisResponse.status).toBe(200);
    const matches = await (await fetch(`${base()}/api/career/job-pools/${uploadId}/matches?analysisId=${analysisId}`)).json();
    expect(matches.capabilitySweep.state).toBe("AVAILABLE");
    expect(matches.capabilitySweep.scored).toBe(false);
    expect(matches.capabilitySweep.proposalCount).toBeGreaterThan(0);

    const database = drizzle(world.sql);
    const reference = await new PostgresCapabilityProposalProjectionReferenceRepository(database as never).getByAnalysisId(analysisId);
    expect(reference).not.toBeNull();
    const projection = await createCapabilityProposalProjectionReader({ references: new PostgresCapabilityProposalProjectionReferenceRepository(database as never), capabilityRepository: new PostgresCapabilityCoreRepository(database as never) }).read(analysisId);
    expect(projection?.capabilities.length).toBe(matches.capabilitySweep.proposalCount);

    const sweep = page.getByTestId("job-pool-capability-sweep");
    expect(await sweep.getAttribute("data-sweep-state")).toBe("AVAILABLE");
    expect(await sweep.getAttribute("data-proposal-count")).toBe(String(matches.capabilitySweep.proposalCount));
    expect(await sweep.getAttribute("data-scored")).toBe("false");
    let coveredLines = 0;
    for (const role of matches.roleMatches as any[]) {
      const row = page.getByTestId(`job-pool-role-${role.poolRoleId}`);
      expect(await row.getAttribute("data-resonance-score")).toBe(String(role.resonanceScore));
      expect(await page.getByTestId(`job-pool-role-${role.poolRoleId}-sweep-only`).getAttribute("data-count")).toBe(String(role.sweepOnlyCoverageCount));
      for (const [kind, items] of [["matched", role.matched], ["weak", role.weakEvidence], ["missing", role.missing]] as const) {
        for (const item of items as any[]) {
          const line = page.getByTestId(`job-pool-role-${role.poolRoleId}-${kind}-${item.poolRequirementId}-sweep`);
          if (item.sweepProposal === null) { expect(await line.count()).toBe(0); continue; }
          coveredLines += 1;
          expect(await line.getAttribute("data-sweep-basis")).toBe(item.sweepProposal.matchBasis);
          expect(await line.getAttribute("data-proposal-id")).toBe(item.sweepProposal.capabilityProposalId);
          expect(await line.getAttribute("data-scored")).toBe("false");
          expect((await line.textContent()) ?? "").toContain(item.sweepProposal.name);
          expect(item.sweepProposal.scored).toBe(false);
          expect(item.sweepProposal.evidenceState).toBe("SOURCE_MATCH_VERIFIED");
          expect(item.sweepProposal.authorityState).toBe("NONE");
        }
      }
    }
    expect(await page.locator('[data-testid^="hr-decision-loop"]').count()).toBe(0);
    await page.screenshot({ path: resolve(EVIDENCE_DIR, "pink-03-live-sweep-coverage-in-panel.png") });
    expect(pageErrors).toEqual([]);

    writeFileSync(resolve(EVIDENCE_DIR, "pink-live-run.json"), `${JSON.stringify({
      recordedAt: new Date().toISOString(), tip: "b4091f5", database: world.databaseName, geminiModel: process.env.GEMINI_MODEL ?? "provider default cascade",
      analysisId, jobPoolUploadId: uploadId, sweepSeconds, totalSeconds: Math.round((Date.now() - startedAt) / 1000),
      capabilitySweep: matches.capabilitySweep, candidateCapabilityCount: matches.candidateCapabilityCount, renderedCoveredLines: coveredLines,
      roles: (matches.roleMatches as any[]).map((role) => ({ poolRoleId: role.poolRoleId, resonanceScore: role.resonanceScore, matched: role.matched.length, weak: role.weakEvidence.length, missing: role.missing.length, sweepOnlyCoverageCount: role.sweepOnlyCoverageCount })),
      workerFailedAttempts: (workerOutput.match(/failed attempt/gi) ?? []).length
    }, null, 2)}\n`);
    await page.close();
  }, 600_000);
});
