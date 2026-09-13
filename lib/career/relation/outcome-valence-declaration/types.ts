import type { CareerDecisionActionIntentClass } from "../action-intent";
import type { DecisionSubjectReference } from "../decision-context";
import type { HumanDecisionDeclarationClass } from "../decision-record";
import type {
  CareerExecutionAuthorityScope,
  CareerExecutionChannelKind,
  CareerExecutionTargetKind,
} from "../execution-authority-grant";
import type {
  CareerStateObservation,
  CareerStateSubjectKind,
} from "../state-change-declaration";

export const CAREER_OUTCOME_VALENCE_DECLARATION_SCHEMA_VERSION =
  "CAREER_OUTCOME_VALENCE_DECLARATION_V1" as const;

export type CareerOutcomeValence =
  | "DESIRABLE"
  | "UNDESIRABLE"
  | "NEUTRAL"
  | "UNRESOLVED";

export interface CareerOutcomeValenceDeclarationInput {
  careerOutcomeRoleDeclarationId: string;
  declaredByActorId: string;
  declaredAt: string;
  valence: CareerOutcomeValence;
  valenceEvidenceRefs: readonly string[];
  createdAt: string;
}

export interface CareerOutcomeValenceDeclaration {
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
  declaredByActorId: string;
  declaredAt: string;
  valence: CareerOutcomeValence;
  valenceEvidenceRefs: readonly string[];
  schemaVersion: typeof CAREER_OUTCOME_VALENCE_DECLARATION_SCHEMA_VERSION;
  createdAt: string;
}
