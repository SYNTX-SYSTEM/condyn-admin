import { randomBytes } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import { getTableConfig } from "drizzle-orm/pg-core";
import postgres, { type Sql } from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  PostgresTargetRoleSourceBindingRevisionRepository
} from "../../../../lib/career/target-adapters/role-source-binding-revision-persistence";
import {
  targetRoleSourceBindingRevisions
} from "../../../../lib/career/target-adapters/role-source-binding-revision-persistence/postgres-schema";
import {
  PostgresTargetSourceRevisionRepository
} from "../../../../lib/career/target-adapters/source-revision-persistence";
import {
  targetSourceRevisions
} from "../../../../lib/career/target-adapters/source-revision-persistence/postgres-schema";
import {
  createTargetRoleSourceBindingRevision
} from "../../../../lib/career/target/role";
import {
  createTargetSourceRevision
} from "../../../../lib/career/target/source";

const databaseUrl = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/condyn";
const schemaName = `target_role_t3a_${randomBytes(10).toString("hex")}`;
const clients = new Set<Sql>();
let admin: Sql;
const sourceSchema = getTableConfig(targetSourceRevisions);
const bindingSchema = getTableConfig(targetRoleSourceBindingRevisions);

const quote = (value: string): string => `"${value.replaceAll('"', '""')}"`;
const createTable = (config: ReturnType<typeof getTableConfig>): string => {
  const columns = config.columns.map((column) =>
    `${quote(column.name)} ${column.getSQLType()}${column.notNull ? " NOT NULL" : ""}${column.primary ? " PRIMARY KEY" : ""}`
  );
  const foreignKeys = config.foreignKeys.map((foreignKey) => {
    const reference = foreignKey.reference();
    const foreignTableName = reference.columns[0]?.name === "target_source_revision_id"
      ? sourceSchema.name
      : config.name;
    return `FOREIGN KEY (${reference.columns.map((column) => quote(column.name)).join(", ")}) REFERENCES ${quote(schemaName)}.${quote(foreignTableName)} (${reference.foreignColumns.map((column) => quote(column.name)).join(", ")}) ON DELETE ${(foreignKey.onDelete ?? "no action").toUpperCase()}`;
  });
  return `CREATE TABLE ${quote(schemaName)}.${quote(config.name)} (${[...columns, ...foreignKeys].join(", ")})`;
};

const createClient = async () => {
  const client = postgres(databaseUrl, { max: 1, onnotice: () => undefined });
  clients.add(client);
  await client.unsafe(`SET search_path TO "${schemaName}"`);
  return { client, db: drizzle(client) };
};

const source = (input: Partial<{ targetSourceEntityId: string; previousRevisionId: string | null; sourceLocator: string }> = {}) => createTargetSourceRevision({
  targetSourceEntityId: "TARGET_SOURCE_ENTITY_POSTGRES_ALPHA",
  previousRevisionId: null,
  sourceKind: "DOCUMENT",
  sourceLocator: "source://target-role/postgres/root",
  rawContentHash: "a".repeat(64),
  normalizedContentHash: "b".repeat(64),
  normalizedContent: "Target Role PostgreSQL source.",
  normalizationVersion: "target-normalization-v1",
  schemaVersion: "TARGET_SOURCE_REVISION_V1",
  createdAt: "2026-09-02T00:00:00.000Z",
  ...input
});

const binding = (targetSourceRevisionId: string, input: Partial<{ previousRevisionId: string | null; createdAt: string }> = {}) => createTargetRoleSourceBindingRevision({
  targetRoleEntityId: "TARGET_ROLE_ENTITY_POSTGRES_ALPHA",
  targetSourceRevisionId,
  previousRevisionId: null,
  schemaVersion: "TARGET_ROLE_SOURCE_BINDING_REVISION_V1",
  createdAt: "2026-09-02T00:00:00.000Z",
  ...input
});

beforeAll(async () => {
  admin = postgres(databaseUrl, { max: 1, onnotice: () => undefined });
  await admin.unsafe(`CREATE SCHEMA "${schemaName}"`);
  await admin.unsafe(createTable(sourceSchema));
  await admin.unsafe(createTable(bindingSchema));
});

afterAll(async () => {
  await Promise.all([...clients].map((client) => client.end({ timeout: 5 })));
  await admin.unsafe(`DROP SCHEMA "${schemaName}" CASCADE`);
  await admin.end({ timeout: 5 });
});

