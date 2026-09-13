import { sql as drizzleSql } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/pg-core";
import { afterAll, describe, expect, it } from "vitest";
import { createCareerOutcomeValenceFeedbackTargetDeclaration } from "../../../../lib/career/relation/outcome-valence-feedback-target-declaration";
import { PostgresCareerDecisionActionIntentRepository } from "../../../../lib/career/relation-adapters/action-intent-persistence";
import { PostgresCareerActionOccurrenceRepository } from "../../../../lib/career/relation-adapters/action-occurrence-persistence";
import { careerActionOccurrenceEvidenceReferences, careerActionOccurrenceSubjects, careerActionOccurrences } from "../../../../lib/career/relation-adapters/action-occurrence-persistence/postgres-schema";
import { PostgresCareerActionStateChangeAssociationDeclarationRepository } from "../../../../lib/career/relation-adapters/action-state-change-association-declaration-persistence";
import { careerActionStateChangeAssociationDeclarationEvidenceReferences, careerActionStateChangeAssociationDeclarationSubjects, careerActionStateChangeAssociationDeclarations } from "../../../../lib/career/relation-adapters/action-state-change-association-declaration-persistence/postgres-schema";
import { PostgresCareerExecutionAuthorityGrantRevisionRepository } from "../../../../lib/career/relation-adapters/execution-authority-grant-persistence";
import { careerExecutionAuthorityGrantChannelKinds, careerExecutionAuthorityGrantEvidenceReferences, careerExecutionAuthorityGrantRevisions, careerExecutionAuthorityGrantSubjects, careerExecutionAuthorityGrantTargetKinds } from "../../../../lib/career/relation-adapters/execution-authority-grant-persistence/postgres-schema";
import { PostgresCareerExecutionContextRevisionRepository } from "../../../../lib/career/relation-adapters/execution-context-revision-persistence";
import { careerExecutionContextEvidenceReferences, careerExecutionContextRevisions, careerExecutionContextSubjects } from "../../../../lib/career/relation-adapters/execution-context-revision-persistence/postgres-schema";
import { PostgresCareerHumanCommitmentRepository } from "../../../../lib/career/relation-adapters/human-commitment-persistence";
import { careerHumanCommitmentEvidenceReferences, careerHumanCommitmentSubjects, careerHumanCommitments } from "../../../../lib/career/relation-adapters/human-commitment-persistence/postgres-schema";
import { PostgresCareerOutcomeRoleDeclarationRepository } from "../../../../lib/career/relation-adapters/outcome-role-declaration-persistence";
import { careerOutcomeRoleDeclarationEvidenceReferences, careerOutcomeRoleDeclarationSubjects, careerOutcomeRoleDeclarations } from "../../../../lib/career/relation-adapters/outcome-role-declaration-persistence/postgres-schema";
import { PostgresCareerOutcomeValenceDeclarationRepository } from "../../../../lib/career/relation-adapters/outcome-valence-declaration-persistence";
import { careerOutcomeValenceDeclarationEvidenceReferences, careerOutcomeValenceDeclarationSubjects, careerOutcomeValenceDeclarations } from "../../../../lib/career/relation-adapters/outcome-valence-declaration-persistence/postgres-schema";
import { PostgresCareerOutcomeValenceFeedbackAdmissionDeclarationRepository } from "../../../../lib/career/relation-adapters/outcome-valence-feedback-admission-declaration-persistence";
import { careerOutcomeValenceFeedbackAdmissionDeclarationEvidenceReferences, careerOutcomeValenceFeedbackAdmissionDeclarationSubjects, careerOutcomeValenceFeedbackAdmissionDeclarations } from "../../../../lib/career/relation-adapters/outcome-valence-feedback-admission-declaration-persistence/postgres-schema";
import { PostgresCareerStateChangeDeclarationRepository } from "../../../../lib/career/relation-adapters/state-change-declaration-persistence";
import { careerStateChangeDeclarationEvidenceReferences, careerStateChangeDeclarationSubjects, careerStateChangeDeclarations } from "../../../../lib/career/relation-adapters/state-change-declaration-persistence/postgres-schema";
import { closeT12AHistoricalFixture, readyT12AHistoricalGraph, transactionScopedT12AHistoricalGraph } from "../action-intent/t12a-historical-fixture";
import { createT13AHistoricalFixture } from "./t13a-historical-fixture";

