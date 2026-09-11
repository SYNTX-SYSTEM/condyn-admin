import { integer, jsonb, pgTable, text } from "drizzle-orm/pg-core";
import type { CareerActionOccurrence } from "../../relation/action-occurrence";
import { careerExecutionAuthorityGrantRevisions } from "../execution-authority-grant-persistence/postgres-schema";
import { careerExecutionContextRevisions } from "../execution-context-revision-persistence/postgres-schema";

export const careerActionOccurrences = pgTable("career_action_occurrences", {
  careerActionOccurrenceId: text("career_action_occurrence_id").primaryKey(),
  careerExecutionContextRevisionId: text("career_execution_context_revision_id")
    .notNull()
    .references(() => careerExecutionContextRevisions.careerExecutionContextRevisionId, {
      onDelete: "restrict", onUpdate: "restrict",
    }),
  careerExecutionAuthorityGrantRevisionId: text("career_execution_authority_grant_revision_id")
    .notNull()
    .references(() => careerExecutionAuthorityGrantRevisions.careerExecutionAuthorityGrantRevisionId, {
      onDelete: "restrict", onUpdate: "restrict",
    }),
  careerHumanCommitmentId: text("career_human_commitment_id").notNull(),
  careerDecisionActionIntentId: text("career_decision_action_intent_id").notNull(),
  humanDecisionRecordId: text("human_decision_record_id").notNull(),
  careerDecisionContextRevisionId: text("career_decision_context_revision_id").notNull(),
  decisionAuthorityGrantRevisionId: text("decision_authority_grant_revision_id").notNull(),
  recommendationProposalId: text("recommendation_proposal_id").notNull(),
  performedByActorId: text("performed_by_actor_id").notNull(),
  sourceDeclarationClass: text("source_declaration_class").notNull(),
  sourceActionIntentClass: text("source_action_intent_class").notNull(),
  operationDescription: text("operation_description").notNull(),
  executionAuthorityScope: text("execution_authority_scope").notNull(),
  executionTargetKind: text("execution_target_kind").notNull(),
  executionTargetRef: text("execution_target_ref").notNull(),
  executionChannelKind: text("execution_channel_kind").notNull(),
  executionChannelRef: text("execution_channel_ref").notNull(),
  occurredAt: text("occurred_at").notNull(),
  externalOccurrenceRef: text("external_occurrence_ref"),
  schemaVersion: text("schema_version").notNull(),
  createdAt: text("created_at").notNull(),
  payload: jsonb("payload").$type<CareerActionOccurrence>().notNull(),
});

export const careerActionOccurrenceSubjects = pgTable("career_action_occurrence_subjects", {
  referenceId: text("reference_id").primaryKey(),
  careerActionOccurrenceId: text("career_action_occurrence_id")
    .notNull()
    .references(() => careerActionOccurrences.careerActionOccurrenceId, {
      onDelete: "restrict", onUpdate: "restrict",
    }),
  recommendationProposalId: text("recommendation_proposal_id").notNull(),
  sourceEvolutionInputItemOrdinal: integer("source_evolution_input_item_ordinal").notNull(),
});

export const careerActionOccurrenceEvidenceReferences = pgTable(
  "career_action_occurrence_evidence_references",
  {
    referenceId: text("reference_id").primaryKey(),
    careerActionOccurrenceId: text("career_action_occurrence_id")
      .notNull()
      .references(() => careerActionOccurrences.careerActionOccurrenceId, {
        onDelete: "restrict", onUpdate: "restrict",
      }),
    occurrenceEvidenceRef: text("occurrence_evidence_ref").notNull(),
  },
);
