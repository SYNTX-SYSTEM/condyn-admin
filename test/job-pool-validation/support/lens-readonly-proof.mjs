// PINK read-only lens-grammar proof against the owner environment (LENS_V1, JOB_FIELD_FRONTEND.md §12).
// GET-only HTTP, existing analyses + existing upload only; any non-GET request issued by the page is a failure.
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
const { chromium } = await import(process.env.CONDYN_PLAYWRIGHT_MODULE ?? "/home/codi/Entwicklung/nquiry/node_modules/playwright/index.mjs");

const BASE = process.env.BASE ?? "http://127.0.0.1:3017";
const UPLOAD = process.env.UPLOAD ?? "JPOOL_30F7145E21F34BEF0FCE510DFC75837B";
const SUFFIXES = (process.env.ANALYSES ?? "612,831").split(",");
const OUT = resolve(process.argv[2] ?? "./evidence");
mkdirSync(OUT, { recursive: true });

const results = []; let failures = 0;
const check = (name, ok, detail = "") => { results.push({ name, ok: !!ok, detail: String(detail) }); if (!ok) { failures++; console.log(`FAIL ${name} ${detail}`); } else console.log(`ok   ${name}${detail ? " · " + detail : ""}`); };
const get = async (path) => { const r = await fetch(BASE + path); const body = await r.json().catch(() => null); return { status: r.status, body }; };

// 1. Resolve the existing analyses and the upload, GET only.
const list = await get("/api/career/analyses");
check("GET analyses 200", list.status === 200, `status ${list.status}`);
const all = (list.body?.analyses ?? []);
const idOf = (a) => a.analysisId ?? a.id ?? a.analysis_id;
const analyses = SUFFIXES.map(s => all.map(idOf).find(id => typeof id === "string" && id.endsWith(s)));
check("analyses resolved", analyses.every(Boolean), analyses.join(","));
const view = await get(`/api/career/job-pools/${UPLOAD}`);
check("GET upload view 200", view.status === 200, `status ${view.status} state ${view.body?.view?.status ?? view.body?.status ?? "?"}`);
const canonical = view.body?.view?.canonicalMapping ?? view.body?.canonicalMapping ?? null;
check("canonical mapping present", canonical?.roles?.length > 0, `roles ${canonical?.roles?.length}`);
const reqCount = (roleId) => canonical?.roles?.find(r => r.poolRoleId === roleId)?.requirements?.length ?? -1;

const browser = await chromium.launch();
const nonGet = [];
const newPage = async (reduced = false) => {
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, reducedMotion: reduced ? "reduce" : "no-preference" });
  const page = await ctx.newPage();
  page.on("request", req => { if (req.method() !== "GET" && req.url().startsWith(BASE)) nonGet.push(`${req.method()} ${req.url()}`); });
  page.on("pageerror", e => check("no page error", false, e.message));
  return page;
};
const dismissOnboarding = async (page) => {
  const overlay = page.getByTestId("guided-onboarding-overlay");
  try { await overlay.waitFor({ timeout: 60_000 }); } catch { return; }
  await page.getByTestId("onboarding-close-btn").click();
  await overlay.waitFor({ state: "detached", timeout: 30_000 });
};
const shot = (page, name) => page.screenshot({ path: resolve(OUT, name + ".png"), fullPage: false });
const css = (loc, prop) => loc.evaluate((el, p) => getComputedStyle(el)[p], prop);

