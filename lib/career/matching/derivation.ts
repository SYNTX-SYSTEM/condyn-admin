import { AlignmentResult, AlignmentState } from "./alignment";
import { MetricProvenance, resolveMetric } from "../metrics/provenance";

export interface RecommendationProofChain {
  roleId: string;
  recommendationState: "RECOMMEND" | "REVIEW" | "INSUFFICIENT_EVIDENCE" | "DO_NOT_RECOMMEND";
  fitScore: MetricProvenance;
  explainabilityScore: MetricProvenance;
  alignments: AlignmentResult[];
}

export function calculateFitAndExplainability(
  roleId: string,
  alignments: AlignmentResult[]
): { fit: number | null, explainability: number | null } {
  if (alignments.length === 0) {
    return { fit: null, explainability: null };
  }

  const totalRequirements = alignments.length;

  let supportedCount = 0;
  let notSupportedCount = 0;
  let unresolvedCount = 0;
  let partiallySupportedCount = 0;

  for (const align of alignments) {
    switch (align.state) {
      case "SUPPORTED":
        supportedCount += 1.0;
        break;
      case "PARTIALLY_SUPPORTED":
        partiallySupportedCount += 1.0;
        supportedCount += 0.5; // EXPLICIT CONFIGURED POLICY
        break;
      case "NOT_SUPPORTED":
        notSupportedCount += 1.0;
        break;
      case "UNRESOLVED":
        unresolvedCount += 1.0;
        break;
    }
  }

  // FIT = fraction of target requirement weight for which validated state provides positive support.
  const fit = supportedCount / totalRequirements;
  
  // EXPLAINABILITY = fraction of target requirements whose alignment state has been deterministically resolved.
  const resolvedCount = totalRequirements - unresolvedCount;
  const explainability = resolvedCount / totalRequirements;

  return { fit, explainability };
}

export function buildRoleRecommendation(
  roleId: string,
  alignments: AlignmentResult[]
): RecommendationProofChain {
  const { fit, explainability } = calculateFitAndExplainability(roleId, alignments);

  const fitScoreProv = resolveMetric("FIT_SCORE", fit ?? undefined);
  fitScoreProv.derivation = "FIT_POLICY_V1_EQUAL_WEIGHT";

  const expScoreProv = resolveMetric("EXPLAINABILITY_SCORE", explainability ?? undefined);
  expScoreProv.derivation = "EXPLAINABILITY_POLICY_V1_EQUAL_WEIGHT";

  let recommendationState: "RECOMMEND" | "REVIEW" | "INSUFFICIENT_EVIDENCE" | "DO_NOT_RECOMMEND" = "REVIEW";
  
  if (explainability === null || explainability < 0.3) {
    recommendationState = "INSUFFICIENT_EVIDENCE";
  } else if (fit !== null) {
    if (fit >= 0.8) {
      recommendationState = "RECOMMEND";
    } else if (fit < 0.4) {
      recommendationState = "DO_NOT_RECOMMEND";
    }
  }

  return {
    roleId,
    recommendationState,
    fitScore: fitScoreProv,
    explainabilityScore: expScoreProv,
    alignments
  };
}
