/**
 * Job Field: the Job Pool as the central, spatially navigable field of the planetarium
 * (owner mandate "SFE — JOB FIELD RECONSTRUCTION", 2026-10-11).
 *
 * Everything here is a pure, client-safe derivation from one delivered
 * JobPoolMatchPresentation. It re-scores nothing: the distance of a role from
 * the candidate core is 1 − resonanceScore as delivered, the order is the
 * delivered order, and the "nearest defensible relation" is a presentation
 * rule over delivered facts (first delivered role with a positive score and at
 * least one scored match). Absent evidence is represented as NO_EVIDENCE_DELIVERED,
 * never as an absent capability. Nothing here is a decision or leads to one.
 *
 * NEAREST != CHOSEN · PENDING != MISSING CAPABILITY · COVERED != SCORED · DISTANCE != TRUTH · POOL ROLE != INFERRED ROLE
 */
import type {
  JobPoolMatchBasis,
  JobPoolMatchPresentation,
  JobPoolMissingRequirement,
  JobPoolRoleMatch,
  JobPoolSweepProposalCoverage,
  JobPoolWeakRequirement,
  JobPoolMatchedRequirement
} from "./types";
import { describeRanking, type JobPoolRankingCharacter } from "./frontend-presentation";

export type JobFieldRequirementState = "MATCHED" | "UNRESOLVED" | "COVERED_UNSCORED" | "NO_EVIDENCE_DELIVERED";

export interface JobFieldRequirement {
  poolRequirementId: string;
  capabilityName: string;
  necessity: JobPoolMissingRequirement["necessity"];
  weight: number;
  requiredLevel: string;
  state: JobFieldRequirementState;
  /** Scored match facts (MATCHED, UNRESOLVED); null otherwise. */
  match: { basis: JobPoolMatchBasis; matchedCapabilityName: string; matchedConstituent: string | null; confidence: number; contribution: number; evidence: JobPoolMatchedRequirement["evidence"] } | null;
  /** Delivered weak-evidence reason (UNRESOLVED only). */
  weakReason: string | null;
  /** Unscored sweep coverage, on any state. */
  sweep: JobPoolSweepProposalCoverage | null;
  evidenceHint: string | null;
}

export type JobFieldPendingKind = "UNPROVEN_CANONICAL" | "UNRESOLVED_EVIDENCE" | "UNSCORED_COVERAGE" | "NO_EVIDENCE_DELIVERED";

export interface JobFieldPending {
  kind: JobFieldPendingKind;
  /** Requirement ids (or TRQREV ids for UNPROVEN_CANONICAL) exactly as delivered. */
  ids: string[];
}

export interface JobFieldCounts {
  matched: number;
  unresolved: number;
  coveredUnscored: number;
  noEvidence: number;
  total: number;
}

export interface JobFieldRoleNode {
  poolRoleId: string;
  title: string;
  seniority: string;
  domainFocus: string;
  poolOrganizationId: string;
  organizationName: string;
  /** 1-based position in the delivered order. */
  deliveredRank: number;
  resonanceScore: number;
  /** Polar placement: degrees from 12 o'clock clockwise; distance 0 (core) … 1 (outer rim) = 1 − resonanceScore. */
  angle: number;
  distance: number;
  x: number;
  y: number;
  requirements: JobFieldRequirement[];
  counts: JobFieldCounts;
  pending: JobFieldPending[];
  canonical: JobPoolRoleMatch["canonical"];
  /** resonanceScore > 0 and at least one scored match (delivered, scored evidence behind the presentation). */
  hasScoredMatch: boolean;
}

export interface JobFieldOrganization {
  poolOrganizationId: string;
  name: string;
  roleIds: string[];
  startAngle: number;
  endAngle: number;
}

export interface JobFieldLayout {
  size: number;
  center: number;
  innerRadius: number;
  outerRadius: number;
}

export interface JobField {
  analysisId: string;
  jobPoolUploadId: string;
  candidateCapabilityCount: number;
  capabilitySweep: JobPoolMatchPresentation["capabilitySweep"];
  layout: JobFieldLayout;
  organizations: JobFieldOrganization[];
  roles: JobFieldRoleNode[];
  ranking: JobPoolRankingCharacter;
  /** NEAREST PRESENTED ROLE: first delivered role with a scored match, or null. NEAREST != CHOSEN. */
  nearestPresentedRole: { poolRoleId: string; pending: JobFieldPending[] } | null;
}

export const JOB_FIELD_LAYOUT: JobFieldLayout = Object.freeze({ size: 800, center: 400, innerRadius: 150, outerRadius: 340 });

