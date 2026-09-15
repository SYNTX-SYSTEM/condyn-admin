import { deriveEvolutionInputState } from "../../relation/evolution-input";
import { createOrganizationRelation } from "../../relation/organization-relation";
import { classifyRoleRelation } from "../../relation/tension-state";
import type {
  ComposeOrganizationRelationEvolutionInput,
  OrganizationRelationEvolutionComposition,
  OrganizationRelationEvolutionRoleBranch,
} from "./types";

/**
 * Composes sealed relation-layer artifacts in canonical OrganizationRelation membership order.
 * It stops at EvolutionInputState and delegates all constituent validation and authority to their owners.
 */
export function composeOrganizationRelationEvolution(
  input: ComposeOrganizationRelationEvolutionInput,
): OrganizationRelationEvolutionComposition {
  const organizationRelation = createOrganizationRelation({
    targetOrganizationRevision: input.targetOrganizationRevision,
    roleRelationMemberships: input.roleRelationMemberships,
    aggregationPolicy: input.aggregationPolicy,
    createdAt: input.createdAt,
  });
  const roleBranches: OrganizationRelationEvolutionRoleBranch[] = [];
  for (const membership of organizationRelation.roleRelationMemberships) {
    const tensionState = classifyRoleRelation(
      membership.roleRelation,
      input.tensionClassificationPolicy,
      input.createdAt,
    );
    const evolutionInputState = deriveEvolutionInputState(
      tensionState,
      input.evolutionInputDerivationPolicy,
      input.createdAt,
    );
    roleBranches.push({
      roleRelation: structuredClone(membership.roleRelation),
      tensionState,
      evolutionInputState,
    });
  }
  return { organizationRelation, roleBranches };
}

export type {
  ComposeOrganizationRelationEvolutionInput,
  OrganizationRelationEvolutionComposition,
  OrganizationRelationEvolutionRoleBranch,
} from "./types";
