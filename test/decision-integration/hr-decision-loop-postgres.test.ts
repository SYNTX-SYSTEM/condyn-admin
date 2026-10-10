import { requireTestDatabaseUrl, DISPOSABLE_TEST_DATABASE_PATTERN } from "../../lib/database-isolation/policy";
import { createDisposableTestDatabaseNamed, dropDisposableTestDatabase, newDisposableTestDatabaseName } from "../../lib/database-isolation/verification";
import { randomBytes } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * Integrated HR Decision Looper proof on PostgreSQL (P0 extension, P6, inverse proof),
 * running G2 (R1, R2, R3) and G3 (R4, R5, R7) together in one freshly created database.
 * D1: the G3 HumanDecisionRecord is the only decision carrier; no G2 human decision artifact exists.
 */
const basis = new URL(requireTestDatabaseUrl());
const databaseName = newDisposableTestDatabaseName();
const databaseUrl = new URL(basis.toString()); databaseUrl.pathname = `/${databaseName}`;
const adminUrl = new URL(basis.toString()); adminUrl.pathname = "/postgres";
const stamp = "2026-10-09T00:00:00.000Z";
const later = "2026-10-09T01:00:00.000Z";
const forbidden = ["current", "latest", "head", "accepted", "authority", "verified", "loopClosed", "success"];

let admin: Sql;
let sql: Sql;
let lib: Awaited<ReturnType<typeof load>>;
let state: Record<string, any> = {};

async function load() {
  process.env.DATABASE_URL = databaseUrl.toString();
  const [registration, client, chain, humanDecision, decisionAuthority, decisionContext, decisionRecord, hrContext, localApi, g2Postgres, readerAdapter, bindingAdmission, bindingPersistence, binding, resolvers, authority, canonical] = await Promise.all([
    import("../../lib/persistence/unified-schema-registration"),
    import("../../lib/career/db/client"),
    import("./fixtures/postgres-career-chain"),
    import("../../lib/career/human-decision-admission/application"),
    import("../../lib/career/relation/decision-authority"),
    import("../../lib/career/relation/decision-context"),
    import("../../lib/career/relation/decision-record"),
    import("../../lib/hr-decision-context"),
    import("../../lib/decision-runtime/local/decision-context-api"),
    import("../../lib/decision-adapters/revision-persistence"),
    import("../../lib/decision-adapters/career-decision-context-binding"),
    import("../../lib/career/decision-context-decision-revision-binding-admission/application"),
    import("../../lib/career/relation-adapters/decision-context-decision-revision-binding-persistence"),
    import("../../lib/career/relation/decision-context-decision-revision-binding"),
    import("../../lib/decision-adapters/career-canonical"),
    import("../../lib/decision-core/authority"),
    import("../../lib/decision-runtime/local/career-canonical-producers"),
  ]);
  return { registration, client, chain, humanDecision, decisionAuthority, decisionContext, decisionRecord, hrContext, localApi, g2Postgres, readerAdapter, bindingAdmission, bindingPersistence, binding, resolvers, authority, canonical };
}

beforeAll(async () => {
  admin = postgres(adminUrl.toString(), { max: 1, onnotice: () => undefined });
  await createDisposableTestDatabaseNamed(basis.toString(), databaseName);
  sql = postgres(databaseUrl.toString(), { max: 2, onnotice: () => undefined });
  lib = await load();
}, 60_000);

afterAll(async () => {
  const [identity] = await sql`SELECT current_database() AS name` as unknown as Array<{ name: string }>;
  expect(identity.name).toBe(databaseName);
  expect(DISPOSABLE_TEST_DATABASE_PATTERN.test(databaseName)).toBe(true);
  await lib.client.closeDbConnection().catch(() => undefined);
  await sql.end({ timeout: 5 });
  await dropDisposableTestDatabase(databaseUrl.toString());
  expect(await admin.unsafe("SELECT 1 FROM pg_database WHERE datname = $1", [databaseName])).toHaveLength(0);
  await admin.end({ timeout: 5 });
}, 60_000);

