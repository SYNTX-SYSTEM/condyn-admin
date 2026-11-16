/**
 * PINK · TOOL AND PATH RESOLUTION — the discharge of D-PP-3
 *
 * WHY THIS EXISTS, MEASURED RATHER THAN ASSERTED. 83 PINK instruments live under
 * mapping-phase-{e,f,g}-contract/scripts/. Every one of the 75 `.mjs` among them declared
 *
 *     import { chromium } from "/home/codi/Entwicklung/nquiry/node_modules/playwright/index.mjs";
 *
 * and 48 of those also declared an absolute `sharp`. `/home/codi/Entwicklung/nquiry` is a DIFFERENT
 * REPOSITORY (git@github.com:SYNTX-SYSTEM/NQUIRY.git) that this repository's `origin` does not contain.
 * 123 tool imports in total (75 playwright + 28 visual-g sharp + 20 visual-e sharp), counted here with
 * `git grep -c` and not taken from a brief.
 *
 * *** THE SHAPE THAT MAKES THIS WORSE THAN A BROKEN PATH: every hardcoded target EXISTS on the machine
 * that wrote it, so every instrument SUCCEEDS there and fails everywhere else. A fresh checkout ON THIS
 * SAME MACHINE therefore cannot detect it at all. *** That is A-G469's filesystem clause in its literal
 * form, and it is the same shape GELB recorded for its own 14 of 26 instruments in gelb-paths.mjs, which
 * is this module's stylistic precedent.
 *
 * ---------------------------------------------------------------------------------------------------
 * THE RESOLUTION ORDER, AND WHY THE LAST STEP IS A THROW AND NOT A FALLBACK
 *
 *   1. bare `await import("playwright")` / `await import("sharp")` — normal node resolution from the
 *      repository's own node_modules. THIS IS THE ONLY RECONSTRUCTIBLE PATH. It became real for
 *      `playwright` when 1.63.0 was declared as an exact devDependency (integration commit 430741fc,
 *      read at that ref, not taken on report). `sharp` 0.34.5 ALREADY resolved bare before that commit,
 *      because it arrives transitively under next@16.2.4 — so for sharp the declaration is version
 *      pinning, not a resolution repair.
 *   2. an explicit environment override — PINK_PLAYWRIGHT / PINK_SHARP — so another machine can point at
 *      its own copy without editing an instrument.
 *   3. the DOCUMENTED machine-local fallbacks below, each one named with the reason it exists.
 *   4. *** THROW, LISTING EVERY CANDIDATE TRIED. ***
 *
 * *** THIS MODULE NEVER FALLS BACK TO SOMETHING THAT MERELY IMPORTS. *** A wrong module that reports is
 * worse than no module: a different `sharp` ABI or a different Chromium build still produces numbers, and
 * those numbers would be filed as measurements of this build. Refusing is a result; a silent substitution
 * is a fabricated one. The same reasoning governs the roots below — a derived root that lands outside this
 * repository refuses rather than reading a neighbouring worktree and calling the result a measurement.
 *
 * ---------------------------------------------------------------------------------------------------
 * SCOPE, STATED SO IT IS NOT OVERREAD. This module repairs TOOL AND PATH RESOLUTION ONLY. It does not
 * make an instrument's FIGURES portable: those are bound to one stand, one build, one raster backend and
 * one viewport, exactly as PINK-SYSTEM-VALIDATION.md §1 bounds them. An instrument that resolves
 * everywhere and is pointed at a different build measures that different build.
 */
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { existsSync } from "node:fs";
import { execFileSync as execFileSync_ } from "node:child_process";

const HERE = dirname(fileURLToPath(import.meta.url));

/** <repo>/docs/architecture/decision-fields/evidence/mapping-phase-pink-tools -> <repo> */
export const REPO_ROOT = resolve(HERE, "../../../../..");
/** -> <repo>/docs/architecture/decision-fields */
export const RECORD_DIR = resolve(HERE, "../..");
/** -> <repo>/docs/architecture/decision-fields/evidence */
export const EVIDENCE_DIR = resolve(HERE, "..");

/**
 * REFUSE AT IMPORT if the derived root is not a checkout of THIS repository. `.git` alone is too weak a
 * test — any checkout of anything satisfies it — so a repository-identifying path is required as well.
 * In a worktree `.git` is a FILE rather than a directory; existsSync accepts both, deliberately.
 */
if (!existsSync(resolve(REPO_ROOT, ".git")))
  throw new Error(`REFUSE pink-tools: derived REPO_ROOT ${REPO_ROOT} holds no .git — refusing to read a tree ` +
    `that is not a checkout of this repository rather than reporting a measurement taken from one.`);

