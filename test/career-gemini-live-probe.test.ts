import { describe, it, expect } from "vitest";
import { GoogleGenAI } from "@google/genai";
import { getGeminiCareerResponseJsonSchema } from "../lib/career/schema-projector";
import { DEFAULT_GEMINI_MODEL_CASCADE } from "../lib/career/providers/gemini";
import * as fs from "fs";
import * as path from "path";

// Attempt to load .env.local strictly for this diagnostic if vitest didn't
try {
  const envFile = fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf8");
  envFile.split("\n").forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].trim().replace(/^"|"$/g, '');
    }
  });
} catch (e) {}

const runLiveProbe = process.env.RUN_GEMINI_LIVE_PROBE === "1";

describe.runIf(runLiveProbe)("Gemini API Live Probes - Pairwise Model Cascade", () => {
  const apiKey = process.env.GEMINI_API_KEY;
  
  // Calculate effective model cascade identical to production
  let effectiveCascade: string[] = [];
  if (process.env.GEMINI_MODEL) {
    effectiveCascade = [
      process.env.GEMINI_MODEL,
      ...DEFAULT_GEMINI_MODEL_CASCADE.filter(m => m !== process.env.GEMINI_MODEL)
    ];
  } else {
    effectiveCascade = [...DEFAULT_GEMINI_MODEL_CASCADE];
  }

  it("Execute pairwise A/B schema tests across all effective models", async () => {
    expect(apiKey).toBeDefined();
    const ai = new GoogleGenAI({ apiKey });
    const fullSchema = getGeminiCareerResponseJsonSchema();
    const tinySchema = {
      type: "object",
      properties: { name: { type: "string" }, jahreErfahrung: { type: "integer" } },
      required: ["name", "jahreErfahrung"]
    };

    console.log(`\nEFFECTIVE CASCADE SIZE: ${effectiveCascade.length}`);
    console.log("MODEL | PROBE A | PROBE B | A HTTP | B HTTP");
    console.log("---------------------------------------------------------");

    for (const model of effectiveCascade) {
      let aStatus = "FAIL", bStatus = "FAIL";
      let aHttp = "", bHttp = "";
      
      // PROBE A (Tiny Schema)
      try {
        await ai.models.generateContent({
          model,
          contents: "Erstelle ein kurzes Profil für einen Software Entwickler.",
          config: {
            responseMimeType: "application/json",
            responseJsonSchema: tinySchema as any,
            temperature: 0.1
          }
        });
        aStatus = "PASS";
        aHttp = "200";
      } catch (e: any) {
        aStatus = "FAIL";
        aHttp = e?.status || (e?.message?.includes("404") ? "404 NOT_FOUND" : e?.message?.includes("400") ? "400 INVALID_ARGUMENT" : e?.message?.split("\n")[0] || "ERROR");
      }

      // PROBE B (Full Schema)
      try {
        await ai.models.generateContent({
          model,
          contents: "Erstelle ein kurzes Profil für einen Software Entwickler.", // Exact same prompt
          config: {
            responseMimeType: "application/json",
            responseJsonSchema: fullSchema as any,
            temperature: 0.1
          }
        });
        bStatus = "PASS";
        bHttp = "200";
      } catch (e: any) {
        bStatus = "FAIL";
        bHttp = e?.status || (e?.message?.includes("404") ? "404 NOT_FOUND" : e?.message?.includes("400") ? "400 INVALID_ARGUMENT" : e?.message?.split("\n")[0] || "ERROR");
      }

      // Format output row
      console.log(`${model.padEnd(20)} | ${aStatus.padEnd(7)} | ${bStatus.padEnd(7)} | ${String(aHttp).padEnd(10)} | ${String(bHttp)}`);
    }
    console.log("---------------------------------------------------------\n");
    
    // Test implicitly passes, we just want the output matrix.
  }, 120000);
});