describe("P0 integrated registration including the post-decision chain (R7)", () => {
  it("registers T11, the post-decision chain DAINT..COVFCR, DREV and DCDRB in FK order without a cross-field FK", async () => {
    const order = await lib.registration.registerUnifiedPersistenceSchema(sql);
    expect(order).toEqual(["CAREER_FIELD_SCHEMA", "CAREER_POST_DECISION_CHAIN", "DECISION_CORE_REVISIONS", "CAREER_DECISION_CONTEXT_DECISION_REVISION_BINDINGS"]);
    const tables = await lib.registration.listRegisteredTables(sql);
    // PostgreSQL truncates identifiers to 63 bytes (NAMEDATALEN); three sealed table names exceed it.
    expect(tables).toEqual(expect.arrayContaining(lib.registration.postDecisionChainTableNames.map((name: string) => name.slice(0, 63))));
    expect(lib.registration.postDecisionChainTableNames.filter((name: string) => name.length > 63)).toHaveLength(3);
    expect(lib.registration.postDecisionChainTableNames).toEqual(expect.arrayContaining([
      "career_decision_action_intents", "career_human_commitments", "career_execution_authority_grant_revisions",
      "career_execution_context_revisions", "career_action_occurrences", "career_state_change_declarations",
      "career_action_state_change_association_declarations", "career_outcome_role_declarations", "career_outcome_valence_declarations",
      "career_outcome_valence_feedback_admission_declarations", "career_outcome_valence_feedback_target_declarations",
      "career_outcome_valence_feedback_target_revision_bindings", "career_outcome_valence_feedback_context_revisions",
    ]));
    const order2 = lib.registration.postDecisionChainTableNames;
    expect(order2.indexOf("career_execution_authority_grant_revisions")).toBeLessThan(order2.indexOf("career_execution_context_revisions"));
    expect(order2.indexOf("career_execution_context_revisions")).toBeLessThan(order2.indexOf("career_action_occurrences"));
    await expect(lib.registration.assertNoCrossFieldForeignKeys(sql)).resolves.toBeUndefined();
    expect(await lib.registration.registerUnifiedPersistenceSchema(sql)).toEqual(order);
  }, 60_000);
});

