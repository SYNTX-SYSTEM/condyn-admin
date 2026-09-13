import { jsonb, pgTable, text } from "drizzle-orm/pg-core";
import type { CareerOutcomeValenceFeedbackTargetRevisionBinding } from "../../relation/outcome-valence-feedback-target-revision-binding";
import { careerOutcomeValenceFeedbackTargetDeclarations } from "../outcome-valence-feedback-target-declaration-persistence/postgres-schema";

export const careerOutcomeValenceFeedbackTargetRevisionBindings = pgTable(
  "career_outcome_valence_feedback_target_revision_bindings",
  {
    careerOutcomeValenceFeedbackTargetRevisionBindingId: text("career_outcome_valence_feedback_target_revision_binding_id").primaryKey(),
    careerOutcomeValenceFeedbackTargetDeclarationId: text("career_outcome_valence_feedback_target_declaration_id").notNull()
      .references(() => careerOutcomeValenceFeedbackTargetDeclarations.careerOutcomeValenceFeedbackTargetDeclarationId, { onDelete: "restrict", onUpdate: "restrict" }),
    targetCareerDecisionContextRevisionId: text("target_career_decision_context_revision_id").notNull(),
    schemaVersion: text("schema_version").notNull(),
    createdAt: text("created_at").notNull(),
    payload: jsonb("payload").$type<CareerOutcomeValenceFeedbackTargetRevisionBinding>().notNull(),
  },
);
