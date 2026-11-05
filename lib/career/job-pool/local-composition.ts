import { drizzle } from "drizzle-orm/postgres-js";
import { db } from "../db/client";
import { getCareerAnalysisRepository } from "../repositories";
import { createCapabilityProposalProjectionReader, PostgresCapabilityCoreRepository, PostgresCapabilityProposalProjectionReferenceRepository } from "../capability-core";
import { verifyProvisionableDatabase } from "../../database-isolation/verification";
import { registerUnifiedPersistenceSchema } from "../../persistence/unified-schema-registration";
import { createRegistrationClient } from "../../persistence/registration-client";
import { createJobPoolApplication, type JobPoolApplication } from "./application";
import { JobPoolError } from "./errors";
import { createPostgresAnalysisInvestigationSources, readPersistedAnalysisInvestigation } from "../investigation/persisted";
import { createJobScopeResolver } from "../job-scope/scope";
import { JobRepository } from "../orchestration/job-repository";
import { PostgresJobPoolRepository } from "./repository";
import { registerJobPoolPersistenceSchema } from "./persistence-schema";

/**
 * Same gate as the HR Decision Loop routes (database isolation mandate). DDL runs only after the bound
 * DATABASE_URL is positively verified, on a dedicated single-connection client with notices silenced, as
 * EITHER of exactly two bases:
 *
 *   1. a disposable test database (`condyn_test_<16 hex>` plus marker) — the only basis a test run or an
 *      agent operation can ever reach, unchanged;
 *   2. the application database of a REAL SERVER OR WORKER PROCESS that explicitly declared it with
 *      CONDYN_ALLOW_SHARED_DATABASE=1 (owner authorisation of 2026-11-05) — refused under any test runner,
 *      refused without the opt-in, and refused for maintenance and template databases.
 *
 * Without either basis the job pool routes issue no DDL and answer 503
 * ERR_JOB_POOL_PERSISTENCE_NOT_PROVISIONED (boundary B-ENTRY). The verdict is taken once per process.
 */
let registration: Promise<"REGISTERED" | "NO_DDL_ON_NON_DISPOSABLE_DATABASE"> | undefined;

export function ensureJobPoolPersistenceRegistration(): Promise<"REGISTERED" | "NO_DDL_ON_NON_DISPOSABLE_DATABASE"> {
  registration ??= (async () => {
    const verified = await verifyProvisionableDatabase(process.env.DATABASE_URL);
    if (verified === null) return "NO_DDL_ON_NON_DISPOSABLE_DATABASE";
    const client = createRegistrationClient(verified.url);
    try {
      await registerUnifiedPersistenceSchema(client);
      await registerJobPoolPersistenceSchema(client);
    } finally {
      await client.end({ timeout: 5 });
    }
    return "REGISTERED";
  })().catch(error => { registration = undefined; throw error; });
  return registration;
}

export async function createLocalJobPoolApplication(): Promise<JobPoolApplication> {
  if (await ensureJobPoolPersistenceRegistration() !== "REGISTERED") {
    throw new JobPoolError("ERR_JOB_POOL_PERSISTENCE_NOT_PROVISIONED", 503, "Job pool persistence is provisioned only on a verified disposable database (B-ENTRY).");
  }
  return createJobPoolApplication({
    database: drizzle(db.$client),
    analyses: getCareerAnalysisRepository(),
    capabilitySweep: createCapabilityProposalProjectionReader({
      references: new PostgresCapabilityProposalProjectionReferenceRepository(db),
      capabilityRepository: new PostgresCapabilityCoreRepository(db)
    }),
    // The same persisted boundary the URL boundary route reads (lib/career/investigation/persisted.ts).
    investigationBoundary: { read: analysisId => readPersistedAnalysisInvestigation({
      ...createPostgresAnalysisInvestigationSources(db),
      references: new PostgresCapabilityProposalProjectionReferenceRepository(db),
      runs: new PostgresCapabilityCoreRepository(db),
      jobs: new JobRepository(db),
      scopes: createJobScopeResolver(new PostgresJobPoolRepository(drizzle(db.$client)))
    }, analysisId) }
  });
}
