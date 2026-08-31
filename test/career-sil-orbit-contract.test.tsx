import React from "react";
import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";

import { buildSilClusterPresentation } from "../lib/career/view-model/cluster-presentation";
import { DecisionGraphInspector } from "../app/components/career/demo/DecisionGraphInspector";

describe("SIL v3.0 six-orbit projection contract", () => {
  const sourcePresentation = {
    labels: ["PDF"],
    titles: ["Runtime Source.pdf"]
  };

  const activeData: any = {
    sources: [
      {
        sourceKind: "PDF",
        sourceTitle: "Runtime Source.pdf",
        contentHash: "HASH_1"
      }
    ],

    capabilities: [
      {
        id: "CAP_001",
        name: "Relational System Reconstruction",
        domain: "SYSTEMS",
        evidenceConfidence: 0.98,
        evidenceSummary: "Grounded capability evidence"
      }
    ],

    companyMatches: [
      {
        organizationId: "ORG_001",
        organizationName: "Example Organisation",
        matchedCapabilities: [],
        rationale: "Organisation grounding"
      }
    ],

    roleMatches: [
      {
        roleId: "ROLE_001",
        roleTitle: "Systems Architect",
        organizationName: "Example Organisation",
        matchedCapabilities: [],
        missingCapabilities: [],
        rationale: "Role grounding"
      }
    ],

    capabilityGaps: [
      {
        capabilityName: "Missing Capability",
        domain: "SYSTEMS",
        requiredByRoleTitle: "Systems Architect",
        organizationName: "Example Organisation",
        severity: "HIGH",
        reason: "Derived gap relation"
      }
    ],

    nextActions: [
      {
        actionId: "ACT_001",
        title: "Inspect Evidence Boundary",
        description: "Review evidence boundary",
        expectedImpact: "Improved traceability"
      }
    ]
  };

  it("01 Identity Core projects runtime sources", () => {
    const clusters = buildSilClusterPresentation(
      "01",
      true,
      sourcePresentation,
      activeData
    );

    expect(clusters).toHaveLength(1);
    expect(clusters[0].title).toBe("Runtime Source.pdf");
  });

  it("02 Capability Field preserves capability identity", () => {
    const clusters = buildSilClusterPresentation(
      "02",
      true,
      sourcePresentation,
      activeData
    );

    expect(clusters).toHaveLength(1);
    expect(clusters[0].id).toBe("CAP_001");
    expect(clusters[0].title).toBe("Relational System Reconstruction");
  });

  it("03 Resonance Orbits preserves organizationId", () => {
    const clusters = buildSilClusterPresentation(
      "03",
      true,
      sourcePresentation,
      activeData
    );

    expect(clusters).toHaveLength(1);
    expect(clusters[0].id).toBe("ORG_001");
    expect(clusters[0].title).toBe("Example Organisation");
  });

  it("04 Role Manifestation preserves roleId", () => {
    const clusters = buildSilClusterPresentation(
      "04",
      true,
      sourcePresentation,
      activeData
    );

    expect(clusters).toHaveLength(1);
    expect(clusters[0].id).toBe("ROLE_001");
    expect(clusters[0].title).toBe("Systems Architect");
  });

  it("05 Tension Field remains deterministic without inventing evidence", () => {
    const clusters = buildSilClusterPresentation(
      "05",
      true,
      sourcePresentation,
      activeData
    );

    expect(clusters).toHaveLength(1);
    expect(clusters[0].id).toBe("cl-05-0");
    expect(clusters[0].title).toBe("Missing Capability");
    expect(clusters[0].evidences).toHaveLength(0);
  });

  it("06 Evolution Paths preserves actionId", () => {
    const clusters = buildSilClusterPresentation(
      "06",
      true,
      sourcePresentation,
      activeData
    );

    expect(clusters).toHaveLength(1);
    expect(clusters[0].id).toBe("ACT_001");
    expect(clusters[0].title).toBe("Inspect Evidence Boundary");
  });
});

describe("SIL inspector deterministic viewport placement", () => {
  const emptyGraph: any = {
    sourceNodes: [],
    evidenceNodes: [],
    capabilityNodes: [],
    requirementNodes: [],
    jobNodes: [],
    organisationNodes: [],
    edges: []
  };

  it("pins idle inspector to bottom-left without relying on route Tailwind utilities", () => {
    const html = renderToString(
      <DecisionGraphInspector
        graph={emptyGraph}
        focus={null}
      />
    );

    expect(html).toContain("position:fixed");
    expect(html).toContain("bottom:24px");
    expect(html).toContain("left:24px");
  });
});
