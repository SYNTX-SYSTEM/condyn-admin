import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import { renderToString } from "react-dom/server";
import { ANALYSIS, ROLE, UPLOAD } from "./fixtures";
import { browser, find, instance, urlProps } from "./harness";

/**
 * PINK V-05 / V-06 on 421e382 (owner "RECURSIVE UX/UI & SYSTEM CLOSURE"; GELB mapping to UX-03 / UX-04):
 *  - V-05: an INVALID selected job said "Select a job … first" — the same as no job; the validation's reason stood nowhere at the gate.
 *  - V-06: RESULT_NOT_FOUND had no action; the banner of a job followed from the URL (not found / failed) had no way to close and
 *    stayed over the field; the Job Field's NO_ANALYSIS asked to select a job although one was selected.
 * Harness: ./harness.ts (read hooks and the job hook steered, the history recorded).
 */
vi.mock("react", async (importOriginal) => (await import("./harness")).mockReact(await importOriginal<object>()));

const IDLE_JOB = { state: "IDLE", activeJobId: null, resultAnalysisId: null, canonicalAnalysis: null, currentOperation: null, attemptCount: null, errorCode: null, errorSummary: null, httpStatus: null };
const control = vi.hoisted(() => ({ job: {} as Record<string, unknown>, submitted: [] as unknown[], resumed: [] as string[], scope: null as null | Record<string, unknown>, results: {} as Record<string, unknown> }));
vi.mock("../../../lib/career/ui/useCareerAnalysisJob", () => ({ useCareerAnalysisJob: () => ({ state: control.job, submitAnalysis: async (payload: unknown) => { control.submitted.push(payload); }, resumeJob: (jobId: string) => { control.resumed.push(jobId); } }) }));
vi.mock("../../../lib/career/ui/useJobScope", () => ({ useJobScopeValidation: (scope: { jobPoolUploadId: string; poolRoleId: string } | null) => control.scope ?? (scope === null ? { state: "NONE" } : { state: "VALID", scope, roleTitle: "Distributed Systems Architect", organizationId: "org_pink_alpha", organizationName: "Alpha Industrial Systems", poolName: "PINK pool" }) }));
vi.mock("../../../lib/career/ui/useJobPool", async (importOriginal) => ({ ...(await importOriginal<typeof import("../../../lib/career/ui/useJobPool")>()), useJobPoolWorkflow: () => ({ pools: { state: "IDLE" }, upload: { state: "IDLE" }, selectedJobPoolUploadId: null, view: { state: "IDLE" }, matches: { state: "IDLE" }, submitUpload: async () => undefined, select: () => undefined, reloadPools: async () => undefined, reloadMatches: async () => undefined }) }));
vi.mock("../../../lib/career/ui/useRoleInvestigation", async (importOriginal) => ({ ...(await importOriginal<typeof import("../../../lib/career/ui/useRoleInvestigation")>()), useAnalysisBoundary: () => ({ state: "IDLE" }), useSelectedRoleCoverage: () => ({ state: "IDLE" }) }));
vi.mock("../../../lib/career/ui/useAnalysisResult", async (importOriginal) => ({ ...(await importOriginal<typeof import("../../../lib/career/ui/useAnalysisResult")>()), useAnalysisResult: (analysisId: string | null) => analysisId === null ? { state: "IDLE" } : control.results[analysisId] ?? { state: "LOADING" } }));

import { SemanticCareerIntelligenceField } from "../../../app/components/career/demo/SemanticCareerIntelligenceField";
import { PxjFirstScreen } from "../../../app/components/career/demo/PxjFirstScreen";
import { SyntxField } from "../../../app/components/career/demo/SyntxField";
import { SyntxFieldSelector } from "../../../app/components/career/demo/SyntxFieldSelector";
import { EMPTY_CAREER_INTELLIGENCE_DATA } from "../../../app/career/demo/demo-data";
import { SIL_COPY } from "../../../lib/career/view-model/sil-language";
import { summary, view } from "../job-pool/fixtures/match-bodies";

