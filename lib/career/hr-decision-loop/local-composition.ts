import { drizzle } from "drizzle-orm/postgres-js";
import { db } from "../db/client";
import { createRegistrationClient } from "./registration-client";
import { verifyDisposableTestDatabase } from "../../database-isolation/verification";
import { registerUnifiedPersistenceSchema } from "../../persistence/unified-schema-registration";
import { createProductionHumanDecisionRecordDependencies } from "../human-decision-admission/application";
import {
  createHrDecisionDeclarationApplication,
  createLocalSelfDeclaredTransportIdentity
} from "./declaration-application";
import type { HrDecisionLoopHttpApplication } from "./http";
import {
  createHrDecisionLoopReadService,
  createPostgresHrDecisionLoopReadDependencies
} from "./server-read-service";

/**
 * Startup registration is gated by positive database identity (owner mandate,
 * 2026-10-10): the unified order of relation R7 (`registerUnifiedPersistenceSchema`:
 * career field schema incl. T11, the post-decision chain DAINT … COVFCR,
 * `decision_context_revisions`, DCDRB bindings) runs only when the bound
 * DATABASE_URL is a positively verified disposable database. On any other
 * database the HR routes perform no DDL at all: absent tables are represented
 * as NOT_PROVISIONED by the read service or rejected reads, never created.
 * The verdict is taken once per process. REGISTRATION != DATA.
 */
let registration: Promise<"REGISTERED" | "NO_DDL_ON_NON_DISPOSABLE_DATABASE"> | undefined;

export function ensureHrDecisionLoopPersistenceRegistration(): Promise<"REGISTERED" | "NO_DDL_ON_NON_DISPOSABLE_DATABASE"> {
  registration ??= (async () => {
    const verified = await verifyDisposableTestDatabase(process.env.DATABASE_URL).then(result => result, () => null);
    if (verified === null) return "NO_DDL_ON_NON_DISPOSABLE_DATABASE";
    const client = createRegistrationClient(verified.url);
    try {
      await registerUnifiedPersistenceSchema(client);
    } finally {
      await client.end({ timeout: 5 });
    }
    return "REGISTERED";
  })().catch(error => { registration = undefined; throw error; });
  return registration;
}

/**
 * Local composition root for the HR Decision Loop routes. It binds the sealed
 * T11 production dependencies and the post-decision repositories to the one
 * physical client, exactly as the canonical SIL product service does.
 */
export async function createLocalHrDecisionLoopHttpApplication(): Promise<HrDecisionLoopHttpApplication> {
  await ensureHrDecisionLoopPersistenceRegistration();
  const adapterDatabase = drizzle(db.$client);
  const producer = createProductionHumanDecisionRecordDependencies(adapterDatabase);
  const readDependencies = createPostgresHrDecisionLoopReadDependencies(adapterDatabase, producer);
  const readService = createHrDecisionLoopReadService(readDependencies);
  const declaration = createHrDecisionDeclarationApplication({
    producer,
    identity: createLocalSelfDeclaredTransportIdentity(),
    now: () => new Date().toISOString()
  });
  return {
    readLoop: id => readService.read(id),
    declare: (request, body) => declaration.declare(request, body),
    readHumanDecisionRecord: id => producer.records.getHumanDecisionRecordById(id)
  };
}
