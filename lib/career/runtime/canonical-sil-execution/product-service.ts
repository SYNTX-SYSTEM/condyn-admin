import { readCanonicalSilReadModel, type CanonicalSilReadDependencies, type CanonicalSilReadIdentitySet } from "../../sil-projection/server-read-service";
import type { CanonicalSilReadModel } from "../../sil-projection/canonical-read-model";
import { drizzle } from "drizzle-orm/postgres-js";
import { db } from "../../db/client";
import { PostgresCandidateSourceBundleRepository, PostgresCapabilityCoreRepository } from "../../capability-core";
import { PostgresTargetOrganizationRevisionRepository } from "../../target-adapters/organization-revision-persistence";
import { PostgresTargetSourceRevisionRepository } from "../../target-adapters/source-revision-persistence";
import { PostgresTargetRoleSourceBindingRevisionRepository } from "../../target-adapters/role-source-binding-revision-persistence";
import { PostgresTargetRoleOrganizationBindingRevisionRepository } from "../../target-adapters/role-organization-binding-revision-persistence";
import { PostgresTargetRoleProfileRevisionRepository } from "../../target-adapters/role-profile-revision-persistence";
import { PostgresRoleRelationRepository } from "../../relation-adapters/role-relation-persistence";
import { PostgresOrganizationRelationRepository } from "../../relation-adapters/organization-relation-persistence";
import { PostgresTensionStateRepository } from "../../relation-adapters/tension-state-persistence";
import { PostgresEvolutionInputStateRepository } from "../../relation-adapters/evolution-input-persistence";
import { PostgresCanonicalSilRuntimeAssociationRepository } from "./association";
import type { CanonicalSilRuntimeAssociation, CanonicalSilRuntimeAssociationRepository } from "./association";
import { executeCanonicalSilStageB, type CanonicalSilExecutionDependencies } from "./service";
import type { CanonicalSilExecutionInput } from "./input";

/** Product configuration contains exact policy versions, never a policy selector. */
export interface CanonicalSilStageBPolicyConfiguration {
  tensionClassificationPolicyVersion: string;
  evolutionInputDerivationPolicyVersion: string;
}

export interface CanonicalSilStageBProductService {
  execute(input: CanonicalSilExecutionInput): Promise<CanonicalSilRuntimeAssociation>;
  read(associationId: string): Promise<{ association: CanonicalSilRuntimeAssociation; identities: CanonicalSilReadIdentitySet; model: CanonicalSilReadModel }>;
}

export interface CanonicalSilStageBProductDependencies extends CanonicalSilExecutionDependencies {
  associations: CanonicalSilRuntimeAssociationRepository;
  sil: CanonicalSilReadDependencies;
}

const fail = (code: string): never => { throw new Error(code); };

function identities(value: CanonicalSilRuntimeAssociation): CanonicalSilReadIdentitySet {
  return {
    candidateSourceBundleId: value.candidateSourceBundleId,
    verifiedCapabilitySnapshotId: value.verifiedCapabilitySnapshotId,
    organizationRelationId: value.organizationRelationId,
    roleRelationId: value.roleRelationId,
    tensionStateId: value.tensionStateId,
    evolutionInputStateId: value.evolutionInputStateId,
  };
}

/**
 * Product-facing Stage-B service. Startup supplies concrete registered
 * repositories; this boundary has no database discovery or selection logic.
 */
export function createCanonicalSilStageBProductService(
  policies: CanonicalSilStageBPolicyConfiguration,
  dependencies: CanonicalSilStageBProductDependencies,
): CanonicalSilStageBProductService {
  if (!policies.tensionClassificationPolicyVersion || !policies.evolutionInputDerivationPolicyVersion) {
    fail("ERR_CANONICAL_SIL_STAGE_B_POLICY_CONFIGURATION_INVALID");
  }
  return {
    async execute(input) {
      if (input.tensionClassificationPolicyVersion !== policies.tensionClassificationPolicyVersion || input.evolutionInputDerivationPolicyVersion !== policies.evolutionInputDerivationPolicyVersion) {
        fail("ERR_CANONICAL_SIL_STAGE_B_POLICY_CONFIGURATION_MISMATCH");
      }
      return executeCanonicalSilStageB(input, dependencies);
    },
    async read(associationId) {
      const association = (await dependencies.associations.getById(associationId)) ?? fail("ERR_CANONICAL_SIL_RUNTIME_ASSOCIATION_NOT_FOUND");
      const exact = identities(association);
      const model = await readCanonicalSilReadModel(exact, dependencies.sil);
      return { association, identities: exact, model };
    },
  };
}

/**
 * Production registration binds the exact repositories to one physical client.
 * The legacy target/relation adapters use Drizzle's unparameterized client
 * type, so this creates that client from the same `$client`; it neither opens a
 * different connection nor changes data/authority semantics.
 */
export function createProductionCanonicalSilStageBProductService(
  policies: CanonicalSilStageBPolicyConfiguration,
): CanonicalSilStageBProductService {
  const adapterDatabase = drizzle(db.$client);
  const sourceBundles = new PostgresCandidateSourceBundleRepository(db);
  const capabilities = new PostgresCapabilityCoreRepository(db);
  const organizations = new PostgresTargetOrganizationRevisionRepository(adapterDatabase);
  const sources = new PostgresTargetSourceRevisionRepository(adapterDatabase);
  const sourceBindings = new PostgresTargetRoleSourceBindingRevisionRepository(adapterDatabase, {
    getTargetSourceRevisionById: sources.getRevisionById.bind(sources),
  });
  const bindings = new PostgresTargetRoleOrganizationBindingRevisionRepository(adapterDatabase, {
    getTargetRoleSourceBindingRevisionById: sourceBindings.getRevisionById.bind(sourceBindings),
    getTargetOrganizationRevisionById: organizations.getRevisionById.bind(organizations),
  });
  const profiles = new PostgresTargetRoleProfileRevisionRepository(adapterDatabase, {
    getTargetRoleOrganizationBindingRevisionById: bindings.getRevisionById.bind(bindings),
    getTargetOrganizationRevisionById: organizations.getRevisionById.bind(organizations),
  });
  const roles = new PostgresRoleRelationRepository(adapterDatabase);
  const organizationRelations = new PostgresOrganizationRelationRepository(db, { organizations, roles, profiles, bindings });
  const tensions = new PostgresTensionStateRepository(adapterDatabase);
  const evolutions = new PostgresEvolutionInputStateRepository(adapterDatabase, tensions);
  const associations = new PostgresCanonicalSilRuntimeAssociationRepository(adapterDatabase);
  return createCanonicalSilStageBProductService(policies, {
    sourceBundles,
    capabilities,
    organizations,
    roles,
    profiles,
    bindings,
    organizationRelations,
    tensions,
    tensionPolicies: { resolveTensionClassificationPolicy: version => version === policies.tensionClassificationPolicyVersion ? { version } : null },
    evolutions,
    evolutionPolicies: { resolveEvolutionInputDerivationPolicy: version => version === policies.evolutionInputDerivationPolicyVersion ? { version } : null },
    associations,
    sil: { sourceBundles, capabilities, organizations: organizationRelations, roles, tensions, evolutions },
  });
}
