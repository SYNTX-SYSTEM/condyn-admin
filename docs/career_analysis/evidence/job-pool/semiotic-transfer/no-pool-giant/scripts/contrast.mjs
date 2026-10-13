import { readFileSync } from "node:fs";
const { chromium } = await import("/home/codi/Entwicklung/nquiry/node_modules/playwright/index.mjs");
const sharp = (await import("/home/codi/Entwicklung/condyn-admin-job-field/node_modules/sharp/lib/index.js")).default;
const st = JSON.parse(readFileSync("/tmp/claude-1000/-home-codi-Entwicklung-condyn-admin-hr-dock/9dcc4453-2a41-4995-9a96-3a0c05b242a5/scratchpad/lab/state.json", "utf8"));
const lum = ([r, g, b]) => { const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const browser = await chromium.launch({ headless: true });
for (const [w, h] of [[1600, 1000], [1280, 720]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.goto(`${st.base}/career/demo?focus=FIELD&analysisId=${st.analysisId}`, { waitUntil: "domcontentloaded" });
  try { await page.getByTestId("guided-onboarding-overlay").waitFor({ timeout: 15000 }); await page.getByTestId("onboarding-close-btn").click(); } catch {}
  await page.locator('[data-testid="syntx-field"][data-field-state="NO_POOL"]').waitFor({ timeout: 120000 }); await page.mouse.move(w - 5, h - 5); await page.waitForTimeout(2000);
  const leaves = await page.evaluate(() => { const g = document.querySelector('[data-testid="syntx-no-pool"]'); return [g, ...g.querySelectorAll("*")].filter(e => [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())).map(e => { const b = e.getBoundingClientRect(); const cs = getComputedStyle(e); return { text: e.textContent.trim().slice(0, 40), rect: [b.left, b.top, b.width, b.height], color: cs.color, lines: Math.round(b.height / parseFloat(cs.lineHeight || "16")) }; }); });
  await page.addStyleTag({ content: '[data-testid="syntx-no-pool"], [data-testid="syntx-no-pool"] * { color: transparent !important; text-shadow: none !important; }' }); await page.waitForTimeout(300);
  const { data, info } = await sharp(await page.screenshot()).removeAlpha().ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const res = leaves.map(l => { const c = l.color.match(/[\d.]+/g).map(Number); const a = c[3] ?? 1; const px = []; const [x0, y0, w0, h0] = l.rect; for (let y = Math.max(0, Math.floor(y0)); y < Math.min(info.height, Math.ceil(y0 + h0)); y++) for (let x = Math.max(0, Math.floor(x0)); x < Math.min(info.width, Math.ceil(x0 + w0)); x++) { const i = (y * info.width + x) * 4; const p = [data[i], data[i + 1], data[i + 2]]; px.push([lum(p), p]); } px.sort((p, q) => p[0] - q[0]); const bg = px.length ? px[Math.floor(px.length * 0.75)][1] : [0, 0, 0]; const fg = [0, 1, 2].map(k => c[k] * a + bg[k] * (1 - a)); const L1 = lum(fg), L2 = lum(bg); return `${l.text}=${Math.round(((Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05)) * 100) / 100}`; });
  console.log(`${w}x${h}`, res.join(" | "));
  await page.close();
}
await browser.close();
