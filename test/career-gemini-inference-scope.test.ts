import { describe, it, expect, vi } from "vitest";
import { GeminiProvider } from "../lib/career/providers/gemini";

const mockGenerateContent = vi.fn().mockResolvedValue({
  text: JSON.stringify({
    report_markdown: "Mock",
    structured_data: { analysis: {} }
  }),
  candidates: [{ finishReason: "STOP" }],
  usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 10 }
});

// Mock the GenAI SDK to intercept generateContent calls globally
vi.mock("@google/genai", () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(() => {
      return {
        models: {
          generateContent: mockGenerateContent
        }
      };
    })
  };
});

describe("GeminiProvider Inference Scope Contract", () => {
  it("does not send RUNTIME_OWNED or UI_PROJECTION scopes to the model (RED)", async () => {
    // 1. Arrange
    const provider = new GeminiProvider({ apiKey: "mock-key", model: "gemini-mock" });
    
    // 2. Act
    await provider.execute({
      userPrompt: "Analyze this.",
      systemPrompt: "You are an expert.",
      documents: []
    });

    // 3. Assert - Intercept generateContent call
    expect(mockGenerateContent).toHaveBeenCalled();
    
    const callArgs = mockGenerateContent.mock.calls[0][0];
    const schema = callArgs.config.responseJsonSchema;
    
    expect(schema).toBeDefined();

    // Helper to scan for string keys in the deep object
    const hasKey = (obj: any, keyName: string): boolean => {
      if (!obj || typeof obj !== "object") return false;
      if (Array.isArray(obj)) return obj.some(item => hasKey(item, keyName));
      if (keyName in obj) return true;
      for (const k of Object.keys(obj)) {
        if (hasKey(obj[k], keyName)) return true;
      }
      return false;
    };
    
    // We expect the schema to EXCLUDE these completely from any properties definitions
    expect(hasKey(schema, "pipeline")).toBe(false);
    expect(hasKey(schema, "presentation")).toBe(false);
    expect(hasKey(schema, "validation")).toBe(false);
  });
});
