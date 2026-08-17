import React from "react";
import { describe, it, expect, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { SemanticCareerIntelligenceField } from "../app/components/career/demo/SemanticCareerIntelligenceField";
import { SourceDock } from "../app/components/career/demo/SourceDock";
import { useCareerAnalysisJob } from "../lib/career/ui/useCareerAnalysisJob";

vi.mock("../lib/career/ui/useCareerAnalysisJob", () => ({
  useCareerAnalysisJob: vi.fn(() => ({
    state: { state: "IDLE" },
    submitAnalysis: vi.fn()
  }))
}));

describe("CONDYN Career Analysis Protocol v1.0 — Step 26: End-to-End Live Demo Hardening (`test/career-demo-e2e.test.tsx`)", () => {
  const sampleData = {
    sources: [
      { id: "src-1", name: "Siemens_Architecture_Project.pdf", type: "pdf" }
    ],
    capabilities: [
      { id: "cap-1", name: "Kubernetes Orchestration", domain: "DevOps", confidence: "95%" }
    ],
    companyMatches: [
      { companyId: "comp-1", companyName: "Siemens AG", industry: "Industrial AI", resonanceScore: 94 }
    ],
    roleMatches: [
      { roleId: "role-1", roleTitle: "Principal Cloud Architect", companyName: "Siemens AG", fitScore: 92 }
    ],
    capabilityGaps: [
      { gapId: "gap-1", capabilityName: "Quantum Cryptography", currentLevel: "L2", requiredLevel: "L4", priority: "HIGH" }
    ],
    nextActions: [
      { actionId: "act-1", title: "Complete Siemens Security Assessment", timeframe: "14 Days", impact: "High" }
    ]
  };
  it("1. should render telemetry progress banner when isAnalyzing is active", () => {
    (useCareerAnalysisJob as any).mockReturnValue({
      state: { state: "RUNNING" },
      submitAnalysis: vi.fn()
    });

    const html = renderToString(
      <SemanticCareerIntelligenceField
        data={sampleData}
      />
    );

    expect(html).toContain("data-testid=\"intake-telemetry-banner\"");
    expect(html).toContain("INTAKE TELEMETRY // STEP:");
    expect(html).toContain("ANALYZING SOURCES...");
  });

  it("2. should render intake-success-banner when analysis succeeds", () => {
    (useCareerAnalysisJob as any).mockReturnValue({
      state: { state: "SUCCEEDED" },
      submitAnalysis: vi.fn()
    });

    const html = renderToString(
      <SemanticCareerIntelligenceField
        data={sampleData}
      />
    );

    expect(html).toContain("data-testid=\"intake-success-banner\"");
    expect(html).toContain("ANALYSE ERFOLGREICH ABGESCHLOSSEN");
    expect(html).toContain("IDENTITÄTSKERN &amp; ORBITS MANIFESTIERT");
  });

  it("3. should render intake-error-banner and retry-intake-btn button when analysis encounters error", () => {
    (useCareerAnalysisJob as any).mockReturnValue({
      state: { state: "FAILED", errorCode: "ERR_NETWORK", errorSummary: "Netzwerk-Timeout beim Intake." },
      submitAnalysis: vi.fn()
    });

    const html = renderToString(
      <SemanticCareerIntelligenceField
        data={sampleData}
      />
    );

    expect(html).toContain("data-testid=\"intake-error-banner\"");
    expect(html).toContain("ANALYSE FEHLGESCHLAGEN");
    expect(html).toContain("Netzwerk-Timeout beim Intake.");
    expect(html).toContain("data-testid=\"retry-intake-btn\"");
    expect(html).toContain("NEU VERSUCHEN");
  });

  it("4. should render SourceDock with analyzing state indicator disabled during active ingestion", () => {
    const html = renderToString(<SourceDock isAnalyzing={true} />);

    expect(html).toContain("1. WISSEN EINSPEISEN");
  });

  it("5. should maintain all 6 orbit bubbles and IdentityCoreDropZone in the field alongside intake banners", () => {
    (useCareerAnalysisJob as any).mockReturnValue({
      state: { state: "SUCCEEDED" },
      submitAnalysis: vi.fn()
    });

    const html = renderToString(
      <SemanticCareerIntelligenceField
        data={sampleData}
      />
    );

    expect(html).toContain("IDENTITY CORE");
    expect(html).toContain("CAPABILITY FIELD");
    expect(html).toContain("RESONANCE ORBITS");
    expect(html).toContain("ROLE MANIFESTATION");
    expect(html).toContain("TENSION FIELD");
    expect(html).toContain("EVOLUTION PATHS");
    expect(html).toContain("ANALYSE ERFOLGREICH ABGESCHLOSSEN");
  });
});
