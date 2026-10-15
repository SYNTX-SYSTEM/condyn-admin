import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { db, initDbSchema } from "../../../lib/career/db/client";
import { careerAnalyses } from "../../../lib/career/db/schema";
import {
  PostgresCandidateSourceBundleRepository, PostgresCapabilityCoreRepository, PostgresCapabilityProposalProjectionReferenceRepository, createSourceDocument
} from "../../../lib/career/capability-core";
import { createJob } from "../../../lib/career/orchestration/job";
import { JobRepository } from "../../../lib/career/orchestration/job-repository";
import { GET } from "../../../app/api/career/analyses/[analysisId]/investigation/route";
import { TEST_JOB_SCOPE, resolveStoredTestJobScope, uploadEngineeringJobScope } from "../../support/job-scope";
import { SOURCE, fakeGeminiClient, geminiProvider, geminiText, produceAnalysis, type InspectorWorld } from "../result-inspector/fixture";

/** URL BOUNDARY CLOSURE on PostgreSQL: the persisted boundary of an analysis, identities only; no Gemini. */
const get = (analysisId: string) => GET(new Request(`http://local/api/career/analyses/${analysisId}/investigation`), { params: Promise.resolve({ analysisId }) });
const source = (label: string) => createSourceDocument({ docId: "CV", title: "cv.synthetic.pdf", rawContent: `${SOURCE} (${label})` });

describe("analysis investigation route (PostgreSQL, no Gemini)", () => {
  const jobs = new JobRepository(db);
  const created: string[] = [];
  const directAnalysisId = `ANL_DIRECT_${Date.now()}`;
  // Jobs are stored SUCCEEDED, as the worker leaves them, so no worker of a parallel suite can claim them.
  const world: InspectorWorld = {
    capabilityRepository: new PostgresCapabilityCoreRepository(db),
    references: new PostgresCapabilityProposalProjectionReferenceRepository(db),
    sourceBundles: new PostgresCandidateSourceBundleRepository(db),
    saveJob: async job => { await jobs.enqueueJob({ ...job, status: "SUCCEEDED" }); created.push(job.jobId); },
    saveAnalysis: async (analysisId, createdAt) => { await db.insert(careerAnalyses).values({ analysisId, createdAt, validationState: "VERIFIED", payload: { marker: "LEGACY_ONLY" } }); }
  };
  const recordResult = async (jobId: string) => { await db.execute(sql`UPDATE career_analysis_jobs SET result_analysis_id = ${jobId.replace("JOB_", "ANL_")} WHERE job_id = ${jobId}`); };
  let scoped: Awaited<ReturnType<typeof produceAnalysis>>;
  let person: Awaited<ReturnType<typeof produceAnalysis>>;
  let snapshotOnly = "";

  beforeAll(async () => {
    await initDbSchema();
    await uploadEngineeringJobScope();
    const scope = await resolveStoredTestJobScope();
    scoped = await produceAnalysis(world, geminiProvider(fakeGeminiClient([geminiText("ui")])), scope, "ui", source(`ui-${Date.now()}`));
    person = await produceAnalysis(world, geminiProvider(fakeGeminiClient([geminiText("up")])), null, "up", source(`up-${Date.now()}`));
    await recordResult(scoped.job.jobId);
    await recordResult(person.job.jobId);
    // A SUCCEEDED job without projection reference (a reused verified snapshot writes none).
    const job = createJob("CAREER_ANALYSIS", { sourceType: "BATCH", sourceData: { documents: [], investigation: { mode: "PERSON_X_JOB" }, jobScope: TEST_JOB_SCOPE } });
    await world.saveJob(job);
    snapshotOnly = job.jobId.replace("JOB_", "ANL_");
    await world.saveAnalysis!(snapshotOnly, job.createdAt);
    await recordResult(job.jobId);
    // An analysis stored without any job (historical rows, E2E and validation fixtures).
    await world.saveAnalysis!(directAnalysisId, new Date().toISOString());
  });
  afterAll(async () => {
    for (const jobId of created) {
      await db.execute(sql`DELETE FROM career_analysis_jobs WHERE job_id = ${jobId}`);
      await db.execute(sql`DELETE FROM career_analyses WHERE analysis_id = ${jobId.replace("JOB_", "ANL_")}`);
    }
    await db.execute(sql`DELETE FROM career_analyses WHERE analysis_id = ${directAnalysisId}`);
  });

  it("200 no-store: PERSON_X_JOB with its declared selection and Discovery scope hash; identities only", async () => {
    const response = await get(scoped.analysisId);
    expect([response.status, response.headers.get("cache-control")]).toEqual([200, "no-store"]);
    const raw = await response.text();
    expect(JSON.parse(raw)).toEqual({ success: true, investigation: {
      investigationVersion: "ANALYSIS_INVESTIGATION_V1", analysisId: scoped.analysisId, jobId: scoped.job.jobId, mode: "PERSON_X_JOB", jobScopeSelection: TEST_JOB_SCOPE,
      basis: "JOB_DECLARATION_AND_DISCOVERY_RUN", discoveryRunId: scoped.run.runId, investigationScopeHash: scoped.run.investigationScope!.scopeHash
    } });
    // No document content, no capability, no legacy payload.
    expect(raw).not.toContain(SOURCE.slice(0, 40));
    expect(raw).not.toMatch(/LEGACY_ONLY|PCAP_|quote|capabilit/i);
  });

  it("200: a PERSON analysis is PERSON, without any job selection", async () => {
    const { investigation } = await (await get(person.analysisId)).json();
    expect(investigation).toMatchObject({ mode: "PERSON", jobScopeSelection: null, investigationScopeHash: null, basis: "JOB_DECLARATION_AND_DISCOVERY_RUN", discoveryRunId: person.run.runId });
  });

  it("200: a SUCCEEDED job without projection reference resolves from its declaration", async () => {
    const { investigation } = await (await get(snapshotOnly)).json();
    expect(investigation).toMatchObject({ mode: "PERSON_X_JOB", jobScopeSelection: TEST_JOB_SCOPE, basis: "JOB_DECLARATION", discoveryRunId: null });
  });

  it("409 for an analysis without job, 404 for an unknown one; nothing is guessed", async () => {
    const direct = await get(directAnalysisId);
    expect([direct.status, direct.headers.get("cache-control"), await direct.json()]).toEqual([409, "no-store", { success: false, issues: [{ code: "ERR_ANALYSIS_INVESTIGATION_UNRESOLVED", reason: "NOT_RECORDED" }] }]);
    const unknown = await get("ANL_DOES_NOT_EXIST");
    expect([unknown.status, await unknown.json()]).toEqual([404, { success: false, issues: [{ code: "ERR_ANALYSIS_INVESTIGATION_NOT_FOUND" }] }]);
  });
});
