import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { db, initDbSchema } from "../../../lib/career/db/client";
import { careerAnalyses } from "../../../lib/career/db/schema";
import { PostgresCandidateSourceBundleRepository, PostgresCapabilityCoreRepository, PostgresCapabilityProposalProjectionReferenceRepository, createSourceDocument } from "../../../lib/career/capability-core";
import { JobRepository } from "../../../lib/career/orchestration/job-repository";
import { GET } from "../../../app/api/career/analyses/[analysisId]/role-discovery/route";
import { POST } from "../../../app/api/career/analyses/[analysisId]/role-discovery/investigations/route";
import { GET as GET_INVESTIGATION } from "../../../app/api/career/analyses/[analysisId]/role-discovery/investigations/[investigationId]/route";
import { TEST_JOB_SCOPE, resolveStoredTestJobScope, uploadEngineeringJobScope } from "../../support/job-scope";
import { SOURCE, fakeGeminiClient, geminiProvider, geminiText, produceAnalysis, type InspectorWorld } from "../result-inspector/fixture";

/** Explicit start of a semantic investigation on PostgreSQL (STAND_IN provider only; DETERMINISTIC_FIXTURE; no Gemini, no network). */
const POOL = TEST_JOB_SCOPE.jobPoolUploadId;
const stamp = `${Date.now()}`;
const url = (analysisId: string) => `http://local/api/career/analyses/${analysisId}/role-discovery`;
const read = (analysisId: string) => GET(new Request(`${url(analysisId)}?jobPoolUploadId=${POOL}`), { params: Promise.resolve({ analysisId }) });
const start = (analysisId: string, body: unknown) => POST(new Request(`${url(analysisId)}/investigations`, { method: "POST", body: JSON.stringify(body) }), { params: Promise.resolve({ analysisId }) });
// The investigation tables are registered lazily with the relation cache: absent counts as no rows.
const rows = async (table: string) => { const exists = ((await db.execute(sql.raw(`SELECT to_regclass('${table}') IS NOT NULL AS e`))) as unknown as Array<{ e: boolean }>)[0].e; return exists ? Number(((await db.execute(sql.raw(`SELECT count(*)::int AS n FROM ${table}`))) as unknown as Array<{ n: number }>)[0].n) : 0; };
const source = (label: string) => createSourceDocument({ docId: "CV", title: "cv.synthetic.pdf", rawContent: `${SOURCE} (${label})` });

