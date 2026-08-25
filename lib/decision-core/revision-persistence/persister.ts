import { assertDecisionContextRevision, type DecisionContextRevision } from "../revisions";
import type { BoundDecisionContextRevisionPersister } from "./types";

const fail = (code: string): never => { throw new Error(code); };
type Captured = null | boolean | number | string | Captured[] | { [key: string]: Captured };

const sameData = (left: unknown, right: unknown): boolean => {
  if (left === right) return true;
  if (left === null || right === null || typeof left !== "object" || typeof right !== "object") return false;
  if (Array.isArray(left) || Array.isArray(right)) return Array.isArray(left) && Array.isArray(right) && left.length === right.length && left.every((value, index) => sameData(value, right[index]));
  const leftRecord = left as Record<string, unknown>; const rightRecord = right as Record<string, unknown>;
  const leftKeys = Object.keys(leftRecord).sort(); const rightKeys = Object.keys(rightRecord).sort();
  return leftKeys.length === rightKeys.length && leftKeys.every((key, index) => key === rightKeys[index] && sameData(leftRecord[key], rightRecord[key]));
};

function capture(value: unknown, code: string, ancestors: WeakSet<object> = new WeakSet<object>()): Captured {
  try {
    if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
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

function captureCallerRevision(value: unknown): DecisionContextRevision {
  const revision = capture(value, "ERR_DECISION_CONTEXT_REVISION_INVALID") as unknown as DecisionContextRevision;
  assertDecisionContextRevision(revision);
  return revision;
}

function captureParent(value: unknown, expectedId: string): DecisionContextRevision {
  try {
    const parent = capture(value, "ERR_DECISION_CONTEXT_REVISION_PARENT_INVALID") as unknown as DecisionContextRevision;
    assertDecisionContextRevision(parent);
    if (parent.revisionId !== expectedId) return fail("ERR_DECISION_CONTEXT_REVISION_PARENT_INVALID");
    return parent;
  } catch { return fail("ERR_DECISION_CONTEXT_REVISION_PARENT_INVALID"); }
}

function captureExactReread(value: unknown, expected: DecisionContextRevision): DecisionContextRevision {
  try {
    if (value === null) return fail("ERR_DECISION_CONTEXT_REVISION_PERSISTENCE_INVALID");
    const reread = capture(value, "ERR_DECISION_CONTEXT_REVISION_PERSISTENCE_INVALID") as unknown as DecisionContextRevision;
    assertDecisionContextRevision(reread);
    if (reread.revisionId !== expected.revisionId || !sameData(reread, expected)) return fail("ERR_DECISION_CONTEXT_REVISION_PERSISTENCE_INVALID");
    return reread;
  } catch { return fail("ERR_DECISION_CONTEXT_REVISION_PERSISTENCE_INVALID"); }
}

export interface RevisionPersistenceDependencies {
  getRevisionById(revisionId: string): Promise<DecisionContextRevision | null>;
  writeRevision(revision: DecisionContextRevision): Promise<void>;
}

interface CapturedRevisionPersistenceDependencies {
  receiver: object;
  getRevisionById: RevisionPersistenceDependencies["getRevisionById"];
  writeRevision: RevisionPersistenceDependencies["writeRevision"];
}

function captureDependencies(value: unknown): CapturedRevisionPersistenceDependencies {
  try {
    if (value === null || typeof value !== "object" || Array.isArray(value)) return fail("ERR_DECISION_CONTEXT_REVISION_REPOSITORY_INVALID");
    const keys = Reflect.ownKeys(value);
    if (keys.length !== 2 || keys.some((key) => typeof key !== "string") || !keys.includes("getRevisionById") || !keys.includes("writeRevision")) return fail("ERR_DECISION_CONTEXT_REVISION_REPOSITORY_INVALID");
    const getDescriptor = Reflect.getOwnPropertyDescriptor(value, "getRevisionById");
    const writeDescriptor = Reflect.getOwnPropertyDescriptor(value, "writeRevision");
    if (getDescriptor === undefined || writeDescriptor === undefined || !("value" in getDescriptor) || !("value" in writeDescriptor) || typeof getDescriptor.value !== "function" || typeof writeDescriptor.value !== "function") return fail("ERR_DECISION_CONTEXT_REVISION_REPOSITORY_INVALID");
    return { receiver: value, getRevisionById: getDescriptor.value, writeRevision: writeDescriptor.value };
  } catch { return fail("ERR_DECISION_CONTEXT_REVISION_REPOSITORY_INVALID"); }
}

/** Internal constructor for one repository-bound persistence authority operation. */
export function createBoundDecisionContextRevisionPersister(dependencies: RevisionPersistenceDependencies): BoundDecisionContextRevisionPersister {
  const captured = captureDependencies(dependencies);
  const getRevisionById = captured.getRevisionById.bind(captured.receiver);
  const writeRevision = captured.writeRevision.bind(captured.receiver);
  return {
    async persist(revision: DecisionContextRevision): Promise<DecisionContextRevision> {
      const expected = captureCallerRevision(revision);
      if (expected.previousRevisionId !== null) {
        const parent = await getRevisionById(expected.previousRevisionId);
        if (parent === null) fail("ERR_DECISION_CONTEXT_REVISION_PARENT_NOT_FOUND");
        captureParent(parent, expected.previousRevisionId);
      }
      await writeRevision(structuredClone(expected));
      return structuredClone(captureExactReread(await getRevisionById(expected.revisionId), expected));
    }
  };
}

export const sameDecisionContextRevisionData = sameData;
