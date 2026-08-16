import { loadPdfDocument } from "./lib/career/loaders/pdf";
import { buildCareerAnalysisPrompt } from "./lib/career/adapter";
import { GeminiProvider } from "./lib/career/providers/gemini";
import * as fs from "fs";
import * as crypto from "crypto";

// Simple JSON string state machine to detect control characters
function scanJsonForControlChars(rawText: string) {
  let insideString = false;
  let escapeNext = false;
  let rawLf = 0;
  let rawCr = 0;
  let rawTab = 0;
  let badControlCount = 0;
  let firstBadPos = -1;
  let firstBadHex = "";

  for (let i = 0; i < rawText.length; i++) {
    const charCode = rawText.charCodeAt(i);
    const isControl = charCode >= 0x00 && charCode <= 0x1F;

    if (charCode === 0x0A) rawLf++;
    if (charCode === 0x0D) rawCr++;
    if (charCode === 0x09) rawTab++;

    if (!insideString) {
      if (charCode === 0x22) { // '"'
        insideString = true;
      }
    } else {
      if (escapeNext) {
        escapeNext = false;
      } else {
        if (charCode === 0x5C) { // '\\'
          escapeNext = true;
        } else if (charCode === 0x22) { // '"'
          insideString = false;
        } else if (isControl) {
          badControlCount++;
          if (firstBadPos === -1) {
            firstBadPos = i;
            firstBadHex = charCode.toString(16);
          }
        }
      }
    }
  }

  return {
    rawLf,
    rawCr,
    rawTab,
    badControlCount,
    firstBadPos,
    firstBadHex
  };
}

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

  console.log("RUN | FINISH | TOKENS | CHARS | JSON | BAD CONTROL | SHA256");

  for (let run = 1; run <= 5; run++) {
    try {
      // The GeminiProvider sets lastTelemetry, so we can extract tokens and finish reason
      const rawOutput = await provider.execute(prompt);
      
      const finish = provider.lastTelemetry?.finishReason || "UNKNOWN";
      const tokens = provider.lastTelemetry?.outputTokens || 0;
      const chars = rawOutput.length;
      const sha256 = crypto.createHash("sha256").update(rawOutput).digest("hex").substring(0, 16);
      
      let jsonPass = "FAIL";
      let parseErrPos = -1;
      let parseErrHex = "";
      
      try {
        JSON.parse(rawOutput);
        jsonPass = "PASS";
      } catch (e: any) {
        const match = e.message.match(/position (\d+)/);
        if (match) {
          parseErrPos = parseInt(match[1], 10);
          parseErrHex = rawOutput.charCodeAt(parseErrPos).toString(16);
        }
      }

      const scanResult = scanJsonForControlChars(rawOutput);
      const hasBadControl = scanResult.badControlCount > 0 ? "YES" : "NO";
      
      console.log(`${run} | ${finish} | ${tokens} | ${chars} | ${jsonPass} | ${hasBadControl} | ${sha256}`);
      
      if (jsonPass === "FAIL") {
        console.log(`\n--- RUN ${run} FAILURE DETAILS ---`);
        console.log(`ERROR_POSITION: ${parseErrPos}`);
        console.log(`ERROR_CODEPOINT_HEX: ${parseErrHex}`);
        console.log(`RAW_RESPONSE_CONTAINS_BAD_CONTROL_CHAR: ${hasBadControl}`);
        console.log(`RAW LF: ${scanResult.rawLf}`);
        console.log(`RAW CR: ${scanResult.rawCr}`);
        console.log(`RAW TAB: ${scanResult.rawTab}`);
        console.log(`UNESCAPED CONTROL CHARS INSIDE JSON STRINGS: ${scanResult.badControlCount}`);
        if (scanResult.badControlCount > 0) {
          console.log(`First bad control char at pos ${scanResult.firstBadPos} with hex ${scanResult.firstBadHex}`);
        }
        console.log(`-----------------------------------\n`);
      }
      
    } catch (err: any) {
      console.error(`RUN ${run} FAILED COMPLETELY: ${err.message}`);
    }
  }
}

runTrace().catch(console.error);
