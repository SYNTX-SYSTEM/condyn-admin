import * as fs from "fs";
import * as path from "path";
import { loadPdfDocument } from "./lib/career/loaders/pdf";
import { buildCareerAnalysisPrompt } from "./lib/career/adapter";
import { GoogleGenAI } from "@google/genai";
import { getGeminiCareerResponseJsonSchema } from "./lib/career/schema-projector";
import dotenv from "dotenv";

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
const config: any = {
  responseMimeType: "application/json",
  responseJsonSchema: schema,
  temperature: 0.1,
  maxOutputTokens: 8192
};

async function testPrefix(contentPrefix: string): Promise<number> {
  const prompt = buildCareerAnalysisPrompt([
    { docId: "DOC_001", title: "SYNTX_Dossier_Kap6_FINAL.pdf", content: contentPrefix }
  ]);
  const initialContents = `${prompt.systemPrompt}\n\n${prompt.userPrompt}`;
  
  try {
    await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: initialContents,
      config
    });
    return 200;
  } catch (err: any) {
    if (contentPrefix.length === 0) {
      console.log(`Error at length 0:`, err.message || String(err));
    }
    return err?.status || err?.response?.status || 400;
  }
}

async function run() {
  const pdfPath = "/home/codi/Dokumente/SYNTX/SYNTX_WIKI/SYNTX_Dossier_Kap6_FINAL.pdf";
  const buffer = fs.readFileSync(pdfPath);
  const doc = await loadPdfDocument(buffer, path.basename(pdfPath), "DOC_001");
  const fullText = doc.content;

  const syntheticA = "A".repeat(122634);
  const statusA = await testPrefix(syntheticA);
  console.log("Status for synthetic A via builder:", statusA);
}

run().catch(console.error);
