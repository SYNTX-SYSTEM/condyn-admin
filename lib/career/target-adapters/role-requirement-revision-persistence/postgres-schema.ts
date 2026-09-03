import type { TargetRequirementRevision } from "../../target/role";
import { targetRoleProfileRevisions } from "../role-profile-revision-persistence/postgres-schema";
import { type AnyPgColumn, jsonb, pgTable, text } from "drizzle-orm/pg-core";
/** FKs preserve exact physical lineage; PostgreSQL is not requirement truth authority. */
export const targetRequirementRevisions = pgTable("target_requirement_revisions", {
  targetRequirementRevisionId: text("target_requirement_revision_id").primaryKey(),
  targetRequirementEntityId: text("target_requirement_entity_id").notNull(),
  targetRoleProfileRevisionId: text("target_role_profile_revision_id").notNull().references(() => targetRoleProfileRevisions.targetRoleProfileRevisionId, { onDelete: "restrict" }),
  previousRevisionId: text("previous_revision_id").references((): AnyPgColumn => targetRequirementRevisions.targetRequirementRevisionId, { onDelete: "restrict" }),
  payload: jsonb("payload").$type<TargetRequirementRevision>().notNull()
});
