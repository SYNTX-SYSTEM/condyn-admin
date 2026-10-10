import { requireTestDatabaseUrl, DISPOSABLE_TEST_DATABASE_PATTERN } from "../../../../lib/database-isolation/policy";
import { createDisposableTestDatabaseNamed, dropDisposableTestDatabase, newDisposableTestDatabaseName } from "../../../../lib/database-isolation/verification";
/**
 * Isolated PostgreSQL world for the HR Decision Loop frontend proofs.
 *
 * Every artifact is constructed with the sealed `create*` / `produce*`
 * functions of its field and persisted through its own repository. Raw SQL is
 * used only for database creation, table provisioning (startup DDL and the
 * drizzle-declared post-decision tables) and nothing else. The shared `condyn`
 * database is never touched: each world creates and drops its own database.
 *
 * The seed proves nothing about production: it exists so that the production
 * composition roots (`createLocalHrDecisionLoopHttpApplication`,
 * `createLocalDecisionContextHttpApplication`) can be exercised over a real
 * server against coherent exact lineage.
 */
import { randomBytes } from "node:crypto";
import { getTableConfig } from "drizzle-orm/pg-core";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";
import { PostgresCapabilityCoreRepository, deriveCandidateCapabilityOperand } from "../../../../lib/career/capability-core";
import { PostgresRequirementInventoryRepository } from "../../../../lib/career/relation-adapters/requirement-inventory-persistence";
import { PostgresCapabilityRequirementRelationRepository } from "../../../../lib/career/relation-adapters/capability-requirement-persistence";
import { PostgresTargetOrganizationRevisionRepository } from "../../../../lib/career/target-adapters/organization-revision-persistence";
import { PostgresTargetRoleOrganizationBindingRevisionRepository } from "../../../../lib/career/target-adapters/role-organization-binding-revision-persistence";
import { PostgresTargetRoleProfileRevisionRepository } from "../../../../lib/career/target-adapters/role-profile-revision-persistence";
import { PostgresTargetRequirementRevisionRepository } from "../../../../lib/career/target-adapters/role-requirement-revision-persistence";
import { PostgresTargetRoleSourceBindingRevisionRepository } from "../../../../lib/career/target-adapters/role-source-binding-revision-persistence";
import { PostgresTargetSourceRevisionRepository } from "../../../../lib/career/target-adapters/source-revision-persistence";
import { buildRequirementRelationAggregate, buildTargetRoleRequirementInventory } from "../../../../lib/career/relation/requirement-inventory";
import { produceRoleRelation } from "../../../../lib/career/relation/role-relation";
import { PostgresRoleRelationRepository } from "../../../../lib/career/relation-adapters/role-relation-persistence";
import { produceAndPersistTensionState } from "../../../../lib/career/relation/tension-state";
import { PostgresTensionStateRepository } from "../../../../lib/career/relation-adapters/tension-state-persistence";
import { produceAndPersistEvolutionInputState } from "../../../../lib/career/relation/evolution-input";
import { PostgresEvolutionInputStateRepository } from "../../../../lib/career/relation-adapters/evolution-input-persistence";
import { deriveRecommendationPolicyRevisionId, produceAndPersistRecommendationProposal } from "../../../../lib/career/relation/recommendation-proposal";
import {
  PostgresRecommendationPolicyRevisionRepository,
  PostgresRecommendationProposalRepository,
  productionRecommendationPolicyImplementationRegistry
} from "../../../../lib/career/relation-adapters/recommendation-proposal-persistence";
import { createTargetOrganizationRevision } from "../../../../lib/career/target/organization";
import { createTargetRoleOrganizationBindingRevision, createTargetRoleProfileRevision, createTargetRoleSourceBindingRevision } from "../../../../lib/career/target/role";
import { createTargetRequirementRevision } from "../../../../lib/career/target/role/requirement";
import { createTargetSourceRevision } from "../../../../lib/career/target/source";
import { createDecisionAuthorityGrantRevision } from "../../../../lib/career/relation/decision-authority";
import { createCareerDecisionContextRevision } from "../../../../lib/career/relation/decision-context";
import { produceAndPersistHumanDecisionRecord } from "../../../../lib/career/relation/decision-record";
import { createProductionHumanDecisionRecordDependencies } from "../../../../lib/career/human-decision-admission/application";
import { createCareerDecisionActionIntent } from "../../../../lib/career/relation/action-intent";
import { createCareerHumanCommitment } from "../../../../lib/career/relation/human-commitment";
import { createCareerExecutionAuthorityGrantRevision } from "../../../../lib/career/relation/execution-authority-grant";
import { createCareerExecutionContextRevision } from "../../../../lib/career/relation/execution-context-revision";
import { createCareerActionOccurrence } from "../../../../lib/career/relation/action-occurrence";
import { createCareerStateChangeDeclaration } from "../../../../lib/career/relation/state-change-declaration";
import { createCareerActionStateChangeAssociationDeclaration } from "../../../../lib/career/relation/action-state-change-association-declaration";
import { createCareerOutcomeRoleDeclaration } from "../../../../lib/career/relation/outcome-role-declaration";
import { createCareerOutcomeValenceDeclaration } from "../../../../lib/career/relation/outcome-valence-declaration";
import { createCareerOutcomeValenceFeedbackAdmissionDeclaration } from "../../../../lib/career/relation/outcome-valence-feedback-admission-declaration";
import { createCareerOutcomeValenceFeedbackTargetDeclaration } from "../../../../lib/career/relation/outcome-valence-feedback-target-declaration";
import { createBoundCareerOutcomeValenceFeedbackTargetRevisionBinder } from "../../../../lib/career/relation/outcome-valence-feedback-target-revision-binding";
import { createCareerOutcomeValenceFeedbackReturnRepresentation } from "../../../../lib/career/relation/outcome-valence-feedback-return-representation";
import { createCareerOutcomeValenceFeedbackReturnItem } from "../../../../lib/career/relation/outcome-valence-feedback-return-item";
import { createCareerOutcomeValenceFeedbackContextContent } from "../../../../lib/career/relation/outcome-valence-feedback-context-content";
import { createCareerOutcomeValenceFeedbackContextTransition } from "../../../../lib/career/relation/outcome-valence-feedback-context-transition";
import { createCareerOutcomeValenceFeedbackContextRevision } from "../../../../lib/career/relation/outcome-valence-feedback-context-revision";
import { createBoundCareerOutcomeValenceFeedbackContextRevisionPersister } from "../../../../lib/career/relation/outcome-valence-feedback-context-revision-persistence";
import { createPostgresHrDecisionLoopReadDependencies } from "../../../../lib/career/hr-decision-loop/server-read-service";
import { careerDecisionActionIntentEvidenceReferences, careerDecisionActionIntents, careerDecisionActionIntentSubjects } from "../../../../lib/career/relation-adapters/action-intent-persistence/postgres-schema";
import { careerHumanCommitmentEvidenceReferences, careerHumanCommitments, careerHumanCommitmentSubjects } from "../../../../lib/career/relation-adapters/human-commitment-persistence/postgres-schema";
import { careerExecutionAuthorityGrantChannelKinds, careerExecutionAuthorityGrantEvidenceReferences, careerExecutionAuthorityGrantRevisions, careerExecutionAuthorityGrantSubjects, careerExecutionAuthorityGrantTargetKinds } from "../../../../lib/career/relation-adapters/execution-authority-grant-persistence/postgres-schema";
import { careerExecutionContextEvidenceReferences, careerExecutionContextRevisions, careerExecutionContextSubjects } from "../../../../lib/career/relation-adapters/execution-context-revision-persistence/postgres-schema";
import { careerActionOccurrenceEvidenceReferences, careerActionOccurrences, careerActionOccurrenceSubjects } from "../../../../lib/career/relation-adapters/action-occurrence-persistence/postgres-schema";
import { careerStateChangeDeclarationEvidenceReferences, careerStateChangeDeclarations, careerStateChangeDeclarationSubjects } from "../../../../lib/career/relation-adapters/state-change-declaration-persistence/postgres-schema";
import { careerActionStateChangeAssociationDeclarationEvidenceReferences, careerActionStateChangeAssociationDeclarations, careerActionStateChangeAssociationDeclarationSubjects } from "../../../../lib/career/relation-adapters/action-state-change-association-declaration-persistence/postgres-schema";
import { careerOutcomeRoleDeclarationEvidenceReferences, careerOutcomeRoleDeclarations, careerOutcomeRoleDeclarationSubjects } from "../../../../lib/career/relation-adapters/outcome-role-declaration-persistence/postgres-schema";
import { careerOutcomeValenceDeclarationEvidenceReferences, careerOutcomeValenceDeclarations, careerOutcomeValenceDeclarationSubjects } from "../../../../lib/career/relation-adapters/outcome-valence-declaration-persistence/postgres-schema";
import { careerOutcomeValenceFeedbackAdmissionDeclarationEvidenceReferences, careerOutcomeValenceFeedbackAdmissionDeclarations, careerOutcomeValenceFeedbackAdmissionDeclarationSubjects } from "../../../../lib/career/relation-adapters/outcome-valence-feedback-admission-declaration-persistence/postgres-schema";
import { careerOutcomeValenceFeedbackTargetDeclarationEvidenceReferences, careerOutcomeValenceFeedbackTargetDeclarations, careerOutcomeValenceFeedbackTargetDeclarationSubjects } from "../../../../lib/career/relation-adapters/outcome-valence-feedback-target-declaration-persistence/postgres-schema";
import { careerOutcomeValenceFeedbackTargetRevisionBindings } from "../../../../lib/career/relation-adapters/outcome-valence-feedback-target-revision-binding-persistence/postgres-schema";
import { careerOutcomeValenceFeedbackContextRevisions } from "../../../../lib/career/relation-adapters/outcome-valence-feedback-context-revision-persistence/postgres-schema";
import { PostgresCareerOutcomeValenceFeedbackContextRevisionRepository } from "../../../../lib/career/relation-adapters/outcome-valence-feedback-context-revision-persistence";
import { assembleDecisionContextValidation, createDecisionContextDraft, createDecisionContextRevision, type AuthoritativeStateReference, type DecisionContextDraftInput, type DecisionContextRevision } from "../../../../lib/decision-core";
import { CAPABILITY_CORE_AUTHORITY_CONTRACT_ID, CAPABILITY_CORE_PRODUCER_ID } from "../../../../lib/decision-adapters/capability-core";
import { PostgresDecisionContextRevisionRepository } from "../../../../lib/decision-adapters/revision-persistence";
import { ensureDecisionRuntimePostgresSchema } from "../../../../lib/decision-runtime/composition";
import { computeSnapshotKey } from "../../../../lib/career/capability-core";
import { createPhase4Input } from "../../capability-core/relation-operand/phase4-fixture";
import { careerCapabilityRuns } from "../../../../lib/career/db/schema";
import { initT11ProductionPersistenceSchema } from "../../../../lib/career/db/t11-persistence-schema";
import { CAREER_CANONICAL_AUTHORITY_CONTRACTS, CAREER_CANONICAL_PRODUCER_ID, careerOutcomeValenceDeclarationReference, careerRecommendationProposalReference } from "../../../../lib/career/canonical-authority";
import { bindAndPersistCareerDecisionContextDecisionRevision } from "../../../../lib/career/decision-context-decision-revision-binding-admission/application";
import { careerDecisionContextDecisionRevisionBindings, PostgresCareerDecisionContextDecisionRevisionBindingRepository } from "../../../../lib/career/relation-adapters/decision-context-decision-revision-binding-persistence";
import type { CareerDecisionContextRevisionRepository } from "../../../../lib/career/relation/decision-context";
import type { CareerOutcomeValenceDeclaration } from "../../../../lib/career/relation/outcome-valence-declaration";
import type { RecommendationProposal } from "../../../../lib/career/relation/recommendation-proposal";
import { createGenericDecisionContextRevisionReader } from "../../../../lib/decision-adapters/career-decision-context-binding";

