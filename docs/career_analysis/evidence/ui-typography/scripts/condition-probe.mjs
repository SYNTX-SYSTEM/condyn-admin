// Conditions beyond the walk: browser zoom (125 % and 200 % as the CSS viewport they leave: 1536×864 and 960×540 of a 1920×1080
// screen), four monospace metrics (JetBrains Mono, Fira Code, DejaVu Sans Mono, IBM Plex Mono through --font-mono), English and German,
// on the Job Field states that carry the densest text (pool field, organization cosmos, role, 14-role and long-title orbits, dense
// cards). Each frame: clipped runs, collisions (./inventory.mjs) and the smallest rendered size. argv: <lab state.json> <out.json>.
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { inventory } from "./inventory.mjs";
import { scalePool } from "../../job-pool/role-orbit/scripts/scale-pool.mjs";
import { densePool } from "../../job-pool/role-cards/scripts/dense-pool.mjs";
const playwright = await import(pathToFileURL(process.env.CONDYN_PLAYWRIGHT_MODULE).href);
const { chromium } = playwright.chromium ? playwright : playwright.default;
const [STATE, OUT] = process.argv.slice(2);
const st = JSON.parse(readFileSync(STATE, "utf8")); const BASE = st.base; const suffix = String(st.database ?? "lab").slice(-8);
const post = async body => { const r = await (await fetch(`${BASE}/api/career/job-pools`, { method: "POST", headers: { "content-type": "application/json", "x-condyn-principal-actor-id": "GRUEN_TYPO_LAB" }, body: JSON.stringify(body) })).json(); return r.jobPoolUploadId ?? r.upload?.jobPoolUploadId; };
const EP = await post(JSON.parse(readFileSync(new URL("../../../../examples/job-pool-tests/DLL_JOBPOOL_ENGINEERING.json", import.meta.url), "utf8")));
const SP = await post(scalePool(suffix)); const DP = await post(densePool(suffix));
const STATES = [["pool", EP, null], ["kestrel", EP, "org_kestrel"], ["role", EP, "org_kestrel", "role_kestrel_fullstack"], ["orbit-14", SP, "org_orbit_14"], ["long-8", SP, "org_orbit_long_8"], ["dense", DP, "org_cards_dense"]];
const VIEWS = [["100", 1920, 1080], ["125", 1536, 864], ["200", 960, 540]];
const FONTS = ["JetBrains Mono", "Fira Code", "DejaVu Sans Mono", "IBM Plex Mono"];
const browser = await chromium.launch(); const rows = [];
for (const [zoom, width, height] of VIEWS) for (const font of FONTS) for (const lang of ["en", "de"]) {
  if (zoom !== "100" && font !== "JetBrains Mono" && lang === "en") continue; // fonts × zoom in German only (the longer copy)
  const ctx = await browser.newContext({ viewport: { width, height } });
  await ctx.addInitScript(f => { try { localStorage.setItem("condyn_onboarding_seen", "1"); } catch {} document.addEventListener("DOMContentLoaded", () => { const s = document.createElement("style"); s.textContent = `:root { --font-mono: "${f}", monospace; }`; document.head.appendChild(s); }); }, font);
  const page = await ctx.newPage(); const t = id => page.getByTestId(id);
  for (const [name, pool, org, role] of STATES) {
    try {
      await page.goto(`${BASE}/career/demo?focus=FIELD&jobPoolUploadId=${pool}`, { waitUntil: "networkidle" }); await t("syntx-field").waitFor({ timeout: 60000 });
      if (lang === "de") { await t("open-system-codex-btn").click(); await t("switch-lang-de").click(); await t("system-codex-close").click(); }
      if (org) { await t(`syntx-organization-${org}`).dispatchEvent("click"); await page.locator('[data-testid="syntx-field"][data-observation-kind="ORGANIZATION"]').waitFor(); }
      if (role) { await t(`syntx-role-${role}`).dispatchEvent("click"); await page.locator('[data-testid="syntx-field"][data-observation-kind="ROLE"]').waitFor(); }
      await page.waitForTimeout(1300);
      const inv = await inventory(page); const vis = inv.items.filter(it => it.opacity >= 0.5 && it.box[2] >= 3 && it.box[3] >= 3);
      const clipped = vis.filter(it => it.clipped).map(it => `${it.key}: ${it.text.slice(0, 30)}`);
      const row = { zoom, font, lang, state: name, runs: vis.length, minSize: Math.min(...vis.map(it => it.size)), clipped, collisions: inv.collisions.map(c => `${c.a} "${c.at.slice(0, 24)}" × ${c.b} "${c.bt.slice(0, 24)}"`) };
      rows.push(row); console.log(`${zoom}% ${font.padEnd(16)} ${lang} ${name.padEnd(8)} runs ${String(row.runs).padStart(3)} min ${row.minSize.toFixed(1)} clipped ${clipped.length} collisions ${row.collisions.length}`);
    } catch (error) { rows.push({ zoom, font, lang, state: name, error: String(error).split("\n")[0] }); console.log(`${zoom}% ${font} ${lang} ${name} ERROR ${String(error).split("\n")[0]}`); }
  }
  await ctx.close();
}
writeFileSync(OUT, JSON.stringify(rows, null, 1));
await browser.close();
