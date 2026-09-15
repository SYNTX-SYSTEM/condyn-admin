import type { CareerOutcomeValenceFeedbackContextContent } from "../outcome-valence-feedback-context-content";
import type { CareerOutcomeValenceFeedbackContextTransition } from "../outcome-valence-feedback-context-transition";

export const CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION_SCHEMA_VERSION =
  "CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION_V1" as const;

export interface CareerOutcomeValenceFeedbackContextRevisionInput {
  createdAt: string;
}

export type CareerOutcomeValenceFeedbackContextParent =
  | {
      parentRevisionKind: "CAREER_DECISION_CONTEXT_REVISION";
      parentRevisionId: string;
    }
  | {
      parentRevisionKind: "CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION";
      parentRevisionId: string;
      parentFeedbackContextContent: CareerOutcomeValenceFeedbackContextContent;
    };

export interface CareerOutcomeValenceFeedbackContextRevision {
  careerOutcomeValenceFeedbackContextRevisionId: string;
  parent: CareerOutcomeValenceFeedbackContextParent;
  careerOutcomeValenceFeedbackContextTransition: CareerOutcomeValenceFeedbackContextTransition;
  schemaVersion: typeof CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION_SCHEMA_VERSION;
  createdAt: string;
}

export interface CareerOutcomeValenceFeedbackContextRevisionSemanticBody {
  parent: Record<string, unknown>;
  careerOutcomeValenceFeedbackContextTransition: Record<string, unknown>;
  schemaVersion: typeof CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION_SCHEMA_VERSION;
}
