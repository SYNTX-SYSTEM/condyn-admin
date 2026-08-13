import { describe, it, expect } from "vitest";
import { GoogleGenAI } from "@google/genai";
import { getGeminiCareerResponseJsonSchema } from "../lib/career/schema-projector";
import { buildCareerAnalysisPrompt } from "../lib/career/adapter";
import * as fs from "fs";
import * as path from "path";

try {
  const envFile = fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf8");
  envFile.split("\n").forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].trim().replace(/^"|"$/g, '');
    }
  });
} catch (e) {}

describe("BUG 010: Gemini Schema Acceptance (LIVE PROBE)", () => {
  it("should successfully generate content using the projected Gemini schema", async () => {
    if (!process.env.RUN_GEMINI_LIVE_PROBE) {
      console.log("Skipping live probe (RUN_GEMINI_LIVE_PROBE not set)");
      return;
    }

    const primaryModel = process.env.GEMINI_MODEL || "gemini-3.5-flash";
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY must be configured for live probe.");
    }

    const ai = new GoogleGenAI({ apiKey });
    const { systemPrompt, allowedDocIds } = buildCareerAnalysisPrompt([{ docId: "DOC_1", content: "dummy" }]);
    const schema = getGeminiCareerResponseJsonSchema(allowedDocIds);
    
    // Synthetic 122k User Input
    const userPrompt = "Analyze this.\n" + "A".repeat(122634);
    

    const initialContents = `${systemPrompt}\n\n${userPrompt}`;

    let httpStatus: number = 0;

    const config: any = {
      responseMimeType: "application/json",
      responseJsonSchema: schema,
      temperature: 0.1,
      maxOutputTokens: 8192
    };

    try {
      await ai.models.generateContent({
        model: primaryModel,
        contents: initialContents,
        config
      });
      httpStatus = 200;
    } catch (err: any) {
      httpStatus = err?.status || err?.response?.status || 400;
      if (httpStatus === 400) {
        console.error("GEMINI 400 ERROR DETAILS:", err.message);
      }
    }

    if (httpStatus === 404) {
      console.log(`Model ${primaryModel} not found (404), skipping failure.`);
    } else if (httpStatus === 503) {
      console.log("Model temporarily unavailable (503), skipping failure.");
    } else {
      expect(httpStatus).toBe(200);
    }
  }, 30000); // 30 second timeout
});
