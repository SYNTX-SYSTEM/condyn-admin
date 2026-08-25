import type { DecisionContextDraft } from "../context";
import type { DecisionContextValidationAssembly, DecisionContextValidationAssemblyInput } from "../validation-assembly";

export const DECISION_CONTEXT_REVISION_SCHEMA_VERSION = "DECISION_CONTEXT_REVISION_V1";

export interface DecisionContextRevisionInput {
  previousRevisionId: string | null;
  context: DecisionContextDraft;
  validationInput: DecisionContextValidationAssemblyInput;
  validationAssembly: DecisionContextValidationAssembly;
}

/** Self-contained derivational state only; not persistence, authority, or truth. */
export interface DecisionContextRevision {
  artifactKind: "DECISION_CONTEXT_REVISION";
  schemaVersion: typeof DECISION_CONTEXT_REVISION_SCHEMA_VERSION;
  revisionId: string;
  previousRevisionId: string | null;
  context: DecisionContextDraft;
  validationInput: DecisionContextValidationAssemblyInput;
  validationAssembly: DecisionContextValidationAssembly;
}
