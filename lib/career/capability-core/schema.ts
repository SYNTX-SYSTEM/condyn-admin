import { z } from "zod";
import { createDeterministicId } from "./hashing";

export const CapabilityScopeSchema = z.enum(["ATOMIC", "COMPOSITE"]);
export const CapabilityLevelSchema = z.enum(["L1", "L2", "L3", "L4", "L5", "L6"]);
export const EvidenceModeSchema = z.enum(["EXPLICIT", "STRUCTURALLY_DEMONSTRATED"]);

export const EvidenceClaimInputSchema = z.object({
  source_document: z.string().min(1),
  location: z.string().min(1),
  exact_quote: z.string().min(1)
}).strict();

export const CapabilityCandidateInputSchema = z.object({
  canonical_name: z.string().min(1),
  capability_scope: CapabilityScopeSchema,
  structural_definition: z.string().min(1),
  primary_domain: z.string().min(1).nullable(),
  demonstrated_capability_level: CapabilityLevelSchema.nullable(),
  model_confidence: z.number().min(0).max(1),
  evidence_mode: EvidenceModeSchema,
  evidence: z.array(EvidenceClaimInputSchema).min(1)
}).strict();

export const CapabilityCoverageAuditSchema = z.object({
  source_documents_examined: z.number().int().nonnegative(),
  capability_count: z.number().int().nonnegative(),
  atomic_capability_count: z.number().int().nonnegative(),
  composite_capability_count: z.number().int().nonnegative(),
  attribution_pass_completed: z.boolean(),
  target_state_ownership_pass_completed: z.boolean(),
  atomic_extraction_pass_completed: z.boolean(),
  method_capability_pass_completed: z.boolean(),
  composite_reconstruction_pass_completed: z.boolean(),
  global_convergence_pass_completed: z.boolean(),
  inventory_reconciliation_pass_completed: z.boolean(),
  final_reconciliation_produced_new_capabilities: z.boolean(),
  unresolved_target_operations: z.number().int().nonnegative(),
  segments_classified_as_external_source_content: z.number().int().nonnegative(),
  segments_classified_as_target_subject_operation: z.number().int().nonnegative(),
  segments_classified_as_target_subject_designed_target_state: z.number().int().nonnegative(),
  segments_classified_as_target_organization_capability: z.number().int().nonnegative(),
  segments_excluded_due_to_attribution_ambiguity: z.number().int().nonnegative()
}).strict();

export const CapabilityKernelOutputSchema = z.object({
  kernel_version: z.string().min(1),
  capabilities: z.array(CapabilityCandidateInputSchema),
  coverage_audit: CapabilityCoverageAuditSchema
}).strict();

export type CapabilityCandidateInput = z.infer<typeof CapabilityCandidateInputSchema>;
export type CapabilityKernelOutput = z.infer<typeof CapabilityKernelOutputSchema>;
export type CapabilityScope = z.infer<typeof CapabilityScopeSchema>;
export type CapabilityLevel = z.infer<typeof CapabilityLevelSchema>;

export type EvidenceVerificationStatus =
  | "UNVERIFIED" | "VERIFIED" | "REJECTED_UNKNOWN_SOURCE" | "REJECTED_EMPTY_QUOTE"
  | "REJECTED_QUOTE_NOT_FOUND" | "REJECTED_LOCATION_MISMATCH";

export interface EvidenceClaim {
  evidenceId: string;
  sourceDocumentRef: string;
  declaredLocation: string;
  exactQuote: string;
  verification: {
    status: EvidenceVerificationStatus;
    matchedDocId?: string;
    matchedPageNumber?: number;
    matchedNormalizedQuote?: string;
    sourceSpanStart?: number;
    sourceSpanEnd?: number;
    verifiedAt?: string;
    reason?: string;
  };
}

export interface CapabilityCandidate {
  candidateId: string;
  runId: string;
  proposedCanonicalName: string;
  proposedScope: CapabilityScope;
  structuralDefinition: string;
  proposedPrimaryDomain: string | null;
  proposedDemonstratedLevel: CapabilityLevel | null;
  modelConfidence: number;
  evidenceMode: "EXPLICIT" | "STRUCTURALLY_DEMONSTRATED";
  evidenceClaims: EvidenceClaim[];
  status: "UNVERIFIED" | "EVIDENCE_PASSED" | "EVIDENCE_REJECTED";
}

export interface DefinitionEvidenceBinding {
  candidateId: string;
  evidenceIds: string[];
  semanticVerificationStatus: "NOT_RUN" | "PASSED" | "FAILED";
}