/**
 * *** REPOSITORY IDENTITY, RE-ANCHORED 2026-11-16 ON GELB'S F-R13 — AND MY ANCHOR WAS WORSE THAN THE ONE
 * F-R13 FIXED, NOT BETTER. ***
 *
 * GELB asked which commit this module names, because `gelb-paths.mjs` had pinned identity on PHASE_G's base
 * commit — present in 7 of 124 refs and NOT an ancestor of `main` — so it refused a genuine
 * `clone --branch main`. I named NO commit at all: identity rested on the existence of the PATH
 * `docs/architecture/decision-fields`. Measured, rather than argued:
 *
 *   - that path exists on only **53 of 61** origin refs, so a genuine checkout of 8 named branches
 *     (architecture/target-revision-runtime, capability-mapping, feature/pdf-generator, feature/topology-view,
 *     frontend/hr-decision-loop, frontend/sil-decision-integration, tooling/decision-core-phase-gate,
 *     wip/field-01-overlay-2026-09-22) was FALSELY REFUSED. Same harm as F-R13, different cause.
 *   - and a path test is FORGEABLE: `git init && mkdir -p docs/architecture/decision-fields` passes it.
 *     A commit sha cannot be fabricated.
 *
 * So the root commit `29266f9c` is adopted here: measured as the root of `origin/main` and an ancestor of
 * **61 of 61** origin refs. GELB's fix is strictly better than what I had on both coverage and forgeability,
 * and saying so is the correct outcome.
 *
 * SHALLOW CLONES DO NOT HOLD THE ROOT COMMIT, so a hard refusal there would re-create F-R13's false refusal
 * one layer out. A repository that cannot answer the ancestry question is DOWNGRADED to the old path test and
 * says so, rather than being refused or silently accepted.
 */
export const REPO_ROOT_COMMIT = "29266f9c4958d75ac7261e3748e71df12d50b8e4";
export const repoIdentity = (() => {
  let shallow = false;
  try { shallow = execFileSync_("git", ["-C", REPO_ROOT, "rev-parse", "--is-shallow-repository"], { encoding: "utf8" }).trim() === "true"; } catch { /* no git */ }
  try {
    execFileSync_("git", ["-C", REPO_ROOT, "merge-base", "--is-ancestor", REPO_ROOT_COMMIT, "HEAD"], { stdio: "ignore" });
    return { verified: true, by: `root commit ${REPO_ROOT_COMMIT.slice(0, 8)} is an ancestor of HEAD`, shallow };
  } catch {
    if (shallow) return { verified: false, by: "shallow clone — root commit absent; downgraded to the path test", shallow };
    return { verified: false, by: "root commit is NOT an ancestor of HEAD", shallow };
  }
})();
if (!repoIdentity.verified && !repoIdentity.shallow)
  throw new Error(`REFUSE pink-tools: derived REPO_ROOT ${REPO_ROOT} is a git checkout, but the root commit ` +
    `${REPO_ROOT_COMMIT.slice(0, 8)} of this repository is not an ancestor of its HEAD — so it is a checkout of ` +
    `SOMETHING ELSE. Refusing rather than reporting a measurement taken from a tree that is not this repository.`);
if (!existsSync(RECORD_DIR))
  throw new Error(`REFUSE pink-tools: derived RECORD_DIR ${RECORD_DIR} is absent — the derived root ${REPO_ROOT} ` +
    `is a git checkout but does not carry this lane's record directory.`);

/** the phase contract directories, by name rather than by offset (A-G427) */
export const PHASE_E_DIR = resolve(EVIDENCE_DIR, "mapping-phase-e-contract");
export const PHASE_F_DIR = resolve(EVIDENCE_DIR, "mapping-phase-f-contract");
export const PHASE_G_DIR = resolve(EVIDENCE_DIR, "mapping-phase-g-contract");

/**
 * WHERE AN INSTRUMENT WRITES ITS SCRATCH OUTPUT.
 *
 * Nine instruments hardcoded a path under
 *   /tmp/claude-1000/-home-codi-Entwicklung/a060e5e1-.../scratchpad/phase-e/
 * which is a DEAD SESSION's scratchpad: that session id no longer exists, so unlike the tool paths above
 * these resolve NOWHERE, not even on this machine. They are therefore a declared, overridable input here
 * rather than a silent `mkdirSync` into a directory nobody will look in. No default points into a session
 * scratchpad: PINK_OUT must be set, or the instrument writes beside the current working directory, which
 * is at least visible to whoever launched it.
 */
