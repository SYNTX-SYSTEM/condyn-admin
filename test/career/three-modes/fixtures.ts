import type { SelectedRoleCoverage } from "../../../lib/career/job-pool/selected-role-coverage";
import type { JobStructure } from "../../../lib/career/job-pool/job-structure";

/** Three investigation modes (frontend): bodies as GELB's routes deliver them (SELECTED_ROLE_COVERAGE_V1, JOB_STRUCTURE_V1). */
export const UPLOAD = "JPOOL_6CA8892F9AD0F6AC316F8FC3F6294BB7";
export const ROLE = "role_pink_alpha_architect";
export const ANALYSIS = "ANL_1792044447366_377";

export const coverage = (): SelectedRoleCoverage => ({
  comparisonVersion: "SELECTED_ROLE_COVERAGE_V1",
  binding: { analysisId: ANALYSIS, jobId: "JOB_1792044447366_377", jobPoolUploadId: UPLOAD, poolRoleId: ROLE, investigationScopeHash: "ad1ae5e4a6faba2b00", discoveryRunId: "RUN_A", convergenceRunId: "CONV_A", poolCanonicalSha256: "sha", poolVersion: 1, targetRoleProfileRevisionId: "TRPREV_A" },
  role: { poolRoleId: ROLE, title: "Distributed Systems Architect", poolOrganizationId: "org_pink_alpha", organizationName: "Alpha Industrial Systems" },
  authority: { comparisonBasis: "CAPABILITY_PROPOSAL_NAME_COVERAGE", operand: "CAPABILITY_PROPOSAL_PROJECTION", scored: false, authorityState: "NONE", capabilityRequirementRelationState: "NOT_EVALUATED", reason: "VERIFIED_CAPABILITY_SNAPSHOT_ABSENT" },
  requirements: [
    { poolRequirementId: "req_pink_alpha_1", capabilityName: "Distributed Systems Architecture", aliases: [], domain: "Engineering", requiredLevel: "L5 expert", weight: 1, necessityState: "REQUIRED", requirementType: "CAPABILITY", matchingEligibility: "MATCHING_ELIGIBLE_PROPOSAL_ONLY", targetRequirementRevisionId: "TRQREV_1", coverage: { state: "COVERED", proposal: { capabilityProposalId: "CAPP_1", name: "Distributed Systems Architecture", matchBasis: "EXACT", matchedConstituent: null, evidence: [{ docId: "DOC_001", quote: "Architected distributed IIoT Edge Computing systems with 99.999% uptime guarantees." }], evidenceState: "SOURCE_MATCH_VERIFIED", authorityState: "NONE", scored: false } } },
    { poolRequirementId: "req_pink_alpha_2", capabilityName: "Edge Computing Platforms", aliases: [], domain: "Engineering", requiredLevel: "advanced", weight: 0.6, necessityState: "PREFERRED", requirementType: "CAPABILITY", matchingEligibility: "MATCHING_ELIGIBILITY_UNKNOWN", targetRequirementRevisionId: "TRQREV_2", coverage: { state: "COVERED", proposal: { capabilityProposalId: "CAPP_2", name: "Edge Computing", matchBasis: "TOKEN_CONTAINMENT", matchedConstituent: null, evidence: [{ docId: "DOC_001", quote: "high-throughput edge automation" }], evidenceState: "SOURCE_MATCH_VERIFIED", authorityState: "NONE", scored: false } } },
    { poolRequirementId: "req_pink_alpha_3", capabilityName: "Industrial IoT Protocol Design", aliases: [], domain: "Engineering", requiredLevel: "", weight: 0.4, necessityState: "UNKNOWN", requirementType: "CAPABILITY", matchingEligibility: "MATCHING_ELIGIBILITY_UNKNOWN", targetRequirementRevisionId: "TRQREV_3", coverage: { state: "NOT_COVERED", proposal: null } }
  ],
  proposals: [{ id: "CAPP_1", name: "Distributed Systems Architecture", scope: "ATOMIC", coversPoolRequirementIds: ["req_pink_alpha_1"] }, { id: "CAPP_2", name: "Edge Computing", scope: "ATOMIC", coversPoolRequirementIds: ["req_pink_alpha_2"] }, { id: "CAPP_3", name: "Gossip Protocols", scope: "ATOMIC", coversPoolRequirementIds: [] }],
  counts: { requirements: 3, covered: 2, notCovered: 1, proposals: 3 }
});

