// ROLE ORBIT CARD REFINEMENT (owner "SFE — GRÜN | ROLE ORBIT CARD REFINEMENT", 2026-10-19): browser walk against GRÜN's isolated
// three-mode lab (../../three-modes/scripts/modes-lab.ts: disposable DB, the real server and worker, loopback Gemini stand-in, network
// sentinel). The role cards of the organization cosmos are redrawn — centred, the pool's standing and domain, requirements and the
// matching read each on their own line — inside exactly the box the accepted orbit (e6493a7) keeps its air for (estimate + 12 px), so
// the orbit, its air, motion and navigation stay as accepted. The orbit checks (O-*, N-*, R-1, E-1) are the role orbit walk's
// (../../role-orbit/scripts/role-orbit-walk.mjs); O-8 now holds the orbit to the accepted one, C-* read the cards.
// Run from the repository root. Playwright: CONDYN_PLAYWRIGHT_MODULE, else resolved from the repository.
// argv: <out dir> <lab state.json> [width height]
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve as resolvePath } from "node:path";
import { pathToFileURL } from "node:url";
import { scalePool } from "../../role-orbit/scripts/scale-pool.mjs";
const playwright = await import(pathToFileURL(process.env.CONDYN_PLAYWRIGHT_MODULE || createRequire(resolvePath(process.cwd(), "package.json")).resolve("playwright")).href);
const { chromium } = playwright.chromium ? playwright : playwright.default;
const [OUT, STATE, W = "1600", H = "1000"] = process.argv.slice(2);
const TAG = "after";
const st = JSON.parse(readFileSync(STATE, "utf8"));
const BASE = st.base;
// The scale pool (organizations with 1, 2, 3, 5, 8, 14 roles) is uploaded once per lab through the real route.
const poolFile = `${STATE}.${st.database}.scale-pool`;
let SP = existsSync(poolFile) ? readFileSync(poolFile, "utf8").trim() : null;
if (!SP) {
  const response = await (await fetch(`${BASE}/api/career/job-pools`, { method: "POST", headers: { "content-type": "application/json", "x-condyn-principal-actor-id": "GRUEN_ORBIT_LAB" }, body: JSON.stringify(scalePool(st.database.slice(-8))) })).json();
  SP = response.jobPoolUploadId ?? response.upload?.jobPoolUploadId; writeFileSync(poolFile, SP);
}
// What the pools state of each role (seniority, domain focus): the DLL engineering pool and the scale pool, as uploaded by the lab.
const STATED = new Map([...JSON.parse(readFileSync(resolvePath(process.cwd(), "docs/examples/job-pool-tests/DLL_JOBPOOL_ENGINEERING.json"), "utf8")).roles, ...scalePool(st.database.slice(-8)).roles].map(role => [role.id, role]));
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
  // The cards of one orbit turn together: every pair of rendered boxes keeps 12 px horizontal or 20 px vertical air every half degree.
  for (const orbit of orbits) {
    const on = placed.filter(p => p.orbit === orbit).sort((a, b) => a.angle - b.angle);
    if (on.length < 2) continue;
    for (let i = 0; i < on.length; i += 1) for (let j = i + 1; j < on.length; j += 1) {
      const a = on[i], b = on[j];
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

/** Every role card as drawn: its box, the room inside its padding against the height of its content, the title lines against the lines
 * the layout counted, clipping, centring, the texts it states and their contrast on the card's glass. */
const readCards = page => page.evaluate(() => {
  const rgba = value => { const m = value.match(/rgba?\(([^)]+)\)/); const [r, g, b, a = 1] = m[1].split(",").map(Number); return { r, g, b, a }; };
  const lum = ({ r, g, b }) => [r, g, b].map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }).reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
  const GLASS = { r: 6, g: 17, b: 29 };
  const contrast = el => { const c = rgba(getComputedStyle(el).color); const mix = { r: c.r * c.a + GLASS.r * (1 - c.a), g: c.g * c.a + GLASS.g * (1 - c.a), b: c.b * c.a + GLASS.b * (1 - c.a) }; const [x, y] = [lum(mix), lum(GLASS)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  return [...document.querySelectorAll('[data-testid="syntx-cosmos-organization"] [data-sx-role-card][data-testid^="syntx-role-"]')].map(card => {
    const box = card.getBoundingClientRect(), cs = getComputedStyle(card);
    const flow = [...card.children].filter(e => getComputedStyle(e).position !== "absolute");
    const top = Math.min(...flow.map(e => e.getBoundingClientRect().top)) - parseFloat(getComputedStyle(flow[0]).marginTop), bottom = Math.max(...flow.map(e => e.getBoundingClientRect().bottom));
    const part = name => card.querySelector(`[data-sx-role-${name}]`);
    const title = part("title"), lineHeight = parseFloat(getComputedStyle(title).lineHeight);
    const cut = [part("domain"), part("requirements"), part("matching")?.lastElementChild, part("standing")?.children[2]].filter(Boolean).some(e => e.scrollWidth > e.clientWidth + 1);
    const centre = box.left + box.width / 2;
    return {
      id: card.getAttribute("data-testid").replace("syntx-role-", ""), w: box.width, h: box.height, lines: Number(card.getAttribute("data-card-title-lines")), form: card.getAttribute("data-card-box"),
      titleLines: Math.round(title.clientHeight / lineHeight), clipped: title.scrollHeight > title.clientHeight + 1 || cut,
      room: box.height - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - parseFloat(cs.borderTopWidth) - parseFloat(cs.borderBottomWidth), content: bottom - top,
      offCentre: Math.max(...flow.map(e => { const r = e.getBoundingClientRect(); return Math.abs(r.left + r.width / 2 - centre); })), align: cs.textAlign,
      standing: part("standing").textContent.trim(), domain: part("domain")?.textContent ?? null, requirements: part("requirements").textContent, matching: part("matching").textContent,
      requirementCount: Number(card.getAttribute("data-requirement-count")), matchingRead: card.getAttribute("data-matching-read") === "true",
      contrast: { title: contrast(title), domain: part("domain") ? contrast(part("domain")) : null, standing: contrast(part("standing").children[2]), requirements: contrast(part("requirements")), matching: contrast(part("matching")) }
    };
  });
});
const ACCEPTED = JSON.parse(readFileSync(resolvePath(OUT, `../role-orbit/after-measure-${W}.json`), "utf8"));
const allCards = [];
const rows = [];
let page = await open("/career/demo?focus=FIELD");
for (const [pool, org, count] of CASES) {
  await enterOrganization(page, pool, org);
  const m = await measure(page);
  rows.push({ org, count, ...m });
  if (["org_kestrel", "org_orbit_8", "org_orbit_long_8", "org_orbit_short_12"].includes(org)) await page.screenshot({ path: `${OUT}/${TAG}-${org}-${W}.png` });
  const label = `${org} (${count} ${count === 1 ? "role" : "roles"})`;
  ok(`O-1 ${label}: every role card present, one orbit sign per role`, m.cards === count, `${m.cards}`);
  // The accepted orbit (e6493a7) is kept: the same compactness and radii; the cards keep their widths.
  const accepted = ACCEPTED.rows.find(r => r.org === org);
  ok(`O-8 ${label}: the orbit is the accepted one (e6493a7) — compactness, radii and card widths`, accepted !== undefined && accepted.compactness.join() === m.compactness.join() && accepted.orbits.join() === m.orbits.join() && accepted.cardSizes.map(s => s.split("×")[0]).join() === m.cardSizes.map(s => s.split("×")[0]).join(), `${m.compactness.join("/")} ${m.orbits.join(" ")}`);
  const cards = await readCards(page); allCards.push(...cards.map(c => ({ org, ...c })));
  // Drawn in: the box every air is measured on (estimate + 12 px); left as packed: the packing's own estimate.
  const drawnIn = m.compactness.some(v => v !== "1.00");
  ok(`C-1 ${label}: every card is drawn at exactly the box its orbit keeps its air for (${drawnIn ? "estimate + 12 px" : "the packing's estimate"}), its title in the lines the layout counted`, cards.every(c => c.form === (drawnIn ? "orbit" : "packed") && Math.abs(c.h - (Math.min(126, Math.max(72, 52 + 18 * c.lines)) + (drawnIn ? 12 : 0))) < 0.5 && c.titleLines <= c.lines), cards.map(c => `${Math.round(c.w)}×${c.h}/${c.titleLines}`).join(" "));
  ok(`C-2 ${label}: everything fits — no title, standing, domain or line clipped, the content within the card's room`, cards.every(c => !c.clipped && c.content <= c.room + 0.5), `least room ${Math.min(...cards.map(c => c.room - c.content)).toFixed(1)} px`);
  ok(`C-3 ${label}: centred — every line on the card's axis (± 1 px)`, cards.every(c => c.align === "center" && c.offCentre <= 1), `${Math.max(...cards.map(c => c.offCentre)).toFixed(2)} px`);
  const stated = cards.filter(c => STATED.has(c.id));
  ok(`C-4 ${label}: the card states what the pool states — standing (seniority parts), domain focus, requirement count and the matching read`, stated.every(c => { const role = STATED.get(c.id); const parts = (role.seniority ?? "").split("/").map(p => p.trim()).filter(Boolean); return c.standing === (parts.length ? parts.map(p => p.toUpperCase()).join(" · ") : "ROLE") && c.domain === (c.form === "orbit" ? role.domain_focus || null : null); }) && cards.every(c => c.requirements === `${c.requirementCount} ${c.requirementCount === 1 ? "REQUIREMENT" : "REQUIREMENTS"}` && c.matching === (c.matchingRead ? "MATCHING READ" : "NO MATCHING READ")), `${stated.length} of ${cards.length} against the pool file`);
  // No air worse than accepted: drawn in, the rule itself (21 px beyond the 87 px disc, cards at estimate + 12); left as packed, never
  // closer than the accepted rendering (the card keeps to the estimate the packing placed it with).
  ok(`C-6 ${label}: over a whole turn no air below the accepted orbit's rule or rendering`, drawnIn ? m.turnCentreGap >= 20 && (m.turnOrbitAir === null || m.turnOrbitAir >= -0.5) : accepted !== undefined && m.turnCentreGap >= accepted.turnCentreGap && (m.turnOrbitAir ?? Infinity) >= (accepted.turnOrbitAir ?? Infinity) - 0.5, `centre ${m.turnCentreGap} (accepted ${accepted?.turnCentreGap}), orbit ${m.turnOrbitAir} (${accepted?.turnOrbitAir})`);
  if (m.compactness.every(v => v === "1.00")) {
    // No room to draw in: the orbit stays as packed, as on the accepted commit.
    ok(`O-2 ${label}: no room to draw in — the orbit stays exactly as packed`, accepted !== undefined && accepted.orbits.join() === m.orbits.join(), m.orbits.join(" "));
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
{
  const few = rows.filter(r => r.count <= 5);
  ok("O-5 organizations with up to five roles: the long axis is drawn in further than the first pass's 0.78", few.every(r => Number(r.compactness[0]) < 0.78 && Number(r.compactness[1]) <= 1), few.map(r => `${r.count}:${r.compactness.join("/")}`).join(" "));
  ok("O-6 every organization: the orbit is never widened (compactness in (0, 1]) and lies at least as wide as tall", rows.every(r => r.compactness.every(v => Number(v) > 0 && Number(v) <= 1) && r.orbits.every(([rx, ry]) => rx >= ry - 0.1)), rows.map(r => `${r.count}:${r.compactness.join("/")} ${r.orbits.map(o => o.join("×")).join(",")}`).join(" "));
  // Drawn in to its limit: over the turn the least rendered air to the centre (beyond the 108 px clearance, i.e. 21 px past the
  // 87 px disc) or between two cards is within one factor step and the height allowance (a drawn card is up to 12 px lower than the
  // card the layout reads).
  const drawnIn = rows.filter(r => r.compactness.some(v => v !== "1.00"));
  ok("O-9 every drawn-in orbit is at its limit: the least air over a turn is under 20 px", drawnIn.every(r => Math.min(r.turnCentreGap - 21, r.turnOrbitAir ?? Infinity) < 20), drawnIn.map(r => `${r.org}:${r.turnCentreGap - 21}/${r.turnOrbitAir ?? "–"}`).join(" "));
  const full = rows.filter(r => /^org_orbit_\d+$/.test(r.org) && r.layout === "full" && r.compactness.some(v => v !== "1.00"));
  ok("O-7 card sizes come from the packing, not the compactness (the same box for the same title at every count)", new Set(full.map(r => r.cardSizes[0])).size === 1, full.map(r => r.cardSizes[0]).join(" "));
  // Legibility: contrast of every line on the card's glass (WCAG ratio; the title and the stated facts well above 4.5).
  const least = key => Math.min(...allCards.map(c => c.contrast[key]).filter(v => v !== null));
  ok("C-5 legible: title ≥ 7:1, standing, domain, requirements and matching ≥ 4.5:1 on the card's glass", least("title") >= 7 && ["standing", "domain", "requirements", "matching"].every(key => least(key) >= 4.5), ["title", "standing", "domain", "requirements", "matching"].map(key => `${key} ${least(key).toFixed(1)}`).join(", "));

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
writeFileSync(`${OUT}/${TAG}-measure-${W}.json`, `${JSON.stringify({ viewport: `${W}×${H}`, tag: TAG, rows, cards: allCards }, null, 1)}\n`);
writeFileSync(`${OUT}/walk-results-${W}.txt`, `${results.join("\n")}\n`);
console.log(results.join("\n")); console.log(`${results.filter(r => r.startsWith("PASS")).length}/${results.length}`);
for (const r of rows) console.log(TAG, r.org, r.compactness.join("/"), r.orbits.join(" "), `mean ${r.meanDistance}`, `turnSurface ${r.turnSurfacePhases}`, `centre ${r.turnCentreGap}`);
await browser.close();