const loadAdapter = () =>
  import("../../../../lib/career/relation-adapters/outcome-valence-feedback-target-declaration-persistence") as Promise<any>;
const loadSchema = () =>
  import("../../../../lib/career/relation-adapters/outcome-valence-feedback-target-declaration-persistence/postgres-schema") as Promise<any>;
const missing = "COVFTD_00000000000000000000000000000000";
let unique = 0;

afterAll(closeT12AHistoricalFixture);

const rootColumns = [
  "career_outcome_valence_feedback_target_declaration_id", "career_outcome_valence_feedback_admission_declaration_id",
  "career_outcome_valence_declaration_id", "career_outcome_role_declaration_id",
  "career_action_state_change_association_declaration_id", "career_state_change_declaration_id",
  "career_action_occurrence_id", "career_execution_context_revision_id", "career_execution_authority_grant_revision_id",
  "career_human_commitment_id", "career_decision_action_intent_id", "human_decision_record_id",
  "career_decision_context_revision_id", "decision_authority_grant_revision_id", "recommendation_proposal_id",
  "performed_by_actor_id", "observed_by_actor_id", "association_declared_by_actor_id", "outcome_role_declared_by_actor_id",
  "outcome_valence_declared_by_actor_id", "source_declaration_class", "source_action_intent_class",
  "operation_description", "execution_authority_scope", "execution_target_kind", "execution_target_ref",
  "execution_channel_kind", "execution_channel_ref", "action_occurred_at", "state_subject_kind", "state_subject_ref",
  "state_dimension", "before_observation_state", "before_observation_value", "after_observation_state",
  "after_observation_value", "observed_at", "association_declared_at", "outcome_role_declared_at",
  "outcome_valence_declared_at", "valence", "admitted_by_actor_id", "admitted_at", "admission_state",
  "target_career_decision_context_revision_id", "declared_by_actor_id", "declared_at", "schema_version", "created_at", "payload",
] as const;

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
    careerExecutionAuthorityGrantRevisions, careerExecutionAuthorityGrantSubjects, careerExecutionAuthorityGrantTargetKinds, careerExecutionAuthorityGrantChannelKinds, careerExecutionAuthorityGrantEvidenceReferences,
    careerExecutionContextRevisions, careerExecutionContextSubjects, careerExecutionContextEvidenceReferences,
    careerActionOccurrences, careerActionOccurrenceSubjects, careerActionOccurrenceEvidenceReferences,
    careerStateChangeDeclarations, careerStateChangeDeclarationSubjects, careerStateChangeDeclarationEvidenceReferences,
    careerActionStateChangeAssociationDeclarations, careerActionStateChangeAssociationDeclarationSubjects, careerActionStateChangeAssociationDeclarationEvidenceReferences,
    careerOutcomeRoleDeclarations, careerOutcomeRoleDeclarationSubjects, careerOutcomeRoleDeclarationEvidenceReferences,
    careerOutcomeValenceDeclarations, careerOutcomeValenceDeclarationSubjects, careerOutcomeValenceDeclarationEvidenceReferences,
    careerOutcomeValenceFeedbackAdmissionDeclarations, careerOutcomeValenceFeedbackAdmissionDeclarationSubjects, careerOutcomeValenceFeedbackAdmissionDeclarationEvidenceReferences,
    schema.careerOutcomeValenceFeedbackTargetDeclarations,
    schema.careerOutcomeValenceFeedbackTargetDeclarationSubjects,
    schema.careerOutcomeValenceFeedbackTargetDeclarationEvidenceReferences,
  ]);
  const value = createT13AHistoricalFixture();
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
  const outcomeRoles = new PostgresCareerOutcomeRoleDeclarationRepository(base.first.db, associations);
  await outcomeRoles.persistCareerOutcomeRoleDeclaration(value.outcomeRoleDeclaration);
  const outcomeValences = new PostgresCareerOutcomeValenceDeclarationRepository(base.first.db, outcomeRoles);
  await outcomeValences.persistCareerOutcomeValenceDeclaration(value.outcomeValenceDeclaration);
  const admissions = new PostgresCareerOutcomeValenceFeedbackAdmissionDeclarationRepository(base.first.db, outcomeValences);
  await admissions.persistCareerOutcomeValenceFeedbackAdmissionDeclaration(value.outcomeValenceFeedbackAdmissionDeclaration);
  const targets = new adapter.PostgresCareerOutcomeValenceFeedbackTargetDeclarationRepository(base.first.db, admissions);
  return { ...base, value, adapter, schema, admissions, targets };
}

