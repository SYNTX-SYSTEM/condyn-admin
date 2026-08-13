import { GoogleGenAI } from "@google/genai";
import { loadPdfDocument } from "./lib/career/loaders/pdf";
import { buildCareerAnalysisPrompt } from "./lib/career/adapter";
import { GeminiProvider } from "./lib/career/providers/gemini";
import { processLlmOutput } from "./lib/career/adapter";
import fs from "fs";

async function run() {
  console.log("1. Loading PDF...");
  const pdfPath = "/home/codi/Dokumente/SYNTX/SYNTX_WIKI/SYNTX_Dossier_Kap6_FINAL.pdf";
  const buffer = fs.readFileSync(pdfPath);
  const doc = await loadPdfDocument(buffer, "SYNTX_Dossier_Kap6_FINAL.pdf");
  const docs = [doc];
  console.log("PDF loaded. Docs count:", docs.length);
  
  console.log("2. Building Prompt...");
  const prompt = buildCareerAnalysisPrompt(docs);
  console.log("User prompt chars:", prompt.userPrompt.length);
  console.log("System prompt chars:", prompt.systemPrompt.length);
  
  console.log("3. Executing GeminiProvider...");
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const envFile = fs.readFileSync(".env.local", "utf8");
    envFile.split("\n").forEach(line => {
      let match = line.match(/^GEMINI_API_KEY=(.*)$/);
      if (match) process.env.GEMINI_API_KEY = match[1].trim().replace(/^"|"$/g, '');
      
      match = line.match(/^GEMINI_MODEL=(.*)$/);
      if (match) process.env.GEMINI_MODEL = match[1].trim().replace(/^"|"$/g, '');
    });
  }
  const provider = new GeminiProvider();
  let rawOutput = "";
  try {
    rawOutput = await provider.execute(prompt);
    console.log("GeminiProvider SUCCESS. Output length:", rawOutput.length);
  } catch (err: any) {
    console.error("GeminiProvider FAILED:");
    console.error(err.message || err);
    process.exit(1);
  }

  console.log("4. Validating and Assembling...");
  const context = {
    analysis_id: "ANL_TEST_PDF",
    execution_duration_ms: 0,
    document_count: docs.length,
    pipeline_steps: [],
    documents: docs
  };
  const result = processLlmOutput(rawOutput, context);
  
  if (result.success) {
    console.log("VALIDATION SUCCESS!");
    console.log("Final Canonical Entities Count:", 
      (result.data?.structured_data?.analysis?.documents?.length || 0) +
      (result.data?.structured_data?.analysis?.capabilities?.length || 0) +
      (result.data?.structured_data?.analysis?.roles?.length || 0) +
      (result.data?.structured_data?.analysis?.organizations?.length || 0)
    );
  } else {
    console.error("VALIDATION FAILED:");
    console.error(JSON.stringify(result.issues, null, 2));
    process.exit(1);
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
