/**
 * Database isolation policy (owner mandate, 2026-10-10).
 *
 * The shared `condyn` database must never be modified by automated tests or agent
 * operations. This module is the single, dependency-free classification of database
 * URLs. It never connects anywhere; verification with a live connection lives in
 * `verification.ts`.
 *
 * MISSING URL != SHARED DATABASE. NAME PATTERN != IDENTITY (the marker is required too).
 */
export const SHARED_PROTECTED_DATABASE_NAMES = Object.freeze(["condyn", "postgres", "template0", "template1"] as const);
export const DISPOSABLE_TEST_DATABASE_PATTERN = /^condyn_test_[0-9a-f]{16}$/;
export const DISPOSABLE_TEST_DATABASE_MARKER_PREFIX = "CONDYN_DISPOSABLE_TEST_DATABASE ";
/** Unroutable by definition (RFC 2606 `.invalid`): a missing DATABASE_URL can never reach a real server. */
export const UNCONFIGURED_DATABASE_URL = "postgresql://database-url-not-configured.invalid:5432/database_url_not_configured";

export type TestDatabaseUrlRefusal = "MISSING" | "MALFORMED" | "AMBIGUOUS" | "PROTECTED" | "NOT_DISPOSABLE" | "NON_LOCAL_HOST";

/** Test databases live on a loopback host unless a host is explicitly allowlisted (comma-separated TEST_DATABASE_ALLOWED_HOSTS). */
export const LOOPBACK_HOSTS = Object.freeze(["localhost", "127.0.0.1", "[::1]", "::1"] as const);

export type TestDatabaseUrlVerdict =
  | { ok: true; url: string; databaseName: string; host: string; port: string }
  | { ok: false; code: TestDatabaseUrlRefusal; detail: string };

const refuse = (code: TestDatabaseUrlRefusal, detail: string): TestDatabaseUrlVerdict => ({ ok: false, code, detail });

export function disposableTestDatabaseMarker(databaseName: string): string {
  return `${DISPOSABLE_TEST_DATABASE_MARKER_PREFIX}${databaseName}`;
}

export function isProtectedDatabaseName(name: string): boolean {
  const lower = name.toLowerCase();
  return SHARED_PROTECTED_DATABASE_NAMES.some(protectedName => protectedName === lower);
}

/**
 * Classifies a URL that a test run wants to use. Only an explicit postgres URL with an
 * explicit host, no query or fragment, and exactly one path segment naming a disposable
 * `condyn_test_<16 hex>` database is accepted. Everything else is refused before any
 * connection is attempted.
 */
export function classifyTestDatabaseUrl(raw: string | undefined | null, allowedHosts: string | undefined = process.env.TEST_DATABASE_ALLOWED_HOSTS): TestDatabaseUrlVerdict {
  if (raw === undefined || raw === null || raw.trim() === "") return refuse("MISSING", "DATABASE_URL is not set");
  if (raw !== raw.trim()) return refuse("AMBIGUOUS", "DATABASE_URL has surrounding whitespace");
  let url: URL;
  try { url = new URL(raw); } catch { return refuse("MALFORMED", "DATABASE_URL is not a URL"); }
  if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") return refuse("MALFORMED", `protocol ${url.protocol} is not postgres`);
  if (url.hostname === "" || url.hostname.includes(",")) return refuse("AMBIGUOUS", "an explicit single host is required");
  const extraHosts = (allowedHosts ?? "").split(",").map(host => host.trim().toLowerCase()).filter(host => host.length > 0);
  if (![...LOOPBACK_HOSTS, ...extraHosts].includes(url.hostname.toLowerCase())) return refuse("NON_LOCAL_HOST", `host ${url.hostname} is neither loopback nor in TEST_DATABASE_ALLOWED_HOSTS`);
  if (url.search !== "" || url.hash !== "") return refuse("AMBIGUOUS", "query parameters and fragments could redirect the database and are refused");
  const match = /^\/([^/]+)$/.exec(url.pathname);
  if (!match) return refuse("AMBIGUOUS", "exactly one explicit database name is required (an empty name falls back to PGDATABASE)");
  const databaseName = match[1];
  if (databaseName.includes("%")) return refuse("AMBIGUOUS", "percent-encoded database names are refused");
  if (isProtectedDatabaseName(databaseName)) return refuse("PROTECTED", `database ${databaseName} is protected and never a test target`);
  if (!DISPOSABLE_TEST_DATABASE_PATTERN.test(databaseName)) return refuse("NOT_DISPOSABLE", `database ${databaseName} does not match condyn_test_<16 hex>`);
  return { ok: true, url: raw, databaseName, host: url.hostname, port: url.port || "5432" };
}

/** Same server and credentials, maintenance database `postgres`; used only for CREATE/DROP DATABASE of disposable databases. */
export function maintenanceUrlFor(url: string): string {
  const parsed = new URL(url);
  parsed.pathname = "/postgres";
  parsed.search = "";
  parsed.hash = "";
  return parsed.toString();
}

/** Explicit opt-in that only a real server or worker process may set; refused under any test runner. */
export const SHARED_DATABASE_OPT_IN_VARIABLE = "CONDYN_ALLOW_SHARED_DATABASE";

/**
 * Connection string for the application client. There is no fallback to any real database:
 * a missing URL resolves to an unroutable host. A protected database name (condyn, postgres,
 * template*) also resolves to the unroutable host unless the process explicitly opted in with
 * CONDYN_ALLOW_SHARED_DATABASE=1 AND is not running under a test runner.
 */
export function resolveApplicationDatabaseUrl(raw: string | undefined, underTestRunner: boolean, sharedDatabaseOptIn: string | undefined = undefined): string {
  if (raw === undefined || raw.trim() === "") return UNCONFIGURED_DATABASE_URL;
  let name: string;
  try {
    name = decodeURIComponent(new URL(raw).pathname.replace(/^\//, ""));
  } catch {
    return UNCONFIGURED_DATABASE_URL;
  }
  if (underTestRunner && name === "") return UNCONFIGURED_DATABASE_URL;
  if (isProtectedDatabaseName(name) && (underTestRunner || sharedDatabaseOptIn !== "1")) return UNCONFIGURED_DATABASE_URL;
  return raw;
}

/** Returns DATABASE_URL only if it is a policy-valid disposable test database URL; never a default. */
export function requireTestDatabaseUrl(raw: string | undefined = process.env.DATABASE_URL): string {
  const verdict = classifyTestDatabaseUrl(raw);
  if (!verdict.ok) throw new Error(`ERR_TEST_DATABASE_ISOLATION_${verdict.code}: ${verdict.detail}`);
  return verdict.url;
}
