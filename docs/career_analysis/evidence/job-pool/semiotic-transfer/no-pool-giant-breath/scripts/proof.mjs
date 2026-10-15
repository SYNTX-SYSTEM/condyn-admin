/* NO_POOL giant breath: (1) real-time video of >= 2 cycles (24 s) with wall-clock samples of the animated layers and the text block;
 * (2) deterministic rest / peak frames (Web Animations currentTime) and the red light in the annulus beyond the contour;
 * (3) REDUCED: no running animation, static base. Usage: node proof.mjs <outDir> */
import { readFileSync, mkdirSync, renameSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
const { chromium } = await import("/home/codi/Entwicklung/nquiry/node_modules/playwright/index.mjs");
const sharp = (await import("/home/codi/Entwicklung/condyn-admin-job-field/node_modules/sharp/lib/index.js")).default;
const [outDir] = process.argv.slice(2); mkdirSync(resolve(outDir, "v"), { recursive: true });
const st = JSON.parse(readFileSync("/tmp/claude-1000/-home-codi-Entwicklung-condyn-admin-hr-dock/9dcc4453-2a41-4995-9a96-3a0c05b242a5/scratchpad/lab/state.json", "utf8"));
const url = `${st.base}/career/demo?focus=FIELD&analysisId=${st.analysisId}`;
const open = async (page) => { await page.goto(url, { waitUntil: "domcontentloaded" }); try { await page.getByTestId("guided-onboarding-overlay").waitFor({ timeout: 15000 }); await page.getByTestId("onboarding-close-btn").click(); await page.getByTestId("guided-onboarding-overlay").waitFor({ state: "detached", timeout: 15000 }); } catch {} await page.locator('[data-testid="syntx-field"][data-field-state="NO_POOL"]').waitFor({ timeout: 120000 }); await page.mouse.move(1595, 995); await page.waitForTimeout(1500); };
const sample = (page) => page.evaluate(() => { const q = s => document.querySelector(s); const g = q('[data-testid="syntx-no-pool"]'); const text = g.lastElementChild.getBoundingClientRect(); const cs = s => getComputedStyle(q(s)); const sc = s => { const m = cs(s).transform.match(/matrix\(([\d.]+)/); return m ? Number(m[1]) : 1; }; return { aura: Number(cs("[data-sx-giant-aura]").opacity), auraScale: sc("[data-sx-giant-aura]"), seam: Number(cs("[data-sx-giant-seam]").opacity), membrane: sc("[data-sx-giant-membrane]"), ring: sc("[data-sx-giant-ring]"), text: [text.left, text.top, text.width, text.height].map(v => Math.round(v * 10) / 10) }; });
const browser = await chromium.launch({ headless: true });
// (1) video + wall-clock samples
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, recordVideo: { dir: resolve(outDir, "v"), size: { width: 1600, height: 1000 } } });
const page = await ctx.newPage(); const errors = []; page.on("pageerror", e => errors.push(String(e)));
await open(page);
const t0 = Date.now(); const samples = [];
while (Date.now() - t0 < 24000) { samples.push({ t: Math.round((Date.now() - t0) / 100) / 10, ...(await sample(page)) }); await page.waitForTimeout(500); }
const running = await page.evaluate(() => document.querySelector('[data-testid="syntx-no-pool"]').getAnimations({ subtree: true }).filter(a => a.playState === "running").map(a => `${a.animationName}:${a.effect.getTiming().duration}ms:${a.effect.getTiming().iterations}`));
const video = page.video(); await ctx.close(); renameSync(await video.path(), resolve(outDir, "giant-breath.webm"));
// (2) deterministic rest / peak frames
const p2 = await browser.newPage({ viewport: { width: 1600, height: 1000 } }); await open(p2);
const frames = {};
for (const [name, ms] of [["rest", 0], ["peak", 4600]]) {
  await p2.evaluate((ms) => { for (const a of document.querySelector('[data-testid="syntx-no-pool"]').getAnimations({ subtree: true })) { if (!a.animationName?.startsWith("sxGiant")) continue; a.pause(); a.currentTime = ms + (a.animationName === "sxGiantRing" ? 350 : 0); } }, ms);
  await p2.waitForTimeout(300);
  const buf = await p2.screenshot({ path: resolve(outDir, `giant-${name}.png`) });
  const box = await p2.getByTestId("syntx-no-pool").boundingBox();
  await p2.screenshot({ path: resolve(outDir, `giant-${name}-crop.png`), clip: { x: box.x - 90, y: box.y - 90, width: box.width + 180, height: box.height + 180 } });
  const { data, info } = await sharp(buf).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const cx = box.x + box.width / 2, cy = box.y + box.height / 2, r = box.width / 2; let sumR = 0, n = 0, seam = 0, ns = 0;
  for (let y = Math.floor(cy - r - 70); y < cy + r + 70; y++) for (let x = Math.floor(cx - r - 70); x < cx + r + 70; x++) { const d = Math.hypot(x - cx, y - cy); const i = (y * info.width + x) * 3; if (d > r + 18 && d < r + 64) { sumR += data[i]; n++; } if (d > r - 4 && d < r + 4) { seam += data[i]; ns++; } }
  frames[name] = { auraMeanRed: Math.round(sumR / n * 10) / 10, seamMeanRed: Math.round(seam / ns * 10) / 10, sample: await sample(p2) };
}
await p2.close();
// (3) REDUCED
const p3 = await browser.newPage({ viewport: { width: 1600, height: 1000 }, reducedMotion: "reduce" }); await open(p3);
const reduced = { running: await p3.evaluate(() => document.getAnimations().filter(a => a.playState === "running").map(a => a.animationName)), sample: await sample(p3) };
await p3.screenshot({ path: resolve(outDir, "giant-reduced.png") }); await p3.close();
await browser.close();
const textStable = samples.every(s => JSON.stringify(s.text) === JSON.stringify(samples[0].text));
const out = { cycleMs: 10000, running, samples, textStable, frames, reduced, errors };
writeFileSync(resolve(outDir, "breath-proof.json"), JSON.stringify(out, null, 1));
const a = samples.map(s => s.aura);
console.log("running", running.join(" "), "| aura opacity min/max", Math.min(...a), Math.max(...a), "| membrane max", Math.max(...samples.map(s => s.membrane)), "| text stable", textStable, "| frames", JSON.stringify(frames), "| reduced running", reduced.running.length, JSON.stringify(reduced.sample), "| errors", errors.length);
console.log("aura over time:", samples.map(s => `${s.t}:${s.aura.toFixed(2)}`).join(" "));
