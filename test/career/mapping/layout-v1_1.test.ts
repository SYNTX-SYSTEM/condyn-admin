import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { layoutRoles, layoutRolesV11 } from "../../../lib/career/mapping/layout";
import { SPEC, SPEC_V11, baseDistance, bodyRadiusOf, drawnRadiusOf, referenceLayout, referenceLayoutV11, type LayoutInput } from "../../support/mapping/layout-reference";
import { computeVectorsV11, layoutInputs, VECTORS_FILE_V11 } from "../../support/mapping/vectors";

/**
 * MAPPING_LAYOUT_V1.1 (PERSON_X_JOB_MAPPING_PHASE_G.md §5/§7, A1): V1's algorithm with two radii, each with exactly one role — the
 * mass radius keeps the band rule (fit), the drawn radius takes the collision rule and the step (bodies never touch as drawn). The
 * spec is executable, the vectors are what it produces, the product module matches them, and its promises hold on every vector.
 */
const file = JSON.parse(readFileSync(VECTORS_FILE_V11, "utf8")) as ReturnType<typeof computeVectorsV11>;
const layouts = Object.entries(layoutInputs());
const SLOW = 120_000;
const near = (a: number, b: number) => Math.abs(a - b) <= 1e-6;

describe("LAYOUT V1.1 · golden vectors", () => {
  it("the committed V1.1 vectors are exactly what the reference produces now, over V1's twelve inputs", () => {
    expect(file.specVersion).toBe("MAPPING_LAYOUT_V1.1");
    expect(Object.keys(file.layouts).sort()).toEqual(layouts.map(([name]) => name).sort());
    expect(JSON.parse(JSON.stringify(computeVectorsV11()))).toEqual(file);
  }, SLOW);

  it("the product module (layoutRolesV11) matches every V1.1 vector within 1e-6, and V1 (layoutRoles) still matches the reference V1", () => {
    for (const [name, { input, expected }] of Object.entries(file.layouts)) {
      const actual = layoutRolesV11(input.pools, input.roles);
      expect(actual.specVersion, name).toBe("MAPPING_LAYOUT_V1.1");
      expect(actual.overflowCount, name).toBe(expected.overflowCount);
      expect(actual.bodies.length, name).toBe(expected.bodies.length);
      actual.bodies.forEach((b, i) => {
        const e = expected.bodies[i];
        expect([b.poolId, b.roleId, b.overflow, b.displacement], `${name} ${i}`).toEqual([e.poolId, e.roleId, e.overflow, e.displacement]);
        for (const k of ["x", "y", "distance", "angleDegrees", "bodyRadius", "drawnRadius"] as const) expect(near(b[k] as number, e[k] as number), `${name} ${i} ${k}`).toBe(true);
      });
    }
    for (const [name, input] of layouts) expect(JSON.parse(JSON.stringify(layoutRoles(input.pools, input.roles))), name).toEqual(JSON.parse(JSON.stringify(referenceLayout(input))));
  }, SLOW);

  it("DETERMINISM: the same input gives the same output, byte for byte, with shuffled input lists", () => {
    for (const [name, input] of layouts) {
      const once = JSON.stringify(referenceLayoutV11(input));
      const shuffled: LayoutInput = { pools: [...input.pools].reverse(), roles: [...input.roles].reverse() };
      expect(JSON.stringify(referenceLayoutV11(shuffled)), name).toBe(once);
      expect(JSON.stringify(layoutRolesV11(shuffled.pools, shuffled.roles)), name).toBe(JSON.stringify(layoutRolesV11(input.pools, input.roles)));
    }
  }, SLOW);
});

describe("LAYOUT V1.1 · the two radii, each with one role", () => {
  it("the V1.1 spec is V1 plus the drawn radius and the rule texts — every other constant identical", () => {
    const strip = (s: Record<string, unknown>) => { const { specVersion, derivedFrom, body, search, ...rest } = s as Record<string, Record<string, unknown>>; void specVersion; void derivedFrom;
      const { drawn, ...b } = body; void drawn; const { rules, ...r } = search; void rules; return { ...rest, body: b, search: r }; };
    expect(strip(SPEC_V11 as unknown as Record<string, unknown>)).toEqual(strip(SPEC as unknown as Record<string, unknown>));
  });

  it("size carries requirement mass: the drawn radius is monotone in weightSum, inside [drawn.min, drawn.max] (56 … 92 px at L0, 1920)", () => {
    let last = -Infinity;
    for (let w = 0; w <= 200; w += 0.5) { const d = drawnRadiusOf(w); expect(d).toBeGreaterThanOrEqual(last); expect(d).toBeGreaterThanOrEqual(SPEC_V11.body.drawn.min - 1e-9); expect(d).toBeLessThanOrEqual(SPEC_V11.body.drawn.max + 1e-9); last = d; }
    expect(drawnRadiusOf(0)).toBe(SPEC_V11.body.drawn.min);
    expect(drawnRadiusOf(1e6)).toBe(SPEC_V11.body.drawn.max);
  });

  it("REPRODUCE on every vector: no two drawn bodies touch AS DRAWN; the band holds with the MASS radius; displacement says whether the search deviated", () => {
    for (const [name, { input, expected }] of Object.entries(file.layouts)) {
      const drawn = expected.bodies.filter(b => !b.overflow);
      for (let i = 0; i < drawn.length; i++) for (let j = i + 1; j < drawn.length; j++)
        expect(Math.hypot(drawn[i].x - drawn[j].x, drawn[i].y - drawn[j].y) + 1e-6, `${name} ${drawn[i].roleId}/${drawn[j].roleId}`).toBeGreaterThanOrEqual(drawn[i].drawnRadius! + drawn[j].drawnRadius! + SPEC_V11.body.gap);
      for (const b of drawn) {
        const role = input.roles.find(r => r.roleId === b.roleId && r.poolId === b.poolId)!;
        const rho = bodyRadiusOf(role.weightSum);
        expect(near(b.bodyRadius, rho) && near(b.drawnRadius!, drawnRadiusOf(role.weightSum)), `${name} ${b.roleId} radii`).toBe(true);
        const [lo, hi] = b.shelf ? [SPEC_V11.rings.shelfNear, SPEC_V11.field.radius - rho] : [SPEC_V11.rings.bestFit, SPEC_V11.rings.horizon - rho];
        expect(b.distance >= lo - 1e-6 && b.distance <= hi + 1e-6, `${name} ${b.roleId} in its band by the MASS radius`).toBe(true);
        const atFit = b.displacement[0] === 0 && b.displacement[1] === 0;
        if (atFit) expect(near(b.distance, baseDistance(role)), `${name} ${b.roleId} undisplaced = at its fit`).toBe(true);
      }
    }
  });

  it("the shelf survives (A1, PHASE_G §7): name-only roles are drawn where V1 drew them — the band is not consumed by the drawn size", () => {
    for (const name of ["LV02-three-pools-mixed-tiers", "LV07-real-shape-73", "LV09-shelf-fit-0-pressed-to-the-field-edge", "LV11-shelf-wide-bodies-cannot-leave-the-field", "LV12-shelf-medium-bodies-cannot-cross-the-field-edge"]) {
      const drawnShelf = file.layouts[name].expected.bodies.filter(b => b.shelf && !b.overflow).length;
      expect(drawnShelf, name).toBeGreaterThan(0);
    }
    expect(file.layouts["LV02-three-pools-mixed-tiers"].expected.bodies.filter(b => b.shelf && !b.overflow).length, "LV02: all three name-only roles").toBe(3);
  });
});
