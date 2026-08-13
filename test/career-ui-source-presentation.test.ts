import { describe, it, expect } from "vitest";

import { buildSilSourcePresentation } from "../lib/career/view-model/source-presentation";
import { DemoCareerIntelligenceData } from "../app/career/demo/demo-data";

describe("SIL Source Presentation View Model", () => {
  it("should project current activeData sources to UI view model without demo fallbacks", () => {
    // Simulate activeData post-analysis
    const activeData: DemoCareerIntelligenceData = {
      sources: [
        {
          sourceRef: "doc-hash-1",
          sourceTitle: "Manuelle Text-Eingabe",
          // The schema uses "txt" as the backend capability string in some places, 
          // or we just rely on type or title. The adapter maps this to sourceTitle.
        }
      ],
      capabilities: [],
      companyMatches: [],
      roleMatches: [],
      capabilityGaps: [],
      nextActions: []
    } as any; // Using partial for test brevity

    const presentation = buildSilSourcePresentation(activeData);

    expect(presentation.count).toBe(1);
    expect(presentation.titles).toContain("Manuelle Text-Eingabe");
    // Ensure no demo data leaks in
    expect(presentation.labels).not.toContain("PDF");
    expect(presentation.labels).not.toContain("GitHub");
    expect(presentation.labels).not.toContain("Website");
  });
});
