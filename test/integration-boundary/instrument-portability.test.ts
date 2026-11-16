import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { withdrawalOn } from "./withdrawn";

/**
 * INSTRUMENT PORTABILITY · F-R12 / F-R13 (GELB, 2026-11-16)
 *
 * The owner's mandate names this class directly: *remove above all the dependencies on machine-local paths
 * and on undocumented sister repositories*. PINK discharged it for its own 83 instruments and could not
 * APPLY the result, because all 83 sit inside a frozen seal — so the owner gave PINK a new, separately
 * versioned evidence layer. This guard covers the other side: the instruments that are NOT in PINK's
 * contract directories, which are unsealed and were therefore repairable in place.
 *
 * MEASURED AT `4df69570`, population defined before it was counted: tracked `.mjs`/`.mts`/`.js`/`.py`
 * under `docs/`, excluding PINK's four contract directories — **152 instruments, 21 of which named a
 * machine-local path, 0 of them sealed** (checked against all 360 entries of every tracked manifest).
 *
 * THREE CLASSES, AND THE SECOND IS THE WORST:
 *   T  13 `playwright` sites importing from `nquiry`, the undocumented sister repository, and 3 `sharp`
 *      sites importing from another worktree. Both packages are declared devDependencies here.
 *   I  *** 7 FIXTURE SITES READING THROUGH A WORKTREE THAT NO LONGER EXISTS ON THIS MACHINE, WHILE EVERY
 *      ONE OF THOSE FILES IS TRACKED IN THIS REPOSITORY AT THE IDENTICAL RELATIVE PATH. *** They resolved
 *      nowhere — not even here — and the repair is not a workaround but a better path to the same bytes.
 *   S  7 sites under a dead session scratchpad. PINK found 12 of the same in its own population,
 *      independently, and named the class first: a dead session id resolves nowhere rather than wrongly.
 *
 * WHY A SCAN AND NOT A FILE LIST. GRUEN's F-G5, against me, was exactly that mistake: my fixtures limbs
 * guarded a PATH LIST, so the same defect in a new file passed 32/32. This scans by shape over every
 * tracked instrument, so a new file carrying a machine-local path is caught the moment it is tracked.
 *
 * AND WHY THE EXEMPTIONS ARE CONSUMED IN FULL. A crossing is declared with its file AND its reason, and a
 * declaration whose file no longer contains such a path FAILS as stale. That is the AUTHORISED_CROSSINGS
 * shape: an exemption that outlives its cause becomes a standing permission, and a standing permission is
 * how this class aged into the record in the first place.
 */

const ROOT = join(__dirname, "../..");
const git = (...args: string[]) =>
  execFileSync("git", args, { cwd: ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] })
    .split("\n").filter(Boolean);

/** Both the plain form and the regex-escaped form, so a pattern literal cannot slip past the scan. */
const MACHINE_LOCAL = /\/home\/codi\/|\\\/home\\\/codi\\\/|\/tmp\/claude-1000\/|\\\/tmp\\\/claude-1000\\\//;

/** PINK's four contract directories: sealed, and repaired through the owner's separately versioned layer. */
const PINK_CONTRACT = /^docs\/architecture\/decision-fields\/evidence\/mapping-phase-[defg]-contract\//;

/**
 * Files that may name a machine-local path, each with the reason it must. Consumed in full below.
 */
const AUTHORISED_CROSSINGS: Record<string, string> = {
  "docs/career_analysis/evidence/mapping-phase-g/scripts/gruen-pg16-crowding-L1.mjs":
    "GRUEN's authority, handed over 2026-11-16 with the measurement. GELB does not edit another lane's " +
    "instruments — I ordered a wrong edit of GRUEN's once this round and GRUEN refused it with grounds, " +
    "correctly. When GRUEN repairs these three, the limb below turns this declaration red as stale and " +
    "forces its removal, so the hand-over cannot quietly become a permanent exemption.",
  "docs/career_analysis/evidence/mapping-phase-g/scripts/gruen-provenance.mjs":
    "GRUEN's authority, handed over 2026-11-16. Carries BOTH an absolute playwright default behind " +
    "CONDYN_PLAYWRIGHT_MODULE and an absolute GRUEN_EVIDENCE_ROOT default.",
  "docs/career_analysis/evidence/mapping-phase-g/scripts/gruen-rank5-check.mjs":
    "GRUEN's authority, handed over 2026-11-16. Imports a sibling module through an absolute worktree path.",
  "docs/career_analysis/evidence/support/evidence-tools.mjs":
    "GELB · the resolver's own docstring records WHICH paths were removed and from where. Deleting that " +
    "provenance to satisfy a scanner would trade the repair's record for a green limb.",
  "docs/career_analysis/evidence/support/portable-rewrite.mjs":
    "GELB · the rewriter must contain the literals it MATCHES, or it cannot find them.",
};

const instruments = (): string[] =>
  git("ls-files", "--", "docs/**/*.mjs", "docs/**/*.mts", "docs/**/*.js", "docs/**/*.py")
    .filter(f => !PINK_CONTRACT.test(f));

const reads = (file: string): string => { try { return readFileSync(join(ROOT, file), "utf8"); } catch { return ""; } };

