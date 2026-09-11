import { randomBytes } from "node:crypto";
import { sql as drizzleSql } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/pg-core";
import { afterAll, describe, expect, it } from "vitest";
import { createCareerHumanCommitment } from "../../../../lib/career/relation/human-commitment";
import { PostgresCareerDecisionActionIntentRepository } from "../../../../lib/career/relation-adapters/action-intent-persistence";
import { createT12BHistoricalFixture } from "./t12b-historical-fixture";
import { closeT12AHistoricalFixture, createT12AHistoricalClient, readyT12AHistoricalGraph, transactionScopedT12AHistoricalGraph } from "../action-intent/t12a-historical-fixture";

const loadAdapter = () => import("../../../../lib/career/relation-adapters/human-commitment-persistence") as Promise<any>;
const loadSchema = () => import("../../../../lib/career/relation-adapters/human-commitment-persistence/postgres-schema") as Promise<any>;
const missing = "HCOM_00000000000000000000000000000000";

afterAll(closeT12AHistoricalFixture);

async function tables(database: any) {
  const schema = await loadSchema();
  for (const table of [schema.careerHumanCommitments, schema.careerHumanCommitmentSubjects, schema.careerHumanCommitmentEvidenceReferences]) {
    const config = getTableConfig(table);
    const columns = config.columns.map(column => `"${column.name}" ${column.getSQLType()}${column.notNull ? " NOT NULL" : ""}${column.primary ? " PRIMARY KEY" : ""}`);
    await database.execute(drizzleSql.raw(`CREATE TABLE IF NOT EXISTS "${config.name}" (${columns.join(",")})`));
  }
}

async function ready() {
  const adapter = await loadAdapter();
  const base = await readyT12AHistoricalGraph();
  await tables(base.first.db);
  const intent = new PostgresCareerDecisionActionIntentRepository(base.first.db, base.records);
  await intent.persistCareerDecisionActionIntent(base.actionIntent);
  const value = createT12BHistoricalFixture();
  const commitments = new adapter.PostgresCareerHumanCommitmentRepository(base.first.db, intent);
  return { ...base, value, intent, commitments, adapter };
}

async function scoped(database: any, base: Awaited<ReturnType<typeof ready>>) {
  const historical = transactionScopedT12AHistoricalGraph(database, base.evolution, base.implementations);
  const intent = new PostgresCareerDecisionActionIntentRepository(database, historical.records);
  return { historical, intent, commitments: new base.adapter.PostgresCareerHumanCommitmentRepository(database, intent) };
}

async function rollback(base: Awaited<ReturnType<typeof ready>>, operation: (transaction: any, value: Awaited<ReturnType<typeof scoped>>) => Promise<void>) {
  await base.first.db.transaction(async transaction => { await operation(transaction, await scoped(transaction, base)); throw new Error("rollback"); }).catch(error => { if (error.message !== "rollback") throw error; });
}

