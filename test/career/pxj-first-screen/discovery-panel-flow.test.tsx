import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import { browser, find, instance } from "./harness";
import { UPLOAD_ALPHA, UPLOAD_ZETA, discoveryBody } from "./discovery-fixtures";
import { ANALYSIS, boundary, resultBody } from "./fixtures";

/**
 * RD-PANEL · the flows (harness: ./harness.ts). Opening the panel is no URL step; DISCOVER JOBS releases the ticked pools as one
 * push of the repeated discoveryPoolUploadId (list order) and reads exactly them (GET); CLOSE withdraws the release as one push;
 * a reload of a released URL reopens the panel with the same release (NAV ≡ RELOAD); a new analysis on view starts without one.
 */
const control = vi.hoisted(() => ({ job: null as unknown, boundary: null as unknown, result: null as unknown }));
vi.mock("react", async (importOriginal) => (await import("./harness")).mockReact(await importOriginal<object>()));
vi.mock("../../../lib/career/ui/useCareerAnalysisJob", () => ({ useCareerAnalysisJob: () => ({ state: control.job, submitAnalysis: async () => undefined, resumeJob: () => undefined }) }));
vi.mock("../../../lib/career/ui/useJobScope", () => ({ useJobScopeValidation: () => ({ state: "NONE" }) }));
vi.mock("../../../lib/career/ui/useJobPoolSources", () => ({ useAnalysisSources: () => ({ state: "IDLE" }) }));
vi.mock("../../../lib/career/ui/useJobPool", async (importOriginal) => ({ ...(await importOriginal<typeof import("../../../lib/career/ui/useJobPool")>()), useJobPoolWorkflow: () => ({ pools: { state: "AVAILABLE", jobPools: [] }, upload: { state: "IDLE" }, selectedJobPoolUploadId: null, view: { state: "IDLE" }, matches: { state: "IDLE" }, submitUpload: async () => undefined, select: () => undefined, reloadPools: async () => undefined, reloadMatches: async () => undefined }) }));
vi.mock("../../../lib/career/ui/useRoleInvestigation", async (importOriginal) => ({ ...(await importOriginal<typeof import("../../../lib/career/ui/useRoleInvestigation")>()), useAnalysisBoundary: (id: string | null) => id === null ? { state: "IDLE" } : control.boundary, useSelectedRoleCoverage: () => ({ state: "IDLE" }) }));
vi.mock("../../../lib/career/ui/useAnalysisResult", async (importOriginal) => ({ ...(await importOriginal<typeof import("../../../lib/career/ui/useAnalysisResult")>()), useAnalysisResult: (id: string | null) => id === null ? { state: "IDLE" } : control.result }));
// AUTO_CAPABILITY (owner 2026-10-30): the PERSON analysis on view reads its automatic run and ranking by itself now (GET on other
// routes, auto-match-wiring.test.tsx). This file holds the manual discovery's own reads and POSTs, so those two hooks stand still here.
vi.mock("../../../lib/career/ui/auto-match", async (importOriginal) => ({ ...(await importOriginal<typeof import("../../../lib/career/ui/auto-match")>()), useAutoMatch: () => ({ read: { state: "IDLE" }, waitedOut: false }), useJobRanking: () => ({ state: "IDLE" }) }));

import { SemanticCareerIntelligenceField } from "../../../app/components/career/demo/SemanticCareerIntelligenceField";
// The panel module is new: loaded lazily, so a base without it fails test by test, not at the file's import.
type PanelModule = typeof import("../../../app/components/career/demo/RoleDiscoveryPanel");
let rd: PanelModule;
beforeAll(async () => { rd = await import("../../../app/components/career/demo/RoleDiscoveryPanel").catch(() => ({}) as PanelModule); });
import { EMPTY_CAREER_INTELLIGENCE_DATA } from "../../../app/career/demo/demo-data";
import { careerDemoPropsFromSearchParams, careerDemoSearchParamsFromSearch } from "../../../lib/career/ui/career-demo-url";
import { decodeAnalysisResult } from "../../../lib/career/view-model/pxj-first-screen";

