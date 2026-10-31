import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { db, initDbSchema } from "../../../lib/career/db/client";
import { careerAnalyses } from "../../../lib/career/db/schema";
import { PostgresCandidateSourceBundleRepository, PostgresCapabilityCoreRepository, PostgresCapabilityProposalProjectionReferenceRepository, createSourceDocument } from "../../../lib/career/capability-core";
import { JobRepository } from "../../../lib/career/orchestration/job-repository";
import { GET as GET_AUTO_MATCH } from "../../../app/api/career/analyses/[analysisId]/auto-match/route";
import { GET as GET_RANKING } from "../../../app/api/career/analyses/[analysisId]/job-ranking/route";
import { POST as POST_START } from "../../../app/api/career/analyses/[analysisId]/role-discovery/investigations/route";
import { activePoolSnapshot, engineOfRequest, runAutoMatch, selectAutomaticRoles, viewOfAutoInvestigation } from "../../../lib/career/job-pool/auto-match";
import { readSemanticConfig } from "../../../lib/career/job-pool/semantic-config";
import { startSemanticInvestigation } from "../../../lib/career/job-pool/semantic-investigation-start";
import { TEST_JOB_SCOPE, resolveStoredTestJobScope, uploadEngineeringJobScope } from "../../support/job-scope";
import { SOURCE, fakeGeminiClient, geminiProvider, geminiText, produceAnalysis, type InspectorWorld } from "../result-inspector/fixture";

/** The automatic match on PostgreSQL (STAND_IN provider only; DETERMINISTIC_FIXTURE; no Gemini, no network). */
const POOL = TEST_JOB_SCOPE.jobPoolUploadId;
const params = (analysisId: string) => ({ params: Promise.resolve({ analysisId }) });
const autoMatch = async (analysisId: string) => { const r = await GET_AUTO_MATCH(new Request("http://local/x"), params(analysisId)); return { status: r.status, cache: r.headers.get("cache-control"), body: await r.json() }; };
const ranking = async (analysisId: string) => { const r = await GET_RANKING(new Request("http://local/x"), params(analysisId)); return { status: r.status, cache: r.headers.get("cache-control"), body: await r.json() }; };
const exists = async (table: string) => ((await db.execute(sql.raw(`SELECT to_regclass('${table}') IS NOT NULL AS e`))) as unknown as Array<{ e: boolean }>)[0].e;
const rows = async (table: string) => (await exists(table)) ? Number(((await db.execute(sql.raw(`SELECT count(*)::int AS n FROM ${table}`))) as unknown as Array<{ n: number }>)[0].n) : 0;
const DAY = "2099-01-01T00:00:00.000Z";
const WRITES = ["career_relation_investigations", "career_relation_role_tasks", "career_relation_call_ledger", "career_proposal_requirement_relations"] as const;
const snapshot = async () => Promise.all(WRITES.map(async t => [t, await exists(t), await rows(t)] as const));
const source = (label: string) => createSourceDocument({ docId: "CV", title: "cv.synthetic.pdf", rawContent: `${SOURCE} (${label})` });
const setEnv = (provider: string | undefined, limit?: string, maxRoles?: string, key?: string) => {
  for (const [k, v] of [["ROLE_DISCOVERY_SEMANTIC_PROVIDER", provider], ["ROLE_DISCOVERY_DAY_LIMIT", limit], ["ROLE_DISCOVERY_MAX_ROLES", maxRoles], ["GEMINI_API_KEY", key]] as const) { if (v === undefined) delete process.env[k]; else process.env[k] = v; }
};

