import { describe, it, expect } from "vitest";
import { createDecision, sealDecision, DecisionRecord } from "../lib/career/decisions/decision";
import { RecommendationProofChain } from "../lib/career/matching/derivation";

describe("CONDYN Career Analysis Protocol v3.0 - PHASE 3: RECOMMENDATION -> DECISION BOUNDARY (TEST003A)", () => {

  // Mock a recommendation
  const mockRecommendation: RecommendationProofChain = {
    roleId: "ROL_001",
    recommendationState: "RECOMMEND",
    fitScore: {
      metricName: "fitScore",
      semanticDefinition: "mock",
      owner: "mock",
      classification: "DETERMINISTIC_DERIVED",
      inputs: [],
      derivation: "mock",
      value: 0.9
    },
    explainabilityScore: {
      metricName: "explainabilityScore",
      semanticDefinition: "mock",
      owner: "mock",
      classification: "DETERMINISTIC_DERIVED",
      inputs: [],
      derivation: "mock",
      value: 1.0
    },
    alignments: []
  };

  it("A. RECOMMEND recommendation + ACCEPT decision -> PASS", () => {
    const decision = createDecision("SUB_123", mockRecommendation, "ACCEPT", "HiringManager1", "Looks good.");
    expect(decision.decisionState).toBe("ACCEPT");
    expect(decision.recommendationSnapshot.recommendationState).toBe("RECOMMEND");
  });

  it("B. RECOMMEND recommendation + REJECT decision -> PASS / explicit override preserved", () => {
    const decision = createDecision("SUB_123", mockRecommendation, "REJECT", "HiringManager2", "Culture fit issues.");
    expect(decision.decisionState).toBe("REJECT");
    expect(decision.recommendationSnapshot.recommendationState).toBe("RECOMMEND");
  });

  it("C. DO_NOT_RECOMMEND recommendation + ACCEPT decision -> PASS / explicit override preserved", () => {
    const overrideRec: RecommendationProofChain = {
      ...mockRecommendation,
      recommendationState: "DO_NOT_RECOMMEND"
    };
    const decision = createDecision("SUB_123", overrideRec, "ACCEPT", "VP_Engineering", "We desperately need someone, I override.");
    expect(decision.decisionState).toBe("ACCEPT");
    expect(decision.recommendationSnapshot.recommendationState).toBe("DO_NOT_RECOMMEND");
  });

  it("D. decision references nonexistent recommendation -> FAIL", () => {
    // If recommendation is missing, TypeScript/runtime should fail.
    expect(() => createDecision("SUB_123", null as any, "ACCEPT", "Admin", "bad")).toThrow();
  });

  it("E. recommendation changes after decision -> old decision snapshot unchanged", () => {
    const recCopy = JSON.parse(JSON.stringify(mockRecommendation));
    const decision = createDecision("SUB_123", recCopy, "ACCEPT", "Manager", "OK");
    
    // Mutate original recommendation
    recCopy.recommendationState = "DO_NOT_RECOMMEND";
    recCopy.fitScore.value = 0.1;

    // Decision must retain the original snapshot state
    expect(decision.recommendationSnapshot.recommendationState).toBe("RECOMMEND");
    expect(decision.recommendationSnapshot.fitScore.value).toBe(0.9);
  });

  it("F. attempt to mutate historical decision -> REJECT (Deep Freeze Proven)", () => {
    const decision = createDecision("SUB_123", mockRecommendation, "ACCEPT", "Manager", "OK");
    const sealed = sealDecision(decision);
    
    // Top level mutation
    expect(() => {
      (sealed as any).decisionState = "REJECT";
    }).toThrow();
    
    // Deep mutation (this should also fail)
    expect(() => {
      sealed.recommendationSnapshot.fitScore.value = 0.99;
    }).toThrow();

    expect(sealed.decisionState).toBe("ACCEPT");
    expect(sealed.recommendationSnapshot.fitScore.value).toBe(0.9);
  });

  it("G. decision without explicit actor -> REJECT", () => {
    expect(() => {
      createDecision("SUB_123", mockRecommendation, "ACCEPT", "", "Why not");
    }).toThrow(/ERR_DECISION_MISSING_ACTOR/);
  });

  it("H. LLM supplied decision state -> must not obtain decision authority", () => {
    // A raw string or unrecognized state from an LLM cannot be passed.
    expect(() => {
      createDecision("SUB_123", mockRecommendation, "MAYBE_GOOD_FIT" as any, "LLM_Agent", "I think so");
    }).toThrow(/ERR_DECISION_INVALID_STATE/);
  });
});
