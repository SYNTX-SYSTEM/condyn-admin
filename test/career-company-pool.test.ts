import { describe, it, expect } from "vitest";
import {
  CompanyPoolDataSchema,
  PoolCapabilityRequirementSchema
} from "../lib/career/matching/pool";
import { computeRoleResonanceScore } from "../lib/career/matching/scoring";
import { matchCareerAnalysisAgainstPool } from "../lib/career/matching/engine";
import { DEMO_COMPANY_POOL } from "../lib/career/matching/demo-pool";

describe("CONDYN Career Analysis Protocol v1.0 — Step 16: Company Pool & Matching Engine", () => {
  describe("1. Pool Schema Validation (pool.ts)", () => {
    it("should successfully validate the complete DEMO_COMPANY_POOL schema", () => {
      const parsed = CompanyPoolDataSchema.parse(DEMO_COMPANY_POOL);
      expect(parsed.pool.id).toBe("pool_demo_master_v1");
      expect(parsed.organizations).toHaveLength(3);
      expect(parsed.roles).toHaveLength(3);
    });

    it("should reject PoolCapabilityRequirement when weight > 1.0", () => {
      const invalidReq = {
        id: "req_invalid_weight",
        role_id: "role_siemens_arch",
        capability_name: "Distributed Systems",
        domain: "Systems",
        weight: 1.5, // invalid weight > 1.0
        required_level: "L5"
      };
      expect(() => PoolCapabilityRequirementSchema.parse(invalidReq)).toThrow();
    });
  });

  describe("2. Deterministic Resonance Scoring (scoring.ts)", () => {
    const sampleReqs = [
      {
        id: "req_1",
        role_id: "role_test",
        capability_name: "Distributed Systems",
        domain: "Systems",
        weight: 0.6,
        required_level: "L5"
      },
      {
        id: "req_2",
        role_id: "role_test",
        capability_name: "Edge Computing",
        domain: "Edge",
        weight: 0.4,
        required_level: "L4"
      }
    ];

    it("should match existing capabilities and report missing capabilities explicitly", () => {
      const extracted = [
        { name: "Distributed Systems", confidence: 1.0 }
      ];

      const res = computeRoleResonanceScore(extracted, sampleReqs);
      expect(res.matchedCapabilities).toHaveLength(1);
      expect(res.matchedCapabilities[0].capabilityName).toBe("Distributed Systems");

      expect(res.missingCapabilities).toHaveLength(1);
      expect(res.missingCapabilities[0].capabilityName).toBe("Edge Computing");

      // Score = (0.6 * 1.0) / (0.6 + 0.4) = 0.6
      expect(res.score).toBeCloseTo(0.6, 3);
    });

    it("should give higher weighted requirements stronger influence on resonance score", () => {
      // Matching only higher weighted requirement (weight 0.6)
      const resHigh = computeRoleResonanceScore(
        [{ name: "Distributed Systems", confidence: 1.0 }],
        sampleReqs
      );

      // Matching only lower weighted requirement (weight 0.4)
      const resLow = computeRoleResonanceScore(
        [{ name: "Edge Computing", confidence: 1.0 }],
        sampleReqs
      );

      expect(resHigh.score).toBeGreaterThan(resLow.score);
    });
  });

  describe("3. Matching Engine Core & Governance (engine.ts)", () => {
    const mockAnalysis: any = {
      structured_data: {
        analysis: {
          metadata: {
            analysis_id: "test_analysis_1"
          },
          capabilities: [
            { name: "Distributed Systems", confidence: 0.95 },
            { name: "Edge Computing Architecture", confidence: 0.90 },
            { name: "Industrial IoT Protocol Design", confidence: 0.85 }
          ]
        }
      }
    };

    it("should throw ERR_INACTIVE_COMPANY_POOL when matching against inactive pool status", () => {
      const inactivePool = JSON.parse(JSON.stringify(DEMO_COMPANY_POOL));
      inactivePool.pool.status = "DRAFT"; // inactive status

      expect(() => matchCareerAnalysisAgainstPool(mockAnalysis, inactivePool)).toThrow(
        /ERR_INACTIVE_COMPANY_POOL/
      );
    });

    it("should match against ACTIVE pool and sort roles descending by resonance score", () => {
      const matchResult = matchCareerAnalysisAgainstPool(mockAnalysis, DEMO_COMPANY_POOL);

      expect(matchResult.analysis_id).toBe("test_analysis_1");
      expect(matchResult.role_matches.length).toBeGreaterThan(0);

      // Ensure sorted descending
      for (let i = 0; i < matchResult.role_matches.length - 1; i++) {
        expect(matchResult.role_matches[i].resonanceScore).toBeGreaterThanOrEqual(
          matchResult.role_matches[i + 1].resonanceScore
        );
      }

      // Siemens role should be top match given the sample capabilities
      expect(matchResult.role_matches[0].roleId).toBe("role_siemens_arch");
      expect(matchResult.role_matches[0].resonanceScore).toBeGreaterThan(0.85);
    });

    it("should aggregate role scores into organizations sorted descending by score", () => {
      const matchResult = matchCareerAnalysisAgainstPool(mockAnalysis, DEMO_COMPANY_POOL);

      expect(matchResult.organization_matches).toHaveLength(3);
      expect(matchResult.organization_matches[0].organizationId).toBe("org_siemens");
      expect(matchResult.organization_matches[0].aggregateScore).toBeGreaterThan(0.85);
    });
  });
});
