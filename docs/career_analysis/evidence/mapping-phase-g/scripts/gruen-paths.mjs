/**
 * GRÜN · PATH AND TOOL DERIVATION — the repair of this lane's four non-reconstructible instruments.
 *
 * MEASURED BEFORE: of 53 files in this lane's scripts/ directory, 4 carried a machine-absolute path —
 * gruen-pg16-crowding-L1.mjs (an input AND an output), gruen-rank5-check.mjs (an absolute `import`),
 * run-all.sh (GRUEN_WT) and this module's sibling gruen-provenance.mjs (CANONICAL_EVIDENCE_ROOT, PW_MODULE).
 * The shape is GELB's A-G469 and their gelb-paths.mjs is the precedent this module follows deliberately:
 *
 *   *** THE PATH STILL RESOLVES ON THE MACHINE THAT WROTE IT, SO THE INSTRUMENT SUCCEEDS THERE WHILE
 *       READING THE ORIGINAL WORKTREE RATHER THAN THE CHECKOUT IT WAS LAUNCHED FROM. ***
 *
 * A same-machine fresh checkout therefore cannot detect it at all. gruen-pg16-crowding-L1.mjs is the worst
 * case and the write side is the serious half: it WROTE pg16-crowding-L1.json into a named worktree at
 * 2026-11-16 04:20 regardless of where it was launched. Run from a second checkout it would have reported
 * success while depositing the reading in a tree the launching clone cannot see.
 *
 * TWO RULES, AND THE SECOND IS THE SUBTLE ONE (GELB's, adopted here without restating it as mine):
 *   1. Derive every root from this module's own location, and REFUSE if the derived root is not a checkout of
 *      THIS repository. A wrong root that reports is worse than no root: it reads a neighbouring tree and
 *      calls the result a measurement.
 *   2. A PEER LANE is reached by NAMED REF plus git object (`git -C <root> show <ref>:<path>`), never by
 *      filesystem neighbour, because substituting a derived root silently converts a peer-lane read into an
 *      own-lane read and BOTH STILL RUN. Checked rather than assumed for the one input at issue here:
 *      `docs/architecture/decision-fields/mapping-spec/layout-golden-vectors-v1.1.json` is present at this
 *      lane's own ref and is in MAP-G-ARCH's G_ENTRY, so it is an OWN-LANE read and the derived root is the
 *      correct resolution for it. No instrument repaired here reads a peer lane off disk.
 *
 * This module imports nothing local, so every instrument can depend on it without a cycle.
 */
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, relative, resolve } from "node:path";
import { existsSync, readFileSync } from "node:fs";

const HERE = dirname(fileURLToPath(import.meta.url));

/** <repo>/docs/career_analysis/evidence/mapping-phase-g/scripts -> <repo> */
export const REPO_ROOT = resolve(HERE, "../../../../..");
/** -> <repo>/docs/career_analysis/evidence/mapping-phase-g */
export const EVIDENCE_DIR = resolve(HERE, "..");
export const OUTPUTS_DIR = resolve(EVIDENCE_DIR, "outputs");
/** the product component every colour/geometry constant is READ from rather than copied (§89) */
export const COMPONENT = resolve(REPO_ROOT, "app/components/career/demo/PersonJobMappingField.tsx");
/** the layout record this lane's arithmetic instruments read; own-lane, in G_ENTRY */
export const GOLDEN_VECTORS_V11 = resolve(REPO_ROOT, "docs/architecture/decision-fields/mapping-spec/layout-golden-vectors-v1.1.json");

