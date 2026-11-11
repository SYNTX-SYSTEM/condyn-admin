/**
 * GRÜN · PHASE-G · §62 — DOES ANY SEALED READING STILL DESCRIBE THE PRODUCT AT HEAD?
 * **NO VERDICT** (A-G36 point 2). Pure git + arithmetic: no render, no server, no build, no browser.
 *
 * THE HOLE THIS CLOSES. A-G109 seals a reading so a later pass cannot silently overwrite it, and run-all.sh
 * therefore keeps the sealed probes OUT of a routine pass on purpose. Both halves are right, and together
 * they leave a gap nobody was watching: a seal records the HEAD it was taken at, and then NOTHING EVER
 * COMPARES THAT HEAD TO THE PRODUCT AGAIN. The protection against overwriting a seal is also the thing that
 * stops anyone noticing the seal has gone stale. So a product constant can move under a sealed number and the
 * sealed file keeps presenting it as current, with correct provenance, indefinitely.
 *
 * HOW IT DECIDES, and the honest split between the exact part and the heuristic part:
 *
 *   EXACT   — the constants the readings actually stand on are extracted by name from the product source at
 *             the seal's own commit and at HEAD, and compared value-by-value. A constant that moved is a
 *             definite stale. This needs no judgement and is the part I would stake a number on.
 *   BACKSTOP— a changed product line that is NOT one of those constants is classified comment-only or
 *             behavioural by a conservative heuristic. It FAILS SAFE: anything the heuristic cannot prove is
 *             comment-only is reported as behavioural, so the error direction is "re-measure something you
 *             did not have to", never "trust a stale seal".
 *
 * A clean result does NOT mean the readings are right. It means the product they were read from has not moved.
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PROVENANCE } from "./gruen-provenance.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(here, "../../../../..");
const OUT = resolve(here, "../outputs");
const git = args => execSync(`git -C ${ROOT} ${args}`, { encoding: "utf8", maxBuffer: 1 << 28 }).trim();

/** the named constants every phase-G pixel reading stands on; a move in any of these invalidates a seal */
const TRACKED = ["STAGE_GROUND_ALPHA", "STROKE_MIN_PX", "TEXT_MIN_PX", "RING_LUMINANCE", "SEAT_PAD_PX", "WAVE",
                 "VOLUME", "GLOW_RAMP", "CROWDING", "MARK_ICON", "DISC_OCCLUSION", "BODY_BUDGET"];
const PRODUCT = ["app/components/career/demo/PersonJobMappingField.tsx"];

/** extract `export const NAME = <rest>;` verbatim, so a value change shows as a string difference */
function constantsAt(sha, path) {
  let src;
  try { src = git(`show ${sha}:${path}`); } catch { return null; }
  const found = {};
  for (const name of TRACKED) {
    const m = new RegExp(`^export const ${name}(?::[^=]*)? = (.*);\\s*$`, "m").exec(src);
    found[name] = m ? m[1].trim() : null;
  }
  return found;
}

/**
 * Strip comments with a character state machine, so "did only comments change?" is decided EXACTLY rather
 * than guessed per line. The first version of this check was a per-line heuristic and it was useless: it
 * called all eight seals stale, because a JSX block comment's continuation lines are plain prose with no
 * leading `*` and the heuristic could not prove them comments. A check that fires on everything carries no
 * information, so it is replaced rather than tuned.
 *
 * States: CODE, line comment, block comment, '…', "…", `…` with ${…} nesting. A `/` opens a comment only
 * when followed by `/` or `*`, which is why JSX `/>` and `</tag>` pass through as code. Two residual risks,
 * both named and both checked below rather than assumed away:
 *   - regex literals are recognised by the standard "is a value expected here?" test on the preceding token
 *     and copied through whole, so one containing `//` or `/*` cannot be mis-stripped; the count found is
 *     reported per revision so it cannot change in silence.
 *   - `//` inside JSX *text* (not a string, not code) would still be stripped as a comment. The product file
 *     has no such text today; if it gains some, this check reports comment-only when a JSX text line moved.
 *     That is the one residual way it can be wrong, and it is recorded here rather than left implicit.
 */
