import { describe, it, expect } from "vitest";
import { executeCareerAnalysisPipeline } from "../lib/career/pipeline";
import { MockInferenceProvider, buildCareerAnalysisPrompt } from "../lib/career/adapter";
import { DocumentInput } from "../lib/career/index";

describe("CONDYN Career Analysis Protocol v1.0 — TEST001F: FULL MULTI-SOURCE END-TO-END", () => {
  it("should harmoniously orchestrate PDF, GitHub, Website, and Markdown sources into a single canonical state", async () => {
    // 1. Arrange: All four Runtime Document Source Families
    const multiSourceDocs: DocumentInput[] = [
      {
        url: "file://resume.pdf",
        type: "pdf",
        docId: "DOC_001",
        title: "Jane Doe Resume PDF",
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
        url: "https://janedoe.engineer/profile",
        type: "website",
        docId: "DOC_WEB_001",
        title: "Jane Doe Website",
        content: "I design scalable architecture."
      },
      {
        url: "memory://manual-text",
        type: "markdown",
        docId: "DOC_TXT_001",
        title: "Direct Input",
        content: "I am actively seeking roles in Munich."
      }
    ];

    // 2. Validate Prompt Builder securely propagates all source IDs
    const prompt = buildCareerAnalysisPrompt(multiSourceDocs);
    const expectedIds = ["DOC_001", "DOC_GH_001", "DOC_WEB_001", "DOC_TXT_001"];
    expect(prompt.allowedDocIds).toHaveLength(4);
    for (const id of expectedIds) {
      expect(prompt.allowedDocIds).toContain(id);
    }

    // 3. Arrange: Precise Inference Mock spanning all sources with cross-source bindings
    const inferenceMockPayload = {
      report_markdown: "# Full Multi-Source Career Analysis",
      consistency: {
        overall_cohesion_score: 0.95,
        clusters: [],
        outlier_doc_ids: [],
        contradictions: []
      },
      entities: [
        {
          // A semantic claim grounded only in one source (PDF)
          entity_kind: "ORGANIZATION",
          entity_id: "ORG_001",
          name: "TechCorp",
          properties: { country_iso: "US", industry_enum: "SOFTWARE", resonance_score: 0.9 },
          confidence: 0.95,
          relationships: [],
          evidence: [
            {
              doc_id: "DOC_001",
              location: "Page 1",
              context_quote: "Worked at TechCorp from 2020 to 2026.",
              evidence_score: 0.95
            }
          ]
        },
        {
          // CAPABILITY A: PDF + GitHub evidence
          entity_kind: "CAPABILITY",
          entity_id: "CAP_001",
          name: "Rust Core Development",
          properties: { category: "TECHNICAL", seniority_level: "SENIOR" },
          confidence: 0.95,
          relationships: [],
          evidence: [
            {
              doc_id: "DOC_001", // PDF
              location: "Summary",
              context_quote: "specializing in Rust.",
              evidence_score: 0.9
            },
            {
              doc_id: "DOC_GH_001", // GitHub
              location: "README",
              context_quote: "High performance distributed systems core.",
              evidence_score: 0.95
            }
          ]
        },
        {
          // CAPABILITY B: Website + Markdown evidence
          entity_kind: "CAPABILITY",
          entity_id: "CAP_002",
          name: "Scalable Architecture",
          properties: { category: "TECHNICAL", seniority_level: "SENIOR" },
          confidence: 0.95,
          relationships: [],
          evidence: [
            {
              doc_id: "DOC_WEB_001", // Website
              location: "Profile",
              context_quote: "I design scalable architecture.",
              evidence_score: 0.9
            },
            {
              doc_id: "DOC_TXT_001", // Markdown / Text
              location: "Input",
              context_quote: "I am actively seeking roles",
              evidence_score: 0.8
            }
          ]
        },
        {
          // ROLE: PDF evidence, linked to TechCorp
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
              doc_id: "DOC_001", // PDF
              location: "Summary",
              context_quote: "Senior Systems Engineer specializing in Rust.",
              evidence_score: 0.95
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

    // 5. Assert: DOCUMENT OWNERSHIP
    // All 4 runtime documents must survive independently
    expect(canonicalData.documents).toHaveLength(4);
    const docIds = canonicalData.documents.map(d => d.entity_id);
    for (const id of expectedIds) {
      expect(docIds).toContain(id);
    }

    // Zero-State Rule: each runtime document must have evidence: []
    for (const doc of canonicalData.documents) {
      expect(doc.evidence).toEqual([]);
    }

    // 6. Assert: CROSS-SOURCE EVIDENCE BINDINGS
    // Organization (PDF only)
    const orgs = canonicalData.organizations;
    expect(orgs).toHaveLength(1);
    expect(orgs[0].evidence).toHaveLength(1);
    expect(orgs[0].evidence[0].doc_id).toBe("DOC_001");

    // Role (PDF only)
    const roles = canonicalData.roles;
    expect(roles).toHaveLength(1);
    expect(roles[0].evidence).toHaveLength(1);
    expect(roles[0].evidence[0].doc_id).toBe("DOC_001");

    // Capabilities (Cross-source)
    const capabilities = canonicalData.capabilities;
    expect(capabilities).toHaveLength(2);

    const capA = capabilities.find(c => c.entity_id === "CAP_001")!;
    expect(capA.evidence).toHaveLength(2);
    const capA_docs = capA.evidence.map(e => e.doc_id);
    expect(capA_docs).toContain("DOC_001");
    expect(capA_docs).toContain("DOC_GH_001");

    const capB = capabilities.find(c => c.entity_id === "CAP_002")!;
    expect(capB.evidence).toHaveLength(2);
    const capB_docs = capB.evidence.map(e => e.doc_id);
    expect(capB_docs).toContain("DOC_WEB_001");
    expect(capB_docs).toContain("DOC_TXT_001");

    // 7. Assert NO SEMANTIC CROSS-CONTAMINATION
    // Ensure titles are preserved uniquely
    expect(canonicalData.documents.find(d => d.entity_id === "DOC_001")!.identity.name).toBe("Jane Doe Resume PDF");
    expect(canonicalData.documents.find(d => d.entity_id === "DOC_GH_001")!.identity.name).toBe("README.md");
    expect(canonicalData.documents.find(d => d.entity_id === "DOC_WEB_001")!.identity.name).toBe("Jane Doe Website");
    expect(canonicalData.documents.find(d => d.entity_id === "DOC_TXT_001")!.identity.name).toBe("Direct Input");
  });
});
