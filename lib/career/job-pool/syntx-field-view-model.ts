/**
 * SYNTX semiontic field: the read-only presentation adapter over the Job Pool truth
 * (owner mandate "SFE — SYNTX SEMIONTIC FIELD RECONSTRUCTION", 2026-10-11; spec §14, binding §2–§4, rulings R1–R14).
 *
 * One pure derivation turns the delivered upload view (canonical mapping, raw pool), the delivered presentation
 * matching of the same upload and the analysis sources (documents, evidence locations, proposal evidence ids) into
 * field entities, relations, visual signs, transitions and proof references for one observation point:
 *
 *   FIELD → ORGANIZATION → ROLE → REQUIREMENT (+ aperture) → RETURN
 *
 * It persists nothing, scores nothing, evaluates nothing, recommends nothing and decides nothing. Every sign carries
 * the proof the binding names for it; a sign the binding does not bind is not emitted (binding §3). Geometry:
 *   - FIELD / ORGANIZATION: containment only (organization ⊃ role); no coupling, no score, no delivered-order position (R4, R14);
 *   - ROLE: relation-state geometry (§9.2): the support category sets the anchor distance, contribution modulates only
 *     the weight of a trace within its category; the resonance score is the candidate↔role coupling, numeric only in an aperture;
 *   - no closure anywhere while every relation is NOT_EVALUATED (R1); pending is rendered once per role ecology (R2);
 *   - missing support is a neutral open boundary (R3); sweep coverage is dotted and never scored (R5); weak support scores (R6);
 *   - overlap is preserved: a requirement shows every relation it has (R7).
 *
 * STRUCTURE → RELATION → STATE → PERCEPTION → INTERPRETATION
 */
import type { JobPoolMatchPresentation, JobPoolMatchedRequirement, JobPoolUploadView } from "./types";
import type { AnalysisSources } from "./analysis-sources";
import { presentationLabels, type JobPoolPresentationLabel } from "./frontend-presentation";

export const SYNTX_FIELD_GRAMMAR = "SYNTX_FIELD_V1";
export const SYNTX_LAYOUT = Object.freeze({ size: 1000, center: 500 });

/* ----------------------------------------------------------------------------------------------------------------
 * Observation point and sign vocabulary (spec §5, §14.3; only values the binding produces)
 * ---------------------------------------------------------------------------------------------------------------- */

export type SyntxObservationKind = "FIELD" | "ORGANIZATION" | "ROLE" | "REQUIREMENT";

export interface SyntxObservation {
  kind: SyntxObservationKind;
  organizationId: string | null;
  roleId: string | null;
  requirementId: string | null;
  /** The sign whose aperture is open (a trace, an open boundary or the pending boundary); REQUIREMENT level only. */
  apertureSignId: string | null;
}

export const FIELD_OBSERVATION: SyntxObservation = Object.freeze({ kind: "FIELD", organizationId: null, roleId: null, requirementId: null, apertureSignId: null });

export type SignSource = "canonical_entity" | "matching_contribution" | "gemini_sweep" | "evidence" | "provenance" | "authority_state" | "evaluation_state";
export type SignRelation = "contains" | "requires" | "supports" | "weakly_supports" | "covers_unscored" | "missing_support" | "pending_evaluation";
export type SignState = "field" | "organization_selected" | "role_selected" | "requirement_selected" | "receded" | "inspectable";
export type SignManifestation = "carrier" | "region" | "anchor" | "trace_stable" | "trace_thin" | "trace_dotted" | "open_boundary" | "suspended_boundary" | "temporary_aperture";
export type SignInteraction = "select" | "inspect" | "return" | "none";
export type SignTransition = "recenter" | "unfold" | "recede" | "trace_rise" | "boundary_suspend" | "restore";

/** Proof references exactly as the binding table names them for the sign (§2); absent = the binding names none. */
export interface SignProof {
  uploadId?: string;
  organizationId?: string;
  roleId?: string;
  requirementId?: string;
  /** Canonical target of the carrier: TOREV/organization entity, role entity, role↔organization binding revision or TRPREV. */
  targetId?: string;
  /** TRQREV ids; several (space-separated) only on the pending boundary of a role ecology. */
  trqrevId?: string;
  analysisId?: string;
  /** CAP_* (scored/weak) or PCAP_* (sweep) as delivered. */
  capabilityId?: string;
  docId?: string;
  /** EVD_* only when the exact join into the proposal projection resolves. */
  evidenceId?: string;
}

export interface VisualSign {
  id: string;
  source: SignSource;
  relation: SignRelation;
  state: SignState;
  manifestation: SignManifestation;
  interaction: SignInteraction;
  transition: SignTransition;
  proof: SignProof;
}

/* ----------------------------------------------------------------------------------------------------------------
 * Field entities
 * ---------------------------------------------------------------------------------------------------------------- */

export interface SyntxOrganization {
  id: string;
  name: string;
  industry: string | null;
  region: string | null;
  targetEntityId: string;
  roleIds: string[];
  x: number;
  y: number;
  radius: number;
  sign: VisualSign;
}

export interface SyntxRoleMatching {
  resonanceScore: number;
  deliveredRank: number;
  targetRoleProfileRevisionId: string;
  targetRequirementRevisionIds: string[];
  relationState: "NOT_EVALUATED";
  reason: "VERIFIED_CAPABILITY_SNAPSHOT_ABSENT";
}

export interface SyntxRole {
  id: string;
  title: string;
  organizationId: string;
  organizationName: string;
  seniority: string | null;
  domainFocus: string | null;
  targetEntityId: string;
  bindingRevisionId: string;
  targetRoleProfileRevisionId: string;
  requirementCount: number;
  x: number;
  y: number;
  radius: number;
  sign: VisualSign;
  /** Delivered presentation matching for this role, when the matching of this exact upload was delivered; else null. */
  matching: SyntxRoleMatching | null;
}

/** The support category of a requirement, from the delivered matching sets (one of matched / weakEvidence / missing) and the sweep. */
export type SyntxSupport = "SUPPORTED" | "WEAK" | "SWEEP_ONLY" | "OPEN" | "UNREAD";

export type SyntxTraceKind = "supports" | "weakly_supports" | "covers_unscored";

export interface SyntxTrace {
  sign: VisualSign;
  kind: SyntxTraceKind;
  requirementId: string;
  roleId: string;
  docId: string;
  quote: string;
  /** Source title from the analysis documents; null when the exact join did not resolve or the analysis was not read. */
  sourceTitle: string | null;
  sourceTitleState: "RESOLVED" | "UNRESOLVED" | "NOT_READ";
  /** Evidence location from the analysis capability (scored/weak) when the exact join resolves. */
  location: string | null;
  /** EVD_* (sweep) when the exact join resolves. */
  evidenceId: string | null;
  capabilityId: string;
  capabilityName: string;
  matchedConstituent: string | null;
  basis: JobPoolMatchedRequirement["matchBasis"];
  /** Scored / weak only (R6); null for sweep coverage (no confidence, no coupling — binding §3). */
  contribution: number | null;
  confidence: number | null;
  weakReason: string | null;
  /** Trace weight within its category: stable 1 … 2.2 by relative contribution, thin 0.6 … 1.2, dotted constant 1. */
  weight: number;
  /** Index of the source carrier the trace reaches (field.sources). */
  sourceDocIndex: number;
  /**
   * Perpendicular offset (field units) of the trace's midpoint from the straight line anchor → carrier; 0 = straight.
   * Geometry only (never part of the sign or its proof): co-terminal traces receive distinct bows so no trace hides
   * another (F-SX-2), and a trace bends around the role carrier and the requirement labels instead of crossing them (O-SX-2).
   */
  bow: number;
}

