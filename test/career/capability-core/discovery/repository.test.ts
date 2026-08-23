import { describe, expect, it } from "vitest";
import { PostgresCapabilityCoreRepository, type CapabilityDiscoveryRun } from "../../../../lib/career/capability-core";

const fullRun: CapabilityDiscoveryRun = {
  runId: "RUN_TEST",
  sourceBundleHash: "SOURCE_HASH",
  kernelVersion: "kernel-v1",
  prompt: { templateId: "TEMPLATE", versionId: "VERSION", checksum: "CHECKSUM" },
  inference: { provider: "gemini", model: "configured-model" },
  schemaVersion: "schema-v1",
  status: "COMPLETED",
  rawOutputHash: "OUTPUT_HASH",
  payload: { kernelOutput: { kernel_version: "kernel-v1", capabilities: [], coverage_audit: {} }, candidates: [], coverageValidation: { status: "PASSED" } },
  createdAt: "2026-01-01T00:00:00.000Z",
  completedAt: "2026-01-01T00:01:00.000Z"
};

function fakeDatabase(options: { racePayload?: unknown } = {}) {
  let storedPayload: unknown = null;
  return {
    insert: () => ({ values: (value: { payload: unknown }) => ({ onConflictDoNothing: () => ({ returning: async () => { if (options.racePayload) { storedPayload = options.racePayload; return []; } if (storedPayload) return []; storedPayload = value.payload; return [{ runId: "RUN_TEST" }]; } }) }) }),
    select: () => ({ from: () => ({ where: () => ({ limit: async () => storedPayload ? [{ payload: storedPayload }] : [] }) }) })
  };
}

describe("Postgres Capability Core run persistence", () => {
  it("round-trips the complete CapabilityDiscoveryRun, not only its nested payload", async () => {
    const repository = new PostgresCapabilityCoreRepository(fakeDatabase() as never);
    await repository.saveRun(fullRun);
    await expect(repository.getRunById(fullRun.runId)).resolves.toEqual(fullRun);
  });
  it("treats identical saves as idempotent and divergent same-ID saves as conflicts", async () => {
    const repository = new PostgresCapabilityCoreRepository(fakeDatabase() as never);
    await repository.saveRun(fullRun);
    await expect(repository.saveRun(fullRun)).resolves.toBeUndefined();
    await expect(repository.saveRun({ ...fullRun, status: "FAILED" })).rejects.toThrow("ERR_IMMUTABLE_RUN_CONFLICT");
  });
  it("reconciles a lost insert race when the persisted run is identical", async () => {
    const repository = new PostgresCapabilityCoreRepository(fakeDatabase({ racePayload: fullRun }) as never);
    await expect(repository.saveRun(fullRun)).resolves.toBeUndefined();
  });
  it("rejects a lost insert race when the persisted run diverges", async () => {
    const repository = new PostgresCapabilityCoreRepository(fakeDatabase({ racePayload: { ...fullRun, status: "FAILED" } }) as never);
    await expect(repository.saveRun(fullRun)).rejects.toThrow("ERR_IMMUTABLE_RUN_CONFLICT");
  });
});
