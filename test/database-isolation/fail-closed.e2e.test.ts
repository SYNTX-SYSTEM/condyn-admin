import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { requireTestDatabaseUrl } from "../../lib/database-isolation/policy";

/**
 * End-to-end proof that a real vitest run fails closed: the child runs the canary test file
 * through the repository's own vitest configuration. For every refused URL the global gate
 * must stop the run before any test body executes (the canary file is never written).
 */
const verified = requireTestDatabaseUrl();
const unmarkedName = "condyn_test_ffffffffffffffff";

function runCanary(databaseUrl: string | undefined) {
  const dir = mkdtempSync(join(tmpdir(), "condyn-isolation-"));
  const canary = join(dir, "canary.txt");
  const env: Record<string, string> = {};
  for (const [key, value] of Object.entries(process.env)) if (value !== undefined && !key.startsWith("VITEST") && key !== "DATABASE_URL" && key !== "TEST_DATABASE_ALLOWED_HOSTS") env[key] = value;
  if (databaseUrl !== undefined) env.DATABASE_URL = databaseUrl;
  env.CONDYN_ISOLATION_CANARY_FILE = canary;
  const result = spawnSync(process.execPath, [resolve(process.cwd(), "node_modules/vitest/vitest.mjs"), "run", "test/database-isolation/canary.test.ts"], { cwd: process.cwd(), env: env as NodeJS.ProcessEnv, encoding: "utf8" as const, timeout: 120_000 });
  const ran = existsSync(canary);
  const ranWith = ran ? readFileSync(canary, "utf8") : null;
  rmSync(dir, { recursive: true, force: true });
  return { status: result.status, output: `${result.stdout}\n${result.stderr}`, ran, ranWith };
}

describe("fail-closed vitest runs (child process through the real configuration)", () => {
  it.each([
    ["unset", undefined, "ERR_TEST_DATABASE_ISOLATION_MISSING"],
    ["empty", "", "ERR_TEST_DATABASE_ISOLATION_MISSING"],
    ["whitespace", "   ", "ERR_TEST_DATABASE_ISOLATION_MISSING"],
    ["malformed", "not a url", "ERR_TEST_DATABASE_ISOLATION_MALFORMED"],
    ["no database path (maintenance fallback)", "postgresql://postgres:postgres@localhost:5432", "ERR_TEST_DATABASE_ISOLATION_AMBIGUOUS"],
    ["query redirect", `${verified}?dbname=condyn`, "ERR_TEST_DATABASE_ISOLATION_AMBIGUOUS"],
    ["shared condyn", "postgresql://postgres:postgres@localhost:5432/condyn", "ERR_TEST_DATABASE_ISOLATION_PROTECTED"],
    ["shared condyn via alias host on a closed port (no connection attempted)", "postgresql://postgres:postgres@127.0.0.1:1/condyn", "ERR_TEST_DATABASE_ISOLATION_PROTECTED"],
    ["maintenance database", "postgresql://postgres:postgres@localhost:5432/postgres", "ERR_TEST_DATABASE_ISOLATION_PROTECTED"],
    ["non-disposable name", "postgresql://postgres:postgres@localhost:5432/condyn_dll_0123456789abcdef", "ERR_TEST_DATABASE_ISOLATION_NOT_DISPOSABLE"],
    ["non-local host", "postgresql://postgres:postgres@db.example.com:5432/condyn_test_0123456789abcdef", "ERR_TEST_DATABASE_ISOLATION_NON_LOCAL_HOST"],
    ["pattern-valid but absent database", verified.replace(/condyn_test_[0-9a-f]{16}/, unmarkedName), "does not exist"],
  ])("refuses %s", (_label, databaseUrl, expected) => {
    const run = runCanary(databaseUrl);
    expect(run.status).not.toBe(0);
    expect(run.ran).toBe(false);
    expect(run.output).toContain(expected);
  }, 180_000);

  it("runs the canary against the verified disposable database", () => {
    const run = runCanary(verified);
    expect(run.status, run.output).toBe(0);
    expect(run.ranWith).toBe(verified);
  }, 180_000);
});
