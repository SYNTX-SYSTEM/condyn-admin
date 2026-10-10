import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ verify: vi.fn(), unified: vi.fn(), jobPool: vi.fn(), createClient: vi.fn(), end: vi.fn() }));
vi.mock("../../../lib/database-isolation/verification", () => ({ verifyDisposableTestDatabase: mocks.verify }));
vi.mock("../../../lib/persistence/unified-schema-registration", () => ({ registerUnifiedPersistenceSchema: mocks.unified }));
vi.mock("../../../lib/career/job-pool/persistence-schema", () => ({ registerJobPoolPersistenceSchema: mocks.jobPool }));
vi.mock("../../../lib/career/hr-decision-loop/registration-client", () => ({ createRegistrationClient: mocks.createClient }));

/** JP-H: the job pool routes issue DDL only after positive disposable identity, on a dedicated client. */
describe("Job Pool persistence registration gate", () => {
  it("registers unified and job pool schemas once, on the verified URL's dedicated client, and ends it", async () => {
    const client = { end: mocks.end };
    mocks.verify.mockResolvedValue({ url: "postgresql://x/condyn_test_0123456789abcdef", databaseName: "condyn_test_0123456789abcdef" });
    mocks.createClient.mockReturnValue(client);
    mocks.end.mockResolvedValue(undefined);
    const { ensureJobPoolPersistenceRegistration } = await import("../../../lib/career/job-pool/local-composition");
    await expect(ensureJobPoolPersistenceRegistration()).resolves.toBe("REGISTERED");
    await expect(ensureJobPoolPersistenceRegistration()).resolves.toBe("REGISTERED");
    expect(mocks.createClient).toHaveBeenCalledTimes(1);
    expect(mocks.createClient).toHaveBeenCalledWith("postgresql://x/condyn_test_0123456789abcdef");
    expect(mocks.unified).toHaveBeenCalledWith(client);
    expect(mocks.jobPool).toHaveBeenCalledWith(client);
    expect(mocks.unified.mock.invocationCallOrder[0]).toBeLessThan(mocks.jobPool.mock.invocationCallOrder[0]);
    expect(mocks.end).toHaveBeenCalledTimes(1);
  });

  it("performs no DDL and answers 503 when the bound database is not positively disposable", async () => {
    vi.resetModules();
    for (const mock of Object.values(mocks)) mock.mockReset();
    mocks.verify.mockRejectedValue(new Error("ERR_TEST_DATABASE_ISOLATION_PROTECTED"));
    const { ensureJobPoolPersistenceRegistration, createLocalJobPoolApplication } = await import("../../../lib/career/job-pool/local-composition");
    await expect(ensureJobPoolPersistenceRegistration()).resolves.toBe("NO_DDL_ON_NON_DISPOSABLE_DATABASE");
    await expect(createLocalJobPoolApplication()).rejects.toMatchObject({ code: "ERR_JOB_POOL_PERSISTENCE_NOT_PROVISIONED", status: 503 });
    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(mocks.unified).not.toHaveBeenCalled();
    expect(mocks.jobPool).not.toHaveBeenCalled();
  });
});
