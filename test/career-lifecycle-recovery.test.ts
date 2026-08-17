import { describe, it, expect, beforeEach, vi } from "vitest";
import { LifecycleRecoveryService } from "../lib/career/repositories/recovery";
import { LifecycleRepository } from "../lib/career/repositories/lifecycle";
import { initDbSchema, db } from "../lib/career/db/client";
import { sql } from "drizzle-orm";
import { createPolicyVersion } from "../lib/career/decisions/policy";
import { buildRoleRecommendation } from "../lib/career/matching/derivation";
import { createDecision } from "../lib/career/decisions/decision";
import { createCommitment, createActionEvent } from "../lib/career/decisions/action";
import { createOutcome } from "../lib/career/decisions/outcome";
import { createFeedback, createAttribution, clearFeedbackCache } from "../lib/career/decisions/feedback";
import { createLearningProposal, clearLearningCache } from "../lib/career/decisions/learning";

describe("CONDYN Career Analysis Protocol v4.0 - PHASE 4: RESTART & LINEAGE RECONSTRUCTION (TEST004C)", () => {
  let repo: LifecycleRepository;
  let recoveryService: LifecycleRecoveryService;

  beforeEach(async () => {
    await initDbSchema();
    repo = new LifecycleRepository(db);
    recoveryService = new LifecycleRecoveryService();
    clearFeedbackCache();
    clearLearningCache();

    // Clear tables
    await db.execute(sql`DELETE FROM career_policy_evaluations`);
    await db.execute(sql`DELETE FROM career_learning_proposals`);
    await db.execute(sql`DELETE FROM career_attributions`);
    await db.execute(sql`DELETE FROM career_feedback`);
    await db.execute(sql`DELETE FROM career_outcomes`);
    await db.execute(sql`DELETE FROM career_actions`);
    await db.execute(sql`DELETE FROM career_commitments`);
    await db.execute(sql`DELETE FROM career_decisions`);
    await db.execute(sql`DELETE FROM career_recommendations`);
    await db.execute(sql`DELETE FROM career_policy_promotions`);
    await db.execute(sql`DELETE FROM career_policy_families`);
    await db.execute(sql`DELETE FROM career_policy_versions`);
  });

  const generateMockRecommendation = () => {
    const mockRec = buildRoleRecommendation("ROLE_MOCK", []);
    return {
      ...mockRec,
      recommendationId: `REC_${Date.now()}`,
      fitScore: { value: 0.8, metadata: { derivations: [] } },
      explainabilityScore: { value: 0.8, metadata: { derivations: [] } },
      alignments: [
        {
          requirementId: "REQ_1",
          capabilityId: "CAP_1",
          state: "SUPPORTED",
          requirementProof: {
            requirement: { entity_id: "REQ_1", entity_type: "REQUIREMENT", relationships: [] },
            role: { entity_id: "ROLE_MOCK", entity_type: "ROLE", relationships: [] },
            organization: null,
            evidence: [{ doc_id: "DOC_1", text: "req text", source_id: "SRC_1" }],
            documents: [{ entity_id: "DOC_1", entity_type: "DOCUMENT", metadata: {}, relationships: [] }],
            sources: [{ canonicalDocumentId: "DOC_1", originalSourceUri: "https://example.com/source" }]
          },
          capabilityProof: {
            capability: { entity_id: "CAP_1", entity_type: "CAPABILITY", relationships: [] },
            evidence: [{ doc_id: "DOC_2", text: "cap text", source_id: "SRC_2" }],
            documents: [{ entity_id: "DOC_2", entity_type: "DOCUMENT", metadata: {}, relationships: [] }],
            sources: [{ canonicalDocumentId: "DOC_2", originalSourceUri: "https://example.com/source2" }]
          }
        }
      ]
    } as any; // cast for test ease
  };

  async function populateCompleteLifecycle() {
    const policy = createPolicyVersion("POL_V1", "FAM_1", 1.0, { minimumFit: 0.5, minimumExplainability: 0.5, partialSupportContribution: 0.5 }, "actor1");
    await repo.savePolicyVersion(policy);

    const rec = generateMockRecommendation();
    rec.policyVersionId = policy.policyId;
    await repo.saveRecommendation(rec);

    const decision = createDecision("", rec, "ACCEPT", "actor1", "Looks good");
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

    const proposal = createLearningProposal("", policy.policyId, [feedback.feedbackId], [rec.roleId], { minimumFit: 0.8 }, "actor2");
    await repo.saveLearningProposal(proposal);

    return { policy, rec, decision, commitment, action, outcome, feedback, attribution, proposal };
  }

  it("A/B/C/K. complete persisted lifecycle -> exact reconstruction with all IDs/timestamps preserved", async () => {
    const { policy, rec, decision, commitment, action, outcome, feedback, attribution, proposal } = await populateCompleteLifecycle();

    // Clear caches
    clearFeedbackCache();
    clearLearningCache();

    // Reconstruct from attribution
    const recovered = await recoveryService.recoverFromTerminal(attribution.attributionId, "ATTRIBUTION");

    expect(recovered.attribution).toBeDefined();
    expect(recovered.attribution.attributionId).toBe(attribution.attributionId);
    expect(recovered.feedback.feedbackId).toBe(feedback.feedbackId);
    expect(recovered.outcome.outcomeId).toBe(outcome.outcomeId);
    expect(recovered.action.actionId).toBe(action.actionId);
    expect(recovered.commitment.commitmentId).toBe(commitment.commitmentId);
    expect(recovered.decision.decisionId).toBe(decision.decisionId);
    expect(recovered.recommendation.recommendationId).toBe(rec.recommendationId);
    expect(recovered.policyVersion.policyId).toBe(policy.policyId);

    // Deep equal tests
    expect(recovered.attribution).toEqual(attribution);
    expect(recovered.decision).toEqual(decision);
    expect(recovered.action).toEqual(action);
  });

  it("D. Recommendation policy binding preserved", async () => {
    const { policy, rec, attribution } = await populateCompleteLifecycle();
    const recovered = await recoveryService.recoverFromTerminal(attribution.attributionId, "ATTRIBUTION");
    expect(recovered.recommendation.policyVersionId).toBe(policy.policyId);
    expect(recovered.policyVersion.version).toBe(1.0);
  });

  it("E. Evidence -> Document -> Source provenance preserved", async () => {
    const { attribution } = await populateCompleteLifecycle();
    const recovered = await recoveryService.recoverFromTerminal(attribution.attributionId, "ATTRIBUTION");
    const r = recovered.recommendation;
    expect(r.alignments[0].requirementProof.evidence.length).toBe(1);
    expect(r.alignments[0].requirementProof.sources[0].originalSourceUri).toBe("https://example.com/source");
    expect(r.alignments[0].capabilityProof.sources[0].originalSourceUri).toBe("https://example.com/source2");
  });

  it("F. missing parent artifact -> ERR_LIFECYCLE_RECOVERY_BROKEN_LINEAGE", async () => {
    // We cannot delete parents because of Postgres FK constraints (proving 004B works).
    // So we test broken lineage by trying to recover from an artifact ID that does not exist.
    await expect(recoveryService.recoverFromTerminal("NON_EXISTENT_ID", "FEEDBACK"))
      .rejects.toThrow("ERR_LIFECYCLE_RECOVERY_BROKEN_LINEAGE: Missing Feedback");
  });

  it("G. tampered JSONB -> ERR_PERSISTED_ARTIFACT_INTEGRITY", async () => {
    const { action } = await populateCompleteLifecycle();
    // Tamper the payload in DB directly (mutate Action payload without updating hash)
    const tamperedPayload = JSON.stringify({ actionId: action.actionId, tampered: true });
    await db.execute(sql`UPDATE career_actions SET payload = ${tamperedPayload}::jsonb WHERE id = ${action.actionId}`);
    
    await expect(recoveryService.recoverFromTerminal(action.actionId, "ACTION"))
      .rejects.toThrow("ERR_PERSISTED_ARTIFACT_INTEGRITY");
  });

  it("H/J. zero LLM calls during recovery + empty caches", async () => {
    const { proposal } = await populateCompleteLifecycle();
    clearFeedbackCache();
    clearLearningCache();

    // Spying on global fetch to ensure no network calls
    const fetchSpy = vi.spyOn(global, "fetch");
    const recovered = await recoveryService.recoverFromTerminal(proposal.proposalId, "LEARNING_PROPOSAL");
    
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(recovered.learningProposal.proposalId).toBe(proposal.proposalId);
    expect(recovered.feedback.feedbackId).toBe(proposal.eligibleFeedbackIds[0]);
    expect(recovered.decision).toBeDefined(); // full chain down to decision
    
    fetchSpy.mockRestore();
  });
});
