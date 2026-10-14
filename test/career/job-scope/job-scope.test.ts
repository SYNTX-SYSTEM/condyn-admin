import { describe, expect, it, vi } from "vitest";
import { createJob } from "../../../lib/career/orchestration/job";
import {
  JOB_SCOPE_REQUIRED_MESSAGE, JobScopeRequiredError, createJobScopeResolver, parseJobScopeSelection, requireValidJobScope, resolveJobScopeFromStoredPool
} from "../../../lib/career/job-scope";
import { TEST_JOB_SCOPE, TEST_JOB_SCOPE_B, TEST_STORED_POOL, resolveTestJobScope } from "../../support/job-scope";

const expectScopeError = (error: unknown, code: string) => {
  expect(error).toBeInstanceOf(JobScopeRequiredError);
  expect((error as JobScopeRequiredError).code).toBe(code);
  expect((error as Error).message).toBe(JOB_SCOPE_REQUIRED_MESSAGE);
  expect((error as Error).name).toBe("TERMINAL_ERROR");
};
const failure = async (run: () => unknown) => { try { await run(); } catch (error) { return error; } throw new Error("expected a refusal"); };

describe("JOB POOL FIRST — job selection", () => {
  it("requires exactly a JPOOL upload id and a pool role id", async () => {
    for (const value of [undefined, null, "role_kestrel_frontend_architect", [], {}, { poolRoleId: "role_x" }, { jobPoolUploadId: TEST_JOB_SCOPE.jobPoolUploadId },
      { ...TEST_JOB_SCOPE, extra: 1 }, { jobPoolUploadId: "JPOOL_lowercase", poolRoleId: "role_x" }, { jobPoolUploadId: TEST_JOB_SCOPE.jobPoolUploadId, poolRoleId: "" },
      { jobPoolUploadId: TEST_JOB_SCOPE.jobPoolUploadId, poolRoleId: 7 }]) {
      expectScopeError(await failure(() => parseJobScopeSelection(value)), "ERR_JOB_SCOPE_REQUIRED");
    }
    expect(parseJobScopeSelection({ ...TEST_JOB_SCOPE })).toEqual(TEST_JOB_SCOPE);
  });

  it("accepts every non-empty role id form the pool schema allows; existence is decided by the stored pool", async () => {
    for (const poolRoleId of ["Senior Engineer", "rolle_ä", " padded ", "a/b#c"]) {
      expect(parseJobScopeSelection({ jobPoolUploadId: TEST_JOB_SCOPE.jobPoolUploadId, poolRoleId })).toEqual({ jobPoolUploadId: TEST_JOB_SCOPE.jobPoolUploadId, poolRoleId });
      expectScopeError(await failure(() => resolveTestJobScope({ ...TEST_JOB_SCOPE, poolRoleId })), "ERR_JOB_SCOPE_INVALID");
    }
  });

  it("accepts a role of a stored, ACTIVE, mapped pool and resolves its requirements and mapping", () => {
    const a = resolveTestJobScope(TEST_JOB_SCOPE);
    const b = resolveTestJobScope(TEST_JOB_SCOPE_B);
    expect([a.role.id, a.organization.id, a.requirements.length]).toEqual(["role_kestrel_frontend_architect", "org_kestrel", 10]);
    expect([b.role.id, b.organization.id, b.requirements.length]).toEqual(["role_aurelion_principal_architect", "org_aurelion", 10]);
    expect(a.requirements.every(item => item.mapping.poolRequirementId === item.poolRequirement.id)).toBe(true);
    expect(a.scopeSha256).not.toBe(b.scopeSha256);
  });

  it("refuses a role outside the pool, an inactive pool, an unmapped role or requirement, and a pool mismatch", async () => {
    expectScopeError(await failure(() => resolveTestJobScope({ ...TEST_JOB_SCOPE, poolRoleId: "role_not_in_pool" })), "ERR_JOB_SCOPE_INVALID");
    for (const status of ["DRAFT", "ARCHIVED"]) expectScopeError(await failure(() => resolveJobScopeFromStoredPool({ ...TEST_STORED_POOL, poolStatus: status }, TEST_JOB_SCOPE)), "ERR_JOB_SCOPE_INVALID");
    const withoutRole = { ...TEST_STORED_POOL, mapping: { ...TEST_STORED_POOL.mapping, roles: TEST_STORED_POOL.mapping.roles.filter(role => role.poolRoleId !== TEST_JOB_SCOPE.poolRoleId) } };
    expectScopeError(await failure(() => resolveJobScopeFromStoredPool(withoutRole, TEST_JOB_SCOPE)), "ERR_JOB_SCOPE_INVALID");
    const withoutRequirement = { ...TEST_STORED_POOL, mapping: { ...TEST_STORED_POOL.mapping, roles: TEST_STORED_POOL.mapping.roles.map(role => role.poolRoleId === TEST_JOB_SCOPE.poolRoleId ? { ...role, requirements: role.requirements.slice(1) } : role) } };
    expectScopeError(await failure(() => resolveJobScopeFromStoredPool(withoutRequirement, TEST_JOB_SCOPE)), "ERR_JOB_SCOPE_INVALID");
    expectScopeError(await failure(() => resolveJobScopeFromStoredPool(TEST_STORED_POOL, { ...TEST_JOB_SCOPE, jobPoolUploadId: `JPOOL_${"A".repeat(32)}` })), "ERR_JOB_SCOPE_INVALID");
  });

  it("refuses an unknown upload and an upload without canonical mapping through the stored-pool reader", async () => {
    const stored = { jobPoolUploadId: TEST_JOB_SCOPE.jobPoolUploadId, poolStatus: "ACTIVE", canonicalSha256: TEST_STORED_POOL.canonicalSha256, canonicalJson: JSON.stringify(TEST_STORED_POOL.pool) };
    expectScopeError(await failure(() => createJobScopeResolver({ getUpload: async () => null, getMapping: async () => TEST_STORED_POOL.mapping }).resolve(TEST_JOB_SCOPE)), "ERR_JOB_SCOPE_INVALID");
    expectScopeError(await failure(() => createJobScopeResolver({ getUpload: async () => stored, getMapping: async () => null }).resolve(TEST_JOB_SCOPE)), "ERR_JOB_SCOPE_INVALID");
    await expect(createJobScopeResolver({ getUpload: async () => stored, getMapping: async () => TEST_STORED_POOL.mapping }).resolve(TEST_JOB_SCOPE)).resolves.toMatchObject({ selection: TEST_JOB_SCOPE });
  });
});

