import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { matches, summary, UPLOAD_ID, view } from "../job-pool/fixtures/match-bodies";
import { ANALYSIS, LEGACY_CAPABILITIES, LEGACY_NAMES, OTHER_ROLE, ROLE, UPLOAD, boundary, coverage, resultBody, scripted, selection } from "./fixtures";

/** PERSON × JOB · the first screen, server-rendered (owner G1): states (T-03), legacy (T-07), no number (T-08), placeholders (T-10), role level (T-11). */
const control = vi.hoisted(() => ({
  job: { state: "IDLE", activeJobId: null, resultAnalysisId: null, canonicalAnalysis: null, currentOperation: null, attemptCount: null, errorCode: null, errorSummary: null, httpStatus: null } as Record<string, unknown>,
  scope: { state: "NONE" } as Record<string, unknown>,
  boundary: { state: "IDLE" } as Record<string, unknown>,
  result: { state: "IDLE" } as Record<string, unknown>,
  coverage: { state: "IDLE" } as Record<string, unknown>,
  resultReads: [] as Array<string | null>,
  coverageReads: [] as Array<[string | null, unknown]>,
  bubbles: [] as Array<{ stageId: string; hideViewMatches: unknown }>
}));
vi.mock("../../../app/components/career/demo/OrbitalResonanceBubble", async (importOriginal) => {
  const original = await importOriginal<typeof import("../../../app/components/career/demo/OrbitalResonanceBubble")>();
  return { ...original, OrbitalResonanceBubble: (props: Parameters<typeof original.OrbitalResonanceBubble>[0]) => { control.bubbles.push({ stageId: props.stageId, hideViewMatches: props.hideViewMatches }); return original.OrbitalResonanceBubble(props); } };
});
vi.mock("../../../lib/career/ui/useCareerAnalysisJob", () => ({ useCareerAnalysisJob: () => ({ state: control.job, submitAnalysis: async () => undefined }) }));
vi.mock("../../../lib/career/ui/useJobScope", () => ({ useJobScopeValidation: () => control.scope }));
const idle = (selected: string | null) => ({ pools: { state: "IDLE" }, upload: { state: "IDLE" }, selectedJobPoolUploadId: selected, view: { state: "IDLE" }, matches: { state: "IDLE" }, submitUpload: async () => undefined, select: () => undefined, reloadPools: async () => undefined, reloadMatches: async () => undefined });
vi.mock("../../../lib/career/ui/useJobPool", async (importOriginal) => {
  const original = await importOriginal<typeof import("../../../lib/career/ui/useJobPool")>();
  return { ...original, useJobPoolWorkflow: (options: { analysisId: string | null; initialJobPoolUploadId?: string | null }) => options.initialJobPoolUploadId === "JPOOL_WITH_MATCHES" ? { ...idle(UPLOAD_ID), pools: { state: "AVAILABLE", jobPools: [summary] }, view: { state: "AVAILABLE", jobPoolUploadId: UPLOAD_ID, upload: view }, matches: options.analysisId === null ? { state: "IDLE" } : { state: "AVAILABLE", jobPoolUploadId: UPLOAD_ID, analysisId: "ANL_TEST", matches } } : idle(options.initialJobPoolUploadId ?? null) };
});
vi.mock("../../../lib/career/ui/useJobPoolSources", () => ({ useAnalysisSources: () => ({ state: "IDLE" }) }));
vi.mock("../../../lib/career/ui/useRoleInvestigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../lib/career/ui/useRoleInvestigation")>()),
  useAnalysisBoundary: (analysisId: string | null) => analysisId === null ? { state: "IDLE" } : control.boundary,
  useSelectedRoleCoverage: (analysisId: string | null, scope: unknown) => { control.coverageReads.push([analysisId, scope]); return analysisId === null ? { state: "IDLE" } : control.coverage; }
}));
vi.mock("../../../lib/career/ui/useAnalysisResult", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../lib/career/ui/useAnalysisResult")>()),
  useAnalysisResult: (analysisId: string | null) => { control.resultReads.push(analysisId); return analysisId === null ? { state: "IDLE" } : control.result; }
}));

