import { describe, it } from "vitest";
import { loadPdfDocument } from "../lib/career/loaders/pdf";
import { buildCareerAnalysisPrompt } from "../lib/career/adapter";
import { GeminiProvider } from "../lib/career/providers/gemini";
import * as fs from "fs";
import * as crypto from "crypto";

describe.skipIf(!process.env.RUN_GEMINI_DIAGNOSTICS)("BUG010M Forensic PDF Replay", () => {
  it("should answer the forensic questions", async () => {
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
    
    // Monkey patch the provider to intercept chunks
    const originalExecute = provider.execute.bind(provider);
    let errorIntercepted = false;
    
    // Actually we can just run it, but we need to see chunks. Let's patch GoogleGenAI somehow or just modify the provider temporarily.
    // Wait, the prompt says "Instrument GeminiProvider for ONE exact local PDF replay."
    // Let me just modify lib/career/providers/gemini.ts to add the logging directly instead!
  }, 120000);
});
