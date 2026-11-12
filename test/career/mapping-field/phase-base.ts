import { execFileSync } from "node:child_process";
import { join } from "node:path";

/**
 * The fixed reference of the mapping's architecture tests, shared by test/career/mapping-field/architecture.test.ts (MAP-D-ARCH) and
 * the phase-B test test/career/mapping/architecture.test.ts.
 *
 * PHASE_D_BASE is origin/main e360caf9, the commit phase D is built on (PERSON_X_JOB_MAPPING_PHASE_D.md §5.2, held by PINK). The
 * phase-C artifacts are baseline there. It is a fixed commit, not the merge base with origin/main: once phase D is merged that
 * merge base is HEAD itself, and a diff against it is empty for committed changes (PINK §3.98 F-PC-1, §3.99 F-RC-1, O-RC-1).
 */
export const ROOT = join(__dirname, "../../..");
export const PHASE_D_BASE = "e360caf9dcc7b7359d13e2a09884ff4ce09211a8";

/**
 * §106: `core.quotePath=false` is not a convenience. git QUOTES any path containing a non-ASCII byte by
 * default, so a file named with a `§` came back as `"docs/.../MUTANTS-\302\247105.md"` — surrounded by double
 * quotes — and EVERY path predicate built on this helper then failed on the quote rather than on the path:
 * the entry-set test reported it as outside the entry set, and the evidence-category test reported a valid
 * `.md` as neither an instrument nor an output. Both failed CLOSED, which is right, and both would have sent a
 * reader after the wrong cause, which is worse than failing open on a path nobody has. One flag at the source
 * rather than a strip at each of five call sites.
 */
export const git = (...args: string[]) => execFileSync("git", ["-c", "core.quotePath=false", ...args], { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).split("\n").filter(Boolean);

/**
 * §115 (A-G468, GELB's rule aimed here): A CAPTURED SUBPROCESS TAKES ITS OWN OUTPUT SIZE AS AN UNDECLARED
 * INPUT. Every `git diff` capture in this gate ran on node's 1 MiB `execFileSync` default. MEASURED, not
 * assumed: `git diff -U0 PHASE_D_BASE -- <component>` is 120 028 bytes, 11.4 % of that limit, and the
 * component grew 77 529 -> 105 716 bytes in phase G alone. So the limit is now STATED rather than inherited.
 *
 * The sign matters more than the headroom. An overflow throws INSIDE a test, and a throw inside a test reads
 * as "the assertion failed" when it means "the input was never read" — A-G374's seventh instance was this
 * same confusion in the other direction. `ENOBUFS` is therefore translated into a message that says the gate
 * COULD NOT LOOK. The code branched on is measured (`execFileSync` with `maxBuffer: 1024` over that diff
 * yields `code === "ENOBUFS"`, `status === null`), not guessed — a guard written against a guessed error
 * code is dead code that reads as protection (A-G465).
 */
export const DIFF_MAX_BUFFER_DEFAULT = 1 << 26;
/** Read per call, not at module load, so the limit is an INJECTABLE input and the guard below is provable in-process. */
export const diffMaxBuffer = (): number => {
  const raw = process.env.CONDYN_GATE_DIFF_MAXBUFFER;
  if (raw === undefined) return DIFF_MAX_BUFFER_DEFAULT;
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) throw new Error(`ERR_GATE_DIFF_MAXBUFFER_MALFORMED: ${JSON.stringify(raw)} — a capture limit that cannot be read must not fall back to a default.`);
  return n;
};
export const gitDiff = (...args: string[]): string[] => {
  const limit = diffMaxBuffer();
  try {
    return execFileSync("git", ["-c", "core.quotePath=false", "diff", ...args], { cwd: ROOT, encoding: "utf8", maxBuffer: limit, stdio: ["ignore", "pipe", "pipe"] }).split("\n");
  } catch (error) {
    if ((error as { code?: string }).code === "ENOBUFS")
      throw new Error(`ERR_GATE_COULD_NOT_READ: \`git diff ${args.join(" ")}\` exceeded the declared ${limit}-byte capture. THIS IS NOT A FAILED ASSERTION — the gate never saw its input.`);
    throw error;
  }
};

/**
 * The base, resolved when a test asks for it (not at module load), so the tests that need no history still run. In a clone without
 * the commit (a shallow CI checkout) every history test fails with this message — nothing is skipped and nothing is hidden (O-RC-3).
 */
