import { createHash, randomBytes } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import { getTableConfig } from "drizzle-orm/pg-core";
import postgres, { type Sql } from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as decisionCore from "../../../lib/decision-core";
import * as revisionPersistenceAdapter from "../../../lib/decision-adapters/revision-persistence";
import { PostgresDecisionContextRevisionRepository } from "../../../lib/decision-adapters/revision-persistence";
import { decisionContextRevisions } from "../../../lib/decision-adapters/revision-persistence/postgres-schema";
import {
  assembleDecisionContextValidation,
  createDecisionContextDraft,
  createDecisionContextRevision,
  createStructuralExpectation,
  type DecisionContextDraft,
  type DecisionContextRevision,
  type DecisionContextValidationAssemblyInput,
  reconstructStructuralGap
} from "../../../lib/decision-core";

const databaseUrl = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/condyn";
const schemaName = `decision_revision_5d2b_${randomBytes(10).toString("hex")}`;
const clients = new Set<Sql>();
let admin: Sql;
let sequence = 0;
const productionSchema = getTableConfig(decisionContextRevisions);
const productionColumns = Object.fromEntries(productionSchema.columns.map((column) => [column.name, column]));
const productionForeignKey = productionSchema.foreignKeys[0];

const quoteIdentifier = (value: string) => `"${value.replaceAll('"', '""')}"`;
const createProductionTableSql = (): string => {
  if (productionForeignKey === undefined) throw new Error("missing production self foreign key");
  const reference = productionForeignKey.reference();
  const columnDefinitions = productionSchema.columns.map((column) => `${quoteIdentifier(column.name)} ${column.getSQLType()}${column.notNull ? " NOT NULL" : ""}${column.primary ? " PRIMARY KEY" : ""}`);
  const foreignKeyDefinition = `FOREIGN KEY (${reference.columns.map((column) => quoteIdentifier(column.name)).join(", ")}) REFERENCES ${quoteIdentifier(schemaName)}.${quoteIdentifier(productionSchema.name)} (${reference.foreignColumns.map((column) => quoteIdentifier(column.name)).join(", ")}) ON DELETE ${(productionForeignKey.onDelete ?? "no action").toUpperCase()}`;
  return `CREATE TABLE ${quoteIdentifier(schemaName)}.${quoteIdentifier(productionSchema.name)} (${[...columnDefinitions, foreignKeyDefinition].join(", ")})`;
};