export const HR_LOOP_WORLD_STAMP = "2026-10-01T00:00:00.000Z";
export const HR_LOOP_DECIDER = "HR_DECIDER_LOCAL";
export const HR_LOOP_GRANTOR = "HR_GRANTOR_LOCAL";
export const HR_LOOP_EXECUTOR = "HR_EXECUTOR_LOCAL";
export const HR_LOOP_OBSERVER = "HR_OBSERVER_LOCAL";
/** A marker that lives only inside G3 payloads; it must never appear in a G2 revision or envelope. */
export const HR_LOOP_G3_PAYLOAD_MARKER = "G3_PAYLOAD_ONLY_MARKER_4C1F";

const databaseBasis = requireTestDatabaseUrl();

/** Dependency-ordered drizzle declarations of the post-decision chain (not registered by production startup). */
export const postDecisionTables = [
  careerDecisionActionIntents, careerDecisionActionIntentSubjects, careerDecisionActionIntentEvidenceReferences,
  careerHumanCommitments, careerHumanCommitmentSubjects, careerHumanCommitmentEvidenceReferences,
  careerExecutionAuthorityGrantRevisions, careerExecutionAuthorityGrantSubjects, careerExecutionAuthorityGrantTargetKinds, careerExecutionAuthorityGrantChannelKinds, careerExecutionAuthorityGrantEvidenceReferences,
  careerExecutionContextRevisions, careerExecutionContextSubjects, careerExecutionContextEvidenceReferences,
  careerActionOccurrences, careerActionOccurrenceSubjects, careerActionOccurrenceEvidenceReferences,
  careerStateChangeDeclarations, careerStateChangeDeclarationSubjects, careerStateChangeDeclarationEvidenceReferences,
  careerActionStateChangeAssociationDeclarations, careerActionStateChangeAssociationDeclarationSubjects, careerActionStateChangeAssociationDeclarationEvidenceReferences,
  careerOutcomeRoleDeclarations, careerOutcomeRoleDeclarationSubjects, careerOutcomeRoleDeclarationEvidenceReferences,
  careerOutcomeValenceDeclarations, careerOutcomeValenceDeclarationSubjects, careerOutcomeValenceDeclarationEvidenceReferences,
  careerOutcomeValenceFeedbackAdmissionDeclarations, careerOutcomeValenceFeedbackAdmissionDeclarationSubjects, careerOutcomeValenceFeedbackAdmissionDeclarationEvidenceReferences,
  careerOutcomeValenceFeedbackTargetDeclarations, careerOutcomeValenceFeedbackTargetDeclarationSubjects, careerOutcomeValenceFeedbackTargetDeclarationEvidenceReferences,
  careerOutcomeValenceFeedbackTargetRevisionBindings,
  careerOutcomeValenceFeedbackContextRevisions,
  careerDecisionContextDecisionRevisionBindings
];

