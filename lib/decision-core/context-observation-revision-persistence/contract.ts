import { createHash } from "node:crypto";
import {
  assertDecisionContextObservationRevisionCreation,
  type DecisionContextObservationRevisionCreation
} from "../context-observation-revision-creation";
import type { BoundDecisionContextRevisionPersister as RevisionPersister } from "../revision-persistence";
import { assertDecisionContextRevision, type DecisionContextRevision } from "../revisions";
import {
  DECISION_CONTEXT_OBSERVATION_REVISION_PERSISTENCE_SCHEMA_VERSION,
  type BoundDecisionContextObservationRevisionPersister,
  type DecisionContextObservationRevisionPersistence,
  type DecisionContextObservationRevisionPersistenceInput
} from "./types";

const fail = (code: string): never => { throw new Error(code); };
const inputKeys = ["decisionContextObservationRevisionCreation"] as const;
const artifactKeys = ["artifactKind", "schemaVersion", "decisionContextObservationRevisionPersistenceId", "decisionContextObservationRevisionCreation", "persistedRevision"] as const;
const artifactIdPattern = /^DCORP_[0-9A-F]{24}$/;
type Captured = null | boolean | number | string | Captured[] | { [key: string]: Captured };

function capture(value: unknown, code: string, ancestors: WeakSet<object> = new WeakSet<object>()): Captured {
  try {
    if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value as Captured;
    if (typeof value !== "object" || ancestors.has(value)) return fail(code);
    ancestors.add(value);
    try {
      if (Array.isArray(value)) {
        const keys = Reflect.ownKeys(value); const descriptor = Reflect.getOwnPropertyDescriptor(value, "length"); const length = descriptor !== undefined && "value" in descriptor ? descriptor.value : undefined;
        if (typeof length !== "number" || !Number.isSafeInteger(length) || length < 0 || keys.length !== length + 1 || !keys.includes("length") || keys.some((key) => typeof key === "symbol" || (key !== "length" && (!/^(0|[1-9][0-9]*)$/.test(key) || Number(key) >= length)))) return fail(code);
        const result: Captured[] = []; for (let index = 0; index < length; index += 1) { const item = Reflect.getOwnPropertyDescriptor(value, String(index)); if (item === undefined || item.enumerable !== true || !("value" in item)) return fail(code); result.push(capture(item.value, code, ancestors)); } return result;
      }
      const result: { [key: string]: Captured } = {};
      for (const key of Reflect.ownKeys(value)) { if (typeof key !== "string") return fail(code); const descriptor = Reflect.getOwnPropertyDescriptor(value, key); if (descriptor === undefined || descriptor.enumerable !== true || !("value" in descriptor)) return fail(code); Object.defineProperty(result, key, { value: capture(descriptor.value, code, ancestors), enumerable: true, writable: true, configurable: true }); }
      return result;
    } finally { ancestors.delete(value); }
  } catch { return fail(code); }
}

function exactOwn(value: unknown, keys: readonly string[], code: string): Record<string, unknown> {
  try { if (value === null || typeof value !== "object" || Array.isArray(value)) return fail(code); const actual = Reflect.ownKeys(value); if (actual.length !== keys.length || actual.some((key) => typeof key !== "string") || keys.some((key) => !actual.includes(key))) return fail(code); const result: Record<string, unknown> = {}; for (const key of keys) { const descriptor = Reflect.getOwnPropertyDescriptor(value, key); if (descriptor === undefined || descriptor.enumerable !== true || !("value" in descriptor)) return fail(code); Object.defineProperty(result, key, { value: descriptor.value, enumerable: true, writable: true, configurable: true }); } return result; } catch { return fail(code); }
}

function canonical(value: Captured): Captured { if (Array.isArray(value)) return value.map(canonical); if (value === null || typeof value !== "object") return value; const result: { [key: string]: Captured } = {}; for (const key of Object.keys(value).sort()) result[key] = canonical(value[key]); return result; }
function sameData(left: unknown, right: unknown): boolean { if (left === right) return true; if (left === null || right === null || typeof left !== "object" || typeof right !== "object") return false; if (Array.isArray(left) || Array.isArray(right)) return Array.isArray(left) && Array.isArray(right) && left.length === right.length && left.every((value, index) => sameData(value, right[index])); const leftRecord = left as Record<string, unknown>; const rightRecord = right as Record<string, unknown>; const leftKeys = Object.keys(leftRecord).sort(); const rightKeys = Object.keys(rightRecord).sort(); return leftKeys.length === rightKeys.length && leftKeys.every((key, index) => key === rightKeys[index] && sameData(leftRecord[key], rightRecord[key])); }

