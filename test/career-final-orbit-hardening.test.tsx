import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { EMPTY_CAREER_INTELLIGENCE_DATA } from "../app/career/demo/demo-data";
import { buildOrbitFocusProjection } from "../lib/career/view-model/orbit-focus-projection";
import { buildCapabilityCosmosLayout, positionCosmosNodeAtPhase } from "../lib/career/view-model/capability-cosmos-layout";
import { OrbitalCosmosView } from "../app/components/career/demo/OrbitalCosmosView";
import { CapabilityCosmosView } from "../app/components/career/demo/CapabilityCosmosView";
import { OrbitalResonanceBubble } from "../app/components/career/demo/OrbitalResonanceBubble";

const roleData = {
  ...EMPTY_CAREER_INTELLIGENCE_DATA,
  roleMatches: [{ roleId: "ROLE_REAL", roleTitle: "Systems Architect", organizationName: "Condyn", matchedCapabilities: [], missingCapabilities: [], rationale: "Grounded role context." }]
};

describe("F12 final orbit and role hardening", () => {
  it("projects real Stage-04 roles exactly, keeps zero roles zero, and never carries a prior role into replacement data", () => {
    expect(buildOrbitFocusProjection("04", roleData)).toEqual([{ id: "ROLE_REAL", title: "Systems Architect", secondary: ["Condyn", "Grounded role context."] }]);
    const nextZeroRoleAnalysis = { ...roleData, roleMatches: [] };
    expect(buildOrbitFocusProjection("04", nextZeroRoleAnalysis)).toEqual([]);
    const laterRealRoleAnalysis = { ...nextZeroRoleAnalysis, roleMatches: roleData.roleMatches };
    expect(buildOrbitFocusProjection("04", laterRealRoleAnalysis).map((role) => role.id)).toEqual(["ROLE_REAL"]);
  });

  it("keeps every capability center on its own ellipse throughout phase updates and within viewport bounds", () => {
    for (const count of [1, 3, 7, 12, 18, 24]) {
      const layout = buildCapabilityCosmosLayout({ capabilities: Array.from({ length: count }, (_, index) => ({ id: `CAP_${index}`, title: `Long capability proposal ${index}`, evidenceCount: 2 })), width: 1440, height: 920 });
      for (const phase of [0, 0.17, 0.5, 0.91]) for (const node of layout.nodes) {
        const ring = layout.rings.find((candidate) => candidate.index === node.ringIndex)!;
        const point = positionCosmosNodeAtPhase(layout, node, ring, phase);
        const radiusContract = ((point.x - layout.centerX) / ring.radiusX) ** 2 + ((point.y - layout.centerY) / ring.radiusY) ** 2;
        expect(radiusContract).toBeCloseTo(1, 8);
        expect(point.x - node.width / 2).toBeGreaterThanOrEqual(0);
        expect(point.y - node.height / 2).toBeGreaterThanOrEqual(0);
        expect(point.x + node.width / 2).toBeLessThanOrEqual(layout.width);
        expect(point.y + node.height / 2).toBeLessThanOrEqual(layout.height);
        expect(
          Math.abs(point.x - layout.centerX) < node.width / 2 + 87 &&
          Math.abs(point.y - layout.centerY) < node.height / 2 + 87
        ).toBe(false);
      }
    }
  });

  it("keeps capability and generalized card bodies viewport-upright, including reduced motion", () => {
    const items = [{ id: "ONE", title: "Identity item", secondary: [] }, { id: "TWO", title: "Resonance item", secondary: [] }];
    const generalized = renderToString(<OrbitalCosmosView stageId="01" stageName="IDENTITY CORE" items={items} onSelectItem={() => {}} onExit={() => {}} />);
    const capability = renderToString(<CapabilityCosmosView clusters={items.map((item) => ({ ...item, dx: 0, dy: 0, evidences: [] }))} onSelectCluster={() => {}} onExit={() => {}} />);
    expect(generalized).toContain('data-card-orientation="viewport-upright"');
    expect(capability).toContain('data-card-orientation="viewport-upright"');
    expect(generalized).toContain("prefers-reduced-motion");
    expect(generalized).not.toContain("orbitalCosmosCounterOrbit");
  });

  it("puts literal opaque backing and normal blending on the rendered hover HUD root without changing its tether", () => {
    const html = renderToString(<OrbitalResonanceBubble stageId="03" stageName="RESONANCE ORBITS" subtitle="Test" itemCount={1} isHovered />);
    expect(html).toContain('data-opaque-hud-surface="true"');
    expect(html).toContain('data-hud-composition-root="opaque"');
    expect(html).toContain('data-hud-composition-ancestor="opaque"');
    expect(html).toContain("#02070d");
    expect(html).toContain("opacity:1");
    expect(html).toContain("mix-blend-mode:normal");
    expect(html).toContain("background-blend-mode:normal");
    expect(html).toContain("backdrop-filter:none");
    expect(html).toContain('data-testid="orbital-tether-03"');
  });
});
