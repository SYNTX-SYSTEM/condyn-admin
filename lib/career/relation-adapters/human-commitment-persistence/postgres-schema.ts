import { integer, jsonb, pgTable, text } from "drizzle-orm/pg-core";
import type { CareerHumanCommitment } from "../../relation/human-commitment";

export const careerHumanCommitments = pgTable("career_human_commitments", {
  careerHumanCommitmentId: text("career_human_commitment_id").primaryKey(),
  careerDecisionActionIntentId: text("career_decision_action_intent_id").notNull(),
  humanDecisionRecordId: text("human_decision_record_id").notNull(),
  careerDecisionContextRevisionId: text("career_decision_context_revision_id").notNull(),
  decisionAuthorityGrantRevisionId: text("decision_authority_grant_revision_id").notNull(),
  recommendationProposalId: text("recommendation_proposal_id").notNull(),
  committedByActorId: text("committed_by_actor_id").notNull(),
  sourceDeclarationClass: text("source_declaration_class").notNull(),
  sourceActionIntentClass: text("source_action_intent_class").notNull(),
  operationDescription: text("operation_description").notNull(),
  committedAt: text("committed_at").notNull(),
  schemaVersion: text("schema_version").notNull(),
  createdAt: text("created_at").notNull(),
  payload: jsonb("payload").$type<CareerHumanCommitment>().notNull(),
});

export const careerHumanCommitmentSubjects = pgTable("career_human_commitment_subjects", {
  referenceId: text("reference_id").primaryKey(),
  careerHumanCommitmentId: text("career_human_commitment_id").notNull(),
  recommendationProposalId: text("recommendation_proposal_id").notNull(),
  sourceEvolutionInputItemOrdinal: integer("source_evolution_input_item_ordinal").notNull(),
});

export const careerHumanCommitmentEvidenceReferences = pgTable("career_human_commitment_evidence_references", {
  referenceId: text("reference_id").primaryKey(),
  careerHumanCommitmentId: text("career_human_commitment_id").notNull(),
  commitmentEvidenceRef: text("commitment_evidence_ref").notNull(),
});