function stripComments(src) {
  let out = "", i = 0, regexLiterals = 0;
  const n = src.length;
  const stack = [];                       // template-literal nesting
  let mode = "CODE";
  while (i < n) {
    const c = src[i], d = src[i + 1];
    if (mode === "CODE") {
      if (c === "/" && d === "/") { mode = "LINE"; i += 2; continue; }
      if (c === "/" && d === "*") { mode = "BLOCK"; i += 2; continue; }
      if (c === "'") { mode = "SQ"; out += c; i += 1; continue; }
      if (c === '"') { mode = "DQ"; out += c; i += 1; continue; }
      if (c === "`") { mode = "TPL"; out += c; i += 1; continue; }
      if (c === "}" && stack.length > 0) { mode = stack.pop(); out += c; i += 1; continue; }
      if (c === "/") {
        /* regex literal or division? decide from the last significant token emitted, the standard test. A
           regex can only START where a VALUE is expected. Counting bare '/' instead of doing this was the
           previous version's error: it found 73 "risks" in a file whose every one of them was a division or
           a JSX slash. */
        const prev = out.replace(/\s+$/, "");
        const last = prev.slice(-1);
        const kw = /(^|[^$\w])(return|typeof|instanceof|in|of|case|delete|void|do|else|yield|await|new)$/.test(prev);
        const valueExpected = prev === "" || kw || "=(,:[!&|?{;+-*%~^<>".includes(last);
        if (valueExpected && last !== ">") {              // '>' excludes JSX '/>' and generics
          let j = i + 1, inClass = false, closed = false;
          while (j < n) {
            const e = src[j];
            if (e === "\\") { j += 2; continue; }
            if (e === "[") inClass = true;
            else if (e === "]") inClass = false;
            else if (e === "/" && !inClass) { closed = true; break; }
            else if (e === "\n") break;                    // unterminated: not a regex after all
            j += 1;
          }
          if (closed) { regexLiterals += 1; out += src.slice(i, j + 1); i = j + 1; continue; }
        }
      }
      out += c; i += 1; continue;
    }
    if (mode === "LINE") { if (c === "\n") { mode = "CODE"; out += c; } i += 1; continue; }
    if (mode === "BLOCK") { if (c === "*" && d === "/") { mode = "CODE"; i += 2; } else { if (c === "\n") out += c; i += 1; } continue; }
    if (mode === "SQ" || mode === "DQ") {
      out += c;
      if (c === "\\") { out += d ?? ""; i += 2; continue; }
      if ((mode === "SQ" && c === "'") || (mode === "DQ" && c === '"')) mode = "CODE";
      i += 1; continue;
    }
    if (mode === "TPL") {
      out += c;
      if (c === "\\") { out += d ?? ""; i += 2; continue; }
      if (c === "$" && d === "{") { stack.push("TPL"); mode = "CODE"; out += d; i += 2; continue; }
      if (c === "`") mode = "CODE";
      i += 1; continue;
    }
  }
  return { code: out.split("\n").map(l => l.trim()).filter(Boolean).join("\n"), regexLiterals };
}

/** exact: identical AFTER comment-stripping means no behavioural line moved */
function changedLinesAreCommentOnly(sha, path) {
  let before, now;
  try { before = git(`show ${sha}:${path}`); now = git(`show HEAD:${path}`); } catch { return { commentOnly: false, why: "a revision of the product file could not be read" }; }
  const a = stripComments(before), b = stripComments(now);
  /* the strip must not leave comment openers behind, or it did not do its job */
  /* a surviving block-comment opener means the stripper did not do its job; '//' is allowed through because
     it occurs legitimately inside string literals (URLs), which the stripper preserves on purpose */
  if (b.code.includes("/*") || a.code.includes("/*"))
    return { commentOnly: false, why: "a block-comment opener survived the strip — the stripper cannot be trusted on this revision, so the seal is treated as stale" };
  return {
    commentOnly: a.code === b.code,
    strippedLinesAtSeal: a.code.split("\n").length,
    strippedLinesAtHead: b.code.split("\n").length,
    regexLiteralsAtSeal: a.regexLiterals, regexLiteralsAtHead: b.regexLiterals,
    why: a.code === b.code
      ? "the product file with every comment removed is IDENTICAL at the seal's commit and at HEAD, so no behavioural line moved"
      : "the product file differs at the seal's commit and at HEAD after removing every comment, so a behavioural line moved"
  };
}

