/** Scripted route bodies shaped exactly like docs/architecture/decision-fields/JOB_POOL_CONNECTION.md §5 and lib/career/job-pool/types.ts. */
import type { JobPoolMatchPresentation, JobPoolUploadSummary, JobPoolUploadView } from "../../../../lib/career/job-pool/types";

export const UPLOAD_ID = "JPOOL_0123456789abcdef";

export const summary: JobPoolUploadSummary = {
  jobPoolUploadId: UPLOAD_ID,
  poolId: "POOL_SAMPLE",
  poolVersion: 1,
  poolName: "Sample Pool",
  poolStatus: "ACTIVE",
  organizationCount: 1,
  roleCount: 2,
  requirementCount: 3,
  uploadedByActorRef: "JOB_POOL_UPLOADER:TESTER",
  uploadedAt: "2026-10-10T18:00:00.000Z"
};

export const view: JobPoolUploadView = {
  ...summary,
  canonicalSha256: "c".repeat(64),
  rawSha256: "r".repeat(64),
  pool: { pool: { id: "POOL_SAMPLE" } },
  canonicalMapping: {
    mappingState: "MAPPED",
    proposalState: "PROPOSAL_ONLY",
    authorityState: "NONE",
    provider: "CONDYN_JOB_POOL_JSON",
    organizations: [{ poolOrganizationId: "ORG_1", name: "Acme", targetOrganizationEntityId: "TOENT_1", targetOrganizationRevisionId: "TOREV_1" }],
    roles: [
      {
        poolRoleId: "ROLE_A", title: "Platform Engineer", poolOrganizationId: "ORG_1", targetSourceRevisionId: "TSREV_1", targetRoleEntityId: "TRENT_A",
        targetRoleSourceBindingRevisionId: "TRSB_A", targetRoleOrganizationBindingRevisionId: "TROB_A", targetRoleProfileRevisionId: "TRPREV_A",
        targetRoleReconstructionBatchRunId: "TRRB_1", targetRequirementReconstructionBatchRunId: "TRQRB_1",
        requirements: [
          { poolRequirementId: "REQ_1", capabilityName: "TypeScript", targetRequirementEntityId: "TRQENT_1", targetRequirementRevisionId: "TRQREV_1", matchingEligibility: "MATCHING_ELIGIBLE_PROPOSAL_ONLY", necessityState: "REQUIRED" },
          { poolRequirementId: "REQ_2", capabilityName: "Kubernetes", targetRequirementEntityId: "TRQENT_2", targetRequirementRevisionId: "TRQREV_2", matchingEligibility: "MATCHING_ELIGIBLE_PROPOSAL_ONLY", necessityState: "UNKNOWN" }
        ]
      },
      {
        poolRoleId: "ROLE_B", title: "Data Analyst", poolOrganizationId: "ORG_1", targetSourceRevisionId: "TSREV_1", targetRoleEntityId: "TRENT_B",
        targetRoleSourceBindingRevisionId: "TRSB_B", targetRoleOrganizationBindingRevisionId: "TROB_B", targetRoleProfileRevisionId: "TRPREV_B",
        targetRoleReconstructionBatchRunId: "TRRB_1", targetRequirementReconstructionBatchRunId: "TRQRB_1",
        requirements: [
          { poolRequirementId: "REQ_3", capabilityName: "SQL", targetRequirementEntityId: "TRQENT_3", targetRequirementRevisionId: "TRQREV_3", matchingEligibility: "MATCHING_ELIGIBLE_PROPOSAL_ONLY", necessityState: "PREFERRED" }
        ]
      }
    ]
  }
};

export const matches: JobPoolMatchPresentation = {
  presentation: { kind: "DETERMINISTIC_RESONANCE_PRESENTATION", policyVersion: "JOB_POOL_PRESENTATION_MATCHING_V1", authorityState: "NONE", canonicalEvaluation: false, decision: false, weakEvidenceThreshold: 0.4 },
  analysisId: "ANL_TEST",
  jobPoolUploadId: UPLOAD_ID,
  poolId: "POOL_SAMPLE",
  poolVersion: 1,
  candidateCapabilityCount: 2,
  roleMatches: [
    {
      poolRoleId: "ROLE_A", title: "Platform Engineer", seniority: "Senior", domainFocus: "Platform", poolOrganizationId: "ORG_1", organizationName: "Acme", resonanceScore: 0.75,
      matched: [{ poolRequirementId: "REQ_1", capabilityName: "TypeScript", requiredLevel: "L4", weight: 1, necessity: "REQUIRED", matchBasis: "EXACT", matchedCapabilityName: "TypeScript", matchedCapabilityEntityId: "CAP_TS", confidence: 0.9, contribution: 0.75, evidence: [{ docId: "DOC_CV", quote: "Built services in TypeScript for six years." }] }],
      weakEvidence: [],
      missing: [{ poolRequirementId: "REQ_2", capabilityName: "Kubernetes", requiredLevel: "L3", weight: 0.5, necessity: "UNDECLARED", evidenceHint: "cluster operations" }],
      canonical: { targetRoleProfileRevisionId: "TRPREV_A", targetRequirementRevisionIds: ["TRQREV_1", "TRQREV_2"], capabilityRequirementRelationState: "NOT_EVALUATED", reason: "VERIFIED_CAPABILITY_SNAPSHOT_ABSENT" }
    },
    {
      poolRoleId: "ROLE_B", title: "Data Analyst", seniority: "Mid", domainFocus: "Data", poolOrganizationId: "ORG_1", organizationName: "Acme", resonanceScore: 0.3,
      matched: [],
      weakEvidence: [{ poolRequirementId: "REQ_3", capabilityName: "SQL", requiredLevel: "L2", weight: 0.6, necessity: "PREFERRED", matchBasis: "TOKEN_CONTAINMENT", matchedCapabilityName: "SQL Reporting", matchedCapabilityEntityId: "CAP_SQL", confidence: 0.3, contribution: 0.18, evidence: [{ docId: "DOC_CV", quote: "Occasional SQL reporting for the finance team." }], reason: "confidence 0.3 below weakEvidenceThreshold 0.4" }],
      missing: [],
      canonical: { targetRoleProfileRevisionId: "TRPREV_B", targetRequirementRevisionIds: ["TRQREV_3"], capabilityRequirementRelationState: "NOT_EVALUATED", reason: "VERIFIED_CAPABILITY_SNAPSHOT_ABSENT" }
    }
  ],
  organizationMatches: [{ poolOrganizationId: "ORG_1", name: "Acme", industry: "Software", aggregateScore: 0.525, roleCount: 2, topRoleTitle: "Platform Engineer" }]
};
