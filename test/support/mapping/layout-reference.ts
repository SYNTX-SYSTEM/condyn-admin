import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * REFERENCE ORACLE of the PERSON × JOB mapping layout (phase A of the architecture). Not product code: it exists so that the
 * specification (docs/architecture/decision-fields/mapping-spec) is executable and the golden vectors are produced by one definition.
 * The product modules of the later phases must match its output within 1e-6. Pure, deterministic, no randomness, no clock.
 */
export const SPEC = JSON.parse(readFileSync(join(__dirname, "../../../docs/architecture/decision-fields/mapping-spec/layout-spec.json"), "utf8")) as {
  specVersion: string; field: { radius: number; personRadius: number; overflowRadius: number }; rings: { bestFit: number; zeroFit: number; horizon: number; shelfNear: number; shelfFar: number };
  body: { min: number; max: number; base: number; perSqrtWeight: number; gap: number };
  sectors: { gapDegrees: number; minShare: number; startDegrees: number; angleMargin: number; angleSpread: number; golden: number };
  search: { radialSteps: number; angularSteps: number }; arcs: { gapDegrees: number; startDegrees: number; necessityOrder: string[] };
  constellation: { nodeRadius: number; spacing: number; ringRadii: number[]; startDegrees: number };
};

export const r6 = (v: number): number => { const x = Math.round(v * 1e6) / 1e6; return x === 0 ? 0 : x; };
const text = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
const rad = (deg: number) => (deg * Math.PI) / 180;
const frac = (v: number) => v - Math.floor(v);

export interface LayoutRole { poolId: string; roleId: string; rank: number; tier: "SEMANTIC" | "LEXICAL_ONLY"; fit: number | null; weightSum: number }
export interface LayoutInput { pools: Array<{ id: string; name: string }>; roles: LayoutRole[] }
export interface Sector { poolId: string; startDegrees: number; spanDegrees: number; roles: number }
export interface Body {
  poolId: string; roleId: string; rank: number; tier: LayoutRole["tier"]; shelf: boolean;
  x: number; y: number; distance: number; angleDegrees: number; bodyRadius: number;
  /** [radial step, angular step] taken from the fit position; [0, 0] = placed exactly where its fit puts it. */
  displacement: [number, number]; overflow: boolean;
}
export interface LayoutOutput { specVersion: string; sectors: Sector[]; bodies: Body[]; overflowCount: number }

export function bodyRadiusOf(weightSum: number): number {
  const b = SPEC.body;
  return Math.min(b.max, Math.max(b.min, b.base + b.perSqrtWeight * Math.sqrt(Math.max(0, weightSum))));
}

/** Where the fit puts a role (radial position only). */
export function baseDistance(role: Pick<LayoutRole, "tier" | "fit">): number {
  const r = SPEC.rings;
  if (role.tier === "SEMANTIC") return r.bestFit + (1 - Math.min(1, Math.max(0, role.fit ?? 0))) * (r.zeroFit - r.bestFit);
  const fit = Math.min(0.5, Math.max(0, role.fit ?? 0));
  return r.shelfNear + (r.shelfFar - r.shelfNear) * (1 - fit / 0.5);
}

