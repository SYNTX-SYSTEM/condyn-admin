import { randomBytes } from "node:crypto";
import { sql as drizzleSql } from "drizzle-orm";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { getTableConfig } from "drizzle-orm/pg-core";
import postgres, { type Sql } from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  byteReplayDecisionAuthorityGrantRevision,
  createDecisionAuthorityGrantRevision,
  derivationReplayDecisionAuthorityGrantRevision,
  semanticReplayDecisionAuthorityGrantRevision
} from "../../../../lib/career/relation/decision-authority";
import { PostgresDecisionAuthorityGrantRevisionRepository } from "../../../../lib/career/relation-adapters/decision-authority-persistence";
import {
  decisionAuthorityGrantDecisionClasses,
  decisionAuthorityGrantEvidenceReferences,
  decisionAuthorityGrantRevisions,
  decisionAuthorityGrantSubjectKinds
} from "../../../../lib/career/relation-adapters/decision-authority-persistence/grant-postgres-schema";

const url = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/condyn";
const schema = `decision_authority_grant_${randomBytes(8).toString("hex")}`;
const tables = [decisionAuthorityGrantRevisions, decisionAuthorityGrantDecisionClasses, decisionAuthorityGrantSubjectKinds, decisionAuthorityGrantEvidenceReferences].map(getTableConfig);
const clients = new Set<Sql>();
let admin: Sql;
const quote = (value: string) => `"${value}"`;
const ddl = (config: typeof tables[number]) => `CREATE TABLE ${quote(schema)}.${quote(config.name)} (${[
  ...config.columns.map(column => `${quote(column.name)} ${column.getSQLType()}${column.notNull ? " NOT NULL" : ""}${column.primary ? " PRIMARY KEY" : ""}`),
  ...config.foreignKeys.map(key => {
    const ref = key.reference();
    return `FOREIGN KEY (${ref.columns.map(column => quote(column.name)).join(",")}) REFERENCES ${quote(schema)}.${quote(getTableConfig(ref.foreignTable).name)} (${ref.foreignColumns.map(column => quote(column.name)).join(",")}) ON DELETE ${(key.onDelete ?? "no action").toUpperCase()}`;
  })
].join(",")})`;
const client = async () => {
  const sql = postgres(url, { max: 1, onnotice: () => undefined });
  clients.add(sql);
  await sql.unsafe(`SET search_path TO "${schema}"`);
  return { sql, db: drizzle(sql) };
};
const grant = (suffix: string, createdAt = "2027-01-10T00:01:00.000Z") => createDecisionAuthorityGrantRevision({
  grantorActorId: `GRANTOR_${suffix}`,
  authorizedActorId: `DECIDER_${suffix}`,
  authorityScope: "CAREER_RECOMMENDATION_DECISION",
  permittedDecisionClasses: ["ACCEPT_RECOMMENDATION", "REQUEST_FURTHER_EVIDENCE"],
  permittedSubjectKinds: ["RCP_ITEM"],
  authorityEvidenceRefs: [`evidence://grant/${suffix}/a`, `evidence://grant/${suffix}/b`],
  declaredAt: "2027-01-10T00:00:00.000Z",
  effectiveFrom: "2027-01-11T00:00:00.000Z",
  effectiveUntil: null,
  createdAt
});

beforeAll(async () => {
  admin = postgres(url, { max: 1, onnotice: () => undefined });
  await admin.unsafe(`CREATE SCHEMA "${schema}"`);
  for (const table of tables) await admin.unsafe(ddl(table));
});
afterAll(async () => {
  await Promise.all([...clients].map(value => value.end({ timeout: 5 })));
  if (admin) {
    await admin.unsafe(`DROP SCHEMA "${schema}" CASCADE`);
    await admin.end({ timeout: 5 });
  }
});

