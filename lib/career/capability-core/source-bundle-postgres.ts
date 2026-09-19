import { eq } from "drizzle-orm";
import { isDeepStrictEqual } from "node:util";
import { db } from "../db/client";
import {
  assertCandidateSourceBundle,
  type CandidateSourceBundle,
  type CandidateSourceBundleRepository,
} from "./source-bundle";
import { candidateSourceBundleDocumentReferences, candidateSourceBundles } from "./source-bundle-postgres-schema";

type Database = typeof db;
const fail = (code: string): never => { throw new Error(code); };
const same = (left: unknown, right: unknown) => isDeepStrictEqual(left, right);

/** Exact-ID persistence validates the stored payload and its normalized source witnesses; it never searches by hash. */
export class PostgresCandidateSourceBundleRepository implements CandidateSourceBundleRepository {
  constructor(private readonly database: Database = db) {}

  async getCandidateSourceBundleById(candidateSourceBundleId: string): Promise<CandidateSourceBundle | null> {
    const rows = await this.database.select().from(candidateSourceBundles).where(eq(candidateSourceBundles.candidateSourceBundleId, candidateSourceBundleId)).limit(1);
    if (!rows.length) return null;
    try {
      const row = rows[0];
      const value = row.payload;
      assertCandidateSourceBundle(value);
      if (row.candidateSourceBundleId !== value.candidateSourceBundleId || row.sourceBundleHash !== value.sourceBundleHash || row.createdAt !== value.createdAt) fail("ERR_CANDIDATE_SOURCE_BUNDLE_PERSISTENCE_INVALID");
      const refs = await this.database.select().from(candidateSourceBundleDocumentReferences).where(eq(candidateSourceBundleDocumentReferences.candidateSourceBundleId, candidateSourceBundleId));
      const expected = value.documents.map(document => `${document.docId}:${document.normalizedTextHash}`).sort();
      const actual = refs.map(reference => `${reference.documentId}:${reference.normalizedTextHash}`).sort();
      if (expected.length !== actual.length || expected.some((item, index) => item !== actual[index])) fail("ERR_CANDIDATE_SOURCE_BUNDLE_PERSISTENCE_INVALID");
      return structuredClone(value);
    } catch { return fail("ERR_CANDIDATE_SOURCE_BUNDLE_PERSISTENCE_INVALID"); }
  }

  async persistCandidateSourceBundle(value: CandidateSourceBundle): Promise<CandidateSourceBundle> {
    assertCandidateSourceBundle(value);
    const existing = await this.getCandidateSourceBundleById(value.candidateSourceBundleId);
    if (existing) {
      if (!same(existing, value)) fail("ERR_CANDIDATE_SOURCE_BUNDLE_IMMUTABLE_CONFLICT");
      return existing;
    }
    await this.database.insert(candidateSourceBundles).values({
      candidateSourceBundleId: value.candidateSourceBundleId,
      sourceBundleHash: value.sourceBundleHash,
      payload: structuredClone(value),
      createdAt: value.createdAt,
    }).onConflictDoNothing();
    for (const document of value.documents) {
      await this.database.insert(candidateSourceBundleDocumentReferences).values({
        referenceId: `${value.candidateSourceBundleId}:${document.docId}`,
        candidateSourceBundleId: value.candidateSourceBundleId,
        documentId: document.docId,
        normalizedTextHash: document.normalizedTextHash,
      }).onConflictDoNothing();
    }
    const reread = await this.getCandidateSourceBundleById(value.candidateSourceBundleId);
    if (!reread || !same(reread, value)) fail("ERR_CANDIDATE_SOURCE_BUNDLE_PERSISTENCE_INVALID");
    return reread!;
  }
}
