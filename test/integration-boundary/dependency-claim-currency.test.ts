import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * DEPENDENCY-CLAIM CURRENCY · F-R11 (GELB, 2026-11-16) — and the defect is mine, caused by my own repair.
 *
 * WHAT HAPPENED. Two browser suites carried, in their file docstrings:
 *
 *     [WITHDRAWN F-R11 2026-11-16] "Playwright is not a dependency of this repository."
 *     ...and: "Point CONDYN_PLAYWRIGHT_MODULE at a `playwright` package directory to run the browser section"
 *
 * *** THAT MARKER ON THE QUOTATION IS NOT DECORATION: WITHOUT IT THIS FILE FAILS ITS OWN LIMB. *** A guard
 * that scans text is INSIDE ITS OWN POPULATION, and quoting the defect it was written to catch re-arms it
 * against the evidence of its own finding. It happened three times in one sitting — here, in both repaired
 * docstrings, and in a Python comment that kept a dead path alive by naming it. The resolution is the same
 * every time and it is the one PINK's forward pointers need too: a withdrawn sentence stays readable and
 * carries an ATTRIBUTABLE, DATED mark on its own line, so it is quotable without being re-read as live.
 *
 * *** THAT SENTENCE WAS TRUE WHEN WRITTEN AND FALSE AT THE TIP, BECAUSE I MADE IT FALSE. *** Closing F-R8
 * meant declaring `playwright: 1.63.0` as an exact devDependency, after which the package resolves bare and
 * no environment variable is needed at all. The prose kept instructing an operator to set a variable that is
 * now an override, and kept describing the suite as ungated-by-dependency when the dependency had arrived.
 *
 * THIS IS F-R8'S OWN CLASS, TURNED ON THE LANE THAT CLOSED F-R8. F-R8 was "12 of 20 skips were a missing
 * dependency wearing a policy's clothes" — a measurement that aged. Here a *claim about the build* aged, in
 * the same direction, inside the repair that fixed the first one. A-G495: a string that still exists
 * somewhere is not evidence it still exists where it is asserted. The inverse holds too, and that is this
 * finding: *** A SENTENCE ABOUT THE BUILD IS A MEASUREMENT, AND A MEASUREMENT THAT NOTHING RE-READS ROTS. ***
 *
 * SO THE REPAIR IS NOT THE PROSE EDIT. The prose edit is one commit from stale again. This guard states the
 * invariant: every sentence in this repository that makes a checkable claim about a package's declaration
 * status is CHECKED AGAINST package.json, in BOTH directions, on every run, browser-free, in milliseconds.
 *
 *   - a file claiming a package IS declared, with a version, must match package.json exactly;
 *   - a file claiming a package IS NOT a dependency must find it absent from package.json.
 *
 * The second direction is why this does not go vacuous after the repair: once the two docstrings state the
 * true, positive claim, REMOVING the dependency turns them red. The claim and the manifest are consumed in
 * full against each other, which is the AUTHORISED_CROSSINGS shape — a lapsed claim FAILS instead of
 * becoming a standing exemption.
 *
 * It scans by CLAIM SHAPE over every tracked source, not by a file list. F-G5 (GRUEN, against me) was
 * exactly the other thing: my fixtures limbs guarded a path list, so the same defect in a NEW file passed
 * 32/32. A new file carrying either claim is caught here the moment it is tracked.
 */

const ROOT = join(__dirname, "../..");
const git = (...args: string[]) =>
  execFileSync("git", args, { cwd: ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] })
    .split("\n").filter(Boolean);

/**
 * THE CLAIM SHAPE — and this guard's own first run is the reason it is written this way.
 *
 * *** I FIRST REQUIRED THE PACKAGE NAME TO BE IN BACKTICKS. THE SCAN THEN FOUND ZERO CLAIMS AND THE GUARD
 * REPORTED TWO GREEN LIMBS OVER AN EMPTY SET *** — because the stale prose F-R11 is about reads a bare,
 * prose-capitalised `Playwright`, not a delimited package name. A guard whose claim shape is stricter than
 * the prose it guards passes over the defect while looking like a measurement. The VACUITY LIMB caught it,
 * which is the whole reason that limb exists, and it caught it against its own author on its first run.
 *
 * So the name may be delimited or bare, and it is LOWERCASED before lookup: npm names are lowercase, so a
 * prose capitalisation is a spelling of the same package and must not become an excuse to miss the claim.
 * What was actually written is reported verbatim in the failure message.
 */
const NAME = "`?([A-Za-z0-9@/._-]+)`?";
const CLAIM_DECLARED = new RegExp(`${NAME} is a declared (dependency|devDependency) of this repository \\(([^)\\n]+)\\)`, "g");
const CLAIM_ABSENT = new RegExp(`${NAME} is not a dependency of this repository`, "g");

type Claim = { file: string; line: number; pkg: string; written: string; kind: "declared" | "absent";
               withdrawn: string | null; field?: string; version?: string };

