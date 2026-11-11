/**
 * GRÜN · PHASE-G · §89 — WHICH OF MY INSTRUMENTS COPY A PRODUCT CONSTANT WITHOUT CHECKING IT?
 * **NO VERDICT** (A-G36 point 2). Source reading and string matching only. No browser, no build, no server.
 *
 * GELB took the three hazards I reported — pinning, constants, scatter — and ran them against their own
 * eleven instruments. Constants FAILED: six product constants duplicated, with `HALTS` in one file, `REPORTS`
 * in four, and `NOTHING` in six, including the two carrying §83's and §84's findings. Their sentence is the
 * one that applies here too:
 *
 *     A constant copied out of the product without a check is not a citation; it is a FORK.
 *
 * I reported that hazard and did not run it on myself. This is that run, and the classification is GELB's
 * three states rather than my two, because their third state is the one that hides:
 *
 *   HALTS    the file reads the constant from the product and THROWS if it moved
 *   REPORTS  the file notices and continues — a line in an output nobody diffs
 *   NOTHING  the value is a literal with no tie to the product at all
 *
 * WHAT COUNTS AS A HIT, and why it is deliberately generous: a file is credited with reading the product only
 * if it actually opens the product source. A file that merely mentions a constant's NAME in a comment is not
 * reading it — that is §83's defect, and the scan strips comments before looking, for exactly that reason.
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PROVENANCE } from "./gruen-provenance.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(here, "../../../../..");
const PRODUCT = "app/components/career/demo/PersonJobMappingField.tsx";
const VIEWMODEL = "lib/career/view-model/mapping-field.ts";
const src = readFileSync(resolve(ROOT, PRODUCT), "utf8");
const vm = readFileSync(resolve(ROOT, VIEWMODEL), "utf8");

/* strip comments so a constant NAMED in prose is not mistaken for one USED in code (§83's defect) */
function stripComments(text) {
  let out = "", i = 0, mode = "CODE";
  const stack = [];
  while (i < text.length) {
    const c = text[i], d = text[i + 1] ?? "";
    if (mode === "CODE") {
      if (c === "{") { let j = i + 1; while (/\s/.test(text[j] ?? "")) j += 1;
        if (text[j] === "/" && text[j + 1] === "*") { const e = text.indexOf("*/", j + 2);
          if (e !== -1) { let k = e + 2; while (/\s/.test(text[k] ?? "")) k += 1;
            if (text[k] === "}") { for (let q = i; q <= k; q += 1) if (text[q] === "\n") out += "\n"; i = k + 1; continue; } } } }
      if (c === "/" && d === "/") { mode = "LINE"; i += 2; continue; }
      if (c === "/" && d === "*") { mode = "BLOCK"; i += 2; continue; }
      if (c === "'" || c === '"' || c === "`") { stack.push(c); mode = c === "`" ? "TPL" : "STR"; out += c; i += 1; continue; }
      out += c; i += 1; continue;
    }
    if (mode === "LINE") { if (c === "\n") { mode = "CODE"; out += c; } i += 1; continue; }
    if (mode === "BLOCK") { if (c === "*" && d === "/") { mode = "CODE"; i += 2; } else { if (c === "\n") out += c; i += 1; } continue; }
    out += c;
    if (c === "\\") { out += d; i += 2; continue; }
    if (c === stack[stack.length - 1]) { stack.pop(); mode = "CODE"; }
    i += 1;
  }
  return out;
}

