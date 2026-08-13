import { describe, it, expect, vi, beforeEach } from "vitest";
import { GoogleGenAI } from "@google/genai";
import { GeminiProvider } from "../lib/career/providers/gemini";
import { buildCareerAnalysisPrompt } from "../lib/career/adapter";
import { RelationTypeEnum } from "../lib/career/schema";

// Mock the GoogleGenAI SDK to capture the request payload without making network calls.
vi.mock("@google/genai", () => {
  const generateContentMock = vi.fn().mockResolvedValue({
    text: JSON.stringify({ structured_data: {} }),
    usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 20 },
    candidates: [{ finishReason: "STOP" }]
  });

  return {
    GoogleGenAI: vi.fn().mockImplementation(() => {
      return {
        models: {
          generateContent: generateContentMock
        }
      };
    })
  };
});

describe("BUG 010: Gemini Schema-Constrained Output Gap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should send a strict JSON Schema constraint for the CanonicalCareerAnalysis to Gemini", async () => {
    const provider = new GeminiProvider({ apiKey: "test-key" });
    const prompt = buildCareerAnalysisPrompt([{ docId: "DOC_001", content: "Test document" }]);

    await provider.execute(prompt);

    // Get the mock instance and the generateContent call
    const genAIInstance = vi.mocked(GoogleGenAI).mock.results[0].value;
    const generateContentMock = genAIInstance.models.generateContent;
    
    expect(generateContentMock).toHaveBeenCalledTimes(1);
    
    const requestPayload = generateContentMock.mock.calls[0][0];
    const config = requestPayload.config;

    // The MIME type must be application/json
    expect(config.responseMimeType).toBe("application/json");

    // A real schema constraint must be provided to the model
    const schema = config.responseSchema || config.responseJsonSchema;
    expect(schema).toBeDefined();

    // The schema must enforce the exact relationship type enum to prevent hallucinations like "BELONONGS_TO_CLASS"
    // We navigate the expected JSON schema structure to find the relationship object.
    // Note: The exact traversal path depends on how the schema is generated (e.g., via zod-to-json-schema).
    // For this RED test, we ensure the enum values exist somewhere in the schema payload.
    const schemaString = JSON.stringify(schema);
    
    // Extract the canonical enum values from the single source of truth
    const canonicalEnumValues = RelationTypeEnum.options;

    // Verify all canonical enum values are present in the provided schema
    canonicalEnumValues.forEach((enumValue) => {
      expect(schemaString).toContain(`"${enumValue}"`);
    });

    // Ensure the hallucinatory value is NOT somehow permitted
    expect(schemaString).not.toContain('"BELONONGS_TO_CLASS"');
  });
});
