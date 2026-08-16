import { describe, it, expect, beforeEach } from "vitest";
import { createDecision } from "../lib/career/decisions/decision";
import { RecommendationProofChain } from "../lib/career/matching/derivation";
import { createCommitment, createActionEvent, clearActionCache } from "../lib/career/decisions/action";

describe("CONDYN Career Analysis Protocol v3.0 - PHASE 3: DECISION -> COMMITMENT -> ACTION BOUNDARY (TEST003B)", () => {

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
  const mockDecision = () => {
    const d = createDecision("SUB_123", mockRecommendation, "ACCEPT", "HiringManager", "Approve");
    // We override timestamp for temporal testing
    return { ...d, timestamp: decisionTimestamp };
  };

  it("A. ACCEPT Decision -> no Commitment -> valid state", () => {
    const d = mockDecision();
    expect(d.decisionState).toBe("ACCEPT");
    // Valid by virtue of not throwing. The operational state is just "Decision made".
  });

  it("B. ACCEPT Decision -> explicit Commitment -> PASS", () => {
    const d = mockDecision();
    const commitment = createCommitment(d, "Recruiter", "SEND_OFFER", "2026-01-01T11:00:00Z");
    expect(commitment.decisionId).toBe(d.decisionId);
    expect(commitment.actionType).toBe("SEND_OFFER");
  });

  it("C. Recommendation exists but no Decision -> Commitment creation FAILS", () => {
    expect(() => {
      // Trying to pass a recommendation directly or a null decision
      createCommitment(null as any, "Recruiter", "SEND_OFFER");
    }).toThrow(/ERR_COMMITMENT_MISSING_DECISION/);
  });

  it("D. Commitment without actor -> FAIL", () => {
    const d = mockDecision();
    expect(() => {
      createCommitment(d, "", "SEND_OFFER");
    }).toThrow(/ERR_COMMITMENT_MISSING_ACTOR/);
  });

  it("E. Action without Commitment -> FAIL", () => {
    expect(() => {
      createActionEvent("ACT_1", null as any, "System", "OFFER_SENT");
    }).toThrow(/ERR_ACTION_MISSING_COMMITMENT/);
  });

  it("F. Commitment exists -> no Action yet -> valid", () => {
    const d = mockDecision();
    const commitment = createCommitment(d, "Recruiter", "SEND_OFFER", "2026-01-01T11:00:00Z");
    expect(commitment.commitmentId).toBeDefined();
    // Valid state.
  });

  it("G. Action references Commitment -> PASS", () => {
    const d = mockDecision();
    const commitment = createCommitment(d, "Recruiter", "SEND_OFFER", "2026-01-01T11:00:00Z");
    const action = createActionEvent("ACT_1", commitment, "System", "OFFER_SENT", "2026-01-01T12:00:00Z");
    expect(action.commitmentId).toBe(commitment.commitmentId);
  });

  it("H. Action timestamp before Commitment -> FAIL", () => {
    const d = mockDecision();
    const commitment = createCommitment(d, "Recruiter", "SEND_OFFER", "2026-01-01T11:00:00Z");
    expect(() => {
      createActionEvent("ACT_1", commitment, "System", "OFFER_SENT", "2026-01-01T10:30:00Z");
    }).toThrow(/ERR_TEMPORAL_INVARIANT/);
  });

  it("I. Commitment timestamp before Decision -> FAIL", () => {
    const d = mockDecision();
    expect(() => {
      createCommitment(d, "Recruiter", "SEND_OFFER", "2025-12-31T23:00:00Z");
    }).toThrow(/ERR_TEMPORAL_INVARIANT/);
  });

  it("J. Decision actor != Commitment actor != Action actor -> PASS", () => {
    const d = mockDecision();
    expect(d.actor).toBe("HiringManager");
    const commitment = createCommitment(d, "Recruiter", "SEND_OFFER", "2026-01-01T11:00:00Z");
    expect(commitment.actor).toBe("Recruiter");
    const action = createActionEvent("ACT_1", commitment, "System", "OFFER_SENT", "2026-01-01T12:00:00Z");
    expect(action.actor).toBe("System");
  });

  it("K. duplicate Action ID + identical payload -> idempotent / same event", () => {
    const d = mockDecision();
    const commitment = createCommitment(d, "Recruiter", "SEND_OFFER", "2026-01-01T11:00:00Z");
    const action1 = createActionEvent("ACT_DUP", commitment, "System", "OFFER_SENT", "2026-01-01T12:00:00Z");
    const action2 = createActionEvent("ACT_DUP", commitment, "System", "OFFER_SENT", "2026-01-01T12:05:00Z"); // Should return cached identical one
    expect(action1).toBe(action2);
    expect(action2.occurredAt).toBe("2026-01-01T12:00:00Z"); // Cached original timestamp
  });

  it("L. duplicate Action ID + conflicting payload -> REJECT", () => {
    const d = mockDecision();
    const commitment = createCommitment(d, "Recruiter", "SEND_OFFER", "2026-01-01T11:00:00Z");
    createActionEvent("ACT_DUP", commitment, "System", "OFFER_SENT", "2026-01-01T12:00:00Z");
    expect(() => {
      createActionEvent("ACT_DUP", commitment, "OtherSystem", "OFFER_SENT", "2026-01-01T12:00:00Z");
    }).toThrow(/ERR_ACTION_CONFLICT/);
  });
});
