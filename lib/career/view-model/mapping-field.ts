import spec from "../../../docs/architecture/decision-fields/mapping-spec/layout-spec.json";
import type { CapabilityProposalProjection } from "../capability-core/projection";
import type { AutoMatchRunState, AutoMatchWatch, EvidenceClass, JobRankingState, RoleRanking } from "../ui/auto-match";
import { buildMappingView, capabilitiesOfProjection, type MappingRoleId, type MappingView } from "../mapping/view";
import { layoutConstellation, layoutRoles } from "../mapping/layout";
import { couplingSign, runSign, type CouplingClass, type RunSign } from "../mapping/signs";
import { diffRankings } from "../mapping/delta";
import { focusReduce, type FocusAction, type FocusState } from "../mapping/focus";

/**
 * PERSON × JOB mapping, phase C · the visible field on L0 (the whole field) and L1 (one pool). This module only composes the
 * released phase-B engine (lib/career/mapping: view, layout, signs, delta, focus) — it changes none of it and adds no rule of its own
 * to the layout or the signs: positions are the layout's, line kinds the sign table's, the levels the focus machine's.
 *
 * It reads only (B-7): the PERSON projection (capabilities) and the ranking that the automatic path has already read (GET). It owns no
 * entity (B-5), claims no decision (B-6) and never writes the job scope (B-3): no action of this field selects anything. L2 and L3
 * (a role opened, a requirement opened) are not part of phase C: their actions are refused here, whatever the engine would allow.
 * Pure and deterministic: no clock, no randomness, nothing written.
 */
export type FieldLevel = "L0" | "L1";
/** The focus actions phase C admits: open a pool, go up, reset, mark a role (a highlight only) and clear the mark. */
export const FIELD_ACTIONS = ["OPEN_POOL", "UP", "RESET", "MARK_ROLE", "CLEAR_SELECTION"] as const;
export type FieldAction = Extract<FocusAction, { type: typeof FIELD_ACTIONS[number] }>;

export interface FieldBody {
  /** `${jobPoolUploadId}\u0000${poolRoleId}` — the stable identity the delta uses. */
  readonly key: string;
  readonly id: MappingRoleId;
  readonly rank: number;
  readonly title: string;
  readonly organizationName: string;
  readonly poolName: string;
  readonly tier: "SEMANTIC" | "LEXICAL_ONLY";
  /** What L0 shows of a role (sign table, channel "class"): checked by the model, a name relation only, or no relation. */
  readonly class: CouplingClass;
  /** The line of that class, read from the sign table through the engine. */
  readonly line: string;
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly shelf: boolean;
  /** Moved off its fit position to find room: its distance is then approximate (quantities come from the data). */
  readonly displaced: boolean;
}
export interface FieldSector {
  readonly poolId: string;
  readonly poolName: string;
  readonly startDegrees: number;
  readonly spanDegrees: number;
  readonly roles: number;
  readonly drawn: number;
  /** Roles of this pool the layout found no room for: counted, not drawn. */
  readonly overflow: number;
}
export interface FieldRun {
  readonly state: AutoMatchRunState;
  readonly resumePending: boolean;
  readonly sign: RunSign;
  /** The table's breath, only while fewer roles are evaluated than planned (sign-table runStateRules.pendingBreath). */
  readonly pendingBreath: boolean;
}
export interface FieldNode { readonly key: string; readonly name: string; readonly x: number; readonly y: number }
export interface MappingFieldModel {
  readonly analysisId: string;
  readonly ranking: RoleRanking;
  readonly view: MappingView;
  readonly evidenceClass: EvidenceClass | null;
  readonly authority: MappingView["authority"];
  readonly run: FieldRun;
  /** By pool name, then id (the layout's order). */
  readonly sectors: readonly FieldSector[];
  /** The drawn bodies, by rank. */
  readonly bodies: readonly FieldBody[];
  readonly overflowCount: number;
  readonly constellation: { readonly nodes: readonly FieldNode[]; readonly overflowCount: number };
  readonly geometry: typeof GEOMETRY;
}
export interface MappingFieldInput {
  projection: CapabilityProposalProjection | null;
  ranking: JobRankingState;
  watch: AutoMatchWatch;
}

