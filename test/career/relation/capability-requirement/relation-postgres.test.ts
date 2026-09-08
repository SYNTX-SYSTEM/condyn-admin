import { randomBytes } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import { getTableConfig } from "drizzle-orm/pg-core";
import postgres, { type Sql } from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PostgresCapabilityCoreRepository, deriveCandidateCapabilityOperand } from "../../../../lib/career/capability-core";
import { careerCapabilityRuns, careerCapabilitySnapshots } from "../../../../lib/career/db/schema";
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
import { PostgresCapabilityRequirementRelationRepository } from "../../../../lib/career/relation-adapters/capability-requirement-persistence";
import { capabilityRequirementRelationEvaluationResults, capabilityRequirementRelationEvaluationRuns, capabilityRequirementRelationRawProviderOutputs, capabilityRequirementRelations } from "../../../../lib/career/relation-adapters/capability-requirement-persistence/postgres-schema";
import { byteReplayCapabilityRequirementRelation, derivationReplayCapabilityRequirementRelation, produceCapabilityRequirementRelation, providerAuditCapabilityRequirementRelationRun, semanticReplayCapabilityRequirementRelation } from "../../../../lib/career/relation/capability-requirement";
import { createTargetOrganizationRevision } from "../../../../lib/career/target/organization";
import { createTargetRoleOrganizationBindingRevision, createTargetRoleProfileRevision, createTargetRoleSourceBindingRevision } from "../../../../lib/career/target/role";
import { createTargetRequirementRevision } from "../../../../lib/career/target/role/requirement";
import { createTargetSourceRevision } from "../../../../lib/career/target/source";
import { createPhase4Input } from "../../capability-core/relation-operand/phase4-fixture";

const url = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/condyn";
const schema = `capability_requirement_relation_t6b_${randomBytes(8).toString("hex")}`;
const stamp = "2026-09-04T00:00:00.000Z";
const lineage = { relationProducerVersion: "relation-producer-v1", requirementAdmissionPolicyVersion: "admission-v1", semanticPolicyVersion: "semantic-v1", levelPolicyVersion: "level-v1", scopePolicyVersion: "scope-v1", evidencePolicyVersion: "evidence-v1", promptChecksum: "prompt-v1", provider: "bounded-fake", model: "model-v1", outputSchemaVersion: "output-v1" };
let admin: Sql; const clients = new Set<Sql>();
const configs = [getTableConfig(careerCapabilityRuns), getTableConfig(careerCapabilitySnapshots), getTableConfig(targetSourceRevisions), getTableConfig(targetOrganizationRevisions), getTableConfig(targetRoleSourceBindingRevisions), getTableConfig(targetRoleOrganizationBindingRevisions), getTableConfig(targetRoleProfileRevisions), getTableConfig(targetRequirementRevisions), getTableConfig(capabilityRequirementRelationRawProviderOutputs), getTableConfig(capabilityRequirementRelationEvaluationRuns), getTableConfig(capabilityRequirementRelationEvaluationResults), getTableConfig(capabilityRequirementRelations)];
const quote = (value: string) => `"${value}"`;
const ddl = (config: typeof configs[number]) => `CREATE TABLE ${quote(schema)}.${quote(config.name)} (${[...config.columns.map(column => `${quote(column.name)} ${column.getSQLType()}${column.notNull ? " NOT NULL" : ""}${column.primary ? " PRIMARY KEY" : ""}`), ...config.foreignKeys.map(foreignKey => { const reference = foreignKey.reference(); return `FOREIGN KEY (${reference.columns.map(column => quote(column.name)).join(",")}) REFERENCES ${quote(schema)}.${quote(getTableConfig(reference.foreignTable).name)} (${reference.foreignColumns.map(column => quote(column.name)).join(",")}) ON DELETE ${(foreignKey.onDelete ?? "no action").toUpperCase()}`; })].join(",")})`;
const client = async () => { const sql = postgres(url, { max: 1, onnotice: () => undefined }); clients.add(sql); await sql.unsafe(`SET search_path TO "${schema}"`); return { sql, db: drizzle(sql) }; };
const close = async (sql: Sql) => { await sql.end({ timeout: 5 }); clients.delete(sql); };
beforeAll(async () => { admin = postgres(url, { max: 1, onnotice: () => undefined }); await admin.unsafe(`CREATE SCHEMA "${schema}"`); for (const config of configs) await admin.unsafe(ddl(config)); });
afterAll(async () => { await Promise.all([...clients].map(sql => sql.end({ timeout: 5 }))); if (admin) { await admin.unsafe(`DROP SCHEMA "${schema}" CASCADE`); await admin.end({ timeout: 5 }); } });