import { SemanticCareerIntelligenceField } from "../../../app/components/career/demo/SemanticCareerIntelligenceField";
import { PxjFirstScreen } from "../../../app/components/career/demo/PxjFirstScreen";
import { EMPTY_CAREER_INTELLIGENCE_DATA } from "../../../app/career/demo/demo-data";
import { SIL_COPY, type SilLocale } from "../../../lib/career/view-model/sil-language";
import { decodeAnalysisResult, projectPxjFirstScreen, type FirstScreenInput, type PxjFirstScreen as Screen } from "../../../lib/career/view-model/pxj-first-screen";
import { readAnalysisResult } from "../../../lib/career/ui/useAnalysisResult";
import { readSelectedRoleCoverage } from "../../../lib/career/ui/useRoleInvestigation";
import { readAnalysisInvestigation } from "../../../lib/career/investigation/client";

const tag = (html: string, testId: string): string => { const at = html.indexOf(`data-testid="${testId}"`); return at < 0 ? "" : html.slice(html.lastIndexOf("<", at), html.indexOf(">", at) + 1); };
const VALID = { state: "VALID", scope: selection, roleTitle: "Distributed Systems Architect", organizationId: "org_pink_alpha", organizationName: "Alpha Industrial Systems", poolName: "PINK pool" };
const accepted = () => { const decoded = decodeAnalysisResult(resultBody(), ANALYSIS); if (!decoded.ok) throw new Error(decoded.code); return decoded.result; };
const field = (props: Record<string, unknown> = {}) => renderToString(<SemanticCareerIntelligenceField data={EMPTY_CAREER_INTELLIGENCE_DATA} fieldFocus="CAPABILITY" analysisId={ANALYSIS} {...props} />);
const LEGACY_STAGES = ["03", "04", "05", "06"];

beforeEach(() => {
  control.job = { state: "IDLE", activeJobId: null, resultAnalysisId: null, canonicalAnalysis: null, currentOperation: null, attemptCount: null, errorCode: null, errorSummary: null, httpStatus: null };
  control.scope = VALID;
  control.boundary = { state: "RESOLVED", value: boundary() };
  control.result = { state: "AVAILABLE", result: accepted() };
  control.coverage = { state: "AVAILABLE", coverage: coverage() };
  control.resultReads = []; control.coverageReads = []; control.bubbles = [];
  vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("no fetch during render"); }));
});
afterEach(() => { vi.unstubAllGlobals(); });

/* ---------------------------------------------------------------- T-03 · every state from fetcher stubs */

const BASE = `/api/career/analyses/${ANALYSIS}`;
const B2_URL = `${BASE}/job-comparison?jobPoolUploadId=${UPLOAD}&poolRoleId=${ROLE}`;
const issue = (code: string, extra: Record<string, unknown> = {}) => ({ success: false, issues: [{ code, ...extra }] });

/** Runs the real read functions over one scripted fetcher and projects their states, exactly as the hooks feed the field. */
async function stateFrom(routes: Record<string, { status: number; body: unknown }>, overrides: Partial<FirstScreenInput> = {}) {
  const spy = scripted({
    [BASE]: { status: 200, body: resultBody() },
    [`${BASE}/investigation`]: { status: 200, body: { success: true, investigation: boundary() } },
    [B2_URL]: { status: 200, body: { success: true, comparison: coverage() } },
    ...routes
  });
  const result = await readAnalysisResult(ANALYSIS, spy.fetcher);
  const investigation = await readAnalysisInvestigation(spy.fetcher, ANALYSIS);
  const b2 = await readSelectedRoleCoverage(ANALYSIS, selection, spy.fetcher);
  const screen = projectPxjFirstScreen({ mode: "PERSON_X_JOB", analysisId: ANALYSIS, result, boundary: investigation, selection, coverage: b2, ...overrides });
  return { screen, calls: spy.calls };
}
const render = (screen: Screen, locale: SilLocale = "en", mode: "PERSON" | "PERSON_X_JOB" = "PERSON_X_JOB") => renderToString(<PxjFirstScreen screen={screen} mode={mode} locale={locale} onSwitchMode={() => undefined} onSelectRole={() => undefined} />);

