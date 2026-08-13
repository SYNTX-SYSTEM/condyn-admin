import { describe, it, expect } from "vitest";
import { assembleCanonicalCareerAnalysis, PipelineOrchestrationContext } from "../lib/career/adapter";
import { CanonicalCareerAnalysisSchema } from "../lib/career/schema";
import { z } from "zod";

describe("BUG010N: Canonical ID Ownership", () => {
  
  const mockContext: PipelineOrchestrationContext = {
    analysis_id: "ANL_001",
    document_count: 1,
    pipeline_steps: [],
    documents: [
      { docId: "DOC_001", content: "context" } // Context-owned preserved document
    ]
  };

  it("A, B, C, D, E, K: Deterministically maps local IDs and preserves context IDs", () => {
    const localInferencePayload = {
      report_markdown: "test",
      consistency: {
        overall_cohesion_score: 0.9,
        clusters: [
          {
            cluster_id: "semantic-cluster-a",
            name: "Test",
            description: "Desc",
            doc_ids: ["DOC_001", "local-doc-2"], // one canonical preserved, one local
            cohesion_score: 0.9,
            dominant_concept: "Concept"
          }
        ],
        outlier_doc_ids: ["local-doc-2"],
        contradictions: []
      },
      entities: [
        {
          entity_kind: "DOCUMENT",
          entity_id: "DOC_001", // Should be preserved (context owned)
          name: "Doc 1",
          properties: {}, relationships: [],
          evidence: [{ doc_id: "DOC_001", location: "loc", context_quote: "hello world!", evidence_score: 0.9 }],
          confidence: 0.9
        },
        {
          entity_kind: "DOCUMENT",
          entity_id: "DOC_999", // Canonical shape, but NOT context owned -> remapped
          name: "Doc 2",
          properties: {}, relationships: [],
          evidence: [{ doc_id: "DOC_001", location: "loc", context_quote: "hello world!", evidence_score: 0.9 }],
          confidence: 0.9
        },
        {
          entity_kind: "DOCUMENT",
          entity_id: "local-doc-2", // Local string -> remapped
          name: "Doc 3",
          properties: {}, relationships: [],
          evidence: [{ doc_id: "DOC_999", location: "loc", context_quote: "hello world!", evidence_score: 0.9 }],
          confidence: 0.9
        },
        {
          entity_kind: "ORGANIZATION",
          entity_id: "org-alpha", // Local -> ORG_001
          name: "Org Alpha",
          properties: { country_iso: "US", industry_enum: "TECH", resonance_score: 0.8 },
          relationships: [],
          evidence: [{ doc_id: "DOC_001", location: "loc", context_quote: "hello world!", evidence_score: 0.9 }],
          confidence: 0.9
        },
        {
          entity_kind: "ROLE",
          entity_id: "role-alpha", // Local -> ROL_001
          name: "Role Alpha",
          properties: { seniority: "SENIOR", domain_focus: "ENGINEERING" },
          relationships: [
            { target_id: "org-alpha", relation_type: "ROLE_IN_ORGANIZATION", weight: 1.0 }
          ],
          evidence: [{ doc_id: "local-doc-2", location: "loc", context_quote: "hello world!", evidence_score: 0.9 }],
          confidence: 0.9
        },
        {
          entity_kind: "STRATEGY",
          entity_id: "strategy-x", // Local -> STR_001
          name: "Strategy X",
          properties: {}, relationships: [],
          evidence: [{ doc_id: "DOC_999", location: "loc", context_quote: "hello world!", evidence_score: 0.9 }],
          confidence: 0.9
        },
        {
          entity_kind: "SEARCH_QUERY",
          entity_id: "query-x", // Local -> QRY_001
          name: "Query X",
          properties: { title: "T", query: "Q", purpose: "P", target: "T", priority: "HIGH" },
          relationships: [],
          evidence: [{ doc_id: "DOC_001", location: "loc", context_quote: "hello world!", evidence_score: 0.9 }],
          confidence: 0.9
        }
      ]
    };

    const assembled = assembleCanonicalCareerAnalysis(localInferencePayload, mockContext);
    const parsed = CanonicalCareerAnalysisSchema.parse(assembled); // Should pass validation

    // D & E: Check Document remapping (DOC_001 preserved, DOC_999 -> DOC_002, local-doc-2 -> DOC_003)
    const docs = parsed.structured_data.analysis.documents;
    expect(docs[0].entity_id).toBe("DOC_001");
    expect(docs[1].entity_id).toBe("DOC_002"); // DOC_999 remapped
    expect(docs[2].entity_id).toBe("DOC_003"); // local-doc-2 remapped

    // A: Check other entities remapping
    const orgs = parsed.structured_data.analysis.organizations;
    expect(orgs[0].entity_id).toBe("ORG_001");

    const roles = parsed.structured_data.analysis.roles;
    expect(roles[0].entity_id).toBe("ROL_001");
    
    // B: Relationship target rewritten correctly
    expect(roles[0].relationships[0].target_id).toBe("ORG_001");

    const strategies = parsed.structured_data.analysis.strategies;
    expect(strategies[0].entity_id).toBe("STR_001");

    const queries = parsed.structured_data.analysis.search_queries;
    expect(queries[0].entity_id).toBe("QRY_001");

    // Clusters and Outliers rewritten correctly
    const consistency = parsed.structured_data.analysis.consistency;
    expect(consistency.clusters[0].cluster_id).toBe("CLU_001");
    expect(consistency.clusters[0].doc_ids).toEqual(["DOC_001", "DOC_003"]); // local-doc-2 -> DOC_003
    expect(consistency.outlier_doc_ids).toEqual(["DOC_003"]);
    
    // Evidence rewritten correctly
    expect(docs[2].evidence[0].doc_id).toBe("DOC_002"); // referenced DOC_999 -> DOC_002
    expect(roles[0].evidence[0].doc_id).toBe("DOC_003"); // referenced local-doc-2 -> DOC_003

    // K: Semantic fields unchanged
    expect(docs[0].identity.name).toBe("Doc 1");
    expect(roles[0].evidence[0].context_quote).toBe("hello world!");
  });

  it("F: Duplicate raw local entity ID -> hard fail", () => {
    const payload = {
      report_markdown: "test",
      consistency: { overall_cohesion_score: 0.9, clusters: [], outlier_doc_ids: [], contradictions: [] },
      entities: [
        { entity_kind: "ROLE", entity_id: "dup-id", name: "R1", properties: {}, relationships: [], evidence: [], confidence: 0.9 },
        { entity_kind: "ROLE", entity_id: "dup-id", name: "R2", properties: {}, relationships: [], evidence: [], confidence: 0.9 }
      ]
    };
    expect(() => assembleCanonicalCareerAnalysis(payload, mockContext)).toThrowError(/ERR_CANONICAL_ASSEMBLY_DUPLICATE_ENTITY_ID/);
  });

  it("G: Missing relationship target -> hard fail", () => {
    const payload = {
      report_markdown: "test",
      consistency: { overall_cohesion_score: 0.9, clusters: [], outlier_doc_ids: [], contradictions: [] },
      entities: [
        {
          entity_kind: "ROLE",
          entity_id: "role-1",
          name: "R1",
          properties: {},
          relationships: [{ target_id: "missing-target", relation_type: "REQUIRES", weight: 1.0 }],
          evidence: [],
          confidence: 0.9
        }
      ]
    };
    expect(() => assembleCanonicalCareerAnalysis(payload, mockContext)).toThrowError(/ERR_CANONICAL_ASSEMBLY_RELATION_TARGET_MISSING/);
  });

  it("H: ROLE_IN_ORGANIZATION -> non-ORGANIZATION -> hard fail", () => {
    const payload = {
      report_markdown: "test",
      consistency: { overall_cohesion_score: 0.9, clusters: [], outlier_doc_ids: [], contradictions: [] },
      entities: [
        { entity_kind: "CAPABILITY", entity_id: "cap-1", name: "C1", properties: {}, relationships: [], evidence: [], confidence: 0.9 },
        {
          entity_kind: "ROLE",
          entity_id: "role-1",
          name: "R1",
          properties: {},
          relationships: [{ target_id: "cap-1", relation_type: "ROLE_IN_ORGANIZATION", weight: 1.0 }],
          evidence: [],
          confidence: 0.9
        }
      ]
    };
    expect(() => assembleCanonicalCareerAnalysis(payload, mockContext)).toThrowError(/ERR_CANONICAL_ASSEMBLY_RELATION_KIND_MISMATCH/);
  });

  it("I: Evidence doc_id references nonexistent document -> hard fail", () => {
    const payload = {
      report_markdown: "test",
      consistency: { overall_cohesion_score: 0.9, clusters: [], outlier_doc_ids: [], contradictions: [] },
      entities: [
        {
          entity_kind: "DOCUMENT",
          entity_id: "doc-1",
          name: "D1",
          properties: {},
          relationships: [],
          evidence: [{ doc_id: "doc-missing", context_quote: "quote", evidence_score: 0.9 }],
          confidence: 0.9
        }
      ]
    };
    expect(() => assembleCanonicalCareerAnalysis(payload, mockContext)).toThrowError(/ERR_CANONICAL_ASSEMBLY_DOCUMENT_REFERENCE_MISSING/);
  });

  it("J: Cluster doc_id references non-document entity -> hard fail", () => {
    const payload = {
      report_markdown: "test",
      consistency: {
        overall_cohesion_score: 0.9,
        clusters: [
          { cluster_id: "c-1", name: "C", description: "D", doc_ids: ["org-1"], cohesion_score: 0.9, dominant_concept: "C" }
        ],
        outlier_doc_ids: [],
        contradictions: []
      },
      entities: [
        { entity_kind: "ORGANIZATION", entity_id: "org-1", name: "O1", properties: {}, relationships: [], evidence: [], confidence: 0.9 }
      ]
    };
    expect(() => assembleCanonicalCareerAnalysis(payload, mockContext)).toThrowError(/ERR_CANONICAL_ASSEMBLY_DOCUMENT_REFERENCE_MISSING/);
  });

  it("J: Outlier doc_id references non-document entity -> hard fail", () => {
    const payload = {
      report_markdown: "test",
      consistency: {
        overall_cohesion_score: 0.9,
        clusters: [],
        outlier_doc_ids: ["org-1"],
        contradictions: []
      },
      entities: [
        { entity_kind: "ORGANIZATION", entity_id: "org-1", name: "O1", properties: {}, relationships: [], evidence: [], confidence: 0.9 }
      ]
    };
    expect(() => assembleCanonicalCareerAnalysis(payload, mockContext)).toThrowError(/ERR_CANONICAL_ASSEMBLY_DOCUMENT_REFERENCE_MISSING/);
  });

  it("I: Evidence doc_id references non-document entity -> hard fail", () => {
    const payload = {
      report_markdown: "test",
      consistency: { overall_cohesion_score: 0.9, clusters: [], outlier_doc_ids: [], contradictions: [] },
      entities: [
        { entity_kind: "ORGANIZATION", entity_id: "org-1", name: "O1", properties: {}, relationships: [], evidence: [], confidence: 0.9 },
        {
          entity_kind: "ROLE",
          entity_id: "role-1",
          name: "R1",
          properties: {},
          relationships: [],
          evidence: [{ doc_id: "org-1", context_quote: "quote", evidence_score: 0.9 }],
          confidence: 0.9
        }
      ]
    };
    expect(() => assembleCanonicalCareerAnalysis(payload, mockContext)).toThrowError(/ERR_CANONICAL_ASSEMBLY_DOCUMENT_REFERENCE_MISSING/);
  });

});
