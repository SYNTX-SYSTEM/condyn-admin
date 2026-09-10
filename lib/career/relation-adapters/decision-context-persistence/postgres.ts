import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { DecisionAuthorityGrantRevisionRepository } from "../../relation/decision-authority";
import {
  assertCareerDecisionContextRevision,
  assertCareerDecisionContextWitnesses,
  sameCareerDecisionContext,
  type CareerDecisionContextRevision,
  type CareerDecisionContextRevisionRepository
} from "../../relation/decision-context";
import type { RecommendationProposalRepository } from "../../relation/recommendation-proposal";
import {
  careerDecisionContextDecisionClasses,
  careerDecisionContextEvidenceReferences,
  careerDecisionContextRevisions,
  careerDecisionContextSubjectKinds,
  careerDecisionContextSubjects
} from "./postgres-schema";

const fail = (code: string): never => { throw new Error(code); };
const equal = (left: readonly unknown[], right: readonly unknown[]) => left.length === right.length && left.every((item, index) => item === right[index]);
const subjectKey = (value: { recommendationProposalId: string; sourceEvolutionInputItemOrdinal: number }) => `${value.recommendationProposalId}:${String(value.sourceEvolutionInputItemOrdinal).padStart(12, "0")}`;

/** Immutable exact storage for a structural DAR × RCP context, never a decision state. */
export class PostgresCareerDecisionContextRevisionRepository implements CareerDecisionContextRevisionRepository {
  constructor(
    private readonly database: PostgresJsDatabase,
    private readonly authorities: DecisionAuthorityGrantRevisionRepository,
    private readonly proposals: RecommendationProposalRepository
  ) {}

  private async witnesses(value: CareerDecisionContextRevision): Promise<void> {
    try {
      const [authority, proposal] = await Promise.all([
        this.authorities.getDecisionAuthorityGrantRevisionById(value.decisionAuthorityGrantRevisionId),
        this.proposals.getRecommendationProposalById(value.recommendationProposalId)
      ]);
      assertCareerDecisionContextWitnesses(value, authority ?? fail("ERR_CAREER_DECISION_CONTEXT_PERSISTENCE_FAILED"), proposal ?? fail("ERR_CAREER_DECISION_CONTEXT_PERSISTENCE_FAILED"));
    } catch {
      fail("ERR_CAREER_DECISION_CONTEXT_PERSISTENCE_FAILED");
    }
  }

  async getCareerDecisionContextRevisionById(id: string): Promise<CareerDecisionContextRevision | null> {
    try {
      const rows = await this.database.select().from(careerDecisionContextRevisions)
        .where(eq(careerDecisionContextRevisions.careerDecisionContextRevisionId, id)).limit(1);
      if (!rows.length) return null;
      const row = rows[0];
      const value = row.payload;
      assertCareerDecisionContextRevision(value);
      if (
        row.careerDecisionContextRevisionId !== value.careerDecisionContextRevisionId ||
        row.decisionAuthorityGrantRevisionId !== value.decisionAuthorityGrantRevisionId ||
        row.recommendationProposalId !== value.recommendationProposalId ||
        row.authorityScope !== value.authorityScope ||
        row.schemaVersion !== value.schemaVersion ||
        row.createdAt !== value.createdAt
      ) fail("ERR_CAREER_DECISION_CONTEXT_PERSISTENCE_FAILED");
      const [subjects, evidence, classes, kinds] = await Promise.all([
        this.database.select().from(careerDecisionContextSubjects).where(eq(careerDecisionContextSubjects.careerDecisionContextRevisionId, id)),
        this.database.select().from(careerDecisionContextEvidenceReferences).where(eq(careerDecisionContextEvidenceReferences.careerDecisionContextRevisionId, id)),
        this.database.select().from(careerDecisionContextDecisionClasses).where(eq(careerDecisionContextDecisionClasses.careerDecisionContextRevisionId, id)),
        this.database.select().from(careerDecisionContextSubjectKinds).where(eq(careerDecisionContextSubjectKinds.careerDecisionContextRevisionId, id))
      ]);
      if (
        !equal(value.decisionSubjects.map(subjectKey), subjects.map(subjectKey).sort()) ||
        !equal(value.contextEvidenceRefs, evidence.map(item => item.contextEvidenceRef).sort()) ||
        !equal(value.permittedDecisionClasses, classes.map(item => item.decisionClass).sort()) ||
        !equal(value.permittedSubjectKinds, kinds.map(item => item.subjectKind).sort())
      ) fail("ERR_CAREER_DECISION_CONTEXT_PERSISTENCE_FAILED");
      await this.witnesses(value);
      return structuredClone(value);
    } catch {
      return fail("ERR_CAREER_DECISION_CONTEXT_PERSISTENCE_FAILED");
    }
  }

