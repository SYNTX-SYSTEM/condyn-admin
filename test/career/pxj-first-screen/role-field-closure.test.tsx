import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import { ANALYSIS, ROLE, UPLOAD, boundary, coverage, resultBody } from "./fixtures";

/**
 * Owner "RECURSIVE_ROLE_FIELD_CLOSURE" (GELB CONDYN_ROLE_FIELD_CLOSURE_2026-10-22 §5): F-RF-1 … F-RF-3 over several renders of the
 * Capability Field component itself.
 *
 * What this harness proves and what not: `react`'s hooks are replaced by a minimal runtime for one component instance (useState with
 * lazy initialisers, useRef, useMemo / useCallback with dependency comparison, useEffect committed after each render, in
 * declaration order, cleanup before re-run). `window.history.replaceState` is a stub that keeps the URL. The read hooks (job,
 * scope validation, boundary, result, B2, pool workflow) are steered here. So the tests prove the field's own state logic across
 * renders: which analysis it shows, what it writes to the URL, which first-screen state it hands to its children. They do not
 * prove React's real scheduling (batching, effect timing against paint), the children's rendering or a browser reload; a reload
 * is modelled as a fresh mount with the URL's parameters.
 */
const runtime = vi.hoisted(() => ({
  slots: [] as unknown[],
  effects: [] as Array<{ deps: unknown[] | undefined; cleanup?: void | (() => void) }>,
  pending: [] as Array<() => void>,
  cursor: 0,
  effectCursor: 0
}));
vi.mock("react", async (importOriginal) => {
  const original = await importOriginal<typeof import("react")>();
  const same = (a: unknown[] | undefined, b: unknown[] | undefined) => !!a && !!b && a.length === b.length && a.every((value, at) => Object.is(value, b[at]));
  const useState = <T,>(initial: T | (() => T)) => {
    const index = runtime.cursor++;
    if (!(index in runtime.slots)) runtime.slots[index] = typeof initial === "function" ? (initial as () => T)() : initial;
    return [runtime.slots[index] as T, (next: T | ((previous: T) => T)) => { runtime.slots[index] = typeof next === "function" ? (next as (previous: T) => T)(runtime.slots[index] as T) : next; }] as const;
  };
  const useRef = <T,>(initial: T) => { const index = runtime.cursor++; if (!(index in runtime.slots)) runtime.slots[index] = { current: initial }; return runtime.slots[index] as { current: T }; };
  const useMemo = <T,>(factory: () => T, deps?: unknown[]) => {
    const index = runtime.cursor++;
    const previous = runtime.slots[index] as { deps?: unknown[]; value: T } | undefined;
    if (previous && same(previous.deps, deps)) return previous.value;
    const value = factory(); runtime.slots[index] = { deps, value }; return value;
  };
  const useCallback = <T,>(callback: T, deps?: unknown[]) => useMemo(() => callback, deps);
  const useEffect = (effect: () => void | (() => void), deps?: unknown[]) => {
    const index = runtime.effectCursor++;
    const previous = runtime.effects[index];
    if (previous && same(previous.deps, deps)) return;
    runtime.pending.push(() => { if (typeof previous?.cleanup === "function") previous.cleanup(); runtime.effects[index] = { deps, cleanup: effect() }; });
  };
  const hooks = { useState, useRef, useMemo, useCallback, useEffect, useLayoutEffect: useEffect };
  return { ...original, ...hooks, default: { ...(original as unknown as { default: object }).default, ...hooks } };
});

