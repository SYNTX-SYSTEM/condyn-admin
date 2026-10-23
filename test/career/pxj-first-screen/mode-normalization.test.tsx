import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import { ROLE, UPLOAD } from "./fixtures";
import { browser, find, instance, urlProps } from "./harness";

/**
 * Owner "OWNER_GO_FULL_PXJ_CLOSURE" §05, N-3 O-RF-1 (GELB): an investigationMode the URL names that is no mode is removed on mount
 * by a replace — the same default as a URL without it, and the URL then says what the interface shows. On 88539d3 the unknown
 * value stayed in the URL while the interface showed the default. Harness: ./harness.ts.
 */
vi.mock("react", async (importOriginal) => (await import("./harness")).mockReact(await importOriginal<object>()));

const IDLE_JOB = { state: "IDLE", activeJobId: null, resultAnalysisId: null, canonicalAnalysis: null, currentOperation: null, attemptCount: null, errorCode: null, errorSummary: null, httpStatus: null };
vi.mock("../../../lib/career/ui/useCareerAnalysisJob", () => ({ useCareerAnalysisJob: () => ({ state: IDLE_JOB, submitAnalysis: async () => undefined, resumeJob: () => undefined }) }));
vi.mock("../../../lib/career/ui/useJobScope", () => ({ useJobScopeValidation: (scope: { jobPoolUploadId: string; poolRoleId: string } | null) => scope === null ? { state: "NONE" } : { state: "VALID", scope, roleTitle: "Distributed Systems Architect", organizationId: "org_pink_alpha", organizationName: "Alpha Industrial Systems", poolName: "PINK pool" } }));
vi.mock("../../../lib/career/ui/useJobPool", async (importOriginal) => ({ ...(await importOriginal<typeof import("../../../lib/career/ui/useJobPool")>()), useJobPoolWorkflow: () => ({ pools: { state: "IDLE" }, upload: { state: "IDLE" }, selectedJobPoolUploadId: null, view: { state: "IDLE" }, matches: { state: "IDLE" }, submitUpload: async () => undefined, select: () => undefined, reloadPools: async () => undefined, reloadMatches: async () => undefined }) }));
vi.mock("../../../lib/career/ui/useRoleInvestigation", async (importOriginal) => ({ ...(await importOriginal<typeof import("../../../lib/career/ui/useRoleInvestigation")>()), useAnalysisBoundary: () => ({ state: "IDLE" }), useSelectedRoleCoverage: () => ({ state: "IDLE" }) }));
vi.mock("../../../lib/career/ui/useAnalysisResult", async (importOriginal) => ({ ...(await importOriginal<typeof import("../../../lib/career/ui/useAnalysisResult")>()), useAnalysisResult: () => ({ state: "IDLE" }) }));

import { SemanticCareerIntelligenceField } from "../../../app/components/career/demo/SemanticCareerIntelligenceField";
import { SyntxInvestigationSelector } from "../../../app/components/career/demo/SyntxInvestigationSelector";
import { EMPTY_CAREER_INTELLIGENCE_DATA } from "../../../app/career/demo/demo-data";

const BASE = "http://127.0.0.1/career/demo";
const SCOPE = `jobScopePoolUploadId=${UPLOAD}&jobScopeRoleId=${ROLE}`;
let tab: ReturnType<typeof browser>;
function reload(query: string): ReactElement {
  tab = browser(`${BASE}?${query}`);
  vi.stubGlobal("window", tab.window);
  vi.stubGlobal("localStorage", { getItem: () => "1", setItem: () => undefined });
  const props = { data: EMPTY_CAREER_INTELLIGENCE_DATA, ...urlProps(tab.url) };
  return instance<typeof props>(SemanticCareerIntelligenceField).settle(props);
}
const modeOf = (tree: ReactElement) => find(tree, SyntxInvestigationSelector)!.props.mode;

beforeEach(() => { vi.unstubAllGlobals(); });

describe("N-3 · an unknown investigationMode is removed on mount", () => {
  it.each(["BOGUS", "person", "", "PERSON&investigationMode=JOB"])("REPRODUCE: investigationMode=%s → removed by replace, the default as without it", (value) => {
    const tree = reload(`focus=FIELD&${SCOPE}&investigationMode=${value}`);
    expect(tab.param("investigationMode")).toBeNull();
    expect(new URL(tab.url).searchParams.getAll("investigationMode")).toEqual([]);
    expect(tab.writes.map(write => write.how)).toEqual(["replace"]);
    expect(tab.entries.length).toBe(1);
    // Every other parameter stays.
    expect([tab.param("focus"), tab.param("jobScopePoolUploadId"), tab.param("jobScopeRoleId")]).toEqual(["FIELD", UPLOAD, ROLE]);
    const without = reload(`focus=FIELD&${SCOPE}`);
    expect(modeOf(tree)).toBe(modeOf(without));
    expect(modeOf(tree)).toBe("PERSON_X_JOB");
  });

  it.each(["PERSON", "PERSON_X_JOB", "JOB"])("inverse: investigationMode=%s stays; nothing is written", (mode) => {
    const tree = reload(`focus=FIELD&${SCOPE}&investigationMode=${mode}`);
    expect(tab.param("investigationMode")).toBe(mode);
    expect(modeOf(tree)).toBe(mode);
    expect(tab.writes).toEqual([]);
  });

  it("inverse: without the parameter nothing is added (the default is not written)", () => {
    reload(`focus=FIELD&${SCOPE}`);
    expect(tab.param("investigationMode")).toBeNull();
    expect(tab.writes).toEqual([]);
  });
});
