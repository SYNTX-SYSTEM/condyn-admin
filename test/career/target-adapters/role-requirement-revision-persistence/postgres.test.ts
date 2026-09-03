import { randomBytes } from "node:crypto";
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
import { PostgresTargetRequirementRevisionRepository } from "../../../../lib/career/target-adapters/role-requirement-revision-persistence";
import { targetRequirementRevisions } from "../../../../lib/career/target-adapters/role-requirement-revision-persistence/postgres-schema";
import { PostgresTargetRoleSourceBindingRevisionRepository } from "../../../../lib/career/target-adapters/role-source-binding-revision-persistence";
import { targetRoleSourceBindingRevisions } from "../../../../lib/career/target-adapters/role-source-binding-revision-persistence/postgres-schema";
import { PostgresTargetSourceRevisionRepository } from "../../../../lib/career/target-adapters/source-revision-persistence";
import { targetSourceRevisions } from "../../../../lib/career/target-adapters/source-revision-persistence/postgres-schema";
import { createTargetOrganizationRevision } from "../../../../lib/career/target/organization";
import { createTargetRequirementRevision, createTargetRoleOrganizationBindingRevision, createTargetRoleProfileRevision, createTargetRoleSourceBindingRevision } from "../../../../lib/career/target/role";
import { createTargetSourceRevision } from "../../../../lib/career/target/source";

const url = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/condyn";
const schema = `target_requirement_t5_${randomBytes(8).toString("hex")}`;
let admin: Sql;
const clients = new Set<Sql>();
const configs = [getTableConfig(targetSourceRevisions), getTableConfig(targetOrganizationRevisions), getTableConfig(targetRoleSourceBindingRevisions), getTableConfig(targetRoleOrganizationBindingRevisions), getTableConfig(targetRoleProfileRevisions), getTableConfig(targetRequirementRevisions)];
const q = (value: string) => `"${value}"`;
const table = (config: typeof configs[number]) => `CREATE TABLE ${q(schema)}.${q(config.name)} (${[...config.columns.map(column => `${q(column.name)} ${column.getSQLType()}${column.notNull ? " NOT NULL" : ""}${column.primary ? " PRIMARY KEY" : ""}`), ...config.foreignKeys.map(fk => { const reference = fk.reference(); const foreignTable = getTableConfig(reference.foreignTable).name; return `FOREIGN KEY (${reference.columns.map(column => q(column.name)).join(",")}) REFERENCES ${q(schema)}.${q(foreignTable)} (${reference.foreignColumns.map(column => q(column.name)).join(",")}) ON DELETE ${(fk.onDelete ?? "no action").toUpperCase()}`; })].join(",")})`;
const client = async () => { const sql = postgres(url, { max: 1, onnotice: () => undefined }); clients.add(sql); await sql.unsafe(`SET search_path TO "${schema}"`); return { sql, db: drizzle(sql) }; };
const stamp = "2026-09-03T00:00:00.000Z";

beforeAll(async () => { admin = postgres(url, { max: 1, onnotice: () => undefined }); await admin.unsafe(`CREATE SCHEMA "${schema}"`); for (const config of configs) await admin.unsafe(table(config)); });
afterAll(async () => { await Promise.all([...clients].map(sql => sql.end({ timeout: 5 }))); if (admin) { await admin.unsafe(`DROP SCHEMA "${schema}" CASCADE`); await admin.end({ timeout: 5 }); } });

