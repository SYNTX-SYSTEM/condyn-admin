import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";

/**
 * Proof of the owner rule of 2026-10-14: the job-scope requirement covers every execution path of the
 * Career-Analysis pipeline, including direct calls by development scripts; no bypass by test or retry code.
 *
 * Every development script that would reach the pipeline or Gemini is started as its own process, without a
 * selection and with an invalid selection (a stored DRAFT pool). Each must stop with exit code 3 and the owner's
 * message before any network access. All children run under a network sentinel (scripts/proofs/support/
 * network-sentinel.cjs) with a dummy GEMINI_API_KEY: any attempt to reach Gemini would be recorded. One script with a
 * mock provider (debug.ts) also runs with a valid selection, to show the gate opens for a valid stored job.
 * No live Gemini call is made.
 *
 *   DATABASE_URL=<disposable> npx tsx scripts/proofs/job-scope-all-paths.ts [--label name]
 */
const ROOT = resolve(__dirname, "../..");
const args = process.argv.slice(2);
const label = args.includes("--label") ? args[args.indexOf("--label") + 1] : `all-paths-${new Date().toISOString().replace(/[:.]/g, "-")}`;
const MESSAGE = "Bitte wählen Sie einen Job aus.";
const SENTINEL = resolve(ROOT, "scripts/proofs/support/network-sentinel.cjs");

/** Development scripts that call the Career-Analysis pipeline or Gemini (tracked in the repository). */
const SCRIPTS = [
  "scripts/test-pipeline-live.ts", "scripts/test-multi-source-live.ts", "scripts/test-live-action-chain.ts", "scripts/test-live-decision-chain.ts",
  "scripts/test-live-feedback-chain.ts", "scripts/test-live-learning-chain.ts", "scripts/test-live-outcome-chain.ts", "scripts/test-live-recommendation-proof.ts",
  "scripts/probe-gemini.ts", "scripts/list-models.ts", "debug.ts", "test-pdf.ts", "test-github.ts", "trace-pdf.ts", "trace-pdf-5.ts", "forensics-step2.ts",
  "bisection.ts", "schema-bisection.ts", "schema-bisection-mjs.ts", "test-schema.ts"
];

