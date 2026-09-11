import { randomBytes } from "node:crypto";
import { sql as drizzleSql } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/pg-core";
import { afterAll, describe, expect, it } from "vitest";
import { createCareerExecutionAuthorityGrantRevision } from "../../../../lib/career/relation/execution-authority-grant";
import { PostgresCareerDecisionActionIntentRepository } from "../../../../lib/career/relation-adapters/action-intent-persistence";
import { PostgresCareerHumanCommitmentRepository } from "../../../../lib/career/relation-adapters/human-commitment-persistence";
import {
  careerHumanCommitmentEvidenceReferences,
  careerHumanCommitmentSubjects,
  careerHumanCommitments,
} from "../../../../lib/career/relation-adapters/human-commitment-persistence/postgres-schema";
import { createT12CHistoricalFixture } from "./t12c-historical-fixture";
import {
  closeT12AHistoricalFixture,
  createT12AHistoricalClient,
  readyT12AHistoricalGraph,
  transactionScopedT12AHistoricalGraph,
} from "../action-intent/t12a-historical-fixture";

const loadAdapter = () => import("../../../../lib/career/relation-adapters/execution-authority-grant-persistence") as Promise<any>;
const loadSchema = () => import("../../../../lib/career/relation-adapters/execution-authority-grant-persistence/postgres-schema") as Promise<any>;
const missing = "EAGR_00000000000000000000000000000000";

afterAll(closeT12AHistoricalFixture);

async function createTables(database: any, tables: readonly any[]) {
  for (const table of tables) {
    const config = getTableConfig(table);
    const columns = config.columns.map(column => `"${column.name}" ${column.getSQLType()}${column.notNull ? " NOT NULL" : ""}${column.primary ? " PRIMARY KEY" : ""}`);
    await database.execute(drizzleSql.raw(`CREATE TABLE IF NOT EXISTS "${config.name}" (${columns.join(",")})`));
  }
}

async function ready() {
  const adapter = await loadAdapter();
  const schema = await loadSchema();
  const base = await readyT12AHistoricalGraph();
  await createTables(base.first.db, [careerHumanCommitments, careerHumanCommitmentSubjects, careerHumanCommitmentEvidenceReferences]);
  await createTables(base.first.db, [schema.careerExecutionAuthorityGrantRevisions, schema.careerExecutionAuthorityGrantSubjects, schema.careerExecutionAuthorityGrantTargetKinds, schema.careerExecutionAuthorityGrantChannelKinds, schema.careerExecutionAuthorityGrantEvidenceReferences]);
  const intents = new PostgresCareerDecisionActionIntentRepository(base.first.db, base.records);
  await intents.persistCareerDecisionActionIntent(base.actionIntent);
  const commitments = new PostgresCareerHumanCommitmentRepository(base.first.db, intents);
  const value = createT12CHistoricalFixture();
  await commitments.persistCareerHumanCommitment(value.commitment);
  const grants = new adapter.PostgresCareerExecutionAuthorityGrantRevisionRepository(base.first.db, commitments);
  return { ...base, value, intents, commitments, grants, adapter };
}

async function scoped(database: any, base: Awaited<ReturnType<typeof ready>>) {
  const historical = transactionScopedT12AHistoricalGraph(database, base.evolution, base.implementations);
  const intents = new PostgresCareerDecisionActionIntentRepository(database, historical.records);
  const commitments = new PostgresCareerHumanCommitmentRepository(database, intents);
  return { historical, intents, commitments, grants: new base.adapter.PostgresCareerExecutionAuthorityGrantRevisionRepository(database, commitments) };
}

async function rollback(base: Awaited<ReturnType<typeof ready>>, operation: (transaction: any, scopedValue: Awaited<ReturnType<typeof scoped>>) => Promise<void>) {
  await base.first.db.transaction(async transaction => { await operation(transaction, await scoped(transaction, base)); throw new Error("rollback"); }).catch(error => { if (error.message !== "rollback") throw error; });
}

