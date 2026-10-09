import { drizzle } from "drizzle-orm/postgres-js";
import type { Sql } from "postgres";
import { applyCareerDbSchema } from "../career/db/client";
import {
  careerDecisionContextDecisionRevisionBindingTableName,
  initCareerDecisionContextDecisionRevisionBindingSchema,
} from "../career/relation-adapters/decision-context-decision-revision-binding-persistence";
import { ensureDecisionRuntimePostgresSchema } from "../decision-runtime/composition";

/**
 * One startup registration order for both fields (relation R7). This module is
 * the only place that knows both schemas; neither field kernel imports the
 * other. Request handling never calls it.
 *
 * REGISTRATION != DATA. TABLE EXISTENCE != AUTHORITY.
 */
export const DECISION_CORE_FIELD_TABLES = Object.freeze(["decision_context_revisions"] as const);

export const UNIFIED_REGISTRATION_ORDER = Object.freeze([
  "CAREER_FIELD_SCHEMA",
  "DECISION_CORE_REVISIONS",
  "CAREER_DECISION_CONTEXT_DECISION_REVISION_BINDINGS",
] as const);

export async function registerUnifiedPersistenceSchema(sql: Sql): Promise<readonly string[]> {
  await applyCareerDbSchema(sql);
  await ensureDecisionRuntimePostgresSchema(drizzle(sql) as unknown as Parameters<typeof ensureDecisionRuntimePostgresSchema>[0]);
  await initCareerDecisionContextDecisionRevisionBindingSchema(sql);
  return UNIFIED_REGISTRATION_ORDER;
}

export interface ForeignKeyEdge {
  constraintName: string;
  table: string;
  referencedTable: string;
}

export async function listForeignKeyEdges(sql: Sql): Promise<ForeignKeyEdge[]> {
  const rows = await sql.unsafe(`
    SELECT tc.constraint_name AS constraint_name,
           tc.table_name AS table_name,
           ccu.table_name AS referenced_table
    FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name AND ccu.constraint_schema = tc.constraint_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = current_schema()
  `) as unknown as Array<{ constraint_name: string; table_name: string; referenced_table: string }>;
  return rows.map(row => ({ constraintName: row.constraint_name, table: row.table_name, referencedTable: row.referenced_table }));
}

/** A foreign key whose two sides belong to different fields is a structural law violation. */
export async function assertNoCrossFieldForeignKeys(sql: Sql): Promise<void> {
  const generic = new Set<string>(DECISION_CORE_FIELD_TABLES);
  const edges = await listForeignKeyEdges(sql);
  const crossing = edges.filter(edge => generic.has(edge.table) !== generic.has(edge.referencedTable));
  if (crossing.length > 0) {
    throw new Error(`ERR_PERSISTENCE_CROSS_FIELD_FOREIGN_KEY:${crossing.map(edge => edge.constraintName).sort().join(",")}`);
  }
}

export async function listRegisteredTables(sql: Sql): Promise<readonly string[]> {
  const rows = await sql.unsafe(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = current_schema() AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `) as unknown as Array<{ table_name: string }>;
  return rows.map(row => row.table_name);
}

export { careerDecisionContextDecisionRevisionBindingTableName };
