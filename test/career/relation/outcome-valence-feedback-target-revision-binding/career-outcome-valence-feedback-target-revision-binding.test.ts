import { describe, expect, it } from "vitest";
import {
  createCareerDecisionContextRevision,
} from "../../../../lib/career/relation/decision-context";
import {
  createCareerOutcomeValenceFeedbackTargetDeclaration,
} from "../../../../lib/career/relation/outcome-valence-feedback-target-declaration";
import { createT13BHistoricalFixture } from "./t13b-historical-fixture";

const loadOutcomeValenceFeedbackTargetRevisionBinding = () =>
  import("../../../../lib/career/relation/outcome-valence-feedback-target-revision-binding") as Promise<any>;

const schema = "CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_REVISION_BINDING_V1";
const invalidDeclaration = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_REVISION_BINDING_TARGET_DECLARATION_INVALID";
const targetNotFound = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_REVISION_BINDING_TARGET_REVISION_NOT_FOUND";
const invalidRevision = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_REVISION_BINDING_TARGET_REVISION_INVALID";
const invalid = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_REVISION_BINDING_INVALID";
const idMismatch = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_REVISION_BINDING_ID_MISMATCH";

const artifactKeys = [
  "careerOutcomeValenceFeedbackTargetRevisionBindingId",
  "careerOutcomeValenceFeedbackTargetDeclaration",
  "targetCareerDecisionContextRevision",
  "schemaVersion",
  "createdAt",
] as const;

const apiKeys = [
  "CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_REVISION_BINDING_SCHEMA_VERSION",
  "assertCareerOutcomeValenceFeedbackTargetRevisionBinding",
  "createBoundCareerOutcomeValenceFeedbackTargetRevisionBinder",
  "deriveCareerOutcomeValenceFeedbackTargetRevisionBindingId",
  "stableCareerOutcomeValenceFeedbackTargetRevisionBinding",
] as const;

function semantic(value: Record<string, unknown>) {
  const { createdAt: _createdAt, ...body } = structuredClone(value);
  return body;
}

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(Object.keys(value as Record<string, unknown>).sort().map(key => [
      key,
      canonical((value as Record<string, unknown>)[key]),
    ]));
  }
  return value;
}

function reader(result: unknown, calls: string[], rejected?: Error) {
  return {
    async getCareerDecisionContextRevisionById(id: string) {
      calls.push(id);
      if (rejected) throw rejected;
      return result === null ? null : structuredClone(result);
    },
  };
}

