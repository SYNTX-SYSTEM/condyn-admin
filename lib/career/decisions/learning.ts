import { FeedbackRecord, AttributionRecord } from "./feedback";
import { PolicyVersion, PolicyConfiguration } from "./policy";
import { deepFreeze, DecisionRecord } from "./decision";
import { RecommendationProofChain } from "../matching/derivation";

export type EligibilityStatus = "ELIGIBLE" | "INELIGIBLE" | "UNRESOLVED";

export interface EligibilityResult {
  status: EligibilityStatus;
  reason?: string;
}

export function evaluateEligibility(
  feedback: Readonly<FeedbackRecord>,
  attribution: Readonly<AttributionRecord>
): EligibilityResult {
  if (attribution.attributionType === "CAUSAL_CLAIM") {
    return { status: "INELIGIBLE", reason: "CAUSAL_CLAIM is prohibited in v1 learning." };
  }
  if (!feedback.actor || feedback.actor.trim() === "" || feedback.actor === "anonymous") {
    return { status: "INELIGIBLE", reason: "Anonymous or unresolved observers are not permitted." };
  }
  return { status: "ELIGIBLE" };
}

export interface LearningProposal {
  proposalId: string;
  basePolicyVersionId: string;
  createdAt: string;
  createdBy: string;
  eligibleFeedbackIds: string[];
  historicalTraceIds: string[];
  proposedChanges: Partial<PolicyConfiguration>;
  rationale?: string;
  status: "DRAFT" | "VALIDATED" | "REJECTED" | "PROMOTED";
}

const proposalCache = new Map<string, LearningProposal>();

export function clearLearningCache() {
  proposalCache.clear();
}

export function createLearningProposal(
  proposalId: string,
  basePolicyVersionId: string,
  eligibleFeedbackIds: string[],
  historicalTraceIds: string[],
  proposedChanges: Partial<PolicyConfiguration>,
  createdBy: string,
  rationale?: string
): Readonly<LearningProposal> {
  const actualProposalId = proposalId || `PROP_${Date.now()}_${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

  if (proposalCache.has(actualProposalId)) {
    const existing = proposalCache.get(actualProposalId)!;
    if (existing.basePolicyVersionId !== basePolicyVersionId || JSON.stringify(existing.proposedChanges) !== JSON.stringify(proposedChanges)) {
      throw new Error(`ERR_PROPOSAL_CONFLICT: Proposal ${actualProposalId} already exists with a different payload.`);
    }
    return deepFreeze(existing);
  }

  const proposal: LearningProposal = {
    proposalId: actualProposalId,
    basePolicyVersionId,
    createdAt: new Date().toISOString(),
    createdBy,
    eligibleFeedbackIds,
    historicalTraceIds,
    proposedChanges,
    rationale,
    status: "DRAFT"
  };

  const sealed = deepFreeze(proposal);
  proposalCache.set(sealed.proposalId, sealed);
  return sealed;
}

export interface PolicyEvaluation {
  evaluationId: string;
  candidatePolicyId: string;
  baselinePolicyId: string;
  evaluatedTraceIds: string[];
  baselineResults: Record<string, any>;
  candidateResults: Record<string, any>;
  comparison: "IDENTICAL" | "DIVERGENT";
}

export function replayTrace(
  candidatePolicy: Readonly<PolicyVersion>,
  baselinePolicy: Readonly<PolicyVersion>,
  historicalRecommendation: Readonly<RecommendationProofChain>
): Readonly<PolicyEvaluation> {
  // In a real implementation, we would pass the candidatePolicy to the calculateFitAndExplainability logic
  // and see if the recommendationState changes (e.g., RECOMMEND vs DO_NOT_RECOMMEND).
  
  // Here we simulate a counterfactual replay logic for testing
  let candidateState = historicalRecommendation.recommendationState;
  
  const expValue = historicalRecommendation.explainabilityScore.value ?? 0;
  const fitValue = historicalRecommendation.fitScore.value ?? 0;
  
  if (candidatePolicy.configuration.minimumExplainability > expValue) {
    candidateState = "DO_NOT_RECOMMEND"; // counterfactual state
  } else if (candidatePolicy.configuration.minimumFit > fitValue) {
    candidateState = "DO_NOT_RECOMMEND";
  }

  const baselineState = historicalRecommendation.recommendationState;
  const comparison = baselineState === candidateState ? "IDENTICAL" : "DIVERGENT";

  const evaluation: PolicyEvaluation = {
    evaluationId: `EVAL_${Date.now()}_${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
    candidatePolicyId: candidatePolicy.policyId,
    baselinePolicyId: baselinePolicy.policyId,
    evaluatedTraceIds: [historicalRecommendation.roleId],
    baselineResults: { recommendationState: baselineState },
    candidateResults: { recommendationState: candidateState },
    comparison
  };

  return deepFreeze(evaluation);
}
