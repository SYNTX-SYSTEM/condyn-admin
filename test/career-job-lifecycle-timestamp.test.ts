import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { db } from "../lib/career/db/client";
import { careerAnalysisJobs, careerAnalyses } from "../lib/career/db/schema";
import { JobRepository } from "../lib/career/orchestration/job-repository";
import { createJob } from "../lib/career/orchestration/job";
import { eq } from "drizzle-orm";

describe("Job Lifecycle Timestamp Regression", () => {
  const repo = new JobRepository(db);

  beforeEach(async () => {
    await db.delete(careerAnalysisJobs);
    await db.delete(careerAnalyses);
  });
  
  afterAll(async () => {
    await db.delete(careerAnalysisJobs);
    await db.delete(careerAnalyses);
  });

  it("assigns completedAt when transitioning to SUCCEEDED", async () => {
    // 1. Create a job
    const job = createJob("CAREER_ANALYSIS", { sourceType: "TEST", sourceData: {} });
    await repo.enqueueJob(job);
    
    // 2. Claim the job (transitions to RUNNING)
    const claimedJob = await repo.claimNextJob("worker-A", 10000);
    expect(claimedJob).toBeDefined();
    expect(claimedJob!.status).toBe("RUNNING");
    expect(claimedJob!.completedAt).toBeNull();
    
    // 3. Create dummy canonical analysis to satisfy DB constraint
    const dummyAnalysis = {
      analysisId: "ANL_dummy",
      payload: {},
      createdAt: new Date().toISOString(),
      validationState: "VERIFIED",
      overallConfidence: 100
    };
    await db.insert(careerAnalyses).values(dummyAnalysis);

    // 4. Complete the job
    await repo.updateJobState(
      claimedJob!.jobId, 
      "worker-A", 
      claimedJob!.leaseVersion, 
      "RUNNING", 
      "SUCCEEDED", 
      { resultAnalysisId: "ANL_dummy" }
    );

    // 5. Verify completedAt is set
    const finalJob = await repo.getJob(claimedJob!.jobId);
    expect(finalJob!.status).toBe("SUCCEEDED");
    expect(finalJob!.completedAt).not.toBeNull();
  });
});