type Validation = { state: string; scope?: { jobPoolUploadId: string; poolRoleId: string }; reason?: string; roleTitle?: string; organizationId?: string; organizationName?: string | null; poolName?: string };
const control = vi.hoisted(() => ({
  job: { state: "IDLE", activeJobId: null, resultAnalysisId: null, canonicalAnalysis: null, currentOperation: null, attemptCount: null, errorCode: null, errorSummary: null, httpStatus: null } as Record<string, unknown>,
  submitted: [] as unknown[],
  validation: (scope: { jobPoolUploadId: string; poolRoleId: string } | null): Validation => scope === null ? { state: "NONE" } : { state: "VALID", scope, roleTitle: "Distributed Systems Architect", organizationId: "org_pink_alpha", organizationName: "Alpha Industrial Systems", poolName: "PINK pool" },
  boundaries: {} as Record<string, unknown>,
  results: {} as Record<string, unknown>,
  resultReads: [] as Array<string | null>
}));
vi.mock("../../../lib/career/ui/useCareerAnalysisJob", () => ({ useCareerAnalysisJob: () => ({ state: control.job, submitAnalysis: async (payload: unknown) => { control.submitted.push(payload); } }) }));
vi.mock("../../../lib/career/ui/useJobScope", () => ({ useJobScopeValidation: (scope: { jobPoolUploadId: string; poolRoleId: string } | null) => control.validation(scope) }));
vi.mock("../../../lib/career/ui/useJobPool", async (importOriginal) => ({ ...(await importOriginal<typeof import("../../../lib/career/ui/useJobPool")>()), useJobPoolWorkflow: () => ({ pools: { state: "IDLE" }, upload: { state: "IDLE" }, selectedJobPoolUploadId: null, view: { state: "IDLE" }, matches: { state: "IDLE" }, submitUpload: async () => undefined, select: () => undefined, reloadPools: async () => undefined, reloadMatches: async () => undefined }) }));
vi.mock("../../../lib/career/ui/useRoleInvestigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../lib/career/ui/useRoleInvestigation")>()),
  useAnalysisBoundary: (analysisId: string | null) => analysisId === null ? { state: "IDLE" } : control.boundaries[analysisId] ?? { state: "RESOLVING" },
  useSelectedRoleCoverage: (analysisId: string | null) => analysisId === null ? { state: "IDLE" } : { state: "AVAILABLE", coverage: coverage() }
}));
vi.mock("../../../lib/career/ui/useAnalysisResult", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../lib/career/ui/useAnalysisResult")>()),
  useAnalysisResult: (analysisId: string | null) => { control.resultReads.push(analysisId); return analysisId === null ? { state: "IDLE" } : control.results[analysisId] ?? { state: "LOADING" }; }
}));

import { SemanticCareerIntelligenceField } from "../../../app/components/career/demo/SemanticCareerIntelligenceField";
import { PxjAnalysisJobOffer, PxjFirstScreen } from "../../../app/components/career/demo/PxjFirstScreen";
import { SourceDock } from "../../../app/components/career/demo/SourceDock";
import { SyntxInvestigationSelector } from "../../../app/components/career/demo/SyntxInvestigationSelector";
import { EMPTY_CAREER_INTELLIGENCE_DATA } from "../../../app/career/demo/demo-data";
import { decodeAnalysisResult } from "../../../lib/career/view-model/pxj-first-screen";

const A0 = "ANL_1792000000000_0", A1 = ANALYSIS, A2 = "ANL_1792000000002_2";
const SCOPE = { jobPoolUploadId: UPLOAD, poolRoleId: ROLE };
const OTHER = { jobPoolUploadId: UPLOAD, poolRoleId: "role_pink_beta_platform" };
const IDLE_JOB = { state: "IDLE", activeJobId: null, resultAnalysisId: null, canonicalAnalysis: null, currentOperation: null, attemptCount: null, errorCode: null, errorSummary: null, httpStatus: null };
const bodyFor = (id: string) => resultBody({ analysisId: id, metadata: { analysis_id: id } });
const available = (id: string) => { const decoded = decodeAnalysisResult(bodyFor(id), id); if (!decoded.ok) throw new Error(decoded.code); return { state: "AVAILABLE", result: decoded.result }; };

