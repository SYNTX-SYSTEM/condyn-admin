import { describe, it, expect } from "vitest";
import { processLlmOutput } from "../lib/career/adapter";
import fs from "fs";
import path from "path";
import { CanonicalCareerAnalysisSchema } from "../lib/career/schema";
import { GeminiInferenceSchema } from "../lib/career/schema-projector";

describe("Fixture Boundary Contract (BUG010O)", () => {
  const dir = path.join(__dirname, "gold/case_001_minimal_valid/expected");
  const canonicalPath = path.join(dir, "canonical-expected.json");
  const inferencePath = path.join(dir, "gemini-inference.json");

  it("canonical-expected.json -> CanonicalCareerAnalysisSchema PASS", () => {
    const raw = fs.readFileSync(canonicalPath, "utf-8");
    const parsed = CanonicalCareerAnalysisSchema.safeParse(JSON.parse(raw));
    expect(parsed.success).toBe(true);
  });

  it("gemini-inference.json -> GeminiInferenceSchema PASS", () => {
    const raw = fs.readFileSync(inferencePath, "utf-8");
    const parsed = GeminiInferenceSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      console.error(parsed.error);
    }
    expect(parsed.success).toBe(true);
  });

  it("gemini-inference.json -> CanonicalCareerAnalysisSchema FAIL", () => {
    const raw = fs.readFileSync(inferencePath, "utf-8");
    const parsed = CanonicalCareerAnalysisSchema.safeParse(JSON.parse(raw));
    expect(parsed.success).toBe(false);
  });
});

describe("Canonical Assembly Boundary Contract", () => {
  it("does not fabricate semantic state and correctly assembles the canonical pipeline", () => {
    // 1. Arrange: Raw Inference Payload (Valid GeminiInferenceSchema compact DTO)
    const inferencePayload = {
      report_markdown: "# Analysis",
      consistency: { overall_cohesion_score: 0.9, clusters: [], outlier_doc_ids: [], contradictions: [] },
      entities: [
        {
          entity_kind: "DOCUMENT",
          entity_id: "DOC_001",
          name: "Doc 1",
          properties: {},
          relationships: [],
          evidence: [
            { doc_id: "DOC_001", location: "loc", context_quote: "this is a context quote to pass validation", evidence_score: 0.9 }
          ],
          confidence: 0.9
        }
      ]
    };

    // 2. Act
    const result = processLlmOutput(JSON.stringify(inferencePayload));

    // 3. Assert
    expect(result.success).toBe(true);
    const data = result.data as any;

    // A. Pipeline is inserted at the correct path (structured_data.analysis.pipeline, not structured_data.pipeline)
    expect(data.structured_data.pipeline).toBeUndefined();
    expect(data.structured_data.analysis.pipeline).toBeDefined();

    // B. No ANL_UNKNOWN
    expect(data.structured_data.presentation.ui_layout.center_node_id).not.toBe("ANL_UNKNOWN");
    expect(data.structured_data.presentation.ui_layout.center_node_id).not.toBe("DOC_000");

    // C. Center node is the deterministic DOC_001
    expect(data.structured_data.presentation.ui_layout.center_node_id).toBe("DOC_001");

    // D. Validation ownership
    expect(data.structured_data.analysis.documents[0].validation.status).toBe("PASSED");
  });

  it("fails deterministically if no real entities exist to project presentation", () => {
    const emptyInferencePayload = {
      report_markdown: "# Analysis",
      consistency: { overall_cohesion_score: 0.9, clusters: [], outlier_doc_ids: [], contradictions: [] },
      entities: []
    };

    expect(() => {
      processLlmOutput(JSON.stringify(emptyInferencePayload));
    }).toThrow(/ERR_CANONICAL_ASSEMBLY_EMPTY/);
  });
});

describe("BUG010P: Structural Empty Collection Normalization", () => {
  it("normalizes missing relationships to empty arrays, and injects runtime DOCUMENT with empty evidence", () => {
    const payload = {
      report_markdown: "# Analysis",
      consistency: { overall_cohesion_score: 1.0, clusters: [], outlier_doc_ids: [], contradictions: [] },
      entities: [
        {
          entity_kind: "CAPABILITY",
          entity_id: "C1",
          name: "Capability Without Collections",
          properties: { category: "TECHNICAL", seniority_level: "SENIOR" },
          confidence: 0.9,
          evidence: [{ doc_id: "DOC_001", location: "loc", context_quote: "This is a sufficiently long quote to pass validation", evidence_score: 0.9 }]
          // relationships omitted
        },
        {
          entity_kind: "ORGANIZATION",
          entity_id: "O1",
          name: "Org With Collections",
          properties: { country_iso: "DE", industry_enum: "SOFTWARE", resonance_score: 0.9 },
          relationships: [], // Not adding ROLE_IN_ORGANIZATION here since it points to Org
          evidence: [{ doc_id: "DOC_001", location: "loc", context_quote: "This is a sufficiently long quote to pass validation", evidence_score: 0.9 }],
          confidence: 0.9
        },
        {
          entity_kind: "ROLE",
          entity_id: "R2",
          name: "Role With Collections",
          properties: { seniority: "SENIOR", domain_focus: "ENGINEERING" },
          relationships: [{ target_id: "O1", relation_type: "ROLE_IN_ORGANIZATION", weight: 1.0 }],
          evidence: [{ doc_id: "DOC_001", location: "loc", context_quote: "This is another sufficiently long quote for validation", evidence_score: 0.9 }],
          confidence: 0.9
        }
      ]
    };

    const context = {
      analysis_id: "ANL_TEST",
      pipeline_steps: [],
      documents: [{ docId: "DOC_001", title: "Mock Document", wordCount: 100 }]
    };

    const result = processLlmOutput(JSON.stringify(payload), context);
    if (!result.success) {
      console.error(result.issues);
    }
    expect(result.success).toBe(true);

    const roles = result.data!.structured_data.analysis.roles;
    const capabilities = result.data!.structured_data.analysis.capabilities;
    const documents = result.data!.structured_data.analysis.documents;

    // 1. entity with relationships omitted -> canonical relationships = []
    expect(capabilities.find((c: any) => c.entity_id === "CAP_001").relationships).toEqual([]);

    // 2. evidence exists to pass validation
    expect(capabilities.find((c: any) => c.entity_id === "CAP_001").evidence).toHaveLength(1);

    // 3. existing non-empty relationships preserved exactly
    expect(roles.find((r: any) => r.entity_id === "ROL_001").relationships).toHaveLength(1);
    expect(roles.find((r: any) => r.entity_id === "ROL_001").relationships[0].relation_type).toBe("ROLE_IN_ORGANIZATION");

    // 4. existing non-empty evidence preserved exactly
    expect(roles.find((r: any) => r.entity_id === "ROL_001").evidence).toHaveLength(1);
    expect(roles.find((r: any) => r.entity_id === "ROL_001").evidence[0].context_quote).toBe("This is another sufficiently long quote for validation");

    // 5. runtime DOCUMENT injected with empty evidence
    expect(documents).toHaveLength(1);
    expect(documents[0].entity_id).toBe("DOC_001");
    expect(documents[0].evidence).toEqual([]);
  });
});

