import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { matches, summary, UPLOAD_ID, view } from "../job-pool/fixtures/match-bodies";
import { JOB_SCOPE_REQUIRED_MESSAGE, type JobScopeValidation } from "../../../lib/career/job-pool/job-scope";
import { coverage, structure } from "./fixtures";

/** Three investigation modes, server-rendered (owner GO "DEMO FRONTEND", 2026-10-15). */
const control = vi.hoisted(() => ({
  job: { state: "IDLE", activeJobId: null, resultAnalysisId: null, canonicalAnalysis: null, currentOperation: null, attemptCount: null, errorCode: null, errorSummary: null, httpStatus: null } as Record<string, unknown>,
  scope: { state: "NONE" } as JobScopeValidation,
  workflowAnalysis: [] as Array<string | null>,
  boundary: { state: "RESOLVING" } as Record<string, unknown>
}));
vi.mock("../../../lib/career/ui/useCareerAnalysisJob", () => ({ useCareerAnalysisJob: () => ({ state: control.job, submitAnalysis: async () => undefined }) }));
vi.mock("../../../lib/career/ui/useJobScope", () => ({ useJobScopeValidation: () => control.scope }));
const idle = (selected: string | null) => ({ pools: { state: "IDLE" }, upload: { state: "IDLE" }, selectedJobPoolUploadId: selected, view: { state: "IDLE" }, matches: { state: "IDLE" }, submitUpload: async () => undefined, select: () => undefined, reloadPools: async () => undefined, reloadMatches: async () => undefined });
const withMatches = () => ({ ...idle(UPLOAD_ID), pools: { state: "AVAILABLE", jobPools: [summary] }, view: { state: "AVAILABLE", jobPoolUploadId: UPLOAD_ID, upload: view }, matches: { state: "AVAILABLE", jobPoolUploadId: UPLOAD_ID, analysisId: "ANL_TEST", matches } });
vi.mock("../../../lib/career/ui/useJobPool", async (importOriginal) => {
  const original = await importOriginal<typeof import("../../../lib/career/ui/useJobPool")>();
  return { ...original, useJobPoolWorkflow: (options: { analysisId: string | null; initialJobPoolUploadId?: string | null }) => { control.workflowAnalysis.push(options.analysisId); return options.initialJobPoolUploadId === "JPOOL_WITH_MATCHES" && options.analysisId !== null ? withMatches() : options.initialJobPoolUploadId === "JPOOL_WITH_MATCHES" ? { ...withMatches(), matches: { state: "IDLE" } } : idle(options.initialJobPoolUploadId ?? null); } };
});
vi.mock("../../../lib/career/ui/useJobPoolSources", () => ({ useAnalysisSources: () => ({ state: "IDLE" }) }));
vi.mock("../../../lib/career/ui/useRoleInvestigation", async (importOriginal) => ({ ...(await importOriginal<typeof import("../../../lib/career/ui/useRoleInvestigation")>()), useAnalysisBoundary: (analysisId: string | null) => analysisId === null ? { state: "IDLE" } : control.boundary }));

import { SemanticCareerIntelligenceField } from "../../../app/components/career/demo/SemanticCareerIntelligenceField";
import { SyntxInvestigationSelector } from "../../../app/components/career/demo/SyntxInvestigationSelector";
import { CoverageBody, GeminiOutputBody, StructureBody, SYNTX_CSS, SyntxField } from "../../../app/components/career/demo/SyntxField";
import { SourceDock } from "../../../app/components/career/demo/SourceDock";
import { EMPTY_CAREER_INTELLIGENCE_DATA } from "../../../app/career/demo/demo-data";
import { SIL_COPY } from "../../../lib/career/view-model/sil-language";

const VALID: JobScopeValidation = { state: "VALID", scope: { jobPoolUploadId: "JPOOL_B94850C439974E27496FE3B1A9A076B5", poolRoleId: "ROLE_A" }, roleTitle: "Platform Engineer", organizationId: "ORG_1", organizationName: "Acme", poolName: "Sample Pool" };
const tag = (html: string, testId: string): string => { const at = html.indexOf(`data-testid="${testId}"`); return at < 0 ? "" : html.slice(html.lastIndexOf("<", at), html.indexOf(">", at) + 1); };
const field = (props: Record<string, unknown> = {}) => renderToString(<SemanticCareerIntelligenceField data={EMPTY_CAREER_INTELLIGENCE_DATA} {...props} />);
const en = SIL_COPY.en.syntx;

