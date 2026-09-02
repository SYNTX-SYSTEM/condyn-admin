import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { OrbitalResonanceBubble } from "../app/components/career/demo/OrbitalResonanceBubble";

describe("F12 hover HUD compositing root", () => {
  it("keeps the visible HUD and tether outside the dimmable bubble-body opacity subtree", () => {
    const html = renderToString(
      <OrbitalResonanceBubble
        stageId="03"
        stageName="RESONANCE ORBITS"
        subtitle="Live composition case"
        itemCount={1}
        isHovered
        isDimmed
      />
    );
    const wrapperStart = html.indexOf('data-testid="orbital-physics-03"');
    const wrapperEnd = html.indexOf(">", wrapperStart);
    const wrapper = html.slice(wrapperStart, wrapperEnd);

    expect(wrapper).toContain("opacity:1");
    expect(wrapper).not.toContain("opacity:0.52");
    expect(html).toContain('data-testid="orbital-bubble-body-03"');
    expect(html).toContain('data-opaque-hud-surface="true"');
    expect(html).toContain('data-testid="orbital-tether-03"');
  });
});
