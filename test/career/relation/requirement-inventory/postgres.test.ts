import { randomBytes } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import { getTableConfig } from "drizzle-orm/pg-core";
import postgres, { type Sql } from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PostgresCapabilityCoreRepository, deriveCandidateCapabilityOperand } from "../../../../lib/career/capability-core";
import { careerCapabilityRuns, careerCapabilitySnapshots } from "../../../../lib/career/db/schema";
import { PostgresRequirementInventoryRepository } from "../../../../lib/career/relation-adapters/requirement-inventory-persistence";
import { requirementRelationAggregateFailedResults, requirementRelationAggregateMaterializedRelations, requirementRelationAggregateNotEvaluatedPairs, requirementRelationAggregates, targetRoleRequirementInventories } from "../../../../lib/career/relation-adapters/requirement-inventory-persistence/postgres-schema";
import { PostgresCapabilityRequirementRelationRepository } from "../../../../lib/career/relation-adapters/capability-requirement-persistence";
import { capabilityRequirementRelationEvaluationResults, capabilityRequirementRelationEvaluationRuns, capabilityRequirementRelationRawProviderOutputs, capabilityRequirementRelations } from "../../../../lib/career/relation-adapters/capability-requirement-persistence/postgres-schema";
import { PostgresTargetOrganizationRevisionRepository } from "../../../../lib/career/target-adapters/organization-revision-persistence";
import { targetOrganizationRevisions } from "../../../../lib/career/target-adapters/organization-revision-persistence/postgres-schema";
import { PostgresTargetRoleOrganizationBindingRevisionRepository } from "../../../../lib/career/target-adapters/role-organization-binding-revision-persistence";
import { targetRoleOrganizationBindingRevisions } from "../../../../lib/career/target-adapters/role-organization-binding-revision-persistence/postgres-schema";
import { PostgresTargetRoleProfileRevisionRepository } from "../../../../lib/career/target-adapters/role-profile-revision-persistence";
import { targetRoleProfileRevisions } from "../../../../lib/career/target-adapters/role-profile-revision-persistence/postgres-schema";
import { PostgresTargetRequirementRevisionRepository } from "../../../../lib/career/target-adapters/role-requirement-revision-persistence";
import { targetRequirementRevisions } from "../../../../lib/career/target-adapters/role-requirement-revision-persistence/postgres-schema";
import { PostgresTargetRoleSourceBindingRevisionRepository } from "../../../../lib/career/target-adapters/role-source-binding-revision-persistence";
import { targetRoleSourceBindingRevisions } from "../../../../lib/career/target-adapters/role-source-binding-revision-persistence/postgres-schema";
import { PostgresTargetSourceRevisionRepository } from "../../../../lib/career/target-adapters/source-revision-persistence";
import { targetSourceRevisions } from "../../../../lib/career/target-adapters/source-revision-persistence/postgres-schema";
import { produceCapabilityRequirementRelation } from "../../../../lib/career/relation/capability-requirement";
import { buildRequirementRelationAggregate, buildTargetRoleRequirementInventory } from "../../../../lib/career/relation/requirement-inventory";
import { createTargetOrganizationRevision } from "../../../../lib/career/target/organization";
import { createTargetRoleOrganizationBindingRevision, createTargetRoleProfileRevision, createTargetRoleSourceBindingRevision } from "../../../../lib/career/target/role";
import { createTargetRequirementRevision } from "../../../../lib/career/target/role/requirement";
import { createTargetSourceRevision } from "../../../../lib/career/target/source";
import { createPhase4Input } from "../../capability-core/relation-operand/phase4-fixture";