export function referenceLayout(input: LayoutInput): LayoutOutput {
  const s = SPEC.sectors;
  const pools = [...input.pools].sort((a, b) => text(a.name, b.name) || text(a.id, b.id));
  const roles = [...input.roles].sort((a, b) => a.rank - b.rank);
  const total = roles.length;
  const minRoles = Math.ceil(s.minShare * total);
  const counts = new Map(pools.map(p => [p.id, roles.filter(r => r.poolId === p.id).length] as const));
  const weights = pools.map(p => Math.max(counts.get(p.id) ?? 0, minRoles, 1));
  const weightTotal = weights.reduce((n, w) => n + w, 0);
  const available = 360 - s.gapDegrees * pools.length;
  const sectors: Sector[] = []; let cursor = s.startDegrees + s.gapDegrees / 2;
  pools.forEach((p, at) => { const span = (available * weights[at]) / weightTotal; sectors.push({ poolId: p.id, startDegrees: cursor, spanDegrees: span, roles: counts.get(p.id) ?? 0 }); cursor += span + s.gapDegrees; });
  const sectorOf = new Map(sectors.map(x => [x.poolId, x] as const));

  const placed: Body[] = []; const indexInPool = new Map<string, number>(); let overflowCount = 0;
  const offsets = (steps: number) => { const out = [0]; for (let k = 1; k <= steps; k += 1) out.push(k, -k); return out; };
  for (const role of roles) {
    const sector = sectorOf.get(role.poolId);
    if (!sector) throw new Error(`ERR_MAPPING_LAYOUT_UNKNOWN_POOL:${role.poolId}`);
    const i = indexInPool.get(role.poolId) ?? 0; indexInPool.set(role.poolId, i + 1);
    const rho = bodyRadiusOf(role.weightSum), shelf = role.tier !== "SEMANTIC";
    const u = frac((i + 1) * s.golden);
    const baseAngle = sector.startDegrees + sector.spanDegrees * (s.angleMargin + s.angleSpread * u);
    const base = baseDistance(role);
    const lo = shelf ? SPEC.rings.shelfNear : SPEC.rings.bestFit, hi = shelf ? SPEC.field.radius - rho : SPEC.rings.horizon - rho;
    const step = 2 * rho + SPEC.body.gap;
    let found: { x: number; y: number; d: number; a: number; at: [number, number] } | null = null;
    outer:
    for (const dr of offsets(SPEC.search.radialSteps)) {
      const d = base + dr * step;
      if (d < lo || d > hi) continue;
      const angleStep = (step / d) * (180 / Math.PI);
      for (const da of offsets(SPEC.search.angularSteps)) {
        const a = baseAngle + da * angleStep;
        if (a < sector.startDegrees || a > sector.startDegrees + sector.spanDegrees) continue;
        const x = d * Math.cos(rad(a)), y = d * Math.sin(rad(a));
        if (placed.every(o => o.overflow || Math.hypot(o.x - x, o.y - y) >= o.bodyRadius + rho + SPEC.body.gap)) { found = { x, y, d, a, at: [dr, da] }; break outer; }
      }
    }
    if (found) placed.push({ poolId: role.poolId, roleId: role.roleId, rank: role.rank, tier: role.tier, shelf, x: r6(found.x), y: r6(found.y), distance: r6(found.d), angleDegrees: r6(found.a), bodyRadius: r6(rho), displacement: found.at, overflow: false });
    else {
      overflowCount += 1; const d = SPEC.field.overflowRadius;
      placed.push({ poolId: role.poolId, roleId: role.roleId, rank: role.rank, tier: role.tier, shelf, x: r6(d * Math.cos(rad(baseAngle))), y: r6(d * Math.sin(rad(baseAngle))), distance: d, angleDegrees: r6(baseAngle), bodyRadius: r6(rho), displacement: [0, 0], overflow: true });
    }
  }
  return { specVersion: SPEC.specVersion, sectors: sectors.map(x => ({ ...x, startDegrees: r6(x.startDegrees), spanDegrees: r6(x.spanDegrees) })), bodies: placed, overflowCount };
}

export interface ArcRequirement { id: string; necessity: string; weight: number; value: number }
export interface Arc { id: string; startDegrees: number; endDegrees: number; spanDegrees: number; fill: number }
/** The requirement ring of one job body: necessity order, then weight descending, then id; the length of an arc is its weight. */
export function referenceArcs(requirements: ArcRequirement[]): Arc[] {
  const a = SPEC.arcs, order = (n: string) => { const at = a.necessityOrder.indexOf(n); return at === -1 ? a.necessityOrder.length - 1 : at; };
  const sorted = [...requirements].sort((x, y) => order(x.necessity) - order(y.necessity) || y.weight - x.weight || text(x.id, y.id));
  const n = sorted.length; if (n === 0) return [];
  const gap = n > 1 ? a.gapDegrees : 0, available = 360 - gap * n, total = sorted.reduce((sum, r) => sum + r.weight, 0);
  let cursor = a.startDegrees + gap / 2;
  return sorted.map(r => { const span = (available * r.weight) / total; const arc = { id: r.id, startDegrees: r6(cursor), endDegrees: r6(cursor + span), spanDegrees: r6(span), fill: r.value }; cursor += span + gap; return arc; });
}

export interface ConstellationNode { key: string; name: string }
export interface PlacedNode { key: string; x: number; y: number; ring: number; overflow: boolean }
/** The person's capabilities as a small constellation: sorted by name then key, filled ring by ring from the inside; the rest is counted, not drawn. */
export function referenceConstellation(nodes: ConstellationNode[]): { nodes: PlacedNode[]; overflowCount: number } {
  const c = SPEC.constellation, sorted = [...nodes].sort((x, y) => text(x.name, y.name) || text(x.key, y.key));
  if (sorted.length === 1) return { nodes: [{ key: sorted[0].key, x: 0, y: 0, ring: 0, overflow: false }], overflowCount: 0 };
  const out: PlacedNode[] = []; let at = 0;
  c.ringRadii.forEach((radius, ring) => {
    const capacity = Math.floor((2 * Math.PI * radius) / c.spacing), take = Math.min(capacity, sorted.length - at);
    for (let k = 0; k < take; k += 1) { const a = rad(c.startDegrees + (360 * k) / take); out.push({ key: sorted[at + k].key, x: r6(radius * Math.cos(a)), y: r6(radius * Math.sin(a)), ring, overflow: false }); }
    at += take;
  });
  return { nodes: out, overflowCount: sorted.length - at };
}
