import { randomBytes } from "node:crypto";
import { sql as drizzleSql } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/pg-core";
import { afterAll, describe, expect, it } from "vitest";
import { createCareerExecutionContextRevision } from "../../../../lib/career/relation/execution-context-revision";
import { PostgresCareerDecisionActionIntentRepository } from "../../../../lib/career/relation-adapters/action-intent-persistence";
import { PostgresCareerExecutionAuthorityGrantRevisionRepository } from "../../../../lib/career/relation-adapters/execution-authority-grant-persistence";
import {
  careerExecutionAuthorityGrantChannelKinds,
  careerExecutionAuthorityGrantEvidenceReferences,
  careerExecutionAuthorityGrantRevisions,
  careerExecutionAuthorityGrantSubjects,
  careerExecutionAuthorityGrantTargetKinds,
} from "../../../../lib/career/relation-adapters/execution-authority-grant-persistence/postgres-schema";
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
import { createT12DHistoricalFixture } from "./t12d-historical-fixture";

const loadAdapter = () =>
  import("../../../../lib/career/relation-adapters/execution-context-revision-persistence") as Promise<any>;
const loadSchema = () =>
  import("../../../../lib/career/relation-adapters/execution-context-revision-persistence/postgres-schema") as Promise<any>;
const missing = "ECTXREV_00000000000000000000000000000000";

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
  const adapter = await loadAdapter();
  const schema = await loadSchema();
  const base = await readyT12AHistoricalGraph();
  await createTables(base.first.db, [
    careerHumanCommitments, careerHumanCommitmentSubjects, careerHumanCommitmentEvidenceReferences,
    careerExecutionAuthorityGrantRevisions, careerExecutionAuthorityGrantSubjects,
    careerExecutionAuthorityGrantTargetKinds, careerExecutionAuthorityGrantChannelKinds,
    careerExecutionAuthorityGrantEvidenceReferences,
    schema.careerExecutionContextRevisions, schema.careerExecutionContextSubjects,
    schema.careerExecutionContextEvidenceReferences,
  ]);
  const value = createT12DHistoricalFixture();
  const intents = new PostgresCareerDecisionActionIntentRepository(base.first.db, base.records);
  await intents.persistCareerDecisionActionIntent(base.actionIntent);
  const commitments = new PostgresCareerHumanCommitmentRepository(base.first.db, intents);
  await commitments.persistCareerHumanCommitment(value.commitment);
  const grants = new PostgresCareerExecutionAuthorityGrantRevisionRepository(base.first.db, commitments);
  await grants.persistCareerExecutionAuthorityGrantRevision(value.grant);
  const contexts = new adapter.PostgresCareerExecutionContextRevisionRepository(base.first.db, grants);
  return { ...base, value, intents, commitments, grants, contexts, adapter };
}

async function scoped(database: any, base: Awaited<ReturnType<typeof ready>>) {
  const historical = transactionScopedT12AHistoricalGraph(database, base.evolution, base.implementations);
  const intents = new PostgresCareerDecisionActionIntentRepository(database, historical.records);
  const commitments = new PostgresCareerHumanCommitmentRepository(database, intents);
  const grants = new PostgresCareerExecutionAuthorityGrantRevisionRepository(database, commitments);
  return {
    historical, intents, commitments, grants,
    contexts: new base.adapter.PostgresCareerExecutionContextRevisionRepository(database, grants),
  };
}

async function rollback(
  base: Awaited<ReturnType<typeof ready>>,
  operation: (transaction: any, graph: Awaited<ReturnType<typeof scoped>>) => Promise<void>,
) {
  await base.first.db.transaction(async transaction => {
    await operation(transaction, await scoped(transaction, base));
    throw new Error("rollback");
  }).catch(error => { if (error.message !== "rollback") throw error; });
}

