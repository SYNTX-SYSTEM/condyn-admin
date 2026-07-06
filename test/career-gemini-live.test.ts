import { describe, it, expect } from "vitest";
import { GeminiProvider } from "../lib/career/providers/gemini";
import { buildCareerAnalysisPrompt, processLlmOutput } from "../lib/career/adapter";

const canRunLive = process.env.RUN_LIVE_LLM_TESTS === "true" && !!process.env.GEMINI_API_KEY;

describe.skipIf(!canRunLive)("CONDYN Career Analysis Protocol v1.0 - Step 9.3: Gemini Live Smoke Test (GATED)", () => {
  it("should execute real Gemini inference, conform to Universal Entity Grammar, and stamp as VERIFIED", async () => {
    const sampleDocs = [
      {
        docId: "DOC_001",
        title: "Live Test Architect CV",
        content: `
        Senior Cloud Systems Architect with 10 years of experience in distributed systems and Kubernetes.
        Led engineering teams at Siemens AG and BMW Group.
        Specialized in high-throughput event-driven microservices.
        `
      }
    ];

    const promptBundle = buildCareerAnalysisPrompt(sampleDocs);
    const provider = new GeminiProvider();

    const rawJsonString = await provider.execute(promptBundle);
    expect(typeof rawJsonString).toBe("string");
    expect(rawJsonString.length).toBeGreaterThan(100);

    const validationResult = processLlmOutput(rawJsonString);
    if (validationResult.status === "FAILED") {
      console.error("Live Gemini validation failures:", validationResult.issues);
    }

    expect(validationResult.status).toBe("PASSED");
    expect(validationResult.data).toBeDefined();
    expect(validationResult.data?.structured_data.analysis.metadata.validation_state).toBe("VERIFIED");
  }, 60000); // Allow up to 60s for real LLM latency
});