describe("T11A PostgreSQL immutable DecisionAuthorityGrantRevision", () => {
  it("persists, exact-rereads, replays after a fresh client, and preserves immutable conflict", async () => {
    const first = await client();
    const repository = new PostgresDecisionAuthorityGrantRevisionRepository(first.db);
    const value = grant("positive");
    await expect(repository.persistDecisionAuthorityGrantRevision(value)).resolves.toEqual(value);
    await expect(repository.getDecisionAuthorityGrantRevisionById(value.decisionAuthorityGrantRevisionId)).resolves.toEqual(value);
    await expect(repository.persistDecisionAuthorityGrantRevision(value)).resolves.toEqual(value);
    await expect(repository.persistDecisionAuthorityGrantRevision({ ...value, createdAt: "2028-01-10T00:01:00.000Z" })).rejects.toThrow("ERR_DECISION_AUTHORITY_GRANT_IMMUTABLE_CONFLICT");
    await first.sql.end({ timeout: 5 }); clients.delete(first.sql);
    const fresh = await client();
    const restarted = new PostgresDecisionAuthorityGrantRevisionRepository(fresh.db);
    await expect(byteReplayDecisionAuthorityGrantRevision(value.decisionAuthorityGrantRevisionId, restarted)).resolves.toEqual(value);
    await expect(semanticReplayDecisionAuthorityGrantRevision(value.decisionAuthorityGrantRevisionId, restarted)).resolves.toEqual(value);
    await expect(derivationReplayDecisionAuthorityGrantRevision(value.decisionAuthorityGrantRevisionId, restarted)).resolves.toEqual(value);
    await fresh.sql.end({ timeout: 5 }); clients.delete(fresh.sql);
  });

  it("fails closed for physical/payload divergence and every raw normalized inventory divergence", async () => {
    const { sql, db } = await client();
    const repository = new PostgresDecisionAuthorityGrantRevisionRepository(db);
    const value = grant("corruption");
    await repository.persistDecisionAuthorityGrantRevision(value);
    const invalid = (transaction: PostgresJsDatabase) => expect(new PostgresDecisionAuthorityGrantRevisionRepository(transaction).getDecisionAuthorityGrantRevisionById(value.decisionAuthorityGrantRevisionId)).rejects.toThrow("ERR_DECISION_AUTHORITY_GRANT_PERSISTENCE_FAILED");
    const rollback = async (operation: (transaction: PostgresJsDatabase) => Promise<void>) => db.transaction(async transaction => { await operation(transaction as unknown as PostgresJsDatabase); throw new Error("rollback corruption"); }).catch(error => { if (error.message !== "rollback corruption") throw error; });
    for (const statement of [
      drizzleSql`UPDATE decision_authority_grant_revisions SET payload=jsonb_set(payload,'{decisionAuthorityGrantRevisionId}','"DAR_00000000000000000000000000000000"'::jsonb) WHERE decision_authority_grant_revision_id=${value.decisionAuthorityGrantRevisionId}`,
      drizzleSql`UPDATE decision_authority_grant_revisions SET payload=jsonb_set(payload,'{grantorActorId}','"foreign"'::jsonb) WHERE decision_authority_grant_revision_id=${value.decisionAuthorityGrantRevisionId}`,
      drizzleSql`UPDATE decision_authority_grant_revisions SET grantor_actor_id='foreign' WHERE decision_authority_grant_revision_id=${value.decisionAuthorityGrantRevisionId}`,
      drizzleSql`UPDATE decision_authority_grant_revisions SET authorized_actor_id='foreign' WHERE decision_authority_grant_revision_id=${value.decisionAuthorityGrantRevisionId}`,
      drizzleSql`UPDATE decision_authority_grant_revisions SET authority_scope='foreign' WHERE decision_authority_grant_revision_id=${value.decisionAuthorityGrantRevisionId}`,
      drizzleSql`UPDATE decision_authority_grant_revisions SET declared_at='2028-01-01T00:00:00.000Z' WHERE decision_authority_grant_revision_id=${value.decisionAuthorityGrantRevisionId}`,
      drizzleSql`UPDATE decision_authority_grant_revisions SET effective_from='2028-01-01T00:00:00.000Z' WHERE decision_authority_grant_revision_id=${value.decisionAuthorityGrantRevisionId}`,
      drizzleSql`UPDATE decision_authority_grant_revisions SET schema_version='foreign' WHERE decision_authority_grant_revision_id=${value.decisionAuthorityGrantRevisionId}`,
      drizzleSql`UPDATE decision_authority_grant_revisions SET created_at='2028-01-01T00:00:00.000Z' WHERE decision_authority_grant_revision_id=${value.decisionAuthorityGrantRevisionId}`
    ]) await rollback(async transaction => { await transaction.execute(statement); await invalid(transaction); });
    await rollback(async transaction => { await transaction.execute(drizzleSql`DELETE FROM decision_authority_grant_decision_classes WHERE decision_authority_grant_revision_id=${value.decisionAuthorityGrantRevisionId}`); await invalid(transaction); });
    await rollback(async transaction => { await transaction.execute(drizzleSql`INSERT INTO decision_authority_grant_decision_classes(reference_id,decision_authority_grant_revision_id,decision_class) VALUES(${`${value.decisionAuthorityGrantRevisionId}:class:extra`},${value.decisionAuthorityGrantRevisionId},'REJECT_RECOMMENDATION')`); await invalid(transaction); });
    await rollback(async transaction => { await transaction.execute(drizzleSql`INSERT INTO decision_authority_grant_decision_classes(reference_id,decision_authority_grant_revision_id,decision_class) VALUES(${`${value.decisionAuthorityGrantRevisionId}:class:duplicate`},${value.decisionAuthorityGrantRevisionId},'ACCEPT_RECOMMENDATION')`); await invalid(transaction); });
    await rollback(async transaction => { await transaction.execute(drizzleSql`DELETE FROM decision_authority_grant_subject_kinds WHERE decision_authority_grant_revision_id=${value.decisionAuthorityGrantRevisionId}`); await invalid(transaction); });
    await rollback(async transaction => { await transaction.execute(drizzleSql`INSERT INTO decision_authority_grant_subject_kinds(reference_id,decision_authority_grant_revision_id,subject_kind) VALUES(${`${value.decisionAuthorityGrantRevisionId}:subject:foreign`},${value.decisionAuthorityGrantRevisionId},'FOREIGN_SUBJECT')`); await invalid(transaction); });
    await rollback(async transaction => { await transaction.execute(drizzleSql`INSERT INTO decision_authority_grant_subject_kinds(reference_id,decision_authority_grant_revision_id,subject_kind) VALUES(${`${value.decisionAuthorityGrantRevisionId}:subject:extra`},${value.decisionAuthorityGrantRevisionId},'RCP_ITEM')`); await invalid(transaction); });
    await rollback(async transaction => { await transaction.execute(drizzleSql`DELETE FROM decision_authority_grant_evidence_references WHERE decision_authority_grant_revision_id=${value.decisionAuthorityGrantRevisionId}`); await invalid(transaction); });
    await rollback(async transaction => { await transaction.execute(drizzleSql`INSERT INTO decision_authority_grant_evidence_references(reference_id,decision_authority_grant_revision_id,authority_evidence_ref) VALUES(${`${value.decisionAuthorityGrantRevisionId}:evidence:extra`},${value.decisionAuthorityGrantRevisionId},'evidence://grant/foreign')`); await invalid(transaction); });
    await rollback(async transaction => { await transaction.execute(drizzleSql`INSERT INTO decision_authority_grant_evidence_references(reference_id,decision_authority_grant_revision_id,authority_evidence_ref) VALUES(${`${value.decisionAuthorityGrantRevisionId}:evidence:duplicate`},${value.decisionAuthorityGrantRevisionId},${value.authorityEvidenceRefs[0]})`); await invalid(transaction); });
    await expect(repository.getDecisionAuthorityGrantRevisionById(value.decisionAuthorityGrantRevisionId)).resolves.toEqual(value);
    await sql.end({ timeout: 5 }); clients.delete(sql);
  });

  it("atomically rolls back every root-plus-inventory failure and accepts a clean retry", async () => {
    const { sql, db } = await client();
    const cases = [
      ["decision_authority_grant_decision_classes", "class"],
      ["decision_authority_grant_subject_kinds", "subject"],
      ["decision_authority_grant_evidence_references", "evidence"]
    ] as const;
    for (const [table, suffix] of cases) {
      const value = grant(`atomic-${suffix}`);
      const repository = new PostgresDecisionAuthorityGrantRevisionRepository(db);
      const fn = `reject_${suffix}_${randomBytes(4).toString("hex")}`;
      const trigger = `trigger_${suffix}_${randomBytes(4).toString("hex")}`;
      await sql.unsafe(`CREATE FUNCTION ${fn}() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'injected ${suffix} failure'; END; $$`);
      await sql.unsafe(`CREATE TRIGGER ${trigger} BEFORE INSERT ON ${table} FOR EACH ROW EXECUTE FUNCTION ${fn}()`);
      await expect(repository.persistDecisionAuthorityGrantRevision(value)).rejects.toThrow("ERR_DECISION_AUTHORITY_GRANT_PERSISTENCE_FAILED");
      expect(Number((await sql`SELECT count(*)::int AS count FROM decision_authority_grant_revisions WHERE decision_authority_grant_revision_id=${value.decisionAuthorityGrantRevisionId}`)[0].count)).toBe(0);
      expect(Number((await sql.unsafe(`SELECT count(*)::int AS count FROM ${table} WHERE decision_authority_grant_revision_id='${value.decisionAuthorityGrantRevisionId}'`))[0].count)).toBe(0);
      await sql.unsafe(`DROP TRIGGER ${trigger} ON ${table}`);
      await sql.unsafe(`DROP FUNCTION ${fn}()`);
      await expect(repository.persistDecisionAuthorityGrantRevision(value)).resolves.toEqual(value);
    }
    await sql.end({ timeout: 5 }); clients.delete(sql);
  });
});
