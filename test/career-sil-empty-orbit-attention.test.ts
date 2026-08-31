import { describe, it, expect } from "vitest";

import {
  resolveSilOrbitAttentionState
} from "../app/components/career/demo/SemanticCareerIntelligenceField";

const emptyData: any = {
  analysisId: "ANL_EMPTY",
  generatedAt: "2026-08-31T00:00:00.000Z",
  sources: [],
  capabilities: [],
  companyMatches: [],
  roleMatches: [],
  capabilityGaps: [],
  nextActions: [],
  reactFlowGraph: {
    nodes: [],
    edges: []
  }
};

describe("SIL empty-orbit attention semantics", () => {
  it("does not signal empty attention before analysis", () => {
    for (const state of [
      "IDLE",
      "SUBMITTING",
      "PENDING",
      "RUNNING",
      "LOADING_RESULT"
    ]) {
      expect(
        resolveSilOrbitAttentionState(
          "05",
          emptyData,
          state
        )
      ).toBeNull();
    }
  });

  it("does not signal empty attention for a failed analysis", () => {
    expect(
      resolveSilOrbitAttentionState(
        "05",
        emptyData,
        "FAILED"
      )
    ).toBeNull();
  });

  it("signals every empty orbit after successful analysis", () => {
    for (const stageId of [
      "01",
      "02",
      "03",
      "04",
      "05",
      "06"
    ]) {
      expect(
        resolveSilOrbitAttentionState(
          stageId,
          emptyData,
          "SUCCEEDED"
        )
      ).toBe("EMPTY_PROJECTION_ATTENTION");
    }
  });

  it("does not signal an orbit that contains projected data", () => {
    expect(
      resolveSilOrbitAttentionState(
        "03",
        {
          ...emptyData,
          companyMatches: [
            {
              organizationId: "ORG_001",
              organizationName: "Organisation",
              matchedCapabilities: [],
              rationale: "Projected organisation"
            }
          ]
        },
        "SUCCEEDED"
      )
    ).toBeNull();
  });

  it("treats orbit 05 as empty projection attention without claiming a gap", () => {
    expect(
      resolveSilOrbitAttentionState(
        "05",
        emptyData,
        "SUCCEEDED"
      )
    ).toBe("EMPTY_PROJECTION_ATTENTION");
  });

  it("does not invent attention semantics for unknown stages", () => {
    expect(
      resolveSilOrbitAttentionState(
        "99",
        emptyData,
        "SUCCEEDED"
      )
    ).toBeNull();
  });

  it("uses exactly one bounded attention state", () => {
    const state = resolveSilOrbitAttentionState(
      "05",
      emptyData,
      "SUCCEEDED"
    );

    expect(state).toBe("EMPTY_PROJECTION_ATTENTION");

    expect(state).not.toBe("ERROR");
    expect(state).not.toBe("BLOCKED");
    expect(state).not.toBe("GAP");
    expect(state).not.toBe("MISSING_CAPABILITY");
  });
});
