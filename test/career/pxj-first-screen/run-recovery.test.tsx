import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import { ANALYSIS, ROLE, UPLOAD, boundary, coverage, resultBody } from "./fixtures";
import { browser, find, instance, urlProps } from "./harness";

/**
 * Owner "OWNER_GO_FULL_PXJ_CLOSURE" §05, N-2 B-RUN (GELB): a running analysis survives a reload. On the 202 the job id is replaced
 * into the URL (analysisJobId); a mount with it and no job in memory follows the job by GET only (CareerJobController.resumeJob);
 * SUCCEEDED writes analysisId and removes analysisJobId in one replace; FAILED and 404 are shown with the job id and keep the
 * parameter; nothing restarts, nothing retries by POST; a value in another format is removed. On 88539d3 the job id never reached
 * the URL and a reload lost the run. Harness: ./harness.ts; for the field the job hook is steered, for the controller the fetch.
 */
vi.mock("react", async (importOriginal) => (await import("./harness")).mockReact(await importOriginal<object>()));

const IDLE_JOB = { state: "IDLE", activeJobId: null, resultAnalysisId: null, canonicalAnalysis: null, currentOperation: null, attemptCount: null, errorCode: null, errorSummary: null, httpStatus: null };
const control = vi.hoisted(() => ({
  job: {} as Record<string, unknown>,
  resumed: [] as string[],
  submitted: [] as unknown[],
  boundaries: {} as Record<string, unknown>,
  results: {} as Record<string, unknown>
}));
vi.mock("../../../lib/career/ui/useCareerAnalysisJob", () => ({ useCareerAnalysisJob: () => ({ state: control.job, submitAnalysis: async (payload: unknown) => { control.submitted.push(payload); }, resumeJob: (jobId: string) => { control.resumed.push(jobId); } }) }));
vi.mock("../../../lib/career/ui/useJobScope", () => ({ useJobScopeValidation: (scope: { jobPoolUploadId: string; poolRoleId: string } | null) => scope === null ? { state: "NONE" } : { state: "VALID", scope, roleTitle: "Distributed Systems Architect", organizationId: "org_pink_alpha", organizationName: "Alpha Industrial Systems", poolName: "PINK pool" } }));
vi.mock("../../../lib/career/ui/useJobPool", async (importOriginal) => ({ ...(await importOriginal<typeof import("../../../lib/career/ui/useJobPool")>()), useJobPoolWorkflow: () => ({ pools: { state: "IDLE" }, upload: { state: "IDLE" }, selectedJobPoolUploadId: null, view: { state: "IDLE" }, matches: { state: "IDLE" }, submitUpload: async () => undefined, select: () => undefined, reloadPools: async () => undefined, reloadMatches: async () => undefined }) }));
vi.mock("../../../lib/career/ui/useRoleInvestigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../lib/career/ui/useRoleInvestigation")>()),
  useAnalysisBoundary: (analysisId: string | null) => analysisId === null ? { state: "IDLE" } : control.boundaries[analysisId] ?? { state: "RESOLVING" },
  useSelectedRoleCoverage: (analysisId: string | null) => analysisId === null ? { state: "IDLE" } : { state: "AVAILABLE", coverage: coverage() }
}));
vi.mock("../../../lib/career/ui/useAnalysisResult", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../lib/career/ui/useAnalysisResult")>()),
  useAnalysisResult: (analysisId: string | null) => analysisId === null ? { state: "IDLE" } : control.results[analysisId] ?? { state: "LOADING" }
}));

import { SemanticCareerIntelligenceField } from "../../../app/components/career/demo/SemanticCareerIntelligenceField";
import { PxjFirstScreen } from "../../../app/components/career/demo/PxjFirstScreen";
import { EMPTY_CAREER_INTELLIGENCE_DATA } from "../../../app/career/demo/demo-data";
import { CareerJobController } from "../../../lib/career/ui/career-job-controller";
import { decodeAnalysisResult } from "../../../lib/career/view-model/pxj-first-screen";

