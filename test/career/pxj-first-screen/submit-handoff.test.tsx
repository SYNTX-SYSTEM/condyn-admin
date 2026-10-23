import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import { ROLE, UPLOAD } from "./fixtures";
import { browser, find, instance } from "./harness";

/**
 * O-NAV-SUBMIT (owner "RECURSIVE UX/UI & SYSTEM CLOSURE", GELB §4; PINK I24 on 421e382): Back ≈0.3 s after ANALYZE remounts the
 * field while the POST is on its way; the 202 reached the released controller and was dropped — the job ran, no entry named it.
 * Now the job id is handed over to the field mounted then, replaced into the entry on view (analysisJobId) and followed by GET only:
 * one POST, one job. The chain runs as the page builds it (page → CareerDemoHistory → dashboard → field) with the real job hook;
 * the fetch is scripted and holds the POST until the test answers it. Harness: ./harness.ts.
 */
vi.mock("react", async (importOriginal) => (await import("./harness")).mockReact(await importOriginal<object>()));
vi.mock("../../../lib/career/ui/useJobScope", () => ({ useJobScopeValidation: (scope: { jobPoolUploadId: string; poolRoleId: string } | null) => scope === null ? { state: "NONE" } : { state: "VALID", scope, roleTitle: "Distributed Systems Architect", organizationId: "org_pink_alpha", organizationName: "Alpha Industrial Systems", poolName: "PINK pool" } }));
vi.mock("../../../lib/career/ui/useJobPool", async (importOriginal) => ({ ...(await importOriginal<typeof import("../../../lib/career/ui/useJobPool")>()), useJobPoolWorkflow: () => ({ pools: { state: "IDLE" }, upload: { state: "IDLE" }, selectedJobPoolUploadId: null, view: { state: "IDLE" }, matches: { state: "IDLE" }, submitUpload: async () => undefined, select: () => undefined, reloadPools: async () => undefined, reloadMatches: async () => undefined }) }));

import CareerIntelligenceDemoPage from "../../../app/career/demo/page";
import { CareerIntelligenceDashboard } from "../../../app/components/career/demo/CareerIntelligenceDashboard";
import { SemanticCareerIntelligenceField } from "../../../app/components/career/demo/SemanticCareerIntelligenceField";
import { SourceDock } from "../../../app/components/career/demo/SourceDock";
import { CareerJobController } from "../../../lib/career/ui/career-job-controller";

const JOB = "JOB_1792000000024_24";
const BASE = "http://127.0.0.1/career/demo";
const START = `${BASE}?focus=CAPABILITY&investigationMode=PERSON_X_JOB&jobScopePoolUploadId=${UPLOAD}&jobScopeRoleId=${ROLE}`;
/** The entry ANALYZE is pressed on: one decision after START (an observation the user took). */
const ON_VIEW = `${START}&jobOrganizationId=org_pink_alpha`;
const flush = async () => { for (let i = 0; i < 20; i += 1) await Promise.resolve(); };
const DOCS = [{ id: "src_1", type: "text", title: "t", content: "c" }];

/** The network: the POST waits for `answer`; the job reads answer RUNNING; every other read 404. */
function network() {
  const requests: string[] = [];
  let answer: (response: { status: number; json(): Promise<unknown> }) => void = () => undefined;
  const fetcher = vi.fn((input: string, init?: { method?: string }) => {
    requests.push(`${init?.method ?? "GET"} ${input}`);
    if (init?.method === "POST") return new Promise(resolve => { answer = resolve; });
    if (input.startsWith("/api/career/jobs/")) return Promise.resolve({ status: 200, ok: true, json: async () => ({ status: "RUNNING", currentOperation: "DISCOVERY", attemptCount: 1 }) });
    return Promise.resolve({ status: 404, ok: false, json: async () => ({ success: false, issues: [{ code: "ERR_NOT_FOUND" }] }) });
  });
  return { requests, fetcher, answer: (status: number, body: unknown) => answer({ status, json: async () => body }) };
}

/** The page's chain for the entry on view: the dashboard the history renders and the field that dashboard renders. */
function mount(historyTree: ReactElement<Record<string, unknown>>) {
  const dashboard = instance<Record<string, unknown>>(historyTree.type);
  const field = instance<Record<string, unknown>>(SemanticCareerIntelligenceField);
  const draw = () => field.settle(find(dashboard.settle(historyTree.props), SemanticCareerIntelligenceField)!.props);
  return { draw, unmount: () => { field.unmount(); dashboard.unmount(); } };
}

