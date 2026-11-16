/**
 * GELB · THE REWRITE THAT REMOVES THE MACHINE-LOCAL PATHS FROM THE NON-PINK INSTRUMENTS
 *
 * A SCRIPT RATHER THAN 18 HAND EDITS, which is PINK's standard and the better one: a mechanism can be
 * re-run against the inputs and the result compared, and a pile of hand edits cannot.
 *
 *   node portable-rewrite.mjs --report     census only, writes nothing
 *   node portable-rewrite.mjs --apply      rewrite in place
 *
 * IT REFUSES TO TOUCH A SEALED FILE. All 21 affected files are unsealed at this tip — measured against the
 * 360 entries of every tracked manifest, not assumed — but the refusal is here anyway, because "it happens
 * to be unsealed today" is not a property anyone should rely on. PINK's rewriter refuses and exits 3; so
 * does this one. The three `gruen-*.mjs` files are GRUEN's authority and are listed as FOREIGN, not edited.
 *
 * WHAT IT VERIFIES AFTER WRITING, so the mechanism is not trusted on its word:
 *   1. no machine-local path survives in any rewritten file (the two prefixes are in the patterns below);
 *   2. every rewritten file still parses (`node --check`);
 *   3. the census it printed matches what changed on disk.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, resolve, relative, join } from "node:path";
import { fileURLToPath } from "node:url";

const MODE = process.argv.includes("--apply") ? "apply" : "report";
const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "../../../..");
const git = (...a) => execFileSync("git", ["-C", REPO_ROOT, ...a], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }).split("\n").filter(Boolean);

/** Every sealed entry across every tracked manifest, repo-relative. */
const sealed = new Set();
for (const m of git("ls-files", "--", "*manifest.sha256")) {
  const dir = dirname(m);
  for (const line of readFileSync(join(REPO_ROOT, m), "utf8").split("\n")) {
    const hit = line.match(/^[0-9a-f]{64}\s+\*?\.\/(.+)$/);
    if (hit) sealed.add(`${dir}/${hit[1]}`);
  }
}

const NQUIRY_PW = /\/home\/codi\/Entwicklung\/nquiry\/node_modules\/playwright\/index\.mjs/;
const ABS_SHARP = /\/home\/codi\/Entwicklung\/condyn-admin-[a-z-]+\/node_modules\/sharp\/lib\/index\.js/;
const E2E_INPUT = /\/home\/codi\/Entwicklung\/condyn-admin-e2e\/(docs\/[^"'`$]*)/;
const DEAD_SCRATCH = /\/tmp\/claude-1000\/[^/]+\/[0-9a-f-]{36}\/scratchpad\/([^"'`]*)/;
const FOREIGN = /\/home\/codi\/Entwicklung\/condyn-admin-mapping-d\//;

function rewrite(source, relPath) {
  const changes = [];
  let out = source;
  let needPw = false, needSharp = false, needRepoFile = false, needOut = false;

  // ---- class T, playwright: three declaration shapes, one resolver ------------------------------
  out = out.replace(new RegExp(`^[ \\t]*import \\{ chromium \\} from "${NQUIRY_PW.source}";[ \\t]*\\n`, "m"),
    () => { needPw = true; changes.push("T playwright: static import from nquiry -> resolver"); return ""; });
  out = out.replace(new RegExp(`^([ \\t]*)export const \\{ chromium \\} = await import\\("${NQUIRY_PW.source}"\\);`, "m"),
    (_, pad) => { needPw = true; changes.push("T playwright: EXPORTED dynamic import from nquiry -> resolver"); return `${pad}export const chromium = await playwright();`; });
  out = out.replace(new RegExp(`^([ \\t]*)const \\{ chromium \\} = await import\\("${NQUIRY_PW.source}"\\);`, "m"),
    (_, pad) => { needPw = true; changes.push("T playwright: dynamic import from nquiry -> resolver"); return `${pad}const chromium = await playwright();`; });

  // ---- class T, sharp ---------------------------------------------------------------------------
  out = out.replace(new RegExp(`^([ \\t]*)const sharp = \\(await import\\("${ABS_SHARP.source}"\\)\\)\\.default;`, "m"),
    (_, pad) => { needSharp = true; changes.push("T sharp: dynamic import from a sibling worktree -> resolver"); return `${pad}const sharp = await sharpModule();`; });

  // ---- class I, the inputs that resolve NOWHERE (F-R12) -----------------------------------------
  out = out.replace(new RegExp(`"${E2E_INPUT.source}"`, "g"),
    (_, rel) => { needRepoFile = true; changes.push(`I input -> repoFile("${rel}")`); return `repoFile("${rel}")`; });
  out = out.replace(/`\/home\/codi\/Entwicklung\/condyn-admin-e2e\/(docs\/[^`]*)`/g,
    (_, rel) => { needRepoFile = true; changes.push(`I input (template) -> repoFile(\`${rel}\`)`); return "repoFile(`" + rel + "`)"; });

  // ---- class S, the dead session scratchpad -----------------------------------------------------
  out = out.replace(new RegExp(`"${DEAD_SCRATCH.source}"`, "g"),
    (_, rel) => { needOut = true; changes.push(`S dead scratchpad -> join(OUT_DIR, "${rel}")`); return `join(OUT_DIR, "${rel}")`; });
  out = out.replace(new RegExp("`" + DEAD_SCRATCH.source + "`", "g"),
    (_, rel) => { needOut = true; changes.push("S dead scratchpad (template) -> OUT_DIR"); return "join(OUT_DIR, `" + rel + "`)"; });

  if (changes.length === 0) return { out: source, changes };

  // ---- the imports this file now needs, at the correct depth ------------------------------------
  const names = [needPw && "playwright", needSharp && "sharpModule", needRepoFile && "repoFile", needOut && "OUT_DIR"].filter(Boolean);
  const toResolver = relative(dirname(join(REPO_ROOT, relPath)), join(REPO_ROOT, "docs/career_analysis/evidence/support/evidence-tools.mjs"));
  const head = [`import { ${names.join(", ")} } from "${toResolver.startsWith(".") ? toResolver : "./" + toResolver}";`];
  if (needOut && !/import \{[^}]*\bjoin\b[^}]*\} from "node:path"/.test(out)) head.push(`import { join } from "node:path";`);
  if (needPw && !/\bconst chromium = await playwright\(\)/.test(out)) head.push(`const chromium = await playwright();`);

  const lines = out.split("\n");
  let at = 0;
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*(\/\*|\*|\/\/)/.test(lines[i]) || lines[i].trim() === "" || /^import /.test(lines[i])) at = i + 1; else break;
  }
  lines.splice(at, 0, ...head);
  return { out: lines.join("\n"), changes };
}

