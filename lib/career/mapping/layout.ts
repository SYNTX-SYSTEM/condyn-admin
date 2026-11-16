import spec from "../../../docs/architecture/decision-fields/mapping-spec/layout-spec.json";
import specV11 from "../../../docs/architecture/decision-fields/mapping-spec/layout-spec-v1.1.json";

/**
 * PERSON × JOB mapping, phase B · the layout (MAPPING_LAYOUT_V1, docs/architecture/decision-fields/mapping-spec/layout-spec.json).
 * The golden vectors (layout-golden-vectors.json) are its contract within 1e-6. Every constant is read from the specification.
 * Pure: no clock, no randomness, the inputs are never written; the same input in any order gives the same output.
 *
 * Angle = pool, distance = fit, size = requirement mass. A body that finds no free place within its band and sector is overflow:
 * counted, placed on the overflow radius, not drawn. Positions are approximate once displaced — quantities come from the data.
 */
export interface LayoutPool { id: string; name: string }
export interface LayoutRole { poolId: string; roleId: string; rank: number; tier: "SEMANTIC" | "LEXICAL_ONLY"; fit: number | null; weightSum: number }
export interface LayoutSector { poolId: string; startDegrees: number; spanDegrees: number; roles: number }
export interface LayoutBody {
  poolId: string; roleId: string; rank: number; tier: LayoutRole["tier"]; shelf: boolean;
  x: number; y: number; distance: number; angleDegrees: number; bodyRadius: number;
  /** [radial step, angular step] from the fit position; [0, 0] = exactly where the fit puts it. */
  displacement: [number, number]; overflow: boolean;
  /** MAPPING_LAYOUT_V1.1 only: the drawn radius, which takes the collision rule and the step (phase G, A1). */
  drawnRadius?: number;
}
export interface RoleLayout { specVersion: string; sectors: LayoutSector[]; bodies: LayoutBody[]; overflowCount: number }
export interface ArcRequirement { id: string; necessity: string; weight: number; value: number }
export interface Arc { id: string; startDegrees: number; endDegrees: number; spanDegrees: number; fill: number }
export interface ConstellationNode { key: string; name: string }
export interface PlacedNode { key: string; x: number; y: number; ring: number; overflow: boolean }

const { field, rings, body, sectors: sectorSpec, search, arcs: arcSpec, constellation } = spec;
/** The highest value a name relation can carry (the published formula: NAME_EXACT / NAME_ALIAS); the shelf spans fit 0 … this. */
const SHELF_FIT_CAP = 0.5;
const FULL_TURN = 360;

const round6 = (value: number): number => { const rounded = Math.round(value * 1e6) / 1e6; return rounded === 0 ? 0 : rounded; };
const byText = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
const toDegrees = (radians: number) => radians * (180 / Math.PI);
const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
/** 0, +1, −1, +2, −2 … ±steps — the order the search tries offsets in. */
const searchOrder = (steps: number): number[] => [0, ...Array.from({ length: steps }, (_, k) => [k + 1, -(k + 1)]).flat()];
const RADIAL = searchOrder(search.radialSteps), ANGULAR = searchOrder(search.angularSteps);

export const bodyRadius = (weightSum: number): number => clamp(body.base + body.perSqrtWeight * Math.sqrt(Math.max(0, weightSum)), body.min, body.max);

/** The radial position a role's fit gives it: checked roles inside the horizon, name-only roles on the shelf beyond it. */
export function fitDistance(tier: LayoutRole["tier"], fit: number | null): number {
  if (tier === "SEMANTIC") return rings.bestFit + (1 - clamp(fit ?? 0, 0, 1)) * (rings.zeroFit - rings.bestFit);
  return rings.shelfNear + (rings.shelfFar - rings.shelfNear) * (1 - clamp(fit ?? 0, 0, SHELF_FIT_CAP) / SHELF_FIT_CAP);
}

interface Sector { poolId: string; start: number; span: number; roles: number }

