import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import {
  assertCareerOutcomeValenceDeclaration,
  type CareerOutcomeValenceDeclaration,
} from "../../relation/outcome-valence-declaration";
import {
  assertCareerOutcomeValenceFeedbackAdmissionDeclaration,
  stableCareerOutcomeValenceFeedbackAdmissionDeclaration,
  type CareerOutcomeValenceFeedbackAdmissionDeclaration,
} from "../../relation/outcome-valence-feedback-admission-declaration";
import {
  careerOutcomeValenceFeedbackAdmissionDeclarationEvidenceReferences,
  careerOutcomeValenceFeedbackAdmissionDeclarations,
  careerOutcomeValenceFeedbackAdmissionDeclarationSubjects,
} from "./postgres-schema";

const fail = (code: string): never => { throw new Error(code); };
const same = (left: unknown, right: unknown) =>
  stableCareerOutcomeValenceFeedbackAdmissionDeclaration(left) ===
  stableCareerOutcomeValenceFeedbackAdmissionDeclaration(right);
const subjectKey = (subject: {
  recommendationProposalId: string;
  sourceEvolutionInputItemOrdinal: number;
}) => `${subject.recommendationProposalId}:${String(subject.sourceEvolutionInputItemOrdinal).padStart(12, "0")}`;
const sameInventory = (left: readonly string[], right: readonly string[]) =>
  left.length === right.length && left.every((value, index) => value === right[index]);

export interface CareerOutcomeValenceFeedbackAdmissionDeclarationRepository {
  getCareerOutcomeValenceFeedbackAdmissionDeclarationById(
    id: string,
  ): Promise<CareerOutcomeValenceFeedbackAdmissionDeclaration>;
  persistCareerOutcomeValenceFeedbackAdmissionDeclaration(
    value: CareerOutcomeValenceFeedbackAdmissionDeclaration,
  ): Promise<CareerOutcomeValenceFeedbackAdmissionDeclaration>;
}