async function rollback(base: Awaited<ReturnType<typeof ready>>, operation: (transaction: any, targets: any) => Promise<void>) {
  await base.first.db.transaction(async transaction => {
    const historical = transactionScopedT12AHistoricalGraph(transaction, base.evolution, base.implementations);
    const intents = new PostgresCareerDecisionActionIntentRepository(transaction, historical.records);
    const commitments = new PostgresCareerHumanCommitmentRepository(transaction, intents);
    const grants = new PostgresCareerExecutionAuthorityGrantRevisionRepository(transaction, commitments);
    const contexts = new PostgresCareerExecutionContextRevisionRepository(transaction, grants);
    const occurrences = new PostgresCareerActionOccurrenceRepository(transaction, contexts, grants);
    const stateChanges = new PostgresCareerStateChangeDeclarationRepository(transaction, occurrences);
    const associations = new PostgresCareerActionStateChangeAssociationDeclarationRepository(transaction, stateChanges);
    const outcomeRoles = new PostgresCareerOutcomeRoleDeclarationRepository(transaction, associations);
    const outcomeValences = new PostgresCareerOutcomeValenceDeclarationRepository(transaction, outcomeRoles);
    const admissions = new PostgresCareerOutcomeValenceFeedbackAdmissionDeclarationRepository(transaction, outcomeValences);
    await operation(transaction, new base.adapter.PostgresCareerOutcomeValenceFeedbackTargetDeclarationRepository(transaction, admissions));
    throw new Error("rollback");
  }).catch(error => { if (error.message !== "rollback") throw error; });
}

function declaration(base: Awaited<ReturnType<typeof ready>>) {
  unique += 1;
  const suffix = String(unique).padStart(32, "0");
  return createCareerOutcomeValenceFeedbackTargetDeclaration(base.value.outcomeValenceFeedbackAdmissionDeclaration, {
    careerOutcomeValenceFeedbackAdmissionDeclarationId:
      base.value.outcomeValenceFeedbackAdmissionDeclaration.careerOutcomeValenceFeedbackAdmissionDeclarationId,
    targetCareerDecisionContextRevisionId: `DCTXREV_${suffix}`,
    declaredByActorId: `OUTCOME_VALENCE_FEEDBACK_TARGET_DECLARING_ACTOR_T13A_${unique}`,
    declaredAt: "2027-02-09T01:00:00.000Z",
    targetSelectionEvidenceRefs: [
      `evidence://outcome-valence-feedback-target/t13a/${unique}/b`,
      `evidence://outcome-valence-feedback-target/t13a/${unique}/a`,
    ],
    createdAt: "2027-02-09T01:00:01.000Z",
  });
}

