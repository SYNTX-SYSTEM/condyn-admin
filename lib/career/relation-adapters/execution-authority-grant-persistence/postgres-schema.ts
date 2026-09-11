import { integer, jsonb, pgTable, text } from "drizzle-orm/pg-core";
import type { CareerExecutionAuthorityGrantRevision } from "../../relation/execution-authority-grant";
import { careerHumanCommitments } from "../human-commitment-persistence/postgres-schema";

export const careerExecutionAuthorityGrantRevisions = pgTable(
  "career_execution_authority_grant_revisions",
  {
    careerExecutionAuthorityGrantRevisionId: text("career_execution_authority_grant_revision_id").primaryKey(),
    careerHumanCommitmentId: text("career_human_commitment_id").notNull()
      .references(() => careerHumanCommitments.careerHumanCommitmentId, { onDelete: "restrict", onUpdate: "restrict" }),
    humanDecisionRecordId: text("human_decision_record_id").notNull(),
    careerDecisionActionIntentId: text("career_decision_action_intent_id").notNull(),
    careerDecisionContextRevisionId: text("career_decision_context_revision_id").notNull(),
    decisionAuthorityGrantRevisionId: text("decision_authority_grant_revision_id").notNull(),
    recommendationProposalId: text("recommendation_proposal_id").notNull(),
    grantorActorId: text("grantor_actor_id").notNull(),
    authorizedExecutionActorId: text("authorized_execution_actor_id").notNull(),
    sourceDeclarationClass: text("source_declaration_class").notNull(),
    sourceActionIntentClass: text("source_action_intent_class").notNull(),
    operationDescription: text("operation_description").notNull(),
    executionAuthorityScope: text("execution_authority_scope").notNull(),
    declaredAt: text("declared_at").notNull(),
    effectiveFrom: text("effective_from").notNull(),
    effectiveUntil: text("effective_until"),
    schemaVersion: text("schema_version").notNull(),
    createdAt: text("created_at").notNull(),
    payload: jsonb("payload").$type<CareerExecutionAuthorityGrantRevision>().notNull(),
  },
);

export const careerExecutionAuthorityGrantSubjects = pgTable("career_execution_authority_grant_subjects", {
  referenceId: text("reference_id").primaryKey(),
  careerExecutionAuthorityGrantRevisionId: text("career_execution_authority_grant_revision_id").notNull(),
  recommendationProposalId: text("recommendation_proposal_id").notNull(),
  sourceEvolutionInputItemOrdinal: integer("source_evolution_input_item_ordinal").notNull(),
});

export const careerExecutionAuthorityGrantTargetKinds = pgTable("career_execution_authority_grant_target_kinds", {
  referenceId: text("reference_id").primaryKey(),
  careerExecutionAuthorityGrantRevisionId: text("career_execution_authority_grant_revision_id").notNull(),
  targetKind: text("target_kind").notNull(),
});

export const careerExecutionAuthorityGrantChannelKinds = pgTable("career_execution_authority_grant_channel_kinds", {
  referenceId: text("reference_id").primaryKey(),
  careerExecutionAuthorityGrantRevisionId: text("career_execution_authority_grant_revision_id").notNull(),
  channelKind: text("channel_kind").notNull(),
});

export const careerExecutionAuthorityGrantEvidenceReferences = pgTable("career_execution_authority_grant_evidence_references", {
  referenceId: text("reference_id").primaryKey(),
  careerExecutionAuthorityGrantRevisionId: text("career_execution_authority_grant_revision_id").notNull(),
  authorityEvidenceRef: text("authority_evidence_ref").notNull(),
});
