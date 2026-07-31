import { VerifiedCareerAnalysis } from "../types";
import { CareerMatchResult } from "../matching/engine";
import {
  CapabilityGap,
  CapabilityGapSeverity,
  CareerRecommendationResult,
  EvidenceEnhancement,
  NextActionRecommendation
} from "./types";

const SEVERITY_ORDER: Record<CapabilityGapSeverity, number> = {
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1
};

/**
 * Generates deterministic career advisory recommendations (capability gaps, evidence enhancements,
 * and next actions) by comparing a verified career analysis against pool matching results.
 * SOVEREIGNTY GUARANTEES:
 * 1. Strictly read-only consumer of `analysis` and `matchResult`. Never mutates inputs.
 * 2. Deterministic severity assignment: weight >= 0.8 -> HIGH, weight >= 0.5 -> MEDIUM, else -> LOW.
 * 3. Identifies capabilities with confidence < 0.70 for evidence enhancement.
 */
export function generateCareerRecommendations(
  analysis: VerifiedCareerAnalysis,
  matchResult: CareerMatchResult
): CareerRecommendationResult {
  const analysisId =
    analysis?.structured_data?.analysis?.metadata?.analysis_id ||
    matchResult.analysis_id ||
    "ANL_UNKNOWN";

  const rawCapabilities: any[] = analysis?.structured_data?.analysis?.capabilities || [];

  // Map existing capabilities for lookup
  const existingCapsMap = new Map<string, number>();
  for (const cap of rawCapabilities) {
    const name = (cap.name || cap.capability_name || "").trim().toLowerCase();
    const conf = typeof cap.confidence === "number" ? cap.confidence : 0.85;
    if (name) {
      existingCapsMap.set(name, conf);
    }
  }

  // 1. Collect Capability Gaps
  const capabilityGaps: CapabilityGap[] = [];

  for (const roleMatch of matchResult.role_matches || []) {
    for (const missingCap of roleMatch.missingCapabilities || []) {
      const weight = typeof (missingCap as any).weight === "number" ? (missingCap as any).weight : 0.5;
      let severity: CapabilityGapSeverity = "LOW";
      if (weight >= 0.8) {
        severity = "HIGH";
      } else if (weight >= 0.5) {
        severity = "MEDIUM";
      }

      const capKey = missingCap.capabilityName.trim().toLowerCase();
      const currentEvidenceConfidence = existingCapsMap.get(capKey);

      const reason = `Role '${roleMatch.title}' at ${roleMatch.organizationName} requires capability '${missingCap.capabilityName}' (weight: ${weight.toFixed(2)}, level: ${(missingCap as any).requiredLevel || "L3"}).`;

      capabilityGaps.push({
        capabilityName: missingCap.capabilityName,
        domain: (missingCap as any).domain || "General",
        requiredByRoleId: roleMatch.roleId,
        requiredByRoleTitle: roleMatch.title,
        organizationId: roleMatch.organizationId,
        organizationName: roleMatch.organizationName,
        requiredWeight: weight,
        currentEvidenceConfidence,
        severity,
        reason
      });
    }
  }

  // Sort capabilityGaps descending by severity (HIGH > MEDIUM > LOW), then by weight
  capabilityGaps.sort((a, b) => {
    const sevDiff = SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity];
    if (sevDiff !== 0) return sevDiff;
    return b.requiredWeight - a.requiredWeight;
  });

  // 2. Collect Evidence Enhancements (capabilities with confidence < 0.70)
  const evidenceEnhancements: EvidenceEnhancement[] = [];

  for (const cap of rawCapabilities) {
    const conf = typeof cap.confidence === "number" ? cap.confidence : 0.85;
    if (conf < 0.70) {
      const name = cap.name || cap.capability_name || "Unknown Capability";
      const id = cap.entity_id || cap.id || `CAP_${name.replace(/\s+/g, "_").toUpperCase()}`;
      evidenceEnhancements.push({
        entityId: id,
        entityName: name,
        currentConfidence: conf,
        targetConfidence: 0.85,
        missingEvidenceType: "Technical Documentation / Verifiable Artifact",
        suggestedSourceTypes: [
          "GitHub Repository",
          "Architecture Document",
          "Project Case Study",
          "Certification / Reference"
        ],
        reason: `Capability '${name}' exhibits low confidence (${conf.toFixed(2)} < 0.70). Additional authoritative evidence is required to increase verified readiness.`
      });
    }
  }

  // Sort evidenceEnhancements ascending by currentConfidence
  evidenceEnhancements.sort((a, b) => a.currentConfidence - b.currentConfidence);

  // 3. Derive Next Actions deterministically
  const nextActions: NextActionRecommendation[] = [];
  let actionCounter = 1;

  for (const gap of capabilityGaps) {
    if (nextActions.length >= 5) break;
    nextActions.push({
      actionId: `ACT_${String(actionCounter++).padStart(3, "0")}`,
      title: `Acquire capability: ${gap.capabilityName}`,
      priority: gap.severity,
      category: "CAPABILITY_ACQUISITION",
      description: `Targeting role '${gap.requiredByRoleTitle}' at ${gap.organizationName}. ${gap.reason}`,
      targetRoleTitle: gap.requiredByRoleTitle,
      targetCapabilityName: gap.capabilityName
    });
  }

  for (const enh of evidenceEnhancements) {
    if (nextActions.length >= 8) break;
    nextActions.push({
      actionId: `ACT_${String(actionCounter++).padStart(3, "0")}`,
      title: `Enhance evidence for capability: ${enh.entityName}`,
      priority: enh.currentConfidence < 0.50 ? "HIGH" : "MEDIUM",
      category: "EVIDENCE_ENHANCEMENT",
      description: `Upload authoritative artifacts (${enh.suggestedSourceTypes.slice(0, 2).join(" or ")}) to raise confidence from ${enh.currentConfidence.toFixed(2)} to 0.85+.`,
      targetCapabilityName: enh.entityName
    });
  }

  return {
    analysisId,
    generatedAt: new Date().toISOString(),
    capabilityGaps,
    evidenceEnhancements,
    nextActions
  };
}
