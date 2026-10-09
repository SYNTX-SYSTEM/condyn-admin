import type { DecisionAuthorityGrantRevision } from "../relation/decision-authority";
import type { CareerDecisionContextRevision } from "../relation/decision-context";
import type { HumanDecisionRecord } from "../relation/decision-record";
import type { RecommendationProposal } from "../relation/recommendation-proposal";
import type { CareerDecisionActionIntent } from "../relation/action-intent";
import type { CareerHumanCommitment } from "../relation/human-commitment";
import type { CareerExecutionAuthorityGrantRevision } from "../relation/execution-authority-grant";
import type { CareerExecutionContextRevision } from "../relation/execution-context-revision";
import type { CareerActionOccurrence } from "../relation/action-occurrence";
import type { CareerStateChangeDeclaration } from "../relation/state-change-declaration";
import type { CareerActionStateChangeAssociationDeclaration } from "../relation/action-state-change-association-declaration";
import type { CareerOutcomeRoleDeclaration } from "../relation/outcome-role-declaration";
import type { CareerOutcomeValenceDeclaration } from "../relation/outcome-valence-declaration";
import type { CareerOutcomeValenceFeedbackAdmissionDeclaration } from "../relation/outcome-valence-feedback-admission-declaration";
import type { CareerOutcomeValenceFeedbackTargetDeclaration } from "../relation/outcome-valence-feedback-target-declaration";
import type { CareerOutcomeValenceFeedbackTargetRevisionBinding } from "../relation/outcome-valence-feedback-target-revision-binding";
import type { CareerOutcomeValenceFeedbackContextRevision } from "../relation/outcome-valence-feedback-context-revision";

export const HR_DECISION_LOOP_READ_MODEL_SCHEMA_VERSION = "HR_DECISION_LOOP_READ_MODEL_V1" as const;

/**
 * A region state describes what the frontend may represent about one artifact
 * family of the loop. It is never a loop state, a progress state, a success
 * state, or a current/latest pointer.
 *
 * - AVAILABLE: at least one exact persisted artifact was reread through its
 *   sealed repository.
 * - EMPTY: the index found no artifact for this exact context lineage.
 * - NOT_PROVISIONED: the persistence table for this family does not exist in
 *   the bound database (production registration gap; see FIELD_03).
 * - FAILED: an exact reread failed closed; the code is the sealed family code.
 */
export type HrDecisionLoopRegionState = "AVAILABLE" | "EMPTY" | "NOT_PROVISIONED" | "FAILED";

export interface HrDecisionLoopRegion<T> {
  state: HrDecisionLoopRegionState;
  artifactIds: readonly string[];
  artifacts: readonly T[];
  failureCode?: string;
}

export const HR_DECISION_LOOP_REGION_NAMES = [
  "decisions",
  "actionIntents",
  "commitments",
  "executionAuthorityGrants",
  "executionContexts",
  "actionOccurrences",
  "stateChanges",
  "associations",
  "outcomeRoles",
  "outcomeValences",
  "feedbackAdmissions",
  "feedbackTargets",
  "feedbackTargetBindings",
  "feedbackContextRevisions"
] as const;

export type HrDecisionLoopRegionName = typeof HR_DECISION_LOOP_REGION_NAMES[number];

/**
 * Exact reconstruction of one Career Decision Context revision (DCTXREV) and
 * every persisted G3 artifact whose lineage names it. Everything here is
 * represented historical state: PERSISTED != TRUE, DECLARED != DONE,
 * RETURN != NEW DECISION. Nothing selects a current, latest or head artifact.
 */
export interface HrDecisionLoopReadModel {
  schemaVersion: typeof HR_DECISION_LOOP_READ_MODEL_SCHEMA_VERSION;
  careerDecisionContextRevision: CareerDecisionContextRevision;
  decisionAuthorityGrantRevision: DecisionAuthorityGrantRevision;
  recommendationProposal: RecommendationProposal;
  decisions: HrDecisionLoopRegion<HumanDecisionRecord>;
  actionIntents: HrDecisionLoopRegion<CareerDecisionActionIntent>;
  commitments: HrDecisionLoopRegion<CareerHumanCommitment>;
  executionAuthorityGrants: HrDecisionLoopRegion<CareerExecutionAuthorityGrantRevision>;
  executionContexts: HrDecisionLoopRegion<CareerExecutionContextRevision>;
  actionOccurrences: HrDecisionLoopRegion<CareerActionOccurrence>;
  stateChanges: HrDecisionLoopRegion<CareerStateChangeDeclaration>;
  associations: HrDecisionLoopRegion<CareerActionStateChangeAssociationDeclaration>;
  outcomeRoles: HrDecisionLoopRegion<CareerOutcomeRoleDeclaration>;
  outcomeValences: HrDecisionLoopRegion<CareerOutcomeValenceDeclaration>;
  feedbackAdmissions: HrDecisionLoopRegion<CareerOutcomeValenceFeedbackAdmissionDeclaration>;
  feedbackTargets: HrDecisionLoopRegion<CareerOutcomeValenceFeedbackTargetDeclaration>;
  /** Indexed by the exact target DCTXREV of the binding. */
  feedbackTargetBindings: HrDecisionLoopRegion<CareerOutcomeValenceFeedbackTargetRevisionBinding>;
  /** Indexed by exact parent ids only: parent = this DCTXREV, then parent = each found COVFCR. */
  feedbackContextRevisions: HrDecisionLoopRegion<CareerOutcomeValenceFeedbackContextRevision>;
}

export const HR_DECISION_LOOP_FORBIDDEN_CLAIM_KEYS = [
  "current",
  "head",
  "latest",
  "active",
  "accepted",
  "authority",
  "verified",
  "loopClosed",
  "success",
  "status"
] as const;