function runtime(db: any) { const source = new PostgresTargetSourceRevisionRepository(db), organization = new PostgresTargetOrganizationRevisionRepository(db), roleSource = new PostgresTargetRoleSourceBindingRevisionRepository(db, { getTargetSourceRevisionById: source.getRevisionById.bind(source) }), binding = new PostgresTargetRoleOrganizationBindingRevisionRepository(db, { getTargetRoleSourceBindingRevisionById: roleSource.getRevisionById.bind(roleSource), getTargetOrganizationRevisionById: organization.getRevisionById.bind(organization) }), profile = new PostgresTargetRoleProfileRevisionRepository(db, { getTargetRoleOrganizationBindingRevisionById: binding.getRevisionById.bind(binding), getTargetOrganizationRevisionById: organization.getRevisionById.bind(organization) }), requirement = new PostgresTargetRequirementRevisionRepository(db, { getTargetRoleProfileRevisionById: profile.getRevisionById.bind(profile), getTargetRoleOrganizationBindingRevisionById: binding.getRevisionById.bind(binding), getTargetOrganizationRevisionById: organization.getRevisionById.bind(organization) }); return { source, organization, roleSource, binding, profile, requirement, capability: new PostgresCapabilityCoreRepository(db), relations: new PostgresCapabilityRequirementRelationRepository(db) }; }
async function seed(db: any) { const r = runtime(db); const source = createTargetSourceRevision({ targetSourceEntityId: "SOURCE_T6B", previousRevisionId: null, sourceKind: "DOCUMENT", sourceLocator: "source://t6b", rawContentHash: "a".repeat(64), normalizedContentHash: "b".repeat(64), normalizedContent: "TypeScript capability", normalizationVersion: "v1", schemaVersion: "TARGET_SOURCE_REVISION_V1", createdAt: stamp }); const organization = createTargetOrganizationRevision({ targetOrganizationEntityId: "ORG_T6B", previousRevisionId: null, organizationDescriptor: "Org", descriptorKind: "DECLARED_NAME", schemaVersion: "TARGET_ORGANIZATION_REVISION_V1", createdAt: stamp }); await r.source.createTargetSourceRevisionPersister().persist(source); await r.organization.createTargetOrganizationRevisionPersister().persist(organization); const roleSource = createTargetRoleSourceBindingRevision({ targetRoleEntityId: "ROLE_T6B", targetSourceRevisionId: source.targetSourceRevisionId, previousRevisionId: null, schemaVersion: "TARGET_ROLE_SOURCE_BINDING_REVISION_V1", createdAt: stamp }); await r.roleSource.createTargetRoleSourceBindingRevisionPersister().persist(roleSource); const binding = createTargetRoleOrganizationBindingRevision({ targetRoleEntityId: "ROLE_T6B", targetRoleSourceBindingRevisionId: roleSource.targetRoleSourceBindingRevisionId, targetOrganizationRevisionId: organization.targetOrganizationRevisionId, previousRevisionId: null, schemaVersion: "TARGET_ROLE_ORGANIZATION_BINDING_REVISION_V1", createdAt: stamp }); await r.binding.createTargetRoleOrganizationBindingRevisionPersister().persist(binding); const profile = createTargetRoleProfileRevision({ targetRoleEntityId: "ROLE_T6B", targetRoleOrganizationBindingRevisionId: binding.targetRoleOrganizationBindingRevisionId, previousRevisionId: null, profile: { roleDescriptor: null, roleSemanticDefinition: "Role", responsibilityScope: null, seniorityInterpretation: null, domainContext: null }, proposalState: "PROPOSAL_ONLY", sourceEvidenceState: "SOURCE_MATCH_VERIFIED", semanticValidationState: "NOT_RUN", authorityState: "NONE", schemaVersion: "TARGET_ROLE_PROFILE_REVISION_V1", createdAt: stamp }); await r.profile.createTargetRoleProfileRevisionPersister().persist(profile); const revision = createTargetRequirementRevision({ targetRequirementEntityId: "REQ_T6B", targetRoleProfileRevisionId: profile.targetRoleProfileRevisionId, previousRevisionId: null, requirement: { normalizedStatement: "TypeScript capability", requirementType: "CAPABILITY", capabilityExpression: "TypeScript", structuralDefinition: "Typed programming capability", requiredLevelState: { kind: "NOT_APPLICABLE" }, necessityState: { kind: "REQUIRED" }, scopeContextState: { kind: "NOT_APPLICABLE" } }, evidence: [{ exactQuote: "TypeScript capability" }], sourceEvidenceState: "SOURCE_MATCH_VERIFIED", classificationValidationState: "VALIDATED", semanticInterpretationState: "VALIDATED", requiredLevelValidationState: "NOT_APPLICABLE", necessityValidationState: "SUPPORTED", scopeValidationState: "NOT_APPLICABLE", matchingEligibility: "MATCHING_ELIGIBLE_PROPOSAL_ONLY", proposalState: "PROPOSAL_ONLY", authorityState: "NONE", schemaVersion: "TARGET_REQUIREMENT_REVISION_V1", createdAt: stamp }); await r.requirement.createTargetRequirementRevisionPersister().persist(revision); return { r, revision }; }