export interface SyntxRequirement {
  id: string;
  roleId: string;
  name: string;
  targetRequirementRevisionId: string;
  necessity: string | null;
  weight: number | null;
  requiredLevel: string | null;
  evidenceHint: string | null;
  support: SyntxSupport;
  /** NOT_EVALUATED for every requirement while the delivered matching names no verified capability snapshot; null when no matching was read. */
  evaluationState: "NOT_EVALUATED" | null;
  /** Angle from 12 o'clock and distance from the role center (relation-state geometry, §9.2). */
  angle: number;
  distance: number;
  x: number;
  y: number;
  sign: VisualSign;
  traces: SyntxTrace[];
  openBoundary: VisualSign | null;
}

export interface SyntxSource {
  docId: string;
  title: string | null;
  titleState: "RESOLVED" | "UNRESOLVED" | "NOT_READ";
  x: number;
  y: number;
  sign: VisualSign;
  traceCount: number;
}

export interface SyntxPendingBoundary {
  roleId: string;
  radius: number;
  targetRoleProfileRevisionId: string;
  targetRequirementRevisionIds: string[];
  sign: VisualSign;
}

export interface SyntxAperture {
  sign: VisualSign;
  /** What the aperture inspects: a trace, the open boundary of a requirement or the pending boundary of the role ecology. */
  inspects: { kind: "trace"; trace: SyntxTrace } | { kind: "open"; requirement: SyntxRequirement } | { kind: "pending"; boundary: SyntxPendingBoundary };
  requirement: SyntxRequirement | null;
}

export interface SyntxCamera {
  x: number;
  y: number;
  scale: number;
}

export interface SyntxBoundary {
  authorityState: "NONE";
  canonicalEvaluation: false;
  decision: false;
  labels: readonly JobPoolPresentationLabel[];
  policyVersion: string;
  weakEvidenceThreshold: number;
  candidateCapabilityCount: number;
  capabilitySweep: JobPoolMatchPresentation["capabilitySweep"];
}

export interface SyntxField {
  grammar: typeof SYNTX_FIELD_GRAMMAR;
  observation: SyntxObservation;
  pool: { jobPoolUploadId: string; poolId: string; poolName: string; poolVersion: number; poolStatus: JobPoolUploadView["poolStatus"]; mappingState: "MAPPED"; proposalState: "PROPOSAL_ONLY"; authorityState: "NONE"; sign: VisualSign };
  organizations: SyntxOrganization[];
  roles: SyntxRole[];
  /** Requirements of the observed role (ROLE / REQUIREMENT); empty at FIELD / ORGANIZATION. */
  requirements: SyntxRequirement[];
  sources: SyntxSource[];
  pendingBoundary: SyntxPendingBoundary | null;
  aperture: SyntxAperture | null;
  camera: SyntxCamera;
  /** Whether the presentation matching of this exact upload (and this analysis) was delivered. */
  matchingDelivered: boolean;
  analysisId: string | null;
  boundary: SyntxBoundary | null;
  /** Every sign the renderer places, in render order. */
  signs: VisualSign[];
  summary: SyntxSummary;
}

/* ----------------------------------------------------------------------------------------------------------------
 * Raw pool enrichment (optional; the carriers themselves come from the canonical mapping)
 * ---------------------------------------------------------------------------------------------------------------- */

interface PoolEnrichment {
  organizations: Map<string, { industry: string | null; region: string | null }>;
  roles: Map<string, { seniority: string | null; domainFocus: string | null }>;
  requirements: Map<string, { necessity: string | null; weight: number | null; requiredLevel: string | null; evidenceHint: string | null }>;
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const str = (value: unknown): string | null => (typeof value === "string" && value.length > 0 ? value : null);
const num = (value: unknown): number | null => (typeof value === "number" && Number.isFinite(value) ? value : null);

function enrichment(pool: unknown): PoolEnrichment {
  const result: PoolEnrichment = { organizations: new Map(), roles: new Map(), requirements: new Map() };
  if (!isRecord(pool)) return result;
  for (const item of Array.isArray(pool.organizations) ? pool.organizations : []) {
    if (!isRecord(item)) continue;
    const id = str(item.id);
    if (id !== null) result.organizations.set(id, { industry: str(item.industry), region: str(item.region) });
  }
  for (const item of Array.isArray(pool.roles) ? pool.roles : []) {
    if (!isRecord(item)) continue;
    const id = str(item.id);
    if (id !== null) result.roles.set(id, { seniority: str(item.seniority), domainFocus: str(item.domain_focus) });
  }
  for (const item of Array.isArray(pool.requirements) ? pool.requirements : []) {
    if (!isRecord(item)) continue;
    const id = str(item.id);
    if (id !== null) result.requirements.set(id, { necessity: str(item.necessity), weight: num(item.weight), requiredLevel: str(item.required_level), evidenceHint: str(item.evidence_hint) });
  }
  return result;
}

/* ----------------------------------------------------------------------------------------------------------------
 * Geometry
 * ---------------------------------------------------------------------------------------------------------------- */

const round = (value: number): number => Math.round(value * 100) / 100;
const polar = (cx: number, cy: number, radius: number, angle: number): [number, number] => {
  const radians = ((angle - 90) * Math.PI) / 180;
  return [round(cx + radius * Math.cos(radians)), round(cy + radius * Math.sin(radians))];
};

/** Anchor distance by support category (§9.2): supported closest, weak farther, sweep-only exploratory, open at the boundary. */
export const SUPPORT_DISTANCE: Record<SyntxSupport, number> = Object.freeze({ SUPPORTED: 101, WEAK: 127, SWEEP_ONLY: 153, OPEN: 179, UNREAD: 135 });
export const PENDING_BOUNDARY_RADIUS = 205;
/** Evidence sector of the ecology (deep-focus composition of the Capability Field: the evidence surface sits directly beneath the nucleus): the
 * arc at the bottom of the role ecology, measured from straight below, kept free of requirement anchors and holding the source carriers. */
export const EVIDENCE_SECTOR = Object.freeze({ center: 180, halfWidth: 45 });
/** Source carriers sit inside the ecology, beneath the role core, inside the suspended boundary (205): evidence attached to the focused entity, not a satellite outside it. */
export const SOURCE_RING_RADIUS = 135;
const SUPPORT_ORDER: readonly SyntxSupport[] = ["SUPPORTED", "WEAK", "SWEEP_ONLY", "OPEN", "UNREAD"];

export const CAMERA_SCALE = Object.freeze({ FIELD: 1, ROLE: 1.8, REQUIREMENT: 2.4 });

/* ----------------------------------------------------------------------------------------------------------------
 * Ecology geometry (perceptual closure, owner mandate "SFE — SYNTX FINAL PERCEPTUAL CLOSURE", 2026-10-11)
 *
 * Positions and bows are presentation geometry: they position nothing semantically (R14 — angle and curvature encode
 * no relation, distance alone carries the support category). The renderer and the proofs read the same numbers.
 * ---------------------------------------------------------------------------------------------------------------- */

/** Wraps a label into at most `maxLines` lines of about `maxChars` characters (the last line takes the rest). */
export function wrapLines(text: string, maxChars: number, maxLines = 3): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const wordText of words) {
    const candidate = current.length === 0 ? wordText : `${current} ${wordText}`;
    if (candidate.length <= maxChars || current.length === 0) current = candidate;
    else { lines.push(current); current = wordText; }
  }
  if (current.length > 0) lines.push(current);
  if (lines.length <= maxLines) return lines;
  return [...lines.slice(0, maxLines - 1), lines.slice(maxLines - 1).join(" ")];
}

