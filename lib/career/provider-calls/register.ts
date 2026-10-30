import { randomUUID } from "node:crypto";
import type { Sql } from "postgres";
import { ProviderCallBlocked, type ProviderCallRecorder, type ProviderCallStage, type ProviderFailureInfo } from "./guard";

/**
 * The persistent, write-ahead register of every model call (owner mandate THREE-POINT, point 2). One row per call:
 * RESERVED (budget unit taken, nothing sent) → SENT (committed BEFORE the request) → COMPLETED | FAILED_AFTER_SEND | UNKNOWN
 * (a SENT row that never got an end, e.g. a crashed worker); RESERVED → FAILED_BEFORE_SEND is the only way a unit comes back.
 * The job budget is the scope `JOB:<jobId>` of the existing call ledger; a call counts from the moment it may have left the process.
 * Registered with the investigation tables (same guarded, transactional registration: disposable databases only).
 */
export const PROVIDER_CALL_TABLE = "career_provider_calls";
export const PROVIDER_CALL_DEFAULT_JOB_LIMIT = 12;
export const PROVIDER_CALL_STALE_MS = 15 * 60 * 1000;

export const PROVIDER_CALL_DDL = [
  `CREATE TABLE IF NOT EXISTS ${PROVIDER_CALL_TABLE} (
    call_id text PRIMARY KEY CHECK (call_id ~ '^PCALL_[0-9A-F]{32}$'),
    job_id text NOT NULL,
    stage text NOT NULL CHECK (stage IN ('EXTRACTION_LEGACY','EXTRACTION_DISCOVERY','EXTRACTION_CONVERGENCE','SEMANTIC')),
    investigation_id text,
    job_pool_upload_id text,
    pool_role_id text,
    attempt integer,
    state text NOT NULL CHECK (state IN ('RESERVED','SENT','COMPLETED','FAILED_BEFORE_SEND','FAILED_AFTER_SEND','UNKNOWN')),
    error_class text CHECK (error_class IN ('TRANSIENT','PERMANENT','INCOMPLETE','EMPTY','UNKNOWN')),
    error_code text,
    http_status integer,
    request_bytes bigint NOT NULL DEFAULT 0,
    response_bytes bigint NOT NULL DEFAULT 0,
    created_at text NOT NULL,
    sent_at text,
    ended_at text
  )`,
  `CREATE INDEX IF NOT EXISTS ${PROVIDER_CALL_TABLE}_job_idx ON ${PROVIDER_CALL_TABLE} (job_id)`
] as const;