describe("T12D PostgreSQL immutable CareerExecutionContextRevision RED contract", () => {
  it("constructs one exact canonical ECTXREV fixture before the missing adapter boundary", () => {
    const value = createT12DHistoricalFixture();
    expect(value.executionContext.careerExecutionAuthorityGrantRevisionId)
      .toBe(value.grant.careerExecutionAuthorityGrantRevisionId);
    expect(value.executionContext.decisionSubjects).toEqual(value.grant.decisionSubjects);
    expect(value.executionContext.declaredAt).toBe(value.grant.effectiveFrom);
  });

  it("persists exact ECTXREV, returns detached rereads, survives restart, and distinguishes NOT_FOUND", async () => {
    const base = await ready(); const value = base.value.executionContext;
    await expect(base.contexts.persistCareerExecutionContextRevision(value)).resolves.toEqual(value);
    const first = await base.contexts.getCareerExecutionContextRevisionById(value.careerExecutionContextRevisionId);
    expect(first).toEqual(value); first.executionTarget.targetRef = "local";
    await expect(base.contexts.getCareerExecutionContextRevisionById(value.careerExecutionContextRevisionId)).resolves.toEqual(value);
    await base.first.sql.end({ timeout: 5 });
    const fresh = await createT12AHistoricalClient();
    const historical = transactionScopedT12AHistoricalGraph(fresh.db, base.evolution, base.implementations);
    const intents = new PostgresCareerDecisionActionIntentRepository(fresh.db, historical.records);
    const commitments = new PostgresCareerHumanCommitmentRepository(fresh.db, intents);
    const grants = new PostgresCareerExecutionAuthorityGrantRevisionRepository(fresh.db, commitments);
    const restarted = new base.adapter.PostgresCareerExecutionContextRevisionRepository(fresh.db, grants);
    await expect(restarted.getCareerExecutionContextRevisionById(value.careerExecutionContextRevisionId)).resolves.toEqual(value);
    await expect(restarted.getCareerExecutionContextRevisionById(missing)).rejects.toThrow("ERR_CAREER_EXECUTION_CONTEXT_REVISION_NOT_FOUND");
    await fresh.sql.end({ timeout: 5 });
  });

  it("is idempotent only for exact immutable state including createdAt", async () => {
    const base = await ready(); const value = base.value.executionContext;
    await base.contexts.persistCareerExecutionContextRevision(value);
    await expect(base.contexts.persistCareerExecutionContextRevision(value)).resolves.toEqual(value);
    for (const changed of [
      { ...value, createdAt: "2027-02-05T00:00:00.000Z" },
      { ...value, operationDescription: "other" },
    ]) await expect(base.contexts.persistCareerExecutionContextRevision(changed))
      .rejects.toThrow("ERR_CAREER_EXECUTION_CONTEXT_REVISION_IMMUTABLE_CONFLICT");
    await expect(base.contexts.getCareerExecutionContextRevisionById(value.careerExecutionContextRevisionId)).resolves.toEqual(value);
  });

  it("fails closed for physical root and payload corruption without trusting either representation", async () => {
    const base = await ready(); const value = base.value.executionContext; const id = value.careerExecutionContextRevisionId;
    await base.contexts.persistCareerExecutionContextRevision(value);
    const invalid = async (graph: any) => expect(graph.contexts.getCareerExecutionContextRevisionById(id))
      .rejects.toThrow("ERR_CAREER_EXECUTION_CONTEXT_REVISION_PERSISTENCE_FAILED");
    for (const column of [
      "career_execution_authority_grant_revision_id", "career_human_commitment_id",
      "career_decision_action_intent_id", "human_decision_record_id", "career_decision_context_revision_id",
      "decision_authority_grant_revision_id", "recommendation_proposal_id", "declared_by_actor_id",
      "source_declaration_class", "source_action_intent_class", "operation_description",
      "execution_authority_scope", "execution_target_kind", "execution_target_ref",
      "execution_channel_kind", "execution_channel_ref", "declared_at", "schema_version", "created_at",
    ]) await rollback(base, async (transaction, graph) => {
      await transaction.execute(drizzleSql.raw(`UPDATE career_execution_context_revisions SET ${column}='BROKEN' WHERE career_execution_context_revision_id='${id}'`));
      await invalid(graph);
    });
    for (const payload of [
      `jsonb_set(payload,'{careerExecutionContextRevisionId}','"${missing}"'::jsonb)`,
      `jsonb_set(payload,'{declaredByActorId}','"PAYLOAD_OTHER"'::jsonb)`,
      `jsonb_set(payload,'{operationDescription}','"PAYLOAD_OTHER"'::jsonb)`,
    ]) await rollback(base, async (transaction, graph) => {
      await transaction.execute(drizzleSql.raw(`UPDATE career_execution_context_revisions SET payload=${payload} WHERE career_execution_context_revision_id='${id}'`));
      await invalid(graph);
    });
  });

  it("fails closed for missing, extra, duplicate, foreign, and changed normalized subject/evidence rows", async () => {
    const base = await ready(); const value = base.value.executionContext; const id = value.careerExecutionContextRevisionId;
    await base.contexts.persistCareerExecutionContextRevision(value);
    const invalid = async (graph: any) => expect(graph.contexts.getCareerExecutionContextRevisionById(id))
      .rejects.toThrow("ERR_CAREER_EXECUTION_CONTEXT_REVISION_PERSISTENCE_FAILED");
    const subject = value.decisionSubjects[0];
    for (const statement of [
      `DELETE FROM career_execution_context_subjects WHERE career_execution_context_revision_id='${id}' AND source_evolution_input_item_ordinal=${subject.sourceEvolutionInputItemOrdinal}`,
      `INSERT INTO career_execution_context_subjects(reference_id,career_execution_context_revision_id,recommendation_proposal_id,source_evolution_input_item_ordinal) VALUES('extra','${id}','${value.recommendationProposalId}',99)`,
      `INSERT INTO career_execution_context_subjects(reference_id,career_execution_context_revision_id,recommendation_proposal_id,source_evolution_input_item_ordinal) VALUES('duplicate','${id}','${value.recommendationProposalId}',${subject.sourceEvolutionInputItemOrdinal})`,
      `UPDATE career_execution_context_subjects SET recommendation_proposal_id='RCP_00000000000000000000000000000000' WHERE career_execution_context_revision_id='${id}' AND source_evolution_input_item_ordinal=${subject.sourceEvolutionInputItemOrdinal}`,
      `UPDATE career_execution_context_subjects SET source_evolution_input_item_ordinal=99 WHERE career_execution_context_revision_id='${id}' AND source_evolution_input_item_ordinal=${subject.sourceEvolutionInputItemOrdinal}`,
    ]) await rollback(base, async (transaction, graph) => { await transaction.execute(drizzleSql.raw(statement)); await invalid(graph); });
    for (const statement of [
      `DELETE FROM career_execution_context_evidence_references WHERE career_execution_context_revision_id='${id}'`,
      `INSERT INTO career_execution_context_evidence_references(reference_id,career_execution_context_revision_id,context_evidence_ref) VALUES('extra-evidence','${id}','evidence://extra')`,
      `INSERT INTO career_execution_context_evidence_references(reference_id,career_execution_context_revision_id,context_evidence_ref) VALUES('duplicate-evidence','${id}','${value.contextEvidenceRefs[0]}')`,
      `UPDATE career_execution_context_evidence_references SET context_evidence_ref='evidence://changed' WHERE career_execution_context_revision_id='${id}'`,
    ]) await rollback(base, async (transaction, graph) => { await transaction.execute(drizzleSql.raw(statement)); await invalid(graph); });
  });

  it("propagates direct EAGR and complete historical-chain corruption through the scoped graph", async () => {
    const base = await ready(); const value = base.value.executionContext; const id = value.careerExecutionContextRevisionId;
    await base.contexts.persistCareerExecutionContextRevision(value);
    for (const [table, column, key, artifactId] of [
      ["career_execution_authority_grant_revisions", "authorized_execution_actor_id", "career_execution_authority_grant_revision_id", value.careerExecutionAuthorityGrantRevisionId],
      ["career_human_commitments", "committed_by_actor_id", "career_human_commitment_id", value.careerHumanCommitmentId],
      ["career_decision_action_intents", "declared_by_actor_id", "career_decision_action_intent_id", value.careerDecisionActionIntentId],
      ["human_decision_records", "declarant_actor_id", "human_decision_record_id", value.humanDecisionRecordId],
      ["career_decision_context_revisions", "authority_scope", "career_decision_context_revision_id", value.careerDecisionContextRevisionId],
      ["decision_authority_grant_revisions", "authority_scope", "decision_authority_grant_revision_id", value.decisionAuthorityGrantRevisionId],
      ["recommendation_proposals", "schema_version", "recommendation_proposal_id", value.recommendationProposalId],
    ]) await rollback(base, async (transaction, graph) => {
      await transaction.execute(drizzleSql.raw(`UPDATE ${table} SET ${column}='BROKEN' WHERE ${key}='${artifactId}'`));
      await expect(graph.contexts.getCareerExecutionContextRevisionById(id))
        .rejects.toThrow("ERR_CAREER_EXECUTION_CONTEXT_REVISION_PERSISTENCE_FAILED");
    });
  });

  it("uses the EAGR historical interval at context declaration and never DAR current time", async () => {
    const base = await ready();
    expect(base.value.executionContext.declaredAt).toBe(base.value.grant.effectiveFrom);
    expect(base.value.executionContext.declaredAt < base.value.grant.effectiveUntil!).toBe(true);
    expect(base.value.grant.declaredAt > base.authority.effectiveUntil!).toBe(true);
    await expect(base.contexts.persistCareerExecutionContextRevision(base.value.executionContext))
      .resolves.toEqual(base.value.executionContext);
  });

  it("atomically rolls back root, subject, and evidence failures before exact retry", async () => {
    const base = await ready();
    const tables = [
      "career_execution_context_revisions", "career_execution_context_subjects",
      "career_execution_context_evidence_references",
    ] as const;
    for (const table of tables) {
      const suffix = randomBytes(4).toString("hex");
      const value = createCareerExecutionContextRevision(base.value.grant, {
        careerExecutionAuthorityGrantRevisionId: base.value.grant.careerExecutionAuthorityGrantRevisionId,
        declaredByActorId: base.value.grant.authorizedExecutionActorId,
        executionTarget: { targetKind: "PERSON", targetRef: `target://atomic/${suffix}` },
        executionChannel: { channelKind: "EMAIL", channelRef: `channel://atomic/${suffix}` },
        declaredAt: base.value.grant.effectiveFrom,
        contextEvidenceRefs: [`evidence://atomic/${suffix}`],
        createdAt: base.value.executionContext.createdAt,
      });
      const fn = `fail_ectx_${suffix}`, trigger = `trigger_ectx_${suffix}`;
      await base.first.sql.unsafe(`CREATE FUNCTION ${fn}() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'injected'; END; $$`);
      await base.first.sql.unsafe(`CREATE TRIGGER ${trigger} BEFORE INSERT ON ${table} FOR EACH ROW EXECUTE FUNCTION ${fn}()`);
      await expect(base.contexts.persistCareerExecutionContextRevision(value))
        .rejects.toThrow("ERR_CAREER_EXECUTION_CONTEXT_REVISION_PERSISTENCE_FAILED");
      for (const durable of tables) {
        const rows = await base.first.sql.unsafe(`SELECT count(*)::int AS count FROM ${durable} WHERE career_execution_context_revision_id='${value.careerExecutionContextRevisionId}'`);
        expect(Number(rows[0].count)).toBe(0);
      }
      await base.first.sql.unsafe(`DROP TRIGGER ${trigger} ON ${table}`);
      await base.first.sql.unsafe(`DROP FUNCTION ${fn}()`);
      await expect(base.contexts.persistCareerExecutionContextRevision(value)).resolves.toEqual(value);
    }
  });

  it("requires a post-commit exact reread and has no mutable/current/occurrence surface", async () => {
    const base = await ready();
    const surface = Object.getOwnPropertyNames(Object.getPrototypeOf(base.contexts));
    expect(surface).not.toEqual(expect.arrayContaining([
      "getCurrentCareerExecutionContextRevision", "getLatestCareerExecutionContextRevision",
      "updateCareerExecutionContextRevision", "repairCareerExecutionContextRevision",
      "replaceCareerExecutionContextRevision", "supersedeCareerExecutionContextRevision",
      "createActionOccurrence", "regenerateCareerExecutionContextRevision",
    ]));
    const suffix = randomBytes(4).toString("hex");
    const value = createCareerExecutionContextRevision(base.value.grant, {
      careerExecutionAuthorityGrantRevisionId: base.value.grant.careerExecutionAuthorityGrantRevisionId,
      declaredByActorId: base.value.grant.authorizedExecutionActorId,
      executionTarget: { targetKind: "PERSON", targetRef: `target://reread/${suffix}` },
      executionChannel: { channelKind: "EMAIL", channelRef: `channel://reread/${suffix}` },
      declaredAt: base.value.grant.effectiveFrom,
      contextEvidenceRefs: [`evidence://reread/${suffix}`], createdAt: base.value.executionContext.createdAt,
    });
    const fn = `mutate_ectx_${suffix}`, trigger = `trigger_ectx_${suffix}`;
    await base.first.sql.unsafe(`CREATE FUNCTION ${fn}() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN UPDATE career_execution_context_revisions SET operation_description='tampered after insert' WHERE career_execution_context_revision_id=NEW.career_execution_context_revision_id; RETURN NEW; END; $$`);
    await base.first.sql.unsafe(`CREATE TRIGGER ${trigger} AFTER INSERT ON career_execution_context_revisions FOR EACH ROW EXECUTE FUNCTION ${fn}()`);
    await expect(base.contexts.persistCareerExecutionContextRevision(value))
      .rejects.toThrow("ERR_CAREER_EXECUTION_CONTEXT_REVISION_PERSISTENCE_FAILED");
    await base.first.sql.unsafe(`DROP TRIGGER ${trigger} ON career_execution_context_revisions`);
    await base.first.sql.unsafe(`DROP FUNCTION ${fn}()`);
  });
});
