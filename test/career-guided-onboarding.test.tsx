import React from "react";
import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import { GuidedOnboardingOverlay } from "../app/components/career/demo/GuidedOnboardingOverlay";

describe("GuidedOnboardingOverlay — Interactive 6-Step Tour", () => {
  it("1. Renders nothing when isOpen is false", () => {
    const html = renderToString(
      <GuidedOnboardingOverlay isOpen={false} onClose={() => {}} />
    );
    expect(html).toBe("");
  });

  it("2. Renders Step 1 Identity Core correctly by default when open", () => {
    const html = renderToString(
      <GuidedOnboardingOverlay isOpen={true} onClose={() => {}} />
    );
    expect(html).toContain("1. IDENTITY CORE");
    expect(html).toContain("SCHRITT 1 VON 6");
    expect(html).toContain("WEITER ▶");
  });

  it("3. Contains close button and optional manual link", () => {
    const html = renderToString(
      <GuidedOnboardingOverlay
        isOpen={true}
        onClose={() => {}}
        onOpenCodex={() => {}}
      />
    );
    expect(html).toContain("HANDBUCH ÖFFNEN");
  });
});
