import { drizzle } from "drizzle-orm/postgres-js";
import { db } from "../db/client";
import { ensureJobPoolPersistenceRegistration } from "../job-pool/local-composition";
import { PostgresJobPoolRepository } from "../job-pool/repository";
import { JobScopeRequiredError } from "./errors";
import { createJobScopeResolver, type JobScopeResolver } from "./scope";

/**
 * The job scope resolver of the analyze route and the Career worker. It reads the same stored Job Pool as the
 * job pool routes, behind the same persistence gate (B-ENTRY): where no job pool persistence is provisioned,
 * no job can be valid, so every selection is refused as ERR_JOB_SCOPE_INVALID before any Gemini call.
 */
export function createLocalJobScopeResolver(): JobScopeResolver {
  return {
    async resolve(selection) {
      if (await ensureJobPoolPersistenceRegistration() !== "REGISTERED") {
        throw new JobScopeRequiredError("ERR_JOB_SCOPE_INVALID", "job pool persistence is not provisioned on this database");
      }
      return createJobScopeResolver(new PostgresJobPoolRepository(drizzle(db.$client))).resolve(selection);
    }
  };
}
