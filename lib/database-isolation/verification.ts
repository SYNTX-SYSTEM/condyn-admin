import { randomBytes } from "node:crypto";
import postgres from "postgres";
import {
  classifyAuthorizedApplicationDatabaseUrl,
  classifyTestDatabaseUrl,
  DISPOSABLE_TEST_DATABASE_PATTERN,
  disposableTestDatabaseMarker,
  isProtectedDatabaseName,
  maintenanceUrlFor,
  MAINTENANCE_DATABASE_NAMES,
  SHARED_PROTECTED_DATABASE_NAMES
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

/**
 * BOUNDARY B-ENTRY, SERVER LIMB (§91 A-G410, from PINK §32).
 *
 * The URL policy checks the HOST and never the port, so two servers on one host were ONE server to this
 * boundary — and on a developer machine the shared `condyn` server and a disposable test server both
 * answer on loopback. Pointed at the shared server, every URL guard passed verbatim: the only thing
 * holding a test run off it was one character in an untracked env file.
 *
 * The remedy is deliberately NOT a port allowlist. 5432 is a legitimate port for a disposable server,
 * this boundary's own policy tests are written against it, and a number cannot say which server it is.
 * Instead the SERVER is identified positively, the same way this module already identifies a DATABASE:
 * a server that holds a protected shared database IS the shared server, whatever port it answers on,
 * and is never a provisioning basis.
 *
 * The probe is a parameter for the same reason `CurrentDatabaseProbe` is — so the refusal path can be
 * proven by a test with no database at all.
 */
export type DatabaseNamesProbe = (maintenanceUrl: string) => Promise<readonly string[]>;

export const probeDatabaseNames: DatabaseNamesProbe = async maintenanceUrl => {
  const sql = postgres(maintenanceUrl, { ...options, connection: { default_transaction_read_only: true } });
  try {
    const rows = await sql`SELECT datname FROM pg_database` as unknown as Array<{ datname: string }>;
    return rows.map(row => row.datname);
  } finally {
    await sql.end({ timeout: 5 });
  }
};

/**
 * The protected names that do NOT exist on every PostgreSQL server. `postgres`, `template0` and
 * `template1` are present everywhere and so witness nothing; what remains identifies the shared server.
 */
export const SHARED_SERVER_WITNESS_NAMES: readonly string[] = Object.freeze(
  SHARED_PROTECTED_DATABASE_NAMES.filter(name => !(MAINTENANCE_DATABASE_NAMES as readonly string[]).includes(name))
);

/** Refuses a provisioning basis that is the shared server. Read-only; refuses before anything is created. */
export async function assertDisposableServer(
  basisUrl: string,
  probe: DatabaseNamesProbe = probeDatabaseNames
): Promise<{ databaseCount: number }> {
  if (SHARED_SERVER_WITNESS_NAMES.length === 0) {
    fail("ERR_TEST_DATABASE_ISOLATION_SERVER_UNWITNESSABLE", "no protected database name distinguishes the shared server from a disposable one; this check cannot hold and must not be reported as holding");
  }
  const names = await probe(maintenanceUrlFor(basisUrl));
  const witnesses = SHARED_SERVER_WITNESS_NAMES.filter(name => names.includes(name));
  if (witnesses.length > 0) {
    fail("ERR_TEST_DATABASE_ISOLATION_SHARED_SERVER", `this server holds the protected database ${witnesses.join(", ")}, so it is the shared server and never a provisioning basis — the host and port guards cannot tell it from a disposable server, which is why the server itself is identified`);
  }
  return { databaseCount: names.length };
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
  /* the server limb, before anything is created on it — this is the one choke point every creation goes
     through, so guarding it here guards run.ts, create.ts and every integration test at once. */
  await assertDisposableServer(basisUrl);
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
