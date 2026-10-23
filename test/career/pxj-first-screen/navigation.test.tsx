import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import { ANALYSIS, ROLE, UPLOAD, boundary, coverage, resultBody } from "./fixtures";
import { browser, find, instance, urlProps } from "./harness";

/**
 * Owner "OWNER_GO_FULL_PXJ_CLOSURE" §05, N-1 B-NAV (GELB): every decision the user takes that the URL carries is one browser
 * history entry (push); what the system adds afterwards replaces the entry on view; Back / Forward mount the field afresh from the
 * entry's URL through the page's own parser (NAV ≡ RELOAD). On 88539d3 every write was a replace and nothing listened to popstate.
 * Harness: see ./harness.ts (component functions called with a minimal hook runtime; read hooks steered here).
 */
vi.mock("react", async (importOriginal) => (await import("./harness")).mockReact(await importOriginal<object>()));

type Validation = { state: string; scope?: { jobPoolUploadId: string; poolRoleId: string }; reason?: string; roleTitle?: string; organizationId?: string; organizationName?: string | null; poolName?: string };
const IDLE_JOB = { state: "IDLE", activeJobId: null, resultAnalysisId: null, canonicalAnalysis: null, currentOperation: null, attemptCount: null, errorCode: null, errorSummary: null, httpStatus: null };
const control = vi.hoisted(() => ({
  job: {} as Record<string, unknown>,
  selectedPool: null as string | null,
  validation: (_scope: { jobPoolUploadId: string; poolRoleId: string } | null): Validation => ({ state: "NONE" }),
  boundaries: {} as Record<string, unknown>,
  results: {} as Record<string, unknown>
}));
vi.mock("../../../lib/career/ui/useCareerAnalysisJob", () => ({ useCareerAnalysisJob: () => ({ state: control.job, submitAnalysis: async () => undefined, resumeJob: () => undefined }) }));
vi.mock("../../../lib/career/ui/useJobScope", () => ({ useJobScopeValidation: (scope: { jobPoolUploadId: string; poolRoleId: string } | null) => control.validation(scope) }));
vi.mock("../../../lib/career/ui/useJobPool", async (importOriginal) => ({ ...(await importOriginal<typeof import("../../../lib/career/ui/useJobPool")>()), useJobPoolWorkflow: () => ({ pools: { state: "IDLE" }, upload: { state: "IDLE" }, selectedJobPoolUploadId: control.selectedPool, view: { state: "IDLE" }, matches: { state: "IDLE" }, submitUpload: async () => undefined, select: (id: string) => { control.selectedPool = id; }, reloadPools: async () => undefined, reloadMatches: async () => undefined }) }));
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
import { CareerIntelligenceDashboard } from "../../../app/components/career/demo/CareerIntelligenceDashboard";
import { PxjAnalysisJobOffer, PxjFirstScreen } from "../../../app/components/career/demo/PxjFirstScreen";
import { SyntxField } from "../../../app/components/career/demo/SyntxField";
import { SyntxFieldSelector } from "../../../app/components/career/demo/SyntxFieldSelector";
import { SyntxInvestigationSelector } from "../../../app/components/career/demo/SyntxInvestigationSelector";
import CareerIntelligenceDemoPage from "../../../app/career/demo/page";
import { EMPTY_CAREER_INTELLIGENCE_DATA } from "../../../app/career/demo/demo-data";
import { decodeAnalysisResult } from "../../../lib/career/view-model/pxj-first-screen";

