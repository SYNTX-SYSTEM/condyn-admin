import type { TargetRoleProfileSemanticPayload } from "../profile";

export type TargetRoleProfileEvidenceField = keyof TargetRoleProfileSemanticPayload;
export interface TargetRoleProfileEvidenceClaim { profileField: TargetRoleProfileEvidenceField; exactQuote: string; }
export interface TargetRoleReconstructionProducer { producerVersion: string; promptChecksum: string; provider: string; model: string; outputSchemaVersion: string; normalizationVersion: string; }
/** Batch transport/audit artifact; it is not semantic role truth. */
export interface TargetRoleReconstructionBatchRun { targetRoleReconstructionBatchRunId: string; targetRoleOrganizationBindingRevisionIds: string[]; producer: TargetRoleReconstructionProducer; status: "PREFLIGHT_FAILED" | "PROVIDER_FAILED" | "PROVIDER_OUTPUT_INVALID" | "COMPLETED"; rawProviderOutputRef: string | null; rawProviderOutputHash: string | null; failureCode: string | null; startedAt: string; completedAt: string; }
export type TargetRoleReconstructionBatchRunInput = TargetRoleReconstructionBatchRun;
export type TargetRoleReconstructionResult =
  | { targetRoleReconstructionResultId: string; targetRoleReconstructionBatchRunId: string; targetRoleOrganizationBindingRevisionId: string; targetRoleEntityId: string; resultState: "PROFILE_PROPOSAL_ELIGIBLE"; profile: TargetRoleProfileSemanticPayload; evidence: TargetRoleProfileEvidenceClaim[]; structuralValidationState: "PASSED"; sourceEvidenceState: "SOURCE_MATCH_VERIFIED"; semanticValidationState: "NOT_RUN"; proposalState: "PROPOSAL_ONLY"; authorityState: "NONE"; proposedTargetRoleProfileRevisionId: string; schemaVersion: "TARGET_ROLE_RECONSTRUCTION_RESULT_V1"; createdAt: string }
  | { targetRoleReconstructionResultId: string; targetRoleReconstructionBatchRunId: string; targetRoleOrganizationBindingRevisionId: string; targetRoleEntityId: string; resultState: "FAILED"; failureCode: string; schemaVersion: "TARGET_ROLE_RECONSTRUCTION_RESULT_V1"; createdAt: string };
export type TargetRoleReconstructionResultInput =
  | Omit<Extract<TargetRoleReconstructionResult, { resultState: "PROFILE_PROPOSAL_ELIGIBLE" }>, "targetRoleReconstructionResultId">
  | Omit<Extract<TargetRoleReconstructionResult, { resultState: "FAILED" }>, "targetRoleReconstructionResultId">;
