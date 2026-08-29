import { createHash } from "node:crypto";
import {
  assertDecisionContextObservationTargetRevisionBinding,
  type DecisionContextObservationTargetRevisionBinding
} from "../context-observation-target-revision-binding";
import { buildDecisionContextItemId, sourceStateReferenceKey } from "../context/identity";
import {
  DECISION_CONTEXT_OBSERVATION_MATERIALIZATION_READINESS_SCHEMA_VERSION,
  type DecisionContextObservationMaterializationReadiness,
  type DecisionContextObservationMaterializationReadinessInput
} from "./types";

const fail = (code: string): never => { throw new Error(code); };
const inputKeys = ["decisionContextObservationTargetRevisionBinding"] as const;
const readinessKeys = ["artifactKind", "schemaVersion", "decisionContextObservationMaterializationReadinessId", "decisionContextObservationTargetRevisionBinding", "candidateItemId"] as const;
const readinessIdPattern = /^DCOMR_[0-9A-F]{24}$/;
type Captured = null | boolean | number | string | Captured[] | { [key: string]: Captured };

function capture(value: unknown, code: string, ancestors: WeakSet<object> = new WeakSet<object>()): Captured {
  try {
    if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value as Captured;
    if (typeof value !== "object" || ancestors.has(value)) return fail(code);
    ancestors.add(value);
    try {
      if (Array.isArray(value)) {
        const keys = Reflect.ownKeys(value); const lengthDescriptor = Reflect.getOwnPropertyDescriptor(value, "length");
        const length = lengthDescriptor !== undefined && "value" in lengthDescriptor ? lengthDescriptor.value : undefined;
        if (typeof length !== "number" || !Number.isSafeInteger(length) || length < 0 || keys.length !== length + 1 || !keys.includes("length") || keys.some((key) => typeof key === "symbol" || (key !== "length" && (!/^(0|[1-9][0-9]*)$/.test(key) || Number(key) >= length)))) return fail(code);
        const result: Captured[] = [];
        for (let index = 0; index < length; index += 1) {
          const descriptor = Reflect.getOwnPropertyDescriptor(value, String(index));
          if (descriptor === undefined || descriptor.enumerable !== true || !("value" in descriptor)) return fail(code);
          result.push(capture(descriptor.value, code, ancestors));
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

function captureBinding(value: unknown, code: string): DecisionContextObservationTargetRevisionBinding {
  try {
    const binding = capture(value, code) as unknown as DecisionContextObservationTargetRevisionBinding;
    assertDecisionContextObservationTargetRevisionBinding(binding);
    return binding;
  } catch { return fail(code); }
}

function candidateItemId(binding: DecisionContextObservationTargetRevisionBinding): string {
  const projectedItemInput = binding.decisionContextObservationTargetDeclaration.decisionContextObservationItemProjection.projectedItemInput;
  const itemId = buildDecisionContextItemId(projectedItemInput.role, projectedItemInput.statement, projectedItemInput.provenance);
  if (projectedItemInput.provenance.origin === "AUTHORITATIVE_STATE") {
    const projectedKey = sourceStateReferenceKey(projectedItemInput.provenance.stateReference);
    if (!binding.revision.context.sourceStateReferences.some((reference) => sourceStateReferenceKey(reference) === projectedKey)) fail("ERR_DECISION_CONTEXT_OBSERVATION_MATERIALIZATION_READINESS_SOURCE_REFERENCE_MISSING");
  }
  if (binding.revision.context.items.some((item) => item.itemId === itemId)) fail("ERR_DECISION_CONTEXT_OBSERVATION_MATERIALIZATION_READINESS_ITEM_ALREADY_PRESENT");
  return itemId;
}

function readinessId(binding: DecisionContextObservationTargetRevisionBinding, itemId: string): string {
  const digest = createHash("sha256").update(JSON.stringify([
    DECISION_CONTEXT_OBSERVATION_MATERIALIZATION_READINESS_SCHEMA_VERSION,
    canonical(binding as unknown as Captured),
    itemId
  ]), "utf8").digest("hex").slice(0, 24).toUpperCase();
  return `DCOMR_${digest}`;
}

function construct(binding: DecisionContextObservationTargetRevisionBinding, itemId: string): DecisionContextObservationMaterializationReadiness {
  return {
    artifactKind: "DECISION_CONTEXT_OBSERVATION_MATERIALIZATION_READINESS",
    schemaVersion: DECISION_CONTEXT_OBSERVATION_MATERIALIZATION_READINESS_SCHEMA_VERSION,
    decisionContextObservationMaterializationReadinessId: readinessId(binding, itemId),
    decisionContextObservationTargetRevisionBinding: binding,
    candidateItemId: itemId
  };
}

export function createDecisionContextObservationMaterializationReadiness(input: DecisionContextObservationMaterializationReadinessInput): DecisionContextObservationMaterializationReadiness {
  const wrapper = exactOwn(input, inputKeys, "ERR_DECISION_CONTEXT_OBSERVATION_MATERIALIZATION_READINESS_INPUT_INVALID");
  const binding = captureBinding(wrapper.decisionContextObservationTargetRevisionBinding, "ERR_DECISION_CONTEXT_OBSERVATION_MATERIALIZATION_READINESS_BINDING_INVALID");
  const result = construct(binding, candidateItemId(binding));
  assertDecisionContextObservationMaterializationReadiness(result);
  return structuredClone(result);
}

export function assertDecisionContextObservationMaterializationReadiness(value: unknown): asserts value is DecisionContextObservationMaterializationReadiness {
  const invalid = "ERR_DECISION_CONTEXT_OBSERVATION_MATERIALIZATION_READINESS_INVALID";
  try {
    const readiness = exactOwn(value, readinessKeys, invalid);
    if (readiness.artifactKind !== "DECISION_CONTEXT_OBSERVATION_MATERIALIZATION_READINESS" || readiness.schemaVersion !== DECISION_CONTEXT_OBSERVATION_MATERIALIZATION_READINESS_SCHEMA_VERSION || typeof readiness.decisionContextObservationMaterializationReadinessId !== "string" || !readinessIdPattern.test(readiness.decisionContextObservationMaterializationReadinessId) || typeof readiness.candidateItemId !== "string") fail(invalid);
    const binding = captureBinding(readiness.decisionContextObservationTargetRevisionBinding, invalid);
    const itemId = candidateItemId(binding);
    if (readiness.candidateItemId !== itemId) fail(invalid);
    if (readiness.decisionContextObservationMaterializationReadinessId !== readinessId(binding, itemId)) fail("ERR_DECISION_CONTEXT_OBSERVATION_MATERIALIZATION_READINESS_ID_MISMATCH");
  } catch (error) {
    if (error instanceof Error && error.message === "ERR_DECISION_CONTEXT_OBSERVATION_MATERIALIZATION_READINESS_ID_MISMATCH") throw error;
    return fail(invalid);
  }
}
