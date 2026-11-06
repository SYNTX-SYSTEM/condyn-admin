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

export const git = (...args: string[]) => execFileSync("git", args, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).split("\n").filter(Boolean);

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
