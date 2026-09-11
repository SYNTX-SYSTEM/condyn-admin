import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import {
  assertCareerDecisionActionIntent,
  stableCareerDecisionActionIntent,
  type CareerDecisionActionIntent,
} from "../../relation/action-intent";
import {
  assertHumanDecisionRecord,
  type HumanDecisionRecord,
} from "../../relation/decision-record";
import {
  careerDecisionActionIntentEvidenceReferences,
  careerDecisionActionIntents,
  careerDecisionActionIntentSubjects,
} from "./postgres-schema";

const fail = (code: string): never => { throw new Error(code); };
const same = (left: unknown, right: unknown) => stableCareerDecisionActionIntent(left) === stableCareerDecisionActionIntent(right);
const subjectKey = (subject: { recommendationProposalId: string; sourceEvolutionInputItemOrdinal: number }) =>
  `${subject.recommendationProposalId}:${String(subject.sourceEvolutionInputItemOrdinal).padStart(12, "0")}`;
const sameInventory = (left: readonly string[], right: readonly string[]) =>
  left.length === right.length && left.every((value, index) => value === right[index]);

export interface CareerDecisionActionIntentRepository {
  getCareerDecisionActionIntentById(id: string): Promise<CareerDecisionActionIntent>;
  persistCareerDecisionActionIntent(value: CareerDecisionActionIntent): Promise<CareerDecisionActionIntent>;
}

/**
 * DAINT is immutable human operationalization history, not commitment or execution authority.
 * Its only direct historical authority dependency is the exact DCR repository.
 */
export class PostgresCareerDecisionActionIntentRepository implements CareerDecisionActionIntentRepository {
  constructor(
    private readonly database: PostgresJsDatabase,
    private readonly records: { getHumanDecisionRecordById(id: string): Promise<HumanDecisionRecord | null> },
  ) {}

  private async existing(id: string): Promise<CareerDecisionActionIntent | null> {
    const rows = await this.database
      .select()
      .from(careerDecisionActionIntents)
      .where(eq(careerDecisionActionIntents.careerDecisionActionIntentId, id))
      .limit(1);
    if (rows.length === 0) return null;

    const row = rows[0];
    const value = row.payload;
    assertCareerDecisionActionIntent(value);
    if (
      row.careerDecisionActionIntentId !== value.careerDecisionActionIntentId ||
      row.humanDecisionRecordId !== value.humanDecisionRecordId ||
      row.careerDecisionContextRevisionId !== value.careerDecisionContextRevisionId ||
      row.decisionAuthorityGrantRevisionId !== value.decisionAuthorityGrantRevisionId ||
      row.recommendationProposalId !== value.recommendationProposalId ||
      row.declaredByActorId !== value.declaredByActorId ||
      row.sourceDeclarationClass !== value.sourceDeclarationClass ||
      row.actionIntentClass !== value.actionIntentClass ||
      row.operationDescription !== value.operationDescription ||
      row.declaredAt !== value.declaredAt ||
      row.schemaVersion !== value.schemaVersion ||
      row.createdAt !== value.createdAt
    ) fail("ERR_CAREER_DECISION_ACTION_INTENT_PERSISTENCE_FAILED");

    const [subjectRows, evidenceRows] = await Promise.all([
      this.database.select().from(careerDecisionActionIntentSubjects).where(eq(careerDecisionActionIntentSubjects.careerDecisionActionIntentId, id)),
      this.database.select().from(careerDecisionActionIntentEvidenceReferences).where(eq(careerDecisionActionIntentEvidenceReferences.careerDecisionActionIntentId, id)),
    ]);
    // SQL row order is not semantic, but duplicate durable rows must remain observable.
    const subjects = subjectRows.map(subjectKey).sort();
    const evidence = evidenceRows.map(row => row.actionIntentEvidenceRef).sort();
    if (
      !sameInventory(value.decisionSubjects.map(subjectKey), subjects) ||
      !sameInventory(value.actionIntentEvidenceRefs, evidence)
    ) fail("ERR_CAREER_DECISION_ACTION_INTENT_PERSISTENCE_FAILED");

    await this.assertHistoricalRecord(value);
    return structuredClone(value);
  }

