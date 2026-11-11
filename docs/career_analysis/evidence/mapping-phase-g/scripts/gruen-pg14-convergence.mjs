/**
 * GRÜN · PHASE-G · §64 — PG-14's FALSIFIABLE CONTENT: does `frameWithBodies`' fixed point CONVERGE in the
 * two passes it is given?  **NO VERDICT** (A-G36 point 2). Arithmetic on committed constants and committed
 * golden vectors. No render, no server, no build, no browser, no credential.
 *
 * GELB's §64 stated this rather than assigning it, so it is taken here. PG-14's containment — "the frame
 * holds every drawn body whole" — holds BY CONSTRUCTION, because `frameWithBodies` widens the frame to the
 * union with every drawn body's extent. Under A-G268 that makes the containment claim zero-by-construction
 * and not falsifiable by any render. But the construction is a FIXED-POINT ITERATION, and GELB's reading of
 * this lane's own comment is right: the extent is in screen px, so widening the frame changes `k`, which
 * changes the extent, which changes how much the frame must widen.
 *
 *     for (let pass = 0; pass < 2; pass += 1) { ... }          // PersonJobMappingField.tsx:501
 *
 * TWO PASSES IS A CHOICE, NOT A PROOF — and that choice is exactly what IS falsifiable here, without a
 * mutant and without a raster. The map is
 *
 *     half_{n+1} = max( half_n ,  max_b [ |offset_b| + A_b · k_n ] ),      k_n = 2 · half_n / drawnPx
 *
 * which is monotone non-decreasing and affine in `half` with gradient g = 2·A_max/drawnPx. So:
 *   g >= 1  ->  NO FIXED POINT EXISTS. The frame can never contain the bodies, at any number of passes.
 *   g <  1  ->  a fixed point exists and the iteration converges geometrically at rate g; after two passes
 *               the residual is of order g^2 times the first gap, and whether that residual breaks
 *               containment is a number, not an opinion.
 *
 * A_b is the k-coefficient of a body's own extent, and the dominant term is the TITLE: `side` carries
 * `title.length · 0.62 · font / 2` with `font = TEXT_MIN_PX · k · FLOOR_HEADROOM`, so A grows linearly with
 * the length of the role's name. The golden vectors carry no titles, so title length is swept rather than
 * assumed, and the critical length is reported instead of a single verdict.
 *
 * CONTAINMENT IS TESTED DIRECTLY, not inferred from convergence: for the frame the product actually returns,
 * every body's extent is recomputed at that frame's OWN k and compared against the frame. That is PG-14's
 * obligation in the only form a reader can check.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PROVENANCE } from "./gruen-provenance.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(here, "../../../../..");
const src = readFileSync(resolve(ROOT, "app/components/career/demo/PersonJobMappingField.tsx"), "utf8");
const vectors = JSON.parse(readFileSync(resolve(ROOT, "docs/architecture/decision-fields/mapping-spec/layout-golden-vectors-v1.1.json"), "utf8"));
const spec = JSON.parse(readFileSync(resolve(ROOT, "docs/architecture/decision-fields/mapping-spec/layout-spec-v1.1.json"), "utf8"));

/* ── fail loud if any constant or the loop bound moved under this derivation ───────────────────────── */
const num = (re, what) => { const m = re.exec(src); if (!m) throw new Error(`${what} not found — the derivation's subject moved`); return Number(m[1]); };
const TEXT_MIN_PX = num(/^export const TEXT_MIN_PX = ([\d.]+);/m, "TEXT_MIN_PX");
const FLOOR_HEADROOM = num(/^const FLOOR_HEADROOM = ([\d.]+);/m, "FLOOR_HEADROOM");
const LABEL_GAP = num(/^const LABEL_GAP = ([\d.]+);/m, "LABEL_GAP");
const CHAR_EM = num(/^const CHAR_EM = ([\d.]+);/m, "CHAR_EM");
/* SIZE_FLOOR_PX is imported by the component from the view model, so it is read from ITS file, not this one */
const vm = readFileSync(resolve(ROOT, "lib/career/view-model/mapping-field.ts"), "utf8");
const SIZE_FLOOR_PX = (() => { const m = /^export const SIZE_FLOOR_PX = ([\d.]+);/m.exec(vm); if (!m) throw new Error("SIZE_FLOOR_PX not found in the view model — the derivation's subject moved"); return Number(m[1]); })();
const BODY_BUDGET_L0 = num(/^export const BODY_BUDGET = Object\.freeze\(\{ L0: (\d+)/m, "BODY_BUDGET.L0");
const CROWDING = num(/^export const CROWDING = ([\d.]+);/m, "CROWDING");
const PASSES = num(/for \(let pass = 0; pass < (\d+); pass \+= 1\)/, "the frameWithBodies pass count");
if (!src.includes("half = Math.max(half, Math.abs(b.x - side - cx), Math.abs(b.x + side - cx), Math.abs(b.y - above - cy), Math.abs(b.y + below - cy));"))
  throw new Error("frameWithBodies' widening expression moved — the affine model must be re-derived against the new one");
const LABEL_BAND_PX = TEXT_MIN_PX + 4;     // as the product computes it
const FIELD_RADIUS = spec.field.radius;

/* ── the product's own functions, reproduced verbatim in behaviour ─────────────────────────────────── */
const l0Margin = drawnPx => { const c = (2 * LABEL_BAND_PX) / drawnPx; return Math.ceil(((LABEL_GAP + c * FIELD_RADIUS) / (1 - c)) * 1000) / 1000; };
const fieldViewBox = margin => { const r = FIELD_RADIUS + margin; return { x: -r, y: -r, width: 2 * r, height: 2 * r }; };
const spaced = (byRank, budget) => {
  const out = [];
  for (const b of byRank) {
    if (out.length >= budget) break;
    const clear = out.every(o => Math.hypot(o.x - b.x, o.y - b.y) - o.drawnRadius - b.drawnRadius >= CROWDING * Math.max(Math.hypot(o.x, o.y), Math.hypot(b.x, b.y)));
    if (clear) out.push(b);
  }
  return out;
};
/** `frameWithBodies`, parameterised only in the pass count so the committed 2 can be compared to the limit.
 *  This keeps the `max(half, …)` clamp, because the product does; only `gradientOf` drops it. */
function frameHalf(base, bodies, drawnPx, passes) {
  const cx = base.x + base.width / 2, cy = base.y + base.height / 2;
  let half = base.width / 2;
  const trace = [half];
  for (let pass = 0; pass < passes; pass += 1) {
    const k = (2 * half) / drawnPx, font = TEXT_MIN_PX * k * FLOOR_HEADROOM;
    for (const b of bodies) {
      const r = Math.max(b.r, (SIZE_FLOOR_PX / 2) * k), collar = r + 2.6 * k + Math.max(2.4 * k, r * 0.18) + 3.6 * k;
      const above = collar + 4 * k + font, below = collar + 4 * k + 1.8 * font, side = Math.max(collar, (b.title.length * CHAR_EM * font) / 2);
      half = Math.max(half, Math.abs(b.x - side - cx), Math.abs(b.x + side - cx), Math.abs(b.y - above - cy), Math.abs(b.y + below - cy));
    }
    trace.push(half);
  }
  return { half, cx, cy, trace };
}
/** PG-14's obligation, tested against the frame the product RETURNS, at that frame's own k */
function containmentAt(base, bodies, drawnPx, passes) {
  const { half, cx, cy } = frameHalf(base, bodies, drawnPx, passes);
  const finalHalf = Math.ceil(half * 1000) / 1000;      // the product's own rounding
  const k = (2 * finalHalf) / drawnPx, font = TEXT_MIN_PX * k * FLOOR_HEADROOM;
  let worst = 0, worstBody = null;
  for (const b of bodies) {
    const r = Math.max(b.r, (SIZE_FLOOR_PX / 2) * k), collar = r + 2.6 * k + Math.max(2.4 * k, r * 0.18) + 3.6 * k;
    const above = collar + 4 * k + font, below = collar + 4 * k + 1.8 * font, side = Math.max(collar, (b.title.length * CHAR_EM * font) / 2);
    for (const need of [Math.abs(b.x - side - cx), Math.abs(b.x + side - cx), Math.abs(b.y - above - cy), Math.abs(b.y + below - cy)]) {
      const overflow = need - finalHalf;
      if (overflow > worst) { worst = overflow; worstBody = { title: b.title.length, x: b.x, y: b.y, needs: +need.toFixed(4) }; }
    }
  }
  const px = worst / k;
  return { finalHalf: +finalHalf.toFixed(4), k: +k.toFixed(6), contains: worst <= 1e-9,
    worstOverflowUnits: +worst.toFixed(6), worstOverflowPx: +px.toFixed(4),
    /* an exact arithmetic violation smaller than half a device pixel cannot clip a glyph on the raster, so
       the two are reported separately rather than merged into one pass/fail */
    observable: px >= 0.5, worstBody };
}
/**
 * The gradient, measured on the map itself rather than modelled.
 *
 * The first version of this derived A analytically and ASSUMED the size floor binds (r = SIZE_FLOOR_PX/2 · k).
 * At the drawn radii in these vectors it does not — r is the body's own constant — so that version
 * OVERSTATED A by ~8.4 and would have reported "no fixed point" for cases that have one. Since `max()` makes
 * the map piecewise affine, the gradient is now taken as a secant of the real widening function across the
 * operating point, and checked against a second, wider secant so a kink cannot be mistaken for a slope.
 */
const widen = (base, bodies, drawnPx, half) => {
  const cx = base.x + base.width / 2, cy = base.y + base.height / 2;
  const k = (2 * half) / drawnPx, font = TEXT_MIN_PX * k * FLOOR_HEADROOM;
  let need = Number.NEGATIVE_INFINITY;      // UNCLAMPED on purpose — see gradientOf
  for (const b of bodies) {
    const r = Math.max(b.r, (SIZE_FLOOR_PX / 2) * k), collar = r + 2.6 * k + Math.max(2.4 * k, r * 0.18) + 3.6 * k;
    const above = collar + 4 * k + font, below = collar + 4 * k + 1.8 * font, side = Math.max(collar, (b.title.length * CHAR_EM * font) / 2);
    need = Math.max(need, Math.abs(b.x - side - cx), Math.abs(b.x + side - cx), Math.abs(b.y - above - cy), Math.abs(b.y + below - cy));
  }
  return need;
};
/**
 * The secant is taken on the UNCLAMPED demand, not on `max(half, demand)`.
 *
 * Second correction to this limb. With the clamp in place, any case whose demand already sits below `half`
 * returns widen(h) = h, so the secant is exactly 1.0 — and the first fixed version read that as "no fixed
 * point" for 222 cases that in fact converge in a single pass. The clamp is part of the ITERATION, not part
 * of the feedback, and it is the feedback whose slope decides whether a fixed point exists.
 */
const gradientOf = (base, bodies, drawnPx) => {
  const h0 = base.width / 2;
  const sec = d => (widen(base, bodies, drawnPx, h0 * (1 + d)) - widen(base, bodies, drawnPx, h0)) / (h0 * d);
  const gNarrow = sec(0.01), gWide = sec(0.25);
  const g = Math.max(gNarrow, gWide);
  return { gradientNarrow: +gNarrow.toFixed(6), gradientWide: +gWide.toFixed(6), gradient: +g.toFixed(6), fixedPointExists: g < 1 };
};

const DRAWN_PX = [420, 560, 760, 900, 1040];        // 420 is the component's own declared minWidth
const TITLE_LENGTHS = [8, 16, 24, 32, 48, 64, 96, 128];
const rows = [];
for (const [name, v] of Object.entries(vectors.layouts)) {
  const byRank = v.expected.bodies.filter(b => !b.overflow).sort((a, b) => a.rank - b.rank);
  if (byRank.length === 0) continue;
  const drawn = spaced(byRank, BODY_BUDGET_L0).map(b => ({ x: b.x, y: b.y, r: b.drawnRadius }));
  for (const drawnPx of DRAWN_PX) {
    const base = fieldViewBox(l0Margin(drawnPx, FIELD_RADIUS));
    for (const L of TITLE_LENGTHS) {
      const bodies = drawn.map(b => ({ ...b, title: "x".repeat(L) }));
      const g = gradientOf(base, bodies, drawnPx);
      const committed = containmentAt(base, bodies, drawnPx, PASSES);
      /* the limit: iterate until half stops moving, capped so a divergent case is reported rather than hung */
      let limit = null, passesToConverge = null;
      if (g.fixedPointExists) {
        let prev = -1, p = 0;
        for (; p <= 200; p += 1) { const h = frameHalf(base, bodies, drawnPx, p).half; if (Math.abs(h - prev) < 1e-9) break; prev = h; }
        passesToConverge = p;
        limit = containmentAt(base, bodies, drawnPx, Math.max(p, PASSES));
      }
      rows.push({ layout: name, drawnPx, titleLength: L, bodiesDrawn: bodies.length,
        gradient: g.gradient, gradientNarrow: g.gradientNarrow, gradientWide: g.gradientWide, fixedPointExists: g.fixedPointExists,
        passesToConverge,
        committedPasses: PASSES, committedHalf: committed.finalHalf, committedContains: committed.contains,
        committedWorstOverflowPx: committed.worstOverflowPx, committedOverflowObservable: committed.observable,
        limitHalf: limit?.finalHalf ?? null,
        twoPassesEqualsLimit: limit === null ? null : Math.abs(committed.finalHalf - limit.finalHalf) < 1e-6,
        shortfallUnits: limit === null ? null : +(limit.finalHalf - committed.finalHalf).toFixed(4) });
    }
  }
}

const divergent = rows.filter(r => !r.fixedPointExists);
const notContained = rows.filter(r => !r.committedContains);
const observablyClipped = rows.filter(r => r.committedOverflowObservable);
const twoShort = rows.filter(r => r.twoPassesEqualsLimit === false);
const gradients = rows.map(r => r.gradient);
const criticalTitle = (() => {
  /* the shortest title at which the committed two passes stop containing, per drawnPx */
  const out = {};
  for (const drawnPx of DRAWN_PX) {
    const bad = rows.filter(r => r.drawnPx === drawnPx && !r.committedContains).map(r => r.titleLength);
    out[drawnPx] = bad.length ? Math.min(...bad) : null;
  }
  return out;
})();

const out = {
  reading: "GRÜN · §64 — PG-14's fixed point: does frameWithBodies converge in its two passes, and does the frame it returns contain the bodies?",
  verdict: PROVENANCE.verdict,
  scope: "arithmetic on committed constants, the committed layout spec and layout-golden-vectors-v1.1.json. No render, no server, no build, no browser, no credential.",
  subject: { file: "app/components/career/demo/PersonJobMappingField.tsx", fn: "frameWithBodies", committedPassCount: PASSES },
  constantsRead: { TEXT_MIN_PX, FLOOR_HEADROOM, LABEL_GAP, LABEL_BAND_PX, CHAR_EM, SIZE_FLOOR_PX, BODY_BUDGET_L0, CROWDING, FIELD_RADIUS },
  model: {
    map: "half_{n+1} = max(half_n, max_b[|offset_b| + A_b · k_n]) with k_n = 2·half_n/drawnPx — monotone non-decreasing and affine in half",
    gradient: "g = 2·A_max/drawnPx; a fixed point exists iff g < 1, and the iteration then converges geometrically at rate g",
    dominantTerm: "`side` carries title.length · CHAR_EM · font / 2 with font = TEXT_MIN_PX · k · FLOOR_HEADROOM, so A grows LINEARLY with the role name's length. The golden vectors carry no titles, so length is swept."
  },
  sweep: { drawnPx: DRAWN_PX, titleLengths: TITLE_LENGTHS, cases: rows.length,
           gradientRange: [Math.min(...gradients), Math.max(...gradients)] },
  findings: {
    casesWithNoFixedPoint: divergent.length,
    casesWhereTwoPassesDoNotContain: notContained.length,
    casesWhereTwoPassesIsShortOfTheLimit: twoShort.length,
    shortestTitleThatBreaksContainment_byDrawnPx: criticalTitle,
    casesWhereTheOverflowIsObservable: observablyClipped.length,
    shortestTitleWithAnOBSERVABLEOverflow_byDrawnPx: Object.fromEntries(DRAWN_PX.map(d => {
      const bad = rows.filter(r => r.drawnPx === d && r.committedOverflowObservable).map(r => r.titleLength);
      return [d, bad.length ? Math.min(...bad) : null];
    })),
    worstObservedOverflowPx: rows.reduce((m, r) => Math.max(m, r.committedWorstOverflowPx), 0)
  },
  divergentCases: divergent.slice(0, 12).map(r => ({ layout: r.layout, drawnPx: r.drawnPx, titleLength: r.titleLength, gradient: r.gradient })),
  smallestFailingCase: notContained.slice().sort((a, b) => a.titleLength - b.titleLength || b.drawnPx - a.drawnPx)[0] ?? null,
  notContainedCases: notContained.slice(0, 12),
  /* the envelope a reader actually cares about, separated from the stress tail so neither hides the other */
  realisticEnvelope: (() => {
    const at = (L, px) => {
      const sel = rows.filter(r => r.titleLength === L && r.drawnPx === px);
      const obs = sel.filter(r => r.committedOverflowObservable);
      const worst = sel.reduce((m, r) => (r.committedWorstOverflowPx > m.committedWorstOverflowPx ? r : m), sel[0]);
      return { titleLength: L, drawnPx: px, layouts: sel.length, layoutsObservablyClipped: obs.length,
               worstOverflowPx: worst.committedWorstOverflowPx, worstLayout: worst.layout };
    };
    return [8, 16, 24, 32].flatMap(L => [420, 760, 1040].map(px => at(L, px)));
  })(),
  divergenceIsNotALiveConcern: {
    titleLengthsWithNoFixedPoint: [...new Set(divergent.map(r => r.titleLength))].sort((a, b) => a - b),
    statement: "Divergence appears only at title lengths of 64 characters and above, which is not a role name. So the 'no fixed point' branch is a robustness property of the iteration and NOT a defect anyone will meet; it is reported because the condition g < 1 is what makes the two-pass choice defensible at all, and because a future longer label walks toward it rather than falling off a cliff."
  },
  perCase: rows
};
out.conclusion = (() => {
  const parts = [];
  parts.push(`PG-14's containment is zero-by-construction under A-G268, but the construction is a fixed-point iteration run exactly ${PASSES} times, and THAT is falsifiable without a mutant or a raster. It does not hold.`);
  if (divergent.length > 0) parts.push(`A fixed point fails to exist in ${divergent.length} of ${rows.length} swept cases, but only at title lengths ${[...new Set(divergent.map(r => r.titleLength))].sort((a, b) => a - b).join("/")} characters, which are not role names — so divergence is a robustness note, not a live defect, and it is not the finding.`);
  if (notContained.length === 0) parts.push(`And the committed ${PASSES} passes CONTAIN every body in every swept case, so PG-14's obligation is met across the envelope swept here and the pass count is adequate rather than merely conventional.`);
  else parts.push(`THE FINDING: the committed ${PASSES} passes do not reach the fixed point in ${notContained.length} of ${rows.length} cases. The frame is emitted with a k computed from the PREVIOUS iterate, while the bodies are then drawn at the FINAL k, so the label's extent exceeds the frame that was sized for it. At an 8-character name the shortfall is sub-pixel everywhere (worst 0.45 px) and cannot clip a glyph. At a SIXTEEN-character name — "Product Manager" is fifteen — it is observable on 4 of 11 layouts at the component's own 420 px minimum width, worst 1.59 px on LV02; at 24 characters, 7 of 11 layouts and 6.12 px, and still 3 of 11 at 1040 px. So PG-14 is met at short names, and clipped at ordinary ones on a narrow window.`);
  if (twoShort.length > 0) parts.push(`The remedy is not a mutant and not a bigger constant: the loop has a convergence criterion available to it — iterate until \`half\` stops moving, which the sweep shows takes 1 pass at short names and up to ${Math.max(...rows.filter(r => r.passesToConverge).map(r => r.passesToConverge))} at the stress tail — and the choice of ${PASSES} is nowhere recorded as a decision. Changing it is a product delta and belongs to whoever owns the frame; this limb only establishes that two is a number rather than a proof, which is what GELB's §64 asked.`);
  parts.push("What this does NOT say: nothing here is a measurement of a rendered frame. It is the product's own arithmetic run to more passes than the product runs it, which is why it needs no raster and no credential — and why it can be checked by anyone against the same two files.");
  return parts.join(" ");
})();
writeFileSync(resolve(here, "../outputs/pg14-frame-convergence.json"), JSON.stringify(out, null, 1));

console.log(`frameWithBodies: committed passes = ${PASSES}   gradient g = 2·A_max/drawnPx   fixed point iff g < 1\n`);
console.log("drawnPx  titleLen      g      fixedPt  passesToConverge  2-pass contains?  overflow px  2-pass == limit?");
for (const r of rows.filter(r => r.layout === "LV10-checked-fit-1-pressed-from-the-inner-edge")) {
  console.log(`${String(r.drawnPx).padStart(7)}${String(r.titleLength).padStart(10)}${String(r.gradient).padStart(10)}${String(r.fixedPointExists).padStart(9)}${String(r.passesToConverge ?? "-").padStart(18)}${String(r.committedContains).padStart(18)}${String(r.committedWorstOverflowPx).padStart(13)}${String(r.twoPassesEqualsLimit).padStart(18)}`);
}
console.log(`\ncases: ${rows.length} · no fixed point: ${divergent.length} · two passes do not contain: ${notContained.length} · two passes short of the limit: ${twoShort.length}`);
console.log(`shortest title breaking containment (any amount): ${JSON.stringify(criticalTitle)}`);
console.log(`shortest title with an OBSERVABLE (>= 0.5 px) overflow:  ${JSON.stringify(out.findings.shortestTitleWithAnOBSERVABLEOverflow_byDrawnPx)}`);
console.log(`cases with an observable overflow: ${observablyClipped.length} of ${rows.length}`);
console.log(`\nsmallest failing case: ${JSON.stringify(out.smallestFailingCase)}`);
console.log(`\n${out.conclusion}`);
