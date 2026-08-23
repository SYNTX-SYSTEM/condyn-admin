import { describe, expect, it } from "vitest";
import { InMemoryCapabilityCoreRepository, PostgresCapabilityCoreRepository } from "../../../../lib/career/capability-core";
import type { CapabilityVerificationRun } from "../../../../lib/career/capability-core/verification";

const run = (): CapabilityVerificationRun => ({ runKind: "CAPABILITY_VERIFICATION", verificationRunId: "VFY_0123456789ABCDEF01234567", convergenceRunId: "CONV_0123456789ABCDEF01234567", convergenceRawOutputHash: "a".repeat(64), sourceEvidenceRepresentationHash: "c".repeat(64), kernelVersion: "verification-v1", promptChecksum: "prompt", inference: { provider: "gemini", model: "model" }, schemaVersion: "verification-schema", algorithmVersion: "algorithm", snapshotSchemaVersion: "snapshot-schema", rawOutputHash: "b".repeat(64), status: "COMPLETED", payload: { semanticDefinitionOutcomes: [], demonstratedLevelOutcomes: [], relationDispositions: [], publicationEligibility: "ELIGIBLE" }, createdAt: "now", completedAt: "now" });

type VerificationRunRepository = { saveVerificationRun(run: CapabilityVerificationRun): Promise<void>; getVerificationRunById(verificationRunId: string): Promise<CapabilityVerificationRun | null> };
function fakeDatabase() { let stored: unknown; return { insert: () => ({ values: (value: { payload: unknown }) => ({ onConflictDoNothing: () => ({ returning: async () => { if (stored) return []; stored = value.payload; return [{ runId: "VFY_TEST" }]; } }) }) }), select: () => ({ from: () => ({ where: () => ({ limit: async () => stored ? [{ payload: stored }] : [] }) }) }) }; }
const repositories = [["in-memory", () => new InMemoryCapabilityCoreRepository() as unknown as VerificationRunRepository], ["postgres", () => new PostgresCapabilityCoreRepository(fakeDatabase() as never) as unknown as VerificationRunRepository]] as const;

describe.each(repositories)("Phase 4 Slice 2 verification-run repository contract: %s", (_name, createRepository) => {
  it("persists immutable verification runs idempotently, deep-clones reads, and rejects divergence", async () => {
    const repository = createRepository(); const first = run();
    await expect(repository.saveVerificationRun(first)).resolves.toBeUndefined();
    await expect(repository.saveVerificationRun(first)).resolves.toBeUndefined();
    const loaded = await repository.getVerificationRunById(first.verificationRunId);
    expect(loaded).toEqual(first);
    if (loaded) loaded.rawOutputHash = "mutated";
    await expect(repository.getVerificationRunById(first.verificationRunId)).resolves.toEqual(first);
    await expect(repository.saveVerificationRun({ ...first, rawOutputHash: "c".repeat(64) })).rejects.toThrow("ERR_IMMUTABLE_VERIFICATION_RUN_CONFLICT");
    await expect(repository.saveVerificationRun({ ...first, createdAt: "later" })).rejects.toThrow("ERR_IMMUTABLE_VERIFICATION_RUN_CONFLICT");
    await expect(repository.saveVerificationRun({ ...first, completedAt: "later" })).rejects.toThrow("ERR_IMMUTABLE_VERIFICATION_RUN_CONFLICT");
  });

  it("does not return Discovery or Convergence payloads as verification runs", async () => {
    const repository = createRepository();
    await expect(repository.getVerificationRunById("RUN_0123456789ABCDEF01234567")).resolves.toBeNull();
    await expect(repository.getVerificationRunById("CONV_0123456789ABCDEF01234567")).resolves.toBeNull();
  });
});
