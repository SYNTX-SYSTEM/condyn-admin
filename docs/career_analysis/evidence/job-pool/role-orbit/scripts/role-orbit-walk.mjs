// ROLE ORBIT REFINEMENT (owner "SFE — GRÜN | ROLE ORBIT REFINEMENT", 2026-10-18): browser walk against GRÜN's isolated three-mode lab
// (../../three-modes/scripts/modes-lab.ts: disposable DB, the real server and worker, loopback Gemini stand-in, network sentinel).
// The organization cosmos draws its role orbit closer to the centre as far as the geometry allows; the cards keep their size and
// legibility, nothing overlaps, the navigation is unchanged. With TAG=before (the base commit) it only measures and shoots.
// Run from the repository root. Playwright: CONDYN_PLAYWRIGHT_MODULE, else resolved from the repository.
// argv: <out dir> <lab state.json> [width height]; env TAG (before | after, default after)
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve as resolvePath } from "node:path";
import { pathToFileURL } from "node:url";
import { scalePool } from "./scale-pool.mjs";
const playwright = await import(pathToFileURL(process.env.CONDYN_PLAYWRIGHT_MODULE || createRequire(resolvePath(process.cwd(), "package.json")).resolve("playwright")).href);
const { chromium } = playwright.chromium ? playwright : playwright.default;
const [OUT, STATE, W = "1600", H = "1000"] = process.argv.slice(2);
const TAG = process.env.TAG || "after";
const st = JSON.parse(readFileSync(STATE, "utf8"));
const BASE = st.base;
// The scale pool (organizations with 1, 2, 3, 5, 8, 14 roles) is uploaded once per lab through the real route.
const poolFile = `${STATE}.${st.database}.scale-pool`;
let SP = existsSync(poolFile) ? readFileSync(poolFile, "utf8").trim() : null;
if (!SP) {
  const response = await (await fetch(`${BASE}/api/career/job-pools`, { method: "POST", headers: { "content-type": "application/json", "x-condyn-principal-actor-id": "GRUEN_ORBIT_LAB" }, body: JSON.stringify(scalePool(st.database.slice(-8))) })).json();
  SP = response.jobPoolUploadId ?? response.upload?.jobPoolUploadId; writeFileSync(poolFile, SP);
}
const CASES = [[st.engineeringUploadId, "org_kestrel", 3], [st.validationUploadId, "org_pink_alpha", 1], ...[1, 2, 3, 5, 8, 14].map(n => [SP, `org_orbit_${n}`, n]), [SP, "org_orbit_long_8", 8], [SP, "org_orbit_short_12", 12]];
const results = []; const ok = (name, cond, extra = "") => results.push(`${cond ? "PASS" : "FAIL"} ${name}${extra ? " — " + extra : ""}`);
const browser = await chromium.launch();
const errors = [];
const open = async (url, motion = "no-preference") => {
  const ctx = await browser.newContext({ viewport: { width: Number(W), height: Number(H) }, reducedMotion: motion });
  await ctx.addInitScript(() => { try { localStorage.setItem("condyn_onboarding_seen", "1"); } catch {} });
  const page = await ctx.newPage();
  page.on("pageerror", e => errors.push(String(e)));
  await page.goto(`${BASE}${url}`, { waitUntil: "networkidle" });
  await page.getByTestId("syntx-field").waitFor({ timeout: 60000 });
  return page;
};
const field = (page, name) => page.getByTestId("syntx-field").getAttribute(name);
const enterOrganization = async (page, pool, org) => {
  await page.goto(`${BASE}/career/demo?focus=FIELD&jobPoolUploadId=${pool}`, { waitUntil: "networkidle" });
  await page.getByTestId(`syntx-organization-${org}`).waitFor({ timeout: 60000 });
  await page.getByTestId(`syntx-organization-${org}`).evaluate(el => el.click());
  await page.locator('[data-testid="syntx-field"][data-observation-kind="ORGANIZATION"]').waitFor(); await page.waitForTimeout(1500);
};
const clickSign = async (page, id) => { const box = await page.getByTestId(id).boundingBox(); await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2); };
/** The organization cosmos as drawn: orbit, centre, every card's box, and over a whole turn (every 5°, the card's own orbit and size)
 * the air to the centre disc, between cards of one orbit, and the phases in which a card crosses the orientation surface. */