export interface LabelBox { x: number; y: number; width: number; height: number }
export interface RequirementLabel { lines: string[]; x: number; y: number; anchor: "middle" | "start" | "end"; box: LabelBox }

/** Requirement label metrics (font size and character width in field units, as the renderer draws them). */
export const REQUIREMENT_LABEL = Object.freeze({ maxChars: 16, maxLines: 3, size: 7.8, charWidth: 4.9, lineHeight: 9.2, gap: 12 });
/** The role carrier with its inner title: no trace enters this disc (O-SX-2). */
export const ROLE_CLEARANCE_RADIUS = 62;
/** The observed role as the nucleus of its ecology (Capability Field L2 nucleus): its body radius there; the ecology radii above are scaled with it (×1.3), categories and order unchanged. */
export const ECOLOGY_NUCLEUS_RADIUS = 45;
/** Source carrier (document glyph ±12) with its SOURCE kicker and two-line title below: no foreign trace crosses it; the REQUIREMENT camera keeps it in view. */
export const SOURCE_BOX = Object.freeze({ halfWidth: 52, above: 14, below: 68 });
/** Bows tried in order; co-terminal traces never share a bow, so each remains visible and hit-testable (F-SX-2). */
export const TRACE_BOWS: readonly number[] = Object.freeze([0, 18, -18, 36, -36, 54, -54, 72, -72]);
const TRACE_CLEARANCE = 2;
const SOURCE_SEPARATION = 28;

/** The requirement label outward from its anchor (never toward the role): position, anchor and bounding box. */
export function requirementLabel(requirement: { x: number; y: number; angle: number; name: string }): RequirementLabel {
  const { maxChars, maxLines, size, charWidth, lineHeight, gap } = REQUIREMENT_LABEL;
  const lines = wrapLines(requirement.name, maxChars, maxLines);
  const radians = ((requirement.angle - 90) * Math.PI) / 180;
  const outward = Math.cos(radians);
  const anchor: RequirementLabel["anchor"] = Math.abs(outward) < 0.3 ? "middle" : outward > 0 ? "start" : "end";
  const x = requirement.x + Math.cos(radians) * gap;
  const y = requirement.y + Math.sin(radians) * gap + (anchor === "middle" ? (Math.sin(radians) > 0 ? 10 : -(lines.length - 1) * 10 - 2) : 3);
  const width = Math.max(...lines.map(line => line.length)) * charWidth;
  const left = anchor === "start" ? x : anchor === "end" ? x - width : x - width / 2;
  return { lines, x: round(x), y: round(y), anchor, box: { x: round(left), y: round(y - size), width: round(width), height: round((lines.length - 1) * lineHeight + size + 2) } };
}

type Point = { x: number; y: number };
interface Obstacles { discs: Array<Point & { r: number }>; rects: LabelBox[] }

/** Base sweep of every trace (fraction of its span): evidence couples in an arc, as the planetarium's inter-orbital couplings do (quadratic paths), never as a straight wire. */
export const TRACE_SWEEP = 0.14;

/** The control point of a trace's quadratic arc: the midpoint deviates by the base sweep plus `bow` to the left normal (distinct bows stay distinct). Geometry only (R14). */
function traceControl(from: Point, to: Point, bow: number): Point {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  const offset = 2 * (TRACE_SWEEP * length + bow);
  return { x: (from.x + to.x) / 2 + (-dy / length) * offset, y: (from.y + to.y) / 2 + (dx / length) * offset };
}

/** A point on the trace: the quadratic arc whose midpoint is offset by the base sweep plus `bow` to the left normal. */
export function tracePoint(from: Point, to: Point, bow: number, t: number): Point {
  const c = traceControl(from, to, bow);
  const u = 1 - t;
  return { x: u * u * from.x + 2 * u * t * c.x + t * t * to.x, y: u * u * from.y + 2 * u * t * c.y + t * t * to.y };
}

const formatPath = (value: number) => Math.round(value * 100) / 100;

/** The SVG path of a trace from the anchor to the carrier (the renderer and the proofs draw the same curve). */
export function tracePath(from: Point, to: Point, bow: number): string {
  const c = traceControl(from, to, bow);
  return `M ${formatPath(from.x)} ${formatPath(from.y)} Q ${formatPath(c.x)} ${formatPath(c.y)} ${formatPath(to.x)} ${formatPath(to.y)}`;
}

/** The same curve walked from the carrier to the anchor: the direction in which evidence streams along the trace. */
export function traceRayPath(from: Point, to: Point, bow: number): string {
  const c = traceControl(from, to, bow);
  return `M ${formatPath(to.x)} ${formatPath(to.y)} Q ${formatPath(c.x)} ${formatPath(c.y)} ${formatPath(from.x)} ${formatPath(from.y)}`;
}

const distanceToRect = (point: Point, rect: LabelBox): number => {
  const dx = Math.max(rect.x - point.x, 0, point.x - (rect.x + rect.width));
  const dy = Math.max(rect.y - point.y, 0, point.y - (rect.y + rect.height));
  return Math.hypot(dx, dy);
};

/** Smallest clearance (field units) between the trace and any obstacle, sampled along the curve without its endpoints. */
export function traceClearance(from: Point, to: Point, bow: number, obstacles: Obstacles): number {
  let clearance = Infinity;
  for (let step = 1; step < 16; step += 1) {
    const point = tracePoint(from, to, bow, step / 16);
    for (const disc of obstacles.discs) clearance = Math.min(clearance, Math.hypot(point.x - disc.x, point.y - disc.y) - disc.r);
    for (const rect of obstacles.rects) clearance = Math.min(clearance, distanceToRect(point, rect));
  }
  return clearance;
}

const angleBetween = (a: number, b: number): number => { const delta = Math.abs(((a - b) % 360 + 540) % 360 - 180); return delta; };

/**
 * Source carrier angles on the outer ring: each carrier sits where the straight traces of the requirements that reach
 * it clear the role carrier and every requirement label best, nearest to the mean direction of those requirements;
 * carriers keep a minimum angular separation. Deterministic (first best angle wins), observation-independent.
 */
export function placeSourceAngles(role: Point, reaching: ReadonlyArray<Point[]>, requirements: ReadonlyArray<{ x: number; y: number; angle: number; name: string }>): number[] {
  const rects = requirements.map(requirement => requirementLabel(requirement).box);
  const anchors = requirements.map(requirement => ({ x: requirement.x, y: requirement.y, r: 7 }));
  const placed: number[] = [];
  return reaching.map(points => {
    const vector = points.reduce((sum, point) => { const angle = Math.atan2(point.x - role.x, -(point.y - role.y)); return { x: sum.x + Math.sin(angle), y: sum.y + Math.cos(angle) }; }, { x: 0, y: 0 });
    const mean = points.length === 0 || Math.hypot(vector.x, vector.y) < 1e-6 ? EVIDENCE_SECTOR.center : ((Math.atan2(vector.x, vector.y) * 180) / Math.PI + 360) % 360;
    let best: { angle: number; score: number } | null = null;
    const evaluate = (separated: boolean) => {
      for (let angle = EVIDENCE_SECTOR.center - EVIDENCE_SECTOR.halfWidth; angle <= EVIDENCE_SECTOR.center + EVIDENCE_SECTOR.halfWidth; angle += 5) {
        if (separated && placed.some(other => angleBetween(other, angle) < SOURCE_SEPARATION)) continue;
        const [x, y] = polar(role.x, role.y, SOURCE_RING_RADIUS, angle);
        const carrier = { x, y };
        let clearance = 24;
        for (const point of points) {
          const discs = [{ x: role.x, y: role.y, r: ROLE_CLEARANCE_RADIUS }, ...anchors.filter(anchor => anchor.x !== point.x || anchor.y !== point.y)];
          clearance = Math.min(clearance, traceClearance(point, carrier, 0, { discs, rects }));
        }
        // Evidence sits beneath the nucleus (L2 deep focus): nearest to the sector centre wins; clearance only breaks ties.
        const score = -angleBetween(angle, EVIDENCE_SECTOR.center) + 0.001 * clearance;
        if (best === null || score > best.score + 1e-9) best = { angle, score };
      }
    };
    evaluate(true);
    if (best === null) evaluate(false);
    const angle = best === null ? mean : (best as { angle: number }).angle;
    placed.push(angle);
    return angle;
  });
}

