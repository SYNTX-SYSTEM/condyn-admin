import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * SEAL INTEGRITY · F-R10 (GELB, 2026-11-16) — and the defect it guards was mine, committed, and reverted.
 *
 * WHAT HAPPENED. Declaring `playwright` un-skipped five browser suites (F-R8). Two of them — PINK's
 * `syntx-walk.e2e` and `job-scope-gate.e2e` — write their screenshots, reports and a REGENERATED
 * `manifest.sha256` into an evidence directory. I ran them, then committed with `git add -A`, and
 * *** 67 EVIDENCE PATHS AND TWO SEALED MANIFESTS WENT INTO A COMMIT UNDER A MANDATE THAT FREEZES SEALS. ***
 * Reverted: `docs/` is byte-identical to `7ffaeb40` again and both manifests verify against their originals
 * (14/14 and 37/37). The regenerated manifests had ALSO verified — against the new content — which is exactly
 * why a seal that rewrites itself is worse than one that breaks.
 *
 * THE CAUSE IS SHARPER THAN THE ACCIDENT, AND IT IS A DESIGN THIS RECORD ALREADY BELIEVES IN. Those venues
 * are NAMED BY THE BUILD THEY DESCRIBE — `syntx-walk-${SYNTX_WALK_TIP}`, `job-scope-gate-${JOB_SCOPE_TIP}` —
 * and both read an environment variable whose comment says *"the tip under test names the evidence
 * directory"*. Run without naming a tip, they default to the historical one. *** SO RUNNING THEM WITHOUT
 * DECLARING THE BUILD OVERWRITES ANOTHER BUILD'S EVIDENCE WITH YOUR OWN MEASUREMENTS — A-G430'S RULE
 * IMPLEMENTED IN A DIRECTORY NAME, DEFEATED BY NOT SETTING A VARIABLE. ***
 *
 * So this limb states the invariant rather than the incident: no tracked file inside a sealed directory may
 * be modified or deleted in the working tree. It is browser-free, it is git-level, and it fails LOUDLY the
 * moment a run writes where a seal lives — instead of a `git add -A` carrying it quietly into history.
 */

const ROOT = join(__dirname, "../..");
const git = (...args: string[]) =>
  execFileSync("git", args, { cwd: ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] })
    .split("\n").filter(Boolean);

/** Every directory holding a tracked manifest — the sealed venues, read rather than listed. */
const sealedDirectories = (): string[] =>
  [...new Set(git("ls-files", "--", "*manifest.sha256").map(f => f.slice(0, f.lastIndexOf("/"))))].sort();

