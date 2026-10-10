import { requireTestDatabaseUrl, DISPOSABLE_TEST_DATABASE_PATTERN } from "../../lib/database-isolation/policy";
import { createDisposableTestDatabaseNamed, dropDisposableTestDatabase, newDisposableTestDatabaseName } from "../../lib/database-isolation/verification";
import { randomBytes } from "node:crypto";
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:net";
import { resolve } from "node:path";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createActionOccurrenceClaim,
  createActionStateChangeAssociationProposal,
  createBoundAuthoritativeStateReader,
  createBoundDecisionContextObservationRevisionPersister,
  createBoundDecisionContextObservationTargetRevisionBinder,
  createBoundDecisionContextRevisionLineageReconstructor,
  createDecisionContextDraft,
  createDecisionContextObservationAdmissionDeclaration,
  createDecisionContextObservationContextTransition,
  createDecisionContextObservationContextValidationAssembly,
  createDecisionContextObservationItemMaterialization,
  createDecisionContextObservationItemProjection,
  createDecisionContextObservationMaterializationReadiness,
  createDecisionContextObservationProposal,
  createDecisionContextObservationRevisionCreation,
  createDecisionContextObservationTargetDeclaration,
  createDecisionContextRevision,
  assembleDecisionContextValidation,
  createOutcomeAttributionProposal,
  createStateChangeClaim,
  type AuthoritativeStateReference,
  type DecisionContextDraftInput,
  type DecisionContextRevision
} from "../../lib/decision-core";
import { PostgresDecisionContextRevisionRepository } from "../../lib/decision-adapters/revision-persistence";
import { createGenericDecisionContextRevisionReader } from "../../lib/decision-adapters/career-decision-context-binding";
import { CAREER_CANONICAL_FAMILIES, CAREER_CANONICAL_PRODUCER_ID, createCareerCanonicalAuthoritativeStateResolvers, type CareerCanonicalFamily } from "../../lib/decision-adapters/career-canonical";
import { createLocalCareerCanonicalProducerRepositories } from "../../lib/decision-runtime/local/career-canonical-producers";
import { buildHrDecisionContextDraftInput } from "../../lib/hr-decision-context";
import { registerUnifiedPersistenceSchema, assertNoCrossFieldForeignKeys } from "../../lib/persistence/unified-schema-registration";
import { bindAndPersistCareerDecisionContextDecisionRevision } from "../../lib/career/decision-context-decision-revision-binding-admission/application";
import { createCareerDecisionActionIntent } from "../../lib/career/relation/action-intent";
import { createCareerActionOccurrence } from "../../lib/career/relation/action-occurrence";
import { createCareerActionStateChangeAssociationDeclaration } from "../../lib/career/relation/action-state-change-association-declaration";
import { createDecisionAuthorityGrantRevision } from "../../lib/career/relation/decision-authority";
import { createCareerDecisionContextRevision } from "../../lib/career/relation/decision-context";
import { createHumanDecisionRecord, type HumanDecisionDeclarationClass } from "../../lib/career/relation/decision-record";
import { createCareerExecutionAuthorityGrantRevision } from "../../lib/career/relation/execution-authority-grant";
import { createCareerExecutionContextRevision } from "../../lib/career/relation/execution-context-revision";
import { createCareerHumanCommitment } from "../../lib/career/relation/human-commitment";
import { createCareerOutcomeRoleDeclaration } from "../../lib/career/relation/outcome-role-declaration";
import { createCareerOutcomeValenceDeclaration, type CareerOutcomeValence } from "../../lib/career/relation/outcome-valence-declaration";
import { createCareerStateChangeDeclaration } from "../../lib/career/relation/state-change-declaration";
import { careerDecisionChainRepositories } from "./fixtures/postgres-decision-chain";
import { provisionPostDecisionTables } from "./fixtures/postgres-post-decision-schema";
import { seedCareerCanonicalChain, type SeededCareerCanonicalChain } from "./fixtures/postgres-career-chain";

/**
 * P7 of docs/architecture/decision-fields/VERTICAL_INTEGRATION_PROOF.md over the combined
 * G2/G3 HR Decision Looper: root DREV over the real local HTTP path (R1, R2, R3) → DCTXREV
 * bound to that exact DREV (R4) → full G3 decision and execution chain over PostgreSQL (P6)
 * → 8B/8C1 claims from AOC and SCD, 8C2/8C3/8D1 provenance (R5) → return into a child DREV
 * → lineage reconstruction; inverse walk in a second process by exact ids only.
 */

