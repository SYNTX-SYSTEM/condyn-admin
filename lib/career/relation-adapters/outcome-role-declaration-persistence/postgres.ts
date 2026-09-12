import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import {
  assertCareerActionStateChangeAssociationDeclaration,
  type CareerActionStateChangeAssociationDeclaration,
} from "../../relation/action-state-change-association-declaration";
import {
  assertCareerOutcomeRoleDeclaration,
  stableCareerOutcomeRoleDeclaration,
  type CareerOutcomeRoleDeclaration,
} from "../../relation/outcome-role-declaration";
import {
  careerOutcomeRoleDeclarationEvidenceReferences,
  careerOutcomeRoleDeclarations,
  careerOutcomeRoleDeclarationSubjects,
} from "./postgres-schema";

const fail = (code: string): never => { throw new Error(code); };
const same = (left: unknown, right: unknown) =>
  stableCareerOutcomeRoleDeclaration(left) === stableCareerOutcomeRoleDeclaration(right);
const subjectKey = (subject: {
  recommendationProposalId: string;
  sourceEvolutionInputItemOrdinal: number;
}) => `${subject.recommendationProposalId}:${String(subject.sourceEvolutionInputItemOrdinal).padStart(12, "0")}`;
const sameInventory = (left: readonly string[], right: readonly string[]) =>
  left.length === right.length && left.every((value, index) => value === right[index]);

export interface CareerOutcomeRoleDeclarationRepository {
  getCareerOutcomeRoleDeclarationById(id: string): Promise<CareerOutcomeRoleDeclaration>;
  persistCareerOutcomeRoleDeclaration(value: CareerOutcomeRoleDeclaration): Promise<CareerOutcomeRoleDeclaration>;
}

/** PostgreSQL preserves immutable declarations; it is not an outcome truth authority. */
export class PostgresCareerOutcomeRoleDeclarationRepository implements CareerOutcomeRoleDeclarationRepository {
  constructor(
    private readonly database: PostgresJsDatabase,
    private readonly associations: {
      getCareerActionStateChangeAssociationDeclarationById(
        id: string,
      ): Promise<CareerActionStateChangeAssociationDeclaration | null>;
    },
  ) {}

  private async existing(id: string): Promise<CareerOutcomeRoleDeclaration | null> {
    const rows = await this.database.select().from(careerOutcomeRoleDeclarations)
      .where(eq(careerOutcomeRoleDeclarations.careerOutcomeRoleDeclarationId, id)).limit(1);
    if (rows.length === 0) return null;
    const row = rows[0]; const value = row.payload;
    assertCareerOutcomeRoleDeclaration(value);
    if (
      row.careerOutcomeRoleDeclarationId !== id ||
      row.careerOutcomeRoleDeclarationId !== value.careerOutcomeRoleDeclarationId ||
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
      row.associationDeclaredByActorId !== value.associationDeclaredByActorId ||
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
      row.associationDeclaredAt !== value.associationDeclaredAt ||
      row.declaredByActorId !== value.declaredByActorId ||
      row.declaredAt !== value.declaredAt ||
      row.schemaVersion !== value.schemaVersion ||
      row.createdAt !== value.createdAt
    ) fail("ERR_CAREER_OUTCOME_ROLE_DECLARATION_PERSISTENCE_FAILED");
    const [subjectRows, evidenceRows] = await Promise.all([
      this.database.select().from(careerOutcomeRoleDeclarationSubjects)
        .where(eq(careerOutcomeRoleDeclarationSubjects.careerOutcomeRoleDeclarationId, id)),
      this.database.select().from(careerOutcomeRoleDeclarationEvidenceReferences)
        .where(eq(careerOutcomeRoleDeclarationEvidenceReferences.careerOutcomeRoleDeclarationId, id)),
    ]);
    if (
      !sameInventory(value.decisionSubjects.map(subjectKey), subjectRows.map(subjectKey).sort()) ||
      !sameInventory(value.outcomeRoleEvidenceRefs, evidenceRows.map(item => item.evidenceRef).sort())
    ) fail("ERR_CAREER_OUTCOME_ROLE_DECLARATION_PERSISTENCE_FAILED");
    await this.assertAssociationRelation(value);
    return structuredClone(value);
  }

