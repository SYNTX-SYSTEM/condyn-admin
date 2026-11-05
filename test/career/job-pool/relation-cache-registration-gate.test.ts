import { describe, expect, it, vi } from "vitest";

/** The relation cache has its own guarded registration (availability boundary): disposable only, lazy, retried after a failure. */
const mocks = vi.hoisted(() => ({ verify: vi.fn(), register: vi.fn(), createClient: vi.fn(), end: vi.fn() }));
vi.mock("../../../lib/database-isolation/verification", () => ({ verifyProvisionableDatabase: mocks.verify }));
vi.mock("../../../lib/career/job-pool/relation-cache-repository", () => ({ registerRelationCacheSchema: mocks.register, PostgresRelationCacheRepository: class { constructor(readonly sql: unknown) {} } }));
vi.mock("../../../lib/persistence/registration-client", () => ({ createRegistrationClient: mocks.createClient }));
vi.mock("../../../lib/career/db/client", () => ({ db: { $client: {} } }));

describe("relation cache registration gate", () => {
  it("no DDL and NOT_PROVISIONED when the bound database is not positively disposable", async () => {
    vi.resetModules(); for (const m of Object.values(mocks)) m.mockReset();
    mocks.verify.mockResolvedValue(null);
    const { openRelationCache } = await import("../../../lib/career/job-pool/relation-cache-registration");
    expect(await openRelationCache()).toEqual({ state: "NOT_PROVISIONED" });
    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(mocks.register).not.toHaveBeenCalled();
  });

  it("a failing registration is UNAVAILABLE with its code, ends its client, and is retried on the next use (recovery without restart)", async () => {
    vi.resetModules(); for (const m of Object.values(mocks)) m.mockReset();
    mocks.verify.mockResolvedValue({ url: "postgresql://x/condyn_test_0123456789abcdef", databaseName: "condyn_test_0123456789abcdef", basis: "DISPOSABLE_TEST_DATABASE" });
    mocks.createClient.mockReturnValue({ end: mocks.end }); mocks.end.mockResolvedValue(undefined);
    mocks.register.mockRejectedValueOnce(new Error("ERR_RELATION_CACHE_GUARANTEES_MISSING:prr_record_binds_columns")).mockResolvedValueOnce(["career_proposal_requirement_relations"]);
    const { openRelationCache } = await import("../../../lib/career/job-pool/relation-cache-registration");
    expect(await openRelationCache()).toEqual({ state: "UNAVAILABLE", code: "ERR_RELATION_CACHE_GUARANTEES_MISSING" });
    expect(mocks.end).toHaveBeenCalledTimes(1);
    expect((await openRelationCache()).state).toBe("AVAILABLE");
    expect(await openRelationCache()).toMatchObject({ state: "AVAILABLE" });
    expect(mocks.register).toHaveBeenCalledTimes(2);
  });
});
