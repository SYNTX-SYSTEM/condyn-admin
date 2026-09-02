import type { TargetSourceRevision } from "../../target/source";
import { type AnyPgColumn, jsonb, pgTable, text } from "drizzle-orm/pg-core";

/** Adapter-owned physical contract; provisioning remains outside the Target Source core. */
export const targetSourceRevisions = pgTable("target_source_revisions", {
  targetSourceRevisionId: text("target_source_revision_id").primaryKey(),
  targetSourceEntityId: text("target_source_entity_id").notNull(),
  previousRevisionId: text("previous_revision_id").references(
    (): AnyPgColumn => targetSourceRevisions.targetSourceRevisionId,
    { onDelete: "restrict" }
  ),
  payload: jsonb("payload").$type<TargetSourceRevision>().notNull()
});
