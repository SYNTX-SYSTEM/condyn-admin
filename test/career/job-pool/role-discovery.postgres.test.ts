import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { db, initDbSchema } from "../../../lib/career/db/client";
import { careerAnalyses } from "../../../lib/career/db/schema";
import {
  PostgresCandidateSourceBundleRepository, PostgresCapabilityCoreRepository, PostgresCapabilityProposalProjectionReferenceRepository, createSourceDocument
} from "../../../lib/career/capability-core";
import { createJobPoolApplication } from "../../../lib/career/job-pool/application";
import { JobRepository } from "../../../lib/career/orchestration/job-repository";
import { GET } from "../../../app/api/career/analyses/[analysisId]/role-discovery/route";
import { OTHER_POOL, TEST_JOB_SCOPE, resolveStoredTestJobScope, uploadEngineeringJobScope } from "../../support/job-scope";
import { SOURCE, fakeGeminiClient, geminiProvider, geminiText, produceAnalysis, type InspectorWorld } from "../result-inspector/fixture";

/** POOL_ROLE_DISCOVERY_V1 route on PostgreSQL (DETERMINISTIC_FIXTURE: fake model client, no network, no Gemini). */
const LEGACY_MARKER = "LEGACY_ONLY_MARKER_CAPABILITY_9C1D";
const ENGINEERING = TEST_JOB_SCOPE.jobPoolUploadId;
const get = (analysisId: string, uploads: string[]) =>
  GET(new Request(`http://local/api/career/analyses/${analysisId}/role-discovery?${uploads.map(u => `jobPoolUploadId=${encodeURIComponent(u)}`).join("&")}`), { params: Promise.resolve({ analysisId }) });
const source = (label: string) => createSourceDocument({ docId: "CV", title: "cv.synthetic.pdf", rawContent: `${SOURCE} (${label})` });
const tableCounts = async () => Object.fromEntries(await Promise.all(["career_analyses", "career_analysis_jobs", "career_job_pool_uploads", "career_capability_runs", "career_capability_proposal_projection_references", "capability_requirement_relations", "career_proposal_requirement_relations"].map(async table => [table, Number(((await db.execute(sql.raw(`SELECT count(*)::int AS n FROM ${table}`))) as unknown as Array<{ n: number }>)[0].n)])));

