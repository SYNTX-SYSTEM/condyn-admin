// DEMO UI FIX + SEMIONTIC REFINEMENT (owner, 2026-10-15): browser walk against GRÜN's isolated three-mode lab
// (../../three-modes/scripts/modes-lab.ts: disposable DB, the real server and worker, loopback Gemini stand-in, network sentinel).
// GEMINI OUTPUT closes at any time (HIDE GEMINI OUTPUT and Escape, also without an analysis), the field works afterwards, pool and
// mode are kept; the NO ANALYSIS state line is a legible signal whose motion moves no layout and stops in reduced motion.
// Run from the repository root. Playwright: CONDYN_PLAYWRIGHT_MODULE, else resolved from the repository.
// argv: <out dir> <lab state.json> [width height]
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve as resolvePath } from "node:path";
import { pathToFileURL } from "node:url";
const playwright = await import(pathToFileURL(process.env.CONDYN_PLAYWRIGHT_MODULE || createRequire(resolvePath(process.cwd(), "package.json")).resolve("playwright")).href);
const { chromium } = playwright.chromium ? playwright : playwright.default;
const [OUT, STATE, W = "1600", H = "1000"] = process.argv.slice(2);
const st = JSON.parse(readFileSync(STATE, "utf8"));
const BASE = st.base, VP = st.validationUploadId, EP = st.engineeringUploadId, ANL = st.legacyAnalysisId;
const ORG = "org_pink_alpha", ROLE = "role_pink_alpha_architect";
const results = []; const ok = (name, cond, extra = "") => results.push(`${cond ? "PASS" : "FAIL"} ${name}${extra ? " — " + extra : ""}`);
const browser = await chromium.launch();
const errors = [];
const open = async (url, motion = "no-preference") => {
  const ctx = await browser.newContext({ viewport: { width: Number(W), height: Number(H) }, reducedMotion: motion });
  await ctx.addInitScript(() => { try { localStorage.setItem("condyn_onboarding_seen", "1"); } catch {} });
  const page = await ctx.newPage();
  page.on("pageerror", e => errors.push(String(e)));
  await page.goto(`${BASE}${url}`, { waitUntil: "networkidle" });
  await page.getByTestId("syntx-field").waitFor({ timeout: 30000 });
  return page;
};
const field = (page, name) => page.getByTestId("syntx-field").getAttribute(name);
const active = page => page.evaluate(() => document.activeElement?.getAttribute("data-testid") ?? document.activeElement?.tagName);
/** Every one of five points of the control reaches the control itself (nothing covers it). */
const reachable = (page, id) => page.evaluate(id => { const el = document.querySelector(`[data-testid="${id}"]`); if (!el || el.getClientRects().length === 0) return "ABSENT"; const r = el.getBoundingClientRect(); return [[0.5, 0.5], [0.1, 0.2], [0.9, 0.2], [0.1, 0.8], [0.9, 0.8]].map(([x, y]) => { const h = document.elementFromPoint(r.left + r.width * x, r.top + r.height * y); return h === el || el.contains(h) ? "ok" : h?.closest("[data-testid]")?.getAttribute("data-testid") ?? h?.tagName; }).join(","); }, id);
const allReachable = value => value === "ok,ok,ok,ok,ok";
const gemini = page => field(page, "data-gemini-output-visible");
const settle = page => page.waitForTimeout(600);
const clickSign = async (page, id) => { const box = await page.getByTestId(id).boundingBox(); await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2); };
const shot = async (page, name) => { await page.waitForTimeout(700); await page.screenshot({ path: `${OUT}/${name}-${W}.png` }); };

// U-1 · without a pool and without an analysis: HIDE and Escape close GEMINI OUTPUT.
let page = await open("/career/demo?focus=FIELD");
await page.getByTestId("syntx-gemini-output-toggle").click(); await page.getByTestId("syntx-gemini-output").waitFor();
ok("U-1a GEMINI OUTPUT opens without an analysis (NO_ANALYSIS)", await page.getByTestId("syntx-gemini-output").getAttribute("data-inspection-state") === "NO_ANALYSIS");
await page.getByTestId("syntx-gemini-output-toggle").click(); await settle(page);
ok("U-1b HIDE GEMINI OUTPUT closes it", await gemini(page) === "false" && await page.getByTestId("syntx-gemini-output").count() === 0);
await page.getByTestId("syntx-gemini-output-toggle").click(); await page.keyboard.press("Escape"); await settle(page);
ok("U-1c Escape closes it", await gemini(page) === "false");

