import { getTableConfig } from "drizzle-orm/pg-core";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { Sql } from "postgres";
import { PostgresCapabilityCoreRepository, deriveCandidateCapabilityOperand } from "../../../lib/career/capability-core";
import * as verification from "../../../lib/career/capability-core/verification";
import { careerCapabilityRuns } from "../../../lib/career/db/schema";
import { initT11ProductionPersistenceSchema } from "../../../lib/career/db/t11-persistence-schema";
import { PostgresCapabilityRequirementRelationRepository } from "../../../lib/career/relation-adapters/capability-requirement-persistence";
import { PostgresEvolutionInputStateRepository } from "../../../lib/career/relation-adapters/evolution-input-persistence";
import { PostgresRecommendationPolicyRevisionRepository, PostgresRecommendationProposalRepository } from "../../../lib/career/relation-adapters/recommendation-proposal-persistence";
import { productionRecommendationPolicyImplementationRegistry } from "../../../lib/career/relation-adapters/recommendation-proposal-persistence/implementation-registry";
import { PostgresRequirementInventoryRepository } from "../../../lib/career/relation-adapters/requirement-inventory-persistence";
import { PostgresRoleRelationRepository } from "../../../lib/career/relation-adapters/role-relation-persistence";
import { PostgresTensionStateRepository } from "../../../lib/career/relation-adapters/tension-state-persistence";
import { produceAndPersistEvolutionInputState } from "../../../lib/career/relation/evolution-input";
import { produceAndPersistRecommendationProposal } from "../../../lib/career/relation/recommendation-proposal";
import { buildTargetRoleRequirementInventory, discoverRequirementRelationAggregate } from "../../../lib/career/relation/requirement-inventory";
import { produceRoleRelation } from "../../../lib/career/relation/role-relation";
import { produceAndPersistTensionState } from "../../../lib/career/relation/tension-state";
import { PostgresTargetOrganizationRevisionRepository } from "../../../lib/career/target-adapters/organization-revision-persistence";
import { PostgresTargetRoleOrganizationBindingRevisionRepository } from "../../../lib/career/target-adapters/role-organization-binding-revision-persistence";
import { PostgresTargetRoleProfileRevisionRepository } from "../../../lib/career/target-adapters/role-profile-revision-persistence";
import { PostgresTargetRequirementRevisionRepository } from "../../../lib/career/target-adapters/role-requirement-revision-persistence";
import { PostgresTargetRoleSourceBindingRevisionRepository } from "../../../lib/career/target-adapters/role-source-binding-revision-persistence";
import { PostgresTargetSourceRevisionRepository } from "../../../lib/career/target-adapters/source-revision-persistence";
import { createTargetOrganizationRevision } from "../../../lib/career/target/organization";
import { createTargetRequirementRevision, createTargetRoleOrganizationBindingRevision, createTargetRoleProfileRevision, createTargetRoleSourceBindingRevision } from "../../../lib/career/target/role";
import { createTargetSourceRevision } from "../../../lib/career/target/source";
import { createThreeCapabilityPhase4Input } from "../../career/capability-core/relation-operand/phase4-fixture";
import { recommendationPolicyFixture } from "./career-canonical-local-fixture";

const stamp = "2026-10-09T00:00:00.000Z";
const protocol = { relationProducerVersion: "relation-v1", requirementAdmissionPolicyVersion: "admission-v1", semanticPolicyVersion: "semantic-v1", levelPolicyVersion: "level-v1", scopePolicyVersion: "scope-v1", evidencePolicyVersion: "evidence-v1" };
type CapabilityDatabase = NonNullable<ConstructorParameters<typeof PostgresCapabilityCoreRepository>[0]>;

/** The G3 T11 registration order plus the capability run lineage table the Phase 4 publisher writes. */
export async function provisionCareerChainSchema(sql: Sql): Promise<void> {
  await initT11ProductionPersistenceSchema(sql);
  const config = getTableConfig(careerCapabilityRuns);
  await sql.unsafe(`CREATE TABLE IF NOT EXISTS "${config.name}" (${config.columns.map((column) => `"${column.name}" ${column.getSQLType()}${column.notNull ? " NOT NULL" : ""}${column.primary ? " PRIMARY KEY" : ""}`).join(", ")})`);
}

