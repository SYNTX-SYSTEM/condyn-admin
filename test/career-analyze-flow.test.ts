import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST } from "../app/api/career/analyze/route";
import * as providers from "../lib/career/providers";
import { MockInferenceProvider } from "../lib/career/adapter";

describe("CONDYN Career Analysis Protocol v1.0 - Step 7.2: Server Boundary API Route", () => {
  beforeEach(async () => {
    vi.spyOn(providers, "getCareerInferenceProvider").mockReturnValue(new MockInferenceProvider());
    const { db } = await import("../lib/career/db/client");
    const { sql } = await import("drizzle-orm");
    await db.execute(sql`DELETE FROM career_analysis_jobs`);
  });
  it("should reject empty document array with HTTP 400 Bad Request", async () => {
    const req = new Request("http://localhost:3000/api/career/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documents: [] })
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.status).toBe("FAILED");
    expect(body.issues).toBeDefined();
    expect(body.issues[0].message).toContain("No documents provided");
  });

  it("should reject document with empty content string with HTTP 400 Bad Request", async () => {
    const req = new Request("http://localhost:3000/api/career/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        documents: [{ title: "Empty Resume", content: "   " }]
      })
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.status).toBe("FAILED");
    expect(body.issues[0].message).toContain("Document content cannot be empty");
  });

  it("should execute pipeline via MockInferenceProvider, verify schema, save to demo persistence, and return pre-computed reactFlowGraph", async () => {
    const sampleText = `
    Senior Cloud Systems Architect with 10 years of experience in distributed systems and Kubernetes.
    Led engineering teams at Siemens AG and BMW Group.
    Specialized in high-throughput event-driven microservices.
    `;

    const req = new Request("http://localhost:3000/api/career/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        documents: [{ title: "Cloud Architect CV", content: sampleText }]
      })
    });

    const res = await POST(req);
    expect(res.status).toBe(202);

    const body = await res.json();
    expect(body.jobId).toBeDefined();

    // Independent worker processing
    const { JobRepository } = await import("../lib/career/orchestration/job-repository");
    const { db } = await import("../lib/career/db/client");
    const { prepareDocuments } = await import("../lib/career/orchestration/document-loader");
    const { executeCareerAnalysisPipeline } = await import("../lib/career/pipeline");
    const { PostgresCareerAnalysisRepository } = await import("../lib/career/repositories/postgres");
    
    const jobRepo = new JobRepository(db);
    const claim = await jobRepo.claimNextJob("test-worker", 10000);
    expect(claim).toBeDefined();
    
    const { normalizedDocs } = await prepareDocuments(claim!.inputRef.sourceData.documents);
    const provider = providers.getCareerInferenceProvider();
    const validationResult = await executeCareerAnalysisPipeline(normalizedDocs, provider);
    const verifiedAnalysis = validationResult.data as any;
    const resultAnalysisId = verifiedAnalysis.structured_data.analysis.metadata.analysis_id;
    
    const { getCareerAnalysisRepository } = await import("../lib/career/repositories");
    const canonRepo = getCareerAnalysisRepository();
    await canonRepo.save(verifiedAnalysis);
    
    const { PostgresCareerAnalysisRepository: PgRepoClass } = await import("../lib/career/repositories/postgres");
    const pgRepo = new PgRepoClass(db);
    await pgRepo.save(verifiedAnalysis);

    await jobRepo.updateJobState(claim!.jobId, "test-worker", claim!.leaseVersion, "RUNNING", "SUCCEEDED", { resultAnalysisId });
    
    // GET Job
    const { GET: GET_JOB } = await import("../app/api/career/jobs/[jobId]/route");
    const jobRes = await GET_JOB(new Request(`http://localhost:3000/api/career/jobs/${claim!.jobId}`), { params: Promise.resolve({ jobId: claim!.jobId }) });
    const jobBody = await jobRes.json();
    expect(jobBody.status).toBe("SUCCEEDED");
    
    // Load Verified Analysis
    const { GET: GET_ANALYSIS } = await import("../app/api/career/analyses/[analysisId]/route");
    const getRes = await GET_ANALYSIS(new Request(`http://localhost:3000/api/career/analyses/${resultAnalysisId}`), { params: Promise.resolve({ analysisId: resultAnalysisId }) });
    expect(getRes.status).toBe(200);
    
    const getBody = await getRes.json();
    expect(getBody.success).toBe(true);
    expect(getBody.status).toBe("VERIFIED");
    expect(getBody.analysisId).toBe(resultAnalysisId);
    expect(getBody.metadata).toBeDefined();

    // Verify pre-computed ReactFlow graph
    expect(getBody.reactFlowGraph).toBeDefined();
    expect(Array.isArray(getBody.reactFlowGraph.nodes)).toBe(true);
    expect(Array.isArray(getBody.reactFlowGraph.edges)).toBe(true);
  });
});