function matchFacts(item: JobPoolMatchedRequirement): JobFieldRequirement["match"] {
  return { basis: item.matchBasis, matchedCapabilityName: item.matchedCapabilityName, matchedConstituent: item.matchedConstituent, confidence: item.confidence, contribution: item.contribution, evidence: item.evidence };
}

export function deriveRequirements(role: JobPoolRoleMatch): JobFieldRequirement[] {
  const matched: JobFieldRequirement[] = role.matched.map(item => ({ poolRequirementId: item.poolRequirementId, capabilityName: item.capabilityName, necessity: item.necessity, weight: item.weight, requiredLevel: item.requiredLevel, state: "MATCHED", match: matchFacts(item), weakReason: null, sweep: item.sweepProposal, evidenceHint: null }));
  const unresolved: JobFieldRequirement[] = role.weakEvidence.map((item: JobPoolWeakRequirement) => ({ poolRequirementId: item.poolRequirementId, capabilityName: item.capabilityName, necessity: item.necessity, weight: item.weight, requiredLevel: item.requiredLevel, state: "UNRESOLVED", match: matchFacts(item), weakReason: item.reason, sweep: item.sweepProposal, evidenceHint: null }));
  const missing: JobFieldRequirement[] = role.missing.map(item => ({ poolRequirementId: item.poolRequirementId, capabilityName: item.capabilityName, necessity: item.necessity, weight: item.weight, requiredLevel: item.requiredLevel, state: item.sweepProposal === null ? "NO_EVIDENCE_DELIVERED" : "COVERED_UNSCORED", match: null, weakReason: null, sweep: item.sweepProposal, evidenceHint: item.evidenceHint }));
  return [...matched, ...unresolved, ...missing];
}

export function countRequirements(requirements: readonly JobFieldRequirement[]): JobFieldCounts {
  const count = (state: JobFieldRequirementState) => requirements.filter(item => item.state === state).length;
  return { matched: count("MATCHED"), unresolved: count("UNRESOLVED"), coveredUnscored: count("COVERED_UNSCORED"), noEvidence: count("NO_EVIDENCE_DELIVERED"), total: requirements.length };
}

/** What remains pending toward a role: four distinct kinds, never merged, never counted as absent capability. */
export function derivePending(role: JobPoolRoleMatch, requirements: readonly JobFieldRequirement[]): JobFieldPending[] {
  return [
    { kind: "UNPROVEN_CANONICAL", ids: [...role.canonical.targetRequirementRevisionIds] },
    { kind: "UNRESOLVED_EVIDENCE", ids: requirements.filter(item => item.state === "UNRESOLVED").map(item => item.poolRequirementId) },
    { kind: "UNSCORED_COVERAGE", ids: requirements.filter(item => item.sweep !== null && item.state !== "MATCHED").map(item => item.poolRequirementId) },
    { kind: "NO_EVIDENCE_DELIVERED", ids: requirements.filter(item => item.state === "NO_EVIDENCE_DELIVERED").map(item => item.poolRequirementId) }
  ];
}

export function hasScoredMatch(role: JobPoolRoleMatch): boolean {
  return role.resonanceScore > 0 && role.matched.length > 0;
}

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

/** Organizations in order of first appearance among the delivered roles; roles keep the delivered order inside each. */
function groupByOrganization(roles: readonly JobPoolRoleMatch[]): Array<{ poolOrganizationId: string; name: string; roles: JobPoolRoleMatch[] }> {
  const groups: Array<{ poolOrganizationId: string; name: string; roles: JobPoolRoleMatch[] }> = [];
  for (const role of roles) {
    let group = groups.find(candidate => candidate.poolOrganizationId === role.poolOrganizationId);
    if (group === undefined) { group = { poolOrganizationId: role.poolOrganizationId, name: role.organizationName, roles: [] }; groups.push(group); }
    group.roles.push(role);
  }
  return groups;
}

