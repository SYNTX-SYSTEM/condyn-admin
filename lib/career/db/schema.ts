/**
 * CONDYN CAREER ANALYSIS PROTOCOL v1.0
 * DRIZZLE ORM SCHEMA FOR POSTGRESQL PERSISTENCE (`lib/career/db/schema.ts`)
 * 
 * Status: Phase 10 Implemented / Server Boundary Only
 * Scope: Defines the `career_analyses` table with JSONB payload column for canonical DAG storage.
 */

import { pgTable, text, real, jsonb, integer } from "drizzle-orm/pg-core";

/**
 * Table definition for stored career analysis graphs.
 * Storing full CanonicalCareerAnalysis structure inside `payload` JSONB
 * preserves 100% structural fidelity without schema mapping friction or UI contamination.
 */
export const careerAnalyses = pgTable("career_analyses", {
  analysisId: text("analysis_id").primaryKey(),
  createdAt: text("created_at").notNull(),
  validationState: text("validation_state").notNull(),
  overallConfidence: real("overall_confidence"),
  payload: jsonb("payload").notNull()
});

/** Append-only raw Capability Discovery provenance; independent of legacy analyses. */
export const careerCapabilityRuns = pgTable("career_capability_runs", {
  runId: text("run_id").primaryKey(),
  sourceBundleHash: text("source_bundle_hash").notNull(),
  kernelVersion: text("kernel_version").notNull(),
  promptChecksum: text("prompt_checksum").notNull(),
  provider: text("provider").notNull(),
  model: text("model").notNull(),
  schemaVersion: text("schema_version").notNull(),
  status: text("status").notNull(),
  rawOutputHash: text("raw_output_hash"),
  payload: jsonb("payload").notNull(),
  createdAt: text("created_at").notNull(),
  completedAt: text("completed_at")
});

/** Append-only verified Capability Core truth snapshots. */
export const careerCapabilitySnapshots = pgTable("career_capability_snapshots", {
  snapshotId: text("snapshot_id").primaryKey(),
  snapshotKey: text("snapshot_key").notNull().unique(),
  sourceBundleHash: text("source_bundle_hash").notNull(),
  kernelVersion: text("kernel_version").notNull(),
  promptChecksum: text("prompt_checksum").notNull(),
  provider: text("provider").notNull(),
  model: text("model").notNull(),
  schemaVersion: text("schema_version").notNull(),
  status: text("status").notNull(),
  payload: jsonb("payload").notNull(),
  createdAt: text("created_at").notNull()
});

export const careerRecommendations = pgTable("career_recommendations", {
  id: text("id").primaryKey(),
  payloadHash: text("payload_hash").notNull(),
  payload: jsonb("payload").notNull()
});

export const careerDecisions = pgTable("career_decisions", {
  id: text("id").primaryKey(),
  recommendationId: text("recommendation_id").notNull().references(() => careerRecommendations.id),
  timestamp: text("timestamp").notNull(),
  actor: text("actor").notNull(),
  payloadHash: text("payload_hash").notNull(),
  payload: jsonb("payload").notNull()
});

export const careerCommitments = pgTable("career_commitments", {
  id: text("id").primaryKey(),
  decisionId: text("decision_id").notNull().references(() => careerDecisions.id),
  timestamp: text("timestamp").notNull(),
  payloadHash: text("payload_hash").notNull(),
  payload: jsonb("payload").notNull()
});

export const careerActions = pgTable("career_actions", {
  id: text("id").primaryKey(),
  commitmentId: text("commitment_id").notNull().references(() => careerCommitments.id),
  timestamp: text("timestamp").notNull(),
  payloadHash: text("payload_hash").notNull(),
  payload: jsonb("payload").notNull()
});

export const careerOutcomes = pgTable("career_outcomes", {
  id: text("id").primaryKey(),
  actionId: text("action_id").notNull().references(() => careerActions.id),
  timestamp: text("timestamp").notNull(),
  payloadHash: text("payload_hash").notNull(),
  payload: jsonb("payload").notNull()
});

export const careerFeedback = pgTable("career_feedback", {
  id: text("id").primaryKey(),
  outcomeId: text("outcome_id").notNull().references(() => careerOutcomes.id),
  timestamp: text("timestamp").notNull(),
  actor: text("actor").notNull(),
  payloadHash: text("payload_hash").notNull(),
  payload: jsonb("payload").notNull()
});

