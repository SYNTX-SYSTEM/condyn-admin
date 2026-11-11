/**
 * GELB · A-G128 satisfiability gate on PG-12 (re-formed, A-G123/A-G126: the SIGNED PROJECTION onto the
 * gap hue's own chromatic direction, thresholded in that projection's own quantum q_proj, A-G127).
 *
 * Why this instrument exists. A-G127 left PG-12's threshold factor to PINK "under A-G115's precedent",
 * and A-G132 limited A-G128: "the gate needs the artifact's achievable range, so it is cheap only where
 * a constant or a single reading bounds that range." Handing PINK a factor question without the range
 * attached would be A-G219 again (an unnormalised request) and A-G220 again (pricing another lane's run).
 * So this lane computes the half of the gate that source constants bound, states exactly which datum the
 * other half needs, and names which lane owns it.
 *
 * Blocks:
 *   [1] ANCHOR — §37 A-G126's six single-code projections and q_proj, and §38 A-G129's two hue angles
 *       and their separation. If these do not reproduce, this lane's colour pipeline is wrong and no
 *       figure below it counts. (A-G35: no number without script + output + commit.)
 *   [2] A-G131's three regimes, recomputed under A-G81's compositing model.
 *   [3] The achievable alpha envelope of the GAP glow on MEDIUM pixels, seat edge to rim, both rank ends.
 *   [4] The carrier bound, and the one datum the gate still needs.
 *
 * Source constants, all from app/components/career/demo/PersonJobMappingField.tsx in GRÜN's tree:
 *   :190 GAP_HUE = "245, 166, 35"            :191 GAP_ALPHA_GAIN = 1.08
 *   :143 VOLUME = { haloAlpha: 0.5, haloNear: 2.6, haloFar: 3.0, ... }
 *   :148 GLOW_RAMP = [[0,1],[0.33,1],[0.45,0.72],[0.58,0.46],[0.72,0.24],[0.86,0.08],[1,0]]
 *   :910 the gap glow is the SAME radial gradient in the one hue: stopOpacity = haloAlpha * gain * share
 *   :711 fill="url(#mf-halo-gap)" on ONE circle of r * (haloNear + (haloFar - haloNear) * t)
 * Medium triple rgb(6,12,17): the modal medium, §36/§38, GRÜN's disclosed reading.
 */

/* §88 A-G398: these were FORKED product values. They now come from gelb-product-constants.mjs,
   which PARSES them out of the product at a pinned build and holds no copy — READS, not HALTS.
   The output is byte-identical after the wiring, which is both the proof the literals were right
   and the reason nothing would have said so once they stopped being. */
import { GAP_HUE, HALO_ALPHA, HALO_NEAR, HALO_FAR, GLOW_RAMP } from "./gelb-product-constants.mjs";
const MEDIUM    = [6, 12, 17];
const GAP_GAIN = 1.08;
const PEAK_ALPHA = HALO_ALPHA * GAP_GAIN;                       // 0.54

