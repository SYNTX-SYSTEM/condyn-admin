/**
 * GELB · THE RESOLVER FOR THE EVIDENCE INSTRUMENTS OUTSIDE PINK'S CONTRACT DIRECTORIES
 *
 * Population, measured at integration tip `4df69570` by `git ls-files` rather than taken from a brief:
 * **152 tracked `.mjs`/`.mts`/`.js`/`.py` instruments** under `docs/`, excluding PINK's four
 * `mapping-phase-{d,e,f,g}-contract/` directories. **21 of the 152 named a machine-absolute path.**
 * *** ALL 21 ARE UNSEALED — NOT ONE IS AN ENTRY IN ANY OF THE 360 TRACKED MANIFEST ENTRIES. *** That is
 * stated first because it is the asymmetry PINK charged me with (A-G496): PINK's 83 instruments are inside
 * a frozen seal and could not be repaired in place at all, which is why the owner gave them a new
 * separately versioned layer. Mine are flat files, so this repair costs me nothing. The cost was invisible
 * to me until PINK measured it; it is written down here so it stays visible.
 *
 * THREE CLASSES, which are not one defect and are not reported as one:
 *
 *   T  TOOL   `playwright` from `/home/codi/Entwicklung/nquiry` (13 sites) and `sharp` from
 *             `condyn-admin-job-field` (3 sites). `nquiry` is the UNDOCUMENTED SISTER REPOSITORY the
 *             mandate names. Both packages are now declared devDependencies here (playwright 1.63.0,
 *             sharp 0.34.5), so bare resolution works and the absolute path is pure liability.
 *
 *   I  INPUT  7 sites reading fixtures through `/home/codi/Entwicklung/condyn-admin-e2e/docs/examples/…`.
 *             *** THAT WORKTREE NO LONGER EXISTS ON THIS MACHINE, AND EVERY ONE OF THOSE FILES IS TRACKED
 *             IN THIS REPOSITORY AT THE IDENTICAL RELATIVE PATH `docs/examples/…`. *** So these 7 resolve
 *             NOWHERE — not even here — while the bytes they want sit in the repository that holds the
 *             instrument. This is F-R12 and it is the worst of the three, because the repair is not a
 *             workaround but a strictly better path to the same tracked bytes.
 *
 *   S  SCRATCH 7 sites under `/tmp/claude-1000/…/9dcc4453-2a41-4995-9a96-3a0c05b242a5/scratchpad/`.
 *             That session is GONE from disk (checked, not assumed). PINK found the same 12 sites in its
 *             own population and said it plainly: a dead session id is worse than a wrong tool path,
 *             because it resolves nowhere rather than wrongly. Independently, the same class, both lanes.
 *
 * RESOLUTION ORDER, and it NEVER falls back to something that merely imports:
 *   1. bare `import()` — the declared dependency;
 *   2. the documented environment override (`CONDYN_PLAYWRIGHT_MODULE` / `CONDYN_SHARP_MODULE`), kept
 *      because operators already use it and F-R8 proved the gate honours it before package resolution;
 *   3. THROW, listing every candidate tried and why it failed.
 * There is deliberately NO machine-local fallback step here. PINK's resolver has one because PINK's own
 * branch does not declare the dependencies; this integration tip does, so a fallback would only let a
 * DIFFERENT Chromium or a different `sharp` ABI produce numbers that would then be filed as measurements
 * of this build. A-G430: a figure carries its build. A silent substitution forges one.
 *
 * IDENTITY — F-R13, AND IT IS A FINDING AGAINST MY OWN F-R9 REPAIR.
 * `gelb-paths.mjs` pins this repository's identity on commit `93c47e03`, the base of PHASE_G. Measured:
 * that object is contained in **7 of 124 refs** and is **NOT an ancestor of `main`**. *** SO A LEGITIMATE
 * `git clone --branch main` OF THIS REPOSITORY DOES NOT HOLD IT, AND THE GUARD THAT STOPPED A FOREIGN
 * REPOSITORY FROM PASSING WOULD REFUSE A GENUINE CHECKOUT OF THIS ONE. *** F-R9 fixed a false ACCEPTANCE
 * and introduced a false REFUSAL — A-G494 with the polarity reversed, in the repair for A-G494.
 * The anchor here is the REPOSITORY'S ROOT COMMIT `29266f9c`: contained in all 124 refs, an ancestor of
 * `main`, and unforgeable by `git init` + `touch`. An identity claim should name what every clone of the
 * repository has, which is exactly one object: where it began.
 */
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";
import { existsSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";

const HERE = dirname(fileURLToPath(import.meta.url));
/** <repo>/docs/career_analysis/evidence/support -> <repo> */
export const REPO_ROOT = resolve(HERE, "../../../..");

/** The one object every clone of THIS repository holds, on every branch (F-R13). */
const IDENTITY_COMMIT = "29266f9c4958d75ac7261e3748e71df12d50b8e4";

if (!existsSync(resolve(REPO_ROOT, ".git")))
  throw new Error(`REFUSE evidence-tools: derived REPO_ROOT ${REPO_ROOT} holds no .git — refusing to read a tree ` +
    `that is not a checkout of this repository rather than reporting a measurement taken from one (A-G494).`);
/**
 * THREE REFUSALS, THREE CAUSES, NO TWO WEARING EACH OTHER'S WORDS — F-G11 (GRUEN) AND PINK's errata §11.1.
 *
 * `try { git … } catch { refuse }` conflates TWO different failures. PINK found it in PINK's own F-R13 fix
 * and it was true of mine as written: with no `git` on `PATH` the catch declared a genuine checkout to be
 * "a checkout of something else" — *** A FALSE VERDICT CARRYING A CONFIDENT DIAGNOSIS, WHICH IS WORSE THAN
 * A MISSED ONE. *** PINK's rule: **a guard may refuse on a negative answer and must never refuse on a
 * missing one; an unanswerable question is not a failed test.**
 *
 * And GRUEN measured the second cause: a SHALLOW clone holds no root commit either, so the anchor F-R13
 * moved to cannot answer there — it is "cannot establish", not "wrong repository" (A-G468's sign rule).
 *
 * A non-zero exit is an answer. A spawn failure is not. Each cause gets its own verdict and its own remedy.
 */
function probeGit(args) {
  try { execFileSync("git", args, { stdio: ["ignore", "pipe", "ignore"] }); return "VERIFIED"; }
  catch (error) {
    if (error.code === "ENOENT" || error.code === "EACCES" || error.status === undefined) return "UNVERIFIABLE";
    return "REFUSED";
  }
}

if (probeGit(["-C", REPO_ROOT, "rev-parse", "--git-dir"]) === "UNVERIFIABLE")
  throw new Error(`REFUSE evidence-tools: CANNOT ESTABLISH whether ${REPO_ROOT} is a checkout of this repository — ` +
    `\`git\` could not be run at all. THE QUESTION WAS UNANSWERABLE, NOT ANSWERED NO (PINK, errata §11.1). ` +
    `Install git, or run this instrument where git is available.`);

let isShallow = false;
try { isShallow = execFileSync("git", ["-C", REPO_ROOT, "rev-parse", "--is-shallow-repository"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim() === "true"; } catch { isShallow = false; }
if (isShallow)
  throw new Error(`REFUSE evidence-tools: CANNOT ESTABLISH identity — ${REPO_ROOT} is a SHALLOW clone, so the root ` +
    `commit ${IDENTITY_COMMIT.slice(0, 8)} is absent whether or not this is the right repository (F-G11). Fetch the ` +
    `history (\`git fetch --unshallow\`) — the same remedy as ERR_PHASE_C_BASE_MISSING in phase-base.ts.`);

if (probeGit(["-C", REPO_ROOT, "cat-file", "-e", `${IDENTITY_COMMIT}^{commit}`]) === "REFUSED")
  throw new Error(`REFUSE evidence-tools: ${REPO_ROOT} is a git checkout but NOT of this repository — it does not ` +
    `hold the root commit ${IDENTITY_COMMIT.slice(0, 8)}. Shallowness and an unrunnable git are both ruled out ` +
    `above, so this verdict really is "wrong repository" and not "cannot establish" (F-G11).`);

async function resolveModule(pkg, envName, pick) {
  const tried = [];
  try { return pick(await import(pkg)); }
  catch (error) { tried.push(`bare import("${pkg}") — ${error.code ?? error.message}`); }
  const override = process.env[envName];
  if (override !== undefined && override.trim() !== "") {
    try { return pick(await import(override)); }
    catch (error) { tried.push(`${envName}=${override} — ${error.code ?? error.message}`); }
  } else tried.push(`${envName} — not set`);
  throw new Error(`REFUSE evidence-tools: could not resolve ${pkg}. Candidates tried, in order:\n` +
    tried.map(t => `  - ${t}`).join("\n") +
    `\nThis resolver has NO machine-local fallback on purpose: a different ${pkg} still produces numbers, and ` +
    `those numbers would be filed as measurements of THIS build (A-G430). Install the declared dependency ` +
    `(\`npm ci\`) or point ${envName} at the one you mean.`);
}

/** The `chromium` namespace, resolved rather than declared. */
export const playwright = () => resolveModule("playwright", "CONDYN_PLAYWRIGHT_MODULE", m => (m.chromium ?? m.default?.chromium));
/** The `sharp` callable. */
export const sharpModule = () => resolveModule("sharp", "CONDYN_SHARP_MODULE", m => (m.default ?? m));

/**
 * A REPOSITORY-RELATIVE INPUT, WHICH MUST BE TRACKED HERE — F-R12's repair.
 *
 * `existsSync` is satisfied by `touch`, so presence alone is not identity (F-R9). An input the instrument
 * DEPENDS ON must be a tracked file of this repository, or the instrument is reading something a previous
 * run happened to leave behind. It refuses loudly, naming the path, rather than reading a stray file.
 */
export function repoFile(relativePath) {
  const absolute = join(REPO_ROOT, relativePath);
  if (!existsSync(absolute))
    throw new Error(`REFUSE evidence-tools: declared input ${relativePath} is absent at ${absolute}. It is a ` +
      `tracked file of this repository, so a checkout missing it is incomplete — fetch rather than substitute (F-R12).`);
  if (probeGit(["-C", REPO_ROOT, "ls-files", "--error-unmatch", relativePath]) === "REFUSED") {
    throw new Error(`REFUSE evidence-tools: ${relativePath} exists but is NOT git-tracked here — existsSync is ` +
      `satisfied by touch, and an untracked input makes the run unreproducible (F-R9's shape, F-R12's site).`);
  }
  return absolute;
}

/**
 * THE SCRATCH OUTPUT ROOT — class S's repair, and it must NEVER default into an evidence venue.
 *
 * The 7 dead-session paths wrote into a session scratchpad, which is the right KIND of place and the wrong
 * one. Defaulting them to an `evidence/` directory would be F-R10 rebuilt on purpose: a run that does not
 * name its build overwrites another build's evidence with its own measurements (A-G498). So the default is
 * a fresh directory under the OS temp root, and `CONDYN_EVIDENCE_OUT` names one deliberately.
 */
export const OUT_DIR = (() => {
  const declared = process.env.CONDYN_EVIDENCE_OUT;
  const root = declared !== undefined && declared.trim() !== "" ? resolve(declared) : join(tmpdir(), "condyn-evidence-out");
  mkdirSync(root, { recursive: true });
  return root;
})();

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("GELB · evidence-tools.mjs — derived, identity-pinned on the root commit (F-R13)");
  console.log(`  REPO_ROOT  ${REPO_ROOT}`);
  console.log(`  OUT_DIR    ${OUT_DIR}`);
  for (const [name, fn] of [["playwright", playwright], ["sharp", sharpModule]]) {
    try { const m = await fn(); console.log(`  ${name.padEnd(10)} RESOLVED${name === "playwright" ? ` (launch ${typeof m.launch})` : ` (callable ${typeof m})`}`); }
    catch (error) { console.log(`  ${name.padEnd(10)} REFUSED\n${error.message.split("\n").map(l => "      " + l).join("\n")}`); }
  }
  console.log(`  repoFile   ${repoFile("docs/examples/job-pool.sample.json")}`);
}
