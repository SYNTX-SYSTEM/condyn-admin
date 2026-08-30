import {
  assembleDecisionContextValidation,
  createDecisionContextDraft,
  createDecisionContextRevision,
  type AuthoritativeStateReference,
  type DecisionContextRevision,
  type DecisionContextValidationAssemblyInput
} from "../../../decision-core";
import type { DecisionApplicationRuntime } from "../../types";
import type {
  CreatePersistRootDecisionContextRevisionUseCase,
  CreatePersistRootDecisionContextRevisionUseCaseDependencies
} from "./types";

const DEPENDENCIES_INVALID = "ERR_DECISION_RUNTIME_ROOT_CONTEXT_USE_CASE_DEPENDENCIES_INVALID";

function invalidDependencies(): never {
  throw new Error(DEPENDENCIES_INVALID);
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

function bindCapturedMethod(receiver: unknown, captured: Record<string, unknown>, name: string): (...args: never[]) => unknown {
  if (typeof captured[name] !== "function") invalidDependencies();
  return captured[name].bind(receiver) as (...args: never[]) => unknown;
}

function captureRuntime(value: unknown) {
  const captured = captureExactDataRecord(value, ["resolveAuthoritativeState", "readDecisionContextRevision", "persistDecisionContextRevision"]);
  const runtime = value as DecisionApplicationRuntime;
  return {
    resolveAuthoritativeState: bindCapturedMethod(runtime, captured, "resolveAuthoritativeState") as (reference: AuthoritativeStateReference) => Promise<unknown>,
    readDecisionContextRevision: bindCapturedMethod(runtime, captured, "readDecisionContextRevision"),
    persistDecisionContextRevision: bindCapturedMethod(runtime, captured, "persistDecisionContextRevision") as (revision: DecisionContextRevision) => Promise<DecisionContextRevision>
  };
}

export function createPersistRootDecisionContextRevisionUseCase(
  dependencies: CreatePersistRootDecisionContextRevisionUseCaseDependencies
): CreatePersistRootDecisionContextRevisionUseCase {
  const capturedDependencies = captureExactDataRecord(dependencies, ["runtime"]);
  const runtime = captureRuntime(capturedDependencies.runtime);

  return {
    async execute(input) {
      const context = createDecisionContextDraft(input);
      for (const reference of context.sourceStateReferences) await runtime.resolveAuthoritativeState(reference);
      const validationInput: DecisionContextValidationAssemblyInput = {
        expectationValidations: [],
        consequenceValidations: []
      };
      const validationAssembly = assembleDecisionContextValidation(context, validationInput);
      const revision = createDecisionContextRevision({
        previousRevisionId: null,
        context,
        validationInput,
        validationAssembly
      });
      return runtime.persistDecisionContextRevision(revision);
    }
  };
}
