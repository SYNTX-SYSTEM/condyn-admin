import { randomBytes } from "node:crypto";
import postgres from "postgres";
import {
  classifyAuthorizedApplicationDatabaseUrl,
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
 * The one read-only probe both bases use: which database did this URL actually reach? It is a
 * parameter so the connection path itself can be proven by a test without a database (PINK 1c);
 * production always uses `probeCurrentDatabase`, which really connects.
 */
export type CurrentDatabaseProbe = (url: string) => Promise<{ name: string; marker: string | null } | null>;

export const probeCurrentDatabase: CurrentDatabaseProbe = async url => {
  const sql = postgres(url, { ...options, connection: { default_transaction_read_only: true } });
  try {
    const rows = await sql`SELECT current_database() AS name, shobj_description(oid, 'pg_database') AS marker FROM pg_database WHERE datname = current_database()` as unknown as Array<{ name: string; marker: string | null }>;
    return rows.length === 1 ? { name: rows[0].name, marker: rows[0].marker } : null;
  } finally {
    await sql.end({ timeout: 5 });
  }
};

/**
 * Positive identification of a disposable test database: URL policy, then a read-only
 * connection that must report exactly this database and carry the disposable marker.
 * Refusals by policy happen before any connection is attempted.
 */
export async function verifyDisposableTestDatabase(
  url: string | undefined,
  probe: CurrentDatabaseProbe = probeCurrentDatabase
): Promise<{ url: string; databaseName: string }> {
  const verdict = classifyTestDatabaseUrl(url);
  if (!verdict.ok) return fail(`ERR_TEST_DATABASE_ISOLATION_${verdict.code}`, verdict.detail);
  const reached = await probe(verdict.url);
  if (reached === null || reached.name !== verdict.databaseName) fail("ERR_TEST_DATABASE_ISOLATION_IDENTITY_MISMATCH", `connected to ${reached?.name ?? "nothing"}, expected ${verdict.databaseName}`);
  if (reached!.marker !== disposableTestDatabaseMarker(verdict.databaseName)) fail("ERR_TEST_DATABASE_ISOLATION_NOT_MARKED", `database ${verdict.databaseName} carries no disposable marker`);
  return { url: verdict.url, databaseName: verdict.databaseName };
}

/**
 * Positive identification of the application database a real server or worker process declares as its
 * own (boundary B-ENTRY second basis). Same rigour as the disposable path: the URL is classified before
 * any connection, then a read-only connection must report exactly this database. It carries NO disposable
 * marker requirement — that is the whole difference — and it is unreachable from a test runner or without
 * the explicit opt-in, so test isolation is unchanged.
 */
export async function verifyAuthorizedApplicationDatabase(
  url: string | undefined,
  underTestRunner: boolean = process.env.VITEST !== undefined || process.env.VITEST_WORKER_ID !== undefined,
  sharedDatabaseOptIn: string | undefined = process.env.CONDYN_ALLOW_SHARED_DATABASE,
  probe: CurrentDatabaseProbe = probeCurrentDatabase
): Promise<{ url: string; databaseName: string }> {
  const verdict = classifyAuthorizedApplicationDatabaseUrl(url, underTestRunner, sharedDatabaseOptIn);
  if (!verdict.ok) return fail(`ERR_APPLICATION_DATABASE_${verdict.code}`, verdict.detail);
  const reached = await probe(verdict.url);
  if (reached === null || reached.name !== verdict.databaseName) {
    fail("ERR_APPLICATION_DATABASE_IDENTITY_MISMATCH", `connected to ${reached?.name ?? "nothing"}, expected ${verdict.databaseName}`);
  }
  return { url: verdict.url, databaseName: verdict.databaseName };
}

export type ProvisionableDatabaseBasis = "DISPOSABLE_TEST_DATABASE" | "AUTHORIZED_APPLICATION_DATABASE";

/**
 * The ONE place where both bases of boundary B-ENTRY are resolved: a disposable test database, else the
 * application database that a real server or worker process explicitly authorised. Returns null when
 * neither holds, so every gate refuses the same way for the same reasons.
 *
 * Development scripts and diagnostics deliberately do NOT come through here: `resolveScriptJobScope`
 * stays bound to the disposable basis alone, so an agent operation can still never reach a real database.
 */
/** A refusal used to be silent (PINK 1a): the same reason is logged once, not on every request. */
let lastRefusal: string | undefined;

export function resetProvisionableDatabaseRefusalLog(): void {
  lastRefusal = undefined;
}

export async function verifyProvisionableDatabase(
  url: string | undefined = process.env.DATABASE_URL,
  log: (message: string) => void = message => console.warn(message)
): Promise<{ url: string; databaseName: string; basis: ProvisionableDatabaseBasis } | null> {
  const disposable = await verifyDisposableTestDatabase(url).then(result => ({ result }), (error: unknown) => ({ error }));
  if ("result" in disposable) { lastRefusal = undefined; return { ...disposable.result, basis: "DISPOSABLE_TEST_DATABASE" }; }
  const application = await verifyAuthorizedApplicationDatabase(url).then(result => ({ result }), (error: unknown) => ({ error }));
  if ("result" in application) { lastRefusal = undefined; return { ...application.result, basis: "AUTHORIZED_APPLICATION_DATABASE" }; }
  const reason = `ERR_JOB_POOL_PERSISTENCE_NOT_PROVISIONED: neither basis of boundary B-ENTRY holds.`
    + ` disposable: ${message(disposable.error)}. application: ${message(application.error)}`;
  if (reason !== lastRefusal) { lastRefusal = reason; log(reason); }
  return null;
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
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
