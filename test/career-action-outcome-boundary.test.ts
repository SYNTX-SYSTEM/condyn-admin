import { describe, it, expect, beforeEach } from "vitest";
import { createDecision } from "../lib/career/decisions/decision";
import { RecommendationProofChain } from "../lib/career/matching/derivation";
import { createCommitment, createActionEvent, clearActionCache } from "../lib/career/decisions/action";
import { createOutcome } from "../lib/career/decisions/outcome";

describe("CONDYN Career Analysis Protocol v3.0 - PHASE 3: ACTION -> OUTCOME BOUNDARY (TEST003C)", () => {

  beforeEach(() => {
    clearActionCache();
  });

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

  const decisionTimestamp = "2026-01-01T10:00:00Z";
  const commitmentTimestamp = "2026-01-01T11:00:00Z";
  const actionTimestamp = "2026-01-01T12:00:00Z";

  const mockAction = () => {
    const d = createDecision("SUB_123", mockRecommendation, "ACCEPT", "HiringManager", "Approve");
    const dTime = { ...d, timestamp: decisionTimestamp };
    const c = createCommitment(dTime, "Recruiter", "SEND_OFFER", commitmentTimestamp);
    return createActionEvent("ACT_1", c, "System", "OFFER_SENT", actionTimestamp);
  };

  it("A. ACTION + Valid OUTCOME -> PASS", () => {
    const action = mockAction();
    const outcome = createOutcome(action, "ATS", "OFFER_ACCEPTED", "2026-01-01T13:00:00Z");
    expect(outcome.actionId).toBe(action.actionId);
    expect(outcome.outcomeState).toBe("OFFER_ACCEPTED");
  });

  it("B. OUTCOME without valid ACTION -> FAIL", () => {
    expect(() => {
      createOutcome(null as any, "ATS", "SUCCESS", "2026-01-01T13:00:00Z");
    }).toThrow(/ERR_OUTCOME_MISSING_ACTION/);
  });

  it("C. OUTCOME without explicit ACTOR -> FAIL", () => {
    const action = mockAction();
    expect(() => {
      createOutcome(action, "", "SUCCESS", "2026-01-01T13:00:00Z");
    }).toThrow(/ERR_OUTCOME_MISSING_ACTOR/);
  });

  it("D. OUTCOME occurredAt before ACTION occurredAt -> FAIL", () => {
    const action = mockAction();
    expect(() => {
      // action happened at 12:00, outcome at 11:30
      createOutcome(action, "ATS", "SUCCESS", "2026-01-01T11:30:00Z");
    }).toThrow(/ERR_TEMPORAL_INVARIANT/);
  });

  it("E. Additive Outcomes (two outcomes for same action) -> PASS (Proof of non-mutation)", () => {
    const action = mockAction();
    
    // First outcome
    const outcome1 = createOutcome(action, "ATS", "INTERVIEW_INVITE", "2026-01-01T13:00:00Z");
    expect(outcome1.outcomeState).toBe("INTERVIEW_INVITE");
    
    // Second outcome (some time later)
    const outcome2 = createOutcome(action, "ATS", "OFFER", "2026-01-05T13:00:00Z");
    expect(outcome2.outcomeState).toBe("OFFER");

    // Ensure they both point to the same action without mutating each other
    expect(outcome1.actionId).toBe(action.actionId);
    expect(outcome2.actionId).toBe(action.actionId);
    
    // Ensure they are distinct objects and not mutating each other
    expect(outcome1.outcomeState).toBe("INTERVIEW_INVITE");
    expect(outcome2.outcomeState).toBe("OFFER");
  });
});
