import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import { db } from "../lib/career/db/client";
import { careerAnalysisJobs, careerAnalyses } from "../lib/career/db/schema";
import { JobRepository } from "../lib/career/orchestration/job-repository";
import { PostgresCareerAnalysisRepository } from "../lib/career/repositories/postgres";
import { createJob } from "../lib/career/orchestration/job";
import { eq } from "drizzle-orm";
import { prepareDocuments } from "../lib/career/orchestration/document-loader";
import { executeCareerAnalysisPipeline } from "../lib/career/pipeline";
import { MockInferenceProvider } from "../lib/career/adapter";

describe("Worker Recovery Pipeline Invariant", () => {
  const jobRepo = new JobRepository(db);
  const canonRepo = new PostgresCareerAnalysisRepository(db);
  const provider = new MockInferenceProvider();

  beforeEach(async () => {
    await db.delete(careerAnalysisJobs);
    await db.delete(careerAnalyses);
  });
  
  afterAll(async () => {
    await db.delete(careerAnalysisJobs);
    await db.delete(careerAnalyses);
  });

  // This is the exact processJob function from scripts/run-career-worker.ts
  const createProcessJob = (workerId: string) => async (job: any) => {
    const deterministicAnalysisId = job.jobId.replace("JOB_", "ANL_");
    
    const existing = await canonRepo.load(deterministicAnalysisId);
    if (existing) {
      return { resultAnalysisId: deterministicAnalysisId, pipelineExecuted: false };
    }

    const { normalizedDocs } = await prepareDocuments(job.inputRef.sourceData.documents);
    const validationResult = await executeCareerAnalysisPipeline(normalizedDocs, provider, { explicitAnalysisId: deterministicAnalysisId });
    
    if (!validationResult.success) {
      throw new Error(validationResult.errors?.map((e: any) => e.message).join(", ") || "Validation failed");
    }
    
    const verifiedAnalysis = validationResult.data as any;
    const resultAnalysisId = verifiedAnalysis.structured_data.analysis.metadata.analysis_id;
    
    await canonRepo.save(verifiedAnalysis);
    
    return { resultAnalysisId, pipelineExecuted: true };
  };

  it("skips pipeline execution if canonical analysis already exists", async () => {
    const job = createJob("CAREER_ANALYSIS", { 
      sourceType: "TEXT", 
      sourceData: { documents: [{ type: "text", content: "Test engineer" }] } 
    });
    await jobRepo.enqueueJob(job);
    
    // Worker A claims job
    const claimA = await jobRepo.claimNextJob("worker-A", 10000);
    const processJobA = createProcessJob("worker-A");
    
    // Worker A executes pipeline
    const resultA = await processJobA(claimA);
    expect(resultA.pipelineExecuted).toBe(true);
    
    // WORKER A CRASHES HERE (before updateJobState)
    // Simulate lease expiry by clearing leaseOwner
    await db.update(careerAnalysisJobs)
      .set({ leaseExpiresAt: new Date(Date.now() - 10000).toISOString() })
      .where(eq(careerAnalysisJobs.jobId, job.jobId));
      
    // Worker B reclaims job
    const claimB = await jobRepo.claimNextJob("worker-B", 10000);
    expect(claimB!.leaseVersion).toBe(2);
    expect(claimB!.attemptCount).toBe(2);
    
    // Worker B executes pipeline
    const processJobB = createProcessJob("worker-B");
    const resultB = await processJobB(claimB);
    
    // Verification
    expect(resultB.pipelineExecuted).toBe(false); // Invariant 1: Skipped
    expect(resultB.resultAnalysisId).toBe(resultA.resultAnalysisId); // Same ID
    
    await jobRepo.updateJobState(
      job.jobId, 
      "worker-B", 
      claimB!.leaseVersion, 
      "RUNNING", 
      "SUCCEEDED", 
      { resultAnalysisId: resultB.resultAnalysisId }
    );
    
    const finalJob = await jobRepo.getJob(job.jobId);
    expect(finalJob!.status).toBe("SUCCEEDED");
    
    const allAnalyses = await canonRepo.list();
    expect(allAnalyses.length).toBe(1); // Exactly one canonical analysis remains
  });
});
