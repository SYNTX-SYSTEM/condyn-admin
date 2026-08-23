import { describe, expect, it } from "vitest";
import { InMemoryCapabilityCoreRepository, PostgresCapabilityCoreRepository } from "../../../../lib/career/capability-core";
import * as verification from "../../../../lib/career/capability-core/verification";
import type { CapabilityVerificationRun } from "../../../../lib/career/capability-core/verification";

const payload = (): CapabilityVerificationRun["payload"] => ({
  semanticDefinitionOutcomes: [{ provisionalCapabilityId: "PCAP_A", status: "PASSED" }, { provisionalCapabilityId: "PCAP_B", status: "PASSED" }],
  demonstratedLevelOutcomes: [{ provisionalCapabilityId: "PCAP_A", status: "UNVERIFIED", demonstratedCapabilityLevel: null }, { provisionalCapabilityId: "PCAP_B", status: "UNVERIFIED", demonstratedCapabilityLevel: null }],
  relationDispositions: [],
  publicationEligibility: "ELIGIBLE"
});

const run = (overrides: Record<string, unknown> = {}): CapabilityVerificationRun => {
  const base = {
    runKind: "CAPABILITY_VERIFICATION" as const,
    verificationRunId: "",
    convergenceRunId: "CONV_0123456789ABCDEF01234567",
    convergenceRawOutputHash: "a".repeat(64),
    sourceEvidenceRepresentationHash: "c".repeat(64),
    sourceBundleHash: "source-bundle",
    kernelVersion: "verification-v1",
    promptChecksum: "prompt",
    inference: { provider: "gemini", model: "model" },
    schemaVersion: "verification-schema",
    algorithmVersion: "algorithm",
    snapshotSchemaVersion: "snapshot-schema",
    rawOutputHash: "",
    status: "COMPLETED" as const,
    payload: payload(),
    createdAt: "2026-01-01T00:00:00.000Z",
    completedAt: "2026-01-01T00:00:00.000Z",
    ...overrides
  } as unknown as CapabilityVerificationRun;
  base.rawOutputHash = verification.computeCapabilityVerificationRawOutputHash(base.payload);
  base.verificationRunId = verification.buildCapabilityVerificationRunId({ convergenceRunId: base.convergenceRunId, convergenceRawOutputHash: base.convergenceRawOutputHash, sourceEvidenceRepresentationHash: base.sourceEvidenceRepresentationHash, kernelVersion: base.kernelVersion, promptChecksum: base.promptChecksum, provider: base.inference.provider, model: base.inference.model, schemaVersion: base.schemaVersion, algorithmVersion: base.algorithmVersion, snapshotSchemaVersion: base.snapshotSchemaVersion });
  return base;
};

type VerificationRunRepository = { saveVerificationRun(run: CapabilityVerificationRun): Promise<void>; getVerificationRunById(verificationRunId: string): Promise<CapabilityVerificationRun | null> };
type Inserted = Record<string, unknown>;
function fakeDatabase(initial?: unknown, racePayload?: unknown) {
  let stored = initial;
  let inserted: Inserted | undefined;
  return {
    insert: () => ({ values: (value: Inserted) => ({ onConflictDoNothing: () => ({ returning: async () => {
      inserted = value;
      if (stored || racePayload) { if (!stored) stored = structuredClone(racePayload); return []; }
      stored = structuredClone(value.payload); return [{ runId: value.runId }];
    } }) }) }),
    select: () => ({ from: () => ({ where: () => ({ limit: async () => stored ? [{ payload: stored }] : [] }) }) }),
    inserted: () => inserted
  };
}

const repositories = [
  ["in-memory", () => new InMemoryCapabilityCoreRepository() as unknown as VerificationRunRepository],
  ["postgres", () => new PostgresCapabilityCoreRepository(fakeDatabase() as never) as unknown as VerificationRunRepository]
] as const;

