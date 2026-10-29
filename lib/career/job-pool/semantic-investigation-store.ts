import { createHash } from "node:crypto";
import type { Sql } from "postgres";
import type { CallLedger } from "./semantic-relation-engine";
import { canonicalJson } from "./relation-cache";

/**
 * Persistence of explicit semantic investigations (stage 3, spec §6): the investigation (idempotent by key), its role tasks and the
 * call ledger. Registered in the same guarded, transactional registration as the relation cache (disposable databases only).
 * Statuses move forward only; nothing is deleted. The ledger reserves a call atomically against BOTH limits (day per provider and
 * investigation) before anything is sent; a day limit of 0 means nothing runs (the default for real providers).
 */
export const INVESTIGATION_TABLES = ["career_relation_investigations", "career_relation_role_tasks", "career_relation_call_ledger"] as const;

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
  )`
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

  async setStatus(investigationId: string, status: InvestigationStatus, now: string): Promise<void> {
    await this.sql`UPDATE career_relation_investigations SET status = ${status}, updated_at = ${now} WHERE investigation_id = ${investigationId}`;
  }

  async tasks(investigationId: string): Promise<Array<{ jobPoolUploadId: string; poolRoleId: string; status: TaskStatus; errorCode: string | null; pairs: number; stored: number }>> {
    const rows = await this.sql<{ job_pool_upload_id: string; pool_role_id: string; status: TaskStatus; error_code: string | null; pairs: number; stored: number }[]>`SELECT job_pool_upload_id, pool_role_id, status, error_code, pairs, stored FROM career_relation_role_tasks WHERE investigation_id = ${investigationId} ORDER BY job_pool_upload_id, pool_role_id`;
    return rows.map(r => ({ jobPoolUploadId: r.job_pool_upload_id, poolRoleId: r.pool_role_id, status: r.status, errorCode: r.error_code, pairs: r.pairs, stored: r.stored }));
  }
}

class LedgerRefused extends Error {}

/** The call ledger: one reservation takes one unit from the day scope of the provider AND from the investigation, atomically. */
export class PostgresCallLedger implements CallLedger {
  constructor(private readonly sql: Sql, private readonly scope: { investigationId: string; provider: string; day: string; dayLimit: number; investigationLimit: number }) {}
  private get keys() { return { day: `DAY:${this.scope.provider}:${this.scope.day}`, inv: `INV:${this.scope.investigationId}` }; }

  async reserve(): Promise<boolean> {
    const { day, inv } = this.keys;
    try {
      await this.sql.begin(async tx => {
        await tx`INSERT INTO career_relation_call_ledger (scope_key, limit_units) VALUES (${day}, ${this.scope.dayLimit}) ON CONFLICT (scope_key) DO NOTHING`;
        await tx`INSERT INTO career_relation_call_ledger (scope_key, limit_units) VALUES (${inv}, ${this.scope.investigationLimit}) ON CONFLICT (scope_key) DO NOTHING`;
        for (const key of [day, inv]) {
          const rows = await tx<{ scope_key: string }[]>`UPDATE career_relation_call_ledger SET reserved = reserved + 1 WHERE scope_key = ${key} AND reserved - released < limit_units RETURNING scope_key`;
          if (rows.length === 0) throw new LedgerRefused();
        }
      });
      return true;
    } catch (error) { if (error instanceof LedgerRefused) return false; throw error; }
  }
  async consume(meta: { requestBytes: number; responseBytes: number }): Promise<void> {
    const { day, inv } = this.keys;
    await this.sql`UPDATE career_relation_call_ledger SET consumed = consumed + 1, request_bytes = request_bytes + ${meta.requestBytes}, response_bytes = response_bytes + ${meta.responseBytes} WHERE scope_key IN (${day}, ${inv})`;
  }
  async release(): Promise<void> {
    const { day, inv } = this.keys;
    await this.sql`UPDATE career_relation_call_ledger SET released = released + 1 WHERE scope_key IN (${day}, ${inv}) AND released < reserved`;
  }
}