const JOB = "JOB_1792000000061_61";
const BASE = "http://127.0.0.1/career/demo";
const pxj = (extra = "") => `focus=CAPABILITY&investigationMode=PERSON_X_JOB&jobScopePoolUploadId=${UPLOAD}&jobScopeRoleId=${ROLE}${extra}`;
let tab: ReturnType<typeof browser>;
function load(query: string) {
  tab = browser(`${BASE}?${query}`);
  vi.stubGlobal("window", tab.window);
  vi.stubGlobal("localStorage", { getItem: () => "1", setItem: () => undefined });
  const props = { data: EMPTY_CAREER_INTELLIGENCE_DATA, ...urlProps(tab.url) };
  const field = instance<typeof props>(SemanticCareerIntelligenceField);
  return () => field.settle(props) as ReactElement<Record<string, unknown>>;
}
function findBy(node: unknown, test: (props: Record<string, unknown>) => boolean): ReactElement<Record<string, unknown>> | null {
  if (!node || typeof node !== "object") return null;
  if (Array.isArray(node)) { for (const child of node) { const hit = findBy(child, test); if (hit) return hit; } return null; }
  const element = node as ReactElement<Record<string, unknown>>;
  if (element.props && test(element.props)) return element;
  return findBy(element.props?.children, test);
}
const byId = (tree: unknown, id: string) => findBy(tree, props => props["data-testid"] === id);

beforeEach(() => { control.job = { ...IDLE_JOB }; control.submitted = []; control.resumed = []; control.scope = null; control.results = {}; });

describe("V-06 · a job followed from the URL: its banner closes", () => {
  it("REPRODUCE: NOT FOUND — CLOSE hides the banner by one push without analysisJobId; no retry, no POST; Back names the job again", async () => {
    const draw = load(pxj(`&analysisJobId=${JOB}`));
    control.job = { ...IDLE_JOB, state: "FAILED", activeJobId: JOB, errorCode: "NOT_FOUND", errorSummary: "Job not found", httpStatus: 404 };
    let tree = draw();
    expect(byId(tree, "intake-error-banner")?.props["data-job-resume"]).toBe("NOT_FOUND");
    const close = byId(tree, "intake-error-dismiss");
    expect(close).not.toBeNull();
    expect(byId(tree, "retry-intake-btn")).toBeNull();
    (close!.props.onClick as () => void)();
    await tab.nextTask(); tree = draw();
    expect(byId(tree, "intake-error-banner")).toBeNull();
    expect(tab.writes.filter(write => write.how === "push")).toHaveLength(1);
    expect(tab.param("analysisJobId")).toBeNull();
    expect(control.submitted).toEqual([]);
    tab.back();
    expect(tab.param("analysisJobId")).toBe(JOB);
  });

  it("inverse: a run of this session that FAILED keeps its banner with RETRY and has no CLOSE (unchanged)", () => {
    const draw = load(pxj());
    control.job = { ...IDLE_JOB, state: "FAILED", activeJobId: "JOB_1792000000062_62", errorCode: "ERR_WORKER_FAILED", errorSummary: "worker failed", httpStatus: null };
    const tree = draw();
    expect(byId(tree, "intake-error-banner")).not.toBeNull();
    expect(byId(tree, "retry-intake-btn")).not.toBeNull();
    expect(byId(tree, "intake-error-dismiss")).toBeNull();
  });
});

describe("V-06 · RESULT_NOT_FOUND has a way out", () => {
  it("REPRODUCE: the first screen offers the existing investigations of the selected role (D-PICK)", () => {
    control.results = { [ANALYSIS]: { state: "NOT_FOUND" } };
    const tree = load(pxj(`&analysisId=${ANALYSIS}`))();
    const screen = find(tree, PxjFirstScreen);
    expect((screen?.props.screen as { state: string }).state).toBe("RESULT_NOT_FOUND");
    expect((screen?.props.noAnalysis as ReactElement<{ place: string }> | undefined)?.props.place).toBe("first-screen");
  });
});

