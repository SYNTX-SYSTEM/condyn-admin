import type { HumanDecisionDeclaration } from "../human-decision";

export const DECISION_ACTION_INTENT_SCHEMA_VERSION = "DECISION_ACTION_INTENT_V1";

export interface ActionIntentActor {
  origin: "HUMAN_INPUT";
  actorId: string;
}

export interface DecisionActionIntentInput {
  declaredBy: ActionIntentActor;
  operationalizedOptionItemIds: readonly string[];
  operationDescription: string;
  rationale: string | null;
}

export interface DecisionActionIntent {
  artifactKind: "DECISION_ACTION_INTENT";
  schemaVersion: typeof DECISION_ACTION_INTENT_SCHEMA_VERSION;
  actionIntentId: string;
  humanDecisionDeclaration: HumanDecisionDeclaration;
  declaredBy: ActionIntentActor;
  operationalizedOptionItemIds: readonly string[];
  operationDescription: string;
  rationale: string | null;
}
