import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { assertDecisionContextRevision, type DecisionContextRevision } from "../../decision-core/revisions";
import { createBoundDecisionContextRevisionPersister, sameDecisionContextRevisionData } from "../../decision-core/revision-persistence/persister";
import type { BoundDecisionContextRevisionPersister, DecisionContextRevisionRepository } from "../../decision-core/revision-persistence";
import { decisionContextRevisions } from "./postgres-schema";

const postgresRecordInvalid = (): never => { throw new Error("ERR_DECISION_CONTEXT_REVISION_POSTGRES_RECORD_INVALID"); };

interface PersistedRevisionRow {
  revisionId: unknown;
  previousRevisionId: unknown;
  payload: unknown;
}

function capturePersistedRevision(row: PersistedRevisionRow, requestedRevisionId?: string): DecisionContextRevision {
  try {
    if (typeof row.revisionId !== "string" || (row.previousRevisionId !== null && typeof row.previousRevisionId !== "string")) return postgresRecordInvalid();
    if (requestedRevisionId !== undefined && row.revisionId !== requestedRevisionId) return postgresRecordInvalid();
    const revision = structuredClone(row.payload) as DecisionContextRevision;
    assertDecisionContextRevision(revision);
    if (revision.revisionId !== row.revisionId || revision.previousRevisionId !== row.previousRevisionId) return postgresRecordInvalid();
    return structuredClone(revision);
  } catch {
    return postgresRecordInvalid();
  }
}

/** PostgreSQL adapter for the sealed 5D2A persistence semantics. Database provisioning remains external. */
export class PostgresDecisionContextRevisionRepository implements DecisionContextRevisionRepository {
  constructor(private readonly database: PostgresJsDatabase) {}

  async getRevisionById(revisionId: string): Promise<DecisionContextRevision | null> {
    const rows = await this.database
      .select()
      .from(decisionContextRevisions)
      .where(eq(decisionContextRevisions.revisionId, revisionId))
      .limit(1);
    if (rows.length === 0) return null;
    return capturePersistedRevision(rows[0], revisionId);
  }

  createDecisionContextRevisionPersister(): BoundDecisionContextRevisionPersister {
    return createBoundDecisionContextRevisionPersister({
      getRevisionById: this.getRevisionById.bind(this),
      writeRevision: this.#writeRevision.bind(this)
    });
  }

  async #writeRevision(revision: DecisionContextRevision): Promise<void> {
    const inserted = await this.database
      .insert(decisionContextRevisions)
      .values({
        revisionId: revision.revisionId,
        previousRevisionId: revision.previousRevisionId,
        payload: structuredClone(revision)
      })
      .onConflictDoNothing()
      .returning({ revisionId: decisionContextRevisions.revisionId });
    if (inserted.length === 1) return;
    const winner = await this.getRevisionById(revision.revisionId);
    if (winner === null) throw new Error("ERR_DECISION_CONTEXT_REVISION_PERSISTENCE_INVALID");
    if (!sameDecisionContextRevisionData(winner, revision)) throw new Error("ERR_DECISION_CONTEXT_REVISION_IMMUTABLE_CONFLICT");
  }
}
