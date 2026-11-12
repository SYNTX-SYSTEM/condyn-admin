/**
 * GELB · PATH DERIVATION — §129, A-G469's discharge
 *
 * 14 of 26 GELB instruments declared an ABSOLUTE path to a worktree on one machine. A clause-4 run from a
 * fresh clone of origin exposed the shape: the path still RESOLVES on the machine that wrote it, so the
 * instrument SUCCEEDS there while reading the ORIGINAL worktree rather than the checkout it was launched
 * from. *** A SAME-MACHINE FRESH CHECKOUT THEREFORE CANNOT DETECT THIS AT ALL *** — it is A-G469's
 * filesystem clause in its most literal form, and it is why the honest figure is "5 of 26 run on another
 * machine" rather than the 9 my relocated experiment produced.
 *
 * So the roots are DERIVED from this module's own location and the derivation REFUSES if it lands somewhere
 * that is not a checkout of this repository. A wrong root that reports is worse than no root: it reads a
 * neighbouring tree and calls the result a measurement.
 *
 * This module imports nothing local, so every instrument can depend on it without a cycle.
 */
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { existsSync } from "node:fs";

const HERE = dirname(fileURLToPath(import.meta.url));

/** <repo>/docs/architecture/decision-fields/evidence/mapping-phase-g-gelb -> <repo> */
export const REPO_ROOT = resolve(HERE, "../../../../..");
/** -> <repo>/docs/architecture/decision-fields */
export const RECORD_DIR = resolve(HERE, "../..");
/** the phase records, by name rather than by offset (A-G427) */
export const PHASE_G = resolve(RECORD_DIR, "PERSON_X_JOB_MAPPING_PHASE_G.md");
export const PHASE_F = resolve(RECORD_DIR, "PERSON_X_JOB_MAPPING_PHASE_F.md");

if (!existsSync(resolve(REPO_ROOT, ".git")))
  throw new Error(`REFUSE gelb-paths: derived REPO_ROOT ${REPO_ROOT} holds no .git — refusing to read a tree ` +
    `that is not a checkout of this repository rather than reporting a measurement taken from one.`);
for (const [n, p] of [["PHASE_G", PHASE_G], ["PHASE_F", PHASE_F]])
  if (!existsSync(p)) throw new Error(`REFUSE gelb-paths: ${n} not at the derived ${p}`);

/**
 * THE PEER LANE, AS A REF RATHER THAN AS A SIBLING WORKTREE.
 *
 * Replacing an absolute path with a derived root is NOT a uniform change, and this is the distinction that
 * mattered: `git -C <root> show <sha>:<path>` is WORKTREE-INDEPENDENT — every clone holding the object
 * answers identically. But `<root>/<path>` read off disk, and `git -C <root> rev-parse HEAD`, are
 * WORKTREE-DEPENDENT: they answer about whichever branch that particular checkout happens to have out.
 * *** SO SUBSTITUTING A DERIVED ROOT SILENTLY CONVERTED TWO INSTRUMENTS FROM "THE PEER'S LANE" TO "MY OWN",
 * AND BOTH STILL RAN. *** gelb-pin-assertion-scan threw (the peer's test files are not in this checkout) and
 * gelb-e7-breath-mode did NOT — it cross-checked against MY head and reported it as the product's.
 *
 * The remedy is to stop reading the peer through a filesystem neighbour at all: resolve a NAMED ref and read
 * git objects at it. That is relocatable, pinned, and it REFUSES instead of falling back — a peer-lane read
 * that silently degrades to the local lane is the A-G469 failure one layer in.
 */
export function peerRef(root, candidates = [process.env.GELB_PEER_REF, "frontend/mapping-phase-g", "origin/frontend/mapping-phase-g"].filter(Boolean)) {
  const tried = [];
  for (const c of candidates) {
    try {
      const sha = execFileSync("git", ["-C", root, "rev-parse", "--short", c], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
      if (sha) return { ref: c, sha };
    } catch { tried.push(c); }
  }
  throw new Error(`REFUSE gelb-paths: no peer-lane ref resolved in ${root}. Tried: ${candidates.join(", ")}. ` +
    `Set GELB_PEER_REF. Refusing rather than falling back to this lane's own checkout (A-G469).`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("GELB · gelb-paths.mjs — derived, not declared");
  console.log(`  REPO_ROOT   ${REPO_ROOT}`);
  console.log(`  RECORD_DIR  ${RECORD_DIR}`);
  console.log(`  PHASE_G     ${PHASE_G}`);
  console.log(`  all three verified present; the module refuses at import if any is not.`);
  const pr = peerRef(REPO_ROOT);
  console.log(`  PEER LANE   ${pr.ref} -> ${pr.sha}   (refuses rather than falling back to this lane)`);
}
