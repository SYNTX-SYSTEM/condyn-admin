import type { OrganizationRelation, OrganizationRelationAggregationPolicy, OrganizationRoleRelationMembership } from "../../relation/organization-relation";
import type { RoleRelation } from "../../relation/role-relation";
import type { EvolutionInputDerivationPolicy, EvolutionInputState } from "../../relation/evolution-input";
import type { TensionClassificationPolicy, TensionState } from "../../relation/tension-state";
import type { TargetOrganizationRevision } from "../../target/organization";

/** Explicit sealed operands for deterministic application-service composition through EvolutionInputState. */
export interface ComposeOrganizationRelationEvolutionInput {
  targetOrganizationRevision: TargetOrganizationRevision;
  roleRelationMemberships: readonly OrganizationRoleRelationMembership[];
  aggregationPolicy: OrganizationRelationAggregationPolicy;
  tensionClassificationPolicy: TensionClassificationPolicy;
  evolutionInputDerivationPolicy: EvolutionInputDerivationPolicy;
  createdAt: string;
}

/** One canonical membership's retained RoleRelation and its independently derived Tension/Evolution artifacts. */
export interface OrganizationRelationEvolutionRoleBranch {
  roleRelation: RoleRelation;
  tensionState: TensionState;
  evolutionInputState: EvolutionInputState;
}

/** Operational envelope only; it adds no canonical identity, authority, persistence, or replay state. */
export interface OrganizationRelationEvolutionComposition {
  organizationRelation: OrganizationRelation;
  roleBranches: readonly OrganizationRelationEvolutionRoleBranch[];
}
