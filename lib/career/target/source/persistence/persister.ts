import {
  assertTargetSourceRevision,
  captureTargetSourceRevision
} from "../contract";
import type { TargetSourceRevision } from "../types";
import type { BoundTargetSourceRevisionPersister } from "./types";

const fail = (code: string): never => {
  throw new Error(code);
};

export interface TargetSourceRevisionPersistenceDependencies {
  getRevisionById(targetSourceRevisionId: string): Promise<TargetSourceRevision | null>;
  writeRevision(revision: TargetSourceRevision): Promise<void>;
}

const sameData = (left: unknown, right: unknown): boolean => {
  if (left === right) return true;
  if (left === null || right === null || typeof left !== "object" || typeof right !== "object") return false;
  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left) && Array.isArray(right) && left.length === right.length && left.every((item, index) => sameData(item, right[index]));
  }
  const leftRecord = left as Record<string, unknown>;
  const rightRecord = right as Record<string, unknown>;
  const leftKeys = Object.keys(leftRecord).sort();
  const rightKeys = Object.keys(rightRecord).sort();
  return leftKeys.length === rightKeys.length && leftKeys.every((key, index) => key === rightKeys[index] && sameData(leftRecord[key], rightRecord[key]));
};

function captureDependencies(value: unknown): {
  receiver: object;
  getRevisionById: TargetSourceRevisionPersistenceDependencies["getRevisionById"];
  writeRevision: TargetSourceRevisionPersistenceDependencies["writeRevision"];
} {
  try {
    if (value === null || typeof value !== "object" || Array.isArray(value)) return fail("ERR_TARGET_SOURCE_REVISION_INVALID");
    const keys = Reflect.ownKeys(value);
    if (keys.length !== 2 || !keys.includes("getRevisionById") || !keys.includes("writeRevision")) return fail("ERR_TARGET_SOURCE_REVISION_INVALID");
    const get = Reflect.getOwnPropertyDescriptor(value, "getRevisionById");
    const write = Reflect.getOwnPropertyDescriptor(value, "writeRevision");
    if (get === undefined || write === undefined || !("value" in get) || !("value" in write) || typeof get.value !== "function" || typeof write.value !== "function") return fail("ERR_TARGET_SOURCE_REVISION_INVALID");
    return { receiver: value, getRevisionById: get.value, writeRevision: write.value };
  } catch {
    return fail("ERR_TARGET_SOURCE_REVISION_INVALID");
  }
}

function captureParent(value: unknown, expectedId: string, expectedEntityId: string): TargetSourceRevision {
  try {
    const parent = captureTargetSourceRevision(value);
    if (parent.targetSourceRevisionId !== expectedId || parent.targetSourceEntityId !== expectedEntityId) return fail("ERR_TARGET_SOURCE_REVISION_PARENT_INVALID");
    return parent;
  } catch {
    return fail("ERR_TARGET_SOURCE_REVISION_PARENT_INVALID");
  }
}

function captureExactReread(value: unknown, expected: TargetSourceRevision): TargetSourceRevision {
  try {
    if (value === null) return fail("ERR_TARGET_SOURCE_REVISION_PERSISTENCE_INVALID");
    const reread = captureTargetSourceRevision(value);
    if (reread.targetSourceRevisionId !== expected.targetSourceRevisionId || !sameData(reread, expected)) return fail("ERR_TARGET_SOURCE_REVISION_PERSISTENCE_INVALID");
    return reread;
  } catch {
    return fail("ERR_TARGET_SOURCE_REVISION_PERSISTENCE_INVALID");
  }
}

async function rereadPersistedRevision(
  getRevisionById: TargetSourceRevisionPersistenceDependencies["getRevisionById"],
  expected: TargetSourceRevision
): Promise<TargetSourceRevision> {
  try {
    return captureExactReread(await getRevisionById(expected.targetSourceRevisionId), expected);
  } catch (error) {
    if (error instanceof Error && error.message === "ERR_TARGET_SOURCE_REVISION_POSTGRES_RECORD_INVALID") {
      return fail("ERR_TARGET_SOURCE_REVISION_PERSISTENCE_INVALID");
    }
    throw error;
  }
}

/** Internal constructor: only repositories expose a persister to normal callers. */
export function createBoundTargetSourceRevisionPersister(
  dependencies: TargetSourceRevisionPersistenceDependencies
): BoundTargetSourceRevisionPersister {
  const captured = captureDependencies(dependencies);
  const getRevisionById = captured.getRevisionById.bind(captured.receiver);
  const writeRevision = captured.writeRevision.bind(captured.receiver);

  return {
    async persist(revision: TargetSourceRevision): Promise<TargetSourceRevision> {
      const expected = captureTargetSourceRevision(revision);
      if (expected.previousRevisionId !== null) {
        const parent = await getRevisionById(expected.previousRevisionId);
        if (parent === null) fail("ERR_TARGET_SOURCE_REVISION_PARENT_NOT_FOUND");
        captureParent(parent, expected.previousRevisionId, expected.targetSourceEntityId);
      }
      await writeRevision(structuredClone(expected));
      return structuredClone(await rereadPersistedRevision(getRevisionById, expected));
    }
  };
}

export const sameTargetSourceRevisionData = sameData;

export function assertPersistableTargetSourceRevision(value: unknown): asserts value is TargetSourceRevision {
  assertTargetSourceRevision(value);
}
