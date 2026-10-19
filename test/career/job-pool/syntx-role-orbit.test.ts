import { describe, expect, it } from "vitest";
import { compactRoleOrbit, ROLE_ORBIT_CARD_GAP, ROLE_ORBIT_CARD_HEIGHT_ALLOWANCE, ROLE_ORBIT_CENTRE_CLEARANCE, syntxCosmosLayout, syntxCosmosPacking } from "../../../lib/career/job-pool/syntx-manifestation-layout";
import type { CapabilityCosmosLayout } from "../../../lib/career/view-model/capability-cosmos-layout";

/* ROLE ORBIT REFINEMENT (owner "SFE — GRÜN | ROLE ORBIT REFINEMENT", 2026-10-18; "… — SECOND VISUAL REFINEMENT", 2026-10-19): the
 * organization cosmos' role orbit drawn in to the smallest orbit its geometry carries; cards, order, phases and periods unchanged. */
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
/** The packing scaled about its centre by a pair of factors (as the layout draws it in). */
const scaled = (layout: CapabilityCosmosLayout, k: { x: number; y: number }): CapabilityCosmosLayout => ({ ...layout, rings: layout.rings.map(ring => ({ ...ring, radiusX: ring.radiusX * k.x, radiusY: ring.radiusY * k.y })) });