/* ── colour pipeline: sRGB EOTF → XYZ (D65) → CIELAB, per A-G123's adopted metric ── */
const lin = c => { const s = c / 255; return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
const XYZ = ([r, g, b]) => {
  const R = lin(r), G = lin(g), B = lin(b);
  return [0.4124564*R + 0.3575761*G + 0.1804375*B,
          0.2126729*R + 0.7151522*G + 0.0721750*B,
          0.0193339*R + 0.1191920*G + 0.9503041*B];
};
/* Two D65 white points are in common use and they are NOT interchangeable at four decimals.
   A-G126 quotes q_proj as 0.4797 without naming one, so this block reports BOTH rather than
   picking the one that agrees — A-G241: a constant quoted at a precision it does not have. */
const WP = { "IEC 61966-2-1 / sRGB spec": [0.9505, 1.0, 1.0890], "CIE 15:2004 (ASTM E308)": [0.95047, 1.0, 1.08883], "CIE 15:2004, 4 dp x,y": [0.9504559, 1.0, 1.0890578] };
let Wn = WP["CIE 15:2004 (ASTM E308)"];
const fL = t => t > 216/24389 ? Math.cbrt(t) : (24389/27 * t + 16) / 116;
const LAB = rgb => {
  const [X, Y, Z] = XYZ(rgb), fx = fL(X/Wn[0]), fy = fL(Y/Wn[1]), fz = fL(Z/Wn[2]);
  return [116*fy - 16, 500*(fx - fy), 200*(fy - fz)];
};
const Cstar  = rgb => { const [, a, b] = LAB(rgb); return Math.hypot(a, b); };
const hueDeg = rgb => { const [, a, b] = LAB(rgb); return Math.atan2(b, a) * 180 / Math.PI; };
/** Signed projection of a triple's chroma onto the direction `theta` (degrees) in the a*b* plane. */
const proj = (rgb, theta) => {
  const [, a, b] = LAB(rgb), t = theta * Math.PI / 180;
  return a * Math.cos(t) + b * Math.sin(t);
};

/* ── A-G81: 8-bit alpha quantisation BEFORE compositing, then per-channel integer source-over ── */
const qa = a => Math.round(a * 255) / 255;
const over = (src, dst, a) => { const A = qa(a); return src.map((c, i) => Math.round(c * A + dst[i] * (1 - A))); };

const f = (x, n = 4) => x.toFixed(n);
const say = s => console.log(s);

say("=".repeat(104));
say("GELB · A-G128 SATISFIABILITY GATE ON PG-12 (re-formed: signed projection, A-G123/A-G126/A-G127)");
say("=".repeat(104));

/* ══════════════════ [1] ANCHOR ══════════════════ */
say("\n[1] ANCHOR — §37 A-G126's six single-code projections, q_proj, and §38 A-G129's hue geometry.");
say("    Nothing below this block counts if this block does not reproduce.\n");

const THETA = hueDeg(GAP_HUE);
const THETA_RECORDED = 74.70;
say(`  GAP_HUE rgb(${GAP_HUE})        hue angle = ${f(THETA, 2)}°   recorded ${f(THETA_RECORDED, 2)}°`);
const THETA_MED = hueDeg(MEDIUM);
say(`  medium  rgb(${MEDIUM})           hue angle = ${f(THETA_MED, 2)}°  recorded -103.54°`);
let sep = Math.abs(THETA - THETA_MED); if (sep > 180) sep = 360 - sep;
say(`  separation = ${f(sep, 2)}°   recorded 178.24°   (${f(180 - sep, 2)}° from antipodal, recorded 1.76°)`);

say("\n  single-code steps at the medium, projected on the hue direction:");
say("    step        projected    recorded");
const STEPS = [["R +1",[1,0,0],+0.1579],["R -1",[-1,0,0],-0.1579],["G +1",[0,1,0],+0.1955],
               ["G -1",[0,-1,0],-0.1853],["B +1",[0,0,1],-0.4797],["B -1",[0,0,-1],+0.4585]];
const base = proj(MEDIUM, THETA);
let anchorOk = Math.abs(THETA - THETA_RECORDED) < 0.005 && Math.abs(sep - 178.24) < 0.005;
const TOL = 0.0005;   // four-decimal figures are compared at the fourth decimal, not past it
for (const [name, d, recorded] of STEPS) {
  const got = proj(MEDIUM.map((c, i) => c + d[i]), THETA) - base;
  const ok = Math.abs(got - recorded) < TOL;
  anchorOk = anchorOk && ok;
  say(`    ${name.padEnd(10)} ${f(got).padStart(9)}    ${f(recorded).padStart(8)}   ${ok ? "MATCH" : "*** DIVERGES ***"}`);
}
const q_proj = Math.max(...STEPS.map(([, d]) => Math.abs(proj(MEDIUM.map((c, i) => c + d[i]), THETA) - base)));
const qOk = Math.abs(q_proj - 0.4797) < TOL;
say(`\n  q_proj = ${f(q_proj)}   recorded 0.4797   ${qOk ? "MATCH" : "*** DIVERGES ***"}   (set by the BLUE channel, A-G126)`);
say(`  C* quantum for comparison: largest single-code |ΔC*| = ${f(Math.max(...STEPS.map(([, d]) => Math.abs(Cstar(MEDIUM.map((c, i) => c + d[i])) - Cstar(MEDIUM)))))}   recorded 0.5050`);
say(`\n  ANCHOR: ${anchorOk && qOk ? "REPRODUCES at the fourth decimal" : "*** DOES NOT REPRODUCE — STOP ***"}`);

say("\n  [1b] q_proj under each white point — the 4th decimal is a convention, not a measurement:");
say("       white point                     q_proj     C* quantum");
const saveWn = Wn;
for (const [name, w] of Object.entries(WP)) {
  Wn = w;
  const b2 = proj(MEDIUM, hueDeg(GAP_HUE)), th = hueDeg(GAP_HUE);
  const qp = Math.max(...STEPS.map(([, d]) => Math.abs(proj(MEDIUM.map((c, i) => c + d[i]), th) - b2)));
  const qc = Math.max(...STEPS.map(([, d]) => Math.abs(Cstar(MEDIUM.map((c, i) => c + d[i])) - Cstar(MEDIUM))));
  say(`       ${name.padEnd(30)} ${f(qp)}     ${f(qc)}`);
}
Wn = saveWn;
say("       A-G126 and A-G124 state 0.4797 and 0.5050 as exact to four decimals and name no white point.");
say("       Both are reproduced by one convention and missed by the fourth decimal under another, so the");
say("       figures are good to THREE decimals: q_proj = 0.480, C* quantum = 0.505. This lane wrote them.");

/* ══════════════════ [2] A-G131's three regimes ══════════════════ */
say("\n" + "-".repeat(104));
say("[2] A-G131's THREE REGIMES, recomputed under A-G81's model (quantise alpha, then composite).");
say("    A-G131 set PINK's factor floor from this table, so A-G106 applies to it: a figure inside a rule");
say("    meets the rule's evidentiary standard. This lane is checking its own adjudication, not GRÜN's.\n");

/** The first alpha at which the composite triple leaves the medium at all. */
let firstVisible = null;
for (let k = 0; k <= 255 && firstVisible === null; k++) {
  const a = (k - 0.5) / 255 + 1e-12;                     // just above the k-th rounding boundary
  if (a <= 0) continue;
  const c = over(GAP_HUE, MEDIUM, a);
  if (c.some((v, i) => v !== MEDIUM[i])) firstVisible = { a, k, c };
}
const boundary = 0.5 / 255;
say(`  exact first-visible alpha boundary: qa(a) first reaches 1/255 at a = 0.5/255 = ${f(boundary, 7)}`);
say(`  composite there: rgb(${firstVisible.c})   projected = ${f(proj(firstVisible.c, THETA) - base)} = ${f((proj(firstVisible.c, THETA) - base) / q_proj, 3)} q_proj`);
say(`  A-G131 states the exact figure as a = 0.00210 and the first regime's step as 0.329 q_proj.\n`);

say("  every distinct composite the gap hue can produce over the medium, by alpha code k = round(a*255):");
say("    k    alpha band                      composite        projected   in q_proj");
const seen = new Set(); const rows = [];
for (let k = 0; k <= 12; k++) {
  const a = k / 255, c = over(GAP_HUE, MEDIUM, a), key = c.join(",");
  const lo = Math.max(0, (k - 0.5) / 255), hi = (k + 0.5) / 255;
  const p = proj(c, THETA) - base;
  rows.push([k, lo, hi, c, p, p / q_proj, seen.has(key)]);
  seen.add(key);
}
for (const [k, lo, hi, c, p, pq, dup] of rows) {
  say(`    ${String(k).padStart(2)}   [${f(lo,6)}, ${f(hi,6)})   rgb(${c.join(",").padEnd(11)})   ${f(p).padStart(8)}    ${f(pq,3).padStart(7)}${dup ? "   (same triple as k-1)" : ""}`);
}
const canOccur = new Set(rows.map(r => r[3].join(",")));
say("\n  [2b] is rgb(7,12,17) — A-G131's middle regime's first state — reachable under ANY compositing");
say("       model this lane can name? The glow circle carries className \"mf-wave mf-wave-halo\" (:711),");
say("       and :317/:290 give it a GROUP OPACITY of --mf-wave-mean = 0.8825 at the breath's mean, ranging");
say("       to 1.0 live. So the single-stage model used above is not the only candidate and the group");
say("       opacity is a third axis the pin ranges over (A-G171), not a detail.\n");

const GROUP = [["resting / mean", 0.8825], ["breath trough", 0.8825 - 0.1175], ["breath peak", 1.0]];
const models = {
  "single-stage, round":        a => over(GAP_HUE, MEDIUM, a),
  "single-stage, truncate":     a => { const A = Math.floor(a * 255) / 255; return GAP_HUE.map((c, i) => Math.floor(c * A + MEDIUM[i] * (1 - A))); },
  "two-stage (group opacity)":  (a, g) => over(GAP_HUE, MEDIUM, qa(a) * qa(g)),
  "linear-light composite":     a => { const A = qa(a); const enc = v => { const s2 = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1/2.4) - 0.055; return Math.round(Math.min(1, Math.max(0, s2)) * 255); };
                                        return GAP_HUE.map((c, i) => enc(lin(c) * A + lin(MEDIUM[i]) * (1 - A))); }
};
say("       model                          reaches rgb(7,12,17)?   first visible composite        first step (q_proj)");
for (const [name, fn] of Object.entries(models)) {
  for (const [gname, g] of (name.startsWith("two-stage") ? GROUP : [["—", 1]])) {
    let hit = false, first = null;
    for (let k = 1; k <= 255; k++) {
      const c = fn(k / 255, g);
      if (c.join(",") === "7,12,17") hit = true;
      if (first === null && c.some((v, i) => v !== MEDIUM[i])) first = c;
    }
    const fp = first ? (proj(first, THETA) - base) / q_proj : 0;
    say(`       ${(name + (g === 1 && !name.startsWith("two") ? "" : ` @ ${gname}`)).padEnd(30)} ${(hit ? "YES" : "no").padEnd(22)}  rgb(${first.join(",").padEnd(10)})   ${f(fp, 3).padStart(8)}`);
  }
}
say("");
say("       Mechanism: R leaves 6 and G leaves 12 at the SAME alpha code. At qa = 1/255 the composite is");
say(`       R = round((1530 + 239)/255) = round(${f(1769/255, 4)}) = 7 and G = round((3060 + 154)/255) = round(${f(3214/255, 4)}) = 13.`);
say("       G's fractional part is 0.60, so G cannot stay at 12 while R moves to 7 under ANY integer alpha");
say("       code. Truncation moves both later together; the group opacity only changes WHICH code, not the");
say("       reachable set; linear compositing is refuted by the record's own figures (it puts R at 14 on the");
say("       first code, which no reading of A-G131's table contains).");
say("");
say("  WHAT THIS LANE IS CLAIMING, AND WHAT IT IS NOT:");
say("    CLAIMED: over a backdrop of EXACTLY rgb(6,12,17), rgb(7,12,17) is unreachable, the first visible");
say("             composite is rgb(7,13,17), and the first visible step is 0.737 q_proj, not 0.329.");
say("    CLAIMED: under A-G81 the exact first-visible alpha is 0.5/255 = 0.0019608, not 0.00210. A-G131");
say("             corrected GRUEN's \"about 0.003\" for overstating a floor used as a LOWER bound, and then");
say("             stated a figure that overstates the same floor by 7.1 %. A-G131 is this lane's.");
say("    NOT CLAIMED: that GRUEN's table is wrong. It may have been read off a RENDERED pixel whose backdrop");
say("             was not the modal medium — the wave, a sector wash or a ring seat each move it by a code,");
say("             and rgb(7,12,17) is reachable over a backdrop of rgb(6,11,17) or rgb(6,12,16). If so the");
say("             table is right about that pixel and the RECORD is wrong to present it as a function of");
say("             alpha over the modal medium. That is a question for the lane whose raster produced it,");
say("             and A-G209 binds this lane: an instruction from here that contradicts the record is void.");
say("");
say("  [2c] WHICH backdrops DO make rgb(7,12,17) reachable? Verified rather than asserted, because the");
say("       sentence above is the kind of parenthetical that becomes a defect two sections later.\n");
say("       backdrop        reaches rgb(7,12,17)?   at alpha code   first visible   first step (q_proj)");
let anyBackdrop = 0;
for (let dr = -1; dr <= 1; dr++) for (let dg = -1; dg <= 1; dg++) for (let db = -1; db <= 1; db++) {
  const bd = [6 + dr, 12 + dg, 17 + db];
  let at = null, first = null;
  for (let k = 1; k <= 64; k++) {
    const A = k / 255, c = GAP_HUE.map((ch, i) => Math.round(ch * A + bd[i] * (1 - A)));
    if (first === null && c.some((v, i) => v !== bd[i])) first = { c, k };
    if (c.join(",") === "7,12,17" && at === null) at = k;
  }
  if (at !== null) {
    anyBackdrop++;
    const b2 = proj(bd, THETA), fp = (proj(first.c, THETA) - b2) / q_proj;
    say(`       rgb(${bd.join(",").padEnd(10)})  ${"YES".padEnd(22)}  k = ${String(at).padStart(2)}          rgb(${first.c.join(",").padEnd(10)})   ${f(fp, 3).padStart(8)}`);
  }
}
if (anyBackdrop === 0) say("       none of the 27 backdrops within +/-1 code of the modal medium reaches it.");
say(`\n       ${anyBackdrop} of 27 backdrops within one code of the modal medium reach rgb(7,12,17).`);
say("       So the state is reachable in the RENDER and not over the medium the record names, which makes");
say("       \"which backdrop did you measure\" the whole question and not a quibble about a decimal.");
say("");
say("       AND NOTE WHAT NO BACKDROP DELIVERS: on rgb(6,11,17), the one backdrop where rgb(7,12,17) IS");
say("       the first visible composite, the first step is 0.715 q_proj. Not one backdrop within a code of");
say("       the medium produces a first step near 0.329.");
say("");
say("  [2d] THE MECHANISM OF A-G131's ERROR, which is more useful than the number:");
say(`       0.1579 / ${f(q_proj)} = ${f(0.1579/q_proj, 4)}. A-G131's 0.329 is A-G126's SINGLE-CODE R step divided by q_proj —`);
say("       i.e. it took the smallest step the METRIC can resolve as the smallest step the RASTER can");
say("       carry. Those are different sets. A single code moves alone only if something moves it alone,");
say("       and compositing a triple over a triple moves every channel at once: at qa = 1/255 R, G and B");
say("       all take their rounded step together, so the smallest ACHIEVABLE step is the vector step");
say("       (0.737 q_proj here), never the smallest component step.");
say("");
say("       This is A-G122's family — the quantity named in the right units and taken from the wrong set —");
say("       and it is the sixth shape in this record of extremum-versus-achievable. It is stated here as a");
say("       diagnosis, not offered as a new rule (A-G251).");
say("");
say("  CONSEQUENCE EITHER WAY, and it is the part that moves a decision:");
say("    A-G131 made 0.329 q_proj \"the hard lower bound on any factor PINK sets\" and concluded that");
say("    \"a factor of 1.0 q_proj sits a comfortable 3 x above the floor ... the first time in this phase a");
say(`    threshold has had headroom rather than a margin\". If the floor is 0.737, the headroom is ${f(1/0.737, 2)} x,`);
say("    not 3 x, and that sentence does not survive. The floor is UNCONFIRMED until the lane with the");
say("    raster says which backdrop it measured, and a factor must not be set against it meanwhile.");

