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

/**
 * F-R9 (2026-11-16) — GRUEN'S FINDING AGAINST THIS MODULE, REPRODUCED AND REPAIRED.
 *
 * The check used to be: a .git directory exists, and the two records exist on disk. *** THAT PASSES INSIDE A
 * COMPLETELY FOREIGN GIT REPOSITORY. *** Reproduced: a throwaway repository created with "git init", holding
 * two empty record files made with "touch", was enough for this module to print its three roots and the line
 * "all three verified present". It refused only later, inside peerRef(), and only because that repository
 * happened to carry no branch of the peer lane's name — so any instrument importing REPO_ROOT or PHASE_G
 * WITHOUT peerRef would have reported a measurement taken from a stranger's tree, with no warning at all.
 * GRUEN's gruen-paths.mjs pinned identity properly from the start and said so when it read this module.
 *
 * Identity is now THREE conditions, and each one alone is insufficient:
 *   1. a .git directory          — proves only that SOMETHING here is version-controlled;
 *   2. an IDENTITY COMMIT present — proves it is a checkout of THIS repository; a foreign repository cannot
 *                                   hold this object, and no amount of file creation can forge it;
 *   3. both records GIT-TRACKED   — because an existsSync check is satisfied by an empty touched file.
 *
 * A-G494: *** A GUARD THAT ASKS "IS THIS A REPOSITORY?" INSTEAD OF "IS THIS *THE* REPOSITORY?" IS THE SAME
 * DEFECT AS A FIGURE WITHOUT ITS BUILD. *** Both name a kind where the record needed an identity.
 */
/**
 * F-R13 (2026-11-16) — MY OWN F-R9 REPAIR, CORRECTED. THE ORIGINAL ANCHOR IS KEPT, NOT DELETED:
 *
 *   [WITHDRAWN F-R13 2026-11-16] const IDENTITY_COMMIT = "93c47e03bc01f06f34f7b9f9411ca9a1460b561d";
 *                                // origin/frontend/mapping-phase-f @ 93c47e03, PHASE_G's base
 *
 * *** THAT OBJECT IS CONTAINED IN 7 OF 124 REFS AND IS NOT AN ANCESTOR OF `main`. *** Proven with
 * `git clone --no-local --single-branch --branch main`: the commit is ABSENT in the clone, so this module
 * would have refused a legitimate checkout of this repository as foreign. (A first attempt with `--local`
 * proved nothing — a local clone copies the whole object store, the commit travelled, and the test was the
 * wrong instrument. Recorded because the wrong instrument nearly became the proof.)
 *
 * F-R9 FIXED A FALSE ACCEPTANCE AND INTRODUCED A FALSE REFUSAL — A-G494 with the polarity reversed, inside
 * the repair for A-G494. An identity claim must name what every clone of the repository holds on every
 * branch, and there is exactly one such object: the ROOT COMMIT, where the repository began. It cannot be
 * forged by `git init` + `touch` either, so nothing of F-R9's strength is given up.
 *
 * test/integration-boundary/instrument-portability.test.ts now holds this as an invariant over every
 * tracked instrument, deriving the root commit from the repository rather than hardcoding it — so the next
 * instrument that anchors on a branch-local commit goes red instead of refusing a real checkout in silence.
 */
const IDENTITY_COMMIT = "29266f9c4958d75ac7261e3748e71df12d50b8e4"; // this repository's root commit, in all 124 refs
if (!existsSync(resolve(REPO_ROOT, ".git")))
  throw new Error(`REFUSE gelb-paths: derived REPO_ROOT ${REPO_ROOT} holds no .git — refusing to read a tree ` +
    `that is not a checkout of this repository rather than reporting a measurement taken from one.`);

/**
 * F-G11 (GRUEN, 2026-11-16) — AGAINST F-R13, WHICH WAS MY CORRECTION OF F-R9. VERIFIED BY ME.
 *
 * TWO SEPARATE FAULTS, AND THE FIRST IS IN MY REASONING RATHER THAN IN THE CODE.
 *
 * 1. *** THE SCENARIO F-R13 NAMED CANNOT EXHIBIT THE DEFECT. *** I wrote that a `clone --single-branch
 *    --branch main` refuses a genuine checkout. Measured: `main` carries ZERO paths under
 *    `evidence/mapping-phase-g-gelb`, so THIS MODULE IS NOT IN THAT CLONE AT ALL and the guard never runs.
 *    The conclusion was right and the reason was unreachable — the same shape as the four relayed figures
 *    PINK caught in this record, arrived at while correcting one of them.
 *
 * 2. *** AND THE CASE THAT IS REACHABLE DEFEATS THE ANCHOR I MOVED TO. *** In a SHALLOW clone of a branch
 *    that DOES carry this module, both the phase-G base AND the root commit are absent (measured:
 *    `--depth 1 --single-branch` of this branch, `rev-list --count HEAD` = 1, both objects ABSENT). So
 *    re-anchoring alone replaced one false *"this is not this repository"* with another carrying a
 *    different sha. The root commit is still the better anchor — it is reachable from `main`, which the
 *    phase-G base is not — but it is not the repair.
 *
 * THE REPAIR IS A SIGN, NOT AN ANCHOR (A-G468). A shallow clone cannot ANSWER the identity question; it is
 * not a wrong answer. `cannot establish` and `is wrong` are different verdicts and only one of them is true
 * here, so shallowness is detected FIRST and named separately, with the remedy this repository already
 * uses for exactly this case (`ERR_PHASE_C_BASE_MISSING` in test/career/mapping-field/phase-base.ts).
 * GRUEN reached the same construction independently in `gruen-paths.mjs` and proved it end to end.
 */
