import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { layoutConstellation, layoutRequirementArcs, layoutRoles, type LayoutRole } from "../../../lib/career/mapping/layout";
import { deepFreeze, shuffled } from "./fixtures";

/**
 * MAPPING_LAYOUT_V1 · the product module against the golden vectors (the binding layout contract: x/y compared directly, 1e-6) and
 * the phase A promises, now held by the product module. The oracle is not imported: the vectors file is the contract.
 */
const DIR = join(__dirname, "../../../docs/architecture/decision-fields/mapping-spec");
const SPEC = JSON.parse(readFileSync(join(DIR, "layout-spec.json"), "utf8"));
const VECTORS = JSON.parse(readFileSync(join(DIR, "layout-golden-vectors.json"), "utf8")) as {
  layouts: Record<string, { input: { pools: Array<{ id: string; name: string }>; roles: LayoutRole[] }; expected: unknown }>;
  arcs: Record<string, { input: Array<{ id: string; necessity: string; weight: number; value: number }>; expected: unknown }>;
  constellations: Record<string, { input: Array<{ key: string; name: string }>; expected: unknown }>;
};
const SLOW = 120_000;
const layouts = Object.entries(VECTORS.layouts);

/** Same structure, same strings and booleans, every number within 1e-6. Returns the first difference's path, or null. */
function differs(actual: unknown, expected: unknown, path = "$"): string | null {
  if (typeof expected === "number") return typeof actual === "number" && Math.abs(actual - expected) <= 1e-6 ? null : `${path}: ${String(actual)} ≠ ${expected}`;
  if (Array.isArray(expected)) {
    if (!Array.isArray(actual) || actual.length !== expected.length) return `${path}: length ${Array.isArray(actual) ? actual.length : "none"} ≠ ${expected.length}`;
    for (let i = 0; i < expected.length; i += 1) { const d = differs(actual[i], expected[i], `${path}[${i}]`); if (d) return d; }
    return null;
  }
  if (expected && typeof expected === "object") {
    if (!actual || typeof actual !== "object") return `${path}: not an object`;
    const a = Object.keys(actual).sort(), e = Object.keys(expected).sort();
    if (a.join() !== e.join()) return `${path}: keys ${a.join()} ≠ ${e.join()}`;
    for (const key of e) { const d = differs((actual as Record<string, unknown>)[key], (expected as Record<string, unknown>)[key], `${path}.${key}`); if (d) return d; }
    return null;
  }
  return actual === expected ? null : `${path}: ${String(actual)} ≠ ${String(expected)}`;
}

describe("MAP-LAYOUT · golden vectors", () => {
  it("all twelve layouts match (band edges LV08–LV12 and the real 73-role shape included)", () => {
    expect(layouts.map(([name]) => name).sort()).toEqual(["LV01-single-role", "LV02-three-pools-mixed-tiers", "LV03-equal-fit-ties", "LV04-crowded-60", "LV05-capacity-exceeded-overflow",
      "LV06-no-roles", "LV07-real-shape-73", "LV08-checked-fit-0-pressed-to-the-horizon", "LV09-shelf-fit-0-pressed-to-the-field-edge", "LV10-checked-fit-1-pressed-from-the-inner-edge",
      "LV11-shelf-wide-bodies-cannot-leave-the-field", "LV12-shelf-medium-bodies-cannot-cross-the-field-edge"]);
    for (const [name, v] of layouts) expect(differs(layoutRoles(v.input.pools, v.input.roles), v.expected), name).toBeNull();
  }, SLOW);

  it("all four requirement rings and all five constellations match", () => {
    expect(Object.keys(VECTORS.arcs)).toHaveLength(4);
    expect(Object.keys(VECTORS.constellations)).toHaveLength(5);
    for (const [name, v] of Object.entries(VECTORS.arcs)) expect(differs(layoutRequirementArcs(v.input), v.expected), name).toBeNull();
    for (const [name, v] of Object.entries(VECTORS.constellations)) expect(differs(layoutConstellation(v.input), v.expected), name).toBeNull();
  });

  it("INVERSE: the comparison has teeth — one coordinate off by 2e-6 is a difference", () => {
    const [name, v] = layouts.find(([n]) => n === "LV02-three-pools-mixed-tiers")!;
    const out = JSON.parse(JSON.stringify(layoutRoles(v.input.pools, v.input.roles)));
    out.bodies[3].x += 2e-6;
    expect(differs(out, v.expected), name).toMatch(/bodies\[3\]\.x/);
  });
});

