import { integer, jsonb, pgTable, primaryKey, text } from "drizzle-orm/pg-core";
import type { CareerOutcomeValenceDeclaration } from "../../relation/outcome-valence-declaration";
import { careerOutcomeRoleDeclarations } from "../outcome-role-declaration-persistence/postgres-schema";

export const careerOutcomeValenceDeclarations = pgTable(
  "career_outcome_valence_declarations",
  {
    careerOutcomeValenceDeclarationId: text("career_outcome_valence_declaration_id").primaryKey(),
    careerOutcomeRoleDeclarationId: text("career_outcome_role_declaration_id").notNull()
      .references(
        () => careerOutcomeRoleDeclarations.careerOutcomeRoleDeclarationId,
        { onDelete: "restrict", onUpdate: "restrict" },
      ),
    careerActionStateChangeAssociationDeclarationId: text("career_action_state_change_association_declaration_id").notNull(),
    careerStateChangeDeclarationId: text("career_state_change_declaration_id").notNull(),
    careerActionOccurrenceId: text("career_action_occurrence_id").notNull(),
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
    associationDeclaredByActorId: text("association_declared_by_actor_id").notNull(),
    outcomeRoleDeclaredByActorId: text("outcome_role_declared_by_actor_id").notNull(),
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
    beforeObservationValue: text("before_observation_value").notNull(),
    afterObservationState: text("after_observation_state").notNull(),
    afterObservationValue: text("after_observation_value").notNull(),
    observedAt: text("observed_at").notNull(),
    associationDeclaredAt: text("association_declared_at").notNull(),
    outcomeRoleDeclaredAt: text("outcome_role_declared_at").notNull(),
    declaredByActorId: text("declared_by_actor_id").notNull(),
    declaredAt: text("declared_at").notNull(),
    valence: text("valence").notNull(),
    schemaVersion: text("schema_version").notNull(),
    createdAt: text("created_at").notNull(),
    payload: jsonb("payload").$type<CareerOutcomeValenceDeclaration>().notNull(),
  },
);

export const careerOutcomeValenceDeclarationSubjects = pgTable(
  "career_outcome_valence_declaration_subjects",
  {
    careerOutcomeValenceDeclarationId: text("career_outcome_valence_declaration_id").notNull()
      .references(() => careerOutcomeValenceDeclarations.careerOutcomeValenceDeclarationId, { onDelete: "restrict", onUpdate: "restrict" }),
    recommendationProposalId: text("recommendation_proposal_id").notNull(),
    sourceEvolutionInputItemOrdinal: integer("source_evolution_input_item_ordinal").notNull(),
  },
  table => [primaryKey({ columns: [
    table.careerOutcomeValenceDeclarationId,
    table.recommendationProposalId,
    table.sourceEvolutionInputItemOrdinal,
  ] })],
);

export const careerOutcomeValenceDeclarationEvidenceReferences = pgTable(
  "career_outcome_valence_declaration_evidence_references",
  {
    careerOutcomeValenceDeclarationId: text("career_outcome_valence_declaration_id").notNull()
      .references(() => careerOutcomeValenceDeclarations.careerOutcomeValenceDeclarationId, { onDelete: "restrict", onUpdate: "restrict" }),
    evidenceRef: text("evidence_ref").notNull(),
  },
  table => [primaryKey({ columns: [table.careerOutcomeValenceDeclarationId, table.evidenceRef] })],
);