/**
 * AND A THIRD FAULT, PINK'S, FOUND IN PINK'S OWN F-R13 FIX AND TRUE OF MINE AS WRITTEN.
 *
 * *** EVERY `try { git … } catch { refuse }` IN THIS FILE CONFLATED "GIT ANSWERED NO" WITH "GIT COULD NOT BE
 * ASKED". *** With no `git` on `PATH`, `execFileSync` throws `ENOENT` and the catch declared a genuine
 * checkout to be "a checkout of SOMETHING ELSE" — a false verdict carrying a confident diagnosis, which is
 * more harmful than a missed one. PINK hit exactly this in its own repair, one section after criticising the
 * shape in my lane, and stated the rule:
 *
 *   *** A GUARD MAY REFUSE ON A NEGATIVE ANSWER AND MUST NEVER REFUSE ON A MISSING ONE.
 *       AN UNANSWERABLE QUESTION IS NOT A FAILED TEST. ***
 *
 * So the probe is three-valued. `VERIFIED` / `REFUSED` / `UNVERIFIABLE`, distinguished by WHY git failed:
 * a non-zero exit is an answer, a spawn failure is not.
 *
 * WHERE I DIVERGE FROM PINK, WITH THE GROUND, SINCE PINK HOLDS VALIDATION AUTHORITY AND MAY OVERRULE THIS:
 * PINK's form lets `UNVERIFIABLE` continue. This module still REFUSES on it — because its entire purpose is
 * to stop a reading being taken from a tree that is not this repository (A-G494), and continuing with the
 * identity unestablished reinstates precisely that defect. What PINK is right about is the VERDICT, not the
 * refusal: the message must say "cannot establish" and name the remedy, never "wrong repository". Three
 * refusals, three distinct causes, no two wearing each other's words.
 */
function probeGit(args) {
  try { execFileSync("git", args, { stdio: ["ignore", "pipe", "ignore"] }); return "VERIFIED"; }
  catch (error) {
    if (error.code === "ENOENT" || error.code === "EACCES" || error.status === undefined) return "UNVERIFIABLE";
    return "REFUSED";
  }
}

const shallowProbe = (() => {
  try { return { state: "VERIFIED", shallow: execFileSync("git", ["-C", REPO_ROOT, "rev-parse", "--is-shallow-repository"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim() === "true" }; }
  catch (error) {
    if (error.code === "ENOENT" || error.code === "EACCES" || error.status === undefined) return { state: "UNVERIFIABLE", shallow: false };
    return { state: "VERIFIED", shallow: false };
  }
})();
if (shallowProbe.state === "UNVERIFIABLE")
  throw new Error(`REFUSE gelb-paths: CANNOT ESTABLISH whether ${REPO_ROOT} is a checkout of this repository — ` +
    `\`git\` could not be run at all (no git on PATH, or not executable). *** THIS IS NOT A VERDICT THAT THE ` +
    `TREE IS WRONG: THE QUESTION WAS UNANSWERABLE, NOT ANSWERED NO (PINK's rule, errata §11.1). *** Install ` +
    `git, or run this instrument where git is available.`);
if (shallowProbe.shallow)
  throw new Error(`REFUSE gelb-paths: CANNOT ESTABLISH whether ${REPO_ROOT} is a checkout of this repository — ` +
    `it is a SHALLOW clone, so the identity commit ${IDENTITY_COMMIT.slice(0, 8)} is absent whether or not this ` +
    `is the right repository. This is "cannot establish", NOT "wrong repository" (A-G468, F-G11). Fetch the ` +
    `history (\`git fetch --unshallow\`) and run again — the same remedy as ERR_PHASE_C_BASE_MISSING.`);
if (probeGit(["-C", REPO_ROOT, "cat-file", "-e", `${IDENTITY_COMMIT}^{commit}`]) === "REFUSED") {
  throw new Error(`REFUSE gelb-paths: ${REPO_ROOT} is a git checkout but NOT of this repository — it does not hold ` +
    `the root commit ${IDENTITY_COMMIT.slice(0, 8)}. A .git alone proves only that something is version-controlled ` +
    `(F-R9). Shallowness is ruled out above and reported separately, so this verdict really is "wrong ` +
    `repository" and not "cannot establish" (F-G11).`);
}
for (const [n, p] of [["PHASE_G", PHASE_G], ["PHASE_F", PHASE_F]]) {
  if (!existsSync(p)) throw new Error(`REFUSE gelb-paths: ${n} not at the derived ${p}`);
  if (probeGit(["-C", REPO_ROOT, "ls-files", "--error-unmatch", p]) === "REFUSED")
    throw new Error(`REFUSE gelb-paths: ${n} exists at ${p} but is NOT git-tracked here — existsSync is satisfied by touch (F-R9).`);
}

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
