import type { TargetOrganizationRevision } from "../../target/organization";
import { type AnyPgColumn, jsonb, pgTable, text } from "drizzle-orm/pg-core";

export const targetOrganizationRevisions = pgTable("target_organization_revisions", {
  targetOrganizationRevisionId: text("target_organization_revision_id").primaryKey(),
  targetOrganizationEntityId: text("target_organization_entity_id").notNull(),
  previousRevisionId: text("previous_revision_id").references(
    (): AnyPgColumn => targetOrganizationRevisions.targetOrganizationRevisionId,
    { onDelete: "restrict" }
  ),
  payload: jsonb("payload").$type<TargetOrganizationRevision>().notNull()
});
