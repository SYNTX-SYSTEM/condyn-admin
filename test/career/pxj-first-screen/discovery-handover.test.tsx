import React from "react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import { renderToString } from "react-dom/server";
import { browser, find, instance } from "./harness";
import { PERSON_ANALYSIS, UPLOAD_ALPHA, UPLOAD_ZETA, discoveryBody } from "./discovery-fixtures";
import { ANALYSIS, boundary, resultBody } from "./fixtures";

/**
 * RD-HANDOVER (GELB stage 2: "Gezielt untersuchen"): from a role's trace the discovered role becomes the selected job of a
 * PERSON × JOB investigation — one push of the job scope, the mode, no analysisId and no release. Nothing is started (no POST,
 * no ANALYZE); PERSON × JOB then shows NO_ANALYSIS for exactly this role, also when this session had a PERSON result. Back returns
 * to the PERSON analysis with its release; a reload of the new URL gives the same state (NAV ≡ RELOAD).
 */
const control = vi.hoisted(() => ({ job: null as unknown, boundary: null as unknown, result: null as unknown, submits: 0, validated: [] as unknown[] }));
vi.mock("react", async (importOriginal) => (await import("./harness")).mockReact(await importOriginal<object>()));
vi.mock("../../../lib/career/ui/useCareerAnalysisJob", () => ({ useCareerAnalysisJob: () => ({ state: control.job, submitAnalysis: async () => { control.submits += 1; }, resumeJob: () => undefined }) }));
vi.mock("../../../lib/career/ui/useJobScope", () => ({ useJobScopeValidation: (scope: { jobPoolUploadId: string; poolRoleId: string } | null) => (control.validated.push(scope), scope === null) ? { state: "NONE" } : { state: "VALID", scope, roleTitle: "Full-Stack Engineer", organizationId: "org_k", organizationName: "Kestrel", poolName: "Zeta Pool" } }));
vi.mock("../../../lib/career/ui/useJobPoolSources", () => ({ useAnalysisSources: () => ({ state: "IDLE" }) }));
vi.mock("../../../lib/career/ui/useJobPool", async (importOriginal) => ({ ...(await importOriginal<typeof import("../../../lib/career/ui/useJobPool")>()), useJobPoolWorkflow: () => ({ pools: { state: "AVAILABLE", jobPools: [] }, upload: { state: "IDLE" }, selectedJobPoolUploadId: null, view: { state: "IDLE" }, matches: { state: "IDLE" }, submitUpload: async () => undefined, select: () => undefined, reloadPools: async () => undefined, reloadMatches: async () => undefined }) }));
vi.mock("../../../lib/career/ui/useRoleInvestigation", async (importOriginal) => ({ ...(await importOriginal<typeof import("../../../lib/career/ui/useRoleInvestigation")>()), useAnalysisBoundary: (id: string | null) => id === null ? { state: "IDLE" } : control.boundary, useSelectedRoleCoverage: () => ({ state: "IDLE" }) }));
vi.mock("../../../lib/career/ui/useAnalysisResult", async (importOriginal) => ({ ...(await importOriginal<typeof import("../../../lib/career/ui/useAnalysisResult")>()), useAnalysisResult: (id: string | null) => id === null ? { state: "IDLE" } : control.result }));

import { SemanticCareerIntelligenceField } from "../../../app/components/career/demo/SemanticCareerIntelligenceField";
import { PxjFirstScreen } from "../../../app/components/career/demo/PxjFirstScreen";
import { EMPTY_CAREER_INTELLIGENCE_DATA } from "../../../app/career/demo/demo-data";
import { careerDemoPropsFromSearchParams, careerDemoSearchParamsFromSearch } from "../../../lib/career/ui/career-demo-url";
import { decodeAnalysisResult } from "../../../lib/career/view-model/pxj-first-screen";
import { decodeRoleDiscovery } from "../../../lib/career/ui/role-discovery";
import { ROLE_DISCOVERY_COPY } from "../../../app/components/career/demo/role-discovery-copy";

type PanelModule = typeof import("../../../app/components/career/demo/RoleDiscoveryPanel");
let rd: PanelModule;
beforeAll(async () => { rd = await import("../../../app/components/career/demo/RoleDiscoveryPanel").catch(() => ({}) as PanelModule); });

const BASE = "http://127.0.0.1/career/demo";
const IDLE_JOB = { state: "IDLE", activeJobId: null, resultAnalysisId: null, canonicalAnalysis: null, currentOperation: null, attemptCount: null, errorCode: null, errorSummary: null, httpStatus: null };
const SCOPE = { jobPoolUploadId: UPLOAD_ZETA, poolRoleId: "role_fs" };
const flush = async () => { for (let i = 0; i < 10; i += 1) await Promise.resolve(); };
type Tree = ReactElement<Record<string, unknown>>;
let reads: string[] = [];

beforeEach(() => {
  const decoded = decodeAnalysisResult(resultBody(), ANALYSIS);
  if (!decoded.ok) throw new Error(decoded.code);
  control.job = IDLE_JOB; control.submits = 0; control.validated = [];
  control.boundary = { state: "RESOLVED", value: boundary({ mode: "PERSON", jobScopeSelection: null, investigationScopeHash: null }) };
  control.result = { state: "AVAILABLE", result: decoded.result };
  reads = [];
  vi.stubGlobal("fetch", async (url: string, init: { method: string }) => { reads.push(`${init.method} ${url}`); return { status: 200, json: async () => discoveryBody() }; });
  vi.stubGlobal("localStorage", { getItem: () => "1", setItem: () => undefined });
});
afterEach(() => { vi.unstubAllGlobals(); });

