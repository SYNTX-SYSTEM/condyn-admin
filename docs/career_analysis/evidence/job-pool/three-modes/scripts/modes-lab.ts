/* GRÜN three-mode lab (owner GO "DEMO FRONTEND", 2026-10-15): a disposable world, the real Next server (Result Inspector open with a
 * lab token, exchange archive on) and the REAL worker (scripts/run-career-worker.ts, unchanged) whose Gemini is GRÜN's loopback stand-in.
 * Both processes run under a network sentinel that refuses every non-loopback connection (LAB_NET_LOG). Never touches :3017 / :41831.
 * Env: LAB_PORT, LAB_STATE_FILE (0600, holds the lab token; never printed), LAB_DIR (logs). */
import { spawn, type ChildProcess } from "node:child_process";
import { randomBytes } from "node:crypto";
import { readFileSync, writeFileSync, appendFileSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";
import { startGeminiStandIn } from "./gemini-standin";

// Run from the repository root; the sentinel is the one beside this script.
const W = process.cwd();
const STATE = process.env.LAB_STATE_FILE!;
const DIR = process.env.LAB_DIR!;
const PORT = Number(process.env.LAB_PORT ?? "41803");
const SENTINEL = resolve(__dirname, "net-sentinel.cjs");
const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
(async () => {
  const { createDisposableTestDatabase, dropDisposableTestDatabase } = await import(`${W}/lib/database-isolation/verification`);
  const { requireTestDatabaseAdminUrl } = await import(`${W}/scripts/test-db/admin-url`);
  const outer = await createDisposableTestDatabase(requireTestDatabaseAdminUrl());
  process.env.DATABASE_URL = outer.url;
  const { createJobPoolPostgresWorld } = await import(`${W}/test/career/job-pool/fixtures/job-pool-postgres-world`);
  const world = await createJobPoolPostgresWorld();
  console.log(`[lab] world database ${world.databaseName}`);
  const standInLog = resolve(DIR, "standin.jsonl");
  const standIn = await startGeminiStandIn(record => appendFileSync(standInLog, `${JSON.stringify(record)}\n`));
  const token = randomBytes(36).toString("base64url");
  const base = `http://127.0.0.1:${PORT}`;
  const common = { DATABASE_URL: world.databaseUrl, NEXT_TELEMETRY_DISABLED: "1", CONDYN_GEMINI_EXCHANGE_ARCHIVE: "1", NODE_OPTIONS: `--require ${SENTINEL}`, LAB_NET_LOG: resolve(DIR, "net.jsonl") };
  // The real key never enters this lab: a dummy key, and Gemini is the loopback stand-in.
  const children: ChildProcess[] = [];
  const server = spawn(process.execPath, [resolve(W, "node_modules/next/dist/bin/next"), "dev", "--webpack", "-p", String(PORT), "-H", "127.0.0.1"], { cwd: W, env: { ...process.env, ...common, GEMINI_API_KEY: "", CONDYN_RESULT_INSPECTOR: "1", CONDYN_RESULT_INSPECTOR_TOKEN: token, NEXT_PUBLIC_CONDYN_RESULT_INSPECTOR_UI: "1" }, stdio: ["ignore", "inherit", "inherit"] });
  children.push(server);
  let stopping = false;
  const stop = async () => { if (stopping) return; stopping = true; for (const child of children) { try { child.kill("SIGTERM"); } catch {} } await delay(3000); for (const child of children) if (child.exitCode === null) { try { child.kill("SIGKILL"); } catch {} } standIn.server.close(); await world.destroy(); await dropDisposableTestDatabase(outer.url); try { unlinkSync(STATE); } catch {} process.exit(0); };
  process.on("SIGTERM", stop); process.on("SIGINT", stop);
  for (let i = 0; i < 240; i += 1) { try { const r = await fetch(`${base}/api/career/job-pools`); if (r.status === 200) { await r.json(); break; } } catch {} await delay(500); }
  // Pools through the real upload route: PINK's validation pool and the DLL engineering test pool.
  const post = async (body: string) => (await (await fetch(`${base}/api/career/job-pools`, { method: "POST", headers: { "content-type": "application/json", "x-condyn-principal-actor-id": "GRUEN_MODES_LAB" }, body })).json()) as { jobPoolUploadId?: string; upload?: { jobPoolUploadId: string } };
  const { validationPool } = await import(`${W}/test/job-pool-validation/fixtures/pool`);
  const validation = await post(JSON.stringify(validationPool));
  const engineering = await post(readFileSync(`${W}/docs/examples/job-pool-tests/DLL_JOBPOOL_ENGINEERING.json`, "utf8"));
  const id = (value: { jobPoolUploadId?: string; upload?: { jobPoolUploadId: string } }) => value.jobPoolUploadId ?? value.upload?.jobPoolUploadId ?? null;
  // The real worker, unchanged, with the stand-in as Gemini and the archive on (it registers the archive table on this disposable database).
  const worker = spawn(process.execPath, [resolve(W, "node_modules/tsx/dist/cli.mjs"), resolve(W, "scripts/run-career-worker.ts")], { cwd: W, env: { ...process.env, ...common, GEMINI_API_KEY: "gruen-lab-dummy-not-a-key", GEMINI_MODEL: "gruen-standin-model", GOOGLE_GEMINI_BASE_URL: `http://127.0.0.1:${standIn.port}`, PROMPT_ENCRYPTION_KEY: randomBytes(32).toString("base64"), CAREER_WORKER_ID: "gruen-modes-lab-worker" }, stdio: ["ignore", "pipe", "pipe"] });
  children.push(worker);
  const workerLog = resolve(DIR, "worker.log");
  worker.stdout?.on("data", chunk => appendFileSync(workerLog, String(chunk)));
  worker.stderr?.on("data", chunk => appendFileSync(workerLog, String(chunk)));
  const state = { port: PORT, base, database: world.databaseName, pid: process.pid, serverPid: server.pid, workerPid: worker.pid, standInPort: standIn.port, token, legacyAnalysisId: world.analysisId, sampleUploadId: world.sampleUploadId ?? null, validationUploadId: id(validation), engineeringUploadId: id(engineering) };
  writeFileSync(STATE, JSON.stringify(state, null, 2), { mode: 0o600 });
  console.log(`LAB READY ${base} validation=${state.validationUploadId} engineering=${state.engineeringUploadId} worker=${worker.pid}`);
})().catch(error => { console.error(error); process.exit(1); });
