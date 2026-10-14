import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { matches, summary, UPLOAD_ID, view } from "./fixtures/match-bodies";
import { JOB_SCOPE_REQUIRED_MESSAGE } from "../../../lib/career/job-pool/job-scope";
import type { JobScopeValidation } from "../../../lib/career/job-pool/job-scope";

/** SFE job-scope invariant, frontend: the selected job (or its absence) at the shell in both fields, ANALYZE blocked without it, the backend's codes shown as delivered. */
const control = vi.hoisted(() => ({
  job: { state: "IDLE", resultAnalysisId: null, canonicalAnalysis: null, currentOperation: null, attemptCount: null, errorCode: null, errorSummary: null, httpStatus: null } as Record<string, unknown>,
  scope: { state: "NONE" } as JobScopeValidation
}));
vi.mock("../../../lib/career/ui/useCareerAnalysisJob", () => ({ useCareerAnalysisJob: () => ({ state: control.job, submitAnalysis: async () => undefined }) }));
vi.mock("../../../lib/career/ui/useJobScope", () => ({ useJobScopeValidation: () => control.scope }));
const idle = (selected: string | null) => ({ pools: { state: "IDLE" }, upload: { state: "IDLE" }, selectedJobPoolUploadId: selected, view: { state: "IDLE" }, matches: { state: "IDLE" }, submitUpload: async () => undefined, select: () => undefined, reloadPools: async () => undefined, reloadMatches: async () => undefined });
const withMatches = () => ({ ...idle(UPLOAD_ID), pools: { state: "AVAILABLE", jobPools: [summary] }, view: { state: "AVAILABLE", jobPoolUploadId: UPLOAD_ID, upload: view }, matches: { state: "AVAILABLE", jobPoolUploadId: UPLOAD_ID, analysisId: "ANL_TEST", matches } });
vi.mock("../../../lib/career/ui/useJobPool", async (importOriginal) => {
  const original = await importOriginal<typeof import("../../../lib/career/ui/useJobPool")>();
  return { ...original, useJobPoolWorkflow: (options: { initialJobPoolUploadId?: string | null }) => options.initialJobPoolUploadId === "JPOOL_WITH_MATCHES" ? withMatches() : idle(options.initialJobPoolUploadId ?? null) };
});
vi.mock("../../../lib/career/ui/useJobPoolSources", () => ({ useAnalysisSources: () => ({ state: "IDLE" }) }));

import { SemanticCareerIntelligenceField } from "../../../app/components/career/demo/SemanticCareerIntelligenceField";
import { SourceDock } from "../../../app/components/career/demo/SourceDock";
import { SyntxField } from "../../../app/components/career/demo/SyntxField";
import { EMPTY_CAREER_INTELLIGENCE_DATA } from "../../../app/career/demo/demo-data";
import { FIELD_OBSERVATION } from "../../../lib/career/job-pool/syntx-field-view-model";

const SCOPE_ID = "JPOOL_B94850C439974E27496FE3B1A9A076B5";
const VALID: JobScopeValidation = { state: "VALID", scope: { jobPoolUploadId: SCOPE_ID, poolRoleId: "ROLE_A" }, roleTitle: "Platform Engineer", organizationId: "ORG_1", organizationName: "Acme", poolName: "Sample Pool" };
const STAGED = [{ id: "doc-1", title: "cv.synthetic.pdf", type: "pdf" as const, content: "fixture" }];
const indicator = (html: string): string => { const start = html.indexOf('data-testid="job-scope-indicator"'); return html.slice(html.lastIndexOf("<button", start), html.indexOf("</button>", start)); };
/** The strip element itself (div depth matched), not a CSS selector that names it. */
const strip = (html: string): string => {
  const start = html.indexOf('<div data-testid="field-focus-strip"');
  const tags = /<\/?div\b/g;
  tags.lastIndex = start;
  let depth = 0;
  for (let match = tags.exec(html); match !== null; match = tags.exec(html)) {
    depth += match[0] === "<div" ? 1 : -1;
    if (depth === 0) return html.slice(start, match.index).replace(/<style>[\s\S]*?<\/style>/g, "");
  }
  return html.slice(start);
};

