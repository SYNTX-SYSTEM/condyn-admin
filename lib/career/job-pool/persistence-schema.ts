import { getTableConfig, integer, pgTable, text, type PgTable } from "drizzle-orm/pg-core";
import type { Sql } from "postgres";
import {
  targetRequirementEntityAdmissions,
  targetRequirementRawProviderOutputs,
  targetRequirementReconstructionBatchRuns,
  targetRequirementReconstructionResults
} from "../target-adapters/role-requirement-artifact-persistence/postgres-schema";
import {
  targetRoleReconstructionBatchRuns,
  targetRoleReconstructionResults
} from "../target-adapters/role-reconstruction-artifact-persistence/postgres-schema";

/** One validated JSON Job Pool upload. `canonical_json` holds the exact canonical bytes (key-sorted JSON). */
export const careerJobPoolUploads = pgTable("career_job_pool_uploads", {
  jobPoolUploadId: text("job_pool_upload_id").primaryKey(),
  poolId: text("pool_id").notNull(),
  poolVersion: integer("pool_version").notNull(),
  poolStatus: text("pool_status").notNull(),
  poolName: text("pool_name").notNull(),
  organizationCount: integer("organization_count").notNull(),
  roleCount: integer("role_count").notNull(),
  requirementCount: integer("requirement_count").notNull(),
  canonicalSha256: text("canonical_sha256").notNull(),
  rawSha256: text("raw_sha256").notNull(),
  canonicalJson: text("canonical_json").notNull(),
  uploadedByActorRef: text("uploaded_by_actor_ref").notNull(),
  uploadedAt: text("uploaded_at").notNull()
});

/** Exact identities of the canonical target revisions produced for one upload (stable JSON text, not JSONB). */
export const careerJobPoolCanonicalMappings = pgTable("career_job_pool_canonical_mappings", {
  jobPoolUploadId: text("job_pool_upload_id").primaryKey()
    .references(() => careerJobPoolUploads.jobPoolUploadId, { onDelete: "restrict" }),
  mappingJson: text("mapping_json").notNull(),
  createdAt: text("created_at").notNull()
});

/**
 * Order matters: requirement artifact results reference target_role_profile_revisions, which the T11 part of
 * the unified registration creates. Call this after registerUnifiedPersistenceSchema.
 */
const tables: PgTable[] = [
  targetRequirementRawProviderOutputs,
  targetRequirementReconstructionBatchRuns,
  targetRequirementReconstructionResults,
  targetRequirementEntityAdmissions,
  targetRoleReconstructionBatchRuns,
  targetRoleReconstructionResults,
  careerJobPoolUploads,
  careerJobPoolCanonicalMappings
];

const quote = (identifier: string) => `"${identifier.replaceAll('"', '""')}"`;

function createTableStatement(table: PgTable): string {
  const config = getTableConfig(table);
  return `CREATE TABLE IF NOT EXISTS ${quote(config.name)} (${[
    ...config.columns.map(column => `${quote(column.name)} ${column.getSQLType()}${column.notNull ? " NOT NULL" : ""}${column.primary ? " PRIMARY KEY" : ""}`),
    ...config.foreignKeys.map(key => {
      const reference = key.reference();
      return `FOREIGN KEY (${reference.columns.map(column => quote(column.name)).join(",")}) REFERENCES ${quote(getTableConfig(reference.foreignTable).name)} (${reference.foreignColumns.map(column => quote(column.name)).join(",")}) ON DELETE ${(key.onDelete ?? "no action").toUpperCase()}`;
    })
  ].join(",")})`;
}

export const JOB_POOL_PERSISTENCE_TABLE_NAMES = Object.freeze(tables.map(table => getTableConfig(table).name));

/** Startup-only, idempotent DDL. Only ever called on a positively verified disposable database. */
export async function registerJobPoolPersistenceSchema(sql: Sql): Promise<readonly string[]> {
  for (const table of tables) await sql.unsafe(createTableStatement(table));
  return JOB_POOL_PERSISTENCE_TABLE_NAMES;
}