/**
 * "A checkout of THIS repository", not "a directory with a .git in it". A .git-only check passes in any
 * clone of anything, so the identity is pinned by a commit this repository contains and by the two paths the
 * repaired instruments actually read.
 *
 * *** §131d · F-R13 · THE ANCHOR WAS BRANCH-LOCAL, AND THE GUARD REFUSED A GENUINE CHECKOUT OF THIS VERY
 * BRANCH. REPRODUCED BEFORE IT WAS CHANGED. *** It was pinned on PHASE_G_BASE `93c47e03`, which is
 * MAP-G-ARCH's own base and is contained in **7 of this repository's 267 refs** and is **not an ancestor of
 * `main`**. In a `git clone --no-local --depth 1 --single-branch --branch frontend/mapping-phase-g` of this
 * repository — this lane's own branch, this lane's own instruments present — the object is ABSENT and every
 * build-free derivation died with *"This is not this repository, and a reading taken here would describe a
 * different product"*. A guard that refuses the thing it exists to admit is A-G494 with its polarity
 * reversed. GELB found the class on `gelb-paths.mjs`; this is the measurement on mine.
 *
 * GELB's REMEDY IS ADOPTED IN PART, AND THE PART I DECLINE IS DECLINED ON A MEASUREMENT.
 *
 *   ADOPTED · the identity moves to the repository's ROOT COMMIT `29266f9c`. Measured: contained in
 *   **all 267 refs**, an ancestor of `main`, and still unforgeable — `git init` plus `touch` cannot produce
 *   that object. It is strictly stronger than the branch-local anchor because it survives this evidence
 *   landing on a branch that does not descend from the phase-G base, which is exactly where the integration
 *   is heading.
 *
 *   DECLINED AS A SUFFICIENT FIX · GELB's stated proof was *"in a clone --single-branch --branch main the
 *   commit is ABSENT, so the guard refuses a genuine checkout"*. MEASURED: neither `gelb-paths.mjs` nor this
 *   file exists on `main` (0 paths matching `evidence/mapping-phase-g` in `origin/main`). **In that clone the
 *   instrument is absent and the guard never runs, so that scenario cannot exhibit the defect.** The
 *   conclusion is right; the given reason is not reachable.
 *
 *   AND THE CASE THAT IS REACHABLE TODAY DEFEATS BOTH ANCHORS · in the shallow clone above, `29266f9c` is
 *   **ABSENT TOO**. Moving the anchor alone would have turned a false "wrong repository" into a false
 *   "wrong repository" with a different sha in it. So shallowness is detected FIRST and named as what it is,
 *   with the remedy, matching the convention `phase-base.ts` already set with `git fetch --unshallow`.
 *
 * PHASE_G_BASE KEEPS ITS OTHER JOB. It was doing double duty as identity AND as the phase's reference point.
 * It stays the reference point and is verified only where it CAN be — a deep checkout — so a tree that has
 * the history and lacks the phase base still says so, and a shallow one is not accused of it.
 */
