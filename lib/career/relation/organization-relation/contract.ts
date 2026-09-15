import { createHash } from "node:crypto";
import { assertRoleRelation } from "../role-relation";
import { assertTargetOrganizationRevision } from "../../target/organization";
import { assertTargetRoleOrganizationBindingRevision } from "../../target/role/organization-binding";
import { assertTargetRoleProfileRevision } from "../../target/role/profile";
import type {
  CreateOrganizationRelationInput,
  OrganizationRelation,
  OrganizationRelationAggregationPolicy,
  OrganizationRoleRelationMembership,
} from "./types";

export const ORGANIZATION_RELATION_SCHEMA_VERSION = "ORGANIZATION_RELATION_V1" as const;
export const ORGANIZATION_RELATION_AGGREGATION_POLICY_SCHEMA_VERSION = "ORGANIZATION_RELATION_AGGREGATION_POLICY_V1" as const;
export const ORGANIZATION_RELATION_INVENTORY_ONLY_POLICY_VERSION = "ORGANIZATION_RELATION_INVENTORY_ONLY_V1" as const;

const fail = (code: string): never => { throw new Error(code); };
const clone = <T>(value: T): T => {
  try { return structuredClone(value); } catch { return fail("ERR_ORGANIZATION_RELATION_INVALID"); }
};
function isRecord(value: unknown): value is Record<string, unknown> { return value !== null && typeof value === "object" && !Array.isArray(value); }
function exactKeys(value: unknown, expected: readonly string[], code = "ERR_ORGANIZATION_RELATION_INVALID"): asserts value is Record<string, unknown> {
  if (!isRecord(value)) fail(code);
  const actual = Object.keys(value as Record<string, unknown>).sort();
  const sortedExpected = [...expected].sort();
  if (actual.length !== sortedExpected.length || actual.some((key, index) => key !== sortedExpected[index])) fail(code);
}
const timestamp = (value: unknown): value is string => typeof value === "string" && !Number.isNaN(new Date(value).valueOf()) && new Date(value).toISOString() === value;
const text = (value: unknown): value is string => typeof value === "string" && value.length > 0;

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value !== null && typeof value === "object") {
    const item = value as Record<string, unknown>;
    return `{${Object.keys(item).sort().map(key => `${JSON.stringify(key)}:${stable(item[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function stableOrganizationRelation(value: unknown): string { return stable(value); }

function validatePolicy(value: unknown): asserts value is OrganizationRelationAggregationPolicy {
  exactKeys(value, ["schemaVersion", "organizationRelationAggregationPolicyVersion", "aggregationMode"], "ERR_ORGANIZATION_RELATION_AGGREGATION_POLICY_INVALID");
  const item = value as unknown as OrganizationRelationAggregationPolicy;
  if (
    item.schemaVersion !== ORGANIZATION_RELATION_AGGREGATION_POLICY_SCHEMA_VERSION ||
    item.organizationRelationAggregationPolicyVersion !== ORGANIZATION_RELATION_INVENTORY_ONLY_POLICY_VERSION ||
    item.aggregationMode !== "ROLE_RELATION_INVENTORY_ONLY"
  ) fail("ERR_ORGANIZATION_RELATION_AGGREGATION_POLICY_INVALID");
}

function validateOrganization(value: unknown): void {
  try { assertTargetOrganizationRevision(value); } catch { fail("ERR_ORGANIZATION_RELATION_ORGANIZATION_INVALID"); }
}
function validateRoleRelation(value: unknown): void {
  try { assertRoleRelation(value); } catch { fail("ERR_ORGANIZATION_RELATION_ROLE_RELATION_INVALID"); }
}
function validateProfile(value: unknown): void {
  try { assertTargetRoleProfileRevision(value); } catch { fail("ERR_ORGANIZATION_RELATION_ROLE_PROFILE_INVALID"); }
}
function validateBinding(value: unknown): void {
  try { assertTargetRoleOrganizationBindingRevision(value); } catch { fail("ERR_ORGANIZATION_RELATION_ROLE_ORGANIZATION_BINDING_INVALID"); }
}

function validateMembershipShape(value: unknown): asserts value is OrganizationRoleRelationMembership {
  exactKeys(value, ["roleRelation", "targetRoleProfileRevision", "targetRoleOrganizationBindingRevision"]);
}

function normalizedMemberships(
  value: unknown,
  targetOrganizationRevisionId: string,
): OrganizationRoleRelationMembership[] {
  if (!Array.isArray(value)) fail("ERR_ORGANIZATION_RELATION_INVALID");
  if ((value as unknown[]).length === 0) fail("ERR_ORGANIZATION_RELATION_EMPTY_INVENTORY");

  const memberships = clone(value) as OrganizationRoleRelationMembership[];
  for (const membership of memberships) validateMembershipShape(membership);
  for (const membership of memberships) validateRoleRelation(membership.roleRelation);
  for (const membership of memberships) validateProfile(membership.targetRoleProfileRevision);
  for (const membership of memberships) validateBinding(membership.targetRoleOrganizationBindingRevision);

  const candidateSnapshotId = memberships[0].roleRelation.verifiedCapabilitySnapshotId;
  if (memberships.some(membership => membership.roleRelation.verifiedCapabilitySnapshotId !== candidateSnapshotId)) {
    fail("ERR_ORGANIZATION_RELATION_CANDIDATE_SNAPSHOT_MISMATCH");
  }
  for (const membership of memberships) {
    if (membership.roleRelation.targetRoleProfileRevisionId !== membership.targetRoleProfileRevision.targetRoleProfileRevisionId) fail("ERR_ORGANIZATION_RELATION_MEMBERSHIP_MISMATCH");
    if (membership.targetRoleProfileRevision.targetRoleOrganizationBindingRevisionId !== membership.targetRoleOrganizationBindingRevision.targetRoleOrganizationBindingRevisionId) fail("ERR_ORGANIZATION_RELATION_MEMBERSHIP_MISMATCH");
    if (membership.targetRoleOrganizationBindingRevision.targetRoleEntityId !== membership.targetRoleProfileRevision.targetRoleEntityId) fail("ERR_ORGANIZATION_RELATION_MEMBERSHIP_MISMATCH");
    if (membership.targetRoleOrganizationBindingRevision.targetOrganizationRevisionId !== targetOrganizationRevisionId) fail("ERR_ORGANIZATION_RELATION_MEMBERSHIP_MISMATCH");
  }
  const roleRelationIds = new Set<string>();
  for (const membership of memberships) {
    if (roleRelationIds.has(membership.roleRelation.roleRelationId)) fail("ERR_ORGANIZATION_RELATION_DUPLICATE_ROLE_RELATION");
    roleRelationIds.add(membership.roleRelation.roleRelationId);
  }
  const profileIds = new Set<string>();
  for (const membership of memberships) {
    if (profileIds.has(membership.targetRoleProfileRevision.targetRoleProfileRevisionId)) fail("ERR_ORGANIZATION_RELATION_DUPLICATE_ROLE_PROFILE");
    profileIds.add(membership.targetRoleProfileRevision.targetRoleProfileRevisionId);
  }
  return memberships.sort((left, right) => left.roleRelation.roleRelationId.localeCompare(right.roleRelation.roleRelationId));
}

function organizationSemanticIdentity(value: OrganizationRelation["targetOrganizationRevision"]): unknown {
  const { targetOrganizationRevisionId, createdAt, ...semanticBody } = value;
  return { targetOrganizationRevisionId: value.targetOrganizationRevisionId, semanticBody };
}

function membershipIdentity(value: OrganizationRoleRelationMembership): unknown {
  return {
    roleRelationId: value.roleRelation.roleRelationId,
    targetRoleProfileRevisionId: value.targetRoleProfileRevision.targetRoleProfileRevisionId,
    targetRoleOrganizationBindingRevisionId: value.targetRoleOrganizationBindingRevision.targetRoleOrganizationBindingRevisionId,
    targetRoleEntityId: value.targetRoleProfileRevision.targetRoleEntityId,
  };
}

type SemanticInput = Omit<OrganizationRelation, "organizationRelationId" | "createdAt">;

export function deriveOrganizationRelationId(value: SemanticInput): string {
  return `ORL_${createHash("sha256").update(stable({
    schemaVersion: value.schemaVersion,
    verifiedCapabilitySnapshotId: value.verifiedCapabilitySnapshotId,
    targetOrganizationRevision: organizationSemanticIdentity(value.targetOrganizationRevision),
    roleRelationMemberships: [...value.roleRelationMemberships]
      .sort((left, right) => left.roleRelation.roleRelationId.localeCompare(right.roleRelation.roleRelationId))
      .map(membershipIdentity),
    aggregationPolicy: value.aggregationPolicy,
  }), "utf8").digest("hex").slice(0, 32).toUpperCase()}`;
}

function validateRootInput(value: unknown): asserts value is CreateOrganizationRelationInput {
  exactKeys(value, ["targetOrganizationRevision", "roleRelationMemberships", "aggregationPolicy", "createdAt"]);
  if (!timestamp((value as unknown as CreateOrganizationRelationInput).createdAt)) fail("ERR_ORGANIZATION_RELATION_INVALID");
}

function semanticFromInput(value: CreateOrganizationRelationInput): SemanticInput {
  validateOrganization(value.targetOrganizationRevision);
  const memberships = normalizedMemberships(value.roleRelationMemberships, value.targetOrganizationRevision.targetOrganizationRevisionId);
  validatePolicy(value.aggregationPolicy);
  return {
    verifiedCapabilitySnapshotId: memberships[0].roleRelation.verifiedCapabilitySnapshotId,
    targetOrganizationRevision: clone(value.targetOrganizationRevision),
    roleRelationMemberships: memberships,
    aggregationPolicy: clone(value.aggregationPolicy),
    schemaVersion: ORGANIZATION_RELATION_SCHEMA_VERSION,
  };
}

export function createOrganizationRelation(value: CreateOrganizationRelationInput): OrganizationRelation {
  validateRootInput(value);
  const semantic = semanticFromInput(value);
  const result: OrganizationRelation = {
    organizationRelationId: deriveOrganizationRelationId(semantic),
    ...semantic,
    createdAt: value.createdAt,
  };
  assertOrganizationRelation(result);
  return clone(result);
}

export function assertOrganizationRelation(value: unknown): asserts value is OrganizationRelation {
  exactKeys(value, [
    "organizationRelationId", "verifiedCapabilitySnapshotId", "targetOrganizationRevision",
    "roleRelationMemberships", "aggregationPolicy", "schemaVersion", "createdAt",
  ]);
  const item = value as unknown as OrganizationRelation;
  if (!text(item.organizationRelationId) || item.schemaVersion !== ORGANIZATION_RELATION_SCHEMA_VERSION || !timestamp(item.createdAt)) {
    fail("ERR_ORGANIZATION_RELATION_INVALID");
  }
  validateOrganization(item.targetOrganizationRevision);
  const memberships = normalizedMemberships(item.roleRelationMemberships, item.targetOrganizationRevision.targetOrganizationRevisionId);
  if (!text(item.verifiedCapabilitySnapshotId) || item.verifiedCapabilitySnapshotId !== memberships[0].roleRelation.verifiedCapabilitySnapshotId) {
    fail("ERR_ORGANIZATION_RELATION_INVALID");
  }
  validatePolicy(item.aggregationPolicy);
  if (memberships.some((membership, index) => membership.roleRelation.roleRelationId !== item.roleRelationMemberships[index]?.roleRelation?.roleRelationId)) {
    fail("ERR_ORGANIZATION_RELATION_INVALID");
  }
  const semantic: SemanticInput = {
    verifiedCapabilitySnapshotId: item.verifiedCapabilitySnapshotId,
    targetOrganizationRevision: clone(item.targetOrganizationRevision),
    roleRelationMemberships: memberships,
    aggregationPolicy: clone(item.aggregationPolicy),
    schemaVersion: ORGANIZATION_RELATION_SCHEMA_VERSION,
  };
  if (item.organizationRelationId !== deriveOrganizationRelationId(semantic)) fail("ERR_ORGANIZATION_RELATION_ID_MISMATCH");
}