describe.each(repositories)("Phase 4 Slice 2B verification-run repository: %s", (_name, createRepository) => {
  it("persists exact replays, deep-clones writes and reads, and rejects every divergent immutable artifact", async () => {
    const repository = createRepository(); const first = run(); const original = structuredClone(first);
    await expect(repository.saveVerificationRun(first)).resolves.toBeUndefined();
    first.payload.semanticDefinitionOutcomes[0].status = "FAILED";
    await expect(repository.getVerificationRunById(original.verificationRunId)).resolves.toEqual(original);
    await expect(repository.saveVerificationRun(original)).resolves.toBeUndefined();
    const loaded = await repository.getVerificationRunById(original.verificationRunId);
    expect(loaded).toEqual(original);
    if (loaded) loaded.rawOutputHash = "mutated";
    await expect(repository.getVerificationRunById(original.verificationRunId)).resolves.toEqual(original);
    await expect(repository.saveVerificationRun({ ...original, createdAt: "later" })).rejects.toThrow(`ERR_IMMUTABLE_VERIFICATION_RUN_CONFLICT: ${original.verificationRunId}`);
    await expect(repository.saveVerificationRun({ ...original, completedAt: "later" })).rejects.toThrow(`ERR_IMMUTABLE_VERIFICATION_RUN_CONFLICT: ${original.verificationRunId}`);
    await expect(repository.saveVerificationRun({ ...original, sourceBundleHash: "other-bundle" })).rejects.toThrow(`ERR_IMMUTABLE_VERIFICATION_RUN_CONFLICT: ${original.verificationRunId}`);
    const divergentPayload = { ...original.payload, publicationEligibility: "BLOCKED" as const };
    await expect(repository.saveVerificationRun({ ...original, payload: divergentPayload, rawOutputHash: verification.computeCapabilityVerificationRawOutputHash(divergentPayload) })).rejects.toThrow(`ERR_IMMUTABLE_VERIFICATION_RUN_CONFLICT: ${original.verificationRunId}`);
  });
});

describe("Phase 4 Slice 2B Postgres verification-run persistence", () => {
  it("maps only VFY lineage fields to run columns and stores the complete artifact payload", async () => {
    const database = fakeDatabase(); const repository = new PostgresCapabilityCoreRepository(database as never); const item = run();
    await repository.saveVerificationRun(item);
    expect(database.inserted()).toMatchObject({ runId: item.verificationRunId, sourceBundleHash: item.sourceBundleHash, kernelVersion: item.kernelVersion, promptChecksum: item.promptChecksum, provider: item.inference.provider, model: item.inference.model, schemaVersion: item.schemaVersion, status: item.status, rawOutputHash: item.rawOutputHash, payload: item, createdAt: item.createdAt, completedAt: item.completedAt });
  });

  it("accepts an equal reread after an insert race and rejects a divergent reread", async () => {
    const equal = run();
    await expect(new PostgresCapabilityCoreRepository(fakeDatabase(undefined, structuredClone(equal)) as never).saveVerificationRun(equal)).resolves.toBeUndefined();
    const divergent = run(); const raced = { ...divergent, completedAt: "later" };
    await expect(new PostgresCapabilityCoreRepository(fakeDatabase(undefined, raced) as never).saveVerificationRun(divergent)).rejects.toThrow(`ERR_IMMUTABLE_VERIFICATION_RUN_CONFLICT: ${divergent.verificationRunId}`);
  });

  it.each([
    ["Discovery", { runId: "RUN_0123456789ABCDEF01234567", payload: {} }],
    ["Convergence", { runKind: "CAPABILITY_CONVERGENCE", convergenceRunId: "CONV_0123456789ABCDEF01234567" }],
    ["malformed", { runKind: "CAPABILITY_VERIFICATION" }],
    ["top-level-extended VFY", { ...run(), hiddenAuthority: "forged" }],
    ["inference-extended VFY", { ...run(), inference: { provider: "gemini", model: "model", hidden: "forged" } }]
  ])("does not return a %s row as a verification run", async (_name, stored) => {
    const repository = new PostgresCapabilityCoreRepository(fakeDatabase(stored) as never);
    await expect(repository.getVerificationRunById("VFY_0123456789ABCDEF01234567")).resolves.toBeNull();
  });
});

