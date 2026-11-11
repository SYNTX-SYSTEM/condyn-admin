/**
 * GELB · A-G128 APPLIED RETROACTIVELY TO EVERY PIN IN PHASE G.
 *
 * A-G128 was adopted in §37 and states that the gate "stands before every measurement". Every pin
 * measured BEFORE §37 therefore never passed through it — including PG-1, the phase's founding
 * obligation, which PINK declared GREEN, and PG-6, the phase's live red. This sweep closes that hole.
 *
 * It runs GRÜN's limb A from `pg16-satisfiability-at-0.3.json` as a question about EVERY pin, because
 * GRÜN's finding generalises and nobody had asked it generally:
 *
 *   > PHASE_G §11's pin predicate and spaced()'s filter predicate at :479 are the same expression over
 *   > the same operands. The product declines to draw any body that would violate the pin. So there is
 *   > no layout in the exercised set that can fail it, at 0.3 or at any other value.
 *
 * NEW LIMB OF A-G128, and it is GRÜN's, not this lane's:
 *   > Does the PRODUCT ITSELF evaluate this pin's predicate and decline to emit a counterexample?
 *   > If it does, the pin is ZERO-BY-CONSTRUCTION: no build and no constant can fail it, and what is
 *   > falsifiable is the PRESENCE AND CORRECTNESS OF THE ENFORCEMENT, not the output's compliance.
 * It is cheaper than the arithmetic limb — it is a source reading — and it fires on pins no amount of
 * measurement would have cleared.
 *
 * WHY THIS INSTRUMENT AND NOT A PROSE READING. A source reading asserted in a section cannot be
 * checked by the next reader. So every claim below names an EXACT SUBSTRING of the committed source,
 * and the instrument fails the row if that substring is absent or occurs more than once. A reading
 * this lane got wrong therefore shows up as a failed row rather than as a confident sentence —
 * which is the defect class this record has recorded eleven times.
 */

import { execFileSync } from "node:child_process";

const TREE = "/home/codi/Entwicklung/condyn-admin-mapping-d";
const SHA  = "4b83414e";
const FILES = {
  field: "app/components/career/demo/PersonJobMappingField.tsx",
  vm:    "lib/career/view-model/mapping-field.ts"
};

const src = {};
for (const [name, path] of Object.entries(FILES)) {
  src[name] = execFileSync("git", ["-C", TREE, "show", `${SHA}:${path}`], { encoding: "utf8" }).split("\n");
}

/** Locate an exact substring; a row is only usable if it occurs exactly once. */
function locate(file, needle) {
  const hits = [];
  src[file].forEach((line, i) => { if (line.includes(needle)) hits.push(i + 1); });
  return { hits, ok: hits.length === 1, line: hits[0] ?? null };
}

