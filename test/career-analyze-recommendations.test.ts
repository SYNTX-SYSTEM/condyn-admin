import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { POST } from "../app/api/career/analyze/route";
import { GET as GET_DETAIL } from "../app/api/career/analyses/[analysisId]/route";
import { getCareerAnalysisRepository } from "../lib/career/repositories";
import * as providers from "../lib/career/providers";
import { MockInferenceProvider } from "../lib/career/adapter";
import { executeCareerAnalysisPipeline } from "../lib/career/pipeline";
import { matchCareerAnalysisAgainstPool } from "../lib/career/matching/engine";
import { generateCareerRecommendations } from "../lib/career/recommendations/gaps";
import { DEMO_COMPANY_POOL } from "../lib/career/matching/demo-pool";
import { prepareDocuments } from "../lib/career/orchestration/document-loader";

describe("CONDYN Career Analysis Protocol v1.0 — Step 20b: Recommendation API Integration (`test/career-analyze-recommendations.test.ts`)", () => {
  beforeEach(() => {
    vi.spyOn(providers, "getCareerInferenceProvider").mockReturnValue(new MockInferenceProvider());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should generate `matching` and `recommendations` from analysis pipeline directly (CATEGORY A)", async () => {
    const { normalizedDocs } = await prepareDocuments([{ type: "text", title: "CV", content: "15 years experience in Distributed Systems and Microservices Architecture." }]);
    const validationResult = await executeCareerAnalysisPipeline(normalizedDocs, providers.getCareerInferenceProvider());
    
    expect(validationResult.success).toBe(true);
    const analysis = validationResult.data as any;
    
    const matching = matchCareerAnalysisAgainstPool(analysis, DEMO_COMPANY_POOL);
    const recommendations = generateCareerRecommendations(analysis, matching);

    expect(matching.role_matches).toBeDefined();
    expect(Array.isArray(matching.role_matches)).toBe(true);

    expect(recommendations.analysisId).toBe(analysis.structured_data.analysis.metadata.analysis_id);
    expect(Array.isArray(recommendations.capabilityGaps)).toBe(true);
    expect(Array.isArray(recommendations.evidenceEnhancements)).toBe(true);
    expect(Array.isArray(recommendations.nextActions)).toBe(true);
  });

  it("should generate recommendations based on missingCapabilities from role matches (CATEGORY A)", async () => {
    const { normalizedDocs } = await prepareDocuments([{ type: "text", title: "CV", content: "Senior Systems Engineer skilled in C++." }]);
    const validationResult = await executeCareerAnalysisPipeline(normalizedDocs, providers.getCareerInferenceProvider());
    const analysis = validationResult.data as any;
    
    const matching = matchCareerAnalysisAgainstPool(analysis, DEMO_COMPANY_POOL);
    const recommendations = generateCareerRecommendations(analysis, matching);

    expect(recommendations.capabilityGaps.length).toBeGreaterThan(0);

    const firstGap = recommendations.capabilityGaps[0];
    expect(firstGap).toHaveProperty("capabilityName");
    expect(firstGap).toHaveProperty("requiredByRoleId");
    expect(firstGap).toHaveProperty("severity");
  });

  it("should preserve existing response structure compatibility (success, status, analysisId, metadata, reactFlowGraph) via GET (CATEGORY C)", async () => {
    const { normalizedDocs } = await prepareDocuments([{ type: "text", title: "CV", content: "Senior Cloud Architect." }]);
    const validationResult = await executeCareerAnalysisPipeline(normalizedDocs, providers.getCareerInferenceProvider());
    const analysis = validationResult.data as any;
    const analysisId = analysis.structured_data.analysis.metadata.analysis_id;
    
    const repository = getCareerAnalysisRepository();
    await repository.save(analysis);

    const getReq = new Request(`http://localhost:3000/api/career/analyses/${analysisId}`);
    const getRes = await GET_DETAIL(getReq, { params: Promise.resolve({ analysisId }) });
    expect(getRes.status).toBe(200);

    const body = await getRes.json();
    expect(body.success).toBe(true);
    expect(body.status).toBe("VERIFIED");
    expect(body.analysisId).toMatch(/^ANL_/);
    expect(body.metadata).toBeDefined();
    expect(body.reactFlowGraph).toBeDefined();
    expect(body.reactFlowGraph.nodes).toBeDefined();
  });

  it("should include `matching` and `recommendations` in GET /api/career/analyses/[analysisId] response (CATEGORY B)", async () => {
    const { normalizedDocs } = await prepareDocuments([{ type: "text", content: "Senior Cloud Solutions Architect." }]);
    const validationResult = await executeCareerAnalysisPipeline(normalizedDocs, providers.getCareerInferenceProvider());
    const analysis = validationResult.data as any;
    const analysisId = analysis.structured_data.analysis.metadata.analysis_id;
    
    const repository = getCareerAnalysisRepository();
    await repository.save(analysis);

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
