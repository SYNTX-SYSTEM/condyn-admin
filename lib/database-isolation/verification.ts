import { randomBytes } from "node:crypto";
import postgres from "postgres";
import {
  classifyTestDatabaseUrl,
  DISPOSABLE_TEST_DATABASE_PATTERN,
  disposableTestDatabaseMarker,
  isProtectedDatabaseName,
  maintenanceUrlFor
} from "./policy";

const fail = (code: string, detail: string): never => { throw new Error(`${code}: ${detail}`); };
const quote = (identifier: string) => `"${identifier.replaceAll('"', '""')}"`;
const options = { max: 1, onnotice: () => undefined, connect_timeout: 10 } as const;

/**
 * Positive identification of a disposable test database: URL policy, then a read-only
 * connection that must report exactly this database and carry the disposable marker.
 * Refusals by policy happen before any connection is attempted.
 */
export async function verifyDisposableTestDatabase(url: string | undefined): Promise<{ url: string; databaseName: string }> {
  const verdict = classifyTestDatabaseUrl(url);
  if (!verdict.ok) return fail(`ERR_TEST_DATABASE_ISOLATION_${verdict.code}`, verdict.detail);
  const sql = postgres(verdict.url, { ...options, connection: { default_transaction_read_only: true } });
  try {
    const rows = await sql`SELECT current_database() AS name, shobj_description(oid, 'pg_database') AS marker FROM pg_database WHERE datname = current_database()` as unknown as Array<{ name: string; marker: string | null }>;
    if (rows.length !== 1 || rows[0].name !== verdict.databaseName) fail("ERR_TEST_DATABASE_ISOLATION_IDENTITY_MISMATCH", `connected to ${rows[0]?.name ?? "nothing"}, expected ${verdict.databaseName}`);
    if (rows[0].marker !== disposableTestDatabaseMarker(verdict.databaseName)) fail("ERR_TEST_DATABASE_ISOLATION_NOT_MARKED", `database ${verdict.databaseName} carries no disposable marker`);
    return { url: verdict.url, databaseName: verdict.databaseName };
  } finally {
    await sql.end({ timeout: 5 });
  }
}

/** A fresh name in the disposable pattern; unique per call. */
export function newDisposableTestDatabaseName(): string {
  return `condyn_test_${randomBytes(8).toString("hex")}`;
}

/** URL of `databaseName` on the same server and credentials as `basisUrl`. */
export function disposableTestDatabaseUrl(basisUrl: string, databaseName: string): string {
  const target = new URL(basisUrl);
  target.pathname = `/${databaseName}`;
  target.search = "";
  target.hash = "";
  return target.toString();
}

/**
 * Creates and marks the disposable test database `databaseName` on the server of `basisUrl`.
 * The basis is only used for host and credentials; its own database is never touched.
 */
export async function createDisposableTestDatabaseNamed(basisUrl: string, databaseName: string): Promise<{ url: string; databaseName: string }> {
  if (!DISPOSABLE_TEST_DATABASE_PATTERN.test(databaseName) || isProtectedDatabaseName(databaseName)) fail("ERR_TEST_DATABASE_ISOLATION_NAME", databaseName);
  const admin = postgres(maintenanceUrlFor(basisUrl), options);
  try {
    await admin.unsafe(`CREATE DATABASE ${quote(databaseName)}`);
    await admin.unsafe(`COMMENT ON DATABASE ${quote(databaseName)} IS '${disposableTestDatabaseMarker(databaseName)}'`);
  } finally {
    await admin.end({ timeout: 5 });
  }
  return verifyDisposableTestDatabase(disposableTestDatabaseUrl(basisUrl, databaseName));
}

/** Creates and marks a new disposable test database with a fresh name. */
export async function createDisposableTestDatabase(basisUrl: string): Promise<{ url: string; databaseName: string }> {
  return createDisposableTestDatabaseNamed(basisUrl, newDisposableTestDatabaseName());
}

/**
 * Drops one positively identified disposable test database. Protected names, names outside
 * the disposable pattern and unmarked databases are refused; the shared database is never a
 * cleanup target. Verifies afterwards that the database is gone.
 */
export async function dropDisposableTestDatabase(url: string): Promise<{ droppedDatabaseName: string }> {
  const { databaseName } = await verifyDisposableTestDatabase(url);
  if (isProtectedDatabaseName(databaseName)) return fail("ERR_TEST_DATABASE_ISOLATION_PROTECTED", databaseName);
  const admin = postgres(maintenanceUrlFor(url), options);
  try {
    const before = await admin`SELECT shobj_description(oid, 'pg_database') AS marker FROM pg_database WHERE datname = ${databaseName}` as unknown as Array<{ marker: string | null }>;
    if (before.length !== 1 || before[0].marker !== disposableTestDatabaseMarker(databaseName)) fail("ERR_TEST_DATABASE_ISOLATION_NOT_MARKED", databaseName);
    await admin`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = ${databaseName} AND pid <> pg_backend_pid()`;
    await admin.unsafe(`DROP DATABASE ${quote(databaseName)}`);
    const after = await admin`SELECT 1 FROM pg_database WHERE datname = ${databaseName}`;
    if (after.length !== 0) fail("ERR_TEST_DATABASE_ISOLATION_DROP_FAILED", databaseName);
    return { droppedDatabaseName: databaseName };
  } finally {
    await admin.end({ timeout: 5 });
  }
}