function captureCreation(value: unknown, code: string): DecisionContextObservationRevisionCreation { try { const creation = capture(value, code) as unknown as DecisionContextObservationRevisionCreation; assertDecisionContextObservationRevisionCreation(creation); return creation; } catch { return fail(code); } }
function captureRevision(value: unknown, code: string): DecisionContextRevision { try { const revision = capture(value, code) as unknown as DecisionContextRevision; assertDecisionContextRevision(revision); return revision; } catch { return fail(code); } }
function artifactId(creation: DecisionContextObservationRevisionCreation, revision: DecisionContextRevision): string { const digest = createHash("sha256").update(JSON.stringify([DECISION_CONTEXT_OBSERVATION_REVISION_PERSISTENCE_SCHEMA_VERSION, canonical(creation as unknown as Captured), canonical(revision as unknown as Captured)]), "utf8").digest("hex").slice(0, 24).toUpperCase(); return `DCORP_${digest}`; }
function construct(creation: DecisionContextObservationRevisionCreation, persistedRevision: DecisionContextRevision): DecisionContextObservationRevisionPersistence { return { artifactKind: "DECISION_CONTEXT_OBSERVATION_REVISION_PERSISTENCE", schemaVersion: DECISION_CONTEXT_OBSERVATION_REVISION_PERSISTENCE_SCHEMA_VERSION, decisionContextObservationRevisionPersistenceId: artifactId(creation, persistedRevision), decisionContextObservationRevisionCreation: creation, persistedRevision }; }

function captureDependency(value: unknown): (revision: DecisionContextRevision) => Promise<DecisionContextRevision> {
  try { if (value === null || typeof value !== "object" || Array.isArray(value)) return fail("ERR_DECISION_CONTEXT_OBSERVATION_REVISION_PERSISTENCE_PERSISTER_INVALID"); const keys = Reflect.ownKeys(value); if (keys.length !== 1 || keys[0] !== "persist") return fail("ERR_DECISION_CONTEXT_OBSERVATION_REVISION_PERSISTENCE_PERSISTER_INVALID"); const descriptor = Reflect.getOwnPropertyDescriptor(value, "persist"); if (descriptor === undefined || descriptor.enumerable !== true || !("value" in descriptor) || typeof descriptor.value !== "function") return fail("ERR_DECISION_CONTEXT_OBSERVATION_REVISION_PERSISTENCE_PERSISTER_INVALID"); return descriptor.value.bind(value) as (revision: DecisionContextRevision) => Promise<DecisionContextRevision>; } catch { return fail("ERR_DECISION_CONTEXT_OBSERVATION_REVISION_PERSISTENCE_PERSISTER_INVALID"); }
}

export function createBoundDecisionContextObservationRevisionPersister(dependency: RevisionPersister): BoundDecisionContextObservationRevisionPersister {
  const persist = captureDependency(dependency);
  return {
    async persist(input: DecisionContextObservationRevisionPersistenceInput): Promise<DecisionContextObservationRevisionPersistence> {
      const wrapper = exactOwn(input, inputKeys, "ERR_DECISION_CONTEXT_OBSERVATION_REVISION_PERSISTENCE_INPUT_INVALID");
      const creation = captureCreation(wrapper.decisionContextObservationRevisionCreation, "ERR_DECISION_CONTEXT_OBSERVATION_REVISION_PERSISTENCE_REVISION_CREATION_INVALID");
      const returned = await persist(structuredClone(creation.revision));
      const persistedRevision = captureRevision(returned, "ERR_DECISION_CONTEXT_OBSERVATION_REVISION_PERSISTENCE_RESULT_INVALID");
      if (!sameData(persistedRevision, creation.revision)) fail("ERR_DECISION_CONTEXT_OBSERVATION_REVISION_PERSISTENCE_RESULT_INVALID");
      const result = construct(creation, persistedRevision); assertDecisionContextObservationRevisionPersistence(result); return structuredClone(result);
    }
  };
}

export function assertDecisionContextObservationRevisionPersistence(value: unknown): asserts value is DecisionContextObservationRevisionPersistence {
  const invalid = "ERR_DECISION_CONTEXT_OBSERVATION_REVISION_PERSISTENCE_INVALID";
  try { const artifact = exactOwn(value, artifactKeys, invalid); if (artifact.artifactKind !== "DECISION_CONTEXT_OBSERVATION_REVISION_PERSISTENCE" || artifact.schemaVersion !== DECISION_CONTEXT_OBSERVATION_REVISION_PERSISTENCE_SCHEMA_VERSION || typeof artifact.decisionContextObservationRevisionPersistenceId !== "string" || !artifactIdPattern.test(artifact.decisionContextObservationRevisionPersistenceId)) fail(invalid); const creation = captureCreation(artifact.decisionContextObservationRevisionCreation, invalid); const persistedRevision = captureRevision(artifact.persistedRevision, invalid); if (!sameData(persistedRevision, creation.revision)) fail(invalid); if (artifact.decisionContextObservationRevisionPersistenceId !== artifactId(creation, persistedRevision)) fail("ERR_DECISION_CONTEXT_OBSERVATION_REVISION_PERSISTENCE_ID_MISMATCH"); } catch (error) { if (error instanceof Error && error.message === "ERR_DECISION_CONTEXT_OBSERVATION_REVISION_PERSISTENCE_ID_MISMATCH") throw error; return fail(invalid); }
}
