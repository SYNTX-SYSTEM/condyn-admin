import { describe, it, expect, beforeEach } from "vitest";
import { createPolicyVersion, promotePolicy, getActivePolicyVersion, clearPolicyCache } from "../lib/career/decisions/policy";
import { createLearningProposal, evaluateEligibility, replayTrace, clearLearningCache } from "../lib/career/decisions/learning";
import { createFeedback, createAttribution, clearFeedbackCache } from "../lib/career/decisions/feedback";
import { RecommendationProofChain } from "../lib/career/matching/derivation";
import { createOutcome } from "../lib/career/decisions/outcome";
import { createDecision } from "../lib/career/decisions/decision";
import { createCommitment, createActionEvent, clearActionCache } from "../lib/career/decisions/action";

describe("CONDYN Career Analysis Protocol v3.0 - PHASE 3: LEARNING WITHOUT HISTORY MUTATION (TEST003E)", () => {

  beforeEach(() => {
    clearActionCache();
    clearFeedbackCache();
    clearPolicyCache();
    clearLearningCache();
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
      value: 0.35 // explicitly set for replay testing
    },
    alignments: [],
    policyVersionId: "POL_V1"
  };

  const setupBase = () => {
    const p1 = createPolicyVersion("POL_V1", 1, { minimumExplainability: 0.30, minimumFit: 0.5, partialSupportContribution: 0 }, "System");
    promotePolicy("POL_V1", "System");

    const d = createDecision("SUB_123", mockRecommendation, "ACCEPT", "Manager", "Approve");
    const t2 = new Date(new Date(d.timestamp).getTime() + 1000).toISOString();
    const c = createCommitment(d, "Recruiter", "SEND_OFFER", t2);
    const t3 = new Date(new Date(t2).getTime() + 1000).toISOString();
    const a = createActionEvent("ACT_1", c, "System", "OFFER_SENT", t3);
    const t4 = new Date(new Date(t3).getTime() + 1000).toISOString();
    const o = createOutcome(a, "ATS", "OFFER_RECEIVED", t4);
    const t5 = new Date(new Date(t4).getTime() + 1000).toISOString();
    const fdb = createFeedback("FDB_1", o, "DESIRABLE", "Candidate", t5);
    const attr = createAttribution("ATTR_1", fdb, "RECOMMENDATION", "REC_1", "SUPPORTS", "Candidate");

    return { p1, d, fdb, attr };
  };

  it("A. eligible Feedback -> LearningProposal -> PASS", () => {
    const { p1, fdb, attr } = setupBase();
    const eligibility = evaluateEligibility(fdb, attr);
    expect(eligibility.status).toBe("ELIGIBLE");

    const prop = createLearningProposal("PROP_1", p1.policyId, [fdb.feedbackId], ["TRC_1"], { minimumExplainability: 0.40 }, "System");
    expect(prop.proposedChanges.minimumExplainability).toBe(0.40);
    expect(prop.status).toBe("DRAFT");
  });

  it("B. anonymous / invalid Feedback -> excluded with explicit reason", () => {
    const { fdb, attr } = setupBase();
    // Simulate invalid actor
    const badFdb = { ...fdb, actor: "anonymous" };
    const eligibility = evaluateEligibility(badFdb, attr);
    expect(eligibility.status).toBe("INELIGIBLE");
    expect(eligibility.reason).toContain("Anonymous or unresolved");
  });

  it("C. LearningProposal -> base policy remains unchanged", () => {
    const { p1, fdb } = setupBase();
    createLearningProposal("PROP_1", p1.policyId, [fdb.feedbackId], ["TRC_1"], { minimumExplainability: 0.40 }, "System");
    
    // Active policy should still be p1 exactly as it was
    const active = getActivePolicyVersion();
    expect(active?.configuration.minimumExplainability).toBe(0.30);
  });

  it("D. candidate policy differs -> new immutable PolicyVersion", () => {
    const p2 = createPolicyVersion("POL_V2", 2, { minimumExplainability: 0.40, minimumFit: 0.5, partialSupportContribution: 0 }, "System", new Date().toISOString(), 1);
    expect(p2.policyId).toBe("POL_V2");
    expect(p2.version).toBe(2);
  });

  it("E. attempt to modify existing PolicyVersion -> FAIL", () => {
    const { p1 } = setupBase();
    expect(() => {
      (p1 as any).version = 2;
    }).toThrow();
  });

  it("F. historical Recommendation referencing V1 -> still references V1 after V2 creation", () => {
    const { d } = setupBase();
    createPolicyVersion("POL_V2", 2, { minimumExplainability: 0.40, minimumFit: 0.5, partialSupportContribution: 0 }, "System");
    
    expect(d.recommendationSnapshot.policyVersionId).toBe("POL_V1");
  });

  it("G. replay historical trace under V2 -> counterfactual result created -> historical Recommendation unchanged", () => {
    const { p1, d } = setupBase();
    const p2 = createPolicyVersion("POL_V2", 2, { minimumExplainability: 0.40, minimumFit: 0.5, partialSupportContribution: 0 }, "System");
    
    const evaluation = replayTrace(p2, p1, d.recommendationSnapshot);
    
    // Historical remains "RECOMMEND"
    expect(d.recommendationSnapshot.recommendationState).toBe("RECOMMEND");
    
    // Counterfactual V2 says "DO_NOT_RECOMMEND" because minExplainability (0.4) > explainability (0.35)
    expect(evaluation.candidateResults.recommendationState).toBe("DO_NOT_RECOMMEND");
    expect(evaluation.comparison).toBe("DIVERGENT");
  });

  it("I. policy promotion without actor -> FAIL", () => {
    createPolicyVersion("POL_V2", 2, { minimumExplainability: 0.40, minimumFit: 0.5, partialSupportContribution: 0 }, "System");
    expect(() => {
      promotePolicy("POL_V2", "");
    }).toThrow(/ERR_POLICY_PROMOTION_MISSING_ACTOR/);
  });

  it("K. promotion V2 -> V2 ACTIVE -> V1 historical references preserved", () => {
    const { p1, d } = setupBase();
    createPolicyVersion("POL_V2", 2, { minimumExplainability: 0.40, minimumFit: 0.5, partialSupportContribution: 0 }, "System");
    promotePolicy("POL_V2", "System");

    const active = getActivePolicyVersion();
    expect(active?.policyId).toBe("POL_V2");
    expect(active?.status).toBe("ACTIVE");

    // V1 is still technically in cache but as RETIRED (checked conceptually, though our API doesn't expose it directly)
    // Historical decision still points to POL_V1
    expect(d.recommendationSnapshot.policyVersionId).toBe("POL_V1");
  });

  it("L. feedback with CAUSAL_CLAIM -> ineligible for v1 learning", () => {
    const { fdb, attr } = setupBase();
    const causalAttr = { ...attr, attributionType: "CAUSAL_CLAIM" as any };
    const eligibility = evaluateEligibility(fdb, causalAttr);
    expect(eligibility.status).toBe("INELIGIBLE");
  });

  it("M. duplicate LearningProposal ID identical -> idempotent", () => {
    const { p1 } = setupBase();
    const prop1 = createLearningProposal("PROP_1", p1.policyId, [], [], { minimumExplainability: 0.40 }, "System");
    const prop2 = createLearningProposal("PROP_1", p1.policyId, [], [], { minimumExplainability: 0.40 }, "System");
    expect(prop1).toBe(prop2);
  });

  it("N. duplicate ID conflicting payload -> FAIL", () => {
    const { p1 } = setupBase();
    createLearningProposal("PROP_1", p1.policyId, [], [], { minimumExplainability: 0.40 }, "System");
    expect(() => {
      createLearningProposal("PROP_1", p1.policyId, [], [], { minimumExplainability: 0.50 }, "System");
    }).toThrow(/ERR_PROPOSAL_CONFLICT/);
  });
});