describe("automatic match (PostgreSQL, stand-in)", () => {
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
  let person2: Awaited<ReturnType<typeof produceAnalysis>>;
  let scoped: Awaited<ReturnType<typeof produceAnalysis>>;
  const savedEnv = { ...process.env };

  beforeAll(async () => {
    await initDbSchema();
    await uploadEngineeringJobScope();
    const scope = await resolveStoredTestJobScope();
    // Own capability groups and an own ledger day: this file leaves nothing in the cache or the day scope that other files count on.
    person = await produceAnalysis(world, geminiProvider(fakeGeminiClient([geminiText("am1")])), null, "am1", source(`am1-${Date.now()}`), "Auto Match Alpha");
    // A different capability group: its proposals are different content, so nothing of the first run is cached for it.
    person2 = await produceAnalysis(world, geminiProvider(fakeGeminiClient([geminiText("am2")])), null, "am2", source(`am2-${Date.now()}`), "Kubernetes Operator Design");
    scoped = await produceAnalysis(world, geminiProvider(fakeGeminiClient([geminiText("ams")])), scope, "ams", source(`ams-${Date.now()}`), "TypeScript");
  });
  beforeEach(() => setEnv(undefined));
  afterAll(async () => {
    for (const k of ["ROLE_DISCOVERY_SEMANTIC_PROVIDER", "ROLE_DISCOVERY_DAY_LIMIT", "ROLE_DISCOVERY_MAX_ROLES", "GEMINI_API_KEY"]) { if (savedEnv[k] === undefined) delete process.env[k]; else process.env[k] = savedEnv[k]; }
    for (const jobId of created) {
      await db.execute(sql`DELETE FROM career_analysis_jobs WHERE job_id = ${jobId}`);
      await db.execute(sql`DELETE FROM career_analyses WHERE analysis_id = ${jobId.replace("JOB_", "ANL_")}`);
    }
  });

  it("disabled without a ready configuration and budget: no call, no investigation, and the read says why", async () => {
    const before = await snapshot();
    const cases: Array<[string, () => void, string]> = [
      ["not configured", () => setEnv(undefined), "SEMANTIC_NOT_CONFIGURED"],
      ["unknown provider", () => setEnv("openai", "100"), "PROVIDER_NOT_AUTHORIZED"],
      ["gemini without a key", () => setEnv("gemini", "100"), "PROVIDER_NOT_AUTHORIZED"],
      ["gemini without a budget", () => setEnv("gemini", "0", undefined, "k"), "PROVIDER_NOT_AUTHORIZED"],
      ["stand-in with day limit 0", () => setEnv("stand-in", "0"), "DAY_LIMIT_ZERO"],
      ["stand-in with a malformed limit", () => setEnv("stand-in", "1e3"), "DAY_LIMIT_ZERO"]
    ];
    for (const [name, apply, reason] of cases) {
      apply();
      expect(await runAutoMatch(person.analysisId), name).toEqual({ outcome: "DISABLED", reason });
      const read = await autoMatch(person.analysisId);
      expect([read.status, read.body.autoMatch.state, read.body.autoMatch.reason, read.body.autoMatch.budget, read.cache], name).toEqual([200, "DISABLED", reason, null, "no-store"]);
    }
    expect(await snapshot()).toEqual(before);
  });

  it("a PERSON × JOB analysis is skipped without a call; an unknown analysis is 404", async () => {
    setEnv("stand-in", "1000");
    const before = await snapshot();
    expect(await runAutoMatch(scoped.analysisId, () => DAY)).toEqual({ outcome: "SKIPPED", reason: "NOT_PERSON" });
    const read = await autoMatch(scoped.analysisId);
    expect([read.body.autoMatch.state, read.body.autoMatch.reason]).toEqual(["SKIPPED", "NOT_PERSON"]);
    expect((await autoMatch("ANL_does_not_exist")).status).toBe(404);
    expect((await ranking("ANL_does_not_exist")).status).toBe(404);
    expect((await ranking(scoped.analysisId)).status).toBe(409);
    expect(await snapshot()).toEqual(before);
  });

  it("before a run: NOT_STARTED; the reads write nothing and register nothing; the ranking is lexical only", async () => {
    setEnv("stand-in", "1000");
    const before = await snapshot();
    const read = await autoMatch(person.analysisId);
    expect([read.body.autoMatch.state, read.body.autoMatch.investigationId, read.body.autoMatch.budget]).toEqual(["NOT_STARTED", null, null]);
    const rank = await ranking(person.analysisId);
    expect([rank.status, rank.cache, rank.body.ranking.evidenceClass, rank.body.ranking.authority]).toEqual([200, "no-store", null, { ranking: true, decision: false, authorityState: "NONE" }]);
    expect(rank.body.ranking.ranks.length).toBeGreaterThan(0);
    expect(rank.body.ranking.ranks.every((r: { tier: string }) => r.tier === "LEXICAL_ONLY")).toBe(true);
    // PERSON × JOB mapping, phase A: a name relation carries the id of the proposal it names; no relation, no key.
    const reqs = rank.body.ranking.ranks.flatMap((r: { requirements: Array<{ source: string; capabilityName: string | null; capabilityKey: string | null }> }) => r.requirements);
    for (const q of reqs as Array<{ source: string; capabilityName: string | null; capabilityKey: string | null }>) expect([q.source, q.capabilityName === null, q.capabilityKey === null]).toEqual([q.source, q.capabilityName === null, q.capabilityName === null]);
    expect(await snapshot()).toEqual(before);
  });

  it("the run: one investigation within the budget, STAND_IN, COMPLETED; a repeat runs nothing; the ranking now carries semantic roles first", async () => {
    setEnv("stand-in", "1000", "25");
    const out = await runAutoMatch(person.analysisId, () => DAY);
    expect(out.outcome).toBe("STARTED");
    const read = (await autoMatch(person.analysisId)).body.autoMatch;
    expect(["COMPLETED", "PARTIAL"]).toContain(read.state);
    expect(read).toMatchObject({ evidenceClass: "STAND_IN", investigationId: out.investigationId });
    expect(read.pools.map((p: { jobPoolUploadId: string }) => p.jobPoolUploadId)).toContain(POOL);
    expect(read.budget.rolesEvaluated).toBeGreaterThan(0);
    expect(read.budget.rolesEvaluated).toBeLessThanOrEqual(read.budget.rolesPlanned);
    expect(typeof read.startedAt).toBe("string");
    expect(typeof read.finishedAt).toBe("string");

    const ledgerBefore = await rows("career_relation_call_ledger");
    const relationsBefore = await rows("career_proposal_requirement_relations");
    const again = await runAutoMatch(person.analysisId, () => DAY);
    expect([again.outcome, again.investigationId]).toEqual(["STARTED", out.investigationId]);
    expect([await rows("career_relation_call_ledger"), await rows("career_proposal_requirement_relations")]).toEqual([ledgerBefore, relationsBefore]);

    const before = await snapshot();
    const body = (await ranking(person.analysisId)).body.ranking;
    expect(await snapshot()).toEqual(before);
    expect(body.evidenceClass).toBe("STAND_IN");
    expect(body.ranks.map((r: { rank: number }) => r.rank)).toEqual(body.ranks.map((_: unknown, i: number) => i + 1));
    const tiers = body.ranks.map((r: { tier: string }) => r.tier);
    expect(tiers[0]).toBe("SEMANTIC");
    expect(tiers).toEqual([...tiers].sort((a: string, b: string) => (a === b ? 0 : a === "SEMANTIC" ? -1 : 1)));
    for (const r of body.ranks) {
      const weights = r.requirements.reduce((n: number, q: { weight: number }) => n + q.weight, 0);
      if (weights > 0) expect(r.fit).toBeCloseTo(r.requirements.reduce((n: number, q: { contribution: number }) => n + q.contribution, 0) / weights, 5);
      for (const q of r.requirements.filter((x: { source: string }) => x.source === "SEMANTIC")) {
        expect(["EQUIVALENT", "COVERS", "PARTIAL", "DIFFERENT", "UNCLEAR"]).toContain(q.state);
        expect(typeof q.explanation).toBe("string");
        expect(typeof q.evidenceLimitation).toBe("string");
      }
    }
    expect(body.ranks.some((r: { semanticCoverage: { evaluated: number } }) => r.semanticCoverage.evaluated > 0)).toBe(true);
  });

  it("a role count beyond the budget is reported: PARTIAL with ROLES_BEYOND_BUDGET, the rest stays lexical-only", async () => {
    setEnv("stand-in", "1000", "1");
    const out = await runAutoMatch(person2.analysisId, () => DAY);
    expect(out.outcome).toBe("STARTED");
    const read = (await autoMatch(person2.analysisId)).body.autoMatch;
    expect([read.state, read.reason, read.budget.rolesPlanned]).toEqual(["PARTIAL", "ROLES_BEYOND_BUDGET", 1]);
    const body = (await ranking(person2.analysisId)).body.ranking;
    expect(body.ranks.filter((r: { tier: string }) => r.tier === "SEMANTIC").length).toBeGreaterThan(0);
    expect(body.ranks.filter((r: { tier: string }) => r.tier === "LEXICAL_ONLY").length).toBeGreaterThan(0);
  });

  it("the day limit is shared with the manual starts: a spent budget stops every role, the run ends FAILED with BUDGET_EXHAUSTED and makes no call", async () => {
    // person (run above) and person2 already used calls of today's stand-in scope; a limit of exactly what is spent leaves nothing
    const spent = Number(((await db.execute(sql.raw(`SELECT COALESCE(SUM(consumed),0)::int AS n FROM career_relation_call_ledger WHERE scope_key = 'DAY:stand-in:2099-01-01'`))) as unknown as Array<{ n: number }>)[0].n);
    expect(spent).toBeGreaterThan(0);
    setEnv("stand-in", String(spent), "25");
    const fresh = await produceAnalysis(world, geminiProvider(fakeGeminiClient([geminiText("am3")])), null, "am3", source(`am3-${Date.now()}`), "Rust Borrow Checker Internals");
    const before = await rows("career_relation_call_ledger");
    const out = await runAutoMatch(fresh.analysisId, () => DAY);
    expect(out.outcome).toBe("STARTED");
    const read = (await autoMatch(fresh.analysisId)).body.autoMatch;
    expect([read.state, read.reason, read.budget.rolesEvaluated]).toEqual(["FAILED", "ERR_BUDGET_EXHAUSTED", 0]);
    const consumed = Number(((await db.execute(sql.raw(`SELECT COALESCE(SUM(consumed),0)::int AS n FROM career_relation_call_ledger WHERE scope_key = 'DAY:stand-in:2099-01-01'`))) as unknown as Array<{ n: number }>)[0].n);
    expect(consumed).toBe(spent);
    expect(await rows("career_relation_call_ledger")).toBeGreaterThanOrEqual(before);
  });

  it("the ranking uses the engine OF THE RUN: a later change of the configuration does not hide it and does not contradict the state read", async () => {
    setEnv("stand-in", "1000", "25");
    await runAutoMatch(person.analysisId, () => DAY);
    for (const [name, apply] of [["no provider", () => setEnv(undefined)], ["gemini with key and budget", () => setEnv("gemini", "50", "25", "k")], ["unknown provider", () => setEnv("openai", "50")]] as const) {
      apply();
      const rank = (await ranking(person.analysisId)).body.ranking;
      expect([rank.evidenceClass, rank.ranks.some((r: { tier: string }) => r.tier === "SEMANTIC")], name).toEqual(["STAND_IN", true]);
    }
  });

  it("an explicit start never takes the identity of the automatic run, and a manual investigation is not an automatic one", async () => {
    setEnv("stand-in", "1000", "25");
    const manual = await produceAnalysis(world, geminiProvider(fakeGeminiClient([geminiText("am4")])), null, "am4", source(`am4-${Date.now()}`), "Manual Only Group");
    const config = readSemanticConfig();
    if (config.state !== "READY") throw new Error("fixture");
    const roleKey = ((await (await import("../../../app/api/career/analyses/[analysisId]/role-discovery/route")).GET(new Request(`http://local/x?jobPoolUploadId=${POOL}`), params(manual.analysisId))).json() as Promise<{ discovery: { roles: Array<{ key: { jobPoolUploadId: string; poolRoleId: string }; counts: { requirements: number } }> } }>);
    const first = (await roleKey).discovery.roles.find(r => r.counts.requirements > 0)!.key;
    const started = await startSemanticInvestigation({ analysisId: manual.analysisId, config, jobPoolUploadIds: [POOL], roleKeys: [first], clientRequestId: "manual-only", confirmedCalls: "AS_PLANNED", now: () => DAY });
    expect(started.kind).toBe("CREATED");
    expect((await autoMatch(manual.analysisId)).body.autoMatch.state).toBe("NOT_STARTED");
    const forged = await POST_START(new Request("http://local/x", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jobPoolUploadIds: [POOL], roles: [first], clientRequestId: `auto:${manual.analysisId}`, confirmedCalls: 0 }) }), params(manual.analysisId));
    expect([forged.status, (await forged.json()).issues[0].code]).toEqual([400, "ERR_INVESTIGATION_BODY_INVALID"]);
    expect((await autoMatch(manual.analysisId)).body.autoMatch.state).toBe("NOT_STARTED");
  });

  it("a pool of the run that is no longer ACTIVE is dropped from the ranking and named in poolsDropped", async () => {
    setEnv("stand-in", "1000", "25");
    await runAutoMatch(person.analysisId, () => DAY);
    const set = async (status: string) => db.execute(sql`UPDATE career_job_pool_uploads SET pool_status = ${status} WHERE job_pool_upload_id = ${POOL}`);
    try {
      await set("ARCHIVED");
      const body = (await ranking(person.analysisId)).body.ranking;
      // other files of a full run may have left further ACTIVE pools: only this pool's fate is asserted
      expect(body.poolsDropped).toContain(POOL);
      expect(body.pools.map((p: { jobPoolUploadId: string }) => p.jobPoolUploadId)).not.toContain(POOL);
      expect(body.ranks.some((r: { role: { jobPoolUploadId: string } }) => r.role.jobPoolUploadId === POOL)).toBe(false);
    } finally { await set("ACTIVE"); }
    const back = (await ranking(person.analysisId)).body.ranking;
    expect(back.poolsDropped).not.toContain(POOL);
    expect(back.ranks.some((r: { role: { jobPoolUploadId: string } }) => r.role.jobPoolUploadId === POOL)).toBe(true);
  });
});