const BASE = "http://127.0.0.1/career/demo";
const IDLE_JOB = { state: "IDLE", activeJobId: null, resultAnalysisId: null, canonicalAnalysis: null, currentOperation: null, attemptCount: null, errorCode: null, errorSummary: null, httpStatus: null };
const flush = async () => { for (let i = 0; i < 10; i += 1) await Promise.resolve(); };
type Tree = ReactElement<Record<string, unknown>>;
const byTestId = (node: unknown, testid: string): Tree | null => {
  if (!node || typeof node !== "object") return null;
  if (Array.isArray(node)) { for (const child of node) { const hit = byTestId(child, testid); if (hit) return hit; } return null; }
  const element = node as Tree;
  if (element.props?.["data-testid"] === testid) return element;
  return byTestId(element.props?.children, testid);
};
const all = (node: unknown, predicate: (element: Tree) => boolean, out: Tree[] = []): Tree[] => {
  if (!node || typeof node !== "object") return out;
  if (Array.isArray(node)) { for (const child of node) all(child, predicate, out); return out; }
  const element = node as Tree;
  if (predicate(element)) out.push(element);
  all(element.props?.children, predicate, out);
  return out;
};

let reads: string[] = [];
beforeEach(() => {
  const decoded = decodeAnalysisResult(resultBody(), ANALYSIS);
  if (!decoded.ok) throw new Error(decoded.code);
  control.job = IDLE_JOB;
  control.boundary = { state: "RESOLVED", value: boundary({ mode: "PERSON", jobScopeSelection: null, investigationScopeHash: null }) };
  control.result = { state: "AVAILABLE", result: decoded.result };
  reads = [];
  vi.stubGlobal("fetch", async (url: string, init: { method: string }) => { reads.push(`${init.method} ${url}`); return { status: 200, json: async () => discoveryBody() }; });
  vi.stubGlobal("localStorage", { getItem: () => "1", setItem: () => undefined });
});
afterEach(() => { vi.unstubAllGlobals(); });

const start = (search: string) => {
  const tab = browser(`${BASE}?${search}`);
  vi.stubGlobal("window", tab.window);
  const props = { data: EMPTY_CAREER_INTELLIGENCE_DATA, ...careerDemoPropsFromSearchParams(careerDemoSearchParamsFromSearch(new URL(tab.url).search)) } as Record<string, unknown>;
  return { tab, view: instance<Record<string, unknown>>(SemanticCareerIntelligenceField), props };
};

