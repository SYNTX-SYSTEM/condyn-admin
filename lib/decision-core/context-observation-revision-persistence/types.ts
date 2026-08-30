import type { DecisionContextObservationRevisionCreation } from "../context-observation-revision-creation";
import type { BoundDecisionContextRevisionPersister } from "../revision-persistence";
import type { DecisionContextRevision } from "../revisions";

export const DECISION_CONTEXT_OBSERVATION_REVISION_PERSISTENCE_SCHEMA_VERSION =
  "DECISION_CONTEXT_OBSERVATION_REVISION_PERSISTENCE_V1";

export interface DecisionContextObservationRevisionPersistenceInput {
  decisionContextObservationRevisionCreation: DecisionContextObservationRevisionCreation;
}

export interface DecisionContextObservationRevisionPersistence {
  artifactKind: "DECISION_CONTEXT_OBSERVATION_REVISION_PERSISTENCE";
  schemaVersion: typeof DECISION_CONTEXT_OBSERVATION_REVISION_PERSISTENCE_SCHEMA_VERSION;
  decisionContextObservationRevisionPersistenceId: string;
  decisionContextObservationRevisionCreation: DecisionContextObservationRevisionCreation;
  persistedRevision: DecisionContextRevision;
}

export interface BoundDecisionContextObservationRevisionPersister {
  persist(input: DecisionContextObservationRevisionPersistenceInput): Promise<DecisionContextObservationRevisionPersistence>;
}

export type DecisionContextObservationRevisionPersistenceDependency = BoundDecisionContextRevisionPersister;
