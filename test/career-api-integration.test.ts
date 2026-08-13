import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { adaptCanonicalToDemoState } from "../lib/career/ui-adapter";

// Ensure test uses the real pure production builder isolated from Next.js route dependencies
import { buildCareerAnalysisSuccessResponse } from "../lib/career/api-response";

describe("CONDYN Career Analysis - API to UI Integration Contract", () => {
  const goldCasePath = path.join(__dirname, "gold/case_001_minimal_valid/expected/canonical-expected.json");
  const goldJsonRaw = fs.readFileSync(goldCasePath, "utf-8");
  const verifiedAnalysis = JSON.parse(goldJsonRaw);

  const mockContext = {
    analysisId: verifiedAnalysis.structured_data.analysis.metadata.analysis_id,
    metadata: verifiedAnalysis.structured_data.analysis.metadata,
    sourceManifest: [{ canonicalDocumentId: "DOC_001", sourceRef: "doc-hash-12345" }],
    matching: {},
    recommendations: {},
    reactFlowGraph: {},
    inferenceTelemetry: { complete: true, finishReason: "STOP", continuations: 0 },
    persistenceWarning: undefined
  };

  it("should expose verified CanonicalCareerAnalysis at response.data for SIL projection", () => {
    // 1. Exercise the pure response-envelope builder
    // If it doesn't exist, this throws a RED test error.
    const response = buildCareerAnalysisSuccessResponse(verifiedAnalysis, mockContext);

    // 2. Assert the exact desired response shape contract
    expect(response.success).toBe(true);
    expect(response.status).toBe("VERIFIED");
    
    // THE CRITICAL INVARIANT: The canonical payload MUST be fully exposed at `data`
    expect(response.data).toBeDefined();
    expect(response.data).toEqual(verifiedAnalysis);
    
    // Ensure nested paths exist to prevent adapter crashes
    expect(response.data.structured_data).toBeDefined();
    expect(response.data.structured_data.analysis).toBeDefined();

    // Verify side-cars are preserved independently
    expect(response.sourceManifest).toEqual(mockContext.sourceManifest);
    expect(response.inferenceTelemetry).toBeDefined();

    // 3. Prove that the resulting envelope successfully drives the UI adapter without crashing
    const stagedDocs = [
      { id: "doc-hash-12345", type: "text", title: "Test Doc", content: "Test content" }
    ];
    
    const executeAdapter = () => {
      return adaptCanonicalToDemoState(response.data, stagedDocs, response.sourceManifest);
    };

    const projectedState = executeAdapter();
    expect(projectedState).not.toBeNull();
    expect(projectedState.sources.length).toBe(1);
    expect(projectedState.sources[0].sourceTitle).toBe("Test Doc");
  });

  it("should reject a VERIFIED response missing canonical data", () => {
    // Simulate a malformed API envelope (the current broken state in route.ts)
    const malformedResponse = {
      success: true,
      status: "VERIFIED",
      analysisId: mockContext.analysisId,
      sourceManifest: mockContext.sourceManifest
      // `data` is missing!
    };

    const stagedDocs = [
      { id: "doc-hash-12345", type: "text", title: "Test Doc", content: "Test content" }
    ];

    // The adapter requires `response.data` to be a valid canonical payload.
    // If we pass `undefined` (which happens when `data` is missing), the adapter MUST throw
    // explicitly or fail cleanly, rather than the UI implicitly swallowing or showing demo data.
    const executeAdapter = () => {
      // @ts-ignore - simulating runtime contract mismatch
      adaptCanonicalToDemoState(malformedResponse.data, stagedDocs, malformedResponse.sourceManifest);
    };

    expect(executeAdapter).toThrow();
  });
});
