/**
 * PINK · THE REWRITE THAT DISCHARGES D-PP-3, AS A MECHANISM RATHER THAN AS 83 HAND EDITS
 *
 * Rewrites every machine-absolute declaration in the 83 PINK instruments to go through pink-tools.mjs.
 * It is a SCRIPT and not a patch set because the rewrite must be re-runnable and checkable: anyone can
 * run it against the sealed inputs and compare the result, which a pile of hand edits does not allow.
 *
 * *** WHY IT DEFAULTS TO WRITING A SEPARATE TREE, AND WHY --in-place REFUSES. ***
 * All 83 instruments are listed in a frozen seal:
 *   mapping-phase-e-contract/manifest.sha256   15 of 33 entries
 *   mapping-phase-f-contract/manifest.sha256   25 of 43 entries
 *   mapping-phase-g-contract/manifest.sha256   43 of 91 entries
 * — 83 of 83, measured by this script, not assumed. Editing an instrument in place therefore makes
 * `sha256sum -c` FAIL on a seal the owner has frozen. That is a decision above this lane's authority, so
 * --in-place refuses each sealed file by name and says what it would take. The owner can lift it with
 * PINK_SEAL_OVERRIDE=i-have-owner-approval, and then the broken seals are a deliberate, recorded act
 * rather than a side effect of a repair.
 *
 * Usage:
 *   node pink-portable-rewrite.mjs --out <dir>     write the repaired generation into <dir> (default)
 *   node pink-portable-rewrite.mjs --in-place      repair the instruments where they live (refuses if sealed)
 *   node pink-portable-rewrite.mjs --report        change census only, write nothing
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { resolve, dirname, relative, join } from "node:path";
import { EVIDENCE_DIR } from "./pink-tools.mjs";

const args = process.argv.slice(2);
const MODE = args.includes("--in-place") ? "in-place" : args.includes("--report") ? "report" : "out";
const OUT = (() => { const i = args.indexOf("--out"); return i >= 0 ? resolve(args[i + 1]) : null; })();
if (MODE === "out" && !OUT) { console.error("REFUSE: --out <dir> is required in out mode (or pass --report / --in-place)"); process.exit(2); }

const PHASES = ["mapping-phase-e-contract", "mapping-phase-f-contract", "mapping-phase-g-contract"];
const RESOLVER_FROM_SCRIPTS = "../../mapping-phase-pink-tools/pink-tools.mjs";

// ---- the seal census, read from the manifests rather than taken on report -------------------------
const sealed = new Set();
for (const p of PHASES) {
  const m = join(EVIDENCE_DIR, p, "manifest.sha256");
  if (!existsSync(m)) { console.error(`REFUSE: ${p}/manifest.sha256 absent — refusing to guess whether its instruments are sealed`); process.exit(2); }
  for (const line of readFileSync(m, "utf8").split("\n")) {
    const mm = line.match(/^[0-9a-f]{64}\s+\*?\.\/(.+)$/);
    if (mm) sealed.add(join(p, mm[1]));
  }
}

// ---- the population, enumerated from disk ---------------------------------------------------------
const files = [];
for (const p of PHASES) {
  const d = join(EVIDENCE_DIR, p, "scripts");
  for (const f of readdirSync(d).sort()) files.push({ rel: join(p, "scripts", f), abs: join(d, f) });
}

// ---- the rewrites ---------------------------------------------------------------------------------
//
// FOUR VARIANTS, counted in the tree rather than taken from a brief:
//   A  40  import { chromium } from "<abs nquiry>";                                     no escape hatch
//   B  35  const PW = process.env.CONDYN_PLAYWRIGHT_MODULE ?? "<abs nquiry>";            already overridable
//   C  21  import sharp from "<abs visual-e|g>";                                         no escape hatch
//   D  27  const SHARP = process.env.CONDYN_SHARP_MODULE ?? "<abs visual-g>";            already overridable
// 123 sites in total, of which 62 (B+D) ALREADY had an environment override whose DEFAULT was
// machine-absolute, and 61 (A+C) had none. All 123 still fail on a machine without that exact path, so
// all 123 are rewritten — but the two groups are not the same defect and are not reported as one.
const PW_DIRECT  = /^[ \t]*import \{ chromium \} from "\/home\/codi\/Entwicklung\/nquiry\/node_modules\/playwright\/index\.mjs";[ \t]*\n/m;
const PW_DECL    = /^[ \t]*const PW ?= ?process\.env\.CONDYN_PLAYWRIGHT_MODULE ?\?\? ?"[^"]*";[ \t]*\n/m;
const PW_USE     = /const \{ chromium \} = await import\(PW\);[ \t]*/;
const SH_DIRECT  = /^[ \t]*import sharp from "\/home\/codi\/Entwicklung\/condyn-admin-pink-visual-[eg]\/node_modules\/sharp\/lib\/index\.js";[ \t]*\n/m;
const SH_DECL    = /^[ \t]*const SHARP ?= ?process\.env\.CONDYN_SHARP_MODULE ?\?\? ?"[^"]*";[ \t]*\n/m;
const SH_USE     = /const sharp = \(await import\(SHARP\)\)\.default;[ \t]*/;
const DEAD_STR   = /"\/tmp\/claude-1000\/-home-codi-Entwicklung\/a060e5e1-d3f6-49b1-ab41-8710c6e835d7\/scratchpad\/[^"]*"/g;
const DEAD_TPL   = /`\/tmp\/claude-1000\/-home-codi-Entwicklung\/a060e5e1-d3f6-49b1-ab41-8710c6e835d7\/scratchpad\/([^`]*)`/g;
const ABS_WT     = /"\/home\/codi\/Entwicklung\/condyn-admin-pink-visual-[eg]"/g;

function rewrite(src) {
  const changes = []; let out = src;
  let needPw = false, needSharp = false;

  if (PW_DIRECT.test(out)) { out = out.replace(PW_DIRECT, ""); needPw = true; changes.push("A playwright direct import -> resolver"); }
  if (PW_DECL.test(out))   { out = out.replace(PW_DECL, "");   needPw = true; changes.push("B CONDYN_PLAYWRIGHT_MODULE decl (abs default) -> resolver"); }
  if (PW_USE.test(out))    { out = out.replace(PW_USE, "const chromium = await playwright();"); needPw = true; }
  if (SH_DIRECT.test(out)) { out = out.replace(SH_DIRECT, ""); needSharp = true; changes.push("C sharp direct import -> resolver"); }
  if (SH_DECL.test(out))   { out = out.replace(SH_DECL, "");   needSharp = true; changes.push("D CONDYN_SHARP_MODULE decl (abs default) -> resolver"); }
  if (SH_USE.test(out))    { out = out.replace(SH_USE, "const sharp = await sharpModule();"); needSharp = true; }

  // dead-session scratchpad paths: these resolve NOWHERE, not even here, because the session is gone.
  const nDead = (out.match(DEAD_STR) ?? []).length + (out.match(DEAD_TPL) ?? []).length;
  if (nDead) {
    out = out.replace(DEAD_TPL, (_, t) => "resolve(OUT_DIR, `" + t.replace(/^phase-e\//, "") + "`)");
    out = out.replace(DEAD_STR, s0 => `resolve(OUT_DIR, ${JSON.stringify(s0.slice(1, -1).split("/scratchpad/")[1].replace(/^phase-e\//, ""))})`);
    changes.push(`${nDead} dead-session scratch path(s) -> OUT_DIR`);
  }
  const nWt = (out.match(ABS_WT) ?? []).length;
  if (nWt) {
    out = out.replace(ABS_WT, `(() => { throw new Error("REFUSE: set PINK_WT — the former default was one machine's worktree"); })()`);
    changes.push(`${nWt} absolute worktree default(s) -> refusal`);
  }

  if (!changes.length) return { out: src, changes };

  // one import of the resolver, carrying exactly the names this file now needs.
  const named = [needPw && "playwright", needSharp && "sharpModule", /\bOUT_DIR\b/.test(out) && "OUT_DIR"].filter(Boolean);
  const head = [];
  if (named.length) head.push(`import { ${named.join(", ")} } from "${RESOLVER_FROM_SCRIPTS}";`);
  if (/\bresolve\(OUT_DIR/.test(out) && !/from "node:path"/.test(out)) head.push(`import { resolve } from "node:path";`);
  const decl = [needPw && "const chromium = await playwright();", needSharp && "const sharp = await sharpModule();"].filter(Boolean)
    .filter(d => !out.includes(d));

  // insert after the file's leading block comment / existing imports, keeping the header intact.
  const lines = out.split("\n");
  let at = 0;
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*(\/\*|\*|\/\/)/.test(lines[i]) || lines[i].trim() === "" || /^import /.test(lines[i])) at = i + 1; else break;
  }
  lines.splice(at, 0, ...head, ...decl);
  return { out: lines.join("\n"), changes };
}

// ---- run ------------------------------------------------------------------------------------------
let touched = 0, totalChanges = 0, refused = [];
for (const f of files) {
  const src = readFileSync(f.abs, "utf8");
  const { out, changes } = rewrite(src, f.rel);
  if (!changes.length) continue;
  touched++; totalChanges += changes.length;
  console.log(`${f.rel}\n    ${changes.join("\n    ")}${sealed.has(f.rel) ? "\n    [SEALED]" : ""}`);
  if (MODE === "report") continue;
  if (MODE === "in-place") {
    if (sealed.has(f.rel) && process.env.PINK_SEAL_OVERRIDE !== "i-have-owner-approval") { refused.push(f.rel); continue; }
    writeFileSync(f.abs, out);
  } else {
    const dst = join(OUT, f.rel);
    mkdirSync(dirname(dst), { recursive: true });
    writeFileSync(dst, out);
  }
}

// the resolver must travel with the repaired generation, or none of it resolves.
if (MODE === "out") {
  const rdst = join(OUT, "mapping-phase-pink-tools", "pink-tools.mjs");
  mkdirSync(dirname(rdst), { recursive: true });
  writeFileSync(rdst, readFileSync(join(EVIDENCE_DIR, "mapping-phase-pink-tools", "pink-tools.mjs")));
}

console.log(`\n--- ${MODE} --- population ${files.length} | sealed ${sealed.size ? [...sealed].filter(s => s.includes("/scripts/")).length : 0} of ${files.length}` +
  ` | files changed ${touched} | change sites ${totalChanges}`);
if (refused.length) {
  console.log(`\nREFUSED ${refused.length} sealed file(s) — editing them breaks a frozen seal:\n` +
    refused.map(r => "  " + r).join("\n") +
    `\nsha256sum -c would FAIL on the owning manifest. Lift with PINK_SEAL_OVERRIDE=i-have-owner-approval` +
    ` only on the owner's word, and expect to re-seal deliberately afterwards.`);
  process.exit(3);
}