/** the product's own constants, read from the product */
const DECLS = [
  ["CYAN", /^const CYAN = "([^"]+)";/m, src], ["GAP_HUE", /^export const GAP_HUE = "([^"]+)";/m, src],
  ["INK", /^const INK = "([^"]+)";/m, src], ["SEAT", /^export const SEAT = "([^"]+)";/m, src],
  ["RING_LUMINANCE", /^export const RING_LUMINANCE = Object\.freeze\((\{[^}]*\})\)/m, src],
  ["GLOW_RAMP", /^export const GLOW_RAMP[^=]*= Object\.freeze\((\[[^;]*\])\s*as const\)/m, src],
  ["VOLUME", /^export const VOLUME = Object\.freeze\((\{[^}]*\})\)/m, src],
  ["WAVE", /^export const WAVE = Object\.freeze\((\{[^}]*\})\)/m, src],
  ["CROWDING", /^export const CROWDING = ([\d.]+);/m, src],
  ["BODY_BUDGET", /^export const BODY_BUDGET = Object\.freeze\((\{[^}]*\})\)/m, src],
  ["SEAT_PAD_PX", /^export const SEAT_PAD_PX = ([\d.]+);/m, src],
  ["STROKE_MIN_PX", /^export const STROKE_MIN_PX = ([\d.]+);/m, src],
  ["TEXT_MIN_PX", /^export const TEXT_MIN_PX = ([\d.]+);/m, src],
  ["FLOOR_HEADROOM", /^const FLOOR_HEADROOM = ([\d.]+);/m, src],
  ["STAGE_GROUND_ALPHA", /^export const STAGE_GROUND_ALPHA = ([\d.]+);/m, src],
  ["CHAR_EM", /^const CHAR_EM = ([\d.]+);/m, src],
  ["LABEL_GAP", /^const LABEL_GAP = ([\d.]+);/m, src],
  ["FRAME_EM_PER_CHAR", /^const FRAME_EM_PER_CHAR = Object\.freeze\((\{[^}]*\})\)/m, src],
  ["FRAME_PASS_CAP", /^const FRAME_PASS_CAP = (\d+);/m, src],
  ["SIZE_FLOOR_PX", /^export const SIZE_FLOOR_PX = ([\d.]+);/m, vm]
];
const product = {};
for (const [name, re, text] of DECLS) { const m = re.exec(text); product[name] = m ? m[1].trim() : null; }
const unreadable = Object.entries(product).filter(([, v]) => v === null).map(([k]) => k);

