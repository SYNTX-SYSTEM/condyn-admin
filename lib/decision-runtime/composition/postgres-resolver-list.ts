import { PostgresDecisionContextRevisionRepository } from "../../decision-adapters/revision-persistence";
import { createBoundAuthoritativeStateReader, type AuthoritativeStateResolver } from "../../decision-core";
import { createDecisionApplicationRuntime } from "../runtime";
import type { DecisionApplicationRuntime } from "../types";

/**
 * R3 composition root bound to an explicit resolver list.
 *
 * This file is deliberately not re-exported from ./index: the sealed R2 export surface
 * (exactly two values) is frozen by test/decision-runtime/composition. The producer-neutral
 * root here knows nothing about which producers exist; a local wiring supplies the list.
 */

const COMPOSITION_DEPENDENCIES_INVALID = "ERR_DECISION_RUNTIME_COMPOSITION_DEPENDENCIES_INVALID";

const invalidDependencies = (): never => { throw new Error(COMPOSITION_DEPENDENCIES_INVALID); };

export interface PostgresResolverListDecisionRuntimeDependencies {
  database: ConstructorParameters<typeof PostgresDecisionContextRevisionRepository>[0];
  resolvers: readonly AuthoritativeStateResolver[];
}

function captureDataProperty(value: object, name: string): unknown {
  const descriptor = Object.getOwnPropertyDescriptor(value, name);
  if (descriptor === undefined || !descriptor.enumerable || !("value" in descriptor)) return invalidDependencies();
  return descriptor.value;
}

function captureResolverList(value: unknown): AuthoritativeStateResolver[] {
  if (!Array.isArray(value)) return invalidDependencies();
  const ownKeys = Reflect.ownKeys(value);
  if (ownKeys.length !== value.length + 1 || ownKeys.some((key) => typeof key === "symbol")) return invalidDependencies();
  const captured: AuthoritativeStateResolver[] = [];
  for (let index = 0; index < value.length; index += 1) {
    const entry = captureDataProperty(value, String(index));
    if (entry === null || typeof entry !== "object") return invalidDependencies();
    captured.push(entry as AuthoritativeStateResolver);
  }
  return captured;
}

function captureDependencies(value: unknown): { database: unknown; resolvers: AuthoritativeStateResolver[] } {
  try {
    if (value === null || typeof value !== "object" || Array.isArray(value)) return invalidDependencies();
    if (Object.getOwnPropertySymbols(value).length !== 0) return invalidDependencies();
    const names = Object.getOwnPropertyNames(value);
    if (names.length !== 2 || names.some((name) => name !== "database" && name !== "resolvers")) return invalidDependencies();
    return { database: captureDataProperty(value, "database"), resolvers: captureResolverList(captureDataProperty(value, "resolvers")) };
  } catch {
    return invalidDependencies();
  }
}

/**
 * Registers the resolver list once. Duplicate or malformed bindings are refused by the
 * sealed reader at construction; nothing per request can add or redirect a resolver.
 */
export function createPostgresResolverListDecisionApplicationRuntime(
  dependencies: PostgresResolverListDecisionRuntimeDependencies
): DecisionApplicationRuntime {
  const captured = captureDependencies(dependencies);
  const authoritativeStateReader = createBoundAuthoritativeStateReader(captured.resolvers);
  const revisionRepository = new PostgresDecisionContextRevisionRepository(
    captured.database as PostgresResolverListDecisionRuntimeDependencies["database"]
  );
  return createDecisionApplicationRuntime({
    authoritativeStateReader,
    getRevisionById: revisionRepository.getRevisionById.bind(revisionRepository),
    revisionPersister: revisionRepository.createDecisionContextRevisionPersister()
  });
}
