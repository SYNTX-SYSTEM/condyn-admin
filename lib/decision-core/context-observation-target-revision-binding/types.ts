import type { DecisionContextObservationTargetDeclaration } from "../context-observation-target-declaration";
import type { DecisionContextRevision } from "../revisions";

export const DECISION_CONTEXT_OBSERVATION_TARGET_REVISION_BINDING_SCHEMA_VERSION =
  "DECISION_CONTEXT_OBSERVATION_TARGET_REVISION_BINDING_V1";

export interface DecisionContextObservationTargetRevisionReader {
  getRevisionById(revisionId: string): Promise<DecisionContextRevision | null>;
}

export interface DecisionContextObservationTargetRevisionBinding {
  artifactKind: "DECISION_CONTEXT_OBSERVATION_TARGET_REVISION_BINDING";
  schemaVersion: typeof DECISION_CONTEXT_OBSERVATION_TARGET_REVISION_BINDING_SCHEMA_VERSION;
  decisionContextObservationTargetRevisionBindingId: string;
  decisionContextObservationTargetDeclaration: DecisionContextObservationTargetDeclaration;
  revision: DecisionContextRevision;
}

export interface BoundDecisionContextObservationTargetRevisionBinder {
  bind(declaration: DecisionContextObservationTargetDeclaration): Promise<DecisionContextObservationTargetRevisionBinding>;
}