const files = readdirSync(here).filter(f => f.startsWith("gruen-") && f.endsWith(".mjs")).sort();
const rows = files.map(file => {
  const raw = readFileSync(resolve(here, file), "utf8");
  const code = stripComments(raw);
  const readsProduct = code.includes(PRODUCT) || code.includes(VIEWMODEL);
  /**
   * §89 · A FOURTH STATE, and the detector needed it the moment the fix landed.
   *
   * After six files were changed to call `rgbConstant("GAP_HUE")` — which reads the declaration out of the
   * product and throws if it is missing or malformed — this audit STILL called them forks, because it
   * credited a file with reading the product only if the file mentioned the product's PATH. An indirect read
   * through a helper was invisible to it, so the detector would have reported the fix as the defect.
   *
   * And the right state is not HALTS. HALTS means "holds a copy and throws if the copy disagrees". These
   * files hold NO copy, so there is nothing to disagree: **READS** is strictly stronger, because
   * eliminating a duplicate beats checking one. That distinction is the whole point of the fix and the
   * classifier has to be able to express it.
   */
  const usesProductReader = /\brgbConstant\s*\(/.test(code);
  const throwsOnMove = readsProduct && /throw new Error/.test(code) && /(moved|not found|is written for|re-read|re-derived)/i.test(raw);
  const mentions = [];
  for (const [name, value] of Object.entries(product)) {
    if (value === null) continue;
    const byName = new RegExp(`\\b${name}\\b`).test(code);
    /**
     * §89 · THE DETECTOR'S FIRST VERSION WAS THE DEFECT IT WAS LOOKING FOR. It matched a constant by value
     * if EVERY numeral in the product's value appeared anywhere in the file — and LABEL_GAP, FRAME_PASS_CAP
     * and SIZE_FLOOR_PX are all `12`, so it credited any script containing the digits "12" with carrying
     * three forked constants. Twenty-four files came back as forks, almost all of it that one artefact.
     * GELB's "does this section contain a hex string" and my own bare-slash count are the same shape; this
     * is the third.
     *
     * A value match is now only claimed where the value is DISTINCTIVE enough to be evidence: a decimal with
     * at least two fractional digits, or a quoted triple like "92, 200, 255", or a multi-field object/array
     * literal matched as a whole after whitespace is normalised. A bare small integer is never evidence —
     * there is no way to tell `12` the constant from `12` the loop bound, and guessing is what produced the
     * noise.
     */
    const norm = t => t.replace(/\s+/g, "");
    const distinctive = (() => {
      const v = String(value).trim();
      if (/^-?\d+\.\d{2,}$/.test(v)) return v;                            // 0.022, 1.002
      if (/^"[^"]*,[^"]*"$/.test(v)) return v.replace(/^"|"$/g, "");        // "92, 200, 255"
      if (/^[[{]/.test(v) && v.length > 12) return v;                       // an object or array literal
      return null;
    })();
    const byValue = distinctive !== null && (code.includes(distinctive) || norm(code).includes(norm(distinctive)));
    const viaReader = new RegExp(`rgbConstant\\(\\s*["'\`]${name}["'\`]`).test(code);
    if (byName || byValue) mentions.push({ constant: name, byName, byValue, viaReader });
  }
  const state = mentions.length === 0 ? "NO CONSTANT"
    : usesProductReader && mentions.every(m => m.viaReader) ? "READS"
    : throwsOnMove ? "HALTS"
    : usesProductReader ? "READS (partly)"
    : readsProduct ? "REPORTS"
    : "NOTHING";
  return { file, state, readsProduct, throwsOnMove, constants: mentions.map(m => m.constant), byValueOnly: mentions.filter(m => !m.byName && m.byValue).map(m => m.constant) };
});

const byState = rows.reduce((m, r) => { (m[r.state] ??= []).push(r.file); return m; }, {});
const forks = rows.filter(r => r.state === "NOTHING" || r.state === "READS (partly)");
/* the files whose numbers are in the record — the ones GELB said go first */
const INRECORD = ["gruen-pg12-direction.mjs", "gruen-compositing-model.mjs", "gruen-compositing-ladder.mjs",
                  "gruen-pg12-alpha-quantisation.mjs", "gruen-pg12-floor-measured.mjs", "gruen-join-quantisation.mjs"];
const forksInRecord = forks.filter(r => INRECORD.includes(r.file)).map(r => r.file);

const out = {
  reading: "GRÜN · §89 — product constants copied into this lane's instruments, classified HALTS / REPORTS / NOTHING",
  verdict: PROVENANCE.verdict,
  scope: "source reading and string matching over scripts/gruen-*.mjs and the product's own declarations. No browser, no build, no server.",
  why: "GELB ran the three hazards I reported against their own instruments and the constants hazard FAILED there — one HALTS of eleven files. I reported it and had not run it on myself. GELB's sentence is the standard: a constant copied out of the product without a check is not a citation, it is a FORK.",
  classification: { READS: "holds NO copy — the value is read out of the product at run time, so there is nothing to go stale. Strictly stronger than HALTS.", HALTS: "holds a copy and THROWS if the copy disagrees with the product", "READS (partly)": "reads some constants and still copies others", REPORTS: "reads the product and notices a move, but continues", NOTHING: "a literal with no tie to the product at all", "NO CONSTANT": "no product constant appears" },
  commentsStripped: "a constant NAMED in a comment is not a constant USED in code — §83's defect — so every scan runs on the comment-stripped source",
  detectorLimit: "a constant is credited to a file by NAME, or by a DISTINCTIVE value — a decimal with two or more fractional digits, a quoted triple, or a multi-field literal. A bare small integer is never evidence: LABEL_GAP, FRAME_PASS_CAP and SIZE_FLOOR_PX are all 12, and the first version of this detector credited every script containing the digits '12' with forking all three. So this audit UNDER-reports by design where a product value is a small integer copied as a literal, and that is the honest direction.",
  productConstantsRead: Object.fromEntries(Object.entries(product).filter(([, v]) => v !== null)),
  productConstantsNOTReadable: unreadable,
  census: Object.fromEntries(Object.entries(byState).map(([k, v]) => [k, v.length])),
  byState,
  forksThatCarryRecordedNumbers: forksInRecord,
  perFile: rows,
  finding: null
};
out.finding = `${rows.length} instruments scanned. ${out.census.HALTS ?? 0} HALT, ${out.census.REPORTS ?? 0} REPORT, ${out.census.NOTHING ?? 0} do NOTHING, ${out.census["NO CONSTANT"] ?? 0} carry no product constant.
${forks.length === 0 ? "No forks." : `THE FORKS (NOTHING or partly-read): ${forks.map(f => f.file).join(", ")}. Of these, ${forksInRecord.length} carry numbers that are in the record and go first: ${forksInRecord.join(", ") || "none"}.`}
${unreadable.length > 0 ? `AND ${unreadable.length} PRODUCT CONSTANTS COULD NOT BE READ AT ALL (${unreadable.join(", ")}) — a declaration this audit cannot extract is one it cannot check anywhere, so that is a hole in the audit before it is a hole in any instrument.` : "Every product constant in the list was extractable, so a NOTHING verdict below is about the instrument and not about this scan's reach."}`;

writeFileSync(resolve(here, "../outputs/constant-forks.json"), JSON.stringify(out, null, 1));
console.log(`product constants read: ${Object.keys(out.productConstantsRead).length}${unreadable.length ? ` · NOT readable: ${unreadable.join(", ")}` : ""}\n`);
console.log("state        file                                      constants");
for (const r of rows) if (r.state !== "NO CONSTANT") console.log(`${r.state.padEnd(12)} ${r.file.padEnd(41)} ${r.constants.join(", ").slice(0, 70)}`);
console.log(`\n${out.finding}`);
