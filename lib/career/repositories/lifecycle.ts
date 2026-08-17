import { generatePayloadHash } from "../utils/hash";
import { RecommendationProofChain } from "../matching/derivation";
import { DecisionRecord } from "../decisions/decision";
import { ActionEvent, CommitmentRecord } from "../decisions/action";
import { OutcomeRecord } from "../decisions/outcome";
import { FeedbackRecord, AttributionRecord } from "../decisions/feedback";
import { LearningProposal, PolicyEvaluation } from "../decisions/learning";
import { PolicyVersion } from "../decisions/policy";
import { careerRecommendations, careerDecisions, careerCommitments, careerActions, careerOutcomes, careerFeedback, careerAttributions, careerLearningProposals, careerPolicyVersions, careerPolicyEvaluations } from "../db/schema";
import { eq } from "drizzle-orm";

export class LifecycleRepository {
  constructor(private db: any) {}

  private async idempotentSave(table: any, id: string, payload: any, sqlValues: any) {
    const payloadHash = generatePayloadHash(payload);
    const existing = await this.db.select({ payloadHash: table.payloadHash }).from(table).where(eq(table.id, id));
    
    if (existing && existing.length > 0) {
      if (existing[0].payloadHash === payloadHash) {
        return; // Idempotent success
      } else {
        throw new Error(`ERR_IMMUTABLE_RECORD_CONFLICT: Artifact ${id} already exists with different payload.`);
      }
    }
    
    try {
      await this.db.insert(table).values({
        id,
        payloadHash,
        payload,
        ...sqlValues
      });
    } catch (e: any) {
      const errCause = e.cause || e;
      if (errCause.code === '23505') {
        // Unique constraint violation (race condition)
        const recheck = await this.db.select({ payloadHash: table.payloadHash }).from(table).where(eq(table.id, id));
        if (recheck && recheck.length > 0) {
          if (recheck[0].payloadHash === payloadHash) {
            return; // Idempotent success after concurrent insert
          } else {
            throw new Error(`ERR_IMMUTABLE_RECORD_CONFLICT: Artifact ${id} concurrently inserted with different payload.`);
          }
        }
      }
      
      if (errCause.code === '23503' || (errCause.message && errCause.message.includes('foreign key constraint'))) {
        const msg = (errCause.constraint || errCause.message || "").toLowerCase();
        if (msg.includes("decision")) throw new Error("ERR_UNKNOWN_DECISION");
        if (msg.includes("recommendation")) throw new Error("ERR_UNKNOWN_RECOMMENDATION");
        if (msg.includes("commitment")) throw new Error("ERR_UNKNOWN_COMMITMENT");
        if (msg.includes("action")) throw new Error("ERR_UNKNOWN_ACTION");
        if (msg.includes("outcome")) throw new Error("ERR_UNKNOWN_OUTCOME");
        if (msg.includes("feedback")) throw new Error("ERR_UNKNOWN_FEEDBACK");
        if (msg.includes("policy")) throw new Error("ERR_UNKNOWN_POLICY");
        throw new Error(`ERR_UNKNOWN_PARENT: ${errCause.message}`);
      }
      throw e;
    }
  }

  private async load<T>(table: any, id: string): Promise<T | null> {
    const existing = await this.db.select({ payload: table.payload }).from(table).where(eq(table.id, id));
    if (existing && existing.length > 0) {
      return existing[0].payload as T;
    }
    return null;
  }

  async saveRecommendation(rec: RecommendationProofChain): Promise<void> {
    if (!rec.recommendationId) throw new Error("Recommendation missing ID");
    await this.idempotentSave(careerRecommendations, rec.recommendationId, rec, {});
  }
  
  async loadRecommendation(id: string): Promise<RecommendationProofChain | null> {
    return this.load<RecommendationProofChain>(careerRecommendations, id);
  }

