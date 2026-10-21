// PINK D-TY-1 follow-up (§3.51), run from the repository root. argv: <base url> [css]. PINK's measure (START label painted share, clickable rows) at 1280 x 720 / 1366 x 768, PERSON + staged PDF.
import { pathToFileURL } from "node:url";
const pw = await import(pathToFileURL(process.env.CONDYN_PLAYWRIGHT_MODULE).href); const { chromium } = pw.chromium ? pw : pw.default;
const [BASE, CSS] = process.argv.slice(2); const W = process.cwd();
const b = await chromium.launch();
for (const [w, h] of [[1280, 720], [1440, 900], [1366, 768], [1920, 1080]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: 900 } }); await ctx.addInitScript(() => { try { localStorage.setItem("condyn_onboarding_seen", "1"); } catch {} });
  const p = await ctx.newPage(); const t = id => p.getByTestId(id);
  await p.goto(`${BASE}/career/demo`, { waitUntil: "networkidle" }); if (CSS) await p.addStyleTag({ content: CSS });
  const dockOnly = await p.evaluate(() => { const d = document.querySelector('[data-testid="source-dock"]'); const q = d.getBoundingClientRect(); return `empty-dock ${Math.round(q.top)}–${Math.round(q.bottom)}`; });
  await t("investigation-mode-PERSON").click(); await t("field-focus-capability-btn").click();
  await t("source-dock-file-input").setInputFiles(`${W}/docs/examples/cv.synthetic.pdf`); await t("analyze-investigation").waitFor({ timeout: 20000 });
  await p.setViewportSize({ width: w, height: h }); await p.waitForTimeout(400);
  const r = await p.evaluate(() => { const bt = document.querySelector('[data-testid="start-intake-analysis-btn"]'); const rg = document.createRange(); rg.selectNodeContents(bt); const l = rg.getBoundingClientRect(); const q = bt.getBoundingClientRect();
    let hit = 0, n = 0; for (let yi = 0; yi < 7; yi++) for (let xi = 0; xi < 9; xi++) { const x = l.left + (xi + .5) * (l.right - l.left) / 9, y = l.top + (yi + .5) * (l.bottom - l.top) / 7; n++; if (y < innerHeight) { const e = document.elementFromPoint(x, y); if (e && (e === bt || bt.contains(e))) hit++; } }
    let click = 0; for (let y = q.top; y < Math.min(q.bottom, innerHeight); y++) { const e = document.elementFromPoint((q.left + q.right) / 2, y); if (e && (e === bt || bt.contains(e))) click++; }
    const d = document.querySelector('[data-testid="source-dock"]').getBoundingClientRect();
    return `dock ${d.top.toFixed(1)}–${d.bottom.toFixed(1)} btn ${q.top.toFixed(1)}–${q.bottom.toFixed(1)} labelPainted ${(hit / n).toFixed(2)} clickRows ${click}`; });
  console.log(w, h, dockOnly, r); await ctx.close();
}
await b.close();