/**
 * Bows for the traces of one requirement grouped by source carrier: the first bow (straight first) that clears the role
 * carrier, every requirement label and every other anchor and carrier, never one a co-terminal trace already took.
 * When nothing clears, the clearest unused bow is taken, so every trace is drawn and distinct.
 */
export function routeTraceBows(from: Point, to: Point, taken: readonly number[], obstacles: Obstacles): number {
  const candidates = TRACE_BOWS.filter(bow => taken.every(used => Math.abs(used - bow) >= 18));
  const pool = candidates.length > 0 ? candidates : TRACE_BOWS.filter(bow => !taken.includes(bow));
  let fallback: { bow: number; clearance: number } | null = null;
  for (const bow of pool) {
    const clearance = traceClearance(from, to, bow, obstacles);
    if (clearance >= TRACE_CLEARANCE) return bow;
    if (fallback === null || clearance > fallback.clearance) fallback = { bow, clearance };
  }
  return fallback === null ? 0 : fallback.bow;
}

/** Organization regions on one ring around the field centre; the region radius grows with the number of roles (density, never importance). */
function placeOrganizations(groups: ReadonlyArray<{ id: string; roleIds: string[] }>): Map<string, { x: number; y: number; radius: number }> {
  const placed = new Map<string, { x: number; y: number; radius: number }>();
  const count = groups.length;
  const { center } = SYNTX_LAYOUT;
  if (count === 0) return placed;
  // A region is a planetarium node: room for its identity block above the roles and its density pill below (living field, 2026-10-12).
  const density = (roleIds: string[]) => Math.min(190, 92 + 30 * Math.sqrt(Math.max(1, roleIds.length)));
  if (count === 1) { placed.set(groups[0].id, { x: center, y: center, radius: Math.min(250, density(groups[0].roleIds) + 50) }); return placed; }
  const maxRadius = Math.max(...groups.map(group => density(group.roleIds)));
  // Regions are spaced so that a role label reaching outward from one region (≈ 138 units) never crosses into the next region.
  const ring = Math.min(500 - maxRadius - 24, Math.max(170, (maxRadius + 138) / Math.sin(Math.PI / count)));
  const slot = 360 / count;
  groups.forEach((group, index) => {
    const [x, y] = polar(center, center, ring, index * slot);
    placed.set(group.id, { x, y, radius: Math.min(density(group.roleIds), Math.max(60, ring * Math.sin(Math.PI / count) - 14)) });
  });
  return placed;
}

/** Roles inside their organization region: one at the centre, otherwise on an inner ring; unfolded (wider) when the organization is observed. */
function placeRoles(region: { x: number; y: number; radius: number }, roleIds: readonly string[], unfolded: boolean): Map<string, { x: number; y: number }> {
  const placed = new Map<string, { x: number; y: number }>();
  // The roles sit in the lower part of the region (the identity block reads above them), on an inner ring that widens when the region unfolds.
  const centreY = region.y + region.radius * 0.14;
  if (roleIds.length === 1) { placed.set(roleIds[0], { x: region.x, y: round(centreY) }); return placed; }
  const inner = region.radius * (unfolded ? 0.52 : 0.44);
  const slot = 360 / roleIds.length;
  roleIds.forEach((id, index) => { const [x, y] = polar(region.x, centreY, inner, index * slot + (roleIds.length === 2 ? 90 : 0)); placed.set(id, { x, y }); });
  return placed;
}

/* ----------------------------------------------------------------------------------------------------------------
 * Signs
 * ---------------------------------------------------------------------------------------------------------------- */

const sign = (id: string, source: SignSource, relation: SignRelation, manifestation: SignManifestation, interaction: SignInteraction, transition: SignTransition, proof: SignProof, state: SignState = "field"): VisualSign => ({ id, source, relation, state, manifestation, interaction, transition, proof });

/* ----------------------------------------------------------------------------------------------------------------
 * Summary facts (BR-4 / R9): the screen-reader summary derives from the same objects as the visual signs
 * ---------------------------------------------------------------------------------------------------------------- */

export type SyntxSummary =
  | { kind: "FIELD"; poolName: string; poolVersion: number; poolStatus: string; organizationCount: number; roleCount: number; matchingDelivered: boolean }
  | { kind: "ORGANIZATION"; organizationName: string; roleTitles: string[] }
  | { kind: "ROLE"; roleTitle: string; organizationName: string; requirementCount: number; supported: number; weak: number; sweepOnly: number; open: number; unread: number; pendingEvaluation: boolean }
  | { kind: "REQUIREMENT"; requirementName: string; roleTitle: string; support: SyntxSupport; traceCount: number; sourceCount: number; apertureOpen: boolean };

/* ----------------------------------------------------------------------------------------------------------------
 * Derivation
 * ---------------------------------------------------------------------------------------------------------------- */

/** Validates an observation against the delivered field; a stale id falls back to its parent level and is named. */
export interface SyntxObservationResolution { observation: SyntxObservation; stale: { kind: Exclude<SyntxObservationKind, "FIELD">; id: string } | null }

export function resolveObservation(view: JobPoolUploadView | null, requested: SyntxObservation): SyntxObservationResolution {
  if (view === null) return { observation: FIELD_OBSERVATION, stale: null };
  const mapping = view.canonicalMapping;
  const roles = mapping.roles;
  if (requested.kind === "FIELD") return { observation: FIELD_OBSERVATION, stale: null };
  if (requested.kind === "ORGANIZATION") {
    const ok = requested.organizationId !== null && mapping.organizations.some(organization => organization.poolOrganizationId === requested.organizationId);
    return ok ? { observation: { ...FIELD_OBSERVATION, kind: "ORGANIZATION", organizationId: requested.organizationId }, stale: null } : { observation: FIELD_OBSERVATION, stale: { kind: "ORGANIZATION", id: requested.organizationId ?? "" } };
  }
  const role = requested.roleId === null ? null : roles.find(candidate => candidate.poolRoleId === requested.roleId) ?? null;
  if (role === null) return { observation: FIELD_OBSERVATION, stale: { kind: "ROLE", id: requested.roleId ?? "" } };
  if (requested.kind === "ROLE") return { observation: { ...FIELD_OBSERVATION, kind: "ROLE", organizationId: role.poolOrganizationId, roleId: role.poolRoleId, apertureSignId: requested.apertureSignId }, stale: null };
  const requirement = requested.requirementId === null ? null : role.requirements.find(candidate => candidate.poolRequirementId === requested.requirementId) ?? null;
  if (requirement === null) return { observation: { ...FIELD_OBSERVATION, kind: "ROLE", organizationId: role.poolOrganizationId, roleId: role.poolRoleId }, stale: { kind: "REQUIREMENT", id: requested.requirementId ?? "" } };
  return { observation: { kind: "REQUIREMENT", organizationId: role.poolOrganizationId, roleId: role.poolRoleId, requirementId: requirement.poolRequirementId, apertureSignId: requested.apertureSignId }, stale: null };
}

