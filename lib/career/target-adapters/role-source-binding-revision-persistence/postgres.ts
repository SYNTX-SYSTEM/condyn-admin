import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import {
  assertTargetRoleSourceBindingRevision,
  createBoundTargetRoleSourceBindingRevisionPersister,
  sameTargetRoleSourceBindingRevisionData,
  type BoundTargetRoleSourceBindingRevisionPersister,
  type TargetRoleSourceBindingRevision,
  type TargetRoleSourceBindingRevisionRepository,
  type TargetRoleSourceBindingSourceRevisionLookup
} from "../../target/role";
import { targetRoleSourceBindingRevisions } from "./postgres-schema";

const invalidRecord = (): never => {
  throw new Error("ERR_TARGET_ROLE_SOURCE_BINDING_REVISION_POSTGRES_RECORD_INVALID");
};

interface PersistedTargetRoleSourceBindingRevisionRow {
  targetRoleSourceBindingRevisionId: unknown;
  targetRoleEntityId: unknown;
  targetSourceRevisionId: unknown;
  previousRevisionId: unknown;
  payload: unknown;
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function capturePersistedRevision(
  row: PersistedTargetRoleSourceBindingRevisionRow,
  requestedRevisionId?: string
): TargetRoleSourceBindingRevision {
  try {
    if (
      !nonEmptyString(row.targetRoleSourceBindingRevisionId) ||
      !nonEmptyString(row.targetRoleEntityId) ||
      !nonEmptyString(row.targetSourceRevisionId) ||
      (row.previousRevisionId !== null && !nonEmptyString(row.previousRevisionId)) ||
      (requestedRevisionId !== undefined && row.targetRoleSourceBindingRevisionId !== requestedRevisionId)
    ) return invalidRecord();
    const revision = structuredClone(row.payload) as TargetRoleSourceBindingRevision;
    assertTargetRoleSourceBindingRevision(revision);
    if (
      revision.targetRoleSourceBindingRevisionId !== row.targetRoleSourceBindingRevisionId ||
      revision.targetRoleEntityId !== row.targetRoleEntityId ||
      revision.targetSourceRevisionId !== row.targetSourceRevisionId ||
      revision.previousRevisionId !== row.previousRevisionId
    ) return invalidRecord();
    return structuredClone(revision);
  } catch {
    return invalidRecord();
  }
}

/**
 * PostgreSQL persists immutable artifacts only. PK conflict rereads the durable winner: equality
 * is replay/integrity, divergence is conflict, and neither path is update or replacement semantics.
 */
export class PostgresTargetRoleSourceBindingRevisionRepository implements TargetRoleSourceBindingRevisionRepository {
  constructor(
    private readonly database: PostgresJsDatabase,
    private readonly sourceLookup: TargetRoleSourceBindingSourceRevisionLookup
  ) {}

  async getRevisionById(
    targetRoleSourceBindingRevisionId: string
  ): Promise<TargetRoleSourceBindingRevision | null> {
    const rows = await this.database
      .select()
      .from(targetRoleSourceBindingRevisions)
      .where(eq(targetRoleSourceBindingRevisions.targetRoleSourceBindingRevisionId, targetRoleSourceBindingRevisionId))
      .limit(1);
    if (rows.length === 0) return null;
    return capturePersistedRevision(rows[0], targetRoleSourceBindingRevisionId);
  }

  createTargetRoleSourceBindingRevisionPersister(): BoundTargetRoleSourceBindingRevisionPersister {
    return createBoundTargetRoleSourceBindingRevisionPersister({
      getRevisionById: this.getRevisionById.bind(this),
      getTargetSourceRevisionById: this.sourceLookup.getTargetSourceRevisionById.bind(this.sourceLookup),
      writeRevision: this.#writeRevision.bind(this)
    });
  }

  async #writeRevision(revision: TargetRoleSourceBindingRevision): Promise<void> {
    const inserted = await this.database
      .insert(targetRoleSourceBindingRevisions)
      .values({
        targetRoleSourceBindingRevisionId: revision.targetRoleSourceBindingRevisionId,
        targetRoleEntityId: revision.targetRoleEntityId,
        targetSourceRevisionId: revision.targetSourceRevisionId,
        previousRevisionId: revision.previousRevisionId,
        payload: structuredClone(revision)
      })
      .onConflictDoNothing()
      .returning({ targetRoleSourceBindingRevisionId: targetRoleSourceBindingRevisions.targetRoleSourceBindingRevisionId });
    if (inserted.length === 1) return;
    let winner: TargetRoleSourceBindingRevision | null;
    try {
      winner = await this.getRevisionById(revision.targetRoleSourceBindingRevisionId);
    } catch (error) {
      if (error instanceof Error && error.message === "ERR_TARGET_ROLE_SOURCE_BINDING_REVISION_POSTGRES_RECORD_INVALID") {
        throw new Error("ERR_TARGET_ROLE_SOURCE_BINDING_REVISION_PERSISTENCE_INVALID");
      }
      throw error;
    }
    if (winner === null) throw new Error("ERR_TARGET_ROLE_SOURCE_BINDING_REVISION_PERSISTENCE_INVALID");
    if (!sameTargetRoleSourceBindingRevisionData(winner, revision)) {
      throw new Error("ERR_TARGET_ROLE_SOURCE_BINDING_REVISION_IMMUTABLE_CONFLICT");
    }
  }
}
