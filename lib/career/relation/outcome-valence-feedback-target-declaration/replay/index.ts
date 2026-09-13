import {
  semanticReplayCareerOutcomeValenceFeedbackAdmissionDeclaration,
  type CareerOutcomeValenceFeedbackAdmissionDeclarationReplayDependencies,
} from "../../outcome-valence-feedback-admission-declaration/replay";
import {
  assertCareerOutcomeValenceFeedbackAdmissionDeclaration,
  type CareerOutcomeValenceFeedbackAdmissionDeclaration,
} from "../../outcome-valence-feedback-admission-declaration";
import {
  assertCareerOutcomeValenceFeedbackTargetDeclaration,
  deriveCareerOutcomeValenceFeedbackTargetDeclarationId,
  type CareerOutcomeValenceFeedbackTargetDeclaration,
} from "..";

const notFound = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_DECLARATION_NOT_FOUND";
const fail = (): never => {
  throw new Error("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_DECLARATION_REPLAY_MISMATCH");
};
const subjectKey = (subject: {
  recommendationProposalId: string;
  sourceEvolutionInputItemOrdinal: number;
}) => `${subject.recommendationProposalId}:${String(subject.sourceEvolutionInputItemOrdinal).padStart(12, "0")}`;
const sameInventory = (left: readonly string[], right: readonly string[]) =>
  left.length === right.length && left.every((value, index) => value === right[index]);

export const CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_DECLARATION_REPLAY_MODES = [
  "BYTE_REPLAY", "SEMANTIC_REPLAY", "DERIVATION_REPLAY",
] as const;

export interface CareerOutcomeValenceFeedbackTargetDeclarationReplayDependencies
extends Omit<CareerOutcomeValenceFeedbackAdmissionDeclarationReplayDependencies, "admissions"> {
  targets: {
    getCareerOutcomeValenceFeedbackTargetDeclarationById(
      id: string,
    ): Promise<CareerOutcomeValenceFeedbackTargetDeclaration | null>;
  };
  admissions: {
    getCareerOutcomeValenceFeedbackAdmissionDeclarationById(
      id: string,
    ): Promise<CareerOutcomeValenceFeedbackAdmissionDeclaration | null>;
  };
}

async function stored(
  id: string,
  dependencies: CareerOutcomeValenceFeedbackTargetDeclarationReplayDependencies,
): Promise<CareerOutcomeValenceFeedbackTargetDeclaration> {
  try {
    const value = await dependencies.targets
      .getCareerOutcomeValenceFeedbackTargetDeclarationById(id);
    if (!value) throw new Error(notFound);
    assertCareerOutcomeValenceFeedbackTargetDeclaration(value);
    if (value.careerOutcomeValenceFeedbackTargetDeclarationId !== id) return fail();
    return value;
  } catch (error) {
    if (error instanceof Error && error.message === notFound) throw error;
    return fail();
  }
}

