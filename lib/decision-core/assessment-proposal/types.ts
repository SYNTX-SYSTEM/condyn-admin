import type { DecisionAssessmentBasis } from "../assessment-basis";

export const DECISION_ASSESSMENT_PROPOSAL_SCHEMA_VERSION = "DECISION_ASSESSMENT_PROPOSAL_V1";
export const DECISION_ASSESSMENT_DISPOSITIONS = ["ALIGNED", "PARTIALLY_ALIGNED", "MISALIGNED", "UNDETERMINED"] as const;

export type DecisionAssessmentDisposition = typeof DECISION_ASSESSMENT_DISPOSITIONS[number];

export interface DecisionAssessmentEvaluation {
  optionItemId: string;
  criterionItemId: string;
  disposition: DecisionAssessmentDisposition;
  rationale: string;
}

export interface DecisionAssessmentProposalProvenance {
  origin: "MODEL_PROPOSAL";
  proposalRef: string;
}

export interface DecisionAssessmentEvaluationInput {
  assessmentBasis: DecisionAssessmentBasis;
}

export interface DecisionAssessmentEvaluator {
  evaluate(input: DecisionAssessmentEvaluationInput): Promise<readonly DecisionAssessmentEvaluation[]>;
}

export interface DecisionAssessmentProposal {
  artifactKind: "DECISION_ASSESSMENT_PROPOSAL";
  schemaVersion: typeof DECISION_ASSESSMENT_PROPOSAL_SCHEMA_VERSION;
  assessmentProposalId: string;
  assessmentBasis: DecisionAssessmentBasis;
  proposedBy: DecisionAssessmentProposalProvenance;
  assessments: readonly DecisionAssessmentEvaluation[];
}

export interface BoundDecisionAssessmentProposer {
  propose(assessmentBasis: DecisionAssessmentBasis, proposedBy: DecisionAssessmentProposalProvenance): Promise<DecisionAssessmentProposal>;
}
