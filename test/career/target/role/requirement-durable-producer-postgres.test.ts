import { createHash, randomBytes } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import { getTableConfig } from "drizzle-orm/pg-core";
import postgres, { type Sql } from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PostgresTargetOrganizationRevisionRepository } from "../../../../lib/career/target-adapters/organization-revision-persistence";
import { targetOrganizationRevisions } from "../../../../lib/career/target-adapters/organization-revision-persistence/postgres-schema";
import { PostgresTargetRoleOrganizationBindingRevisionRepository } from "../../../../lib/career/target-adapters/role-organization-binding-revision-persistence";
import { targetRoleOrganizationBindingRevisions } from "../../../../lib/career/target-adapters/role-organization-binding-revision-persistence/postgres-schema";
import { PostgresTargetRoleProfileRevisionRepository } from "../../../../lib/career/target-adapters/role-profile-revision-persistence";
import { targetRoleProfileRevisions } from "../../../../lib/career/target-adapters/role-profile-revision-persistence/postgres-schema";
import { PostgresTargetRequirementArtifactRepository } from "../../../../lib/career/target-adapters/role-requirement-artifact-persistence";
import { targetRequirementEntityAdmissions, targetRequirementRawProviderOutputs, targetRequirementReconstructionBatchRuns, targetRequirementReconstructionResults } from "../../../../lib/career/target-adapters/role-requirement-artifact-persistence/postgres-schema";
import { PostgresTargetRequirementRevisionRepository } from "../../../../lib/career/target-adapters/role-requirement-revision-persistence";
import { targetRequirementRevisions } from "../../../../lib/career/target-adapters/role-requirement-revision-persistence/postgres-schema";
import { PostgresTargetRoleSourceBindingRevisionRepository } from "../../../../lib/career/target-adapters/role-source-binding-revision-persistence";
import { targetRoleSourceBindingRevisions } from "../../../../lib/career/target-adapters/role-source-binding-revision-persistence/postgres-schema";
import { PostgresTargetSourceRevisionRepository } from "../../../../lib/career/target-adapters/source-revision-persistence";
import { targetSourceRevisions } from "../../../../lib/career/target-adapters/source-revision-persistence/postgres-schema";
import { createTargetOrganizationRevision } from "../../../../lib/career/target/organization";
import { byteReplayTargetRequirementRevision, createTargetRoleOrganizationBindingRevision, createTargetRoleProfileRevision, createTargetRoleSourceBindingRevision, derivationReplayTargetRequirementResult, providerAuditTargetRequirementBatch, reconstructTargetRequirements, semanticReplayTargetRequirementRevision } from "../../../../lib/career/target/role";
import { createTargetSourceRevision } from "../../../../lib/career/target/source";

const url = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/condyn";
const schema = `target_requirement_restart_t5_${randomBytes(8).toString("hex")}`;
const stamp = "2026-09-03T00:00:00.000Z";
const lineage = { producerVersion: "producer-v1", promptChecksum: "prompt-v1", provider: "bounded-fake", model: "model-v1", outputSchemaVersion: "output-v1", normalizationVersion: "normalization-v1", evidenceAlgorithmVersion: "evidence-v1", requirementOntologyVersion: "ontology-v1", requiredLevelTaxonomyVersion: "levels-v1", necessityPolicyVersion: "necessity-v1", matchingEligibilityPolicyVersion: "eligibility-v1" };
let admin: Sql;
const clients = new Set<Sql>();
const configs = [getTableConfig(targetSourceRevisions), getTableConfig(targetOrganizationRevisions), getTableConfig(targetRoleSourceBindingRevisions), getTableConfig(targetRoleOrganizationBindingRevisions), getTableConfig(targetRoleProfileRevisions), getTableConfig(targetRequirementRevisions), getTableConfig(targetRequirementRawProviderOutputs), getTableConfig(targetRequirementReconstructionBatchRuns), getTableConfig(targetRequirementReconstructionResults), getTableConfig(targetRequirementEntityAdmissions)];
const q = (value: string) => `"${value}"`;
const table = (config: typeof configs[number]) => `CREATE TABLE ${q(schema)}.${q(config.name)} (${[...config.columns.map(column => `${q(column.name)} ${column.getSQLType()}${column.notNull ? " NOT NULL" : ""}${column.primary ? " PRIMARY KEY" : ""}`), ...config.foreignKeys.map(foreignKey => { const reference = foreignKey.reference(); return `FOREIGN KEY (${reference.columns.map(column => q(column.name)).join(",")}) REFERENCES ${q(schema)}.${q(getTableConfig(reference.foreignTable).name)} (${reference.foreignColumns.map(column => q(column.name)).join(",")}) ON DELETE ${(foreignKey.onDelete ?? "no action").toUpperCase()}`; })].join(",")})`;
const client = async () => { const sql = postgres(url, { max: 1, onnotice: () => undefined }); clients.add(sql); await sql.unsafe(`SET search_path TO "${schema}"`); return { sql, db: drizzle(sql) }; };
const close = async (sql: Sql) => { await sql.end({ timeout: 5 }); clients.delete(sql); };