export const careerAttributions = pgTable("career_attributions", {
  id: text("id").primaryKey(),
  feedbackId: text("feedback_id").notNull().references(() => careerFeedback.id),
  timestamp: text("timestamp").notNull(),
  payloadHash: text("payload_hash").notNull(),
  payload: jsonb("payload").notNull()
});

export const careerPolicyVersions = pgTable("career_policy_versions", {
  id: text("id").primaryKey(),
  version: real("version").notNull(),
  parentVersion: real("parent_version"),
  createdAt: text("created_at").notNull(),
  createdBy: text("created_by").notNull(),
  payloadHash: text("payload_hash").notNull(),
  payload: jsonb("payload").notNull()
});

export const careerPolicyFamilies = pgTable("career_policy_families", {
  id: text("id").primaryKey(),
  activePolicyVersionId: text("active_policy_version_id").references(() => careerPolicyVersions.id),
  revision: integer("revision").notNull(),
  updatedAt: text("updated_at").notNull()
});

export const careerPolicyPromotions = pgTable("career_policy_promotions", {
  id: text("id").primaryKey(),
  policyFamilyId: text("policy_family_id").notNull().references(() => careerPolicyFamilies.id),
  fromPolicyVersionId: text("from_policy_version_id").references(() => careerPolicyVersions.id),
  toPolicyVersionId: text("to_policy_version_id").notNull().references(() => careerPolicyVersions.id),
  actor: text("actor").notNull(),
  promotedAt: text("promoted_at").notNull(),
  payloadHash: text("payload_hash").notNull(),
  payload: jsonb("payload").notNull()
});

export const careerLearningProposals = pgTable("career_learning_proposals", {
  id: text("id").primaryKey(),
  feedbackId: text("feedback_id").notNull().references(() => careerFeedback.id),
  timestamp: text("timestamp").notNull(),
  payloadHash: text("payload_hash").notNull(),
  payload: jsonb("payload").notNull()
});

export const careerPolicyEvaluations = pgTable("career_policy_evaluations", {
  id: text("id").primaryKey(),
  candidatePolicyId: text("candidate_policy_id").notNull().references(() => careerPolicyVersions.id),
  baselinePolicyId: text("baseline_policy_id").notNull().references(() => careerPolicyVersions.id),
  timestamp: text("timestamp").notNull(),
  payloadHash: text("payload_hash").notNull(),
  payload: jsonb("payload").notNull()
});

export const careerAnalysisJobs = pgTable("career_analysis_jobs", {
  jobId: text("job_id").primaryKey(),
  jobType: text("job_type").notNull(),
  status: text("status").notNull(),
  idempotencyKey: text("idempotency_key").unique(),
  inputRef: jsonb("input_ref").notNull(),
  attemptCount: integer("attempt_count").notNull().default(0),
  currentOperation: text("current_operation"),
  resultAnalysisId: text("result_analysis_id").references(() => careerAnalyses.analysisId),
  errorCode: text("error_code"),
  errorSummary: text("error_summary"),
  createdAt: text("created_at").notNull(),
  startedAt: text("started_at"),
  completedAt: text("completed_at"),
  
  // Lease semantics (Phase 5 - 005B)
  leaseOwner: text("lease_owner"),
  leaseExpiresAt: text("lease_expires_at"),
  leaseVersion: integer("lease_version").notNull().default(0),
  heartbeatAt: text("heartbeat_at")
});

/**
 * Immutable technical lineage from a Career Analysis to its exact proposal
 * artifacts. It intentionally has no mutable latest/current/head or authority state.
 */
export const careerCapabilityProposalProjectionReferences = pgTable("career_capability_proposal_projection_references", {
  analysisId: text("analysis_id").primaryKey().references(() => careerAnalyses.analysisId),
  jobId: text("job_id").notNull().unique().references(() => careerAnalysisJobs.jobId),
  discoveryRunId: text("discovery_run_id").notNull().references(() => careerCapabilityRuns.runId),
  convergenceRunId: text("convergence_run_id").notNull().references(() => careerCapabilityRuns.runId),
  sourceBundleHash: text("source_bundle_hash").notNull(),
  createdAt: text("created_at").notNull()
});
