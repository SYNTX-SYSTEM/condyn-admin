import React from "react";
import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import { DEMO_CAREER_INTELLIGENCE_DATA } from "../app/career/demo/demo-data";
import { IdentityCoreNode } from "../app/components/career/demo/IdentityCoreNode";
import { CapabilityField } from "../app/components/career/demo/CapabilityField";
import { ResonanceOrbits } from "../app/components/career/demo/ResonanceOrbits";
import { RoleManifestation } from "../app/components/career/demo/RoleManifestation";
import { TensionLayer } from "../app/components/career/demo/TensionLayer";
import { EvolutionLayer } from "../app/components/career/demo/EvolutionLayer";
import { SourceSummaryPanel } from "../app/components/career/demo/SourceSummaryPanel";
import { CapabilityEvidencePanel } from "../app/components/career/demo/CapabilityEvidencePanel";
import { CompanyMatchPanel } from "../app/components/career/demo/CompanyMatchPanel";
import { RoleMatchPanel } from "../app/components/career/demo/RoleMatchPanel";
import { RecommendationPanel } from "../app/components/career/demo/RecommendationPanel";
import { CareerIntelligenceDashboard } from "../app/components/career/demo/CareerIntelligenceDashboard";
import { IdentityCoreDropZone } from "../app/components/career/demo/IdentityCoreDropZone";
import { OrbitalResonanceBubble } from "../app/components/career/demo/OrbitalResonanceBubble";
import { SourceDock } from "../app/components/career/demo/SourceDock";
import { SemanticGuideDrawer } from "../app/components/career/demo/SemanticGuideDrawer";
import { SemanticCareerIntelligenceField } from "../app/components/career/demo/SemanticCareerIntelligenceField";

describe("CONDYN / SYNTX — Step 22c: Semantic Career Intelligence Field (SIL v2.0) (`test/career-demo-ui.test.tsx`)", () => {
  it("should render IdentityCoreDropZone displaying ConDyn logo and active source count", () => {
    const html = renderToString(<IdentityCoreDropZone sources={DEMO_CAREER_INTELLIGENCE_DATA.sources} />);

    expect(html).toContain("ConDyn");
    expect(html).toContain("SYNTX CORE");
    expect(html).toContain("SOURCES ACTIVE");
  });

  it("should render OrbitalResonanceBubble displaying stage id, title, and item count", () => {
    const html = renderToString(
      <OrbitalResonanceBubble
        stageId="02"
        stageName="CAPABILITY FIELD"
        subtitle="Semantischer Kern"
        itemCount={12}
      />
    );

    expect(html).toContain("02");
    expect(html).toContain("CAPABILITY FIELD");
    expect(html).toContain("Semantischer Kern");
    expect(html).toContain("12 items");
  });

  it("should render SourceDock displaying compact ingestion options", () => {
    const html = renderToString(<SourceDock />);

    expect(html).toContain("1. WISSEN EINSPEISEN");
    expect(html).toContain("PDF Dokumente");
    expect(html).toContain("GitHub Repository");
    expect(html).toContain("ZIEHEN");
    expect(html).toContain("ABLEGEN");
  });

  it("should render SemanticGuideDrawer collapsible guide", () => {
    const htmlClosed = renderToString(<SemanticGuideDrawer initialOpen={false} />);
    expect(htmlClosed).toContain("SEMANTIC GUIDE");

    const htmlOpen = renderToString(<SemanticGuideDrawer initialOpen={true} />);
    expect(htmlOpen).toContain("DER 6-STUFIGE FLUSS");
    expect(htmlOpen).toContain("IDENTITY CORE");
    expect(htmlOpen).toContain("EVOLUTION PATHS");
  });

  it("should render SemanticCareerIntelligenceField combining Core DropZone, SourceDock, GuideDrawer and 6 Orbit Bubbles", () => {
    const html = renderToString(<SemanticCareerIntelligenceField data={DEMO_CAREER_INTELLIGENCE_DATA} />);

    expect(html).toContain("ConDyn");
    expect(html).toContain("1. WISSEN EINSPEISEN");
    expect(html).toContain("CAPABILITY FIELD");
    expect(html).toContain("RESONANCE ORBITS");
    expect(html).toContain("ROLE MANIFESTATION");
    expect(html).toContain("TENSION FIELD");
    expect(html).toContain("EVOLUTION PATHS");
  });

  it("should render CareerIntelligenceDashboard in FIELD MODE by default", () => {
    const html = renderToString(<CareerIntelligenceDashboard data={DEMO_CAREER_INTELLIGENCE_DATA} />);

    expect(html).toContain("FIELD MODE");
    expect(html).toContain("LIST MODE");
    expect(html).toContain("ConDyn");
  });

  it("should maintain backward compatibility for legacy panels", () => {
    const srcHtml = renderToString(<SourceSummaryPanel sources={DEMO_CAREER_INTELLIGENCE_DATA.sources} />);
    expect(srcHtml).toContain("Senior_Systems_Architect_CV.pdf");

    const capHtml = renderToString(<CapabilityEvidencePanel capabilities={DEMO_CAREER_INTELLIGENCE_DATA.capabilities} />);
    expect(capHtml).toContain("Distributed Real-Time Sensor Processing");

    const cmpHtml = renderToString(<CompanyMatchPanel companyMatches={DEMO_CAREER_INTELLIGENCE_DATA.companyMatches} />);
    expect(cmpHtml).toContain("Helsing");

    const roleHtml = renderToString(<RoleMatchPanel roleMatches={DEMO_CAREER_INTELLIGENCE_DATA.roleMatches} />);
    expect(roleHtml).toContain("Senior Defense AI Systems Engineer");

    const recHtml = renderToString(
      <RecommendationPanel
        capabilityGaps={DEMO_CAREER_INTELLIGENCE_DATA.capabilityGaps}
        nextActions={DEMO_CAREER_INTELLIGENCE_DATA.nextActions}
      />
    );
    expect(recHtml).toContain("DO-178C Safety Critical Avionics Certification");
  });
});
