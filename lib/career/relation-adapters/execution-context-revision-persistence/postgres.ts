import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import {
  assertCareerExecutionAuthorityGrantRevision,
  type CareerExecutionAuthorityGrantRevision,
} from "../../relation/execution-authority-grant";
import {
  assertCareerExecutionContextRevision,
  stableCareerExecutionContextRevision,
  type CareerExecutionContextRevision,
} from "../../relation/execution-context-revision";
import {
  careerExecutionContextEvidenceReferences,
  careerExecutionContextRevisions,
  careerExecutionContextSubjects,
} from "./postgres-schema";

const fail = (code: string): never => { throw new Error(code); };
const same = (left: unknown, right: unknown) =>
  stableCareerExecutionContextRevision(left) === stableCareerExecutionContextRevision(right);
const subjectKey = (subject: {
  recommendationProposalId: string;
  sourceEvolutionInputItemOrdinal: number;
}) => `${subject.recommendationProposalId}:${String(subject.sourceEvolutionInputItemOrdinal).padStart(12, "0")}`;
const sameInventory = (left: readonly string[], right: readonly string[]) =>
  left.length === right.length && left.every((value, index) => value === right[index]);

export interface CareerExecutionContextRevisionRepository {
  getCareerExecutionContextRevisionById(id: string): Promise<CareerExecutionContextRevision>;
  persistCareerExecutionContextRevision(
    value: CareerExecutionContextRevision,
  ): Promise<CareerExecutionContextRevision>;
}

/**
 * ECTXREV storage is immutable context history. EAGR remains the direct
 * execution-authority dependency; neither target nor channel is resolved here.
 */
