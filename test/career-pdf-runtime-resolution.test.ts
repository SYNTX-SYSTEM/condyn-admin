import { describe, it, expect } from "vitest";
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

describe("CONDYN Career Analysis Protocol v1.0 - BUG 009: Next.js Runtime PDF Worker Resolution (CATEGORY A)", () => {
  it("should successfully parse PDF in Node.js runtime without pdf.worker.mjs resolution errors", async () => {
    const validPdfBuffer = createMinimalPdfBuffer("Senior Systems Engineer with 10 years experience.");
    const minimalPdfBase64 = validPdfBuffer.toString("base64");
    
    const documents = [{ type: "pdf", title: "Test PDF", content: minimalPdfBase64 }];

    const { prepareDocuments } = await import("../lib/career/orchestration/document-loader");
    const { executeCareerAnalysisPipeline } = await import("../lib/career/pipeline");
    
    const { normalizedDocs } = await prepareDocuments(documents);
    const mockProvider = new MockInferenceProvider();
    
    const validationResult = await executeCareerAnalysisPipeline(normalizedDocs, mockProvider);
    
    expect(validationResult.success).toBe(true);
    const analysis = validationResult.data as any;
    expect(analysis.structured_data.analysis.metadata.validation_state).toBe("VERIFIED");
  });
});