/* ══════════════════ [3] the achievable envelope on MEDIUM pixels ══════════════════ */
say("\n" + "-".repeat(104));
say("[3] THE ACHIEVABLE ENVELOPE — the gap glow's alpha on MEDIUM pixels, seat edge to rim.");
say("    A-G171: evaluate along the axes the pin ranges over. PG-12 ranges over the glow's own radius and");
say("    over RANK (t sets haloMult, :679/:711), so both ends of both axes are reported, never one point.\n");

const share = o => {
  for (let i = 1; i < GLOW_RAMP.length; i++) {
    const [o0, s0] = GLOW_RAMP[i - 1], [o1, s1] = GLOW_RAMP[i];
    if (o <= o1) return s0 + (s1 - s0) * (o - o0) / (o1 - o0);
  }
  return 0;
};
say("    the OPAQUE seat (:724, fill=SEAT at exactly r) occludes the glow out to offset 1/haloMult,");
say("    so the first medium pixel the glow can reach sits at that offset, not at the flat head.\n");
say("    The group opacity (:317/:290, --mf-wave-mean 0.8825 +/- 0.1175) multiplies the gradient's alpha,");
say("    so the envelope is reported at the breath's TROUGH and PEAK, which bracket every phase.\n");
const GOPS = [["trough", 0.765], ["mean", 0.8825], ["peak", 1.0]];
for (const [label, mult] of [["rank 1 (t=0, haloNear)", HALO_NEAR], ["last rank (t=1, haloFar)", HALO_FAR]]) {
  const o0 = 1 / mult;
  say(`  ${label}:  haloMult = ${f(mult,1)},  seat edge at offset ${f(o0, 6)}`);
  say("    offset     share     alpha      composite @mean  projected    q_proj: trough / mean / peak");
  for (const o of [o0, 0.45, 0.58, 0.72, 0.86, 0.95, 0.999, 1.0]) {
    if (o < o0) continue;
    const s = share(o), a = PEAK_ALPHA * s;
    const cell = g => { const A = qa(a) * qa(g), c = over(GAP_HUE, MEDIUM, A); return (proj(c, THETA) - base) / q_proj; };
    const c = over(GAP_HUE, MEDIUM, qa(a) * qa(0.8825)), p = proj(c, THETA) - base;
    say(`    ${f(o,4).padStart(6)}   ${f(s,4).padStart(7)}   ${f(a,5).padStart(7)}   rgb(${c.join(",").padEnd(12)})  ${f(p,3).padStart(8)}   ${GOPS.map(([, g]) => f(cell(g),1).padStart(7)).join(" ")}`);
  }
  const aMax = PEAK_ALPHA * share(o0);
  for (const [gl, g] of GOPS) {
    const A = qa(aMax) * qa(g), c2 = over(GAP_HUE, MEDIUM, A);
    say(`    → peak on a medium pixel @ ${gl.padEnd(7)}: effective alpha ${f(A,5)} = ${String(Math.round(A/boundary)).padStart(3)} × the raster floor, ${f((proj(c2, THETA) - base)/q_proj, 1).padStart(5)} q_proj`);
  }
  say("");
}

