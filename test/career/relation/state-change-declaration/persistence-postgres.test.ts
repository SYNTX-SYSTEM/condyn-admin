import { sql as drizzleSql } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/pg-core";
import { afterAll, describe, expect, it } from "vitest";
import { createCareerStateChangeDeclaration } from "../../../../lib/career/relation/state-change-declaration";
import { PostgresCareerDecisionActionIntentRepository } from "../../../../lib/career/relation-adapters/action-intent-persistence";
import { PostgresCareerExecutionAuthorityGrantRevisionRepository } from "../../../../lib/career/relation-adapters/execution-authority-grant-persistence";
import { PostgresCareerExecutionContextRevisionRepository } from "../../../../lib/career/relation-adapters/execution-context-revision-persistence";
import { PostgresCareerHumanCommitmentRepository } from "../../../../lib/career/relation-adapters/human-commitment-persistence";
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
import {
  careerHumanCommitmentEvidenceReferences,
  careerHumanCommitmentSubjects,
  careerHumanCommitments,
} from "../../../../lib/career/relation-adapters/human-commitment-persistence/postgres-schema";
import {
  careerActionOccurrenceEvidenceReferences,
  careerActionOccurrenceSubjects,
  careerActionOccurrences,
} from "../../../../lib/career/relation-adapters/action-occurrence-persistence/postgres-schema";
import {
  closeT12AHistoricalFixture,
  createT12AHistoricalClient,
  readyT12AHistoricalGraph,
  transactionScopedT12AHistoricalGraph,
} from "../action-intent/t12a-historical-fixture";
import { createT12FHistoricalFixture } from "./t12f-historical-fixture";

const loadAdapter = () =>
  import("../../../../lib/career/relation-adapters/state-change-declaration-persistence") as Promise<any>;
const loadSchema = () =>
  import("../../../../lib/career/relation-adapters/state-change-declaration-persistence/postgres-schema") as Promise<any>;
const missing = "SCD_00000000000000000000000000000000";
let unique = 0;

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
    careerActionOccurrences, careerActionOccurrenceSubjects, careerActionOccurrenceEvidenceReferences,
    schema.careerStateChangeDeclarations, schema.careerStateChangeDeclarationSubjects,
    schema.careerStateChangeDeclarationEvidenceReferences,
  ]);
  const value = createT12FHistoricalFixture();
  const intents = new PostgresCareerDecisionActionIntentRepository(base.first.db, base.records);
  await intents.persistCareerDecisionActionIntent(value.actionIntent);
  const commitments = new PostgresCareerHumanCommitmentRepository(base.first.db, intents);
  await commitments.persistCareerHumanCommitment(value.commitment);
  const grants = new PostgresCareerExecutionAuthorityGrantRevisionRepository(base.first.db, commitments);
  await grants.persistCareerExecutionAuthorityGrantRevision(value.grant);
  const contexts = new PostgresCareerExecutionContextRevisionRepository(base.first.db, grants);
  await contexts.persistCareerExecutionContextRevision(value.executionContext);
  const occurrences = new (await import("../../../../lib/career/relation-adapters/action-occurrence-persistence"))
    .PostgresCareerActionOccurrenceRepository(base.first.db, contexts, grants);
  await occurrences.persistCareerActionOccurrence(value.occurrence);
  const declarations = new adapter.PostgresCareerStateChangeDeclarationRepository(base.first.db, occurrences);
  return { ...base, value, adapter, declarations, occurrences };
}

async function scoped(database: any, base: Awaited<ReturnType<typeof ready>>) {
  const historical = transactionScopedT12AHistoricalGraph(database, base.evolution, base.implementations);
  const intents = new PostgresCareerDecisionActionIntentRepository(database, historical.records);
  const commitments = new PostgresCareerHumanCommitmentRepository(database, intents);
  const grants = new PostgresCareerExecutionAuthorityGrantRevisionRepository(database, commitments);
  const contexts = new PostgresCareerExecutionContextRevisionRepository(database, grants);
  const occurrences = new (await import("../../../../lib/career/relation-adapters/action-occurrence-persistence"))
    .PostgresCareerActionOccurrenceRepository(database, contexts, grants);
  return {
    declarations: new base.adapter.PostgresCareerStateChangeDeclarationRepository(database, occurrences),
  };
}

async function rollback(base: Awaited<ReturnType<typeof ready>>, operation: (transaction: any, graph: Awaited<ReturnType<typeof scoped>>) => Promise<void>) {
  await base.first.db.transaction(async transaction => {
    await operation(transaction, await scoped(transaction, base)); throw new Error("rollback");
  }).catch(error => { if (error.message !== "rollback") throw error; });
}

