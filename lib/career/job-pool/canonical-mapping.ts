import { createHash } from "node:crypto";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { CompanyPoolData, PoolRole } from "../matching/pool";
import { createTargetOrganizationRevision } from "../target/organization";
import { createTargetRoleOrganizationBindingRevision, createTargetRoleSourceBindingRevision } from "../target/role";
import { reconstructTargetRoleProfiles } from "../target/role/reconstruction";
import { reconstructTargetRequirementsDurably } from "../target/role/requirement/producer";
import type { TargetRequirementRevision } from "../target/role/requirement/types";
import { createTargetSourceRevision } from "../target/source";
import { PostgresTargetOrganizationRevisionRepository } from "../target-adapters/organization-revision-persistence";
import { PostgresTargetRoleOrganizationBindingRevisionRepository } from "../target-adapters/role-organization-binding-revision-persistence";
import { PostgresTargetRoleProfileRevisionRepository } from "../target-adapters/role-profile-revision-persistence";
import { PostgresTargetRoleReconstructionArtifactRepository } from "../target-adapters/role-reconstruction-artifact-persistence";
import { PostgresTargetRequirementArtifactRepository } from "../target-adapters/role-requirement-artifact-persistence";
import { PostgresTargetRequirementRevisionRepository } from "../target-adapters/role-requirement-revision-persistence";
import { PostgresTargetRoleSourceBindingRevisionRepository } from "../target-adapters/role-source-binding-revision-persistence";
import { PostgresTargetSourceRevisionRepository } from "../target-adapters/source-revision-persistence";
import {
  createJobPoolRequirementProvider, createJobPoolRoleProfileProvider, JOB_POOL_PROVIDER, JOB_POOL_REQUIREMENT_PRODUCER, JOB_POOL_ROLE_PRODUCER
} from "./provider";
import { JOB_POOL_SOURCE_KIND, JOB_POOL_SOURCE_NORMALIZATION_VERSION, normalizeValue, renderPoolSourceContent, requirementLine, requirementsOfRole } from "./source-content";
import type { JobPoolCanonicalMapping, JobPoolCanonicalRequirementMapping } from "./types";

export const JOB_POOL_ADMISSION_POLICY_VERSION = "JOB_POOL_UPLOAD_SCOPED_ENTITY_V1";

const sha256 = (value: string) => createHash("sha256").update(value, "utf8").digest("hex");
/** Upload-scoped opaque identity from declared ids only (never from text, provider output or matching). */
export const uploadScopedEntityId = (prefix: string, jobPoolUploadId: string, poolItemId: string) =>
  `${prefix}_${sha256(JSON.stringify([jobPoolUploadId, poolItemId])).slice(0, 32).toUpperCase()}`;

export interface JobPoolCanonicalMappingInput {
  jobPoolUploadId: string;
  pool: CompanyPoolData;
  canonicalSha256: string;
  uploadedByActorRef: string;
  /** The upload's own timestamp; every revision carries it so a retry is byte-identical. */
  createdAt: string;
}

/** The repositories of the canonical target field, bound to one database handle. */
export function createTargetRepositories(database: PostgresJsDatabase) {
  const source = new PostgresTargetSourceRevisionRepository(database);
  const organization = new PostgresTargetOrganizationRevisionRepository(database);
  const roleSource = new PostgresTargetRoleSourceBindingRevisionRepository(database, { getTargetSourceRevisionById: source.getRevisionById.bind(source) });
  const binding = new PostgresTargetRoleOrganizationBindingRevisionRepository(database, {
    getTargetRoleSourceBindingRevisionById: roleSource.getRevisionById.bind(roleSource),
    getTargetOrganizationRevisionById: organization.getRevisionById.bind(organization)
  });
  const profile = new PostgresTargetRoleProfileRevisionRepository(database, {
    getTargetRoleOrganizationBindingRevisionById: binding.getRevisionById.bind(binding),
    getTargetOrganizationRevisionById: organization.getRevisionById.bind(organization)
  });
  const requirement = new PostgresTargetRequirementRevisionRepository(database, {
    getTargetRoleProfileRevisionById: profile.getRevisionById.bind(profile),
    getTargetRoleOrganizationBindingRevisionById: binding.getRevisionById.bind(binding),
    getTargetOrganizationRevisionById: organization.getRevisionById.bind(organization)
  });
  return {
    source, organization, roleSource, binding, profile, requirement,
    roleArtifacts: new PostgresTargetRoleReconstructionArtifactRepository(database),
    requirementArtifacts: new PostgresTargetRequirementArtifactRepository(database)
  };
}

const necessityOf = (revision: TargetRequirementRevision): JobPoolCanonicalRequirementMapping["necessityState"] => {
  const kind = revision.requirement.necessityState.kind;
  return kind === "REQUIRED" || kind === "PREFERRED" || kind === "OPTIONAL" ? kind : "UNKNOWN";
};

