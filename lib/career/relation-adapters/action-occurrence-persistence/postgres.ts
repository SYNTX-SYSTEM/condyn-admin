import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import {
  assertCareerActionOccurrence,
  stableCareerActionOccurrence,
  type CareerActionOccurrence,
} from "../../relation/action-occurrence";
import {
  assertCareerExecutionAuthorityGrantRevision,
  type CareerExecutionAuthorityGrantRevision,
} from "../../relation/execution-authority-grant";
import {
  assertCareerExecutionContextRevision,
  type CareerExecutionContextRevision,
} from "../../relation/execution-context-revision";
import {
  careerActionOccurrenceEvidenceReferences,
  careerActionOccurrences,
  careerActionOccurrenceSubjects,
} from "./postgres-schema";

const fail = (code: string): never => { throw new Error(code); };
const same = (left: unknown, right: unknown) =>
  stableCareerActionOccurrence(left) === stableCareerActionOccurrence(right);
const subjectKey = (subject: {
  recommendationProposalId: string;
  sourceEvolutionInputItemOrdinal: number;
}) => `${subject.recommendationProposalId}:${String(subject.sourceEvolutionInputItemOrdinal).padStart(12, "0")}`;
const sameInventory = (left: readonly string[], right: readonly string[]) =>
  left.length === right.length && left.every((value, index) => value === right[index]);

export interface CareerActionOccurrenceRepository {
  getCareerActionOccurrenceById(id: string): Promise<CareerActionOccurrence>;
  persistCareerActionOccurrence(value: CareerActionOccurrence): Promise<CareerActionOccurrence>;
}

/**
 * AOC persistence stores immutable occurrence declarations, not external proof.
 * ECTXREV is the direct predecessor; EAGR supplies the historical authority interval.
 */
export class PostgresCareerActionOccurrenceRepository implements CareerActionOccurrenceRepository {
  constructor(
    private readonly database: PostgresJsDatabase,
    private readonly contexts: {
      getCareerExecutionContextRevisionById(id: string): Promise<CareerExecutionContextRevision | null>;
    },
    private readonly grants: {
      getCareerExecutionAuthorityGrantRevisionById(id: string): Promise<CareerExecutionAuthorityGrantRevision | null>;
    },
  ) {}

  private async existing(id: string): Promise<CareerActionOccurrence | null> {
    const rows = await this.database.select().from(careerActionOccurrences)
      .where(eq(careerActionOccurrences.careerActionOccurrenceId, id)).limit(1);
    if (rows.length === 0) return null;
    const row = rows[0]; const value = row.payload;
    assertCareerActionOccurrence(value);
    if (
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
      row.sourceDeclarationClass !== value.sourceDeclarationClass ||
      row.sourceActionIntentClass !== value.sourceActionIntentClass ||
      row.operationDescription !== value.operationDescription ||
      row.executionAuthorityScope !== value.executionAuthorityScope ||
      row.executionTargetKind !== value.executionTarget.targetKind ||
      row.executionTargetRef !== value.executionTarget.targetRef ||
      row.executionChannelKind !== value.executionChannel.channelKind ||
      row.executionChannelRef !== value.executionChannel.channelRef ||
      row.occurredAt !== value.occurredAt ||
      row.externalOccurrenceRef !== value.externalOccurrenceRef ||
      row.schemaVersion !== value.schemaVersion ||
      row.createdAt !== value.createdAt
    ) fail("ERR_CAREER_ACTION_OCCURRENCE_PERSISTENCE_FAILED");
    const [subjectRows, evidenceRows] = await Promise.all([
      this.database.select().from(careerActionOccurrenceSubjects)
        .where(eq(careerActionOccurrenceSubjects.careerActionOccurrenceId, id)),
      this.database.select().from(careerActionOccurrenceEvidenceReferences)
        .where(eq(careerActionOccurrenceEvidenceReferences.careerActionOccurrenceId, id)),
    ]);
    // Storage order is neutralized by sorting; duplicate durable rows are never collapsed.
    if (
      !sameInventory(value.decisionSubjects.map(subjectKey), subjectRows.map(subjectKey).sort()) ||
      !sameInventory(value.occurrenceEvidenceRefs, evidenceRows.map(item => item.occurrenceEvidenceRef).sort())
    ) fail("ERR_CAREER_ACTION_OCCURRENCE_PERSISTENCE_FAILED");
    await this.assertHistoricalRelations(value);
    return structuredClone(value);
  }

