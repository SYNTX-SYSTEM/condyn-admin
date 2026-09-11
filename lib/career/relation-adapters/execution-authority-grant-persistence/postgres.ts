import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import {
  assertCareerHumanCommitment,
  type CareerHumanCommitment,
} from "../../relation/human-commitment";
import {
  assertCareerExecutionAuthorityGrantRevision,
  stableCareerExecutionAuthorityGrantRevision,
  type CareerExecutionAuthorityGrantRevision,
  type CareerExecutionAuthorityScope,
} from "../../relation/execution-authority-grant";
import {
  careerExecutionAuthorityGrantChannelKinds,
  careerExecutionAuthorityGrantEvidenceReferences,
  careerExecutionAuthorityGrantRevisions,
  careerExecutionAuthorityGrantSubjects,
  careerExecutionAuthorityGrantTargetKinds,
} from "./postgres-schema";

const fail = (code: string): never => { throw new Error(code); };
const same = (left: unknown, right: unknown) =>
  stableCareerExecutionAuthorityGrantRevision(left) === stableCareerExecutionAuthorityGrantRevision(right);
const subjectKey = (subject: { recommendationProposalId: string; sourceEvolutionInputItemOrdinal: number }) =>
  `${subject.recommendationProposalId}:${String(subject.sourceEvolutionInputItemOrdinal).padStart(12, "0")}`;
const sameInventory = (left: readonly string[], right: readonly string[]) =>
  left.length === right.length && left.every((value, index) => value === right[index]);
const expectedScope: Record<string, CareerExecutionAuthorityScope> = {
  RECOMMENDATION_OPERATIONALIZATION: "RECOMMENDATION_OPERATION_EXECUTION",
  FURTHER_EVIDENCE_REQUEST_OPERATIONALIZATION: "FURTHER_EVIDENCE_REQUEST_EXECUTION",
  TARGET_CLARIFICATION_REQUEST_OPERATIONALIZATION: "TARGET_CLARIFICATION_REQUEST_EXECUTION",
};

export interface CareerExecutionAuthorityGrantRevisionRepository {
  getCareerExecutionAuthorityGrantRevisionById(id: string): Promise<CareerExecutionAuthorityGrantRevision>;
  persistCareerExecutionAuthorityGrantRevision(value: CareerExecutionAuthorityGrantRevision): Promise<CareerExecutionAuthorityGrantRevision>;
}

/** EAGR storage preserves explicit authority history; it neither creates context nor occurrence. */
export class PostgresCareerExecutionAuthorityGrantRevisionRepository implements CareerExecutionAuthorityGrantRevisionRepository {
  constructor(
    private readonly database: PostgresJsDatabase,
    private readonly commitments: { getCareerHumanCommitmentById(id: string): Promise<CareerHumanCommitment | null> },
  ) {}

  private async existing(id: string): Promise<CareerExecutionAuthorityGrantRevision | null> {
    const rows = await this.database.select().from(careerExecutionAuthorityGrantRevisions)
      .where(eq(careerExecutionAuthorityGrantRevisions.careerExecutionAuthorityGrantRevisionId, id)).limit(1);
    if (rows.length === 0) return null;
    const row = rows[0];
    const value = row.payload;
    assertCareerExecutionAuthorityGrantRevision(value);
    if (
      row.careerExecutionAuthorityGrantRevisionId !== value.careerExecutionAuthorityGrantRevisionId ||
      row.careerHumanCommitmentId !== value.careerHumanCommitmentId ||
      row.humanDecisionRecordId !== value.humanDecisionRecordId ||
      row.careerDecisionActionIntentId !== value.careerDecisionActionIntentId ||
      row.careerDecisionContextRevisionId !== value.careerDecisionContextRevisionId ||
      row.decisionAuthorityGrantRevisionId !== value.decisionAuthorityGrantRevisionId ||
      row.recommendationProposalId !== value.recommendationProposalId ||
      row.grantorActorId !== value.grantorActorId ||
      row.authorizedExecutionActorId !== value.authorizedExecutionActorId ||
      row.sourceDeclarationClass !== value.sourceDeclarationClass ||
      row.sourceActionIntentClass !== value.sourceActionIntentClass ||
      row.operationDescription !== value.operationDescription ||
      row.executionAuthorityScope !== value.executionAuthorityScope ||
      row.declaredAt !== value.declaredAt ||
      row.effectiveFrom !== value.effectiveFrom ||
      row.effectiveUntil !== value.effectiveUntil ||
      row.schemaVersion !== value.schemaVersion ||
      row.createdAt !== value.createdAt
    ) fail("ERR_CAREER_EXECUTION_AUTHORITY_GRANT_PERSISTENCE_FAILED");
    const [subjectRows, targetRows, channelRows, evidenceRows] = await Promise.all([
      this.database.select().from(careerExecutionAuthorityGrantSubjects).where(eq(careerExecutionAuthorityGrantSubjects.careerExecutionAuthorityGrantRevisionId, id)),
      this.database.select().from(careerExecutionAuthorityGrantTargetKinds).where(eq(careerExecutionAuthorityGrantTargetKinds.careerExecutionAuthorityGrantRevisionId, id)),
      this.database.select().from(careerExecutionAuthorityGrantChannelKinds).where(eq(careerExecutionAuthorityGrantChannelKinds.careerExecutionAuthorityGrantRevisionId, id)),
      this.database.select().from(careerExecutionAuthorityGrantEvidenceReferences).where(eq(careerExecutionAuthorityGrantEvidenceReferences.careerExecutionAuthorityGrantRevisionId, id)),
    ]);
    // SQL order is not semantic. Sorting is allowed; deduplicating durable rows is not.
    if (
      !sameInventory(value.decisionSubjects.map(subjectKey), subjectRows.map(subjectKey).sort()) ||
      !sameInventory(value.permittedTargetKinds, targetRows.map(row => row.targetKind).sort()) ||
      !sameInventory(value.permittedChannelKinds, channelRows.map(row => row.channelKind).sort()) ||
      !sameInventory(value.authorityEvidenceRefs, evidenceRows.map(row => row.authorityEvidenceRef).sort())
    ) fail("ERR_CAREER_EXECUTION_AUTHORITY_GRANT_PERSISTENCE_FAILED");
    await this.assertHistoricalCommitment(value);
    return structuredClone(value);
  }

