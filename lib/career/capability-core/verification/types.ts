import type { CanonicalCapabilityDraft } from "../convergence/types";
import type { CapabilityConvergenceRun } from "../convergence/types";
import type { CapabilityCoreRepository } from "../repository";
import type { SourceDocument } from "../source";
import type { CapabilityCandidate, CapabilityDiscoveryRun, CapabilityRelation, EvidenceClaim, VerifiedCapability, VerifiedCapabilitySnapshot } from "../schema";

/**
 * Phase 4 receives semantic drafts but must publish only CONDYN-verified truth.
 * Provider output is deliberately absent: it cannot author evidence, provenance, or IDs.
 */
export interface CapabilityVerificationPublicationInput {
  canonicalDrafts: CanonicalCapabilityDraft[];
  capabilities: VerifiedCapability[];
  evidence: EvidenceClaim[];
  /** Complete Phase-3 relation inventory; every member needs a Phase-4 disposition. */
  proposedRelations: CapabilityRelation[];
  publicationContext: CapabilityVerificationPublicationContext;
}

/** Not authoritative: next slice derives bundle/counts from authenticated Convergence/Discovery lineage and binds deterministic snapshot schema configuration into VFY identity. */
export interface CapabilityVerificationPublicationContext {
  sourceBundleHash: string;
  schemaVersion: string;
  candidateCount: number;
  rejectedCandidateCount: number;
}

/** Final relation states that are eligible to enter a verified truth snapshot. */
export type FinalVerifiedRelationType = "PARENT_CHILD" | "RELATED_CAPABILITY" | "DISTINCT_CAPABILITY";

/** The immutable Phase 4 audit artifact may complete while truth publication remains blocked. */
export interface CapabilityVerificationRun {
  runKind: "CAPABILITY_VERIFICATION";
  verificationRunId: string;
  convergenceRunId: string;
  convergenceRawOutputHash: string;
  sourceEvidenceRepresentationHash: string;
  /** Persisted lineage metadata; Slice 2C authenticates it against the upstream artifacts. */
  sourceBundleHash: string;
  kernelVersion: string;
  promptChecksum: string;
  inference: { provider: string; model: string };
  schemaVersion: string;
  algorithmVersion: string;
  snapshotSchemaVersion: string;
  rawOutputHash: string;
  status: "COMPLETED";
  payload: {
    semanticDefinitionOutcomes: Array<{ provisionalCapabilityId: string; status: "PASSED" | "FAILED" }>;
    demonstratedLevelOutcomes: Array<{ provisionalCapabilityId: string; status: "VERIFIED" | "UNVERIFIED"; demonstratedCapabilityLevel: "L1" | "L2" | "L3" | "L4" | "L5" | "L6" | null }>;
    relationDispositions: Array<{ relationId: string; status: "VERIFIED" | "REJECTED" | "UNRESOLVED" }>;
    publicationEligibility: "ELIGIBLE" | "BLOCKED";
  };
  createdAt: string;
  completedAt: string;
}

export interface CapabilityVerificationRunIdentityInput {
  convergenceRunId: string;
  convergenceRawOutputHash: string;
  sourceEvidenceRepresentationHash: string;
  kernelVersion: string;
  promptChecksum: string;
  provider: string;
  model: string;
  schemaVersion: string;
  algorithmVersion: string;
  snapshotSchemaVersion: string;
}

/** Slice 2 authenticates every artifact before it can authorize final publication. */
export interface CapabilityVerificationIntegrityInput {
  sourceDocuments: SourceDocument[];
  discoveryRun: CapabilityDiscoveryRun;
  convergenceRun: CapabilityConvergenceRun;
  verificationRun: CapabilityVerificationRun;
}

/** Contract-only result: the next publisher accepts this reconstructed artifact, never caller-built copies. */
export interface AuthenticatedCapabilityVerificationChain {
  sourceBundleHash: string;
  sourceEvidenceRepresentationHash: string;
  discoveryRun: CapabilityDiscoveryRun;
  discoveryCandidates: CapabilityCandidate[];
  convergenceRun: CapabilityConvergenceRun;
  canonicalDrafts: CanonicalCapabilityDraft[];
  proposedRelations: CapabilityRelation[];
  verificationRun: CapabilityVerificationRun;
  verifiedEvidence: EvidenceClaim[];
  candidateCount: number;
  rejectedCandidateCount: number;
  snapshotSchemaVersion: string;
}

/**
 * Authentication proves consistency. Authority is established only by successful persisted
 * authentication through trusted repository dependencies; this chain is not a caller-supplied token.
 */
export interface AuthoritativeCapabilityVerificationChain extends AuthenticatedCapabilityVerificationChain {}

/** Trusted application dependency, deliberately separate from caller-supplied integrity artifacts. */
export interface CapabilityVerificationAuthorityDependencies {
  repository: Pick<CapabilityCoreRepository, "getRunById" | "getConvergenceRunById" | "getVerificationRunById">;
}

/** Phase 4 metadata binds final truth to the immutable run that authorized publication. */
export interface VerifiedSnapshotPublicationMetadata { verificationRunId: string; verificationRawOutputHash: string; }

/** Transitional Slice 1A publisher contract; Slice 2D replaces this caller-built input. */
export interface InterimVerifiedCapabilitySnapshotPublisher {
  publish(input: CapabilityVerificationPublicationInput & { verificationRun: CapabilityVerificationRun }): VerifiedCapabilitySnapshot;
}

/**
 * The final publisher establishes persisted authority internally from raw integrity input.
 * Its repository dependency is fixed when the publisher is constructed, not supplied by the caller.
 */
export interface VerifiedCapabilitySnapshotPublisher {
  publish(input: CapabilityVerificationIntegrityInput): Promise<VerifiedCapabilitySnapshot>;
}

/** Slice 2D construction contract; implementation remains deliberately deferred. */
export type CreateVerifiedCapabilitySnapshotPublisher = (
  dependencies: CapabilityVerificationAuthorityDependencies
) => VerifiedCapabilitySnapshotPublisher;