/**
 * The REQUIREMENT camera: constant scale, centred between the anchor and the role, then shifted the least that keeps the
 * observed anchor with its label and every source carrier its traces reach inside the view (O-SX-4).
 */
export function requirementCamera(requirement: SyntxRequirement, role: Point, reached: ReadonlyArray<Point>): SyntxCamera {
  const scale = CAMERA_SCALE.REQUIREMENT;
  const half = SYNTX_LAYOUT.center / scale;
  const margin = 10;
  const label = requirementLabel(requirement).box;
  // The nucleus stays in view (hierarchy: nucleus, selected requirement, evidence body).
  const nucleus = ECOLOGY_NUCLEUS_RADIUS + 12;
  const xs = [role.x - nucleus, role.x + nucleus, requirement.x - 14, requirement.x + 14, label.x, label.x + label.width, ...reached.flatMap(point => [point.x - SOURCE_BOX.halfWidth, point.x + SOURCE_BOX.halfWidth])];
  const ys = [role.y - nucleus, role.y + nucleus, requirement.y - 14, requirement.y + 14, label.y, label.y + label.height, ...reached.flatMap(point => [point.y - SOURCE_BOX.above, point.y + SOURCE_BOX.below])];
  const fit = (values: number[], preferred: number): number => {
    const lo = Math.min(...values) - margin;
    const hi = Math.max(...values) + margin;
    if (hi - lo > 2 * half) return round((lo + hi) / 2);
    return round(Math.min(Math.max(preferred, hi - half), lo + half));
  };
  return { x: fit(xs, (requirement.x * 2 + role.x) / 3), y: fit(ys, (requirement.y * 2 + role.y) / 3), scale };
}

