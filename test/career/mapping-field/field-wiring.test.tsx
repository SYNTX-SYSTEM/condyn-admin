import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { browser, find, instance } from "../pxj-first-screen/harness";
import { ANALYSIS, boundary, resultBody } from "../pxj-first-screen/fixtures";
import { autoMatchBody, rankingBody } from "../auto-capability/fixtures";

/**
 * MAP-C-WIRING · the field in the Capability Field (same mocks as auto-capability/auto-match-wiring.test.tsx): for the PERSON result on
 * view, the automatic panel carries the mapping field, fed with exactly the run and the ranking the panel itself shows and the
 * result's own projection — no second read, no other route, nothing written to the address. Under PERSON × JOB and JOB there is no
 * automatic panel and so no field (B-2: the mapping needs no job scope; a PERSON × JOB analysis has no ranking).
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

describe("MAP-C-WIRING · the field rides on the automatic panel's reads", () => {
  it("REPRODUCE: PERSON result on view → the panel carries the field with the panel's own run and ranking and the result's projection; GET only, the two existing routes, no URL write", async () => {
    const { tab, view, props } = start(`focus=CAPABILITY&investigationMode=PERSON&analysisId=${ANALYSIS}`);
    let tree = view.settle(props);
    await flush(); tree = view.settle(props);
    await flush(); tree = view.settle(props);
    const panel = find(tree, AutoJobRankingPanel)!;
    expect(panel).not.toBeNull();
    const field = panel.props.field as { type: unknown; props: Record<string, unknown> };
    expect(field.type).toBe(PersonJobMappingField);
    expect(field.props.ranking).toBe(panel.props.ranking);
    expect(field.props.watch).toBe(panel.props.watch);
    expect(field.props.projection).toEqual(decodedProjection);
    expect(field.props.ranking).toMatchObject({ state: "AVAILABLE", ranking: { analysisId: ANALYSIS } });
    expect(Object.keys(field.props).sort(), "no job-scope callback, no URL writer").toEqual(["locale", "projection", "ranking", "watch"]);
    expect(calls.map(call => `${call.method} ${call.url}`)).toEqual([`GET ${AUTO}`, `GET ${RANKING}`]);
    expect(tab.writes).toEqual([]);
    view.unmount();
  });

  it("inverse: under PERSON × JOB and JOB there is no automatic panel and so no field; nothing of the mapping is read", async () => {
    for (const mode of ["PERSON_X_JOB", "JOB"]) {
      calls = [];
      const { tab, view, props } = start(`focus=CAPABILITY&investigationMode=${mode}&analysisId=${ANALYSIS}`);
      let tree = view.settle(props);
      await flush(); tree = view.settle(props);
      expect(find(tree, AutoJobRankingPanel), mode).toBeNull();
      expect(find(tree, PersonJobMappingField), mode).toBeNull();
      expect(calls.filter(c => c.url === AUTO || c.url === RANKING), mode).toEqual([]);
      expect(tab.writes.filter(w => /jobScope/.test(w.url)), mode).toEqual([]);
      view.unmount();
    }
  });
});
