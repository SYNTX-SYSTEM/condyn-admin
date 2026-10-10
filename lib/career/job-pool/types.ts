/**
 * HTTP view types of the Job Pool connection (docs/architecture/decision-fields/JOB_POOL_CONNECTION.md §5).
 *
 * Three layers stay separated:
 * - canonical relational state (target revisions, PROPOSAL_ONLY, authority NONE),
 * - presentation matching (computed on read, authority NONE, never persisted as canonical state),
 * - governed human decisions (HR Decision Looper, no edge from this module).
 */

export type JobPoolMatchBasis = "EXACT" | "ALIAS" | "TOKEN_CONTAINMENT";

export interface JobPoolUploadSummary {
  jobPoolUploadId: string;
  poolId: string;
  poolVersion: number;
  poolName: string;
  poolStatus: "DRAFT" | "ACTIVE" | "ARCHIVED";
  organizationCount: number;
  roleCount: number;
  requirementCount: number;
  uploadedByActorRef: string;
  uploadedAt: string;
}

export interface JobPoolCanonicalRequirementMapping {
  poolRequirementId: string;
  capabilityName: string;
  targetRequirementEntityId: string;
  targetRequirementRevisionId: string;
  matchingEligibility: "MATCHING_ELIGIBLE_PROPOSAL_ONLY" | "MATCHING_INELIGIBLE" | "MATCHING_ELIGIBILITY_UNKNOWN";
  necessityState: "REQUIRED" | "PREFERRED" | "OPTIONAL" | "UNKNOWN";
}

export interface JobPoolCanonicalRoleMapping {
  poolRoleId: string;
  title: string;
  poolOrganizationId: string;
  targetSourceRevisionId: string;
  targetRoleEntityId: string;
  targetRoleSourceBindingRevisionId: string;
  targetRoleOrganizationBindingRevisionId: string;
  targetRoleProfileRevisionId: string;
  targetRoleReconstructionBatchRunId: string;
  targetRequirementReconstructionBatchRunId: string;
  requirements: JobPoolCanonicalRequirementMapping[];
}

export interface JobPoolCanonicalMapping {
  mappingState: "MAPPED";
  proposalState: "PROPOSAL_ONLY";
  authorityState: "NONE";
  provider: "CONDYN_JOB_POOL_JSON";
  organizations: Array<{ poolOrganizationId: string; name: string; targetOrganizationEntityId: string; targetOrganizationRevisionId: string }>;
  roles: JobPoolCanonicalRoleMapping[];
}

export interface JobPoolUploadView extends JobPoolUploadSummary {
  canonicalSha256: string;
  rawSha256: string;
  pool: unknown;
  canonicalMapping: JobPoolCanonicalMapping;
}

export interface JobPoolEvidenceQuote {
  docId: string;
  quote: string;
}

export interface JobPoolMatchedRequirement {
  poolRequirementId: string;
  capabilityName: string;
  requiredLevel: string;
  weight: number;
  necessity: "REQUIRED" | "PREFERRED" | "OPTIONAL" | "UNDECLARED";
  matchBasis: JobPoolMatchBasis;
  matchedCapabilityName: string;
  matchedCapabilityEntityId: string;
  confidence: number;
  contribution: number;
  evidence: JobPoolEvidenceQuote[];
}

export interface JobPoolWeakRequirement extends JobPoolMatchedRequirement {
  reason: string;
}

export interface JobPoolMissingRequirement {
  poolRequirementId: string;
  capabilityName: string;
  requiredLevel: string;
  weight: number;
  necessity: "REQUIRED" | "PREFERRED" | "OPTIONAL" | "UNDECLARED";
  evidenceHint: string | null;
}

export interface JobPoolCanonicalRelationState {
  targetRoleProfileRevisionId: string;
  targetRequirementRevisionIds: string[];
  capabilityRequirementRelationState: "NOT_EVALUATED";
  reason: "VERIFIED_CAPABILITY_SNAPSHOT_ABSENT";
}

export interface JobPoolRoleMatch {
  poolRoleId: string;
  title: string;
  seniority: string;
  domainFocus: string;
  poolOrganizationId: string;
  organizationName: string;
  resonanceScore: number;
  matched: JobPoolMatchedRequirement[];
  weakEvidence: JobPoolWeakRequirement[];
  missing: JobPoolMissingRequirement[];
  canonical: JobPoolCanonicalRelationState;
}

export interface JobPoolOrganizationMatch {
  poolOrganizationId: string;
  name: string;
  industry: string;
  aggregateScore: number;
  roleCount: number;
  topRoleTitle: string | null;
}

export interface JobPoolMatchPresentation {
  presentation: {
    kind: "DETERMINISTIC_RESONANCE_PRESENTATION";
    policyVersion: "JOB_POOL_PRESENTATION_MATCHING_V1";
    authorityState: "NONE";
    canonicalEvaluation: false;
    decision: false;
    weakEvidenceThreshold: number;
  };
  analysisId: string;
  jobPoolUploadId: string;
  poolId: string;
  poolVersion: number;
  candidateCapabilityCount: number;
  roleMatches: JobPoolRoleMatch[];
  organizationMatches: JobPoolOrganizationMatch[];
}

export interface JobPoolErrorBody {
  error: { code: string; message: string; issues?: Array<{ path: string; message: string }> };
}
