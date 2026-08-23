import type { CanonicalCapabilityDraft } from "../convergence/types";
import type { CapabilityRelation, EvidenceClaim, VerifiedCapability, VerifiedCapabilitySnapshot } from "../schema";

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
  kernelVersion: string;
  promptChecksum: string;
  inference: { provider: string; model: string };
  schemaVersion: string;
  algorithmVersion: string;
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
  kernelVersion: string;
  promptChecksum: string;
  provider: string;
  model: string;
  schemaVersion: string;
  algorithmVersion: string;
}

/** Phase 4 metadata binds final truth to the immutable run that authorized publication. */
export interface VerifiedSnapshotPublicationMetadata { verificationRunId: string; verificationRawOutputHash: string; }

/**
 * The publisher consumes a verification artifact, but this slice does not yet establish
 * that artifact's identity, schema, upstream binding, or immutable repository provenance.
 * Verification Run Integrity will make a run publication-authoritative in a later slice.
 */
export interface VerifiedCapabilitySnapshotPublisher {
  publish(input: CapabilityVerificationPublicationInput & { verificationRun: CapabilityVerificationRun }): VerifiedCapabilitySnapshot;
}
