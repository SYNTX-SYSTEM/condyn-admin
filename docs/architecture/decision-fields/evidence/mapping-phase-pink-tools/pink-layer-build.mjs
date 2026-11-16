/**
 * PINK · THE SEPARATELY VERSIONED PORTABLE EVIDENCE LAYER — GENERATOR
 *
 * The owner released two decisions this lane had escalated:
 *   1. "Integrate PINK's portability repair over a NEW, SEPARATELY VERSIONED evidence layer.
 *       Keep all 167 historical seal entries unchanged."
 *   2. "Connect PINK's three withdrawals by traceable forward pointers to their valid errata.
 *       Do not rewrite historical evidence."
 *
 * This script discharges (1). It is a GENERATOR and not a commit of hand-written files so that a third
 * party can re-run it against the same sealed inputs and compare the result byte for byte. `--in-place`
 * does not exist here and PINK_SEAL_OVERRIDE is not read: the sealed generation keeps its bytes.
 *
 * ---------------------------------------------------------------------------------------------------
 * *** WHY THIS LAYER CARRIES A GENERATION RECORD AND NOT ONLY A MANIFEST. ***
 *
 * A-G499, this lane's own finding: a checksum answers "is this venue internally consistent?" and NEVER
 * "does it describe the build it claims to". A freshly generated manifest verifies perfectly against its
 * own fresh content — so a new layer sealed only by its own manifest is a WELL-SEALED ORPHAN. It would
 * prove that nobody edited the layer after generation, and nothing whatsoever about whether the layer
 * derives from the frozen seal it claims to derive from.
 *
 * Therefore every output here is bound to its sealed input by THREE digests recorded per instrument:
 *   - sourceDigestFromManifest  the digest as READ FROM THE HISTORICAL MANIFEST LINE
 *   - sourceDigestRecomputed    the digest RECOMPUTED FROM DISK at generation time
 *   - outputDigest              the digest of what this script wrote
 * and *** THE LAYER REFUSES TO EMIT AT ALL IF ANY RECOMPUTED SOURCE DIGEST DIFFERS FROM ITS MANIFEST
 * LINE. *** A layer derived from drifted bytes is worse than no layer: it would look generated from the
 * seal while being generated from something else. That refusal is the only thing that makes the
 * provenance claim mean anything, so it is checked for all 83 before one output file is written.
 *
 * A reader can then check the layer TWICE: its own manifest for internal consistency, and GENERATION.json
 * for provenance against the frozen seal.
 *
 * ---------------------------------------------------------------------------------------------------
 * *** THE RESOLVER IS NOT COPIED INTO THE LAYER, AND THAT IS A MEASURED CORRECTION. ***
 *
 * The obvious construction — the one pink-portable-rewrite.mjs performs, and the one the brief assumed —
 * copies pink-tools.mjs to <layer>/mapping-phase-pink-tools/pink-tools.mjs and has the rewritten
 * instruments import "../../mapping-phase-pink-tools/pink-tools.mjs". *** THAT CONSTRUCTION CANNOT WORK
 * FOR ANY LAYER PLACED INSIDE evidence/, WHICH IS THE ONLY PLACE THIS LANE'S AUTHORITY ALLOWS. ***
 * Measured, not reasoned: pink-tools.mjs derives
 *     REPO_ROOT = resolve(dirname(import.meta.url), "../../../../..")
 * which is correct from evidence/mapping-phase-pink-tools/ and ONE LEVEL TOO SHALLOW from
 * evidence/<layer>/mapping-phase-pink-tools/. A copy placed there derives REPO_ROOT = <repo>/docs, finds
 * no .git, and THROWS AT IMPORT by its own guard — so the import specifier resolves and the module
 * refuses. Every instrument in such a layer would be dead on arrival.
 *
 * So the layer imports the ONE canonical resolver across directories:
 *     "../../../mapping-phase-pink-tools/pink-tools.mjs"
 * from <layer>/mapping-phase-X-contract/scripts/ -> evidence/mapping-phase-pink-tools/pink-tools.mjs.
 *
 * TRADE-OFF TAKEN, AND THE ONE REJECTED. Rejected: copy the resolver and pin the copy's digest equal to
 * the canonical in the generation record. That was the brief's suggested shape. It fails on two counts —
 * the copy throws at import at that depth regardless of its digest, and a digest equality recorded in a
 * file only fails loudly if something re-reads it, which is the AUTHORISED_CROSSINGS decoration failure
 * this lane has already named once. Taken: ONE copy, imported across directories. Two copies cannot drift
 * when there is one copy. The cost is that the layer is not relocatable on its own — it is valid only at
 * the depth it was generated for — so the generation record states that depth and the verifier re-derives
 * and re-checks it rather than trusting it.
 *
 * ---------------------------------------------------------------------------------------------------
 * WHAT IS REPAIRED IN THE LAYER
 *
 *   PATH / TOOL HALF of D-PP-3 — the four variants pink-portable-rewrite.mjs established, unchanged in
 *   substance: machine-absolute playwright and sharp declarations (with and without an escape hatch),
 *   dead-session scratchpad paths, and absolute worktree defaults.
 *
 *   PROVENANCE HALF of D-PP-3 — see the long note in pink-tools.mjs. Every hardcoded `commit:` and
 *   `buildId:` field becomes the OBSERVED identity, read at run time, with the declared literal retained
 *   in this layer's GENERATION.json rather than re-emitted into a fresh artefact. An artefact from this
 *   layer never asserts a build identity nobody observed: `null` is honest, a stale label is not.
 *
 *   ONE CWD-RELATIVE OUTPUT — pink-pf8-rings-retake-g.mjs wrote `outputs/PF8-RINGS-RETAKE-${LEVEL}.json`
 *   relative to the current working directory, so the same instrument writes somewhere different for
 *   every caller. It goes through OUT_DIR like the other nine.
 *
 * Usage:
 *   node pink-layer-build.mjs --out <layer dir>      generate (refuses on any input drift)
 *   node pink-layer-build.mjs --report               census only, writes nothing
 *   node pink-layer-build.mjs --verify <layer dir>   re-check an existing layer against the seal
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, rmSync } from "node:fs";
import { resolve, dirname, join, relative } from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { EVIDENCE_DIR, REPO_ROOT } from "./pink-tools.mjs";

const LAYER_VERSION = "v1";
const PHASES = ["mapping-phase-e-contract", "mapping-phase-f-contract", "mapping-phase-g-contract"];
/** <layer>/<phase>/scripts/ -> evidence/mapping-phase-pink-tools/ is THREE levels up, measured above. */
const RESOLVER_FROM_SCRIPTS = "../../../mapping-phase-pink-tools/pink-tools.mjs";
const RESOLVER_DEPTH_FROM_SCRIPTS = 3;

