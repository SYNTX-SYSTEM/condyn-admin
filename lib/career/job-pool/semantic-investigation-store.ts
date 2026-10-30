import { createHash } from "node:crypto";
import type { Sql } from "postgres";
import type { CallLedger } from "./semantic-relation-engine";
import { canonicalJson } from "./relation-cache";
import { PROVIDER_CALL_DDL, PROVIDER_CALL_GUARD_DDL, PROVIDER_CALL_TABLE } from "../provider-calls/register";

/**
 * Persistence of explicit semantic investigations (stage 3, spec §6): the investigation (idempotent by key), its role tasks and the
 * call ledger. Registered in the same guarded, transactional registration as the relation cache (disposable databases only).
 * Statuses move forward only; nothing is deleted. The ledger reserves a call atomically against BOTH limits (day per provider and
 * investigation) before anything is sent; a day limit of 0 means nothing runs (the default for real providers).
 */
export const INVESTIGATION_TABLES = ["career_relation_investigations", "career_relation_role_tasks", "career_relation_call_ledger", PROVIDER_CALL_TABLE] as const;

export const INVESTIGATION_DDL = [
  `CREATE TABLE IF NOT EXISTS career_relation_investigations (
    investigation_id text PRIMARY KEY CHECK (investigation_id ~ '^RINV_[0-9A-F]{32}$'),
    idempotency_key text NOT NULL UNIQUE,
    analysis_id text NOT NULL,
    engine_version_hash text NOT NULL CHECK (engine_version_hash ~ '^[0-9a-f]{64}$'),
    provider text NOT NULL,
    request_json text NOT NULL,
    status text NOT NULL CHECK (status IN ('PLANNED','RUNNING','COMPLETED','PARTIAL','INTERRUPTED','FAILED')),
    created_at text NOT NULL,
    updated_at text NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS career_relation_role_tasks (
    investigation_id text NOT NULL REFERENCES career_relation_investigations(investigation_id),
    job_pool_upload_id text NOT NULL,
    pool_role_id text NOT NULL,
    status text NOT NULL CHECK (status IN ('PENDING','RUNNING','SUCCEEDED','FAILED','BUDGET_EXHAUSTED','INTERRUPTED','CANCELLED','CACHED')),
    error_code text,
    refusals_json text,
    pairs integer NOT NULL CHECK (pairs >= 0),
    stored integer NOT NULL DEFAULT 0 CHECK (stored >= 0),
    updated_at text NOT NULL,
    PRIMARY KEY (investigation_id, job_pool_upload_id, pool_role_id)
  )`,
  `CREATE TABLE IF NOT EXISTS career_relation_call_ledger (
    scope_key text PRIMARY KEY,
    limit_units integer NOT NULL CHECK (limit_units >= 0),
    reserved integer NOT NULL DEFAULT 0 CHECK (reserved >= 0),
    consumed integer NOT NULL DEFAULT 0 CHECK (consumed >= 0),
    released integer NOT NULL DEFAULT 0 CHECK (released >= 0),
    request_bytes bigint NOT NULL DEFAULT 0,
    response_bytes bigint NOT NULL DEFAULT 0,
    CHECK (released <= reserved AND consumed <= reserved - released AND reserved - released <= limit_units)
  )`,
  // Lease of the run (point 3): who runs it and until when; a run whose lease expired is STALLED and is taken up again by any worker.
  `ALTER TABLE career_relation_investigations ADD COLUMN IF NOT EXISTS lease_owner text`,
  `ALTER TABLE career_relation_investigations ADD COLUMN IF NOT EXISTS lease_expires_at text`,
  `ALTER TABLE career_relation_investigations ADD COLUMN IF NOT EXISTS heartbeat_at text`,
  ...PROVIDER_CALL_DDL
] as const;