const A1 = ANALYSIS;
const SCOPE = { jobPoolUploadId: UPLOAD, poolRoleId: ROLE };
const OTHER_ROLE = "role_pink_beta_platform";
const BASE = "http://127.0.0.1/career/demo";
const bodyFor = (id: string) => resultBody({ analysisId: id, metadata: { analysis_id: id } });
const available = (id: string) => { const decoded = decodeAnalysisResult(bodyFor(id), id); if (!decoded.ok) throw new Error(decoded.code); return { state: "AVAILABLE", result: decoded.result }; };
const valid = (scope: { jobPoolUploadId: string; poolRoleId: string } | null): Validation => scope === null ? { state: "NONE" } : { state: "VALID", scope, roleTitle: "Distributed Systems Architect", organizationId: "org_pink_alpha", organizationName: "Alpha Industrial Systems", poolName: "PINK pool" };

/** The page's own path from a URL to the field's props: the server's searchParams shape (a repeated parameter is an array). */
async function pageProps(url: string): Promise<Record<string, unknown>> {
  const searchParams: Record<string, string | string[]> = {};
  for (const [name, value] of new URL(url).searchParams) { const previous = searchParams[name]; searchParams[name] = previous === undefined ? value : Array.isArray(previous) ? [...previous, value] : [previous, value]; }
  const element = await CareerIntelligenceDemoPage({ searchParams: Promise.resolve(searchParams) }) as ReactElement<Record<string, unknown>>;
  return element.props.initial as Record<string, unknown>;
}

let tab: ReturnType<typeof browser>;
function open(query: string) {
  tab = browser(`${BASE}?${query}`);
  vi.stubGlobal("window", tab.window);
  vi.stubGlobal("localStorage", { getItem: () => "1", setItem: () => undefined });
}
async function field(query: string) {
  open(query);
  const props = { data: EMPTY_CAREER_INTELLIGENCE_DATA, ...urlProps(tab.url) };
  const view = instance<typeof props>(SemanticCareerIntelligenceField);
  return { draw: () => view.settle(props), view };
}
const call = (tree: ReactElement, type: unknown, prop: string, ...args: unknown[]) => (find(tree, type)!.props[prop] as (...a: unknown[]) => void)(...args);
const pushes = () => tab.writes.filter(write => write.how === "push");
const screenOf = (tree: ReactElement) => (find(tree, PxjFirstScreen)?.props.screen ?? find(tree, PxjAnalysisJobOffer)?.props.screen) as { state: string; analysisId?: string; selection?: unknown } | undefined;

beforeEach(() => {
  control.job = { ...IDLE_JOB }; control.selectedPool = null; control.validation = valid;
  control.boundaries = { [A1]: { state: "RESOLVED", value: boundary({ analysisId: A1 }) } };
  control.results = { [A1]: available(A1) };
});

const pxj = (extra = "") => `focus=CAPABILITY&investigationMode=PERSON_X_JOB&jobScopePoolUploadId=${UPLOAD}&jobScopeRoleId=${ROLE}${extra}`;

