import { jsonb, pgTable, text } from "drizzle-orm/pg-core";
import type { CareerOutcomeValenceFeedbackContextRevision } from "../../relation/outcome-valence-feedback-context-revision";

/**
 * Immutable historical COVFCR storage. Parent metadata supports row/payload coherence and
 * physical navigation only; it neither selects a child nor establishes a current lineage.
 */
export const careerOutcomeValenceFeedbackContextRevisions = pgTable(
  "career_outcome_valence_feedback_context_revisions",
  {
    careerOutcomeValenceFeedbackContextRevisionId: text(
      "career_outcome_valence_feedback_context_revision_id",
    ).primaryKey(),
    parentRevisionKind: text("parent_revision_kind").notNull(),
    parentRevisionId: text("parent_revision_id").notNull(),
    schemaVersion: text("schema_version").notNull(),
    createdAt: text("created_at").notNull(),
    payload: jsonb("payload").$type<CareerOutcomeValenceFeedbackContextRevision>().notNull(),
  },
);
