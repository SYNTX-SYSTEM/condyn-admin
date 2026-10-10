import postgres from "postgres";
import { LOOPBACK_HOSTS } from "../../lib/database-isolation/policy";

/**
 * One-time, idempotent provisioning of the least-privilege test role (owner action, needs a
 * superuser or CREATEROLE connection to the maintenance database).
 *
 * The role can log in and create databases; it is not a superuser, cannot create roles, inherits
 * nothing, and owns nothing in the shared database. It therefore cannot read, change, truncate,
 * alter or drop any existing table in `condyn`, nor drop or comment the database itself, even if a
 * test bypasses every code-level guard. It fully owns the disposable `condyn_test_<16 hex>` databases
 * it creates.
 *
 * Environment: TEST_DATABASE_PROVISIONER_URL (privileged maintenance URL, e.g.
 * postgresql://postgres:<pw>@localhost:5432/postgres), TEST_DATABASE_ROLE (default condyn_test_runner),
 * TEST_DATABASE_ROLE_PASSWORD (required). Prints the TEST_DATABASE_ADMIN_URL to use with the runner.
 * ROLE PROVISIONING != TEST EXECUTION: nothing here touches any database but the maintenance catalog.
 */
const fail = (code: string, detail: string): never => { throw new Error(`${code}: ${detail}`); };
const rolePattern = /^[a-z][a-z0-9_]{2,62}$/;

async function main(): Promise<void> {
  const provisioner = process.env.TEST_DATABASE_PROVISIONER_URL?.trim() ?? "";
  if (provisioner === "") fail("ERR_TEST_DATABASE_PROVISIONER_URL_MISSING", "set TEST_DATABASE_PROVISIONER_URL to a privileged maintenance URL");
  const url = new URL(provisioner);
  if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") fail("ERR_TEST_DATABASE_PROVISIONER_URL_MALFORMED", url.protocol);
  const extra = (process.env.TEST_DATABASE_ALLOWED_HOSTS ?? "").split(",").map(host => host.trim().toLowerCase()).filter(Boolean);
  if (![...LOOPBACK_HOSTS, ...extra].includes(url.hostname.toLowerCase())) fail("ERR_TEST_DATABASE_PROVISIONER_URL_NON_LOCAL_HOST", url.hostname);
  if (url.pathname !== "/postgres" || url.search !== "" || url.hash !== "") fail("ERR_TEST_DATABASE_PROVISIONER_URL_NOT_MAINTENANCE", url.pathname);
  const role = process.env.TEST_DATABASE_ROLE?.trim() || "condyn_test_runner";
  if (!rolePattern.test(role) || role === "postgres") fail("ERR_TEST_DATABASE_ROLE_NAME_INVALID", role);
  const password = process.env.TEST_DATABASE_ROLE_PASSWORD ?? "";
  if (password.length < 24 || /['\\\s]/.test(password)) fail("ERR_TEST_DATABASE_ROLE_PASSWORD_INVALID", "at least 24 characters, no quotes, backslashes or whitespace");

  const sql = postgres(provisioner, { max: 1, onnotice: () => undefined, connect_timeout: 10 });
  try {
    const quoted = `"${role.replaceAll('"', '""')}"`;
    await sql.unsafe(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${role}') THEN CREATE ROLE ${quoted} LOGIN CREATEDB NOSUPERUSER NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS; END IF; END $$;`);
    await sql.unsafe(`ALTER ROLE ${quoted} WITH LOGIN CREATEDB NOSUPERUSER NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS PASSWORD '${password}'`);
    const [attributes] = await sql`SELECT rolsuper, rolcreatedb, rolcreaterole, rolinherit, rolcanlogin, rolreplication, rolbypassrls FROM pg_roles WHERE rolname = ${role}` as unknown as Array<Record<string, boolean>>;
    const [memberships] = await sql`SELECT count(*)::int AS count FROM pg_auth_members WHERE member = (SELECT oid FROM pg_roles WHERE rolname = ${role})` as unknown as Array<{ count: number }>;
    const owned = await sql`SELECT datname FROM pg_database WHERE pg_get_userbyid(datdba) = ${role} AND datname !~ '^condyn_test_[0-9a-f]{16}$'` as unknown as Array<{ datname: string }>;
    if (!attributes || attributes.rolsuper || attributes.rolcreaterole || attributes.rolinherit || !attributes.rolcanlogin || !attributes.rolcreatedb || attributes.rolreplication || attributes.rolbypassrls) fail("ERR_TEST_DATABASE_ROLE_ATTRIBUTES_INVALID", JSON.stringify(attributes));
    if (memberships.count !== 0) fail("ERR_TEST_DATABASE_ROLE_HAS_MEMBERSHIPS", String(memberships.count));
    if (owned.length !== 0) fail("ERR_TEST_DATABASE_ROLE_OWNS_PROTECTED_DATABASE", owned.map(row => row.datname).join(","));
    const admin = new URL(provisioner);
    admin.username = role;
    admin.password = password;
    console.log(admin.toString());
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
