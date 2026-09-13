import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import {
  assertCareerOutcomeValenceFeedbackAdmissionDeclaration,
  stableCareerOutcomeValenceFeedbackAdmissionDeclaration,
  type CareerOutcomeValenceFeedbackAdmissionDeclaration,
} from "../../relation/outcome-valence-feedback-admission-declaration";
import {
  assertCareerOutcomeValenceFeedbackTargetDeclaration,
  stableCareerOutcomeValenceFeedbackTargetDeclaration,
  type CareerOutcomeValenceFeedbackTargetDeclaration,
} from "../../relation/outcome-valence-feedback-target-declaration";
import {
  careerOutcomeValenceFeedbackTargetDeclarationEvidenceReferences,
  careerOutcomeValenceFeedbackTargetDeclarations,
  careerOutcomeValenceFeedbackTargetDeclarationSubjects,
} from "./postgres-schema";

const notFound = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_DECLARATION_NOT_FOUND";
const persistenceFailed = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_DECLARATION_PERSISTENCE_FAILED";
const immutableConflict = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_DECLARATION_IMMUTABLE_CONFLICT";
const fail = (code: string): never => { throw new Error(code); };
const same = (left: unknown, right: unknown) =>
  stableCareerOutcomeValenceFeedbackTargetDeclaration(left) ===
  stableCareerOutcomeValenceFeedbackTargetDeclaration(right);
const subjectKey = (subject: {
  recommendationProposalId: string;
  sourceEvolutionInputItemOrdinal: number;
}) => `${subject.recommendationProposalId}:${String(subject.sourceEvolutionInputItemOrdinal).padStart(12, "0")}`;
const sameInventory = (left: readonly string[], right: readonly string[]) =>
  left.length === right.length && left.every((value, index) => value === right[index]);

export interface CareerOutcomeValenceFeedbackTargetDeclarationRepository {
  getCareerOutcomeValenceFeedbackTargetDeclarationById(
    id: string,
  ): Promise<CareerOutcomeValenceFeedbackTargetDeclaration>;
  persistCareerOutcomeValenceFeedbackTargetDeclaration(
    value: CareerOutcomeValenceFeedbackTargetDeclaration,
  ): Promise<CareerOutcomeValenceFeedbackTargetDeclaration>;
}

