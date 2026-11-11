/**
 * GELB · A-G128's THIRD LIMB — the motion mode. Which pins does the reduced-motion accommodation reach?
 *
 * PINK established (§22) that PF-4's limb 3 is violated ONLY under `reduce`, and that the violation IS the
 * accommodation: under LIVE an unlit in-pool body is distinguished by MOTION; under `reduce` the motion cue
 * is removed and a static opacity is substituted for it. Its class: "the first where the carrier is swapped
 * by a media query rather than shared between elements."
 *
 * That generalises, and nobody had asked it generally. `prefers-reduced-motion: reduce` is not a variant of
 * the build — it is a SECOND BUILD WITH A DIFFERENT CHANNEL ASSIGNMENT, and A-G2's channel table
 * (radius=fit, angle=pool, size=mass, luminance=class, hue=gap) has no column for it.
 *
 * Every source claim below is an exact substring of the committed product at 4b83414e; an absent or
 * ambiguous anchor is reported UNVERIFIED and its row does not stand.
 */
import { execFileSync } from "node:child_process";
const TREE = "/home/codi/Entwicklung/condyn-admin-mapping-d", SHA = "4b83414e";
const FILE = "app/components/career/demo/PersonJobMappingField.tsx";
const src = execFileSync("git", ["-C", TREE, "show", `${SHA}:${FILE}`], { encoding: "utf8" }).split("\n");
const loc = n => { const h = []; src.forEach((l, i) => l.includes(n) && h.push(i + 1)); return { h, ok: h.length === 1 }; };
const f = (x, n = 4) => x.toFixed(n);
const say = console.log;

say("=".repeat(104));
say(`GELB · A-G128's MOTION-MODE LIMB — what the accommodation substitutes, and which pins it reaches`);
say("=".repeat(104));

say("\n[1] THE ACCOMMODATION, IN FULL. It is three rules and one script hook — nothing else.\n");
const RULES = [
  ["@media (prefers-reduced-motion: reduce) {", "the block itself"],
  ['[data-testid="mapping-field"] * { animation: none !important; transition: none !important; }', "REMOVES all animation and transition"],
  ['.mf-travel { visibility: hidden; }', "REMOVES the travelling light entirely"],
  ['[data-mapping-body][data-lit="false"][data-in-pool="true"] { opacity: 0.32; }', "SUBSTITUTES a static opacity for the motion cue"],
  ['window.matchMedia("(prefers-reduced-motion: reduce)").matches', "the E-5 geometry tween asks the same query and cuts"]
];
let bad = 0;
for (const [needle, what] of RULES) {
  const l = loc(needle);
  if (!l.ok) bad += 1;
  say(`  ${l.ok ? "[ok]" : "[!!]"} ${(l.ok ? `${FILE}:${l.h[0]}` : l.h.length ? `AMBIGUOUS ${l.h.join(",")}` : "NOT FOUND").padEnd(56)} ${what}`);
}
say(`\n  ${bad === 0 ? "all anchors unique" : `*** ${bad} UNVERIFIED — those rows do not stand ***`}`);
say("\n  So the accommodation makes exactly ONE substitution and TWO removals. Everything below follows from");
say("  which pins' quantities ride the substituted channel or the removed ones.");

say("\n" + "-".repeat(104));
say("[2] THE SUBSTITUTION: group opacity 0.32 on an unlit in-pool body.\n");
const DIM = 0.32;
say(`  It is a GROUP opacity on [data-mapping-body], and PINK measured that 19 arcs and 19 beams are INSIDE`);
say(`  that group — so it multiplies every mark, arc, beam, node and text the body draws, not just the body.`);
say(`  ratio between a lit and an unlit body's same-class mark: (1 / ${DIM}) = ${f(1/DIM,4)} ×, i.e. ${f(100*(1-DIM)/DIM,1)} %\n`);
const reached = [
  ["PF-4 limb 3", "same-class marks on different bodies differ ≤ 2 %", `${f(100*(1-DIM)/DIM,1)} % — MEASURED by PINK at 212.5 %, PCAP_PG only`],
  ["PF-2", "adjacent evidence bands' ratio ≥ 1.6 at their closest points", `${f(1/DIM,3)} × > 1.6 — so a 0.32 factor EXCEEDS the whole band separation`],
  ["PG-1", "semantic share of the field's light ≥ 0.50 (DERIVED) + 0.05", "every dimmed body contributes 0.32 × its light — the share MOVES"],
  ["PG-6", "relations' share of the semantic light ≥ 0.15", "beams are inside the body group, so dimmed beams move the numerator"]
];
say("  pin              obligation                                              what the 0.32 does");
for (const [pin, ob, eff] of reached) say(`  ${pin.padEnd(16)} ${ob.padEnd(54)} ${eff}`);

