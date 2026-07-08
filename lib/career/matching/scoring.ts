import { PoolCapabilityRequirement } from "./pool";

export interface ExtractedCapabilityItem {
  name: string;
  domain?: string;
  confidence: number;
}

export interface MatchedCapabilityDetail {
  requirementId: string;
  capabilityName: string;
  requiredWeight: number;
  extractedConfidence: number;
  contribution: number;
}

export interface MissingCapabilityDetail {
  requirementId: string;
  capabilityName: string;
  requiredWeight: number;
  requiredLevel: string;
  evidenceHint?: string;
}

export interface ScoreBreakdownItem {
  capabilityName: string;
  status: "MATCHED" | "MISSING";
  weight: number;
  contribution: number;
  message: string;
}

export interface RoleResonanceScoreResult {
  score: number;
  matchedCapabilities: MatchedCapabilityDetail[];
  missingCapabilities: MissingCapabilityDetail[];
  scoreBreakdown: ScoreBreakdownItem[];
}

/**
 * Deterministic explainable resonance scoring algorithm.
 * Guarantees zero LLM/embedding inference during matching.
 * Score is strictly normalized to [0.0, 1.0].
 */
export function computeRoleResonanceScore(
  extractedCapabilities: ExtractedCapabilityItem[],
  requirements: PoolCapabilityRequirement[]
): RoleResonanceScoreResult {
  if (!requirements || requirements.length === 0) {
    return {
      score: 0.0,
      matchedCapabilities: [],
      missingCapabilities: [],
      scoreBreakdown: []
    };
  }

  const matchedCapabilities: MatchedCapabilityDetail[] = [];
  const missingCapabilities: MissingCapabilityDetail[] = [];
  const scoreBreakdown: ScoreBreakdownItem[] = [];

  let totalWeight = 0.0;
  let earnedScore = 0.0;

  for (const req of requirements) {
    const reqNameNorm = req.capability_name.toLowerCase().trim();
    totalWeight += req.weight;

    const match = extractedCapabilities.find(
      (cap) => cap.name.toLowerCase().trim() === reqNameNorm
    );

    if (match) {
      const contribution = req.weight * Math.min(1.0, Math.max(0.0, match.confidence));
      earnedScore += contribution;

      matchedCapabilities.push({
        requirementId: req.id,
        capabilityName: req.capability_name,
        requiredWeight: req.weight,
        extractedConfidence: match.confidence,
        contribution
      });

      scoreBreakdown.push({
        capabilityName: req.capability_name,
        status: "MATCHED",
        weight: req.weight,
        contribution,
        message: `Matched "${req.capability_name}" (Confidence: ${match.confidence.toFixed(2)}) contributing ${contribution.toFixed(4)} to resonance.`
      });
    } else {
      missingCapabilities.push({
        requirementId: req.id,
        capabilityName: req.capability_name,
        requiredWeight: req.weight,
        requiredLevel: req.required_level,
        evidenceHint: req.evidence_hint
      });

      scoreBreakdown.push({
        capabilityName: req.capability_name,
        status: "MISSING",
        weight: req.weight,
        contribution: 0.0,
        message: `Missing required capability "${req.capability_name}" (Required Level: ${req.required_level}, Weight: ${req.weight.toFixed(2)}).`
      });
    }
  }

  const rawScore = totalWeight > 0 ? earnedScore / totalWeight : 0.0;
  const score = Math.min(1.0, Math.max(0.0, Number(rawScore.toFixed(4))));

  return {
    score,
    matchedCapabilities,
    missingCapabilities,
    scoreBreakdown
  };
}
