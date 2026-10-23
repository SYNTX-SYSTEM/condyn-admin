import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import { ANALYSIS, OTHER_ROLE, ROLE, UPLOAD, boundary, coverage, resultBody } from "./fixtures";
import { browser, find, instance, urlProps } from "./harness";

/**
 * D-PICK (UX-05; owner "RECURSIVE UX/UI & SYSTEM CLOSURE" §03 "… sichere UI-Auswahl vorhandener Analysen … Keine automatische
 * Auswahl einer fremden Analyse"; GELB contract §4). On 421e382 a persisted analysis could be reached only by a deep link or a new
 * ANALYZE. Now, in PERSON × JOB with a valid job, the first screen's NO_ANALYSIS and the selected job's role view offer the existing
 * investigations of exactly this job: read on opening (GET only), chosen only by a click — one push of analysisId (from the role
 * view with focus=CAPABILITY), never by itself; after the choice NAV ≡ RELOAD. Harness: ./harness.ts (read hooks steered, the
 * picker's own read runs against a scripted fetch). The picker is found by its props, not by its module (none on 421e382).
 */
vi.mock("react", async (importOriginal) => (await import("./harness")).mockReact(await importOriginal<object>()));

const IDLE_JOB = { state: "IDLE", activeJobId: null, resultAnalysisId: null, canonicalAnalysis: null, currentOperation: null, attemptCount: null, errorCode: null, errorSummary: null, httpStatus: null };
const control = vi.hoisted(() => ({ job: {} as Record<string, unknown>, selectedPool: null as string | null, boundaries: {} as Record<string, unknown>, results: {} as Record<string, unknown> }));
vi.mock("../../../lib/career/ui/useCareerAnalysisJob", () => ({ useCareerAnalysisJob: () => ({ state: control.job, submitAnalysis: async () => undefined, resumeJob: () => undefined }) }));
vi.mock("../../../lib/career/ui/useJobScope", () => ({ useJobScopeValidation: (scope: { jobPoolUploadId: string; poolRoleId: string } | null) => scope === null ? { state: "NONE" } : { state: "VALID", scope, roleTitle: "Distributed Systems Architect", organizationId: "org_pink_alpha", organizationName: "Alpha Industrial Systems", poolName: "PINK pool" } }));
vi.mock("../../../lib/career/ui/useJobPool", async (importOriginal) => ({ ...(await importOriginal<typeof import("../../../lib/career/ui/useJobPool")>()), useJobPoolWorkflow: (options: { initialJobPoolUploadId?: string | null }) => ({ pools: { state: "IDLE" }, upload: { state: "IDLE" }, selectedJobPoolUploadId: control.selectedPool ?? options.initialJobPoolUploadId ?? null, view: { state: "IDLE" }, matches: { state: "IDLE" }, submitUpload: async () => undefined, select: (id: string) => { control.selectedPool = id; }, reloadPools: async () => undefined, reloadMatches: async () => undefined }) }));
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
import { SyntxField } from "../../../app/components/career/demo/SyntxField";
import { EMPTY_CAREER_INTELLIGENCE_DATA } from "../../../app/career/demo/demo-data";
import { decodeAnalysisResult } from "../../../lib/career/view-model/pxj-first-screen";

const A1 = ANALYSIS;
const FOREIGN = "ANL_1792000000031_31", PERSON_ANALYSIS = "ANL_1792000000032_32";
const BASE = "http://127.0.0.1/career/demo";
const bodyFor = (id: string) => resultBody({ analysisId: id, metadata: { analysis_id: id } });
const available = (id: string) => { const decoded = decodeAnalysisResult(bodyFor(id), id); if (!decoded.ok) throw new Error(decoded.code); return { state: "AVAILABLE", result: decoded.result }; };
const pxjQuery = (extra = "") => `focus=CAPABILITY&investigationMode=PERSON_X_JOB&jobScopePoolUploadId=${UPLOAD}&jobScopeRoleId=${ROLE}${extra}`;
const ROLE_VIEW = `focus=FIELD&investigationMode=PERSON_X_JOB&jobPoolUploadId=${UPLOAD}&jobOrganizationId=org_pink_alpha&jobRoleId=${ROLE}&jobScopePoolUploadId=${UPLOAD}&jobScopeRoleId=${ROLE}`;
const flush = async () => { for (let i = 0; i < 40; i += 1) await new Promise(resolve => setTimeout(resolve, 0)); };