export class PostgresCareerExecutionContextRevisionRepository
  implements CareerExecutionContextRevisionRepository {
  constructor(
    private readonly database: PostgresJsDatabase,
    private readonly grants: {
      getCareerExecutionAuthorityGrantRevisionById(
        id: string,
      ): Promise<CareerExecutionAuthorityGrantRevision | null>;
    },
  ) {}

  private async existing(id: string): Promise<CareerExecutionContextRevision | null> {
    const rows = await this.database.select().from(careerExecutionContextRevisions)
      .where(eq(careerExecutionContextRevisions.careerExecutionContextRevisionId, id)).limit(1);
    if (rows.length === 0) return null;
    const row = rows[0];
    const value = row.payload;
    assertCareerExecutionContextRevision(value);
    if (
      row.careerExecutionContextRevisionId !== value.careerExecutionContextRevisionId ||
      row.careerExecutionAuthorityGrantRevisionId !== value.careerExecutionAuthorityGrantRevisionId ||
      row.careerHumanCommitmentId !== value.careerHumanCommitmentId ||
      row.careerDecisionActionIntentId !== value.careerDecisionActionIntentId ||
      row.humanDecisionRecordId !== value.humanDecisionRecordId ||
      row.careerDecisionContextRevisionId !== value.careerDecisionContextRevisionId ||
      row.decisionAuthorityGrantRevisionId !== value.decisionAuthorityGrantRevisionId ||
      row.recommendationProposalId !== value.recommendationProposalId ||
      row.declaredByActorId !== value.declaredByActorId ||
      row.sourceDeclarationClass !== value.sourceDeclarationClass ||
      row.sourceActionIntentClass !== value.sourceActionIntentClass ||
      row.operationDescription !== value.operationDescription ||
      row.executionAuthorityScope !== value.executionAuthorityScope ||
      row.executionTargetKind !== value.executionTarget.targetKind ||
      row.executionTargetRef !== value.executionTarget.targetRef ||
      row.executionChannelKind !== value.executionChannel.channelKind ||
      row.executionChannelRef !== value.executionChannel.channelRef ||
      row.declaredAt !== value.declaredAt ||
      row.schemaVersion !== value.schemaVersion ||
      row.createdAt !== value.createdAt
    ) fail("ERR_CAREER_EXECUTION_CONTEXT_REVISION_PERSISTENCE_FAILED");
    const [subjectRows, evidenceRows] = await Promise.all([
      this.database.select().from(careerExecutionContextSubjects)
        .where(eq(careerExecutionContextSubjects.careerExecutionContextRevisionId, id)),
      this.database.select().from(careerExecutionContextEvidenceReferences)
        .where(eq(careerExecutionContextEvidenceReferences.careerExecutionContextRevisionId, id)),
    ]);
    // SQL row order is not semantic; durable duplicates remain observable corruption.
    if (
      !sameInventory(value.decisionSubjects.map(subjectKey), subjectRows.map(subjectKey).sort()) ||
      !sameInventory(value.contextEvidenceRefs, evidenceRows.map(row => row.contextEvidenceRef).sort())
    ) fail("ERR_CAREER_EXECUTION_CONTEXT_REVISION_PERSISTENCE_FAILED");
    await this.assertHistoricalGrant(value);
    return structuredClone(value);
  }

  private async assertHistoricalGrant(value: CareerExecutionContextRevision): Promise<void> {
    const grant = await this.grants.getCareerExecutionAuthorityGrantRevisionById(
      value.careerExecutionAuthorityGrantRevisionId,
    );
    if (!grant) fail("ERR_CAREER_EXECUTION_CONTEXT_REVISION_PERSISTENCE_FAILED");
    assertCareerExecutionAuthorityGrantRevision(grant);
    if (
      grant.careerExecutionAuthorityGrantRevisionId !== value.careerExecutionAuthorityGrantRevisionId ||
      grant.careerHumanCommitmentId !== value.careerHumanCommitmentId ||
      grant.careerDecisionActionIntentId !== value.careerDecisionActionIntentId ||
      grant.humanDecisionRecordId !== value.humanDecisionRecordId ||
      grant.careerDecisionContextRevisionId !== value.careerDecisionContextRevisionId ||
      grant.decisionAuthorityGrantRevisionId !== value.decisionAuthorityGrantRevisionId ||
      grant.recommendationProposalId !== value.recommendationProposalId ||
      grant.sourceDeclarationClass !== value.sourceDeclarationClass ||
      grant.sourceActionIntentClass !== value.sourceActionIntentClass ||
      grant.operationDescription !== value.operationDescription ||
      grant.executionAuthorityScope !== value.executionAuthorityScope ||
      !sameInventory(grant.decisionSubjects.map(subjectKey), value.decisionSubjects.map(subjectKey)) ||
      value.declaredByActorId !== grant.authorizedExecutionActorId ||
      !grant.permittedTargetKinds.includes(value.executionTarget.targetKind) ||
      !grant.permittedChannelKinds.includes(value.executionChannel.channelKind) ||
      value.declaredAt < grant.declaredAt ||
      value.declaredAt < grant.effectiveFrom ||
      (grant.effectiveUntil !== null && value.declaredAt >= grant.effectiveUntil)
    ) fail("ERR_CAREER_EXECUTION_CONTEXT_REVISION_PERSISTENCE_FAILED");
  }

  async getCareerExecutionContextRevisionById(id: string): Promise<CareerExecutionContextRevision> {
    try {
      const value = await this.existing(id);
      if (!value) fail("ERR_CAREER_EXECUTION_CONTEXT_REVISION_NOT_FOUND");
      return value;
    } catch (error) {
      if (error instanceof Error && error.message === "ERR_CAREER_EXECUTION_CONTEXT_REVISION_NOT_FOUND") throw error;
      return fail("ERR_CAREER_EXECUTION_CONTEXT_REVISION_PERSISTENCE_FAILED");
    }
  }

  async persistCareerExecutionContextRevision(
    value: CareerExecutionContextRevision,
  ): Promise<CareerExecutionContextRevision> {
    const id = value && typeof value === "object"
      ? (value as { careerExecutionContextRevisionId?: unknown }).careerExecutionContextRevisionId
      : undefined;
    if (typeof id === "string") {
      try {
        const existing = await this.existing(id);
        if (existing) {
          if (!same(existing, value)) fail("ERR_CAREER_EXECUTION_CONTEXT_REVISION_IMMUTABLE_CONFLICT");
          return existing;
        }
      } catch (error) {
        if (error instanceof Error && error.message === "ERR_CAREER_EXECUTION_CONTEXT_REVISION_IMMUTABLE_CONFLICT") throw error;
        return fail("ERR_CAREER_EXECUTION_CONTEXT_REVISION_PERSISTENCE_FAILED");
      }
    }
    assertCareerExecutionContextRevision(value);
    try {
      await this.assertHistoricalGrant(value);
    } catch {
      return fail("ERR_CAREER_EXECUTION_CONTEXT_REVISION_PERSISTENCE_FAILED");
    }
    try {
      await this.database.transaction(async transaction => {
        await transaction.insert(careerExecutionContextRevisions).values({
          careerExecutionContextRevisionId: value.careerExecutionContextRevisionId,
          careerExecutionAuthorityGrantRevisionId: value.careerExecutionAuthorityGrantRevisionId,
          careerHumanCommitmentId: value.careerHumanCommitmentId,
          careerDecisionActionIntentId: value.careerDecisionActionIntentId,
          humanDecisionRecordId: value.humanDecisionRecordId,
          careerDecisionContextRevisionId: value.careerDecisionContextRevisionId,
          decisionAuthorityGrantRevisionId: value.decisionAuthorityGrantRevisionId,
          recommendationProposalId: value.recommendationProposalId,
          declaredByActorId: value.declaredByActorId,
          sourceDeclarationClass: value.sourceDeclarationClass,
          sourceActionIntentClass: value.sourceActionIntentClass,
          operationDescription: value.operationDescription,
          executionAuthorityScope: value.executionAuthorityScope,
          executionTargetKind: value.executionTarget.targetKind,
          executionTargetRef: value.executionTarget.targetRef,
          executionChannelKind: value.executionChannel.channelKind,
          executionChannelRef: value.executionChannel.channelRef,
          declaredAt: value.declaredAt,
          schemaVersion: value.schemaVersion,
          createdAt: value.createdAt,
          payload: structuredClone(value),
        }).onConflictDoNothing();
        for (const subject of value.decisionSubjects) await transaction.insert(careerExecutionContextSubjects).values({
          referenceId: `${value.careerExecutionContextRevisionId}:subject:${subjectKey(subject)}`,
          careerExecutionContextRevisionId: value.careerExecutionContextRevisionId,
          recommendationProposalId: subject.recommendationProposalId,
          sourceEvolutionInputItemOrdinal: subject.sourceEvolutionInputItemOrdinal,
        }).onConflictDoNothing();
        for (const contextEvidenceRef of value.contextEvidenceRefs) {
          await transaction.insert(careerExecutionContextEvidenceReferences).values({
            referenceId: `${value.careerExecutionContextRevisionId}:evidence:${contextEvidenceRef}`,
            careerExecutionContextRevisionId: value.careerExecutionContextRevisionId,
            contextEvidenceRef,
          }).onConflictDoNothing();
        }
      });
    } catch {
      return fail("ERR_CAREER_EXECUTION_CONTEXT_REVISION_PERSISTENCE_FAILED");
    }
    let reread: CareerExecutionContextRevision;
    try {
      reread = await this.getCareerExecutionContextRevisionById(value.careerExecutionContextRevisionId);
    } catch {
      return fail("ERR_CAREER_EXECUTION_CONTEXT_REVISION_PERSISTENCE_FAILED");
    }
    if (!same(reread, value)) fail("ERR_CAREER_EXECUTION_CONTEXT_REVISION_IMMUTABLE_CONFLICT");
    return reread;
  }
}