const quote = (value: string) => `"${value.replaceAll('"', '""')}"`;
const createTable = (config: ReturnType<typeof getTableConfig>) => `CREATE TABLE IF NOT EXISTS ${quote(config.name)} (${[
  ...config.columns.map(column => `${quote(column.name)} ${column.getSQLType()}${column.notNull ? " NOT NULL" : ""}${column.primary ? " PRIMARY KEY" : ""}`),
  ...config.foreignKeys.map(key => { const reference = key.reference(); return `FOREIGN KEY (${reference.columns.map(column => quote(column.name)).join(",")}) REFERENCES ${quote(getTableConfig(reference.foreignTable).name)} (${reference.foreignColumns.map(column => quote(column.name)).join(",")}) ON DELETE ${(key.onDelete ?? "no action").toUpperCase()}`; })
].join(",")})`;

export async function provisionPostDecisionTables(sql: Sql): Promise<void> {
  for (const table of postDecisionTables) await sql.unsafe(createTable(getTableConfig(table)));
}

export interface HrLoopWorld {
  databaseName: string;
  databaseUrl: string;
  sql: Sql;
  db: PostgresJsDatabase;
  snapshotId: string;
  snapshotKey: string;
  decisionAuthorityGrantRevisionId: string;
  recommendationProposalId: string;
  proposedOrdinals: number[];
  /** Context A carries the complete persisted chain to COVFCR. */
  contextA: string;
  /** Context B carries no declaration; the human declares on it. */
  contextB: string;
  chain: {
    humanDecisionRecordId: string;
    careerDecisionActionIntentId: string;
    careerHumanCommitmentId: string;
    careerExecutionAuthorityGrantRevisionId: string;
    careerExecutionContextRevisionId: string;
    careerActionOccurrenceId: string;
    careerStateChangeDeclarationId: string;
    careerActionStateChangeAssociationDeclarationId: string;
    careerOutcomeRoleDeclarationId: string;
    careerOutcomeValenceDeclarationId: string;
    careerOutcomeValenceFeedbackAdmissionDeclarationId: string;
    careerOutcomeValenceFeedbackTargetDeclarationId: string;
    careerOutcomeValenceFeedbackTargetRevisionBindingId: string;
    careerOutcomeValenceFeedbackContextRevisionId: string;
  };
  /** G2 root DREV (inventory names the RCP), D2-shaped child DREV formed directly, and the one DCDRB binding context A to the root. */
  g2: { rootRevisionId: string; childRevisionId: string; decisionRevisionBindingId: string };
  destroy(): Promise<void>;
}

export async function provisionDatabase(): Promise<{ databaseName: string; databaseUrl: string; sql: Sql; admin: Sql }> {
  const databaseName = newDisposableTestDatabaseName();
  const url = new URL(databaseBasis);
  url.pathname = `/${databaseName}`;
  const adminUrl = new URL(databaseBasis);
  adminUrl.pathname = "/postgres";
  const admin = postgres(adminUrl.toString(), { max: 1, onnotice: () => undefined });
  await createDisposableTestDatabaseNamed(databaseBasis, databaseName);
  const sql = postgres(url.toString(), { max: 2, onnotice: () => undefined });
  return { databaseName, databaseUrl: url.toString(), sql, admin };
}

/**
 * Provisions the isolated database with the same DDL producers production uses
 * where they are exported (`initT11ProductionPersistenceSchema`, G2 schema) and
 * the drizzle declarations for the rest. The shared module-level client in
 * `lib/career/db/client` is deliberately never used here: its connection string
 * is fixed at import time and would point at the shared database.
 */
export async function provisionSchema(sql: Sql): Promise<void> {
  await sql.unsafe(createTable(getTableConfig(careerCapabilityRuns)));
  await initT11ProductionPersistenceSchema(sql);
  await provisionPostDecisionTables(sql);
  await ensureDecisionRuntimePostgresSchema(drizzle(sql) as never);
}

