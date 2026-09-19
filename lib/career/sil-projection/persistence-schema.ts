import { getTableConfig } from "drizzle-orm/pg-core";
import type { Sql } from "postgres";
import { candidateSourceBundleDocumentReferences, candidateSourceBundles } from "../capability-core/source-bundle-postgres-schema";
import { organizationRelationMemberships, organizationRelations } from "../relation-adapters/organization-relation-persistence/postgres-schema";

const quote = (identifier: string) => `"${identifier.replaceAll('"', '""')}"`;
const tables = [candidateSourceBundles, candidateSourceBundleDocumentReferences, organizationRelations, organizationRelationMemberships].map(getTableConfig);
const createTableStatement = (config: typeof tables[number]) =>
  `CREATE TABLE IF NOT EXISTS ${quote(config.name)} (${[
    ...config.columns.map(column => `${quote(column.name)} ${column.getSQLType()}${column.notNull ? " NOT NULL" : ""}${column.primary ? " PRIMARY KEY" : ""}`),
    ...config.foreignKeys.map(key => {
      const reference = key.reference();
      return `FOREIGN KEY (${reference.columns.map(column => quote(column.name)).join(",")}) REFERENCES ${quote(getTableConfig(reference.foreignTable).name)} (${reference.foreignColumns.map(column => quote(column.name)).join(",")}) ON DELETE ${(key.onDelete ?? "no action").toUpperCase()}`;
    }),
  ].join(",")})`;

/** Startup-only DDL for exact-ID SIL lineage witnesses; request handling never creates tables. */
export async function initCanonicalSilReadLineageSchema(sql: Sql): Promise<void> {
  for (const table of tables) await sql.unsafe(createTableStatement(table));
}

export const canonicalSilReadLineageTableNames = Object.freeze(tables.map(table => table.name));
