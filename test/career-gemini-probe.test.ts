import { describe, it } from "vitest";
import { GoogleGenAI } from "@google/genai";
import * as fs from "fs";
import * as path from "path";

try {
  const envFile = fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf8");
  envFile.split("\n").forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].trim();
    }
  });
} catch (e) {}

describe.skipIf(!process.env.RUN_GEMINI_DIAGNOSTICS)("Probe Gemini API", () => {
  it("Probe A", async () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("NO API KEY");

    const ai = new GoogleGenAI({ apiKey });
    console.log("--- PROBE A ---");
    
    const response = await ai.models.generateContent({
      model: "gemini-1.5-pro",
      contents: "Tell me a joke.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: { joke: { type: "string" } },
          required: ["joke"]
        }
      }
    });
    console.log("PROBE A SUCCESS:");
    console.log(response.text);
  }, 10000);
});