const url = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/condyn";
const schema = `requirement_inventory_t7a_${randomBytes(8).toString("hex")}`;
const stamp = "2026-10-03T00:00:00.000Z";
const protocol = { relationProducerVersion: "relation-v1", requirementAdmissionPolicyVersion: "admission-v1", semanticPolicyVersion: "semantic-v1", levelPolicyVersion: "level-v1", scopePolicyVersion: "scope-v1", evidencePolicyVersion: "evidence-v1" };
const lineage = { ...protocol, promptChecksum: "prompt-v1", provider: "bounded-fake", model: "model-v1", outputSchemaVersion: "output-v1" };
let admin: Sql;
const clients = new Set<Sql>();
const configs = [careerCapabilityRuns, careerCapabilitySnapshots, targetSourceRevisions, targetOrganizationRevisions, targetRoleSourceBindingRevisions, targetRoleOrganizationBindingRevisions, targetRoleProfileRevisions, targetRequirementRevisions, capabilityRequirementRelationRawProviderOutputs, capabilityRequirementRelationEvaluationRuns, capabilityRequirementRelationEvaluationResults, capabilityRequirementRelations, targetRoleRequirementInventories, requirementRelationAggregates, requirementRelationAggregateMaterializedRelations, requirementRelationAggregateFailedResults, requirementRelationAggregateNotEvaluatedPairs].map(getTableConfig);
const quote = (value: string) => `"${value}"`;
const ddl = (config: typeof configs[number]) => `CREATE TABLE ${quote(schema)}.${quote(config.name)} (${[
  ...config.columns.map(column => `${quote(column.name)} ${column.getSQLType()}${column.notNull ? " NOT NULL" : ""}${column.primary ? " PRIMARY KEY" : ""}`),
  ...config.foreignKeys.map(foreignKey => { const reference = foreignKey.reference(); return `FOREIGN KEY (${reference.columns.map(column => quote(column.name)).join(",")}) REFERENCES ${quote(schema)}.${quote(getTableConfig(reference.foreignTable).name)} (${reference.foreignColumns.map(column => quote(column.name)).join(",")}) ON DELETE ${(foreignKey.onDelete ?? "no action").toUpperCase()}`; }),
].join(",")})`;
const client = async () => { const sql = postgres(url, { max: 1, onnotice: () => undefined }); clients.add(sql); await sql.unsafe(`SET search_path TO "${schema}"`); return { sql, db: drizzle(sql) }; };
const close = async (sql: Sql) => { await sql.end({ timeout: 5 }); clients.delete(sql); };

beforeAll(async () => { admin = postgres(url, { max: 1, onnotice: () => undefined }); await admin.unsafe(`CREATE SCHEMA "${schema}"`); for (const config of configs) await admin.unsafe(ddl(config)); });
afterAll(async () => { await Promise.all([...clients].map(sql => sql.end({ timeout: 5 }))); if (admin) { await admin.unsafe(`DROP SCHEMA "${schema}" CASCADE`); await admin.end({ timeout: 5 }); } });

function runtime(db: any) {
  const source = new PostgresTargetSourceRevisionRepository(db);
  const organization = new PostgresTargetOrganizationRevisionRepository(db);
  const roleSource = new PostgresTargetRoleSourceBindingRevisionRepository(db, { getTargetSourceRevisionById: source.getRevisionById.bind(source) });
  const binding = new PostgresTargetRoleOrganizationBindingRevisionRepository(db, { getTargetRoleSourceBindingRevisionById: roleSource.getRevisionById.bind(roleSource), getTargetOrganizationRevisionById: organization.getRevisionById.bind(organization) });
  const profile = new PostgresTargetRoleProfileRevisionRepository(db, { getTargetRoleOrganizationBindingRevisionById: binding.getRevisionById.bind(binding), getTargetOrganizationRevisionById: organization.getRevisionById.bind(organization) });
  const requirement = new PostgresTargetRequirementRevisionRepository(db, { getTargetRoleProfileRevisionById: profile.getRevisionById.bind(profile), getTargetRoleOrganizationBindingRevisionById: binding.getRevisionById.bind(binding), getTargetOrganizationRevisionById: organization.getRevisionById.bind(organization) });
  return { source, organization, roleSource, binding, profile, requirement, capability: new PostgresCapabilityCoreRepository(db), relations: new PostgresCapabilityRequirementRelationRepository(db), inventories: new PostgresRequirementInventoryRepository(db) };
}