export class PostgresCareerOutcomeValenceFeedbackTargetDeclarationRepository
implements CareerOutcomeValenceFeedbackTargetDeclarationRepository {
  constructor(
    private readonly database: PostgresJsDatabase<any>,
    private readonly admissions: {
      getCareerOutcomeValenceFeedbackAdmissionDeclarationById(
        id: string,
      ): Promise<CareerOutcomeValenceFeedbackAdmissionDeclaration | null>;
    },
  ) {}

  private async existing(id: string): Promise<CareerOutcomeValenceFeedbackTargetDeclaration | null> {
    const rows = await this.database.select().from(careerOutcomeValenceFeedbackTargetDeclarations)
      .where(eq(
        careerOutcomeValenceFeedbackTargetDeclarations.careerOutcomeValenceFeedbackTargetDeclarationId,
        id,
      )).limit(1);
    if (rows.length === 0) return null;
    const row = rows[0];
    const value = row.payload;
    assertCareerOutcomeValenceFeedbackTargetDeclaration(value);
    const physical: CareerOutcomeValenceFeedbackTargetDeclaration = {
      careerOutcomeValenceFeedbackTargetDeclarationId:
        row.careerOutcomeValenceFeedbackTargetDeclarationId,
      careerOutcomeValenceFeedbackAdmissionDeclarationId:
        row.careerOutcomeValenceFeedbackAdmissionDeclarationId,
      careerOutcomeValenceDeclarationId: row.careerOutcomeValenceDeclarationId,
      careerOutcomeRoleDeclarationId: row.careerOutcomeRoleDeclarationId,
      careerActionStateChangeAssociationDeclarationId:
        row.careerActionStateChangeAssociationDeclarationId,
      careerStateChangeDeclarationId: row.careerStateChangeDeclarationId,
      careerActionOccurrenceId: row.careerActionOccurrenceId,
      careerExecutionContextRevisionId: row.careerExecutionContextRevisionId,
      careerExecutionAuthorityGrantRevisionId: row.careerExecutionAuthorityGrantRevisionId,
      careerHumanCommitmentId: row.careerHumanCommitmentId,
      careerDecisionActionIntentId: row.careerDecisionActionIntentId,
      humanDecisionRecordId: row.humanDecisionRecordId,
      careerDecisionContextRevisionId: row.careerDecisionContextRevisionId,
      decisionAuthorityGrantRevisionId: row.decisionAuthorityGrantRevisionId,
      recommendationProposalId: row.recommendationProposalId,
      performedByActorId: row.performedByActorId,
      observedByActorId: row.observedByActorId,
      associationDeclaredByActorId: row.associationDeclaredByActorId,
      outcomeRoleDeclaredByActorId: row.outcomeRoleDeclaredByActorId,
      outcomeValenceDeclaredByActorId: row.outcomeValenceDeclaredByActorId,
      decisionSubjects: structuredClone(value.decisionSubjects),
      sourceDeclarationClass: row.sourceDeclarationClass as CareerOutcomeValenceFeedbackTargetDeclaration["sourceDeclarationClass"],
      sourceActionIntentClass: row.sourceActionIntentClass as CareerOutcomeValenceFeedbackTargetDeclaration["sourceActionIntentClass"],
      operationDescription: row.operationDescription,
      executionAuthorityScope: row.executionAuthorityScope as CareerOutcomeValenceFeedbackTargetDeclaration["executionAuthorityScope"],
      executionTarget: { targetKind: row.executionTargetKind as CareerOutcomeValenceFeedbackTargetDeclaration["executionTarget"]["targetKind"], targetRef: row.executionTargetRef },
      executionChannel: { channelKind: row.executionChannelKind as CareerOutcomeValenceFeedbackTargetDeclaration["executionChannel"]["channelKind"], channelRef: row.executionChannelRef },
      actionOccurredAt: row.actionOccurredAt,
      stateSubject: { subjectKind: row.stateSubjectKind as CareerOutcomeValenceFeedbackTargetDeclaration["stateSubject"]["subjectKind"], subjectRef: row.stateSubjectRef },
      stateDimension: row.stateDimension,
      beforeObservation: { observationState: row.beforeObservationState as "OBSERVED", value: row.beforeObservationValue },
      afterObservation: { observationState: row.afterObservationState as "OBSERVED", value: row.afterObservationValue },
      observedAt: row.observedAt,
      associationDeclaredAt: row.associationDeclaredAt,
      outcomeRoleDeclaredAt: row.outcomeRoleDeclaredAt,
      outcomeValenceDeclaredAt: row.outcomeValenceDeclaredAt,
      valence: row.valence as CareerOutcomeValenceFeedbackTargetDeclaration["valence"],
      admittedByActorId: row.admittedByActorId,
      admittedAt: row.admittedAt,
      admissionState: row.admissionState as "ADMITTED",
      targetCareerDecisionContextRevisionId: row.targetCareerDecisionContextRevisionId,
      declaredByActorId: row.declaredByActorId,
      declaredAt: row.declaredAt,
      targetSelectionEvidenceRefs: structuredClone(value.targetSelectionEvidenceRefs),
      schemaVersion: row.schemaVersion as CareerOutcomeValenceFeedbackTargetDeclaration["schemaVersion"],
      createdAt: row.createdAt,
    };
    if (
      row.careerOutcomeValenceFeedbackTargetDeclarationId !== id ||
      !same(value, physical)
    ) fail(persistenceFailed);
    const [subjectRows, evidenceRows] = await Promise.all([
      this.database.select().from(careerOutcomeValenceFeedbackTargetDeclarationSubjects)
        .where(eq(
          careerOutcomeValenceFeedbackTargetDeclarationSubjects.careerOutcomeValenceFeedbackTargetDeclarationId,
          id,
        )),
      this.database.select().from(careerOutcomeValenceFeedbackTargetDeclarationEvidenceReferences)
        .where(eq(
          careerOutcomeValenceFeedbackTargetDeclarationEvidenceReferences.careerOutcomeValenceFeedbackTargetDeclarationId,
          id,
        )),
    ]);
    if (
      !sameInventory(value.decisionSubjects.map(subjectKey), subjectRows.map(subjectKey).sort()) ||
      !sameInventory(value.targetSelectionEvidenceRefs, evidenceRows.map(item => item.evidenceRef).sort())
    ) fail(persistenceFailed);
    await this.assertAdmissionRelation(value);
    return structuredClone(value);
  }

  private async assertAdmissionRelation(
    value: CareerOutcomeValenceFeedbackTargetDeclaration,
  ): Promise<void> {
    const admission = await this.admissions
      .getCareerOutcomeValenceFeedbackAdmissionDeclarationById(
        value.careerOutcomeValenceFeedbackAdmissionDeclarationId,
      );
    if (!admission) fail(persistenceFailed);
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
      decisionSubjects: value.decisionSubjects,
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
      decisionSubjects: admission.decisionSubjects,
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
    if (!same(targetWitness, admissionWitness) || value.declaredAt < admission.admittedAt) {
      fail(persistenceFailed);
    }
  }

  async getCareerOutcomeValenceFeedbackTargetDeclarationById(
    id: string,
  ): Promise<CareerOutcomeValenceFeedbackTargetDeclaration> {
    try {
      const value = await this.existing(id);
      if (!value) fail(notFound);
      return value;
    } catch (error) {
      if (error instanceof Error && error.message === notFound) throw error;
      return fail(persistenceFailed);
    }
  }

  async persistCareerOutcomeValenceFeedbackTargetDeclaration(
    value: CareerOutcomeValenceFeedbackTargetDeclaration,
  ): Promise<CareerOutcomeValenceFeedbackTargetDeclaration> {
    const id = value && typeof value === "object"
      ? (value as { careerOutcomeValenceFeedbackTargetDeclarationId?: unknown })
        .careerOutcomeValenceFeedbackTargetDeclarationId
      : undefined;
    if (typeof id === "string") {
      try {
        const stored = await this.existing(id);
        if (stored) {
          if (!same(stored, value)) fail(immutableConflict);
          return stored;
        }
      } catch (error) {
        if (error instanceof Error && error.message === immutableConflict) throw error;
        return fail(persistenceFailed);
      }
    }
    try {
      assertCareerOutcomeValenceFeedbackTargetDeclaration(value);
      await this.assertAdmissionRelation(value);
    } catch {
      return fail(persistenceFailed);
    }
    try {
      await this.database.transaction(async transaction => {
        await transaction.insert(careerOutcomeValenceFeedbackTargetDeclarations).values({
          careerOutcomeValenceFeedbackTargetDeclarationId:
            value.careerOutcomeValenceFeedbackTargetDeclarationId,
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
          targetCareerDecisionContextRevisionId: value.targetCareerDecisionContextRevisionId,
          declaredByActorId: value.declaredByActorId,
          declaredAt: value.declaredAt,
          schemaVersion: value.schemaVersion,
          createdAt: value.createdAt,
          payload: structuredClone(value),
        }).onConflictDoNothing();
        for (const subject of value.decisionSubjects) await transaction
          .insert(careerOutcomeValenceFeedbackTargetDeclarationSubjects).values({
            careerOutcomeValenceFeedbackTargetDeclarationId:
              value.careerOutcomeValenceFeedbackTargetDeclarationId,
            recommendationProposalId: subject.recommendationProposalId,
            sourceEvolutionInputItemOrdinal: subject.sourceEvolutionInputItemOrdinal,
          }).onConflictDoNothing();
        for (const evidenceRef of value.targetSelectionEvidenceRefs) await transaction
          .insert(careerOutcomeValenceFeedbackTargetDeclarationEvidenceReferences).values({
            careerOutcomeValenceFeedbackTargetDeclarationId:
              value.careerOutcomeValenceFeedbackTargetDeclarationId,
            evidenceRef,
          }).onConflictDoNothing();
      });
    } catch {
      return fail(persistenceFailed);
    }
    let reread: CareerOutcomeValenceFeedbackTargetDeclaration;
    try {
      reread = await this.getCareerOutcomeValenceFeedbackTargetDeclarationById(
        value.careerOutcomeValenceFeedbackTargetDeclarationId,
      );
    } catch {
      return fail(persistenceFailed);
    }
    if (!same(reread, value)) fail(persistenceFailed);
    return reread;
  }
}
