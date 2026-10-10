import { describe, expect, it, vi } from "vitest";
import { createCareerAnalysisJobProcessor, pinDocumentLoadTime } from "../lib/career/orchestration/career-analysis-job-processor";
import { isDeepStrictEqual } from "node:util";
import type { CandidateSourceBundle, CandidateSourceBundleRepository } from "../lib/career/capability-core/source-bundle";
import { createSourceMetadata } from "../lib/career/loaders/source";

/**
 * D-JP-2: loaders stamp metadata.loadedAt with the wall clock. A retried job reloads the same durable input;
 * before the fix the second attempt rebuilt a different CSB_<jobId> bundle and failed permanently with
 * ERR_CANDIDATE_SOURCE_BUNDLE_IMMUTABLE_CONFLICT, turning any transient failure into a dead job.
 */
const job = {
  jobId: "JOB_D_JP_2",
  jobType: "CAREER_ANALYSIS",
  status: "RUNNING",
  inputRef: { sourceData: { documents: [{ type: "text", content: "Built services in TypeScript and Node.js." }] } },
  attemptCount: 1,
  currentOperation: null,
  createdAt: "2026-10-10T18:00:00.000Z",
  leaseVersion: 1
} as never;

/** Mimics PostgresCandidateSourceBundleRepository: storage drops undefined keys (JSONB), comparison is strict. */
class JsonbLikeBundleRepository implements CandidateSourceBundleRepository {
  readonly rows = new Map<string, string>();
  async getCandidateSourceBundleById(id: string): Promise<CandidateSourceBundle | null> {
    const row = this.rows.get(id);
    return row === undefined ? null : JSON.parse(row);
  }
  async persistCandidateSourceBundle(value: CandidateSourceBundle): Promise<CandidateSourceBundle> {
    const existing = await this.getCandidateSourceBundleById(value.candidateSourceBundleId);
    if (existing) {
      if (!isDeepStrictEqual(existing, value)) throw new Error("ERR_CANDIDATE_SOURCE_BUNDLE_IMMUTABLE_CONFLICT");
      return existing;
    }
    this.rows.set(value.candidateSourceBundleId, JSON.stringify(value));
    const reread = await this.getCandidateSourceBundleById(value.candidateSourceBundleId);
    if (!isDeepStrictEqual(reread, value)) throw new Error("ERR_CANDIDATE_SOURCE_BUNDLE_PERSISTENCE_INVALID");
    return reread!;
  }
}

function fixture() {
  let clock = 0;
  const prepareDocuments = vi.fn(async () => ({
    normalizedDocs: [{
      docId: "DOC_001",
      title: "cv.txt",
      content: "Built services in TypeScript and Node.js.",
      metadata: createSourceMetadata("TEXT", "Built services in TypeScript and Node.js.", { loadedAt: new Date(Date.UTC(2026, 9, 10, 18, 5, clock++)).toISOString() })
    }]
  }));
  let failNext = true;
  const execute = vi.fn(async () => {
    if (failNext) { failNext = false; throw new Error("TRANSIENT_PROVIDER_FAILURE"); }
    return { kind: "SNAPSHOT_REUSED" };
  });
  const save = vi.fn(async () => undefined);
  const bundles = new JsonbLikeBundleRepository();
  const processor = createCareerAnalysisJobProcessor({
    canonicalAnalysisRepository: { load: async () => null, save },
    prepareDocuments,
    capabilityProposalExecutor: { execute },
    candidateSourceBundles: bundles,
    executeLegacyCareerAnalysis: async () => ({ resultAnalysisId: "ANL_D_JP_2", analysis: { canonical: true } })
  } as never);
  return { processor, prepareDocuments, execute, bundles };
}

describe("career job retry with a persisted source bundle (D-JP-2, D-JP-3)", () => {
  it("persists the bundle through a JSONB-like store and succeeds on the retry after a transient failure", async () => {
    const { processor, bundles } = fixture();
    const report = vi.fn(async () => undefined);
    await expect(processor(job, report)).rejects.toThrow("TRANSIENT_PROVIDER_FAILURE");
    await expect(processor(job, report)).resolves.toEqual({ resultAnalysisId: "ANL_D_JP_2" });
    const bundle = await bundles.getCandidateSourceBundleById("CSB_JOB_D_JP_2");
    expect(bundle?.documents[0].metadata?.loadedAt).toBe("2026-10-10T18:00:00.000Z");
  });

  it("pins only loadedAt and keeps the identity of inventories without it", () => {
    const plain: Array<{ docId: string; content: string; metadata?: unknown }> = [{ docId: "DOC_001", content: "x" }];
    expect(pinDocumentLoadTime(plain, "2026-10-10T18:00:00.000Z")).toBe(plain);
    const stamped = [{ docId: "DOC_001", metadata: { sourceKind: "TEXT", loadedAt: "2026-10-10T19:00:00.000Z", contentHash: "h" } }];
    expect(pinDocumentLoadTime(stamped, "2026-10-10T18:00:00.000Z")).toEqual([{ docId: "DOC_001", metadata: { sourceKind: "TEXT", loadedAt: "2026-10-10T18:00:00.000Z", contentHash: "h" } }]);
  });
});