async function seed(db: any, key: string) {
  const sources = new PostgresTargetSourceRevisionRepository(db), organizations = new PostgresTargetOrganizationRevisionRepository(db);
  const source = createTargetSourceRevision({ targetSourceEntityId: `SOURCE_${key}`, previousRevisionId: null, sourceKind: "DOCUMENT", sourceLocator: `source://${key}`, rawContentHash: "a".repeat(64), normalizedContentHash: "b".repeat(64), normalizedContent: `${key} TypeScript`, normalizationVersion: "v1", schemaVersion: "TARGET_SOURCE_REVISION_V1", createdAt: stamp });
  const organization = createTargetOrganizationRevision({ targetOrganizationEntityId: `ORG_${key}`, previousRevisionId: null, organizationDescriptor: `Org ${key}`, descriptorKind: "DECLARED_NAME", schemaVersion: "TARGET_ORGANIZATION_REVISION_V1", createdAt: stamp });
  await sources.createTargetSourceRevisionPersister().persist(source); await organizations.createTargetOrganizationRevisionPersister().persist(organization);
  const roleSource = createTargetRoleSourceBindingRevision({ targetRoleEntityId: `ROLE_${key}`, targetSourceRevisionId: source.targetSourceRevisionId, previousRevisionId: null, schemaVersion: "TARGET_ROLE_SOURCE_BINDING_REVISION_V1", createdAt: stamp });
  const roleSources = new PostgresTargetRoleSourceBindingRevisionRepository(db, { getTargetSourceRevisionById: sources.getRevisionById.bind(sources) }); await roleSources.createTargetRoleSourceBindingRevisionPersister().persist(roleSource);
  const roleBinding = createTargetRoleOrganizationBindingRevision({ targetRoleEntityId: `ROLE_${key}`, targetRoleSourceBindingRevisionId: roleSource.targetRoleSourceBindingRevisionId, targetOrganizationRevisionId: organization.targetOrganizationRevisionId, previousRevisionId: null, schemaVersion: "TARGET_ROLE_ORGANIZATION_BINDING_REVISION_V1", createdAt: stamp });
  const roleBindings = new PostgresTargetRoleOrganizationBindingRevisionRepository(db, { getTargetRoleSourceBindingRevisionById: roleSources.getRevisionById.bind(roleSources), getTargetOrganizationRevisionById: organizations.getRevisionById.bind(organizations) }); await roleBindings.createTargetRoleOrganizationBindingRevisionPersister().persist(roleBinding);
  const profile = createTargetRoleProfileRevision({ targetRoleEntityId: `ROLE_${key}`, targetRoleOrganizationBindingRevisionId: roleBinding.targetRoleOrganizationBindingRevisionId, previousRevisionId: null, profile: { roleDescriptor: null, roleSemanticDefinition: `Role ${key}`, responsibilityScope: null, seniorityInterpretation: null, domainContext: null }, proposalState: "PROPOSAL_ONLY", sourceEvidenceState: "SOURCE_MATCH_VERIFIED", semanticValidationState: "NOT_RUN", authorityState: "NONE", schemaVersion: "TARGET_ROLE_PROFILE_REVISION_V1", createdAt: stamp });
  const profiles = new PostgresTargetRoleProfileRevisionRepository(db, { getTargetRoleOrganizationBindingRevisionById: roleBindings.getRevisionById.bind(roleBindings), getTargetOrganizationRevisionById: organizations.getRevisionById.bind(organizations) }); await profiles.createTargetRoleProfileRevisionPersister().persist(profile);
  return { organizations, roleBindings, profiles, profile };
}

const requirement = (entityId: string, profileId: string, statement: string, previousRevisionId: string | null = null, createdAt = stamp) => createTargetRequirementRevision({ targetRequirementEntityId: entityId, targetRoleProfileRevisionId: profileId, previousRevisionId, requirement: { normalizedStatement: statement, requirementType: "CAPABILITY", capabilityExpression: "TypeScript", structuralDefinition: null, requiredLevelState: { kind: "CAPABILITY_LEVEL", level: "advanced" }, necessityState: { kind: "REQUIRED" }, scopeContextState: { kind: "NOT_APPLICABLE" } }, evidence: [{ exactQuote: statement }], sourceEvidenceState: "SOURCE_MATCH_VERIFIED", classificationValidationState: "VALIDATED", semanticInterpretationState: "VALIDATED", requiredLevelValidationState: "SUPPORTED", necessityValidationState: "SUPPORTED", scopeValidationState: "NOT_APPLICABLE", matchingEligibility: "MATCHING_ELIGIBLE_PROPOSAL_ONLY", proposalState: "PROPOSAL_ONLY", authorityState: "NONE", schemaVersion: "TARGET_REQUIREMENT_REVISION_V1", createdAt });