describe("explicit semantic investigation route (PostgreSQL, stand-in)", () => {
  const jobs = new JobRepository(db);
  const created: string[] = [];
  const world: InspectorWorld = {
    capabilityRepository: new PostgresCapabilityCoreRepository(db),
    references: new PostgresCapabilityProposalProjectionReferenceRepository(db),
    sourceBundles: new PostgresCandidateSourceBundleRepository(db),
    saveJob: async job => { await jobs.enqueueJob(job); created.push(job.jobId); },
    saveAnalysis: async (analysisId, createdAt) => { await db.insert(careerAnalyses).values({ analysisId, createdAt, validationState: "VERIFIED", payload: { structured_data: {} } }); }
  };
  let person: Awaited<ReturnType<typeof produceAnalysis>>;
  let scoped: Awaited<ReturnType<typeof produceAnalysis>>;
  let roles: Array<{ jobPoolUploadId: string; poolRoleId: string }>;
  const body = (over: Record<string, unknown> = {}) => ({ jobPoolUploadIds: [POOL], roles: roles.slice(0, 2), clientRequestId: `req-${stamp}`, confirmedCalls: 2, ...over });

  beforeAll(async () => {
    await initDbSchema();
    await uploadEngineeringJobScope();
    const scope = await resolveStoredTestJobScope();
    person = await produceAnalysis(world, geminiProvider(fakeGeminiClient([geminiText("inv")])), null, "inv", source(`inv-${Date.now()}`), "TypeScript");
    scoped = await produceAnalysis(world, geminiProvider(fakeGeminiClient([geminiText("invs")])), scope, "invs", source(`invs-${Date.now()}`), "TypeScript");
    delete process.env.ROLE_DISCOVERY_SEMANTIC_PROVIDER;
    const discovery = (await (await read(person.analysisId)).json()).discovery;
    roles = discovery.roles.filter((r: { counts: { requirements: number } }) => r.counts.requirements > 0).map((r: { key: { jobPoolUploadId: string; poolRoleId: string } }) => r.key);
  });
  beforeEach(() => { delete process.env.ROLE_DISCOVERY_SEMANTIC_PROVIDER; delete process.env.ROLE_DISCOVERY_DAY_LIMIT; delete process.env.ROLE_DISCOVERY_MAX_ROLES; });
  afterAll(async () => {
    delete process.env.ROLE_DISCOVERY_SEMANTIC_PROVIDER;
    for (const jobId of created) {
      await db.execute(sql`DELETE FROM career_analysis_jobs WHERE job_id = ${jobId}`);
      await db.execute(sql`DELETE FROM career_analyses WHERE analysis_id = ${jobId.replace("JOB_", "ANL_")}`);
    }
  });

  it("nothing starts without configuration; a real provider is refused (owner GO and budget pending)", async () => {
    expect((await start(person.analysisId, body())).status).toBe(409);
    expect((await (await start(person.analysisId, body())).json()).issues[0].code).toBe("ERR_SEMANTIC_ENGINE_NOT_CONFIGURED");
    process.env.ROLE_DISCOVERY_SEMANTIC_PROVIDER = "gemini";
    const r = await start(person.analysisId, body());
    expect([r.status, (await r.json()).issues[0].code]).toEqual([409, "ERR_SEMANTIC_PROVIDER_NOT_AUTHORIZED"]);
    expect(await rows("career_relation_investigations")).toBe(0);
  });

  it("a read never starts anything: the GET plans (PLANNED, nothing cached) and writes no investigation, no ledger, no relation", async () => {
    process.env.ROLE_DISCOVERY_SEMANTIC_PROVIDER = "stand-in";
    const before = [await rows("career_relation_investigations"), await rows("career_relation_call_ledger"), await rows("career_proposal_requirement_relations")];
    const plan = (await (await read(person.analysisId)).json()).discovery.semanticPlan;
    expect(plan).toMatchObject({ state: "PLANNED", executable: true, cachedPairs: 0 });
    expect([await rows("career_relation_investigations"), await rows("career_relation_call_ledger"), await rows("career_proposal_requirement_relations")]).toEqual(before);
  });

  it("refuses: wrong body, duplicate or foreign roles, too many roles, PERSON × JOB operand, unconfirmed call volume", async () => {
    process.env.ROLE_DISCOVERY_SEMANTIC_PROVIDER = "stand-in";
    const code = async (r: Response) => [r.status, (await r.json()).issues[0].code];
    expect(await code(await start(person.analysisId, { nope: 1 }))).toEqual([400, "ERR_INVESTIGATION_BODY_INVALID"]);
    expect(await code(await start(person.analysisId, body({ roles: [roles[0], roles[0]] })))).toEqual([400, "ERR_INVESTIGATION_ROLES_INVALID"]);
    expect(await code(await start(person.analysisId, body({ roles: [{ jobPoolUploadId: POOL, poolRoleId: "role_does_not_exist" }] })))).toEqual([400, "ERR_INVESTIGATION_ROLE_NOT_IN_DISCOVERY"]);
    process.env.ROLE_DISCOVERY_MAX_ROLES = "1";
    expect(await code(await start(person.analysisId, body()))).toEqual([400, "ERR_INVESTIGATION_TOO_MANY_ROLES"]);
    delete process.env.ROLE_DISCOVERY_MAX_ROLES;
    expect(await code(await start(scoped.analysisId, body()))).toEqual([409, "ERR_ROLE_DISCOVERY_OPERAND_NOT_PERSON"]);
    const unconfirmed = await start(person.analysisId, body({ confirmedCalls: 1 }));
    expect([unconfirmed.status, (await unconfirmed.json()).issues[0]]).toEqual([409, { code: "ERR_INVESTIGATION_CALLS_NOT_CONFIRMED", callsNeeded: 2 }]);
    expect(await rows("career_relation_investigations")).toBe(0);
    expect(await rows("career_proposal_requirement_relations")).toBe(0);
  });

  it("explicit start: one call per role, relations stored, STAND_IN labelled; a repeat runs nothing; a new request reuses the cache without a call", async () => {
    process.env.ROLE_DISCOVERY_SEMANTIC_PROVIDER = "stand-in";
    const first = await start(person.analysisId, body());
    const out = await first.json();
    if (!out.success) throw new Error(JSON.stringify(out));
    expect([first.status, out.created, out.evidenceClass, out.investigation.status]).toEqual([201, true, "STAND_IN", "COMPLETED"]);
    expect(out.tasks.map((t: { status: string }) => t.status)).toEqual(["SUCCEEDED", "SUCCEEDED"]);
    const stored = await rows("career_proposal_requirement_relations");
    expect(stored).toBeGreaterThan(0);
    const ledger = async () => (await db.$client<{ scope_key: string; reserved: number; consumed: number }[]>`SELECT scope_key, reserved, consumed FROM career_relation_call_ledger WHERE scope_key LIKE ${`INV:${out.investigation.investigationId}`}`)[0];
    expect(await ledger()).toMatchObject({ reserved: 2, consumed: 2 });

    const repeat = await (await start(person.analysisId, body())).json();
    expect([repeat.created, repeat.investigation.investigationId]).toEqual([false, out.investigation.investigationId]);
    expect(await rows("career_proposal_requirement_relations")).toBe(stored);
    expect(await ledger()).toMatchObject({ reserved: 2, consumed: 2 });

    // the plan now sees the cache: nothing pending, so a new request needs 0 calls and every role is CACHED
    expect((await (await read(person.analysisId)).json()).discovery.semanticPlan.callsNeeded).not.toBeNull();
    const reuse = await (await start(person.analysisId, body({ clientRequestId: `other-${stamp}`, confirmedCalls: 0 }))).json();
    expect(reuse.tasks.map((t: { status: string }) => t.status)).toEqual(["CACHED", "CACHED"]);
    expect(reuse.investigation.status).toBe("COMPLETED");
    expect(await rows("career_proposal_requirement_relations")).toBe(stored);

    const read2 = await GET_INVESTIGATION(new Request("http://local/x"), { params: Promise.resolve({ analysisId: person.analysisId, investigationId: out.investigation.investigationId }) });
    expect([read2.status, (await read2.json()).investigation.status]).toEqual([200, "COMPLETED"]);
    const foreign = await GET_INVESTIGATION(new Request("http://local/x"), { params: Promise.resolve({ analysisId: scoped.analysisId, investigationId: out.investigation.investigationId }) });
    expect(foreign.status).toBe(404);
  });

  it("budget exhausted: no call is made, the first role is BUDGET_EXHAUSTED, the rest CANCELLED, nothing stored", async () => {
    process.env.ROLE_DISCOVERY_SEMANTIC_PROVIDER = "stand-in";
    process.env.ROLE_DISCOVERY_DAY_LIMIT = "0";
    const before = await rows("career_proposal_requirement_relations");
    const other = roles.slice(2, 4);
    const out = await (await start(person.analysisId, body({ roles: other, clientRequestId: `budget-${stamp}`, confirmedCalls: 2 }))).json();
    expect(out.tasks.map((t: { status: string }) => t.status)).toEqual(["BUDGET_EXHAUSTED", "CANCELLED"]);
    expect(out.investigation.status).toBe("FAILED");
    expect(await rows("career_proposal_requirement_relations")).toBe(before);
  });
});
