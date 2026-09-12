import {
  semanticReplayCareerStateChangeDeclaration,
  type CareerStateChangeDeclarationReplayDependencies,
} from "../../state-change-declaration/replay";
import {
  assertCareerStateChangeDeclaration,
  type CareerStateChangeDeclaration,
} from "../../state-change-declaration";
import {
  assertCareerActionStateChangeAssociationDeclaration,
  deriveCareerActionStateChangeAssociationDeclarationId,
  type CareerActionStateChangeAssociationDeclaration,
} from "..";

const fail = (): never => { throw new Error("ERR_CAREER_ACTION_STATE_CHANGE_ASSOCIATION_DECLARATION_REPLAY_MISMATCH"); };
const subjectKey = (subject: {
  recommendationProposalId: string;
  sourceEvolutionInputItemOrdinal: number;
}) => `${subject.recommendationProposalId}:${String(subject.sourceEvolutionInputItemOrdinal).padStart(12, "0")}`;
const sameInventory = (left: readonly string[], right: readonly string[]) =>
  left.length === right.length && left.every((value, index) => value === right[index]);

export interface CareerActionStateChangeAssociationDeclarationReplayDependencies
  extends Omit<CareerStateChangeDeclarationReplayDependencies, "declarations"> {
  associations: {
    getCareerActionStateChangeAssociationDeclarationById(
      id: string,
    ): Promise<CareerActionStateChangeAssociationDeclaration | null>;
  };
  stateChanges: {
    getCareerStateChangeDeclarationById(id: string): Promise<CareerStateChangeDeclaration | null>;
  };
}

async function stored(
  id: string,
  dependencies: CareerActionStateChangeAssociationDeclarationReplayDependencies,
): Promise<CareerActionStateChangeAssociationDeclaration> {
  try {
    const value = await dependencies.associations.getCareerActionStateChangeAssociationDeclarationById(id);
    if (!value) throw new Error("ERR_CAREER_ACTION_STATE_CHANGE_ASSOCIATION_DECLARATION_NOT_FOUND");
    assertCareerActionStateChangeAssociationDeclaration(value);
    if (value.careerActionStateChangeAssociationDeclarationId !== id) return fail();
    return value;
  } catch (error) {
    if (error instanceof Error && error.message === "ERR_CAREER_ACTION_STATE_CHANGE_ASSOCIATION_DECLARATION_NOT_FOUND") throw error;
    return fail();
  }
}

function exactStateChangeRelation(
  value: CareerActionStateChangeAssociationDeclaration,
  stateChange: unknown,
): void {
  assertCareerStateChangeDeclaration(stateChange);
  if (
    value.careerStateChangeDeclarationId !== stateChange.careerStateChangeDeclarationId ||
    value.careerActionOccurrenceId !== stateChange.careerActionOccurrenceId ||
    value.careerExecutionContextRevisionId !== stateChange.careerExecutionContextRevisionId ||
    value.careerExecutionAuthorityGrantRevisionId !== stateChange.careerExecutionAuthorityGrantRevisionId ||
    value.careerHumanCommitmentId !== stateChange.careerHumanCommitmentId ||
    value.careerDecisionActionIntentId !== stateChange.careerDecisionActionIntentId ||
    value.humanDecisionRecordId !== stateChange.humanDecisionRecordId ||
    value.careerDecisionContextRevisionId !== stateChange.careerDecisionContextRevisionId ||
    value.decisionAuthorityGrantRevisionId !== stateChange.decisionAuthorityGrantRevisionId ||
    value.recommendationProposalId !== stateChange.recommendationProposalId ||
    value.performedByActorId !== stateChange.performedByActorId ||
    value.observedByActorId !== stateChange.observedByActorId ||
    !sameInventory(value.decisionSubjects.map(subjectKey), stateChange.decisionSubjects.map(subjectKey)) ||
    value.sourceDeclarationClass !== stateChange.sourceDeclarationClass ||
    value.sourceActionIntentClass !== stateChange.sourceActionIntentClass ||
    value.operationDescription !== stateChange.operationDescription ||
    value.executionAuthorityScope !== stateChange.executionAuthorityScope ||
    value.executionTarget.targetKind !== stateChange.executionTarget.targetKind ||
    value.executionTarget.targetRef !== stateChange.executionTarget.targetRef ||
    value.executionChannel.channelKind !== stateChange.executionChannel.channelKind ||
    value.executionChannel.channelRef !== stateChange.executionChannel.channelRef ||
    value.actionOccurredAt !== stateChange.actionOccurredAt ||
    value.stateSubject.subjectKind !== stateChange.stateSubject.subjectKind ||
    value.stateSubject.subjectRef !== stateChange.stateSubject.subjectRef ||
    value.stateDimension !== stateChange.stateDimension ||
    value.beforeObservation.observationState !== stateChange.beforeObservation.observationState ||
    value.beforeObservation.value !== stateChange.beforeObservation.value ||
    value.afterObservation.observationState !== stateChange.afterObservation.observationState ||
    value.afterObservation.value !== stateChange.afterObservation.value ||
    value.observedAt !== stateChange.observedAt ||
    value.declaredAt < stateChange.observedAt
  ) fail();
}

async function validate(
  id: string,
  dependencies: CareerActionStateChangeAssociationDeclarationReplayDependencies,
): Promise<CareerActionStateChangeAssociationDeclaration> {
  const value = await stored(id, dependencies);
  try {
    // SCD semantic replay validates the earlier action-time authority chain.
    // ASCAD declaration time does not reopen EAGR or DAR applicability.
    const stateChange = await semanticReplayCareerStateChangeDeclaration(value.careerStateChangeDeclarationId, {
      ...dependencies,
      declarations: dependencies.stateChanges,
    });
    exactStateChangeRelation(value, stateChange);
    const { careerActionStateChangeAssociationDeclarationId, createdAt: _createdAt, ...semantic } = value;
    if (careerActionStateChangeAssociationDeclarationId !== deriveCareerActionStateChangeAssociationDeclarationId(semantic)) return fail();
    return structuredClone(value);
  } catch {
    return fail();
  }
}

/** BYTE replay reads stored declaration history only; it never traverses predecessors. */
export async function byteReplayCareerActionStateChangeAssociationDeclaration(
  id: string,
  dependencies: CareerActionStateChangeAssociationDeclarationReplayDependencies,
) {
  return structuredClone(await stored(id, dependencies));
}

/** Semantic replay proves historical integrity without asserting relation truth or effect. */
export async function semanticReplayCareerActionStateChangeAssociationDeclaration(
  id: string,
  dependencies: CareerActionStateChangeAssociationDeclarationReplayDependencies,
) {
  return validate(id, dependencies);
}

/** Derivation replay checks deterministic ASCAD identity only; it never regenerates a declaration. */
export async function derivationReplayCareerActionStateChangeAssociationDeclaration(
  id: string,
  dependencies: CareerActionStateChangeAssociationDeclarationReplayDependencies,
) {
  const value = await stored(id, dependencies);
  try {
    const { careerActionStateChangeAssociationDeclarationId, createdAt: _createdAt, ...semantic } = value;
    if (careerActionStateChangeAssociationDeclarationId !== deriveCareerActionStateChangeAssociationDeclarationId(semantic)) return fail();
    return structuredClone(value);
  } catch {
    return fail();
  }
}
