import { describe, it, expect } from "vitest";
import { generateCareerRecommendations } from "../lib/career/recommendations/gaps";
import { CareerMatchResult } from "../lib/career/matching/engine";
import { VerifiedCareerAnalysis } from "../lib/career/types";

describe("CONDYN Career Analysis Protocol v1.0 — Step 20a: Recommendation Engine Core (`test/career-recommendation-engine.test.ts`)", () => {
  const mockAnalysis: any = {
    structured_data: {
      analysis: {
        metadata: {
          analysis_id: "ANL_20260708_REC001"
        },
        capabilities: [
          {
            entity_id: "CAP_DISTRIBUTED",
            name: "Distributed Systems",
            domain: "Architecture",
            confidence: 0.95
          },
          {
            entity_id: "CAP_RUST",
            name: "Rust Systems Programming",
            domain: "Engineering",
            confidence: 0.60 // < 0.70 -> triggers EvidenceEnhancement
          }
        ]
      }
    }
  };

  const mockMatchResult: CareerMatchResult = {
    analysis_id: "ANL_20260708_REC001",
    pool_id: "pool_test_v1",
    pool_version: 1,
    role_matches: [
      {
        roleId: "role_siemens_arch",
        title: "Principal Cloud Architect",
        seniority: "Principal",
        organizationId: "org_siemens",
        organizationName: "Siemens AG",
        resonanceScore: 0.75,
        matchedCapabilities: [
          {
            requirementId: "req_1",
            capabilityName: "Distributed Systems",
            domain: "Architecture",
            weight: 0.6,
            requiredLevel: "L5",
            extractedConfidence: 0.95
          }
        ],
        missingCapabilities: [
          {
            requirementId: "req_2",
            capabilityName: "Zero Trust Security Architecture",
            domain: "Security",
            weight: 0.85, // >= 0.8 -> HIGH severity
            requiredLevel: "L5"
          },
          {
            requirementId: "req_3",
            capabilityName: "Edge AI Deployment",
            domain: "AI",
            weight: 0.55, // >= 0.5 -> MEDIUM severity
            requiredLevel: "L4"
          },
          {
            requirementId: "req_4",
            capabilityName: "Internal Auditing",
            domain: "Compliance",
            weight: 0.30, // < 0.5 -> LOW severity
            requiredLevel: "L3"
          }
        ],
        scoreBreakdown: []
      }
    ],
    organization_matches: [],
    search_queries: []
  };

  it("should generate capabilityGaps from missing capabilities with correct severity classification", () => {
    const result = generateCareerRecommendations(mockAnalysis, mockMatchResult);

    expect(result.analysisId).toBe("ANL_20260708_REC001");
    expect(result.generatedAt).toBeDefined();
    expect(result.capabilityGaps).toHaveLength(3);

    const highGap = result.capabilityGaps.find((g) => g.capabilityName === "Zero Trust Security Architecture");
    expect(highGap).toBeDefined();
    expect(highGap?.severity).toBe("HIGH");
    expect(highGap?.requiredWeight).toBe(0.85);
    expect(highGap?.requiredByRoleId).toBe("role_siemens_arch");
    expect(highGap?.organizationName).toBe("Siemens AG");

    const mediumGap = result.capabilityGaps.find((g) => g.capabilityName === "Edge AI Deployment");
    expect(mediumGap?.severity).toBe("MEDIUM");

    const lowGap = result.capabilityGaps.find((g) => g.capabilityName === "Internal Auditing");
    expect(lowGap?.severity).toBe("LOW");
  });

  it("should sort capabilityGaps descending by severity (HIGH > MEDIUM > LOW) and weight", () => {
    const result = generateCareerRecommendations(mockAnalysis, mockMatchResult);

    expect(result.capabilityGaps[0].severity).toBe("HIGH");
    expect(result.capabilityGaps[1].severity).toBe("MEDIUM");
    expect(result.capabilityGaps[2].severity).toBe("LOW");
  });

  it("should generate evidenceEnhancements for capabilities with confidence < 0.70", () => {
    const result = generateCareerRecommendations(mockAnalysis, mockMatchResult);

    expect(result.evidenceEnhancements).toHaveLength(1);
    const enh = result.evidenceEnhancements[0];
    expect(enh.entityId).toBe("CAP_RUST");
    expect(enh.entityName).toBe("Rust Systems Programming");
    expect(enh.currentConfidence).toBe(0.60);
    expect(enh.targetConfidence).toBeGreaterThan(0.60);
    expect(enh.suggestedSourceTypes).toContain("GitHub Repository");
    expect(enh.suggestedSourceTypes).toContain("Architecture Document");
  });

  it("should generate deterministic nextActions from capability gaps and evidence enhancements", () => {
    const result = generateCareerRecommendations(mockAnalysis, mockMatchResult);

    expect(result.nextActions.length).toBeGreaterThan(0);
    const capAction = result.nextActions.find((a) => a.category === "CAPABILITY_ACQUISITION");
    expect(capAction).toBeDefined();
    expect(capAction?.targetCapabilityName).toBe("Zero Trust Security Architecture");

    const evAction = result.nextActions.find((a) => a.category === "EVIDENCE_ENHANCEMENT");
    expect(evAction).toBeDefined();
    expect(evAction?.targetCapabilityName).toBe("Rust Systems Programming");
  });

  it("should return empty recommendations when role_matches are empty or missing capabilities are empty", () => {
    const emptyMatch: CareerMatchResult = {
      ...mockMatchResult,
      role_matches: []
    };
    const result = generateCareerRecommendations(mockAnalysis, emptyMatch);

    expect(result.capabilityGaps).toHaveLength(0);
  });

  it("should never mutate the input VerifiedCareerAnalysis or CareerMatchResult objects", () => {
    const analysisClone = JSON.parse(JSON.stringify(mockAnalysis));
    const matchClone = JSON.parse(JSON.stringify(mockMatchResult));
    const frozenAnalysis = Object.freeze(analysisClone);
    const frozenMatch = Object.freeze(matchClone);

    expect(() => generateCareerRecommendations(frozenAnalysis, frozenMatch)).not.toThrow();
  });
});
