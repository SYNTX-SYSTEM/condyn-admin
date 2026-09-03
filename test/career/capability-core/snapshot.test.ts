import { describe, expect, it } from "vitest";
import { assertVerifiedCapabilitySnapshot, buildSnapshotId, computeSnapshotKey, createCapabilityRelation, createVerifiedCapabilitySnapshot, InMemoryCapabilityCoreRepository, type EvidenceClaim, type VerifiedCapability } from "../../../lib/career/capability-core";

const base = { sourceBundleHash: "source", kernelVersion: "kernel", prompt: { checksum: "prompt" }, inference: { provider: "openai", model: "gpt" }, schemaVersion: "1" };
const evidence: EvidenceClaim = { evidenceId: "EVD_1", sourceDocumentRef: "DOC_1", declaredLocation: "Page 1", exactQuote: "quote", verification: { status: "VERIFIED" } };
const capability: VerifiedCapability = { capabilityId: "G01", canonicalName: "Gold", scope: "COMPOSITE", structuralDefinition: "Definition", primaryDomain: null, demonstratedCapabilityLevel: null, levelVerificationStatus: "UNVERIFIED", evidenceIds: ["EVD_1"], relationIds: [], provenance: { sourceCandidateIds: ["CAND_1"], sourceDocumentIds: ["DOC_1"] }, validation: { evidenceStatus: "PASSED", semanticDefinitionStatus: "NOT_RUN", convergenceStatus: "MANUAL_GOLD" } };
const snapshot = () => createVerifiedCapabilitySnapshot({ ...base, candidateCount: 1, rejectedCandidateCount: 0, createdAt: "2026-01-01T00:00:00.000Z", status: "VERIFIED" }, [capability], [evidence]);

