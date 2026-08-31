import { describe, it, expect } from "vitest";

import {
  resolveFocusedOrbitEmptyState
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

describe("SIL focused empty-orbit integration contract", () => {
  it("does not expose an empty-state while no orbit is focused", () => {
    expect(
      resolveFocusedOrbitEmptyState(
        null,
        0,
        emptyData,
        "en"
      )
    ).toBeNull();
  });

  it("does not expose a large empty-state in L0 Planetarium", () => {
    expect(
      resolveFocusedOrbitEmptyState(
        "05",
        0,
        emptyData,
        "en"
      )
    ).toBeNull();
  });

  it("explains an empty organisation projection in focused L1", () => {
    const state = resolveFocusedOrbitEmptyState(
      "03",
      1,
      emptyData,
      "en"
    );

    expect(state).not.toBeNull();
    expect(state?.stageId).toBe("03");
    expect(state?.label).toBe("EMPTY FIELD // EXPLAINED");
    expect(state?.title).toBe("NO ORGANISATIONS PROJECTED");
    expect(state?.reason).toBe(
      "The validated analysis contains no organisation entities."
    );
  });

  it("explains the absent capability-gap projection without claiming that no gaps exist", () => {
    const state = resolveFocusedOrbitEmptyState(
      "05",
      1,
      emptyData,
      "en"
    );

    expect(state).not.toBeNull();
    expect(state?.stageId).toBe("05");
    expect(state?.label).toBe("EMPTY FIELD // EXPLAINED");
    expect(state?.title).toBe("NO GAP PROJECTION AVAILABLE");
    expect(state?.reason).toBe(
      "This analysis path currently provides no capability-gap projection to SIL."
    );

    expect(state?.reason).not.toMatch(
      /no gaps exist|no gaps found/i
    );
  });

  it("uses the same global locale for the visible empty-state", () => {
    const state = resolveFocusedOrbitEmptyState(
      "05",
      1,
      emptyData,
      "de"
    );

    expect(state).not.toBeNull();
    expect(state?.label).toBe("LEERES FELD // BEGRÜNDET");
    expect(state?.title).toBe(
      "KEINE LÜCKENPROJEKTION VERFÜGBAR"
    );
    expect(state?.reason).toBe(
      "Dieser Analysepfad stellt SIL aktuell keine Fähigkeitslücken-Projektion bereit."
    );
  });

  it("does not render an empty-state when the focused orbit has projected content", () => {
    expect(
      resolveFocusedOrbitEmptyState(
        "03",
        1,
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
        "en"
      )
    ).toBeNull();
  });

  it("does not invent an empty-state for an unknown stage", () => {
    expect(
      resolveFocusedOrbitEmptyState(
        "99",
        1,
        emptyData,
        "en"
      )
    ).toBeNull();
  });
});
