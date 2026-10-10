import { createDisposableTestDatabase } from "../../lib/database-isolation/verification";
import { requireTestDatabaseAdminUrl } from "./admin-url";
import { assertLeastPrivilegeAdmin } from "./admin-privilege";

/** Creates one marked disposable test database and prints its DATABASE_URL. */
async function main(): Promise<void> {
  const adminUrl = requireTestDatabaseAdminUrl();
  const admin = await assertLeastPrivilegeAdmin(adminUrl);
  console.error(`[test-db] admin role ${admin.role}${admin.superuser ? " (superuser, explicitly allowed)" : " (least privilege)"}`);
  const created = await createDisposableTestDatabase(adminUrl);
  console.log(created.url);
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
