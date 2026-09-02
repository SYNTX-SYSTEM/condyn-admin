import {
  assertTargetSourceRevision,
  type TargetSourceRevision
} from "../../../source";
import {
  assertTargetRoleSourceBindingRevision,
  captureTargetRoleSourceBindingRevision
} from "../contract";
import type { TargetRoleSourceBindingRevision } from "../types";
import type { BoundTargetRoleSourceBindingRevisionPersister } from "./types";

const fail = (code: string): never => {
  throw new Error(code);
};

export interface TargetRoleSourceBindingRevisionPersistenceDependencies {
  getRevisionById(targetRoleSourceBindingRevisionId: string): Promise<TargetRoleSourceBindingRevision | null>;
  getTargetSourceRevisionById(targetSourceRevisionId: string): Promise<TargetSourceRevision | null>;
  writeRevision(revision: TargetRoleSourceBindingRevision): Promise<void>;
}

// Structural equality protects immutable persistence integrity; it is not semantic equivalence.
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
  getRevisionById: TargetRoleSourceBindingRevisionPersistenceDependencies["getRevisionById"];
  getTargetSourceRevisionById: TargetRoleSourceBindingRevisionPersistenceDependencies["getTargetSourceRevisionById"];
  writeRevision: TargetRoleSourceBindingRevisionPersistenceDependencies["writeRevision"];
} {
  try {
    if (value === null || typeof value !== "object" || Array.isArray(value)) return fail("ERR_TARGET_ROLE_SOURCE_BINDING_REVISION_INVALID");
    const keys = Reflect.ownKeys(value);
    if (keys.length !== 3 || !keys.includes("getRevisionById") || !keys.includes("getTargetSourceRevisionById") || !keys.includes("writeRevision")) return fail("ERR_TARGET_ROLE_SOURCE_BINDING_REVISION_INVALID");
    const get = Reflect.getOwnPropertyDescriptor(value, "getRevisionById");
    const getSource = Reflect.getOwnPropertyDescriptor(value, "getTargetSourceRevisionById");
    const write = Reflect.getOwnPropertyDescriptor(value, "writeRevision");
    if (get === undefined || getSource === undefined || write === undefined || !("value" in get) || !("value" in getSource) || !("value" in write) || typeof get.value !== "function" || typeof getSource.value !== "function" || typeof write.value !== "function") return fail("ERR_TARGET_ROLE_SOURCE_BINDING_REVISION_INVALID");
    return { receiver: value, getRevisionById: get.value, getTargetSourceRevisionById: getSource.value, writeRevision: write.value };
  } catch {
    return fail("ERR_TARGET_ROLE_SOURCE_BINDING_REVISION_INVALID");
  }
}

async function resolveSource(
  getTargetSourceRevisionById: TargetRoleSourceBindingRevisionPersistenceDependencies["getTargetSourceRevisionById"],
  targetSourceRevisionId: string,
  notFoundCode: string,
  invalidCode: string
): Promise<TargetSourceRevision> {
  // Resolve exactly the referenced immutable Source revision; no copied Source state is authoritative here.
  const source = await getTargetSourceRevisionById(targetSourceRevisionId);
  if (source === null) return fail(notFoundCode);
  try {
    assertTargetSourceRevision(source);
    if (source.targetSourceRevisionId !== targetSourceRevisionId) return fail(invalidCode);
    return structuredClone(source);
  } catch {
    return fail(invalidCode);
  }
}

function captureParent(
  value: unknown,
  expectedId: string,
  expectedRoleEntityId: string
): TargetRoleSourceBindingRevision {
  try {
    const parent = captureTargetRoleSourceBindingRevision(value);
    if (parent.targetRoleSourceBindingRevisionId !== expectedId || parent.targetRoleEntityId !== expectedRoleEntityId) return fail("ERR_TARGET_ROLE_SOURCE_BINDING_REVISION_PARENT_INVALID");
    return parent;
  } catch {
    return fail("ERR_TARGET_ROLE_SOURCE_BINDING_REVISION_PARENT_INVALID");
  }
}