const measure = page => page.evaluate(() => {
  const rect = el => { const b = el.getBoundingClientRect(); return { l: b.left, t: b.top, r: b.right, b: b.bottom, w: b.width, h: b.height }; };
  const shell = document.querySelector('[data-testid="syntx-cosmos-organization"]');
  const svg = rect(shell.querySelector("svg"));
  const centre = rect(document.querySelector('[data-testid="syntx-cosmos-centre"]'));
  const cx = (centre.l + centre.r) / 2, cy = (centre.t + centre.b) / 2, cr = centre.w / 2;
  const orbits = [...shell.querySelectorAll("svg ellipse")].map(e => ({ rx: Number(e.getAttribute("rx")), ry: Number(e.getAttribute("ry")), cx: svg.l + Number(e.getAttribute("cx")), cy: svg.t + Number(e.getAttribute("cy")) }));
  const cards = [...shell.querySelectorAll("[data-sx-role-card]")].map(el => ({ id: el.getAttribute("data-testid") ?? el.getAttribute("data-sx-anchor"), ...rect(el) }));
  const level = rect(shell.parentElement);
  const surfaceEl = document.querySelector('[data-sx-surface="header"]'); const surface = surfaceEl ? rect(surfaceEl) : null;
  const dist = c => Math.hypot(Math.max(0, c.l - cx, cx - c.r), Math.max(0, c.t - cy, cy - c.b)) - cr;
  let pair = Infinity; for (let i = 0; i < cards.length; i += 1) for (let j = i + 1; j < cards.length; j += 1) { const a = cards[i], b = cards[j]; pair = Math.min(pair, Math.max(Math.max(a.l, b.l) - Math.min(a.r, b.r), Math.max(a.t, b.t) - Math.min(a.b, b.b))); }
  // Over a whole turn: each card on the orbit nearest to its centre point, with its own size.
  const turn = Array.from({ length: 72 }, (_, i) => (i * Math.PI) / 36);
  let turnCentre = Infinity, turnSurface = 0, turnTop = Infinity, turnBottom = Infinity, turnOrbitAir = Infinity;
  const placed = cards.map(card => {
    const px = (card.l + card.r) / 2 - cx, py = (card.t + card.b) / 2 - cy;
    const orbit = orbits.reduce((best, o) => Math.abs(Math.hypot(px / o.rx, py / o.ry) - 1) < Math.abs(Math.hypot(px / best.rx, py / best.ry) - 1) ? o : best, orbits[0]);
    return { card, orbit, angle: Math.atan2(py / orbit.ry, px / orbit.rx) };
  });
  // Neighbours on one orbit turn together: their rendered boxes keep 12 px horizontal or 20 px vertical air every half degree.
  for (const orbit of orbits) {
    const on = placed.filter(p => p.orbit === orbit).sort((a, b) => a.angle - b.angle);
    if (on.length < 2) continue;
    for (let i = 0; i < on.length; i += 1) for (const step of on.length > 3 ? [1, 2] : [1]) {
      const a = on[i], b = on[(i + step) % on.length];
      for (let k = 0; k < 720; k += 1) {
        const phase = (k * Math.PI) / 360;
        const ax = Math.cos(a.angle + phase) * orbit.rx, ay = Math.sin(a.angle + phase) * orbit.ry, bx = Math.cos(b.angle + phase) * orbit.rx, by = Math.sin(b.angle + phase) * orbit.ry;
        turnOrbitAir = Math.min(turnOrbitAir, Math.max(Math.abs(ax - bx) - (a.card.w + b.card.w) / 2 - 12, Math.abs(ay - by) - (a.card.h + b.card.h) / 2 - 20));
      }
    }
  }
  for (const { card, orbit } of placed) {
    for (const a of turn) {
      const x = orbit.cx + Math.cos(a) * orbit.rx, y = orbit.cy + Math.sin(a) * orbit.ry;
      const box = { l: x - card.w / 2, r: x + card.w / 2, t: y - card.h / 2, b: y + card.h / 2 };
      turnCentre = Math.min(turnCentre, dist(box));
      turnTop = Math.min(turnTop, box.t - level.t); turnBottom = Math.min(turnBottom, level.b - box.b);
      if (surface && box.l < surface.r && box.r > surface.l && box.t < surface.b && box.b > surface.t) turnSurface += 1;
    }
  }
  return {
    compactness: [shell.getAttribute("data-orbit-compactness-x"), shell.getAttribute("data-orbit-compactness-y")],
    layout: shell.getAttribute("data-layout"), orbits: orbits.map(o => [Math.round(o.rx * 10) / 10, Math.round(o.ry * 10) / 10]), cards: cards.length,
    cardSizes: cards.map(c => `${Math.round(c.w)}×${Math.round(c.h)}`), centreGap: Math.round(Math.min(...cards.map(dist))), pairGap: cards.length > 1 ? Math.round(pair) : null,
    meanDistance: Math.round(cards.reduce((sum, c) => sum + Math.hypot((c.l + c.r) / 2 - cx, (c.t + c.b) / 2 - cy), 0) / cards.length),
    turnCentreGap: Math.round(turnCentre), turnOrbitAir: Number.isFinite(turnOrbitAir) ? Math.round(turnOrbitAir * 10) / 10 : null, turnTopSpace: Math.round(turnTop), turnBottomSpace: Math.round(turnBottom), turnSurfacePhases: turnSurface
  };
});

