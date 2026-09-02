import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import {
  assertTargetOrganizationRevision,
  createBoundTargetOrganizationRevisionPersister,
  sameTargetOrganizationRevisionData,
  type BoundTargetOrganizationRevisionPersister,
  type TargetOrganizationRevision,
  type TargetOrganizationRevisionRepository
} from "../../target/organization";
import { targetOrganizationRevisions } from "./postgres-schema";

const invalidRecord = (): never => {
  throw new Error("ERR_TARGET_ORGANIZATION_REVISION_POSTGRES_RECORD_INVALID");
};

interface PersistedTargetOrganizationRevisionRow {
  targetOrganizationRevisionId: unknown;
  targetOrganizationEntityId: unknown;
  previousRevisionId: unknown;
  payload: unknown;
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function capturePersistedRevision(
  row: PersistedTargetOrganizationRevisionRow,
  requestedRevisionId?: string
): TargetOrganizationRevision {
  try {
    if (
      !nonEmptyString(row.targetOrganizationRevisionId) ||
      !nonEmptyString(row.targetOrganizationEntityId) ||
      (row.previousRevisionId !== null && !nonEmptyString(row.previousRevisionId)) ||
      (requestedRevisionId !== undefined && row.targetOrganizationRevisionId !== requestedRevisionId)
    ) return invalidRecord();
    const revision = structuredClone(row.payload) as TargetOrganizationRevision;
    assertTargetOrganizationRevision(revision);
    if (
      revision.targetOrganizationRevisionId !== row.targetOrganizationRevisionId ||
      revision.targetOrganizationEntityId !== row.targetOrganizationEntityId ||
      revision.previousRevisionId !== row.previousRevisionId
    ) return invalidRecord();
    return structuredClone(revision);
  } catch {
    return invalidRecord();
  }
}

export class PostgresTargetOrganizationRevisionRepository implements TargetOrganizationRevisionRepository {
  constructor(private readonly database: PostgresJsDatabase) {}

  async getRevisionById(targetOrganizationRevisionId: string): Promise<TargetOrganizationRevision | null> {
    const rows = await this.database
      .select()
      .from(targetOrganizationRevisions)
      .where(eq(targetOrganizationRevisions.targetOrganizationRevisionId, targetOrganizationRevisionId))
      .limit(1);
    if (rows.length === 0) return null;
    return capturePersistedRevision(rows[0], targetOrganizationRevisionId);
  }

  createTargetOrganizationRevisionPersister(): BoundTargetOrganizationRevisionPersister {
    return createBoundTargetOrganizationRevisionPersister({
      getRevisionById: this.getRevisionById.bind(this),
      writeRevision: this.#writeRevision.bind(this)
    });
  }

  async #writeRevision(revision: TargetOrganizationRevision): Promise<void> {
    const inserted = await this.database
      .insert(targetOrganizationRevisions)
      .values({
        targetOrganizationRevisionId: revision.targetOrganizationRevisionId,
        targetOrganizationEntityId: revision.targetOrganizationEntityId,
        previousRevisionId: revision.previousRevisionId,
        payload: structuredClone(revision)
      })
      .onConflictDoNothing()
      .returning({ targetOrganizationRevisionId: targetOrganizationRevisions.targetOrganizationRevisionId });
    if (inserted.length === 1) return;
    let winner: TargetOrganizationRevision | null;
    try {
      winner = await this.getRevisionById(revision.targetOrganizationRevisionId);
    } catch (error) {
      if (error instanceof Error && error.message === "ERR_TARGET_ORGANIZATION_REVISION_POSTGRES_RECORD_INVALID") {
        throw new Error("ERR_TARGET_ORGANIZATION_REVISION_PERSISTENCE_INVALID");
      }
      throw error;
    }
    if (winner === null) throw new Error("ERR_TARGET_ORGANIZATION_REVISION_PERSISTENCE_INVALID");
    if (!sameTargetOrganizationRevisionData(winner, revision)) {
      throw new Error("ERR_TARGET_ORGANIZATION_REVISION_IMMUTABLE_CONFLICT");
    }
  }
}
