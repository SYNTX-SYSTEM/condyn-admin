import { describe, expect, it } from "vitest";
import {
  InMemoryCandidateSourceBundleRepository,
  computeSourceBundleHash,
  createInMemoryCapabilityProposalProjectionReferenceRepository,
  toCapabilitySourceDocuments,
} from "../../../../lib/career/capability-core";
import { createCareerAnalysisJobProcessor } from "../../../../lib/career/orchestration/worker";
import { createJob } from "../../../../lib/career/orchestration/job";

describe("Stage-A CandidateSourceBundle identity retention", () => {
  it("persists one exact source-bundle ID and carries it through immutable proposal provenance", async () => {
    const normalizedDocs = [{ docId: "DOC_STAGE_A", title: "Stage A", content: "Exact source identity" }];
    const sourceBundleHash = computeSourceBundleHash(toCapabilitySourceDocuments(normalizedDocs));
    const bundles = new InMemoryCandidateSourceBundleRepository();
    const references = createInMemoryCapabilityProposalProjectionReferenceRepository();
    const processor = createCareerAnalysisJobProcessor({
      canonicalAnalysisRepository: { load: async () => null, save: async () => undefined },
      prepareDocuments: async () => ({ normalizedDocs }),
      candidateSourceBundles: bundles,
      projectionReferenceRepository: references,
      capabilityProposalExecutor: {
        execute: async () => ({
          kind: "PROPOSALS_CONVERGED",
          discoveryRun: { runId: "RUN_STAGE_A", sourceBundleHash },
          convergenceRun: { convergenceRunId: "CONV_STAGE_A", completedAt: "2026-09-22T00:00:00.000Z" },
        }),
      },
      executeLegacyCareerAnalysis: async () => ({ resultAnalysisId: "ANL_STAGE_A", analysis: { analysisId: "ANL_STAGE_A" } }),
    });
    const job = { ...createJob("CAREER_ANALYSIS", { sourceType: "TEXT", sourceData: { documents: [{ content: "Exact source identity" }] } }), jobId: "JOB_STAGE_A", createdAt: "2026-09-22T00:00:00.000Z" };

    await expect(processor(job, async () => undefined)).resolves.toEqual({ resultAnalysisId: "ANL_STAGE_A" });
    await expect(bundles.getCandidateSourceBundleById("CSB_JOB_STAGE_A")).resolves.toMatchObject({ sourceBundleHash });
    await expect(references.getByAnalysisId("ANL_STAGE_A")).resolves.toEqual({
      analysisId: "ANL_STAGE_A",
      jobId: "JOB_STAGE_A",
      discoveryRunId: "RUN_STAGE_A",
      convergenceRunId: "CONV_STAGE_A",
      candidateSourceBundleId: "CSB_JOB_STAGE_A",
      sourceBundleHash,
      createdAt: "2026-09-22T00:00:00.000Z",
    });
  });
});