async function main() {
  const { verifyDisposableTestDatabase } = await import("../../lib/database-isolation/verification");
  const verified = await verifyDisposableTestDatabase(process.env.DATABASE_URL);
  const { db } = await import("../../lib/career/db/client");
  const { ensureJobPoolPersistenceRegistration } = await import("../../lib/career/job-pool/local-composition");
  const { createJobPoolApplication } = await import("../../lib/career/job-pool/application");
  if (await ensureJobPoolPersistenceRegistration() !== "REGISTERED") throw new Error("ERR_PROOF_JOB_POOL_PERSISTENCE");
  const application = createJobPoolApplication({ database: drizzle(db.$client), analyses: { load: async () => null } });
  const engineeringRaw = readFileSync(resolve(ROOT, "docs/examples/job-pool-tests/DLL_JOBPOOL_ENGINEERING.json"), "utf8");
  const engineering = (await application.upload(engineeringRaw, "job-scope-all-paths-proof")).view.jobPoolUploadId;
  const draftPool = JSON.parse(engineeringRaw); draftPool.pool.status = "DRAFT";
  const draft = (await application.upload(JSON.stringify(draftPool), "job-scope-all-paths-proof")).view.jobPoolUploadId;
  await db.$client.end({ timeout: 5 });
  const kestrel = "role_kestrel_frontend_architect";

  const work = mkdtempSync(join(tmpdir(), "job-scope-all-paths-"));
  const networkLog = join(work, "network.jsonl");
  writeFileSync(networkLog, "");
  const baseEnv: Record<string, string | undefined> = { ...process.env, GEMINI_API_KEY: "proof-dummy-not-a-key", GEMINI_MODEL: "proof-no-model", NODE_OPTIONS: `--require ${SENTINEL}`, PROOF_NETWORK_LOG: networkLog };
  delete baseEnv.CONDYN_JOB_POOL_UPLOAD_ID;
  delete baseEnv.CONDYN_POOL_ROLE_ID;

  const run = (argv: string[], env: Record<string, string | undefined>) => new Promise<{ exitCode: number | null; output: string }>(done => {
    const child = spawn(process.execPath, argv, { cwd: work, env, stdio: ["ignore", "pipe", "pipe"] });
    let output = "";
    child.stdout.on("data", chunk => { output += chunk; });
    child.stderr.on("data", chunk => { output += chunk; });
    const timer = setTimeout(() => child.kill("SIGKILL"), 90_000);
    child.once("exit", code => { clearTimeout(timer); done({ exitCode: code, output }); });
  });
  const tsx = (script: string, env: Record<string, string | undefined>) => run([resolve(ROOT, "node_modules/tsx/dist/cli.mjs"), resolve(ROOT, script)], env);
  const lines = () => readFileSync(networkLog, "utf8").split("\n").filter(Boolean).length;

  const checks: Array<{ id: string; pass: boolean; observed: unknown }> = [];
  const check = (id: string, pass: boolean, observed: unknown) => { checks.push({ id, pass, observed }); console.log(`[proof] ${pass ? "PASS" : "FAIL"} ${id} ${JSON.stringify(observed)}`); };
  const refusalLine = (output: string) => output.split("\n").find(line => line.startsWith("ERR_JOB_SCOPE_")) ?? output.trim().split("\n").slice(-1)[0]?.slice(0, 200) ?? "";

  // Positive control: the sentinel records and blocks an attempt to reach Gemini.
  const control = await run(["-e", "fetch('https://generativelanguage.googleapis.com/v1beta/models').then(() => process.exit(0), () => process.exit(7))"], baseEnv);
  check("S0_SENTINEL_BLOCKS_AND_RECORDS", control.exitCode === 7 && lines() === 1, { exitCode: control.exitCode, recorded: lines() });
  writeFileSync(networkLog, "");

  for (const script of SCRIPTS) {
    const missing = await tsx(script, baseEnv);
    const missingLine = refusalLine(missing.output);
    check(`NO_SELECTION ${script}`, missing.exitCode === 3 && missingLine === `ERR_JOB_SCOPE_REQUIRED: ${MESSAGE}` || missing.exitCode === 3 && missingLine.startsWith(`ERR_JOB_SCOPE_REQUIRED: ${MESSAGE} (`),
      { exitCode: missing.exitCode, refusal: missingLine.split(" (")[0] });
    const invalid = await tsx(script, { ...baseEnv, CONDYN_JOB_POOL_UPLOAD_ID: draft, CONDYN_POOL_ROLE_ID: kestrel });
    const invalidLine = refusalLine(invalid.output);
    check(`INVALID_SELECTION_DRAFT_POOL ${script}`, invalid.exitCode === 3 && invalidLine.startsWith(`ERR_JOB_SCOPE_INVALID: ${MESSAGE}`), { exitCode: invalid.exitCode, refusal: invalidLine.split(" (")[0] });
  }
  const unknownRole = await tsx("scripts/test-pipeline-live.ts", { ...baseEnv, CONDYN_JOB_POOL_UPLOAD_ID: engineering, CONDYN_POOL_ROLE_ID: "  role pink padded  " });
  check("INVALID_SELECTION_ROLE_NOT_IN_POOL scripts/test-pipeline-live.ts", unknownRole.exitCode === 3 && refusalLine(unknownRole.output).startsWith(`ERR_JOB_SCOPE_INVALID: ${MESSAGE}`), { exitCode: unknownRole.exitCode, refusal: refusalLine(unknownRole.output).split(" (")[0] });
  check("N1_NO_NETWORK_ATTEMPT_BY_ANY_REFUSED_SCRIPT", lines() === 0, { recorded: lines() });

  // The gate opens for a valid stored job: debug.ts runs the pipeline with its mock provider (no Gemini).
  const valid = await tsx("debug.ts", { ...baseEnv, CONDYN_JOB_POOL_UPLOAD_ID: engineering, CONDYN_POOL_ROLE_ID: kestrel });
  const debugOutput = existsSync(join(work, "output3.txt")) ? readFileSync(join(work, "output3.txt"), "utf8") : "";
  check("V1_VALID_SELECTION_OPENS_THE_PIPELINE debug.ts (mock provider)", valid.exitCode === 0 && debugOutput.includes("\"success\"") && !debugOutput.includes("ERR_JOB_SCOPE"), { exitCode: valid.exitCode, pipelineResultWritten: debugOutput.length > 0, refused: debugOutput.includes("ERR_JOB_SCOPE") });
  check("N2_NO_NETWORK_ATTEMPT_AT_ALL", lines() === 0, { recorded: lines() });
  rmSync(work, { recursive: true, force: true });

  const summary = {
    rule: "Job-scope requirement on every execution path of the Career-Analysis pipeline, including development scripts; no bypass (owner 2026-10-14)",
    label, gitSha: process.env.PROOF_GIT_SHA ?? null, database: `disposable test database ${verified.databaseName} (dropped after the run)`,
    gemini: "no live call: dummy GEMINI_API_KEY, every child under the network sentinel",
    pools: { engineering: { jobPoolUploadId: engineering, status: "ACTIVE" }, engineeringDraft: { jobPoolUploadId: draft, status: "DRAFT" } },
    scripts: SCRIPTS, checks, passed: checks.every(item => item.pass)
  };
  const text = `${JSON.stringify(summary, null, 2)}\n`.split(ROOT).join("<repo>");
  await mkdir(resolve(ROOT, "docs/proofs/job-pool-first-boundary"), { recursive: true });
  writeFileSync(resolve(ROOT, "docs/proofs/job-pool-first-boundary", `${label}.json`), text);
  console.log(`[proof] ${summary.passed ? "ALL CHECKS PASSED" : "CHECKS FAILED"} — docs/proofs/job-pool-first-boundary/${label}.json`);
  process.exitCode = summary.passed ? 0 : 2;
}

main().catch(error => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
