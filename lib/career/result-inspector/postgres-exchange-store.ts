import { sql } from "drizzle-orm";
import { db } from "../db/client";
import { verifyDisposableTestDatabase } from "../../database-isolation/verification";
import { createRegistrationClient } from "../../persistence/registration-client";
import type { CapabilityProviderExchangeRecord, CapabilityProviderRequestIdentity, CapabilityProviderResponseRecord } from "../capability-core";
import { currentExchangeAttempt } from "./attempt";
import { exchangeRetentionMs, newExchangeId, type ProviderExchangeStore, type ProviderExchangeStoreOptions, type RetainedProviderExchange } from "./retention";

/**
 * Bounded PostgreSQL archive of received Discovery exchanges, successful and failed (Result Inspector, owner GO
 * 2026-10-15 "EXCHANGE ARCHIVE"). Its own table, so the immutable capability runs never hold raw responses. Every row
 * carries expires_at; expired rows are deleted on every write and read and are never returned. Texts are TEXT columns,
 * stored exactly as received. At most one COMPLETED row per RUN_ id (partial unique index).
 *
 * Opt-in: CONDYN_GEMINI_EXCHANGE_ARCHIVE=1. The DDL runs only after the database URL is positively verified as a
 * disposable test database (same gate as the job pool, B-ENTRY); on any other database no table is created and the
 * archive is unavailable, so the inspector reports NOT_RETAINED. No productive database is touched.
 */
export const EXCHANGE_ARCHIVE_FLAG = "CONDYN_GEMINI_EXCHANGE_ARCHIVE";

const DDL = [
  `CREATE TABLE IF NOT EXISTS career_gemini_provider_exchanges (
    exchange_id TEXT PRIMARY KEY,
    run_id TEXT NOT NULL,
    outcome TEXT NOT NULL CHECK (outcome IN ('COMPLETED', 'FAILED')),
    error_code TEXT,
    job_id TEXT,
    lease_version INTEGER,
    request JSONB NOT NULL,
    scope_hash TEXT,
    scope_text TEXT,
    response_text TEXT,
    response_meta JSONB NOT NULL,
    retained_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    CHECK ((outcome = 'COMPLETED') = (error_code IS NULL)),
    CHECK ((scope_hash IS NULL) = (scope_text IS NULL)),
    CHECK (expires_at > retained_at)
  )`,
  "CREATE UNIQUE INDEX IF NOT EXISTS career_gemini_provider_exchanges_completed_run_idx ON career_gemini_provider_exchanges (run_id) WHERE outcome = 'COMPLETED'",
  "CREATE INDEX IF NOT EXISTS career_gemini_provider_exchanges_job_idx ON career_gemini_provider_exchanges (job_id)",
  "CREATE INDEX IF NOT EXISTS career_gemini_provider_exchanges_expires_at_idx ON career_gemini_provider_exchanges (expires_at)"
];

type Registration = "REGISTERED" | "NO_DDL_ON_NON_DISPOSABLE_DATABASE";
const registrations = new Map<string, Promise<Registration>>();

/** Creates the archive table on a verified disposable database only; the verdict is cached per database URL. */
export function ensureProviderExchangeArchive(url: string | undefined = process.env.DATABASE_URL): Promise<Registration> {
  const key = url ?? "";
  let registration = registrations.get(key);
  if (!registration) {
    registration = (async (): Promise<Registration> => {
      const verified = await verifyDisposableTestDatabase(url).then(result => result, () => null);
      if (verified === null) return "NO_DDL_ON_NON_DISPOSABLE_DATABASE";
      const client = createRegistrationClient(verified.url);
      try { for (const statement of DDL) await client.unsafe(statement); } finally { await client.end({ timeout: 5 }); }
      return "REGISTERED";
    })().catch(error => { registrations.delete(key); throw error; });
    registrations.set(key, registration);
  }
  return registration;
}

/** The archive for this process, or null when switched off or not provisioned (no DDL outside disposable databases). */
export async function providerExchangeArchiveFromEnvironment(environment: Record<string, string | undefined> = process.env): Promise<PostgresProviderExchangeStore | null> {
  if (environment[EXCHANGE_ARCHIVE_FLAG] !== "1") return null;
  return await ensureProviderExchangeArchive(environment.DATABASE_URL) === "REGISTERED" ? new PostgresProviderExchangeStore({ retentionMs: exchangeRetentionMs(environment) }) : null;
}

