import { sql } from "drizzle-orm";
import { createCapabilityCoreAuthoritativeStateResolver } from "../../decision-adapters/capability-core";
import { PostgresDecisionContextRevisionRepository } from "../../decision-adapters/revision-persistence";
import { createBoundAuthoritativeStateReader } from "../../decision-core";
import { createDecisionApplicationRuntime } from "../runtime";
import type { DecisionApplicationRuntime } from "../types";
import type { PostgresCapabilityDecisionRuntimeDependencies } from "./types";

const COMPOSITION_DEPENDENCIES_INVALID = "ERR_DECISION_RUNTIME_COMPOSITION_DEPENDENCIES_INVALID";

const invalidDependencies = (): never => { throw new Error(COMPOSITION_DEPENDENCIES_INVALID); };

function captureDependencies(value: unknown): Record<"database" | "capabilityRepository", unknown> {
  try {
    if (value === null || typeof value !== "object" || Array.isArray(value)) invalidDependencies();
    if (Object.getOwnPropertySymbols(value).length !== 0) invalidDependencies();
    const names = Object.getOwnPropertyNames(value);
    if (names.length !== 2 || names.some((name) => name !== "database" && name !== "capabilityRepository")) invalidDependencies();
    const database = Object.getOwnPropertyDescriptor(value, "database");
    const capabilityRepository = Object.getOwnPropertyDescriptor(value, "capabilityRepository");
    if (database === undefined || capabilityRepository === undefined) return invalidDependencies();
    if (!database.enumerable || !capabilityRepository.enumerable || !("value" in database) || !("value" in capabilityRepository)) return invalidDependencies();
    return { database: database.value, capabilityRepository: capabilityRepository.value };
  } catch {
    return invalidDependencies();
  }
}

export function createPostgresCapabilityDecisionApplicationRuntime(
  dependencies: PostgresCapabilityDecisionRuntimeDependencies
): DecisionApplicationRuntime {
  const captured = captureDependencies(dependencies);
  const capabilityResolver = createCapabilityCoreAuthoritativeStateResolver(
    captured.capabilityRepository as PostgresCapabilityDecisionRuntimeDependencies["capabilityRepository"]
  );
  const authoritativeStateReader = createBoundAuthoritativeStateReader([capabilityResolver]);
  const revisionRepository = new PostgresDecisionContextRevisionRepository(
    captured.database as PostgresCapabilityDecisionRuntimeDependencies["database"]
  );
  return createDecisionApplicationRuntime({
    authoritativeStateReader,
    getRevisionById: revisionRepository.getRevisionById.bind(revisionRepository),
    revisionPersister: revisionRepository.createDecisionContextRevisionPersister()
  });
}

export async function ensureDecisionRuntimePostgresSchema(
  database: PostgresCapabilityDecisionRuntimeDependencies["database"]
): Promise<void> {
  await database.execute(sql`
    CREATE TABLE IF NOT EXISTS decision_context_revisions (
      revision_id TEXT PRIMARY KEY,
      previous_revision_id TEXT NULL REFERENCES decision_context_revisions(revision_id) ON DELETE RESTRICT,
      payload JSONB NOT NULL
    )
  `);
}
