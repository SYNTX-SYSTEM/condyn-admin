import { randomBytes } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import { getTableConfig } from "drizzle-orm/pg-core";
import postgres, { type Sql } from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as targetOrganizationCore from "../../../../lib/career/target/organization";
import * as targetOrganizationPostgresAdapter from "../../../../lib/career/target-adapters/organization-revision-persistence";
import {
  PostgresTargetOrganizationRevisionRepository
} from "../../../../lib/career/target-adapters/organization-revision-persistence";
import {
  targetOrganizationRevisions
} from "../../../../lib/career/target-adapters/organization-revision-persistence/postgres-schema";
import {
  createTargetOrganizationRevision,
  type TargetOrganizationRevision
} from "../../../../lib/career/target/organization";

const databaseUrl = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/condyn";
const schemaName = `target_organization_t1_${randomBytes(10).toString("hex")}`;
const clients = new Set<Sql>();
let admin: Sql;
const productionSchema = getTableConfig(targetOrganizationRevisions);
const productionForeignKey = productionSchema.foreignKeys[0];

const quoteIdentifier = (value: string): string => `"${value.replaceAll('"', '""')}"`;
const productionCreateTableSql = (): string => {
  if (productionForeignKey === undefined) throw new Error("expected Target Organization self foreign key");
  const reference = productionForeignKey.reference();
  const columns = productionSchema.columns.map((column) =>
    `${quoteIdentifier(column.name)} ${column.getSQLType()}${column.notNull ? " NOT NULL" : ""}${column.primary ? " PRIMARY KEY" : ""}`
  );
  const foreignKey = `FOREIGN KEY (${reference.columns.map((column) => quoteIdentifier(column.name)).join(", ")}) REFERENCES ${quoteIdentifier(schemaName)}.${quoteIdentifier(productionSchema.name)} (${reference.foreignColumns.map((column) => quoteIdentifier(column.name)).join(", ")}) ON DELETE ${(productionForeignKey.onDelete ?? "no action").toUpperCase()}`;
  return `CREATE TABLE ${quoteIdentifier(schemaName)}.${quoteIdentifier(productionSchema.name)} (${[...columns, foreignKey].join(", ")})`;
};

const createClient = async () => {
  const client = postgres(databaseUrl, { max: 1, onnotice: () => undefined });
  clients.add(client);
  await client.unsafe(`SET search_path TO "${schemaName}"`);
  return { client, db: drizzle(client) };
};

const closeClient = async (client: Sql): Promise<void> => {
  clients.delete(client);
  await client.end({ timeout: 5 });
};

const revision = (input: Partial<{
  targetOrganizationEntityId: string;
  previousRevisionId: string | null;
  organizationDescriptor: string;
  createdAt: string;
}> = {}) => createTargetOrganizationRevision({
  targetOrganizationEntityId: "TARGET_ORGANIZATION_ENTITY_POSTGRES",
  previousRevisionId: null,
  organizationDescriptor: "Siemens AG",
  descriptorKind: "DECLARED_NAME",
  schemaVersion: "TARGET_ORGANIZATION_REVISION_V1",
  createdAt: "2026-09-02T00:00:00.000Z",
  ...input
});

const sourceFiles = (directory: string): string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? sourceFiles(join(directory, entry.name)) : entry.name.endsWith(".ts") ? [join(directory, entry.name)] : []
  );

beforeAll(async () => {
  admin = postgres(databaseUrl, { max: 1, onnotice: () => undefined });
  await admin.unsafe(`CREATE SCHEMA "${schemaName}"`);
  await admin.unsafe(productionCreateTableSql());
});

afterAll(async () => {
  await Promise.all([...clients].map((client) => client.end({ timeout: 5 })));
  await admin.unsafe(`DROP SCHEMA "${schemaName}" CASCADE`);
  await admin.end({ timeout: 5 });
});