export function careerChainRepositories(db: PostgresJsDatabase) {
  const source = new PostgresTargetSourceRevisionRepository(db);
  const organization = new PostgresTargetOrganizationRevisionRepository(db);
  const roleSource = new PostgresTargetRoleSourceBindingRevisionRepository(db, { getTargetSourceRevisionById: source.getRevisionById.bind(source) });
  const binding = new PostgresTargetRoleOrganizationBindingRevisionRepository(db, { getTargetRoleSourceBindingRevisionById: roleSource.getRevisionById.bind(roleSource), getTargetOrganizationRevisionById: organization.getRevisionById.bind(organization) });
  const profile = new PostgresTargetRoleProfileRevisionRepository(db, { getTargetRoleOrganizationBindingRevisionById: binding.getRevisionById.bind(binding), getTargetOrganizationRevisionById: organization.getRevisionById.bind(organization) });
  const requirement = new PostgresTargetRequirementRevisionRepository(db, { getTargetRoleProfileRevisionById: profile.getRevisionById.bind(profile), getTargetRoleOrganizationBindingRevisionById: binding.getRevisionById.bind(binding), getTargetOrganizationRevisionById: organization.getRevisionById.bind(organization) });
  const capability = new PostgresCapabilityCoreRepository(db as unknown as CapabilityDatabase);
  const relations = new PostgresCapabilityRequirementRelationRepository(db);
  const inventories = new PostgresRequirementInventoryRepository(db);
  const roleRelations = new PostgresRoleRelationRepository(db);
  const tensionStates = new PostgresTensionStateRepository(db);
  const evolutionInputs = new PostgresEvolutionInputStateRepository(db, tensionStates);
  const policies = new PostgresRecommendationPolicyRevisionRepository(db);
  const proposals = new PostgresRecommendationProposalRepository(db, evolutionInputs, policies, productionRecommendationPolicyImplementationRegistry);
  return { source, organization, roleSource, binding, profile, requirement, capability, relations, inventories, roleRelations, tensionStates, evolutionInputs, policies, proposals };
}

/**
 * Seeds SNAP_, TOREV, TRPREV, TRQREV, TRQINV, RRA, RRL, TSN, EIS, RPR and RCP through the
 * G3 repositories and producers only. No provider is called: every pair stays NOT_EVALUATED,
 * which the pinned policies derive into PROPOSED semantic-uncertainty items.
 * `sentinel` is placed in Capability Core source documents and in target requirement entity ids,
 * so it occurs in G3 payloads only.
 */