/**
 * A WITHDRAWN CLAIM MUST STAY READABLE WITHOUT BEING RE-READ AS LIVE, AND THE MARK MUST NOT BE A BLANKET
 * ESCAPE HATCH. The record's discipline is to correct in place and never delete the original sentence, so
 * the falsified sentence still stands in both docstrings — which re-armed this guard against the very
 * quotation of the defect it found. The mark is therefore ATTRIBUTABLE AND DATED on the claim's own line:
 * a finding id and an ISO date, checked below. A bare "WITHDRAWN" silences nothing.
 */
const WITHDRAWAL = /\[WITHDRAWN (F-[A-Z0-9-]+|[A-Z]-G\d+) (20\d\d-\d\d-\d\d)\]/;

function claims(): Claim[] {
  const found: Claim[] = [];
  const sources = git("ls-files", "--", "*.ts", "*.tsx", "*.mts", "*.mjs", "*.js")
    .filter(f => !f.startsWith("node_modules/"));
  for (const file of sources) {
    let text: string;
    try { text = readFileSync(join(ROOT, file), "utf8"); } catch { continue; }
    if (!text.includes("of this repository")) continue;
    const lines = text.split("\n");
    lines.forEach((text_, i) => {
      const mark = text_.match(WITHDRAWAL);
      const withdrawn = mark === null ? null : `${mark[1]} ${mark[2]}`;
      for (const m of text_.matchAll(CLAIM_DECLARED))
        found.push({ file, line: i + 1, pkg: m[1].toLowerCase(), written: m[1], kind: "declared", withdrawn, field: m[2], version: m[3] });
      for (const m of text_.matchAll(CLAIM_ABSENT))
        found.push({ file, line: i + 1, pkg: m[1].toLowerCase(), written: m[1], kind: "absent", withdrawn });
    });
  }
  return found;
}

const manifest = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as {
  dependencies?: Record<string, string>; devDependencies?: Record<string, string>;
};
const declaredIn = (pkg: string): { field: string; version: string } | null =>
  manifest.dependencies?.[pkg] !== undefined ? { field: "dependency", version: manifest.dependencies[pkg] }
    : manifest.devDependencies?.[pkg] !== undefined ? { field: "devDependency", version: manifest.devDependencies[pkg] }
      : null;

describe("dependency-claim currency · a sentence about the build is a measurement (F-R11)", () => {
  const all = claims();
  const live = all.filter(c => c.withdrawn === null);

  it("the scan finds claims at all, so no limb below passes over an empty set", () => {
    expect(all.length,
      "no dependency claim was found anywhere. Either the claim wording changed — in which case the regexes " +
      "above are stale and this guard is decoration — or the claims were deleted rather than kept current").toBeGreaterThan(0);
  });

  it("every file claiming a package IS declared names the field and version package.json actually carries", () => {
    const wrong = live.filter(c => c.kind === "declared").map(c => {
      const real = declaredIn(c.pkg);
      if (real === null) return `${c.file}:${c.line} claims \`${c.pkg}\` is a declared ${c.field} — package.json declares it NOWHERE`;
      if (real.field !== c.field) return `${c.file}:${c.line} claims \`${c.pkg}\` is a ${c.field} — package.json has it as a ${real.field}`;
      if (real.version !== c.version) return `${c.file}:${c.line} claims \`${c.pkg}\` at ${c.version} — package.json declares ${real.version}`;
      return null;
    }).filter((x): x is string => x !== null);
    expect(wrong, "a positive dependency claim no longer matches package.json").toEqual([]);
  });

  it("a withdrawn claim is marked on its own line with a finding id AND a date, never bare", () => {
    const quoted = all.filter(c => c.withdrawn !== null);
    expect(quoted.length,
      "no withdrawn claim is marked anywhere, yet F-R11 required the falsified sentence to be KEPT in both " +
      "docstrings. If the quotations were deleted instead of marked, this record lost the original wording " +
      "and this limb is watching nothing").toBeGreaterThan(0);
    for (const c of quoted)
      expect(c.withdrawn, `${c.file}:${c.line}`).toMatch(/^(F-[A-Z0-9-]+|[A-Z]-G\d+) 20\d\d-\d\d-\d\d$/);
  });

  it("every LIVE file claiming a package is NOT a dependency is still right about that (F-R11's own shape)", () => {
    const wrong = live.filter(c => c.kind === "absent").map(c => {
      const real = declaredIn(c.pkg);
      return real === null ? null
        : `${c.file}:${c.line} says "${c.written} is not a dependency of this repository", but package.json declares it ` +
          `as a ${real.field} at ${real.version}. The sentence was true when written and the declaration falsified it ` +
          `(F-R11). State the claim in its true direction so this limb keeps checking it.`;
    }).filter((x): x is string => x !== null);
    expect(wrong, "a negative dependency claim has been falsified by the manifest").toEqual([]);
  });

  it("the two browser suites that F-R8 un-skipped are among the files carrying a claim, by name", () => {
    const carriers = new Set(all.map(c => c.file));
    for (const f of ["test/career/job-pool/e2e/job-pool-workflow.e2e.test.ts",
                     "test/career/hr-decision-loop/e2e/hr-decision-loop-frontend.e2e.test.ts"])
      expect(carriers.has(f), `${f} carries no dependency claim any more — if its docstring dropped the claim, this ` +
        `guard stopped watching the two files F-R11 was found in`).toBe(true);
  });
});
