import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import {
  assertCareerActionOccurrence,
  type CareerActionOccurrence,
} from "../../relation/action-occurrence";
import {
  assertCareerStateChangeDeclaration,
  stableCareerStateChangeDeclaration,
  type CareerStateChangeDeclaration,
} from "../../relation/state-change-declaration";
import {
  careerStateChangeDeclarationEvidenceReferences,
  careerStateChangeDeclarations,
  careerStateChangeDeclarationSubjects,
} from "./postgres-schema";

const fail = (code: string): never => { throw new Error(code); };
const same = (left: unknown, right: unknown) =>
  stableCareerStateChangeDeclaration(left) === stableCareerStateChangeDeclaration(right);
const subjectKey = (subject: {
  recommendationProposalId: string;
  sourceEvolutionInputItemOrdinal: number;
}) => `${subject.recommendationProposalId}:${String(subject.sourceEvolutionInputItemOrdinal).padStart(12, "0")}`;
const sameInventory = (left: readonly string[], right: readonly string[]) =>
  left.length === right.length && left.every((value, index) => value === right[index]);

export interface CareerStateChangeDeclarationRepository {
  getCareerStateChangeDeclarationById(id: string): Promise<CareerStateChangeDeclaration>;
  persistCareerStateChangeDeclaration(value: CareerStateChangeDeclaration): Promise<CareerStateChangeDeclaration>;
}

/** PostgreSQL preserves immutable declarations; it is not a truth authority. */
export class PostgresCareerStateChangeDeclarationRepository implements CareerStateChangeDeclarationRepository {
  constructor(
    private readonly database: PostgresJsDatabase,
    private readonly occurrences: {
      getCareerActionOccurrenceById(id: string): Promise<CareerActionOccurrence | null>;
    },
  ) {}

  private async existing(id: string): Promise<CareerStateChangeDeclaration | null> {
    const rows = await this.database.select().from(careerStateChangeDeclarations)
      .where(eq(careerStateChangeDeclarations.careerStateChangeDeclarationId, id)).limit(1);
    if (rows.length === 0) return null;
    const row = rows[0]; const value = row.payload;
    assertCareerStateChangeDeclaration(value);
    const external = value.externalStateRef;
    if (
      row.careerStateChangeDeclarationId !== id ||
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
      row.externalStateProducerId !== (external?.producerId ?? null) ||
      row.externalStateAuthorityContractId !== (external?.authorityContractId ?? null) ||
      row.externalStateArtifactId !== (external?.artifactId ?? null) ||
      row.externalStateLocator !== (external?.locator ?? null) ||
      row.schemaVersion !== value.schemaVersion ||
      row.createdAt !== value.createdAt
    ) fail("ERR_CAREER_STATE_CHANGE_DECLARATION_PERSISTENCE_FAILED");
    const [subjectRows, evidenceRows] = await Promise.all([
      this.database.select().from(careerStateChangeDeclarationSubjects)
        .where(eq(careerStateChangeDeclarationSubjects.careerStateChangeDeclarationId, id)),
      this.database.select().from(careerStateChangeDeclarationEvidenceReferences)
        .where(eq(careerStateChangeDeclarationEvidenceReferences.careerStateChangeDeclarationId, id)),
    ]);
    // Durable ordering is neutral, but duplicate rows remain corruption.
    if (
      !sameInventory(value.decisionSubjects.map(subjectKey), subjectRows.map(subjectKey).sort()) ||
      !sameInventory(value.stateChangeEvidenceRefs, evidenceRows.map(item => item.evidenceRef).sort())
    ) fail("ERR_CAREER_STATE_CHANGE_DECLARATION_PERSISTENCE_FAILED");
    await this.assertActionRelation(value);
    return structuredClone(value);
  }

