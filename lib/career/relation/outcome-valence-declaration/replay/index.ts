import {
  semanticReplayCareerOutcomeRoleDeclaration,
  type CareerOutcomeRoleDeclarationReplayDependencies,
} from "../../outcome-role-declaration/replay";
import {
  assertCareerOutcomeRoleDeclaration,
  type CareerOutcomeRoleDeclaration,
} from "../../outcome-role-declaration";
import {
  assertCareerOutcomeValenceDeclaration,
  deriveCareerOutcomeValenceDeclarationId,
  type CareerOutcomeValenceDeclaration,
} from "..";

const fail = (): never => { throw new Error("ERR_CAREER_OUTCOME_VALENCE_DECLARATION_REPLAY_MISMATCH"); };
const subjectKey = (subject: {
  recommendationProposalId: string;
  sourceEvolutionInputItemOrdinal: number;
}) => `${subject.recommendationProposalId}:${String(subject.sourceEvolutionInputItemOrdinal).padStart(12, "0")}`;
const sameInventory = (left: readonly string[], right: readonly string[]) =>
  left.length === right.length && left.every((value, index) => value === right[index]);

export const CAREER_OUTCOME_VALENCE_DECLARATION_REPLAY_MODES = [
  "BYTE_REPLAY", "SEMANTIC_REPLAY", "DERIVATION_REPLAY",
] as const;

export interface CareerOutcomeValenceDeclarationReplayDependencies
  extends Omit<CareerOutcomeRoleDeclarationReplayDependencies, "declarations"> {
  declarations: {
    getCareerOutcomeValenceDeclarationById(id: string): Promise<CareerOutcomeValenceDeclaration | null>;
  };
  outcomeRoles: {
    getCareerOutcomeRoleDeclarationById(id: string): Promise<CareerOutcomeRoleDeclaration | null>;
  };
}

async function stored(
  id: string,
  dependencies: CareerOutcomeValenceDeclarationReplayDependencies,
): Promise<CareerOutcomeValenceDeclaration> {
  try {
    const value = await dependencies.declarations.getCareerOutcomeValenceDeclarationById(id);
    if (!value) throw new Error("ERR_CAREER_OUTCOME_VALENCE_DECLARATION_NOT_FOUND");
    assertCareerOutcomeValenceDeclaration(value);
    if (value.careerOutcomeValenceDeclarationId !== id) return fail();
    return value;
  } catch (error) {
    if (error instanceof Error && error.message === "ERR_CAREER_OUTCOME_VALENCE_DECLARATION_NOT_FOUND") throw error;
    return fail();
  }
}

