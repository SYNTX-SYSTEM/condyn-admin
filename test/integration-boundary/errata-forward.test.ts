import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * THE FORWARD POINTERS TO PINK'S ERRATA · the owner's second released decision, guarded where runs happen.
 *
 * THE PROBLEM THE OWNER RESOLVED. Three claims in PINK's sealed register lapsed: W-1 (*"119 commits,
 * UNPUSHED"*), W-2 (*PHASE_G exists in none of the four worktrees this lane can read*) and W-3 (*"197 tests,
 * 197 passed"*, where the artefact says 198). PINK withdrew all three. But `PINK-SYSTEM-VALIDATION.md` is
 * *** ENTRY 47 OF A MANIFEST THE OWNER FROZE ***, so the corrections could not be written where the claims
 * stand. The owner's instruction: connect them by **traceable forward pointers**, and **do not rewrite
 * historical evidence**.
 *
 * WHY THAT IS POSSIBLE AT ALL, measured before anything was prescribed (A-G496 — PINK caught me ordering a
 * repair whose cost I had never paid): `sha256sum -c` verifies the lines its manifest LISTS and is silent
 * about anything else in the directory. On a throwaway copy of `mapping-phase-e-contract`, adding an
 * unlisted file left **33 OK, exit 0**; appending one byte to a LISTED file gave **1 FAILED, exit 1**. PINK
 * re-proved it in place: **91 OK, exit 0** with both pointer files present.
 *
 * WHY THIS FILE DOES NOT REIMPLEMENT THE CHECK. PINK owns the schema and wrote `pink-errata-forward.mjs
 * --check`, which holds the quote-at-line logic, and PINK asked that this guard SHELL OUT to it rather than
 * duplicate it — two implementations of the same rule drift, and the one nobody runs is the one that is
 * wrong. What this file adds is the two directions PINK's checker cannot cover from inside: the **167
 * sealed entries**, measured here, and the **errata direction** read from the errata's own prose rather
 * than from PINK's derived JSON. The division is deliberate: PINK's checker proves the pointers still hit
 * their lines; this guard proves the seal is intact and that no withdrawal exists without a pointer.
 *
 * It runs in the INTEGRATED state, which is the point. PINK's own suites are not run here, and a pointer
 * that only fails on the lane that wrote it is a pointer nobody checks (A-G502's weaker true form, which
 * PINK corrected me on: these are evidence artefacts, not code the integration executes, so the gap the
 * merge closed is *readability and guard coverage*, not "a repair that was never applied").
 */

const ROOT = join(__dirname, "../..");
const CONTRACT = "docs/architecture/decision-fields/evidence/mapping-phase-g-contract";
const POINTER = `${CONTRACT}/ERRATA-FORWARD.json`;
const CHECKER = "docs/architecture/decision-fields/evidence/mapping-phase-pink-tools/pink-errata-forward.mjs";
const SEALED_DIRS = ["mapping-phase-e-contract", "mapping-phase-f-contract", "mapping-phase-g-contract"]
  .map(name => `docs/architecture/decision-fields/evidence/${name}`);

type Pointer = { id: string; verdict: string; date: string; occurrences: { line: number; quote: string }[];
                 dependentPassages?: unknown[]; errataAnchor: string };
type PointerFile = { schema: string; errata: { path: string; declaredWithdrawals: { id: string; line: number }[] };
                     sealedRegister: { path: string; manifest: string }; thisFile: { listedInSealedManifest: boolean };
                     pointers: Pointer[] };

const read = (p: string) => readFileSync(join(ROOT, p), "utf8");