/** PostgreSQL preserves immutable admission declarations; storage is not truth authority. */
export class PostgresCareerOutcomeValenceFeedbackAdmissionDeclarationRepository
implements CareerOutcomeValenceFeedbackAdmissionDeclarationRepository {
  constructor(
    private readonly database: PostgresJsDatabase,
    private readonly outcomeValences: {
      getCareerOutcomeValenceDeclarationById(id: string): Promise<CareerOutcomeValenceDeclaration | null>;
    },
  ) {}

  private async existing(id: string): Promise<CareerOutcomeValenceFeedbackAdmissionDeclaration | null> {
    const rows = await this.database.select().from(careerOutcomeValenceFeedbackAdmissionDeclarations)
      .where(eq(
        careerOutcomeValenceFeedbackAdmissionDeclarations.careerOutcomeValenceFeedbackAdmissionDeclarationId,
        id,
      )).limit(1);
    if (rows.length === 0) return null;
    const row = rows[0];
    const value = row.payload;
    assertCareerOutcomeValenceFeedbackAdmissionDeclaration(value);
    if (
      row.careerOutcomeValenceFeedbackAdmissionDeclarationId !== id ||
      row.careerOutcomeValenceFeedbackAdmissionDeclarationId !== value.careerOutcomeValenceFeedbackAdmissionDeclarationId ||
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
      row.outcomeValenceDeclaredByActorId !== value.outcomeValenceDeclaredByActorId ||
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
      row.outcomeValenceDeclaredAt !== value.outcomeValenceDeclaredAt ||
      row.valence !== value.valence ||
      row.admittedByActorId !== value.admittedByActorId ||
      row.admittedAt !== value.admittedAt ||
      row.admissionState !== value.admissionState ||
      row.schemaVersion !== value.schemaVersion ||
      row.createdAt !== value.createdAt
    ) fail("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_ADMISSION_DECLARATION_PERSISTENCE_FAILED");
    const [subjectRows, evidenceRows] = await Promise.all([
      this.database.select().from(careerOutcomeValenceFeedbackAdmissionDeclarationSubjects)
        .where(eq(
          careerOutcomeValenceFeedbackAdmissionDeclarationSubjects.careerOutcomeValenceFeedbackAdmissionDeclarationId,
          id,
        )),
      this.database.select().from(careerOutcomeValenceFeedbackAdmissionDeclarationEvidenceReferences)
        .where(eq(
          careerOutcomeValenceFeedbackAdmissionDeclarationEvidenceReferences.careerOutcomeValenceFeedbackAdmissionDeclarationId,
          id,
        )),
    ]);
    if (
      !sameInventory(value.decisionSubjects.map(subjectKey), subjectRows.map(subjectKey).sort()) ||
      !sameInventory(value.admissionEvidenceRefs, evidenceRows.map(item => item.evidenceRef).sort())
    ) fail("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_ADMISSION_DECLARATION_PERSISTENCE_FAILED");
    await this.assertOutcomeValenceRelation(value);
    return structuredClone(value);
  }

  private async assertOutcomeValenceRelation(
    value: CareerOutcomeValenceFeedbackAdmissionDeclaration,
  ): Promise<void> {
    const outcomeValence = await this.outcomeValences.getCareerOutcomeValenceDeclarationById(
      value.careerOutcomeValenceDeclarationId,
    );
    if (!outcomeValence) fail("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_ADMISSION_DECLARATION_PERSISTENCE_FAILED");
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
    ) fail("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_ADMISSION_DECLARATION_PERSISTENCE_FAILED");
  }

  async getCareerOutcomeValenceFeedbackAdmissionDeclarationById(
    id: string,
  ): Promise<CareerOutcomeValenceFeedbackAdmissionDeclaration> {
    try {
      const value = await this.existing(id);
      if (!value) fail("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_ADMISSION_DECLARATION_NOT_FOUND");
      return value;
    } catch (error) {
      if (error instanceof Error && error.message === "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_ADMISSION_DECLARATION_NOT_FOUND") throw error;
      return fail("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_ADMISSION_DECLARATION_PERSISTENCE_FAILED");
    }
  }

  async persistCareerOutcomeValenceFeedbackAdmissionDeclaration(
    value: CareerOutcomeValenceFeedbackAdmissionDeclaration,
  ): Promise<CareerOutcomeValenceFeedbackAdmissionDeclaration> {
    const id = value && typeof value === "object"
      ? (value as { careerOutcomeValenceFeedbackAdmissionDeclarationId?: unknown })
        .careerOutcomeValenceFeedbackAdmissionDeclarationId
      : undefined;
    if (typeof id === "string") {
      try {
        const stored = await this.existing(id);
        if (stored) {
          if (!same(stored, value)) fail("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_ADMISSION_DECLARATION_IMMUTABLE_CONFLICT");
          return stored;
        }
      } catch (error) {
        if (error instanceof Error && error.message === "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_ADMISSION_DECLARATION_IMMUTABLE_CONFLICT") throw error;
        return fail("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_ADMISSION_DECLARATION_PERSISTENCE_FAILED");
      }
    }
    try {
      assertCareerOutcomeValenceFeedbackAdmissionDeclaration(value);
      await this.assertOutcomeValenceRelation(value);
    } catch {
      return fail("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_ADMISSION_DECLARATION_PERSISTENCE_FAILED");
    }
    try {
      await this.database.transaction(async transaction => {
        await transaction.insert(careerOutcomeValenceFeedbackAdmissionDeclarations).values({
          careerOutcomeValenceFeedbackAdmissionDeclarationId:
            value.careerOutcomeValenceFeedbackAdmissionDeclarationId,
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
          outcomeValenceDeclaredByActorId: value.outcomeValenceDeclaredByActorId,
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
          outcomeValenceDeclaredAt: value.outcomeValenceDeclaredAt,
          valence: value.valence,
          admittedByActorId: value.admittedByActorId,
          admittedAt: value.admittedAt,
          admissionState: value.admissionState,
          schemaVersion: value.schemaVersion,
          createdAt: value.createdAt,
          payload: structuredClone(value),
        }).onConflictDoNothing();
        for (const subject of value.decisionSubjects) await transaction
          .insert(careerOutcomeValenceFeedbackAdmissionDeclarationSubjects).values({
            careerOutcomeValenceFeedbackAdmissionDeclarationId:
              value.careerOutcomeValenceFeedbackAdmissionDeclarationId,
            recommendationProposalId: subject.recommendationProposalId,
            sourceEvolutionInputItemOrdinal: subject.sourceEvolutionInputItemOrdinal,
          }).onConflictDoNothing();
        for (const evidenceRef of value.admissionEvidenceRefs) await transaction
          .insert(careerOutcomeValenceFeedbackAdmissionDeclarationEvidenceReferences).values({
            careerOutcomeValenceFeedbackAdmissionDeclarationId:
              value.careerOutcomeValenceFeedbackAdmissionDeclarationId,
            evidenceRef,
          }).onConflictDoNothing();
      });
    } catch {
      return fail("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_ADMISSION_DECLARATION_PERSISTENCE_FAILED");
    }
    let reread: CareerOutcomeValenceFeedbackAdmissionDeclaration;
    try {
      reread = await this.getCareerOutcomeValenceFeedbackAdmissionDeclarationById(
        value.careerOutcomeValenceFeedbackAdmissionDeclarationId,
      );
    } catch {
      return fail("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_ADMISSION_DECLARATION_PERSISTENCE_FAILED");
    }
    if (!same(reread, value)) fail("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_ADMISSION_DECLARATION_PERSISTENCE_FAILED");
    return reread;
  }
}
