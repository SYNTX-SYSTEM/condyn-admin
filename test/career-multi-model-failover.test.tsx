import React from "react";
import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import { InferenceTelemetryHUD, InferenceTelemetryData } from "../app/components/career/demo/InferenceTelemetryHUD";
import { SemanticCareerIntelligenceField } from "../app/components/career/demo/SemanticCareerIntelligenceField";

describe("CONDYN Career Analysis Protocol v1.0 — Step 27: Multi-Model Inference Failover Cascade (`test/career-multi-model-failover.test.ts`)", () => {
  const sampleData = {
    sources: [],
    capabilities: [],
    companyMatches: [],
    roleMatches: [],
    capabilityGaps: [],
    nextActions: []
  };

  it("1. should render InferenceTelemetryHUD at bottom right with cascade status", () => {
    const telemetry: InferenceTelemetryData = {
      modelsAttempted: [
        { model: "gemini-2.5-flash", status: "SUCCESS", latencyMs: 240 }
      ],
      activeModel: "gemini-2.5-flash",
      fallbackTriggered: false,
      totalLatencyMs: 240
    };

    const html = renderToString(<InferenceTelemetryHUD telemetry={telemetry} />);
    expect(html).toContain("data-testid=\"inference-telemetry-hud\"");
    expect(html).toContain("INFERENCE CASCADE");
    expect(html).toContain("GEMINI-2.5-FLASH");
    expect(html).toContain("✓ SUCCESS");
  });

  it("2. should render amber overload status when multi-model failover cascade triggered due to 503", () => {
    const telemetry: InferenceTelemetryData = {
      modelsAttempted: [
        { model: "gemini-2.5-flash", status: "RATE_LIMITED", latencyMs: 110, error: "503 High Demand" },
        { model: "gemini-2.0-flash", status: "SUCCESS", latencyMs: 310 }
      ],
      activeModel: "gemini-2.0-flash",
      fallbackTriggered: true,
      totalLatencyMs: 420
    };

    const html = renderToString(<InferenceTelemetryHUD telemetry={telemetry} />);
    expect(html).toContain("data-testid=\"inference-telemetry-hud\"");
    expect(html).toContain("⚠ 503 OVERLOAD");
    expect(html).toContain("GEMINI-2.0-FLASH");
    expect(html).toContain("gemini-2.5-flash");
    expect(html).toContain("gemini-2.0-flash");
  });

  it("3. should render EVALUATING CASCADE status during active analysis phase", () => {
    const html = renderToString(<InferenceTelemetryHUD isAnalyzing={true} />);
    expect(html).toContain("EVALUATING CASCADE...");
  });

  it("4. should render InferenceTelemetryHUD inside SemanticCareerIntelligenceField when inferenceTelemetry is present", () => {
    const html = renderToString(
      <SemanticCareerIntelligenceField
        data={sampleData}
        initialAnalysisState={{
          inferenceTelemetry: {
            modelsAttempted: [
              { model: "gemini-2.5-flash", status: "RATE_LIMITED", latencyMs: 90 },
              { model: "gemini-2.0-flash", status: "SUCCESS", latencyMs: 210 }
            ],
            activeModel: "gemini-2.0-flash",
            fallbackTriggered: true,
            totalLatencyMs: 300
          }
        }}
      />
    );

    expect(html).toContain("data-testid=\"inference-telemetry-hud\"");
    expect(html).toContain("INFERENCE CASCADE");
    expect(html).toContain("⚠ 503 OVERLOAD");
    expect(html).toContain("GEMINI-2.0-FLASH");
  });
});
