import { computeSourceBundleHash, type CandidateSourceBundleRepository, type CapabilityCoreRepository } from "../../capability-core";
import type { OrganizationRelationRepository } from "../../relation-adapters/organization-relation-persistence";
import { createOrganizationRelation } from "../../relation/organization-relation";
import type { RoleRelationRepository } from "../../relation/role-relation";
import { produceAndPersistTensionState, type TensionClassificationPolicyRegistry, type TensionStateRepository } from "../../relation/tension-state";
import { produceAndPersistEvolutionInputState, type EvolutionInputDerivationPolicyRegistry, type EvolutionInputStateRepository } from "../../relation/evolution-input";
import type { TargetOrganizationRevisionRepository } from "../../target/organization";
import type { TargetRoleProfileRevisionRepository } from "../../target/role/profile";
import type { TargetRoleOrganizationBindingRevisionRepository } from "../../target/role/organization-binding";
import { createCanonicalSilRuntimeAssociation, type CanonicalSilRuntimeAssociation, type CanonicalSilRuntimeAssociationRepository } from "./association";
import { canonicalizeCanonicalSilExecutionInput, type CanonicalSilExecutionInput } from "./input";

const fail = (code: string): never => { throw new Error(code); };
const required = <T>(value: T | null | undefined): NonNullable<T> => {
  if (value === null || value === undefined) fail("ERR_CANONICAL_SIL_STAGE_B_IDENTITY_NOT_FOUND");
  return value as NonNullable<T>;
};

export interface CanonicalSilExecutionDependencies {
  sourceBundles: CandidateSourceBundleRepository;
  capabilities: Pick<CapabilityCoreRepository, "getSnapshotById">;
  organizations: TargetOrganizationRevisionRepository;
  roles: RoleRelationRepository;
  profiles: TargetRoleProfileRevisionRepository;
  bindings: TargetRoleOrganizationBindingRevisionRepository;
  organizationRelations: OrganizationRelationRepository;
  tensions: TensionStateRepository;
  tensionPolicies: TensionClassificationPolicyRegistry;
  evolutions: EvolutionInputStateRepository;
  evolutionPolicies: EvolutionInputDerivationPolicyRegistry;
  associations: CanonicalSilRuntimeAssociationRepository;
}

/** Consumes only caller-selected immutable Stage-B operands; it performs no selection. */
export async function executeCanonicalSilStageB(input: CanonicalSilExecutionInput, dependencies: CanonicalSilExecutionDependencies): Promise<CanonicalSilRuntimeAssociation> {
  const exact = canonicalizeCanonicalSilExecutionInput(input);
  const [sourceBundle, snapshot, organization, role, profile, binding] = await Promise.all([
    dependencies.sourceBundles.getCandidateSourceBundleById(exact.candidateSourceBundleId),
    dependencies.capabilities.getSnapshotById(exact.verifiedCapabilitySnapshotId),
    dependencies.organizations.getRevisionById(exact.targetOrganizationRevisionId),
    dependencies.roles.getRoleRelationById(exact.roleMembership.roleRelationId),
    dependencies.profiles.getRevisionById(exact.roleMembership.targetRoleProfileRevisionId),
    dependencies.bindings.getRevisionById(exact.roleMembership.targetRoleOrganizationBindingRevisionId),
  ]);
  const exactSourceBundle = required(sourceBundle); const exactSnapshot = required(snapshot); const exactOrganization = required(organization); const exactRole = required(role); const exactProfile = required(profile); const exactBinding = required(binding);
  if (computeSourceBundleHash(exactSourceBundle.documents) !== exactSnapshot.sourceBundleHash || exactRole.verifiedCapabilitySnapshotId !== exactSnapshot.snapshotId || exactRole.targetRoleProfileRevisionId !== exactProfile.targetRoleProfileRevisionId || exactProfile.targetRoleOrganizationBindingRevisionId !== exactBinding.targetRoleOrganizationBindingRevisionId || exactBinding.targetOrganizationRevisionId !== exactOrganization.targetOrganizationRevisionId) fail("ERR_CANONICAL_SIL_STAGE_B_LINEAGE_INVALID");
  const organizationRelation = await dependencies.organizationRelations.persistOrganizationRelation(createOrganizationRelation({ targetOrganizationRevision: exactOrganization, roleRelationMemberships: [{ roleRelation: exactRole, targetRoleProfileRevision: exactProfile, targetRoleOrganizationBindingRevision: exactBinding }], aggregationPolicy: exact.organizationAggregationPolicy, createdAt: exact.createdAt }));
  const tension = await produceAndPersistTensionState({ roleRelationId: exactRole.roleRelationId, classificationPolicyVersion: exact.tensionClassificationPolicyVersion, createdAt: exact.createdAt }, { roles: dependencies.roles, policies: dependencies.tensionPolicies, tensionStates: dependencies.tensions });
  const evolution = await produceAndPersistEvolutionInputState({ tensionStateId: tension.tensionStateId, derivationPolicyVersion: exact.evolutionInputDerivationPolicyVersion, createdAt: exact.createdAt }, { tensionStates: dependencies.tensions, policies: dependencies.evolutionPolicies, evolutionInputs: dependencies.evolutions });
  if (organizationRelation.verifiedCapabilitySnapshotId !== exactSnapshot.snapshotId || tension.roleRelationId !== exactRole.roleRelationId || evolution.tensionStateId !== tension.tensionStateId) fail("ERR_CANONICAL_SIL_STAGE_B_LINEAGE_INVALID");
  return dependencies.associations.save(createCanonicalSilRuntimeAssociation(exact, { organizationRelationId: organizationRelation.organizationRelationId, tensionStateId: tension.tensionStateId, evolutionInputStateId: evolution.evolutionInputStateId }));
}