describe("JOB POOL FIRST — worker boundary", () => {
  const resolver = { resolve: async (selection: typeof TEST_JOB_SCOPE) => resolveJobScopeFromStoredPool(TEST_STORED_POOL, selection) };
  const job = (sourceData: unknown) => createJob("CAREER_ANALYSIS", { sourceType: "BATCH", sourceData });

  it("never runs the processor (no source preparation, no sweep, no Gemini) for a job without a valid selection", async () => {
    const processJob = vi.fn(async () => ({ resultAnalysisId: "ANL_NEVER" }));
    const report = vi.fn(async () => undefined);
    const guarded = requireValidJobScope(resolver, processJob);
    for (const [sourceData, code] of [
      [{ documents: [{ type: "text", content: "x" }] }, "ERR_JOB_SCOPE_REQUIRED"],
      ["opaque", "ERR_JOB_SCOPE_REQUIRED"],
      [null, "ERR_JOB_SCOPE_REQUIRED"],
      [{ documents: [], jobScope: { poolRoleId: "role_kestrel_frontend_architect" } }, "ERR_JOB_SCOPE_REQUIRED"],
      [{ documents: [], jobScope: { ...TEST_JOB_SCOPE, poolRoleId: "role_not_in_pool" } }, "ERR_JOB_SCOPE_INVALID"]
    ] as const) {
      expectScopeError(await failure(() => guarded(job(sourceData), report)), code);
    }
    expect(processJob).not.toHaveBeenCalled();
    expect(report).not.toHaveBeenCalled();
  });

  it("hands a job with a valid selection to the unchanged processor", async () => {
    const processJob = vi.fn(async () => ({ resultAnalysisId: "ANL_OK" }));
    const report = vi.fn(async () => undefined);
    const claimed = job({ documents: [{ type: "text", content: "x" }], jobScope: TEST_JOB_SCOPE_B });
    await expect(requireValidJobScope(resolver, processJob)(claimed, report)).resolves.toEqual({ resultAnalysisId: "ANL_OK" });
    expect(processJob).toHaveBeenCalledWith(claimed, report);
  });
});
