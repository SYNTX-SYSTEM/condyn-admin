import { describe, it, expect, vi } from "vitest";
import { GeminiProvider } from "../lib/career/providers/gemini";

// Mock the GenAI SDK to simulate a rejection
vi.mock("@google/genai", () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(() => {
      return {
        models: {
          generateContent: vi.fn().mockRejectedValue({
            status: 400,
            code: "INVALID_ARGUMENT",
            message: "Request contains an invalid argument.",
            details: [{ type: "type.googleapis.com/google.rpc.BadRequest" }]
          }),
          countTokens: vi.fn().mockResolvedValue({ totalTokens: 12345 }),
          get: vi.fn().mockResolvedValue({ inputTokenLimit: 2000000, outputTokenLimit: 8192 })
        }
      };
    })
  };
});

describe("GeminiProvider Error Diagnostic Boundary", () => {
  it("formats detailed bounded error diagnostics without leaking secrets (RED/GREEN)", async () => {
    // 1. Arrange
    const provider = new GeminiProvider({ apiKey: "secret-key-12345", model: "gemini-test-model" });
    const userPrompt = "Hello World, please analyze.";
    const systemPrompt = "You are a test expert.";

    // 2. Act
    let caughtError: any = null;
    try {
      await provider.execute({
        userPrompt,
        systemPrompt,
        documents: []
      });
    } catch (e) {
      caughtError = e;
    }

    // 3. Assert
    expect(caughtError).toBeDefined();
    const errorString = caughtError.message || String(caughtError);

    // A. Model included
    expect(errorString).toContain("MODEL: gemini-test-model");
    
    // B. HTTP / Code / Status / Message
    expect(errorString).toContain("HTTP: 400");
    expect(errorString).toContain("CODE: INVALID_ARGUMENT");
    expect(errorString).toContain("MESSAGE: Request contains an invalid argument.");
    
    // C. Details
    expect(errorString).toContain("type.googleapis.com/google.rpc.BadRequest");

    // D. Schema metrics included
    expect(errorString).toContain("schemaBytes:");
    expect(errorString).toContain("schemaProperties:");
    
    // E. Prompt lengths included
    expect(errorString).toContain(`systemPromptChars: ${systemPrompt.length}`);
    expect(errorString).toContain(`userPromptChars: ${userPrompt.length}`);

    // F. Content NOT included
    expect(errorString).not.toContain(userPrompt);
    expect(errorString).not.toContain(systemPrompt);

    // G. Secrets NOT included
    expect(errorString).not.toContain("secret-key-12345");
    
    // H. Token Metrics included
    expect(errorString).toContain("EXACT INPUT TOKENS: 12345");
    expect(errorString).toContain("MODEL INPUT TOKEN LIMIT: 2000000");
    expect(errorString).toContain("MODEL OUTPUT TOKEN LIMIT: 8192");
    expect(errorString).toContain("REQUESTED OUTPUT TOKENS: 65536"); // The mock didn't run the clamp in the test as it's testing the error boundary isolated
  });
});
