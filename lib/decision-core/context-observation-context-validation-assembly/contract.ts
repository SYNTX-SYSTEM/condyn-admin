import { createHash } from "node:crypto";
import {
  assertDecisionContextObservationContextTransition,
  type DecisionContextObservationContextTransition
} from "../context-observation-context-transition";
import {
  assembleDecisionContextValidation,
  assertDecisionContextValidationAssembly,
  type DecisionContextValidationAssembly,
  type DecisionContextValidationAssemblyInput
} from "../validation-assembly";
import {
  DECISION_CONTEXT_OBSERVATION_CONTEXT_VALIDATION_ASSEMBLY_SCHEMA_VERSION,
  type DecisionContextObservationContextValidationAssembly,
  type DecisionContextObservationContextValidationAssemblyInput
} from "./types";

const fail = (code: string): never => { throw new Error(code); };
const inputKeys = ["decisionContextObservationContextTransition", "validationInput"] as const;
const artifactKeys = ["artifactKind", "schemaVersion", "decisionContextObservationContextValidationAssemblyId", "decisionContextObservationContextTransition", "validationInput", "validationAssembly"] as const;
const artifactIdPattern = /^DCOCVA_[0-9A-F]{24}$/;
type Captured = null | boolean | number | string | Captured[] | { [key: string]: Captured };

function capture(value: unknown, code: string, ancestors: WeakSet<object> = new WeakSet<object>()): Captured {
  try {
    if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value as Captured;
    if (typeof value !== "object" || ancestors.has(value)) return fail(code);
    ancestors.add(value);
    try {
      if (Array.isArray(value)) {
        const keys = Reflect.ownKeys(value); const descriptor = Reflect.getOwnPropertyDescriptor(value, "length");
        const length = descriptor !== undefined && "value" in descriptor ? descriptor.value : undefined;
        if (typeof length !== "number" || !Number.isSafeInteger(length) || length < 0 || keys.length !== length + 1 || !keys.includes("length") || keys.some((key) => typeof key === "symbol" || (key !== "length" && (!/^(0|[1-9][0-9]*)$/.test(key) || Number(key) >= length)))) return fail(code);
        const result: Captured[] = [];
        for (let index = 0; index < length; index += 1) {
          const item = Reflect.getOwnPropertyDescriptor(value, String(index));
          if (item === undefined || item.enumerable !== true || !("value" in item)) return fail(code);
          result.push(capture(item.value, code, ancestors));
        }
        return result;
      }
      const result: { [key: string]: Captured } = {};
      for (const key of Reflect.ownKeys(value)) {
        if (typeof key !== "string") return fail(code);
        const descriptor = Reflect.getOwnPropertyDescriptor(value, key);
        if (descriptor === undefined || descriptor.enumerable !== true || !("value" in descriptor)) return fail(code);
        Object.defineProperty(result, key, { value: capture(descriptor.value, code, ancestors), enumerable: true, writable: true, configurable: true });
      }
      return result;
    } finally { ancestors.delete(value); }
  } catch { return fail(code); }
}

function exactOwn(value: unknown, keys: readonly string[], code: string): Record<string, unknown> {
  try {
    if (value === null || typeof value !== "object" || Array.isArray(value)) return fail(code);
    const actual = Reflect.ownKeys(value);
    if (actual.length !== keys.length || actual.some((key) => typeof key !== "string") || keys.some((key) => !actual.includes(key))) return fail(code);
    const result: Record<string, unknown> = {};
    for (const key of keys) {
      const descriptor = Reflect.getOwnPropertyDescriptor(value, key);
      if (descriptor === undefined || descriptor.enumerable !== true || !("value" in descriptor)) return fail(code);
      Object.defineProperty(result, key, { value: descriptor.value, enumerable: true, writable: true, configurable: true });
    }
    return result;
  } catch { return fail(code); }
}

function canonical(value: Captured): Captured {
  if (Array.isArray(value)) return value.map(canonical);
  if (value === null || typeof value !== "object") return value;
  const result: { [key: string]: Captured } = {};
  for (const key of Object.keys(value).sort((left, right) => left < right ? -1 : left > right ? 1 : 0)) result[key] = canonical(value[key]);
  return result;
}

function captureTransition(value: unknown, code: string): DecisionContextObservationContextTransition {
  try {
    const transition = capture(value, code) as unknown as DecisionContextObservationContextTransition;
    assertDecisionContextObservationContextTransition(transition);
    return transition;
  } catch { return fail(code); }
}

