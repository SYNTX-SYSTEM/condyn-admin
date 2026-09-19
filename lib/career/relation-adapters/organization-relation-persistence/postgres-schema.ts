import { jsonb, pgTable, text } from "drizzle-orm/pg-core";
import { careerCapabilitySnapshots } from "../../db/schema";
import type { OrganizationRelation } from "../../relation/organization-relation";
import { roleRelations } from "../role-relation-persistence/postgres-schema";
import { targetOrganizationRevisions } from "../../target-adapters/organization-revision-persistence/postgres-schema";
import { targetRoleOrganizationBindingRevisions } from "../../target-adapters/role-organization-binding-revision-persistence/postgres-schema";
import { targetRoleProfileRevisions } from "../../target-adapters/role-profile-revision-persistence/postgres-schema";

/** Immutable OrganizationRelation payload plus normalized identity witnesses; no fit or resonance score is stored. */
export const organizationRelations = pgTable("organization_relations", {
  organizationRelationId: text("organization_relation_id").primaryKey(),
  verifiedCapabilitySnapshotId: text("verified_capability_snapshot_id").notNull().references(() => careerCapabilitySnapshots.snapshotId, { onDelete: "restrict" }),
  targetOrganizationRevisionId: text("target_organization_revision_id").notNull().references(() => targetOrganizationRevisions.targetOrganizationRevisionId, { onDelete: "restrict" }),
  payload: jsonb("payload").$type<OrganizationRelation>().notNull(),
});

export const organizationRelationMemberships = pgTable("organization_relation_memberships", {
  referenceId: text("reference_id").primaryKey(),
  organizationRelationId: text("organization_relation_id").notNull().references(() => organizationRelations.organizationRelationId, { onDelete: "restrict" }),
  roleRelationId: text("role_relation_id").notNull().references(() => roleRelations.roleRelationId, { onDelete: "restrict" }),
  targetRoleProfileRevisionId: text("target_role_profile_revision_id").notNull().references(() => targetRoleProfileRevisions.targetRoleProfileRevisionId, { onDelete: "restrict" }),
  targetRoleOrganizationBindingRevisionId: text("target_role_organization_binding_revision_id").notNull().references(() => targetRoleOrganizationBindingRevisions.targetRoleOrganizationBindingRevisionId, { onDelete: "restrict" }),
});
