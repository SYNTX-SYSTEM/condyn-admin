import React from "react";
import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import { DEMO_CAREER_INTELLIGENCE_DATA } from "../app/career/demo/demo-data";
import { SourceSummaryPanel } from "../app/components/career/demo/SourceSummaryPanel";
import { CapabilityEvidencePanel } from "../app/components/career/demo/CapabilityEvidencePanel";
import { CompanyMatchPanel } from "../app/components/career/demo/CompanyMatchPanel";
import { RoleMatchPanel } from "../app/components/career/demo/RoleMatchPanel";
import { RecommendationPanel } from "../app/components/career/demo/RecommendationPanel";
import { CareerIntelligenceDashboard } from "../app/components/career/demo/CareerIntelligenceDashboard";

describe("CONDYN Career Analysis Protocol v1.0 — Step 22: Career Intelligence Demo UI (`test/career-demo-ui.test.tsx`)", () => {
  it("should render SourceSummaryPanel displaying ingested documents and source kinds", () => {
    const html = renderToString(<SourceSummaryPanel sources={DEMO_CAREER_INTELLIGENCE_DATA.sources} />);

    expect(html).toContain("Senior_Systems_Architect_CV.pdf");
    expect(html).toContain("GITHUB_REPOSITORY");
    expect(html).toContain("github.com/codi/distributed-edge-core");
  });

  it("should render CapabilityEvidencePanel displaying recognized professional capabilities & confidence", () => {
    const html = renderToString(<CapabilityEvidencePanel capabilities={DEMO_CAREER_INTELLIGENCE_DATA.capabilities} />);

    expect(html).toContain("Distributed Real-Time Sensor Processing");
    expect(html).toContain("EDGE_COMPUTING");
    expect(html).toContain("94%");
  });

  it("should render CompanyMatchPanel displaying top organization matches and fit scores", () => {
    const html = renderToString(<CompanyMatchPanel companyMatches={DEMO_CAREER_INTELLIGENCE_DATA.companyMatches} />);

    expect(html).toContain("Helsing");
    expect(html).toContain("Anduril Industries");
    expect(html).toContain("92%");
    expect(html).toContain("Exceptional semantic overlap");
  });

  it("should render RoleMatchPanel displaying matching role titles and fit percentages", () => {
    const html = renderToString(<RoleMatchPanel roleMatches={DEMO_CAREER_INTELLIGENCE_DATA.roleMatches} />);

    expect(html).toContain("Senior Defense AI Systems Engineer");
    expect(html).toContain("Edge Platform Infrastructure Lead");
    expect(html).toContain("94%");
  });

  it("should render RecommendationPanel displaying capability gaps and actionable next steps", () => {
    const html = renderToString(
      <RecommendationPanel
        capabilityGaps={DEMO_CAREER_INTELLIGENCE_DATA.capabilityGaps}
        nextActions={DEMO_CAREER_INTELLIGENCE_DATA.nextActions}
      />
    );

    expect(html).toContain("DO-178C Safety Critical Avionics Certification");
    expect(html).toContain("MEDIUM");
    expect(html).toContain("Document Safety-Critical Software Engineering Practices");
  });

  it("should render CareerIntelligenceDashboard combining all panels cleanly using pure client-safe demo data", () => {
    const html = renderToString(<CareerIntelligenceDashboard data={DEMO_CAREER_INTELLIGENCE_DATA} />);

    expect(html).toContain("CONDYN Career Intelligence Instrument");
    expect(html).toContain("DEMO-ANL-2026-X1");
    expect(html).toContain("Helsing");
    expect(html).toContain("Senior Defense AI Systems Engineer");
  });
});
