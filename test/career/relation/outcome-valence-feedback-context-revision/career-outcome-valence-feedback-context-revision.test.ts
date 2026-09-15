import { describe, expect, it } from "vitest";
import { createT13GHistoricalFixture } from "./t13g-historical-fixture";

const loadCareerOutcomeValenceFeedbackContextRevision = () =>
  import("../../../../lib/career/relation/outcome-valence-feedback-context-revision") as Promise<any>;

const schema = "CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION_V1";
const transitionInvalid = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION_TRANSITION_INVALID";
const parentInvalid = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION_PARENT_INVALID";
const parentModeMismatch = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION_PARENT_MODE_MISMATCH";
const parentContentMismatch = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION_PARENT_CONTENT_MISMATCH";
const baseMismatch = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION_BASE_MISMATCH";
const invalid = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION_INVALID";
const idMismatch = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION_ID_MISMATCH";

const rootKeys = [
  "careerOutcomeValenceFeedbackContextRevisionId",
  "parent",
  "careerOutcomeValenceFeedbackContextTransition",
  "schemaVersion",
  "createdAt",
] as const;

const apiKeys = [
  "CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION_SCHEMA_VERSION",
  "assertCareerOutcomeValenceFeedbackContextRevision",
  "createCareerOutcomeValenceFeedbackContextRevision",
  "deriveCareerOutcomeValenceFeedbackContextRevisionId",
  "stableCareerOutcomeValenceFeedbackContextRevision",
] as const;

function semantic(value: Record<string, unknown>) {
  const { createdAt: _createdAt, ...body } = structuredClone(value);
  return body;
}