let url = "";
function mount(query: string) {
  runtime.slots = []; runtime.effects = []; runtime.pending = [];
  url = `http://127.0.0.1/career/demo?${query}`;
  vi.stubGlobal("window", { location: { get href() { return url; } }, history: { state: null, replaceState: (_state: unknown, _title: string, next: string) => { url = next; } } });
  vi.stubGlobal("localStorage", { getItem: () => "1", setItem: () => undefined });
  const params = new URL(url).searchParams;
  const props = { data: EMPTY_CAREER_INTELLIGENCE_DATA, analysisId: params.get("analysisId") ?? undefined, fieldFocus: (params.get("focus") ?? undefined) as "CAPABILITY" | "FIELD" | undefined, jobScopePoolUploadId: params.get("jobScopePoolUploadId") ?? undefined, jobScopeRoleId: params.get("jobScopeRoleId") ?? undefined, investigationMode: params.get("investigationMode") ?? undefined };
  return () => render(props);
}
function render(props: Record<string, unknown>) {
  runtime.cursor = 0; runtime.effectCursor = 0;
  const tree = (SemanticCareerIntelligenceField as (p: unknown) => ReactElement)(props);
  for (const effect of runtime.pending.splice(0)) effect();
  return tree;
}
/** Settles: renders until no effect is pending and the tree is stable (effects may set state). */
function settle(renderOnce: () => ReactElement) { let tree = renderOnce(); for (let i = 0; i < 6; i += 1) tree = renderOnce(); return tree; }
function find(node: unknown, type: unknown): ReactElement<Record<string, unknown>> | null {
  if (!node || typeof node !== "object") return null;
  if (Array.isArray(node)) { for (const child of node) { const hit = find(child, type); if (hit) return hit; } return null; }
  const element = node as ReactElement<Record<string, unknown>>;
  if (element.type === type) return element;
  return find((element.props as { children?: unknown } | undefined)?.children, type);
}
const screenOf = (tree: ReactElement) => (find(tree, PxjFirstScreen)?.props.screen ?? find(tree, PxjAnalysisJobOffer)?.props.screen) as { state: string; analysisId?: string; selection?: unknown } | undefined;
const param = (name: string) => new URL(url).searchParams.get(name);

beforeEach(() => {
  control.job = { ...IDLE_JOB }; control.submitted = []; control.resultReads = [];
  control.validation = (scope) => scope === null ? { state: "NONE" } : { state: "VALID", scope, roleTitle: "Distributed Systems Architect", organizationId: "org_pink_alpha", organizationName: "Alpha Industrial Systems", poolName: "PINK pool" };
  control.boundaries = Object.fromEntries([A0, A1, A2].map(id => [id, { state: "RESOLVED", value: boundary({ analysisId: id }) }]));
  control.results = Object.fromEntries([A0, A1, A2].map(id => [id, available(id)]));
});

const pxjQuery = (extra = "") => `focus=CAPABILITY&investigationMode=PERSON_X_JOB&jobScopePoolUploadId=${UPLOAD}&jobScopeRoleId=${ROLE}${extra}`;
const succeed = (id: string) => { control.job = { ...IDLE_JOB, state: "SUCCEEDED", activeJobId: `JOB_${id}`, resultAnalysisId: id, canonicalAnalysis: bodyFor(id) }; };
const analyze = (tree: ReactElement) => (find(tree, SourceDock)!.props.onAnalyze as (docs: unknown[]) => Promise<void>)([{ id: "src_1", type: "text", title: "t", content: "c" }]);

describe("F-RF-1 · a mode change during a running analysis", () => {
  it("REPRODUCE: the URL carries the interface's mode after SUCCEEDED, not the mode the run was declared with; session = reload", async () => {
    const draw = mount(pxjQuery());
    let tree = settle(draw);
    await analyze(tree);
    control.job = { ...IDLE_JOB, state: "RUNNING", activeJobId: "JOB_A1" };
    tree = settle(draw);
    (find(tree, SyntxInvestigationSelector)!.props.onSelect as (mode: string) => void)("PERSON");
    tree = settle(draw);
    expect(param("investigationMode")).toBe("PERSON");
    succeed(A1);
    tree = settle(draw);
    // The interface stays PERSON (nothing switches by itself); the URL says the same; the session shows the mismatch.
    expect(find(tree, SyntxInvestigationSelector)!.props.mode).toBe("PERSON");
    expect(param("analysisId")).toBe(A1);
    expect(param("investigationMode")).toBe("PERSON");
    expect(screenOf(tree)?.state).toBe("MODE_MISMATCH");
    // Reload = a fresh mount with the URL: the same state.
    control.job = { ...IDLE_JOB };
    const reloaded = settle(mount(new URL(url).search.slice(1)));
    expect(screenOf(reloaded)?.state).toBe("MODE_MISMATCH");
  });

  it("inverse: without a mode change the URL names the run's mode and the analysis; the screen is AVAILABLE in the session and after a reload", async () => {
    const draw = mount(pxjQuery());
    let tree = settle(draw);
    await analyze(tree);
    succeed(A1);
    tree = settle(draw);
    expect([param("analysisId"), param("investigationMode")]).toEqual([A1, "PERSON_X_JOB"]);
    expect(screenOf(tree)?.state).toBe("AVAILABLE");
    control.job = { ...IDLE_JOB };
    expect(screenOf(settle(mount(new URL(url).search.slice(1))))?.state).toBe("AVAILABLE");
  });

  it("inverse: a refused submission (no valid job) writes nothing and changes no mode", async () => {
    control.validation = (scope) => scope === null ? { state: "NONE" } : { state: "CHECKING", scope };
    const draw = mount(`focus=CAPABILITY&investigationMode=PERSON_X_JOB&jobScopePoolUploadId=${UPLOAD}&jobScopeRoleId=${ROLE}`);
    const tree = settle(draw);
    await analyze(tree);
    expect(control.submitted).toEqual([]);
    expect(param("analysisId")).toBeNull();
    expect(param("investigationMode")).toBe("PERSON_X_JOB");
  });
});