  private async assertHistoricalRelations(value: CareerActionOccurrence): Promise<void> {
    const [context, grant] = await Promise.all([
      this.contexts.getCareerExecutionContextRevisionById(value.careerExecutionContextRevisionId),
      this.grants.getCareerExecutionAuthorityGrantRevisionById(value.careerExecutionAuthorityGrantRevisionId),
    ]);
    if (!context || !grant) fail("ERR_CAREER_ACTION_OCCURRENCE_PERSISTENCE_FAILED");
    assertCareerExecutionContextRevision(context);
    assertCareerExecutionAuthorityGrantRevision(grant);
    if (
      value.careerExecutionContextRevisionId !== context.careerExecutionContextRevisionId ||
      value.careerExecutionAuthorityGrantRevisionId !== context.careerExecutionAuthorityGrantRevisionId ||
      value.careerHumanCommitmentId !== context.careerHumanCommitmentId ||
      value.careerDecisionActionIntentId !== context.careerDecisionActionIntentId ||
      value.humanDecisionRecordId !== context.humanDecisionRecordId ||
      value.careerDecisionContextRevisionId !== context.careerDecisionContextRevisionId ||
      value.decisionAuthorityGrantRevisionId !== context.decisionAuthorityGrantRevisionId ||
      value.recommendationProposalId !== context.recommendationProposalId ||
      value.performedByActorId !== context.declaredByActorId ||
      !sameInventory(value.decisionSubjects.map(subjectKey), context.decisionSubjects.map(subjectKey)) ||
      value.sourceDeclarationClass !== context.sourceDeclarationClass ||
      value.sourceActionIntentClass !== context.sourceActionIntentClass ||
      value.operationDescription !== context.operationDescription ||
      value.executionAuthorityScope !== context.executionAuthorityScope ||
      value.executionTarget.targetKind !== context.executionTarget.targetKind ||
      value.executionTarget.targetRef !== context.executionTarget.targetRef ||
      value.executionChannel.channelKind !== context.executionChannel.channelKind ||
      value.executionChannel.channelRef !== context.executionChannel.channelRef ||
      value.occurredAt < context.declaredAt ||
      value.careerExecutionAuthorityGrantRevisionId !== grant.careerExecutionAuthorityGrantRevisionId ||
      value.careerHumanCommitmentId !== grant.careerHumanCommitmentId ||
      value.careerDecisionActionIntentId !== grant.careerDecisionActionIntentId ||
      value.humanDecisionRecordId !== grant.humanDecisionRecordId ||
      value.careerDecisionContextRevisionId !== grant.careerDecisionContextRevisionId ||
      value.decisionAuthorityGrantRevisionId !== grant.decisionAuthorityGrantRevisionId ||
      value.recommendationProposalId !== grant.recommendationProposalId ||
      !sameInventory(value.decisionSubjects.map(subjectKey), grant.decisionSubjects.map(subjectKey)) ||
      value.sourceDeclarationClass !== grant.sourceDeclarationClass ||
      value.sourceActionIntentClass !== grant.sourceActionIntentClass ||
      value.operationDescription !== grant.operationDescription ||
      value.executionAuthorityScope !== grant.executionAuthorityScope ||
      value.performedByActorId !== grant.authorizedExecutionActorId ||
      !grant.permittedTargetKinds.includes(value.executionTarget.targetKind) ||
      !grant.permittedChannelKinds.includes(value.executionChannel.channelKind) ||
      // Historical EAGR applicability is evaluated at occurredAt. Later expiry
      // and DAR timing do not alter this immutable occurrence declaration.
      value.occurredAt < grant.effectiveFrom ||
      (grant.effectiveUntil !== null && value.occurredAt >= grant.effectiveUntil)
    ) fail("ERR_CAREER_ACTION_OCCURRENCE_PERSISTENCE_FAILED");
  }

