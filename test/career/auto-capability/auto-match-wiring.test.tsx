import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import { browser, find, instance } from "../pxj-first-screen/harness";
import { ANALYSIS, boundary, resultBody } from "../pxj-first-screen/fixtures";
import { autoMatchBody, rankingBody } from "./fixtures";

/**
 * AUTO_CAPABILITY (owner "SFE::AUTOMATED_CAPABILITY_TO_JOB_EXECUTE", GRÜN point 3): after the analysis of a PERSON source the field goes
 * on without further input. For the PERSON result on view it reads the run the worker starts by itself (GET auto-match, then every 2 s
 * while it has not settled, at most 3 min) and, once it has settled, the ranking (GET job-ranking) — and shows both in the role
 * discovery's slot, the manual discovery's entry as its last row. No pool picker, no role picker, no confirmation, no POST, no
 * role-discovery read: the manual discovery keeps its own explicit release (discovery-panel-flow.test.tsx).
 * Harness: ../pxj-first-screen/harness.ts (the field's own hooks; fetch, window and the timers are stand-ins).
 */
const control = vi.hoisted(() => ({ job: null as unknown, boundary: null as unknown, result: null as unknown }));
vi.mock("react", async (importOriginal) => (await import("../pxj-first-screen/harness")).mockReact(await importOriginal<object>()));
vi.mock("../../../lib/career/ui/useCareerAnalysisJob", () => ({ useCareerAnalysisJob: () => ({ state: control.job, submitAnalysis: async () => undefined, resumeJob: () => undefined }) }));
vi.mock("../../../lib/career/ui/useJobScope", () => ({ useJobScopeValidation: () => ({ state: "NONE" }) }));
vi.mock("../../../lib/career/ui/useJobPoolSources", () => ({ useAnalysisSources: () => ({ state: "IDLE" }) }));
vi.mock("../../../lib/career/ui/useJobPool", async (importOriginal) => ({ ...(await importOriginal<typeof import("../../../lib/career/ui/useJobPool")>()), useJobPoolWorkflow: () => ({ pools: { state: "AVAILABLE", jobPools: [] }, upload: { state: "IDLE" }, selectedJobPoolUploadId: null, view: { state: "IDLE" }, matches: { state: "IDLE" }, submitUpload: async () => undefined, select: () => undefined, reloadPools: async () => undefined, reloadMatches: async () => undefined }) }));
vi.mock("../../../lib/career/ui/useRoleInvestigation", async (importOriginal) => ({ ...(await importOriginal<typeof import("../../../lib/career/ui/useRoleInvestigation")>()), useAnalysisBoundary: (id: string | null) => id === null ? { state: "IDLE" } : control.boundary, useSelectedRoleCoverage: () => ({ state: "IDLE" }) }));
vi.mock("../../../lib/career/ui/useAnalysisResult", async (importOriginal) => ({ ...(await importOriginal<typeof import("../../../lib/career/ui/useAnalysisResult")>()), useAnalysisResult: (id: string | null) => id === null ? { state: "IDLE" } : control.result }));

import { SemanticCareerIntelligenceField } from "../../../app/components/career/demo/SemanticCareerIntelligenceField";
import { AutoJobRankingPanel } from "../../../app/components/career/demo/AutoJobRankingPanel";
import { RoleDiscoveryEntry, RoleDiscoveryPanel } from "../../../app/components/career/demo/RoleDiscoveryPanel";
import { EMPTY_CAREER_INTELLIGENCE_DATA } from "../../../app/career/demo/demo-data";
import { careerDemoPropsFromSearchParams, careerDemoSearchParamsFromSearch } from "../../../lib/career/ui/career-demo-url";
import { decodeAnalysisResult } from "../../../lib/career/view-model/pxj-first-screen";
import { useAutoMatch, type AutoMatchRunState, type AutoMatchWatch } from "../../../lib/career/ui/auto-match";

const BASE = "http://127.0.0.1/career/demo";
const IDLE_JOB = { state: "IDLE", activeJobId: null, resultAnalysisId: null, canonicalAnalysis: null, currentOperation: null, attemptCount: null, errorCode: null, errorSummary: null, httpStatus: null };
const flush = async () => { for (let i = 0; i < 10; i += 1) await Promise.resolve(); };
type Tree = ReactElement<Record<string, unknown>>;
const PERSON = `focus=CAPABILITY&investigationMode=PERSON&analysisId=${ANALYSIS}`;
const AUTO = `/api/career/analyses/${ANALYSIS}/auto-match`, RANKING = `/api/career/analyses/${ANALYSIS}/job-ranking`;

