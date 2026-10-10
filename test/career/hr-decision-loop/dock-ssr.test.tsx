import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";

vi.mock("../../../lib/career/ui/useCareerAnalysisJob", () => ({
  useCareerAnalysisJob: () => ({ state: { state: "IDLE", canonicalAnalysis: null, currentOperation: null, attemptCount: null, errorCode: null, errorSummary: null }, submitAnalysis: vi.fn() })
}));

import { SemanticCareerIntelligenceField } from "../../../app/components/career/demo/SemanticCareerIntelligenceField";
import { CareerIntelligenceDashboard } from "../../../app/components/career/demo/CareerIntelligenceDashboard";
import { EMPTY_CAREER_INTELLIGENCE_DATA } from "../../../app/career/demo/demo-data";

const chrome = ["semantic-career-intelligence-field", "semantic-zoom-telemetry", "identity-core-wrapper", "decision-graph-inspector-idle", "how-this-works-btn", "open-system-codex-btn", "semantic-guide-drawer-toggle"];
const stages = ["01", "02", "03", "04", "05", "06"];

describe("SIL HR Decision Loop dock (server-rendered field)", () => {
  it("renders no dock and no loop attribute when no exact DCTXREV is selected", () => {
    const html = renderToString(<SemanticCareerIntelligenceField data={EMPTY_CAREER_INTELLIGENCE_DATA} />);
    expect(html).not.toContain("hr-decision-loop-dock");
    expect(html).toContain('data-hr-decision-loop-context=""');
    expect(html).toContain('data-sil-mode="PRE_CANONICAL_DISCOVERY"');
    for (const id of chrome) expect(html).toContain(`data-testid="${id}"`);
  });

  it("mounts the dock for an explicit DCTXREV and preserves the complete field geometry", () => {
    const html = renderToString(<SemanticCareerIntelligenceField data={EMPTY_CAREER_INTELLIGENCE_DATA} careerDecisionContextRevisionId="DCTXREV_SSR" decisionContextRevisionId="DREV_SSR" />);
    expect(html).toContain('data-testid="hr-decision-loop-dock"');
    expect(html).toContain('data-hr-decision-loop-context="DCTXREV_SSR"');
    expect(html).toContain('data-loop-read-state="IDLE"');
    expect(html).toContain('data-testid="hr-decision-loop-loading"');
    expect(html).toContain("READING EXACT DECISION CONTEXT...");
    expect(html).toContain("EXACT READ");
    expect(html).not.toContain("RECONSTRUCTED NEXT DECISION CONTEXT");
    expect(html).toContain("HR DECISION LOOP");
    expect(html).toContain("DCTXREV_SSR");
    expect(html).toContain('value="DREV_SSR"');
    expect(html).toContain("PERSISTED != TRUE");
    expect(html).not.toContain("hr-decision-loop-declaration");
    expect(html).toContain('data-sil-mode="PRE_CANONICAL_DISCOVERY"');
    for (const id of chrome) expect(html).toContain(`data-testid="${id}"`);
    for (const stage of stages) expect(html).toContain(`data-testid="focus-transition-stage-shell-${stage}"`);
    const dockIndex = html.indexOf('data-testid="hr-decision-loop-dock"');
    const guideIndex = html.indexOf('data-testid="semantic-guide-drawer-toggle"');
    expect(dockIndex).toBeGreaterThan(guideIndex);
  });

  it("follows the global SIL locale", () => {
    const de = renderToString(<SemanticCareerIntelligenceField data={EMPTY_CAREER_INTELLIGENCE_DATA} careerDecisionContextRevisionId="DCTXREV_SSR" initialLocale="de" />);
    expect(de).toContain("HR-ENTSCHEIDUNGSSCHLEIFE");
    expect(de).toContain("PERSISTIERT != WAHR");
    expect(de).not.toContain("HR DECISION LOOP");
    const en = renderToString(<SemanticCareerIntelligenceField data={EMPTY_CAREER_INTELLIGENCE_DATA} careerDecisionContextRevisionId="DCTXREV_SSR" initialLocale="en" />);
    expect(en).not.toContain("HR-ENTSCHEIDUNGSSCHLEIFE");
  });

  it("threads the exact ids from the dashboard to the field", () => {
    const html = renderToString(<CareerIntelligenceDashboard data={EMPTY_CAREER_INTELLIGENCE_DATA} careerDecisionContextRevisionId="DCTXREV_DASH" />);
    expect(html).toContain('data-testid="career-intelligence-dashboard"');
    expect(html).toContain('data-hr-decision-loop-context="DCTXREV_DASH"');
    expect(html).toContain('data-testid="hr-decision-loop-dock"');
  });
});