const forbiddenKeys = ["current", "head", "latest", "accepted", "authority", "verified", "loopClosed", "success"];
const databaseBasis = requireTestDatabaseUrl();
const basisName = new URL(databaseBasis).pathname.slice(1);
const databaseName = newDisposableTestDatabaseName();
const sentinel = `P7SENTINEL${randomBytes(6).toString("hex").toUpperCase()}`;
const databaseUrl = new URL(databaseBasis); databaseUrl.pathname = `/${databaseName}`;
const administrativeUrl = new URL(databaseBasis); administrativeUrl.pathname = "/postgres";
const decider = "HR_DECIDER_P7";
const executor = "EXECUTOR_P7";
const reference = (family: CareerCanonicalFamily, artifactId: string): AuthoritativeStateReference => ({ producerId: CAREER_CANONICAL_PRODUCER_ID, authorityContractId: CAREER_CANONICAL_FAMILIES[family].authorityContractId, artifactId, locator: artifactId });
const forbiddenPaths = (value: unknown, path: string[] = []): string[] => value !== null && typeof value === "object" ? Object.entries(value as Record<string, unknown>).flatMap(([key, child]) => [...(forbiddenKeys.includes(key) ? [[...path, key].join(".")] : []), ...forbiddenPaths(child, [...path, key])]) : [];
const delay = (milliseconds: number) => new Promise<void>((done) => setTimeout(done, milliseconds));

let administrativeClient: Sql;
let databaseClient: Sql;
let db: PostgresJsDatabase;
let seeded: SeededCareerCanonicalChain;
let server: ChildProcess | undefined;
let port: number;
let serverOutput = "";
let producers: ReturnType<typeof createLocalCareerCanonicalProducerRepositories>;
let chain: ReturnType<typeof careerDecisionChainRepositories>;
let revisions: PostgresDecisionContextRevisionRepository;

const walked: Record<string, string> = {};
let rootRevision: DecisionContextRevision;
let childRevision: DecisionContextRevision;
let rootInput: DecisionContextDraftInput;

async function availablePort(): Promise<number> {
  const listener = createServer();
  await new Promise<void>((ok, bad) => { listener.once("error", bad); listener.listen(0, "127.0.0.1", () => ok()); });
  const address = listener.address();
  if (address === null || typeof address === "string") throw new Error("P7 did not receive a TCP port.");
  await new Promise<void>((ok, bad) => listener.close((error) => error === undefined ? ok() : bad(error)));
  return address.port;
}
async function waitForDecisionEndpoint(): Promise<void> {
  const url = `http://127.0.0.1:${port}/api/decision-contexts/DREV_P7_READINESS_ABSENT`;
  for (let attempt = 0; attempt < 120; attempt += 1) {
    try { const response = await fetch(url); if (response.status === 404) return; } catch { /* not ready */ }
    await delay(250);
  }
  throw new Error(`P7 Next server did not reach the Decision endpoint. Output:\n${serverOutput}`);
}
async function stopServer(): Promise<void> {
  if (server === undefined || server.exitCode !== null || server.signalCode !== null) return;
  server.kill("SIGTERM");
  await Promise.race([once(server, "exit"), delay(10_000)]);
  if (server.exitCode === null && server.signalCode === null) { server.kill("SIGKILL"); await once(server, "exit"); }
}