describe("T12C PostgreSQL immutable CareerExecutionAuthorityGrantRevision RED contract", () => {
  it("persists exact EAGR, detached rereads, restart rereads, and NOT_FOUND", async () => {
    const base = await ready(); const value = base.value.grant;
    await expect(base.grants.persistCareerExecutionAuthorityGrantRevision(value)).resolves.toEqual(value);
    const first = await base.grants.getCareerExecutionAuthorityGrantRevisionById(value.careerExecutionAuthorityGrantRevisionId); expect(first).toEqual(value); first.operationDescription = "local";
    await expect(base.grants.getCareerExecutionAuthorityGrantRevisionById(value.careerExecutionAuthorityGrantRevisionId)).resolves.toEqual(value);
    await base.first.sql.end({ timeout: 5 }); const fresh = await createT12AHistoricalClient(); const historical = transactionScopedT12AHistoricalGraph(fresh.db, base.evolution, base.implementations); const intents = new PostgresCareerDecisionActionIntentRepository(fresh.db, historical.records); const commitments = new PostgresCareerHumanCommitmentRepository(fresh.db, intents); const restarted = new base.adapter.PostgresCareerExecutionAuthorityGrantRevisionRepository(fresh.db, commitments);
    await expect(restarted.getCareerExecutionAuthorityGrantRevisionById(value.careerExecutionAuthorityGrantRevisionId)).resolves.toEqual(value);
    await expect(restarted.getCareerExecutionAuthorityGrantRevisionById(missing)).rejects.toThrow("ERR_CAREER_EXECUTION_AUTHORITY_GRANT_NOT_FOUND"); await fresh.sql.end({ timeout: 5 });
  });

  it("is idempotent only for exact state and preserves createdAt as immutable durable history", async () => {
    const base = await ready(); const value = base.value.grant;
    await base.grants.persistCareerExecutionAuthorityGrantRevision(value);
    await expect(base.grants.persistCareerExecutionAuthorityGrantRevision(value)).resolves.toEqual(value);
    for (const changed of [{ ...value, createdAt: "2027-02-05T00:00:00.000Z" }, { ...value, operationDescription: "other" }]) await expect(base.grants.persistCareerExecutionAuthorityGrantRevision(changed)).rejects.toThrow("ERR_CAREER_EXECUTION_AUTHORITY_GRANT_IMMUTABLE_CONFLICT");
    await expect(base.grants.getCareerExecutionAuthorityGrantRevisionById(value.careerExecutionAuthorityGrantRevisionId)).resolves.toEqual(value);
  });

  it("fails closed for root, payload, and every normalized inventory corruption", async () => {
    const base = await ready(); const value = base.value.grant; const id = value.careerExecutionAuthorityGrantRevisionId;
    await base.grants.persistCareerExecutionAuthorityGrantRevision(value);
    const invalid = async (s: any) => expect(s.grants.getCareerExecutionAuthorityGrantRevisionById(id)).rejects.toThrow("ERR_CAREER_EXECUTION_AUTHORITY_GRANT_PERSISTENCE_FAILED");
    for (const column of ["career_human_commitment_id", "human_decision_record_id", "career_decision_action_intent_id", "career_decision_context_revision_id", "decision_authority_grant_revision_id", "recommendation_proposal_id", "grantor_actor_id", "authorized_execution_actor_id", "source_declaration_class", "source_action_intent_class", "operation_description", "execution_authority_scope", "declared_at", "effective_from", "effective_until", "schema_version", "created_at"]) await rollback(base, async (t, s) => { await t.execute(drizzleSql.raw(`UPDATE career_execution_authority_grant_revisions SET ${column}='BROKEN' WHERE career_execution_authority_grant_revision_id='${id}'`)); await invalid(s); });
    for (const payload of [
      `jsonb_set(payload,'{careerExecutionAuthorityGrantRevisionId}','"${missing}"'::jsonb)`,
      `jsonb_set(payload,'{authorizedExecutionActorId}','"PAYLOAD_OTHER"'::jsonb)`,
      `jsonb_set(payload,'{permittedTargetKinds}','["SYSTEM","PERSON"]'::jsonb)`,
    ]) await rollback(base, async (t, s) => { await t.execute(drizzleSql.raw(`UPDATE career_execution_authority_grant_revisions SET payload=${payload} WHERE career_execution_authority_grant_revision_id='${id}'`)); await invalid(s); });
    await rollback(base, async (t, s) => {
      await t.execute(drizzleSql.raw(`UPDATE career_execution_authority_grant_revisions SET career_execution_authority_grant_revision_id='${missing}' WHERE career_execution_authority_grant_revision_id='${id}'`));
      await expect(s.grants.getCareerExecutionAuthorityGrantRevisionById(missing)).rejects.toThrow("ERR_CAREER_EXECUTION_AUTHORITY_GRANT_PERSISTENCE_FAILED");
    });
    const subject = value.decisionSubjects[0];
    for (const statement of [
      `DELETE FROM career_execution_authority_grant_subjects WHERE career_execution_authority_grant_revision_id='${id}' AND source_evolution_input_item_ordinal=${subject.sourceEvolutionInputItemOrdinal}`,
      `INSERT INTO career_execution_authority_grant_subjects(reference_id,career_execution_authority_grant_revision_id,recommendation_proposal_id,source_evolution_input_item_ordinal) VALUES('extra','${id}','${value.recommendationProposalId}',99)`,
      `INSERT INTO career_execution_authority_grant_subjects(reference_id,career_execution_authority_grant_revision_id,recommendation_proposal_id,source_evolution_input_item_ordinal) VALUES('duplicate','${id}','${value.recommendationProposalId}',${subject.sourceEvolutionInputItemOrdinal})`,
      `UPDATE career_execution_authority_grant_subjects SET recommendation_proposal_id='RCP_00000000000000000000000000000000' WHERE career_execution_authority_grant_revision_id='${id}' AND source_evolution_input_item_ordinal=${subject.sourceEvolutionInputItemOrdinal}`,
      `UPDATE career_execution_authority_grant_subjects SET source_evolution_input_item_ordinal=99 WHERE career_execution_authority_grant_revision_id='${id}' AND source_evolution_input_item_ordinal=${subject.sourceEvolutionInputItemOrdinal}`,
    ]) await rollback(base, async (t, s) => { await t.execute(drizzleSql.raw(statement)); await invalid(s); });
    for (const [table, column, changed] of [
      ["career_execution_authority_grant_target_kinds", "target_kind", "UNKNOWN"],
      ["career_execution_authority_grant_channel_kinds", "channel_kind", "UNKNOWN"],
      ["career_execution_authority_grant_evidence_references", "authority_evidence_ref", " "],
    ]) await rollback(base, async (t, s) => { await t.execute(drizzleSql.raw(`UPDATE ${table} SET ${column}='${changed}' WHERE career_execution_authority_grant_revision_id='${id}'`)); await invalid(s); });
    await expect(base.grants.getCareerExecutionAuthorityGrantRevisionById(id)).resolves.toEqual(value);
  });

  it("fails closed for missing, extra, and duplicate target, channel, and evidence durable rows", async () => {
    const base = await ready(); const value = base.value.grant; const id = value.careerExecutionAuthorityGrantRevisionId;
    await base.grants.persistCareerExecutionAuthorityGrantRevision(value);
    const invalid = async (s: any) => expect(s.grants.getCareerExecutionAuthorityGrantRevisionById(id)).rejects.toThrow("ERR_CAREER_EXECUTION_AUTHORITY_GRANT_PERSISTENCE_FAILED");
    for (const [table, column, original, extra] of [
      ["career_execution_authority_grant_target_kinds", "target_kind", value.permittedTargetKinds[0], "ORGANIZATION"],
      ["career_execution_authority_grant_channel_kinds", "channel_kind", value.permittedChannelKinds[0], "DOCUMENT"],
      ["career_execution_authority_grant_evidence_references", "authority_evidence_ref", value.authorityEvidenceRefs[0], "evidence://extra"],
    ]) {
      await rollback(base, async (t, s) => { await t.execute(drizzleSql.raw(`DELETE FROM ${table} WHERE career_execution_authority_grant_revision_id='${id}' AND ${column}='${original}'`)); await invalid(s); });
      await rollback(base, async (t, s) => { await t.execute(drizzleSql.raw(`INSERT INTO ${table}(reference_id,career_execution_authority_grant_revision_id,${column}) VALUES('extra-${table}','${id}','${extra}')`)); await invalid(s); });
      await rollback(base, async (t, s) => { await t.execute(drizzleSql.raw(`INSERT INTO ${table}(reference_id,career_execution_authority_grant_revision_id,${column}) VALUES('duplicate-${table}','${id}','${original}')`)); await invalid(s); });
    }
  });

  it("propagates exact HCOM, DAINT, DCR, DCTXREV, DAR, and RCP corruption through one scoped graph", async () => {
    const base = await ready(); const value = base.value.grant; const id = value.careerExecutionAuthorityGrantRevisionId;
    await base.grants.persistCareerExecutionAuthorityGrantRevision(value);
    for (const [table, column, key, artifactId] of [
      ["career_human_commitments", "committed_by_actor_id", "career_human_commitment_id", value.careerHumanCommitmentId],
      ["career_decision_action_intents", "declared_by_actor_id", "career_decision_action_intent_id", value.careerDecisionActionIntentId],
      ["human_decision_records", "declarant_actor_id", "human_decision_record_id", value.humanDecisionRecordId],
      ["career_decision_context_revisions", "authority_scope", "career_decision_context_revision_id", value.careerDecisionContextRevisionId],
      ["decision_authority_grant_revisions", "authority_scope", "decision_authority_grant_revision_id", value.decisionAuthorityGrantRevisionId],
      ["recommendation_proposals", "schema_version", "recommendation_proposal_id", value.recommendationProposalId],
    ]) await rollback(base, async (t, s) => { await t.execute(drizzleSql.raw(`UPDATE ${table} SET ${column}='BROKEN' WHERE ${key}='${artifactId}'`)); await expect(s.grants.getCareerExecutionAuthorityGrantRevisionById(id)).rejects.toThrow("ERR_CAREER_EXECUTION_AUTHORITY_GRANT_PERSISTENCE_FAILED"); });
  });

  it("preserves EAGR after historical DAR expiry because no current authority status is inferred", async () => {
    const base = await ready();
    expect(base.value.grant.declaredAt > base.authority.effectiveUntil!).toBe(true);
    await expect(base.grants.persistCareerExecutionAuthorityGrantRevision(base.value.grant)).resolves.toEqual(base.value.grant);
  });

  it("atomically rolls back root, subject, target, channel, and evidence failures before clean retry", async () => {
    const base = await ready(); const tables = ["career_execution_authority_grant_revisions", "career_execution_authority_grant_subjects", "career_execution_authority_grant_target_kinds", "career_execution_authority_grant_channel_kinds", "career_execution_authority_grant_evidence_references"] as const;
    for (const table of tables) {
      const suffix = randomBytes(4).toString("hex"); const value = createCareerExecutionAuthorityGrantRevision(base.value.commitment, { careerHumanCommitmentId: base.value.commitment.careerHumanCommitmentId, grantorActorId: "GRANTOR", authorizedExecutionActorId: "EXECUTOR", executionAuthorityScope: "RECOMMENDATION_OPERATION_EXECUTION", permittedTargetKinds: ["PERSON"], permittedChannelKinds: ["EMAIL"], authorityEvidenceRefs: [`evidence://atomic/${suffix}`], declaredAt: base.value.grant.declaredAt, effectiveFrom: base.value.grant.effectiveFrom, effectiveUntil: base.value.grant.effectiveUntil, createdAt: base.value.grant.createdAt });
      const fn = `fail_eagr_${suffix}`, trigger = `trigger_eagr_${suffix}`;
      await base.first.sql.unsafe(`CREATE FUNCTION ${fn}() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'injected'; END; $$`); await base.first.sql.unsafe(`CREATE TRIGGER ${trigger} BEFORE INSERT ON ${table} FOR EACH ROW EXECUTE FUNCTION ${fn}()`);
      await expect(base.grants.persistCareerExecutionAuthorityGrantRevision(value)).rejects.toThrow("ERR_CAREER_EXECUTION_AUTHORITY_GRANT_PERSISTENCE_FAILED");
      for (const durable of tables) { const rows = await base.first.sql.unsafe(`SELECT count(*)::int AS count FROM ${durable} WHERE career_execution_authority_grant_revision_id='${value.careerExecutionAuthorityGrantRevisionId}'`); expect(Number(rows[0].count)).toBe(0); }
      await base.first.sql.unsafe(`DROP TRIGGER ${trigger} ON ${table}`); await base.first.sql.unsafe(`DROP FUNCTION ${fn}()`);
      await expect(base.grants.persistCareerExecutionAuthorityGrantRevision(value)).resolves.toEqual(value);
    }
  });

  it("requires post-commit exact reread and exposes no current, mutable, legacy, or execution-occurrence API", async () => {
    const base = await ready(); const surface = Object.getOwnPropertyNames(Object.getPrototypeOf(base.grants));
    expect(surface).not.toEqual(expect.arrayContaining(["getCurrentCareerExecutionAuthorityGrantRevision", "getLatestCareerExecutionAuthorityGrantRevision", "updateCareerExecutionAuthorityGrantRevision", "repairCareerExecutionAuthorityGrantRevision", "replaceCareerExecutionAuthorityGrantRevision", "supersedeCareerExecutionAuthorityGrantRevision", "createExecutionContext", "createActionOccurrence", "regenerateCareerExecutionAuthorityGrantRevision"]));
    const suffix = randomBytes(4).toString("hex");
    const value = createCareerExecutionAuthorityGrantRevision(base.value.commitment, { careerHumanCommitmentId: base.value.commitment.careerHumanCommitmentId, grantorActorId: "GRANTOR", authorizedExecutionActorId: "EXECUTOR", executionAuthorityScope: "RECOMMENDATION_OPERATION_EXECUTION", permittedTargetKinds: ["PERSON"], permittedChannelKinds: ["EMAIL"], authorityEvidenceRefs: [`evidence://post-commit/${suffix}`], declaredAt: base.value.grant.declaredAt, effectiveFrom: base.value.grant.effectiveFrom, effectiveUntil: base.value.grant.effectiveUntil, createdAt: base.value.grant.createdAt });
    const fn = `mutate_eagr_${suffix}`, trigger = `trigger_eagr_${suffix}`;
    await base.first.sql.unsafe(`CREATE FUNCTION ${fn}() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN UPDATE career_execution_authority_grant_revisions SET operation_description='tampered after insert' WHERE career_execution_authority_grant_revision_id=NEW.career_execution_authority_grant_revision_id; RETURN NEW; END; $$`);
    await base.first.sql.unsafe(`CREATE TRIGGER ${trigger} AFTER INSERT ON career_execution_authority_grant_revisions FOR EACH ROW EXECUTE FUNCTION ${fn}()`);
    await expect(base.grants.persistCareerExecutionAuthorityGrantRevision(value)).rejects.toThrow("ERR_CAREER_EXECUTION_AUTHORITY_GRANT_PERSISTENCE_FAILED");
    await base.first.sql.unsafe(`DROP TRIGGER ${trigger} ON career_execution_authority_grant_revisions`); await base.first.sql.unsafe(`DROP FUNCTION ${fn}()`);
    for (const table of ["career_execution_authority_grant_subjects", "career_execution_authority_grant_target_kinds", "career_execution_authority_grant_channel_kinds", "career_execution_authority_grant_evidence_references", "career_execution_authority_grant_revisions"]) await base.first.sql.unsafe(`DELETE FROM ${table} WHERE career_execution_authority_grant_revision_id='${value.careerExecutionAuthorityGrantRevisionId}'`);
  });
});
