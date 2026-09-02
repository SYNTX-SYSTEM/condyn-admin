import { createHash } from "node:crypto";
import { createTargetRoleReconstructionBatchRun } from "./contract";
import type { TargetRoleReconstructionBatchRun, TargetRoleReconstructionResult } from "./types";

const same = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right);
/** Immutable audit storage for byte replay/provider audit; it does not publish profile authority. */
export class InMemoryTargetRoleReconstructionArtifactRepository {
  readonly #batches = new Map<string, TargetRoleReconstructionBatchRun>();
  readonly #results = new Map<string, TargetRoleReconstructionResult>();
  readonly #raw = new Map<string, string>();
  async getBatchRunById(id: string): Promise<TargetRoleReconstructionBatchRun | null> { const value = this.#batches.get(id); return value ? structuredClone(value) : null; }
  async getResultById(id: string): Promise<TargetRoleReconstructionResult | null> { const value = this.#results.get(id); return value ? structuredClone(value) : null; }
  async getRawProviderOutput(ref: string): Promise<string | null> { return this.#raw.get(ref) ?? null; }
  async persistBatchRun(value: TargetRoleReconstructionBatchRun, rawProviderOutput: string | null): Promise<TargetRoleReconstructionBatchRun> { const batch = createTargetRoleReconstructionBatchRun(value); if (batch.rawProviderOutputRef !== null) { if (rawProviderOutput === null || createHash("sha256").update(rawProviderOutput, "utf8").digest("hex") !== batch.rawProviderOutputHash) throw new Error("ERR_TARGET_ROLE_RECONSTRUCTION_BATCH_RUN_RAW_OUTPUT_INVALID"); this.#raw.set(batch.rawProviderOutputRef, rawProviderOutput); } else if (rawProviderOutput !== null) throw new Error("ERR_TARGET_ROLE_RECONSTRUCTION_BATCH_RUN_RAW_OUTPUT_INVALID"); const existing = this.#batches.get(batch.targetRoleReconstructionBatchRunId); if (existing && !same(existing, batch)) throw new Error("ERR_TARGET_ROLE_RECONSTRUCTION_BATCH_RUN_IMMUTABLE_CONFLICT"); this.#batches.set(batch.targetRoleReconstructionBatchRunId, structuredClone(batch)); return structuredClone(batch); }
  async persistResult(value: TargetRoleReconstructionResult): Promise<TargetRoleReconstructionResult> { const existing = this.#results.get(value.targetRoleReconstructionResultId); if (existing && !same(existing, value)) throw new Error("ERR_TARGET_ROLE_RECONSTRUCTION_RESULT_IMMUTABLE_CONFLICT"); this.#results.set(value.targetRoleReconstructionResultId, structuredClone(value)); return structuredClone(value); }
}
