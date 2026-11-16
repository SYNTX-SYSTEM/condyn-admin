import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { browser, find, instance } from "../pxj-first-screen/harness";
import { ANALYSIS, boundary, resultBody } from "../pxj-first-screen/fixtures";
import { autoMatchBody, rankingBody } from "../auto-capability/fixtures";

/**
 * MAP-D-WIRING · the MAPPING field in the host (same mocks as auto-capability/auto-match-wiring.test.tsx). For the PERSON result on
 * view, focus=MAPPING mounts the field on its own stage, fed with exactly the automatic path's run and ranking and the result's own
 * projection — no second read, no other route, nothing written to the address. The ranking panel keeps its list and no longer carries
 * a field (D-Q4). Under PERSON × JOB and JOB the MAPPING option is gated NOT_PERSON (C-10); a requested MAPPING then shows the Job Field.
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
import { PersonJobMappingField } from "../../../app/components/career/demo/PersonJobMappingField";
import { SyntxFieldSelector } from "../../../app/components/career/demo/SyntxFieldSelector";
import { EMPTY_CAREER_INTELLIGENCE_DATA } from "../../../app/career/demo/demo-data";
import { careerDemoPropsFromSearchParams, careerDemoSearchParamsFromSearch } from "../../../lib/career/ui/career-demo-url";
import { decodeAnalysisResult } from "../../../lib/career/view-model/pxj-first-screen";

const BASE = "http://127.0.0.1/career/demo";
const IDLE_JOB = { state: "IDLE", activeJobId: null, resultAnalysisId: null, canonicalAnalysis: null, currentOperation: null, attemptCount: null, errorCode: null, errorSummary: null, httpStatus: null };
const flush = async () => { for (let i = 0; i < 10; i += 1) await Promise.resolve(); };
const AUTO = `/api/career/analyses/${ANALYSIS}/auto-match`, RANKING = `/api/career/analyses/${ANALYSIS}/job-ranking`;

let calls: Array<{ method: string; url: string }> = [];
let decodedProjection: unknown = null;
beforeEach(() => {
  const decoded = decodeAnalysisResult(resultBody(), ANALYSIS);
  if (!decoded.ok) throw new Error(decoded.code);
  decodedProjection = decoded.result.projection;
  control.job = IDLE_JOB;
  control.boundary = { state: "RESOLVED", value: boundary({ mode: "PERSON", jobScopeSelection: null, investigationScopeHash: null }) };
  control.result = { state: "AVAILABLE", result: decoded.result };
  calls = [];
  vi.stubGlobal("fetch", async (url: string, init: Record<string, unknown>) => {
    calls.push({ method: String(init.method), url });
    if (url === AUTO) return { status: 200, json: async () => autoMatchBody("COMPLETED") };
    if (url === RANKING) return { status: 200, json: async () => rankingBody({ analysisId: ANALYSIS }) };
    return { status: 404, json: async () => ({ issues: [{ code: "ERR_UNEXPECTED_ROUTE" }] }) };
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

const settled = async (search: string) => {
  const started = start(search);
  started.view.settle(started.props);
  await flush(); started.view.settle(started.props);
  await flush();
  return { ...started, tree: started.view.settle(started.props) };
};
const selectorOf = (tree: unknown) => find(tree, SyntxFieldSelector)!;

describe("MAP-D-WIRING · the MAPPING stage rides on the automatic path's reads", () => {
  it("REPRODUCE: focus=MAPPING with the PERSON result on view → the stage carries the field with the run, the ranking and the result's projection; GET only, no URL write", async () => {
    const { tab, view, tree } = await settled(`focus=MAPPING&investigationMode=PERSON&analysisId=${ANALYSIS}`);
    const field = find(tree, PersonJobMappingField)!;
    expect(field).not.toBeNull();
    expect(field.props.ranking).toMatchObject({ state: "AVAILABLE", ranking: { analysisId: ANALYSIS } });
    expect(field.props.watch).toMatchObject({ read: { state: "AVAILABLE" } });
    expect(field.props.projection).toEqual(decodedProjection);
    expect(Object.keys(field.props).sort(), "no job-scope callback, no URL writer").toEqual(["locale", "projection", "ranking", "watch"]);
    expect(find(tree, AutoJobRankingPanel), "the Capability Field's panel is not on the MAPPING stage").toBeNull();
    expect(selectorOf(tree).props).toMatchObject({ focus: "MAPPING", mappingGate: null });
    expect(calls.map(call => `${call.method} ${call.url}`)).toEqual([`GET ${AUTO}`, `GET ${RANKING}`]);
    expect(tab.writes).toEqual([]);
    view.unmount();
  });

  it("D-Q4: on the Capability Field the ranking panel keeps its list and carries no field; there is one mapping field, the stage", async () => {
    const { view, tree } = await settled(`focus=CAPABILITY&investigationMode=PERSON&analysisId=${ANALYSIS}`);
    const panel = find(tree, AutoJobRankingPanel)!;
    expect(panel).not.toBeNull();
    expect(panel.props.field).toBeUndefined();
    expect(find(tree, PersonJobMappingField)).toBeNull();
    expect(selectorOf(tree).props).toMatchObject({ focus: "CAPABILITY", mappingGate: null });
    view.unmount();
  });

  it("C-10: under PERSON × JOB and JOB the MAPPING option is gated NOT_PERSON; a requested MAPPING shows the Job Field; nothing of the ranking is read", async () => {
    for (const mode of ["PERSON_X_JOB", "JOB"]) {
      calls = [];
      const { tab, view, tree } = await settled(`focus=MAPPING&investigationMode=${mode}&analysisId=${ANALYSIS}`);
      expect(selectorOf(tree).props.mappingGate, mode).toMatchObject({ state: "NOT_PERSON" });
      expect(selectorOf(tree).props.focus, mode).toBe("FIELD");
      expect(find(tree, PersonJobMappingField), mode).toBeNull();
      expect(calls.filter(c => c.url === AUTO || c.url === RANKING), mode).toEqual([]);
      expect(tab.writes.filter(w => /jobScope/.test(w.url)), mode).toEqual([]);
      view.unmount();
    }
  });

  it("C-10 precedence, first match wins: NO_ANALYSIS without an analysis, NO_RANKING while the ranking is not available, NO_POOL for a ranking without pools", async () => {
    let started = await settled("focus=MAPPING&investigationMode=PERSON");
    expect(selectorOf(started.tree).props.mappingGate).toMatchObject({ state: "NO_ANALYSIS" });
    started.view.unmount();
    vi.stubGlobal("fetch", async (url: string, init: Record<string, unknown>) => {
      calls.push({ method: String(init.method), url });
      if (url === AUTO) return { status: 200, json: async () => autoMatchBody("COMPLETED") };
      return { status: 500, json: async () => ({ issues: [{ code: "ERR_UNAVAILABLE" }] }) };
    });
    started = await settled(`focus=MAPPING&investigationMode=PERSON&analysisId=${ANALYSIS}`);
    expect(selectorOf(started.tree).props.mappingGate).toMatchObject({ state: "NO_RANKING" });
    expect(selectorOf(started.tree).props.focus).toBe("FIELD");
    started.view.unmount();
    vi.stubGlobal("fetch", async (url: string, init: Record<string, unknown>) => {
      calls.push({ method: String(init.method), url });
      if (url === AUTO) return { status: 200, json: async () => autoMatchBody("COMPLETED") };
      if (url === RANKING) return { status: 200, json: async () => rankingBody({ analysisId: ANALYSIS, pools: [], ranks: [], counts: { pools: 0, roles: 0, ranked: 0 }, evidenceClass: null }) };
      return { status: 404, json: async () => ({ issues: [{ code: "ERR_UNEXPECTED_ROUTE" }] }) };
    });
    started = await settled(`focus=MAPPING&investigationMode=PERSON&analysisId=${ANALYSIS}`);
    expect(selectorOf(started.tree).props.mappingGate).toMatchObject({ state: "NO_POOL" });
    started.view.unmount();
  });
});