beforeAll(async () => { admin = postgres(url, { max: 1, onnotice: () => undefined }); await admin.unsafe(`CREATE SCHEMA "${schema}"`); for (const config of configs) await admin.unsafe(table(config)); });
afterAll(async () => { await Promise.all([...clients].map(sql => sql.end({ timeout: 5 }))); if (admin) { await admin.unsafe(`DROP SCHEMA "${schema}" CASCADE`); await admin.end({ timeout: 5 }); } });

function runtime(db: any) {
  const sources = new PostgresTargetSourceRevisionRepository(db);
  const organizations = new PostgresTargetOrganizationRevisionRepository(db);
  const roleSources = new PostgresTargetRoleSourceBindingRevisionRepository(db, { getTargetSourceRevisionById: sources.getRevisionById.bind(sources) });
  const roleBindings = new PostgresTargetRoleOrganizationBindingRevisionRepository(db, { getTargetRoleSourceBindingRevisionById: roleSources.getRevisionById.bind(roleSources), getTargetOrganizationRevisionById: organizations.getRevisionById.bind(organizations) });
  const profiles = new PostgresTargetRoleProfileRevisionRepository(db, { getTargetRoleOrganizationBindingRevisionById: roleBindings.getRevisionById.bind(roleBindings), getTargetOrganizationRevisionById: organizations.getRevisionById.bind(organizations) });
  const artifacts = new PostgresTargetRequirementArtifactRepository(db);
  const revisions = new PostgresTargetRequirementRevisionRepository(db, { getTargetRoleProfileRevisionById: profiles.getRevisionById.bind(profiles), getTargetRoleOrganizationBindingRevisionById: roleBindings.getRevisionById.bind(roleBindings), getTargetOrganizationRevisionById: organizations.getRevisionById.bind(organizations) });
  return { sources, organizations, roleSources, roleBindings, profiles, artifacts, revisions };
}

