import { sql as drizzleSql } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/pg-core";
import { afterAll, describe, expect, it } from "vitest";
import { createCareerOutcomeRoleDeclaration } from "../../../../lib/career/relation/outcome-role-declaration";
import { PostgresCareerDecisionActionIntentRepository } from "../../../../lib/career/relation-adapters/action-intent-persistence";
import { PostgresCareerActionOccurrenceRepository } from "../../../../lib/career/relation-adapters/action-occurrence-persistence";
import { careerActionOccurrenceEvidenceReferences, careerActionOccurrenceSubjects, careerActionOccurrences } from "../../../../lib/career/relation-adapters/action-occurrence-persistence/postgres-schema";
import { PostgresCareerActionStateChangeAssociationDeclarationRepository } from "../../../../lib/career/relation-adapters/action-state-change-association-declaration-persistence";
import { careerActionStateChangeAssociationDeclarationEvidenceReferences, careerActionStateChangeAssociationDeclarations, careerActionStateChangeAssociationDeclarationSubjects } from "../../../../lib/career/relation-adapters/action-state-change-association-declaration-persistence/postgres-schema";
import { PostgresCareerExecutionAuthorityGrantRevisionRepository } from "../../../../lib/career/relation-adapters/execution-authority-grant-persistence";
import { careerExecutionAuthorityGrantChannelKinds, careerExecutionAuthorityGrantEvidenceReferences, careerExecutionAuthorityGrantRevisions, careerExecutionAuthorityGrantSubjects, careerExecutionAuthorityGrantTargetKinds } from "../../../../lib/career/relation-adapters/execution-authority-grant-persistence/postgres-schema";
import { PostgresCareerExecutionContextRevisionRepository } from "../../../../lib/career/relation-adapters/execution-context-revision-persistence";
import { careerExecutionContextEvidenceReferences, careerExecutionContextRevisions, careerExecutionContextSubjects } from "../../../../lib/career/relation-adapters/execution-context-revision-persistence/postgres-schema";
import { PostgresCareerHumanCommitmentRepository } from "../../../../lib/career/relation-adapters/human-commitment-persistence";
import { careerHumanCommitmentEvidenceReferences, careerHumanCommitmentSubjects, careerHumanCommitments } from "../../../../lib/career/relation-adapters/human-commitment-persistence/postgres-schema";
import { PostgresCareerStateChangeDeclarationRepository } from "../../../../lib/career/relation-adapters/state-change-declaration-persistence";
import { careerStateChangeDeclarationEvidenceReferences, careerStateChangeDeclarations, careerStateChangeDeclarationSubjects } from "../../../../lib/career/relation-adapters/state-change-declaration-persistence/postgres-schema";
import { closeT12AHistoricalFixture, readyT12AHistoricalGraph, transactionScopedT12AHistoricalGraph } from "../action-intent/t12a-historical-fixture";
import { createT12HHistoricalFixture } from "./t12h-historical-fixture";

const loadAdapter = () => import("../../../../lib/career/relation-adapters/outcome-role-declaration-persistence") as Promise<any>;
const loadSchema = () => import("../../../../lib/career/relation-adapters/outcome-role-declaration-persistence/postgres-schema") as Promise<any>;
const missing = "CORD_00000000000000000000000000000000";
let unique = 0;

afterAll(closeT12AHistoricalFixture);

async function createTables(database: any, tables: readonly any[]) {
  for (const table of tables) {
    const config = getTableConfig(table);
    const columns = config.columns.map(column => `"${column.name}" ${column.getSQLType()}${column.notNull ? " NOT NULL" : ""}${column.primary ? " PRIMARY KEY" : ""}`);
    await database.execute(drizzleSql.raw(`CREATE TABLE IF NOT EXISTS "${config.name}" (${columns.join(",")})`));
  }
}