function exactOutcomeRoleRelation(
  value: CareerOutcomeValenceDeclaration,
  outcomeRole: unknown,
): void {
  assertCareerOutcomeRoleDeclaration(outcomeRole);
  if (
    value.careerOutcomeRoleDeclarationId !== outcomeRole.careerOutcomeRoleDeclarationId ||
    value.careerActionStateChangeAssociationDeclarationId !== outcomeRole.careerActionStateChangeAssociationDeclarationId ||
    value.careerStateChangeDeclarationId !== outcomeRole.careerStateChangeDeclarationId ||
    value.careerActionOccurrenceId !== outcomeRole.careerActionOccurrenceId ||
    value.careerExecutionContextRevisionId !== outcomeRole.careerExecutionContextRevisionId ||
    value.careerExecutionAuthorityGrantRevisionId !== outcomeRole.careerExecutionAuthorityGrantRevisionId ||
    value.careerHumanCommitmentId !== outcomeRole.careerHumanCommitmentId ||
    value.careerDecisionActionIntentId !== outcomeRole.careerDecisionActionIntentId ||
    value.humanDecisionRecordId !== outcomeRole.humanDecisionRecordId ||
    value.careerDecisionContextRevisionId !== outcomeRole.careerDecisionContextRevisionId ||
    value.decisionAuthorityGrantRevisionId !== outcomeRole.decisionAuthorityGrantRevisionId ||
    value.recommendationProposalId !== outcomeRole.recommendationProposalId ||
    value.performedByActorId !== outcomeRole.performedByActorId ||
    value.observedByActorId !== outcomeRole.observedByActorId ||
    value.associationDeclaredByActorId !== outcomeRole.associationDeclaredByActorId ||
    value.outcomeRoleDeclaredByActorId !== outcomeRole.declaredByActorId ||
    !sameInventory(value.decisionSubjects.map(subjectKey), outcomeRole.decisionSubjects.map(subjectKey)) ||
    value.sourceDeclarationClass !== outcomeRole.sourceDeclarationClass ||
    value.sourceActionIntentClass !== outcomeRole.sourceActionIntentClass ||
    value.operationDescription !== outcomeRole.operationDescription ||
    value.executionAuthorityScope !== outcomeRole.executionAuthorityScope ||
    value.executionTarget.targetKind !== outcomeRole.executionTarget.targetKind ||
    value.executionTarget.targetRef !== outcomeRole.executionTarget.targetRef ||
    value.executionChannel.channelKind !== outcomeRole.executionChannel.channelKind ||
    value.executionChannel.channelRef !== outcomeRole.executionChannel.channelRef ||
    value.actionOccurredAt !== outcomeRole.actionOccurredAt ||
    value.stateSubject.subjectKind !== outcomeRole.stateSubject.subjectKind ||
    value.stateSubject.subjectRef !== outcomeRole.stateSubject.subjectRef ||
    value.stateDimension !== outcomeRole.stateDimension ||
    value.beforeObservation.observationState !== outcomeRole.beforeObservation.observationState ||
    value.beforeObservation.value !== outcomeRole.beforeObservation.value ||
    value.afterObservation.observationState !== outcomeRole.afterObservation.observationState ||
    value.afterObservation.value !== outcomeRole.afterObservation.value ||
    value.observedAt !== outcomeRole.observedAt ||
    value.associationDeclaredAt !== outcomeRole.associationDeclaredAt ||
    value.outcomeRoleDeclaredAt !== outcomeRole.declaredAt ||
    value.declaredAt < outcomeRole.declaredAt
  ) fail();
}

async function validate(
  id: string,
  dependencies: CareerOutcomeValenceDeclarationReplayDependencies,
): Promise<CareerOutcomeValenceDeclaration> {
  const value = await stored(id, dependencies);
  try {
    // CORD semantic replay preserves AOC-time authority; COVD time does not reopen EAGR or DAR.
    const outcomeRole = await semanticReplayCareerOutcomeRoleDeclaration(
      value.careerOutcomeRoleDeclarationId,
      { ...dependencies, declarations: dependencies.outcomeRoles },
    );
    exactOutcomeRoleRelation(value, outcomeRole);
    const { careerOutcomeValenceDeclarationId, createdAt: _createdAt, ...semantic } = value;
    if (careerOutcomeValenceDeclarationId !== deriveCareerOutcomeValenceDeclarationId(semantic)) return fail();
    return structuredClone(value);
  } catch {
    return fail();
  }
}

/** BYTE replay reads stored declaration representation without adding valence authority. */
export async function byteReplayCareerOutcomeValenceDeclaration(
  id: string,
  dependencies: CareerOutcomeValenceDeclarationReplayDependencies,
) {
  return structuredClone(await stored(id, dependencies));
}

/** Semantic replay checks historical lineage without inferring a valence outcome. */
export async function semanticReplayCareerOutcomeValenceDeclaration(
  id: string,
  dependencies: CareerOutcomeValenceDeclarationReplayDependencies,
) {
  return validate(id, dependencies);
}

/** Derivation replay checks deterministic COVD identity only; it never regenerates a declaration. */
export async function derivationReplayCareerOutcomeValenceDeclaration(
  id: string,
  dependencies: CareerOutcomeValenceDeclarationReplayDependencies,
) {
  const value = await stored(id, dependencies);
  try {
    const { careerOutcomeValenceDeclarationId, createdAt: _createdAt, ...semantic } = value;
    if (careerOutcomeValenceDeclarationId !== deriveCareerOutcomeValenceDeclarationId(semantic)) return fail();
    return structuredClone(value);
  } catch {
    return fail();
  }
}
