/**
 * CONDYN CAREER ANALYSIS PROTOCOL v1.0
 * DRIZZLE DATABASE CLIENT & CONNECTION POOL (`lib/career/db/client.ts`)
 * 
 * Status: Phase 10 Implemented / Zero Client Leakage
 * Scope: Manages server-side PostgreSQL connection via Drizzle ORM and automatic table schema init.
 */

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
import { initT11ProductionPersistenceSchema } from "./t11-persistence-schema";
import { initCanonicalSilReadLineageSchema } from "../sil-projection/persistence-schema";

import { resolveApplicationDatabaseUrl } from "../../database-isolation/policy";
import { createNoticeForwarder } from "./notice-filter";

/**
 * No fallback to any real database (database isolation mandate, 2026-10-10): a missing
 * DATABASE_URL resolves to an unroutable `.invalid` host. A protected database name (condyn,
 * postgres, template*) resolves to the same host unless a real server or worker sets
 * CONDYN_ALLOW_SHARED_DATABASE=1 outside any test runner. Queries fail closed.
 */
const connectionString = resolveApplicationDatabaseUrl(
  process.env.DATABASE_URL,
  process.env.VITEST !== undefined || process.env.VITEST_WORKER_ID !== undefined,
  process.env.CONDYN_ALLOW_SHARED_DATABASE
);

// Singleton connection client for serverless Next.js environment safety
const sql = postgres(connectionString, { max: 10, onnotice: createNoticeForwarder() });
export const db = drizzle(sql, { schema });

/**
 * Applies the complete Career-field DDL (analysis, capability, legacy lifecycle,
 * jobs, T11 canonical chain, SIL lineage) to the supplied client. Startup-only;
 * request handling never creates tables.
 */
