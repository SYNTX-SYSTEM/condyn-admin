/* Job Field NO_POOL giant: zero uploads (LAB-ONLY: GET /api/career/job-pools answered with an empty list in the browser; nothing
 * written), persisted-but-unselected (the lab's real list), selected (normal cosmos), REDUCED, DE. Usage: node shots.mjs <outDir> <tag> */
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
const { chromium } = await import("/home/codi/Entwicklung/nquiry/node_modules/playwright/index.mjs");
const [outDir, tag] = process.argv.slice(2); mkdirSync(outDir, { recursive: true });
const st = JSON.parse(readFileSync("/tmp/claude-1000/-home-codi-Entwicklung-condyn-admin-hr-dock/9dcc4453-2a41-4995-9a96-3a0c05b242a5/scratchpad/lab/state.json", "utf8"));
const BASE = st.base;
const browser = await chromium.launch({ headless: true });
const out = {};
const rect = (page, sel) => page.evaluate((sel) => { const e = document.querySelector(sel); if (!e) return null; const b = e.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top), Math.round(b.right), Math.round(b.bottom)]; }, sel);
const cases = [
  ["zero", 1600, 1000, "no-preference", "en"], ["persisted", 1600, 1000, "no-preference", "en"], ["selected", 1600, 1000, "no-preference", "en"],
  ["zero", 1280, 720, "no-preference", "en"], ["persisted", 1280, 720, "no-preference", "en"], ["selected", 1280, 720, "no-preference", "en"],
  ["persisted", 1600, 1000, "reduce", "en"], ["persisted", 1600, 1000, "no-preference", "de"]
];
for (const [kind, w, h, motion, lang] of cases) {
  const key = `${tag}-${kind}-${w}x${h}${motion === "reduce" ? "-reduced" : ""}${lang === "de" ? "-de" : ""}`;
  const page = await browser.newPage({ viewport: { width: w, height: h }, reducedMotion: motion });
  const errors = [], nonGet = []; page.on("pageerror", e => errors.push(String(e))); page.on("request", r => { if (r.method() !== "GET") nonGet.push(r.url()); });
  if (kind === "zero") await page.route(/\/api\/career\/job-pools(\?.*)?$/, route => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ jobPools: [] }) }));
  const url = kind === "selected" ? `${BASE}/career/demo?focus=FIELD&analysisId=${st.analysisId}&jobPoolUploadId=${st.uploadId}` : `${BASE}/career/demo?focus=FIELD&analysisId=${st.analysisId}`;
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 180000 });
  try { await page.getByTestId("guided-onboarding-overlay").waitFor({ timeout: 15000 }); await page.getByTestId("onboarding-close-btn").click(); await page.getByTestId("guided-onboarding-overlay").waitFor({ state: "detached", timeout: 15000 }); } catch {}
  if (lang === "de") { await page.getByTestId("open-system-codex-btn").click(); await page.getByTestId("switch-lang-de").click(); await page.getByTestId("system-codex-close").click(); }
  const want = kind === "selected" ? "AVAILABLE" : "NO_POOL";
  await page.locator(`[data-testid="syntx-field"][data-field-state="${want}"]`).waitFor({ timeout: 120000 });
  if (kind !== "selected") await page.locator(`[data-testid="job-pool-list"][data-pool-count="${kind === "zero" ? 0 : 3}"], [data-testid="job-pool-list"]`).first().waitFor({ timeout: 60000 });
  await page.mouse.move(w - 5, h - 5); await page.waitForTimeout(2500);
  await page.screenshot({ path: resolve(outDir, `${key}.png`) });
  const info = await page.evaluate(() => {
    const r = e => { if (!e) return null; const b = e.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top), Math.round(b.right), Math.round(b.bottom)]; };
    const f = document.querySelector('[data-testid="syntx-field"]');
    const g = document.querySelector('[data-testid="syntx-no-pool"]');
    const leaves = g ? [g, ...g.querySelectorAll("*")].filter(e => [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())).map(e => { const cs = getComputedStyle(e); return { text: e.textContent.trim().slice(0, 70), rect: r(e), font: `${cs.fontFamily.split(",")[0]} ${cs.fontSize}/${cs.lineHeight} w${cs.fontWeight} ls ${cs.letterSpacing}`, color: cs.color, sw: e.scrollWidth, cw: e.clientWidth }; }) : [];
    const disc = g ? (g.querySelector("[data-sx-giant-body]") ?? g) : null;
    return {
      state: f.getAttribute("data-field-state"), poolCount: document.querySelector('[data-testid="job-pool-list"]')?.getAttribute("data-pool-count") ?? null,
      giant: r(g), body: r(disc), giantCount: document.querySelectorAll('[data-testid="syntx-no-pool"]').length, poolBody: document.querySelectorAll('[data-testid="syntx-pool"]').length,
      header: r(document.querySelector("header")), selector: r(document.querySelector('[data-testid="field-focus-strip"]')), orient: r(document.querySelector("[data-sx-orient]")),
      poolList: r(document.querySelector('[data-testid="job-pool-list"]')), footer: r(document.querySelector('[data-sx-governance], [data-testid="syntx-governance"]')),
      fieldRect: r(f), leaves, running: document.getAnimations().filter(a => a.playState === "running" && a.effect?.getTiming?.().iterations === Infinity).map(a => a.animationName).sort().join(","),
      giantAnims: g ? g.getAnimations({ subtree: true }).map(a => `${a.animationName}:${a.effect?.getTiming?.().iterations}`).join(",") : ""
    };
  });
  info.errors = errors; info.nonGet = nonGet; out[key] = info;
  console.log(key, JSON.stringify({ state: info.state, pools: info.poolCount, giant: info.giant, body: info.body, n: info.giantCount, poolBody: info.poolBody, selector: info.selector, orient: info.orient, poolList: info.poolList, footer: info.footer, errors: errors.length, nonGet: nonGet.length, giantAnims: info.giantAnims }));
  await page.close();
}
await browser.close();
writeFileSync(resolve(outDir, `${tag}.json`), JSON.stringify(out, null, 1));
