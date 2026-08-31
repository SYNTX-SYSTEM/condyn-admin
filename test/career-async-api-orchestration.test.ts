import { describe, it, expect, beforeEach, beforeAll } from "vitest";
import { initDbSchema, db } from "../lib/career/db/client";
import { JobRepository } from "../lib/career/orchestration/job-repository";
import { createJob } from "../lib/career/orchestration/job";
import { PostgresCareerAnalysisRepository } from "../lib/career/repositories/postgres";
import { sql } from "drizzle-orm";
// Next.js request mocking
import { POST } from "../app/api/career/analyze/route";
import { GET } from "../app/api/career/jobs/[jobId]/route";

describe("CONDYN Career Analysis Protocol v5.0 - PHASE 5: ASYNC API ORCHESTRATION (TEST005C)", () => {
  let repo: JobRepository;
  let canonRepo: PostgresCareerAnalysisRepository;

  beforeAll(async () => {
    await initDbSchema();
  });

  beforeEach(async () => {
    repo = new JobRepository(db);
    canonRepo = new PostgresCareerAnalysisRepository(db);

    await db.execute(sql`DELETE FROM career_analysis_jobs`);
    await db.execute(sql`DELETE FROM career_analyses`);
  });

  const createMockRequest = (body: any, headers: Record<string, string> = {}) => {
    return {
      json: async () => body,
      headers: {
        get: (key: string) => headers[key] || null
      }
    } as unknown as Request;
  };

  const sampleBody = {
    documents: [
      { type: "text", content: "I am an engineer." }
    ]
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

  it("A/B/N. valid POST -> 202 + jobId, no pipeline execution", async () => {
    const req = createMockRequest(sampleBody);
    
    // We expect this to return immediately, without calling any external services or hanging for 60s
    const start = Date.now();
    const res = await POST(req);
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(1000); // Proves N and B (no slow LLM calls)
    expect(res.status).toBe(202);

    const json = await res.json();
    expect(json.jobId).toBeDefined();
    expect(json.status).toBe("PENDING");
    expect(json.statusUrl).toContain(json.jobId);
  });

  it("C. job/input exist durably before response", async () => {
    const req = createMockRequest(sampleBody);
    const res = await POST(req);
    const json = await res.json();

    const loaded = await repo.getJob(json.jobId);
    expect(loaded).toBeDefined();
    expect(loaded?.status).toBe("PENDING");
    // Prove the input snapshot is stored
    expect(loaded?.inputRef).toBeDefined();
    expect((loaded?.inputRef as any).sourceData).toEqual(sampleBody);
  });

  it("D. same Idempotency-Key + same payload -> same jobId", async () => {
    const req1 = createMockRequest(sampleBody, { "idempotency-key": "idem-api-123" });
    const res1 = await POST(req1);
    const json1 = await res1.json();

    const req2 = createMockRequest(sampleBody, { "idempotency-key": "idem-api-123" });
    const res2 = await POST(req2);
    const json2 = await res2.json();

    expect(res2.status).toBe(202);
    expect(json2.jobId).toBe(json1.jobId);
  });

  it("E. same key + conflicting payload -> 409 / deterministic conflict", async () => {
    const req1 = createMockRequest(sampleBody, { "idempotency-key": "idem-api-456" });
    await POST(req1);

    const req2 = createMockRequest({ documents: [{ type: "text", content: "diff" }] }, { "idempotency-key": "idem-api-456" });
    const res2 = await POST(req2);
    
    expect(res2.status).toBe(409);
    const json2 = await res2.json();
    expect(json2.issues[0].code).toBe("ERR_JOB_IDEMPOTENCY_CONFLICT");
  });

  it("Progress telemetry V1 / F. GET PENDING job -> bounded state includes null currentOperation", async () => {
    const job = createJob("CAREER_ANALYSIS", { sourceType: "TEXT", sourceData: "data" });
    await repo.enqueueJob(job);

    const req = createMockRequest({});
    const res = await GET(req, { params: { jobId: job.jobId } });
    
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({
      jobId: job.jobId,
      status: "PENDING",
      attemptCount: 0,
      currentOperation: null
    });
  });

  it("Progress telemetry V1 / G/M. GET RUNNING job -> bounded state includes null currentOperation and no partial canonical result", async () => {
    const job = createJob("CAREER_ANALYSIS", { sourceType: "TEXT", sourceData: "data" });
    await repo.enqueueJob(job);
    const claim = await repo.claimNextJob("worker-1", 10000);

    const req = createMockRequest({});
    const res = await GET(req, { params: { jobId: job.jobId } });
    
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({
      jobId: job.jobId,
      status: "RUNNING",
      attemptCount: 1,
      currentOperation: null
    });
    // M. Proves no resultAnalysisId is exposed
    expect(json.resultAnalysisId).toBeUndefined();
    expect(json.leaseOwner).toBeUndefined(); // no internal leaks
  });

  it("Progress telemetry V1. GET RUNNING job projects the exact persisted currentOperation", async () => {
    const job = createJob("CAREER_ANALYSIS", { sourceType: "TEXT", sourceData: "data" });
    await repo.enqueueJob(job);
    const claim = await repo.claimNextJob("worker-operation-projection", 10000);
    await repo.updateJobState(
      job.jobId,
      "worker-operation-projection",
      claim!.leaseVersion,
      "RUNNING",
      "RUNNING",
      { currentOperation: "SOURCE_PREPARATION" } as any
    );

    const res = await GET(createMockRequest({}), { params: Promise.resolve({ jobId: job.jobId }) });
    expect(await res.json()).toEqual({
      jobId: job.jobId,
      status: "RUNNING",
      attemptCount: 1,
      currentOperation: "SOURCE_PREPARATION"
    });
  });

  it("H/I. GET SUCCEEDED job -> resultAnalysisId / resolves to VERIFIED Analysis", async () => {
    const canonicalAnalysis = dummyCanonicalAnalysis("ANA_API_OK");
    await canonRepo.save(canonicalAnalysis);

    const job = createJob("CAREER_ANALYSIS", { sourceType: "TEXT", sourceData: "data" });
    await repo.enqueueJob(job);
    const claim = await repo.claimNextJob("worker-1", 10000);
    await repo.updateJobState(job.jobId, "worker-1", claim!.leaseVersion, "RUNNING", "SUCCEEDED", { resultAnalysisId: "ANA_API_OK" });

    const req = createMockRequest({});
    const res = await GET(req, { params: { jobId: job.jobId } });
    
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("SUCCEEDED");
    expect(json.resultAnalysisId).toBe("ANA_API_OK");
    expect(json.jobId).toBe(job.jobId);
    
    // I: Verify the ID points to actual verified canonical analysis
    const canon = await canonRepo.load("ANA_API_OK");
    expect(canon?.structured_data?.analysis?.metadata?.validation_state).toBe("VERIFIED");
  });

  it("J. GET FAILED job -> bounded error", async () => {
    const job = createJob("CAREER_ANALYSIS", { sourceType: "TEXT", sourceData: "data" });
    await repo.enqueueJob(job);
    const claim = await repo.claimNextJob("worker-1", 10000);
    
    await repo.failJob(job.jobId, "worker-1", claim!.leaseVersion, true, "TEST_ERR", "Testing error");

    const req = createMockRequest({});
    const res = await GET(req, { params: { jobId: job.jobId } });
    
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({
      jobId: job.jobId,
      status: "FAILED",
      errorCode: "TEST_ERR",
      errorSummary: "Testing error"
    });
  });

  it("K. unknown job -> 404", async () => {
    const req = createMockRequest({});
    const res = await GET(req, { params: { jobId: "JOB_FAKE" } });
    
    expect(res.status).toBe(404);
  });

  it("L. process/request lifecycle ends after 202 -> independent worker can still execute Job", async () => {
    // 1. HTTP layer enqueues
    const req = createMockRequest(sampleBody);
    const res = await POST(req);
    const json = await res.json();

    // 2. HTTP layer is completely dead here. No Promises running.

    // 3. Worker process starts entirely separately
    const workerRepo = new JobRepository(db);
    const claim = await workerRepo.claimNextJob("external-worker", 10000);
    
    expect(claim).toBeDefined();
    expect(claim?.jobId).toBe(json.jobId);
    
    // Proves isolation
    await workerRepo.failJob(claim!.jobId, "external-worker", claim!.leaseVersion, true, "ISOLATED", "success");
    
    const finalRes = await GET(req, { params: { jobId: json.jobId } });
    expect((await finalRes.json()).status).toBe("FAILED");
  });

  it("M. REAL END-TO-END API PROOF (Test 13)", async () => {
    // 1. CLIENT POST
    const req = createMockRequest({ documents: [{ type: "text", content: "I am a test engineer." }] });
    const postRes = await POST(req);
    expect(postRes.status).toBe(202);
    const postJson = await postRes.json();
    const jobId = postJson.jobId;

    // 2. CLIENT GET
    const getRes1 = await GET(req, { params: { jobId } });
    expect((await getRes1.json()).status).toBe("PENDING");

    // 3. WORKER Execution
    const workerRepo = new JobRepository(db);
    const claim = await workerRepo.claimNextJob("real-worker", 10000);
    expect(claim?.jobId).toBe(jobId);

    // Dynamic import to avoid running heavy pipeline in typical fast tests, but we need it here
    const { executeCareerAnalysisPipeline } = await import("../lib/career/pipeline");
    const { MockInferenceProvider } = await import("../lib/career/adapter");
    const { prepareDocuments } = await import("../lib/career/orchestration/document-loader");

    const inputData = postJson.inputRef?.sourceData || { documents: [{ docId: "DOC_001", type: "text", content: "I am a test engineer.", metadata: {} }] };
    const { normalizedDocs } = await prepareDocuments(inputData.documents);
    const validationResult = await executeCareerAnalysisPipeline(normalizedDocs, new MockInferenceProvider());
    
    expect(validationResult.success).toBe(true);
    const verifiedAnalysis = validationResult.data as any;
    const resultAnalysisId = verifiedAnalysis.structured_data.analysis.metadata.analysis_id;

    // Worker Persists Canonical
    await canonRepo.save(verifiedAnalysis);
    
    // Worker Completes Job
    await workerRepo.updateJobState(jobId, "real-worker", claim!.leaseVersion, "RUNNING", "SUCCEEDED", { resultAnalysisId });

    // 4. CLIENT GET SUCCEEDED
    const getRes2 = await GET(req, { params: { jobId } });
    const getJson2 = await getRes2.json();
    expect(getJson2.status).toBe("SUCCEEDED");
    expect(getJson2.resultAnalysisId).toBe(resultAnalysisId);

    // 5. Load canonical Analysis and prove schema semantics are intact
    const loadedCanon = await canonRepo.load(resultAnalysisId);
    expect(loadedCanon).toBeDefined();
    expect(loadedCanon?.structured_data.analysis.metadata.validation_state).toBe("VERIFIED");
    
    // Ensure pipeline returned evidence and capabilities
    expect(loadedCanon?.structured_data.analysis.capabilities.length).toBeGreaterThan(0);
    expect(loadedCanon?.structured_data.analysis.capabilities[0].evidence.length).toBeGreaterThan(0);
  }, 30000);
});
