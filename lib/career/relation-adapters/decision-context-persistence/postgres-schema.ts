import { integer, jsonb, pgTable, text } from "drizzle-orm/pg-core";
import { decisionAuthorityGrantRevisions } from "../decision-authority-persistence/grant-postgres-schema";
import { recommendationProposals } from "../recommendation-proposal-persistence/postgres-schema";
import type { CareerDecisionContextRevision } from "../../relation/decision-context";

export const careerDecisionContextRevisions = pgTable("career_decision_context_revisions", {
  careerDecisionContextRevisionId: text("career_decision_context_revision_id").primaryKey(),
  decisionAuthorityGrantRevisionId: text("decision_authority_grant_revision_id").notNull().references(() => decisionAuthorityGrantRevisions.decisionAuthorityGrantRevisionId, { onDelete: "restrict" }),
  recommendationProposalId: text("recommendation_proposal_id").notNull().references(() => recommendationProposals.recommendationProposalId, { onDelete: "restrict" }),
  authorityScope: text("authority_scope").notNull(),
  schemaVersion: text("schema_version").notNull(),
  createdAt: text("created_at").notNull(),
  payload: jsonb("payload").$type<CareerDecisionContextRevision>().notNull()
});

export const careerDecisionContextSubjects = pgTable("career_decision_context_subjects", {
  referenceId: text("reference_id").primaryKey(),
  careerDecisionContextRevisionId: text("career_decision_context_revision_id").notNull().references(() => careerDecisionContextRevisions.careerDecisionContextRevisionId, { onDelete: "restrict" }),
  recommendationProposalId: text("recommendation_proposal_id").notNull().references(() => recommendationProposals.recommendationProposalId, { onDelete: "restrict" }),
  sourceEvolutionInputItemOrdinal: integer("source_evolution_input_item_ordinal").notNull()
});

export const careerDecisionContextEvidenceReferences = pgTable("career_decision_context_evidence_references", {
  referenceId: text("reference_id").primaryKey(),
  careerDecisionContextRevisionId: text("career_decision_context_revision_id").notNull().references(() => careerDecisionContextRevisions.careerDecisionContextRevisionId, { onDelete: "restrict" }),
  contextEvidenceRef: text("context_evidence_ref").notNull()
});

export const careerDecisionContextDecisionClasses = pgTable("career_decision_context_decision_classes", {
  referenceId: text("reference_id").primaryKey(),
  careerDecisionContextRevisionId: text("career_decision_context_revision_id").notNull().references(() => careerDecisionContextRevisions.careerDecisionContextRevisionId, { onDelete: "restrict" }),
  decisionClass: text("decision_class").notNull()
});

export const careerDecisionContextSubjectKinds = pgTable("career_decision_context_subject_kinds", {
  referenceId: text("reference_id").primaryKey(),
  careerDecisionContextRevisionId: text("career_decision_context_revision_id").notNull().references(() => careerDecisionContextRevisions.careerDecisionContextRevisionId, { onDelete: "restrict" }),
  subjectKind: text("subject_kind").notNull()
});
