import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { db, initDbSchema } from "../../../lib/career/db/client";
import { POST } from "../../../app/api/career/analyze/route";
import { JobRepository } from "../../../lib/career/orchestration/job-repository";
import { createJob, type JobRecord } from "../../../lib/career/orchestration/job";
import { CareerJobWorker } from "../../../lib/career/orchestration/worker";
import { createJobPoolApplication } from "../../../lib/career/job-pool/application";
import { JOB_SCOPE_REQUIRED_MESSAGE, requireValidJobScope } from "../../../lib/career/job-scope";
import { createLocalJobScopeResolver } from "../../../lib/career/job-scope/local-resolver";
import { ENGINEERING_POOL_RAW, OTHER_POOL, TEST_JOB_SCOPE, TEST_JOB_SCOPE_B, uploadEngineeringJobScope } from "../../support/job-scope";

/** SFE invariant JOB POOL FIRST on PostgreSQL: route and worker boundaries, without Gemini. */
const post = (body: unknown, headers: Record<string, string> = {}) =>
  POST(new Request("http://local/api/career/analyze", { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body) }));
const documents = [{ type: "text", content: "Implemented the React dashboard used by 300 dispatchers." }];
const jobCount = async () => Number(((await db.execute(sql`SELECT count(*)::int AS n FROM career_analysis_jobs`)) as unknown as Array<{ n: number }>)[0].n);
const refusal = (code: string) => ({ success: false, status: "FAILED", issues: [{ code, message: JOB_SCOPE_REQUIRED_MESSAGE }] });

let draftPoolUploadId = "";
let otherPool: { jobPoolUploadId: string; poolRoleId: string };

