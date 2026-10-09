import { getTableConfig } from "drizzle-orm/pg-core";
import type { Sql } from "postgres";
import { careerDecisionContextDecisionRevisionBindings } from "./postgres-schema";

const quote = (identifier: string) => `"${identifier.replaceAll('"', '""')}"`;
const table = getTableConfig(careerDecisionContextDecisionRevisionBindings);

const createTableStatement = () =>
  `CREATE TABLE IF NOT EXISTS ${quote(table.name)} (${[
    ...table.columns.map(column =>
      `${quote(column.name)} ${column.getSQLType()}${column.notNull ? " NOT NULL" : ""}${column.primary ? " PRIMARY KEY" : ""}`),
    ...table.foreignKeys.map(key => {
      const reference = key.reference();
      return `FOREIGN KEY (${reference.columns.map(column => quote(column.name)).join(",")}) REFERENCES ${quote(getTableConfig(reference.foreignTable).name)} (${reference.foreignColumns.map(column => quote(column.name)).join(",")}) ON DELETE ${(key.onDelete ?? "no action").toUpperCase()}`;
    }),
  ].join(",")})`;

/** Startup-only DDL. It must run after the Career decision-context tables it references. */
export async function initCareerDecisionContextDecisionRevisionBindingSchema(sql: Sql): Promise<void> {
  await sql.unsafe(createTableStatement());
}

export const careerDecisionContextDecisionRevisionBindingTableName = table.name;