function exactAdmissionRelation(
  value: CareerOutcomeValenceFeedbackTargetDeclaration,
  admission: unknown,
): void {
  assertCareerOutcomeValenceFeedbackAdmissionDeclaration(admission);
  const targetWitness = {
    careerOutcomeValenceFeedbackAdmissionDeclarationId:
      value.careerOutcomeValenceFeedbackAdmissionDeclarationId,
    careerOutcomeValenceDeclarationId: value.careerOutcomeValenceDeclarationId,
    careerOutcomeRoleDeclarationId: value.careerOutcomeRoleDeclarationId,
    careerActionStateChangeAssociationDeclarationId:
      value.careerActionStateChangeAssociationDeclarationId,
    careerStateChangeDeclarationId: value.careerStateChangeDeclarationId,
    careerActionOccurrenceId: value.careerActionOccurrenceId,
    careerExecutionContextRevisionId: value.careerExecutionContextRevisionId,
    careerExecutionAuthorityGrantRevisionId: value.careerExecutionAuthorityGrantRevisionId,
    careerHumanCommitmentId: value.careerHumanCommitmentId,
    careerDecisionActionIntentId: value.careerDecisionActionIntentId,
    humanDecisionRecordId: value.humanDecisionRecordId,
    careerDecisionContextRevisionId: value.careerDecisionContextRevisionId,
    decisionAuthorityGrantRevisionId: value.decisionAuthorityGrantRevisionId,
    recommendationProposalId: value.recommendationProposalId,
    performedByActorId: value.performedByActorId,
    observedByActorId: value.observedByActorId,
    associationDeclaredByActorId: value.associationDeclaredByActorId,
    outcomeRoleDeclaredByActorId: value.outcomeRoleDeclaredByActorId,
    outcomeValenceDeclaredByActorId: value.outcomeValenceDeclaredByActorId,
    sourceDeclarationClass: value.sourceDeclarationClass,
    sourceActionIntentClass: value.sourceActionIntentClass,
    operationDescription: value.operationDescription,
    executionAuthorityScope: value.executionAuthorityScope,
    executionTarget: value.executionTarget,
    executionChannel: value.executionChannel,
    actionOccurredAt: value.actionOccurredAt,
    stateSubject: value.stateSubject,
    stateDimension: value.stateDimension,
    beforeObservation: value.beforeObservation,
    afterObservation: value.afterObservation,
    observedAt: value.observedAt,
    associationDeclaredAt: value.associationDeclaredAt,
    outcomeRoleDeclaredAt: value.outcomeRoleDeclaredAt,
    outcomeValenceDeclaredAt: value.outcomeValenceDeclaredAt,
    valence: value.valence,
    admittedByActorId: value.admittedByActorId,
    admittedAt: value.admittedAt,
    admissionState: value.admissionState,
  };
  const admissionWitness = {
    careerOutcomeValenceFeedbackAdmissionDeclarationId:
      admission.careerOutcomeValenceFeedbackAdmissionDeclarationId,
    careerOutcomeValenceDeclarationId: admission.careerOutcomeValenceDeclarationId,
    careerOutcomeRoleDeclarationId: admission.careerOutcomeRoleDeclarationId,
    careerActionStateChangeAssociationDeclarationId:
      admission.careerActionStateChangeAssociationDeclarationId,
    careerStateChangeDeclarationId: admission.careerStateChangeDeclarationId,
    careerActionOccurrenceId: admission.careerActionOccurrenceId,
    careerExecutionContextRevisionId: admission.careerExecutionContextRevisionId,
    careerExecutionAuthorityGrantRevisionId: admission.careerExecutionAuthorityGrantRevisionId,
    careerHumanCommitmentId: admission.careerHumanCommitmentId,
    careerDecisionActionIntentId: admission.careerDecisionActionIntentId,
    humanDecisionRecordId: admission.humanDecisionRecordId,
    careerDecisionContextRevisionId: admission.careerDecisionContextRevisionId,
    decisionAuthorityGrantRevisionId: admission.decisionAuthorityGrantRevisionId,
    recommendationProposalId: admission.recommendationProposalId,
    performedByActorId: admission.performedByActorId,
    observedByActorId: admission.observedByActorId,
    associationDeclaredByActorId: admission.associationDeclaredByActorId,
    outcomeRoleDeclaredByActorId: admission.outcomeRoleDeclaredByActorId,
    outcomeValenceDeclaredByActorId: admission.outcomeValenceDeclaredByActorId,
    sourceDeclarationClass: admission.sourceDeclarationClass,
    sourceActionIntentClass: admission.sourceActionIntentClass,
    operationDescription: admission.operationDescription,
    executionAuthorityScope: admission.executionAuthorityScope,
    executionTarget: admission.executionTarget,
    executionChannel: admission.executionChannel,
    actionOccurredAt: admission.actionOccurredAt,
    stateSubject: admission.stateSubject,
    stateDimension: admission.stateDimension,
    beforeObservation: admission.beforeObservation,
    afterObservation: admission.afterObservation,
    observedAt: admission.observedAt,
    associationDeclaredAt: admission.associationDeclaredAt,
    outcomeRoleDeclaredAt: admission.outcomeRoleDeclaredAt,
    outcomeValenceDeclaredAt: admission.outcomeValenceDeclaredAt,
    valence: admission.valence,
    admittedByActorId: admission.admittedByActorId,
    admittedAt: admission.admittedAt,
    admissionState: admission.admissionState,
  };
  if (
    JSON.stringify(targetWitness) !== JSON.stringify(admissionWitness) ||
    !sameInventory(value.decisionSubjects.map(subjectKey), admission.decisionSubjects.map(subjectKey)) ||
    value.declaredAt < admission.admittedAt
  ) fail();
}

async function validate(
  id: string,
  dependencies: CareerOutcomeValenceFeedbackTargetDeclarationReplayDependencies,
): Promise<CareerOutcomeValenceFeedbackTargetDeclaration> {
  const value = await stored(id, dependencies);
  try {
    const admission = await semanticReplayCareerOutcomeValenceFeedbackAdmissionDeclaration(
      value.careerOutcomeValenceFeedbackAdmissionDeclarationId,
      { ...dependencies, admissions: dependencies.admissions },
    );
    exactAdmissionRelation(value, admission);
    const {
      careerOutcomeValenceFeedbackTargetDeclarationId,
      createdAt: _createdAt,
      ...semantic
    } = value;
    if (
      careerOutcomeValenceFeedbackTargetDeclarationId !==
      deriveCareerOutcomeValenceFeedbackTargetDeclarationId(semantic)
    ) return fail();
    return structuredClone(value);
  } catch {
    return fail();
  }
}

/** BYTE replay reads durable target declaration representation without target binding authority. */
export async function byteReplayCareerOutcomeValenceFeedbackTargetDeclaration(
  id: string,
  dependencies: CareerOutcomeValenceFeedbackTargetDeclarationReplayDependencies,
) {
  return structuredClone(await stored(id, dependencies));
}

/** Semantic replay checks retained history without traversing the prospective target reference. */
export async function semanticReplayCareerOutcomeValenceFeedbackTargetDeclaration(
  id: string,
  dependencies: CareerOutcomeValenceFeedbackTargetDeclarationReplayDependencies,
) {
  return validate(id, dependencies);
}

/** Derivation replay checks deterministic identity only; it never binds or regenerates a target. */
export async function derivationReplayCareerOutcomeValenceFeedbackTargetDeclaration(
  id: string,
  dependencies: CareerOutcomeValenceFeedbackTargetDeclarationReplayDependencies,
) {
  const value = await stored(id, dependencies);
  try {
    const {
      careerOutcomeValenceFeedbackTargetDeclarationId,
      createdAt: _createdAt,
      ...semantic
    } = value;
    if (
      careerOutcomeValenceFeedbackTargetDeclarationId !==
      deriveCareerOutcomeValenceFeedbackTargetDeclarationId(semantic)
    ) return fail();
    return structuredClone(value);
  } catch {
    return fail();
  }
}