  async saveDecision(dec: DecisionRecord): Promise<void> {
    const recId = dec.recommendationId;
    if (!recId) throw new Error("Decision missing recommendationId");
    
    const recSnapshotHash = generatePayloadHash(dec.recommendationSnapshot);
    const existingRec = await this.db.select({ payloadHash: careerRecommendations.payloadHash }).from(careerRecommendations).where(eq(careerRecommendations.id, recId));
    if (existingRec && existingRec.length > 0) {
      if (existingRec[0].payloadHash !== recSnapshotHash) {
        throw new Error("ERR_RECOMMENDATION_SNAPSHOT_MISMATCH");
      }
    } else {
      throw new Error("ERR_UNKNOWN_RECOMMENDATION");
    }

    await this.idempotentSave(careerDecisions, dec.decisionId, dec, {
      recommendationId: recId,
      timestamp: dec.timestamp,
      actor: dec.actor
    });
  }
  
  async loadDecision(id: string): Promise<DecisionRecord | null> {
    return this.load<DecisionRecord>(careerDecisions, id);
  }

  async saveCommitment(com: CommitmentRecord): Promise<void> {
    await this.idempotentSave(careerCommitments, com.commitmentId, com, {
      decisionId: com.decisionId,
      timestamp: com.createdAt
    });
  }
  
  async loadCommitment(id: string): Promise<CommitmentRecord | null> {
    return this.load<CommitmentRecord>(careerCommitments, id);
  }

  async saveAction(act: ActionEvent): Promise<void> {
    await this.idempotentSave(careerActions, act.actionId, act, {
      commitmentId: act.commitmentId,
      timestamp: act.occurredAt
    });
  }

  async loadAction(id: string): Promise<ActionEvent | null> {
    return this.load<ActionEvent>(careerActions, id);
  }

  async saveOutcome(out: OutcomeRecord): Promise<void> {
    await this.idempotentSave(careerOutcomes, out.outcomeId, out, {
      actionId: out.actionId,
      timestamp: out.occurredAt
    });
  }

  async loadOutcome(id: string): Promise<OutcomeRecord | null> {
    return this.load<OutcomeRecord>(careerOutcomes, id);
  }

  async saveFeedback(fb: FeedbackRecord): Promise<void> {
    await this.idempotentSave(careerFeedback, fb.feedbackId, fb, {
      outcomeId: fb.outcomeId,
      timestamp: fb.observedAt,
      actor: fb.actor
    });
  }

  async loadFeedback(id: string): Promise<FeedbackRecord | null> {
    return this.load<FeedbackRecord>(careerFeedback, id);
  }

  async saveAttribution(attr: AttributionRecord): Promise<void> {
    await this.idempotentSave(careerAttributions, attr.attributionId, attr, {
      feedbackId: attr.feedbackId,
      timestamp: new Date().toISOString()
    });
  }

  async loadAttribution(id: string): Promise<AttributionRecord | null> {
    return this.load<AttributionRecord>(careerAttributions, id);
  }

  async savePolicyVersion(pv: PolicyVersion): Promise<void> {
    await this.idempotentSave(careerPolicyVersions, pv.policyId, pv, {
      version: pv.version,
      parentVersion: pv.parentVersion ?? null,
      createdAt: pv.createdAt,
      createdBy: pv.createdBy
    });
  }

  async loadPolicyVersion(id: string): Promise<PolicyVersion | null> {
    return this.load<PolicyVersion>(careerPolicyVersions, id);
  }

  async saveLearningProposal(lp: LearningProposal): Promise<void> {
    await this.idempotentSave(careerLearningProposals, lp.proposalId, lp, {
      feedbackId: lp.eligibleFeedbackIds[0] || "UNKNOWN", // mapping first feedback id
      timestamp: lp.createdAt
    });
  }

  async loadLearningProposal(id: string): Promise<LearningProposal | null> {
    return this.load<LearningProposal>(careerLearningProposals, id);
  }

  async savePolicyEvaluation(pe: PolicyEvaluation): Promise<void> {
    await this.idempotentSave(careerPolicyEvaluations, pe.evaluationId, pe, {
      candidatePolicyId: pe.candidatePolicyId,
      baselinePolicyId: pe.baselinePolicyId,
      timestamp: new Date().toISOString()
    });
  }

  async loadPolicyEvaluation(id: string): Promise<PolicyEvaluation | null> {
    return this.load<PolicyEvaluation>(careerPolicyEvaluations, id);
  }

