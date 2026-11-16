/** PINK · PHASE G · PF-4 limb 3 ACROSS FOCUS STATES, measured on 3ec8457d. (GELB §70.)
 *
 *  PF-4 limb 3: *"same-class marks on different bodies differ by <= 2 % -- i.e. depth did not touch evidence."*
 *  §21 measured 0.000 % and gave the reason as: `depthGain` sits on `.mf-core`, a SIBLING of the marks, and
 *  **the body group's own opacity is 1 for every body**. GELB showed the second clause is conditioned on this
 *  fixture, and it is right. Two paths move the body group's opacity, both deliberate (A-6):
 *      `:654`  const opacity = inPoolNow ? 1 : 0.18;
 *      `:292`  [data-mapping-body][data-lit="false"][data-in-pool="true"] { opacity: 0.32; }
 *  (GELB's `:695`/`:333`; the ~40-line offset is the comment delta between 3ec8457d and 4b83414e.)
 *
 *  ONE OF THE TWO IS REACHABLE HERE AND ONE IS NOT, AND THAT IS THE POINT OF RUNNING IT. The 0.18 path needs
 *  a body OUTSIDE the focused pool, which needs L1 and more than one pool -- A-G51's fixture, not this stand.
 *  **The 0.32 path needs only a capability selection at L0, which this stand can drive.** So GELB's 212.5 %
 *  derivation becomes a MEASUREMENT and its 455.6 % stays a derivation, each labelled as what it is.
 *  **A derivation a lane can turn into a reading should not stay a derivation because the other half cannot be.**
 *
 *  Capabilities are selected by clicking `[data-mapping-node]` (`:939`). EVERY capability is tried in turn,
 *  not one: the spread depends on which bodies the selected capability lights, so one click would report a
 *  configuration rather than the state. The verdict is the WORST same-class spread over all selections, and
 *  the per-selection rows are kept so the aggregate is never the only thing on offer (A-G235).
 *
 *  Spread is computed as (max - min) / min on the rendered group opacity within one `data-class`, which is
 *  the form GELB's 212.5 % and 455.6 % use ((1 - 0.32)/0.32, (1 - 0.18)/0.18) so the figures are comparable.
 *  The MARK's own rendered alpha is reported too: group opacity multiplies it, so a class whose stroke is
 *  byte-identical still differs on screen by the group's factor.
 */
import { playwright, provenance } from "../../../mapping-phase-pink-tools/pink-tools.mjs";
const PINK_PROV_3ec8457d = await provenance({ declaredCommit: "3ec8457d", declaredBuildId: "xCD8LBxdjnP97-2Gjs5yr" });
const chromium = await playwright();
const BASE = process.env.PINK_BASE ?? "http://127.0.0.1:3122";
const AN = "CAN_00000000000000000000000000000002";
const URL = `${BASE}/career/demo?focus=MAPPING&investigationMode=PERSON&analysisId=${AN}`;
const BOUND_PCT = 2.0;

const readBodies = page => page.evaluate(() => {
  const field = document.querySelector('[data-testid="mapping-field"]');
  return { selection: field.getAttribute('data-selection'), level: field.getAttribute('data-level'),
    bodies: [...document.querySelectorAll('[data-mapping-body]')].map(el => {
      const shape = el.querySelector('[data-mapping-body-shape]');
      return { rank: Number(el.getAttribute('data-rank')), cls: el.getAttribute('data-class'),
        shelf: el.getAttribute('data-shelf'), lit: el.getAttribute('data-lit'),
        inPool: el.getAttribute('data-in-pool'), marked: el.getAttribute('data-marked'),
        groupOpacity: Number(getComputedStyle(el).opacity),
        shapeStroke: shape ? getComputedStyle(shape).stroke : null,
        coreOpacity: (() => { const c = el.querySelector('circle.mf-core'); return c ? Number(getComputedStyle(c).opacity) : null; })() };
    }) };
});

