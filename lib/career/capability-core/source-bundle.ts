import { computeSourceBundleHash, computeSourceDocumentHash } from "./hashing";
import type { SourceDocument } from "./source";
import { isDeepStrictEqual } from "node:util";

/** Immutable source provenance: explicit bundle ID is retrieval identity; the hash is integrity evidence only. */
export interface CandidateSourceBundle {
  candidateSourceBundleId: string;
  sourceBundleHash: string;
  documents: SourceDocument[];
  schemaVersion: "CANDIDATE_SOURCE_BUNDLE_V1";
  createdAt: string;
}

export interface CandidateSourceBundleRepository {
  getCandidateSourceBundleById(candidateSourceBundleId: string): Promise<CandidateSourceBundle | null>;
  persistCandidateSourceBundle(value: CandidateSourceBundle): Promise<CandidateSourceBundle>;
}

const fail = (code: string): never => { throw new Error(code); };
const text = (value: unknown): value is string => typeof value === "string" && value.length > 0 && value.trim() === value;
const timestamp = (value: unknown): value is string => text(value) && !Number.isNaN(Date.parse(value));

function assertDocument(value: unknown): asserts value is SourceDocument {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail("ERR_CANDIDATE_SOURCE_BUNDLE_INVALID");
  const item = value as SourceDocument;
  if (!text(item.docId) || !text(item.title) || !text(item.rawContentHash) || !text(item.normalizedText) || !text(item.normalizedTextHash)) fail("ERR_CANDIDATE_SOURCE_BUNDLE_INVALID");
  if (item.normalizedTextHash !== computeSourceDocumentHash(item.normalizedText)) fail("ERR_CANDIDATE_SOURCE_BUNDLE_INVALID");
}

export function assertCandidateSourceBundle(value: unknown): asserts value is CandidateSourceBundle {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail("ERR_CANDIDATE_SOURCE_BUNDLE_INVALID");
  const item = value as CandidateSourceBundle;
  if (!text(item.candidateSourceBundleId) || !text(item.sourceBundleHash) || item.schemaVersion !== "CANDIDATE_SOURCE_BUNDLE_V1" || !timestamp(item.createdAt) || !Array.isArray(item.documents) || item.documents.length === 0) fail("ERR_CANDIDATE_SOURCE_BUNDLE_INVALID");
  item.documents.forEach(assertDocument);
  if (new Set(item.documents.map(document => document.docId)).size !== item.documents.length) fail("ERR_CANDIDATE_SOURCE_BUNDLE_INVALID");
  if (item.sourceBundleHash !== computeSourceBundleHash(item.documents)) fail("ERR_CANDIDATE_SOURCE_BUNDLE_INTEGRITY_INVALID");
}

export function createCandidateSourceBundle(input: Omit<CandidateSourceBundle, "sourceBundleHash">): CandidateSourceBundle {
  const value: CandidateSourceBundle = {
    candidateSourceBundleId: input.candidateSourceBundleId,
    sourceBundleHash: computeSourceBundleHash(input.documents),
    documents: structuredClone(input.documents),
    schemaVersion: input.schemaVersion,
    createdAt: input.createdAt,
  };
  assertCandidateSourceBundle(value);
  return structuredClone(value);
}

export class InMemoryCandidateSourceBundleRepository implements CandidateSourceBundleRepository {
  #items = new Map<string, CandidateSourceBundle>();

  async getCandidateSourceBundleById(candidateSourceBundleId: string): Promise<CandidateSourceBundle | null> {
    const value = this.#items.get(candidateSourceBundleId);
    if (!value) return null;
    try { assertCandidateSourceBundle(value); return structuredClone(value); }
    catch { return fail("ERR_CANDIDATE_SOURCE_BUNDLE_PERSISTENCE_INVALID"); }
  }

  async persistCandidateSourceBundle(value: CandidateSourceBundle): Promise<CandidateSourceBundle> {
    assertCandidateSourceBundle(value);
    const existing = await this.getCandidateSourceBundleById(value.candidateSourceBundleId);
    if (existing) {
      if (!isDeepStrictEqual(existing, value)) fail("ERR_CANDIDATE_SOURCE_BUNDLE_IMMUTABLE_CONFLICT");
      return existing;
    }
    this.#items.set(value.candidateSourceBundleId, structuredClone(value));
    const reread = await this.getCandidateSourceBundleById(value.candidateSourceBundleId);
    if (!reread || !isDeepStrictEqual(reread, value)) fail("ERR_CANDIDATE_SOURCE_BUNDLE_PERSISTENCE_INVALID");
    return reread!;
  }
}
