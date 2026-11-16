/**
 * PINK · PHASE-E · P-13 at the delivery tip (E-4b present). Measured on PINK's own render.
 *  GREEN (A→B): one requirement COVERS→EQUIVALENT via the app's own polling path. The changed arc must carry
 *     data-change="EVIDENCE" + animation mappingFieldTransient (brightness transient), EXACTLY ONE mark across the
 *     field (never more), nothing moved (COMPUTED transform), and the provenance line stated (mapping-delta-
 *     requirements, count 1).
 *  INVERSE A2 (identical content, fresh object, genuine re-read): must mark NOTHING — content comparison, not
 *     identity. The cheap "mark-when-ranking-identity-changes" fix would light everything.
 *  INVERSE A3 (ATTACK: q_covers requirementText reworded, state/key unchanged): diffRankings emits no evidence
 *     change, so must also mark NOTHING. A shallow/any-field-changed fix would mark it.
 * Body positions read from the COMPUTED transform (guarding against the attribute-is-empty defect GELB hit).
 */
import { chromium } from "/home/codi/Entwicklung/nquiry/node_modules/playwright/index.mjs";
const BASE = process.env.PINK_BASE ?? "http://127.0.0.1:3120";
const AN = "CAN_00000000000000000000000000000002";
const L0 = `${BASE}/career/demo?focus=MAPPING&investigationMode=PERSON&analysisId=${AN}`;
const browser = await chromium.launch();
async function ctl(p) { return (await fetch(`${BASE}${p}`)).json(); }
await ctl("/__pink/reset");
const st0 = await ctl("/__pink/state");
const T = st0.target; // {pool, roleId, reqId}

async function openL2(page) {
  await page.goto(L0, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForSelector('[data-testid="mapping-field"]', { timeout: 30000 });
  await page.waitForTimeout(1200);
  if (await page.locator('[data-testid="guided-onboarding-overlay"]').count() > 0) { await page.locator('[data-testid="onboarding-close-btn"]').first().click().catch(() => {}); await page.waitForTimeout(300); }
  await page.locator(`[data-testid="mapping-pool-${T.pool}"]`).first().click().catch(() => {}); await page.waitForTimeout(300);
  await page.locator(`[data-testid="mapping-body-${T.pool}:${T.roleId}"]`).first().click().catch(() => {}); await page.waitForTimeout(400);
}
const SAMPLE = (reqId) => {
  const field = document.querySelector('[data-testid="mapping-field"]');
  if (!field) return { error: "no field" };
  const all = [...field.querySelectorAll("*")];
  const evid = all.filter(e => e.getAttribute("data-change") === "EVIDENCE").map(e => e.getAttribute("data-testid") || e.tagName);
  const layout = all.filter(e => e.getAttribute("data-change") === "LAYOUT").map(e => e.getAttribute("data-testid") || e.tagName);
  // target carriers: elements naming the req that carry data-state (the arc; at L2 that is mapping-arc-<reqId>)
  const carriers = all.filter(e => e.hasAttribute("data-state") && (e.getAttribute("data-testid") || "").includes(reqId))
    .map(e => { const cs = getComputedStyle(e); return { id: e.getAttribute("data-testid"), state: e.getAttribute("data-state"), change: e.getAttribute("data-change"), filter: cs.filter, anim: cs.animationName }; });
  // brightness transient on ANY currently-marked element (filter: brightness(x))
  const brightened = all.filter(e => { const f = getComputedStyle(e).filter; return f && f !== "none" && /brightness\(([^)]+)\)/.test(f) && parseFloat(RegExp.$1) > 1.0001; }).length;
  const transientNames = [...new Set(all.map(e => getComputedStyle(e).animationName).filter(n => n && n.includes("Transient")))];
  // bodies: computed transform (robust) — NOT the attribute
  const bodies = {}; for (const b of field.querySelectorAll('[data-testid^="mapping-body-"]')) bodies[b.getAttribute("data-testid")] = getComputedStyle(b).transform;
  const prov = field.querySelector('[data-testid="mapping-delta-requirements"]');
  const evAt = field.querySelector('[data-testid="mapping-delta-evidence"]');
  return { evidenceCount: evid.length, evid, layoutCount: layout.length, carriers, brightened, transientNames, bodies,
    provCount: prov ? (prov.getAttribute("data-count") ?? "present") : null, provText: prov ? prov.textContent.slice(0, 80) : null,
    evReqCount: field.getAttribute("data-requirement-changes"), deltaEvidence: evAt ? evAt.getAttribute("data-count") : null };
};
async function run(to) {
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, reducedMotion: "no-preference" });
  const page = await ctx.newPage(); await openL2(page);
  const baseline = await page.evaluate(SAMPLE, T.reqId);
  const t0 = Date.now(); await ctl(`/__pink/flip?to=${to}`);
  const S = []; for (let i = 0; i < 160; i++) { S.push({ tMs: Date.now() - t0, ...(await page.evaluate(SAMPLE, T.reqId)) }); await page.waitForTimeout(100); }
  await ctx.close();
  const baseState = (baseline.carriers[0] || {}).state ?? null;
  const sawStates = [...new Set(S.flatMap(s => s.carriers.map(c => c.state)))];
  const changeArrived = sawStates.some(st => st !== baseState);
  const firstChangeAt = (S.find(s => s.carriers.some(c => c.state !== baseState)) || {}).tMs ?? null;
  const evidenceCounts = S.map(s => s.evidenceCount);
  const peakEvidence = Math.max(0, ...evidenceCounts);
  const everMoreThanOne = evidenceCounts.some(c => c > 1);
  const peakBrightened = Math.max(0, ...S.map(s => s.brightened));
  const transientSeen = S.some(s => s.transientNames.length > 0) || peakBrightened > 0;
  const transientNames = [...new Set(S.flatMap(s => s.transientNames))];
  const provSeen = S.some(s => s.provCount !== null);
  const provCountPeak = Math.max(0, ...S.map(s => Number(s.provCount) || 0));
  const provText = (S.find(s => s.provText) || {}).provText ?? null;
  const bodiesMoved = Object.keys(baseline.bodies || {}).filter(k => S.some(s => s.bodies[k] !== baseline.bodies[k]));
  const markedIds = [...new Set(S.flatMap(s => s.evid))];
  return { to, baseState, sawStates, changeArrived, firstChangeAt, peakEvidence, everMoreThanOne, peakBrightened, transientSeen, transientNames, provSeen, provCountPeak, provText, bodiesMovedCount: bodiesMoved.length, bodiesMoved, markedIds };
}
const main = await run("B"); await ctl("/__pink/reset");
const invA2 = await run("A2"); await ctl("/__pink/reset");
const invA3 = await run("A3"); await ctl("/__pink/reset");
const verdict = {
  P13_GREEN: main.changeArrived && main.peakEvidence === 1 && !main.everMoreThanOne && main.transientSeen && main.bodiesMovedCount === 0 && main.provSeen && main.provCountPeak === 1,
  INVERSE_A2_identical_marksNothing: invA2.peakEvidence === 0 && !invA2.transientSeen && invA2.bodiesMovedCount === 0 && !invA2.provSeen,
  INVERSE_A3_reworded_marksNothing: invA3.peakEvidence === 0 && !invA3.transientSeen && invA3.bodiesMovedCount === 0 && !invA3.provSeen
};
console.log(JSON.stringify({ commit: "9cc06f84", target: T, flippedOk: st0.flippedOk, verdict, main, invA2, invA3 }, null, 1));
await browser.close();
