import { describe, expect, it } from "vitest";
import { maintenanceUrlFor, requireTestDatabaseUrl } from "../../lib/database-isolation/policy";
import { assertLeastPrivilegeAdmin } from "../../scripts/test-db/admin-privilege";

/** The runner refuses a superuser admin role by default; the explicit flag is the only escape. */
describe("runner admin role: least privilege by default", () => {
  const maintenance = maintenanceUrlFor(requireTestDatabaseUrl());

  it("refuses a superuser without TEST_DATABASE_ALLOW_SUPERUSER=1 and admits a least-privilege role unconditionally", async () => {
    const previous = process.env.TEST_DATABASE_ALLOW_SUPERUSER;
    try {
      process.env.TEST_DATABASE_ALLOW_SUPERUSER = "1";
      const identity = await assertLeastPrivilegeAdmin(maintenance);
      delete process.env.TEST_DATABASE_ALLOW_SUPERUSER;
      if (identity.superuser) {
        await expect(assertLeastPrivilegeAdmin(maintenance)).rejects.toThrow("ERR_TEST_DATABASE_ADMIN_SUPERUSER");
        process.env.TEST_DATABASE_ALLOW_SUPERUSER = "yes";
        await expect(assertLeastPrivilegeAdmin(maintenance)).rejects.toThrow("ERR_TEST_DATABASE_ADMIN_SUPERUSER");
      } else {
        expect(await assertLeastPrivilegeAdmin(maintenance)).toEqual({ role: identity.role, superuser: false });
      }
    } finally {
      if (previous === undefined) delete process.env.TEST_DATABASE_ALLOW_SUPERUSER;
      else process.env.TEST_DATABASE_ALLOW_SUPERUSER = previous;
    }
  });
});
