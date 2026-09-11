import {
  assertCareerDecisionActionIntent,
  type CareerDecisionActionIntent,
} from "../../action-intent";
import {
  assertDecisionAuthorityGrantRevision,
  type DecisionAuthorityGrantRevision,
} from "../../decision-authority";
import {
  assertCareerDecisionContextRevision,
  type CareerDecisionContextRevision,
} from "../../decision-context";
import {
  assertHumanDecisionRecord,
  assertHumanDecisionWitnesses,
  type HumanDecisionRecord,
} from "../../decision-record";
import {
  assertCareerHumanCommitment,
  type CareerHumanCommitment,
} from "../../human-commitment";
import {
  assertRecommendationProposal,
  type RecommendationProposal,
} from "../../recommendation-proposal";
import {
  assertCareerExecutionAuthorityGrantRevision,
  deriveCareerExecutionAuthorityGrantRevisionId,
  type CareerExecutionAuthorityGrantRevision,
  type CareerExecutionAuthorityScope,
} from "..";

const fail = (): never => { throw new Error("ERR_CAREER_EXECUTION_AUTHORITY_GRANT_REPLAY_MISMATCH"); };
const subjectKey = (subject: { recommendationProposalId: string; sourceEvolutionInputItemOrdinal: number }) =>
  `${subject.recommendationProposalId}:${String(subject.sourceEvolutionInputItemOrdinal).padStart(12, "0")}`;
const sameInventory = (left: readonly string[], right: readonly string[]) =>
  left.length === right.length && left.every((value, index) => value === right[index]);
const expectedScope: Record<string, CareerExecutionAuthorityScope> = {
  RECOMMENDATION_OPERATIONALIZATION: "RECOMMENDATION_OPERATION_EXECUTION",
  FURTHER_EVIDENCE_REQUEST_OPERATIONALIZATION: "FURTHER_EVIDENCE_REQUEST_EXECUTION",
  TARGET_CLARIFICATION_REQUEST_OPERATIONALIZATION: "TARGET_CLARIFICATION_REQUEST_EXECUTION",
};

export interface CareerExecutionAuthorityGrantRevisionReplayDependencies {
  grants: { getCareerExecutionAuthorityGrantRevisionById(id: string): Promise<CareerExecutionAuthorityGrantRevision | null> };
  commitments: { getCareerHumanCommitmentById(id: string): Promise<CareerHumanCommitment | null> };
  intents: { getCareerDecisionActionIntentById(id: string): Promise<CareerDecisionActionIntent | null> };
  records: { getHumanDecisionRecordById(id: string): Promise<HumanDecisionRecord | null> };
  contexts: { getCareerDecisionContextRevisionById(id: string): Promise<CareerDecisionContextRevision | null> };
  authorities: { getDecisionAuthorityGrantRevisionById(id: string): Promise<DecisionAuthorityGrantRevision | null> };
  proposals: { getRecommendationProposalById(id: string): Promise<RecommendationProposal | null> };
}

async function stored(id: string, dependencies: CareerExecutionAuthorityGrantRevisionReplayDependencies): Promise<CareerExecutionAuthorityGrantRevision> {
  try {
    const value = await dependencies.grants.getCareerExecutionAuthorityGrantRevisionById(id);
    if (!value) throw new Error("ERR_CAREER_EXECUTION_AUTHORITY_GRANT_NOT_FOUND");
    assertCareerExecutionAuthorityGrantRevision(value);
    return value;
  } catch (error) {
    if (error instanceof Error && error.message === "ERR_CAREER_EXECUTION_AUTHORITY_GRANT_NOT_FOUND") throw error;
    return fail();
  }
}

