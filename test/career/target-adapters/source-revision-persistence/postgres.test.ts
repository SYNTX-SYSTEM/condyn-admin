import { randomBytes } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import { getTableConfig } from "drizzle-orm/pg-core";
import postgres, { type Sql } from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as targetSourceCore from "../../../../lib/career/target/source";
import * as targetSourcePostgresAdapter from "../../../../lib/career/target-adapters/source-revision-persistence";
import {
  PostgresTargetSourceRevisionRepository
} from "../../../../lib/career/target-adapters/source-revision-persistence";
import {
  targetSourceRevisions
} from "../../../../lib/career/target-adapters/source-revision-persistence/postgres-schema";
import {
  createTargetSourceRevision,
  type TargetSourceRevision
} from "../../../../lib/career/target/source";

const databaseUrl = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/condyn";
const schemaName = `target_source_t1_${randomBytes(10).toString("hex")}`;
const clients = new Set<Sql>();
let admin: Sql;
const productionSchema = getTableConfig(targetSourceRevisions);
const productionForeignKey = productionSchema.foreignKeys[0];

const quoteIdentifier = (value: string): string => `"${value.replaceAll('"', '""')}"`;
const productionCreateTableSql = (): string => {
  if (productionForeignKey === undefined) throw new Error("expected Target Source self foreign key");
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
  targetSourceEntityId: string;
  previousRevisionId: string | null;
  sourceLocator: string;
  rawContentHash: string;
  normalizedContentHash: string;
  normalizedContent: string;
  createdAt: string;
}> = {}) => createTargetSourceRevision({
  targetSourceEntityId: "TARGET_SOURCE_ENTITY_POSTGRES",
  previousRevisionId: null,
  sourceKind: "DOCUMENT",
  sourceLocator: "source://postgres/root",
  rawContentHash: "a".repeat(64),
  normalizedContentHash: "b".repeat(64),
  normalizedContent: "PostgreSQL durable normalized source content.",
  normalizationVersion: "target-normalization-v1",
  schemaVersion: "TARGET_SOURCE_REVISION_V1",
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

describe("PostgreSQL Target Source Revision persistence T1", () => {
  it("places PostgreSQL infrastructure outside Target Source core", () => {
    expect(PostgresTargetSourceRevisionRepository).toBeTypeOf("function");
    const coreSources = sourceFiles(resolve(process.cwd(), "lib/career/target/source"));
    expect(coreSources.filter((file) => /from\s+["'][^"']*(drizzle|postgres|database|\/db|target-adapters|capability-core|decision-core|decision-adapters|matching|recommendations)[^"']*["']/.test(readFileSync(file, "utf8")))).toEqual([]);
    expect(Object.keys(targetSourceCore).filter((name) => [
      "PostgresTargetSourceRevisionRepository", "targetSourceRevisions", "writeRevision",
      "saveRevision", "CurrentRevision", "LatestRevision", "HeadRevision", "ActiveRevision"
    ].includes(name))).toEqual([]);
    expect(targetSourcePostgresAdapter).not.toHaveProperty("targetSourceRevisions");
  });

  it("uses the actual production Drizzle schema as the frozen physical table contract", async () => {
    expect(productionSchema.name).toBe("target_source_revisions");
    expect(productionSchema.columns.map((column) => ({
      name: column.name, notNull: column.notNull, primary: column.primary,
      unique: column.isUnique, sqlType: column.getSQLType()
    }))).toEqual([
      { name: "target_source_revision_id", notNull: true, primary: true, unique: false, sqlType: "text" },
      { name: "target_source_entity_id", notNull: true, primary: false, unique: false, sqlType: "text" },
      { name: "previous_revision_id", notNull: false, primary: false, unique: false, sqlType: "text" },
      { name: "payload", notNull: true, primary: false, unique: false, sqlType: "jsonb" }
    ]);
    expect(productionSchema.uniqueConstraints).toEqual([]);
    expect(productionForeignKey?.onDelete).toBe("restrict");
    expect(productionForeignKey?.reference().columns.map((column) => column.name)).toEqual(["previous_revision_id"]);
    expect(productionForeignKey?.reference().foreignColumns.map((column) => column.name)).toEqual(["target_source_revision_id"]);
    const columns = await admin.unsafe(`SELECT column_name, is_nullable, data_type FROM information_schema.columns WHERE table_schema = '${schemaName}' AND table_name = 'target_source_revisions' ORDER BY column_name`);
    expect(columns).toEqual([
      { column_name: "payload", is_nullable: "NO", data_type: "jsonb" },
      { column_name: "previous_revision_id", is_nullable: "YES", data_type: "text" },
      { column_name: "target_source_entity_id", is_nullable: "NO", data_type: "text" },
      { column_name: "target_source_revision_id", is_nullable: "NO", data_type: "text" }
    ]);
    const names = productionSchema.columns.map((column) => column.name);
    expect(names.filter((name) => ["current_revision_id", "latest_revision_id", "head_revision_id", "active_revision_id", "superseded_by_revision_id"].includes(name))).toEqual([]);
  });

  it("has no runtime-callable raw writer and persists roots through detached exact rereads", async () => {
    const { client, db } = await createClient();
    const repository = new PostgresTargetSourceRevisionRepository(db) as unknown as Record<string, unknown>;
    for (const name of ["writeRevision", "saveRevision", "putRevision", "replaceRevision", "updateRevision", "deleteRevision"]) {
      expect(name in repository).toBe(false);
      expect(typeof repository[name]).not.toBe("function");
    }
    const value = revision();
    const persisted = await (repository as unknown as PostgresTargetSourceRevisionRepository).createTargetSourceRevisionPersister().persist(value);
    expect(persisted).toEqual(value);
    persisted.normalizedContent = "Mutated returned object.";
    expect(await (repository as unknown as PostgresTargetSourceRevisionRepository).getRevisionById(value.targetSourceRevisionId)).toEqual(value);
    await closeClient(client);
  });

  it("uses PostgreSQL uniqueness for identical and divergent concurrent revision writes", async () => {
    const first = await createClient();
    const second = await createClient();
    const value = revision({ sourceLocator: "source://postgres/concurrent" });
    const left = new PostgresTargetSourceRevisionRepository(first.db).createTargetSourceRevisionPersister();
    const right = new PostgresTargetSourceRevisionRepository(second.db).createTargetSourceRevisionPersister();

    await expect(Promise.all([left.persist(value), right.persist(structuredClone(value))])).resolves.toEqual([value, value]);
    const count = await first.client.unsafe(`SELECT count(*)::int AS count FROM target_source_revisions WHERE target_source_revision_id = $1`, [value.targetSourceRevisionId]);
    expect(count[0].count).toBe(1);

    const sameIdentityDifferentAudit = revision({ sourceLocator: "source://postgres/race", createdAt: "2030-01-01T00:00:00.000Z" });
    const sameIdentityEarlierAudit = revision({ sourceLocator: "source://postgres/race", createdAt: "2020-01-01T00:00:00.000Z" });
    expect(sameIdentityDifferentAudit.targetSourceRevisionId).toBe(sameIdentityEarlierAudit.targetSourceRevisionId);
    expect(sameIdentityDifferentAudit).not.toEqual(sameIdentityEarlierAudit);
    const results = await Promise.allSettled([left.persist(sameIdentityDifferentAudit), right.persist(sameIdentityEarlierAudit)]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected" && String(result.reason).includes("ERR_TARGET_SOURCE_REVISION_IMMUTABLE_CONFLICT"))).toHaveLength(1);
    await closeClient(first.client);
    await closeClient(second.client);
  });

  it("rejects malformed or physically mismatched durable rows", async () => {
    const { client, db } = await createClient();
    const repository = new PostgresTargetSourceRevisionRepository(db);
    const value = revision({ sourceLocator: "source://postgres/mismatch" });
    await client.unsafe(
      `INSERT INTO target_source_revisions (target_source_revision_id, target_source_entity_id, previous_revision_id, payload) VALUES ($1, $2, NULL, $3::jsonb)`,
      [`ROW_${value.targetSourceRevisionId}`, value.targetSourceEntityId, JSON.stringify(value)]
    );
    await expect(repository.getRevisionById(`ROW_${value.targetSourceRevisionId}`)).rejects.toThrow("ERR_TARGET_SOURCE_REVISION_POSTGRES_RECORD_INVALID");

    const entityMismatch = revision({ sourceLocator: "source://postgres/entity-mismatch" });
    await client.unsafe(
      `INSERT INTO target_source_revisions (target_source_revision_id, target_source_entity_id, previous_revision_id, payload) VALUES ($1, $2, NULL, $3::jsonb)`,
      [entityMismatch.targetSourceRevisionId, "TARGET_SOURCE_ENTITY_ROW_MISMATCH", JSON.stringify(entityMismatch)]
    );
    await expect(repository.getRevisionById(entityMismatch.targetSourceRevisionId)).rejects.toThrow("ERR_TARGET_SOURCE_REVISION_POSTGRES_RECORD_INVALID");

    const malformedId = revision({ sourceLocator: "source://postgres/malformed" }).targetSourceRevisionId;
    await client.unsafe(
      `INSERT INTO target_source_revisions (target_source_revision_id, target_source_entity_id, previous_revision_id, payload) VALUES ($1, $2, NULL, '{"bad":true}'::jsonb)`,
      [malformedId, "TARGET_SOURCE_ENTITY_POSTGRES"]
    );
    await expect(repository.getRevisionById(malformedId)).rejects.toThrow("ERR_TARGET_SOURCE_REVISION_POSTGRES_RECORD_INVALID");
    await closeClient(client);
  });

  it("persists a parent, reconstructs repository/client state, persists a child, and relies on the physical FK", async () => {
    const first = await createClient();
    const parent = revision({ sourceLocator: "source://postgres/parent" });
    await new PostgresTargetSourceRevisionRepository(first.db).createTargetSourceRevisionPersister().persist(parent);
    await closeClient(first.client);

    const second = await createClient();
    const repository = new PostgresTargetSourceRevisionRepository(second.db);
    await expect(repository.getRevisionById(parent.targetSourceRevisionId)).resolves.toEqual(parent);
    const child = revision({
      previousRevisionId: parent.targetSourceRevisionId,
      sourceLocator: "source://postgres/child",
      rawContentHash: "c".repeat(64),
      normalizedContentHash: "d".repeat(64),
      normalizedContent: "Durable child source state."
    });
    await expect(repository.createTargetSourceRevisionPersister().persist(child)).resolves.toEqual(child);

    const dangling = revision({
      previousRevisionId: "TARGET_SOURCE_REVISION_DANGLING",
      sourceLocator: "source://postgres/dangling",
      rawContentHash: "e".repeat(64),
      normalizedContentHash: "f".repeat(64),
      normalizedContent: "Physical FK must reject this row."
    });
    await expect(second.client.unsafe(
      `INSERT INTO target_source_revisions (target_source_revision_id, target_source_entity_id, previous_revision_id, payload) VALUES ($1, $2, $3, $4::jsonb)`,
      [dangling.targetSourceRevisionId, dangling.targetSourceEntityId, dangling.previousRevisionId, JSON.stringify(dangling)]
    )).rejects.toMatchObject({ code: "23503" });
    await closeClient(second.client);
  });

  it("detects database-side payload mutation through the mandatory final reread", async () => {
    const { client, db } = await createClient();
    const value = revision({ sourceLocator: "source://postgres/mutated" });
    await client.unsafe(`CREATE FUNCTION mutate_target_t1_payload() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.payload = jsonb_set(NEW.payload, '{normalizedContent}', '"mutated by database"'); RETURN NEW; END; $$`);
    await client.unsafe(`CREATE TRIGGER mutate_target_t1_payload BEFORE INSERT ON target_source_revisions FOR EACH ROW EXECUTE FUNCTION mutate_target_t1_payload()`);
    await expect(new PostgresTargetSourceRevisionRepository(db).createTargetSourceRevisionPersister().persist(value)).rejects.toThrow("ERR_TARGET_SOURCE_REVISION_PERSISTENCE_INVALID");
    await client.unsafe(`DROP TRIGGER mutate_target_t1_payload ON target_source_revisions`);
    await client.unsafe(`DROP FUNCTION mutate_target_t1_payload()`);
    await closeClient(client);
  });
});