const sourceFiles = (directory: string): string[] => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? sourceFiles(join(directory, entry.name)) : entry.name.endsWith(".ts") ? [join(directory, entry.name)] : []);
const reference = (seed: string) => ({ producerId: `PRODUCER_${seed}`, authorityContractId: `CONTRACT_${seed}`, artifactId: `ARTIFACT_${seed}`, locator: `locator-${seed}` });
const nextSeed = () => `S${sequence += 1}`;
const draft = (seed = nextSeed()): DecisionContextDraft => createDecisionContextDraft({
  sourceStateReferences: [reference(seed)],
  items: [
    { role: "DECISION_QUESTION", statement: `Proceed ${seed}?`, provenance: { origin: "HUMAN_INPUT", actorId: "human" } },
    { role: "OBJECTIVE", statement: `Protect source ${seed}.`, provenance: { origin: "HUMAN_INPUT", actorId: "human" } },
    { role: "CONSTRAINT", statement: `Protect target ${seed}.`, provenance: { origin: "HUMAN_INPUT", actorId: "human" } }
  ]
});
const item = (context: DecisionContextDraft, role: string) => {
  const result = context.items.find((candidate) => candidate.role === role);
  if (result === undefined) throw new Error(`missing ${role}`);
  return result;
};
const emptyInput = (): DecisionContextValidationAssemblyInput => ({ expectationValidations: [], consequenceValidations: [] });
const revision = (context: DecisionContextDraft, previousRevisionId: string | null = null, input = emptyInput()) => createDecisionContextRevision({ previousRevisionId, context, validationInput: input, validationAssembly: assembleDecisionContextValidation(context, input) });
const binding = (context: DecisionContextDraft, rationale: string) => {
  const stateReference = reference(context.items[0].statement.replace(/[^A-Z0-9]/gi, ""));
  const listed = context.sourceStateReferences[0]; const itemId = item(context, "OBJECTIVE").itemId;
  const disposition = "NOT_SUPPORTED" as const;
  return {
    bindingId: `EBIND_${createHash("sha256").update(JSON.stringify(["SEMANTIC_EVIDENCE_BINDING_V1", context.contextId, itemId, [listed.producerId, listed.authorityContractId, listed.artifactId, listed.locator], disposition]), "utf8").digest("hex").slice(0, 24).toUpperCase()}`,
    contextId: context.contextId, itemId, stateReference: listed, disposition, rationale
  };
};
const evidenceRevision = (context: DecisionContextDraft, rationale: string) => {
  const expectation = createStructuralExpectation(context, { kind: "EVIDENCE_BINDING", subjectItemId: item(context, "OBJECTIVE").itemId, acceptedDispositions: ["SUPPORTED"], provenance: { origin: "HUMAN_INPUT", actorId: "expectation" } });
  const basis = { kind: "EVIDENCE_BINDING" as const, bindings: [binding(context, rationale)] };
  const gap = reconstructStructuralGap(context, expectation, basis);
  if (gap === null) throw new Error("expected gap");
  return revision(context, null, { expectationValidations: [{ expectation, basis, result: gap }], consequenceValidations: [] });
};
const createClient = async () => {
  const client = postgres(databaseUrl, { max: 1, onnotice: () => undefined }); clients.add(client);
  await client.unsafe(`SET search_path TO "${schemaName}"`);
  return { client, db: drizzle(client) };
};
const closeClient = async (client: Sql) => { clients.delete(client); await client.end({ timeout: 5 }); };

beforeAll(async () => {
  admin = postgres(databaseUrl, { max: 1, onnotice: () => undefined });
  await admin.unsafe(`CREATE SCHEMA "${schemaName}"`);
  await admin.unsafe(createProductionTableSql());
});

afterAll(async () => {
  await Promise.all([...clients].map((client) => client.end({ timeout: 5 })));
  await admin.unsafe(`DROP SCHEMA "${schemaName}" CASCADE`);
  await admin.end({ timeout: 5 });
});

