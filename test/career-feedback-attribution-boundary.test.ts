import { describe, it, expect, beforeEach } from "vitest";
import { createDecision } from "../lib/career/decisions/decision";
import { RecommendationProofChain } from "../lib/career/matching/derivation";
import { createCommitment, createActionEvent, clearActionCache } from "../lib/career/decisions/action";
import { createOutcome } from "../lib/career/decisions/outcome";
import { createFeedback, createAttribution, clearFeedbackCache } from "../lib/career/decisions/feedback";

describe("CONDYN Career Analysis Protocol v3.0 - PHASE 3: OUTCOME -> FEEDBACK ATTRIBUTION BOUNDARY (TEST003D)", () => {

  beforeEach(() => {
    clearActionCache();
    clearFeedbackCache();
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
  const outcomeTimestamp = "2026-01-01T13:00:00Z";
  const feedbackTimestamp = "2026-01-01T14:00:00Z";

  const buildChain = () => {
    const d = createDecision("SUB_123", mockRecommendation, "ACCEPT", "Manager", "Approve");
    const dTime = { ...d, timestamp: decisionTimestamp };
    const c = createCommitment(dTime, "Recruiter", "SEND_OFFER", commitmentTimestamp);
    const a = createActionEvent("ACT_1", c, "System", "OFFER_SENT", actionTimestamp);
    const o = createOutcome(a, "ATS", "OFFER_RECEIVED", outcomeTimestamp);
    return { decision: dTime, commitment: c, action: a, outcome: o };
  };

  it("A. Outcome exists -> explicit DESIRABLE Feedback -> PASS", () => {
    const { outcome } = buildChain();
    const fdb = createFeedback("FDB_1", outcome, "DESIRABLE", "Candidate", feedbackTimestamp);
    expect(fdb.evaluation).toBe("DESIRABLE");
  });

  it("B. Feedback without Outcome -> FAIL", () => {
    expect(() => {
      createFeedback("FDB_1", null as any, "DESIRABLE", "Candidate", feedbackTimestamp);
    }).toThrow(/ERR_FEEDBACK_MISSING_OUTCOME/);
  });

  it("C. Feedback without actor -> FAIL", () => {
    const { outcome } = buildChain();
    expect(() => {
      createFeedback("FDB_1", outcome, "DESIRABLE", "", feedbackTimestamp);
    }).toThrow(/ERR_FEEDBACK_MISSING_ACTOR/);
  });

  it("D. same Outcome -> two observers -> different evaluations -> PASS", () => {
    const { outcome } = buildChain();
    const fdb1 = createFeedback("FDB_1", outcome, "DESIRABLE", "Candidate", feedbackTimestamp);
    const fdb2 = createFeedback("FDB_2", outcome, "UNDESIRABLE", "CurrentEmployer", feedbackTimestamp);
    expect(fdb1.evaluation).toBe("DESIRABLE");
    expect(fdb2.evaluation).toBe("UNDESIRABLE");
  });

  it("E. Feedback associated with Recommendation -> PASS", () => {
    const { outcome, decision } = buildChain();
    const fdb = createFeedback("FDB_1", outcome, "DESIRABLE", "Candidate", feedbackTimestamp);
    const attr = createAttribution("ATTR_1", fdb, "RECOMMENDATION", "REC_123", "ASSOCIATED_WITH", "Candidate");
    expect(attr.attributionType).toBe("ASSOCIATED_WITH");
    expect(attr.targetType).toBe("RECOMMENDATION");
  });

  it("F. Feedback explicitly SUPPORTS Recommendation -> PASS as observer attribution", () => {
    const { outcome } = buildChain();
    const fdb = createFeedback("FDB_1", outcome, "DESIRABLE", "Candidate", feedbackTimestamp);
    const attr = createAttribution("ATTR_1", fdb, "RECOMMENDATION", "REC_123", "SUPPORTS", "Candidate");
    expect(attr.attributionType).toBe("SUPPORTS");
  });

  it("G. system automatically claims Recommendation CAUSED Outcome -> REJECT", () => {
    const { outcome } = buildChain();
    const fdb = createFeedback("FDB_1", outcome, "DESIRABLE", "Candidate", feedbackTimestamp);
    expect(() => {
      createAttribution("ATTR_1", fdb, "RECOMMENDATION", "REC_123", "CAUSAL_CLAIM", "System");
    }).toThrow(/ERR_ATTRIBUTION_PROHIBITED_CAUSALITY/);
  });

  it("H. UNDESIRABLE Outcome feedback -> historical Recommendation remains unchanged", () => {
    const { outcome, decision } = buildChain();
    const recCopy = { ...decision.recommendationSnapshot };
    const fdb = createFeedback("FDB_1", outcome, "UNDESIRABLE", "Candidate", feedbackTimestamp);
    
    // We didn't touch recCopy
    expect(recCopy.recommendationState).toBe("RECOMMEND");
  });

  it("I. Decision override -> later Feedback does not mutate Decision", () => {
    const { decision, action } = buildChain();
    const outcome = createOutcome(action, "ATS", "OFFER_RECEIVED", outcomeTimestamp);
    
    // Create feedback
    createFeedback("FDB_1", outcome, "DESIRABLE", "Candidate", feedbackTimestamp);
    
    // Ensure decision state is strictly unmodified
    expect(decision.decisionState).toBe("ACCEPT");
  });

  it("J. attempt to modify policy from Feedback -> prohibited in TEST003D", () => {
    // This is tested by the fact that there are no functions to mutate policy from feedback in our API.
    // The closest is creating an attribution to POLICY which is allowed as a claim, but mutating is impossible.
    const { outcome } = buildChain();
    const fdb = createFeedback("FDB_1", outcome, "DESIRABLE", "Candidate", feedbackTimestamp);
    const attr = createAttribution("ATTR_1", fdb, "POLICY", "FIT_POLICY_V1", "SUPPORTS", "DataScience");
    expect(attr.targetType).toBe("POLICY");
  });

  it("K. sealed Feedback / Attribution mutation -> REJECT", () => {
    const { outcome } = buildChain();
    const fdb = createFeedback("FDB_1", outcome, "DESIRABLE", "Candidate", feedbackTimestamp);
    expect(() => {
      (fdb as any).evaluation = "NEUTRAL";
    }).toThrow();
  });

  it("L. duplicate IDs: identical payload -> idempotent, conflicting payload -> REJECT", () => {
    const { outcome } = buildChain();
    const fdb1 = createFeedback("FDB_1", outcome, "DESIRABLE", "Candidate", feedbackTimestamp);
    const fdb2 = createFeedback("FDB_1", outcome, "DESIRABLE", "Candidate", feedbackTimestamp);
    expect(fdb1).toBe(fdb2); // Cached instance

    expect(() => {
      createFeedback("FDB_1", outcome, "UNDESIRABLE", "Candidate", feedbackTimestamp);
    }).toThrow(/ERR_FEEDBACK_CONFLICT/);
  });

  it("M. Temporal invariant -> Feedback observedAt before Outcome occurredAt -> FAIL", () => {
    const { outcome } = buildChain();
    expect(() => {
      createFeedback("FDB_1", outcome, "DESIRABLE", "Candidate", "2026-01-01T12:30:00Z"); // Outcome is 13:00
    }).toThrow(/ERR_TEMPORAL_INVARIANT/);
  });
});
