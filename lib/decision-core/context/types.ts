import type { AuthoritativeStateReference } from "../authority";

export const DECISION_CONTEXT_DRAFT_SCHEMA_VERSION = "DECISION_CONTEXT_DRAFT_V1";

export type DecisionContextItemRole =
  | "DECISION_QUESTION"
  | "OBJECTIVE"
  | "CONSTRAINT"
  | "OPTION"
  | "OBSERVATION"
  | "ASSUMPTION"
  | "UNCERTAINTY";

export type DecisionContextItemProvenance =
  | { origin: "AUTHORITATIVE_STATE"; stateReference: AuthoritativeStateReference }
  | { origin: "HUMAN_INPUT"; actorId: string }
  | { origin: "MODEL_PROPOSAL"; proposalRef: string }
  | { origin: "DETERMINISTIC_DERIVATION"; ruleId: string };

export interface DecisionContextItemInput {
  role: DecisionContextItemRole;
  statement: string;
  provenance: DecisionContextItemProvenance;
}

export interface DecisionContextItem extends DecisionContextItemInput {
  itemId: string;
}

export interface DecisionContextDraftInput {
  sourceStateReferences: AuthoritativeStateReference[];
  items: DecisionContextItemInput[];
}

/**
 * A portable structural environment only. It does not resolve references or establish
 * upstream authority; later consumers must resolve each reference through their bound reader.
 */
export interface DecisionContextDraft {
  artifactKind: "DECISION_CONTEXT_DRAFT";
  schemaVersion: typeof DECISION_CONTEXT_DRAFT_SCHEMA_VERSION;
  contextId: string;
  validationStatus: "NOT_RUN";
  sourceStateReferences: AuthoritativeStateReference[];
  decisionQuestionId: string;
  items: DecisionContextItem[];
}
