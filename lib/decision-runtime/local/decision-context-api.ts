import { PostgresCapabilityCoreRepository } from "../../career/capability-core";
import { db } from "../../career/db/client";
import { createCapabilityCoreAuthoritativeStateResolver } from "../../decision-adapters/capability-core";
import { createCareerCanonicalAuthoritativeStateResolvers } from "../../decision-adapters/career-canonical";
import { ensureDecisionRuntimePostgresSchema } from "../composition";
import { createPostgresResolverListDecisionApplicationRuntime } from "../composition/postgres-resolver-list";
import type { DecisionContextHttpApplication } from "../http/decision-contexts";
import { createPersistRootDecisionContextRevisionUseCase } from "../use-cases/root-decision-context";
import { createLocalCareerCanonicalProducerRepositories } from "./career-canonical-producers";

/**
 * Local composition: the same Capability Core repository the sealed single-producer root
 * createPostgresCapabilityDecisionApplicationRuntime binds, plus the G3 Career Canonical
 * producer family (R1), composed through the resolver-list root (R3). The sealed root stays
 * byte-identical and is not used here because its dependency shape admits one producer only.
 */
export async function createLocalDecisionContextHttpApplication(): Promise<DecisionContextHttpApplication> {
  const decisionRuntimeDatabase = db as unknown as Parameters<typeof ensureDecisionRuntimePostgresSchema>[0];
  await ensureDecisionRuntimePostgresSchema(decisionRuntimeDatabase);
  const capabilityRepository = new PostgresCapabilityCoreRepository(db);
  const runtime = createPostgresResolverListDecisionApplicationRuntime({
    database: decisionRuntimeDatabase,
    resolvers: [
      createCapabilityCoreAuthoritativeStateResolver(capabilityRepository),
      ...createCareerCanonicalAuthoritativeStateResolvers(createLocalCareerCanonicalProducerRepositories())
    ]
  });
  const useCase = createPersistRootDecisionContextRevisionUseCase({ runtime });
  return {
    createRootDecisionContext: (input) => useCase.execute(input as Parameters<typeof useCase.execute>[0]),
    readDecisionContextRevision: (revisionId) => runtime.readDecisionContextRevision(revisionId)
  };
}
