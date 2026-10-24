import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import { browser, instance } from "./harness";

/**
 * RD-URL (owner "OWNER_DECISION_ROLE_DISCOVERY" D-RD-1 = B; GELB stage 2): the pools released for role discovery stand in the URL
 * as the one repeated parameter `discoveryPoolUploadId` — read by the shared parser on both paths (page.tsx on a reload, the history
 * on Back / Forward: NAV ≡ RELOAD), written as one push, a set that is not valid as a whole (not upload ids, repeated, > 10) is no
 * release and is removed on mount. Harness: ./harness.ts.
 */
vi.mock("react", async (importOriginal) => (await import("./harness")).mockReact(await importOriginal<object>()));
vi.mock("../../../lib/career/ui/useCareerAnalysisJob", () => ({ useCareerAnalysisJob: () => ({ state: { state: "IDLE", activeJobId: null, resultAnalysisId: null, canonicalAnalysis: null, currentOperation: null, attemptCount: null, errorCode: null, errorSummary: null, httpStatus: null }, submitAnalysis: async () => undefined, resumeJob: () => undefined }) }));
vi.mock("../../../lib/career/ui/useJobScope", () => ({ useJobScopeValidation: () => ({ state: "NONE" }) }));
vi.mock("../../../lib/career/ui/useJobPool", async (importOriginal) => ({ ...(await importOriginal<typeof import("../../../lib/career/ui/useJobPool")>()), useJobPoolWorkflow: () => ({ pools: { state: "IDLE" }, upload: { state: "IDLE" }, selectedJobPoolUploadId: null, view: { state: "IDLE" }, matches: { state: "IDLE" }, submitUpload: async () => undefined, select: () => undefined, reloadPools: async () => undefined, reloadMatches: async () => undefined }) }));
vi.mock("../../../lib/career/ui/useRoleInvestigation", async (importOriginal) => ({ ...(await importOriginal<typeof import("../../../lib/career/ui/useRoleInvestigation")>()), useAnalysisBoundary: () => ({ state: "IDLE" }), useSelectedRoleCoverage: () => ({ state: "IDLE" }) }));
vi.mock("../../../lib/career/ui/useAnalysisResult", async (importOriginal) => ({ ...(await importOriginal<typeof import("../../../lib/career/ui/useAnalysisResult")>()), useAnalysisResult: () => ({ state: "IDLE" }) }));

import CareerIntelligenceDemoPage from "../../../app/career/demo/page";
import { SemanticCareerIntelligenceField } from "../../../app/components/career/demo/SemanticCareerIntelligenceField";
import { EMPTY_CAREER_INTELLIGENCE_DATA } from "../../../app/career/demo/demo-data";
import { careerDemoPropsFromSearchParams, careerDemoSearchParamsFromSearch, writeCareerDemoUrl } from "../../../lib/career/ui/career-demo-url";

const A = "JPOOL_0DCDB34AE9F8FF8A3D335BA26C9F16C2", B = "JPOOL_B94850C439974E27496FE3B1A9A076B5";
const BASE = "http://127.0.0.1/career/demo";
const props = (search: string) => careerDemoPropsFromSearchParams(careerDemoSearchParamsFromSearch(search)) as Record<string, unknown>;
async function pageProps(url: string) {
  const element = await CareerIntelligenceDemoPage({ searchParams: Promise.resolve(careerDemoSearchParamsFromSearch(new URL(url).search)) }) as ReactElement<Record<string, unknown>>;
  return element.props.initial as Record<string, unknown>;
}

afterEach(() => { vi.unstubAllGlobals(); });