const propsOf = (url: string) => ({ data: EMPTY_CAREER_INTELLIGENCE_DATA, ...careerDemoPropsFromSearchParams(careerDemoSearchParamsFromSearch(new URL(url).search)) }) as Record<string, unknown>;
async function handover(search: string) {
  const tab = browser(`${BASE}?${search}`);
  vi.stubGlobal("window", tab.window);
  const props = propsOf(tab.url);
  const view = instance<Record<string, unknown>>(SemanticCareerIntelligenceField);
  let tree = view.settle(props);
  if (find(tree, rd.RoleDiscoveryPanel) === null) { (find(tree, rd.RoleDiscoveryEntry)!.props.onOpen as () => void)(); tree = view.settle(props); }
  await flush();
  tree = view.settle(props);
  const before = { writes: tab.writes.length, reads: reads.length };
  await tab.nextTask();
  (find(tree, rd.RoleDiscoveryPanel)!.props.onInvestigate as (scope: typeof SCOPE) => void)(SCOPE);
  tree = view.settle(props);
  await flush();
  tree = view.settle(props);
  return { tab, view, tree, before };
}

describe("RD-HANDOVER · investigate a discovered role", () => {
  it("REPRODUCE: one push — the role as the job, PERSON × JOB, no analysisId, no release; nothing started, no further discovery read", async () => {
    const { tab, view, tree, before } = await handover(`focus=CAPABILITY&investigationMode=PERSON&analysisId=${ANALYSIS}&discoveryPoolUploadId=${UPLOAD_ALPHA}&discoveryPoolUploadId=${UPLOAD_ZETA}`);
    expect(tab.writes.slice(before.writes).map(write => write.how)).toEqual(["push"]);
    const url = new URL(tab.url).searchParams;
    expect([url.get("jobScopePoolUploadId"), url.get("jobScopeRoleId"), url.get("investigationMode"), url.get("focus")]).toEqual([UPLOAD_ZETA, "role_fs", "PERSON_X_JOB", "CAPABILITY"]);
    expect(url.has("analysisId")).toBe(false);
    expect(url.has("discoveryPoolUploadId")).toBe(false);
    expect(control.submits).toBe(0);
    expect(reads.slice(before.reads).filter(read => read.includes("role-discovery") || read.startsWith("POST"))).toEqual([]);
    expect(find(tree, rd.RoleDiscoveryPanel)).toBeNull();
    // PERSON × JOB shows the first screen of exactly this role without an analysis (the way to D-PICK / ANALYZE).
    expect((find(tree, PxjFirstScreen)!.props.screen as { state: string }).state).toBe("NO_ANALYSIS");
    expect(control.validated.at(-1)).toEqual(SCOPE);
    view.unmount();
  });

  it("REPRODUCE: this session's PERSON result steps back — PERSON × JOB opens without it; nothing is analysed", async () => {
    control.job = { ...IDLE_JOB, state: "SUCCEEDED", resultAnalysisId: ANALYSIS };
    const { tab, view, tree } = await handover(`focus=CAPABILITY&investigationMode=PERSON&analysisId=${ANALYSIS}`);
    expect(new URL(tab.url).searchParams.has("analysisId")).toBe(false);
    expect((find(tree, PxjFirstScreen)!.props.screen as { state: string }).state).toBe("NO_ANALYSIS");
    expect(control.submits).toBe(0);
    view.unmount();
  });

  it("REPRODUCE: NAV ≡ RELOAD — Back holds the PERSON analysis with its release; the new URL reloads to the same props", async () => {
    const start = `focus=CAPABILITY&investigationMode=PERSON&analysisId=${ANALYSIS}&discoveryPoolUploadId=${UPLOAD_ZETA}`;
    const { tab, view } = await handover(start);
    const previous = new URL(tab.entries[tab.entries.length - 2]).searchParams;
    expect([previous.get("analysisId"), previous.getAll("discoveryPoolUploadId"), previous.get("investigationMode")]).toEqual([ANALYSIS, [UPLOAD_ZETA], "PERSON"]);
    const reload = propsOf(tab.url);
    expect([reload.investigationMode, reload.jobScopePoolUploadId, reload.jobScopeRoleId, reload.analysisId, reload.discoveryPoolUploadIds]).toEqual(["PERSON_X_JOB", UPLOAD_ZETA, "role_fs", undefined, undefined]);
    view.unmount();
  });

  it("inverse: a trace without the handover offers no way; the panel's own rows and the release are untouched", () => {
    const discovery = decodeRoleDiscovery(discoveryBody().discovery, PERSON_ANALYSIS, [UPLOAD_ALPHA, UPLOAD_ZETA])!;
    const role = discovery.roles.find(r => r.requirements.length > 0)!;
    const html = renderToString(<rd.RoleDiscoveryTrace c={ROLE_DISCOVERY_COPY.de} role={role} proposals={discovery.proposals} />);
    expect(html).toContain('data-testid="rd-trace"');
    expect(html).not.toContain('data-testid="rd-investigate"');
  });
});
