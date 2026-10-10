import { createBoundAuthoritativeStateReader } from "../../../lib/decision-core/authority";
import { CAREER_CANONICAL_PRODUCER_ID, createCareerCanonicalAuthoritativeStateResolvers } from "../../../lib/decision-adapters/career-canonical";
import { createLocalCareerCanonicalProducerRepositories } from "../../../lib/decision-runtime/local/career-canonical-producers";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createProductionHumanDecisionRecordDependencies } from "../../../lib/career/human-decision-admission/application";
import {
  createHrDecisionLoopReadService,
  createPostgresHrDecisionLoopReadDependencies
} from "../../../lib/career/hr-decision-loop/server-read-service";
import {
  createHrDecisionDeclarationApplication,
  createLocalSelfDeclaredTransportIdentity,
  LOCAL_SELF_DECLARED_PRINCIPAL_ISSUER,
  PRINCIPAL_ISSUER_HEADER,
  PRINCIPAL_SUBJECT_HEADER
} from "../../../lib/career/hr-decision-loop/declaration-application";
import { HR_DECISION_LOOP_FORBIDDEN_CLAIM_KEYS, HR_DECISION_LOOP_REGION_NAMES } from "../../../lib/career/hr-decision-loop/read-model";
import { decodeHrDecisionLoopPresentation } from "../../../lib/career/hr-decision-loop/frontend-presentation";
import { PostgresDecisionContextRevisionRepository } from "../../../lib/decision-adapters/revision-persistence";
import { createHrLoopPostgresWorld, HR_LOOP_DECIDER, HR_LOOP_G3_PAYLOAD_MARKER, type HrLoopWorld } from "./fixtures/hr-loop-postgres-world";

let world: HrLoopWorld;
beforeAll(async () => { world = await createHrLoopPostgresWorld(); }, 180_000);
afterAll(async () => { if (world) await world.destroy(); }, 30_000);

/** Same composition as `createLocalHrDecisionLoopHttpApplication`, bound to the isolated world instead of the shared client. */
function compose() {
  const producer = createProductionHumanDecisionRecordDependencies(world.db);
  const read = createHrDecisionLoopReadService(createPostgresHrDecisionLoopReadDependencies(world.db, producer));
  const declare = createHrDecisionDeclarationApplication({ producer, identity: createLocalSelfDeclaredTransportIdentity(), now: () => "2026-10-09T20:00:00.000Z" });
  return { producer, read, declare };
}

const principal = (subject: string) => new Request("http://local/declare", { method: "POST", headers: { [PRINCIPAL_ISSUER_HEADER]: LOCAL_SELF_DECLARED_PRINCIPAL_ISSUER, [PRINCIPAL_SUBJECT_HEADER]: subject } });

