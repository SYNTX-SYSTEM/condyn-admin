import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db, initDbSchema } from "../../../../lib/career/db/client";
import {
  careerAnalyses,
  careerAnalysisJobs,
  careerCapabilityProposalProjectionReferences,
  careerCapabilityRuns
} from "../../../../lib/career/db/schema";
import { PostgresCapabilityProposalProjectionReferenceRepository } from "../../../../lib/career/capability-core";

const analysisId = "ANL_F11_POSTGRES_REFERENCE";
const otherAnalysisId = "ANL_F11_POSTGRES_REFERENCE_OTHER";
const jobId = "JOB_F11_POSTGRES_REFERENCE";
const discoveryRunId = "RUN_F11_POSTGRES_REFERENCE";
const convergenceRunId = "CONV_F11_POSTGRES_REFERENCE";
const reference = {
  analysisId,
  jobId,
  discoveryRunId,
  convergenceRunId,
  sourceBundleHash: "SOURCE_F11_POSTGRES_REFERENCE",
  createdAt: "2026-08-31T00:00:00.000Z"
};

async function cleanup() {
  await db.delete(careerCapabilityProposalProjectionReferences).where(eq(careerCapabilityProposalProjectionReferences.analysisId, analysisId));
  await db.delete(careerAnalysisJobs).where(eq(careerAnalysisJobs.jobId, jobId));
  await db.delete(careerAnalyses).where(eq(careerAnalyses.analysisId, analysisId));
  await db.delete(careerAnalyses).where(eq(careerAnalyses.analysisId, otherAnalysisId));
  await db.delete(careerCapabilityRuns).where(eq(careerCapabilityRuns.runId, convergenceRunId));
  await db.delete(careerCapabilityRuns).where(eq(careerCapabilityRuns.runId, discoveryRunId));
}

async function seed() {
  await db.insert(careerAnalyses).values({ analysisId, createdAt: reference.createdAt, validationState: "VERIFIED", payload: {} });
  await db.insert(careerAnalyses).values({ analysisId: otherAnalysisId, createdAt: reference.createdAt, validationState: "VERIFIED", payload: {} });
  await db.insert(careerAnalysisJobs).values({ jobId, jobType: "CAREER_ANALYSIS", status: "SUCCEEDED", inputRef: {}, createdAt: reference.createdAt, resultAnalysisId: analysisId });
  await db.insert(careerCapabilityRuns).values({ runId: discoveryRunId, sourceBundleHash: reference.sourceBundleHash, kernelVersion: "discovery-v1", promptChecksum: "checksum", provider: "fake", model: "fake", schemaVersion: "schema", status: "COMPLETED", payload: {}, createdAt: reference.createdAt });
  await db.insert(careerCapabilityRuns).values({ runId: convergenceRunId, sourceBundleHash: reference.sourceBundleHash, kernelVersion: "convergence-v1", promptChecksum: "checksum", provider: "fake", model: "fake", schemaVersion: "schema", status: "COMPLETED", payload: {}, createdAt: reference.createdAt });
}

describe("F11 PostgreSQL immutable proposal projection reference composition", () => {
  beforeEach(async () => { await initDbSchema(); await cleanup(); await seed(); });
  afterAll(cleanup);

  it("is physically provisioned with immutable idempotency and referenced-row constraints", async () => {
    const repository = new PostgresCapabilityProposalProjectionReferenceRepository(db);
    await expect(repository.save({ ...reference, analysisId: "ANL_F11_MISSING" })).rejects.toThrow();
    await expect(repository.save({ ...reference, jobId: "JOB_F11_MISSING" })).rejects.toThrow();
    await expect(repository.save({ ...reference, discoveryRunId: "RUN_F11_MISSING" })).rejects.toThrow();
    await expect(repository.save({ ...reference, convergenceRunId: "CONV_F11_MISSING" })).rejects.toThrow();
    await repository.save(reference);
    await expect(repository.save({ ...reference })).resolves.toBeUndefined();
    await expect(repository.save({ ...reference, convergenceRunId: discoveryRunId })).rejects.toThrow("ERR_IMMUTABLE_CAPABILITY_PROPOSAL_PROJECTION_REFERENCE_CONFLICT");
    await expect(repository.save({ ...reference, analysisId: otherAnalysisId })).rejects.toThrow("ERR_IMMUTABLE_CAPABILITY_PROPOSAL_PROJECTION_REFERENCE_CONFLICT");
    expect(await repository.getByAnalysisId(analysisId)).toEqual(reference);
  });
});
