import { sql as drizzleSql } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/pg-core";
import { afterAll, describe, expect, it } from "vitest";
import { createCareerOutcomeValenceFeedbackAdmissionDeclaration } from "../../../../lib/career/relation/outcome-valence-feedback-admission-declaration";
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
import { PostgresCareerStateChangeDeclarationRepository } from "../../../../lib/career/relation-adapters/state-change-declaration-persistence";
import { careerStateChangeDeclarationEvidenceReferences, careerStateChangeDeclarationSubjects, careerStateChangeDeclarations } from "../../../../lib/career/relation-adapters/state-change-declaration-persistence/postgres-schema";
import { closeT12AHistoricalFixture, readyT12AHistoricalGraph, transactionScopedT12AHistoricalGraph } from "../action-intent/t12a-historical-fixture";
import { createT12JHistoricalFixture } from "./t12j-historical-fixture";

const loadAdapter = () =>
  import("../../../../lib/career/relation-adapters/outcome-valence-feedback-admission-declaration-persistence") as Promise<any>;
const loadSchema = () =>
  import("../../../../lib/career/relation-adapters/outcome-valence-feedback-admission-declaration-persistence/postgres-schema") as Promise<any>;
const missing = "COVFAD_00000000000000000000000000000000";
let unique = 0;

afterAll(closeT12AHistoricalFixture);

const rootColumns = [
  "career_outcome_valence_feedback_admission_declaration_id", "career_outcome_valence_declaration_id",
  "career_outcome_role_declaration_id", "career_action_state_change_association_declaration_id",
  "career_state_change_declaration_id", "career_action_occurrence_id", "career_execution_context_revision_id",
  "career_execution_authority_grant_revision_id", "career_human_commitment_id", "career_decision_action_intent_id",
  "human_decision_record_id", "career_decision_context_revision_id", "decision_authority_grant_revision_id",
  "recommendation_proposal_id", "performed_by_actor_id", "observed_by_actor_id", "association_declared_by_actor_id",
  "outcome_role_declared_by_actor_id", "outcome_valence_declared_by_actor_id", "source_declaration_class",
  "source_action_intent_class", "operation_description", "execution_authority_scope", "execution_target_kind",
  "execution_target_ref", "execution_channel_kind", "execution_channel_ref", "action_occurred_at", "state_subject_kind",
  "state_subject_ref", "state_dimension", "before_observation_state", "before_observation_value", "after_observation_state",
  "after_observation_value", "observed_at", "association_declared_at", "outcome_role_declared_at",
  "outcome_valence_declared_at", "valence", "admitted_by_actor_id", "admitted_at", "admission_state", "schema_version",
  "created_at", "payload",
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
    schema.careerOutcomeValenceFeedbackAdmissionDeclarations,
    schema.careerOutcomeValenceFeedbackAdmissionDeclarationSubjects,
    schema.careerOutcomeValenceFeedbackAdmissionDeclarationEvidenceReferences,
  ]);
  const value = createT12JHistoricalFixture();
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
  const admissions = new adapter.PostgresCareerOutcomeValenceFeedbackAdmissionDeclarationRepository(base.first.db, outcomeValences);
  return { ...base, value, adapter, schema, outcomeValences, admissions };
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
  const outcomeRoles = new PostgresCareerOutcomeRoleDeclarationRepository(database, associations);
  const outcomeValences = new PostgresCareerOutcomeValenceDeclarationRepository(database, outcomeRoles);
  return {
    admissions: new base.adapter.PostgresCareerOutcomeValenceFeedbackAdmissionDeclarationRepository(database, outcomeValences),
  };
}

async function rollback(base: Awaited<ReturnType<typeof ready>>, operation: (transaction: any, graph: Awaited<ReturnType<typeof scoped>>) => Promise<void>) {
  await base.first.db.transaction(async transaction => {
    await operation(transaction, await scoped(transaction, base));
    throw new Error("rollback");
  }).catch(error => { if (error.message !== "rollback") throw error; });
}