/* ── the pins, each with its statement quoted from the record and its claimed enforcement site ── */
const PINS = [
  { pin: "PG-1",  statement: "share of the field's light contributed by semantic elements ≥ 0.50 DERIVED + 0.05 undocumented (A-G143)",
    verdict: "LIVE", sites: [], note: "a region ratio over a render; no product expression computes it. Falsifiable by any build. §63 A-G264: its component table is not evidence; the total alone carries it." },
  { pin: "PG-2",  statement: "disc median luminance with all semantics suppressed ≤ 0.006",
    verdict: "LIVE", sites: [], note: "a render measurement under suppression; nothing in the product evaluates it." },
  { pin: "PG-3",  statement: "drawn body diameter ∈ [56, 92] px at 1920 × 1080, monotone in weightSum (A-G2)",
    verdict: "SPLIT", sites: [["field", "sizeFloor(b.drawnRadius, k)"], ["vm", "export function sizeFloor"], ["field", "data-testid=\"mapping-size-floor\""]],
    note: "the >= limb is ENFORCED: sizeFloor lifts any radius under the floor. But the product DISCLOSES the lift (`mapping-size-floor`, data-count), so the falsifiable quantity exists and is addressable — read the disclosure, not the radius. The <= 92 limb is unenforced and LIVE." },
  { pin: "PG-4",  statement: "every drawn body is named at L0 — required (BODY_NAMES_AT_L0 = true)",
    verdict: "OWNER LEVER", sites: [["field", "export const BODY_NAMES_AT_L0 = true"], ["field", "BODY_NAMES_AT_L0 || isMarked"]],
    note: "with the constant true the disjunction is unconditionally true at L0, so no render can fail it. The constant is one of PHASE_E §5's reversible OWNER levers (§8), so the pin states that a lever is set — it is not an obligation on the build and must not be reported as one." },
  { pin: "PG-5",  statement: "bodies drawn at L0 ≤ 7, the rest stated as overflow",
    verdict: "ZERO-BY-CONSTRUCTION", sites: [["field", "if (out.length >= budget) break;"], ["field", "PG-5 / PG-16: the bodies a level draws"]],
    note: "`spaced()` breaks at the budget, so the drawn count cannot exceed it for any build or constant. The product's own docstring names PG-5 as its implementation. Remedy: a mutant that removes the break must be caught." },
  { pin: "PG-6",  statement: "relations' share of the semantic light ≥ 0.15 (UNDERIVED; A-G143 showed no reconstruction yields 0.15)",
    verdict: "LIVE", sites: [], note: "the phase's live red. Nothing in the product evaluates it." },
  { pin: "PG-7",  statement: "travel is one shared period, deterministic, stops with the breath; its period an exact integer divisor of the breath's (A-G11)",
    verdict: "CONSTANT-ONLY", sites: [["field", "periodMs: 10000, dash: 7"], ["field", "periodMs: 10000, riseMs: 4000"]],
    note: "a relation between two source constants. Falsifiable by a BUILD but not by a render, so it belongs in a static assertion and never in a pixel run — and a pixel run against it would be measuring the renderer's clock, not the pin." },
  { pin: "PG-8",  statement: "hue is used for exactly one question, and that question is not carried by any other channel",
    verdict: "LIVE (source)", sites: [["field", "export const GAP_HUE"], ["field", "\"mf-halo-gap\", GAP_HUE, GAP_ALPHA_GAIN"]],
    note: "§62 A-G257 established by enumeration that GAP_HUE has exactly one carrier inside the field SVG. Falsifiable: a build that adds a second carrier fails it, and the check is a source enumeration rather than a render." },
  { pin: "PG-9",  statement: "the evidence bands' luminance separation (PF-2) is unchanged by hue, measured on the luminance plane",
    verdict: "LIVE", sites: [], note: "a render measurement. One mention in the whole record — the least exercised pin in the phase." },
  { pin: "PG-10", statement: "limb 1 swing fraction ≥ 0.25 · limb 2 Weber corridor [0.10, 0.35] (WITHDRAWN, §63 A-G261) · limb 3 max swing ≤ 0.030",
    verdict: "LIVE", sites: [["field", "export function depthGain"]],
    note: "§63 A-G260: limb 1 is a property of (build × population), 1280 population-independent and failing, 1920 contingent. Limb 3 breached at 1920 (§52). Nothing enforced by the product." },
  { pin: "PG-11", statement: "coherent motion energy on relation pixels ≥ 1.5 × that on medium pixels; INCONCLUSIVE unless the medium's energy exceeds its own dof-matched null by a factor (A-G115)",
    verdict: "LIVE, factor pending", sites: [],
    note: "the factor is PINK's to set under A-G115 and §62 A-G258 withdrew the floor it was to be set against. Status: INCONCLUSIVE-pending-form." },
  { pin: "PG-12", statement: "re-formed (A-G123/A-G126): signed projection onto the hue's own chromatic direction, paired by radius, thresholded in q_proj",
    verdict: "LIVE, region restated", sites: [["field", "\"mf-halo-gap\", GAP_HUE, GAP_ALPHA_GAIN"]],
    note: "§62 A-G257: satisfiable only on the glow-overlap region; one scalar outstanding from GRÜN." },
  { pin: "PG-13", statement: "retired (§36: no failing observation, 12–50 × looser than the rejected stage)",
    verdict: "RETIRED", sites: [], note: "caught by A-G128 in §37, at the cost of re-reading PINK's committed data." },
  { pin: "PG-14", statement: "every drawn body's rim lies inside the viewBox at every level; l0Margin re-derived from ρ_drawn",
    verdict: "ZERO-BY-CONSTRUCTION (with a falsifiable residue)", sites: [["field", "function frameWithBodies"], ["field", "for (let pass = 0; pass < 2; pass += 1)"], ["field", "export function l0Margin"]],
    note: "the frame is WIDENED to the union with every drawn body's extent, so containment holds by construction. The residue is the solve: the product's own comment says it is 'solved twice against the frame it widens' — a two-pass fixed point. THE FALSIFIABLE CONTENT OF PG-14 IS THE CONVERGENCE OF THAT SOLVE, not the containment, and no instrument in this phase has tested it." },
  { pin: "PG-15", statement: "the field ring and the horizon are drawn behind every body and occluded by it; no ring stroke crosses a body's drawn disc",
    verdict: "ZERO-BY-CONSTRUCTION", sites: [["field", "data-testid=\"mapping-ring-field\""], ["field", "data-testid=\"mapping-glows\""]],
    note: "SVG paints in document order and the rings precede `mapping-glows` and the bodies, so occlusion holds for any build that keeps the order. Remedy: a mutant that reorders the groups must be caught — not a pixel measurement of the occlusion." },
  { pin: "PG-16", statement: "free space between drawn body rims ≥ 0.3 × the eccentricity (CITED-WITHOUT-A-NUMBER, §62 A-G254)",
    verdict: "ZERO-BY-CONSTRUCTION", sites: [["field", "const clear = out.every(o => Math.hypot(o.x - b.x, o.y - b.y)"], ["field", "PG-5 / PG-16: the bodies a level draws"]],
    note: "GRÜN's finding, this sweep's origin. The pin predicate and the filter predicate are one expression. Remedy: delete the clearance term and a layout must visibly gain a crowded body." },
  { pin: "PG-17", statement: "withdrawn (§45 A-G165): R21 supplied no number, so it could justify the glow and never certify it",
    verdict: "WITHDRAWN", sites: [], note: "§63 A-G264: its product comment still carries a floor wrong by 0.075 r, which GRÜN is correcting." },
  { pin: "PG-18", statement: "at least one of the field's motions is self-propelled from rest and contingent on another object",
    verdict: "CONSTANT-ONLY + A-G144 HAZARD", sites: [["field", "departPct: 4, arrivePct: 56, restPct: 70"]],
    note: "`at least one` is a DISJUNCTION, and A-G144: a disjunctive pin is only as strong as its weakest escape — it cannot fail while any one motion qualifies. The travel's depart/arrive/rest profile is in the source as constants, so the pin is satisfied by source inspection and no render can move it." },
  { pin: "PG-19", statement: "retired (§45): R25 supplies one exponent and no exchange rate; R23 cannot fuse size with eccentricity",
    verdict: "RETIRED", sites: [], note: "caught by the gate before any run was spent — the gate's cheapest firing." },
  { pin: "PG-20", statement: "every symbol has an iconic or indexical reinforcement; the splay keys on the STATE, not the mark (A-G43); magnitude at the collar (A-G94)",
    verdict: "HELD", sites: [["field", "strokeWidth={(isMarked ? 2 * k : structure) + SEAT_PAD_PX * k}"], ["field", "data-mapping-body-shape r={r}"]],
    note: "§63 A-G263: the state-keying limb is held because no DOM or raster route can verify a re-key. The magnitude limb is complete (A-G94). The mutant is vitest-gated. NOTE a thing this sweep surfaced: `dashOf(b.line, …)` is applied at BOTH sites — the seat ring and the body shape — so the DASH (the symbol) is already keyed on the STATE `b.line` in register at two carriers. That is the symbol, not PG-20's reinforcement, and A-G43's re-keying is about the splay; stated here so the two are not conflated by the next reader." },
  { pin: "PG-21", statement: "with every field element suppressed, the light remaining inside the disc is ≤ the stage's own ground",
    verdict: "LIVE", sites: [["field", "const STAGE_GROUND_RGB"]],
    note: "a suppression render, measured exactly as the ghost was found. Falsifiable and unmeasured since the ghost." },
  { pin: "PG-22", statement: "seats and signs occupy ≤ 0.15 of the area of a body's ramp annulus (FLAT, UNDERIVED SCALE); controlling variable is a membership, not a scale (A-G44/A-G93)",
    verdict: "LIVE (geometric)", sites: [["field", "export const SEAT_PAD_PX = 1.6"], ["field", "export const STROKE_MIN_PX = 1.2"], ["field", "export const RING_WIDTH_PX = Object.freeze"]],
    note: "computable from constants and falsifiable. A-G93 completed its form; A-G44's scale form was rejected because the controlling variable is a membership." },
  { pin: "PG-23", statement: "a resting glow's RENDERED ALPHA does not vary across the breath — circle × group (§55/§56)",
    verdict: "CLEARS, one limb of two", sites: [["field", "className={b.shelf ? undefined : \"mf-wave mf-wave-halo\"}"]],
    note: "source limb delivered; the computed-style limb is unblocked by §62 A-G252 and dispatched." }
];