export function createEvidenceClaim(input: z.infer<typeof EvidenceClaimInputSchema>): EvidenceClaim {
  return {
    evidenceId: createDeterministicId("EVD", JSON.stringify([input.source_document, input.location, input.exact_quote])),
    sourceDocumentRef: input.source_document,
    declaredLocation: input.location,
    exactQuote: input.exact_quote,
    verification: { status: "UNVERIFIED" }
  };
}

export function createCapabilityCandidate(runId: string, input: CapabilityCandidateInput): CapabilityCandidate {
  const evidenceClaims = input.evidence.map(createEvidenceClaim);
  const fingerprints = evidenceClaims.map(({ evidenceId }) => evidenceId).sort();
  return {
    candidateId: createDeterministicId("CAND", JSON.stringify([runId, input.canonical_name, input.structural_definition, fingerprints])),
    runId,
    proposedCanonicalName: input.canonical_name,
    proposedScope: input.capability_scope,
    structuralDefinition: input.structural_definition,
    proposedPrimaryDomain: input.primary_domain,
    proposedDemonstratedLevel: input.demonstrated_capability_level,
    modelConfidence: input.model_confidence,
    evidenceMode: input.evidence_mode,
    evidenceClaims,
    status: "UNVERIFIED"
  };
}

export function createDefinitionEvidenceBinding(candidate: CapabilityCandidate): DefinitionEvidenceBinding {
  return { candidateId: candidate.candidateId, evidenceIds: candidate.evidenceClaims.map(({ evidenceId }) => evidenceId), semanticVerificationStatus: "NOT_RUN" };
}

export type CapabilityRelationType = "SAME_CAPABILITY" | "PARENT_CHILD" | "RELATED_CAPABILITY" | "DISTINCT_CAPABILITY" | "UNRESOLVED";
export interface CapabilityRelation {
  relationId: string;
  sourceCapabilityRef: string;
  targetCapabilityRef: string;
  relationType: CapabilityRelationType;
  status: "PROPOSED" | "VERIFIED" | "REJECTED";
  reason: string;
  createdBy: "DETERMINISTIC_RULE" | "SEMANTIC_RESOLVER" | "HUMAN_GOLD";
  createdAt: string;
}

export function createCapabilityRelation(input: Omit<CapabilityRelation, "relationId">): CapabilityRelation {
  return { ...input, relationId: createDeterministicId("REL", JSON.stringify([input.sourceCapabilityRef, input.targetCapabilityRef, input.relationType])) };
}

export interface VerifiedCapability {
  capabilityId: string;
  canonicalName: string;
  scope: CapabilityScope;
  structuralDefinition: string;
  primaryDomain: string | null;
  demonstratedCapabilityLevel: CapabilityLevel | null;
  levelVerificationStatus: "UNVERIFIED" | "VERIFIED";
  evidenceIds: string[];
  relationIds: string[];
  provenance: { sourceCandidateIds: string[]; sourceDocumentIds: string[] };
  validation: { evidenceStatus: "PASSED"; semanticDefinitionStatus: "NOT_RUN" | "PASSED"; convergenceStatus: "MANUAL_GOLD" | "VERIFIED" };
}

export interface VerifiedCapabilitySnapshot {
  snapshotId: string;
  sourceBundleHash: string;
  kernelVersion: string;
  prompt: { templateId?: string; versionId?: string; checksum: string };
  inference: { provider: string; model: string };
  schemaVersion: string;
  capabilityIds: string[];
  relationIds: string[];
  evidenceIds: string[];
  capabilities: VerifiedCapability[];
  evidence: EvidenceClaim[];
  relations: CapabilityRelation[];
  validationSummary: { candidateCount: number; rejectedCandidateCount: number; verifiedCapabilityCount: number; verifiedEvidenceCount: number; rejectedEvidenceCount: number; unresolvedRelationCount: number };
  /** Optional so Phase-1/manual snapshots preserve their historical identity and shape. */
  publication?: { mode: "PHASE4_VERIFIED"; verificationRunId: string; verificationRawOutputHash: string };
  createdAt: string;
  status: "DRAFT" | "VERIFIED" | "SUPERSEDED";
}

export interface CapabilityDiscoveryRun {
  runId: string;
  sourceBundleHash: string;
  kernelVersion: string;
  prompt: { templateId?: string; versionId?: string; checksum: string };
  inference: { provider: string; model: string };
  schemaVersion: string;
  status: string;
  rawOutputHash?: string;
  payload: unknown;
  createdAt: string;
  completedAt?: string;
}