export const OUT_DIR = process.env.PINK_OUT ?? resolve(process.cwd(), "pink-out");

/**
 * THE STAND. Hardcoded in 6 of the 37 phase-g instruments and in all 36 phase-e/phase-f instruments, so
 * it is named here too. This is NOT a machine-absolute path and was not part of D-PP-3; it is included
 * because a port that cannot be overridden is the same reconstructibility defect one layer out.
 */
export const BASE = process.env.PINK_BASE ?? "http://127.0.0.1:3122";

/** Shared by both resolvers so the two cannot drift apart. */
async function resolveTool({ name, bare, envVars, fallbacks, pick }) {
  const tried = [];

  // 1 — normal node resolution. The only reconstructible path.
  try { return pick(await import(bare)); }
  catch (e) { tried.push(`bare import("${bare}") — ${e?.code ?? e?.message ?? e}`); }

  // 2 — explicit environment override, for a machine that keeps its copy elsewhere.
  //
  // TWO NAMES, AND THE SECOND IS NOT NEW. 62 of the 123 sites were ALREADY overridable —
  // 35 playwright sites read CONDYN_PLAYWRIGHT_MODULE and 27 sharp sites read CONDYN_SHARP_MODULE,
  // each with a machine-absolute DEFAULT. So those 62 were never unconditionally hardcoded, and only
  // 61 (40 playwright + 21 sharp) had no escape hatch at all. The pre-existing name is honoured here
  // so that a machine already configured for these instruments keeps working without being re-taught.
  for (const v of envVars) {
    const override = process.env[v];
    if (!override) { tried.push(`${v} — not set`); continue; }
    try { return pick(await import(override)); }
    catch (e) { tried.push(`${v}=${override} — ${e?.code ?? e?.message ?? e}`); }
  }

  // 3 — the documented machine-local fallbacks.
  for (const { path, why } of fallbacks) {
    if (!existsSync(path)) { tried.push(`machine-local fallback ${path} — absent (${why})`); continue; }
    try { return pick(await import(path)); }
    catch (e) { tried.push(`machine-local fallback ${path} — ${e?.code ?? e?.message ?? e} (${why})`); }
  }

  // 4 — THROW. Never a substitute that merely imports.
  throw new Error(
    `REFUSE pink-tools: could not resolve ${name}. Candidates tried, in order:\n` +
    tried.map(t => `  - ${t}`).join("\n") +
    `\nSet ${envVars[0]} to a ${name} entry point, or install it: it is declared as an exact devDependency ` +
    `(playwright 1.63.0, sharp 0.34.5) from integration commit 430741fc, so \`npm ci\` supplies it.\n` +
    `REFUSING rather than substituting another build: a different ${name} still produces numbers, and ` +
    `those numbers would be filed as measurements of this one.`);
}

/**
 * MACHINE-LOCAL FALLBACKS, each named with why it exists. All three are on ONE machine and are the reason
 * the original defect was undetectable from a fresh checkout here. They are kept so that an instrument
 * still runs on that machine before `npm ci` has supplied the declared dependency — and for no other
 * reason. Their presence is not a licence to leave the dependency undeclared.
 */
const PLAYWRIGHT_FALLBACKS = [
  { path: "/home/codi/Entwicklung/nquiry/node_modules/playwright/index.mjs",
    why: "the original hardcoded target of all 75 instruments; a DIFFERENT repository (SYNTX-SYSTEM/NQUIRY) " +
         "that this origin does not contain — playwright 1.63.0, browser cache ~/.cache/ms-playwright/chromium-1243" },
];

const SHARP_FALLBACKS = [
  { path: "/home/codi/Entwicklung/condyn-admin-pink-visual-g/node_modules/sharp/lib/index.js",
    why: "PINK's phase-g visual worktree, the target of 28 instruments — sharp 0.34.5" },
  { path: "/home/codi/Entwicklung/condyn-admin-pink-visual-e/node_modules/sharp/lib/index.js",
    why: "PINK's phase-e visual worktree, the target of 20 instruments — sharp 0.34.5, same version" },
];

/** Playwright's `chromium` launcher. Throws rather than substituting another Chromium. */
export async function playwright() {
  return resolveTool({
    name: "playwright", bare: "playwright", envVars: ["PINK_PLAYWRIGHT", "CONDYN_PLAYWRIGHT_MODULE"],
    fallbacks: PLAYWRIGHT_FALLBACKS,
    pick: m => { const c = (m?.chromium ?? m?.default?.chromium); if (!c) throw new Error("module exports no `chromium`"); return c; },
  });
}

