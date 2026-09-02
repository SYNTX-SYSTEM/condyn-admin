import { deriveTargetRoleSourceBindingRevisionId } from "./identity";
import type {
  TargetRoleSourceBindingRevision,
  TargetRoleSourceBindingRevisionInput
} from "./types";

const fail = (): never => {
  throw new Error("ERR_TARGET_ROLE_SOURCE_BINDING_REVISION_INVALID");
};

type Captured = null | boolean | number | string | Captured[] | { [key: string]: Captured };

function capture(value: unknown, ancestors: WeakSet<object> = new WeakSet<object>()): Captured {
  try {
    if (value === null || typeof value === "boolean" || typeof value === "number" || typeof value === "string") return value;
    if (typeof value !== "object" || ancestors.has(value)) return fail();
    ancestors.add(value);
    try {
      if (Array.isArray(value)) return fail();
      const result: { [key: string]: Captured } = {};
      for (const key of Reflect.ownKeys(value)) {
        if (typeof key !== "string") return fail();
        const descriptor = Reflect.getOwnPropertyDescriptor(value, key);
        if (descriptor === undefined || descriptor.enumerable !== true || !("value" in descriptor)) return fail();
        Object.defineProperty(result, key, {
          value: capture(descriptor.value, ancestors), enumerable: true, writable: true, configurable: true
        });
      }
      return result;
    } finally {
      ancestors.delete(value);
    }
  } catch {
    return fail();
  }
}

function exactKeys(value: Record<string, unknown>, keys: readonly string[]): void {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) fail();
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function canonicalTimestamp(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const date = new Date(value);
  return !Number.isNaN(date.valueOf()) && date.toISOString() === value;
}

function asInput(value: unknown): TargetRoleSourceBindingRevisionInput {
  const captured = capture(value) as Record<string, unknown>;
  exactKeys(captured, [
    "targetRoleEntityId", "targetSourceRevisionId", "previousRevisionId", "schemaVersion", "createdAt"
  ]);
  if (
    !nonEmptyString(captured.targetRoleEntityId) ||
    !nonEmptyString(captured.targetSourceRevisionId) ||
    !(captured.previousRevisionId === null || nonEmptyString(captured.previousRevisionId)) ||
    captured.schemaVersion !== "TARGET_ROLE_SOURCE_BINDING_REVISION_V1" ||
    !canonicalTimestamp(captured.createdAt)
  ) fail();
  return captured as unknown as TargetRoleSourceBindingRevisionInput;
}

export function createTargetRoleSourceBindingRevision(
  input: TargetRoleSourceBindingRevisionInput
): TargetRoleSourceBindingRevision {
  // This records no copied Source metadata or targetSourceEntityId; Source continuity resolves later.
  const canonical = asInput(input);
  const revision: TargetRoleSourceBindingRevision = {
    targetRoleSourceBindingRevisionId: deriveTargetRoleSourceBindingRevisionId(canonical),
    ...canonical
  };
  assertTargetRoleSourceBindingRevision(revision);
  return structuredClone(revision);
}

export function assertTargetRoleSourceBindingRevision(
  value: unknown
): asserts value is TargetRoleSourceBindingRevision {
  const captured = capture(value) as Record<string, unknown>;
  exactKeys(captured, [
    "targetRoleSourceBindingRevisionId", "targetRoleEntityId", "targetSourceRevisionId",
    "previousRevisionId", "schemaVersion", "createdAt"
  ]);
  const { targetRoleSourceBindingRevisionId, ...input } = captured;
  if (!nonEmptyString(targetRoleSourceBindingRevisionId)) fail();
  const canonical = asInput(input);
  if (targetRoleSourceBindingRevisionId !== deriveTargetRoleSourceBindingRevisionId(canonical)) fail();
}

export function captureTargetRoleSourceBindingRevision(value: unknown): TargetRoleSourceBindingRevision {
  const captured = capture(value) as unknown as TargetRoleSourceBindingRevision;
  assertTargetRoleSourceBindingRevision(captured);
  return structuredClone(captured);
}
