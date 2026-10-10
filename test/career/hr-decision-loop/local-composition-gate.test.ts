import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ verify: vi.fn(), register: vi.fn() }));
vi.mock("../../../lib/database-isolation/verification", () => ({ verifyDisposableTestDatabase: mocks.verify }));
vi.mock("../../../lib/persistence/unified-schema-registration", () => ({ registerUnifiedPersistenceSchema: mocks.register }));

/**
 * The HR routes never issue DDL against a database that is not positively disposable
 * (owner mandate, 2026-10-10). No connection is opened by this test: both the identity
 * check and the registration are observed through doubles.
 */
describe("HR Decision Loop persistence registration gate", () => {
  it("runs the unified registration only after a positive disposable identity, once per process", async () => {
    mocks.verify.mockResolvedValue({ url: "postgresql://x/condyn_test_0123456789abcdef", databaseName: "condyn_test_0123456789abcdef" });
    mocks.register.mockResolvedValue(["CAREER_FIELD_SCHEMA"]);
    const { ensureHrDecisionLoopPersistenceRegistration } = await import("../../../lib/career/hr-decision-loop/local-composition");
    await expect(ensureHrDecisionLoopPersistenceRegistration()).resolves.toBe("REGISTERED");
    await expect(ensureHrDecisionLoopPersistenceRegistration()).resolves.toBe("REGISTERED");
    expect(mocks.verify).toHaveBeenCalledTimes(1);
    expect(mocks.register).toHaveBeenCalledTimes(1);
  });

  it("performs no DDL when the bound database is not positively disposable", async () => {
    vi.resetModules();
    mocks.verify.mockReset();
    mocks.register.mockReset();
    mocks.verify.mockRejectedValue(new Error("ERR_TEST_DATABASE_ISOLATION_PROTECTED"));
    const { ensureHrDecisionLoopPersistenceRegistration } = await import("../../../lib/career/hr-decision-loop/local-composition");
    await expect(ensureHrDecisionLoopPersistenceRegistration()).resolves.toBe("NO_DDL_ON_NON_DISPOSABLE_DATABASE");
    expect(mocks.register).not.toHaveBeenCalled();
  });
});
