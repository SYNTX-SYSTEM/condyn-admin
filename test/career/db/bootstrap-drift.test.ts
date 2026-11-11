import postgres from "postgres";
import { getTableColumns, getTableName } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { applyCareerDbSchema } from "../../../lib/career/db/client";
import * as schema from "../../../lib/career/db/schema";

/**
 * §91 A-G413 · THE BOOTSTRAP MUST AGREE WITH THE ORM, AND THE AGREEMENT IS NOW ASSERTED.
 *
 * lib/career/db/schema.ts is what every repository writes through. lib/career/db/client.ts is what
 * creates the tables on a database that does not have them. They are two declarations of one schema,
 * and until this test nothing compared them: 9 of 18 career tables had drifted, 10 columns missing and
 * 10 created but undeclared — every one of the 10 extras NOT NULL, so each blocked every ORM insert
 * into its table. 27 of the suite's 28 failures were that one cluster.
 *
 * *** IT SURVIVED BECAUSE THE BOOTSTRAP SAYS `CREATE TABLE IF NOT EXISTS`. *** On a database that
 * already has the table the statement is a no-op, so columns added by hand at some point stay and the
 * disagreement never shows. The bootstrap is the sole author of the schema only on a database with NO
 * history — and a disposable test database is exactly that. This defect was unreachable while boundary
 * B-ENTRY had nothing behind it, which is the sharp half of GRÜN's complement to §90: a fail-closed gate
 * with nothing behind it does not only withhold new assertions, it silences the ones already written.
 *
 * The right end state is one declaration, not two — generate the DDL from the ORM so no second copy
 * exists (§88's READS rung, where a copy that cannot disagree beats a copy that is checked). This test
 * is the rung below that: the copy may exist, but it can no longer disagree in silence.
 */
const url = process.env.DATABASE_URL!;
let sql: postgres.Sql;
type Live = { name: string; nullable: boolean };

beforeAll(async () => {
  sql = postgres(url, { max: 1, onnotice: () => undefined, connect_timeout: 10 });
  await applyCareerDbSchema(sql);
}, 120_000);
afterAll(async () => { await sql?.end({ timeout: 5 }); });

/** Every table the ORM declares, with its SQL column names and whether the ORM requires each. */
function ormTables(): Array<{ table: string; columns: Array<{ name: string; notNull: boolean }> }> {
  const out: Array<{ table: string; columns: Array<{ name: string; notNull: boolean }> }> = [];
  for (const value of Object.values(schema)) {
    let table: string;
    let columns: Record<string, unknown>;
    try { table = getTableName(value as never); columns = getTableColumns(value as never); } catch { continue; }
    out.push({ table, columns: Object.values(columns).map(column => ({ name: (column as { name: string }).name, notNull: (column as { notNull: boolean }).notNull })) });
  }
  return out.sort((a, b) => a.table.localeCompare(b.table));
}

describe("CAREER-DB-DRIFT · the bootstrap DDL and the ORM schema are one schema", () => {
  it("declares at least the career tables, so an empty parse cannot pass as agreement", () => {
    const tables = ormTables();
    expect(tables.length, "the ORM parse found no tables, which would make every assertion below vacuous").toBeGreaterThan(10);
    for (const { table, columns } of tables) expect(columns.length, table).toBeGreaterThan(0);
  });

  it("every ORM column exists in the bootstrapped database, and the database has no column the ORM does not declare", async () => {
    const rows = await sql`SELECT table_name, column_name, is_nullable FROM information_schema.columns WHERE table_schema = 'public'` as unknown as Array<{ table_name: string; column_name: string; is_nullable: string }>;
    const live = new Map<string, Live[]>();
    for (const row of rows) {
      if (!live.has(row.table_name)) live.set(row.table_name, []);
      live.get(row.table_name)!.push({ name: row.column_name, nullable: row.is_nullable === "YES" });
    }
    expect(live.size, "the bootstrap created no table, so this comparison would be vacuous").toBeGreaterThan(10);

    const drift: string[] = [];
    for (const { table, columns } of ormTables()) {
      const have = live.get(table);
      if (have === undefined) { drift.push(`${table}: the ORM declares it and the bootstrap never creates it`); continue; }
      for (const column of columns) {
        if (!have.some(h => h.name === column.name)) {
          drift.push(`${table}.${column.name}: declared by the ORM${column.notNull ? " as NOT NULL" : ""}, absent from the bootstrap — every write naming it fails 42703`);
        }
      }
      for (const h of have) {
        if (!columns.some(c => c.name === h.name)) {
          drift.push(`${table}.${h.name}: created by the bootstrap, not declared by the ORM${h.nullable ? " (nullable, so inert)" : " — NOT NULL, so it blocks every ORM insert into this table"}`);
        }
      }
    }
    expect(drift, "the bootstrap DDL and the ORM schema have drifted").toEqual([]);
  }, 120_000);
});