let tab: ReturnType<typeof browser>;
let net: ReturnType<typeof network>;
async function openPage() {
  tab = browser(START);
  tab.window.history.pushState(null, "", ON_VIEW);
  net = network();
  vi.stubGlobal("window", { ...tab.window, fetch: net.fetcher });
  vi.stubGlobal("fetch", net.fetcher);
  vi.stubGlobal("localStorage", { getItem: () => "1", setItem: () => undefined });
  vi.stubGlobal("crypto", { randomUUID: () => "00000000-0000-4000-8000-000000000024" });
  const page = await CareerIntelligenceDemoPage({ searchParams: Promise.resolve(Object.fromEntries(new URL(tab.url).searchParams)) }) as ReactElement<Record<string, unknown>>;
  const history = instance<Record<string, unknown>>(page.type);
  return { settle: () => history.settle(page.props) as ReactElement<Record<string, unknown>> };
}
const analyze = (tree: ReactElement) => (find(tree, SourceDock)!.props.onAnalyze as (docs: unknown[]) => Promise<void>)(DOCS);
const param = (url: string, name: string) => new URL(url).searchParams.get(name);
const posts = () => net.requests.filter(request => request.startsWith("POST ")).length;

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe("O-NAV-SUBMIT · a run submitted before Back keeps its name", () => {
  it("REPRODUCE: Back while the POST is on its way — the 202's job id lands in the entry on view (replace) and is followed by GET only", async () => {
    const history = await openPage();
    const before = mount(history.settle());
    void analyze(before.draw());
    expect(posts()).toBe(1);
    tab.back(); // the remount: the old field's controller is released, the POST still on its way
    const after = mount(history.settle());
    before.unmount();
    after.draw();
    const writes = tab.writes.length;
    net.answer(202, { jobId: JOB });
    await flush();
    after.draw();
    await flush();
    after.draw();
    expect(tab.url).toBe(tab.entries[0]);
    expect(param(tab.url, "analysisJobId")).toBe(JOB);
    expect(tab.writes.slice(writes).every(write => write.how === "replace")).toBe(true);
    expect(tab.entries).toHaveLength(2);
    expect(param(tab.entries[1], "analysisJobId")).toBeNull();
    expect(net.requests).toContain(`GET /api/career/jobs/${JOB}`);
    expect(posts()).toBe(1);
    after.unmount();
  });

  it("REPRODUCE: the released controller hands the 202's job over and does not poll it itself", async () => {
    let answer: (value: unknown) => void = () => undefined;
    const fetcher = vi.fn().mockReturnValueOnce(new Promise(resolve => { answer = resolve; }));
    const handed: string[] = [];
    const controller = new (CareerJobController as unknown as new (fetchFn: typeof fetch, options: { onReleasedJob(jobId: string): void }) => CareerJobController)(fetcher as unknown as typeof fetch, { onReleasedJob: jobId => { handed.push(jobId); } });
    void controller.submitAnalysis({ documents: [{ type: "text", content: "c" }], jobScope: { jobPoolUploadId: UPLOAD, poolRoleId: ROLE } });
    controller.cleanup();
    answer({ status: 202, json: async () => ({ jobId: JOB }) });
    await flush();
    await vi.advanceTimersByTimeAsync(10_000);
    expect(handed).toEqual([JOB]);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("inverse: without a remount the 202 stays with its own field — named in its own entry, one POST, nothing handed over", async () => {
    const handed: string[] = [];
    const fetcher = vi.fn().mockResolvedValueOnce({ status: 202, json: async () => ({ jobId: JOB }) }).mockResolvedValue({ status: 200, json: async () => ({ status: "RUNNING", currentOperation: "DISCOVERY", attemptCount: 1 }) });
    const controller = new (CareerJobController as unknown as new (fetchFn: typeof fetch, options: { onReleasedJob(jobId: string): void }) => CareerJobController)(fetcher as unknown as typeof fetch, { onReleasedJob: jobId => { handed.push(jobId); } });
    await controller.submitAnalysis({ documents: [{ type: "text", content: "c" }], jobScope: { jobPoolUploadId: UPLOAD, poolRoleId: ROLE } });
    await flush();
    expect(controller.getState()).toMatchObject({ activeJobId: JOB });
    expect(handed).toEqual([]);
    controller.cleanup();

    const history = await openPage();
    const view = mount(history.settle());
    void analyze(view.draw());
    net.answer(202, { jobId: JOB });
    await flush();
    view.draw();
    expect(param(tab.url, "analysisJobId")).toBe(JOB);
    expect(tab.url).toBe(tab.entries[1]);
    expect(posts()).toBe(1);
    view.unmount();
  });

  it("inverse: a submission refused after the remount (422) names nothing and reads no job; still one POST", async () => {
    const history = await openPage();
    const before = mount(history.settle());
    void analyze(before.draw());
    tab.back();
    const after = mount(history.settle());
    before.unmount();
    after.draw();
    net.answer(422, { success: false, issues: [{ code: "ERR_JOB_SCOPE_REQUIRED", message: "refused" }] });
    await flush();
    after.draw();
    expect(tab.entries.every(entry => param(entry, "analysisJobId") === null)).toBe(true);
    expect(net.requests.some(request => request.startsWith("GET /api/career/jobs/"))).toBe(false);
    expect(posts()).toBe(1);
    after.unmount();
  });
});
