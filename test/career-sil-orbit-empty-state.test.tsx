import React from "react";
import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";

import {
  buildSilOrbitEmptyState
} from "../lib/career/view-model/orbit-empty-state";

import {
  SilOrbitEmptyState
} from "../app/components/career/demo/SilOrbitEmptyState";

describe("SIL orbit explained empty-state contract", () => {
  const emptyData: any = {
    sources: [],
    capabilities: [],
    companyMatches: [],
    roleMatches: [],
    capabilityGaps: [],
    nextActions: []
  };

  const expected = [
    {
      stageId: "01",
      title: "NO SOURCES PROJECTED",
      reason: "No sources are available in the current analysis state."
    },
    {
      stageId: "02",
      title: "NO CAPABILITIES PROJECTED",
      reason: "The validated analysis contains no projectable capability entities."
    },
    {
      stageId: "03",
      title: "NO ORGANISATIONS PROJECTED",
      reason: "The validated analysis contains no organisation entities."
    },
    {
      stageId: "04",
      title: "NO ROLES PROJECTED",
      reason: "The validated analysis contains no role entities."
    },
    {
      stageId: "05",
      title: "NO GAP PROJECTION AVAILABLE",
      reason: "This analysis path currently provides no capability-gap projection to SIL."
    },
    {
      stageId: "06",
      title: "NO EVOLUTION PATHS PROJECTED",
      reason: "The validated analysis contains no strategy or evolution-path entities."
    }
  ];

  for (const item of expected) {
    it(`${item.stageId} exposes a concrete representation-safe reason`, () => {
      const state = buildSilOrbitEmptyState(item.stageId, emptyData);

      expect(state).not.toBeNull();
      expect(state?.title).toBe(item.title);
      expect(state?.reason).toBe(item.reason);

      const html = renderToString(
        <SilOrbitEmptyState
          stageId={item.stageId}
          state={state!}
        />
      );

      expect(html).toContain("EMPTY FIELD");
      expect(html).toContain(item.title);
      expect(html).toContain(item.reason);

      expect(html).not.toContain(">null<");
      expect(html).not.toContain("undefined");
      expect(html).not.toContain("BLOCKED");
      expect(html).not.toContain("VERIFIED");
      expect(html).not.toContain("NO DATA");
    });
  }

  it("does not claim that zero capability gaps means no gaps exist", () => {
    const state = buildSilOrbitEmptyState("05", emptyData);

    expect(state?.title).toBe("NO GAP PROJECTION AVAILABLE");
    expect(state?.reason).not.toMatch(/no gaps exist|no gaps found/i);
  });

  it("returns null when the orbit actually contains projected items", () => {
    expect(
      buildSilOrbitEmptyState("03", {
        ...emptyData,
        companyMatches: [
          {
            organizationId: "ORG_001",
            organizationName: "Organisation"
          }
        ]
      })
    ).toBeNull();
  });
});
