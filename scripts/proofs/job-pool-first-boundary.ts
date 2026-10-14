import { spawn, type ChildProcess } from "node:child_process";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";

/**
 * Proof of the SFE invariant JOB POOL FIRST: no valid pool + selected job → no capability analysis.
 *
 * Runs only on a verified disposable test database. The analyze route handler is called in-process; the jobs are
 * processed by the REAL production worker process (scripts/run-career-worker.ts, spawned like hr-loop:local).
 * Refused jobs must leave no trace of processing (no source bundle, no capability run reference, no analysis).
 * One valid job goes through the unchanged pipeline to Gemini to show the analysis is ON with a valid selection.
 *
 *   DATABASE_URL=<disposable> GEMINI_API_KEY=… GEMINI_MODEL=… npx tsx scripts/proofs/job-pool-first-boundary.ts [--label name] [--skip-valid]
 * The sanitized result is written to docs/proofs/job-pool-first-boundary/<label>.json (no URLs, keys or local paths).
 */
const ROOT = resolve(__dirname, "../..");
const args = process.argv.slice(2);
const label = args.includes("--label") ? args[args.indexOf("--label") + 1] : `proof-${new Date().toISOString().replace(/[:.]/g, "-")}`;
const skipValid = args.includes("--skip-valid");
const MESSAGE = "Bitte wählen Sie einen Job aus.";

