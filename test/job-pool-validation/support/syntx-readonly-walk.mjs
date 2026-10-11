// PINK read-only SYNTX walk against an existing environment (plan 1.5.1 TS-Q, Q-12 "the same walk read-only against the
// owner environment after the move", A-04). GET-only HTTP, existing analyses + existing upload only; any non-GET request
// issued by the page is a failure. Signs are compared against the GET bodies of the same server (binding table §2).
//   BASE=http://127.0.0.1:3017 UPLOAD=JPOOL_… ANALYSES=<id suffixes, comma-separated> node syntx-readonly-walk.mjs <outDir>
import { createHash } from "node:crypto";
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
const { chromium } = await import(process.env.CONDYN_PLAYWRIGHT_MODULE ?? "/home/codi/Entwicklung/nquiry/node_modules/playwright/index.mjs");

const BASE = process.env.BASE ?? "http://127.0.0.1:3017";
const UPLOAD = process.env.UPLOAD ?? "JPOOL_30F7145E21F34BEF0FCE510DFC75837B";
const SUFFIXES = (process.env.ANALYSES ?? "612,831").split(",").map((s) => s.trim()).filter(Boolean);
const OUT = resolve(process.argv[2] ?? "./evidence");
mkdirSync(OUT, { recursive: true });

const ENUMS = {
  source: ["canonical_entity", "matching_contribution", "gemini_sweep", "evidence", "evaluation_state"],
  relation: ["contains", "requires", "supports", "weakly_supports", "covers_unscored", "missing_support", "pending_evaluation"],
  state: ["field", "organization_selected", "role_selected", "requirement_selected", "receded", "inspectable"],
  manifestation: ["carrier", "region", "anchor", "trace_stable", "trace_thin", "trace_dotted", "open_boundary", "suspended_boundary", "temporary_aperture"],
  interaction: ["select", "inspect", "return", "none"],
  transition: ["recenter", "unfold", "recede", "trace_rise", "boundary_suspend", "restore"]
};
const RETIRED = ['[data-testid^="job-field"]', '[data-testid="job-pool-panel"]', '[data-testid^="job-pool-structure-"]', '[data-testid="job-pool-core"]', '[data-testid^="job-pool-nebula-"]', '[data-testid^="job-pool-role-"]', '[data-testid^="job-pool-trqrev-"]', '[data-testid="job-pool-selected"]', '[data-testid^="job-pool-matching-details"]', '[data-testid="job-pool-enter-job-field"]', '[data-testid="field-focus-job-btn"]', '[data-field-focus="JOB"]', '[data-field-focus="POOL"]', '[data-field-grammar="POOL_FIELD_V1"]', '[data-interaction-grammar]', '[data-focus-level]', '[data-galaxy-grammar]', '[data-at-core]'];
const PROOF_ID_TEXT = /CAP_[A-Z0-9_]+|PCAP_[A-Z0-9_]+|TRQREV_[A-Z0-9]+|TRPREV_[A-Z0-9]+|TOENT_[A-Z0-9]+|TROB_[A-Z0-9]+|DOC_[0-9]+|ANL_[A-Z0-9_]+|JPOOL_[0-9A-F]+|EVD_[A-Z0-9_]+/;
const PERCENT = /\d+(\.\d+)?\s?%/;

const results = []; let failures = 0;
const check = (name, ok, detail = "") => { results.push({ name, ok: !!ok, detail: String(detail) }); if (!ok) { failures++; console.log(`FAIL ${name} ${detail}`); } else console.log(`ok   ${name}${detail ? " · " + detail : ""}`); };
const get = async (path) => { const r = await fetch(BASE + path); const text = await r.text(); let body = null; try { body = JSON.parse(text); } catch { /* not json */ } return { status: r.status, body, text }; };
const squash = (s) => (s ?? "").replace(/\s+/g, "");
const sha256 = (b) => createHash("sha256").update(b).digest("hex");

// 1. Resolve the existing analyses and the upload, GET only.
const list = await get("/api/career/analyses");
check("GET analyses 200", list.status === 200, `status ${list.status}`);
const all = list.body?.analyses ?? [];
const idOf = (a) => a.analysisId ?? a.id ?? a.analysis_id;
const analyses = SUFFIXES.map((s) => all.map(idOf).find((id) => typeof id === "string" && id.endsWith(s)));
check("analyses resolved", analyses.every(Boolean), analyses.join(","));
const viewRes = await get(`/api/career/job-pools/${UPLOAD}`);
check("GET upload view 200", viewRes.status === 200, `status ${viewRes.status}`);
const view = viewRes.body;
const mapping = view?.canonicalMapping ?? null;
check("canonical mapping present", mapping?.roles?.length > 0 && mapping?.organizations?.length > 0, `orgs ${mapping?.organizations?.length} roles ${mapping?.roles?.length}`);
writeFileSync(resolve(OUT, "Q-00-view.json"), viewRes.text + "\n");

