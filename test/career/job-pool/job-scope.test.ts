import { describe, expect, it } from "vitest";
import { view } from "./fixtures/match-bodies";
import {
  JOB_SCOPE_INVALID_CODE,
  JOB_SCOPE_REQUIRED_CODE,
  JOB_SCOPE_REQUIRED_MESSAGE,
  isJobScopeErrorCode,
  jobScopeFromParams,
  parseJobScope,
  sameJobScope,
  validateJobScope
} from "../../../lib/career/job-pool/job-scope";
import type { JobPoolUploadView } from "../../../lib/career/job-pool/types";

const ID = "JPOOL_B94850C439974E27496FE3B1A9A076B5";
const upload = (patch: Partial<JobPoolUploadView> = {}): JobPoolUploadView => ({ ...view, jobPoolUploadId: ID, ...patch });

describe("job scope (SFE invariant, GELB contract)", () => {
  it("keeps the owner's sentence and the two contract codes verbatim", () => {
    expect(JOB_SCOPE_REQUIRED_MESSAGE).toBe("Bitte wählen Sie einen Job aus.");
    expect(JOB_SCOPE_REQUIRED_CODE).toBe("ERR_JOB_SCOPE_REQUIRED");
    expect(JOB_SCOPE_INVALID_CODE).toBe("ERR_JOB_SCOPE_INVALID");
    expect(isJobScopeErrorCode("ERR_JOB_SCOPE_REQUIRED")).toBe(true);
    expect(isJobScopeErrorCode("ERR_JOB_SCOPE_INVALID")).toBe(true);
    expect(isJobScopeErrorCode("HTTP_400")).toBe(false);
    expect(isJobScopeErrorCode(null)).toBe(false);
  });

  it("accepts exactly { jobPoolUploadId: JPOOL_<32 upper hex>, poolRoleId } and nothing else", () => {
    expect(parseJobScope({ jobPoolUploadId: ID, poolRoleId: "role_a" })).toEqual({ jobPoolUploadId: ID, poolRoleId: "role_a" });
    for (const value of [
      null, undefined, "x", [], {},
      { jobPoolUploadId: ID },
      { poolRoleId: "role_a" },
      { jobPoolUploadId: ID, poolRoleId: "role_a", organizationId: "org" },
      { jobPoolUploadId: ID.toLowerCase(), poolRoleId: "role_a" },
      { jobPoolUploadId: "JPOOL_0123456789abcdef", poolRoleId: "role_a" },
      { jobPoolUploadId: ID, poolRoleId: "" },
      { jobPoolUploadId: ID, poolRoleId: " role_a" },
      { jobPoolUploadId: ID, poolRoleId: 7 },
      { jobId: "JOB_1", poolRoleId: "role_a" }
    ]) expect(parseJobScope(value)).toBeNull();
  });

  it("restores only from both exact URL parameters", () => {
    expect(jobScopeFromParams(ID, "role_a")).toEqual({ jobPoolUploadId: ID, poolRoleId: "role_a" });
    expect(jobScopeFromParams(ID, undefined)).toBeNull();
    expect(jobScopeFromParams(undefined, "role_a")).toBeNull();
    expect(jobScopeFromParams(null, null)).toBeNull();
  });

  it("compares scopes by both ids", () => {
    expect(sameJobScope({ jobPoolUploadId: ID, poolRoleId: "a" }, { jobPoolUploadId: ID, poolRoleId: "a" })).toBe(true);
    expect(sameJobScope({ jobPoolUploadId: ID, poolRoleId: "a" }, { jobPoolUploadId: ID, poolRoleId: "b" })).toBe(false);
    expect(sameJobScope(null, null)).toBe(false);
  });

  it("is VALID only for a role of the ACTIVE, MAPPED upload it names, with the role's title, organization and pool", () => {
    expect(validateJobScope({ jobPoolUploadId: ID, poolRoleId: "ROLE_A" }, upload())).toEqual({
      state: "VALID", scope: { jobPoolUploadId: ID, poolRoleId: "ROLE_A" }, roleTitle: "Platform Engineer", organizationId: "ORG_1", organizationName: "Acme", poolName: view.poolName
    });
  });

  it.each([
    ["ROLE_NOT_IN_POOL", { jobPoolUploadId: ID, poolRoleId: "ROLE_X" }, upload()],
    ["POOL_NOT_ACTIVE", { jobPoolUploadId: ID, poolRoleId: "ROLE_A" }, upload({ poolStatus: "ARCHIVED" })],
    ["POOL_NOT_ACTIVE", { jobPoolUploadId: ID, poolRoleId: "ROLE_A" }, upload({ poolStatus: "DRAFT" })],
    ["NOT_MAPPED", { jobPoolUploadId: ID, poolRoleId: "ROLE_A" }, upload({ canonicalMapping: undefined as never })],
    ["UPLOAD_NOT_FOUND", { jobPoolUploadId: "JPOOL_D39ADA99F34A60B982ADE5F929276294", poolRoleId: "ROLE_A" }, upload()]
  ])("is INVALID (%s) otherwise", (reason, scope, body) => {
    expect(validateJobScope(scope, body)).toEqual({ state: "INVALID", scope, reason });
  });
});
