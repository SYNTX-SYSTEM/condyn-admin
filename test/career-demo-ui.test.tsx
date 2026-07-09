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
import { OrbitalSubspaceView } from "../app/components/career/demo/OrbitalSubspaceView";

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

  it("should render Planetarium structure with expanded radius, HUD coordinates, energy paths, and photon streams (SIL v2.5 Phase 2a)", () => {
    const html = renderToString(<SemanticCareerIntelligenceField data={DEMO_CAREER_INTELLIGENCE_DATA} />);

    expect(html).toContain("SYS.PLANETARIUM // RADIUS: 330px");
    expect(html).toContain("SEMANTIC RESONANCE: ACTIVE");
    expect(html).toContain("data-testid=\"resonance-energy-paths\"");
    expect(html).toContain("data-testid=\"energy-ray-01\"");
    expect(html).toContain("data-testid=\"photon-stream-core-to-orbit\"");
    expect(html).toContain("data-testid=\"photon-stream-orbit-to-core\"");
    expect(html).toContain("data-testid=\"rotating-background-rings\"");
    expect(html).toContain("data-testid=\"ambient-energy-nodes\"");
    expect(html).toContain("data-testid=\"semantic-dust-particles\"");
    expect(html).toContain("data-testid=\"plasma-core-rings\"");
    expect(html).toContain("data-testid=\"plasma-flare\"");
    expect(html).toContain("data-testid=\"inter-orbital-coupling\"");
  });

  it("should support OrbitalResonanceBubble hover, dimming, animationDelay props, and scientific HUD preview (SIL v2.5 Phase 2b/2c/2d)", () => {
    const htmlHighlighted = renderToString(
      <OrbitalResonanceBubble
        stageId="02"
        stageName="CAPABILITY FIELD"
        subtitle="Semantischer Kern"
        itemCount={12}
        isHovered={true}
        animationDelay="-4s"
        previewItems={["React Architecture", "TypeScript", "System Design"]}
      />
    );
    expect(htmlHighlighted).toContain("02");
    expect(htmlHighlighted).toContain("orbital-bubble-focused");
    expect(htmlHighlighted).toContain("data-testid=\"orbital-physics-02\"");
    expect(htmlHighlighted).toContain("physics--network-rotate");
    expect(htmlHighlighted).toContain("data-testid=\"semiotic-signature-02\"");
    expect(htmlHighlighted).toContain("CAPABILITY FIELD");
    expect(htmlHighlighted).toContain("HOLOGRAM HUD");
    expect(htmlHighlighted).toContain("hologram-hud--large");
    expect(htmlHighlighted).toContain("hologram-float");
    expect(htmlHighlighted).toContain("380px");
    expect(htmlHighlighted).toContain("CONFIDENCE");
    expect(htmlHighlighted).toContain("EVIDENCE DENSITY");
    expect(htmlHighlighted).toContain("SOURCES // SEMIOTIC GROUNDING");
    expect(htmlHighlighted).toContain("data-testid=\"orbital-tether-02\"");
    expect(htmlHighlighted).toContain("data-testid=\"hud-actions\"");
    expect(htmlHighlighted).toContain("OPEN EVIDENCE");
    expect(htmlHighlighted).toContain("INSPECT SOURCES");
    expect(htmlHighlighted).toContain("VIEW MATCHES");
    expect(htmlHighlighted).toContain("TOP ITEMS");
    expect(htmlHighlighted).toContain("Click to focus this field");
    expect(htmlHighlighted).toContain("React Architecture");
    expect(htmlHighlighted).toContain("animation-delay:-4s");

    const htmlDimmed = renderToString(
      <OrbitalResonanceBubble
        stageId="03"
        stageName="RESONANCE ORBITS"
        subtitle="Organisationen im Feld"
        itemCount={5}
        isDimmed={true}
      />
    );
    expect(htmlDimmed).toContain("03");
  });

  it("should render position-sensitive HUD placement classes for viewport safety (bottom, top, left, right)", () => {
    // untere Bubble rendert Tooltip mit Placement `top`
    const bottomBubbleHtml = renderToString(
      <OrbitalResonanceBubble
        stageId="04"
        stageName="ROLE MANIFESTATION"
        subtitle="Rollen"
        itemCount={5}
        isHovered={true}
        angle={90}
      />
    );
    expect(bottomBubbleHtml).toContain("hud-preview--top");

    // obere Bubble rendert Tooltip mit Placement `bottom`
    const topBubbleHtml = renderToString(
      <OrbitalResonanceBubble
        stageId="01"
        stageName="IDENTITY CORE"
        subtitle="Identität"
        itemCount={5}
        isHovered={true}
        angle={270}
      />
    );
    expect(topBubbleHtml).toContain("hud-preview--bottom");

    // rechte Bubble rendert Tooltip mit Placement `left`
    const rightBubbleHtml = renderToString(
      <OrbitalResonanceBubble
        stageId="00"
        stageName="RIGHT ORBIT"
        subtitle="Rechts"
        itemCount={5}
        isHovered={true}
        angle={0}
      />
    );
    expect(rightBubbleHtml).toContain("hud-preview--left");

    // linke Bubble rendert Tooltip mit Placement `right`
    const leftBubbleHtml = renderToString(
      <OrbitalResonanceBubble
        stageId="00"
        stageName="LEFT ORBIT"
        subtitle="Links"
        itemCount={5}
        isHovered={true}
        angle={180}
      />
    );
    expect(leftBubbleHtml).toContain("hud-preview--right");
  });

  it("should render NASA Semantic Zoom Telemetry and Continuous Semantic Space L1/L2 subspace layers (SIL v3.0 Phase 3c)", () => {
    const fieldHtml = renderToString(<SemanticCareerIntelligenceField data={DEMO_CAREER_INTELLIGENCE_DATA} />);
    expect(fieldHtml).toContain("data-testid=\"semantic-zoom-telemetry\"");
    expect(fieldHtml).toContain("L0 PLANETARIUM");
    expect(fieldHtml).toContain("L1 CLUSTER");
    expect(fieldHtml).toContain("L2 EVIDENCE");

    const subspaceL1Html = renderToString(
      <OrbitalSubspaceView
        stageId="02"
        stageName="CAPABILITY FIELD"
        subtitle="Semantischer Kern"
        zoomLevel={1}
      />
    );
    expect(subspaceL1Html).toContain("data-testid=\"orbital-subspace-view\"");
    expect(subspaceL1Html).toContain("ORBITAL SUBSPACE // ZOOM LEVEL");
    expect(subspaceL1Html).toContain("data-testid=\"subspace-cluster\"");

    const subspaceL2Html = renderToString(
      <OrbitalSubspaceView
        stageId="02"
        stageName="CAPABILITY FIELD"
        subtitle="Semantischer Kern"
        zoomLevel={2}
      />
    );
    expect(subspaceL2Html).toContain("data-testid=\"zoom-level-2-evidence\"");
    expect(subspaceL2Html).toContain("data-testid=\"evidence-node\"");
  });
});


