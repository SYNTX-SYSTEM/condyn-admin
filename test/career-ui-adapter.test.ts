import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { adaptCanonicalToDemoState } from "../lib/career/ui-adapter";

describe("CONDYN Career Analysis - UI Projection Adapter (Canonical -> SIL v3.0)", () => {
  const goldCasePath = path.join(__dirname, "gold/case_001_minimal_valid/expected/canonical-expected.json");
  const goldJsonRaw = fs.readFileSync(goldCasePath, "utf-8");
  
  // A helper to generate a mutated but structurally valid canonical fixture
  const getMutatedCanonicalPayload = () => {
    const payload = JSON.parse(goldJsonRaw);
    
    // Mutate capabilities to highly distinctive real values
    payload.structured_data.analysis.capabilities = [
      {
        entity_id: "CAP_001",
        identity: { type: "CAPABILITY", name: "Linux Systems Engineering" },
        properties: { proficiency_level: "EXPERT", category: "TECHNICAL" },
        relationships: [],
        evidence: [{ doc_id: "DOC_001", location: "p1", context_quote: "20 years of Linux", evidence_score: 0.9 }],
        confidence: 0.9,
        validation: { status: "PASSED" }
      },
      {
        entity_id: "CAP_002",
        identity: { type: "CAPABILITY", name: "Node.js Platform Architecture" },
        properties: { proficiency_level: "ADVANCED", category: "TECHNICAL" },
        relationships: [],
        evidence: [{ doc_id: "DOC_001", location: "p2", context_quote: "Node.js backend architect", evidence_score: 0.95 }],
        confidence: 0.95,
        validation: { status: "PASSED" }
      },
      {
        entity_id: "CAP_003",
        identity: { type: "CAPABILITY", name: "DevOps Automation" },
        properties: { proficiency_level: "ADVANCED", category: "TECHNICAL" },
        relationships: [],
        evidence: [{ doc_id: "DOC_001", location: "p3", context_quote: "Built full DevOps pipelines", evidence_score: 0.85 }],
        confidence: 0.85,
        validation: { status: "PASSED" }
      }
    ];

    // Empty the domains and strategies arrays to test empty behavior
    payload.structured_data.analysis.domains = [];
    payload.structured_data.analysis.strategies = [];
    
    return payload;
  };

  const stagedDocsMetadata = [
    {
      id: "doc-hash-12345",
      type: "text", // Explicit UI ingestion metadata for the source kind
      title: "Manuelle Text-Eingabe",
      content: "Linux, Node.js, DevOps content here."
    }
  ];

  it("should project CanonicalCareerAnalysis into a valid SIL DemoCareerIntelligenceData structure", () => {
    const canonicalPayload = getMutatedCanonicalPayload();
    const manifest = [{ canonicalDocumentId: "DOC_001", sourceRef: "doc-hash-12345" }];
    const result = adaptCanonicalToDemoState(canonicalPayload, stagedDocsMetadata, manifest);

    expect(result).not.toBeNull();
    
    // 1. CAPABILITY PROJECTION
    const capNames = result.capabilities.map((c: any) => c.name);
    expect(capNames).toContain("Linux Systems Engineering");
    expect(capNames).toContain("Node.js Platform Architecture");
    expect(capNames).toContain("DevOps Automation");
    
    expect(capNames).not.toContain("Distributed Real-Time Sensor Processing");
    expect(capNames).not.toContain("Low-Latency Defense AI Inference");
    expect(capNames).not.toContain("Cloud Native Mesh Orchestration");

    // 2. SOURCE PROJECTION & EVIDENCE GROUNDING
    const sourceKinds = result.sources.map((s: any) => s.sourceKind.toUpperCase());
    expect(sourceKinds).toContain("TEXT");
    
    expect(sourceKinds).not.toContain("PDF");
    expect(sourceKinds).not.toContain("GITHUB_REPOSITORY");
    expect(sourceKinds).not.toContain("GITHUB");
    expect(sourceKinds).not.toContain("WEBSITE");
    
    expect(result.sources[0].sourceTitle).toBe("Manuelle Text-Eingabe");

    // 3. SOURCE COUNT
    expect(result.sources.length).toBe(1);

    // 4. DEMO REPLACEMENT
    // Assert that the analysisId was correctly projected from the canonical metadata, 
    // proving this is not just the original EMPTY_CAREER_INTELLIGENCE_DATA object.
    expect(result.analysisId).toBe(canonicalPayload.structured_data.analysis.metadata.analysis_id);

    // 5. EMPTY DOMAIN BEHAVIOUR
    // Strategies was emptied in the canonical payload. It should remain empty in the projection.
    // The Demo state calls this "nextActions" or similar.
    expect(result.nextActions).toBeDefined();
    expect(result.nextActions.length).toBe(0);
  });

  it("should enforce the SOURCE CORRELATION INVARIANT for multiple sources", () => {
    const multiCanonicalPayload = JSON.parse(goldJsonRaw);
    
    // Create two distinct canonical documents
    multiCanonicalPayload.structured_data.analysis.documents = [
      {
        entity_id: "DOC_001",
        identity: { type: "DOCUMENT", name: "doc1.txt" },
        properties: { word_count: 50 },
        relationships: [],
        evidence: [],
        confidence: 0.9,
        validation: { status: "PASSED" }
      },
      {
        entity_id: "DOC_002",
        identity: { type: "DOCUMENT", name: "repo_readme.md" },
        properties: { word_count: 500 },
        relationships: [],
        evidence: [],
        confidence: 0.9,
        validation: { status: "PASSED" }
      }
    ];

    // SHUFFLE the staged docs order to prove index matching is NOT used
    const multiStagedDocsMetadata = [
      {
        id: "source-github-002",
        type: "github",
        title: "condyn-admin",
        url: "https://github.com/condyn/condyn-admin"
      },
      {
        id: "source-text-001",
        type: "txt",
        title: "Manuelle Text-Eingabe",
        content: "Just some text"
      }
    ];

    const sourceManifest = [
      { canonicalDocumentId: "DOC_001", sourceRef: "source-text-001" },
      { canonicalDocumentId: "DOC_002", sourceRef: "source-github-002" }
    ];

    const result = adaptCanonicalToDemoState(multiCanonicalPayload, multiStagedDocsMetadata, sourceManifest);
    
    expect(result).not.toBeNull();
    expect(result.sources.length).toBe(2);

    const source1 = result.sources[0];
    const source2 = result.sources[1];

    // Assuming the correlation contract maps DOC_001 -> source-text-001 and DOC_002 -> source-github-002
    // We expect EXACT mappings. We do NOT allow array index matching.
    // If correlation cannot be proven by a deterministic key, the adapter MUST fail or mark it unknown.
    
    expect(source1.sourceKind).toBe("TXT");
    expect(source1.sourceTitle).toBe("Manuelle Text-Eingabe");
    
    expect(source2.sourceKind).toBe("GITHUB");
    expect(source2.sourceTitle).toBe("condyn-admin");

    // No swap
    const allTitles = result.sources.map((s: any) => s.sourceTitle);
    expect(allTitles).toContain("Manuelle Text-Eingabe");
    expect(allTitles).toContain("condyn-admin");
    expect(allTitles).not.toContain("Unknown Document");
  });
});
