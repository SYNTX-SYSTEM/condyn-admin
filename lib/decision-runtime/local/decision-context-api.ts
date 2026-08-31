import { PostgresCapabilityCoreRepository } from "../../career/capability-core";
import { db } from "../../career/db/client";
import {
  createPostgresCapabilityDecisionApplicationRuntime,
  ensureDecisionRuntimePostgresSchema
} from "../composition";
import type { DecisionContextHttpApplication } from "../http/decision-contexts";
import { createPersistRootDecisionContextRevisionUseCase } from "../use-cases/root-decision-context";

export async function createLocalDecisionContextHttpApplication(): Promise<DecisionContextHttpApplication> {
  const decisionRuntimeDatabase = db as unknown as Parameters<typeof ensureDecisionRuntimePostgresSchema>[0];
  await ensureDecisionRuntimePostgresSchema(decisionRuntimeDatabase);
  const capabilityRepository = new PostgresCapabilityCoreRepository(db);
  const runtime = createPostgresCapabilityDecisionApplicationRuntime({ database: decisionRuntimeDatabase, capabilityRepository });
  const useCase = createPersistRootDecisionContextRevisionUseCase({ runtime });
  return {
    createRootDecisionContext: (input) => useCase.execute(input as Parameters<typeof useCase.execute>[0]),
    readDecisionContextRevision: (revisionId) => runtime.readDecisionContextRevision(revisionId)
  };
}
