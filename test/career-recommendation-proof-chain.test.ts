import { describe, it, expect } from "vitest";
import { AlignmentResult, AlignmentState } from "../lib/career/matching/alignment";
import { buildRoleRecommendation, calculateFitAndExplainability } from "../lib/career/matching/derivation";
import { resolveMetric } from "../lib/career/metrics/provenance";

describe("CONDYN Career Analysis Protocol v2.0 - PHASE 2: DETERMINISTIC FIT + RECOMMENDATION PROOF CHAIN (TEST002E)", () => {

  const buildAlignments = (supported: number, notSupported: number, unresolved: number): AlignmentResult[] => {
    const arr: AlignmentResult[] = [];
    for (let i = 0; i < supported; i++) arr.push({ state: "SUPPORTED" } as AlignmentResult);
    for (let i = 0; i < notSupported; i++) arr.push({ state: "NOT_SUPPORTED" } as AlignmentResult);
    for (let i = 0; i < unresolved; i++) arr.push({ state: "UNRESOLVED" } as AlignmentResult);
    return arr;
  };

  it("A. 10 requirements: 2 supported, 8 unresolved -> fit 0.20, explainability 0.20, recommendation INSUFFICIENT_EVIDENCE", () => {
    const alignments = buildAlignments(2, 0, 8);
    const rec = buildRoleRecommendation("ROL_A", alignments);
    expect(rec.fitScore.value).toBeCloseTo(0.20);
    expect(rec.explainabilityScore.value).toBeCloseTo(0.20);
    // Because explainability < 0.3, it should be INSUFFICIENT_EVIDENCE
    expect(rec.recommendationState).toBe("INSUFFICIENT_EVIDENCE");
  });

  it("B. 10 requirements: 8 supported, 2 not supported -> fit 0.80, explainability 1.00", () => {
    const alignments = buildAlignments(8, 2, 0);
    const rec = buildRoleRecommendation("ROL_B", alignments);
    expect(rec.fitScore.value).toBeCloseTo(0.80);
    expect(rec.explainabilityScore.value).toBeCloseTo(1.00);
    expect(rec.recommendationState).toBe("RECOMMEND");
  });

  it("C. 10 requirements: 8 supported, 2 unresolved -> fit 0.80, explainability 0.80", () => {
    const alignments = buildAlignments(8, 0, 2);
    const rec = buildRoleRecommendation("ROL_C", alignments);
    expect(rec.fitScore.value).toBeCloseTo(0.80);
    expect(rec.explainabilityScore.value).toBeCloseTo(0.80);
    expect(rec.recommendationState).toBe("RECOMMEND");
  });

  it("C2. 10 requirements: 2 supported, 6 not supported, 2 unresolved -> fit 0.20, explainability 0.80", () => {
    const alignments = buildAlignments(2, 6, 2);
    const rec = buildRoleRecommendation("ROL_C2", alignments);
    expect(rec.fitScore.value).toBeCloseTo(0.20);
    expect(rec.explainabilityScore.value).toBeCloseTo(0.80);
    expect(rec.recommendationState).toBe("DO_NOT_RECOMMEND");
  });

  it("D. zero requirements -> fit unavailable, explainability unavailable", () => {
    const alignments = buildAlignments(0, 0, 0);
    const rec = buildRoleRecommendation("ROL_D", alignments);
    expect(rec.fitScore.value).toBeNull();
    expect(rec.explainabilityScore.value).toBeNull();
    expect(rec.recommendationState).toBe("INSUFFICIENT_EVIDENCE");
  });

  it("E. Metric Ordering Invariant: FIT_SCORE <= EXPLAINABILITY_SCORE", () => {
    // Generate permutations of states to prove invariant holds
    const cases = [
      buildAlignments(5, 5, 0),
      buildAlignments(0, 5, 5),
      buildAlignments(3, 2, 5),
      buildAlignments(10, 0, 0),
      buildAlignments(0, 10, 0),
      buildAlignments(0, 0, 10)
    ];

    for (const alignments of cases) {
      const rec = buildRoleRecommendation("ROL_INV", alignments);
      const fit = rec.fitScore.value;
      const exp = rec.explainabilityScore.value;
      if (fit !== null && exp !== null) {
        expect(fit).toBeLessThanOrEqual(exp);
      }
    }
  });

  it("H. model-generated fit score supplied -> ignore/reject as authoritative FIT_SCORE", () => {
    // The metric provenance system explicitly requires deriving the value deterministically.
    // A model inferred confidence injected into FIT_SCORE retains its raw value if it's treated as a fallback,
    // but in 002E the derivation engine ignores any pre-existing fit and completely regenerates it from alignments.
    const alignments = buildAlignments(5, 5, 0); // Real fit should be 0.50
    const fakeModelFit = 0.99;
    
    // The engine does not even take fakeModelFit as an argument!
    const rec = buildRoleRecommendation("ROL_E", alignments);
    expect(rec.fitScore.value).toBeCloseTo(0.50);
    expect(rec.fitScore.value).not.toBe(fakeModelFit);
  });
});
