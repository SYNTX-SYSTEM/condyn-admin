import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import { browser, find, instance } from "../pxj-first-screen/harness";
import { ANALYSIS, boundary, resultBody } from "../pxj-first-screen/fixtures";
import { autoMatch, autoMatchBody, rankingBody } from "./fixtures";

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
import { useAutoMatch, useJobRanking, type AutoMatchRunState, type AutoMatchWatch, type JobRankingState } from "../../../lib/career/ui/auto-match";

const BASE = "http://127.0.0.1/career/demo";
const IDLE_JOB = { state: "IDLE", activeJobId: null, resultAnalysisId: null, canonicalAnalysis: null, currentOperation: null, attemptCount: null, errorCode: null, errorSummary: null, httpStatus: null };
const flush = async () => { for (let i = 0; i < 10; i += 1) await Promise.resolve(); };
type Tree = ReactElement<Record<string, unknown>>;
const PERSON = `focus=CAPABILITY&investigationMode=PERSON&analysisId=${ANALYSIS}`;
const AUTO = `/api/career/analyses/${ANALYSIS}/auto-match`, RANKING = `/api/career/analyses/${ANALYSIS}/job-ranking`;

/** The server as the test plays it: the run's states in turn (the last one stays), the ranking for this analysis. */
let calls: Array<{ method: string; url: string; init: Record<string, unknown> }> = [];
type Run = AutoMatchRunState | [AutoMatchRunState, Record<string, unknown>];
let runs: Run[] = [];
beforeEach(() => {
  const decoded = decodeAnalysisResult(resultBody(), ANALYSIS);
  if (!decoded.ok) throw new Error(decoded.code);
  control.job = IDLE_JOB;
  control.boundary = { state: "RESOLVED", value: boundary({ mode: "PERSON", jobScopeSelection: null, investigationScopeHash: null }) };
  control.result = { state: "AVAILABLE", result: decoded.result };
  calls = []; runs = ["COMPLETED"];
  vi.stubGlobal("fetch", async (url: string, init: Record<string, unknown>) => {
    calls.push({ method: String(init.method), url, init });
    if (url === AUTO) { const next = runs.length > 1 ? runs.shift()! : runs[0]; const [state, patch] = Array.isArray(next) ? next : [next, {}]; return { status: 200, json: async () => autoMatchBody(state, patch) }; }
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

  it("REPRODUCE: NOT_STARTED → RUNNING → RUNNING (unmoved) → COMPLETED — 2 s, falling back while unmoved; the ranking at each move, then quiet", async () => {
    vi.useFakeTimers();
    runs = ["NOT_STARTED", "RUNNING", "RUNNING", "COMPLETED"];
    const { view, props } = start(PERSON);
    let tree = view.settle(props);
    const settle = async () => { await flush(); tree = view.settle(props); await flush(); tree = view.settle(props); };
    await settle();
    expect([gets(AUTO), gets(RANKING)]).toEqual([1, 0]);
    expect(find(tree, AutoJobRankingPanel)!.props.watch).toMatchObject({ read: { autoMatch: { state: "NOT_STARTED" } } });
    await vi.advanceTimersByTimeAsync(2000); await settle();
    expect([gets(AUTO), gets(RANKING)], "RUNNING: read again, the ranking read during the run").toEqual([2, 1]);
    await vi.advanceTimersByTimeAsync(2000); await settle();
    expect([gets(AUTO), gets(RANKING)], "unmoved: no new ranking").toEqual([3, 1]);
    await vi.advanceTimersByTimeAsync(2000); await settle();
    expect(gets(AUTO), "unmoved: the next read falls back to 4 s").toBe(3);
    await vi.advanceTimersByTimeAsync(2000); await settle();
    expect(gets(AUTO)).toBe(4);
    expect(find(tree, AutoJobRankingPanel)!.props.watch).toMatchObject({ read: { autoMatch: { state: "COMPLETED" } }, waitedOut: false });
    expect(gets(RANKING)).toBe(2);
    await vi.advanceTimersByTimeAsync(60_000); await settle();
    expect([gets(AUTO), gets(RANKING)], "a settled run is not read again").toEqual([4, 2]);
    expect(calls.every(call => call.method === "GET")).toBe(true);
    view.unmount();
  });

  it("REPRODUCE: a RUNNING run is read past 3 min without end (falling back to 10 s) and is never waited out; a moving run stays at 2 s", async () => {
    vi.useFakeTimers();
    runs = ["RUNNING"];
    const { view, props } = start(PERSON);
    let tree = view.settle(props);
    const settle = async () => { await flush(); tree = view.settle(props); await flush(); tree = view.settle(props); };
    await settle();
    // Reads at 0, 2, 6, 14, then every 10 s: 24 … 394.
    await vi.advanceTimersByTimeAsync(400_000); await settle();
    expect(gets(AUTO)).toBe(42);
    expect(find(tree, AutoJobRankingPanel)!.props.watch).toMatchObject({ read: { autoMatch: { state: "RUNNING" } }, waitedOut: false });
    await vi.advanceTimersByTimeAsync(100_000); await settle();
    expect(gets(AUTO), "still read, every 10 s").toBe(52);
    expect(gets(RANKING), "the unmoved run is ranked once").toBe(1);
    view.unmount();
    vi.useRealTimers();
    // Moving: rolesEvaluated 1, 2, 3, 4 — every read is a move, so every 2 s, and each move reads the ranking.
    vi.useFakeTimers();
    calls = [];
    const budget = (n: number) => ({ ...(autoMatch("RUNNING").budget as object), rolesEvaluated: n });
    runs = [1, 2, 3, 4].map(n => ["RUNNING", { budget: budget(n) }] as Run);
    const moving = start(PERSON);
    moving.view.settle(moving.props);
    for (let step = 1; step <= 4; step += 1) {
      await flush(); moving.view.settle(moving.props); await flush(); moving.view.settle(moving.props);
      expect([gets(AUTO), gets(RANKING)], `move ${step}`).toEqual([step, step]);
      await vi.advanceTimersByTimeAsync(2000);
    }
    moving.view.unmount();
    vi.useRealTimers();
    // A resumption alone (revision 0 → 1, nothing else changed) is a move: back to 2 s after the fallback.
    vi.useFakeTimers();
    calls = [];
    runs = ["RUNNING", "RUNNING", ["RUNNING", { revision: 1 }]];
    const resumed = start(PERSON);
    resumed.view.settle(resumed.props);
    const settleResumed = async () => { await flush(); resumed.view.settle(resumed.props); await flush(); resumed.view.settle(resumed.props); };
    await settleResumed();
    await vi.advanceTimersByTimeAsync(2000); await settleResumed();
    await vi.advanceTimersByTimeAsync(4000); await settleResumed();
    expect([gets(AUTO), gets(RANKING)], "reads at 0, 2, 6; the resumption reads the ranking").toEqual([3, 2]);
    await vi.advanceTimersByTimeAsync(2000); await settleResumed();
    expect(gets(AUTO), "the next read 2 s after the resumption, not 8 s").toBe(4);
    resumed.view.unmount();
  });

  it("REPRODUCE: STALLED is read every 15 s without end; resumed (revision 1) it is RUNNING again — the ranking follows each change", async () => {
    vi.useFakeTimers();
    const resumed = { revision: 1, budget: { ...(autoMatch("RUNNING").budget as object), rolesEvaluated: 3 } };
    runs = ["RUNNING", "STALLED", "STALLED", ["RUNNING", resumed]];
    const { view, props } = start(PERSON);
    let tree = view.settle(props);
    const settle = async () => { await flush(); tree = view.settle(props); await flush(); tree = view.settle(props); };
    await settle();
    await vi.advanceTimersByTimeAsync(2000); await settle();
    expect(find(tree, AutoJobRankingPanel)!.props.watch).toMatchObject({ read: { autoMatch: { state: "STALLED", reason: "WORKER_LOST" } }, waitedOut: false });
    expect([gets(AUTO), gets(RANKING)]).toEqual([2, 2]);
    await vi.advanceTimersByTimeAsync(14_000); await settle();
    expect(gets(AUTO), "not before 15 s").toBe(2);
    await vi.advanceTimersByTimeAsync(1000); await settle();
    expect([gets(AUTO), gets(RANKING)], "STALLED unmoved: no new ranking").toEqual([3, 2]);
    await vi.advanceTimersByTimeAsync(15_000); await settle();
    expect(find(tree, AutoJobRankingPanel)!.props.watch).toMatchObject({ read: { autoMatch: { state: "RUNNING", revision: 1 } } });
    expect([gets(AUTO), gets(RANKING)]).toEqual([4, 3]);
    await vi.advanceTimersByTimeAsync(2000); await settle();
    expect(gets(AUTO), "a resumed run is read at 2 s again").toBe(5);
    view.unmount();
    // Inverse: a run STALLED for good is read on, every 15 s, and never waited out.
    vi.useRealTimers(); vi.useFakeTimers();
    calls = []; runs = ["STALLED"];
    const held = start(PERSON);
    let heldTree = held.view.settle(held.props);
    await flush(); heldTree = held.view.settle(held.props);
    await vi.advanceTimersByTimeAsync(600_000); await flush(); heldTree = held.view.settle(held.props);
    expect(gets(AUTO)).toBe(41);
    expect(find(heldTree, AutoJobRankingPanel)!.props.watch).toMatchObject({ waitedOut: false });
    held.view.unmount();
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

  it("REPRODUCE (resumePending): PARTIAL · ROLE_FAILURES with a due continuation is read every 15 s; taken up (RUNNING, revision 1) back to 2 s; inverse: not due — quiet", async () => {
    vi.useFakeTimers();
    const due: Run = ["PARTIAL", { reason: "ROLE_FAILURES", resumePending: true }];
    runs = [due, due, ["RUNNING", { revision: 1 }]];
    const { view, props } = start(PERSON);
    let tree = view.settle(props);
    const settle = async () => { await flush(); tree = view.settle(props); await flush(); tree = view.settle(props); };
    await settle();
    expect(find(tree, AutoJobRankingPanel)!.props.watch).toMatchObject({ read: { autoMatch: { state: "PARTIAL", resumePending: true } } });
    await vi.advanceTimersByTimeAsync(14_000); await settle();
    expect(gets(AUTO), "not before 15 s").toBe(1);
    await vi.advanceTimersByTimeAsync(1000); await settle();
    expect(gets(AUTO)).toBe(2);
    await vi.advanceTimersByTimeAsync(15_000); await settle();
    expect(find(tree, AutoJobRankingPanel)!.props.watch).toMatchObject({ read: { autoMatch: { state: "RUNNING", revision: 1 } } });
    expect([gets(AUTO), gets(RANKING)], "the continuation reads the ranking again").toEqual([3, 2]);
    await vi.advanceTimersByTimeAsync(2000); await settle();
    expect(gets(AUTO)).toBe(4);
    view.unmount();
    // FAILED with a due continuation: read on every 15 s, no end on this side.
    vi.useRealTimers(); vi.useFakeTimers();
    calls = []; runs = [["FAILED", { resumePending: true }]];
    const failed = start(PERSON);
    failed.view.settle(failed.props); await flush(); failed.view.settle(failed.props);
    await vi.advanceTimersByTimeAsync(600_000); await flush(); failed.view.settle(failed.props);
    expect(gets(AUTO)).toBe(41);
    failed.view.unmount();
    // Inverse: no continuation due — a settled run is read once.
    vi.useRealTimers(); vi.useFakeTimers();
    calls = []; runs = [["PARTIAL", { reason: "ROLE_FAILURES", resumePending: false }]];
    const quiet = start(PERSON);
    quiet.view.settle(quiet.props); await flush(); quiet.view.settle(quiet.props);
    await vi.advanceTimersByTimeAsync(600_000); await flush(); quiet.view.settle(quiet.props);
    expect(gets(AUTO)).toBe(1);
    quiet.view.unmount();
  });

  it("REPRODUCE: every state with a run reads the ranking (RUNNING and STALLED too, so it grows); NOT_STARTED does not (before the wait ends)", async () => {
    for (const state of ["DISABLED", "COMPLETED", "PARTIAL", "FAILED", "SKIPPED", "RUNNING", "STALLED", "NOT_STARTED"] as const) {
      vi.useFakeTimers();
      calls = []; runs = [state];
      const { view, props } = start(PERSON);
      view.settle(props); await flush(); view.settle(props); await flush(); view.settle(props);
      expect(gets(RANKING), state).toBe(state === "NOT_STARTED" ? 0 : 1);
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

  it("REPRODUCE: the ranking shown stays while the next one is read (it grows, it does not blink); inverse: another analysis reads afresh", async () => {
    let release!: () => void;
    let gate: Promise<void> = Promise.resolve();
    let served = 0;
    vi.stubGlobal("fetch", async (url: string, init: Record<string, unknown>) => {
      calls.push({ method: String(init.method), url, init });
      served += 1;
      const at = served;
      await gate;
      return { status: 200, json: async () => rankingBody({ analysisId: url.includes(ANALYSIS) ? ANALYSIS : "CAN_OTHER_ANALYSIS", counts: { pools: 2, roles: 4 + at, ranked: 4 } }) };
    });
    const hook = instance<{ id: string | null; key: string | null }>(({ id, key }: { id: string | null; key: string | null }) => useJobRanking(id, key) as unknown as Tree);
    hook.render({ id: ANALYSIS, key: "RUNNING:0:1:" });
    await flush();
    let state = hook.render({ id: ANALYSIS, key: "RUNNING:0:1:" }) as unknown as JobRankingState;
    expect(state).toMatchObject({ state: "AVAILABLE", ranking: { counts: { roles: 5 } } });
    gate = new Promise<void>(resolve => { release = resolve; });
    state = hook.render({ id: ANALYSIS, key: "RUNNING:0:2:" }) as unknown as JobRankingState;
    expect(state, "the first frame of the next key keeps the last ranking").toMatchObject({ state: "AVAILABLE", ranking: { counts: { roles: 5 } } });
    await flush();
    state = hook.render({ id: ANALYSIS, key: "RUNNING:0:2:" }) as unknown as JobRankingState;
    expect(state, "while the next read is open, the last ranking stands").toMatchObject({ state: "AVAILABLE", ranking: { counts: { roles: 5 } } });
    release(); await flush();
    state = hook.render({ id: ANALYSIS, key: "RUNNING:0:2:" }) as unknown as JobRankingState;
    expect(state).toMatchObject({ state: "AVAILABLE", ranking: { counts: { roles: 6 } } });
    gate = new Promise<void>(resolve => { release = resolve; });
    expect(hook.render({ id: "CAN_OTHER_ANALYSIS", key: "RUNNING:0:1:" }), "not even for one frame").toEqual({ state: "LOADING" });
    await flush();
    state = hook.render({ id: "CAN_OTHER_ANALYSIS", key: "RUNNING:0:1:" }) as unknown as JobRankingState;
    expect(state, "another analysis never shows this one's ranking").toEqual({ state: "LOADING" });
    release(); await flush();
    expect(calls.every(call => call.method === "GET")).toBe(true);
    hook.unmount();
  });
});
