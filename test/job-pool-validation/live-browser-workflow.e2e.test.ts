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
import { decodeAnalysisSources } from "../../lib/career/job-pool/analysis-sources";
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
  const env: NodeJS.ProcessEnv = { ...process.env, ...extra, DATABASE_URL: world.databaseUrl, NEXT_TELEMETRY_DISABLED: "1" };
  for (const key of Object.keys(env)) if (key.startsWith("CONDYN_ALLOW_")) delete env[key];
  return env;
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

    // SFE job-scope invariant (GRÜN, 2026-10-14): ANALYZE needs a selected job. So the pool is uploaded and selected in the
    // SYNTX field first, one role is selected as the job, and only then the PDF is analysed (with exactly that jobScope).
    await page.locator('[data-testid="job-scope-indicator"][data-job-scope-state="NONE"]').waitFor({ timeout: 30_000 });
    await page.getByTestId("job-pool-panel-toggle").click();
    const field = page.getByTestId("syntx-field");
    await field.waitFor({ timeout: 30_000 });

    // Intake is an edge aperture opened on explicit action; the upload is persisted, listed and not selected; selection is explicit.
    await page.getByTestId("job-pool-intake-toggle").click();
    await page.getByTestId("job-pool-upload").waitFor({ state: "visible", timeout: 10_000 });
    const poolPath = join(mkdtempSync(join(tmpdir(), "pink-live-pool-")), "pink-validation-pool.json");
    writeFileSync(poolPath, JSON.stringify(validationPool, null, 2));
    await page.getByTestId("job-pool-file-input").setInputFiles(poolPath);
    await page.getByTestId("job-pool-actor-input").fill("PINK_LIVE_WALK");
    await page.locator('[data-testid="job-pool-upload-btn"]:not([disabled])').waitFor({ timeout: 10_000 });
    await page.getByTestId("job-pool-upload-btn").click();
    const result = page.locator('[data-testid="job-pool-upload-result"][data-upload-outcome="CREATED"]');
    await result.waitFor({ timeout: 60_000 });
    const uploadId = (await result.getAttribute("data-upload-id")) ?? "";
    expect(await field.getAttribute("data-field-state")).toBe("NO_POOL");
    await page.getByTestId(`job-pool-select-${uploadId}`).click();
    await page.locator('[data-testid="syntx-field"][data-field-state="NO_ANALYSIS"]').waitFor({ timeout: 90_000 });
    await page.getByTestId("job-pool-intake-toggle").click();

    // The job: one role of the selected pool, selected explicitly at its role level; the shell names it in both fields.
    // Role moons at the field level are not interactive: organization first, then its (orbiting) role card, clicked at its centre.
    const scopedRoleId = String(validationPool.roles[0].id);
    const scopedOrganizationId = String(validationPool.roles[0].organization_id);
    const centreClick = async (testId: string) => { const box = await page.getByTestId(testId).boundingBox(); await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2); };
    await centreClick(`syntx-organization-${scopedOrganizationId}`);
    await page.locator(`[data-testid="syntx-field"][data-observation-kind="ORGANIZATION"][data-observation-id="${scopedOrganizationId}"]`).waitFor({ timeout: 15_000 });
    await page.waitForTimeout(1_200);
    await centreClick(`syntx-role-${scopedRoleId}`);
    await page.locator(`[data-testid="syntx-field"][data-observation-kind="ROLE"][data-observation-id="${scopedRoleId}"]`).waitFor({ timeout: 15_000 });
    await page.getByTestId("syntx-job-scope-select").click();
    await page.locator('[data-testid="job-scope-indicator"][data-job-scope-state="VALID"]').waitFor({ timeout: 30_000 });
    await page.getByTestId("syntx-exit-btn").click();
    await page.locator('[data-testid="semantic-career-intelligence-field"][data-field-focus="CAPABILITY"]').waitFor({ timeout: 15_000 });
    expect(await page.getByTestId("job-scope-indicator").getAttribute("data-job-scope-state")).toBe("VALID");

    // PDF into the source dock, then the real intake analysis through the production worker, scoped to that job.
    await page.getByTestId("add-pdf-source-btn").click();
    await page.getByTestId("source-dock-file-input").setInputFiles(PDF);
    await page.locator('[data-testid="start-intake-analysis-btn"]:not([disabled])').waitFor({ timeout: 30_000 });
    const sweepStartedAt = Date.now();
    const analyzeRequest = page.waitForRequest((request: any) => request.method() === "POST" && request.url().endsWith("/api/career/analyze"));
    await page.getByTestId("start-intake-analysis-btn").click();
    expect(JSON.parse((await analyzeRequest).postData() ?? "{}").jobScope).toEqual({ jobPoolUploadId: uploadId, poolRoleId: scopedRoleId });
    await page.getByTestId("intake-success-banner").waitFor({ timeout: 480_000 });
    const sweepSeconds = Math.round((Date.now() - sweepStartedAt) / 1000);
    await page.screenshot({ path: resolve(EVIDENCE_DIR, "pink-02-live-sweep-completed.png") });

    // The SYNTX field (434ef49): the strip toggle opens the one field; the analysis of this session is its source.
    await page.getByTestId("job-pool-panel-toggle").click();
    await field.waitFor({ timeout: 30_000 });
    await page.locator('[data-testid="syntx-field"][data-analysis-source="JOB_RESULT"]').waitFor({ timeout: 30_000 });
    const analysisId = (await field.getAttribute("data-analysis-id")) ?? "";
    expect(analysisId).toMatch(/^ANL_/);
    await page.locator('[data-testid="syntx-field"][data-field-state="AVAILABLE"][data-sources-state="AVAILABLE"]').waitFor({ timeout: 90_000 });

    // Oracle: the same server's bodies and the database behind it.
    const analysisResponse = await fetch(`${base()}/api/career/analyses/${analysisId}`);
    expect(analysisResponse.status).toBe(200);
    const analysisSources = decodeAnalysisSources(analysisId, await analysisResponse.json());
    const matches = await (await fetch(`${base()}/api/career/job-pools/${uploadId}/matches?analysisId=${analysisId}`)).json();
    expect(matches.capabilitySweep.state).toBe("AVAILABLE");
    expect(matches.capabilitySweep.scored).toBe(false);
    expect(matches.capabilitySweep.proposalCount).toBeGreaterThan(0);

    const database = drizzle(world.sql);
    const reference = await new PostgresCapabilityProposalProjectionReferenceRepository(database as never).getByAnalysisId(analysisId);
    expect(reference).not.toBeNull();
    const projection = await createCapabilityProposalProjectionReader({ references: new PostgresCapabilityProposalProjectionReferenceRepository(database as never), capabilityRepository: new PostgresCapabilityCoreRepository(database as never) }).read(analysisId);
    expect(projection?.capabilities.length).toBe(matches.capabilitySweep.proposalCount);

    // The boundary aperture names the sweep state unscored (D-06); it is folded until asked for.
    expect(await page.getByTestId("job-pool-matches").isVisible()).toBe(false);
    await page.getByTestId("syntx-boundary-toggle").click();
    await page.getByTestId("job-pool-matches").waitFor({ state: "visible", timeout: 10_000 });
    const sweep = page.getByTestId("job-pool-capability-sweep");
    expect(await sweep.getAttribute("data-sweep-state")).toBe("AVAILABLE");
    expect(await sweep.getAttribute("data-proposal-count")).toBe(String(matches.capabilitySweep.proposalCount));
    expect(await sweep.getAttribute("data-scored")).toBe("false");
    await page.getByTestId("syntx-boundary-toggle").click();
    await page.getByTestId("job-pool-matches").waitFor({ state: "hidden", timeout: 10_000 });

    /** A trace is clicked on its visible line (absolute viewport coordinates; the camera's CSS transform is not in getScreenCTM). */
    const alongTrace = (locator: any, fraction: number) => locator.evaluate((element: Element, fraction: number) => {
      const line = element.querySelector("line:not([data-sx-hit])") as SVGLineElement;
      const rect = line.getBoundingClientRect();
      const dx = line.x2.baseVal.value - line.x1.baseVal.value;
      const dy = line.y2.baseVal.value - line.y1.baseVal.value;
      const a = { x: dx >= 0 ? rect.left : rect.right, y: dy >= 0 ? rect.top : rect.bottom };
      const b = { x: dx >= 0 ? rect.right : rect.left, y: dy >= 0 ? rect.bottom : rect.top };
      return { x: a.x + (b.x - a.x) * fraction, y: a.y + (b.y - a.y) * fraction };
    }, fraction);
    const settled = async () => {
      const deadline = Date.now() + 10_000;
      while (Date.now() < deadline) {
        const running = await field.evaluate((element: Element) => element.getAnimations({ subtree: true }).filter((animation: any) => animation.playState === "running" && !String(animation.animationName ?? "").startsWith("sxSuspend")).length);
        if (running === 0) break;
        await page.waitForTimeout(120);
      }
      await page.waitForTimeout(200);
    };

    // Sweep coverage is a dotted trace per delivered proposal quote (covers_unscored / trace_dotted, R5): PCAP_* as proof, EVD_* only on the exact projection join, never scored.
    let renderedDottedTraces = 0;
    let inspectedSweep = false;
    for (const role of matches.roleMatches as any[]) {
      const covered = [...role.matched, ...role.weakEvidence, ...role.missing].filter((item: any) => item.sweepProposal !== null);
      if (covered.length === 0) continue;
      await page.getByTestId(`syntx-role-${role.poolRoleId}`).click();
      await page.locator(`[data-testid="syntx-field"][data-observation-kind="ROLE"][data-observation-id="${role.poolRoleId}"]`).waitFor({ timeout: 15_000 });
      expect(await page.locator('[data-testid^="syntx-requirement-"][data-support="SWEEP_ONLY"]').count()).toBe(role.sweepOnlyCoverageCount);
      expect(await page.locator('[data-sign-manifestation="trace_dotted"]').count()).toBe(covered.reduce((sum: number, item: any) => sum + item.sweepProposal.evidence.length, 0));
      for (const item of covered) {
        expect(item.sweepProposal.scored).toBe(false);
        expect(item.sweepProposal.evidenceState).toBe("SOURCE_MATCH_VERIFIED");
        expect(item.sweepProposal.authorityState).toBe("NONE");
        for (const [index, quote] of (item.sweepProposal.evidence as any[]).entries()) {
          const trace = page.getByTestId(`syntx-trace-trace:${item.poolRequirementId}:covers_unscored:${quote.docId}:${index}`);
          expect(await trace.count()).toBe(1);
          renderedDottedTraces += 1;
          expect(await trace.getAttribute("data-sign-source")).toBe("gemini_sweep");
          expect(await trace.getAttribute("data-sign-relation")).toBe("covers_unscored");
          expect(await trace.getAttribute("data-sign-manifestation")).toBe("trace_dotted");
          expect(await trace.getAttribute("data-proof-capability-id")).toBe(item.sweepProposal.capabilityProposalId);
          expect(await trace.getAttribute("data-proof-doc-id")).toBe(quote.docId);
          expect(await trace.getAttribute("data-proof-analysis-id")).toBe(analysisId);
          const joined = analysisSources.proposalEvidence.find((candidate) => candidate.capabilityProposalId === item.sweepProposal.capabilityProposalId && candidate.docId === quote.docId && candidate.quote === quote.quote) ?? null;
          expect(await trace.getAttribute("data-proof-evidence-id")).toBe(joined === null ? null : joined.evidenceId);
        }
      }
      if (!inspectedSweep) {
        const item = covered[0];
        const quote = item.sweepProposal.evidence[0];
        const trace = page.getByTestId(`syntx-trace-trace:${item.poolRequirementId}:covers_unscored:${quote.docId}:0`);
        await settled();
        const point = await alongTrace(trace, 0.72);
        await page.mouse.click(point.x, point.y);
        await page.locator('[data-testid="syntx-field"][data-aperture-open="true"]').waitFor({ timeout: 10_000 });
        const aperture = page.getByTestId("syntx-aperture");
        expect(await aperture.getAttribute("data-sign-relation")).toBe("covers_unscored");
        expect(await aperture.getAttribute("data-aperture-kind")).toBe("trace");
        expect(await page.getByTestId("syntx-aperture-quote").textContent()).toContain(quote.quote);
        expect(await page.getByTestId("syntx-aperture-sweep-status").getAttribute("data-scored")).toBe("false");
        expect(((await page.getByTestId("syntx-aperture-sweep-status").textContent()) ?? "").toLowerCase()).toContain("unscored");
        expect(await aperture.textContent()).toContain("A capability sweep proposal covers this requirement with a source-verified quote; it is not scored and not canonically evaluated.");
        expect(await aperture.textContent()).toContain(item.sweepProposal.name);
        expect(await page.getByTestId("syntx-aperture-contribution").count()).toBe(0);
        expect((await aperture.textContent()) ?? "").not.toMatch(/\d+(\.\d+)?\s?%/);
        await settled();
        await page.screenshot({ path: resolve(EVIDENCE_DIR, "pink-03-live-sweep-aperture.png") });
        await page.keyboard.press("Escape");
        await page.locator('[data-testid="syntx-field"][data-aperture-open="false"]').waitFor({ timeout: 10_000 });
        inspectedSweep = true;
      }
      await page.getByTestId("syntx-path-FIELD").click();
      await page.locator('[data-testid="syntx-field"][data-observation-kind="FIELD"]').waitFor({ timeout: 15_000 });
    }
    expect(renderedDottedTraces).toBeGreaterThan(0);
    expect(await page.locator('[data-testid^="hr-decision-loop"]').count()).toBe(0);
    await page.screenshot({ path: resolve(EVIDENCE_DIR, "pink-03-live-sweep-coverage-in-field.png") });
    expect(pageErrors).toEqual([]);

    writeFileSync(resolve(EVIDENCE_DIR, "pink-live-run.json"), `${JSON.stringify({
      recordedAt: new Date().toISOString(), tip: "434ef49", database: world.databaseName, geminiModel: process.env.GEMINI_MODEL ?? "provider default cascade",
      analysisId, jobPoolUploadId: uploadId, sweepSeconds, totalSeconds: Math.round((Date.now() - startedAt) / 1000),
      capabilitySweep: matches.capabilitySweep, candidateCapabilityCount: matches.candidateCapabilityCount, renderedDottedTraces,
      roles: (matches.roleMatches as any[]).map((role) => ({ poolRoleId: role.poolRoleId, resonanceScore: role.resonanceScore, matched: role.matched.length, weak: role.weakEvidence.length, missing: role.missing.length, sweepOnlyCoverageCount: role.sweepOnlyCoverageCount })),
      workerFailedAttempts: (workerOutput.match(/failed attempt/gi) ?? []).length
    }, null, 2)}\n`);
    await page.close();
  }, 600_000);
});
