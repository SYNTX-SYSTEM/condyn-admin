/**
 * CONDYN CAREER ANALYSIS PROTOCOL v1.0
 * STEP 11: REAL ROUTE INTEGRATION (`test/career-real-routes.test.ts`)
 * 
 * Status: Phase 11 TDD Red-Green-Refactor
 * Scope: Verifies repository resolver rules (Postgres in prod, InMemory in test),
 * GET /api/career/analyses list projection, and GET /api/career/analyses/[analysisId] graph rendering.
 */

import fs from "fs";
import path from "path";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getCareerAnalysisRepository } from "../lib/career/repositories";
import { InMemoryCareerAnalysisRepository } from "../lib/career/repository";
import { PostgresCareerAnalysisRepository } from "../lib/career/repositories/postgres";
import { GET as listAnalysesGET } from "../app/api/career/analyses/route";
import { GET as getAnalysisGET } from "../app/api/career/analyses/[analysisId]/route";
import { VerifiedCareerAnalysis } from "../lib/career/types";
import { validateCareerAnalysis } from "../lib/career/validator";

describe("CONDYN Career Analysis Protocol v1.0 - Step 11: Real Route Integration", () => {
  const goldJsonPath = path.join(__dirname, "gold/case_001_minimal_valid/expected/canonical-expected.json");
  const goldJsonRaw = fs.readFileSync(goldJsonPath, "utf-8");
  const unverifiedPayload = JSON.parse(goldJsonRaw);
  const validationResult = validateCareerAnalysis(unverifiedPayload);
  const verifiedAnalysis = validationResult.data as VerifiedCareerAnalysis;

  const originalEnv = { ...process.env };

  beforeEach(async () => {
    process.env.NODE_ENV = "test";
    delete process.env.CAREER_REPOSITORY;
    const repo = getCareerAnalysisRepository();
    await repo.save(verifiedAnalysis);
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("should return InMemoryCareerAnalysisRepository when NODE_ENV === 'test' or CAREER_REPOSITORY === 'inmemory'", () => {
    process.env.NODE_ENV = "test";
    delete process.env.CAREER_REPOSITORY;
    expect(getCareerAnalysisRepository()).toBeInstanceOf(InMemoryCareerAnalysisRepository);

    process.env.NODE_ENV = "production";
    process.env.CAREER_REPOSITORY = "inmemory";
    expect(getCareerAnalysisRepository()).toBeInstanceOf(InMemoryCareerAnalysisRepository);
  });

  it("should strictly enforce PostgresCareerAnalysisRepository when NODE_ENV !== 'test' and CAREER_REPOSITORY !== 'inmemory'", () => {
    process.env.NODE_ENV = "production";
    delete process.env.CAREER_REPOSITORY;
    expect(getCareerAnalysisRepository()).toBeInstanceOf(PostgresCareerAnalysisRepository);
  });

  it("should return lightweight AnalysisIndexEntry[] from GET /api/career/analyses without payload bloating", async () => {
    const req = new Request("http://localhost:3000/api/career/analyses", {
      method: "GET"
    });

    const res = await listAnalysesGET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.analyses)).toBe(true);
    expect(body.analyses.length).toBeGreaterThanOrEqual(1);

    const entry = body.analyses.find((e: any) => e.analysisId === "ANL_TEST_DETERMINISTIC_ID");
    expect(entry).toBeDefined();
    expect(entry.validationState).toBe("VERIFIED");
    expect(entry.overallConfidence).toBeUndefined();
    expect(entry.ui_layout).toBeUndefined();
    expect(entry.structured_data).toBeUndefined();
  });

  it("should return full analysis and server-computed reactFlowGraph from GET /api/career/analyses/[analysisId]", async () => {
    const req = new Request("http://localhost:3000/api/career/analyses/ANL_TEST_DETERMINISTIC_ID", {
      method: "GET"
    });

    const res = await getAnalysisGET(req, { params: Promise.resolve({ analysisId: "ANL_TEST_DETERMINISTIC_ID" }) });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.status).toBe("VERIFIED");
    expect(body.analysisId).toBe("ANL_TEST_DETERMINISTIC_ID");
    expect(body.metadata).toBeDefined();
    expect(body.analysis).toBeDefined();
    expect(body.analysis.structured_data.analysis.metadata.analysis_id).toBe("ANL_TEST_DETERMINISTIC_ID");

    // Verify server-side preparation of ReactFlowGraph
    expect(body.reactFlowGraph).toBeDefined();
    expect(Array.isArray(body.reactFlowGraph.nodes)).toBe(true);
    expect(Array.isArray(body.reactFlowGraph.edges)).toBe(true);
  });

  it("should return HTTP 404 with ERR_ANALYSIS_NOT_FOUND when requesting non-existent analysisId", async () => {
    const req = new Request("http://localhost:3000/api/career/analyses/ANL_NON_EXISTENT_999", {
      method: "GET"
    });

    const res = await getAnalysisGET(req, { params: Promise.resolve({ analysisId: "ANL_NON_EXISTENT_999" }) });
    expect(res.status).toBe(404);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.status).toBe("FAILED");
    expect(body.issues).toBeDefined();
    expect(body.issues[0].code).toBe("ERR_ANALYSIS_NOT_FOUND");
  });
});
