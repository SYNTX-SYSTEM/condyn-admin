import { describe, expect, it } from "vitest";
import { buildSourceSatellitePresentation } from "../lib/career/view-model/source-satellite-presentation";

describe("source satellite presentation", () => {
  it("turns a raw PDF filename into a semantic display title", () => {
    expect(
      buildSourceSatellitePresentation({
        sourceTitle: "SYNTX_Dossier_Kap6_FINAL.pdf",
        sourceKind: "DOCUMENT"
      })
    ).toEqual({
      kind: "PDF",
      kindLabel: "PDF",
      glyph: "▣",
      displayTitle: "SYNTX Dossier · Kapitel 6",
      secondaryLabel: "DOCUMENT SOURCE"
    });
  });

  it("preserves repository naming while classifying GitHub", () => {
    expect(
      buildSourceSatellitePresentation({
        sourceTitle: "syntx-proxima-reconstruction-console",
        sourceKind: "GITHUB",
        sourceUri: "https://github.com/SYNTX-SYSTEM/syntx-proxima-reconstruction-console"
      })
    ).toMatchObject({
      kind: "GITHUB",
      kindLabel: "GITHUB",
      glyph: "⌘",
      displayTitle: "syntx-proxima-reconstruction-console",
      secondaryLabel: "REPOSITORY SOURCE"
    });
  });

  it.each([
    ["README.md", "TEXT", "MARKDOWN"],
    ["architecture.odt", "DOCUMENT", "ODF"],
    ["https://syntx-system.com", "WEBSITE", "WEB"],
    ["pasted text", "TEXT", "TEXT"]
  ])("classifies %s as %s", (sourceTitle, sourceKind, expectedKind) => {
    expect(
      buildSourceSatellitePresentation({ sourceTitle, sourceKind }).kind
    ).toBe(expectedKind);
  });
});
