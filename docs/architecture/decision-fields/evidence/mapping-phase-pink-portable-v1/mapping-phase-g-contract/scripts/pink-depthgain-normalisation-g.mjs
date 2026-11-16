/** PINK · PHASE G · §18 · the depth-gain ladder and WHO IS IN ITS DENOMINATOR, measured on 3ec8457d.
 *
 *  NOT a pin. This is the inverse pass GELB asked for in §61: an instrument aimed at a coupling that
 *  no pin in either phase mentions, found by reading the build rather than the register.
 *
 *  THE COUPLING. `depthGain(rank, lastRank) = VOLUME.depthRatio ** -((rank-1)/(lastRank-1))`
 *  (PersonJobMappingField.tsx:170) is consumed twice -- by the halo group's opacity (:669) and by the
 *  body core's opacity (:697). `lastRank` is `Math.max(1, ...model.bodies.map(b => b.rank))` (:636),
 *  taken over ALL bodies. But the SHELF bodies rest: their halo circle gets `className={undefined}`
 *  instead of `mf-wave mf-wave-halo` and no `animationDelay` (:670), per A-F8.
 *
 *  So every BREATHING body's depth gain is normalised by a denominator that counts bodies which never
 *  breathe. The gain ladder spans [depthRatio^-1, 1] = [0.689655, 1] for ANY body count >= 2, because
 *  t is normalised; what the shelf population changes is WHERE IN THAT LADDER the breathing subset
 *  sits. Add a resting body and every moving body's gain goes UP.
 *
 *  WHY IT MATTERS. PG-10's limb 1 is a MINIMUM (>= 0.25) on a quantity that §16 measured as scaling
 *  with this gain -- the gain scales the breath, not just the resting level. If the deepest BREATHING
 *  body is the one that fails, its gain, and therefore the verdict, is a function of how many resting
 *  bodies happen to be on the shelf. Nothing in PG-10 states a body count, a field/shelf split, or a
 *  rank.
 *
 *  `.mf-core` is the clean readout: its opacity IS depthGain, unmultiplied (:697), so the ladder can
 *  be read exactly instead of inferred from a composite. The halo group carries `opacity * depthGain`
 *  and is reported alongside as the second route; they must agree.
 *
 *  Halos are paired to cores by CONCENTRICITY (< 2 px between bounding-box centres), because no halo
 *  of any kind carries its body's identity in the DOM -- the React `key` (`halo|${b.key}`) is not
 *  rendered. That pairing is itself a finding: A-G194's per-body requirement is met today only by a
 *  geometric inference, not by a hook.
 *
 *  Radii are SVG user units (field units), read from the `r` attribute -- no `k` is taken and none is
 *  needed, because every quantity here is a ratio. (Rule 5: `k` is the standing unit trap; the way to
 *  be safe from it is to not need it.)
 */
import { playwright, provenance } from "../../../mapping-phase-pink-tools/pink-tools.mjs";
const PINK_PROV_3ec8457d = await provenance({ declaredCommit: "3ec8457d" });
const chromium = await playwright();
const BASE = process.env.PINK_BASE ?? "http://127.0.0.1:3122";
const URL = `${BASE}/career/demo?focus=MAPPING&investigationMode=PERSON&analysisId=CAN_00000000000000000000000000000002`;
const DEPTH_RATIO = 1.45, HALO_NEAR = 2.6, HALO_FAR = 3.0;

