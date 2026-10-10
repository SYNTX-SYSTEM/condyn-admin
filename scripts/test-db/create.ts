import { createDisposableTestDatabase } from "../../lib/database-isolation/verification";
import { requireTestDatabaseAdminUrl } from "./admin-url";

/** Creates one marked disposable test database and prints its DATABASE_URL. */
async function main(): Promise<void> {
  const created = await createDisposableTestDatabase(requireTestDatabaseAdminUrl());
  console.log(created.url);
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
