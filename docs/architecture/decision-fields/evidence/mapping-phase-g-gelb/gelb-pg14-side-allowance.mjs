/**
 * GELB · PG-14's SIDE ALLOWANCE — PINK found two labels bought as one; this adds a THIRD that is
 * bought not at all, and it is at L1, which is why neither lane's route could reach it.
 *
 * `frameWithBodies` buys the side allowance at 4b83414e:498 from ONE string:
 *     side = Math.max(collar, (b.title.length * 0.62 * font) / 2)
 * and the body draws up to THREE texts (all inside the body's own translated group):
 *     :757  mapping-name-*          SANS,  textAnchor=middle, x = 0                 — bought (the title)
 *     :760  mapping-measure-*       MONO,  textAnchor=middle, x = 0                 — NOT bought (PINK)
 *     :753  mapping-collar-more-*   MONO,  left-anchored,     x = collarR + 3k      — NOT bought (this)
 *           rendered only at L1, with collar.hidden > 0 and inPoolNow
 *
 * The first two are centred, so each needs HALF its width either side. The third is LEFT-ANCHORED at
 * the collar's right edge, so it needs its FULL width beyond that edge — a strictly worse shape, and
 * the one no sweep over centred labels would surface.
 *
 * Assumptions, all named because the conclusion is a derivation and not a measurement:
 *   · CHAR_EM for MONO = 0.602 em/char — PINK's MEASURED worst case (its mean is 0.5632); the product
 *     assumes a flat 0.62 at :498 as a bare literal, NOT via CHAR_EM at :452. See the duplication note.
 *   · font = TEXT_MIN_PX * k * FLOOR_HEADROOM = 11 * k * 1.002
 *   · collarR(b) = radiusOf(b) + 2.6k  (:654) and the frame's own collar term (:497) is
 *     r + 2.6k + max(2.4k, 0.18r) + 3.6k
 *   · the body radius in CSS px is PG-3's own range, 28 … 46 (diameter 56 … 92 at 1920)
 * It needs the real `c.more(n)` copy and an L1 fixture to confirm — which is A-G51's fixture exactly.
 */
const TEXT_MIN_PX = 11, FLOOR_HEADROOM = 1.002, EM_MONO = 0.602, EM_ASSUMED = 0.62;
const f = (x, n = 3) => x.toFixed(n);
console.log("=".repeat(100));
console.log("GELB · PG-14's THIRD LABEL — the collar's \"more\" text is left-anchored and unbought");
console.log("=".repeat(100));
console.log("\nThe fit condition. Writing rpx for the body radius in CSS px (so r = rpx * k):");
console.log("  allowance  side   >= collar = r + 2.6k + max(2.4k, 0.18r) + 3.6k");
console.log("  required   reach   = collarR + 3k + width = r + 2.6k + 3k + chars * EM * font");
console.log("  so it fits iff     chars * EM * 11 * 1.002 * k  <=  max(2.4k, 0.18r) + 0.6k");
console.log("\n  Taking the 0.18r branch (it dominates for every rpx >= 14):");
console.log("    chars <= (0.18 * rpx + 0.6) / (EM * 11 * 1.002)\n");
console.log("  rpx   diameter   chars that FIT (MONO 0.602)   chars that FIT (product's 0.62)");
for (const rpx of [28, 32, 36, 40, 46]) {
  const budget = em => (0.18 * rpx + 0.6) / (em * TEXT_MIN_PX * FLOOR_HEADROOM);
  console.log(`  ${String(rpx).padStart(3)}    ${String(2*rpx).padStart(3)} px      ${f(budget(EM_MONO)).padStart(6)}                       ${f(budget(EM_ASSUMED)).padStart(6)}`);
}
console.log("\n  PG-3's stated range is a 56…92 px diameter at 1920, i.e. rpx 28…46.");
console.log("  → the budget is ONE CHARACTER at the smallest body and under one and a half at the largest.");
console.log("  → any real copy for \"n more\" overruns the frame on the right, at L1, whenever a collar hides");
console.log("    an arc. The label is left-anchored, so it overruns by nearly its whole width.");
console.log("\n  Why neither route reached it:");
console.log("    · GRÜN's sweep models 0.62 * title.length on both sides of its comparison, so the constant");
console.log("      cancels and the title is the only string in it (PINK's A-G244 point, one label further).");
console.log("    · PINK's stand is L0, and this text renders only at L1 with collar.hidden > 0.");
console.log("    · It is a DERIVATION here, not a measurement — it needs the copy string and A-G51's L1");
console.log("      fixture to become a reading. Recorded as a derivation with its assumptions named.");
console.log("\n" + "-".repeat(100));
console.log("AND A SEPARATE DEFECT IN THE SAME LINE, which costs nothing to state:");
console.log(`  :452  const CHAR_EM = 0.62;          ← the named constant, used at :459 for sector labels`);
console.log(`  :498  (b.title.length * 0.62 * font) ← the same number as a BARE LITERAL in the frame solve`);
console.log("  So CHAR_EM does not govern the frame. Changing it would silently leave the frame on 0.62,");
console.log("  and PINK's finding that 0.62 has 2.9 % headroom against a measured 0.602 worst case is a");
console.log("  finding about a literal that no constant controls.");
console.log("=".repeat(100));
