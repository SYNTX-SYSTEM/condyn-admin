import { GoogleGenAI } from "@google/genai";
import { getGeminiCareerResponseJsonSchema } from "./lib/career/schema-projector";
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

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const schema = getGeminiCareerResponseJsonSchema();

async function run() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: "Respond with an empty JSON object.",
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: schema,
        temperature: 0.1
      }
    });
    console.log("SUCCESS WITH SCHEMA");
  } catch (err: any) {
    console.error("FAIL WITH SCHEMA:");
    console.error(err.message);
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: "Respond with an empty JSON object.",
      config: {
        responseMimeType: "application/json",
        temperature: 0.1
      }
    });
    console.log("SUCCESS WITHOUT SCHEMA");
  } catch (err: any) {
    console.error("FAIL WITHOUT SCHEMA:");
    console.error(err.message);
  }
}

run().catch(console.error);
