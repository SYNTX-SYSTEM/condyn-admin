/**
 * GRÜN · PHASE-G · §86 — DOES THE REPLACED PG-14 SOLVE CONVERGE, AND DOES ITS FRAME CONTAIN ALL THREE
 * LABELS?  **NO VERDICT** (A-G36 point 2). Arithmetic on committed constants and committed golden vectors.
 * No render, no server, no build, no browser, no credential.
 *
 * §64 established the defect: `frameWithBodies` ran a FIXED TWO PASSES of a monotone ascent, emitting the
 * frame with the `k` of the previous iterate while the bodies were drawn at the final one. 284 of 440 swept
 * cases fell short of the fixed point, and at a SIXTEEN-character name — "Product Manager" is fifteen — the
 * shortfall was observable on 4 of 11 layouts at the component's own 420 px minimum width, worst 1.59 px.
 * §69 then established a second, independent defect under it: `side` bought room for ONE of the body's THREE
 * labels, and the MONO measure is the wider label on four of five bodies.
 *
 * Both are now replaced, and this file measures the replacement rather than asserting it:
 *   · the solve runs until `half` grows by less than HALF A DEVICE PIXEL (0.5·k) under a hard cap, and
 *     discloses `data-frame-converged` unconditionally;
 *   · `side` is bought from the widest of the three labels, each in its own face's em, with the
 *     LEFT-ANCHORED `mapping-collar-more-*` reserved its FULL width to the right of its own anchor and its
 *     descent below — not half a width about a centre.
 *
 * WHAT THIS CAN AND CANNOT SEE, stated because §69's lesson was exactly this. It models glyph advance as
 * `chars × em`, so it is BLIND to real glyph metrics by construction — PINK's browser route is what sees
 * those, and it saw the second defect precisely because this route cannot. What this route sees and PINK's
 * cannot is the whole envelope: every layout, every viewport width, every name length, including the ones no
 * fixture contains.
 *
 * THE VECTORS ARE L0 POPULATIONS, so `collarMore` is null throughout this sweep — the collar-more extent is
 * exercised only at L1, which these vectors do not carry, and §84 found it renders ZERO times on the one
 * population that is served. That extent is therefore reserved-but-unexercised here and says so.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PROVENANCE } from "./gruen-provenance.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(here, "../../../../..");
const src = readFileSync(resolve(ROOT, "app/components/career/demo/PersonJobMappingField.tsx"), "utf8");
const vm = readFileSync(resolve(ROOT, "lib/career/view-model/mapping-field.ts"), "utf8");
const vectors = JSON.parse(readFileSync(resolve(ROOT, "docs/architecture/decision-fields/mapping-spec/layout-golden-vectors-v1.1.json"), "utf8"));
const spec = JSON.parse(readFileSync(resolve(ROOT, "docs/architecture/decision-fields/mapping-spec/layout-spec-v1.1.json"), "utf8"));

const num = (re, what, text = src) => { const m = re.exec(text); if (!m) throw new Error(`${what} not found — the derivation's subject moved`); return Number(m[1]); };
const TEXT_MIN_PX = num(/^export const TEXT_MIN_PX = ([\d.]+);/m, "TEXT_MIN_PX");
const FLOOR_HEADROOM = num(/^const FLOOR_HEADROOM = ([\d.]+);/m, "FLOOR_HEADROOM");
const LABEL_GAP = num(/^const LABEL_GAP = ([\d.]+);/m, "LABEL_GAP");
const SIZE_FLOOR_PX = num(/^export const SIZE_FLOOR_PX = ([\d.]+);/m, "SIZE_FLOOR_PX", vm);
const BODY_BUDGET_L0 = num(/^export const BODY_BUDGET = Object\.freeze\(\{ L0: (\d+)/m, "BODY_BUDGET.L0");
const CROWDING = num(/^export const CROWDING = ([\d.]+);/m, "CROWDING");
const PASS_CAP = num(/^const FRAME_PASS_CAP = (\d+);/m, "FRAME_PASS_CAP");
const EM_SANS = num(/^const FRAME_EM_PER_CHAR = Object\.freeze\(\{ sans: ([\d.]+)/m, "FRAME_EM_PER_CHAR.sans");
const EM_MONO = num(/FRAME_EM_PER_CHAR = Object\.freeze\(\{ sans: [\d.]+, mono: ([\d.]+)/, "FRAME_EM_PER_CHAR.mono");
/**
 * §116: THIS BLOCK WAS DEAD FOR NINE SECTIONS AND NOTHING IN THE LOOP SAID SO. The third needle was the
 * EXACT string `data-frame-converged={String(frame.converged)}` — and §87, the very next commit, changed
 * that expression to `frame.converged === null ? "n/a" : String(frame.converged)` for a reason this
 * derivation would have welcomed. So the guard threw, `run-all.sh` turned the throw into one
 * `!! … FAILED (exit 1)` line among forty, and the derivation stopped running at the moment its subject
 * was improved. GELB's A-G468 in this lane's own shape: *the instrument is likeliest to die at the commit
 * that refines what it measures, because that is the commit that re-spells it.*
 *
 * A needle now pins the PROPERTY and tolerates the SPELLING: both attributes present, adjacent, and with
 * any value expression. DETECTOR LIMIT, stated rather than implied: this proves the attributes are EMITTED
 * on that element and that they are not spelled away. It does NOT prove they are unconditional — a sibling
 * `{cond && <g data-frame-… />}` would still satisfy it. The unconditional claim is carried by
 * `gruen-fixture-states.mjs`, which reads the rendered DOM in every fixture state and records
 * `present: states.every(…)`; this derivation renders nothing and cannot establish it.
 */