describe("selectAutomaticRoles", () => {
  const role = (id: string, status: string, requirements: number) => ({ key: { jobPoolUploadId: "U", poolRoleId: id }, status, counts: { requirements } }) as never;
  it("most name-related first, then discovery order; roles without requirements never take a call; bounded", () => {
    const discovery = { roles: [role("none", "NO_LEXICAL_RELATION", 3), role("weak", "WEAK_LEXICAL_ONLY", 3), role("empty", "NO_REQUIREMENTS", 0), role("all", "ALL_REQUIREMENTS_NAME_RELATED", 3), role("part1", "PARTIAL_NAME_RELATED", 3), role("part2", "PARTIAL_NAME_RELATED", 3)] };
    expect(selectAutomaticRoles(discovery, 99).map(k => k.poolRoleId)).toEqual(["all", "part1", "part2", "weak", "none"]);
    expect(selectAutomaticRoles(discovery, 2).map(k => k.poolRoleId)).toEqual(["all", "part1"]);
    expect(selectAutomaticRoles(discovery, 0)).toEqual([]);
  });
});

describe("pure parts of the automatic match", () => {
  const summary = (id: string, name: string, status = "ACTIVE") => ({ jobPoolUploadId: id, poolName: name, poolStatus: status }) as never;
  it("the pool snapshot is ACTIVE pools only, ordered by name then id, at most 10", () => {
    const list = [summary("U3", "B"), summary("U1", "A"), summary("U9", "A", "ARCHIVED"), summary("U2", "A")];
    expect(activePoolSnapshot(list).map(p => p.jobPoolUploadId)).toEqual(["U1", "U2", "U3"]);
    const many = Array.from({ length: 14 }, (_, i) => summary(`U${String(i).padStart(2, "0")}`, "P"));
    expect(activePoolSnapshot(many)).toHaveLength(10);
    expect(activePoolSnapshot(many).map(p => p.jobPoolUploadId)).toEqual(many.slice(0, 10).map(p => (p as unknown as { jobPoolUploadId: string }).jobPoolUploadId));
  });

  const run = (status: string, request: Record<string, unknown> = {}, tasks: Array<{ status: string; errorCode: string | null }> = []) => viewOfAutoInvestigation({
    investigation: { investigationId: "RINV_X", provider: "stand-in", status: status as never, createdAt: "t0", updatedAt: "t1", request: { uploads: ["U1"], roles: [{}, {}], callsNeeded: 2, rolesTotal: 2, ...request } },
    tasks: tasks as never, poolNames: new Map([["U1", "Pool One"]])
  });
  it("PLANNED and RUNNING read as RUNNING without a finish time; terminal statuses read as themselves", () => {
    for (const status of ["PLANNED", "RUNNING"]) expect([run(status).state, run(status).finishedAt], status).toEqual(["RUNNING", null]);
    expect([run("COMPLETED").state, run("COMPLETED").reason, run("COMPLETED").finishedAt]).toEqual(["COMPLETED", null, "t1"]);
    expect([run("FAILED", {}, [{ status: "FAILED", errorCode: "ERR_X" }]).state, run("FAILED", {}, [{ status: "FAILED", errorCode: "ERR_X" }]).reason]).toEqual(["FAILED", "ERR_X"]);
    expect([run("INTERRUPTED").state, run("INTERRUPTED").reason]).toEqual(["FAILED", "ERR_INVESTIGATION_INTERRUPTED"]);
  });
  it("reasons of a partial run: failures first, then an exhausted day budget, else roles beyond the budget; roles left out make a completed run PARTIAL", () => {
    expect(run("PARTIAL", {}, [{ status: "FAILED", errorCode: "E" }, { status: "BUDGET_EXHAUSTED", errorCode: null }]).reason).toBe("ROLE_FAILURES");
    expect(run("PARTIAL", {}, [{ status: "SUCCEEDED", errorCode: null }, { status: "BUDGET_EXHAUSTED", errorCode: null }, { status: "CANCELLED", errorCode: null }]).reason).toBe("DAY_BUDGET_EXHAUSTED");
    expect(run("PARTIAL", {}, [{ status: "SUCCEEDED", errorCode: null }]).reason).toBe("ROLES_BEYOND_BUDGET");
    expect([run("COMPLETED", { rolesTotal: 9 }).state, run("COMPLETED", { rolesTotal: 9 }).reason]).toEqual(["PARTIAL", "ROLES_BEYOND_BUDGET"]);
    const v = run("COMPLETED", {}, [{ status: "SUCCEEDED", errorCode: null }, { status: "CACHED", errorCode: null }, { status: "FAILED", errorCode: "E" }]);
    expect([v.budget, v.pools, v.evidenceClass]).toEqual([{ rolesPlanned: 2, rolesEvaluated: 2, callsLimit: 2, callsUsed: null, callsJobLimit: null }, [{ jobPoolUploadId: "U1", poolName: "Pool One" }], "STAND_IN"]);
  });
  it("the engine of a run is read back only when complete", () => {
    const e = { contractVersion: "c", promptChecksum: "p", provider: "gemini", model: "m" };
    expect(engineOfRequest({ engine: e })).toEqual(e);
    for (const bad of [{}, { engine: { ...e, model: 3 } }, { engine: null }, { engine: "gemini" }]) expect(engineOfRequest(bad as never)).toBeNull();
  });
});