function spreads(bodies) {
  const by = {};
  for (const b of bodies) (by[b.cls] ??= []).push(b);
  const rows = Object.entries(by).map(([cls, bs]) => {
    const ops = bs.map(x => x.groupOpacity), lo = Math.min(...ops), hi = Math.max(...ops);
    return { cls, n: bs.length, minGroupOpacity: lo, maxGroupOpacity: hi,
      spreadPct: lo > 0 ? +(((hi - lo) / lo) * 100).toFixed(3) : null,
      strokesIdentical: new Set(bs.map(x => x.shapeStroke)).size === 1,
      litStates: [...new Set(bs.map(x => x.lit))], inPoolStates: [...new Set(bs.map(x => x.inPool))] };
  });
  const worst = rows.reduce((a, r) => (r.spreadPct ?? 0) > (a?.spreadPct ?? -1) ? r : a, null);
  return { rows, worstSpreadPct: worst ? worst.spreadPct : null, worstClass: worst ? worst.cls : null,
    clears: rows.every(r => (r.spreadPct ?? 0) <= BOUND_PCT) };
}

async function run(VW, VH, motion) {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: 1, reducedMotion: motion });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForSelector('[data-testid="mapping-field"]', { timeout: 30000 });
  await page.waitForTimeout(1600);
  while (await page.locator('[data-testid="guided-onboarding-overlay"]').count() > 0) {
    await page.locator('[data-testid="onboarding-close-btn"]').first().click().catch(() => {});
    await page.keyboard.press("Escape").catch(() => {}); await page.waitForTimeout(400); }

  const resting = await readBodies(page);
  const nodes = await page.locator('[data-mapping-node]').all();
  const selections = [];
  for (let i = 0; i < nodes.length; i++) {
    const list = await page.locator('[data-mapping-node]').all();
    const testid = await list[i].getAttribute('data-testid');
    await list[i].click({ force: true }).catch(() => {});
    await page.waitForTimeout(650);
    const state = await readBodies(page);
    selections.push({ i, capability: testid, selectionAttr: state.selection,
      bodies: state.bodies, ...spreads(state.bodies) });
    // clear by clicking the same node again, so each selection is measured from rest
    const again = await page.locator('[data-mapping-node]').all();
    await again[i].click({ force: true }).catch(() => {});
    await page.waitForTimeout(500);
  }
  await ctx.close(); await b.close();

  const everSelected = selections.filter(s => s.selectionAttr === "CAPABILITY");
  const worstOverall = selections.reduce((a, s) => (s.worstSpreadPct ?? 0) > (a?.worstSpreadPct ?? -1) ? s : a, null);
  const dimmed = selections.flatMap(s => s.bodies).filter(x => x.lit === "false" && x.inPool === "true");
  return { viewport: `${VW}x${VH}`, motion, level: resting.level,
    restingState: { selectionAttr: resting.selection, ...spreads(resting.bodies), bodies: resting.bodies },
    capabilitiesTried: selections.length, selectionsThatTook: everSelected.length,
    the0_32PathObserved: dimmed.length > 0,
    observedDimmedGroupOpacities: [...new Set(dimmed.map(x => x.groupOpacity))],
    worstSpreadAcrossAllSelections_pct: worstOverall ? worstOverall.worstSpreadPct : null,
    worstSpreadClass: worstOverall ? worstOverall.worstClass : null,
    worstSpreadUnderWhichCapability: worstOverall ? worstOverall.capability : null,
    bound: `<= ${BOUND_PCT} %`,
    limb3_clearsAtRest: spreads(resting.bodies).clears,
    limb3_clearsUnderEverySelection: selections.every(s => s.clears),
    perSelection: selections.map(({ bodies, ...rest }) => rest) };
}

const out = { commit: PINK_PROV_3ec8457d.observedCommit, buildId: PINK_PROV_3ec8457d.observedBuildId,
  reading: "PINK — PF-4 limb 3 across focus states; the 0.32 path MEASURED, the 0.18 path out of reach at L0",
  pin: "PF-4 limb 3: same-class marks on different bodies differ <= 2 %",
  reachable: "the 0.32 path (capability selected, body in pool but unlit) needs only L0 — driven here",
  notReachable: "the 0.18 path (body outside the focused pool) needs L1 and >1 pool — A-G51's fixture, so GELB's 455.6 % stays a DERIVATION",
  scope: "one fixture, one analysisId, five bodies (2 field / 3 shelf), L0 — §63",
  runs: [] };
for (const [w, h, m] of [[1920, 1080, "reduce"], [1920, 1080, "no-preference"]]) out.runs.push(await run(w, h, m));
console.log(JSON.stringify(out, null, 2));