const A1 = ANALYSIS, A2 = "ANL_1792000000002_2";
const JOB = "JOB_1792000000009_9";
const BASE = "http://127.0.0.1/career/demo";
const bodyFor = (id: string) => resultBody({ analysisId: id, metadata: { analysis_id: id } });
const available = (id: string) => { const decoded = decodeAnalysisResult(bodyFor(id), id); if (!decoded.ok) throw new Error(decoded.code); return { state: "AVAILABLE", result: decoded.result }; };
const pxj = (extra = "") => `focus=CAPABILITY&investigationMode=PERSON_X_JOB&jobScopePoolUploadId=${UPLOAD}&jobScopeRoleId=${ROLE}${extra}`;

let tab: ReturnType<typeof browser>;
/** A reload of this URL: its parameters, then a fresh field. */
function reload(query: string) {
  tab = browser(`${BASE}?${query}`);
  vi.stubGlobal("window", tab.window);
  vi.stubGlobal("localStorage", { getItem: () => "1", setItem: () => undefined });
  const props = { data: EMPTY_CAREER_INTELLIGENCE_DATA, ...urlProps(tab.url) };
  const view = instance<typeof props>(SemanticCareerIntelligenceField);
  return () => view.settle(props);
}
function findBy(node: unknown, test: (props: Record<string, unknown>) => boolean): ReactElement<Record<string, unknown>> | null {
  if (!node || typeof node !== "object") return null;
  if (Array.isArray(node)) { for (const child of node) { const hit = findBy(child, test); if (hit) return hit; } return null; }
  const element = node as ReactElement<Record<string, unknown>>;
  if (element.props && test(element.props)) return element;
  return findBy(element.props?.children, test);
}
const text = (node: unknown): string => node === null || node === undefined || typeof node === "boolean" ? "" : typeof node === "string" || typeof node === "number" ? String(node) : Array.isArray(node) ? node.map(text).join("") : text((node as ReactElement<{ children?: unknown }>).props?.children);
const banner = (tree: ReactElement) => findBy(tree, props => props["data-testid"] === "intake-error-banner");
const retry = (tree: ReactElement) => findBy(tree, props => props["data-testid"] === "retry-intake-btn");

beforeEach(() => {
  control.job = { ...IDLE_JOB }; control.resumed = []; control.submitted = [];
  control.boundaries = Object.fromEntries([A1, A2].map(id => [id, { state: "RESOLVED", value: boundary({ analysisId: id }) }]));
  control.results = Object.fromEntries([A1, A2].map(id => [id, available(id)]));
});
afterEach(() => { vi.useRealTimers(); });

