import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { loadPdfDocument } from "./lib/career/loaders/pdf";
import { buildCareerAnalysisPrompt } from "./lib/career/adapter";

async function run() {
  const allPdfs = fs.readFileSync("pdflist.txt", "utf8").split("\n").filter(Boolean);

  for (const pdf of allPdfs) {
    if (!pdf) continue;
    try {
      const buffer = fs.readFileSync(pdf);
      const doc = await loadPdfDocument(buffer, path.basename(pdf), "DOC_001");
      const { userPrompt, systemPrompt } = buildCareerAnalysisPrompt([
        { docId: doc.docId, title: doc.title, content: doc.content }
      ]);
      const initialContents = `${systemPrompt}\n\n${userPrompt}`;
      
      // If it is around 122600 +/- 10000
      if (initialContents.length > 115000 && initialContents.length < 135000) {
        console.log(`FOUND LIKELY MATCH: ${pdf}`);
        console.log(`FINAL CONTENT CHARS: ${initialContents.length}`);
      }
    } catch (e) {
      // ignore parse errors on irrelevant pdfs
    }
  }
  console.log("Done scanning.");
}

run().catch(console.error);