async function validate(id: string, dependencies: CareerExecutionAuthorityGrantRevisionReplayDependencies): Promise<CareerExecutionAuthorityGrantRevision> {
  const value = await stored(id, dependencies);
  try {
    const commitment = await dependencies.commitments.getCareerHumanCommitmentById(value.careerHumanCommitmentId);
    if (!commitment) return fail();
    assertCareerHumanCommitment(commitment);
    const intent = await dependencies.intents.getCareerDecisionActionIntentById(commitment.careerDecisionActionIntentId);
    if (!intent) return fail();
    assertCareerDecisionActionIntent(intent);
    const record = await dependencies.records.getHumanDecisionRecordById(intent.humanDecisionRecordId);
    if (!record) return fail();
    assertHumanDecisionRecord(record);
    const [context, authority, proposal] = await Promise.all([
      dependencies.contexts.getCareerDecisionContextRevisionById(record.careerDecisionContextRevisionId),
      dependencies.authorities.getDecisionAuthorityGrantRevisionById(record.decisionAuthorityGrantRevisionId),
      dependencies.proposals.getRecommendationProposalById(record.recommendationProposalId),
    ]);
    if (!context || !authority || !proposal) return fail();
    assertCareerDecisionContextRevision(context);
    assertDecisionAuthorityGrantRevision(authority);
    assertRecommendationProposal(proposal);
    assertHumanDecisionWitnesses(record, context, authority, proposal);
    if (
      commitment.careerDecisionActionIntentId !== intent.careerDecisionActionIntentId ||
      commitment.humanDecisionRecordId !== intent.humanDecisionRecordId ||
      commitment.careerDecisionContextRevisionId !== intent.careerDecisionContextRevisionId ||
      commitment.decisionAuthorityGrantRevisionId !== intent.decisionAuthorityGrantRevisionId ||
      commitment.recommendationProposalId !== intent.recommendationProposalId ||
      commitment.committedByActorId !== intent.declaredByActorId ||
      commitment.sourceDeclarationClass !== intent.sourceDeclarationClass ||
      commitment.sourceActionIntentClass !== intent.actionIntentClass ||
      commitment.operationDescription !== intent.operationDescription ||
      !sameInventory(commitment.decisionSubjects.map(subjectKey), intent.decisionSubjects.map(subjectKey)) ||
      commitment.committedAt < intent.declaredAt ||
      value.careerHumanCommitmentId !== commitment.careerHumanCommitmentId ||
      value.humanDecisionRecordId !== commitment.humanDecisionRecordId ||
      value.careerDecisionActionIntentId !== commitment.careerDecisionActionIntentId ||
      value.careerDecisionContextRevisionId !== commitment.careerDecisionContextRevisionId ||
      value.decisionAuthorityGrantRevisionId !== commitment.decisionAuthorityGrantRevisionId ||
      value.recommendationProposalId !== commitment.recommendationProposalId ||
      value.sourceDeclarationClass !== commitment.sourceDeclarationClass ||
      value.sourceActionIntentClass !== commitment.sourceActionIntentClass ||
      value.operationDescription !== commitment.operationDescription ||
      !sameInventory(value.decisionSubjects.map(subjectKey), commitment.decisionSubjects.map(subjectKey)) ||
      value.executionAuthorityScope !== expectedScope[commitment.sourceActionIntentClass] ||
      value.declaredAt < commitment.committedAt ||
      value.effectiveFrom < value.declaredAt ||
      (value.effectiveUntil !== null && value.effectiveUntil <= value.effectiveFrom)
    ) return fail();
    const { careerExecutionAuthorityGrantRevisionId, createdAt: _createdAt, ...semantic } = value;
    if (careerExecutionAuthorityGrantRevisionId !== deriveCareerExecutionAuthorityGrantRevisionId(semantic)) return fail();
    return structuredClone(value);
  } catch {
    return fail();
  }
}

/** BYTE replay reads persisted EAGR history only and never regenerates authority. */
export async function byteReplayCareerExecutionAuthorityGrantRevision(id: string, dependencies: CareerExecutionAuthorityGrantRevisionReplayDependencies) {
  return structuredClone(await stored(id, dependencies));
}

/** Semantic replay validates exact historical witnesses; it never creates context or occurrence. */
export async function semanticReplayCareerExecutionAuthorityGrantRevision(id: string, dependencies: CareerExecutionAuthorityGrantRevisionReplayDependencies) {
  return validate(id, dependencies);
}

/** Identity-only replay recomputes persisted EAGR ID; missing authority remains missing. */
export async function derivationReplayCareerExecutionAuthorityGrantRevision(id: string, dependencies: CareerExecutionAuthorityGrantRevisionReplayDependencies) {
  const value = await stored(id, dependencies);
  try {
    const { careerExecutionAuthorityGrantRevisionId, createdAt: _createdAt, ...semantic } = value;
    if (careerExecutionAuthorityGrantRevisionId !== deriveCareerExecutionAuthorityGrantRevisionId(semantic)) return fail();
    return structuredClone(value);
  } catch {
    return fail();
  }
}