  private async assertHistoricalCommitment(value: CareerExecutionAuthorityGrantRevision): Promise<void> {
    const commitment = await this.commitments.getCareerHumanCommitmentById(value.careerHumanCommitmentId);
    if (!commitment) fail("ERR_CAREER_EXECUTION_AUTHORITY_GRANT_PERSISTENCE_FAILED");
    assertCareerHumanCommitment(commitment);
    if (
      commitment.careerHumanCommitmentId !== value.careerHumanCommitmentId ||
      commitment.humanDecisionRecordId !== value.humanDecisionRecordId ||
      commitment.careerDecisionActionIntentId !== value.careerDecisionActionIntentId ||
      commitment.careerDecisionContextRevisionId !== value.careerDecisionContextRevisionId ||
      commitment.decisionAuthorityGrantRevisionId !== value.decisionAuthorityGrantRevisionId ||
      commitment.recommendationProposalId !== value.recommendationProposalId ||
      commitment.sourceDeclarationClass !== value.sourceDeclarationClass ||
      commitment.sourceActionIntentClass !== value.sourceActionIntentClass ||
      commitment.operationDescription !== value.operationDescription ||
      !sameInventory(commitment.decisionSubjects.map(subjectKey), value.decisionSubjects.map(subjectKey)) ||
      value.executionAuthorityScope !== expectedScope[commitment.sourceActionIntentClass] ||
      value.declaredAt < commitment.committedAt ||
      value.effectiveFrom < value.declaredAt ||
      (value.effectiveUntil !== null && value.effectiveUntil <= value.effectiveFrom)
    ) fail("ERR_CAREER_EXECUTION_AUTHORITY_GRANT_PERSISTENCE_FAILED");
  }

  async getCareerExecutionAuthorityGrantRevisionById(id: string): Promise<CareerExecutionAuthorityGrantRevision> {
    try {
      const value = await this.existing(id);
      if (!value) fail("ERR_CAREER_EXECUTION_AUTHORITY_GRANT_NOT_FOUND");
      return value;
    } catch (error) {
      if (error instanceof Error && error.message === "ERR_CAREER_EXECUTION_AUTHORITY_GRANT_NOT_FOUND") throw error;
      return fail("ERR_CAREER_EXECUTION_AUTHORITY_GRANT_PERSISTENCE_FAILED");
    }
  }

