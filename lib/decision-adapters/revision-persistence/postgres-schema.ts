import type { DecisionContextRevision } from "../../decision-core/revisions";
import { type AnyPgColumn, jsonb, pgTable, text } from "drizzle-orm/pg-core";

/** Generic 5D2B physical contract; production provisioning is deliberately external to this adapter. */
export const decisionContextRevisions = pgTable("decision_context_revisions", {
  revisionId: text("revision_id").primaryKey(),
  previousRevisionId: text("previous_revision_id").references(
    (): AnyPgColumn => decisionContextRevisions.revisionId,
    { onDelete: "restrict" }
  ),
  payload: jsonb("payload").$type<DecisionContextRevision>().notNull()
});
