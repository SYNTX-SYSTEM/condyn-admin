/**
 * PINK Q-12: the running browser walk of the SYNTX semiontic field (owner mandate "SFE — SYNTX SEMIONTIC FIELD
 * RECONSTRUCTION", 2026-10-11; spec §5 states A–E, GELB binding table §2/§3 and rulings R1–R14; GRÜN's DOM contract
 * `JOB_FIELD_FRONTEND.md` §13 = PINK's BR-1 … BR-5). Acceptance plan `docs/acceptance/CONDYN_SYSTEM_ACCEPTANCE_TEST_PLAN_v1.9.md`
 * suite TS-Q: this file binds Q-01 … Q-11 at their observation points and is the gate for the owner environment.
 *
 * Oracle: the GET bodies of the same server (upload view, matches, analysis) saved as Q-00-*.json before any browser
 * step, and the disposable database behind it (every TRQREV named by the suspended boundary resolves there). Everything
 * rendered is compared against those bodies through the `data-sign-*` / `data-proof-*` attributes, never through CSS
 * or copy, except where a scenario tests the §12 texts verbatim.
 *
 * Read-only: the page may issue GET requests only; every non-GET request during the walk fails Q-05. The bodies are
 * byte-identical before and after the walk.
 *
 * Real `next dev --webpack` on a disposable PostgreSQL database (GRÜN's world fixture) with PINK's pool and analysis
 * fixtures; Chromium through CONDYN_PLAYWRIGHT_MODULE (or the package when installed), skipped with a reason otherwise.
 * The seeded analysis carries no capability sweep (`capabilitySweep.state = NOT_PRODUCED`): sweep traces
 * (`covers_unscored` / `trace_dotted`) are asserted absent here and bound by `live-browser-workflow.e2e.test.ts` when a key is present.
 */
import { spawn, type ChildProcess } from "node:child_process";
import { createHash } from "node:crypto";
import { once } from "node:events";
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createJob } from "../../lib/career/orchestration/job";
import { JobRepository } from "../../lib/career/orchestration/job-repository";
import { PostgresCareerAnalysisRepository } from "../../lib/career/repositories/postgres";
import { createJobPoolPostgresWorld, type JobPoolWorld } from "../career/job-pool/fixtures/job-pool-postgres-world";
import { careerChainRepositories } from "../decision-integration/fixtures/postgres-career-chain";
import { buildVerifiedAnalysis } from "./fixtures/analysis";
import { draftPool, validationPool } from "./fixtures/pool";

function resolvePlaywright(): string | null {
  const explicit = process.env.CONDYN_PLAYWRIGHT_MODULE;
  if (explicit !== undefined && explicit.length > 0) return explicit;
  try { return createRequire(resolve(process.cwd(), "package.json")).resolve("playwright"); } catch { return null; }
}
const playwrightModule = resolvePlaywright();
// The tip under test names the evidence directory and the report (SYNTX_WALK_TIP=<hash>; default = the plan's tip).
const WALK_TIP = process.env.SYNTX_WALK_TIP ?? "9e86d44";
const EVIDENCE_DIR = resolve(process.cwd(), `docs/architecture/decision-fields/evidence/syntx-walk-${WALK_TIP}`);
const ANALYSIS_ID = "ANL_PINK_SYNTX_WALK";
const GRAMMAR = "SYNTX_FIELD_V1";
const ROLE_ID = "role_pink_alpha_architect";
const ORG_ID = "org_pink_alpha";

/** Spec §14.3 enums as the binding produces them (binding §2; a value outside these sets is a defect, R1/GELB condition b). */
const ENUMS = {
  source: ["canonical_entity", "matching_contribution", "gemini_sweep", "evidence", "evaluation_state"],
  relation: ["contains", "requires", "supports", "weakly_supports", "covers_unscored", "missing_support", "pending_evaluation"],
  state: ["field", "organization_selected", "role_selected", "requirement_selected", "receded", "inspectable"],
  manifestation: ["carrier", "region", "anchor", "trace_stable", "trace_thin", "trace_dotted", "open_boundary", "suspended_boundary", "temporary_aperture"],
  interaction: ["select", "inspect", "return", "none"],
  transition: ["recenter", "unfold", "recede", "trace_rise", "boundary_suspend", "restore"]
} as const;
const PROOF_ATTRIBUTES = ["upload-id", "organization-id", "role-id", "requirement-id", "target-id", "trqrev-id", "analysis-id", "capability-id", "doc-id", "evidence-id"] as const;
/** BR-5: retired ids and attributes of the LENS_V1 / POOL_FIELD_V1 / GALAXY_V1 grammars; none may exist (R11). */
const RETIRED_SELECTORS = [
  '[data-testid^="job-field"]', '[data-testid="job-pool-panel"]', '[data-testid="job-pool-orbit"]', '[data-testid^="job-pool-structure-"]', '[data-testid="job-pool-core"]',
  '[data-testid^="job-pool-nebula-"]', '[data-testid="job-pool-role-list"]', '[data-testid^="job-pool-role-lens-"]', '[data-testid^="job-pool-role-"]', '[data-testid^="job-pool-trqrev-"]',
  '[data-testid="job-pool-matched-constituent"]', '[data-testid="job-pool-evidence-quote"]', '[data-testid="job-pool-selected"]', '[data-testid="job-pool-selection-none"]',
  '[data-testid^="job-pool-view-"]', '[data-testid^="job-pool-matches-"]', '[data-testid^="job-pool-matching-details"]', '[data-testid="job-pool-organizations"]',
  '[data-testid^="job-pool-organization-"]', '[data-testid="job-pool-layer-c-toggle"]', '[data-testid="job-pool-enter-job-field"]', '[data-testid="job-pool-panel-collapse"]',
  '[data-testid="job-pool-list-state"]', '[data-testid^="job-pool-analysis"]', '[data-testid="field-focus-job-btn"]', '[data-field-focus="JOB"]', '[data-field-focus="POOL"]',
  '[data-field-grammar="POOL_FIELD_V1"]', '[data-field-grammar="LENS_V1"]', '[data-interaction-grammar]', '[data-focus-level]', '[data-galaxy-grammar]', '[data-motion-grammar]', '[data-structure-role]', '[data-upload-count]', '[data-at-core]'
];
/** Binding §3 / spec §11: words that would name an unsupported sign (closure, seal, recommendation, failure family). */
const UNSUPPORTED_WORDS = /checkmark|✓|✔|medal|badge|\bseal(ed)?\b|recommended|recommendation|verified capability|capability verified|fit score|good fit|acquire capability|capabilityGaps|nextActions|market saturation|temporal drift|contradiction|\bfail(ed|ure)?\b|incompeten|disqualif|not qualified|closed|complete(d)?\b/i;
const PROOF_ID_TEXT = /CAP_[A-Z0-9_]+|PCAP_[A-Z0-9_]+|TRQREV_[A-Z0-9]+|TRPREV_[A-Z0-9]+|TOENT_[A-Z0-9]+|TROB_[A-Z0-9]+|DOC_[0-9]+|ANL_[A-Z0-9_]+|JPOOL_[0-9A-F]+|EVD_[A-Z0-9_]+/;
const PERCENT = /\d+(\.\d+)?\s?%/;

let world: JobPoolWorld;
let server: ChildProcess | undefined;
let port = 0;
let serverOutput = "";
const base = () => `http://127.0.0.1:${port}`;
const delay = (ms: number) => new Promise<void>((done) => setTimeout(done, ms));
const squash = (text: string | null | undefined) => (text ?? "").replace(/\s+/g, "");
const sha256 = (buffer: Buffer | string) => createHash("sha256").update(buffer).digest("hex");

async function availablePort(): Promise<number> {
  const listener = createServer();
  await new Promise<void>((ok, fail) => { listener.once("error", fail); listener.listen(0, "127.0.0.1", () => ok()); });
  const address = listener.address();
  if (address === null || typeof address === "string") throw new Error("no port");
  await new Promise<void>((ok, fail) => listener.close((error) => (error ? fail(error) : ok())));
  return address.port;
}

interface SignRecord { testId: string | null; id: string; source: string; relation: string; state: string; manifestation: string; interaction: string; transition: string; proof: Record<string, string> }
interface Report { tip: string; recordedAt: string; database: string; analysisId: string; jobPoolUploadId: string; scenarios: Record<string, { verdict: "PASS" | "BOUNDARY-MATCH" | "FAIL"; finding?: string; note?: string; counts?: Record<string, number> }> }

