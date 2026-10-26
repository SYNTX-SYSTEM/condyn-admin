import React from "react";
import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import { EMPTY_CAREER_INTELLIGENCE_DATA } from "../app/career/demo/demo-data";
import { IdentityCoreDropZone } from "../app/components/career/demo/IdentityCoreDropZone";
import { OrbitalResonanceBubble } from "../app/components/career/demo/OrbitalResonanceBubble";
import { SourceDock } from "../app/components/career/demo/SourceDock";
import { SemanticCareerIntelligenceField } from "../app/components/career/demo/SemanticCareerIntelligenceField";
import { CareerIntelligenceDashboard } from "../app/components/career/demo/CareerIntelligenceDashboard";

describe("CONDYN / SYNTX — Step 22c: Semantic Career Intelligence Field (SIL v2.0) (`test/career-demo-ui.test.tsx`)", () => {
  it("should render IdentityCoreDropZone without any active sources in Zero-State", () => {
    const html = renderToString(<IdentityCoreDropZone sources={EMPTY_CAREER_INTELLIGENCE_DATA.sources} />);

    expect(html).toContain("DLL Logo");
    expect(html).toContain("SYNTX CORE • ORGANISM");
    expect(html).toContain("0 SOURCES ACTIVE"); // count is 0
  });

  it("should render OrbitalResonanceBubble with 0 items in Zero-State", () => {
    const html = renderToString(
      <OrbitalResonanceBubble
        stageId="02"
        stageName="CAPABILITY FIELD"
        subtitle="Semantischer Kern"
        itemCount={0}
      />
    );

    expect(html).toContain("02");
    expect(html).toContain("CAPABILITY FIELD");
    expect(html).toContain("0 items");
  });

  it("should render orbits 03–06 (component) with 0 items in Zero-State", () => {
    for (const [stageId, stageName] of [["03", "RESONANCE ORBITS"], ["04", "ROLE MANIFESTATION"], ["05", "TENSION FIELD"], ["06", "EVOLUTION PATHS"]]) {
      const html = renderToString(<OrbitalResonanceBubble stageId={stageId} stageName={stageName} subtitle="s" itemCount={0} />);
      expect(html).toContain(stageId);
      expect(html).toContain(stageName);
      expect(html).toContain("0 items");
    }
  });

  it("should render SemanticCareerIntelligenceField in pure Zero-State without fake fallback data", () => {
    // The original PERSON field keeps the complete six-orbit Planetarium surface; Role Discovery remains a backend concern here.
    const html = renderToString(<SemanticCareerIntelligenceField data={EMPTY_CAREER_INTELLIGENCE_DATA} investigationMode="PERSON" />);

    // Basic layout asserts
    expect(html).toContain("SYNTX CORE • ORGANISM");
    expect(html).toContain("CAPABILITY FIELD");
    expect(html).toContain("RESONANCE ORBITS");
    expect(html).toContain("ROLE MANIFESTATION");
    expect(html).toContain("TENSION FIELD");
    expect(html).toContain("EVOLUTION PATHS");
    
    // Explicitly assert that 0 items exist across orbits
    expect(html).toContain("0 items"); // Should appear for orbits 01 and 02
    
    // Explicitly assert that NO demo data exists
    expect(html).not.toContain("Helsing");
    expect(html).not.toContain("Anduril");
    expect(html).not.toContain("Siemens");
    expect(html).not.toContain("Senior_Systems_Architect_CV.pdf");
    expect(html).not.toContain("Distributed Real-Time Sensor Processing");
    expect(html).not.toContain("DO-178C Safety Critical Avionics Certification");

    // Explicitly assert that NO fake fallback clusters exist
    expect(html).not.toContain("Core Architecture Cluster");
    expect(html).not.toContain("Semantic Resonance Vector");
  });

  it("should render CareerIntelligenceDashboard directly showing the Continuous Semantic Field", () => {
    const html = renderToString(<CareerIntelligenceDashboard data={EMPTY_CAREER_INTELLIGENCE_DATA} />);
    // Job Pool first (owner "JOB POOL FIRST / CAPABILITY GATE", 2026-10-14): the application opens in the Job Field context.
    expect(html).toContain("DECISION LOOP LABS");
    expect(html).toContain("/ SYNTX — SEMANTIC CAREER INTELLIGENCE FIELD");
    expect(html).toContain('data-testid="semantic-career-intelligence-field"');
  });
});

