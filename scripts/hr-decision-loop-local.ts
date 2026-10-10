/**
 * HR Decision Looper: local manual test environment.
 *
 *   TEST_DATABASE_ADMIN_URL=postgresql://postgres:postgres@localhost:5432/postgres npm run hr-loop:local
 *
 * Database isolation (owner mandate, 2026-10-10): the database is created ONLY with
 * createDisposableTestDatabase, positively verified with verifyDisposableTestDatabase before
 * seeding and again before the server starts, and removed ONLY with dropDisposableTestDatabase.
 * The shared `condyn` database is refused by name before any connection. There is no other
 * database path in this script. CONDYN_ALLOW_SHARED_DATABASE is never set here.
 *
 * Subcommands:
 *   up      create + verify + provision + seed + serve        (default)
 *   seed    create + verify + provision + seed, then exit (prints the state)
 *   serve   verify the database in the state file and start the server
 *   status  print the state file
 *   drop    drop the database in the state file (or the URL given as argument)
 */
import { spawn } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, existsSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";
import { createServer } from "node:net";
import postgres from "postgres";
import { createDisposableTestDatabase, dropDisposableTestDatabase, verifyDisposableTestDatabase } from "../lib/database-isolation/verification";
import { requireTestDatabaseAdminUrl } from "./test-db/admin-url";

const STATE_DIR = resolve(process.cwd(), ".hr-loop-local");
const STATE_FILE = resolve(STATE_DIR, "state.json");
const DEFAULT_PORT = Number(process.env.HR_LOOP_LOCAL_PORT ?? "3017");

interface LocalState {
  createdAt: string;
  databaseName: string;
  databaseUrl: string;
  port: number;
  declarantActorId: string;
  grantorActorId: string;
  recommendationProposalId: string;
  decisionAuthorityGrantRevisionId: string;
  contextA: string;
  contextB: string;
  rootRevisionId: string;
  childRevisionId: string;
  decisionRevisionBindingId: string;
  humanDecisionRecordId: string;
}

const fail = (message: string): never => { console.error(message); process.exit(1); };

function readState(): LocalState {
  if (!existsSync(STATE_FILE)) return fail(`ERR_HR_LOOP_LOCAL_STATE_MISSING: no ${STATE_FILE}; run \`npm run hr-loop:local\` first`);
  return JSON.parse(readFileSync(STATE_FILE, "utf8")) as LocalState;
}

function urls(state: LocalState): Record<string, string> {
  const base = `http://127.0.0.1:${state.port}`;
  return {
    "Context A (complete persisted chain, one DCDRB binding, next context preloaded)": `${base}/career/demo?careerDecisionContextRevisionId=${state.contextA}&decisionContextRevisionId=${state.childRevisionId}`,
    "Context B (no declaration yet: declare here)": `${base}/career/demo?careerDecisionContextRevisionId=${state.contextB}`,
    "SIL field without the dock (preservation check)": `${base}/career/demo`,
    "API: context A read model": `${base}/api/career/hr-decision-loop/contexts/${state.contextA}`,
    "API: seeded human decision record": `${base}/api/career/hr-decision-loop/decisions/${state.humanDecisionRecordId}`,
    "API: G2 root revision (frozen API v1)": `${base}/api/decision-contexts/${state.rootRevisionId}`,
    "API: G2 child revision (D2 shape, formed directly)": `${base}/api/decision-contexts/${state.childRevisionId}`
  };
}

function printBanner(state: LocalState): void {
  console.info("");
  console.info("HR DECISION LOOPER · LOCAL MANUAL TEST ENVIRONMENT");
  console.info(`database  ${state.databaseName}  (disposable, verified; the shared condyn database is not used)`);
  console.info(`declarant ${state.declarantActorId}  (the only actor the seeded DAR authorizes; grantor ${state.grantorActorId})`);
  console.info("");
  for (const [label, url] of Object.entries(urls(state))) console.info(`${label}\n  ${url}`);
  console.info("");
  console.info("walkthrough  docs/career_analysis/HR_DECISION_LOOP_MANUAL_TEST.md");
  console.info(`drop         npm run hr-loop:local:drop   (removes ${state.databaseName} only)`);
  console.info("");
}

async function portFree(port: number): Promise<boolean> {
  return new Promise(done => {
    const listener = createServer();
    listener.once("error", () => done(false));
    listener.listen(port, "127.0.0.1", () => listener.close(() => done(true)));
  });
}

