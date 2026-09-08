import { jsonb, pgTable, text } from "drizzle-orm/pg-core";
import { careerCapabilitySnapshots } from "../../db/schema";
import { targetRequirementRevisions } from "../../target-adapters/role-requirement-revision-persistence/postgres-schema";
import type { CapabilityRequirementRelation, CapabilityRequirementRelationEvaluationResult, CapabilityRequirementRelationEvaluationRun, CapabilityRequirementRelationRawProviderOutputArtifact } from "../../relation/capability-requirement";

/** Physical links preserve exact replay lineage; PostgreSQL is persistence infrastructure, not relation authority. */
export const capabilityRequirementRelationRawProviderOutputs = pgTable("capability_requirement_relation_raw_provider_outputs", {
  rawProviderOutputRef: text("raw_provider_output_ref").primaryKey(),
  rawProviderOutputHash: text("raw_provider_output_hash").notNull(),
  payload: jsonb("payload").$type<CapabilityRequirementRelationRawProviderOutputArtifact>().notNull()
});
export const capabilityRequirementRelationEvaluationRuns = pgTable("capability_requirement_relation_evaluation_runs", {
  capabilityRequirementRelationEvaluationRunId: text("capability_requirement_relation_evaluation_run_id").primaryKey(),
  verifiedCapabilitySnapshotId: text("verified_capability_snapshot_id").notNull().references(() => careerCapabilitySnapshots.snapshotId, { onDelete: "restrict" }),
  targetRequirementRevisionId: text("target_requirement_revision_id").notNull().references(() => targetRequirementRevisions.targetRequirementRevisionId, { onDelete: "restrict" }),
  rawProviderOutputRef: text("raw_provider_output_ref").references(() => capabilityRequirementRelationRawProviderOutputs.rawProviderOutputRef, { onDelete: "restrict" }),
  payload: jsonb("payload").$type<CapabilityRequirementRelationEvaluationRun>().notNull()
});
export const capabilityRequirementRelationEvaluationResults = pgTable("capability_requirement_relation_evaluation_results", {
  capabilityRequirementRelationEvaluationResultId: text("capability_requirement_relation_evaluation_result_id").primaryKey(),
  capabilityRequirementRelationEvaluationRunId: text("capability_requirement_relation_evaluation_run_id").notNull().references(() => capabilityRequirementRelationEvaluationRuns.capabilityRequirementRelationEvaluationRunId, { onDelete: "restrict" }),
  verifiedCapabilitySnapshotId: text("verified_capability_snapshot_id").notNull().references(() => careerCapabilitySnapshots.snapshotId, { onDelete: "restrict" }),
  targetRequirementRevisionId: text("target_requirement_revision_id").notNull().references(() => targetRequirementRevisions.targetRequirementRevisionId, { onDelete: "restrict" }),
  payload: jsonb("payload").$type<CapabilityRequirementRelationEvaluationResult>().notNull()
});
export const capabilityRequirementRelations = pgTable("capability_requirement_relations", {
  capabilityRequirementRelationId: text("capability_requirement_relation_id").primaryKey(),
  capabilityRequirementRelationEvaluationResultId: text("capability_requirement_relation_evaluation_result_id").notNull().references(() => capabilityRequirementRelationEvaluationResults.capabilityRequirementRelationEvaluationResultId, { onDelete: "restrict" }),
  verifiedCapabilitySnapshotId: text("verified_capability_snapshot_id").notNull().references(() => careerCapabilitySnapshots.snapshotId, { onDelete: "restrict" }),
  targetRequirementRevisionId: text("target_requirement_revision_id").notNull().references(() => targetRequirementRevisions.targetRequirementRevisionId, { onDelete: "restrict" }),
  payload: jsonb("payload").$type<CapabilityRequirementRelation>().notNull()
});