type Row = {
  exchange_id: string; run_id: string; outcome: "COMPLETED" | "FAILED"; error_code: string | null; job_id: string | null; lease_version: number | null;
  request: CapabilityProviderRequestIdentity; scope_hash: string | null; scope_text: string | null; response_text: string | null;
  response_meta: Omit<CapabilityProviderResponseRecord, "text">; retained_at: string; expires_at: string;
};
const ISO = (column: string) => sql.raw(`to_char(${column} AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`);
const COLUMNS = sql`exchange_id, run_id, outcome, error_code, job_id, lease_version, request, scope_hash, scope_text, response_text, response_meta, ${ISO("retained_at")} AS retained_at, ${ISO("expires_at")} AS expires_at`;

function exchangeOf(row: Row): RetainedProviderExchange {
  return {
    exchangeId: row.exchange_id, runId: row.run_id, outcome: row.outcome, errorCode: row.error_code,
    attempt: row.job_id === null ? null : { jobId: row.job_id, leaseVersion: row.lease_version },
    request: row.request,
    investigationScope: row.scope_hash === null || row.scope_text === null ? null : { scopeHash: row.scope_hash, text: row.scope_text },
    response: { ...row.response_meta, text: row.response_text },
    retainedAt: row.retained_at, expiresAt: row.expires_at
  };
}

export class PostgresProviderExchangeStore implements ProviderExchangeStore {
  private readonly retentionMs: number;
  private readonly now: () => Date;
  constructor(options: ProviderExchangeStoreOptions = {}, private readonly database = db) {
    this.retentionMs = options.retentionMs ?? exchangeRetentionMs();
    this.now = options.now ?? (() => new Date());
  }
  async retain(record: CapabilityProviderExchangeRecord): Promise<void> {
    await this.purgeExpired();
    const retainedAt = this.now();
    const attempt = currentExchangeAttempt();
    const { text, ...meta } = record.response;
    // One COMPLETED exchange per RUN_ id: a second one (never expected) is ignored, never replaces the first.
    await this.database.execute(sql`INSERT INTO career_gemini_provider_exchanges (exchange_id, run_id, outcome, error_code, job_id, lease_version, request, scope_hash, scope_text, response_text, response_meta, retained_at, expires_at)
      VALUES (${newExchangeId()}, ${record.runId}, ${record.outcome}, ${record.errorCode}, ${attempt?.jobId ?? null}, ${attempt?.leaseVersion ?? null}, ${JSON.stringify(record.request)}::jsonb,
        ${record.investigationScope?.scopeHash ?? null}, ${record.investigationScope?.text ?? null}, ${text}, ${JSON.stringify(meta)}::jsonb,
        ${retainedAt.toISOString()}, ${new Date(retainedAt.getTime() + this.retentionMs).toISOString()})
      ON CONFLICT DO NOTHING`);
  }
  async completedForRun(runId: string): Promise<RetainedProviderExchange[]> {
    await this.purgeExpired();
    const rows = await this.database.execute(sql`SELECT ${COLUMNS} FROM career_gemini_provider_exchanges WHERE run_id = ${runId} AND outcome = 'COMPLETED' AND expires_at > ${this.now().toISOString()}`) as unknown as Row[];
    return rows.map(exchangeOf);
  }
  async forJob(jobId: string): Promise<RetainedProviderExchange[]> {
    await this.purgeExpired();
    const rows = await this.database.execute(sql`SELECT ${COLUMNS} FROM career_gemini_provider_exchanges WHERE job_id = ${jobId} AND expires_at > ${this.now().toISOString()} ORDER BY retained_at, exchange_id`) as unknown as Row[];
    return rows.map(exchangeOf);
  }
  async delete(exchangeId: string): Promise<boolean> {
    const rows = await this.database.execute(sql`DELETE FROM career_gemini_provider_exchanges WHERE exchange_id = ${exchangeId} RETURNING exchange_id`) as unknown as unknown[];
    return rows.length > 0;
  }
  async purgeExpired(): Promise<number> {
    const rows = await this.database.execute(sql`DELETE FROM career_gemini_provider_exchanges WHERE expires_at <= ${this.now().toISOString()} RETURNING exchange_id`) as unknown as unknown[];
    return rows.length;
  }
}
