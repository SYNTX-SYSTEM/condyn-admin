import { drizzle } from "drizzle-orm/postgres-js";
import { db, initDbSchema } from "../db/client";
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
 * Local composition root for the HR Decision Loop routes. It binds the sealed
 * T11 production dependencies and the post-decision repositories to the one
 * physical client, exactly as the canonical SIL product service does. Startup
 * registration is the existing `initDbSchema` (T11 order); tables of the
 * post-decision chain that it does not register are represented as
 * NOT_PROVISIONED by the read service, never created here.
 */
export async function createLocalHrDecisionLoopHttpApplication(): Promise<HrDecisionLoopHttpApplication> {
  await initDbSchema();
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