describe("Phase 4 Slice 2B verification self-integrity and persisted authority", () => {
  const save = (item: CapabilityVerificationRun) => new InMemoryCapabilityCoreRepository().saveVerificationRun(item);

  it.each([
    ["tampered VFY ID", (item: CapabilityVerificationRun) => ({ ...item, verificationRunId: "VFY_0123456789ABCDEF01234567" })],
    ["tampered rawOutputHash", (item: CapabilityVerificationRun) => ({ ...item, rawOutputHash: "0".repeat(64) })],
    ["noncanonical payload", (item: CapabilityVerificationRun) => ({ ...item, payload: { ...item.payload, semanticDefinitionOutcomes: [...item.payload.semanticDefinitionOutcomes].reverse() } })],
    ["invalid level shape", (item: CapabilityVerificationRun) => ({ ...item, payload: { ...item.payload, demonstratedLevelOutcomes: [{ provisionalCapabilityId: "PCAP_A", status: "VERIFIED", demonstratedCapabilityLevel: null }, item.payload.demonstratedLevelOutcomes[1]] } })],
    ["empty sourceBundleHash", (item: CapabilityVerificationRun) => ({ ...item, sourceBundleHash: "" })],
    ["extra top-level property", (item: CapabilityVerificationRun) => ({ ...item, hiddenAuthority: "forged" })],
    ["extra inference property", (item: CapabilityVerificationRun) => ({ ...item, inference: { ...item.inference, hidden: "forged" } })],
    ["empty inference provider", (item: CapabilityVerificationRun) => ({ ...item, inference: { ...item.inference, provider: "" } })],
    ["empty inference model", (item: CapabilityVerificationRun) => ({ ...item, inference: { ...item.inference, model: "" } })]
  ])("rejects %s before persistence", async (_name, mutate) => {
    await expect(save(mutate(run()))).rejects.toThrow("ERR_CAPABILITY_VERIFICATION_RUN_INTEGRITY_INVALID");
  });

  it("accepts only the exact persisted artifact as authority and returns its clone", async () => {
    const api = verification as typeof verification & { requireAuthoritativePersistedCapabilityVerificationRun?: (supplied: CapabilityVerificationRun, repository: Pick<VerificationRunRepository, "getVerificationRunById">) => Promise<CapabilityVerificationRun> };
    const requireAuthority = async (supplied: CapabilityVerificationRun, repository: Pick<VerificationRunRepository, "getVerificationRunById">) => {
      if (!api.requireAuthoritativePersistedCapabilityVerificationRun) throw new Error("ERR_PHASE4_VERIFICATION_AUTHORITY_NOT_IMPLEMENTED");
      return api.requireAuthoritativePersistedCapabilityVerificationRun(supplied, repository);
    };
    const repository = new InMemoryCapabilityCoreRepository() as unknown as VerificationRunRepository; const original = run();
    await expect(requireAuthority(original, repository)).rejects.toThrow("ERR_CAPABILITY_VERIFICATION_RUN_INTEGRITY_INVALID");
    await repository.saveVerificationRun(original);
    const authoritative = await requireAuthority(structuredClone(original), repository);
    expect(authoritative).toEqual(original); expect(authoritative).not.toBe(original);
    authoritative.createdAt = "mutated";
    await expect(repository.getVerificationRunById(original.verificationRunId)).resolves.toEqual(original);
    for (const changed of [
      { ...original, createdAt: "later" },
      { ...original, completedAt: "later" },
      { ...original, sourceBundleHash: "other-bundle" },
      { ...original, payload: { ...original.payload, publicationEligibility: "BLOCKED" as const } },
      { ...original, hiddenAuthority: "forged" }
    ]) await expect(requireAuthority(changed, repository)).rejects.toThrow("ERR_CAPABILITY_VERIFICATION_RUN_INTEGRITY_INVALID");

    const malformed = { ...original, hiddenAuthority: "forged" } as CapabilityVerificationRun;
    await expect(requireAuthority(malformed, { getVerificationRunById: async () => structuredClone(malformed) })).rejects.toThrow("ERR_CAPABILITY_VERIFICATION_RUN_INTEGRITY_INVALID");
  });
});
