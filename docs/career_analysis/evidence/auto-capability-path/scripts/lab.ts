/* GRÜN AUTO_CAPABILITY lab (owner SFE::AUTOMATED_CAPABILITY_TO_JOB_EXECUTE, 2026-10-30): production server + real worker, labelled stand-in only
 * (loopback Gemini fake for the analysis, the in-process semantic stand-in for the relations); the three DLL test pools via the real
 * upload route. LAB_SEMANTIC=off leaves the semantic provider unset (DISABLED path). Scratch copy, never committed. */
/* GRÜN three-mode lab (owner GO "DEMO FRONTEND", 2026-10-15): a disposable world, the real Next server (Result Inspector open with a
 * lab token, exchange archive on) and the REAL worker (scripts/run-career-worker.ts, unchanged) whose Gemini is GRÜN's loopback stand-in.
 * Both processes run under a network sentinel that refuses every non-loopback connection (LAB_NET_LOG). Never touches :3017 / :41831.
 * Env: LAB_PORT, LAB_STATE_FILE (0600, holds the lab token; never printed), LAB_DIR (logs). */
import { spawn, type ChildProcess } from "node:child_process";
import { randomBytes } from "node:crypto";
import { readFileSync, writeFileSync, appendFileSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";
import { createRequire } from "node:module";

// Run from the repository root; the sentinel is the one beside this script.
const W = process.cwd();
/** Bare packages resolve from the repository (this copy lives outside it). */
const fromRepo = (name: string) => createRequire(resolve(W, "package.json")).resolve(name);
const STATE = process.env.LAB_STATE_FILE!;
const DIR = process.env.LAB_DIR!;
const PORT = Number(process.env.LAB_PORT ?? "41803");
const SENTINEL = resolve(W, "docs/career_analysis/evidence/job-pool/three-modes/scripts/net-sentinel.cjs");
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
  const { startGeminiStandIn } = await import(`${W}/docs/career_analysis/evidence/job-pool/three-modes/scripts/gemini-standin`);
  const standIn = await startGeminiStandIn(record => appendFileSync(standInLog, `${JSON.stringify(record)}\n`));
  const token = randomBytes(36).toString("base64url");
  const base = `http://127.0.0.1:${PORT}`;
  const common = { DATABASE_URL: world.databaseUrl, NEXT_TELEMETRY_DISABLED: "1", CONDYN_GEMINI_EXCHANGE_ARCHIVE: "1", NODE_OPTIONS: `--require ${SENTINEL}`, LAB_NET_LOG: resolve(DIR, "net.jsonl"), ...(process.env.LAB_SEMANTIC === "off" ? {} : { ROLE_DISCOVERY_SEMANTIC_PROVIDER: "stand-in", ROLE_DISCOVERY_DAY_LIMIT: "1000", ROLE_DISCOVERY_MAX_ROLES: "10" }) };
  // The real key never enters this lab: a dummy key, and Gemini is the loopback stand-in.
  const children: ChildProcess[] = [];
  const server = spawn(process.execPath, [resolve(W, "node_modules/next/dist/bin/next"), "start", "-p", String(PORT), "-H", "127.0.0.1"], { cwd: W, env: { ...process.env, ...common, GEMINI_API_KEY: "", CONDYN_RESULT_INSPECTOR: "1", CONDYN_RESULT_INSPECTOR_TOKEN: token }  /* no NEXT_PUBLIC flag at runtime: the build has none, a runtime-only value makes SSR and client differ (React #418) */, stdio: ["ignore", "inherit", "inherit"] });
  children.push(server);
  let stopping = false;
  const stop = async () => { if (stopping) return; stopping = true; for (const child of children) { try { child.kill("SIGTERM"); } catch {} } await delay(3000); for (const child of children) if (child.exitCode === null) { try { child.kill("SIGKILL"); } catch {} } standIn.server.close(); await world.destroy(); await dropDisposableTestDatabase(outer.url); try { unlinkSync(STATE); } catch {} process.exit(0); };
  process.on("SIGTERM", stop); process.on("SIGINT", stop);
  for (let i = 0; i < 240; i += 1) { try { const r = await fetch(`${base}/api/career/job-pools`); if (r.status === 200) { await r.json(); break; } } catch {} await delay(500); }
  // Pools through the real upload route: PINK's validation pool and the DLL engineering test pool.
  const post = async (body: string) => (await (await fetch(`${base}/api/career/job-pools`, { method: "POST", headers: { "content-type": "application/json", "x-condyn-principal-actor-id": "GRUEN_AUTO_LAB" }, body })).json()) as { jobPoolUploadId?: string; upload?: { jobPoolUploadId: string } };
  // The three DLL test pools (docs/examples/job-pool-tests), unless LAB_NO_POOLS=1 (the SKIPPED · NO_ACTIVE_POOLS path).
  const noPools = process.env.LAB_NO_POOLS === "1";
  const uploads: Record<string, unknown> = {};
  if (!noPools) for (const name of ["ENGINEERING", "AI_DATA", "ENTERPRISE_SCALE"]) uploads[name] = await post(readFileSync(`${W}/docs/examples/job-pool-tests/DLL_JOBPOOL_${name}.json`, "utf8"));
  const id = (value: { jobPoolUploadId?: string; upload?: { jobPoolUploadId: string } }) => value.jobPoolUploadId ?? value.upload?.jobPoolUploadId ?? null;
  // The real worker, unchanged, with the stand-in as Gemini and the archive on (it registers the archive table on this disposable database).
  const worker = spawn(process.execPath, [resolve(W, "node_modules/tsx/dist/cli.mjs"), resolve(W, "scripts/run-career-worker.ts")], { cwd: W, env: { ...process.env, ...common, GEMINI_API_KEY: "gruen-lab-dummy-not-a-key", GEMINI_MODEL: "gruen-standin-model", GOOGLE_GEMINI_BASE_URL: `http://127.0.0.1:${standIn.port}`, PROMPT_ENCRYPTION_KEY: randomBytes(32).toString("base64"), CAREER_WORKER_ID: "gruen-auto-lab-worker" }, stdio: ["ignore", "pipe", "pipe"] });
  children.push(worker);
  const workerLog = resolve(DIR, "worker.log");
  worker.stdout?.on("data", chunk => appendFileSync(workerLog, String(chunk)));
  worker.stderr?.on("data", chunk => appendFileSync(workerLog, String(chunk)));
  // URL BOUNDARY CLOSURE: one analysis row without any job (as earlier analyses were stored) — its boundary cannot be resolved.
  const { buildSeededAnalysis } = await import(`${W}/test/career/job-pool/fixtures/job-pool-postgres-world`);
  const { PostgresCareerAnalysisRepository } = await import(`${W}/lib/career/repositories/postgres`);
  const { drizzle } = await import(fromRepo("drizzle-orm/postgres-js"));
  const unrecorded = buildSeededAnalysis();
  unrecorded.structured_data.analysis.metadata.analysis_id = "ANL_GRUEN_LAB_NO_JOB";
  await new PostgresCareerAnalysisRepository(drizzle(world.sql)).save(unrecorded);
  const state = { unrecordedAnalysisId: "ANL_GRUEN_LAB_NO_JOB", port: PORT, base, database: world.databaseName, pid: process.pid, serverPid: server.pid, workerPid: worker.pid, standInPort: standIn.port, token, legacyAnalysisId: world.analysisId, sampleUploadId: world.sampleUploadId ?? null, uploads: Object.fromEntries(Object.entries(uploads).map(([k, v]) => [k, id(v as never)])), semantic: process.env.LAB_SEMANTIC !== "off" };
  writeFileSync(STATE, JSON.stringify(state, null, 2), { mode: 0o600 });
  console.log(`LAB READY ${base} pools=${Object.keys(state.uploads).length} semantic=${state.semantic} worker=${worker.pid}`);
})().catch(error => { console.error(error); process.exit(1); });
