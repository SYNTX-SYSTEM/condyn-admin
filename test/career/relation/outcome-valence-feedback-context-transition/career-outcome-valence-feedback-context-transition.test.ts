import { describe, expect, it } from "vitest";
import { createT13FHistoricalFixture } from "./t13f-historical-fixture";

const loadCareerOutcomeValenceFeedbackContextTransition = () =>
  import("../../../../lib/career/relation/outcome-valence-feedback-context-transition") as Promise<any>;

const schema = "CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_TRANSITION_V1";
const baseInvalid = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_TRANSITION_BASE_INVALID";
const previousInvalid = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_TRANSITION_PREVIOUS_INVALID";
const addedInvalid = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_TRANSITION_ADDED_MEMBER_INVALID";
const resultInvalid = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_TRANSITION_RESULT_INVALID";
const baseMismatch = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_TRANSITION_BASE_MISMATCH";
const alreadyPresent = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_TRANSITION_MEMBER_ALREADY_PRESENT";
const notPlusOne = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_TRANSITION_NOT_PLUS_ONE";
const priorMissing = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_TRANSITION_PRIOR_MEMBER_MISSING";
const unexpected = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_TRANSITION_UNEXPECTED_MEMBER";
const invalid = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_TRANSITION_INVALID";
const idMismatch = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_TRANSITION_ID_MISMATCH";