describe("N-1 · every user decision the URL carries is one history entry", () => {
  it("REPRODUCE: a mode, a field, an observation, a pool, a job chosen / removed / opened, the offer's role — each one push", async () => {
    const { draw } = await field("focus=FIELD");
    let tree = draw();
    call(tree, SyntxInvestigationSelector, "onSelect", "PERSON");
    await tab.nextTask(); tree = draw();
    expect(pushes().length).toBe(1);
    expect(tab.param("investigationMode")).toBe("PERSON");

    call(tree, SyntxField, "onObserve", { kind: "REQUIREMENT", organizationId: "org_a", roleId: "role_a", requirementId: "req_a", apertureSignId: null });
    await tab.nextTask(); tree = draw();
    expect(pushes().length).toBe(2);
    expect([tab.param("jobOrganizationId"), tab.param("jobRoleId"), tab.param("jobRequirementId")]).toEqual(["org_a", "role_a", "req_a"]);

    call(tree, SyntxField, "onSelectPool", UPLOAD);
    await tab.nextTask(); tree = draw();
    expect(pushes().length).toBe(3);
    expect(tab.param("jobPoolUploadId")).toBe(UPLOAD);
    expect(tab.param("jobRoleId")).toBeNull();

    call(tree, SyntxField, "onSelectJobScope", ROLE);
    await tab.nextTask(); tree = draw();
    expect(pushes().length).toBe(4);
    expect([tab.param("jobScopePoolUploadId"), tab.param("jobScopeRoleId")]).toEqual([UPLOAD, ROLE]);

    call(tree, SyntxFieldSelector, "onSelect", "CAPABILITY");
    await tab.nextTask(); tree = draw();
    expect(pushes().length).toBe(5);
    expect(tab.param("focus")).toBe("CAPABILITY");

    call(tree, SyntxFieldSelector, "onJobScopeActivate");
    await tab.nextTask(); tree = draw();
    expect(pushes().length).toBe(6);
    expect([tab.param("focus"), tab.param("jobRoleId")]).toEqual(["FIELD", ROLE]);

    call(tree, SyntxField, "onClearJobScope");
    await tab.nextTask(); tree = draw();
    expect(pushes().length).toBe(7);
    expect(tab.param("jobScopeRoleId")).toBeNull();
    // Seven decisions, seven entries after the first: the further parameters of one action join its entry (no systemic addendum).
    expect(tab.entries.length).toBe(8);
  });

  it("REPRODUCE: the ROLE_MISMATCH offer's \"choose this role\" is one push", async () => {
    const { draw } = await field(`focus=FIELD&investigationMode=PERSON_X_JOB&jobScopePoolUploadId=${UPLOAD}&jobScopeRoleId=${OTHER_ROLE}&analysisId=${A1}`);
    let tree = draw();
    expect(screenOf(tree)?.state).toBe("ROLE_MISMATCH");
    call(tree, PxjAnalysisJobOffer, "onSelectRole", SCOPE);
    await tab.nextTask(); tree = draw();
    expect(pushes().map(write => new URL(write.url).searchParams.get("jobScopeRoleId"))).toEqual([ROLE]);
  });

  it("inverse: one action writing several parameters is one entry; an unchanged URL writes nothing; SUCCEEDED replaces", async () => {
    const { draw } = await field(pxj());
    let tree = draw();
    // focus=FIELD from CAPABILITY via the shell: field and observation in one entry.
    call(tree, SyntxFieldSelector, "onJobScopeActivate");
    await tab.nextTask(); tree = draw();
    expect(pushes().length).toBe(1);
    expect(tab.entries.length).toBe(2);
    // The mode already chosen: no entry, no write.
    const before = tab.writes.length;
    call(tree, SyntxInvestigationSelector, "onSelect", "PERSON_X_JOB");
    await tab.nextTask(); tree = draw();
    expect(tab.writes.length).toBe(before);
    // SUCCEEDED: analysisId and mode are the system's addendum to the entry on view.
    control.job = { ...IDLE_JOB, state: "SUCCEEDED", activeJobId: "JOB_1792000000001_1", resultAnalysisId: A1, canonicalAnalysis: bodyFor(A1) };
    tree = draw();
    expect(pushes().length).toBe(1);
    expect(tab.entries.length).toBe(2);
    expect(tab.writes.at(-1)?.how).toBe("replace");
    expect(tab.param("analysisId")).toBe(A1);
  });
});