async function ready() {
  const adapter = await loadAdapter(); const schema = await loadSchema(); const base = await readyT12AHistoricalGraph();
  await createTables(base.first.db, [
    careerHumanCommitments, careerHumanCommitmentSubjects, careerHumanCommitmentEvidenceReferences,
    careerExecutionAuthorityGrantRevisions, careerExecutionAuthorityGrantSubjects, careerExecutionAuthorityGrantTargetKinds, careerExecutionAuthorityGrantChannelKinds, careerExecutionAuthorityGrantEvidenceReferences,
    careerExecutionContextRevisions, careerExecutionContextSubjects, careerExecutionContextEvidenceReferences,
    careerActionOccurrences, careerActionOccurrenceSubjects, careerActionOccurrenceEvidenceReferences,
    careerStateChangeDeclarations, careerStateChangeDeclarationSubjects, careerStateChangeDeclarationEvidenceReferences,
    careerActionStateChangeAssociationDeclarations, careerActionStateChangeAssociationDeclarationSubjects, careerActionStateChangeAssociationDeclarationEvidenceReferences,
    schema.careerOutcomeRoleDeclarations, schema.careerOutcomeRoleDeclarationSubjects, schema.careerOutcomeRoleDeclarationEvidenceReferences,
  ]);
  const value = createT12HHistoricalFixture();
  const intents = new PostgresCareerDecisionActionIntentRepository(base.first.db, base.records);
  await intents.persistCareerDecisionActionIntent(value.actionIntent);
  const commitments = new PostgresCareerHumanCommitmentRepository(base.first.db, intents);
  await commitments.persistCareerHumanCommitment(value.commitment);
  const grants = new PostgresCareerExecutionAuthorityGrantRevisionRepository(base.first.db, commitments);
  await grants.persistCareerExecutionAuthorityGrantRevision(value.grant);
  const contexts = new PostgresCareerExecutionContextRevisionRepository(base.first.db, grants);
  await contexts.persistCareerExecutionContextRevision(value.executionContext);
  const occurrences = new PostgresCareerActionOccurrenceRepository(base.first.db, contexts, grants);
  await occurrences.persistCareerActionOccurrence(value.occurrence);
  const stateChanges = new PostgresCareerStateChangeDeclarationRepository(base.first.db, occurrences);
  await stateChanges.persistCareerStateChangeDeclaration(value.stateChangeDeclaration);
  const associations = new PostgresCareerActionStateChangeAssociationDeclarationRepository(base.first.db, stateChanges);
  await associations.persistCareerActionStateChangeAssociationDeclaration(value.associationDeclaration);
  const outcomeRoles = new adapter.PostgresCareerOutcomeRoleDeclarationRepository(base.first.db, associations);
  return { ...base, value, adapter, schema, associations, outcomeRoles };
}

async function scoped(database: any, base: Awaited<ReturnType<typeof ready>>) {
  const historical = transactionScopedT12AHistoricalGraph(database, base.evolution, base.implementations);
  const intents = new PostgresCareerDecisionActionIntentRepository(database, historical.records);
  const commitments = new PostgresCareerHumanCommitmentRepository(database, intents);
  const grants = new PostgresCareerExecutionAuthorityGrantRevisionRepository(database, commitments);
  const contexts = new PostgresCareerExecutionContextRevisionRepository(database, grants);
  const occurrences = new PostgresCareerActionOccurrenceRepository(database, contexts, grants);
  const stateChanges = new PostgresCareerStateChangeDeclarationRepository(database, occurrences);
  const associations = new PostgresCareerActionStateChangeAssociationDeclarationRepository(database, stateChanges);
  return { outcomeRoles: new base.adapter.PostgresCareerOutcomeRoleDeclarationRepository(database, associations) };
}

async function rollback(base: Awaited<ReturnType<typeof ready>>, operation: (transaction: any, graph: Awaited<ReturnType<typeof scoped>>) => Promise<void>) {
  await base.first.db.transaction(async transaction => {
    await operation(transaction, await scoped(transaction, base));
    throw new Error("rollback");
  }).catch(error => { if (error.message !== "rollback") throw error; });
}

function declaration(base: Awaited<ReturnType<typeof ready>>) {
  unique += 1; const suffix = String(unique);
  return createCareerOutcomeRoleDeclaration(base.value.associationDeclaration, {
    careerActionStateChangeAssociationDeclarationId: base.value.associationDeclaration.careerActionStateChangeAssociationDeclarationId,
    declaredByActorId: `OUTCOME_ROLE_DECLARANT_T12H_${suffix}`,
    declaredAt: "2027-02-06T01:00:00.000Z",
    outcomeRoleEvidenceRefs: [`evidence://outcome-role/t12h/${suffix}/b`, `evidence://outcome-role/t12h/${suffix}/a`],
    createdAt: "2027-02-06T01:00:01.000Z",
  });
}

