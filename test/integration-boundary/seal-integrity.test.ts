import { execFileSync } from "node:child_process";
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

  it("every sealed manifest is itself unmodified", () => {
    const manifests = git("ls-files", "--", "*manifest.sha256");
    expect(manifests.length).toBeGreaterThan(20);
    const changed = git("status", "--porcelain=v1", "--", ...manifests).filter(l => !l.startsWith("?? "));
    expect(changed, "a manifest.sha256 has been rewritten — a seal that regenerates itself verifies against its own new content, which is worse than one that breaks").toEqual([]);
  });
});
