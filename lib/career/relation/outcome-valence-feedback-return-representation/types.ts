import type {
  CareerOutcomeValence,
} from "../outcome-valence-declaration";
import type {
  CareerStateObservation,
  CareerStateSubjectKind,
} from "../state-change-declaration";
import type {
  CareerOutcomeValenceFeedbackTargetRevisionBinding,
  CareerOutcomeValenceFeedbackTargetRevisionBindingSemanticBody,
} from "../outcome-valence-feedback-target-revision-binding";

export const CAREER_OUTCOME_VALENCE_FEEDBACK_RETURN_REPRESENTATION_SCHEMA_VERSION =
  "CAREER_OUTCOME_VALENCE_FEEDBACK_RETURN_REPRESENTATION_V1" as const;

export interface CareerStateSubject {
  subjectKind: CareerStateSubjectKind;
  subjectRef: string;
}

export interface CareerOutcomeValenceFeedbackReturnPayload {
  feedbackKind: "OUTCOME_VALENCE_FEEDBACK";
  stateSubject: CareerStateSubject;
  stateDimension: string;
  beforeObservation: CareerStateObservation;
  afterObservation: CareerStateObservation;
  observedAt: string;
  valence: CareerOutcomeValence;
}

export interface CareerOutcomeValenceFeedbackReturnRepresentationInput {
  createdAt: string;
}

export interface CareerOutcomeValenceFeedbackReturnRepresentation {
  careerOutcomeValenceFeedbackReturnRepresentationId: string;
  careerOutcomeValenceFeedbackTargetRevisionBinding: CareerOutcomeValenceFeedbackTargetRevisionBinding;
  representedFeedback: CareerOutcomeValenceFeedbackReturnPayload;
  schemaVersion: typeof CAREER_OUTCOME_VALENCE_FEEDBACK_RETURN_REPRESENTATION_SCHEMA_VERSION;
  createdAt: string;
}

export interface CareerOutcomeValenceFeedbackReturnRepresentationSemanticBody {
  careerOutcomeValenceFeedbackTargetRevisionBinding:
    CareerOutcomeValenceFeedbackTargetRevisionBindingSemanticBody;
  representedFeedback: CareerOutcomeValenceFeedbackReturnPayload;
  schemaVersion: typeof CAREER_OUTCOME_VALENCE_FEEDBACK_RETURN_REPRESENTATION_SCHEMA_VERSION;
}
