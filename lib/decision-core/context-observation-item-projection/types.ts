import type { DecisionContextObservationAdmissionDeclaration } from "../context-observation-admission";
import type { DecisionContextObservationProposalProvenance } from "../context-observation-proposal";

export const DECISION_CONTEXT_OBSERVATION_ITEM_PROJECTION_SCHEMA_VERSION =
  "DECISION_CONTEXT_OBSERVATION_ITEM_PROJECTION_V1";

export interface ProjectedDecisionContextObservationItemInput {
  role: "OBSERVATION";
  statement: string;
  provenance: DecisionContextObservationProposalProvenance;
}

export interface DecisionContextObservationItemProjectionInput {
  decisionContextObservationAdmissionDeclaration: DecisionContextObservationAdmissionDeclaration;
}

export interface DecisionContextObservationItemProjection {
  artifactKind: "DECISION_CONTEXT_OBSERVATION_ITEM_PROJECTION";
  schemaVersion: typeof DECISION_CONTEXT_OBSERVATION_ITEM_PROJECTION_SCHEMA_VERSION;
  decisionContextObservationItemProjectionId: string;
  decisionContextObservationAdmissionDeclaration: DecisionContextObservationAdmissionDeclaration;
  projectedItemInput: ProjectedDecisionContextObservationItemInput;
}
