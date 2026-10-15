/* Red field typography: planetarium + every red focus. Variant "mock" = the lab's mock analysis as is (05 red). Variant "multi" = LAB-ONLY
 * browser augmentation of GET /api/career/analyses/<id> (organizations, roles, strategies emptied; nothing written) so 03/04/05/06 are red.
 * Usage: node measure.mjs <outDir> <tag> */
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { analyzedField } from "./common.mjs";
const { chromium } = await import("/home/codi/Entwicklung/nquiry/node_modules/playwright/index.mjs");
const sharp = (await import("/home/codi/Entwicklung/condyn-admin-job-field/node_modules/sharp/lib/index.js")).default;
const [outDir, tag] = process.argv.slice(2); mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const result = {};
const lum = ([r, g, b]) => { const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
async function leaves(page, selectors) {
  return page.evaluate((selectors) => {
    const r = e => { const b = e.getBoundingClientRect(); return [Math.round(b.left * 10) / 10, Math.round(b.top * 10) / 10, Math.round(b.width * 10) / 10, Math.round(b.height * 10) / 10]; };
    const out = [];
    for (const sel of selectors) for (const root of document.querySelectorAll(sel)) {
      for (const e of [root, ...root.querySelectorAll("*")]) {
        if (![...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) continue;
        if (e.closest('[data-testid^="orbital-preview-"]')) continue;
        const cs = getComputedStyle(e); let op = 1; for (let p = e; p; p = p.parentElement) op *= Number(getComputedStyle(p).opacity);
        out.push({ scope: sel, text: [...e.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join("").trim().slice(0, 48), rect: r(e), font: `${cs.fontSize}/${cs.lineHeight} w${cs.fontWeight} ls ${cs.letterSpacing}`, color: cs.color, opacity: Math.round(op * 100) / 100, shadow: cs.textShadow.slice(0, 80) });
      }
    }
    return out;
  }, selectors);
}
async function contrast(page, list, hideSel) {
  await page.addStyleTag({ content: `${hideSel} { color: transparent !important; text-shadow: none !important; } .sil-ghost-motion, [data-testid^="empty-projection-breathing"] { animation-play-state: paused !important; }` });
  await page.waitForTimeout(300);
  const { data, info } = await sharp(await page.screenshot()).removeAlpha().ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const res = list.map(l => {
    const c = l.color.match(/[\d.]+/g).map(Number); const a = (c[3] ?? 1) * l.opacity;
    const px = []; const [x0, y0, w0, h0] = l.rect;
    for (let y = Math.max(0, Math.floor(y0)); y < Math.min(info.height, Math.ceil(y0 + h0)); y++) for (let x = Math.max(0, Math.floor(x0)); x < Math.min(info.width, Math.ceil(x0 + w0)); x++) { const i = (y * info.width + x) * 4; const p = [data[i], data[i + 1], data[i + 2]]; px.push([lum(p), p]); }
    px.sort((p, q) => p[0] - q[0]); const bg = px.length ? px[Math.floor(px.length * 0.75)][1] : [0, 0, 0];
    const fg = [0, 1, 2].map(k => c[k] * a + bg[k] * (1 - a)); const L1 = lum(fg), L2 = lum(bg);
    return { ...l, ratio: Math.round(((Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05)) * 100) / 100 };
  });
  return res;
}
for (const variant of ["mock", "multi"]) {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  const errors = []; page.on("pageerror", e => errors.push(String(e)));
  if (variant === "multi") await page.route(/\/api\/career\/analyses\/[^/?]+$/, async (route) => {
    const response = await route.fetch(); const body = await response.json();
    const walk = o => { if (!o || typeof o !== "object") return; if (Array.isArray(o)) return o.forEach(walk); if ("strategies" in o && "organizations" in o) { o.strategies = []; o.organizations = []; o.roles = []; } Object.values(o).forEach(walk); };
    walk(body); await route.fulfill({ response, json: body });
  });
  await analyzedField(page);
  const red = await page.$$eval('[data-attention-state="EMPTY_PROJECTION_ATTENTION"]', els => els.map(e => e.getAttribute("data-testid").slice(-2)));
  const geometry = await page.$$eval('[data-testid^="orbital-physics-"]', els => els.map(e => { const b = e.getBoundingClientRect(); return [e.getAttribute("data-testid").slice(-2), Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)]; }));
  await page.screenshot({ path: resolve(outDir, `${tag}-${variant}-planetarium.png`) });
  const bodySel = ["01", "02", "03", "04", "05", "06"].map(id => `[data-testid="orbital-physics-${id}"]`);
  let planet = await leaves(page, bodySel);
  const v = { red, geometry, planetarium: await contrast(page, planet, '[data-testid^="orbital-physics-"] *'), focus: {}, errors };
  await page.close();
  for (const id of red) {
    const p2 = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    p2.on("pageerror", e => errors.push(String(e)));
    if (variant === "multi") await p2.route(/\/api\/career\/analyses\/[^/?]+$/, async (route) => { const response = await route.fetch(); const body = await response.json(); const walk = o => { if (!o || typeof o !== "object") return; if (Array.isArray(o)) return o.forEach(walk); if ("strategies" in o && "organizations" in o) { o.strategies = []; o.organizations = []; o.roles = []; } Object.values(o).forEach(walk); }; walk(body); await route.fulfill({ response, json: body }); });
    await analyzedField(p2);
    { const bb = await p2.getByTestId(`orbital-physics-${id}`).boundingBox(); await p2.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2); }
    await p2.getByTestId(`sil-orbit-empty-copy-${id}`).waitFor({ timeout: 20000 });
    await p2.mouse.move(5, 995); await p2.waitForTimeout(2600);
    await p2.screenshot({ path: resolve(outDir, `${tag}-${variant}-focus-${id}.png`) });
    const cb = await p2.getByTestId(`sil-orbit-empty-copy-${id}`).boundingBox();
    await p2.screenshot({ path: resolve(outDir, `${tag}-${variant}-focus-${id}-copy.png`), clip: { x: cb.x - 40, y: cb.y - 30, width: cb.width + 80, height: cb.height + 60 } });
    const sel = [`[data-testid="sil-orbit-empty-copy-${id}"]`, '[data-testid="semantic-focus-empty-projection"]', `[data-testid="orbital-physics-${id}"]`];
    const geo = await p2.evaluate((id) => { const g = s => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)]; }; return { membrane: g(`[data-testid="sil-ghost-membrane-${id}"]`), manifestation: g(`[data-testid="sil-ghost-manifestation-${id}"]`), copy: g(`[data-testid="sil-orbit-empty-copy-${id}"]`), body: g(`[data-testid="orbital-physics-${id}"]`), bar: g('[data-testid="semantic-focus-empty-projection"]'), anim: document.getAnimations().filter(a => a.playState === "running").map(a => a.animationName).filter(Boolean).sort().join(",") }; }, id);
    const list = await leaves(p2, sel);
    v.focus[id] = { geometry: geo, text: await contrast(p2, list, sel.map(s => `${s} *, ${s}`).join(", ")) };
    await p2.close();
  }
  result[variant] = v;
}
await browser.close();
writeFileSync(resolve(outDir, `${tag}.json`), JSON.stringify(result, null, 1));
for (const [k, v] of Object.entries(result)) {
  console.log(k, "red", v.red.join(","), "errors", v.errors.length);
  const redBodies = v.planetarium.filter(l => v.red.some(id => l.scope.includes(`-${id}"`)));
  console.log("  planetarium red-body leaves:", redBodies.map(l => `${l.text}=${l.ratio}`).join(" | "));
  for (const [id, f] of Object.entries(v.focus)) console.log("  focus", id, f.text.map(l => `${l.text}=${l.ratio}`).join(" | "));
}