const args = process.argv.slice(2);
const flag = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const MODE = args.includes("--report") ? "report" : args.includes("--verify") ? "verify" : "out";
const OUT = MODE === "verify" ? resolve(flag("--verify") ?? "") : MODE === "out" ? resolve(flag("--out") ?? "") : null;
if (MODE !== "report" && !OUT) { console.error(`REFUSE: ${MODE === "verify" ? "--verify" : "--out"} <dir> is required`); process.exit(2); }

const sha = b => createHash("sha256").update(b).digest("hex");

// ---- the seal, read from the manifests themselves -------------------------------------------------
const manifestDigest = {};   // "<phase>/<relpath>" -> digest
const manifestOwnDigest = {};
let sealedEntryCount = 0;
for (const p of PHASES) {
  const mp = join(EVIDENCE_DIR, p, "manifest.sha256");
  if (!existsSync(mp)) { console.error(`REFUSE: ${p}/manifest.sha256 absent — refusing to guess what is sealed`); process.exit(2); }
  const raw = readFileSync(mp);
  manifestOwnDigest[p] = sha(raw);
  let n = 0;
  for (const line of raw.toString("utf8").split("\n")) {
    const m = line.match(/^([0-9a-f]{64})\s+\*?\.\/(.+)$/);
    if (m) { manifestDigest[join(p, m[2])] = m[1]; n++; }
  }
  manifestOwnDigest[p + ":entries"] = n;
  sealedEntryCount += n;
}

