import { describe, expect, it } from "vitest";
import {
  buildCapabilityCosmosLayout,
  resolveCapabilityCosmosFocus
} from "../lib/career/view-model/capability-cosmos-layout";
import { buildCapabilityDeepFocusLayout } from "../lib/career/view-model/capability-deep-focus-layout";

type Capability = {
  id: string;
  title: string;
  evidenceCount: number;
  modelConfidence?: number;
  proposedDemonstratedLevel?: string;
};

const capabilities = (count: number, title = "Capability"):
  Capability[] => Array.from({ length: count }, (_, index) => ({
    id: `PCAP_${String(index + 1).padStart(2, "0")}`,
    title: `${title} ${index + 1}`,
    evidenceCount: (index % 3) + 1
  }));

function expectValidLayout(items: Capability[], width: number, height: number) {
  const layout = buildCapabilityCosmosLayout({ capabilities: items, width, height });
  expect(layout.nodes).toHaveLength(items.length);
  for (const node of layout.nodes) {
    expect(node.x - node.width / 2).toBeGreaterThanOrEqual(0);
    expect(node.y - node.height / 2).toBeGreaterThanOrEqual(0);
    expect(node.x + node.width / 2).toBeLessThanOrEqual(width);
    expect(node.y + node.height / 2).toBeLessThanOrEqual(height);
  }
  for (let left = 0; left < layout.nodes.length; left += 1) {
    for (let right = left + 1; right < layout.nodes.length; right += 1) {
      const a = layout.nodes[left];
      const b = layout.nodes[right];
      const overlaps =
        Math.abs(a.x - b.x) < (a.width + b.width) / 2 &&
        Math.abs(a.y - b.y) < (a.height + b.height) / 2;
      expect(overlaps, `${a.id} overlaps ${b.id}`).toBe(false);
    }
  }
  return layout;
}

describe("F12 Capability Cosmos focus transition", () => {
  it("selects Cosmos mode only for Stage 02 and returns it to L0 on a second selection", () => {
    expect(resolveCapabilityCosmosFocus(null, "02")).toEqual({ activeStageId: "02", zoomLevel: 1, isCosmos: true });
    expect(resolveCapabilityCosmosFocus(null, "03")).toEqual({ activeStageId: "03", zoomLevel: 1, isCosmos: false });
    expect(resolveCapabilityCosmosFocus("02", "02")).toEqual({ activeStageId: null, zoomLevel: 0, isCosmos: false });
    expect(resolveCapabilityCosmosFocus("02", null)).toEqual({ activeStageId: null, zoomLevel: 0, isCosmos: false });
  });
});

describe("F12 Capability Deep Focus layout", () => {
  it("keeps the selected capability as the deterministic nucleus with bounded satellites and a separate evidence surface", () => {
    const layout = buildCapabilityDeepFocusLayout({
      capabilities: capabilities(7, "Mehrschichtige deutsche Verantwortungsarchitektur"),
      selectedCapabilityId: "PCAP_04",
      width: 1280,
      height: 820
    });

    expect(layout.focus.id).toBe("PCAP_04");
    expect(layout.focus.x).toBe(layout.centerX);
    expect(layout.focus.y).toBeLessThan(layout.evidence.y);
    expect(layout.satellites).toHaveLength(6);
    expect(layout.satellites.every((node) => node.scale < 1 && node.opacity < 1)).toBe(true);

    for (const node of [layout.focus, layout.evidence, ...layout.satellites]) {
      expect(node.x - node.width / 2).toBeGreaterThanOrEqual(0);
      expect(node.y - node.height / 2).toBeGreaterThanOrEqual(0);
      expect(node.x + node.width / 2).toBeLessThanOrEqual(1280);
      expect(node.y + node.height / 2).toBeLessThanOrEqual(820);
    }

    const focusAndEvidenceOverlap =
      Math.abs(layout.focus.x - layout.evidence.x) < (layout.focus.width + layout.evidence.width) / 2 &&
      Math.abs(layout.focus.y - layout.evidence.y) < (layout.focus.height + layout.evidence.height) / 2;
    expect(focusAndEvidenceOverlap).toBe(false);
    expect(buildCapabilityDeepFocusLayout({
      capabilities: capabilities(7, "Mehrschichtige deutsche Verantwortungsarchitektur"),
      selectedCapabilityId: "PCAP_04",
      width: 1280,
      height: 820
    })).toEqual(layout);
  });
});

describe("F12 adaptive Capability Cosmos layout", () => {
  it("keeps one, four, eighteen, and twenty-four capabilities visible and non-overlapping", () => {
    expectValidLayout(capabilities(1), 1280, 820);
    expectValidLayout(capabilities(4), 1280, 820);
    expectValidLayout(capabilities(18), 1280, 820);
    expectValidLayout(capabilities(24), 1440, 920);
  });

  it("fits seven capabilities on one ring when a large viewport has the circumference", () => {
    const layout = expectValidLayout(capabilities(7), 1680, 1000);
    expect(new Set(layout.nodes.map((node) => node.ringIndex))).toEqual(new Set([0]));
  });

  it("adds rings from measured node footprint when twelve capabilities cannot safely share a ring", () => {
    const layout = expectValidLayout(capabilities(12, "Lange Fähigkeitsbezeichnung"), 760, 560);
    expect(new Set(layout.nodes.map((node) => node.ringIndex)).size).toBeGreaterThan(1);
  });

  it("keeps long German compound names inside valid node dimensions", () => {
    const long = capabilities(4, "MehrschichtigeUnternehmensarchitekturverantwortungskoordination");
    const layout = expectValidLayout(long, 1280, 820);
    for (const node of layout.nodes) {
      expect(node.width).toBeLessThanOrEqual(300);
      expect(node.height).toBeGreaterThanOrEqual(72);
    }
  });

  it("is deterministic and preserves stable capability ordering", () => {
    const input = [capabilities(1)[0], capabilities(1)[0], ...capabilities(3)].map((item, index) => ({ ...item, id: `PCAP_STABLE_${index}` }));
    const first = buildCapabilityCosmosLayout({ capabilities: input, width: 1200, height: 800 });
    const second = buildCapabilityCosmosLayout({ capabilities: input, width: 1200, height: 800 });
    expect(second).toEqual(first);
    expect(first.nodes.map((node) => node.id)).toEqual([...input].sort((a, b) => a.id.localeCompare(b.id)).map((item) => item.id));
  });

  it("uses only bounded evidence-count visual mass, never model confidence or proposed level", () => {
    const sameEvidence = [
      { id: "PCAP_A", title: "A", evidenceCount: 2, modelConfidence: 0.01, proposedDemonstratedLevel: "L1" },
      { id: "PCAP_B", title: "B", evidenceCount: 2, modelConfidence: 0.99, proposedDemonstratedLevel: "L6" }
    ];
    const layout = buildCapabilityCosmosLayout({ capabilities: sameEvidence, width: 1000, height: 700 });
    expect(layout.nodes[0].visualMass).toBe(layout.nodes[1].visualMass);
    expect(layout.nodes[0].visualMass).toBeGreaterThanOrEqual(1);
    expect(layout.nodes[0].visualMass).toBeLessThanOrEqual(1.12);
  });
});
