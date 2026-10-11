/**
 * Pool Field: the Job Pool as its own field state of the planetarium (owner mandate "SFE — SEMIONTIC JOB POOL FIELD",
 * 2026-10-11). Pure, client-safe derivations over the delivered upload list, one exact upload view and, when present,
 * one delivered presentation matching. Nothing here selects, scores or decides:
 *
 *   - the persisted uploads sit on the outer ring in delivered order; the explicitly selected one sits at the core
 *     (UPLOADED != SELECTED as geometry; no "latest" is ever moved to the core);
 *   - the selected pool's organisations and roles manifest around the core from its canonical mapping (layer C,
 *     PROPOSAL_ONLY, authority NONE), one slot per role, grouped by pool organisation in delivered order;
 *   - a role carries light only when a delivered presentation matching names it (POOL RESONANCE, PRESENTATION).
 */
import type { JobPoolMatchPresentation, JobPoolUploadSummary, JobPoolUploadView } from "./types";
import { arcPath } from "./job-field-presentation";

export interface PoolFieldLayout {
  size: number;
  center: number;
  coreRadius: number;
  structureRadius: number;
  organizationRadius: number;
  uploadRadius: number;
}

export const POOL_FIELD_LAYOUT: PoolFieldLayout = Object.freeze({ size: 800, center: 400, coreRadius: 70, structureRadius: 190, organizationRadius: 245, uploadRadius: 345 });

export interface PoolFieldUploadNode {
  jobPoolUploadId: string;
  poolName: string;
  poolVersion: number;
  poolStatus: JobPoolUploadSummary["poolStatus"];
  roleCount: number;
  organizationCount: number;
  requirementCount: number;
  /** 1-based position in the delivered list. */
  deliveredIndex: number;
  selected: boolean;
  /** Degrees from 12 o'clock clockwise; the selected upload has no angle (it sits at the core). */
  angle: number | null;
  x: number;
  y: number;
}

const point = (center: number, radius: number, angle: number): [number, number] => {
  const radians = ((angle - 90) * Math.PI) / 180;
  return [Math.round((center + radius * Math.cos(radians)) * 100) / 100, Math.round((center + radius * Math.sin(radians)) * 100) / 100];
};

/** Uploads on the outer ring in delivered order (slots offset by half a slot so no upload sits on the ring's label at 12 o'clock); the explicitly selected upload at the core. The ring keeps its slot count so nothing shifts when one is selected. */
export function uploadOrbit(pools: readonly JobPoolUploadSummary[], selectedJobPoolUploadId: string | null, layout: PoolFieldLayout = POOL_FIELD_LAYOUT): PoolFieldUploadNode[] {
  const slot = pools.length === 0 ? 0 : 360 / pools.length;
  return pools.map((pool, index) => {
    const selected = pool.jobPoolUploadId === selectedJobPoolUploadId;
    const angle = (index + 0.5) * slot;
    const [x, y] = selected ? [layout.center, layout.center] : point(layout.center, layout.uploadRadius, angle);
    return { jobPoolUploadId: pool.jobPoolUploadId, poolName: pool.poolName, poolVersion: pool.poolVersion, poolStatus: pool.poolStatus, roleCount: pool.roleCount, organizationCount: pool.organizationCount, requirementCount: pool.requirementCount, deliveredIndex: index + 1, selected, angle: selected ? null : angle, x, y };
  });
}

export interface PoolFieldStructureRequirement {
  poolRequirementId: string;
  capabilityName: string;
  necessityState: string;
  matchingEligibility: string;
  targetRequirementRevisionId: string;
}

export interface PoolFieldStructureRole {
  poolRoleId: string;
  title: string;
  poolOrganizationId: string;
  organizationName: string;
  targetRoleProfileRevisionId: string;
  requirements: PoolFieldStructureRequirement[];
  angle: number;
  x: number;
  y: number;
  /** Delivered POOL RESONANCE (PRESENTATION) when a matching for this pool was delivered; null = no matching read. */
  resonanceScore: number | null;
  /** resonance > 0 and at least one scored match in the delivered matching; null = no matching read. */
  hasScoredMatch: boolean | null;
  deliveredRank: number | null;
}

export interface PoolFieldOrganization {
  poolOrganizationId: string;
  name: string;
  roleIds: string[];
  startAngle: number;
  endAngle: number;
  arc: string;
}