describe("T6B PostgreSQL process-restart composition", () => {
  it("persists the active relation chain and replays it from fresh PostgreSQL repositories without another provider call", async () => {
    const first = await client();
    const seeded = await seed(first.db);
    const phase4 = createPhase4Input("T6B_POSTGRES");
    await seeded.r.capability.saveRun(phase4.discoveryRun);
    await seeded.r.capability.saveConvergenceRun(phase4.convergenceRun);
    await seeded.r.capability.saveVerificationRun(phase4.verificationRun);
    const snapshot = await seeded.r.capability.createVerifiedCapabilitySnapshotPublisher().publish(phase4);
    const operand = await deriveCandidateCapabilityOperand({ verifiedCapabilitySnapshotId: snapshot.snapshotId, capabilityId: snapshot.capabilities[0].capabilityId }, seeded.r.capability);
    let calls = 0;
    const relation = await produceCapabilityRequirementRelation(operand, seeded.revision, {
      repository: seeded.r.relations,
      lineage,
      provider: { execute: async () => {
        calls += 1;
        return {
          rawOutput: "historical relation raw",
          evaluation: {
            candidateCapabilityOperandId: operand.candidateCapabilityOperandId,
            targetRequirementRevisionId: seeded.revision.targetRequirementRevisionId,
            semanticRelation: "SEMANTIC_EQUIVALENT",
            evidenceAssessment: "EVIDENCE_SUFFICIENT",
            scopeAssessment: "SCOPE_NOT_APPLICABLE",
            evidenceBasis: { candidateEvidenceIds: [operand.source.evidenceIds[0]], targetRequirementEvidenceQuotes: [seeded.revision.evidence[0].exactQuote] }
          }
        };
      } },
      levelPolicy: { version: "level-v1", mapTargetCapabilityLevel: () => null },
      evidencePolicy: { version: "evidence-v1", assess: ({ proposed }) => proposed },
      scopePolicy: { version: "scope-v1", assess: ({ proposed }) => proposed },
      now: () => stamp
    });
    expect(calls).toBe(1);
    const result = await seeded.r.relations.getResultById(relation.lineage.capabilityRequirementRelationEvaluationResultId);
    const run = await seeded.r.relations.getRunById(result!.capabilityRequirementRelationEvaluationRunId);
    const ids = { relation: relation.capabilityRequirementRelationId, result: result!.capabilityRequirementRelationEvaluationResultId, run: run!.capabilityRequirementRelationEvaluationRunId, raw: run!.rawProviderOutputRef!, snapshot: snapshot.snapshotId, capability: operand.identity.capabilityId, requirement: seeded.revision.targetRequirementRevisionId };
    await close(first.sql);
    const second = await client();
    const restarted = runtime(second.db);
    const replay: any = { getRawProviderOutputByRef: restarted.relations.getRawProviderOutputByRef.bind(restarted.relations), getRunById: restarted.relations.getRunById.bind(restarted.relations), getResultById: restarted.relations.getResultById.bind(restarted.relations), getRelationById: restarted.relations.getRelationById.bind(restarted.relations), resolveCandidate: async ({ verifiedCapabilitySnapshotId, capabilityId }: any) => deriveCandidateCapabilityOperand({ verifiedCapabilitySnapshotId, capabilityId }, restarted.capability), getTargetRequirementRevisionById: restarted.requirement.getRevisionById.bind(restarted.requirement) };
    const durable = await restarted.relations.getRelationById(ids.relation);
    const durableResult = await restarted.relations.getResultById(ids.result);
    const durableRun = await restarted.relations.getRunById(ids.run);
    const durableRaw = await restarted.relations.getRawProviderOutputByRef(ids.raw);
    expect(durable).not.toBeNull(); expect(durableResult).not.toBeNull(); expect(durableRun).not.toBeNull(); expect(durableRaw).not.toBeNull();
    const replayedOperand = await replay.resolveCandidate({ verifiedCapabilitySnapshotId: ids.snapshot, capabilityId: ids.capability });
    expect(replayedOperand.candidateCapabilityOperandId).toBe(operand.candidateCapabilityOperandId);
    expect(durable!.operands.targetRequirementRevisionId).toBe(ids.requirement);
    await expect(byteReplayCapabilityRequirementRelation(ids.relation, replay)).resolves.toEqual(durable);
    await expect(semanticReplayCapabilityRequirementRelation(ids.relation, replay)).resolves.toEqual(durable);
    await expect(providerAuditCapabilityRequirementRelationRun(ids.run, replay)).resolves.toBe("historical relation raw");
    await expect(derivationReplayCapabilityRequirementRelation(ids.relation, replay, new Map([[lineage.relationProducerVersion, { version: lineage.relationProducerVersion, policyVersions: { requirementAdmissionPolicyVersion: lineage.requirementAdmissionPolicyVersion, semanticPolicyVersion: lineage.semanticPolicyVersion, levelPolicyVersion: lineage.levelPolicyVersion, scopePolicyVersion: lineage.scopePolicyVersion, evidencePolicyVersion: lineage.evidencePolicyVersion }, derive: async () => durableResult! }]]))).resolves.toEqual(durableResult);
    expect(calls).toBe(1); expect(durable!.proposalState).toBe("PROPOSAL_ONLY"); expect(durable!.authorityState).toBe("NONE");
    await second.sql.unsafe(`UPDATE capability_requirement_relation_raw_provider_outputs SET payload = jsonb_set(payload, '{rawProviderOutputHash}', '"${"0".repeat(64)}"'::jsonb) WHERE raw_provider_output_ref = $1`, [ids.raw]);
    await expect(providerAuditCapabilityRequirementRelationRun(ids.run, replay)).rejects.toThrow("PERSISTENCE_INVALID");
    await close(second.sql);
  });
});
