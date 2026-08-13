import { describe, it, expect } from "vitest";
import { GoogleGenAI } from "@google/genai";
import { getGeminiCareerResponseJsonSchema } from "../lib/career/schema-projector";

describe.skipIf(!process.env.RUN_GEMINI_DIAGNOSTICS)("BUG010M: Live Token Limit Matrix", () => {
  it("should test gemini-3.5-flash with various maxOutputTokens", async () => {
    const limits = [8192, 16384, 32768, 65536];
    const results = [];
    
    // We will simulate a small prompt but enforce the large output token limit request
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    for (const limit of limits) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: "Generate 5 sample entities according to the schema.",
          config: {
            responseMimeType: "application/json",
            responseJsonSchema: getGeminiCareerResponseJsonSchema(),
            maxOutputTokens: limit,
            temperature: 0.1
          }
        });
        
        results.push({ limit, status: 200 });
      } catch (e: any) {
        throw new Error(`Token limit ${limit} failed: ${e?.status || e?.response?.status || e.message}`);
      }
    }
    
    console.log("LIVE TOKEN LIMIT MATRIX:", results);
    // Force a failure so we can see the console.log output if SafeToAutoRun:true drops it, or just use SafeToAutoRun:false
    expect(results).toBeDefined();
  }, 120000);
});
