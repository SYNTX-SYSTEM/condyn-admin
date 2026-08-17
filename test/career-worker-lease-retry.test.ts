import { describe, it, expect, beforeEach, beforeAll } from "vitest";
import { initDbSchema, db } from "../lib/career/db/client";
import { JobRepository } from "../lib/career/orchestration/job-repository";
import { createJob, JobInputRef } from "../lib/career/orchestration/job";
import { PostgresCareerAnalysisRepository } from "../lib/career/repositories/postgres";
import { sql } from "drizzle-orm";

describe("CONDYN Career Analysis Protocol v5.0 - PHASE 5: WORKER CLAIM / LEASE / RETRY BOUNDARY (TEST005B)", () => {
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
    sourceData: "I am a test engineer."
  };

  const dummyCanonicalAnalysis = (id: string) => ({
    structured_data: {
      analysis: {
        metadata: {
          analysis_id: id,
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
  } as any);

  it("A. PENDING job -> Worker A claims -> RUNNING + lease", async () => {
    const job = createJob("CAREER_ANALYSIS", sampleInput);
    await repo.enqueueJob(job);

    const claimed = await repo.claimNextJob("worker-A", 10000);
    expect(claimed).toBeDefined();
    expect(claimed?.jobId).toBe(job.jobId);
    expect(claimed?.status).toBe("RUNNING");
    expect(claimed?.leaseOwner).toBe("worker-A");
    expect(claimed?.leaseVersion).toBe(1);
    expect(claimed?.attemptCount).toBe(1);
    expect(claimed?.leaseExpiresAt).toBeDefined();
  });

  it("B. two workers claim same single PENDING job concurrently -> exactly one receives it", async () => {
    const job = createJob("CAREER_ANALYSIS", sampleInput);
    await repo.enqueueJob(job);

    const claims = await Promise.all([
      repo.claimNextJob("worker-1", 10000),
      repo.claimNextJob("worker-2", 10000)
    ]);

    const successes = claims.filter(c => c !== null);
    expect(successes.length).toBe(1); // exactly one receives it
    expect(successes[0]?.leaseVersion).toBe(1);
  });

  it("C/D. Worker A lease expires -> Worker B reclaims -> reclaim increments leaseVersion", async () => {
    const job = createJob("CAREER_ANALYSIS", sampleInput);
    await repo.enqueueJob(job);

    // Claim with -1ms duration so it instantly expires
    const claimA = await repo.claimNextJob("worker-A", -1);
    expect(claimA?.leaseVersion).toBe(1);

    // Worker B reclaims
    const claimB = await repo.claimNextJob("worker-B", 10000);
    expect(claimB).toBeDefined();
    expect(claimB?.jobId).toBe(job.jobId);
    expect(claimB?.leaseOwner).toBe("worker-B");
    expect(claimB?.leaseVersion).toBe(2); // D. reclaim increments leaseVersion
    expect(claimB?.attemptCount).toBe(2);
  });

  it("E/F. stale Worker A completion -> ERR_STALE_JOB_LEASE / current Worker B completion -> SUCCEEDED", async () => {
    const job = createJob("CAREER_ANALYSIS", sampleInput);
    await repo.enqueueJob(job);

    const claimA = await repo.claimNextJob("worker-A", -1); // instantly expires
    const claimB = await repo.claimNextJob("worker-B", 10000);

    await canonRepo.save(dummyCanonicalAnalysis("ANA_B"));

    // E: Stale worker A tries to complete
    await expect(repo.updateJobState(
      job.jobId, "worker-A", claimA!.leaseVersion, "RUNNING", "SUCCEEDED", { resultAnalysisId: "ANA_B" }
    )).rejects.toThrow("ERR_STALE_JOB_LEASE");

    // F: Current worker B completes
    await repo.updateJobState(
      job.jobId, "worker-B", claimB!.leaseVersion, "RUNNING", "SUCCEEDED", { resultAnalysisId: "ANA_B" }
    );

    const loaded = await repo.getJob(job.jobId);
    expect(loaded?.status).toBe("SUCCEEDED");
  });

  it("G/H. heartbeat current lease -> extends lease / heartbeat stale lease -> rejected", async () => {
    const job = createJob("CAREER_ANALYSIS", sampleInput);
    await repo.enqueueJob(job);

    const claimA = await repo.claimNextJob("worker-A", -1);
    const claimB = await repo.claimNextJob("worker-B", 10000);

    // H: Stale worker A tries to heartbeat
    await expect(repo.heartbeatJob(job.jobId, "worker-A", claimA!.leaseVersion, 10000))
      .rejects.toThrow("ERR_STALE_JOB_LEASE");

    // G: Current worker B heartbeats
    const initialExpires = claimB!.leaseExpiresAt;
    
    // Slight delay to ensure new timestamp
    await new Promise(resolve => setTimeout(resolve, 5));
    await repo.heartbeatJob(job.jobId, "worker-B", claimB!.leaseVersion, 10000);

    const loaded = await repo.getJob(job.jobId);
    expect(loaded?.leaseExpiresAt).not.toBe(initialExpires); // Extended
  });

  it("M. attemptCount increments per execution claim, not heartbeat", async () => {
    const job = createJob("CAREER_ANALYSIS", sampleInput);
    await repo.enqueueJob(job);

    const claimA = await repo.claimNextJob("worker-A", 10000);
    expect(claimA?.attemptCount).toBe(1);

    await repo.heartbeatJob(job.jobId, "worker-A", claimA!.leaseVersion, 10000);
    await repo.heartbeatJob(job.jobId, "worker-A", claimA!.leaseVersion, 10000);

    const loaded = await repo.getJob(job.jobId);
    expect(loaded?.attemptCount).toBe(1); // attemptCount unaffected by heartbeat
  });

  it("N. multiple workers + multiple jobs -> no duplicate active lease generation", async () => {
    for (let i = 0; i < 20; i++) {
      await repo.enqueueJob(createJob("CAREER_ANALYSIS", sampleInput));
    }

    const workerClaims = Array.from({ length: 5 }, (_, i) => repo.claimNextJob(`worker-${i}`, 10000));
    const claims = await Promise.all(workerClaims);

    const successfulClaims = claims.filter(c => c !== null);
    expect(successfulClaims.length).toBe(5);

    const jobIds = new Set(successfulClaims.map(c => c?.jobId));
    expect(jobIds.size).toBe(5); // Each worker got a unique job
  });

  it("P. SUCCEEDED Job cannot be claimed again", async () => {
    const job = createJob("CAREER_ANALYSIS", sampleInput);
    await repo.enqueueJob(job);
    const claim = await repo.claimNextJob("worker-1", 10000);
    await canonRepo.save(dummyCanonicalAnalysis("ANA_DONE"));
    await repo.updateJobState(job.jobId, "worker-1", claim!.leaseVersion, "RUNNING", "SUCCEEDED", { resultAnalysisId: "ANA_DONE" });

    const emptyClaim = await repo.claimNextJob("worker-2", 10000);
    expect(emptyClaim).toBeNull();
  });

  it("J. retryable failure below max attempts -> eligible for retry", async () => {
    const job = createJob("CAREER_ANALYSIS", sampleInput);
    await repo.enqueueJob(job);
    
    const claim = await repo.claimNextJob("worker-1", 10000);
    await repo.failJob(job.jobId, "worker-1", claim!.leaseVersion, false, "TEMP_ERR", "Temporary error", 3);
    
    const loaded = await repo.getJob(job.jobId);
    expect(loaded?.status).toBe("PENDING");
    expect(loaded?.errorCode).toBe("TEMP_ERR");
    expect(loaded?.attemptCount).toBe(1);

    // Should be reclaimable
    const claim2 = await repo.claimNextJob("worker-2", 10000);
    expect(claim2).toBeDefined();
    expect(claim2?.jobId).toBe(job.jobId);
    expect(claim2?.attemptCount).toBe(2);
  });

  it("K. terminal failure -> FAILED", async () => {
    const job = createJob("CAREER_ANALYSIS", sampleInput);
    await repo.enqueueJob(job);
    
    const claim = await repo.claimNextJob("worker-1", 10000);
    // isTerminal = true
    await repo.failJob(job.jobId, "worker-1", claim!.leaseVersion, true, "BAD_INPUT", "Invalid input", 3);
    
    const loaded = await repo.getJob(job.jobId);
    expect(loaded?.status).toBe("FAILED");
    expect(loaded?.errorCode).toBe("BAD_INPUT");
  });

  it("L. max attempts reached -> FAILED", async () => {
    const job = createJob("CAREER_ANALYSIS", sampleInput);
    await repo.enqueueJob(job);
    
    // Attempt 1
    const claim1 = await repo.claimNextJob("worker-1", 10000);
    await repo.failJob(job.jobId, "worker-1", claim1!.leaseVersion, false, "ERR1", "Err1", 2); // max 2
    
    // Attempt 2
    const claim2 = await repo.claimNextJob("worker-2", 10000);
    await repo.failJob(job.jobId, "worker-2", claim2!.leaseVersion, false, "ERR2", "Err2", 2); // hits max
    
    const loaded = await repo.getJob(job.jobId);
    expect(loaded?.status).toBe("FAILED"); // Because attemptCount reached max
    expect(loaded?.errorCode).toBe("ERR2");

    // Should not be reclaimable
    const claim3 = await repo.claimNextJob("worker-3", 10000);
    expect(claim3).toBeNull();
  });

  it("O. crash after Analysis persistence but before Job completion -> retry/recovery yields one canonical result by checking determinism", async () => {
    const job = createJob("CAREER_ANALYSIS", sampleInput);
    await repo.enqueueJob(job);
    
    // Deterministic Canonical ID based on Job ID
    const deterministicAnalysisId = job.jobId.replace("JOB_", "ANL_");
    
    // Worker A claims
    const claimA = await repo.claimNextJob("worker-1", -1); // instantly expires
    
    // Worker A runs pipeline and saves canonical truth
    const canonicalAnalysis = dummyCanonicalAnalysis(deterministicAnalysisId);
    await canonRepo.save(canonicalAnalysis);
    
    // Worker A crashes BEFORE updateJobState(SUCCEEDED)
    
    // Worker B reclaims
    const claimB = await repo.claimNextJob("worker-2", 10000);
    expect(claimB).toBeDefined();
    
    // Worker B implements Recovery: Check Canonical Storage first!
    const recoveredAnalysis = await canonRepo.load(deterministicAnalysisId);
    
    expect(recoveredAnalysis).toBeDefined();
    expect(recoveredAnalysis?.structured_data.analysis.metadata.analysis_id).toBe(deterministicAnalysisId);
    
    // Worker B skips Gemini, directly binds the existing canonical analysis
    await repo.updateJobState(job.jobId, "worker-2", claimB!.leaseVersion, "RUNNING", "SUCCEEDED", { resultAnalysisId: deterministicAnalysisId });
    
    const loaded = await repo.getJob(job.jobId);
    expect(loaded?.status).toBe("SUCCEEDED");
    expect(loaded?.resultAnalysisId).toBe(deterministicAnalysisId);
    
    // Verify no divergent duplicates exist
    const allAnalyses = await canonRepo.list();
    expect(allAnalyses.length).toBe(1);
  });
});