const browser = await chromium.launch();
const nonGet = [];
const newPage = async (reduced = false) => {
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, reducedMotion: reduced ? "reduce" : "no-preference" });
  const page = await ctx.newPage();
  page.on("request", (req) => { if (req.method() !== "GET" && req.url().startsWith(BASE)) nonGet.push(`${req.method()} ${req.url()}`); });
  page.on("pageerror", (e) => check("no page error", false, e.message));
  return page;
};
const dismissOnboarding = async (page) => {
  const overlay = page.getByTestId("guided-onboarding-overlay");
  try { await overlay.waitFor({ timeout: 60_000 }); } catch { return; }
  await page.getByTestId("onboarding-close-btn").click();
  await overlay.waitFor({ state: "detached", timeout: 30_000 });
};
const shot = (page, name) => page.screenshot({ path: resolve(OUT, name + ".png"), fullPage: false });
const root = (page) => page.getByTestId("syntx-field");
const settled = async (page) => {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    const running = await root(page).evaluate((el) => el.getAnimations({ subtree: true }).filter((a) => a.playState === "running" && !String(a.animationName ?? "").startsWith("sxSuspend") && a.effect?.getTiming?.().iterations !== Infinity).length);
    if (running === 0) break;
    await page.waitForTimeout(120);
  }
  await page.waitForTimeout(200);
};
const waitKind = (page, kind, extra = "") => page.locator(`[data-testid="syntx-field"][data-observation-kind="${kind}"]${extra}`).waitFor({ timeout: 20_000 });
const bottomOf = (loc) => loc.evaluate((el) => { const b = el.getBoundingClientRect(); return { x: b.width / 2, y: b.height - 6 }; });
const topOf = (loc) => loc.evaluate((el) => { const b = el.getBoundingClientRect(); return { x: b.width / 2, y: 5 }; });
// A point the trace owns under the pointer. The visible geometry is a <line> (§13 on 8cb4a50; client point from the
// bounding box) or a <path> (GRÜN's perceptual-closure delta: straight "M…L…" or bowed "M…Q…"; client point via
// getPointAtLength and the screen CTM).
const alongTrace = (loc) => loc.evaluate((el) => {
  const geo = el.querySelector("path:not([data-sx-hit]), line:not([data-sx-hit])");
  let at;
  if (geo.tagName.toLowerCase() === "path") {
    const total = geo.getTotalLength(); const ctm = geo.getScreenCTM();
    at = (f) => { const p = geo.getPointAtLength(total * f); const sp = new DOMPoint(p.x, p.y).matrixTransform(ctm); return { x: sp.x, y: sp.y }; };
  } else {
    const rect = geo.getBoundingClientRect();
    const dx = geo.x2.baseVal.value - geo.x1.baseVal.value, dy = geo.y2.baseVal.value - geo.y1.baseVal.value;
    const a = { x: dx >= 0 ? rect.left : rect.right, y: dy >= 0 ? rect.top : rect.bottom }, b = { x: dx >= 0 ? rect.right : rect.left, y: dy >= 0 ? rect.bottom : rect.top };
    at = (f) => ({ x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f });
  }
  for (const f of [0.3, 0.38, 0.46, 0.54, 0.62, 0.7, 0.78, 0.22]) { const p = at(f); const hit = el.ownerDocument.elementFromPoint(p.x, p.y); if (hit && el.contains(hit)) return { ...p, owned: true }; }
  const mid = at(0.5); const top = el.ownerDocument.elementFromPoint(mid.x, mid.y);
  return { ...mid, owned: false, owner: top?.closest("[data-sign-id]")?.getAttribute("data-sign-id") ?? top?.tagName ?? "offscreen" };
});
// Keyboard inspection of a sign (R7): focus + Enter. Used as the fallback when the pointer cannot own the trace, so the
// aperture assertions still run and the pointer defect is recorded on its own.
const inspectByKeyboard = async (page, loc) => { await loc.focus(); await page.keyboard.press("Enter"); };
const inViewport = (loc) => loc.evaluate((el) => { const b = el.getBoundingClientRect(); return b.left >= 0 && b.top >= 0 && b.right <= innerWidth && b.bottom <= innerHeight; });
const collectSigns = (page) => root(page).evaluate((r) => Array.from(r.querySelectorAll("[data-sign-id]")).map((el) => { const proof = {}; for (const a of Array.from(el.attributes)) if (a.name.startsWith("data-proof-")) proof[a.name.slice(11)] = a.value; return { testId: el.getAttribute("data-testid"), id: el.getAttribute("data-sign-id"), source: el.getAttribute("data-sign-source"), relation: el.getAttribute("data-sign-relation"), state: el.getAttribute("data-sign-state"), manifestation: el.getAttribute("data-sign-manifestation"), interaction: el.getAttribute("data-sign-interaction"), transition: el.getAttribute("data-sign-transition"), proof }; }));
const stageText = async (page) => (await page.getByTestId("syntx-stage").textContent()) ?? "";

