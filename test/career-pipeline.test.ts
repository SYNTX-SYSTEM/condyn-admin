import fs from "fs";
import path from "path";
import { describe, it, expect, vi } from "vitest";
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
  const goldJsonPath = path.join(__dirname, "gold/case_001_minimal_valid/expected/gemini-inference.json");
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

  it("Runtime telemetry V1: signals INFERENCE before provider await and ANALYSIS_VALIDATION before output processing", async () => {
    const operations: string[] = [];
    const provider = new MockInferenceProvider(goldJsonRaw);
    vi.spyOn(provider, "execute").mockImplementation(async () => {
      expect(operations).toEqual(["INFERENCE"]);
      return goldJsonRaw;
    });

    const result = await executeCareerAnalysisPipeline(
      [{ title: "Telemetry source", content: "Career analysis source" }],
      provider,
      {
        onRuntimeOperation: (operation: string) => operations.push(operation)
      } as any
    );

    expect(result.success).toBe(true);
    expect(operations).toEqual(["INFERENCE", "ANALYSIS_VALIDATION"]);
  });

  it("should propagate ERR_JSON_SYNTAX_INVALID when inference provider returns malformed JSON", async () => {
    const provider = new MockInferenceProvider("```json\n{ invalid: json ...\n```");
    const result = await executeCareerAnalysisPipeline([
      { content: "Some content" }
    ], provider);

    expect(result.success).toBe(false);
    expect(result.issues.some(i => i.code === "ERR_JSON_SYNTAX_INVALID")).toBe(true);
  });

  it("should propagate assembly errors when inference output contains broken document references", async () => {
    // If we replace the DOC_001 ID in the evidence but not the source array, the assembly will detect a missing document
    const brokenJson = goldJsonRaw.replace('"doc_id": "DOC_001"', '"doc_id": "DOC_ORPHAN_999"');
    const provider = new MockInferenceProvider(brokenJson);
    
    await expect(
      executeCareerAnalysisPipeline([
        { docId: "DOC_001", content: "Some content" }
      ], provider)
    ).rejects.toThrow(/ERR_CANONICAL_ASSEMBLY_DOCUMENT_REFERENCE_MISSING/);
  });

  it("BUG010Q: should create canonical DOCUMENT from runtime context even if LLM omits it", async () => {
    const inferencePayload = {
      report_markdown: "# Analysis",
      consistency: { overall_cohesion_score: 1.0, clusters: [], outlier_doc_ids: [], contradictions: [] },
      entities: [
        {
          entity_kind: "CAPABILITY",
          entity_id: "CAP_001",
          name: "Test Capability",
          properties: {},
          confidence: 0.9,
          evidence: [
            { doc_id: "DOC_001", location: "loc", context_quote: "this is a valid long quote for testing", evidence_score: 0.9 }
          ]
        }
      ]
    };
    
    const provider = new MockInferenceProvider(JSON.stringify(inferencePayload));
    
    const result = await executeCareerAnalysisPipeline([
      { docId: "DOC_001", title: "Real PDF", content: "Test Capability" }
    ], provider);

    expect(result.success).toBe(true);
    
    // Canonical output must contain the real canonical DOCUMENT
    const docs = result.data!.structured_data.analysis.documents;
    expect(docs).toHaveLength(1);
    expect(docs[0].entity_id).toBe("DOC_001");
    expect(docs[0].identity.name).toBe("Real PDF");
    expect(docs[0].properties.raw_word_count).toBeDefined();

    // Capability evidence still references DOC_001
    const caps = result.data!.structured_data.analysis.capabilities;
    expect(caps).toHaveLength(1);
    expect(caps[0].evidence[0].doc_id).toBe("DOC_001");
  });
});
