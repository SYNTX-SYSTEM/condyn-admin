/**
 * CONDYN CAREER ANALYSIS PROTOCOL v1.0
 * BATCH DOCUMENT INGESTION LOADER (`lib/career/loaders/batch.ts`)
 * 
 * Status: Phase 12 Implemented / Zero Client Leakage
 * Scope: Processes multiple text/PDF documents sequentially into canonical DocumentInput[]
 * with stable ID assignment (DOC_001, DOC_002) and progress reporting.
 */

import { DocumentInput } from "../adapter";
import { loadDocuments } from "../pipeline";
import { extractTextFromPdf } from "./pdf";
import { SourceKind, createSourceMetadata } from "./source";

function determineBatchSourceKind(item: BatchDocumentInput): SourceKind {
  if (item.type === "text") return "TEXT";
  if (item.type === "markdown") return "MARKDOWN";
  if (item.type === "pdf") return "PDF";
  if (item.buffer || item.base64) return "PDF";
  return "TEXT";
}

export interface BatchDocumentInput {
  type?: "text" | "markdown" | "pdf";
  title?: string;
  docId?: string;
  content?: string; // For text/markdown
  buffer?: Buffer;  // For server-side PDF buffer
  base64?: string;  // For API JSON payload PDF base64
}

export interface BatchProgress {
  total: number;
  completed: number;
  failed: number;
  currentDocument?: string;
  status: "INGESTING" | "EXTRACTING_PDF" | "VALIDATING" | "COMPLETED" | "FAILED";
}

/**
 * Ingests a batch of mixed documents (text, markdown, PDF) and transforms them into
 * normalized DocumentInput[] with stable sequential IDs (DOC_001, DOC_002, etc.).
 */
export async function loadDocumentBatch(
  batch: BatchDocumentInput[],
  onProgress?: (progress: BatchProgress) => void
): Promise<DocumentInput[]> {
  if (!Array.isArray(batch) || batch.length === 0) {
    const err = new Error("ERR_NO_DOCUMENTS: No documents provided in batch.");
    if (onProgress) {
      onProgress({ total: 0, completed: 0, failed: 0, status: "FAILED" });
    }
    throw err;
  }

  const total = batch.length;
  let completed = 0;
  let failed = 0;

  if (onProgress) {
    onProgress({ total, completed: 0, failed: 0, status: "INGESTING" });
  }

  const rawDocs: { docId?: string; title?: string; content: string }[] = [];

  for (let i = 0; i < total; i++) {
    const item = batch[i];
    const docId = item.docId;
    const title = item.title || `Document ${i + 1}`;

    try {
      let content = "";

      if (item.type === "pdf" || item.buffer || item.base64) {
        if (onProgress) {
          onProgress({ total, completed, failed, currentDocument: title, status: "EXTRACTING_PDF" });
        }

        let pdfBuffer: Buffer | undefined = item.buffer;
        if (!pdfBuffer && item.base64) {
          pdfBuffer = Buffer.from(item.base64, "base64");
        }

        if (!pdfBuffer || pdfBuffer.length === 0) {
          throw new Error("ERR_PDF_PARSE_FAILURE: PDF buffer or base64 data is empty or missing.");
        }

        content = await extractTextFromPdf(pdfBuffer);
      } else {
        if (!item.content || !item.content.trim()) {
          throw new Error(`ERR_EMPTY_CONTENT: Document content cannot be empty (Title: ${title}).`);
        }
        content = item.content.trim();
      }

      const sourceKind = determineBatchSourceKind(item);
      rawDocs.push({
        docId,
        title,
        content,
        metadata: createSourceMetadata(sourceKind, content, { title })
      });
      completed++;

      if (onProgress) {
        onProgress({ total, completed, failed, currentDocument: title, status: "VALIDATING" });
      }
    } catch (err) {
      failed++;
      if (onProgress) {
        onProgress({ total, completed, failed, currentDocument: title, status: "FAILED" });
      }
      throw err; // Fail-fast on any corrupted or empty file in batch
    }
  }

  // Pass through canonical loadDocuments layer to enforce DOC_ prefix and fallback numbering
  const normalizedDocs = loadDocuments(rawDocs);

  if (onProgress) {
    onProgress({ total, completed, failed, status: "COMPLETED" });
  }

  return normalizedDocs;
}
