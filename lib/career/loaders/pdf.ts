/**
 * CONDYN CAREER ANALYSIS PROTOCOL v1.0
 * SERVER-SIDE PDF INGESTION LOADER (`lib/career/loaders/pdf.ts`)
 * 
 * Status: Phase 8 Implemented / Zero Client Leakage
 * Scope: Extracts raw text from PDF buffers server-side and encapsulates parser failures as ERR_PDF_PARSE_FAILURE.
 */

import * as pdfParseModule from "pdf-parse";
const pdfParse: any = (pdfParseModule as any).default || pdfParseModule;
import { DocumentInput } from "../adapter";
import { createSourceMetadata } from "./source";

/**
 * Extracts raw text string from a PDF Buffer server-side.
 * Strictly encapsulates any parsing exceptions, empty buffers, or corrupted files as ERR_PDF_PARSE_FAILURE.
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new Error("ERR_PDF_PARSE_FAILURE: PDF buffer is empty, undefined, or not a valid Buffer.");
  }

  try {
    const data = await pdfParse(buffer);
    if (!data || typeof data.text !== "string") {
      throw new Error("Invalid output format from PDF parser engine.");
    }
    const text = data.text.trim();
    if (text.length === 0) {
      throw new Error("Extracted text from PDF document is empty.");
    }
    return text;
  } catch (err: any) {
    if (err.message && err.message.startsWith("ERR_PDF_PARSE_FAILURE:")) {
      throw err;
    }
    throw new Error(`ERR_PDF_PARSE_FAILURE: Failed to parse PDF buffer. Details: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Loads a PDF buffer and transforms it into a canonical DocumentInput object,
 * ready for direct injection into the loadDocuments(...) pipeline layer.
 */
export async function loadPdfDocument(
  buffer: Buffer,
  title?: string,
  docId?: string
): Promise<DocumentInput> {
  const content = await extractTextFromPdf(buffer);
  return {
    docId: docId || "DOC_PDF_001",
    title: title || "PDF Resume",
    content,
    metadata: createSourceMetadata("PDF", content, { title: title || "PDF Resume" })
  };
}
