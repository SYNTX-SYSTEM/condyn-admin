import type { DecisionContextItem } from "../context";
import type { DecisionContextObservationMaterializationReadiness } from "../context-observation-materialization-readiness";

export const DECISION_CONTEXT_OBSERVATION_ITEM_MATERIALIZATION_SCHEMA_VERSION =
  "DECISION_CONTEXT_OBSERVATION_ITEM_MATERIALIZATION_V1";

export interface DecisionContextObservationItemMaterializationInput {
  decisionContextObservationMaterializationReadiness: DecisionContextObservationMaterializationReadiness;
}

export interface DecisionContextObservationItemMaterialization {
  artifactKind: "DECISION_CONTEXT_OBSERVATION_ITEM_MATERIALIZATION";
  schemaVersion: typeof DECISION_CONTEXT_OBSERVATION_ITEM_MATERIALIZATION_SCHEMA_VERSION;
  decisionContextObservationItemMaterializationId: string;
  decisionContextObservationMaterializationReadiness: DecisionContextObservationMaterializationReadiness;
  item: DecisionContextItem;
}
