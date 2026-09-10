import { jsonb, pgTable, text } from "drizzle-orm/pg-core";
import { careerCapabilitySnapshots } from "../../db/schema";
import { capabilityRequirementRelationEvaluationResults, capabilityRequirementRelations } from "../capability-requirement-persistence/postgres-schema";
import { requirementRelationAggregates, targetRoleRequirementInventories } from "../requirement-inventory-persistence/postgres-schema";
import { roleRelations } from "../role-relation-persistence/postgres-schema";
import { tensionStates } from "../tension-state-persistence/postgres-schema";
import { targetRoleProfileRevisions } from "../../target-adapters/role-profile-revision-persistence/postgres-schema";
import { targetRequirementRevisions } from "../../target-adapters/role-requirement-revision-persistence/postgres-schema";
import type { EvolutionInputState } from "../../relation/evolution-input";

/** Physical and normalized witnesses make historical T9 payload tampering fail closed without creating another authority source. */
export const evolutionInputStates=pgTable("evolution_input_states",{
  evolutionInputStateId:text("evolution_input_state_id").primaryKey(),
  tensionStateId:text("tension_state_id").notNull().references(()=>tensionStates.tensionStateId,{onDelete:"restrict"}),
  roleRelationId:text("role_relation_id").notNull().references(()=>roleRelations.roleRelationId,{onDelete:"restrict"}),
  verifiedCapabilitySnapshotId:text("verified_capability_snapshot_id").notNull().references(()=>careerCapabilitySnapshots.snapshotId,{onDelete:"restrict"}),
  targetRoleProfileRevisionId:text("target_role_profile_revision_id").notNull().references(()=>targetRoleProfileRevisions.targetRoleProfileRevisionId,{onDelete:"restrict"}),
  targetRoleRequirementInventoryId:text("target_role_requirement_inventory_id").notNull().references(()=>targetRoleRequirementInventories.targetRoleRequirementInventoryId,{onDelete:"restrict"}),
  payload:jsonb("payload").$type<EvolutionInputState>().notNull(),
});
export const evolutionInputItemReferences=pgTable("evolution_input_item_references",{
  referenceId:text("reference_id").primaryKey(), evolutionInputStateId:text("evolution_input_state_id").notNull().references(()=>evolutionInputStates.evolutionInputStateId,{onDelete:"restrict"}), itemKey:text("item_key").notNull(),
});
export const evolutionInputRequirementReferences=pgTable("evolution_input_requirement_references",{
  referenceId:text("reference_id").primaryKey(), evolutionInputStateId:text("evolution_input_state_id").notNull().references(()=>evolutionInputStates.evolutionInputStateId,{onDelete:"restrict"}), targetRequirementEntityId:text("target_requirement_entity_id").notNull(), targetRequirementRevisionId:text("target_requirement_revision_id").notNull().references(()=>targetRequirementRevisions.targetRequirementRevisionId,{onDelete:"restrict"}),
});
export const evolutionInputAggregateReferences=pgTable("evolution_input_aggregate_references",{
  referenceId:text("reference_id").primaryKey(), evolutionInputStateId:text("evolution_input_state_id").notNull().references(()=>evolutionInputStates.evolutionInputStateId,{onDelete:"restrict"}), requirementRelationAggregateId:text("requirement_relation_aggregate_id").notNull().references(()=>requirementRelationAggregates.requirementRelationAggregateId,{onDelete:"restrict"}),
});
export const evolutionInputRelationReferences=pgTable("evolution_input_relation_references",{
  referenceId:text("reference_id").primaryKey(), evolutionInputStateId:text("evolution_input_state_id").notNull().references(()=>evolutionInputStates.evolutionInputStateId,{onDelete:"restrict"}), capabilityRequirementRelationId:text("capability_requirement_relation_id").notNull().references(()=>capabilityRequirementRelations.capabilityRequirementRelationId,{onDelete:"restrict"}),
});
export const evolutionInputEvaluationResultReferences=pgTable("evolution_input_evaluation_result_references",{
  referenceId:text("reference_id").primaryKey(), evolutionInputStateId:text("evolution_input_state_id").notNull().references(()=>evolutionInputStates.evolutionInputStateId,{onDelete:"restrict"}), capabilityRequirementRelationEvaluationResultId:text("capability_requirement_relation_evaluation_result_id").notNull().references(()=>capabilityRequirementRelationEvaluationResults.capabilityRequirementRelationEvaluationResultId,{onDelete:"restrict"}),
});
export const evolutionInputCandidateOperandReferences=pgTable("evolution_input_candidate_operand_references",{
  referenceId:text("reference_id").primaryKey(), evolutionInputStateId:text("evolution_input_state_id").notNull().references(()=>evolutionInputStates.evolutionInputStateId,{onDelete:"restrict"}), candidateCapabilityOperandId:text("candidate_capability_operand_id").notNull(),
});