/** The server: three analyses — one of exactly the selected job, one of another role of the pool, one PERSON. */
const SERVER: Record<string, { status: number; body: unknown }> = {
  "/api/career/analyses": { status: 200, body: { success: true, analyses: [
    { analysisId: A1, createdAt: "2026-10-23T09:00:00.000Z", validationState: "VERIFIED", overallConfidence: 0.9 },
    { analysisId: FOREIGN, createdAt: "2026-10-23T10:00:00.000Z", validationState: "VERIFIED" },
    { analysisId: PERSON_ANALYSIS, createdAt: "2026-10-23T11:00:00.000Z", validationState: "VERIFIED" }
  ] } },
  [`/api/career/analyses/${A1}/investigation`]: { status: 200, body: { success: true, investigation: boundary({ analysisId: A1 }) } },
  [`/api/career/analyses/${FOREIGN}/investigation`]: { status: 200, body: { success: true, investigation: boundary({ analysisId: FOREIGN, jobScopeSelection: { jobPoolUploadId: UPLOAD, poolRoleId: OTHER_ROLE } }) } },
  [`/api/career/analyses/${PERSON_ANALYSIS}/investigation`]: { status: 200, body: { success: true, investigation: boundary({ analysisId: PERSON_ANALYSIS, mode: "PERSON", jobScopeSelection: null, investigationScopeHash: null }) } }
};

let tab: ReturnType<typeof browser>;
let requests: string[];
function load(query: string) {
  tab = browser(`${BASE}?${query}`);
  requests = [];
  const fetcher = vi.fn(async (url: string, init?: { method?: string }) => {
    requests.push(`${init?.method ?? "GET"} ${url}`);
    const route = SERVER[url] ?? { status: 404, body: { success: false, issues: [{ code: "ERR_NOT_FOUND" }] } };
    return { status: route.status, ok: route.status === 200, json: async () => route.body };
  });
  vi.stubGlobal("window", { ...tab.window, fetch: fetcher });
  vi.stubGlobal("fetch", fetcher);
  vi.stubGlobal("localStorage", { getItem: () => "1", setItem: () => undefined });
  const props = { data: EMPTY_CAREER_INTELLIGENCE_DATA, ...urlProps(tab.url) };
  const view = instance<typeof props>(SemanticCareerIntelligenceField);
  return () => view.settle(props) as ReactElement<Record<string, unknown>>;
}
type Picker = ReactElement<{ state: { state: string; candidates?: Array<{ analysisId: string; jobScopeSelection: unknown }> }; open: boolean; onToggle(): void; onPick(id: string): void; place: string }>;
const firstScreenPicker = (tree: ReactElement) => (find(tree, PxjFirstScreen)?.props.noAnalysis ?? null) as Picker | null;
const rolePicker = (tree: ReactElement) => (find(tree, SyntxField)?.props.analysisPicker ?? null) as Picker | null;
const screenOf = (tree: ReactElement) => find(tree, PxjFirstScreen)?.props.screen as { state: string; analysisId?: string } | undefined;
const listReads = () => requests.filter(request => request === "GET /api/career/analyses").length;

beforeEach(() => {
  control.job = { ...IDLE_JOB }; control.selectedPool = null;
  control.boundaries = { [A1]: { state: "RESOLVED", value: boundary({ analysisId: A1 }) } };
  control.results = { [A1]: available(A1) };
});
afterEach(() => { vi.unstubAllGlobals(); });

