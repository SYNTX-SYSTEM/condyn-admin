/**
 * GRÜN · PHASE-G DEVELOPMENT READING · PG-11's MEASURABILITY: can the medium's coherent motion energy ever
 * clear A-G30's absolute guard on a calm field?  **NO VERDICT** (A-G36 point 2).
 *
 * ┌─ SPLIT SCOPE (§34 A-G111 / A-G113) ──────────────────────────────────────────────────────────────┐
 * │ A seal covers a pin's verdict-bearing quantity, NOT whether the pin can be measured at all.      │
 * │ PUBLISHABLE — the medium's own coherent energy, the guard's status, instrument validity,          │
 * │               sampling adequacy, the window rule, run-to-run variation.                          │
 * │ SEALED      — the relation carrier's energy and ANY relation-to-medium ratio. Publishing both     │
 * │               numerator and denominator would publish the ratio by arithmetic, so the relation    │
 * │               limb goes in the sealed file too, not only the quotient.                           │
 * └──────────────────────────────────────────────────────────────────────────────────────────────────┘
 *
 * A-G113's question, which is sharper than "is the guard binding": A-G30 added PINK's absolute guard to a
 * ratio, correctly — PG-11 returns INCONCLUSIVE unless the medium's coherent energy reaches 0.0002 in its own
 * right, because a ratio of two floor values is not a measurement. Neither lane then asked whether the
 * guarded quantity CAN clear the guard on a passing build. If a correctly calm field necessarily puts the
 * comparator under the guard, PG-11 can only return a number on a field that FAILS R17's calm — an obligation
 * whose verdict is fixed by construction, the A-G27/A-G28 class, in a pin GELB wrote and then guarded.
 *
 * A-G104's four fields:
 *   CARRIER     `.mf-travel` + `.mf-beam-glow`
 *   COMPARATOR  the medium's own layers at the same harmonics, GLOWS EXCLUDED — A-G10 pin 7 makes the glow
 *               body light and A-G48 makes it breathe, so including it would compare relation motion against
 *               BODY motion rather than against the medium.
 *   LEVEL       L0 carries; L2 reported; L1 NOT RUN until A-G51's fixture marks a body (zero beams absent a
 *               mark — A-G90).
 *   MOTION      LIVE only. A `reduce` reading is structurally impossible: `.mf-travel` is visibility:hidden
 *               off LIVE. That is the exact trap that produced PG-6's false red.
 * A-G42's two-pass rule: this is the TRAVEL-DRAWN pass and it may not reuse PF-8's frames.
 */
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import {
  chromium, openField, probeGeometry, clipOf, discMask, cdpSession, captureRaw, decodeLuminance, captureLuminance,
  classMasks, servedProvenance, PROVENANCE, CLASS_SELECTOR, WINDOW_SECONDS, HARMONICS, NULL_FREQS, lockIn, pct, e4
} from "./gruen-instrument.mjs";

const here = dirname(fileURLToPath(import.meta.url));
/* §82: the worktree whose .next/BUILD_ID and git state the provenance block records. Defaults to THIS
   worktree, so every existing reading is unaffected; GRUEN_WT points it at a second build served on its own
   port, which is how the A-G49 hooks are verified without rebuilding — or overwriting — the build the eight
   sealed readings were taken against. */
const WT = process.env.GRUEN_WT ?? resolve(here, "../../../../..");
const VW = Number(process.env.VW ?? 1920), VH = Number(process.env.VH ?? 1080);
const LEVEL = process.env.GRUEN_LEVEL ?? "L0";
const GUARD = 0.0002;   // A-G30 / PINK's §7 absolute guard

const browser = await chromium.launch();
/** masks under reduce so the breath never enters a mask; the travel is invisible there, so its mask comes
 *  from the LIVE pass's own geometry instead — see relationMask below. */
