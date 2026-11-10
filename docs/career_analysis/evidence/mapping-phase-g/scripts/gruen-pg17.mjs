/**
 * GRÜN · PHASE-G DEVELOPMENT READING · PG-17, the glare ramp.  **NO VERDICT** (A-G36 point 2).
 *
 * ┌─ SEALED (§33 A-G109) ────────────────────────────────────────────────────────────────────────────┐
 * │ PG-17 has been measured by NO lane. For any such pin the development lane takes its reading and  │
 * │ SEALS it: committed here, published to NOBODY — including GELB — until PINK's verdict on PG-17   │
 * │ is recorded. Then both are compared as taken.                                                   │
 * │ The reason is that two readings which agree after one has seen the other are evidence of         │
 * │ nothing: sealing is what makes a divergence a finding at all (A-G36 point 4). A lane that can be │
 * │ compelled to publish early cannot be an independent second instrument.                          │
 * └──────────────────────────────────────────────────────────────────────────────────────────────────┘
 *
 * The obligation (§11): "Bodies are glare sources. Each body's surrounding ramp lies inside the critical
 * band: a monotone falloff over ≥ 1.5 × the body radius, with the core at ≥ 1.45 × the local ground,
 * measured on the render. A soft blur that is not a ramp does not satisfy it."
 *
 * A-G105's four fields, implemented exactly as stated and not as this instrument would have guessed:
 *   CARRIER    the union of the glow and the medium beneath it (A-G31's corrected domain — A-G18 had put
 *              PG-17 on medium pixels alone, which excluded the very thing it measures).
 *   OCCLUDERS  signs, their seats, AND any crossing ring seat, masked as area occluders (A-G97); the body's
 *              own name and measure excluded (A-G20's precedent — a label is the body's own figure).
 *              `glowsAll` is NOT an occluder: it IS the ramp (the self-occlusion error of §31).
 *   LEVEL      L0 at 1920 CARRIES. 1280 and L2 are reported and do not carry — L2 is the ramp's best case
 *              and must not be where the verdict is taken (A-G94's lesson applied before the measurement).
 *   MOTION     resting only, so PG-10 owns the modulation and PG-17 owns the shape, with no contest.
 */
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import {
  chromium, openField, probeGeometry, clipOf, discMask, cdpSession, captureLuminance, hide, unhideAll,
  signAndSeatMask, zeroByConstruction, servedProvenance, PROVENANCE, median, e4
} from "./gruen-instrument.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const WT = resolve(here, "../../../../..");
const VW = Number(process.env.VW ?? 1920), VH = Number(process.env.VH ?? 1080);
const LEVEL = process.env.GRUEN_LEVEL ?? "L0";
/** Near black the sRGB quantum dominates; a strict monotone test fails on one-code jitter. Named, not hidden. */
const MONO_EPS = Number(process.env.GRUEN_MONO_EPS ?? 2.2e-5);   // ~ one 8-bit code step at these levels

const browser = await chromium.launch();
const { ctx, page, guard } = await openField(browser, { reduce: true, vw: VW, vh: VH });
const provenance = await servedProvenance(page, WT);
const instrumentCommit = (() => { try { return execSync(`git -C ${WT} log -1 --format=%h -- docs/career_analysis/evidence/mapping-phase-g/scripts`, { encoding: "utf8" }).trim(); } catch { return null; } })();

if (LEVEL !== "L0") {
  const t = await page.evaluate(() => {
    const bodies = [...document.querySelectorAll("[data-mapping-body]")];
    const pick = bodies.find(e => /role_all/.test(e.getAttribute("data-testid") ?? "")) ?? bodies[0];
    const key = pick.getAttribute("data-testid").replace(/^mapping-body-/, "");
    return { body: pick.getAttribute("data-testid"), pool: `mapping-pool-${key.split(":")[0]}` };
  });
  await page.click(`[data-testid="${t.pool}"]`); await page.waitForTimeout(700);
  if (LEVEL === "L2") { await page.click(`[data-testid="${t.body}"]`); await page.waitForTimeout(900); }
}