describe("JOB POOL FIRST — analyze route and Career worker (PostgreSQL, no Gemini)", () => {
  beforeAll(async () => {
    await initDbSchema();
    await uploadEngineeringJobScope();
    const application = createJobPoolApplication({ database: drizzle(db.$client), analyses: { load: async () => null } });
    // The same pool stored as DRAFT: a real, stored and mapped upload that is not ACTIVE.
    const draft = JSON.parse(ENGINEERING_POOL_RAW);
    draft.pool.status = "DRAFT";
    draftPoolUploadId = (await application.upload(JSON.stringify(draft), "job-pool-first-test")).view.jobPoolUploadId;
    // A second ACTIVE pool, to select a role that exists only there.
    // A second ACTIVE pool (owned by these tests, not shared with other suites), to select a role that exists only there.
    const other = await application.upload(JSON.stringify(OTHER_POOL), "job-pool-first-test");
    otherPool = { jobPoolUploadId: other.view.jobPoolUploadId, poolRoleId: OTHER_POOL.roles[0].id };
  });
  beforeEach(async () => { await db.execute(sql`DELETE FROM career_analysis_jobs`); });
  afterAll(async () => { await db.execute(sql`DELETE FROM career_analysis_jobs`); });

  it("route: no selection → 400 ERR_JOB_SCOPE_REQUIRED, nothing enqueued", async () => {
    for (const body of [{ documents }, { documents, jobScope: null }, { documents, jobScope: {} }, { documents, jobScope: { poolRoleId: TEST_JOB_SCOPE.poolRoleId } }, { documents, jobScope: { ...TEST_JOB_SCOPE, extra: true } }]) {
      const response = await post(body);
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual(refusal("ERR_JOB_SCOPE_REQUIRED"));
    }
    expect(await jobCount()).toBe(0);
  });

  it("route: unknown pool, inactive pool, role outside the selected pool → 422 ERR_JOB_SCOPE_INVALID, nothing enqueued", async () => {
    for (const jobScope of [
      { ...TEST_JOB_SCOPE, jobPoolUploadId: `JPOOL_${"0".repeat(32)}` },
      { jobPoolUploadId: draftPoolUploadId, poolRoleId: TEST_JOB_SCOPE.poolRoleId },
      { ...TEST_JOB_SCOPE, poolRoleId: "role_not_in_pool" },
      { jobPoolUploadId: TEST_JOB_SCOPE.jobPoolUploadId, poolRoleId: otherPool.poolRoleId },
      { jobPoolUploadId: otherPool.jobPoolUploadId, poolRoleId: TEST_JOB_SCOPE.poolRoleId }
    ]) {
      const response = await post({ documents, jobScope });
      expect(response.status, JSON.stringify(jobScope)).toBe(422);
      expect(await response.json()).toEqual(refusal("ERR_JOB_SCOPE_INVALID"));
    }
    expect(await jobCount()).toBe(0);
  });

  it("route: document validation stays first", async () => {
    const response = await post({ documents: [] });
    expect(response.status).toBe(400);
    expect((await response.json()).issues[0].code).toBe("ERR_NO_DOCUMENTS");
  });

  it("route: valid pool + selected job → 202, the selection is part of the durable input", async () => {
    for (const jobScope of [TEST_JOB_SCOPE, TEST_JOB_SCOPE_B, otherPool]) {
      const response = await post({ documents, jobScope });
      expect(response.status).toBe(202);
      const { jobId } = await response.json();
      expect(((await new JobRepository(db).getJob(jobId))!.inputRef.sourceData as { jobScope: unknown }).jobScope).toEqual(jobScope);
    }
    expect(await jobCount()).toBe(3);
  });

  it("route: idempotency holds for the two-key payload regardless of key order (JSONB reorders keys)", async () => {
    const key = { "idempotency-key": "job-pool-first-idem" };
    const first = await (await post({ documents, jobScope: TEST_JOB_SCOPE }, key)).json();
    const again = await post({ jobScope: TEST_JOB_SCOPE, documents }, key);
    expect(again.status).toBe(202);
    expect((await again.json()).jobId).toBe(first.jobId);
    expect((await post({ documents, jobScope: TEST_JOB_SCOPE_B }, key)).status).toBe(409);
  });

  async function workerIteration(sourceData: unknown) {
    const repository = new JobRepository(db);
    const enqueued = createJob("CAREER_ANALYSIS", { sourceType: "BATCH", sourceData });
    await repository.enqueueJob(enqueued);
    const reached: string[] = [];
    // Stand-in for the unchanged Career processor (source preparation, sweep, Gemini): it records that it was reached.
    const processor = async (job: JobRecord) => {
      reached.push(job.jobId);
      throw Object.assign(new Error("PROCESSOR_REACHED"), { name: "TERMINAL_ERROR", code: "PROCESSOR_REACHED" });
    };
    const worker = new CareerJobWorker("job-pool-first-worker", repository, requireValidJobScope(createLocalJobScopeResolver(), processor), 10_000, 30_000);
    const internals = worker as unknown as { isRunning: boolean; loop(): Promise<void> };
    internals.isRunning = true;
    await internals.loop();
    worker.stop();
    return { job: (await repository.getJob(enqueued.jobId))!, processorReached: reached.length };
  }

  it("worker: an enqueued job without selection (bypassing the route) fails terminally and never reaches the processor", async () => {
    const result = await workerIteration({ documents });
    expect([result.job.status, result.job.errorCode, result.job.errorSummary, result.job.attemptCount, result.processorReached]).toEqual(["FAILED", "ERR_JOB_SCOPE_REQUIRED", JOB_SCOPE_REQUIRED_MESSAGE, 1, 0]);
  });

  it("worker: an enqueued job with an inactive pool or a foreign role fails terminally and never reaches the processor", async () => {
    for (const jobScope of [{ jobPoolUploadId: draftPoolUploadId, poolRoleId: TEST_JOB_SCOPE.poolRoleId }, { jobPoolUploadId: TEST_JOB_SCOPE.jobPoolUploadId, poolRoleId: otherPool.poolRoleId }]) {
      const result = await workerIteration({ documents, jobScope });
      expect([result.job.status, result.job.errorCode, result.job.errorSummary, result.job.attemptCount, result.processorReached]).toEqual(["FAILED", "ERR_JOB_SCOPE_INVALID", JOB_SCOPE_REQUIRED_MESSAGE, 1, 0]);
    }
  });

  it("worker: a job with a valid pool + selected job reaches the processor", async () => {
    const result = await workerIteration({ documents, jobScope: TEST_JOB_SCOPE });
    expect([result.job.errorCode, result.processorReached]).toEqual(["PROCESSOR_REACHED", 1]);
  });
});