say("\n  THE SHARPEST OF THESE IS PF-2, AND IT IS A DERIVATION THIS LANE CANNOT MEASURE:");
say(`    PF-2 bounds ADJACENT BANDS at ≥ 1.6 ×. The dim factor is ${f(1/DIM,3)} ×, which is LARGER than the`);
say("    separation the pin protects. So under `reduce`, with a capability selected, a band-i mark on a LIT");
say("    body and a band-j mark on an UNLIT body can inhabit the wrong order — the dimming is worth more than");
say("    one whole band step.");
say("    Phase E's recorded separations are 1.814 and 1.940 (PF-2's own anchor). Against those:");
for (const sep of [1.814, 1.940, 1.6]) {
  say(`      separation ${f(sep,3)} ×  →  dimmed upper band / lit lower band = ${f(sep*DIM,4)} ×  ${sep*DIM < 1 ? "*** INVERTED ***" : "ordered"}`);
}
say("    All three invert. Whether PF-2's comparison is scoped WITHIN a body or ACROSS bodies decides whether");
say("    this is a violation or a non-question — and PF-2 does not say. A-G137's defect exactly: the verdict is");
say("    selected by a word the pin does not define.");

say("\n" + "-".repeat(104));
say("[3] THE REMOVALS: no animation, and `.mf-travel` hidden.\n");
say("  PG-18  \"at least one of the field's motions is self-propelled from rest and contingent on another");
say("         object — the travelling light departing on a coupling. The breath alone does not satisfy PG-18.\"");
say("         → under `reduce` the travelling light is `visibility: hidden` and the breath is `animation: none`,");
say("           so PG-18's ONLY named satisfier does not exist and the breath is excluded by the pin itself.");
say("           PG-18 has NO satisfier under `reduce`, and PG-18 names no motion mode.");
say("           §64 classified it CONSTANT-ONLY with A-G144's disjunction hazard; it is also mode-dependent,");
say("           and this is the one place where its disjunction having no satisfier is not a hazard but a fact.");
say("");
say("  PG-11  the travel must out-salience the breath → both are gone; vacuous under `reduce`.");
say("  PG-7   the travel stops with the breath → both stopped; vacuous.");
say("  PF-8   every sign pixel swings ≤ 0.002 → nothing swings; passes vacuously, which PF-9 already states.");
say("  PF-6/PG-10 limb 3  PINK's LIVE max of 0.6908 was the travel; hidden under `reduce`, so the breach is");
say("         a LIVE-only breach. Consistent with §21, and it means the breach and the accommodation are");
say("         mutually exclusive — the build breaches in the mode where it is allowed to move.");

say("\n" + "=".repeat(104));
say("THE LIMB, STATED FOR A-G128:");
say("  > Before a pin is measured: in WHICH MOTION MODE, and does the accommodation substitute a static");
say("  > channel for the motion channel the pin's quantity lives in? `prefers-reduced-motion: reduce` is not");
say("  > a variant of the build — it is a second build with a different channel assignment, and A-G2's");
say("  > channel table has no column for it.");
say("");
say("  It is a source reading of ONE css block, so it is the cheapest of A-G128's three limbs, and it reaches");
say("  four pins by substitution and five by removal. E-1 is the obligation underneath: under `reduce` the");
say("  group opacity carries BOTH evidence class and focus, which is one channel answering two questions.");
say("=".repeat(104));