const R = await openField(browser, { reduce: true, vw: VW, vh: VH });
const provenance = await servedProvenance(R.page, WT);
const instrumentCommit = (() => { try { return execSync(`git -C ${WT} log -1 --format=%h -- docs/career_analysis/evidence/mapping-phase-g/scripts`, { encoding: "utf8" }).trim(); } catch { return null; } })();
const geo = await probeGeometry(R.page);
const clip = clipOf(geo, VW, VH);
const geom = discMask(clip, geo);
const { disc, N } = geom;
const cdpR = await cdpSession(R.page);
const { masks } = await classMasks(R.page, cdpR, clip, N, ["glowsAll", "bodyOutlines", "bodyNames", "arcs", "beams", "nodes", "sectorText"]);
await R.ctx.close();

const notMedium = new Uint8Array(N);
for (const cls of ["glowsAll", "bodyOutlines", "bodyNames", "arcs", "beams", "nodes", "sectorText"]) for (const i of masks[cls]) notMedium[i] = 1;

/* ── the LIVE pass: travel DRAWN (A-G42), its own frames ──────────────────────────────────────────── */
const L = await openField(browser, { reduce: false, vw: VW, vh: VH });
if (LEVEL !== "L0") {
  const t = await L.page.evaluate(() => {
    const bodies = [...document.querySelectorAll("[data-mapping-body]")];
    const pick = bodies.find(e => /role_all/.test(e.getAttribute("data-testid") ?? "")) ?? bodies[0];
    const key = pick.getAttribute("data-testid").replace(/^mapping-body-/, "");
    return { body: pick.getAttribute("data-testid"), pool: `mapping-pool-${key.split(":")[0]}` };
  });
  await L.page.click(`[data-testid="${t.pool}"]`); await L.page.waitForTimeout(700);
  if (LEVEL === "L2") { await L.page.click(`[data-testid="${t.body}"]`); await L.page.waitForTimeout(900); }
}
const clipL = clipOf(await probeGeometry(L.page), VW, VH);
const clipMatch = clipL.x === clip.x && clipL.y === clip.y && clipL.width === clip.width && clipL.height === clip.height;
const cdpL = await cdpSession(L.page);

/** The relation carrier, measured LIVE where it exists at all: .mf-travel + .mf-beam-glow by differential. */
const relationMask = await (async () => {
  const before = await captureLuminance(cdpL, clipL, N);
  await L.page.addStyleTag({ content: `${CLASS_SELECTOR.travel},${CLASS_SELECTOR.beamGlow}{visibility:hidden !important}` });
  await L.page.waitForTimeout(340);
  const after = await captureLuminance(cdpL, clipL, N);
  await L.page.evaluate(() => { for (const st of document.querySelectorAll("style")) if (st.textContent.includes("visibility:hidden")) st.remove(); });
  await L.page.waitForTimeout(300);
  const ix = [];
  for (let i = 0; i < N; i += 1) if (Math.abs(before[i] - after[i]) > 0.001) ix.push(i);
  return ix;
})();
const isRelation = new Uint8Array(N);
for (const i of relationMask) isRelation[i] = 1;

const mediumIx = [];
for (let i = 0; i < N; i += 1) if (disc[i] && !notMedium[i] && !isRelation[i]) mediumIx.push(i);
const CAP = 120000, stride = Math.max(1, Math.ceil(mediumIx.length / CAP));
const mediumSample = mediumIx.filter((_, n) => n % stride === 0);
const union = [...new Set([...relationMask, ...mediumSample])];
const posOf = new Map(union.map((v, n) => [v, n]));
const U = union.length;

