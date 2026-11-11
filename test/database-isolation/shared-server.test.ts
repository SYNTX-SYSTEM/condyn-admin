import { describe, expect, it } from "vitest";
import { assertDisposableServer, SHARED_SERVER_WITNESS_NAMES } from "../../lib/database-isolation/verification";
import { classifyTestDatabaseUrl, SHARED_PROTECTED_DATABASE_NAMES, MAINTENANCE_DATABASE_NAMES } from "../../lib/database-isolation/policy";

/**
 * BOUNDARY B-ENTRY, SERVER LIMB (§91 A-G410, from PINK §32).
 *
 * The URL guards check the host and never the port, so the shared server and a disposable server on one
 * machine were indistinguishable to them. These tests fix that in writing: the SAME URL, differing only
 * in its port, is accepted by the URL policy either way — and the server limb is what tells them apart.
 */
const onDisposable = "postgresql://runner:pw@127.0.0.1:5433/postgres";
const onShared = "postgresql://runner:pw@127.0.0.1:5432/postgres";

describe("B-ENTRY server limb · the URL policy cannot tell two servers on one host apart", () => {
  it("REPRODUCES THE GAP: the disposable-database URL is accepted identically on either port", () => {
    const disposable = (port: string) => `postgresql://runner:pw@127.0.0.1:${port}/condyn_test_0123456789abcdef`;
    for (const port of ["5432", "5433", "6000"]) {
      const verdict = classifyTestDatabaseUrl(disposable(port));
      expect(verdict.ok, `port ${port}`).toBe(true);
    }
    // and the port is no longer carried in the verdict at all, because nothing ever checked it
    const verdict = classifyTestDatabaseUrl(disposable("5432"));
    expect(verdict.ok && "port" in verdict, "a value carried in a verdict and never checked is deleted, not guarded").toBe(false);
  });

  it("the witness set names only databases that do NOT exist on every server", () => {
    expect(SHARED_SERVER_WITNESS_NAMES.length).toBeGreaterThan(0);
    for (const name of SHARED_SERVER_WITNESS_NAMES) {
      expect(SHARED_PROTECTED_DATABASE_NAMES as readonly string[]).toContain(name);
      expect(MAINTENANCE_DATABASE_NAMES as readonly string[]).not.toContain(name);
    }
    // postgres/template0/template1 witness nothing: they are present on every server
    for (const name of MAINTENANCE_DATABASE_NAMES) expect(SHARED_SERVER_WITNESS_NAMES).not.toContain(name);
  });

  it("REFUSES a server that holds a protected shared database, whatever port it answers on", async () => {
    const sharedServer = async () => ["postgres", "template0", "template1", ...SHARED_SERVER_WITNESS_NAMES];
    await expect(assertDisposableServer(onShared, sharedServer)).rejects.toThrow(/ERR_TEST_DATABASE_ISOLATION_SHARED_SERVER/);
    // the port is irrelevant to the refusal — the SERVER is what is identified
    await expect(assertDisposableServer(onDisposable, sharedServer)).rejects.toThrow(/ERR_TEST_DATABASE_ISOLATION_SHARED_SERVER/);
  });

  it("ACCEPTS a server that holds only maintenance databases and disposable ones", async () => {
    const disposableServer = async () => ["postgres", "template0", "template1", "condyn_test_0123456789abcdef"];
    await expect(assertDisposableServer(onDisposable, disposableServer)).resolves.toMatchObject({ databaseCount: 4 });
    await expect(assertDisposableServer(onShared, disposableServer)).resolves.toMatchObject({ databaseCount: 4 });
  });

  /**
   * §93 LIMB 2, from PINK §33: the witness set derives to a SINGLE member, `condyn`, so limb 1
   * identifies the shared server by the presence of THIS PROJECT'S payload and sees nothing else. A
   * production server hosting other applications passes limb 1. This limb refuses it.
   */
  it("REFUSES a server holding a FOREIGN payload — a production server with other applications", async () => {
    const otherApps = async () => ["postgres", "template0", "template1", "billing", "analytics_prod"];
    await expect(assertDisposableServer(onDisposable, otherApps)).rejects.toThrow(/ERR_TEST_DATABASE_ISOLATION_FOREIGN_PAYLOAD/);
    await expect(assertDisposableServer(onDisposable, otherApps)).rejects.toThrow(/billing/);
  });

  it("the WITNESS limb fires before the foreign-payload limb, so the sharper reason is the one reported", async () => {
    const sharedWithApps = async () => ["postgres", ...SHARED_SERVER_WITNESS_NAMES, "billing"];
    await expect(assertDisposableServer(onShared, sharedWithApps)).rejects.toThrow(/SHARED_SERVER/);
  });

  /**
   * *** THE RESIDUAL LIMIT, ASSERTED RATHER THAN ONLY DOCUMENTED, because a limit that is written in a
   * comment is not a limit anyone has measured (A-G415). A pristine production server — one not yet
   * bootstrapped — holds no witness and no foreign payload, so it PASSES. This test exists to make that
   * reach explicit and to fail loudly if someone later believes the check is stronger than it is. ***
   */
  it("STATES ITS OWN LIMIT: a pristine server passes both limbs, because a witness reaches only as far as it reaches", async () => {
    const pristine = async () => ["postgres", "template0", "template1"];
    await expect(assertDisposableServer(onShared, pristine)).resolves.toMatchObject({ databaseCount: 3 });
    expect(SHARED_SERVER_WITNESS_NAMES.length, "if this ever exceeds 1 the limit above has narrowed and this test should be revisited").toBe(1);
  });

  it("refuses a VACUOUS pass: a server reporting no databases at all is impossible, not clean", async () => {
    await expect(assertDisposableServer(onDisposable, async () => [])).rejects.toThrow(/SERVER_UNREADABLE/);
  });

  it("names the database it found, so a refusal says which server it refused", async () => {
    const probe = async () => ["postgres", ...SHARED_SERVER_WITNESS_NAMES];
    await expect(assertDisposableServer(onShared, probe)).rejects.toThrow(new RegExp(SHARED_SERVER_WITNESS_NAMES[0]));
  });

  it("probes the MAINTENANCE url, never the basis url's own database", async () => {
    const seen: string[] = [];
    await assertDisposableServer("postgresql://runner:pw@127.0.0.1:5433/condyn_test_0123456789abcdef", async url => { seen.push(url); return ["postgres"]; });
    expect(seen).toHaveLength(1);
    expect(new URL(seen[0]).pathname).toBe("/postgres");
  });
});
