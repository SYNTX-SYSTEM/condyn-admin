#!/usr/bin/env node
/**
 * GRÜN · §55 PG-23 (restated) · the shelf halo's own opacity is time-invariant. NO VERDICT (A-G36 point 2).
 *
 * This is the SOURCE limb of the restated pin, and it needs no raster, no mask, no floor, no number, no
 * build and no browser. It reads the component's own stylesheet and asserts that **no rule which animates
 * opacity can match a shelf halo or any of its ancestors.**
 *
 * WHY THE RASTER FORM IS THE WRONG INSTRUMENT, and why this lane's zero-by-construction channel must NOT be
 * pointed at this pin: `zeroByConstruction` differences two captures, so it measures the COMPOSITE. A
 * translucent resting layer over a breathing ground shows swing at every pixel however perfect the mask, and
 * `.mf-wave-ground` breathes by design beneath the shelf. PINK measured 9.84 × the shelf's own static floor
 * on a correct build. The swing is real and it is not the glow's.
 *
 * WHAT THIS CHECK DOES NOT DO. It is not a computed-style check. It establishes the REASON the opacity is
 * constant — that nothing targets it — which covers every state at once; it does not verify that a browser
 * agrees. That limb wants `getComputedStyle` across the breath cycle, which needs a rendered page, and this
 * instrument has no computed-style reader at all. Declared rather than implied (A-G214: a calculation states
 * the model it is computed under).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..", "..", "..", "..");
const SRC = join(ROOT, "app", "components", "career", "demo", "PersonJobMappingField.tsx");
const src = readFileSync(SRC, "utf8");
const lines = src.split("\n");
const lineOf = needle => lines.findIndex(l => l.includes(needle)) + 1;

/* Every rule in the component that starts an animation or a transition, found rather than listed, so a new
   one cannot be added without this check noticing. */
const rules = lines
  .map((text, i) => ({ line: i + 1, text: text.trim() }))
  .filter(r => /^\[data-testid="mapping-field"\]/.test(r.text) && /animation:|transition:/.test(r.text));

/* Which @keyframes touch opacity. `mappingFieldWave` is built by waveKeyframes(), whose body is the
   `opacity: calc(...)` template, so it is matched there rather than in a literal @keyframes block. */
const keyframeAnimatesOpacity = name => {
  if (name === "mappingFieldWave") return /opacity: calc\(var\(--mf-wave-mean\)/.test(src);
  const m = src.match(new RegExp(`@keyframes ${name} \\{([^\\n]*)`));
  return m ? /opacity/.test(m[1]) : null;   // null = not found, which must fail loudly rather than pass
};

const animating = [];
for (const r of rules) {
  const m = r.text.match(/animation: (mappingField\w+)/);
  if (m) {
    const touches = keyframeAnimatesOpacity(m[1]);
    if (touches === null) throw new Error(`ERR_PG23_KEYFRAMES_NOT_FOUND:${m[1]}`);
    if (touches) animating.push({ ...r, animation: m[1], via: "@keyframes" });
  } else if (/transition:/.test(r.text) && /opacity/.test(r.text)) {
    animating.push({ ...r, animation: "transition", via: "transition property" });
  }
}

/**
 * For each opacity-animating rule, whether its selector can reach a shelf halo. The reasons are read from
 * source and cited by line; this script pins the ENUMERATION and does not pretend to do selector matching.
 */
const REACHES_SHELF_HALO = {
  ".mf-wave": { reaches: false, reason: `the shelf branch gives the circle NO className — \`b.shelf ? undefined : "mf-wave mf-wave-halo"\` (A-G48, line ${lineOf('className={b.shelf ? undefined : "mf-wave mf-wave-halo"}')}) — and the wrapper <g> carries only "mf-halo" / "mf-halo mf-layout"` },
  ".mf-travel": { reaches: false, reason: "travel strokes only; a halo is never .mf-travel" },
  '[data-stage-part="EVIDENCE"]': { reaches: false, reason: `carried by mapping-collar, mapping-beams, mapping-ring and mapping-l3 only; the shelf halos render in their own subtree at line ${lineOf("{shelfHalos}")}, under none of them` },
};

const report = {
  instrument: "GRÜN phase-G · PG-23 (restated) source limb",
  verdict: "NONE — development reading only (A-G36 point 2)",
  basis: `static read of ${relative(ROOT, SRC)}; nothing rendered, no server, no credential`,
  animationOrTransitionRules: rules.length,
  opacityAnimatingRules: animating.map(a => {
    const key = Object.keys(REACHES_SHELF_HALO).find(k => a.text.includes(k)) ?? "UNCLASSIFIED";
    return { line: a.line, animation: a.animation, selectorKey: key, ...(REACHES_SHELF_HALO[key] ?? { reaches: null, reason: "NOT CLASSIFIED — a new opacity animation was added and this check must be redone" }) };
  }),
  staticOpacityOnTheWrapper: {
    note: `the shelf halo <g> carries a render-time opacity attribute (line ${lineOf("opacity={fixed(opacity * depthGain(b.rank, lastRank))}")}), not an animated one`,
    changesOn: "pool membership — opacity 1 when in pool, 0.18 when not — which is a STATE change, not the breath",
  },
  gradientStopsAreStatic: /GLOW_RAMP.map\(\(\[offset, share\]\)/.test(src),
};
const unresolved = report.opacityAnimatingRules.filter(r => r.reaches !== false);
report.noOpacityAnimationReachesAShelfHalo = unresolved.length === 0;
report.unresolved = unresolved;

console.log(JSON.stringify(report, null, 1));
const out = new URL("../outputs/pg23-alpha-source.json", import.meta.url);
writeFileSync(out, JSON.stringify(report, null, 1) + "\n");
console.error(`written ${out.pathname}`);
if (unresolved.length) process.exitCode = 1;
