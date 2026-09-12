import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import {
  assertCareerActionStateChangeAssociationDeclaration,
  stableCareerActionStateChangeAssociationDeclaration,
  type CareerActionStateChangeAssociationDeclaration,
} from "../../relation/action-state-change-association-declaration";
import {
  assertCareerStateChangeDeclaration,
  type CareerStateChangeDeclaration,
} from "../../relation/state-change-declaration";
import {
  careerActionStateChangeAssociationDeclarationEvidenceReferences,
  careerActionStateChangeAssociationDeclarations,
  careerActionStateChangeAssociationDeclarationSubjects,
} from "./postgres-schema";

const fail = (code: string): never => { throw new Error(code); };
const same = (left: unknown, right: unknown) =>
  stableCareerActionStateChangeAssociationDeclaration(left) === stableCareerActionStateChangeAssociationDeclaration(right);
const subjectKey = (subject: {
  recommendationProposalId: string;
  sourceEvolutionInputItemOrdinal: number;
}) => `${subject.recommendationProposalId}:${String(subject.sourceEvolutionInputItemOrdinal).padStart(12, "0")}`;
const sameInventory = (left: readonly string[], right: readonly string[]) =>
  left.length === right.length && left.every((value, index) => value === right[index]);

export interface CareerActionStateChangeAssociationDeclarationRepository {
  getCareerActionStateChangeAssociationDeclarationById(
    id: string,
  ): Promise<CareerActionStateChangeAssociationDeclaration>;
  persistCareerActionStateChangeAssociationDeclaration(
    value: CareerActionStateChangeAssociationDeclaration,
  ): Promise<CareerActionStateChangeAssociationDeclaration>;
}