beforeEach(() => {
  control.job = { state: "IDLE", activeJobId: null, resultAnalysisId: null, canonicalAnalysis: null, currentOperation: null, attemptCount: null, errorCode: null, errorSummary: null, httpStatus: null };
  control.scope = { state: "NONE" };
  control.workflowAnalysis = [];
  control.boundary = { state: "RESOLVED", value: { investigationVersion: "ANALYSIS_INVESTIGATION_V1", analysisId: "ANL_TEST", jobId: "JOB_TEST", mode: "PERSON_X_JOB", jobScopeSelection: { jobPoolUploadId: UPLOAD_ID, poolRoleId: "ROLE_A" }, basis: "JOB_DECLARATION", discoveryRunId: null, investigationScopeHash: null } };
});

describe("the investigation boundary at the shell", () => {
  it("three equal options as one radio group; exactly the chosen one checked; static (no animation)", () => {
    const html = renderToString(<SyntxInvestigationSelector mode="PERSON" copy={en.investigation} onSelect={() => undefined} />);
    expect(tag(html, "investigation-mode-selector")).toContain('role="radiogroup"');
    expect(html.match(/role="radio"/g)).toHaveLength(3);
    expect(tag(html, "investigation-mode-PERSON")).toContain('aria-checked="true"');
    expect(tag(html, "investigation-mode-PERSON_X_JOB")).toContain('aria-checked="false"');
    expect(tag(html, "investigation-mode-JOB")).toContain('aria-checked="false"');
    expect(html).toContain("PERSON × JOB");
    expect(html.replace(/<style>[\s\S]*?<\/style>/g, "")).not.toMatch(/animation:/i);
  });

  it("without a choice: PERSON × JOB in both fields; the earlier gate and sentence unchanged", () => {
    for (const fieldFocus of ["CAPABILITY", "FIELD"] as const) {
      const html = field({ fieldFocus });
      expect(tag(html, "investigation-mode-selector")).toContain('data-investigation-mode="PERSON_X_JOB"');
      expect(tag(html, "semantic-career-intelligence-field")).toContain('data-capability-gate="AWAITING_JOB"');
    }
    const dock = renderToString(<SourceDock initialStagedDocs={[{ id: "d", title: "cv", type: "text", content: "x" } as never]} analyzeBlockedMessage={JOB_SCOPE_REQUIRED_MESSAGE} investigation={{ mode: "PERSON_X_JOB", label: "INVESTIGATION BOUNDARY · PERSON × JOB", hint: "h" }} />);
    expect(dock).toContain(JOB_SCOPE_REQUIRED_MESSAGE);
    expect(tag(dock, "analyze-investigation")).toContain('data-investigation-mode="PERSON_X_JOB"');
  });

  it("PERSON: Capability open without any job; the shell says NO JOB SCOPE · PERSON and keeps a selected job as unused", () => {
    const none = field({ investigationMode: "PERSON", fieldFocus: "CAPABILITY" });
    expect(tag(none, "semantic-career-intelligence-field")).toContain('data-capability-gate="OPEN"');
    expect(tag(none, "semantic-career-intelligence-field")).toContain('data-field-focus="CAPABILITY"');
    expect(tag(none, "job-scope-indicator")).toContain('data-job-scope-used="false"');
    expect(none).toContain(en.investigation.personScope);
    control.scope = VALID;
    const kept = field({ investigationMode: "PERSON" });
    expect(tag(kept, "job-scope-indicator")).toContain('data-job-scope-state="VALID"');
    expect(kept).toContain(`${en.investigation.personScopeKept}Platform Engineer`);
  });

  it("JOB: Capability closed even with a VALID job (JOB_MODE) and named why; ANALYZE would be refused", () => {
    control.scope = VALID;
    const html = field({ investigationMode: "JOB", fieldFocus: "CAPABILITY" });
    expect(tag(html, "semantic-career-intelligence-field")).toContain('data-capability-gate="JOB_MODE"');
    expect(tag(html, "semantic-career-intelligence-field")).toContain('data-field-focus="FIELD"');
    expect(tag(html, "field-focus-capability-btn")).toContain(`title="${en.investigation.capabilityGatedJob}"`);
  });

  it.each([
    ["RESOLVING", { state: "RESOLVING" }, "RESOLVING", SIL_COPY.en.syntx.investigation.withheld.RESOLVING],
    ["a PERSON analysis", { state: "RESOLVED", value: { investigationVersion: "ANALYSIS_INVESTIGATION_V1", analysisId: "ANL_TEST", jobId: "JOB_TEST", mode: "PERSON", jobScopeSelection: null, basis: "JOB_DECLARATION", discoveryRunId: null, investigationScopeHash: null } }, "PERSON", SIL_COPY.en.syntx.investigation.withheld.PERSON],
    ["UNRESOLVED (no job recorded)", { state: "UNRESOLVED", reason: "NOT_RECORDED" }, "UNRESOLVED", SIL_COPY.en.syntx.investigation.withheld.UNRESOLVED],
    ["NOT_FOUND", { state: "NOT_FOUND" }, "UNRESOLVED", SIL_COPY.en.syntx.investigation.withheld.UNRESOLVED],
    ["FAILED", { state: "FAILED" }, "UNRESOLVED", SIL_COPY.en.syntx.investigation.withheld.UNRESOLVED]
  ])("URL BOUNDARY CLOSURE — an analysis from the URL whose boundary is %s is not compared in PERSON × JOB, and says why", (_label, boundary, state, sentence) => {
    control.boundary = boundary;
    const html = field({ fieldFocus: "FIELD", jobPoolUploadId: "JPOOL_WITH_MATCHES", analysisId: "ANL_TEST" });
    expect(control.workflowAnalysis.at(-1)).toBeNull();
    expect(tag(html, "syntx-field")).toContain(`data-analysis-boundary="${state}"`);
    expect(tag(html, "syntx-analysis-boundary")).toContain(`data-boundary-state="${state}"`);
    expect(html).toContain(sentence);
    expect(html).not.toContain('data-testid="syntx-no-analysis"');
  });

  it("URL BOUNDARY CLOSURE — a PERSON × JOB analysis on view in another pool (or pool version) is not compared; its own pool is offered explicitly", () => {
    control.boundary = { state: "RESOLVED", value: { investigationVersion: "ANALYSIS_INVESTIGATION_V1", analysisId: "ANL_TEST", jobId: "JOB_TEST", mode: "PERSON_X_JOB", jobScopeSelection: { jobPoolUploadId: "JPOOL_B94850C439974E27496FE3B1A9A076B5", poolRoleId: "ROLE_A" }, basis: "JOB_DECLARATION", discoveryRunId: null, investigationScopeHash: null } };
    const html = field({ fieldFocus: "FIELD", jobPoolUploadId: "JPOOL_WITH_MATCHES", analysisId: "ANL_TEST" });
    expect(tag(html, "syntx-analysis-boundary")).toContain('data-boundary-state="OTHER_POOL"');
    expect(tag(html, "syntx-analysis-boundary")).toContain('data-analysis-pool="JPOOL_B94850C439974E27496FE3B1A9A076B5"');
    expect(html).toContain('data-testid="syntx-analysis-pool-open"');
    expect(tag(html, "syntx-field")).toContain('data-matching-delivered="false"');
  });

  it("URL BOUNDARY CLOSURE — a resolved PERSON × JOB analysis keeps its comparison (existing links unchanged)", () => {
    const html = field({ fieldFocus: "FIELD", jobPoolUploadId: "JPOOL_WITH_MATCHES", analysisId: "ANL_TEST" });
    expect(control.workflowAnalysis.at(-1)).toBe("ANL_TEST");
    expect(tag(html, "syntx-field")).toContain('data-analysis-boundary="PERSON_X_JOB"');
    expect(html).not.toContain('data-testid="syntx-analysis-boundary"');
  });

  it("an unknown mode in the URL is no choice (ground state)", () => {
    expect(tag(field({ investigationMode: "person" }), "investigation-mode-selector")).toContain('data-investigation-mode="PERSON_X_JOB"');
  });

  it("the Job Field compares the analysis with the pool only in PERSON × JOB", () => {
    control.scope = VALID;
    field({ fieldFocus: "FIELD", jobPoolUploadId: "JPOOL_WITH_MATCHES", analysisId: "ANL_TEST" });
    expect(control.workflowAnalysis.at(-1)).toBe("ANL_TEST");
    for (const mode of ["PERSON", "JOB"]) {
      const html = field({ fieldFocus: "FIELD", jobPoolUploadId: "JPOOL_WITH_MATCHES", analysisId: "ANL_TEST", investigationMode: mode });
      expect(control.workflowAnalysis.at(-1)).toBeNull();
      expect(tag(html, "syntx-field")).toContain(`data-investigation-mode="${mode}"`);
      expect(tag(html, "syntx-investigation-statement")).toContain(`data-investigation-mode="${mode}"`);
    }
  });
});

