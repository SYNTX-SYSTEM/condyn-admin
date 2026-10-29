import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { browser, find, instance } from "./harness";
import { careerDemoPropsFromSearchParams, careerDemoSearchParamsFromSearch } from "../../../lib/career/ui/career-demo-url";
import { PERSON_ANALYSIS, STANDIN_ENGINE, UPLOAD_ALPHA, UPLOAD_ZETA, plannedBody, storedInvestigation } from "./discovery-fixtures";
import { ANALYSIS, boundary, resultBody } from "./fixtures";

/**
 * F-RI-1 / O-RI-1 / O-RI-3 / O-RI-4 (PINK §3.76, 150966a): once a stored investigation is known, the semantic line is the plan's
 * own — freshly re-read after it, never the pre-run numbers — with that investigation's real status; "not executed" never stands
 * beside a completed/partial status. The field re-reads the plan itself (one GET) the moment an investigation becomes known, from
 * either a completed POST or the mount/reload GET (O-RI-1). The picks and their pre-run call count are stale once stored: cleared,
 * so START is inert until the user ticks again (O-RI-4). While no investigation is named in this view, the tail never claims the
 * check "never ran" globally — only that none is named here, even though the (global, engine-keyed) relation cache may already
 * hold relations from an earlier investigation (O-RI-3).
 */
const control = vi.hoisted(() => ({ job: null as unknown, boundary: null as unknown, result: null as unknown }));
vi.mock("react", async (importOriginal) => (await import("./harness")).mockReact(await importOriginal<object>()));
vi.mock("../../../lib/career/ui/useCareerAnalysisJob", () => ({ useCareerAnalysisJob: () => ({ state: control.job, submitAnalysis: async () => undefined, resumeJob: () => undefined }) }));
vi.mock("../../../lib/career/ui/useJobScope", () => ({ useJobScopeValidation: () => ({ state: "NONE" }) }));
vi.mock("../../../lib/career/ui/useJobPoolSources", () => ({ useAnalysisSources: () => ({ state: "IDLE" }) }));
vi.mock("../../../lib/career/ui/useJobPool", async (importOriginal) => ({ ...(await importOriginal<typeof import("../../../lib/career/ui/useJobPool")>()), useJobPoolWorkflow: () => ({ pools: { state: "AVAILABLE", jobPools: [] }, upload: { state: "IDLE" }, selectedJobPoolUploadId: null, view: { state: "IDLE" }, matches: { state: "IDLE" }, submitUpload: async () => undefined, select: () => undefined, reloadPools: async () => undefined, reloadMatches: async () => undefined }) }));
vi.mock("../../../lib/career/ui/useRoleInvestigation", async (importOriginal) => ({ ...(await importOriginal<typeof import("../../../lib/career/ui/useRoleInvestigation")>()), useAnalysisBoundary: (id: string | null) => id === null ? { state: "IDLE" } : control.boundary, useSelectedRoleCoverage: () => ({ state: "IDLE" }) }));
vi.mock("../../../lib/career/ui/useAnalysisResult", async (importOriginal) => ({ ...(await importOriginal<typeof import("../../../lib/career/ui/useAnalysisResult")>()), useAnalysisResult: (id: string | null) => id === null ? { state: "IDLE" } : control.result }));

import { SemanticCareerIntelligenceField } from "../../../app/components/career/demo/SemanticCareerIntelligenceField";
import { RoleDiscoveryPanel } from "../../../app/components/career/demo/RoleDiscoveryPanel";
import { EMPTY_CAREER_INTELLIGENCE_DATA } from "../../../app/career/demo/demo-data";
import { decodeRoleDiscovery, type RoleDiscoveryState } from "../../../lib/career/ui/role-discovery";
import { decodeAnalysisResult } from "../../../lib/career/view-model/pxj-first-screen";

