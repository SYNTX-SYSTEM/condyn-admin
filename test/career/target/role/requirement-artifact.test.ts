import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { InMemoryTargetRequirementArtifactRepository } from "../../../../lib/career/target/role";

describe("T5 requirement reconstruction artifact persistence", () => {
  it("retrieves process-local historical raw output and rejects a corrupt raw hash", async () => {
    const artifacts = new InMemoryTargetRequirementArtifactRepository();
    const raw = "historical raw provider output";
    const hash = createHash("sha256").update(raw, "utf8").digest("hex");
    const batch = { batchId: "TRQRUN_AUDIT", status: "COMPLETED", rawProviderOutputRef: `raw://${hash}`, rawProviderOutputHash: hash, failureCode: null, profileIds: ["TRPREV_A"] };
    await expect(artifacts.persistBatch(batch, raw)).resolves.toBeUndefined();
    await expect(artifacts.getRaw(batch.rawProviderOutputRef)).resolves.toBe(raw);
    await expect(artifacts.persistBatch({ ...batch, batchId: "TRQRUN_CORRUPT", rawProviderOutputHash: "0".repeat(64) }, raw)).rejects.toThrow("ERR_TARGET_REQUIREMENT_RAW_OUTPUT_INVALID");
  });
});