function captureExactReread(
  value: unknown,
  expected: TargetRoleSourceBindingRevision
): TargetRoleSourceBindingRevision {
  try {
    if (value === null) return fail("ERR_TARGET_ROLE_SOURCE_BINDING_REVISION_PERSISTENCE_INVALID");
    const reread = captureTargetRoleSourceBindingRevision(value);
    if (reread.targetRoleSourceBindingRevisionId !== expected.targetRoleSourceBindingRevisionId || !sameData(reread, expected)) return fail("ERR_TARGET_ROLE_SOURCE_BINDING_REVISION_PERSISTENCE_INVALID");
    return reread;
  } catch {
    return fail("ERR_TARGET_ROLE_SOURCE_BINDING_REVISION_PERSISTENCE_INVALID");
  }
}

async function rereadPersistedRevision(
  getRevisionById: TargetRoleSourceBindingRevisionPersistenceDependencies["getRevisionById"],
  expected: TargetRoleSourceBindingRevision
): Promise<TargetRoleSourceBindingRevision> {
  try {
    // Direct reads retain record corruption; only the mandatory final reread maps it to persistence invalid.
    return captureExactReread(await getRevisionById(expected.targetRoleSourceBindingRevisionId), expected);
  } catch (error) {
    if (error instanceof Error && error.message === "ERR_TARGET_ROLE_SOURCE_BINDING_REVISION_POSTGRES_RECORD_INVALID") {
      return fail("ERR_TARGET_ROLE_SOURCE_BINDING_REVISION_PERSISTENCE_INVALID");
    }
    throw error;
  }
}

export function createBoundTargetRoleSourceBindingRevisionPersister(
  dependencies: TargetRoleSourceBindingRevisionPersistenceDependencies
): BoundTargetRoleSourceBindingRevisionPersister {
  const captured = captureDependencies(dependencies);
  const getRevisionById = captured.getRevisionById.bind(captured.receiver);
  const getTargetSourceRevisionById = captured.getTargetSourceRevisionById.bind(captured.receiver);
  const writeRevision = captured.writeRevision.bind(captured.receiver);

  return {
    async persist(revision: TargetRoleSourceBindingRevision): Promise<TargetRoleSourceBindingRevision> {
      const expected = captureTargetRoleSourceBindingRevision(revision);
      const childSource = await resolveSource(
        getTargetSourceRevisionById,
        expected.targetSourceRevisionId,
        "ERR_TARGET_ROLE_SOURCE_BINDING_REVISION_SOURCE_NOT_FOUND",
        "ERR_TARGET_ROLE_SOURCE_BINDING_REVISION_SOURCE_INVALID"
      );
      if (expected.previousRevisionId !== null) {
        const parentValue = await getRevisionById(expected.previousRevisionId);
        if (parentValue === null) fail("ERR_TARGET_ROLE_SOURCE_BINDING_REVISION_PARENT_NOT_FOUND");
        const parent = captureParent(parentValue, expected.previousRevisionId, expected.targetRoleEntityId);
        const parentSource = await resolveSource(
          getTargetSourceRevisionById,
          parent.targetSourceRevisionId,
          "ERR_TARGET_ROLE_SOURCE_BINDING_REVISION_PARENT_SOURCE_NOT_FOUND",
          "ERR_TARGET_ROLE_SOURCE_BINDING_REVISION_PARENT_SOURCE_INVALID"
        );
        if (childSource.targetSourceEntityId !== parentSource.targetSourceEntityId) {
          // A different Source Entity starts an independent Role × Source chain.
          fail("ERR_TARGET_ROLE_SOURCE_BINDING_REVISION_PARENT_INVALID");
        }
      }
      await writeRevision(structuredClone(expected));
      return structuredClone(await rereadPersistedRevision(getRevisionById, expected));
    }
  };
}

export const sameTargetRoleSourceBindingRevisionData = sameData;

export function assertPersistableTargetRoleSourceBindingRevision(
  value: unknown
): asserts value is TargetRoleSourceBindingRevision {
  assertTargetRoleSourceBindingRevision(value);
}
