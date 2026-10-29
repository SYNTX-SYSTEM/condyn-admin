import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import { browser, find, instance } from "./harness";
import { UPLOAD_ALPHA, UPLOAD_ZETA, plannedBody, storedInvestigation } from "./discovery-fixtures";
import { ANALYSIS, boundary, resultBody } from "./fixtures";

/**
 * RI-URL (GELB c1954ca STOP point, owner D-RD-3 A): the explicit semantic investigation of the released pools stands in the URL
 * as one parameter `roleInvestigationId` — the server's own id format only, never guessed, never derived from the roles. Written
 * once, as a replace, after the start the user confirmed has been stored; read again by GET only (NAV ≡ RELOAD, never a repeated
 * POST); removed on a new release, CLOSE, a new analysis and the handover ("Gezielt untersuchen"). Harness: ./harness.ts.
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
import { ROLE_INVESTIGATION_URL_PARAM, careerDemoPropsFromSearchParams, careerDemoSearchParamsFromSearch, roleInvestigationIdFromParam } from "../../../lib/career/ui/career-demo-url";
import { decodeAnalysisResult } from "../../../lib/career/view-model/pxj-first-screen";

const BASE = "http://127.0.0.1/career/demo";
const POOLS = [UPLOAD_ALPHA, UPLOAD_ZETA];
const RELEASED = `focus=CAPABILITY&investigationMode=PERSON&analysisId=${ANALYSIS}&discoveryPoolUploadId=${UPLOAD_ALPHA}&discoveryPoolUploadId=${UPLOAD_ZETA}`;
const RINV = "RINV_0123456789ABCDEF0123456789ABCDEF";
const IDLE_JOB = { state: "IDLE", activeJobId: null, resultAnalysisId: null, canonicalAnalysis: null, currentOperation: null, attemptCount: null, errorCode: null, errorSummary: null, httpStatus: null };
const flush = async () => { for (let i = 0; i < 12; i += 1) await Promise.resolve(); };
const props = (search: string) => careerDemoPropsFromSearchParams(careerDemoSearchParamsFromSearch(search)) as Record<string, unknown>;

let calls: Array<{ method: string; url: string }> = [];
let discovery: Awaited<ReturnType<typeof plannedBody>>;
let storedBody: ReturnType<typeof storedInvestigation>;
beforeEach(async () => {
  discovery = await plannedBody(0, 10);
  storedBody = storedInvestigation("COMPLETED", [{ jobPoolUploadId: UPLOAD_ALPHA, poolRoleId: "role_fs", status: "SUCCEEDED", stored: 16 }]);
  storedBody.investigation.analysisId = ANALYSIS;
  storedBody.investigation.investigationId = RINV;
  const decoded = decodeAnalysisResult(resultBody(), ANALYSIS);
  if (!decoded.ok) throw new Error(decoded.code);
  control.job = IDLE_JOB;
  control.boundary = { state: "RESOLVED", value: boundary({ mode: "PERSON", jobScopeSelection: null, investigationScopeHash: null }) };
  control.result = { state: "AVAILABLE", result: decoded.result };
  calls = [];
  vi.stubGlobal("fetch", async (url: string, init: { method: string }) => {
    calls.push({ method: init.method, url });
    if (init.method === "POST") throw new Error("RI-URL: no POST is expected in these tests");
    if (url.includes("/investigations/")) return { status: 200, json: async () => ({ success: true, evidenceClass: "STAND_IN", ...storedBody }) };
    return { status: 200, json: async () => ({ ...discovery, discovery: { ...discovery.discovery, analysis: { ...discovery.discovery.analysis, analysisId: ANALYSIS } } }) };
  });
  vi.stubGlobal("localStorage", { getItem: () => "1", setItem: () => undefined });
});
afterEach(() => { vi.unstubAllGlobals(); });

const start = (search: string) => {
  const tab = browser(`${BASE}?${search}`);
  vi.stubGlobal("window", tab.window);
  const p = { data: EMPTY_CAREER_INTELLIGENCE_DATA, ...careerDemoPropsFromSearchParams(careerDemoSearchParamsFromSearch(new URL(tab.url).search)) } as Record<string, unknown>;
  return { tab, view: instance<Record<string, unknown>>(SemanticCareerIntelligenceField), props: p };
};

describe("RI-URL · the named investigation in the URL", () => {
  it("REPRODUCE: the shared parser reads only the server's own id format, as a single value", () => {
    expect(roleInvestigationIdFromParam(RINV)).toBe(RINV);
    expect(props(`?roleInvestigationId=${RINV}`).roleInvestigationId).toBe(RINV);
    for (const bad of ["RINV_short", "rinv_0123456789abcdef0123456789abcdef", `${RINV}X`, "RINV_", ""]) expect(roleInvestigationIdFromParam(bad), bad).toBeUndefined();
    // Repeated is ambiguous, read as absent (the shared single() rule, like every other scalar parameter).
    expect(props(`?roleInvestigationId=${RINV}&roleInvestigationId=${RINV}`).roleInvestigationId).toBeUndefined();
  });

  it("REPRODUCE: NAV ≡ RELOAD — a URL naming the investigation reads it again by GET only, never a POST, and shows its stored status", async () => {
    const { view, props: p } = start(`${RELEASED}&${ROLE_INVESTIGATION_URL_PARAM}=${RINV}`);
    let tree = view.settle(p);
    await flush();
    tree = view.settle(p);
    expect(calls.filter(c => c.method === "POST")).toEqual([]);
    expect(calls.some(c => c.method === "GET" && c.url.endsWith(`/investigations/${RINV}`))).toBe(true);
    const panel = find(tree, RoleDiscoveryPanel)!;
    expect(panel.props.investigation).toMatchObject({ state: "STORED", created: null, investigation: { investigationId: RINV, status: "COMPLETED" } });
    view.unmount();
    // A reload of the very same URL does the same GET again — idempotent, read only.
    const again = start(`${RELEASED}&${ROLE_INVESTIGATION_URL_PARAM}=${RINV}`);
    again.view.settle(again.props);
    await flush();
    again.view.settle(again.props);
    expect(calls.filter(c => c.method === "POST")).toEqual([]);
    again.view.unmount();
  });

  it("REPRODUCE: a malformed or repeated roleInvestigationId is no investigation at all — removed on mount (a replace), nothing read", async () => {
    for (const bad of [`${ROLE_INVESTIGATION_URL_PARAM}=not-an-id`, `${ROLE_INVESTIGATION_URL_PARAM}=${RINV}&${ROLE_INVESTIGATION_URL_PARAM}=${RINV}`]) {
      const { tab, view, props: p } = start(`${RELEASED}&${bad}`);
      view.settle(p);
      await flush();
      view.settle(p);
      expect(new URL(tab.url).searchParams.has(ROLE_INVESTIGATION_URL_PARAM), bad).toBe(false);
      expect(tab.writes.every(write => write.how === "replace"), bad).toBe(true);
      expect(calls.some(c => c.url.includes("/investigations/")), bad).toBe(false);
      view.unmount();
    }
  });

  it("REPRODUCE: closing the panel, a new release, a new analysis and the handover each remove the investigation from the URL", async () => {
    const cases: Array<[string, (panel: ReactElement<Record<string, unknown>>, releasePools: () => void) => void]> = [
      ["CLOSE", panel => (panel.props.onClose as () => void)()],
      ["a new release", panel => (panel.props.onRelease as (ids: string[]) => void)([UPLOAD_ZETA])]
    ];
    for (const [name, act] of cases) {
      const { tab, view, props: p } = start(`${RELEASED}&${ROLE_INVESTIGATION_URL_PARAM}=${RINV}`);
      let tree = view.settle(p);
      await flush();
      tree = view.settle(p);
      expect(new URL(tab.url).searchParams.get(ROLE_INVESTIGATION_URL_PARAM), name).toBe(RINV);
      act(find(tree, RoleDiscoveryPanel)!, () => undefined);
      tree = view.settle(p);
      expect(new URL(tab.url).searchParams.has(ROLE_INVESTIGATION_URL_PARAM), name).toBe(false);
      view.unmount();
    }
    // A new analysis on view (job SUCCEEDED) drops the release and the investigation together, as one replace.
    control.job = { ...IDLE_JOB, state: "SUCCEEDED", resultAnalysisId: "ANL_1792000000202_202" };
    const { tab, view } = start(`${RELEASED}&${ROLE_INVESTIGATION_URL_PARAM}=${RINV}`);
    const p2 = { data: EMPTY_CAREER_INTELLIGENCE_DATA, ...careerDemoPropsFromSearchParams(careerDemoSearchParamsFromSearch(`?${RELEASED}&${ROLE_INVESTIGATION_URL_PARAM}=${RINV}`)) };
    view.settle(p2);
    await flush();
    view.settle(p2);
    expect(new URL(tab.url).searchParams.has(ROLE_INVESTIGATION_URL_PARAM)).toBe(false);
    view.unmount();
  });

  it("REPRODUCE: the start writes roleInvestigationId once as a replace, after the stored answer — never before, never a push", async () => {
    const roles = [{ jobPoolUploadId: UPLOAD_ALPHA, poolRoleId: "role_fs" }];
    vi.stubGlobal("fetch", async (url: string, init: { method: string }) => {
      calls.push({ method: init.method, url });
      if (init.method === "POST") return { status: 201, json: async () => ({ success: true, created: true, evidenceClass: "STAND_IN", ...storedBody, run: { status: "COMPLETED", roles: [] } }) };
      return { status: 200, json: async () => ({ ...discovery, discovery: { ...discovery.discovery, analysis: { ...discovery.discovery.analysis, analysisId: ANALYSIS } } }) };
    });
    const { tab, view, props: p } = start(RELEASED);
    let tree = view.settle(p);
    await flush();
    tree = view.settle(p);
    expect(new URL(tab.url).searchParams.has(ROLE_INVESTIGATION_URL_PARAM)).toBe(false);
    (find(tree, RoleDiscoveryPanel)!.props.onStart as (r: unknown, n: number) => void)(roles, 1);
    tree = view.settle(p);
    expect(new URL(tab.url).searchParams.has(ROLE_INVESTIGATION_URL_PARAM)).toBe(false); // not yet: the POST has not answered
    await flush();
    tree = view.settle(p);
    expect(new URL(tab.url).searchParams.get(ROLE_INVESTIGATION_URL_PARAM)).toBe(RINV);
    expect(tab.writes.at(-1)!.how).toBe("replace");
    view.unmount();
  });

  it("inverse: without a named investigation nothing is read and nothing is written; the owner's wording stays \"not started\"", async () => {
    const { tab, view, props: p } = start(RELEASED);
    const tree = view.settle(p);
    await flush();
    view.settle(p);
    expect(calls.some(c => c.url.includes("/investigations/"))).toBe(false);
    expect(tab.writes.some(write => new URL(write.url).searchParams.has(ROLE_INVESTIGATION_URL_PARAM))).toBe(false);
    expect(find(tree, RoleDiscoveryPanel)!.props.investigation).toEqual({ state: "IDLE" });
    view.unmount();
  });
});
