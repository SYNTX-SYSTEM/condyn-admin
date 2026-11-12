/**
 * GELB · THE SHARED READER — §128, A-G468
 *
 * WHY THIS EXISTS, and it is not a tidying refactor.
 *
 * On 2026-11-11 23:49, commit 4ef3f1c2 wrote §125 of PHASE_G. §125 is the section that declared the audit
 * chain converged and whose own sentence is "a correct conclusion is not evidence of a correct instrument".
 * Writing it pushed PERSON_X_JOB_MAPPING_PHASE_G.md from 1048281 to 1048944 bytes — across 1 MiB, which is
 * node's DEFAULT child_process maxBuffer, exactly. Two instruments read that file with `execFileSync("cat")`
 * and both have been dead ever since with `spawnSync cat ENOBUFS`:
 *
 *     gelb-gate-pf8-tiers.mjs:37        gelb-provenance-selfaudit.mjs:19
 *
 * Neither failed because its SUBJECT broke. Both failed because the record they audit got bigger. Three
 * commits landed after the breakage and the closing verification reported "25 instruments, 22 exit 0"
 * without naming the three — so the figure was carried as a stand while two of its members could not look.
 *
 * RULED, A-G468: AN INSTRUMENT THAT READS THE RECORD TAKES THE RECORD'S SIZE AS AN INPUT IT NEVER DECLARED.
 * An audit whose subject is its own documentation has a feedback path from output to input, and a limit on
 * that path fails at whatever section happens to cross it — bearing no relation to the subject under audit.
 * The section that crosses the limit is selected by LENGTH, so it is likelier to be a late one: the closing
 * sections of a long audit are exactly where the instruments are most likely to stop working, and exactly
 * where attention has already moved to the summary.
 *
 * AND THE SIGN OF THE FAILURE IS WRONG, which is why three commits missed it. A gate exiting 1 reads as
 * "the gate caught something". Here exit 1 means THE GATE COULD NOT LOOK. That is A-G374 at a radius it had
 * not been stated for: the exit code described neither the tool nor the artifact, it described the
 * TRANSPORT. provenance-selfaudit makes it literal — its spawnSync result carried `status: 0`. The `cat`
 * SUCCEEDED. The pipe overflowed. Three layers disagreed, and the only one a caller normally reads is the
 * one that said the read was fine.
 *
 * THE FIX IS NOT A BIGGER BUFFER. Raising a limit moves a cliff; it does not remove one, and it leaves the
 * next crossing to be discovered the same way. So:
 *   1. FILE READS LOSE THE SUBPROCESS ENTIRELY. fs.readFileSync has no comparable cap, so for reading a
 *      document the class is REMOVED rather than widened. There was never a reason to spawn `cat`.
 *   2. EVERY REMAINING SPAWN DECLARES ITS BUFFER, and REFUSES at NEAR of it rather than failing AT it. A
 *      declared limit that announces its own approach cannot be hit as a surprise, and cannot silently
 *      truncate for a caller who reads .stdout without checking .error — which is the failure provenance-
 *      selfaudit's `status: 0` demonstrates is reachable.
 *   3. IT REFUSES, like gelb-product-constants.mjs, rather than reporting. The instrument audit's own §[2]
 *      says this lane is "at REFUSES in 1 file of 13" and calls the rest a convention. GRÜN's rule applies:
 *      a convention is not a boundary.
 *
 * Run this file directly for its self-test: it proves each refusal FIRES, per A-G452 — a guard with no
 * mutant is a guard that has tested nothing.
 */
import { readFileSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { PHASE_G, REPO_ROOT } from "./gelb-paths.mjs"; // A-G469: derived, never declared

export const MAXBUF = 64 * 1024 * 1024;
export const NEAR = 0.9;

/** Read a document. No subprocess, so no buffer limit of any kind applies. Refuses rather than returning
 *  something falsy, because an empty read is a zero denominator and a zero denominator reads green. */
export function readDoc(path) {
  let st;
  try { st = statSync(path); } catch (e) { throw new Error(`REFUSE readDoc: cannot stat ${path} — ${e.code}`); }
  if (!st.isFile()) throw new Error(`REFUSE readDoc: not a regular file — ${path}`);
  if (st.size === 0) throw new Error(`REFUSE readDoc: ${path} is 0 bytes. A zero denominator reads green (A-G452).`);
  const text = readFileSync(path, "utf8");
  if (text.length === 0) throw new Error(`REFUSE readDoc: ${path} is ${st.size} bytes but decoded to 0 chars.`);
  return text;
}
export const readLines = (path) => readDoc(path).split("\n");

/** Spawn git with a DECLARED buffer that refuses on approach instead of failing on contact.
 *  `_git` carries the logic with the buffer INJECTED, so the self-test exercises this exact code path
 *  rather than a hand-copied twin. The first form of the self-test copied the body, and a mutant that
 *  tests a copy of the guard has tested nothing — A-G452 on A-G408's shape, found by the test itself. */
export function _git(tree, args, maxbuf) {
  let out;
  try {
    out = execFileSync("git", ["-C", tree, ...args], { encoding: "utf8", maxBuffer: maxbuf });
  } catch (e) {
    if (e.code === "ENOBUFS")
      throw new Error(`REFUSE git: output EXCEEDED the declared ${maxbuf} byte buffer — \`git ${args.join(" ")}\`. ` +
        `This is A-G468: raise the declaration deliberately, never inherit a default.`);
    throw e;
  }
  const n = Buffer.byteLength(out, "utf8");
  if (n > maxbuf * NEAR)
    throw new Error(`REFUSE git: output is ${n} bytes, past ${(NEAR * 100).toFixed(0)}% of the declared ${maxbuf} ` +
      `byte buffer — \`git ${args.join(" ")}\`. Refusing on APPROACH, so the limit can never be hit as a surprise.`);
  return out;
}
export const git = (tree, ...args) => _git(tree, args, MAXBUF);
export const gitLines = (tree, ...args) => git(tree, ...args).split("\n");

/* ───────────────────────── A-G452 SELF-TEST: prove every refusal can fire ───────────────────────── */
if (import.meta.url === `file://${process.argv[1]}`) {
  const { mkdtempSync, writeFileSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const d = mkdtempSync(join(tmpdir(), "gelb-read-"));
  const DOC = PHASE_G;
  let pass = 0, fail = 0;
  const must = (name, fn, expect) => {
    try { fn(); console.log(`  ✗ ${name} — DID NOT REFUSE`); fail++; }
    catch (e) {
      const ok = e.message.includes(expect);
      console.log(`  ${ok ? "✓" : "✗"} ${name}${ok ? "" : ` — refused with the WRONG message: ${e.message}`}`);
      ok ? pass++ : fail++;
    }
  };
  const mustNot = (name, fn) => {
    try { const r = fn(); console.log(`  ✓ ${name} (${r.length} units)`); pass++; }
    catch (e) { console.log(`  ✗ ${name} — REFUSED a legitimate read: ${e.message}`); fail++; }
  };
  console.log("=".repeat(104));
  console.log("GELB · gelb-read.mjs SELF-TEST — A-G452: a guard with no mutant has tested nothing");
  console.log("=".repeat(104));
  console.log("\n[1] THE REFUSALS MUST FIRE");
  writeFileSync(join(d, "empty.md"), "");
  must("0-byte file is refused, not returned as an empty corpus", () => readDoc(join(d, "empty.md")), "A-G452");
  must("missing file is refused", () => readDoc(join(d, "nope.md")), "cannot stat");
  must("a directory is refused", () => readDoc(d), "not a regular file");
  /* The proximity limb only fires between NEAR*buf and buf — above buf, ENOBUFS gets there first. So the
     mutant must be sized INTO that band, and the first form of this test was not: `git log -500` overshot
     4096 and the limb was never reached. It is measured here rather than guessed. */
  const REPO = REPO_ROOT;
  const probe = _git(REPO, ["log", "--format=%H", "-200"], MAXBUF);
  const n = Buffer.byteLength(probe, "utf8");
  const inBand = Math.ceil(n / 0.95);                  // n sits at ~95% of this declared buffer
  const overBand = Math.floor(n / 2);                  // n is ~200% of this one -> ENOBUFS path
  must(`proximity limb: ${n}B output against a ${inBand}B declared buffer (${(n / inBand * 100).toFixed(0)}%)`,
    () => _git(REPO, ["log", "--format=%H", "-200"], inBand), "APPROACH");
  must(`hard limb: the same ${n}B output against a ${overBand}B declared buffer`,
    () => _git(REPO, ["log", "--format=%H", "-200"], overBand), "EXCEEDED the declared");
  mustNot(`neither limb fires at the real ${MAXBUF}B declaration`,
    () => _git(REPO, ["log", "--format=%H", "-200"], MAXBUF));

  console.log("\n[2] AND THE READ THAT KILLED TWO INSTRUMENTS MUST NOW SUCCEED");
  console.log(`      PHASE_G is ${statSync(DOC).size} bytes = ${(statSync(DOC).size / 1048576 * 100).toFixed(1)}% of the 1 MiB default that broke them`);
  mustNot("readDoc(PHASE_G) — the exact read that threw spawnSync cat ENOBUFS", () => readDoc(DOC));
  mustNot("readLines(PHASE_G)", () => readLines(DOC));
  mustNot("git() on a normal invocation still works", () => git(REPO_ROOT, "rev-parse", "--short", "HEAD"));

  console.log("\n" + "=".repeat(104));
  console.log(`  pass ${pass}   fail ${fail}`);
  console.log("=".repeat(104));
  process.exitCode = fail === 0 ? 0 : 1;
}