const probe = page => page.evaluate(() => {
  const ctr = el => { const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; };
  const cores = [...document.querySelectorAll('circle.mf-core')].map(c =>
    ({ gain: Number(getComputedStyle(c).opacity), r: Number(c.getAttribute('r')), c: ctr(c) }));
  const halos = [...document.querySelectorAll('.mf-halo')].map(g => {
    const c = g.querySelector('circle'), cs = getComputedStyle(c);
    return { hasWaveClass: c.classList.contains('mf-wave-halo'), animationName: cs.animationName,
      animationDelay: cs.animationDelay, groupOpacity: Number(getComputedStyle(g).opacity),
      haloR: Number(c.getAttribute('r')), c: ctr(c) };
  });
  const bodies = halos.map(h => {
    const m = cores.filter(k => Math.hypot(k.c.x - h.c.x, k.c.y - h.c.y) < 2.0);
    return { pairedCores: m.length, coreGain: m.length === 1 ? m[0].gain : null,
      bodyR: m.length === 1 ? m[0].r : null, hasWaveClass: h.hasWaveClass,
      animationName: h.animationName, animationDelay: h.animationDelay,
      haloGroupOpacity: h.groupOpacity, haloR: h.haloR };
  });
  return { nCores: cores.length, nHalos: halos.length, bodies };
});

async function run(VW, VH) {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: 1, reducedMotion: "no-preference" });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForSelector('[data-testid="mapping-field"]', { timeout: 30000 });
  await page.waitForTimeout(2500);
  const raw = await probe(page);
  await b.close();

  const lastRank = raw.nCores;
  // rank is recovered from the gain, not assumed: gain = ratio^-((rank-1)/(lastRank-1)) is strictly monotone.
  const rankOf = g => lastRank <= 1 ? 1 : Math.round(1 + (lastRank - 1) * (-Math.log(g) / Math.log(DEPTH_RATIO)));
  const bodies = raw.bodies.map(d => {
    const rank = d.coreGain === null ? null : rankOf(d.coreGain);
    const t = rank === null || lastRank <= 1 ? null : (rank - 1) / (lastRank - 1);
    const predictedGain = t === null ? null : Math.round(DEPTH_RATIO ** -t * 1e6) / 1e6;
    const breathes = d.animationName !== "none";
    return { rank, t, coreGain: d.coreGain, predictedGain,
      gainAgreesWithLaw: predictedGain !== null && Math.abs(predictedGain - d.coreGain) < 5e-6,
      secondRouteGroupOpacity: d.haloGroupOpacity,
      twoRoutesAgree: d.coreGain !== null && Math.abs(d.haloGroupOpacity - d.coreGain) < 2e-3,
      breathes, hasWaveClass: d.hasWaveClass,
      classAndAnimationAgree: d.hasWaveClass === breathes,
      animationName: d.animationName, animationDelay: d.animationDelay,
      bodyR: d.bodyR, haloR: d.haloR,
      haloOverBody: d.bodyR ? Math.round(d.haloR / d.bodyR * 1e4) / 1e4 : null,
      predictedHaloOverBody: t === null ? null : Math.round((HALO_NEAR + (HALO_FAR - HALO_NEAR) * t) * 1e4) / 1e4,
      pairedCores: d.pairedCores };
  }).sort((a, b2) => (a.rank ?? 99) - (b2.rank ?? 99));

  const breathing = bodies.filter(b2 => b2.breathes), resting = bodies.filter(b2 => !b2.breathes);
  const deepestBreathing = breathing.length ? breathing[breathing.length - 1] : null;
  return {
    viewport: `${VW}x${VH}`, lastRank, nCores: raw.nCores, nHalos: raw.nHalos,
    allPairedOneToOne: bodies.every(b2 => b2.pairedCores === 1),
    ladderFollowsLaw: bodies.every(b2 => b2.gainAgreesWithLaw),
    twoRoutesAgreeAll: bodies.every(b2 => b2.twoRoutesAgree),
    classAndAnimationAgreeAll: bodies.every(b2 => b2.classAndAnimationAgree),
    haloRadiusLawHoldsAll: bodies.every(b2 => b2.haloOverBody !== null && Math.abs(b2.haloOverBody - b2.predictedHaloOverBody) < 2e-3),
    breathingRanks: breathing.map(b2 => b2.rank), restingRanks: resting.map(b2 => b2.rank),
    ladder: bodies.map(b2 => b2.coreGain),
    deepestBreathing: deepestBreathing && { rank: deepestBreathing.rank, gain: deepestBreathing.coreGain },
    deepestOverall: bodies.length ? { rank: bodies[bodies.length - 1].rank, gain: bodies[bodies.length - 1].coreGain, breathes: bodies[bodies.length - 1].breathes } : null,
    restingBodiesOccupyDeepRungs: resting.length > 0 && breathing.length > 0 &&
      Math.min(...resting.map(b2 => b2.rank)) > Math.max(...breathing.map(b2 => b2.rank)),
    bodyRadiusMonotoneInRank: bodies.every((b2, i, a) => i === 0 || a[i - 1].bodyR >= b2.bodyR),
    bodies };
}