describe("N-1 · Back / Forward mount the field from the entry's URL (NAV ≡ RELOAD)", () => {
  async function shell(query: string) {
    open(query);
    const page = await CareerIntelligenceDemoPage({ searchParams: Promise.resolve(Object.fromEntries(new URL(tab.url).searchParams)) }) as ReactElement<Record<string, unknown>>;
    const view = instance<Record<string, unknown>>(page.type);
    return { draw: () => view.settle(page.props), view };
  }

  it("REPRODUCE: popstate remounts the dashboard (a new key) with exactly the props a reload of that URL gives", async () => {
    const { draw } = await shell(pxj());
    const first = draw();
    expect(first.type).toBe(CareerIntelligenceDashboard);
    expect(tab.listeners.size).toBe(1);
    tab.window.history.pushState(null, "", `${BASE}?focus=CAPABILITY&investigationMode=PERSON&jobScopePoolUploadId=${UPLOAD}&jobScopeRoleId=${ROLE}`);
    tab.window.history.pushState(null, "", `${BASE}?focus=FIELD`);
    tab.back();
    const back = draw();
    expect(back.key).not.toBe(first.key);
    expect({ ...back.props, data: undefined }).toEqual({ ...(await pageProps(tab.url)), data: undefined });
    expect(back.props.investigationMode).toBe("PERSON");
    tab.back();
    const home = draw();
    expect(home.key).not.toBe(back.key);
    expect(home.props.investigationMode).toBe("PERSON_X_JOB");
    tab.forward(); tab.forward();
    const ahead = draw();
    expect(ahead.props.fieldFocus).toBe("FIELD");
    expect(ahead.props.jobScopeRoleId).toBeUndefined();
  });

  it("inverse: a field mounted from the restored props shows what a reload shows — same first screen, rows and quotes", async () => {
    const { draw } = await shell(pxj(`&analysisId=${A1}`));
    draw();
    tab.window.history.pushState(null, "", `${BASE}?focus=FIELD`);
    tab.back();
    const restored = draw();
    const reload = { data: EMPTY_CAREER_INTELLIGENCE_DATA, ...(await pageProps(tab.url)) };
    const navView = instance<Record<string, unknown>>(SemanticCareerIntelligenceField).settle({ ...restored.props, data: EMPTY_CAREER_INTELLIGENCE_DATA });
    const reloadView = instance<Record<string, unknown>>(SemanticCareerIntelligenceField).settle(reload);
    expect(screenOf(navView)?.state).toBe("AVAILABLE");
    expect(screenOf(navView)).toEqual(screenOf(reloadView));
  });

  it("inverse: the listener is released on unmount; without popstate the server's props stay", async () => {
    const { draw, view } = await shell(pxj());
    const first = draw();
    expect(draw().key).toBe(first.key);
    view.unmount();
    expect(tab.listeners.size).toBe(0);
  });
});

describe("N-1 · one parser for page.tsx and the history (GELB point 3)", () => {
  const urls = [
    pxj(`&analysisId=${A1}`),
    "focus=JOB&jobPoolUploadId=JPOOL_1&jobOrganizationId=org_a&jobRoleId=role_a&jobRequirementId=req_a",
    "focus=POOL&investigationMode=JOB&canonicalSilAssociationId=SILA_1&careerDecisionContextRevisionId=DCTXREV_1&decisionContextRevisionId=DREV_1",
    "focus=elsewhere&investigationMode=BOGUS",
    `investigationMode=PERSON&investigationMode=JOB&analysisId=${A1}&analysisId=ANL_2`,
    ""
  ];
  it.each(urls)("same URL, same props on both paths: %s", async (query) => {
    open("focus=FIELD");
    const page = await CareerIntelligenceDemoPage({ searchParams: Promise.resolve({}) }) as ReactElement<Record<string, unknown>>;
    const view = instance<Record<string, unknown>>(page.type);
    view.settle(page.props);
    tab.window.history.pushState(null, "", `${BASE}?${query}`);
    tab.window.history.pushState(null, "", `${BASE}?focus=FIELD`);
    tab.back();
    const restored = view.settle(page.props);
    const { data: _data, ...navProps } = restored.props;
    expect(navProps).toEqual(await pageProps(`${BASE}?${query}`));
  });

  it("inverse: a repeated parameter is ambiguous and read as absent on both paths", async () => {
    const props = await pageProps(`${BASE}?investigationMode=PERSON&investigationMode=JOB`);
    expect(props.investigationMode).toBeUndefined();
    expect((await pageProps(`${BASE}?investigationMode=PERSON`)).investigationMode).toBe("PERSON");
  });
});
