import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db, initDbSchema } from "../../../lib/career/db/client";
import { candidateSourceBundleDocumentReferences, candidateSourceBundles } from "../../../lib/career/capability-core/source-bundle-postgres-schema";
import {
  createCandidateSourceBundle,
  createSourceDocument,
  PostgresCandidateSourceBundleRepository,
} from "../../../lib/career/capability-core";

const cleanup = async () => {
  await db.delete(candidateSourceBundleDocumentReferences);
  await db.delete(candidateSourceBundles);
};

function value() {
  return createCandidateSourceBundle({
    candidateSourceBundleId: "CSB_POSTGRES_1",
    documents: [createSourceDocument({ docId: "DOC_POSTGRES_1", title: "candidate.md", rawContent: "Canonical source stored for exact reread." })],
    schemaVersion: "CANDIDATE_SOURCE_BUNDLE_V1",
    createdAt: "2027-03-01T00:00:00.000Z",
  });
}

describe("CandidateSourceBundle PostgreSQL exact-ID persistence", () => {
  beforeEach(async () => { await initDbSchema(); await cleanup(); });
  afterAll(cleanup);

  it("survives exact-ID reread and rejects immutable mutation without hash-based replacement", async () => {
    const first = new PostgresCandidateSourceBundleRepository(db);
    const stored = await first.persistCandidateSourceBundle(value());
    const restarted = new PostgresCandidateSourceBundleRepository(db);
    await expect(restarted.getCandidateSourceBundleById(stored.candidateSourceBundleId)).resolves.toEqual(stored);
    await expect(restarted.getCandidateSourceBundleById(stored.sourceBundleHash)).resolves.toBeNull();
    await expect(restarted.persistCandidateSourceBundle({ ...stored, createdAt: "2027-03-02T00:00:00.000Z" })).rejects.toThrow("ERR_CANDIDATE_SOURCE_BUNDLE_IMMUTABLE_CONFLICT");
  });
});
