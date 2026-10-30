import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { db, initDbSchema } from "../../../lib/career/db/client";
import { careerAnalyses } from "../../../lib/career/db/schema";
import { JobRepository } from "../../../lib/career/orchestration/job-repository";
import { createJob, type JobRecord } from "../../../lib/career/orchestration/job";
import { CareerJobWorker } from "../../../lib/career/orchestration/worker";

/** The automatic match hangs on the worker AFTER the job succeeded; it can never change the job (PostgreSQL, no model). */
/** The canonical analysis must exist before a job may be marked SUCCEEDED (unchanged rule of the repository). */
const made: string[] = [];
const succeeds = async (job: JobRecord) => {
  const analysisId = job.jobId.replace("JOB_", "ANL_");
  made.push(analysisId);
  await db.insert(careerAnalyses).values({ analysisId, createdAt: new Date().toISOString(), validationState: "VERIFIED", payload: { structured_data: {} } });
  return { resultAnalysisId: analysisId };
};

async function iteration(processor: (job: JobRecord) => Promise<{ resultAnalysisId: string }>, afterSuccess?: (job: JobRecord, id: string) => Promise<void>) {
  const repository = new JobRepository(db);
  const enqueued = createJob("CAREER_ANALYSIS", { sourceType: "BATCH", sourceData: { documents: [] } });
  await repository.enqueueJob(enqueued);
  const worker = new CareerJobWorker("after-success-worker", repository, processor, 10_000, 30_000, afterSuccess);
  const internals = worker as unknown as { isRunning: boolean; loop(): Promise<void> };
  internals.isRunning = true;
  await internals.loop();
  worker.stop();
  return { job: (await repository.getJob(enqueued.jobId))!, repository, enqueued };
}

describe("worker afterSuccess hook", () => {
  beforeAll(async () => { await initDbSchema(); });
  const clean = async () => { await db.execute(sql`DELETE FROM career_analysis_jobs`); for (const id of made.splice(0)) await db.execute(sql`DELETE FROM career_analyses WHERE analysis_id = ${id}`); };
  beforeEach(clean);
  afterAll(clean);

  it("runs once after SUCCEEDED, with the result analysis id, and sees the job already SUCCEEDED", async () => {
    const seen: Array<{ id: string; status: string }> = [];
    let repo: JobRepository | null = null;
    const { job, repository } = await iteration(succeeds, async (j, id) => {
      repo = new JobRepository(db);
      seen.push({ id, status: (await repo.getJob(j.jobId))!.status });
    });
    expect(job.status).toBe("SUCCEEDED");
    expect(seen).toEqual([{ id: job.jobId.replace("JOB_", "ANL_"), status: "SUCCEEDED" }]);
    expect(repository).toBeInstanceOf(JobRepository);
  });

  it("a failing hook leaves the job SUCCEEDED and the loop alive", async () => {
    const { job } = await iteration(succeeds, async () => { throw new Error("ERR_AUTO_MATCH_BOOM: details that stay in the log"); });
    expect(job.status).toBe("SUCCEEDED");
    expect((job as unknown as { resultAnalysisId?: string }).resultAnalysisId ?? job.jobId.replace("JOB_", "ANL_")).toContain("ANL_");
  });

  it("is not called when the analysis failed, and absent hook changes nothing", async () => {
    let called = 0;
    const failed = await iteration(async () => { throw Object.assign(new Error("boom"), { name: "TERMINAL_ERROR", code: "X" }); }, async () => { called += 1; });
    expect(failed.job.status).toBe("FAILED");
    expect(called).toBe(0);
    await clean();
    const plain = await iteration(succeeds);
    expect(plain.job.status).toBe("SUCCEEDED");
  });
});