describe("Postgres Decision Context Revision Persistence", () => {
  it("provides the adapter in decision-adapters and keeps Decision Core PostgreSQL-free", () => {
    expect(PostgresDecisionContextRevisionRepository).toBeTypeOf("function");
    const coreSources = sourceFiles(resolve(process.cwd(), "lib/decision-core"));
    expect(coreSources.filter((file) => /from\s+["'][^"']*(drizzle|postgres|database|decision-adapters|career)[^"']*["']/.test(readFileSync(file, "utf8")))).toEqual([]);
    expect(Object.keys(decisionCore).filter((name) => ["PostgresDecisionContextRevisionRepository", "saveRevision", "writeRevision", "putRevision", "replaceRevision", "updateRevision", "deleteRevision", "CurrentRevision", "ActiveRevision", "LatestRevision", "HeadRevision", "SupersededRevision"].includes(name))).toEqual([]);
    expect(revisionPersistenceAdapter).not.toHaveProperty("decisionContextRevisions");
  });

  it("uses the actual production Drizzle schema as the frozen physical table contract", async () => {
    expect(productionSchema.name).toBe("decision_context_revisions");
    expect(productionSchema.columns.map((column) => ({ name: column.name, notNull: column.notNull, primary: column.primary, unique: column.isUnique, sqlType: column.getSQLType() }))).toEqual([
      { name: "revision_id", notNull: true, primary: true, unique: false, sqlType: "text" },
      { name: "previous_revision_id", notNull: false, primary: false, unique: false, sqlType: "text" },
      { name: "payload", notNull: true, primary: false, unique: false, sqlType: "jsonb" }
    ]);
    expect(productionSchema.uniqueConstraints).toEqual([]);
    expect(productionForeignKey).toBeDefined();
    expect(productionForeignKey?.onDelete).toBe("restrict");
    expect(productionForeignKey?.reference().columns.map((column) => column.name)).toEqual(["previous_revision_id"]);
    expect(productionForeignKey?.reference().foreignTable).toBe(decisionContextRevisions);
    expect(productionForeignKey?.reference().foreignColumns.map((column) => column.name)).toEqual(["revision_id"]);
    const rows = await admin.unsafe(`SELECT column_name, is_nullable, data_type FROM information_schema.columns WHERE table_schema = '${schemaName}' AND table_name = 'decision_context_revisions' ORDER BY column_name`);
    expect(rows).toEqual([
      { column_name: "payload", is_nullable: "NO", data_type: "jsonb" },
      { column_name: "previous_revision_id", is_nullable: "YES", data_type: "text" },
      { column_name: "revision_id", is_nullable: "NO", data_type: "text" }
    ]);
    const constraints = await admin.unsafe(`SELECT contype, confdeltype FROM pg_constraint WHERE conrelid = '"${schemaName}".decision_context_revisions'::regclass ORDER BY contype`);
    expect(constraints.some((row) => row.contype === "p")).toBe(true);
    expect(constraints.some((row) => row.contype === "f" && row.confdeltype !== "c")).toBe(true);
    const uniqueIndexes = await admin.unsafe(`SELECT indexrelid::regclass::text AS name FROM pg_index WHERE indrelid = '"${schemaName}".decision_context_revisions'::regclass AND indisunique`);
    expect(uniqueIndexes).toHaveLength(1);
    expect(Object.keys(productionColumns).sort()).toEqual(["payload", "previous_revision_id", "revision_id"]);
  });

  it("has no runtime-callable raw writer and persists roots as detached exact rereads", async () => {
    const { client, db } = await createClient();
    const repository = new PostgresDecisionContextRevisionRepository(db) as unknown as Record<string, unknown>;
    for (const name of ["writeRevision", "saveRevision", "putRevision", "replaceRevision", "updateRevision", "deleteRevision"]) {
      expect(name in repository).toBe(false);
      expect(typeof repository[name]).not.toBe("function");
    }
    const value = revision(draft()); const persisted = await (repository as unknown as PostgresDecisionContextRevisionRepository).createDecisionContextRevisionPersister().persist(value);
    expect(persisted).toEqual(value);
    persisted.context.items[0].statement = "Mutated return.";
    expect(await (repository as unknown as PostgresDecisionContextRevisionRepository).getRevisionById(value.revisionId)).toEqual(value);
    await closeClient(client);
  });

  it("provides immutable exact replay and rejects same-DREV divergent complete payload", async () => {
    const { client, db } = await createClient(); const context = draft(); const first = evidenceRevision(context, "First rationale."); const second = evidenceRevision(context, "Second rationale.");
    expect(first.revisionId).toBe(second.revisionId); expect(first).not.toEqual(second);
    const persister = new PostgresDecisionContextRevisionRepository(db).createDecisionContextRevisionPersister();
    await expect(persister.persist(first)).resolves.toEqual(first);
    await expect(persister.persist(structuredClone(first))).resolves.toEqual(first);
    await expect(persister.persist(second)).rejects.toThrow("ERR_DECISION_CONTEXT_REVISION_IMMUTABLE_CONFLICT");
    await closeClient(client);
  });

  it("rejects inconsistent or malformed physical durable rows", async () => {
    const { client, db } = await createClient(); const repository = new PostgresDecisionContextRevisionRepository(db); const value = revision(draft());
    await client.unsafe(`INSERT INTO decision_context_revisions (revision_id, previous_revision_id, payload) VALUES ($1, NULL, $2::jsonb)`, [`DREV_ROW_${value.revisionId.slice(5)}`, JSON.stringify(value)]);
    await expect(repository.getRevisionById(`DREV_ROW_${value.revisionId.slice(5)}`)).rejects.toThrow("ERR_DECISION_CONTEXT_REVISION_POSTGRES_RECORD_INVALID");
    const previousMismatch = revision(draft()); const child = revision(previousMismatch.context, previousMismatch.revisionId);
    await client.unsafe(`INSERT INTO decision_context_revisions (revision_id, previous_revision_id, payload) VALUES ($1, NULL, $2::jsonb)`, [child.revisionId, JSON.stringify(child)]);
    await expect(repository.getRevisionById(child.revisionId)).rejects.toThrow("ERR_DECISION_CONTEXT_REVISION_POSTGRES_RECORD_INVALID");
    const malformedId = revision(draft()).revisionId;
    await client.unsafe(`INSERT INTO decision_context_revisions (revision_id, previous_revision_id, payload) VALUES ($1, NULL, '{"bad":true}'::jsonb)`, [malformedId]);
    await expect(repository.getRevisionById(malformedId)).rejects.toThrow("ERR_DECISION_CONTEXT_REVISION_POSTGRES_RECORD_INVALID");
    const invalidAssembly = revision(draft());
    invalidAssembly.validationAssembly.consequenceIds = ["DCONS_FAKE"];
    await client.unsafe(`INSERT INTO decision_context_revisions (revision_id, previous_revision_id, payload) VALUES ($1, NULL, $2::jsonb)`, [invalidAssembly.revisionId, JSON.stringify(invalidAssembly)]);
    await expect(repository.getRevisionById(invalidAssembly.revisionId)).rejects.toThrow("ERR_DECISION_CONTEXT_REVISION_POSTGRES_RECORD_INVALID");
    await closeClient(client);
  });

  it("accepts JSONB object-key normalization without reconstructing or repairing the persisted assembly", async () => {
    const { client, db } = await createClient();
    const persistedPayload = evidenceRevision(draft(), "Stored rationale.");
    const result = persistedPayload.validationAssembly.expectationResults[0];
    if (result === undefined || result.outcome !== "GAP") throw new Error("missing GAP result");
    persistedPayload.validationAssembly.expectationResults = [{
      basis: result.basis,
      gapId: result.gapId,
      outcome: "GAP",
      expectationId: result.expectationId
    }];
    await client.unsafe(`INSERT INTO decision_context_revisions (revision_id, previous_revision_id, payload) VALUES ($1, $2, $3::jsonb)`, [persistedPayload.revisionId, persistedPayload.previousRevisionId, JSON.stringify(persistedPayload)]);
    const raw = await client.unsafe(`SELECT payload FROM decision_context_revisions WHERE revision_id = $1`, [persistedPayload.revisionId]);
    const stored = raw[0]?.payload as DecisionContextRevision;
    const reread = await new PostgresDecisionContextRevisionRepository(db).getRevisionById(persistedPayload.revisionId);
    expect(reread).toEqual(stored);
    expect(Object.keys(reread?.validationAssembly.expectationResults[0] ?? {})).toEqual(Object.keys(stored.validationAssembly.expectationResults[0]));
    await closeClient(client);
  });

  it("preserves immediate parent behavior, forks, no-change children, and physical FK integrity", async () => {
    const { client, db } = await createClient(); const repository = new PostgresDecisionContextRevisionRepository(db); const persister = repository.createDecisionContextRevisionPersister(); const context = draft();
    const parent = revision(context); const childA = revision(context, parent.revisionId); const childB = revision(draft(), parent.revisionId);
    await expect(persister.persist(childA)).rejects.toThrow("ERR_DECISION_CONTEXT_REVISION_PARENT_NOT_FOUND");
    await persister.persist(parent); await expect(persister.persist(childA)).resolves.toEqual(childA); await expect(persister.persist(childB)).resolves.toEqual(childB);
    expect(childA.context.contextId).toBe(parent.context.contextId); expect(childA.validationAssembly.assemblyId).toBe(parent.validationAssembly.assemblyId);
    const dangling = revision(draft(), parent.revisionId);
    await expect(client.unsafe(`INSERT INTO decision_context_revisions (revision_id, previous_revision_id, payload) VALUES ($1, $2, $3::jsonb)`, [dangling.revisionId, `DREV_${"A".repeat(24)}`, JSON.stringify(dangling)])).rejects.toMatchObject({ code: "23503" });
    await closeClient(client);
  });

  it("uses PostgreSQL uniqueness for identical and divergent concurrent races", async () => {
    const first = await createClient(); const second = await createClient(); const value = revision(draft());
    const left = new PostgresDecisionContextRevisionRepository(first.db).createDecisionContextRevisionPersister(); const right = new PostgresDecisionContextRevisionRepository(second.db).createDecisionContextRevisionPersister();
    await expect(Promise.all([left.persist(value), right.persist(structuredClone(value))])).resolves.toEqual([value, value]);
    const count = await first.client.unsafe(`SELECT count(*)::int AS count FROM decision_context_revisions WHERE revision_id = $1`, [value.revisionId]); expect(count[0].count).toBe(1);
    const context = draft(); const a = evidenceRevision(context, "Race A rationale."); const b = evidenceRevision(context, "Race B rationale.");
    const results = await Promise.allSettled([left.persist(a), right.persist(b)]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected" && String(result.reason).includes("ERR_DECISION_CONTEXT_REVISION_IMMUTABLE_CONFLICT"))).toHaveLength(1);
    await closeClient(first.client); await closeClient(second.client);
  });

  it("survives repository and PostgreSQL-client reconstruction and permits durable children", async () => {
    const first = await createClient(); const parent = revision(draft());
    await new PostgresDecisionContextRevisionRepository(first.db).createDecisionContextRevisionPersister().persist(parent);
    await closeClient(first.client);
    const second = await createClient(); const repository = new PostgresDecisionContextRevisionRepository(second.db);
    await expect(repository.getRevisionById(parent.revisionId)).resolves.toEqual(parent);
    const child = revision(parent.context, parent.revisionId); await expect(repository.createDecisionContextRevisionPersister().persist(child)).resolves.toEqual(child);
    await closeClient(second.client);
  });

  it("retains the sealed final authority reread and propagates unexpected storage errors", async () => {
    const { client, db } = await createClient(); const revisionWithBinding = evidenceRevision(draft(), "Pristine rationale.");
    await client.unsafe(`CREATE FUNCTION mutate_5d2b_payload() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.payload = jsonb_set(NEW.payload, '{validationInput,expectationValidations,0,basis,bindings,0,rationale}', '"mutated rationale"'); RETURN NEW; END; $$`);
    await client.unsafe(`CREATE TRIGGER mutate_5d2b_payload BEFORE INSERT ON decision_context_revisions FOR EACH ROW EXECUTE FUNCTION mutate_5d2b_payload()`);
    await expect(new PostgresDecisionContextRevisionRepository(db).createDecisionContextRevisionPersister().persist(revisionWithBinding)).rejects.toThrow("ERR_DECISION_CONTEXT_REVISION_PERSISTENCE_INVALID");
    await client.unsafe(`DROP TRIGGER mutate_5d2b_payload ON decision_context_revisions`); await client.unsafe(`DROP FUNCTION mutate_5d2b_payload()`);
    await client.unsafe(`CREATE FUNCTION fail_5d2b_write() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'UNEXPECTED_POSTGRES_WRITE'; END; $$`);
    await client.unsafe(`CREATE TRIGGER fail_5d2b_write BEFORE INSERT ON decision_context_revisions FOR EACH ROW EXECUTE FUNCTION fail_5d2b_write()`);
    const failure: { message?: string; cause?: { message?: string } } = await new PostgresDecisionContextRevisionRepository(db).createDecisionContextRevisionPersister().persist(revision(draft())).then(
      () => { throw new Error("expected PostgreSQL write failure"); },
      (error: unknown) => error as { message?: string; cause?: { message?: string } }
    );
    expect(failure.message).not.toContain("ERR_DECISION_CONTEXT_REVISION_PERSISTENCE_INVALID");
    expect(failure.cause?.message).toContain("UNEXPECTED_POSTGRES_WRITE");
    await client.unsafe(`DROP TRIGGER fail_5d2b_write ON decision_context_revisions`); await client.unsafe(`DROP FUNCTION fail_5d2b_write()`);
    await closeClient(client);
  });
});