  async persistCareerDecisionContextRevision(value: CareerDecisionContextRevision): Promise<CareerDecisionContextRevision> {
    assertCareerDecisionContextRevision(value);
    const existing = await this.getCareerDecisionContextRevisionById(value.careerDecisionContextRevisionId);
    if (existing) {
      if (!sameCareerDecisionContext(existing, value)) fail("ERR_CAREER_DECISION_CONTEXT_IMMUTABLE_CONFLICT");
      return existing;
    }
    await this.witnesses(value);
    try {
      await this.database.transaction(async transaction => {
        await transaction.insert(careerDecisionContextRevisions).values({
          careerDecisionContextRevisionId: value.careerDecisionContextRevisionId,
          decisionAuthorityGrantRevisionId: value.decisionAuthorityGrantRevisionId,
          recommendationProposalId: value.recommendationProposalId,
          authorityScope: value.authorityScope,
          schemaVersion: value.schemaVersion,
          createdAt: value.createdAt,
          payload: structuredClone(value)
        }).onConflictDoNothing();
        for (const subject of value.decisionSubjects) await transaction.insert(careerDecisionContextSubjects).values({
          referenceId: `${value.careerDecisionContextRevisionId}:subject:${subjectKey(subject)}`,
          careerDecisionContextRevisionId: value.careerDecisionContextRevisionId,
          recommendationProposalId: subject.recommendationProposalId,
          sourceEvolutionInputItemOrdinal: subject.sourceEvolutionInputItemOrdinal
        }).onConflictDoNothing();
        for (const contextEvidenceRef of value.contextEvidenceRefs) await transaction.insert(careerDecisionContextEvidenceReferences).values({
          referenceId: `${value.careerDecisionContextRevisionId}:evidence:${contextEvidenceRef}`,
          careerDecisionContextRevisionId: value.careerDecisionContextRevisionId,
          contextEvidenceRef
        }).onConflictDoNothing();
        for (const decisionClass of value.permittedDecisionClasses) await transaction.insert(careerDecisionContextDecisionClasses).values({
          referenceId: `${value.careerDecisionContextRevisionId}:class:${decisionClass}`,
          careerDecisionContextRevisionId: value.careerDecisionContextRevisionId,
          decisionClass
        }).onConflictDoNothing();
        for (const subjectKind of value.permittedSubjectKinds) await transaction.insert(careerDecisionContextSubjectKinds).values({
          referenceId: `${value.careerDecisionContextRevisionId}:kind:${subjectKind}`,
          careerDecisionContextRevisionId: value.careerDecisionContextRevisionId,
          subjectKind
        }).onConflictDoNothing();
      });
    } catch {
      return fail("ERR_CAREER_DECISION_CONTEXT_PERSISTENCE_FAILED");
    }
    const reread = await this.getCareerDecisionContextRevisionById(value.careerDecisionContextRevisionId);
    if (!reread) fail("ERR_CAREER_DECISION_CONTEXT_PERSISTENCE_FAILED");
    if (!sameCareerDecisionContext(reread, value)) fail("ERR_CAREER_DECISION_CONTEXT_IMMUTABLE_CONFLICT");
    return reread!;
  }
}