/** The rings of the field, as the layout specification names them (nothing is written a second time). */
const GEOMETRY = Object.freeze({
  fieldRadius: spec.field.radius, personRadius: spec.field.personRadius,
  bestFit: spec.rings.bestFit, horizon: spec.rings.horizon, shelfNear: spec.rings.shelfNear, shelfFar: spec.rings.shelfFar,
  nodeRadius: spec.constellation.nodeRadius
});
/** The line of each class at L0: the sign of the class's full-strength state, read from the table (never a second table here). */
export const CLASS_LINE: Readonly<Record<CouplingClass, string>> = Object.freeze({
  SEMANTIC: couplingSign("SEMANTIC", "EQUIVALENT").arcLine,
  LEXICAL: couplingSign("LEXICAL", "NAME_EXACT").arcLine,
  NONE: couplingSign("NONE", "NONE").arcLine
});

export const roleKey = (id: MappingRoleId) => `${id.jobPoolUploadId}\u0000${id.poolRoleId}`;

/**
 * The field for the ranking on view, or null when there is none to draw: no ranking read (the panel says why), no run read, or a
 * ranking of another analysis. An empty ranking gives a model with no bodies (view.empty says why).
 */
export function mappingFieldModel(input: MappingFieldInput): MappingFieldModel | null {
  if (input.ranking.state !== "AVAILABLE" || input.watch.read.state !== "AVAILABLE") return null;
  const ranking = input.ranking.ranking, run = input.watch.read.autoMatch;
  const view = buildMappingView({ capabilities: capabilitiesOfProjection(input.projection), ranking, run: { state: run.state, resumePending: run.resumePending }, evidenceClass: ranking.evidenceClass });
  const layout = layoutRoles(view.pools.map(p => ({ id: p.id, name: p.name })),
    view.roles.map(r => ({ poolId: r.id.jobPoolUploadId, roleId: r.id.poolRoleId, rank: r.rank, tier: r.tier, fit: r.fit, weightSum: r.weightSum })));
  const roleOf = new Map(view.roles.map(r => [roleKey(r.id), r] as const));
  const poolName = new Map(view.pools.map(p => [p.id, p.name] as const));
  const bodies: FieldBody[] = [];
  const overflowByPool = new Map<string, number>();
  for (const placed of layout.bodies) {
    if (placed.overflow) { overflowByPool.set(placed.poolId, (overflowByPool.get(placed.poolId) ?? 0) + 1); continue; }
    const role = roleOf.get(roleKey({ jobPoolUploadId: placed.poolId, poolRoleId: placed.roleId }))!;
    const cls: CouplingClass = role.tier === "SEMANTIC" ? "SEMANTIC" : role.requirements.some(q => q.source === "LEXICAL") ? "LEXICAL" : "NONE";
    bodies.push({ key: roleKey(role.id), id: role.id, rank: role.rank, title: role.title, organizationName: role.organizationName, poolName: poolName.get(placed.poolId) ?? placed.poolId,
      tier: role.tier, class: cls, line: CLASS_LINE[cls], x: placed.x, y: placed.y, radius: placed.bodyRadius, shelf: placed.shelf,
      displaced: placed.displacement[0] !== 0 || placed.displacement[1] !== 0 });
  }
  const sectors = layout.sectors.map(s => ({ poolId: s.poolId, poolName: poolName.get(s.poolId) ?? s.poolId, startDegrees: s.startDegrees, spanDegrees: s.spanDegrees, roles: s.roles,
    drawn: s.roles - (overflowByPool.get(s.poolId) ?? 0), overflow: overflowByPool.get(s.poolId) ?? 0 }));
  const placedNodes = layoutConstellation(view.constellation.map(c => ({ key: c.key, name: c.name })));
  const names = new Map(view.constellation.map(c => [c.key, c.name] as const));
  const sign = runSign(run.state, run.resumePending);
  const budget = run.budget;
  const pendingBreath = sign.pendingBreath && (budget === null || budget.rolesEvaluated < budget.rolesPlanned);
  return Object.freeze({
    analysisId: ranking.analysisId, ranking, view, evidenceClass: view.evidenceClass, authority: view.authority,
    run: Object.freeze({ state: run.state, resumePending: run.resumePending, sign, pendingBreath }),
    sectors: Object.freeze(sectors.map(s => Object.freeze(s))), bodies: Object.freeze(bodies.map(b => Object.freeze(b))), overflowCount: layout.overflowCount,
    constellation: Object.freeze({ nodes: Object.freeze(placedNodes.nodes.map(n => Object.freeze({ key: n.key, name: names.get(n.key) ?? n.key, x: n.x, y: n.y }))), overflowCount: placedNodes.overflowCount }),
    geometry: GEOMETRY
  });
}

