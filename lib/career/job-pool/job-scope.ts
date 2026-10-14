import type { JobPoolUploadView } from "./types";

/**
 * Job scope of a capability sweep (SFE invariant, owner 2026-10-14): no analysis — and so no Gemini call — without a
 * valid, explicitly selected job. The API contract is GELB's (POST /api/career/analyze):
 * `jobScope: { jobPoolUploadId, poolRoleId }`, exactly these two keys. `jobId` stays the analysis execution job
 * (/api/career/jobs/[jobId]); the scope is never called a job id.
 *
 * The scope is a selection, never an inference: it is set only by the explicit job selection in the Job Field and
 * restored only from the exact URL parameters `jobScopePoolUploadId` / `jobScopeRoleId`.
 */
export interface JobScope {
  jobPoolUploadId: string;
  poolRoleId: string;
}

/** The owner's wording, verbatim in every locale (owner: „Zeige exakt“). Codes, not this text, carry the meaning. */
export const JOB_SCOPE_REQUIRED_MESSAGE = "Bitte wählen Sie einen Job aus.";
export const JOB_SCOPE_REQUIRED_CODE = "ERR_JOB_SCOPE_REQUIRED";
export const JOB_SCOPE_INVALID_CODE = "ERR_JOB_SCOPE_INVALID";

export const JOB_SCOPE_URL_PARAMS = { jobPoolUploadId: "jobScopePoolUploadId", poolRoleId: "jobScopeRoleId" } as const;

const JOB_POOL_UPLOAD_ID = /^JPOOL_[0-9A-F]{32}$/;

export function isJobScopeErrorCode(code: string | null | undefined): boolean {
  return code === JOB_SCOPE_REQUIRED_CODE || code === JOB_SCOPE_INVALID_CODE;
}

/** Formal check only (the server checks existence): an object with exactly the two keys, an upload id and a non-blank role id. */
export function parseJobScope(value: unknown): JobScope | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return null;
  const keys = Object.keys(value);
  if (keys.length !== 2 || !keys.includes("jobPoolUploadId") || !keys.includes("poolRoleId")) return null;
  const { jobPoolUploadId, poolRoleId } = value as Record<string, unknown>;
  if (typeof jobPoolUploadId !== "string" || !JOB_POOL_UPLOAD_ID.test(jobPoolUploadId)) return null;
  if (typeof poolRoleId !== "string" || poolRoleId.trim().length === 0 || poolRoleId !== poolRoleId.trim()) return null;
  return { jobPoolUploadId, poolRoleId };
}

export function jobScopeFromParams(jobPoolUploadId: string | null | undefined, poolRoleId: string | null | undefined): JobScope | null {
  return parseJobScope({ jobPoolUploadId, poolRoleId });
}

export function sameJobScope(left: JobScope | null, right: JobScope | null): boolean {
  return left !== null && right !== null && left.jobPoolUploadId === right.jobPoolUploadId && left.poolRoleId === right.poolRoleId;
}

export type JobScopeInvalidReason = "UPLOAD_NOT_FOUND" | "POOL_NOT_ACTIVE" | "NOT_MAPPED" | "ROLE_NOT_IN_POOL" | "READ_FAILED";

/** Only VALID admits ANALYZE; CHECKING and INVALID block it exactly like NONE. */
export type JobScopeValidation =
  | { state: "NONE" }
  | { state: "CHECKING"; scope: JobScope }
  | { state: "VALID"; scope: JobScope; roleTitle: string; organizationId: string; organizationName: string | null; poolName: string }
  | { state: "INVALID"; scope: JobScope; reason: JobScopeInvalidReason };

/** The frontend mirror of the server rule: upload ACTIVE, canonical mapping present, role part of that mapping. */
export function validateJobScope(scope: JobScope, upload: JobPoolUploadView): JobScopeValidation {
  if (upload.jobPoolUploadId !== scope.jobPoolUploadId) return { state: "INVALID", scope, reason: "UPLOAD_NOT_FOUND" };
  if (upload.poolStatus !== "ACTIVE") return { state: "INVALID", scope, reason: "POOL_NOT_ACTIVE" };
  if (upload.canonicalMapping?.mappingState !== "MAPPED") return { state: "INVALID", scope, reason: "NOT_MAPPED" };
  const role = upload.canonicalMapping.roles.find(candidate => candidate.poolRoleId === scope.poolRoleId);
  if (role === undefined) return { state: "INVALID", scope, reason: "ROLE_NOT_IN_POOL" };
  const organization = upload.canonicalMapping.organizations.find(candidate => candidate.poolOrganizationId === role.poolOrganizationId);
  return { state: "VALID", scope, roleTitle: role.title, organizationId: role.poolOrganizationId, organizationName: organization?.name ?? null, poolName: upload.poolName };
}