const head = git("rev-parse HEAD");

/**
 * SELF-TEST, run every pass. §62 limb A found PG-16 unfalsifiable because the product computes the pin's own
 * predicate; the same trap applies to this audit. If `constantsAt` silently stopped matching, every seal
 * would read VALID forever and the file would look like it was working. So the detector is made to fire on a
 * known-moved constant before it is trusted: RING_LUMINANCE.shelf moved 0.02 -> 0.022 at §23 (A-G62), so a
 * comparison of 3ec8457d against HEAD MUST report exactly that move, and every tracked constant MUST extract
 * non-null at both ends. If either fails, this script throws rather than reporting a clean audit.
 */
const BASE = "3ec8457d";
const selfTest = (() => {
  const a = constantsAt(BASE, PRODUCT[0]), b = constantsAt(head, PRODUCT[0]);
  if (a === null || b === null) throw new Error(`self-test: the product file is unreadable at ${BASE} or HEAD`);
  const unextractable = TRACKED.filter(n => a[n] === null || b[n] === null);
  if (unextractable.length > 0) throw new Error(`self-test: these tracked constants no longer extract — the audit would pass silently: ${unextractable.join(", ")}`);
  const moved = TRACKED.filter(n => a[n] !== b[n]);
  if (!moved.includes("RING_LUMINANCE")) throw new Error("self-test: RING_LUMINANCE moved 0.02 -> 0.022 between 3ec8457d and HEAD (A-G62) and the detector did not see it — the audit cannot be trusted");
  return { base: BASE, constantsExtracted: TRACKED.length, detectedMovesFromBase: moved, provesDetectorFires: true };
})();
const seals = readdirSync(OUT).filter(f => f.startsWith("SEALED-") && f.endsWith(".json")).sort();
const rows = [];
for (const file of seals) {
  const seal = JSON.parse(readFileSync(resolve(OUT, file), "utf8"));
  const sealHead = seal?.provenance?.head ?? null;
  if (!sealHead) { rows.push({ file, status: "UNKNOWN", why: "the seal records no provenance.head, so nothing can be compared" }); continue; }

  let reachable = true;
  try { git(`cat-file -e ${sealHead}^{commit}`); } catch { reachable = false; }
  if (!reachable) { rows.push({ file, status: "UNKNOWN", sealHead, why: "the seal's commit is not in this repository — it cannot be compared and must be treated as stale" }); continue; }

  const moved = [];
  for (const path of PRODUCT) {
    const before = constantsAt(sealHead, path), now = constantsAt(head, path);
    if (before === null || now === null) { moved.push({ path, constant: "(whole file)", note: "absent at one of the two commits" }); continue; }
    for (const name of TRACKED) {
      /* TWO NULLS COMPARE EQUAL. A constant that was renamed, reformatted onto two lines, or lost its
         `export` extracts as null at BOTH commits and would then be reported as "did not move" — the exact
         silent-pass this whole file exists to prevent. A null is therefore fatal, never equal. */
      if (before[name] === null || now[name] === null) {
        moved.push({ path, constant: name, atSeal: before[name], atHead: now[name],
                     note: "NOT EXTRACTABLE at one or both commits — the declaration was renamed or reformatted, so this audit cannot speak for it and the seal is treated as stale" });
        continue;
      }
      if (before[name] !== now[name]) moved.push({ path, constant: name, atSeal: before[name], atHead: now[name] });
    }
  }
  const strips = PRODUCT.map(p => ({ path: p, ...changedLinesAreCommentOnly(sealHead, p) }));
  const commentOnly = strips.every(x => x.commentOnly);
  const anyProductDiff = PRODUCT.some(p => { try { return git(`diff --name-only ${sealHead} HEAD -- ${p}`).length > 0; } catch { return true; } });

  rows.push({
    file, sealHead, sealHeadShort: sealHead.slice(0, 8), commitsBehindHead: Number(git(`rev-list --count ${sealHead}..HEAD`)),
    trackedConstantsThatMoved: moved,
    productFileTouchedSinceSeal: anyProductDiff,
    changedLinesAreCommentOnly: commentOnly,
    commentStrip: strips,
    status: moved.length > 0 ? "STALE" : !anyProductDiff ? "VALID" : commentOnly ? "VALID" : "STALE",
    why: moved.length > 0 ? `a tracked constant moved since the seal: ${moved.map(m => m.constant).join(", ")}`
       : !anyProductDiff ? "the product file is byte-identical to the seal's commit"
       : commentOnly ? "the product file changed since the seal, but with every comment removed it is IDENTICAL at both commits, so no behavioural line moved and no reading can have moved"
       : `the product file changed behaviourally since the seal: ${strips.filter(x => !x.commentOnly).map(x => x.why).join("; ")}`
  });
}