// U-2 · GEMINI OUTPUT open, then a pool chosen from the list: the focus stays in the field and Escape still closes; pool and mode kept.
await page.getByTestId("syntx-gemini-output-toggle").click();
await page.getByTestId(`job-pool-select-${VP}`).click(); await page.locator(`[data-testid="syntx-field"][data-selected-pool="${VP}"]`).waitFor(); await settle(page);
ok("U-2a after choosing a pool the focus is on the field root, not the document", await active(page) === "syntx-field", await active(page));
ok("U-2b HIDE GEMINI OUTPUT is reachable at every point", allReachable(await reachable(page, "syntx-gemini-output-toggle")));
await page.keyboard.press("Escape"); await settle(page);
ok("U-2c Escape closes GEMINI OUTPUT after the pool choice", await gemini(page) === "false");
ok("U-2d pool and mode kept (PERSON × JOB, URL unchanged)", await field(page, "data-selected-pool") === VP && await page.getByTestId("investigation-mode-selector").getAttribute("data-investigation-mode") === "PERSON_X_JOB" && new URL(page.url()).searchParams.get("jobPoolUploadId") === VP);

// U-3 · at a role (the orientation surface at its tallest) with GEMINI OUTPUT and the pool list open: nothing covers the actions.
await clickSign(page, `syntx-organization-${ORG}`); await page.locator('[data-testid="syntx-field"][data-observation-kind="ORGANIZATION"]').waitFor(); await page.waitForTimeout(1500);
await clickSign(page, `syntx-role-${ROLE}`); await page.locator('[data-testid="syntx-field"][data-observation-kind="ROLE"]').waitFor(); await page.waitForTimeout(1200);
ok("U-3a field interaction after closing: organization and role observed by pointer", await field(page, "data-observation-id") === ROLE);
await page.getByTestId("syntx-gemini-output-toggle").click(); await page.getByTestId("syntx-pools-toggle").click(); await settle(page);
const geometry = await page.evaluate(() => { const surface = document.querySelector('[data-sx-surface="header"]').getBoundingClientRect(); const list = document.querySelector('[data-testid="job-pool-list"]').getBoundingClientRect(); return { surfaceBottom: Math.round(surface.bottom), listTop: Math.round(list.top) }; });
ok("U-3b the pool list opens below the orientation surface", geometry.listTop >= geometry.surfaceBottom, JSON.stringify(geometry));
ok("U-3c HIDE GEMINI OUTPUT, POOLS and INTAKE reachable with the list open", allReachable(await reachable(page, "syntx-gemini-output-toggle")) && allReachable(await reachable(page, "syntx-pools-toggle")) && allReachable(await reachable(page, "job-pool-intake-toggle")));
await shot(page, "01-role-gemini-pools-open");
await page.getByTestId("syntx-gemini-output-toggle").click(); await settle(page);
ok("U-3d HIDE GEMINI OUTPUT closes it with the list open", await gemini(page) === "false");
await page.getByTestId("syntx-gemini-output-toggle").click();
await page.getByTestId(`job-pool-select-${EP}`).click(); await page.locator(`[data-testid="syntx-field"][data-selected-pool="${EP}"]`).waitFor(); await settle(page);
await page.keyboard.press("Escape"); await settle(page);
ok("U-3e another pool chosen with GEMINI OUTPUT open: Escape closes it, the other pool stays", await gemini(page) === "false" && await field(page, "data-selected-pool") === EP);
await page.getByTestId("syntx-pools-toggle").click(); await page.getByTestId(`job-pool-select-${VP}`).click(); await page.locator(`[data-testid="syntx-field"][data-selected-pool="${VP}"]`).waitFor(); await page.waitForTimeout(1200);
await clickSign(page, `syntx-organization-${ORG}`); await page.locator('[data-testid="syntx-field"][data-observation-kind="ORGANIZATION"]').waitFor();
ok("U-3f the field answers the pointer again afterwards", await field(page, "data-observation-id") === ORG);

