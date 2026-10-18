import { describe, expect, it } from "vitest";
import { compactRoleOrbit, ROLE_ORBIT_CARD_GAP, ROLE_ORBIT_CENTRE_CLEARANCE, ROLE_ORBIT_COMPACTNESS, syntxCosmosLayout, syntxCosmosPacking } from "../../../lib/career/job-pool/syntx-manifestation-layout";
import type { CapabilityCosmosLayout } from "../../../lib/career/view-model/capability-cosmos-layout";

/* ROLE ORBIT REFINEMENT (owner "SFE — GRÜN | ROLE ORBIT REFINEMENT", 2026-10-18): the organization cosmos' role orbit drawn closer
 * to the organization centre as far as the geometry allows; cards, order, phases and periods unchanged. */
const TITLES = ["Senior Full-Stack Engineer – Shipment Tracking", "Platform Reliability Engineer", "Data Engineer", "Engineering Manager, Payments Infrastructure and Settlement", "QA Lead", "Product Designer", "Machine Learning Engineer (Ranking)", "DevOps Engineer", "Security Analyst", "Frontend Engineer", "Backend Engineer (Go)", "Technical Writer", "Solutions Architect", "Site Reliability Engineer II"];
const roles = (count: number) => Array.from({ length: count }, (_, index) => ({ id: `ROLE_${String(index).padStart(2, "0")}`, title: TITLES[index % TITLES.length] }));
/** Level boxes of the organization cosmos (stage width × stage height less the level insets and the card clearance). */
const BOXES: Array<[number, number]> = [[1600, 740], [1280, 700], [1920, 820], [1440, 700], [1024, 700], [1200, 500]];
const COUNTS = [1, 2, 3, 5, 8, 10, 14, 24, 53];
const PHASES = Array.from({ length: 360 }, (_, index) => (index * Math.PI) / 180);

/** An independent reading of the drawn orbit: every card on its own ellipse point at every degree of the turn. */
function point(layout: CapabilityCosmosLayout, node: CapabilityCosmosLayout["nodes"][number], phase: number) {
  const ring = layout.rings.find(item => item.index === node.ringIndex)!;
  return { x: Math.cos(node.angle + phase) * ring.radiusX, y: Math.sin(node.angle + phase) * ring.radiusY };
}
function centreAir(layout: CapabilityCosmosLayout): number {
  let air = Infinity;
  for (const node of layout.nodes) for (const phase of PHASES) { const p = point(layout, node, phase); air = Math.min(air, Math.hypot(Math.max(0, Math.abs(p.x) - node.width / 2), Math.max(0, Math.abs(p.y) - node.height / 2))); }
  return air;
}
function separation(layout: CapabilityCosmosLayout, sameOrbit: boolean, phases: number[]): number {
  let air = Infinity;
  for (const a of layout.nodes) for (const b of layout.nodes) {
    if (a.id >= b.id || (a.ringIndex === b.ringIndex) !== sameOrbit) continue;
    for (const phase of phases) { const p = point(layout, a, phase), q = point(layout, b, phase); air = Math.min(air, Math.max(Math.abs(p.x - q.x) - (a.width + b.width) / 2 - ROLE_ORBIT_CARD_GAP.x, Math.abs(p.y - q.y) - (a.height + b.height) / 2 - ROLE_ORBIT_CARD_GAP.y)); }
  }
  return air;
}
const packed = (count: number, width: number, height: number) => syntxCosmosPacking(roles(count), width, height).layout;