describe("V-05 · the gate names an invalid job with its reason", () => {
  it("REPRODUCE: INVALID — the cause carries the validation's reason, not the sentence of no job", () => {
    control.scope = { state: "INVALID", scope: { jobPoolUploadId: UPLOAD, poolRoleId: ROLE }, reason: "ROLE_NOT_IN_POOL" };
    const tree = load(pxj())();
    const gate = find(tree, SyntxFieldSelector)?.props.capabilityGate as { state: string; reason: string } | undefined;
    expect(gate?.state).toBe("INVALID");
    expect(gate?.reason).toBe(`${SIL_COPY.en.syntx.entry.line.INVALID.replace(/\.$/, "")} · ROLE_NOT_IN_POOL.`);
  });

  it("inverse: no job — the cause names none, without a reason", () => {
    const tree = load("focus=CAPABILITY&investigationMode=PERSON_X_JOB")();
    expect((find(tree, SyntxFieldSelector)?.props.capabilityGate as { reason: string }).reason).toBe(SIL_COPY.en.syntx.entry.line.POOLS_UNREAD);
  });
});

describe("V-06 · the Job Field's NO_ANALYSIS with a selected job", () => {
  const workflow = { pools: { state: "AVAILABLE", jobPools: [summary] }, upload: { state: "IDLE" }, selectedJobPoolUploadId: summary.jobPoolUploadId, view: { state: "AVAILABLE", jobPoolUploadId: summary.jobPoolUploadId, upload: view }, matches: { state: "IDLE" }, submitUpload: async () => undefined, select: () => undefined, reloadPools: async () => undefined, reloadMatches: async () => undefined } as never;
  const at = { kind: "FIELD", organizationId: null, roleId: null, requirementId: null, apertureSignId: null } as const;
  /** The visible text of the whole element with this test id (its nested tags balanced). */
  const text = (html: string, id: string) => {
    const start = html.lastIndexOf("<", html.indexOf(`data-testid="${id}"`));
    if (start < 0 || html.indexOf(`data-testid="${id}"`) < 0) return "";
    const name = /^<(\w+)/.exec(html.slice(start))![1];
    let depth = 0;
    for (const match of html.slice(start).matchAll(new RegExp(`<(/?)${name}\\b[^>]*>`, "g"))) {
      depth += match[1] === "/" ? -1 : match[0].endsWith("/>") ? 0 : 1;
      if (depth === 0) return html.slice(start, start + match.index! + match[0].length).replace(/<[^>]+>/g, " ").replace(/&#x27;/g, "'").replace(/\s+/g, " ").trim();
    }
    return "";
  };

  it("REPRODUCE: it does not ask to select a job that is selected; it names the selected job's role and ANALYZE", () => {
    const html = renderToString(<SyntxField workflow={workflow} analysisSource={{ kind: "NONE" }} observation={at} onObserve={() => undefined} onSelectPool={() => undefined} onExit={() => undefined} jobScope={{ jobPoolUploadId: summary.jobPoolUploadId, poolRoleId: ROLE }} investigation={{ mode: "PERSON_X_JOB", analysisId: null, analysisMode: null, jobId: null, scopeValid: true }} />);
    const state = text(html, "syntx-state");
    expect(state).not.toMatch(/select a role as the job/i);
    expect(state).toMatch(/open the selected job's role to choose an existing investigation.*ANALYZE/);
  });

  it("inverse: without a selected job it still asks for one first", () => {
    const html = renderToString(<SyntxField workflow={workflow} analysisSource={{ kind: "NONE" }} observation={at} onObserve={() => undefined} onSelectPool={() => undefined} onExit={() => undefined} investigation={{ mode: "PERSON_X_JOB", analysisId: null, analysisMode: null, jobId: null, scopeValid: false }} />);
    expect(text(html, "syntx-state")).toMatch(/select a role as the job/i);
  });
});
