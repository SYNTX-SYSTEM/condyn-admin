import type { DecisionContextObservationContextTransition } from "../context-observation-context-transition";
import type { DecisionContextValidationAssembly, DecisionContextValidationAssemblyInput } from "../validation-assembly";

export const DECISION_CONTEXT_OBSERVATION_CONTEXT_VALIDATION_ASSEMBLY_SCHEMA_VERSION =
  "DECISION_CONTEXT_OBSERVATION_CONTEXT_VALIDATION_ASSEMBLY_V1";

export interface DecisionContextObservationContextValidationAssemblyInput {
  decisionContextObservationContextTransition: DecisionContextObservationContextTransition;
  validationInput: DecisionContextValidationAssemblyInput;
}

export interface DecisionContextObservationContextValidationAssembly {
  artifactKind: "DECISION_CONTEXT_OBSERVATION_CONTEXT_VALIDATION_ASSEMBLY";
  schemaVersion: typeof DECISION_CONTEXT_OBSERVATION_CONTEXT_VALIDATION_ASSEMBLY_SCHEMA_VERSION;
  decisionContextObservationContextValidationAssemblyId: string;
  decisionContextObservationContextTransition: DecisionContextObservationContextTransition;
  validationInput: DecisionContextValidationAssemblyInput;
  validationAssembly: DecisionContextValidationAssembly;
}