export const structure = (): JobStructure => ({
  structureVersion: "JOB_STRUCTURE_V1",
  investigationMode: "JOB",
  binding: { jobPoolUploadId: UPLOAD, poolRoleId: ROLE, poolId: "pool_pink_validation_v1", poolVersion: 1, poolCanonicalSha256: "sha", targetRoleProfileRevisionId: "TRPREV_A" },
  organization: { poolOrganizationId: "org_pink_alpha", name: "Alpha Industrial Systems", industry: "Industrial automation", scale: "ENTERPRISE", region: "Bavaria", countryIso: "DE", description: "Lab organization." },
  role: { poolRoleId: ROLE, title: "Distributed Systems Architect", seniority: "SENIOR", domainFocus: "Edge", description: "Owns the edge platform.", profile: { roleDescriptor: null, roleSemanticDefinition: "Distributed Systems Architect", seniorityInterpretation: null, domainContext: null, responsibilityScope: { state: "NOT_DECLARED" }, proposalState: "PROPOSAL_ONLY", semanticValidationState: "NOT_RUN", authorityState: "NONE" } },
  requirements: [
    { poolRequirementId: "req_pink_alpha_1", capabilityName: "Distributed Systems Architecture", aliases: [], domain: "Engineering", requiredLevel: "L5", weight: 1, requirementType: "CAPABILITY", requirementTypeDeclared: false, targetRequirementRevisionId: "TRQREV_1", necessityState: { kind: "REQUIRED" }, requiredLevelState: { kind: "CAPABILITY_LEVEL", level: "L5" }, matchingEligibility: "MATCHING_ELIGIBLE_PROPOSAL_ONLY", validation: { classificationValidationState: "VALIDATED", semanticInterpretationState: "NOT_RUN", requiredLevelValidationState: "SUPPORTED", necessityValidationState: "SUPPORTED", scopeValidationState: "NOT_APPLICABLE" }, evidence: ["REQUIREMENT req_pink_alpha_1 NECESSITY: REQUIRED"] },
    { poolRequirementId: "req_pink_alpha_3", capabilityName: "Industrial IoT Protocol Design", aliases: [], domain: "", requiredLevel: "", weight: 0.4, requirementType: "CAPABILITY", requirementTypeDeclared: false, targetRequirementRevisionId: "TRQREV_3", necessityState: { kind: "UNKNOWN" }, requiredLevelState: { kind: "UNKNOWN" }, matchingEligibility: "MATCHING_ELIGIBILITY_UNKNOWN", validation: { classificationValidationState: "VALIDATED", semanticInterpretationState: "NOT_RUN", requiredLevelValidationState: "UNKNOWN", necessityValidationState: "UNKNOWN", scopeValidationState: "NOT_APPLICABLE" }, evidence: [] }
  ],
  findings: [
    { code: "ROLE_RESPONSIBILITY_NOT_DECLARED", subject: { kind: "ROLE", id: ROLE }, field: "responsibility", evidence: [], relatedRequirementIds: [] },
    { code: "REQUIREMENT_NECESSITY_UNDECLARED", subject: { kind: "REQUIREMENT", id: "req_pink_alpha_3" }, field: "necessity", evidence: [], relatedRequirementIds: [] }
  ],
  authority: { basis: "DECLARED_POOL_FIELDS_AND_CANONICAL_VALIDATION", interpretation: "NONE", proposalState: "PROPOSAL_ONLY", authorityState: "NONE", scored: false },
  counts: { requirements: 2, findings: 2 }
});

/** A fetcher that answers one status and body and records what it was asked. */
export function answering(status: number, body: unknown) {
  const calls: Array<{ url: string; init: { method: string; cache: string; signal?: AbortSignal; headers?: Record<string, string> } }> = [];
  const fetcher = async (url: string, init: { method: "GET"; cache: "no-store"; signal?: AbortSignal; headers?: Record<string, string> }) => { calls.push({ url, init }); return { status, json: async () => body }; };
  return { calls, fetcher };
}