/** PostgreSQL preserves immutable association declarations; it does not establish relation truth. */
export class PostgresCareerActionStateChangeAssociationDeclarationRepository
  implements CareerActionStateChangeAssociationDeclarationRepository {
  constructor(
    private readonly database: PostgresJsDatabase,
    private readonly stateChanges: {
      getCareerStateChangeDeclarationById(id: string): Promise<CareerStateChangeDeclaration | null>;
    },
  ) {}

  private async existing(id: string): Promise<CareerActionStateChangeAssociationDeclaration | null> {
    const rows = await this.database.select().from(careerActionStateChangeAssociationDeclarations)
      .where(eq(careerActionStateChangeAssociationDeclarations.careerActionStateChangeAssociationDeclarationId, id)).limit(1);
    if (rows.length === 0) return null;
    const row = rows[0]; const value = row.payload;
    assertCareerActionStateChangeAssociationDeclaration(value);
    if (
      row.careerActionStateChangeAssociationDeclarationId !== id ||
      row.careerActionStateChangeAssociationDeclarationId !== value.careerActionStateChangeAssociationDeclarationId ||
      row.careerStateChangeDeclarationId !== value.careerStateChangeDeclarationId ||
      row.careerActionOccurrenceId !== value.careerActionOccurrenceId ||
      row.careerExecutionContextRevisionId !== value.careerExecutionContextRevisionId ||
      row.careerExecutionAuthorityGrantRevisionId !== value.careerExecutionAuthorityGrantRevisionId ||
      row.careerHumanCommitmentId !== value.careerHumanCommitmentId ||
      row.careerDecisionActionIntentId !== value.careerDecisionActionIntentId ||
      row.humanDecisionRecordId !== value.humanDecisionRecordId ||
      row.careerDecisionContextRevisionId !== value.careerDecisionContextRevisionId ||
      row.decisionAuthorityGrantRevisionId !== value.decisionAuthorityGrantRevisionId ||
      row.recommendationProposalId !== value.recommendationProposalId ||
      row.performedByActorId !== value.performedByActorId ||
      row.observedByActorId !== value.observedByActorId ||
      row.sourceDeclarationClass !== value.sourceDeclarationClass ||
      row.sourceActionIntentClass !== value.sourceActionIntentClass ||
      row.operationDescription !== value.operationDescription ||
      row.executionAuthorityScope !== value.executionAuthorityScope ||
      row.executionTargetKind !== value.executionTarget.targetKind ||
      row.executionTargetRef !== value.executionTarget.targetRef ||
      row.executionChannelKind !== value.executionChannel.channelKind ||
      row.executionChannelRef !== value.executionChannel.channelRef ||
      row.actionOccurredAt !== value.actionOccurredAt ||
      row.stateSubjectKind !== value.stateSubject.subjectKind ||
      row.stateSubjectRef !== value.stateSubject.subjectRef ||
      row.stateDimension !== value.stateDimension ||
      row.beforeObservationState !== value.beforeObservation.observationState ||
      row.beforeObservationValue !== value.beforeObservation.value ||
      row.afterObservationState !== value.afterObservation.observationState ||
      row.afterObservationValue !== value.afterObservation.value ||
      row.observedAt !== value.observedAt ||
      row.declaredByActorId !== value.declaredByActorId ||
      row.declaredAt !== value.declaredAt ||
      row.schemaVersion !== value.schemaVersion ||
      row.createdAt !== value.createdAt
    ) fail("ERR_CAREER_ACTION_STATE_CHANGE_ASSOCIATION_DECLARATION_PERSISTENCE_FAILED");
    const [subjectRows, evidenceRows] = await Promise.all([
      this.database.select().from(careerActionStateChangeAssociationDeclarationSubjects)
        .where(eq(careerActionStateChangeAssociationDeclarationSubjects.careerActionStateChangeAssociationDeclarationId, id)),
      this.database.select().from(careerActionStateChangeAssociationDeclarationEvidenceReferences)
        .where(eq(careerActionStateChangeAssociationDeclarationEvidenceReferences.careerActionStateChangeAssociationDeclarationId, id)),
    ]);
    if (
      !sameInventory(value.decisionSubjects.map(subjectKey), subjectRows.map(subjectKey).sort()) ||
      !sameInventory(value.associationEvidenceRefs, evidenceRows.map(item => item.evidenceRef).sort())
    ) fail("ERR_CAREER_ACTION_STATE_CHANGE_ASSOCIATION_DECLARATION_PERSISTENCE_FAILED");
    await this.assertStateChangeRelation(value);
    return structuredClone(value);
  }

  private async assertStateChangeRelation(value: CareerActionStateChangeAssociationDeclaration): Promise<void> {
    const stateChange = await this.stateChanges.getCareerStateChangeDeclarationById(value.careerStateChangeDeclarationId);
    if (!stateChange) fail("ERR_CAREER_ACTION_STATE_CHANGE_ASSOCIATION_DECLARATION_PERSISTENCE_FAILED");
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
    ) fail("ERR_CAREER_ACTION_STATE_CHANGE_ASSOCIATION_DECLARATION_PERSISTENCE_FAILED");
  }

  async getCareerActionStateChangeAssociationDeclarationById(
    id: string,
  ): Promise<CareerActionStateChangeAssociationDeclaration> {
    try {
      const value = await this.existing(id);
      if (!value) fail("ERR_CAREER_ACTION_STATE_CHANGE_ASSOCIATION_DECLARATION_NOT_FOUND");
      return value;
    } catch (error) {
      if (error instanceof Error && error.message === "ERR_CAREER_ACTION_STATE_CHANGE_ASSOCIATION_DECLARATION_NOT_FOUND") throw error;
      return fail("ERR_CAREER_ACTION_STATE_CHANGE_ASSOCIATION_DECLARATION_PERSISTENCE_FAILED");
    }
  }

  async persistCareerActionStateChangeAssociationDeclaration(
    value: CareerActionStateChangeAssociationDeclaration,
  ): Promise<CareerActionStateChangeAssociationDeclaration> {
    const id = value && typeof value === "object"
      ? (value as { careerActionStateChangeAssociationDeclarationId?: unknown }).careerActionStateChangeAssociationDeclarationId : undefined;
    if (typeof id === "string") {
      try {
        const stored = await this.existing(id);
        if (stored) {
          if (!same(stored, value)) fail("ERR_CAREER_ACTION_STATE_CHANGE_ASSOCIATION_DECLARATION_IMMUTABLE_CONFLICT");
          return stored;
        }
      } catch (error) {
        if (error instanceof Error && error.message === "ERR_CAREER_ACTION_STATE_CHANGE_ASSOCIATION_DECLARATION_IMMUTABLE_CONFLICT") throw error;
        return fail("ERR_CAREER_ACTION_STATE_CHANGE_ASSOCIATION_DECLARATION_PERSISTENCE_FAILED");
      }
    }
    assertCareerActionStateChangeAssociationDeclaration(value);
    try { await this.assertStateChangeRelation(value); } catch {
      return fail("ERR_CAREER_ACTION_STATE_CHANGE_ASSOCIATION_DECLARATION_PERSISTENCE_FAILED");
    }
    try {
      await this.database.transaction(async transaction => {
        await transaction.insert(careerActionStateChangeAssociationDeclarations).values({
          careerActionStateChangeAssociationDeclarationId: value.careerActionStateChangeAssociationDeclarationId,
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
          sourceDeclarationClass: value.sourceDeclarationClass,
          sourceActionIntentClass: value.sourceActionIntentClass,
          operationDescription: value.operationDescription,
          executionAuthorityScope: value.executionAuthorityScope,
          executionTargetKind: value.executionTarget.targetKind,
          executionTargetRef: value.executionTarget.targetRef,
          executionChannelKind: value.executionChannel.channelKind,
          executionChannelRef: value.executionChannel.channelRef,
          actionOccurredAt: value.actionOccurredAt,
          stateSubjectKind: value.stateSubject.subjectKind,
          stateSubjectRef: value.stateSubject.subjectRef,
          stateDimension: value.stateDimension,
          beforeObservationState: value.beforeObservation.observationState,
          beforeObservationValue: value.beforeObservation.value,
          afterObservationState: value.afterObservation.observationState,
          afterObservationValue: value.afterObservation.value,
          observedAt: value.observedAt,
          declaredByActorId: value.declaredByActorId,
          declaredAt: value.declaredAt,
          schemaVersion: value.schemaVersion,
          createdAt: value.createdAt,
          payload: structuredClone(value),
        }).onConflictDoNothing();
        for (const subject of value.decisionSubjects) await transaction.insert(careerActionStateChangeAssociationDeclarationSubjects).values({
          referenceId: `${value.careerActionStateChangeAssociationDeclarationId}:subject:${subjectKey(subject)}`,
          careerActionStateChangeAssociationDeclarationId: value.careerActionStateChangeAssociationDeclarationId,
          recommendationProposalId: subject.recommendationProposalId,
          sourceEvolutionInputItemOrdinal: subject.sourceEvolutionInputItemOrdinal,
        }).onConflictDoNothing();
        for (const evidenceRef of value.associationEvidenceRefs) await transaction.insert(careerActionStateChangeAssociationDeclarationEvidenceReferences).values({
          referenceId: `${value.careerActionStateChangeAssociationDeclarationId}:evidence:${evidenceRef}`,
          careerActionStateChangeAssociationDeclarationId: value.careerActionStateChangeAssociationDeclarationId,
          evidenceRef,
        }).onConflictDoNothing();
      });
    } catch {
      return fail("ERR_CAREER_ACTION_STATE_CHANGE_ASSOCIATION_DECLARATION_PERSISTENCE_FAILED");
    }
    let reread: CareerActionStateChangeAssociationDeclaration;
    try { reread = await this.getCareerActionStateChangeAssociationDeclarationById(value.careerActionStateChangeAssociationDeclarationId); } catch {
      return fail("ERR_CAREER_ACTION_STATE_CHANGE_ASSOCIATION_DECLARATION_PERSISTENCE_FAILED");
    }
    if (!same(reread, value)) fail("ERR_CAREER_ACTION_STATE_CHANGE_ASSOCIATION_DECLARATION_PERSISTENCE_FAILED");
    return reread;
  }
}
