import type { TargetRoleSourceBindingRevision } from "../../target/role";
import { targetSourceRevisions } from "../source-revision-persistence/postgres-schema";
import { type AnyPgColumn, jsonb, pgTable, text } from "drizzle-orm/pg-core";

/**
 * Storage infrastructure only. The exact Source FK protects physical reference integrity, not
 * semantic verification or binding authority; restrictive lineage preserves immutable history.
 */
export const targetRoleSourceBindingRevisions = pgTable("target_role_source_binding_revisions", {
  targetRoleSourceBindingRevisionId: text("target_role_source_binding_revision_id").primaryKey(),
  targetRoleEntityId: text("target_role_entity_id").notNull(),
  targetSourceRevisionId: text("target_source_revision_id").notNull().references(
    () => targetSourceRevisions.targetSourceRevisionId,
    { onDelete: "restrict" }
  ),
  previousRevisionId: text("previous_revision_id").references(
    (): AnyPgColumn => targetRoleSourceBindingRevisions.targetRoleSourceBindingRevisionId,
    { onDelete: "restrict" }
  ),
  payload: jsonb("payload").$type<TargetRoleSourceBindingRevision>().notNull()
});
