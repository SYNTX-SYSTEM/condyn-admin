import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { SPEC, baseDistance, bodyRadiusOf, r6, referenceArcs, referenceConstellation, referenceLayout, type LayoutInput } from "../../support/mapping/layout-reference";
import { arcInputs, computeVectors, constellationInputs, layoutInputs, VECTORS_FILE } from "../../support/mapping/vectors";

/** MAPPING_LAYOUT_V1: the specification is executable, the golden vectors are what it produces, and its promises hold on every vector. No database, no network, no model. */
const file = JSON.parse(readFileSync(VECTORS_FILE, "utf8")) as ReturnType<typeof computeVectors>;
const near = (a: number, b: number) => Math.abs(a - b) <= 1e-6;
const layouts = Object.entries(layoutInputs());

describe("LAYOUT · golden vectors", () => {
  it("the committed vectors are exactly what the reference produces now (no drift between spec, oracle and file)", () => {
    expect(JSON.parse(JSON.stringify(computeVectors()))).toEqual(file);
  });

  it("DETERMINISM: the same input gives the same output, byte for byte, in any call order and with shuffled input lists", () => {
    for (const [name, input] of layouts) {
      const once = JSON.stringify(referenceLayout(input));
      expect(JSON.stringify(referenceLayout(input)), name).toBe(once);
      const shuffled: LayoutInput = { pools: [...input.pools].reverse(), roles: [...input.roles].reverse() };
      expect(JSON.stringify(referenceLayout(shuffled)), `${name} shuffled`).toBe(once);
    }
  });

  it("HAND-CHECKED: one role, fit 1, weight 24 — computed here with plain arithmetic, independent of the oracle", () => {
    const out = referenceLayout(layoutInputs()["LV01-single-role"]);
    const start = -90 + 2, span = 356, u = (1 * 0.6180339887498949) % 1;
    const angle = start + span * (0.05 + 0.9 * u), rho = Math.min(16, Math.max(6, 3 + 2.2 * Math.sqrt(24)));
    const [body] = out.bodies;
    expect(out.sectors).toEqual([{ poolId: "pool-a", startDegrees: -88, spanDegrees: 356, roles: 1 }]);
    expect(body.distance).toBe(160);
    expect(near(body.angleDegrees, angle)).toBe(true);
    expect(near(body.bodyRadius, rho)).toBe(true);
    expect(near(body.x, 160 * Math.cos((angle * Math.PI) / 180))).toBe(true);
    expect(near(body.y, 160 * Math.sin((angle * Math.PI) / 180))).toBe(true);
    expect(body.displacement).toEqual([0, 0]);
  });
});