// U-4 · a focus lost to the document: Escape still closes GEMINI OUTPUT, and then returns one level (R8).
await page.getByTestId("syntx-gemini-output-toggle").click(); await page.evaluate(() => document.activeElement?.blur()); await settle(page);
ok("U-4a precondition: the focus is on the document", await active(page) === "BODY");
await page.keyboard.press("Escape"); await settle(page);
ok("U-4b Escape on the document closes GEMINI OUTPUT first", await gemini(page) === "false" && await field(page, "data-observation-kind") === "ORGANIZATION");
await page.evaluate(() => document.activeElement?.blur()); await page.keyboard.press("Escape"); await settle(page);
ok("U-4c the next Escape returns one level", await field(page, "data-observation-kind") === "FIELD");
// U-4d/e · a modal layer above the field (System Codex, onboarding): an Escape on the document leaves the field as it is.
await page.getByTestId("syntx-gemini-output-toggle").click();
for (const [label, openId, layerId, closeId] of [["System Codex", "open-system-codex-btn", "system-codex-modal", "system-codex-close"], ["onboarding", "how-this-works-btn", "guided-onboarding-overlay", "onboarding-close-btn"]]) {
  await page.getByTestId(openId).click(); await page.getByTestId(layerId).waitFor({ timeout: 5000 });
  await page.evaluate(() => document.activeElement?.blur()); await page.keyboard.press("Escape"); await settle(page);
  ok(`U-4${label === "System Codex" ? "d" : "e"} ${label} open: Escape on the document leaves GEMINI OUTPUT and the observation as they are`, await gemini(page) === "true" && await field(page, "data-observation-kind") === "FIELD");
  await page.getByTestId(closeId).click(); await page.getByTestId(layerId).waitFor({ state: "detached", timeout: 5000 });
}
await page.evaluate(() => document.activeElement?.blur()); await page.keyboard.press("Escape"); await settle(page);
ok("U-4f with the layers closed, Escape on the document closes GEMINI OUTPUT again", await gemini(page) === "false");
await page.context().close();

// U-5 · with an analysis: Escape from the token input closes GEMINI OUTPUT, the focus stays in the field, the next Escape works.
page = await open(`/career/demo?focus=FIELD&jobPoolUploadId=${VP}&analysisId=${ANL}`);
await page.getByTestId("syntx-gemini-output-toggle").click(); await page.getByTestId("syntx-gemini-token").waitFor();
ok("U-5a GEMINI OUTPUT of an analysis: the token form, nothing read", await page.getByTestId("syntx-gemini-output").getAttribute("data-inspection-state") === "IDLE");
await page.getByTestId("syntx-gemini-token").focus(); await page.keyboard.press("Escape"); await settle(page);
ok("U-5b Escape in the token input closes it; the focus moves to the field root", await gemini(page) === "false" && await active(page) === "syntx-field", await active(page));
await page.getByTestId("syntx-gemini-output-toggle").click(); await page.keyboard.press("Escape"); await settle(page);
ok("U-5c reopened and closed again by Escape", await gemini(page) === "false");
await page.context().close();

