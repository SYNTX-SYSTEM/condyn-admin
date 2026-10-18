import { describe, expect, it } from "vitest";
import { compactRoleOrbit, ROLE_ORBIT_CARD_GAP, ROLE_ORBIT_CARD_HEIGHT_ALLOWANCE, ROLE_ORBIT_CENTRE_CLEARANCE, ROLE_ORBIT_COMPACTNESS, syntxCosmosLayout, syntxCosmosPacking } from "../../../lib/career/job-pool/syntx-manifestation-layout";
import type { CapabilityCosmosLayout } from "../../../lib/career/view-model/capability-cosmos-layout";

/* ROLE ORBIT REFINEMENT (owner "SFE — GRÜN | ROLE ORBIT REFINEMENT", 2026-10-18): the organization cosmos' role orbit drawn closer
 * to the organization centre as far as the geometry allows; cards, order, phases and periods unchanged. */
const TITLES = ["Senior Full-Stack Engineer – Shipment Tracking", "Platform Reliability Engineer", "Data Engineer", "Engineering Manager, Payments Infrastructure and Settlement", "QA Lead", "Product Designer", "Machine Learning Engineer (Ranking)", "DevOps Engineer", "Security Analyst", "Frontend Engineer", "Backend Engineer (Go)", "Technical Writer", "Solutions Architect", "Site Reliability Engineer II"];
/** PINK §3.45 D-RO-1: long and short title sets, where the least air between neighbours fell between the 5° checks. */
const LONG = ["Principal Engineer, Distributed Settlement and Reconciliation Platform", "Head of Clinical Interoperability Gateways and Integration Services", "Senior Staff Engineer – Real-Time Shipment Telemetry and Exception Handling"];
const SHORT = ["QA Lead", "SRE", "Designer", "Analyst"];
const roles = (count: number, titles: string[] = TITLES) => Array.from({ length: count }, (_, index) => ({ id: `ROLE_${String(index).padStart(2, "0")}`, title: titles[index % titles.length] }));
/** Level boxes of the organization cosmos (stage width × stage height less the level insets and the card clearance). */
const BOXES: Array<[number, number]> = [[1600, 740], [1280, 700], [1920, 820], [1440, 700], [1024, 700], [1200, 500]];
const COUNTS = [1, 2, 3, 5, 8, 10, 14, 24, 53];
/** Read every quarter degree, offset from the layout's own half-degree checks. */
const PHASES = Array.from({ length: 1440 }, (_, index) => ((index + 0.5) * Math.PI) / 720);
/** The card as drawn: the packing's estimate plus the allowance for rendered text. */
const drawn = (node: CapabilityCosmosLayout["nodes"][number]) => node.height + ROLE_ORBIT_CARD_HEIGHT_ALLOWANCE;

/** An independent reading of the drawn orbit: every card on its own ellipse point at every degree of the turn. */
function point(layout: CapabilityCosmosLayout, node: CapabilityCosmosLayout["nodes"][number], phase: number) {
  const ring = layout.rings.find(item => item.index === node.ringIndex)!;
  return { x: Math.cos(node.angle + phase) * ring.radiusX, y: Math.sin(node.angle + phase) * ring.radiusY };
}
function centreAir(layout: CapabilityCosmosLayout): number {
  let air = Infinity;
  for (const node of layout.nodes) for (const phase of PHASES) { const p = point(layout, node, phase); air = Math.min(air, Math.hypot(Math.max(0, Math.abs(p.x) - node.width / 2), Math.max(0, Math.abs(p.y) - drawn(node) / 2))); }
  return air;
}
function separation(layout: CapabilityCosmosLayout, sameOrbit: boolean, phases: number[]): number {
  let air = Infinity;
  for (const a of layout.nodes) for (const b of layout.nodes) {
    if (a.id >= b.id || (a.ringIndex === b.ringIndex) !== sameOrbit) continue;
    for (const phase of phases) { const p = point(layout, a, phase), q = point(layout, b, phase); air = Math.min(air, Math.max(Math.abs(p.x - q.x) - (a.width + b.width) / 2 - ROLE_ORBIT_CARD_GAP.x, Math.abs(p.y - q.y) - (drawn(a) + drawn(b)) / 2 - ROLE_ORBIT_CARD_GAP.y)); }
  }
  return air;
}
const packed = (count: number, width: number, height: number, titles: string[] = TITLES) => syntxCosmosPacking(roles(count, titles), width, height).layout;

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
    for (const titles of [TITLES, LONG, SHORT]) for (const [width, height] of [...BOXES, [1366, 700] as [number, number]]) for (const count of [...COUNTS, 6, 12]) {
      const before = packed(count, width, height, titles);
      const { layout, compactness } = compactRoleOrbit(before);
      if (compactness.x === 1 && compactness.y === 1) continue;
      drawnIn += 1;
      const label = `${count} roles (${titles[0].slice(0, 12)}…) at ${width} × ${height}`;
      // The layout checks every half degree; read here between those checks, the air holds within half a pixel.
      expect(centreAir(layout), label).toBeGreaterThanOrEqual(ROLE_ORBIT_CENTRE_CLEARANCE - 0.5);
      expect(separation(layout, true, PHASES), label).toBeGreaterThanOrEqual(-0.5);
      expect(separation(layout, false, [0]), label).toBeGreaterThanOrEqual(Math.min(0, separation(before, false, [0])) - 0.01);
    }
    expect(drawnIn).toBeGreaterThan(60);
  });

  it("keeps its air for variable titles (seeded random title sets of 4 to 80 characters, GELB / PINK §3.45 D-RO-1)", () => {
    const WORDS = ["Senior", "Staff", "Principal", "Engineer", "Platform", "Data", "Settlement", "Clinical", "Interoperability", "Lead", "Manager", "of", "and", "–", "Reliability", "QA", "SRE", "Telemetry", "Gateways", "Architect"];
    let seed = 0x5eed;
    const next = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    const title = () => { let text = WORDS[Math.floor(next() * WORDS.length)]; const length = 4 + Math.floor(next() * 77); while (text.length < length) text += ` ${WORDS[Math.floor(next() * WORDS.length)]}`; return text.slice(0, length); };
    let drawnIn = 0;
    for (let set = 0; set < 6; set += 1) {
      const titles = Array.from({ length: 14 }, title);
      for (const [width, height] of [[1600, 740], [1366, 700], [1280, 700], [1920, 820], [1024, 600]] as Array<[number, number]>) for (const count of [2, 3, 4, 5, 6, 7, 8, 10, 12]) {
        const before = packed(count, width, height, titles);
        const { layout, compactness } = compactRoleOrbit(before);
        if (compactness.x === 1 && compactness.y === 1) continue;
        drawnIn += 1;
        const label = `set ${set}, ${count} roles at ${width} × ${height}`;
        expect(centreAir(layout), label).toBeGreaterThanOrEqual(ROLE_ORBIT_CENTRE_CLEARANCE - 0.5);
        expect(separation(layout, true, PHASES), label).toBeGreaterThanOrEqual(-0.5);
        expect(separation(layout, false, [0]), label).toBeGreaterThanOrEqual(Math.min(0, separation(before, false, [0])) - 0.01);
      }
    }
    expect(drawnIn).toBeGreaterThan(100);
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