beforeEach(() => {
  control.job = { state: "IDLE", resultAnalysisId: null, canonicalAnalysis: null, currentOperation: null, attemptCount: null, errorCode: null, errorSummary: null, httpStatus: null };
  control.scope = { state: "NONE" };
});

describe("job scope at the application shell (server-rendered)", () => {
  it("shows that no job is selected, in both fields, as a shell element outside the two-button strip", () => {
    for (const fieldFocus of ["CAPABILITY", "FIELD"] as const) {
      const html = renderToString(<SemanticCareerIntelligenceField data={EMPTY_CAREER_INTELLIGENCE_DATA} fieldFocus={fieldFocus} />);
      const chip = indicator(html);
      expect(chip).toContain('data-sx-shell="job-scope"');
      expect(chip).toContain('data-job-scope-state="NONE"');
      expect(chip).toContain("NO JOB SELECTED");
      expect(strip(html)).not.toContain("job-scope-indicator");
      expect(strip(html).match(/<button/g)).toHaveLength(2);
    }
    const de = renderToString(<SemanticCareerIntelligenceField data={EMPTY_CAREER_INTELLIGENCE_DATA} initialLocale="de" />);
    expect(indicator(de)).toContain("KEIN JOB GEWÄHLT");
  });

  it("names the selected job (role, organization, pool) in both fields and at every depth of the Job Field", () => {
    control.scope = VALID;
    const views = [
      renderToString(<SemanticCareerIntelligenceField data={EMPTY_CAREER_INTELLIGENCE_DATA} />),
      renderToString(<SemanticCareerIntelligenceField data={EMPTY_CAREER_INTELLIGENCE_DATA} initialFocus={{ stageId: "02", zoomLevel: 1 }} />),
      renderToString(<SemanticCareerIntelligenceField data={EMPTY_CAREER_INTELLIGENCE_DATA} fieldFocus="FIELD" jobPoolUploadId="JPOOL_WITH_MATCHES" analysisId="ANL_TEST" />),
      renderToString(<SemanticCareerIntelligenceField data={EMPTY_CAREER_INTELLIGENCE_DATA} fieldFocus="FIELD" jobPoolUploadId="JPOOL_WITH_MATCHES" analysisId="ANL_TEST" jobRoleId="ROLE_B" />),
      renderToString(<SemanticCareerIntelligenceField data={EMPTY_CAREER_INTELLIGENCE_DATA} fieldFocus="FIELD" jobPoolUploadId="JPOOL_WITH_MATCHES" analysisId="ANL_TEST" jobRoleId="ROLE_A" jobRequirementId="REQ_1" />)
    ];
    for (const html of views) {
      const chip = indicator(html);
      expect(chip).toContain('data-job-scope-state="VALID"');
      expect(chip).toContain("Platform Engineer");
      expect(chip).toContain("Acme · Sample Pool");
    }
  });

  it("marks a scope being checked or not valid as such (both block ANALYZE)", () => {
    control.scope = { state: "CHECKING", scope: VALID.scope };
    expect(indicator(renderToString(<SemanticCareerIntelligenceField data={EMPTY_CAREER_INTELLIGENCE_DATA} />))).toContain("CHECKING THE JOB");
    control.scope = { state: "INVALID", scope: VALID.scope, reason: "POOL_NOT_ACTIVE" };
    const chip = indicator(renderToString(<SemanticCareerIntelligenceField data={EMPTY_CAREER_INTELLIGENCE_DATA} initialLocale="de" />));
    expect(chip).toContain('data-job-scope-state="INVALID"');
    expect(chip).toContain("JOB UNGÜLTIG");
  });
});

