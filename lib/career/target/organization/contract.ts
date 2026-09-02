import { deriveTargetOrganizationRevisionId } from "./identity";
import type {
  TargetOrganizationEntity,
  TargetOrganizationRevision,
  TargetOrganizationRevisionInput
} from "./types";

const fail = (): never => {
  throw new Error("ERR_TARGET_ORGANIZATION_REVISION_INVALID");
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

function asInput(value: unknown): TargetOrganizationRevisionInput {
  const captured = capture(value) as Record<string, unknown>;
  exactKeys(captured, [
    "targetOrganizationEntityId", "previousRevisionId", "organizationDescriptor",
    "descriptorKind", "schemaVersion", "createdAt"
  ]);
  // T2 accepts descriptive declared-name state only; it performs no organization identity resolution.
  if (
    !nonEmptyString(captured.targetOrganizationEntityId) ||
    !(captured.previousRevisionId === null || nonEmptyString(captured.previousRevisionId)) ||
    !nonEmptyString(captured.organizationDescriptor) ||
    captured.descriptorKind !== "DECLARED_NAME" ||
    captured.schemaVersion !== "TARGET_ORGANIZATION_REVISION_V1" ||
    !canonicalTimestamp(captured.createdAt)
  ) fail();
  return captured as unknown as TargetOrganizationRevisionInput;
}

export function createTargetOrganizationEntity(input: TargetOrganizationEntity): TargetOrganizationEntity {
  const captured = capture(input) as Record<string, unknown>;
  exactKeys(captured, ["targetOrganizationEntityId"]);
  if (!nonEmptyString(captured.targetOrganizationEntityId)) fail();
  return structuredClone(captured) as unknown as TargetOrganizationEntity;
}

export function createTargetOrganizationRevision(input: TargetOrganizationRevisionInput): TargetOrganizationRevision {
  // Construction is pure: it creates no source/role binding, relation, resonance, or matching state.
  const canonical = asInput(input);
  const revision: TargetOrganizationRevision = {
    targetOrganizationRevisionId: deriveTargetOrganizationRevisionId(canonical),
    ...canonical
  };
  assertTargetOrganizationRevision(revision);
  return structuredClone(revision);
}

export function assertTargetOrganizationRevision(value: unknown): asserts value is TargetOrganizationRevision {
  const captured = capture(value) as Record<string, unknown>;
  exactKeys(captured, [
    "targetOrganizationRevisionId", "targetOrganizationEntityId", "previousRevisionId",
    "organizationDescriptor", "descriptorKind", "schemaVersion", "createdAt"
  ]);
  const { targetOrganizationRevisionId, ...input } = captured;
  if (!nonEmptyString(targetOrganizationRevisionId)) fail();
  const canonical = asInput(input);
  if (targetOrganizationRevisionId !== deriveTargetOrganizationRevisionId(canonical)) fail();
}
