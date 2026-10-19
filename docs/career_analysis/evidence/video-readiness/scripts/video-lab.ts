/* END-TO-END VIDEO READINESS lab (owner "SFE — GELB | END-TO-END VIDEO READINESS", 2026-10-19). Run from the repository root:
 *
 *   set -a; . <test-db-role.env>; set +a; unset DATABASE_URL CONDYN_ALLOW_SHARED_DATABASE GEMINI_API_KEY
 *   VIDEO_LAB_PORT=41861 VIDEO_LAB_DIR=<dir> npx tsx <this file>
 *
 * A fresh, EMPTY disposable database (no pool, no analysis, no job: the video starts from nothing), the real Next server (GEMINI
 * OUTPUT on, a lab inspector token, the Gemini exchange archive on) and the real career worker (scripts/run-career-worker.ts,
 * unchanged). Gemini is the loopback stand-in (video-standin.ts); the real key never enters this lab and both processes run under
 * the network sentinel, which refuses every non-loopback connection. A live-Gemini run is NOT part of this lab: it needs a separate
 * owner GO. Writes <dir>/state.json (0600; holds the inspector token, never printed). SIGTERM/SIGINT stop both children and drop
 * the database. The shared condyn database is never touched (createDisposableTestDatabase / dropDisposableTestDatabase only). */
import { spawn, type ChildProcess } from "node:child_process";
import { randomBytes } from "node:crypto";
import { appendFileSync, mkdirSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { startVideoStandIn } from "./video-standin";

const W = process.cwd();
const HERE = dirname(fileURLToPath(import.meta.url));
if (!process.env.VIDEO_LAB_DIR) { console.error("VIDEO_LAB_DIR is required (a directory outside the repository)"); process.exit(2); }
const DIR = resolve(process.env.VIDEO_LAB_DIR);
const PORT = Number(process.env.VIDEO_LAB_PORT ?? "41861");
const STATE = resolve(DIR, "state.json");
const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

(async () => {
  mkdirSync(DIR, { recursive: true });
  const { createDisposableTestDatabase, dropDisposableTestDatabase } = await import(`${W}/lib/database-isolation/verification`);
  const { requireTestDatabaseAdminUrl } = await import(`${W}/scripts/test-db/admin-url`);
  const outer = await createDisposableTestDatabase(requireTestDatabaseAdminUrl());
  process.env.DATABASE_URL = outer.url;
  const { provisionDatabase } = await import(`${W}/test/career/hr-decision-loop/fixtures/hr-loop-postgres-world`);
  const { registerUnifiedPersistenceSchema } = await import(`${W}/lib/persistence/unified-schema-registration`);
  const db = await provisionDatabase();
  await registerUnifiedPersistenceSchema(db.sql);
  console.log(`[video-lab] empty database ${db.databaseName} (schema only)`);
  const standIn = await startVideoStandIn(record => appendFileSync(resolve(DIR, "standin.jsonl"), `${JSON.stringify(record)}\n`));
  const token = randomBytes(36).toString("base64url");
  const base = `http://127.0.0.1:${PORT}`;
  const common = { DATABASE_URL: db.databaseUrl, NEXT_TELEMETRY_DISABLED: "1", CONDYN_GEMINI_EXCHANGE_ARCHIVE: "1", NODE_OPTIONS: `--require ${resolve(HERE, "net-sentinel.cjs")}`, LAB_NET_LOG: resolve(DIR, "net.jsonl") };
  const children: ChildProcess[] = [];
  const serverEnv = { ...process.env, ...common, GEMINI_API_KEY: "", CONDYN_RESULT_INSPECTOR: "1", CONDYN_RESULT_INSPECTOR_TOKEN: token, NEXT_PUBLIC_CONDYN_RESULT_INSPECTOR_UI: "1" };
  // VIDEO_LAB_PROD=1: a local production build and `next start` (no dev indicator, no on-demand compiles; never a deployment).
  // The build writes .next of this checkout; NEXT_PUBLIC_* flags are fixed at build time.
  const PROD = process.env.VIDEO_LAB_PROD === "1";
  if (PROD) {
    const build = spawn(process.execPath, [resolve(W, "node_modules/next/dist/bin/next"), "build", "--webpack"], { cwd: W, env: { ...serverEnv, NODE_ENV: "production" }, stdio: ["ignore", "inherit", "inherit"] });
    const code: number = await new Promise(r => build.on("exit", c => r(c ?? 1)));
    if (code !== 0) { console.error(`[video-lab] next build failed (${code})`); await db.sql.end({ timeout: 5 }); await dropDisposableTestDatabase(db.databaseUrl); await db.admin.end({ timeout: 5 }); await dropDisposableTestDatabase(outer.url); process.exit(1); }
  }
  const server = spawn(process.execPath, [resolve(W, "node_modules/next/dist/bin/next"), PROD ? "start" : "dev", ...(PROD ? [] : ["--webpack"]), "-p", String(PORT), "-H", "127.0.0.1"], { cwd: W, env: { ...serverEnv, ...(PROD ? { NODE_ENV: "production" } : {}) }, stdio: ["ignore", "inherit", "inherit"] });
  children.push(server);
  let stopping = false;
  const stop = async () => {
    if (stopping) return; stopping = true;
    for (const child of children) { try { child.kill("SIGTERM"); } catch {} }
    await delay(3000);
    for (const child of children) if (child.exitCode === null) { try { child.kill("SIGKILL"); } catch {} }
    standIn.server.close();
    await db.sql.end({ timeout: 5 }); await dropDisposableTestDatabase(db.databaseUrl); await db.admin.end({ timeout: 5 });
    await dropDisposableTestDatabase(outer.url);
    try { unlinkSync(STATE); } catch {}
    process.exit(0);
  };
  process.on("SIGTERM", stop); process.on("SIGINT", stop);
  for (let i = 0; i < 240; i += 1) { try { const r = await fetch(`${base}/api/career/job-pools`); if (r.status === 200) { await r.json(); break; } } catch {} await delay(500); }
  // Warm the page once so the first recorded load is not a cold compile.
  try { await (await fetch(`${base}/career/demo`)).text(); } catch {}
  const worker = spawn(process.execPath, [resolve(W, "node_modules/tsx/dist/cli.mjs"), resolve(W, "scripts/run-career-worker.ts")], { cwd: W, env: { ...process.env, ...common, GEMINI_API_KEY: "video-lab-dummy-not-a-key", GEMINI_MODEL: "video-standin-model", GOOGLE_GEMINI_BASE_URL: `http://127.0.0.1:${standIn.port}`, PROMPT_ENCRYPTION_KEY: randomBytes(32).toString("base64"), CAREER_WORKER_ID: "gelb-video-lab-worker" }, stdio: ["ignore", "pipe", "pipe"] });
  children.push(worker);
  worker.stdout?.on("data", chunk => appendFileSync(resolve(DIR, "worker.log"), String(chunk)));
  worker.stderr?.on("data", chunk => appendFileSync(resolve(DIR, "worker.log"), String(chunk)));
  writeFileSync(STATE, JSON.stringify({ port: PORT, base, database: db.databaseName, pid: process.pid, serverPid: server.pid, workerPid: worker.pid, standInPort: standIn.port, token }, null, 2), { mode: 0o600 });
  console.log(`VIDEO LAB READY ${base} database=${db.databaseName} worker=${worker.pid}`);
})().catch(error => { console.error(error); process.exit(1); });