describe("HR Decision Loop read service over an isolated PostgreSQL world", () => {
  it("reconstructs context A with every family AVAILABLE and bound to the exact seeded ids", async () => {
    const { read } = compose();
    const model = await read.read(world.contextA);
    expect(model.careerDecisionContextRevision.careerDecisionContextRevisionId).toBe(world.contextA);
    expect(model.decisionAuthorityGrantRevision.decisionAuthorityGrantRevisionId).toBe(world.decisionAuthorityGrantRevisionId);
    expect(model.recommendationProposal.recommendationProposalId).toBe(world.recommendationProposalId);
    expect(model.careerDecisionContextRevision.decisionSubjects.map(subject => subject.sourceEvolutionInputItemOrdinal)).toEqual(world.proposedOrdinals);
    const expected: Record<string, string> = {
      decisions: world.chain.humanDecisionRecordId,
      actionIntents: world.chain.careerDecisionActionIntentId,
      commitments: world.chain.careerHumanCommitmentId,
      executionAuthorityGrants: world.chain.careerExecutionAuthorityGrantRevisionId,
      executionContexts: world.chain.careerExecutionContextRevisionId,
      actionOccurrences: world.chain.careerActionOccurrenceId,
      stateChanges: world.chain.careerStateChangeDeclarationId,
      associations: world.chain.careerActionStateChangeAssociationDeclarationId,
      outcomeRoles: world.chain.careerOutcomeRoleDeclarationId,
      outcomeValences: world.chain.careerOutcomeValenceDeclarationId,
      feedbackAdmissions: world.chain.careerOutcomeValenceFeedbackAdmissionDeclarationId,
      feedbackTargets: world.chain.careerOutcomeValenceFeedbackTargetDeclarationId,
      feedbackTargetBindings: world.chain.careerOutcomeValenceFeedbackTargetRevisionBindingId,
      feedbackContextRevisions: world.chain.careerOutcomeValenceFeedbackContextRevisionId,
      decisionRevisionBindings: world.g2.decisionRevisionBindingId
    };
    for (const name of HR_DECISION_LOOP_REGION_NAMES) {
      expect(model[name].state, name).toBe("AVAILABLE");
      expect(model[name].artifactIds, name).toEqual([expected[name]]);
      expect(model[name].artifacts, name).toHaveLength(1);
    }
    expect(model.outcomeValences.artifacts[0].valence).toBe("DESIRABLE");
    expect(model.feedbackContextRevisions.artifacts[0].parent).toEqual({ parentRevisionKind: "CAREER_DECISION_CONTEXT_REVISION", parentRevisionId: world.contextA });
    for (const key of HR_DECISION_LOOP_FORBIDDEN_CLAIM_KEYS) expect(model).not.toHaveProperty(key);
    const presentation = decodeHrDecisionLoopPresentation(JSON.parse(JSON.stringify(model)));
    expect(presentation).not.toBeNull();
    expect(presentation!.regions.every(region => region.state === "AVAILABLE" && region.count === 1)).toBe(true);
  });

  it("represents context B as EMPTY in every family and persists a human decision for it through the sealed DCR gate", async () => {
    const { read, declare, producer } = compose();
    const before = await read.read(world.contextB);
    for (const name of HR_DECISION_LOOP_REGION_NAMES) expect(before[name]).toEqual({ state: "EMPTY", artifactIds: [], artifacts: [] });
    const declaration = { careerDecisionContextRevisionId: world.contextB, declarantActorId: HR_LOOP_DECIDER, declarationClass: "DEFER_DECISION", declaredAt: "2026-10-09T19:59:00.000Z", declarationEvidenceRefs: ["evidence://frontend/postgres-proof"] };
    const record = await declare.declare(principal(HR_LOOP_DECIDER), declaration);
    expect(record.humanDecisionRecordId).toMatch(/^DCR_[0-9A-F]{32}$/);
    expect(record.careerDecisionContextRevisionId).toBe(world.contextB);
    await expect(producer.records.getHumanDecisionRecordById(record.humanDecisionRecordId)).resolves.toEqual(record);
    const after = await read.read(world.contextB);
    expect(after.decisions).toEqual({ state: "AVAILABLE", artifactIds: [record.humanDecisionRecordId], artifacts: [record] });
    for (const name of HR_DECISION_LOOP_REGION_NAMES) if (name !== "decisions") expect(after[name].state).toBe("EMPTY");
    await expect(declare.declare(principal("SOMEONE_ELSE"), { ...declaration, declarantActorId: "SOMEONE_ELSE" })).rejects.toThrow("ERR_HUMAN_DECISION_DECLARANT_MISMATCH");
    await expect(declare.declare(principal(HR_LOOP_DECIDER), { ...declaration, declarationClass: "REQUEST_FURTHER_EVIDENCE" })).rejects.toThrow("ERR_HUMAN_DECISION_SUBJECT_NOT_ADMISSIBLE");
    const laterClock = createHrDecisionDeclarationApplication({ producer, identity: createLocalSelfDeclaredTransportIdentity(), now: () => "2026-10-09T21:00:00.000Z" });
    await expect(laterClock.declare(principal(HR_LOOP_DECIDER), declaration)).rejects.toThrow("ERR_HUMAN_DECISION_IMMUTABLE_CONFLICT");
  });

  it("inverse: walks from the COVFCR and from the G2 child revision back to the exact root ids without any search", async () => {
    const { producer } = compose();
    const read = createPostgresHrDecisionLoopReadDependencies(world.db, producer);
    const feedback = await read.feedbackContextRevisions.readById(world.chain.careerOutcomeValenceFeedbackContextRevisionId);
    expect(feedback!.parent.parentRevisionId).toBe(world.contextA);
    const returnItem = feedback!.careerOutcomeValenceFeedbackContextTransition.addedFeedbackReturnItem;
    const binding = returnItem.careerOutcomeValenceFeedbackReturnRepresentation.careerOutcomeValenceFeedbackTargetRevisionBinding;
    expect(binding.careerOutcomeValenceFeedbackTargetRevisionBindingId).toBe(world.chain.careerOutcomeValenceFeedbackTargetRevisionBindingId);
    const target = binding.careerOutcomeValenceFeedbackTargetDeclaration;
    expect(target.careerOutcomeValenceDeclarationId).toBe(world.chain.careerOutcomeValenceDeclarationId);
    const valence = await read.outcomeValences.readById(target.careerOutcomeValenceDeclarationId);
    expect(valence!.careerActionOccurrenceId).toBe(world.chain.careerActionOccurrenceId);
    const occurrence = await read.actionOccurrences.readById(valence!.careerActionOccurrenceId);
    expect(occurrence!.humanDecisionRecordId).toBe(world.chain.humanDecisionRecordId);
    const decision = await producer.records.getHumanDecisionRecordById(occurrence!.humanDecisionRecordId);
    expect(decision!.careerDecisionContextRevisionId).toBe(world.contextA);
    const context = await producer.contexts.getCareerDecisionContextRevisionById(decision!.careerDecisionContextRevisionId);
    expect(context!.decisionAuthorityGrantRevisionId).toBe(world.decisionAuthorityGrantRevisionId);
    expect(context!.recommendationProposalId).toBe(world.recommendationProposalId);

    const revisions = new PostgresDecisionContextRevisionRepository(world.db as never);
    const child = await revisions.getRevisionById(world.g2.childRevisionId);
    expect(child!.previousRevisionId).toBe(world.g2.rootRevisionId);
    const observation = child!.context.items.find(item => item.role === "OBSERVATION")!;
    expect(observation.provenance).toEqual({ origin: "AUTHORITATIVE_STATE", stateReference: { producerId: "CONDYN_CAREER_CANONICAL_CHAIN", authorityContractId: "CAREER_OUTCOME_VALENCE_DECLARATION_V1", artifactId: world.chain.careerOutcomeValenceDeclarationId, locator: world.chain.careerOutcomeValenceDeclarationId } });
    const root = await revisions.getRevisionById(child!.previousRevisionId!);
    expect(root!.previousRevisionId).toBeNull();
    expect(root!.context.sourceStateReferences[0].artifactId).toBe(world.snapshotId);
    expect(JSON.stringify(child)).not.toContain(HR_LOOP_G3_PAYLOAD_MARKER);
    expect(JSON.stringify(root)).not.toContain(HR_LOOP_G3_PAYLOAD_MARKER);
  });

  it("inverse through the DCDRB binding: context A to its exact root DREV, whose Career references resolve through R1", async () => {
    const { producer } = compose();
    const read = createPostgresHrDecisionLoopReadDependencies(world.db, producer);
    expect(await read.decisionRevisionBindings.indexIds(world.contextA)).toEqual([world.g2.decisionRevisionBindingId]);
    expect(await read.decisionRevisionBindings.indexIds(world.contextB)).toEqual([]);
    const binding = await read.decisionRevisionBindings.readById(world.g2.decisionRevisionBindingId);
    expect(binding!.careerDecisionContextRevision.careerDecisionContextRevisionId).toBe(world.contextA);
    expect(binding!.decisionContextRevision.revisionId).toBe(world.g2.rootRevisionId);
    expect(binding!.recommendationProposalWitness.artifactId).toBe(world.recommendationProposalId);
    const root = await new PostgresDecisionContextRevisionRepository(world.db as never).getRevisionById(binding!.decisionContextRevision.revisionId);
    expect(root).toEqual(binding!.decisionContextRevision);
    const reader = createBoundAuthoritativeStateReader(createCareerCanonicalAuthoritativeStateResolvers(createLocalCareerCanonicalProducerRepositories(world.db as never)));
    const careerReferences = root!.context.sourceStateReferences.filter(reference => reference.producerId === CAREER_CANONICAL_PRODUCER_ID);
    expect(careerReferences.map(reference => reference.artifactId)).toEqual([world.recommendationProposalId]);
    for (const reference of careerReferences) expect((await reader.resolve(reference)).reference).toEqual(reference);
    for (const key of HR_DECISION_LOOP_FORBIDDEN_CLAIM_KEYS) expect(binding).not.toHaveProperty(key);
  });
});