describe("CareerOutcomeValenceFeedbackContextRevision frozen Domain contract", () => {
  it("constructs sealed first and subsequent transition history independently", async () => {
    const value = await createT13GHistoricalFixture();
    expect(value.first.previousFeedbackContextContent).toBeNull();
    expect(value.subsequent.previousFeedbackContextContent).toEqual(value.contentX);
    expect(value.subsequent.resultingFeedbackContextContent).toEqual(value.contentXY);
    expect(value.otherBaseFirst.baseCareerDecisionContextRevision).toEqual(value.alternateBase);
  });

  it("requires explicit revision construction with the exact public API and five-field first envelope", async () => {
    const api = await loadCareerOutcomeValenceFeedbackContextRevision();
    const value = await createT13GHistoricalFixture();
    expect(api.CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION_SCHEMA_VERSION).toBe(schema);
    expect(Object.keys(api)).toEqual(expect.arrayContaining(apiKeys));
    const revision = api.createCareerOutcomeValenceFeedbackContextRevision(
      value.firstParent,
      value.first,
      value.revisionInput,
    );
    expect(Object.keys(revision).sort()).toEqual([...rootKeys].sort());
    expect(revision.schemaVersion).toBe(schema);
    expect(revision.careerOutcomeValenceFeedbackContextRevisionId).toMatch(/^COVFCR_[0-9A-F]{32}$/);
    expect(revision.parent).toEqual(value.firstParent);
    expect(Object.keys(revision.parent).sort()).toEqual(["parentRevisionId", "parentRevisionKind"]);
    expect(revision.careerOutcomeValenceFeedbackContextTransition).toEqual(value.first);
    expect(revision).not.toHaveProperty("feedbackContextContent");
    expect(revision).not.toHaveProperty("resultingFeedbackContextContent");
  });

  it("binds a subsequent typed parent content witness without recursively embedding a parent revision", async () => {
    const api = await loadCareerOutcomeValenceFeedbackContextRevision();
    const value = await createT13GHistoricalFixture();
    const revision = api.createCareerOutcomeValenceFeedbackContextRevision(
      value.subsequentParent,
      value.subsequent,
      value.revisionInput,
    );
    expect(Object.keys(revision.parent).sort()).toEqual([
      "parentFeedbackContextContent", "parentRevisionId", "parentRevisionKind",
    ]);
    expect(revision.parent.parentFeedbackContextContent).toEqual(value.contentX);
    expect(revision.parent).not.toHaveProperty("revision");
    expect(revision.careerOutcomeValenceFeedbackContextTransition.resultingFeedbackContextContent)
      .toEqual(value.contentXY);
    expect(revision).not.toHaveProperty("current");
    expect(revision).not.toHaveProperty("latest");
    expect(revision).not.toHaveProperty("head");
  });

  it("preserves standalone-invalid precedence and locally classifies reachable parent compatibility failures", async () => {
    const api = await loadCareerOutcomeValenceFeedbackContextRevision();
    const value = await createT13GHistoricalFixture();
    expect(() => api.createCareerOutcomeValenceFeedbackContextRevision(value.firstParent, {}, value.revisionInput))
      .toThrow(transitionInvalid);
    expect(() => api.createCareerOutcomeValenceFeedbackContextRevision(
      { parentRevisionKind: "CAREER_DECISION_CONTEXT_REVISION", parentRevisionId: "not-a-dctxrev" },
      value.first,
      value.revisionInput,
    )).toThrow(parentInvalid);
    expect(() => api.createCareerOutcomeValenceFeedbackContextRevision(
      { parentRevisionKind: "CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION", parentRevisionId: "not-a-covfcr" },
      value.subsequent,
      value.revisionInput,
    )).toThrow(parentInvalid);
    expect(() => api.createCareerOutcomeValenceFeedbackContextRevision(value.subsequentParent, value.first, value.revisionInput))
      .toThrow(parentModeMismatch);
    expect(() => api.createCareerOutcomeValenceFeedbackContextRevision(value.firstParent, value.subsequent, value.revisionInput))
      .toThrow(parentModeMismatch);
    expect(() => api.createCareerOutcomeValenceFeedbackContextRevision({
      ...value.firstParent,
      parentRevisionId: value.alternateBase.careerDecisionContextRevisionId,
    }, value.first, value.revisionInput)).toThrow(baseMismatch);
    expect(() => api.createCareerOutcomeValenceFeedbackContextRevision({
      ...value.subsequentParent,
      parentFeedbackContextContent: value.contentY,
    }, value.subsequent, value.revisionInput)).toThrow(parentContentMismatch);
    // A valid parent content with a different base cannot equal the sealed transition previous content, so BASE_MISMATCH is unreachable after PARENT_CONTENT_MISMATCH.
  });

  it("makes typed lineage and complete transition semantics identity-bearing while excluding audit-only time", async () => {
    const api = await loadCareerOutcomeValenceFeedbackContextRevision();
    const value = await createT13GHistoricalFixture();
    const first = api.createCareerOutcomeValenceFeedbackContextRevision(value.firstParent, value.first, value.revisionInput);
    const firstLaterAudit = api.createCareerOutcomeValenceFeedbackContextRevision(
      value.firstParent,
      value.first,
      { createdAt: "2027-02-15T03:00:00.000Z" },
    );
    const branch = api.createCareerOutcomeValenceFeedbackContextRevision({
      ...value.subsequentParent,
      parentRevisionId: "COVFCR_33333333333333333333333333333333",
    }, value.subsequent, value.revisionInput);
    const alternate = api.createCareerOutcomeValenceFeedbackContextRevision(
      value.alternateSubsequentParent,
      value.subsequentAlternate,
      value.revisionInput,
    );
    expect(firstLaterAudit.careerOutcomeValenceFeedbackContextRevisionId)
      .toBe(first.careerOutcomeValenceFeedbackContextRevisionId);
    expect(branch.careerOutcomeValenceFeedbackContextRevisionId)
      .not.toBe(api.createCareerOutcomeValenceFeedbackContextRevision(value.subsequentParent, value.subsequent, value.revisionInput)
        .careerOutcomeValenceFeedbackContextRevisionId);
    expect(alternate.careerOutcomeValenceFeedbackContextRevisionId).not.toBe(branch.careerOutcomeValenceFeedbackContextRevisionId);
    expect(api.deriveCareerOutcomeValenceFeedbackContextRevisionId({
      parent: semantic(first.parent),
      careerOutcomeValenceFeedbackContextTransition: semantic(first.careerOutcomeValenceFeedbackContextTransition),
      schemaVersion: schema,
    })).toBe(first.careerOutcomeValenceFeedbackContextRevisionId);
  });

  it("detaches and locally asserts revisions without repository, persistence, replay, validation, eligibility, or authority leakage", async () => {
    const api = await loadCareerOutcomeValenceFeedbackContextRevision();
    const value = await createT13GHistoricalFixture();
    const first = api.createCareerOutcomeValenceFeedbackContextRevision(value.firstParent, value.first, value.revisionInput);
    const pristine = structuredClone(first);
    value.first.baseCareerDecisionContextRevision.contextEvidenceRefs[0] = "mutated-caller-base";
    expect(pristine.careerOutcomeValenceFeedbackContextTransition.baseCareerDecisionContextRevision.contextEvidenceRefs[0])
      .not.toBe("mutated-caller-base");
    api.assertCareerOutcomeValenceFeedbackContextRevision(pristine);
    expect(() => api.assertCareerOutcomeValenceFeedbackContextRevision({
      ...pristine,
      careerOutcomeValenceFeedbackContextRevisionId: "COVFCR_00000000000000000000000000000000",
    })).toThrow(idMismatch);
    expect(() => api.assertCareerOutcomeValenceFeedbackContextRevision({
      ...pristine,
      parent: undefined,
    })).toThrow(invalid);
    expect(Object.keys(api)).not.toEqual(expect.arrayContaining([
      "getCareerOutcomeValenceFeedbackContextRevisionById",
      "persistCareerOutcomeValenceFeedbackContextRevision",
      "replayCareerOutcomeValenceFeedbackContextRevision",
      "createCareerOutcomeValenceFeedbackValidationAssembly",
      "createCareerOutcomeValenceFeedbackRevisionEligibility",
      "createCareerOutcomeValenceFeedbackRevisionCreation",
      "createFeedbackRecord",
      "createLearningProposal",
    ]));
  });
});
