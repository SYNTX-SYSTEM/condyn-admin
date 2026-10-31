import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { referenceArcs, referenceConstellation, referenceLayout, type LayoutInput, type LayoutRole } from "./layout-reference";

/** The inputs of the golden vectors. Every input is a plain function of its index — no randomness, no clock. */
const DIR = join(__dirname, "../../../docs/architecture/decision-fields/mapping-spec");
export const VECTORS_FILE = join(DIR, "layout-golden-vectors.json");
const pool = (n: number) => ({ id: `pool-${"abcdefgh"[n]}`, name: `pool-${"abcdefgh"[n]}` });
const role = (poolId: string, at: number, rank: number, tier: LayoutRole["tier"], fit: number | null, weightSum: number): LayoutRole => ({ poolId, roleId: `role-${String(at).padStart(3, "0")}`, rank, tier, fit, weightSum });

function ranked(roles: Array<Omit<LayoutRole, "rank">>): LayoutRole[] {
  // The ranking's own order: SEMANTIC before LEXICAL_ONLY, fit descending (null last), then the given order.
  const tier = { SEMANTIC: 0, LEXICAL_ONLY: 1 } as const;
  return roles.map((r, at) => ({ r, at })).sort((a, b) => tier[a.r.tier] - tier[b.r.tier] || (a.r.fit === null ? 1 : 0) - (b.r.fit === null ? 1 : 0) || (b.r.fit ?? 0) - (a.r.fit ?? 0) || a.at - b.at).map((x, i) => ({ ...x.r, rank: i + 1 }));
}

export function layoutInputs(): Record<string, LayoutInput> {
  const real = JSON.parse(readFileSync(join(DIR, "real-shape-73.json"), "utf8")) as Array<{ rank: number; pool: string; tier: "SEMANTIC" | "LEXICAL_ONLY"; fit: number | null; weightSum: number }>;
  const crowded = Array.from({ length: 60 }, (_, i) => ({ poolId: "pool-a", roleId: `role-${String(i).padStart(3, "0")}`, tier: "SEMANTIC" as const, fit: Math.round((0.3 + 0.6 * ((i * 7) % 20) / 19) * 1e6) / 1e6, weightSum: 10 + ((i * 5) % 18) }));
  return {
    "LV01-single-role": { pools: [pool(0)], roles: [role("pool-a", 0, 1, "SEMANTIC", 1, 24)] },
    "LV02-three-pools-mixed-tiers": { pools: [pool(2), pool(0), pool(1)], roles: ranked([
      { poolId: "pool-a", roleId: "role-000", tier: "SEMANTIC", fit: 0.75, weightSum: 24 }, { poolId: "pool-b", roleId: "role-001", tier: "SEMANTIC", fit: 0.4, weightSum: 15 },
      { poolId: "pool-c", roleId: "role-002", tier: "SEMANTIC", fit: 0.4, weightSum: 14 }, { poolId: "pool-a", roleId: "role-003", tier: "LEXICAL_ONLY", fit: 0.25, weightSum: 20 },
      { poolId: "pool-b", roleId: "role-004", tier: "LEXICAL_ONLY", fit: 0, weightSum: 13 }, { poolId: "pool-c", roleId: "role-005", tier: "LEXICAL_ONLY", fit: null, weightSum: 0 }]) },
    "LV03-equal-fit-ties": { pools: [pool(0)], roles: ranked(Array.from({ length: 12 }, (_, i) => ({ poolId: "pool-a", roleId: `role-${String(i).padStart(3, "0")}`, tier: "SEMANTIC" as const, fit: 0.5, weightSum: 18 }))) },
    "LV04-crowded-60": { pools: [pool(0)], roles: ranked(crowded) },
    "LV05-capacity-exceeded-overflow": { pools: [pool(0)], roles: ranked(Array.from({ length: 320 }, (_, i) => ({ poolId: "pool-a", roleId: `role-${String(i).padStart(3, "0")}`, tier: "SEMANTIC" as const, fit: 0.5, weightSum: 27 }))) },
    "LV08-checked-fit-0-pressed-to-the-horizon": { pools: [pool(0)], roles: ranked(Array.from({ length: 200 }, (_, i) => ({ poolId: "pool-a", roleId: `role-${String(i).padStart(3, "0")}`, tier: "SEMANTIC" as const, fit: 0, weightSum: 1 }))) },
    "LV09-shelf-fit-0-pressed-to-the-field-edge": { pools: [pool(0)], roles: ranked(Array.from({ length: 260 }, (_, i) => ({ poolId: "pool-a", roleId: `role-${String(i).padStart(3, "0")}`, tier: "LEXICAL_ONLY" as const, fit: 0, weightSum: 1 }))) },
    "LV11-shelf-wide-bodies-cannot-leave-the-field": { pools: [pool(0)], roles: ranked(Array.from({ length: 120 }, (_, i) => ({ poolId: "pool-a", roleId: `role-${String(i).padStart(3, "0")}`, tier: "LEXICAL_ONLY" as const, fit: 0, weightSum: 40 }))) },
    "LV10-checked-fit-1-pressed-from-the-inner-edge": { pools: [pool(0)], roles: ranked(Array.from({ length: 160 }, (_, i) => ({ poolId: "pool-a", roleId: `role-${String(i).padStart(3, "0")}`, tier: "SEMANTIC" as const, fit: 1, weightSum: 1 }))) },
    "LV06-no-roles": { pools: [pool(1), pool(0)], roles: [] },
    "LV07-real-shape-73": { pools: [pool(0), pool(1), pool(2)], roles: real.map((r, i) => ({ poolId: r.pool, roleId: `role-${String(i).padStart(3, "0")}`, rank: r.rank, tier: r.tier, fit: r.fit, weightSum: r.weightSum })) }
  };
}

