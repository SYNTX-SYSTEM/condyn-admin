import type { OrganizationRelationAggregationPolicy } from "../../relation/organization-relation";

export interface CanonicalSilExecutionRoleMembershipIdentity {
  roleRelationId: string;
  targetRoleProfileRevisionId: string;
  targetRoleOrganizationBindingRevisionId: string;
}

/**
 * Immutable Stage-B product authority. These are caller-selected exact IDs,
 * never repository-selection instructions or inference-derived substitutes.
 */
export interface CanonicalSilExecutionInput {
  candidateSourceBundleId: string;
  verifiedCapabilitySnapshotId: string;
  targetOrganizationRevisionId: string;
  roleMembership: CanonicalSilExecutionRoleMembershipIdentity;
  organizationAggregationPolicy: OrganizationRelationAggregationPolicy;
  tensionClassificationPolicyVersion: string;
  evolutionInputDerivationPolicyVersion: string;
  createdAt: string;
}

const fail = (code: string): never => { throw new Error(code); };
const id = (value: unknown): value is string => typeof value === "string" && value.length > 0 && value.trim() === value;
const timestamp = (value: unknown): value is string => id(value) && !Number.isNaN(new Date(value).valueOf()) && new Date(value).toISOString() === value;

function exactKeys(value: unknown, keys: readonly string[]): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return fail("ERR_CANONICAL_SIL_EXECUTION_INPUT_INVALID");
  const record = value as Record<string, unknown>;
  const actual = Object.keys(record).sort();
  const expected = [...keys].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) return fail("ERR_CANONICAL_SIL_EXECUTION_INPUT_INVALID");
  return record;
}

function membership(value: unknown): CanonicalSilExecutionRoleMembershipIdentity {
  const item = exactKeys(value, ["roleRelationId", "targetRoleProfileRevisionId", "targetRoleOrganizationBindingRevisionId"]);
  if (!id(item.roleRelationId) || !id(item.targetRoleProfileRevisionId) || !id(item.targetRoleOrganizationBindingRevisionId)) return fail("ERR_CANONICAL_SIL_EXECUTION_INPUT_INVALID");
  return {
    roleRelationId: item.roleRelationId,
    targetRoleProfileRevisionId: item.targetRoleProfileRevisionId,
    targetRoleOrganizationBindingRevisionId: item.targetRoleOrganizationBindingRevisionId,
  };
}

export function assertCanonicalSilExecutionInput(value: unknown): asserts value is CanonicalSilExecutionInput {
  const item = exactKeys(value, [
    "candidateSourceBundleId", "verifiedCapabilitySnapshotId", "targetOrganizationRevisionId", "roleMembership",
    "organizationAggregationPolicy", "tensionClassificationPolicyVersion", "evolutionInputDerivationPolicyVersion", "createdAt",
  ]);
  if (!id(item.candidateSourceBundleId) || !id(item.verifiedCapabilitySnapshotId) || !id(item.targetOrganizationRevisionId) || !id(item.tensionClassificationPolicyVersion) || !id(item.evolutionInputDerivationPolicyVersion) || !timestamp(item.createdAt)) return fail("ERR_CANONICAL_SIL_EXECUTION_INPUT_INVALID");
  membership(item.roleMembership);
  const policy = item.organizationAggregationPolicy;
  if (!policy || typeof policy !== "object" || Array.isArray(policy)) return fail("ERR_CANONICAL_SIL_EXECUTION_INPUT_INVALID");
}

export function canonicalizeCanonicalSilExecutionInput(value: CanonicalSilExecutionInput): CanonicalSilExecutionInput {
  assertCanonicalSilExecutionInput(value);
  return {
    ...structuredClone(value),
    roleMembership: membership(value.roleMembership),
  };
}
