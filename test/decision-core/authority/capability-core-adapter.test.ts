import { describe, expect, it, vi } from "vitest";
import {
  buildSnapshotId,
  computeSnapshotKey,
  createVerifiedCapabilitySnapshot,
  type VerifiedCapabilitySnapshot
} from "../../../lib/career/capability-core";
import {
  CAPABILITY_CORE_AUTHORITY_CONTRACT_ID,
  CAPABILITY_CORE_PRODUCER_ID,
  createCapabilityCoreAuthoritativeStateResolver
} from "../../../lib/decision-adapters/capability-core";
import { createBoundAuthoritativeStateReader, type AuthoritativeStateReference } from "../../../lib/decision-core";

const phase4Snapshot = (authority: { verificationRunId: string; verificationRawOutputHash: string } = {
  verificationRunId: "VFY_0123456789ABCDEF01234567",
  verificationRawOutputHash: "a".repeat(64)
}): VerifiedCapabilitySnapshot => {
  const generic = createVerifiedCapabilitySnapshot({
    sourceBundleHash: "source-hash",
    kernelVersion: "kernel-v1",
    prompt: { checksum: "prompt-checksum" },
    inference: { provider: "provider", model: "model" },
    schemaVersion: "snapshot-v1",
    candidateCount: 0,
    rejectedCandidateCount: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    status: "VERIFIED"
  }, [], []);
  const publication = {
    mode: "PHASE4_VERIFIED" as const,
    verificationRunId: authority.verificationRunId,
    verificationRawOutputHash: authority.verificationRawOutputHash
  };
  return { ...generic, publication, snapshotId: buildSnapshotId({ ...generic, publication }) };
};

const referenceFor = (snapshot: VerifiedCapabilitySnapshot): AuthoritativeStateReference => ({
  producerId: CAPABILITY_CORE_PRODUCER_ID,
  authorityContractId: CAPABILITY_CORE_AUTHORITY_CONTRACT_ID,
  artifactId: snapshot.snapshotId,
  locator: computeSnapshotKey(snapshot)
});

const readerFor = (snapshot: VerifiedCapabilitySnapshot | null) => {
  const repository = { getSnapshotByKey: vi.fn(async () => snapshot === null ? null : structuredClone(snapshot)) };
  return { repository, reader: createBoundAuthoritativeStateReader([createCapabilityCoreAuthoritativeStateResolver(repository)]) };
};