function distinct(base: Awaited<ReturnType<typeof ready>>) {
  unique += 1;
  const suffix = String(unique);
  return createCareerStateChangeDeclaration(base.value.occurrence, {
    careerActionOccurrenceId: base.value.occurrence.careerActionOccurrenceId,
    observedByActorId: "OBSERVER_T12F",
    stateSubject: { subjectKind: "EXTERNAL_RESOURCE", subjectRef: `state://atomic/${suffix}` },
    stateDimension: "application-status",
    beforeObservation: { observationState: "OBSERVED", value: "applied" },
    afterObservation: { observationState: "OBSERVED", value: `interview-invited-${suffix}` },
    observedAt: "2027-02-04T01:00:00.000Z",
    stateChangeEvidenceRefs: [`evidence://state-change/atomic/${suffix}`],
    externalStateRef: null,
    createdAt: "2027-02-04T01:00:01.000Z",
  });
}

describe("T12F PostgreSQL immutable CareerStateChangeDeclaration RED contract", () => {
  it("constructs canonical RCP -> DAR -> DCTXREV -> DCR -> DAINT -> HCOM -> EAGR -> ECTXREV -> AOC -> SCD history before the adapter boundary", () => {
    const value = createT12FHistoricalFixture();
    expect(value.stateChangeDeclaration.careerActionOccurrenceId).toBe(value.occurrence.careerActionOccurrenceId);
    expect(value.stateChangeDeclaration.observedByActorId).not.toBe(value.occurrence.performedByActorId);
    expect(value.stateChangeDeclaration.stateSubject).not.toEqual(value.occurrence.executionTarget);
    expect(value.occurrence.occurredAt < value.grant.effectiveUntil!).toBe(true);
    expect(value.stateChangeDeclaration.observedAt > value.grant.effectiveUntil!).toBe(true);
  });

  it("persists exact root, subjects, evidence, nullable and non-null external state references, detached rereads, restart history, and genuine absence", async () => {
    const base = await ready(); const value = base.value.stateChangeDeclaration;
    await expect(base.declarations.persistCareerStateChangeDeclaration(value)).resolves.toEqual(value);
    const first = await base.declarations.getCareerStateChangeDeclarationById(value.careerStateChangeDeclarationId);
    expect(first).toEqual(value); first.stateSubject.subjectRef = "local";
    await expect(base.declarations.getCareerStateChangeDeclarationById(value.careerStateChangeDeclarationId)).resolves.toEqual(value);
    const nullReference = { ...distinct(base), externalStateRef: null };
    await expect(base.declarations.persistCareerStateChangeDeclaration(nullReference)).resolves.toEqual(nullReference);
    await expect(base.declarations.getCareerStateChangeDeclarationById(missing))
      .rejects.toThrow("ERR_CAREER_STATE_CHANGE_DECLARATION_NOT_FOUND");
    await base.first.sql.end({ timeout: 5 }); const fresh = await createT12AHistoricalClient();
    const historical = transactionScopedT12AHistoricalGraph(fresh.db, base.evolution, base.implementations);
    const intents = new PostgresCareerDecisionActionIntentRepository(fresh.db, historical.records);
    const commitments = new PostgresCareerHumanCommitmentRepository(fresh.db, intents);
    const grants = new PostgresCareerExecutionAuthorityGrantRevisionRepository(fresh.db, commitments);
    const contexts = new PostgresCareerExecutionContextRevisionRepository(fresh.db, grants);
    const occurrences = new (await import("../../../../lib/career/relation-adapters/action-occurrence-persistence"))
      .PostgresCareerActionOccurrenceRepository(fresh.db, contexts, grants);
    const restarted = new base.adapter.PostgresCareerStateChangeDeclarationRepository(fresh.db, occurrences);
    await expect(restarted.getCareerStateChangeDeclarationById(value.careerStateChangeDeclarationId)).resolves.toEqual(value);
    await fresh.sql.end({ timeout: 5 });
  });

  it("is idempotent only for exact immutable durable state including audit time, child inventories, observations, and external state reference", async () => {
    const base = await ready(); const value = base.value.stateChangeDeclaration;
    await base.declarations.persistCareerStateChangeDeclaration(value);
    await expect(base.declarations.persistCareerStateChangeDeclaration(value)).resolves.toEqual(value);
    for (const changed of [
      { ...value, createdAt: "2030-01-01T00:00:00.000Z" },
      { ...value, observedByActorId: "OTHER" },
      { ...value, stateSubject: { subjectKind: "SYSTEM", subjectRef: "state://other" } },
      { ...value, stateDimension: "other" },
      { ...value, beforeObservation: { observationState: "OBSERVED", value: "other-before" } },
      { ...value, decisionSubjects: value.decisionSubjects.slice(0, 1) },
      { ...value, stateChangeEvidenceRefs: ["evidence://other"] },
      { ...value, externalStateRef: null },
    ]) await expect(base.declarations.persistCareerStateChangeDeclaration(changed))
      .rejects.toThrow("ERR_CAREER_STATE_CHANGE_DECLARATION_IMMUTABLE_CONFLICT");
  });

  it("fails closed for physical root/payload state, state subject/dimension, observation, temporal, and external-reference corruption", async () => {
    const base = await ready(); const value = base.value.stateChangeDeclaration; const id = value.careerStateChangeDeclarationId;
    await base.declarations.persistCareerStateChangeDeclaration(value);
    const invalid = async (graph: any) => expect(graph.declarations.getCareerStateChangeDeclarationById(id))
      .rejects.toThrow("ERR_CAREER_STATE_CHANGE_DECLARATION_PERSISTENCE_FAILED");
    for (const column of [
      "career_action_occurrence_id", "career_execution_context_revision_id", "career_execution_authority_grant_revision_id",
      "performed_by_actor_id", "observed_by_actor_id", "operation_description", "execution_target_ref",
      "execution_channel_ref", "action_occurred_at", "state_subject_kind", "state_subject_ref", "state_dimension",
      "before_observation_state", "before_observation_value", "after_observation_state", "after_observation_value",
      "observed_at", "external_state_producer_id", "schema_version", "created_at",
    ]) await rollback(base, async (transaction, graph) => {
      await transaction.execute(drizzleSql.raw(`UPDATE career_state_change_declarations SET ${column}='BROKEN' WHERE career_state_change_declaration_id='${id}'`));
      await invalid(graph);
    });
    for (const payload of [
      `jsonb_set(payload,'{careerStateChangeDeclarationId}','"${missing}"'::jsonb)`,
      `jsonb_set(payload,'{observedByActorId}','"PAYLOAD_OTHER"'::jsonb)`,
      `jsonb_set(payload,'{observedAt}','"2027-02-03T00:00:00.000Z"'::jsonb)`,
    ]) await rollback(base, async (transaction, graph) => {
      await transaction.execute(drizzleSql.raw(`UPDATE career_state_change_declarations SET payload=${payload} WHERE career_state_change_declaration_id='${id}'`));
      await invalid(graph);
    });
  });

  it("fails closed for missing, extra, duplicate, foreign, or changed normalized subject/evidence rows", async () => {
    const base = await ready(); const value = base.value.stateChangeDeclaration; const id = value.careerStateChangeDeclarationId;
    await base.declarations.persistCareerStateChangeDeclaration(value);
    const invalid = async (graph: any) => expect(graph.declarations.getCareerStateChangeDeclarationById(id))
      .rejects.toThrow("ERR_CAREER_STATE_CHANGE_DECLARATION_PERSISTENCE_FAILED");
    const subject = value.decisionSubjects[0];
    for (const statement of [
      `DELETE FROM career_state_change_declaration_subjects WHERE career_state_change_declaration_id='${id}' AND source_evolution_input_item_ordinal=${subject.sourceEvolutionInputItemOrdinal}`,
      `INSERT INTO career_state_change_declaration_subjects(reference_id,career_state_change_declaration_id,recommendation_proposal_id,source_evolution_input_item_ordinal) VALUES('extra','${id}','${value.recommendationProposalId}',99)`,
      `INSERT INTO career_state_change_declaration_subjects(reference_id,career_state_change_declaration_id,recommendation_proposal_id,source_evolution_input_item_ordinal) VALUES('duplicate','${id}','${value.recommendationProposalId}',${subject.sourceEvolutionInputItemOrdinal})`,
      `UPDATE career_state_change_declaration_subjects SET recommendation_proposal_id='RCP_00000000000000000000000000000000' WHERE career_state_change_declaration_id='${id}' AND source_evolution_input_item_ordinal=${subject.sourceEvolutionInputItemOrdinal}`,
    ]) await rollback(base, async (transaction, graph) => { await transaction.execute(drizzleSql.raw(statement)); await invalid(graph); });
    for (const statement of [
      `DELETE FROM career_state_change_declaration_evidence_references WHERE career_state_change_declaration_id='${id}'`,
      `INSERT INTO career_state_change_declaration_evidence_references(reference_id,career_state_change_declaration_id,evidence_ref) VALUES('extra-evidence','${id}','evidence://extra')`,
      `INSERT INTO career_state_change_declaration_evidence_references(reference_id,career_state_change_declaration_id,evidence_ref) VALUES('duplicate-evidence','${id}','${value.stateChangeEvidenceRefs[0]}')`,
      `UPDATE career_state_change_declaration_evidence_references SET evidence_ref='evidence://changed' WHERE career_state_change_declaration_id='${id}'`,
    ]) await rollback(base, async (transaction, graph) => { await transaction.execute(drizzleSql.raw(statement)); await invalid(graph); });
  });

  it("requires the exact AOC witnesses and observation ordering, but never treats EAGR expiry at observedAt as an authorization failure", async () => {
    const base = await ready(); const value = base.value.stateChangeDeclaration;
    expect(value.actionOccurredAt).toBe(base.value.occurrence.occurredAt);
    expect(value.observedAt >= base.value.occurrence.occurredAt).toBe(true);
    expect(value.observedAt > base.value.grant.effectiveUntil!).toBe(true);
    await expect(base.declarations.persistCareerStateChangeDeclaration(value)).resolves.toEqual(value);
    for (const changed of [
      { ...value, careerActionOccurrenceId: "AOC_00000000000000000000000000000000" },
      { ...value, performedByActorId: "OTHER" },
      { ...value, actionOccurredAt: "2027-02-03T01:00:01.000Z" },
      { ...value, observedAt: "2027-02-03T00:59:59.999Z" },
      { ...value, executionTarget: { targetKind: "SYSTEM", targetRef: "target://other" } },
    ]) await expect(base.declarations.persistCareerStateChangeDeclaration(changed)).rejects.toThrow();
  });

  it("atomically rolls back root, subject, and evidence failures before exact retry", async () => {
    const base = await ready(); const tables = [
      "career_state_change_declarations", "career_state_change_declaration_subjects",
      "career_state_change_declaration_evidence_references",
    ] as const;
    for (const table of tables) {
      const suffix = String(++unique); const value = distinct(base);
      const fn = `fail_scd_${suffix}`, trigger = `trigger_scd_${suffix}`;
      await base.first.sql.unsafe(`CREATE FUNCTION ${fn}() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'injected'; END; $$`);
      await base.first.sql.unsafe(`CREATE TRIGGER ${trigger} BEFORE INSERT ON ${table} FOR EACH ROW EXECUTE FUNCTION ${fn}()`);
      await expect(base.declarations.persistCareerStateChangeDeclaration(value))
        .rejects.toThrow("ERR_CAREER_STATE_CHANGE_DECLARATION_PERSISTENCE_FAILED");
      for (const durable of tables) {
        const rows = await base.first.sql.unsafe(`SELECT count(*)::int AS count FROM ${durable} WHERE career_state_change_declaration_id='${value.careerStateChangeDeclarationId}'`);
        expect(Number(rows[0].count)).toBe(0);
      }
      await base.first.sql.unsafe(`DROP TRIGGER ${trigger} ON ${table}`); await base.first.sql.unsafe(`DROP FUNCTION ${fn}()`);
      await expect(base.declarations.persistCareerStateChangeDeclaration(value)).resolves.toEqual(value);
    }
  });

  it("requires mandatory post-commit reread and exposes no mutable, current, verification, result, outcome, or causal surface", async () => {
    const base = await ready(); const surface = Object.getOwnPropertyNames(Object.getPrototypeOf(base.declarations));
    expect(surface).not.toEqual(expect.arrayContaining([
      "getCurrentCareerStateChangeDeclaration", "getLatestCareerStateChangeDeclaration", "getHeadCareerStateChangeDeclaration",
      "updateCareerStateChangeDeclaration", "repairCareerStateChangeDeclaration", "replaceCareerStateChangeDeclaration",
      "supersedeCareerStateChangeDeclaration", "verifyCareerStateChange", "createCareerOutcome",
      "createActionStateChangeAssociationProposal", "createOutcomeAttributionProposal",
    ]));
    const value = distinct(base); const suffix = String(++unique);
    const fn = `mutate_scd_${suffix}`, trigger = `trigger_scd_${suffix}`;
    await base.first.sql.unsafe(`CREATE FUNCTION ${fn}() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN UPDATE career_state_change_declarations SET state_dimension='tampered after insert' WHERE career_state_change_declaration_id=NEW.career_state_change_declaration_id; RETURN NEW; END; $$`);
    await base.first.sql.unsafe(`CREATE TRIGGER ${trigger} AFTER INSERT ON career_state_change_declarations FOR EACH ROW EXECUTE FUNCTION ${fn}()`);
    await expect(base.declarations.persistCareerStateChangeDeclaration(value))
      .rejects.toThrow("ERR_CAREER_STATE_CHANGE_DECLARATION_PERSISTENCE_FAILED");
    await base.first.sql.unsafe(`DROP TRIGGER ${trigger} ON career_state_change_declarations`); await base.first.sql.unsafe(`DROP FUNCTION ${fn}()`);
  });
});
