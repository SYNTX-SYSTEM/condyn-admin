import { describe, it, expect } from "vitest";
import { executeCareerAnalysisPipeline } from "../lib/career/pipeline";
import { MockInferenceProvider, buildCareerAnalysisPrompt } from "../lib/career/adapter";
import { DocumentInput } from "../lib/career/index";

describe("CONDYN Career Analysis Protocol v1.0 — TEST001E: PDF + GITHUB Y-Node Pipeline", () => {
  it("should securely merge multi-source documents, preserve unique IDs, and trace evidence correctly", async () => {
    // 1. Arrange: PDF and GitHub Multi-Source Documents
    const multiSourceDocs: DocumentInput[] = [
      {
        url: "file://resume.pdf",
        type: "pdf",
        docId: "DOC_001",
        title: "Jane Doe Resume",
        content: "Senior Systems Engineer specializing in Rust. Worked at TechCorp from 2020 to 2026."
      },
      {
        url: "https://github.com/janedoe/rust-core",
        type: "github",
        docId: "DOC_GH_001",
        title: "README.md",
        content: "# rust-core\nHigh performance distributed systems core."
      },
      {
        url: "https://github.com/janedoe/rust-core",
        type: "github",
        docId: "DOC_GH_002",
        title: "src/main.rs",
        content: "fn main() { println!(\"Starting cluster...\"); }"
      }
    ];

    // 2. Validate Prompt Builder securely propagates all source IDs
    const prompt = buildCareerAnalysisPrompt(multiSourceDocs);
    expect(prompt.allowedDocIds).toEqual(["DOC_001", "DOC_GH_001", "DOC_GH_002"]);

    // 3. Arrange: Precise Inference Mock spanning multiple sources
    const inferenceMockPayload = {
      report_markdown: "# Analysis of Jane Doe (Multi-Source)",
      consistency: {
        overall_cohesion_score: 0.95,
        clusters: [],
        outlier_doc_ids: [],
        contradictions: []
      },
      entities: [
        {
          entity_kind: "ROLE",
          entity_id: "ROL_001",
          name: "Senior Systems Engineer",
          properties: { seniority: "SENIOR", domain_focus: "Systems" },
          confidence: 0.95,
          relationships: [
            { target_id: "ORG_001", relation_type: "ROLE_IN_ORGANIZATION", weight: 1.0 }
          ],
          evidence: [
            {
              doc_id: "DOC_001", // Evidence from PDF
              location: "Page 1",
              context_quote: "Senior Systems Engineer specializing in Rust.",
              evidence_score: 0.95
            }
          ]
        },
        {
          entity_kind: "ORGANIZATION",
          entity_id: "ORG_001",
          name: "TechCorp",
          properties: { country_iso: "US", industry_enum: "SOFTWARE", resonance_score: 0.9 },
          confidence: 0.95,
          relationships: [],
          evidence: [
            {
              doc_id: "DOC_001", // Evidence from PDF
              location: "Page 1",
              context_quote: "Worked at TechCorp from 2020 to 2026.",
              evidence_score: 0.95
            }
          ]
        },
        {
          entity_kind: "CAPABILITY",
          entity_id: "CAP_001",
          name: "Rust Core Development",
          properties: { category: "TECHNICAL", seniority_level: "SENIOR" },
          confidence: 0.9,
          relationships: [],
          evidence: [
            {
              doc_id: "DOC_GH_001", // Evidence from GitHub README
              location: "Header",
              context_quote: "High performance distributed systems core.",
              evidence_score: 0.95
            },
            {
              doc_id: "DOC_GH_002", // Evidence from GitHub Source Code
              location: "main.rs",
              context_quote: "fn main() { println!(\"Starting cluster...\"); }",
              evidence_score: 0.9
            }
          ]
        }
      ]
    };

    const provider = new MockInferenceProvider(JSON.stringify(inferenceMockPayload));

    // 4. Act: Execute the fully integrated Pipeline with Multi-Source inputs
    const result = await executeCareerAnalysisPipeline(multiSourceDocs, provider);

    if (!result.success) {
      console.error(result.issues);
    }
    expect(result.success).toBe(true);

    const canonicalData = result.data!.structured_data.analysis;

    // 5. Assert: All Runtime Documents Retained and Identifiers Preserved
    expect(canonicalData.documents).toHaveLength(3);
    const docIds = canonicalData.documents.map(d => d.entity_id);
    expect(docIds).toContain("DOC_001");
    expect(docIds).toContain("DOC_GH_001");
    expect(docIds).toContain("DOC_GH_002");

    // All documents must have evidence = [] as per Zero-State rule
    for (const doc of canonicalData.documents) {
      expect(doc.evidence).toEqual([]);
    }

    // 6. Assert: Cross-Source Evidence correctly mapped back
    const roles = canonicalData.roles;
    expect(roles).toHaveLength(1);
    expect(roles[0].evidence[0].doc_id).toBe("DOC_001");

    const capabilities = canonicalData.capabilities;
    expect(capabilities).toHaveLength(1);
    expect(capabilities[0].evidence).toHaveLength(2);
    const capEvidenceDocIds = capabilities[0].evidence.map(e => e.doc_id);
    expect(capEvidenceDocIds).toContain("DOC_GH_001");
    expect(capEvidenceDocIds).toContain("DOC_GH_002");

    // Negative assert: No sources overwritten or faked
    expect(canonicalData.documents.find(d => d.entity_id === "DOC_GH_001")!.identity.name).toBe("README.md");
    expect(canonicalData.documents.find(d => d.entity_id === "DOC_001")!.identity.name).toBe("Jane Doe Resume");
  });
});
