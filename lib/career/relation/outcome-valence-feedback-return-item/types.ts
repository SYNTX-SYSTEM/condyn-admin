import type {
  CareerOutcomeValenceFeedbackReturnRepresentation,
  CareerOutcomeValenceFeedbackReturnRepresentationSemanticBody,
} from "../outcome-valence-feedback-return-representation";

export const CAREER_OUTCOME_VALENCE_FEEDBACK_RETURN_ITEM_SCHEMA_VERSION =
  "CAREER_OUTCOME_VALENCE_FEEDBACK_RETURN_ITEM_V1" as const;

export interface CareerOutcomeValenceFeedbackReturnItemInput {
  createdAt: string;
}

export interface CareerOutcomeValenceFeedbackReturnItem {
  careerOutcomeValenceFeedbackReturnItemId: string;
  careerOutcomeValenceFeedbackReturnRepresentation: CareerOutcomeValenceFeedbackReturnRepresentation;
  schemaVersion: typeof CAREER_OUTCOME_VALENCE_FEEDBACK_RETURN_ITEM_SCHEMA_VERSION;
  createdAt: string;
}

export interface CareerOutcomeValenceFeedbackReturnItemSemanticBody {
  careerOutcomeValenceFeedbackReturnRepresentation:
    CareerOutcomeValenceFeedbackReturnRepresentationSemanticBody;
  schemaVersion: typeof CAREER_OUTCOME_VALENCE_FEEDBACK_RETURN_ITEM_SCHEMA_VERSION;
}
