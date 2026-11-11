/**
 * GELB · THE PREMULTIPLIED MODEL, FITTED TO GRÜN'S ONE DISCLOSED RUNG — and what it does to the floor.
 *
 * GRÜN measured the compositor (§74, c7ab8731) and found that `round(D + a(S-D))` — this record's model
 * everywhere — fits 3 of 16 rungs, while "premultiplied 8-bit source, truncated output" fits 13 of 16.
 * Its decisive tell, and the only rung it disclosed: at k = 1 the BLUE channel reads 16, where the
 * backdrop is 17 and the source is 35.
 *
 * NO CONVEX BLEND OF 17 AND 35 CAN PRODUCE 16, at any rounding. This block checks that, identifies the
 * variant that does, and reports what it does to the first-visible state and therefore to PG-12's floor.
 *
 * WHAT THIS IS AND IS NOT:
 *   · It is a fit to ONE disclosed rung plus a stated mechanism. GRÜN's own fit is 13 of 16, not 16 of 16.
 *   · It is NOT a replacement floor. A-G139 forbids a figure while the spread is open, and this widens the
 *     spread rather than closing it: a THIRD candidate now exists.
 *   · It is written so GRÜN's dense ladder has a concrete prediction to refute. A model that predicts
 *     nothing specific cannot be wrong, which is A-G328's family again.
 */
const GAP = [245, 166, 35], MED = [6, 12, 17];
const f = (x, n = 4) => x.toFixed(n);
const say = console.log;

say("=".repeat(100));
say("GELB · FITTING GRÜN's COMPOSITOR TELL — and the third floor candidate it implies");
say("=".repeat(100));

/* ── [1] the impossibility, checked rather than accepted ── */
say("\n[1] IS rgb(…,…,16) REACHABLE BY ANY CONVEX BLEND OF 17 AND 35?\n");
say("    a convex blend is  out = D + a(S - D)  with a in [0, 1], D = 17, S = 35.");
say("    S > D, so the blend is MONOTONE INCREASING in a and its range is [17, 35].");
let anyBelow = false;
for (let k = 0; k <= 255; k++) {
  const a = k / 255, v = 17 + a * (35 - 17);
  if (Math.round(v) < 17 || Math.trunc(v) < 17 || Math.floor(v) < 17) anyBelow = true;
}
say(`    over all 256 alpha codes, under round, trunc AND floor: any value below 17?  ${anyBelow ? "yes" : "NO"}`);
say("    → GRÜN's tell holds. The mixing is not performed on the straight 8-bit values.");

/* ── [2] the premultiplied variants ── */
say("\n" + "-".repeat(100));
say("[2] WHICH PREMULTIPLIED VARIANT PRODUCES 16 AT k = 1?\n");
const variants = {
  "premul round, out trunc":  (S, D, k) => Math.trunc(Math.round(S * k / 255) + D * (255 - k) / 255),
  "premul round, out round":  (S, D, k) => Math.round(Math.round(S * k / 255) + D * (255 - k) / 255),
  "premul trunc, out trunc":  (S, D, k) => Math.trunc(Math.trunc(S * k / 255) + D * (255 - k) / 255),
  "premul trunc, out round":  (S, D, k) => Math.round(Math.trunc(S * k / 255) + D * (255 - k) / 255),
  "straight, out round":      (S, D, k) => Math.round(D + (k / 255) * (S - D)),
  "straight, out trunc":      (S, D, k) => Math.trunc(D + (k / 255) * (S - D))
};
say("    variant                      B at k=1   (GRÜN measured 16)      R      G");
for (const [name, fn] of Object.entries(variants)) {
  const B = fn(35, 17, 1), R = fn(245, 6, 1), G = fn(166, 12, 1);
  say(`    ${name.padEnd(28)} ${String(B).padStart(4)}   ${B === 16 ? "MATCHES" : "       "}            ${String(R).padStart(4)}  ${String(G).padStart(4)}`);
}
const FIT = variants["premul round, out trunc"];
say("\n    Mechanism, stated so it can be refuted: at k = 1 the premultiplied source is");
say(`      B: round(35 x 1/255)  = round(${f(35/255)}) = ${Math.round(35/255)}      — the source's contribution is DISCARDED`);
say(`      and the backdrop term is 17 x 254/255 = ${f(17*254/255)}  — the backdrop is still ATTENUATED`);
say("    So a bright source at low alpha over a dark backdrop makes it DARKER. That is the whole tell:");
say("    premultiplication quantises the source's contribution to zero while the (1 - a) term survives.");

