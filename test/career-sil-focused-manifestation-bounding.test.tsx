import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";

import {
  getTooltipPlacement,
  OrbitalResonanceBubble
} from "../app/components/career/demo/OrbitalResonanceBubble";

describe("SIL focused manifestation viewport bounding", () => {
  it("keeps the bottom Role Manifestation inside the field by resolving upward", () => {
    expect(getTooltipPlacement(90, "04")).toBe("top");
  });

  it("uses inward placement for every orbit edge without an L0 overlay", () => {
    expect(getTooltipPlacement(270, "01")).toBe("bottom");
    expect(getTooltipPlacement(330, "02")).toBe("bottom-left");
    expect(getTooltipPlacement(30, "03")).toBe("top-left");
    expect(getTooltipPlacement(90, "04")).toBe("top");
    expect(getTooltipPlacement(150, "05")).toBe("top-right");
    expect(getTooltipPlacement(210, "06")).toBe("bottom-right");
  });

  it("couples the Orbit 04 tether to its upward manifestation placement", () => {
    const html = renderToString(
      <OrbitalResonanceBubble
        stageId="04"
        stageName="⎔ ROLE MANIFESTATION"
        subtitle="Concrete role manifestations"
        itemCount={1}
        previewItems={["Systems Architect"]}
        angle={90}
        isHovered
      />
    );

    expect(html).toContain("hud-preview--top");
    expect(html).toContain('data-testid="orbital-tether-04"');
    expect(html).toContain('y2="20"');
  });

  it("keeps a populated focused orbit manifestation renderable", () => {
    const html = renderToString(
      <OrbitalResonanceBubble
        stageId="03"
        stageName="◎ RESONANCE ORBITS"
        subtitle="Organisation resonance"
        itemCount={1}
        previewItems={["Example Organisation"]}
        angle={30}
        isHovered
      />
    );

    expect(html).toContain('data-testid="orbital-preview-03"');
    expect(html).toContain("Example Organisation");
  });
});
