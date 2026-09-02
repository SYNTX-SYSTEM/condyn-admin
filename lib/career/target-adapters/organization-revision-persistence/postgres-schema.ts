import type { TargetOrganizationRevision } from "../../target/organization";
import { type AnyPgColumn, jsonb, pgTable, text } from "drizzle-orm/pg-core";

/**
 * Adapter-owned persistence infrastructure, not organization truth authority. Duplicated identity
 * columns permit durable payload checks; restrictive self-FK deletion preserves immutable lineage.
 */
export const targetOrganizationRevisions = pgTable("target_organization_revisions", {
  targetOrganizationRevisionId: text("target_organization_revision_id").primaryKey(),
  targetOrganizationEntityId: text("target_organization_entity_id").notNull(),
  previousRevisionId: text("previous_revision_id").references(
    (): AnyPgColumn => targetOrganizationRevisions.targetOrganizationRevisionId,
    { onDelete: "restrict" }
  ),
  payload: jsonb("payload").$type<TargetOrganizationRevision>().notNull()
});
