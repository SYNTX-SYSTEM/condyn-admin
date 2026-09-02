import type { TargetRoleOrganizationBindingRevision } from "../../target/role";
import { targetOrganizationRevisions } from "../organization-revision-persistence/postgres-schema";
import { targetRoleSourceBindingRevisions } from "../role-source-binding-revision-persistence/postgres-schema";
import { type AnyPgColumn, jsonb, pgTable, text } from "drizzle-orm/pg-core";
/** Storage FKs protect exact operand and lineage references, never verification or authority. */
export const targetRoleOrganizationBindingRevisions = pgTable("target_role_organization_binding_revisions", {
  targetRoleOrganizationBindingRevisionId: text("target_role_organization_binding_revision_id").primaryKey(),
  targetRoleEntityId: text("target_role_entity_id").notNull(),
  targetRoleSourceBindingRevisionId: text("target_role_source_binding_revision_id").notNull().references(() => targetRoleSourceBindingRevisions.targetRoleSourceBindingRevisionId, { onDelete: "restrict" }),
  targetOrganizationRevisionId: text("target_organization_revision_id").notNull().references(() => targetOrganizationRevisions.targetOrganizationRevisionId, { onDelete: "restrict" }),
  previousRevisionId: text("previous_revision_id").references((): AnyPgColumn => targetRoleOrganizationBindingRevisions.targetRoleOrganizationBindingRevisionId, { onDelete: "restrict" }),
  payload: jsonb("payload").$type<TargetRoleOrganizationBindingRevision>().notNull()
});
