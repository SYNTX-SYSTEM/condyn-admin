import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";

vi.mock("../../../lib/career/ui/useCareerAnalysisJob", () => ({
  useCareerAnalysisJob: () => ({ state: { state: "IDLE", resultAnalysisId: null, canonicalAnalysis: null, currentOperation: null, attemptCount: null, errorCode: null, errorSummary: null }, submitAnalysis: vi.fn() })
}));

import { SemanticCareerIntelligenceField } from "../../../app/components/career/demo/SemanticCareerIntelligenceField";
import { CareerIntelligenceDashboard } from "../../../app/components/career/demo/CareerIntelligenceDashboard";
import { JobPoolMatchPanel } from "../../../app/components/career/demo/JobPoolMatchPanel";
import { EMPTY_CAREER_INTELLIGENCE_DATA } from "../../../app/career/demo/demo-data";

const chrome = ["semantic-career-intelligence-field", "semantic-zoom-telemetry", "identity-core-wrapper", "decision-graph-inspector-idle", "how-this-works-btn", "open-system-codex-btn", "semantic-guide-drawer-toggle"];
const stages = ["01", "02", "03", "04", "05", "06"];

describe("SIL Job Pool panel (server-rendered field)", () => {
  it("renders only the collapsed toggle by default and leaves the field, the dock contract and the geometry untouched", () => {
    const html = renderToString(<SemanticCareerIntelligenceField data={EMPTY_CAREER_INTELLIGENCE_DATA} />);
    expect(html).toContain('data-testid="job-pool-panel-toggle"');
    expect(html).not.toContain('data-testid="job-pool-panel"');
    expect(html).not.toContain("hr-decision-loop-dock");
    expect(html).toContain('data-job-pool-upload=""');
    expect(html).toContain('data-sil-mode="PRE_CANONICAL_DISCOVERY"');
    for (const id of chrome) expect(html).toContain(`data-testid="${id}"`);
    for (const stage of stages) expect(html).toContain(`data-testid="focus-transition-stage-shell-${stage}"`);
  });

  it("opens for an explicit upload id and shows every state as not yet read, never as persisted", () => {
    const html = renderToString(<SemanticCareerIntelligenceField data={EMPTY_CAREER_INTELLIGENCE_DATA} jobPoolUploadId="JPOOL_SSR" analysisId="ANL_SSR" />);
    expect(html).toContain('data-testid="job-pool-panel"');
    expect(html).toContain('data-job-pool-upload="JPOOL_SSR"');
    expect(html).toContain('data-pools-state="IDLE"');
    expect(html).toContain('data-matches-state="IDLE"');
    expect(html).toContain('data-selection-kind="NOT_LISTED"');
    expect(html).toContain('data-analysis-source="URL"');
    expect(html).toContain("ANL_SSR");
    expect(html).toContain("FROM THE URL (EXACT ID, ASSUMED PERSISTED)");
    expect(html).toContain("READING JOB POOL UPLOADS...");
    expect(html).toContain("PRESENTED != EVALUATED");
    expect(html).not.toContain("job-pool-presentation-labels");
    expect(html).not.toContain("hr-decision-loop-dock");
    for (const id of chrome) expect(html).toContain(`data-testid="${id}"`);
    for (const stage of stages) expect(html).toContain(`data-testid="focus-transition-stage-shell-${stage}"`);
  });

  it("coexists with the HR dock without any edge: both mount, the dock after the guide drawer, the panel on the left", () => {
    const html = renderToString(<SemanticCareerIntelligenceField data={EMPTY_CAREER_INTELLIGENCE_DATA} careerDecisionContextRevisionId="DCTXREV_SSR" jobPoolUploadId="JPOOL_SSR" />);
    expect(html).toContain('data-testid="hr-decision-loop-dock"');
    expect(html).toContain('data-testid="job-pool-panel"');
    expect(html).toContain('data-analysis-source="NONE"');
    expect(html).toContain("NO ANALYSIS: run the capability sweep");
    expect(html.indexOf('data-testid="job-pool-panel"')).toBeGreaterThan(html.indexOf('data-testid="hr-decision-loop-dock"'));
  });

  it("follows the global SIL locale", () => {
    const de = renderToString(<JobPoolMatchPanel jobPoolUploadId="JPOOL_SSR" locale="de" />);
    expect(de).toContain("JOB-POOL-VERBINDUNG");
    expect(de).toContain("PRÄSENTIERT != BEWERTET");
    expect(de).not.toContain("JOB POOL CONNECTION");
    const en = renderToString(<JobPoolMatchPanel jobPoolUploadId="JPOOL_SSR" locale="en" />);
    expect(en).toContain("JOB POOL CONNECTION");
  });

  it("threads the exact ids from the dashboard to the field", () => {
    const html = renderToString(<CareerIntelligenceDashboard data={EMPTY_CAREER_INTELLIGENCE_DATA} analysisId="ANL_DASH" jobPoolUploadId="JPOOL_DASH" />);
    expect(html).toContain('data-job-pool-upload="JPOOL_DASH"');
    expect(html).toContain('data-analysis-id="ANL_DASH"');
    expect(html).toContain('data-selected-pool="JPOOL_DASH"');
  });
});