beforeAll(async () => {
  expect(databaseName).not.toBe(basisName);
  administrativeClient = postgres(administrativeUrl.toString(), { max: 1, onnotice: () => undefined });
  await createDisposableTestDatabaseNamed(databaseBasis, databaseName);
  databaseClient = postgres(databaseUrl.toString(), { max: 2, onnotice: () => undefined });
  // P0 / R7: one startup registration order for both fields, then the post-decision tables the order does not cover yet.
  await registerUnifiedPersistenceSchema(databaseClient);
  await provisionPostDecisionTables(databaseClient);
  await assertNoCrossFieldForeignKeys(databaseClient);
  db = drizzle(databaseClient);
  seeded = await seedCareerCanonicalChain(db, sentinel);
  producers = createLocalCareerCanonicalProducerRepositories(db);
  chain = careerDecisionChainRepositories(db, seeded.repositories.proposals);
  revisions = new PostgresDecisionContextRevisionRepository(db);
  port = await availablePort();
  server = spawn(process.execPath, [resolve(process.cwd(), "node_modules/next/dist/bin/next"), "dev", "-p", String(port), "-H", "127.0.0.1"], {
    cwd: process.cwd(), env: { ...process.env, DATABASE_URL: databaseUrl.toString(), NEXT_TELEMETRY_DISABLED: "1" }, stdio: ["ignore", "pipe", "pipe"]
  });
  const append = (chunk: Buffer) => { serverOutput = `${serverOutput}${chunk.toString("utf8")}`.slice(-16_000); };
  server.stdout?.on("data", append);
  server.stderr?.on("data", append);
  await waitForDecisionEndpoint();
}, 180_000);

/** Cleanup is its own transition: identity of the dropped database and preservation of the basis database are proven. */
afterAll(async () => {
  await stopServer();
  if (databaseClient !== undefined) await databaseClient.end({ timeout: 5 });
  if (administrativeClient === undefined) return;
  try {
    const before = (await administrativeClient.unsafe("SELECT datname FROM pg_database WHERE datname = ANY($1::text[])", [[databaseName, basisName]])).map((row) => row.datname as string);
    expect(DISPOSABLE_TEST_DATABASE_PATTERN.test(databaseName)).toBe(true);
    await dropDisposableTestDatabase(databaseUrl.toString());
    const after = (await administrativeClient.unsafe("SELECT datname FROM pg_database WHERE datname = ANY($1::text[])", [[databaseName, basisName]])).map((row) => row.datname as string);
    expect(after).not.toContain(databaseName);
    expect(after.includes(basisName)).toBe(before.includes(basisName));
    console.info(`[P7 CLEANUP] dropped=${databaseName} before=${before.join(",")} after=${after.join(",")} basisPreserved=${after.includes(basisName)}`);
  } finally {
    await administrativeClient.end({ timeout: 5 });
  }
}, 60_000);

