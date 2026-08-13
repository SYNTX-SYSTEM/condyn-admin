import { describe, it, expect } from "vitest";
import { buildSilClusterPresentation } from "../lib/career/view-model/cluster-presentation";

describe("CONDYN / SYNTX — BUG 006B: Static Cluster Metrics vs Runtime Measurements", () => {
  it("should not fabricate numeric cluster measurements in verified live state", () => {
    // Input: Capability stage (02) and successful live analysis (analysisSuccess = true)
    const activeStageId = "02";
    const analysisSuccess = true;
    const mockSourcePresentation = { labels: ["PDF"], titles: ["Source Grounding"] };

    const clusters = buildSilClusterPresentation(
      activeStageId,
      analysisSuccess,
      mockSourcePresentation
    );

    // Assert cluster labels still exist
    const coreCluster = clusters.find((c) => c.title === "Core Architecture Cluster");
    const vectorCluster = clusters.find((c) => c.title === "Semantic Resonance Vector");
    
    expect(coreCluster).toBeDefined();
    expect(vectorCluster).toBeDefined();

    // Assert the unsupported numeric measurements are not rendered (must be undefined)
    // BUG 006B: Currently fails here because the hardcoded literals "98%" and 14 are returned
    expect(coreCluster?.confidence).toBeUndefined();
    expect(coreCluster?.evidenceCount).toBeUndefined();

    expect(vectorCluster?.confidence).toBeUndefined();
    expect(vectorCluster?.evidenceCount).toBeUndefined();
  });
});