describe("D-PICK · the first screen's NO_ANALYSIS offers the existing investigations of this job", () => {
  it("REPRODUCE: opened by a click, read by GET only, exactly the selected job's analysis offered — and nothing chosen by itself", async () => {
    const draw = load(pxjQuery());
    let tree = draw();
    expect(screenOf(tree)?.state).toBe("NO_ANALYSIS");
    const closed = firstScreenPicker(tree);
    expect(closed?.props.open).toBe(false);
    expect(listReads()).toBe(0);
    closed!.props.onToggle();
    tree = draw(); await flush(); tree = draw();
    const opened = firstScreenPicker(tree)!;
    expect(opened.props.state.state).toBe("AVAILABLE");
    expect(opened.props.state.candidates!.map(candidate => [candidate.analysisId, candidate.jobScopeSelection])).toEqual([[A1, { jobPoolUploadId: UPLOAD, poolRoleId: ROLE }]]);
    expect(requests.every(request => request.startsWith("GET "))).toBe(true);
    // One candidate alone is not chosen: no write, still NO_ANALYSIS.
    expect(tab.writes.filter(write => new URL(write.url).searchParams.has("analysisId"))).toEqual([]);
    expect(screenOf(tree)?.state).toBe("NO_ANALYSIS");
  });

  it("REPRODUCE: the click is one push of analysisId; the screen then runs the B2 checks and equals a fresh load of the URL", async () => {
    const draw = load(pxjQuery());
    let tree = draw();
    expect(firstScreenPicker(tree)?.props.place).toBe("first-screen");
    firstScreenPicker(tree)!.props.onToggle();
    tree = draw(); await flush(); tree = draw();
    const entries = tab.entries.length;
    firstScreenPicker(tree)!.props.onPick(A1);
    await tab.nextTask(); tree = draw();
    expect(tab.entries.length).toBe(entries + 1);
    expect(tab.writes.filter(write => write.how === "push")).toHaveLength(1);
    expect(tab.param("analysisId")).toBe(A1);
    expect(screenOf(tree)?.state).toBe("AVAILABLE");
    const fresh = load(tab.url.replace(`${BASE}?`, ""))();
    expect(screenOf(fresh)).toEqual(screenOf(tree));
  });
});

describe("D-PICK · the selected job's role view in the Job Field", () => {
  it("REPRODUCE: one click — analysisId and focus=CAPABILITY in one entry; Back is the role view without analysisId, as a fresh load", async () => {
    const draw = load(ROLE_VIEW);
    let tree = draw();
    const picker = rolePicker(tree);
    expect(picker?.props.place).toBe("role-view");
    picker!.props.onToggle();
    tree = draw(); await flush(); tree = draw();
    expect(rolePicker(tree)!.props.state.candidates!.map(candidate => candidate.analysisId)).toEqual([A1]);
    const before = tab.url;
    rolePicker(tree)!.props.onPick(A1);
    await tab.nextTask(); tree = draw();
    expect(tab.entries).toHaveLength(2);
    expect([tab.param("analysisId"), tab.param("focus"), tab.param("jobRoleId")]).toEqual([A1, "CAPABILITY", null]);
    expect(screenOf(tree)?.state).toBe("AVAILABLE");
    tab.back();
    expect(tab.url).toBe(before);
    expect(new URL(tab.url).searchParams.get("analysisId")).toBeNull();
    const fresh = load(before.replace(`${BASE}?`, ""))();
    expect(find(fresh, SyntxField)?.props.observation).toMatchObject({ kind: "ROLE", roleId: ROLE });
    expect(rolePicker(fresh)?.props.open).toBe(false);
  });
});

describe("D-PICK · where it is not", () => {
  it("inverse: PERSON and JOB offer no picker and read no analysis list; without a valid job none either", async () => {
    for (const query of [`focus=CAPABILITY&investigationMode=PERSON`, `focus=FIELD&investigationMode=JOB&jobPoolUploadId=${UPLOAD}&jobOrganizationId=org_pink_alpha&jobRoleId=${ROLE}&jobScopePoolUploadId=${UPLOAD}&jobScopeRoleId=${ROLE}`, `focus=FIELD&investigationMode=PERSON_X_JOB`]) {
      const draw = load(query);
      const tree = draw(); await flush(); draw();
      expect(firstScreenPicker(tree) ?? undefined, query).toBeUndefined();
      expect(rolePicker(tree) ?? undefined, query).toBeUndefined();
      expect(listReads(), query).toBe(0);
    }
  });

  it("inverse: an analysis on view — no NO_ANALYSIS, no picker on the first screen; without a click the URL keeps its analysis", async () => {
    const draw = load(pxjQuery(`&analysisId=${A1}`));
    const tree = draw(); await flush(); draw();
    expect(screenOf(tree)?.state).toBe("AVAILABLE");
    expect(firstScreenPicker(tree) ?? undefined).toBeUndefined();
    expect(listReads()).toBe(0);
    expect(tab.writes).toEqual([]);
  });
});