const REPO_ROOT_COMMIT = "29266f9c4958d75ac7261e3748e71df12d50b8e4";
const PHASE_G_BASE = "93c47e03bc01f06f34f7b9f9411ca9a1460b561d";
const hasObject = sha => {
  try {
    execFileSync("git", ["-C", REPO_ROOT, "rev-parse", "--verify", "--quiet", `${sha}^{commit}`],
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    return true;
  } catch { return false; }
};
function refuseIfNotThisRepository() {
  if (!existsSync(resolve(REPO_ROOT, ".git")))
    throw new Error(`ERR_GRUEN_ROOT_NOT_A_CHECKOUT: derived REPO_ROOT ${REPO_ROOT} holds no .git — refusing to ` +
      `read a tree that is not a checkout of this repository rather than reporting a measurement taken from one.`);
  for (const [n, p] of [["COMPONENT", COMPONENT], ["EVIDENCE_DIR", EVIDENCE_DIR]])
    if (!existsSync(p)) throw new Error(`ERR_GRUEN_ROOT_INCOMPLETE: ${n} is not at the derived ${p}.`);
  const shallow = (() => {
    try { return execFileSync("git", ["-C", REPO_ROOT, "rev-parse", "--is-shallow-repository"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim() === "true"; }
    catch { return false; }
  })();
  if (!hasObject(REPO_ROOT_COMMIT)) {
    // A-G468's sign rule: say "I could not look", with the remedy, rather than "this is the wrong repository".
    if (shallow)
      throw new Error(`ERR_GRUEN_ROOT_SHALLOW: ${REPO_ROOT} is a SHALLOW checkout, so the repository's root ` +
        `commit ${REPO_ROOT_COMMIT} is absent and this module CANNOT ESTABLISH the repository's identity — ` +
        `which is not the same as establishing that it is the wrong one. Remedy: \`git fetch --unshallow\` ` +
        `(the convention test/career/mapping-field/phase-base.ts already uses). Refusing rather than guessing.`);
    throw new Error(`ERR_GRUEN_ROOT_WRONG_REPOSITORY: the derived REPO_ROOT ${REPO_ROOT} is a git checkout with ` +
      `full history and does not contain ${REPO_ROOT_COMMIT}, this repository's root commit. This is not this ` +
      `repository, and a reading taken here would describe a different product. Refusing rather than measuring.`);
  }
  /* The phase's reference point, checked only where it can be. A deep checkout of this repository that does
     not carry MAP-G-ARCH's base is a real condition and says so under its own name; a shallow one is not
     accused of it, because the absence there carries no information. */
  if (!shallow && !hasObject(PHASE_G_BASE))
    throw new Error(`ERR_GRUEN_PHASE_G_BASE_MISSING: ${REPO_ROOT} is this repository (root commit present) but ` +
      `does not contain ${PHASE_G_BASE}, MAP-G-ARCH's phase-G base — so these readings have no reference point ` +
      `to be taken against. Remedy: fetch the branch that carries it. Refusing rather than measuring.`);
}
refuseIfNotThisRepository();

/**
 * WRITE ONLY INSIDE THE TREE THE INSTRUMENT WAS LAUNCHED FROM.
 *
 * §88 DEFECT 16 found the opposite failure: a probe run from a second worktree wrote its reading into that
 * worktree, where nothing reads it and where it collided by name with a reading from a different build
 * (`fixture-states-1920x1080.json`, two builds, one name, two trees, the newer one invisible).
 *
 * gruen-provenance.mjs answered that by asserting equality against an ABSOLUTE canonical root — which fixed
 * the scatter and introduced the machine lock: from a fresh clone the assertion throws, so the guard could
 * not run anywhere but on one machine. *** A GUARD THAT CANNOT RUN FROM A FRESH CLONE IS NOT A GUARD, IT IS
 * A MACHINE LOCK. *** The trade made here, stated plainly rather than hidden in a default:
 *
 *   - the canonical root is now the DERIVED root, so a fresh clone runs and writes into ITSELF;
 *   - `GRUEN_EVIDENCE_ROOT`, when set, is enforced as a DELIBERATE PIN and still throws on a mismatch, so
 *     the §88 scatter can be closed by anyone who wants it closed on a given machine;
 *   - every reading records `launchedFrom`, so a misplaced reading SAYS SO instead of being inferred from a
 *     filename collision. §88's symptom was two same-named files in two trees with nothing in either naming
 *     its tree. That is the part worth keeping, and it is cheaper than an absolute path.
 *
 * `outPath` additionally refuses a path that would escape the derived tree: an instrument that writes into a
 * peer worktree is a defect EVEN WHEN THE PATH HAPPENS TO BE RIGHT, because the next run on another machine
 * is the one that silently goes elsewhere.
 */
export const EVIDENCE_ROOT = (() => {
  const pinned = process.env.GRUEN_EVIDENCE_ROOT;
  if (pinned !== undefined && pinned !== "" && resolve(pinned) !== REPO_ROOT)
    throw new Error(`ERR_GRUEN_WRONG_EVIDENCE_WORKTREE: GRUEN_EVIDENCE_ROOT pins ${resolve(pinned)} but this ` +
      `probe lives in ${REPO_ROOT}. Run the pinned worktree's own copy of the script, or unset the pin to let ` +
      `the probe write into the tree it was launched from. A reading written into another worktree is invisible ` +
      `to the staleness audit and collides by name with that tree's own.`);
  return REPO_ROOT;
})();

export function outPath(name) {
  const p = resolve(OUTPUTS_DIR, name);
  if (p !== resolve(OUTPUTS_DIR, name.replace(/^(\.\.\/)+/, "")) || !p.startsWith(`${OUTPUTS_DIR}/`))
    throw new Error(`ERR_GRUEN_WRITE_ESCAPES_TREE: ${name} resolves to ${p}, outside this instrument's own ` +
      `outputs directory ${OUTPUTS_DIR}. An instrument writes only inside the tree it was launched from.`);
  return p;
}

/** every reading can name its own tree, which is what makes a misplaced one visible (§88, restated above) */
export function launchProvenance() {
  const sha = (() => {
    try { return execFileSync("git", ["-C", REPO_ROOT, "rev-parse", "--short", "HEAD"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim(); }
    catch { return null; }
  })();
  return { launchedFrom: REPO_ROOT, launchedFromHead: sha, evidenceRootPinned: process.env.GRUEN_EVIDENCE_ROOT ?? null };
}

/**
 * THE TOOL RESOLVER — and the reason this lane's visual instruments were not reconstructible from origin at
 * all. MEASURED: the repository declared NEITHER `playwright` NOR `sharp` in package.json at ANY ref
 * (`git log --all -S'"playwright"' -- package.json` returns nothing), while 47 output files in this lane name
 * `/home/codi/Entwicklung/nquiry` — a DIFFERENT repository (SYNTX-SYSTEM/NQUIRY.git) that origin does not
 * contain. README §5 already recorded this as integrity risk I-2, "one node_modules deletion in an unrelated
 * project away from rendering the proof stand unrunnable", and it was accurate.
 *
 * GELB declared both as EXACT devDependencies (playwright 1.63.0, sharp 0.34.5) at 430741fc on the
 * integration branch — verified here by reading that ref, not taken on report. That makes step 1 below a real
 * path once `npm ci` has run. It is NOT on frontend/mapping-phase-g, so on this branch step 1 resolves
 * `sharp` (present transitively under next@16.2.4) and does NOT resolve `playwright`, which lands on the
 * declared fallback. Both numbers are reported rather than one.
 *
 * ORDER, and it is the brief's contract: bare import first, then an explicit env override, then DOCUMENTED
 * machine-local fallbacks, then THROW WITH THE FULL CANDIDATE LIST. It never falls back to something that
 * merely imports: each candidate must be a readable file whose own package.json names a version, and the
 * version is returned so the reading records WHICH BUILD of the tool produced it.
 */
const FALLBACKS = {
  /* Machine-local, named here rather than buried in a default. This is the nquiry checkout README §5's I-2
     names; it holds playwright 1.63.0, the same version GELB pinned. It is a FALLBACK, not a basis: once
     430741fc's devDependency is on this branch, step 1 wins and this is never consulted. */
  playwright: ["/home/codi/Entwicklung/nquiry/node_modules/playwright/index.mjs"],
  sharp: []
};
const ENV_VAR = { playwright: "CONDYN_PLAYWRIGHT_MODULE", sharp: "CONDYN_SHARP_MODULE" };

function versionOf(file, name) {
  let dir = dirname(file);
  for (let i = 0; i < 8; i += 1) {
    const pj = resolve(dir, "package.json");
    if (existsSync(pj)) {
      try {
        const j = JSON.parse(readFileSync(pj, "utf8"));
        if (j.name === name && typeof j.version === "string") return j.version;
      } catch { /* a malformed package.json is not a version; keep walking */ }
    }
    const up = dirname(dir);
    if (up === dir) break;
    dir = up;
  }
  return null;
}

/**
 * Returns { path, version, how, candidates }. `how` is one of
 * "BARE_IMPORT" | "ENV_OVERRIDE" | "DOCUMENTED_FALLBACK", so a reading records HOW its tool was found and a
 * figure taken against an out-of-repository fallback is distinguishable from one taken against the declared
 * devDependency. Throws ERR_GRUEN_TOOL_UNRESOLVED naming every candidate tried.
 */
export function resolveToolModule(name) {
  const candidates = [];
  const env = process.env[ENV_VAR[name]];

  try {
    const url = import.meta.resolve(name);
    const p = url.startsWith("file:") ? fileURLToPath(url) : null;
    candidates.push({ how: "BARE_IMPORT", specifier: name, path: p, resolved: p !== null && existsSync(p) });
    if (p !== null && existsSync(p)) {
      const v = versionOf(p, name);
      if (v !== null) return { path: p, version: v, how: "BARE_IMPORT", candidates };
      candidates[candidates.length - 1].rejected = "resolved but no package.json names this module's version";
    }
  } catch (e) {
    candidates.push({ how: "BARE_IMPORT", specifier: name, path: null, resolved: false, error: String(e.code ?? e).slice(0, 80) });
  }

  if (env !== undefined && env !== "") {
    const ok = existsSync(env);
    candidates.push({ how: "ENV_OVERRIDE", specifier: `${ENV_VAR[name]}=${env}`, path: env, resolved: ok });
    if (ok) {
      const v = versionOf(env, name);
      if (v !== null) return { path: env, version: v, how: "ENV_OVERRIDE", candidates };
      candidates[candidates.length - 1].rejected = "file exists but no package.json names this module's version";
    }
  } else {
    candidates.push({ how: "ENV_OVERRIDE", specifier: ENV_VAR[name], path: null, resolved: false, error: "not set" });
  }

  for (const f of FALLBACKS[name]) {
    const ok = existsSync(f);
    candidates.push({ how: "DOCUMENTED_FALLBACK", specifier: f, path: f, resolved: ok });
    if (ok) {
      const v = versionOf(f, name);
      if (v !== null) return { path: f, version: v, how: "DOCUMENTED_FALLBACK", candidates };
      candidates[candidates.length - 1].rejected = "file exists but no package.json names this module's version";
    }
  }

  throw new Error(
    `ERR_GRUEN_TOOL_UNRESOLVED: ${name} could not be resolved, and this instrument will not fall back to ` +
    `something that merely imports. Candidates tried, in order:\n` +
    candidates.map(c => `  [${c.how}] ${c.specifier} -> ${c.resolved ? `${c.path} (${c.rejected ?? "accepted"})` : `UNRESOLVED (${c.error ?? "absent"})`}`).join("\n") +
    `\nFix one of: (1) install the declared devDependency — playwright 1.63.0 / sharp 0.34.5, declared at ` +
    `430741fc on the integration branch, so \`npm ci\` suffices once that reaches this branch; (2) set ` +
    `${ENV_VAR[name]} to a module file; (3) add a documented fallback to gruen-paths.mjs. A figure must not be ` +
    `produced by a tool nobody can name.`
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("GRÜN · gruen-paths.mjs — derived, not declared.  NO VERDICT (A-G36 point 2).");
  console.log(`  REPO_ROOT      ${REPO_ROOT}`);
  console.log(`  EVIDENCE_DIR   ${EVIDENCE_DIR}`);
  console.log(`  OUTPUTS_DIR    ${OUTPUTS_DIR}`);
  console.log(`  GOLDEN_VECTORS ${GOLDEN_VECTORS_V11}  ${existsSync(GOLDEN_VECTORS_V11) ? "present" : "ABSENT"}`);
  console.log(`  launch         ${JSON.stringify(launchProvenance())}`);
  for (const t of ["sharp", "playwright"]) {
    try { const r = resolveToolModule(t); console.log(`  ${t.padEnd(11)} ${r.how} ${r.version} -> ${r.path}`); }
    catch (e) { console.log(`  ${t.padEnd(11)} REFUSED, and names every candidate:\n${String(e.message).split("\n").map(l => `      ${l}`).join("\n")}`); }
  }
}

/**
 * §131c · A DERIVATION'S BUILD IS THE IDENTITY OF WHAT IT READ.
 *
 * MEASURED FIRST: 13 of the 70 files in `../outputs/` carry no build, no commit and no sha anywhere —
 * `pg14-frame-fixed.json` among them, which is PG-14's live evidence and whose headline figure (worst
 * residual 0.1068 px at a 16-character name at 420 px) is quoted in this record. A figure without its build
 * is the defect class that caused this round's worst error, and it is cheapest to close exactly where the
 * figure is a pure function of committed files.
 *
 * AND IT IS DELIBERATELY NOT A HEAD SHA, for two reasons that both cut the same way:
 *   · §119's class — a HEAD sha dates a figure by commits that did not touch it, so the figure churns and
 *     every reader must then decide whether the change was real. The blob identity of the inputs moves if
 *     and only if the figure can have moved.
 *   · the byte-for-byte reproducibility check this lane relies on (`gruen-pg16-crowding` reproducing its
 *     committed output) would be destroyed by a stamp that changes on every unrelated commit. An input-blob
 *     stamp PRESERVES it and states its precondition inside the artefact instead of in prose elsewhere.
 *
 * `lastChangedAt` is the newest commit that touched the path — a reader's anchor, redundant with the blob by
 * construction, and it is the blob that is load-bearing.
 */
export function inputFrame(derivationFile, inputPaths, extra = {}) {
  const rel = p => relative(REPO_ROOT, resolve(p));
  const hash = p => { try { return execFileSync("git", ["-c", "core.quotePath=false", "hash-object", resolve(p)], { cwd: REPO_ROOT, encoding: "utf8" }).trim(); } catch { return null; } };
  const lastChange = p => { try { return execFileSync("git", ["-c", "core.quotePath=false", "log", "-1", "--format=%h %cI", "--", rel(p)], { cwd: REPO_ROOT, encoding: "utf8" }).trim() || null; } catch { return null; } };
  const inputs = inputPaths.map(p => ({ path: rel(p), blob: hash(p), lastChangedAt: lastChange(p) }));
  const unreadable = inputs.filter(i => i.blob === null).map(i => i.path);
  if (unreadable.length > 0) throw new Error(`ERR_GRUEN_FRAME_UNIDENTIFIED: ${JSON.stringify(unreadable)} could not be hashed, so this figure cannot state what it is a function of. Refusing to emit an unframed figure.`);
  if (inputs.length === 0) throw new Error("ERR_GRUEN_FRAME_EMPTY: a frame over no input states nothing — name the files the derivation reads.");
  return {
    phase: "G",
    whatThisIs: "A DERIVATION over committed files: no render, no server, no build, no browser, no credential.",
    build: "the identity of the inputs below — NOT a HEAD sha. A HEAD sha would date this figure by commits that did not touch it (§119) and would break the byte-for-byte reproducibility check this lane relies on.",
    derivation: { path: rel(derivationFile), blob: hash(derivationFile) },
    inputs,
    ...extra
  };
}