describe("Capability Core authoritative-state adapter", () => {
  it("accepts a structurally valid persisted PHASE4_VERIFIED snapshot", async () => {
    const snapshot = phase4Snapshot();
    const { repository, reader } = readerFor(snapshot);
    const resolution = await reader.resolve(referenceFor(snapshot));

    expect(repository.getSnapshotByKey).toHaveBeenCalledWith(computeSnapshotKey(snapshot));
    expect(resolution.payload).toEqual(snapshot);
    expect(resolution.reference).toEqual(referenceFor(snapshot));
  });

  it("rejects missing persisted state", async () => {
    const snapshot = phase4Snapshot();
    const { reader } = readerFor(null);
    await expect(reader.resolve(referenceFor(snapshot))).rejects.toThrow("ERR_DECISION_AUTHORITY_STATE_NOT_FOUND");
  });

  it("rejects a generic/manual snapshot without Phase-4 publication metadata", async () => {
    const manual = createVerifiedCapabilitySnapshot({
      sourceBundleHash: "source-hash", kernelVersion: "kernel-v1", prompt: { checksum: "prompt-checksum" }, inference: { provider: "provider", model: "model" }, schemaVersion: "snapshot-v1", candidateCount: 0, rejectedCandidateCount: 0, createdAt: "2026-01-01T00:00:00.000Z", status: "VERIFIED"
    }, [], []);
    const { reader } = readerFor(manual);
    await expect(reader.resolve(referenceFor(manual))).rejects.toThrow("ERR_DECISION_AUTHORITY_STATE_INVALID");
  });

  it("rejects a non-VERIFIED snapshot", async () => {
    const snapshot = { ...phase4Snapshot(), status: "DRAFT" as const };
    const { reader } = readerFor(snapshot);
    await expect(reader.resolve(referenceFor(snapshot))).rejects.toThrow("ERR_DECISION_AUTHORITY_STATE_INVALID");
  });

  it("rejects artifact-ID and locator mismatches", async () => {
    const snapshot = phase4Snapshot();
    const { reader } = readerFor(snapshot);
    await expect(reader.resolve({ ...referenceFor(snapshot), artifactId: "SNAP_WRONG" })).rejects.toThrow("ERR_DECISION_AUTHORITY_ARTIFACT_REFERENCE_MISMATCH");
    await expect(reader.resolve({ ...referenceFor(snapshot), locator: "wrong-locator" })).rejects.toThrow("ERR_DECISION_AUTHORITY_ARTIFACT_REFERENCE_MISMATCH");
  });

  it("rejects a structurally invalid snapshot", async () => {
    const invalid = { ...phase4Snapshot(), snapshotId: "SNAP_INVALID" };
    const { reader } = readerFor(invalid);
    await expect(reader.resolve(referenceFor(invalid))).rejects.toThrow("ERR_DECISION_AUTHORITY_STATE_INVALID");
  });

  it("returns detached resolved state rather than a mutable authority reference", async () => {
    const snapshot = phase4Snapshot();
    const { reader } = readerFor(snapshot);
    const first = await reader.resolve(referenceFor(snapshot));
    const firstPayload = first.payload as VerifiedCapabilitySnapshot;
    firstPayload.createdAt = "caller mutation";

    const second = await reader.resolve(referenceFor(snapshot));
    expect((second.payload as VerifiedCapabilitySnapshot).createdAt).toBe("2026-01-01T00:00:00.000Z");
  });

  it("keeps the original read capability bound while append-only Phase-4 snapshot contents remain live", async () => {
    const snapshotA = phase4Snapshot();
    const snapshotB = phase4Snapshot({
      verificationRunId: "VFY_89ABCDEF0123456789ABCDEF",
      verificationRawOutputHash: "b".repeat(64)
    });
    const snapshotKeyA = computeSnapshotKey(snapshotA);
    const snapshotKeyB = computeSnapshotKey(snapshotB);
    let originalCalls = 0;
    let replacementCalls = 0;
    const repository = {
      snapshots: new Map([[snapshotKeyA, snapshotA]]),
      async getSnapshotByKey(this: { snapshots: Map<string, VerifiedCapabilitySnapshot> }, locator: string) {
        originalCalls += 1;
        const persisted = this.snapshots.get(locator);
        return persisted === undefined ? null : structuredClone(persisted);
      }
    };
    const reader = createBoundAuthoritativeStateReader([createCapabilityCoreAuthoritativeStateResolver(repository)]);
    repository.getSnapshotByKey = async () => {
      replacementCalls += 1;
      return null;
    };

    await expect(reader.resolve(referenceFor(snapshotA))).resolves.toMatchObject({ payload: { snapshotId: snapshotA.snapshotId } });
    repository.snapshots.set(snapshotKeyB, snapshotB);
    await expect(reader.resolve(referenceFor(snapshotB))).resolves.toMatchObject({ payload: { snapshotId: snapshotB.snapshotId } });
    await expect(reader.resolve(referenceFor(snapshotA))).resolves.toMatchObject({ payload: { snapshotId: snapshotA.snapshotId } });

    expect(snapshotKeyA).not.toBe(snapshotKeyB);
    expect(snapshotA.snapshotId).not.toBe(snapshotB.snapshotId);
    expect(originalCalls).toBe(3);
    expect(replacementCalls).toBe(0);
  });
});