describe("ANALYZE without a valid job scope (server-rendered)", () => {
  it("keeps the trigger disabled and shows the owner's sentence verbatim, in every locale", () => {
    for (const locale of ["en", "de"] as const) {
      const html = renderToString(<SourceDock initialStagedDocs={STAGED} locale={locale} onAnalyze={() => undefined} analyzeBlockedMessage={JOB_SCOPE_REQUIRED_MESSAGE} />);
      expect(html).toContain('data-testid="analyze-job-scope-required"');
      expect(html).toContain("Bitte wählen Sie einen Job aus.");
      expect(html).toMatch(/<button[^>]*disabled=""[^>]*data-job-scope-blocked="true"[^>]*data-testid="start-intake-analysis-btn"/);
    }
  });

  it("admits the trigger with a valid scope", () => {
    const html = renderToString(<SourceDock initialStagedDocs={STAGED} onAnalyze={() => undefined} analyzeBlockedMessage={null} />);
    expect(html).not.toContain("analyze-job-scope-required");
    expect(html).toMatch(/<button[^>]*data-job-scope-blocked="false"[^>]*data-testid="start-intake-analysis-btn"/);
    expect(html).not.toMatch(/<button[^>]*disabled=""[^>]*data-testid="start-intake-analysis-btn"/);
  });
});

describe("backend failure codes in the intake banner (finding 2)", () => {
  const banner = (html: string): string => { const start = html.indexOf('data-testid="intake-error-banner"'); return html.slice(start, html.indexOf('data-testid="retry-intake-btn"', start) + 400); };

  it.each([
    [400, "ERR_JOB_SCOPE_REQUIRED"],
    [422, "ERR_JOB_SCOPE_INVALID"]
  ])("a %i job-scope rejection shows its own title, the code, the owner's sentence and the HTTP status", (status, code) => {
    control.job = { ...control.job, state: "FAILED", errorCode: code, errorSummary: JOB_SCOPE_REQUIRED_MESSAGE, httpStatus: status };
    const html = banner(renderToString(<SemanticCareerIntelligenceField data={EMPTY_CAREER_INTELLIGENCE_DATA} />));
    expect(html).toContain(`data-error-code="${code}"`);
    expect(html).toContain(`data-http-status="${status}"`);
    expect(html).toContain("NO VALID JOB SCOPE");
    expect(html).toContain(`[<!-- -->${code}<!-- -->]`);
    expect(html).toContain("Bitte wählen Sie einen Job aus.");
    expect(html).toContain(`HTTP <!-- -->${status}`);
    expect(html).not.toContain("SEMANTIC BOUNDARY VIOLATION");
  });

  it("a non-scope 422 is the semantic boundary again (the numeric status is compared, not the code string)", () => {
    control.job = { ...control.job, state: "FAILED", errorCode: "ERR_SEMANTIC_CONTRACT", errorSummary: "Rejected", httpStatus: 422 };
    const html = banner(renderToString(<SemanticCareerIntelligenceField data={EMPTY_CAREER_INTELLIGENCE_DATA} />));
    expect(html).toContain("SEMANTIC BOUNDARY VIOLATION");
    expect(html).toContain("[<!-- -->ERR_SEMANTIC_CONTRACT<!-- -->]");
  });

  it("a worker failure has no HTTP status; retry stays blocked with the owner's sentence until a job is selected", () => {
    control.job = { ...control.job, state: "FAILED", errorCode: "ERR_JOB_SCOPE_INVALID", errorSummary: JOB_SCOPE_REQUIRED_MESSAGE, httpStatus: null };
    const blocked = banner(renderToString(<SemanticCareerIntelligenceField data={EMPTY_CAREER_INTELLIGENCE_DATA} />));
    expect(blocked).toContain('data-http-status=""');
    expect(blocked).not.toContain("HTTP <!-- -->");
    expect(blocked).toContain('data-testid="retry-job-scope-required"');
    expect(blocked).toMatch(/data-testid="retry-intake-btn" disabled=""/);
    control.scope = VALID;
    const admitted = banner(renderToString(<SemanticCareerIntelligenceField data={EMPTY_CAREER_INTELLIGENCE_DATA} />));
    expect(admitted).not.toContain("retry-job-scope-required");
    expect(admitted).not.toMatch(/data-testid="retry-intake-btn" disabled=""/);
  });
});

