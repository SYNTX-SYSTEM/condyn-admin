import { describe, expect, it } from "vitest";
import {
  createCareerOutcomeValenceFeedbackReturnRepresentation,
} from "../../../../lib/career/relation/outcome-valence-feedback-return-representation";
import { createT13DHistoricalFixture } from "./t13d-historical-fixture";

const loadCareerOutcomeValenceFeedbackReturnItem = () =>
  import("../../../../lib/career/relation/outcome-valence-feedback-return-item") as Promise<any>;

const schema = "CAREER_OUTCOME_VALENCE_FEEDBACK_RETURN_ITEM_V1";
const representationInvalid = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_RETURN_ITEM_REPRESENTATION_INVALID";
const invalid = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_RETURN_ITEM_INVALID";
const idMismatch = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_RETURN_ITEM_ID_MISMATCH";

const artifactKeys = [
  "careerOutcomeValenceFeedbackReturnItemId",
  "careerOutcomeValenceFeedbackReturnRepresentation",
  "schemaVersion",
  "createdAt",
] as const;
const apiKeys = [
  "CAREER_OUTCOME_VALENCE_FEEDBACK_RETURN_ITEM_SCHEMA_VERSION",
  "assertCareerOutcomeValenceFeedbackReturnItem",
  "createCareerOutcomeValenceFeedbackReturnItem",
  "deriveCareerOutcomeValenceFeedbackReturnItemId",
  "stableCareerOutcomeValenceFeedbackReturnItem",
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

describe("CareerOutcomeValenceFeedbackReturnItem frozen Domain contract", () => {
  it("constructs sealed history through a standalone-valid COVFRR independently", async () => {
    const value = await createT13DHistoricalFixture();
    expect(value.careerOutcomeValenceFeedbackReturnRepresentation.representedFeedback.feedbackKind)
      .toBe("OUTCOME_VALENCE_FEEDBACK");
    expect(value.careerOutcomeValenceFeedbackReturnRepresentation
      .careerOutcomeValenceFeedbackTargetRevisionBinding.targetCareerDecisionContextRevision)
      .toEqual(value.targetCareerDecisionContextRevision);
  });

  it("requires explicit item materialization rather than creating an item from COVFRR existence", async () => {
    const api = await loadCareerOutcomeValenceFeedbackReturnItem();
    const value = await createT13DHistoricalFixture();
    expect(value.careerOutcomeValenceFeedbackReturnRepresentation)
      .not.toHaveProperty("careerOutcomeValenceFeedbackReturnItem");
    expect(() => api.createCareerOutcomeValenceFeedbackReturnItem(
      value.careerOutcomeValenceFeedbackReturnRepresentation,
      { createdAt: "bad" },
    )).toThrow(invalid);
  });

  it("materializes the exact complete COVFRR into the exact four-field COVFRI without item kind, payload, target, membership, readiness, or status leakage", async () => {
    const api = await loadCareerOutcomeValenceFeedbackReturnItem();
    const value = await createT13DHistoricalFixture();
    const item = api.createCareerOutcomeValenceFeedbackReturnItem(
      value.careerOutcomeValenceFeedbackReturnRepresentation,
      value.itemInput,
    );
    expect(Object.keys(item)).toEqual(artifactKeys);
    expect(item.schemaVersion).toBe(schema);
    expect(item.careerOutcomeValenceFeedbackReturnItemId).toMatch(/^COVFRI_[0-9A-F]{32}$/);
    expect(item.careerOutcomeValenceFeedbackReturnRepresentation)
      .toEqual(value.careerOutcomeValenceFeedbackReturnRepresentation);
    for (const excluded of [
      "itemKind", "representedFeedback", "targetCareerDecisionContextRevisionId", "target", "membership",
      "member", "readiness", "eligibility", "status", "actor", "policy", "receiver", "contentItems",
      "parentCareerDecisionContextRevisionId", "transition",
    ]) expect(item).not.toHaveProperty(excluded);
    expect(Object.keys(api).sort()).toEqual([...apiKeys].sort());
  });

  it("makes complete semantic COVFRR provenance identity-bearing while excluding all audit-only createdAt values", async () => {
    const api = await loadCareerOutcomeValenceFeedbackReturnItem();
    const first = await createT13DHistoricalFixture();
    const laterRepresentation = createCareerOutcomeValenceFeedbackReturnRepresentation(
      first.careerOutcomeValenceFeedbackTargetRevisionBinding,
      { createdAt: "2027-02-12T02:00:00.000Z" },
    );
    const firstItem = api.createCareerOutcomeValenceFeedbackReturnItem(
      first.careerOutcomeValenceFeedbackReturnRepresentation,
      first.itemInput,
    );
    const laterItem = api.createCareerOutcomeValenceFeedbackReturnItem(laterRepresentation, {
      createdAt: "2027-02-12T03:00:00.000Z",
    });
    const differentProvenance = await createT13DHistoricalFixture("DESIRABLE", true);
    const differentItem = api.createCareerOutcomeValenceFeedbackReturnItem(
      differentProvenance.careerOutcomeValenceFeedbackReturnRepresentation,
      differentProvenance.itemInput,
    );
    expect(laterItem.careerOutcomeValenceFeedbackReturnItemId)
      .toBe(firstItem.careerOutcomeValenceFeedbackReturnItemId);
    expect(differentProvenance.careerOutcomeValenceFeedbackReturnRepresentation.representedFeedback)
      .toEqual(first.careerOutcomeValenceFeedbackReturnRepresentation.representedFeedback);
    expect(differentItem.careerOutcomeValenceFeedbackReturnItemId)
      .not.toBe(firstItem.careerOutcomeValenceFeedbackReturnItemId);
    expect(api.deriveCareerOutcomeValenceFeedbackReturnItemId({
      careerOutcomeValenceFeedbackReturnRepresentation: semantic(firstItem.careerOutcomeValenceFeedbackReturnRepresentation),
      schemaVersion: firstItem.schemaVersion,
    })).toBe(firstItem.careerOutcomeValenceFeedbackReturnItemId);
    const identityPayload = [
      schema,
      canonical(semantic(firstItem.careerOutcomeValenceFeedbackReturnRepresentation)),
    ];
    expect(api.stableCareerOutcomeValenceFeedbackReturnItem(identityPayload))
      .toBe(JSON.stringify(identityPayload));
  });

  it("detaches and asserts only item materialization, rejecting invalid representation, malformed root/nested state, stale ID, and every later authority", async () => {
    const api = await loadCareerOutcomeValenceFeedbackReturnItem();
    const value = await createT13DHistoricalFixture();
    const item = api.createCareerOutcomeValenceFeedbackReturnItem(
      value.careerOutcomeValenceFeedbackReturnRepresentation,
      value.itemInput,
    );
    const pristine = structuredClone(item);
    (value.careerOutcomeValenceFeedbackReturnRepresentation.representedFeedback.stateSubject as { subjectRef: string })
      .subjectRef = "mutated-caller";
    (item.careerOutcomeValenceFeedbackReturnRepresentation.representedFeedback.beforeObservation as { value: string })
      .value = "mutated-item";
    expect(pristine.careerOutcomeValenceFeedbackReturnRepresentation.representedFeedback.stateSubject.subjectRef)
      .not.toBe("mutated-caller");
    expect(pristine.careerOutcomeValenceFeedbackReturnRepresentation.representedFeedback.beforeObservation.value)
      .not.toBe("mutated-item");
    api.assertCareerOutcomeValenceFeedbackReturnItem(pristine);
    expect(() => api.createCareerOutcomeValenceFeedbackReturnItem({
      ...pristine.careerOutcomeValenceFeedbackReturnRepresentation,
      createdAt: "bad",
    }, value.itemInput)).toThrow(representationInvalid);
    expect(() => api.assertCareerOutcomeValenceFeedbackReturnItem({
      ...pristine,
      createdAt: "bad",
    })).toThrow(invalid);
    expect(() => api.assertCareerOutcomeValenceFeedbackReturnItem({
      ...pristine,
      careerOutcomeValenceFeedbackReturnRepresentation: {
        ...pristine.careerOutcomeValenceFeedbackReturnRepresentation,
        schemaVersion: "bad",
      },
    })).toThrow(invalid);
    expect(() => api.assertCareerOutcomeValenceFeedbackReturnItem({
      ...pristine,
      careerOutcomeValenceFeedbackReturnItemId: "COVFRI_00000000000000000000000000000000",
    })).toThrow(idMismatch);
    expect(Object.keys(api)).not.toEqual(expect.arrayContaining([
      "getCareerDecisionContextRevisionById", "persistCareerOutcomeValenceFeedbackReturnItem",
      "replayCareerOutcomeValenceFeedbackReturnItem", "createCareerOutcomeValenceFeedbackReadiness",
      "createCareerOutcomeValenceFeedbackMembership", "transitionCareerDecisionContext",
      "createDecisionContextItem", "createFeedbackRecord", "createLearningProposal",
    ]));
  });

  it("retains every valid nested valence without readiness, membership, or evaluation inference", async () => {
    const api = await loadCareerOutcomeValenceFeedbackReturnItem();
    for (const valence of ["DESIRABLE", "UNDESIRABLE", "NEUTRAL", "UNRESOLVED"] as const) {
      const value = await createT13DHistoricalFixture(valence);
      const item = api.createCareerOutcomeValenceFeedbackReturnItem(
        value.careerOutcomeValenceFeedbackReturnRepresentation,
        value.itemInput,
      );
      expect(item.careerOutcomeValenceFeedbackReturnRepresentation.representedFeedback.valence)
        .toBe(valence);
      expect(Object.keys(item)).not.toContain("readinessState");
      expect(Object.keys(item)).not.toContain("membershipState");
      expect(Object.keys(item)).not.toContain("evaluationState");
    }
  });
});