const shots = [], ts = [], t0 = Date.now();
while (Date.now() - t0 < WINDOW_SECONDS * 1000) { shots.push(await captureRaw(cdpL, clipL)); ts.push((Date.now() - t0) / 1000); }
await L.ctx.close(); await browser.close();
const rows = [];
for (const s of shots) { const Lum = await decodeLuminance(s, N); const row = new Float32Array(U); for (let n = 0; n < U; n += 1) row[n] = Lum[union[n]]; rows.push(row); }
const F = rows.length, spanS = ts[F - 1] - ts[0], cadenceMs = (spanS * 1000) / Math.max(1, F - 1), nyquist = 1000 / (2 * cadenceMs);
const maxFreq = Math.max(...HARMONICS, ...NULL_FREQS);
const adequacy = { cadenceMs: +cadenceMs.toFixed(0), nyquistHz: +nyquist.toFixed(3), maxFittedFreqHz: maxFreq, limit: +(0.9 * nyquist).toFixed(3), adequate: maxFreq < 0.9 * nyquist };
const windowRule = { seconds: +spanS.toFixed(1), requiredSeconds: +(2 / (0.7 * 0.05)).toFixed(0), satisfied: spanS >= 2 / (0.7 * 0.05) };

const energyOf = ix => {
  const local = ix.map(i => posOf.get(i)).filter(n => n !== undefined), m = local.length;
  if (m === 0) return { px: 0 };
  const lock = lockIn(ts);
  const y = new Float64Array(F), pooled = new Float64Array(F);
  const sig = new Float64Array(m), nul = new Float64Array(m);
  for (let kk = 0; kk < m; kk += 1) {
    const n = local[kk];
    let mean = 0;
    for (let r = 0; r < F; r += 1) { y[r] = rows[r][n]; mean += y[r]; pooled[r] += rows[r][n]; }
    mean /= F;
    for (let r = 0; r < F; r += 1) y[r] -= mean;
    const f = lock.fit(y); sig[kk] = f.signal; nul[kk] = f.null;
  }
  let pm = 0; for (let r = 0; r < F; r += 1) { pooled[r] /= m; pm += pooled[r]; } pm /= F;
  const pf = lock.fit(Float64Array.from(pooled, v => v - pm));
  const sS = Float64Array.from(sig); sS.sort(); const nS = Float64Array.from(nul); nS.sort();
  return { px: m, pooledSignal: pf.signal, pooledNull: pf.null, perPixelP50: pct(sS, 0.5), perPixelP99: pct(sS, 0.99), nullP50: pct(nS, 0.5) };
};
const medium = energyOf(mediumSample);
const relation = energyOf(relationMask);

const common = {
  verdict: PROVENANCE.verdict, provenance: { ...provenance, instrumentCommit }, instrument: PROVENANCE,
  viewport: `${VW}x${VH}`, level: LEVEL, motion: "LIVE (travel drawn — A-G42's travel-drawn pass, its own frames)",
  frames: F, spanS: +spanS.toFixed(1), clipMatch, adequacyGuard: adequacy, windowRule,
  renderMode: "travel-drawn; may not reuse PF-8's travel-masked frames (A-G42 point 3)"
};

