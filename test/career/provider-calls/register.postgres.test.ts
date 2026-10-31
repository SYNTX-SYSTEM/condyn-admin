import { beforeAll, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { db, initDbSchema } from "../../../lib/career/db/client";
import { ensureRelationCacheRegistration } from "../../../lib/career/job-pool/relation-cache-registration";
import { ProviderCallBlocked, guardedGenerateContent, runWithProviderCallRecorder } from "../../../lib/career/provider-calls/guard";
import { PROVIDER_CALL_DEFAULT_JOB_LIMIT, PostgresProviderCallRegister, providerCallUsage, readJobCallLimit, settleStaleProviderCalls } from "../../../lib/career/provider-calls/register";
import { withJobCallRegister } from "../../../lib/career/provider-calls/job-context";

/** The write-ahead call register (point 2) on PostgreSQL, DETERMINISTIC_FIXTURE: no network, no model. */
const T0 = "2099-03-03T10:00:00.000Z";
const later = (ms: number) => new Date(Date.parse(T0) + ms).toISOString();
const ledgerRow = async (jobId: string) => ((await db.execute(sql`SELECT reserved, consumed, released, limit_units FROM career_relation_call_ledger WHERE scope_key = ${`JOB:${jobId}`}`)) as unknown as Array<{ reserved: number; consumed: number; released: number; limit_units: number }>)[0];
const rowsOf = async (jobId: string) => (await db.execute(sql`SELECT state, stage, error_class, error_code, http_status FROM career_provider_calls WHERE job_id = ${jobId} ORDER BY created_at, call_id`)) as unknown as Array<{ state: string; stage: string; error_class: string | null; error_code: string | null; http_status: number | null }>;
/** The database's own message (drizzle wraps it). */
const refused = async (query: Promise<unknown>): Promise<string> => { try { await query; return "NOT REFUSED"; } catch (e) { const err = e as { message?: string; cause?: { message?: string } }; return `${err.cause?.message ?? ""} ${err.message ?? ""}`; } };
let n = 0; const job = (label: string) => `JOB_REG_${label}_${Date.now()}_${n++}`;

describe("call register (PostgreSQL)", () => {
  beforeAll(async () => { await initDbSchema(); expect(await ensureRelationCacheRegistration()).toBe("REGISTERED"); });

  it("a call is a row before it is sent: RESERVED → SENT → COMPLETED, the job budget counts it from the reservation on", async () => {
    const jobId = job("flow"); const reg = new PostgresProviderCallRegister(db.$client, { jobId, limit: 3, now: () => T0 });
    const id = await reg.begin({ stage: "SEMANTIC", investigationId: "RINV_X", poolRoleId: "role_a", attempt: 1 });
    expect((await rowsOf(jobId))[0].state).toBe("RESERVED");
    expect(await ledgerRow(jobId)).toMatchObject({ reserved: 1, consumed: 0, released: 0, limit_units: 3 });
    await reg.markSent(id); expect((await rowsOf(jobId))[0].state).toBe("SENT");
    await reg.complete(id, { requestBytes: 10, responseBytes: 20 });
    expect((await rowsOf(jobId))[0].state).toBe("COMPLETED");
    expect(await ledgerRow(jobId)).toMatchObject({ reserved: 1, consumed: 1, released: 0 });
    expect(await providerCallUsage(db.$client, jobId)).toMatchObject({ limit: 3, reserved: 1, sent: 1, byStage: { SEMANTIC: 1 } });
  });

  it("the budget is strict: the call beyond the limit is refused BEFORE anything is sent and leaves no row", async () => {
    const jobId = job("limit"); const reg = new PostgresProviderCallRegister(db.$client, { jobId, limit: 2 });
    let sent = 0;
    const run = () => runWithProviderCallRecorder(reg, () => guardedGenerateContent("EXTRACTION_DISCOVERY", async () => { sent += 1; return "ok"; }));
    expect(await run()).toBe("ok"); expect(await run()).toBe("ok");
    const error = await run().catch(e => e);
    expect(error).toBeInstanceOf(ProviderCallBlocked); expect(error.code).toBe("ERR_PROVIDER_CALL_BUDGET_EXHAUSTED");
    expect(sent).toBe(2);
    expect((await rowsOf(jobId))).toHaveLength(2);
    expect(await ledgerRow(jobId)).toMatchObject({ reserved: 2, consumed: 2, released: 0 });
  });

  it("a failed request stays in the budget (FAILED_AFTER_SEND, classified); only a call that never left comes back", async () => {
    const jobId = job("fail"); const reg = new PostgresProviderCallRegister(db.$client, { jobId, limit: 2 });
    const failing = () => runWithProviderCallRecorder(reg, () => guardedGenerateContent("SEMANTIC", async () => { throw Object.assign(new Error("overloaded"), { status: 503 }); }));
    await failing().catch(() => undefined);
    expect((await rowsOf(jobId))[0]).toMatchObject({ state: "FAILED_AFTER_SEND", error_class: "TRANSIENT", error_code: "HTTP_503", http_status: 503 });
    expect(await ledgerRow(jobId)).toMatchObject({ reserved: 1, consumed: 1, released: 0 });
    await failing().catch(() => undefined);
    // both spent: a third attempt is refused although both calls failed
    expect((await failing().catch(e => e))).toBeInstanceOf(ProviderCallBlocked);
    const id = await new PostgresProviderCallRegister(db.$client, { jobId: job("before"), limit: 1 }).begin({ stage: "SEMANTIC" });
    expect(id).toMatch(/^PCALL_[0-9A-F]{32}$/);
  });

  it("failBeforeSend is the only release: the unit comes back and the row says so", async () => {
    const jobId = job("rel"); const reg = new PostgresProviderCallRegister(db.$client, { jobId, limit: 1 });
    const id = await reg.begin({ stage: "SEMANTIC" });
    await reg.failBeforeSend(id, "ERR_PROVIDER_CALL_REGISTER_FAILED");
    expect((await rowsOf(jobId))[0]).toMatchObject({ state: "FAILED_BEFORE_SEND", error_code: "ERR_PROVIDER_CALL_REGISTER_FAILED" });
    expect(await ledgerRow(jobId)).toMatchObject({ reserved: 1, released: 1 });
    await reg.begin({ stage: "SEMANTIC" }); // the unit is free again
    // a SENT call cannot be released
    const sent = await reg.begin({ stage: "SEMANTIC" }).catch(e => e);
    expect(sent).toBeInstanceOf(ProviderCallBlocked);
  });

  it("the database keeps the direction: no delete, no step backwards, identity fixed, counters never fall", async () => {
    const jobId = job("guard"); const reg = new PostgresProviderCallRegister(db.$client, { jobId, limit: 5 });
    const id = await reg.begin({ stage: "SEMANTIC" }); await reg.markSent(id); await reg.complete(id, { requestBytes: 1, responseBytes: 1 });
    expect(await refused(db.execute(sql`DELETE FROM career_provider_calls WHERE call_id = ${id}`))).toMatch(/delete refused/);
    expect(await refused(db.execute(sql`UPDATE career_provider_calls SET state = 'SENT' WHERE call_id = ${id}`))).toMatch(/STATUS_BACKWARD/);
    expect(await refused(db.execute(sql`UPDATE career_provider_calls SET job_id = 'JOB_OTHER' WHERE call_id = ${id}`))).toMatch(/identity fields are fixed/);
    expect(await refused(db.execute(sql`UPDATE career_provider_calls SET state = 'FAILED_BEFORE_SEND' WHERE call_id = ${id}`))).toMatch(/STATUS_BACKWARD/);
    expect(await refused(db.execute(sql`UPDATE career_relation_call_ledger SET consumed = 0 WHERE scope_key = ${`JOB:${jobId}`}`))).toMatch(/counters never decrease/);
    // a state transition that skips SENT is refused too
    const other = await reg.begin({ stage: "SEMANTIC" });
    expect(await refused(db.execute(sql`UPDATE career_provider_calls SET state = 'COMPLETED' WHERE call_id = ${other}`))).toMatch(/STATUS_BACKWARD/);
  });

  it("a crashed worker's rows are settled: SENT without an end counts as UNKNOWN (spent), RESERVED that never got SENT comes back; fresh rows are left alone", async () => {
    const jobId = job("stale"); const reg = new PostgresProviderCallRegister(db.$client, { jobId, limit: 5, now: () => T0 });
    const lost = await reg.begin({ stage: "SEMANTIC" }); await reg.markSent(lost);
    await reg.begin({ stage: "SEMANTIC" }); // RESERVED, never sent
    const fresh = new PostgresProviderCallRegister(db.$client, { jobId, limit: 5, now: () => later(14 * 60_000) });
    const freshId = await fresh.begin({ stage: "SEMANTIC" }); await fresh.markSent(freshId);
    const settled = await settleStaleProviderCalls(db.$client, later(16 * 60_000));
    expect(settled.unknown).toBe(1); expect(settled.released).toBeGreaterThanOrEqual(1); // other tests of this file leave RESERVED rows behind, which are legitimately settled too
    const states = (await rowsOf(jobId)).map(r => r.state).sort();
    expect(states).toEqual(["FAILED_BEFORE_SEND", "SENT", "UNKNOWN"]);
    expect(await ledgerRow(jobId)).toMatchObject({ reserved: 3, consumed: 1, released: 1 });
    expect(await providerCallUsage(db.$client, jobId)).toMatchObject({ sent: 2, byState: { UNKNOWN: 1, SENT: 1, FAILED_BEFORE_SEND: 1 } });
    expect(await settleStaleProviderCalls(db.$client, later(16 * 60_000))).toEqual({ unknown: 0, released: 0 }); // idempotent
  });

  it("the limit follows the configuration but never drops below what is already outstanding", async () => {
    const jobId = job("lim");
    const a = new PostgresProviderCallRegister(db.$client, { jobId, limit: 3 });
    await a.begin({ stage: "SEMANTIC" }); await a.begin({ stage: "SEMANTIC" });
    const lower = new PostgresProviderCallRegister(db.$client, { jobId, limit: 1 });
    await expect(lower.begin({ stage: "SEMANTIC" })).rejects.toBeInstanceOf(ProviderCallBlocked);
    expect(await ledgerRow(jobId)).toMatchObject({ reserved: 2, limit_units: 2 });
  });

  it("GEMINI_JOB_CALL_LIMIT: not set is the default; set, it must be plain digits ≥ 1 — anything else fails closed to 0 (no call), like the day limit", async () => {
    expect(readJobCallLimit({})).toBe(PROVIDER_CALL_DEFAULT_JOB_LIMIT);
    expect(readJobCallLimit({ GEMINI_JOB_CALL_LIMIT: "10" })).toBe(10);
    for (const bad of ["", "0", "-3", "1e3", "ten", "12.5", "9999999"]) expect(readJobCallLimit({ GEMINI_JOB_CALL_LIMIT: bad }), bad).toBe(0);
    const jobId = job("zero"); const reg = new PostgresProviderCallRegister(db.$client, { jobId, limit: 0 });
    await expect(reg.begin({ stage: "SEMANTIC" })).rejects.toBeInstanceOf(ProviderCallBlocked);
  });

  it("withJobCallRegister binds the job's register: extraction and matching share one budget, the call after the limit is not sent", async () => {
    const jobId = job("ctx"); let sent = 0;
    const work = () => withJobCallRegister(jobId, async () => {
      for (let i = 0; i < 4; i += 1) await guardedGenerateContent(i < 2 ? "EXTRACTION_LEGACY" : "SEMANTIC", async () => { sent += 1; }).catch(e => { if (!(e instanceof ProviderCallBlocked)) throw e; });
    }, { GEMINI_JOB_CALL_LIMIT: "3" });
    await work();
    expect(sent).toBe(3);
    expect(await providerCallUsage(db.$client, jobId)).toMatchObject({ limit: 3, sent: 3, byStage: { EXTRACTION_LEGACY: 2, SEMANTIC: 1 } });
  });
});