describe("MAP-LAYOUT · the phase A promises on the product module", () => {
  it("DETERMINISM and READ-ONLY: frozen input, same output byte for byte, also with shuffled pools and roles", () => {
    for (const [name, v] of layouts) {
      const pools = deepFreeze(v.input.pools.map(p => ({ ...p }))), roles = deepFreeze(v.input.roles.map(r => ({ ...r })));
      const once = JSON.stringify(layoutRoles(pools, roles));
      expect(JSON.stringify(layoutRoles(pools, roles)), name).toBe(once);
      expect(JSON.stringify(layoutRoles(shuffled(pools), shuffled(roles))), `${name} shuffled`).toBe(once);
    }
    const arcs = deepFreeze(VECTORS.arcs["AV01-seven-requirements"].input.map(a => ({ ...a })));
    expect(layoutRequirementArcs(shuffled(arcs))).toEqual(layoutRequirementArcs(arcs));
    const nodes = deepFreeze(VECTORS.constellations["CV40-40-capabilities"].input.map(n => ({ ...n })));
    expect(layoutConstellation(shuffled(nodes))).toEqual(layoutConstellation(nodes));
  }, SLOW);

  it("NO OVERLAP, HORIZON, SECTORS: bodies keep their gap and band, each pool keeps to its sector, sectors close the circle", () => {
    for (const [name, v] of layouts) {
      const out = layoutRoles(v.input.pools, v.input.roles);
      const placed = out.bodies.filter(b => !b.overflow);
      expect(out.bodies.length - placed.length, name).toBe(out.overflowCount);
      for (let i = 0; i < placed.length; i += 1) for (let j = i + 1; j < placed.length; j += 1)
        expect(Math.hypot(placed[i].x - placed[j].x, placed[i].y - placed[j].y), name).toBeGreaterThanOrEqual(placed[i].bodyRadius + placed[j].bodyRadius + SPEC.body.gap - 1e-5);
      for (const b of placed) {
        if (b.tier === "SEMANTIC") { expect(b.distance + b.bodyRadius, name).toBeLessThanOrEqual(SPEC.rings.horizon + 1e-5); expect(b.distance, name).toBeGreaterThanOrEqual(SPEC.rings.bestFit - 1e-5); }
        else { expect(b.distance - b.bodyRadius, name).toBeGreaterThanOrEqual(SPEC.rings.horizon - 1e-5); expect(b.distance + b.bodyRadius, name).toBeLessThanOrEqual(SPEC.field.radius + 1e-5); }
        const s = out.sectors.find(x => x.poolId === b.poolId)!;
        expect(b.angleDegrees, name).toBeGreaterThanOrEqual(s.startDegrees - 1e-5);
        expect(b.angleDegrees, name).toBeLessThanOrEqual(s.startDegrees + s.spanDegrees + 1e-5);
      }
      for (const b of out.bodies.filter(x => x.overflow)) expect(b.distance, name).toBe(SPEC.field.overflowRadius);
      if (out.sectors.length) expect(out.sectors.reduce((n, s) => n + s.spanDegrees, 0) + SPEC.sectors.gapDegrees * out.sectors.length, name).toBeCloseTo(360, 4);
    }
  }, SLOW);

  it("CAPACITY and SIZE: the realistic shapes fit completely, only the stress vector overflows; body radius stays in 6…16", () => {
    const over = Object.fromEntries(layouts.map(([name, v]) => [name, layoutRoles(v.input.pools, v.input.roles)] as const));
    expect(over["LV07-real-shape-73"].overflowCount).toBe(0);
    expect(over["LV04-crowded-60"].overflowCount).toBe(0);
    expect(over["LV05-capacity-exceeded-overflow"].overflowCount).toBeGreaterThan(0);
    for (const out of Object.values(over)) for (const b of out.bodies) { expect(b.bodyRadius).toBeGreaterThanOrEqual(SPEC.body.min); expect(b.bodyRadius).toBeLessThanOrEqual(SPEC.body.max); }
  }, SLOW);

  it("HAND-CHECKED: sectors follow the pool NAME, not the id; a small pool gets at least ceil(6 % of all roles) — rules no vector separates", () => {
    // 20 roles in "alpha" (id z-pool), none in "beta" (id a-pool): shares max(20, ceil(1.2) = 2, 1) = 20 and 2 of 22; 360 − 2·4 = 352 degrees to share.
    const roles = Array.from({ length: 20 }, (_, i) => ({ poolId: "z-pool", roleId: `r${i}`, rank: i + 1, tier: "SEMANTIC" as const, fit: 0.5, weightSum: 4 }));
    const out = layoutRoles([{ id: "a-pool", name: "beta" }, { id: "z-pool", name: "alpha" }], roles);
    expect(out.sectors).toEqual([{ poolId: "z-pool", startDegrees: -88, spanDegrees: 320, roles: 20 }, { poolId: "a-pool", startDegrees: 236, spanDegrees: 32, roles: 0 }]);
  });

  it("HAND-CHECKED: inside one necessity the heavier requirement comes first (the vectors' weights follow necessity, so only this input separates it)", () => {
    expect(layoutRequirementArcs([{ id: "a", necessity: "REQUIRED", weight: 1, value: 0 }, { id: "b", necessity: "REQUIRED", weight: 3, value: 1 }]).map(a => [a.id, a.spanDegrees])).toEqual([["b", 261], ["a", 87]]);
  });

  it("INVERSE: a role of an unknown pool and an unknown necessity are refused, not placed somewhere", () => {
    expect(() => layoutRoles([{ id: "pool-a", name: "pool-a" }], [{ poolId: "pool-x", roleId: "r", rank: 1, tier: "SEMANTIC", fit: 1, weightSum: 3 }])).toThrow(/ERR_MAPPING_LAYOUT_UNKNOWN_POOL/);
    expect(() => layoutRequirementArcs([{ id: "q", necessity: "NICE_TO_HAVE", weight: 1, value: 0 }])).toThrow(/ERR_MAPPING_LAYOUT_UNKNOWN_NECESSITY/);
  });
});