/** `sharp`, the raw-RGBA reader every pixel figure passes through. */
export async function sharpModule() {
  return resolveTool({
    name: "sharp", bare: "sharp", envVars: ["PINK_SHARP", "CONDYN_SHARP_MODULE"],
    fallbacks: SHARP_FALLBACKS,
    pick: m => { const s = (m?.default ?? m); if (typeof s !== "function") throw new Error("module default export is not callable"); return s; },
  });
}

/** Both at once, for the 48 instruments that need them together. */
export async function tools() {
  return { chromium: await playwright(), sharp: await sharpModule() };
}

/**
 * ---------------------------------------------------------------------------------------------------
 * PROVENANCE — THE SECOND HALF OF D-PP-3, AND WHY IT NEEDED A MECHANISM BUILT RATHER THAN COPIED
 *
 * *** THE PREMISE I WAS HANDED WAS FALSE, AND I MEASURED IT BEFORE BUILDING ON IT. *** The brief states
 * that "60 of 80 instruments hardcode a commit literal" against "27 that read `buildId` from the running
 * stand", and that those 27 "already demonstrate the shape". Measured over all 83 instruments here:
 *
 *   - 66 of 83 embed a hex literal that `git cat-file -t` resolves to a commit (10 distinct refs).
 *     The quoted 60 is the count of files holding ANY 7-40 hex string literal, which also catches
 *     `9e3779b9` (the golden-ratio hash constant), `00000000`, and fragments of the dead session UUID.
 *   - 27 mention `buildId` — and ALL 27 of those ALSO embed a commit literal. The two sets are not
 *     opposed; the smaller is a subset of the larger.
 *   - *** ALL 27 HARDCODE buildId AS A STRING LITERAL — the same one, `"xCD8LBxdjnP97-2Gjs5yr"`. ***
 *     NOT ONE instrument of the 83 reads a build identity from a running stand by any mechanism:
 *     `__NEXT_DATA__` 0 files, `buildManifest` 0, `/_next/static` 0, `page.evaluate` of buildId 0.
 *
 * So there was no demonstrated shape in the tree to generalise. This module supplies one.
 *
 * WHAT THE DEFECT ACTUALLY IS. A hardcoded commit label is not wrong where it stands: `3ec8457d` IS the
 * build the sealed figures were taken on, and deleting it would destroy the provenance of 66 instruments'
 * results. The defect is that the label is EMITTED UNCONDITIONALLY. Re-run the instrument on any other
 * build and it still writes `commit: "3ec8457d"` into its output — and, as the brief puts it correctly,
 * a wrong path fails loudly elsewhere while a wrong commit label is filed as evidence.
 *
 * THEREFORE: declared and observed, both, with their agreement as a field. The declared literal is kept
 * (it is the provenance of the original measurement); the observed identity is read at run time; and a
 * disagreement is stated in the artefact and shouted on stderr. `PINK_PROVENANCE=strict` makes it fatal.
 * This cannot be verified against the build the seal was taken on — that stand does not exist now — so
 * what is proven here is the DETECTION, exercised in the only direction currently available: a run on a
 * build that is NOT the declared one must report disagreement rather than re-emitting the label.
 */
import { execFileSync } from "node:child_process";
import { readFileSync as _readFileSync } from "node:fs";

