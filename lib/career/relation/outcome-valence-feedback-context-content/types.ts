import type { CareerDecisionContextRevision } from "../decision-context";
import type {
  CareerOutcomeValenceFeedbackReturnItem,
  CareerOutcomeValenceFeedbackReturnItemSemanticBody,
} from "../outcome-valence-feedback-return-item";

export const CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_CONTENT_SCHEMA_VERSION =
  "CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_CONTENT_V1" as const;

export interface CareerOutcomeValenceFeedbackContextContentInput {
  createdAt: string;
}

export interface CareerOutcomeValenceFeedbackContextContent {
  careerOutcomeValenceFeedbackContextContentId: string;
  baseCareerDecisionContextRevision: CareerDecisionContextRevision;
  feedbackReturnItems: readonly CareerOutcomeValenceFeedbackReturnItem[];
  schemaVersion: typeof CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_CONTENT_SCHEMA_VERSION;
  createdAt: string;
}

export interface CareerOutcomeValenceFeedbackContextContentSemanticBody {
  baseCareerDecisionContextRevision: Record<string, unknown>;
  feedbackReturnItems: readonly CareerOutcomeValenceFeedbackReturnItemSemanticBody[];
  schemaVersion: typeof CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_CONTENT_SCHEMA_VERSION;
}