  async persistCareerExecutionAuthorityGrantRevision(value: CareerExecutionAuthorityGrantRevision): Promise<CareerExecutionAuthorityGrantRevision> {
    const id = value && typeof value === "object"
      ? (value as { careerExecutionAuthorityGrantRevisionId?: unknown }).careerExecutionAuthorityGrantRevisionId
      : undefined;
    if (typeof id === "string") {
      try {
        const existing = await this.existing(id);
        if (existing) {
          if (!same(existing, value)) fail("ERR_CAREER_EXECUTION_AUTHORITY_GRANT_IMMUTABLE_CONFLICT");
          return existing;
        }
      } catch (error) {
        if (error instanceof Error && error.message === "ERR_CAREER_EXECUTION_AUTHORITY_GRANT_IMMUTABLE_CONFLICT") throw error;
        return fail("ERR_CAREER_EXECUTION_AUTHORITY_GRANT_PERSISTENCE_FAILED");
      }
    }
    assertCareerExecutionAuthorityGrantRevision(value);
    try {
      await this.assertHistoricalCommitment(value);
    } catch {
      return fail("ERR_CAREER_EXECUTION_AUTHORITY_GRANT_PERSISTENCE_FAILED");
    }
    try {
      await this.database.transaction(async transaction => {
        await transaction.insert(careerExecutionAuthorityGrantRevisions).values({
          careerExecutionAuthorityGrantRevisionId: value.careerExecutionAuthorityGrantRevisionId,
          careerHumanCommitmentId: value.careerHumanCommitmentId,
          humanDecisionRecordId: value.humanDecisionRecordId,
          careerDecisionActionIntentId: value.careerDecisionActionIntentId,
          careerDecisionContextRevisionId: value.careerDecisionContextRevisionId,
          decisionAuthorityGrantRevisionId: value.decisionAuthorityGrantRevisionId,
          recommendationProposalId: value.recommendationProposalId,
          grantorActorId: value.grantorActorId,
          authorizedExecutionActorId: value.authorizedExecutionActorId,
          sourceDeclarationClass: value.sourceDeclarationClass,
          sourceActionIntentClass: value.sourceActionIntentClass,
          operationDescription: value.operationDescription,
          executionAuthorityScope: value.executionAuthorityScope,
          declaredAt: value.declaredAt,
          effectiveFrom: value.effectiveFrom,
          effectiveUntil: value.effectiveUntil,
          schemaVersion: value.schemaVersion,
          createdAt: value.createdAt,
          payload: structuredClone(value),
        }).onConflictDoNothing();
        for (const subject of value.decisionSubjects) await transaction.insert(careerExecutionAuthorityGrantSubjects).values({
          referenceId: `${value.careerExecutionAuthorityGrantRevisionId}:subject:${subjectKey(subject)}`,
          careerExecutionAuthorityGrantRevisionId: value.careerExecutionAuthorityGrantRevisionId,
          recommendationProposalId: subject.recommendationProposalId,
          sourceEvolutionInputItemOrdinal: subject.sourceEvolutionInputItemOrdinal,
        }).onConflictDoNothing();
        for (const targetKind of value.permittedTargetKinds) await transaction.insert(careerExecutionAuthorityGrantTargetKinds).values({
          referenceId: `${value.careerExecutionAuthorityGrantRevisionId}:target:${targetKind}`,
          careerExecutionAuthorityGrantRevisionId: value.careerExecutionAuthorityGrantRevisionId,
          targetKind,
        }).onConflictDoNothing();
        for (const channelKind of value.permittedChannelKinds) await transaction.insert(careerExecutionAuthorityGrantChannelKinds).values({
          referenceId: `${value.careerExecutionAuthorityGrantRevisionId}:channel:${channelKind}`,
          careerExecutionAuthorityGrantRevisionId: value.careerExecutionAuthorityGrantRevisionId,
          channelKind,
        }).onConflictDoNothing();
        for (const authorityEvidenceRef of value.authorityEvidenceRefs) await transaction.insert(careerExecutionAuthorityGrantEvidenceReferences).values({
          referenceId: `${value.careerExecutionAuthorityGrantRevisionId}:evidence:${authorityEvidenceRef}`,
          careerExecutionAuthorityGrantRevisionId: value.careerExecutionAuthorityGrantRevisionId,
          authorityEvidenceRef,
        }).onConflictDoNothing();
      });
    } catch {
      return fail("ERR_CAREER_EXECUTION_AUTHORITY_GRANT_PERSISTENCE_FAILED");
    }
    let reread: CareerExecutionAuthorityGrantRevision;
    try {
      reread = await this.getCareerExecutionAuthorityGrantRevisionById(value.careerExecutionAuthorityGrantRevisionId);
    } catch {
      return fail("ERR_CAREER_EXECUTION_AUTHORITY_GRANT_PERSISTENCE_FAILED");
    }
    if (!same(reread, value)) fail("ERR_CAREER_EXECUTION_AUTHORITY_GRANT_IMMUTABLE_CONFLICT");
    return reread;
  }
}
