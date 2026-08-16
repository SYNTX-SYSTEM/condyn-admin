/**
 * CONDYN CAREER ANALYSIS PROTOCOL v1.0
 * TDD STEP 12: BATCH DOCUMENT INGESTION (`test/career-batch-ingestion.test.ts`)
 * 
 * Status: Phase 12 TDD Red-Green Suite
 * Scope: Verifies batch loading of mixed text and PDF documents, stable ID assignment (DOC_001, DOC_002),
 * progress reporting, error handling (ERR_EMPTY_CONTENT, ERR_PDF_PARSE_FAILURE), and batch pipeline execution.
 */

import fs from "fs";
import path from "path";
import { describe, it, expect, vi } from "vitest";
import { loadDocumentBatch, BatchDocumentInput, BatchProgress } from "../lib/career/loaders/batch";
import { executeCareerAnalysisBatchPipeline } from "../lib/career/pipeline";
import { buildCareerAnalysisPrompt, MockInferenceProvider } from "../lib/career/adapter";
import * as pdfLoader from "../lib/career/loaders/pdf";

describe("CONDYN Career Analysis Protocol v1.0 - Step 12: Batch Document Ingestion", () => {
  it("should process multiple text documents into DocumentInput[] with stable sequential IDs and generate a unified prompt", async () => {
    const batch: BatchDocumentInput[] = [
      { type: "text", title: "CV", content: "Experience in React and Node.js." },
      { type: "markdown", title: "Project List", content: "# Projects\nBuilt CONDYN admin." },
      { type: "text", title: "Cover Letter", content: "I am excited to apply for Senior Architect." }
    ];
    const docs = await loadDocumentBatch(batch);
    expect(docs).toHaveLength(3);
    expect(docs[0].docId).toBe("DOC_001");
    expect(docs[1].docId).toBe("DOC_002");
    expect(docs[2].docId).toBe("DOC_003");

    const promptBundle = buildCareerAnalysisPrompt(docs);
    expect(promptBundle.userPrompt).toContain("CV");
    expect(promptBundle.userPrompt).toContain("Experience in React and Node.js.");
    expect(promptBundle.userPrompt).toContain("Project List");
    expect(promptBundle.userPrompt).toContain("Built CONDYN admin.");
    expect(promptBundle.userPrompt).toContain("Cover Letter");
  });

  it("should process multiple PDFs and mixed batches (PDF + text) into DocumentInput[] with stable IDs", async () => {
    vi.spyOn(pdfLoader, "extractTextFromPdf").mockImplementation(async (buf: Buffer) => {
      return `Extracted PDF content: ${buf.toString("utf-8")}`;
    });

    const batch: BatchDocumentInput[] = [
      { type: "text", title: "Intro Notes", content: "Preliminary candidate notes." },
      { type: "pdf", title: "Resume PDF", base64: Buffer.from("PDF RESUME RAW").toString("base64") },
      { type: "pdf", title: "Certificates PDF", buffer: Buffer.from("CERT RAW") }
    ];

    const docs = await loadDocumentBatch(batch);
    expect(docs).toHaveLength(3);
    expect(docs[0].docId).toBe("DOC_001");
    expect(docs[0].content).toBe("Preliminary candidate notes.");
    expect(docs[1].docId).toBe("DOC_002");
    expect(docs[1].content).toContain("Extracted PDF content: PDF RESUME RAW");
    expect(docs[2].docId).toBe("DOC_003");
    expect(docs[2].content).toContain("Extracted PDF content: CERT RAW");

    vi.restoreAllMocks();
  });

  it("should reject empty batch with ERR_NO_DOCUMENTS", async () => {
    await expect(loadDocumentBatch([])).rejects.toThrow(/ERR_NO_DOCUMENTS/);
  });

  it("should reject document with empty content with ERR_EMPTY_CONTENT", async () => {
    await expect(loadDocumentBatch([
      { type: "text", title: "Empty Doc", content: "   " }
    ])).rejects.toThrow(/ERR_EMPTY_CONTENT/);
  });

  it("should reject corrupted or empty PDF buffer with ERR_PDF_PARSE_FAILURE", async () => {
    await expect(loadDocumentBatch([
      { type: "pdf", title: "Bad PDF", buffer: Buffer.from("") }
    ])).rejects.toThrow(/ERR_PDF_PARSE_FAILURE/);
  });

  it("should invoke progress callback during batch processing and maintain accurate document count", async () => {
    const progressEvents: BatchProgress[] = [];
    const batch: BatchDocumentInput[] = [
      { type: "text", title: "Doc 1", content: "Content 1" },
      { type: "text", title: "Doc 2", content: "Content 2" }
    ];

    const docs = await loadDocumentBatch(batch, (p) => {
      progressEvents.push({ ...p });
    });

    expect(docs.length).toBe(batch.length);
    expect(progressEvents.length).toBeGreaterThanOrEqual(3);
    expect(progressEvents[0].status).toBe("INGESTING");
    expect(progressEvents[progressEvents.length - 1].status).toBe("COMPLETED");
    expect(progressEvents[progressEvents.length - 1].completed).toBe(2);
  });

  it("should execute E2E batch analysis pipeline and produce a single CanonicalCareerAnalysis DAG", async () => {
    const goldJsonPath = path.join(__dirname, "gold/case_001_minimal_valid/expected/expected.json");
    const goldJsonRaw = fs.readFileSync(goldJsonPath, "utf-8");
    const provider = new MockInferenceProvider(goldJsonRaw);

    const batch: BatchDocumentInput[] = [
      { type: "text", title: "CV", content: "Erfahrener Senior Cloud Systems Architect" },
      { type: "text", title: "Skills", content: "Kubernetes, Node.js, Drizzle" }
    ];

    const result = await executeCareerAnalysisBatchPipeline(batch, provider);
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.structured_data.analysis.metadata.validation_state).toBe("VERIFIED");
  });
});