function sectorsOf(pools: readonly LayoutPool[], roles: readonly LayoutRole[]): Sector[] {
  const ordered = [...pools].sort((a, b) => byText(a.name, b.name) || byText(a.id, b.id));
  const floor = Math.ceil(sectorSpec.minShare * roles.length);
  const counted = ordered.map(pool => ({ pool, roles: roles.filter(role => role.poolId === pool.id).length }));
  const shares = counted.map(c => Math.max(c.roles, floor, 1));
  const shareTotal = shares.reduce((sum, share) => sum + share, 0);
  const free = FULL_TURN - sectorSpec.gapDegrees * ordered.length;
  let start = sectorSpec.startDegrees + sectorSpec.gapDegrees / 2;
  return counted.map((c, at) => {
    const span = (free * shares[at]) / shareTotal;
    const sector = { poolId: c.pool.id, start, span, roles: c.roles };
    start += span + sectorSpec.gapDegrees;
    return sector;
  });
}

/**
 * MAPPING_LAYOUT_V1.1 (layout-spec-v1.1.json; PERSON_X_JOB_MAPPING_PHASE_G.md §5/§7, A1): the drawn radius — V1's mass radius
 * mapped linearly onto [body.drawn.min, body.drawn.max]. Monotone in weightSum.
 */
export const drawnBodyRadius = (weightSum: number): number => {
  const b = specV11.body, rho = bodyRadius(weightSum);
  return b.drawn.min + ((rho - b.min) / (b.max - b.min)) * (b.drawn.max - b.drawn.min);
};

/** The job bodies around the person: pools as sectors, roles by rank (MAPPING_LAYOUT_V1, phase B). */
export function layoutRoles(pools: readonly LayoutPool[], roles: readonly LayoutRole[]): RoleLayout { return layoutWith(pools, roles, false); }
/**
 * MAPPING_LAYOUT_V1.1: the same algorithm with two radii, each with one role — the mass radius keeps the band rule (fit), the drawn
 * radius takes the collision rule and the step (bodies never touch as drawn). Every body states its drawnRadius.
 */
export function layoutRolesV11(pools: readonly LayoutPool[], roles: readonly LayoutRole[]): RoleLayout { return layoutWith(pools, roles, true); }

function layoutWith(pools: readonly LayoutPool[], roles: readonly LayoutRole[], v11: boolean): RoleLayout {
  const sectors = sectorsOf(pools, roles);
  const sectorByPool = new Map(sectors.map(sector => [sector.poolId, sector] as const));
  const nextIndex = new Map<string, number>();
  const bodies: LayoutBody[] = [];
  let overflowCount = 0;
  for (const role of [...roles].sort((a, b) => a.rank - b.rank)) {
    const sector = sectorByPool.get(role.poolId);
    if (sector === undefined) throw new Error(`ERR_MAPPING_LAYOUT_UNKNOWN_POOL:${role.poolId}`);
    const index = nextIndex.get(role.poolId) ?? 0;
    nextIndex.set(role.poolId, index + 1);
    const golden = (index + 1) * sectorSpec.golden;
    const angle = sector.start + sector.span * (sectorSpec.angleMargin + sectorSpec.angleSpread * (golden - Math.floor(golden)));
    const rho = bodyRadius(role.weightSum), shelf = role.tier !== "SEMANTIC";
    const drawn = v11 ? drawnBodyRadius(role.weightSum) : rho;
    const extra = v11 ? { drawnRadius: round6(drawn) } : {};
    const inner = shelf ? rings.shelfNear : rings.bestFit, outer = (shelf ? field.radius : rings.horizon) - rho;
    const fitAt = fitDistance(role.tier, role.fit), step = 2 * drawn + body.gap;
    const free = (x: number, y: number) => bodies.every(other => other.overflow || Math.hypot(other.x - x, other.y - y) >= (other.drawnRadius ?? other.bodyRadius) + drawn + body.gap);
    const place = (): LayoutBody | null => {
      for (const radial of RADIAL) {
        const distance = fitAt + radial * step;
        if (distance < inner || distance > outer) continue;
        const angularStep = toDegrees(step / distance);
        for (const angular of ANGULAR) {
          const at = angle + angular * angularStep;
          if (at < sector.start || at > sector.start + sector.span) continue;
          const x = distance * Math.cos(toRadians(at)), y = distance * Math.sin(toRadians(at));
          if (free(x, y)) return { poolId: role.poolId, roleId: role.roleId, rank: role.rank, tier: role.tier, shelf, x: round6(x), y: round6(y), distance: round6(distance),
            angleDegrees: round6(at), bodyRadius: round6(rho), displacement: [radial, angular], overflow: false, ...extra };
        }
      }
      return null;
    };
    const placed = place();
    if (placed !== null) { bodies.push(placed); continue; }
    overflowCount += 1;
    bodies.push({ poolId: role.poolId, roleId: role.roleId, rank: role.rank, tier: role.tier, shelf, x: round6(field.overflowRadius * Math.cos(toRadians(angle))),
      y: round6(field.overflowRadius * Math.sin(toRadians(angle))), distance: field.overflowRadius, angleDegrees: round6(angle), bodyRadius: round6(rho), displacement: [0, 0], overflow: true, ...extra });
  }
  return { specVersion: v11 ? specV11.specVersion : spec.specVersion, sectors: sectors.map(s => ({ poolId: s.poolId, startDegrees: round6(s.start), spanDegrees: round6(s.span), roles: s.roles })), bodies, overflowCount };
}

