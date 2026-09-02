import { deriveTargetRoleOrganizationBindingRevisionId } from "./identity";
import type { TargetRoleOrganizationBindingRevision, TargetRoleOrganizationBindingRevisionInput } from "./types";
const fail = (): never => { throw new Error("ERR_TARGET_ROLE_ORGANIZATION_BINDING_REVISION_INVALID"); };
type Captured = null | boolean | number | string | Captured[] | { [key: string]: Captured };
function capture(value: unknown, seen: WeakSet<object> = new WeakSet<object>()): Captured {
  try {
    if (value === null || ["boolean", "number", "string"].includes(typeof value)) return value as Captured;
    if (typeof value !== "object" || seen.has(value) || Array.isArray(value)) return fail();
    seen.add(value); try { const result: { [key: string]: Captured } = {}; for (const key of Reflect.ownKeys(value)) { if (typeof key !== "string") return fail(); const descriptor = Reflect.getOwnPropertyDescriptor(value, key); if (descriptor === undefined || descriptor.enumerable !== true || !("value" in descriptor)) return fail(); Object.defineProperty(result, key, { value: capture(descriptor.value, seen), enumerable: true, writable: true, configurable: true }); } return result; } finally { seen.delete(value); }
  } catch { return fail(); }
}
const nonEmpty = (value: unknown): value is string => typeof value === "string" && value.length > 0;
const timestamp = (value: unknown): value is string => typeof value === "string" && !Number.isNaN(new Date(value).valueOf()) && new Date(value).toISOString() === value;
function input(value: unknown): TargetRoleOrganizationBindingRevisionInput {
  const captured = capture(value) as Record<string, unknown>; const keys = Object.keys(captured).sort(); const expected = ["targetRoleEntityId", "targetRoleSourceBindingRevisionId", "targetOrganizationRevisionId", "previousRevisionId", "schemaVersion", "createdAt"].sort();
  if (keys.length !== expected.length || keys.some((key, index) => key !== expected[index]) || !nonEmpty(captured.targetRoleEntityId) || !nonEmpty(captured.targetRoleSourceBindingRevisionId) || !nonEmpty(captured.targetOrganizationRevisionId) || !(captured.previousRevisionId === null || nonEmpty(captured.previousRevisionId)) || captured.schemaVersion !== "TARGET_ROLE_ORGANIZATION_BINDING_REVISION_V1" || !timestamp(captured.createdAt)) fail();
  return captured as unknown as TargetRoleOrganizationBindingRevisionInput;
}
export function createTargetRoleOrganizationBindingRevision(value: TargetRoleOrganizationBindingRevisionInput): TargetRoleOrganizationBindingRevision { const canonical = input(value); const revision = { targetRoleOrganizationBindingRevisionId: deriveTargetRoleOrganizationBindingRevisionId(canonical), ...canonical }; assertTargetRoleOrganizationBindingRevision(revision); return structuredClone(revision); }
export function assertTargetRoleOrganizationBindingRevision(value: unknown): asserts value is TargetRoleOrganizationBindingRevision { const captured = capture(value) as Record<string, unknown>; const keys = Object.keys(captured).sort(); const expected = ["targetRoleOrganizationBindingRevisionId", "targetRoleEntityId", "targetRoleSourceBindingRevisionId", "targetOrganizationRevisionId", "previousRevisionId", "schemaVersion", "createdAt"].sort(); if (keys.length !== expected.length || keys.some((key, index) => key !== expected[index]) || !nonEmpty(captured.targetRoleOrganizationBindingRevisionId)) fail(); const { targetRoleOrganizationBindingRevisionId, ...rest } = captured; if (targetRoleOrganizationBindingRevisionId !== deriveTargetRoleOrganizationBindingRevisionId(input(rest))) fail(); }
export function captureTargetRoleOrganizationBindingRevision(value: unknown): TargetRoleOrganizationBindingRevision { const captured = capture(value) as unknown as TargetRoleOrganizationBindingRevision; assertTargetRoleOrganizationBindingRevision(captured); return structuredClone(captured); }
