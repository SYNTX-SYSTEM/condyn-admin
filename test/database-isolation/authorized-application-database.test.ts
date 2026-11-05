import { describe, expect, it } from "vitest";
import {
  classifyAuthorizedApplicationDatabaseUrl,
  resolveApplicationDatabaseUrl,
  UNCONFIGURED_DATABASE_URL
} from "../../lib/database-isolation/policy";

const CONDYN = "postgresql://postgres:pw@localhost:5432/condyn";
const accept = (url: string | undefined) => classifyAuthorizedApplicationDatabaseUrl(url, false, "1");

/**
 * Boundary B-ENTRY, second basis (owner authorisation of 2026-11-05). The application database of a
 * real server or worker process is provisionable; a test run or an agent operation can never reach
 * this verdict. These tests are the proof of the second half of that sentence.
 */
describe("authorised application database", () => {
  it("accepts the declared application database of an opted-in, non-test process", () => {
    const verdict = accept(CONDYN);
    expect(verdict).toMatchObject({ ok: true, databaseName: "condyn", url: CONDYN });
  });

  it("is UNREACHABLE from a test runner, even with the opt-in and a valid URL", () => {
    expect(classifyAuthorizedApplicationDatabaseUrl(CONDYN, true, "1")).toMatchObject({ ok: false, code: "UNDER_TEST_RUNNER" });
  });

  it("is unreachable without the explicit opt-in", () => {
    for (const optIn of [undefined, "", "0", "true", "yes", "1 ", " 1"]) {
      expect(classifyAuthorizedApplicationDatabaseUrl(CONDYN, false, optIn)).toMatchObject({ ok: false, code: "NOT_AUTHORIZED" });
    }
  });

  it("refuses maintenance and template databases even with the opt-in", () => {
    for (const name of ["postgres", "POSTGRES", "template0", "template1"]) {
      expect(accept(`postgresql://u:p@localhost:5432/${name}`)).toMatchObject({ ok: false, code: "MAINTENANCE_DATABASE" });
    }
  });

  it("refuses a disposable test database here: that basis belongs to the test path alone", () => {
    expect(accept("postgresql://u:p@localhost:5432/condyn_test_0123456789abcdef")).toMatchObject({ ok: false, code: "DISPOSABLE_DATABASE" });
  });

  it("refuses a missing, blank or malformed URL before any connection", () => {
    expect(accept(undefined)).toMatchObject({ ok: false, code: "MISSING" });
    expect(accept("")).toMatchObject({ ok: false, code: "MISSING" });
    expect(accept("   ")).toMatchObject({ ok: false, code: "MISSING" });
    expect(accept("not-a-url")).toMatchObject({ ok: false, code: "MALFORMED" });
    expect(accept("mysql://u:p@localhost:3306/condyn")).toMatchObject({ ok: false, code: "MALFORMED" });
    expect(accept(` ${CONDYN}`)).toMatchObject({ ok: false, code: "AMBIGUOUS" });
  });

  it("refuses anything that could redirect which database is reached", () => {
    expect(accept("postgresql://localhost:5432/condyn?options=-c%20search_path%3Dx")).toMatchObject({ ok: false, code: "AMBIGUOUS" });
    expect(accept("postgresql://localhost:5432/condyn#f")).toMatchObject({ ok: false, code: "AMBIGUOUS" });
    expect(accept("postgresql://a,b:5432/condyn")).toMatchObject({ ok: false, code: "AMBIGUOUS" });
    expect(accept("postgresql://localhost:5432/")).toMatchObject({ ok: false, code: "AMBIGUOUS" });
    expect(accept("postgresql://localhost:5432/a/b")).toMatchObject({ ok: false, code: "AMBIGUOUS" });
    expect(accept("postgresql://localhost:5432/cond%79n")).toMatchObject({ ok: false, code: "AMBIGUOUS" });
  });

  /** PINK P-1: an empty database name let postgres-js fall back to PGDATABASE or the user name. */
  it("resolveApplicationDatabaseUrl refuses an empty database name in EVERY process, not only under a test runner", () => {
    for (const underTestRunner of [true, false]) {
      expect(resolveApplicationDatabaseUrl("postgresql://postgres:pw@localhost:5432/", underTestRunner, "1")).toBe(UNCONFIGURED_DATABASE_URL);
      expect(resolveApplicationDatabaseUrl("postgresql://postgres:pw@localhost:5432", underTestRunner, "1")).toBe(UNCONFIGURED_DATABASE_URL);
    }
  });

  it("resolveApplicationDatabaseUrl still refuses the shared database without the opt-in and under a test runner", () => {
    expect(resolveApplicationDatabaseUrl(CONDYN, false, undefined)).toBe(UNCONFIGURED_DATABASE_URL);
    expect(resolveApplicationDatabaseUrl(CONDYN, true, "1")).toBe(UNCONFIGURED_DATABASE_URL);
    expect(resolveApplicationDatabaseUrl(CONDYN, false, "1")).toBe(CONDYN);
  });
});
