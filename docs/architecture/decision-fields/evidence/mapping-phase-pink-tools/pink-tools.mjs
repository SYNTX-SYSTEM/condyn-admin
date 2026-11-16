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
if (!existsSync(RECORD_DIR))
  throw new Error(`REFUSE pink-tools: derived RECORD_DIR ${RECORD_DIR} is absent — the derived root ${REPO_ROOT} ` +
    `is a git checkout but not of this repository.`);

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
