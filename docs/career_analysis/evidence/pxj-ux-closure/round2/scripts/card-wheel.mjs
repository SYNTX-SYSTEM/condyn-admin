// Role cards at the organisation level, reached as a user does: page scrolled by the mouse wheel until the card lies in the viewport,
// then 5 points × 6 samples (the cards orbit) by elementFromPoint. GET only.
import { pathToFileURL } from "node:url";
const [BASE, TAG] = process.argv.slice(2);
const pw = await import(pathToFileURL(process.env.CONDYN_PLAYWRIGHT_MODULE).href); const { chromium } = pw.chromium ? pw : pw.default;
const b = await chromium.launch(); const out = [];
for (const [n, w, h, d] of [["1600x900", 1600, 900, 1], ["1440x900", 1440, 900, 1], ["1280x720", 1280, 720, 1], ["zoom200-1920x1080", 960, 540, 2], ["zoom200-1280x720", 640, 360, 2]]) {
  for (const mode of ["PERSON_X_JOB", "PERSON"]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: d }); await ctx.addInitScript(() => { try { localStorage.setItem("condyn_onboarding_seen", "true"); } catch {} });
    await ctx.route("**/*", r => { const m = r.request().method(); return m !== "GET" && m !== "HEAD" ? r.abort() : r.continue(); });
    const p = await ctx.newPage();
    await p.goto(`${BASE}/career/demo?investigationMode=${mode}&jobPoolUploadId=JPOOL_B94850C439974E27496FE3B1A9A076B5&jobOrganizationId=org_kestrel`, { waitUntil: "domcontentloaded" }); await new Promise(r => setTimeout(r, 6000));
    const row = { vp: n, mode };
    for (const role of ["role_kestrel_fullstack", "role_kestrel_frontend_architect", "role_kestrel_engineering_lead"]) {
      const loc = p.getByTestId(`syntx-role-${role}`);
      if (!(await loc.count())) { row[role] = "absent"; continue; }
      await p.mouse.move(w / 2, h / 2);
      for (let k = 0; k < 40; k += 1) { const box = await loc.boundingBox(); if (!box) break; const top = box.y, bottom = box.y + box.height; if (top >= 0 && bottom <= h) break; await p.mouse.wheel(0, bottom > h ? Math.min(120, bottom - h + 20) : Math.max(-120, top - 20)); await new Promise(r => setTimeout(r, 150)); }
      let best = 0, covers = new Set();
      for (let s = 0; s < 6; s += 1) { const r = await loc.evaluate(e => { const x = e.getBoundingClientRect(); let self = 0; const cov = []; for (const [fx, fy] of [[0.5, 0.5], [0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]]) { const px = x.left + x.width * fx, py = x.top + x.height * fy; if (px < 0 || py < 0 || px >= innerWidth || py >= innerHeight) { cov.push("offscreen"); continue; } const hit = document.elementFromPoint(px, py); if (hit && (e === hit || e.contains(hit))) self += 1; else cov.push(hit?.closest("[data-testid]")?.getAttribute("data-testid") ?? hit?.tagName ?? "none"); } return { self, cov }; }); best = Math.max(best, r.self); r.cov.forEach(c => covers.add(c)); await new Promise(rr => setTimeout(rr, 250)); }
      row[role.replace("role_kestrel_", "")] = `${best}/5${covers.size ? ` [${[...covers].join(",")}]` : ""}`;
    }
    out.push(row); console.log(TAG, JSON.stringify(row));
    await ctx.close();
  }
}
await b.close();
