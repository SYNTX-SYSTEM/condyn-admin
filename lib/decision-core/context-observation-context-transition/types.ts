import type { DecisionContextDraft } from "../context";
import type { DecisionContextObservationItemMaterialization } from "../context-observation-item-materialization";

export const DECISION_CONTEXT_OBSERVATION_CONTEXT_TRANSITION_SCHEMA_VERSION =
  "DECISION_CONTEXT_OBSERVATION_CONTEXT_TRANSITION_V1";

export interface DecisionContextObservationContextTransitionInput {
  decisionContextObservationItemMaterialization: DecisionContextObservationItemMaterialization;
}

export interface DecisionContextObservationContextTransition {
  artifactKind: "DECISION_CONTEXT_OBSERVATION_CONTEXT_TRANSITION";
  schemaVersion: typeof DECISION_CONTEXT_OBSERVATION_CONTEXT_TRANSITION_SCHEMA_VERSION;
  decisionContextObservationContextTransitionId: string;
  decisionContextObservationItemMaterialization: DecisionContextObservationItemMaterialization;
  context: DecisionContextDraft;
}
