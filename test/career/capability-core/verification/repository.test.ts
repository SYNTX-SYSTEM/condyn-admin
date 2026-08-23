import { describe, expect, it } from "vitest";
import { buildProvisionalCapabilityId, buildSnapshotId, createVerifiedCapabilitySnapshot, InMemoryCapabilityCoreRepository, PostgresCapabilityCoreRepository, type EvidenceClaim, type VerifiedCapability } from "../../../../lib/career/capability-core";
import type { CapabilityVerificationRun } from "../../../../lib/career/capability-core/verification";

const createdAt = "2026-01-01T00:00:00.000Z";
const evidence: EvidenceClaim[] = [{ evidenceId: "EVD_1", sourceDocumentRef: "DOC_1", declaredLocation: "Page 1", exactQuote: "quote", verification: { status: "VERIFIED", matchedDocId: "DOC_1" } }];
const provisionalCapabilityId = buildProvisionalCapabilityId("Capability", "ATOMIC");
const capability: VerifiedCapability = { capabilityId: provisionalCapabilityId.replace("PCAP_", "CAP_"), canonicalName: "Capability", scope: "ATOMIC", structuralDefinition: "Definition", primaryDomain: null, demonstratedCapabilityLevel: null, levelVerificationStatus: "UNVERIFIED", evidenceIds: ["EVD_1"], relationIds: [], provenance: { sourceCandidateIds: ["CAND_1"], sourceDocumentIds: ["DOC_1"] }, validation: { evidenceStatus: "PASSED", semanticDefinitionStatus: "PASSED", convergenceStatus: "VERIFIED" } };
const genericSnapshot = () => createVerifiedCapabilitySnapshot({ sourceBundleHash: "source", kernelVersion: "kernel", prompt: { checksum: "prompt" }, inference: { provider: "gemini", model: "model" }, schemaVersion: "snapshot-schema", candidateCount: 1, rejectedCandidateCount: 0, createdAt, status: "VERIFIED" }, [capability], evidence);
const verificationRun: CapabilityVerificationRun = { runKind: "CAPABILITY_VERIFICATION", verificationRunId: "VFY_0123456789ABCDEF01234567", convergenceRunId: "CONV_0123456789ABCDEF01234567", convergenceRawOutputHash: "a".repeat(64), sourceEvidenceRepresentationHash: "c".repeat(64), sourceBundleHash: "source", kernelVersion: "verification-kernel", promptChecksum: "verification-prompt", inference: { provider: "gemini", model: "verification-model" }, schemaVersion: "verification-schema", algorithmVersion: "algorithm", snapshotSchemaVersion: "snapshot-schema", rawOutputHash: "b".repeat(64), status: "COMPLETED", payload: { semanticDefinitionOutcomes: [{ provisionalCapabilityId, status: "PASSED" }], demonstratedLevelOutcomes: [{ provisionalCapabilityId, status: "UNVERIFIED", demonstratedCapabilityLevel: null }], relationDispositions: [], publicationEligibility: "ELIGIBLE" }, createdAt, completedAt: createdAt };
const phase4Snapshot = () => {
  const generic = createVerifiedCapabilitySnapshot({ sourceBundleHash: "source", kernelVersion: verificationRun.kernelVersion, prompt: { checksum: verificationRun.promptChecksum }, inference: verificationRun.inference, schemaVersion: verificationRun.snapshotSchemaVersion, candidateCount: 1, rejectedCandidateCount: 0, createdAt, status: "VERIFIED" }, [capability], evidence);
  const publication = { mode: "PHASE4_VERIFIED" as const, verificationRunId: verificationRun.verificationRunId, verificationRawOutputHash: verificationRun.rawOutputHash };
  return { ...generic, publication, snapshotId: buildSnapshotId({ ...generic, publication }) };
};

function fakeDatabase() {
  let stored: unknown;
  return {
    insert: () => ({ values: (value: { payload: unknown }) => ({ onConflictDoNothing: () => ({ returning: async () => { if (stored) return []; stored = value.payload; return [{ snapshotId: "SNAP_TEST" }]; } }) }) }),
    select: () => ({ from: () => ({ where: () => ({ limit: async () => stored ? [{ payload: stored }] : [] }) }) })
  };
}

const repositories = [
  ["in-memory", () => new InMemoryCapabilityCoreRepository()],
  ["postgres", () => new PostgresCapabilityCoreRepository(fakeDatabase() as never)]
] as const;

describe.each(repositories)("Phase 4 snapshot repository routing: %s", (_name, createRepository) => {
  it("rejects Phase-4 snapshots through the generic save path", async () => {
    await expect(createRepository().saveSnapshot(phase4Snapshot())).rejects.toThrow("ERR_PHASE4_SNAPSHOT_REQUIRES_DEDICATED_REPOSITORY");
  });

  it("keeps generic snapshots on the generic public route", async () => {
    await expect(createRepository().saveSnapshot(genericSnapshot())).resolves.toBeUndefined();
  });
});