describe("Capability Core immutable snapshot", () => {
  it("has deterministic identity and changes with configuration", () => {
    expect(buildSnapshotId(base)).toBe(buildSnapshotId(base));
    expect(buildSnapshotId(base)).not.toBe(buildSnapshotId({ ...base, kernelVersion: "changed" }));
  });
  it("rejects verified capabilities without verified evidence", () => {
    expect(() => createVerifiedCapabilitySnapshot({ ...base, candidateCount: 1, rejectedCandidateCount: 0, createdAt: "2026-01-01T00:00:00.000Z", status: "VERIFIED" }, [{ ...capability, evidenceIds: [] }], [evidence])).toThrow(/WITHOUT_EVIDENCE/);
  });
  it("returns an existing snapshot by key and rejects a divergent verified overwrite", async () => {
    const repository = new InMemoryCapabilityCoreRepository();
    const saved = snapshot();
    await repository.saveSnapshot(saved);
    const key = computeSnapshotKey(saved);
    expect(await repository.getSnapshotByKey(key)).toEqual(saved);
    await expect(repository.saveSnapshot({ ...saved, status: "SUPERSEDED" })).rejects.toThrow(/IMMUTABLE_SNAPSHOT_CONFLICT/);
  });
  it("does not expose mutable stored snapshot references", async () => {
    const repository = new InMemoryCapabilityCoreRepository();
    const saved = snapshot();
    await repository.saveSnapshot(saved);
    const loaded = await repository.getSnapshotByKey(computeSnapshotKey(saved));
    loaded!.capabilities[0].canonicalName = "Mutated";
    expect((await repository.getSnapshotByKey(computeSnapshotKey(saved)))!.capabilities[0].canonicalName).toBe("Gold");
  });
  it("validates all summary fields after PostgreSQL JSONB reorders object keys", () => {
    const persisted = structuredClone(snapshot());
    const summary = persisted.validationSummary;
    // PostgreSQL JSONB does not preserve JavaScript insertion order for object keys.
    persisted.validationSummary = {
      candidateCount: summary.candidateCount,
      rejectedEvidenceCount: summary.rejectedEvidenceCount,
      verifiedEvidenceCount: summary.verifiedEvidenceCount,
      rejectedCandidateCount: summary.rejectedCandidateCount,
      unresolvedRelationCount: summary.unresolvedRelationCount,
      verifiedCapabilityCount: summary.verifiedCapabilityCount
    };
    expect(() => assertVerifiedCapabilitySnapshot(persisted)).not.toThrow();
    expect(() => assertVerifiedCapabilitySnapshot({ ...persisted, validationSummary: { ...persisted.validationSummary, verifiedEvidenceCount: 2 } })).toThrow(/VALIDATION_SUMMARY_MISMATCH/);
    expect(() => assertVerifiedCapabilitySnapshot({ ...persisted, validationSummary: { ...persisted.validationSummary, unexpectedCount: 0 } as typeof persisted.validationSummary })).toThrow(/VALIDATION_SUMMARY_MISMATCH/);
  });
  it("enforces relation references in both endpoint capabilities", () => {
    const second: VerifiedCapability = { ...capability, capabilityId: "G02", canonicalName: "Second", relationIds: [] };
    const relation = createCapabilityRelation({ sourceCapabilityRef: "G01", targetCapabilityRef: "G02", relationType: "PARENT_CHILD", status: "VERIFIED", reason: "gold", createdBy: "HUMAN_GOLD", createdAt: "2026-01-01T00:00:00.000Z" });
    const input = { ...base, candidateCount: 2, rejectedCandidateCount: 0, createdAt: "2026-01-01T00:00:00.000Z", status: "VERIFIED" as const };
    expect(() => createVerifiedCapabilitySnapshot(input, [{ ...capability, relationIds: ["REL_MISSING"] }, second], [evidence], [relation])).toThrow(/DANGLING_CAPABILITY_RELATION/);
    expect(() => createVerifiedCapabilitySnapshot(input, [{ ...capability, relationIds: [] }, { ...second, relationIds: [relation.relationId] }], [evidence], [relation])).toThrow(/RELATION_ENDPOINT_INDEX/);
    const third: VerifiedCapability = { ...capability, capabilityId: "G03", canonicalName: "Third", relationIds: [relation.relationId] };
    expect(() => createVerifiedCapabilitySnapshot({ ...input, candidateCount: 3 }, [{ ...capability, relationIds: [relation.relationId] }, second, third], [evidence], [relation])).toThrow(/UNRELATED_CAPABILITY_RELATION/);
    expect(() => createVerifiedCapabilitySnapshot(input, [{ ...capability, relationIds: [relation.relationId] }, { ...second, relationIds: [relation.relationId] }], [evidence], [relation])).not.toThrow();
  });
  it("rejects duplicate graph identities", () => {
    const input = { ...base, candidateCount: 2, rejectedCandidateCount: 0, createdAt: "2026-01-01T00:00:00.000Z", status: "VERIFIED" as const };
    expect(() => createVerifiedCapabilitySnapshot(input, [capability, { ...capability }], [evidence])).toThrow(/DUPLICATE_CAPABILITY_ID/);
    expect(() => createVerifiedCapabilitySnapshot({ ...base, candidateCount: 1, rejectedCandidateCount: 0, createdAt: "2026-01-01T00:00:00.000Z", status: "VERIFIED" }, [capability], [evidence, { ...evidence }])).toThrow(/DUPLICATE_EVIDENCE_ID/);
    const second: VerifiedCapability = { ...capability, capabilityId: "G02", relationIds: [] };
    const relation = createCapabilityRelation({ sourceCapabilityRef: "G01", targetCapabilityRef: "G02", relationType: "PARENT_CHILD", status: "VERIFIED", reason: "gold", createdBy: "HUMAN_GOLD", createdAt: "2026-01-01T00:00:00.000Z" });
    expect(() => createVerifiedCapabilitySnapshot(input, [{ ...capability, relationIds: [relation.relationId] }, { ...second, relationIds: [relation.relationId] }], [evidence], [relation, { ...relation }])).toThrow(/DUPLICATE_RELATION_ID/);
  });
});