describe("RD-URL · the released pools in the URL", () => {
  it("REPRODUCE: the shared parser reads the repeated parameter as the released set, in the user's order", () => {
    expect(props(`?investigationMode=PERSON&discoveryPoolUploadId=${B}&discoveryPoolUploadId=${A}`).discoveryPoolUploadIds).toEqual([B, A]);
    expect(props(`?discoveryPoolUploadId=${A}`).discoveryPoolUploadIds).toEqual([A]);
  });

  it("REPRODUCE: the writer writes a list once per value, in order, as one push; null removes it", async () => {
    const tab = browser(`${BASE}?investigationMode=PERSON&analysisId=ANL_1`);
    vi.stubGlobal("window", tab.window);
    writeCareerDemoUrl({ discoveryPoolUploadId: [A, B] }, "push");
    expect(new URL(tab.url).searchParams.getAll("discoveryPoolUploadId")).toEqual([A, B]);
    expect(tab.entries).toHaveLength(2);
    await tab.nextTask();
    writeCareerDemoUrl({ discoveryPoolUploadId: null }, "push");
    expect(new URL(tab.url).searchParams.has("discoveryPoolUploadId")).toBe(false);
  });

  it("REPRODUCE: NAV ≡ RELOAD — Back to a released entry mounts the props a reload of that URL gives", async () => {
    const tab = browser(`${BASE}?focus=CAPABILITY&investigationMode=PERSON`);
    vi.stubGlobal("window", tab.window);
    vi.stubGlobal("localStorage", { getItem: () => "1", setItem: () => undefined });
    const page = await CareerIntelligenceDemoPage({ searchParams: Promise.resolve({}) }) as ReactElement<Record<string, unknown>>;
    const history = instance<Record<string, unknown>>(page.type);
    history.settle(page.props);
    tab.window.history.pushState(null, "", `${BASE}?focus=CAPABILITY&investigationMode=PERSON&discoveryPoolUploadId=${A}&discoveryPoolUploadId=${B}`);
    tab.window.history.pushState(null, "", `${BASE}?focus=FIELD`);
    tab.back();
    const restored = history.settle(page.props) as ReactElement<Record<string, unknown>>;
    expect(restored.props.discoveryPoolUploadIds).toEqual([A, B]);
    const { data: _data, ...nav } = restored.props;
    expect(nav).toEqual(await pageProps(tab.url));
  });

  it("REPRODUCE: a set that is not valid as a whole is no release — read as absent and removed on mount (a replace)", () => {
    for (const bad of [`discoveryPoolUploadId=${A}&discoveryPoolUploadId=${A}`, "discoveryPoolUploadId=JPOOL_short", `discoveryPoolUploadId=${A}&discoveryPoolUploadId=all`]) {
      expect(props(`?${bad}`).discoveryPoolUploadIds, bad).toBeUndefined();
      const tab = browser(`${BASE}?focus=CAPABILITY&investigationMode=PERSON&${bad}`);
      vi.stubGlobal("window", tab.window);
      vi.stubGlobal("localStorage", { getItem: () => "1", setItem: () => undefined });
      instance<Record<string, unknown>>(SemanticCareerIntelligenceField).settle({ data: EMPTY_CAREER_INTELLIGENCE_DATA, investigationMode: "PERSON", fieldFocus: "CAPABILITY" });
      expect(new URL(tab.url).searchParams.has("discoveryPoolUploadId"), bad).toBe(false);
      expect(tab.writes.every(write => write.how === "replace"), bad).toBe(true);
    }
    expect(props(`?${Array.from({ length: 11 }, (_, i) => `discoveryPoolUploadId=JPOOL_${String(i).padStart(32, "0")}`).join("&")}`).discoveryPoolUploadIds).toBeUndefined();
  });

  it("inverse: every other parameter stays single — a repeated one is still absent; without the parameter nothing is written", () => {
    expect(props(`?jobPoolUploadId=${A}&jobPoolUploadId=${B}`).jobPoolUploadId).toBeUndefined();
    const tab = browser(`${BASE}?focus=CAPABILITY&investigationMode=PERSON`);
    vi.stubGlobal("window", tab.window);
    vi.stubGlobal("localStorage", { getItem: () => "1", setItem: () => undefined });
    instance<Record<string, unknown>>(SemanticCareerIntelligenceField).settle({ data: EMPTY_CAREER_INTELLIGENCE_DATA, investigationMode: "PERSON", fieldFocus: "CAPABILITY" });
    expect(tab.writes).toEqual([]);
  });
});
