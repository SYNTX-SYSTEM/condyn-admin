import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import { ROLE, UPLOAD } from "./fixtures";
import { browser, find, instance, urlProps } from "./harness";

/**
 * V-12 (PINK pre-sweep; GELB decision under §09, owner invariant FOCUS ≠ SELECTION): on 421e382 an arrow key in the mode group
 * chose the mode — one history entry per press — and PERSON / JOB were reachable by Tab only through that. Now: manual activation.
 * The arrow moves only the focus (the Tab stop follows it), Enter / Space choose (a native button's click); radiogroup semantics
 * stay (aria-checked on the chosen mode). Harness: ./harness.ts; the selector is rendered with the props the field gives it.
 */
vi.mock("react", async (importOriginal) => (await import("./harness")).mockReact(await importOriginal<object>()));
vi.mock("../../../lib/career/ui/useCareerAnalysisJob", () => ({ useCareerAnalysisJob: () => ({ state: { state: "IDLE", activeJobId: null, resultAnalysisId: null, canonicalAnalysis: null, currentOperation: null, attemptCount: null, errorCode: null, errorSummary: null, httpStatus: null }, submitAnalysis: async () => undefined, resumeJob: () => undefined }) }));
vi.mock("../../../lib/career/ui/useJobScope", () => ({ useJobScopeValidation: (scope: { jobPoolUploadId: string; poolRoleId: string } | null) => scope === null ? { state: "NONE" } : { state: "VALID", scope, roleTitle: "Distributed Systems Architect", organizationId: "org_pink_alpha", organizationName: "Alpha Industrial Systems", poolName: "PINK pool" } }));
vi.mock("../../../lib/career/ui/useJobPool", async (importOriginal) => ({ ...(await importOriginal<typeof import("../../../lib/career/ui/useJobPool")>()), useJobPoolWorkflow: () => ({ pools: { state: "IDLE" }, upload: { state: "IDLE" }, selectedJobPoolUploadId: null, view: { state: "IDLE" }, matches: { state: "IDLE" }, submitUpload: async () => undefined, select: () => undefined, reloadPools: async () => undefined, reloadMatches: async () => undefined }) }));
vi.mock("../../../lib/career/ui/useRoleInvestigation", async (importOriginal) => ({ ...(await importOriginal<typeof import("../../../lib/career/ui/useRoleInvestigation")>()), useAnalysisBoundary: () => ({ state: "IDLE" }), useSelectedRoleCoverage: () => ({ state: "IDLE" }) }));
vi.mock("../../../lib/career/ui/useAnalysisResult", async (importOriginal) => ({ ...(await importOriginal<typeof import("../../../lib/career/ui/useAnalysisResult")>()), useAnalysisResult: () => ({ state: "IDLE" }) }));

import { SemanticCareerIntelligenceField } from "../../../app/components/career/demo/SemanticCareerIntelligenceField";
import { SyntxInvestigationSelector } from "../../../app/components/career/demo/SyntxInvestigationSelector";
import { EMPTY_CAREER_INTELLIGENCE_DATA } from "../../../app/career/demo/demo-data";

const BASE = "http://127.0.0.1/career/demo";
let tab: ReturnType<typeof browser>;
type Props = Record<string, unknown>;
/** The mode group as the field renders it (its props), drawn on its own; `field` re-draws the field after a choice. */
function group(query: string) {
  tab = browser(`${BASE}?${query}`);
  vi.stubGlobal("window", tab.window);
  vi.stubGlobal("localStorage", { getItem: () => "1", setItem: () => undefined });
  const props = { data: EMPTY_CAREER_INTELLIGENCE_DATA, ...urlProps(tab.url) };
  const field = instance<typeof props>(SemanticCareerIntelligenceField);
  const selector = instance<Props>(SyntxInvestigationSelector);
  const draw = () => selector.render(find(field.settle(props), SyntxInvestigationSelector)!.props) as ReactElement<{ children: ReactElement<Props>[] }>;
  return { draw };
}
const options = (tree: ReactElement) => { const out: Record<string, ReactElement<Props>> = {}; const walk = (node: unknown) => { if (!node || typeof node !== "object") return; if (Array.isArray(node)) { node.forEach(walk); return; } const element = node as ReactElement<Props>; const id = element.props?.["data-testid"]; if (typeof id === "string" && id.startsWith("investigation-mode-") && id !== "investigation-mode-selector") out[id.replace("investigation-mode-", "")] = element; walk(element.props?.children); }; walk(tree); return out; };
const key = (element: ReactElement<Props>, name: string) => (element.props.onKeyDown as (event: { key: string; preventDefault(): void }) => void)({ key: name, preventDefault: () => undefined });
const query = `focus=FIELD&investigationMode=PERSON_X_JOB&jobScopePoolUploadId=${UPLOAD}&jobScopeRoleId=${ROLE}`;

beforeEach(() => { vi.unstubAllGlobals(); });

describe("V-12 · the mode group: the arrow moves the focus, Enter / Space choose", () => {
  it("REPRODUCE: → and ← and Home / End change neither the mode, the URL nor the history", () => {
    const { draw } = group(query);
    let tree = draw();
    key(options(tree).PERSON_X_JOB, "ArrowRight");
    tree = draw();
    key(options(tree).JOB, "Home");
    tree = draw();
    key(options(tree).PERSON, "End");
    tree = draw();
    expect(tab.writes).toEqual([]);
    expect(tab.entries).toHaveLength(1);
    expect(options(tree).PERSON_X_JOB.props["aria-checked"]).toBe(true);
    expect(options(tree).JOB.props["aria-checked"]).toBe(false);
  });

  it("guard: the Tab stop follows the focus — the option the arrow reached is the one Tab returns to (on 421e382 too, there by choosing)", () => {
    const { draw } = group(query);
    let tree = draw();
    expect(options(tree).PERSON_X_JOB.props.tabIndex).toBe(0);
    key(options(tree).PERSON_X_JOB, "ArrowLeft");
    tree = draw();
    expect(options(tree).PERSON.props.tabIndex).toBe(0);
    expect(options(tree).PERSON_X_JOB.props.tabIndex).toBe(-1);
  });

  it("inverse: Enter / Space (the button's click) choose — one push, the mode checked", async () => {
    const { draw } = group(query);
    let tree = draw();
    key(options(tree).PERSON_X_JOB, "ArrowRight");
    tree = draw();
    (options(tree).JOB.props.onClick as () => void)();
    await tab.nextTask();
    tree = draw();
    expect(tab.writes.filter(write => write.how === "push")).toHaveLength(1);
    expect(tab.param("investigationMode")).toBe("JOB");
    expect(options(tree).JOB.props["aria-checked"]).toBe(true);
    expect(options(tree).JOB.props.role).toBe("radio");
  });
});