export const arcInputs = {
  "AV01-seven-requirements": [
    { id: "q1", necessity: "OPTIONAL", weight: 1, value: 0 }, { id: "q2", necessity: "REQUIRED", weight: 3, value: 1 }, { id: "q3", necessity: "REQUIRED", weight: 3, value: 0.5 },
    { id: "q4", necessity: "PREFERRED", weight: 2, value: 0 }, { id: "q5", necessity: "UNKNOWN", weight: 1, value: 0.5 }, { id: "q6", necessity: "REQUIRED", weight: 3, value: 0 }, { id: "q7", necessity: "PREFERRED", weight: 2, value: 1 }],
  "AV02-single": [{ id: "q1", necessity: "REQUIRED", weight: 3, value: 1 }],
  "AV03-empty": [] as Array<{ id: string; necessity: string; weight: number; value: number }>,
  "AV04-ties-by-id": [{ id: "b", necessity: "PREFERRED", weight: 2, value: 0 }, { id: "a", necessity: "PREFERRED", weight: 2, value: 0 }, { id: "c", necessity: "PREFERRED", weight: 2, value: 0.5 }]
};
export const constellationInputs: Record<string, Array<{ key: string; name: string }>> = Object.fromEntries([0, 1, 5, 40, 80].map(n => [`CV${String(n).padStart(2, "0")}-${n}-capabilities`, Array.from({ length: n }, (_, i) => ({ key: `PCAP_${String((i * 17) % 97).padStart(3, "0")}_${i}`, name: `Capability ${String.fromCharCode(65 + (i % 26))}${Math.floor(i / 26)}` }))]));

export function computeVectors() {
  return {
    specVersion: "MAPPING_LAYOUT_V1",
    note: "Produced by test/support/mapping/layout-reference.ts from layout-spec.json; test/career/mapping-spec checks the file against a fresh run and the invariants. Compare within 1e-6.",
    layouts: Object.fromEntries(Object.entries(layoutInputs()).map(([name, input]) => [name, { input, expected: referenceLayout(input) }])),
    arcs: Object.fromEntries(Object.entries(arcInputs).map(([name, input]) => [name, { input, expected: referenceArcs(input) }])),
    constellations: Object.fromEntries(Object.entries(constellationInputs).map(([name, input]) => [name, { input, expected: referenceConstellation(input) }]))
  };
}
/** Pretty, but every innermost object on one line (a body per line keeps the file reviewable). */
export const writeVectors = () => writeFileSync(VECTORS_FILE, `${JSON.stringify(computeVectors(), null, 1).replace(/\{[^{}]*\}/g, m => m.replace(/\s*\n\s*/g, " "))}\n`);
