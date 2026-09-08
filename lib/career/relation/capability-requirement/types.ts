import type { CapabilityLevel } from "../../capability-core/schema";

export type SemanticRelation = "SEMANTIC_EQUIVALENT" | "SEMANTIC_CANDIDATE_COVERS_REQUIREMENT" | "SEMANTIC_PARTIAL" | "SEMANTIC_DISTINCT" | "SEMANTIC_UNKNOWN";
export type LevelRelation = "LEVEL_MEETS" | "LEVEL_EXCEEDS" | "LEVEL_BELOW" | "LEVEL_NOT_COMPARABLE" | "LEVEL_NOT_APPLICABLE" | "LEVEL_UNKNOWN";
export type EvidenceSufficiency = "EVIDENCE_SUFFICIENT" | "EVIDENCE_INSUFFICIENT" | "EVIDENCE_UNKNOWN";
export type ScopeRelation = "SCOPE_COMPATIBLE" | "SCOPE_PARTIAL" | "SCOPE_INCOMPATIBLE" | "SCOPE_NOT_APPLICABLE" | "SCOPE_UNKNOWN";

export interface CapabilityRequirementCandidateLocator {
  candidateCapabilityOperandId: string;
  verifiedCapabilitySnapshotId: string;
  capabilityId: string;
}

/** Dimensional proposal material only: DISTINCT, BELOW, and INCOMPATIBLE are never absence, gap, or role-match claims. */
export interface CapabilityRequirementRelationEvaluation {
  semanticRelation: SemanticRelation;
  levelRelation: LevelRelation;
  evidenceSufficiency: EvidenceSufficiency;
  scopeRelation: ScopeRelation;
  composition: { mode: "SINGLE_OPERAND"; state: "COMPOSITION_NOT_EVALUATED" };
  evidenceBasis: { candidateEvidenceIds: string[]; targetRequirementEvidenceQuotes: string[] };
}

export interface CapabilityRequirementRelationLineage {
  capabilityRequirementRelationEvaluationResultId: string;
  relationProducerVersion: string;
  requirementAdmissionPolicyVersion: string;
  semanticPolicyVersion: string;
  levelPolicyVersion: string;
  scopePolicyVersion: string;
  evidencePolicyVersion: string;
}

/** One exact, proposal-bounded Candidate capability × Target requirement evaluation; it is not qualification or recommendation state. */
export interface CapabilityRequirementRelation {
  capabilityRequirementRelationId: string;
  operands: { candidate: CapabilityRequirementCandidateLocator; targetRequirementRevisionId: string };
  evaluation: CapabilityRequirementRelationEvaluation;
  evaluationState: "COMPLETED";
  proposalState: "PROPOSAL_ONLY";
  authorityState: "NONE";
  lineage: CapabilityRequirementRelationLineage;
  schemaVersion: "CAPABILITY_REQUIREMENT_RELATION_V1";
  createdAt: string;
}

export interface CapabilityRequirementRelationProducerLineage {
  relationProducerVersion: string;
  requirementAdmissionPolicyVersion: string;
  semanticPolicyVersion: string;
  levelPolicyVersion: string;
  scopePolicyVersion: string;
  evidencePolicyVersion: string;
  promptChecksum: string;
  provider: string;
  model: string;
  outputSchemaVersion: string;
}

export interface CapabilityRequirementRelationRawProviderOutputArtifact {
  rawProviderOutputRef: string;
  rawProviderOutputHash: string;
  rawProviderOutput: string;
  schemaVersion: "CAPABILITY_REQUIREMENT_RELATION_RAW_PROVIDER_OUTPUT_V1";
  createdAt: string;
}

/** Transport/audit state only; it is never a relation result or authority grant. */
export interface CapabilityRequirementRelationEvaluationRun {
  capabilityRequirementRelationEvaluationRunId: string;
  candidate: CapabilityRequirementCandidateLocator;
  targetRequirementRevisionId: string;
  producer: CapabilityRequirementRelationProducerLineage;
  status: "COMPLETED" | "PRODUCER_FAILED" | "PROVIDER_OUTPUT_INVALID" | "VALIDATION_FAILED";
  rawProviderOutputRef: string | null;
  rawProviderOutputHash: string | null;
  failureCode: string | null;
  schemaVersion: "CAPABILITY_REQUIREMENT_RELATION_EVALUATION_RUN_V1";
  startedAt: string;
  completedAt: string | null;
}

/** A result may record an evaluation failure but only COMPLETED materializes a relation. */
export interface CapabilityRequirementRelationEvaluationResult {
  capabilityRequirementRelationEvaluationResultId: string;
  capabilityRequirementRelationEvaluationRunId: string;
  candidate: CapabilityRequirementCandidateLocator;
  targetRequirementRevisionId: string;
  resultState: "COMPLETED" | "FAILED" | "TARGET_REQUIREMENT_INELIGIBLE" | "TARGET_REQUIREMENT_ELIGIBILITY_UNKNOWN" | "CANDIDATE_OPERAND_INELIGIBLE";
  evaluation: CapabilityRequirementRelationEvaluation | null;
  failureCode: string | null;
  schemaVersion: "CAPABILITY_REQUIREMENT_RELATION_EVALUATION_RESULT_V1";
  createdAt: string;
}

export interface CapabilityRequirementRelationProviderEvaluation {
  candidateCapabilityOperandId: string;
  targetRequirementRevisionId: string;
  semanticRelation: SemanticRelation;
  evidenceAssessment: EvidenceSufficiency;
  scopeAssessment: ScopeRelation;
  evidenceBasis: { candidateEvidenceIds: string[]; targetRequirementEvidenceQuotes: string[] };
}

export interface CapabilityRequirementRelationProvider {
  execute(input: { candidateCapabilityOperandId: string; targetRequirementRevisionId: string; candidate: { canonicalName: string; structuralDefinition: string; primaryDomain: string | null }; requirement: { capabilityExpression: string | null; structuralDefinition: string | null; normalizedStatement: string } }): Promise<{ rawOutput: string; evaluation: unknown }>;
}

export interface CapabilityRequirementLevelPolicy {
  version: string;
  mapTargetCapabilityLevel(value: string): CapabilityLevel | null;
}

export interface CapabilityRequirementEvidencePolicy {
  version: string;
  assess(input: { proposed: EvidenceSufficiency; candidateEvidenceIds: string[]; targetRequirementEvidenceQuotes: string[] }): EvidenceSufficiency;
}

export interface CapabilityRequirementScopePolicy {
  version: string;
  assess(input: { proposed: ScopeRelation; candidate: { structuralDefinition: string; primaryDomain: string | null }; targetScope: unknown }): ScopeRelation;
}
