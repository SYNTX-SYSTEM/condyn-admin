import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { sql } from "drizzle-orm";
import { db, initDbSchema } from "../../../lib/career/db/client";
import { careerAnalyses } from "../../../lib/career/db/schema";
import { PostgresCandidateSourceBundleRepository, PostgresCapabilityCoreRepository, PostgresCapabilityProposalProjectionReferenceRepository, createSourceDocument } from "../../../lib/career/capability-core";
import { JobRepository } from "../../../lib/career/orchestration/job-repository";
import { GET as GET_AUTO_MATCH } from "../../../app/api/career/analyses/[analysisId]/auto-match/route";
import { AUTO_MATCH_MAX_REVISIONS, continueAutoRun, resumeAutoMatches, runAutoMatch, viewOfAutoInvestigation } from "../../../lib/career/job-pool/auto-match";
import { PostgresInvestigationStore } from "../../../lib/career/job-pool/semantic-investigation-store";
import { providerCallUsage } from "../../../lib/career/provider-calls/register";
import { uploadEngineeringJobScope } from "../../support/job-scope";
import { SOURCE, fakeGeminiClient, geminiProvider, geminiText, produceAnalysis, type InspectorWorld } from "../result-inspector/fixture";

/**
 * The three points together on PostgreSQL, DETERMINISTIC_FIXTURE: the real shared start, the real call register, the real lease and the
 * real sweep, with a SCRIPTED mocked SDK (503s, a call that never returns). No network, no key of the owner, no model, no cost.
 */
const sdk = vi.hoisted(() => ({
  calls: 0, requests: [] as Array<{ contents: string }>,
  behave: (_index: number): "ok" | "hang" | { status: number } => "ok",
  release: null as null | (() => void)
}));
vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    constructor(_options: unknown) { void _options; }
    models = {
      generateContent: async (request: { model: string; contents: string }) => {
        const index = ++sdk.calls; sdk.requests.push(request);
        const behaviour = sdk.behave(index);
        if (behaviour === "hang") await new Promise<void>(resolve => { sdk.release = resolve; });
        else if (behaviour !== "ok") throw Object.assign(new Error("upstream said no"), behaviour);
        const after = request.contents.slice(request.contents.indexOf("\n\n") + 2);
        const payload = JSON.parse(after.slice(after.indexOf("{"))) as { proposals: Array<{ id: string; evidence: Array<{ evidenceId: string }> }>; requirements: Array<{ requirementId: string }> };
        const relations = payload.proposals.flatMap(p => payload.requirements.map(r => ({ proposalId: p.id, requirementId: r.requirementId, state: "COVERS", citedEvidenceIds: p.evidence.slice(0, 1).map(e => e.evidenceId), relationExplanation: "The quote names the same technology.", evidenceLimitation: "One sentence only." })));
        return { text: JSON.stringify({ relations }), candidates: [{ finishReason: "STOP" }] };
      }
    };
  }
}));

const KEY = "AIza-three-point-secret-0123456789";
const DAY = "2099-04-04T00:00:00.000Z";
const at = (ms: number) => new Date(Date.parse(DAY) + ms).toISOString();
const params = (analysisId: string) => ({ params: Promise.resolve({ analysisId }) });
const view = async (analysisId: string) => (await (await GET_AUTO_MATCH(new Request("http://local/x"), params(analysisId))).json()).autoMatch;
const setEnv = (o: Record<string, string | undefined>) => { for (const [k, v] of Object.entries(o)) { if (v === undefined) delete process.env[k]; else process.env[k] = v; } };
const gemini = (extra: Record<string, string | undefined> = {}) => setEnv({ ROLE_DISCOVERY_SEMANTIC_PROVIDER: "gemini", ROLE_DISCOVERY_DAY_LIMIT: "50", ROLE_DISCOVERY_MAX_ROLES: "3", ROLE_DISCOVERY_GEMINI_MODEL: "gemini-mock-model", GEMINI_API_KEY: KEY, GEMINI_JOB_CALL_LIMIT: undefined, ...extra });
const jobOf = (analysisId: string) => analysisId.replace("ANL_", "JOB_");
const usage = (analysisId: string) => providerCallUsage(db.$client, jobOf(analysisId));
const callRows = async (analysisId: string) => (await db.execute(sql`SELECT state, stage, attempt, error_class, error_code, http_status, investigation_id FROM career_provider_calls WHERE job_id = ${jobOf(analysisId)} ORDER BY created_at, call_id`)) as unknown as Array<{ state: string; stage: string; attempt: number | null; error_class: string | null; error_code: string | null; http_status: number | null; investigation_id: string | null }>;
const taskRows = async (investigationId: string) => (await db.execute(sql`SELECT pool_role_id, status, error_code FROM career_relation_role_tasks WHERE investigation_id = ${investigationId} ORDER BY pool_role_id`)) as unknown as Array<{ pool_role_id: string; status: string; error_code: string | null }>;
const ledger = async (key: string) => ((await db.execute(sql`SELECT reserved, consumed, released, limit_units FROM career_relation_call_ledger WHERE scope_key = ${key}`)) as unknown as Array<{ reserved: number; consumed: number; released: number; limit_units: number }>)[0];