// ---- the population, enumerated from disk --------------------------------------------------------
const files = [];
for (const p of PHASES)
  for (const f of readdirSync(join(EVIDENCE_DIR, p, "scripts")).sort())
    files.push({ rel: join(p, "scripts", f), abs: join(EVIDENCE_DIR, p, "scripts", f) });

// ---- STEP 1: INPUT INTEGRITY FOR ALL 83 BEFORE ANY OUTPUT ----------------------------------------
const drift = [], unsealed = [];
for (const f of files) {
  const declared = manifestDigest[f.rel];
  const actual = sha(readFileSync(f.abs));
  f.sourceDigestFromManifest = declared ?? null;
  f.sourceDigestRecomputed = actual;
  if (!declared) unsealed.push(f.rel);
  else if (declared !== actual) drift.push({ rel: f.rel, declared, actual });
}
if (drift.length) {
  console.error(`*** REFUSING TO EMIT THE LAYER *** ${drift.length} of ${files.length} source instrument(s) do not match ` +
    `their historical manifest line. The inputs on disk are NOT the sealed inputs, and a layer derived from drifted ` +
    `bytes would claim a provenance it does not have:\n` +
    drift.map(d => `  ${d.rel}\n    manifest   ${d.declared}\n    recomputed ${d.actual}`).join("\n"));
  process.exit(4);
}

