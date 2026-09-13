import type { CareerDecisionActionIntentClass } from "../action-intent";
import type { DecisionSubjectReference } from "../decision-context";
import type { HumanDecisionDeclarationClass } from "../decision-record";
import type {
  CareerExecutionAuthorityScope,
  CareerExecutionChannelKind,
  CareerExecutionTargetKind,
} from "../execution-authority-grant";
import type { CareerOutcomeValence } from "../outcome-valence-declaration";
import type {
  CareerStateObservation,
  CareerStateSubjectKind,
} from "../state-change-declaration";

export const CAREER_OUTCOME_VALENCE_FEEDBACK_ADMISSION_DECLARATION_SCHEMA_VERSION =
  "CAREER_OUTCOME_VALENCE_FEEDBACK_ADMISSION_DECLARATION_V1" as const;

export interface CareerOutcomeValenceFeedbackAdmissionDeclarationInput {
  careerOutcomeValenceDeclarationId: string;
  admittedByActorId: string;
  admittedAt: string;
  admissionEvidenceRefs: readonly string[];
  createdAt: string;
}

export interface CareerOutcomeValenceFeedbackAdmissionDeclaration {
  careerOutcomeValenceFeedbackAdmissionDeclarationId: string;
  careerOutcomeValenceDeclarationId: string;
  careerOutcomeRoleDeclarationId: string;
  careerActionStateChangeAssociationDeclarationId: string;
  careerStateChangeDeclarationId: string;
  careerActionOccurrenceId: string;
  careerExecutionContextRevisionId: string;
  careerExecutionAuthorityGrantRevisionId: string;
  careerHumanCommitmentId: string;
  careerDecisionActionIntentId: string;
  humanDecisionRecordId: string;
  careerDecisionContextRevisionId: string;
  decisionAuthorityGrantRevisionId: string;
  recommendationProposalId: string;
  performedByActorId: string;
  observedByActorId: string;
  associationDeclaredByActorId: string;
  outcomeRoleDeclaredByActorId: string;
  outcomeValenceDeclaredByActorId: string;
  decisionSubjects: readonly DecisionSubjectReference[];
  sourceDeclarationClass: HumanDecisionDeclarationClass;
  sourceActionIntentClass: CareerDecisionActionIntentClass;
  operationDescription: string;
  executionAuthorityScope: CareerExecutionAuthorityScope;
  executionTarget: {
    targetKind: CareerExecutionTargetKind;
    targetRef: string;
  };
  executionChannel: {
    channelKind: CareerExecutionChannelKind;
    channelRef: string;
  };
  actionOccurredAt: string;
  stateSubject: {
    subjectKind: CareerStateSubjectKind;
    subjectRef: string;
  };
  stateDimension: string;
  beforeObservation: CareerStateObservation;
  afterObservation: CareerStateObservation;
  observedAt: string;
  associationDeclaredAt: string;
  outcomeRoleDeclaredAt: string;
  outcomeValenceDeclaredAt: string;
  valence: CareerOutcomeValence;
  admittedByActorId: string;
  admittedAt: string;
  admissionEvidenceRefs: readonly string[];
  admissionState: "ADMITTED";
  schemaVersion: typeof CAREER_OUTCOME_VALENCE_FEEDBACK_ADMISSION_DECLARATION_SCHEMA_VERSION;
  createdAt: string;
}