// U-6 · PERSON (the Capability Field open without a job): after GEMINI OUTPUT and a pool change the Capability Field answers.
page = await open(`/career/demo?focus=FIELD&jobPoolUploadId=${VP}&investigationMode=PERSON`);
await page.getByTestId("syntx-gemini-output-toggle").click(); await page.getByTestId("syntx-pools-toggle").click();
await page.getByTestId(`job-pool-select-${EP}`).click(); await page.locator(`[data-testid="syntx-field"][data-selected-pool="${EP}"]`).waitFor();
await page.keyboard.press("Escape"); await settle(page);
await page.getByTestId("field-focus-capability-btn").click(); await page.locator('[data-testid="semantic-career-intelligence-field"][data-field-focus="CAPABILITY"]').waitFor();
ok("U-6a back in the Capability Field; mode PERSON kept", await page.getByTestId("investigation-mode-selector").getAttribute("data-investigation-mode") === "PERSON");
await page.getByTestId("add-text-source-btn").click(); await page.getByTestId("source-text-input").waitFor({ timeout: 5000 }).catch(() => undefined);
ok("U-6b the Capability Field takes a click (the source form opens)", await page.getByTestId("source-text-input").count() === 1);
await page.getByTestId("job-pool-panel-toggle").click(); await page.getByTestId("syntx-field").waitFor();
ok("U-6c back in the Job Field: the chosen pool is kept", await field(page, "data-selected-pool") === EP);
await page.context().close();

// S · the NO ANALYSIS state line (PERSON × JOB, a pool, no analysis).
page = await open(`/career/demo?focus=FIELD&jobPoolUploadId=${VP}`);
await page.locator('[data-testid="syntx-state"][data-sx-signal="awaiting-analysis"]').waitFor({ timeout: 20000 });
const copy = await page.getByTestId("syntx-state").textContent();
ok("S-1 one message: the text is the status copy, unchanged", /^NO ANALYSIS: run the capability sweep/.test(copy ?? ""), copy);
const type = await page.evaluate(() => { const chip = document.querySelector('[data-testid="syntx-state"]'); const [head, , body] = chip.querySelectorAll(":scope > span:last-child > span"); const cs = e => getComputedStyle(e); return { head: [cs(head).fontSize, cs(head).fontFamily.split(",")[0]], body: [cs(body).fontSize, cs(body).fontFamily.split(",")[0]], color: cs(body).color }; });
ok("S-2 hierarchy: the status word 10px mono, the instruction 11.5px sans (was 8.5px mono throughout)", type.head[0] === "10px" && type.body[0] === "11.5px", JSON.stringify(type));
const contrast = await page.evaluate(() => { const lum = ([r, g, b]) => { const c = [r, g, b].map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; }; const fg = [255, 232, 200], bg = [32, 24, 14]; const [a, b] = [lum(fg), lum(bg)].sort((x, y) => y - x); return Math.round(((a + 0.05) / (b + 0.05)) * 10) / 10; });
ok("S-3 contrast of the instruction over the chip (upper bound of its glow), WCAG AA ≥ 4.5", contrast >= 4.5, `${contrast}:1`);
const motion = await page.evaluate(() => { const core = document.querySelector("[data-sx-signal-core]"), aura = document.querySelector("[data-sx-signal-aura]"); const cs = getComputedStyle; return { core: [cs(core).animationName, cs(core).animationDuration], aura: [cs(aura).animationName, cs(aura).animationDuration, cs(aura).animationDelay], text: [...document.querySelectorAll('[data-testid="syntx-state"] span:not([data-sx-signal-aura]):not([data-sx-signal-core])')].map(e => cs(e).animationName).filter(n => n !== "none") }; });
ok("S-4 LIVE: indicator and aura pulse at 4.8 s (aura 0.24 s later); no text layer moves", motion.core[0] === "sxSignalCore" && motion.core[1] === "4.8s" && motion.aura[0] === "sxSignalAura" && motion.aura[2] === "0.24s" && motion.text.length === 0, JSON.stringify(motion));
const boxes = [];
for (let i = 0; i < 12; i += 1) { boxes.push(await page.evaluate(() => { const chip = document.querySelector('[data-testid="syntx-state"]').getBoundingClientRect(); const text = document.querySelector('[data-testid="syntx-state"] > span:last-child').getBoundingClientRect(); return [chip.x, chip.y, chip.width, chip.height, text.x, text.y, text.width, text.height].map(v => Math.round(v * 10) / 10).join(","); })); await page.waitForTimeout(420); }
ok("S-5 no layout motion: chip and text boxes identical over a full cycle (12 samples, 5 s)", new Set(boxes).size === 1, boxes[0]);
const keyframes = await page.evaluate(() => { const props = new Set(); for (const sheet of document.styleSheets) { let rules; try { rules = sheet.cssRules; } catch { continue; } for (const rule of rules) if (rule.type === CSSRule.KEYFRAMES_RULE && /^sxSignal/.test(rule.name)) for (const frame of rule.cssRules) for (const prop of frame.style) props.add(prop); } return [...props].sort(); });
ok("S-6 the keyframes animate opacity and transform only", keyframes.length > 0 && keyframes.every(p => ["opacity", "transform", "animation-timing-function"].includes(p)), keyframes.join(","));
const statement = await page.evaluate(() => { const own = document.querySelector('[data-testid="syntx-no-analysis"]'); const laws = document.querySelector('[data-testid="job-pool-non-claims"]'); const a = own.getBoundingClientRect(), b = laws.getBoundingClientRect(); return { text: own.textContent, gap: Math.round(b.top - a.bottom), animated: own.getAnimations({ subtree: true }).length, size: getComputedStyle(own.lastElementChild).fontSize }; });
ok("S-10 the field's own NO ANALYSIS statement: the same copy and voices, still, clear of the non-claims line", statement.text === copy && statement.gap >= 0 && statement.animated === 0 && statement.size === "11.5px", JSON.stringify({ gap: statement.gap, animated: statement.animated, size: statement.size }));
await page.getByTestId("syntx-state").scrollIntoViewIfNeeded();
await shot(page, "02-no-analysis-signal");
await page.locator('[data-sx-surface="header"]').screenshot({ path: `${OUT}/03-no-analysis-surface-${W}.png` });
/** The infinite CSS animations running inside the Job Field (names, sorted, distinct). */
const infinite = p => p.evaluate(() => [...new Set(document.querySelector('[data-testid="syntx-field"]').getAnimations({ subtree: true }).filter(a => a.effect?.getTiming().iterations === Infinity && a.animationName).map(a => a.animationName))].sort());
const signalInfinite = await infinite(page);
await page.context().close();

