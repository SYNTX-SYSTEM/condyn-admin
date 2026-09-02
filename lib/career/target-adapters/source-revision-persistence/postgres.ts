import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import {
  assertTargetSourceRevision,
  createBoundTargetSourceRevisionPersister,
  sameTargetSourceRevisionData,
  type BoundTargetSourceRevisionPersister,
  type TargetSourceRevision,
  type TargetSourceRevisionRepository
} from "../../target/source";
import { targetSourceRevisions } from "./postgres-schema";

const invalidRecord = (): never => {
  throw new Error("ERR_TARGET_SOURCE_REVISION_POSTGRES_RECORD_INVALID");
};

interface PersistedTargetSourceRevisionRow {
  targetSourceRevisionId: unknown;
  targetSourceEntityId: unknown;
  previousRevisionId: unknown;
  payload: unknown;
}

function capturePersistedRevision(
  row: PersistedTargetSourceRevisionRow,
  requestedRevisionId?: string
): TargetSourceRevision {
  try {
    if (
      typeof row.targetSourceRevisionId !== "string" ||
      typeof row.targetSourceEntityId !== "string" ||
      (row.previousRevisionId !== null && typeof row.previousRevisionId !== "string") ||
      (requestedRevisionId !== undefined && row.targetSourceRevisionId !== requestedRevisionId)
    ) return invalidRecord();
    const revision = structuredClone(row.payload) as TargetSourceRevision;
    assertTargetSourceRevision(revision);
    if (
      revision.targetSourceRevisionId !== row.targetSourceRevisionId ||
      revision.targetSourceEntityId !== row.targetSourceEntityId ||
      revision.previousRevisionId !== row.previousRevisionId
    ) return invalidRecord();
    return structuredClone(revision);
  } catch {
    return invalidRecord();
  }
}

/**
 * Concrete PostgreSQL composition. Raw insert is private; callers receive a bound persister.
 * Primary-key conflict is resolved by rereading the durable winner: exact equality is replay,
 * while divergence is an immutable conflict rather than an update or replacement.
 */
export class PostgresTargetSourceRevisionRepository implements TargetSourceRevisionRepository {
  constructor(private readonly database: PostgresJsDatabase) {}

  async getRevisionById(targetSourceRevisionId: string): Promise<TargetSourceRevision | null> {
    const rows = await this.database
      .select()
      .from(targetSourceRevisions)
      .where(eq(targetSourceRevisions.targetSourceRevisionId, targetSourceRevisionId))
      .limit(1);
    if (rows.length === 0) return null;
    return capturePersistedRevision(rows[0], targetSourceRevisionId);
  }

  createTargetSourceRevisionPersister(): BoundTargetSourceRevisionPersister {
    return createBoundTargetSourceRevisionPersister({
      getRevisionById: this.getRevisionById.bind(this),
      writeRevision: this.#writeRevision.bind(this)
    });
  }

  async #writeRevision(revision: TargetSourceRevision): Promise<void> {
    const inserted = await this.database
      .insert(targetSourceRevisions)
      .values({
        targetSourceRevisionId: revision.targetSourceRevisionId,
        targetSourceEntityId: revision.targetSourceEntityId,
        previousRevisionId: revision.previousRevisionId,
        payload: structuredClone(revision)
      })
      .onConflictDoNothing()
      .returning({ targetSourceRevisionId: targetSourceRevisions.targetSourceRevisionId });
    if (inserted.length === 1) return;
    const winner = await this.getRevisionById(revision.targetSourceRevisionId);
    if (winner === null) throw new Error("ERR_TARGET_SOURCE_REVISION_PERSISTENCE_INVALID");
    if (!sameTargetSourceRevisionData(winner, revision)) {
      throw new Error("ERR_TARGET_SOURCE_REVISION_IMMUTABLE_CONFLICT");
    }
  }
}
