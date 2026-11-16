/**
 * GRÜN · PHASE-G DEVELOPMENT READING · PG-20's splay MAGNITUDE in rendered px, at every level it is drawn.
 * **NO VERDICT** (A-G36 point 2).
 *
 * A-G43's second limb, which GELB calls BLOCKING: the splay's magnitude in rendered pixels is unmeasured at
 * either size. Lateral end displacement ≈ 0.6 × tick, tick = max(2.4 k, 0.18 r), and 1280 is named as the
 * prime suspect for a sub-perceptual reinforcement.
 *
 * MEASURED AT BOTH LEVELS, because the magnitude is a function of the level and A-G43 does not say which:
 *   L0 / L1 — the same arcs are drawn as COLLAR ticks at collarR(b), where r is small, so
 *             tick = max(2.4 k, 0.18 r) collapses onto the 2.4 k PIXEL FLOOR. This is where a
 *             sub-perceptual reinforcement is actually at risk, and it is the first thing a reader sees.
 *   L2      — the full requirement ring, where r is the ring radius and the tick is large.
 * Measuring only L2 would have answered the easy half.
 *
 * The arc centre is FITTED from the geometry (Kåsa, over every inner endpoint, which all lie on one circle).
 * The body's bounding box is NOT the centre — it includes the name above and the measure below, and using it
 * put a spurious 1.05 px lateral on NONE, whose ticks are radial by construction.
 *
 * This build still keys the splay on `s.mark === "counterTick"`; A-G43's re-keying onto the STATE is held with
 * the test-database gate. The re-keying changes WHICH arcs splay, not by how much.
 */
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, openField, probeGeometry, servedProvenance, PROVENANCE, stats } from "./gruen-instrument.mjs";

const here = dirname(fileURLToPath(import.meta.url));
/* §82: the worktree whose .next/BUILD_ID and git state the provenance block records. Defaults to THIS
   worktree, so every existing reading is unaffected; GRUEN_WT points it at a second build served on its own
   port, which is how the A-G49 hooks are verified without rebuilding — or overwriting — the build the eight
   sealed readings were taken against. */
const WT = process.env.GRUEN_WT ?? resolve(here, "../../../../..");
const VW = Number(process.env.VW ?? 1920), VH = Number(process.env.VH ?? 1080);

const browser = await chromium.launch();
const { ctx, page, guard } = await openField(browser, { reduce: true, vw: VW, vh: VH });
const provenance = await servedProvenance(page, WT);
const geo = await probeGeometry(page);

const target = await page.evaluate(() => {
  const bodies = [...document.querySelectorAll("[data-mapping-body]")];
  const named = bodies.find(e => /role_all/.test(e.getAttribute("data-testid") ?? ""));
  const pick = named ?? bodies.sort((a, b) => Number(b.getAttribute("data-requirements")) - Number(a.getAttribute("data-requirements")))[0];
  const id = pick?.getAttribute("data-testid") ?? null;
  const key = id === null ? null : id.replace(/^mapping-body-/, "");
  return { body: id, key, pool: key === null ? null : `mapping-pool-${key.split(":")[0]}`, requirements: Number(pick?.getAttribute("data-requirements")) };
});
if (target.body === null) { console.log(JSON.stringify({ ABORT: "NO_BODY" })); process.exit(2); }

const measureArcs = scopeSel => page.evaluate(sel => {
  const scope = sel === null ? document : document.querySelector(sel);
  if (scope === null) return { error: `SCOPE_ABSENT:${sel}` };
  const toScreen = (el, x, y) => { const m = el.getScreenCTM(); return { x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f }; };
  const arcs = [...scope.querySelectorAll("[data-mapping-arc]")];
  const inner = [];
  for (const arc of arcs) for (const e of arc.querySelectorAll("[data-arc-end]")) inner.push(toScreen(e, Number(e.getAttribute("x1")), Number(e.getAttribute("y1"))));
  if (inner.length < 3) return { error: `TOO_FEW_ARC_ENDS:${inner.length}` };
  let Sx = 0, Sy = 0, Sxx = 0, Syy = 0, Sxy = 0, Sxz = 0, Syz = 0, Sz = 0;
  for (const p of inner) { const z = p.x * p.x + p.y * p.y; Sx += p.x; Sy += p.y; Sxx += p.x * p.x; Syy += p.y * p.y; Sxy += p.x * p.y; Sxz += p.x * z; Syz += p.y * z; Sz += z; }
  const n = inner.length;
  const a11 = 2 * (Sxx - Sx * Sx / n), a12 = 2 * (Sxy - Sx * Sy / n), a22 = 2 * (Syy - Sy * Sy / n);
  const b1 = Sxz - Sx * Sz / n, b2 = Syz - Sy * Sz / n;
  const det = a11 * a22 - a12 * a12;
  if (Math.abs(det) < 1e-9) return { error: "CENTRE_FIT_SINGULAR" };
  const centre = { x: (b1 * a22 - b2 * a12) / det, y: (b2 * a11 - b1 * a12) / det };
  const rs = inner.map(p => Math.hypot(p.x - centre.x, p.y - centre.y));
  const rMean = rs.reduce((x, y) => x + y, 0) / n;
  const out = [];
  for (const arc of arcs) {
    const ends = [...arc.querySelectorAll("[data-arc-end]")];
    if (ends.length === 0) continue;
    out.push({
      state: arc.getAttribute("data-state"), mark: arc.getAttribute("data-mark"), line: arc.getAttribute("data-line"),
      ends: ends.map((e, i) => {
        const a = toScreen(e, Number(e.getAttribute("x1")), Number(e.getAttribute("y1")));
        const b = toScreen(e, Number(e.getAttribute("x2")), Number(e.getAttribute("y2")));
        const tickPx = Math.hypot(b.x - a.x, b.y - a.y);
        const rx = a.x - centre.x, ry = a.y - centre.y, rlen = Math.hypot(rx, ry) || 1;
        const ux = rx / rlen, uy = ry / rlen, vx = b.x - a.x, vy = b.y - a.y;
        return { end: i, tickPx: +tickPx.toFixed(3), lateralPx: +Math.abs(vx * -uy + vy * ux).toFixed(3),
                 lateralOverTick: +(Math.abs(vx * -uy + vy * ux) / (tickPx || 1)).toFixed(4), innerRadiusPx: +rlen.toFixed(2) };
      })
    });
  }
  return { centre, centreFit: { points: n, innerRadiusPxMean: +rMean.toFixed(3), residualRmsPx: +Math.sqrt(rs.reduce((x, y) => x + (y - rMean) ** 2, 0) / n).toFixed(4) }, arcs: out };
}, scopeSel);

