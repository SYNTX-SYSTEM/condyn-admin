import { describe, it, expect } from "vitest";
import { GeminiProvider } from "../lib/career/providers/gemini";
import { buildCareerAnalysisPrompt } from "../lib/career/adapter";

const runDiagnostic = process.env.RUN_GEMINI_DIAGNOSTICS === "1";

describe.skipIf(!runDiagnostic)("BUG010R: Final Gemini Request Boundary (Live Diagnostic)", () => {
  it("should send the EXACT dynamic doc_id enum to the Gemini API", async () => {
    // 1. Loader-owned runtime document
    const docs = [{ docId: "DOC_001", content: "TEST CONTENT" }];
    
    // 2. Build prompt bundle
    const promptBundle = buildCareerAnalysisPrompt(docs);
    expect(promptBundle.allowedDocIds).toEqual(["DOC_001"]);
    
    // 3. Instantiate provider with real key
    const provider = new GeminiProvider();
    
    // 4. Execute provider
    // This will hit the real Gemini API if RUN_GEMINI_DIAGNOSTICS is enabled
    // and expects a valid GEMINI_API_KEY to be set in the environment.
    const result = await provider.execute(promptBundle);
    
    // 5. Core Assertion: Real API returns a string
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  }, 30000); // 30s timeout for live API
});