function declaration(base: Awaited<ReturnType<typeof ready>>) {
  unique += 1;
  const suffix = String(unique);
  return createCareerOutcomeValenceFeedbackAdmissionDeclaration(base.value.outcomeValenceDeclaration, {
    careerOutcomeValenceDeclarationId: base.value.outcomeValenceDeclaration.careerOutcomeValenceDeclarationId,
    admittedByActorId: `OUTCOME_VALENCE_ADMITTING_ACTOR_T12J_${suffix}`,
    admittedAt: "2027-02-08T01:00:00.000Z",
    admissionEvidenceRefs: [
      `evidence://outcome-valence-feedback-admission/t12j/${suffix}/b`,
      `evidence://outcome-valence-feedback-admission/t12j/${suffix}/a`,
    ],
    createdAt: "2027-02-08T01:00:01.000Z",
  });
}

describe("T12J PostgreSQL immutable CareerOutcomeValenceFeedbackAdmissionDeclaration RED contract", () => {
  it("constructs canonical RCP -> DAR -> DCTXREV -> DCR -> DAINT -> HCOM -> EAGR -> ECTXREV -> AOC -> SCD -> ASCAD -> CORD -> COVD -> COVFAD history before the adapter boundary", () => {
    const value = createT12JHistoricalFixture();
    const admission = createCareerOutcomeValenceFeedbackAdmissionDeclaration(
      value.outcomeValenceDeclaration,
      value.outcomeValenceFeedbackAdmissionDeclarationInput,
    );
    expect(admission.careerOutcomeValenceDeclarationId).toBe(value.outcomeValenceDeclaration.careerOutcomeValenceDeclarationId);
    expect(admission.outcomeValenceDeclaredByActorId).toBe(value.outcomeValenceDeclaration.declaredByActorId);
    expect(admission.admittedByActorId).not.toBe(value.outcomeValenceDeclaration.declaredByActorId);
    expect(value.occurrence.occurredAt < value.grant.effectiveUntil!).toBe(true);
    expect(value.stateChangeDeclaration.observedAt > value.grant.effectiveUntil!).toBe(true);
    expect(value.associationDeclaration.declaredAt > value.grant.effectiveUntil!).toBe(true);
    expect(value.outcomeRoleDeclaration.declaredAt > value.grant.effectiveUntil!).toBe(true);
    expect(value.outcomeValenceDeclaration.declaredAt > value.grant.effectiveUntil!).toBe(true);
    expect(admission.admittedAt > value.grant.effectiveUntil!).toBe(true);
  });

  it("freezes only the repository API, exact root columns, normalized children, and direct restrictive COVD predecessor", async () => {
    const adapter = await loadAdapter();
    const schema = await loadSchema();
    expect(adapter.PostgresCareerOutcomeValenceFeedbackAdmissionDeclarationRepository).toBeTypeOf("function");
    const root = getTableConfig(schema.careerOutcomeValenceFeedbackAdmissionDeclarations);
    expect(root.name).toBe("career_outcome_valence_feedback_admission_declarations");
    expect(root.columns.map(column => column.name)).toEqual(rootColumns);
    expect(getTableConfig(schema.careerOutcomeValenceFeedbackAdmissionDeclarationSubjects).name)
      .toBe("career_outcome_valence_feedback_admission_declaration_subjects");
    expect(getTableConfig(schema.careerOutcomeValenceFeedbackAdmissionDeclarationEvidenceReferences).name)
      .toBe("career_outcome_valence_feedback_admission_declaration_evidence_references");
    expect(root.foreignKeys).toHaveLength(1);
    const predecessor = root.foreignKeys[0].reference();
    expect(predecessor.columns.map(column => column.name)).toEqual(["career_outcome_valence_declaration_id"]);
    expect(getTableConfig(predecessor.foreignTable).name).toBe("career_outcome_valence_declarations");
    expect(predecessor.foreignColumns.map(column => column.name)).toEqual(["career_outcome_valence_declaration_id"]);
    expect(root.foreignKeys[0].onDelete).toBe("restrict");
    expect(root.foreignKeys[0].onUpdate).toBe("restrict");
  });

  it("persists exact root/payload/children/COVD history, performs detached reread, and preserves genuine absence", async () => {
    const base = await ready();
    const value = declaration(base);
    await expect(base.admissions.persistCareerOutcomeValenceFeedbackAdmissionDeclaration(value)).resolves.toEqual(value);
    const first = await base.admissions.getCareerOutcomeValenceFeedbackAdmissionDeclarationById(value.careerOutcomeValenceFeedbackAdmissionDeclarationId);
    expect(first).toEqual(value);
    first.stateSubject.subjectRef = "local";
    await expect(base.admissions.getCareerOutcomeValenceFeedbackAdmissionDeclarationById(value.careerOutcomeValenceFeedbackAdmissionDeclarationId)).resolves.toEqual(value);
    await expect(base.admissions.getCareerOutcomeValenceFeedbackAdmissionDeclarationById(missing))
      .rejects.toThrow("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_ADMISSION_DECLARATION_NOT_FOUND");
  });

  it("is idempotent only for exact complete durable state including audit time, admission state, copied witnesses, and children", async () => {
    const base = await ready();
    const value = declaration(base);
    await base.admissions.persistCareerOutcomeValenceFeedbackAdmissionDeclaration(value);
    await expect(base.admissions.persistCareerOutcomeValenceFeedbackAdmissionDeclaration(value)).resolves.toEqual(value);
    for (const changed of [
      { ...value, createdAt: "2030-01-01T00:00:00.000Z" }, { ...value, admittedByActorId: "OTHER" },
      { ...value, admittedAt: "2027-02-08T02:00:00.000Z" }, { ...value, admissionState: "REJECTED" },
      { ...value, valence: "UNDESIRABLE" }, { ...value, operationDescription: "other" },
      { ...value, decisionSubjects: value.decisionSubjects.slice(0, 1) }, { ...value, admissionEvidenceRefs: ["evidence://other"] },
      { ...value, executionTarget: { targetKind: "SYSTEM", targetRef: "target://other" } },
      { ...value, beforeObservation: { observationState: "OBSERVED", value: "other-before" } },
    ]) await expect(base.admissions.persistCareerOutcomeValenceFeedbackAdmissionDeclaration(changed)).rejects
      .toThrow("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_ADMISSION_DECLARATION_IMMUTABLE_CONFLICT");
  });

  it("fails closed for physical/payload/child/identity/COVD corruption without translating found roots to absence", async () => {
    const base = await ready();
    const value = declaration(base);
    const id = value.careerOutcomeValenceFeedbackAdmissionDeclarationId;
    await base.admissions.persistCareerOutcomeValenceFeedbackAdmissionDeclaration(value);
    await rollback(base, async (transaction, graph) => {
      await transaction.execute(drizzleSql.raw(`UPDATE career_outcome_valence_feedback_admission_declarations SET admitted_by_actor_id='BROKEN' WHERE career_outcome_valence_feedback_admission_declaration_id='${id}'`));
      await expect(graph.admissions.getCareerOutcomeValenceFeedbackAdmissionDeclarationById(id))
        .rejects.toThrow("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_ADMISSION_DECLARATION_PERSISTENCE_FAILED");
    });
  });

  it("requires exact COVD copied witnesses and admission chronology but never re-evaluates EAGR or DAR after AOC time", async () => {
    const base = await ready();
    const value = declaration(base);
    expect(value.admittedAt >= base.value.outcomeValenceDeclaration.declaredAt).toBe(true);
    expect(base.value.occurrence.occurredAt < base.value.grant.effectiveUntil!).toBe(true);
    expect(base.value.stateChangeDeclaration.observedAt > base.value.grant.effectiveUntil!).toBe(true);
    expect(base.value.associationDeclaration.declaredAt > base.value.grant.effectiveUntil!).toBe(true);
    expect(base.value.outcomeRoleDeclaration.declaredAt > base.value.grant.effectiveUntil!).toBe(true);
    expect(base.value.outcomeValenceDeclaration.declaredAt > base.value.grant.effectiveUntil!).toBe(true);
    expect(value.admittedAt > base.value.grant.effectiveUntil!).toBe(true);
    await expect(base.admissions.persistCareerOutcomeValenceFeedbackAdmissionDeclaration(value)).resolves.toEqual(value);
    for (const changed of [
      { ...value, careerOutcomeValenceDeclarationId: "COVD_00000000000000000000000000000000" },
      { ...value, careerOutcomeRoleDeclarationId: "CORD_00000000000000000000000000000000" },
      { ...value, outcomeValenceDeclaredByActorId: "OTHER" }, { ...value, associationDeclaredByActorId: "OTHER" },
      { ...value, valence: "NEUTRAL" }, { ...value, admittedAt: "2027-02-07T00:59:59.999Z" },
    ]) await expect(base.admissions.persistCareerOutcomeValenceFeedbackAdmissionDeclaration(changed)).rejects.toThrow();
  });

  it("atomically rolls back deterministic root, subject, and evidence write failures before exact retry", async () => {
    const base = await ready();
    const tables = [
      "career_outcome_valence_feedback_admission_declarations",
      "career_outcome_valence_feedback_admission_declaration_subjects",
      "career_outcome_valence_feedback_admission_declaration_evidence_references",
    ] as const;
    for (const table of tables) {
      const value = declaration(base);
      const suffix = String(++unique);
      const fn = `fail_covfad_${suffix}`;
      const trigger = `trigger_covfad_${suffix}`;
      await base.first.sql.unsafe(`CREATE FUNCTION ${fn}() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'injected'; END; $$`);
      await base.first.sql.unsafe(`CREATE TRIGGER ${trigger} BEFORE INSERT ON ${table} FOR EACH ROW EXECUTE FUNCTION ${fn}()`);
      await expect(base.admissions.persistCareerOutcomeValenceFeedbackAdmissionDeclaration(value))
        .rejects.toThrow("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_ADMISSION_DECLARATION_PERSISTENCE_FAILED");
      for (const durable of tables) {
        const rows = await base.first.sql.unsafe(`SELECT count(*)::int AS count FROM ${durable} WHERE career_outcome_valence_feedback_admission_declaration_id='${value.careerOutcomeValenceFeedbackAdmissionDeclarationId}'`);
        expect(Number(rows[0].count)).toBe(0);
      }
      await base.first.sql.unsafe(`DROP TRIGGER ${trigger} ON ${table}`);
      await base.first.sql.unsafe(`DROP FUNCTION ${fn}()`);
      await expect(base.admissions.persistCareerOutcomeValenceFeedbackAdmissionDeclaration(value)).resolves.toEqual(value);
    }
  });

  it("requires mandatory post-commit exact reread and exposes no mutable, current, target, delivery, evaluation, learning, or causal surface", async () => {
    const base = await ready();
    const surface = Object.getOwnPropertyNames(Object.getPrototypeOf(base.admissions));
    expect(surface).toEqual(expect.arrayContaining([
      "getCareerOutcomeValenceFeedbackAdmissionDeclarationById",
      "persistCareerOutcomeValenceFeedbackAdmissionDeclaration",
    ]));
    expect(surface).not.toEqual(expect.arrayContaining([
      "getCurrentCareerOutcomeValenceFeedbackAdmissionDeclaration", "getLatestCareerOutcomeValenceFeedbackAdmissionDeclaration",
      "getHeadCareerOutcomeValenceFeedbackAdmissionDeclaration", "updateCareerOutcomeValenceFeedbackAdmissionDeclaration",
      "repairCareerOutcomeValenceFeedbackAdmissionDeclaration", "replaceCareerOutcomeValenceFeedbackAdmissionDeclaration",
      "supersedeCareerOutcomeValenceFeedbackAdmissionDeclaration", "regenerateCareerOutcomeValenceFeedbackAdmissionDeclaration",
      "verifyCareerOutcomeValenceFeedbackAdmission", "evaluateCareerOutcomeValenceFeedbackAdmission",
      "deliverCareerOutcomeValenceFeedbackAdmission", "receiveCareerOutcomeValenceFeedbackAdmission",
      "consumeCareerOutcomeValenceFeedbackAdmission", "incorporateCareerOutcomeValenceFeedbackAdmission",
      "materializeCareerOutcomeValenceFeedbackAdmission", "targetCareerOutcomeValenceFeedbackAdmission",
      "bindCareerOutcomeValenceFeedbackAdmission", "createLearning", "attributeCareerOutcomeValenceFeedbackAdmission",
    ]));
  });
});