  private async assertActionRelation(value: CareerStateChangeDeclaration): Promise<void> {
    const occurrence = await this.occurrences.getCareerActionOccurrenceById(value.careerActionOccurrenceId);
    if (!occurrence) fail("ERR_CAREER_STATE_CHANGE_DECLARATION_PERSISTENCE_FAILED");
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
    ) fail("ERR_CAREER_STATE_CHANGE_DECLARATION_PERSISTENCE_FAILED");
  }

  async getCareerStateChangeDeclarationById(id: string): Promise<CareerStateChangeDeclaration> {
    try {
      const value = await this.existing(id);
      if (!value) fail("ERR_CAREER_STATE_CHANGE_DECLARATION_NOT_FOUND");
      return value;
    } catch (error) {
      if (error instanceof Error && error.message === "ERR_CAREER_STATE_CHANGE_DECLARATION_NOT_FOUND") throw error;
      return fail("ERR_CAREER_STATE_CHANGE_DECLARATION_PERSISTENCE_FAILED");
    }
  }

  async persistCareerStateChangeDeclaration(value: CareerStateChangeDeclaration): Promise<CareerStateChangeDeclaration> {
    const id = value && typeof value === "object"
      ? (value as { careerStateChangeDeclarationId?: unknown }).careerStateChangeDeclarationId : undefined;
    if (typeof id === "string") {
      try {
        const stored = await this.existing(id);
        if (stored) {
          if (!same(stored, value)) fail("ERR_CAREER_STATE_CHANGE_DECLARATION_IMMUTABLE_CONFLICT");
          return stored;
        }
      } catch (error) {
        if (error instanceof Error && error.message === "ERR_CAREER_STATE_CHANGE_DECLARATION_IMMUTABLE_CONFLICT") throw error;
        return fail("ERR_CAREER_STATE_CHANGE_DECLARATION_PERSISTENCE_FAILED");
      }
    }
    assertCareerStateChangeDeclaration(value);
    try { await this.assertActionRelation(value); } catch {
      return fail("ERR_CAREER_STATE_CHANGE_DECLARATION_PERSISTENCE_FAILED");
    }
    const external = value.externalStateRef;
    try {
      await this.database.transaction(async transaction => {
        await transaction.insert(careerStateChangeDeclarations).values({
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
          externalStateProducerId: external?.producerId ?? null,
          externalStateAuthorityContractId: external?.authorityContractId ?? null,
          externalStateArtifactId: external?.artifactId ?? null,
          externalStateLocator: external?.locator ?? null,
          schemaVersion: value.schemaVersion,
          createdAt: value.createdAt,
          payload: structuredClone(value),
        }).onConflictDoNothing();
        for (const subject of value.decisionSubjects) await transaction.insert(careerStateChangeDeclarationSubjects).values({
          referenceId: `${value.careerStateChangeDeclarationId}:subject:${subjectKey(subject)}`,
          careerStateChangeDeclarationId: value.careerStateChangeDeclarationId,
          recommendationProposalId: subject.recommendationProposalId,
          sourceEvolutionInputItemOrdinal: subject.sourceEvolutionInputItemOrdinal,
        }).onConflictDoNothing();
        for (const evidenceRef of value.stateChangeEvidenceRefs) await transaction.insert(careerStateChangeDeclarationEvidenceReferences).values({
          referenceId: `${value.careerStateChangeDeclarationId}:evidence:${evidenceRef}`,
          careerStateChangeDeclarationId: value.careerStateChangeDeclarationId,
          evidenceRef,
        }).onConflictDoNothing();
      });
    } catch {
      return fail("ERR_CAREER_STATE_CHANGE_DECLARATION_PERSISTENCE_FAILED");
    }
    let reread: CareerStateChangeDeclaration;
    try { reread = await this.getCareerStateChangeDeclarationById(value.careerStateChangeDeclarationId); } catch {
      return fail("ERR_CAREER_STATE_CHANGE_DECLARATION_PERSISTENCE_FAILED");
    }
    if (!same(reread, value)) fail("ERR_CAREER_STATE_CHANGE_DECLARATION_IMMUTABLE_CONFLICT");
    return reread;
  }
}
