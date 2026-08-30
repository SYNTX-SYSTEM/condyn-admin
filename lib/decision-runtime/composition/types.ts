import type { createCapabilityCoreAuthoritativeStateResolver } from "../../decision-adapters/capability-core";
import type { PostgresDecisionContextRevisionRepository } from "../../decision-adapters/revision-persistence";

export interface PostgresCapabilityDecisionRuntimeDependencies {
  database: ConstructorParameters<typeof PostgresDecisionContextRevisionRepository>[0];
  capabilityRepository: Parameters<typeof createCapabilityCoreAuthoritativeStateResolver>[0];
}
