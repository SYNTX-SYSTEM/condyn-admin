import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { db, initDbSchema } from "../../../lib/career/db/client";
import { POST } from "../../../app/api/career/analyze/route";
import { JobRepository } from "../../../lib/career/orchestration/job-repository";
import { createJob, type JobRecord } from "../../../lib/career/orchestration/job";
import { CareerJobWorker } from "../../../lib/career/orchestration/worker";
import { INVESTIGATION_INVALID_MESSAGE, isIssuedPersonInvestigation, modeOfBoundary, type AnalysisBoundary } from "../../../lib/career/investigation";
import { JOB_SCOPE_REQUIRED_MESSAGE, requireValidJobScope } from "../../../lib/career/job-scope";
import { createLocalJobScopeResolver } from "../../../lib/career/job-scope/local-resolver";
import { TEST_JOB_SCOPE, uploadEngineeringJobScope } from "../../support/job-scope";

/** Three investigation modes on PostgreSQL: the analyze route and the real Career worker loop, without Gemini. */
const post = (body: unknown) =>
  POST(new Request("http://local/api/career/analyze", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }));
const documents = [{ type: "text", content: "Implemented the React dashboard used by 300 dispatchers." }];
const jobCount = async () => Number(((await db.execute(sql`SELECT count(*)::int AS n FROM career_analysis_jobs`)) as unknown as Array<{ n: number }>)[0].n);

async function workerIteration(sourceData: unknown) {
  const repository = new JobRepository(db);
  const enqueued = createJob("CAREER_ANALYSIS", { sourceType: "BATCH", sourceData });
  await repository.enqueueJob(enqueued);
  const reached: Array<"PERSON" | "PERSON_X_JOB"> = [];
  // Stand-in for the unchanged Career processor: it records the issued boundary it received.
  const processor = async (_job: JobRecord, _report: unknown, boundary: AnalysisBoundary) => {
    reached.push(modeOfBoundary(boundary));
    expect(isIssuedPersonInvestigation(boundary) || boundary.selection !== undefined).toBe(true);
    throw Object.assign(new Error("PROCESSOR_REACHED"), { name: "TERMINAL_ERROR", code: "PROCESSOR_REACHED" });
  };
  const worker = new CareerJobWorker("investigation-worker", repository, requireValidJobScope(createLocalJobScopeResolver(), processor), 10_000, 30_000);
  const internals = worker as unknown as { isRunning: boolean; loop(): Promise<void> };
  internals.isRunning = true;
  await internals.loop();
  worker.stop();
  return { job: (await repository.getJob(enqueued.jobId))!, reached };
}

describe("three investigation modes — analyze route and worker (PostgreSQL, no Gemini)", () => {
  beforeAll(async () => { await initDbSchema(); await uploadEngineeringJobScope(); });
  beforeEach(async () => { await db.execute(sql`DELETE FROM career_analysis_jobs`); });
  afterAll(async () => { await db.execute(sql`DELETE FROM career_analysis_jobs`); });

  it("PERSON: 202 without any job scope; the declaration is part of the durable input", async () => {
    const response = await post({ documents, investigation: { mode: "PERSON" } });
    expect(response.status).toBe(202);
    const { jobId } = await response.json();
    const stored = await new JobRepository(db).getJob(jobId);
    expect(stored?.inputRef.sourceData).toEqual({ documents, investigation: { mode: "PERSON" } });
  });

  it("PERSON_X_JOB declared or undeclared with a valid scope: 202 as before", async () => {
    expect((await post({ documents, investigation: { mode: "PERSON_X_JOB" }, jobScope: TEST_JOB_SCOPE })).status).toBe(202);
    expect((await post({ documents, jobScope: TEST_JOB_SCOPE })).status).toBe(202);
  });

  it("refusals enqueue nothing: undeclared without scope keeps the job-scope sentence; contradictions and JOB are investigation errors", async () => {
    const cases: Array<[unknown, number, string, string]> = [
      [{ documents }, 400, "ERR_JOB_SCOPE_REQUIRED", JOB_SCOPE_REQUIRED_MESSAGE],
      [{ documents, investigation: { mode: "PERSON_X_JOB" } }, 400, "ERR_JOB_SCOPE_REQUIRED", JOB_SCOPE_REQUIRED_MESSAGE],
      [{ documents, investigation: { mode: "PERSON" }, jobScope: TEST_JOB_SCOPE }, 400, "ERR_INVESTIGATION_INVALID", INVESTIGATION_INVALID_MESSAGE],
      [{ documents, investigation: { mode: "JOB" } }, 400, "ERR_INVESTIGATION_MODE_NOT_ANALYZABLE", INVESTIGATION_INVALID_MESSAGE],
      [{ documents, investigation: "PERSON" }, 400, "ERR_INVESTIGATION_INVALID", INVESTIGATION_INVALID_MESSAGE],
      [{ documents, investigation: { mode: "PERSON", jobScope: TEST_JOB_SCOPE } }, 400, "ERR_INVESTIGATION_INVALID", INVESTIGATION_INVALID_MESSAGE]
    ];
    for (const [body, status, code, message] of cases) {
      const response = await post(body);
      expect([response.status, await response.json()]).toEqual([status, { success: false, status: "FAILED", issues: [{ code, message }] }]);
    }
    expect(await jobCount()).toBe(0);
  });

  it("worker: PERSON reaches the processor with an issued person investigation; PERSON_X_JOB with its scope", async () => {
    const person = await workerIteration({ documents, investigation: { mode: "PERSON" } });
    expect([person.job.errorCode, person.reached]).toEqual(["PROCESSOR_REACHED", ["PERSON"]]);
    const scoped = await workerIteration({ documents, investigation: { mode: "PERSON_X_JOB" }, jobScope: TEST_JOB_SCOPE });
    expect([scoped.job.errorCode, scoped.reached]).toEqual(["PROCESSOR_REACHED", ["PERSON_X_JOB"]]);
  });

  it("worker: a contradictory or JOB declaration that bypassed the route fails terminally before the processor", async () => {
    for (const [sourceData, code] of [[{ documents, investigation: { mode: "PERSON" }, jobScope: TEST_JOB_SCOPE }, "ERR_INVESTIGATION_INVALID"], [{ documents, investigation: { mode: "JOB" } }, "ERR_INVESTIGATION_MODE_NOT_ANALYZABLE"]] as const) {
      const result = await workerIteration(sourceData);
      expect([result.job.status, result.job.errorCode, result.job.errorSummary, result.job.attemptCount, result.reached]).toEqual(["FAILED", code, INVESTIGATION_INVALID_MESSAGE, 1, []]);
    }
  });
});
