import { deriveTargetSourceRevisionId } from "./identity";
import type {
  TargetSourceEntity,
  TargetSourceRevision,
  TargetSourceRevisionInput
} from "./types";

const fail = (): never => {
  throw new Error("ERR_TARGET_SOURCE_REVISION_INVALID");
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

function canonicalHash(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

function canonicalTimestamp(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const date = new Date(value);
  return !Number.isNaN(date.valueOf()) && date.toISOString() === value;
}

function asInput(value: unknown): TargetSourceRevisionInput {
  const captured = capture(value) as Record<string, unknown>;
  exactKeys(captured, [
    "targetSourceEntityId", "previousRevisionId", "sourceKind", "sourceLocator",
    "rawContentHash", "normalizedContentHash", "normalizedContent",
    "normalizationVersion", "schemaVersion", "createdAt"
  ]);
  // Producer failures such as NO_SOURCE remain outside T1; they never become revision states.
  if (
    !nonEmptyString(captured.targetSourceEntityId) ||
    !(captured.previousRevisionId === null || nonEmptyString(captured.previousRevisionId)) ||
    captured.sourceKind !== "DOCUMENT" ||
    !nonEmptyString(captured.sourceLocator) ||
    !canonicalHash(captured.rawContentHash) ||
    !canonicalHash(captured.normalizedContentHash) ||
    typeof captured.normalizedContent !== "string" ||
    !nonEmptyString(captured.normalizationVersion) ||
    !nonEmptyString(captured.schemaVersion) ||
    !canonicalTimestamp(captured.createdAt)
  ) fail();
  return captured as unknown as TargetSourceRevisionInput;
}

export function createTargetSourceEntity(input: TargetSourceEntity): TargetSourceEntity {
  const captured = capture(input) as Record<string, unknown>;
  exactKeys(captured, ["targetSourceEntityId"]);
  if (!nonEmptyString(captured.targetSourceEntityId)) fail();
  return structuredClone(captured) as unknown as TargetSourceEntity;
}

export function createTargetSourceRevision(input: TargetSourceRevisionInput): TargetSourceRevision {
  // Parent existence and durable storage belong to the persistence boundary.
  const canonical = asInput(input);
  const revision: TargetSourceRevision = {
    targetSourceRevisionId: deriveTargetSourceRevisionId(canonical),
    ...canonical
  };
  assertTargetSourceRevision(revision);
  return structuredClone(revision);
}

export function assertTargetSourceRevision(value: unknown): asserts value is TargetSourceRevision {
  // Validate the complete immutable artifact; malformed input is never repaired in place.
  const captured = capture(value) as Record<string, unknown>;
  exactKeys(captured, [
    "targetSourceRevisionId", "targetSourceEntityId", "previousRevisionId",
    "sourceKind", "sourceLocator", "rawContentHash", "normalizedContentHash",
    "normalizedContent", "normalizationVersion", "schemaVersion", "createdAt"
  ]);
  const { targetSourceRevisionId, ...input } = captured;
  if (!nonEmptyString(targetSourceRevisionId)) fail();
  const canonical = asInput(input);
  if (targetSourceRevisionId !== deriveTargetSourceRevisionId(canonical)) fail();
}

export function captureTargetSourceRevision(value: unknown): TargetSourceRevision {
  const captured = capture(value) as unknown as TargetSourceRevision;
  assertTargetSourceRevision(captured);
  return structuredClone(captured);
}