const protocol = { relationProducerVersion: "relation-v1", requirementAdmissionPolicyVersion: "admission-v1", semanticPolicyVersion: "semantic-v1", levelPolicyVersion: "level-v1", scopePolicyVersion: "scope-v1", evidencePolicyVersion: "evidence-v1" };
const roleLineage = { roleRequirementCoveragePolicyVersion: "coverage-v1", roleDimensionInventoryPolicyVersion: "dimension-v1", roleNecessityPolicyVersion: "necessity-v1", roleCompositionPolicyVersion: "composition-v1" };
const policySemantic = {
  provenance: { origin: "EXPLICIT_POLICY_DECLARATION" as const, actorId: "HR_POLICY_LOCAL", authorityEvidenceRef: "evidence://policy/hr-loop" },
  rules: [
    { evolutionInputClass: "INCREASE_DEMONSTRATED_LEVEL_INPUT" as const, action: "PROPOSE" as const, recommendationKind: "DEMONSTRATED_LEVEL_RECOMMENDATION" as const },
    { evolutionInputClass: "RESOLVE_SEMANTIC_UNCERTAINTY_INPUT" as const, action: "PROPOSE" as const, recommendationKind: "SEMANTIC_UNCERTAINTY_RESOLUTION_RECOMMENDATION" as const },
    { evolutionInputClass: "RESOLVE_TARGET_UNCERTAINTY_INPUT" as const, action: "PROPOSE" as const, recommendationKind: "TARGET_UNCERTAINTY_RESOLUTION_RECOMMENDATION" as const },
    { evolutionInputClass: "STRENGTHEN_EVIDENCE_INPUT" as const, action: "PROPOSE" as const, recommendationKind: "EVIDENCE_STRENGTHENING_RECOMMENDATION" as const }
  ],
  recommendationPolicyImplementationVersion: "recommendation-v1",
  schemaVersion: "RECOMMENDATION_POLICY_REVISION_V1" as const
};

/** Target chain, capability snapshot, inventory, aggregate, RRL, TSN, EIS, RPR, RCP: all through sealed producers and repositories. */
export async function seedUpstream(db: PostgresJsDatabase) {
  const stamp = HR_LOOP_WORLD_STAMP;
  const anyDb = db as never;
  const source = new PostgresTargetSourceRevisionRepository(anyDb);
  const organization = new PostgresTargetOrganizationRevisionRepository(anyDb);
  const roleSource = new PostgresTargetRoleSourceBindingRevisionRepository(anyDb, { getTargetSourceRevisionById: source.getRevisionById.bind(source) });
  const binding = new PostgresTargetRoleOrganizationBindingRevisionRepository(anyDb, { getTargetRoleSourceBindingRevisionById: roleSource.getRevisionById.bind(roleSource), getTargetOrganizationRevisionById: organization.getRevisionById.bind(organization) });
  const profile = new PostgresTargetRoleProfileRevisionRepository(anyDb, { getTargetRoleOrganizationBindingRevisionById: binding.getRevisionById.bind(binding), getTargetOrganizationRevisionById: organization.getRevisionById.bind(organization) });
  const requirement = new PostgresTargetRequirementRevisionRepository(anyDb, { getTargetRoleProfileRevisionById: profile.getRevisionById.bind(profile), getTargetRoleOrganizationBindingRevisionById: binding.getRevisionById.bind(binding), getTargetOrganizationRevisionById: organization.getRevisionById.bind(organization) });
  const capability = new PostgresCapabilityCoreRepository(anyDb);
  const relations = new PostgresCapabilityRequirementRelationRepository(anyDb);
  const inventories = new PostgresRequirementInventoryRepository(anyDb);

  const sourceRevision = createTargetSourceRevision({ targetSourceEntityId: "SOURCE_HR_LOOP", previousRevisionId: null, sourceKind: "DOCUMENT", sourceLocator: "source://hr-loop", rawContentHash: "a".repeat(64), normalizedContentHash: "b".repeat(64), normalizedContent: "TypeScript capability", normalizationVersion: "v1", schemaVersion: "TARGET_SOURCE_REVISION_V1", createdAt: stamp });
  const organizationRevision = createTargetOrganizationRevision({ targetOrganizationEntityId: "ORG_HR_LOOP", previousRevisionId: null, organizationDescriptor: "HR Loop Org", descriptorKind: "DECLARED_NAME", schemaVersion: "TARGET_ORGANIZATION_REVISION_V1", createdAt: stamp });
  await source.createTargetSourceRevisionPersister().persist(sourceRevision);
  await organization.createTargetOrganizationRevisionPersister().persist(organizationRevision);
  const roleSourceRevision = createTargetRoleSourceBindingRevision({ targetRoleEntityId: "ROLE_HR_LOOP", targetSourceRevisionId: sourceRevision.targetSourceRevisionId, previousRevisionId: null, schemaVersion: "TARGET_ROLE_SOURCE_BINDING_REVISION_V1", createdAt: stamp });
  await roleSource.createTargetRoleSourceBindingRevisionPersister().persist(roleSourceRevision);
  const bindingRevision = createTargetRoleOrganizationBindingRevision({ targetRoleEntityId: "ROLE_HR_LOOP", targetRoleSourceBindingRevisionId: roleSourceRevision.targetRoleSourceBindingRevisionId, targetOrganizationRevisionId: organizationRevision.targetOrganizationRevisionId, previousRevisionId: null, schemaVersion: "TARGET_ROLE_ORGANIZATION_BINDING_REVISION_V1", createdAt: stamp });
  await binding.createTargetRoleOrganizationBindingRevisionPersister().persist(bindingRevision);
  const profileRevision = createTargetRoleProfileRevision({ targetRoleEntityId: "ROLE_HR_LOOP", targetRoleOrganizationBindingRevisionId: bindingRevision.targetRoleOrganizationBindingRevisionId, previousRevisionId: null, profile: { roleDescriptor: null, roleSemanticDefinition: "Role", responsibilityScope: null, seniorityInterpretation: null, domainContext: null }, proposalState: "PROPOSAL_ONLY", sourceEvidenceState: "SOURCE_MATCH_VERIFIED", semanticValidationState: "NOT_RUN", authorityState: "NONE", schemaVersion: "TARGET_ROLE_PROFILE_REVISION_V1", createdAt: stamp });
  await profile.createTargetRoleProfileRevisionPersister().persist(profileRevision);
  const requirementOf = (entity: string, necessity: "REQUIRED" | "PREFERRED") => createTargetRequirementRevision({ targetRequirementEntityId: entity, targetRoleProfileRevisionId: profileRevision.targetRoleProfileRevisionId, previousRevisionId: null, requirement: { normalizedStatement: `${entity} capability`, requirementType: "CAPABILITY", capabilityExpression: "TypeScript", structuralDefinition: "Typed capability", requiredLevelState: { kind: "NOT_APPLICABLE" }, necessityState: { kind: necessity }, scopeContextState: { kind: "NOT_APPLICABLE" } }, evidence: [{ exactQuote: `${entity} capability` }], sourceEvidenceState: "SOURCE_MATCH_VERIFIED", classificationValidationState: "VALIDATED", semanticInterpretationState: "VALIDATED", requiredLevelValidationState: "NOT_APPLICABLE", necessityValidationState: "SUPPORTED", scopeValidationState: "NOT_APPLICABLE", matchingEligibility: "MATCHING_ELIGIBLE_PROPOSAL_ONLY", proposalState: "PROPOSAL_ONLY", authorityState: "NONE", schemaVersion: "TARGET_REQUIREMENT_REVISION_V1", createdAt: stamp });
  const present = requirementOf("REQ_PRESENT_HR_LOOP", "REQUIRED");
  const absent = requirementOf("REQ_ABSENT_HR_LOOP", "PREFERRED");
  await requirement.createTargetRequirementRevisionPersister().persist(present);
  await requirement.createTargetRequirementRevisionPersister().persist(absent);

  const phase4 = createPhase4Input("HR_LOOP", "VERIFIED");
  await capability.saveRun(phase4.discoveryRun);
  await capability.saveConvergenceRun(phase4.convergenceRun);
  await capability.saveVerificationRun(phase4.verificationRun);
  const snapshot = await capability.createVerifiedCapabilitySnapshotPublisher().publish(phase4);
  if (snapshot.publication?.mode !== "PHASE4_VERIFIED") throw new Error("ERR_HR_LOOP_WORLD_SNAPSHOT_NOT_PHASE4");
  const operand = await deriveCandidateCapabilityOperand({ verifiedCapabilitySnapshotId: snapshot.snapshotId, capabilityId: snapshot.capabilities[0].capabilityId }, capability);

  const inventory = await buildTargetRoleRequirementInventory({ targetRoleProfileRevisionId: profileRevision.targetRoleProfileRevisionId, requirementInventoryPolicyVersion: "inventory-v1", createdAt: stamp }, { listTargetRequirementRevisionsByTargetRoleProfileRevisionId: requirement.listTargetRequirementRevisionsByTargetRoleProfileRevisionId.bind(requirement) });
  await inventories.persistInventory(inventory);
  const aggregate = await buildRequirementRelationAggregate({ inventory, verifiedCapabilitySnapshotId: snapshot.snapshotId, targetRequirementEntityId: present.targetRequirementEntityId, targetRequirementRevisionId: present.targetRequirementRevisionId, candidateCapabilityOperandIds: [operand.candidateCapabilityOperandId], pairDispositions: [{ candidateCapabilityOperandId: operand.candidateCapabilityOperandId, disposition: "NOT_EVALUATED", capabilityRequirementRelationId: null, capabilityRequirementRelationEvaluationResultId: null }], t6bProtocol: protocol, pairInventoryPolicyVersion: "pair-v1", compositionPolicyVersion: "composition-v1", createdAt: stamp }, relations);
  await inventories.persistAggregate(aggregate);

  const roles = new PostgresRoleRelationRepository(anyDb);
  const role = await produceRoleRelation({ verifiedCapabilitySnapshotId: snapshot.snapshotId, targetRoleProfileRevision: profileRevision, inventory, createdAt: stamp, lineage: roleLineage }, { aggregates: inventories, candidateRepository: capability });
  await roles.persistRoleRelation(role);
  const tensions = new PostgresTensionStateRepository(anyDb);
  const tension = await produceAndPersistTensionState({ roleRelationId: role.roleRelationId, classificationPolicyVersion: "tension-v1", createdAt: stamp }, { roles, policies: { resolveTensionClassificationPolicy: version => version === "tension-v1" ? { version } : null }, tensionStates: tensions });
  const evolutions = new PostgresEvolutionInputStateRepository(anyDb, tensions);
  const evolution = await produceAndPersistEvolutionInputState({ tensionStateId: tension.tensionStateId, derivationPolicyVersion: "evolution-v1", createdAt: stamp }, { tensionStates: tensions, policies: { resolveEvolutionInputDerivationPolicy: version => version === "evolution-v1" ? { version } : null }, evolutionInputs: evolutions });
  const policies = new PostgresRecommendationPolicyRevisionRepository(anyDb);
  const policy = { recommendationPolicyRevisionId: deriveRecommendationPolicyRevisionId(policySemantic), ...policySemantic, createdAt: stamp };
  await policies.persistRecommendationPolicyRevision(policy);
  const proposals = new PostgresRecommendationProposalRepository(anyDb, evolutions, policies, productionRecommendationPolicyImplementationRegistry);
  const proposal = await produceAndPersistRecommendationProposal({ evolutionInputStateId: evolution.evolutionInputStateId, recommendationPolicyRevisionId: policy.recommendationPolicyRevisionId, createdAt: stamp }, { evolutionInputs: evolutions, policies, implementations: productionRecommendationPolicyImplementationRegistry, proposals });
  return { snapshot, proposal };
}