describe("CareerOutcomeValenceFeedbackTargetRevisionBinding frozen Domain contract", () => {
  it("constructs valid sealed COVFTD history and an asserted immutable prospective DCTXREV without a T13B module", () => {
    const value = createT13BHistoricalFixture();
    expect(value.outcomeValenceFeedbackTargetDeclaration.targetCareerDecisionContextRevisionId)
      .toBe(value.targetCareerDecisionContextRevision.careerDecisionContextRevisionId);
    expect(value.outcomeValenceFeedbackTargetDeclaration.careerDecisionContextRevisionId)
      .not.toBe(value.targetCareerDecisionContextRevision.careerDecisionContextRevisionId);
  });

  it("binds exactly one reader-returned prospective DCTXREV into the five-field deterministic artifact", async () => {
    const api = await loadOutcomeValenceFeedbackTargetRevisionBinding();
    const value = createT13BHistoricalFixture();
    const calls: string[] = [];
    const binding = await api.createBoundCareerOutcomeValenceFeedbackTargetRevisionBinder(
      reader(value.targetCareerDecisionContextRevision, calls),
    ).bind(value.outcomeValenceFeedbackTargetDeclaration, value.bindingInput);

    expect(Object.keys(binding)).toEqual(artifactKeys);
    expect(binding.schemaVersion).toBe(schema);
    expect(binding.careerOutcomeValenceFeedbackTargetRevisionBindingId).toMatch(/^COVFTRB_[0-9A-F]{32}$/);
    expect(binding.careerOutcomeValenceFeedbackTargetDeclaration)
      .toEqual(value.outcomeValenceFeedbackTargetDeclaration);
    expect(binding.targetCareerDecisionContextRevision).toEqual(value.targetCareerDecisionContextRevision);
    expect(calls).toEqual([value.outcomeValenceFeedbackTargetDeclaration.targetCareerDecisionContextRevisionId]);
    expect(calls).not.toContain(value.outcomeValenceFeedbackTargetDeclaration.careerDecisionContextRevisionId);
    expect(api.deriveCareerOutcomeValenceFeedbackTargetRevisionBindingId({
      careerOutcomeValenceFeedbackTargetDeclaration: semantic(binding.careerOutcomeValenceFeedbackTargetDeclaration),
      targetCareerDecisionContextRevision: semantic(binding.targetCareerDecisionContextRevision),
      schemaVersion: binding.schemaVersion,
    })).toBe(binding.careerOutcomeValenceFeedbackTargetRevisionBindingId);
    expect(Object.keys(api).sort()).toEqual([...apiKeys].sort());
  });

  it("keeps historical and prospective DCTXREV roles distinct, including when their IDs are equal", async () => {
    const api = await loadOutcomeValenceFeedbackTargetRevisionBinding();
    const unequal = createT13BHistoricalFixture();
    const equal = createT13BHistoricalFixture(true);
    const unequalCalls: string[] = [];
    const equalCalls: string[] = [];
    const unequalBinding = await api.createBoundCareerOutcomeValenceFeedbackTargetRevisionBinder(
      reader(unequal.targetCareerDecisionContextRevision, unequalCalls),
    ).bind(unequal.outcomeValenceFeedbackTargetDeclaration, unequal.bindingInput);
    const equalBinding = await api.createBoundCareerOutcomeValenceFeedbackTargetRevisionBinder(
      reader(equal.targetCareerDecisionContextRevision, equalCalls),
    ).bind(equal.outcomeValenceFeedbackTargetDeclaration, equal.bindingInput);

    expect(unequalBinding.careerOutcomeValenceFeedbackTargetDeclaration.careerDecisionContextRevisionId)
      .not.toBe(unequalBinding.careerOutcomeValenceFeedbackTargetDeclaration.targetCareerDecisionContextRevisionId);
    expect(unequalCalls).toEqual([unequalBinding.careerOutcomeValenceFeedbackTargetDeclaration.targetCareerDecisionContextRevisionId]);
    expect(equalBinding.careerOutcomeValenceFeedbackTargetDeclaration.careerDecisionContextRevisionId)
      .toBe(equalBinding.careerOutcomeValenceFeedbackTargetDeclaration.targetCareerDecisionContextRevisionId);
    expect(equalCalls).toEqual([equalBinding.careerOutcomeValenceFeedbackTargetDeclaration.targetCareerDecisionContextRevisionId]);
    expect(equalBinding.targetCareerDecisionContextRevision.careerDecisionContextRevisionId)
      .toBe(equalBinding.careerOutcomeValenceFeedbackTargetDeclaration.targetCareerDecisionContextRevisionId);
    for (const field of [
      "bindingState", "targetState", "receiverState", "eligibilityState", "acceptanceState",
      "materializationState", "membershipState", "currentState", "verificationState", "confidence", "score",
    ]) expect(unequalBinding).not.toHaveProperty(field);
  });

  it("rejects invalid declarations and exact-reader failures without fallback, historical traversal, or a failure artifact", async () => {
    const api = await loadOutcomeValenceFeedbackTargetRevisionBinding();
    const value = createT13BHistoricalFixture();
    const invalidCalls: string[] = [];
    await expect(api.createBoundCareerOutcomeValenceFeedbackTargetRevisionBinder(
      reader(value.targetCareerDecisionContextRevision, invalidCalls),
    ).bind({ ...value.outcomeValenceFeedbackTargetDeclaration, declaredAt: "not-a-time" }, value.bindingInput))
      .rejects.toThrow(invalidDeclaration);
    expect(invalidCalls).toEqual([]);

    await expect(api.createBoundCareerOutcomeValenceFeedbackTargetRevisionBinder(reader(null, [])).bind(
      value.outcomeValenceFeedbackTargetDeclaration, value.bindingInput,
    )).rejects.toThrow(targetNotFound);
    const readerFailure = new Error("ERR_EXACT_READER_UNAVAILABLE");
    await expect(api.createBoundCareerOutcomeValenceFeedbackTargetRevisionBinder(reader(null, [], readerFailure)).bind(
      value.outcomeValenceFeedbackTargetDeclaration, value.bindingInput,
    )).rejects.toBe(readerFailure);
    await expect(api.createBoundCareerOutcomeValenceFeedbackTargetRevisionBinder(reader({
      ...value.targetCareerDecisionContextRevision,
      careerDecisionContextRevisionId: value.context.careerDecisionContextRevisionId,
    }, [])).bind(value.outcomeValenceFeedbackTargetDeclaration, value.bindingInput)).rejects.toThrow(invalidRevision);
    await expect(api.createBoundCareerOutcomeValenceFeedbackTargetRevisionBinder(reader({
      ...value.targetCareerDecisionContextRevision,
      schemaVersion: "BAD",
    }, [])).bind(value.outcomeValenceFeedbackTargetDeclaration, value.bindingInput)).rejects.toThrow(invalidRevision);
  });

  it("detaches across the await boundary and freezes standalone deterministic identity without reader, generic, legacy, persistence, or replay authority", async () => {
    const api = await loadOutcomeValenceFeedbackTargetRevisionBinding();
    const value = createT13BHistoricalFixture();
    let resolve!: (target: unknown) => void;
    const calls: string[] = [];
    const pendingReader = {
      getCareerDecisionContextRevisionById(id: string) {
        calls.push(id);
        return new Promise<unknown>(done => { resolve = done; });
      },
    };
    const originalTargetId = value.outcomeValenceFeedbackTargetDeclaration.targetCareerDecisionContextRevisionId;
    const operation = api.createBoundCareerOutcomeValenceFeedbackTargetRevisionBinder(pendingReader)
      .bind(value.outcomeValenceFeedbackTargetDeclaration, value.bindingInput);
    value.outcomeValenceFeedbackTargetDeclaration.targetCareerDecisionContextRevisionId = "DCTXREV_FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF";
    value.outcomeValenceFeedbackTargetDeclaration.decisionSubjects[0].sourceEvolutionInputItemOrdinal = 99;
    const returned = structuredClone(value.targetCareerDecisionContextRevision);
    resolve(returned);
    const binding = await operation;
    const pristine = structuredClone(binding);
    (returned.contextEvidenceRefs as string[])[0] = "evidence://mutated-reader-return";
    (binding.targetCareerDecisionContextRevision.contextEvidenceRefs as string[])[0] = "evidence://mutated-binding";
    expect(calls).toEqual([originalTargetId]);
    expect(pristine.careerOutcomeValenceFeedbackTargetDeclaration.targetCareerDecisionContextRevisionId).toBe(originalTargetId);
    expect(pristine.targetCareerDecisionContextRevision.contextEvidenceRefs).toEqual([
      "evidence://outcome-valence-feedback-target-revision-binding/t13b/base",
    ]);

    const laterCreatedAt = await api.createBoundCareerOutcomeValenceFeedbackTargetRevisionBinder(
      reader(createT13BHistoricalFixture().targetCareerDecisionContextRevision, []),
    ).bind(createT13BHistoricalFixture().outcomeValenceFeedbackTargetDeclaration, {
      createdAt: "2027-02-10T02:00:00.000Z",
    });
    expect(laterCreatedAt.careerOutcomeValenceFeedbackTargetRevisionBindingId)
      .toBe(pristine.careerOutcomeValenceFeedbackTargetRevisionBindingId);
    const identityPayload = [
      schema,
      canonical(semantic(pristine.careerOutcomeValenceFeedbackTargetDeclaration)),
      canonical(semantic(pristine.targetCareerDecisionContextRevision)),
    ];
    expect(api.stableCareerOutcomeValenceFeedbackTargetRevisionBinding(identityPayload))
      .toBe(JSON.stringify(identityPayload));
    api.assertCareerOutcomeValenceFeedbackTargetRevisionBinding(pristine);
    expect(calls).toEqual([originalTargetId]);
    expect(() => api.assertCareerOutcomeValenceFeedbackTargetRevisionBinding({
      ...pristine,
      careerOutcomeValenceFeedbackTargetRevisionBindingId: "COVFTRB_00000000000000000000000000000000",
    })).toThrow(idMismatch);
    expect(() => api.assertCareerOutcomeValenceFeedbackTargetRevisionBinding({
      ...pristine,
      careerOutcomeValenceFeedbackTargetDeclaration: { ...pristine.careerOutcomeValenceFeedbackTargetDeclaration, declaredAt: "bad" },
    })).toThrow(invalid);
    expect(() => api.assertCareerOutcomeValenceFeedbackTargetRevisionBinding({
      ...pristine,
      targetCareerDecisionContextRevision: { ...pristine.targetCareerDecisionContextRevision, schemaVersion: "bad" },
    })).toThrow(invalid);
    expect(Object.keys(api)).not.toEqual(expect.arrayContaining([
      "persistCareerOutcomeValenceFeedbackTargetRevisionBinding",
      "replayCareerOutcomeValenceFeedbackTargetRevisionBinding",
      "resolveCurrentCareerDecisionContextRevision",
    ]));
  });

  it("makes complete COVFTD and complete returned DCTXREV semantic state identity-bearing while excluding reader identity", async () => {
    const api = await loadOutcomeValenceFeedbackTargetRevisionBinding();
    const value = createT13BHistoricalFixture();
    const first = await api.createBoundCareerOutcomeValenceFeedbackTargetRevisionBinder(
      reader(value.targetCareerDecisionContextRevision, []),
    ).bind(value.outcomeValenceFeedbackTargetDeclaration, value.bindingInput);
    const changedTargetDeclaration = createCareerOutcomeValenceFeedbackTargetDeclaration(
      value.outcomeValenceFeedbackAdmissionDeclaration,
      {
        ...value.outcomeValenceFeedbackTargetDeclarationInput,
        targetCareerDecisionContextRevisionId: value.targetCareerDecisionContextRevision.careerDecisionContextRevisionId,
        targetSelectionEvidenceRefs: ["evidence://outcome-valence-feedback-target-revision-binding/t13b/changed"],
      },
    );
    const changedDeclaration = await api.createBoundCareerOutcomeValenceFeedbackTargetRevisionBinder(
      reader(value.targetCareerDecisionContextRevision, []),
    ).bind(changedTargetDeclaration, value.bindingInput);
    const changedTargetRevision = createCareerDecisionContextRevision(value.authority, value.proposal, {
      decisionAuthorityGrantRevisionId: value.authority.decisionAuthorityGrantRevisionId,
      recommendationProposalId: value.proposal.recommendationProposalId,
      decisionSubjects: value.context.decisionSubjects,
      contextEvidenceRefs: ["evidence://outcome-valence-feedback-target-revision-binding/t13b/changed-target"],
      createdAt: "2027-02-10T03:00:00.000Z",
    });
    const changedTargetCOVFTD = createCareerOutcomeValenceFeedbackTargetDeclaration(
      value.outcomeValenceFeedbackAdmissionDeclaration,
      {
        ...value.outcomeValenceFeedbackTargetDeclarationInput,
        targetCareerDecisionContextRevisionId: changedTargetRevision.careerDecisionContextRevisionId,
      },
    );
    const changedRevision = await api.createBoundCareerOutcomeValenceFeedbackTargetRevisionBinder(
      reader(changedTargetRevision, []),
    ).bind(changedTargetCOVFTD, value.bindingInput);
    const sameStateDifferentReader = await api.createBoundCareerOutcomeValenceFeedbackTargetRevisionBinder({
      async getCareerDecisionContextRevisionById() { return structuredClone(value.targetCareerDecisionContextRevision); },
    }).bind(value.outcomeValenceFeedbackTargetDeclaration, value.bindingInput);
    expect(changedDeclaration.careerOutcomeValenceFeedbackTargetRevisionBindingId)
      .not.toBe(first.careerOutcomeValenceFeedbackTargetRevisionBindingId);
    expect(changedRevision.careerOutcomeValenceFeedbackTargetRevisionBindingId)
      .not.toBe(first.careerOutcomeValenceFeedbackTargetRevisionBindingId);
    expect(sameStateDifferentReader.careerOutcomeValenceFeedbackTargetRevisionBindingId)
      .toBe(first.careerOutcomeValenceFeedbackTargetRevisionBindingId);
  });
});