const artifactKeys = [
  "careerOutcomeValenceFeedbackContextTransitionId",
  "baseCareerDecisionContextRevision",
  "previousFeedbackContextContent",
  "addedFeedbackReturnItem",
  "resultingFeedbackContextContent",
  "schemaVersion",
  "createdAt",
] as const;
const apiKeys = [
  "CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_TRANSITION_SCHEMA_VERSION",
  "assertCareerOutcomeValenceFeedbackContextTransition",
  "createCareerOutcomeValenceFeedbackContextTransition",
  "deriveCareerOutcomeValenceFeedbackContextTransitionId",
  "stableCareerOutcomeValenceFeedbackContextTransition",
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

describe("CareerOutcomeValenceFeedbackContextTransition frozen Domain contract", () => {
  it("constructs sealed bases, items, and feedback content states independently", async () => {
    const value = await createT13FHistoricalFixture();
    expect(value.contentX.feedbackReturnItems).toEqual([value.x]);
    expect(value.contentXY.feedbackReturnItems).toEqual(
      [...value.contentXY.feedbackReturnItems].sort((left, right) =>
        left.careerOutcomeValenceFeedbackReturnItemId.localeCompare(right.careerOutcomeValenceFeedbackReturnItemId),
      ),
    );
    expect(value.z.careerOutcomeValenceFeedbackReturnRepresentation.careerOutcomeValenceFeedbackTargetRevisionBinding
      .targetCareerDecisionContextRevision).toEqual(value.alternateBaseCareerDecisionContextRevision);
  });

  it("requires explicit transition construction and preserves null only as the first-transition discriminator", async () => {
    const api = await loadCareerOutcomeValenceFeedbackContextTransition();
    const value = await createT13FHistoricalFixture();
    expect(value.contentX).not.toHaveProperty("careerOutcomeValenceFeedbackContextTransition");
    expect(() => api.createCareerOutcomeValenceFeedbackContextTransition(
      value.baseCareerDecisionContextRevision, null, value.x, value.contentX, { createdAt: "bad" },
    )).toThrow(invalid);
  });

  it("constructs exact seven-field first and subsequent append-one witnesses without transition, revision, readiness, or acceptance leakage", async () => {
    const api = await loadCareerOutcomeValenceFeedbackContextTransition();
    const value = await createT13FHistoricalFixture();
    const first = api.createCareerOutcomeValenceFeedbackContextTransition(
      value.baseCareerDecisionContextRevision, null, value.x, value.contentX, value.transitionInput,
    );
    const subsequent = api.createCareerOutcomeValenceFeedbackContextTransition(
      value.baseCareerDecisionContextRevision, value.contentX, value.y, value.contentXY,
      { createdAt: "2027-02-14T02:00:01.000Z" },
    );
    expect(Object.keys(first)).toEqual(artifactKeys);
    expect(first.schemaVersion).toBe(schema);
    expect(first.careerOutcomeValenceFeedbackContextTransitionId).toMatch(/^COVFCT_[0-9A-F]{32}$/);
    expect(first.previousFeedbackContextContent).toBeNull();
    expect(subsequent.previousFeedbackContextContent).toEqual(value.contentX);
    expect(subsequent.addedFeedbackReturnItem).toEqual(value.y);
    expect(subsequent.resultingFeedbackContextContent).toEqual(value.contentXY);
    for (const excluded of [
      "transitionKind", "firstTransition", "status", "authorityState", "actor", "declarant", "policy",
      "grant", "readiness", "validation", "parentRevisionId", "childRevisionId", "current", "latest", "head",
    ]) expect(first).not.toHaveProperty(excluded);
    expect(Object.keys(api).sort()).toEqual([...apiKeys].sort());
  });

  it("classifies standalone-invalid operands before valid relational failures and proves strict append-one preservation", async () => {
    const api = await loadCareerOutcomeValenceFeedbackContextTransition();
    const value = await createT13FHistoricalFixture();
    expect(() => api.createCareerOutcomeValenceFeedbackContextTransition({}, null, value.x, value.contentX, value.transitionInput))
      .toThrow(baseInvalid);
    expect(() => api.createCareerOutcomeValenceFeedbackContextTransition(
      value.baseCareerDecisionContextRevision, {}, value.x, value.contentX, value.transitionInput,
    )).toThrow(previousInvalid);
    expect(() => api.createCareerOutcomeValenceFeedbackContextTransition(
      value.baseCareerDecisionContextRevision, null, {}, value.contentX, value.transitionInput,
    )).toThrow(addedInvalid);
    expect(() => api.createCareerOutcomeValenceFeedbackContextTransition(
      value.baseCareerDecisionContextRevision, null, value.x, {}, value.transitionInput,
    )).toThrow(resultInvalid);
    expect(() => api.createCareerOutcomeValenceFeedbackContextTransition(
      value.baseCareerDecisionContextRevision, value.contentZ, value.x, value.contentX, value.transitionInput,
    )).toThrow(baseMismatch);
    expect(() => api.createCareerOutcomeValenceFeedbackContextTransition(
      value.baseCareerDecisionContextRevision, value.contentX, value.z, value.contentXY, value.transitionInput,
    )).toThrow(baseMismatch);
    expect(() => api.createCareerOutcomeValenceFeedbackContextTransition(
      value.baseCareerDecisionContextRevision, value.contentX, value.x, value.contentX, value.transitionInput,
    )).toThrow(alreadyPresent);
    expect(() => api.createCareerOutcomeValenceFeedbackContextTransition(
      value.baseCareerDecisionContextRevision, null, value.x, value.contentXY, value.transitionInput,
    )).toThrow(notPlusOne);
    expect(() => api.createCareerOutcomeValenceFeedbackContextTransition(
      value.baseCareerDecisionContextRevision, value.contentX, value.y, value.contentX, value.transitionInput,
    )).toThrow(notPlusOne);
    expect(() => api.createCareerOutcomeValenceFeedbackContextTransition(
      value.baseCareerDecisionContextRevision, value.contentXY, value.q, value.contentXQM, value.transitionInput,
    )).toThrow(priorMissing);
    expect(() => api.createCareerOutcomeValenceFeedbackContextTransition(
      value.baseCareerDecisionContextRevision, value.contentX, value.y, value.contentXQ, value.transitionInput,
    )).toThrow(unexpected);
    // Same-ID semantic substitution is unreachable without invalidating a sealed deterministic COVFRI witness.
  });

  it("makes complete semantic witnesses identity-bearing while excluding audit-only times and nested artifact-own IDs", async () => {
    const api = await loadCareerOutcomeValenceFeedbackContextTransition();
    const value = await createT13FHistoricalFixture();
    const first = api.createCareerOutcomeValenceFeedbackContextTransition(
      value.baseCareerDecisionContextRevision, null, value.x, value.contentX, value.transitionInput,
    );
    const sameFirstLaterAudit = api.createCareerOutcomeValenceFeedbackContextTransition(
      value.baseCareerDecisionContextRevision, null, value.x, value.contentX,
      { createdAt: "2027-02-14T03:00:00.000Z" },
    );
    const firstWithY = api.createCareerOutcomeValenceFeedbackContextTransition(
      value.baseCareerDecisionContextRevision, null, value.y, value.contentY, value.transitionInput,
    );
    const otherBase = api.createCareerOutcomeValenceFeedbackContextTransition(
      value.alternateBaseCareerDecisionContextRevision, null, value.z, value.contentZ, value.transitionInput,
    );
    const subsequent = api.createCareerOutcomeValenceFeedbackContextTransition(
      value.baseCareerDecisionContextRevision, value.contentX, value.y, value.contentXY, value.transitionInput,
    );
    expect(sameFirstLaterAudit.careerOutcomeValenceFeedbackContextTransitionId)
      .toBe(first.careerOutcomeValenceFeedbackContextTransitionId);
    expect(firstWithY.careerOutcomeValenceFeedbackContextTransitionId)
      .not.toBe(first.careerOutcomeValenceFeedbackContextTransitionId);
    expect(otherBase.careerOutcomeValenceFeedbackContextTransitionId)
      .not.toBe(first.careerOutcomeValenceFeedbackContextTransitionId);
    expect(subsequent.careerOutcomeValenceFeedbackContextTransitionId)
      .not.toBe(first.careerOutcomeValenceFeedbackContextTransitionId);
    expect(api.deriveCareerOutcomeValenceFeedbackContextTransitionId({
      baseCareerDecisionContextRevision: semantic(first.baseCareerDecisionContextRevision),
      previousFeedbackContextContent: null,
      addedFeedbackReturnItem: semantic(first.addedFeedbackReturnItem),
      resultingFeedbackContextContent: semantic(first.resultingFeedbackContextContent),
      schemaVersion: schema,
    })).toBe(first.careerOutcomeValenceFeedbackContextTransitionId);
    const identityPayload = [
      schema,
      canonical(semantic(first.baseCareerDecisionContextRevision)),
      "FIRST_TRANSITION_FROM_BASE",
      canonical(semantic(first.addedFeedbackReturnItem)),
      canonical(semantic(first.resultingFeedbackContextContent)),
    ];
    expect(api.stableCareerOutcomeValenceFeedbackContextTransition(identityPayload))
      .toBe(JSON.stringify(identityPayload));
  });

  it("detaches and locally asserts transitions without external, authority, validation, revision, persistence, replay, or legacy behavior", async () => {
    const api = await loadCareerOutcomeValenceFeedbackContextTransition();
    const value = await createT13FHistoricalFixture();
    const transition = api.createCareerOutcomeValenceFeedbackContextTransition(
      value.baseCareerDecisionContextRevision, null, value.x, value.contentX, value.transitionInput,
    );
    const pristine = structuredClone(transition);
    value.baseCareerDecisionContextRevision.contextEvidenceRefs[0] = "mutated-caller-base";
    (value.x.careerOutcomeValenceFeedbackReturnRepresentation.representedFeedback.beforeObservation as { value: string })
      .value = "mutated-caller-member";
    expect(pristine.baseCareerDecisionContextRevision.contextEvidenceRefs[0]).not.toBe("mutated-caller-base");
    expect(pristine.addedFeedbackReturnItem.careerOutcomeValenceFeedbackReturnRepresentation.representedFeedback
      .beforeObservation.value).not.toBe("mutated-caller-member");
    api.assertCareerOutcomeValenceFeedbackContextTransition(pristine);
    expect(() => api.assertCareerOutcomeValenceFeedbackContextTransition({
      ...pristine,
      careerOutcomeValenceFeedbackContextTransitionId: "COVFCT_00000000000000000000000000000000",
    })).toThrow(idMismatch);
    expect(() => api.assertCareerOutcomeValenceFeedbackContextTransition({
      ...pristine,
      previousFeedbackContextContent: undefined,
    })).toThrow(invalid);
    expect(Object.keys(api)).not.toEqual(expect.arrayContaining([
      "getCareerDecisionContextRevisionById", "persistCareerOutcomeValenceFeedbackContextTransition",
      "replayCareerOutcomeValenceFeedbackContextTransition", "createCareerOutcomeValenceFeedbackReadiness",
      "createCareerOutcomeValenceFeedbackValidationAssembly", "createCareerDecisionContextRevision",
      "createFeedbackRecord", "createLearningProposal",
    ]));
  });
});
