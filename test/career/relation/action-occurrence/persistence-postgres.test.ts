import { randomBytes } from "node:crypto";
import { sql as drizzleSql } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/pg-core";
import { afterAll, describe, expect, it } from "vitest";
import { createCareerActionOccurrence } from "../../../../lib/career/relation/action-occurrence";
import { PostgresCareerDecisionActionIntentRepository } from "../../../../lib/career/relation-adapters/action-intent-persistence";
import { PostgresCareerExecutionAuthorityGrantRevisionRepository } from "../../../../lib/career/relation-adapters/execution-authority-grant-persistence";
import { PostgresCareerExecutionContextRevisionRepository } from "../../../../lib/career/relation-adapters/execution-context-revision-persistence";
import {
  careerExecutionAuthorityGrantChannelKinds,
  careerExecutionAuthorityGrantEvidenceReferences,
  careerExecutionAuthorityGrantRevisions,
  careerExecutionAuthorityGrantSubjects,
  careerExecutionAuthorityGrantTargetKinds,
} from "../../../../lib/career/relation-adapters/execution-authority-grant-persistence/postgres-schema";
import {
  careerExecutionContextEvidenceReferences,
  careerExecutionContextRevisions,
  careerExecutionContextSubjects,
} from "../../../../lib/career/relation-adapters/execution-context-revision-persistence/postgres-schema";
import { PostgresCareerHumanCommitmentRepository } from "../../../../lib/career/relation-adapters/human-commitment-persistence";
import {
  careerHumanCommitmentEvidenceReferences,
  careerHumanCommitmentSubjects,
  careerHumanCommitments,
} from "../../../../lib/career/relation-adapters/human-commitment-persistence/postgres-schema";
import {
  closeT12AHistoricalFixture,
  createT12AHistoricalClient,
  readyT12AHistoricalGraph,
  transactionScopedT12AHistoricalGraph,
} from "../action-intent/t12a-historical-fixture";
import { createT12EHistoricalFixture } from "./t12e-historical-fixture";

const loadAdapter = () =>
  import("../../../../lib/career/relation-adapters/action-occurrence-persistence") as Promise<any>;
const loadSchema = () =>
  import("../../../../lib/career/relation-adapters/action-occurrence-persistence/postgres-schema") as Promise<any>;
const missing = "AOC_00000000000000000000000000000000";

afterAll(closeT12AHistoricalFixture);

async function createTables(database: any, tables: readonly any[]) {
  for (const table of tables) {
    const config = getTableConfig(table);
    const columns = config.columns.map(column =>
      `"${column.name}" ${column.getSQLType()}${column.notNull ? " NOT NULL" : ""}${column.primary ? " PRIMARY KEY" : ""}`,
    );
    await database.execute(drizzleSql.raw(`CREATE TABLE IF NOT EXISTS "${config.name}" (${columns.join(",")})`));
  }
}

async function ready() {
  const adapter = await loadAdapter(); const schema = await loadSchema();
  const base = await readyT12AHistoricalGraph();
  await createTables(base.first.db, [
    careerHumanCommitments, careerHumanCommitmentSubjects, careerHumanCommitmentEvidenceReferences,
    careerExecutionAuthorityGrantRevisions, careerExecutionAuthorityGrantSubjects,
    careerExecutionAuthorityGrantTargetKinds, careerExecutionAuthorityGrantChannelKinds,
    careerExecutionAuthorityGrantEvidenceReferences,
    careerExecutionContextRevisions, careerExecutionContextSubjects, careerExecutionContextEvidenceReferences,
    schema.careerActionOccurrences, schema.careerActionOccurrenceSubjects,
    schema.careerActionOccurrenceEvidenceReferences,
  ]);
  const value = createT12EHistoricalFixture();
  const intents = new PostgresCareerDecisionActionIntentRepository(base.first.db, base.records);
  await intents.persistCareerDecisionActionIntent(value.actionIntent);
  const commitments = new PostgresCareerHumanCommitmentRepository(base.first.db, intents);
  await commitments.persistCareerHumanCommitment(value.commitment);
  const grants = new PostgresCareerExecutionAuthorityGrantRevisionRepository(base.first.db, commitments);
  await grants.persistCareerExecutionAuthorityGrantRevision(value.grant);
  const contexts = new PostgresCareerExecutionContextRevisionRepository(base.first.db, grants);
  await contexts.persistCareerExecutionContextRevision(value.executionContext);
  const occurrences = new adapter.PostgresCareerActionOccurrenceRepository(base.first.db, contexts, grants);
  return { ...base, value, intents, commitments, grants, contexts, occurrences, adapter };
}

