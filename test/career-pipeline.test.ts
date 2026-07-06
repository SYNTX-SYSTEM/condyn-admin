import fs from "fs";
import path from "path";
import { describe, it, expect } from "vitest";
import { loadDocuments, executeCareerAnalysisPipeline } from "../lib/career/pipeline";
import { MockInferenceProvider } from "../lib/career/adapter";

describe("CONDYN Career Analysis Protocol v1.0 - Step 4.4: Document Loader (`loadDocuments`)", () => {
  it("should sequentially assign DOC_001, DOC_002 when no docId is provided", () => {
    const docs = loadDocuments([
      { title: "CV", content: "Experience in Node.js" },
      { title: "Certificate", content: "AWS Certified" }
    ]);
    expect(docs).toHaveLength(2);
    expect(docs[0].docId).toBe("DOC_001");
    expect(docs[1].docId).toBe("DOC_002");
  });

  it("should accept valid custom ID starting with DOC_ (e.g. DOC_CUSTOM_001)", () => {
    const docs = loadDocuments([
      { docId: "DOC_CUSTOM_001", title: "Custom Doc", content: "Custom content" }
    ]);
    expect(docs).toHaveLength(1);
    expect(docs[0].docId).toBe("DOC_CUSTOM_001");
  });

  it("should reject document ID that does not start with DOC_ (e.g. CAP_001)", () => {
    expect(() => loadDocuments([
      { docId: "CAP_001", title: "Invalid Prefix Doc", content: "Content" }
    ])).toThrow("ERR_INVALID_DOCUMENT_ID");
  });
});

describe("CONDYN Career Analysis Protocol v1.0 - Step 4.4: E2E Pipeline Orchestrator (`executeCareerAnalysisPipeline`)", () => {
  const goldJsonPath = path.join(__dirname, "gold/case_001_minimal_valid/expected/expected.json");
  const goldJsonRaw = fs.readFileSync(goldJsonPath, "utf-8");

  it("should execute E2E pipeline with MockInferenceProvider up to VERIFIED state", async () => {
    const provider = new MockInferenceProvider(goldJsonRaw);
    const result = await executeCareerAnalysisPipeline([
      { title: "Lebenslauf Max Mustermann", content: "Erfahrener Systemarchitekt" }
    ], provider);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.structured_data.analysis.metadata.validation_state).toBe("VERIFIED");
  });

  it("should propagate ERR_JSON_SYNTAX_INVALID when inference provider returns malformed JSON", async () => {
    const provider = new MockInferenceProvider("```json\n{ invalid: json ...\n```");
    const result = await executeCareerAnalysisPipeline([
      { content: "Some content" }
    ], provider);

    expect(result.success).toBe(false);
    expect(result.issues.some(i => i.code === "ERR_JSON_SYNTAX_INVALID")).toBe(true);
  });

  it("should propagate validator issues when provider output contains broken references or rule violations", async () => {
    const brokenJson = goldJsonRaw.replace('"entity_id": "DOC_001"', '"entity_id": "DOC_ORPHAN_999"');
    const provider = new MockInferenceProvider(brokenJson);
    const result = await executeCareerAnalysisPipeline([
      { content: "Some content" }
    ], provider);

    expect(result.success).toBe(false);
    expect(result.issues.some(i => i.code === "ERR_ORPHAN_REFERENCE")).toBe(true);
  });
});