describe("N-2 · the field: the running job stands in the URL and is followed after a reload", () => {
  it("REPRODUCE: on the 202 the job id is replaced into the URL (no new history entry)", () => {
    const draw = reload(pxj());
    draw();
    control.job = { ...IDLE_JOB, state: "SUBMITTING" };
    draw();
    control.job = { ...IDLE_JOB, state: "PENDING", activeJobId: JOB };
    draw();
    expect(tab.param("analysisJobId")).toBe(JOB);
    expect(tab.entries.length).toBe(1);
    expect(tab.writes.every(write => write.how === "replace")).toBe(true);
  });

  it("REPRODUCE: a reload with analysisJobId and no job in memory follows that job (resume, no submission)", () => {
    const draw = reload(pxj(`&analysisJobId=${JOB}`));
    draw();
    expect(control.resumed).toEqual([JOB]);
    expect(control.submitted).toEqual([]);
    expect(tab.param("analysisJobId")).toBe(JOB);
  });

  it("REPRODUCE: SUCCEEDED writes analysisId and removes analysisJobId in one replace", () => {
    const draw = reload(pxj(`&analysisJobId=${JOB}`));
    draw();
    control.job = { ...IDLE_JOB, state: "RUNNING", activeJobId: JOB };
    draw();
    const before = tab.writes.length;
    control.job = { ...IDLE_JOB, state: "SUCCEEDED", activeJobId: JOB, resultAnalysisId: A1, canonicalAnalysis: bodyFor(A1) };
    draw();
    expect(tab.writes.slice(before)).toHaveLength(1);
    expect(tab.writes.at(-1)?.how).toBe("replace");
    expect(tab.param("analysisId")).toBe(A1);
    expect(tab.param("analysisJobId")).toBeNull();
  });

  it("REPRODUCE: a FAILED job from the URL is shown with its id, the parameter stays, no retry (no POST)", () => {
    const draw = reload(pxj(`&analysisJobId=${JOB}`));
    control.job = { ...IDLE_JOB, state: "FAILED", activeJobId: JOB, errorCode: "ERR_WORKER_FAILED", errorSummary: "worker failed", httpStatus: null };
    const tree = draw();
    expect(banner(tree)?.props["data-job-resume"]).toBe("FAILED");
    expect(text(findBy(tree, props => props["data-testid"] === "intake-error-job-id"))).toContain(JOB);
    expect(retry(tree)).toBeNull();
    expect(tab.param("analysisJobId")).toBe(JOB);
    expect(control.submitted).toEqual([]);
  });

  it("REPRODUCE: a job the server does not know (404) is its own state, named, nothing guessed; EN and DE", () => {
    const draw = reload(pxj(`&analysisJobId=${JOB}`));
    control.job = { ...IDLE_JOB, state: "FAILED", activeJobId: JOB, errorCode: "NOT_FOUND", errorSummary: "Job not found", httpStatus: 404 };
    const tree = draw();
    expect(banner(tree)?.props["data-job-resume"]).toBe("NOT_FOUND");
    expect(text(banner(tree))).toContain("ANALYSIS JOB NOT FOUND");
    expect(tab.param("analysisJobId")).toBe(JOB);
    tab = browser(`${BASE}?${pxj(`&analysisJobId=${JOB}`)}`);
    vi.stubGlobal("window", tab.window);
    const props = { data: EMPTY_CAREER_INTELLIGENCE_DATA, initialLocale: "de" as const, ...urlProps(tab.url) };
    expect(text(banner(instance<typeof props>(SemanticCareerIntelligenceField).settle(props)))).toContain("ANALYSE-JOB NICHT GEFUNDEN");
  });

  it("REPRODUCE: a value in another format (or repeated) is no job id — removed by replace, never read", () => {
    for (const value of ["JOB_1", "job_1792000000009_9", "JOB_1792000000009_9/../x", "1792000000009", "", `${JOB}&analysisJobId=${JOB}`]) {
      control.resumed = [];
      const draw = reload(pxj(`&analysisJobId=${value.includes("&") ? value : encodeURIComponent(value)}`));
      draw();
      expect(control.resumed, value).toEqual([]);
      expect(tab.param("analysisJobId"), value).toBeNull();
      expect(tab.entries.length, value).toBe(1);
    }
  });

  it("inverse: during a second run the analysis on view stays the URL's (F-RF-2); without analysisJobId nothing is resumed or written", () => {
    const draw = reload(pxj(`&analysisId=${A1}&analysisJobId=${JOB}`));
    control.job = { ...IDLE_JOB, state: "RUNNING", activeJobId: JOB };
    const tree = draw();
    expect((find(tree, PxjFirstScreen)?.props.screen as { state: string; analysisId?: string }).analysisId).toBe(A1);
    const plain = reload(pxj(`&analysisId=${A1}`));
    control.job = { ...IDLE_JOB };
    control.resumed = [];
    plain();
    expect(control.resumed).toEqual([]);
    expect(tab.writes).toEqual([]);
  });
});