/** The requirement ring of one job body: necessity order, then heavier first, then id; an arc's length is its weight, its fill its value. */
export function layoutRequirementArcs(requirements: readonly ArcRequirement[]): Arc[] {
  const rank = (necessity: string) => {
    const at = arcSpec.necessityOrder.indexOf(necessity);
    if (at === -1) throw new Error(`ERR_MAPPING_LAYOUT_UNKNOWN_NECESSITY:${necessity}`);
    return at;
  };
  const order = new Map(requirements.map(r => [r, rank(r.necessity)] as const));
  const ordered = [...requirements].sort((a, b) => order.get(a)! - order.get(b)! || b.weight - a.weight || byText(a.id, b.id));
  if (ordered.length === 0) return [];
  const gap = ordered.length > 1 ? arcSpec.gapDegrees : 0;
  const free = FULL_TURN - gap * ordered.length, weightTotal = ordered.reduce((sum, r) => sum + r.weight, 0);
  let start = arcSpec.startDegrees + gap / 2;
  return ordered.map(r => {
    const span = (free * r.weight) / weightTotal;
    const arc = { id: r.id, startDegrees: round6(start), endDegrees: round6(start + span), spanDegrees: round6(span), fill: r.value };
    start += span + gap;
    return arc;
  });
}

/** The person's capabilities: by name then key; one alone in the centre, otherwise ring by ring from the inside; the rest is counted. */
export function layoutConstellation(nodes: readonly ConstellationNode[]): { nodes: PlacedNode[]; overflowCount: number } {
  const ordered = [...nodes].sort((a, b) => byText(a.name, b.name) || byText(a.key, b.key));
  if (ordered.length === 1) return { nodes: [{ key: ordered[0].key, x: 0, y: 0, ring: 0, overflow: false }], overflowCount: 0 };
  const placed: PlacedNode[] = [];
  constellation.ringRadii.forEach((radius, ring) => {
    const capacity = Math.floor((2 * Math.PI * radius) / constellation.spacing);
    const count = Math.min(capacity, ordered.length - placed.length), first = placed.length;
    for (let k = 0; k < count; k += 1) {
      const at = toRadians(constellation.startDegrees + (FULL_TURN * k) / count);
      placed.push({ key: ordered[first + k].key, x: round6(radius * Math.cos(at)), y: round6(radius * Math.sin(at)), ring, overflow: false });
    }
  });
  return { nodes: placed, overflowCount: ordered.length - placed.length };
}