describe("T-03 · every closed state of §04, from fetcher stubs, server-rendered with its testid and its statement", () => {
  const cases: Array<[string, Record<string, { status: number; body: unknown }>, Partial<FirstScreenInput>]> = [
    ["RESULT_NOT_FOUND", { [BASE]: { status: 404, body: issue("ERR_ANALYSIS_NOT_FOUND") } }, {}],
    ["RESULT_FAILED", { [BASE]: { status: 500, body: issue("ERR_SERVER_FATAL") } }, {}],
    ["RESULT_FAILED", { [BASE]: { status: 200, body: resultBody({ status: "PENDING" }) } }, {}],
    ["BOUNDARY_UNRESOLVED", { [`${BASE}/investigation`]: { status: 409, body: issue("ERR_ANALYSIS_INVESTIGATION_UNRESOLVED", { reason: "NOT_RECORDED" }) } }, {}],
    ["BOUNDARY_NOT_FOUND", { [`${BASE}/investigation`]: { status: 404, body: issue("ERR_ANALYSIS_INVESTIGATION_NOT_FOUND") } }, {}],
    ["BOUNDARY_FAILED", { [`${BASE}/investigation`]: { status: 500, body: issue("ERR_SERVER_FATAL") } }, {}],
    ["MODE_MISMATCH", { [`${BASE}/investigation`]: { status: 200, body: { success: true, investigation: boundary({ mode: "PERSON", jobScopeSelection: null, investigationScopeHash: null }) } } }, {}],
    ["ROLE_MISMATCH", {}, { selection: { jobPoolUploadId: UPLOAD, poolRoleId: OTHER_ROLE } }],
    ["ROLE_MISMATCH", {}, { selection: null }],
    ["NO_PROJECTION", { [BASE]: { status: 200, body: resultBody({ capabilityProposalProjection: null }) } }, {}],
    ["COVERAGE_NOT_SCOPED", { [B2_URL]: { status: 409, body: issue("ERR_JOB_COMPARISON_NOT_SCOPED") } }, {}],
    ["COVERAGE_SCOPE_MISMATCH", { [B2_URL]: { status: 409, body: issue("ERR_JOB_COMPARISON_SCOPE_MISMATCH") } }, {}],
    ["COVERAGE_SCOPE_DRIFT", { [B2_URL]: { status: 409, body: issue("ERR_JOB_COMPARISON_SCOPE_DRIFT") } }, {}],
    ["COVERAGE_SCOPE_UNAVAILABLE", { [B2_URL]: { status: 409, body: issue("ERR_JOB_COMPARISON_SCOPE_UNAVAILABLE") } }, {}],
    ["COVERAGE_LINEAGE_INVALID", { [B2_URL]: { status: 409, body: issue("ERR_JOB_COMPARISON_LINEAGE_INVALID") } }, {}],
    ["COVERAGE_NOT_FOUND", { [B2_URL]: { status: 404, body: issue("ERR_JOB_COMPARISON_ANALYSIS_NOT_FOUND") } }, {}],
    ["COVERAGE_NOT_PROVISIONED", { [B2_URL]: { status: 503, body: issue("ERR_JOB_POOL_PERSISTENCE_NOT_PROVISIONED") } }, {}],
    ["COVERAGE_FAILED", { [B2_URL]: { status: 500, body: issue("ERR_SERVER_FATAL") } }, {}],
    ["LINEAGE_MISMATCH", { [B2_URL]: { status: 200, body: { success: true, comparison: { ...coverage(), binding: { ...coverage().binding, discoveryRunId: "RUN_B" } } } } }, {}],
    ["AVAILABLE", {}, {}]
  ];
  for (const [expected, routes, overrides] of cases) {
    it(`${expected}${overrides.selection === null ? " (no job selected)" : ""}`, async () => {
      const { screen, calls } = await stateFrom(routes, overrides);
      expect(screen.state).toBe(expected);
      for (const locale of ["en", "de"] as const) {
        const html = render(screen, locale);
        const statement = tag(html, "pxj-first-state");
        expect(statement).toContain(`data-state="${expected}"`);
        const states = SIL_COPY[locale].pxjFirst.states;
        expect(html).toContain(expected === "ROLE_MISMATCH" && overrides.selection === null ? states.ROLE_NONE : states[expected as keyof typeof states]);
        // No other source steps in: coverage only in AVAILABLE; no proposals or coverage of this analysis where its state says no.
        expect(html.includes('data-testid="pxj-first-coverage"')).toBe(expected === "AVAILABLE");
      }
      // The spy: GET no-store only, never the legacy matching or the Gemini inspector routes.
      expect(calls.every(call => call.method === "GET" && call.cache === "no-store")).toBe(true);
      expect(calls.some(call => /\/matches|gemini-result|gemini-exchanges/.test(call.url))).toBe(false);
    });
  }

  it("the loading states and NO_ANALYSIS have their own statements", () => {
    const pending: Screen[] = [{ state: "NO_ANALYSIS" }, { state: "RESULT_LOADING", analysisId: ANALYSIS }, { state: "BOUNDARY_RESOLVING", analysisId: ANALYSIS }, { state: "COVERAGE_LOADING", analysisId: ANALYSIS, result: accepted(), proposals: [], code: null }];
    for (const screen of pending) for (const locale of ["en", "de"] as const) {
      const html = render(screen, locale);
      expect(tag(html, "pxj-first-state")).toContain(`data-state="${screen.state}"`);
      expect(html).toContain(SIL_COPY[locale].pxjFirst.states[screen.state as keyof typeof SIL_COPY.en.pxjFirst.states]);
    }
  });

  it("MODE_MISMATCH offers the switch, ROLE_MISMATCH the analysis's own job: explicit actions only", async () => {
    const mode = render((await stateFrom({ [`${BASE}/investigation`]: { status: 200, body: { success: true, investigation: boundary({ mode: "PERSON", jobScopeSelection: null, investigationScopeHash: null }) } } })).screen);
    expect(tag(mode, "pxj-first-switch-mode")).toContain('data-target-mode="PERSON"');
    const role = render((await stateFrom({}, { selection: { jobPoolUploadId: UPLOAD, poolRoleId: OTHER_ROLE } })).screen);
    expect(tag(role, "pxj-first-select-role")).toContain(`data-pool-role="${ROLE}"`);
    expect(role).not.toContain('data-testid="pxj-first-coverage"');
  });

  it("AVAILABLE: binding, rows in pool order, quotes verbatim with their source, the boundary statement permanently beside it", async () => {
    for (const locale of ["en", "de"] as const) {
      const html = render((await stateFrom({})).screen, locale);
      const c = SIL_COPY[locale].pxjFirst;
      expect(tag(html, "pxj-first-coverage")).toMatch(new RegExp(`data-scored="false"[^>]*data-relation-state="NOT_EVALUATED"[^>]*data-binding-analysis="${ANALYSIS}"[^>]*data-binding-upload="${UPLOAD}"[^>]*data-binding-role="${ROLE}"`));
      expect(html).toContain(c.boundary.join(" · "));
      expect(tag(html, "pxj-first-coverage-boundary")).toBeTruthy();
      for (const statement of c.boundary) expect(html).toContain(statement);
      const rows = [...html.matchAll(/data-testid="pxj-first-req-([^"]+)"/g)].map(match => match[1]);
      expect(rows).toEqual(["req_pink_alpha_1", "req_pink_alpha_2", "req_pink_alpha_3"]);
      expect(tag(html, "pxj-first-req-req_pink_alpha_1")).toMatch(/data-coverage="COVERED"[^>]*data-match-basis="EXACT"[^>]*data-proposal-id="CAPP_1"/);
      expect(tag(html, "pxj-first-req-req_pink_alpha_3")).toMatch(/data-coverage="NOT_COVERED"[^>]*data-match-basis=""[^>]*data-proposal-id=""/);
      expect(tag(html, "pxj-first-quote-req_pink_alpha_1-0")).toMatch(/data-doc-id="DOC_001"[^>]*data-quote-in-projection="true"[^>]*data-source-resolved="true"[^>]*data-verified="true"/);
      expect(html).toMatch(/<p data-pxj-quote[^>]*>“(<!-- -->)?Architected distributed IIoT Edge Computing systems with 99\.999% uptime guarantees\.(<!-- -->)?”<\/p>/);
      expect(html).toContain("Synthetic profile.pdf");
      expect(html).toContain(c.quoteVerified);
      expect(html).toContain(c.weak);
      expect(tag(html, "pxj-first-counts")).toBeTruthy();
      expect(region(html, "pxj-first-counts").replace(/<!-- -->/g, "")).toContain(`2 ${c.counts.covered} · 1 ${c.counts.notCovered} · 3 ${c.counts.requirements}`);
    }
  });
});