async function seed(db: any) {
  const runtimeValue = runtime(db);
  const source = createTargetSourceRevision({ targetSourceEntityId: "SOURCE_T7A", previousRevisionId: null, sourceKind: "DOCUMENT", sourceLocator: "source://t7a", rawContentHash: "a".repeat(64), normalizedContentHash: "b".repeat(64), normalizedContent: "TypeScript capability", normalizationVersion: "v1", schemaVersion: "TARGET_SOURCE_REVISION_V1", createdAt: stamp });
  const organization = createTargetOrganizationRevision({ targetOrganizationEntityId: "ORG_T7A", previousRevisionId: null, organizationDescriptor: "Org", descriptorKind: "DECLARED_NAME", schemaVersion: "TARGET_ORGANIZATION_REVISION_V1", createdAt: stamp });
  await runtimeValue.source.createTargetSourceRevisionPersister().persist(source); await runtimeValue.organization.createTargetOrganizationRevisionPersister().persist(organization);
  const roleSource = createTargetRoleSourceBindingRevision({ targetRoleEntityId: "ROLE_T7A", targetSourceRevisionId: source.targetSourceRevisionId, previousRevisionId: null, schemaVersion: "TARGET_ROLE_SOURCE_BINDING_REVISION_V1", createdAt: stamp });
  await runtimeValue.roleSource.createTargetRoleSourceBindingRevisionPersister().persist(roleSource);
  const binding = createTargetRoleOrganizationBindingRevision({ targetRoleEntityId: "ROLE_T7A", targetRoleSourceBindingRevisionId: roleSource.targetRoleSourceBindingRevisionId, targetOrganizationRevisionId: organization.targetOrganizationRevisionId, previousRevisionId: null, schemaVersion: "TARGET_ROLE_ORGANIZATION_BINDING_REVISION_V1", createdAt: stamp });
  await runtimeValue.binding.createTargetRoleOrganizationBindingRevisionPersister().persist(binding);
  const profile = createTargetRoleProfileRevision({ targetRoleEntityId: "ROLE_T7A", targetRoleOrganizationBindingRevisionId: binding.targetRoleOrganizationBindingRevisionId, previousRevisionId: null, profile: { roleDescriptor: null, roleSemanticDefinition: "Role", responsibilityScope: null, seniorityInterpretation: null, domainContext: null }, proposalState: "PROPOSAL_ONLY", sourceEvidenceState: "SOURCE_MATCH_VERIFIED", semanticValidationState: "NOT_RUN", authorityState: "NONE", schemaVersion: "TARGET_ROLE_PROFILE_REVISION_V1", createdAt: stamp });
  await runtimeValue.profile.createTargetRoleProfileRevisionPersister().persist(profile);
  const requirement = createTargetRequirementRevision({ targetRequirementEntityId: "REQ_T7A", targetRoleProfileRevisionId: profile.targetRoleProfileRevisionId, previousRevisionId: null, requirement: { normalizedStatement: "TypeScript capability", requirementType: "CAPABILITY", capabilityExpression: "TypeScript", structuralDefinition: "Typed programming capability", requiredLevelState: { kind: "NOT_APPLICABLE" }, necessityState: { kind: "REQUIRED" }, scopeContextState: { kind: "NOT_APPLICABLE" } }, evidence: [{ exactQuote: "TypeScript capability" }], sourceEvidenceState: "SOURCE_MATCH_VERIFIED", classificationValidationState: "VALIDATED", semanticInterpretationState: "VALIDATED", requiredLevelValidationState: "NOT_APPLICABLE", necessityValidationState: "SUPPORTED", scopeValidationState: "NOT_APPLICABLE", matchingEligibility: "MATCHING_ELIGIBLE_PROPOSAL_ONLY", proposalState: "PROPOSAL_ONLY", authorityState: "NONE", schemaVersion: "TARGET_REQUIREMENT_REVISION_V1", createdAt: stamp });
  await runtimeValue.requirement.createTargetRequirementRevisionPersister().persist(requirement);
  return { runtimeValue, profile, requirement };
}