describe("role orbit refinement (organization cosmos)", () => {
  it("draws the orbit of an organization with a few roles in to its geometric minimum, the same orbit in pixels at every viewport", () => {
    const KESTREL = ["Engineering Lead - Routing Platform", "Senior Full-Stack Engineer - Shipment Tracking", "Frontend Architect"];
    for (const count of [1, 2, 3, 5]) for (const titles of [TITLES, KESTREL]) {
      // Every box but the server's 1200 × 500, whose height bounds the vertical axis.
      const orbits = BOXES.slice(0, 5).map(([width, height]) => {
        const { layout, compactness } = syntxCosmosLayout(roles(count, titles), width, height);
        const before = packed(count, width, height, titles);
        // Closer than the first pass's 0.78 orientation on the long axis; never wider or taller than packed.
        expect(compactness.x, `${count} roles at ${width} × ${height}`).toBeLessThan(0.78);
        expect(compactness.y, `${count} roles at ${width} × ${height}`).toBeLessThanOrEqual(1);
        expect(layout.rings[0].radiusX).toBeCloseTo(before.rings[0].radiusX * compactness.x, 1);
        expect(layout.rings[0].radiusY).toBeCloseTo(before.rings[0].radiusY * compactness.y, 1);
        return { cards: before.nodes.map(node => `${node.width}×${node.height}`).join(" "), rx: layout.rings[0].radiusX, ry: layout.rings[0].radiusY };
      });
      // The minimum follows from cards, centre and air, not from the box: for the same cards (the packing sizes them per box) an
      // orbit of the same area, up to the rounding of both factors to hundredths, where the packed orbits differ by up to 320 px.
      for (const cards of new Set(orbits.map(orbit => orbit.cards))) {
        const areas = orbits.filter(orbit => orbit.cards === cards).map(orbit => orbit.rx * orbit.ry);
        expect(Math.max(...areas) / Math.min(...areas), `${count} roles, cards ${cards}`).toBeLessThan(1.03);
      }
    }
  });

  it("is the smallest orbit that holds: one step closer on either axis breaks the air or stands the orbit upright", () => {
    let edges = 0;
    for (const titles of [TITLES, LONG, SHORT]) for (const [width, height] of BOXES) for (const count of [1, 2, 3, 4, 5, 6, 8, 10, 12]) {
      const before = packed(count, width, height, titles);
      const { compactness } = compactRoleOrbit(before);
      if (compactness.x === 1 && compactness.y === 1) continue;
      const outer = before.rings.reduce((wide, ring) => (ring.radiusX > wide.radiusX ? ring : wide));
      for (const k of [{ x: compactness.x - 0.01, y: compactness.y }, { x: compactness.x, y: compactness.y - 0.01 }]) {
        const closer = scaled(before, k);
        // Read between the layout's own checks: within half a pixel of breaking counts as breaking.
        const breaks = centreAir(closer) < ROLE_ORBIT_CENTRE_CLEARANCE + 0.5 || separation(closer, true, PHASES) < 0.5 || separation(closer, false, [0]) < Math.min(0, separation(before, false, [0])) + 0.5;
        const upright = outer.radiusY * k.y > outer.radiusX * k.x + 1e-9;
        expect(breaks || upright, `${count} roles (${titles[0].slice(0, 12)}…) at ${width} × ${height}, ${k.x.toFixed(2)} / ${k.y.toFixed(2)}`).toBe(true);
        edges += 1;
      }
      // The orbit lies like every orbit of the field: at least as wide as it is tall.
      expect(outer.radiusY * compactness.y).toBeLessThanOrEqual(outer.radiusX * compactness.x + 1e-9);
    }
    expect(edges).toBeGreaterThan(100);
  });

  it("keeps every card, its title, size, order, phase and orbit, every orbit its period and the centre; only the radii change", () => {
    for (const [width, height] of BOXES) for (const count of COUNTS) {
      const before = packed(count, width, height);
      const { layout, compactness } = compactRoleOrbit(before);
      expect(layout.nodes.map(({ id, title, width: w, height: h, angle, ringIndex, visualMass }) => ({ id, title, w, h, angle, ringIndex, visualMass }))).toEqual(before.nodes.map(({ id, title, width: w, height: h, angle, ringIndex, visualMass }) => ({ id, title, w, h, angle, ringIndex, visualMass })));
      expect(layout.rings.map(ring => [ring.index, ring.periodSeconds])).toEqual(before.rings.map(ring => [ring.index, ring.periodSeconds]));
      expect([layout.width, layout.height, layout.centerX, layout.centerY, layout.staticPositions]).toEqual([before.width, before.height, before.centerX, before.centerY, before.staticPositions]);
      for (const factor of [compactness.x, compactness.y]) { expect(factor).toBeGreaterThan(0); expect(factor).toBeLessThanOrEqual(1); }
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

  it("keeps the air across orbits in every phase pair, never closer than the packing in motion (tall level boxes, PINK D-RO-2)", () => {
    /** Every degree of either orbit, offset from the layout's quarter-degree readings: the orbits turn at their own periods, so a
     * card meets the other orbit at every point of its own; the least air of each pair of card sizes on each pair of orbits. */
    const DEGREES = Array.from({ length: 360 }, (_, index) => ((index + 0.5) * Math.PI) / 180);
    const across = (layout: CapabilityCosmosLayout): Map<string, number> => {
      const points = new Map(layout.rings.map(ring => [ring.index, DEGREES.map(phase => ({ x: Math.cos(phase) * ring.radiusX, y: Math.sin(phase) * ring.radiusY }))]));
      const least = new Map<string, number>();
      for (const a of layout.nodes) for (const b of layout.nodes) {
        if (b.ringIndex <= a.ringIndex) continue;
        const key = `${a.ringIndex}/${b.ringIndex} ${a.width}×${drawn(a)} ${b.width}×${drawn(b)}`;
        if (least.has(key)) continue;
        const w = (a.width + b.width) / 2 + ROLE_ORBIT_CARD_GAP.x, h = (drawn(a) + drawn(b)) / 2 + ROLE_ORBIT_CARD_GAP.y;
        let air = Infinity;
        for (const p of points.get(a.ringIndex)!) for (const q of points.get(b.ringIndex)!) air = Math.min(air, Math.max(Math.abs(p.x - q.x) - w, Math.abs(p.y - q.y) - h));
        least.set(key, air);
      }
      return least;
    };
    let seed = 20261018;
    const next = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2 ** 32; };
    const RANDOM = Array.from({ length: 16 }, () => ["Senior", "Staff Engineer", "Platform", "Settlement and Reconciliation", "QA", "Lead", "Clinical Interoperability"].filter(() => next() < 0.5).join(" ") || "SRE");
    let drawnIn = 0;
    for (const titles of [TITLES, RANDOM]) for (const [width, height] of [[1600, 960], [1536, 960], [1408, 1060], [1920, 1180], [2112, 940]] as Array<[number, number]>) for (const count of [12, 14, 16, 18]) {
      const before = packed(count, width, height, titles);
      const { layout, compactness } = compactRoleOrbit(before);
      if ((compactness.x === 1 && compactness.y === 1) || new Set(layout.nodes.map(node => node.ringIndex)).size < 2) continue;
      drawnIn += 1;
      const packedAir = across(before);
      for (const [key, air] of across(layout)) expect(air, `${count} roles (${titles[0].slice(0, 12)}…) at ${width} × ${height}, ${key}`).toBeGreaterThanOrEqual(Math.min(0, packedAir.get(key)!) - 0.5);
    }
    expect(drawnIn).toBeGreaterThan(10);
    // PINK D-RO-2: fourteen roles at 1600 × 960 kept their air packed (+13.03 px) and fell to −6.27 px drawn in to 0.88 / 0.92.
    const fourteen = compactRoleOrbit(packed(14, 1600, 960));
    expect(fourteen.compactness).not.toEqual({ x: 0.88, y: 0.92 });
  }, 60_000);

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

  it("is deterministic", () => {
    for (const [width, height] of BOXES) for (const count of COUNTS) expect(syntxCosmosLayout(roles(count), width, height)).toEqual(syntxCosmosLayout(roles(count), width, height));
  });
});
