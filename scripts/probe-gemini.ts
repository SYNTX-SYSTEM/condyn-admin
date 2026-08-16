import { GoogleGenAI } from "@google/genai";
import { getGeminiCareerResponseJsonSchema } from "../lib/career/schema-projector";
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
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("No GEMINI_API_KEY found");
  process.exit(1);
}
const ai = new GoogleGenAI({ apiKey });

async function probeA() {
  console.log("--- PROBE A: Tiny prompt + tiny JSON schema ---");
  try {
    const response = await ai.models.generateContent({
      model: "gemini-1.5-pro",
      contents: "Tell me a joke about a dog.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            joke: { type: "string" },
            rating: { type: "integer" }
          },
          required: ["joke"]
        }
      }
    });
    console.log("✅ PROBE A SUCCESS");
    console.log("Output:", response.text);
  } catch (error: any) {
    console.error("❌ PROBE A FAILED:", error?.message || error);
  }
}

async function probeB() {
  console.log("\n--- PROBE B: Tiny prompt + our full schema ---");
  try {
    const schema = getGeminiCareerResponseJsonSchema();
    const response = await ai.models.generateContent({
      model: "gemini-1.5-pro",
      contents: "Analyze this career: Software Engineer for 10 years.",
      config: {
        responseMimeType: "application/json",
        // Using responseJsonSchema as requested in GeminiProvider, or fallback to responseSchema
        // The GoogleGenAI SDK usually maps these, but let's pass it exactly as we do in production:
        responseJsonSchema: schema
      } as any
    });
    console.log("✅ PROBE B SUCCESS (with responseJsonSchema)");
    console.log("Output excerpt:", response.text?.substring(0, 200) + "...");
  } catch (error: any) {
    console.error("❌ PROBE B FAILED with responseJsonSchema:", error?.message || error);
    
    console.log("\n--- Retrying PROBE B with responseSchema instead ---");
    try {
      const schema = getGeminiCareerResponseJsonSchema();
      const response = await ai.models.generateContent({
        model: "gemini-1.5-pro",
        contents: "Analyze this career: Software Engineer for 10 years.",
        config: {
          responseMimeType: "application/json",
          responseSchema: schema
        }
      });
      console.log("✅ PROBE B SUCCESS (with responseSchema)");
      console.log("Output excerpt:", response.text?.substring(0, 200) + "...");
    } catch (err: any) {
      console.error("❌ PROBE B FAILED with responseSchema:", err?.message || err);
    }
  }
}

async function run() {
  await probeA();
  await probeB();
}

run();