async function main() {
  const { verifyDisposableTestDatabase } = await import("../../lib/database-isolation/verification");
  const verified = await verifyDisposableTestDatabase(process.env.DATABASE_URL);
  const apiKey = process.env.GEMINI_API_KEY ?? "";
  const model = process.env.GEMINI_MODEL?.trim() ?? "";
  if (!apiKey || !model) throw new Error("ERR_PROOF_GEMINI_CONFIG: GEMINI_API_KEY and GEMINI_MODEL are required for the real worker.");

  const { db, initDbSchema } = await import("../../lib/career/db/client");
  const { ensureJobPoolPersistenceRegistration } = await import("../../lib/career/job-pool/local-composition");
  const { createJobPoolApplication } = await import("../../lib/career/job-pool/application");
  const { JobRepository } = await import("../../lib/career/orchestration/job-repository");
  const { createJob } = await import("../../lib/career/orchestration/job");
  const { POST } = await import("../../app/api/career/analyze/route");
  const { OTHER_POOL } = await import("../../test/support/job-scope");

  await initDbSchema();
  if (await ensureJobPoolPersistenceRegistration() !== "REGISTERED") throw new Error("ERR_PROOF_JOB_POOL_PERSISTENCE");
  const application = createJobPoolApplication({ database: drizzle(db.$client), analyses: { load: async () => null } });
  const engineeringRaw = readFileSync(resolve(ROOT, "docs/examples/job-pool-tests/DLL_JOBPOOL_ENGINEERING.json"), "utf8");
  const engineering = (await application.upload(engineeringRaw, "job-pool-first-proof")).view.jobPoolUploadId;
  const draftPool = JSON.parse(engineeringRaw); draftPool.pool.status = "DRAFT";
  const draft = (await application.upload(JSON.stringify(draftPool), "job-pool-first-proof")).view.jobPoolUploadId;
  const other = (await application.upload(JSON.stringify(OTHER_POOL), "job-pool-first-proof")).view.jobPoolUploadId;
  const kestrel = "role_kestrel_frontend_architect";
  const foreignRole = OTHER_POOL.roles[0].id;

  const jobs = new JobRepository(db);
  const count = async (query: ReturnType<typeof sql>) => Number(((await db.execute(query)) as unknown as Array<{ n: number }>)[0].n);
  const jobTotal = () => count(sql`SELECT count(*)::int AS n FROM career_analysis_jobs`);
  const documents = [{ type: "pdf", name: "cv.synthetic.pdf", content: readFileSync(resolve(ROOT, "docs/examples/cv.synthetic.pdf")).toString("base64") }];
  const post = async (body: unknown) => {
    const response = await POST(new Request("http://proof/api/career/analyze", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }));
    return { status: response.status, body: await response.json() };
  };
  const checks: Array<{ id: string; pass: boolean; observed: unknown }> = [];
  const check = (id: string, pass: boolean, observed: unknown) => { checks.push({ id, pass, observed }); console.log(`[proof] ${pass ? "PASS" : "FAIL"} ${id} ${JSON.stringify(observed)}`); };

  // Route boundary.
  const routeCases: Array<[string, unknown, number, string]> = [
    ["R1_NO_SELECTION", { documents }, 400, "ERR_JOB_SCOPE_REQUIRED"],
    ["R2_MALFORMED_SELECTION", { documents, jobScope: { poolRoleId: kestrel } }, 400, "ERR_JOB_SCOPE_REQUIRED"],
    ["R3_UNKNOWN_POOL", { documents, jobScope: { jobPoolUploadId: `JPOOL_${"0".repeat(32)}`, poolRoleId: kestrel } }, 422, "ERR_JOB_SCOPE_INVALID"],
    ["R4_INACTIVE_POOL", { documents, jobScope: { jobPoolUploadId: draft, poolRoleId: kestrel } }, 422, "ERR_JOB_SCOPE_INVALID"],
    ["R5_ROLE_OUTSIDE_POOL", { documents, jobScope: { jobPoolUploadId: engineering, poolRoleId: foreignRole } }, 422, "ERR_JOB_SCOPE_INVALID"]
  ];
  for (const [id, body, status, code] of routeCases) {
    const before = await jobTotal();
    const result = await post(body);
    const after = await jobTotal();
    check(id, result.status === status && result.body.issues?.[0]?.code === code && result.body.issues?.[0]?.message === MESSAGE && after === before, { status: result.status, issue: result.body.issues?.[0], enqueued: after - before });
  }

  // Worker boundary: jobs that bypass the route, plus one valid job through the route.
  const bypass: Array<[string, unknown, string]> = [
    ["W1_NO_SELECTION", { documents }, "ERR_JOB_SCOPE_REQUIRED"],
    ["W2_INACTIVE_POOL", { documents, jobScope: { jobPoolUploadId: draft, poolRoleId: kestrel } }, "ERR_JOB_SCOPE_INVALID"],
    ["W3_ROLE_OUTSIDE_POOL", { documents, jobScope: { jobPoolUploadId: other, poolRoleId: kestrel } }, "ERR_JOB_SCOPE_INVALID"]
  ];
  const bypassIds: string[] = [];
  for (const [, sourceData] of bypass) {
    const job = createJob("CAREER_ANALYSIS", { sourceType: "BATCH", sourceData });
    await jobs.enqueueJob(job);
    bypassIds.push(job.jobId);
  }
  let validJobId: string | null = null;
  if (!skipValid) {
    const accepted = await post({ documents, jobScope: { jobPoolUploadId: engineering, poolRoleId: kestrel } });
    check("R6_VALID_SELECTION_ACCEPTED", accepted.status === 202 && typeof accepted.body.jobId === "string", { status: accepted.status });
    validJobId = accepted.body.jobId;
  }

  const workerLog: string[] = [];
  const worker: ChildProcess = spawn(process.execPath, [resolve(ROOT, "node_modules/tsx/dist/cli.mjs"), resolve(ROOT, "scripts/run-career-worker.ts")], {
    cwd: ROOT,
    env: { ...process.env, PROMPT_ENCRYPTION_KEY: randomBytes(32).toString("base64"), CAREER_WORKER_ID: "job-pool-first-proof-worker" },
    stdio: ["ignore", "pipe", "pipe"]
  });
  const capture = (chunk: Buffer) => { for (const line of chunk.toString().split("\n")) if (/CLAIMED|FAILED|worker started|Career worker PID/i.test(line)) workerLog.push(line.replace(/postgres(ql)?:\/\/\S+/g, "<url>")); };
  worker.stdout?.on("data", capture);
  worker.stderr?.on("data", capture);

  const terminal = async (jobId: string, timeoutMs: number) => {
    const deadline = Date.now() + timeoutMs;
    for (;;) {
      const job = await jobs.getJob(jobId);
      if (job && (job.status === "SUCCEEDED" || job.status === "FAILED")) return job;
      if (Date.now() > deadline) return job;
      await new Promise(done => setTimeout(done, 1_000));
    }
  };
  try {
    for (const [index, [id, , code]] of bypass.entries()) {
      const jobId = bypassIds[index];
      const job = await terminal(jobId, 60_000);
      const traces = {
        sourceBundle: await count(sql`SELECT count(*)::int AS n FROM candidate_source_bundles WHERE candidate_source_bundle_id = ${`CSB_${jobId}`}`),
        projectionReference: await count(sql`SELECT count(*)::int AS n FROM career_capability_proposal_projection_references WHERE job_id = ${jobId}`),
        analysis: await count(sql`SELECT count(*)::int AS n FROM career_analyses WHERE analysis_id = ${jobId.replace("JOB_", "ANL_")}`)
      };
      check(id, job?.status === "FAILED" && job.errorCode === code && job.errorSummary === MESSAGE && job.attemptCount === 1 && job.currentOperation === null && traces.sourceBundle === 0 && traces.projectionReference === 0 && traces.analysis === 0,
        { status: job?.status, errorCode: job?.errorCode, errorSummary: job?.errorSummary, attemptCount: job?.attemptCount, currentOperation: job?.currentOperation, processingTraces: traces });
    }
    if (validJobId) {
      const job = await terminal(validJobId, 420_000);
      const reference = await count(sql`SELECT count(*)::int AS n FROM career_capability_proposal_projection_references WHERE job_id = ${validJobId}`);
      const analysis = job?.resultAnalysisId ? await count(sql`SELECT count(*)::int AS n FROM career_analyses WHERE analysis_id = ${job.resultAnalysisId}`) : 0;
      check("V1_VALID_SELECTION_ANALYZED", job?.status === "SUCCEEDED" && reference === 1 && analysis === 1, { status: job?.status, errorCode: job?.errorCode ?? null, capabilitySweepReference: reference, analysis });
    }
  } finally {
    worker.kill("SIGTERM");
  }

  const summary = {
    invariant: "JOB POOL FIRST — no valid pool + selected job → no capability analysis",
    label, gitSha: process.env.PROOF_GIT_SHA ?? null, database: `disposable test database ${verified.databaseName} (dropped after the run)`, model,
    pools: { engineering: { jobPoolUploadId: engineering, status: "ACTIVE" }, engineeringDraft: { jobPoolUploadId: draft, status: "DRAFT" }, validation: { jobPoolUploadId: other, status: "ACTIVE" } },
    worker: "scripts/run-career-worker.ts (real process)", workerLog, checks, passed: checks.every(item => item.pass)
  };
  const text = `${JSON.stringify(summary, null, 2)}\n`.split(ROOT).join("<repo>");
  if (apiKey.length >= 8 && text.includes(apiKey)) throw new Error("ERR_PROOF_SECRET_IN_SUMMARY");
  await mkdir(resolve(ROOT, "docs/proofs/job-pool-first-boundary"), { recursive: true });
  await writeFile(resolve(ROOT, "docs/proofs/job-pool-first-boundary", `${label}.json`), text);
  console.log(`[proof] ${summary.passed ? "ALL CHECKS PASSED" : "CHECKS FAILED"} — docs/proofs/job-pool-first-boundary/${label}.json`);
  await db.$client.end({ timeout: 5 });
  process.exitCode = summary.passed ? 0 : 2;
}

main().catch(error => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
