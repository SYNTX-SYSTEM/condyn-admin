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
  /** Angle (degrees from 12 o'clock) of the source carrier the trace reaches. */
  sourceDocIndex: number;
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
export const SUPPORT_DISTANCE: Record<SyntxSupport, number> = Object.freeze({ SUPPORTED: 78, WEAK: 98, SWEEP_ONLY: 118, OPEN: 138, UNREAD: 104 });
export const PENDING_BOUNDARY_RADIUS = 158;
export const SOURCE_RING_RADIUS = 212;
const SUPPORT_ORDER: readonly SyntxSupport[] = ["SUPPORTED", "WEAK", "SWEEP_ONLY", "OPEN", "UNREAD"];

export const CAMERA_SCALE = Object.freeze({ FIELD: 1, ROLE: 1.8, REQUIREMENT: 2.4 });

/** Organization regions on one ring around the field centre; the region radius grows with the number of roles (density, never importance). */
function placeOrganizations(groups: ReadonlyArray<{ id: string; roleIds: string[] }>): Map<string, { x: number; y: number; radius: number }> {
  const placed = new Map<string, { x: number; y: number; radius: number }>();
  const count = groups.length;
  const { center } = SYNTX_LAYOUT;
  if (count === 0) return placed;
  const density = (roleIds: string[]) => Math.min(165, 62 + 26 * Math.sqrt(Math.max(1, roleIds.length)));
  if (count === 1) { placed.set(groups[0].id, { x: center, y: center, radius: Math.min(240, density(groups[0].roleIds) + 60) }); return placed; }
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
  if (roleIds.length === 1) { placed.set(roleIds[0], { x: region.x, y: region.y }); return placed; }
  const inner = region.radius * (unfolded ? 0.66 : 0.52);
  const slot = 360 / roleIds.length;
  roleIds.forEach((id, index) => { const [x, y] = polar(region.x, region.y, inner, index * slot + (roleIds.length === 2 ? 90 : 0)); placed.set(id, { x, y }); });
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
    const slot = ordered.length === 0 ? 0 : 360 / ordered.length;
    const observedRequirementId = observation.kind === "REQUIREMENT" ? observation.requirementId : null;

    requirements = ordered.map((entry, index) => {
      const { requirement, support } = entry;
      const id = requirement.poolRequirementId;
      const angle = index * slot + slot / 2;
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
            contribution: scored.contribution, confidence: scored.confidence, weakReason: entry.weak !== null ? entry.weak.reason : null, weight, sourceDocIndex: docIndex(quote.docId)
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
            contribution: null, confidence: null, weakReason: null, weight: 1, sourceDocIndex: docIndex(quote.docId)
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

    // Source carriers: one per delivered docId, on the outer ring, ordered by first appearance; their relation is the strongest delivered relation among their traces.
    const sourceSlot = docOrder.length === 0 ? 0 : 360 / docOrder.length;
    sourceCarriers = docOrder.map((docId, index) => {
      const traces = requirements.flatMap(requirement => requirement.traces.filter(trace => trace.docId === docId));
      const relation: SignRelation = traces.some(trace => trace.kind === "supports") ? "supports" : traces.some(trace => trace.kind === "weakly_supports") ? "weakly_supports" : "covers_unscored";
      const source: SignSource = relation === "covers_unscored" ? "gemini_sweep" : "evidence";
      const title = titleOf(docId);
      const reached = observation.kind === "ROLE" || traces.some(trace => trace.requirementId === observedRequirementId);
      const [x, y] = polar(observedRole.x, observedRole.y, SOURCE_RING_RADIUS, index * sourceSlot + sourceSlot / 2 + 18);
      return { docId, title: title.title, titleState: title.state, x, y, traceCount: traces.length, sign: push(sign(`source:${docId}`, source, relation, "carrier", "none", reached ? "trace_rise" : "recede", { uploadId: view.jobPoolUploadId, roleId: observedRole.id, ...(analysisId !== null ? { analysisId } : {}), docId }, reached ? (observation.kind === "ROLE" ? "field" : "inspectable") : "receded")) };
    });

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
          ? { x: round((observedRequirement.x * 2 + observedRole.x) / 3), y: round((observedRequirement.y * 2 + observedRole.y) / 3), scale: CAMERA_SCALE.REQUIREMENT }
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
}

const fill = (template: string, values: Record<string, string | number>): string => template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));

export function summarySentence(summary: SyntxSummary, copy: SyntxSummaryCopy): string {
  switch (summary.kind) {
    case "FIELD": return fill(copy.field, { poolName: summary.poolName, poolVersion: summary.poolVersion, poolStatus: summary.poolStatus, organizationCount: summary.organizationCount, roleCount: summary.roleCount, matching: summary.matchingDelivered ? copy.matchingRead : copy.matchingNotRead });
    case "ORGANIZATION": return fill(copy.organization, { organizationName: summary.organizationName, roleCount: summary.roleTitles.length, roleTitles: summary.roleTitles.join(", ") });
    case "ROLE": return fill(copy.role, { roleTitle: summary.roleTitle, organizationName: summary.organizationName, requirementCount: summary.requirementCount, supported: summary.supported, weak: summary.weak, sweepOnly: summary.sweepOnly, open: summary.open, unread: summary.unread, pending: summary.pendingEvaluation ? copy.pendingEvaluation : "" }).replace(/\s+\./g, ".").trim();
    case "REQUIREMENT": return fill(copy.requirement, { requirementName: summary.requirementName, roleTitle: summary.roleTitle, support: copy.support[summary.support], traceCount: summary.traceCount, sourceCount: summary.sourceCount, aperture: summary.apertureOpen ? copy.apertureOpen : "" }).trim();
  }
}
