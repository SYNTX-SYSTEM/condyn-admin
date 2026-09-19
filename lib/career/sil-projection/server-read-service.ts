import type { CandidateSourceBundleRepository, CapabilityCoreRepository } from "../capability-core";
import type { OrganizationRelationRepository } from "../relation-adapters/organization-relation-persistence";
import type { RoleRelationRepository } from "../relation/role-relation";
import type { TensionStateRepository } from "../relation/tension-state";
import type { EvolutionInputStateRepository } from "../relation/evolution-input";
import { composeCanonicalSilReadModel, type CanonicalSilReadModel } from "./canonical-read-model";

export interface CanonicalSilReadIdentitySet {
  candidateSourceBundleId: string;
  verifiedCapabilitySnapshotId: string;
  organizationRelationId: string;
  roleRelationId: string;
  tensionStateId: string;
  evolutionInputStateId: string;
}

export interface CanonicalSilReadDependencies {
  sourceBundles: CandidateSourceBundleRepository;
  capabilities: Pick<CapabilityCoreRepository, "getSnapshotById">;
  organizations: OrganizationRelationRepository;
  roles: Pick<RoleRelationRepository, "getRoleRelationById">;
  tensions: Pick<TensionStateRepository, "getTensionStateById">;
  evolutions: Pick<EvolutionInputStateRepository, "getEvolutionInputStateById">;
}

const fail = (code: string): never => { throw new Error(code); };
const identifier = (value: unknown): value is string => typeof value === "string" && value.length > 0 && value.trim() === value;

function assertIdentitySet(value: unknown): asserts value is CanonicalSilReadIdentitySet {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail("ERR_CANONICAL_SIL_READ_INPUT_INVALID");
  const item = value as Record<string, unknown>;
  const keys = Object.keys(item).sort();
  const expected = ["candidateSourceBundleId", "evolutionInputStateId", "organizationRelationId", "roleRelationId", "tensionStateId", "verifiedCapabilitySnapshotId"];
  if (keys.length !== expected.length || keys.some((key, index) => key !== expected[index]) || expected.some(key => !identifier(item[key]))) fail("ERR_CANONICAL_SIL_READ_INPUT_INVALID");
}

function assertDependencies(value: unknown): asserts value is CanonicalSilReadDependencies {
  if (!value || typeof value !== "object") fail("ERR_CANONICAL_SIL_READ_DEPENDENCIES_INVALID");
  const item = value as CanonicalSilReadDependencies;
  if (
    typeof item.sourceBundles?.getCandidateSourceBundleById !== "function" ||
    typeof item.capabilities?.getSnapshotById !== "function" ||
    typeof item.organizations?.getOrganizationRelationById !== "function" ||
    typeof item.roles?.getRoleRelationById !== "function" ||
    typeof item.tensions?.getTensionStateById !== "function" ||
    typeof item.evolutions?.getEvolutionInputStateById !== "function"
  ) fail("ERR_CANONICAL_SIL_READ_DEPENDENCIES_INVALID");
}

/**
 * Read-only composition over six caller-selected immutable identities. Repository
 * failures propagate unchanged; absence is made explicit and T25 remains the
 * sole projection and cross-artifact lineage authority.
 */
export async function readCanonicalSilReadModel(
  identities: CanonicalSilReadIdentitySet,
  dependencies: CanonicalSilReadDependencies,
): Promise<CanonicalSilReadModel> {
  assertDependencies(dependencies);
  assertIdentitySet(identities);
  const [sourceBundle, snapshot, organization, role, tension, evolution] = await Promise.all([
    dependencies.sourceBundles.getCandidateSourceBundleById(identities.candidateSourceBundleId),
    dependencies.capabilities.getSnapshotById(identities.verifiedCapabilitySnapshotId),
    dependencies.organizations.getOrganizationRelationById(identities.organizationRelationId),
    dependencies.roles.getRoleRelationById(identities.roleRelationId),
    dependencies.tensions.getTensionStateById(identities.tensionStateId),
    dependencies.evolutions.getEvolutionInputStateById(identities.evolutionInputStateId),
  ]);
  if (sourceBundle === null) fail("ERR_CANONICAL_SIL_READ_SOURCE_BUNDLE_NOT_FOUND");
  if (snapshot === null) fail("ERR_CANONICAL_SIL_READ_CAPABILITY_SNAPSHOT_NOT_FOUND");
  if (organization === null) fail("ERR_CANONICAL_SIL_READ_ORGANIZATION_RELATION_NOT_FOUND");
  if (role === null) fail("ERR_CANONICAL_SIL_READ_ROLE_RELATION_NOT_FOUND");
  if (tension === null) fail("ERR_CANONICAL_SIL_READ_TENSION_STATE_NOT_FOUND");
  if (evolution === null) fail("ERR_CANONICAL_SIL_READ_EVOLUTION_INPUT_STATE_NOT_FOUND");
  return composeCanonicalSilReadModel({
    identity: { state: "AVAILABLE", artifacts: sourceBundle!.documents },
    capability: { state: "AVAILABLE", artifacts: [snapshot!] },
    resonance: { state: "AVAILABLE", artifacts: [organization!] },
    role: { state: "AVAILABLE", artifacts: [role!] },
    tension: { state: "AVAILABLE", artifacts: [tension!] },
    evolution: { state: "AVAILABLE", artifacts: [evolution!] },
  });
}