describe("role discovery route (PostgreSQL, no Gemini)", () => {
  const jobs = new JobRepository(db);
  const created: string[] = [];
  const world: InspectorWorld = {
    capabilityRepository: new PostgresCapabilityCoreRepository(db),
    references: new PostgresCapabilityProposalProjectionReferenceRepository(db),
    sourceBundles: new PostgresCandidateSourceBundleRepository(db),
    saveJob: async job => { await jobs.enqueueJob(job); created.push(job.jobId); },
    // The legacy analysis row carries a capability that exists nowhere else: it must never reach the discovery.
    saveAnalysis: async (analysisId, createdAt) => { await db.insert(careerAnalyses).values({ analysisId, createdAt, validationState: "VERIFIED", payload: { structured_data: { capabilities: [{ name: LEGACY_MARKER }, { name: "TypeScript" }] } } }); }
  };
  let person: Awaited<ReturnType<typeof produceAnalysis>>;
  let scoped: Awaited<ReturnType<typeof produceAnalysis>>;
  let other: string;

  beforeAll(async () => {
    await initDbSchema();
    await uploadEngineeringJobScope();
    const application = createJobPoolApplication({ database: drizzle(db.$client), analyses: { load: async () => null } });
    other = (await application.upload(JSON.stringify(OTHER_POOL), "test-role-discovery")).view.jobPoolUploadId;
    const scope = await resolveStoredTestJobScope();
    person = await produceAnalysis(world, geminiProvider(fakeGeminiClient([geminiText("rdp")])), null, "rdp", source(`rdp-${Date.now()}`), "TypeScript");
    scoped = await produceAnalysis(world, geminiProvider(fakeGeminiClient([geminiText("rds")])), scope, "rds", source(`rds-${Date.now()}`), "TypeScript");
  });
  afterAll(async () => {
    for (const jobId of created) {
      await db.execute(sql`DELETE FROM career_analysis_jobs WHERE job_id = ${jobId}`);
      await db.execute(sql`DELETE FROM career_analyses WHERE analysis_id = ${jobId.replace("JOB_", "ANL_")}`);
    }
  });

  it("200 no-store: every role of the released upload, lexical relations, fixed authority; no legacy capability, no unreleased pool", async () => {
    const response = await get(person.analysisId, [ENGINEERING]);
    expect([response.status, response.headers.get("cache-control")]).toEqual([200, "no-store"]);
    const raw = await response.text();
    const { discovery } = JSON.parse(raw);
    expect(discovery.discoveryVersion).toBe("POOL_ROLE_DISCOVERY_V1");
    expect(discovery.authority).toMatchObject({ relationBasis: "LEXICAL_NAME_COVERAGE", semanticRelationState: "NOT_EXECUTED", scored: false, ranking: false, decision: false });
    expect(discovery.analysis).toEqual({ analysisId: person.analysisId, jobId: person.job.jobId, mode: "PERSON", discoveryRunId: person.run.runId });
    expect(discovery.pools.map((p: { jobPoolUploadId: string }) => p.jobPoolUploadId)).toEqual([ENGINEERING]);
    expect(discovery.counts).toMatchObject({ pools: 1, roles: 9, requirements: 79 });
    expect(discovery.proposals.map((p: { name: string }) => p.name)).toEqual(["TypeScript"]);
    const typescript = discovery.roles.flatMap((r: { requirements: unknown[] }) => r.requirements).filter((q: { requirementText: string }) => q.requirementText === "TypeScript");
    expect(typescript.length).toBeGreaterThan(1);
    expect(typescript.every((q: { lexical: { basis: string; evidence: Array<{ exactQuote: string }> } }) => q.lexical.basis === "NAME_EXACT" && q.lexical.evidence[0].exactQuote === SOURCE)).toBe(true);
    // The semantic layer is not executed and says so; the plan counts the call volume (one call per role with requirements).
    expect(discovery.semanticPlan).toMatchObject({ cacheVersion: "PROPOSAL_REQUIREMENT_RELATION_CACHE_V1", state: "ENGINE_NOT_SPECIFIED", engineVersionHash: null, pairs: 79, cachedPairs: 0, pendingPairs: 79, callsNeeded: 9 });
    expect(raw).not.toContain(LEGACY_MARKER);
    expect(raw).not.toContain(other);
    expect(raw).not.toMatch(/resonance|"score"/i);
  });

  it("two released uploads: both, keyed apart; the order does not depend on the request order", async () => {
    const a = await (await get(person.analysisId, [ENGINEERING, other])).json();
    const b = await (await get(person.analysisId, [other, ENGINEERING])).json();
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(a.discovery.counts).toMatchObject({ pools: 2, roles: 10 });
    expect(a.discovery.roles.some((r: { key: { jobPoolUploadId: string } }) => r.key.jobPoolUploadId === other)).toBe(true);
  });

  it("read only: no row is written by a discovery read", async () => {
    const before = await tableCounts();
    await get(person.analysisId, [ENGINEERING, other]);
    expect(await tableCounts()).toEqual(before);
  });

  it("refuses without fallback: no pool, duplicate, too many, unknown pool, unknown analysis, PERSON × JOB operand", async () => {
    const eleven = Array.from({ length: 11 }, (_, i) => `JPOOL_${i}`);
    const cases: Array<[string, string[], number, Record<string, string>]> = [
      [person.analysisId, [], 400, { code: "ERR_ROLE_DISCOVERY_POOLS_REQUIRED" }],
      [person.analysisId, [ENGINEERING, ENGINEERING], 400, { code: "ERR_ROLE_DISCOVERY_POOLS_INVALID" }],
      [person.analysisId, [""], 400, { code: "ERR_ROLE_DISCOVERY_POOLS_INVALID" }],
      [person.analysisId, eleven, 400, { code: "ERR_ROLE_DISCOVERY_POOLS_INVALID" }],
      [person.analysisId, ["JPOOL_UNKNOWN"], 404, { code: "ERR_ROLE_DISCOVERY_POOL_NOT_FOUND", jobPoolUploadId: "JPOOL_UNKNOWN" }],
      ["ANL_unknown", [ENGINEERING], 404, { code: "ERR_ROLE_DISCOVERY_ANALYSIS_NOT_FOUND" }],
      [scoped.analysisId, [ENGINEERING], 409, { code: "ERR_ROLE_DISCOVERY_OPERAND_NOT_PERSON" }]
    ];
    for (const [analysisId, uploads, status, issue] of cases) {
      const response = await get(analysisId, uploads);
      expect([response.status, response.headers.get("cache-control"), await response.json()]).toEqual([status, "no-store", { success: false, issues: [issue] }]);
    }
  });
});