describe("explicit job selection in the Job Field (server-rendered)", () => {
  const field = (observation: typeof FIELD_OBSERVATION, jobScope: { jobPoolUploadId: string; poolRoleId: string } | null) => renderToString(
    <SyntxField workflow={withMatches() as never} analysisSource={{ kind: "URL", analysisId: "ANL_TEST" }} observation={observation} onObserve={() => undefined} onSelectPool={() => undefined} onExit={() => undefined} jobScope={jobScope} onSelectJobScope={() => undefined} />
  );

  it("offers SELECT AS JOB at the role and its requirements, never at the field or organization level", () => {
    expect(field(FIELD_OBSERVATION, null)).not.toContain("syntx-job-scope-select");
    expect(field({ ...FIELD_OBSERVATION, kind: "ORGANIZATION", organizationId: "ORG_1" }, null)).not.toContain("syntx-job-scope-select");
    const role = field({ ...FIELD_OBSERVATION, kind: "ROLE", organizationId: "ORG_1", roleId: "ROLE_A" }, null);
    expect(role).toMatch(/data-testid="syntx-job-scope-select"[^>]*data-job-scope-selected="false"/);
    expect(role).toContain("◎ SELECT AS JOB");
    const requirement = field({ kind: "REQUIREMENT", organizationId: "ORG_1", roleId: "ROLE_A", requirementId: "REQ_1", apertureSignId: null }, null);
    expect(requirement).toContain('data-testid="syntx-job-scope-select"');
  });

  it("marks the observed role when it is the selected job of this pool, and only then", () => {
    const selected = field({ ...FIELD_OBSERVATION, kind: "ROLE", organizationId: "ORG_1", roleId: "ROLE_A" }, { jobPoolUploadId: UPLOAD_ID, poolRoleId: "ROLE_A" });
    expect(selected).toMatch(/data-testid="syntx-job-scope-select"[^>]*data-job-scope-selected="true"[^>]*aria-pressed="true"[^>]*disabled=""/);
    expect(selected).toContain("✓ SELECTED JOB");
    const other = field({ ...FIELD_OBSERVATION, kind: "ROLE", organizationId: "ORG_1", roleId: "ROLE_B" }, { jobPoolUploadId: UPLOAD_ID, poolRoleId: "ROLE_A" });
    expect(other).toMatch(/data-job-scope-selected="false"/);
  });

  it("offers REMOVE JOB only at the selected role, as an explicit action beside the selection (owner G-05)", () => {
    const removable = (observation: typeof FIELD_OBSERVATION, jobScope: { jobPoolUploadId: string; poolRoleId: string } | null, locale: "en" | "de" = "en") => renderToString(
      <SyntxField workflow={withMatches() as never} analysisSource={{ kind: "URL", analysisId: "ANL_TEST" }} observation={observation} onObserve={() => undefined} onSelectPool={() => undefined} onExit={() => undefined} jobScope={jobScope} onSelectJobScope={() => undefined} onClearJobScope={() => undefined} locale={locale} />
    );
    const roleA = { ...FIELD_OBSERVATION, kind: "ROLE" as const, organizationId: "ORG_1", roleId: "ROLE_A" };
    const selected = removable(roleA, { jobPoolUploadId: UPLOAD_ID, poolRoleId: "ROLE_A" });
    expect(selected).toMatch(/data-testid="syntx-job-scope-clear"[^>]*title="Remove the selected job: ANALYZE is blocked until a job is selected again \(sources and analyses stay\)"/);
    expect(selected).toContain("× REMOVE JOB");
    expect(selected.indexOf("syntx-job-scope-select")).toBeLessThan(selected.indexOf("syntx-job-scope-clear"));
    expect(removable(roleA, { jobPoolUploadId: UPLOAD_ID, poolRoleId: "ROLE_A" }, "de")).toContain("× JOB ENTFERNEN");
    expect(removable(roleA, null)).not.toContain("syntx-job-scope-clear");
    expect(removable({ ...roleA, roleId: "ROLE_B" }, { jobPoolUploadId: UPLOAD_ID, poolRoleId: "ROLE_A" })).not.toContain("syntx-job-scope-clear");
    expect(removable(FIELD_OBSERVATION, { jobPoolUploadId: UPLOAD_ID, poolRoleId: "ROLE_A" })).not.toContain("syntx-job-scope-clear");
    // Without the handler (no owner of the scope) nothing can be removed.
    expect(field(roleA, { jobPoolUploadId: UPLOAD_ID, poolRoleId: "ROLE_A" })).not.toContain("syntx-job-scope-clear");
  });
});
