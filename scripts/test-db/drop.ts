import { dropDisposableTestDatabase } from "../../lib/database-isolation/verification";

/** Drops exactly one positively identified disposable test database (name pattern + marker). */
async function main(): Promise<void> {
  const target = process.argv[2] ?? process.env.DATABASE_URL;
  if (!target) throw new Error("ERR_TEST_DATABASE_DROP_TARGET_MISSING: pass the disposable DATABASE_URL");
  const result = await dropDisposableTestDatabase(target);
  console.log(`dropped ${result.droppedDatabaseName}`);
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