function captureValidationInput(value: unknown, code: string): DecisionContextValidationAssemblyInput {
  try {
    const input = capture(value, code);
    if (input === null || Array.isArray(input) || typeof input !== "object" || Object.keys(input).length !== 2 || !Object.prototype.hasOwnProperty.call(input, "expectationValidations") || !Object.prototype.hasOwnProperty.call(input, "consequenceValidations") || !Array.isArray(input.expectationValidations) || !Array.isArray(input.consequenceValidations)) fail(code);
    return input as unknown as DecisionContextValidationAssemblyInput;
  } catch { return fail(code); }
}

function captureValidationAssembly(value: unknown, code: string): DecisionContextValidationAssembly {
  try { return capture(value, code) as unknown as DecisionContextValidationAssembly; } catch { return fail(code); }
}

function artifactId(transition: DecisionContextObservationContextTransition, input: DecisionContextValidationAssemblyInput, assembly: DecisionContextValidationAssembly): string {
  const digest = createHash("sha256").update(JSON.stringify([
    DECISION_CONTEXT_OBSERVATION_CONTEXT_VALIDATION_ASSEMBLY_SCHEMA_VERSION,
    canonical(transition as unknown as Captured),
    canonical(input as unknown as Captured),
    canonical(assembly as unknown as Captured)
  ]), "utf8").digest("hex").slice(0, 24).toUpperCase();
  return `DCOCVA_${digest}`;
}

function construct(transition: DecisionContextObservationContextTransition, input: DecisionContextValidationAssemblyInput, assembly: DecisionContextValidationAssembly): DecisionContextObservationContextValidationAssembly {
  return {
    artifactKind: "DECISION_CONTEXT_OBSERVATION_CONTEXT_VALIDATION_ASSEMBLY",
    schemaVersion: DECISION_CONTEXT_OBSERVATION_CONTEXT_VALIDATION_ASSEMBLY_SCHEMA_VERSION,
    decisionContextObservationContextValidationAssemblyId: artifactId(transition, input, assembly),
    decisionContextObservationContextTransition: transition,
    validationInput: input,
    validationAssembly: assembly
  };
}

export function createDecisionContextObservationContextValidationAssembly(input: DecisionContextObservationContextValidationAssemblyInput): DecisionContextObservationContextValidationAssembly {
  const wrapper = exactOwn(input, inputKeys, "ERR_DECISION_CONTEXT_OBSERVATION_CONTEXT_VALIDATION_ASSEMBLY_INPUT_INVALID");
  const transition = captureTransition(wrapper.decisionContextObservationContextTransition, "ERR_DECISION_CONTEXT_OBSERVATION_CONTEXT_VALIDATION_ASSEMBLY_TRANSITION_INVALID");
  const validationInput = captureValidationInput(wrapper.validationInput, "ERR_DECISION_CONTEXT_OBSERVATION_CONTEXT_VALIDATION_ASSEMBLY_INPUT_INVALID");
  const validationAssembly = assembleDecisionContextValidation(transition.context, validationInput);
  const result = construct(transition, validationInput, validationAssembly);
  assertDecisionContextObservationContextValidationAssembly(result);
  return structuredClone(result);
}

export function assertDecisionContextObservationContextValidationAssembly(value: unknown): asserts value is DecisionContextObservationContextValidationAssembly {
  const invalid = "ERR_DECISION_CONTEXT_OBSERVATION_CONTEXT_VALIDATION_ASSEMBLY_INVALID";
  try {
    const artifact = exactOwn(value, artifactKeys, invalid);
    if (artifact.artifactKind !== "DECISION_CONTEXT_OBSERVATION_CONTEXT_VALIDATION_ASSEMBLY" || artifact.schemaVersion !== DECISION_CONTEXT_OBSERVATION_CONTEXT_VALIDATION_ASSEMBLY_SCHEMA_VERSION || typeof artifact.decisionContextObservationContextValidationAssemblyId !== "string" || !artifactIdPattern.test(artifact.decisionContextObservationContextValidationAssemblyId)) fail(invalid);
    const transition = captureTransition(artifact.decisionContextObservationContextTransition, invalid);
    const validationInput = captureValidationInput(artifact.validationInput, invalid);
    const validationAssembly = captureValidationAssembly(artifact.validationAssembly, invalid);
    assertDecisionContextValidationAssembly(transition.context, validationInput, validationAssembly);
    if (artifact.decisionContextObservationContextValidationAssemblyId !== artifactId(transition, validationInput, validationAssembly)) fail("ERR_DECISION_CONTEXT_OBSERVATION_CONTEXT_VALIDATION_ASSEMBLY_ID_MISMATCH");
  } catch (error) {
    if (error instanceof Error && error.message === "ERR_DECISION_CONTEXT_OBSERVATION_CONTEXT_VALIDATION_ASSEMBLY_ID_MISMATCH") throw error;
    return fail(invalid);
  }
}