/* ---------------------------------------------------------------- T-07 / T-08 / T-10 · the field */

/** Visible text: tags removed; quote nodes and the mandated statements (P-07 boundary, the verified mark) taken out first. */
function visibleText(html: string): string {
  return html
    .replace(/<style>[\s\S]*?<\/style>/g, " ")
    .replace(/<p data-pxj-quote[^>]*>[\s\S]*?<\/p>/g, " ")
    .replace(/<span data-pxj-quote-verified[^>]*>[\s\S]*?<\/span>/g, " ")
    .replace(/<div data-testid="pxj-first-coverage-boundary"[^>]*>[\s\S]*?<\/div>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ");
}
const region = (html: string, testId: string) => { const start = html.indexOf(`data-testid="${testId}"`); if (start < 0) return ""; const open = html.lastIndexOf("<", start); const name = html.slice(open + 1, html.indexOf(" ", open)); let depth = 0; const re = new RegExp(`<(/?)${name}[\\s>]`, "g"); re.lastIndex = open; for (let m = re.exec(html); m; m = re.exec(html)) { depth += m[1] ? -1 : 1; if (depth === 0) return html.slice(open, html.indexOf(">", m.index) + 1); } return html.slice(open); };
const FORBIDDEN = /%|\bscor|\brank|resonan|\bfit\b|\bfits\b|\bmatch|confidence|contribution|eignung|passt/i;

describe("T-07 · legacy orbits under PERSON × JOB", () => {
  it("PERSON × JOB: orbits 01 and 02 only; no orbit, ray, coupling, VIEW MATCHES, inspector node or text of 03 … 06", () => {
    const html = field();
    expect(tag(html, "pxj-first-screen")).toContain('data-state="AVAILABLE"');
    for (const stage of ["01", "02"]) expect(html).toContain(`data-testid="focus-transition-stage-shell-${stage}"`);
    for (const stage of LEGACY_STAGES) {
      expect(html).not.toContain(`data-testid="focus-transition-stage-shell-${stage}"`);
      expect(html).not.toContain(`data-testid="energy-ray-${stage}"`);
    }
    expect(html).not.toContain('data-testid="inter-orbital-coupling"');
    expect(control.bubbles.map(bubble => [bubble.stageId, bubble.hideViewMatches])).toEqual([["01", true], ["02", true]]);
    for (const name of LEGACY_NAMES) expect(html).not.toContain(name);
    expect(region(html, "decision-graph-inspector-idle") + region(html, "decision-graph-inspector")).not.toMatch(/ORG_L1|ROLE_L1|STR_L1/);
    // The proposals and the persisted source are there.
    expect(html).toContain("Distributed Systems Architecture");
    expect(html).toContain("Synthetic profile.pdf");
  });

  // RD-5 (owner D-RD-5 = B): under PERSON role discovery replaces the legacy orbits — the same absence as under PERSON × JOB. The
  // legacy items were organisations (analysis.organizations), roles with their legacy fit score (analysis.roles), no gaps and next
  // actions (analysis.strategies), all from the legacy result through lib/career/ui-adapter.ts.
  it("PERSON: orbits 01 and 02 only, VIEW MATCHES on them as on the base; no orbit, ray, coupling, inspector node or text of 03 … 06; the PERSON result shown", () => {
    control.boundary = { state: "RESOLVED", value: boundary({ mode: "PERSON", jobScopeSelection: null, investigationScopeHash: null }) };
    const html = field({ investigationMode: "PERSON" });
    for (const stage of ["01", "02"]) expect(html).toContain(`data-testid="focus-transition-stage-shell-${stage}"`);
    for (const stage of LEGACY_STAGES) {
      expect(html).not.toContain(`data-testid="focus-transition-stage-shell-${stage}"`);
      expect(html).not.toContain(`data-testid="energy-ray-${stage}"`);
    }
    expect(html).not.toContain('data-testid="inter-orbital-coupling"');
    expect(control.bubbles.map(bubble => [bubble.stageId, bubble.hideViewMatches])).toEqual([["01", false], ["02", false]]);
    for (const name of LEGACY_NAMES) expect(html).not.toContain(name);
    expect(region(html, "decision-graph-inspector-idle") + region(html, "decision-graph-inspector")).not.toMatch(/ORG_L1|ROLE_L1|STR_L1/);
    expect(html).not.toContain('data-testid="pxj-first-screen"');
    // The PERSON result is shown on 01 and 02 as on the base: its source (one item) and its capabilities (three items).
    expect(html.match(/\b1 items/g)?.length).toBe(1);
    expect(html.match(/\b3 items/g)?.length).toBe(1);
  });

  it("a legacy stage requested by focus is not shown under PERSON", () => {
    control.boundary = { state: "RESOLVED", value: boundary({ mode: "PERSON", jobScopeSelection: null, investigationScopeHash: null }) };
    for (const stageId of LEGACY_STAGES) {
      const html = field({ investigationMode: "PERSON", initialFocus: { stageId, zoomLevel: 1 } });
      expect(html).toContain('data-focused-stage-id=""');
      expect(html).toContain('data-zoom-level="0"');
    }
  });

  it("a legacy stage requested by focus is not shown under PERSON × JOB", () => {
    const html = field({ initialFocus: { stageId: "04", zoomLevel: 1 } });
    expect(html).toContain('data-focused-stage-id=""');
    expect(html).toContain('data-zoom-level="0"');
  });
});

describe("D-G1-1 · VIEW MATCHES (owner: only the optional prop hideViewMatches)", () => {
  it("the open HUD renders the action without the prop, exactly as before, and not at all with it", async () => {
    const { OrbitalResonanceBubble } = await vi.importActual<typeof import("../../../app/components/career/demo/OrbitalResonanceBubble")>("../../../app/components/career/demo/OrbitalResonanceBubble");
    const bubble = (props: Record<string, unknown>) => renderToString(<OrbitalResonanceBubble stageId="02" stageName="⬡ CAPABILITY FIELD" subtitle="s" itemCount={3} previewItems={["a"]} isHovered {...props} />);
    const without = bubble({});
    expect(without).toContain('data-testid="hud-action-view-matches"');
    expect(bubble({ hideViewMatches: false })).toBe(without);
    const hidden = bubble({ hideViewMatches: true });
    expect(hidden).not.toContain('data-testid="hud-action-view-matches"');
    expect(hidden).not.toMatch(/VIEW MATCHES/i);
    expect(hidden).toContain('data-testid="hud-action-open-evidence"');
    expect(without.replace(/<button[^>]*data-testid="hud-action-view-matches"[^>]*>[\s\S]*?<\/button>/, "")).toBe(hidden);
  });
});

describe("PINK D-G1-P1 · NO_PROJECTION under PERSON × JOB: no legacy capability anywhere", () => {
  const noProjection = () => { const decoded = decodeAnalysisResult(resultBody({ capabilityProposalProjection: null }), ANALYSIS); if (!decoded.ok) throw new Error(decoded.code); control.result = { state: "AVAILABLE", result: decoded.result }; };
  it("L0, orbit 02 cosmos (zoom 1) and orbit 02 at zoom 2: no legacy name, no %, orbit 02 counts nothing; the panel says so", () => {
    noProjection();
    for (const props of [{}, { initialFocus: { stageId: "02", zoomLevel: 1 } }, { initialFocus: { stageId: "02", zoomLevel: 2 } }]) {
      const html = field(props);
      expect(tag(html, "pxj-first-screen")).toContain('data-state="NO_PROJECTION"');
      for (const name of [...LEGACY_CAPABILITIES, ...LEGACY_NAMES]) expect(html, `${name} ${JSON.stringify(props)}`).not.toContain(name);
      expect(html).not.toContain("CAP_00");
      expect(visibleText(html.replace(/<p data-pxj-quote[^>]*>[\s\S]*?<\/p>/g, " ")).match(/\d+\s*%/)).toBeNull();
      expect(visibleText(region(html, "focus-transition-stage-shell-02"))).toMatch(/\b0 items\b/);
      expect(region(html, "decision-graph-inspector-idle") + region(html, "decision-graph-inspector")).not.toMatch(/CAP_00|Legacy/);
    }
  });

  it("under PERSON a PERSON analysis without a projection keeps today's legacy capabilities (unchanged)", () => {
    noProjection();
    control.boundary = { state: "RESOLVED", value: boundary({ mode: "PERSON", jobScopeSelection: null, investigationScopeHash: null }) };
    expect(visibleText(region(field({ investigationMode: "PERSON" }), "focus-transition-stage-shell-02"))).toMatch(/\b2 items\b/);
  });
});

describe("T-08 · no score and no new number under PERSON × JOB", () => {
  it("the Capability Field's first screen (planetarium, inspector, first screen) carries no forbidden word outside quotes and the mandated statements", () => {
    for (const locale of ["en", "de"] as const) {
      const html = field({ initialLocale: locale });
      for (const testId of ["pxj-first-screen", "identity-core-wrapper", "focus-transition-stage-shell-01", "focus-transition-stage-shell-02", "decision-graph-inspector-idle"]) {
        const text = visibleText(region(html, testId));
        expect(text.match(FORBIDDEN)?.[0] ?? null, `${locale} ${testId}`).toBeNull();
      }
      // Numbers on the first screen come only from B2's counts.
      const numbers = visibleText(region(html, "pxj-first-screen").replace(/<(span|strong|button) [^>]*data-pxj-declared[^>]*>[\s\S]*?<\/\1>/g, " ")).replace(/\bB2\b|ANL_\d+_\d+|DOC_\d+/g, " ").match(/\d+(?:[.,]\d+)?/g) ?? [];
      expect(numbers.sort()).toEqual(["1", "2", "3"]);
    }
  });
});

describe("T-10 · placeholders are never shown as a title or a hash", () => {
  it("without a delivered title or hash: neither HASH- nor Unknown Document, in every mode", () => {
    const body = resultBody();
    body.analysis.structured_data.analysis.documents = [{ entity_id: "DOC_001", identity: undefined as unknown as { name: string }, properties: undefined as unknown as { hash_sha256: string } }];
    const decoded = decodeAnalysisResult(body, ANALYSIS);
    if (!decoded.ok) throw new Error(decoded.code);
    control.result = { state: "AVAILABLE", result: decoded.result };
    for (const mode of ["PERSON_X_JOB", "PERSON"] as const) {
      if (mode === "PERSON") control.boundary = { state: "RESOLVED", value: boundary({ mode: "PERSON", jobScopeSelection: null, investigationScopeHash: null }) };
      for (const props of [{}, { initialFocus: { stageId: "01", zoomLevel: 1 } }]) {
        const html = field({ investigationMode: mode, ...props });
        expect(html).not.toContain("HASH-");
        expect(html).not.toContain("Unknown Document");
      }
    }
  });
});

describe("reads: the session's own result has precedence; B2 only for the analysis's own job on the Capability Field", () => {
  it("a session result is decoded, not read again; a URL analysis is read; nothing fetched during render", () => {
    control.job = { ...control.job, state: "SUCCEEDED", resultAnalysisId: ANALYSIS, canonicalAnalysis: resultBody() };
    const session = field({ analysisId: undefined });
    expect(tag(session, "pxj-first-screen")).toContain('data-state="AVAILABLE"');
    expect(control.resultReads.every(read => read === null)).toBe(true);
    control.job = { ...control.job, state: "IDLE", resultAnalysisId: null, canonicalAnalysis: null };
    control.resultReads = [];
    field();
    expect(control.resultReads).toContain(ANALYSIS);
    expect(control.coverageReads.some(([analysisId, scope]) => analysisId === ANALYSIS && JSON.stringify(scope) === JSON.stringify(selection))).toBe(true);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("a session result for another job: ROLE_MISMATCH, its proposals not on the field (the in-session behaviour change)", () => {
    control.job = { ...control.job, state: "SUCCEEDED", resultAnalysisId: ANALYSIS, canonicalAnalysis: resultBody() };
    control.scope = { ...VALID, scope: { jobPoolUploadId: UPLOAD, poolRoleId: OTHER_ROLE } };
    const html = field({ analysisId: undefined });
    expect(tag(html, "pxj-first-screen")).toContain('data-state="ROLE_MISMATCH"');
    expect(html).not.toContain("Distributed Systems Architecture");
    expect(html).not.toContain("Synthetic profile.pdf");
    expect(control.coverageReads.every(([analysisId]) => analysisId === null)).toBe(true);
  });

  it("the Job Field reads no B2 for the first screen and offers the analysis's job when none is selected", () => {
    control.scope = { state: "NONE" };
    const html = renderToString(<SemanticCareerIntelligenceField data={EMPTY_CAREER_INTELLIGENCE_DATA} fieldFocus="FIELD" analysisId={ANALYSIS} />);
    expect(control.coverageReads.every(([analysisId]) => analysisId === null)).toBe(true);
    expect(tag(html, "pxj-analysis-job-offer")).toContain('data-state="ROLE_MISMATCH"');
    expect(tag(html, "pxj-analysis-job-offer")).toContain('data-sx-shell="pxj-offer"');
    expect(html).toContain(ROLE);
  });

  it("an unknown analysisId: RESULT_NOT_FOUND, no data of any analysis", () => {
    control.result = { state: "NOT_FOUND" };
    const html = field({ analysisId: "ANL_DOES_NOT_EXIST" });
    expect(tag(html, "pxj-first-screen")).toContain('data-state="RESULT_NOT_FOUND"');
    expect(html).toContain("ANL_DOES_NOT_EXIST");
    expect(html).not.toContain("Distributed Systems Architecture");
  });
});

/* ---------------------------------------------------------------- T-11 · the role level is unchanged, only disclosed */

/** Every tag of the role level's signs with all its data-* attributes and its testid, in document order. */
export function roleLevelSignature(html: string): string[] {
  return [...html.matchAll(/<[a-z]+ [^>]*data-testid="(syntx-requirement-|syntx-trace-|syntx-open-|syntx-source-)[^"]*"[^>]*>/g)].map(match => [...match[0].matchAll(/ (data-[a-z-]+)="([^"]*)"/g)].map(attribute => `${attribute[1]}=${attribute[2]}`).join(" "));
}

describe("T-11 · the role level in the Job Field under PERSON × JOB", () => {
  it("signs, traces, open boundaries and sources keep every testid and data-* attribute of 49e2bc6; new is only the disclosure with its text", async () => {
    control.boundary = { state: "RESOLVED", value: { investigationVersion: "ANALYSIS_INVESTIGATION_V1", analysisId: "ANL_TEST", jobId: "JOB_TEST", mode: "PERSON_X_JOB", jobScopeSelection: { jobPoolUploadId: UPLOAD_ID, poolRoleId: "ROLE_A" }, basis: "JOB_DECLARATION", discoveryRunId: null, investigationScopeHash: null } };
    control.scope = { state: "NONE" };
    const { readFileSync } = await import("node:fs");
    const base = JSON.parse(readFileSync(new URL("./fixtures/role-level-49e2bc6.json", import.meta.url), "utf8")) as Record<string, string[]>;
    for (const [name, props] of Object.entries({ role: { jobRoleId: "ROLE_A" }, requirement: { jobRoleId: "ROLE_A", jobRequirementId: "REQ_1" } })) {
      const html = renderToString(<SemanticCareerIntelligenceField data={EMPTY_CAREER_INTELLIGENCE_DATA} fieldFocus="FIELD" jobPoolUploadId="JPOOL_WITH_MATCHES" analysisId="ANL_TEST" {...props} />);
      expect(roleLevelSignature(html), name).toEqual(base[name]);
      expect(base[name].length, name).toBeGreaterThan(0);
      const disclosure = region(html, "syntx-legacy-disclosure");
      for (const line of Object.values(SIL_COPY.en.syntx.legacyDisclosure)) expect(disclosure).toContain(line.replace(/&/g, "&amp;"));
    }
    // PERSON and JOB: no disclosure.
    for (const mode of ["PERSON", "JOB"]) expect(renderToString(<SemanticCareerIntelligenceField data={EMPTY_CAREER_INTELLIGENCE_DATA} fieldFocus="FIELD" jobPoolUploadId="JPOOL_WITH_MATCHES" analysisId="ANL_TEST" jobRoleId="ROLE_A" investigationMode={mode} />)).not.toContain("syntx-legacy-disclosure");
  });
});
