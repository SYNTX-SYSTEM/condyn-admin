import { describe, expect, it } from "vitest";
import { CAREER_CANONICAL_AUTHORITY_CONTRACTS, CAREER_CANONICAL_PRODUCER_ID, careerCanonicalReference } from "../../../../lib/career/canonical-authority";
import {
  assertCareerDecisionContextDecisionRevisionBinding,
  byteReplayCareerDecisionContextDecisionRevisionBinding,
  CAREER_DECISION_CONTEXT_DECISION_REVISION_BINDING_SCHEMA_VERSION,
  createBoundCareerDecisionContextDecisionRevisionBinder,
  derivationReplayCareerDecisionContextDecisionRevisionBinding,
  deriveCareerDecisionContextDecisionRevisionBindingId,
  semanticReplayCareerDecisionContextDecisionRevisionBinding,
  type CareerDecisionContextDecisionRevisionBinding,
} from "../../../../lib/career/relation/decision-context-decision-revision-binding";
import { createDcdrbHistoricalFixture, createGenericRevisionForProposal } from "./dcdrb-historical-fixture";

const forbidden = ["current", "latest", "head", "accepted", "authority", "verified", "loopClosed", "success"];

describe("CareerDecisionContextDecisionRevisionBinding frozen contract (R4, D4)", () => {
  it("binds one exact DCTXREV to one exact DREV through bound readers with a recomputable identity", async () => {
    const fixture = createDcdrbHistoricalFixture();
    const binder = createBoundCareerDecisionContextDecisionRevisionBinder(fixture.contexts, fixture.revisions);
    const binding = await binder.bind(fixture.bindingInput);
    expect(binding.careerDecisionContextDecisionRevisionBindingId).toMatch(/^DCDRB_[0-9A-F]{32}$/);
    expect(binding.schemaVersion).toBe(CAREER_DECISION_CONTEXT_DECISION_REVISION_BINDING_SCHEMA_VERSION);
    expect(binding.careerDecisionContextRevision).toEqual(fixture.context);
    expect(binding.decisionContextRevision).toEqual(fixture.revision);
    expect(binding.recommendationProposalWitness).toEqual(fixture.witness);
    expect(binding.recommendationProposalWitness.artifactId).toBe(fixture.context.recommendationProposalId);
    expect(Object.keys(binding).some(key => forbidden.includes(key))).toBe(false);
    const { createdAt: _createdAt, ...contextBody } = binding.careerDecisionContextRevision;
    expect(deriveCareerDecisionContextDecisionRevisionBindingId({
      careerDecisionContextRevision: contextBody,
      decisionContextRevision: binding.decisionContextRevision,
      recommendationProposalWitness: binding.recommendationProposalWitness,
      schemaVersion: binding.schemaVersion,
    })).toBe(binding.careerDecisionContextDecisionRevisionBindingId);
    expect(() => assertCareerDecisionContextDecisionRevisionBinding(binding)).not.toThrow();
  });

  it("is deterministic across createdAt and returns detached values", async () => {
    const fixture = createDcdrbHistoricalFixture();
    const binder = createBoundCareerDecisionContextDecisionRevisionBinder(fixture.contexts, fixture.revisions);
    const first = await binder.bind(fixture.bindingInput);
    const second = await binder.bind({ ...fixture.bindingInput, createdAt: "2027-02-01T03:00:00.000Z" });
    expect(second.careerDecisionContextDecisionRevisionBindingId).toBe(first.careerDecisionContextDecisionRevisionBindingId);
    expect(second.createdAt).not.toBe(first.createdAt);
    (first.decisionContextRevision.context.sourceStateReferences as unknown as Array<{ artifactId: string }>)[0].artifactId = "RCP_TAMPERED";
    const third = await binder.bind(fixture.bindingInput);
    expect(third.recommendationProposalWitness.artifactId).toBe(fixture.context.recommendationProposalId);
  });

  it("rejects absent, invalid, and mismatched reader returns with named errors", async () => {
    const fixture = createDcdrbHistoricalFixture();
    const none = { async getCareerDecisionContextRevisionById() { return null; } };
    const noneRevision = { async getDecisionContextRevisionById() { return null; } };
    await expect(createBoundCareerDecisionContextDecisionRevisionBinder(none, fixture.revisions).bind(fixture.bindingInput))
      .rejects.toThrow("ERR_CAREER_DECISION_CONTEXT_DECISION_REVISION_BINDING_CONTEXT_NOT_FOUND");
    await expect(createBoundCareerDecisionContextDecisionRevisionBinder(fixture.contexts, noneRevision).bind(fixture.bindingInput))
      .rejects.toThrow("ERR_CAREER_DECISION_CONTEXT_DECISION_REVISION_BINDING_DECISION_REVISION_NOT_FOUND");
    const wrongRevision = { async getDecisionContextRevisionById() { return { ...structuredClone(fixture.revision), revisionId: "DREV_000000000000000000000000" }; } };
    await expect(createBoundCareerDecisionContextDecisionRevisionBinder(fixture.contexts, wrongRevision).bind(fixture.bindingInput))
      .rejects.toThrow("ERR_CAREER_DECISION_CONTEXT_DECISION_REVISION_BINDING_DECISION_REVISION_INVALID");
    const hostileRevision = { async getDecisionContextRevisionById() { return { ...structuredClone(fixture.revision), current: true }; } };
    await expect(createBoundCareerDecisionContextDecisionRevisionBinder(fixture.contexts, hostileRevision).bind(fixture.bindingInput))
      .rejects.toThrow("ERR_CAREER_DECISION_CONTEXT_DECISION_REVISION_BINDING_DECISION_REVISION_INVALID");
    await expect(createBoundCareerDecisionContextDecisionRevisionBinder(fixture.contexts, fixture.revisions).bind({ ...fixture.bindingInput, decisionContextRevisionId: "DREV_lowercase" }))
      .rejects.toThrow("ERR_CAREER_DECISION_CONTEXT_DECISION_REVISION_BINDING_INVALID");
    expect(() => createBoundCareerDecisionContextDecisionRevisionBinder({} as never, fixture.revisions))
      .toThrow("ERR_CAREER_DECISION_CONTEXT_DECISION_REVISION_BINDING_READER_INVALID");
  });

  it("requires exactly one whole-artifact witness of the DCTXREV proposal and admits item locators of that proposal only", async () => {
    const fixture = createDcdrbHistoricalFixture();
    const reader = (revision: unknown) => ({ async getDecisionContextRevisionById() { return structuredClone(revision); } });
    const missing = createGenericRevisionForProposal(fixture.proposal, fixture.context, { sourceStateReferences: [] });
    await expect(createBoundCareerDecisionContextDecisionRevisionBinder(fixture.contexts, reader(missing))
      .bind({ ...fixture.bindingInput, decisionContextRevisionId: missing.revisionId }))
      .rejects.toThrow("ERR_CAREER_DECISION_CONTEXT_DECISION_REVISION_BINDING_RECOMMENDATION_PROPOSAL_WITNESS_MISSING");
    const foreign = careerCanonicalReference("RECOMMENDATION_PROPOSAL", `RCP_${"0".repeat(32)}`);
    const mismatched = createGenericRevisionForProposal(fixture.proposal, fixture.context, { sourceStateReferences: [foreign] });
    await expect(createBoundCareerDecisionContextDecisionRevisionBinder(fixture.contexts, reader(mismatched))
      .bind({ ...fixture.bindingInput, decisionContextRevisionId: mismatched.revisionId }))
      .rejects.toThrow("ERR_CAREER_DECISION_CONTEXT_DECISION_REVISION_BINDING_RECOMMENDATION_PROPOSAL_WITNESS_MISMATCH");
    const withForeign = createGenericRevisionForProposal(fixture.proposal, fixture.context, { sourceStateReferences: [fixture.witness, foreign] });
    await expect(createBoundCareerDecisionContextDecisionRevisionBinder(fixture.contexts, reader(withForeign))
      .bind({ ...fixture.bindingInput, decisionContextRevisionId: withForeign.revisionId }))
      .rejects.toThrow("ERR_CAREER_DECISION_CONTEXT_DECISION_REVISION_BINDING_RECOMMENDATION_PROPOSAL_WITNESS_MISMATCH");
    const itemReference = { ...fixture.witness, locator: `${fixture.witness.artifactId}/items/1` };
    const withItem = createGenericRevisionForProposal(fixture.proposal, fixture.context, { sourceStateReferences: [fixture.witness, itemReference] });
    const itemBound = await createBoundCareerDecisionContextDecisionRevisionBinder(fixture.contexts, reader(withItem))
      .bind({ ...fixture.bindingInput, decisionContextRevisionId: withItem.revisionId });
    expect(itemBound.recommendationProposalWitness).toEqual(fixture.witness);
    const itemOnly = createGenericRevisionForProposal(fixture.proposal, fixture.context, { sourceStateReferences: [itemReference] });
    await expect(createBoundCareerDecisionContextDecisionRevisionBinder(fixture.contexts, reader(itemOnly))
      .bind({ ...fixture.bindingInput, decisionContextRevisionId: itemOnly.revisionId }))
      .rejects.toThrow("ERR_CAREER_DECISION_CONTEXT_DECISION_REVISION_BINDING_RECOMMENDATION_PROPOSAL_WITNESS_MISSING");
    const badLocator = { ...fixture.witness, locator: `${fixture.witness.artifactId}/items/01` };
    const withBadLocator = createGenericRevisionForProposal(fixture.proposal, fixture.context, { sourceStateReferences: [fixture.witness, badLocator] });
    await expect(createBoundCareerDecisionContextDecisionRevisionBinder(fixture.contexts, reader(withBadLocator))
      .bind({ ...fixture.bindingInput, decisionContextRevisionId: withBadLocator.revisionId }))
      .rejects.toThrow("ERR_CAREER_DECISION_CONTEXT_DECISION_REVISION_BINDING_RECOMMENDATION_PROPOSAL_WITNESS_MISMATCH");
    const otherProducer = { ...fixture.witness, producerId: "SOMEONE_ELSE" };
    const foreignProducer = createGenericRevisionForProposal(fixture.proposal, fixture.context, { sourceStateReferences: [otherProducer] });
    await expect(createBoundCareerDecisionContextDecisionRevisionBinder(fixture.contexts, reader(foreignProducer))
      .bind({ ...fixture.bindingInput, decisionContextRevisionId: foreignProducer.revisionId }))
      .rejects.toThrow("ERR_CAREER_DECISION_CONTEXT_DECISION_REVISION_BINDING_RECOMMENDATION_PROPOSAL_WITNESS_MISSING");
    expect(fixture.witness.producerId).toBe(CAREER_CANONICAL_PRODUCER_ID);
    expect(fixture.witness.authorityContractId).toBe(CAREER_CANONICAL_AUTHORITY_CONTRACTS.RECOMMENDATION_PROPOSAL);
  });

  it("asserts stored bindings exactly: tampered identity, derived witness, and foreign keys are rejected", async () => {
    const fixture = createDcdrbHistoricalFixture();
    const binding = await createBoundCareerDecisionContextDecisionRevisionBinder(fixture.contexts, fixture.revisions).bind(fixture.bindingInput);
    const tamperedId: CareerDecisionContextDecisionRevisionBinding = { ...structuredClone(binding), careerDecisionContextDecisionRevisionBindingId: `DCDRB_${"A".repeat(32)}` };
    expect(() => assertCareerDecisionContextDecisionRevisionBinding(tamperedId)).toThrow("ERR_CAREER_DECISION_CONTEXT_DECISION_REVISION_BINDING_ID_MISMATCH");
    const tamperedWitness = structuredClone(binding);
    tamperedWitness.recommendationProposalWitness = { ...tamperedWitness.recommendationProposalWitness, locator: "elsewhere" };
    expect(() => assertCareerDecisionContextDecisionRevisionBinding(tamperedWitness)).toThrow("ERR_CAREER_DECISION_CONTEXT_DECISION_REVISION_BINDING_INVALID");
    expect(() => assertCareerDecisionContextDecisionRevisionBinding({ ...structuredClone(binding), current: true })).toThrow("ERR_CAREER_DECISION_CONTEXT_DECISION_REVISION_BINDING_INVALID");
    const tamperedContext = structuredClone(binding);
    tamperedContext.careerDecisionContextRevision = { ...tamperedContext.careerDecisionContextRevision, recommendationProposalId: `RCP_${"0".repeat(32)}` };
    expect(() => assertCareerDecisionContextDecisionRevisionBinding(tamperedContext)).toThrow("ERR_CAREER_DECISION_CONTEXT_DECISION_REVISION_BINDING_INVALID");
  });

  it("replays BYTE, DERIVATION and SEMANTIC against in-memory readers and fails on divergence", async () => {
    const fixture = createDcdrbHistoricalFixture();
    const binding = await createBoundCareerDecisionContextDecisionRevisionBinder(fixture.contexts, fixture.revisions).bind(fixture.bindingInput);
    const store = new Map([[binding.careerDecisionContextDecisionRevisionBindingId, binding]]);
    const dependencies = {
      bindings: { async getCareerDecisionContextDecisionRevisionBindingById(id: string) { return store.get(id) ? structuredClone(store.get(id)!) : null; } },
      decisionContexts: fixture.contexts,
      decisionRevisions: fixture.revisions,
      authorities: { async getDecisionAuthorityGrantRevisionById(id: string) { return id === fixture.authority.decisionAuthorityGrantRevisionId ? structuredClone(fixture.authority) : null; } },
      proposals: { async getRecommendationProposalById(id: string) { return id === fixture.proposal.recommendationProposalId ? structuredClone(fixture.proposal) : null; } },
    };
    const id = binding.careerDecisionContextDecisionRevisionBindingId;
    expect(await byteReplayCareerDecisionContextDecisionRevisionBinding(id, dependencies)).toEqual(binding);
    expect(await derivationReplayCareerDecisionContextDecisionRevisionBinding(id, dependencies)).toEqual(binding);
    expect(await semanticReplayCareerDecisionContextDecisionRevisionBinding(id, dependencies)).toEqual(binding);
    await expect(byteReplayCareerDecisionContextDecisionRevisionBinding(`DCDRB_${"0".repeat(32)}`, dependencies))
      .rejects.toThrow("ERR_CAREER_DECISION_CONTEXT_DECISION_REVISION_BINDING_NOT_FOUND");
    const drifted = { ...dependencies, decisionRevisions: { async getDecisionContextRevisionById() { return { ...structuredClone(fixture.revision), previousRevisionId: `DREV_${"1".repeat(24)}` }; } } };
    await expect(semanticReplayCareerDecisionContextDecisionRevisionBinding(id, drifted))
      .rejects.toThrow("ERR_CAREER_DECISION_CONTEXT_DECISION_REVISION_BINDING_REPLAY_MISMATCH");
    const missingAuthority = { ...dependencies, authorities: { async getDecisionAuthorityGrantRevisionById() { return null; } } };
    await expect(semanticReplayCareerDecisionContextDecisionRevisionBinding(id, missingAuthority))
      .rejects.toThrow("ERR_CAREER_DECISION_CONTEXT_DECISION_REVISION_BINDING_REPLAY_MISMATCH");
  });
});