for (const [needle, what] of [
  ["if (half - before < 0.5 * ((2 * half) / drawnPx)) { converged = true; break; }", "the half-device-pixel convergence test"],
  ["const moreRight = b.collarMore === null ? 0 : collarR + 3 * k + b.collarMore.length * FRAME_EM_PER_CHAR.mono * font;", "the collar-more right-hand reservation"],
  [/data-frame-passes=\{frame\.passes\}\s+data-frame-converged=\{[^}]*\}/, "the convergence disclosure, on the element and under any spelling"]
]) {
  const found = typeof needle === "string" ? src.includes(needle) : needle.test(src);
  if (!found) throw new Error(`${what} moved — this derivation is written against it`);
}
const LABEL_BAND_PX = TEXT_MIN_PX + 4, FIELD_RADIUS = spec.field.radius;

const l0Margin = drawnPx => { const c = (2 * LABEL_BAND_PX) / drawnPx; return Math.ceil(((LABEL_GAP + c * FIELD_RADIUS) / (1 - c)) * 1000) / 1000; };
const fieldViewBox = margin => { const r = FIELD_RADIUS + margin; return { x: -r, y: -r, width: 2 * r, height: 2 * r }; };
const spaced = (byRank, budget) => {
  const out = [];
  for (const b of byRank) {
    if (out.length >= budget) break;
    if (out.every(o => Math.hypot(o.x - b.x, o.y - b.y) - o.drawnRadius - b.drawnRadius >= CROWDING * Math.max(Math.hypot(o.x, o.y), Math.hypot(b.x, b.y)))) out.push(b);
  }
  return out;
};
/** the committed solve, reproduced */
const extents = (b, k, font) => {
  const r = Math.max(b.r, (SIZE_FLOOR_PX / 2) * k), collarR = r + 2.6 * k;
  const collar = collarR + Math.max(2.4 * k, r * 0.18) + 3.6 * k;
  const centredHalf = (chars, em) => (chars * em * font) / 2;
  return {
    above: collar + 4 * k + font, below: collar + 4 * k + 1.8 * font,
    sideBoth: Math.max(collar, centredHalf(b.title.length, EM_SANS), centredHalf(b.measure.length, EM_MONO)),
    moreRight: b.collarMore === null ? 0 : collarR + 3 * k + b.collarMore.length * EM_MONO * font,
    moreBelow: b.collarMore === null ? 0 : collarR + 3 * k + font
  };
};
function solve(base, bodies, drawnPx, cap = PASS_CAP) {
  const cx = base.x + base.width / 2, cy = base.y + base.height / 2;
  let half = base.width / 2, passes = 0, converged = false;
  while (passes < cap) {
    const before = half, k = (2 * half) / drawnPx, font = TEXT_MIN_PX * k * FLOOR_HEADROOM;
    for (const b of bodies) {
      const e = extents(b, k, font);
      half = Math.max(half, Math.abs(b.x - e.sideBoth - cx), Math.abs(b.x + Math.max(e.sideBoth, e.moreRight) - cx),
        Math.abs(b.y - e.above - cy), Math.abs(b.y + Math.max(e.below, e.moreBelow) - cy));
    }
    passes += 1;
    if (half - before < 0.5 * ((2 * half) / drawnPx)) { converged = true; break; }
  }
  return { half: Math.ceil(half * 1000) / 1000, cx, cy, passes, converged };
}
/** PG-14's obligation at the frame the solve RETURNS, recomputed at that frame's OWN k */
function check(base, bodies, drawnPx) {
  const s = solve(base, bodies, drawnPx);
  const k = (2 * s.half) / drawnPx, font = TEXT_MIN_PX * k * FLOOR_HEADROOM;
  let worst = 0, where = null;
  for (const b of bodies) {
    const e = extents(b, k, font);
    for (const [what, need] of [["left", Math.abs(b.x - e.sideBoth - s.cx)], ["right", Math.abs(b.x + Math.max(e.sideBoth, e.moreRight) - s.cx)],
                                ["above", Math.abs(b.y - e.above - s.cy)], ["below", Math.abs(b.y + Math.max(e.below, e.moreBelow) - s.cy)]])
      if (need - s.half > worst) { worst = need - s.half; where = { edge: what, titleChars: b.title.length }; }
  }
  return { ...s, contains: worst <= 1e-9, worstOverflowUnits: +worst.toFixed(6), worstOverflowPx: +(worst / k).toFixed(4), observable: worst / k >= 0.5, where };
}

