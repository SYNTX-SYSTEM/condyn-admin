import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { db, initDbSchema } from "../../../lib/career/db/client";
import { careerAnalyses } from "../../../lib/career/db/schema";
import {
  PostgresCandidateSourceBundleRepository, PostgresCapabilityCoreRepository, PostgresCapabilityProposalProjectionReferenceRepository, createSourceDocument
} from "../../../lib/career/capability-core";
import { JobRepository } from "../../../lib/career/orchestration/job-repository";
import { GET } from "../../../app/api/career/analyses/[analysisId]/job-comparison/route";
import { TEST_JOB_SCOPE, TEST_JOB_SCOPE_B, resolveStoredTestJobScope, uploadEngineeringJobScope } from "../../support/job-scope";
import { SOURCE, fakeGeminiClient, geminiProvider, geminiText, produceAnalysis, type InspectorWorld } from "../result-inspector/fixture";

/** B2 route on PostgreSQL: the selected role only, bound to analysis, upload, role and scope hash; no Gemini. */
const LEGACY_MARKER = "LEGACY_ONLY_MARKER_CAPABILITY_7F3A";
const get = (analysisId: string, query: object) =>
  GET(new Request(`http://local/api/career/analyses/${analysisId}/job-comparison?${new URLSearchParams(query as Record<string, string>)}`), { params: Promise.resolve({ analysisId }) });
const source = (label: string) => createSourceDocument({ docId: "CV", title: "cv.synthetic.pdf", rawContent: `${SOURCE} (${label})` });

describe("B2 job comparison route (PostgreSQL, no Gemini)", () => {
  const jobs = new JobRepository(db);
  const created: string[] = [];
  const world: InspectorWorld = {
    capabilityRepository: new PostgresCapabilityCoreRepository(db),
    references: new PostgresCapabilityProposalProjectionReferenceRepository(db),
    sourceBundles: new PostgresCandidateSourceBundleRepository(db),
    saveJob: async job => { await jobs.enqueueJob(job); created.push(job.jobId); },
    // The legacy analysis row carries a capability that exists nowhere else: it must never reach the comparison.
    saveAnalysis: async (analysisId, createdAt) => { await db.insert(careerAnalyses).values({ analysisId, createdAt, validationState: "VERIFIED", payload: { structured_data: { capabilities: [{ name: LEGACY_MARKER }, { name: "TypeScript" }] } } }); }
  };
  let scoped: Awaited<ReturnType<typeof produceAnalysis>>;
  let person: Awaited<ReturnType<typeof produceAnalysis>>;

  beforeAll(async () => {
    await initDbSchema();
    await uploadEngineeringJobScope();
    const scope = await resolveStoredTestJobScope();
    scoped = await produceAnalysis(world, geminiProvider(fakeGeminiClient([geminiText("b2")])), scope, "b2", source(`b2-${Date.now()}`), "TypeScript");
    person = await produceAnalysis(world, geminiProvider(fakeGeminiClient([geminiText("b2p")])), null, "b2p", source(`b2p-${Date.now()}`), "TypeScript");
  });
  afterAll(async () => {
    for (const jobId of created) {
      await db.execute(sql`DELETE FROM career_analysis_jobs WHERE job_id = ${jobId}`);
      await db.execute(sql`DELETE FROM career_analyses WHERE analysis_id = ${jobId.replace("JOB_", "ANL_")}`);
    }
  });

  it("200 no-store: the selected role's requirements, bound identities, fixed authority; no legacy capability", async () => {
    const response = await get(scoped.analysisId, TEST_JOB_SCOPE);
    expect([response.status, response.headers.get("cache-control")]).toEqual([200, "no-store"]);
    const raw = await response.text();
    const { comparison } = JSON.parse(raw);
    expect(comparison.comparisonVersion).toBe("SELECTED_ROLE_COVERAGE_V1");
    expect(comparison.binding).toMatchObject({ analysisId: scoped.analysisId, jobId: scoped.job.jobId, ...TEST_JOB_SCOPE, investigationScopeHash: scoped.run.investigationScope!.scopeHash, discoveryRunId: scoped.run.runId, convergenceRunId: scoped.convergenceRun.convergenceRunId });
    expect(comparison.authority).toMatchObject({ scored: false, capabilityRequirementRelationState: "NOT_EVALUATED", authorityState: "NONE", operand: "CAPABILITY_PROPOSAL_PROJECTION" });
    expect(comparison.requirements).toHaveLength(10);
    expect(comparison.requirements.every((item: { poolRequirementId: string }) => item.poolRequirementId.startsWith("req_kestrel_frontend_architect_"))).toBe(true);
    const typescript = comparison.requirements.find((item: { capabilityName: string }) => item.capabilityName === "TypeScript");
    expect(typescript.coverage).toMatchObject({ state: "COVERED", proposal: { matchBasis: "EXACT", scored: false, evidence: [{ docId: "CV", quote: SOURCE }] } });
    expect(comparison.proposals.map((item: { name: string }) => item.name)).toEqual(["TypeScript"]);
    expect(raw).not.toContain(LEGACY_MARKER);
    expect(raw).not.toMatch(/resonance|req_aurelion_/i);
  });

  it("refuses without fallback: selection required 400, unknown 404, another role 409, PERSON 409", async () => {
    const cases: Array<[string, object, number, string]> = [
      [scoped.analysisId, { jobPoolUploadId: TEST_JOB_SCOPE.jobPoolUploadId }, 400, "ERR_JOB_COMPARISON_SELECTION_REQUIRED"],
      [scoped.analysisId, {}, 400, "ERR_JOB_COMPARISON_SELECTION_REQUIRED"],
      ["ANL_unknown", TEST_JOB_SCOPE, 404, "ERR_JOB_COMPARISON_ANALYSIS_NOT_FOUND"],
      [scoped.analysisId, TEST_JOB_SCOPE_B, 409, "ERR_JOB_COMPARISON_SCOPE_MISMATCH"],
      [person.analysisId, TEST_JOB_SCOPE, 409, "ERR_JOB_COMPARISON_NOT_SCOPED"]
    ];
    for (const [analysisId, query, status, code] of cases) {
      const response = await get(analysisId, query);
      expect([response.status, response.headers.get("cache-control"), await response.json()]).toEqual([status, "no-store", { success: false, issues: [{ code }] }]);
    }
  });
});