  private async assertHistoricalRecord(value: CareerDecisionActionIntent): Promise<void> {
    const record = await this.records.getHumanDecisionRecordById(value.humanDecisionRecordId);
    if (!record) fail("ERR_CAREER_DECISION_ACTION_INTENT_PERSISTENCE_FAILED");
    assertHumanDecisionRecord(record);
    if (
      record.humanDecisionRecordId !== value.humanDecisionRecordId ||
      record.careerDecisionContextRevisionId !== value.careerDecisionContextRevisionId ||
      record.decisionAuthorityGrantRevisionId !== value.decisionAuthorityGrantRevisionId ||
      record.recommendationProposalId !== value.recommendationProposalId ||
      record.declarantActorId !== value.declaredByActorId ||
      record.declarationClass !== value.sourceDeclarationClass ||
      !sameInventory(record.decisionSubjects.map(subjectKey), value.decisionSubjects.map(subjectKey)) ||
      // DAR applicability was consumed by the DCR declaration; T12A checks only this ordering.
      value.declaredAt < record.declaredAt
    ) fail("ERR_CAREER_DECISION_ACTION_INTENT_PERSISTENCE_FAILED");
  }

  async getCareerDecisionActionIntentById(id: string): Promise<CareerDecisionActionIntent> {
    try {
      const value = await this.existing(id);
      if (!value) fail("ERR_CAREER_DECISION_ACTION_INTENT_NOT_FOUND");
      return value as CareerDecisionActionIntent;
    } catch (error) {
      if (error instanceof Error && error.message === "ERR_CAREER_DECISION_ACTION_INTENT_NOT_FOUND") throw error;
      return fail("ERR_CAREER_DECISION_ACTION_INTENT_PERSISTENCE_FAILED");
    }
  }

  async persistCareerDecisionActionIntent(value: CareerDecisionActionIntent): Promise<CareerDecisionActionIntent> {
    const id = value && typeof value === "object" ? (value as { careerDecisionActionIntentId?: unknown }).careerDecisionActionIntentId : undefined;
    if (typeof id === "string") {
      try {
        const existing = await this.existing(id);
        if (existing) {
          if (!same(existing, value)) fail("ERR_CAREER_DECISION_ACTION_INTENT_IMMUTABLE_CONFLICT");
          return existing;
        }
      } catch (error) {
        if (error instanceof Error && error.message === "ERR_CAREER_DECISION_ACTION_INTENT_IMMUTABLE_CONFLICT") throw error;
        return fail("ERR_CAREER_DECISION_ACTION_INTENT_PERSISTENCE_FAILED");
      }
    }

    assertCareerDecisionActionIntent(value);
    try {
      await this.assertHistoricalRecord(value);
    } catch {
      return fail("ERR_CAREER_DECISION_ACTION_INTENT_PERSISTENCE_FAILED");
    }

    try {
      await this.database.transaction(async transaction => {
        await transaction.insert(careerDecisionActionIntents).values({
          careerDecisionActionIntentId: value.careerDecisionActionIntentId,
          humanDecisionRecordId: value.humanDecisionRecordId,
          careerDecisionContextRevisionId: value.careerDecisionContextRevisionId,
          decisionAuthorityGrantRevisionId: value.decisionAuthorityGrantRevisionId,
          recommendationProposalId: value.recommendationProposalId,
          declaredByActorId: value.declaredByActorId,
          sourceDeclarationClass: value.sourceDeclarationClass,
          actionIntentClass: value.actionIntentClass,
          operationDescription: value.operationDescription,
          declaredAt: value.declaredAt,
          schemaVersion: value.schemaVersion,
          createdAt: value.createdAt,
          payload: structuredClone(value),
        }).onConflictDoNothing();
        for (const subject of value.decisionSubjects) {
          await transaction.insert(careerDecisionActionIntentSubjects).values({
            referenceId: `${value.careerDecisionActionIntentId}:subject:${subjectKey(subject)}`,
            careerDecisionActionIntentId: value.careerDecisionActionIntentId,
            recommendationProposalId: subject.recommendationProposalId,
            sourceEvolutionInputItemOrdinal: subject.sourceEvolutionInputItemOrdinal,
          }).onConflictDoNothing();
        }
        for (const reference of value.actionIntentEvidenceRefs) {
          await transaction.insert(careerDecisionActionIntentEvidenceReferences).values({
            referenceId: `${value.careerDecisionActionIntentId}:evidence:${reference}`,
            careerDecisionActionIntentId: value.careerDecisionActionIntentId,
            actionIntentEvidenceRef: reference,
          }).onConflictDoNothing();
        }
      });
    } catch {
      return fail("ERR_CAREER_DECISION_ACTION_INTENT_PERSISTENCE_FAILED");
    }

    let reread: CareerDecisionActionIntent;
    try {
      reread = await this.getCareerDecisionActionIntentById(value.careerDecisionActionIntentId);
    } catch {
      return fail("ERR_CAREER_DECISION_ACTION_INTENT_PERSISTENCE_FAILED");
    }
    if (!same(reread, value)) fail("ERR_CAREER_DECISION_ACTION_INTENT_IMMUTABLE_CONFLICT");
    return reread;
  }
}
