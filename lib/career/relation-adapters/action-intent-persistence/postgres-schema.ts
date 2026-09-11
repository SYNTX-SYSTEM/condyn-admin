import { integer, jsonb, pgTable, text } from "drizzle-orm/pg-core";
import type { CareerDecisionActionIntent } from "../../relation/action-intent";

export const careerDecisionActionIntents = pgTable("career_decision_action_intents", {
  careerDecisionActionIntentId: text("career_decision_action_intent_id").primaryKey(),
  humanDecisionRecordId: text("human_decision_record_id").notNull(),
  careerDecisionContextRevisionId: text("career_decision_context_revision_id").notNull(),
  decisionAuthorityGrantRevisionId: text("decision_authority_grant_revision_id").notNull(),
  recommendationProposalId: text("recommendation_proposal_id").notNull(),
  declaredByActorId: text("declared_by_actor_id").notNull(),
  sourceDeclarationClass: text("source_declaration_class").notNull(),
  actionIntentClass: text("action_intent_class").notNull(),
  operationDescription: text("operation_description").notNull(),
  declaredAt: text("declared_at").notNull(),
  schemaVersion: text("schema_version").notNull(),
  createdAt: text("created_at").notNull(),
  payload: jsonb("payload").$type<CareerDecisionActionIntent>().notNull(),
});

export const careerDecisionActionIntentSubjects = pgTable("career_decision_action_intent_subjects", {
  referenceId: text("reference_id").primaryKey(),
  careerDecisionActionIntentId: text("career_decision_action_intent_id").notNull(),
  recommendationProposalId: text("recommendation_proposal_id").notNull(),
  sourceEvolutionInputItemOrdinal: integer("source_evolution_input_item_ordinal").notNull(),
});

export const careerDecisionActionIntentEvidenceReferences = pgTable("career_decision_action_intent_evidence_references", {
  referenceId: text("reference_id").primaryKey(),
  careerDecisionActionIntentId: text("career_decision_action_intent_id").notNull(),
  actionIntentEvidenceRef: text("action_intent_evidence_ref").notNull(),
});
