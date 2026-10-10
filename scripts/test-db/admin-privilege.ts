import postgres from "postgres";

/**
 * Least privilege by default (owner decision 2026-10-10): the runner refuses a superuser admin
 * role unless TEST_DATABASE_ALLOW_SUPERUSER=1 is set explicitly. Checked on a read-only
 * connection to the maintenance database; the shared database is never contacted.
 */
export async function assertLeastPrivilegeAdmin(adminUrl: string): Promise<{ role: string; superuser: boolean }> {
  const sql = postgres(adminUrl, { max: 1, onnotice: () => undefined, connect_timeout: 10, connection: { default_transaction_read_only: true } });
  try {
    const [row] = await sql`SELECT current_user AS role, current_setting('is_superuser') = 'on' AS superuser` as unknown as Array<{ role: string; superuser: boolean }>;
    if (row.superuser && process.env.TEST_DATABASE_ALLOW_SUPERUSER !== "1") {
      throw new Error(`ERR_TEST_DATABASE_ADMIN_SUPERUSER: admin role ${row.role} is a superuser; use the least-privilege test role (scripts/test-db/provision-role.ts) or set TEST_DATABASE_ALLOW_SUPERUSER=1 explicitly`);
    }
    return { role: row.role, superuser: row.superuser };
  } finally {
    await sql.end({ timeout: 5 });
  }
}