export function phaseDBase(): string {
  let sha: string | undefined;
  try { sha = git("rev-parse", "--verify", "--quiet", `${PHASE_D_BASE}^{commit}`)[0]; } catch { sha = undefined; }
  if (sha === undefined) {
    throw new Error(`ERR_PHASE_D_BASE_MISSING: the mapping's architecture tests compare against commit ${PHASE_D_BASE} (origin/main when phase D began, ` +
      "PERSON_X_JOB_MAPPING_PHASE_D.md §5.2), and this clone does not have it. A shallow clone? Fetch the history (e.g. git fetch --unshallow) and run again.");
  }
  return sha;
}

/**
 * PHASE_E_BASE is 86e36924, GRÜN's phase-D delivery with PINK's GO (PERSON_X_JOB_MAPPING_PHASE_E.md, "Base"). MAP-E-ARCH compares
 * against it; like phaseDBase() it is resolved when asked and fails loudly in a clone without it.
 */
export const PHASE_E_BASE = "86e36924282ae46e9f22a15a1446a3d7822440d4";
export function phaseEBase(): string {
  let sha: string | undefined;
  try { sha = git("rev-parse", "--verify", "--quiet", `${PHASE_E_BASE}^{commit}`)[0]; } catch { sha = undefined; }
  if (sha === undefined) throw new Error(`ERR_PHASE_E_BASE_MISSING: MAP-E-ARCH compares against commit ${PHASE_E_BASE} (PERSON_X_JOB_MAPPING_PHASE_E.md, Base), and this clone does not have it.`);
  return sha;
}

/**
 * PHASE_F_BASE is 9cc06f84, GRÜN's phase-E delivery with PINK's GO (PERSON_X_JOB_MAPPING_PHASE_F.md, "Base"). MAP-F-ARCH compares
 * against it, and MAP-E-ARCH's B-8 closes phase E's own range at it (§20); resolved when asked, failing loudly in a clone without it.
 */
export const PHASE_F_BASE = "9cc06f848bb90ccb2c54af1eae69f17f30853da7";
export function phaseFBase(): string {
  let sha: string | undefined;
  try { sha = git("rev-parse", "--verify", "--quiet", `${PHASE_F_BASE}^{commit}`)[0]; } catch { sha = undefined; }
  if (sha === undefined) throw new Error(`ERR_PHASE_F_BASE_MISSING: MAP-F-ARCH compares against commit ${PHASE_F_BASE} (PERSON_X_JOB_MAPPING_PHASE_F.md, Base), and this clone does not have it.`);
  return sha;
}
/** A-F18: a range test that examined nothing would pass as compliance. `older` must be an ancestor of `newer`, and the range non-empty. */
export function assertRange(older: string, newer: string): number {
  try { execFileSync("git", ["merge-base", "--is-ancestor", older, newer], { cwd: ROOT, stdio: "ignore" }); } catch {
    throw new Error(`ERR_PHASE_RANGE_ORDER: ${older} is not an ancestor of ${newer} — the range would be inverted or disjoint.`);
  }
  const commits = git("rev-list", "--count", `${older}..${newer}`)[0];
  if (!(Number(commits) > 0)) throw new Error(`ERR_PHASE_RANGE_EMPTY: ${older}..${newer} contains no commit — a range test over it would examine nothing.`);
  return Number(commits);
}

/**
 * PHASE_G_BASE is 93c47e03, GRÜN's phase-F re-delivery (PERSON_X_JOB_MAPPING_PHASE_G.md, "Base"). MAP-G-ARCH compares against it,
 * and every predecessor's open range is closed at it (PHASE_G §8 (6): closing the predecessor's range is part of opening a phase).
 */
export const PHASE_G_BASE = "93c47e03bc01f06f34f7b9f9411ca9a1460b561d";
export function phaseGBase(): string {
  let sha: string | undefined;
  try { sha = git("rev-parse", "--verify", "--quiet", `${PHASE_G_BASE}^{commit}`)[0]; } catch { sha = undefined; }
  if (sha === undefined) throw new Error(`ERR_PHASE_G_BASE_MISSING: MAP-G-ARCH compares against commit ${PHASE_G_BASE} (PERSON_X_JOB_MAPPING_PHASE_G.md, Base), and this clone does not have it.`);
  return sha;
}
/** Paths changed between two commits (committed changes only — a closed range has no working tree). A-F18: the range is asserted first. */
export function changedInRange(older: string, newer: string, ...paths: string[]): string[] {
  assertRange(older, newer);
  return git("diff", "--name-only", "--no-renames", older, newer, "--", ...paths).sort();
}
