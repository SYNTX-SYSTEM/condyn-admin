import { canonicalizeTargetRoleProfilePayload } from "./canonicalize";
import { deriveTargetRoleProfileRevisionId } from "./identity";
import type { TargetRoleProfileRevision, TargetRoleProfileRevisionInput } from "./types";
const fail = (): never => { throw new Error("ERR_TARGET_ROLE_PROFILE_REVISION_INVALID"); };
const keys = (value: Record<string, unknown>, expected: string[]) => { const actual = Object.keys(value).sort(), sorted = [...expected].sort(); if (actual.length !== sorted.length || actual.some((key, index) => key !== sorted[index])) fail(); };
const clone = (value: unknown): Record<string, unknown> => { try { if (!value || typeof value !== "object" || Array.isArray(value)) return fail(); return structuredClone(value) as Record<string, unknown>; } catch { return fail(); } };
const string = (value: unknown): value is string => typeof value === "string" && value.length > 0;
const timestamp = (value: unknown): value is string => typeof value === "string" && !Number.isNaN(new Date(value).valueOf()) && new Date(value).toISOString() === value;
function input(value: unknown): TargetRoleProfileRevisionInput {
  const item = clone(value); keys(item, ["targetRoleEntityId", "targetRoleOrganizationBindingRevisionId", "previousRevisionId", "profile", "proposalState", "sourceEvidenceState", "semanticValidationState", "authorityState", "schemaVersion", "createdAt"]);
  if (!string(item.targetRoleEntityId) || !string(item.targetRoleOrganizationBindingRevisionId) || !(item.previousRevisionId === null || string(item.previousRevisionId)) || item.proposalState !== "PROPOSAL_ONLY" || item.sourceEvidenceState !== "SOURCE_MATCH_VERIFIED" || item.semanticValidationState !== "NOT_RUN" || item.authorityState !== "NONE" || item.schemaVersion !== "TARGET_ROLE_PROFILE_REVISION_V1" || !timestamp(item.createdAt)) fail();
  return { ...item, profile: canonicalizeTargetRoleProfilePayload(item.profile) } as TargetRoleProfileRevisionInput;
}
export function createTargetRoleProfileRevision(value: TargetRoleProfileRevisionInput): TargetRoleProfileRevision { const canonical = input(value); const revision = { targetRoleProfileRevisionId: deriveTargetRoleProfileRevisionId(canonical), ...canonical }; assertTargetRoleProfileRevision(revision); return structuredClone(revision); }
export function assertTargetRoleProfileRevision(value: unknown): asserts value is TargetRoleProfileRevision { const item = clone(value); keys(item, ["targetRoleProfileRevisionId", "targetRoleEntityId", "targetRoleOrganizationBindingRevisionId", "previousRevisionId", "profile", "proposalState", "sourceEvidenceState", "semanticValidationState", "authorityState", "schemaVersion", "createdAt"]); if (!string(item.targetRoleProfileRevisionId)) fail(); const { targetRoleProfileRevisionId, ...rest } = item; if (targetRoleProfileRevisionId !== deriveTargetRoleProfileRevisionId(input(rest))) fail(); }
export function captureTargetRoleProfileRevision(value: unknown): TargetRoleProfileRevision { assertTargetRoleProfileRevision(value); return structuredClone(value); }
