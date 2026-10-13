/* DE locale and 1280x720, multi variant (LAB-ONLY browser augmentation), focus on each red orbit; plus reduced motion check. */
import { resolve } from "node:path";
import { analyzedField } from "./common.mjs";
const { chromium } = await import("/home/codi/Entwicklung/nquiry/node_modules/playwright/index.mjs");
const [outDir, tag] = process.argv.slice(2);
const browser = await chromium.launch({ headless: true });
const aug = async (page) => page.route(/\/api\/career\/analyses\/[^/?]+$/, async (route) => { const response = await route.fetch(); const body = await response.json(); const walk = o => { if (!o || typeof o !== "object") return; if (Array.isArray(o)) return o.forEach(walk); if ("strategies" in o && "organizations" in o) { o.strategies = []; o.organizations = []; o.roles = []; } Object.values(o).forEach(walk); }; walk(body); await route.fulfill({ response, json: body }); });
for (const [w, h, lang, motion] of [[1600, 1000, "de", "no-preference"], [1280, 720, "en", "no-preference"], [1600, 1000, "en", "reduce"]]) {
  for (const id of ["05", "06"]) {
    const page = await browser.newPage({ viewport: { width: w, height: h }, reducedMotion: motion });
    const errors = []; page.on("pageerror", e => errors.push(String(e)));
    await aug(page);
    await analyzedField(page);
    if (lang === "de") { await page.getByTestId("open-system-codex-btn").click(); await page.getByTestId("switch-lang-de").click(); await page.getByTestId("system-codex-close").click(); await page.waitForTimeout(800); }
    const bb = await page.getByTestId(`orbital-physics-${id}`).boundingBox(); await page.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2);
    try { await page.getByTestId(`sil-orbit-empty-copy-${id}`).waitFor({ timeout: 20000 }); } catch (e) { await page.screenshot({ path: resolve(outDir, `FAIL-${w}-${lang}-${id}.png`) }); console.log('FAIL', w, lang, id, page.url()); await page.close(); continue; } await page.mouse.move(5, h - 5); await page.waitForTimeout(2600);
    const key = `${tag}-${w}x${h}-${lang}-${motion}-focus-${id}`;
    await page.screenshot({ path: resolve(outDir, `${key}.png`) });
    const info = await page.evaluate((id) => { const c = document.querySelector(`[data-testid="sil-orbit-empty-copy-${id}"]`).getBoundingClientRect(); const s = document.querySelector('[data-testid="field-focus-strip"]')?.getBoundingClientRect(); const leaves = [...document.querySelectorAll(`[data-testid="sil-orbit-empty-copy-${id}"] *`)].filter(e => e.childNodes.length && e.childNodes[0].nodeType === 3).map(e => ({ t: e.textContent.trim().slice(0, 60), h: Math.round(e.getBoundingClientRect().height), sw: e.scrollWidth, cw: e.clientWidth })); return { copyTop: Math.round(c.top), copyBottom: Math.round(c.bottom), stripBottom: s ? Math.round(s.bottom) : null, overlapStrip: s ? c.top < s.bottom : null, leaves, running: document.getAnimations().filter(a => a.playState === "running").length }; }, id);
    console.log(key, JSON.stringify(info), "errors", errors.length);
    await page.close();
  }
}
await browser.close();