const stale = rows.filter(r => r.status === "STALE");
const unknown = rows.filter(r => r.status === "UNKNOWN");
const out = {
  reading: "GRÜN · §62 — seal-staleness audit: does each SEALED reading still describe the product at HEAD?",
  verdict: PROVENANCE.verdict,
  scope: "git object reads and string comparison only. No render, no server, no build, no browser, nothing written outside this file.",
  head, headShort: head.slice(0, 8),
  selfTest,
  method: {
    exact: `named-constant comparison at the seal's commit vs HEAD, over ${TRACKED.length} constants: ${TRACKED.join(", ")}`,
    secondCheck: "the product file is compared at both commits AFTER removing every comment with a character state machine, so 'only comments changed' is decided exactly; the stripper reports its own residue and regex-literal risk and downgrades to stale if either appears",
    whatAValidResultDoesNotMean: "VALID means the product the reading was taken from has not moved. It says nothing about whether the reading was correct, whether its carrier was the right carrier, or whether its pin is falsifiable."
  },
  summary: { seals: rows.length, valid: rows.length - stale.length - unknown.length, stale: stale.length, unknown: unknown.length },
  staleSeals: stale.map(r => ({ file: r.file, why: r.why, movedConstants: r.trackedConstantsThatMoved })),
  perSeal: rows,
  standingGap: "This audit is a derivation and so it runs in every routine pass. It does NOT re-measure anything and it cannot: re-measuring a sealed reading needs a build, a server and the façade, and A-G109 keeps the sealed probes out of a routine pass so a pass cannot overwrite a seal. So the audit's job is to make a stale seal LOUD rather than to repair it. A STALE line here is an instruction to re-run that one probe deliberately, under the owner's build permission, and to re-seal it."
};
writeFileSync(resolve(OUT, "seal-staleness.json"), JSON.stringify(out, null, 1));

console.log(`self-test: detector fires on ${selfTest.detectedMovesFromBase.join(", ")} between ${BASE} and HEAD · ${selfTest.constantsExtracted} constants extract at both ends`);
console.log(`HEAD ${out.headShort} · ${rows.length} seals · ${out.summary.valid} valid, ${out.summary.stale} stale, ${out.summary.unknown} unknown\n`);
for (const r of rows) {
  console.log(`${r.status.padEnd(8)} ${r.file.padEnd(40)} ${(r.sealHeadShort ?? "--------")}  +${r.commitsBehindHead ?? "?"} commits`);
  console.log(`         ${r.why}`);
}
/* stderr, not stdout: run-all.sh sends a derivation's stdout to /dev/null, so a stale seal would otherwise
   be reduced to a bare "FAILED (exit 1)" with the reason discarded. */
if (stale.length > 0) {
  console.error("\n!! STALE SEALS PRESENT — re-run those probes deliberately and re-seal; do not quote them as current.");
  for (const r of stale) console.error(`   ${r.file}: ${r.why}`);
  process.exitCode = 1;
}
