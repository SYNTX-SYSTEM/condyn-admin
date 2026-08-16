import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { loadPdfDocument } from "./lib/career/loaders/pdf";
import { buildCareerAnalysisPrompt } from "./lib/career/adapter";
import { GeminiProvider } from "./lib/career/providers/gemini";
try {
  const envFile = fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf8");
  envFile.split("\n").forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].trim().replace(/^"|"$/g, '');
    }
  });
} catch (e) {}

async function run() {
  const pdfPath = "/home/codi/Dokumente/SYNTX/SYNTX_WIKI/SYNTX_Dossier_Kap6_FINAL.pdf";
  const buffer = fs.readFileSync(pdfPath);
  
  const doc = await loadPdfDocument(buffer, path.basename(pdfPath), "DOC_001");
  
  const prompt = buildCareerAnalysisPrompt([
    { docId: doc.docId, title: doc.title, content: doc.content }
  ]);
  
  const initialContents = `${prompt.systemPrompt}\n\n${prompt.userPrompt}`;
  const hash = crypto.createHash("sha256").update(initialContents, "utf8").digest("hex");
  
  console.log(`STEP 2 EXACT REPLAY`);
  console.log(`SHA256: ${hash}`);

  const provider = new GeminiProvider();
  
  try {
    const result = await provider.execute(prompt);
    console.log(`HTTP: 200 (Success)`);
  } catch (err: any) {
    console.log(err.message || String(err));
  }
}

run().catch(console.error);
