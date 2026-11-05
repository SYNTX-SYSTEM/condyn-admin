import { drizzle } from "drizzle-orm/postgres-js";
import { PostgresCapabilityCoreRepository } from "../../career/capability-core";
import { db } from "../../career/db/client";
import { createCapabilityCoreAuthoritativeStateResolver } from "../../decision-adapters/capability-core";
import { createCareerCanonicalAuthoritativeStateResolvers } from "../../decision-adapters/career-canonical";
import { createRegistrationClient } from "../../persistence/registration-client";
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
/**
 * PINK D-1: this ran `ensureDecisionRuntimePostgresSchema` on the APPLICATION client, on EVERY
 * request, and without the boundary B-ENTRY gate the other five DDL paths pass.
 *
 * Two of the three are fixed here: the DDL now runs on a dedicated, short-lived registration client,
 * never the application client, and exactly once per process instead of once per request. The DDL
 * itself is the unchanged, sealed `ensureDecisionRuntimePostgresSchema` (its byte hash is pinned by
 * test/decision-runtime/use-cases/root-decision-context.test.ts), so nothing is copied here.
 *
 * The THIRD part — the B-ENTRY gate — is NOT applied, and that is an open owner decision, not an
 * oversight. test/decision-runtime/e2e/local-decision-context-http.e2e.test.ts provisions its own
 * `condyn_r5_<20 hex>` database, which is outside the disposable pattern and carries no marker, so it
 * satisfies NEITHER basis of B-ENTRY: with the gate that test answers 503 instead of serving. Making
 * it use the sanctioned disposable create/drop fixes it, but `test/decision-runtime` is sealed against
 * commit 435a112 by test/decision-integration/g2-g3-vertical-proof.test.ts (P8), and that seal was
 * intact. The isolation mandate of 2026-10-10 and that older seal therefore contradict each other on
 * this one path; resolving it means re-pinning P8 or exempting that one file, which is OTTAVIO's call.
 */
let registration: Promise<"REGISTERED"> | undefined;

export function ensureDecisionRuntimeRegistration(): Promise<"REGISTERED"> {
  registration ??= (async () => {
    const url = process.env.DATABASE_URL;
    if (url === undefined || url.trim() === "") throw new Error("ERR_DECISION_RUNTIME_NO_DATABASE");
    const client = createRegistrationClient(url);
    try {
      await ensureDecisionRuntimePostgresSchema(drizzle(client) as unknown as Parameters<typeof ensureDecisionRuntimePostgresSchema>[0]);
    } finally {
      await client.end({ timeout: 5 });
    }
    return "REGISTERED" as const;
  })().catch(error => { registration = undefined; throw error; });
  return registration;
}

export async function createLocalDecisionContextHttpApplication(): Promise<DecisionContextHttpApplication> {
  const decisionRuntimeDatabase = db as unknown as Parameters<typeof ensureDecisionRuntimePostgresSchema>[0];
  await ensureDecisionRuntimeRegistration();
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