for (const analysisId of analyses) {
  if (!analysisId) continue;
  const tag = analysisId.slice(-3);
  try {
  const m = await get(`/api/career/job-pools/${UPLOAD}/matches?analysisId=${analysisId}`);
  check(`[${tag}] GET matches 200`, m.status === 200, `status ${m.status} sweep ${m.body?.capabilitySweep?.state ?? "?"} proposals ${m.body?.capabilitySweep?.proposalCount ?? "?"}`);
  const matches = m.body; if (!matches?.roleMatches) continue;
  const a = await get(`/api/career/analyses/${analysisId}`);
  check(`[${tag}] GET analysis 200`, a.status === 200, `status ${a.status}`);
  writeFileSync(resolve(OUT, `${tag}-Q-00-matches.json`), m.text + "\n"); writeFileSync(resolve(OUT, `${tag}-Q-00-analysis.json`), a.text + "\n");
  const documents = (a.body?.analysis?.structured_data?.analysis?.documents ?? []).map((d) => ({ docId: d.entity_id, title: d.identity?.name ?? null }));
  const proposalEvidence = (a.body?.capabilityProposalProjection?.capabilities ?? []).flatMap((c) => (c.evidence ?? []).map((e) => ({ capabilityProposalId: c.id, evidenceId: e.evidenceId, docId: e.sourceDocumentId, quote: e.exactQuote })));
  const roles = matches.roleMatches;
  const requirementIds = new Set(mapping.roles.flatMap((r) => r.requirements.map((q) => q.poolRequirementId)));
  const trqrevs = new Set(mapping.roles.flatMap((r) => r.requirements.map((q) => q.targetRequirementRevisionId)));
  const targets = new Set([...mapping.organizations.map((o) => o.targetOrganizationEntityId), ...mapping.roles.map((r) => r.targetRoleOrganizationBindingRevisionId), ...roles.map((r) => r.canonical.targetRoleProfileRevisionId)]);
  const capIds = new Set(roles.flatMap((r) => [...r.matched, ...r.weakEvidence].map((i) => i.matchedCapabilityEntityId).concat([...r.matched, ...r.weakEvidence, ...r.missing].filter((i) => i.sweepProposal).map((i) => i.sweepProposal.capabilityProposalId))));
  const docIds = new Set(roles.flatMap((r) => [...r.matched, ...r.weakEvidence].flatMap((i) => i.evidence.map((q) => q.docId)).concat([...r.matched, ...r.weakEvidence, ...r.missing].filter((i) => i.sweepProposal).flatMap((i) => i.sweepProposal.evidence.map((q) => q.docId)))));
  const evdIds = new Set(proposalEvidence.map((e) => e.evidenceId));

  const audit = async (page, label) => {
    const signs = await collectSigns(page);
    check(`[${tag}] ${label} signs unique`, new Set(signs.map((s) => s.id)).size === signs.length, `${signs.length} signs`);
    check(`[${tag}] ${label} data-sign-count`, Number(await root(page).getAttribute("data-sign-count")) === signs.length);
    let enumOk = true, proofOk = true; const bad = [];
    for (const s of signs) {
      for (const k of Object.keys(ENUMS)) if (!ENUMS[k].includes(s[k])) { enumOk = false; bad.push(`${s.id}.${k}=${s[k]}`); }
      if (Object.keys(s.proof).length === 0) { proofOk = false; bad.push(`${s.id} no proof`); }
      for (const [k, v] of Object.entries(s.proof)) {
        const ok = k === "upload-id" ? v === UPLOAD : k === "organization-id" ? mapping.organizations.some((o) => o.poolOrganizationId === v) : k === "role-id" ? mapping.roles.some((r) => r.poolRoleId === v) : k === "requirement-id" ? requirementIds.has(v) : k === "target-id" ? targets.has(v) : k === "trqrev-id" ? v.split(" ").every((id) => trqrevs.has(id)) : k === "analysis-id" ? v === analysisId : k === "capability-id" ? capIds.has(v) : k === "doc-id" ? docIds.has(v) : k === "evidence-id" ? evdIds.has(v) : false;
        if (!ok) { proofOk = false; bad.push(`${s.id} ${k}=${v}`); }
      }
    }
    check(`[${tag}] ${label} §14.3 enums only`, enumOk, bad.slice(0, 5).join("; "));
    check(`[${tag}] ${label} every proof resolves in the bodies`, proofOk, bad.slice(0, 5).join("; "));
    const pending = signs.filter((s) => s.relation === "pending_evaluation" && s.manifestation !== "temporary_aperture");
    check(`[${tag}] ${label} pending at most once, no closure`, pending.length <= 1 && !signs.some((s) => /closed|closure|seal/.test(s.manifestation)), `pending ${pending.length}`);
    const apertureOpen = (await root(page).getAttribute("data-aperture-open")) === "true";
    const text = apertureOpen ? await root(page).evaluate((r) => r.querySelector('[data-testid="syntx-canvas"]')?.textContent ?? "") : await stageText(page);
    check(`[${tag}] ${label} no proof id as text`, !PROOF_ID_TEXT.test(text));
    check(`[${tag}] ${label} no RRL/TSN/EIS/RCP`, !/\b(RRL|TSN|EIS|RCP)_[A-Z0-9]/.test(await root(page).evaluate((r) => r.innerHTML)));
    const summary = (await page.getByTestId("syntx-summary").textContent()) ?? "";
    check(`[${tag}] ${label} summary (aria-live, R9/BR-4) agrees in number (O-SX-3)`, !/\b1 (sources|traces|requirements|roles|organizations|Quellen|Evidenzspuren|Anforderungen|Rollen|Organisationen)\b/.test(summary), summary.slice(0, 120));
    writeFileSync(resolve(OUT, `${tag}-${label}-signs.json`), JSON.stringify(signs, null, 2) + "\n");
    return signs;
  };

  // 2. FIELD
  const page = await newPage();
  await page.goto(`${BASE}/career/demo?focus=FIELD&analysisId=${analysisId}&jobPoolUploadId=${UPLOAD}`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await dismissOnboarding(page);
  await page.locator('[data-testid="syntx-field"][data-field-state="AVAILABLE"][data-sources-state="AVAILABLE"]').waitFor({ timeout: 120_000 });
  check(`[${tag}] grammar SYNTX_FIELD_V1 at FIELD`, (await root(page).getAttribute("data-field-grammar")) === "SYNTX_FIELD_V1" && (await root(page).getAttribute("data-observation-kind")) === "FIELD" && (await root(page).getAttribute("data-observation-id")) === UPLOAD);
  check(`[${tag}] counts = mapping`, (await root(page).getAttribute("data-organization-count")) === String(mapping.organizations.length) && (await root(page).getAttribute("data-role-count")) === String(mapping.roles.length) && (await root(page).getAttribute("data-requirement-count")) === "0");
  let retiredHits = 0; for (const sel of RETIRED) retiredHits += await page.locator(sel).count();
  check(`[${tag}] retired ids absent`, retiredHits === 0, `${retiredHits}`);
  check(`[${tag}] strip has two buttons`, (await page.locator('[data-testid="field-focus-strip"] button').count()) === 2);
  let containment = true, names = true;
  for (const o of mapping.organizations) { const el = page.getByTestId(`syntx-organization-${o.poolOrganizationId}`); if ((await el.count()) !== 1 || (await el.getAttribute("data-proof-target-id")) !== o.targetOrganizationEntityId) containment = false; if (!squash(await el.textContent()).includes(squash(o.name))) names = false; }
  for (const r of mapping.roles) { const el = page.getByTestId(`syntx-role-${r.poolRoleId}`); if ((await el.count()) !== 1 || (await el.getAttribute("data-proof-organization-id")) !== r.poolOrganizationId) { containment = false; continue; } if (!squash(await el.textContent()).includes(squash(r.title))) names = false; const inside = await el.evaluate((e) => { const reg = e.ownerDocument.querySelector(`[data-testid="syntx-organization-${e.getAttribute("data-proof-organization-id")}"] circle:not([data-sx-glow]):not([data-sx-hit])`); const body = e.querySelector("circle:not([data-sx-glow]):not([data-sx-hit])"); const c = (circle) => { const b = circle.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2, r: b.width / 2 }; }; const r = c(reg), b = c(body); return Math.hypot(b.x - r.x, b.y - r.y) < r.r; }); if (!inside) containment = false; }
  check(`[${tag}] every region and carrier with its canonical proof, roles inside their region`, containment);
  check(`[${tag}] full names readable`, names);
  check(`[${tag}] no number at FIELD`, !PERCENT.test(await stageText(page)) && (await page.locator("[data-resonance-score]").count()) === 0);
  check(`[${tag}] summary for the upload`, (await page.getByTestId("syntx-summary").getAttribute("data-summary-for")) === UPLOAD);
  await settled(page); await shot(page, `${tag}-Q-01-field`); await audit(page, "Q-01");

  // 3. ORGANIZATION → ROLE (the first delivered role with a scored match, else the first delivered)
  const roleMatch = roles.find((r) => r.matched.length > 0) ?? roles[0];
  const mappedRole = mapping.roles.find((r) => r.poolRoleId === roleMatch.poolRoleId);
  const orgId = mappedRole.poolOrganizationId;
  const region = page.getByTestId(`syntx-organization-${orgId}`);
  await region.click({ position: await bottomOf(region) }); await waitKind(page, "ORGANIZATION");
  check(`[${tag}] ORGANIZATION: selected region, others receded, URL`, (await region.getAttribute("data-sign-state")) === "organization_selected" && (await page.locator('[data-testid^="syntx-organization-"][data-sign-state="receded"]').count()) === mapping.organizations.length - 1 && new URL(page.url()).searchParams.get("jobOrganizationId") === orgId);
  await settled(page); await shot(page, `${tag}-Q-02-organization`); await audit(page, "Q-02");
  await page.getByTestId(`syntx-role-${roleMatch.poolRoleId}`).click(); await waitKind(page, "ROLE");
  const supportOf = (id) => roleMatch.matched.some((i) => i.poolRequirementId === id) ? "SUPPORTED" : roleMatch.weakEvidence.some((i) => i.poolRequirementId === id) ? "WEAK" : (roleMatch.missing.find((i) => i.poolRequirementId === id)?.sweepProposal ? "SWEEP_ONLY" : "OPEN");
  const tracesOf = (id) => { const scored = roleMatch.matched.find((i) => i.poolRequirementId === id) ?? roleMatch.weakEvidence.find((i) => i.poolRequirementId === id); const sw = [...roleMatch.matched, ...roleMatch.weakEvidence, ...roleMatch.missing].find((i) => i.poolRequirementId === id)?.sweepProposal; return (scored?.evidence.length ?? 0) + (sw?.evidence.length ?? 0); };
  let anchorsOk = true; const supports = {};
  for (const q of mappedRole.requirements) { const id = q.poolRequirementId; const outer = page.getByTestId(`syntx-requirement-${id}`); const s = supportOf(id); supports[s] = (supports[s] ?? 0) + 1; if ((await outer.getAttribute("data-support")) !== s || (await outer.getAttribute("data-evaluation-state")) !== "NOT_EVALUATED" || (await outer.getAttribute("data-trace-count")) !== String(tracesOf(id)) || (await page.locator(`[data-sign-id="req:${id}"]`).getAttribute("data-proof-trqrev-id")) !== q.targetRequirementRevisionId || ((s === "OPEN") !== ((await page.getByTestId(`syntx-open-${id}`).count()) === 1))) anchorsOk = false; }
  check(`[${tag}] ROLE: one anchor per TRQREV with support, NOT_EVALUATED, trace count and open boundary per body`, anchorsOk, JSON.stringify(supports));
  const expectedTraces = mappedRole.requirements.reduce((n, q) => n + tracesOf(q.poolRequirementId), 0);
  const dotted = [...roleMatch.matched, ...roleMatch.weakEvidence, ...roleMatch.missing].filter((i) => i.sweepProposal).reduce((n, i) => n + i.sweepProposal.evidence.length, 0);
  check(`[${tag}] ROLE: traces = delivered quotes`, (await page.locator('[data-testid^="syntx-trace-"]').count()) === expectedTraces && (await page.locator('[data-sign-manifestation="trace_dotted"]').count()) === dotted, `traces ${expectedTraces}, dotted ${dotted}`);
  const pending = page.getByTestId(`syntx-pending-${roleMatch.poolRoleId}`);
  check(`[${tag}] ROLE: one suspended boundary with TRPREV and every TRQREV`, (await pending.count()) === 1 && (await pending.getAttribute("data-proof-target-id")) === roleMatch.canonical.targetRoleProfileRevisionId && ((await pending.getAttribute("data-proof-trqrev-id")) ?? "").split(" ").join() === roleMatch.canonical.targetRequirementRevisionIds.join() && (await page.locator('[data-sign-relation="pending_evaluation"]').count()) === 1);
  const roleDocIds = [...new Set([...roleMatch.matched, ...roleMatch.weakEvidence].flatMap((i) => i.evidence.map((q) => q.docId)).concat([...roleMatch.matched, ...roleMatch.weakEvidence, ...roleMatch.missing].filter((i) => i.sweepProposal).flatMap((i) => i.sweepProposal.evidence.map((q) => q.docId))))];
  const sourceStates = {}; for (const d of roleDocIds) sourceStates[d] = await page.getByTestId(`syntx-source-${d}`).getAttribute("data-source-title-state");
  check(`[${tag}] ROLE: one source carrier per docId, title state = join`, roleDocIds.every((d) => sourceStates[d] === (documents.some((x) => x.docId === d) ? "RESOLVED" : "UNRESOLVED")), JSON.stringify(sourceStates));
  check(`[${tag}] ROLE: no number, no quote before inspection`, !PERCENT.test(await stageText(page)) && (await page.getByTestId("syntx-aperture").count()) === 0);
  await settled(page); await shot(page, `${tag}-Q-03-role`); await audit(page, "Q-03");

  // 4. REQUIREMENT + apertures (matched, sweep if delivered, pending)
  const supportedId = mappedRole.requirements.map((q) => q.poolRequirementId).find((id) => supportOf(id) === "SUPPORTED");
  if (supportedId) {
    await settled(page); await page.getByTestId(`syntx-requirement-${supportedId}`).click(); await waitKind(page, "REQUIREMENT");
    check(`[${tag}] REQUIREMENT: observation id, URL, camera 2.4, traces inspectable`, (await root(page).getAttribute("data-observation-id")) === supportedId && new URL(page.url()).searchParams.get("jobRequirementId") === supportedId && (await page.getByTestId("syntx-canvas").getAttribute("data-camera-scale")) === "2.4" && (await page.locator(`[data-sign-id^="trace:${supportedId}:"][data-sign-state="inspectable"]`).count()) === tracesOf(supportedId));
    const item = roleMatch.matched.find((i) => i.poolRequirementId === supportedId); const quote = item.evidence[0];
    const trace = page.getByTestId(`syntx-trace-trace:${supportedId}:supports:${quote.docId}:0`);
    await settled(page); const p = await alongTrace(trace); check(`[${tag}] matched trace owns a pointer point (R7 pointer inspection; F-SX-2 if a co-terminal dotted trace owns it)`, p.owned, p.owned ? "" : `owner ${p.owner}`);
    if (p.owned) await page.mouse.click(p.x, p.y); else await inspectByKeyboard(page, trace);
    await page.locator('[data-testid="syntx-field"][data-aperture-open="true"]').waitFor({ timeout: 10_000 });
    const ap = page.getByTestId("syntx-aperture");
    const srcState = await page.getByTestId("syntx-aperture-source").getAttribute("data-source-title-state");
    const doc = documents.find((d) => d.docId === quote.docId);
    check(`[${tag}] matched aperture: for the trace, quote verbatim, source state by join, authority NONE`, (await ap.getAttribute("data-aperture-for")) === (await trace.getAttribute("data-sign-id")) && ((await page.getByTestId("syntx-aperture-quote").textContent()) ?? "").includes(quote.quote) && srcState === (doc ? "RESOLVED" : "UNRESOLVED") && (!doc || ((await page.getByTestId("syntx-aperture-source").textContent()) ?? "").includes(doc.title)) && ((await page.getByTestId("syntx-aperture-authority").textContent()) ?? "").toLowerCase().includes("authority none"), `source ${srcState}`);
    check(`[${tag}] matched aperture: contribution as delivered, no sweep status`, ((await page.getByTestId("syntx-aperture-contribution").textContent()) ?? "").includes(String(item.contribution)) && (await page.getByTestId("syntx-aperture-sweep-status").count()) === 0);
    check(`[${tag}] REQUIREMENT: the inspected trace's source carrier is inside the viewport (O-SX-4)`, await inViewport(page.getByTestId(`syntx-source-${quote.docId}`)), `viewport ${JSON.stringify(page.viewportSize())}`);
    check(`[${tag}] observation stays REQUIREMENT, aperture not in the URL`, (await root(page).getAttribute("data-observation-kind")) === "REQUIREMENT" && ![...new URL(page.url()).searchParams.keys()].some((k) => /aperture|sign/i.test(k)));
    await settled(page); await shot(page, `${tag}-Q-04-matched`); await audit(page, "Q-04-matched");
    await page.keyboard.press("Escape"); await page.locator('[data-testid="syntx-field"][data-aperture-open="false"]').waitFor({ timeout: 10_000 });
    await page.keyboard.press("Escape"); await waitKind(page, "ROLE");
  } else check(`[${tag}] matched aperture walk`, true, "skipped: no SUPPORTED requirement delivered for this role (data condition, not a field defect)");
  if (dotted > 0) {
    const covered = [...roleMatch.matched, ...roleMatch.weakEvidence, ...roleMatch.missing].find((i) => i.sweepProposal); const q = covered.sweepProposal.evidence[0];
    const dt = page.getByTestId(`syntx-trace-trace:${covered.poolRequirementId}:covers_unscored:${q.docId}:0`);
    const joined = proposalEvidence.find((e) => e.capabilityProposalId === covered.sweepProposal.capabilityProposalId && e.docId === q.docId && e.quote === q.quote) ?? null;
    check(`[${tag}] sweep trace: PCAP proof, EVD only on the exact join`, (await dt.getAttribute("data-proof-capability-id")) === covered.sweepProposal.capabilityProposalId && (await dt.getAttribute("data-proof-evidence-id")) === (joined ? joined.evidenceId : null), `evd ${joined ? joined.evidenceId : "none"}`);
    await settled(page); const p = await alongTrace(dt); check(`[${tag}] sweep trace owns a pointer point`, p.owned, p.owned ? "" : `owner ${p.owner}`);
    if (p.owned) await page.mouse.click(p.x, p.y); else await inspectByKeyboard(page, dt);
    await page.locator('[data-testid="syntx-field"][data-aperture-open="true"]').waitFor({ timeout: 10_000 });
    const text = (await page.getByTestId("syntx-aperture").textContent()) ?? "";
    check(`[${tag}] sweep aperture: unscored status, R5 text, no contribution, no number`, (await page.getByTestId("syntx-aperture-sweep-status").getAttribute("data-scored")) === "false" && text.includes("A capability sweep proposal covers this requirement with a source-verified quote; it is not scored and not canonically evaluated.") && (await page.getByTestId("syntx-aperture-contribution").count()) === 0 && !PERCENT.test(text) && text.includes(q.quote));
    await settled(page); await shot(page, `${tag}-Q-04-sweep`);
    await page.keyboard.press("Escape"); await page.locator('[data-testid="syntx-field"][data-aperture-open="false"]').waitFor({ timeout: 10_000 });
    await page.keyboard.press("Escape"); await waitKind(page, "ROLE");
  } else check(`[${tag}] sweep traces`, true, "none delivered for this analysis (BOUNDARY-MATCH B-JP-GEMINI-FIXTURE if seeded)");
  await settled(page); await pending.click({ position: await topOf(pending) });
  await page.locator('[data-testid="syntx-field"][data-observation-kind="ROLE"][data-aperture-open="true"]').waitFor({ timeout: 10_000 });
  check(`[${tag}] pending aperture: text, TRPREV, resonance = body, rank, no recommendation`, ((await page.getByTestId("syntx-aperture-pending-text").textContent()) ?? "") === "Authoritative evaluation has not occurred for this relation." && ((await page.getByTestId("syntx-aperture").textContent()) ?? "").includes(roleMatch.canonical.targetRoleProfileRevisionId) && (await page.getByTestId("syntx-aperture-resonance").getAttribute("data-resonance-score")) === String(roleMatch.resonanceScore) && ((await page.getByTestId("syntx-aperture").textContent()) ?? "").includes(`#${roles.indexOf(roleMatch) + 1}`) && !/recommended|verified capability|chosen/i.test(((await page.getByTestId("syntx-aperture").textContent()) ?? "").replace(/not an hr recommendation/i, "")));
  await settled(page); await shot(page, `${tag}-Q-04-pending`); await audit(page, "Q-04-pending");

  // 5. RETURN: Escape chain from the keyboard with focus follow (B-SYNTX-FOCUS), then the path; sign sets restored.
  await page.keyboard.press("Escape"); await page.locator('[data-testid="syntx-field"][data-aperture-open="false"]').waitFor({ timeout: 10_000 });
  await pending.focus(); await page.keyboard.press("Escape"); await waitKind(page, "ORGANIZATION");
  const focusAfter = await page.evaluate(() => { const a = document.activeElement; const r = document.querySelector('[data-testid="syntx-field"]'); return r && a && r.contains(a) ? (a.getAttribute("data-sign-id") ?? a.getAttribute("data-testid") ?? a.tagName) : "outside"; });
  check(`[${tag}] RETURN: focus follows the observation point after the ecology unmounts`, focusAfter === `org:${orgId}`, focusAfter);
  await page.keyboard.press("Escape"); await waitKind(page, "FIELD");
  check(`[${tag}] RETURN: FIELD restored (camera 1, nothing receded, URL clean)`, (await page.getByTestId("syntx-canvas").getAttribute("data-camera-scale")) === "1" && (await page.locator('[data-sign-state="receded"]').count()) === 0 && [...new URL(page.url()).searchParams.keys()].sort().join() === "analysisId,focus,jobPoolUploadId");
  const fieldAgain = await collectSigns(page); const fieldFirst = JSON.parse(readFileSync(resolve(OUT, `${tag}-Q-01-signs.json`), "utf8"));
  check(`[${tag}] RETURN: FIELD sign set identical to the first FIELD read`, JSON.stringify(fieldAgain.map((s) => [s.id, s.state, s.proof])) === JSON.stringify(fieldFirst.map((s) => [s.id, s.state, s.proof])));
  await page.close();

  // 6. Reduced motion at ROLE: same signs, nothing running.
  const calm = await newPage(true);
  await calm.goto(`${BASE}/career/demo?focus=FIELD&analysisId=${analysisId}&jobPoolUploadId=${UPLOAD}&jobRoleId=${roleMatch.poolRoleId}`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await dismissOnboarding(calm);
  await calm.locator('[data-testid="syntx-field"][data-field-state="AVAILABLE"][data-sources-state="AVAILABLE"][data-observation-kind="ROLE"][data-motion-mode="REDUCED"]').waitFor({ timeout: 120_000 });
  await calm.waitForTimeout(400);
  const reduced = await root(calm).evaluate((r) => ({ running: r.getAnimations({ subtree: true }).filter((a) => a.playState === "running").length, root: getComputedStyle(r).animationName, camera: getComputedStyle(r.querySelector("[data-sx-camera]")).transitionDuration }));
  const calmSigns = await collectSigns(calm); const roleSigns = JSON.parse(readFileSync(resolve(OUT, `${tag}-Q-03-signs.json`), "utf8"));
  check(`[${tag}] REDUCED: nothing running, same ROLE signs`, reduced.running === 0 && reduced.root === "none" && reduced.camera === "0s" && JSON.stringify(calmSigns.map((s) => [s.id, s.relation, s.manifestation, s.proof])) === JSON.stringify(roleSigns.map((s) => [s.id, s.relation, s.manifestation, s.proof])), JSON.stringify(reduced));
  await shot(calm, `${tag}-Q-06-reduced`); await calm.close();

  // 7. Bodies unchanged (the legacy recommendations.generatedAt request stamp excluded).
  const m2 = await get(`/api/career/job-pools/${UPLOAD}/matches?analysisId=${analysisId}`); const a2 = await get(`/api/career/analyses/${analysisId}`); const v2 = await get(`/api/career/job-pools/${UPLOAD}`);
  const strip = (b) => JSON.stringify({ ...b, recommendations: b?.recommendations ? { ...b.recommendations, generatedAt: null } : b?.recommendations });
  check(`[${tag}] bodies identical before and after`, m2.text === m.text && v2.text === viewRes.text && strip(a2.body) === strip(a.body));
  } catch (error) {
    check(`[${tag}] walk completed without exception`, false, String(error?.message ?? error).split("\n")[0]);
    for (const ctx of browser.contexts()) await ctx.close().catch(() => {});
  }
}

await browser.close();
check("page issued GET only", nonGet.length === 0, nonGet.join(" | "));
writeFileSync(resolve(OUT, "report.json"), JSON.stringify({ base: BASE, upload: UPLOAD, analyses, recordedAt: new Date().toISOString(), failures, results }, null, 2) + "\n");
const manifest = readdirSync(OUT).filter((n) => n !== "manifest.sha256").sort().map((n) => `${sha256(readFileSync(resolve(OUT, n)))}  ${n}`).join("\n");
writeFileSync(resolve(OUT, "manifest.sha256"), manifest + "\n");
console.log(`\n${results.length - failures}/${results.length} checks ok · non-GET requests: ${nonGet.length} · evidence ${OUT}`);
process.exit(failures === 0 ? 0 : 1);
