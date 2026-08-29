import { createHash } from "node:crypto";
import {
  assertDecisionContextObservationTargetDeclaration,
  type DecisionContextObservationTargetDeclaration
} from "../context-observation-target-declaration";
import { assertDecisionContextRevision, type DecisionContextRevision } from "../revisions";
import {
  DECISION_CONTEXT_OBSERVATION_TARGET_REVISION_BINDING_SCHEMA_VERSION,
  type BoundDecisionContextObservationTargetRevisionBinder,
  type DecisionContextObservationTargetRevisionBinding,
  type DecisionContextObservationTargetRevisionReader
} from "./types";

const fail = (code: string): never => { throw new Error(code); };
const bindingKeys = ["artifactKind", "schemaVersion", "decisionContextObservationTargetRevisionBindingId", "decisionContextObservationTargetDeclaration", "revision"] as const;
const bindingIdPattern = /^DCOTRB_[0-9A-F]{24}$/;
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

function exact(value: unknown, keys: readonly string[], code: string): Record<string, Captured> {
  const object = capture(value, code);
  if (object === null || Array.isArray(object) || typeof object !== "object") return fail(code);
  const actual = Object.keys(object);
  if (actual.length !== keys.length || keys.some((key) => !Object.prototype.hasOwnProperty.call(object, key))) return fail(code);
  return object;
}

function canonical(value: Captured): Captured {
  if (Array.isArray(value)) return value.map(canonical);
  if (value === null || typeof value !== "object") return value;
  const result: { [key: string]: Captured } = {};
  for (const key of Object.keys(value).sort((left, right) => left < right ? -1 : left > right ? 1 : 0)) result[key] = canonical(value[key]);
  return result;
}

function captureDeclaration(value: unknown, code: string): DecisionContextObservationTargetDeclaration {
  try {
    const declaration = capture(value, code) as unknown as DecisionContextObservationTargetDeclaration;
    assertDecisionContextObservationTargetDeclaration(declaration);
    return declaration;
  } catch { return fail(code); }
}

function captureRevision(value: unknown, targetRevisionId: string, code: string): DecisionContextRevision {
  try {
    const revision = capture(value, code) as unknown as DecisionContextRevision;
    assertDecisionContextRevision(revision);
    if (revision.revisionId !== targetRevisionId) return fail(code);
    return revision;
  } catch { return fail(code); }
}

function bindingId(declaration: DecisionContextObservationTargetDeclaration, revision: DecisionContextRevision): string {
  const digest = createHash("sha256").update(JSON.stringify([
    DECISION_CONTEXT_OBSERVATION_TARGET_REVISION_BINDING_SCHEMA_VERSION,
    canonical(declaration as unknown as Captured),
    canonical(revision as unknown as Captured)
  ]), "utf8").digest("hex").slice(0, 24).toUpperCase();
  return `DCOTRB_${digest}`;
}

function construct(declaration: DecisionContextObservationTargetDeclaration, revision: DecisionContextRevision): DecisionContextObservationTargetRevisionBinding {
  return {
    artifactKind: "DECISION_CONTEXT_OBSERVATION_TARGET_REVISION_BINDING",
    schemaVersion: DECISION_CONTEXT_OBSERVATION_TARGET_REVISION_BINDING_SCHEMA_VERSION,
    decisionContextObservationTargetRevisionBindingId: bindingId(declaration, revision),
    decisionContextObservationTargetDeclaration: declaration,
    revision
  };
}

function captureReader(value: unknown): (revisionId: string) => Promise<DecisionContextRevision | null> {
  const code = "ERR_DECISION_CONTEXT_OBSERVATION_TARGET_REVISION_BINDING_READER_INVALID";
  try {
    if (value === null || typeof value !== "object" || Array.isArray(value)) return fail(code);
    const keys = Reflect.ownKeys(value);
    if (keys.length !== 1 || keys[0] !== "getRevisionById") return fail(code);
    const descriptor = Reflect.getOwnPropertyDescriptor(value, "getRevisionById");
    if (descriptor === undefined || descriptor.enumerable !== true || !("value" in descriptor) || typeof descriptor.value !== "function") return fail(code);
    return descriptor.value.bind(value) as (revisionId: string) => Promise<DecisionContextRevision | null>;
  } catch { return fail(code); }
}

export function createBoundDecisionContextObservationTargetRevisionBinder(reader: DecisionContextObservationTargetRevisionReader): BoundDecisionContextObservationTargetRevisionBinder {
  const getRevisionById = captureReader(reader);
  return {
    async bind(declaration: DecisionContextObservationTargetDeclaration): Promise<DecisionContextObservationTargetRevisionBinding> {
      const capturedDeclaration = captureDeclaration(declaration, "ERR_DECISION_CONTEXT_OBSERVATION_TARGET_REVISION_BINDING_DECLARATION_INVALID");
      const targetRevisionId = capturedDeclaration.targetRevisionId;
      const returned = await getRevisionById(targetRevisionId);
      if (returned === null) fail("ERR_DECISION_CONTEXT_OBSERVATION_TARGET_REVISION_BINDING_REVISION_NOT_FOUND");
      const capturedRevision = captureRevision(returned, targetRevisionId, "ERR_DECISION_CONTEXT_OBSERVATION_TARGET_REVISION_BINDING_REVISION_INVALID");
      const result = construct(capturedDeclaration, capturedRevision);
      assertDecisionContextObservationTargetRevisionBinding(result);
      return structuredClone(result);
    }
  };
}

export function assertDecisionContextObservationTargetRevisionBinding(value: unknown): asserts value is DecisionContextObservationTargetRevisionBinding {
  const invalid = "ERR_DECISION_CONTEXT_OBSERVATION_TARGET_REVISION_BINDING_INVALID";
  try {
    const binding = exact(value, bindingKeys, invalid);
    if (binding.artifactKind !== "DECISION_CONTEXT_OBSERVATION_TARGET_REVISION_BINDING" || binding.schemaVersion !== DECISION_CONTEXT_OBSERVATION_TARGET_REVISION_BINDING_SCHEMA_VERSION || typeof binding.decisionContextObservationTargetRevisionBindingId !== "string" || !bindingIdPattern.test(binding.decisionContextObservationTargetRevisionBindingId)) fail(invalid);
    const declaration = captureDeclaration(binding.decisionContextObservationTargetDeclaration, invalid);
    const revision = captureRevision(binding.revision, declaration.targetRevisionId, invalid);
    if (binding.decisionContextObservationTargetRevisionBindingId !== bindingId(declaration, revision)) fail("ERR_DECISION_CONTEXT_OBSERVATION_TARGET_REVISION_BINDING_ID_MISMATCH");
  } catch (error) {
    if (error instanceof Error && error.message === "ERR_DECISION_CONTEXT_OBSERVATION_TARGET_REVISION_BINDING_ID_MISMATCH") throw error;
    return fail(invalid);
  }
}
