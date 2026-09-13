import {
  semanticReplayCareerOutcomeValenceDeclaration,
  type CareerOutcomeValenceDeclarationReplayDependencies,
} from "../../outcome-valence-declaration/replay";
import {
  assertCareerOutcomeValenceDeclaration,
  type CareerOutcomeValenceDeclaration,
} from "../../outcome-valence-declaration";
import {
  assertCareerOutcomeValenceFeedbackAdmissionDeclaration,
  deriveCareerOutcomeValenceFeedbackAdmissionDeclarationId,
  type CareerOutcomeValenceFeedbackAdmissionDeclaration,
} from "..";

const fail = (): never => {
  throw new Error("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_ADMISSION_DECLARATION_REPLAY_MISMATCH");
};
const subjectKey = (subject: {
  recommendationProposalId: string;
  sourceEvolutionInputItemOrdinal: number;
}) => `${subject.recommendationProposalId}:${String(subject.sourceEvolutionInputItemOrdinal).padStart(12, "0")}`;
const sameInventory = (left: readonly string[], right: readonly string[]) =>
  left.length === right.length && left.every((value, index) => value === right[index]);

export const CAREER_OUTCOME_VALENCE_FEEDBACK_ADMISSION_DECLARATION_REPLAY_MODES = [
  "BYTE_REPLAY", "SEMANTIC_REPLAY", "DERIVATION_REPLAY",
] as const;

export interface CareerOutcomeValenceFeedbackAdmissionDeclarationReplayDependencies
extends Omit<CareerOutcomeValenceDeclarationReplayDependencies, "declarations"> {
  admissions: {
    getCareerOutcomeValenceFeedbackAdmissionDeclarationById(
      id: string,
    ): Promise<CareerOutcomeValenceFeedbackAdmissionDeclaration | null>;
  };
  outcomeValences: {
    getCareerOutcomeValenceDeclarationById(id: string): Promise<CareerOutcomeValenceDeclaration | null>;
  };
}

async function stored(
  id: string,
  dependencies: CareerOutcomeValenceFeedbackAdmissionDeclarationReplayDependencies,
): Promise<CareerOutcomeValenceFeedbackAdmissionDeclaration> {
  try {
    const value = await dependencies.admissions
      .getCareerOutcomeValenceFeedbackAdmissionDeclarationById(id);
    if (!value) throw new Error("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_ADMISSION_DECLARATION_NOT_FOUND");
    assertCareerOutcomeValenceFeedbackAdmissionDeclaration(value);
    if (value.careerOutcomeValenceFeedbackAdmissionDeclarationId !== id) return fail();
    return value;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_ADMISSION_DECLARATION_NOT_FOUND"
    ) throw error;
    return fail();
  }
}

