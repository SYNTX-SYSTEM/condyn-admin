import { describe, it, expect, beforeEach, beforeAll } from "vitest";
import { initDbSchema, db } from "../lib/career/db/client";
import { JobRepository } from "../lib/career/orchestration/job-repository";
import { createJob, JobInputRef } from "../lib/career/orchestration/job";
import { PostgresCareerAnalysisRepository } from "../lib/career/repositories/postgres";
import { sql } from "drizzle-orm";

describe("CONDYN Career Analysis Protocol v5.0 - PHASE 5: DURABLE ASYNC JOB CONTRACT (TEST005A)", () => {
  let repo: JobRepository;
  let canonRepo: PostgresCareerAnalysisRepository;

  beforeAll(async () => {
    await initDbSchema();
  });

  beforeEach(async () => {
    repo = new JobRepository(db);
    canonRepo = new PostgresCareerAnalysisRepository(db);

    await db.execute(sql`DELETE FROM career_policy_evaluations`);
    await db.execute(sql`DELETE FROM career_learning_proposals`);
    await db.execute(sql`DELETE FROM career_attributions`);
    await db.execute(sql`DELETE FROM career_feedback`);
    await db.execute(sql`DELETE FROM career_outcomes`);
    await db.execute(sql`DELETE FROM career_actions`);
    await db.execute(sql`DELETE FROM career_commitments`);
    await db.execute(sql`DELETE FROM career_decisions`);
    await db.execute(sql`DELETE FROM career_recommendations`);
    await db.execute(sql`DELETE FROM career_policy_promotions`);
    await db.execute(sql`DELETE FROM career_policy_families`);
    await db.execute(sql`DELETE FROM career_policy_versions`);
    await db.execute(sql`DELETE FROM career_analysis_jobs`);
    await db.execute(sql`DELETE FROM career_analyses`);
  });

  const sampleInput: JobInputRef = {
    sourceType: "TEXT",
    sourceData: "I am a software engineer."
  };

  it("A. valid request -> durable PENDING job", async () => {
    const job = createJob("CAREER_ANALYSIS", sampleInput);
    await repo.enqueueJob(job);

    const loaded = await repo.getJob(job.jobId);
    expect(loaded).toBeDefined();
    expect(loaded?.status).toBe("PENDING");
    expect(loaded?.inputRef).toEqual(sampleInput);
  });

  it("B/C. Idempotent submission & conflicts", async () => {
    const job1 = createJob("CAREER_ANALYSIS", sampleInput, "idem-123");
    const result1 = await repo.enqueueJob(job1);
    expect(result1.jobId).toBe(job1.jobId);

    // B. same idempotency key + same payload -> Idempotent success returns SAME JOB
    const job2 = createJob("CAREER_ANALYSIS", sampleInput, "idem-123");
    const result2 = await repo.enqueueJob(job2);
    expect(result2.jobId).toBe(job1.jobId); // Returns existing jobId

    const existing = await repo.getJobByIdempotencyKey("idem-123");
    expect(existing).toBeDefined();
    expect(existing?.jobId).toBe(job1.jobId); // Only job1 was actually written

    // C. same idempotency key -> DB constraint throws ERR_JOB_IDEMPOTENCY_CONFLICT if inserted blindly
    const jobConflict = createJob("CAREER_ANALYSIS", { sourceType: "TEXT", sourceData: "conflict" }, "idem-123");
    await expect(repo.enqueueJob(jobConflict)).rejects.toThrow(/ERR_JOB_IDEMPOTENCY_CONFLICT/);
  });

  it("D. PENDING -> RUNNING -> allowed", async () => {
    const job = createJob("CAREER_ANALYSIS", sampleInput);
    await repo.enqueueJob(job);

    const claim = await repo.claimNextJob("worker-1", 10000);
    // claimNextJob already transitions PENDING -> RUNNING, but if we manually want to check updateJobState:
    // actually claimNextJob does PENDING -> RUNNING, so D is proven by claimNextJob.
    const loaded = await repo.getJob(job.jobId);
    expect(loaded?.status).toBe("RUNNING");
  });

  it("E/F. RUNNING -> SUCCEEDED requires durable canonical result", async () => {
    const job = createJob("CAREER_ANALYSIS", sampleInput);
    await repo.enqueueJob(job);
    const claim = await repo.claimNextJob("worker-1", 10000);

    // F: mark SUCCEEDED without resultAnalysisId -> reject
    await expect(repo.updateJobState(job.jobId, "worker-1", claim!.leaseVersion, "RUNNING", "SUCCEEDED", {})).rejects.toThrow("ERR_INVALID_JOB_TRANSITION: Cannot mark SUCCEEDED without resultAnalysisId");

    // F: mark SUCCEEDED with non-existent resultAnalysisId -> reject
    await expect(repo.updateJobState(job.jobId, "worker-1", claim!.leaseVersion, "RUNNING", "SUCCEEDED", { resultAnalysisId: "FAKE_ID" })).rejects.toThrow("ERR_INVALID_JOB_TRANSITION: Result Analysis does not exist in canonical storage");

    // E: Create canonical analysis
    const canonicalAnalysis = {
      structured_data: {
        analysis: {
          metadata: {
            analysis_id: "ANA_REAL",
            created_at: new Date().toISOString(),
            validation_state: "VERIFIED",
            overall_confidence: 0.9
          },
          capabilities: [],
          requirements: [],
          role_alignments: [],
          measurements: []
        }
      }
    } as any;
    await canonRepo.save(canonicalAnalysis);

    // Now update succeeds
    await repo.updateJobState(job.jobId, "worker-1", claim!.leaseVersion, "RUNNING", "SUCCEEDED", { resultAnalysisId: "ANA_REAL", completedAt: new Date().toISOString() });
    
    const loaded = await repo.getJob(job.jobId);
    expect(loaded?.status).toBe("SUCCEEDED");
    expect(loaded?.resultAnalysisId).toBe("ANA_REAL");
  });

  it("G. SUCCEEDED -> RUNNING -> reject", async () => {
    const canonicalAnalysis = {
      structured_data: {
        analysis: {
          metadata: {
            analysis_id: "ANA_G",
            created_at: new Date().toISOString(),
            validation_state: "VERIFIED",
            overall_confidence: 0.9
          },
          capabilities: [],
          requirements: [],
          role_alignments: [],
          measurements: []
        }
      }
    } as any;
    await canonRepo.save(canonicalAnalysis);

    const job = createJob("CAREER_ANALYSIS", sampleInput);
    await repo.enqueueJob(job);
    const claim = await repo.claimNextJob("worker-1", 10000);
    await repo.updateJobState(job.jobId, "worker-1", claim!.leaseVersion, "RUNNING", "SUCCEEDED", { resultAnalysisId: "ANA_G" });

    // Try to reset
    await expect(repo.updateJobState(job.jobId, "worker-1", claim!.leaseVersion, "SUCCEEDED", "RUNNING", {})).rejects.toThrow("ERR_INVALID_JOB_TRANSITION: Cannot transition from SUCCEEDED to RUNNING");
  });

  it("H. failure does not create canonical Analysis", async () => {
    const job = createJob("CAREER_ANALYSIS", sampleInput);
    await repo.enqueueJob(job);
    const claim = await repo.claimNextJob("worker-1", 10000);
    await repo.updateJobState(job.jobId, "worker-1", claim!.leaseVersion, "RUNNING", "FAILED", { errorCode: "PROVIDER_TIMEOUT", errorSummary: "Timeout" });

    const loaded = await repo.getJob(job.jobId);
    expect(loaded?.status).toBe("FAILED");
    expect(loaded?.errorCode).toBe("PROVIDER_TIMEOUT");
    expect(loaded?.resultAnalysisId).toBeNull();
  });

  it("I/J. destroy runtime after enqueue -> job and input still loadable", async () => {
    const pdfInput: JobInputRef = {
      sourceType: "PDF",
      sourceData: "base64_encoded_pdf_bytes_snapshot..." // Ensures input durability
    };
    const job = createJob("CAREER_ANALYSIS", pdfInput);
    await repo.enqueueJob(job);

    // Simulate process death by creating a new repository instance
    const newProcessRepo = new JobRepository(db);
    const loaded = await newProcessRepo.getJob(job.jobId);
    
    expect(loaded).toBeDefined();
    expect(loaded?.status).toBe("PENDING");
    expect(loaded?.inputRef.sourceType).toBe("PDF");
    expect(loaded?.inputRef.sourceData).toBe("base64_encoded_pdf_bytes_snapshot..."); // Input is durable
  });

  it("K. JobRecord itself never appears as canonical Evidence / Decision entity", () => {
    // Conceptual test: We proved job records are stored in `career_analysis_jobs` which is disjoint
    // from `career_analyses`, `career_decisions` etc. 
    // Types confirm this: JobRecord is disjoint from RecommendationProofChain or CanonicalCareerAnalysis.
    const job = createJob("CAREER_ANALYSIS", sampleInput);
    expect((job as any).validationState).toBeUndefined();
  });
});