export async function createHrLoopPostgresWorld(): Promise<HrLoopWorld> {
  const { databaseName, databaseUrl, sql, admin } = await provisionDatabase();
  const destroy = async () => {
    await sql.end({ timeout: 5 });
    await dropDisposableTestDatabase(databaseUrl);
    await admin.end({ timeout: 5 });
  };
  try {
    await provisionSchema(sql);
    const db = drizzle(sql);
    const { snapshot, proposal } = await seedUpstream(db);
    const stamp = HR_LOOP_WORLD_STAMP;
    const proposedOrdinals = proposal.items.filter(item => item.recommendationDisposition === "PROPOSED").map(item => item.sourceEvolutionInputItemOrdinal).sort((left, right) => left - right).slice(0, 2);
    if (proposedOrdinals.length === 0) throw new Error("ERR_HR_LOOP_WORLD_NO_PROPOSED_ITEM");

    const producer = createProductionHumanDecisionRecordDependencies(db);
    const authority = createDecisionAuthorityGrantRevision({ grantorActorId: HR_LOOP_GRANTOR, authorizedActorId: HR_LOOP_DECIDER, authorityScope: "CAREER_RECOMMENDATION_DECISION", permittedDecisionClasses: ["ACCEPT_RECOMMENDATION", "DEFER_DECISION", "REJECT_RECOMMENDATION", "REQUEST_FURTHER_EVIDENCE", "REQUEST_TARGET_CLARIFICATION"], permittedSubjectKinds: ["RCP_ITEM"], authorityEvidenceRefs: [`evidence://grant/hr-loop/${HR_LOOP_G3_PAYLOAD_MARKER}`], declaredAt: stamp, effectiveFrom: "2026-01-01T00:00:00.000Z", effectiveUntil: null, createdAt: stamp });
    await producer.authorities.persistDecisionAuthorityGrantRevision(authority);
    const subjects = proposedOrdinals.map(sourceEvolutionInputItemOrdinal => ({ recommendationProposalId: proposal.recommendationProposalId, sourceEvolutionInputItemOrdinal }));
    // Contexts are persisted through the repository, as the sealed T12A fixture does. (The producer's
    // JSONB key-order defect is fixed at 87d09e1 and proven in test/decision-integration.)
    const contextA = await producer.contexts.persistCareerDecisionContextRevision(createCareerDecisionContextRevision(authority, proposal, { decisionAuthorityGrantRevisionId: authority.decisionAuthorityGrantRevisionId, recommendationProposalId: proposal.recommendationProposalId, decisionSubjects: subjects, contextEvidenceRefs: ["evidence://context/hr-loop/a"], createdAt: stamp }));
    const contextB = await producer.contexts.persistCareerDecisionContextRevision(createCareerDecisionContextRevision(authority, proposal, { decisionAuthorityGrantRevisionId: authority.decisionAuthorityGrantRevisionId, recommendationProposalId: proposal.recommendationProposalId, decisionSubjects: subjects, contextEvidenceRefs: ["evidence://context/hr-loop/b"], createdAt: stamp }));

    const decision = await produceAndPersistHumanDecisionRecord({ careerDecisionContextRevisionId: contextA.careerDecisionContextRevisionId, declarantActorId: HR_LOOP_DECIDER, declarationClass: "ACCEPT_RECOMMENDATION", declaredAt: "2026-10-02T09:00:00.000Z", declarationEvidenceRefs: ["evidence://decision/hr-loop"], createdAt: "2026-10-02T09:00:01.000Z" }, producer);
    const read = createPostgresHrDecisionLoopReadDependencies(db, producer);
    const intentRepo = new (await import("../../../../lib/career/relation-adapters/action-intent-persistence")).PostgresCareerDecisionActionIntentRepository(db, producer.records);
    const intent = await intentRepo.persistCareerDecisionActionIntent(createCareerDecisionActionIntent(decision, { humanDecisionRecordId: decision.humanDecisionRecordId, declaredByActorId: HR_LOOP_DECIDER, actionIntentClass: "RECOMMENDATION_OPERATIONALIZATION", operationDescription: "Operationalize the accepted recommendation subjects", declaredAt: "2026-10-02T10:00:00.000Z", actionIntentEvidenceRefs: ["evidence://intent/hr-loop"], createdAt: "2026-10-02T10:00:01.000Z" }));
    const commitmentRepo = new (await import("../../../../lib/career/relation-adapters/human-commitment-persistence")).PostgresCareerHumanCommitmentRepository(db, intentRepo);
    const commitment = await commitmentRepo.persistCareerHumanCommitment(createCareerHumanCommitment(intent, { careerDecisionActionIntentId: intent.careerDecisionActionIntentId, committedByActorId: HR_LOOP_DECIDER, committedAt: "2026-10-02T11:00:00.000Z", commitmentEvidenceRefs: ["evidence://commitment/hr-loop"], createdAt: "2026-10-02T11:00:01.000Z" }));
    const grantRepo = new (await import("../../../../lib/career/relation-adapters/execution-authority-grant-persistence")).PostgresCareerExecutionAuthorityGrantRevisionRepository(db, commitmentRepo);
    const grant = await grantRepo.persistCareerExecutionAuthorityGrantRevision(createCareerExecutionAuthorityGrantRevision(commitment, { careerHumanCommitmentId: commitment.careerHumanCommitmentId, grantorActorId: HR_LOOP_GRANTOR, authorizedExecutionActorId: HR_LOOP_EXECUTOR, executionAuthorityScope: "RECOMMENDATION_OPERATION_EXECUTION", permittedTargetKinds: ["PERSON", "SYSTEM"], permittedChannelKinds: ["EMAIL", "MESSAGE"], authorityEvidenceRefs: ["evidence://execution-authority/hr-loop"], declaredAt: "2026-10-02T12:00:00.000Z", effectiveFrom: "2026-10-02T12:00:00.000Z", effectiveUntil: "2026-10-09T12:00:00.000Z", createdAt: "2026-10-02T12:00:01.000Z" }));
    const executionContextRepo = new (await import("../../../../lib/career/relation-adapters/execution-context-revision-persistence")).PostgresCareerExecutionContextRevisionRepository(db, grantRepo);
    const executionContext = await executionContextRepo.persistCareerExecutionContextRevision(createCareerExecutionContextRevision(grant, { careerExecutionAuthorityGrantRevisionId: grant.careerExecutionAuthorityGrantRevisionId, declaredByActorId: HR_LOOP_EXECUTOR, executionTarget: { targetKind: "PERSON", targetRef: "target://person/hr-loop/1" }, executionChannel: { channelKind: "EMAIL", channelRef: "channel://email/hr-loop/1" }, declaredAt: "2026-10-02T12:30:00.000Z", contextEvidenceRefs: ["evidence://execution-context/hr-loop"], createdAt: "2026-10-02T12:30:01.000Z" }));
    const occurrenceRepo = new (await import("../../../../lib/career/relation-adapters/action-occurrence-persistence")).PostgresCareerActionOccurrenceRepository(db, executionContextRepo, grantRepo);
    const occurrence = await occurrenceRepo.persistCareerActionOccurrence(createCareerActionOccurrence(executionContext, { careerExecutionContextRevisionId: executionContext.careerExecutionContextRevisionId, performedByActorId: HR_LOOP_EXECUTOR, occurredAt: "2026-10-03T09:00:00.000Z", occurrenceEvidenceRefs: ["evidence://occurrence/hr-loop"], externalOccurrenceRef: "external://occurrence/hr-loop/1", createdAt: "2026-10-03T09:00:01.000Z" }));
    const stateChangeRepo = new (await import("../../../../lib/career/relation-adapters/state-change-declaration-persistence")).PostgresCareerStateChangeDeclarationRepository(db, occurrenceRepo);
    const stateChange = await stateChangeRepo.persistCareerStateChangeDeclaration(createCareerStateChangeDeclaration(occurrence, { careerActionOccurrenceId: occurrence.careerActionOccurrenceId, observedByActorId: HR_LOOP_OBSERVER, stateSubject: { subjectKind: "EXTERNAL_RESOURCE", subjectRef: "state://application/hr-loop/1" }, stateDimension: "application-status", beforeObservation: { observationState: "OBSERVED", value: "applied" }, afterObservation: { observationState: "OBSERVED", value: "interview-invited" }, observedAt: "2026-10-04T09:00:00.000Z", stateChangeEvidenceRefs: ["evidence://state-change/hr-loop"], externalStateRef: null, createdAt: "2026-10-04T09:00:01.000Z" }));
    const associationRepo = new (await import("../../../../lib/career/relation-adapters/action-state-change-association-declaration-persistence")).PostgresCareerActionStateChangeAssociationDeclarationRepository(db, stateChangeRepo);
    const association = await associationRepo.persistCareerActionStateChangeAssociationDeclaration(createCareerActionStateChangeAssociationDeclaration(stateChange, { careerStateChangeDeclarationId: stateChange.careerStateChangeDeclarationId, declaredByActorId: HR_LOOP_OBSERVER, declaredAt: "2026-10-05T09:00:00.000Z", associationEvidenceRefs: ["evidence://association/hr-loop"], createdAt: "2026-10-05T09:00:01.000Z" }));
    const outcomeRoleRepo = new (await import("../../../../lib/career/relation-adapters/outcome-role-declaration-persistence")).PostgresCareerOutcomeRoleDeclarationRepository(db, associationRepo);
    const outcomeRole = await outcomeRoleRepo.persistCareerOutcomeRoleDeclaration(createCareerOutcomeRoleDeclaration(association, { careerActionStateChangeAssociationDeclarationId: association.careerActionStateChangeAssociationDeclarationId, declaredByActorId: HR_LOOP_OBSERVER, declaredAt: "2026-10-06T09:00:00.000Z", outcomeRoleEvidenceRefs: ["evidence://outcome-role/hr-loop"], createdAt: "2026-10-06T09:00:01.000Z" }));
    const valenceRepo = new (await import("../../../../lib/career/relation-adapters/outcome-valence-declaration-persistence")).PostgresCareerOutcomeValenceDeclarationRepository(db, outcomeRoleRepo);
    const valence = await valenceRepo.persistCareerOutcomeValenceDeclaration(createCareerOutcomeValenceDeclaration(outcomeRole, { careerOutcomeRoleDeclarationId: outcomeRole.careerOutcomeRoleDeclarationId, declaredByActorId: HR_LOOP_DECIDER, declaredAt: "2026-10-07T09:00:00.000Z", valence: "DESIRABLE", valenceEvidenceRefs: ["evidence://outcome-valence/hr-loop"], createdAt: "2026-10-07T09:00:01.000Z" }));
    const admissionRepo = new (await import("../../../../lib/career/relation-adapters/outcome-valence-feedback-admission-declaration-persistence")).PostgresCareerOutcomeValenceFeedbackAdmissionDeclarationRepository(db, valenceRepo);
    const admission = await admissionRepo.persistCareerOutcomeValenceFeedbackAdmissionDeclaration(createCareerOutcomeValenceFeedbackAdmissionDeclaration(valence, { careerOutcomeValenceDeclarationId: valence.careerOutcomeValenceDeclarationId, admittedByActorId: HR_LOOP_DECIDER, admittedAt: "2026-10-08T09:00:00.000Z", admissionEvidenceRefs: ["evidence://feedback-admission/hr-loop"], createdAt: "2026-10-08T09:00:01.000Z" }));
    const targetRepo = new (await import("../../../../lib/career/relation-adapters/outcome-valence-feedback-target-declaration-persistence")).PostgresCareerOutcomeValenceFeedbackTargetDeclarationRepository(db, admissionRepo);
    const target = await targetRepo.persistCareerOutcomeValenceFeedbackTargetDeclaration(createCareerOutcomeValenceFeedbackTargetDeclaration(admission, { careerOutcomeValenceFeedbackAdmissionDeclarationId: admission.careerOutcomeValenceFeedbackAdmissionDeclarationId, targetCareerDecisionContextRevisionId: contextA.careerDecisionContextRevisionId, declaredByActorId: HR_LOOP_DECIDER, declaredAt: "2026-10-08T10:00:00.000Z", targetSelectionEvidenceRefs: ["evidence://feedback-target/hr-loop"], createdAt: "2026-10-08T10:00:01.000Z" }));
    const bindingRepo = new (await import("../../../../lib/career/relation-adapters/outcome-valence-feedback-target-revision-binding-persistence")).PostgresCareerOutcomeValenceFeedbackTargetRevisionBindingRepository(db);
    const feedbackBinding = await bindingRepo.persistCareerOutcomeValenceFeedbackTargetRevisionBinding(await createBoundCareerOutcomeValenceFeedbackTargetRevisionBinder({ getCareerDecisionContextRevisionById: id => producer.contexts.getCareerDecisionContextRevisionById(id) }).bind(target, { createdAt: "2026-10-08T10:30:00.000Z" }));
    const representation = createCareerOutcomeValenceFeedbackReturnRepresentation(feedbackBinding, { createdAt: "2026-10-08T10:31:00.000Z" });
    const item = createCareerOutcomeValenceFeedbackReturnItem(representation, { createdAt: "2026-10-08T10:32:00.000Z" });
    const content = createCareerOutcomeValenceFeedbackContextContent(contextA, [item], { createdAt: "2026-10-08T10:33:00.000Z" });
    const transition = createCareerOutcomeValenceFeedbackContextTransition(contextA, null, item, content, { createdAt: "2026-10-08T10:34:00.000Z" });
    const feedbackRevision = createCareerOutcomeValenceFeedbackContextRevision({ parentRevisionKind: "CAREER_DECISION_CONTEXT_REVISION", parentRevisionId: contextA.careerDecisionContextRevisionId }, transition, { createdAt: "2026-10-08T10:35:00.000Z" });
    const feedbackRepo = new PostgresCareerOutcomeValenceFeedbackContextRevisionRepository(db);
    await createBoundCareerOutcomeValenceFeedbackContextRevisionPersister({
      getCareerDecisionContextRevisionById: id => producer.contexts.getCareerDecisionContextRevisionById(id),
      getCareerOutcomeValenceFeedbackContextRevisionById: id => feedbackRepo.getCareerOutcomeValenceFeedbackContextRevisionById(id),
      writeCareerOutcomeValenceFeedbackContextRevision: revision => feedbackRepo.writeCareerOutcomeValenceFeedbackContextRevision(revision)
    }).persistCareerOutcomeValenceFeedbackContextRevision(feedbackRevision);
    void read;

    const g2 = await seedDecisionContextLineage(db, snapshot.snapshotId, computeSnapshotKey(snapshot), proposal, valence, producer.contexts, contextA.careerDecisionContextRevisionId);

    return {
      databaseName, databaseUrl, sql, db,
      snapshotId: snapshot.snapshotId,
      snapshotKey: computeSnapshotKey(snapshot),
      decisionAuthorityGrantRevisionId: authority.decisionAuthorityGrantRevisionId,
      recommendationProposalId: proposal.recommendationProposalId,
      proposedOrdinals,
      contextA: contextA.careerDecisionContextRevisionId,
      contextB: contextB.careerDecisionContextRevisionId,
      chain: {
        humanDecisionRecordId: decision.humanDecisionRecordId,
        careerDecisionActionIntentId: intent.careerDecisionActionIntentId,
        careerHumanCommitmentId: commitment.careerHumanCommitmentId,
        careerExecutionAuthorityGrantRevisionId: grant.careerExecutionAuthorityGrantRevisionId,
        careerExecutionContextRevisionId: executionContext.careerExecutionContextRevisionId,
        careerActionOccurrenceId: occurrence.careerActionOccurrenceId,
        careerStateChangeDeclarationId: stateChange.careerStateChangeDeclarationId,
        careerActionStateChangeAssociationDeclarationId: association.careerActionStateChangeAssociationDeclarationId,
        careerOutcomeRoleDeclarationId: outcomeRole.careerOutcomeRoleDeclarationId,
        careerOutcomeValenceDeclarationId: valence.careerOutcomeValenceDeclarationId,
        careerOutcomeValenceFeedbackAdmissionDeclarationId: admission.careerOutcomeValenceFeedbackAdmissionDeclarationId,
        careerOutcomeValenceFeedbackTargetDeclarationId: target.careerOutcomeValenceFeedbackTargetDeclarationId,
        careerOutcomeValenceFeedbackTargetRevisionBindingId: feedbackBinding.careerOutcomeValenceFeedbackTargetRevisionBindingId,
        careerOutcomeValenceFeedbackContextRevisionId: feedbackRevision.careerOutcomeValenceFeedbackContextRevisionId
      },
      g2,
      destroy
    };
  } catch (error) {
    await destroy().catch(() => undefined);
    throw error;
  }
}