/** Database-enforced direction (PINK O-LED-2): no delete anywhere, statuses forward only, ledger counters never decrease. */
export const INVESTIGATION_TRIGGERS = ["rel_inv_guard", "rel_task_guard", "rel_ledger_guard", "rel_call_guard"] as const;
export const INVESTIGATION_GUARD_DDL = [
  `CREATE OR REPLACE FUNCTION rel_inv_guard() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
    IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'ERR_INVESTIGATION_IMMUTABLE: delete refused'; END IF;
    IF NEW.investigation_id <> OLD.investigation_id OR NEW.idempotency_key <> OLD.idempotency_key OR NEW.analysis_id <> OLD.analysis_id
       OR NEW.engine_version_hash <> OLD.engine_version_hash OR NEW.provider <> OLD.provider OR NEW.request_json <> OLD.request_json OR NEW.created_at <> OLD.created_at
      THEN RAISE EXCEPTION 'ERR_INVESTIGATION_IMMUTABLE: identity fields are fixed'; END IF;
    IF NOT (NEW.status = OLD.status OR (OLD.status = 'PLANNED' AND NEW.status IN ('RUNNING','FAILED','INTERRUPTED'))
       OR (OLD.status = 'RUNNING' AND NEW.status IN ('COMPLETED','PARTIAL','INTERRUPTED','FAILED')))
      THEN RAISE EXCEPTION 'ERR_INVESTIGATION_STATUS_BACKWARD: % -> %', OLD.status, NEW.status; END IF;
    RETURN NEW; END $$`,
  `CREATE OR REPLACE FUNCTION rel_task_guard() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
    IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'ERR_INVESTIGATION_IMMUTABLE: delete refused'; END IF;
    IF NEW.investigation_id <> OLD.investigation_id OR NEW.job_pool_upload_id <> OLD.job_pool_upload_id OR NEW.pool_role_id <> OLD.pool_role_id OR NEW.pairs <> OLD.pairs
      THEN RAISE EXCEPTION 'ERR_INVESTIGATION_IMMUTABLE: identity fields are fixed'; END IF;
    IF NOT ((OLD.status = 'PENDING' AND NEW.status IN ('RUNNING','CACHED','CANCELLED'))
       OR (OLD.status = 'RUNNING' AND NEW.status IN ('SUCCEEDED','FAILED','BUDGET_EXHAUSTED','INTERRUPTED')))
      THEN RAISE EXCEPTION 'ERR_INVESTIGATION_STATUS_BACKWARD: % -> %', OLD.status, NEW.status; END IF;
    RETURN NEW; END $$`,
  `CREATE OR REPLACE FUNCTION rel_ledger_guard() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
    IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'ERR_LEDGER_IMMUTABLE: delete refused'; END IF;
    IF NEW.scope_key <> OLD.scope_key OR NEW.reserved < OLD.reserved OR NEW.consumed < OLD.consumed OR NEW.released < OLD.released
       OR NEW.request_bytes < OLD.request_bytes OR NEW.response_bytes < OLD.response_bytes
      THEN RAISE EXCEPTION 'ERR_LEDGER_IMMUTABLE: counters never decrease'; END IF;
    RETURN NEW; END $$`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'rel_inv_guard' AND tgrelid = 'career_relation_investigations'::regclass) THEN
      CREATE TRIGGER rel_inv_guard BEFORE UPDATE OR DELETE ON career_relation_investigations FOR EACH ROW EXECUTE FUNCTION rel_inv_guard(); END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'rel_task_guard' AND tgrelid = 'career_relation_role_tasks'::regclass) THEN
      CREATE TRIGGER rel_task_guard BEFORE UPDATE OR DELETE ON career_relation_role_tasks FOR EACH ROW EXECUTE FUNCTION rel_task_guard(); END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'rel_ledger_guard' AND tgrelid = 'career_relation_call_ledger'::regclass) THEN
      CREATE TRIGGER rel_ledger_guard BEFORE UPDATE OR DELETE ON career_relation_call_ledger FOR EACH ROW EXECUTE FUNCTION rel_ledger_guard(); END IF;
  END $$`,
  ...PROVIDER_CALL_GUARD_DDL
] as const;

const sha = (value: string) => createHash("sha256").update(value, "utf8").digest("hex");

/** Investigation id and idempotency key from what makes two submits the same (spec §4). */
export function investigationIdentity(input: { analysisId: string; engineVersionHash: string; uploads: Array<{ jobPoolUploadId: string; canonicalSha256: string }>; roleKeys: Array<{ jobPoolUploadId: string; poolRoleId: string }>; clientRequestId: string }) {
  const idempotencyKey = sha(canonicalJson({ analysis: input.analysisId, engine: input.engineVersionHash,
    uploads: [...input.uploads].sort((a, b) => a.jobPoolUploadId.localeCompare(b.jobPoolUploadId)),
    roles: [...input.roleKeys].sort((a, b) => `${a.jobPoolUploadId}\u0000${a.poolRoleId}`.localeCompare(`${b.jobPoolUploadId}\u0000${b.poolRoleId}`)), client: input.clientRequestId }));
  return { idempotencyKey, investigationId: `RINV_${idempotencyKey.slice(0, 32).toUpperCase()}` };
}

export type InvestigationStatus = "PLANNED" | "RUNNING" | "COMPLETED" | "PARTIAL" | "INTERRUPTED" | "FAILED";
export type TaskStatus = "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED" | "BUDGET_EXHAUSTED" | "INTERRUPTED" | "CANCELLED" | "CACHED";
const ALLOWED_TASK: Record<TaskStatus, TaskStatus[]> = {
  PENDING: ["RUNNING", "CACHED", "CANCELLED"], RUNNING: ["SUCCEEDED", "FAILED", "BUDGET_EXHAUSTED", "INTERRUPTED"],
  SUCCEEDED: [], FAILED: [], BUDGET_EXHAUSTED: [], INTERRUPTED: [], CANCELLED: [], CACHED: []
};

export class PostgresInvestigationStore {
  constructor(private readonly sql: Sql) {}

  /** Creates the investigation and its pending tasks once; a repeated submit returns the stored one (idempotent), never a second. */
  async open(input: { investigationId: string; idempotencyKey: string; analysisId: string; engineVersionHash: string; provider: string; request: unknown; tasks: Array<{ jobPoolUploadId: string; poolRoleId: string; pairs: number }>; now: string }): Promise<{ created: boolean; investigationId: string; status: InvestigationStatus }> {
    return this.sql.begin(async tx => {
      const inserted = await tx<{ investigation_id: string }[]>`
        INSERT INTO career_relation_investigations (investigation_id, idempotency_key, analysis_id, engine_version_hash, provider, request_json, status, created_at, updated_at)
        VALUES (${input.investigationId}, ${input.idempotencyKey}, ${input.analysisId}, ${input.engineVersionHash}, ${input.provider}, ${canonicalJson(input.request)}, 'PLANNED', ${input.now}, ${input.now})
        ON CONFLICT (idempotency_key) DO NOTHING RETURNING investigation_id`;
      if (inserted.length === 0) {
        const [existing] = await tx<{ investigation_id: string; status: InvestigationStatus }[]>`SELECT investigation_id, status FROM career_relation_investigations WHERE idempotency_key = ${input.idempotencyKey}`;
        return { created: false, investigationId: existing.investigation_id, status: existing.status };
      }
      for (const task of input.tasks) await tx`INSERT INTO career_relation_role_tasks (investigation_id, job_pool_upload_id, pool_role_id, status, pairs, updated_at) VALUES (${input.investigationId}, ${task.jobPoolUploadId}, ${task.poolRoleId}, 'PENDING', ${task.pairs}, ${input.now})`;
      return { created: true, investigationId: input.investigationId, status: "PLANNED" as const };
    });
  }

  /** Forward-only task transition; a step that is not allowed (or races with another) throws and changes nothing. */
  async moveTask(input: { investigationId: string; jobPoolUploadId: string; poolRoleId: string; from: TaskStatus; to: TaskStatus; errorCode?: string | null; refusals?: unknown; stored?: number; now: string }): Promise<void> {
    if (!ALLOWED_TASK[input.from].includes(input.to)) throw new Error(`ERR_INVESTIGATION_TASK_TRANSITION:${input.from}->${input.to}`);
    const rows = await this.sql<{ pool_role_id: string }[]>`
      UPDATE career_relation_role_tasks SET status = ${input.to}, error_code = ${input.errorCode ?? null}, refusals_json = ${input.refusals === undefined ? null : canonicalJson(input.refusals)}, stored = ${input.stored ?? 0}, updated_at = ${input.now}
      WHERE investigation_id = ${input.investigationId} AND job_pool_upload_id = ${input.jobPoolUploadId} AND pool_role_id = ${input.poolRoleId} AND status = ${input.from} RETURNING pool_role_id`;
    if (rows.length !== 1) throw new Error("ERR_INVESTIGATION_TASK_STATE_CONFLICT");
  }

  /** Forward only (PINK D-LED-1): PLANNED → RUNNING | FAILED | INTERRUPTED; RUNNING → a terminal state. Anything else throws. */
  async setStatus(investigationId: string, status: InvestigationStatus, now: string): Promise<void> {
    const from: Record<InvestigationStatus, InvestigationStatus[]> = { PLANNED: [], RUNNING: ["PLANNED"], COMPLETED: ["RUNNING"], PARTIAL: ["RUNNING"], INTERRUPTED: ["PLANNED", "RUNNING"], FAILED: ["PLANNED", "RUNNING"] };
    const rows = await this.sql<{ investigation_id: string }[]>`UPDATE career_relation_investigations SET status = ${status}, updated_at = ${now} WHERE investigation_id = ${investigationId} AND status = ANY(${from[status]}) RETURNING investigation_id`;
    if (rows.length !== 1) throw new Error("ERR_INVESTIGATION_STATUS_CONFLICT");
  }

  async investigation(investigationId: string): Promise<{ investigationId: string; analysisId: string; provider: string; engineVersionHash: string; status: InvestigationStatus; createdAt: string; updatedAt: string } | null> {
    const [r] = await this.sql<{ investigation_id: string; analysis_id: string; provider: string; engine_version_hash: string; status: InvestigationStatus; created_at: string; updated_at: string }[]>`SELECT investigation_id, analysis_id, provider, engine_version_hash, status, created_at, updated_at FROM career_relation_investigations WHERE investigation_id = ${investigationId}`;
    return r ? { investigationId: r.investigation_id, analysisId: r.analysis_id, provider: r.provider, engineVersionHash: r.engine_version_hash, status: r.status, createdAt: r.created_at, updatedAt: r.updated_at } : null;
  }

  /** The latest investigation an automatic run started for this analysis, with its stored request and lease (read only; a table registered before the lease columns existed reads them as absent). */
  async latestAutomatic(analysisId: string): Promise<AutomaticRunRow | null> {
    const [r] = await this.sql<AutomaticRunRaw[]>`SELECT investigation_id, analysis_id, provider, status, created_at, updated_at, request_json, to_jsonb(i)->>'lease_owner' AS lease_owner, to_jsonb(i)->>'lease_expires_at' AS lease_expires_at
      FROM career_relation_investigations i WHERE analysis_id = ${analysisId} AND request_json::jsonb @> '{"auto": true}'::jsonb ORDER BY created_at DESC, investigation_id DESC LIMIT 1`;
    return r ? automaticRow(r) : null;
  }

  /** Automatic runs nobody is running any more: PLANNED/RUNNING whose lease ran out (a run without a lease: no sign of life since `legacyBefore`). */
  async abandonedAutomatic(now: string, legacyBefore: string): Promise<AutomaticRunRow[]> {
    const rows = await this.sql<AutomaticRunRaw[]>`SELECT investigation_id, analysis_id, provider, status, created_at, updated_at, request_json, to_jsonb(i)->>'lease_owner' AS lease_owner, to_jsonb(i)->>'lease_expires_at' AS lease_expires_at
      FROM career_relation_investigations i WHERE status IN ('PLANNED','RUNNING') AND request_json::jsonb @> '{"auto": true}'::jsonb
        AND (CASE WHEN to_jsonb(i)->>'lease_expires_at' IS NOT NULL THEN to_jsonb(i)->>'lease_expires_at' < ${now} ELSE updated_at < ${legacyBefore} END) ORDER BY created_at, investigation_id`;
    return rows.map(automaticRow);
  }

  /** Terminal automatic runs that may be continued (PARTIAL/FAILED/INTERRUPTED, marked resumable), newest first, finished before `before`. */
  async resumableAutomatic(before: string): Promise<AutomaticRunRow[]> {
    const rows = await this.sql<AutomaticRunRaw[]>`SELECT investigation_id, analysis_id, provider, status, created_at, updated_at, request_json, to_jsonb(i)->>'lease_owner' AS lease_owner, to_jsonb(i)->>'lease_expires_at' AS lease_expires_at
      FROM career_relation_investigations i WHERE status IN ('PARTIAL','FAILED','INTERRUPTED') AND request_json::jsonb @> '{"auto": true, "resumable": true}'::jsonb AND updated_at < ${before} ORDER BY created_at, investigation_id`;
    return rows.map(automaticRow);
  }

  /** Takes (or renews) the lease of a PLANNED/RUNNING run: the one holder, or anyone once it ran out. False = somebody else holds it. */
  async takeLease(investigationId: string, owner: string, expiresAt: string, now: string): Promise<boolean> {
    const rows = await this.sql`UPDATE career_relation_investigations SET lease_owner = ${owner}, lease_expires_at = ${expiresAt}, heartbeat_at = ${now}
      WHERE investigation_id = ${investigationId} AND status IN ('PLANNED','RUNNING') AND (lease_owner IS NULL OR lease_owner = ${owner} OR lease_expires_at < ${now}) RETURNING investigation_id`;
    return rows.length === 1;
  }

  /** Marks a run nobody runs any more INTERRUPTED; only the worker whose conditional update matches wins (race-free take-over). */
  async interruptAbandoned(investigationId: string, now: string, legacyBefore: string): Promise<boolean> {
    return this.sql.begin(async tx => {
      const rows = await tx`UPDATE career_relation_investigations SET status = 'INTERRUPTED', updated_at = ${now}
        WHERE investigation_id = ${investigationId} AND status IN ('PLANNED','RUNNING')
          AND (CASE WHEN lease_expires_at IS NOT NULL THEN lease_expires_at < ${now} ELSE updated_at < ${legacyBefore} END) RETURNING investigation_id`;
      if (rows.length !== 1) return false;
      // What the lost worker left open is closed forward-only: the task it was working on, and the ones it never reached.
      await tx`UPDATE career_relation_role_tasks SET status = 'INTERRUPTED', error_code = 'ERR_WORKER_LOST', updated_at = ${now} WHERE investigation_id = ${investigationId} AND status = 'RUNNING'`;
      await tx`UPDATE career_relation_role_tasks SET status = 'CANCELLED', updated_at = ${now} WHERE investigation_id = ${investigationId} AND status = 'PENDING'`;
      return true;
    });
  }

  /** The newest sign of progress of a run: its last task movement or status change. */
  async lastProgressAt(investigationId: string): Promise<string | null> {
    const [r] = await this.sql<{ t: string | null }[]>`SELECT GREATEST((SELECT max(updated_at) FROM career_relation_role_tasks WHERE investigation_id = ${investigationId}), (SELECT updated_at FROM career_relation_investigations WHERE investigation_id = ${investigationId})) AS t`;
    return r?.t ?? null;
  }

  async tasks(investigationId: string): Promise<Array<{ jobPoolUploadId: string; poolRoleId: string; status: TaskStatus; errorCode: string | null; pairs: number; stored: number }>> {
    const rows = await this.sql<{ job_pool_upload_id: string; pool_role_id: string; status: TaskStatus; error_code: string | null; pairs: number; stored: number }[]>`SELECT job_pool_upload_id, pool_role_id, status, error_code, pairs, stored FROM career_relation_role_tasks WHERE investigation_id = ${investigationId} ORDER BY job_pool_upload_id, pool_role_id`;
    return rows.map(r => ({ jobPoolUploadId: r.job_pool_upload_id, poolRoleId: r.pool_role_id, status: r.status, errorCode: r.error_code, pairs: r.pairs, stored: r.stored }));
  }
}

export interface AutomaticRunRow { investigationId: string; analysisId: string; provider: string; status: InvestigationStatus; createdAt: string; updatedAt: string; request: Record<string, unknown>; leaseOwner: string | null; leaseExpiresAt: string | null }
interface AutomaticRunRaw { investigation_id: string; analysis_id: string; provider: string; status: InvestigationStatus; created_at: string; updated_at: string; request_json: string; lease_owner: string | null; lease_expires_at: string | null }
function automaticRow(r: AutomaticRunRaw): AutomaticRunRow {
  let request: Record<string, unknown>;
  try { request = JSON.parse(r.request_json) as Record<string, unknown>; } catch { request = {}; }
  return { investigationId: r.investigation_id, analysisId: r.analysis_id, provider: r.provider, status: r.status, createdAt: r.created_at, updatedAt: r.updated_at, request, leaseOwner: r.lease_owner, leaseExpiresAt: r.lease_expires_at };
}

/** A run holds its lease for this long and renews it by heartbeat; a holder that stops renewing (dead worker) loses it. */
export const RUN_LEASE_MS = 90_000;
export const RUN_HEARTBEAT_MS = 20_000;

class LedgerRefused extends Error {}

/** The call ledger: one reservation takes one unit from the day scope of the provider AND from the investigation, atomically. */
export class PostgresCallLedger implements CallLedger {
  constructor(private readonly sql: Sql, private readonly scope: { investigationId: string; provider: string; day: string; dayLimit: number; investigationLimit: number }) {}
  private get keys() { return { day: `DAY:${this.scope.provider}:${this.scope.day}`, inv: `INV:${this.scope.investigationId}` }; }

  async reserve(): Promise<boolean> {
    const { day, inv } = this.keys;
    // The configured limit of today is the latest one, never below what is already outstanding (PINK O-LED-1: lowering takes effect).
    // Its own statement: it must be committed even when the reservation below is refused.
    await this.sql`INSERT INTO career_relation_call_ledger (scope_key, limit_units) VALUES (${day}, ${this.scope.dayLimit})
      ON CONFLICT (scope_key) DO UPDATE SET limit_units = GREATEST(EXCLUDED.limit_units, career_relation_call_ledger.reserved - career_relation_call_ledger.released)`;
    try {
      await this.sql.begin(async tx => {
        await tx`INSERT INTO career_relation_call_ledger (scope_key, limit_units) VALUES (${inv}, ${this.scope.investigationLimit}) ON CONFLICT (scope_key) DO NOTHING`;
        for (const key of [day, inv]) {
          const rows = await tx<{ scope_key: string }[]>`UPDATE career_relation_call_ledger SET reserved = reserved + 1 WHERE scope_key = ${key} AND reserved - released < limit_units RETURNING scope_key`;
          if (rows.length === 0) throw new LedgerRefused();
        }
      });
      return true;
    } catch (error) { if (error instanceof LedgerRefused) return false; throw error; }
  }
  /** Marks one of THIS investigation's outstanding reservations as consumed; without one it throws (PINK D-LED-2). */
  async consume(meta: { requestBytes: number; responseBytes: number }): Promise<void> {
    const { day, inv } = this.keys;
    await this.sql.begin(async tx => {
      const own = await tx<{ scope_key: string }[]>`UPDATE career_relation_call_ledger SET consumed = consumed + 1, request_bytes = request_bytes + ${meta.requestBytes}, response_bytes = response_bytes + ${meta.responseBytes} WHERE scope_key = ${inv} AND reserved - released - consumed > 0 RETURNING scope_key`;
      if (own.length === 0) throw new Error("ERR_LEDGER_NO_RESERVATION");
      await tx`UPDATE career_relation_call_ledger SET consumed = consumed + 1, request_bytes = request_bytes + ${meta.requestBytes}, response_bytes = response_bytes + ${meta.responseBytes} WHERE scope_key = ${day}`;
    });
  }
  /** Releases one of THIS investigation's unconsumed reservations from both scopes; never a unit of another investigation. */
  async release(): Promise<void> {
    const { day, inv } = this.keys;
    await this.sql.begin(async tx => {
      const own = await tx<{ scope_key: string }[]>`UPDATE career_relation_call_ledger SET released = released + 1 WHERE scope_key = ${inv} AND reserved - released - consumed > 0 RETURNING scope_key`;
      if (own.length === 0) throw new Error("ERR_LEDGER_NO_RESERVATION");
      await tx`UPDATE career_relation_call_ledger SET released = released + 1 WHERE scope_key = ${day}`;
    });
  }
}