describe.skipIf(playwrightModule === null)("PINK Q-12: SYNTX field walk FIELD → ORGANIZATION → ROLE → REQUIREMENT → EVIDENCE → RETURN against PINK's fixtures", () => {
  let browser: any;
  const pageErrors: string[] = [];
  let uploadId = "";
  let draftId = "";
  let view: any;
  let matches: any;
  let analysisBody: any;
  let roleMatch: any;
  let mappedRole: any;
  const report: Report = { tip: WALK_TIP, recordedAt: new Date().toISOString(), database: "", analysisId: ANALYSIS_ID, jobPoolUploadId: "", scenarios: {} };
  const pass = (id: string, counts?: Record<string, number>, note?: string) => { report.scenarios[id] = { verdict: "PASS", ...(counts ? { counts } : {}), ...(note ? { note } : {}) }; };
  const boundary = (id: string, note: string) => { report.scenarios[id] = { verdict: "BOUNDARY-MATCH", note }; };
  const liveSigns: Record<string, SignRecord[]> = {};

  async function open(path: string, options: { reducedMotion?: "reduce" | "no-preference" } = {}) {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, ...options });
    page.on("pageerror", (error: unknown) => pageErrors.push(String(error)));
    const nonGet: string[] = [];
    page.on("request", (request: any) => { if (request.method() !== "GET") nonGet.push(`${request.method()} ${request.url()}`); });
    (page as any).__nonGet = nonGet;
    await page.goto(`${base()}${path}`, { waitUntil: "domcontentloaded", timeout: 120_000 });
    await page.getByTestId("guided-onboarding-overlay").waitFor({ timeout: 120_000 });
    await page.getByTestId("onboarding-close-btn").click();
    await page.getByTestId("guided-onboarding-overlay").waitFor({ state: "detached", timeout: 30_000 });
    return page;
  }
  const field = (page: any) => page.getByTestId("syntx-field");
  const params = (page: any) => new URL(page.url()).searchParams;
  /** Read a frame only once no entrance, recenter or rise animation runs (J-12: headless entrances may idle at time 0); the slow dash drift of the suspended boundary is permanent and excluded. */
  async function settled(page: any): Promise<void> {
    const deadline = Date.now() + 10_000;
    while (Date.now() < deadline) {
      const running = await field(page).evaluate((element: Element) => element.getAnimations({ subtree: true }).filter((animation: any) => animation.playState === "running" && !String(animation.animationName ?? "").startsWith("sxSuspend") && animation.effect?.getTiming?.().iterations !== Infinity).length);
      if (running === 0) break;
      await page.waitForTimeout(120);
    }
    await page.waitForTimeout(200);
  }
  const waitKind = (page: any, kind: string, extra = "") => page.locator(`[data-testid="syntx-field"][data-observation-kind="${kind}"]${extra}`).waitFor({ timeout: 15_000 });
  const bottomOf = (locator: any) => locator.evaluate((element: Element) => { const box = element.getBoundingClientRect(); return { x: box.width / 2, y: box.height - 6 }; });
  const topOf = (locator: any) => locator.evaluate((element: Element) => { const box = element.getBoundingClientRect(); return { x: box.width / 2, y: 5 }; });
  /**
   * A trace is clicked on its visible line (absolute viewport coordinates; the camera's CSS transform is not in
   * getScreenCTM) at the first point along it that the trace itself owns under `elementFromPoint`. With one source
   * document every trace of the ecology converges on the same carrier, and a receded trace rendered later sits on top of
   * the inspectable one near that end (O-SX-1, observed on 434ef49 / 3d50c0a): the walk therefore probes from the anchor side.
   */
  // A point the trace owns under the pointer: visible <line> (8cb4a50; client point from the bounding box) or <path>
  // (GRÜN's perceptual-closure delta, straight or bowed; client point via getPointAtLength and the screen CTM).
  const alongTrace = (locator: any, fractions: number[] = [0.3, 0.38, 0.46, 0.54, 0.62, 0.7, 0.78, 0.22]) => locator.evaluate((element: Element, fractions: number[]) => {
    const geo = element.querySelector("path:not([data-sx-hit]), line:not([data-sx-hit])") as SVGGeometryElement;
    let at: (fraction: number) => { x: number; y: number };
    if (geo.tagName.toLowerCase() === "path") {
      const total = geo.getTotalLength();
      const ctm = geo.getScreenCTM() as DOMMatrix;
      at = (fraction) => { const p = geo.getPointAtLength(total * fraction); const sp = new DOMPoint(p.x, p.y).matrixTransform(ctm); return { x: sp.x, y: sp.y }; };
    } else {
      const line = geo as SVGLineElement;
      const rect = line.getBoundingClientRect();
      const dx = line.x2.baseVal.value - line.x1.baseVal.value;
      const dy = line.y2.baseVal.value - line.y1.baseVal.value;
      const a = { x: dx >= 0 ? rect.left : rect.right, y: dy >= 0 ? rect.top : rect.bottom };
      const b = { x: dx >= 0 ? rect.right : rect.left, y: dy >= 0 ? rect.bottom : rect.top };
      at = (fraction) => ({ x: a.x + (b.x - a.x) * fraction, y: a.y + (b.y - a.y) * fraction });
    }
    for (const fraction of fractions) {
      const point = at(fraction);
      const hit = element.ownerDocument.elementFromPoint(point.x, point.y);
      if (hit !== null && element.contains(hit)) return { ...point, fraction, owned: true };
    }
    return { ...at(0.5), fraction: 0.5, owned: false };
  }, fractions);
  /** PROPOSAL (GRÜN semiotic transfer): satellites of a cosmos move on the shared orbital clock — a pointer acts on the current centre, where the satellite itself owns the pointer (elementFromPoint). */
  const pointAt = async (page: any, locator: any) => {
    const point = await locator.evaluate((element: Element) => { const box = element.getBoundingClientRect(); const x = box.left + box.width / 2; const y = box.top + box.height / 2; const hit = element.ownerDocument.elementFromPoint(x, y); return { x, y, owned: hit !== null && element.contains(hit) }; });
    expect(point.owned, "the satellite owns the pointer at its centre").toBe(true);
    await page.mouse.click(point.x, point.y);
  };
  /** R15a evidence ecology read (one frame): infinite animations by name with their host (carrier:<state> or the sign manifestation),
   * carrier bodies (data-orbital-motion-*), and per trace: quadratic arc, carrier end on the body, photon count. */
  const ecologyMotion = (page: any) => field(page).evaluate((root: Element) => {
    const infinite: Record<string, string[]> = {};
    for (const animation of root.getAnimations({ subtree: true }) as any[]) {
      if (animation.playState !== "running" || animation.effect?.getTiming?.().iterations !== Infinity) continue;
      const target = animation.effect?.target as Element | null;
      const carrier = target?.closest('[data-sign-manifestation="carrier"][data-testid^="syntx-source-"]');
      const host = carrier ? `carrier:${carrier.getAttribute("data-sign-state")}` : (target?.closest("[data-sign-id]")?.getAttribute("data-sign-manifestation") ?? "none");
      (infinite[String(animation.animationName ?? "")] ??= []).push(host);
    }
    const carriers = Array.from(root.querySelectorAll('[data-testid^="syntx-source-"]')).map((element) => { const body = element.querySelector("[data-sx-carrier-body]"); return { docId: (element.getAttribute("data-testid") ?? "").slice("syntx-source-".length), state: element.getAttribute("data-sign-state"), driver: body?.getAttribute("data-orbital-motion-driver") ?? null, x: Number(body?.getAttribute("data-orbital-motion-x")), y: Number(body?.getAttribute("data-orbital-motion-y")) }; });
    const traces = Array.from(root.querySelectorAll('[data-testid^="syntx-trace-"]')).map((element) => {
      const id = element.getAttribute("data-sign-id") ?? "";
      const d = element.querySelector("[data-sx-hit]")?.getAttribute("d") ?? "";
      const numbers = (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
      const end = { x: numbers[numbers.length - 2], y: numbers[numbers.length - 1] };
      const carrier = carriers.find((candidate) => id.includes(`:${candidate.docId}:`));
      return { id, quadratic: /^M -?[\d.]+ -?[\d.]+ Q -?[\d.]+ -?[\d.]+ -?[\d.]+ -?[\d.]+$/.test(d), coupled: carrier ? Math.hypot(end.x - carrier.x, end.y - carrier.y) < 0.05 : null, photons: element.querySelectorAll("[data-sx-photon]").length };
    });
    return { switch: root.getAttribute("data-sx-ambient") ?? "off", mode: root.getAttribute("data-motion-mode"), infinite, carriers, traces, photons: root.querySelectorAll("[data-sx-photon]").length };
  });
  /** Pointer ownership of every trace in the tab order (one frame each). */
  const everyTraceOwned = async (page: any) => {
    const ids: string[] = await field(page).evaluate((root: Element) => Array.from(root.querySelectorAll('[data-testid^="syntx-trace-"][tabindex="0"]')).map((element) => element.getAttribute("data-testid") ?? ""));
    const out: { id: string; owned: boolean }[] = [];
    for (const id of ids) out.push({ id, owned: (await alongTrace(page.getByTestId(id))).owned });
    return out;
  };
  /** Every rendered visual sign with its sign and proof attributes (BR-2). */
  const collectSigns = (page: any): Promise<SignRecord[]> => field(page).evaluate((root: Element) => Array.from(root.querySelectorAll("[data-sign-id]")).map((element) => {
    const proof: Record<string, string> = {};
    for (const attribute of Array.from(element.attributes)) if (attribute.name.startsWith("data-proof-")) proof[attribute.name.slice("data-proof-".length)] = attribute.value;
    return { testId: element.getAttribute("data-testid"), id: element.getAttribute("data-sign-id") ?? "", source: element.getAttribute("data-sign-source") ?? "", relation: element.getAttribute("data-sign-relation") ?? "", state: element.getAttribute("data-sign-state") ?? "", manifestation: element.getAttribute("data-sign-manifestation") ?? "", interaction: element.getAttribute("data-sign-interaction") ?? "", transition: element.getAttribute("data-sign-transition") ?? "", proof };
  }));
  const stageText = async (page: any) => (await page.getByTestId("syntx-stage").textContent()) ?? "";
  const summaryText = async (page: any) => (await page.getByTestId("syntx-summary").textContent()) ?? "";
  const supportOf = (requirementId: string): "SUPPORTED" | "WEAK" | "SWEEP_ONLY" | "OPEN" => roleMatch.matched.some((item: any) => item.poolRequirementId === requirementId) ? "SUPPORTED" : roleMatch.weakEvidence.some((item: any) => item.poolRequirementId === requirementId) ? "WEAK" : roleMatch.missing.find((item: any) => item.poolRequirementId === requirementId)!.sweepProposal !== null ? "SWEEP_ONLY" : "OPEN";
  const expectedTracesOf = (requirementId: string) => {
    const scored = roleMatch.matched.find((item: any) => item.poolRequirementId === requirementId) ?? roleMatch.weakEvidence.find((item: any) => item.poolRequirementId === requirementId) ?? null;
    const sweep = [...roleMatch.matched, ...roleMatch.weakEvidence, ...roleMatch.missing].find((item: any) => item.poolRequirementId === requirementId)?.sweepProposal ?? null;
    return (scored?.evidence.length ?? 0) + (sweep?.evidence.length ?? 0);
  };

  /** Q-10 at one observation point: enums, identity, proof resolution against the bodies, no closure, no proof id as text, pending once per ecology. */
  async function auditSigns(page: any, label: string): Promise<SignRecord[]> {
    const signs = await collectSigns(page);
    expect(signs.length).toBeGreaterThan(0);
    expect(new Set(signs.map((sign) => sign.id)).size).toBe(signs.length);
    expect(Number(await field(page).getAttribute("data-sign-count"))).toBe(signs.length);
    const requirementIds = new Set<string>(view.canonicalMapping.roles.flatMap((role: any) => role.requirements.map((requirement: any) => requirement.poolRequirementId)));
    const trqrevIds = new Set<string>(view.canonicalMapping.roles.flatMap((role: any) => role.requirements.map((requirement: any) => requirement.targetRequirementRevisionId)));
    const targetIds = new Set<string>([...view.canonicalMapping.organizations.map((organization: any) => organization.targetOrganizationEntityId), ...view.canonicalMapping.roles.map((role: any) => role.targetRoleOrganizationBindingRevisionId), ...matches.roleMatches.map((role: any) => role.canonical.targetRoleProfileRevisionId)]);
    const capabilityIds = new Set<string>(matches.roleMatches.flatMap((role: any) => [...role.matched, ...role.weakEvidence].map((item: any) => item.matchedCapabilityEntityId).concat([...role.matched, ...role.weakEvidence, ...role.missing].filter((item: any) => item.sweepProposal !== null).map((item: any) => item.sweepProposal.capabilityProposalId))));
    const docIds = new Set<string>(matches.roleMatches.flatMap((role: any) => [...role.matched, ...role.weakEvidence].flatMap((item: any) => item.evidence.map((quote: any) => quote.docId)).concat([...role.matched, ...role.weakEvidence, ...role.missing].filter((item: any) => item.sweepProposal !== null).flatMap((item: any) => item.sweepProposal.evidence.map((quote: any) => quote.docId)))));
    const evidenceIds = new Set<string>(((analysisBody.capabilityProposalProjection?.capabilities ?? []) as any[]).flatMap((capability) => (capability.evidence ?? []).map((evidence: any) => evidence.evidenceId)));
    for (const sign of signs) {
      expect(ENUMS.source, `${label} ${sign.id} source`).toContain(sign.source);
      expect(ENUMS.relation, `${label} ${sign.id} relation`).toContain(sign.relation);
      expect(ENUMS.state, `${label} ${sign.id} state`).toContain(sign.state);
      expect(ENUMS.manifestation, `${label} ${sign.id} manifestation`).toContain(sign.manifestation);
      expect(ENUMS.interaction, `${label} ${sign.id} interaction`).toContain(sign.interaction);
      expect(ENUMS.transition, `${label} ${sign.id} transition`).toContain(sign.transition);
      expect(Object.keys(sign.proof).length, `${label} ${sign.id} carries a proof`).toBeGreaterThan(0);
      for (const [key, value] of Object.entries(sign.proof)) {
        expect(PROOF_ATTRIBUTES as readonly string[], `${label} ${sign.id} proof attribute ${key}`).toContain(key);
        expect(value.length).toBeGreaterThan(0);
        if (key === "upload-id") expect(value).toBe(uploadId);
        if (key === "organization-id") expect(view.canonicalMapping.organizations.map((organization: any) => organization.poolOrganizationId)).toContain(value);
        if (key === "role-id") expect(view.canonicalMapping.roles.map((role: any) => role.poolRoleId)).toContain(value);
        if (key === "requirement-id") expect(requirementIds.has(value), `${label} ${sign.id} requirement ${value}`).toBe(true);
        if (key === "target-id") expect(targetIds.has(value), `${label} ${sign.id} target ${value}`).toBe(true);
        if (key === "trqrev-id") for (const id of value.split(" ")) expect(trqrevIds.has(id), `${label} ${sign.id} TRQREV ${id}`).toBe(true);
        if (key === "analysis-id") expect(value).toBe(ANALYSIS_ID);
        if (key === "capability-id") expect(capabilityIds.has(value), `${label} ${sign.id} capability ${value}`).toBe(true);
        if (key === "doc-id") expect(docIds.has(value), `${label} ${sign.id} doc ${value}`).toBe(true);
        if (key === "evidence-id") expect(evidenceIds.has(value), `${label} ${sign.id} evidence ${value}`).toBe(true);
      }
    }
    // R1 / B-SYNTX-CLOSURE and R2: no closure manifestation exists; at most one suspended boundary per ecology.
    // The aperture inherits the relation of the sign it inspects (BR-3) and is not a second boundary: count boundaries only.
    const pendingBoundaries = signs.filter((sign) => sign.relation === "pending_evaluation" && sign.manifestation !== "temporary_aperture");
    expect(pendingBoundaries.length).toBeLessThanOrEqual(1);
    expect(signs.filter((sign) => sign.manifestation === "temporary_aperture").length).toBeLessThanOrEqual(1);
    const anchors = signs.filter((sign) => sign.manifestation === "anchor");
    if (anchors.length > 0 && (await page.locator('[data-testid^="syntx-requirement-"][data-evaluation-state="NOT_EVALUATED"]').count()) > 0) expect(pendingBoundaries.length).toBe(1);
    // GELB condition (a): proof values are attributes only; the stage carries no id as text outside an open aperture.
    const apertureOpen = (await field(page).getAttribute("data-aperture-open")) === "true";
    const text = apertureOpen ? await field(page).evaluate((root: Element) => Array.from(root.querySelectorAll('[data-testid="syntx-canvas"]')).map((element) => element.textContent ?? "").join(" ")) : await stageText(page);
    expect(text, `${label}: proof ids never as default-state text`).not.toMatch(PROOF_ID_TEXT);
    writeFileSync(resolve(EVIDENCE_DIR, `${label}-signs.json`), `${JSON.stringify(signs, null, 2)}\n`);
    return signs;
  }

  /** Q-07: the unsupported list (binding §3) and the authority grammar (spec §11) at one observation point. */
  async function auditUnsupported(page: any, label: string): Promise<void> {
    const html: string = await field(page).evaluate((root: Element) => root.innerHTML);
    const visible: string = await field(page).evaluate((root: Element) => (root as HTMLElement).innerText ?? root.textContent ?? "");
    const scrubbed = visible.replace(/source-match verified/gi, "").replace(/SOURCE_MATCH_VERIFIED/g, "").replace(/MISSING != GAP DECISION/g, "").replace(/not a canonical evaluation/gi, "").replace(/not an hr recommendation/gi, "").replace(/RANKED != RECOMMENDED/g, "");
    expect(scrubbed, `${label}: no unsupported sign wording`).not.toMatch(UNSUPPORTED_WORDS);
    expect(html).not.toMatch(/\b(RRL|TSN|EIS|RCP)_[A-Z0-9]/);
    expect(html).not.toMatch(/data-sign-manifestation="(closed|closure|sealed|verified)[^"]*"/);
    // Binding §1: the legacy role catalogue of the analysis body is not an input; none of its names is rendered.
    for (const legacyRole of (analysisBody.matching?.role_matches ?? []) as any[]) {
      const name = String(legacyRole.role_title ?? legacyRole.title ?? legacyRole.name ?? "");
      if (name.length > 0 && !validationPool.roles.some((role) => role.title === name)) expect(visible).not.toContain(name);
    }
    for (const organization of matches.organizationMatches as any[]) if (typeof organization.aggregateScore === "number" && organization.aggregateScore > 0) expect(visible).not.toContain(String(organization.aggregateScore));
    expect(await page.locator('[data-resonance-score]').count()).toBe((await field(page).getAttribute("data-aperture-open")) === "true" && (await page.getByTestId("syntx-aperture-resonance").count()) === 1 ? 1 : 0);
    writeFileSync(resolve(EVIDENCE_DIR, `${label}-audit.txt`), `${label}\nvisible text:\n${visible}\n`);
  }

  beforeAll(async () => {
    world = await createJobPoolPostgresWorld();
    report.database = world.databaseName;
    await new PostgresCareerAnalysisRepository(drizzle(world.sql)).save(buildVerifiedAnalysis(ANALYSIS_ID));
    port = await availablePort();
    server = spawn(process.execPath, [resolve(process.cwd(), "node_modules/next/dist/bin/next"), "dev", "--webpack", "-p", String(port), "-H", "127.0.0.1"], {
      cwd: process.cwd(), env: { ...process.env, DATABASE_URL: world.databaseUrl, NEXT_TELEMETRY_DISABLED: "1" }, stdio: ["ignore", "pipe", "pipe"]
    });
    server.stdout?.on("data", (chunk) => { serverOutput += String(chunk); });
    server.stderr?.on("data", (chunk) => { serverOutput += String(chunk); });
    for (let attempt = 0; attempt < 160; attempt += 1) {
      try { const response = await fetch(`${base()}/api/career/job-pools`); if (response.status === 200) { await response.json(); break; } } catch { /* not ready */ }
      await delay(500);
      if (attempt === 159) throw new Error(`server not ready:\n${serverOutput}`);
    }
    const post = async (body: unknown) => (await fetch(`${base()}/api/career/job-pools`, { method: "POST", headers: { "content-type": "application/json", "x-condyn-principal-actor-id": "PINK_SYNTX_WALK" }, body: JSON.stringify(body) })).json();
    uploadId = (await post(validationPool)).jobPoolUploadId;
    // URL BOUNDARY CLOSURE (owner, 2026-10-15; GELB 26df225/d54c718, GRÜN da59568) and the /matches guard (GELB eacfc97): the analysis is
    // compared only within its persisted investigation boundary. The walk's analysis therefore carries its SUCCEEDED job (processor rule
    // JOB_ ↔ ANL_, result_analysis_id), declared PERSON_X_JOB for ROLE_ID of the validation pool; without it the boundary is
    // NOT_RECORDED and the field compares nothing (same fixture as the job-scope gate walk).
    await new JobRepository(drizzle(world.sql)).enqueueJob({ ...createJob("CAREER_ANALYSIS", { sourceType: "BATCH", sourceData: { documents: [{ type: "text", content: "PINK SYNTX walk fixture" }], investigation: { mode: "PERSON_X_JOB" }, jobScope: { jobPoolUploadId: uploadId, poolRoleId: ROLE_ID } } } as never), jobId: ANALYSIS_ID.replace("ANL_", "JOB_"), status: "SUCCEEDED", attemptCount: 1, resultAnalysisId: ANALYSIS_ID, completedAt: new Date().toISOString() });
    draftId = (await post(draftPool())).jobPoolUploadId;
    report.jobPoolUploadId = uploadId;
    mkdirSync(EVIDENCE_DIR, { recursive: true });
    // Q-00: the read surfaces of binding §1, saved before any browser step.
    view = await (await fetch(`${base()}/api/career/job-pools/${uploadId}`)).json();
    matches = await (await fetch(`${base()}/api/career/job-pools/${uploadId}/matches?analysisId=${ANALYSIS_ID}`)).json();
    analysisBody = await (await fetch(`${base()}/api/career/analyses/${ANALYSIS_ID}`)).json();
    writeFileSync(resolve(EVIDENCE_DIR, "Q-00-view.json"), `${JSON.stringify(view, null, 2)}\n`);
    writeFileSync(resolve(EVIDENCE_DIR, "Q-00-matches.json"), `${JSON.stringify(matches, null, 2)}\n`);
    writeFileSync(resolve(EVIDENCE_DIR, "Q-00-analysis.json"), `${JSON.stringify(analysisBody, null, 2)}\n`);
    roleMatch = matches.roleMatches.find((role: any) => role.poolRoleId === ROLE_ID);
    mappedRole = view.canonicalMapping.roles.find((role: any) => role.poolRoleId === ROLE_ID);
    const playwright = await import(playwrightModule as string);
    browser = await playwright.chromium.launch({ headless: true });
  }, 300_000);

  afterAll(async () => {
    if (browser) await browser.close();
    if (server && server.exitCode === null && server.signalCode === null) {
      server.kill("SIGTERM");
      await Promise.race([once(server, "exit"), delay(10_000)]);
      if (server.exitCode === null && server.signalCode === null) { server.kill("SIGKILL"); await once(server, "exit"); }
    }
    if (world) await world.destroy();
    if (Object.keys(report.scenarios).length > 0) {
      writeFileSync(resolve(EVIDENCE_DIR, "Q-12-report.json"), `${JSON.stringify(report, null, 2)}\n`);
      const manifest = readdirSync(EVIDENCE_DIR).filter((name) => name !== "manifest.sha256").sort().map((name) => `${sha256(readFileSync(resolve(EVIDENCE_DIR, name)))}  ${name}`).join("\n");
      writeFileSync(resolve(EVIDENCE_DIR, "manifest.sha256"), `${manifest}\n`);
    }
  }, 60_000);

  it("Q-01 … Q-05, Q-07 … Q-11: walks the path with the pool selected and the analysis present, every sign equal to the bodies, reversible and GET-only", async () => {
    expect(matches.capabilitySweep.state).toBe("NOT_PRODUCED");
    expect(roleMatch).toBeDefined();
    const page = await open(`/career/demo?focus=FIELD&analysisId=${ANALYSIS_ID}&jobPoolUploadId=${uploadId}`);
    await page.locator('[data-testid="syntx-field"][data-field-state="AVAILABLE"][data-sources-state="AVAILABLE"]').waitFor({ timeout: 120_000 });
    const root = field(page);

    // ---- Q-01 STATE A FIELD composition (spec §5 A, §8.2; table §2.1, R4, R13, R14) ----
    expect(await page.getByTestId("semantic-career-intelligence-field").getAttribute("data-field-focus")).toBe("FIELD");
    expect(await root.getAttribute("data-field-grammar")).toBe(GRAMMAR);
    expect(await root.getAttribute("data-observation-kind")).toBe("FIELD");
    expect(await root.getAttribute("data-observation-id")).toBe(uploadId);
    expect(await root.getAttribute("data-aperture-open")).toBe("false");
    expect(await root.getAttribute("data-motion-mode")).toBe("LIVE");
    expect(await root.getAttribute("data-analysis-id")).toBe(ANALYSIS_ID);
    expect(await root.getAttribute("data-pool-id")).toBe(uploadId);
    expect(await root.getAttribute("data-matching-delivered")).toBe("true");
    expect(await root.getAttribute("data-organization-count")).toBe(String(view.canonicalMapping.organizations.length));
    expect(await root.getAttribute("data-role-count")).toBe(String(view.canonicalMapping.roles.length));
    expect(await root.getAttribute("data-requirement-count")).toBe("0");
    expect(await root.getAttribute("data-pools-visible")).toBe("false");
    expect(await root.getAttribute("data-intake-visible")).toBe("false");
    expect(await page.getByTestId("job-pool-list").isVisible()).toBe(false);
    expect(await page.getByTestId("job-pool-upload").isVisible()).toBe(false);
    expect(await page.getByTestId("job-pool-matches").isVisible()).toBe(false);
    const pool = page.getByTestId("syntx-pool");
    expect(await pool.getAttribute("data-sign-source")).toBe("canonical_entity");
    expect(await pool.getAttribute("data-sign-relation")).toBe("contains");
    expect(await pool.getAttribute("data-sign-manifestation")).toBe("region");
    expect(await pool.getAttribute("data-sign-state")).toBe("field");
    expect(await pool.getAttribute("data-proof-upload-id")).toBe(uploadId);
    for (const organization of view.canonicalMapping.organizations as any[]) {
      const region = page.getByTestId(`syntx-organization-${organization.poolOrganizationId}`);
      expect(await region.count()).toBe(1);
      expect(await region.getAttribute("data-role-count")).toBe(String(validationPool.roles.filter((role) => role.organization_id === organization.poolOrganizationId).length));
      expect(await region.getAttribute("data-sign-manifestation")).toBe("region");
      expect(await region.getAttribute("data-sign-relation")).toBe("contains");
      expect(await region.getAttribute("data-sign-state")).toBe("field");
      expect(await region.getAttribute("data-sign-interaction")).toBe("select");
      expect(await region.getAttribute("data-proof-organization-id")).toBe(organization.poolOrganizationId);
      expect(await region.getAttribute("data-proof-target-id")).toBe(organization.targetOrganizationEntityId);
      expect(await region.getAttribute("role")).toBe("button");
      expect(await region.getAttribute("tabindex")).toBe("0");
      expect(squash(await region.textContent())).toContain(squash(organization.name));
    }
    for (const role of view.canonicalMapping.roles as any[]) {
      const carrier = page.getByTestId(`syntx-role-${role.poolRoleId}`);
      expect(await carrier.count()).toBe(1);
      expect(await carrier.getAttribute("data-sign-manifestation")).toBe("carrier");
      expect(await carrier.getAttribute("data-sign-state")).toBe("field");
      expect(await carrier.getAttribute("data-proof-role-id")).toBe(role.poolRoleId);
      expect(await carrier.getAttribute("data-proof-organization-id")).toBe(role.poolOrganizationId);
      expect(await carrier.getAttribute("data-proof-target-id")).toBe(role.targetRoleOrganizationBindingRevisionId);
      expect(await carrier.getAttribute("data-requirement-count")).toBe(String(role.requirements.length));
      expect(await carrier.getAttribute("data-matching-read")).toBe("true");
      // PROPOSAL (owner: organizations first): at JOB POOL a role is a moon of its organization — a sign with its proofs, not selectable, not a tab stop.
      expect(await carrier.getAttribute("data-manifestation-form")).toBe("moon");
      expect(await carrier.getAttribute("data-sign-interaction")).toBe("none");
      expect(await carrier.getAttribute("role")).toBeNull();
      expect(await carrier.getAttribute("tabindex")).toBe("-1");
      expect(squash(await carrier.textContent())).toContain(squash(role.title));
      const inside = await carrier.evaluate((element: Element) => {
        // Geometry read in screen space (bounding boxes), so group transforms, glow underlays and the camera do not matter.
        const region = element.ownerDocument.querySelector(`[data-testid="syntx-organization-${element.getAttribute("data-proof-organization-id")}"] circle:not([data-sx-glow]):not([data-sx-hit])`) as SVGCircleElement;
        const body = element.querySelector("circle:not([data-sx-glow]):not([data-sx-hit])") as SVGCircleElement;
        const centre = (circle: SVGCircleElement) => { const box = circle.getBoundingClientRect(); return { x: box.left + box.width / 2, y: box.top + box.height / 2, r: box.width / 2 }; };
        const r = centre(region), b = centre(body);
        return Math.hypot(b.x - r.x, b.y - r.y) < r.r;
      });
      expect(inside, `${role.poolRoleId} inside its region`).toBe(true);
    }
    // Carriers exist for roles with zero resonance or without requirements (table §2.1).
    expect(await page.getByTestId("syntx-role-role_pink_beta_empty").count()).toBe(1);
    // R4 / R13 / R14: no score, no rank placement, no nearest caption, no thread, no distance geometry at FIELD.
    expect(await stageText(page)).not.toMatch(PERCENT);
    expect(await page.locator('[data-resonance-score]').count()).toBe(0);
    expect(await page.getByTestId("syntx-ecology").count()).toBe(0);
    expect(await page.getByTestId("syntx-canvas").getAttribute("data-camera-scale")).toBe("1");
    expect(await page.getByTestId("syntx-canvas").getAttribute("data-depth")).toBe("0");
    for (const selector of RETIRED_SELECTORS) expect(await page.locator(selector).count(), `retired ${selector}`).toBe(0);
    expect(await page.getByTestId("field-focus-capability-btn").count()).toBe(1);
    expect(await page.getByTestId("job-pool-panel-toggle").getAttribute("data-field-focus-active")).toBe("true");
    expect(await page.getByTestId("syntx-summary").getAttribute("data-summary-for")).toBe(uploadId);
    expect(await page.getByTestId("syntx-summary").getAttribute("aria-live")).toBe("polite");
    expect(await summaryText(page)).toContain(`${view.canonicalMapping.organizations.length} organizations containing ${view.canonicalMapping.roles.length} roles`);
    expect(await summaryText(page)).toContain("A presentation matching was read for this pool.");
    expect((await page.getByTestId("job-pool-non-claims").textContent()) ?? "").toContain("COVERED != SCORED");
    // The boundary (labels, canonical mapping state, sweep state) is a folded edge aperture, never a panel.
    await page.getByTestId("syntx-boundary-toggle").click();
    await page.getByTestId("job-pool-matches").waitFor({ state: "visible", timeout: 10_000 });
    for (const label of ["DETERMINISTIC_PRESENTATION", "NOT_A_CANONICAL_EVALUATION", "NOT_A_DECISION"]) expect(await page.getByTestId(`job-pool-label-${label}`).count()).toBe(1);
    expect(await page.getByTestId("job-pool-ranking").getAttribute("data-ranking")).toBe("MONOTONE_BY_RESONANCE");
    expect(await page.locator('[data-testid="job-pool-canonical-mapping"][data-mapping-state="MAPPED"][data-proposal-state="PROPOSAL_ONLY"][data-authority-state="NONE"]').count()).toBe(1);
    expect(await page.getByTestId("job-pool-capability-sweep").getAttribute("data-sweep-state")).toBe("NOT_PRODUCED");
    expect(await page.getByTestId("job-pool-capability-sweep").getAttribute("data-scored")).toBe("false");
    await page.keyboard.press("Escape");
    await page.getByTestId("job-pool-matches").waitFor({ state: "hidden", timeout: 10_000 });
    expect(await root.getAttribute("data-observation-kind")).toBe("FIELD");
    for (const stage of ["01", "02", "03", "04", "05", "06"]) expect(await page.getByTestId(`focus-transition-stage-shell-${stage}`).count()).toBe(1);
    expect(await page.locator('[data-testid^="hr-decision-loop"]').count()).toBe(0);
    await settled(page);
    await page.screenshot({ path: resolve(EVIDENCE_DIR, "Q-01.png") });
    const fieldSigns = await auditSigns(page, "Q-01");
    await auditUnsupported(page, "Q-01");
    liveSigns.FIELD = fieldSigns;
    pass("Q-01", { signs: fieldSigns.length, organizations: view.canonicalMapping.organizations.length, roles: view.canonicalMapping.roles.length });

    // ---- Q-02 STATE B ORGANIZATION (spec §5 B; table §2.1, §3) ----
    const region = page.getByTestId(`syntx-organization-${ORG_ID}`);
    await region.click({ position: await bottomOf(region) });
    await waitKind(page, "ORGANIZATION");
    expect(await root.getAttribute("data-observation-id")).toBe(ORG_ID);
    expect(params(page).get("jobOrganizationId")).toBe(ORG_ID);
    expect(await region.getAttribute("data-sign-state")).toBe("organization_selected");
    expect(await region.getAttribute("data-sign-interaction")).toBe("return");
    expect(await region.getAttribute("data-sign-transition")).toBe("unfold");
    expect(await page.locator('[data-testid^="syntx-organization-"][data-sign-state="receded"]').count()).toBe(view.canonicalMapping.organizations.length - 1);
    expect(await page.locator('[data-testid^="syntx-organization-"]').count()).toBe(view.canonicalMapping.organizations.length);
    expect(await pool.getAttribute("data-sign-state")).toBe("receded");
    expect(await pool.getAttribute("data-sign-interaction")).toBe("return");
    for (const role of view.canonicalMapping.roles as any[]) {
      expect(await page.getByTestId(`syntx-role-${role.poolRoleId}`).getAttribute("data-sign-state")).toBe(role.poolOrganizationId === ORG_ID ? "field" : "receded");
      expect(await page.getByTestId(`syntx-role-${role.poolRoleId}`).getAttribute("data-proof-organization-id")).toBe(role.poolOrganizationId);
    }
    expect(Number(await page.getByTestId("syntx-canvas").getAttribute("data-camera-scale"))).toBeGreaterThan(1);
    expect(await page.getByTestId("syntx-canvas").getAttribute("data-depth")).toBe("1");
    expect(await page.getByTestId("syntx-path-ORGANIZATION").getAttribute("data-current")).toBe("true");
    expect(await page.getByTestId("syntx-return-btn").count()).toBe(1);
    expect(await page.getByTestId("syntx-summary").getAttribute("data-summary-for")).toBe(ORG_ID);
    expect(await summaryText(page)).toContain(`Organization ${validationPool.organizations.find((organization) => organization.id === ORG_ID)!.name} contains 1 role: ${validationPool.roles.find((role) => role.id === ROLE_ID)!.title}.`);
    expect(await stageText(page)).not.toMatch(PERCENT);
    expect(await page.locator('[data-sign-relation="contains"][data-sign-manifestation="carrier"][data-proof-role-id]').count()).toBe(view.canonicalMapping.roles.length);
    await settled(page);
    await page.screenshot({ path: resolve(EVIDENCE_DIR, "Q-02.png") });
    liveSigns.ORGANIZATION = await auditSigns(page, "Q-02");
    await auditUnsupported(page, "Q-02");
    pass("Q-02", { receded: view.canonicalMapping.organizations.length - 1 });

    // ---- Q-03 STATE C ROLE (spec §5 C, §9; table §2.2, §2.4, R2, R4, R6, R7, R14) ----
    await settled(page);
    await pointAt(page, page.getByTestId(`syntx-role-${ROLE_ID}`));
    await waitKind(page, "ROLE");
    expect(await root.getAttribute("data-observation-id")).toBe(ROLE_ID);
    expect(params(page).get("jobRoleId")).toBe(ROLE_ID);
    expect(params(page).get("jobOrganizationId")).toBe(ORG_ID);
    expect(await page.getByTestId(`syntx-role-${ROLE_ID}`).getAttribute("data-sign-state")).toBe("role_selected");
    expect(await page.locator('[data-testid^="syntx-role-"][data-sign-state="receded"]').count()).toBe(view.canonicalMapping.roles.length - 1);
    expect(await page.locator('[data-testid^="syntx-role-"][data-sign-state="receded"][tabindex="-1"]').count()).toBe(view.canonicalMapping.roles.length - 1);
    expect(await region.getAttribute("data-sign-state")).toBe("field");
    expect(await page.getByTestId("syntx-ecology").getAttribute("data-role-id")).toBe(ROLE_ID);
    // PROPOSAL: no zoom — the role cosmos is depth 2; the planetarium's focus anchor stays the organization's body at 1.12.
    expect(await page.getByTestId("syntx-canvas").getAttribute("data-depth")).toBe("2");
    expect(await page.getByTestId("syntx-canvas").getAttribute("data-camera-scale")).toBe("1.12");
    const requirementIds: string[] = mappedRole.requirements.map((requirement: any) => requirement.poolRequirementId);
    expect(await page.locator('[data-testid^="syntx-requirement-"]').count()).toBe(requirementIds.length);
    expect(await root.getAttribute("data-requirement-count")).toBe(String(requirementIds.length));
    const supports = new Set(requirementIds.map(supportOf));
    expect(supports.has("SUPPORTED") && supports.has("WEAK") && supports.has("OPEN"), "fixture covers supported, weak and open").toBe(true);
    for (const requirement of mappedRole.requirements as any[]) {
      const id = requirement.poolRequirementId;
      const outer = page.getByTestId(`syntx-requirement-${id}`);
      expect(await outer.getAttribute("data-support")).toBe(supportOf(id));
      expect(await outer.getAttribute("data-evaluation-state")).toBe("NOT_EVALUATED");
      expect(await outer.getAttribute("data-trace-count")).toBe(String(expectedTracesOf(id)));
      expect(squash(await outer.textContent())).toContain(squash(validationPool.requirements.find((item) => item.id === id)!.capability_name));
      const anchor = page.locator(`[data-sign-id="req:${id}"]`);
      expect(await anchor.count()).toBe(1);
      expect(await anchor.getAttribute("data-sign-source")).toBe("canonical_entity");
      expect(await anchor.getAttribute("data-sign-relation")).toBe("requires");
      expect(await anchor.getAttribute("data-sign-manifestation")).toBe("anchor");
      expect(await anchor.getAttribute("data-sign-state")).toBe("field");
      expect(await anchor.getAttribute("data-sign-interaction")).toBe("select");
      expect(await anchor.getAttribute("data-proof-requirement-id")).toBe(id);
      expect(await anchor.getAttribute("data-proof-role-id")).toBe(ROLE_ID);
      expect(await anchor.getAttribute("data-proof-trqrev-id")).toBe(requirement.targetRequirementRevisionId);
      expect(await anchor.getAttribute("role")).toBe("button");
      // Traces: exactly the delivered relations (R7 overlap preserved), proof = CAP_* + docId + analysisId, never a synthesised evidence id.
      const scored = roleMatch.matched.find((item: any) => item.poolRequirementId === id) ?? null;
      const weak = roleMatch.weakEvidence.find((item: any) => item.poolRequirementId === id) ?? null;
      for (const [kind, manifestation, item] of [["supports", "trace_stable", scored], ["weakly_supports", "trace_thin", weak]] as const) {
        const expectedCount = item === null ? 0 : item.evidence.length;
        expect(await page.locator(`[data-sign-id^="trace:${id}:${kind}:"]`).count(), `${id} ${kind}`).toBe(expectedCount);
        if (item === null) continue;
        for (const [index, quote] of (item.evidence as any[]).entries()) {
          const trace = page.getByTestId(`syntx-trace-trace:${id}:${kind}:${quote.docId}:${index}`);
          expect(await trace.count()).toBe(1);
          expect(await trace.getAttribute("data-sign-source")).toBe("evidence");
          expect(await trace.getAttribute("data-sign-relation")).toBe(kind);
          expect(await trace.getAttribute("data-sign-manifestation")).toBe(manifestation);
          expect(await trace.getAttribute("data-sign-interaction")).toBe("inspect");
          expect(await trace.getAttribute("data-sign-transition")).toBe("trace_rise");
          expect(await trace.getAttribute("data-proof-capability-id")).toBe(item.matchedCapabilityEntityId);
          expect(await trace.getAttribute("data-proof-doc-id")).toBe(quote.docId);
          expect(await trace.getAttribute("data-proof-analysis-id")).toBe(ANALYSIS_ID);
          expect(await trace.getAttribute("data-proof-requirement-id")).toBe(id);
          expect(await trace.getAttribute("data-proof-evidence-id")).toBeNull();
        }
      }
      expect(await page.locator(`[data-sign-id^="trace:${id}:covers_unscored:"]`).count()).toBe(0);
      const boundarySign = page.getByTestId(`syntx-open-${id}`);
      if (supportOf(id) === "OPEN") {
        expect(await boundarySign.getAttribute("data-sign-source")).toBe("matching_contribution");
        expect(await boundarySign.getAttribute("data-sign-relation")).toBe("missing_support");
        expect(await boundarySign.getAttribute("data-sign-manifestation")).toBe("open_boundary");
        expect(await boundarySign.getAttribute("data-sign-interaction")).toBe("inspect");
        expect(await boundarySign.getAttribute("data-proof-requirement-id")).toBe(id);
        expect(await boundarySign.getAttribute("data-proof-analysis-id")).toBe(ANALYSIS_ID);
        expect(await page.locator(`[data-sign-id^="trace:${id}:"]`).count()).toBe(0);
      } else expect(await boundarySign.count()).toBe(0);
    }
    expect(await page.locator('[data-testid^="syntx-trace-"]').count()).toBe(requirementIds.reduce((sum, id) => sum + expectedTracesOf(id), 0));
    expect(await page.locator('[data-sign-manifestation="trace_dotted"]').count()).toBe(0);
    // Relation-state geometry (§9.2, R14): distance by support category only; equal within a category.
    const distanceOf = (id: string) => page.locator(`[data-sign-id="req:${id}"]`).evaluate((element: Element) => {
      // Centres in screen space (bounding boxes), converted to user units through the screen CTM scale.
      const role = element.ownerDocument.querySelector('[data-sign-state="role_selected"] circle:not([data-sx-glow]):not([data-sx-hit])') as SVGCircleElement;
      const anchor = element.querySelector("circle:not([data-sx-glow]):not([data-sx-hit])") as SVGCircleElement;
      const centre = (circle: SVGCircleElement) => { const box = circle.getBoundingClientRect(); return { x: box.left + box.width / 2, y: box.top + box.height / 2 }; };
      const scale = (anchor.getScreenCTM() as DOMMatrix).a;
      const r = centre(role), a = centre(anchor);
      return Math.round((Math.hypot(a.x - r.x, a.y - r.y) / scale) * 10) / 10;
    });
    const distances = new Map<string, number[]>();
    for (const id of requirementIds) distances.set(supportOf(id), [...(distances.get(supportOf(id)) ?? []), await distanceOf(id)]);
    for (const [support, values] of distances) expect(new Set(values).size, `one distance per category ${support}`).toBe(1);
    expect(distances.get("SUPPORTED")![0]).toBeLessThan(distances.get("WEAK")![0]);
    expect(distances.get("WEAK")![0]).toBeLessThan(distances.get("OPEN")![0]);
    // Source carriers: one per delivered docId; the title resolves through the exact join into the seeded analysis (binding §2.3).
    const docIds = [...new Set<string>([...roleMatch.matched, ...roleMatch.weakEvidence].flatMap((item: any) => item.evidence.map((quote: any) => quote.docId)))];
    expect(await page.locator('[data-testid^="syntx-source-"]').count()).toBe(docIds.length);
    const documents = (analysisBody.analysis.structured_data.analysis.documents as any[]).map((document) => ({ docId: document.entity_id, title: document.identity.name }));
    for (const docId of docIds) {
      const source = page.getByTestId(`syntx-source-${docId}`);
      const joined = documents.find((document) => document.docId === docId) ?? null;
      expect(joined, `fixture document ${docId} joins`).not.toBeNull();
      expect(await source.getAttribute("data-source-title-state")).toBe("RESOLVED");
      expect(squash(await source.textContent())).toContain(squash(joined!.title));
      expect(await source.getAttribute("data-sign-manifestation")).toBe("carrier");
      expect(await source.getAttribute("data-proof-doc-id")).toBe(docId);
      expect(await source.getAttribute("data-trace-count")).toBe(String(requirementIds.reduce((sum, id) => sum + ([roleMatch.matched.find((item: any) => item.poolRequirementId === id), roleMatch.weakEvidence.find((item: any) => item.poolRequirementId === id)].find(Boolean)?.evidence.filter((quote: any) => quote.docId === docId).length ?? 0), 0)));
    }
    // The one suspended boundary of the ecology (R2): pending_evaluation with every TRQREV as proof; each resolves on the database behind the server.
    const pending = page.getByTestId(`syntx-pending-${ROLE_ID}`);
    expect(await pending.getAttribute("data-sign-source")).toBe("evaluation_state");
    expect(await pending.getAttribute("data-sign-relation")).toBe("pending_evaluation");
    expect(await pending.getAttribute("data-sign-manifestation")).toBe("suspended_boundary");
    expect(await pending.getAttribute("data-sign-transition")).toBe("boundary_suspend");
    expect(await pending.getAttribute("data-proof-target-id")).toBe(roleMatch.canonical.targetRoleProfileRevisionId);
    const trqrevs = ((await pending.getAttribute("data-proof-trqrev-id")) ?? "").split(" ");
    expect(trqrevs).toEqual(roleMatch.canonical.targetRequirementRevisionIds);
    expect([...trqrevs].sort()).toEqual(mappedRole.requirements.map((requirement: any) => requirement.targetRequirementRevisionId).sort());
    const repositories = careerChainRepositories(drizzle(world.sql));
    for (const id of trqrevs) {
      const revision = await repositories.requirement.getRevisionById(id);
      expect(revision?.targetRequirementRevisionId).toBe(id);
      expect(revision?.targetRoleProfileRevisionId).toBe(roleMatch.canonical.targetRoleProfileRevisionId);
    }
    expect(await page.locator('[data-sign-relation="pending_evaluation"]').count()).toBe(1);
    expect(roleMatch.canonical.capabilityRequirementRelationState).toBe("NOT_EVALUATED");
    expect(roleMatch.canonical.reason).toBe("VERIFIED_CAPABILITY_SNAPSHOT_ABSENT");
    // Q-09: the ecology is visible before any number; no score text, no quote text, no id at ROLE.
    expect(await stageText(page)).not.toMatch(PERCENT);
    for (const item of [...roleMatch.matched, ...roleMatch.weakEvidence] as any[]) for (const quote of item.evidence) expect(await stageText(page)).not.toContain(quote.quote);
    expect(await page.getByTestId("syntx-aperture").count()).toBe(0);
    expect(await page.getByTestId("syntx-aperture-resonance").count()).toBe(0);
    const counts = { supported: requirementIds.filter((id) => supportOf(id) === "SUPPORTED").length, weak: requirementIds.filter((id) => supportOf(id) === "WEAK").length, open: requirementIds.filter((id) => supportOf(id) === "OPEN").length };
    expect(await page.getByTestId("syntx-summary").getAttribute("data-summary-for")).toBe(ROLE_ID);
    expect(await summaryText(page)).toContain(`requires ${requirementIds.length} requirements: ${counts.supported} with scored support, ${counts.weak} with weak support, 0 covered only by an unscored sweep proposal, ${counts.open} without delivered support, 0 without a matching read.`);
    expect(await summaryText(page)).toContain("Canonical evaluation is pending for every requirement of this role.");
    await settled(page);
    await page.screenshot({ path: resolve(EVIDENCE_DIR, "Q-03.png") });
    liveSigns.ROLE = await auditSigns(page, "Q-03");
    await auditUnsupported(page, "Q-03");
    pass("Q-03", { requirements: requirementIds.length, traces: requirementIds.reduce((sum, id) => sum + expectedTracesOf(id), 0), ...counts, trqrevResolved: trqrevs.length });
    pass("Q-09", undefined, "no number at FIELD, ORGANIZATION or ROLE; resonance only inside the pending aperture");

    // ---- Q-04 STATE D REQUIREMENT and the evidence aperture (spec §5 D, §12; table §2.2, §2.3, R3, R5, R6) ----
    const supportedId = requirementIds.find((id) => supportOf(id) === "SUPPORTED")!;
    const weakId = requirementIds.find((id) => supportOf(id) === "WEAK")!;
    const openId = requirementIds.find((id) => supportOf(id) === "OPEN")!;
    await settled(page);
    await pointAt(page, page.locator(`[data-sign-id="req:${supportedId}"]`));
    await waitKind(page, "REQUIREMENT");
    expect(await root.getAttribute("data-observation-id")).toBe(supportedId);
    expect(params(page).get("jobRequirementId")).toBe(supportedId);
    expect(await page.locator(`[data-sign-id="req:${supportedId}"]`).getAttribute("data-sign-state")).toBe("requirement_selected");
    expect(await page.locator(`[data-sign-id="req:${supportedId}"]`).getAttribute("data-sign-interaction")).toBe("return");
    expect(await page.locator(`[data-sign-id="req:${supportedId}"]`).getAttribute("data-sign-transition")).toBe("recenter");
    expect(await page.locator(`[data-sign-id^="trace:${supportedId}:"][data-sign-state="inspectable"]`).count()).toBe(expectedTracesOf(supportedId));
    expect(await page.locator(`[data-sign-id="req:${weakId}"]`).getAttribute("data-sign-state")).toBe("receded");
    expect(await page.locator(`[data-sign-id="req:${weakId}"]`).getAttribute("tabindex")).toBe("-1");
    expect(await page.locator(`[data-sign-id^="trace:${weakId}:"]`).first().getAttribute("data-sign-state")).toBe("receded");
    expect(await root.getAttribute("data-aperture-open")).toBe("false");
    // PROPOSAL: deep focus is depth 3; the planetarium anchor stays at 1.12.
    expect(await page.getByTestId("syntx-canvas").getAttribute("data-depth")).toBe("3");
    expect(await page.getByTestId("syntx-canvas").getAttribute("data-camera-scale")).toBe("1.12");
    expect(await page.getByTestId("syntx-path-REQUIREMENT").getAttribute("data-current")).toBe("true");
    await settled(page);
    await page.screenshot({ path: resolve(EVIDENCE_DIR, "Q-04-requirement.png") });
    liveSigns.REQUIREMENT = await auditSigns(page, "Q-04-requirement");
    await auditUnsupported(page, "Q-04-requirement");
    // matched: the quote verbatim, the resolved source title, the exact provenance location, contribution/confidence/weight/basis, the authority boundary.
    const matched = roleMatch.matched.find((item: any) => item.poolRequirementId === supportedId);
    const quote = matched.evidence[0];
    const trace = page.getByTestId(`syntx-trace-trace:${supportedId}:supports:${quote.docId}:0`);
    const traceId = (await trace.getAttribute("data-sign-id")) ?? "";
    const tracePoint = await alongTrace(trace);
    expect(tracePoint.owned, "a point on the supported trace that the trace owns").toBe(true);
    await page.mouse.click(tracePoint.x, tracePoint.y);
    await page.locator('[data-testid="syntx-field"][data-aperture-open="true"]').waitFor({ timeout: 10_000 });
    expect(await root.getAttribute("data-observation-kind")).toBe("REQUIREMENT");
    expect([...params(page).keys()].sort()).toEqual(["analysisId", "focus", "jobOrganizationId", "jobPoolUploadId", "jobRequirementId", "jobRoleId"]);
    const aperture = page.getByTestId("syntx-aperture");
    expect(await aperture.count()).toBe(1);
    expect(await aperture.getAttribute("data-aperture-for")).toBe(traceId);
    // Source attribution under the moving carrier (R15a): the one carrier in state inspectable is the trace's source document, and the
    // aperture names that document; with the switch on, atmosphere and pulses run on that carrier only.
    const attribution = await ecologyMotion(page);
    const inspectableCarriers = attribution.carriers.filter((carrier: any) => carrier.state === "inspectable");
    expect(inspectableCarriers.map((carrier: any) => carrier.docId), "exactly the trace's source carrier is inspectable").toEqual([quote.docId]);
    expect(traceId.includes(`:${quote.docId}:`), "the aperture's trace names the same document").toBe(true);
    expect([...(attribution.infinite.sxAtmosphere ?? []), ...(attribution.infinite.sxRingPulse ?? [])].filter((host: string) => host !== "carrier:inspectable"), "atmosphere / pulses on the inspectable carrier only").toEqual([]);
    // PROPOSAL R15b: the planetarium's atmosphere and ring pulses run only on a highlighted resonance body (the focus anchor organization).
    expect([...(attribution.infinite.atmosphereGlow ?? []), ...(attribution.infinite.ringPulse ?? [])].filter((host: string) => host !== "region"), "atmosphereGlow / ringPulse only on organization bodies").toEqual([]);
    writeFileSync(resolve(EVIDENCE_DIR, "Q-04-attribution.txt"), `aperture for ${traceId}\ninspectable carriers ${JSON.stringify(inspectableCarriers)}\ninfinite ${JSON.stringify(attribution.infinite)}\n`);
    expect(await aperture.getAttribute("data-aperture-kind")).toBe("trace");
    expect(await aperture.getAttribute("data-sign-manifestation")).toBe("temporary_aperture");
    expect(await aperture.getAttribute("data-sign-interaction")).toBe("return");
    expect(await aperture.getAttribute("data-sign-transition")).toBe("restore");
    expect(await aperture.getAttribute("data-sign-relation")).toBe("supports");
    expect(await aperture.getAttribute("data-sign-source")).toBe("evidence");
    expect(await aperture.getAttribute("role")).toBe("dialog");
    expect(await page.getByTestId("syntx-aperture-quote").textContent()).toContain(quote.quote);
    expect(await page.getByTestId("syntx-aperture-source").getAttribute("data-source-title-state")).toBe("RESOLVED");
    expect(await page.getByTestId("syntx-aperture-source").textContent()).toContain(documents.find((document) => document.docId === quote.docId)!.title);
    const provenance = (analysisBody.analysis.structured_data.analysis.capabilities as any[]).find((capability) => capability.entity_id === matched.matchedCapabilityEntityId)?.evidence.find((evidence: any) => evidence.doc_id === quote.docId && evidence.context_quote === quote.quote) ?? null;
    expect(provenance, "fixture provenance joins exactly").not.toBeNull();
    expect(await page.getByTestId("syntx-aperture-source").textContent()).toContain(provenance.location);
    const apertureText = (await aperture.textContent()) ?? "";
    expect(apertureText).toContain(matched.matchedCapabilityName);
    expect(apertureText).toContain(matched.matchBasis);
    expect(await page.getByTestId("syntx-aperture-contribution").textContent()).toContain(String(matched.contribution));
    expect(await page.getByTestId("syntx-aperture-contribution").textContent()).toContain(String(matched.confidence));
    expect(await page.getByTestId("syntx-aperture-contribution").textContent()).toContain(String(matched.weight));
    expect(apertureText).toContain("Scored evidence supports this requirement within the delivered presentation matching; it is not a certification.");
    expect(await page.getByTestId("syntx-aperture-sweep-status").count()).toBe(0);
    const authority = ((await page.getByTestId("syntx-aperture-authority").textContent()) ?? "").toLowerCase();
    expect(authority).toContain("authority none");
    expect(authority).toContain("not a canonical evaluation");
    expect(authority).toContain("not a decision");
    expect(matches.presentation.authorityState).toBe("NONE");
    expect(matches.presentation.canonicalEvaluation).toBe(false);
    expect(matches.presentation.decision).toBe(false);
    expect(await summaryText(page)).toContain("An inspection aperture is open.");
    expect(await summaryText(page)).toContain(`${expectedTracesOf(supportedId)} evidence trace${expectedTracesOf(supportedId) === 1 ? "" : "s"} from 1 source.`);
    await settled(page);
    await page.screenshot({ path: resolve(EVIDENCE_DIR, "Q-04-matched.png") });
    await auditSigns(page, "Q-04-matched");
    await auditUnsupported(page, "Q-04-matched");
    const apertureRecord: Record<string, unknown> = { matched: { apertureFor: traceId, quote: quote.quote, sourceTitleState: "RESOLVED", location: provenance.location, text: apertureText } };
    // Escape closes the aperture first (R8), the observation point stays REQUIREMENT.
    await page.keyboard.press("Escape");
    await page.locator('[data-testid="syntx-field"][data-aperture-open="false"]').waitFor({ timeout: 10_000 });
    expect(await aperture.count()).toBe(0);
    expect(await root.getAttribute("data-observation-kind")).toBe("REQUIREMENT");
    expect(await summaryText(page)).not.toContain("An inspection aperture is open.");
    // weak: the thin trace inspects to the weak text and the delivered reason; weak support never closes.
    await page.keyboard.press("Escape");
    await waitKind(page, "ROLE");
    await settled(page);
    await pointAt(page, page.locator(`[data-sign-id="req:${weakId}"]`));
    await waitKind(page, "REQUIREMENT");
    expect(await root.getAttribute("data-observation-id")).toBe(weakId);
    const weak = roleMatch.weakEvidence.find((item: any) => item.poolRequirementId === weakId);
    const weakTrace = page.getByTestId(`syntx-trace-trace:${weakId}:weakly_supports:${weak.evidence[0].docId}:0`);
    await settled(page);
    const weakPoint = await alongTrace(weakTrace);
    expect(weakPoint.owned, "a point on the weak trace that the trace owns").toBe(true);
    await page.mouse.click(weakPoint.x, weakPoint.y);
    await page.locator('[data-testid="syntx-field"][data-aperture-open="true"]').waitFor({ timeout: 10_000 });
    expect(await aperture.getAttribute("data-aperture-for")).toBe(await weakTrace.getAttribute("data-sign-id"));
    expect(await aperture.getAttribute("data-sign-relation")).toBe("weakly_supports");
    expect(await aperture.getAttribute("data-sign-manifestation")).toBe("temporary_aperture");
    expect(await page.getByTestId("syntx-aperture-quote").textContent()).toContain(weak.evidence[0].quote);
    expect(await page.getByTestId("syntx-aperture-source").getAttribute("data-source-title-state")).toBe("RESOLVED");
    const weakText = (await aperture.textContent()) ?? "";
    expect(weakText).toContain("Evidence exists but contributes limited matching support.");
    if (typeof weak.reason === "string" && weak.reason.length > 0) expect(weakText).toContain(weak.reason);
    expect(await page.getByTestId("syntx-aperture-contribution").textContent()).toContain(String(weak.contribution));
    expect(await page.locator('[data-sign-manifestation="trace_thin"]').count()).toBeGreaterThan(0);
    await settled(page);
    await page.screenshot({ path: resolve(EVIDENCE_DIR, "Q-04-weak.png") });
    apertureRecord.weak = { quote: weak.evidence[0].quote, reason: weak.reason ?? null, text: weakText };
    await page.getByTestId("syntx-aperture-close").click();
    await page.locator('[data-testid="syntx-field"][data-aperture-open="false"]').waitFor({ timeout: 10_000 });
    expect(await root.getAttribute("data-observation-kind")).toBe("REQUIREMENT");
    // missing: the open boundary inspects to the neutral text (R3); no failure family, the hint from the pool.
    await page.getByTestId("syntx-return-btn").click();
    await waitKind(page, "ROLE");
    await settled(page);
    const openBoundary = page.getByTestId(`syntx-open-${openId}`);
    await pointAt(page, openBoundary);
    await page.locator('[data-testid="syntx-field"][data-observation-kind="REQUIREMENT"][data-aperture-open="true"]').waitFor({ timeout: 10_000 });
    expect(await root.getAttribute("data-observation-id")).toBe(openId);
    expect(await aperture.getAttribute("data-aperture-kind")).toBe("open");
    expect(await aperture.getAttribute("data-aperture-for")).toBe(`open:${openId}`);
    expect(await aperture.getAttribute("data-sign-relation")).toBe("missing_support");
    expect(await page.getByTestId("syntx-aperture-open-text").textContent()).toBe("No delivered support is available for this requirement in the current analysis.");
    const openText = (await aperture.textContent()) ?? "";
    expect(openText.toLowerCase()).not.toMatch(/fail|incompet|disqualif|gap decision|missing capability/);
    const missing = roleMatch.missing.find((item: any) => item.poolRequirementId === openId);
    if (typeof missing.evidenceHint === "string" && missing.evidenceHint.length > 0) expect(openText).toContain(missing.evidenceHint);
    expect(await page.getByTestId("syntx-aperture-quote").count()).toBe(0);
    expect(await page.getByTestId("syntx-aperture-contribution").count()).toBe(0);
    expect(((await page.getByTestId("syntx-aperture-authority").textContent()) ?? "").toLowerCase()).toContain("authority none");
    await settled(page);
    await page.screenshot({ path: resolve(EVIDENCE_DIR, "Q-04-missing.png") });
    await auditUnsupported(page, "Q-04-missing");
    apertureRecord.missing = { text: openText, hint: missing.evidenceHint ?? null };
    // pending: the suspended boundary inspects to the authority statement; the resonance score appears here, numerically, and nowhere before.
    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");
    await page.locator('[data-testid="syntx-field"][data-observation-kind="ROLE"][data-aperture-open="false"]').waitFor({ timeout: 10_000 });
    await settled(page);
    await pending.click({ position: await topOf(pending) });
    await page.locator('[data-testid="syntx-field"][data-observation-kind="ROLE"][data-aperture-open="true"]').waitFor({ timeout: 10_000 });
    expect(await aperture.getAttribute("data-aperture-kind")).toBe("pending");
    expect(await aperture.getAttribute("data-aperture-for")).toBe(`pending:${ROLE_ID}`);
    expect(await aperture.getAttribute("data-sign-relation")).toBe("pending_evaluation");
    expect(await page.getByTestId("syntx-aperture-pending-text").textContent()).toBe("Authoritative evaluation has not occurred for this relation.");
    const pendingText = (await aperture.textContent()) ?? "";
    expect(pendingText).toContain(roleMatch.canonical.targetRoleProfileRevisionId);
    expect(pendingText).toContain(`${roleMatch.canonical.targetRequirementRevisionIds.length} TRQREV`);
    expect(await page.getByTestId("syntx-aperture-resonance").count()).toBe(1);
    expect(await page.getByTestId("syntx-aperture-resonance").getAttribute("data-resonance-score")).toBe(String(roleMatch.resonanceScore));
    expect(pendingText).toContain("POOL RESONANCE (PRESENTATION)");
    expect(pendingText).toContain(`#${matches.roleMatches.findIndex((role: any) => role.poolRoleId === ROLE_ID) + 1}`);
    expect(pendingText.toLowerCase().replace("not an hr recommendation", "")).not.toMatch(/recommend|verified capability|chosen|best fit/);
    await settled(page);
    await page.screenshot({ path: resolve(EVIDENCE_DIR, "Q-04-pending.png") });
    await auditSigns(page, "Q-04-pending");
    apertureRecord.pending = { text: pendingText, resonanceScore: roleMatch.resonanceScore };
    await page.keyboard.press("Escape");
    await page.locator('[data-testid="syntx-field"][data-observation-kind="ROLE"][data-aperture-open="false"]').waitFor({ timeout: 10_000 });
    writeFileSync(resolve(EVIDENCE_DIR, "Q-04-aperture.json"), `${JSON.stringify(apertureRecord, null, 2)}\n`);
    pass("Q-04", { kinds: 3 }, "matched, weak and missing apertures bound; sweep aperture absent on the seeded analysis (capabilitySweep NOT_PRODUCED), bound by live-browser-workflow.e2e.test.ts with a key");
    boundary("Q-04-sweep", "B-JP-GEMINI: the seeded analysis has no capability sweep; trace_dotted / covers_unscored / syntx-aperture-sweep-status are asserted absent here");

    // ---- Q-05 STATE E RETURN and reversibility (spec §5 E, §13.3, §13.4; R8, R12) ----
    await page.getByTestId("syntx-return-btn").click();
    await waitKind(page, "ORGANIZATION");
    expect(params(page).get("jobRoleId")).toBeNull();
    expect(params(page).get("jobRequirementId")).toBeNull();
    expect(await page.getByTestId("syntx-ecology").count()).toBe(0);
    const organizationAgain = await collectSigns(page);
    expect(organizationAgain.map((sign) => [sign.id, sign.state, sign.proof])).toEqual(liveSigns.ORGANIZATION.map((sign) => [sign.id, sign.state, sign.proof]));
    // The background is a return (spec §13.3): a click on the empty canvas restores the field.
    await settled(page);
    await page.getByTestId("syntx-canvas").click({ position: { x: 4, y: 4 } });
    await waitKind(page, "FIELD");
    expect(params(page).get("jobOrganizationId")).toBeNull();
    expect(await page.getByTestId("syntx-canvas").getAttribute("data-camera-scale")).toBe("1");
    expect(await page.locator('[data-sign-state="receded"]').count()).toBe(0);
    expect(await page.getByTestId("syntx-return-btn").count()).toBe(0);
    const fieldAgain = await collectSigns(page);
    expect(fieldAgain.map((sign) => [sign.id, sign.state, sign.interaction, sign.transition, sign.proof])).toEqual(fieldSigns.map((sign) => [sign.id, sign.state, sign.interaction, sign.transition, sign.proof]));
    // The path is a return: deep in (acting on settled frames, J-12), then every step back by the breadcrumb, then a reload reproduces the observation point.
    await settled(page);
    await region.click({ position: await bottomOf(region) });
    await waitKind(page, "ORGANIZATION");
    await settled(page);
    await pointAt(page, page.getByTestId(`syntx-role-${ROLE_ID}`));
    await waitKind(page, "ROLE");
    await settled(page);
    await pointAt(page, page.locator(`[data-sign-id="req:${supportedId}"]`));
    await waitKind(page, "REQUIREMENT");
    const requirementAgain = await collectSigns(page);
    expect(requirementAgain.map((sign) => [sign.id, sign.state, sign.proof])).toEqual(liveSigns.REQUIREMENT.map((sign) => [sign.id, sign.state, sign.proof]));
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.locator('[data-testid="syntx-field"][data-observation-kind="REQUIREMENT"][data-field-state="AVAILABLE"][data-sources-state="AVAILABLE"]').waitFor({ timeout: 120_000 });
    expect(await root.getAttribute("data-observation-id")).toBe(supportedId);
    expect(await root.getAttribute("data-aperture-open")).toBe("false");
    const reloaded = await collectSigns(page);
    expect(reloaded.map((sign) => [sign.id, sign.state, sign.proof])).toEqual(liveSigns.REQUIREMENT.map((sign) => [sign.id, sign.state, sign.proof]));
    await page.getByTestId("syntx-path-ROLE").click();
    await waitKind(page, "ROLE");
    await page.getByTestId("syntx-path-ORGANIZATION").click();
    await waitKind(page, "ORGANIZATION");
    await page.getByTestId("syntx-path-FIELD").click();
    await waitKind(page, "FIELD");
    expect([...params(page).keys()].sort()).toEqual(["analysisId", "focus", "jobPoolUploadId"]);
    // Only GET requests left the page during the whole walk; the bodies are byte-identical before and after.
    const nonGet: string[] = (page as any).__nonGet;
    writeFileSync(resolve(EVIDENCE_DIR, "Q-05-requests.txt"), `non-GET requests during the walk: ${nonGet.length}\n${nonGet.join("\n")}\n`);
    expect(nonGet).toEqual([]);
    const viewAfter = await (await fetch(`${base()}/api/career/job-pools/${uploadId}`)).json();
    const matchesAfter = await (await fetch(`${base()}/api/career/job-pools/${uploadId}/matches?analysisId=${ANALYSIS_ID}`)).json();
    const analysisAfter = await (await fetch(`${base()}/api/career/analyses/${ANALYSIS_ID}`)).json();
    expect(JSON.stringify(viewAfter)).toBe(JSON.stringify(view));
    expect(JSON.stringify(matchesAfter)).toBe(JSON.stringify(matches));
    // The legacy `recommendations` block of the analysis read (binding §1: not an input; Appendix C "legacy matching fields") carries a per-request `generatedAt`; everything else is byte-identical.
    const withoutLegacyStamp = (body: any) => JSON.stringify({ ...body, recommendations: body.recommendations ? { ...body.recommendations, generatedAt: null } : body.recommendations });
    expect(withoutLegacyStamp(analysisAfter)).toBe(withoutLegacyStamp(analysisBody));
    expect(JSON.stringify(analysisAfter.analysis)).toBe(JSON.stringify(analysisBody.analysis));
    expect(JSON.stringify(analysisAfter.capabilityProposalProjection)).toBe(JSON.stringify(analysisBody.capabilityProposalProjection));
    pass("Q-05", { nonGetRequests: nonGet.length }, "return affordance, background, Escape, path and reload restore the same sign sets; view and matches bodies byte-identical, the analysis body identical except the legacy recommendations.generatedAt request stamp (non-input)");

    // ---- Q-08 keyboard path (spec §13.4; R8, R9): Enter selects, Escape returns, the same observation sequence as the pointer path ----
    await region.focus();
    await page.keyboard.press("Enter");
    await waitKind(page, "ORGANIZATION");
    await page.getByTestId(`syntx-role-${ROLE_ID}`).focus();
    await page.keyboard.press("Enter");
    await waitKind(page, "ROLE");
    await page.locator(`[data-sign-id="req:${supportedId}"]`).focus();
    await page.keyboard.press("Enter");
    await waitKind(page, "REQUIREMENT");
    await trace.focus();
    await page.keyboard.press("Enter");
    await page.locator('[data-testid="syntx-field"][data-aperture-open="true"]').waitFor({ timeout: 10_000 });
    expect(await aperture.getAttribute("data-aperture-for")).toBe(traceId);
    // R8: Escape returns one level at every level from the keyboard. Focus must stay inside the field when the sign that held it unmounts on return; a loss is recorded as finding F-SX-1 and the walk re-focuses the root to continue.
    const focusLoss: string[] = [];
    const focusState = () => page.evaluate(() => { const active = document.activeElement; const root = document.querySelector('[data-testid="syntx-field"]'); return { inside: root !== null && active !== null && root.contains(active), active: active === null ? "null" : `${active.tagName.toLowerCase()}${active.getAttribute("data-testid") ? `#${active.getAttribute("data-testid")}` : ""}${active.getAttribute("data-sign-id") ? `[${active.getAttribute("data-sign-id")}]` : ""}` }; });
    const keyboardTrace: string[] = [];
    for (const expected of ["REQUIREMENT", "ROLE", "ORGANIZATION", "FIELD"]) {
      await page.keyboard.press("Escape");
      const kindAfter = await page.locator('[data-testid="syntx-field"]').evaluate((element: Element) => element.getAttribute("data-observation-kind"));
      const focus = await focusState();
      keyboardTrace.push(`Escape → expected ${expected}, observed ${kindAfter}, aperture ${await root.getAttribute("data-aperture-open")}, focus ${focus.active} (inside: ${focus.inside})`);
      if (!focus.inside) { focusLoss.push(`before reaching ${expected}: focus on ${focus.active}`); await root.focus(); if (kindAfter !== expected) await page.keyboard.press("Escape"); }
      await waitKind(page, expected, expected === "REQUIREMENT" ? '[data-aperture-open="false"]' : "");
    }
    // Every carrier, anchor, trace and boundary is a named button; receded ones leave the tab order.
    const buttons = await field(page).evaluate((root: Element) => Array.from(root.querySelectorAll('[data-sign-id][role="button"]')).map((element) => ({ id: element.getAttribute("data-sign-id"), label: element.getAttribute("aria-label") ?? "", tabindex: element.getAttribute("tabindex") })));
    // PROPOSAL (organizations first): at JOB POOL the named buttons are the organizations; roles become buttons when their organization is observed.
    expect(buttons.length).toBe(view.canonicalMapping.organizations.length);
    for (const button of buttons) { expect(button.label.length).toBeGreaterThan(0); expect(button.tabindex).toBe("0"); }
    writeFileSync(resolve(EVIDENCE_DIR, "Q-08-summary.txt"), `FIELD: ${await summaryText(page)}\nbuttons at FIELD: ${JSON.stringify(buttons)}\nkeyboard trace:\n${keyboardTrace.join("\n")}\nfocus loss: ${focusLoss.length === 0 ? "none" : focusLoss.join("; ")}\n`);
    if (focusLoss.length === 0) pass("Q-08", { buttons: buttons.length });
    else report.scenarios["Q-08"] = { verdict: "FAIL", finding: "F-SX-1", note: `keyboard focus leaves the field when the focused sign unmounts on return: ${focusLoss.join("; ")}; Escape then no longer returns until the field is focused again (R8, spec §13.4)` };
    pass("Q-07", undefined, "unsupported wording, legacy role names, aggregate numbers and closure manifestations absent at every observation point (Q-0x-audit.txt)");
    pass("Q-10", undefined, "sign enums, identity, proof resolution and TRQREV database resolution bound at every observation point (Q-0x-signs.json)");

    // ---- Q-11 Capability Field and the carried contracts (R10, R11; E-07, H-02, D-10, B-POOL-INITIAL-FOCUS) ----
    // Capability gate (owner "JOB POOL FIRST / CAPABILITY GATE", 2026-10-14): closed without a selected job; one role is selected as
    // the job (the walk's sign sets above are complete), then the way to the Capability Field opens.
    expect(await page.getByTestId("syntx-exit-btn").isDisabled()).toBe(true);
    expect(await page.getByTestId("field-focus-capability-btn").isDisabled()).toBe(true);
    const gateRole = view.canonicalMapping.roles[0];
    await page.getByTestId(`syntx-organization-${gateRole.poolOrganizationId}`).focus();
    await page.keyboard.press("Enter");
    await page.locator('[data-testid="syntx-field"][data-observation-kind="ORGANIZATION"]').waitFor({ timeout: 10_000 });
    await page.getByTestId(`syntx-role-${gateRole.poolRoleId}`).focus();
    await page.keyboard.press("Enter");
    await page.locator(`[data-testid="syntx-field"][data-observation-kind="ROLE"][data-observation-id="${gateRole.poolRoleId}"]`).waitFor({ timeout: 10_000 });
    await page.getByTestId("syntx-job-scope-select").click();
    await page.locator('[data-testid="semantic-career-intelligence-field"][data-capability-gate="OPEN"]').waitFor({ timeout: 30_000 });
    await page.getByTestId("syntx-path-FIELD").click();
    await page.locator('[data-testid="syntx-field"][data-observation-kind="FIELD"]').waitFor({ timeout: 10_000 });
    await page.getByTestId("syntx-exit-btn").click();
    await page.locator('[data-testid="semantic-career-intelligence-field"][data-field-focus="CAPABILITY"]').waitFor({ timeout: 30_000 });
    expect(await root.count()).toBe(0);
    expect(params(page).get("focus")).toBe("CAPABILITY");
    expect(params(page).get("jobPoolUploadId")).toBe(uploadId);
    expect(params(page).get("jobRoleId")).toBeNull();
    expect(params(page).get("jobOrganizationId")).toBeNull();
    expect(await page.getByTestId("field-focus-capability-btn").getAttribute("data-field-focus-active")).toBe("true");
    expect(await page.getByTestId("job-pool-panel-toggle").getAttribute("data-field-focus-active")).toBe("false");
    expect(await page.locator('[data-testid="field-focus-strip"] button').count()).toBe(2);
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.locator('[data-testid="semantic-career-intelligence-field"][data-field-focus="CAPABILITY"]').waitFor({ timeout: 60_000 });
    expect(await root.count()).toBe(0);
    for (const stage of ["01", "02", "03", "04", "05", "06"]) expect(await page.getByTestId(`focus-transition-stage-shell-${stage}`).count()).toBe(1);
    // Re-entry after the reload: a click before hydration completes is lost in headless Chromium (not a field behaviour), so the click is repeated until the field answers.
    for (let attempt = 0; attempt < 12; attempt += 1) {
      await page.getByTestId("job-pool-panel-toggle").click();
      try { await page.locator('[data-testid="syntx-field"][data-field-state="AVAILABLE"]').waitFor({ timeout: 5_000 }); break; } catch { if (attempt === 11) throw new Error("the field did not open on re-entry"); }
    }
    expect(params(page).get("focus")).toBe("FIELD");
    expect(await root.getAttribute("data-observation-kind")).toBe("FIELD");
    await settled(page);
    await page.screenshot({ path: resolve(EVIDENCE_DIR, "Q-11.png") });
    writeFileSync(resolve(EVIDENCE_DIR, "Q-11-ids.txt"), `retired selectors absent: ${RETIRED_SELECTORS.length}\nstrip buttons: field-focus-capability-btn, job-pool-panel-toggle\n`);
    pass("Q-11");
    expect(pageErrors).toEqual([]);
    await page.close();
    expect(focusLoss, "F-SX-1: keyboard focus must stay inside the field on return (R8)").toEqual([]);
  }, 600_000);

  it("Q-06: reduced motion keeps every sign and its meaning; LIVE names only the allowed motions", async () => {
    const live = await open(`/career/demo?focus=FIELD&analysisId=${ANALYSIS_ID}&jobPoolUploadId=${uploadId}&jobRoleId=${ROLE_ID}`);
    await live.locator('[data-testid="syntx-field"][data-field-state="AVAILABLE"][data-sources-state="AVAILABLE"][data-observation-kind="ROLE"][data-motion-mode="LIVE"]').waitFor({ timeout: 120_000 });
    await settled(live);
    const computed = await field(live).evaluate((root: Element) => {
      const read = (selector: string) => { const element = root.querySelector(selector); return element === null ? null : { animation: getComputedStyle(element).animationName, transition: getComputedStyle(element).transitionProperty, duration: getComputedStyle(element).transitionDuration }; };
      return { root: getComputedStyle(root).animationName, shell: read('[data-testid^="focus-transition-stage-shell-syntx-"]'), pendingDash: (() => { const element = root.querySelector('[data-testid^="syntx-pending-"] circle:not([data-sx-hit])'); return element === null ? null : getComputedStyle(element).animationName; })(), sign: read("[data-sign-id]"), names: Array.from(new Set(root.getAnimations({ subtree: true }).map((animation: any) => (typeof animation.animationName === "string" ? animation.animationName : "transition")))) };
    });
    expect(computed.root).toBe("sxEnter");
    expect(computed.pendingDash).toBe("sxSuspend");
    // PROPOSAL: the focus transformation (FocusTransitionStageShell) replaces the camera: transform over .78 s, opacity / filter over .62 s.
    expect(computed.shell?.transition).toBe("transform, opacity, filter");
    expect(computed.shell?.duration).toBe("0.78s, 0.62s, 0.62s");
    // Sign transitions: opacity (recede / restore); since the living field (a856b5a) also filter (the depth blur, data-sx-depth).
    expect(["opacity", "opacity, filter"], `sign transition ${computed.sign?.transition}`).toContain(computed.sign?.transition);
    // At ROLE after settle: the entrance, reveals, the suspend drift and the finite state-bound transitions of §13.2.1 — never a FIELD ambient name.
    // R15a (owner 2026-10-12 "Alles zulassen", SYNTX_FIELD_CONTRACT_BINDING.md §4; GRÜN 9f225f2): the evidence ecology adds the finite
    // `sxSettle` (carrier entry) and, continuously, the carrier orbit (rAF, no animation), `sxMoonOrbit` on carriers, SMIL photons on
    // every trace and `sxAtmosphere` / `sxRingPulse` on the inspectable carrier only.
    // PROPOSAL R15b (GRÜN, SYNTX_SEMIOTIC_TRANSFER_PROPOSALS.md P-2, table as of the integration; not recorded by GELB): the Capability
    // Field's own motion names (planetarium, core, focus pulse, HUD), the panel and boundary motions of the local passes, and the finite
    // orientation pass `sxOrientPass` (801b778; missing from P-2, F-5 of the 2026-10-13 sweep) join the field's finite transitions. PINK binds
    // the walk to this closed list so that any further motion fails, and records Q-06 as BOUNDARY-MATCH until GELB records R15b.
    const R15B = ["orbitFloatPhase2", "moonOrbit", "ringPulse", "atmosphereGlow", "hologramFloat", "coreBreathe", "corePulseCommunicate", "plasmaRotateCw", "plasmaRotateCcw", "plasmaFlarePulse", "waveExpand", "particleIn", "rotateClockwise", "focusTransitionPulse", "sxApertureBreathe", "sxPanelCurrent", "sxBoundaryHalo", "sxGiantBreath", "sxGiantSeam", "sxGiantMembrane", "sxGiantRing"];
    const R15B_FINITE = ["sxOrientPass", "sxBoundaryOpen"];
    for (const name of computed.names) expect(["sxEnter", "sxRise", "sxSuspend", "sxUnfold", "sxTraceRise", "sxTraceDraw", "sxSuspendEnter", "sxRecenter", "sxCoreSettle", "sxSettle", "sxNucleusSettle", "sxSatelliteSettle", ...R15B, ...R15B_FINITE, "transition"], `allowed motion at ROLE ${name}`).toContain(name);
    expect(computed.names.filter((name: string) => ["sxOrbit", "sxBreathe"].includes(name)), "no ambient motion at ROLE").toEqual([]);
    // R15a at ROLE in two frames ~1.5 s apart: the infinite set is ⊆ {sxSuspend, sxMoonOrbit, sxAtmosphere, sxRingPulse}; moons only inside
    // carriers, atmosphere and pulses only inside a carrier in state inspectable (none at ROLE rest); the three carrier animations only with
    // the switch on; every carrier body moves on the shared rAF clock; every trace is a quadratic arc whose carrier end sits on the moving
    // body in both frames (geometrically coupled), carries two photons, and owns a pointer point in both frames (clickable while it moves).
    const frameA = await ecologyMotion(live);
    const ownedA = await everyTraceOwned(live);
    await live.waitForTimeout(1500);
    const frameB = await ecologyMotion(live);
    const ownedB = await everyTraceOwned(live);
    writeFileSync(resolve(EVIDENCE_DIR, "Q-06-ecology.txt"), `frame A: ${JSON.stringify(frameA)}\nowned A: ${JSON.stringify(ownedA)}\nframe B: ${JSON.stringify(frameB)}\nowned B: ${JSON.stringify(ownedB)}\n`);
    for (const frame of [frameA, frameB]) {
      for (const name of Object.keys(frame.infinite)) expect(["sxSuspend", ...R15B], `R15b infinite at ROLE ${name}`).toContain(name);
      // PROPOSAL R15b: moons orbit only as the role moons of a (receded) organization body.
      expect(frame.infinite.moonOrbit?.filter((host: string) => host !== "carrier") ?? [], "moonOrbit only on role moons").toEqual([]);
      expect([...(frame.infinite.sxAtmosphere ?? []), ...(frame.infinite.sxRingPulse ?? [])].filter((host: string) => host !== "carrier:inspectable"), "atmosphere / pulses only on the inspectable carrier").toEqual([]);
      if (frame.switch !== "on") expect(Object.keys(frame.infinite).filter((name) => name !== "sxSuspend"), "carrier animations gated by the switch").toEqual([]);
      expect(frame.carriers.every((carrier: any) => carrier.driver === "shared-rAF" && Number.isFinite(carrier.x) && Number.isFinite(carrier.y)), "every carrier body on the shared rAF clock").toBe(true);
      expect(frame.traces.filter((trace: any) => !trace.quadratic).map((trace: any) => trace.id), "every trace a quadratic arc").toEqual([]);
      expect(frame.traces.filter((trace: any) => trace.coupled === false).map((trace: any) => trace.id), "every trace ends on its carrier's current body").toEqual([]);
      expect(frame.traces.filter((trace: any) => trace.photons !== 2).map((trace: any) => trace.id), "two photons per trace in LIVE").toEqual([]);
    }
    if (frameA.carriers.length > 0) expect(frameA.carriers.map((carrier: any) => `${carrier.x},${carrier.y}`), "the carriers moved between the frames").not.toEqual(frameB.carriers.map((carrier: any) => `${carrier.x},${carrier.y}`));
    expect(ownedA.filter((trace: any) => !trace.owned).map((trace: any) => trace.id), "every trace owns a pointer point (frame A)").toEqual([]);
    expect(ownedB.filter((trace: any) => !trace.owned).map((trace: any) => trace.id), "every trace owns a pointer point (frame B, carrier moved)").toEqual([]);
    const liveRoleSigns = await collectSigns(live);
    await live.close();

    // FIELD level: the ambient switch (§13.2.1, SYNTX_AMBIENT_MOTION → data-sx-ambient). Contract: with "on", the infinite animations
    // running after settle are exactly a subset of SYNTX_AMBIENT_NAMES and run only inside signs in state "field"; with "off", none.
    // Ruling: spec §1 (lines 99–101) and §6.2 forbid decorative orbital motion and ambient swirl; until GELB records the owner's
    // supersession (R15, option B), the expected switch position is "off" — a tip with "on" fails Q-06 by design (finding R15-PENDING).
    const EXPECTED_AMBIENT = "on"; // R15 (owner 2026-10-12, SYNTX_FIELD_CONTRACT_BINDING.md §4): supersede, bound motion
    const atField = await open(`/career/demo?focus=FIELD&analysisId=${ANALYSIS_ID}&jobPoolUploadId=${uploadId}`);
    await atField.locator('[data-testid="syntx-field"][data-field-state="AVAILABLE"][data-sources-state="AVAILABLE"][data-observation-kind="FIELD"][data-motion-mode="LIVE"]').waitFor({ timeout: 120_000 });
    await settled(atField);
    const ambient = await field(atField).evaluate((root: Element) => {
      const infinite = root.getAnimations({ subtree: true }).filter((animation: any) => animation.playState === "running" && animation.effect?.getTiming?.().iterations === Infinity);
      const names = [...new Set(infinite.map((animation: any) => String(animation.animationName ?? "")))].sort();
      const outsideField = infinite.filter((animation: any) => { const sign = (animation.effect?.target as Element | null)?.closest("[data-sign-id]"); return sign === null || sign === undefined || sign.getAttribute("data-sign-state") !== "field"; }).map((animation: any) => String(animation.animationName ?? ""));
      return { switch: root.getAttribute("data-sx-ambient") ?? "off", names, outsideField }; // no attribute (≤ 1ca3ca9) = no ambient life
    });
    writeFileSync(resolve(EVIDENCE_DIR, "Q-06-ambient.txt"), `FIELD: ${JSON.stringify(ambient)}\nexpected switch: ${EXPECTED_AMBIENT}\n`);
    if (ambient.switch === "on") { for (const name of ambient.names) expect(["sxSuspend", ...R15B], `ambient name ${name}`).toContain(name); expect(ambient.outsideField, "ambient motion only inside signs in state field").toEqual([]); }
    else expect(ambient.names, "no infinite animation at FIELD with the switch off").toEqual([]);
    await atField.close();

    const calm = await open(`/career/demo?focus=FIELD&analysisId=${ANALYSIS_ID}&jobPoolUploadId=${uploadId}&jobRoleId=${ROLE_ID}`, { reducedMotion: "reduce" });
    await calm.locator('[data-testid="syntx-field"][data-field-state="AVAILABLE"][data-sources-state="AVAILABLE"][data-observation-kind="ROLE"][data-motion-mode="REDUCED"]').waitFor({ timeout: 120_000 });
    await calm.waitForTimeout(400);
    const reduced = await field(calm).evaluate((root: Element) => ({ running: root.getAnimations({ subtree: true }).filter((animation: any) => animation.playState === "running").length, root: getComputedStyle(root).animationName, shell: (() => { const element = root.querySelector('[data-testid^="focus-transition-stage-shell-syntx-"]'); return element === null ? null : getComputedStyle(element).transitionDuration; })(), pendingDash: (() => { const element = root.querySelector('[data-testid^="syntx-pending-"] circle:not([data-sx-hit])'); return element === null ? null : getComputedStyle(element).animationName; })() }));
    expect(reduced.running).toBe(0);
    expect(reduced.root).toBe("none");
    // R15a REDUCED stays total: no photons rendered, the rAF clock never starts (carrier bodies hold their routed place across a second).
    const calmA = await ecologyMotion(calm);
    await calm.waitForTimeout(1000);
    const calmB = await ecologyMotion(calm);
    expect(calmA.photons, "no photons in REDUCED").toBe(0);
    expect(Object.keys(calmA.infinite), "nothing infinite in REDUCED").toEqual([]);
    expect(calmA.carriers.map((carrier: any) => `${carrier.x},${carrier.y}`), "carriers hold their place in REDUCED").toEqual(calmB.carriers.map((carrier: any) => `${carrier.x},${carrier.y}`));
    expect(reduced.pendingDash).toBe("none");
    expect(reduced.shell).toBe("0s");
    const calmSigns = await collectSigns(calm);
    expect(calmSigns.map((sign) => [sign.id, sign.source, sign.relation, sign.state, sign.manifestation, sign.proof])).toEqual(liveRoleSigns.map((sign) => [sign.id, sign.source, sign.relation, sign.state, sign.manifestation, sign.proof]));
    expect(await field(calm).getAttribute("data-requirement-count")).toBe(String(mappedRole.requirements.length));
    // The aperture opens without motion and reads the same.
    const pendingCalm = calm.getByTestId(`syntx-pending-${ROLE_ID}`);
    await pendingCalm.click({ position: await topOf(pendingCalm) });
    await calm.locator('[data-testid="syntx-field"][data-aperture-open="true"]').waitFor({ timeout: 10_000 });
    expect(await calm.getByTestId("syntx-aperture-pending-text").textContent()).toBe("Authoritative evaluation has not occurred for this relation.");
    expect(await calm.getByTestId("syntx-aperture").evaluate((element: Element) => getComputedStyle(element).animationName)).toBe("none");
    await calm.screenshot({ path: resolve(EVIDENCE_DIR, "Q-06-reduced.png") });
    writeFileSync(resolve(EVIDENCE_DIR, "Q-06-computed.txt"), `LIVE: ${JSON.stringify(computed)}\nREDUCED: ${JSON.stringify(reduced)}\n`);
    expect(pageErrors).toEqual([]);
    await calm.close();
    if (ambient.switch === EXPECTED_AMBIENT) boundary("Q-06", `R15b-PENDING: every motion equals GRÜN's proposed closed R15b list (P-2 + F-5), not recorded by GELB; ${computed.names.length} live names at ROLE (${computed.names.join(", ")}), FIELD ambient ${ambient.names.join(", ")}`);
    else report.scenarios["Q-06"] = { verdict: "FAIL", finding: "R15-PENDING", note: `ambient switch is ${ambient.switch} (${ambient.names.join(", ")}) while spec §1 / §6.2 stand (expected ${EXPECTED_AMBIENT}); the contract of the switch itself holds (names ⊆ SYNTX_AMBIENT_NAMES, inside signs in state field only; nothing ambient at ROLE; REDUCED total); flips to PASS when GELB records the owner's ruling R15 (option B → expected on)` };
    expect(ambient.switch, `ambient switch per the recorded contract (R15 pending: spec §1 / §6.2 stand)`).toBe(EXPECTED_AMBIENT);
  }, 300_000);

  it("carried field states and stale ids (E-08, E-09, H-05, D-02, D-04, D-08, D-10): NO_ANALYSIS, NO_POOL with the intake, DRAFT pool as containment without a matching, NOT_FOUND, stale observation ids, legacy focus aliases", async () => {
    const noAnalysis = await open(`/career/demo?focus=FIELD&jobPoolUploadId=${uploadId}`);
    await noAnalysis.locator('[data-testid="syntx-field"][data-field-state="NO_ANALYSIS"]').waitFor({ timeout: 60_000 });
    expect(await noAnalysis.getByTestId("syntx-no-analysis").count()).toBe(1);
    expect(await noAnalysis.getByTestId("syntx-field").getAttribute("data-matching-delivered")).toBe("false");
    expect(await noAnalysis.locator('[data-testid^="syntx-role-"]').count()).toBe(view.canonicalMapping.roles.length);
    await noAnalysis.close();

    // NO_POOL: the pools aperture is the contextual action; the intake opens only on explicit action; an upload is persisted, listed and not selected; selection is explicit.
    const noPool = await open(`/career/demo?focus=FIELD&analysisId=${ANALYSIS_ID}`);
    await noPool.locator('[data-testid="syntx-field"][data-field-state="NO_POOL"]').waitFor({ timeout: 60_000 });
    expect(await noPool.getByTestId("syntx-no-pool").count()).toBe(1);
    expect(await noPool.getByTestId("syntx-field").getAttribute("data-pools-visible")).toBe("true");
    expect(await noPool.getByTestId("syntx-field").getAttribute("data-intake-visible")).toBe("false");
    await noPool.locator('[data-testid="job-pool-list"][data-pool-count="2"]').waitFor({ timeout: 60_000 });
    expect(await noPool.getByTestId(`job-pool-select-${uploadId}`).count()).toBe(1);
    expect(await noPool.getByTestId("job-pool-upload").isVisible()).toBe(false);
    await noPool.getByTestId("job-pool-intake-toggle").click();
    await noPool.getByTestId("job-pool-upload").waitFor({ state: "visible", timeout: 10_000 });
    expect(await noPool.getByTestId("job-pool-upload-btn").isDisabled()).toBe(true);
    const versionTwo = structuredClone(validationPool) as { pool: { version: number } };
    versionTwo.pool.version = validationPool.pool.version + 1;
    const poolPath = join(mkdtempSync(join(tmpdir(), "pink-syntx-pool-")), "pink-validation-pool-v2.json");
    writeFileSync(poolPath, JSON.stringify(versionTwo, null, 2));
    await noPool.getByTestId("job-pool-file-input").setInputFiles(poolPath);
    await noPool.getByTestId("job-pool-actor-input").fill("PINK_SYNTX_INTAKE");
    await noPool.locator('[data-testid="job-pool-upload-btn"]:not([disabled])').waitFor({ timeout: 10_000 });
    await noPool.getByTestId("job-pool-upload-btn").click();
    const result = noPool.locator('[data-testid="job-pool-upload-result"][data-upload-outcome="CREATED"]');
    await result.waitFor({ timeout: 60_000 });
    const versionTwoId = (await result.getAttribute("data-upload-id")) ?? "";
    expect(versionTwoId).toMatch(/^JPOOL_[0-9A-F]{32}$/);
    expect(await noPool.getByTestId("syntx-field").getAttribute("data-selected-pool")).toBe("");
    expect(await noPool.getByTestId("syntx-field").getAttribute("data-field-state")).toBe("NO_POOL");
    await noPool.locator('[data-testid="job-pool-list"][data-pool-count="3"]').waitFor({ timeout: 60_000 });
    expect((await (await fetch(`${base()}/api/career/job-pools/${versionTwoId}`)).json()).uploadedByActorRef).toBe("JOB_POOL_UPLOADER:PINK_SYNTX_INTAKE");
    await noPool.getByTestId(`job-pool-select-${versionTwoId}`).click();
    // URL BOUNDARY CLOSURE (owner 2026-10-15; GRÜN da59568): the analysis's persisted boundary is PERSON_X_JOB in the first upload, so in
    // the new version it is OTHER_POOL — the containment of the selected version is shown, nothing is compared (no matching delivered),
    // and the hint names the analysis's own pool without switching to it.
    await noPool.locator('[data-testid="syntx-field"][data-analysis-boundary="OTHER_POOL"][data-field-state="NO_ANALYSIS"][data-observation-kind="FIELD"]').waitFor({ timeout: 60_000 });
    expect(await noPool.getByTestId("syntx-field").getAttribute("data-matching-delivered")).toBe("false");
    expect(await noPool.getByTestId("syntx-analysis-boundary").getAttribute("data-boundary-state")).toBe("OTHER_POOL");
    expect(await noPool.getByTestId("syntx-analysis-boundary").getAttribute("data-analysis-pool")).toBe(uploadId);
    expect(params(noPool).get("jobPoolUploadId")).toBe(versionTwoId);
    expect(await noPool.getByTestId("syntx-field").getAttribute("data-observation-id")).toBe(versionTwoId);
    expect(await noPool.getByTestId("syntx-field").getAttribute("data-pools-visible")).toBe("false");
    expect(await noPool.getByTestId("syntx-pool").getAttribute("data-proof-upload-id")).toBe(versionTwoId);
    // B-JP-CONTINUITY: the new version is a new upload with new canonical entities; the first upload keeps its own.
    const versionTwoView = await (await fetch(`${base()}/api/career/job-pools/${versionTwoId}`)).json();
    expect(versionTwoView.canonicalMapping.roles.find((role: any) => role.poolRoleId === ROLE_ID).targetRoleOrganizationBindingRevisionId).not.toBe(mappedRole.targetRoleOrganizationBindingRevisionId);
    expect(await noPool.getByTestId(`syntx-role-${ROLE_ID}`).getAttribute("data-proof-target-id")).toBe(versionTwoView.canonicalMapping.roles.find((role: any) => role.poolRoleId === ROLE_ID).targetRoleOrganizationBindingRevisionId);
    expect((noPool as any).__nonGet.length).toBe(1);
    expect((noPool as any).__nonGet[0]).toMatch(/^POST .*\/api\/career\/job-pools$/);
    await settled(noPool);
    await noPool.screenshot({ path: resolve(EVIDENCE_DIR, "D-02-intake-persisted-then-selected.png") });
    await noPool.close();

    // DRAFT pool: containment without a matching read (every anchor UNREAD, no trace, no suspended boundary). Since the URL boundary
    // (da59568) the analysis is compared only in its own (ACTIVE) pool: in the DRAFT upload it is OTHER_POOL, no matches are read, and the
    // field shows NO_ANALYSIS with the hint to the own pool. INACTIVE_POOL ("POOL IS NOT ACTIVE") came from a 409 of the matches read and
    // is no longer reached on this path (observation O-SX-INACTIVE-NAMING; the server still refuses DRAFT × PERSON_X_JOB, PINK MB-2).
    const inactive = await open(`/career/demo?focus=FIELD&analysisId=${ANALYSIS_ID}&jobPoolUploadId=${draftId}&jobRoleId=${ROLE_ID}`);
    const inactiveRequests: string[] = [];
    inactive.on("request", (request: any) => inactiveRequests.push(request.url()));
    await inactive.locator('[data-testid="syntx-field"][data-analysis-boundary="OTHER_POOL"][data-field-state="NO_ANALYSIS"][data-observation-kind="ROLE"]').waitFor({ timeout: 60_000 });
    expect(await inactive.getByTestId("syntx-analysis-boundary").getAttribute("data-analysis-pool")).toBe(uploadId);
    expect(inactiveRequests.filter((url) => /\/matches(\?|$)/.test(url))).toEqual([]);
    expect(await inactive.getByTestId("syntx-field").getAttribute("data-matching-delivered")).toBe("false");
    expect(await inactive.locator('[data-testid^="syntx-requirement-"][data-support="UNREAD"]').count()).toBe(mappedRole.requirements.length);
    expect(await inactive.locator('[data-testid^="syntx-requirement-"][data-evaluation-state="NOT_EVALUATED"]').count()).toBe(0);
    expect(await inactive.locator('[data-testid^="syntx-trace-"]').count()).toBe(0);
    expect(await inactive.locator('[data-testid^="syntx-pending-"]').count()).toBe(0);
    expect(await inactive.locator('[data-testid^="syntx-open-"]').count()).toBe(0);
    expect(await inactive.getByTestId(`syntx-role-${ROLE_ID}`).getAttribute("data-matching-read")).toBe("false");
    await settled(inactive);
    await inactive.screenshot({ path: resolve(EVIDENCE_DIR, "D-08-draft-pool-unread.png") });
    await inactive.close();

    const notFound = await open(`/career/demo?focus=FIELD&analysisId=${ANALYSIS_ID}&jobPoolUploadId=JPOOL_${"0".repeat(32)}`);
    await notFound.locator('[data-testid="syntx-field"][data-field-state="NOT_FOUND"]').waitFor({ timeout: 60_000 });
    expect(await notFound.getByTestId("job-pool-selection-not-listed").count()).toBe(1);
    await notFound.close();

    // Stale observation ids are named and fall back to the parent level, never silently dropped (E-08).
    for (const [query, kind, id, fallback] of [[`jobRoleId=role_stale`, "ROLE", "role_stale", "FIELD"], [`jobRoleId=${ROLE_ID}&jobRequirementId=req_stale`, "REQUIREMENT", "req_stale", "ROLE"], [`jobOrganizationId=org_stale`, "ORGANIZATION", "org_stale", "FIELD"]] as const) {
      const stale = await open(`/career/demo?focus=FIELD&analysisId=${ANALYSIS_ID}&jobPoolUploadId=${uploadId}&${query}`);
      await stale.locator(`[data-testid="syntx-stale"][data-stale-kind="${kind}"][data-stale-id="${id}"]`).waitFor({ timeout: 120_000 });
      expect(await stale.getByTestId("syntx-field").getAttribute("data-observation-kind")).toBe(fallback);
      await stale.close();
    }
    // Legacy focus names open the one field (R11 aliases); an exact upload id without a focus opens it too (B-POOL-INITIAL-FOCUS).
    for (const query of ["focus=JOB&", "focus=POOL&", ""]) {
      const alias = await open(`/career/demo?${query}analysisId=${ANALYSIS_ID}&jobPoolUploadId=${uploadId}`);
      await alias.locator('[data-testid="syntx-field"][data-field-state="AVAILABLE"]').waitFor({ timeout: 60_000 });
      expect(await alias.getByTestId("semantic-career-intelligence-field").getAttribute("data-field-focus")).toBe("FIELD");
      await alias.close();
    }
    // B-SYNTX-FOCUS (GELB's question on the F-SX-1 repair): the focus-follow effect must not take focus away from the strip or the intake.
    const entry = await open(`/career/demo?analysisId=${ANALYSIS_ID}&jobPoolUploadId=${uploadId}&focus=CAPABILITY`);
    const activeOf = (p: any) => p.evaluate(() => { const a = document.activeElement; return a === null ? "null" : `${a.tagName.toLowerCase()}${a.getAttribute("data-testid") ? `#${a.getAttribute("data-testid")}` : ""}${a.getAttribute("data-sign-id") ? `[${a.getAttribute("data-sign-id")}]` : ""}`; });
    await entry.getByTestId("job-pool-panel-toggle").focus();
    await entry.keyboard.press("Enter");
    await entry.locator('[data-testid="syntx-field"][data-field-state="AVAILABLE"]').waitFor({ timeout: 60_000 });
    await entry.waitForTimeout(300);
    const afterEntry = await activeOf(entry);
    // Entering from the strip by keyboard: the strip button keeps focus (no observation change happened; the effect ran on mount with focus outside the root). Record the observed owner either way.
    await entry.getByTestId("job-pool-intake-toggle").focus();
    await entry.keyboard.press("Enter");
    await entry.getByTestId("job-pool-upload").waitFor({ state: "visible", timeout: 10_000 });
    await entry.getByTestId("job-pool-actor-input").focus();
    await entry.keyboard.type("PINK_KEYBOARD");
    await entry.waitForTimeout(300);
    const afterTyping = await activeOf(entry);
    expect(afterTyping).toBe("input#job-pool-actor-input");
    expect(await entry.getByTestId("job-pool-actor-input").evaluate((e: HTMLInputElement) => e.value)).toContain("PINK_KEYBOARD");
    // An observation change by pointer: the clicked sign takes focus natively (role=button), the intake stays open with its text; a return by Escape keeps focus inside the field.
    await entry.getByTestId("syntx-organization-org_pink_alpha").click({ position: await bottomOf(entry.getByTestId("syntx-organization-org_pink_alpha")) });
    await waitKind(entry, "ORGANIZATION");
    await entry.waitForTimeout(300);
    const afterObservation = await activeOf(entry);
    expect(afterObservation).toBe("div#syntx-organization-org_pink_alpha[org:org_pink_alpha]");
    expect(await entry.getByTestId("job-pool-upload").isVisible()).toBe(true);
    expect(await entry.getByTestId("job-pool-actor-input").evaluate((e: HTMLInputElement) => e.value)).toContain("PINK_KEYBOARD");
    await entry.keyboard.press("Escape");
    await entry.waitForTimeout(300);
    const afterEscape = await activeOf(entry);
    writeFileSync(resolve(EVIDENCE_DIR, "Q-08-focus-entry.txt"), `after keyboard entry from the strip (Enter on job-pool-panel-toggle): ${afterEntry}\nafter typing in the intake: ${afterTyping}\nafter a pointer observation change (native click focus on the sign): ${afterObservation}\nafter Escape (closes the intake first, R8): ${afterEscape}, observation ${await entry.getByTestId("syntx-field").getAttribute("data-observation-kind")}\n`);
    // Job Pool first (c146f05): focus=CAPABILITY without a valid job opens the Job Field, so Enter on its strip button selects the field
    // that is already active, which no longer toggles (field selector, P-6): the strip button keeps the focus — B-SYNTX-FOCUS asks exactly
    // that the focus-follow effect never takes focus away from the strip. (Before the gate the entry moved focus into the field root.)
    expect(await entry.getByTestId("semantic-career-intelligence-field").getAttribute("data-field-focus")).toBe("FIELD");
    expect(afterEntry).toBe("button#job-pool-panel-toggle");
    expect(afterEscape.startsWith("div#syntx-organization-org_pink_alpha") || afterEscape === "section#syntx-field").toBe(true);
    expect((entry as any).__nonGet).toEqual([]);
    await entry.close();
    pass("Q-states", { uploads: 3 }, "NO_ANALYSIS, NO_POOL + intake + explicit selection, the new version and the DRAFT pool as OTHER_POOL containment without a matching read, NOT_FOUND, three stale kinds, JOB/POOL aliases; strip and intake keep keyboard focus under the focus-follow effect");
    expect(pageErrors).toEqual([]);
  }, 600_000);
});
