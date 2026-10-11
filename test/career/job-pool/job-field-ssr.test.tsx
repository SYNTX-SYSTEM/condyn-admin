import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { matches, UPLOAD_ID } from "./fixtures/match-bodies";

vi.mock("../../../lib/career/ui/useCareerAnalysisJob", () => ({
  useCareerAnalysisJob: () => ({ state: { state: "IDLE", resultAnalysisId: null, canonicalAnalysis: null, currentOperation: null, attemptCount: null, errorCode: null, errorSummary: null }, submitAnalysis: vi.fn() })
}));

const idle = (selected: string | null) => ({ pools: { state: "IDLE" }, upload: { state: "IDLE" }, selectedJobPoolUploadId: selected, view: { state: "IDLE" }, matches: { state: "IDLE" }, submitUpload: vi.fn(), select: vi.fn(), reloadPools: vi.fn(), reloadMatches: vi.fn() });
vi.mock("../../../lib/career/ui/useJobPool", async (importOriginal) => {
  const original = await importOriginal<typeof import("../../../lib/career/ui/useJobPool")>();
  return {
    ...original,
    useJobPoolWorkflow: (options: { analysisId: string | null; initialJobPoolUploadId?: string | null }) => {
      if (options.initialJobPoolUploadId === "JPOOL_WITH_MATCHES") return { ...idle(UPLOAD_ID), pools: { state: "AVAILABLE", jobPools: [] }, matches: { state: "AVAILABLE", jobPoolUploadId: UPLOAD_ID, analysisId: "ANL_TEST", matches } };
      if (options.initialJobPoolUploadId === "JPOOL_LISTED") return { ...idle(null), pools: { state: "AVAILABLE", jobPools: [{ jobPoolUploadId: UPLOAD_ID, poolId: "POOL_SAMPLE", poolVersion: 1, poolName: "Sample Pool", poolStatus: "ACTIVE", organizationCount: 1, roleCount: 2, requirementCount: 3, uploadedByActorRef: "X", uploadedAt: "2026-10-10T18:00:00.000Z" }] } };
      return idle(options.initialJobPoolUploadId ?? null);
    }
  };
});

import { SemanticCareerIntelligenceField } from "../../../app/components/career/demo/SemanticCareerIntelligenceField";
import { CareerIntelligenceDashboard } from "../../../app/components/career/demo/CareerIntelligenceDashboard";
import { EMPTY_CAREER_INTELLIGENCE_DATA } from "../../../app/career/demo/demo-data";

const chrome = ["semantic-career-intelligence-field", "semantic-zoom-telemetry", "identity-core-wrapper", "decision-graph-inspector-idle", "how-this-works-btn", "open-system-codex-btn", "semantic-guide-drawer-toggle", "job-pool-panel-toggle"];
const stages = ["01", "02", "03", "04", "05", "06"];