export function deriveSyntxField(view: JobPoolUploadView | null, matching: JobPoolMatchPresentation | null, analysisSources: AnalysisSources | null, requested: SyntxObservation): SyntxField | null {
  if (view === null) return null;
  const { observation } = resolveObservation(view, requested);
  const mapping = view.canonicalMapping;
  const extra = enrichment(view.pool);
  const matchingDelivered = matching !== null && matching.jobPoolUploadId === view.jobPoolUploadId;
  const delivered = matchingDelivered ? matching!.roleMatches : [];
  const analysisId = matchingDelivered ? matching!.analysisId : null;
  const sources = analysisSources !== null && analysisId !== null && analysisSources.analysisId === analysisId ? analysisSources : null;
  const signs: VisualSign[] = [];
  const push = <T extends VisualSign>(value: T): T => { signs.push(value); return value; };

  // Containment: organizations in delivered mapping order, roles grouped by their stored organization id (never by label text).
  const groups = mapping.organizations.map(organization => ({ id: organization.poolOrganizationId, roleIds: mapping.roles.filter(role => role.poolOrganizationId === organization.poolOrganizationId).map(role => role.poolRoleId) }));
  for (const role of mapping.roles) if (!groups.some(group => group.id === role.poolOrganizationId)) groups.push({ id: role.poolOrganizationId, roleIds: [role.poolRoleId] });
  const regions = placeOrganizations(groups);

  const poolSign = push(sign(`field:${view.jobPoolUploadId}`, "canonical_entity", "contains", "region", observation.kind === "FIELD" ? "none" : "return", observation.kind === "FIELD" ? "unfold" : "restore", { uploadId: view.jobPoolUploadId }, observation.kind === "FIELD" ? "field" : "receded"));

  const organizations: SyntxOrganization[] = groups.map(group => {
    const mapped = mapping.organizations.find(organization => organization.poolOrganizationId === group.id) ?? null;
    const region = regions.get(group.id)!;
    const observedHere = observation.organizationId === group.id;
    const state: SignState = observation.kind === "FIELD" ? "field" : observation.kind === "ORGANIZATION" ? (observedHere ? "organization_selected" : "receded") : observedHere ? "field" : "receded";
    const extraOrg = extra.organizations.get(group.id) ?? null;
    return {
      id: group.id,
      name: mapped?.name ?? group.id,
      industry: extraOrg?.industry ?? null,
      region: extraOrg?.region ?? null,
      targetEntityId: mapped?.targetOrganizationEntityId ?? "",
      roleIds: group.roleIds,
      ...region,
      sign: push(sign(`org:${group.id}`, "canonical_entity", "contains", "region", observation.kind === "ORGANIZATION" && observedHere ? "return" : "select", observation.kind === "ORGANIZATION" && observedHere ? "unfold" : state === "receded" ? "recede" : "recenter", { uploadId: view.jobPoolUploadId, organizationId: group.id, ...(mapped !== null ? { targetId: mapped.targetOrganizationEntityId } : {}) }, state))
    };
  });

  const roles: SyntxRole[] = [];
  for (const organization of organizations) {
    const placed = placeRoles(organization, organization.roleIds, observation.kind !== "FIELD" && observation.organizationId === organization.id);
    for (const roleId of organization.roleIds) {
      const mapped = mapping.roles.find(role => role.poolRoleId === roleId)!;
      const match = delivered.find(candidate => candidate.poolRoleId === roleId) ?? null;
      const observedHere = observation.roleId === roleId;
      const state: SignState = observation.kind === "FIELD" ? "field" : observation.kind === "ORGANIZATION" ? (observation.organizationId === organization.id ? "field" : "receded") : observedHere ? (observation.kind === "ROLE" ? "role_selected" : "field") : "receded";
      const extraRole = extra.roles.get(roleId) ?? null;
      const position = placed.get(roleId)!;
      roles.push({
        id: roleId,
        title: mapped.title,
        organizationId: organization.id,
        organizationName: organization.name,
        seniority: extraRole?.seniority ?? null,
        domainFocus: extraRole?.domainFocus ?? null,
        targetEntityId: mapped.targetRoleEntityId,
        bindingRevisionId: mapped.targetRoleOrganizationBindingRevisionId,
        targetRoleProfileRevisionId: mapped.targetRoleProfileRevisionId,
        requirementCount: mapped.requirements.length,
        x: position.x,
        y: position.y,
        radius: 30,
        matching: match === null ? null : { resonanceScore: match.resonanceScore, deliveredRank: delivered.indexOf(match) + 1, targetRoleProfileRevisionId: match.canonical.targetRoleProfileRevisionId, targetRequirementRevisionIds: [...match.canonical.targetRequirementRevisionIds], relationState: match.canonical.capabilityRequirementRelationState, reason: match.canonical.reason },
        sign: push(sign(`role:${roleId}`, "canonical_entity", "contains", "carrier", observation.kind === "ROLE" && observedHere ? "return" : "select", observation.kind === "ROLE" && observedHere ? "unfold" : state === "receded" ? "recede" : "recenter", { uploadId: view.jobPoolUploadId, organizationId: organization.id, roleId, targetId: mapped.targetRoleOrganizationBindingRevisionId }, state))
      });
    }
  }

  // Role ecology (ROLE / REQUIREMENT): requirement anchors, traces, open boundaries, the one pending boundary and the source carriers.
  let requirements: SyntxRequirement[] = [];
  let sourceCarriers: SyntxSource[] = [];
  let pendingBoundary: SyntxPendingBoundary | null = null;
  let aperture: SyntxAperture | null = null;
  const observedRole = observation.roleId === null ? null : roles.find(role => role.id === observation.roleId) ?? null;
  if (observedRole !== null) {
    const mappedRole = mapping.roles.find(role => role.poolRoleId === observedRole.id)!;
    const match = delivered.find(candidate => candidate.poolRoleId === observedRole.id) ?? null;
    const docOrder: string[] = [];
    const docIndex = (docId: string) => { let index = docOrder.indexOf(docId); if (index < 0) { docOrder.push(docId); index = docOrder.length - 1; } return index; };
    const titleOf = (docId: string): { title: string | null; state: SyntxTrace["sourceTitleState"] } => {
      if (sources === null) return { title: null, state: "NOT_READ" };
      const document = sources.documents.find(candidate => candidate.docId === docId) ?? null;
      return document === null ? { title: null, state: "UNRESOLVED" } : { title: document.title, state: "RESOLVED" };
    };
    const maxContribution = match === null ? 0 : Math.max(0, ...[...match.matched, ...match.weakEvidence].map(item => item.contribution));

    const entries = mappedRole.requirements.map(requirement => {
      const matched = match?.matched.find(item => item.poolRequirementId === requirement.poolRequirementId) ?? null;
      const weak = match?.weakEvidence.find(item => item.poolRequirementId === requirement.poolRequirementId) ?? null;
      const missing = match?.missing.find(item => item.poolRequirementId === requirement.poolRequirementId) ?? null;
      const support: SyntxSupport = match === null ? "UNREAD" : matched !== null ? "SUPPORTED" : weak !== null ? "WEAK" : missing !== null && missing.sweepProposal !== null ? "SWEEP_ONLY" : "OPEN";
      return { requirement, matched, weak, missing, support };
    });
    const ordered = SUPPORT_ORDER.flatMap(support => entries.filter(entry => entry.support === support));
    // Anchors are the satellites of the role core on the arc outside the evidence sector (top-centred, strongest support first).
    const arc = 360 - 2 * EVIDENCE_SECTOR.halfWidth;
    const slot = ordered.length === 0 ? 0 : arc / ordered.length;
    const observedRequirementId = observation.kind === "REQUIREMENT" ? observation.requirementId : null;

    // Satellites fan out from the top of the nucleus: the strongest support takes the middle slot of the arc, the next ones alternate to either
    // side, so the evidence beneath reaches them as a fan around the nucleus instead of one converging bundle.
    const slotOrder = Array.from({ length: ordered.length }, (_, slotIndex) => slotIndex).sort((a, b) => Math.abs(a - (ordered.length - 1) / 2) - Math.abs(b - (ordered.length - 1) / 2) || b - a);
    requirements = ordered.map((entry, index) => {
      const { requirement, support } = entry;
      const id = requirement.poolRequirementId;
      const angle = (EVIDENCE_SECTOR.center + EVIDENCE_SECTOR.halfWidth + slotOrder[index] * slot + slot / 2) % 360;
      const distance = SUPPORT_DISTANCE[support];
      const [x, y] = polar(observedRole.x, observedRole.y, distance, angle);
      const observedHere = observedRequirementId === id;
      const anchorState: SignState = observation.kind === "ROLE" ? "field" : observedHere ? "requirement_selected" : "receded";
      const extraReq = extra.requirements.get(id) ?? null;
      const traceState: SignState = observation.kind === "ROLE" ? "field" : observedHere ? "inspectable" : "receded";
      const traces: SyntxTrace[] = [];
      const scored = entry.matched ?? entry.weak;
      if (scored !== null) {
        const kind: SyntxTraceKind = entry.matched !== null ? "supports" : "weakly_supports";
        const relative = maxContribution > 0 ? Math.min(1, Math.max(0, scored.contribution / maxContribution)) : 0;
        const weight = kind === "supports" ? round(1 + 1.2 * relative) : round(0.6 + 0.6 * relative);
        scored.evidence.forEach((quote, quoteIndex) => {
          const provenance = sources === null ? null : sources.capabilityEvidence.find(candidate => candidate.capabilityEntityId === scored.matchedCapabilityEntityId && candidate.docId === quote.docId && candidate.quote === quote.quote) ?? null;
          const title = titleOf(quote.docId);
          const proof: SignProof = { uploadId: view.jobPoolUploadId, roleId: observedRole.id, requirementId: id, ...(analysisId !== null ? { analysisId } : {}), capabilityId: scored.matchedCapabilityEntityId, docId: quote.docId };
          traces.push({
            sign: push(sign(`trace:${id}:${kind}:${quote.docId}:${quoteIndex}`, "evidence", kind, kind === "supports" ? "trace_stable" : "trace_thin", "inspect", "trace_rise", proof, traceState)),
            kind, requirementId: id, roleId: observedRole.id, docId: quote.docId, quote: quote.quote,
            sourceTitle: title.title, sourceTitleState: title.state, location: provenance?.location ?? null, evidenceId: null,
            capabilityId: scored.matchedCapabilityEntityId, capabilityName: scored.matchedCapabilityName, matchedConstituent: scored.matchedConstituent, basis: scored.matchBasis,
            contribution: scored.contribution, confidence: scored.confidence, weakReason: entry.weak !== null ? entry.weak.reason : null, weight, sourceDocIndex: docIndex(quote.docId), bow: 0
          });
        });
      }
      const sweep = entry.matched?.sweepProposal ?? entry.weak?.sweepProposal ?? entry.missing?.sweepProposal ?? null;
      if (sweep !== null) {
        sweep.evidence.forEach((quote, quoteIndex) => {
          const joined = sources === null ? null : sources.proposalEvidence.find(candidate => candidate.capabilityProposalId === sweep.capabilityProposalId && candidate.docId === quote.docId && candidate.quote === quote.quote) ?? null;
          const title = titleOf(quote.docId);
          const proof: SignProof = { uploadId: view.jobPoolUploadId, roleId: observedRole.id, requirementId: id, ...(analysisId !== null ? { analysisId } : {}), capabilityId: sweep.capabilityProposalId, docId: quote.docId, ...(joined !== null ? { evidenceId: joined.evidenceId } : {}) };
          traces.push({
            sign: push(sign(`trace:${id}:covers_unscored:${quote.docId}:${quoteIndex}`, "gemini_sweep", "covers_unscored", "trace_dotted", "inspect", "trace_rise", proof, traceState)),
            kind: "covers_unscored", requirementId: id, roleId: observedRole.id, docId: quote.docId, quote: quote.quote,
            sourceTitle: title.title, sourceTitleState: title.state, location: null, evidenceId: joined?.evidenceId ?? null,
            capabilityId: sweep.capabilityProposalId, capabilityName: sweep.name, matchedConstituent: sweep.matchedConstituent, basis: sweep.matchBasis,
            contribution: null, confidence: null, weakReason: null, weight: 1, sourceDocIndex: docIndex(quote.docId), bow: 0
          });
        });
      }
      const openBoundary = support === "OPEN"
        ? push(sign(`open:${id}`, "matching_contribution", "missing_support", "open_boundary", "inspect", observation.kind === "ROLE" || observedHere ? "trace_rise" : "recede", { uploadId: view.jobPoolUploadId, roleId: observedRole.id, requirementId: id, ...(analysisId !== null ? { analysisId } : {}) }, traceState))
        : null;
      return {
        id, roleId: observedRole.id, name: requirement.capabilityName, targetRequirementRevisionId: requirement.targetRequirementRevisionId,
        necessity: extraReq?.necessity ?? (requirement.necessityState === "UNKNOWN" ? null : requirement.necessityState), weight: extraReq?.weight ?? (entry.matched ?? entry.weak ?? entry.missing)?.weight ?? null,
        requiredLevel: extraReq?.requiredLevel ?? (entry.matched ?? entry.weak ?? entry.missing)?.requiredLevel ?? null, evidenceHint: extraReq?.evidenceHint ?? entry.missing?.evidenceHint ?? null,
        support, evaluationState: match === null ? null : match.canonical.capabilityRequirementRelationState, angle, distance, x, y,
        sign: push(sign(`req:${id}`, "canonical_entity", "requires", "anchor", observation.kind === "REQUIREMENT" && observedHere ? "return" : "select", observation.kind === "REQUIREMENT" && observedHere ? "recenter" : anchorState === "receded" ? "recede" : "unfold", { uploadId: view.jobPoolUploadId, roleId: observedRole.id, requirementId: id, trqrevId: requirement.targetRequirementRevisionId }, anchorState)),
        traces, openBoundary
      };
    });

    // Source carriers: one per delivered docId, on the outer ring beside the requirements that reach it (O-SX-2, O-SX-4), ordered by first appearance; their relation is the strongest delivered relation among their traces.
    const sourceAngles = placeSourceAngles(observedRole, docOrder.map(docId => requirements.filter(requirement => requirement.traces.some(trace => trace.docId === docId)).map(requirement => ({ x: requirement.x, y: requirement.y }))), requirements);
    sourceCarriers = docOrder.map((docId, index) => {
      const traces = requirements.flatMap(requirement => requirement.traces.filter(trace => trace.docId === docId));
      const relation: SignRelation = traces.some(trace => trace.kind === "supports") ? "supports" : traces.some(trace => trace.kind === "weakly_supports") ? "weakly_supports" : "covers_unscored";
      const source: SignSource = relation === "covers_unscored" ? "gemini_sweep" : "evidence";
      const title = titleOf(docId);
      const reached = observation.kind === "ROLE" || traces.some(trace => trace.requirementId === observedRequirementId);
      const [x, y] = polar(observedRole.x, observedRole.y, SOURCE_RING_RADIUS, sourceAngles[index]);
      return { docId, title: title.title, titleState: title.state, x, y, traceCount: traces.length, sign: push(sign(`source:${docId}`, source, relation, "carrier", "none", reached ? "trace_rise" : "recede", { uploadId: view.jobPoolUploadId, roleId: observedRole.id, ...(analysisId !== null ? { analysisId } : {}), docId }, reached ? (observation.kind === "ROLE" ? "field" : "inspectable") : "receded")) };
    });

    // Trace routing (F-SX-2, O-SX-2): co-terminal traces take distinct bows; every trace bends around the role carrier, the requirement labels, other anchors and other carriers.
    const labelRects = requirements.map(requirement => requirementLabel(requirement).box);
    for (const requirement of requirements) {
      const taken = new Map<string, number[]>();
      for (const trace of requirement.traces) {
        const carrier = sourceCarriers[trace.sourceDocIndex];
        const used = taken.get(trace.docId) ?? [];
        const obstacles: Obstacles = {
          discs: [{ x: observedRole.x, y: observedRole.y, r: ROLE_CLEARANCE_RADIUS }, ...requirements.filter(other => other.id !== requirement.id).map(other => ({ x: other.x, y: other.y, r: 7 }))],
          rects: [...labelRects, ...sourceCarriers.filter(other => other.docId !== trace.docId).map(other => ({ x: other.x - SOURCE_BOX.halfWidth, y: other.y - SOURCE_BOX.above, width: SOURCE_BOX.halfWidth * 2, height: SOURCE_BOX.above + SOURCE_BOX.below }))]
        };
        trace.bow = routeTraceBows(requirement, carrier, used, obstacles);
        taken.set(trace.docId, [...used, trace.bow]);
      }
    }

    // The one suspended boundary of the role ecology (R2): NOT_EVALUATED holds for every requirement while no verified capability snapshot exists.
    if (match !== null) {
      pendingBoundary = {
        roleId: observedRole.id,
        radius: PENDING_BOUNDARY_RADIUS,
        targetRoleProfileRevisionId: match.canonical.targetRoleProfileRevisionId,
        targetRequirementRevisionIds: [...match.canonical.targetRequirementRevisionIds],
        sign: push(sign(`pending:${observedRole.id}`, "evaluation_state", "pending_evaluation", "suspended_boundary", "inspect", "boundary_suspend", { uploadId: view.jobPoolUploadId, roleId: observedRole.id, ...(analysisId !== null ? { analysisId } : {}), targetId: match.canonical.targetRoleProfileRevisionId, trqrevId: match.canonical.targetRequirementRevisionIds.join(" ") }, observation.kind === "ROLE" ? "field" : "inspectable"))
      };
    }

    // The aperture: one temporary inspection over a trace, an open boundary or the pending boundary (REQUIREMENT level only).
    if ((observation.kind === "REQUIREMENT" || observation.kind === "ROLE") && observation.apertureSignId !== null) {
      const requirement = requirements.find(candidate => candidate.id === observation.requirementId) ?? null;
      const trace = requirement?.traces.find(candidate => candidate.sign.id === observation.apertureSignId) ?? null;
      const open = requirement !== null && requirement.openBoundary !== null && requirement.openBoundary.id === observation.apertureSignId ? requirement : null;
      const pending = pendingBoundary !== null && pendingBoundary.sign.id === observation.apertureSignId ? pendingBoundary : null;
      const inspected = trace?.sign ?? open?.openBoundary ?? pending?.sign ?? null;
      if (inspected !== null) {
        aperture = {
          sign: push({ ...inspected, id: `aperture:${inspected.id}`, state: "inspectable", manifestation: "temporary_aperture", interaction: "return", transition: "restore" }),
          inspects: trace !== null ? { kind: "trace", trace } : open !== null ? { kind: "open", requirement: open } : { kind: "pending", boundary: pending! },
          requirement
        };
      }
    }
  }

  // Camera (recenter): the observation point sits at the centre of the view.
  const observedOrganization = observation.organizationId === null ? null : organizations.find(organization => organization.id === observation.organizationId) ?? null;
  const observedRequirement = observation.kind === "REQUIREMENT" ? requirements.find(requirement => requirement.id === observation.requirementId) ?? null : null;
  const camera: SyntxCamera = observation.kind === "FIELD" || observedOrganization === null
    ? { x: SYNTX_LAYOUT.center, y: SYNTX_LAYOUT.center, scale: CAMERA_SCALE.FIELD }
    : observation.kind === "ORGANIZATION"
      ? { x: observedOrganization.x, y: observedOrganization.y, scale: round(Math.min(2.6, 400 / (observedOrganization.radius + 30))) }
      : observation.kind === "ROLE" && observedRole !== null
        ? { x: observedRole.x, y: observedRole.y, scale: CAMERA_SCALE.ROLE }
        : observedRequirement !== null && observedRole !== null
          ? requirementCamera(observedRequirement, observedRole, sourceCarriers.filter(source => observedRequirement.traces.some(trace => trace.docId === source.docId)))
          : { x: SYNTX_LAYOUT.center, y: SYNTX_LAYOUT.center, scale: CAMERA_SCALE.FIELD };

  const boundary: SyntxBoundary | null = matchingDelivered ? { authorityState: matching!.presentation.authorityState, canonicalEvaluation: matching!.presentation.canonicalEvaluation, decision: matching!.presentation.decision, labels: presentationLabels(matching!.presentation), policyVersion: matching!.presentation.policyVersion, weakEvidenceThreshold: matching!.presentation.weakEvidenceThreshold, candidateCapabilityCount: matching!.candidateCapabilityCount, capabilitySweep: matching!.capabilitySweep } : null;

  const summary: SyntxSummary = observation.kind === "FIELD" || observedOrganization === null
    ? { kind: "FIELD", poolName: view.poolName, poolVersion: view.poolVersion, poolStatus: view.poolStatus, organizationCount: organizations.length, roleCount: roles.length, matchingDelivered }
    : observation.kind === "ORGANIZATION"
      ? { kind: "ORGANIZATION", organizationName: observedOrganization.name, roleTitles: roles.filter(role => role.organizationId === observedOrganization.id).map(role => role.title) }
      : observation.kind === "ROLE" && observedRole !== null
        ? { kind: "ROLE", roleTitle: observedRole.title, organizationName: observedRole.organizationName, requirementCount: requirements.length, supported: requirements.filter(item => item.support === "SUPPORTED").length, weak: requirements.filter(item => item.support === "WEAK").length, sweepOnly: requirements.filter(item => item.support === "SWEEP_ONLY").length, open: requirements.filter(item => item.support === "OPEN").length, unread: requirements.filter(item => item.support === "UNREAD").length, pendingEvaluation: pendingBoundary !== null }
        : observedRequirement !== null && observedRole !== null
          ? { kind: "REQUIREMENT", requirementName: observedRequirement.name, roleTitle: observedRole.title, support: observedRequirement.support, traceCount: observedRequirement.traces.length, sourceCount: new Set(observedRequirement.traces.map(trace => trace.docId)).size, apertureOpen: aperture !== null }
          : { kind: "FIELD", poolName: view.poolName, poolVersion: view.poolVersion, poolStatus: view.poolStatus, organizationCount: organizations.length, roleCount: roles.length, matchingDelivered };

  return {
    grammar: SYNTX_FIELD_GRAMMAR,
    observation,
    pool: { jobPoolUploadId: view.jobPoolUploadId, poolId: view.poolId, poolName: view.poolName, poolVersion: view.poolVersion, poolStatus: view.poolStatus, mappingState: mapping.mappingState, proposalState: mapping.proposalState, authorityState: mapping.authorityState, sign: poolSign },
    organizations,
    roles,
    requirements,
    sources: sourceCarriers,
    pendingBoundary,
    aperture,
    camera,
    matchingDelivered,
    analysisId,
    boundary,
    signs,
    summary
  };
}