/* ── PUBLISHABLE: measurability only ───────────────────────────────────────────────────────────────── */
const guardClears = medium.pooledSignal >= GUARD;
const publishable = {
  ...common,
  reading: "GRÜN development reading · PG-11 MEASURABILITY — the medium's own coherent energy against A-G30's absolute guard",
  scope: "PUBLISHABLE per A-G111: a seal covers a pin's verdict-bearing quantity, not whether the pin can be measured at all. The relation limb and every ratio are in the SEALED companion file.",
  definitions: {
    comparator: "the medium's own layers: disc pixels that are NOT glow, NOT any sign, and NOT the relation carrier. Glows are excluded per A-G104 — A-G10 pin 7 makes them body light and A-G48 makes them breathe, so including them would compare relation motion against BODY motion.",
    energy: "coherent amplitude at the breath harmonics {0.1, 0.2, 0.3} from one joint LSQ, against a bracketed dof-matched null at {0.05, 0.15, 0.25, 0.35} (PINK's A-F17/A-F20 form)",
    guard: `A-G30: PG-11 returns INCONCLUSIVE unless the medium's coherent energy reaches ${GUARD} in its own right — a ratio of two floor values is not a measurement`,
    question: "A-G113: can the guarded quantity clear the guard on a PASSING build? If a correctly calm field necessarily puts it under, PG-11 can only return a number on a field that fails R17's calm."
  },
  mediumCoherentEnergy: {
    pixels: medium.px, pooledSignal: e4(medium.pooledSignal), pooledNull: e4(medium.pooledNull),
    pooledSignalOverNull: +(medium.pooledSignal / medium.pooledNull).toFixed(2),
    perPixelP50: e4(medium.perPixelP50), perPixelP99: e4(medium.perPixelP99), perPixelNullP50: e4(medium.nullP50)
  },
  guardThreshold: GUARD,
  guardClears,
  marginFactor: +(medium.pooledSignal / GUARD).toFixed(3),
  measurabilityReading: guardClears
    ? "the medium's coherent energy clears A-G30's guard in its own right on this build, so the guard is NOT binding and PG-11 can return a number as written"
    : "the medium's coherent energy is BELOW A-G30's guard on this build, so PG-11 cannot return a verdict here. Whether that is a property of a CALM field or of this field is the architecture's call (A-G113 reserves it), and this lane does not decide it.",
  relationLimb: "SEALED — see the companion file. Publishing numerator and denominator would publish the ratio by arithmetic."
};
writeFileSync(resolve(here, `../outputs/pg11-guard-${LEVEL}-${VW}x${VH}.json`), JSON.stringify(publishable, null, 1));

/* ── SEALED: the relation limb and the ratio ────────────────────────────────────────────────────────── */
const sealed = {
  SEALED: "§33 A-G109 / §34 A-G113 — PG-11's relation limb and every relation-to-medium ratio. Published to NOBODY, including GELB, until PINK's verdict on PG-11 is recorded.",
  ...common,
  reading: "GRÜN development reading · PG-11's relation limb and ratio",
  relationCoherentEnergy: { pixels: relation.px, pooledSignal: e4(relation.pooledSignal), pooledNull: e4(relation.pooledNull), perPixelP50: e4(relation.perPixelP50), perPixelP99: e4(relation.perPixelP99) },
  mediumCoherentEnergy: { pixels: medium.px, pooledSignal: e4(medium.pooledSignal), pooledNull: e4(medium.pooledNull) },
  relationOverMedium: medium.pooledSignal > 0 ? +(relation.pooledSignal / medium.pooledSignal).toFixed(3) : null,
  boundForReference: ">= 1.5",
  guardStatus: guardClears ? "clears" : "INCONCLUSIVE by A-G30 — the ratio below is reported for the sealed comparison and is not a verdict",
  attributionRule: "A-G42 point 2: this run states its attribution rule explicitly — relation pixels are the differential mask of .mf-travel + .mf-beam-glow taken LIVE; medium pixels are disc pixels that are neither glow, sign nor relation. The travel and the breath share a period (A-G13), so the harmonics cannot be attributed BETWEEN them within one mask; the separation here is spatial, by mask, not spectral."
};
writeFileSync(resolve(here, `../outputs/SEALED-pg11-ratio-${LEVEL}-${VW}x${VH}.json`), JSON.stringify(sealed, null, 1));

console.log(JSON.stringify({ viewport: `${VW}x${VH}`, level: LEVEL, frames: F, spanS: +spanS.toFixed(1),
  adequate: adequacy.adequate, windowOk: windowRule.satisfied, clipMatch,
  mediumPixels: medium.px, mediumPooledSignal: e4(medium.pooledSignal), mediumPooledNull: e4(medium.pooledNull),
  guardThreshold: GUARD, guardClears, marginFactor: publishable.marginFactor,
  relationLimb: "SEALED" }, null, 1));
