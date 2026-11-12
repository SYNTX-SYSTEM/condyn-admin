/**
 * GELB · A-G128 OVER THE CARRIED-OVER PF PINS — the half §64's sweep missed.
 *
 * §4 of PHASE_G reads "PF-1 … PF-18 carry over, except: PF-1 is replaced by PG-1/PG-2". §64's sweep
 * covered PG-1 … PG-23 under the title "every pin in phase G". That is 23 of 41, and PF-15's disjoint
 * limbs (§67) are exactly what the gate exists to find. This is the omission closed.
 *
 * Statements are quoted from PERSON_X_JOB_MAPPING_PHASE_F.md's restated table at :897 (A-F7 … A-F15).
 *
 * *** WITHDRAWAL, SAME SESSION — READ THIS BEFORE THE PF-3 BLOCK BELOW ***
 * That table says of itself at :891: "This table is the CURRENT contract; where it differs from §7, this
 * wins." It is current as of §17, and §§19-30 amend it further. This instrument treated that sentence as
 * timeless. It is not:
 *   :1054  A-F19 — PF-3 is amended: the halo is measured as an EXCESS against a render without it, never
 *          as a raw window. GRÜN measured the raw window confounded at the shelf edge (rank 4 at r = 430
 *          reads the LIT GROUND inside the shelf, 0.31 against 0.25, "red for entirely the wrong reason")
 *          and the DIFFERENTIAL at 0.039-0.083 — comfortably inside the ceiling.
 *   :994   PF-8 is now THREE tiers, amended twice more at :1214 and :1307, tier B again at :1513.
 *   :1567  PF-16 widened to [0.88, 1.12] as a trimmed mean per pool (superseded for phase G by A-G12,
 *          which restated it in CODES because A-F31 found ratios meaningless at this level).
 * So the PF-3 block below is VOID and its verdict is withdrawn. It is kept rather than deleted, per the
 * habit GRÜN set in its limb C, because the shape of the error is the useful part: a raw ratio of declared
 * alphas is a CRUDER form of exactly the confound A-F19 identified and fixed.
 * PF-4, PF-6, PF-11, PF-13 and PF-16 are unaffected — checked individually against §§19-30.
 *
 * Same discipline as §64's sweep: every source claim is an EXACT substring of the committed product at
 * 4b83414e and a row whose substring is absent or ambiguous is reported UNVERIFIED.
 */
import { execFileSync } from "node:child_process";
import { REPO_ROOT } from "./gelb-paths.mjs"; // A-G469: derived, never declared
const TREE = REPO_ROOT, SHA = "4b83414e";
const FILE = "app/components/career/demo/PersonJobMappingField.tsx";
const src = execFileSync("git", ["-C", TREE, "show", `${SHA}:${FILE}`], { encoding: "utf8" }).split("\n");
const locate = n => { const h = []; src.forEach((l, i) => l.includes(n) && h.push(i + 1)); return { h, ok: h.length === 1 }; };
const f = (x, n = 5) => x.toFixed(n);

/* ── the arithmetic the gate needs, from source constants only ── */
const DEPTH_RATIO = 1.45, CORE_ALPHA = 0.16, HALO_ALPHA = 0.5, HALO_NEAR = 2.6, HALO_FAR = 3.0;
const GLOW_RAMP = [[0,1],[0.33,1],[0.45,0.72],[0.58,0.46],[0.72,0.24],[0.86,0.08],[1,0]];
const WEDGE_WASH = 0.009, CYAN = [92,200,255], MED = [6,12,17];
const qa = a => Math.round(a * 255) / 255;
const over = (s, d, a) => { const A = qa(a); return s.map((c, i) => Math.round(c * A + d[i] * (1 - A))); };
const share = o => { for (let i = 1; i < GLOW_RAMP.length; i++) { const [o0,s0] = GLOW_RAMP[i-1], [o1,s1] = GLOW_RAMP[i]; if (o <= o1) return s0 + (s1-s0)*(o-o0)/(o1-o0); } return 0; };

console.log("=".repeat(104));
console.log(`GELB · A-G128 OVER PF-1 … PF-18 — tree @ ${SHA}`);
console.log("=".repeat(104));

