/**
 * CONDYN CAREER ANALYSIS PROTOCOL v1.0
 * TDD STEP 13: GRAPH DIFF & EVOLUTION ENGINE (`test/career-graph-diff.test.ts`)
 * 
 * Status: Phase 13 TDD Red-Green Suite
 * Scope: Verifies structural and temporal comparison of two VerifiedCareerAnalysis records across all 9 domain arrays,
 * enforcing unverified rejection, deep immutability, and orthogonal delta categorization.
 */

import fs from "fs";
import path from "path";
import { describe, it, expect } from "vitest";
import { computeGraphDiff, GraphDiffResult } from "../lib/career/diff";
import { VerifiedCareerAnalysis } from "../lib/career/types";
import { validateCareerAnalysis } from "../lib/career/validator";

describe("CONDYN Career Analysis Protocol v1.0 - Step 13: Graph Diff & Evolution Engine", () => {
  const goldJsonPath = path.join(__dirname, "gold/case_001_minimal_valid/expected/canonical-expected.json");
  const goldJsonRaw = fs.readFileSync(goldJsonPath, "utf-8");
  const unverifiedPayload = JSON.parse(goldJsonRaw);

  function getBaseVerified(): VerifiedCareerAnalysis {
    const res = validateCareerAnalysis(unverifiedPayload);
    if (!res.success || !res.data) {
      throw new Error("Failed to validate baseline analysis for diff test");
    }
    return res.data as VerifiedCareerAnalysis;
  }

  function cloneVerified(val: VerifiedCareerAnalysis): VerifiedCareerAnalysis {
    return JSON.parse(JSON.stringify(val));
  }

  it("should return empty deltas when comparing identical analyses", () => {
    const base = getBaseVerified();
    const target = cloneVerified(base);

    const diff = computeGraphDiff(base, target);
    expect(diff.baseAnalysisId).toBe(base.structured_data.analysis.metadata.analysis_id);
    expect(diff.targetAnalysisId).toBe(target.structured_data.analysis.metadata.analysis_id);
    expect(diff.entityDeltas).toHaveLength(0);
    expect(diff.relationshipDeltas).toHaveLength(0);
    expect(diff.scoreDeltas).toHaveLength(0);
    expect(diff.evidenceDeltas).toHaveLength(0);
    expect(diff.summary).toContain("No structural or scoring differences");
  });

  it("should detect ADDED_ENTITY when a capability is added in target", () => {
    const base = getBaseVerified();
    const target = cloneVerified(base);

    // Add new capability to target
    const newCap = {
      entity_id: "CAP_999",
      identity: { type: "CAPABILITY", name: "Rust Programming" },
      properties: { proficiency: "expert" },
      relationships: [],
      evidence: [
        {
          doc_id: "DOC_001",
          location: "Section 3",
          context_quote: "Extensive experience programming high-performance Rust services.",
          evidence_score: 0.95
        }
      ],
      confidence: 0.95,
      validation: { status: "UNVERIFIED" as const }
    };
    target.structured_data.analysis.capabilities.push(newCap);

    const diff = computeGraphDiff(base, target);
    expect(diff.entityDeltas).toHaveLength(1);
    expect(diff.entityDeltas[0]).toEqual({
      type: "ADDED_ENTITY",
      entityId: "CAP_999",
      entityType: "CAPABILITY",
      name: "Rust Programming",
      domainArray: "capabilities",
      targetValue: newCap
    });
  });

  it("should detect REMOVED_ENTITY when a role is removed in target", () => {
    const base = getBaseVerified();
    const target = cloneVerified(base);

    // Remove first role if exists, or add to base first
    if (base.structured_data.analysis.roles.length === 0) {
      const mockRole = {
        entity_id: "ROL_888",
        identity: { type: "ROLE", name: "Senior Architect" },
        properties: { seniority: "senior", domain_focus: "cloud" },
        relationships: [],
        evidence: [
          {
            doc_id: "DOC_001",
            location: "Header",
            context_quote: "Served as Senior Architect leading cloud migration initiatives.",
            evidence_score: 0.9
          }
        ],
        confidence: 0.9,
        validation: { status: "UNVERIFIED" as const }
      };
      base.structured_data.analysis.roles.push(mockRole);
    } else {
      target.structured_data.analysis.roles.pop();
    }

    const diff = computeGraphDiff(base, target);
    const removed = diff.entityDeltas.find(d => d.type === "REMOVED_ENTITY");
    expect(removed).toBeDefined();
    expect(removed!.domainArray).toBe("roles");
  });

  it("should detect MODIFIED_ENTITY only when identity or properties change (not on pure confidence/relationship/evidence changes)", () => {
    const base = getBaseVerified();
    const target = cloneVerified(base);

    const doc = target.structured_data.analysis.documents[0];
    expect(doc).toBeDefined();

    // 1. Pure confidence change should NOT trigger MODIFIED_ENTITY
    doc.confidence = 0.5;
    let diff = computeGraphDiff(base, target);
    expect(diff.entityDeltas.filter(d => d.type === "MODIFIED_ENTITY")).toHaveLength(0);
    expect(diff.scoreDeltas).toHaveLength(1);

    // 2. Pure relationship change should NOT trigger MODIFIED_ENTITY
    doc.confidence = base.structured_data.analysis.documents[0].confidence;
    doc.relationships.push({
      target_id: "CAP_001",
      relation_type: "SUPPORTS",
      weight: 0.8
    });
    diff = computeGraphDiff(base, target);
    expect(diff.entityDeltas.filter(d => d.type === "MODIFIED_ENTITY")).toHaveLength(0);
    expect(diff.relationshipDeltas).toHaveLength(1);

    // 3. Modifying properties SHOULD trigger MODIFIED_ENTITY
    doc.relationships = cloneVerified(base).structured_data.analysis.documents[0].relationships;
    doc.properties["new_prop"] = "changed_value";
    diff = computeGraphDiff(base, target);
    const modified = diff.entityDeltas.find(d => d.type === "MODIFIED_ENTITY");
    expect(modified).toBeDefined();
    expect(modified!.entityId).toBe(doc.entity_id);
  });

  it("should detect CONFIDENCE_DELTA when overall_confidence or entity confidence changes", () => {
    const base = getBaseVerified();
    const target = cloneVerified(base);

    // Modify overall confidence
    target.structured_data.analysis.metadata.overall_confidence = 0.88;
    // Modify entity confidence
    target.structured_data.analysis.documents[0].confidence = 0.75;

    const diff = computeGraphDiff(base, target);
    expect(diff.scoreDeltas.length).toBeGreaterThanOrEqual(2);
    
    const overallDelta = diff.scoreDeltas.find(d => !d.entityId);
    expect(overallDelta).toBeDefined();
    expect(overallDelta!.targetConfidence).toBe(0.88);

    const entityDelta = diff.scoreDeltas.find(d => d.entityId === target.structured_data.analysis.documents[0].entity_id);
    expect(entityDelta).toBeDefined();
    expect(entityDelta!.targetConfidence).toBe(0.75);
  });

  it("should detect ADDED_RELATIONSHIP, REMOVED_RELATIONSHIP, and MODIFIED_RELATIONSHIP when relationships change", () => {
    const base = getBaseVerified();
    const target = cloneVerified(base);

    const baseDoc = base.structured_data.analysis.documents[0];
    const targetDoc = target.structured_data.analysis.documents[0];

    // Ensure base has at least one relationship
    baseDoc.relationships = [
      { target_id: "CAP_001", relation_type: "SUPPORTS", weight: 0.8 },
      { target_id: "DOM_001", relation_type: "REQUIRES", weight: 0.9 }
    ];
    targetDoc.relationships = [
      // Modified weight on CAP_001
      { target_id: "CAP_001", relation_type: "SUPPORTS", weight: 0.95 },
      // Removed DOM_001
      // Added ORG_001
      { target_id: "ORG_001", relation_type: "BELONGS_TO_CLASS", weight: 0.7 }
    ];

    const diff = computeGraphDiff(base, target);
    expect(diff.relationshipDeltas.find(d => d.type === "MODIFIED_RELATIONSHIP" && d.targetId === "CAP_001")).toBeDefined();
    expect(diff.relationshipDeltas.find(d => d.type === "REMOVED_RELATIONSHIP" && d.targetId === "DOM_001")).toBeDefined();
    expect(diff.relationshipDeltas.find(d => d.type === "ADDED_RELATIONSHIP" && d.targetId === "ORG_001")).toBeDefined();
  });

  it("should detect EVIDENCE_DELTA when evidence items are added or modified", () => {
    const base = getBaseVerified();
    const target = cloneVerified(base);

    const targetDoc = target.structured_data.analysis.documents[0];
    targetDoc.evidence.push({
      doc_id: "DOC_002",
      location: "Appendix A",
      context_quote: "Newly discovered verbatim evidence quote from appendix exceeding ten characters.",
      evidence_score: 0.99
    });

    const diff = computeGraphDiff(base, target);
    expect(diff.evidenceDeltas).toHaveLength(1);
    expect(diff.evidenceDeltas[0].type).toBe("EVIDENCE_DELTA");
    expect(diff.evidenceDeltas[0].docId).toBe("DOC_002");
  });

  it("should preserve deep immutability of base and target analyses", () => {
    const base = getBaseVerified();
    const target = cloneVerified(base);
    target.structured_data.analysis.metadata.overall_confidence = 0.123;

    const baseSnapshot = JSON.stringify(base);
    const targetSnapshot = JSON.stringify(target);

    computeGraphDiff(base, target);

    expect(JSON.stringify(base)).toBe(baseSnapshot);
    expect(JSON.stringify(target)).toBe(targetSnapshot);
  });

  it("should throw ERR_UNVERIFIED_ANALYSIS_DIFF when either base or target is not VERIFIED", () => {
    const base = getBaseVerified();
    const unverified = cloneVerified(base) as any;
    unverified.structured_data.analysis.metadata.validation_state = "UNVERIFIED";

    expect(() => computeGraphDiff(unverified, base)).toThrow(/ERR_UNVERIFIED_ANALYSIS_DIFF/);
    expect(() => computeGraphDiff(base, unverified)).toThrow(/ERR_UNVERIFIED_ANALYSIS_DIFF/);
  });
});