describe("the investigation bodies (server-rendered)", () => {
  const t = SIL_COPY.en.syntx;
  it("B2: requirements in pool order, covered with verbatim evidence, the heuristic as weak, not covered without judgement, fixed authority", () => {
    const html = renderToString(<CoverageBody open mode="REDUCED" t={t} read={{ state: "AVAILABLE", coverage: coverage() }} hasAnalysis />);
    expect(tag(html, "syntx-coverage")).toContain('data-coverage-state="AVAILABLE"');
    expect(tag(html, "syntx-coverage")).toContain('data-scored="false"');
    expect(tag(html, "syntx-coverage")).toContain('data-relation-state="NOT_EVALUATED"');
    expect([...html.matchAll(/data-testid="syntx-coverage-req-([^"]+)"/g)].map(m => m[1])).toEqual(["req_pink_alpha_1", "req_pink_alpha_2", "req_pink_alpha_3"]);
    expect(tag(html, "syntx-coverage-req-req_pink_alpha_2")).toContain('data-match-basis="TOKEN_CONTAINMENT"');
    expect(html).toContain(t.coverage.weak);
    expect(html).toContain("Architected distributed IIoT Edge Computing systems with 99.999% uptime guarantees.");
    expect(html).toContain(t.coverage.notCoveredStatement);
    expect(html).toContain(t.coverage.coversNothing);
    expect(html).toContain(t.coverage.countsStatement);
    expect(html).not.toMatch(/resonanceScore|deliveredRank|%<\/span>/);
  });

  it.each(["NOT_SCOPED", "SCOPE_MISMATCH", "SCOPE_DRIFT", "SCOPE_UNAVAILABLE", "LINEAGE_INVALID", "NOT_FOUND", "NOT_PROVISIONED", "LOADING"] as const)("B2 %s: the state sentence and no requirement", (state) => {
    const html = renderToString(<CoverageBody open mode="REDUCED" t={t} read={{ state } as never} hasAnalysis />);
    expect(html).toContain(t.coverage.states[state]);
    expect(html).not.toContain("syntx-coverage-req-");
  });

  it("B2 without an analysis says so; SCOPE_MISMATCH carries GELB's sentence in German", () => {
    expect(renderToString(<CoverageBody open mode="REDUCED" t={t} read={{ state: "IDLE" }} hasAnalysis={false} />)).toContain(t.coverage.states.NO_ANALYSIS);
    expect(SIL_COPY.de.syntx.coverage.states.SCOPE_MISMATCH).toBe("Analyse gehört zu einem anderen Job");
  });

  it("JOB structure: the declaration in pool order with its source lines, findings as facts, responsibility NOT DECLARED, no person", () => {
    const html = renderToString(<StructureBody open mode="REDUCED" t={t} read={{ state: "AVAILABLE", structure: structure() }} />);
    expect(tag(html, "syntx-job-structure")).toContain('data-investigation-mode="JOB"');
    expect([...html.matchAll(/data-testid="syntx-structure-req-([^"]+)"/g)].map(m => m[1])).toEqual(["req_pink_alpha_1", "req_pink_alpha_3"]);
    expect(html).toContain("REQUIREMENT req_pink_alpha_1 NECESSITY: REQUIRED");
    expect(tag(html, "syntx-job-structure-responsibility")).not.toBe("");
    expect(html).toContain(t.structure.findingCodes.REQUIREMENT_NECESSITY_UNDECLARED);
    expect(html).toContain(t.structure.findingsStatement);
    expect(html).not.toMatch(/ANL_|candidate|DOC_00/);
  });

  it("JOB structure without a job shows the owner's job sentence (the constant, not a copy)", () => {
    expect(renderToString(<StructureBody open mode="REDUCED" t={t} read={{ state: "IDLE" }} />)).toContain(JOB_SCOPE_REQUIRED_MESSAGE);
  });

  it("GEMINI OUTPUT: a password field and nothing read; JOB says no Gemini call; no analysis says so", () => {
    const base = { mode: "PERSON_X_JOB" as const, analysisId: "ANL_X", analysisMode: null, jobId: null, scopeValid: true };
    const html = renderToString(<GeminiOutputBody mode="REDUCED" t={t} investigation={base} />);
    expect(tag(html, "syntx-gemini-output")).toContain('data-inspection-state="IDLE"');
    expect(tag(html, "syntx-gemini-token")).toContain('type="password"');
    expect(tag(html, "syntx-gemini-token")).toMatch(/autocomplete="off"/i);
    expect(renderToString(<GeminiOutputBody mode="REDUCED" t={t} investigation={{ ...base, mode: "JOB" }} />)).toContain(t.gemini.noGemini);
    expect(renderToString(<GeminiOutputBody mode="REDUCED" t={t} investigation={{ ...base, analysisId: null }} />)).toContain(t.gemini.noAnalysis);
  });

  it("GEMINI OUTPUT appears beside BOUNDARY only when enabled (engineering builds)", () => {
    const props = { workflow: withMatches() as never, analysisSource: { kind: "URL", analysisId: "ANL_TEST" } as const, observation: { kind: "FIELD", organizationId: null, roleId: null, requirementId: null, apertureSignId: null } as const, onObserve: () => undefined, onSelectPool: () => undefined, onExit: () => undefined };
    expect(renderToString(<SyntxField {...props} geminiOutputEnabled />)).toContain('data-testid="syntx-gemini-output-toggle"');
    expect(renderToString(<SyntxField {...props} geminiOutputEnabled={false} />)).not.toContain('data-testid="syntx-gemini-output-toggle"');
  });
});

/** DEMO UI FIX + SEMIONTIC REFINEMENT (owner, 2026-10-15): the NO ANALYSIS state line as a signal; the edge layout. */
describe("Job Field: NO ANALYSIS signal and edge layout", () => {
  const t = SIL_COPY.en.syntx;
  const at = { kind: "FIELD", organizationId: null, roleId: null, requirementId: null, apertureSignId: null } as const;
  const props = { observation: at, onObserve: () => undefined, onSelectPool: () => undefined, onExit: () => undefined };
  const noAnalysis = { ...withMatches(), matches: { state: "IDLE" } } as never;
  /** The whole element of a test id (its nested spans balanced), as server-rendered. */
  const element = (html: string, testId: string): string => {
    const start = html.lastIndexOf("<", html.indexOf(`data-testid="${testId}"`));
    const name = /^<(\w+)/.exec(html.slice(start))![1];
    let depth = 0;
    for (const match of html.slice(start).matchAll(new RegExp(`<(/?)${name}\\b[^>]*>`, "g"))) {
      depth += match[1] === "/" ? -1 : match[0].endsWith("/>") ? 0 : 1;
      if (depth === 0) return html.slice(start, start + match.index! + match[0].length);
    }
    return "";
  };
  const text = (fragment: string): string => fragment.replace(/<[^>]+>/g, "").replace(/&#x27;/g, "'").replace(/&amp;/g, "&");

  it("PERSON × JOB with a pool and no analysis: the state line is the signal, one message, unchanged copy", () => {
    const chip = element(renderToString(<SyntxField {...props} workflow={noAnalysis} analysisSource={{ kind: "NONE" }} />), "syntx-state");
    expect(chip).toContain('data-state="NO_ANALYSIS"');
    expect(chip).toContain('data-sx-signal="awaiting-analysis"');
    expect(text(chip)).toBe(SIL_COPY.en.jobPool.analysisNone);
    expect(chip).toMatch(/data-sx-signal-aura="true" aria-hidden="true"/);
    expect(chip).toMatch(/aria-hidden="true"[^>]*><span data-sx-signal-core="true"/);
    expect(chip).toContain("font-size:12.5px");
    // The field's own statement of the same state: the same voices, legible, still (no signal of its own).
    const statement = element(renderToString(<SyntxField {...props} workflow={noAnalysis} analysisSource={{ kind: "NONE" }} />), "syntx-no-analysis");
    expect(text(statement)).toBe(SIL_COPY.en.jobPool.analysisNone);
    expect(statement).toContain("font-size:12.5px");
    expect(statement).not.toContain("data-sx-signal");
    expect(text(element(renderToString(<SyntxField {...props} workflow={noAnalysis} analysisSource={{ kind: "NONE" }} locale="de" />), "syntx-state"))).toBe(SIL_COPY.de.jobPool.analysisNone);
  });

  it("the signal is NO ANALYSIS's only: PERSON, a withheld comparison and an available comparison keep the state line as it was", () => {
    const person = renderToString(<SyntxField {...props} workflow={noAnalysis} analysisSource={{ kind: "NONE" }} investigation={{ mode: "PERSON", analysisId: null, analysisMode: null, jobId: null, scopeValid: false }} />);
    const withheld = renderToString(<SyntxField {...props} workflow={noAnalysis} analysisSource={{ kind: "NONE" }} investigation={{ mode: "PERSON_X_JOB", analysisId: "ANL_TEST", analysisMode: null, jobId: null, scopeValid: true, comparisonWithheld: "PERSON" }} />);
    const available = renderToString(<SyntxField {...props} workflow={withMatches() as never} analysisSource={{ kind: "URL", analysisId: "ANL_TEST" }} />);
    for (const html of [person, withheld, available]) expect(tag(html, "syntx-state")).not.toContain("data-sx-signal");
    expect(text(element(withheld, "syntx-state"))).toBe(t.investigation.withheld.PERSON);
  });

  it("the motion: opacity and transform only, LIVE only, 4.8 s; reduced motion stops every animation of the field", () => {
    const frames = [...SYNTX_CSS.matchAll(/@keyframes (sxSignal\w+) \{(.*)\}\n/g)];
    expect(frames.map(frame => frame[1])).toEqual(["sxSignalCore", "sxSignalAura"]);
    for (const [, , body] of frames) for (const property of body.matchAll(/([a-z-]+):/g)) expect(["opacity", "transform", "animation-timing-function"]).toContain(property[1]);
    const rules = SYNTX_CSS.split("\n").filter(line => /animation: sxSignal/.test(line));
    expect(rules).toHaveLength(2);
    for (const rule of rules) expect(rule).toMatch(/^\[data-testid="syntx-field"\]\[data-motion-mode="LIVE"\] \[data-sx-signal="awaiting-analysis"\] \[data-sx-signal-(core|aura)\] \{ animation: sxSignal\w+ 4\.8s/);
    expect(SYNTX_CSS).toMatch(/@media \(prefers-reduced-motion: reduce\) \{\s*\[data-testid="syntx-field"\], \[data-testid="syntx-field"\] \* \{ animation: none !important;/);
  });

  it("edge layout before measuring: the pool list keeps its place; the orientation surface lies above the bodies", () => {
    const html = renderToString(<SyntxField {...props} workflow={noAnalysis} analysisSource={{ kind: "NONE" }} geminiOutputEnabled />);
    expect(tag(html, "job-pool-list")).toContain("top:300px");
    expect(tag(html, "job-pool-list")).toContain("max-height:max(160px, calc(100vh - 420px))");
    expect(html).toMatch(/data-sx-surface="header"[^>]*z-index:47/);
  });
});