  async getCareerActionOccurrenceById(id: string): Promise<CareerActionOccurrence> {
    try {
      const value = await this.existing(id);
      if (!value) fail("ERR_CAREER_ACTION_OCCURRENCE_NOT_FOUND");
      return value;
    } catch (error) {
      if (error instanceof Error && error.message === "ERR_CAREER_ACTION_OCCURRENCE_NOT_FOUND") throw error;
      return fail("ERR_CAREER_ACTION_OCCURRENCE_PERSISTENCE_FAILED");
    }
  }

  async persistCareerActionOccurrence(value: CareerActionOccurrence): Promise<CareerActionOccurrence> {
    const id = value && typeof value === "object"
      ? (value as { careerActionOccurrenceId?: unknown }).careerActionOccurrenceId : undefined;
    if (typeof id === "string") {
      try {
        const stored = await this.existing(id);
        if (stored) {
          if (!same(stored, value)) fail("ERR_CAREER_ACTION_OCCURRENCE_IMMUTABLE_CONFLICT");
          return stored;
        }
      } catch (error) {
        if (error instanceof Error && error.message === "ERR_CAREER_ACTION_OCCURRENCE_IMMUTABLE_CONFLICT") throw error;
        return fail("ERR_CAREER_ACTION_OCCURRENCE_PERSISTENCE_FAILED");
      }
    }
    assertCareerActionOccurrence(value);
    try { await this.assertHistoricalRelations(value); } catch {
      return fail("ERR_CAREER_ACTION_OCCURRENCE_PERSISTENCE_FAILED");
    }
    try {
      await this.database.transaction(async transaction => {
        await transaction.insert(careerActionOccurrences).values({
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
          sourceDeclarationClass: value.sourceDeclarationClass,
          sourceActionIntentClass: value.sourceActionIntentClass,
          operationDescription: value.operationDescription,
          executionAuthorityScope: value.executionAuthorityScope,
          executionTargetKind: value.executionTarget.targetKind,
          executionTargetRef: value.executionTarget.targetRef,
          executionChannelKind: value.executionChannel.channelKind,
          executionChannelRef: value.executionChannel.channelRef,
          occurredAt: value.occurredAt,
          externalOccurrenceRef: value.externalOccurrenceRef,
          schemaVersion: value.schemaVersion,
          createdAt: value.createdAt,
          payload: structuredClone(value),
        }).onConflictDoNothing();
        for (const subject of value.decisionSubjects) await transaction.insert(careerActionOccurrenceSubjects).values({
          referenceId: `${value.careerActionOccurrenceId}:subject:${subjectKey(subject)}`,
          careerActionOccurrenceId: value.careerActionOccurrenceId,
          recommendationProposalId: subject.recommendationProposalId,
          sourceEvolutionInputItemOrdinal: subject.sourceEvolutionInputItemOrdinal,
        }).onConflictDoNothing();
        for (const occurrenceEvidenceRef of value.occurrenceEvidenceRefs) {
          await transaction.insert(careerActionOccurrenceEvidenceReferences).values({
            referenceId: `${value.careerActionOccurrenceId}:evidence:${occurrenceEvidenceRef}`,
            careerActionOccurrenceId: value.careerActionOccurrenceId,
            occurrenceEvidenceRef,
          }).onConflictDoNothing();
        }
      });
    } catch {
      return fail("ERR_CAREER_ACTION_OCCURRENCE_PERSISTENCE_FAILED");
    }
    let reread: CareerActionOccurrence;
    try { reread = await this.getCareerActionOccurrenceById(value.careerActionOccurrenceId); } catch {
      return fail("ERR_CAREER_ACTION_OCCURRENCE_PERSISTENCE_FAILED");
    }
    if (!same(reread, value)) fail("ERR_CAREER_ACTION_OCCURRENCE_IMMUTABLE_CONFLICT");
    return reread;
  }
}