/** The server as the test plays it: the run's states in turn (the last one stays), the ranking for this analysis. */
let calls: Array<{ method: string; url: string; init: Record<string, unknown> }> = [];
let runs: AutoMatchRunState[] = [];
beforeEach(() => {
  const decoded = decodeAnalysisResult(resultBody(), ANALYSIS);
  if (!decoded.ok) throw new Error(decoded.code);
  control.job = IDLE_JOB;
  control.boundary = { state: "RESOLVED", value: boundary({ mode: "PERSON", jobScopeSelection: null, investigationScopeHash: null }) };
  control.result = { state: "AVAILABLE", result: decoded.result };
  calls = []; runs = ["COMPLETED"];
  vi.stubGlobal("fetch", async (url: string, init: Record<string, unknown>) => {
    calls.push({ method: String(init.method), url, init });
    if (url === AUTO) { const state = runs.length > 1 ? runs.shift()! : runs[0]; return { status: 200, json: async () => autoMatchBody(state) }; }
    if (url === RANKING) return { status: 200, json: async () => rankingBody({ analysisId: ANALYSIS }) };
    return { status: 404, json: async () => ({ issues: [{ code: "ERR_UNEXPECTED_ROUTE" }] }) };
  });
  vi.stubGlobal("localStorage", { getItem: () => "1", setItem: () => undefined });
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

const start = (search: string) => {
  const tab = browser(`${BASE}?${search}`);
  vi.stubGlobal("window", tab.window);
  const props = { data: EMPTY_CAREER_INTELLIGENCE_DATA, ...careerDemoPropsFromSearchParams(careerDemoSearchParamsFromSearch(new URL(tab.url).search)) } as Record<string, unknown>;
  return { tab, view: instance<Record<string, unknown>>(SemanticCareerIntelligenceField), props };
};
const gets = (url: string) => calls.filter(call => call.url === url).length;

describe("AC-FLOW · the PERSON result goes on by itself", () => {
  it("REPRODUCE: the run is read at once, the ranking once it has settled — GET only, no-store, nothing else; the panel shows both", async () => {
    const { tab, view, props } = start(PERSON);
    let tree = view.settle(props);
    await flush();
    tree = view.settle(props);
    await flush();
    tree = view.settle(props);
    expect(calls.map(call => `${call.method} ${call.url}`)).toEqual([`GET ${AUTO}`, `GET ${RANKING}`]);
    for (const call of calls) expect(call.init).toMatchObject({ method: "GET", cache: "no-store" });
    const panel = find(tree, AutoJobRankingPanel)!;
    expect(panel.props.watch).toMatchObject({ read: { state: "AVAILABLE", autoMatch: { state: "COMPLETED" } }, waitedOut: false });
    expect(panel.props.ranking).toMatchObject({ state: "AVAILABLE", ranking: { analysisId: ANALYSIS } });
    // The manual discovery stays: its entry is the panel's last row, the same action as before; its own panel is not open.
    const entry = find(panel.props.children, RoleDiscoveryEntry)!;
    expect(entry.props.inline).toBe(true);
    expect(find(tree, RoleDiscoveryPanel)).toBeNull();
    // No URL step: the automatic path writes nothing to the address.
    expect(tab.writes).toEqual([]);
    view.unmount();
  });

  it("REPRODUCE: NOT_STARTED → RUNNING → COMPLETED — read every 2 s while open, the ranking once after it settled, then quiet", async () => {
    vi.useFakeTimers();
    runs = ["NOT_STARTED", "RUNNING", "RUNNING", "COMPLETED"];
    const { view, props } = start(PERSON);
    let tree = view.settle(props);
    await flush(); tree = view.settle(props);
    expect([gets(AUTO), gets(RANKING)]).toEqual([1, 0]);
    expect(find(tree, AutoJobRankingPanel)!.props.watch).toMatchObject({ read: { autoMatch: { state: "NOT_STARTED" } } });
    for (let step = 2; step <= 4; step += 1) { await vi.advanceTimersByTimeAsync(2000); await flush(); tree = view.settle(props); expect(gets(AUTO), `read ${step}`).toBe(step); }
    expect(find(tree, AutoJobRankingPanel)!.props.watch).toMatchObject({ read: { autoMatch: { state: "COMPLETED" } }, waitedOut: false });
    await flush(); tree = view.settle(props); await flush(); tree = view.settle(props);
    expect(gets(RANKING)).toBe(1);
    await vi.advanceTimersByTimeAsync(60_000); await flush(); view.settle(props);
    expect([gets(AUTO), gets(RANKING)], "a settled run is not read again").toEqual([4, 1]);
    expect(calls.every(call => call.method === "GET")).toBe(true);
    view.unmount();
  });

  it("REPRODUCE: a run that never settles (an older analysis) — the wait ends after 3 min, then the ranking is read once (name relation)", async () => {
    vi.useFakeTimers();
    runs = ["NOT_STARTED"];
    const { view, props } = start(PERSON);
    view.settle(props);
    await flush(); view.settle(props);
    await vi.advanceTimersByTimeAsync(185_000); await flush(); view.settle(props); await flush();
    const tree = view.settle(props);
    const reads = gets(AUTO);
    expect(reads).toBeGreaterThanOrEqual(89);
    expect(reads).toBeLessThanOrEqual(91);
    expect(find(tree, AutoJobRankingPanel)!.props.watch).toMatchObject({ waitedOut: true });
    expect(gets(RANKING)).toBe(1);
    await vi.advanceTimersByTimeAsync(600_000); await flush(); view.settle(props);
    expect(gets(AUTO), "nothing after the wait").toBe(reads);
    view.unmount();
  });

  it("REPRODUCE: every settled state reads the ranking; RUNNING and NOT_STARTED do not (before the wait ends)", async () => {
    for (const state of ["DISABLED", "COMPLETED", "PARTIAL", "FAILED", "SKIPPED", "RUNNING", "NOT_STARTED"] as const) {
      vi.useFakeTimers();
      calls = []; runs = [state];
      const { view, props } = start(PERSON);
      view.settle(props); await flush(); view.settle(props); await flush(); view.settle(props);
      expect(gets(RANKING), state).toBe(state === "RUNNING" || state === "NOT_STARTED" ? 0 : 1);
      view.unmount();
      vi.useRealTimers();
    }
  });

  it("inverse: no PERSON result on view — PERSON × JOB, JOB, no analysis, a boundary of another mode — nothing is read, no panel", async () => {
    const cases: Array<[string, () => void]> = [
      [`focus=CAPABILITY&investigationMode=PERSON_X_JOB&analysisId=${ANALYSIS}`, () => undefined],
      [`focus=CAPABILITY&investigationMode=JOB&analysisId=${ANALYSIS}`, () => undefined],
      ["focus=CAPABILITY&investigationMode=PERSON", () => undefined],
      [PERSON, () => { control.result = { state: "LOADING" }; }]
    ];
    for (const [search, setup] of cases) {
      calls = []; setup();
      const { view, props } = start(search);
      let tree = view.settle(props); await flush(); tree = view.settle(props);
      expect(calls, search).toEqual([]);
      expect(find(tree, AutoJobRankingPanel), search).toBeNull();
      view.unmount();
    }
  });

  it("inverse: the manual discovery open (its entry, or a released URL) — the automatic panel steps aside; its reads never start one", async () => {
    const { view, props } = start(PERSON);
    let tree = view.settle(props); await flush(); tree = view.settle(props);
    (find(find(tree, AutoJobRankingPanel)!.props.children, RoleDiscoveryEntry)!.props.onOpen as () => void)();
    tree = view.settle(props);
    expect(find(tree, AutoJobRankingPanel)).toBeNull();
    expect(find(tree, RoleDiscoveryPanel)).not.toBeNull();
    expect(calls.some(call => call.url.includes("/role-discovery"))).toBe(false);
    expect(calls.every(call => call.method === "GET")).toBe(true);
    view.unmount();
    const released = start(`${PERSON}&discoveryPoolUploadId=JPOOL_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA`);
    tree = released.view.settle(released.props); await flush(); tree = released.view.settle(released.props);
    expect(find(tree, AutoJobRankingPanel)).toBeNull();
    released.view.unmount();
  });

  it("inverse: a new analysis drops the old run's late answer and reads its own (the hook, as the field calls it)", async () => {
    let release!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    const other = "CAN_OTHER_ANALYSIS";
    vi.stubGlobal("fetch", async (url: string, init: Record<string, unknown>) => {
      calls.push({ method: String(init.method), url, init });
      if (url === AUTO) { await gate; return { status: 200, json: async () => autoMatchBody("COMPLETED") }; }
      return { status: 200, json: async () => autoMatchBody("DISABLED") };
    });
    const hook = instance<{ id: string | null }>(({ id }: { id: string | null }) => useAutoMatch(id) as unknown as Tree);
    hook.render({ id: ANALYSIS });
    hook.render({ id: other });
    await flush();
    release(); await flush();
    const watch = hook.render({ id: other }) as unknown as AutoMatchWatch;
    expect(watch.read).toMatchObject({ state: "AVAILABLE", autoMatch: { state: "DISABLED" } });
    expect(calls.map(call => call.url)).toEqual([AUTO, `/api/career/analyses/${other}/auto-match`]);
    // No analysis at all: idle, nothing read.
    expect((hook.render({ id: null }) as unknown as AutoMatchWatch).read).toEqual({ state: "IDLE" });
    expect(calls).toHaveLength(2);
    hook.unmount();
  });
});