export async function seedCareerCanonicalChain(db: PostgresJsDatabase, sentinel: string) {
  const r = careerChainRepositories(db);
  const phase4 = createThreeCapabilityPhase4Input(sentinel);
  verification.assertPersistableCapabilityVerificationRun(phase4.verificationRun);
  await r.capability.saveRun(phase4.discoveryRun);
  await r.capability.saveConvergenceRun(phase4.convergenceRun);
  await r.capability.saveVerificationRun(phase4.verificationRun);
  const snapshot = await r.capability.createVerifiedCapabilitySnapshotPublisher().publish(phase4);

  const source = createTargetSourceRevision({ targetSourceEntityId: `SOURCE_${sentinel}`, previousRevisionId: null, sourceKind: "DOCUMENT", sourceLocator: `source://${sentinel}`, rawContentHash: "a".repeat(64), normalizedContentHash: "b".repeat(64), normalizedContent: "TypeScript PostgreSQL", normalizationVersion: "v1", schemaVersion: "TARGET_SOURCE_REVISION_V1", createdAt: stamp });
  const organization = createTargetOrganizationRevision({ targetOrganizationEntityId: `ORG_${sentinel}`, previousRevisionId: null, organizationDescriptor: "Org", descriptorKind: "DECLARED_NAME", schemaVersion: "TARGET_ORGANIZATION_REVISION_V1", createdAt: stamp });
  await r.source.createTargetSourceRevisionPersister().persist(source);
  await r.organization.createTargetOrganizationRevisionPersister().persist(organization);
  const roleSource = createTargetRoleSourceBindingRevision({ targetRoleEntityId: `ROLE_${sentinel}`, targetSourceRevisionId: source.targetSourceRevisionId, previousRevisionId: null, schemaVersion: "TARGET_ROLE_SOURCE_BINDING_REVISION_V1", createdAt: stamp });
  await r.roleSource.createTargetRoleSourceBindingRevisionPersister().persist(roleSource);
  const binding = createTargetRoleOrganizationBindingRevision({ targetRoleEntityId: `ROLE_${sentinel}`, targetRoleSourceBindingRevisionId: roleSource.targetRoleSourceBindingRevisionId, targetOrganizationRevisionId: organization.targetOrganizationRevisionId, previousRevisionId: null, schemaVersion: "TARGET_ROLE_ORGANIZATION_BINDING_REVISION_V1", createdAt: stamp });
  await r.binding.createTargetRoleOrganizationBindingRevisionPersister().persist(binding);
  const profile = createTargetRoleProfileRevision({ targetRoleEntityId: `ROLE_${sentinel}`, targetRoleOrganizationBindingRevisionId: binding.targetRoleOrganizationBindingRevisionId, previousRevisionId: null, profile: { roleDescriptor: null, roleSemanticDefinition: "Platform role", responsibilityScope: null, seniorityInterpretation: null, domainContext: null }, proposalState: "PROPOSAL_ONLY", sourceEvidenceState: "SOURCE_MATCH_VERIFIED", semanticValidationState: "NOT_RUN", authorityState: "NONE", schemaVersion: "TARGET_ROLE_PROFILE_REVISION_V1", createdAt: stamp });
  await r.profile.createTargetRoleProfileRevisionPersister().persist(profile);
  const requirement = (entity: string, statement: string, necessity: "REQUIRED" | "OPTIONAL") => createTargetRequirementRevision({ targetRequirementEntityId: entity, targetRoleProfileRevisionId: profile.targetRoleProfileRevisionId, previousRevisionId: null, requirement: { normalizedStatement: statement, requirementType: "CAPABILITY", capabilityExpression: statement, structuralDefinition: `${statement} capability`, requiredLevelState: { kind: "NOT_APPLICABLE" }, necessityState: { kind: necessity }, scopeContextState: { kind: "NOT_APPLICABLE" } }, evidence: [{ exactQuote: statement }], sourceEvidenceState: "SOURCE_MATCH_VERIFIED", classificationValidationState: "VALIDATED", semanticInterpretationState: "VALIDATED", requiredLevelValidationState: "NOT_APPLICABLE", necessityValidationState: "SUPPORTED", scopeValidationState: "NOT_APPLICABLE", matchingEligibility: "MATCHING_ELIGIBLE_PROPOSAL_ONLY", proposalState: "PROPOSAL_ONLY", authorityState: "NONE", schemaVersion: "TARGET_REQUIREMENT_REVISION_V1", createdAt: stamp });
  const requirementA = requirement(`REQ_${sentinel}_A`, "TypeScript", "REQUIRED");
  const requirementB = requirement(`REQ_${sentinel}_B`, "PostgreSQL", "OPTIONAL");
  for (const item of [requirementA, requirementB]) await r.requirement.createTargetRequirementRevisionPersister().persist(item);

  const operands = await Promise.all(snapshot.capabilities.map((capability) => deriveCandidateCapabilityOperand({ verifiedCapabilitySnapshotId: snapshot.snapshotId, capabilityId: capability.capabilityId }, r.capability)));
  const inventory = await buildTargetRoleRequirementInventory({ targetRoleProfileRevisionId: profile.targetRoleProfileRevisionId, requirementInventoryPolicyVersion: "inventory-v1", createdAt: stamp }, { listTargetRequirementRevisionsByTargetRoleProfileRevisionId: r.requirement.listTargetRequirementRevisionsByTargetRoleProfileRevisionId.bind(r.requirement) });
  await r.inventories.persistInventory(inventory);
  const aggregates = [];
  for (const item of [requirementA, requirementB]) {
    const aggregate = await discoverRequirementRelationAggregate({ inventory, verifiedCapabilitySnapshotId: snapshot.snapshotId, targetRequirementEntityId: item.targetRequirementEntityId, targetRequirementRevisionId: item.targetRequirementRevisionId, candidateCapabilityOperandIds: operands.map((operand) => operand.candidateCapabilityOperandId), t6bProtocol: protocol, pairInventoryPolicyVersion: "pair-v1", compositionPolicyVersion: "composition-v1", createdAt: stamp }, r.relations);
    aggregates.push(await r.inventories.persistAggregate(aggregate));
  }
  const roleRelation = await r.roleRelations.persistRoleRelation(await produceRoleRelation({ verifiedCapabilitySnapshotId: snapshot.snapshotId, targetRoleProfileRevision: profile, inventory, createdAt: stamp, lineage: { roleRequirementCoveragePolicyVersion: "coverage-v1", roleDimensionInventoryPolicyVersion: "dimension-v1", roleNecessityPolicyVersion: "necessity-v1", roleCompositionPolicyVersion: "composition-v1" } }, { aggregates: r.inventories, candidateRepository: r.capability }));
  const tensionState = await produceAndPersistTensionState({ roleRelationId: roleRelation.roleRelationId, classificationPolicyVersion: "tension-v1", createdAt: stamp }, { roles: r.roleRelations, policies: { resolveTensionClassificationPolicy: (version) => version === "tension-v1" ? { version } : null }, tensionStates: r.tensionStates });
  const evolutionInputState = await produceAndPersistEvolutionInputState({ tensionStateId: tensionState.tensionStateId, derivationPolicyVersion: "evolution-v1", createdAt: stamp }, { tensionStates: r.tensionStates, policies: { resolveEvolutionInputDerivationPolicy: (version) => version === "evolution-v1" ? { version } : null }, evolutionInputs: r.evolutionInputs });
  const policy = await r.policies.persistRecommendationPolicyRevision(recommendationPolicyFixture());
  const recommendationProposal = await produceAndPersistRecommendationProposal({ evolutionInputStateId: evolutionInputState.evolutionInputStateId, recommendationPolicyRevisionId: policy.recommendationPolicyRevisionId, createdAt: stamp }, { evolutionInputs: r.evolutionInputs, policies: r.policies, implementations: productionRecommendationPolicyImplementationRegistry, proposals: r.proposals });

  return { repositories: r, snapshot, organization, binding, profile, requirementA, requirementB, inventory, aggregates, roleRelation, tensionState, evolutionInputState, policy, recommendationProposal };
}

export type SeededCareerCanonicalChain = Awaited<ReturnType<typeof seedCareerCanonicalChain>>;