/* ══════════════════ [4] the carrier bound and the missing datum ══════════════════ */
say("-".repeat(104));
say("[4] THE CARRIER BOUND — and the one datum this gate cannot get from constants.\n");
say("  Structural, read off the renderer rather than inferred (A-G31/A-G51: name the carrier in the");
say("  renderer's own vocabulary):");
say("    · the gap hue has exactly ONE carrier inside the field SVG — `url(#mf-halo-gap)` on the single");
say("      <circle> at :711. GAP_HUE appears at :190 (the constant), :862 (an HTML <li> legend, outside");
say("      the SVG) and :910 (the gradient). Nowhere else.");
say("    · that gradient declares no gradientUnits and no spreadMethod, and its last stop is");
say(`      stopOpacity ${f(PEAK_ALPHA * 0, 2)} at offset 1 — so the hue reaches exactly 0 at the circle's own rim,`);
say("      and SVG paints nothing outside the shape. No filter touches the glow (:306/:311 are brightness");
say("      and drop-shadow on transients and focus rings, not on `mapping-glows`).");
say("");
say("  CONSEQUENCE for A-G128, and it is the finding:");
say("    A-G124's failing observation is \"medium pixels at a given radius adjacent to a GAP body's glow");
say("    carrying measurably more chroma than medium pixels at the same radius adjacent to a NON-GAP");
say("    body's glow\". Taken strictly OUTSIDE the gap glow's own circle the projection is identically");
say("    zero by construction, so there is no failing observation; taken INSIDE it, the pin fires on the");
say("    glow itself, which is the mirror defect A-G126 rejected the magnitude form for.");
say("");
say("    The region that admits BOTH is the one neither reading names: where a gap body's glow circle");
say("    OVERLAPS the angular neighbourhood of a non-gap body. The glow runs to 2.6–3.0 × the drawn");
say("    radius while A-G1's collision search only guarantees the DRAWN radii do not touch — so glow");
say("    overlap is permitted by the layout and is the only mechanism that can place gap chroma where");
say("    no gap body is. PG-12 is therefore satisfiable, and what it actually tests is glow overlap.");
say("");
say("  THE DATUM THE GATE STILL NEEDS — stated narrowly, per A-G132, by the requester:");
say("    one scalar: the MAXIMUM gap-glow alpha landing on a medium pixel whose nearest drawn body is a");
say("    NON-GAP body, over the exercised layouts, at L0/1920 and L1. It is a layout computation from");
say("    `layout-spec-v1.1.json` and the fixtures — no render, no raster, no credential. Not the chroma,");
say("    not a verdict, not a per-layout table: one alpha.");
say("");
say(`  Bounds on PINK's factor once that scalar exists, in q_proj:`);
say(`    lower — the smallest step the raster can carry: ${f((proj(firstVisible.c, THETA) - base)/q_proj, 3)} q_proj at alpha ${f(boundary,7)}`);
say(`    upper — whatever the datum above delivers; it cannot exceed the seat-edge peak of`);
say(`            ${f((proj(over(GAP_HUE, MEDIUM, PEAK_ALPHA * share(1/HALO_FAR)), THETA) - base)/q_proj, 1)} q_proj (last rank) / ${f((proj(over(GAP_HUE, MEDIUM, PEAK_ALPHA * share(1/HALO_NEAR)), THETA) - base)/q_proj, 1)} q_proj (rank 1).`);
say("");
say("  VERDICT OF THIS GATE: PG-12 (re-formed) ADMITS BOTH a passing and a failing observation, on the");
say("  overlap region named above. It does NOT admit a failing observation on either region A-G124's");
say("  wording can be read as naming, so A-G124's fifth field needs the region stated — that is this");
say("  lane's to write and it is written in the adjudication, not here.");
say("\n" + "=".repeat(104));
