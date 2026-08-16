import { loadPdfDocument } from "./lib/career/loaders/pdf";
import { buildCareerAnalysisPrompt } from "./lib/career/adapter";
import { GeminiProvider } from "./lib/career/providers/gemini";
import * as fs from "fs";

async function runTrace() {
  console.log("Loading PDF...");
  const pdfPath = "/home/codi/Dokumente/SYNTX/SYNTX_WIKI/SYNTX_Dossier_Kap6_FINAL.pdf";
  const buffer = fs.readFileSync(pdfPath);
  const doc = await loadPdfDocument(buffer, "SYNTX_Dossier_Kap6_FINAL.pdf");
  const docs = [doc];
  const prompt = buildCareerAnalysisPrompt(docs);
  
  let apiKey = process.env.GEMINI_API_KEY;
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
  
  try {
    await provider.execute(prompt);
  } catch (err: any) {
    console.error("Trace finished with error:", err.message);
  }
}

runTrace().catch(console.error);