describe("the three points together (PostgreSQL, scripted SDK)", () => {
  const jobs = new JobRepository(db);
  const created: string[] = [];
  const world: InspectorWorld = {
    capabilityRepository: new PostgresCapabilityCoreRepository(db),
    references: new PostgresCapabilityProposalProjectionReferenceRepository(db),
    sourceBundles: new PostgresCandidateSourceBundleRepository(db),
    saveJob: async job => { await jobs.enqueueJob(job); created.push(job.jobId); },
    saveAnalysis: async (analysisId, createdAt) => { await db.insert(careerAnalyses).values({ analysisId, createdAt, validationState: "VERIFIED", payload: { structured_data: {} } }); }
  };
  const saved = { ...process.env };
  const make = (label: string, group: string) => produceAnalysis(world, geminiProvider(fakeGeminiClient([geminiText(label)])), null, label, createSourceDocument({ docId: "CV", title: "cv.synthetic.pdf", rawContent: `${SOURCE} (${label}-${Date.now()})` }), group);
  let retry: Awaited<ReturnType<typeof make>>, lost: Awaited<ReturnType<typeof make>>, budget: Awaited<ReturnType<typeof make>>, plain: Awaited<ReturnType<typeof make>>;

  beforeAll(async () => {
    await initDbSchema(); await uploadEngineeringJobScope();
    retry = await make("tp1", "Three Point Retry Group");
    lost = await make("tp2", "Three Point Lost Group");
    budget = await make("tp3", "Three Point Budget Group");
    plain = await make("tp4", "Three Point Plain Group");
  });
  beforeEach(() => { sdk.calls = 0; sdk.requests.length = 0; sdk.behave = () => "ok"; sdk.release = null; });
  afterAll(async () => {
    for (const k of ["ROLE_DISCOVERY_SEMANTIC_PROVIDER", "ROLE_DISCOVERY_DAY_LIMIT", "ROLE_DISCOVERY_MAX_ROLES", "ROLE_DISCOVERY_GEMINI_MODEL", "GEMINI_API_KEY", "GEMINI_JOB_CALL_LIMIT"]) { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]; }
    for (const jobId of created) { await db.execute(sql`DELETE FROM career_analysis_jobs WHERE job_id = ${jobId}`); await db.execute(sql`DELETE FROM career_analyses WHERE analysis_id = ${jobId.replace("JOB_", "ANL_")}`); }
  });

  it("POINT 1+2: a role that fails TRANSIENTLY twice is FAILED with its class; every request is in the register (failed ones too); then a successor run asks ONLY that role again", async () => {
    gemini();
    sdk.behave = index => index <= 2 ? { status: 503 } : "ok"; // the first role's two attempts fail
    expect((await runAutoMatch(retry.analysisId, () => DAY, "worker-a")).outcome).toBe("STARTED");
    const first = await view(retry.analysisId);
    expect(first).toMatchObject({ state: "PARTIAL", reason: "ROLE_FAILURES", evidenceClass: "REAL_GEMINI", revision: 0, resumePending: true });
    expect(first.budget).toMatchObject({ rolesPlanned: 3, rolesEvaluated: 2, callsUsed: 4, callsJobLimit: 12 });
    expect(sdk.requests).toHaveLength(4); // 2 failed attempts + the other two roles
    const rows = await callRows(retry.analysisId);
    expect(rows.map(r => r.state).sort()).toEqual(["COMPLETED", "COMPLETED", "FAILED_AFTER_SEND", "FAILED_AFTER_SEND"]); // (rows created in the same millisecond have no fixed order)
    const failed = rows.filter(r => r.state === "FAILED_AFTER_SEND").sort((a, b) => (a.attempt ?? 0) - (b.attempt ?? 0));
    expect(failed).toEqual([expect.objectContaining({ attempt: 1, error_class: "TRANSIENT", http_status: 503, stage: "SEMANTIC" }), expect.objectContaining({ attempt: 2, error_class: "TRANSIENT", http_status: 503 })]);
    expect(await taskRows(first.investigationId)).toEqual(expect.arrayContaining([expect.objectContaining({ status: "FAILED", error_code: "ERR_SEMANTIC_PROVIDER_TRANSIENT" })]));
    // the day ledger counts what was sent (failures included), nothing was released
    expect(await ledger("DAY:gemini:2099-04-04")).toMatchObject({ released: 0 });
    expect(JSON.stringify(rows)).not.toContain(KEY);

    // too early: the continuation is not due yet (60 s) — and a repeated sweep is a no-op
    expect(await resumeAutoMatches(() => at(10_000), "worker-b")).toMatchObject({ continued: 0, interrupted: 0 });
    sdk.calls = 0; sdk.requests.length = 0; sdk.behave = () => "ok";
    const swept = await resumeAutoMatches(() => at(120_000), "worker-b");
    expect(swept.continued).toBeGreaterThanOrEqual(1);
    expect(sdk.requests).toHaveLength(1); // the two finished roles come from the cache; only the failed role is asked
    const second = await view(retry.analysisId);
    expect(second).toMatchObject({ revision: 1, resumePending: false });
    expect(second.budget).toMatchObject({ rolesEvaluated: 3, callsUsed: 5 });
    expect(second.investigationId).not.toBe(first.investigationId);
    expect((await taskRows(second.investigationId)).map(t => t.status).sort()).toEqual(["CACHED", "CACHED", "SUCCEEDED"]);
    // again: nothing more happens, no further call
    sdk.requests.length = 0;
    expect((await resumeAutoMatches(() => at(240_000), "worker-c")).continued).toBe(0);
    expect(sdk.requests).toHaveLength(0);
  }, 60_000);

  it("POINT 3: a run whose worker is gone is STALLED once its lease ran out, taken over race-free by ONE sweeper, continued from the cache, and the zombie cannot corrupt it", async () => {
    gemini();
    sdk.behave = index => index === 1 ? "hang" : "ok"; // the first call never returns: the worker 'dies' inside it
    const zombie = runAutoMatch(lost.analysisId, () => DAY, "worker-dead");
    for (let i = 0; i < 100 && sdk.requests.length < 1; i += 1) await new Promise(r => setTimeout(r, 25));
    expect(sdk.requests).toHaveLength(1);
    const store = new PostgresInvestigationStore(db.$client);
    const row = (await store.latestAutomatic(lost.analysisId))!;
    expect(row).toMatchObject({ status: "RUNNING", leaseOwner: "worker-dead" });
    const tasks = await store.tasks(row.investigationId);
    // alive within its lease, STALLED after it (derived on read, nothing written)
    expect(viewOfAutoInvestigation({ investigation: row, tasks, poolNames: new Map(), now: at(30_000) })).toMatchObject({ state: "RUNNING", reason: null, finishedAt: null });
    expect(viewOfAutoInvestigation({ investigation: row, tasks, poolNames: new Map(), now: at(600_000) })).toMatchObject({ state: "STALLED", reason: "WORKER_LOST", finishedAt: null });
    expect(row.leaseExpiresAt).toBe(at(90_000));

    const [a, b] = await Promise.all([resumeAutoMatches(() => at(600_000), "worker-1"), resumeAutoMatches(() => at(600_000), "worker-2")]);
    expect(a.interrupted + b.interrupted).toBe(1);   // one conditional update wins
    expect(a.continued + b.continued).toBe(1);       // and one successor exists
    const old = (await db.execute(sql`SELECT status FROM career_relation_investigations WHERE investigation_id = ${row.investigationId}`)) as unknown as Array<{ status: string }>;
    expect(old[0].status).toBe("INTERRUPTED");
    expect((await taskRows(row.investigationId)).map(t => t.status)).toEqual(expect.arrayContaining(["INTERRUPTED"]));
    expect((await taskRows(row.investigationId)).find(t => t.status === "INTERRUPTED")?.error_code).toBe("ERR_WORKER_LOST");
    const now = await view(lost.analysisId);
    expect(now).toMatchObject({ revision: 1, state: "PARTIAL" });
    expect(now.budget.rolesEvaluated).toBe(3);

    // the 'dead' worker wakes up: its late answer changes neither the interrupted run nor the successor
    sdk.release?.();
    await zombie.catch(() => undefined);
    const after = (await db.execute(sql`SELECT status FROM career_relation_investigations WHERE investigation_id = ${row.investigationId}`)) as unknown as Array<{ status: string }>;
    expect(after[0].status).toBe("INTERRUPTED");
    expect((await view(lost.analysisId)).investigationId).toBe(now.investigationId);
    // every request that left is in the register: the hung one is COMPLETED when it came back, none is missing
    const rows = await callRows(lost.analysisId);
    expect(rows.length).toBe(sdk.requests.length);
    expect(rows.every(r => r.state === "COMPLETED")).toBe(true);
  }, 60_000);

  it("POINT 2: the job budget is strict — the call beyond it is never sent, its reservation comes back on the role ledger, the run reports the exhausted budget", async () => {
    gemini({ GEMINI_JOB_CALL_LIMIT: "2", ROLE_DISCOVERY_MAX_ROLES: "4" });
    await runAutoMatch(budget.analysisId, () => DAY, "worker-a");
    expect(sdk.requests).toHaveLength(2);
    const v = await view(budget.analysisId);
    expect(v).toMatchObject({ state: "PARTIAL", reason: "DAY_BUDGET_EXHAUSTED" });
    expect(v.budget).toMatchObject({ rolesEvaluated: 2, callsUsed: 2, callsJobLimit: 2 });
    expect(await usage(budget.analysisId)).toMatchObject({ limit: 2, sent: 2, reserved: 2 });
    const inv = await ledger(`INV:${v.investigationId}`);
    expect(inv.reserved - inv.released).toBe(inv.consumed); // the refused reservation was given back
    // a continuation cannot get around it either
    sdk.requests.length = 0;
    await resumeAutoMatches(() => at(120_000), "worker-b");
    expect(sdk.requests).toHaveLength(0);
  }, 60_000);

  it("runs from before this existed (not marked resumable) are never touched by the sweep; a run at the last revision is not continued", async () => {
    gemini();
    sdk.behave = () => ({ status: 503 });
    const { startSemanticInvestigation } = await import("../../../lib/career/job-pool/semantic-investigation-start");
    const { readSemanticConfig } = await import("../../../lib/career/job-pool/semantic-config");
    const { createLocalJobPoolApplication } = await import("../../../lib/career/job-pool/local-composition");
    const config = readSemanticConfig(); if (config.state !== "READY") throw new Error("not ready");
    const pools = (await (await createLocalJobPoolApplication()).list()).filter(p => p.poolStatus === "ACTIVE");
    const { loadRoleDiscoveryOperand } = await import("../../../lib/career/job-pool/role-discovery-operand");
    const ids = pools.map(p => p.jobPoolUploadId);
    const operand = await loadRoleDiscoveryOperand(plain.analysisId, ids);
    if (!operand.ok) throw new Error("operand");
    const roleKeys = operand.discovery.roles.filter(r => r.counts.requirements > 0).slice(0, 1).map(r => ({ ...r.key }));
    const started = await startSemanticInvestigation({ analysisId: plain.analysisId, config, jobPoolUploadIds: ids, roleKeys, clientRequestId: `auto:${plain.analysisId}`, confirmedCalls: "AS_PLANNED", now: () => DAY, requestExtra: { auto: true, engine: config.engine, rolesTotal: 1 } });
    expect(started.kind).toBe("CREATED");
    const store = new PostgresInvestigationStore(db.$client);
    const row = (await store.latestAutomatic(plain.analysisId))!;
    expect(row.status).toBe("FAILED");
    sdk.requests.length = 0; sdk.behave = () => "ok";
    expect((await resumeAutoMatches(() => at(120_000), "worker-x")).continued).toBe(0);
    expect(sdk.requests).toHaveLength(0);
    expect(await continueAutoRun({ ...row, request: { ...row.request, resumable: true, revision: AUTO_MATCH_MAX_REVISIONS, engine: config.engine } }, () => at(120_000))).toEqual({ outcome: "SKIPPED", reason: "NOT_RESUMABLE" });
    expect(await continueAutoRun({ ...row, request: { ...row.request, resumable: true, revision: 0, engine: { ...config.engine, model: "another-model" } } }, () => at(120_000))).toEqual({ outcome: "SKIPPED", reason: "ENGINE_CHANGED" });
  }, 60_000);
});
