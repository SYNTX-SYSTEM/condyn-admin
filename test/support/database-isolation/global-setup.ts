import type { TestProject } from "vitest/node";
import { verifyDisposableTestDatabase } from "../../../lib/database-isolation/verification";

declare module "vitest" {
  export interface ProvidedContext {
    verifiedTestDatabaseUrl: string;
  }
}

/**
 * Fail-closed gate for every vitest run (database isolation mandate, 2026-10-10).
 * No test file runs unless DATABASE_URL names a positively identified disposable test
 * database: policy-valid URL, read-only connection reporting exactly that database, and
 * the disposable marker. The shared `condyn` database is refused before any connection.
 * Create one with `npm run test:db:create`, or use `npm run test:isolated -- <vitest args>`.
 */
export default async function setup(project: TestProject): Promise<void> {
  // The shared-database opt-in belongs to real servers and workers only; a test run never carries it.
  delete process.env.CONDYN_ALLOW_SHARED_DATABASE;
  const verified = await verifyDisposableTestDatabase(process.env.DATABASE_URL);
  project.provide("verifiedTestDatabaseUrl", verified.url);
  console.info(`[database-isolation] verified disposable test database ${verified.databaseName}`);
}
