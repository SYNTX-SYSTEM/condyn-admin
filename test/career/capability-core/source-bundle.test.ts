import { describe, expect, it } from "vitest";
import {
  createCandidateSourceBundle,
  createSourceDocument,
  InMemoryCandidateSourceBundleRepository,
} from "../../../lib/career/capability-core";

const createdAt = "2027-03-01T00:00:00.000Z";

function bundle(id = "CSB_1") {
  return createCandidateSourceBundle({
    candidateSourceBundleId: id,
    documents: [createSourceDocument({ docId: "DOC_1", title: "candidate.md", rawContent: "Candidate source content." })],
    schemaVersion: "CANDIDATE_SOURCE_BUNDLE_V1",
    createdAt,
  });
}

describe("CandidateSourceBundle exact-ID lineage", () => {
  it("persists and retrieves one immutable caller-selected source bundle without selecting by hash", async () => {
    const repository = new InMemoryCandidateSourceBundleRepository();
    const value = bundle();
    await expect(repository.persistCandidateSourceBundle(value)).resolves.toEqual(value);
    await expect(repository.getCandidateSourceBundleById("CSB_1")).resolves.toEqual(value);
    await expect(repository.getCandidateSourceBundleById(value.sourceBundleHash)).resolves.toBeNull();
  });

  it("preserves integrity separately from identity, deep detachment, absence, and immutable conflict", async () => {
    const repository = new InMemoryCandidateSourceBundleRepository();
    const value = bundle();
    await repository.persistCandidateSourceBundle(value);
    value.documents[0].title = "mutated caller value";
    expect((await repository.getCandidateSourceBundleById("CSB_1"))?.documents[0].title).toBe("candidate.md");
    await expect(repository.getCandidateSourceBundleById("CSB_ABSENT")).resolves.toBeNull();
    await expect(repository.persistCandidateSourceBundle({ ...bundle(), createdAt: "2027-03-02T00:00:00.000Z" })).rejects.toThrow("ERR_CANDIDATE_SOURCE_BUNDLE_IMMUTABLE_CONFLICT");
  });

  it("treats JSON object-key ordering as transport representation rather than immutable content", async () => {
    const repository = new InMemoryCandidateSourceBundleRepository();
    const value = bundle();
    const reordered = {
      createdAt: value.createdAt,
      schemaVersion: value.schemaVersion,
      documents: structuredClone(value.documents),
      sourceBundleHash: value.sourceBundleHash,
      candidateSourceBundleId: value.candidateSourceBundleId,
    };
    await repository.persistCandidateSourceBundle(value);
    await expect(repository.persistCandidateSourceBundle(reordered)).resolves.toEqual(value);
  });

  it("rejects corrupted source integrity and cannot fall back to another source bundle", async () => {
    const value = bundle();
    value.documents[0].normalizedTextHash = "corrupted";
    expect(() => createCandidateSourceBundle({
      candidateSourceBundleId: value.candidateSourceBundleId,
      documents: value.documents,
      schemaVersion: value.schemaVersion,
      createdAt: value.createdAt,
    })).toThrow("ERR_CANDIDATE_SOURCE_BUNDLE_INVALID");
    const repository = new InMemoryCandidateSourceBundleRepository();
    await repository.persistCandidateSourceBundle(bundle("CSB_EXACT"));
    await repository.persistCandidateSourceBundle(bundle("CSB_OTHER"));
    await expect(repository.getCandidateSourceBundleById("CSB_MISSING")).resolves.toBeNull();
  });
});