async function seed(db: any, key: string) {
  const repositories = runtime(db);
  const source = createTargetSourceRevision({ targetSourceEntityId: `SOURCE_${key}`, previousRevisionId: null, sourceKind: "DOCUMENT", sourceLocator: `source://${key}`, rawContentHash: "a".repeat(64), normalizedContentHash: "b".repeat(64), normalizedContent: `${key} TypeScript`, normalizationVersion: "v1", schemaVersion: "TARGET_SOURCE_REVISION_V1", createdAt: stamp });
  const organization = createTargetOrganizationRevision({ targetOrganizationEntityId: `ORG_${key}`, previousRevisionId: null, organizationDescriptor: `Organization ${key}`, descriptorKind: "DECLARED_NAME", schemaVersion: "TARGET_ORGANIZATION_REVISION_V1", createdAt: stamp });
  await repositories.sources.createTargetSourceRevisionPersister().persist(source);
  await repositories.organizations.createTargetOrganizationRevisionPersister().persist(organization);
  const roleSource = createTargetRoleSourceBindingRevision({ targetRoleEntityId: `ROLE_${key}`, targetSourceRevisionId: source.targetSourceRevisionId, previousRevisionId: null, schemaVersion: "TARGET_ROLE_SOURCE_BINDING_REVISION_V1", createdAt: stamp });
  await repositories.roleSources.createTargetRoleSourceBindingRevisionPersister().persist(roleSource);
  const roleBinding = createTargetRoleOrganizationBindingRevision({ targetRoleEntityId: `ROLE_${key}`, targetRoleSourceBindingRevisionId: roleSource.targetRoleSourceBindingRevisionId, targetOrganizationRevisionId: organization.targetOrganizationRevisionId, previousRevisionId: null, schemaVersion: "TARGET_ROLE_ORGANIZATION_BINDING_REVISION_V1", createdAt: stamp });
  await repositories.roleBindings.createTargetRoleOrganizationBindingRevisionPersister().persist(roleBinding);
  const profile = createTargetRoleProfileRevision({ targetRoleEntityId: `ROLE_${key}`, targetRoleOrganizationBindingRevisionId: roleBinding.targetRoleOrganizationBindingRevisionId, previousRevisionId: null, profile: { roleDescriptor: null, roleSemanticDefinition: `Role ${key}`, responsibilityScope: null, seniorityInterpretation: null, domainContext: null }, proposalState: "PROPOSAL_ONLY", sourceEvidenceState: "SOURCE_MATCH_VERIFIED", semanticValidationState: "NOT_RUN", authorityState: "NONE", schemaVersion: "TARGET_ROLE_PROFILE_REVISION_V1", createdAt: stamp });
  await repositories.profiles.createTargetRoleProfileRevisionPersister().persist(profile);
  return { profile };
}