/** The focus machine, held to phase C: only the admitted actions reach the engine; any other returns the very same state. */
export function fieldFocusReduce(state: FocusState, action: FieldAction | FocusAction): FocusState {
  if (!action || typeof action !== "object" || !(FIELD_ACTIONS as readonly string[]).includes(action.type)) return state;
  return focusReduce(state, action);
}

/** The level on view: L1 only while its pool is in the field; anything deeper is not phase C and reads as L0. */
export function fieldLevel(state: FocusState, model: MappingFieldModel | null): { level: FieldLevel; pool: string | null } {
  if (model !== null && state.level === "L1" && state.pool !== null && model.sectors.some(s => s.poolId === state.pool)) return { level: "L1", pool: state.pool };
  return { level: "L0", pool: null };
}

/** The marked role, while it is a drawn body of the field on view (and, on L1, of the open pool). */
export function markedBody(state: FocusState, model: MappingFieldModel | null): FieldBody | null {
  if (model === null || state.selection === null || state.selection.kind !== "ROLE") return null;
  const key = roleKey(state.selection.role);
  const { level, pool } = fieldLevel(state, model);
  const body = model.bodies.find(b => b.key === key) ?? null;
  return body === null || (level === "L1" && body.id.jobPoolUploadId !== pool) ? null : body;
}

export interface ViewBox { readonly x: number; readonly y: number; readonly width: number; readonly height: number }
const round3 = (v: number) => Math.round(v * 1000) / 1000;
/** L0: the whole field with a margin. */
export function fieldViewBox(margin = 24): ViewBox {
  const r = GEOMETRY.fieldRadius + margin;
  return { x: -r, y: -r, width: 2 * r, height: 2 * r };
}
/** L1: the square around one pool's sector (from the person's edge to the field's edge), with a margin. */
export function sectorViewBox(sector: Pick<FieldSector, "startDegrees" | "spanDegrees">, margin = 24): ViewBox {
  const from = sector.startDegrees, to = sector.startDegrees + sector.spanDegrees;
  const angles = [from, to];
  for (let quarter = Math.ceil(from / 90) * 90; quarter <= to; quarter += 90) angles.push(quarter);
  const points: Array<[number, number]> = [];
  for (const a of angles) for (const r of [GEOMETRY.personRadius, GEOMETRY.fieldRadius]) points.push([r * Math.cos((a * Math.PI) / 180), r * Math.sin((a * Math.PI) / 180)]);
  const xs = points.map(p => p[0]), ys = points.map(p => p[1]);
  const minX = Math.min(...xs) - margin, maxX = Math.max(...xs) + margin, minY = Math.min(...ys) - margin, maxY = Math.max(...ys) + margin;
  const side = Math.max(maxX - minX, maxY - minY), cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
  return { x: round3(cx - side / 2), y: round3(cy - side / 2), width: round3(side), height: round3(side) };
}

/**
 * The time sign (sign-table timeMovement): between two readings of one analysis, a body moves only when its own tier or fit changed
 * (delta ROLE_TIER_CHANGED / ROLE_FIT_CHANGED) — then with a trail from its previous drawn position; several changes of one read are
 * one movement. A new body appears without a trail; a re-read that changed nothing moves nothing.
 */
export interface BodyMovement { readonly moved: boolean; readonly from: { readonly x: number; readonly y: number } | null }
export interface FieldSnapshot { readonly analysisId: string; readonly ranking: RoleRanking; readonly bodies: readonly FieldBody[] }
export function bodyMovements(previous: FieldSnapshot | null, next: FieldSnapshot): ReadonlyMap<string, BodyMovement> {
  const out = new Map<string, BodyMovement>();
  if (previous === null || previous.analysisId !== next.analysisId) return out;
  const before = new Map(previous.bodies.map(b => [b.key, b] as const));
  const drawn = new Set(next.bodies.map(b => b.key));
  for (const change of diffRankings(previous.ranking, next.ranking)) {
    if (change.kind !== "ROLE_TIER_CHANGED" && change.kind !== "ROLE_FIT_CHANGED") continue;
    const key = roleKey(change.role);
    if (!drawn.has(key) || out.has(key)) continue;
    const was = before.get(key);
    out.set(key, Object.freeze({ moved: true, from: was === undefined ? null : Object.freeze({ x: was.x, y: was.y }) }));
  }
  return out;
}