export interface PoolFieldStructure {
  jobPoolUploadId: string;
  poolName: string;
  poolVersion: number;
  poolStatus: JobPoolUploadView["poolStatus"];
  mapping: Pick<JobPoolUploadView["canonicalMapping"], "mappingState" | "proposalState" | "authorityState" | "provider">;
  organizations: PoolFieldOrganization[];
  roles: PoolFieldStructureRole[];
  requirementCount: number;
  /** Whether the light on the roles comes from a delivered matching of this exact upload. */
  matchingDelivered: boolean;
}

export function derivePoolStructure(view: JobPoolUploadView, matching: JobPoolMatchPresentation | null, layout: PoolFieldLayout = POOL_FIELD_LAYOUT): PoolFieldStructure {
  const mapping = view.canonicalMapping;
  const organizationName = (id: string) => mapping.organizations.find(organization => organization.poolOrganizationId === id)?.name ?? id;
  const groups: Array<{ poolOrganizationId: string; roles: typeof mapping.roles }> = [];
  for (const role of mapping.roles) {
    let group = groups.find(candidate => candidate.poolOrganizationId === role.poolOrganizationId);
    if (group === undefined) { group = { poolOrganizationId: role.poolOrganizationId, roles: [] }; groups.push(group); }
    group.roles.push(role);
  }
  const matchingDelivered = matching !== null && matching.jobPoolUploadId === view.jobPoolUploadId;
  const delivered = matchingDelivered ? matching!.roleMatches : [];
  const slot = mapping.roles.length === 0 ? 0 : 360 / mapping.roles.length;
  const organizations: PoolFieldOrganization[] = [];
  const roles: PoolFieldStructureRole[] = [];
  let slotIndex = 0;
  for (const group of groups) {
    const startAngle = slotIndex * slot;
    for (const role of group.roles) {
      const angle = (slotIndex + 0.5) * slot;
      const [x, y] = point(layout.center, layout.structureRadius, angle);
      const match = delivered.find(candidate => candidate.poolRoleId === role.poolRoleId) ?? null;
      roles.push({
        poolRoleId: role.poolRoleId,
        title: role.title,
        poolOrganizationId: role.poolOrganizationId,
        organizationName: organizationName(role.poolOrganizationId),
        targetRoleProfileRevisionId: role.targetRoleProfileRevisionId,
        requirements: role.requirements.map(requirement => ({ poolRequirementId: requirement.poolRequirementId, capabilityName: requirement.capabilityName, necessityState: requirement.necessityState, matchingEligibility: requirement.matchingEligibility, targetRequirementRevisionId: requirement.targetRequirementRevisionId })),
        angle,
        x,
        y,
        resonanceScore: matchingDelivered ? (match?.resonanceScore ?? 0) : null,
        hasScoredMatch: matchingDelivered ? (match !== null && match.resonanceScore > 0 && match.matched.length > 0) : null,
        deliveredRank: match === null ? null : delivered.indexOf(match) + 1
      });
      slotIndex += 1;
    }
    const endAngle = slotIndex * slot;
    organizations.push({ poolOrganizationId: group.poolOrganizationId, name: organizationName(group.poolOrganizationId), roleIds: group.roles.map(role => role.poolRoleId), startAngle, endAngle, arc: arcPath(layout.center, layout.center, layout.organizationRadius, startAngle + 2, endAngle - 2) });
  }
  return {
    jobPoolUploadId: view.jobPoolUploadId,
    poolName: view.poolName,
    poolVersion: view.poolVersion,
    poolStatus: view.poolStatus,
    mapping: { mappingState: mapping.mappingState, proposalState: mapping.proposalState, authorityState: mapping.authorityState, provider: mapping.provider },
    organizations,
    roles,
    requirementCount: roles.reduce((sum, role) => sum + role.requirements.length, 0),
    matchingDelivered
  };
}

export type PoolFieldListState = "LOADING" | "EMPTY" | "NOT_PROVISIONED" | "FAILED" | "AVAILABLE";

export function describePoolListState(pools: { state: string }): PoolFieldListState {
  switch (pools.state) {
    case "AVAILABLE": return "AVAILABLE";
    case "EMPTY": return "EMPTY";
    case "NOT_PROVISIONED": return "NOT_PROVISIONED";
    case "FAILED": return "FAILED";
    default: return "LOADING";
  }
}
