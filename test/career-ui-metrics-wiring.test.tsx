import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { OrbitalResonanceBubble } from "../app/components/career/demo/OrbitalResonanceBubble";

describe("OrbitalResonanceBubble Metrics Wiring (BUG 006A)", () => {
  it("should NOT fabricate fallback metrics when secondaryMetrics is missing", () => {
    // Setup a valid minimal field configuration with NO secondaryMetrics prop.
    // Use itemCount = 3 to trigger the production fabrication: Math.max(12, 3 * 14) = 42
    // and confidence = "96%".
    
    const renderedHtml = renderToString(
      <OrbitalResonanceBubble
        stageId="02"
        stageName="CAPABILITY FIELD"
        subtitle="Semantischer Kern"
        itemCount={3}
        isActive={true}
      />
    );

    // Assert that the component does NOT render runtime metric presentation for CONFIDENCE
    expect(renderedHtml).not.toContain("96%");
    
    // Assert that the component does NOT render runtime metric presentation for EVIDENCE DENSITY
    expect(renderedHtml).not.toContain("42 Objects");
    
    // The missing metric must NOT equal a fabricated metric.
  });

  it("should render explicit secondaryMetrics when provided", () => {
    // Control test to preserve the explicit metric contract
    const explicitMetrics = {
      confidence: "81%",
      evidence: "7 Objects",
      state: "Verified"
    };

    const renderedHtml = renderToString(
      <OrbitalResonanceBubble
        stageId="02"
        stageName="CAPABILITY FIELD"
        subtitle="Semantischer Kern"
        itemCount={3}
        isActive={true}
        secondaryMetrics={explicitMetrics}
      />
    );

    // The component may render exactly the supplied values.
    expect(renderedHtml).toContain("81%");
    expect(renderedHtml).toContain("7 Objects");
  });
});
