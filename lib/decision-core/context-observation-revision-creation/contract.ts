import { createHash } from "node:crypto";
import {
  assertDecisionContextObservationContextValidationAssembly,
  type DecisionContextObservationContextValidationAssembly
} from "../context-observation-context-validation-assembly";
import {
  assertDecisionContextRevision,
  createDecisionContextRevision,
  type DecisionContextRevision
} from "../revisions";
import {
  DECISION_CONTEXT_OBSERVATION_REVISION_CREATION_SCHEMA_VERSION,
  type DecisionContextObservationRevisionCreation,
  type DecisionContextObservationRevisionCreationInput
} from "./types";

const fail = (code: string): never => { throw new Error(code); };
const inputKeys = ["decisionContextObservationContextValidationAssembly"] as const;
const artifactKeys = ["artifactKind", "schemaVersion", "decisionContextObservationRevisionCreationId", "decisionContextObservationContextValidationAssembly", "revision"] as const;
const artifactIdPattern = /^DCORC_[0-9A-F]{24}$/;
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

function sameData(left: unknown, right: unknown): boolean {
  if (left === right) return true;
  if (left === null || right === null || typeof left !== "object" || typeof right !== "object") return false;
  if (Array.isArray(left) || Array.isArray(right)) return Array.isArray(left) && Array.isArray(right) && left.length === right.length && left.every((value, index) => sameData(value, right[index]));
  const leftRecord = left as Record<string, unknown>; const rightRecord = right as Record<string, unknown>;
  const leftKeys = Object.keys(leftRecord).sort(); const rightKeys = Object.keys(rightRecord).sort();
  return leftKeys.length === rightKeys.length && leftKeys.every((key, index) => key === rightKeys[index] && sameData(leftRecord[key], rightRecord[key]));
}

function capturePredecessor(value: unknown, code: string): DecisionContextObservationContextValidationAssembly {
  try {
    const predecessor = capture(value, code) as unknown as DecisionContextObservationContextValidationAssembly;
    assertDecisionContextObservationContextValidationAssembly(predecessor);
    return predecessor;
  } catch { return fail(code); }
}

function captureRevision(value: unknown, code: string): DecisionContextRevision {
  try {
    const revision = capture(value, code) as unknown as DecisionContextRevision;
    assertDecisionContextRevision(revision);
    return revision;
  } catch { return fail(code); }
}

function expectedRevision(predecessor: DecisionContextObservationContextValidationAssembly, code: string): DecisionContextRevision {
  try {
    const transition = predecessor.decisionContextObservationContextTransition;
    const baseRevision = transition.decisionContextObservationItemMaterialization.decisionContextObservationMaterializationReadiness.decisionContextObservationTargetRevisionBinding.revision;
    const revision = createDecisionContextRevision({
      previousRevisionId: baseRevision.revisionId,
      context: transition.context,
      validationInput: predecessor.validationInput,
      validationAssembly: predecessor.validationAssembly
    });
    if (revision.previousRevisionId !== baseRevision.revisionId || revision.revisionId === baseRevision.revisionId) return fail(code);
    return revision;
  } catch (error) {
    if (error instanceof Error && error.message === code) throw error;
    throw error;
  }
}

function artifactId(predecessor: DecisionContextObservationContextValidationAssembly, revision: DecisionContextRevision): string {
  const digest = createHash("sha256").update(JSON.stringify([
    DECISION_CONTEXT_OBSERVATION_REVISION_CREATION_SCHEMA_VERSION,
    canonical(predecessor as unknown as Captured),
    canonical(revision as unknown as Captured)
  ]), "utf8").digest("hex").slice(0, 24).toUpperCase();
  return `DCORC_${digest}`;
}

function construct(predecessor: DecisionContextObservationContextValidationAssembly, revision: DecisionContextRevision): DecisionContextObservationRevisionCreation {
  return {
    artifactKind: "DECISION_CONTEXT_OBSERVATION_REVISION_CREATION",
    schemaVersion: DECISION_CONTEXT_OBSERVATION_REVISION_CREATION_SCHEMA_VERSION,
    decisionContextObservationRevisionCreationId: artifactId(predecessor, revision),
    decisionContextObservationContextValidationAssembly: predecessor,
    revision
  };
}

export function createDecisionContextObservationRevisionCreation(input: DecisionContextObservationRevisionCreationInput): DecisionContextObservationRevisionCreation {
  const wrapper = exactOwn(input, inputKeys, "ERR_DECISION_CONTEXT_OBSERVATION_REVISION_CREATION_INPUT_INVALID");
  const predecessor = capturePredecessor(wrapper.decisionContextObservationContextValidationAssembly, "ERR_DECISION_CONTEXT_OBSERVATION_REVISION_CREATION_VALIDATION_ASSEMBLY_INVALID");
  const revision = expectedRevision(predecessor, "ERR_DECISION_CONTEXT_OBSERVATION_REVISION_CREATION_INVALID");
  const result = construct(predecessor, revision);
  assertDecisionContextObservationRevisionCreation(result);
  return structuredClone(result);
}

export function assertDecisionContextObservationRevisionCreation(value: unknown): asserts value is DecisionContextObservationRevisionCreation {
  const invalid = "ERR_DECISION_CONTEXT_OBSERVATION_REVISION_CREATION_INVALID";
  try {
    const artifact = exactOwn(value, artifactKeys, invalid);
    if (artifact.artifactKind !== "DECISION_CONTEXT_OBSERVATION_REVISION_CREATION" || artifact.schemaVersion !== DECISION_CONTEXT_OBSERVATION_REVISION_CREATION_SCHEMA_VERSION || typeof artifact.decisionContextObservationRevisionCreationId !== "string" || !artifactIdPattern.test(artifact.decisionContextObservationRevisionCreationId)) fail(invalid);
    const predecessor = capturePredecessor(artifact.decisionContextObservationContextValidationAssembly, invalid);
    const revision = captureRevision(artifact.revision, invalid);
    const expected = expectedRevision(predecessor, invalid);
    if (!sameData(revision, expected)) fail(invalid);
    if (artifact.decisionContextObservationRevisionCreationId !== artifactId(predecessor, revision)) fail("ERR_DECISION_CONTEXT_OBSERVATION_REVISION_CREATION_ID_MISMATCH");
  } catch (error) {
    if (error instanceof Error && error.message === "ERR_DECISION_CONTEXT_OBSERVATION_REVISION_CREATION_ID_MISMATCH") throw error;
    return fail(invalid);
  }
}