describe("P7 forward: root DREV to child DREV through the G3 chain", () => {
  it("creates the root DREV over the real local HTTP path from persisted G3 state (R1, R2, R3)", async () => {
    const r = seeded.repositories;
    rootInput = buildHrDecisionContextDraftInput({
      question: { statement: "Which proposed option should be pursued for this role?", actorId: decider },
      sourceState: {
        verifiedCapabilitySnapshot: (await r.capability.getSnapshotById(seeded.snapshot.snapshotId))!,
        recommendationProposal: (await r.proposals.getRecommendationProposalById(seeded.recommendationProposal.recommendationProposalId))!,
        evolutionInputState: (await r.evolutionInputs.getEvolutionInputStateById(seeded.evolutionInputState.evolutionInputStateId))!,
        tensionState: (await r.tensionStates.getTensionStateById(seeded.tensionState.tensionStateId))!,
        roleRelation: (await r.roleRelations.getRoleRelationById(seeded.roleRelation.roleRelationId))!,
        targetRoleProfileRevision: (await r.profile.getRevisionById(seeded.profile.targetRoleProfileRevisionId))!,
        targetRequirementRevisions: [(await r.requirement.getRevisionById(seeded.requirementA.targetRequirementRevisionId))!, (await r.requirement.getRevisionById(seeded.requirementB.targetRequirementRevisionId))!]
      }
    });
    const response = await fetch(`http://127.0.0.1:${port}/api/decision-contexts`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(rootInput) });
    expect(response.status).toBe(201);
    const body = await response.json() as { success: boolean; revision: DecisionContextRevision };
    rootRevision = body.revision;
    expect(rootRevision.previousRevisionId).toBeNull();
    expect(rootRevision.context).toEqual(createDecisionContextDraft(rootInput));
    expect(await revisions.getRevisionById(rootRevision.revisionId)).toEqual(rootRevision);
    expect(JSON.stringify(rootRevision)).not.toContain(sentinel);
    expect(forbiddenPaths(rootRevision)).toEqual([]);
    walked.rootRevisionId = rootRevision.revisionId;
    walked.rcp = seeded.recommendationProposal.recommendationProposalId;
  }, 60_000);

  it("binds a persisted DCTXREV to the exact root DREV through the reader-backed binder (R4, D4)", async () => {
    const proposal = seeded.recommendationProposal;
    const stamp = "2027-03-01T00:00:00.000Z";
    const authority = createDecisionAuthorityGrantRevision({ grantorActorId: "GRANTOR_P7", authorizedActorId: decider, authorityScope: "CAREER_RECOMMENDATION_DECISION", permittedDecisionClasses: ["ACCEPT_RECOMMENDATION", "DEFER_DECISION", "REJECT_RECOMMENDATION", "REQUEST_FURTHER_EVIDENCE", "REQUEST_TARGET_CLARIFICATION"], permittedSubjectKinds: ["RCP_ITEM"], authorityEvidenceRefs: ["evidence://grant/p7"], declaredAt: stamp, effectiveFrom: stamp, effectiveUntil: "2027-03-01T12:00:00.000Z", createdAt: stamp });
    await chain.authorities.persistDecisionAuthorityGrantRevision(authority);
    const subjects = proposal.items.filter((item) => item.recommendationDisposition === "PROPOSED").map((item) => ({ recommendationProposalId: proposal.recommendationProposalId, sourceEvolutionInputItemOrdinal: item.sourceEvolutionInputItemOrdinal }));
    const context = createCareerDecisionContextRevision(authority, proposal, { decisionAuthorityGrantRevisionId: authority.decisionAuthorityGrantRevisionId, recommendationProposalId: proposal.recommendationProposalId, decisionSubjects: subjects, contextEvidenceRefs: ["evidence://context/p7"], createdAt: stamp });
    expect(await chain.contexts.persistCareerDecisionContextRevision(context)).toEqual(context);
    const binding = await bindAndPersistCareerDecisionContextDecisionRevision(
      { careerDecisionContextRevisionId: context.careerDecisionContextRevisionId, decisionContextRevisionId: rootRevision.revisionId, createdAt: stamp },
      { decisionContexts: chain.contexts, decisionRevisions: createGenericDecisionContextRevisionReader(revisions), bindings: chain.bindings }
    );
    expect(binding.recommendationProposalWitness).toEqual(reference("RCP", proposal.recommendationProposalId));
    expect(binding.decisionContextRevision.revisionId).toBe(rootRevision.revisionId);
    expect(await chain.bindings.getCareerDecisionContextDecisionRevisionBindingById(binding.careerDecisionContextDecisionRevisionBindingId)).toEqual(binding);
    expect(forbiddenPaths(binding)).toEqual([]);
    walked.dar = authority.decisionAuthorityGrantRevisionId;
    walked.dctxrev = context.careerDecisionContextRevisionId;
    walked.binding = binding.careerDecisionContextDecisionRevisionBindingId;
    (globalThis as Record<string, unknown>).__p7 = { authority, context, proposal };
  }, 30_000);

  it("runs the HR decision path over PostgreSQL: DCR per admissible class, DAINT, HCOM, EAGR, ECTXREV, AOC, SCD, ASCAD, CORD, COVD for all four valences (P6)", async () => {
    const { authority, context, proposal } = (globalThis as Record<string, unknown>).__p7 as { authority: Parameters<typeof createHumanDecisionRecord>[1]; context: Parameters<typeof createHumanDecisionRecord>[0]; proposal: Parameters<typeof createHumanDecisionRecord>[2] };
    const declaredAt = "2027-03-01T01:00:00.000Z";
    const declaration = (declarationClass: HumanDecisionDeclarationClass, declarantActorId = decider, at = declaredAt) => createHumanDecisionRecord(context, authority, proposal, { careerDecisionContextRevisionId: context.careerDecisionContextRevisionId, declarantActorId, declarationClass, declaredAt: at, declarationEvidenceRefs: ["evidence://decision/p7"], createdAt: at });
    // The seeded subjects are semantic-uncertainty items (PAIR_NOT_EVALUATED, COMPOSITION_UNEVALUATED): ACCEPT, REJECT and DEFER are admissible;
    // the two REQUEST classes are admissible only for evidence or target codes and are refused here by the sealed T11C rule.
    const admissibleClasses: HumanDecisionDeclarationClass[] = ["ACCEPT_RECOMMENDATION", "REJECT_RECOMMENDATION", "DEFER_DECISION"];
    const admissible = admissibleClasses.map((declarationClass) => declaration(declarationClass));
    expect(new Set(admissible.map((record) => record.humanDecisionRecordId)).size).toBe(3);
    for (const refused of ["REQUEST_FURTHER_EVIDENCE", "REQUEST_TARGET_CLARIFICATION"] as const) expect(() => declaration(refused)).toThrow("ERR_HUMAN_DECISION_SUBJECT_NOT_ADMISSIBLE");
    expect(() => declaration("ACCEPT_RECOMMENDATION", "INTRUDER_P7")).toThrow("ERR_HUMAN_DECISION_DECLARANT_MISMATCH");
    expect(() => declaration("ACCEPT_RECOMMENDATION", decider, "2027-03-02T00:00:00.000Z")).toThrow("ERR_HUMAN_DECISION_AUTHORITY_NOT_APPLICABLE");
    const record = admissible[0];
    expect(await chain.records.persistHumanDecisionRecord(record)).toEqual(record);

    const intentAt = "2027-03-02T00:00:00.000Z";
    const intent = createCareerDecisionActionIntent(record, { humanDecisionRecordId: record.humanDecisionRecordId, declaredByActorId: decider, actionIntentClass: "RECOMMENDATION_OPERATIONALIZATION", operationDescription: "Operationalize the proposed subjects", declaredAt: intentAt, actionIntentEvidenceRefs: ["evidence://intent/p7"], createdAt: intentAt });
    expect(await chain.intents.persistCareerDecisionActionIntent(intent)).toEqual(intent);
    const commitAt = "2027-03-03T00:00:00.000Z";
    const commitment = createCareerHumanCommitment(intent, { careerDecisionActionIntentId: intent.careerDecisionActionIntentId, committedByActorId: decider, committedAt: commitAt, commitmentEvidenceRefs: ["evidence://commitment/p7"], createdAt: commitAt });
    expect(await chain.commitments.persistCareerHumanCommitment(commitment)).toEqual(commitment);
    const grant = createCareerExecutionAuthorityGrantRevision(commitment, { careerHumanCommitmentId: commitment.careerHumanCommitmentId, grantorActorId: "GRANTOR_P7", authorizedExecutionActorId: executor, executionAuthorityScope: "RECOMMENDATION_OPERATION_EXECUTION", permittedTargetKinds: ["PERSON", "SYSTEM"], permittedChannelKinds: ["EMAIL", "MESSAGE"], authorityEvidenceRefs: ["evidence://authority/p7"], declaredAt: commitAt, effectiveFrom: commitAt, effectiveUntil: "2027-03-04T00:00:00.000Z", createdAt: commitAt });
    expect(await chain.executionGrants.persistCareerExecutionAuthorityGrantRevision(grant)).toEqual(grant);
    const executionContext = createCareerExecutionContextRevision(grant, { careerExecutionAuthorityGrantRevisionId: grant.careerExecutionAuthorityGrantRevisionId, declaredByActorId: executor, executionTarget: { targetKind: "PERSON", targetRef: "target://person/p7/1" }, executionChannel: { channelKind: "EMAIL", channelRef: "channel://email/p7/1" }, declaredAt: commitAt, contextEvidenceRefs: ["evidence://execution-context/p7"], createdAt: commitAt });
    expect(await chain.executionContexts.persistCareerExecutionContextRevision(executionContext)).toEqual(executionContext);
    const occurredAt = "2027-03-03T01:00:00.000Z";
    const occurrence = createCareerActionOccurrence(executionContext, { careerExecutionContextRevisionId: executionContext.careerExecutionContextRevisionId, performedByActorId: executor, occurredAt, occurrenceEvidenceRefs: ["evidence://occurrence/p7"], externalOccurrenceRef: "external://occurrence/p7/1", createdAt: "2027-03-03T01:00:01.000Z" });
    expect(await chain.occurrences.persistCareerActionOccurrence(occurrence)).toEqual(occurrence);
    const observedAt = "2027-03-04T01:00:00.000Z";
    const stateChange = createCareerStateChangeDeclaration(occurrence, { careerActionOccurrenceId: occurrence.careerActionOccurrenceId, observedByActorId: "OBSERVER_P7", stateSubject: { subjectKind: "EXTERNAL_RESOURCE", subjectRef: "state://application/p7/1" }, stateDimension: "application-status", beforeObservation: { observationState: "OBSERVED", value: "applied" }, afterObservation: { observationState: "OBSERVED", value: "interview-invited" }, observedAt, stateChangeEvidenceRefs: ["evidence://state-change/p7"], externalStateRef: reference("TSN", seeded.tensionState.tensionStateId), createdAt: "2027-03-04T01:00:01.000Z" });
    expect(await chain.stateChanges.persistCareerStateChangeDeclaration(stateChange)).toEqual(stateChange);
    const association = createCareerActionStateChangeAssociationDeclaration(stateChange, { careerStateChangeDeclarationId: stateChange.careerStateChangeDeclarationId, declaredByActorId: "ASSOCIATION_DECLARANT_P7", declaredAt: "2027-03-05T01:00:00.000Z", associationEvidenceRefs: ["evidence://association/p7"], createdAt: "2027-03-05T01:00:01.000Z" });
    expect(await chain.associations.persistCareerActionStateChangeAssociationDeclaration(association)).toEqual(association);
    const outcomeRole = createCareerOutcomeRoleDeclaration(association, { careerActionStateChangeAssociationDeclarationId: association.careerActionStateChangeAssociationDeclarationId, declaredByActorId: "OUTCOME_ROLE_DECLARANT_P7", declaredAt: "2027-03-06T01:00:00.000Z", outcomeRoleEvidenceRefs: ["evidence://outcome-role/p7"], createdAt: "2027-03-06T01:00:01.000Z" });
    expect(await chain.outcomeRoles.persistCareerOutcomeRoleDeclaration(outcomeRole)).toEqual(outcomeRole);
    const valences: CareerOutcomeValence[] = ["DESIRABLE", "UNDESIRABLE", "NEUTRAL", "UNRESOLVED"];
    const declaredValences = valences.map((valence) => createCareerOutcomeValenceDeclaration(outcomeRole, { careerOutcomeRoleDeclarationId: outcomeRole.careerOutcomeRoleDeclarationId, declaredByActorId: "OUTCOME_VALENCE_DECLARANT_P7", declaredAt: "2027-03-07T01:00:00.000Z", valence, valenceEvidenceRefs: ["evidence://outcome-valence/p7"], createdAt: "2027-03-07T01:00:01.000Z" }));
    expect(new Set(declaredValences.map((value) => value.careerOutcomeValenceDeclarationId)).size).toBe(4);
    const outcomeValence = declaredValences[0];
    expect(await chain.outcomeValences.persistCareerOutcomeValenceDeclaration(outcomeValence)).toEqual(outcomeValence);
    for (const artifact of [record, intent, commitment, grant, executionContext, occurrence, stateChange, association, outcomeRole, outcomeValence]) expect(forbiddenPaths(artifact)).toEqual([]);
    Object.assign(walked, { dcr: record.humanDecisionRecordId, daint: intent.careerDecisionActionIntentId, hcom: commitment.careerHumanCommitmentId, eagr: grant.careerExecutionAuthorityGrantRevisionId, ectxrev: executionContext.careerExecutionContextRevisionId, aoc: occurrence.careerActionOccurrenceId, scd: stateChange.careerStateChangeDeclarationId, ascad: association.careerActionStateChangeAssociationDeclarationId, cord: outcomeRole.careerOutcomeRoleDeclarationId, covd: outcomeValence.careerOutcomeValenceDeclarationId });
  }, 60_000);

  it("resolves AOC, SCD, ASCAD, CORD and COVD through the bound resolvers against the live repositories (R1 reachability, R5)", async () => {
    const reader = createBoundAuthoritativeStateReader(createCareerCanonicalAuthoritativeStateResolvers(producers));
    for (const [family, id] of [["AOC", walked.aoc], ["SCD", walked.scd], ["ASCAD", walked.ascad], ["CORD", walked.cord], ["COVD", walked.covd]] as const) {
      const resolution = await reader.resolve(reference(family, id));
      expect((resolution.payload as Record<string, unknown>)[CAREER_CANONICAL_FAMILIES[family].idField]).toBe(id);
    }
  });

  it("returns the COVD-provenanced observation: 8B/8C1 from AOC/SCD, 8C2/8C3/8D1, governed 8D2 to 8D4B, sealed 8D5 refuses the COVD reference (Case-3 boundary); the D2-shaped child DREV is formed directly outside the governed path; lineage reconstructs child to root", async () => {
    const occurrenceClaim = createActionOccurrenceClaim({ source: { origin: "AUTHORITATIVE_STATE", stateReference: reference("AOC", walked.aoc) }, operationDescription: "Applied for the target role." });
    const stateChangeClaim = createStateChangeClaim({ source: { origin: "AUTHORITATIVE_STATE", stateReference: reference("SCD", walked.scd) }, stateChangeDescription: "Application status moved to interview-invited." });
    const association = createActionStateChangeAssociationProposal({ actionOccurrenceClaim: occurrenceClaim, stateChangeClaim, provenance: { origin: "AUTHORITATIVE_STATE", stateReference: reference("ASCAD", walked.ascad) } });
    const attribution = createOutcomeAttributionProposal({ associationProposal: association, provenance: { origin: "AUTHORITATIVE_STATE", stateReference: reference("CORD", walked.cord) } });
    const covd = reference("COVD", walked.covd);
    const proposal = createDecisionContextObservationProposal({ outcomeAttributionProposal: attribution, statement: "The declared outcome valence was DESIRABLE.", provenance: { origin: "AUTHORITATIVE_STATE", stateReference: covd } });
    const admission = createDecisionContextObservationAdmissionDeclaration({ decisionContextObservationProposal: proposal, admittedBy: { origin: "HUMAN_INPUT", actorId: decider }, rationale: null });
    const projection = createDecisionContextObservationItemProjection({ decisionContextObservationAdmissionDeclaration: admission });
    const declaration = createDecisionContextObservationTargetDeclaration({ decisionContextObservationItemProjection: projection, targetRevisionId: rootRevision.revisionId, declaredBy: { origin: "HUMAN_INPUT", actorId: decider }, rationale: null });
    const binding = await createBoundDecisionContextObservationTargetRevisionBinder({ getRevisionById: (id: string) => revisions.getRevisionById(id) }).bind(declaration);
    expect(binding.revision).toEqual(rootRevision);
    // Sealed 8D5: an observation whose AUTHORITATIVE_STATE reference is absent from the root inventory is not materializable (boundary B6).
    expect(() => createDecisionContextObservationMaterializationReadiness({ decisionContextObservationTargetRevisionBinding: binding })).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_MATERIALIZATION_READINESS_SOURCE_REFERENCE_MISSING");

    // D2 form of the return: the child revision extends the inventory by the exact COVD reference and carries the observation with exact provenance.
    const draft = createDecisionContextDraft({
      sourceStateReferences: [...rootRevision.context.sourceStateReferences, covd],
      items: [...rootRevision.context.items.map((item) => ({ role: item.role, statement: item.statement, provenance: item.provenance })), { role: "OBSERVATION", statement: proposal.statement, provenance: proposal.provenance }]
    });
    const validationInput = { expectationValidations: [], consequenceValidations: [] };
    const child = createDecisionContextRevision({ previousRevisionId: rootRevision.revisionId, context: draft, validationInput, validationAssembly: assembleDecisionContextValidation(draft, validationInput) });
    childRevision = await revisions.createDecisionContextRevisionPersister().persist(child);
    expect(childRevision).toEqual(child);
    expect(childRevision.previousRevisionId).toBe(rootRevision.revisionId);
    expect(await revisions.getRevisionById(rootRevision.revisionId)).toEqual(rootRevision);
    const lineage = await createBoundDecisionContextRevisionLineageReconstructor({ getRevisionById: (id: string) => revisions.getRevisionById(id) }).reconstruct(childRevision.revisionId);
    expect(lineage.rootRevisionId).toBe(rootRevision.revisionId);
    expect(lineage.revisions.map((revision) => revision.revisionId)).toEqual([rootRevision.revisionId, childRevision.revisionId]);
    expect(forbiddenPaths(childRevision)).toEqual([]);
    expect(JSON.stringify(childRevision)).not.toContain(sentinel);
    walked.childRevisionId = childRevision.revisionId;
  }, 30_000);

  it("drives the governed 8D2 to 8D10 path over the real root for an observation whose provenance the root inventory already names (sibling child)", async () => {
    const occurrenceClaim = createActionOccurrenceClaim({ source: { origin: "AUTHORITATIVE_STATE", stateReference: reference("AOC", walked.aoc) }, operationDescription: "Applied for the target role." });
    const stateChangeClaim = createStateChangeClaim({ source: { origin: "AUTHORITATIVE_STATE", stateReference: reference("SCD", walked.scd) }, stateChangeDescription: "Application status moved to interview-invited." });
    const association = createActionStateChangeAssociationProposal({ actionOccurrenceClaim: occurrenceClaim, stateChangeClaim, provenance: { origin: "AUTHORITATIVE_STATE", stateReference: reference("ASCAD", walked.ascad) } });
    const attribution = createOutcomeAttributionProposal({ associationProposal: association, provenance: { origin: "AUTHORITATIVE_STATE", stateReference: reference("CORD", walked.cord) } });
    const rcpReference = rootRevision.context.sourceStateReferences.find((entry) => entry.authorityContractId === CAREER_CANONICAL_FAMILIES.RCP.authorityContractId && entry.locator === entry.artifactId)!;
    const proposal = createDecisionContextObservationProposal({ outcomeAttributionProposal: attribution, statement: "An outcome was declared over the proposal the context was built on.", provenance: { origin: "AUTHORITATIVE_STATE", stateReference: rcpReference } });
    const admission = createDecisionContextObservationAdmissionDeclaration({ decisionContextObservationProposal: proposal, admittedBy: { origin: "HUMAN_INPUT", actorId: decider }, rationale: null });
    const projection = createDecisionContextObservationItemProjection({ decisionContextObservationAdmissionDeclaration: admission });
    const declaration = createDecisionContextObservationTargetDeclaration({ decisionContextObservationItemProjection: projection, targetRevisionId: rootRevision.revisionId, declaredBy: { origin: "HUMAN_INPUT", actorId: decider }, rationale: null });
    const binding = await createBoundDecisionContextObservationTargetRevisionBinder({ getRevisionById: (id: string) => revisions.getRevisionById(id) }).bind(declaration);
    const readiness = createDecisionContextObservationMaterializationReadiness({ decisionContextObservationTargetRevisionBinding: binding });
    const materialization = createDecisionContextObservationItemMaterialization({ decisionContextObservationMaterializationReadiness: readiness });
    const transition = createDecisionContextObservationContextTransition({ decisionContextObservationItemMaterialization: materialization });
    const assembly = createDecisionContextObservationContextValidationAssembly({ decisionContextObservationContextTransition: transition, validationInput: { expectationValidations: [], consequenceValidations: [] } });
    const creation = createDecisionContextObservationRevisionCreation({ decisionContextObservationContextValidationAssembly: assembly });
    const persistence = await createBoundDecisionContextObservationRevisionPersister(revisions.createDecisionContextRevisionPersister()).persist({ decisionContextObservationRevisionCreation: creation });
    expect(persistence.persistedRevision.previousRevisionId).toBe(rootRevision.revisionId);
    expect(persistence.persistedRevision.revisionId).not.toBe(childRevision.revisionId);
    expect(await revisions.getRevisionById(persistence.persistedRevision.revisionId)).toEqual(persistence.persistedRevision);
    expect(forbiddenPaths(persistence)).toEqual([]);
  }, 30_000);
});

describe("P7 inverse: fresh process walks child DREV to root by exact ids only", () => {
  it("reaches COVD, CORD, ASCAD, SCD, AOC, ECTXREV, EAGR, HCOM, DAINT, DCR, DCTXREV, the binding, the RCP and the DAR without any search", () => {
    const result = spawnSync(process.execPath, [resolve(process.cwd(), "node_modules/tsx/dist/cli.mjs"), resolve(process.cwd(), "test/decision-integration/fixtures/p7-inverse-walk.ts"), childRevision.revisionId], {
      cwd: process.cwd(), env: { ...process.env, DATABASE_URL: databaseUrl.toString() }, encoding: "utf8", timeout: 120_000
    });
    expect(result.stderr).toBe("");
    expect(result.status).toBe(0);
    const inverse = JSON.parse(result.stdout) as Record<string, string>;
    expect(inverse).toEqual(walked);
    console.info(`[P7 INVERSE] GREEN pid=${result.pid} child=${inverse.childRevisionId} root=${inverse.rootRevisionId} steps=${Object.keys(inverse).length}`);
  }, 150_000);
});
