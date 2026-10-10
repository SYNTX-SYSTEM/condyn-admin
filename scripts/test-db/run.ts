import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { createDisposableTestDatabase, dropDisposableTestDatabase } from "../../lib/database-isolation/verification";
import { requireTestDatabaseAdminUrl } from "./admin-url";

/**
 * Isolated test run: create a marked disposable database, run vitest against it, drop it.
 * Any arguments are passed to `vitest run`. The exit code is vitest's.
 */
async function main(): Promise<void> {
  const created = await createDisposableTestDatabase(requireTestDatabaseAdminUrl());
  console.info(`[test-db] created ${created.databaseName}`);
  let exitCode = 1;
  try {
    exitCode = await new Promise<number>((done, failed) => {
      const child = spawn(process.execPath, [resolve(process.cwd(), "node_modules/vitest/vitest.mjs"), "run", ...process.argv.slice(2)], {
        stdio: "inherit",
        env: { ...process.env, DATABASE_URL: created.url }
      });
      child.once("error", failed);
      child.once("exit", code => done(code ?? 1));
    });
  } finally {
    const dropped = await dropDisposableTestDatabase(created.url);
    console.info(`[test-db] dropped ${dropped.droppedDatabaseName}`);
  }
  process.exit(exitCode);
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