/** The commit this checkout is actually on. null rather than a guess if git cannot answer. */
export function observedCommit() {
  try {
    const full = execFileSync("git", ["-C", REPO_ROOT, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
    return /^[0-9a-f]{40}$/.test(full) ? { full, short: full.slice(0, 8) } : null;
  } catch { return null; }
}

/**
 * The build identity of the stand actually answering, in the order that makes it an OBSERVATION.
 * PINK_BUILD_ID is an explicit declaration by whoever launched the run and is honoured first; after it,
 * only things read off a live stand or a real build directory count. Never a default.
 */
export async function observedBuildId({ base = BASE, timeoutMs = 2500 } = {}) {
  if (process.env.PINK_BUILD_ID) return { value: process.env.PINK_BUILD_ID, from: "PINK_BUILD_ID" };
  try {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), timeoutMs);
    const r = await fetch(base, { signal: ac.signal });
    clearTimeout(t);
    const html = await r.text();
    const m = html.match(/\/_next\/static\/([A-Za-z0-9_-]{8,})\//);
    if (m) return { value: m[1], from: `stand ${base} /_next/static/<id>/` };
    const nd = html.match(/"buildId"\s*:\s*"([A-Za-z0-9_-]+)"/);
    if (nd) return { value: nd[1], from: `stand ${base} __NEXT_DATA__.buildId` };
    return { value: null, from: `stand ${base} answered but carried no build id` };
  } catch (e) {
    try {
      return { value: _readFileSync(resolve(REPO_ROOT, ".next/BUILD_ID"), "utf8").trim(), from: "<repo>/.next/BUILD_ID" };
    } catch {
      return { value: null, from: `unobservable — stand ${base}: ${e?.code ?? e?.name ?? e}; no <repo>/.next/BUILD_ID` };
    }
  }
}

/**
 * The provenance block an instrument should emit INSTEAD of a bare literal pair.
 * Returns the declared values unchanged, the observed values beside them, and `agrees`.
 */
export async function provenance({ declaredCommit = null, declaredBuildId = null, base = BASE } = {}) {
  const oc = observedCommit();
  const ob = await observedBuildId({ base });
  const commitAgrees = declaredCommit == null || oc == null ? null
    : (oc.full.startsWith(declaredCommit) || declaredCommit.startsWith(oc.short));
  const buildIdAgrees = declaredBuildId == null || ob.value == null ? null : ob.value === declaredBuildId;
  const block = {
    declaredCommit, observedCommit: oc ? oc.short : null, observedCommitFull: oc ? oc.full : null, commitAgrees,
    declaredBuildId, observedBuildId: ob.value, observedBuildIdFrom: ob.from, buildIdAgrees,
    agrees: commitAgrees === true && (buildIdAgrees === true || buildIdAgrees === null),
    note: "declared = the label the sealed instrument was written with; observed = read at run time. " +
          "A figure taken on a run where agrees !== true belongs to the OBSERVED build, not the declared one.",
    // *** THE LIMIT OF THIS BLOCK, STATED IN IT RATHER THAN DISCOVERED LATER. ***
    // Found by running a repaired instrument against a stand this lane did not start: `observedCommit`
    // is `git rev-parse HEAD` of the CHECKOUT the instrument ran from. For an instrument that measures a
    // REMOTE STAND those two are independent, and the checkout's commit says nothing about the build the
    // stand serves. So replacing a stale hardcoded label with the checkout's commit removes the silent
    // fabrication but does NOT by itself establish the provenance of a stand measurement: for that, the
    // only authority is `observedBuildId`, and when that is null the run has NO verified provenance at all.
    observedCommitDescribes: "the checkout the instrument ran from — NOT the build a remote stand serves",
    authoritativeForStandMeasurements: "observedBuildId",
    standProvenanceVerified: ob.value != null,
  };
  const bad = commitAgrees === false || buildIdAgrees === false;
  const unk = commitAgrees === null || buildIdAgrees === null;
  if (bad || unk) {
    console.error(`*** PINK PROVENANCE ${bad ? "MISMATCH" : "UNVERIFIED"} ***\n` +
      `    commit   declared ${declaredCommit ?? "(none)"}  observed ${oc ? oc.short : "(unreadable)"}  agrees ${commitAgrees}\n` +
      `    buildId  declared ${declaredBuildId ?? "(none)"}  observed ${ob.value ?? "(unobservable)"}  (${ob.from})  agrees ${buildIdAgrees}\n` +
      `    Any figure from this run is a measurement of the OBSERVED build. Do not file it under the declared label.`);
    if (bad && process.env.PINK_PROVENANCE === "strict")
      throw new Error("REFUSE pink-tools: PINK_PROVENANCE=strict and the observed build is not the declared one.");
  }
  return block;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("PINK · pink-tools.mjs — resolved, not declared");
  console.log(`  REPO_ROOT    ${REPO_ROOT}`);
  console.log(`  RECORD_DIR   ${RECORD_DIR}`);
  console.log(`  PHASE_G_DIR  ${PHASE_G_DIR}`);
  console.log(`  OUT_DIR      ${OUT_DIR}   (PINK_OUT ${process.env.PINK_OUT ? "set" : "unset"})`);
  console.log(`  BASE         ${BASE}`);
  for (const [n, f] of [["playwright", playwright], ["sharp", sharpModule]]) {
    try { await f(); console.log(`  ${n.padEnd(12)} RESOLVED`); }
    catch (e) { console.log(`  ${n.padEnd(12)} REFUSED\n${String(e.message).split("\n").map(l => "      " + l).join("\n")}`); }
  }
}
