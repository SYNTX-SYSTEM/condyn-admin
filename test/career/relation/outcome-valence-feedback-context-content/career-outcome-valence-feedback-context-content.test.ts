import { describe, expect, it } from "vitest";
import {
  createCareerOutcomeValenceFeedbackReturnItem,
} from "../../../../lib/career/relation/outcome-valence-feedback-return-item";
import { createT13DHistoricalFixture } from "../outcome-valence-feedback-return-item/t13d-historical-fixture";
import { createT13EHistoricalFixture } from "./t13e-historical-fixture";

const loadCareerOutcomeValenceFeedbackContextContent = () =>
  import("../../../../lib/career/relation/outcome-valence-feedback-context-content") as Promise<any>;

const schema = "CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_CONTENT_V1";
const baseInvalid = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_CONTENT_BASE_INVALID";
const memberInvalid = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_CONTENT_MEMBER_INVALID";
const baseMismatch = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_CONTENT_BASE_MISMATCH";
const duplicateMember = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_CONTENT_DUPLICATE_MEMBER";
const emptyMemberInventory = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_CONTENT_EMPTY_MEMBER_INVENTORY";
const invalid = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_CONTENT_INVALID";
const idMismatch = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_CONTENT_ID_MISMATCH";

const artifactKeys = [
  "careerOutcomeValenceFeedbackContextContentId",
  "baseCareerDecisionContextRevision",
  "feedbackReturnItems",
  "schemaVersion",
  "createdAt",
] as const;
const apiKeys = [
  "CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_CONTENT_SCHEMA_VERSION",
  "assertCareerOutcomeValenceFeedbackContextContent",
  "createCareerOutcomeValenceFeedbackContextContent",
  "deriveCareerOutcomeValenceFeedbackContextContentId",
  "stableCareerOutcomeValenceFeedbackContextContent",
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

describe("CareerOutcomeValenceFeedbackContextContent frozen Domain contract", () => {
  it("constructs sealed predecessors through a matching base and standalone COVFRI independently", async () => {
    const value = await createT13EHistoricalFixture();
    expect(value.firstFeedbackReturnItem.careerOutcomeValenceFeedbackReturnRepresentation
      .careerOutcomeValenceFeedbackTargetRevisionBinding.targetCareerDecisionContextRevision)
      .toEqual(value.baseCareerDecisionContextRevision);
    expect(value.firstFeedbackReturnItem.careerOutcomeValenceFeedbackReturnRepresentation.representedFeedback)
      .toEqual(value.secondFeedbackReturnItem.careerOutcomeValenceFeedbackReturnRepresentation.representedFeedback);
    expect(value.firstFeedbackReturnItem.careerOutcomeValenceFeedbackReturnItemId)
      .not.toBe(value.secondFeedbackReturnItem.careerOutcomeValenceFeedbackReturnItemId);
  });

  it("requires explicit construction of a nonempty feedback-bearing content state rather than deriving one from a base or item alone", async () => {
    const api = await loadCareerOutcomeValenceFeedbackContextContent();
    const value = await createT13EHistoricalFixture();
    expect(value.baseCareerDecisionContextRevision).not.toHaveProperty("feedbackReturnItems");
    expect(value.firstFeedbackReturnItem).not.toHaveProperty("careerOutcomeValenceFeedbackContextContent");
    expect(() => api.createCareerOutcomeValenceFeedbackContextContent(
      value.baseCareerDecisionContextRevision,
      [],
      value.contentInput,
    )).toThrow(emptyMemberInventory);
  });

  it("constructs the exact five-field target-scoped content state with complete base and canonical complete item members only", async () => {
    const api = await loadCareerOutcomeValenceFeedbackContextContent();
    const value = await createT13EHistoricalFixture();
    const content = api.createCareerOutcomeValenceFeedbackContextContent(
      value.baseCareerDecisionContextRevision,
      [value.firstFeedbackReturnItem],
      value.contentInput,
    );
    expect(Object.keys(content)).toEqual(artifactKeys);
    expect(content.schemaVersion).toBe(schema);
    expect(content.careerOutcomeValenceFeedbackContextContentId).toMatch(/^COVFCC_[0-9A-F]{32}$/);
    expect(content.baseCareerDecisionContextRevision).toEqual(value.baseCareerDecisionContextRevision);
    expect(content.feedbackReturnItems).toEqual([value.firstFeedbackReturnItem]);
    for (const excluded of [
      "itemKind", "targetCareerDecisionContextRevisionId", "receiver", "actor", "policy", "status",
      "readiness", "eligibility", "acceptance", "transition", "parentRevisionId", "previousRevisionId",
      "childRevisionId", "revisionId", "validationState", "deliveryState", "learningState", "current",
      "latest", "head", "score", "confidence",
    ]) expect(content).not.toHaveProperty(excluded);
    expect(Object.keys(api).sort()).toEqual([...apiKeys].sort());
  });

  it("enforces exact base provenance, unique canonical item inventory, and semantic identity independent of caller ordering or audit-only times", async () => {
    const api = await loadCareerOutcomeValenceFeedbackContextContent();
    const value = await createT13EHistoricalFixture();
    const first = value.firstFeedbackReturnItem;
    const second = value.secondFeedbackReturnItem;
    const ordered = api.createCareerOutcomeValenceFeedbackContextContent(
      value.baseCareerDecisionContextRevision,
      [first, second],
      value.contentInput,
    );
    const reversed = api.createCareerOutcomeValenceFeedbackContextContent(
      value.baseCareerDecisionContextRevision,
      [second, first],
      { createdAt: "2027-02-13T02:00:00.000Z" },
    );
    expect(ordered.feedbackReturnItems.map((item: any) => item.careerOutcomeValenceFeedbackReturnItemId))
      .toEqual([...ordered.feedbackReturnItems]
        .map((item: any) => item.careerOutcomeValenceFeedbackReturnItemId).sort());
    expect(reversed.feedbackReturnItems).toEqual(ordered.feedbackReturnItems);
    expect(reversed.careerOutcomeValenceFeedbackContextContentId)
      .toBe(ordered.careerOutcomeValenceFeedbackContextContentId);
    expect(() => api.createCareerOutcomeValenceFeedbackContextContent(
      value.baseCareerDecisionContextRevision, [first, first], value.contentInput,
    )).toThrow(duplicateMember);
    expect(() => api.createCareerOutcomeValenceFeedbackContextContent(
      { ...value.baseCareerDecisionContextRevision, careerDecisionContextRevisionId: "DCTXREV_wrong" },
      [first], value.contentInput,
    )).toThrow(baseInvalid);
    expect(() => api.createCareerOutcomeValenceFeedbackContextContent(
      {
        ...value.baseCareerDecisionContextRevision,
        contextEvidenceRefs: ["evidence://substituted-with-same-id"],
      },
      [first], value.contentInput,
    )).toThrow(baseInvalid);
    const independentlyValidOtherTarget = await createT13DHistoricalFixture("DESIRABLE", true);
    const otherItem = createCareerOutcomeValenceFeedbackReturnItem(
      independentlyValidOtherTarget.careerOutcomeValenceFeedbackReturnRepresentation,
      independentlyValidOtherTarget.itemInput,
    );
    expect(() => api.createCareerOutcomeValenceFeedbackContextContent(
      value.baseCareerDecisionContextRevision, [otherItem], value.contentInput,
    )).toThrow(baseMismatch);
    expect(api.deriveCareerOutcomeValenceFeedbackContextContentId({
      baseCareerDecisionContextRevision: semantic(ordered.baseCareerDecisionContextRevision),
      feedbackReturnItems: ordered.feedbackReturnItems.map((item: Record<string, unknown>) => semantic(item)),
      schemaVersion: schema,
    })).toBe(ordered.careerOutcomeValenceFeedbackContextContentId);
    expect(api.deriveCareerOutcomeValenceFeedbackContextContentId({
      baseCareerDecisionContextRevision: {
        ...semantic(ordered.baseCareerDecisionContextRevision),
        contextEvidenceRefs: ["evidence://lawful-semantic-base-identity-sensitivity"],
      },
      feedbackReturnItems: ordered.feedbackReturnItems.map((item: Record<string, unknown>) => semantic(item)),
      schemaVersion: schema,
    })).not.toBe(ordered.careerOutcomeValenceFeedbackContextContentId);
    expect(api.deriveCareerOutcomeValenceFeedbackContextContentId({
      baseCareerDecisionContextRevision: semantic(ordered.baseCareerDecisionContextRevision),
      feedbackReturnItems: [
        {
          ...semantic(ordered.feedbackReturnItems[0]),
          careerOutcomeValenceFeedbackReturnItemId: "COVFRI_FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        },
        semantic(ordered.feedbackReturnItems[1]),
      ],
      schemaVersion: schema,
    })).toBe(ordered.careerOutcomeValenceFeedbackContextContentId);
    const independentlyValidOtherContent = api.createCareerOutcomeValenceFeedbackContextContent(
      independentlyValidOtherTarget.targetCareerDecisionContextRevision,
      [otherItem],
      value.contentInput,
    );
    expect(independentlyValidOtherContent.careerOutcomeValenceFeedbackContextContentId)
      .not.toBe(ordered.careerOutcomeValenceFeedbackContextContentId);
    const identityPayload = [
      schema,
      canonical(semantic(ordered.baseCareerDecisionContextRevision)),
      canonical(ordered.feedbackReturnItems.map((item: Record<string, unknown>) => semantic(item))),
    ];
    expect(api.stableCareerOutcomeValenceFeedbackContextContent(identityPayload))
      .toBe(JSON.stringify(identityPayload));
  });

  it("detaches and locally asserts content while classifying invalid base/member/root state and stale identity precisely", async () => {
    const api = await loadCareerOutcomeValenceFeedbackContextContent();
    const value = await createT13EHistoricalFixture();
    const content = api.createCareerOutcomeValenceFeedbackContextContent(
      value.baseCareerDecisionContextRevision,
      [value.firstFeedbackReturnItem],
      value.contentInput,
    );
    const pristine = structuredClone(content);
    value.baseCareerDecisionContextRevision.contextEvidenceRefs[0] = "mutated-caller-base";
    (value.firstFeedbackReturnItem.careerOutcomeValenceFeedbackReturnRepresentation.representedFeedback
      .beforeObservation as { value: string }).value = "mutated-caller-member";
    expect(pristine.baseCareerDecisionContextRevision.contextEvidenceRefs[0]).not.toBe("mutated-caller-base");
    expect(pristine.feedbackReturnItems[0].careerOutcomeValenceFeedbackReturnRepresentation.representedFeedback
      .beforeObservation.value).not.toBe("mutated-caller-member");
    api.assertCareerOutcomeValenceFeedbackContextContent(pristine);
    expect(() => api.createCareerOutcomeValenceFeedbackContextContent({}, [value.firstFeedbackReturnItem], value.contentInput))
      .toThrow(baseInvalid);
    expect(() => api.createCareerOutcomeValenceFeedbackContextContent(
      pristine.baseCareerDecisionContextRevision, [{}], value.contentInput,
    )).toThrow(memberInvalid);
    expect(() => api.createCareerOutcomeValenceFeedbackContextContent(
      pristine.baseCareerDecisionContextRevision,
      [{
        ...pristine.feedbackReturnItems[0],
        careerOutcomeValenceFeedbackReturnItemId: "COVFRI_FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
      }],
      value.contentInput,
    )).toThrow(memberInvalid);
    expect(() => api.assertCareerOutcomeValenceFeedbackContextContent({ ...pristine, createdAt: "bad" }))
      .toThrow(invalid);
    expect(() => api.assertCareerOutcomeValenceFeedbackContextContent({
      ...pristine,
      careerOutcomeValenceFeedbackContextContentId: "COVFCC_00000000000000000000000000000000",
    })).toThrow(idMismatch);
    expect(Object.keys(api)).not.toEqual(expect.arrayContaining([
      "getCareerDecisionContextRevisionById", "persistCareerOutcomeValenceFeedbackContextContent",
      "replayCareerOutcomeValenceFeedbackContextContent", "createCareerOutcomeValenceFeedbackReadiness",
      "createCareerOutcomeValenceFeedbackMembership", "transitionCareerDecisionContext",
      "createCareerDecisionContextRevision", "createFeedbackRecord", "createLearningProposal",
    ]));
  });

  it("retains unresolved valence as valid member content without readiness, transition, revision, persistence, or evaluation inference", async () => {
    const api = await loadCareerOutcomeValenceFeedbackContextContent();
    const value = await createT13EHistoricalFixture("UNRESOLVED");
    const content = api.createCareerOutcomeValenceFeedbackContextContent(
      value.baseCareerDecisionContextRevision,
      [value.firstFeedbackReturnItem],
      value.contentInput,
    );
    expect(content.feedbackReturnItems[0].careerOutcomeValenceFeedbackReturnRepresentation.representedFeedback.valence)
      .toBe("UNRESOLVED");
    for (const excluded of ["readinessState", "transition", "revision", "membershipState", "evaluationState"]) {
      expect(content).not.toHaveProperty(excluded);
    }
  });
});