const levels = {};
levels.L0_collar = await measureArcs(`[data-testid="mapping-collar-${target.key}"]`);
await page.click(`[data-testid="${target.pool}"]`); await page.waitForTimeout(700);
levels.L1_collar = await measureArcs(`[data-testid="mapping-collar-${target.key}"]`);
await page.click(`[data-testid="${target.body}"]`); await page.waitForTimeout(900);
levels.L2_ring = await measureArcs('[data-testid="mapping-ring"]');
await ctx.close(); await browser.close();

const summarise = m => {
  if (m.error || !m.arcs) return { error: m.error ?? "NO_ARCS" };
  const byState = {};
  for (const a of m.arcs) {
    byState[a.state] ??= { state: a.state, mark: a.mark, line: a.line, lateralPx: [], tickPx: [], ratio: [] };
    for (const e of a.ends) { byState[a.state].lateralPx.push(e.lateralPx); byState[a.state].tickPx.push(e.tickPx); byState[a.state].ratio.push(e.lateralOverTick); }
  }
  const rows = Object.values(byState).map(x => ({
    state: x.state, mark: x.mark, line: x.line, ends: x.lateralPx.length,
    lateralPx: stats(x.lateralPx), tickPx: stats(x.tickPx),
    meanLateralOverTick: +(x.ratio.reduce((p, q) => p + q, 0) / x.ratio.length).toFixed(4)
  }));
  return {
    centreFit: m.centreFit, states: rows,
    splaying: rows.filter(r => (r.lateralPx.mean ?? 0) > 0.05).map(r => ({ state: r.state, mark: r.mark, lateralPxMean: r.lateralPx.mean, lateralPxMin: r.lateralPx.min, tickPxMean: r.tickPx.mean, ratio: r.meanLateralOverTick })),
    radial: rows.filter(r => (r.lateralPx.mean ?? 0) <= 0.05).map(r => ({ state: r.state, mark: r.mark, line: r.line, lateralPxMax: r.lateralPx.max }))
  };
};
const perLevel = Object.fromEntries(Object.entries(levels).map(([k, v]) => [k, summarise(v)]));
const out = {
  reading: "GRÜN development reading · PG-20's splay magnitude in rendered screen px, at every level it is drawn",
  verdict: PROVENANCE.verdict, provenance, instrument: PROVENANCE, guard,
  viewport: `${VW}x${VH}`, openedBody: target, unitsToPxAtL0: +geo.unitsToPx.toFixed(5),
  definitions: {
    lateralPx: "the perpendicular (non-radial) component of each arc-end tick, in SCREEN pixels, via the element's own getScreenCTM()",
    centreFit: "arc centre fitted algebraically (Kåsa) from every inner endpoint; the body's bounding box is NOT the centre (it holds the name above and measure below) and using it put a spurious 1.05 px lateral on NONE",
    lateralOverTick: "lateral ÷ tick, against MARK_ICON.differentSplay = 0.6 as the intended factor",
    bothLevels: "L0/L1 draw these arcs as COLLAR ticks where tick = max(2.4 k, 0.18 r) collapses onto the 2.4 k pixel floor; L2 draws the full ring where the tick is large",
    keyedOnMarkInThisBuild: "this build keys the splay on s.mark === 'counterTick'; A-G43's re-keying is held with the test-database gate and changes WHICH arcs splay, not by how much",
    perceptualQuestion: "whether a given lateral displacement is PERCEIVABLE is not answered here — this is a geometry reading and the threshold is PINK's to set"
  },
  perLevel
};
writeFileSync(resolve(here, `../outputs/pg20-splay-${VW}x${VH}.json`), JSON.stringify(out, null, 1));
console.log(JSON.stringify({ viewport: `${VW}x${VH}`, perLevel: Object.fromEntries(Object.entries(perLevel).map(([k, v]) => [k, v.error ? { error: v.error } : { splay: v.splaying, radial: v.radial }])) }, null, 1));