describe("T5 durable producer PostgreSQL process-restart composition", () => {
  it("persists through the active producer and reconnects exact durable replay state after fresh PostgreSQL instances", async () => {
    const first = await client();
    const seeded = await seed(first.db, "RESTART");
    const initial = runtime(first.db);
    const revisionPersister = initial.revisions.createTargetRequirementRevisionPersister();
    let providerCalls = 0;
    const produced = await reconstructTargetRequirements([seeded.profile.targetRoleProfileRevisionId], {
      lineage,
      artifacts: initial.artifacts,
      getProfile: initial.profiles.getRevisionById.bind(initial.profiles),
      getBinding: initial.roleBindings.getRevisionById.bind(initial.roleBindings),
      getRoleSourceBinding: initial.roleSources.getRevisionById.bind(initial.roleSources),
      getSource: initial.sources.getRevisionById.bind(initial.sources),
      getOrganization: initial.organizations.getRevisionById.bind(initial.organizations),
      provider: { execute: async () => { providerCalls++; return { rawOutput: "raw provider TypeScript", envelopes: [{ targetRoleProfileRevisionId: seeded.profile.targetRoleProfileRevisionId, requirements: [{ requirement: { normalizedStatement: "TypeScript", requirementType: "CAPABILITY", capabilityExpression: "TypeScript", structuralDefinition: null, requiredLevelState: { kind: "NOT_APPLICABLE" }, necessityState: { kind: "REQUIRED" }, scopeContextState: { kind: "NOT_APPLICABLE" } }, evidence: [{ exactQuote: "TypeScript" }] }] }] }; } },
      admissionFor: async () => ({ admissionState: "NEW_ENTITY_ADMITTED" as const, targetRequirementEntityId: "REQ_RESTART", previousRevisionId: null, admissionPolicyVersion: "admission-v1", admittedByActorRef: "test-actor", createdAt: stamp }),
      persistRevision: revisionPersister.persist.bind(revisionPersister),
      now: () => stamp
    });
    expect(providerCalls).toBe(1);
    expect(produced.revisions).toHaveLength(1);
    const ids = { revision: produced.revisions[0].targetRequirementRevisionId, admission: produced.admissions[0].targetRequirementEntityAdmissionId, result: produced.results[0].targetRequirementReconstructionResultId, batch: produced.batch.targetRequirementReconstructionBatchRunId, raw: produced.raw.rawProviderOutputRef };
    await close(first.sql);

    const second = await client();
    const restarted = runtime(second.db);
    const revision = await restarted.revisions.getRevisionById(ids.revision);
    const admission = await restarted.artifacts.getAdmissionById(ids.admission);
    const result = await restarted.artifacts.getResultById(ids.result);
    const batch = await restarted.artifacts.getBatchRunById(ids.batch);
    const raw = await restarted.artifacts.getRawProviderOutputByRef(ids.raw);
    expect(revision).not.toBeNull();
    expect(admission).not.toBeNull();
    expect(result).not.toBeNull();
    expect(batch).not.toBeNull();
    expect(raw).not.toBeNull();
    expect(admission!.targetRequirementReconstructionResultId).toBe(result!.targetRequirementReconstructionResultId);
    expect(result!.targetRequirementReconstructionBatchRunId).toBe(batch!.targetRequirementReconstructionBatchRunId);
    expect(result!.targetRoleProfileRevisionId).toBe(revision!.targetRoleProfileRevisionId);
    expect(revision!.targetRequirementEntityId).toBe(admission!.targetRequirementEntityId);
    expect(batch!.rawProviderOutputRef).toBe(raw!.rawProviderOutputRef);
    expect(batch!.rawProviderOutputHash).toBe(raw!.rawProviderOutputHash);
    expect(createHash("sha256").update(raw!.rawProviderOutput, "utf8").digest("hex")).toBe(raw!.rawProviderOutputHash);
    const replay = { getRawProviderOutputByRef: restarted.artifacts.getRawProviderOutputByRef.bind(restarted.artifacts), getBatchRunById: restarted.artifacts.getBatchRunById.bind(restarted.artifacts), getResultById: restarted.artifacts.getResultById.bind(restarted.artifacts), getAdmissionById: restarted.artifacts.getAdmissionById.bind(restarted.artifacts), persistRawProviderOutput: restarted.artifacts.persistRawProviderOutput.bind(restarted.artifacts), persistBatchRun: restarted.artifacts.persistBatchRun.bind(restarted.artifacts), persistResult: restarted.artifacts.persistResult.bind(restarted.artifacts), persistAdmission: restarted.artifacts.persistAdmission.bind(restarted.artifacts), getRevisionById: restarted.revisions.getRevisionById.bind(restarted.revisions) };
    await expect(byteReplayTargetRequirementRevision(ids.revision, replay)).resolves.toEqual(revision);
    await expect(semanticReplayTargetRequirementRevision({ historicalRevisionId: ids.revision, targetRequirementReconstructionResultId: ids.result, targetRequirementEntityAdmissionId: ids.admission }, replay)).resolves.toEqual(revision);
    await expect(derivationReplayTargetRequirementResult({ targetRequirementReconstructionBatchRunId: ids.batch, targetRequirementReconstructionResultId: ids.result }, replay, new Map([[lineage.normalizationVersion, { version: lineage.normalizationVersion, derive: async input => { expect(input.rawProviderOutput).toBe(raw!.rawProviderOutput); return result!; } }]]))).resolves.toEqual(result);
    await expect(providerAuditTargetRequirementBatch(ids.batch, replay)).resolves.toBe(raw!.rawProviderOutput);
    expect(providerCalls).toBe(1);
    expect(revision!.proposalState).toBe("PROPOSAL_ONLY");
    expect(revision!.authorityState).toBe("NONE");
    expect(revision!.matchingEligibility).toBe("MATCHING_ELIGIBLE_PROPOSAL_ONLY");
    await second.sql.unsafe(`UPDATE target_requirement_raw_provider_outputs SET payload = jsonb_set(payload, '{rawProviderOutputHash}', '"${"0".repeat(64)}"'::jsonb) WHERE raw_provider_output_ref = $1`, [ids.raw]);
    await expect(providerAuditTargetRequirementBatch(ids.batch, replay)).rejects.toThrow("ERR_TARGET_REQUIREMENT_ARTIFACT_PERSISTENCE_INVALID");
    await close(second.sql);
  });
});
