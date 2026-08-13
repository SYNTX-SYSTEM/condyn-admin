import { describe, it, expect, vi } from "vitest";
import { GeminiProvider } from "../lib/career/providers/gemini";
import { buildCareerAnalysisPrompt } from "../lib/career/adapter";
import { GoogleGenAI } from "@google/genai";

vi.mock("@google/genai", () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(() => {
      return {
        models: {
          generateContent: vi.fn().mockResolvedValue({
            candidates: [{ finishReason: "STOP" }],
            usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 10 }
          })
        }
      };
    })
  };
});

describe("BUG010R: Final Gemini Request Boundary", () => {
  it("should send the EXACT dynamic doc_id enum to the Gemini API", async () => {
    // 1. Loader-owned runtime document
    const docs = [{ docId: "DOC_001", content: "TEST CONTENT" }];
    
    // 2. Build prompt bundle
    const promptBundle = buildCareerAnalysisPrompt(docs);
    expect(promptBundle.allowedDocIds).toEqual(["DOC_001"]);
    
    // 3. Instantiate provider with dummy key to bypass throw
    const provider = new GeminiProvider();
    provider.apiKey = "DUMMY_KEY";
    
    // 4. Execute provider
    await provider.execute(promptBundle);
    
    // 5. Intercept the GoogleGenAI generateContent call
    const mockAiInstance = vi.mocked(GoogleGenAI).mock.results[0].value;
    const generateContentSpy = mockAiInstance.models.generateContent;
    
    expect(generateContentSpy).toHaveBeenCalledTimes(1);
    const finalRequestArgs = generateContentSpy.mock.calls[0][0];
    
    // 6. Assert structural elements
    expect(finalRequestArgs.config.responseMimeType).toBe("application/json");
    
    const finalSchema = finalRequestArgs.config.responseJsonSchema;
    expect(finalSchema).toBeDefined();
    
    // Navigate dynamically to the evidence item schema
    let entityDef = finalSchema.properties.entities.items;
    if (entityDef.$ref) {
      const refPath = entityDef.$ref.split('/').slice(1);
      let current = finalSchema;
      for (const part of refPath) current = current[part];
      entityDef = current;
    }
    
    let evidenceItemDef = entityDef.properties.evidence.items;
    if (evidenceItemDef.$ref) {
      const refPath = evidenceItemDef.$ref.split('/').slice(1);
      let current = finalSchema;
      for (const part of refPath) current = current[part];
      evidenceItemDef = current;
    }
    
    // 7. Core Assertion: The FINAL request sent to Gemini MUST contain the enum
    expect(evidenceItemDef.properties.doc_id.enum).toEqual(["DOC_001"]);
  });
});