export async function applyCareerDbSchema(targetSql: postgres.Sql): Promise<void> {
    const tableQueries = [
      targetSql`CREATE TABLE IF NOT EXISTS career_analyses (
        analysis_id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        validation_state TEXT NOT NULL,
        overall_confidence REAL,
        payload JSONB NOT NULL
      );`,
      targetSql`CREATE TABLE IF NOT EXISTS career_capability_runs (
        run_id TEXT PRIMARY KEY,
        source_bundle_hash TEXT NOT NULL,
        kernel_version TEXT NOT NULL,
        prompt_checksum TEXT NOT NULL,
        provider TEXT NOT NULL,
        model TEXT NOT NULL,
        schema_version TEXT NOT NULL,
        status TEXT NOT NULL,
        raw_output_hash TEXT,
        payload JSONB NOT NULL,
        created_at TEXT NOT NULL,
        completed_at TEXT
      );`,
      targetSql`CREATE TABLE IF NOT EXISTS career_capability_snapshots (
        snapshot_id TEXT PRIMARY KEY,
        snapshot_key TEXT UNIQUE NOT NULL,
        source_bundle_hash TEXT NOT NULL,
        kernel_version TEXT NOT NULL,
        prompt_checksum TEXT NOT NULL,
        provider TEXT NOT NULL,
        model TEXT NOT NULL,
        schema_version TEXT NOT NULL,
        status TEXT NOT NULL,
        payload JSONB NOT NULL,
        created_at TEXT NOT NULL
      );`,
      targetSql`CREATE TABLE IF NOT EXISTS career_recommendations (
        id TEXT PRIMARY KEY,
        payload_hash TEXT NOT NULL,
        payload JSONB NOT NULL
      );`,
      targetSql`CREATE TABLE IF NOT EXISTS career_decisions (
        id TEXT PRIMARY KEY,
        recommendation_id TEXT NOT NULL REFERENCES career_recommendations(id),
        timestamp TEXT NOT NULL,
        actor TEXT NOT NULL,
        payload_hash TEXT NOT NULL,
        payload JSONB NOT NULL
      );`,
      targetSql`CREATE TABLE IF NOT EXISTS career_commitments (
        id TEXT PRIMARY KEY,
        decision_id TEXT NOT NULL REFERENCES career_decisions(id),
        timestamp TEXT NOT NULL,
        actor TEXT NOT NULL,
        payload_hash TEXT NOT NULL,
        payload JSONB NOT NULL
      );`,
      targetSql`CREATE TABLE IF NOT EXISTS career_actions (
        id TEXT PRIMARY KEY,
        commitment_id TEXT NOT NULL REFERENCES career_commitments(id),
        timestamp TEXT NOT NULL,
        actor TEXT NOT NULL,
        payload_hash TEXT NOT NULL,
        payload JSONB NOT NULL
      );`,
      targetSql`CREATE TABLE IF NOT EXISTS career_outcomes (
        id TEXT PRIMARY KEY,
        action_id TEXT NOT NULL REFERENCES career_actions(id),
        timestamp TEXT NOT NULL,
        observer TEXT NOT NULL,
        payload_hash TEXT NOT NULL,
        payload JSONB NOT NULL
      );`,
      targetSql`CREATE TABLE IF NOT EXISTS career_feedback (
        id TEXT PRIMARY KEY,
        outcome_id TEXT NOT NULL REFERENCES career_outcomes(id),
        timestamp TEXT NOT NULL,
        actor TEXT NOT NULL,
        payload_hash TEXT NOT NULL,
        payload JSONB NOT NULL
      );`,
      targetSql`CREATE TABLE IF NOT EXISTS career_attributions (
        id TEXT PRIMARY KEY,
        feedback_id TEXT NOT NULL REFERENCES career_feedback(id),
        timestamp TEXT NOT NULL,
        actor TEXT NOT NULL,
        payload_hash TEXT NOT NULL,
        payload JSONB NOT NULL
      );`,
      targetSql`CREATE TABLE IF NOT EXISTS career_policy_versions (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        payload_hash TEXT NOT NULL,
        payload JSONB NOT NULL
      );`,
      targetSql`CREATE TABLE IF NOT EXISTS career_policy_families (
        id TEXT PRIMARY KEY,
        active_policy_version_id TEXT NOT NULL REFERENCES career_policy_versions(id),
        revision INTEGER NOT NULL
      );`,
      targetSql`CREATE TABLE IF NOT EXISTS career_policy_promotions (
        id TEXT PRIMARY KEY,
        policy_family_id TEXT NOT NULL REFERENCES career_policy_families(id),
        candidate_policy_id TEXT NOT NULL REFERENCES career_policy_versions(id),
        baseline_policy_id TEXT NOT NULL REFERENCES career_policy_versions(id),
        timestamp TEXT NOT NULL,
        payload_hash TEXT NOT NULL,
        payload JSONB NOT NULL
      );`,
      targetSql`CREATE TABLE IF NOT EXISTS career_learning_proposals (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        actor TEXT NOT NULL,
        payload_hash TEXT NOT NULL,
        payload JSONB NOT NULL
      );`,
      targetSql`CREATE TABLE IF NOT EXISTS career_policy_evaluations (
        id TEXT PRIMARY KEY,
        proposal_id TEXT NOT NULL REFERENCES career_learning_proposals(id),
        candidate_policy_id TEXT NOT NULL REFERENCES career_policy_versions(id),
        baseline_policy_id TEXT NOT NULL REFERENCES career_policy_versions(id),
        timestamp TEXT NOT NULL,
        payload_hash TEXT NOT NULL,
        payload JSONB NOT NULL
      );`,
      targetSql`CREATE TABLE IF NOT EXISTS career_analysis_jobs (
        job_id TEXT PRIMARY KEY,
        job_type TEXT NOT NULL,
        status TEXT NOT NULL,
        idempotency_key TEXT UNIQUE,
        input_ref JSONB NOT NULL,
        attempt_count INTEGER NOT NULL DEFAULT 0,
        current_operation TEXT,
        result_analysis_id TEXT REFERENCES career_analyses(analysis_id),
        error_code TEXT,
        error_summary TEXT,
        created_at TEXT NOT NULL,
        started_at TEXT,
        completed_at TEXT,
        lease_owner TEXT,
        lease_expires_at TEXT,
        lease_version INTEGER NOT NULL DEFAULT 0,
        heartbeat_at TEXT
      );`,
      targetSql`ALTER TABLE career_analysis_jobs ADD COLUMN IF NOT EXISTS current_operation TEXT;`,
      // F11 lineage is a physical, immutable foreign-key relation. The table
      // records exact technical provenance only; it does not publish authority.
      targetSql`CREATE TABLE IF NOT EXISTS career_capability_proposal_projection_references (
        analysis_id TEXT PRIMARY KEY REFERENCES career_analyses(analysis_id) ON DELETE CASCADE,
        job_id TEXT UNIQUE NOT NULL REFERENCES career_analysis_jobs(job_id) ON DELETE CASCADE,
        discovery_run_id TEXT NOT NULL REFERENCES career_capability_runs(run_id),
        convergence_run_id TEXT NOT NULL REFERENCES career_capability_runs(run_id),
        candidate_source_bundle_id TEXT,
        source_bundle_hash TEXT NOT NULL,
        created_at TEXT NOT NULL
      );`,
      targetSql`ALTER TABLE career_capability_proposal_projection_references ADD COLUMN IF NOT EXISTS candidate_source_bundle_id TEXT;`,
      // This association has no independent lifecycle: it is technical
      // provenance owned jointly by the persisted analysis and its job.  The
      // cascade preserves referential integrity for historical cleanup without
      // turning the reference into a current/selection pointer.
      targetSql`ALTER TABLE career_capability_proposal_projection_references DROP CONSTRAINT IF EXISTS career_capability_proposal_projection_references_analysis_id_fkey;`,
      targetSql`ALTER TABLE career_capability_proposal_projection_references ADD CONSTRAINT career_capability_proposal_projection_references_analysis_id_fkey FOREIGN KEY (analysis_id) REFERENCES career_analyses(analysis_id) ON DELETE CASCADE;`,
      targetSql`ALTER TABLE career_capability_proposal_projection_references DROP CONSTRAINT IF EXISTS career_capability_proposal_projection_references_job_id_fkey;`,
      targetSql`ALTER TABLE career_capability_proposal_projection_references ADD CONSTRAINT career_capability_proposal_projection_references_job_id_fkey FOREIGN KEY (job_id) REFERENCES career_analysis_jobs(job_id) ON DELETE CASCADE;`,
      targetSql`CREATE TABLE IF NOT EXISTS career_canonical_sil_runtime_associations (
        canonical_sil_runtime_association_id TEXT PRIMARY KEY,
        candidate_source_bundle_id TEXT NOT NULL,
        verified_capability_snapshot_id TEXT NOT NULL,
        organization_relation_id TEXT NOT NULL,
        role_relation_id TEXT NOT NULL,
        tension_state_id TEXT NOT NULL,
        evolution_input_state_id TEXT NOT NULL,
        payload JSONB NOT NULL
      );`
    ];
    for (const q of tableQueries) {
      await q;
    }
    await initT11ProductionPersistenceSchema(targetSql);
    await initCanonicalSilReadLineageSchema(targetSql);
}

