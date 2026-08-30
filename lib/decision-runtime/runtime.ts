import type {
  AuthoritativeStateReference,
  AuthoritativeStateResolution,
  DecisionContextRevision
} from "../decision-core";
import type { DecisionApplicationRuntime, DecisionApplicationRuntimeDependencies } from "./types";

const RUNTIME_DEPENDENCIES_INVALID = "ERR_DECISION_RUNTIME_DEPENDENCIES_INVALID";

function invalidDependencies(): never {
  throw new Error(RUNTIME_DEPENDENCIES_INVALID);
}

function captureExactDataRecord(value: unknown, fields: readonly string[]): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) invalidDependencies();
  if (Object.getOwnPropertySymbols(value).length !== 0) invalidDependencies();
  const names = Object.getOwnPropertyNames(value);
  if (names.length !== fields.length || names.some((name) => !fields.includes(name))) invalidDependencies();
  const captured: Record<string, unknown> = {};
  for (const field of fields) {
    const descriptor = Object.getOwnPropertyDescriptor(value, field);
    if (descriptor === undefined || !descriptor.enumerable || !("value" in descriptor)) invalidDependencies();
    captured[field] = descriptor.value;
  }
  return captured;
}

function captureBoundMethod(value: unknown, name: string): (...args: never[]) => unknown {
  const captured = captureExactDataRecord(value, [name]);
  if (typeof captured[name] !== "function") invalidDependencies();
  return captured[name].bind(value) as (...args: never[]) => unknown;
}

export function createDecisionApplicationRuntime(dependencies: DecisionApplicationRuntimeDependencies): DecisionApplicationRuntime {
  const captured = captureExactDataRecord(dependencies, ["authoritativeStateReader", "getRevisionById", "revisionPersister"]);
  if (typeof captured.getRevisionById !== "function") invalidDependencies();
  const resolve = captureBoundMethod(captured.authoritativeStateReader, "resolve") as (reference: AuthoritativeStateReference) => Promise<AuthoritativeStateResolution>;
  const getRevisionById = captured.getRevisionById as (revisionId: string) => Promise<DecisionContextRevision | null>;
  const persist = captureBoundMethod(captured.revisionPersister, "persist") as (revision: DecisionContextRevision) => Promise<DecisionContextRevision>;

  return {
    resolveAuthoritativeState: (reference) => resolve(reference),
    readDecisionContextRevision: (revisionId) => getRevisionById(revisionId),
    persistDecisionContextRevision: (revision) => persist(revision)
  };
}
