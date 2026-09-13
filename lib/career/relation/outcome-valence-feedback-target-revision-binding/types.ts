import type { CareerDecisionContextRevision } from "../decision-context";
import type { CareerOutcomeValenceFeedbackTargetDeclaration } from "../outcome-valence-feedback-target-declaration";

export const CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_REVISION_BINDING_SCHEMA_VERSION =
  "CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_REVISION_BINDING_V1" as const;

export interface CareerDecisionContextRevisionReader {
  getCareerDecisionContextRevisionById(
    careerDecisionContextRevisionId: string,
  ): Promise<CareerDecisionContextRevision | null>;
}

export interface CareerOutcomeValenceFeedbackTargetRevisionBindingInput {
  createdAt: string;
}

export interface CareerOutcomeValenceFeedbackTargetRevisionBinding {
  careerOutcomeValenceFeedbackTargetRevisionBindingId: string;
  careerOutcomeValenceFeedbackTargetDeclaration: CareerOutcomeValenceFeedbackTargetDeclaration;
  targetCareerDecisionContextRevision: CareerDecisionContextRevision;
  schemaVersion: typeof CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_REVISION_BINDING_SCHEMA_VERSION;
  createdAt: string;
}

export interface CareerOutcomeValenceFeedbackTargetRevisionBindingSemanticBody {
  careerOutcomeValenceFeedbackTargetDeclaration: Omit<CareerOutcomeValenceFeedbackTargetDeclaration, "createdAt">;
  targetCareerDecisionContextRevision: Omit<CareerDecisionContextRevision, "createdAt">;
  schemaVersion: typeof CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_REVISION_BINDING_SCHEMA_VERSION;
}

export interface BoundCareerOutcomeValenceFeedbackTargetRevisionBinder {
  bind(
    declaration: CareerOutcomeValenceFeedbackTargetDeclaration,
    input: CareerOutcomeValenceFeedbackTargetRevisionBindingInput,
  ): Promise<CareerOutcomeValenceFeedbackTargetRevisionBinding>;
}
