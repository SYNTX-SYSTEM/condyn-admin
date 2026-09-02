import type { TargetRoleProfileRevision } from "../../target/role";
import { targetRoleOrganizationBindingRevisions } from "../role-organization-binding-revision-persistence/postgres-schema";
import { type AnyPgColumn, jsonb, pgTable, text } from "drizzle-orm/pg-core";
/** Physical FKs preserve exact lineage only; storage never grants proposal authority. */
export const targetRoleProfileRevisions = pgTable("target_role_profile_revisions", {
  targetRoleProfileRevisionId: text("target_role_profile_revision_id").primaryKey(),
  targetRoleEntityId: text("target_role_entity_id").notNull(),
  targetRoleOrganizationBindingRevisionId: text("target_role_organization_binding_revision_id").notNull().references(() => targetRoleOrganizationBindingRevisions.targetRoleOrganizationBindingRevisionId, { onDelete: "restrict" }),
  previousRevisionId: text("previous_revision_id").references((): AnyPgColumn => targetRoleProfileRevisions.targetRoleProfileRevisionId, { onDelete: "restrict" }),
  payload: jsonb("payload").$type<TargetRoleProfileRevision>().notNull()
});
