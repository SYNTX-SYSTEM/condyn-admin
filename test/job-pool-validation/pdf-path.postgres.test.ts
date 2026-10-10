/**
 * PINK proof JP-PDF: the manual path PDF → capability sweep → JSON Job Pool → matching, automated without Gemini.
 *
 * Real pieces: the analyze route (202 for a base64 PDF document), the job repository on PostgreSQL, the production
 * document loader through pdf-parse, the candidate source bundle persisted through the real
 * PostgresCandidateSourceBundleRepository (JSONB), the legacy pipeline with the deterministic MockInferenceProvider,
 * the jobs and analyses routes, and GELB's job pool routes. Stubbed: the capability proposal executor (it owns the
 * model calls); its first attempt fails transiently so the retry must rebuild a byte-identical bundle (D-JP-2/3).
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { drizzle } from "drizzle-orm/postgres-js";
import { describe, expect, it, beforeAll } from "vitest";
import { POST as analyze } from "../../app/api/career/analyze/route";
import { GET as getJob } from "../../app/api/career/jobs/[jobId]/route";
import { GET as getAnalysis } from "../../app/api/career/analyses/[analysisId]/route";
import { POST as uploadJobPool } from "../../app/api/career/job-pools/route";
import { GET as getMatches } from "../../app/api/career/job-pools/[jobPoolUploadId]/matches/route";
import { MockInferenceProvider } from "../../lib/career/adapter";
import { PostgresCandidateSourceBundleRepository } from "../../lib/career/capability-core/source-bundle-postgres";
import { PostgresCapabilityProposalProjectionReferenceRepository } from "../../lib/career/capability-core/projection/reference-repository";
import { db, initDbSchema } from "../../lib/career/db/client";
import { createCareerAnalysisJobProcessor, type CareerAnalysisJobProcessorDependencies } from "../../lib/career/orchestration/career-analysis-job-processor";
import { prepareDocuments } from "../../lib/career/orchestration/document-loader";
import { JobRepository } from "../../lib/career/orchestration/job-repository";
import { executeCareerAnalysisPipeline } from "../../lib/career/pipeline";
import { getCareerAnalysisRepository } from "../../lib/career/repositories";
import { PostgresCareerAnalysisRepository } from "../../lib/career/repositories/postgres";
import type { VerifiedCareerAnalysis } from "../../lib/career/types";
import { requireTestDatabaseUrl } from "../../lib/database-isolation/policy";
import { validationPool } from "./fixtures/pool";

/** Minimal single-page PDF written by hand, so the proof does not depend on any committed binary. */
function minimalPdf(text: string): Buffer {
  const stream = `BT /F1 24 Tf 72 700 Td (${text}) Tj ET`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"
  ];
  let body = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((object, index) => { offsets.push(body.length); body += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = body.length;
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.map((offset) => `${String(offset).padStart(10, "0")} 00000 n `).join("\n")}\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(body, "latin1");
}

const samplePdfPath = resolve(process.cwd(), "docs/examples/cv.synthetic.pdf");

