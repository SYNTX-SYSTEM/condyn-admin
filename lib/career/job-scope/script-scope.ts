import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { verifyDisposableTestDatabase } from "../../database-isolation/verification";
import { PostgresJobPoolRepository } from "../job-pool/repository";
import { JobScopeRequiredError } from "./errors";
import { createJobScopeResolver, parseJobScopeSelection, type ResolvedJobScope } from "./scope";

/** Environment of a development script or live diagnostic that names its job (both values are taken verbatim). */
export const SCRIPT_JOB_SCOPE_ENV = { jobPoolUploadId: "CONDYN_JOB_POOL_UPLOAD_ID", poolRoleId: "CONDYN_POOL_ROLE_ID" } as const;

/**
 * Job scope of a development script, live test or diagnostic that would reach the Career-Analysis pipeline or
 * Gemini outside the Career worker (SFE invariant JOB POOL FIRST; the owner's rule covers direct script calls too).
 * The selection comes from CONDYN_JOB_POOL_UPLOAD_ID and CONDYN_POOL_ROLE_ID and is validated exactly like the
 * analyze route does it: against a stored, ACTIVE, mapped Job Pool. The pool is read over a read-only connection to
 * a verified disposable test database; a missing DATABASE_URL, the shared database or a database without Job Pool
 * persistence refuses. Without a valid selection the script stops here, before any document, prompt or Gemini work.
 */
export async function resolveScriptJobScope(env: Readonly<Record<string, string | undefined>> = process.env): Promise<ResolvedJobScope> {
  const selection = parseJobScopeSelection({ jobPoolUploadId: env[SCRIPT_JOB_SCOPE_ENV.jobPoolUploadId], poolRoleId: env[SCRIPT_JOB_SCOPE_ENV.poolRoleId] });
  let verified: { url: string };
  try {
    verified = await verifyDisposableTestDatabase(env.DATABASE_URL);
  } catch (error) {
    throw new JobScopeRequiredError("ERR_JOB_SCOPE_INVALID", `the stored Job Pool must be read from a verified disposable test database (${error instanceof Error ? error.message : String(error)})`);
  }
  const sql = postgres(verified.url, { max: 1, onnotice: () => undefined, connection: { default_transaction_read_only: true } });
  try {
    return await createJobScopeResolver(new PostgresJobPoolRepository(drizzle(sql))).resolve(selection);
  } catch (error) {
    if (error instanceof JobScopeRequiredError) throw error;
    throw new JobScopeRequiredError("ERR_JOB_SCOPE_INVALID", `the stored Job Pool could not be read (${error instanceof Error ? error.message : String(error)})`);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

/** Prints the refusal of a script (code and the owner's message) and ends it with exit code 3. */
export function exitOnJobScopeRefusal(error: unknown): never {
  if (error instanceof JobScopeRequiredError) {
    console.error(`${error.code}: ${error.message}${error.detail ? ` (${error.detail})` : ""}`);
    process.exit(3);
  }
  throw error;
}
