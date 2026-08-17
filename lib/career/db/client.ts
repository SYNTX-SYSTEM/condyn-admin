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

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/condyn";

// Singleton connection client for serverless Next.js environment safety
const sql = postgres(connectionString, { max: 10 });
export const db = drizzle(sql, { schema });

/**
 * Ensures the `career_analyses` table exists in PostgreSQL without requiring manual migration steps during testing or dev.
 * Automatically creates the target database if it does not exist yet (error 3D000).
 */
export async function initDbSchema(): Promise<void> {
  const runQueries = async (targetSql: postgres.Sql) => {
    const tableQueries = [
      targetSql`CREATE TABLE IF NOT EXISTS career_analyses (
        analysis_id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        validation_state TEXT NOT NULL,
        overall_confidence REAL,
        payload JSONB NOT NULL
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
      );`
    ];
    for (const q of tableQueries) {
      await q;
    }
  };

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
