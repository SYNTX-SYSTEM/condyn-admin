import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import postgres, { type Sql } from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * Vertical integration proof for relations R4, R5 and R7 under decisions D1 to D5.
 * Runs entirely in one freshly created PostgreSQL database that is dropped at the
 * end; the shared development database is never touched. Stage names follow
 * docs/architecture/decision-fields/VERTICAL_INTEGRATION_PROOF.md.
 */
const basis = new URL(process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/condyn");
const databaseName = `condyn_g3b_${randomBytes(8).toString("hex")}`;
const databaseUrl = new URL(basis.toString()); databaseUrl.pathname = `/${databaseName}`;
const adminUrl = new URL(basis.toString()); adminUrl.pathname = "/postgres";
const forbidden = ["current", "latest", "head", "accepted", "authority", "verified", "loopClosed", "success"];
const createdAt = "2027-02-01T02:00:00.000Z";

let admin: Sql;
let sql: Sql;
let lib: Awaited<ReturnType<typeof loadLibraries>>;
let graph: Awaited<ReturnType<typeof lib.t12a.readyT12AHistoricalGraph>>;

async function loadLibraries() {
  // Environment is fixed before any module that reads DATABASE_URL at import time is loaded.
  process.env.DATABASE_URL = databaseUrl.toString();
  const [registration, t12a, t12j, binding, bindingPersistence, admission, adapter, authority, g2Revisions, g2Context, g2Assembly, g2Postgres, g2Claims, g2StateChange, g2Association, g2Attribution, g2Observation, contextRelation] = await Promise.all([
    import("../../lib/persistence/unified-schema-registration"),
    import("../career/relation/action-intent/t12a-historical-fixture"),
    import("../career/relation/outcome-valence-feedback-admission-declaration/t12j-historical-fixture"),
    import("../../lib/career/relation/decision-context-decision-revision-binding"),
    import("../../lib/career/relation-adapters/decision-context-decision-revision-binding-persistence"),
    import("../../lib/career/decision-context-decision-revision-binding-admission/application"),
    import("../../lib/decision-adapters/career-decision-context-binding"),
    import("../../lib/career/canonical-authority"),
    import("../../lib/decision-core/revisions"),
    import("../../lib/decision-core/context"),
    import("../../lib/decision-core/validation-assembly"),
    import("../../lib/decision-adapters/revision-persistence"),
    import("../../lib/decision-core/action-occurrence-claim"),
    import("../../lib/decision-core/state-change-claim"),
    import("../../lib/decision-core/action-state-change-association"),
    import("../../lib/decision-core/outcome-attribution-proposal"),
    import("../../lib/decision-core/context-observation-proposal"),
    import("../../lib/career/relation/decision-context"),
  ]);
  return { registration, t12a, t12j, binding, bindingPersistence, admission, adapter, authority, g2Revisions, g2Context, g2Assembly, g2Postgres, g2Claims, g2StateChange, g2Association, g2Attribution, g2Observation, contextRelation };
}

function genericRootRevision(proposal: any, context: any) {
  const witness = lib.authority.careerRecommendationProposalReference(proposal);
  const draft = lib.g2Context.createDecisionContextDraft({
    sourceStateReferences: [witness],
    items: [
      { role: "DECISION_QUESTION", statement: "Which exact recommendation subjects are operationalized?", provenance: { origin: "HUMAN_INPUT", actorId: "DECIDER_T12A" } },
      ...context.decisionSubjects.map((subject: { sourceEvolutionInputItemOrdinal: number }) => ({
        role: "OPTION" as const,
        statement: `Recommendation proposal item ${subject.sourceEvolutionInputItemOrdinal}`,
        provenance: { origin: "AUTHORITATIVE_STATE" as const, stateReference: { ...witness } },
      })),
    ],
  });
  const validationInput = { expectationValidations: [], consequenceValidations: [] };
  const validationAssembly = lib.g2Assembly.assembleDecisionContextValidation(draft, validationInput);
  return { witness, revision: lib.g2Revisions.createDecisionContextRevision({ previousRevisionId: null, context: draft, validationInput, validationAssembly }) };
}

beforeAll(async () => {
  admin = postgres(adminUrl.toString(), { max: 1, onnotice: () => undefined });
  await admin.unsafe(`CREATE DATABASE "${databaseName}"`);
  sql = postgres(databaseUrl.toString(), { max: 2, onnotice: () => undefined });
  lib = await loadLibraries();
}, 60_000);

afterAll(async () => {
  // Identity is verified before anything is dropped: only the database this suite created may be removed.
  const [identity] = await sql`SELECT current_database() AS name` as unknown as Array<{ name: string }>;
  expect(identity.name).toBe(databaseName);
  expect(databaseName).not.toBe(basis.pathname.slice(1));
  await lib.t12a.closeT12AHistoricalFixture().catch(() => undefined);
  await sql.end({ timeout: 5 });
  await admin.unsafe("SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()", [databaseName]);
  await admin.unsafe(`DROP DATABASE IF EXISTS "${databaseName}"`);
  const remaining = await admin.unsafe("SELECT 1 FROM pg_database WHERE datname = $1", [databaseName]);
  expect(remaining).toHaveLength(0);
  await admin.end({ timeout: 5 });
}, 60_000);

describe("P0 unified startup registration order (R7)", () => {
  it("provisions both fields in one order in a fresh database, idempotently, with no cross-field foreign key", async () => {
    const order = await lib.registration.registerUnifiedPersistenceSchema(sql);
    expect(order).toEqual(["CAREER_FIELD_SCHEMA", "DECISION_CORE_REVISIONS", "CAREER_DECISION_CONTEXT_DECISION_REVISION_BINDINGS"]);
    const tables = await lib.registration.listRegisteredTables(sql);
    expect(tables).toEqual(expect.arrayContaining([
      "decision_context_revisions",
      "career_decision_context_revisions",
      "human_decision_records",
      "recommendation_proposals",
      "career_decision_context_decision_revision_bindings",
      "career_capability_snapshots",
      "career_analysis_jobs",
    ]));
    await expect(lib.registration.assertNoCrossFieldForeignKeys(sql)).resolves.toBeUndefined();
    const edges = await lib.registration.listForeignKeyEdges(sql);
    expect(edges.some(edge => edge.table === "career_decision_context_decision_revision_bindings" && edge.referencedTable === "career_decision_context_revisions")).toBe(true);
    const genericEdges = edges.filter(edge => edge.table === "decision_context_revisions" || edge.referencedTable === "decision_context_revisions");
    expect(genericEdges.every(edge => edge.table === "decision_context_revisions" && edge.referencedTable === "decision_context_revisions")).toBe(true);
    const again = await lib.registration.registerUnifiedPersistenceSchema(sql);
    expect(again).toEqual(order);
    expect(await lib.registration.listRegisteredTables(sql)).toEqual(tables);
  }, 60_000);

  it("detects a cross-field foreign key as a structural law violation (falsifier)", async () => {
    await sql.unsafe(`CREATE TABLE probe_cross_field (id TEXT PRIMARY KEY, revision_id TEXT REFERENCES decision_context_revisions(revision_id))`);
    try {
      await expect(lib.registration.assertNoCrossFieldForeignKeys(sql)).rejects.toThrow(/^ERR_PERSISTENCE_CROSS_FIELD_FOREIGN_KEY:/);
    } finally {
      await sql.unsafe(`DROP TABLE probe_cross_field`);
    }
    await expect(lib.registration.assertNoCrossFieldForeignKeys(sql)).resolves.toBeUndefined();
  });
});

describe("P4 DCTXREV to DREV binding over real PostgreSQL (R4, D4)", () => {
  let repositories: any;
  let bindings: any;
  let reader: any;
  let root: ReturnType<typeof genericRootRevision>;
  let binding: any;

  beforeAll(async () => {
    graph = await lib.t12a.readyT12AHistoricalGraph();
    await lib.registration.registerUnifiedPersistenceSchema(graph.first.sql);
    repositories = new lib.g2Postgres.PostgresDecisionContextRevisionRepository(graph.first.db);
    root = genericRootRevision(graph.proposal, graph.context);
    const persisted = await repositories.createDecisionContextRevisionPersister().persist(root.revision);
    expect(persisted).toEqual(root.revision);
    reader = lib.adapter.createGenericDecisionContextRevisionReader(repositories);
    bindings = new lib.bindingPersistence.PostgresCareerDecisionContextDecisionRevisionBindingRepository(graph.first.db);
  }, 60_000);

  it("admits, persists and rereads one exact binding whose witness names the DCTXREV proposal", async () => {
    binding = await lib.admission.bindAndPersistCareerDecisionContextDecisionRevision(
      { careerDecisionContextRevisionId: graph.context.careerDecisionContextRevisionId, decisionContextRevisionId: root.revision.revisionId, createdAt },
      { decisionContexts: graph.contexts, decisionRevisions: reader, bindings },
    );
    expect(binding.careerDecisionContextDecisionRevisionBindingId).toMatch(/^DCDRB_[0-9A-F]{32}$/);
    expect(binding.recommendationProposalWitness).toEqual(root.witness);
    expect(binding.recommendationProposalWitness.artifactId).toBe(graph.context.recommendationProposalId);
    expect(binding.decisionContextRevision).toEqual(root.revision);
    expect(Object.keys(binding).some(key => forbidden.includes(key))).toBe(false);
    const reread = await bindings.getCareerDecisionContextDecisionRevisionBindingById(binding.careerDecisionContextDecisionRevisionBindingId);
    expect(reread).toEqual(binding);
  });

  it("is idempotent for the same payload and raises an immutable conflict for a divergent payload", async () => {
    expect(await bindings.persistCareerDecisionContextDecisionRevisionBinding(structuredClone(binding))).toEqual(binding);
    const divergent = { ...structuredClone(binding), createdAt: "2027-02-01T02:00:01.000Z" };
    await expect(bindings.persistCareerDecisionContextDecisionRevisionBinding(divergent))
      .rejects.toThrow("ERR_CAREER_DECISION_CONTEXT_DECISION_REVISION_BINDING_IMMUTABLE_CONFLICT");
    const rows = await graph.first.sql.unsafe(`SELECT count(*)::int AS count FROM career_decision_context_decision_revision_bindings`) as unknown as Array<{ count: number }>;
    expect(rows[0].count).toBe(1);
  });

  it("replays BYTE, DERIVATION and SEMANTIC against the live repositories", async () => {
    const dependencies = { bindings, decisionContexts: graph.contexts, decisionRevisions: reader, authorities: graph.authorities, proposals: graph.proposals };
    const id = binding.careerDecisionContextDecisionRevisionBindingId;
    expect(await lib.binding.byteReplayCareerDecisionContextDecisionRevisionBinding(id, dependencies)).toEqual(binding);
    expect(await lib.binding.derivationReplayCareerDecisionContextDecisionRevisionBinding(id, dependencies)).toEqual(binding);
    expect(await lib.binding.semanticReplayCareerDecisionContextDecisionRevisionBinding(id, dependencies)).toEqual(binding);
  });

  it("rejects a tampered stored row as corruption, never as a new version (falsifier)", async () => {
    const id = binding.careerDecisionContextDecisionRevisionBindingId;
    await graph.first.sql.unsafe(`UPDATE career_decision_context_decision_revision_bindings SET created_at = '2027-02-01T09:00:00.000Z' WHERE career_decision_context_decision_revision_binding_id = $1`, [id]);
    await expect(bindings.getCareerDecisionContextDecisionRevisionBindingById(id)).rejects.toThrow("ERR_CAREER_DECISION_CONTEXT_DECISION_REVISION_BINDING_PERSISTENCE_FAILED");
    await graph.first.sql.unsafe(`UPDATE career_decision_context_decision_revision_bindings SET created_at = $2 WHERE career_decision_context_decision_revision_binding_id = $1`, [id, createdAt]);
    expect(await bindings.getCareerDecisionContextDecisionRevisionBindingById(id)).toEqual(binding);
  });

  it("refuses a DREV that does not witness the DCTXREV proposal and a reader that selects (falsifiers)", async () => {
    const foreign = lib.authority.careerCanonicalReference("RECOMMENDATION_PROPOSAL", `RCP_${"0".repeat(32)}`);
    const draft = lib.g2Context.createDecisionContextDraft({
      sourceStateReferences: [foreign],
      items: [{ role: "DECISION_QUESTION", statement: "Unrelated question", provenance: { origin: "HUMAN_INPUT", actorId: "DECIDER_T12A" } }],
    });
    const validationInput = { expectationValidations: [], consequenceValidations: [] };
    const unrelated = lib.g2Revisions.createDecisionContextRevision({ previousRevisionId: null, context: draft, validationInput, validationAssembly: lib.g2Assembly.assembleDecisionContextValidation(draft, validationInput) });
    await repositories.createDecisionContextRevisionPersister().persist(unrelated);
    await expect(lib.admission.bindAndPersistCareerDecisionContextDecisionRevision(
      { careerDecisionContextRevisionId: graph.context.careerDecisionContextRevisionId, decisionContextRevisionId: unrelated.revisionId, createdAt },
      { decisionContexts: graph.contexts, decisionRevisions: reader, bindings },
    )).rejects.toThrow("ERR_CAREER_DECISION_CONTEXT_DECISION_REVISION_BINDING_RECOMMENDATION_PROPOSAL_WITNESS_MISMATCH");
    await expect(reader.getDecisionContextRevisionById("latest")).rejects.toThrow("ERR_DECISION_ADAPTER_REVISION_READ_REFERENCE_INVALID");
    expect(await reader.getDecisionContextRevisionById(`DREV_${"F".repeat(24)}`)).toBeNull();
    expect(await lib.registration.assertNoCrossFieldForeignKeys(graph.first.sql)).toBeUndefined();
  });

  it("walks the inverse path from a fresh client by exact ids only (inverse proof)", async () => {
    const fresh = await lib.t12a.createT12AHistoricalClient();
    const freshGraph = lib.t12a.transactionScopedT12AHistoricalGraph(fresh.db, graph.evolution, graph.implementations);
    const freshBindings = new lib.bindingPersistence.PostgresCareerDecisionContextDecisionRevisionBindingRepository(fresh.db);
    const freshRevisions = new lib.g2Postgres.PostgresDecisionContextRevisionRepository(fresh.db);
    const rows = await fresh.sql.unsafe(
      `SELECT career_decision_context_revision_id, decision_context_revision_id, recommendation_proposal_id FROM career_decision_context_decision_revision_bindings WHERE career_decision_context_decision_revision_binding_id = $1`,
      [binding.careerDecisionContextDecisionRevisionBindingId],
    ) as unknown as Array<Record<string, string>>;
    expect(rows).toHaveLength(1);
    const stored = await freshBindings.getCareerDecisionContextDecisionRevisionBindingById(binding.careerDecisionContextDecisionRevisionBindingId);
    expect(stored).toEqual(binding);
    const revision = await freshRevisions.getRevisionById(rows[0].decision_context_revision_id);
    expect(revision).toEqual(root.revision);
    const context = await freshGraph.contexts.getCareerDecisionContextRevisionById(rows[0].career_decision_context_revision_id);
    expect(context).toEqual(graph.context);
    const [authority, proposal] = await Promise.all([
      freshGraph.authorities.getDecisionAuthorityGrantRevisionById(context!.decisionAuthorityGrantRevisionId),
      freshGraph.proposals.getRecommendationProposalById(context!.recommendationProposalId),
    ]);
    expect(() => lib.contextRelation.assertCareerDecisionContextWitnesses(context!, authority!, proposal!)).not.toThrow();
    expect(proposal!.recommendationProposalId).toBe(rows[0].recommendation_proposal_id);
    expect(revision!.context.sourceStateReferences.map((reference: { artifactId: string }) => reference.artifactId)).toContain(proposal!.recommendationProposalId);
    const decisionRecord = await freshGraph.records.getHumanDecisionRecordById(graph.decisionRecord.humanDecisionRecordId);
    expect(decisionRecord!.careerDecisionContextRevisionId).toBe(context!.careerDecisionContextRevisionId);
  });
});

describe("P5 claims and provenance from G3 declarations (R5, D2)", () => {
  it("constructs 8B/8C1 claims and 8C2/8C3/8D1 provenance from exact declaration references without any resolver", () => {
    const t12j = lib.t12j.createT12JHistoricalFixture();
    const aoc = lib.authority.careerActionOccurrenceReference(t12j.occurrence);
    const scd = lib.authority.careerStateChangeDeclarationReference(t12j.stateChangeDeclaration);
    const ascad = lib.authority.careerActionStateChangeAssociationDeclarationReference(t12j.associationDeclaration);
    const cord = lib.authority.careerOutcomeRoleDeclarationReference(t12j.outcomeRoleDeclaration);
    const covd = lib.authority.careerOutcomeValenceDeclarationReference(t12j.outcomeValenceDeclaration);
    const occurrenceClaim = lib.g2Claims.createActionOccurrenceClaim({ source: { origin: "AUTHORITATIVE_STATE", stateReference: aoc }, operationDescription: t12j.occurrence.operationDescription });
    const stateChangeClaim = lib.g2StateChange.createStateChangeClaim({ source: { origin: "AUTHORITATIVE_STATE", stateReference: scd }, stateChangeDescription: `${t12j.stateChangeDeclaration.stateDimension} changed` });
    expect(occurrenceClaim.source).toEqual({ origin: "AUTHORITATIVE_STATE", stateReference: aoc });
    expect(stateChangeClaim.source).toEqual({ origin: "AUTHORITATIVE_STATE", stateReference: scd });
    const association = lib.g2Association.createActionStateChangeAssociationProposal({ actionOccurrenceClaim: occurrenceClaim, stateChangeClaim, provenance: { origin: "AUTHORITATIVE_STATE", stateReference: ascad } });
    const attribution = lib.g2Attribution.createOutcomeAttributionProposal({ associationProposal: association, provenance: { origin: "AUTHORITATIVE_STATE", stateReference: cord } });
    const observation = lib.g2Observation.createDecisionContextObservationProposal({ outcomeAttributionProposal: attribution, statement: `Outcome valence declared ${t12j.outcomeValenceDeclaration.valence}`, provenance: { origin: "AUTHORITATIVE_STATE", stateReference: covd } });
    expect(association.provenance).toEqual({ origin: "AUTHORITATIVE_STATE", stateReference: ascad });
    expect(attribution.provenance).toEqual({ origin: "AUTHORITATIVE_STATE", stateReference: cord });
    expect(observation.provenance).toEqual({ origin: "AUTHORITATIVE_STATE", stateReference: covd });
    for (const artifact of [occurrenceClaim, stateChangeClaim, association, attribution, observation]) {
      expect(Object.keys(artifact).some(key => forbidden.includes(key))).toBe(false);
    }
    expect(lib.g2Claims.createActionOccurrenceClaim.length).toBe(1);
    expect(lib.g2StateChange.createStateChangeClaim.length).toBe(1);
    for (const file of ["action-occurrence-claim", "state-change-claim", "action-state-change-association", "outcome-attribution-proposal", "context-observation-proposal"]) {
      const source = readFileSync(resolve(process.cwd(), `lib/decision-core/${file}/contract.ts`), "utf8");
      expect(source).not.toMatch(/createBoundAuthoritativeStateReader|\.resolve\(|repository|career/);
    }
  });

  it("returns an observation into a child DREV with exact COVD provenance while the root stays untouched (D2)", async () => {
    const t12j = lib.t12j.createT12JHistoricalFixture();
    const covd = lib.authority.careerOutcomeValenceDeclarationReference(t12j.outcomeValenceDeclaration);
    const repositories = new lib.g2Postgres.PostgresDecisionContextRevisionRepository(graph.first.db);
    const root = genericRootRevision(graph.proposal, graph.context);
    const draft = lib.g2Context.createDecisionContextDraft({
      sourceStateReferences: [root.witness, covd],
      items: [
        ...root.revision.context.items.map((item: any) => ({ role: item.role, statement: item.statement, provenance: item.provenance })),
        { role: "OBSERVATION", statement: `Outcome valence declared ${t12j.outcomeValenceDeclaration.valence}`, provenance: { origin: "AUTHORITATIVE_STATE", stateReference: covd } },
      ],
    });
    const validationInput = { expectationValidations: [], consequenceValidations: [] };
    const child = lib.g2Revisions.createDecisionContextRevision({ previousRevisionId: root.revision.revisionId, context: draft, validationInput, validationAssembly: lib.g2Assembly.assembleDecisionContextValidation(draft, validationInput) });
    const persisted = await repositories.createDecisionContextRevisionPersister().persist(child);
    expect(persisted.previousRevisionId).toBe(root.revision.revisionId);
    expect(await repositories.getRevisionById(root.revision.revisionId)).toEqual(root.revision);
    const observation = persisted.context.items.find((item: { role: string }) => item.role === "OBSERVATION");
    expect(observation?.provenance).toEqual({ origin: "AUTHORITATIVE_STATE", stateReference: covd });
    expect(covd.authorityContractId).toBe("CAREER_OUTCOME_VALENCE_DECLARATION_V1");
    expect(Object.keys(persisted).some(key => forbidden.includes(key))).toBe(false);
  });
});
