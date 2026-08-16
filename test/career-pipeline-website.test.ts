import { describe, it, expect } from "vitest";
import { loadWebsiteDocument } from "../lib/career/loaders/website";
import { buildCareerAnalysisPrompt } from "../lib/career/adapter";
import { MockInferenceProvider, processLlmOutput } from "../lib/career/adapter";

describe("CONDYN Career Analysis Protocol v1.0 — TEST001D Website Pipeline E2E", () => {
  it("should process a website document through the canonical pipeline with strict evidence enforcement", async () => {
    // 1. Mock realistic website HTML
    const mockHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Jane Doe - Senior Systems Engineer</title>
          <style>body { font-family: sans-serif; }</style>
        </head>
        <body>
          <nav>
            <ul>
              <li><a href="/">Home</a></li>
              <li><a href="/contact">Contact</a></li>
            </ul>
          </nav>
          <header>
            <h1>Jane Doe</h1>
            <p>Senior Systems Engineer</p>
          </header>
          <main>
            <section id="about">
              <h2>Professional Description</h2>
              <p>Specialist in Rust and Kubernetes architecture with over 8 years of experience designing highly scalable distributed systems for financial institutions.</p>
            </section>
            <section id="projects">
              <h2>Architecture Projects</h2>
              <p>Led the migration of legacy monolith to microservices on AWS, improving deployment frequency by 200%.</p>
            </section>
          </main>
          <script>
            console.log("Analytics loaded");
          </script>
          <footer>
            <p>Copyright 2026 Jane Doe</p>
          </footer>
        </body>
      </html>
    `;

    const mockFetcher = async () => ({
      ok: true,
      status: 200,
      text: async () => mockHtml
    });

    // 2. Load Website Document
    const doc = await loadWebsiteDocument(
      "https://janedoe.engineer/profile",
      "Jane Doe Profile",
      "DOC_WEB_001",
      mockFetcher as any
    );

    expect(doc.docId).toBe("DOC_WEB_001");
    expect(doc.content).toContain("Specialist in Rust and Kubernetes");
    expect(doc.content).not.toContain("Analytics loaded");
    expect(doc.content).not.toContain("font-family");

    // 3. Build Prompt Bundle
    const promptBundle = buildCareerAnalysisPrompt([doc]);
    
    // Validate that the system properly extracts allowed IDs
    expect(promptBundle.allowedDocIds).toEqual(["DOC_WEB_001"]);

    // 4. Mock Inference Output matching the strict GeminiInferenceSchema structure
    const inferenceMockPayload = {
      report_markdown: "# Analysis of Jane Doe's Profile\nThis document outlines Jane Doe's career architecture based on her professional website.",
      consistency: {
        overall_cohesion_score: 0.95,
        clusters: [],
        outlier_doc_ids: [],
        contradictions: []
      },
      entities: [
        {
          entity_kind: "CAPABILITY",
          entity_id: "CAP_001",
          name: "Kubernetes Architecture",
          properties: { category: "TECHNICAL", seniority_level: "SENIOR" },
          confidence: 0.9,
          evidence: [
            {
              doc_id: "DOC_WEB_001",
              location: "Professional Description",
              context_quote: "Specialist in Rust and Kubernetes architecture with over 8 years of experience",
              evidence_score: 0.95
            }
          ]
        },
        {
          entity_kind: "ORGANIZATION",
          entity_id: "ORG_001",
          name: "Financial Institutions",
          properties: { country_iso: "US", industry_enum: "FINANCE", resonance_score: 0.9 },
          confidence: 0.9,
          relationships: [],
          evidence: [
            {
              doc_id: "DOC_WEB_001",
              location: "Professional Description",
              context_quote: "designing highly scalable distributed systems for financial institutions",
              evidence_score: 0.9
            }
          ]
        },
        {
          entity_kind: "ROLE",
          entity_id: "ROL_001",
          name: "Senior Systems Engineer",
          properties: { seniority: "SENIOR", domain_focus: "Distributed Systems" },
          confidence: 0.95,
          relationships: [
            { target_id: "ORG_001", relation_type: "ROLE_IN_ORGANIZATION", weight: 1.0 }
          ],
          evidence: [
            {
              doc_id: "DOC_WEB_001",
              location: "Header",
              context_quote: "Senior Systems Engineer",
              evidence_score: 0.95
            }
          ]
        }
      ]
    };

    const provider = new MockInferenceProvider(JSON.stringify(inferenceMockPayload));
    const rawOutput = await provider.execute(promptBundle);

    // 5. Canonical Assembly and Validation
    const context = {
      analysis_id: "ANL_WEB_TEST",
      pipeline_steps: [],
      documents: [doc]
    };

    const result = processLlmOutput(rawOutput, context);

    if (!result.success) {
      console.error(result.issues);
    }
    
    expect(result.success).toBe(true);

    const canonicalData = result.data!.structured_data.analysis;

    // A. Assert runtime document injection
    expect(canonicalData.documents).toHaveLength(1);
    expect(canonicalData.documents[0].entity_id).toBe("DOC_WEB_001");
    
    // B. Assert runtime document has empty evidence
    expect(canonicalData.documents[0].evidence).toEqual([]);
    
    // C. Assert semantic entities retain their strict evidence bound to the website doc
    expect(canonicalData.capabilities).toHaveLength(1);
    expect(canonicalData.capabilities[0].entity_id).toBe("CAP_001");
    expect(canonicalData.capabilities[0].evidence).toHaveLength(1);
    expect(canonicalData.capabilities[0].evidence[0].doc_id).toBe("DOC_WEB_001");

    expect(canonicalData.roles).toHaveLength(1);
    expect(canonicalData.roles[0].entity_id).toBe("ROL_001");
    expect(canonicalData.roles[0].evidence).toHaveLength(1);
    expect(canonicalData.roles[0].evidence[0].doc_id).toBe("DOC_WEB_001");
  });
});