describe("N-2 · the controller: resumeJob reads, never submits", () => {
  const flush = async () => { for (let i = 0; i < 10; i += 1) await Promise.resolve(); };
  const calls = (fetcher: ReturnType<typeof vi.fn>) => fetcher.mock.calls.map(([url, init]) => `${(init as { method?: string } | undefined)?.method ?? "GET"} ${url}`);
  beforeEach(() => { vi.useFakeTimers(); });

  it("REPRODUCE: GET /api/career/jobs/{id} until SUCCEEDED, then the result; no POST", async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce({ status: 200, json: async () => ({ status: "RUNNING", currentOperation: "DISCOVERY", attemptCount: 1 }) })
      .mockResolvedValueOnce({ status: 200, json: async () => ({ status: "SUCCEEDED", resultAnalysisId: A1 }) })
      .mockResolvedValueOnce({ status: 200, json: async () => bodyFor(A1) });
    const controller = new CareerJobController(fetcher as unknown as typeof fetch);
    controller.resumeJob(JOB);
    expect(controller.getState()).toMatchObject({ state: "PENDING", activeJobId: JOB });
    await flush();
    expect(controller.getState().state).toBe("RUNNING");
    await vi.advanceTimersByTimeAsync(2_000);
    await flush();
    expect(controller.getState()).toMatchObject({ state: "SUCCEEDED", activeJobId: JOB, resultAnalysisId: A1 });
    expect(controller.getState().canonicalAnalysis).not.toBeNull();
    expect(calls(fetcher)).toEqual([`GET /api/career/jobs/${JOB}`, `GET /api/career/jobs/${JOB}`, `GET /api/career/analyses/${A1}`]);
    controller.cleanup();
  });

  it("REPRODUCE: 404 is FAILED NOT_FOUND with HTTP 404, polling stops, no POST", async () => {
    const fetcher = vi.fn().mockResolvedValue({ status: 404, json: async () => ({ error: "Not Found" }) });
    const controller = new CareerJobController(fetcher as unknown as typeof fetch);
    controller.resumeJob(JOB);
    await flush();
    await vi.advanceTimersByTimeAsync(10_000);
    expect(controller.getState()).toMatchObject({ state: "FAILED", activeJobId: JOB, errorCode: "NOT_FOUND", httpStatus: 404 });
    expect(calls(fetcher)).toEqual([`GET /api/career/jobs/${JOB}`]);
  });

  it("GELB (1): the remount — the old controller released, the new one follows by analysisJobId: one GET poll, one POST in all, one job", async () => {
    const fetcher = vi.fn(async (url: string, init?: { method?: string }) => init?.method === "POST"
      ? { status: 202, json: async () => ({ jobId: JOB }) }
      : { status: 200, json: async () => ({ status: "RUNNING", currentOperation: "DISCOVERY", attemptCount: 1 }) });
    const before = new CareerJobController(fetcher as unknown as typeof fetch);
    await before.submitAnalysis({ documents: [{ type: "text", content: "c" }], jobScope: { jobPoolUploadId: UPLOAD, poolRoleId: ROLE } });
    await flush();
    before.cleanup();
    const after = new CareerJobController(fetcher as unknown as typeof fetch);
    after.resumeJob(JOB);
    await flush();
    const polled = () => calls(fetcher).filter(call => call === `GET /api/career/jobs/${JOB}`).length;
    const start = polled();
    await vi.advanceTimersByTimeAsync(6_000);
    expect(polled() - start).toBe(3);
    expect(calls(fetcher).filter(call => call.startsWith("POST ")).length).toBe(1);
    expect(new Set(calls(fetcher).filter(call => call.includes("/api/career/jobs/")))).toEqual(new Set([`GET /api/career/jobs/${JOB}`]));
    after.cleanup();
  });

  it("inverse: no resume while another run is in progress; the same job twice (development double mount) polls once", async () => {
    const fetcher = vi.fn().mockResolvedValue({ status: 200, json: async () => ({ status: "RUNNING", currentOperation: "DISCOVERY", attemptCount: 1 }) });
    const controller = new CareerJobController(fetcher as unknown as typeof fetch);
    controller.resumeJob(JOB);
    controller.resumeJob("JOB_1792000000010_10");
    expect(controller.getState().activeJobId).toBe(JOB);
    controller.cleanup(); controller.activate(); controller.resumeJob(JOB);
    await flush();
    const start = fetcher.mock.calls.length;
    await vi.advanceTimersByTimeAsync(4_000);
    expect(fetcher.mock.calls.length - start).toBe(2);
    expect(calls(fetcher).every(call => call === `GET /api/career/jobs/${JOB}`)).toBe(true);
    controller.cleanup();
  });
});
