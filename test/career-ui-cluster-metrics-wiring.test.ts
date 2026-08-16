import { describe, it, expect } from "vitest";
import { buildSilClusterPresentation } from "../lib/career/view-model/cluster-presentation";

describe("CONDYN / SYNTX — BUG 006B: Static Cluster Metrics vs Runtime Measurements", () => {
  it("should return empty clusters array in Zero-State to prevent rendering fake metrics", () => {
    // Input: Capability stage (02) and successful live analysis (analysisSuccess = true)
    const activeStageId = "02";
    const analysisSuccess = true;
    const mockSourcePresentation = { labels: ["PDF"], titles: ["Source Grounding"] };

    const clusters = buildSilClusterPresentation(
      activeStageId,
      analysisSuccess,
      mockSourcePresentation,
      { analysisId: "", sources: [] } // EMPTY_CAREER_INTELLIGENCE_DATA
    );

    // Assert that NO fake clusters are returned in Zero-State
    expect(clusters.length).toBe(0);
  });
});
