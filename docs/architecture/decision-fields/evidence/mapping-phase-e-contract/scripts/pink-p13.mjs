/**
 * PINK · PHASE-E · P-13 — the evidence-change-blindness proof, measured on PINK's own render at 716a1941.
 *
 * MAIN (A→B): the app's own polling path advances one requirement COVERS→EQUIVALENT (value unchanged, so fit/
 *   rank/tier/order unchanged). The arc's data-state must change (the change arrives). The field must STATE it:
 *   data-change="EVIDENCE" + a luminance transient on the arc, while nothing moves. RED-first ⇒ at this tip the
 *   change arrives with peak EVIDENCE marks 0, no transient, 0 bodies moved.
 * INVERSE (A→A2): a re-read whose content is byte-identical (object identity differs). Must mark NOTHING. On this
 *   tip vacuous (nothing ever marks); on the E-4b tip it is the guard against the cheap wrong fix (mark-everything
 *   -when-ranking-identity-changes). Recorded either way.
 *
 * Own render, own numbers. Not a GO (and no GO is possible at 716a1941 — P-13 is red).
 */
import { chromium } from "/home/codi/Entwicklung/nquiry/node_modules/playwright/index.mjs";
const BASE = process.env.PINK_BASE ?? "http://127.0.0.1:3120";
const AN = "CAN_00000000000000000000000000000002";
const L0 = `${BASE}/career/demo?focus=MAPPING&investigationMode=PERSON&analysisId=${AN}`;
const browser = await chromium.launch();

async function ctl(path) { const r = await fetch(`${BASE}${path}`); return r.json(); }
await ctl("/__pink/reset");
const state0 = await ctl("/__pink/state");
const TARGET = state0.target; // { pool, roleId, reqId }