/* ══ PF-4 ══ */
console.log("\n" + "-".repeat(104));
console.log("PF-4  \"depth monotone in rank, ratio first : last ∈ [1.5, 3.0]; same-class marks differ ≤ 2 %\"");
const l1 = locate("depthRatio: 1.45"), l2 = locate("return Math.round(VOLUME.depthRatio ** -t * 1e6) / 1e6;");
console.log(`      ${l1.ok ? "[ok]" : "[!!]"} ${FILE}:${l1.h[0]}   "depthRatio: 1.45"`);
console.log(`      ${l2.ok ? "[ok]" : "[!!]"} ${FILE}:${l2.h[0]}   depthGain = depthRatio ** -t`);
const first = 1, last = Math.round(DEPTH_RATIO ** -1 * 1e6) / 1e6;
const ratio = first / last;
console.log(`      depthGain(1) = ${f(first,6)}   depthGain(last) = ${f(last,6)}   ratio first:last = ${f(ratio,5)}`);
console.log(`      PF-4's band is [1.5, 3.0].  ${ratio >= 1.5 && ratio <= 3.0 ? "INSIDE" : "*** OUTSIDE — BELOW THE FLOOR ***"}`);
console.log(`      shortfall: ${f(1.5 - ratio,5)}  (${f(100*(1.5-ratio)/1.5,2)} % under)`);
console.log("      → the ratio is depthRatio itself, exactly, for ANY rank count ≥ 2 (t is normalised to [0,1]).");
console.log("      → so PF-4's ratio limb FAILS BY CONSTRUCTION on this build, at every population and viewport,");
console.log("        and nothing in the product can move it but the constant. Monotonicity holds.");
console.log("      → PINK's §18 measured this ladder exactly (1.000 / 0.911293 / 0.830455 / 0.756788 / 0.689655)");
console.log("        and reported it against 1.45^-t, which is what PF-4's band was never compared to.");

/* ══ PF-3 ══ */
console.log("\n" + "-".repeat(104));
console.log("PF-3  \"body footprint ≥ 6 × outline footprint; halo peak ≤ 0.25 × core peak\"");
const l3 = locate("coreAlpha: 0.16"), l4 = locate("haloAlpha: 0.5");
console.log(`      ${l3.ok ? "[ok]" : "[!!]"} ${FILE}:${l3.h[0]}   "coreAlpha: 0.16"`);
console.log(`      ${l4.ok ? "[ok]" : "[!!]"} ${FILE}:${l4.h[0]}   "haloAlpha: 0.5"`);
console.log(`      core peak alpha (mf-core offset 0)                 = ${f(CORE_ALPHA)}`);
console.log(`      halo peak alpha declared (mf-halo offsets 0…0.33)  = ${f(HALO_ALPHA)}`);
for (const [lbl, m] of [["rank 1 (haloNear 2.6)", HALO_NEAR], ["last rank (haloFar 3.0)", HALO_FAR]]) {
  const a = HALO_ALPHA * share(1 / m);
  console.log(`      halo peak alpha VISIBLE past the opaque seat, ${lbl} = ${f(a)}   ratio to core = ${f(a/CORE_ALPHA,3)} ×`);
}
const rNear = HALO_ALPHA*share(1/HALO_NEAR)/CORE_ALPHA, rFar = HALO_ALPHA*share(1/HALO_FAR)/CORE_ALPHA;
console.log(`      PF-3's bound is ≤ 0.25 ×.  The visible ratio is ${f(rNear,3)}–${f(rFar,3)} ×, i.e. ${f(rNear/0.25,1)}–${f(rFar/0.25,1)} × the bound.`);
console.log("      (this line is computed, not typed — the first draft read \"2.8–3.4, i.e. 11–13 ×\" beside the");
console.log("       figures above it, which is A-G283's class in a sentence of this lane's own.)");
console.log("      → BUT the premise is gone. §4 inverted the light budget and replaced PF-1 with PG-1/PG-2");
console.log("        ('the disc must now be DARK, and the semantics must carry the light'), and G-2/R21 made the");
console.log("        glow a LIGHT SOURCE — 'full at the body's rim … the profile that is seen as self-luminous'.");
console.log("      → 'halo peak ≤ 0.25 × core peak' is the OPPOSITE obligation. §4 restated PF-1 and carried PF-3.");
console.log("      → so PF-3 is not a red: it is a phase-F obligation CONTRADICTED BY a phase-G architecture");
console.log("        decision, and the contradiction is between two things this record adopted.");

/* ══ PF-6 vs PG-10 limb 3 ══ */
console.log("\n" + "-".repeat(104));
console.log("PF-6  \"blurred: no disc pixel swings > 0.030; mean |ΔL| per 500 ms ≤ 0.0025\"");
console.log("      PG-10 limb 3 is \"max swing ≤ 0.030\" on the same quantity over the same disc.");
console.log("      → THE SAME BOUND ON THE SAME QUANTITY, carried under two names. §52 measured it breached at");
console.log("        1920 (max 0.0327, p999.9 0.0319155, 105 of 51 289 px) and reported it as PG-10's.");
console.log("      → so PF-6's ceiling is ALSO breached and has never been reported as breached. One measurement,");
console.log("        two pins, one report. PF-6's second row (mean |ΔL| per 500 ms) is independent and unmeasured.");