const BASE = "http://127.0.0.1/career/demo";
const POOLS = [UPLOAD_ALPHA, UPLOAD_ZETA];
const RELEASED = `focus=CAPABILITY&investigationMode=PERSON&analysisId=${ANALYSIS}&discoveryPoolUploadId=${UPLOAD_ALPHA}&discoveryPoolUploadId=${UPLOAD_ZETA}`;
const IDLE_JOB = { state: "IDLE", activeJobId: null, resultAnalysisId: null, canonicalAnalysis: null, currentOperation: null, attemptCount: null, errorCode: null, errorSummary: null, httpStatus: null };
const flush = async () => { for (let i = 0; i < 12; i += 1) await Promise.resolve(); };
const PANEL_POOLS = POOLS.map((id, at) => ({ jobPoolUploadId: id, poolId: `p${at}`, poolVersion: 1, poolName: at ? "Zeta Pool" : "Alpha Pool", poolStatus: "ACTIVE", organizationCount: 1, roleCount: 1, requirementCount: 1, uploadedByActorRef: "a", uploadedAt: "2026-10-24T00:00:00.000Z" }));
const decode = (discovery: unknown) => decodeRoleDiscovery(discovery, PERSON_ANALYSIS, POOLS);
const available = (discovery: unknown): RoleDiscoveryState => ({ state: "AVAILABLE", discovery: decode(discovery)! });
const panel = (discovery: RoleDiscoveryState, extra: Record<string, unknown> = {}) => renderToString(<RoleDiscoveryPanel locale="de" pools={{ state: "AVAILABLE", jobPools: PANEL_POOLS as never }} released={POOLS} discovery={discovery} onRelease={() => undefined} onClose={() => undefined} {...extra} />);
const visibleText = (html: string) => html.replace(/<style[\s\S]*?<\/style>/g, " ").replace(/<!-- -->/g, "").replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/g, " ").replace(/\s+/g, " ");

let calls: Array<{ method: string; url: string; body?: string }> = [];
let preRun: Awaited<ReturnType<typeof plannedBody>>;
let postRun: Awaited<ReturnType<typeof plannedBody>>;
let answer: { status: number; body: unknown } = { status: 201, body: null };
beforeEach(async () => {
  preRun = await plannedBody(0, 2);
  postRun = await plannedBody(1, 2); // after the run, the role's pairs are cached — the fixture's own producer, not a guess.
  const decoded = decodeAnalysisResult(resultBody(), ANALYSIS);
  if (!decoded.ok) throw new Error(decoded.code);
  control.job = IDLE_JOB;
  control.boundary = { state: "RESOLVED", value: boundary({ mode: "PERSON", jobScopeSelection: null, investigationScopeHash: null }) };
  control.result = { state: "AVAILABLE", result: decoded.result };
  calls = [];
  vi.stubGlobal("fetch", async (url: string, init: { method: string; body?: string }) => {
    calls.push({ method: init.method, url });
    if (init.method === "POST") return { status: answer.status, json: async () => answer.body };
    const body = calls.filter(c => c.method === "GET" && c.url.includes("role-discovery?")).length <= 1 ? preRun : postRun;
    return { status: 200, json: async () => ({ ...body, discovery: { ...body.discovery, analysis: { ...body.discovery.analysis, analysisId: ANALYSIS } } }) };
  });
  vi.stubGlobal("localStorage", { getItem: () => "1", setItem: () => undefined });
});
afterEach(() => { vi.unstubAllGlobals(); });

const start = (search: string) => {
  const tab = browser(`${BASE}?${search}`);
  vi.stubGlobal("window", tab.window);
  const props = { data: EMPTY_CAREER_INTELLIGENCE_DATA, ...careerDemoPropsFromSearchParams(careerDemoSearchParamsFromSearch(`?${search}`)) } as Record<string, unknown>;
  return { tab, view: instance<Record<string, unknown>>(SemanticCareerIntelligenceField), props };
};

