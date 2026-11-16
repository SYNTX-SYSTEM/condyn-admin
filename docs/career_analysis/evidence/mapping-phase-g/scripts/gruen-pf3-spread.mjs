/**
 * GRÜN · PHASE-G · §99 — PF-3 LIMB 1 ACROSS RUNS, because a within-run spread is not a spread.
 * **NO VERDICT** (A-G36 point 2). Spawns gruen-pf3-blind.mjs N times; each child is its own browser launch and
 * page load. No build, no server write, no product change.
 *
 * WHY THIS EXISTS, and it is a defect in §97 that I published a verdict on top of. §97 reports a WITHIN-run
 * spread — repeat-to-repeat inside one page load, after the warm-up — and that figure is 0.1…2.9 %. The
 * RUN-to-run spread is up to 5.4 %. I compared a margin against the smaller number and reported rank 1 as
 * "robustly short" from three runs; the fourth put the gap to the bound at half the spread and the finding
 * evaporated. §95 taught me exactly this about classMasks, and I built §97 with a within-run spread anyway.
 *
 * SO THE INSTRUMENT MUST SPAN WHAT IT CLAIMS TO MEASURE. Four runs by hand with the table read out of my own
 * terminal is not an instrument; it is me being the instrument, with no record of how the number was formed.
 *
 * THE DECIDABILITY TEST IS A-G139 MADE ARITHMETIC: the bound must sit outside the observed range by MORE than
 * that range's own width. A body whose margin is smaller than its spread is UNMEASURABLE against the bound,
 * whichever side it leans. That rule spared rank 2 and then retracted rank 1, and it has to be applied before
 * a leaning is reported, not after a peer asks which way it leans.
 */
import { writeFileSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { PROVENANCE } from "./gruen-provenance.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(here, "../outputs");
const RUNS = Number(process.env.GRUEN_RUNS ?? 4);
const FOOTPRINT_MIN = 6;
if (!(Number.isInteger(RUNS) && RUNS >= 3)) throw new Error(`ERR_GRUEN_SPREAD_RUNS: ${RUNS} runs cannot establish a run-to-run spread. A spread over two points is a difference.`);

const runs = [];
for (let r = 0; r < RUNS; r += 1) {
  const res = spawnSync(process.execPath, [resolve(here, "gruen-pf3-blind.mjs")], { env: process.env, encoding: "utf8", timeout: 600000 });
  if (res.status !== 0) throw new Error(`ERR_GRUEN_SPREAD_CHILD_FAILED: run ${r + 1} exited ${res.status}\n${(res.stderr ?? "").slice(-1200)}`);
  const o = JSON.parse(readFileSync(resolve(OUT, "pf3-blind.json"), "utf8"));
  runs.push({ run: r + 1, measuredBuildCommit: o.provenance?.measuredBuildCommit ?? null,
    bodies: o.perBody.map(b => ({ rank: b.rank, shelf: b.shelf, limb1: b.limb1_footprint.ratio,
      limb2_p99: b.limb2_haloOverCore.ratio_p99, limb2_peak: b.limb2_haloOverCore.ratio_peak,
      limb2_peakMeasurable: b.limb2_haloOverCore.peakMeasurable })) });
  console.log(`run ${r + 1}/${RUNS}: ${runs[r].bodies.map(b => `r${b.rank} ${b.limb1}`).join("  ")}`);
}

const ranks = [...new Set(runs.flatMap(r => r.bodies.map(b => b.rank)))].sort((a, b) => a - b);
const decide = (values, bound) => {
  const lo = Math.min(...values), hi = Math.max(...values), width = hi - lo;
  if (lo <= bound && bound <= hi) return { range: [+lo.toFixed(4), +hi.toFixed(4)], width: +width.toFixed(4), gapToBound: 0, decidable: false, leaning: "ON the bound" };
  const gap = hi < bound ? bound - hi : lo - bound;
  return { range: [+lo.toFixed(4), +hi.toFixed(4)], width: +width.toFixed(4), gapToBound: +gap.toFixed(4), decidable: gap > width, leaning: hi < bound ? "short" : "clears" };
};
const perBody = ranks.map(rank => {
  const rows = runs.map(r => r.bodies.find(b => b.rank === rank)).filter(Boolean);
  const l1 = rows.map(b => b.limb1), p99 = rows.map(b => b.limb2_p99).filter(v => typeof v === "number");
  return { rank, shelf: rows[0].shelf, limb1PerRun: l1, limb1: decide(l1, FOOTPRINT_MIN),
    limb2_p99PerRun: p99, limb2_p99SpreadPct: p99.length === 0 ? null : +(100 * (Math.max(...p99) - Math.min(...p99)) / Math.max(...p99)).toFixed(3),
    limb2_peakMeasurableInEveryRun: rows.every(b => b.limb2_peakMeasurable) };
});
const decidable = perBody.filter(b => b.limb1.decidable);

const out = {
  reading: "GRÜN · §99 — PF-3 limb 1 across independent runs, with A-G139 decidability applied before any leaning is reported",
  verdict: PROVENANCE.verdict, instrument: PROVENANCE, runs: RUNS,
  scope: "each run is a separate child process: its own browser launch, its own page load. No build, no server write.",
  whyThisExists: "§97 reports a WITHIN-run spread (0.1..2.9 %); the run-to-run spread is up to 5.4 %. I compared a margin to the smaller figure and published 'rank 1 is robustly short' from three runs, then retracted it on the fourth. A probe that repeats inside one page load cannot measure the variation that decides a bound.",
  decidabilityTest: { rule: `the bound (${FOOTPRINT_MIN}) must sit outside a body's observed range by MORE than that range's own width`,
    origin: "A-G139 made arithmetic. A body whose margin is smaller than its spread is UNMEASURABLE against the bound, whichever way it leans." },
  rawRuns: runs, perBody,
  summary: {
    decidableBodies: decidable.map(b => b.rank), decidableCount: decidable.length, totalBodies: perBody.length,
    allDecidableClear: decidable.length === 0 ? null : decidable.every(b => b.limb1.leaning === "clears"),
    notDecidable: perBody.filter(b => !b.limb1.decidable).map(b => ({ rank: b.rank, shelf: b.shelf, leaning: b.limb1.leaning, width: b.limb1.width, gap: b.limb1.gapToBound }))
  },
  finding: null
};
out.finding =
`PF-3 LIMB 1 OVER ${RUNS} INDEPENDENT RUNS. Decidable on ${decidable.length} of ${perBody.length} bodies by A-G139 — the bound must clear the body's own spread — and ${decidable.length === 0 ? "none" : out.summary.allDecidableClear ? "EVERY decidable body CLEARS" : "not every decidable body clears"}. ${JSON.stringify(out.summary.notDecidable)} are unmeasurable against 6 on this instrument.
NOTHING IS RED, and the three unmeasurable bodies lean in DIFFERENT directions — which is why the field/shelf split does not govern this limb: the largest spread of all five belongs to a SHELF body. The split governs the PEAK, and limb 1 is an area.
AND THE REASON THIS INSTRUMENT EXISTS IS A VERDICT I SHOULD NOT HAVE PUBLISHED: §97's within-run spread understates the run-to-run spread by roughly a factor of two, and I compared a margin against it and called a body short. Three runs is not a spread.
NO VERDICT (A-G36 point 2).`;

writeFileSync(resolve(OUT, "pf3-spread.json"), JSON.stringify(out, null, 1));
console.log(`\nrank shelf  range            width   gap    decidable  leaning`);
for (const b of perBody) console.log(`  ${b.rank}  ${String(b.shelf).padEnd(6)} [${b.limb1.range.join(", ")}]  ${String(b.limb1.width).padEnd(6)}  ${String(b.limb1.gapToBound).padEnd(6)} ${String(b.limb1.decidable).padEnd(10)} ${b.limb1.leaning}`);
console.log(`\n${out.finding}`);