const out = { reading: "PINK §18 — the depth-gain ladder and who is in its denominator",
  verdict: "NONE — this is an inverse-pass coupling report, not a pin verdict (A-G36 point 2 applies to me too)",
  commit: PINK_PROV_3ec8457d.observedCommit, constants: { depthRatio: DEPTH_RATIO, haloNear: HALO_NEAR, haloFar: HALO_FAR },
  runs: [] };
for (const [w, h] of [[1920, 1080], [1280, 800]]) out.runs.push(await run(w, h));

// Derived, NOT measured: what a larger shelf would do to the deepest breathing body's gain.
const g = n => Math.round(DEPTH_RATIO ** -(1 / (n - 1)) * 1e6) / 1e6;   // rank 2 of n bodies
out.derivedNotMeasured = {
  note: "Arithmetic from the confirmed gain law, NOT a measurement. Testable only with a fixture carrying a larger shelf, which this lane does not have and will not fabricate.",
  rank2GainByTotalBodies: Object.fromEntries([3, 4, 5, 6, 7, 8, 9, 12].map(n => [n, g(n)])),
  claim: "If the deepest BREATHING body is rank 2, adding RESTING shelf bodies raises its gain monotonically toward 1, because t = (rank-1)/(lastRank-1) shrinks as lastRank grows." };

// PG-10 limb 1 under that arithmetic. §16 measured the deepest BREATHING body (rank 2, gain 0.911293)
// at 0.243 (1920) and 0.223 (1280) against a MINIMUM of 0.25, and §16 also established that the gain
// scales the breath, not only the resting level. So divide out the gain and re-apply it at other
// shelf populations. The ladder's ceiling is 1.0 (rank 1), which bounds what any population can buy.
const LIMB1_BOUND = 0.25, GAIN_AT_MEASUREMENT = 0.911293;
out.limb1PopulationSensitivity = {
  note: "DERIVED from the measured gain law plus §16's measured limb-1 values. Not itself a measurement. The point is the ENVELOPE, per A-G171: satisfiability is a property of the reachable set, and body population is an axis PG-10 does not mention.",
  bound: LIMB1_BOUND, gainAtMeasurement: GAIN_AT_MEASUREMENT,
  perViewport: Object.fromEntries([["1920", 0.243], ["1280", 0.223]].map(([vp, measured]) => {
    const perUnitGain = measured / GAIN_AT_MEASUREMENT, gainNeeded = LIMB1_BOUND / perUnitGain;
    return [vp, { measured, perUnitGain: Math.round(perUnitGain * 1e6) / 1e6,
      gainNeededToClear: Math.round(gainNeeded * 1e6) / 1e6,
      reachableWithinLadder: gainNeeded <= 1.0,
      byTotalBodies: Object.fromEntries([5, 6, 7, 8, 9, 12].map(n => {
        const v = perUnitGain * g(n); return [n, { value: Math.round(v * 1e5) / 1e5, clears: v >= LIMB1_BOUND }]; })) }];
  })),
  finding: "At 1920 the limb-1 failure is CONTINGENT: it clears at 7 total bodies (two more resting shelf bodies than this fixture carries), because the gain needed (0.937544) lies inside the ladder. At 1280 it is ROBUST: clearing would need a gain of 1.021629, above the ladder's ceiling of 1.0, so NO body count and NO field/shelf split can lift it. The 1280 failure therefore survives the whole population axis; the 1920 one does not." };

console.log(JSON.stringify(out, null, 2));