describe("instrument portability · no machine-local path, no undocumented sister repository (F-R12)", () => {
  const population = instruments();
  const offenders = population.filter(f => MACHINE_LOCAL.test(reads(f)));

  it("the population is the whole tracked instrument set, so nothing below passes over a handful of files", () => {
    expect(population.length,
      "fewer than 100 tracked instruments were found outside PINK's contract directories — the glob is stale " +
      "and this guard is measuring something other than the instrument layer").toBeGreaterThan(100);
  });

  it("no instrument names a machine-local path unless the crossing is declared with a reason", () => {
    const undeclared = offenders.filter(f => AUTHORISED_CROSSINGS[f] === undefined);
    expect(undeclared,
      "an instrument names a path on one machine. It will resolve on the machine that wrote it and read the " +
      "WRONG TREE, or resolve nowhere at all — either way it reports. Route it through " +
      "docs/career_analysis/evidence/support/evidence-tools.mjs (or evidence_tools.py), or declare the " +
      "crossing here with the reason it must stay").toEqual([]);
  });

  it("every declared crossing is still a real one — a stale exemption fails rather than standing", () => {
    const stale = Object.keys(AUTHORISED_CROSSINGS).filter(f => !offenders.includes(f));
    expect(stale,
      "a crossing is declared for a file that no longer names a machine-local path (or no longer exists). " +
      "Remove the declaration: an exemption that outlives its cause is a standing permission").toEqual([]);
  });

  /**
   * F-R13, AS AN INVARIANT RATHER THAN AS AN INCIDENT — AND IT IS A FINDING AGAINST MY OWN F-R9 REPAIR.
   *
   * F-R9 made `gelb-paths.mjs` refuse a FOREIGN repository by requiring an identity commit, because a guard
   * asking "is this a repository?" instead of "is this *the* repository?" has the same defect as a figure
   * without its build (A-G494). The commit it chose was PHASE_G's base. *** MEASURED: THAT OBJECT IS IN 7 OF
   * 124 REFS AND IS NOT AN ANCESTOR OF `main`, SO A LEGITIMATE SINGLE-BRANCH CLONE OF THIS REPOSITORY DOES
   * NOT HOLD IT AND THE GUARD REFUSES A GENUINE CHECKOUT. *** Proven with `git clone --no-local
   * --single-branch --branch main`, after a first attempt with `--local` proved nothing at all: a local
   * clone copies the whole object store, so the commit travelled and the test was the wrong instrument.
   *
   * F-R9 fixed a false ACCEPTANCE and introduced a false REFUSAL. The right anchor is the one object every
   * clone of this repository holds on every branch: its ROOT COMMIT. This limb derives that from the
   * repository rather than hardcoding it, so it needs no remote ref and works in any non-shallow clone.
   */
  it("every instrument pinning this repository's identity pins it on the ROOT commit (F-R13)", () => {
    const roots = git("rev-list", "--max-parents=0", "HEAD");
    expect(roots.length, "this repository has no single root commit — the anchor F-R13 chose is not available").toBe(1);

    const pins: string[] = [];
    for (const file of population) {
      // A line carrying an attributable, dated withdrawal mark is a QUOTATION of a corrected anchor, not a
      // live one — the fourth instance of a text guard flagging the record of its own finding (see
      // ./withdrawn.ts). A bare mark does not qualify and falls back to being live.
      for (const line of reads(file).split("\n")) {
        if (withdrawalOn(line) !== null) continue;
        for (const m of line.matchAll(/IDENTITY_COMMIT\s*[:=]\s*"([0-9a-f]{40})"/g))
          if (m[1] !== roots[0])
            pins.push(`${file} pins identity on ${m[1].slice(0, 8)}, which is not this repository's root commit ` +
              `${roots[0].slice(0, 8)}. If that object is unreachable from a branch, a legitimate clone of THAT ` +
              `branch is refused as foreign (F-R13).`);
      }
    }
    expect(pins,
      "an identity guard is anchored on a commit that not every clone of this repository holds").toEqual([]);
  });

  /**
   * THE EXCLUSION FOR PINK'S CONTRACT DIRECTORIES, AND WHAT MEASURING IT EXPOSED.
   *
   * The scan excludes PINK's four `mapping-phase-{d,e,f,g}-contract/` directories, because all 83 of PINK's
   * instruments are entries in a seal the owner froze and the owner directed that repair into a new,
   * separately versioned layer rather than in place. An exclusion that protects nothing is decoration, so
   * the first thing this limb did was count what it was excluding — and found **ZERO**.
   *
   * *** PINK'S ENTIRE VALIDATION EVIDENCE LAYER IS ABSENT FROM THIS BRANCH: 254 FILES, FOUR MANIFESTS AND
   * THE 167 FROZEN ENTRIES LIVE ON `validation/hr-decision-loop-pink` AND NOWHERE IN THE INTEGRATION. ***
   * So the "integrated system state" does not contain the independent lane's evidence at all. That is a
   * seam finding, not a test failure, and this limb now states whichever case is true rather than asserting
   * the one I assumed. Both cases are checked: absent here, or present and sealed at full strength. The
   * exclusion can therefore never silently protect an unsealed copy that was merged in later.
   */
  it("PINK's excluded contract directories are either absent from this branch or present AND sealed", () => {
    const present = git("ls-files", "--", "docs/architecture/decision-fields/evidence/mapping-phase-*-contract/");
    const manifests = present.filter(f => f.endsWith("/manifest.sha256"));

    if (present.length === 0) {
      expect(population.filter(f => PINK_CONTRACT.test(f)),
        "the exclusion removed files although none are tracked here — the filter is matching something else").toEqual([]);
      return;
    }

    expect(manifests.length,
      "PINK's contract directories ARE tracked on this branch but carry no manifest. They are excluded from " +
      "this scan only because they are sealed; an unsealed copy of them here is an unguarded machine-local " +
      "path layer wearing PINK's exemption").toBeGreaterThanOrEqual(3);
    const entries = manifests.reduce((total, m) =>
      total + reads(m).split("\n").filter(line => /^[0-9a-f]{64}\s/.test(line)).length, 0);
    expect(entries,
      "the sealed entry count under PINK's contract directories has fallen below the 167 the owner froze").toBeGreaterThanOrEqual(167);
  });
});
