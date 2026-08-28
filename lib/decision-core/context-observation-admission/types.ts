import type { DecisionContextObservationProposal } from "../context-observation-proposal";

export const DECISION_CONTEXT_OBSERVATION_ADMISSION_DECLARATION_SCHEMA_VERSION =
  "DECISION_CONTEXT_OBSERVATION_ADMISSION_DECLARATION_V1";

export interface DecisionContextObservationAdmissionActor {
  origin: "HUMAN_INPUT";
  actorId: string;
}

export interface DecisionContextObservationAdmissionDeclarationInput {
  decisionContextObservationProposal: DecisionContextObservationProposal;
  admittedBy: DecisionContextObservationAdmissionActor;
  rationale: string | null;
}

export interface DecisionContextObservationAdmissionDeclaration {
  artifactKind: "DECISION_CONTEXT_OBSERVATION_ADMISSION_DECLARATION";
  schemaVersion: typeof DECISION_CONTEXT_OBSERVATION_ADMISSION_DECLARATION_SCHEMA_VERSION;
  decisionContextObservationAdmissionId: string;
  decisionContextObservationProposal: DecisionContextObservationProposal;
  admittedBy: DecisionContextObservationAdmissionActor;
  rationale: string | null;
}