const geo = await probeGeometry(page);
const clip = clipOf(geo, VW, VH);
const geom = discMask(clip, geo);
const { disc, N, W, H } = geom;
const cdp = await cdpSession(page);
const k = geo.unitsToPx;
const zeroChannel = await zeroByConstruction(cdp, clip, N, disc);

/** Tag the ring seats so A-G97's "any crossing ring seat" can be masked — none has a hook (A-G49). */
await page.evaluate(() => {
  for (const name of ["shelf", "best", "horizon", "field"]) {
    const ring = document.querySelector(`[data-testid="mapping-ring-${name}"]`);
    if (ring === null) continue;
    const r = ring.getAttribute("r");
    const seat = [...document.querySelectorAll("circle")].find(c => c !== ring && c.getAttribute("r") === r && /rgba\(0, 0, 0, 1\)/.test(c.getAttribute("stroke") ?? ""));
    if (seat !== undefined) seat.setAttribute("data-gruen-seat", name);
  }
});
/** occluders = signs + their seats + every ring seat; the ramp (glowsAll) is the SUBJECT, never an occluder */
const { covered } = await signAndSeatMask(page, cdp, clip, N, { exclude: ["glowsAll"] });
const ringSeatIx = await (async () => {
  const before = await captureLuminance(cdp, clip, N);
  await hide(page, "[data-gruen-seat]");
  const after = await captureLuminance(cdp, clip, N);
  await unhideAll(page);
  const ix = [];
  for (let i = 0; i < N; i += 1) if (Math.abs(before[i] - after[i]) > 0.001) ix.push(i);
  return ix;
})();
for (const i of ringSeatIx) covered[i] = 1;

const base = await captureLuminance(cdp, clip, N);
const drawn = geo.bodies.filter(b => b.inPool);
const perBody = [];
for (const b of drawn) {
  await hide(page, `[data-testid="mapping-name-${b.id}"],[data-testid="mapping-measure-${b.id}"]`);
  const woOwn = await captureLuminance(cdp, clip, N);
  await unhideAll(page);
  const own = new Uint8Array(N);
  for (let i = 0; i < N; i += 1) if (Math.abs(base[i] - woOwn[i]) > 0.001) own[i] = 1;

  const rPx = b.drawnRadiusUnits * k, bcx = b.cx - clip.x, bcy = b.cy - clip.y;
  /** carrier sample at a radial band, in units of r: uncovered pixels, own labels excluded */
  const bandMedian = (lo, hi) => {
    const vals = [];
    const outer = hi * rPx;
    for (let y = Math.floor(bcy - outer); y <= Math.ceil(bcy + outer); y += 1) for (let x = Math.floor(bcx - outer); x <= Math.ceil(bcx + outer); x += 1) {
      if (x < 0 || y < 0 || x >= W || y >= H) continue;
      const d = Math.hypot(x - bcx, y - bcy) / rPx;
      if (d < lo || d >= hi) continue;
      const i = y * W + x;
      if (covered[i] || own[i]) continue;
      vals.push(base[i]);
    }
    return { n: vals.length, median: vals.length ? median(vals) : null };
  };
  /** the ramp profile outward from the rim; the glow's own extent is haloNear…haloFar = 2.6…3.0 r */
  const STEP = 0.05;
  const profile = [];
  for (let u = 1.0; u < 3.0 - 1e-9; u += STEP) {
    const s = bandMedian(u, u + STEP);
    profile.push({ uFrom: +u.toFixed(2), uTo: +(u + STEP).toFixed(2), n: s.n, median: s.median === null ? null : +s.median.toExponential(4) });
  }
  /** monotone falloff extent from the rim, with the quantum-tolerant epsilon named */
  const vals = profile.map(p => (p.median === null ? null : Number(p.median)));
  let extentStrict = 0, extentEps = 0;
  for (let i = 1; i < vals.length; i += 1) {
    if (vals[i] === null || vals[i - 1] === null) break;
    if (vals[i] <= vals[i - 1]) extentStrict = (i + 1) * STEP; else break;
  }
  for (let i = 1; i < vals.length; i += 1) {
    if (vals[i] === null || vals[i - 1] === null) break;
    if (vals[i] <= vals[i - 1] + MONO_EPS) extentEps = (i + 1) * STEP; else break;
  }
  const core = bandMedian(0, 0.5);
  const localGround = bandMedian(3.2, 4.0);
  const first = vals.find(v => v !== null), last = [...vals].reverse().find(v => v !== null);
  perBody.push({
    rank: b.rank, shelf: b.shelf, drawnRadiusPx: +rPx.toFixed(2), requiredGaps: b.requiredGaps,
    coreMedian: core.median === null ? null : +core.median.toExponential(4), corePixels: core.n,
    localGroundMedian: localGround.median === null ? null : +localGround.median.toExponential(4), localGroundPixels: localGround.n,
    coreOverLocalGround: core.median !== null && localGround.median ? +(core.median / localGround.median).toFixed(3) : null,
    monotoneExtentInR_strict: +extentStrict.toFixed(2), monotoneExtentInR_epsTolerant: +extentEps.toFixed(2),
    rampDynamicRange: first && last ? +(first / Math.max(1e-12, last)).toFixed(3) : null,
    profile
  });
}
await ctx.close(); await browser.close();

