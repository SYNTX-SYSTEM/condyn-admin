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
  assertCareerExecutionAuthorityGrantRevision,
  type CareerExecutionAuthorityGrantRevision,
} from "../../execution-authority-grant";
import {
  assertCareerExecutionContextRevision,
  type CareerExecutionContextRevision,
} from "../../execution-context-revision";
import {
  assertCareerHumanCommitment,
  type CareerHumanCommitment,
} from "../../human-commitment";
import {
  assertRecommendationProposal,
  type RecommendationProposal,
} from "../../recommendation-proposal";
import {
  assertCareerActionOccurrence,
  deriveCareerActionOccurrenceId,
  type CareerActionOccurrence,
} from "..";

const fail = (): never => { throw new Error("ERR_CAREER_ACTION_OCCURRENCE_REPLAY_MISMATCH"); };
const subjectKey = (subject: {
  recommendationProposalId: string;
  sourceEvolutionInputItemOrdinal: number;
}) => `${subject.recommendationProposalId}:${String(subject.sourceEvolutionInputItemOrdinal).padStart(12, "0")}`;
const sameInventory = (left: readonly string[], right: readonly string[]) =>
  left.length === right.length && left.every((value, index) => value === right[index]);
const expectedScope: Record<string, string> = {
  RECOMMENDATION_OPERATIONALIZATION: "RECOMMENDATION_OPERATION_EXECUTION",
  FURTHER_EVIDENCE_REQUEST_OPERATIONALIZATION: "FURTHER_EVIDENCE_REQUEST_EXECUTION",
  TARGET_CLARIFICATION_REQUEST_OPERATIONALIZATION: "TARGET_CLARIFICATION_REQUEST_EXECUTION",
};

export interface CareerActionOccurrenceReplayDependencies {
  occurrences: { getCareerActionOccurrenceById(id: string): Promise<CareerActionOccurrence | null> };
  contexts: { getCareerExecutionContextRevisionById(id: string): Promise<CareerExecutionContextRevision | null> };
  grants: { getCareerExecutionAuthorityGrantRevisionById(id: string): Promise<CareerExecutionAuthorityGrantRevision | null> };
  commitments: { getCareerHumanCommitmentById(id: string): Promise<CareerHumanCommitment | null> };
  intents: { getCareerDecisionActionIntentById(id: string): Promise<CareerDecisionActionIntent | null> };
  records: { getHumanDecisionRecordById(id: string): Promise<HumanDecisionRecord | null> };
  decisionContexts: { getCareerDecisionContextRevisionById(id: string): Promise<CareerDecisionContextRevision | null> };
  authorities: { getDecisionAuthorityGrantRevisionById(id: string): Promise<DecisionAuthorityGrantRevision | null> };
  proposals: { getRecommendationProposalById(id: string): Promise<RecommendationProposal | null> };
}

async function stored(id: string, dependencies: CareerActionOccurrenceReplayDependencies): Promise<CareerActionOccurrence> {
  try {
    const value = await dependencies.occurrences.getCareerActionOccurrenceById(id);
    if (!value) throw new Error("ERR_CAREER_ACTION_OCCURRENCE_NOT_FOUND");
    assertCareerActionOccurrence(value);
    return value;
  } catch (error) {
    if (error instanceof Error && error.message === "ERR_CAREER_ACTION_OCCURRENCE_NOT_FOUND") throw error;
    return fail();
  }
}

