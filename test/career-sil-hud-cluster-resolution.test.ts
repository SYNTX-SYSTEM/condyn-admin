import { describe, it, expect } from "vitest";

import {
  resolveSilHudClusterId
} from "../app/components/career/demo/SemanticCareerIntelligenceField";

describe("SIL HUD cluster identity resolution", () => {
  const data: any = {
    sources: [
      {
        sourceKind: "PDF",
        sourceTitle: "Source.pdf",
        contentHash: "HASH"
      }
    ],

    capabilities: [
      {
        id: "CAP_001",
        name: "Capability"
      }
    ],

    companyMatches: [
      {
        organizationId: "ORG_001",
        organizationName: "Organisation"
      }
    ],

    roleMatches: [
      {
        roleId: "ROLE_001",
        roleTitle: "Architect"
      }
    ],

    capabilityGaps: [
      {
        capabilityName: "Gap"
      }
    ],

    nextActions: [
      {
        actionId: "ACT_001",
        title: "Action"
      }
    ]
  };

  it("01 resolves the real projected source cluster", () => {
    expect(resolveSilHudClusterId("01", data)).toBe("cl-01-0");
  });

  it("02 resolves capability id", () => {
    expect(resolveSilHudClusterId("02", data)).toBe("CAP_001");
  });

  it("03 resolves organizationId", () => {
    expect(resolveSilHudClusterId("03", data)).toBe("ORG_001");
  });

  it("04 resolves roleId", () => {
    expect(resolveSilHudClusterId("04", data)).toBe("ROLE_001");
  });

  it("05 resolves the deterministic projected gap cluster without inventing another identity", () => {
    expect(resolveSilHudClusterId("05", data)).toBe("cl-05-0");
  });

  it("06 resolves actionId", () => {
    expect(resolveSilHudClusterId("06", data)).toBe("ACT_001");
  });

  it("returns null when the selected orbit contains no projected item", () => {
    expect(
      resolveSilHudClusterId("03", {
        ...data,
        companyMatches: []
      })
    ).toBeNull();

    expect(
      resolveSilHudClusterId("05", {
        ...data,
        capabilityGaps: []
      })
    ).toBeNull();

    expect(
      resolveSilHudClusterId("06", {
        ...data,
        nextActions: []
      })
    ).toBeNull();
  });
});