const out = {
  SEALED: "§33 A-G109 — published to NOBODY, including GELB, until PINK's verdict on PG-17 is recorded. Committed so it cannot be revised after seeing PINK's.",
  reading: "GRÜN development reading · PG-17, the glare ramp, per A-G105's four fields",
  verdict: PROVENANCE.verdict, provenance: { ...provenance, instrumentCommit }, instrument: PROVENANCE, guard,
  zeroByConstructionChannel: zeroChannel,
  viewport: `${VW}x${VH}`, level: LEVEL, carries: LEVEL === "L0" && VW === 1920,
  carriesNote: "A-G105: L0 at 1920 carries. 1280 and L2 are reported and do NOT carry — L2 is the ramp's best case and must not be where a verdict is taken.",
  motion: "resting (reducedMotion:reduce) — PG-10 owns the modulation, PG-17 owns the shape",
  definitions: {
    carrier: "the union of the glow and the medium beneath it (A-G31). glowsAll is the SUBJECT and is never an occluder — treating it as one was §31's self-occlusion error.",
    occluders: "signs, their seats, and EVERY ring seat (A-G97's 'any crossing ring seat'), plus the body's own name and measure excluded per A-G20. Ring seats carry no hook (A-G49) and are tagged by geometry.",
    boundMonotone: "a monotone falloff over >= 1.5 x the body radius",
    boundCore: "the core at >= 1.45 x the local ground",
    notABlur: "'a soft blur that is not a ramp does not satisfy it' — rampDynamicRange is reported so a flat blur cannot pass as a ramp on monotonicity alone",
    monoEpsilon: `near black the sRGB quantum dominates, so a strictly non-increasing test fails on one-code jitter. Both a STRICT extent and an eps-tolerant extent are reported, eps = ${MONO_EPS} (~ one 8-bit code step at these levels). Neither is presented as the figure; the pair is.`,
    localGround: "median of uncovered carrier pixels in 3.2 ... 4.0 r, beyond the glow's own haloFar of 3.0 r",
    profileStep: "0.05 r bands from the rim (1.0 r) to 3.0 r"
  },
  perBody
};
writeFileSync(resolve(here, `../outputs/SEALED-pg17-${LEVEL}-${VW}x${VH}.json`), JSON.stringify(out, null, 1));
console.log(`SEALED reading written: SEALED-pg17-${LEVEL}-${VW}x${VH}.json  (${perBody.length} bodies, zero-channel ${zeroChannel.measured}, valid ${zeroChannel.valid})`);