describe("seal integrity · no run may rewrite a sealed evidence venue (F-R10)", () => {
  const sealed = sealedDirectories();

  it("the repository holds sealed venues at all, so this limb is not passing over nothing", () => {
    expect(sealed.length).toBeGreaterThan(20);
  });

  it("no tracked file inside a sealed venue is modified or deleted in the working tree", () => {
    const dirty = git("status", "--porcelain=v1", "--", ...sealed)
      .filter(line => !line.startsWith("?? "))
      .map(line => line.trim());
    expect(dirty,
      "a sealed evidence venue has been written to. If a browser suite did this, it was run WITHOUT naming the " +
      "build under test — set SYNTX_WALK_TIP / JOB_SCOPE_TIP so the venue is named for YOUR tip, and restore " +
      "these paths with `git checkout -- <path>` rather than committing them (F-R10)").toEqual([]);
  });

  /**
   * A-G498's full form. The sealed venues are the loud case; the SAME overwrite happens in UNSEALED evidence
   * venues and nothing noticed. The final run of this mandate left 13 tracked files modified under
   * `career_analysis/evidence/{job-pool,hr-decision-loop}` — overwritten historical evidence, simply without a
   * manifest to make it obvious. Both venues are now build-named too (JOB_POOL_TIP / HR_LOOP_TIP), so the
   * invariant is stated over ALL tracked evidence rather than only where a seal happens to sit.
   */
  it("no tracked file under any evidence venue is modified or deleted in the working tree", () => {
    const venues = [...new Set(git("ls-files", "--", "docs/*/evidence/*", "docs/*/*/evidence/*")
      .map(f => f.slice(0, f.indexOf("/evidence/") + "/evidence".length)))].sort();
    expect(venues.length, "no evidence venue found — this limb would pass over nothing").toBeGreaterThan(0);
    const dirty = git("status", "--porcelain=v1", "--", ...venues).filter(l => !l.startsWith("?? ")).map(l => l.trim());
    expect(dirty,
      "a run overwrote tracked evidence. Name your build — SYNTX_WALK_TIP / JOB_SCOPE_TIP / JOB_POOL_TIP / " +
      "HR_LOOP_TIP — so the venue is named for YOUR tip, and restore these with `git checkout --` rather than " +
      "committing them (A-G498/F-R10)").toEqual([]);
  });

  it("every sealed manifest is itself unmodified", () => {
    const manifests = git("ls-files", "--", "*manifest.sha256");
    expect(manifests.length).toBeGreaterThan(20);
    const changed = git("status", "--porcelain=v1", "--", ...manifests).filter(l => !l.startsWith("?? "));
    expect(changed, "a manifest.sha256 has been rewritten — a seal that regenerates itself verifies against its own new content, which is worse than one that breaks").toEqual([]);
  });

  /**
   * F-R14 · *** A SEAL WHOSE ENTRIES ALL POINT AT ABSENT PATHS HAS NEVER CHECKED A SINGLE BYTE. ***
   *
   * Found by distrusting my own counter rather than by looking for it. Twice in this mandate I reported
   * `lens-owner-bfe0d27` as "14 genuinely failed", and both times that was wrong in the same way: `sha256sum
   * -c` prints `": FAILED"` for a byte mismatch and `": FAILED open or read"` for a file it cannot find, and
   * I had been counting the second as the first. Measured properly: **0 content mismatches in the entire
   * repository**, and all 14 of that venue's entries are UNRESOLVABLE — the manifest names them under a
   * subdirectory `owner-bfe0d27/` while the venue's seven tracked files sit at its root.
   *
   * So that seal verifies NOTHING, and its exit code looks identical to a seal that caught a tampered file.
   * *** THIS IS A-G499'S DUAL. *** A-G499 (PINK, against my main instrument) says a checksum answers "is
   * this venue internally consistent?" and never "does it describe the build it claims to". F-R14 is the
   * step before that: a checksum that cannot FIND its files answers nothing at all, while still exiting
   * non-zero like a verdict. And the reason I misread it is the rule GRUEN and PINK both handed me this
   * round — `FAILED open or read` is **cannot establish**, not **is wrong** (A-G503, A-G504). I applied
   * their rule to their code and not to my own counter until the arithmetic disagreed with itself.
   *
   * REPAIRING IT IS OUT OF SCOPE AND SAYING SO IS NOT: the fix is to edit that manifest, and the mandate
   * freezes existing seals and historical proof artefacts. So the venue is a DECLARED, DATED exemption with
   * its measured facts, and the exemption is consumed in full — if anyone ever repairs it, the declaration
   * goes stale and this limb turns red, forcing the declaration out.
   */
  /**
 * F-R15 · *** BOTH FORMS, BECAUSE REQUIRING ONE MADE MY OWN SEAL CENSUS BLIND TO 62% OF THE REPOSITORY. ***
 *
 * `sha256sum -c` writes `./path` when invoked on `.` and a bare `path` when invoked on files. Measured here:
 * **665 entries carry `./` (38 manifests), 1082 do not (63 manifests)**, total 1747. The first version of the
 * limbs below required `./`, so for `lens-owner-bfe0d27` the parse yielded ZERO entries — and `[].every(...)`
 * is **vacuously true**, which made the stale-exemption limb declare a still-broken venue repaired. The limb
 * went red for the right reason by the wrong route, and following that red is what found F-R15 in
 * `portable-rewrite.mjs`, where the same regex built the SEALED-FILE REFUSAL SET.
 *
 * So: both forms, and the parse is checked against the digest-line count. A manifest that holds digests yet
 * parses to nothing must FAIL, never read as "nothing is sealed here".
 */
const SEAL_ENTRY = /^([0-9a-f]{64})\s+\*?(?:\.\/)?(.+)$/;

const parseManifest = (dir: string): string[] => {
  const lines = readFileSync(join(ROOT, dir, "manifest.sha256"), "utf8").split("\n");
  const digestLines = lines.filter(l => /^[0-9a-f]{64}\s/.test(l)).length;
  const parsed = lines.map(l => l.match(SEAL_ENTRY)).filter((m): m is RegExpMatchArray => m !== null).map(m => m[2]);
  expect(parsed.length, `${dir}/manifest.sha256 holds ${digestLines} digest lines but ${parsed.length} parsed — ` +
    `an unparsed seal reads as an absent one (F-R15)`).toBe(digestLines);
  return parsed;
};

const UNRESOLVABLE_BY_DECLARATION: Record<string, string> = {
    "docs/architecture/decision-fields/evidence/lens-owner-bfe0d27":
      "PRE-EXISTING and OUT OF SCOPE (F-R14, 2026-11-16). All 14 entries name paths under `owner-bfe0d27/` " +
      "that are absent; the venue tracks 7 files at its root instead, 4 of them PNGs the manifest never " +
      "lists under those names. Repair means editing a frozen manifest, which this mandate forbids. " +
      "Measured, not assumed: 14 of 14 unresolvable, 0 content mismatches.",
  };

  it("every sealed manifest's entries RESOLVE to files that exist — or the venue is a declared exemption", () => {
    const offenders: string[] = [];
    for (const dir of sealed) {
      const listed = parseManifest(dir);
      const missing = listed.filter(rel => !existsSync(join(ROOT, dir, rel)));
      if (missing.length === 0) continue;
      if (UNRESOLVABLE_BY_DECLARATION[dir] !== undefined) continue;
      offenders.push(`${dir}: ${missing.length} of ${listed.length} listed entries do not exist ` +
        `(first: ${missing[0]}). \`sha256sum -c\` reports these as "FAILED open or read" — which is ` +
        `CANNOT ESTABLISH, not a byte mismatch, and a seal that cannot find its files has verified nothing.`);
    }
    expect(offenders, "a sealed venue's manifest names files that are not there").toEqual([]);
  });

  it("every declared unresolvable venue is still unresolvable — a repaired one must drop its exemption", () => {
    const stale = Object.keys(UNRESOLVABLE_BY_DECLARATION).filter(dir => {
      if (!existsSync(join(ROOT, dir, "manifest.sha256"))) return true;
      const listed = parseManifest(dir);
      return listed.length > 0 && listed.every(rel => existsSync(join(ROOT, dir, rel)));
    });
    expect(stale, "a venue is declared unresolvable but now resolves (or its manifest is gone). Remove the " +
      "declaration: an exemption that outlives its cause is a standing permission").toEqual([]);
  });

  it("and NOTHING in this repository is a content mismatch, which is the stronger statement", () => {
    const mismatches: string[] = [];
    for (const dir of sealed) {
      let out = "";
      try { out = execFileSync("sha256sum", ["-c", "manifest.sha256"],
        { cwd: join(ROOT, dir), encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }); }
      catch (error) { out = String((error as { stdout?: string }).stdout ?? ""); }
      for (const line of out.split("\n"))
        if (line.endsWith(": FAILED")) mismatches.push(`${dir}/${line.slice(0, -": FAILED".length)}`);
    }
    expect(mismatches,
      "a sealed file's CONTENT no longer matches its digest. This is the real thing, not an absent path: " +
      "something rewrote a byte inside a frozen venue").toEqual([]);
  });
});