async function openBody(page) {
  await page.goto(L0, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForSelector('[data-testid="mapping-field"]', { timeout: 30000 });
  await page.waitForTimeout(1200);
  if (await page.locator('[data-testid="guided-onboarding-overlay"]').count() > 0) {
    await page.locator('[data-testid="onboarding-close-btn"]').first().click().catch(() => {});
    await page.waitForTimeout(300);
  }
  // reveal the target role's arcs (L1→L2): click its pool, then its body
  await page.locator(`[data-testid="mapping-pool-${TARGET.pool}"]`).first().click().catch(() => {});
  await page.waitForTimeout(300);
  await page.locator(`[data-testid="mapping-body-${TARGET.pool}:${TARGET.roleId}"]`).first().click().catch(() => {});
  await page.waitForTimeout(400);
  // click the target arc itself if present (L2→L3) so its own element carries data-state
  const arc = page.locator(`[data-testid="mapping-arc-${TARGET.reqId}"]`);
  if (await arc.count()) { await arc.first().click().catch(() => {}); await page.waitForTimeout(300); }
}

const SAMPLE = (reqId) => {
  const field = document.querySelector('[data-testid="mapping-field"]');
  if (!field) return { error: "no field" };
  const all = [...field.querySelectorAll("*")];
  // every element whose own data-change === EVIDENCE (bodies today; arcs after E-4b)
  const evidence = all.filter(e => e.getAttribute("data-change") === "EVIDENCE").map(e => e.getAttribute("data-testid") || e.tagName);
  const layout = all.filter(e => e.getAttribute("data-change") === "LAYOUT").map(e => e.getAttribute("data-testid") || e.tagName);
  // every element that carries data-state and whose testid names the target requirement (beam, arc-key, arc)
  const carriers = all.filter(e => e.hasAttribute("data-state") && (e.getAttribute("data-testid") || "").includes(reqId))
    .map(e => { const cs = getComputedStyle(e); return { id: e.getAttribute("data-testid"), state: e.getAttribute("data-state"), dataChange: e.getAttribute("data-change"), filter: cs.filter, animationName: cs.animationName, opacity: +(+cs.opacity).toFixed(3), attrOpacity: e.getAttribute("opacity") }; });
  // body group transforms (position): 0 must change for a pure evidence change
  const bodies = {};
  for (const b of field.querySelectorAll('[data-testid^="mapping-body-"]')) {
    const cs = getComputedStyle(b);
    bodies[b.getAttribute("data-testid")] = (b.style.transform || "") + "|" + cs.transform;
  }
  const countOf = sel => { const el = field.querySelector(sel); return el ? (el.getAttribute("data-count") ?? "present") : null; };
  return {
    evidenceCount: evidence.length, evidence,
    layoutCount: layout.length, layout,
    carriers,
    bodies,
    deltaEvidence: countOf('[data-testid="mapping-delta-evidence"]'),
    layoutShifts: countOf('[data-testid="mapping-layout-shifts"]'),
    marked: countOf('[data-testid="mapping-marked"]'),
    trailAny: field.querySelector('[data-testid^="mapping-trail-"]') ? field.querySelectorAll('[data-testid^="mapping-trail-"]').length : 0
  };
};

async function run(to) {
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, reducedMotion: "no-preference" });
  const page = await ctx.newPage();
  const reads = [];
  page.on("console", m => { if (/job-ranking|auto-match/.test(m.text())) reads.push(m.text().slice(0, 100)); });
  await openBody(page);
  const baseline = await page.evaluate(SAMPLE, TARGET.reqId);
  const t0 = Date.now();
  await ctl(`/__pink/flip?to=${to}`);
  const samples = [];
  const SAMPLES = 210, EVERY = 120; // ≈ 25 s
  for (let i = 0; i < SAMPLES; i++) {
    const s = await page.evaluate(SAMPLE, TARGET.reqId);
    samples.push({ tMs: Date.now() - t0, ...s });
    await page.waitForTimeout(EVERY);
  }
  await ctx.close();

  const baseState = (baseline.carriers[0] || {}).state ?? null;
  const sawStates = [...new Set(samples.flatMap(s => s.carriers.map(c => c.state)))];
  const changeArrived = sawStates.some(st => st !== baseState);
  const firstChangeAt = (samples.find(s => s.carriers.some(c => c.state !== baseState)) || {}).tMs ?? null;
  const peakEvidence = Math.max(0, ...samples.map(s => s.evidenceCount));
  const peakLayout = Math.max(0, ...samples.map(s => s.layoutCount));
  const peakDeltaEvidence = Math.max(0, ...samples.map(s => Number(s.deltaEvidence) || 0));
  const peakTrail = Math.max(0, ...samples.map(s => s.trailAny || 0));
  // transient on any target carrier at any sample: a non-none filter or a running animation
  const transientSeen = samples.some(s => s.carriers.some(c => (c.filter && c.filter !== "none") || (c.animationName && c.animationName !== "none")));
  // bodies that ever differ from baseline transform
  const bodiesMoved = Object.keys(baseline.bodies || {}).filter(k => samples.some(s => s.bodies[k] !== baseline.bodies[k]));

  return {
    to, target: TARGET, baseState, sawStates, changeArrived, firstChangeAt,
    peakEvidence, peakLayout, peakDeltaEvidence, peakTrail, transientSeen,
    bodiesMovedCount: bodiesMoved.length, bodiesMoved,
    carrierIds: [...new Set(samples.flatMap(s => s.carriers.map(c => c.id)))],
    rankingReads: reads.length
  };
}

const main = await run("B");
await ctl("/__pink/reset");
const inverse = await run("A2");

const verdict = {
  P13_MAIN_red: main.changeArrived === true && main.peakEvidence === 0 && main.peakDeltaEvidence === 0 && main.transientSeen === false && main.bodiesMovedCount === 0,
  P13_INVERSE_marksNothing: inverse.peakEvidence === 0 && inverse.peakDeltaEvidence === 0 && inverse.transientSeen === false && inverse.bodiesMovedCount === 0,
  inverseChangeArrived: inverse.changeArrived
};
console.log(JSON.stringify({ commit: "716a1941", flippedOk: state0.flippedOk, verdict, main, inverse }, null, 1));
await browser.close();