/* ----------------------------------------------------------------------------------------------------------------
 * Transitions (spec §13): selection reorganises topology, return restores the previous level, nothing mutates truth
 * ---------------------------------------------------------------------------------------------------------------- */

export function observeOrganization(current: SyntxObservation, organizationId: string): SyntxObservation {
  return current.kind === "ORGANIZATION" && current.organizationId === organizationId ? FIELD_OBSERVATION : { ...FIELD_OBSERVATION, kind: "ORGANIZATION", organizationId };
}

export function observeRole(current: SyntxObservation, organizationId: string, roleId: string): SyntxObservation {
  return current.kind === "ROLE" && current.roleId === roleId ? { ...FIELD_OBSERVATION, kind: "ORGANIZATION", organizationId } : { ...FIELD_OBSERVATION, kind: "ROLE", organizationId, roleId };
}

export function observeRequirement(current: SyntxObservation, requirementId: string): SyntxObservation {
  if (current.roleId === null || current.organizationId === null) return current;
  return current.kind === "REQUIREMENT" && current.requirementId === requirementId ? { ...FIELD_OBSERVATION, kind: "ROLE", organizationId: current.organizationId, roleId: current.roleId } : { kind: "REQUIREMENT", organizationId: current.organizationId, roleId: current.roleId, requirementId, apertureSignId: null };
}