/**
 * Maps one validated pool onto canonical target revisions through the existing governed producers.
 * Every revision stays PROPOSAL_ONLY with authority NONE. No Capability-Requirement relation is evaluated.
 */
export async function mapJobPoolToCanonicalTargets(input: JobPoolCanonicalMappingInput, database: PostgresJsDatabase): Promise<JobPoolCanonicalMapping> {
  const { jobPoolUploadId, pool, createdAt } = input;
  const repos = createTargetRepositories(database);
  const normalizedContent = renderPoolSourceContent(pool);

  const sourceRevision = await repos.source.createTargetSourceRevisionPersister().persist(createTargetSourceRevision({
    targetSourceEntityId: uploadScopedEntityId("TSRCENT", jobPoolUploadId, "POOL_SOURCE"),
    previousRevisionId: null,
    sourceKind: JOB_POOL_SOURCE_KIND,
    sourceLocator: `jobpool://${jobPoolUploadId}`,
    rawContentHash: input.canonicalSha256,
    normalizedContentHash: sha256(normalizedContent),
    normalizedContent,
    normalizationVersion: JOB_POOL_SOURCE_NORMALIZATION_VERSION,
    schemaVersion: "TARGET_SOURCE_REVISION_V1",
    createdAt
  }));

  const organizations: JobPoolCanonicalMapping["organizations"] = [];
  const organizationRevisionByPoolId = new Map<string, string>();
  for (const organization of pool.organizations) {
    const revision = await repos.organization.createTargetOrganizationRevisionPersister().persist(createTargetOrganizationRevision({
      targetOrganizationEntityId: uploadScopedEntityId("TORGENT", jobPoolUploadId, organization.id),
      previousRevisionId: null,
      organizationDescriptor: normalizeValue(organization.name),
      descriptorKind: "DECLARED_NAME",
      schemaVersion: "TARGET_ORGANIZATION_REVISION_V1",
      createdAt
    }));
    organizationRevisionByPoolId.set(organization.id, revision.targetOrganizationRevisionId);
    organizations.push({ poolOrganizationId: organization.id, name: organization.name, targetOrganizationEntityId: revision.targetOrganizationEntityId, targetOrganizationRevisionId: revision.targetOrganizationRevisionId });
  }

  const roleByBinding = new Map<string, PoolRole>();
  const roleIdentity = new Map<string, { targetRoleEntityId: string; targetRoleSourceBindingRevisionId: string; targetRoleOrganizationBindingRevisionId: string }>();
  for (const role of pool.roles) {
    const targetRoleEntityId = uploadScopedEntityId("TROLEENT", jobPoolUploadId, role.id);
    const roleSource = await repos.roleSource.createTargetRoleSourceBindingRevisionPersister().persist(createTargetRoleSourceBindingRevision({
      targetRoleEntityId,
      targetSourceRevisionId: sourceRevision.targetSourceRevisionId,
      previousRevisionId: null,
      schemaVersion: "TARGET_ROLE_SOURCE_BINDING_REVISION_V1",
      createdAt
    }));
    const binding = await repos.binding.createTargetRoleOrganizationBindingRevisionPersister().persist(createTargetRoleOrganizationBindingRevision({
      targetRoleEntityId,
      targetRoleSourceBindingRevisionId: roleSource.targetRoleSourceBindingRevisionId,
      targetOrganizationRevisionId: organizationRevisionByPoolId.get(role.organization_id)!,
      previousRevisionId: null,
      schemaVersion: "TARGET_ROLE_ORGANIZATION_BINDING_REVISION_V1",
      createdAt
    }));
    roleByBinding.set(binding.targetRoleOrganizationBindingRevisionId, role);
    roleIdentity.set(role.id, {
      targetRoleEntityId,
      targetRoleSourceBindingRevisionId: roleSource.targetRoleSourceBindingRevisionId,
      targetRoleOrganizationBindingRevisionId: binding.targetRoleOrganizationBindingRevisionId
    });
  }

  const roles: JobPoolCanonicalMapping["roles"] = [];
  if (pool.roles.length === 0) {
    return { mappingState: "MAPPED", proposalState: "PROPOSAL_ONLY", authorityState: "NONE", provider: JOB_POOL_PROVIDER, organizations, roles };
  }

  const profileRun = await reconstructTargetRoleProfiles([...roleByBinding.keys()], {
    getTargetRoleOrganizationBindingRevisionById: repos.binding.getRevisionById.bind(repos.binding),
    getTargetRoleSourceBindingRevisionById: repos.roleSource.getRevisionById.bind(repos.roleSource),
    getTargetSourceRevisionById: repos.source.getRevisionById.bind(repos.source),
    getTargetOrganizationRevisionById: repos.organization.getRevisionById.bind(repos.organization),
    provider: createJobPoolRoleProfileProvider(pool, roleByBinding),
    producer: JOB_POOL_ROLE_PRODUCER,
    artifactPersistence: repos.roleArtifacts,
    profilePersister: repos.profile.createTargetRoleProfileRevisionPersister(),
    now: () => createdAt
  });

  const roleByProfile = new Map<string, PoolRole>();
  const profileByRole = new Map<string, string>();
  for (const profile of profileRun.profiles) {
    const role = roleByBinding.get(profile.targetRoleOrganizationBindingRevisionId);
    if (!role) throw new Error("ERR_JOB_POOL_CANONICAL_MAPPING_PROFILE_UNBOUND");
    roleByProfile.set(profile.targetRoleProfileRevisionId, role);
    profileByRole.set(role.id, profile.targetRoleProfileRevisionId);
  }

  const requirementIdByLine = new Map(pool.requirements.map(requirement => [requirementLine(requirement), requirement.id]));
  const poolRequirementIdOf = (evidence: Array<{ exactQuote: string }>): string => {
    const ids = evidence.map(claim => requirementIdByLine.get(claim.exactQuote)).filter((id): id is string => id !== undefined);
    if (ids.length !== 1) throw new Error("ERR_JOB_POOL_CANONICAL_MAPPING_REQUIREMENT_UNBOUND");
    return ids[0];
  };

  const requirementRun = await reconstructTargetRequirementsDurably([...roleByProfile.keys()], {
    getProfile: repos.profile.getRevisionById.bind(repos.profile),
    getBinding: repos.binding.getRevisionById.bind(repos.binding),
    getRoleSourceBinding: repos.roleSource.getRevisionById.bind(repos.roleSource),
    getSource: repos.source.getRevisionById.bind(repos.source),
    getOrganization: repos.organization.getRevisionById.bind(repos.organization),
    provider: createJobPoolRequirementProvider(pool, roleByProfile),
    lineage: JOB_POOL_REQUIREMENT_PRODUCER,
    artifacts: repos.requirementArtifacts,
    persistRevision: revision => repos.requirement.createTargetRequirementRevisionPersister().persist(revision),
    admissionFor: async result => {
      if (result.resultState !== "REQUIREMENT_PROPOSAL_ELIGIBLE" || result.proposal === null) throw new Error("ERR_JOB_POOL_CANONICAL_MAPPING_RESULT_INVALID");
      return {
        admissionState: "NEW_ENTITY_ADMITTED",
        targetRequirementEntityId: uploadScopedEntityId("TRQENT", jobPoolUploadId, poolRequirementIdOf(result.proposal.evidence)),
        previousRevisionId: null,
        admissionPolicyVersion: JOB_POOL_ADMISSION_POLICY_VERSION,
        admittedByActorRef: input.uploadedByActorRef,
        createdAt
      };
    },
    now: () => createdAt
  });

  const revisionByPoolRequirement = new Map(requirementRun.revisions.map(revision => [poolRequirementIdOf(revision.evidence), revision]));
  const admissionByEntity = new Map(requirementRun.admissions.map(admission => [admission.targetRequirementEntityId, admission]));
  for (const role of pool.roles) {
    const identity = roleIdentity.get(role.id)!;
    const requirements = requirementsOfRole(pool, role).map(requirement => {
      const revision = revisionByPoolRequirement.get(requirement.id);
      const admission = revision ? admissionByEntity.get(revision.targetRequirementEntityId) : undefined;
      if (!revision || !admission) throw new Error("ERR_JOB_POOL_CANONICAL_MAPPING_REQUIREMENT_MISSING");
      return {
        poolRequirementId: requirement.id,
        capabilityName: requirement.capability_name,
        targetRequirementEntityId: revision.targetRequirementEntityId,
        targetRequirementRevisionId: revision.targetRequirementRevisionId,
        targetRequirementReconstructionResultId: admission.targetRequirementReconstructionResultId,
        targetRequirementEntityAdmissionId: admission.targetRequirementEntityAdmissionId,
        matchingEligibility: revision.matchingEligibility,
        necessityState: necessityOf(revision)
      };
    });
    roles.push({
      poolRoleId: role.id,
      title: role.title,
      poolOrganizationId: role.organization_id,
      targetSourceRevisionId: sourceRevision.targetSourceRevisionId,
      ...identity,
      targetRoleProfileRevisionId: profileByRole.get(role.id)!,
      targetRoleReconstructionBatchRunId: profileRun.batchRun.targetRoleReconstructionBatchRunId,
      targetRequirementReconstructionBatchRunId: requirementRun.batch.targetRequirementReconstructionBatchRunId,
      requirements
    });
  }
  return { mappingState: "MAPPED", proposalState: "PROPOSAL_ONLY", authorityState: "NONE", provider: JOB_POOL_PROVIDER, organizations, roles };
}