async function runPdfJob(pdf: Buffer, title: string, expectedText: string) {
  const bundles = new PostgresCandidateSourceBundleRepository(db);
  const postgresAnalyses = new PostgresCareerAnalysisRepository(db);
  const provider = new MockInferenceProvider();
  let attempts = 0;
  const dependencies: CareerAnalysisJobProcessorDependencies = {
    canonicalAnalysisRepository: {
      load: (analysisId) => postgresAnalyses.load(analysisId),
      save: async (analysis) => { await postgresAnalyses.save(analysis as VerifiedCareerAnalysis); await getCareerAnalysisRepository().save(analysis as VerifiedCareerAnalysis); }
    },
    prepareDocuments,
    capabilityProposalExecutor: { execute: async () => { attempts += 1; if (attempts === 1) throw new Error("PINK_TRANSIENT_PROPOSAL_FAILURE"); return { kind: "SNAPSHOT_REUSED" }; } },
    candidateSourceBundles: bundles,
    projectionReferenceRepository: new PostgresCapabilityProposalProjectionReferenceRepository(db),
    async executeLegacyCareerAnalysis(documents, reportOperation, explicitAnalysisId) {
      const result = await executeCareerAnalysisPipeline(documents, provider, { explicitAnalysisId, onRuntimeOperation: reportOperation });
      if (!result.success || !result.data) throw new Error(result.issues.map((issue) => issue.message).join(", "));
      const analysis = result.data as unknown as VerifiedCareerAnalysis;
      return { resultAnalysisId: analysis.structured_data.analysis.metadata.analysis_id, analysis };
    }
  } as CareerAnalysisJobProcessorDependencies;
  const processor = createCareerAnalysisJobProcessor(dependencies);

  const response = await analyze(new Request("http://local/api/career/analyze", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ documents: [{ type: "pdf", title, content: pdf.toString("base64") }] })
  }));
  expect(response.status).toBe(202);
  const { jobId } = await response.json();
  expect(jobId).toMatch(/^JOB_/);

  const jobs = new JobRepository(db);
  const claimed = await jobs.claimNextJob("pink-pdf-worker", 30_000);
  expect(claimed?.jobId).toBe(jobId);
  const report = async () => undefined;

  // Attempt 1: the loader, pdf-parse and the bundle persistence run; the proposal executor fails transiently.
  await expect(processor(claimed!, report)).rejects.toThrow("PINK_TRANSIENT_PROPOSAL_FAILURE");
  const bundleAfterFirst = await bundles.getCandidateSourceBundleById(`CSB_${jobId}`);
  expect(bundleAfterFirst).not.toBeNull();
  expect(bundleAfterFirst!.documents).toHaveLength(1);
  expect(bundleAfterFirst!.documents[0].metadata?.sourceKind).toBe("PDF");
  expect(bundleAfterFirst!.documents[0].metadata?.loadedAt).toBe(claimed!.createdAt);
  expect(bundleAfterFirst!.documents[0].normalizedText).toContain(expectedText);
  expect(bundleAfterFirst!.documents[0].normalizedTextHash).toMatch(/^[0-9a-f]{64}$/);

  // Attempt 2: the same durable input rebuilds the identical bundle (D-JP-2 pinned loadedAt, D-JP-3 JSON-stable form).
  const result = await processor(claimed!, report);
  expect(result.resultAnalysisId).toMatch(/^ANL_/);
  const bundleAfterSecond = await bundles.getCandidateSourceBundleById(`CSB_${jobId}`);
  expect(isDeepStrictEqual(bundleAfterSecond, bundleAfterFirst)).toBe(true);
  expect(attempts).toBe(2);
  await jobs.updateJobState(jobId, "pink-pdf-worker", claimed!.leaseVersion, "RUNNING", "SUCCEEDED", { resultAnalysisId: result.resultAnalysisId });

  const jobView = await (await getJob(new Request(`http://local/api/career/jobs/${jobId}`), { params: Promise.resolve({ jobId }) })).json();
  expect(jobView.status).toBe("SUCCEEDED");
  const analysisResponse = await getAnalysis(new Request(`http://local/api/career/analyses/${result.resultAnalysisId}`), { params: Promise.resolve({ analysisId: result.resultAnalysisId }) });
  expect(analysisResponse.status).toBe(200);
  const analysisBody = await analysisResponse.json();
  expect(analysisBody.status).toBe("VERIFIED");
  expect(analysisBody.analysis.structured_data.analysis.documents.length).toBeGreaterThan(0);
  return { jobId, analysisId: result.resultAnalysisId as string, capabilities: analysisBody.analysis.structured_data.analysis.capabilities as unknown[] };
}

describe("JP-PDF: PDF → capability sweep (stub) → JSON Job Pool → matching, on PostgreSQL without Gemini", () => {
  beforeAll(async () => {
    requireTestDatabaseUrl();
    await initDbSchema();
  });

  it("drives a hand-written PDF through the analyze route, the loader, a persisted bundle, a retry and the analyses route", async () => {
    const { capabilities } = await runPdfJob(minimalPdf("PINK TypeScript Kubernetes Architect"), "pink-minimal.pdf", "PINK TypeScript Kubernetes Architect");
    expect(Array.isArray(capabilities)).toBe(true);
  });

  it("drives GELB's synthetic two-page CV PDF the same way and matches the resulting analysis against PINK's pool", async () => {
    const { analysisId, capabilities } = await runPdfJob(readFileSync(samplePdfPath), "cv.synthetic.pdf", "Alex Example");
    expect(capabilities.length).toBeGreaterThan(0);
    for (const capability of capabilities as Array<{ identity?: { name?: string } }>) expect(typeof capability.identity?.name).toBe("string");

    const upload = await uploadJobPool(new Request("http://local/api/career/job-pools", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(validationPool) }));
    expect([200, 201]).toContain(upload.status);
    const { jobPoolUploadId } = await upload.json();
    const matches = await getMatches(new Request(`http://local/api/career/job-pools/${jobPoolUploadId}/matches?analysisId=${analysisId}`), { params: Promise.resolve({ jobPoolUploadId }) });
    expect(matches.status).toBe(200);
    const presentation = await matches.json();
    expect(presentation.analysisId).toBe(analysisId);
    expect(presentation.candidateCapabilityCount).toBe(capabilities.length);
    expect(presentation.roleMatches.map((role: { poolRoleId: string }) => role.poolRoleId).sort()).toEqual(validationPool.roles.map((role) => role.id).sort());
    for (const role of presentation.roleMatches) expect(role.canonical.capabilityRequirementRelationState).toBe("NOT_EVALUATED");
  });
});