describe("forward pointers · the sealed register's three lapsed claims are traceably connected", () => {
  it("the pointer file exists and declares the schema this guard parses", () => {
    expect(existsSync(join(ROOT, POINTER)), `${POINTER} is absent — the owner's second decision is undone`).toBe(true);
    expect((JSON.parse(read(POINTER)) as PointerFile).schema).toBe("pink.errata-forward/1");
  });

  const pointerFile = JSON.parse(read(POINTER)) as PointerFile;

  it("PINK's own checker passes — the quotes are still at their cited lines in the sealed register", () => {
    const out = execFileSync(process.execPath, [join(ROOT, CHECKER), "--check"],
      { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    expect(out, "the checker must report what it verified, not merely exit 0").toMatch(/CHECK OK/);
  });

  /**
   * THE 167, MEASURED HERE RATHER THAN TAKEN FROM PINK'S REPORT. The owner's first condition was that all
   * 167 historical entries stay unchanged, and this is the limb that would notice if they did not —
   * including the case the F-R10 incident proved is the dangerous one: a REGENERATED manifest verifies
   * perfectly against its own new content (A-G499, PINK's finding against my main instrument). So the
   * ENTRY COUNT is pinned as well as the verification, because a rewritten manifest can be internally
   * consistent and still be the wrong manifest.
   */
  it("all 167 historical seal entries still verify, and the count itself has not moved", () => {
    const expected: Record<string, number> = {
      "mapping-phase-e-contract": 33, "mapping-phase-f-contract": 43, "mapping-phase-g-contract": 91 };
    let total = 0;
    for (const dir of SEALED_DIRS) {
      const name = dir.slice(dir.lastIndexOf("/") + 1);
      const lines = read(`${dir}/manifest.sha256`).split("\n").filter(l => /^[0-9a-f]{64}\s/.test(l));
      expect(lines.length, `${name}'s entry count moved — a regenerated manifest verifies against its own ` +
        `new content, so the count is pinned too (A-G499)`).toBe(expected[name]);
      total += lines.length;
      const verdicts = execFileSync("sha256sum", ["-c", "manifest.sha256"],
        { cwd: join(ROOT, dir), encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] })
        .split("\n").filter(Boolean);
      expect(verdicts.filter(v => !v.endsWith(": OK")), `${name} has failing entries`).toEqual([]);
    }
    expect(total, "the frozen total is 167").toBe(167);
  });

  it("the pointer files are UNLISTED in the seal, which is why adding them changed nothing", () => {
    expect(pointerFile.thisFile.listedInSealedManifest).toBe(false);
    const manifest = read(`${CONTRACT}/manifest.sha256`);
    for (const name of ["ERRATA-FORWARD.json", "ERRATA-FORWARD.md"])
      expect(manifest.includes(name),
        `${name} is LISTED in the frozen manifest. The pointer was meant to sit beside the seal without ` +
        `touching it; a listed pointer makes every future edit of it a seal break`).toBe(false);
  });

  /**
   * THE ERRATA DIRECTION, read from the errata's own prose. PINK's JSON carries `declaredWithdrawals`, but
   * that field is PINK's derivation of its own document; checking it against PINK's pointers would be the
   * document agreeing with itself. So the headings are scanned here independently. This is the direction
   * that catches the quiet failure: a FOURTH withdrawal added to the errata with no pointer written for it
   * leaves a sealed claim standing with nothing leading to its correction, and nothing else would notice.
   */
  it("every withdrawal the errata declares has a pointer — no correction without a route to it", () => {
    const errata = read(pointerFile.errata.path).split("\n");
    const declared: string[] = [];
    errata.forEach(line => {
      const m = line.match(/^###\s+(W-\d+)\s+·/);
      if (m !== null && /WITHDRAWN|SUPERSEDED/.test(line)) declared.push(m[1]);
    });
    expect(declared.length,
      "no withdrawal heading was found in the errata. Either the heading shape changed — in which case this " +
      "limb is decoration — or the withdrawals were removed rather than kept").toBeGreaterThan(0);

    const routed = new Set(pointerFile.pointers.map(p => p.id));
    expect(declared.filter(id => !routed.has(id)),
      "the errata withdraws a claim that no forward pointer leads to. A reader opening the sealed register " +
      "meets the original sentence with nothing pointing at its correction — which is the exact condition " +
      "the owner's second decision was given to end").toEqual([]);

    const orphaned = [...routed].filter(id => !declared.includes(id));
    expect(orphaned,
      "a pointer names a withdrawal the errata no longer declares — a stale pointer, which must fail rather " +
      "than stand (the AUTHORISED_CROSSINGS shape)").toEqual([]);
  });

  it("each pointer carries a verdict, an ISO date, and at least one verbatim occurrence", () => {
    expect(pointerFile.pointers.length).toBe(3);
    for (const p of pointerFile.pointers) {
      expect(["WITHDRAWN", "SUPERSEDED"], `${p.id}'s verdict`).toContain(p.verdict);
      expect(p.date, `${p.id}'s date`).toMatch(/^20\d\d-\d\d-\d\d$/);
      expect(p.occurrences.length, `${p.id} cites no line in the sealed register`).toBeGreaterThan(0);
      for (const o of p.occurrences) {
        expect(o.line, `${p.id}'s cited line`).toBeGreaterThan(0);
        expect(o.quote.length, `${p.id} cites line ${o.line} with an empty quote`).toBeGreaterThan(0);
      }
    }
    /** W-1's four dependent passages: PINK refused to retract a premise and leave its conclusions standing. */
    const w1 = pointerFile.pointers.find(p => p.id === "W-1");
    expect((w1?.dependentPassages ?? []).length,
      "W-1's dependent passages are gone. The unpushedness was load-bearing in four places, and a " +
      "withdrawal that drops them retracts a premise while leaving its conclusions").toBe(4);
  });
});