describe("T7A PostgreSQL immutable persistence", () => {
  it("persists exact inventory and aggregate state, enforces lineage, and fails closed on physical corruption", async () => {
    const first = await client();
    const seeded = await seed(first.db);
    const phase4 = createPhase4Input("T7A_POSTGRES");
    await seeded.runtimeValue.capability.saveRun(phase4.discoveryRun); await seeded.runtimeValue.capability.saveConvergenceRun(phase4.convergenceRun); await seeded.runtimeValue.capability.saveVerificationRun(phase4.verificationRun);
    const snapshot = await seeded.runtimeValue.capability.createVerifiedCapabilitySnapshotPublisher().publish(phase4);
    const operand = await deriveCandidateCapabilityOperand({ verifiedCapabilitySnapshotId: snapshot.snapshotId, capabilityId: snapshot.capabilities[0].capabilityId }, seeded.runtimeValue.capability);
    const relation = await produceCapabilityRequirementRelation(operand, seeded.requirement, {
      repository: seeded.runtimeValue.relations,
      lineage,
      provider: { execute: async () => ({ rawOutput: "t7a relation raw", evaluation: { candidateCapabilityOperandId: operand.candidateCapabilityOperandId, targetRequirementRevisionId: seeded.requirement.targetRequirementRevisionId, semanticRelation: "SEMANTIC_EQUIVALENT", evidenceAssessment: "EVIDENCE_SUFFICIENT", scopeAssessment: "SCOPE_NOT_APPLICABLE", evidenceBasis: { candidateEvidenceIds: [operand.source.evidenceIds[0]], targetRequirementEvidenceQuotes: [seeded.requirement.evidence[0].exactQuote] } } }) },
      levelPolicy: { version: "level-v1", mapTargetCapabilityLevel: () => null },
      evidencePolicy: { version: "evidence-v1", assess: ({ proposed }) => proposed },
      scopePolicy: { version: "scope-v1", assess: ({ proposed }) => proposed },
      now: () => stamp,
    });
    const inventory = await buildTargetRoleRequirementInventory({ targetRoleProfileRevisionId: seeded.profile.targetRoleProfileRevisionId, requirementInventoryPolicyVersion: "inventory-v1", createdAt: stamp }, { listTargetRequirementRevisionsByTargetRoleProfileRevisionId: seeded.runtimeValue.requirement.listTargetRequirementRevisionsByTargetRoleProfileRevisionId.bind(seeded.runtimeValue.requirement) });
    const storedInventory = await seeded.runtimeValue.inventories.persistInventory(inventory);
    await expect(seeded.runtimeValue.inventories.persistInventory(inventory)).resolves.toEqual(storedInventory);
    await expect(seeded.runtimeValue.inventories.persistInventory({ ...inventory, createdAt: "2026-10-04T00:00:00.000Z" })).rejects.toThrow("IMMUTABLE_CONFLICT");
    const aggregate = await buildRequirementRelationAggregate({ inventory, verifiedCapabilitySnapshotId: snapshot.snapshotId, targetRequirementEntityId: seeded.requirement.targetRequirementEntityId, targetRequirementRevisionId: seeded.requirement.targetRequirementRevisionId, candidateCapabilityOperandIds: [operand.candidateCapabilityOperandId], pairDispositions: [{ candidateCapabilityOperandId: operand.candidateCapabilityOperandId, disposition: "MATERIALIZED_RELATION", capabilityRequirementRelationId: relation.capabilityRequirementRelationId, capabilityRequirementRelationEvaluationResultId: null }], t6bProtocol: protocol, pairInventoryPolicyVersion: "pair-v1", compositionPolicyVersion: "composition-v1", createdAt: stamp }, seeded.runtimeValue.relations);
    const storedAggregate = await seeded.runtimeValue.inventories.persistAggregate(aggregate);
    await expect(seeded.runtimeValue.inventories.persistAggregate(aggregate)).resolves.toEqual(storedAggregate);
    await expect(seeded.runtimeValue.inventories.persistAggregate({ ...aggregate, createdAt: "2026-10-04T00:00:00.000Z" })).rejects.toThrow("IMMUTABLE_CONFLICT");
    storedInventory.failureReasons.push("caller mutation"); storedAggregate.candidateCapabilityOperandIds[0] = "caller mutation";
    expect(await seeded.runtimeValue.inventories.getInventoryById(inventory.targetRoleRequirementInventoryId)).toEqual(inventory);
    expect(await seeded.runtimeValue.inventories.getAggregateById(aggregate.requirementRelationAggregateId)).toEqual(aggregate);
    await expect(first.sql.unsafe(`INSERT INTO requirement_relation_aggregates (requirement_relation_aggregate_id,target_role_requirement_inventory_id,verified_capability_snapshot_id,target_requirement_revision_id,payload) VALUES ('missing-parent','missing-inventory','${snapshot.snapshotId}','${seeded.requirement.targetRequirementRevisionId}','{}'::jsonb)`)).rejects.toMatchObject({ code: "23503" });
    await expect(first.sql.unsafe(`INSERT INTO requirement_relation_aggregates (requirement_relation_aggregate_id,target_role_requirement_inventory_id,verified_capability_snapshot_id,target_requirement_revision_id,payload) VALUES ('missing-target','${inventory.targetRoleRequirementInventoryId}','${snapshot.snapshotId}','missing-target','{}'::jsonb)`)).rejects.toMatchObject({ code: "23503" });
    await expect(first.sql.unsafe(`INSERT INTO requirement_relation_aggregates (requirement_relation_aggregate_id,target_role_requirement_inventory_id,verified_capability_snapshot_id,target_requirement_revision_id,payload) VALUES ('missing-snapshot','${inventory.targetRoleRequirementInventoryId}','missing-snapshot','${seeded.requirement.targetRequirementRevisionId}','{}'::jsonb)`)).rejects.toMatchObject({ code: "23503" });
    await expect(first.sql.unsafe(`INSERT INTO requirement_relation_aggregate_materialized_relations (reference_id,requirement_relation_aggregate_id,candidate_capability_operand_id,capability_requirement_relation_id) VALUES ('bad-materialized','${aggregate.requirementRelationAggregateId}','${operand.candidateCapabilityOperandId}','missing-relation')`)).rejects.toMatchObject({ code: "23503" });
    await expect(first.sql.unsafe(`INSERT INTO requirement_relation_aggregate_failed_results (reference_id,requirement_relation_aggregate_id,candidate_capability_operand_id,capability_requirement_relation_evaluation_result_id) VALUES ('bad-failed','${aggregate.requirementRelationAggregateId}','${operand.candidateCapabilityOperandId}','missing-result')`)).rejects.toMatchObject({ code: "23503" });
    await first.sql.unsafe(`UPDATE target_role_requirement_inventories SET payload = jsonb_set(payload, '{targetRoleProfileRevisionId}', '"corrupt"'::jsonb) WHERE target_role_requirement_inventory_id = $1`, [inventory.targetRoleRequirementInventoryId]);
    await expect(seeded.runtimeValue.inventories.getInventoryById(inventory.targetRoleRequirementInventoryId)).rejects.toThrow("PERSISTENCE_INVALID");
    await close(first.sql);
  });
});
