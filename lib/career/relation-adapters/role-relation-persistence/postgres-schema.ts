import { jsonb, pgTable, text } from "drizzle-orm/pg-core";
import { careerCapabilitySnapshots } from "../../db/schema";
import { requirementRelationAggregates, targetRoleRequirementInventories } from "../requirement-inventory-persistence/postgres-schema";
import { targetRoleProfileRevisions } from "../../target-adapters/role-profile-revision-persistence/postgres-schema";
import { targetRequirementRevisions } from "../../target-adapters/role-requirement-revision-persistence/postgres-schema";
import type { RoleRelation } from "../../relation/role-relation";

/** These tables normalize immutable upstream references; they add no role conclusion. */
export const roleRelations = pgTable("role_relations", {
  roleRelationId: text("role_relation_id").primaryKey(),
  targetRoleProfileRevisionId: text("target_role_profile_revision_id").notNull().references(() => targetRoleProfileRevisions.targetRoleProfileRevisionId, { onDelete: "restrict" }),
  targetRoleRequirementInventoryId: text("target_role_requirement_inventory_id").notNull().references(() => targetRoleRequirementInventories.targetRoleRequirementInventoryId, { onDelete: "restrict" }),
  verifiedCapabilitySnapshotId: text("verified_capability_snapshot_id").notNull().references(() => careerCapabilitySnapshots.snapshotId, { onDelete: "restrict" }),
  payload: jsonb("payload").$type<RoleRelation>().notNull(),
});
export const roleRelationAggregateReferences = pgTable("role_relation_aggregate_references", {
  referenceId: text("reference_id").primaryKey(),
  roleRelationId: text("role_relation_id").notNull().references(() => roleRelations.roleRelationId, { onDelete: "restrict" }),
  requirementRelationAggregateId: text("requirement_relation_aggregate_id").notNull().references(() => requirementRelationAggregates.requirementRelationAggregateId, { onDelete: "restrict" }),
});
export const roleRelationCoverageReferences = pgTable("role_relation_coverage_references", {
  referenceId: text("reference_id").primaryKey(),
  roleRelationId: text("role_relation_id").notNull().references(() => roleRelations.roleRelationId, { onDelete: "restrict" }),
  targetRequirementEntityId: text("target_requirement_entity_id").notNull(),
  targetRequirementRevisionId: text("target_requirement_revision_id").notNull().references(() => targetRequirementRevisions.targetRequirementRevisionId, { onDelete: "restrict" }),
  disposition: text("disposition").notNull(),
});