export function inspectSign(current: SyntxObservation, signId: string): SyntxObservation {
  if (current.kind !== "REQUIREMENT" && current.kind !== "ROLE") return current;
  return { ...current, apertureSignId: current.apertureSignId === signId ? null : signId };
}

/** RETURN: aperture → requirement → role → organization → field; FIELD stays FIELD (the caller may leave the field). */
export function returnFrom(current: SyntxObservation): SyntxObservation {
  if (current.kind === "REQUIREMENT") return current.apertureSignId !== null ? { ...current, apertureSignId: null } : { ...FIELD_OBSERVATION, kind: "ROLE", organizationId: current.organizationId, roleId: current.roleId };
  if (current.kind === "ROLE") return current.apertureSignId !== null ? { ...current, apertureSignId: null } : { ...FIELD_OBSERVATION, kind: "ORGANIZATION", organizationId: current.organizationId };
  if (current.kind === "ORGANIZATION") return FIELD_OBSERVATION;
  return current;
}

/** URL form of an observation: additive params next to jobPoolUploadId (jobRoleId keeps its meaning; organization and requirement are new). */
export function observationFromParams(organizationId: string | null | undefined, roleId: string | null | undefined, requirementId: string | null | undefined): SyntxObservation {
  const organization = organizationId && organizationId.length > 0 ? organizationId : null;
  const role = roleId && roleId.length > 0 ? roleId : null;
  const requirement = requirementId && requirementId.length > 0 ? requirementId : null;
  if (role !== null && requirement !== null) return { kind: "REQUIREMENT", organizationId: organization, roleId: role, requirementId: requirement, apertureSignId: null };
  if (role !== null) return { ...FIELD_OBSERVATION, kind: "ROLE", organizationId: organization, roleId: role };
  if (organization !== null) return { ...FIELD_OBSERVATION, kind: "ORGANIZATION", organizationId: organization };
  return FIELD_OBSERVATION;
}

/* ----------------------------------------------------------------------------------------------------------------
 * Summary sentence (BR-4): the only text generated for the observation, from the summary facts, in the SIL locale
 * ---------------------------------------------------------------------------------------------------------------- */

export interface SyntxSummaryCopy {
  field: string;
  organization: string;
  role: string;
  requirement: string;
  support: Record<SyntxSupport, string>;
  pendingEvaluation: string;
  apertureOpen: string;
  matchingRead: string;
  matchingNotRead: string;
  /** Count nouns in singular and plural (O-SX-3): the summary is the screen-reader reading of the observation point, so it agrees in number. */
  nouns: Record<"organizations" | "roles" | "requirements" | "traces" | "sources", { one: string; other: string }>;
}

const fill = (template: string, values: Record<string, string | number>): string => template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
const noun = (copy: SyntxSummaryCopy, key: keyof SyntxSummaryCopy["nouns"], count: number): string => (count === 1 ? copy.nouns[key].one : copy.nouns[key].other);

export function summarySentence(summary: SyntxSummary, copy: SyntxSummaryCopy): string {
  switch (summary.kind) {
    case "FIELD": return fill(copy.field, { poolName: summary.poolName, poolVersion: summary.poolVersion, poolStatus: summary.poolStatus, organizationCount: summary.organizationCount, organizations: noun(copy, "organizations", summary.organizationCount), roleCount: summary.roleCount, roles: noun(copy, "roles", summary.roleCount), matching: summary.matchingDelivered ? copy.matchingRead : copy.matchingNotRead });
    case "ORGANIZATION": return fill(copy.organization, { organizationName: summary.organizationName, roleCount: summary.roleTitles.length, roles: noun(copy, "roles", summary.roleTitles.length), roleTitles: summary.roleTitles.join(", ") });
    case "ROLE": return fill(copy.role, { roleTitle: summary.roleTitle, organizationName: summary.organizationName, requirementCount: summary.requirementCount, requirements: noun(copy, "requirements", summary.requirementCount), supported: summary.supported, weak: summary.weak, sweepOnly: summary.sweepOnly, open: summary.open, unread: summary.unread, pending: summary.pendingEvaluation ? copy.pendingEvaluation : "" }).replace(/\s+\./g, ".").trim();
    case "REQUIREMENT": return fill(copy.requirement, { requirementName: summary.requirementName, roleTitle: summary.roleTitle, support: copy.support[summary.support], traceCount: summary.traceCount, traces: noun(copy, "traces", summary.traceCount), sourceCount: summary.sourceCount, sources: noun(copy, "sources", summary.sourceCount), aperture: summary.apertureOpen ? copy.apertureOpen : "" }).trim();
  }
}
