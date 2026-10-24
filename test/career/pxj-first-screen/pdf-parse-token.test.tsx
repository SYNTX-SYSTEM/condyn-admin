import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import { ROLE, UPLOAD } from "./fixtures";
import { browser, instance, urlProps } from "./harness";

/**
 * V-08-R (PINK D-S10-1 on 41dfa25): the running worker fails a broken PDF with errorCode EXECUTION_FAILED and the loader's message
 * as errorSummary ("ERR_PDF_PARSE_FAILURE: Failed to parse PDF buffer. Details: …", lib/career/loaders/pdf.ts, worker.ts); d8d97b8
 * tested only code === "ERR_PDF_PARSE_FAILURE" and still offered RETRY. The code is now also read as an exact token in the summary.
 * Harness: ./harness.ts; the job hook is steered with exactly the worker's shape.
 */
vi.mock("react", async (importOriginal) => (await import("./harness")).mockReact(await importOriginal<object>()));
const control = vi.hoisted(() => ({ job: {} as Record<string, unknown> }));
vi.mock("../../../lib/career/ui/useCareerAnalysisJob", () => ({ useCareerAnalysisJob: () => ({ state: control.job, submitAnalysis: async () => undefined, resumeJob: () => undefined }) }));
vi.mock("../../../lib/career/ui/useJobScope", () => ({ useJobScopeValidation: (scope: { jobPoolUploadId: string; poolRoleId: string } | null) => scope === null ? { state: "NONE" } : { state: "VALID", scope, roleTitle: "Distributed Systems Architect", organizationId: "org_pink_alpha", organizationName: "Alpha Industrial Systems", poolName: "PINK pool" } }));
vi.mock("../../../lib/career/ui/useJobPool", async (importOriginal) => ({ ...(await importOriginal<typeof import("../../../lib/career/ui/useJobPool")>()), useJobPoolWorkflow: () => ({ pools: { state: "IDLE" }, upload: { state: "IDLE" }, selectedJobPoolUploadId: null, view: { state: "IDLE" }, matches: { state: "IDLE" }, submitUpload: async () => undefined, select: () => undefined, reloadPools: async () => undefined, reloadMatches: async () => undefined }) }));
vi.mock("../../../lib/career/ui/useRoleInvestigation", async (importOriginal) => ({ ...(await importOriginal<typeof import("../../../lib/career/ui/useRoleInvestigation")>()), useAnalysisBoundary: () => ({ state: "IDLE" }), useSelectedRoleCoverage: () => ({ state: "IDLE" }) }));
vi.mock("../../../lib/career/ui/useAnalysisResult", async (importOriginal) => ({ ...(await importOriginal<typeof import("../../../lib/career/ui/useAnalysisResult")>()), useAnalysisResult: () => ({ state: "IDLE" }) }));

import { SemanticCareerIntelligenceField } from "../../../app/components/career/demo/SemanticCareerIntelligenceField";
import { EMPTY_CAREER_INTELLIGENCE_DATA } from "../../../app/career/demo/demo-data";

const IDLE_JOB = { state: "IDLE", activeJobId: null, resultAnalysisId: null, canonicalAnalysis: null, currentOperation: null, attemptCount: null, errorCode: null, errorSummary: null, httpStatus: null };
function findBy(node: unknown, test: (props: Record<string, unknown>) => boolean): ReactElement<Record<string, unknown>> | null {
  if (!node || typeof node !== "object") return null;
  if (Array.isArray(node)) { for (const child of node) { const hit = findBy(child, test); if (hit) return hit; } return null; }
  const element = node as ReactElement<Record<string, unknown>>;
  if (element.props && test(element.props)) return element;
  return findBy(element.props?.children, test);
}
const byId = (tree: unknown, id: string) => findBy(tree, props => props["data-testid"] === id);
const failed = (errorCode: string, errorSummary: string) => {
  control.job = { ...IDLE_JOB, state: "FAILED", activeJobId: "JOB_1792000000081_81", errorCode, errorSummary, httpStatus: null };
  const tab = browser(`http://127.0.0.1/career/demo?focus=CAPABILITY&investigationMode=PERSON_X_JOB&jobScopePoolUploadId=${UPLOAD}&jobScopeRoleId=${ROLE}`);
  vi.stubGlobal("window", tab.window);
  vi.stubGlobal("localStorage", { getItem: () => "1", setItem: () => undefined });
  const props = { data: EMPTY_CAREER_INTELLIGENCE_DATA, ...urlProps(tab.url) };
  return instance<typeof props>(SemanticCareerIntelligenceField).settle(props);
};
/** The worker's own shape for a broken PDF (worker.ts: errorCode = error.code || "EXECUTION_FAILED", errorSummary = error.message). */
const WORKER_SUMMARY = "ERR_PDF_PARSE_FAILURE: Failed to parse PDF buffer. Details: Invalid PDF structure.";

beforeEach(() => { control.job = { ...IDLE_JOB }; });
afterEach(() => { vi.unstubAllGlobals(); });

describe("V-08-R · a broken PDF from the running worker offers no RETRY", () => {
  it("REPRODUCE: EXECUTION_FAILED with ERR_PDF_PARSE_FAILURE in its summary — no RETRY, the way to a readable source", () => {
    const tree = failed("EXECUTION_FAILED", WORKER_SUMMARY);
    expect(byId(tree, "intake-error-banner")).not.toBeNull();
    expect(byId(tree, "retry-intake-btn")).toBeNull();
    expect(byId(tree, "intake-error-format")).not.toBeNull();
  });

  it("REPRODUCE: the token stands anywhere in the summary as a word of its own (a wrapped message)", () => {
    const tree = failed("EXECUTION_FAILED", `Document doc_pdf_1 could not be loaded (${WORKER_SUMMARY})`);
    expect(byId(tree, "retry-intake-btn")).toBeNull();
  });

  it("inverse: an exact token only — a longer code, a prefix glued to it, or another failure keep RETRY", () => {
    for (const summary of ["ERR_PDF_PARSE_FAILURES: something else", "XERR_PDF_PARSE_FAILURE: glued", "Gemini timeout after 3 attempts", "err_pdf_parse_failure in lower case"]) {
      const tree = failed("EXECUTION_FAILED", summary);
      expect(byId(tree, "retry-intake-btn"), summary).not.toBeNull();
      expect(byId(tree, "intake-error-format"), summary).toBeNull();
    }
    expect(byId(failed("ERR_GEMINI_TIMEOUT", WORKER_SUMMARY), "retry-intake-btn")).not.toBeNull();
  });
});