describe("P6 HR decision boundary on PostgreSQL across both fields (D1, D4)", () => {
  beforeAll(async () => {
    const db = drizzle(sql);
    state.seeded = await lib.chain.seedCareerCanonicalChain(db as never, "DLLP6");
    state.dependencies = lib.humanDecision.createProductionHumanDecisionRecordDependencies(db as never);
    state.authority = lib.decisionAuthority.createDecisionAuthorityGrantRevision({
      grantorActorId: "GRANTOR_DLL", authorizedActorId: "DECIDER_DLL", authorityScope: "CAREER_RECOMMENDATION_DECISION",
      permittedDecisionClasses: ["ACCEPT_RECOMMENDATION", "DEFER_DECISION", "REJECT_RECOMMENDATION", "REQUEST_FURTHER_EVIDENCE", "REQUEST_TARGET_CLARIFICATION"],
      permittedSubjectKinds: ["RCP_ITEM"], authorityEvidenceRefs: ["evidence://grant/dll"],
      declaredAt: stamp, effectiveFrom: stamp, effectiveUntil: null, createdAt: stamp,
    });
    await state.dependencies.authorities.persistDecisionAuthorityGrantRevision(state.authority);
  }, 120_000);

  it("produces the DCTXREV through its production producer over the JSONB reread", async () => {
    const proposal = state.seeded.recommendationProposal;
    const subjects = proposal.items
      .filter((item: { recommendationDisposition: string }) => item.recommendationDisposition === "PROPOSED")
      .map((item: { sourceEvolutionInputItemOrdinal: number }) => ({ recommendationProposalId: proposal.recommendationProposalId, sourceEvolutionInputItemOrdinal: item.sourceEvolutionInputItemOrdinal }));
    expect(subjects.length).toBeGreaterThan(0);
    state.context = await lib.decisionContext.produceAndPersistCareerDecisionContextRevision({
      decisionAuthorityGrantRevisionId: state.authority.decisionAuthorityGrantRevisionId,
      recommendationProposalId: proposal.recommendationProposalId,
      decisionSubjects: subjects,
      contextEvidenceRefs: ["evidence://context/dll"],
      createdAt: stamp,
    }, { authorities: state.dependencies.authorities, proposals: state.dependencies.proposals, contexts: state.dependencies.contexts });
    expect(state.context.careerDecisionContextRevisionId).toMatch(/^DCTXREV_[0-9A-F]{32}$/);
    expect(lib.decisionContext.sameCareerDecisionContext(
      await state.dependencies.contexts.getCareerDecisionContextRevisionById(state.context.careerDecisionContextRevisionId), state.context)).toBe(true);
    const again = await lib.decisionContext.produceAndPersistCareerDecisionContextRevision({
      decisionAuthorityGrantRevisionId: state.authority.decisionAuthorityGrantRevisionId,
      recommendationProposalId: proposal.recommendationProposalId,
      decisionSubjects: subjects,
      contextEvidenceRefs: ["evidence://context/dll"],
      createdAt: stamp,
    }, { authorities: state.dependencies.authorities, proposals: state.dependencies.proposals, contexts: state.dependencies.contexts });
    expect(lib.decisionContext.sameCareerDecisionContext(again, state.context)).toBe(true);
  });

  it("creates the root DREV through the composed G2 application with every reference resolved by R1 on PostgreSQL", async () => {
    const seeded = state.seeded;
    const input = lib.hrContext.buildHrDecisionContextDraftInput({
      question: { statement: "Which recommendation subjects are operationalized?", actorId: "DECIDER_DLL" },
      sourceState: {
        verifiedCapabilitySnapshot: seeded.snapshot,
        recommendationProposal: seeded.recommendationProposal,
        evolutionInputState: seeded.evolutionInputState,
        tensionState: seeded.tensionState,
        roleRelation: seeded.roleRelation,
        targetRoleProfileRevision: seeded.profile,
        targetRequirementRevisions: [seeded.requirementA, seeded.requirementB],
      },
    });
    const application = await lib.localApi.createLocalDecisionContextHttpApplication();
    state.root = await application.createRootDecisionContext(input);
    expect(state.root.previousRevisionId).toBeNull();
    expect(await application.readDecisionContextRevision(state.root.revisionId)).toEqual(state.root);
    expect(JSON.stringify(state.root)).not.toContain("DLLP6");
    expect(Object.keys(state.root).some(key => forbidden.includes(key))).toBe(false);
  });

  it("binds the produced DCTXREV to the root DREV and persists the binding immutably (R4)", async () => {
    const db = drizzle(sql);
    const revisions = new lib.g2Postgres.PostgresDecisionContextRevisionRepository(db as never);
    state.bindings = new lib.bindingPersistence.PostgresCareerDecisionContextDecisionRevisionBindingRepository(db as never);
    state.binding = await lib.bindingAdmission.bindAndPersistCareerDecisionContextDecisionRevision(
      { careerDecisionContextRevisionId: state.context.careerDecisionContextRevisionId, decisionContextRevisionId: state.root.revisionId, createdAt: later },
      { decisionContexts: state.dependencies.contexts, decisionRevisions: lib.readerAdapter.createGenericDecisionContextRevisionReader(revisions), bindings: state.bindings },
    );
    expect(state.binding.recommendationProposalWitness.artifactId).toBe(state.seeded.recommendationProposal.recommendationProposalId);
    expect(state.binding.recommendationProposalWitness.locator).toBe(state.seeded.recommendationProposal.recommendationProposalId);
    const replayDependencies = { bindings: state.bindings, decisionContexts: state.dependencies.contexts, decisionRevisions: lib.readerAdapter.createGenericDecisionContextRevisionReader(revisions), authorities: state.dependencies.authorities, proposals: state.dependencies.proposals };
    const id = state.binding.careerDecisionContextDecisionRevisionBindingId;
    expect(await lib.binding.semanticReplayCareerDecisionContextDecisionRevisionBinding(id, replayDependencies)).toEqual(state.binding);
    expect(await lib.binding.derivationReplayCareerDecisionContextDecisionRevisionBinding(id, replayDependencies)).toEqual(state.binding);
  });

  it("admits exactly one DCR as the HR decision carrier and rejects declarant and window violations (D1)", async () => {
    const base = { careerDecisionContextRevisionId: state.context.careerDecisionContextRevisionId, declarationClass: "ACCEPT_RECOMMENDATION" as const, declarationEvidenceRefs: ["evidence://decision/dll"], createdAt: later };
    await expect(lib.decisionRecord.produceAndPersistHumanDecisionRecord({ ...base, declarantActorId: "SOMEONE_ELSE", declaredAt: later }, state.dependencies))
      .rejects.toThrow(/ERR_HUMAN_DECISION_DECLARANT_MISMATCH/);
    await expect(lib.decisionRecord.produceAndPersistHumanDecisionRecord({ ...base, declarantActorId: "DECIDER_DLL", declaredAt: "2026-10-08T23:59:59.000Z" }, state.dependencies))
      .rejects.toThrow(/ERR_HUMAN_DECISION_AUTHORITY_NOT_APPLICABLE/);
    state.decision = await lib.decisionRecord.produceAndPersistHumanDecisionRecord({ ...base, declarantActorId: "DECIDER_DLL", declaredAt: later }, state.dependencies);
    expect(state.decision.humanDecisionRecordId).toMatch(/^DCR_[0-9A-F]{32}$/);
    expect(state.decision.careerDecisionContextRevisionId).toBe(state.context.careerDecisionContextRevisionId);
    const [records] = await sql.unsafe(`SELECT count(*)::int AS count FROM human_decision_records`) as unknown as Array<{ count: number }>;
    expect(records.count).toBe(1);
    const revisions = await sql.unsafe(`SELECT payload->>'artifactKind' AS kind FROM decision_context_revisions`) as unknown as Array<{ kind: string }>;
    expect(revisions.every(row => row.kind === "DECISION_CONTEXT_REVISION")).toBe(true);
    expect(JSON.stringify(state.decision)).not.toMatch(/HUMAN_DECISION_DECLARATION|DHDEC_/);
  });

  it("walks the inverse path DCR to DCTXREV to DCDRB to DREV to resolved upstream state in a fresh client by exact ids only", async () => {
    const fresh = postgres(databaseUrl.toString(), { max: 1, onnotice: () => undefined });
    try {
      const db = drizzle(fresh);
      const dependencies = lib.humanDecision.createProductionHumanDecisionRecordDependencies(db as never);
      const record = await dependencies.records.getHumanDecisionRecordById(state.decision.humanDecisionRecordId);
      expect(record).toEqual(state.decision);
      const context = await dependencies.contexts.getCareerDecisionContextRevisionById(record!.careerDecisionContextRevisionId);
      expect(lib.decisionContext.sameCareerDecisionContext(context, state.context)).toBe(true);
      const rows = await fresh.unsafe(
        `SELECT career_decision_context_decision_revision_binding_id AS id FROM career_decision_context_decision_revision_bindings WHERE career_decision_context_revision_id = $1`,
        [context!.careerDecisionContextRevisionId],
      ) as unknown as Array<{ id: string }>;
      expect(rows.map(row => row.id)).toEqual([state.binding.careerDecisionContextDecisionRevisionBindingId]);
      const bindings = new lib.bindingPersistence.PostgresCareerDecisionContextDecisionRevisionBindingRepository(db as never);
      const binding = await bindings.getCareerDecisionContextDecisionRevisionBindingById(rows[0].id);
      const revision = await new lib.g2Postgres.PostgresDecisionContextRevisionRepository(db as never).getRevisionById(binding!.decisionContextRevision.revisionId);
      expect(revision).toEqual(state.root);
      const reader = lib.authority.createBoundAuthoritativeStateReader(lib.resolvers.createCareerCanonicalAuthoritativeStateResolvers(lib.canonical.createLocalCareerCanonicalProducerRepositories(db as never)));
      const careerReferences = revision!.context.sourceStateReferences.filter((reference: { producerId: string }) => reference.producerId === lib.resolvers.CAREER_CANONICAL_PRODUCER_ID);
      expect(careerReferences.length).toBeGreaterThan(0);
      for (const reference of careerReferences) {
        const resolution = await reader.resolve(reference);
        expect(resolution.reference).toEqual(reference);
      }
      expect(binding!.recommendationProposalWitness.artifactId).toBe(record!.recommendationProposalId);
    } finally {
      await fresh.end({ timeout: 5 });
    }
  });
});