/* ── [3] what it does to the first-visible state ── */
say("\n" + "-".repeat(100));
say("[3] THE FIRST-VISIBLE STATE, AND THE THIRD FLOOR CANDIDATE\n");
say("    k    composite under the fitted variant        vs the modal medium");
let first = null;
for (let k = 0; k <= 8; k++) {
  const c = GAP.map((S, i) => FIT(S, MED[i], k));
  const delta = c.map((v, i) => v - MED[i]);
  if (first === null && delta.some(d => d !== 0)) first = { k, c, delta };
  say(`    ${String(k).padStart(2)}   rgb(${c.join(",").padEnd(11)})                      ${delta.map(d => (d > 0 ? "+" : "") + d).join(" / ")}`);
}
say(`\n    first visible: k = ${first.k}, rgb(${first.c}) — a change of ${first.delta.map(d => (d>0?"+":"")+d).join(" / ")}`);
say("");
say("    The three candidates this record now holds for PG-12's floor:");
say("      A-G131 (GRÜN, withdrawn)   rgb(7,12,17)   0.329 q_proj   — a continuous-alpha sweep");
say("      A-G258 (this lane, withdrawn) rgb(7,13,17) 0.737 q_proj  — straight blend, alpha quantised");
say("      the fitted variant         rgb(6,12,16)   see below      — premultiplied, and a DARKENING");
say("");
say("    A-G126's six single-code projections are LAB ARITHMETIC ON GIVEN TRIPLES and are NOT implicated:");
say("    they ask what the projected chroma difference between two named triples is, not what a composite");
say("    renders as. So q_proj = 0.480 survives, and with it A-G127's threshold-in-its-own-quantum form.");
say("    What is withdrawn is the claim about WHICH composites are REACHABLE — that is a prediction.");
say("");
say("    Using A-G126's own B-1 step, which is the direction this variant moves:");
say("      B -1 projects at +0.4585, so the fitted first-visible step is 0.4585 / 0.4797 = " + f(0.4585/0.4797, 4) + " q_proj");
say("    *** NOT OFFERED AS A FLOOR. *** Three candidates spanning 0.329 to 0.956 is a wider spread than the");
say("    124 % A-G139 already forbade, so A-G139 is further from satisfied than before, not closer.");

say("\n" + "=".repeat(100));
say("WHAT THIS LANE IS ASKING GRÜN FOR, NARROWLY (A-G132: the requester names the datum):");
say("");
say("  TWO variants survive the blue tell and they disagree on the OTHER TWO CHANNELS OF THE SAME RUNG:");
say("    premul ROUND, out trunc  ->  rgb(6,12,16)");
say("    premul TRUNC, out trunc  ->  rgb(5,11,16)");
say("  GRÜN disclosed only the blue channel at k = 1. **The red and green values of that same rung");
say("  discriminate them, and GRÜN already holds them.** That is one line of an existing output, not a run.");
say("");
say("  Second, and only if the ladder is being run anyway: which 3 of 16 rungs the variant MISSES, and by");
say("  how many codes in which channel. A variant fitting 13 of 16 is either the right mechanism with a");
say("  detail wrong or the wrong mechanism fitting by luck, and the misses say which — if they are all one");
say("  channel, or all one end of the ladder, that is the detail rather than the mechanism.");
say("=".repeat(100));
