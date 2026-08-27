import type { DecisionAssessmentProposal } from "../assessment-proposal";

export const DECISION_RECOMMENDATION_PROPOSAL_SCHEMA_VERSION = "DECISION_RECOMMENDATION_PROPOSAL_V1";

export interface DecisionRecommendation {
  optionItemId: string;
  rationale: string;
}

export interface DecisionRecommendationProposalProvenance {
  origin: "MODEL_PROPOSAL";
  proposalRef: string;
}

export interface DecisionRecommendationGenerationInput {
  assessmentProposal: DecisionAssessmentProposal;
}

export interface DecisionRecommendationGenerator {
  recommend(input: DecisionRecommendationGenerationInput): Promise<readonly DecisionRecommendation[]>;
}

export interface DecisionRecommendationProposal {
  artifactKind: "DECISION_RECOMMENDATION_PROPOSAL";
  schemaVersion: typeof DECISION_RECOMMENDATION_PROPOSAL_SCHEMA_VERSION;
  recommendationProposalId: string;
  assessmentProposal: DecisionAssessmentProposal;
  proposedBy: DecisionRecommendationProposalProvenance;
  recommendations: readonly DecisionRecommendation[];
}

export interface BoundDecisionRecommendationProposer {
  propose(assessmentProposal: DecisionAssessmentProposal, proposedBy: DecisionRecommendationProposalProvenance): Promise<DecisionRecommendationProposal>;
}
