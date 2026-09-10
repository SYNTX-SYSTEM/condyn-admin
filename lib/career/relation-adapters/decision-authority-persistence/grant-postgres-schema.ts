import { jsonb, pgTable, text } from "drizzle-orm/pg-core";
import type { DecisionAuthorityGrantRevision } from "../../relation/decision-authority";

export const decisionAuthorityGrantRevisions = pgTable("decision_authority_grant_revisions", {
  decisionAuthorityGrantRevisionId: text("decision_authority_grant_revision_id").primaryKey(),
  grantorActorId: text("grantor_actor_id").notNull(),
  authorizedActorId: text("authorized_actor_id").notNull(),
  authorityScope: text("authority_scope").notNull(),
  declaredAt: text("declared_at").notNull(),
  effectiveFrom: text("effective_from").notNull(),
  effectiveUntil: text("effective_until"),
  schemaVersion: text("schema_version").notNull(),
  createdAt: text("created_at").notNull(),
  payload: jsonb("payload").$type<DecisionAuthorityGrantRevision>().notNull()
});

export const decisionAuthorityGrantDecisionClasses = pgTable("decision_authority_grant_decision_classes", {
  referenceId: text("reference_id").primaryKey(),
  decisionAuthorityGrantRevisionId: text("decision_authority_grant_revision_id").notNull().references(() => decisionAuthorityGrantRevisions.decisionAuthorityGrantRevisionId, { onDelete: "restrict" }),
  decisionClass: text("decision_class").notNull()
});

export const decisionAuthorityGrantSubjectKinds = pgTable("decision_authority_grant_subject_kinds", {
  referenceId: text("reference_id").primaryKey(),
  decisionAuthorityGrantRevisionId: text("decision_authority_grant_revision_id").notNull().references(() => decisionAuthorityGrantRevisions.decisionAuthorityGrantRevisionId, { onDelete: "restrict" }),
  subjectKind: text("subject_kind").notNull()
});

export const decisionAuthorityGrantEvidenceReferences = pgTable("decision_authority_grant_evidence_references", {
  referenceId: text("reference_id").primaryKey(),
  decisionAuthorityGrantRevisionId: text("decision_authority_grant_revision_id").notNull().references(() => decisionAuthorityGrantRevisions.decisionAuthorityGrantRevisionId, { onDelete: "restrict" }),
  authorityEvidenceRef: text("authority_evidence_ref").notNull()
});
