import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import { browser, find, instance } from "./harness";
import { UPLOAD_ALPHA, UPLOAD_ZETA, plannedBody, storedInvestigation } from "./discovery-fixtures";
import { ANALYSIS, boundary, resultBody } from "./fixtures";

/**
 * RI-START · the flows (harness: ./harness.ts). The user picks roles (nothing preselected, at most the limit); the count stands
 * and is what START confirms; one click is exactly one POST (a second click while it runs sends nothing); a load, an open, a
 * reload and a re-read of the plan send none (GET only).
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
import { RoleDiscoveryPanel, RoleDiscoveryResults } from "../../../app/components/career/demo/RoleDiscoveryPanel";
import { EMPTY_CAREER_INTELLIGENCE_DATA } from "../../../app/career/demo/demo-data";
import { careerDemoPropsFromSearchParams, careerDemoSearchParamsFromSearch } from "../../../lib/career/ui/career-demo-url";
import { decodeRoleDiscovery } from "../../../lib/career/ui/role-discovery";
import { decodeAnalysisResult } from "../../../lib/career/view-model/pxj-first-screen";

const BASE = "http://127.0.0.1/career/demo";
const POOLS = [UPLOAD_ALPHA, UPLOAD_ZETA];
const RELEASED = `focus=CAPABILITY&investigationMode=PERSON&analysisId=${ANALYSIS}&discoveryPoolUploadId=${UPLOAD_ALPHA}&discoveryPoolUploadId=${UPLOAD_ZETA}`;
const IDLE_JOB = { state: "IDLE", activeJobId: null, resultAnalysisId: null, canonicalAnalysis: null, currentOperation: null, attemptCount: null, errorCode: null, errorSummary: null, httpStatus: null };
const flush = async () => { for (let i = 0; i < 12; i += 1) await Promise.resolve(); };
type Tree = ReactElement<Record<string, unknown>>;
const all = (node: unknown, predicate: (element: Tree) => boolean, out: Tree[] = []): Tree[] => {
  if (!node || typeof node !== "object") return out;
  if (Array.isArray(node)) { for (const child of node) all(child, predicate, out); return out; }
  const element = node as Tree;
  if (predicate(element)) out.push(element);
  all(element.props?.children, predicate, out);
  return out;
};
const byTestId = (node: unknown, testid: string) => all(node, element => element.props?.["data-testid"] === testid);
const text = (node: unknown): string => typeof node === "string" || typeof node === "number" ? String(node) : Array.isArray(node) ? node.map(text).join("") : node && typeof node === "object" ? text((node as Tree).props?.children) : "";

let calls: Array<{ method: string; url: string; body?: string }> = [];
let discovery: Awaited<ReturnType<typeof plannedBody>>;
let answer: { status: number; body: unknown } = { status: 201, body: null };
beforeAll(async () => { discovery = await plannedBody(1, 2); });
beforeEach(() => {
  const decoded = decodeAnalysisResult(resultBody(), ANALYSIS);
  if (!decoded.ok) throw new Error(decoded.code);
  control.job = IDLE_JOB;
  control.boundary = { state: "RESOLVED", value: boundary({ mode: "PERSON", jobScopeSelection: null, investigationScopeHash: null }) };
  control.result = { state: "AVAILABLE", result: decoded.result };
  calls = [];
  vi.stubGlobal("fetch", async (url: string, init: { method: string; body?: string }) => {
    calls.push({ method: init.method, url, body: init.body });
    if (init.method === "POST") return { status: answer.status, json: async () => answer.body };
    return { status: 200, json: async () => ({ ...discovery, discovery: { ...discovery.discovery, analysis: { ...discovery.discovery.analysis, analysisId: ANALYSIS } } }) };
  });
  vi.stubGlobal("localStorage", { getItem: () => "1", setItem: () => undefined });
});
afterEach(() => { vi.unstubAllGlobals(); });

const start = (search: string) => {
  const tab = browser(`${BASE}?${search}`);
  vi.stubGlobal("window", tab.window);
  const props = { data: EMPTY_CAREER_INTELLIGENCE_DATA, ...careerDemoPropsFromSearchParams(careerDemoSearchParamsFromSearch(new URL(tab.url).search)) } as Record<string, unknown>;
  return { tab, view: instance<Record<string, unknown>>(SemanticCareerIntelligenceField), props };
};
const posts = () => calls.filter(call => call.method === "POST");

describe("RI-START · flows", () => {
  it("REPRODUCE: picking states the count — calls only for roles with open pairs, at most the limit; START confirms exactly that", () => {
    const decoded = decodeRoleDiscovery(discovery.discovery, discovery.discovery.analysis.analysisId, POOLS)!;
    const plan = decoded.semanticPlan;
    expect(plan.roles[0].pendingPairs).toBe(0); // the first role fully cached (the real producer, plannedBody(1))
    const started: Array<[unknown, number]> = [];
    const panel = instance<Record<string, unknown>>(RoleDiscoveryPanel);
    const props = { locale: "de", pools: { state: "AVAILABLE", jobPools: [] }, released: POOLS, discovery: { state: "AVAILABLE", discovery: decoded }, onRelease: () => undefined, onClose: () => undefined, onStart: (roles: unknown, n: number) => started.push([roles, n]) };
    // The harness renders one component: the results (no hooks of their own) are rendered from the props the panel hands them.
    const results = () => (RoleDiscoveryResults as unknown as (p: unknown) => Tree)(find(panel.settle(props), RoleDiscoveryResults)!.props);
    let tree = results();
    const pick = (key: string) => all(tree, element => element.props?.["data-testid"] === "rd-role-pick" && element.props["data-role-key"] === key)[0];
    const box = (key: string) => all(pick(key), element => element.type === "input")[0];
    const keyOf = (r: { jobPoolUploadId: string; poolRoleId: string }) => `${r.jobPoolUploadId}:${r.poolRoleId}`;
    const cachedRole = keyOf(plan.roles[0]);
    const pendingRole = keyOf(plan.roles.find(r => (r.pendingPairs ?? 0) > 0 && pick(keyOf(r)))!);
    const third = keyOf(plan.roles.find(r => r.pairs > 0 && keyOf(r) !== cachedRole && keyOf(r) !== pendingRole && pick(keyOf(r)))!);
    expect(byTestId(tree, "rd-start-run")[0].props.disabled).toBe(true);
    // Picked in reverse of the discovery's order: the start still names them in the discovery's order.
    (box(pendingRole).props.onChange as () => void)();
    tree = results();
    (box(cachedRole).props.onChange as () => void)();
    tree = results();
    const pending = plan.roles.find(r => keyOf(r) === pendingRole)!.pendingPairs ?? 0;
    expect(text(byTestId(tree, "rd-start-selection")[0])).toBe(`Auswahl: 2 von höchstens 2 Rollen · würde 1 Aufrufe für ${pending} offene Paare benötigen`);
    // At the limit (2) a further role cannot be picked; the picked ones can be unpicked.
    expect(box(third).props.disabled).toBe(true);
    expect(box(pendingRole).props.disabled).toBe(false);
    expect(byTestId(tree, "rd-start-run")[0].props["data-confirmed-calls"]).toBe(1);
    (byTestId(tree, "rd-start-run")[0].props.onClick as () => void)();
    const order = decoded.roles.map(r => keyOf(r.key)).filter(key => key === cachedRole || key === pendingRole);
    expect(started).toEqual([[order.map(key => { const [jobPoolUploadId, poolRoleId] = key.split(":"); return { jobPoolUploadId, poolRoleId }; }), 1]]);
  });

  it("REPRODUCE: no POST on a load, a reload or a re-read; one START is one POST with the confirmed count — a second click while it runs sends none", async () => {
    const { view, props } = start(RELEASED);
    let tree = view.settle(props);
    await flush();
    tree = view.settle(props);
    expect(posts()).toEqual([]);
    expect(calls.map(c => c.method)).toEqual(["GET"]);
    const panel = () => find(tree, RoleDiscoveryPanel)!;
    expect(panel().props.investigation).toEqual({ state: "IDLE" });
    const roles = [{ jobPoolUploadId: UPLOAD_ALPHA, poolRoleId: "role_fs" }];
    const s = storedInvestigation("COMPLETED", [{ ...roles[0], status: "SUCCEEDED", pairs: 16, stored: 16 }]);
    s.investigation.analysisId = ANALYSIS;
    answer = { status: 201, body: { success: true, created: true, evidenceClass: "STAND_IN", ...s, run: { status: "COMPLETED", roles: [] } } };
    (panel().props.onStart as (r: unknown, n: number) => void)(roles, 1);
    (panel().props.onStart as (r: unknown, n: number) => void)(roles, 1);
    tree = view.settle(props);
    expect(panel().props.investigation).toEqual({ state: "STARTING", roles, confirmedCalls: 1 });
    expect(posts()).toHaveLength(1);
    const body = JSON.parse(posts()[0].body!);
    expect(posts()[0].url).toBe(`/api/career/analyses/${ANALYSIS}/role-discovery/investigations`);
    expect(Object.keys(body).sort()).toEqual(["clientRequestId", "confirmedCalls", "jobPoolUploadIds", "roles"]);
    expect([body.jobPoolUploadIds, body.roles, body.confirmedCalls]).toEqual([POOLS, roles, 1]);
    expect(typeof body.clientRequestId === "string" && body.clientRequestId.length > 0).toBe(true);
    await flush();
    tree = view.settle(props);
    expect(panel().props.investigation).toMatchObject({ state: "STORED", created: true, investigation: { status: "COMPLETED", provider: "stand-in" } });
    // A new START is a new request (its own clientRequestId); still one POST per click.
    (panel().props.onStart as (r: unknown, n: number) => void)(roles, 1);
    await flush();
    expect(posts()).toHaveLength(2);
    expect(JSON.parse(posts()[1].body!).clientRequestId).not.toBe(body.clientRequestId);
    // Re-reading the plan is a GET of the same release, nothing else.
    (panel().props.onReread as () => void)();
    tree = view.settle(props);
    await flush();
    tree = view.settle(props);
    expect(calls.filter(c => c.method === "GET")).toHaveLength(2);
    expect(new Set(calls.filter(c => c.method === "GET").map(c => c.url)).size).toBe(1);
    expect(posts()).toHaveLength(2);
    view.unmount();
    // A reload of the same URL starts nothing.
    const again = start(RELEASED);
    again.view.settle(again.props);
    await flush();
    again.view.settle(again.props);
    expect(posts()).toHaveLength(2);
    again.view.unmount();
  });

  it("REPRODUCE: closing the panel while the POST is open drops its late answer; the next release starts without it", async () => {
    const { view, props } = start(RELEASED);
    let tree = view.settle(props);
    await flush();
    tree = view.settle(props);
    let release!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    const s = storedInvestigation("COMPLETED", [{ jobPoolUploadId: UPLOAD_ALPHA, poolRoleId: "role_fs", status: "SUCCEEDED" }]);
    s.investigation.analysisId = ANALYSIS;
    vi.stubGlobal("fetch", async (url: string, init: { method: string; body?: string }) => {
      calls.push({ method: init.method, url, body: init.body });
      if (init.method === "POST") { await gate; return { status: 201, json: async () => ({ success: true, created: true, evidenceClass: "STAND_IN", ...s }) }; }
      return { status: 200, json: async () => ({ ...discovery, discovery: { ...discovery.discovery, analysis: { ...discovery.discovery.analysis, analysisId: ANALYSIS } } }) };
    });
    (find(tree, RoleDiscoveryPanel)!.props.onStart as (r: unknown, n: number) => void)([{ jobPoolUploadId: UPLOAD_ALPHA, poolRoleId: "role_fs" }], 1);
    tree = view.settle(props);
    (find(tree, RoleDiscoveryPanel)!.props.onClose as () => void)();
    tree = view.settle(props);
    release();
    await flush();
    tree = view.settle(props);
    expect(find(tree, RoleDiscoveryPanel)).toBeNull();
    view.unmount();
  });

  it("inverse: without a release nothing is read and nothing is posted; the panel's start waits for the user", async () => {
    const { tab, view, props } = start(`focus=CAPABILITY&investigationMode=PERSON&analysisId=${ANALYSIS}`);
    view.settle(props);
    await flush();
    view.settle(props);
    expect(calls).toEqual([]);
    expect(tab.writes).toEqual([]);
    view.unmount();
  });
});
