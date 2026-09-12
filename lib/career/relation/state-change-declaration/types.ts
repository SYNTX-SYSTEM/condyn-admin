import type { CareerDecisionActionIntentClass } from "../action-intent";
import type { DecisionSubjectReference } from "../decision-context";
import type { HumanDecisionDeclarationClass } from "../decision-record";
import type {
  CareerExecutionAuthorityScope,
  CareerExecutionChannelKind,
  CareerExecutionTargetKind,
} from "../execution-authority-grant";

export const CAREER_STATE_CHANGE_DECLARATION_SCHEMA_VERSION =
  "CAREER_STATE_CHANGE_DECLARATION_V1" as const;

export type CareerStateSubjectKind =
  | "PERSON"
  | "ORGANIZATION"
  | "SYSTEM"
  | "DOCUMENT"
  | "COMMUNICATION_ENDPOINT"
  | "EXTERNAL_RESOURCE";

export type CareerStateObservation =
  | { observationState: "OBSERVED"; value: string }
  | { observationState: "UNKNOWN"; value: null }
  | { observationState: "NOT_OBSERVED"; value: null }
  | { observationState: "OBSERVATION_FAILED"; value: null };

/** Opaque structural reference only; it carries no resolver or truth authority. */
export interface AuthoritativeStateReference {
  producerId: string;
  authorityContractId: string;
  artifactId: string;
  locator: string;
}

export interface CareerStateChangeDeclarationInput {
  careerActionOccurrenceId: string;
  observedByActorId: string;
  stateSubject: { subjectKind: CareerStateSubjectKind; subjectRef: string };
  stateDimension: string;
  beforeObservation: CareerStateObservation;
  afterObservation: CareerStateObservation;
  observedAt: string;
  stateChangeEvidenceRefs: readonly string[];
  externalStateRef: AuthoritativeStateReference | null;
  createdAt: string;
}

export interface CareerStateChangeDeclaration {
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
  decisionSubjects: readonly DecisionSubjectReference[];
  sourceDeclarationClass: HumanDecisionDeclarationClass;
  sourceActionIntentClass: CareerDecisionActionIntentClass;
  operationDescription: string;
  executionAuthorityScope: CareerExecutionAuthorityScope;
  executionTarget: { targetKind: CareerExecutionTargetKind; targetRef: string };
  executionChannel: { channelKind: CareerExecutionChannelKind; channelRef: string };
  actionOccurredAt: string;
  stateSubject: { subjectKind: CareerStateSubjectKind; subjectRef: string };
  stateDimension: string;
  beforeObservation: CareerStateObservation;
  afterObservation: CareerStateObservation;
  observedAt: string;
  stateChangeEvidenceRefs: readonly string[];
  externalStateRef: AuthoritativeStateReference | null;
  schemaVersion: typeof CAREER_STATE_CHANGE_DECLARATION_SCHEMA_VERSION;
  createdAt: string;
}
