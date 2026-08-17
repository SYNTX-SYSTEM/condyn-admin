import { LifecycleRepository } from "./lifecycle";
import { eq } from "drizzle-orm";
import { 
  careerAttributions, 
  careerFeedback, 
  careerOutcomes, 
  careerActions, 
  careerCommitments, 
  careerDecisions, 
  careerRecommendations,
  careerLearningProposals,
  careerPolicyEvaluations,
  careerPolicyVersions
} from "../db/schema";
import { db } from "../db/client";
import crypto from "crypto";

export interface RecoveredLifecycle {
  attribution?: any;
  feedback?: any;
  outcome?: any;
  action?: any;
  commitment?: any;
  decision?: any;
  recommendation?: any;
  policyVersion?: any;
  learningProposal?: any;
  policyEvaluation?: any;
}

import { generatePayloadHash } from "../utils/hash";

export class LifecycleRecoveryService {
  private verifyHash(payload: any, expectedHash: string, type: string) {
    const computedHash = generatePayloadHash(payload);
    if (computedHash !== expectedHash) {
      throw new Error(`ERR_PERSISTED_ARTIFACT_INTEGRITY: Hash mismatch for ${type}. Expected ${expectedHash}, got ${computedHash}`);
    }
  }

  async recoverFromTerminal(artifactId: string, artifactType: "ATTRIBUTION" | "FEEDBACK" | "OUTCOME" | "ACTION" | "COMMITMENT" | "DECISION" | "RECOMMENDATION" | "LEARNING_PROPOSAL"): Promise<RecoveredLifecycle> {
    const result: RecoveredLifecycle = {};
    let currentId = artifactId;
    let currentType = artifactType;

    const load = async (table: any, id: string, name: string) => {
      const records = await db.select().from(table).where(eq(table.id, id));
      if (!records || records.length === 0) return null;
      const record = records[0];
      this.verifyHash(record.payload, record.payloadHash, name);
      return record;
    };

    if (currentType === "LEARNING_PROPOSAL") {
      const propRec = await load(careerLearningProposals, currentId, "LearningProposal");
      if (!propRec) throw new Error("ERR_LIFECYCLE_RECOVERY_BROKEN_LINEAGE: Missing LearningProposal");
      result.learningProposal = propRec.payload;
      currentId = propRec.payload.eligibleFeedbackIds?.[0]; 
      currentType = "FEEDBACK";
      if (!currentId) {
        throw new Error("ERR_LIFECYCLE_RECOVERY_BROKEN_LINEAGE: LearningProposal has no feedback");
      }
    }

    if (currentType === "ATTRIBUTION") {
      const attrRec = await load(careerAttributions, currentId, "Attribution");
      if (!attrRec) throw new Error("ERR_LIFECYCLE_RECOVERY_BROKEN_LINEAGE: Missing Attribution");
      result.attribution = attrRec.payload;
      currentId = attrRec.payload.feedbackId;
      currentType = "FEEDBACK";
    }

    if (currentType === "FEEDBACK") {
      const fbRec = await load(careerFeedback, currentId, "Feedback");
      if (!fbRec) throw new Error("ERR_LIFECYCLE_RECOVERY_BROKEN_LINEAGE: Missing Feedback");
      result.feedback = fbRec.payload;
      currentId = fbRec.payload.outcomeId;
      currentType = "OUTCOME";
    }

    if (currentType === "OUTCOME") {
      const outRec = await load(careerOutcomes, currentId, "Outcome");
      if (!outRec) throw new Error("ERR_LIFECYCLE_RECOVERY_BROKEN_LINEAGE: Missing Outcome");
      result.outcome = outRec.payload;
      currentId = outRec.payload.actionId;
      currentType = "ACTION";
    }

    if (currentType === "ACTION") {
      const actRec = await load(careerActions, currentId, "Action");
      if (!actRec) throw new Error("ERR_LIFECYCLE_RECOVERY_BROKEN_LINEAGE: Missing Action");
      result.action = actRec.payload;
      currentId = actRec.payload.commitmentId;
      currentType = "COMMITMENT";
    }

    if (currentType === "COMMITMENT") {
      const comRec = await load(careerCommitments, currentId, "Commitment");
      if (!comRec) throw new Error("ERR_LIFECYCLE_RECOVERY_BROKEN_LINEAGE: Missing Commitment");
      result.commitment = comRec.payload;
      currentId = comRec.payload.decisionId;
      currentType = "DECISION";
    }

    if (currentType === "DECISION") {
      const decRec = await load(careerDecisions, currentId, "Decision");
      if (!decRec) throw new Error("ERR_LIFECYCLE_RECOVERY_BROKEN_LINEAGE: Missing Decision");
      result.decision = decRec.payload;
      currentId = decRec.payload.recommendationId;
      currentType = "RECOMMENDATION";
    }

    if (currentType === "RECOMMENDATION") {
      const recRec = await load(careerRecommendations, currentId, "Recommendation");
      if (!recRec) throw new Error("ERR_LIFECYCLE_RECOVERY_BROKEN_LINEAGE: Missing Recommendation");
      result.recommendation = recRec.payload;
      
      if (recRec.payload.policyVersionId) {
        const polRec = await load(careerPolicyVersions, recRec.payload.policyVersionId, "PolicyVersion");
        if (!polRec) throw new Error("ERR_LIFECYCLE_RECOVERY_BROKEN_LINEAGE: Missing PolicyVersion");
        result.policyVersion = polRec.payload;
      }
    }

    return result;
  }
}
