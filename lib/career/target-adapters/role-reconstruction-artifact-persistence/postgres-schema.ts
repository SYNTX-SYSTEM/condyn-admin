import { jsonb, pgTable, text } from "drizzle-orm/pg-core";
import type { TargetRoleReconstructionBatchRun, TargetRoleReconstructionResult } from "../../target/role/reconstruction/types";

/** Durable audit storage for T3B role profile reconstruction; it publishes no profile authority. */
export const targetRoleReconstructionBatchRuns = pgTable("target_role_reconstruction_batch_runs", {
  targetRoleReconstructionBatchRunId: text("target_role_reconstruction_batch_run_id").primaryKey(),
  rawProviderOutputHash: text("raw_provider_output_hash"),
  rawProviderOutput: text("raw_provider_output"),
  payload: jsonb("payload").$type<TargetRoleReconstructionBatchRun>().notNull()
});

export const targetRoleReconstructionResults = pgTable("target_role_reconstruction_results", {
  targetRoleReconstructionResultId: text("target_role_reconstruction_result_id").primaryKey(),
  targetRoleReconstructionBatchRunId: text("target_role_reconstruction_batch_run_id").notNull()
    .references(() => targetRoleReconstructionBatchRuns.targetRoleReconstructionBatchRunId, { onDelete: "restrict" }),
  payload: jsonb("payload").$type<TargetRoleReconstructionResult>().notNull()
});
