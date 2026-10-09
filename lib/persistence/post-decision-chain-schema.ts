import { getTableConfig, type PgTable } from "drizzle-orm/pg-core";
import type { Sql } from "postgres";
import * as actionIntent from "../career/relation-adapters/action-intent-persistence/postgres-schema";
import * as actionOccurrence from "../career/relation-adapters/action-occurrence-persistence/postgres-schema";
import * as association from "../career/relation-adapters/action-state-change-association-declaration-persistence/postgres-schema";
import * as executionGrant from "../career/relation-adapters/execution-authority-grant-persistence/postgres-schema";
import * as executionContext from "../career/relation-adapters/execution-context-revision-persistence/postgres-schema";
import * as commitment from "../career/relation-adapters/human-commitment-persistence/postgres-schema";
import * as outcomeRole from "../career/relation-adapters/outcome-role-declaration-persistence/postgres-schema";
import * as outcomeValence from "../career/relation-adapters/outcome-valence-declaration-persistence/postgres-schema";
import * as feedbackAdmission from "../career/relation-adapters/outcome-valence-feedback-admission-declaration-persistence/postgres-schema";
import * as feedbackContextRevision from "../career/relation-adapters/outcome-valence-feedback-context-revision-persistence/postgres-schema";
import * as feedbackTarget from "../career/relation-adapters/outcome-valence-feedback-target-declaration-persistence/postgres-schema";
import * as feedbackTargetBinding from "../career/relation-adapters/outcome-valence-feedback-target-revision-binding-persistence/postgres-schema";
import * as stateChange from "../career/relation-adapters/state-change-declaration-persistence/postgres-schema";

const quote = (identifier: string) => `"${identifier.replaceAll('"', '""')}"`;

/**
 * The sealed Drizzle declarations of the post-decision chain DAINT .. COVFCR. Nothing here
 * defines a table: every table, column and foreign key comes from the existing relation
 * adapters. Registration order is derived from their foreign keys, never hand-written.
 */
const modules = [
  actionIntent, commitment, executionGrant, executionContext, actionOccurrence, stateChange, association,
  outcomeRole, outcomeValence, feedbackAdmission, feedbackTarget, feedbackTargetBinding, feedbackContextRevision,
];

const declared = modules.flatMap(module => Object.values(module) as PgTable[]).map(getTableConfig);

function orderByForeignKeys(configs: ReturnType<typeof getTableConfig>[]): ReturnType<typeof getTableConfig>[] {
  const byName = new Map(configs.map(config => [config.name, config]));
  const ordered: ReturnType<typeof getTableConfig>[] = [];
  const done = new Set<string>();
  const visiting = new Set<string>();
  const visit = (name: string) => {
    if (done.has(name)) return;
    if (visiting.has(name)) throw new Error("ERR_PERSISTENCE_POST_DECISION_SCHEMA_CYCLE");
    visiting.add(name);
    const config = byName.get(name)!;
    for (const key of config.foreignKeys) {
      const referenced = getTableConfig(key.reference().foreignTable).name;
      if (referenced !== name && byName.has(referenced)) visit(referenced);
    }
    visiting.delete(name);
    done.add(name);
    ordered.push(config);
  };
  for (const config of [...configs].sort((left, right) => left.name.localeCompare(right.name))) visit(config.name);
  return ordered;
}

const tables = orderByForeignKeys(declared);

const createTableStatement = (config: (typeof tables)[number]) =>
  `CREATE TABLE IF NOT EXISTS ${quote(config.name)} (${[
    ...config.columns.map(column =>
      `${quote(column.name)} ${column.getSQLType()}${column.notNull ? " NOT NULL" : ""}${column.primary ? " PRIMARY KEY" : ""}`),
    ...config.foreignKeys.map(key => {
      const reference = key.reference();
      return `FOREIGN KEY (${reference.columns.map(column => quote(column.name)).join(",")}) REFERENCES ${quote(getTableConfig(reference.foreignTable).name)} (${reference.foreignColumns.map(column => quote(column.name)).join(",")}) ON DELETE ${(key.onDelete ?? "no action").toUpperCase()}`;
    }),
  ].join(",")})`;

/**
 * Startup-only DDL for the post-decision chain. Requires the T11 registration first
 * (DAINT references human_decision_records). Request handling never calls it.
 */
export async function initPostDecisionChainSchema(sql: Sql): Promise<void> {
  for (const table of tables) await sql.unsafe(createTableStatement(table));
}

export const postDecisionChainTableNames = Object.freeze(tables.map(table => table.name));