describe("LAYOUT · promises on every vector", () => {
  it("NO OVERLAP: placed bodies keep their gap; bodies beyond capacity are counted, never drawn over others", () => {
    for (const [name, input] of layouts) {
      const { bodies, overflowCount } = referenceLayout(input);
      const placed = bodies.filter(b => !b.overflow);
      expect(bodies.length - placed.length, name).toBe(overflowCount);
      for (let i = 0; i < placed.length; i += 1) for (let j = i + 1; j < placed.length; j += 1)
        expect(Math.hypot(placed[i].x - placed[j].x, placed[i].y - placed[j].y), `${name} ${placed[i].roleId}/${placed[j].roleId}`).toBeGreaterThanOrEqual(placed[i].bodyRadius + placed[j].bodyRadius + SPEC.body.gap - 1e-5);
    }
  });

  it("HORIZON: a checked role lies inside the horizon, a name-only role beyond it, none outside the field", () => {
    for (const [name, input] of layouts) for (const b of referenceLayout(input).bodies.filter(x => !x.overflow)) {
      if (b.tier === "SEMANTIC") { expect(b.distance + b.bodyRadius, name).toBeLessThanOrEqual(SPEC.rings.horizon + 1e-5); expect(b.distance, name).toBeGreaterThanOrEqual(SPEC.rings.bestFit - 1e-5); }
      else { expect(b.distance - b.bodyRadius, name).toBeGreaterThanOrEqual(SPEC.rings.horizon - 1e-5); expect(b.distance + b.bodyRadius, name).toBeLessThanOrEqual(SPEC.field.radius + 1e-5); }
    }
  });

  it("SECTORS: each pool keeps to its own sector; sectors are ordered by pool name and never overlap; a pool without roles still has its sector", () => {
    for (const [name, input] of layouts) {
      const out = referenceLayout(input);
      const sorted = [...input.pools].sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
      expect(out.sectors.map(s => s.poolId), name).toEqual(sorted.map(p => p.id));
      for (let i = 1; i < out.sectors.length; i += 1) expect(out.sectors[i].startDegrees, name).toBeGreaterThanOrEqual(out.sectors[i - 1].startDegrees + out.sectors[i - 1].spanDegrees + SPEC.sectors.gapDegrees - 1e-5);
      const byPool = new Map(out.sectors.map(s => [s.poolId, s] as const));
      for (const b of out.bodies.filter(x => !x.overflow)) { const s = byPool.get(b.poolId)!; expect(b.angleDegrees, `${name} ${b.roleId}`).toBeGreaterThanOrEqual(s.startDegrees - 1e-5); expect(b.angleDegrees, `${name} ${b.roleId}`).toBeLessThanOrEqual(s.startDegrees + s.spanDegrees + 1e-5); }
      expect(out.sectors.reduce((n, s) => n + s.spanDegrees, 0) + SPEC.sectors.gapDegrees * out.sectors.length, name).toBeCloseTo(360, 4);
    }
  });

  it("FIT IS DISTANCE: an undisplaced body sits exactly where its fit puts it; a better fit is never farther out in its tier", () => {
    for (const [name, input] of layouts) {
      const out = referenceLayout(input);
      const roleOf = new Map(input.roles.map(r => [r.roleId, r] as const));
      const free = out.bodies.filter(b => !b.overflow && b.displacement[0] === 0);
      for (const b of free) expect(near(b.distance, r6(baseDistance(roleOf.get(b.roleId)!))), `${name} ${b.roleId}`).toBe(true);
      for (const tier of ["SEMANTIC", "LEXICAL_ONLY"] as const) {
        const sameTier = free.filter(b => b.tier === tier).sort((a, c) => a.rank - c.rank);
        for (let i = 1; i < sameTier.length; i += 1) {
          const a = roleOf.get(sameTier[i - 1].roleId)!, c = roleOf.get(sameTier[i].roleId)!;
          if ((a.fit ?? 0) > (c.fit ?? 0)) expect(sameTier[i - 1].distance, name).toBeLessThanOrEqual(sameTier[i].distance + 1e-5);
        }
      }
    }
  });

  it("CAPACITY: the realistic shapes (73 real-shaped roles, 60 crowded) fit completely; only the stress vector overflows", () => {
    const by = Object.fromEntries(layouts.map(([name, input]) => [name, referenceLayout(input).overflowCount]));
    expect(by["LV07-real-shape-73"]).toBe(0);
    expect(by["LV04-crowded-60"]).toBe(0);
    expect(by["LV05-capacity-exceeded-overflow"]).toBeGreaterThan(0);
    expect(by["LV06-no-roles"]).toBe(0);
  });

  it("BODY SIZE: grows with the requirement mass between 6 and 16 and never leaves that band", () => {
    expect(bodyRadiusOf(0)).toBe(6);
    expect(bodyRadiusOf(1000)).toBe(16);
    let last = 0; for (let w = 0; w <= 40; w += 1) { const rho = bodyRadiusOf(w); expect(rho).toBeGreaterThanOrEqual(last); last = rho; expect(rho).toBeGreaterThanOrEqual(6); expect(rho).toBeLessThanOrEqual(16); }
  });

  it("INVERSE: a role of an unknown pool is refused, not placed somewhere", () => {
    expect(() => referenceLayout({ pools: [{ id: "pool-a", name: "pool-a" }], roles: [{ poolId: "pool-x", roleId: "r", rank: 1, tier: "SEMANTIC", fit: 1, weightSum: 3 }] })).toThrow(/ERR_MAPPING_LAYOUT_UNKNOWN_POOL/);
  });
});

