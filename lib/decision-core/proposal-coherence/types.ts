import type { DecisionRecommendationProposal } from "../recommendation-proposal";

export const DECISION_PROPOSAL_COHERENCE_VALIDATION_SCHEMA_VERSION = "DECISION_PROPOSAL_COHERENCE_VALIDATION_V1";

export interface DecisionRecommendationCoherenceTrace {
  optionItemId: string;
  representedCriterionItemIds: readonly string[];
}

export interface DecisionProposalCoherenceValidation {
  artifactKind: "DECISION_PROPOSAL_COHERENCE_VALIDATION";
  schemaVersion: typeof DECISION_PROPOSAL_COHERENCE_VALIDATION_SCHEMA_VERSION;
  proposalCoherenceValidationId: string;
  recommendationProposal: DecisionRecommendationProposal;
  traces: readonly DecisionRecommendationCoherenceTrace[];
}
