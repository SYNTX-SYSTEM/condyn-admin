import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { buildOrbitFocusProjection } from "../lib/career/view-model/orbit-focus-projection";
import { buildOrbitalCosmosLayout } from "../lib/career/view-model/orbital-cosmos-layout";
import { resolveOrbitalFocusNavigation } from "../lib/career/view-model/orbital-focus-navigation";
import { OrbitalCosmosView } from "../app/components/career/demo/OrbitalCosmosView";
import { OrbitalDeepFocusView } from "../app/components/career/demo/OrbitalDeepFocusView";
import { EMPTY_CAREER_INTELLIGENCE_DATA } from "../app/career/demo/demo-data";

const data = {
  ...EMPTY_CAREER_INTELLIGENCE_DATA,
  sources: [{ sourceKind: "TEXT", sourceTitle: "Profile evidence", contentHash: "hash-01", sourceDocumentId: "DOC_01" }],
  companyMatches: [{ organizationId: "ORG_01", organizationName: "Condyn", matchedCapabilities: ["CAP_01"], rationale: "Named in the source." }],
  roleMatches: [{ roleId: "ROLE_01", roleTitle: "Integration Architect", organizationName: "Condyn", matchedCapabilities: [], missingCapabilities: [], rationale: "Role evidence." }],
  capabilityGaps: [{ capabilityName: "Long named capability gap", domain: "Architecture", requiredByRoleTitle: "Integration Architect", organizationName: "Condyn", severity: "HIGH" as const, reason: "Existing gap rationale." }],
  nextActions: [{ actionId: "ACT_01", title: "Review evidence", description: "Existing action description.", expectedImpact: "Existing impact." }]
};

describe("F12 generalized orbit-focus contracts", () => {
  it("projects only actual stage items with their existing stage-specific secondary content", () => {
    expect(buildOrbitFocusProjection("01", data)[0]).toMatchObject({ id: "DOC_01", title: "Profile evidence", secondary: ["TEXT", "hash-01"] });
    expect(buildOrbitFocusProjection("03", data)[0]).toMatchObject({ id: "ORG_01", title: "Condyn", secondary: ["Named in the source."] });
    expect(buildOrbitFocusProjection("04", data)[0]).toMatchObject({ id: "ROLE_01", title: "Integration Architect", secondary: ["Condyn", "Role evidence."] });
    expect(buildOrbitFocusProjection("05", data)[0]).toMatchObject({ title: "Long named capability gap", secondary: ["Architecture", "Integration Architect", "Condyn", "HIGH", "Existing gap rationale."] });
    expect(buildOrbitFocusProjection("06", data)[0]).toMatchObject({ id: "ACT_01", title: "Review evidence", secondary: ["Existing action description.", "Existing impact."] });
  });

  it("keeps every stage in L1 first, blocks L2 for zero items, returns L2 to its own L1, and clears selection on stage changes", () => {
    for (const stageId of ["01", "02", "03", "04", "05", "06"] as const) {
      expect(resolveOrbitalFocusNavigation({ activeStageId: null, selectedItemId: null, requestedStageId: stageId, requestedItemId: null, itemIds: ["ITEM"] })).toEqual({ activeStageId: stageId, selectedItemId: null, zoomLevel: 1 });
    }
    expect(resolveOrbitalFocusNavigation({ activeStageId: "05", selectedItemId: null, requestedStageId: "05", requestedItemId: "FAKE", itemIds: [] })).toEqual({ activeStageId: "05", selectedItemId: null, zoomLevel: 1 });
    expect(resolveOrbitalFocusNavigation({ activeStageId: "01", selectedItemId: null, requestedStageId: "01", requestedItemId: "DOC_01", itemIds: ["DOC_01"] })).toEqual({ activeStageId: "01", selectedItemId: "DOC_01", zoomLevel: 2 });
    expect(resolveOrbitalFocusNavigation({ activeStageId: "01", selectedItemId: "DOC_01", requestedStageId: "01", requestedItemId: null, itemIds: ["DOC_01"] })).toEqual({ activeStageId: "01", selectedItemId: null, zoomLevel: 1 });
    expect(resolveOrbitalFocusNavigation({ activeStageId: "01", selectedItemId: "DOC_01", requestedStageId: "03", requestedItemId: null, itemIds: ["ORG_01"] })).toEqual({ activeStageId: "03", selectedItemId: null, zoomLevel: 1 });
  });

  it("keeps one item in L1 and deterministically bounds multi-item satellites without overlap", () => {
    const one = buildOrbitalCosmosLayout({ items: [{ id: "ONLY", title: "Only item" }], width: 1200, height: 760 });
    expect(one.nodes).toHaveLength(1);
    const many = buildOrbitalCosmosLayout({ items: Array.from({ length: 12 }, (_, index) => ({ id: `ITEM_${index}`, title: `Long deterministic item ${index}` })), width: 1280, height: 820 });
    expect(many).toEqual(buildOrbitalCosmosLayout({ items: Array.from({ length: 12 }, (_, index) => ({ id: `ITEM_${index}`, title: `Long deterministic item ${index}` })), width: 1280, height: 820 }));
    for (let left = 0; left < many.nodes.length; left += 1) for (let right = left + 1; right < many.nodes.length; right += 1) {
      const a = many.nodes[left]; const b = many.nodes[right];
      expect(Math.abs(a.x - b.x) < (a.width + b.width) / 2 && Math.abs(a.y - b.y) < (a.height + b.height) / 2).toBe(false);
    }
  });

  it("renders empty L1 without satellites and real L2 with a nucleus plus sibling satellites", () => {
    const empty = renderToString(<OrbitalCosmosView stageId="05" stageName="TENSION FIELD" items={[]} onSelectItem={() => {}} onExit={() => {}} />);
    expect(empty).toContain('data-testid="orbital-cosmos-empty-05"');
    expect(empty).not.toContain("orbital-cosmos-node-");
    const focus = renderToString(<OrbitalDeepFocusView stageId="03" stageName="RESONANCE ORBITS" selectedItemId="ORG_01" items={[{ id: "ORG_01", title: "Condyn", secondary: ["Named in source"] }, { id: "ORG_02", title: "Other", secondary: [] }]} onSelectItem={() => {}} onBack={() => {}} />);
    expect(focus).toContain('data-testid="orbital-focus-nucleus-ORG_01"');
    expect(focus).toContain('data-testid="orbital-focus-satellite-ORG_02"');
    expect(focus).toContain("Named in source");
    expect(focus).toContain("prefers-reduced-motion");
  });
});
