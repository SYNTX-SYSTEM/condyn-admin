import { describe, it, expect } from "vitest";
import { evaluateAlignment } from "../lib/career/matching/alignment";
import { Analysis, UniversalEntity } from "../lib/career/schema";
import { ProofChainSourceManifestEntry } from "../lib/career/evidence/proof-chain";

describe("CONDYN Career Analysis Protocol v2.0 - PHASE 2: CAPABILITY → REQUIREMENT → ROLE (TEST002C)", () => {

  const buildDoc = (id: string, type: string = "DOCUMENT"): UniversalEntity => ({
    entity_id: id,
    identity: { type, name: "Source Doc" },
    properties: {},
    relationships: [],
    confidence: 1.0,
    validation: { status: "PASSED" },
    evidence: []
  });

  const buildBaseAnalysis = (): Analysis => ({
    metadata: { analysis_id: "ANL_001", protocol_version: "1.0", schema_version: "1.0", prompt_contract_version: "1.0" },
    pipeline: { steps: [] },
    consistency: { overall_cohesion_score: 0.9, clusters: [], outlier_doc_ids: [], contradictions: [] },
    documents: [],
    capabilities: [],
    requirements: [],
    domains: [],
    organization_classes: [],
    organizations: [
      {
        entity_id: "ORG_001",
        identity: { type: "ORGANIZATION", name: "Vercel" },
        properties: { country_iso: "US", industry_enum: "TECH", resonance_score: 0.9 },
        relationships: [],
        confidence: 0.9,
        validation: { status: "PASSED" },
        evidence: []
      }
    ],
    roles: [
      {
        entity_id: "ROL_001",
        identity: { type: "ROLE", name: "Senior Engineer" },
        properties: { seniority: "Senior", domain_focus: "Engineering" },
        relationships: [
          { target_id: "ORG_001", relation_type: "ROLE_IN_ORGANIZATION", weight: 1.0 },
          { target_id: "REQ_KUBERNETES", relation_type: "REQUIRES", weight: 1.0 }
        ],
        confidence: 0.9,
        validation: { status: "PASSED" },
        evidence: []
      }
    ],
    opportunities: [],
    strategies: [],
    search_queries: []
  });

  const manifest: ProofChainSourceManifestEntry[] = [
    { canonicalDocumentId: "DOC_JOB_001", sourceRef: "https://jobs.vercel.com/se" },
    { canonicalDocumentId: "DOC_RESUME_001", sourceRef: "file://resume.pdf" }
  ];

  it("C.1 + C.3 REQUIREMENT CONTRACT & ROLE OWNERSHIP: Requirement must belong to Role and Org", () => {
    const analysis = buildBaseAnalysis();
    analysis.documents.push(buildDoc("DOC_JOB_001"));
    
    const requirement: UniversalEntity = {
      entity_id: "REQ_KUBERNETES",
      identity: { type: "REQUIREMENT", name: "Kubernetes" },
      properties: {},
      relationships: [],
      confidence: 0.9,
      validation: { status: "PASSED" },
      evidence: [{ doc_id: "DOC_JOB_001", location: "Requirements", context_quote: "Must know Kubernetes", evidence_score: 0.9 }]
    };

    const result = evaluateAlignment(null, requirement, analysis, manifest);
    expect(result.requirementProof.requirement.entity_id).toBe("REQ_KUBERNETES");
    expect(result.requirementProof.role.entity_id).toBe("ROL_001");
    expect(result.requirementProof.organization?.entity_id).toBe("ORG_001");
    expect(result.state).toBe("NOT_SUPPORTED");
  });

  it("C.2 ALIGNMENT CONTRACT: Unresolved when strings don't exactly match without LLM authority", () => {
    const analysis = buildBaseAnalysis();
    analysis.documents.push(buildDoc("DOC_JOB_001"), buildDoc("DOC_RESUME_001"));

    const requirement: UniversalEntity = {
      entity_id: "REQ_KUBERNETES",
      identity: { type: "REQUIREMENT", name: "Kubernetes" },
      properties: {},
      relationships: [],
      confidence: 0.9,
      validation: { status: "PASSED" },
      evidence: [{ doc_id: "DOC_JOB_001", location: "JD", context_quote: "Requires Kubernetes", evidence_score: 0.9 }]
    };

    const capability: UniversalEntity = {
      entity_id: "CAP_K8S",
      identity: { type: "CAPABILITY", name: "K8s Administration" },
      properties: {},
      relationships: [],
      confidence: 0.9,
      validation: { status: "PASSED" },
      evidence: [{ doc_id: "DOC_RESUME_001", location: "CV", context_quote: "Managed K8s clusters", evidence_score: 0.9 }]
    };

    analysis.capabilities.push(capability);

    const result = evaluateAlignment(capability, requirement, analysis, manifest);
    expect(result.state).toBe("UNRESOLVED");
    expect(result.capabilityProof?.documents[0].entity_id).toBe("DOC_RESUME_001");
    expect(result.requirementProof.documents[0].entity_id).toBe("DOC_JOB_001");
  });

  it("CRITICAL NEGATIVE TEST: Epistemic Violation - Target corpus cannot prove candidate capability", () => {
    const analysis = buildBaseAnalysis();
    analysis.documents.push(buildDoc("DOC_JOB_001")); // Only Target Document exists

    const requirement: UniversalEntity = {
      entity_id: "REQ_KUBERNETES",
      identity: { type: "REQUIREMENT", name: "Kubernetes" },
      properties: {},
      relationships: [],
      confidence: 0.9,
      validation: { status: "PASSED" },
      evidence: [{ doc_id: "DOC_JOB_001", location: "JD", context_quote: "Requires Kubernetes", evidence_score: 0.9 }]
    };

    // An evil capability hallucinated from the Target JD
    const hallucinatedCap: UniversalEntity = {
      entity_id: "CAP_KUBERNETES",
      identity: { type: "CAPABILITY", name: "Kubernetes" },
      properties: {},
      relationships: [],
      confidence: 0.9,
      validation: { status: "PASSED" },
      evidence: [{ doc_id: "DOC_JOB_001", location: "JD", context_quote: "Requires Kubernetes", evidence_score: 0.9 }]
    };

    analysis.capabilities.push(hallucinatedCap);

    expect(() => {
      evaluateAlignment(hallucinatedCap, requirement, analysis, manifest);
    }).toThrow("ERR_EPISTEMIC_VIOLATION: Document DOC_JOB_001 cannot be used to prove both Candidate Capability and Target Requirement.");
  });

  it("REQUIREMENT ORPHAN TEST: Fails if requirement does not belong to a role", () => {
    const analysis = buildBaseAnalysis();
    // Clear the ROL_001 relationships so it no longer REQUIRES REQ_KUBERNETES
    analysis.roles[0].relationships = []; 
    analysis.documents.push(buildDoc("DOC_JOB_001"));

    const requirement: UniversalEntity = {
      entity_id: "REQ_KUBERNETES",
      identity: { type: "REQUIREMENT", name: "Kubernetes" },
      properties: {},
      relationships: [],
      confidence: 0.9,
      validation: { status: "PASSED" },
      evidence: [{ doc_id: "DOC_JOB_001", location: "JD", context_quote: "Requires Kubernetes", evidence_score: 0.9 }]
    };

    expect(() => {
      evaluateAlignment(null, requirement, analysis, manifest);
    }).toThrow("ERR_ORPHAN_REQUIREMENT: Requirement REQ_KUBERNETES does not belong to any ROLE.");
  });

});