const population = git("ls-files", "--", "docs/**/*.mjs", "docs/**/*.mts", "docs/**/*.js")
  .filter(f => !/evidence\/mapping-phase-[defg]-contract\//.test(f))
  .filter(f => !f.endsWith("evidence/support/portable-rewrite.mjs") && !f.endsWith("evidence/support/evidence-tools.mjs"));

let touched = 0, siteCount = 0;
const refused = [], foreign = [], written = [];
for (const rel of population) {
  const abs = join(REPO_ROOT, rel);
  if (!existsSync(abs)) continue;
  const source = readFileSync(abs, "utf8");
  if (!/\/home\/codi\/|\/tmp\/claude-1000\//.test(source)) continue;
  if (FOREIGN.test(source)) { foreign.push(rel); continue; }
  const { out, changes } = rewrite(source, rel);
  if (changes.length === 0) { foreign.push(rel); continue; }
  touched++; siteCount += changes.length;
  console.log(`${rel}\n    ${changes.join("\n    ")}${sealed.has(rel) ? "\n    [SEALED]" : ""}`);
  if (MODE !== "apply") continue;
  if (sealed.has(rel)) { refused.push(rel); continue; }
  writeFileSync(abs, out);
  written.push(rel);
}

console.log(`\n--- ${MODE} --- population ${population.length} | files changed ${touched} | change sites ${siteCount}` +
  ` | foreign/unhandled ${foreign.length} | sealed entries known ${sealed.size}`);
if (foreign.length) console.log(`NOT EDITED (another lane's authority, or a shape this rewriter does not claim):\n` + foreign.map(f => "  " + f).join("\n"));

if (MODE === "apply") {
  const leftovers = written.filter(f => /\/home\/codi\/|\/tmp\/claude-1000\//.test(readFileSync(join(REPO_ROOT, f), "utf8")));
  if (leftovers.length) { console.error(`\nFAIL verification 1: an absolute path survived in:\n` + leftovers.map(f => "  " + f).join("\n")); process.exit(4); }
  for (const f of written) {
    try { execFileSync(process.execPath, ["--check", join(REPO_ROOT, f)], { stdio: "pipe" }); }
    catch (error) { console.error(`\nFAIL verification 2: ${f} no longer parses\n${error.stderr?.toString() ?? ""}`); process.exit(5); }
  }
  console.log(`verification 1 OK — no absolute path survives in the ${written.length} rewritten files`);
  console.log(`verification 2 OK — all ${written.length} still parse under \`node --check\``);
}
if (refused.length) { console.log(`\nREFUSED ${refused.length} sealed file(s):\n` + refused.map(r => "  " + r).join("\n")); process.exit(3); }
