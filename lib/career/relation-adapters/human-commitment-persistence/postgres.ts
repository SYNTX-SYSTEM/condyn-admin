import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import {
  assertCareerDecisionActionIntent,
  type CareerDecisionActionIntent,
} from "../../relation/action-intent";
import {
  assertCareerHumanCommitment,
  stableCareerHumanCommitment,
  type CareerHumanCommitment,
} from "../../relation/human-commitment";
import {
  careerHumanCommitmentEvidenceReferences,
  careerHumanCommitmentSubjects,
  careerHumanCommitments,
} from "./postgres-schema";

const fail = (code: string): never => { throw new Error(code); };
const same = (left: unknown, right: unknown) =>
  stableCareerHumanCommitment(left) === stableCareerHumanCommitment(right);
const subjectKey = (subject: {
  recommendationProposalId: string;
  sourceEvolutionInputItemOrdinal: number;
}) => `${subject.recommendationProposalId}:${String(subject.sourceEvolutionInputItemOrdinal).padStart(12, "0")}`;
const sameInventory = (left: readonly string[], right: readonly string[]) =>
  left.length === right.length && left.every((value, index) => value === right[index]);

export interface CareerHumanCommitmentRepository {
  getCareerHumanCommitmentById(id: string): Promise<CareerHumanCommitment>;
  persistCareerHumanCommitment(value: CareerHumanCommitment): Promise<CareerHumanCommitment>;
}

/**
 * HCOM is immutable human history, not execution authority. Its only direct
 * historical dependency is the exact DAINT repository.
 */
export class PostgresCareerHumanCommitmentRepository implements CareerHumanCommitmentRepository {
  constructor(
    private readonly database: PostgresJsDatabase,
    private readonly intents: {
      getCareerDecisionActionIntentById(id: string): Promise<CareerDecisionActionIntent | null>;
    },
  ) {}

  private async existing(id: string): Promise<CareerHumanCommitment | null> {
    const rows = await this.database
      .select()
      .from(careerHumanCommitments)
      .where(eq(careerHumanCommitments.careerHumanCommitmentId, id))
      .limit(1);
    if (rows.length === 0) return null;

    const row = rows[0];
    const value = row.payload;
    assertCareerHumanCommitment(value);
    if (
      row.careerHumanCommitmentId !== value.careerHumanCommitmentId ||
      row.careerDecisionActionIntentId !== value.careerDecisionActionIntentId ||
      row.humanDecisionRecordId !== value.humanDecisionRecordId ||
      row.careerDecisionContextRevisionId !== value.careerDecisionContextRevisionId ||
      row.decisionAuthorityGrantRevisionId !== value.decisionAuthorityGrantRevisionId ||
      row.recommendationProposalId !== value.recommendationProposalId ||
      row.committedByActorId !== value.committedByActorId ||
      row.sourceDeclarationClass !== value.sourceDeclarationClass ||
      row.sourceActionIntentClass !== value.sourceActionIntentClass ||
      row.operationDescription !== value.operationDescription ||
      row.committedAt !== value.committedAt ||
      row.schemaVersion !== value.schemaVersion ||
      row.createdAt !== value.createdAt
    ) fail("ERR_CAREER_HUMAN_COMMITMENT_PERSISTENCE_FAILED");

    const [subjectRows, evidenceRows] = await Promise.all([
      this.database.select().from(careerHumanCommitmentSubjects)
        .where(eq(careerHumanCommitmentSubjects.careerHumanCommitmentId, id)),
      this.database.select().from(careerHumanCommitmentEvidenceReferences)
        .where(eq(careerHumanCommitmentEvidenceReferences.careerHumanCommitmentId, id)),
    ]);
    // SQL has no semantic row order. Sorting is permitted; durable duplicates are not.
    const subjects = subjectRows.map(subjectKey).sort();
    const evidence = evidenceRows.map(row => row.commitmentEvidenceRef).sort();
    if (
      !sameInventory(value.decisionSubjects.map(subjectKey), subjects) ||
      !sameInventory(value.commitmentEvidenceRefs, evidence)
    ) fail("ERR_CAREER_HUMAN_COMMITMENT_PERSISTENCE_FAILED");

    await this.assertHistoricalIntent(value);
    return structuredClone(value);
  }