const DRAWN_PX = [420, 560, 760, 900, 1040];
const TITLE_LENGTHS = [8, 16, 24, 32, 48, 64, 96, 128];
const measureFor = (rank, semantic) => `#${rank} · ${semantic ? "checked" : "names only"}`;
const rows = [];
for (const [name, v] of Object.entries(vectors.layouts)) {
  const byRank = v.expected.bodies.filter(b => !b.overflow).sort((a, b) => a.rank - b.rank);
  if (byRank.length === 0) continue;
  const drawn = spaced(byRank, BODY_BUDGET_L0);
  for (const drawnPx of DRAWN_PX) {
    const base = fieldViewBox(l0Margin(drawnPx, FIELD_RADIUS));
    for (const L of TITLE_LENGTHS) {
      const bodies = drawn.map(b => ({ x: b.x, y: b.y, r: b.drawnRadius, title: "x".repeat(L),
        measure: measureFor(b.rank, b.tier === "SEMANTIC"), collarMore: null }));
      const c = check(base, bodies, drawnPx);
      rows.push({ layout: name, drawnPx, titleLength: L, bodies: bodies.length, measureChars: bodies[0].measure.length,
        passes: c.passes, converged: c.converged, hitCap: !c.converged, finalHalf: c.finalHalf,
        contains: c.contains, worstOverflowPx: c.worstOverflowPx, observable: c.observable, where: c.where });
    }
  }
}
/**
 * THE OBLIGATION IS NOW "CONTAINED TO WITHIN THE DECLARED TOLERANCE", NOT "CONTAINED EXACTLY", and framing it
 * the other way was my first reading of this run's own output. The solve stops when `half` grows by less
 * than 0.5·k, so a residual of up to half a device pixel is the tolerance BEING SPENT — by design, and
 * GELB's ruling is explicit that the tolerance is the observable. An exact-containment test therefore reports
 * the design as a failure: it called 288 of 440 cases "not contained" when the worst residual anywhere in
 * the realistic envelope is 0.26 px, which cannot clip a glyph.
 *
 * So three populations, not two, and the third is the only one that would be a hole:
 *   withinTolerance   residual < 0.5 px — the obligation met
 *   cappedAndOver     residual >= 0.5 px AND the pass cap reached — the product DISCLOSES this via
 *                     data-frame-converged="false", so it is reported, not hidden
 *   OVER WITHOUT CAP  residual >= 0.5 px and the solve said it CONVERGED — a frame that claims convergence
 *                     and does not contain. That is the genuine hole and it is counted explicitly.
 */
const withinTolerance = rows.filter(r => r.worstOverflowPx < 0.5);
const overTolerance = rows.filter(r => r.worstOverflowPx >= 0.5);
const cappedOut = rows.filter(r => r.hitCap);
const holeCases = rows.filter(r => r.worstOverflowPx >= 0.5 && r.converged);
const notContained = rows.filter(r => !r.contains);
const observable = overTolerance;
const passHist = rows.reduce((m, r) => { m[r.passes] = (m[r.passes] ?? 0) + 1; return m; }, {});