async function validate(id: string, dependencies: CareerActionOccurrenceReplayDependencies) {
  const value = await stored(id, dependencies);
  try {
    const context = await dependencies.contexts.getCareerExecutionContextRevisionById(
      value.careerExecutionContextRevisionId,
    );
    if (!context) return fail();
    assertCareerExecutionContextRevision(context);
    const grant = await dependencies.grants.getCareerExecutionAuthorityGrantRevisionById(
      value.careerExecutionAuthorityGrantRevisionId,
    );
    if (!grant) return fail();
    assertCareerExecutionAuthorityGrantRevision(grant);
    const commitment = await dependencies.commitments.getCareerHumanCommitmentById(grant.careerHumanCommitmentId);
    if (!commitment) return fail();
    assertCareerHumanCommitment(commitment);
    const intent = await dependencies.intents.getCareerDecisionActionIntentById(commitment.careerDecisionActionIntentId);
    if (!intent) return fail();
    assertCareerDecisionActionIntent(intent);
    const record = await dependencies.records.getHumanDecisionRecordById(intent.humanDecisionRecordId);
    if (!record) return fail();
    assertHumanDecisionRecord(record);
    const [decisionContext, authority, proposal] = await Promise.all([
      dependencies.decisionContexts.getCareerDecisionContextRevisionById(record.careerDecisionContextRevisionId),
      dependencies.authorities.getDecisionAuthorityGrantRevisionById(record.decisionAuthorityGrantRevisionId),
      dependencies.proposals.getRecommendationProposalById(record.recommendationProposalId),
    ]);
    if (!decisionContext || !authority || !proposal) return fail();
    assertCareerDecisionContextRevision(decisionContext);
    assertDecisionAuthorityGrantRevision(authority);
    assertRecommendationProposal(proposal);
    assertHumanDecisionWitnesses(record, decisionContext, authority, proposal);
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
      grant.careerHumanCommitmentId !== commitment.careerHumanCommitmentId ||
      grant.humanDecisionRecordId !== commitment.humanDecisionRecordId ||
      grant.careerDecisionActionIntentId !== commitment.careerDecisionActionIntentId ||
      grant.careerDecisionContextRevisionId !== commitment.careerDecisionContextRevisionId ||
      grant.decisionAuthorityGrantRevisionId !== commitment.decisionAuthorityGrantRevisionId ||
      grant.recommendationProposalId !== commitment.recommendationProposalId ||
      grant.sourceDeclarationClass !== commitment.sourceDeclarationClass ||
      grant.sourceActionIntentClass !== commitment.sourceActionIntentClass ||
      grant.operationDescription !== commitment.operationDescription ||
      !sameInventory(grant.decisionSubjects.map(subjectKey), commitment.decisionSubjects.map(subjectKey)) ||
      grant.executionAuthorityScope !== expectedScope[commitment.sourceActionIntentClass] ||
      grant.declaredAt < commitment.committedAt ||
      grant.effectiveFrom < grant.declaredAt ||
      (grant.effectiveUntil !== null && grant.effectiveUntil <= grant.effectiveFrom) ||
      context.careerExecutionAuthorityGrantRevisionId !== grant.careerExecutionAuthorityGrantRevisionId ||
      context.careerHumanCommitmentId !== grant.careerHumanCommitmentId ||
      context.careerDecisionActionIntentId !== grant.careerDecisionActionIntentId ||
      context.humanDecisionRecordId !== grant.humanDecisionRecordId ||
      context.careerDecisionContextRevisionId !== grant.careerDecisionContextRevisionId ||
      context.decisionAuthorityGrantRevisionId !== grant.decisionAuthorityGrantRevisionId ||
      context.recommendationProposalId !== grant.recommendationProposalId ||
      context.sourceDeclarationClass !== grant.sourceDeclarationClass ||
      context.sourceActionIntentClass !== grant.sourceActionIntentClass ||
      context.operationDescription !== grant.operationDescription ||
      context.executionAuthorityScope !== grant.executionAuthorityScope ||
      !sameInventory(context.decisionSubjects.map(subjectKey), grant.decisionSubjects.map(subjectKey)) ||
      context.declaredByActorId !== grant.authorizedExecutionActorId ||
      !grant.permittedTargetKinds.includes(context.executionTarget.targetKind) ||
      !grant.permittedChannelKinds.includes(context.executionChannel.channelKind) ||
      context.declaredAt < grant.declaredAt ||
      context.declaredAt < grant.effectiveFrom ||
      (grant.effectiveUntil !== null && context.declaredAt >= grant.effectiveUntil) ||
      value.careerExecutionContextRevisionId !== context.careerExecutionContextRevisionId ||
      value.careerExecutionAuthorityGrantRevisionId !== context.careerExecutionAuthorityGrantRevisionId ||
      value.careerHumanCommitmentId !== context.careerHumanCommitmentId ||
      value.careerDecisionActionIntentId !== context.careerDecisionActionIntentId ||
      value.humanDecisionRecordId !== context.humanDecisionRecordId ||
      value.careerDecisionContextRevisionId !== context.careerDecisionContextRevisionId ||
      value.decisionAuthorityGrantRevisionId !== context.decisionAuthorityGrantRevisionId ||
      value.recommendationProposalId !== context.recommendationProposalId ||
      value.performedByActorId !== context.declaredByActorId ||
      !sameInventory(value.decisionSubjects.map(subjectKey), context.decisionSubjects.map(subjectKey)) ||
      value.sourceDeclarationClass !== context.sourceDeclarationClass ||
      value.sourceActionIntentClass !== context.sourceActionIntentClass ||
      value.operationDescription !== context.operationDescription ||
      value.executionAuthorityScope !== context.executionAuthorityScope ||
      value.executionTarget.targetKind !== context.executionTarget.targetKind ||
      value.executionTarget.targetRef !== context.executionTarget.targetRef ||
      value.executionChannel.channelKind !== context.executionChannel.channelKind ||
      value.executionChannel.channelRef !== context.executionChannel.channelRef ||
      value.occurredAt < context.declaredAt ||
      value.careerExecutionAuthorityGrantRevisionId !== grant.careerExecutionAuthorityGrantRevisionId ||
      value.careerHumanCommitmentId !== grant.careerHumanCommitmentId ||
      value.careerDecisionActionIntentId !== grant.careerDecisionActionIntentId ||
      value.humanDecisionRecordId !== grant.humanDecisionRecordId ||
      value.careerDecisionContextRevisionId !== grant.careerDecisionContextRevisionId ||
      value.decisionAuthorityGrantRevisionId !== grant.decisionAuthorityGrantRevisionId ||
      value.recommendationProposalId !== grant.recommendationProposalId ||
      !sameInventory(value.decisionSubjects.map(subjectKey), grant.decisionSubjects.map(subjectKey)) ||
      value.sourceDeclarationClass !== grant.sourceDeclarationClass ||
      value.sourceActionIntentClass !== grant.sourceActionIntentClass ||
      value.operationDescription !== grant.operationDescription ||
      value.executionAuthorityScope !== grant.executionAuthorityScope ||
      value.performedByActorId !== grant.authorizedExecutionActorId ||
      !grant.permittedTargetKinds.includes(value.executionTarget.targetKind) ||
      !grant.permittedChannelKinds.includes(value.executionChannel.channelKind) ||
      // Replay uses historical EAGR applicability at occurredAt; it never
      // reinterprets DAR timing or turns later expiry into an AOC mutation.
      value.occurredAt < grant.effectiveFrom ||
      (grant.effectiveUntil !== null && value.occurredAt >= grant.effectiveUntil)
    ) return fail();
    const { careerActionOccurrenceId, createdAt: _createdAt, ...semantic } = value;
    if (careerActionOccurrenceId !== deriveCareerActionOccurrenceId(semantic)) return fail();
    return structuredClone(value);
  } catch {
    return fail();
  }
}

/** BYTE replay reads stored AOC declaration only; it never traverses history or recreates occurrence. */
export async function byteReplayCareerActionOccurrence(
  id: string,
  dependencies: CareerActionOccurrenceReplayDependencies,
) {
  return structuredClone(await stored(id, dependencies));
}

/** Semantic replay verifies exact historical authority and lineage, never external execution effects. */
export async function semanticReplayCareerActionOccurrence(
  id: string,
  dependencies: CareerActionOccurrenceReplayDependencies,
) {
  return validate(id, dependencies);
}

/** Derivation replay validates only AOC identity; it never reconstructs a missing occurrence. */
export async function derivationReplayCareerActionOccurrence(
  id: string,
  dependencies: CareerActionOccurrenceReplayDependencies,
) {
  const value = await stored(id, dependencies);
  try {
    const { careerActionOccurrenceId, createdAt: _createdAt, ...semantic } = value;
    if (careerActionOccurrenceId !== deriveCareerActionOccurrenceId(semantic)) return fail();
    return structuredClone(value);
  } catch {
    return fail();
  }
}