async function createAndSeed(): Promise<LocalState> {
  const adminUrl = requireTestDatabaseAdminUrl();
  const created = await createDisposableTestDatabase(adminUrl);
  console.info(`[hr-loop:local] created disposable database ${created.databaseName}`);
  const verified = await verifyDisposableTestDatabase(created.url);
  // The application client and the world fixture read DATABASE_URL at import time; only the verified URL is ever exposed.
  process.env.DATABASE_URL = verified.url;
  const sql = postgres(verified.url, { max: 2, onnotice: () => undefined });
  try {
    const identity = await sql`SELECT current_database() AS name`;
    if (identity[0]?.name !== verified.databaseName) fail(`ERR_HR_LOOP_LOCAL_IDENTITY_MISMATCH: connected to ${identity[0]?.name}`);
    const { registerUnifiedPersistenceSchema } = await import("../lib/persistence/unified-schema-registration");
    const order = await registerUnifiedPersistenceSchema(sql);
    console.info(`[hr-loop:local] registered schema: ${order.join(" -> ")}`);
    const world = await import("../test/career/hr-decision-loop/fixtures/hr-loop-postgres-world");
    const data = await world.seedHrLoopWorldInto(sql, verified.url, verified.databaseName);
    console.info("[hr-loop:local] seeded the sealed-producer world (context A full chain + DCDRB, context B empty)");
    const state: LocalState = {
      createdAt: new Date().toISOString(),
      databaseName: verified.databaseName,
      databaseUrl: verified.url,
      port: DEFAULT_PORT,
      declarantActorId: world.HR_LOOP_DECIDER,
      grantorActorId: world.HR_LOOP_GRANTOR,
      recommendationProposalId: data.recommendationProposalId,
      decisionAuthorityGrantRevisionId: data.decisionAuthorityGrantRevisionId,
      contextA: data.contextA,
      contextB: data.contextB,
      rootRevisionId: data.g2.rootRevisionId,
      childRevisionId: data.g2.childRevisionId,
      decisionRevisionBindingId: data.g2.decisionRevisionBindingId,
      humanDecisionRecordId: data.chain.humanDecisionRecordId
    };
    mkdirSync(STATE_DIR, { recursive: true });
    writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    return state;
  } catch (error) {
    await sql.end({ timeout: 5 }).catch(() => undefined);
    console.error(`[hr-loop:local] seed failed; dropping ${verified.databaseName}`);
    await dropDisposableTestDatabase(verified.url).catch(dropError => console.error(dropError));
    throw error;
  } finally {
    await sql.end({ timeout: 5 }).catch(() => undefined);
  }
}

async function serve(state: LocalState): Promise<void> {
  const verified = await verifyDisposableTestDatabase(state.databaseUrl);
  if (!(await portFree(state.port))) fail(`ERR_HR_LOOP_LOCAL_PORT_BUSY: port ${state.port} is in use; set HR_LOOP_LOCAL_PORT`);
  printBanner(state);
  console.info(`[hr-loop:local] starting next dev --webpack on 127.0.0.1:${state.port} against ${verified.databaseName}`);
  const child = spawn(process.execPath, [resolve(process.cwd(), "node_modules/next/dist/bin/next"), "dev", "--webpack", "-p", String(state.port), "-H", "127.0.0.1"], {
    cwd: process.cwd(),
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: verified.url, NEXT_TELEMETRY_DISABLED: "1" }
  });
  const stop = () => { if (child.exitCode === null) child.kill("SIGTERM"); };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
  await new Promise<void>(done => child.once("exit", () => done()));
  console.info(`[hr-loop:local] server stopped; database ${verified.databaseName} is kept. Drop it with: npm run hr-loop:local:drop`);
}

async function main(): Promise<void> {
  const command = process.argv[2] ?? "up";
  if (command === "up") { await serve(await createAndSeed()); return; }
  if (command === "seed") { printBanner(await createAndSeed()); return; }
  if (command === "serve") { await serve(readState()); return; }
  if (command === "status") { printBanner(readState()); return; }
  if (command === "drop") {
    const target = process.argv[3] ?? (existsSync(STATE_FILE) ? readState().databaseUrl : undefined);
    if (!target) return fail("ERR_HR_LOOP_LOCAL_DROP_TARGET_MISSING: no state file and no URL argument");
    const dropped = await dropDisposableTestDatabase(target);
    if (existsSync(STATE_FILE) && readState().databaseUrl === target) unlinkSync(STATE_FILE);
    console.info(`[hr-loop:local] dropped ${dropped.droppedDatabaseName}`);
    return;
  }
  fail(`ERR_HR_LOOP_LOCAL_COMMAND_UNKNOWN: ${command} (use up | seed | serve | status | drop)`);
}

main().catch(error => { console.error(error instanceof Error ? (process.env.HR_LOOP_LOCAL_DEBUG ? error.stack ?? error.message : error.message) : error); process.exit(1); });
