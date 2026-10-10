import { inject } from "vitest";
import { classifyTestDatabaseUrl } from "../../../lib/database-isolation/policy";

/**
 * Runs before every test file. The worker environment is reset to the exact URL the global
 * setup verified, so neither a loaded .env file nor a URL left behind by a previous test file
 * can redirect a test to another database.
 */
const verified = inject("verifiedTestDatabaseUrl");
const verdict = classifyTestDatabaseUrl(verified);
if (typeof verified !== "string" || !verdict.ok) {
  throw new Error(`ERR_TEST_DATABASE_ISOLATION_${verdict.ok ? "NOT_PROVIDED" : verdict.code}: no verified disposable test database for this test file`);
}
process.env.DATABASE_URL = verified;
