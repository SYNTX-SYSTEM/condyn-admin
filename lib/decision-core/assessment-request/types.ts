export const DECISION_ASSESSMENT_REQUEST_SCHEMA_VERSION = "DECISION_ASSESSMENT_REQUEST_V1";

export interface DecisionAssessmentRequestActor {
  origin: "HUMAN_INPUT";
  actorId: string;
}

export interface DecisionAssessmentRequestInput {
  revisionId: string;
  requestedBy: DecisionAssessmentRequestActor;
  decisionQuestionItemId: string;
  selectedOptionItemIds: readonly string[];
  selectedObjectiveItemIds: readonly string[];
  selectedConstraintItemIds: readonly string[];
}

export interface DecisionAssessmentRequest {
  artifactKind: "DECISION_ASSESSMENT_REQUEST";
  schemaVersion: typeof DECISION_ASSESSMENT_REQUEST_SCHEMA_VERSION;
  assessmentRequestId: string;
  revisionId: string;
  requestedBy: DecisionAssessmentRequestActor;
  decisionQuestionItemId: string;
  selectedOptionItemIds: readonly string[];
  selectedObjectiveItemIds: readonly string[];
  selectedConstraintItemIds: readonly string[];
}