  private async assertAssociationRelation(value: CareerOutcomeRoleDeclaration): Promise<void> {
    const association = await this.associations.getCareerActionStateChangeAssociationDeclarationById(
      value.careerActionStateChangeAssociationDeclarationId,
    );
    if (!association) fail("ERR_CAREER_OUTCOME_ROLE_DECLARATION_PERSISTENCE_FAILED");
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
    ) fail("ERR_CAREER_OUTCOME_ROLE_DECLARATION_PERSISTENCE_FAILED");
  }

  async getCareerOutcomeRoleDeclarationById(id: string): Promise<CareerOutcomeRoleDeclaration> {
    try {
      const value = await this.existing(id);
      if (!value) fail("ERR_CAREER_OUTCOME_ROLE_DECLARATION_NOT_FOUND");
      return value;
    } catch (error) {
      if (error instanceof Error && error.message === "ERR_CAREER_OUTCOME_ROLE_DECLARATION_NOT_FOUND") throw error;
      return fail("ERR_CAREER_OUTCOME_ROLE_DECLARATION_PERSISTENCE_FAILED");
    }
  }

  async persistCareerOutcomeRoleDeclaration(value: CareerOutcomeRoleDeclaration): Promise<CareerOutcomeRoleDeclaration> {
    const id = value && typeof value === "object"
      ? (value as { careerOutcomeRoleDeclarationId?: unknown }).careerOutcomeRoleDeclarationId : undefined;
    if (typeof id === "string") {
      try {
        const stored = await this.existing(id);
        if (stored) {
          if (!same(stored, value)) fail("ERR_CAREER_OUTCOME_ROLE_DECLARATION_IMMUTABLE_CONFLICT");
          return stored;
        }
      } catch (error) {
        if (error instanceof Error && error.message === "ERR_CAREER_OUTCOME_ROLE_DECLARATION_IMMUTABLE_CONFLICT") throw error;
        return fail("ERR_CAREER_OUTCOME_ROLE_DECLARATION_PERSISTENCE_FAILED");
      }
    }
    assertCareerOutcomeRoleDeclaration(value);
    try { await this.assertAssociationRelation(value); } catch {
      return fail("ERR_CAREER_OUTCOME_ROLE_DECLARATION_PERSISTENCE_FAILED");
    }
    try {
      await this.database.transaction(async transaction => {
        await transaction.insert(careerOutcomeRoleDeclarations).values({
          careerOutcomeRoleDeclarationId: value.careerOutcomeRoleDeclarationId,
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
          associationDeclaredByActorId: value.associationDeclaredByActorId,
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
          associationDeclaredAt: value.associationDeclaredAt,
          declaredByActorId: value.declaredByActorId,
          declaredAt: value.declaredAt,
          schemaVersion: value.schemaVersion,
          createdAt: value.createdAt,
          payload: structuredClone(value),
        }).onConflictDoNothing();
        for (const subject of value.decisionSubjects) await transaction.insert(careerOutcomeRoleDeclarationSubjects).values({
          referenceId: `${value.careerOutcomeRoleDeclarationId}:subject:${subjectKey(subject)}`,
          careerOutcomeRoleDeclarationId: value.careerOutcomeRoleDeclarationId,
          recommendationProposalId: subject.recommendationProposalId,
          sourceEvolutionInputItemOrdinal: subject.sourceEvolutionInputItemOrdinal,
        }).onConflictDoNothing();
        for (const evidenceRef of value.outcomeRoleEvidenceRefs) await transaction.insert(careerOutcomeRoleDeclarationEvidenceReferences).values({
          referenceId: `${value.careerOutcomeRoleDeclarationId}:evidence:${evidenceRef}`,
          careerOutcomeRoleDeclarationId: value.careerOutcomeRoleDeclarationId,
          evidenceRef,
        }).onConflictDoNothing();
      });
    } catch {
      return fail("ERR_CAREER_OUTCOME_ROLE_DECLARATION_PERSISTENCE_FAILED");
    }
    let reread: CareerOutcomeRoleDeclaration;
    try { reread = await this.getCareerOutcomeRoleDeclarationById(value.careerOutcomeRoleDeclarationId); } catch {
      return fail("ERR_CAREER_OUTCOME_ROLE_DECLARATION_PERSISTENCE_FAILED");
    }
    if (!same(reread, value)) fail("ERR_CAREER_OUTCOME_ROLE_DECLARATION_PERSISTENCE_FAILED");
    return reread;
  }
}