describe("ARCS · the requirement ring of a job body", () => {
  it("the arcs close the circle: spans add up to 360 minus the gaps, one span per weight, no overlap", () => {
    for (const [name, input] of Object.entries(arcInputs)) {
      const arcs = referenceArcs(input);
      expect(arcs.length, name).toBe(input.length);
      if (input.length === 0) continue;
      const gap = input.length > 1 ? SPEC.arcs.gapDegrees : 0;
      expect(arcs.reduce((n, a) => n + a.spanDegrees, 0) + gap * arcs.length, name).toBeCloseTo(360, 4);
      for (let i = 1; i < arcs.length; i += 1) expect(arcs[i].startDegrees, name).toBeGreaterThanOrEqual(arcs[i - 1].endDegrees + gap - 1e-5);
      const total = input.reduce((n, r) => n + r.weight, 0);
      for (const a of arcs) expect(near(a.spanDegrees, ((360 - gap * arcs.length) * input.find(r => r.id === a.id)!.weight) / total), `${name} ${a.id}`).toBe(true);
    }
  });

  it("order: REQUIRED first, then PREFERRED, OPTIONAL, UNKNOWN; within one necessity heavier first, then by id; the fill is the requirement's value", () => {
    expect(referenceArcs(arcInputs["AV01-seven-requirements"]).map(a => a.id)).toEqual(["q2", "q3", "q6", "q4", "q7", "q1", "q5"]);
    expect(referenceArcs(arcInputs["AV04-ties-by-id"]).map(a => [a.id, a.fill])).toEqual([["a", 0], ["b", 0], ["c", 0.5]]);
    expect(referenceArcs(arcInputs["AV02-single"])).toEqual([{ id: "q1", startDegrees: -90, endDegrees: 270, spanDegrees: 360, fill: 1 }]);
    expect(referenceArcs(arcInputs["AV03-empty"])).toEqual([]);
  });
});

describe("CONSTELLATION · the person's capabilities", () => {
  it("none, one in the centre, a ring-wise fill in name order, overflow counted and never drawn", () => {
    const by = Object.fromEntries(Object.entries(constellationInputs).map(([name, input]) => [name, referenceConstellation(input)]));
    expect(by["CV00-0-capabilities"]).toEqual({ nodes: [], overflowCount: 0 });
    expect(by["CV01-1-capabilities"].nodes).toEqual([{ key: constellationInputs["CV01-1-capabilities"][0].key, x: 0, y: 0, ring: 0, overflow: false }]);
    expect(by["CV05-5-capabilities"].nodes).toHaveLength(5);
    expect(by["CV40-40-capabilities"].overflowCount).toBe(0);
    expect(by["CV80-80-capabilities"].nodes.length + by["CV80-80-capabilities"].overflowCount).toBe(80);
    expect(by["CV80-80-capabilities"].overflowCount).toBeGreaterThan(0);
    for (const [name, result] of Object.entries(by)) {
      for (let i = 0; i < result.nodes.length; i += 1) for (let j = i + 1; j < result.nodes.length; j += 1)
        expect(Math.hypot(result.nodes[i].x - result.nodes[j].x, result.nodes[i].y - result.nodes[j].y), name).toBeGreaterThanOrEqual(SPEC.constellation.nodeRadius * 2 - 1e-5);
      for (const n of result.nodes) expect(Math.hypot(n.x, n.y), name).toBeLessThanOrEqual(SPEC.field.personRadius);
    }
  });

  it("the same capabilities in any order are the same constellation", () => {
    const input = constellationInputs["CV40-40-capabilities"];
    expect(referenceConstellation([...input].reverse())).toEqual(referenceConstellation(input));
  });
});
