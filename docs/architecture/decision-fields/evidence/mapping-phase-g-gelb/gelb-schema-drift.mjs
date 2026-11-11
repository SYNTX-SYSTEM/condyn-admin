/**
 * GELB · §91 A-G413 — THE SCHEMA BOOTSTRAP HAS DRIFTED FROM THE ORM SCHEMA, AND THE DRIFT IS INVISIBLE
 * ON ANY DATABASE WITH HISTORY.
 *
 * 27 of the suite's 28 failures are one cluster, all of them:
 *     PostgresError 42703: column "version" of relation "career_policy_versions" does not exist
 *
 * The ORM schema (lib/career/db/schema.ts) is what every repository writes through. The bootstrap
 * (lib/career/db/client.ts) is what creates the tables on a database that does not have them. They
 * disagree. On a long-lived development database the columns were added by hand at some point, so the
 * disagreement never showed; on a FRESH database the bootstrap is the only author of the schema and 27
 * assertions go red at once.
 *
 * *** THIS DEFECT WAS ONLY REACHABLE BECAUSE B-ENTRY WAS RESTORED. *** A disposable database is a
 * database with no history, and a database with no history is the only instrument that can see this.
 * Five phases of this record cited the suite as a boundary while the suite could not run.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const ROOT = "/home/codi/Entwicklung/condyn-admin-hr-integration";
const SCHEMA = "lib/career/db/schema.ts";
const CLIENT = "lib/career/db/client.ts";
const read = p => readFileSync(`${ROOT}/${p}`, "utf8");
const rule = () => console.log("=".repeat(104));
const HEAD = execFileSync("git", ["-C", ROOT, "rev-parse", "--short", "HEAD"], { encoding: "utf8" }).trim();

/* ── the ORM schema: every pgTable and the SQL column names it declares ── */
function ormTables() {
  const src = read(SCHEMA), out = new Map();
  for (const m of src.matchAll(/export const (\w+) = pgTable\("([a-z_0-9]+)",\s*\{([\s\S]*?)\n\}\)/g)) {
    const [, binding, table, body] = m;
    const cols = [...body.matchAll(/^\s*(\w+)\s*:\s*(?:\w+)\(\s*"([a-z_0-9]+)"/gm)].map(c => c[2]);
    if (cols.length === 0) throw new Error(`ORM table ${table} parsed with no columns — the parse is wrong, not the schema`);
    out.set(table, { binding, columns: cols });
  }
  return out;
}

/* ── the bootstrap: every CREATE TABLE and the columns in its body, plus every ADD COLUMN ── */
function bootstrapTables() {
  const src = read(CLIENT), out = new Map();
  for (const m of src.matchAll(/CREATE TABLE IF NOT EXISTS ([a-z_0-9]+) \(([\s\S]*?)\n\s*\);/g)) {
    const [, table, body] = m;
    const cols = [];
    for (const raw of body.split("\n")) {
      const line = raw.trim().replace(/,$/, "");
      if (line === "") continue;
      if (/^(PRIMARY KEY|UNIQUE|FOREIGN KEY|CONSTRAINT|CHECK)\b/i.test(line)) continue;
      const name = /^([a-z_0-9]+)\s+/.exec(line);
      if (name) cols.push(name[1]);
    }
    if (cols.length === 0) throw new Error(`bootstrap table ${table} parsed with no columns — the parse is wrong`);
    out.set(table, cols);
  }
  for (const m of src.matchAll(/ALTER TABLE ([a-z_0-9]+)[\s\S]{0,80}?ADD COLUMN(?: IF NOT EXISTS)? ([a-z_0-9]+)/g)) {
    const [, table, col] = m;
    if (out.has(table) && !out.get(table).includes(col)) out.get(table).push(col);
  }
  return out;
}

rule();
console.log(`GELB · §91 A-G413 — SCHEMA BOOTSTRAP vs ORM SCHEMA. Repo @ ${HEAD}`);
rule();

const orm = ormTables(), boot = bootstrapTables();
console.log(`\n  ORM tables parsed from ${SCHEMA}: ${orm.size}`);
console.log(`  bootstrap tables parsed from ${CLIENT}: ${boot.size}\n`);
const onlyOrm = [...orm.keys()].filter(t => !boot.has(t));
const onlyBoot = [...boot.keys()].filter(t => !orm.has(t));
console.log(`  declared in the ORM and never created by the bootstrap: ${onlyOrm.length}${onlyOrm.length ? " — " + onlyOrm.join(", ") : ""}`);
console.log(`  created by the bootstrap and absent from the ORM:       ${onlyBoot.length}${onlyBoot.length ? " — " + onlyBoot.join(", ") : ""}`);

rule();
console.log(`[1] COLUMN DRIFT, PER TABLE — the ORM is authoritative because every write goes through it`);
rule();
console.log("");
const drifted = [];
for (const [table, { columns }] of [...orm].sort()) {
  const have = boot.get(table) ?? [];
  const missing = columns.filter(c => !have.includes(c));
  const extra = have.filter(c => !columns.includes(c));
  if (missing.length === 0 && extra.length === 0) continue;
  drifted.push({ table, missing, extra });
  console.log(`  ${table}`);
  if (missing.length) console.log(`      MISSING from the bootstrap (a write to any of these fails 42703): ${missing.join(", ")}`);
  if (extra.length) console.log(`      created but NOT in the ORM (dead columns, NOT NULL ones break every insert): ${extra.join(", ")}`);
}
if (drifted.length === 0) console.log("  (no drift)");
const nMissing = drifted.reduce((a, d) => a + d.missing.length, 0);
const nExtra = drifted.reduce((a, d) => a + d.extra.length, 0);
const nCols = [...orm.values()].reduce((a, t) => a + t.columns.length, 0);
console.log(`\n  *** ${drifted.length} OF ${orm.size} TABLES HAVE DRIFTED: ${nMissing} COLUMN(S) MISSING, ${nExtra} CREATED BUT UNDECLARED, out of ${nCols} ORM columns. ***`);

rule();
console.log(`[2] WHICH DRIFT IS FATAL, AND WHY ONLY A DATABASE WITHOUT HISTORY SEES IT`);
rule();
const fatal = drifted.filter(d => d.missing.length > 0);
const notNull = (table, col) => new RegExp(`"${col}"\\)[^,\\n]*\\.notNull\\(\\)`).test(read(SCHEMA).slice(read(SCHEMA).indexOf(`pgTable("${table}"`)));
console.log(`
  A MISSING column is fatal the first time anything writes it: the ORM names every column in its INSERT,
  so postgres refuses the statement with 42703 before any row exists. An EXTRA column is fatal only if
  it is NOT NULL, because then the bootstrap's own table rejects the ORM's complete insert.
`);
for (const d of fatal) {
  console.log(`  ${d.table}: missing ${d.missing.length}, of which NOT NULL in the ORM: ${d.missing.filter(c => notNull(d.table, c)).length}`);
  console.log(`      ${d.missing.map(c => `${c}${notNull(d.table, c) ? " (NOT NULL)" : ""}`).join(", ")}`);
  if (d.extra.length) console.log(`      extra: ${d.extra.join(", ")} — fatal if NOT NULL in the bootstrap`);
}
console.log(`
  *** AND THIS IS WHY IT SURVIVED: the bootstrap says CREATE TABLE IF NOT EXISTS. *** On a database that
  already has the table — any database with history — the statement is a no-op and the hand-added columns
  stay. The bootstrap is only the author of the schema on a database that has none. So the defect is
  INVISIBLE to every run against a long-lived database and CERTAIN against a fresh one, which is exactly
  the shape §90's restoration changed: a disposable database is a database with no history.`);

rule();
console.log(`[3] THE REMEDY, AND WHY IT IS NOT "ADD THE FOUR COLUMNS"`);
rule();
console.log(`
  Adding the missing columns by hand closes ${nMissing} holes and leaves the MECHANISM intact: two
  declarations of one schema, with nothing comparing them. The next column added to the ORM drifts again,
  silently, and is caught only by whoever next runs the suite on a fresh database.

  *** RULED: the comparison becomes a TEST, and the bootstrap is corrected to agree with the ORM. ***
  The ORM is authoritative, because every repository writes through it and the bootstrap is read by
  nothing but itself. In §88's terms the bootstrap is a second COPY of the schema at state REPORTS — it
  does not even report, it simply disagrees. The rung above is READS: generate the DDL from the ORM so
  no second copy exists. That is the right end state and it is a larger change than this phase's scope
  allows, so the ruling is the two-step that does not pretend otherwise:
      1. correct the bootstrap now, column by column, so the suite can be green on a fresh database;
      2. add the drift test, so the copy cannot disagree again without saying so.
  Step 2 is what makes step 1 durable, and without it step 1 is a repair rather than a remedy.`);
rule();
console.log(`DRIFT SUMMARY (machine-readable, for the fix):`);
for (const d of drifted) console.log(`  ${d.table}  missing=[${d.missing.join(" ")}]  extra=[${d.extra.join(" ")}]`);
rule();
process.exitCode = 0;