describe("T13A PostgreSQL immutable CareerOutcomeValenceFeedbackTargetDeclaration RED contract", () => {
  it("constructs canonical RCP through COVFAD history before the adapter boundary", () => {
    const value = createT13AHistoricalFixture();
    expect(value.outcomeValenceFeedbackAdmissionDeclaration.careerOutcomeValenceDeclarationId)
      .toBe(value.outcomeValenceDeclaration.careerOutcomeValenceDeclarationId);
    expect(value.occurrence.occurredAt < value.grant.effectiveUntil!).toBe(true);
    expect(value.outcomeValenceFeedbackAdmissionDeclaration.admittedAt > value.grant.effectiveUntil!).toBe(true);
  });

  it("freezes only the repository API, exact root/child columns, one restrictive COVFAD FK, and no target DCTXREV FK", async () => {
    const adapter = await loadAdapter();
    const schema = await loadSchema();
    expect(adapter.PostgresCareerOutcomeValenceFeedbackTargetDeclarationRepository).toBeTypeOf("function");
    const root = getTableConfig(schema.careerOutcomeValenceFeedbackTargetDeclarations);
    expect(root.name).toBe("career_outcome_valence_feedback_target_declarations");
    expect(root.columns.map(column => column.name)).toEqual(rootColumns);
    expect(getTableConfig(schema.careerOutcomeValenceFeedbackTargetDeclarationSubjects).columns.map(column => column.name))
      .toEqual(["career_outcome_valence_feedback_target_declaration_id", "recommendation_proposal_id", "source_evolution_input_item_ordinal"]);
    expect(getTableConfig(schema.careerOutcomeValenceFeedbackTargetDeclarationEvidenceReferences).columns.map(column => column.name))
      .toEqual(["career_outcome_valence_feedback_target_declaration_id", "evidence_ref"]);
    expect(root.foreignKeys).toHaveLength(1);
    const predecessor = root.foreignKeys[0].reference();
    expect(predecessor.columns.map(column => column.name))
      .toEqual(["career_outcome_valence_feedback_admission_declaration_id"]);
    expect(getTableConfig(predecessor.foreignTable).name)
      .toBe("career_outcome_valence_feedback_admission_declarations");
    expect(predecessor.foreignColumns.map(column => column.name))
      .toEqual(["career_outcome_valence_feedback_admission_declaration_id"]);
    expect(root.foreignKeys[0].onDelete).toBe("restrict");
    expect(root.foreignKeys[0].onUpdate).toBe("restrict");
  });

  it("persists exact root/payload/subjects/target-selection evidence, returns detached rereads, and preserves genuine absence", async () => {
    const base = await ready();
    const value = declaration(base);
    await expect(base.targets.persistCareerOutcomeValenceFeedbackTargetDeclaration(value)).resolves.toEqual(value);
    const first = await base.targets.getCareerOutcomeValenceFeedbackTargetDeclarationById(value.careerOutcomeValenceFeedbackTargetDeclarationId);
    expect(first).toEqual(value);
    expect(first.targetCareerDecisionContextRevisionId).toBe(value.targetCareerDecisionContextRevisionId);
    first.stateSubject.subjectRef = "local";
    first.targetSelectionEvidenceRefs.pop();
    await expect(base.targets.getCareerOutcomeValenceFeedbackTargetDeclarationById(value.careerOutcomeValenceFeedbackTargetDeclarationId))
      .resolves.toEqual(value);
    await expect(base.targets.getCareerOutcomeValenceFeedbackTargetDeclarationById(missing))
      .rejects.toThrow("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_DECLARATION_NOT_FOUND");
  });

  it("is idempotent only for exact complete durable state including audit time, opaque target reference, witnesses, and child rows", async () => {
    const base = await ready();
    const value = declaration(base);
    await base.targets.persistCareerOutcomeValenceFeedbackTargetDeclaration(value);
    await expect(base.targets.persistCareerOutcomeValenceFeedbackTargetDeclaration(value)).resolves.toEqual(value);
    for (const changed of [
      { ...value, createdAt: "2030-01-01T00:00:00.000Z" },
      { ...value, targetCareerDecisionContextRevisionId: "DCTXREV_11111111111111111111111111111111" },
      { ...value, declaredByActorId: "OTHER" }, { ...value, declaredAt: "2027-02-09T02:00:00.000Z" },
      { ...value, targetSelectionEvidenceRefs: ["evidence://other"] }, { ...value, valence: "UNDESIRABLE" },
      { ...value, decisionSubjects: value.decisionSubjects.slice(0, 1) },
      { ...value, executionTarget: { targetKind: "SYSTEM", targetRef: "target://other" } },
    ]) await expect(base.targets.persistCareerOutcomeValenceFeedbackTargetDeclaration(changed)).rejects
      .toThrow("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_DECLARATION_IMMUTABLE_CONFLICT");
  });

  it("fails closed for root, payload, child, identity, and COVFAD-relation corruption without converting found roots to absence", async () => {
    const base = await ready();
    const value = declaration(base);
    const id = value.careerOutcomeValenceFeedbackTargetDeclarationId;
    await base.targets.persistCareerOutcomeValenceFeedbackTargetDeclaration(value);
    await rollback(base, async (transaction, targets) => {
      await transaction.execute(drizzleSql.raw(`UPDATE career_outcome_valence_feedback_target_declarations SET declared_by_actor_id='BROKEN' WHERE career_outcome_valence_feedback_target_declaration_id='${id}'`));
      await expect(targets.getCareerOutcomeValenceFeedbackTargetDeclarationById(id))
        .rejects.toThrow("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_DECLARATION_PERSISTENCE_FAILED");
    });
  });

  it("retains opaque target declaration chronology and historical expiry without target lookup or EAGR/DAR reevaluation", async () => {
    const base = await ready();
    const value = declaration(base);
    expect(value.declaredAt >= base.value.outcomeValenceFeedbackAdmissionDeclaration.admittedAt).toBe(true);
    expect(base.value.occurrence.occurredAt < base.value.grant.effectiveUntil!).toBe(true);
    expect(value.declaredAt > base.value.grant.effectiveUntil!).toBe(true);
    await expect(base.targets.persistCareerOutcomeValenceFeedbackTargetDeclaration(value)).resolves.toEqual(value);
    await expect(base.targets.persistCareerOutcomeValenceFeedbackTargetDeclaration({
      ...value,
      careerOutcomeValenceFeedbackAdmissionDeclarationId: "COVFAD_00000000000000000000000000000000",
    })).rejects.toThrow();
  });

  it("atomically rolls back root, subject, and evidence write failures before exact retry while leaving COVFAD untouched", async () => {
    const base = await ready();
    const tables = [
      "career_outcome_valence_feedback_target_declarations",
      "career_outcome_valence_feedback_target_declaration_subjects",
      "career_outcome_valence_feedback_target_declaration_evidence_references",
    ] as const;
    for (const table of tables) {
      const value = declaration(base);
      const suffix = String(++unique);
      const fn = `fail_covftd_${suffix}`;
      const trigger = `trigger_covftd_${suffix}`;
      await base.first.sql.unsafe(`CREATE FUNCTION ${fn}() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'injected'; END; $$`);
      await base.first.sql.unsafe(`CREATE TRIGGER ${trigger} BEFORE INSERT ON ${table} FOR EACH ROW EXECUTE FUNCTION ${fn}()`);
      await expect(base.targets.persistCareerOutcomeValenceFeedbackTargetDeclaration(value))
        .rejects.toThrow("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_DECLARATION_PERSISTENCE_FAILED");
      for (const durable of tables) {
        const rows = await base.first.sql.unsafe(`SELECT count(*)::int AS count FROM ${durable} WHERE career_outcome_valence_feedback_target_declaration_id='${value.careerOutcomeValenceFeedbackTargetDeclarationId}'`);
        expect(Number(rows[0].count)).toBe(0);
      }
      await base.first.sql.unsafe(`DROP TRIGGER ${trigger} ON ${table}`);
      await base.first.sql.unsafe(`DROP FUNCTION ${fn}()`);
      await expect(base.targets.persistCareerOutcomeValenceFeedbackTargetDeclaration(value)).resolves.toEqual(value);
    }
  });

  it("requires postcommit exact reread and exposes no mutable, target-binding, current, delivery, learning, evaluation, or causal repository surface", async () => {
    const base = await ready();
    const surface = Object.getOwnPropertyNames(Object.getPrototypeOf(base.targets));
    expect(surface).toEqual(expect.arrayContaining([
      "getCareerOutcomeValenceFeedbackTargetDeclarationById",
      "persistCareerOutcomeValenceFeedbackTargetDeclaration",
    ]));
    expect(surface).not.toEqual(expect.arrayContaining([
      "getCurrentCareerOutcomeValenceFeedbackTargetDeclaration", "getLatestCareerOutcomeValenceFeedbackTargetDeclaration",
      "getHeadCareerOutcomeValenceFeedbackTargetDeclaration", "updateCareerOutcomeValenceFeedbackTargetDeclaration",
      "repairCareerOutcomeValenceFeedbackTargetDeclaration", "replaceCareerOutcomeValenceFeedbackTargetDeclaration",
      "bindCareerOutcomeValenceFeedbackTarget", "lookupCareerDecisionContextRevision", "deliverCareerOutcomeValenceFeedbackTarget",
      "receiveCareerOutcomeValenceFeedbackTarget", "createContextMembership", "createContextRevision",
      "createLearning", "evaluateCareerOutcomeValenceFeedbackTarget", "attributeCareerOutcomeValenceFeedbackTarget",
    ]));
  });
});