const f = (x, n = 4) => x.toFixed(n);
console.log("=".repeat(112));
console.log(`GELB · A-G128 SWEPT OVER EVERY PIN IN PHASE G — tree ${TREE.split("/").pop()} @ ${SHA}`);
console.log("=".repeat(112));
console.log("\nEvery 'site' below is an EXACT substring of the committed source. A row whose substring is");
console.log("absent, or occurs more than once, is reported as UNVERIFIED and its verdict does not stand.\n");

let unverified = 0, rows = 0;
const tally = {};
for (const p of PINS) {
  rows += 1;
  tally[p.verdict] = (tally[p.verdict] ?? 0) + 1;
  const checks = p.sites.map(([file, needle]) => ({ file, needle, ...locate(file, needle) }));
  const bad = checks.filter(c => !c.ok);
  if (bad.length > 0) unverified += 1;
  console.log("-".repeat(112));
  console.log(`${p.pin.padEnd(6)} ${p.verdict}${bad.length > 0 ? "   *** UNVERIFIED ***" : ""}`);
  console.log(`       ${p.statement}`);
  for (const c of checks) {
    const where = c.ok ? `${FILES[c.file]}:${c.line}` : (c.hits.length === 0 ? "NOT FOUND" : `AMBIGUOUS (${c.hits.length} hits: ${c.hits.join(", ")})`);
    console.log(`       ${c.ok ? "[ok]" : "[!!]"} ${where.padEnd(52)} "${c.needle.length > 48 ? c.needle.slice(0, 48) + "…" : c.needle}"`);
  }
  if (p.sites.length === 0) console.log("       [--] no product expression claimed — the pin is not enforced anywhere");
  console.log(`       → ${p.note}`);
}
console.log("-".repeat(112));
console.log(`\n${rows} pins. ${unverified} rows UNVERIFIED.\n`);
console.log("TALLY:");
for (const [k, v] of Object.entries(tally).sort((a, b) => b[1] - a[1])) console.log(`  ${String(v).padStart(2)}  ${k}`);