  private async assertHistoricalIntent(value: CareerHumanCommitment): Promise<void> {
    const intent = await this.intents.getCareerDecisionActionIntentById(
      value.careerDecisionActionIntentId,
    );
    if (!intent) fail("ERR_CAREER_HUMAN_COMMITMENT_PERSISTENCE_FAILED");
    assertCareerDecisionActionIntent(intent);
    if (
      intent.careerDecisionActionIntentId !== value.careerDecisionActionIntentId ||
      intent.humanDecisionRecordId !== value.humanDecisionRecordId ||
      intent.careerDecisionContextRevisionId !== value.careerDecisionContextRevisionId ||
      intent.decisionAuthorityGrantRevisionId !== value.decisionAuthorityGrantRevisionId ||
      intent.recommendationProposalId !== value.recommendationProposalId ||
      intent.declaredByActorId !== value.committedByActorId ||
      intent.sourceDeclarationClass !== value.sourceDeclarationClass ||
      intent.actionIntentClass !== value.sourceActionIntentClass ||
      intent.operationDescription !== value.operationDescription ||
      !sameInventory(intent.decisionSubjects.map(subjectKey), value.decisionSubjects.map(subjectKey)) ||
      // DAR applicability was consumed at DCR declaration, never at HCOM time.
      value.committedAt < intent.declaredAt
    ) fail("ERR_CAREER_HUMAN_COMMITMENT_PERSISTENCE_FAILED");
  }

  async getCareerHumanCommitmentById(id: string): Promise<CareerHumanCommitment> {
    try {
      const value = await this.existing(id);
      if (!value) fail("ERR_CAREER_HUMAN_COMMITMENT_NOT_FOUND");
      return value;
    } catch (error) {
      if (error instanceof Error && error.message === "ERR_CAREER_HUMAN_COMMITMENT_NOT_FOUND") throw error;
      return fail("ERR_CAREER_HUMAN_COMMITMENT_PERSISTENCE_FAILED");
    }
  }

  async persistCareerHumanCommitment(value: CareerHumanCommitment): Promise<CareerHumanCommitment> {
    const id = value && typeof value === "object"
      ? (value as { careerHumanCommitmentId?: unknown }).careerHumanCommitmentId
      : undefined;
    if (typeof id === "string") {
      try {
        const existing = await this.existing(id);
        if (existing) {
          if (!same(existing, value)) {
            fail("ERR_CAREER_HUMAN_COMMITMENT_IMMUTABLE_CONFLICT");
          }
          return existing;
        }
      } catch (error) {
        if (error instanceof Error && error.message === "ERR_CAREER_HUMAN_COMMITMENT_IMMUTABLE_CONFLICT") throw error;
        return fail("ERR_CAREER_HUMAN_COMMITMENT_PERSISTENCE_FAILED");
      }
    }

    assertCareerHumanCommitment(value);
    try {
      await this.assertHistoricalIntent(value);
    } catch {
      return fail("ERR_CAREER_HUMAN_COMMITMENT_PERSISTENCE_FAILED");
    }

    try {
      await this.database.transaction(async transaction => {
        await transaction.insert(careerHumanCommitments).values({
          careerHumanCommitmentId: value.careerHumanCommitmentId,
          careerDecisionActionIntentId: value.careerDecisionActionIntentId,
          humanDecisionRecordId: value.humanDecisionRecordId,
          careerDecisionContextRevisionId: value.careerDecisionContextRevisionId,
          decisionAuthorityGrantRevisionId: value.decisionAuthorityGrantRevisionId,
          recommendationProposalId: value.recommendationProposalId,
          committedByActorId: value.committedByActorId,
          sourceDeclarationClass: value.sourceDeclarationClass,
          sourceActionIntentClass: value.sourceActionIntentClass,
          operationDescription: value.operationDescription,
          committedAt: value.committedAt,
          schemaVersion: value.schemaVersion,
          createdAt: value.createdAt,
          payload: structuredClone(value),
        }).onConflictDoNothing();
        for (const subject of value.decisionSubjects) {
          await transaction.insert(careerHumanCommitmentSubjects).values({
            referenceId: `${value.careerHumanCommitmentId}:subject:${subjectKey(subject)}`,
            careerHumanCommitmentId: value.careerHumanCommitmentId,
            recommendationProposalId: subject.recommendationProposalId,
            sourceEvolutionInputItemOrdinal: subject.sourceEvolutionInputItemOrdinal,
          }).onConflictDoNothing();
        }
        for (const reference of value.commitmentEvidenceRefs) {
          await transaction.insert(careerHumanCommitmentEvidenceReferences).values({
            referenceId: `${value.careerHumanCommitmentId}:evidence:${reference}`,
            careerHumanCommitmentId: value.careerHumanCommitmentId,
            commitmentEvidenceRef: reference,
          }).onConflictDoNothing();
        }
      });
    } catch {
      return fail("ERR_CAREER_HUMAN_COMMITMENT_PERSISTENCE_FAILED");
    }

    let reread: CareerHumanCommitment;
    try {
      reread = await this.getCareerHumanCommitmentById(value.careerHumanCommitmentId);
    } catch {
      return fail("ERR_CAREER_HUMAN_COMMITMENT_PERSISTENCE_FAILED");
    }
    if (!same(reread, value)) fail("ERR_CAREER_HUMAN_COMMITMENT_IMMUTABLE_CONFLICT");
    return reread;
  }
}