/**
 * G2 lineage fixture: a root DREV_ over the PHASE4_VERIFIED snapshot and one
 * child DREV_ whose OBSERVATION item carries AUTHORITATIVE_STATE provenance to
 * the exact COVD (decision D2 semantics). Both are built with the sealed
 * decision-core constructors and persisted through the sealed repository. The
 * child is a lineage fixture for the frontend walk, not an 8D return proof:
 * the governed 8D return (sealed 8D5) cannot carry exact COVD provenance, so a
 * child like this one exists only when formed directly, as here.
 */
export const HR_LOOP_G3_OUTCOME_VALENCE_CONTRACT_ID = CAREER_CANONICAL_AUTHORITY_CONTRACTS.OUTCOME_VALENCE_DECLARATION;
/** The R1/R6 producer id; references named here resolve through the R1 resolver family. */
export const HR_LOOP_G3_PRODUCER_ID = CAREER_CANONICAL_PRODUCER_ID;

async function seedDecisionContextLineage(
  db: PostgresJsDatabase,
  snapshotId: string,
  snapshotKey: string,
  proposal: RecommendationProposal,
  valence: CareerOutcomeValenceDeclaration,
  contexts: CareerDecisionContextRevisionRepository,
  bindingContextId: string
) {
  const repository = new PostgresDecisionContextRevisionRepository(db as never);
  const persister = repository.createDecisionContextRevisionPersister();
  const snapshotReference: AuthoritativeStateReference = { producerId: CAPABILITY_CORE_PRODUCER_ID, authorityContractId: CAPABILITY_CORE_AUTHORITY_CONTRACT_ID, artifactId: snapshotId, locator: snapshotKey };
  const proposalReference: AuthoritativeStateReference = careerRecommendationProposalReference(proposal);
  const rootInput: DecisionContextDraftInput = {
    sourceStateReferences: [snapshotReference, proposalReference],
    items: [
      { role: "DECISION_QUESTION", statement: "Which recommendation subjects should the HR decider act on?", provenance: { origin: "HUMAN_INPUT", actorId: HR_LOOP_DECIDER } },
      { role: "OBJECTIVE", statement: "Reach an interview invitation for the target role.", provenance: { origin: "HUMAN_INPUT", actorId: HR_LOOP_DECIDER } }
    ]
  };
  const rootContext = createDecisionContextDraft(rootInput);
  const emptyValidation = { expectationValidations: [], consequenceValidations: [] };
  const root: DecisionContextRevision = await persister.persist(createDecisionContextRevision({ previousRevisionId: null, context: rootContext, validationInput: emptyValidation, validationAssembly: assembleDecisionContextValidation(rootContext, emptyValidation) }));
  const valenceReference: AuthoritativeStateReference = careerOutcomeValenceDeclarationReference(valence);
  const childContext = createDecisionContextDraft({
    sourceStateReferences: [snapshotReference, proposalReference, valenceReference],
    items: [
      ...rootInput.items,
      { role: "OBSERVATION", statement: "application-status observed applied -> interview-invited; declared valence DESIRABLE", provenance: { origin: "AUTHORITATIVE_STATE", stateReference: valenceReference } }
    ]
  });
  const child = await persister.persist(createDecisionContextRevision({ previousRevisionId: root.revisionId, context: childContext, validationInput: emptyValidation, validationAssembly: assembleDecisionContextValidation(childContext, emptyValidation) }));
  // R4 / D4: one exact, reader-backed DCTXREV to root-DREV binding persisted through the sealed admission.
  const binding = await bindAndPersistCareerDecisionContextDecisionRevision(
    { careerDecisionContextRevisionId: bindingContextId, decisionContextRevisionId: root.revisionId, createdAt: "2026-10-08T11:00:00.000Z" },
    { decisionContexts: contexts, decisionRevisions: createGenericDecisionContextRevisionReader(repository), bindings: new PostgresCareerDecisionContextDecisionRevisionBindingRepository(db as never) }
  );
  return { rootRevisionId: root.revisionId, childRevisionId: child.revisionId, decisionRevisionBindingId: binding.careerDecisionContextDecisionRevisionBindingId };
}
