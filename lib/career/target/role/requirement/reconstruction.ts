import type { TargetRequirementSemanticPayload } from "./types";
/**
 * Compatibility-only pre-durable transport shapes. They are deliberately not
 * barrel-exported: canonical T5 batch/result artifacts live in artifact.ts.
 */
export interface TargetRequirementReconstructionBatchRun { targetRequirementReconstructionBatchRunId: string; targetRoleProfileRevisionIds: string[]; status: "PREFLIGHT_FAILED" | "PROVIDER_FAILED" | "PROVIDER_OUTPUT_INVALID" | "COMPLETED"; rawProviderOutputRef: string | null; rawProviderOutputHash: string | null; failureCode: string | null; producerVersion: string; promptChecksum: string; provider: string; model: string; outputSchemaVersion: string; normalizationVersion: string; startedAt: string; completedAt: string | null; }
export interface TargetRequirementReconstructionResult { targetRequirementReconstructionResultId: string; targetRequirementReconstructionBatchRunId: string; targetRoleProfileRevisionId: string; targetRequirementEntityAdmissionId: string | null; resultState: "REQUIREMENT_PROPOSAL_ELIGIBLE" | "FAILED" | "NO_REQUIREMENTS_EXTRACTED" | "ZERO_CONFIRMED_REQUIREMENTS"; requirement: TargetRequirementSemanticPayload | null; failureCode: string | null; createdAt: string; }
