import { describe, expect, it, vi } from "vitest";
import { verifyAuthorizedApplicationDatabase, verifyDisposableTestDatabase, verifyProvisionableDatabase } from "../../lib/database-isolation/verification";
import { disposableTestDatabaseMarker } from "../../lib/database-isolation/policy";

const CONDYN = "postgresql://postgres:pw@localhost:5432/condyn";
const DISPOSABLE = "postgresql://postgres:pw@localhost:5432/condyn_test_0123456789abcdef";

/**
 * PINK 1c: the nine policy cases prove the classifier, and the gate tests mock everything, so NO test
 * ever executed the connection path. The probe is a parameter now, so all of its outcomes are provable
 * without a database — including the one that matters most, a connection that reaches a DIFFERENT
 * database than the URL names.
 */
describe("application database connection path", () => {
  it("accepts only when the connection reports exactly the named database", async () => {
    const probe = vi.fn(async () => ({ name: "condyn", marker: null }));
    await expect(verifyAuthorizedApplicationDatabase(CONDYN, false, "database=condyn", probe))
      .resolves.toEqual({ url: CONDYN, databaseName: "condyn" });
    expect(probe).toHaveBeenCalledWith(CONDYN);
  });

  it("refuses when the connection reaches a DIFFERENT database than the URL names", async () => {
    const probe = vi.fn(async () => ({ name: "neighbour", marker: null }));
    await expect(verifyAuthorizedApplicationDatabase(CONDYN, false, "1", probe))
      .rejects.toThrow("ERR_APPLICATION_DATABASE_IDENTITY_MISMATCH");
  });

  it("refuses when the connection reports nothing at all", async () => {
    await expect(verifyAuthorizedApplicationDatabase(CONDYN, false, "1", async () => null))
      .rejects.toThrow("ERR_APPLICATION_DATABASE_IDENTITY_MISMATCH");
  });

  it("propagates a failing connection instead of treating it as acceptance", async () => {
    await expect(verifyAuthorizedApplicationDatabase(CONDYN, false, "1", async () => { throw new Error("ECONNREFUSED"); }))
      .rejects.toThrow("ECONNREFUSED");
  });

  it("never connects when the URL is already refused by policy", async () => {
    const probe = vi.fn(async () => ({ name: "condyn", marker: null }));
    await expect(verifyAuthorizedApplicationDatabase(CONDYN, true, "1", probe)).rejects.toThrow("UNDER_TEST_RUNNER");
    await expect(verifyAuthorizedApplicationDatabase(CONDYN, false, undefined, probe)).rejects.toThrow("NOT_AUTHORIZED");
    expect(probe).not.toHaveBeenCalled();
  });

  it("the disposable basis still requires the marker on the very database it reached", async () => {
    await expect(verifyDisposableTestDatabase(DISPOSABLE, async () => ({ name: "condyn_test_0123456789abcdef", marker: null })))
      .rejects.toThrow("ERR_TEST_DATABASE_ISOLATION_NOT_MARKED");
    await expect(verifyDisposableTestDatabase(DISPOSABLE, async () => ({ name: "condyn", marker: disposableTestDatabaseMarker("condyn_test_0123456789abcdef") })))
      .rejects.toThrow("ERR_TEST_DATABASE_ISOLATION_IDENTITY_MISMATCH");
  });

  /** PINK 1a: a refusal must state its reason, and it must not be silent. */
  it("logs the reason of a refusal, naming both bases", async () => {
    const log = vi.fn();
    await expect(verifyProvisionableDatabase("postgresql://u:p@localhost:5432/condyn", log)).resolves.toBeNull();
    expect(log).toHaveBeenCalledTimes(1);
    expect(log.mock.calls[0][0]).toContain("ERR_JOB_POOL_PERSISTENCE_NOT_PROVISIONED");
    expect(log.mock.calls[0][0]).toContain("disposable:");
    expect(log.mock.calls[0][0]).toContain("application:");
  });
});
