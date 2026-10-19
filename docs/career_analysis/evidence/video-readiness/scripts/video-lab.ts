/* END-TO-END VIDEO READINESS lab (owner "SFE — GELB | END-TO-END VIDEO READINESS", 2026-10-19). Run from the repository root:
 *
 *   set -a; . <test-db-role.env>; set +a; unset DATABASE_URL CONDYN_ALLOW_SHARED_DATABASE GEMINI_API_KEY
 *   VIDEO_LAB_PORT=41861 VIDEO_LAB_DIR=<dir> npx tsx <this file>
 *
 * A fresh, EMPTY disposable database (no pool, no analysis, no job: the video starts from nothing), the real Next server (GEMINI
 * OUTPUT on, a lab inspector token, the Gemini exchange archive on) and the real career worker (scripts/run-career-worker.ts,
 * unchanged). By default Gemini is the loopback stand-in (video-standin.ts); the real key never enters this lab and both processes
 * run under the network sentinel, which refuses every non-loopback connection. Writes <dir>/state.json (0600; holds the inspector
 * token, never printed). SIGTERM/SIGINT stop both children and drop the database. The shared condyn database is never touched
 * (createDisposableTestDatabase / dropDisposableTestDatabase only).
 *
 * LIVE GEMINI (only after the owner's separate GO): VIDEO_LAB_GEMINI=live VIDEO_LAB_LIVE_GEMINI_GO=owner-go
 * VIDEO_LAB_GEMINI_ENV=<env file with GEMINI_API_KEY and GEMINI_MODEL> [VIDEO_LAB_GEMINI_BUDGET=1..12, default 8]. The server and
 * the worker keep the sentinel and no key; the worker reaches Gemini only through the loopback relay of this process
 * (video-gemini-relay.ts: one model, generateContent only, a hard call budget, metadata log relay.jsonl, never content or key).
 * Without all three variables the lab refuses to start before it creates anything. */
import { spawn, type ChildProcess } from "node:child_process";
import { randomBytes } from "node:crypto";
import { appendFileSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { startVideoStandIn } from "./video-standin";
import { startGeminiRelay } from "./video-gemini-relay";

const W = process.cwd();
const HERE = dirname(fileURLToPath(import.meta.url));
if (!process.env.VIDEO_LAB_DIR) { console.error("VIDEO_LAB_DIR is required (a directory outside the repository)"); process.exit(2); }
const DIR = resolve(process.env.VIDEO_LAB_DIR);
const PORT = Number(process.env.VIDEO_LAB_PORT ?? "41861");
const STATE = resolve(DIR, "state.json");
const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

// Live Gemini is checked before anything is created: all three variables, a key and a model from the named env file, or no start.
const LIVE = process.env.VIDEO_LAB_GEMINI === "live";
if (process.env.VIDEO_LAB_GEMINI !== undefined && process.env.VIDEO_LAB_GEMINI !== "live" && process.env.VIDEO_LAB_GEMINI !== "standin") { console.error("[video-lab] VIDEO_LAB_GEMINI must be standin or live"); process.exit(2); }
const live = LIVE ? (() => {
  if (process.env.VIDEO_LAB_LIVE_GEMINI_GO !== "owner-go") { console.error("[video-lab] live Gemini refused: VIDEO_LAB_LIVE_GEMINI_GO=owner-go is set only after the owner's GO"); process.exit(2); }
  const file = process.env.VIDEO_LAB_GEMINI_ENV;
  if (!file) { console.error("[video-lab] live Gemini refused: VIDEO_LAB_GEMINI_ENV names no env file"); process.exit(2); }
  const value = (name: string) => { const line = readFileSync(file, "utf8").split(/\r?\n/).find(l => l.startsWith(`${name}=`)); return line ? line.slice(name.length + 1).trim().replace(/^["']|["']$/g, "") : ""; };
  const apiKey = value("GEMINI_API_KEY"), model = process.env.VIDEO_LAB_GEMINI_MODEL ?? value("GEMINI_MODEL"), budget = Number(process.env.VIDEO_LAB_GEMINI_BUDGET ?? "8");
  if (apiKey.length < 20 || !/^[A-Za-z0-9._-]+$/.test(model) || !Number.isInteger(budget) || budget < 1 || budget > 12) { console.error("[video-lab] live Gemini refused: key, model or budget (1..12) missing or invalid"); process.exit(2); }
  return { apiKey, model, budget };
})() : null;

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
  const gemini = live
    ? await startGeminiRelay({ apiKey: live.apiKey, model: live.model, budget: live.budget, upstream: process.env.VIDEO_LAB_RELAY_TEST_UPSTREAM, onRecord: record => appendFileSync(resolve(DIR, "relay.jsonl"), `${JSON.stringify(record)}\n`) })
    : await startVideoStandIn(record => appendFileSync(resolve(DIR, "standin.jsonl"), `${JSON.stringify(record)}\n`));
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
    gemini.server.close();
    await db.sql.end({ timeout: 5 }); await dropDisposableTestDatabase(db.databaseUrl); await db.admin.end({ timeout: 5 });
    await dropDisposableTestDatabase(outer.url);
    try { unlinkSync(STATE); } catch {}
    process.exit(0);
  };
  process.on("SIGTERM", stop); process.on("SIGINT", stop);
  for (let i = 0; i < 240; i += 1) { try { const r = await fetch(`${base}/api/career/job-pools`); if (r.status === 200) { await r.json(); break; } } catch {} await delay(500); }
  // Warm the page once so the first recorded load is not a cold compile.
  try { await (await fetch(`${base}/career/demo`)).text(); } catch {}
  const worker = spawn(process.execPath, [resolve(W, "node_modules/tsx/dist/cli.mjs"), resolve(W, "scripts/run-career-worker.ts")], { cwd: W, env: { ...process.env, ...common, GEMINI_API_KEY: "video-lab-dummy-not-a-key", GEMINI_MODEL: live ? live.model : "video-standin-model", GOOGLE_GEMINI_BASE_URL: `http://127.0.0.1:${gemini.port}`, PROMPT_ENCRYPTION_KEY: randomBytes(32).toString("base64"), CAREER_WORKER_ID: "gelb-video-lab-worker" }, stdio: ["ignore", "pipe", "pipe"] });
  children.push(worker);
  worker.stdout?.on("data", chunk => appendFileSync(resolve(DIR, "worker.log"), String(chunk)));
  worker.stderr?.on("data", chunk => appendFileSync(resolve(DIR, "worker.log"), String(chunk)));
  writeFileSync(STATE, JSON.stringify({ port: PORT, base, database: db.databaseName, pid: process.pid, serverPid: server.pid, workerPid: worker.pid, gemini: live ? "LIVE" : "STANDIN", ...(live ? { model: live.model, budget: live.budget, relayPort: gemini.port } : { standInPort: gemini.port }), token }, null, 2), { mode: 0o600 });
  console.log(`VIDEO LAB READY ${base} database=${db.databaseName} worker=${worker.pid} gemini=${live ? `LIVE model=${live.model} budget=${live.budget}` : "STANDIN"}`);
})().catch(error => { console.error(error); process.exit(1); });
