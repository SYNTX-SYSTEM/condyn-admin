import { describe, it, expect, beforeEach, beforeAll } from "vitest";
import { initDbSchema, db } from "../lib/career/db/client";
import { LifecycleRepository } from "../lib/career/repositories/lifecycle";
import { LifecycleRecoveryService } from "../lib/career/repositories/recovery";
import { sql } from "drizzle-orm";
import { createPolicyVersion } from "../lib/career/decisions/policy";
import { createDecision } from "../lib/career/decisions/decision";
import { createCommitment, createActionEvent } from "../lib/career/decisions/action";
import { createOutcome } from "../lib/career/decisions/outcome";
import { createFeedback } from "../lib/career/decisions/feedback";
import { buildRoleRecommendation } from "../lib/career/matching/derivation";

describe("CONDYN Career Analysis Protocol v4.0 - PHASE 4: GLOBAL IDEMPOTENCY & CONCURRENCY (TEST004E)", () => {
  let repo: LifecycleRepository;
  let recoveryService: LifecycleRecoveryService;

  beforeAll(async () => {
    await initDbSchema();
  });

  beforeEach(async () => {
    repo = new LifecycleRepository(db);
    recoveryService = new LifecycleRecoveryService();

    // Clear all tables
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

  const setupBase = async () => {
    const policy = createPolicyVersion("POL_CONCURRENCY", "FAM_1", 1.0, { minimumFit: 0.5, minimumExplainability: 0.5, partialSupportContribution: 0.5 }, "actor1");
    await repo.savePolicyVersion(policy);
    await repo.promotePolicy("PROM_CONC", "FAM_1", "POL_CONCURRENCY", 0, "admin");

    const mockRec = buildRoleRecommendation("ROLE_CONC", []);
    const rec = {
      ...mockRec,
      recommendationId: `REC_CONC`,
      fitScore: { value: 0.8, metadata: { derivations: [] } },
      explainabilityScore: { value: 0.8, metadata: { derivations: [] } },
      alignments: [],
      policyVersionId: policy.policyId
    } as any;
    await repo.saveRecommendation(rec);

    return { policy, rec };
  };

  it("A/B/C/D. concurrent insertions -> idempotent success or strict ERR_IMMUTABLE_RECORD_CONFLICT", async () => {
    const { rec } = await setupBase();
    
    // Test A: Two identical Decision inserts -> one persisted truth
    const decision1 = createDecision("SUB_1", rec, "ACCEPT", "actor1", "Looks good");
    const decision2 = { ...decision1 }; // identical
    
    const resultsA = await Promise.allSettled([
      repo.saveDecision(decision1),
      repo.saveDecision(decision2)
    ]);
    
    expect(resultsA.filter(r => r.status === "fulfilled").length).toBe(2); // both succeed cleanly via idempotency

    // Test B: same Decision ID + conflicting payload -> one succeeds / one conflict
    const decision3 = createDecision("SUB_2", rec, "ACCEPT", "actor1", "Looks good");
    const decision3Conflict = { ...decision3, rationale: "Conflict rationale" };
    
    const resultsB = await Promise.allSettled([
      repo.saveDecision(decision3),
      repo.saveDecision(decision3Conflict as any)
    ]);
    
    expect(resultsB.filter(r => r.status === "fulfilled").length).toBe(1);
    expect(resultsB.filter(r => r.status === "rejected").length).toBe(1);
    expect((resultsB.find(r => r.status === "rejected") as any).reason.message).toContain("ERR_IMMUTABLE_RECORD_CONFLICT");
    
    // Check C & D with Actions
    const commitment = createCommitment(decision1, "actor1", "COMMITTED");
    await repo.saveCommitment(commitment);
    
    const action1 = createActionEvent("ACT_CONC", commitment, "actor1", "SEND_EMAIL");
    const action2 = { ...action1 };
    const actionConflict = { ...action1, actionType: "PHONE_CALL" };
    
    const resultsCD = await Promise.allSettled([
      repo.saveAction(action1),
      repo.saveAction(action2),
      repo.saveAction(actionConflict as any)
    ]);
    
    // Exactly 2 fulfilled (identical), 1 rejected (conflict)
    expect(resultsCD.filter(r => r.status === "fulfilled").length).toBe(2);
    expect(resultsCD.filter(r => r.status === "rejected").length).toBe(1);
    expect((resultsCD.find(r => r.status === "rejected") as any).reason.message).toContain("ERR_IMMUTABLE_RECORD_CONFLICT");
  });

  it("E. same external Outcome event delivered twice concurrently -> one Outcome", async () => {
    const { rec } = await setupBase();
    const decision = createDecision("SUB_E", rec, "ACCEPT", "actor1", "");
    await repo.saveDecision(decision);
    const commitment = createCommitment(decision, "actor1", "COMMITTED");
    await repo.saveCommitment(commitment);
    const action = createActionEvent("ACT_E", commitment, "actor1", "SEND_EMAIL");
    await repo.saveAction(action);
    
    // Assume outcomeId is derived from external delivery ID to enforce idempotency
    const outcomeExternalId = "EXT_OUTCOME_123";
    
    let outcome1 = createOutcome(action, "system", "REPLIED");
    outcome1 = { ...outcome1, outcomeId: outcomeExternalId }; // Force deterministic external ID
    
    const outcome2 = { ...outcome1 };
    
    const results = await Promise.allSettled([
      repo.saveOutcome(outcome1),
      repo.saveOutcome(outcome2)
    ]);
    
    expect(results.filter(r => r.status === "fulfilled").length).toBe(2); // Both succeed
    
    const dbRows = await db.execute(sql`SELECT * FROM career_outcomes WHERE id = ${outcomeExternalId}`);
    expect(dbRows.length).toBe(1); // Only 1 physical record
  });

  it("F. same Outcome + two different legitimate observers -> two FeedbackRecords", async () => {
    const { rec } = await setupBase();
    const decision = createDecision("SUB_F", rec, "ACCEPT", "actor1", "");
    await repo.saveDecision(decision);
    const commitment = createCommitment(decision, "actor1", "COMMITTED");
    await repo.saveCommitment(commitment);
    const action = createActionEvent("ACT_F", commitment, "actor1", "SEND_EMAIL");
    await repo.saveAction(action);
    const outcome = createOutcome(action, "system", "REPLIED");
    await repo.saveOutcome(outcome);
    
    // Two feedback records for the same outcome, but different actors
    const f1 = createFeedback("FDB_1", outcome, "DESIRABLE", "Candidate");
    const f2 = createFeedback("FDB_2", outcome, "NEUTRAL", "Recruiter");
    
    await Promise.all([
      repo.saveFeedback(f1),
      repo.saveFeedback(f2)
    ]);
    
    const dbRows = await db.execute(sql`SELECT * FROM career_feedback WHERE outcome_id = ${outcome.outcomeId}`);
    expect(dbRows.length).toBe(2);
  });

  it("G/H. child races before parent commit -> no dangling lineage / retry succeeds", async () => {
    const { rec } = await setupBase();
    const decision = createDecision("SUB_GH", rec, "ACCEPT", "actor1", "");
    const commitment = createCommitment(decision, "actor1", "COMMITTED");
    
    // Try to save commitment before decision
    await expect(repo.saveCommitment(commitment)).rejects.toThrow(); // missing parent
    
    // Now save decision (parent commit)
    await repo.saveDecision(decision);
    
    // Retry succeeds
    await expect(repo.saveCommitment(commitment)).resolves.not.toThrow();
  });

  it("I. three concurrent identical retries -> still one artifact", async () => {
    const { rec } = await setupBase();
    const decision = createDecision("SUB_I", rec, "ACCEPT", "actor1", "");
    
    const results = await Promise.allSettled([
      repo.saveDecision({ ...decision }),
      repo.saveDecision({ ...decision }),
      repo.saveDecision({ ...decision })
    ]);
    
    expect(results.filter(r => r.status === "fulfilled").length).toBe(3);
    const dbRows = await db.execute(sql`SELECT * FROM career_decisions WHERE id = ${decision.decisionId}`);
    expect(dbRows.length).toBe(1);
  });

  it("J/K/L. process restart after race -> exact lifecycle recovery (no JS lock needed)", async () => {
    const { rec, policy } = await setupBase();
    const decision = createDecision("SUB_J", rec, "ACCEPT", "actor1", "");
    const commitment = createCommitment(decision, "actor1", "COMMITTED");
    const action = createActionEvent("ACT_J", commitment, "actor1", "SEND_EMAIL");
    
    // We execute concurrently to simulate race
    await Promise.all([
      repo.saveDecision(decision),
      repo.saveDecision({ ...decision }) // identical race
    ]);
    
    await Promise.all([
      repo.saveCommitment(commitment),
      repo.saveCommitment({ ...commitment })
    ]);
    
    await repo.saveAction(action);
    
    // Recover from scratch (process restart)
    const recovered = await recoveryService.recoverFromTerminal(action.actionId, "ACTION");
    
    // K: Canonical hash remains stable
    expect(recovered.action).toEqual(action);
    expect(recovered.commitment.commitmentId).toBe(commitment.commitmentId);
    expect(recovered.decision.decisionId).toBe(decision.decisionId);
    expect(recovered.recommendation.recommendationId).toBe(rec.recommendationId);
    expect(recovered.policyVersion.policyId).toBe(policy.policyId);
  });
});
