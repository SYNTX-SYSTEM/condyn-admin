import type { DecisionContextObservationItemProjection } from "../context-observation-item-projection";

export const DECISION_CONTEXT_OBSERVATION_TARGET_DECLARATION_SCHEMA_VERSION =
  "DECISION_CONTEXT_OBSERVATION_TARGET_DECLARATION_V1";

export interface DecisionContextObservationTargetDeclarationActor {
  origin: "HUMAN_INPUT";
  actorId: string;
}

export interface DecisionContextObservationTargetDeclarationInput {
  decisionContextObservationItemProjection: DecisionContextObservationItemProjection;
  targetRevisionId: string;
  declaredBy: DecisionContextObservationTargetDeclarationActor;
  rationale: string | null;
}

export interface DecisionContextObservationTargetDeclaration {
  artifactKind: "DECISION_CONTEXT_OBSERVATION_TARGET_DECLARATION";
  schemaVersion: typeof DECISION_CONTEXT_OBSERVATION_TARGET_DECLARATION_SCHEMA_VERSION;
  decisionContextObservationTargetDeclarationId: string;
  decisionContextObservationItemProjection: DecisionContextObservationItemProjection;
  targetRevisionId: string;
  declaredBy: DecisionContextObservationTargetDeclarationActor;
  rationale: string | null;
}
