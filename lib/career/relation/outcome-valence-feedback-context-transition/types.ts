import type { CareerDecisionContextRevision } from "../decision-context";
import type { CareerOutcomeValenceFeedbackContextContent } from "../outcome-valence-feedback-context-content";
import type { CareerOutcomeValenceFeedbackReturnItem } from "../outcome-valence-feedback-return-item";

export const CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_TRANSITION_SCHEMA_VERSION =
  "CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_TRANSITION_V1" as const;

export interface CareerOutcomeValenceFeedbackContextTransitionInput {
  createdAt: string;
}

export interface CareerOutcomeValenceFeedbackContextTransition {
  careerOutcomeValenceFeedbackContextTransitionId: string;
  baseCareerDecisionContextRevision: CareerDecisionContextRevision;
  previousFeedbackContextContent: CareerOutcomeValenceFeedbackContextContent | null;
  addedFeedbackReturnItem: CareerOutcomeValenceFeedbackReturnItem;
  resultingFeedbackContextContent: CareerOutcomeValenceFeedbackContextContent;
  schemaVersion: typeof CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_TRANSITION_SCHEMA_VERSION;
  createdAt: string;
}

export interface CareerOutcomeValenceFeedbackContextTransitionSemanticBody {
  baseCareerDecisionContextRevision: Record<string, unknown>;
  previousFeedbackContextContent: Record<string, unknown> | "FIRST_TRANSITION_FROM_BASE";
  addedFeedbackReturnItem: Record<string, unknown>;
  resultingFeedbackContextContent: Record<string, unknown>;
  schemaVersion: typeof CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_TRANSITION_SCHEMA_VERSION;
}
