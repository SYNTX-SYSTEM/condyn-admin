/**
 * HR Decision Looper: local manual test environment.
 *
 *   set -a; . ~/.config/condyn/test-db-role.env; set +a; npm run hr-loop:local
 *
 * Database isolation (owner mandate, 2026-10-10): the admin role must be the least-privilege
 * test role (a superuser is refused unless TEST_DATABASE_ALLOW_SUPERUSER=1); the database is created ONLY with
 * createDisposableTestDatabase, positively verified with verifyDisposableTestDatabase before
 * seeding and again before the server starts, and removed ONLY with dropDisposableTestDatabase.
 * The shared `condyn` database is refused by name before any connection. There is no other
 * database path in this script. CONDYN_ALLOW_SHARED_DATABASE is never set here.
 *
 * Subcommands:
 *   up      reuse the verified database of the state file, else create + verify + provision + seed; then serve  (default)
 *   up --fresh   always create a new database (the previous one is kept until dropped)
 *   seed    create + verify + provision + seed, then exit (prints the state)
 *   serve   verify the database in the state file and start the server
 *   status  print the state file
 *   drop    drop the database in the state file (or the URL given as argument)
 *
 * Job Connection (owner mandate, 2026-10-10): `up --with-worker` (npm run job-pool:local) additionally
 *   registers the job-pool persistence (lib/career/job-pool/persistence-schema)
 *   and spawns the career worker (scripts/run-career-worker.ts) against the SAME verified disposable URL, with
 *   GEMINI_API_KEY taken from the operator's environment (fail closed when absent), GEMINI_MODEL passed through
 *   if set, and a freshly generated PROMPT_ENCRYPTION_KEY (32 random bytes, base64) per run. The worker's prompt
 *   repository is in memory. Neither child ever receives CONDYN_ALLOW_SHARED_DATABASE.
 */
import { spawn, type ChildProcess } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, existsSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";
import { createServer } from "node:net";
import postgres from "postgres";
import { createDisposableTestDatabase, dropDisposableTestDatabase, verifyDisposableTestDatabase } from "../lib/database-isolation/verification";
import { requireTestDatabaseAdminUrl } from "./test-db/admin-url";
import { assertLeastPrivilegeAdmin } from "./test-db/admin-privilege";
import { registerJobPoolPersistenceSchema } from "../lib/career/job-pool/persistence-schema";

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
    "SIL field without the dock (preservation check); Job Pool panel toggle top-left": `${base}/career/demo`,
    "Job Pool panel for an exact analysis (replace ANL_… with the id of a succeeded capability sweep)": `${base}/career/demo?analysisId=ANL_…`,
    "API: job pool uploads (explicit selection only)": `${base}/api/career/job-pools`,
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
  console.info("walkthrough  docs/career_analysis/HR_DECISION_LOOP_MANUAL_TEST.md · docs/career_analysis/JOB_POOL_WORKFLOW_MANUAL_TEST.md");
  console.info("worker       npm run job-pool:local   (adds the career worker; needs GEMINI_API_KEY in your shell)");
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

/** Unified registration (R7) followed by the job-pool registration of the Job Connection field (both idempotent). */
async function registerPersistence(sql: postgres.Sql): Promise<void> {
  const { registerUnifiedPersistenceSchema } = await import("../lib/persistence/unified-schema-registration");
  const order = await registerUnifiedPersistenceSchema(sql);
  console.info(`[hr-loop:local] registered schema: ${order.join(" -> ")}`);
  await registerJobPoolPersistenceSchema(sql);
  console.info("[hr-loop:local] registered job-pool persistence");
}

/** Child environments are built explicitly: the verified URL only, never the shared-database opt-in. */
function childEnvironment(verifiedUrl: string, extra: Record<string, string | undefined> = {}): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env, ...extra, DATABASE_URL: verifiedUrl, NEXT_TELEMETRY_DISABLED: "1" };
  delete env.CONDYN_ALLOW_SHARED_DATABASE;
  return env;
}

function spawnCareerWorker(verifiedUrl: string, databaseName: string): ChildProcess {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) fail("ERR_HR_LOOP_LOCAL_GEMINI_API_KEY_MISSING: --with-worker needs GEMINI_API_KEY in the operator's environment (never stored by this script)");
  const promptEncryptionKey = randomBytes(32).toString("base64");
  console.info(`[hr-loop:local] starting career worker against ${databaseName} (GEMINI_MODEL ${process.env.GEMINI_MODEL ?? "default cascade"}, fresh PROMPT_ENCRYPTION_KEY, in-memory prompt repository)`);
  const worker = spawn(process.execPath, [resolve(process.cwd(), "node_modules/tsx/dist/cli.mjs"), resolve(process.cwd(), "scripts/run-career-worker.ts")], {
    cwd: process.cwd(),
    stdio: ["ignore", "pipe", "pipe"],
    env: childEnvironment(verifiedUrl, { GEMINI_API_KEY: geminiApiKey, PROMPT_ENCRYPTION_KEY: promptEncryptionKey, CAREER_WORKER_ID: process.env.CAREER_WORKER_ID ?? "hr-loop-local-worker" })
  });
  const forward = (stream: NodeJS.ReadableStream | null, sink: (line: string) => void) => {
    if (!stream) return;
    let buffered = "";
    stream.on("data", (chunk: Buffer) => {
      buffered += chunk.toString("utf8");
      const lines = buffered.split("\n");
      buffered = lines.pop() ?? "";
      for (const line of lines) if (line.length > 0) sink(`[worker] ${line}`);
    });
  };
  forward(worker.stdout, line => console.info(line));
  forward(worker.stderr, line => console.error(line));
  worker.once("exit", code => console.info(`[hr-loop:local] career worker exited (code ${code ?? "signal"})`));
  return worker;
}

