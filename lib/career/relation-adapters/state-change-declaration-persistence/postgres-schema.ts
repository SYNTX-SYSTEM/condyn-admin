import { integer, jsonb, pgTable, text } from "drizzle-orm/pg-core";
import type { CareerStateChangeDeclaration } from "../../relation/state-change-declaration";
import { careerActionOccurrences } from "../action-occurrence-persistence/postgres-schema";

export const careerStateChangeDeclarations = pgTable("career_state_change_declarations", {
  careerStateChangeDeclarationId: text("career_state_change_declaration_id").primaryKey(),
  careerActionOccurrenceId: text("career_action_occurrence_id").notNull()
    .references(() => careerActionOccurrences.careerActionOccurrenceId, { onDelete: "restrict", onUpdate: "restrict" }),
  careerExecutionContextRevisionId: text("career_execution_context_revision_id").notNull(),
  careerExecutionAuthorityGrantRevisionId: text("career_execution_authority_grant_revision_id").notNull(),
  careerHumanCommitmentId: text("career_human_commitment_id").notNull(),
  careerDecisionActionIntentId: text("career_decision_action_intent_id").notNull(),
  humanDecisionRecordId: text("human_decision_record_id").notNull(),
  careerDecisionContextRevisionId: text("career_decision_context_revision_id").notNull(),
  decisionAuthorityGrantRevisionId: text("decision_authority_grant_revision_id").notNull(),
  recommendationProposalId: text("recommendation_proposal_id").notNull(),
  performedByActorId: text("performed_by_actor_id").notNull(),
  observedByActorId: text("observed_by_actor_id").notNull(),
  sourceDeclarationClass: text("source_declaration_class").notNull(),
  sourceActionIntentClass: text("source_action_intent_class").notNull(),
  operationDescription: text("operation_description").notNull(),
  executionAuthorityScope: text("execution_authority_scope").notNull(),
  executionTargetKind: text("execution_target_kind").notNull(),
  executionTargetRef: text("execution_target_ref").notNull(),
  executionChannelKind: text("execution_channel_kind").notNull(),
  executionChannelRef: text("execution_channel_ref").notNull(),
  actionOccurredAt: text("action_occurred_at").notNull(),
  stateSubjectKind: text("state_subject_kind").notNull(),
  stateSubjectRef: text("state_subject_ref").notNull(),
  stateDimension: text("state_dimension").notNull(),
  beforeObservationState: text("before_observation_state").notNull(),
  beforeObservationValue: text("before_observation_value"),
  afterObservationState: text("after_observation_state").notNull(),
  afterObservationValue: text("after_observation_value"),
  observedAt: text("observed_at").notNull(),
  externalStateProducerId: text("external_state_producer_id"),
  externalStateAuthorityContractId: text("external_state_authority_contract_id"),
  externalStateArtifactId: text("external_state_artifact_id"),
  externalStateLocator: text("external_state_locator"),
  schemaVersion: text("schema_version").notNull(),
  createdAt: text("created_at").notNull(),
  payload: jsonb("payload").$type<CareerStateChangeDeclaration>().notNull(),
});

export const careerStateChangeDeclarationSubjects = pgTable("career_state_change_declaration_subjects", {
  referenceId: text("reference_id").primaryKey(),
  careerStateChangeDeclarationId: text("career_state_change_declaration_id").notNull()
    .references(() => careerStateChangeDeclarations.careerStateChangeDeclarationId, { onDelete: "restrict", onUpdate: "restrict" }),
  recommendationProposalId: text("recommendation_proposal_id").notNull(),
  sourceEvolutionInputItemOrdinal: integer("source_evolution_input_item_ordinal").notNull(),
});

export const careerStateChangeDeclarationEvidenceReferences = pgTable(
  "career_state_change_declaration_evidence_references",
  {
    referenceId: text("reference_id").primaryKey(),
    careerStateChangeDeclarationId: text("career_state_change_declaration_id").notNull()
      .references(() => careerStateChangeDeclarations.careerStateChangeDeclarationId, { onDelete: "restrict", onUpdate: "restrict" }),
    evidenceRef: text("evidence_ref").notNull(),
  },
);