page = await open(`/career/demo?focus=FIELD&jobPoolUploadId=${VP}`, "reduce");
await page.locator('[data-testid="syntx-state"][data-sx-signal="awaiting-analysis"]').waitFor({ timeout: 20000 });
const reduced = await page.evaluate(() => { const core = document.querySelector("[data-sx-signal-core]"), aura = document.querySelector("[data-sx-signal-aura]"); return { mode: document.querySelector('[data-testid="syntx-field"]').getAttribute("data-motion-mode"), core: getComputedStyle(core).animationName, aura: getComputedStyle(aura).animationName, auraOpacity: getComputedStyle(aura).opacity }; });
ok("S-7 reduced motion: no animation, the static signal stays visible", reduced.mode === "REDUCED" && reduced.core === "none" && reduced.aura === "none" && Number(reduced.auraOpacity) > 0, JSON.stringify(reduced));
await page.context().close();

page = await open(`/career/demo?focus=FIELD&jobPoolUploadId=${VP}&investigationMode=PERSON`);
await page.waitForTimeout(1500);
const personInfinite = await infinite(page);
const added = signalInfinite.filter(name => !personInfinite.includes(name)), removed = personInfinite.filter(name => !signalInfinite.includes(name));
ok("S-9 infinite motions: NO ANALYSIS adds exactly sxSignalAura and sxSignalCore to the same field without the signal", JSON.stringify(added) === '["sxSignalAura","sxSignalCore"]' && removed.length === 0, `with signal: ${signalInfinite.join(", ")} | without: ${personInfinite.join(", ")}`);
ok("S-8 the signal belongs to NO ANALYSIS only: PERSON's state line stays as it was", await page.getByTestId("syntx-state").getAttribute("data-sx-signal") === null);
await page.context().close();

ok("X-1 no page errors", errors.length === 0, errors.join(" | "));
await browser.close();
writeFileSync(`${OUT}/walk-results-${W}.txt`, `${results.join("\n")}\n${results.filter(r => r.startsWith("PASS")).length}/${results.length}\n`);
console.log(results.join("\n")); console.log(`${results.filter(r => r.startsWith("PASS")).length}/${results.length}`);
