/**
 * CONDYN CAREER ANALYSIS PROTOCOL v1.0
 * BUG 007: PDF PAYLOAD CONTRACT MISMATCH
 * 
 * Scope: Proves that a valid PDF sent from the UI as `{ type: "pdf", content: "<base64>" }`
 * is correctly normalized by the API boundary and passed as valid binary data to the loader.
 */

import { describe, it, expect, vi } from "vitest";
import { POST } from "../app/api/career/analyze/route";
import * as providers from "../lib/career/providers";
import { MockInferenceProvider } from "../lib/career/adapter";

// Helper to create a minimal valid ASCII PDF buffer in memory
function createMinimalPdfBuffer(text: string): Buffer {
  const pdfString = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << >> >>
endobj
4 0 obj
<< /Length ${text.length + 22} >>
stream
BT /F1 24 Tf 100 700 Td (${text}) Tj ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000216 00000 n
trailer
<< /Size 5 /Root 1 0 R >>
startxref
310
%%EOF`;
  return Buffer.from(pdfString, "utf-8");
}

describe("BUG 007: PDF Payload Contract Mismatch", () => {
  it("RED: should normalize UI PDF content into the batch loader PDF payload and reach inference (CATEGORY A)", async () => {
    // 1. Create valid PDF representation
    const validPdfBuffer = createMinimalPdfBuffer("Senior Software Engineer Profile");
    const base64Pdf = validPdfBuffer.toString("base64");

    // 2. Mock inference provider. 
    const mockProvider = new MockInferenceProvider();
    const executeSpy = vi.spyOn(mockProvider, "execute");
    vi.spyOn(providers, "getCareerInferenceProvider").mockReturnValue(mockProvider);

    // 3. Exact payload shape emitted by SemanticCareerIntelligenceField
    const documents = [
      {
        type: "pdf",
        content: base64Pdf, // <-- UI uses 'content' instead of 'base64'
        title: "Profile.pdf",
        docId: "doc_pdf_123"
      }
    ];

    // 4. Execute real loader logic
    const { prepareDocuments } = await import("../lib/career/orchestration/document-loader");
    const { normalizedDocs } = await prepareDocuments(documents);
    
    // 5. Execute pipeline
    const { executeCareerAnalysisPipeline } = await import("../lib/career/pipeline");
    const validationResult = await executeCareerAnalysisPipeline(normalizedDocs, mockProvider);

    expect(validationResult.success).toBe(true);
    
    // Ensure the ingestion pipeline correctly handed off to the inference layer
    expect(executeSpy).toHaveBeenCalled();
  });
});
