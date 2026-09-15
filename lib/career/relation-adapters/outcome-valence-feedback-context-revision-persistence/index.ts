import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import {
  assertCareerOutcomeValenceFeedbackContextRevision,
  stableCareerOutcomeValenceFeedbackContextRevision,
  type CareerOutcomeValenceFeedbackContextRevision,
} from "../../relation/outcome-valence-feedback-context-revision";
import { careerOutcomeValenceFeedbackContextRevisions } from "./postgres-schema";

const failed = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION_PERSISTENCE_FAILED";
const immutableConflict = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION_PERSISTENCE_IMMUTABLE_CONFLICT";

const fail = (code: string): never => { throw new Error(code); };
const same = (left: unknown, right: unknown): boolean =>
  stableCareerOutcomeValenceFeedbackContextRevision(left) ===
  stableCareerOutcomeValenceFeedbackContextRevision(right);

/**
 * Concrete immutable COVFCR storage for the T13H bound persister and T13I readers.
 * It stores exact history and verifies row/payload coherence; T13H alone owns parent
 * resolution and semantic persistence decisions. No physical byte representation is authority.
 */
export class PostgresCareerOutcomeValenceFeedbackContextRevisionRepository {
  constructor(private readonly database: PostgresJsDatabase<any>) {}

  private async stored(
    revisionId: string,
  ): Promise<CareerOutcomeValenceFeedbackContextRevision | null> {
    const rows = await this.database.select()
      .from(careerOutcomeValenceFeedbackContextRevisions)
      .where(eq(
        careerOutcomeValenceFeedbackContextRevisions.careerOutcomeValenceFeedbackContextRevisionId,
        revisionId,
      ))
      .limit(1);
    if (rows.length === 0) return null;

    const row = rows[0];
    const value = structuredClone(row.payload);
    assertCareerOutcomeValenceFeedbackContextRevision(value);
    if (
      row.careerOutcomeValenceFeedbackContextRevisionId !== revisionId ||
      row.careerOutcomeValenceFeedbackContextRevisionId !==
        value.careerOutcomeValenceFeedbackContextRevisionId ||
      row.parentRevisionKind !== value.parent.parentRevisionKind ||
      row.parentRevisionId !== value.parent.parentRevisionId ||
      row.schemaVersion !== value.schemaVersion ||
      row.createdAt !== value.createdAt
    ) fail(failed);
    return structuredClone(value);
  }

  async getCareerOutcomeValenceFeedbackContextRevisionById(
    revisionId: string,
  ): Promise<CareerOutcomeValenceFeedbackContextRevision | null> {
    try {
      return await this.stored(revisionId);
    } catch {
      return fail(failed);
    }
  }

  async writeCareerOutcomeValenceFeedbackContextRevision(
    revision: CareerOutcomeValenceFeedbackContextRevision,
  ): Promise<void> {
    let expected: CareerOutcomeValenceFeedbackContextRevision;
    try {
      assertCareerOutcomeValenceFeedbackContextRevision(revision);
      expected = structuredClone(revision);
    } catch {
      return fail(failed);
    }

    try {
      const prior = await this.stored(expected.careerOutcomeValenceFeedbackContextRevisionId);
      if (prior !== null) {
        if (!same(prior, expected)) fail(immutableConflict);
        return;
      }

      await this.database.transaction(async transaction => {
        await transaction.insert(careerOutcomeValenceFeedbackContextRevisions).values({
          careerOutcomeValenceFeedbackContextRevisionId:
            expected.careerOutcomeValenceFeedbackContextRevisionId,
          parentRevisionKind: expected.parent.parentRevisionKind,
          parentRevisionId: expected.parent.parentRevisionId,
          schemaVersion: expected.schemaVersion,
          createdAt: expected.createdAt,
          payload: structuredClone(expected),
        }).onConflictDoNothing();
      });

      // A concurrent immutable insert remains either the exact same artifact or a conflict.
      const stored = await this.stored(expected.careerOutcomeValenceFeedbackContextRevisionId);
      if (stored === null) fail(failed);
      if (!same(stored, expected)) fail(immutableConflict);
    } catch (error) {
      if (error instanceof Error && error.message === immutableConflict) throw error;
      return fail(failed);
    }
  }
}
