import type { RoleRelation } from "../role-relation";
import type { TargetOrganizationRevision } from "../../target/organization";
import type { TargetRoleOrganizationBindingRevision } from "../../target/role/organization-binding";
import type { TargetRoleProfileRevision } from "../../target/role/profile";

export interface OrganizationRelationAggregationPolicy {
  schemaVersion: "ORGANIZATION_RELATION_AGGREGATION_POLICY_V1";
  organizationRelationAggregationPolicyVersion: "ORGANIZATION_RELATION_INVENTORY_ONLY_V1";
  aggregationMode: "ROLE_RELATION_INVENTORY_ONLY";
}

export interface OrganizationRoleRelationMembership {
  roleRelation: RoleRelation;
  targetRoleProfileRevision: TargetRoleProfileRevision;
  targetRoleOrganizationBindingRevision: TargetRoleOrganizationBindingRevision;
}

export interface OrganizationRelation {
  organizationRelationId: string;
  verifiedCapabilitySnapshotId: string;
  targetOrganizationRevision: TargetOrganizationRevision;
  roleRelationMemberships: OrganizationRoleRelationMembership[];
  aggregationPolicy: OrganizationRelationAggregationPolicy;
  schemaVersion: "ORGANIZATION_RELATION_V1";
  createdAt: string;
}

export interface CreateOrganizationRelationInput {
  targetOrganizationRevision: TargetOrganizationRevision;
  roleRelationMemberships: OrganizationRoleRelationMembership[];
  aggregationPolicy: OrganizationRelationAggregationPolicy;
  createdAt: string;
}
