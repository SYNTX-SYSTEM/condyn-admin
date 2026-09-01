import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { CapabilityCosmosView } from "../app/components/career/demo/CapabilityCosmosView";
import { OrbitalCosmosView } from "../app/components/career/demo/OrbitalCosmosView";

const capability = [{ id: "CAP_01", title: "Real proposal", evidenceCount: 1, dx: 0, dy: 0, evidences: [], projectionState: "PROPOSED" as const }];
const item = (id: string) => [{ id, title: `Real ${id}`, secondary: [] }];

function position(html: string, testId: string) {
  const match = html.match(new RegExp(`data-orbital-motion-x="([^"]+)" data-orbital-motion-y="([^"]+)"[\\s\\S]*?data-testid="${testId}"`));
  return match?.slice(1, 3).join(",");
}

describe("F12 shared rendered orbital motion", () => {
  it("moves a rendered Capability satellite over deterministic animation time while keeping it upright", () => {
    const start = renderToString(<CapabilityCosmosView clusters={capability} onSelectCluster={() => {}} onExit={() => {}} motionElapsedMs={0} />);
    const later = renderToString(<CapabilityCosmosView clusters={capability} onSelectCluster={() => {}} onExit={() => {}} motionElapsedMs={18_000} />);
    expect(position(start, "capability-cosmos-node-CAP_01")).not.toBe(position(later, "capability-cosmos-node-CAP_01"));
    expect(later).toContain('data-card-orientation="viewport-upright"');
    expect(later).toContain('data-orbital-motion-driver="shared-rAF"');
  });

  it.each([["01", "IDENTITY CORE", "SOURCE"], ["03", "RESONANCE ORBITS", "ORG"], ["04", "ROLE MANIFESTATION", "ROLE"], ["05", "TENSION FIELD", "GAP"], ["06", "EVOLUTION PATHS", "ACTION"]] as const)("moves rendered Stage %s satellite over time", (stageId, stageName, id) => {
    const start = renderToString(<OrbitalCosmosView stageId={stageId} stageName={stageName} items={item(id)} onSelectItem={() => {}} onExit={() => {}} motionElapsedMs={0} />);
    const later = renderToString(<OrbitalCosmosView stageId={stageId} stageName={stageName} items={item(id)} onSelectItem={() => {}} onExit={() => {}} motionElapsedMs={18_000} />);
    expect(position(start, `orbital-cosmos-node-${id}`)).not.toBe(position(later, `orbital-cosmos-node-${id}`));
    expect(later).toContain('data-card-orientation="viewport-upright"');
  });

  it("does not fabricate a moving satellite for zero-item Tension", () => {
    const html = renderToString(<OrbitalCosmosView stageId="05" stageName="TENSION FIELD" items={[]} onSelectItem={() => {}} onExit={() => {}} motionElapsedMs={18_000} />);
    expect(html).toContain('data-testid="orbital-cosmos-empty-05"');
    expect(html).not.toContain("orbital-cosmos-node-");
  });
});