function exactOutcomeValenceRelation(
  value: CareerOutcomeValenceFeedbackAdmissionDeclaration,
  outcomeValence: unknown,
): void {
  assertCareerOutcomeValenceDeclaration(outcomeValence);
  if (
    value.careerOutcomeValenceDeclarationId !== outcomeValence.careerOutcomeValenceDeclarationId ||
    value.careerOutcomeRoleDeclarationId !== outcomeValence.careerOutcomeRoleDeclarationId ||
    value.careerActionStateChangeAssociationDeclarationId !== outcomeValence.careerActionStateChangeAssociationDeclarationId ||
    value.careerStateChangeDeclarationId !== outcomeValence.careerStateChangeDeclarationId ||
    value.careerActionOccurrenceId !== outcomeValence.careerActionOccurrenceId ||
    value.careerExecutionContextRevisionId !== outcomeValence.careerExecutionContextRevisionId ||
    value.careerExecutionAuthorityGrantRevisionId !== outcomeValence.careerExecutionAuthorityGrantRevisionId ||
    value.careerHumanCommitmentId !== outcomeValence.careerHumanCommitmentId ||
    value.careerDecisionActionIntentId !== outcomeValence.careerDecisionActionIntentId ||
    value.humanDecisionRecordId !== outcomeValence.humanDecisionRecordId ||
    value.careerDecisionContextRevisionId !== outcomeValence.careerDecisionContextRevisionId ||
    value.decisionAuthorityGrantRevisionId !== outcomeValence.decisionAuthorityGrantRevisionId ||
    value.recommendationProposalId !== outcomeValence.recommendationProposalId ||
    value.performedByActorId !== outcomeValence.performedByActorId ||
    value.observedByActorId !== outcomeValence.observedByActorId ||
    value.associationDeclaredByActorId !== outcomeValence.associationDeclaredByActorId ||
    value.outcomeRoleDeclaredByActorId !== outcomeValence.outcomeRoleDeclaredByActorId ||
    value.outcomeValenceDeclaredByActorId !== outcomeValence.declaredByActorId ||
    !sameInventory(value.decisionSubjects.map(subjectKey), outcomeValence.decisionSubjects.map(subjectKey)) ||
    value.sourceDeclarationClass !== outcomeValence.sourceDeclarationClass ||
    value.sourceActionIntentClass !== outcomeValence.sourceActionIntentClass ||
    value.operationDescription !== outcomeValence.operationDescription ||
    value.executionAuthorityScope !== outcomeValence.executionAuthorityScope ||
    value.executionTarget.targetKind !== outcomeValence.executionTarget.targetKind ||
    value.executionTarget.targetRef !== outcomeValence.executionTarget.targetRef ||
    value.executionChannel.channelKind !== outcomeValence.executionChannel.channelKind ||
    value.executionChannel.channelRef !== outcomeValence.executionChannel.channelRef ||
    value.actionOccurredAt !== outcomeValence.actionOccurredAt ||
    value.stateSubject.subjectKind !== outcomeValence.stateSubject.subjectKind ||
    value.stateSubject.subjectRef !== outcomeValence.stateSubject.subjectRef ||
    value.stateDimension !== outcomeValence.stateDimension ||
    value.beforeObservation.observationState !== outcomeValence.beforeObservation.observationState ||
    value.beforeObservation.value !== outcomeValence.beforeObservation.value ||
    value.afterObservation.observationState !== outcomeValence.afterObservation.observationState ||
    value.afterObservation.value !== outcomeValence.afterObservation.value ||
    value.observedAt !== outcomeValence.observedAt ||
    value.associationDeclaredAt !== outcomeValence.associationDeclaredAt ||
    value.outcomeRoleDeclaredAt !== outcomeValence.outcomeRoleDeclaredAt ||
    value.outcomeValenceDeclaredAt !== outcomeValence.declaredAt ||
    value.valence !== outcomeValence.valence ||
    value.admittedAt < outcomeValence.declaredAt
  ) fail();
}

async function validate(
  id: string,
  dependencies: CareerOutcomeValenceFeedbackAdmissionDeclarationReplayDependencies,
): Promise<CareerOutcomeValenceFeedbackAdmissionDeclaration> {
  const value = await stored(id, dependencies);
  try {
    // COVD semantic replay retains AOC-time authority; admission time does not reopen EAGR or DAR.
    const outcomeValence = await semanticReplayCareerOutcomeValenceDeclaration(
      value.careerOutcomeValenceDeclarationId,
      { ...dependencies, declarations: dependencies.outcomeValences },
    );
    exactOutcomeValenceRelation(value, outcomeValence);
    const {
      careerOutcomeValenceFeedbackAdmissionDeclarationId,
      createdAt: _createdAt,
      ...semantic
    } = value;
    if (
      careerOutcomeValenceFeedbackAdmissionDeclarationId !==
      deriveCareerOutcomeValenceFeedbackAdmissionDeclarationId(semantic)
    ) return fail();
    return structuredClone(value);
  } catch {
    return fail();
  }
}

/** BYTE replay reads durable admission representation without delivery or receiver authority. */
export async function byteReplayCareerOutcomeValenceFeedbackAdmissionDeclaration(
  id: string,
  dependencies: CareerOutcomeValenceFeedbackAdmissionDeclarationReplayDependencies,
) {
  return structuredClone(await stored(id, dependencies));
}

/** Semantic replay checks historical lineage without incorporating admitted feedback. */
export async function semanticReplayCareerOutcomeValenceFeedbackAdmissionDeclaration(
  id: string,
  dependencies: CareerOutcomeValenceFeedbackAdmissionDeclarationReplayDependencies,
) {
  return validate(id, dependencies);
}

/** Derivation replay checks deterministic identity only; it never regenerates an admission. */
export async function derivationReplayCareerOutcomeValenceFeedbackAdmissionDeclaration(
  id: string,
  dependencies: CareerOutcomeValenceFeedbackAdmissionDeclarationReplayDependencies,
) {
  const value = await stored(id, dependencies);
  try {
    const {
      careerOutcomeValenceFeedbackAdmissionDeclarationId,
      createdAt: _createdAt,
      ...semantic
    } = value;
    if (
      careerOutcomeValenceFeedbackAdmissionDeclarationId !==
      deriveCareerOutcomeValenceFeedbackAdmissionDeclarationId(semantic)
    ) return fail();
    return structuredClone(value);
  } catch {
    return fail();
  }
}