export function deriveJobField(presentation: JobPoolMatchPresentation, layout: JobFieldLayout = JOB_FIELD_LAYOUT): JobField {
  const groups = groupByOrganization(presentation.roleMatches);
  const roleCount = presentation.roleMatches.length;
  const slot = roleCount === 0 ? 0 : 360 / roleCount;
  const organizations: JobFieldOrganization[] = [];
  const roles: JobFieldRoleNode[] = [];
  let slotIndex = 0;
  for (const group of groups) {
    const startAngle = slotIndex * slot;
    for (const role of group.roles) {
      const angle = (slotIndex + 0.5) * slot;
      const distance = clamp01(1 - role.resonanceScore);
      const radius = layout.innerRadius + distance * (layout.outerRadius - layout.innerRadius);
      const radians = ((angle - 90) * Math.PI) / 180;
      const requirements = deriveRequirements(role);
      roles.push({
        poolRoleId: role.poolRoleId,
        title: role.title,
        seniority: role.seniority,
        domainFocus: role.domainFocus,
        poolOrganizationId: role.poolOrganizationId,
        organizationName: role.organizationName,
        deliveredRank: presentation.roleMatches.indexOf(role) + 1,
        resonanceScore: role.resonanceScore,
        angle,
        distance,
        x: Math.round((layout.center + radius * Math.cos(radians)) * 100) / 100,
        y: Math.round((layout.center + radius * Math.sin(radians)) * 100) / 100,
        requirements,
        counts: countRequirements(requirements),
        pending: derivePending(role, requirements),
        canonical: role.canonical,
        hasScoredMatch: hasScoredMatch(role)
      });
      slotIndex += 1;
    }
    organizations.push({ poolOrganizationId: group.poolOrganizationId, name: group.name, roleIds: group.roles.map(role => role.poolRoleId), startAngle, endAngle: slotIndex * slot });
  }
  const nearestRole = roles.find(role => role.hasScoredMatch) ?? null;
  return {
    analysisId: presentation.analysisId,
    jobPoolUploadId: presentation.jobPoolUploadId,
    candidateCapabilityCount: presentation.candidateCapabilityCount,
    capabilitySweep: presentation.capabilitySweep,
    layout,
    organizations,
    roles,
    ranking: describeRanking(presentation.roleMatches),
    nearestPresentedRole: nearestRole === null ? null : { poolRoleId: nearestRole.poolRoleId, pending: nearestRole.pending }
  };
}

/** Exact role selection from the URL: the id must be one of the delivered roles; a stale id is named, not dropped. */
/** Provenance of what stands behind a requirement line; never "verified capability" (no PHASE4 snapshot exists). */
export type JobFieldProvenance = "ANALYSIS_CAPABILITY" | "SWEEP_PROPOSAL" | "NONE";

export function provenanceOf(requirement: JobFieldRequirement): JobFieldProvenance {
  if (requirement.match !== null) return "ANALYSIS_CAPABILITY";
  if (requirement.sweep !== null) return "SWEEP_PROPOSAL";
  return "NONE";
}

export type JobFieldRoleSelection = { kind: "NONE" } | { kind: "ROLE"; role: JobFieldRoleNode } | { kind: "NOT_DELIVERED"; poolRoleId: string };

export function describeRoleSelection(poolRoleId: string | null, field: JobField): JobFieldRoleSelection {
  if (poolRoleId === null || poolRoleId.length === 0) return { kind: "NONE" };
  const role = field.roles.find(candidate => candidate.poolRoleId === poolRoleId);
  return role === undefined ? { kind: "NOT_DELIVERED", poolRoleId } : { kind: "ROLE", role };
}

/** SVG arc path for a ring segment, used for the per-role requirement ring (angles in degrees from 12 o'clock). */
export function arcPath(cx: number, cy: number, radius: number, startAngle: number, endAngle: number): string {
  const toPoint = (angle: number) => { const radians = ((angle - 90) * Math.PI) / 180; return [cx + radius * Math.cos(radians), cy + radius * Math.sin(radians)] as const; };
  const sweep = endAngle - startAngle;
  if (sweep <= 0) return "";
  if (sweep >= 360) { const [x, y] = toPoint(0); const [x2, y2] = toPoint(180); return `M ${x} ${y} A ${radius} ${radius} 0 1 1 ${x2} ${y2} A ${radius} ${radius} 0 1 1 ${x} ${y}`; }
  const [x1, y1] = toPoint(startAngle);
  const [x2, y2] = toPoint(endAngle);
  return `M ${x1} ${y1} A ${radius} ${radius} 0 ${sweep > 180 ? 1 : 0} 1 ${x2} ${y2}`;
}

/** Ring segments of one role in a fixed state order; proportional to counts, never to weights or scores. */
export function ringSegments(counts: JobFieldCounts): Array<{ state: JobFieldRequirementState; startAngle: number; endAngle: number }> {
  if (counts.total === 0) return [];
  const order: Array<[JobFieldRequirementState, number]> = [["MATCHED", counts.matched], ["UNRESOLVED", counts.unresolved], ["COVERED_UNSCORED", counts.coveredUnscored], ["NO_EVIDENCE_DELIVERED", counts.noEvidence]];
  const segments: Array<{ state: JobFieldRequirementState; startAngle: number; endAngle: number }> = [];
  let angle = 0;
  for (const [state, count] of order) {
    if (count === 0) continue;
    const end = angle + (count / counts.total) * 360;
    segments.push({ state, startAngle: angle, endAngle: end });
    angle = end;
  }
  return segments;
}