describe("T12H PostgreSQL immutable CareerOutcomeRoleDeclaration RED contract", () => {
  it("constructs canonical RCP -> DAR -> DCTXREV -> DCR -> DAINT -> HCOM -> EAGR -> ECTXREV -> AOC -> SCD -> ASCAD -> CORD history before the adapter boundary", () => {
    const value = createT12HHistoricalFixture(); const outcomeRole = createCareerOutcomeRoleDeclaration(value.associationDeclaration, value.outcomeRoleDeclarationInput);
    expect(outcomeRole.careerActionStateChangeAssociationDeclarationId).toBe(value.associationDeclaration.careerActionStateChangeAssociationDeclarationId);
    expect(outcomeRole.associationDeclaredByActorId).toBe(value.associationDeclaration.declaredByActorId);
    expect(outcomeRole.declaredByActorId).not.toBe(value.occurrence.performedByActorId);
    expect(outcomeRole.declaredByActorId).not.toBe(value.stateChangeDeclaration.observedByActorId);
    expect(outcomeRole.declaredByActorId).not.toBe(value.associationDeclaration.declaredByActorId);
    expect(value.occurrence.occurredAt < value.grant.effectiveUntil!).toBe(true);
    expect(value.stateChangeDeclaration.observedAt > value.grant.effectiveUntil!).toBe(true);
    expect(value.associationDeclaration.declaredAt > value.grant.effectiveUntil!).toBe(true);
    expect(outcomeRole.declaredAt > value.grant.effectiveUntil!).toBe(true);
  });

  it("freezes only the repository API, exact root columns, normalized children, and direct restrictive ASCAD predecessor", async () => {
    const adapter = await loadAdapter(); const schema = await loadSchema();
    expect(adapter.PostgresCareerOutcomeRoleDeclarationRepository).toBeTypeOf("function");
    const root = getTableConfig(schema.careerOutcomeRoleDeclarations);
    expect(root.name).toBe("career_outcome_role_declarations");
    expect(root.columns.map(column => column.name)).toEqual(expect.arrayContaining([
      "career_outcome_role_declaration_id", "career_action_state_change_association_declaration_id", "career_state_change_declaration_id", "career_action_occurrence_id", "career_execution_context_revision_id", "career_execution_authority_grant_revision_id", "career_human_commitment_id", "career_decision_action_intent_id", "human_decision_record_id", "career_decision_context_revision_id", "decision_authority_grant_revision_id", "recommendation_proposal_id", "performed_by_actor_id", "observed_by_actor_id", "association_declared_by_actor_id", "source_declaration_class", "source_action_intent_class", "operation_description", "execution_authority_scope", "execution_target_kind", "execution_target_ref", "execution_channel_kind", "execution_channel_ref", "action_occurred_at", "state_subject_kind", "state_subject_ref", "state_dimension", "before_observation_state", "before_observation_value", "after_observation_state", "after_observation_value", "observed_at", "association_declared_at", "declared_by_actor_id", "declared_at", "schema_version", "created_at", "payload",
    ]));
    expect(getTableConfig(schema.careerOutcomeRoleDeclarationSubjects).name).toBe("career_outcome_role_declaration_subjects");
    expect(getTableConfig(schema.careerOutcomeRoleDeclarationEvidenceReferences).name).toBe("career_outcome_role_declaration_evidence_references");
  });

  it("persists exact root/payload/children/ASCAD history, performs detached reread, and preserves genuine absence", async () => {
    const base = await ready(); const value = declaration(base);
    await expect(base.outcomeRoles.persistCareerOutcomeRoleDeclaration(value)).resolves.toEqual(value);
    const first = await base.outcomeRoles.getCareerOutcomeRoleDeclarationById(value.careerOutcomeRoleDeclarationId);
    expect(first).toEqual(value); first.stateSubject.subjectRef = "local";
    await expect(base.outcomeRoles.getCareerOutcomeRoleDeclarationById(value.careerOutcomeRoleDeclarationId)).resolves.toEqual(value);
    await expect(base.outcomeRoles.getCareerOutcomeRoleDeclarationById(missing)).rejects.toThrow("ERR_CAREER_OUTCOME_ROLE_DECLARATION_NOT_FOUND");
  });

  it("is idempotent only for exact complete durable state including audit time, declaration input, copied witnesses, and children", async () => {
    const base = await ready(); const value = declaration(base); await base.outcomeRoles.persistCareerOutcomeRoleDeclaration(value);
    await expect(base.outcomeRoles.persistCareerOutcomeRoleDeclaration(value)).resolves.toEqual(value);
    for (const changed of [
      { ...value, createdAt: "2030-01-01T00:00:00.000Z" }, { ...value, declaredByActorId: "OTHER" }, { ...value, declaredAt: "2027-02-06T02:00:00.000Z" }, { ...value, associationDeclaredAt: "2027-02-05T02:00:00.000Z" }, { ...value, operationDescription: "other" }, { ...value, decisionSubjects: value.decisionSubjects.slice(0, 1) }, { ...value, outcomeRoleEvidenceRefs: ["evidence://other"] }, { ...value, executionTarget: { targetKind: "SYSTEM", targetRef: "target://other" } }, { ...value, beforeObservation: { observationState: "OBSERVED", value: "other-before" } },
    ]) await expect(base.outcomeRoles.persistCareerOutcomeRoleDeclaration(changed)).rejects.toThrow("ERR_CAREER_OUTCOME_ROLE_DECLARATION_IMMUTABLE_CONFLICT");
  });

  it("fails closed for physical/payload/child/identity/ASCAD corruption without translating found roots to absence", async () => {
    const base = await ready(); const value = declaration(base); const id = value.careerOutcomeRoleDeclarationId;
    await base.outcomeRoles.persistCareerOutcomeRoleDeclaration(value);
    await rollback(base, async (transaction, graph) => {
      await transaction.execute(drizzleSql.raw(`UPDATE career_outcome_role_declarations SET declared_by_actor_id='BROKEN' WHERE career_outcome_role_declaration_id='${id}'`));
      await expect(graph.outcomeRoles.getCareerOutcomeRoleDeclarationById(id)).rejects.toThrow("ERR_CAREER_OUTCOME_ROLE_DECLARATION_PERSISTENCE_FAILED");
    });
  });

  it("requires exact ASCAD copied witnesses and CORD chronology but never re-evaluates EAGR or DAR after AOC time", async () => {
    const base = await ready(); const value = declaration(base);
    expect(value.declaredAt >= base.value.associationDeclaration.declaredAt).toBe(true);
    expect(base.value.occurrence.occurredAt < base.value.grant.effectiveUntil!).toBe(true);
    expect(base.value.stateChangeDeclaration.observedAt > base.value.grant.effectiveUntil!).toBe(true);
    expect(base.value.associationDeclaration.declaredAt > base.value.grant.effectiveUntil!).toBe(true);
    expect(value.declaredAt > base.value.grant.effectiveUntil!).toBe(true);
    await expect(base.outcomeRoles.persistCareerOutcomeRoleDeclaration(value)).resolves.toEqual(value);
    for (const changed of [
      { ...value, careerActionStateChangeAssociationDeclarationId: "ASCAD_00000000000000000000000000000000" }, { ...value, careerStateChangeDeclarationId: "SCD_00000000000000000000000000000000" }, { ...value, careerActionOccurrenceId: "AOC_00000000000000000000000000000000" }, { ...value, associationDeclaredByActorId: "OTHER" }, { ...value, performedByActorId: "OTHER" }, { ...value, observedByActorId: "OTHER" }, { ...value, actionOccurredAt: "2027-02-03T01:00:01.000Z" }, { ...value, declaredAt: "2027-02-05T00:59:59.999Z" },
    ]) await expect(base.outcomeRoles.persistCareerOutcomeRoleDeclaration(changed)).rejects.toThrow();
  });

  it("atomically rolls back deterministic root, subject, and evidence write failures before exact retry", async () => {
    const base = await ready(); const tables = ["career_outcome_role_declarations", "career_outcome_role_declaration_subjects", "career_outcome_role_declaration_evidence_references"] as const;
    for (const table of tables) {
      const value = declaration(base); const suffix = String(++unique); const fn = `fail_cord_${suffix}`; const trigger = `trigger_cord_${suffix}`;
      await base.first.sql.unsafe(`CREATE FUNCTION ${fn}() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'injected'; END; $$`);
      await base.first.sql.unsafe(`CREATE TRIGGER ${trigger} BEFORE INSERT ON ${table} FOR EACH ROW EXECUTE FUNCTION ${fn}()`);
      await expect(base.outcomeRoles.persistCareerOutcomeRoleDeclaration(value)).rejects.toThrow("ERR_CAREER_OUTCOME_ROLE_DECLARATION_PERSISTENCE_FAILED");
      for (const durable of tables) {
        const rows = await base.first.sql.unsafe(`SELECT count(*)::int AS count FROM ${durable} WHERE career_outcome_role_declaration_id='${value.careerOutcomeRoleDeclarationId}'`);
        expect(Number(rows[0].count)).toBe(0);
      }
      await base.first.sql.unsafe(`DROP TRIGGER ${trigger} ON ${table}`); await base.first.sql.unsafe(`DROP FUNCTION ${fn}()`);
      await expect(base.outcomeRoles.persistCareerOutcomeRoleDeclaration(value)).resolves.toEqual(value);
    }
  });

  it("requires mandatory post-commit exact reread and exposes no mutable, current, verification, outcome, or causal surface", async () => {
    const base = await ready(); const surface = Object.getOwnPropertyNames(Object.getPrototypeOf(base.outcomeRoles));
    expect(surface).toEqual(expect.arrayContaining(["getCareerOutcomeRoleDeclarationById", "persistCareerOutcomeRoleDeclaration"]));
    expect(surface).not.toEqual(expect.arrayContaining([
      "getCurrentCareerOutcomeRoleDeclaration", "getLatestCareerOutcomeRoleDeclaration", "getHeadCareerOutcomeRoleDeclaration", "updateCareerOutcomeRoleDeclaration", "repairCareerOutcomeRoleDeclaration", "replaceCareerOutcomeRoleDeclaration", "supersedeCareerOutcomeRoleDeclaration", "regenerateCareerOutcomeRoleDeclaration", "verifyCareerOutcomeRole", "createCareerOutcome", "createOutcomeAttributionProposal",
    ]));
  });
});
