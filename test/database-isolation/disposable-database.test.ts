import postgres from "postgres";
import { describe, expect, it } from "vitest";
import { maintenanceUrlFor, requireTestDatabaseUrl } from "../../lib/database-isolation/policy";
import {
  createDisposableTestDatabase,
  disposableTestDatabaseUrl,
  dropDisposableTestDatabase,
  newDisposableTestDatabaseName,
  verifyDisposableTestDatabase
} from "../../lib/database-isolation/verification";

const basis = requireTestDatabaseUrl();

describe("disposable test databases (positive identification before setup and cleanup)", () => {
  it("the run database itself is positively identified by name and marker", async () => {
    const verified = await verifyDisposableTestDatabase(basis);
    expect(verified.databaseName).toMatch(/^condyn_test_[0-9a-f]{16}$/);
  });

  it("creates, verifies and drops one marked database, and refuses a second drop", async () => {
    const created = await createDisposableTestDatabase(basis);
    expect((await verifyDisposableTestDatabase(created.url)).databaseName).toBe(created.databaseName);
    expect(await dropDisposableTestDatabase(created.url)).toEqual({ droppedDatabaseName: created.databaseName });
    await expect(verifyDisposableTestDatabase(created.url)).rejects.toThrow(/does not exist/);
    await expect(dropDisposableTestDatabase(created.url)).rejects.toThrow();
  });

  it("refuses to verify or drop a pattern-valid database that carries no marker", async () => {
    const name = newDisposableTestDatabaseName();
    const admin = postgres(maintenanceUrlFor(basis), { max: 1, onnotice: () => undefined });
    try {
      await admin.unsafe(`CREATE DATABASE "${name}"`);
      const url = disposableTestDatabaseUrl(basis, name);
      await expect(verifyDisposableTestDatabase(url)).rejects.toThrow("ERR_TEST_DATABASE_ISOLATION_NOT_MARKED");
      await expect(dropDisposableTestDatabase(url)).rejects.toThrow("ERR_TEST_DATABASE_ISOLATION_NOT_MARKED");
      expect(await admin`SELECT 1 FROM pg_database WHERE datname = ${name}`).toHaveLength(1);
      // This test created the unmarked database itself; it is removed by its exact generated name.
      await admin.unsafe(`DROP DATABASE "${name}"`);
    } finally {
      await admin.end({ timeout: 5 });
    }
  });

  it("refuses protected and non-disposable targets by policy before any connection is attempted", async () => {
    // Port 1 is closed: a connection attempt would surface ECONNREFUSED instead of the policy code.
    for (const [url, expected] of [
      ["postgresql://postgres:postgres@127.0.0.1:1/condyn", "ERR_TEST_DATABASE_ISOLATION_PROTECTED"],
      ["postgresql://postgres:postgres@127.0.0.1:1/postgres", "ERR_TEST_DATABASE_ISOLATION_PROTECTED"],
      ["postgresql://postgres:postgres@127.0.0.1:1/condyn_dll_0123456789abcdef", "ERR_TEST_DATABASE_ISOLATION_NOT_DISPOSABLE"],
      ["postgresql://postgres:postgres@127.0.0.1:1", "ERR_TEST_DATABASE_ISOLATION_AMBIGUOUS"],
    ] as const) {
      await expect(verifyDisposableTestDatabase(url)).rejects.toThrow(expected);
      await expect(dropDisposableTestDatabase(url)).rejects.toThrow(expected);
    }
    await expect(verifyDisposableTestDatabase(undefined)).rejects.toThrow("ERR_TEST_DATABASE_ISOLATION_MISSING");
  });
});
