import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { loadPdfDocument } from "./lib/career/loaders/pdf";
import { buildCareerAnalysisPrompt } from "./lib/career/adapter";

async function run() {
  const pdfPath = process.argv[2];
  if (!pdfPath) throw new Error("Please provide a PDF path");
  const buffer = fs.readFileSync(pdfPath);
  
  const doc = await loadPdfDocument(buffer, path.basename(pdfPath), "DOC_001");
  
  const { userPrompt, systemPrompt } = buildCareerAnalysisPrompt([
    { docId: doc.docId, title: doc.title, content: doc.content }
  ]);
  
  const initialContents = `${systemPrompt}\n\n${userPrompt}`;
  
  const hash = crypto.createHash("sha256").update(initialContents, "utf8").digest("hex");
  
  let nulCount = 0;
  let c0Count = 0;
  let c1Count = 0;
  let unpairedSurrogateCount = 0;
  let replacementCharCount = 0; // U+FFFD
  let unicodeNonCharCount = 0;
  let crCount = 0;
  let lfCount = 0;
  
  const suspiciousCodePoints = new Map<string, number>();

  for (let i = 0; i < initialContents.length; i++) {
    let cp = initialContents.charCodeAt(i);
    // Handle surrogate pairs properly
    if (cp >= 0xD800 && cp <= 0xDBFF) {
      if (i + 1 < initialContents.length) {
        const next = initialContents.charCodeAt(i + 1);
        if (next >= 0xDC00 && next <= 0xDFFF) {
          cp = (cp - 0xD800) * 0x400 + (next - 0xDC00) + 0x10000;
          i++;
        } else {
          unpairedSurrogateCount++;
        }
      } else {
        unpairedSurrogateCount++;
      }
    } else if (cp >= 0xDC00 && cp <= 0xDFFF) {
      unpairedSurrogateCount++;
    }

    if (cp === 0x0000) {
      nulCount++;
      suspiciousCodePoints.set("0x0000", (suspiciousCodePoints.get("0x0000") || 0) + 1);
    } else if (cp === 0x000D) {
      crCount++;
    } else if (cp === 0x000A) {
      lfCount++;
    } else if (cp >= 0x0001 && cp <= 0x001F && cp !== 0x0009 && cp !== 0x000A && cp !== 0x000D) {
      c0Count++;
      const hex = "0x" + cp.toString(16).padStart(4, '0').toUpperCase();
      suspiciousCodePoints.set(hex, (suspiciousCodePoints.get(hex) || 0) + 1);
    } else if (cp >= 0x0080 && cp <= 0x009F) {
      c1Count++;
      const hex = "0x" + cp.toString(16).padStart(4, '0').toUpperCase();
      suspiciousCodePoints.set(hex, (suspiciousCodePoints.get(hex) || 0) + 1);
    } else if (cp === 0xFFFD) {
      replacementCharCount++;
      suspiciousCodePoints.set("0xFFFD", (suspiciousCodePoints.get("0xFFFD") || 0) + 1);
    } else if (
      (cp >= 0xFDD0 && cp <= 0xFDEF) || 
      ((cp & 0xFFFE) === 0xFFFE)
    ) {
      unicodeNonCharCount++;
      const hex = "0x" + cp.toString(16).padStart(4, '0').toUpperCase();
      suspiciousCodePoints.set(hex, (suspiciousCodePoints.get(hex) || 0) + 1);
    }
  }

  console.log(`PDF TEXT CHARS: ${doc.content.length}`);
  console.log(`FINAL CONTENT CHARS: ${initialContents.length}`);
  console.log(`SHA256: ${hash}`);
  console.log(`NUL U+0000 COUNT: ${nulCount}`);
  console.log(`C0 CONTROL COUNT excluding \\n \\r \\t: ${c0Count}`);
  console.log(`C1 CONTROL COUNT: ${c1Count}`);
  console.log(`UNPAIRED SURROGATE COUNT: ${unpairedSurrogateCount}`);
  console.log(`U+FFFD COUNT: ${replacementCharCount}`);
  console.log(`UNICODE NONCHARACTER COUNT: ${unicodeNonCharCount}`);
  console.log(`CR COUNT: ${crCount}`);
  console.log(`LF COUNT: ${lfCount}`);
  
  console.log("\nSUSPICIOUS CODE POINTS:");
  for (const [hex, count] of suspiciousCodePoints.entries()) {
    console.log(`${hex}: ${count}`);
  }
}

run().catch(console.error);