describe("RD-PANEL · flows", () => {
  it("REPRODUCE: open is no URL step; DISCOVER JOBS is one push of the ticked pools and reads exactly them; CLOSE is one push back", async () => {
    const { tab, view, props } = start(`focus=CAPABILITY&investigationMode=PERSON&analysisId=${ANALYSIS}`);
    let tree = view.settle(props);
    expect(find(tree, rd.RoleDiscoveryPanel)).toBeNull();
    (find(tree, rd.RoleDiscoveryEntry)!.props.onOpen as () => void)();
    tree = view.settle(props);
    expect(tab.writes).toEqual([]);
    expect(reads).toEqual([]);
    const panel = find(tree, rd.RoleDiscoveryPanel)!;
    expect(panel.props.released).toBeNull();
    await tab.nextTask();
    (panel.props.onRelease as (ids: string[]) => void)([UPLOAD_ALPHA, UPLOAD_ZETA]);
    tree = view.settle(props);
    await flush();
    tree = view.settle(props);
    expect(tab.writes.map(write => write.how)).toEqual(["push"]);
    expect(new URL(tab.url).searchParams.getAll("discoveryPoolUploadId")).toEqual([UPLOAD_ALPHA, UPLOAD_ZETA]);
    expect(reads).toEqual([`GET /api/career/analyses/${ANALYSIS}/role-discovery?jobPoolUploadId=${UPLOAD_ALPHA}&jobPoolUploadId=${UPLOAD_ZETA}`]);
    expect(find(tree, rd.RoleDiscoveryPanel)!.props.released).toEqual([UPLOAD_ALPHA, UPLOAD_ZETA]);
    await tab.nextTask();
    (find(tree, rd.RoleDiscoveryPanel)!.props.onClose as () => void)();
    tree = view.settle(props);
    expect(tab.writes.map(write => write.how)).toEqual(["push", "push"]);
    expect(new URL(tab.url).searchParams.has("discoveryPoolUploadId")).toBe(false);
    expect(find(tree, rd.RoleDiscoveryPanel)).toBeNull();
    expect(find(tree, rd.RoleDiscoveryEntry)).not.toBeNull();
    expect(reads).toHaveLength(1);
    view.unmount();
  });

  it("REPRODUCE: NAV ≡ RELOAD — a released URL reopens the panel with the same release and reads it again", async () => {
    const { view, props } = start(`focus=CAPABILITY&investigationMode=PERSON&analysisId=${ANALYSIS}&discoveryPoolUploadId=${UPLOAD_ZETA}`);
    view.settle(props);
    await flush();
    const tree = view.settle(props);
    expect(find(tree, rd.RoleDiscoveryPanel)!.props.released).toEqual([UPLOAD_ZETA]);
    expect(find(tree, rd.RoleDiscoveryEntry)).toBeNull();
    expect(reads).toEqual([`GET /api/career/analyses/${ANALYSIS}/role-discovery?jobPoolUploadId=${UPLOAD_ZETA}`]);
    view.unmount();
  });

  it("REPRODUCE: the panel releases the ticked pools in the list's order; nothing is ticked before the user ticks it", () => {
    const pools = { state: "AVAILABLE", jobPools: [UPLOAD_ALPHA, UPLOAD_ZETA].map((id, at) => ({ jobPoolUploadId: id, poolId: `p${at}`, poolVersion: 1, poolName: `P${at}`, poolStatus: "ACTIVE", organizationCount: 1, roleCount: 1, requirementCount: 1, uploadedByActorRef: "a", uploadedAt: "2026-10-24T00:00:00.000Z" })) };
    const released: string[][] = [];
    const panel = instance<Record<string, unknown>>(rd.RoleDiscoveryPanel);
    const props = { locale: "en", pools, released: null, discovery: { state: "IDLE" }, onRelease: (ids: string[]) => released.push(ids), onClose: () => undefined };
    let tree = panel.settle(props);
    const boxes = () => all(tree, element => element.type === "input");
    expect(boxes().map(box => box.props.checked)).toEqual([false, false]);
    expect(byTestId(tree, "rd-discover")!.props.disabled).toBe(true);
    (boxes()[1].props.onChange as () => void)();
    tree = panel.settle(props);
    (boxes()[0].props.onChange as () => void)();
    tree = panel.settle(props);
    (byTestId(tree, "rd-discover")!.props.onClick as () => void)();
    expect(released).toEqual([[UPLOAD_ALPHA, UPLOAD_ZETA]]);
    // The release in force again is no new step.
    const again = instance<Record<string, unknown>>(rd.RoleDiscoveryPanel).settle({ ...props, released: [UPLOAD_ALPHA, UPLOAD_ZETA] });
    expect(byTestId(again, "rd-discover")!.props.disabled).toBe(true);
  });

  it("REPRODUCE: a new analysis on view starts without released pools (one replace with the new analysis); no read for the old release", async () => {
    control.job = { ...IDLE_JOB, state: "SUCCEEDED", resultAnalysisId: "ANL_1792000000202_202" };
    const { tab, view, props } = start(`focus=CAPABILITY&investigationMode=PERSON&analysisId=${ANALYSIS}&discoveryPoolUploadId=${UPLOAD_ALPHA}`);
    view.settle(props);
    await flush();
    const tree = view.settle(props);
    expect(new URL(tab.url).searchParams.get("analysisId")).toBe("ANL_1792000000202_202");
    expect(new URL(tab.url).searchParams.has("discoveryPoolUploadId")).toBe(false);
    expect(tab.writes.every(write => write.how === "replace")).toBe(true);
    expect(find(tree, rd.RoleDiscoveryPanel)).toBeNull();
    expect(reads.filter(read => read.includes("role-discovery"))).toEqual([]);
    view.unmount();
  });

  it("inverse: without a release nothing is written and nothing is read — the field mounts as before", async () => {
    const { tab, view, props } = start(`focus=CAPABILITY&investigationMode=PERSON&analysisId=${ANALYSIS}`);
    view.settle(props);
    await flush();
    view.settle(props);
    expect(tab.writes).toEqual([]);
    expect(reads.filter(read => read.includes("role-discovery"))).toEqual([]);
    view.unmount();
  });
});