describe("F-RF-2 · the analysis on view follows the current URL after the mount", () => {
  it("REPRODUCE a: opened without analysisId → A1 SUCCEEDED → A2 running and FAILED: A1 stays on view, as the URL and a reload say", async () => {
    const draw = mount(pxjQuery());
    let tree = settle(draw);
    await analyze(tree);
    succeed(A1);
    tree = settle(draw);
    expect(param("analysisId")).toBe(A1);
    await analyze(tree);
    control.job = { ...IDLE_JOB, state: "RUNNING", activeJobId: "JOB_A2" };
    tree = settle(draw);
    expect(screenOf(tree)?.analysisId).toBe(A1);
    expect(screenOf(tree)?.state).toBe("AVAILABLE");
    control.job = { ...IDLE_JOB, state: "FAILED", activeJobId: "JOB_A2", errorCode: "ERR_X", errorSummary: "x" };
    tree = settle(draw);
    expect(screenOf(tree)?.analysisId).toBe(A1);
    control.job = { ...IDLE_JOB };
    expect(screenOf(settle(mount(new URL(url).search.slice(1))))?.analysisId).toBe(A1);
  });

  it("REPRODUCE b: opened with ?analysisId=A0 → A1 SUCCEEDED → A2 running and FAILED: never A0 again, always A1", async () => {
    const draw = mount(pxjQuery(`&analysisId=${A0}`));
    let tree = settle(draw);
    expect(screenOf(tree)?.analysisId).toBe(A0);
    await analyze(tree);
    succeed(A1);
    tree = settle(draw);
    expect([screenOf(tree)?.analysisId, param("analysisId")]).toEqual([A1, A1]);
    await analyze(tree);
    control.job = { ...IDLE_JOB, state: "RUNNING", activeJobId: "JOB_A2" };
    tree = settle(draw);
    expect(screenOf(tree)?.analysisId).toBe(A1);
    control.job = { ...IDLE_JOB, state: "FAILED", activeJobId: "JOB_A2", errorCode: "ERR_X", errorSummary: "x" };
    tree = settle(draw);
    expect(screenOf(tree)?.analysisId).toBe(A1);
    expect(control.resultReads.filter(read => read === A0).length).toBeGreaterThan(0);
  });

  it("inverse: a SUCCEEDED job's own result has precedence; A2 SUCCEEDED replaces A1 everywhere", async () => {
    const draw = mount(pxjQuery(`&analysisId=${A0}`));
    let tree = settle(draw);
    await analyze(tree);
    succeed(A1);
    tree = settle(draw);
    await analyze(tree);
    succeed(A2);
    tree = settle(draw);
    expect([screenOf(tree)?.analysisId, param("analysisId")]).toEqual([A2, A2]);
    control.job = { ...IDLE_JOB };
    expect(screenOf(settle(mount(new URL(url).search.slice(1))))?.analysisId).toBe(A2);
  });
});

