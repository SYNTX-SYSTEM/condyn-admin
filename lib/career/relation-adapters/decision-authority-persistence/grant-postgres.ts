import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import {
  assertDecisionAuthorityGrantRevision,
  sameDecisionAuthorityGrant,
  type DecisionAuthorityGrantRevision,
  type DecisionAuthorityGrantRevisionRepository
} from "../../relation/decision-authority";
import {
  decisionAuthorityGrantDecisionClasses,
  decisionAuthorityGrantEvidenceReferences,
  decisionAuthorityGrantRevisions,
  decisionAuthorityGrantSubjectKinds
} from "./grant-postgres-schema";

const fail = (code: string): never => { throw new Error(code); };
const equal = (left: readonly unknown[], right: readonly unknown[]) => left.length === right.length && left.every((item, index) => item === right[index]);

/** Exact immutable DAR storage; fetched physical rows are sorted but never deduplicated. */
export class PostgresDecisionAuthorityGrantRevisionRepository implements DecisionAuthorityGrantRevisionRepository {
  constructor(private readonly database: PostgresJsDatabase) {}

  async getDecisionAuthorityGrantRevisionById(id: string): Promise<DecisionAuthorityGrantRevision | null> {
    try {
      const rows = await this.database.select().from(decisionAuthorityGrantRevisions)
        .where(eq(decisionAuthorityGrantRevisions.decisionAuthorityGrantRevisionId, id)).limit(1);
      if (!rows.length) return null;
      const row = rows[0];
      const value = row.payload;
      assertDecisionAuthorityGrantRevision(value);
      if (
        row.decisionAuthorityGrantRevisionId !== value.decisionAuthorityGrantRevisionId ||
        row.grantorActorId !== value.grantorActorId ||
        row.authorizedActorId !== value.authorizedActorId ||
        row.authorityScope !== value.authorityScope ||
        row.declaredAt !== value.declaredAt ||
        row.effectiveFrom !== value.effectiveFrom ||
        row.effectiveUntil !== value.effectiveUntil ||
        row.schemaVersion !== value.schemaVersion ||
        row.createdAt !== value.createdAt
      ) fail("ERR_DECISION_AUTHORITY_GRANT_PERSISTENCE_FAILED");
      const [classes, subjects, evidence] = await Promise.all([
        this.database.select().from(decisionAuthorityGrantDecisionClasses).where(eq(decisionAuthorityGrantDecisionClasses.decisionAuthorityGrantRevisionId, id)),
        this.database.select().from(decisionAuthorityGrantSubjectKinds).where(eq(decisionAuthorityGrantSubjectKinds.decisionAuthorityGrantRevisionId, id)),
        this.database.select().from(decisionAuthorityGrantEvidenceReferences).where(eq(decisionAuthorityGrantEvidenceReferences.decisionAuthorityGrantRevisionId, id))
      ]);
      if (
        !equal(value.permittedDecisionClasses, classes.map(item => item.decisionClass).sort()) ||
        !equal(value.permittedSubjectKinds, subjects.map(item => item.subjectKind).sort()) ||
        !equal(value.authorityEvidenceRefs, evidence.map(item => item.authorityEvidenceRef).sort())
      ) fail("ERR_DECISION_AUTHORITY_GRANT_PERSISTENCE_FAILED");
      return structuredClone(value);
    } catch {
      return fail("ERR_DECISION_AUTHORITY_GRANT_PERSISTENCE_FAILED");
    }
  }

  async persistDecisionAuthorityGrantRevision(value: DecisionAuthorityGrantRevision): Promise<DecisionAuthorityGrantRevision> {
    assertDecisionAuthorityGrantRevision(value);
    const existing = await this.getDecisionAuthorityGrantRevisionById(value.decisionAuthorityGrantRevisionId);
    if (existing) {
      if (!sameDecisionAuthorityGrant(existing, value)) fail("ERR_DECISION_AUTHORITY_GRANT_IMMUTABLE_CONFLICT");
      return existing;
    }
    try {
      await this.database.transaction(async transaction => {
        await transaction.insert(decisionAuthorityGrantRevisions).values({
          decisionAuthorityGrantRevisionId: value.decisionAuthorityGrantRevisionId,
          grantorActorId: value.grantorActorId,
          authorizedActorId: value.authorizedActorId,
          authorityScope: value.authorityScope,
          declaredAt: value.declaredAt,
          effectiveFrom: value.effectiveFrom,
          effectiveUntil: value.effectiveUntil,
          schemaVersion: value.schemaVersion,
          createdAt: value.createdAt,
          payload: structuredClone(value)
        }).onConflictDoNothing();
        for (const decisionClass of value.permittedDecisionClasses) {
          await transaction.insert(decisionAuthorityGrantDecisionClasses).values({
            referenceId: `${value.decisionAuthorityGrantRevisionId}:class:${decisionClass}`,
            decisionAuthorityGrantRevisionId: value.decisionAuthorityGrantRevisionId,
            decisionClass
          }).onConflictDoNothing();
        }
        for (const subjectKind of value.permittedSubjectKinds) {
          await transaction.insert(decisionAuthorityGrantSubjectKinds).values({
            referenceId: `${value.decisionAuthorityGrantRevisionId}:subject:${subjectKind}`,
            decisionAuthorityGrantRevisionId: value.decisionAuthorityGrantRevisionId,
            subjectKind
          }).onConflictDoNothing();
        }
        for (const authorityEvidenceRef of value.authorityEvidenceRefs) {
          await transaction.insert(decisionAuthorityGrantEvidenceReferences).values({
            referenceId: `${value.decisionAuthorityGrantRevisionId}:evidence:${authorityEvidenceRef}`,
            decisionAuthorityGrantRevisionId: value.decisionAuthorityGrantRevisionId,
            authorityEvidenceRef
          }).onConflictDoNothing();
        }
      });
    } catch {
      return fail("ERR_DECISION_AUTHORITY_GRANT_PERSISTENCE_FAILED");
    }
    const reread = await this.getDecisionAuthorityGrantRevisionById(value.decisionAuthorityGrantRevisionId);
    if (!reread) fail("ERR_DECISION_AUTHORITY_GRANT_PERSISTENCE_FAILED");
    if (!sameDecisionAuthorityGrant(reread, value)) fail("ERR_DECISION_AUTHORITY_GRANT_IMMUTABLE_CONFLICT");
    return reread!;
  }
}
