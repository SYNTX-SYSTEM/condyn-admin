import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { matches, summary, UPLOAD_ID, view } from "./fixtures/match-bodies";

vi.mock("../../../lib/career/ui/useCareerAnalysisJob", () => ({
  useCareerAnalysisJob: () => ({ state: { state: "IDLE", resultAnalysisId: null, canonicalAnalysis: null, currentOperation: null, attemptCount: null, errorCode: null, errorSummary: null }, submitAnalysis: () => undefined })
}));

const idle = (selected: string | null) => ({ pools: { state: "IDLE" }, upload: { state: "IDLE" }, selectedJobPoolUploadId: selected, view: { state: "IDLE" }, matches: { state: "IDLE" }, submitUpload: async () => undefined, select: () => undefined, reloadPools: async () => undefined, reloadMatches: async () => undefined });
vi.mock("../../../lib/career/ui/useJobPool", async (importOriginal) => {
  const original = await importOriginal<typeof import("../../../lib/career/ui/useJobPool")>();
  return {
    ...original,
    useJobPoolWorkflow: (options: { analysisId: string | null; initialJobPoolUploadId?: string | null }) => {
      if (options.initialJobPoolUploadId === "JPOOL_WITH_MATCHES") return { ...idle(UPLOAD_ID), pools: { state: "AVAILABLE", jobPools: [summary] }, view: { state: "AVAILABLE", jobPoolUploadId: UPLOAD_ID, upload: view }, matches: { state: "AVAILABLE", jobPoolUploadId: UPLOAD_ID, analysisId: "ANL_TEST", matches } };
      if (options.initialJobPoolUploadId === "JPOOL_LISTED") return { ...idle(null), pools: { state: "AVAILABLE", jobPools: [summary] } };
      return idle(options.initialJobPoolUploadId ?? null);
    }
  };
});
vi.mock("../../../lib/career/ui/useJobPoolSources", () => ({ useAnalysisSources: () => ({ state: "IDLE" }) }));

import { SemanticCareerIntelligenceField } from "../../../app/components/career/demo/SemanticCareerIntelligenceField";
import { CareerIntelligenceDashboard } from "../../../app/components/career/demo/CareerIntelligenceDashboard";
import { EMPTY_CAREER_INTELLIGENCE_DATA } from "../../../app/career/demo/demo-data";

const chrome = ["semantic-career-intelligence-field", "semantic-zoom-telemetry", "identity-core-wrapper", "decision-graph-inspector-idle", "how-this-works-btn", "open-system-codex-btn", "semantic-guide-drawer-toggle"];
const stages = ["01", "02", "03", "04", "05", "06"];
const RETIRED = ["job-field", "job-field-nearest", "job-field-thread-", "job-field-nebula-", "job-field-lens", "job-field-legend", "job-pool-panel\"", "job-pool-selected", "job-pool-orbit", "job-pool-structure-", "job-pool-role-list", "job-pool-role-lens-", "field-focus-job-btn"];
/** Visible text of one server-rendered region (everything outside tags between two markers), to prove that proof ids are attributes only. */
const textOf = (html: string, startMarker: string, endMarker: string): string => {
  const start = html.indexOf(startMarker);
  const end = html.indexOf(endMarker, start + 1);
  return html.slice(start, end < 0 ? undefined : end).replace(/<style>[\s\S]*?<\/style>/g, "").replace(/<[^>]+>/g, " ");
};
const STAGE = ['<div data-testid="syntx-stage"', '<div data-sx-surface="header"'] as const;

