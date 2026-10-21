// Role-card rectangles under prefers-reduced-motion (orbit at rest) for the scale and dense pools: base vs after must be identical.
// argv: <lab state.json> <scripts dir of ui-typography evidence> <out.json>
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
const [STATE, SC, OUT] = process.argv.slice(2);
const { scalePool } = await import(pathToFileURL(`${SC}/../../job-pool/role-orbit/scripts/scale-pool.mjs`).href);
const { densePool } = await import(pathToFileURL(`${SC}/../../job-pool/role-cards/scripts/dense-pool.mjs`).href);
const pw = await import(pathToFileURL(process.env.CONDYN_PLAYWRIGHT_MODULE).href); const { chromium } = pw.chromium ? pw : pw.default;
const st = JSON.parse(readFileSync(STATE, "utf8")); const BASE = st.base;
const post = async body => { const r = await (await fetch(`${BASE}/api/career/job-pools`, { method: "POST", headers: { "content-type": "application/json", "x-condyn-principal-actor-id": "GRUEN_FOCUS_LAB" }, body: JSON.stringify(body) })).json(); return r.jobPoolUploadId ?? r.upload?.jobPoolUploadId; };
const SP = await post(scalePool("freeze01")); const DP = await post(densePool("freeze01"));
const b = await chromium.launch(); const out = {};
for (const [W, H] of [[1920, 1080], [1280, 720]]) {
  const ctx = await b.newContext({ viewport: { width: W, height: H }, reducedMotion: "reduce" }); await ctx.addInitScript(() => { try { localStorage.setItem("condyn_onboarding_seen", "1"); } catch {} });
  const p = await ctx.newPage();
  for (const [name, P, org] of [["orbit-14", SP, "org_orbit_14"], ["long-8", SP, "org_orbit_long_8"], ["dense", DP, "org_cards_dense"], ["kestrel", st.engineeringUploadId, "org_kestrel"]]) {
    await p.goto(`${BASE}/career/demo?focus=FIELD&jobPoolUploadId=${P}&jobOrganizationId=${org}&investigationMode=PERSON`, { waitUntil: "networkidle" }); await p.waitForTimeout(3000);
    out[`${name}-${W}`] = await p.evaluate(() => ({ motion: document.querySelector('[data-testid="syntx-field"]')?.getAttribute("data-motion-mode"), cards: [...document.querySelectorAll('[data-testid^="syntx-role-"]')].map(e => { const r = e.getBoundingClientRect(); return [e.getAttribute("data-testid"), Math.round(r.left * 10) / 10, Math.round(r.top * 10) / 10, Math.round(r.width * 10) / 10, Math.round(r.height * 10) / 10]; }).sort() }));
  }
  await ctx.close();
}
writeFileSync(OUT, JSON.stringify(out)); console.log(Object.entries(out).map(([k, v]) => `${k}: ${v.motion} ${v.cards.length}`).join(" | ")); await b.close();
