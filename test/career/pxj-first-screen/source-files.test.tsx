import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import { ROLE, UPLOAD } from "./fixtures";
import { browser, instance, urlProps } from "./harness";

/**
 * F-G1-MD / V-08 (owner "RECURSIVE UX/UI & SYSTEM CLOSURE" §03; PINK pre-sweep on 421e382): every file from the dock's file input
 * was read as a data URL and staged as `pdf` — a .md ended in ERR_PDF_PARSE_FAILURE, and the banner's RETRY repeated that failure.
 * Now the kind follows extension and MIME: .md / .markdown / .txt are read as text and staged as `text` (the ENTER TEXT path);
 * .pdf stays `pdf`; anything else is refused with a sentence and not staged. A PDF the worker cannot parse offers no RETRY but the
 * way to a readable source. Harness: ./harness.ts; FileReader is a synchronous stand-in recording which read was used.
 */
vi.mock("react", async (importOriginal) => (await import("./harness")).mockReact(await importOriginal<object>()));
const control = vi.hoisted(() => ({ job: {} as Record<string, unknown> }));
vi.mock("../../../lib/career/ui/useCareerAnalysisJob", () => ({ useCareerAnalysisJob: () => ({ state: control.job, submitAnalysis: async () => undefined, resumeJob: () => undefined }) }));
vi.mock("../../../lib/career/ui/useJobScope", () => ({ useJobScopeValidation: (scope: { jobPoolUploadId: string; poolRoleId: string } | null) => scope === null ? { state: "NONE" } : { state: "VALID", scope, roleTitle: "Distributed Systems Architect", organizationId: "org_pink_alpha", organizationName: "Alpha Industrial Systems", poolName: "PINK pool" } }));
vi.mock("../../../lib/career/ui/useJobPool", async (importOriginal) => ({ ...(await importOriginal<typeof import("../../../lib/career/ui/useJobPool")>()), useJobPoolWorkflow: () => ({ pools: { state: "IDLE" }, upload: { state: "IDLE" }, selectedJobPoolUploadId: null, view: { state: "IDLE" }, matches: { state: "IDLE" }, submitUpload: async () => undefined, select: () => undefined, reloadPools: async () => undefined, reloadMatches: async () => undefined }) }));
vi.mock("../../../lib/career/ui/useRoleInvestigation", async (importOriginal) => ({ ...(await importOriginal<typeof import("../../../lib/career/ui/useRoleInvestigation")>()), useAnalysisBoundary: () => ({ state: "IDLE" }), useSelectedRoleCoverage: () => ({ state: "IDLE" }) }));
vi.mock("../../../lib/career/ui/useAnalysisResult", async (importOriginal) => ({ ...(await importOriginal<typeof import("../../../lib/career/ui/useAnalysisResult")>()), useAnalysisResult: () => ({ state: "IDLE" }) }));

import { SourceDock } from "../../../app/components/career/demo/SourceDock";
import { SemanticCareerIntelligenceField } from "../../../app/components/career/demo/SemanticCareerIntelligenceField";
import { EMPTY_CAREER_INTELLIGENCE_DATA } from "../../../app/career/demo/demo-data";

const IDLE_JOB = { state: "IDLE", activeJobId: null, resultAnalysisId: null, canonicalAnalysis: null, currentOperation: null, attemptCount: null, errorCode: null, errorSummary: null, httpStatus: null };
let reads: string[] = [];
class StandInReader {
  onload: ((event: { target: { result: string } }) => void) | null = null;
  readAsText(file: { text: string }) { reads.push("text"); this.onload?.({ target: { result: file.text } }); }
  readAsDataURL(_file: unknown) { reads.push("dataURL"); this.onload?.({ target: { result: "data:application/pdf;base64,JVBERi0xLjQ=" } }); }
}
function findBy(node: unknown, test: (props: Record<string, unknown>) => boolean): ReactElement<Record<string, unknown>> | null {
  if (!node || typeof node !== "object") return null;
  if (Array.isArray(node)) { for (const child of node) { const hit = findBy(child, test); if (hit) return hit; } return null; }
  const element = node as ReactElement<Record<string, unknown>>;
  if (element.props && test(element.props)) return element;
  return findBy(element.props?.children, test);
}
const byId = (tree: unknown, id: string) => findBy(tree, props => props["data-testid"] === id);
/** The dock with one file chosen; returns what ANALYZE would hand over, and the drawn dock. */
function choose(file: { name: string; type: string; text?: string }) {
  const analyzed: unknown[][] = [];
  const dock = instance<Record<string, unknown>>(SourceDock);
  const props = { onAnalyze: (documents: unknown[]) => { analyzed.push(documents); } };
  let tree = dock.render(props);
  (byId(tree, "source-dock-file-input")!.props.onChange as (event: unknown) => void)({ target: { files: [{ text: "", ...file }], value: file.name } });
  tree = dock.render(props);
  const analyze = byId(tree, "start-intake-analysis-btn");
  if (analyze) (analyze.props.onClick as () => void)();
  return { staged: (analyzed[0] ?? []) as Array<{ type: string; title: string; content?: string }>, tree };
}