describe("RI-START refresh · F-RI-1 / O-RI-1 / O-RI-3 / O-RI-4", () => {
  it("REPRODUCE: after a completed run the plan is re-read once; the line is the fresh plan, never 'not executed' beside 'completed'; picks reset and START goes inert", async () => {
    const { view, props } = start(RELEASED);
    let tree = view.settle(props);
    await flush();
    tree = view.settle(props);
    const field = () => find(tree, RoleDiscoveryPanel)!;
    expect(visibleText(panelHtml(field()))).toMatch(/0 of 32 pairs|no investigation named/);
    const roles = [{ jobPoolUploadId: UPLOAD_ALPHA, poolRoleId: "role_fs" }];
    const s = storedInvestigation("COMPLETED", [{ ...roles[0], status: "SUCCEEDED", pairs: 32, stored: 32 }]);
    s.investigation.analysisId = ANALYSIS;
    answer = { status: 201, body: { success: true, created: true, evidenceClass: "STAND_IN", ...s, run: { status: "COMPLETED", roles: [] } } };
    const getsBefore = calls.filter(c => c.method === "GET").length;
    (field().props.onStart as (r: unknown, n: number) => void)(roles, 1);
    tree = view.settle(props);
    await flush();
    tree = view.settle(props);
    await flush();
    tree = view.settle(props);
    // One auto re-read GET for this stored investigation, no more.
    expect(calls.filter(c => c.method === "GET").length - getsBefore).toBe(1);
    const html = panelHtml(field());
    const text = visibleText(html);
    expect(text).toMatch(/Relationen-Cache|Relation cache/);
    expect(text).not.toMatch(/nicht ausgeführt[^.]*abgeschlossen|not executed[^.]*completed/i);
    expect(text).toContain("stand-in check: completed");
    // O-RI-4: the ticks are gone, START is inert until the user picks again.
    const picks = html.match(/data-testid="rd-role-pick"[\s\S]*?<input[^>]*>/g) ?? [];
    expect(picks.every(input => !/checked=""/.test(input))).toBe(true);
    expect(/data-testid="rd-start-run"[^>]*disabled=""/.test(html)).toBe(true);
    view.unmount();
  });

  it("REPRODUCE: O-RI-3 — a fresh release with cache already warm from an earlier investigation never says the check 'never ran'", async () => {
    const warmAlready = await plannedBody(1, 10); // cachedPairs > 0 even though no investigation of THIS view exists yet.
    expect(warmAlready.discovery.semanticPlan.cachedPairs).toBeGreaterThan(0);
    const html = panel(available(warmAlready.discovery));
    const text = visibleText(html);
    expect(text).toContain("keine Untersuchung in dieser Ansicht benannt");
    expect(text).not.toMatch(/nie gelaufen|never ran|not started|nicht gestartet/i);
  });

  it("inverse: a refusal or an in-flight start keeps the pre-run sentence and its tail — never the stored format", async () => {
    const plan = preRun.discovery.semanticPlan;
    const refused = panel(available(preRun.discovery), { investigation: { state: "REFUSED", code: "ERR_INVESTIGATION_ROLES_INVALID", confirmedCalls: 1, callsNeeded: null, max: null } });
    expect(visibleText(refused)).toContain(`${plan.cachedPairs} von ${plan.pairs} Paaren im Relationen-Cache · würde ${plan.callsNeeded} Aufrufe benötigen · keine Untersuchung in dieser Ansicht benannt`);
    expect(visibleText(refused)).not.toContain("Relationen-Cache:");
    const running = panel(available(preRun.discovery), { investigation: { state: "STARTING", roles: [{ jobPoolUploadId: UPLOAD_ALPHA, poolRoleId: "role_fs" }], confirmedCalls: 1 } });
    expect(visibleText(running)).toContain("keine Untersuchung in dieser Ansicht benannt");
  });
});

function panelHtml(element: ReturnType<typeof find>): string {
  const props = (element as unknown as { props: Record<string, unknown> }).props;
  return renderToString(React.createElement(RoleDiscoveryPanel, props as never));
}
