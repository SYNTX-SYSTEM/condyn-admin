import { describe, it, expect } from "vitest";
import { assembleCanonicalCareerAnalysis, PipelineOrchestrationContext } from "../lib/career/adapter";

describe("BUG010K: Canonical Partitioning & Relation Integrity", () => {
  const mockContext: PipelineOrchestrationContext = {
    analysis_id: "TEST_ID",
    pipeline_steps: []
  };

  it("A. should correctly partition entities into canonical arrays based on entity_kind and construct identity", () => {
    const rawPayload = {
      report_markdown: "# Title",
      consistency: { overall_cohesion_score: 1.0 },
      entities: [
        {
          entity_kind: "ROLE",
          entity_id: "R1",
          name: "Software Engineer",
          properties: { seniority: "Senior" },
          relationships: [{ target_id: "O1", relation_type: "ROLE_IN_ORGANIZATION", weight: 1.0 }],
          evidence: [],
          confidence: 0.9
        },
        {
          entity_kind: "ORGANIZATION",
          entity_id: "O1",
          name: "Acme Corp",
          properties: { country_iso: "US" },
          relationships: [],
          evidence: [],
          confidence: 0.95
        },
        {
          entity_kind: "DOCUMENT",
          entity_id: "D1",
          name: "Resume.pdf",
          properties: {},
          relationships: [],
          evidence: [],
          confidence: 1.0
        }
      ]
    };

    const assembled = assembleCanonicalCareerAnalysis(rawPayload, mockContext);
    
    // Assert array partitioning
    expect(assembled.entities).toBeUndefined(); // Should be partitioned away
    expect(assembled.structured_data).toBeDefined();
    expect(assembled.structured_data.analysis.roles).toBeDefined();
    expect(assembled.structured_data.analysis.organizations).toBeDefined();
    expect(assembled.structured_data.analysis.documents).toBeDefined();

    expect(assembled.structured_data.analysis.roles.length).toBe(1);
    expect(assembled.structured_data.analysis.organizations.length).toBe(1);
    expect(assembled.structured_data.analysis.documents.length).toBe(1);

    // Assert identity construction
    const role = assembled.structured_data.analysis.roles[0];
    expect(role.entity_id).toBe("ROL_001");
    expect(role.identity).toEqual({
      type: "ROLE",
      name: "Software Engineer",
      canonical_type: "ROLE"
    });
    expect(role.properties.seniority).toBe("Senior");
    expect(role.validation.status).toBe("UNVERIFIED");
  });

  it("C. should fail deterministic assembly on duplicate entity IDs", () => {
    const rawPayload = {
      report_markdown: "",
      consistency: { overall_cohesion_score: 1.0 },
      entities: [
        { entity_kind: "ORGANIZATION", entity_id: "O1", name: "Org 1", properties: {}, relationships: [], evidence: [], confidence: 1.0 },
        { entity_kind: "ROLE", entity_id: "O1", name: "Role 1", properties: {}, relationships: [], evidence: [], confidence: 1.0 }
      ]
    };

    expect(() => assembleCanonicalCareerAnalysis(rawPayload, mockContext))
      .toThrow("ERR_CANONICAL_ASSEMBLY_DUPLICATE_ENTITY_ID");
  });

  it("D. should fail deterministic assembly when relationship target_id is missing", () => {
    const rawPayload = {
      report_markdown: "",
      consistency: { overall_cohesion_score: 1.0 },
      entities: [
        {
          entity_kind: "ROLE",
          entity_id: "R1",
          name: "Software Engineer",
          properties: {},
          relationships: [{ target_id: "MISSING_ORG", relation_type: "ROLE_IN_ORGANIZATION", weight: 1.0 }],
          evidence: [],
          confidence: 0.9
        }
      ]
    };

    expect(() => assembleCanonicalCareerAnalysis(rawPayload, mockContext))
      .toThrow("ERR_CANONICAL_ASSEMBLY_RELATION_TARGET_MISSING");
  });

  it("E. should fail deterministic assembly on ROLE_IN_ORGANIZATION kind mismatch", () => {
    const rawPayload = {
      report_markdown: "",
      consistency: { overall_cohesion_score: 1.0 },
      entities: [
        {
          entity_kind: "ROLE",
          entity_id: "R1",
          name: "Software Engineer",
          properties: {},
          relationships: [{ target_id: "CAP1", relation_type: "ROLE_IN_ORGANIZATION", weight: 1.0 }],
          evidence: [],
          confidence: 0.9
        },
        {
          entity_kind: "CAPABILITY", // Target exists, but is NOT an ORGANIZATION
          entity_id: "CAP1",
          name: "Coding",
          properties: {},
          relationships: [],
          evidence: [],
          confidence: 0.9
        }
      ]
    };

    expect(() => assembleCanonicalCareerAnalysis(rawPayload, mockContext))
      .toThrow("ERR_CANONICAL_ASSEMBLY_RELATION_KIND_MISMATCH");
  });
});
