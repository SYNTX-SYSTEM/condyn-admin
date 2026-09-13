import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import {
  assertCareerOutcomeRoleDeclaration,
  type CareerOutcomeRoleDeclaration,
} from "../../relation/outcome-role-declaration";
import {
  assertCareerOutcomeValenceDeclaration,
  stableCareerOutcomeValenceDeclaration,
  type CareerOutcomeValenceDeclaration,
} from "../../relation/outcome-valence-declaration";
import {
  careerOutcomeValenceDeclarationEvidenceReferences,
  careerOutcomeValenceDeclarations,
  careerOutcomeValenceDeclarationSubjects,
} from "./postgres-schema";

const fail = (code: string): never => { throw new Error(code); };
const same = (left: unknown, right: unknown) =>
  stableCareerOutcomeValenceDeclaration(left) === stableCareerOutcomeValenceDeclaration(right);
const subjectKey = (subject: {
  recommendationProposalId: string;
  sourceEvolutionInputItemOrdinal: number;
}) => `${subject.recommendationProposalId}:${String(subject.sourceEvolutionInputItemOrdinal).padStart(12, "0")}`;
const sameInventory = (left: readonly string[], right: readonly string[]) =>
  left.length === right.length && left.every((value, index) => value === right[index]);

export interface CareerOutcomeValenceDeclarationRepository {
  getCareerOutcomeValenceDeclarationById(id: string): Promise<CareerOutcomeValenceDeclaration>;
  persistCareerOutcomeValenceDeclaration(value: CareerOutcomeValenceDeclaration): Promise<CareerOutcomeValenceDeclaration>;
}

/** PostgreSQL preserves immutable valence declarations; it is not truth or evaluation authority. */
export class PostgresCareerOutcomeValenceDeclarationRepository implements CareerOutcomeValenceDeclarationRepository {
  constructor(
    private readonly database: PostgresJsDatabase,
    private readonly outcomeRoles: {
      getCareerOutcomeRoleDeclarationById(id: string): Promise<CareerOutcomeRoleDeclaration | null>;
    },
  ) {}

  private async existing(id: string): Promise<CareerOutcomeValenceDeclaration | null> {
    const rows = await this.database.select().from(careerOutcomeValenceDeclarations)
      .where(eq(careerOutcomeValenceDeclarations.careerOutcomeValenceDeclarationId, id)).limit(1);
    if (rows.length === 0) return null;
    const row = rows[0];
    const value = row.payload;
    assertCareerOutcomeValenceDeclaration(value);
    if (
      row.careerOutcomeValenceDeclarationId !== id ||
      row.careerOutcomeValenceDeclarationId !== value.careerOutcomeValenceDeclarationId ||
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
      row.outcomeRoleDeclaredByActorId !== value.outcomeRoleDeclaredByActorId ||
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
      row.outcomeRoleDeclaredAt !== value.outcomeRoleDeclaredAt ||
      row.declaredByActorId !== value.declaredByActorId ||
      row.declaredAt !== value.declaredAt ||
      row.valence !== value.valence ||
      row.schemaVersion !== value.schemaVersion ||
      row.createdAt !== value.createdAt
    ) fail("ERR_CAREER_OUTCOME_VALENCE_DECLARATION_PERSISTENCE_FAILED");
    const [subjectRows, evidenceRows] = await Promise.all([
      this.database.select().from(careerOutcomeValenceDeclarationSubjects)
        .where(eq(careerOutcomeValenceDeclarationSubjects.careerOutcomeValenceDeclarationId, id)),
      this.database.select().from(careerOutcomeValenceDeclarationEvidenceReferences)
        .where(eq(careerOutcomeValenceDeclarationEvidenceReferences.careerOutcomeValenceDeclarationId, id)),
    ]);
    if (
      !sameInventory(value.decisionSubjects.map(subjectKey), subjectRows.map(subjectKey).sort()) ||
      !sameInventory(value.valenceEvidenceRefs, evidenceRows.map(item => item.evidenceRef).sort())
    ) fail("ERR_CAREER_OUTCOME_VALENCE_DECLARATION_PERSISTENCE_FAILED");
    await this.assertOutcomeRoleRelation(value);
    return structuredClone(value);
  }