describe("T12B PostgreSQL immutable CareerHumanCommitment RED contract", () => {
  it("persists exact HCOM, detached rereads, restarts, and reports NOT_FOUND", async () => {
    const base = await ready(); const value = base.value.commitment;
    await expect(base.commitments.persistCareerHumanCommitment(value)).resolves.toEqual(value);
    const first = await base.commitments.getCareerHumanCommitmentById(value.careerHumanCommitmentId); expect(first).toEqual(value); (first as any).operationDescription = "local";
    await expect(base.commitments.getCareerHumanCommitmentById(value.careerHumanCommitmentId)).resolves.toEqual(value);
    await base.first.sql.end({ timeout: 5 }); const fresh = await createT12AHistoricalClient(); const intent = new PostgresCareerDecisionActionIntentRepository(fresh.db, transactionScopedT12AHistoricalGraph(fresh.db, base.evolution, base.implementations).records); const restarted = new base.adapter.PostgresCareerHumanCommitmentRepository(fresh.db, intent);
    await expect(restarted.getCareerHumanCommitmentById(value.careerHumanCommitmentId)).resolves.toEqual(value);
    await expect(restarted.getCareerHumanCommitmentById(missing)).rejects.toThrow("ERR_CAREER_HUMAN_COMMITMENT_NOT_FOUND"); await fresh.sql.end({ timeout: 5 });
  });

  it("is idempotent only for exact state and never overwrites createdAt or semantic same-ID divergence", async () => {
    const base = await ready(); const value = base.value.commitment;
    await base.commitments.persistCareerHumanCommitment(value); await expect(base.commitments.persistCareerHumanCommitment(value)).resolves.toEqual(value);
    for (const changed of [{ ...value, createdAt: "2027-02-04T00:00:00.000Z" }, { ...value, operationDescription: "other" }]) await expect(base.commitments.persistCareerHumanCommitment(changed)).rejects.toThrow("ERR_CAREER_HUMAN_COMMITMENT_IMMUTABLE_CONFLICT");
    await expect(base.commitments.getCareerHumanCommitmentById(value.careerHumanCommitmentId)).resolves.toEqual(value);
  });

  it("fails closed for every root and payload witness corruption", async () => {
    const base = await ready(); const value = base.value.commitment; await base.commitments.persistCareerHumanCommitment(value);
    for (const column of ["career_decision_action_intent_id", "human_decision_record_id", "career_decision_context_revision_id", "decision_authority_grant_revision_id", "recommendation_proposal_id", "committed_by_actor_id", "source_declaration_class", "source_action_intent_class", "operation_description", "committed_at", "schema_version", "created_at"]) await rollback(base, async (transaction, valueScoped) => {
      await transaction.execute(drizzleSql.raw(`UPDATE career_human_commitments SET ${column}='BROKEN' WHERE career_human_commitment_id='${value.careerHumanCommitmentId}'`));
      await expect(valueScoped.commitments.getCareerHumanCommitmentById(value.careerHumanCommitmentId)).rejects.toThrow("ERR_CAREER_HUMAN_COMMITMENT_PERSISTENCE_FAILED");
    });
    await rollback(base, async (transaction, valueScoped) => {
      await transaction.execute(drizzleSql.raw(`UPDATE career_human_commitments SET payload=jsonb_set(payload,'{careerHumanCommitmentId}','"HCOM_00000000000000000000000000000000"'::jsonb) WHERE career_human_commitment_id='${value.careerHumanCommitmentId}'`));
      await expect(valueScoped.commitments.getCareerHumanCommitmentById(value.careerHumanCommitmentId)).rejects.toThrow("ERR_CAREER_HUMAN_COMMITMENT_PERSISTENCE_FAILED");
    });
    for (const payload of [
      `jsonb_set(payload,'{committedByActorId}','"PAYLOAD_OTHER"'::jsonb)`,
      `jsonb_set(payload,'{operationDescription}','"payload operation"'::jsonb)`,
    ]) await rollback(base, async (transaction, valueScoped) => {
      await transaction.execute(drizzleSql.raw(`UPDATE career_human_commitments SET payload=${payload} WHERE career_human_commitment_id='${value.careerHumanCommitmentId}'`));
      await expect(valueScoped.commitments.getCareerHumanCommitmentById(value.careerHumanCommitmentId)).rejects.toThrow("ERR_CAREER_HUMAN_COMMITMENT_PERSISTENCE_FAILED");
    });
    await expect(base.commitments.getCareerHumanCommitmentById(value.careerHumanCommitmentId)).resolves.toEqual(value);
  });

  it("fails closed for missing, extra, duplicate, foreign, and wrong-ordinal durable subjects", async () => {
    const base = await ready(); const value = base.value.commitment; await base.commitments.persistCareerHumanCommitment(value); const id = value.careerHumanCommitmentId; const subject = value.decisionSubjects[0];
    const invalid = async (transaction: any, scopedValue: any) => expect(scopedValue.commitments.getCareerHumanCommitmentById(id)).rejects.toThrow("ERR_CAREER_HUMAN_COMMITMENT_PERSISTENCE_FAILED");
    await rollback(base, async (t, s) => { await t.execute(drizzleSql.raw(`DELETE FROM career_human_commitment_subjects WHERE career_human_commitment_id='${id}' AND source_evolution_input_item_ordinal=${subject.sourceEvolutionInputItemOrdinal}`)); await invalid(t, s); });
    for (const [reference, proposal, ordinal] of [["extra", value.recommendationProposalId, 99], ["duplicate", value.recommendationProposalId, subject.sourceEvolutionInputItemOrdinal]]) await rollback(base, async (t, s) => { await t.execute(drizzleSql.raw(`INSERT INTO career_human_commitment_subjects(reference_id,career_human_commitment_id,recommendation_proposal_id,source_evolution_input_item_ordinal) VALUES('${reference}','${id}','${proposal}',${ordinal})`)); await invalid(t, s); });
    await rollback(base, async (t, s) => { await t.execute(drizzleSql.raw(`UPDATE career_human_commitment_subjects SET recommendation_proposal_id='RCP_11111111111111111111111111111111' WHERE career_human_commitment_id='${id}' AND source_evolution_input_item_ordinal=${subject.sourceEvolutionInputItemOrdinal}`)); await invalid(t, s); });
    await rollback(base, async (t, s) => { await t.execute(drizzleSql.raw(`UPDATE career_human_commitment_subjects SET source_evolution_input_item_ordinal=99 WHERE career_human_commitment_id='${id}' AND source_evolution_input_item_ordinal=${subject.sourceEvolutionInputItemOrdinal}`)); await invalid(t, s); });
    await expect(base.commitments.getCareerHumanCommitmentById(id)).resolves.toEqual(value);
  });

  it("fails closed for missing, extra, duplicate, and blank durable evidence", async () => {
    const base = await ready(); const value = base.value.commitment; await base.commitments.persistCareerHumanCommitment(value); const id = value.careerHumanCommitmentId;
    const invalid = async (s: any) => expect(s.commitments.getCareerHumanCommitmentById(id)).rejects.toThrow("ERR_CAREER_HUMAN_COMMITMENT_PERSISTENCE_FAILED");
    await rollback(base, async (t, s) => { await t.execute(drizzleSql.raw(`DELETE FROM career_human_commitment_evidence_references WHERE career_human_commitment_id='${id}'`)); await invalid(s); });
    for (const [reference, evidence] of [["extra", "evidence://extra"], ["duplicate", value.commitmentEvidenceRefs[0]], ["blank", " "]]) await rollback(base, async (t, s) => { await t.execute(drizzleSql.raw(`INSERT INTO career_human_commitment_evidence_references(reference_id,career_human_commitment_id,commitment_evidence_ref) VALUES('${reference}','${id}','${evidence}')`)); await invalid(s); });
    await expect(base.commitments.getCareerHumanCommitmentById(id)).resolves.toEqual(value);
  });

  it("propagates exact DAINT, DCR, DCTXREV, DAR, and RCP corruption through one transaction-scoped graph", async () => {
    const base = await ready(); const value = base.value.commitment; await base.commitments.persistCareerHumanCommitment(value); const id = value.careerHumanCommitmentId;
    for (const [table, column, artifactId] of [["career_decision_action_intents", "declared_by_actor_id", value.careerDecisionActionIntentId], ["human_decision_records", "declarant_actor_id", value.humanDecisionRecordId], ["human_decision_records", "declaration_class", value.humanDecisionRecordId], ["career_decision_context_revisions", "authority_scope", value.careerDecisionContextRevisionId], ["decision_authority_grant_revisions", "authority_scope", value.decisionAuthorityGrantRevisionId], ["recommendation_proposals", "schema_version", value.recommendationProposalId]]) await rollback(base, async (t, s) => {
      await t.execute(drizzleSql.raw(`UPDATE ${table} SET ${column}='BROKEN' WHERE ${table === "career_decision_action_intents" ? "career_decision_action_intent_id" : table === "human_decision_records" ? "human_decision_record_id" : table === "career_decision_context_revisions" ? "career_decision_context_revision_id" : table === "decision_authority_grant_revisions" ? "decision_authority_grant_revision_id" : "recommendation_proposal_id"}='${artifactId}'`));
      await expect(s.commitments.getCareerHumanCommitmentById(id)).rejects.toThrow("ERR_CAREER_HUMAN_COMMITMENT_PERSISTENCE_FAILED");
    });
    const subject = base.decisionRecord.decisionSubjects[0];
    for (const statement of [
      `DELETE FROM human_decision_record_subjects WHERE human_decision_record_id='${value.humanDecisionRecordId}' AND source_evolution_input_item_ordinal=${subject.sourceEvolutionInputItemOrdinal}`,
      `INSERT INTO human_decision_record_subjects(reference_id,human_decision_record_id,recommendation_proposal_id,source_evolution_input_item_ordinal) VALUES('hcom-extra-dcr-subject','${value.humanDecisionRecordId}','${value.recommendationProposalId}',99)`,
      `UPDATE human_decision_record_subjects SET source_evolution_input_item_ordinal=99 WHERE human_decision_record_id='${value.humanDecisionRecordId}' AND source_evolution_input_item_ordinal=${subject.sourceEvolutionInputItemOrdinal}`,
    ]) await rollback(base, async (t, s) => {
      await t.execute(drizzleSql.raw(statement));
      await expect(s.commitments.getCareerHumanCommitmentById(id)).rejects.toThrow("ERR_CAREER_HUMAN_COMMITMENT_PERSISTENCE_FAILED");
    });
    await expect(base.commitments.getCareerHumanCommitmentById(id)).resolves.toEqual(value);
  });

  it("preserves the temporal boundary: DAR applicability is consumed by the historical DCR, not re-evaluated at commitment time", async () => {
    const base = await ready();
    expect(base.decisionRecord.declaredAt < base.authority.effectiveUntil!).toBe(true);
    expect(base.value.commitment.committedAt > base.authority.effectiveUntil!).toBe(true);
    await expect(base.commitments.persistCareerHumanCommitment(base.value.commitment)).resolves.toEqual(base.value.commitment);
  });

  it("atomically rolls back root, subject, and evidence failures to zero durable state before clean retry", async () => {
    const base = await ready(); const tables = ["career_human_commitments", "career_human_commitment_subjects", "career_human_commitment_evidence_references"] as const;
    for (const table of tables) {
      const suffix = randomBytes(4).toString("hex"); const value = createCareerHumanCommitment(base.actionIntent, { careerDecisionActionIntentId: base.actionIntent.careerDecisionActionIntentId, committedByActorId: base.actionIntent.declaredByActorId, committedAt: base.value.commitment.committedAt, commitmentEvidenceRefs: [`evidence://atomic/${suffix}`], createdAt: base.value.commitment.createdAt });
      const fn = `fail_hcom_${suffix}`, trigger = `trigger_hcom_${suffix}`;
      await base.first.sql.unsafe(`CREATE FUNCTION ${fn}() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'injected'; END; $$`); await base.first.sql.unsafe(`CREATE TRIGGER ${trigger} BEFORE INSERT ON ${table} FOR EACH ROW EXECUTE FUNCTION ${fn}()`);
      await expect(base.commitments.persistCareerHumanCommitment(value)).rejects.toThrow("ERR_CAREER_HUMAN_COMMITMENT_PERSISTENCE_FAILED");
      for (const durable of tables) { const rows = await base.first.sql.unsafe(`SELECT count(*)::int AS count FROM ${durable} WHERE career_human_commitment_id='${value.careerHumanCommitmentId}'`); expect(Number(rows[0].count)).toBe(0); }
      await base.first.sql.unsafe(`DROP TRIGGER ${trigger} ON ${table}`); await base.first.sql.unsafe(`DROP FUNCTION ${fn}()`);
      await expect(base.commitments.persistCareerHumanCommitment(value)).resolves.toEqual(value);
    }
  });

  it("requires post-commit exact reread and exposes no mutable, legacy, execution, or regeneration surface", async () => {
    const base = await ready(); const surface = Object.getOwnPropertyNames(Object.getPrototypeOf(base.commitments));
    expect(surface).not.toEqual(expect.arrayContaining(["getCurrentCareerHumanCommitment", "getLatestCareerHumanCommitment", "updateCareerHumanCommitment", "repairCareerHumanCommitment", "replaceCareerHumanCommitment", "supersedeCareerHumanCommitment", "createExecutionAuthority", "createActionOccurrence", "regenerateCareerHumanCommitment"]));
    const suffix = randomBytes(4).toString("hex");
    const value = createCareerHumanCommitment(base.actionIntent, { careerDecisionActionIntentId: base.actionIntent.careerDecisionActionIntentId, committedByActorId: base.actionIntent.declaredByActorId, committedAt: base.value.commitment.committedAt, commitmentEvidenceRefs: [`evidence://post-commit/${suffix}`], createdAt: base.value.commitment.createdAt });
    const fn = `mutate_hcom_${suffix}`, trigger = `trigger_hcom_${suffix}`;
    await base.first.sql.unsafe(`CREATE FUNCTION ${fn}() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN UPDATE career_human_commitments SET operation_description='tampered after insert' WHERE career_human_commitment_id=NEW.career_human_commitment_id; RETURN NEW; END; $$`);
    await base.first.sql.unsafe(`CREATE TRIGGER ${trigger} AFTER INSERT ON career_human_commitments FOR EACH ROW EXECUTE FUNCTION ${fn}()`);
    await expect(base.commitments.persistCareerHumanCommitment(value)).rejects.toThrow("ERR_CAREER_HUMAN_COMMITMENT_PERSISTENCE_FAILED");
    await base.first.sql.unsafe(`DROP TRIGGER ${trigger} ON career_human_commitments`);
    await base.first.sql.unsafe(`DROP FUNCTION ${fn}()`);
    await base.first.sql.unsafe(`DELETE FROM career_human_commitment_subjects WHERE career_human_commitment_id='${value.careerHumanCommitmentId}'`);
    await base.first.sql.unsafe(`DELETE FROM career_human_commitment_evidence_references WHERE career_human_commitment_id='${value.careerHumanCommitmentId}'`);
    await base.first.sql.unsafe(`DELETE FROM career_human_commitments WHERE career_human_commitment_id='${value.careerHumanCommitmentId}'`);
  });
});
