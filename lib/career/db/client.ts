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
  const createTableQuery = () => sql`
    CREATE TABLE IF NOT EXISTS career_analyses (
      analysis_id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      validation_state TEXT NOT NULL,
      overall_confidence REAL NOT NULL,
      payload JSONB NOT NULL
    );
  `;

  try {
    await createTableQuery();
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
      await createTableQuery();
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