describe("PostgreSQL Target Role Source Binding Revision persistence T3A", () => {
  it("owns only the frozen physical binding columns and exact source plus lineage foreign keys", () => {
    expect(bindingSchema.name).toBe("target_role_source_binding_revisions");
    expect(bindingSchema.columns.map((column) => column.name)).toEqual([
      "target_role_source_binding_revision_id", "target_role_entity_id", "target_source_revision_id", "previous_revision_id", "payload"
    ]);
    expect(bindingSchema.foreignKeys).toHaveLength(2);
    expect(bindingSchema.columns.map((column) => column.name).filter((name) => /current|latest|head|active|superseded/i.test(name))).toEqual([]);
  });

  it("persists a root and valid same-source-entity child through reconstructed repositories", async () => {
    const { client, db } = await createClient();
    const sourceRepository = new PostgresTargetSourceRevisionRepository(db);
    const bindingRepository = new PostgresTargetRoleSourceBindingRevisionRepository(db, {
      getTargetSourceRevisionById: sourceRepository.getRevisionById.bind(sourceRepository)
    });
    const sourceA1 = source();
    const sourceA2 = source({ previousRevisionId: sourceA1.targetSourceRevisionId, sourceLocator: "source://target-role/postgres/newer" });
    await sourceRepository.createTargetSourceRevisionPersister().persist(sourceA1);
    await sourceRepository.createTargetSourceRevisionPersister().persist(sourceA2);
    const root = binding(sourceA1.targetSourceRevisionId);
    await expect(bindingRepository.createTargetRoleSourceBindingRevisionPersister().persist(root)).resolves.toEqual(root);
    const rebuiltSourceRepository = new PostgresTargetSourceRevisionRepository(db);
    const rebuilt = new PostgresTargetRoleSourceBindingRevisionRepository(db, {
      getTargetSourceRevisionById: rebuiltSourceRepository.getRevisionById.bind(rebuiltSourceRepository)
    });
    const child = binding(sourceA2.targetSourceRevisionId, { previousRevisionId: root.targetRoleSourceBindingRevisionId });
    await expect(rebuilt.createTargetRoleSourceBindingRevisionPersister().persist(child)).resolves.toEqual(child);
    await client.end({ timeout: 5 });
    clients.delete(client);
  });

  it("rejects physical payload mismatch and dangling exact source references", async () => {
    const { client, db } = await createClient();
    const sourceRepository = new PostgresTargetSourceRevisionRepository(db);
    const bindingRepository = new PostgresTargetRoleSourceBindingRevisionRepository(db, {
      getTargetSourceRevisionById: sourceRepository.getRevisionById.bind(sourceRepository)
    });
    const sourceA = source({ sourceLocator: "source://target-role/postgres/mismatch" });
    await sourceRepository.createTargetSourceRevisionPersister().persist(sourceA);
    const root = binding(sourceA.targetSourceRevisionId);
    await client.unsafe(
      `INSERT INTO target_role_source_binding_revisions (target_role_source_binding_revision_id, target_role_entity_id, target_source_revision_id, previous_revision_id, payload) VALUES ($1, $2, $3, NULL, $4::jsonb)`,
      [`ROW_${root.targetRoleSourceBindingRevisionId}`, root.targetRoleEntityId, root.targetSourceRevisionId, JSON.stringify(root)]
    );
    await expect(bindingRepository.getRevisionById(`ROW_${root.targetRoleSourceBindingRevisionId}`)).rejects.toThrow("ERR_TARGET_ROLE_SOURCE_BINDING_REVISION_POSTGRES_RECORD_INVALID");
    const dangling = binding("TSREV_DANGLING");
    await expect(client.unsafe(
      `INSERT INTO target_role_source_binding_revisions (target_role_source_binding_revision_id, target_role_entity_id, target_source_revision_id, previous_revision_id, payload) VALUES ($1, $2, $3, NULL, $4::jsonb)`,
      [dangling.targetRoleSourceBindingRevisionId, dangling.targetRoleEntityId, dangling.targetSourceRevisionId, JSON.stringify(dangling)]
    )).rejects.toMatchObject({ code: "23503" });
    await client.end({ timeout: 5 });
    clients.delete(client);
  });

  it("uses PK durable-winner semantics for replay and immutable conflict", async () => {
    const first = await createClient();
    const second = await createClient();
    const sourceA = source({ sourceLocator: "source://target-role/postgres/concurrent" });
    const firstSourceRepository = new PostgresTargetSourceRevisionRepository(first.db);
    await firstSourceRepository.createTargetSourceRevisionPersister().persist(sourceA);
    const value = binding(sourceA.targetSourceRevisionId);
    const firstBindingRepository = new PostgresTargetRoleSourceBindingRevisionRepository(first.db, {
      getTargetSourceRevisionById: firstSourceRepository.getRevisionById.bind(firstSourceRepository)
    });
    const secondSourceRepository = new PostgresTargetSourceRevisionRepository(second.db);
    const secondBindingRepository = new PostgresTargetRoleSourceBindingRevisionRepository(second.db, {
      getTargetSourceRevisionById: secondSourceRepository.getRevisionById.bind(secondSourceRepository)
    });
    const left = firstBindingRepository.createTargetRoleSourceBindingRevisionPersister();
    const right = secondBindingRepository.createTargetRoleSourceBindingRevisionPersister();
    await expect(Promise.all([left.persist(value), right.persist(structuredClone(value))])).resolves.toEqual([value, value]);
    const divergent = binding(sourceA.targetSourceRevisionId, { createdAt: "2030-01-01T00:00:00.000Z" });
    await expect(right.persist(divergent)).rejects.toThrow("ERR_TARGET_ROLE_SOURCE_BINDING_REVISION_IMMUTABLE_CONFLICT");
    await first.client.end({ timeout: 5 });
    await second.client.end({ timeout: 5 });
    clients.delete(first.client);
    clients.delete(second.client);
  });
});
