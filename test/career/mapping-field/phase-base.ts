import { execFileSync } from "node:child_process";
import { join } from "node:path";

/**
 * The fixed reference of the phase-C architecture tests (PINK §3.98 F-PC-1, §3.99 F-RC-1, O-RC-1, O-RC-3), shared by
 * test/career/mapping-field/architecture.test.ts and the phase-B test test/career/mapping/architecture.test.ts.
 *
 * PHASE_C_BASE is origin/main 5ca0f3f5, the commit phase C was built on: phase B closed, validated by PINK §3.97. A fixed commit,
 * not the merge base with origin/main. Once phase C is merged that merge base is HEAD itself, so a diff against it is empty for
 * committed changes.
 */
export const ROOT = join(__dirname, "../../..");
export const PHASE_C_BASE = "5ca0f3f5dd4f5e0323396c519eb31df89454449d";

export const git = (...args: string[]) => execFileSync("git", args, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).split("\n").filter(Boolean);

/**
 * The base, resolved when a test asks for it (not at module load), so the tests that need no history still run. In a clone without
 * the commit (a shallow CI checkout) every history test fails with this message. Nothing is skipped and nothing is hidden.
 */
export function phaseCBase(): string {
  let sha: string | undefined;
  try { sha = git("rev-parse", "--verify", "--quiet", `${PHASE_C_BASE}^{commit}`)[0]; } catch { sha = undefined; }
  if (sha === undefined) {
    throw new Error(`ERR_PHASE_C_BASE_MISSING: the phase-C architecture tests compare against commit ${PHASE_C_BASE} (origin/main when phase C began, ` +
      "PINK §3.97), and this clone does not have it. A shallow clone? Fetch the history (e.g. git fetch --unshallow) and run again.");
  }
  return sha;
}
