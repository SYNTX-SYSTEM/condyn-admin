import { LOOPBACK_HOSTS } from "../../lib/database-isolation/policy";

/**
 * The provisioning basis must be named explicitly: TEST_DATABASE_ADMIN_URL pointing at the
 * maintenance database `postgres` on a loopback (or allowlisted) host. There is no default.
 */
export function requireTestDatabaseAdminUrl(): string {
  const raw = process.env.TEST_DATABASE_ADMIN_URL;
  if (raw === undefined || raw.trim() === "" || raw !== raw.trim()) throw new Error("ERR_TEST_DATABASE_ADMIN_URL_MISSING: set TEST_DATABASE_ADMIN_URL=postgresql://<user>:<password>@localhost:5432/postgres");
  let url: URL;
  try { url = new URL(raw); } catch { throw new Error("ERR_TEST_DATABASE_ADMIN_URL_MALFORMED"); }
  const extra = (process.env.TEST_DATABASE_ALLOWED_HOSTS ?? "").split(",").map(host => host.trim().toLowerCase()).filter(Boolean);
  if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") throw new Error("ERR_TEST_DATABASE_ADMIN_URL_MALFORMED");
  if (![...LOOPBACK_HOSTS, ...extra].includes(url.hostname.toLowerCase())) throw new Error(`ERR_TEST_DATABASE_ADMIN_URL_NON_LOCAL_HOST: ${url.hostname}`);
  if (url.pathname !== "/postgres" || url.search !== "" || url.hash !== "") throw new Error("ERR_TEST_DATABASE_ADMIN_URL_NOT_MAINTENANCE: the admin URL must name exactly the maintenance database /postgres");
  return raw;
}