export const PROVIDER_CALL_GUARD_DDL = [
  `CREATE OR REPLACE FUNCTION rel_call_guard() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
    IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'ERR_PROVIDER_CALL_IMMUTABLE: delete refused'; END IF;
    IF NEW.call_id <> OLD.call_id OR NEW.job_id <> OLD.job_id OR NEW.stage <> OLD.stage OR NEW.created_at <> OLD.created_at
       OR NEW.investigation_id IS DISTINCT FROM OLD.investigation_id OR NEW.job_pool_upload_id IS DISTINCT FROM OLD.job_pool_upload_id
       OR NEW.pool_role_id IS DISTINCT FROM OLD.pool_role_id OR NEW.attempt IS DISTINCT FROM OLD.attempt
      THEN RAISE EXCEPTION 'ERR_PROVIDER_CALL_IMMUTABLE: identity fields are fixed'; END IF;
    IF NOT (NEW.state = OLD.state AND NEW.state IN ('RESERVED','SENT')
       OR (OLD.state = 'RESERVED' AND NEW.state IN ('SENT','FAILED_BEFORE_SEND'))
       OR (OLD.state = 'SENT' AND NEW.state IN ('COMPLETED','FAILED_AFTER_SEND','UNKNOWN')))
      THEN RAISE EXCEPTION 'ERR_PROVIDER_CALL_STATUS_BACKWARD: % -> %', OLD.state, NEW.state; END IF;
    RETURN NEW; END $$`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'rel_call_guard' AND tgrelid = '${PROVIDER_CALL_TABLE}'::regclass) THEN
      CREATE TRIGGER rel_call_guard BEFORE UPDATE OR DELETE ON ${PROVIDER_CALL_TABLE} FOR EACH ROW EXECUTE FUNCTION rel_call_guard(); END IF;
  END $$`
] as const;

/** The call budget of one job (extraction and matching together): GEMINI_JOB_CALL_LIMIT, plain digits ≥ 1, else the default. */
export function readJobCallLimit(env: Record<string, string | undefined> = process.env): number {
  const raw = env.GEMINI_JOB_CALL_LIMIT?.trim();
  if (raw !== undefined && /^[0-9]{1,6}$/.test(raw) && Number(raw) >= 1) return Number(raw);
  return PROVIDER_CALL_DEFAULT_JOB_LIMIT;
}

export type ProviderCallState = "RESERVED" | "SENT" | "COMPLETED" | "FAILED_BEFORE_SEND" | "FAILED_AFTER_SEND" | "UNKNOWN";
export interface ProviderCallUsage { limit: number | null; reserved: number; byState: Record<ProviderCallState, number>; sent: number; byStage: Record<string, number> }

export class PostgresProviderCallRegister implements ProviderCallRecorder {
  constructor(private readonly sql: Sql, private readonly scope: { jobId: string; limit: number; now?: () => string }) {}
  private get key() { return `JOB:${this.scope.jobId}`; }
  private now() { return (this.scope.now ?? (() => new Date().toISOString()))(); }

  async begin(input: { stage: ProviderCallStage; investigationId?: string; jobPoolUploadId?: string; poolRoleId?: string; attempt?: number }): Promise<string> {
    const callId = `PCALL_${randomUUID().replace(/-/g, "").toUpperCase()}`;
    // The configured limit is the latest one, never below what is already outstanding; its own statement so it stays committed when the reservation is refused.
    await this.sql`INSERT INTO career_relation_call_ledger (scope_key, limit_units) VALUES (${this.key}, ${this.scope.limit})
      ON CONFLICT (scope_key) DO UPDATE SET limit_units = GREATEST(EXCLUDED.limit_units, career_relation_call_ledger.reserved - career_relation_call_ledger.released)`;
    const taken = await this.sql.begin(async tx => {
      const rows = await tx<{ scope_key: string }[]>`UPDATE career_relation_call_ledger SET reserved = reserved + 1 WHERE scope_key = ${this.key} AND reserved - released < limit_units RETURNING scope_key`;
      if (rows.length === 0) return false;
      await tx`INSERT INTO career_provider_calls (call_id, job_id, stage, investigation_id, job_pool_upload_id, pool_role_id, attempt, state, created_at)
        VALUES (${callId}, ${this.scope.jobId}, ${input.stage}, ${input.investigationId ?? null}, ${input.jobPoolUploadId ?? null}, ${input.poolRoleId ?? null}, ${input.attempt ?? null}, 'RESERVED', ${this.now()})`;
      return true;
    });
    if (!taken) throw new ProviderCallBlocked("ERR_PROVIDER_CALL_BUDGET_EXHAUSTED");
    return callId;
  }

  async markSent(callId: string): Promise<void> {
    const rows = await this.sql`UPDATE career_provider_calls SET state = 'SENT', sent_at = ${this.now()} WHERE call_id = ${callId} AND state = 'RESERVED' RETURNING call_id`;
    if (rows.length !== 1) throw new Error("ERR_PROVIDER_CALL_STATE_CONFLICT");
  }

  async complete(callId: string, bytes: { requestBytes: number; responseBytes: number }): Promise<void> {
    await this.sql.begin(async tx => {
      const rows = await tx`UPDATE career_provider_calls SET state = 'COMPLETED', request_bytes = ${bytes.requestBytes}, response_bytes = ${bytes.responseBytes}, ended_at = ${this.now()} WHERE call_id = ${callId} AND state = 'SENT' RETURNING call_id`;
      if (rows.length !== 1) throw new Error("ERR_PROVIDER_CALL_STATE_CONFLICT");
      await tx`UPDATE career_relation_call_ledger SET consumed = consumed + 1, request_bytes = request_bytes + ${bytes.requestBytes}, response_bytes = response_bytes + ${bytes.responseBytes} WHERE scope_key = ${this.key}`;
    });
  }

  async failAfterSend(callId: string, info: ProviderFailureInfo & { requestBytes: number }): Promise<void> {
    await this.sql.begin(async tx => {
      const rows = await tx`UPDATE career_provider_calls SET state = 'FAILED_AFTER_SEND', error_class = ${info.errorClass}, error_code = ${info.errorCode}, http_status = ${info.httpStatus}, request_bytes = ${info.requestBytes}, ended_at = ${this.now()} WHERE call_id = ${callId} AND state = 'SENT' RETURNING call_id`;
      if (rows.length !== 1) throw new Error("ERR_PROVIDER_CALL_STATE_CONFLICT");
      await tx`UPDATE career_relation_call_ledger SET consumed = consumed + 1, request_bytes = request_bytes + ${info.requestBytes} WHERE scope_key = ${this.key}`;
    });
  }

  /** The only way a unit comes back: the request provably never left (RESERVED, never SENT). */
  async failBeforeSend(callId: string, code: string): Promise<void> {
    await this.sql.begin(async tx => {
      const rows = await tx`UPDATE career_provider_calls SET state = 'FAILED_BEFORE_SEND', error_code = ${code}, ended_at = ${this.now()} WHERE call_id = ${callId} AND state = 'RESERVED' RETURNING call_id`;
      if (rows.length !== 1) throw new Error("ERR_PROVIDER_CALL_STATE_CONFLICT");
      await tx`UPDATE career_relation_call_ledger SET released = released + 1 WHERE scope_key = ${this.key}`;
    });
  }

  async usage(): Promise<ProviderCallUsage> { return providerCallUsage(this.sql, this.scope.jobId); }
}

/** What the register holds for one job (read only). `sent` = calls that may have left the process (SENT, COMPLETED, FAILED_AFTER_SEND, UNKNOWN). */
export async function providerCallUsage(sql: Sql, jobId: string): Promise<ProviderCallUsage> {
  const rows = await sql<{ state: ProviderCallState; stage: string; n: number }[]>`SELECT state, stage, count(*)::int AS n FROM career_provider_calls WHERE job_id = ${jobId} GROUP BY state, stage`;
  const byState: Record<ProviderCallState, number> = { RESERVED: 0, SENT: 0, COMPLETED: 0, FAILED_BEFORE_SEND: 0, FAILED_AFTER_SEND: 0, UNKNOWN: 0 };
  const byStage: Record<string, number> = {};
  for (const r of rows) {
    byState[r.state] += r.n;
    if (r.state !== "RESERVED" && r.state !== "FAILED_BEFORE_SEND") byStage[r.stage] = (byStage[r.stage] ?? 0) + r.n;
  }
  const [ledger] = await sql<{ limit_units: number; reserved: number; released: number }[]>`SELECT limit_units, reserved, released FROM career_relation_call_ledger WHERE scope_key = ${`JOB:${jobId}`}`;
  return { limit: ledger?.limit_units ?? null, reserved: ledger ? ledger.reserved - ledger.released : 0, byState, byStage, sent: byState.SENT + byState.COMPLETED + byState.FAILED_AFTER_SEND + byState.UNKNOWN };
}

/**
 * Closes rows a crashed worker left behind: SENT without an end becomes UNKNOWN (counted — the request may have left), RESERVED that
 * never got SENT comes back (it provably never left). Only rows older than the threshold; safe to run from any worker, any time.
 */
export async function settleStaleProviderCalls(sql: Sql, now: string, olderThanMs: number = PROVIDER_CALL_STALE_MS): Promise<{ unknown: number; released: number }> {
  const before = new Date(Date.parse(now) - olderThanMs).toISOString();
  return sql.begin(async tx => {
    const unknown = await tx`UPDATE career_provider_calls SET state = 'UNKNOWN', error_class = 'UNKNOWN', error_code = 'NO_END_RECORDED', ended_at = ${now} WHERE state = 'SENT' AND sent_at < ${before} RETURNING job_id`;
    for (const r of unknown) await tx`UPDATE career_relation_call_ledger SET consumed = consumed + 1 WHERE scope_key = ${`JOB:${r.job_id}`}`;
    const released = await tx`UPDATE career_provider_calls SET state = 'FAILED_BEFORE_SEND', error_code = 'NEVER_SENT', ended_at = ${now} WHERE state = 'RESERVED' AND created_at < ${before} RETURNING job_id`;
    for (const r of released) await tx`UPDATE career_relation_call_ledger SET released = released + 1 WHERE scope_key = ${`JOB:${r.job_id}`}`;
    return { unknown: unknown.length, released: released.length };
  });
}