beforeEach(() => { reads = []; vi.stubGlobal("FileReader", StandInReader); control.job = { ...IDLE_JOB }; });
afterEach(() => { vi.unstubAllGlobals(); });

describe("F-G1-MD · a file's kind decides how it is staged", () => {
  it("REPRODUCE: .md, .markdown and .txt are read as text and staged as text, with their name and content", () => {
    for (const name of ["note.md", "CV.MARKDOWN", "notes.txt"]) {
      reads = [];
      const { staged } = choose({ name, type: name.endsWith(".txt") ? "text/plain" : "", text: "# Distributed Systems\nEdge computing." });
      expect(staged, name).toEqual([expect.objectContaining({ type: "text", title: name, content: "# Distributed Systems\nEdge computing." })]);
      expect(reads, name).toEqual(["text"]);
    }
  });

  it("REPRODUCE: without an extension the MIME type decides (text/markdown → text)", () => {
    expect(choose({ name: "README", type: "text/markdown", text: "plain" }).staged).toEqual([expect.objectContaining({ type: "text", content: "plain" })]);
  });

  it("REPRODUCE: any other file is refused with a sentence and not staged", () => {
    const { staged, tree } = choose({ name: "cv.docx", type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
    expect(staged).toEqual([]);
    expect(reads).toEqual([]);
    expect(byId(tree, "source-dock-file-refused")?.props["data-reason"]).toBe("TYPE");
  });

  it("inverse: a .pdf stays pdf (read as a data URL, base64 content)", () => {
    const { staged } = choose({ name: "cv.pdf", type: "application/pdf" });
    expect(staged).toEqual([expect.objectContaining({ type: "pdf", title: "cv.pdf", content: "JVBERi0xLjQ=" })]);
    expect(reads).toEqual(["dataURL"]);
  });
});

describe("V-08 · a format failure offers no pointless RETRY", () => {
  const field = () => {
    const tab = browser(`http://127.0.0.1/career/demo?focus=CAPABILITY&investigationMode=PERSON_X_JOB&jobScopePoolUploadId=${UPLOAD}&jobScopeRoleId=${ROLE}`);
    vi.stubGlobal("window", tab.window);
    vi.stubGlobal("localStorage", { getItem: () => "1", setItem: () => undefined });
    const props = { data: EMPTY_CAREER_INTELLIGENCE_DATA, ...urlProps(tab.url) };
    return instance<typeof props>(SemanticCareerIntelligenceField).settle(props);
  };

  it("REPRODUCE: ERR_PDF_PARSE_FAILURE — no RETRY; the banner names the way to a readable source", () => {
    control.job = { ...IDLE_JOB, state: "FAILED", activeJobId: "JOB_1792000000071_71", errorCode: "ERR_PDF_PARSE_FAILURE", errorSummary: "Invalid PDF structure", httpStatus: null };
    const tree = field();
    expect(byId(tree, "intake-error-banner")).not.toBeNull();
    expect(byId(tree, "retry-intake-btn")).toBeNull();
    expect(byId(tree, "intake-error-format")).not.toBeNull();
  });

  it("inverse: another worker failure keeps its RETRY", () => {
    control.job = { ...IDLE_JOB, state: "FAILED", activeJobId: "JOB_1792000000072_72", errorCode: "ERR_GEMINI_TIMEOUT", errorSummary: "timeout", httpStatus: null };
    const tree = field();
    expect(byId(tree, "retry-intake-btn")).not.toBeNull();
    expect(byId(tree, "intake-error-format")).toBeNull();
  });
});