/* ══ PF-11 ══ */
console.log("\n" + "-".repeat(104));
console.log("PF-11 \"… ≤ 1.5 × the back-to-back count AT EVERY THRESHOLD; plus no element with a non-zero");
console.log("       computed animation or transition duration\"");
console.log("      → 'at every threshold' over 0.001 / 0.002 / 0.004 / 0.008 is a FOUR-WAY CONJUNCTION, and");
console.log("        A-G144: a conjunctive pin is only as weak as its strongest requirement — it fails the");
console.log("        innocent. At base one threshold returned ∞ (6.43 / 4.48 / 13.7 / ∞), so the conjunction is");
console.log("        carried by its worst threshold and the pin cannot report WHICH regime moved.");
console.log("      → and the second clause is a COMPUTED-STYLE read, so PF-11 mixes a raster statistic and a DOM");
console.log("        assertion under one verdict — two carriers, one name.");

/* ══ PF-13 ══ */
console.log("\n" + "-".repeat(104));
console.log("PF-13 \"every phase-D and phase-E test passes, except the three restated in writing\"");
console.log("      → PF-13 IS the suite. It is not incidentally gated on B-ENTRY, it is unverifiable without it,");
console.log("        and no instrument of any lane can stand in for it.");
console.log("      → so the regression risk §62's A-G253 accepted has a NAME in this record, and it is PF-13.");
console.log("        A-G253 said the risk was 'stated and currently unverifiable'. PF-13 is the obligation that");
console.log("        states it, and it has been carried as 'carries over' since §4 without being marked HELD.");

/* ══ PF-16 ══ */
console.log("\n" + "-".repeat(104));
console.log("PF-16 (A-G12) \"the wedge wash is ≥ 1 and ≤ 3 sRGB codes above the base ground\"");
const l5 = locate("export const WEDGE_WASH = 0.009");
console.log(`      ${l5.ok ? "[ok]" : "[!!]"} ${FILE}:${l5.h[0]}   "export const WEDGE_WASH = 0.009"`);
const washed = over(CYAN, MED, WEDGE_WASH);
console.log(`      rgba(CYAN, ${WEDGE_WASH}) over rgb(${MED}) → rgb(${washed})  = +${washed.map((c,i)=>c-MED[i]).join("/+")} codes`);
console.log(`      the product's own comment claims "+1/+1…2/+2 in R/G/B".  ${washed.map((c,i)=>c-MED[i]).join(",")==="1,1,2" ? "MATCHES" : "*** DIVERGES ***"}`);
console.log(`      PF-16's band is [1, 3] codes.  ${Math.min(...washed.map((c,i)=>c-MED[i]))>=1 && Math.max(...washed.map((c,i)=>c-MED[i]))<=3 ? "INSIDE" : "OUTSIDE"}`);
console.log("      → the one product comment this lane has checked that is exactly right. Recorded because two");
console.log("        others were corrected this week and a lane that only reports wrong comments is not auditing.");

/* ══ summary ══ */
console.log("\n" + "=".repeat(104));
console.log("WHAT THE OMITTED HALF CONTAINED:");
console.log("  PF-4   ratio limb FAILS BY CONSTRUCTION — depthRatio 1.45 against a floor of 1.5. Never reported.");
console.log("  PF-3   *** WITHDRAWN. A-F19 amended it to a DIFFERENTIAL and GRÜN measured 0.039-0.083 against");
console.log("         0.25 — it CLEARS. The one residue: that figure was measured on a phase-F build, so under");
console.log("         A-G54 it does not transfer to phase G, where haloAlpha is 0.5 and the glow is a light");
console.log("         source. PF-3 is UNMEASURED on a phase-G build IN ITS CORRECT FORM. ***");
console.log("  PF-15  unsatisfiable as a conjunction (§67) — three limbs, disjoint regions.");
console.log("  PF-6   ceiling is PG-10 limb 3 under another name, breached and reported once.");
console.log("  PF-11  four-way conjunction plus a second carrier under one verdict.");
console.log("  PF-13  unverifiable without B-ENTRY — the name of the risk A-G253 accepted.");
console.log("  PF-16  holds, and its product comment is accurate.");
console.log("\nFour of these are findings no measurement would have produced, and all four are arithmetic or a");
console.log("source reading. The gate's score since §37 is now six prospective firings.");
console.log("=".repeat(104));
