import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { CanonicalCareerAnalysisSchema } from "../lib/career/schema";
import { validateCareerAnalysis } from "../lib/career/validator";

describe("CONDYN Career Analysis Protocol v1.0 - TDD Conformance Suite", () => {
  const goldCasePath = path.join(__dirname, "gold/case_001_minimal_valid/expected/expected.json");
  const goldJsonRaw = fs.readFileSync(goldCasePath, "utf-8");
  const goldJsonObject = JSON.parse(goldJsonRaw);

  describe("Domain 1: Canonical Zod Schema Tests (`CanonicalCareerAnalysisSchema`)", () => {
    it("should pass validation for Gold Case 001 (`expected.json`)", () => {
      const result = CanonicalCareerAnalysisSchema.safeParse(goldJsonObject);
      expect(result.success).toBe(true);
    });

    it("should fail validation when integer percentage is used (`resonance_score: 94`)", () => {
      const invalidPayload = JSON.parse(goldJsonRaw);
      // Mutate resonance_score from 0.94 to illegal integer percentage 94
      invalidPayload.structured_data.analysis.organizations[0].properties.resonance_score = 94;
      
      const result = CanonicalCareerAnalysisSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
      if (!result.success) {
        const hasScoreError = result.error.issues.some(i => i.message.includes("<= 1.0"));
        expect(hasScoreError).toBe(true);
      }
    });

    it("should fail validation when cardinal field `validation` is missing from an entity", () => {
      const invalidPayload = JSON.parse(goldJsonRaw);
      // Remove mandatory validation object from organization entity
      delete invalidPayload.structured_data.analysis.organizations[0].validation;

      const result = CanonicalCareerAnalysisSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });

    it("should fail validation when root bifurcation structure is invalid or missing", () => {
      const invalidPayload = {
        invalid_root: true,
        report_markdown: "# Title only"
        // missing structured_data
      };

      const result = CanonicalCareerAnalysisSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });
  });

  describe("Domain 2: Runtime Integrity Validator Skeleton Tests (`validateCareerAnalysis`)", () => {
    it("should emit ERR_JSON_SYNTAX_INVALID when raw payload is malformed JSON string", () => {
      const malformedJsonString = "{ \"report_markdown\": \"# Broken JSON\", \"structured_data\": ";
      
      const result = validateCareerAnalysis(malformedJsonString);
      expect(result.success).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues[0].code).toBe("ERR_JSON_SYNTAX_INVALID");
    });

    describe("Phase 2.3: Referential Integrity Check & Orphan Edge Detection", () => {
      it("should emit ERR_DUPLICATE_ENTITY_ID when two entities share the exact same entity_id", () => {
        const invalidPayload = JSON.parse(goldJsonRaw);
        // Duplicate CAP_001 by pushing a second capability with the same ID
        const capClone = JSON.parse(JSON.stringify(invalidPayload.structured_data.analysis.capabilities[0]));
        invalidPayload.structured_data.analysis.capabilities.push(capClone);

        const result = validateCareerAnalysis(invalidPayload);
        expect(result.success).toBe(false);
        const hasDuplicateError = result.issues.some(i => i.code === "ERR_DUPLICATE_ENTITY_ID");
        expect(hasDuplicateError).toBe(true);
      });

      it("should emit ERR_ORPHAN_REFERENCE when a relationship points to a non-existent target_id (before repair phase)", () => {
        const invalidPayload = JSON.parse(goldJsonRaw);
        // Point an organization relationship to a non-existent capability ID
        invalidPayload.structured_data.analysis.organizations[0].relationships[1].target_id = "CAP_999_ORPHAN";

        const result = validateCareerAnalysis(invalidPayload);
        expect(result.success).toBe(false);
        const hasOrphanError = result.issues.some(i => i.code === "ERR_ORPHAN_REFERENCE");
        expect(hasOrphanError).toBe(true);
      });
    });

    describe("Phase 2.4: Semantic Rules (Role Hierarchy & Mandatory Evidence)", () => {
      it("should emit ERR_ROLE_HIERARCHY_DISCONNECTED when a role has no ROLE_IN_ORGANIZATION relationship", () => {
        const invalidPayload = JSON.parse(goldJsonRaw);
        // Clear relationships on the role entity so it is disconnected from any organization
        invalidPayload.structured_data.analysis.roles[0].relationships = [];

        const result = validateCareerAnalysis(invalidPayload);
        expect(result.success).toBe(false);
        const hasRoleError = result.issues.some(i => i.code === "ERR_ROLE_HIERARCHY_DISCONNECTED");
        expect(hasRoleError).toBe(true);
      });

      it("should emit ERR_EVIDENCE_MISSING when a domain entity (e.g. capability) has an empty evidence array", () => {
        const invalidPayload = JSON.parse(goldJsonRaw);
        // Clear evidence array on capability entity
        invalidPayload.structured_data.analysis.capabilities[0].evidence = [];

        const result = validateCareerAnalysis(invalidPayload);
        expect(result.success).toBe(false);
        const hasEvidenceError = result.issues.some(i => i.code === "ERR_EVIDENCE_MISSING");
        expect(hasEvidenceError).toBe(true);
      });
    });
  });
});
