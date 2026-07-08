import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { POST } from "../app/api/career/analyze/route";
import { GET as GET_DETAIL } from "../app/api/career/analyses/[analysisId]/route";
import { getCareerAnalysisRepository } from "../lib/career/repositories";

describe("CONDYN Career Analysis Protocol v1.0 — Step 20b: Recommendation API Integration (`test/career-analyze-recommendations.test.ts`)", () => {
  beforeEach(() => {
    process.env.USE_GEMINI_PROVIDER = "false";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should include `matching` and `recommendations` in POST /api/career/analyze response", async () => {
    const req = new Request("http://localhost:3000/api/career/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        documents: [
          {
            type: "text",
            title: "Architect Profile",
            content: "15 years experience in Distributed Systems and Microservices Architecture."
          }
        ]
      })
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.status).toBe("VERIFIED");
    expect(body.analysisId).toBeDefined();

    // Check matching result
    expect(body).toHaveProperty("matching");
    expect(body.matching).toBeDefined();
    expect(body.matching.role_matches).toBeDefined();
    expect(Array.isArray(body.matching.role_matches)).toBe(true);

    // Check recommendations result
    expect(body).toHaveProperty("recommendations");
    expect(body.recommendations).toBeDefined();
    expect(body.recommendations.analysisId).toBe(body.analysisId);
    expect(Array.isArray(body.recommendations.capabilityGaps)).toBe(true);
    expect(Array.isArray(body.recommendations.evidenceEnhancements)).toBe(true);
    expect(Array.isArray(body.recommendations.nextActions)).toBe(true);
  });

  it("should generate recommendations based on missingCapabilities from role matches", async () => {
    const req = new Request("http://localhost:3000/api/career/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        documents: [
          {
            type: "text",
            title: "CV",
            content: "Senior Systems Engineer skilled in C++."
          }
        ]
      })
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.recommendations.capabilityGaps.length).toBeGreaterThan(0);

    // Each capability gap should correspond to a missing capability required by a role
    const firstGap = body.recommendations.capabilityGaps[0];
    expect(firstGap).toHaveProperty("capabilityName");
    expect(firstGap).toHaveProperty("requiredByRoleId");
    expect(firstGap).toHaveProperty("severity");
  });

  it("should preserve existing response structure compatibility (success, status, analysisId, metadata, reactFlowGraph)", async () => {
    const req = new Request("http://localhost:3000/api/career/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        documents: [
          {
            type: "text",
            title: "CV",
            content: "Senior Cloud Architect."
          }
        ]
      })
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.status).toBe("VERIFIED");
    expect(body.analysisId).toMatch(/^ANL_/);
    expect(body.metadata).toBeDefined();
    expect(body.reactFlowGraph).toBeDefined();
    expect(body.reactFlowGraph.nodes).toBeDefined();
  });

  it("should include `matching` and `recommendations` in GET /api/career/analyses/[analysisId] response", async () => {
    // First save an analysis
    const postReq = new Request("http://localhost:3000/api/career/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        documents: [{ type: "text", content: "Senior Cloud Solutions Architect." }]
      })
    });
    const postRes = await POST(postReq);
    const postBody = await postRes.json();
    const analysisId = postBody.analysisId;

    const getReq = new Request(`http://localhost:3000/api/career/analyses/${analysisId}`);
    const getRes = await GET_DETAIL(getReq, { params: Promise.resolve({ analysisId }) });
    expect(getRes.status).toBe(200);

    const getBody = await getRes.json();
    expect(getBody.success).toBe(true);
    expect(getBody.analysisId).toBe(analysisId);
    expect(getBody.matching).toBeDefined();
    expect(getBody.recommendations).toBeDefined();
    expect(Array.isArray(getBody.recommendations.capabilityGaps)).toBe(true);
  });
});
