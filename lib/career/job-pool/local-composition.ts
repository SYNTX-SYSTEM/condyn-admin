import { drizzle } from "drizzle-orm/postgres-js";
import { db } from "../db/client";
import { getCareerAnalysisRepository } from "../repositories";
import { verifyDisposableTestDatabase } from "../../database-isolation/verification";
import { registerUnifiedPersistenceSchema } from "../../persistence/unified-schema-registration";
import { createRegistrationClient } from "../hr-decision-loop/registration-client";
import { createJobPoolApplication, type JobPoolApplication } from "./application";
import { JobPoolError } from "./errors";
import { registerJobPoolPersistenceSchema } from "./persistence-schema";

/**
 * Same gate as the HR Decision Loop routes (database isolation mandate): DDL runs only after the bound
 * DATABASE_URL is positively verified as a disposable test database, on a dedicated single-connection client
 * with notices silenced. On any other database the job pool routes issue no DDL and answer
 * 503 ERR_JOB_POOL_PERSISTENCE_NOT_PROVISIONED (boundary B-ENTRY). The verdict is taken once per process.
 */
let registration: Promise<"REGISTERED" | "NO_DDL_ON_NON_DISPOSABLE_DATABASE"> | undefined;

export function ensureJobPoolPersistenceRegistration(): Promise<"REGISTERED" | "NO_DDL_ON_NON_DISPOSABLE_DATABASE"> {
  registration ??= (async () => {
    const verified = await verifyDisposableTestDatabase(process.env.DATABASE_URL).then(result => result, () => null);
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
  return createJobPoolApplication({ database: drizzle(db.$client), analyses: getCareerAnalysisRepository() });
}
