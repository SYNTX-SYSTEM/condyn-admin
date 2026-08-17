import { describe, it, expect, beforeEach, beforeAll } from "vitest";
import { db, initDbSchema } from "../lib/career/db/client";
import { LifecycleRepository } from "../lib/career/repositories/lifecycle";
import { careerDecisions, careerRecommendations, careerCommitments, careerActions, careerOutcomes, careerFeedback, careerAttributions, careerPolicyVersions, careerLearningProposals, careerPolicyEvaluations } from "../lib/career/db/schema";
import { eq } from "drizzle-orm";
import { buildRoleRecommendation } from "../lib/career/matching/derivation";
import { createDecision } from "../lib/career/decisions/decision";
import { createCommitment, createActionEvent } from "../lib/career/decisions/action";
import { createOutcome } from "../lib/career/decisions/outcome";
import { createFeedback, createAttribution } from "../lib/career/decisions/feedback";
import { evaluateEligibility, createLearningProposal, replayTrace } from "../lib/career/decisions/learning";
import { createPolicyVersion } from "../lib/career/decisions/policy";

describe("CONDYN Career Analysis Protocol v4.0 - PHASE 4: IMMUTABLE LIFECYCLE PERSISTENCE (TEST004B)", () => {
  let repo: LifecycleRepository;

  beforeAll(async () => {
    await initDbSchema();
  });

  beforeEach(async () => {
    repo = new LifecycleRepository(db);
    // Clear all tables in reverse dependency order
    const { careerPolicyPromotions, careerPolicyFamilies } = await import("../lib/career/db/schema");
    await db.delete(careerPolicyEvaluations);
    await db.delete(careerLearningProposals);
    await db.delete(careerPolicyPromotions);
    await db.delete(careerPolicyFamilies);
    await db.delete(careerPolicyVersions);
    await db.delete(careerAttributions);
    await db.delete(careerFeedback);
    await db.delete(careerOutcomes);
    await db.delete(careerActions);
    await db.delete(careerCommitments);
    await db.delete(careerDecisions);
    await db.delete(careerRecommendations);
  });

  const createDummyRecommendation = () => {
    return buildRoleRecommendation("ROL_TEST", [
      {
        requirementId: "REQ_1",
        state: "SUPPORTED",
        evidences: [{
          evidenceId: "EVI_1",
          score: 0.9,
          type: "EXPLICIT_CLAIM",
          text: "I did this",
          sourceId: "SRC_1",
          documentId: "DOC_1"
        }]
      }
    ]);
  };

  it("A. Recommendation save/load -> deepEqual", async () => {
    const rec = createDummyRecommendation();
    await repo.saveRecommendation(rec);
    const loaded = await repo.loadRecommendation(rec.recommendationId!);
    expect(loaded).toEqual(rec);
  });

  it("B. Decision save/load -> recommendation reference preserved", async () => {
    const rec = createDummyRecommendation();
    await repo.saveRecommendation(rec);
    const decision = createDecision("SUBJ_1", rec, "ACCEPT", "actor1", "Looks good");
    await repo.saveDecision(decision);
    
    const loaded = await repo.loadDecision(decision.decisionId);
    expect(loaded).toEqual(decision);
    expect(loaded!.recommendationId).toBe(rec.recommendationId);
  });

  it("C. Decision with unknown Recommendation -> FAIL", async () => {
    const rec = createDummyRecommendation();
    const decision = createDecision("SUBJ_1", rec, "ACCEPT", "actor1", "Looks good");
    
    // Do not save recommendation
    await expect(repo.saveDecision(decision)).rejects.toThrow("ERR_UNKNOWN_RECOMMENDATION");
  });

  it("D. Commitment with unknown Decision -> FAIL", async () => {
    const rec = createDummyRecommendation();
    const decision = createDecision("SUBJ_1", rec, "ACCEPT", "actor1", "Looks good");
    const commitment = createCommitment(decision, "actor1", "COMMITTED");
    
    await expect(repo.saveCommitment(commitment)).rejects.toThrow("ERR_UNKNOWN_DECISION");
  });

  it("E. Action with unknown Commitment -> FAIL", async () => {
    const rec = createDummyRecommendation();
    const decision = createDecision("SUBJ_1", rec, "ACCEPT", "actor1", "Looks good");
    const commitment = createCommitment(decision, "actor1", "COMMITTED");
    const action = createActionEvent("", commitment, "actor1", "SEND_EMAIL");
    
    await expect(repo.saveAction(action)).rejects.toThrow("ERR_UNKNOWN_COMMITMENT");
  });

  it("F. Outcome with unknown Action -> FAIL", async () => {
    const rec = createDummyRecommendation();
    const decision = createDecision("SUBJ_1", rec, "ACCEPT", "actor1", "Looks good");
    const commitment = createCommitment(decision, "actor1", "COMMITTED");
    const action = createActionEvent("", commitment, "actor1", "SEND_EMAIL");
    const outcome = createOutcome(action, "actor1", "REPLIED");
    
    await expect(repo.saveOutcome(outcome)).rejects.toThrow("ERR_UNKNOWN_ACTION");
  });

  it("G. Feedback with unknown Outcome -> FAIL", async () => {
    const rec = createDummyRecommendation();
    const decision = createDecision("SUBJ_1", rec, "ACCEPT", "actor1", "Looks good");
    const commitment = createCommitment(decision, "actor1", "COMMITTED");
    const action = createActionEvent("", commitment, "actor1", "SEND_EMAIL");
    const outcome = createOutcome(action, "actor1", "REPLIED");
    const feedback = createFeedback("", outcome, "UNDESIRABLE", "actor2");
    
    await expect(repo.saveFeedback(feedback)).rejects.toThrow("ERR_UNKNOWN_OUTCOME");
  });

  it("H. Attribution with unknown Feedback -> FAIL", async () => {
    const rec = createDummyRecommendation();
    const decision = createDecision("SUBJ_1", rec, "ACCEPT", "actor1", "Looks good");
    const commitment = createCommitment(decision, "actor1", "COMMITTED");
    const action = createActionEvent("", commitment, "actor1", "SEND_EMAIL");
    const outcome = createOutcome(action, "actor1", "REPLIED");
    const feedback = createFeedback("", outcome, "UNDESIRABLE", "actor2");
    const attribution = createAttribution("", feedback, "RECOMMENDATION", rec.recommendationId!, "ASSOCIATED_WITH", "actor2");
    
    await expect(repo.saveAttribution(attribution)).rejects.toThrow("ERR_UNKNOWN_FEEDBACK");
  });

  it("I. same ID + identical payload -> IDEMPOTENT", async () => {
    const rec = createDummyRecommendation();
    await repo.saveRecommendation(rec);
    await repo.saveRecommendation(rec); // should pass silently
    const loaded = await repo.loadRecommendation(rec.recommendationId!);
    expect(loaded).toEqual(rec);
  });

  it("J. same ID + reordered object keys -> IDEMPOTENT", async () => {
    const rec = createDummyRecommendation();
    await repo.saveRecommendation(rec);
    
    const reorderedRec = {
      roleId: rec.roleId,
      recommendationState: rec.recommendationState,
      recommendationId: rec.recommendationId,
      alignments: rec.alignments,
      explainabilityScore: rec.explainabilityScore,
      fitScore: rec.fitScore
    } as any;
    
    await expect(repo.saveRecommendation(reorderedRec)).resolves.toBeUndefined();
  });

  it("K. same ID + modified semantic payload -> ERR_IMMUTABLE_RECORD_CONFLICT", async () => {
    const rec = createDummyRecommendation();
    await repo.saveRecommendation(rec);
    
    const modifiedRec = { ...rec, recommendationState: "DO_NOT_RECOMMEND" } as any;
    await expect(repo.saveRecommendation(modifiedRec)).rejects.toThrow("ERR_IMMUTABLE_RECORD_CONFLICT");
  });

  it("L. save V1 Policy -> save V2 Policy -> V1 unchanged", async () => {
    const p1 = createPolicyVersion("POL_1", "FAM_1", 1.0, { minimumExplainability: 0.2, minimumFit: 0.5, partialSupportContribution: 0.5 }, "actor1");
    await repo.savePolicyVersion(p1);
    
    const p2 = createPolicyVersion("POL_2", "FAM_1", 2.0, { minimumExplainability: 0.4, minimumFit: 0.5, partialSupportContribution: 0.5 }, "actor1", new Date().toISOString(), p1.version);
    await repo.savePolicyVersion(p2);
    
    const loadedP1 = await repo.loadPolicyVersion(p1.policyId);
    expect(loadedP1).toEqual(p1);
  });

  it("M. Decision recommendationSnapshot differs from referenced Recommendation -> FAIL", async () => {
    const rec = createDummyRecommendation();
    await repo.saveRecommendation(rec);
    
    const decision = createDecision("SUBJ_1", rec, "ACCEPT", "actor1", "Looks good");
    (decision.recommendationSnapshot as any).recommendationState = "DO_NOT_RECOMMEND";
    
    await expect(repo.saveDecision(decision)).rejects.toThrow("ERR_RECOMMENDATION_SNAPSHOT_MISMATCH");
  });

  it("N. save complete lifecycle -> reload each artifact -> exact lineage reconstructable", async () => {
    const rec = createDummyRecommendation();
    await repo.saveRecommendation(rec);
    
    const decision = createDecision("SUBJ_1", rec, "ACCEPT", "actor1", "Looks good");
    await repo.saveDecision(decision);
    
    const commitment = createCommitment(decision, "actor1", "COMMITTED");
    await repo.saveCommitment(commitment);
    
    const action = createActionEvent("", commitment, "actor1", "SEND_EMAIL");
    await repo.saveAction(action);
    
    const outcome = createOutcome(action, "actor1", "REPLIED");
    await repo.saveOutcome(outcome);
    
    const feedback = createFeedback("", outcome, "UNDESIRABLE", "actor2");
    await repo.saveFeedback(feedback);
    
    const attribution = createAttribution("", feedback, "RECOMMENDATION", rec.recommendationId!, "ASSOCIATED_WITH", "actor2");
    await repo.saveAttribution(attribution);
    
    const loadedRec = await repo.loadRecommendation(rec.recommendationId!);
    const loadedDec = await repo.loadDecision(decision.decisionId);
    const loadedCom = await repo.loadCommitment(commitment.commitmentId);
    const loadedAct = await repo.loadAction(action.actionId);
    const loadedOut = await repo.loadOutcome(outcome.outcomeId);
    const loadedFee = await repo.loadFeedback(feedback.feedbackId);
    const loadedAtt = await repo.loadAttribution(attribution.attributionId);
    
    expect(loadedRec).toEqual(rec);
    expect(loadedDec).toEqual(decision);
    expect(loadedCom).toEqual(commitment);
    expect(loadedAct).toEqual(action);
    expect(loadedOut).toEqual(outcome);
    expect(loadedFee).toEqual(feedback);
    expect(loadedAtt).toEqual(attribution);
  });
});