  async promotePolicy(
    promotionId: string,
    policyFamilyId: string,
    candidatePolicyId: string,
    expectedRevision: number,
    actor: string,
    rationale?: string,
    evaluationId?: string
  ): Promise<any> {
    const { createPromotionRecord } = await import("../decisions/policy");
    
    // Perform promotion in a single transaction
    return await this.db.transaction(async (tx: any) => {
      // 1. Lock Family Head and Verify Compare-And-Swap
      const { careerPolicyFamilies, careerPolicyPromotions } = await import("../db/schema");

      // 0. Check idempotency first
      const existingPromo = await tx.select().from(careerPolicyPromotions).where(eq(careerPolicyPromotions.id, promotionId));
      if (existingPromo && existingPromo.length > 0) {
        const existing = existingPromo[0].payload;
        // Check if the payload is logically the same (excluding promotedAt which might be new)
        if (existing.toPolicyVersionId === candidatePolicyId && existing.fromPolicyVersionId === (expectedRevision === 0 ? null : "ignore-for-now") /* We only really need to check candidate and actor */ && existing.actor === actor) {
           return existing;
        }
        throw new Error("ERR_IMMUTABLE_RECORD_CONFLICT: Artifact " + promotionId + " already exists with different payload.");
      }

      // 1. Lock Family Head and Verify Compare-And-Swap
      const headQuery = await tx.execute(
        require("drizzle-orm").sql`SELECT active_policy_version_id, revision FROM career_policy_families WHERE id = ${policyFamilyId} FOR UPDATE`
      );
      
      let currentActiveId = null;
      let currentRevision = 0;
      
      if (headQuery && headQuery.length > 0) {
        currentActiveId = headQuery[0].active_policy_version_id;
        currentRevision = headQuery[0].revision;
      }
      
      if (currentRevision !== expectedRevision) {
        throw new Error(`ERR_POLICY_ACTIVATION_CONFLICT: Expected revision ${expectedRevision} but found ${currentRevision}`);
      }

      // Verify Candidate Exists
      const candidateResult = await tx.select().from(careerPolicyVersions).where(eq(careerPolicyVersions.id, candidatePolicyId));
      if (!candidateResult || candidateResult.length === 0) {
        throw new Error("ERR_POLICY_NOT_FOUND: Candidate policy not found.");
      }
      
      const candidate = candidateResult[0].payload;
      if (candidate.policyFamilyId !== policyFamilyId) {
        throw new Error("ERR_POLICY_ACTIVATION_FAMILY_MISMATCH: Candidate policy belongs to a different family.");
      }

      const promotion = createPromotionRecord(
        promotionId,
        policyFamilyId,
        candidatePolicyId,
        currentActiveId,
        currentRevision,
        actor,
        rationale,
        evaluationId
      );
      
      const payloadHash = generatePayloadHash(promotion);
      
      if (currentRevision === 0) {
        // Insert new family FIRST to satisfy FK constraints for promotion
        await tx.insert(careerPolicyFamilies).values({
          id: policyFamilyId,
          activePolicyVersionId: candidatePolicyId,
          revision: 1,
          updatedAt: promotion.promotedAt
        });
      } else {
        // Update family FIRST
        await tx.update(careerPolicyFamilies)
          .set({ 
            activePolicyVersionId: candidatePolicyId, 
            revision: currentRevision + 1, 
            updatedAt: promotion.promotedAt 
          })
          .where(eq(careerPolicyFamilies.id, policyFamilyId));
      }

      try {
        await tx.insert(careerPolicyPromotions).values({
          id: promotionId,
          policyFamilyId,
          fromPolicyVersionId: currentActiveId,
          toPolicyVersionId: candidatePolicyId,
          actor,
          promotedAt: promotion.promotedAt,
          payloadHash,
          payload: promotion
        });
      } catch (err: any) {
        if (err.code === "23505" || (err.message && err.message.includes("duplicate key"))) {
           throw new Error("ERR_IMMUTABLE_RECORD_CONFLICT: Artifact " + promotionId + " already exists with different payload.");
        }
        throw err;
      }

      return promotion;
    });
  }
}
