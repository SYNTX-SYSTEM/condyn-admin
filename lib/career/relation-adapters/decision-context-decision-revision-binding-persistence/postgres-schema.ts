import { jsonb, pgTable, text } from "drizzle-orm/pg-core";
import type { CareerDecisionContextDecisionRevisionBinding } from "../../relation/decision-context-decision-revision-binding";
import { careerDecisionContextRevisions } from "../decision-context-persistence/postgres-schema";

/**
 * One restrictive FK to the Career decision context; deliberately no FK to the
 * generic `decision_context_revisions` table. NO FOREIGN KEY ACROSS FIELDS.
 */
export const careerDecisionContextDecisionRevisionBindings = pgTable(
  "career_decision_context_decision_revision_bindings",
  {
    careerDecisionContextDecisionRevisionBindingId: text("career_decision_context_decision_revision_binding_id").primaryKey(),
    careerDecisionContextRevisionId: text("career_decision_context_revision_id").notNull()
      .references(() => careerDecisionContextRevisions.careerDecisionContextRevisionId, { onDelete: "restrict", onUpdate: "restrict" }),
    decisionContextRevisionId: text("decision_context_revision_id").notNull(),
    recommendationProposalId: text("recommendation_proposal_id").notNull(),
    schemaVersion: text("schema_version").notNull(),
    createdAt: text("created_at").notNull(),
    payload: jsonb("payload").$type<CareerDecisionContextDecisionRevisionBinding>().notNull(),
  },
);
