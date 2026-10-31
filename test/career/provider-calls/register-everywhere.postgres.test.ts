import { describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "../../../lib/career/db/client";
import { ProviderCallBlocked, guardedGenerateContent, setDefaultProviderCallRecorder } from "../../../lib/career/provider-calls/guard";
import { withJobCallRegister } from "../../../lib/career/provider-calls/job-context";
import { registerProviderCallRegisterSchema } from "../../../lib/career/provider-calls/register-schema";

/**
 * BUDGET BOUNDARY: the register is provisioned on whatever database the job runs on — here a database that never had it and is NOT
 * registered by the relation cache. Existing data survives. DETERMINISTIC_FIXTURE: no network, no model.
 */
const q = async <T = Record<string, unknown>>(text: ReturnType<typeof sql>) => (await db.execute(text)) as unknown as T[];
const dropRegister = async () => { await db.execute(sql`DROP TABLE IF EXISTS career_provider_calls`); await db.execute(sql`DROP TABLE IF EXISTS career_relation_call_ledger`); };

describe("the call register on a database that never had it", () => {
  it("withJobCallRegister provisions it, writes the row before the call and counts it — no relation cache needed", async () => {
    setDefaultProviderCallRecorder(undefined);
    await dropRegister();
    let sent = 0;
    const jobId = `JOB_EVERYWHERE_${Date.now()}`;
    await withJobCallRegister(jobId, () => guardedGenerateContent("EXTRACTION_LEGACY", async () => {
      sent += 1;
      expect((await q<{ state: string }>(sql`SELECT state FROM career_provider_calls WHERE job_id = ${jobId}`))[0].state).toBe("SENT");
      return "ok";
    }), { GEMINI_JOB_CALL_LIMIT: "2" });
    expect(sent).toBe(1);
    expect((await q<{ state: string }>(sql`SELECT state FROM career_provider_calls WHERE job_id = ${jobId}`))[0].state).toBe("COMPLETED");
    expect((await q<{ consumed: number; limit_units: number }>(sql`SELECT consumed, limit_units FROM career_relation_call_ledger WHERE scope_key = ${`JOB:${jobId}`}`))[0]).toMatchObject({ consumed: 1, limit_units: 2 });
  });

  it("the strict limit holds on that database as well", async () => {
    setDefaultProviderCallRecorder(undefined);
    let sent = 0; const jobId = `JOB_EVERYWHERE_LIMIT_${Date.now()}`;
    const run = () => withJobCallRegister(jobId, () => guardedGenerateContent("SEMANTIC", async () => { sent += 1; return 1; }), { GEMINI_JOB_CALL_LIMIT: "1" });
    await run();
    const error = await run().catch(e => e);
    expect(error).toBeInstanceOf(ProviderCallBlocked); expect(error.code).toBe("ERR_PROVIDER_CALL_BUDGET_EXHAUSTED"); expect(sent).toBe(1);
  });

  it("a register that cannot be provisioned refuses every call (nothing is sent)", async () => {
    setDefaultProviderCallRecorder(undefined);
    const saved = process.env.DATABASE_URL; process.env.DATABASE_URL = "postgres://nobody@127.0.0.1:1/none";
    let sent = 0;
    try {
      const error = await withJobCallRegister("JOB_UNREACHABLE", () => guardedGenerateContent("SEMANTIC", async () => { sent += 1; return 1; })).catch(e => e);
      expect(error).toBeInstanceOf(ProviderCallBlocked); expect(error.code).toBe("ERR_PROVIDER_CALL_REGISTER_FAILED");
      delete process.env.DATABASE_URL;
      const none = await withJobCallRegister("JOB_NO_URL", () => guardedGenerateContent("SEMANTIC", async () => { sent += 1; return 1; })).catch(e => e);
      expect(none).toBeInstanceOf(ProviderCallBlocked);
    } finally { process.env.DATABASE_URL = saved; }
    expect(sent).toBe(0);
  });
});

describe("registration is additive", () => {
  it("a register from before EMBEDDING / DIAGNOSTIC keeps its rows and gets the wider stage list; twice and in parallel is the same", async () => {
    await dropRegister();
    await registerProviderCallRegisterSchema(db.$client);
    await db.execute(sql`ALTER TABLE career_provider_calls DROP CONSTRAINT career_provider_calls_stage_check`);
    await db.execute(sql`ALTER TABLE career_provider_calls ADD CONSTRAINT career_provider_calls_stage_check CHECK (stage IN ('EXTRACTION_LEGACY','EXTRACTION_DISCOVERY','EXTRACTION_CONVERGENCE','SEMANTIC'))`);
    await db.execute(sql`INSERT INTO career_provider_calls (call_id, job_id, stage, state, created_at) VALUES ('PCALL_00000000000000000000000000000001', 'JOB_OLD', 'SEMANTIC', 'COMPLETED', '2026-01-01T00:00:00.000Z')`);
    await Promise.all([1, 2, 3, 4].map(() => registerProviderCallRegisterSchema(db.$client)));
    await registerProviderCallRegisterSchema(db.$client);
    expect((await q<{ n: number }>(sql`SELECT count(*)::int AS n FROM career_provider_calls WHERE job_id = 'JOB_OLD'`))[0].n).toBe(1);
    await db.execute(sql`INSERT INTO career_provider_calls (call_id, job_id, stage, state, created_at) VALUES ('PCALL_00000000000000000000000000000002', 'JOB_OLD', 'EMBEDDING', 'RESERVED', '2026-01-01T00:00:00.000Z')`);
    await db.execute(sql`INSERT INTO career_provider_calls (call_id, job_id, stage, state, created_at) VALUES ('PCALL_00000000000000000000000000000003', 'JOB_OLD', 'DIAGNOSTIC', 'RESERVED', '2026-01-01T00:00:00.000Z')`);
  });

  it("a disabled guard trigger is enabled again, and the guard still refuses a delete", async () => {
    await db.execute(sql`ALTER TABLE career_provider_calls DISABLE TRIGGER rel_call_guard`);
    await db.execute(sql`ALTER TABLE career_relation_call_ledger DISABLE TRIGGER rel_ledger_guard`);
    await registerProviderCallRegisterSchema(db.$client);
    const states = await q<{ tgname: string; tgenabled: string }>(sql`SELECT tgname, tgenabled FROM pg_trigger WHERE tgname IN ('rel_call_guard','rel_ledger_guard') AND NOT tgisinternal`);
    expect(states.map(s => s.tgenabled)).toEqual(["O", "O"]);
    const err = await db.execute(sql`DELETE FROM career_provider_calls WHERE job_id = 'JOB_OLD'`).then(() => "NOT REFUSED", e => `${(e as { cause?: { message?: string } }).cause?.message}`);
    expect(err).toContain("ERR_PROVIDER_CALL_IMMUTABLE");
  });
});
