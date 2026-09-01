import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { CapabilityCosmosView } from "../app/components/career/demo/CapabilityCosmosView";
import { CapabilityDeepFocusView } from "../app/components/career/demo/CapabilityDeepFocusView";
import { OrbitalResonanceBubble } from "../app/components/career/demo/OrbitalResonanceBubble";

const clusters = [{
  id: "PCAP_COSMOS",
  title: "Mehrschichtige Unterlassungsverantwortungsarchitektur",
  evidenceCount: 2,
  confidence: undefined,
  projectionState: "PROPOSED" as const,
  evidenceState: "EVIDENCE_PASSED" as const,
  semanticDefinitionState: "NOT_RUN" as const,
  dx: 0,
  dy: 0,
  evidences: []
}];

describe("F12 Capability Cosmos view", () => {
  it("renders a Stage-02-only Cosmos with upright proposal nodes and static reduced-motion support", () => {
    const html = renderToString(
      <CapabilityCosmosView
        clusters={clusters}
        onSelectCluster={() => {}}
        onExit={() => {}}
      />
    );
    expect(html).toContain('data-testid="capability-cosmos-view"');
    expect(html).toContain('data-testid="capability-cosmos-center"');
    expect(html).toContain('data-testid="capability-cosmos-node-PCAP_COSMOS"');
    expect(html).toContain("PROPOSED");
    expect(html).toContain("EVIDENCE PASSED");
    expect(html).toContain("SEMANTIC DEFINITION NOT RUN");
    expect(html).not.toContain("confidence");
    expect(html).toContain("prefers-reduced-motion");
    expect(html).toContain("rotateCounterClockwise");
  });

  it("gives the existing hover HUD a quiet, near-opaque observation surface without moving its tether", () => {
    const html = renderToString(
      <OrbitalResonanceBubble
        stageId="02"
        stageName="Capability Field"
        subtitle="Proposal clusters"
        itemCount={1}
        isHovered
      />
    );
    expect(html).toContain("#02070d");
    expect(html).toContain("radial-gradient");
    expect(html).toContain("inset 0 0 54px rgba(0, 0, 0, 0.88)");
    expect(html).toContain("quietUniverseDust");
    expect(html).toContain('data-opaque-hud-surface="true"');
    expect(html).toContain("background:#02070d");
    expect(html).toContain("opacity:1");
    expect(html).not.toContain("background-blend-mode:screen");
    expect(html).toContain('data-testid="orbital-preview-02"');
    expect(html).toContain('data-testid="orbital-tether-02"');
  });

  it("renders a selected proposal capability as the L2 focus nucleus with attached real evidence and subordinate satellites", () => {
    const deepClusters = [
      {
        ...clusters[0],
        evidences: [{
          id: "evidence-01",
          sourceType: "SOURCE_MATCH_VERIFIED",
          title: "Existing source match",
          snippet: "Real proposal evidence"
        }]
      },
      {
        ...clusters[0],
        id: "PCAP_SATELLITE",
        title: "Weitere Fähigkeit",
        evidences: []
      }
    ];
    const html = renderToString(
      <CapabilityDeepFocusView
        clusters={deepClusters}
        selectedClusterId="PCAP_COSMOS"
        onSelectCluster={() => {}}
        onBack={() => {}}
      />
    );

    expect(html).toContain('data-testid="capability-deep-focus-view"');
    expect(html).toContain('data-testid="capability-focus-nucleus-PCAP_COSMOS"');
    expect(html).toContain('data-testid="capability-focus-evidence-evidence-01"');
    expect(html).toContain('data-testid="capability-focus-satellite-PCAP_SATELLITE"');
    expect(html).toContain("PROPOSED");
    expect(html).toContain("EVIDENCE PASSED");
    expect(html).toContain("SEMANTIC DEFINITION NOT RUN");
    expect(html).not.toContain("confidence");
  });
});
