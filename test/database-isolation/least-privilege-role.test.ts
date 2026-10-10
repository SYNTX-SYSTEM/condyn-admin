import postgres from "postgres";
import { describe, expect, it } from "vitest";
import { maintenanceUrlFor, requireTestDatabaseUrl, SHARED_PROTECTED_DATABASE_NAMES } from "../../lib/database-isolation/policy";

/**
 * Least-privilege proof for the role that runs the tests (database safety architecture, layer 4).
 *
 * Runs against the maintenance catalog of the server the verified disposable database lives on; it
 * never connects to the shared database. A superuser admin role cannot be proven least-privileged,
 * so under a superuser the proof is reported as skipped (UNVERIFIED), never as passed.
 *
 * ROLE != GUARD: this layer holds even if every code-level guard is bypassed, because PostgreSQL
 * denies the role every privilege on objects it does not own.
 */
const verified = requireTestDatabaseUrl();
const maintenance = maintenanceUrlFor(verified);
const options = { max: 1, onnotice: () => undefined, connect_timeout: 10, connection: { default_transaction_read_only: true } } as const;

async function roleFacts() {
  const sql = postgres(maintenance, options);
  try {
    const [who] = await sql`SELECT current_user AS name, current_setting('is_superuser') = 'on' AS superuser` as unknown as Array<{ name: string; superuser: boolean }>;
    const [attributes] = await sql`SELECT rolsuper, rolcreatedb, rolcreaterole, rolinherit, rolreplication, rolbypassrls FROM pg_roles WHERE rolname = current_user` as unknown as Array<Record<string, boolean>>;
    const [memberships] = await sql`SELECT count(*)::int AS count FROM pg_auth_members WHERE member = (SELECT oid FROM pg_roles WHERE rolname = current_user)` as unknown as Array<{ count: number }>;
    const owned = await sql`SELECT datname FROM pg_database WHERE pg_get_userbyid(datdba) = current_user ORDER BY datname` as unknown as Array<{ datname: string }>;
    const protectedOwners = await sql`SELECT datname, pg_get_userbyid(datdba) AS owner FROM pg_database WHERE datname = ANY(${[...SHARED_PROTECTED_DATABASE_NAMES]}::text[]) ORDER BY datname` as unknown as Array<{ datname: string; owner: string }>;
    const createOnProtected = await sql`SELECT datname, has_database_privilege(current_user, datname, 'CREATE') AS create FROM pg_database WHERE datname = ANY(${[...SHARED_PROTECTED_DATABASE_NAMES]}::text[]) ORDER BY datname` as unknown as Array<{ datname: string; create: boolean }>;
    return { who, attributes, memberships, owned, protectedOwners, createOnProtected };
  } finally {
    await sql.end({ timeout: 5 });
  }
}

describe("least-privilege test role (maintenance catalog only, never the shared database)", () => {
  it("reports the admin role identity; a superuser is UNVERIFIED for this proof", async (context) => {
    const facts = await roleFacts();
    console.info(`[least-privilege] role=${facts.who.name} superuser=${facts.who.superuser}`);
    if (facts.who.superuser) context.skip(`admin role ${facts.who.name} is a superuser: least privilege cannot be proven (UNVERIFIED)`);
    expect(facts.who.superuser).toBe(false);
  });

  it("holds no privilege path to the protected databases: not superuser, no CREATEROLE, no inheritance, no memberships, owns and may create in none of them", async (context) => {
    const facts = await roleFacts();
    if (facts.who.superuser) context.skip("superuser admin role: UNVERIFIED");
    expect(facts.attributes).toMatchObject({ rolsuper: false, rolcreaterole: false, rolinherit: false, rolreplication: false, rolbypassrls: false, rolcreatedb: true });
    expect(facts.memberships.count).toBe(0);
    expect(facts.owned.filter(row => !/^condyn_test_[0-9a-f]{16}$/.test(row.datname))).toEqual([]);
    for (const row of facts.protectedOwners) expect(row.owner).not.toBe(facts.who.name);
    for (const row of facts.createOnProtected) expect(row.create).toBe(false);
  });

  it("owns the verified disposable database it runs against", async (context) => {
    const facts = await roleFacts();
    if (facts.who.superuser) context.skip("superuser admin role: UNVERIFIED");
    const name = new URL(verified).pathname.slice(1);
    expect(facts.owned.map(row => row.datname)).toContain(name);
  });
});
