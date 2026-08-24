import type { AuthoritativeStateReference } from "../authority";
import type { DecisionContextDraft, DecisionContextItem } from "../context";

export const EVIDENCE_BINDING_DISPOSITIONS = [
  "SUPPORTED",
  "PARTIALLY_SUPPORTED",
  "NOT_SUPPORTED",
  "CONTRADICTED"
] as const;

export type EvidenceBindingDisposition = typeof EVIDENCE_BINDING_DISPOSITIONS[number];

/** A semantic evaluator proposal for one item/reference relationship. */
export interface SemanticEvidenceBindingEvaluation {
  itemId: string;
  stateReference: AuthoritativeStateReference;
  disposition: EvidenceBindingDisposition;
  rationale: string;
}

/** The evaluator receives only operation-local comparison input and opaque producer payload. */
export interface SemanticEvidenceEvaluationInput {
  contextId: string;
  items: readonly DecisionContextItem[];
  stateReference: AuthoritativeStateReference;
  payload: unknown;
}

/**
 * A composition-time semantic dependency. Its output is proposal data, not producer
 * authority, human-decision authority, or verified semantic truth.
 */
export interface SemanticEvidenceBindingEvaluator {
  evaluate(input: SemanticEvidenceEvaluationInput): Promise<readonly SemanticEvidenceBindingEvaluation[]>;
}

/** A canonical proposal for one Decision Context item and one authoritative state reference. */
export interface SemanticEvidenceBindingProposal {
  bindingId: string;
  contextId: string;
  itemId: string;
  stateReference: AuthoritativeStateReference;
  disposition: EvidenceBindingDisposition;
  rationale: string;
}

/** Resolves current authority and obtains semantic binding proposals through dependencies bound at construction. */
export interface BoundSemanticEvidenceBinder {
  bind(context: DecisionContextDraft): Promise<SemanticEvidenceBindingProposal[]>;
}
