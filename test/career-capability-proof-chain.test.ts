import { describe, it, expect } from "vitest";
import { buildCapabilityProofChain, ProofChainSourceManifestEntry } from "../lib/career/evidence/proof-chain";
import { Analysis } from "../lib/career/schema";

describe("CONDYN Career Analysis Protocol v2.0 - PHASE 2: EVIDENCE → CAPABILITY PROOF CHAIN", () => {
  
  const mockManifest: ProofChainSourceManifestEntry[] = [
    { canonicalDocumentId: "DOC_001", sourceRef: "file://resume.pdf" },
    { canonicalDocumentId: "DOC_GH_001", sourceRef: "https://github.com/test/repo" },
    { canonicalDocumentId: "DOC_WEB_001", sourceRef: "https://test.com" }
  ];

  const mockAnalysis: Analysis = {
    metadata: {
      analysis_id: "ANL_001",
      protocol_version: "1.0",
      schema_version: "1.0",
      prompt_contract_version: "1.0"
    },
    pipeline: { steps: [] },
    consistency: { overall_cohesion_score: 0.9, clusters: [], outlier_doc_ids: [], contradictions: [] },
    documents: [
      {
        entity_id: "DOC_001",
        identity: { type: "DOCUMENT", name: "PDF Resume" },
        properties: {},
        relationships: [],
        evidence: [],
        confidence: 1.0,
        validation: { status: "PASSED" }
      },
      {
        entity_id: "DOC_GH_001",
        identity: { type: "DOCUMENT", name: "GitHub README" },
        properties: {},
        relationships: [],
        evidence: [],
        confidence: 1.0,
        validation: { status: "PASSED" }
      }
    ],
    capabilities: [
      {
        entity_id: "CAP_001",
        identity: { type: "CAPABILITY", name: "Single Source Cap" },
        properties: {},
        relationships: [],
        confidence: 0.9,
        validation: { status: "PASSED" },
        evidence: [
          {
            doc_id: "DOC_001",
            location: "Page 1",
            context_quote: "Single source quote.",
            evidence_score: 0.9
          }
        ]
      },
      {
        entity_id: "CAP_002",
        identity: { type: "CAPABILITY", name: "Multi Source Cap" },
        properties: {},
        relationships: [],
        confidence: 0.95,
        validation: { status: "PASSED" },
        evidence: [
          {
            doc_id: "DOC_001",
            location: "Page 2",
            context_quote: "First part from PDF.",
            evidence_score: 0.9
          },
          {
            doc_id: "DOC_GH_001",
            location: "README.md",
            context_quote: "Second part from GitHub.",
            evidence_score: 0.95
          }
        ]
      },
      {
        entity_id: "CAP_003",
        identity: { type: "CAPABILITY", name: "Broken Doc Cap" },
        properties: {},
        relationships: [],
        confidence: 0.8,
        validation: { status: "PASSED" },
        evidence: [
          {
            doc_id: "DOC_UNKNOWN_999",
            location: "Nowhere",
            context_quote: "This document does not exist.",
            evidence_score: 0.8
          }
        ]
      },
      {
        entity_id: "CAP_004",
        identity: { type: "CAPABILITY", name: "Broken Manifest Cap" },
        properties: {},
        relationships: [],
        confidence: 0.8,
        validation: { status: "PASSED" },
        evidence: [
          {
            doc_id: "DOC_ORPHAN",
            location: "Orphan",
            context_quote: "Document exists but no manifest.",
            evidence_score: 0.8
          }
        ]
      }
    ],
    domains: [],
    organization_classes: [],
    organizations: [],
    roles: [],
    opportunities: [],
    strategies: [],
    search_queries: []
  };

  // Add the orphan doc just for CAP_004
  mockAnalysis.documents.push({
    entity_id: "DOC_ORPHAN",
    identity: { type: "DOCUMENT", name: "Orphan Doc" },
    properties: {},
    relationships: [],
    evidence: [],
    confidence: 1.0,
    validation: { status: "PASSED" }
  });

  it("A. single-source capability -> complete chain", () => {
    const chain = buildCapabilityProofChain("CAP_001", mockAnalysis, mockManifest);
    expect(chain.capability.entity_id).toBe("CAP_001");
    expect(chain.evidence).toHaveLength(1);
    expect(chain.evidence[0].doc_id).toBe("DOC_001");
    expect(chain.documents).toHaveLength(1);
    expect(chain.documents[0].entity_id).toBe("DOC_001");
    expect(chain.sources).toHaveLength(1);
    expect(chain.sources[0].sourceRef).toBe("file://resume.pdf");
  });

  it("B. multi-source capability -> all evidence/source branches preserved", () => {
    const chain = buildCapabilityProofChain("CAP_002", mockAnalysis, mockManifest);
    expect(chain.capability.entity_id).toBe("CAP_002");
    expect(chain.evidence).toHaveLength(2);
    expect(chain.documents).toHaveLength(2);
    expect(chain.sources).toHaveLength(2);

    const docIds = chain.documents.map(d => d.entity_id);
    expect(docIds).toContain("DOC_001");
    expect(docIds).toContain("DOC_GH_001");

    const sourceRefs = chain.sources.map(s => s.sourceRef);
    expect(sourceRefs).toContain("file://resume.pdf");
    expect(sourceRefs).toContain("https://github.com/test/repo");
  });

  it("C. unknown capability -> hard deterministic failure", () => {
    expect(() => {
      buildCapabilityProofChain("CAP_NOT_EXIST", mockAnalysis, mockManifest);
    }).toThrow("ERR_PROOF_CHAIN_BROKEN: Capability CAP_NOT_EXIST not found");
  });

  it("D. evidence references missing document -> hard failure", () => {
    expect(() => {
      buildCapabilityProofChain("CAP_003", mockAnalysis, mockManifest);
    }).toThrow("ERR_PROOF_CHAIN_BROKEN: Document DOC_UNKNOWN_999 referenced by evidence but not found");
  });

  it("E. document exists but source manifest entry missing -> hard failure", () => {
    expect(() => {
      buildCapabilityProofChain("CAP_004", mockAnalysis, mockManifest);
    }).toThrow("ERR_PROOF_CHAIN_BROKEN: Document DOC_ORPHAN exists but missing from origin source manifest");
  });

  it("F. context quote survives byte-for-byte/string-for-string", () => {
    const chain = buildCapabilityProofChain("CAP_002", mockAnalysis, mockManifest);
    expect(chain.evidence[0].context_quote).toBe("First part from PDF.");
    expect(chain.evidence[1].context_quote).toBe("Second part from GitHub.");
  });
});