async function createAndSeed(): Promise<LocalState> {
  const adminUrl = requireTestDatabaseAdminUrl();
  const admin = await assertLeastPrivilegeAdmin(adminUrl);
  console.info(`[hr-loop:local] admin role ${admin.role}${admin.superuser ? " (superuser, explicitly allowed)" : " (least privilege)"}`);
  const created = await createDisposableTestDatabase(adminUrl);
  console.info(`[hr-loop:local] created disposable database ${created.databaseName}`);
  const verified = await verifyDisposableTestDatabase(created.url);
  // The application client and the world fixture read DATABASE_URL at import time; only the verified URL is ever exposed.
  process.env.DATABASE_URL = verified.url;
  const sql = postgres(verified.url, { max: 2, onnotice: () => undefined });
  try {
    const identity = await sql`SELECT current_database() AS name`;
    if (identity[0]?.name !== verified.databaseName) fail(`ERR_HR_LOOP_LOCAL_IDENTITY_MISMATCH: connected to ${identity[0]?.name}`);
    await registerPersistence(sql);
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

async function serve(state: LocalState, options: { withWorker: boolean }): Promise<void> {
  const verified = await verifyDisposableTestDatabase(state.databaseUrl);
  if (!(await portFree(state.port))) fail(`ERR_HR_LOOP_LOCAL_PORT_BUSY: port ${state.port} is in use; set HR_LOOP_LOCAL_PORT`);
  if (options.withWorker && !process.env.GEMINI_API_KEY) fail("ERR_HR_LOOP_LOCAL_GEMINI_API_KEY_MISSING: --with-worker needs GEMINI_API_KEY in the operator's environment (never stored by this script)");
  // A reused database from an earlier revision may predate the job-pool registration; registration is idempotent.
  const sql = postgres(verified.url, { max: 1, onnotice: () => undefined });
  try { await registerPersistence(sql); } finally { await sql.end({ timeout: 5 }).catch(() => undefined); }
  printBanner(state);
  const worker = options.withWorker ? spawnCareerWorker(verified.url, verified.databaseName) : null;
  console.info(`[hr-loop:local] starting next dev --webpack on 127.0.0.1:${state.port} against ${verified.databaseName}`);
  const child = spawn(process.execPath, [resolve(process.cwd(), "node_modules/next/dist/bin/next"), "dev", "--webpack", "-p", String(state.port), "-H", "127.0.0.1"], {
    cwd: process.cwd(),
    stdio: "inherit",
    env: childEnvironment(verified.url)
  });
  const stop = () => {
    if (child.exitCode === null) child.kill("SIGTERM");
    if (worker && worker.exitCode === null) worker.kill("SIGTERM");
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
  await new Promise<void>(done => child.once("exit", () => done()));
  if (worker && worker.exitCode === null) worker.kill("SIGTERM");
  console.info(`[hr-loop:local] server stopped; database ${verified.databaseName} is kept. Drop it with: npm run hr-loop:local:drop`);
}

/** The verified database of the last run is reused so that repeated starts never accumulate databases. */
async function existingVerifiedState(): Promise<LocalState | null> {
  if (!existsSync(STATE_FILE)) return null;
  const state = readState();
  try {
    await verifyDisposableTestDatabase(state.databaseUrl);
    return state;
  } catch (error) {
    console.info(`[hr-loop:local] state file names ${state.databaseName}, which is not a verified disposable database any more (${error instanceof Error ? error.message : String(error)}); creating a new one`);
    unlinkSync(STATE_FILE);
    return null;
  }
}

async function main(): Promise<void> {
  const command = process.argv[2] ?? "up";
  if (command === "up") {
    const fresh = process.argv.includes("--fresh");
    const withWorker = process.argv.includes("--with-worker") || process.env.HR_LOOP_LOCAL_WORKER === "1";
    const existing = fresh ? null : await existingVerifiedState();
    if (existing) console.info(`[hr-loop:local] reusing verified disposable database ${existing.databaseName} (use \`up --fresh\` for a new one)`);
    await serve(existing ?? await createAndSeed(), { withWorker });
    return;
  }
  if (command === "seed") { printBanner(await createAndSeed()); return; }
  if (command === "serve") { await serve(readState(), { withWorker: process.argv.includes("--with-worker") || process.env.HR_LOOP_LOCAL_WORKER === "1" }); return; }
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