describe("SIL Job Field focus (server-rendered)", () => {
  it("keeps the capability field as the default focus with only the JOB switch added", () => {
    const html = renderToString(<SemanticCareerIntelligenceField data={EMPTY_CAREER_INTELLIGENCE_DATA} />);
    expect(html).toContain('data-field-focus="CAPABILITY"');
    expect(html).toContain('data-testid="field-focus-job-btn"');
    expect(html).toContain('data-field-focus-active="false"');
    expect(html).not.toContain('data-testid="job-field"');
    for (const id of chrome) expect(html).toContain(`data-testid="${id}"`);
    for (const stage of stages) expect(html).toContain(`data-testid="focus-transition-stage-shell-${stage}"`);
  });

  it("opens the Job Field for focus=JOB, keeps the planetarium rendered underneath, and names the missing pool and analysis as distinct states", () => {
    const noPool = renderToString(<SemanticCareerIntelligenceField data={EMPTY_CAREER_INTELLIGENCE_DATA} fieldFocus="JOB" />);
    expect(noPool).toContain('data-field-focus="JOB"');
    expect(noPool).toContain('data-testid="job-field"');
    expect(noPool).toContain('data-field-state="NO_POOL"');
    expect(noPool).toContain('data-testid="job-field-exit-btn"');
    expect(noPool).toContain("NO JOB POOL UPLOAD SELECTED");
    expect(noPool).not.toContain("hr-decision-loop-dock");
    // The control panel yields the top-left column to the Job Field: collapsed, anchored bottom-left.
    expect(noPool).toMatch(/data-testid="job-pool-panel-toggle"[^>]*data-anchor="BOTTOM_LEFT"/);
    expect(noPool).not.toContain('data-testid="job-pool-panel"');
    for (const id of chrome) expect(noPool).toContain(`data-testid="${id}"`);
    for (const stage of stages) expect(noPool).toContain(`data-testid="focus-transition-stage-shell-${stage}"`);
    const listed = renderToString(<SemanticCareerIntelligenceField data={EMPTY_CAREER_INTELLIGENCE_DATA} fieldFocus="JOB" jobPoolUploadId="JPOOL_LISTED" />);
    expect(listed).toContain('data-field-state="NO_POOL"');
    expect(listed).toContain(`data-testid="job-field-select-pool-${UPLOAD_ID}"`);
    const noAnalysis = renderToString(<SemanticCareerIntelligenceField data={EMPTY_CAREER_INTELLIGENCE_DATA} fieldFocus="JOB" jobPoolUploadId="JPOOL_SSR" />);
    expect(noAnalysis).toContain('data-field-state="NO_ANALYSIS"');
    expect(noAnalysis).toContain('data-testid="job-field-no-analysis"');
    const loading = renderToString(<SemanticCareerIntelligenceField data={EMPTY_CAREER_INTELLIGENCE_DATA} fieldFocus="JOB" jobPoolUploadId="JPOOL_SSR" analysisId="ANL_SSR" />);
    expect(loading).toContain('data-field-state="LOADING"');
    expect(loading).toContain('data-analysis-id="ANL_SSR"');
  });

  it("renders the delivered field: roles by pool resonance, nearest presented role with its pending kinds, governance labels, no canonical ids", () => {
    const html = renderToString(<SemanticCareerIntelligenceField data={EMPTY_CAREER_INTELLIGENCE_DATA} fieldFocus="JOB" jobPoolUploadId="JPOOL_WITH_MATCHES" analysisId="ANL_TEST" />);
    expect(html).toContain('data-field-state="AVAILABLE"');
    expect(html).toContain('data-role-count="2"');
    expect(html).toContain('data-nearest-role="ROLE_A"');
    expect(html).toContain('data-selected-role=""');
    expect(html).toContain('data-sweep-state="AVAILABLE"');
    expect(html).toContain('data-testid="job-field-core"');
    expect(html).toContain('data-candidate-capability-count="2"');
    expect(html).toContain('data-testid="job-field-organization-ORG_1"');
    expect(html).toMatch(/data-testid="job-field-role-ROLE_A"[^>]*data-delivered-rank="1"[^>]*data-resonance-score="0.75"[^>]*data-distance="0.25"[^>]*data-scored-match="true"[^>]*data-nearest="true"/);
    expect(html).toMatch(/data-testid="job-field-role-ROLE_B"[^>]*data-resonance-score="0.3"[^>]*data-distance="0.7"[^>]*data-scored-match="false"[^>]*data-nearest="false"/);
    expect(html).toContain('data-testid="job-field-nearest-ray"');
    expect(html).toContain('data-testid="job-field-nearest"');
    expect(html).toContain("NEAREST PRESENTED ROLE");
    expect(html).toContain("not a role relation (RRL) · not a recommendation (RCP) · not a decision");
    expect(html).toContain("POOL RESONANCE (PRESENTATION)");
    expect(html).toContain('data-testid="job-field-pending-UNPROVEN_CANONICAL"');
    expect(html).toContain('data-ids="TRQREV_1,TRQREV_2"');
    expect(html).toMatch(/data-testid="job-field-pending-UNSCORED_COVERAGE"[^>]*data-count="1"[^>]*data-ids="REQ_2"/);
    expect(html).toContain("VERIFIED_CAPABILITY_SNAPSHOT_ABSENT");
    expect(html).toContain("ANALYSIS CAPABILITIES (SCORED SOURCE)");
    expect(html).toContain("SWEEP PROPOSALS (UNSCORED)");
    expect(html).toContain("absence of evidence is not absence of capability");
    expect(html).toContain("NEAREST != CHOSEN");
    expect(html).not.toMatch(/\b(RRL|TSN|EIS|RCP|DCTXREV|DCR|DREV)_[0-9A-Z]/);
    expect(html).not.toContain("hr-decision-loop-dock");
    expect(html).not.toContain("verified capability");
  });

  it("opens an exact role from the URL with its requirement relations and provenance, and names a stale role id", () => {
    const html = renderToString(<SemanticCareerIntelligenceField data={EMPTY_CAREER_INTELLIGENCE_DATA} fieldFocus="JOB" jobPoolUploadId="JPOOL_WITH_MATCHES" analysisId="ANL_TEST" jobRoleId="ROLE_A" />);
    expect(html).toContain('data-selected-role="ROLE_A"');
    expect(html).toContain('data-testid="job-field-role-detail"');
    expect(html).toMatch(/data-testid="job-field-requirement-REQ_1"[^>]*data-state="MATCHED"[^>]*data-provenance="ANALYSIS_CAPABILITY"[^>]*data-basis="EXACT"/);
    expect(html).toMatch(/data-testid="job-field-requirement-REQ_2"[^>]*data-state="COVERED_UNSCORED"[^>]*data-provenance="SWEEP_PROPOSAL"[^>]*data-basis=""[^>]*data-sweep-basis="TOKEN_CONTAINMENT"/);
    expect(html).toContain("Built services in TypeScript for six years.");
    expect(html).toContain("Operated the Kubernetes test cluster for the platform team.");
    expect(html).toContain("analysis capability (scored)");
    expect(html).toContain("capability sweep proposal (unscored, source-verified quote)");
    expect(html).not.toContain('data-testid="job-field-nearest"');
    const stale = renderToString(<SemanticCareerIntelligenceField data={EMPTY_CAREER_INTELLIGENCE_DATA} fieldFocus="JOB" jobPoolUploadId="JPOOL_WITH_MATCHES" analysisId="ANL_TEST" jobRoleId="ROLE_STALE" />);
    expect(stale).toContain('data-testid="job-field-role-not-delivered"');
    expect(stale).toContain('data-selected-role=""');
  });

  it("follows the global SIL locale and threads focus and role from the dashboard", () => {
    const de = renderToString(<SemanticCareerIntelligenceField data={EMPTY_CAREER_INTELLIGENCE_DATA} fieldFocus="JOB" initialLocale="de" />);
    expect(de).toContain("JOB-FELD");
    expect(de).not.toContain('data-testid="job-field-legend"');
    const dash = renderToString(<CareerIntelligenceDashboard data={EMPTY_CAREER_INTELLIGENCE_DATA} fieldFocus="JOB" jobPoolUploadId="JPOOL_WITH_MATCHES" analysisId="ANL_TEST" jobRoleId="ROLE_B" />);
    expect(dash).toContain('data-field-focus="JOB"');
    expect(dash).toContain('data-selected-role="ROLE_B"');
  });
});