/**
 * Ensures the Career schema exists for the singleton connection.
 * Automatically creates the target database if it does not exist yet (error 3D000).
 */
export async function initDbSchema(): Promise<void> {
  const runQueries = applyCareerDbSchema;
  try {
    await runQueries(sql);
  } catch (err: any) {
    if (err.code === "3D000" || (err.message && err.message.includes("does not exist"))) {
      const dbName = connectionString.split("/").pop() || "condyn";
      const adminConnString = connectionString.replace(new RegExp(`/${dbName}$`), "/postgres");
      const adminSql = postgres(adminConnString, { max: 1 });
      try {
        await adminSql.unsafe(`CREATE DATABASE "${dbName}"`);
      } catch (createErr: any) {
        if (createErr.code === "3D000") {
          const t1String = connectionString.replace(new RegExp(`/${dbName}$`), "/template1");
          const t1Sql = postgres(t1String, { max: 1 });
          try { await t1Sql.unsafe(`CREATE DATABASE "${dbName}"`); } catch (e) {} finally { await t1Sql.end(); }
        }
      } finally {
        await adminSql.end();
      }
      // Retry creating table now that database exists
      const retrySql = postgres(connectionString, { max: 1 });
      try {
        await runQueries(retrySql);
      } finally {
        await retrySql.end();
      }
    } else {
      throw err;
    }
  }
}

/**
 * Safely closes active database connection pool.
 */
export async function closeDbConnection(): Promise<void> {
  await sql.end();
}