describe("F-RF-3 · a selected job that is still checked or invalid", () => {
  const offerOf = (tree: ReactElement) => find(tree, PxjAnalysisJobOffer)?.props.screen as { state: string; selection?: unknown; reason?: string } | undefined;

  it("REPRODUCE CHECKING: while the selected job is checked there is no mismatch and no 'no job selected' offer", () => {
    control.validation = (scope) => scope === null ? { state: "NONE" } : { state: "CHECKING", scope };
    const tree = settle(mount(`focus=FIELD&investigationMode=PERSON_X_JOB&analysisId=${A1}&jobScopePoolUploadId=${UPLOAD}&jobScopeRoleId=${ROLE}`));
    expect(offerOf(tree)?.state).toBe("JOB_CHECKING");
  });

  it("REPRODUCE INVALID: an invalid selected job is named as such with its reason, never as 'no job selected'", () => {
    control.validation = (scope) => scope === null ? { state: "NONE" } : { state: "INVALID", scope, reason: "POOL_NOT_ACTIVE" };
    const tree = settle(mount(`focus=FIELD&investigationMode=PERSON_X_JOB&analysisId=${A1}&jobScopePoolUploadId=${UPLOAD}&jobScopeRoleId=${ROLE}`));
    expect(offerOf(tree)).toMatchObject({ state: "JOB_INVALID", reason: "POOL_NOT_ACTIVE" });
  });

  it("inverse: a real other job is ROLE_MISMATCH with that selection; no job at all is ROLE_MISMATCH without one", () => {
    const other = settle(mount(`focus=FIELD&investigationMode=PERSON_X_JOB&analysisId=${A1}&jobScopePoolUploadId=${OTHER.jobPoolUploadId}&jobScopeRoleId=${OTHER.poolRoleId}`));
    expect(offerOf(other)).toMatchObject({ state: "ROLE_MISMATCH", selection: OTHER });
    const none = settle(mount(`focus=FIELD&investigationMode=PERSON_X_JOB&analysisId=${A1}`));
    expect(offerOf(none)).toMatchObject({ state: "ROLE_MISMATCH", selection: null });
    // The analysis's own valid job: no mismatch and no job state in the Job Field (B2 is read only on the Capability Field), AVAILABLE there.
    expect(offerOf(settle(mount(`focus=FIELD&investigationMode=PERSON_X_JOB&analysisId=${A1}&jobScopePoolUploadId=${UPLOAD}&jobScopeRoleId=${ROLE}`)))?.state).toBe("COVERAGE_LOADING");
    expect(screenOf(settle(mount(pxjQuery(`&analysisId=${A1}`))))?.state).toBe("AVAILABLE");
  });
});

describe("F-RF-3 · what the Job Field says (server-rendered offer)", () => {
  it("JOB_INVALID names the invalid job and its reason, never 'no job selected'; JOB_CHECKING offers nothing", async () => {
    const { renderToString } = await vi.importActual<typeof import("react-dom/server")>("react-dom/server");
    const { createElement } = await vi.importActual<typeof import("react")>("react");
    const { SIL_COPY } = await import("../../../lib/career/view-model/sil-language");
    for (const locale of ["en", "de"] as const) {
      const c = SIL_COPY[locale].pxjFirst;
      const invalid = renderToString(createElement(PxjAnalysisJobOffer, { locale, onSelectRole: () => undefined, screen: { state: "JOB_INVALID", analysisId: A1, analysisSelection: SCOPE, selection: OTHER, reason: "POOL_NOT_ACTIVE" } }));
      expect(invalid).toContain(c.states.JOB_INVALID);
      expect(invalid).toContain('data-reason="POOL_NOT_ACTIVE"');
      expect(invalid).not.toContain(c.states.ROLE_NONE);
      expect(invalid).toContain('data-testid="pxj-analysis-job-select"');
      // The invalid job is the analysis's own: nothing to offer instead.
      expect(renderToString(createElement(PxjAnalysisJobOffer, { locale, onSelectRole: () => undefined, screen: { state: "JOB_INVALID", analysisId: A1, analysisSelection: SCOPE, selection: SCOPE, reason: "UPLOAD_NOT_FOUND" } }))).not.toContain('data-testid="pxj-analysis-job-select"');
      expect(renderToString(createElement(PxjAnalysisJobOffer, { locale, onSelectRole: () => undefined, screen: { state: "JOB_CHECKING", analysisId: A1, analysisSelection: SCOPE, selection: SCOPE } }))).toBe("");
    }
  });
});
