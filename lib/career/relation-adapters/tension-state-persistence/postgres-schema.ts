import { jsonb, pgTable, text } from "drizzle-orm/pg-core";
import { careerCapabilitySnapshots } from "../../db/schema";
import { capabilityRequirementRelationEvaluationResults, capabilityRequirementRelations } from "../capability-requirement-persistence/postgres-schema";
import { requirementRelationAggregates, targetRoleRequirementInventories } from "../requirement-inventory-persistence/postgres-schema";
import { roleRelations } from "../role-relation-persistence/postgres-schema";
import { targetRoleProfileRevisions } from "../../target-adapters/role-profile-revision-persistence/postgres-schema";
import { targetRequirementRevisions } from "../../target-adapters/role-requirement-revision-persistence/postgres-schema";
import type { TensionState } from "../../relation/tension-state";

/** Normalized witnesses make the immutable JSON classification tamper-evident without adding authority. */
export const tensionStates=pgTable("tension_states",{
  tensionStateId:text("tension_state_id").primaryKey(),
  roleRelationId:text("role_relation_id").notNull().references(()=>roleRelations.roleRelationId,{onDelete:"restrict"}),
  verifiedCapabilitySnapshotId:text("verified_capability_snapshot_id").notNull().references(()=>careerCapabilitySnapshots.snapshotId,{onDelete:"restrict"}),
  targetRoleProfileRevisionId:text("target_role_profile_revision_id").notNull().references(()=>targetRoleProfileRevisions.targetRoleProfileRevisionId,{onDelete:"restrict"}),
  targetRoleRequirementInventoryId:text("target_role_requirement_inventory_id").notNull().references(()=>targetRoleRequirementInventories.targetRoleRequirementInventoryId,{onDelete:"restrict"}),
  payload:jsonb("payload").$type<TensionState>().notNull(),
});
export const tensionStateRequirementReferences=pgTable("tension_state_requirement_references",{
  referenceId:text("reference_id").primaryKey(), tensionStateId:text("tension_state_id").notNull().references(()=>tensionStates.tensionStateId,{onDelete:"restrict"}), targetRequirementEntityId:text("target_requirement_entity_id").notNull(), targetRequirementRevisionId:text("target_requirement_revision_id").notNull().references(()=>targetRequirementRevisions.targetRequirementRevisionId,{onDelete:"restrict"}),
});
export const tensionStateAggregateReferences=pgTable("tension_state_aggregate_references",{
  referenceId:text("reference_id").primaryKey(), tensionStateId:text("tension_state_id").notNull().references(()=>tensionStates.tensionStateId,{onDelete:"restrict"}), requirementRelationAggregateId:text("requirement_relation_aggregate_id").notNull().references(()=>requirementRelationAggregates.requirementRelationAggregateId,{onDelete:"restrict"}),
});
export const tensionStateRelationReferences=pgTable("tension_state_relation_references",{
  referenceId:text("reference_id").primaryKey(), tensionStateId:text("tension_state_id").notNull().references(()=>tensionStates.tensionStateId,{onDelete:"restrict"}), capabilityRequirementRelationId:text("capability_requirement_relation_id").notNull().references(()=>capabilityRequirementRelations.capabilityRequirementRelationId,{onDelete:"restrict"}),
});
export const tensionStateEvaluationResultReferences=pgTable("tension_state_evaluation_result_references",{
  referenceId:text("reference_id").primaryKey(), tensionStateId:text("tension_state_id").notNull().references(()=>tensionStates.tensionStateId,{onDelete:"restrict"}), capabilityRequirementRelationEvaluationResultId:text("capability_requirement_relation_evaluation_result_id").notNull().references(()=>capabilityRequirementRelationEvaluationResults.capabilityRequirementRelationEvaluationResultId,{onDelete:"restrict"}),
});
export const tensionStateCandidateOperandReferences=pgTable("tension_state_candidate_operand_references",{
  referenceId:text("reference_id").primaryKey(), tensionStateId:text("tension_state_id").notNull().references(()=>tensionStates.tensionStateId,{onDelete:"restrict"}), candidateCapabilityOperandId:text("candidate_capability_operand_id").notNull(),
});