const zbc = PINS.filter(p => p.verdict.startsWith("ZERO-BY-CONSTRUCTION")).map(p => p.pin);
const notBuild = PINS.filter(p => ["ZERO-BY-CONSTRUCTION", "ZERO-BY-CONSTRUCTION (with a falsifiable residue)", "OWNER LEVER", "CONSTANT-ONLY", "CONSTANT-ONLY + A-G144 HAZARD"].includes(p.verdict)).map(p => p.pin);
console.log(`\nZERO-BY-CONSTRUCTION: ${zbc.join(", ")}`);
console.log(`NOT FALSIFIABLE BY ANY RENDER: ${notBuild.join(", ")}  (${notBuild.length} of ${rows})`);
console.log("\nWhat follows for the phase, and it is the point of the sweep:");
console.log("  · A-G128 was adopted in §37 and every pin measured before it skipped the gate. This is that");
console.log("    omission closed, and it fires on " + notBuild.length + " pins, none of which any measurement would");
console.log("    have cleared — because each is satisfied by the artifact's construction rather than by its");
console.log("    behaviour.");
console.log("  · For every ZERO-BY-CONSTRUCTION pin the remedy is one shape: pin the PRESENCE AND CORRECTNESS");
console.log("    of the enforcement with a mutant, not the output's compliance with a render. All three such");
console.log("    mutants are vitest assertions, so they land in the held-on-B-ENTRY bucket — which makes the");
console.log("    credential block larger and better understood than it was, not smaller.");
console.log("  · PG-14 is the one with a falsifiable residue and nobody has looked at it: the containment");
console.log("    holds by construction, and the TWO-PASS FIXED POINT that establishes it has never been");
console.log("    tested for convergence. That is a live, unmeasured obligation hiding inside a pin that");
console.log("    reads as trivially satisfied.");
console.log("=".repeat(112));