describe("SYNTX field (server-rendered)", () => {
  it("keeps the capability field as the default focus; the strip names two field states and never the retired JOB switch", () => {
    const html = renderToString(<SemanticCareerIntelligenceField data={EMPTY_CAREER_INTELLIGENCE_DATA} analysisId="ANL_TEST" />);
    expect(html).toContain('data-field-focus="CAPABILITY"');
    expect(html).toContain('data-testid="field-focus-capability-btn"');
    expect(html).toMatch(/data-testid="job-pool-panel-toggle"[^>]*data-field-focus-active="false"/);
    expect(html).toContain("⬡ JOB FIELD");
    expect(html).not.toContain('data-testid="syntx-field"');
    for (const id of RETIRED) expect(html).not.toContain(`data-testid="${id}`);
    for (const id of chrome) expect(html).toContain(`data-testid="${id}"`);
    for (const stage of stages) expect(html).toContain(`data-testid="focus-transition-stage-shell-${stage}"`);
    expect(html).not.toContain("hr-decision-loop-dock");
  });

  it("opens the field for focus=FIELD: without a selection the pools aperture is the contextual action; an exact upload id alone opens the field too", () => {
    const noPool = renderToString(<SemanticCareerIntelligenceField data={EMPTY_CAREER_INTELLIGENCE_DATA} fieldFocus="FIELD" analysisId="ANL_TEST" />);
    expect(noPool).toContain('data-field-focus="FIELD"');
    expect(noPool).toMatch(/data-testid="syntx-field"[^>]*data-field-grammar="SYNTX_FIELD_V1"/);
    expect(noPool).toContain('data-field-state="NO_POOL"');
    expect(noPool).toContain('data-observation-kind="FIELD"');
    expect(noPool).toContain('data-aperture-open="false"');
    expect(noPool).toContain('data-pools-visible="true"');
    expect(noPool).toContain('data-intake-visible="false"');
    expect(noPool).toContain('data-testid="syntx-no-pool"');
    expect(noPool).toContain('data-testid="syntx-exit-btn"');
    expect(noPool).toContain('data-testid="job-pool-list"');
    expect(noPool).toContain('data-testid="job-pool-upload"');
    expect(noPool).toMatch(/data-testid="job-pool-upload"[^>]*hidden=""/);
    for (const id of chrome) expect(noPool).toContain(`data-testid="${id}"`);
    for (const stage of stages) expect(noPool).toContain(`data-testid="focus-transition-stage-shell-${stage}"`);
    const listed = renderToString(<SemanticCareerIntelligenceField data={EMPTY_CAREER_INTELLIGENCE_DATA} fieldFocus="FIELD" jobPoolUploadId="JPOOL_LISTED" analysisId="ANL_TEST" />);
    expect(listed).toContain(`data-testid="job-pool-select-${UPLOAD_ID}"`);
    const byUpload = renderToString(<SemanticCareerIntelligenceField data={EMPTY_CAREER_INTELLIGENCE_DATA} jobPoolUploadId="JPOOL_WITH_MATCHES" analysisId="ANL_TEST" />);
    expect(byUpload).toContain('data-field-focus="FIELD"');
    expect(byUpload).toContain('data-testid="syntx-field"');
    const explicitGround = renderToString(<SemanticCareerIntelligenceField data={EMPTY_CAREER_INTELLIGENCE_DATA} fieldFocus="CAPABILITY" jobPoolUploadId="JPOOL_WITH_MATCHES" analysisId="ANL_TEST" />);
    expect(explicitGround).toContain('data-field-focus="CAPABILITY"');
    expect(explicitGround).not.toContain('data-testid="syntx-field"');
  });

  it("FIELD state: containment signs with their proofs, no score, no coupling, no retired caption or thread; the summary derives from the field", () => {
    const html = renderToString(<SemanticCareerIntelligenceField data={EMPTY_CAREER_INTELLIGENCE_DATA} fieldFocus="FIELD" jobPoolUploadId="JPOOL_WITH_MATCHES" analysisId="ANL_TEST" />);
    expect(html).toMatch(new RegExp(`data-testid="syntx-field"[^>]*data-field-grammar="SYNTX_FIELD_V1"[^>]*data-observation-kind="FIELD"[^>]*data-observation-id="${UPLOAD_ID}"[^>]*data-aperture-open="false"[^>]*data-motion-mode="LIVE"[^>]*data-field-state="AVAILABLE"`));
    expect(html).toContain('data-matching-delivered="true"');
    expect(html).toContain('data-sign-count="4"');
    // The pool core carries the Decision Loop Labs emblem; the brand field and frame are decoration only (aria-hidden).
    expect(html).toMatch(/data-testid="syntx-pool-core"[\s\S]*data-sx-brand-core="dll"[^>]*aria-hidden="true"/);
    expect(html).toMatch(/data-sx-brand-field="dll" aria-hidden="true"/);
    expect(html).toMatch(/data-testid="syntx-pool"[^>]*data-sign-id="field:JPOOL_0123456789abcdef"[^>]*data-sign-source="canonical_entity"[^>]*data-sign-relation="contains"[^>]*data-sign-state="field"[^>]*data-sign-manifestation="region"/);
    expect(html).toMatch(/data-testid="syntx-organization-ORG_1"[^>]*data-role-count="2"[^>]*data-sign-id="org:ORG_1"[^>]*data-sign-relation="contains"[^>]*data-sign-state="field"[^>]*data-sign-manifestation="region"[^>]*data-sign-interaction="select"[^>]*data-sign-transition="recenter"[^>]*data-proof-upload-id="JPOOL_0123456789abcdef"[^>]*data-proof-organization-id="ORG_1"[^>]*data-proof-target-id="TOENT_1"/);
    expect(html).toMatch(/data-testid="syntx-role-ROLE_A"[^>]*data-requirement-count="2"[^>]*data-matching-read="true"[^>]*data-sign-id="role:ROLE_A"[^>]*data-sign-relation="contains"[^>]*data-sign-manifestation="carrier"[^>]*data-proof-upload-id="JPOOL_0123456789abcdef"[^>]*data-proof-organization-id="ORG_1"[^>]*data-proof-role-id="ROLE_A"[^>]*data-proof-target-id="TROB_A"/);
    expect(html).toContain('data-testid="syntx-role-ROLE_B"');
    // Readable names, no truncation as the primary display.
    expect(html).toContain("Platform Engineer");
    expect(html).toContain("Data Analyst");
    // The region name reads inside the node behind the field glyph (visual grammar transfer); the delivered name itself is the DOM text.
    expect(html).toMatch(/>(⬡ )?Acme</);
    // No score, rank or coupling in the FIELD state (R4/R14); no requirement ecology before a role is observed.
    expect(html).not.toContain("data-resonance-score");
    expect(textOf(html, ...STAGE)).not.toMatch(/\d+(\.\d+)?%|#\d/);
    expect(html).not.toContain('data-testid="syntx-ecology"');
    expect(html).not.toContain('data-testid="syntx-aperture"');
    for (const id of RETIRED) expect(html).not.toContain(`data-testid="${id}`);
    // BR-4: the summary for the observation point.
    expect(html).toMatch(new RegExp(`data-testid="syntx-summary"[^>]*data-summary-for="${UPLOAD_ID}"[^>]*aria-live="polite"[^>]*>Job pool Sample Pool, version 1, ACTIVE: 1 organization containing 2 roles. A presentation matching was read for this pool.<`));
    // The field-edge semantic line and the boundary aperture (folded) carry the authority; the labels are attributes and folded text, never a permanent panel.
    expect(html).toContain("PRESENTED != EVALUATED");
    expect(html).toContain("COVERED != SCORED");
    expect(html).toMatch(/data-testid="job-pool-matches"[^>]*hidden=""/);
    expect(html).toContain('data-testid="job-pool-label-NOT_A_DECISION"');
    expect(html).toContain('data-testid="syntx-boundary-toggle"');
    expect(html).not.toContain("hr-decision-loop-dock");
  });

  it("ROLE state from the URL: anchors by support with their traces, source carriers, the one suspended boundary; proof ids never as default-state text", () => {
    const html = renderToString(<SemanticCareerIntelligenceField data={EMPTY_CAREER_INTELLIGENCE_DATA} fieldFocus="FIELD" jobPoolUploadId="JPOOL_WITH_MATCHES" analysisId="ANL_TEST" jobRoleId="ROLE_A" />);
    expect(html).toContain('data-observation-kind="ROLE"');
    expect(html).toContain('data-observation-id="ROLE_A"');
    expect(html).toMatch(/data-testid="syntx-role-ROLE_A"[^>]*data-sign-state="role_selected"/);
    expect(html).toMatch(/data-testid="syntx-role-ROLE_B"[^>]*data-sign-state="receded"/);
    expect(html).toMatch(/data-testid="syntx-ecology"[^>]*data-role-id="ROLE_A"/);
    expect(html).toMatch(/data-testid="syntx-requirement-REQ_1"[^>]*data-support="SUPPORTED"[^>]*data-evaluation-state="NOT_EVALUATED"[^>]*data-trace-count="1"/);
    expect(html).toMatch(/data-testid="syntx-requirement-REQ_2"[^>]*data-support="SWEEP_ONLY"[^>]*data-evaluation-state="NOT_EVALUATED"[^>]*data-trace-count="1"/);
    expect(html).toMatch(/data-sign-id="req:REQ_1"[^>]*data-sign-source="canonical_entity"[^>]*data-sign-relation="requires"[^>]*data-sign-state="field"[^>]*data-sign-manifestation="anchor"[^>]*data-sign-interaction="select"[^>]*data-sign-transition="unfold"[^>]*data-proof-upload-id="JPOOL_0123456789abcdef"[^>]*data-proof-role-id="ROLE_A"[^>]*data-proof-requirement-id="REQ_1"[^>]*data-proof-trqrev-id="TRQREV_1"/);
    expect(html).toMatch(/data-testid="syntx-trace-trace:REQ_1:supports:DOC_CV:0"[^>]*data-sign-id="trace:REQ_1:supports:DOC_CV:0"[^>]*data-sign-source="evidence"[^>]*data-sign-relation="supports"[^>]*data-sign-state="field"[^>]*data-sign-manifestation="trace_stable"[^>]*data-sign-interaction="inspect"[^>]*data-sign-transition="trace_rise"[^>]*data-proof-upload-id="JPOOL_0123456789abcdef"[^>]*data-proof-role-id="ROLE_A"[^>]*data-proof-requirement-id="REQ_1"[^>]*data-proof-analysis-id="ANL_TEST"[^>]*data-proof-capability-id="CAP_TS"[^>]*data-proof-doc-id="DOC_CV"/);
    expect(html).toMatch(/data-testid="syntx-trace-trace:REQ_2:covers_unscored:DOC_CV:0"[^>]*data-sign-source="gemini_sweep"[^>]*data-sign-relation="covers_unscored"[^>]*data-sign-state="field"[^>]*data-sign-manifestation="trace_dotted"[^>]*data-proof-capability-id="PCAP_K8S"[^>]*data-proof-doc-id="DOC_CV"/);
    expect(html).not.toContain("data-proof-evidence-id"); // the projection join needs the analysis sources (not read in SSR): no synthesised evidence id
    expect(html).toMatch(/data-testid="syntx-source-DOC_CV"[^>]*data-source-title-state="NOT_READ"[^>]*data-trace-count="2"[^>]*data-sign-id="source:DOC_CV"[^>]*data-sign-source="evidence"[^>]*data-sign-relation="supports"[^>]*data-sign-manifestation="carrier"[^>]*data-sign-interaction="none"/);
    expect(html).toMatch(/data-testid="syntx-pending-ROLE_A"[^>]*data-sign-id="pending:ROLE_A"[^>]*data-sign-source="evaluation_state"[^>]*data-sign-relation="pending_evaluation"[^>]*data-sign-state="field"[^>]*data-sign-manifestation="suspended_boundary"[^>]*data-sign-interaction="inspect"[^>]*data-sign-transition="boundary_suspend"[^>]*data-proof-upload-id="JPOOL_0123456789abcdef"[^>]*data-proof-role-id="ROLE_A"[^>]*data-proof-target-id="TRPREV_A"[^>]*data-proof-trqrev-id="TRQREV_1 TRQREV_2"[^>]*data-proof-analysis-id="ANL_TEST"/);
    expect((html.match(/data-sign-relation="pending_evaluation"/g) ?? []).length).toBe(1);
    expect(html).not.toMatch(/data-sign-manifestation="(closed|stable_closed|thin_closed)/);
    expect(html).toContain('data-aperture-open="false"');
    expect(html).not.toContain('data-testid="syntx-aperture"');
    // Readable requirement names are text; proof ids, TRQREV/TRPREV and the quote are not default-state text (spec §7, GELB condition a).
    const text = textOf(html, ...STAGE);
    expect(text).toContain("TypeScript");
    expect(text).toContain("Kubernetes");
    expect(text).not.toMatch(/CAP_TS|PCAP_K8S|TRQREV_|TRPREV_|DOC_CV|ANL_TEST|JPOOL_/);
    expect(text).not.toContain("Built services in TypeScript for six years.");
    expect(text).not.toMatch(/\d+(\.\d+)?%/);
    // The observation path is a return affordance; the summary names the role ecology.
    expect(html).toMatch(/data-testid="syntx-path-FIELD"[^>]*data-current="false"/);
    expect(html).toMatch(/data-testid="syntx-path-ROLE"[^>]*data-current="true"/);
    expect(html).toContain('data-testid="syntx-return-btn"');
    expect(html).toMatch(/data-summary-for="ROLE_A"[^>]*>Role Platform Engineer at Acme requires 2 requirements: 1 with scored support, 0 with weak support, 1 covered only by an unscored sweep proposal, 0 without delivered support, 0 without a matching read. Canonical evaluation is pending for every requirement of this role.</);
  });

  it("REQUIREMENT state from the URL: the observed anchor is selected and its traces inspectable, the rest recedes; the aperture is never opened by the URL", () => {
    const html = renderToString(<SemanticCareerIntelligenceField data={EMPTY_CAREER_INTELLIGENCE_DATA} fieldFocus="FIELD" jobPoolUploadId="JPOOL_WITH_MATCHES" analysisId="ANL_TEST" jobRoleId="ROLE_A" jobRequirementId="REQ_1" />);
    expect(html).toContain('data-observation-kind="REQUIREMENT"');
    expect(html).toContain('data-observation-id="REQ_1"');
    expect(html).toMatch(/data-sign-id="req:REQ_1"[^>]*data-sign-state="requirement_selected"[^>]*data-sign-manifestation="anchor"[^>]*data-sign-interaction="return"[^>]*data-sign-transition="recenter"/);
    expect(html).toMatch(/data-sign-id="trace:REQ_1:supports:DOC_CV:0"[^>]*data-sign-state="inspectable"/);
    expect(html).toMatch(/data-sign-id="req:REQ_2"[^>]*data-sign-state="receded"/);
    expect(html).toMatch(/data-sign-id="trace:REQ_2:covers_unscored:DOC_CV:0"[^>]*data-sign-state="receded"/);
    expect(html).toMatch(/data-sign-id="role:ROLE_A"[^>]*data-sign-state="field"/);
    expect(html).toContain('data-aperture-open="false"');
    expect(html).not.toContain('data-testid="syntx-aperture"');
    // Deep focus (depth 3): the planetarium's focus anchor stays the observed organization's body at 1.12; nothing zooms.
    expect(html).toMatch(/data-testid="syntx-canvas"[^>]*data-depth="3"[^>]*data-camera-scale="1.12"/);
    expect(html).toContain('data-testid="syntx-deep-focus"');
    expect(html).toMatch(/data-summary-for="REQ_1"[^>]*>Requirement TypeScript of role Platform Engineer: supported by scored evidence; 1 evidence trace from 1 source.</);
  });

  it("names a stale observation id and falls back to its parent level", () => {
    const staleRole = renderToString(<SemanticCareerIntelligenceField data={EMPTY_CAREER_INTELLIGENCE_DATA} fieldFocus="FIELD" jobPoolUploadId="JPOOL_WITH_MATCHES" analysisId="ANL_TEST" jobRoleId="ROLE_X" />);
    expect(staleRole).toContain('data-observation-kind="FIELD"');
    expect(staleRole).toMatch(/data-testid="syntx-stale"[^>]*data-stale-kind="ROLE"[^>]*data-stale-id="ROLE_X"/);
    expect(staleRole).toContain("ROLE ID NOT IN THIS POOL");
    const staleRequirement = renderToString(<SemanticCareerIntelligenceField data={EMPTY_CAREER_INTELLIGENCE_DATA} fieldFocus="FIELD" jobPoolUploadId="JPOOL_WITH_MATCHES" analysisId="ANL_TEST" jobRoleId="ROLE_A" jobRequirementId="REQ_X" />);
    expect(staleRequirement).toContain('data-observation-kind="ROLE"');
    expect(staleRequirement).toMatch(/data-testid="syntx-stale"[^>]*data-stale-kind="REQUIREMENT"/);
  });

  it("follows the global SIL locale and threads focus and observation from the dashboard, accepting the legacy JOB/POOL focus names", () => {
    const de = renderToString(<SemanticCareerIntelligenceField data={EMPTY_CAREER_INTELLIGENCE_DATA} fieldFocus="FIELD" initialLocale="de" />);
    expect(de).toContain("JOB-FELD");
    expect(de).toContain("KEIN JOB-POOL-UPLOAD IM FELD");
    const dash = renderToString(<CareerIntelligenceDashboard data={EMPTY_CAREER_INTELLIGENCE_DATA} fieldFocus="FIELD" jobPoolUploadId="JPOOL_WITH_MATCHES" analysisId="ANL_TEST" jobOrganizationId="ORG_1" jobRoleId="ROLE_B" />);
    expect(dash).toContain('data-field-focus="FIELD"');
    expect(dash).toContain('data-observation-kind="ROLE"');
    expect(dash).toContain('data-observation-id="ROLE_B"');
    expect(dash).toContain(`data-job-pool-upload="JPOOL_WITH_MATCHES"`);
  });

  it("brands the Job Field context as Decision Loop Labs (header and pool core); the Capability context keeps its header", () => {
    const job = renderToString(<CareerIntelligenceDashboard data={EMPTY_CAREER_INTELLIGENCE_DATA} fieldFocus="FIELD" jobPoolUploadId="JPOOL_WITH_MATCHES" analysisId="ANL_TEST" />);
    expect(job).toMatch(/data-testid="shell-brand-dll"[^>]*data-sx-brand="dll"/);
    expect(job).toContain("DECISION LOOP LABS");
    expect(job).toContain("/ SYNTX — SEMANTIC CAREER INTELLIGENCE FIELD");
    expect(job).not.toContain("CONDYN / SYNTX — SEMANTIC CAREER INTELLIGENCE FIELD");
    const capability = renderToString(<CareerIntelligenceDashboard data={EMPTY_CAREER_INTELLIGENCE_DATA} />);
    expect(capability).toContain("CONDYN / SYNTX — SEMANTIC CAREER INTELLIGENCE FIELD");
    expect(capability).not.toContain("shell-brand-dll");
    expect(capability).not.toContain("data-sx-brand-mark");
  });
});