describe("PostgreSQL Target Organization Revision persistence T2", () => {
  it("places PostgreSQL infrastructure outside Target Organization core", () => {
    expect(PostgresTargetOrganizationRevisionRepository).toBeTypeOf("function");
    const coreSources = sourceFiles(resolve(process.cwd(), "lib/career/target/organization"));
    expect(coreSources.filter((file) => /from\s+["'][^"']*(drizzle|postgres|database|\/db|target-adapters|capability-core|decision-core|decision-adapters|matching|recommendations)[^"']*["']/.test(readFileSync(file, "utf8")))).toEqual([]);
    expect(Object.keys(targetOrganizationCore).filter((name) => [
      "PostgresTargetOrganizationRevisionRepository", "targetOrganizationRevisions", "writeRevision",
      "saveRevision", "CurrentRevision", "LatestRevision", "HeadRevision", "ActiveRevision"
    ].includes(name))).toEqual([]);
    expect(targetOrganizationPostgresAdapter).not.toHaveProperty("targetOrganizationRevisions");
  });

  it("uses the actual production Drizzle schema as the frozen physical table contract", async () => {
    expect(productionSchema.name).toBe("target_organization_revisions");
    expect(productionSchema.columns.map((column) => ({
      name: column.name, notNull: column.notNull, primary: column.primary,
      unique: column.isUnique, sqlType: column.getSQLType()
    }))).toEqual([
      { name: "target_organization_revision_id", notNull: true, primary: true, unique: false, sqlType: "text" },
      { name: "target_organization_entity_id", notNull: true, primary: false, unique: false, sqlType: "text" },
      { name: "previous_revision_id", notNull: false, primary: false, unique: false, sqlType: "text" },
      { name: "payload", notNull: true, primary: false, unique: false, sqlType: "jsonb" }
    ]);
    expect(productionSchema.uniqueConstraints).toEqual([]);
    expect(productionForeignKey?.onDelete).toBe("restrict");
    expect(productionForeignKey?.reference().columns.map((column) => column.name)).toEqual(["previous_revision_id"]);
    expect(productionForeignKey?.reference().foreignColumns.map((column) => column.name)).toEqual(["target_organization_revision_id"]);
    const columns = await admin.unsafe(`SELECT column_name, is_nullable, data_type FROM information_schema.columns WHERE table_schema = '${schemaName}' AND table_name = 'target_organization_revisions' ORDER BY column_name`);
    expect(columns).toEqual([
      { column_name: "payload", is_nullable: "NO", data_type: "jsonb" },
      { column_name: "previous_revision_id", is_nullable: "YES", data_type: "text" },
      { column_name: "target_organization_entity_id", is_nullable: "NO", data_type: "text" },
      { column_name: "target_organization_revision_id", is_nullable: "NO", data_type: "text" }
    ]);
    const names = productionSchema.columns.map((column) => column.name);
    expect(names.filter((name) => ["current_revision_id", "latest_revision_id", "head_revision_id", "active_revision_id", "superseded_by_revision_id"].includes(name))).toEqual([]);
  });

  it("has no runtime-callable raw writer and persists roots through detached exact rereads", async () => {
    const { client, db } = await createClient();
    const repository = new PostgresTargetOrganizationRevisionRepository(db) as unknown as Record<string, unknown>;
    for (const name of ["writeRevision", "saveRevision", "putRevision", "replaceRevision", "updateRevision", "deleteRevision"]) {
      expect(name in repository).toBe(false);
      expect(typeof repository[name]).not.toBe("function");
    }
    const value = revision();
    const persisted = await (repository as unknown as PostgresTargetOrganizationRevisionRepository).createTargetOrganizationRevisionPersister().persist(value);
    expect(persisted).toEqual(value);
    persisted.organizationDescriptor = "Mutated returned object.";
    expect(await (repository as unknown as PostgresTargetOrganizationRevisionRepository).getRevisionById(value.targetOrganizationRevisionId)).toEqual(value);
    await closeClient(client);
  });

  it("uses PostgreSQL uniqueness for identical and divergent concurrent revision writes", async () => {
    const first = await createClient();
    const second = await createClient();
    const value = revision({ organizationDescriptor: "Concurrent Organization" });
    const left = new PostgresTargetOrganizationRevisionRepository(first.db).createTargetOrganizationRevisionPersister();
    const right = new PostgresTargetOrganizationRevisionRepository(second.db).createTargetOrganizationRevisionPersister();

    await expect(Promise.all([left.persist(value), right.persist(structuredClone(value))])).resolves.toEqual([value, value]);
    const count = await first.client.unsafe(`SELECT count(*)::int AS count FROM target_organization_revisions WHERE target_organization_revision_id = $1`, [value.targetOrganizationRevisionId]);
    expect(count[0].count).toBe(1);

    const sameIdentityDifferentAudit = revision({ organizationDescriptor: "Race Organization", createdAt: "2030-01-01T00:00:00.000Z" });
    const sameIdentityEarlierAudit = revision({ organizationDescriptor: "Race Organization", createdAt: "2020-01-01T00:00:00.000Z" });
    expect(sameIdentityDifferentAudit.targetOrganizationRevisionId).toBe(sameIdentityEarlierAudit.targetOrganizationRevisionId);
    expect(sameIdentityDifferentAudit).not.toEqual(sameIdentityEarlierAudit);
    const results = await Promise.allSettled([left.persist(sameIdentityDifferentAudit), right.persist(sameIdentityEarlierAudit)]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected" && String(result.reason).includes("ERR_TARGET_ORGANIZATION_REVISION_IMMUTABLE_CONFLICT"))).toHaveLength(1);
    await closeClient(first.client);
    await closeClient(second.client);
  });

  it("rejects malformed or physically mismatched durable rows", async () => {
    const { client, db } = await createClient();
    const repository = new PostgresTargetOrganizationRevisionRepository(db);
    const value = revision({ organizationDescriptor: "Mismatch Organization" });
    await client.unsafe(
      `INSERT INTO target_organization_revisions (target_organization_revision_id, target_organization_entity_id, previous_revision_id, payload) VALUES ($1, $2, NULL, $3::jsonb)`,
      [`ROW_${value.targetOrganizationRevisionId}`, value.targetOrganizationEntityId, JSON.stringify(value)]
    );
    await expect(repository.getRevisionById(`ROW_${value.targetOrganizationRevisionId}`)).rejects.toThrow("ERR_TARGET_ORGANIZATION_REVISION_POSTGRES_RECORD_INVALID");

    const entityMismatch = revision({ organizationDescriptor: "Entity Mismatch Organization" });
    await client.unsafe(
      `INSERT INTO target_organization_revisions (target_organization_revision_id, target_organization_entity_id, previous_revision_id, payload) VALUES ($1, $2, NULL, $3::jsonb)`,
      [entityMismatch.targetOrganizationRevisionId, "TARGET_ORGANIZATION_ENTITY_ROW_MISMATCH", JSON.stringify(entityMismatch)]
    );
    await expect(repository.getRevisionById(entityMismatch.targetOrganizationRevisionId)).rejects.toThrow("ERR_TARGET_ORGANIZATION_REVISION_POSTGRES_RECORD_INVALID");

    const malformedId = revision({ organizationDescriptor: "Malformed Organization" }).targetOrganizationRevisionId;
    await client.unsafe(
      `INSERT INTO target_organization_revisions (target_organization_revision_id, target_organization_entity_id, previous_revision_id, payload) VALUES ($1, $2, NULL, '{"bad":true}'::jsonb)`,
      [malformedId, "TARGET_ORGANIZATION_ENTITY_POSTGRES"]
    );
    await expect(repository.getRevisionById(malformedId)).rejects.toThrow("ERR_TARGET_ORGANIZATION_REVISION_POSTGRES_RECORD_INVALID");
    await closeClient(client);
  });

  it("persists a parent, reconstructs repository/client state, persists a child, and relies on the physical FK", async () => {
    const first = await createClient();
    const parent = revision({ organizationDescriptor: "Parent Organization" });
    await new PostgresTargetOrganizationRevisionRepository(first.db).createTargetOrganizationRevisionPersister().persist(parent);
    await closeClient(first.client);

    const second = await createClient();
    const repository = new PostgresTargetOrganizationRevisionRepository(second.db);
    await expect(repository.getRevisionById(parent.targetOrganizationRevisionId)).resolves.toEqual(parent);
    const child = revision({
      previousRevisionId: parent.targetOrganizationRevisionId,
      organizationDescriptor: "Child Organization",
    });
    await expect(repository.createTargetOrganizationRevisionPersister().persist(child)).resolves.toEqual(child);

    const dangling = revision({
      previousRevisionId: "TARGET_ORGANIZATION_REVISION_DANGLING",
      organizationDescriptor: "Dangling Organization",
    });
    await expect(second.client.unsafe(
      `INSERT INTO target_organization_revisions (target_organization_revision_id, target_organization_entity_id, previous_revision_id, payload) VALUES ($1, $2, $3, $4::jsonb)`,
      [dangling.targetOrganizationRevisionId, dangling.targetOrganizationEntityId, dangling.previousRevisionId, JSON.stringify(dangling)]
    )).rejects.toMatchObject({ code: "23503" });
    await closeClient(second.client);
  });

  it("detects database-side payload mutation through the mandatory final reread", async () => {
    const { client, db } = await createClient();
    const value = revision({ organizationDescriptor: "Mutation Organization" });
    await client.unsafe(`CREATE FUNCTION mutate_target_t2_organization_payload() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.payload = jsonb_set(NEW.payload, '{organizationDescriptor}', '"mutated by database"'); RETURN NEW; END; $$`);
    await client.unsafe(`CREATE TRIGGER mutate_target_t2_organization_payload BEFORE INSERT ON target_organization_revisions FOR EACH ROW EXECUTE FUNCTION mutate_target_t2_organization_payload()`);
    await expect(new PostgresTargetOrganizationRevisionRepository(db).createTargetOrganizationRevisionPersister().persist(value)).rejects.toThrow("ERR_TARGET_ORGANIZATION_REVISION_PERSISTENCE_INVALID");
    await client.unsafe(`DROP TRIGGER mutate_target_t2_organization_payload ON target_organization_revisions`);
    await client.unsafe(`DROP FUNCTION mutate_target_t2_organization_payload()`);
    await closeClient(client);
  });
});
