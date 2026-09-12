import {
  semanticReplayCareerActionOccurrence,
  type CareerActionOccurrenceReplayDependencies,
} from "../../action-occurrence/replay";
import { assertCareerActionOccurrence } from "../../action-occurrence";
import {
  assertCareerStateChangeDeclaration,
  deriveCareerStateChangeDeclarationId,
  type CareerStateChangeDeclaration,
} from "..";

const fail = (): never => { throw new Error("ERR_CAREER_STATE_CHANGE_DECLARATION_REPLAY_MISMATCH"); };
const subjectKey = (subject: {
  recommendationProposalId: string;
  sourceEvolutionInputItemOrdinal: number;
}) => `${subject.recommendationProposalId}:${String(subject.sourceEvolutionInputItemOrdinal).padStart(12, "0")}`;
const sameInventory = (left: readonly string[], right: readonly string[]) =>
  left.length === right.length && left.every((value, index) => value === right[index]);

export interface CareerStateChangeDeclarationReplayDependencies extends CareerActionOccurrenceReplayDependencies {
  declarations: {
    getCareerStateChangeDeclarationById(id: string): Promise<CareerStateChangeDeclaration | null>;
  };
}

async function stored(
  id: string,
  dependencies: CareerStateChangeDeclarationReplayDependencies,
): Promise<CareerStateChangeDeclaration> {
  try {
    const value = await dependencies.declarations.getCareerStateChangeDeclarationById(id);
    if (!value) throw new Error("ERR_CAREER_STATE_CHANGE_DECLARATION_NOT_FOUND");
    assertCareerStateChangeDeclaration(value);
    if (value.careerStateChangeDeclarationId !== id) return fail();
    return value;
  } catch (error) {
    if (error instanceof Error && error.message === "ERR_CAREER_STATE_CHANGE_DECLARATION_NOT_FOUND") throw error;
    return fail();
  }
}

function exactActionRelation(value: CareerStateChangeDeclaration, occurrence: unknown): void {
  assertCareerActionOccurrence(occurrence);
  if (
    value.careerActionOccurrenceId !== occurrence.careerActionOccurrenceId ||
    value.careerExecutionContextRevisionId !== occurrence.careerExecutionContextRevisionId ||
    value.careerExecutionAuthorityGrantRevisionId !== occurrence.careerExecutionAuthorityGrantRevisionId ||
    value.careerHumanCommitmentId !== occurrence.careerHumanCommitmentId ||
    value.careerDecisionActionIntentId !== occurrence.careerDecisionActionIntentId ||
    value.humanDecisionRecordId !== occurrence.humanDecisionRecordId ||
    value.careerDecisionContextRevisionId !== occurrence.careerDecisionContextRevisionId ||
    value.decisionAuthorityGrantRevisionId !== occurrence.decisionAuthorityGrantRevisionId ||
    value.recommendationProposalId !== occurrence.recommendationProposalId ||
    value.performedByActorId !== occurrence.performedByActorId ||
    !sameInventory(value.decisionSubjects.map(subjectKey), occurrence.decisionSubjects.map(subjectKey)) ||
    value.sourceDeclarationClass !== occurrence.sourceDeclarationClass ||
    value.sourceActionIntentClass !== occurrence.sourceActionIntentClass ||
    value.operationDescription !== occurrence.operationDescription ||
    value.executionAuthorityScope !== occurrence.executionAuthorityScope ||
    value.executionTarget.targetKind !== occurrence.executionTarget.targetKind ||
    value.executionTarget.targetRef !== occurrence.executionTarget.targetRef ||
    value.executionChannel.channelKind !== occurrence.executionChannel.channelKind ||
    value.executionChannel.channelRef !== occurrence.executionChannel.channelRef ||
    value.actionOccurredAt !== occurrence.occurredAt ||
    value.observedAt < occurrence.occurredAt
  ) fail();
}

async function validate(
  id: string,
  dependencies: CareerStateChangeDeclarationReplayDependencies,
): Promise<CareerStateChangeDeclaration> {
  const value = await stored(id, dependencies);
  try {
    // T12E semantic replay proves the complete predecessor chain and evaluates
    // EAGR only at AOC occurredAt. SCD observation time never reopens that law.
    const occurrence = await semanticReplayCareerActionOccurrence(value.careerActionOccurrenceId, dependencies);
    exactActionRelation(value, occurrence);
    const { careerStateChangeDeclarationId, createdAt: _createdAt, ...semantic } = value;
    if (careerStateChangeDeclarationId !== deriveCareerStateChangeDeclarationId(semantic)) return fail();
    return structuredClone(value);
  } catch {
    return fail();
  }
}

/** BYTE replay reads the stored declaration only; it never traverses action history. */
export async function byteReplayCareerStateChangeDeclaration(
  id: string,
  dependencies: CareerStateChangeDeclarationReplayDependencies,
) {
  return structuredClone(await stored(id, dependencies));
}

/** Semantic replay validates historical integrity without elevating a declaration to external truth. */
export async function semanticReplayCareerStateChangeDeclaration(
  id: string,
  dependencies: CareerStateChangeDeclarationReplayDependencies,
) {
  return validate(id, dependencies);
}

/** Derivation replay checks deterministic SCD identity only; missing declarations stay missing. */
export async function derivationReplayCareerStateChangeDeclaration(
  id: string,
  dependencies: CareerStateChangeDeclarationReplayDependencies,
) {
  const value = await stored(id, dependencies);
  try {
    const { careerStateChangeDeclarationId, createdAt: _createdAt, ...semantic } = value;
    if (careerStateChangeDeclarationId !== deriveCareerStateChangeDeclarationId(semantic)) return fail();
    return structuredClone(value);
  } catch {
    return fail();
  }
}