// ---- the rewrites --------------------------------------------------------------------------------
const PW_DIRECT = /^[ \t]*import \{ chromium \} from "\/home\/codi\/Entwicklung\/nquiry\/node_modules\/playwright\/index\.mjs";[ \t]*\n/m;
const PW_DECL   = /^[ \t]*const PW ?= ?process\.env\.CONDYN_PLAYWRIGHT_MODULE ?\?\? ?"[^"]*";[ \t]*\n/m;
const PW_USE    = /const \{ chromium \} = await import\(PW\);[ \t]*/;
const SH_DIRECT = /^[ \t]*import sharp from "\/home\/codi\/Entwicklung\/condyn-admin-pink-visual-[eg]\/node_modules\/sharp\/lib\/index\.js";[ \t]*\n/m;
const SH_DECL   = /^[ \t]*const SHARP ?= ?process\.env\.CONDYN_SHARP_MODULE ?\?\? ?"[^"]*";[ \t]*\n/m;
const SH_USE    = /const sharp = \(await import\(SHARP\)\)\.default;[ \t]*/;
const DEAD_STR  = /"\/tmp\/claude-1000\/-home-codi-Entwicklung\/a060e5e1-d3f6-49b1-ab41-8710c6e835d7\/scratchpad\/[^"]*"/g;
const DEAD_TPL  = /`\/tmp\/claude-1000\/-home-codi-Entwicklung\/a060e5e1-d3f6-49b1-ab41-8710c6e835d7\/scratchpad\/([^`]*)`/g;
const ABS_WT    = /"\/home\/codi\/Entwicklung\/condyn-admin-pink-visual-[eg]"/g;
const COMMIT_F  = /\bcommit\s*:\s*"([0-9a-f]{7,40})"/g;
const BUILDID_F = /\bbuildId\s*:\s*"([A-Za-z0-9_-]{8,})"/g;
const PF8_OUT   = /writeFileSync\(`outputs\/(PF8-RINGS-RETAKE-\$\{LEVEL\}\.json)`/;

function rewrite(src) {
  const changes = []; let out = src;
  let needPw = false, needSharp = false, needProv = false;
  const declaredCommits = [], declaredBuildIds = [];

  if (PW_DIRECT.test(out)) { out = out.replace(PW_DIRECT, ""); needPw = true; changes.push("A playwright direct import -> resolver"); }
  if (PW_DECL.test(out))   { out = out.replace(PW_DECL, "");   needPw = true; changes.push("B CONDYN_PLAYWRIGHT_MODULE decl (abs default) -> resolver"); }
  if (PW_USE.test(out))    { out = out.replace(PW_USE, "const chromium = await playwright();"); needPw = true; }
  if (SH_DIRECT.test(out)) { out = out.replace(SH_DIRECT, ""); needSharp = true; changes.push("C sharp direct import -> resolver"); }
  if (SH_DECL.test(out))   { out = out.replace(SH_DECL, "");   needSharp = true; changes.push("D CONDYN_SHARP_MODULE decl (abs default) -> resolver"); }
  if (SH_USE.test(out))    { out = out.replace(SH_USE, "const sharp = await sharpModule();"); needSharp = true; }

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

  // E — the cwd-relative output. The same instrument wrote to a different place for every caller.
  if (PF8_OUT.test(out)) {
    out = out.replace(PF8_OUT, (_, tail) => "writeFileSync(resolve(OUT_DIR, `" + tail + "`)");
    changes.push("E cwd-relative outputs/ write -> OUT_DIR");
  }

  // F — PROVENANCE. The emitted label becomes the OBSERVED identity; the declared literal is kept in
  // GENERATION.json. An artefact must not assert a build identity nobody observed on this run.
  const nC = (out.match(COMMIT_F) ?? []).length;
  if (nC) {
    out = out.replace(COMMIT_F, (_, hex) => { if (!declaredCommits.includes(hex)) declaredCommits.push(hex); return `commit: PINK_PROV_${hex}.observedCommit`; });
    needProv = true;
    changes.push(`F ${nC} hardcoded commit label(s) -> observed (declared ${declaredCommits.join(", ")})`);
  }
  const nB = (out.match(BUILDID_F) ?? []).length;
  if (nB) {
    out = out.replace(BUILDID_F, (_, id) => { if (!declaredBuildIds.includes(id)) declaredBuildIds.push(id); return `buildId: PINK_PROV_${declaredCommits[0] ?? "BUILD"}.observedBuildId`; });
    needProv = true;
    changes.push(`F ${nB} hardcoded buildId label(s) -> observed (declared ${declaredBuildIds.join(", ")})`);
  }

  if (!changes.length) return { out: src, changes, declaredCommits, declaredBuildIds };

  const named = [needPw && "playwright", needSharp && "sharpModule",
    /\bOUT_DIR\b/.test(out) && "OUT_DIR", needProv && "provenance"].filter(Boolean);
  const head = [];
  if (named.length) head.push(`import { ${named.join(", ")} } from "${RESOLVER_FROM_SCRIPTS}";`);
  if (/\bresolve\(OUT_DIR/.test(out) && !/from "node:path"/.test(out)) head.push(`import { resolve } from "node:path";`);
  const decl = [needPw && "const chromium = await playwright();", needSharp && "const sharp = await sharpModule();"]
    .filter(Boolean).filter(d => !out.includes(d));
  if (needProv) {
    const keys = declaredCommits.length ? declaredCommits : ["BUILD"];
    for (const [i, hex] of keys.entries())
      decl.push(`const PINK_PROV_${hex} = await provenance({ declaredCommit: ${hex === "BUILD" ? "null" : JSON.stringify(hex)}` +
        `${i === 0 && declaredBuildIds.length ? `, declaredBuildId: ${JSON.stringify(declaredBuildIds[0])}` : ""} });`);
  }

  const lines = out.split("\n");
  let at = 0;
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*(\/\*|\*|\/\/)/.test(lines[i]) || lines[i].trim() === "" || /^import /.test(lines[i])) at = i + 1; else break;
  }
  lines.splice(at, 0, ...head, ...decl);
  return { out: lines.join("\n"), changes, declaredCommits, declaredBuildIds };
}

// ---- STEP 2: generate ----------------------------------------------------------------------------
const record = [];
let touched = 0, totalChanges = 0;
for (const f of files) {
  const src = readFileSync(f.abs, "utf8");
  const { out, changes, declaredCommits, declaredBuildIds } = rewrite(src);
  const entry = {
    source: `${f.rel}`,
    sourceDigestFromManifest: f.sourceDigestFromManifest,
    sourceDigestRecomputed: f.sourceDigestRecomputed,
    sourceIntegrity: f.sourceDigestFromManifest === f.sourceDigestRecomputed ? "MATCHES SEAL" : "DRIFT",
    changeClasses: changes,
    declaredCommits, declaredBuildIds,
  };
  if (changes.length) {
    touched++; totalChanges += changes.length;
    entry.output = f.rel;
    entry.outputDigest = sha(Buffer.from(out, "utf8"));
  } else {
    entry.output = null;
    entry.outputDigest = null;
    entry.reason = "no machine-absolute, dead-path or provenance site — nothing to repair";
  }
  record.push(entry);
  if (MODE === "report") { if (changes.length) console.log(`${f.rel}\n    ${changes.join("\n    ")}`); continue; }
  if (MODE === "verify") continue;
  if (!changes.length) continue;
  const dst = join(OUT, f.rel);
  mkdirSync(dirname(dst), { recursive: true });
  writeFileSync(dst, out);
}

// ---- STEP 3: the generation record ---------------------------------------------------------------
function gitOr(fallback, ...a) { try { return execFileSync("git", ["-C", REPO_ROOT, ...a], { encoding: "utf8" }).trim(); } catch { return fallback; } }
const selfPath = new URL(import.meta.url).pathname;
const resolverPath = join(EVIDENCE_DIR, "mapping-phase-pink-tools", "pink-tools.mjs");

const generation = {
  layer: `mapping-phase-pink-portable-${LAYER_VERSION}`,
  layerVersion: LAYER_VERSION,
  what: "A separately versioned, portable regeneration of the 83 PINK instruments sealed in " +
        "mapping-phase-{e,f,g}-contract. The historical seal is unchanged; this layer is additive.",
  ownerDecision: "Integrate PINK's portability repair over a new, separately versioned evidence layer. " +
                 "Keep all 167 historical seal entries unchanged.",
  generatedAtUTC: new Date().toISOString(),
  generator: { path: relative(REPO_ROOT, selfPath), digest: sha(readFileSync(selfPath)) },
  resolver: {
    path: relative(REPO_ROOT, resolverPath),
    digest: sha(readFileSync(resolverPath)),
    copiedIntoLayer: false,
    importedAs: RESOLVER_FROM_SCRIPTS,
    depthFromLayerScripts: RESOLVER_DEPTH_FROM_SCRIPTS,
    whyNotCopied: "pink-tools.mjs derives REPO_ROOT five levels up from its own directory. A copy at " +
      "<layer>/mapping-phase-pink-tools/ is one level too deep, derives REPO_ROOT=<repo>/docs, finds no .git " +
      "and THROWS AT IMPORT by its own guard. Measured, not reasoned. One canonical copy also cannot drift.",
  },
  sourceRef: { commit: gitOr(null, "rev-parse", "HEAD"), branch: gitOr(null, "rev-parse", "--abbrev-ref", "HEAD") },
  historicalSeal: {
    totalEntries: sealedEntryCount,
    perPhase: Object.fromEntries(PHASES.map(p => [p, {
      entries: manifestOwnDigest[p + ":entries"],
      manifestDigest: manifestOwnDigest[p],
    }])),
    unchangedByThisLayer: true,
    note: "These three manifests must be byte-identical before and after generation. Their digests are " +
          "recorded here so a reader can detect a later change without consulting git.",
  },
  a_g499_clause: "A checksum answers 'is this venue internally consistent?' and never 'does it describe the " +
    "build it claims to'. This layer's own manifest.sha256 is therefore NOT evidence of provenance — it would " +
    "verify perfectly against any content generated at the same time. The per-instrument triple below is the " +
    "provenance evidence: manifest digest, recomputed digest, output digest. Generation REFUSES if any " +
    "recomputed source digest differs from its historical manifest line.",
  refusalRule: "If any of the 83 recomputed source digests differs from its manifest line, NO output file is " +
    "written and the generator exits 4. Checked for all 83 before the first write.",
  population: { instruments: files.length, sealedInstruments: files.length - unsealed.length, unsealed,
    rewritten: touched, unchanged: files.length - touched, changeSites: totalChanges },
  instruments: record,
};

if (MODE === "report") {
  console.log(`\n--- report --- instruments ${files.length} | sealed ${files.length - unsealed.length} | rewritten ${touched} | change sites ${totalChanges}`);
  console.log(`--- input integrity: ${drift.length ? "DRIFT" : "all 83 match their manifest line"} ---`);
  process.exit(0);
}

if (MODE === "verify") {
  // Re-derive everything and compare against the layer on disk, including the resolver depth.
  const gp = join(OUT, "GENERATION.json");
  if (!existsSync(gp)) { console.error(`REFUSE: ${gp} absent — a layer without a generation record cannot be verified against the seal`); process.exit(5); }
  const prev = JSON.parse(readFileSync(gp, "utf8"));
  const problems = [];
  if (prev.historicalSeal.totalEntries !== sealedEntryCount)
    problems.push(`seal entry count moved: recorded ${prev.historicalSeal.totalEntries}, now ${sealedEntryCount}`);
  for (const p of PHASES)
    if (prev.historicalSeal.perPhase[p]?.manifestDigest !== manifestOwnDigest[p])
      problems.push(`${p}/manifest.sha256 CHANGED since generation`);
  const byOut = new Map(record.filter(r => r.output).map(r => [r.output, r]));
  for (const r of prev.instruments.filter(x => x.output)) {
    const f = join(OUT, r.output);
    if (!existsSync(f)) { problems.push(`layer file missing: ${r.output}`); continue; }
    const d = sha(readFileSync(f));
    if (d !== r.outputDigest) problems.push(`layer file edited after generation: ${r.output}`);
    const now = byOut.get(r.output);
    if (!now) problems.push(`no longer generated from the seal: ${r.output}`);
    else if (now.outputDigest !== r.outputDigest) problems.push(`regeneration differs: ${r.output}`);
    else if (now.sourceDigestRecomputed !== r.sourceDigestFromManifest) problems.push(`source drifted: ${r.source}`);
  }
  // the resolver must sit at the recorded depth and be the canonical one
  const probe = join(OUT, PHASES[2], "scripts");
  const reached = resolve(probe, prev.resolver.importedAs);
  if (reached !== resolverPath) problems.push(`resolver import does not reach the canonical resolver: ${reached}`);
  if (sha(readFileSync(resolverPath)) !== prev.resolver.digest) problems.push(`canonical resolver changed since generation (recorded ${prev.resolver.digest.slice(0, 12)})`);
  if (problems.length) { console.error(`VERIFY FAILED (${problems.length}):\n` + problems.map(p => "  - " + p).join("\n")); process.exit(6); }
  console.log(`VERIFY OK — layer ${prev.layer}\n  ${prev.instruments.filter(x => x.output).length} generated files match their recorded output digests` +
    `\n  all ${sealedEntryCount} historical seal entries unchanged (three manifest digests match)` +
    `\n  resolver reached across ${prev.resolver.depthFromLayerScripts} levels and is the canonical one`);
  process.exit(0);
}

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, "GENERATION.json"), JSON.stringify(generation, null, 2) + "\n");

const md = [
  `# PINK — PORTABLE EVIDENCE LAYER ${LAYER_VERSION.toUpperCase()} · GENERATION RECORD`,
  ``,
  `Generated \`${generation.generatedAtUTC}\` from \`${generation.sourceRef.branch}\` @ \`${String(generation.sourceRef.commit).slice(0, 8)}\`.`,
  ``,
  `## What this layer is, and what it is not`,
  ``,
  `It is a **separately versioned regeneration** of the ${files.length} PINK instruments sealed in`,
  `\`mapping-phase-{e,f,g}-contract/scripts/\`, carrying the portability repair. It is **additive**:`,
  `all **${sealedEntryCount}** historical seal entries are unchanged, and this generator has no`,
  `\`--in-place\` mode and does not read \`PINK_SEAL_OVERRIDE\`.`,
  ``,
  `It is **not** a re-measurement. Not one figure in the sealed outputs is recomputed here. The repair is`,
  `to **resolution and provenance only** — an instrument that resolves everywhere and is pointed at a`,
  `different build measures *that* build, exactly as \`PINK-SYSTEM-VALIDATION.md\` §1 bounds it.`,
  ``,
  `## Why a manifest would not have been enough (A-G499)`,
  ``,
  `> ${generation.a_g499_clause}`,
  ``,
  `So each of the ${files.length} instruments below carries **three** digests — the digest **as read from the`,
  `historical manifest line**, the digest **recomputed from disk**, and the **output** digest — and`,
  `**generation refuses entirely if any recomputed source digest differs from its manifest line**`,
  `(exit 4, before the first output file is written).`,
  ``,
  `## The resolver is not copied into this layer`,
  ``,
  `> ${generation.resolver.whyNotCopied}`,
  ``,
  `Imported as \`${RESOLVER_FROM_SCRIPTS}\` (${RESOLVER_DEPTH_FROM_SCRIPTS} levels up), digest`,
  `\`${generation.resolver.digest.slice(0, 16)}…\`. **Cost:** the layer is valid only at the depth it was`,
  `generated for; \`--verify\` re-derives that depth rather than trusting it.`,
  ``,
  `## Census`,
  ``,
  `| | |`,
  `|---|---|`,
  `| instruments | ${files.length} |`,
  `| in the historical seal | ${files.length - unsealed.length} |`,
  `| rewritten into this layer | ${touched} |`,
  `| unchanged (nothing to repair) | ${files.length - touched} |`,
  `| change sites | ${totalChanges} |`,
  `| historical seal entries, before and after | ${sealedEntryCount} |`,
  ``,
  `## Verifying this layer`,
  ``,
  `Two independent checks, and the second is the one that matters:`,
  ``,
  `\`\`\``,
  `cd <layer> && sha256sum -c manifest.sha256          # internal consistency only`,
  `node ../mapping-phase-pink-tools/pink-layer-build.mjs --verify <layer>   # provenance against the seal`,
  `\`\`\``,
  ``,
  `## Per-instrument record`,
  ``,
  `| instrument | source digest (manifest) | recomputed | integrity | output digest | repairs |`,
  `|---|---|---|---|---|---|`,
  ...record.map(r => `| \`${r.source}\` | \`${(r.sourceDigestFromManifest ?? "—").slice(0, 12)}\` | ` +
    `\`${r.sourceDigestRecomputed.slice(0, 12)}\` | ${r.sourceIntegrity} | ` +
    `\`${r.outputDigest ? r.outputDigest.slice(0, 12) : "—"}\` | ${r.changeClasses.length || "—"} |`),
  ``,
  `*PINK. Validation only — never implementation, never integration. No merge, no push to \`main\`, no`,
  `production deployment. Gemini disabled throughout.*`,
  ``,
].join("\n");
writeFileSync(join(OUT, "GENERATION.md"), md);

// ---- STEP 4: the layer's own manifest ------------------------------------------------------------
const layerFiles = [];
(function walk(d) {
  for (const e of readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const p = join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name !== "manifest.sha256") layerFiles.push(p);
  }
})(OUT);
writeFileSync(join(OUT, "manifest.sha256"),
  layerFiles.map(p => `${sha(readFileSync(p))}  ./${relative(OUT, p)}`).join("\n") + "\n");

console.log(`--- generated --- ${OUT}`);
console.log(`  instruments ${files.length} | rewritten ${touched} | change sites ${totalChanges}`);
console.log(`  input integrity: all ${files.length} match their historical manifest line`);
console.log(`  layer manifest entries: ${layerFiles.length}`);
console.log(`  historical seal entries: ${sealedEntryCount} (untouched)`);