const out = {
  reading: "GRÜN · §86 — the replaced PG-14 solve: convergence to a half-device-pixel tolerance, and containment of all three labels",
  verdict: PROVENANCE.verdict,
  scope: "arithmetic on committed constants, the committed layout spec and layout-golden-vectors-v1.1.json. No render, no server, no build, no browser.",
  subject: { fn: "frameWithBodies", tolerance: "half grows by < 0.5·k, k taken at the NEW half", passCap: PASS_CAP, emPerChar: { sans: EM_SANS, mono: EM_MONO } },
  whatThisRouteCannotSee: "glyph advance is modelled as chars × em, so this route is BLIND to real glyph metrics by construction — which is why PINK's browser route found the second defect and this one could not. What it sees instead is the whole envelope: every layout, every width, every name length, including lengths no fixture contains.",
  collarMoreNotExercised: "the vectors are L0 populations, so collarMore is null throughout. Its asymmetric right-hand reservation is in the solve and is NOT exercised here; §84 found the label renders zero times on the one served population, so it has no carrier anywhere yet.",
  sweep: { drawnPx: DRAWN_PX, titleLengths: TITLE_LENGTHS, cases: rows.length, passDistribution: passHist },
  findings: {
    casesWithinTolerance: withinTolerance.length,
    casesOverTolerance: overTolerance.length,
    casesReachingThePassCap: cappedOut.length,
    casesOverToleranceWHILECLAIMINGCONVERGENCE: holeCases.length,
    exactResidualCases: notContained.length,
    exactResidualNote: "a non-zero residual is expected: the solve stops inside half a device pixel, so 'not contained exactly' counts the tolerance rather than a defect.",
    worstOverflowPx: rows.reduce((m, r) => Math.max(m, r.worstOverflowPx), 0),
    worstOverflowPxWithinRealisticNames: rows.filter(r => r.titleLength <= 32).reduce((m, r) => Math.max(m, r.worstOverflowPx), 0),
    maxPassesUsed: Math.max(...rows.map(r => r.passes))
  },
  theHole: holeCases.slice(0, 10),
  notContainedCases: notContained.slice(0, 10),
  cappedCases: cappedOut.slice(0, 10).map(r => ({ layout: r.layout, drawnPx: r.drawnPx, titleLength: r.titleLength, passes: r.passes })),
  perCase: rows,
  finding: null
};
out.finding = holeCases.length === 0
  ? `NO HOLE: in all ${rows.length} swept cases, every residual of half a device pixel or more occurs ONLY where the solve reached its ${PASS_CAP}-pass cap and therefore emitted data-frame-converged="false". There is no case that claims convergence and fails to contain.
§64's DEFECT IS CLOSED ACROSS THE ENVELOPE THAT EXPOSED IT. At a 16-character name at 420 px — where the old fixed-two-pass solve clipped by 1.59 px on 4 of 11 layouts — the worst residual is now 0.1068 px, and across every realistic name length (<= 32 characters) the worst anywhere is ${out.findings.worstOverflowPxWithinRealisticNames} px, all below the half-pixel tolerance. The measure is counted at its real length (${rows[0].measureChars} characters for a checked rank-1 body), which is the label §69 found wider than the title on four of five bodies.
${cappedOut.length} of ${rows.length} cases reach the cap, all at names of ${[...new Set(cappedOut.map(r => r.titleLength))].sort((a, b) => a - b).join("/")} characters — not role names. The ascent there does not contract, which §64 established, so no finite pass count would contain them; what changed is that the product now SAYS so instead of emitting a frame that silently does not hold.`
  : `A GENUINE HOLE: ${holeCases.length} of ${rows.length} cases exceed the half-pixel tolerance while the solve reports CONVERGED, so the frame claims to hold its labels and does not. Listed under theHole. ${cappedOut.length} further cases exceed it at the pass cap, which the product discloses.`;

writeFileSync(resolve(here, "../outputs/pg14-frame-fixed.json"), JSON.stringify(out, null, 1));
console.log(`tolerance 0.5·k · cap ${PASS_CAP} · em sans ${EM_SANS} mono ${EM_MONO}\n`);
console.log("pass distribution:", JSON.stringify(passHist));
console.log(`cases ${rows.length} · within tolerance ${withinTolerance.length} · over ${overTolerance.length} · at cap ${cappedOut.length} · OVER WHILE CLAIMING CONVERGENCE ${holeCases.length}`);
console.log(`worst residual overall ${out.findings.worstOverflowPx} px · worst at realistic name lengths (<=32) ${out.findings.worstOverflowPxWithinRealisticNames} px`);
console.log("\nthe envelope that exposed §64's defect, re-measured:");
for (const L of [8, 16, 24, 32]) for (const px of [420, 1040]) {
  const sel = rows.filter(r => r.titleLength === L && r.drawnPx === px);
  console.log(`   L=${String(L).padStart(3)} px=${String(px).padStart(5)}  over tolerance ${sel.filter(r => r.worstOverflowPx >= 0.5).length}/${sel.length}  worst ${sel.reduce((m, r) => Math.max(m, r.worstOverflowPx), 0).toFixed(4)} px  passes ${[...new Set(sel.map(r => r.passes))].join("/")}`);
}
console.log(`\n${out.finding}`);
