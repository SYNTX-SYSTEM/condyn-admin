import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { OrbitalResonanceBubble } from "../app/components/career/demo/OrbitalResonanceBubble";

describe("OrbitalResonanceBubble Source Presentation Wiring", () => {
  it("should render runtime source provenance in the hover manifestation", () => {
    // Define the valid runtime source presentation payload
    const sourcePresentation = {
      count: 1,
      labels: ["TXT"],
      titles: ["Manuelle Text-Eingabe"]
    };

    // Attempt to render the component with the prop.
    // If the component has an out-of-scope lexical reference to `sourcePresentation`,
    // this will throw a ReferenceError in node/JS.
    let renderedHtml = "";
    try {
      renderedHtml = renderToString(
        <OrbitalResonanceBubble
          stageId="01"
          stageName="TEST"
          subtitle="TEST"
          itemCount={1}
          isHovered={true}
          sourcePresentation={sourcePresentation}
        />
      );
    } catch (e: any) {
      // We expect the test framework to catch and report the error if it fails.
      // But we can also explicitly fail if an error is thrown.
      throw e;
    }

    // It should render TXT and NOT hardcoded fallbacks
    expect(renderedHtml).toContain("TXT");
    expect(renderedHtml).not.toContain("PDF");
    expect(renderedHtml).not.toContain("GitHub");
    expect(renderedHtml).not.toContain("Website");
  });
});