describe("role orbit refinement (organization cosmos)", () => {
  it("draws the orbit of an organization with a few roles 22 % closer on both axes at every common viewport", () => {
    expect(ROLE_ORBIT_COMPACTNESS).toBe(0.78);
    for (const [width, height] of BOXES.slice(0, 3)) for (const count of [1, 2, 3, 5]) {
      const { layout, compactness } = syntxCosmosLayout(roles(count), width, height);
      const before = packed(count, width, height);
      expect(compactness, `${count} roles at ${width} × ${height}`).toEqual({ x: 0.78, y: 0.78 });
      layout.rings.forEach((ring, index) => {
        expect(ring.radiusX).toBeCloseTo(before.rings[index].radiusX * 0.78, 1);
        expect(ring.radiusY).toBeCloseTo(before.rings[index].radiusY * 0.78, 1);
      });
    }
  });

  it("keeps every card, its title, size, order, phase and orbit, every orbit its period and the centre; only the radii change", () => {
    for (const [width, height] of BOXES) for (const count of COUNTS) {
      const before = packed(count, width, height);
      const { layout, compactness } = compactRoleOrbit(before);
      expect(layout.nodes.map(({ id, title, width: w, height: h, angle, ringIndex, visualMass }) => ({ id, title, w, h, angle, ringIndex, visualMass }))).toEqual(before.nodes.map(({ id, title, width: w, height: h, angle, ringIndex, visualMass }) => ({ id, title, w, h, angle, ringIndex, visualMass })));
      expect(layout.rings.map(ring => [ring.index, ring.periodSeconds])).toEqual(before.rings.map(ring => [ring.index, ring.periodSeconds]));
      expect([layout.width, layout.height, layout.centerX, layout.centerY, layout.staticPositions]).toEqual([before.width, before.height, before.centerX, before.centerY, before.staticPositions]);
      expect(compactness.x).toBeGreaterThanOrEqual(ROLE_ORBIT_COMPACTNESS);
      expect(compactness.y).toBeGreaterThanOrEqual(ROLE_ORBIT_COMPACTNESS);
      // A satellite stays on its drawn orbit: the stored rest point is the ellipse point at its phase.
      if (!layout.staticPositions) for (const node of layout.nodes) { const p = point(layout, node, 0); expect(node.x).toBeCloseTo(layout.centerX + p.x, 1); expect(node.y).toBeCloseTo(layout.centerY + p.y, 1); }
    }
  });

  it("keeps its air in every phase: to the centre body, between neighbours on an orbit; across orbits never closer than the packing at rest", () => {
    let drawnIn = 0;
    for (const [width, height] of BOXES) for (const count of COUNTS) {
      const before = packed(count, width, height);
      const { layout, compactness } = compactRoleOrbit(before);
      if (compactness.x === 1 && compactness.y === 1) continue;
      drawnIn += 1;
      const label = `${count} roles at ${width} × ${height}`;
      // The orbit is checked every 5°; read here every 1°, a card may come up to a pixel closer between two checked phases.
      expect(centreAir(layout), label).toBeGreaterThanOrEqual(ROLE_ORBIT_CENTRE_CLEARANCE - 1);
      expect(separation(layout, true, PHASES), label).toBeGreaterThanOrEqual(-1);
      expect(separation(layout, false, [0]), label).toBeGreaterThanOrEqual(Math.min(0, separation(before, false, [0])) - 0.01);
    }
    expect(drawnIn).toBeGreaterThan(20);
  });

  it("stays as packed where the geometry leaves no room, and for the static grid fallback and an empty organization", () => {
    const crowded = packed(14, 1600, 740);
    expect(compactRoleOrbit(crowded)).toEqual({ layout: crowded, compactness: { x: 1, y: 1 } });
    const grid = packed(24, 1280, 700);
    expect(grid.staticPositions).toBe(true);
    expect(compactRoleOrbit(grid).layout).toBe(grid);
    const empty = packed(0, 1600, 740);
    expect(compactRoleOrbit(empty)).toEqual({ layout: empty, compactness: { x: 1, y: 1 } });
  });

  it("is deterministic and draws in no further than the target", () => {
    for (const [width, height] of BOXES) for (const count of COUNTS) expect(syntxCosmosLayout(roles(count), width, height)).toEqual(syntxCosmosLayout(roles(count), width, height));
    expect(compactRoleOrbit(packed(2, 1600, 740), 0.5).compactness.x).toBeLessThan(0.78);
    expect(compactRoleOrbit(packed(2, 1600, 740)).compactness).toEqual({ x: 0.78, y: 0.78 });
  });
});
