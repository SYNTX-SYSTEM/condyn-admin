import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { browser, find, instance } from "./harness";
import { ANALYSIS, boundary, resultBody } from "./fixtures";

/**
 * GELB decision on GRÜN's DLL-full path review, point 2: the discovery panel's empty-pools state ("No job pool is
 * uploaded. Upload one in the Job Field.") was text only — no way to actually get there. A real action now switches to
 * the Job Field, the same way the SYNTX field selector's own toggle does (no new URL parameter; `focus=FIELD` already
 * exists). Harness: ./harness.ts.
 */
const control = vi.hoisted(() => ({ job: null as unknown, boundary: null as unknown, result: null as unknown }));
vi.mock("react", async (importOriginal) => (await import("./harness")).mockReact(await importOriginal<object>()));
vi.mock("../../../lib/career/ui/useCareerAnalysisJob", () => ({ useCareerAnalysisJob: () => ({ state: control.job, submitAnalysis: async () => undefined, resumeJob: () => undefined }) }));
vi.mock("../../../lib/career/ui/useJobScope", () => ({ useJobScopeValidation: () => ({ state: "NONE" }) }));
vi.mock("../../../lib/career/ui/useJobPoolSources", () => ({ useAnalysisSources: () => ({ state: "IDLE" }) }));
vi.mock("../../../lib/career/ui/useJobPool", async (importOriginal) => ({ ...(await importOriginal<typeof import("../../../lib/career/ui/useJobPool")>()), useJobPoolWorkflow: () => ({ pools: { state: "EMPTY" }, upload: { state: "IDLE" }, selectedJobPoolUploadId: null, view: { state: "IDLE" }, matches: { state: "IDLE" }, submitUpload: async () => undefined, select: () => undefined, reloadPools: async () => undefined, reloadMatches: async () => undefined }) }));
vi.mock("../../../lib/career/ui/useRoleInvestigation", async (importOriginal) => ({ ...(await importOriginal<typeof import("../../../lib/career/ui/useRoleInvestigation")>()), useAnalysisBoundary: (id: string | null) => id === null ? { state: "IDLE" } : control.boundary, useSelectedRoleCoverage: () => ({ state: "IDLE" }) }));
vi.mock("../../../lib/career/ui/useAnalysisResult", async (importOriginal) => ({ ...(await importOriginal<typeof import("../../../lib/career/ui/useAnalysisResult")>()), useAnalysisResult: (id: string | null) => id === null ? { state: "IDLE" } : control.result }));

import { SemanticCareerIntelligenceField } from "../../../app/components/career/demo/SemanticCareerIntelligenceField";
import { RoleDiscoveryEntry, RoleDiscoveryPanel } from "../../../app/components/career/demo/RoleDiscoveryPanel";
import { EMPTY_CAREER_INTELLIGENCE_DATA } from "../../../app/career/demo/demo-data";
import { careerDemoPropsFromSearchParams, careerDemoSearchParamsFromSearch } from "../../../lib/career/ui/career-demo-url";
import { decodeAnalysisResult } from "../../../lib/career/view-model/pxj-first-screen";

const BASE = "http://127.0.0.1/career/demo";
const IDLE_JOB = { state: "IDLE", activeJobId: null, resultAnalysisId: null, canonicalAnalysis: null, currentOperation: null, attemptCount: null, errorCode: null, errorSummary: null, httpStatus: null };
const flush = async () => { for (let i = 0; i < 12; i += 1) await Promise.resolve(); };

describe("RD-PANEL pools-empty handover · a real action to the Job Field", () => {
  it("REPRODUCE: markup — the empty-pools text carries a button, not only prose", () => {
    const html = renderToString(<RoleDiscoveryPanel locale="de" pools={{ state: "EMPTY" }} released={null} discovery={{ state: "IDLE" }} onRelease={() => undefined} onClose={() => undefined} onGoToJobField={() => undefined} />);
    expect(html).toContain('data-testid="rd-pools-go-to-job-field"');
    expect(html).toContain("ZUM JOB-FELD");
    const en = renderToString(<RoleDiscoveryPanel locale="en" pools={{ state: "EMPTY" }} released={null} discovery={{ state: "IDLE" }} onRelease={() => undefined} onClose={() => undefined} onGoToJobField={() => undefined} />);
    expect(en).toContain("GO TO JOB FIELD");
  });

  it("REPRODUCE: clicking it switches the field the same way the SYNTX field selector does — one push of focus=FIELD, no new parameter", async () => {
    const decoded = decodeAnalysisResult(resultBody(), ANALYSIS);
    if (!decoded.ok) throw new Error(decoded.code);
    control.job = IDLE_JOB;
    control.boundary = { state: "RESOLVED", value: boundary({ mode: "PERSON", jobScopeSelection: null, investigationScopeHash: null }) };
    control.result = { state: "AVAILABLE", result: decoded.result };
    const tab = browser(`${BASE}?focus=CAPABILITY&investigationMode=PERSON&analysisId=${ANALYSIS}`);
    vi.stubGlobal("window", tab.window);
    vi.stubGlobal("fetch", async () => ({ status: 200, json: async () => ({ success: false, issues: [{ code: "ERR_X" }] }) }));
    vi.stubGlobal("localStorage", { getItem: () => "1", setItem: () => undefined });
    const props = { data: EMPTY_CAREER_INTELLIGENCE_DATA, ...careerDemoPropsFromSearchParams(careerDemoSearchParamsFromSearch(new URL(tab.url).search)) } as Record<string, unknown>;
    const view = instance<Record<string, unknown>>(SemanticCareerIntelligenceField);
    let tree = view.settle(props);
    await flush();
    tree = view.settle(props);
    // DISCOVER JOBS opens the panel (no URL step of its own).
    (find(tree, RoleDiscoveryEntry)!.props.onOpen as () => void)();
    tree = view.settle(props);
    const panel = find(tree, RoleDiscoveryPanel);
    expect(panel).not.toBeNull();
    (panel!.props as { onGoToJobField?: () => void }).onGoToJobField!();
    tree = view.settle(props);
    expect(new URL(tab.url).searchParams.get("focus")).toBe("FIELD");
    expect(new URL(tab.url).searchParams.toString().split("&").filter(p => !p.startsWith("focus=")).join("&")).toBe(new URL(`${BASE}?focus=CAPABILITY&investigationMode=PERSON&analysisId=${ANALYSIS}`).searchParams.toString().split("&").filter(p => !p.startsWith("focus=")).join("&"));
    view.unmount();
  });

  it("inverse: with pools available, or without onGoToJobField, no such button appears", () => {
    const withPools = renderToString(<RoleDiscoveryPanel locale="de" pools={{ state: "AVAILABLE", jobPools: [] }} released={null} discovery={{ state: "IDLE" }} onRelease={() => undefined} onClose={() => undefined} onGoToJobField={() => undefined} />);
    expect(withPools).not.toContain("rd-pools-go-to-job-field");
    const noCallback = renderToString(<RoleDiscoveryPanel locale="de" pools={{ state: "EMPTY" }} released={null} discovery={{ state: "IDLE" }} onRelease={() => undefined} onClose={() => undefined} />);
    expect(noCallback).not.toContain("rd-pools-go-to-job-field");
    expect(noCallback).toContain("Es ist kein Job-Pool hochgeladen");
  });
});
