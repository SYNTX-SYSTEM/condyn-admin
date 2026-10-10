import { describe, expect, it } from "vitest";
import {
  classifyTestDatabaseUrl,
  maintenanceUrlFor,
  resolveApplicationDatabaseUrl,
  UNCONFIGURED_DATABASE_URL
} from "../../lib/database-isolation/policy";

const ok = "postgresql://postgres:postgres@localhost:5432/condyn_test_0123456789abcdef";
const code = (raw: string | undefined, allowed?: string) => {
  const verdict = classifyTestDatabaseUrl(raw, allowed);
  return verdict.ok ? "OK" : verdict.code;
};

describe("database isolation policy (pure, no connection)", () => {
  it("accepts only an explicit loopback URL naming one disposable condyn_test_<16 hex> database", () => {
    expect(code(ok)).toBe("OK");
    expect(code(ok.replace("localhost", "127.0.0.1"))).toBe("OK");
    expect(code(ok.replace("postgresql:", "postgres:"))).toBe("OK");
  });

  it.each([
    [undefined, "MISSING"],
    ["", "MISSING"],
    ["   ", "MISSING"],
    [` ${ok}`, "AMBIGUOUS"],
    ["not a url", "MALFORMED"],
    ["mysql://postgres:postgres@localhost:3306/condyn_test_0123456789abcdef", "MALFORMED"],
    ["http://localhost/condyn_test_0123456789abcdef", "MALFORMED"],
    ["postgresql://postgres:postgres@localhost:5432", "AMBIGUOUS"],
    ["postgresql://postgres:postgres@localhost:5432/", "AMBIGUOUS"],
    ["postgresql:///condyn_test_0123456789abcdef", "AMBIGUOUS"],
    [`${ok}?dbname=condyn`, "AMBIGUOUS"],
    [`${ok}?options=-csearch_path%3Dpublic`, "AMBIGUOUS"],
    [`${ok}#condyn`, "AMBIGUOUS"],
    ["postgresql://postgres:postgres@localhost:5432/condyn_test_0123456789abcdef/extra", "AMBIGUOUS"],
    ["postgresql://postgres:postgres@localhost:5432/condyn%5Ftest_0123456789abcdef", "AMBIGUOUS"],
    ["postgresql://postgres:postgres@localhost:5432/condyn", "PROTECTED"],
    ["postgresql://postgres:postgres@127.0.0.1:5432/condyn", "PROTECTED"],
    ["postgresql://postgres:postgres@localhost:5432/CONDYN", "PROTECTED"],
    ["postgresql://postgres:postgres@localhost:5432/postgres", "PROTECTED"],
    ["postgresql://postgres:postgres@localhost:5432/template1", "PROTECTED"],
    ["postgresql://postgres:postgres@localhost:5432/condyn_dll_0123456789abcdef", "NOT_DISPOSABLE"],
    ["postgresql://postgres:postgres@localhost:5432/condyn_test_0123", "NOT_DISPOSABLE"],
    ["postgresql://postgres:postgres@localhost:5432/condyn_test_0123456789ABCDEF", "NOT_DISPOSABLE"],
    ["postgresql://postgres:postgres@db.example.com:5432/condyn_test_0123456789abcdef", "NON_LOCAL_HOST"],
  ])("refuses %s as %s", (raw, expected) => {
    expect(code(raw as string | undefined)).toBe(expected);
  });

  it("admits a non-loopback host only when it is explicitly allowlisted", () => {
    const remote = "postgresql://postgres:postgres@db.test.internal:5432/condyn_test_0123456789abcdef";
    expect(code(remote, "")).toBe("NON_LOCAL_HOST");
    expect(code(remote, "db.test.internal")).toBe("OK");
    expect(code("postgresql://postgres:postgres@db.test.internal:5432/condyn", "db.test.internal")).toBe("PROTECTED");
  });

  it("never lets the application client fall back to a real database", () => {
    expect(resolveApplicationDatabaseUrl(undefined, false)).toBe(UNCONFIGURED_DATABASE_URL);
    expect(resolveApplicationDatabaseUrl("", false)).toBe(UNCONFIGURED_DATABASE_URL);
    expect(resolveApplicationDatabaseUrl("   ", true)).toBe(UNCONFIGURED_DATABASE_URL);
    expect(new URL(UNCONFIGURED_DATABASE_URL).hostname.endsWith(".invalid")).toBe(true);
    expect(resolveApplicationDatabaseUrl("postgresql://postgres:postgres@localhost:5432/condyn", true)).toBe(UNCONFIGURED_DATABASE_URL);
    expect(resolveApplicationDatabaseUrl("postgresql://postgres:postgres@localhost:5432/postgres", true)).toBe(UNCONFIGURED_DATABASE_URL);
    expect(resolveApplicationDatabaseUrl("postgresql://postgres:postgres@localhost:5432", true)).toBe(UNCONFIGURED_DATABASE_URL);
    expect(resolveApplicationDatabaseUrl(ok, true)).toBe(ok);
  });

  it("derives the maintenance URL without query, fragment or the target database", () => {
    expect(maintenanceUrlFor(ok)).toBe("postgresql://postgres:postgres@localhost:5432/postgres");
  });
});
