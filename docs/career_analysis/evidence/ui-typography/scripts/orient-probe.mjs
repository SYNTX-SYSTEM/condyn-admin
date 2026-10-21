// PINK D-TY-2 follow-up (§3.51). argv: <base url> <w> <h> [css]; orientation surface child heights + edge action visibility (PINK probe2 state).
import { pathToFileURL } from "node:url";
const pw = await import(pathToFileURL(process.env.CONDYN_PLAYWRIGHT_MODULE).href); const { chromium } = pw.chromium ? pw : pw.default;
const [BASE, W, H] = [process.argv[2], +process.argv[3], +process.argv[4]]; const POOL = "JPOOL_B94850C439974E27496FE3B1A9A076B5";
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: W, height: H } }); await ctx.addInitScript(() => { try { localStorage.setItem("condyn_onboarding_seen", "1"); } catch {} });
const p = await ctx.newPage();
await p.goto(`${BASE}/career/demo?focus=FIELD&jobPoolUploadId=${POOL}&jobOrganizationId=org_kestrel&jobRoleId=role_kestrel_fullstack`, { waitUntil: "networkidle" });
await p.getByTestId("syntx-job-scope-select").waitFor({ state: "attached", timeout: 30000 }); if (process.argv[5]) await p.addStyleTag({ content: process.argv[5] }); await p.waitForTimeout(800);
const r = await p.evaluate(() => { const o = document.querySelector("[data-sx-orient]"); const ob = o.getBoundingClientRect();
  const kids = [...o.children].map(c => { const q = c.getBoundingClientRect(); return `${c.tagName}${c.getAttribute("data-testid") ? "#" + c.getAttribute("data-testid") : ""} y=${Math.round(q.top)} h=${Math.round(q.height)}`; });
  const acts = ["syntx-job-scope-select", "syntx-pools-toggle", "job-pool-intake-toggle", "syntx-gemini-output-toggle", "syntx-return-btn"].map(id => { const e = document.querySelector(`[data-testid="${id}"]`); if (!e) return `${id}: -`; const q = e.getBoundingClientRect(); const top = q.bottom <= innerHeight ? document.elementFromPoint((q.left + q.right) / 2, (q.top + q.bottom) / 2) : null; return `${id}: ${Math.round(q.top)}–${Math.round(q.bottom)} ${top && (top === e || e.contains(top)) ? "VISIBLE" : "hidden"}`; });
  return { surface: `${Math.round(ob.left)},${Math.round(ob.top)}–${Math.round(ob.right)},${Math.round(ob.bottom)} scrollH=${o.scrollHeight} clientH=${o.clientHeight}`, kids, acts }; });
console.log(W, H, JSON.stringify(r, null, 1)); await b.close();