async function scoped(database: any, base: Awaited<ReturnType<typeof ready>>) {
  const historical = transactionScopedT12AHistoricalGraph(database, base.evolution, base.implementations);
  const intents = new PostgresCareerDecisionActionIntentRepository(database, historical.records);
  const commitments = new PostgresCareerHumanCommitmentRepository(database, intents);
  const grants = new PostgresCareerExecutionAuthorityGrantRevisionRepository(database, commitments);
  const contexts = new PostgresCareerExecutionContextRevisionRepository(database, grants);
  return { historical, intents, commitments, grants, contexts,
    occurrences: new base.adapter.PostgresCareerActionOccurrenceRepository(database, contexts, grants) };
}

async function rollback(base: Awaited<ReturnType<typeof ready>>, operation: (transaction: any, graph: Awaited<ReturnType<typeof scoped>>) => Promise<void>) {
  await base.first.db.transaction(async transaction => {
    await operation(transaction, await scoped(transaction, base)); throw new Error("rollback");
  }).catch(error => { if (error.message !== "rollback") throw error; });
}

describe("T12E PostgreSQL immutable CareerActionOccurrence RED contract", () => {
  it("constructs canonical T12E history before the missing adapter boundary", () => {
    const value = createT12EHistoricalFixture();
    expect(value.occurrence.careerExecutionContextRevisionId).toBe(value.executionContext.careerExecutionContextRevisionId);
    expect(value.occurrence.performedByActorId).toBe(value.grant.authorizedExecutionActorId);
    expect(value.occurrence.occurredAt < value.grant.effectiveUntil!).toBe(true);
  });

  it("persists exact root, subjects, evidence, and external ref; returns detached rereads; survives restart; and distinguishes NOT_FOUND", async () => {
    const base = await ready(); const value = base.value.occurrence;
    await expect(base.occurrences.persistCareerActionOccurrence(value)).resolves.toEqual(value);
    const first = await base.occurrences.getCareerActionOccurrenceById(value.careerActionOccurrenceId);
    expect(first).toEqual(value); first.executionTarget.targetRef = "local";
    await expect(base.occurrences.getCareerActionOccurrenceById(value.careerActionOccurrenceId)).resolves.toEqual(value);
    expect(first.externalOccurrenceRef).toBe(value.externalOccurrenceRef);
    await base.first.sql.end({ timeout: 5 }); const fresh = await createT12AHistoricalClient();
    const historical = transactionScopedT12AHistoricalGraph(fresh.db, base.evolution, base.implementations);
    const intents = new PostgresCareerDecisionActionIntentRepository(fresh.db, historical.records);
    const commitments = new PostgresCareerHumanCommitmentRepository(fresh.db, intents);
    const grants = new PostgresCareerExecutionAuthorityGrantRevisionRepository(fresh.db, commitments);
    const contexts = new PostgresCareerExecutionContextRevisionRepository(fresh.db, grants);
    const restarted = new base.adapter.PostgresCareerActionOccurrenceRepository(fresh.db, contexts, grants);
    await expect(restarted.getCareerActionOccurrenceById(value.careerActionOccurrenceId)).resolves.toEqual(value);
    await expect(restarted.getCareerActionOccurrenceById(missing)).rejects.toThrow("ERR_CAREER_ACTION_OCCURRENCE_NOT_FOUND");
    await fresh.sql.end({ timeout: 5 });
  });

  it("is idempotent only for exact immutable state, including createdAt and complete durable children", async () => {
    const base = await ready(); const value = base.value.occurrence;
    await base.occurrences.persistCareerActionOccurrence(value);
    await expect(base.occurrences.persistCareerActionOccurrence(value)).resolves.toEqual(value);
    for (const changed of [
      { ...value, createdAt: "2027-02-05T00:00:00.000Z" },
      { ...value, operationDescription: "other" },
      { ...value, decisionSubjects: value.decisionSubjects.slice(0, 1) },
      { ...value, occurrenceEvidenceRefs: ["evidence://other"] },
      { ...value, externalOccurrenceRef: null },
    ]) await expect(base.occurrences.persistCareerActionOccurrence(changed))
      .rejects.toThrow("ERR_CAREER_ACTION_OCCURRENCE_IMMUTABLE_CONFLICT");
  });

  it("fails closed for every physical root witness and payload corruption", async () => {
    const base = await ready(); const value = base.value.occurrence; const id = value.careerActionOccurrenceId;
    await base.occurrences.persistCareerActionOccurrence(value);
    const invalid = async (graph: any) => expect(graph.occurrences.getCareerActionOccurrenceById(id))
      .rejects.toThrow("ERR_CAREER_ACTION_OCCURRENCE_PERSISTENCE_FAILED");
    for (const column of [
      "career_execution_context_revision_id", "career_execution_authority_grant_revision_id", "career_human_commitment_id",
      "career_decision_action_intent_id", "human_decision_record_id", "career_decision_context_revision_id",
      "decision_authority_grant_revision_id", "recommendation_proposal_id", "performed_by_actor_id",
      "source_declaration_class", "source_action_intent_class", "operation_description", "execution_authority_scope",
      "execution_target_kind", "execution_target_ref", "execution_channel_kind", "execution_channel_ref",
      "occurred_at", "external_occurrence_ref", "schema_version", "created_at",
    ]) await rollback(base, async (transaction, graph) => {
      await transaction.execute(drizzleSql.raw(`UPDATE career_action_occurrences SET ${column}='BROKEN' WHERE career_action_occurrence_id='${id}'`));
      await invalid(graph);
    });
    for (const payload of [
      `jsonb_set(payload,'{careerActionOccurrenceId}','"${missing}"'::jsonb)`,
      `jsonb_set(payload,'{performedByActorId}','"PAYLOAD_OTHER"'::jsonb)`,
      `jsonb_set(payload,'{occurredAt}','"2027-02-05T00:00:00.000Z"'::jsonb)`,
    ]) await rollback(base, async (transaction, graph) => {
      await transaction.execute(drizzleSql.raw(`UPDATE career_action_occurrences SET payload=${payload} WHERE career_action_occurrence_id='${id}'`));
      await invalid(graph);
    });
  });

  it("fails closed for missing, extra, duplicate, foreign, and changed normalized subject/evidence rows", async () => {
    const base = await ready(); const value = base.value.occurrence; const id = value.careerActionOccurrenceId;
    await base.occurrences.persistCareerActionOccurrence(value);
    const invalid = async (graph: any) => expect(graph.occurrences.getCareerActionOccurrenceById(id))
      .rejects.toThrow("ERR_CAREER_ACTION_OCCURRENCE_PERSISTENCE_FAILED");
    const subject = value.decisionSubjects[0];
    for (const statement of [
      `DELETE FROM career_action_occurrence_subjects WHERE career_action_occurrence_id='${id}' AND source_evolution_input_item_ordinal=${subject.sourceEvolutionInputItemOrdinal}`,
      `INSERT INTO career_action_occurrence_subjects(reference_id,career_action_occurrence_id,recommendation_proposal_id,source_evolution_input_item_ordinal) VALUES('extra','${id}','${value.recommendationProposalId}',99)`,
      `INSERT INTO career_action_occurrence_subjects(reference_id,career_action_occurrence_id,recommendation_proposal_id,source_evolution_input_item_ordinal) VALUES('duplicate','${id}','${value.recommendationProposalId}',${subject.sourceEvolutionInputItemOrdinal})`,
      `UPDATE career_action_occurrence_subjects SET recommendation_proposal_id='RCP_00000000000000000000000000000000' WHERE career_action_occurrence_id='${id}' AND source_evolution_input_item_ordinal=${subject.sourceEvolutionInputItemOrdinal}`,
      `UPDATE career_action_occurrence_subjects SET source_evolution_input_item_ordinal=99 WHERE career_action_occurrence_id='${id}' AND source_evolution_input_item_ordinal=${subject.sourceEvolutionInputItemOrdinal}`,
    ]) await rollback(base, async (transaction, graph) => { await transaction.execute(drizzleSql.raw(statement)); await invalid(graph); });
    for (const statement of [
      `DELETE FROM career_action_occurrence_evidence_references WHERE career_action_occurrence_id='${id}'`,
      `INSERT INTO career_action_occurrence_evidence_references(reference_id,career_action_occurrence_id,occurrence_evidence_ref) VALUES('extra-evidence','${id}','evidence://extra')`,
      `INSERT INTO career_action_occurrence_evidence_references(reference_id,career_action_occurrence_id,occurrence_evidence_ref) VALUES('duplicate-evidence','${id}','${value.occurrenceEvidenceRefs[0]}')`,
      `UPDATE career_action_occurrence_evidence_references SET occurrence_evidence_ref='evidence://changed' WHERE career_action_occurrence_id='${id}'`,
    ]) await rollback(base, async (transaction, graph) => { await transaction.execute(drizzleSql.raw(statement)); await invalid(graph); });
  });

  it("requires exact ECTXREV/EAGR authority relations, target/channel permission, and the historical half-open interval", async () => {
    const base = await ready(); const value = base.value.occurrence;
    expect(value.occurredAt >= base.value.executionContext.declaredAt).toBe(true);
    expect(value.occurredAt >= base.value.grant.effectiveFrom).toBe(true);
    expect(value.occurredAt < base.value.grant.effectiveUntil!).toBe(true);
    expect(base.value.grant.declaredAt > base.authority.effectiveUntil!).toBe(true);
    await expect(base.occurrences.persistCareerActionOccurrence(value)).resolves.toEqual(value);
    for (const changed of [
      { ...value, occurredAt: base.value.grant.effectiveUntil },
      { ...value, occurredAt: "2027-02-04T00:00:00.001Z" },
      { ...value, performedByActorId: "OTHER" },
      { ...value, executionTarget: { targetKind: "ORGANIZATION", targetRef: "target://other" } },
      { ...value, executionChannel: { channelKind: "API", channelRef: "channel://other" } },
    ]) await expect(base.occurrences.persistCareerActionOccurrence(changed))
      .rejects.toThrow();
  });

  it("atomically rolls back root, subject, and evidence failures before exact retry", async () => {
    const base = await ready(); const tables = [
      "career_action_occurrences", "career_action_occurrence_subjects", "career_action_occurrence_evidence_references",
    ] as const;
    for (const table of tables) {
      const suffix = randomBytes(4).toString("hex");
      const value = createCareerActionOccurrence(base.value.executionContext, {
        careerExecutionContextRevisionId: base.value.executionContext.careerExecutionContextRevisionId,
        performedByActorId: base.value.executionContext.declaredByActorId,
        occurredAt: "2027-02-03T01:00:00.000Z", occurrenceEvidenceRefs: [`evidence://atomic/${suffix}`],
        externalOccurrenceRef: null, createdAt: base.value.occurrence.createdAt,
      });
      const fn = `fail_aoc_${suffix}`, trigger = `trigger_aoc_${suffix}`;
      await base.first.sql.unsafe(`CREATE FUNCTION ${fn}() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'injected'; END; $$`);
      await base.first.sql.unsafe(`CREATE TRIGGER ${trigger} BEFORE INSERT ON ${table} FOR EACH ROW EXECUTE FUNCTION ${fn}()`);
      await expect(base.occurrences.persistCareerActionOccurrence(value))
        .rejects.toThrow("ERR_CAREER_ACTION_OCCURRENCE_PERSISTENCE_FAILED");
      for (const durable of tables) {
        const rows = await base.first.sql.unsafe(`SELECT count(*)::int AS count FROM ${durable} WHERE career_action_occurrence_id='${value.careerActionOccurrenceId}'`);
        expect(Number(rows[0].count)).toBe(0);
      }
      await base.first.sql.unsafe(`DROP TRIGGER ${trigger} ON ${table}`); await base.first.sql.unsafe(`DROP FUNCTION ${fn}()`);
      await expect(base.occurrences.persistCareerActionOccurrence(value)).resolves.toEqual(value);
    }
  });

  it("requires post-commit reread and exposes no mutable, current, result, or downstream authority surface", async () => {
    const base = await ready(); const surface = Object.getOwnPropertyNames(Object.getPrototypeOf(base.occurrences));
    expect(surface).not.toEqual(expect.arrayContaining([
      "getCurrentCareerActionOccurrence", "getLatestCareerActionOccurrence", "updateCareerActionOccurrence",
      "repairCareerActionOccurrence", "replaceCareerActionOccurrence", "supersedeCareerActionOccurrence",
      "createCareerStateChange", "createCareerOutcome",
    ]));
    const suffix = randomBytes(4).toString("hex");
    const value = createCareerActionOccurrence(base.value.executionContext, {
      careerExecutionContextRevisionId: base.value.executionContext.careerExecutionContextRevisionId,
      performedByActorId: base.value.executionContext.declaredByActorId,
      occurredAt: "2027-02-03T01:00:00.000Z", occurrenceEvidenceRefs: [`evidence://reread/${suffix}`],
      externalOccurrenceRef: null, createdAt: base.value.occurrence.createdAt,
    });
    const fn = `mutate_aoc_${suffix}`, trigger = `trigger_aoc_${suffix}`;
    await base.first.sql.unsafe(`CREATE FUNCTION ${fn}() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN UPDATE career_action_occurrences SET operation_description='tampered after insert' WHERE career_action_occurrence_id=NEW.career_action_occurrence_id; RETURN NEW; END; $$`);
    await base.first.sql.unsafe(`CREATE TRIGGER ${trigger} AFTER INSERT ON career_action_occurrences FOR EACH ROW EXECUTE FUNCTION ${fn}()`);
    await expect(base.occurrences.persistCareerActionOccurrence(value))
      .rejects.toThrow("ERR_CAREER_ACTION_OCCURRENCE_PERSISTENCE_FAILED");
    await base.first.sql.unsafe(`DROP TRIGGER ${trigger} ON career_action_occurrences`); await base.first.sql.unsafe(`DROP FUNCTION ${fn}()`);
  });
});
