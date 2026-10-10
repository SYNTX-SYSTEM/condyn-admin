import { createHash } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { createTargetRoleReconstructionBatchRun } from "../../target/role/reconstruction/contract";
import type { TargetRoleReconstructionArtifactPersistence } from "../../target/role/reconstruction/producer";
import type { TargetRoleReconstructionBatchRun, TargetRoleReconstructionResult } from "../../target/role/reconstruction/types";
import { targetRoleReconstructionBatchRuns, targetRoleReconstructionResults } from "./postgres-schema";

const fail = (code: string): never => { throw new Error(code); };
const stable = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map(key => `${JSON.stringify(key)}:${stable(record[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
};
const same = (left: unknown, right: unknown) => stable(left) === stable(right);
const sha256 = (value: string) => createHash("sha256").update(value, "utf8").digest("hex");

/**
 * PostgreSQL counterpart of InMemoryTargetRoleReconstructionArtifactRepository with the same semantics:
 * exact reads, immutable idempotent writes, raw provider bytes bound to their recorded hash.
 * JSONB reorders keys, so equality is checked on key-sorted JSON.
 */
export class PostgresTargetRoleReconstructionArtifactRepository implements TargetRoleReconstructionArtifactPersistence {
  constructor(private readonly database: PostgresJsDatabase) {}

  async getBatchRunById(id: string): Promise<TargetRoleReconstructionBatchRun | null> {
    const rows = await this.database.select().from(targetRoleReconstructionBatchRuns).where(eq(targetRoleReconstructionBatchRuns.targetRoleReconstructionBatchRunId, id)).limit(1);
    if (!rows.length) return null;
    const batch = createTargetRoleReconstructionBatchRun(rows[0].payload);
    if (batch.targetRoleReconstructionBatchRunId !== id) fail("ERR_TARGET_ROLE_RECONSTRUCTION_ARTIFACT_PERSISTENCE_INVALID");
    return batch;
  }

  async getRawProviderOutput(ref: string): Promise<string | null> {
    const rows = await this.database.select().from(targetRoleReconstructionBatchRuns)
      .where(sql`${targetRoleReconstructionBatchRuns.payload}->>'rawProviderOutputRef' = ${ref}`).limit(1);
    const row = rows[0];
    if (!row || row.rawProviderOutput === null) return null;
    if (sha256(row.rawProviderOutput) !== row.rawProviderOutputHash) fail("ERR_TARGET_ROLE_RECONSTRUCTION_ARTIFACT_PERSISTENCE_INVALID");
    return row.rawProviderOutput;
  }

  async getResultById(id: string): Promise<TargetRoleReconstructionResult | null> {
    const rows = await this.database.select().from(targetRoleReconstructionResults).where(eq(targetRoleReconstructionResults.targetRoleReconstructionResultId, id)).limit(1);
    if (!rows.length) return null;
    if (rows[0].payload.targetRoleReconstructionResultId !== id) fail("ERR_TARGET_ROLE_RECONSTRUCTION_ARTIFACT_PERSISTENCE_INVALID");
    return structuredClone(rows[0].payload);
  }

  async persistBatchRun(value: TargetRoleReconstructionBatchRun, rawProviderOutput: string | null): Promise<TargetRoleReconstructionBatchRun> {
    const batch = createTargetRoleReconstructionBatchRun(value);
    if (batch.rawProviderOutputRef !== null) {
      if (rawProviderOutput === null || sha256(rawProviderOutput) !== batch.rawProviderOutputHash) fail("ERR_TARGET_ROLE_RECONSTRUCTION_BATCH_RUN_RAW_OUTPUT_INVALID");
    } else if (rawProviderOutput !== null) fail("ERR_TARGET_ROLE_RECONSTRUCTION_BATCH_RUN_RAW_OUTPUT_INVALID");
    await this.database.insert(targetRoleReconstructionBatchRuns).values({
      targetRoleReconstructionBatchRunId: batch.targetRoleReconstructionBatchRunId,
      rawProviderOutputHash: batch.rawProviderOutputHash,
      rawProviderOutput,
      payload: batch
    }).onConflictDoNothing();
    const stored = await this.getBatchRunById(batch.targetRoleReconstructionBatchRunId);
    if (stored === null) return fail("ERR_TARGET_ROLE_RECONSTRUCTION_ARTIFACT_PERSISTENCE_INVALID");
    if (!same(stored, batch)) fail("ERR_TARGET_ROLE_RECONSTRUCTION_BATCH_RUN_IMMUTABLE_CONFLICT");
    return stored;
  }

  async persistResult(value: TargetRoleReconstructionResult): Promise<TargetRoleReconstructionResult> {
    if (await this.getBatchRunById(value.targetRoleReconstructionBatchRunId) === null) fail("ERR_TARGET_ROLE_RECONSTRUCTION_BATCH_NOT_FOUND");
    await this.database.insert(targetRoleReconstructionResults).values({
      targetRoleReconstructionResultId: value.targetRoleReconstructionResultId,
      targetRoleReconstructionBatchRunId: value.targetRoleReconstructionBatchRunId,
      payload: structuredClone(value)
    }).onConflictDoNothing();
    const stored = await this.getResultById(value.targetRoleReconstructionResultId);
    if (stored === null) return fail("ERR_TARGET_ROLE_RECONSTRUCTION_ARTIFACT_PERSISTENCE_INVALID");
    if (!same(stored, value)) fail("ERR_TARGET_ROLE_RECONSTRUCTION_RESULT_IMMUTABLE_CONFLICT");
    return stored;
  }
}
