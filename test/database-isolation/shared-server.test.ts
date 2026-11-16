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

  /**
   * ── F-A2, PINK-STRUCT's finding, REPAIRED HERE (GELB, 2026-11-16) ──────────────────────────────
   *
   * THE DEFECT, and its measured cost rather than its hypothetical one. `test/decision-runtime/e2e/
   * local-decision-context-http.e2e.test.ts:21` provisions `condyn_r5_<20 hex>` on the same disposable
   * server. That name matched no pattern the foreign-payload limb knew, so ANOTHER RUN'S B-ENTRY
   * verification classified it as a production payload and refused. *** TWO CONCURRENT RUNS THEREFORE
   * DESTROYED EACH OTHER, AND FOUR TESTS BECAME "SKIPPED" SILENTLY. A SOLO RUN CANNOT FIND THIS — which
   * is why it survived four phases: these lanes had always measured alone. ***
   *
   * WHY THE TWO REPAIRS ON RECORD WERE BOTH REFUSED, and why this third one is neither of them. The
   * record named only (1) route the r5 database through the sanctioned create/drop — which edits a file
   * under `test/decision-runtime`, tripping P8's frozen set — and (2) exempt `condyn_r5_` inside the
   * foreign-payload limb, which is a gate bypass. Both breach a boundary, so it was booked as an owner
   * decision.
   *
   * *** THE THIRD READING IS THAT THE POLICY'S ENUMERATION WAS SIMPLY INCOMPLETE. *** The limb asks
   * whether the server "holds nothing else". A `condyn_r5_` database is not something ELSE: this
   * repository's own suite created it, randomly named, and drops it. The limb was not too weak — it was
   * mis-classifying this suite's own payload as a stranger's.
   *
   * SO THE FIX IS A SEPARATE, NARROWER CONCEPT, AND THE SEPARATION IS THE WHOLE POINT.
   * `DISPOSABLE_TEST_DATABASE_PATTERN` also decides which URL may be ACCEPTED AS A BASIS for a run.
   * Widening THAT would let someone point the suite at an r5 database — a real bypass. So
   * `isSuiteOwnedDatabase` is used by the foreign-payload limb ONLY, and the test below pins that the
   * basis check is unchanged. A classification repair that also widened the basis would be the bypass
   * wearing the repair's clothes.
   */
  it("F-A2: a concurrent run's condyn_r5_ database is NOT foreign payload — this suite created it", async () => {
    const withR5 = async () => ["postgres", "template0", "template1", "condyn_test_0123456789abcdef", "condyn_r5_0123456789abcdef0123"];
    await expect(assertDisposableServer(onDisposable, withR5)).resolves.toMatchObject({ databaseCount: 5 });
  });

  it("F-A2: and the GATE IS NOT BYPASSED — an r5 database is still refused as a BASIS for a run", () => {
    const verdict = classifyTestDatabaseUrl("postgresql://runner:pw@127.0.0.1:5433/condyn_r5_0123456789abcdef0123");
    expect(verdict.ok, "an r5 database must never be an acceptable basis — that would be the bypass").toBe(false);
    expect(verdict.ok === false && verdict.code).toBe("NOT_DISPOSABLE");
  });

  it("F-A2: a genuine foreign payload still refuses, and is still named, even beside an r5 database", async () => {
    const r5AndStranger = async () => ["postgres", "template0", "template1", "condyn_r5_0123456789abcdef0123", "billing"];
    await expect(assertDisposableServer(onDisposable, r5AndStranger)).rejects.toThrow(/ERR_TEST_DATABASE_ISOLATION_FOREIGN_PAYLOAD/);
    await expect(assertDisposableServer(onDisposable, r5AndStranger)).rejects.toThrow(/billing/);
  });

  it("F-A2: the r5 pattern is EXACT — a near miss is still a stranger", async () => {
    for (const near of ["condyn_r5_", "condyn_r5_0123456789abcdef012", "condyn_r5_0123456789abcdef01234", "condyn_r5_zzzzzzzzzzzzzzzzzzzz", "condyn_r5x0123456789abcdef0123"]) {
      const names = async () => ["postgres", "template0", "template1", near];
      await expect(assertDisposableServer(onDisposable, names), near).rejects.toThrow(/FOREIGN_PAYLOAD/);
    }
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