for (const analysisId of analyses) {
  if (!analysisId) continue;
  const tag = analysisId.slice(-3);
  const m = await get(`/api/career/job-pools/${UPLOAD}/matches?analysisId=${analysisId}`);
  check(`[${tag}] GET matches 200`, m.status === 200, `status ${m.status} roles ${(m.body?.roleMatches ?? m.body?.matches?.roleMatches ?? []).length} sweep ${m.body?.capabilitySweep?.state ?? "?"}`);
  const matches = m.body?.roleMatches ? m.body : (m.body?.matches?.roleMatches ? m.body.matches : null);
  const roles = matches?.roleMatches ?? [];
  const nearest = roles.find(r => r.resonanceScore > 0 && r.matched.length > 0);

  // 2. Job Field, FIELD level.
  const page = await newPage();
  await page.goto(`${BASE}/career/demo?focus=JOB&analysisId=${analysisId}&jobPoolUploadId=${UPLOAD}`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await dismissOnboarding(page);
  const field = page.getByTestId("job-field");
  await page.locator('[data-testid="job-field"][data-field-state="AVAILABLE"]').waitFor({ timeout: 90_000 });
  await page.waitForTimeout(1200);
  check(`[${tag}] JF grammar LENS_V1`, (await field.getAttribute("data-interaction-grammar")) === "LENS_V1");
  check(`[${tag}] JF focus-level FIELD`, (await field.getAttribute("data-focus-level")) === "FIELD");
  check(`[${tag}] JF camera 1`, (await page.getByTestId("job-field-canvas").getAttribute("data-camera-scale")) === "1");
  check(`[${tag}] JF no lens`, (await page.getByTestId("job-field-lens").count()) === 0);
  check(`[${tag}] JF legend folded`, !(await page.getByTestId("job-field-legend-text").isVisible()));
  check(`[${tag}] JF role count = matches`, (await field.getAttribute("data-role-count")) === String(roles.length), `${roles.length}`);
  check(`[${tag}] JF pool id = upload`, (await field.getAttribute("data-pool-id")) === UPLOAD);
  const cap = page.getByTestId("job-field-nearest");
  if (nearest) {
    check(`[${tag}] caption role = nearest`, (await cap.getAttribute("data-role-id")) === nearest.poolRoleId, nearest.poolRoleId);
    check(`[${tag}] caption side`, ["left", "right"].includes(await cap.getAttribute("data-caption-side")), await cap.getAttribute("data-caption-side"));
    check(`[${tag}] caption pointer-transparent`, (await css(cap, "pointerEvents")) === "none");
    const auth = page.getByTestId("job-field-authority-label").first();
    check(`[${tag}] authority label 10.5px`, (await css(auth, "fontSize")) === "10.5px", await css(auth, "fontSize"));
    const t = ((await cap.textContent()) ?? "").toLowerCase();
    check(`[${tag}] caption authority wording`, t.includes("authority none") && t.includes("not a decision"));
    // B-LENS-HIT: the caption box must not cover its own body's centre.
    const body = page.getByTestId(`job-field-role-${nearest.poolRoleId}`);
    const bb = await body.boundingBox(); const cb = await cap.boundingBox();
    const covers = bb && cb && bb.x + bb.width / 2 > cb.x && bb.x + bb.width / 2 < cb.x + cb.width && bb.y + bb.height / 2 > cb.y && bb.y + bb.height / 2 < cb.y + cb.height;
    check(`[${tag}] caption does not cover its body`, !covers);
  } else check(`[${tag}] no nearest`, (await page.getByTestId("job-field-no-nearest").count()) === 1);
  await shot(page, `${tag}-01-jf-field`);

  // 3. ROLE level by clicking a body.
  const target = nearest ?? roles[0];
  if (target) {
    const fieldRadius = Number(await page.getByTestId(`job-field-role-${target.poolRoleId}`).getAttribute("data-moon-radius"));
    await page.getByTestId(`job-field-role-${target.poolRoleId}`).click();
    await page.locator(`[data-testid="job-field-lens"][data-role-id="${target.poolRoleId}"]`).waitFor({ timeout: 30_000 });
    await page.waitForTimeout(1000);
    check(`[${tag}] JF focus-level ROLE`, (await field.getAttribute("data-focus-level")) === "ROLE");
    check(`[${tag}] JF camera 1.5`, (await page.getByTestId("job-field-canvas").getAttribute("data-camera-scale")) === "1.5");
    check(`[${tag}] JF caption gone`, (await cap.count()) === 0);
    check(`[${tag}] lens has role detail`, (await page.locator(`[data-testid="job-field-role-detail"][data-role-id="${target.poolRoleId}"]`).count()) === 1);
    const moons = await page.locator(`[data-testid="job-field-role-${target.poolRoleId}"] [data-jf-moon-label]`).count();
    check(`[${tag}] moon labels = requirements`, moons === reqCount(target.poolRoleId), `${moons} vs ${reqCount(target.poolRoleId)}`);
    const roleRadius = Number(await page.getByTestId(`job-field-role-${target.poolRoleId}`).getAttribute("data-moon-radius"));
    check(`[${tag}] moons spread by +30 (radius+10 → radius+40)`, roleRadius === fieldRadius + 30, `${fieldRadius} → ${roleRadius}`);
    const lensStyle = await css(page.getByTestId("job-field-lens"), "transform");
    check(`[${tag}] lens entrance leaves no transform residue (B-LENS-TRANSFORM)`, lensStyle === "none" || lensStyle.startsWith("matrix"), lensStyle);
    const why = page.getByTestId("job-field-pending-why");
    if (await why.count()) {
      await why.focus(); await page.keyboard.press("Enter");
      await page.locator('[data-testid="job-field-pending-reason"][data-jf-reveal="true"]').waitFor({ timeout: 10_000 });
      const reason = (await page.getByTestId("job-field-pending-reason").textContent()) ?? "";
      check(`[${tag}] pending reason inside lens (keyboard)`, reason.includes("NOT_EVALUATED"));
      const lb = await page.getByTestId("job-field-lens").boundingBox(); const rb = await page.getByTestId("job-field-pending-reason").boundingBox();
      check(`[${tag}] reason within lens box`, lb && rb && rb.x >= lb.x - 1 && rb.x + rb.width <= lb.x + lb.width + 1);
    }
    await shot(page, `${tag}-02-jf-role-lens`);
    // the pending ids equal the canonical mapping of the view
    const unproven = ((await page.getByTestId("job-field-pending-UNPROVEN_CANONICAL").getAttribute("data-ids")) ?? "").split(",").filter(Boolean);
    check(`[${tag}] UNPROVEN ids = canonical TRQREV ids`, JSON.stringify(unproven) === JSON.stringify(target.canonical?.targetRequirementRevisionIds ?? []), `${unproven.length}`);
  }
  // 4. Legend by keyboard, then exit to CAPABILITY.
  await page.getByTestId("job-field-legend-toggle").focus(); await page.keyboard.press("Enter");
  await page.getByTestId("job-field-legend-text").waitFor({ state: "visible", timeout: 10_000 });
  check(`[${tag}] legend reveals by keyboard`, ((await page.getByTestId("job-field-legend").textContent()) ?? "").includes("SCORED SOURCE"));
  await shot(page, `${tag}-03-jf-legend`);
  await page.getByTestId("job-field-exit-btn").click();
  await page.locator('[data-testid="semantic-career-intelligence-field"][data-field-focus="CAPABILITY"]').waitFor({ timeout: 30_000 });
  const u = new URL(page.url());
  check(`[${tag}] exit → focus=CAPABILITY, upload kept`, u.searchParams.get("focus") === "CAPABILITY" && u.searchParams.get("jobPoolUploadId") === UPLOAD && u.searchParams.get("jobRoleId") === null);
  await page.context().close();

  // 5. Pool Field: upload id without focus → POOL; structure ROLE lens; intake affordance.
  const pp = await newPage();
  await pp.goto(`${BASE}/career/demo?analysisId=${analysisId}&jobPoolUploadId=${UPLOAD}`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await dismissOnboarding(pp);
  const panel = pp.getByTestId("job-pool-panel");
  await pp.locator('[data-testid="semantic-career-intelligence-field"][data-field-focus="POOL"]').waitFor({ timeout: 90_000 });
  await pp.locator('[data-testid="job-pool-matches"][data-matches-state="AVAILABLE"]').waitFor({ timeout: 90_000 });
  await pp.waitForTimeout(1200);
  check(`[${tag}] PF grammar LENS_V1`, (await panel.getAttribute("data-interaction-grammar")) === "LENS_V1");
  check(`[${tag}] PF focus-level POOL`, (await panel.getAttribute("data-focus-level")) === "POOL");
  check(`[${tag}] PF intake hidden with core`, (await panel.getAttribute("data-intake-visible")) === "false");
  check(`[${tag}] PF core lens visible`, await pp.getByTestId("job-pool-selected").isVisible());
  check(`[${tag}] PF core lens fixed in overlay root (B-LENS-HIT)`, (await css(pp.getByTestId("job-pool-selected"), "position")) === "fixed" && (await pp.getByTestId("job-pool-selected").evaluate(el => !el.closest("[data-jf-camera], svg"))));
  check(`[${tag}] PF role-list count = matches`, (await pp.getByTestId("job-pool-role-list").getAttribute("data-role-count")) === String(roles.length));
  check(`[${tag}] PF role lenses hidden at POOL level`, (await pp.locator('[data-testid^="job-pool-role-lens-"]:visible').count()) === 0);
  await pp.getByTestId("job-pool-intake-toggle").click();
  check(`[${tag}] PF intake affordance shows`, (await panel.getAttribute("data-intake-visible")) === "true" && await pp.getByTestId("job-pool-upload").isVisible());
  await pp.getByTestId("job-pool-intake-toggle").click();
  check(`[${tag}] PF intake affordance hides`, (await panel.getAttribute("data-intake-visible")) === "false");
  await shot(pp, `${tag}-04-pf-pool`);
  const roleId = (nearest ?? roles[0])?.poolRoleId ?? canonical.roles[0].poolRoleId;
  await pp.getByTestId(`job-pool-structure-role-${roleId}`).click();
  await pp.locator(`[data-testid="job-pool-structure-role-detail"][data-role-id="${roleId}"]`).waitFor({ timeout: 15_000 });
  await pp.waitForTimeout(600);
  check(`[${tag}] PF focus-level ROLE`, (await panel.getAttribute("data-focus-level")) === "ROLE");
  check(`[${tag}] PF role lens visible`, await pp.getByTestId(`job-pool-role-lens-${roleId}`).isVisible());
  await pp.waitForTimeout(600);
  const coreLens = pp.getByTestId("job-pool-selected");
  const corePe = await css(coreLens, "pointerEvents"); const coreOp = await css(coreLens, "opacity");
  check(`[${tag}] PF core lens dimmed + inert`, corePe === "none" && Number(coreOp) < 0.5, `count ${await coreLens.count()} pointer-events ${corePe} opacity ${coreOp}`);
  const reqs = await pp.locator(`[data-testid="job-pool-structure-role-detail"] [data-testid^="job-pool-structure-requirement-"]`).count();
  check(`[${tag}] PF structure requirements = canonical`, reqs === reqCount(roleId), `${reqs} vs ${reqCount(roleId)}`);
  if (roles.some(r => r.poolRoleId === roleId)) check(`[${tag}] PF role reading inside lens`, (await pp.locator(`[data-testid="job-pool-role-lens-${roleId}"] [data-testid="job-pool-role-${roleId}"]`).count()) === 1);
  await shot(pp, `${tag}-05-pf-role-lens`);
  await pp.getByTestId("job-pool-structure-role-back").click();
  await pp.getByTestId(`job-pool-role-lens-${roleId}`).waitFor({ state: "hidden", timeout: 10_000 });
  check(`[${tag}] PF back → POOL`, (await panel.getAttribute("data-focus-level")) === "POOL");
  await pp.context().close();

  // 6. Reduced motion: lens entrances and camera are still, grammar unchanged.
  const rp = await newPage(true);
  await rp.goto(`${BASE}/career/demo?focus=JOB&analysisId=${analysisId}&jobPoolUploadId=${UPLOAD}`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await dismissOnboarding(rp);
  await rp.locator('[data-testid="job-field"][data-field-state="AVAILABLE"]').waitFor({ timeout: 90_000 });
  check(`[${tag}] reduced: motion-mode REDUCED`, (await rp.getByTestId("job-field-canvas").getAttribute("data-motion-mode")) === "REDUCED");
  if (target) {
    await rp.getByTestId(`job-field-role-${target.poolRoleId}`).click();
    await rp.locator(`[data-testid="job-field-lens"][data-role-id="${target.poolRoleId}"]`).waitFor({ timeout: 30_000 });
    check(`[${tag}] reduced: lens animation none`, (await css(rp.getByTestId("job-field-lens"), "animationName")) === "none", await css(rp.getByTestId("job-field-lens"), "animationName"));
    check(`[${tag}] reduced: camera transition none`, /none|0s/.test(await css(rp.locator("[data-jf-camera]"), "transitionDuration")), await css(rp.locator("[data-jf-camera]"), "transitionDuration"));
    check(`[${tag}] reduced: still ROLE level`, (await rp.getByTestId("job-field").getAttribute("data-focus-level")) === "ROLE");
  }
  await shot(rp, `${tag}-06-jf-reduced`);
  await rp.context().close();
}
await browser.close();
check("page issued no non-GET request to the owner server", nonGet.length === 0, nonGet.join(" | "));
writeFileSync(resolve(OUT, "report.json"), JSON.stringify({ base: BASE, upload: UPLOAD, analyses, at: new Date().toISOString(), failures, results, nonGet }, null, 2));
console.log(`\n${results.length - failures}/${results.length} checks green · evidence ${OUT}`);
process.exit(failures ? 1 : 0);
