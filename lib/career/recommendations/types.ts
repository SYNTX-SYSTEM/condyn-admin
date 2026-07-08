export type CapabilityGapSeverity = "LOW" | "MEDIUM" | "HIGH";

export interface CapabilityGap {
  capabilityName: string;
  domain: string;
  requiredByRoleId: string;
  requiredByRoleTitle: string;
  organizationId: string;
  organizationName: string;
  requiredWeight: number;
  currentEvidenceConfidence?: number;
  severity: CapabilityGapSeverity;
  reason: string;
}

export interface EvidenceEnhancement {
  entityId: string;
  entityName: string;
  currentConfidence: number;
  targetConfidence: number;
  missingEvidenceType: string;
  suggestedSourceTypes: string[];
  reason: string;
}

export interface NextActionRecommendation {
  actionId: string;
  title: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  category: "CAPABILITY_ACQUISITION" | "EVIDENCE_ENHANCEMENT";
  description: string;
  targetRoleTitle?: string;
  targetCapabilityName?: string;
}

export interface CareerRecommendationResult {
  analysisId: string;
  generatedAt: string;
  capabilityGaps: CapabilityGap[];
  evidenceEnhancements: EvidenceEnhancement[];
  nextActions: NextActionRecommendation[];
}
