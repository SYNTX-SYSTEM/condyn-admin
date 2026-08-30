import type { DecisionContextObservationContextValidationAssembly } from "../context-observation-context-validation-assembly";
import type { DecisionContextRevision } from "../revisions";

export const DECISION_CONTEXT_OBSERVATION_REVISION_CREATION_SCHEMA_VERSION =
  "DECISION_CONTEXT_OBSERVATION_REVISION_CREATION_V1";

export interface DecisionContextObservationRevisionCreationInput {
  decisionContextObservationContextValidationAssembly: DecisionContextObservationContextValidationAssembly;
}

export interface DecisionContextObservationRevisionCreation {
  artifactKind: "DECISION_CONTEXT_OBSERVATION_REVISION_CREATION";
  schemaVersion: typeof DECISION_CONTEXT_OBSERVATION_REVISION_CREATION_SCHEMA_VERSION;
  decisionContextObservationRevisionCreationId: string;
  decisionContextObservationContextValidationAssembly: DecisionContextObservationContextValidationAssembly;
  revision: DecisionContextRevision;
}