const beforeFile = resolvePath(OUT, `before-measure-${W}.json`);
const BEFORE = existsSync(beforeFile) ? JSON.parse(readFileSync(beforeFile, "utf8")) : null;
const sameSizes = (a, b) => a.length === b.length && a.every((size, i) => size.split("×").every((v, k) => Math.abs(Number(v) - Number(b[i].split("×")[k])) <= 1));
const rows = [];
let page = await open("/career/demo?focus=FIELD");
for (const [pool, org, count] of CASES) {
  await enterOrganization(page, pool, org);
  const m = await measure(page);
  rows.push({ org, count, ...m });
  if (["org_kestrel", "org_orbit_2", "org_orbit_8"].includes(org)) await page.screenshot({ path: `${OUT}/${TAG}-${org}-${W}.png` });
  if (TAG !== "after") continue;
  const label = `${org} (${count} ${count === 1 ? "role" : "roles"})`;
  ok(`O-1 ${label}: every role card present, one orbit sign per role`, m.cards === count, `${m.cards}`);
  if (m.compactness.every(v => v === "1.00")) {
    // No room to draw in: the packing stays as it was on the base commit (measured there with TAG=before).
    const before = BEFORE?.rows.find(r => r.org === org);
    ok(`O-2 ${label}: no room to draw in — the orbit stays exactly as packed`, before !== undefined && before.orbits.join() === m.orbits.join() && sameSizes(before.cardSizes, m.cardSizes), m.orbits.join(" "));
    continue;
  }
  ok(`O-2 ${label}: no card covers the centre body or another card (at rest)`, m.centreGap >= 16 && (m.pairGap === null || m.pairGap >= 0), `centre ${m.centreGap} px, pair ${m.pairGap}`);
  ok(`O-3 ${label}: over a whole turn every card keeps ≥ 16 px to the centre disc and stays inside the level`, m.turnCentreGap >= 16 && m.turnTopSpace >= 0 && m.turnBottomSpace >= 0, `centre ${m.turnCentreGap}, top ${m.turnTopSpace}, bottom ${m.turnBottomSpace}`);
  ok(`O-3b ${label}: over a whole turn neighbours on the orbit keep their air (rendered boxes, 12 px / 20 px, every half degree)`, m.turnOrbitAir === null || m.turnOrbitAir >= 0, String(m.turnOrbitAir));
  // In motion: three frames a second apart, nothing overlaps in any of them.
  const frames = [];
  for (let i = 0; i < 3; i += 1) { frames.push(await measure(page)); await page.waitForTimeout(1000); }
  ok(`O-4 ${label}: in motion (3 frames) no overlap`, frames.every(f => f.centreGap >= 16 && (f.pairGap === null || f.pairGap >= 0)), frames.map(f => `${f.centreGap}/${f.pairGap}`).join(" "));
}
if (TAG === "after") {
  const few = rows.filter(r => r.count <= 5);
  ok("O-5 organizations with up to five roles: the orbit is drawn 22 % closer on both axes", few.every(r => r.compactness[0] === "0.78" && r.compactness[1] === "0.78"), few.map(r => `${r.count}:${r.compactness.join("/")}`).join(" "));
  ok("O-6 every organization: the orbit is never widened, the compactness is in [0.78, 1]", rows.every(r => r.compactness.every(v => Number(v) >= 0.78 && Number(v) <= 1)), rows.map(r => `${r.count}:${r.compactness.join("/")}`).join(" "));
  const full = rows.filter(r => /^org_orbit_\d+$/.test(r.org) && r.layout === "full" && r.compactness.some(v => v !== "1.00"));
  ok("O-7 card sizes come from the packing, not the compactness (the same box for the same title at every count)", new Set(full.map(r => r.cardSizes[0])).size === 1, full.map(r => r.cardSizes[0]).join(" "));
  if (BEFORE) ok("O-8 every card keeps its size against the base commit (± 1 px of sub-pixel rounding)", rows.every(r => sameSizes(BEFORE.rows.find(b => b.org === r.org)?.cardSizes ?? [], r.cardSizes)));

  // Navigation: pointer, keyboard, Escape and the centre are unchanged.
  await enterOrganization(page, st.engineeringUploadId, "org_kestrel");
  // The card highest on the screen (at 720 px the stage runs below the fold).
  const role = await page.evaluate(() => [...document.querySelectorAll('[data-testid="syntx-cosmos-organization"] [data-sx-role-card][data-testid^="syntx-role-"]')].sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)[0].getAttribute("data-testid"));
  await clickSign(page, role); await page.locator('[data-testid="syntx-field"][data-observation-kind="ROLE"]').waitFor(); await page.waitForTimeout(900);
  ok("N-1 a role card on the drawn-in orbit opens its role by pointer", `syntx-role-${await field(page, "data-observation-id")}` === role, role);
  ok("N-2 at the role, the organization cosmos recedes with the role as its anchor", await page.locator(`[data-testid="syntx-cosmos-organization"] [data-sx-anchor="${role.replace("syntx-role-", "")}"]`).count() === 1);
  await page.keyboard.press("Escape"); await page.waitForTimeout(900);
  ok("N-3 Escape returns to the organization", await field(page, "data-observation-kind") === "ORGANIZATION");
  let reached = null;
  for (let i = 0; i < 40 && reached === null; i += 1) { await page.keyboard.press("Tab"); const id = await page.evaluate(() => document.activeElement?.hasAttribute("data-sx-role-card") ? document.activeElement.getAttribute("data-testid") : null); if (id) reached = id; }
  if (reached) { await page.keyboard.press("Enter"); await page.waitForTimeout(900); }
  ok("N-4 Tab reaches a role card and Enter opens it", reached !== null && `syntx-role-${await field(page, "data-observation-id")}` === reached, String(reached));
  await page.keyboard.press("Escape"); await page.waitForTimeout(900);
  await clickSign(page, "syntx-cosmos-centre"); await page.waitForTimeout(900);
  ok("N-5 the centre returns to the field", await field(page, "data-observation-kind") === "FIELD");

  // Reduced motion: the same drawn-in orbit, still.
  const still = await open(`/career/demo?focus=FIELD&jobPoolUploadId=${st.engineeringUploadId}`, "reduce");
  await enterOrganization(still, st.engineeringUploadId, "org_kestrel");
  const a = await measure(still); await still.waitForTimeout(1500); const b = await measure(still);
  const live = rows.find(r => r.org === "org_kestrel");
  ok("R-1 reduced motion: the same compactness and orbit, the cards hold still", a.compactness.join() === live.compactness.join() && a.orbits.join() === live.orbits.join() && a.meanDistance === b.meanDistance && a.centreGap === b.centreGap, `${a.compactness.join("/")} ${a.orbits.join(" ")}`);
  ok("E-1 no page errors", errors.length === 0, errors.slice(0, 2).join(" | "));
}
writeFileSync(`${OUT}/${TAG}-measure-${W}.json`, `${JSON.stringify({ viewport: `${W}×${H}`, tag: TAG, rows }, null, 1)}\n`);
if (TAG === "after") writeFileSync(`${OUT}/walk-results-${W}.txt`, `${results.join("\n")}\n`);
console.log(results.join("\n")); console.log(`${results.filter(r => r.startsWith("PASS")).length}/${results.length}`);
for (const r of rows) console.log(TAG, r.org, r.compactness.join("/"), r.orbits.join(" "), `mean ${r.meanDistance}`, `turnSurface ${r.turnSurfacePhases}`, `centre ${r.turnCentreGap}`);
await browser.close();