describe("PostgreSQL Target Requirement Revision T5", () => {
  it("owns frozen direct columns and only exact profile/self lineage foreign keys", () => { const config = getTableConfig(targetRequirementRevisions); expect(config.columns.map(column => column.name)).toEqual(["target_requirement_revision_id", "target_requirement_entity_id", "target_role_profile_revision_id", "previous_revision_id", "payload"]); expect(config.foreignKeys).toHaveLength(2); expect(config.columns.map(column => column.name).filter(name => /current|latest|head|active|superseded|provider|descriptor|candidate|matching/i.test(name))).toEqual([]); });
  it("persists exact root/replay/child state, rejects divergent payloads, and keeps illegal lineage out of storage", async () => {
    const { sql, db } = await client(); const a = await seed(db, "A"), b = await seed(db, "B");
    const repository = new PostgresTargetRequirementRevisionRepository(db, { getTargetRoleProfileRevisionById: async id => (await a.profiles.getRevisionById(id)) ?? (await b.profiles.getRevisionById(id)), getTargetRoleOrganizationBindingRevisionById: async id => (await a.roleBindings.getRevisionById(id)) ?? (await b.roleBindings.getRevisionById(id)), getTargetOrganizationRevisionById: async id => (await a.organizations.getRevisionById(id)) ?? (await b.organizations.getRevisionById(id)) });
    const persister = repository.createTargetRequirementRevisionPersister(); const root = requirement("REQ_A", a.profile.targetRoleProfileRevisionId, "TypeScript"); await expect(persister.persist(root)).resolves.toEqual(root); await expect(repository.getRevisionById(root.targetRequirementRevisionId)).resolves.toEqual(root); await expect(persister.persist(structuredClone(root))).resolves.toEqual(root);
    const divergent = requirement("REQ_A", a.profile.targetRoleProfileRevisionId, "TypeScript", null, "2030-01-01T00:00:00.000Z"); expect(divergent.targetRequirementRevisionId).toBe(root.targetRequirementRevisionId); await expect(persister.persist(divergent)).rejects.toThrow("ERR_TARGET_REQUIREMENT_REVISION_IMMUTABLE_CONFLICT");
    const child = requirement("REQ_A", a.profile.targetRoleProfileRevisionId, "Advanced TypeScript", root.targetRequirementRevisionId); await expect(persister.persist(child)).resolves.toEqual(child);
    const illegal = requirement("REQ_A", b.profile.targetRoleProfileRevisionId, "TypeScript", root.targetRequirementRevisionId); await expect(persister.persist(illegal)).rejects.toThrow("ERR_TARGET_REQUIREMENT_REVISION_PARENT_INVALID"); await expect(repository.getRevisionById(illegal.targetRequirementRevisionId)).resolves.toBeNull();
    await sql.unsafe(`INSERT INTO target_requirement_revisions (target_requirement_revision_id,target_requirement_entity_id,target_role_profile_revision_id,previous_revision_id,payload) VALUES ($1,$2,$3,NULL,$4::jsonb)`, [`ROW_${root.targetRequirementRevisionId}`, root.targetRequirementEntityId, root.targetRoleProfileRevisionId, JSON.stringify(root)]); await expect(repository.getRevisionById(`ROW_${root.targetRequirementRevisionId}`)).rejects.toThrow("ERR_TARGET_REQUIREMENT_REVISION_POSTGRES_RECORD_INVALID");
    await sql.end({ timeout: 5 }); clients.delete(sql);
  });
  it("enforces exact TargetRoleProfileRevision foreign key", async () => {
    const { sql } = await client(); const payload = JSON.stringify({}); await expect(sql.unsafe(`INSERT INTO target_requirement_revisions VALUES ('TRQREV_MISSING_PROFILE','REQ_X','TRPREV_MISSING',NULL,$1::jsonb)`, [payload])).rejects.toMatchObject({ code: "23503" }); await sql.end({ timeout: 5 }); clients.delete(sql);
  });
  it("enforces exact previous TargetRequirementRevision self-lineage foreign key", async () => {
    const { sql, db } = await client(); const seeded = await seed(db, "FK"); const payload = JSON.stringify({}); await expect(sql.unsafe(`INSERT INTO target_requirement_revisions VALUES ('TRQREV_CHILD_WITH_MISSING_PARENT','REQ_X',$1,'TRQREV_ACTUALLY_MISSING_PARENT',$2::jsonb)`, [seeded.profile.targetRoleProfileRevisionId, payload])).rejects.toMatchObject({ code: "23503" }); await sql.end({ timeout: 5 }); clients.delete(sql);
  });
  it("surfaces a failed mandatory reread as persistence-invalid after real PostgreSQL write", async () => {
    const { sql, db } = await client(); const seeded = await seed(db, "REREAD"); const repository = new PostgresTargetRequirementRevisionRepository(db, { getTargetRoleProfileRevisionById: seeded.profiles.getRevisionById.bind(seeded.profiles), getTargetRoleOrganizationBindingRevisionById: seeded.roleBindings.getRevisionById.bind(seeded.roleBindings), getTargetOrganizationRevisionById: seeded.organizations.getRevisionById.bind(seeded.organizations) }); (repository as any).getRevisionById = async () => null; const persister = repository.createTargetRequirementRevisionPersister(); await expect(persister.persist(requirement("REQ_REREAD", seeded.profile.targetRoleProfileRevisionId, "TypeScript"))).rejects.toThrow("ERR_TARGET_REQUIREMENT_REVISION_PERSISTENCE_INVALID"); await sql.end({ timeout: 5 }); clients.delete(sql);
  });
});
