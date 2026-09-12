import {
  semanticReplayCareerActionStateChangeAssociationDeclaration,
  type CareerActionStateChangeAssociationDeclarationReplayDependencies,
} from "../../action-state-change-association-declaration/replay";
import {
  assertCareerActionStateChangeAssociationDeclaration,
  type CareerActionStateChangeAssociationDeclaration,
} from "../../action-state-change-association-declaration";
import {
  assertCareerOutcomeRoleDeclaration,
  deriveCareerOutcomeRoleDeclarationId,
  type CareerOutcomeRoleDeclaration,
} from "..";

const fail = (): never => { throw new Error("ERR_CAREER_OUTCOME_ROLE_DECLARATION_REPLAY_MISMATCH"); };
const subjectKey = (subject: {
  recommendationProposalId: string;
  sourceEvolutionInputItemOrdinal: number;
}) => `${subject.recommendationProposalId}:${String(subject.sourceEvolutionInputItemOrdinal).padStart(12, "0")}`;
const sameInventory = (left: readonly string[], right: readonly string[]) =>
  left.length === right.length && left.every((value, index) => value === right[index]);

export interface CareerOutcomeRoleDeclarationReplayDependencies
  extends Omit<CareerActionStateChangeAssociationDeclarationReplayDependencies, "associations"> {
  declarations: {
    getCareerOutcomeRoleDeclarationById(id: string): Promise<CareerOutcomeRoleDeclaration | null>;
  };
  associations: {
    getCareerActionStateChangeAssociationDeclarationById(
      id: string,
    ): Promise<CareerActionStateChangeAssociationDeclaration | null>;
  };
}

async function stored(
  id: string,
  dependencies: CareerOutcomeRoleDeclarationReplayDependencies,
): Promise<CareerOutcomeRoleDeclaration> {
  try {
    const value = await dependencies.declarations.getCareerOutcomeRoleDeclarationById(id);
    if (!value) throw new Error("ERR_CAREER_OUTCOME_ROLE_DECLARATION_NOT_FOUND");
    assertCareerOutcomeRoleDeclaration(value);
    if (value.careerOutcomeRoleDeclarationId !== id) return fail();
    return value;
  } catch (error) {
    if (error instanceof Error && error.message === "ERR_CAREER_OUTCOME_ROLE_DECLARATION_NOT_FOUND") throw error;
    return fail();
  }
}

function exactAssociationRelation(
  value: CareerOutcomeRoleDeclaration,
  association: unknown,
): void {
  assertCareerActionStateChangeAssociationDeclaration(association);
  if (
    value.careerActionStateChangeAssociationDeclarationId !== association.careerActionStateChangeAssociationDeclarationId ||
    value.careerStateChangeDeclarationId !== association.careerStateChangeDeclarationId ||
    value.careerActionOccurrenceId !== association.careerActionOccurrenceId ||
    value.careerExecutionContextRevisionId !== association.careerExecutionContextRevisionId ||
    value.careerExecutionAuthorityGrantRevisionId !== association.careerExecutionAuthorityGrantRevisionId ||
    value.careerHumanCommitmentId !== association.careerHumanCommitmentId ||
    value.careerDecisionActionIntentId !== association.careerDecisionActionIntentId ||
    value.humanDecisionRecordId !== association.humanDecisionRecordId ||
    value.careerDecisionContextRevisionId !== association.careerDecisionContextRevisionId ||
    value.decisionAuthorityGrantRevisionId !== association.decisionAuthorityGrantRevisionId ||
    value.recommendationProposalId !== association.recommendationProposalId ||
    value.performedByActorId !== association.performedByActorId ||
    value.observedByActorId !== association.observedByActorId ||
    value.associationDeclaredByActorId !== association.declaredByActorId ||
    !sameInventory(value.decisionSubjects.map(subjectKey), association.decisionSubjects.map(subjectKey)) ||
    value.sourceDeclarationClass !== association.sourceDeclarationClass ||
    value.sourceActionIntentClass !== association.sourceActionIntentClass ||
    value.operationDescription !== association.operationDescription ||
    value.executionAuthorityScope !== association.executionAuthorityScope ||
    value.executionTarget.targetKind !== association.executionTarget.targetKind ||
    value.executionTarget.targetRef !== association.executionTarget.targetRef ||
    value.executionChannel.channelKind !== association.executionChannel.channelKind ||
    value.executionChannel.channelRef !== association.executionChannel.channelRef ||
    value.actionOccurredAt !== association.actionOccurredAt ||
    value.stateSubject.subjectKind !== association.stateSubject.subjectKind ||
    value.stateSubject.subjectRef !== association.stateSubject.subjectRef ||
    value.stateDimension !== association.stateDimension ||
    value.beforeObservation.observationState !== association.beforeObservation.observationState ||
    value.beforeObservation.value !== association.beforeObservation.value ||
    value.afterObservation.observationState !== association.afterObservation.observationState ||
    value.afterObservation.value !== association.afterObservation.value ||
    value.observedAt !== association.observedAt ||
    value.associationDeclaredAt !== association.declaredAt ||
    value.declaredAt < association.declaredAt
  ) fail();
}

async function validate(
  id: string,
  dependencies: CareerOutcomeRoleDeclarationReplayDependencies,
): Promise<CareerOutcomeRoleDeclaration> {
  const value = await stored(id, dependencies);
  try {
    // ASCAD semantic replay preserves the earlier AOC-time authority law.
    // CORD declaration time does not reopen EAGR or DAR applicability.
    const association = await semanticReplayCareerActionStateChangeAssociationDeclaration(
      value.careerActionStateChangeAssociationDeclarationId,
      dependencies,
    );
    exactAssociationRelation(value, association);
    const { careerOutcomeRoleDeclarationId, createdAt: _createdAt, ...semantic } = value;
    if (careerOutcomeRoleDeclarationId !== deriveCareerOutcomeRoleDeclarationId(semantic)) return fail();
    return structuredClone(value);
  } catch {
    return fail();
  }
}

/** BYTE replay reads a stored declaration without adding outcome authority. */
export async function byteReplayCareerOutcomeRoleDeclaration(
  id: string,
  dependencies: CareerOutcomeRoleDeclarationReplayDependencies,
) {
  return structuredClone(await stored(id, dependencies));
}

/** Semantic replay checks historical integrity without asserting outcome truth or effect. */
export async function semanticReplayCareerOutcomeRoleDeclaration(
  id: string,
  dependencies: CareerOutcomeRoleDeclarationReplayDependencies,
) {
  return validate(id, dependencies);
}

/** Derivation replay checks deterministic CORD identity only; it never regenerates a declaration. */
export async function derivationReplayCareerOutcomeRoleDeclaration(
  id: string,
  dependencies: CareerOutcomeRoleDeclarationReplayDependencies,
) {
  const value = await stored(id, dependencies);
  try {
    const { careerOutcomeRoleDeclarationId, createdAt: _createdAt, ...semantic } = value;
    if (careerOutcomeRoleDeclarationId !== deriveCareerOutcomeRoleDeclarationId(semantic)) return fail();
    return structuredClone(value);
  } catch {
    return fail();
  }
}
