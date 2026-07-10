export interface EvidenceInputForAggregation {
  evidenceScore: number;
  sourceWeight: number;
}

/**
 * Pure, deterministic multi-evidence aggregation.
 * Combines multiple evidence items into a robust capability confidence score [0.0, 1.0].
 * Uses damped probabilistic accumulation so stronger evidence leads the score while supporting evidence adds incremental boost.
 */
export function aggregateCapabilityConfidence(
  evidences: EvidenceInputForAggregation[]
): number {
  if (!evidences || evidences.length === 0) {
    return 0;
  }

  // Calculate effective scores for each evidence item
  const effectiveScores = evidences
    .map((item) => {
      const score = Math.max(0, Math.min(1, item.evidenceScore || 0));
      const weight = Math.max(0, Math.min(1, item.sourceWeight || 0));
      return score * weight;
    })
    .sort((a, b) => b - a);

  let current = effectiveScores[0];

  // Damped accumulation for additional supporting evidence items
  for (let i = 1; i < effectiveScores.length; i++) {
    const boost = (1 - current) * effectiveScores[i] * 0.35;
    current += boost;
  }

  return Number(Math.min(1, Math.max(0, current)).toFixed(4));
}