  private async assertOutcomeRoleRelation(value: CareerOutcomeValenceDeclaration): Promise<void> {
    const outcomeRole = await this.outcomeRoles.getCareerOutcomeRoleDeclarationById(
      value.careerOutcomeRoleDeclarationId,
    );
    if (!outcomeRole) fail("ERR_CAREER_OUTCOME_VALENCE_DECLARATION_PERSISTENCE_FAILED");
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
    ) fail("ERR_CAREER_OUTCOME_VALENCE_DECLARATION_PERSISTENCE_FAILED");
  }

  async getCareerOutcomeValenceDeclarationById(id: string): Promise<CareerOutcomeValenceDeclaration> {
    try {
      const value = await this.existing(id);
      if (!value) fail("ERR_CAREER_OUTCOME_VALENCE_DECLARATION_NOT_FOUND");
      return value;
    } catch (error) {
      if (error instanceof Error && error.message === "ERR_CAREER_OUTCOME_VALENCE_DECLARATION_NOT_FOUND") throw error;
      return fail("ERR_CAREER_OUTCOME_VALENCE_DECLARATION_PERSISTENCE_FAILED");
    }
  }

  async persistCareerOutcomeValenceDeclaration(value: CareerOutcomeValenceDeclaration): Promise<CareerOutcomeValenceDeclaration> {
    const id = value && typeof value === "object"
      ? (value as { careerOutcomeValenceDeclarationId?: unknown }).careerOutcomeValenceDeclarationId : undefined;
    if (typeof id === "string") {
      try {
        const stored = await this.existing(id);
        if (stored) {
          if (!same(stored, value)) fail("ERR_CAREER_OUTCOME_VALENCE_DECLARATION_IMMUTABLE_CONFLICT");
          return stored;
        }
      } catch (error) {
        if (error instanceof Error && error.message === "ERR_CAREER_OUTCOME_VALENCE_DECLARATION_IMMUTABLE_CONFLICT") throw error;
        return fail("ERR_CAREER_OUTCOME_VALENCE_DECLARATION_PERSISTENCE_FAILED");
      }
    }
    try {
      assertCareerOutcomeValenceDeclaration(value);
      await this.assertOutcomeRoleRelation(value);
    } catch {
      return fail("ERR_CAREER_OUTCOME_VALENCE_DECLARATION_PERSISTENCE_FAILED");
    }
    try {
      await this.database.transaction(async transaction => {
        await transaction.insert(careerOutcomeValenceDeclarations).values({
          careerOutcomeValenceDeclarationId: value.careerOutcomeValenceDeclarationId,
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
          outcomeRoleDeclaredByActorId: value.outcomeRoleDeclaredByActorId,
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
          outcomeRoleDeclaredAt: value.outcomeRoleDeclaredAt,
          declaredByActorId: value.declaredByActorId,
          declaredAt: value.declaredAt,
          valence: value.valence,
          schemaVersion: value.schemaVersion,
          createdAt: value.createdAt,
          payload: structuredClone(value),
        }).onConflictDoNothing();
        for (const subject of value.decisionSubjects) await transaction.insert(careerOutcomeValenceDeclarationSubjects).values({
          careerOutcomeValenceDeclarationId: value.careerOutcomeValenceDeclarationId,
          recommendationProposalId: subject.recommendationProposalId,
          sourceEvolutionInputItemOrdinal: subject.sourceEvolutionInputItemOrdinal,
        }).onConflictDoNothing();
        for (const evidenceRef of value.valenceEvidenceRefs) await transaction.insert(careerOutcomeValenceDeclarationEvidenceReferences).values({
          careerOutcomeValenceDeclarationId: value.careerOutcomeValenceDeclarationId,
          evidenceRef,
        }).onConflictDoNothing();
      });
    } catch {
      return fail("ERR_CAREER_OUTCOME_VALENCE_DECLARATION_PERSISTENCE_FAILED");
    }
    let reread: CareerOutcomeValenceDeclaration;
    try { reread = await this.getCareerOutcomeValenceDeclarationById(value.careerOutcomeValenceDeclarationId); } catch {
      return fail("ERR_CAREER_OUTCOME_VALENCE_DECLARATION_PERSISTENCE_FAILED");
    }
    if (!same(reread, value)) fail("ERR_CAREER_OUTCOME_VALENCE_DECLARATION_PERSISTENCE_FAILED");
    return reread;
  }
}
