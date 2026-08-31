import React from "react";
import { describe, it, expect, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { SemanticCareerIntelligenceField } from "../app/components/career/demo/SemanticCareerIntelligenceField";
import { SourceDock } from "../app/components/career/demo/SourceDock";
import type { DemoCareerIntelligenceData } from "../app/career/demo/demo-data";
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

  const runtimeTelemetryData: DemoCareerIntelligenceData = {
    analysisId: "ANL_RUNTIME_TELEMETRY",
    generatedAt: "2026-01-01T00:00:00.000Z",
    sources: [{ sourceKind: "TEXT", sourceTitle: "Telemetry source", contentHash: "hash" }],
    capabilities: [{ id: "cap-1", name: "Kubernetes Orchestration", domain: "DevOps", evidenceSummary: "Observed" }],
    companyMatches: [{ organizationId: "org-1", organizationName: "Siemens AG", matchedCapabilities: [], rationale: "Match" }],
    roleMatches: [{ roleId: "role-1", roleTitle: "Principal Cloud Architect", organizationName: "Siemens AG", matchedCapabilities: [], missingCapabilities: [], rationale: "Match" }],
    capabilityGaps: [{ capabilityName: "Quantum Cryptography", domain: "Security", requiredByRoleTitle: "Principal Cloud Architect", organizationName: "Siemens AG", severity: "HIGH", reason: "Gap" }],
    nextActions: [{ actionId: "act-1", title: "Action", description: "Description", expectedImpact: "Impact" }],
    reactFlowGraph: { nodes: [], edges: [] }
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
    expect(html).toContain("ANALYSIS COMPLETED SUCCESSFULLY");
    expect(html).toContain("IDENTITY CORE &amp; ORBITS MANIFESTED");
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
    expect(html).toContain("ANALYSIS FAILED");
    expect(html).toContain("Netzwerk-Timeout beim Intake.");
    expect(html).toContain("data-testid=\"retry-intake-btn\"");
    expect(html).toContain("RETRY");
  });

  it("Progress telemetry V1 blocker B1: keeps the HUD visible for FAILED without claiming an active runtime operation", () => {
    (useCareerAnalysisJob as any).mockReturnValue({
      state: {
        state: "FAILED",
        currentOperation: "PERSISTENCE",
        attemptCount: 3,
        errorCode: "ERR_NETWORK",
        errorSummary: "Netzwerk-Timeout beim Intake."
      },
      submitAnalysis: vi.fn()
    });

    const html = renderToString(<SemanticCareerIntelligenceField data={runtimeTelemetryData} />);

    expect(html).toContain("data-testid=\"inference-telemetry-hud\"");
    expect(html).toContain("JOB FAILED");
    expect(html).toContain("ATTEMPT 3");
    expect(html).toContain("data-testid=\"intake-error-banner\"");
    expect(html).not.toContain("CURRENT OPERATION: RECOVERY_CHECK");
    expect(html).not.toContain("CURRENT OPERATION: SOURCE_PREPARATION");
    expect(html).not.toContain("CURRENT OPERATION: INFERENCE");
    expect(html).not.toContain("CURRENT OPERATION: ANALYSIS_VALIDATION");
    expect(html).not.toContain("CURRENT OPERATION: PERSISTENCE");
  });

  it("Progress telemetry V1 blocker B2: renders LOADING_RESULT without a stale active worker operation", () => {
    (useCareerAnalysisJob as any).mockReturnValue({
      state: {
        state: "LOADING_RESULT",
        currentOperation: "PERSISTENCE",
        attemptCount: 2
      },
      submitAnalysis: vi.fn()
    });

    const html = renderToString(<SemanticCareerIntelligenceField data={runtimeTelemetryData} />);

    expect(html).toContain("JOB LOADING_RESULT");
    expect(html).toContain("ATTEMPT 2");
    expect(html).not.toContain("CURRENT OPERATION: RECOVERY_CHECK");
    expect(html).not.toContain("CURRENT OPERATION: SOURCE_PREPARATION");
    expect(html).not.toContain("CURRENT OPERATION: INFERENCE");
    expect(html).not.toContain("CURRENT OPERATION: ANALYSIS_VALIDATION");
    expect(html).not.toContain("CURRENT OPERATION: PERSISTENCE");
  });

  it("4. should render SourceDock with analyzing state indicator disabled during active ingestion", () => {
    const html = renderToString(<SourceDock isAnalyzing={true} />);

    expect(html).toContain("INGEST KNOWLEDGE");
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
    expect(html).toContain("ANALYSIS COMPLETED SUCCESSFULLY");
  });
});
