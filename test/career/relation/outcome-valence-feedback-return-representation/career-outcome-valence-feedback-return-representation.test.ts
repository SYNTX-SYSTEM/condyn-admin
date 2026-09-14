import { describe, expect, it } from "vitest";
import { createT13CHistoricalFixture } from "./t13c-historical-fixture";

const loadCareerOutcomeValenceFeedbackReturnRepresentation = () =>
  import("../../../../lib/career/relation/outcome-valence-feedback-return-representation") as Promise<any>;

const schema = "CAREER_OUTCOME_VALENCE_FEEDBACK_RETURN_REPRESENTATION_V1";
const bindingInvalid = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_RETURN_REPRESENTATION_TARGET_REVISION_BINDING_INVALID";
const invalid = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_RETURN_REPRESENTATION_INVALID";
const idMismatch = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_RETURN_REPRESENTATION_ID_MISMATCH";

const artifactKeys = [
  "careerOutcomeValenceFeedbackReturnRepresentationId",
  "careerOutcomeValenceFeedbackTargetRevisionBinding",
  "representedFeedback",
  "schemaVersion",
  "createdAt",
] as const;
const payloadKeys = [
  "feedbackKind",
  "stateSubject",
  "stateDimension",
  "beforeObservation",
  "afterObservation",
  "observedAt",
  "valence",
] as const;
const apiKeys = [
  "CAREER_OUTCOME_VALENCE_FEEDBACK_RETURN_REPRESENTATION_SCHEMA_VERSION",
  "assertCareerOutcomeValenceFeedbackReturnRepresentation",
  "createCareerOutcomeValenceFeedbackReturnRepresentation",
  "deriveCareerOutcomeValenceFeedbackReturnRepresentationId",
  "stableCareerOutcomeValenceFeedbackReturnRepresentation",
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

describe("CareerOutcomeValenceFeedbackReturnRepresentation frozen Domain contract", () => {
  it("constructs sealed history through a standalone-valid COVFTRB independently", async () => {
    const value = await createT13CHistoricalFixture();
    expect(value.careerOutcomeValenceFeedbackTargetRevisionBinding
      .careerOutcomeValenceFeedbackTargetDeclaration.targetCareerDecisionContextRevisionId)
      .toBe(value.targetCareerDecisionContextRevision.careerDecisionContextRevisionId);
    expect(value.careerOutcomeValenceFeedbackTargetRevisionBinding
      .careerOutcomeValenceFeedbackTargetDeclaration.careerDecisionContextRevisionId)
      .not.toBe(value.targetCareerDecisionContextRevision.careerDecisionContextRevisionId);
  });

  it("requires explicit pure creator invocation rather than creating a representation from COVFTRB existence", async () => {
    const api = await loadCareerOutcomeValenceFeedbackReturnRepresentation();
    const value = await createT13CHistoricalFixture();
    expect(value.careerOutcomeValenceFeedbackTargetRevisionBinding)
      .not.toHaveProperty("careerOutcomeValenceFeedbackReturnRepresentation");
    expect(() => api.createCareerOutcomeValenceFeedbackReturnRepresentation(
      value.careerOutcomeValenceFeedbackTargetRevisionBinding,
      { createdAt: "bad" },
    )).toThrow(invalid);
  });

  it("explicitly projects the exact seven-field structured feedback body into the exact five-field artifact", async () => {
    const api = await loadCareerOutcomeValenceFeedbackReturnRepresentation();
    const value = await createT13CHistoricalFixture();
    const representation = api.createCareerOutcomeValenceFeedbackReturnRepresentation(
      value.careerOutcomeValenceFeedbackTargetRevisionBinding,
      value.representationInput,
    );
    const binding = value.careerOutcomeValenceFeedbackTargetRevisionBinding;

    expect(Object.keys(representation)).toEqual(artifactKeys);
    expect(Object.keys(representation.representedFeedback)).toEqual(payloadKeys);
    expect(representation.schemaVersion).toBe(schema);
    expect(representation.careerOutcomeValenceFeedbackReturnRepresentationId)
      .toMatch(/^COVFRR_[0-9A-F]{32}$/);
    expect(representation.careerOutcomeValenceFeedbackTargetRevisionBinding).toEqual(binding);
    expect(representation.representedFeedback).toEqual({
      feedbackKind: "OUTCOME_VALENCE_FEEDBACK",
      stateSubject: binding.careerOutcomeValenceFeedbackTargetDeclaration.stateSubject,
      stateDimension: binding.careerOutcomeValenceFeedbackTargetDeclaration.stateDimension,
      beforeObservation: binding.careerOutcomeValenceFeedbackTargetDeclaration.beforeObservation,
      afterObservation: binding.careerOutcomeValenceFeedbackTargetDeclaration.afterObservation,
      observedAt: binding.careerOutcomeValenceFeedbackTargetDeclaration.observedAt,
      valence: binding.careerOutcomeValenceFeedbackTargetDeclaration.valence,
    });
    expect(Object.keys(api).sort()).toEqual([...apiKeys].sort());
  });

  it("represents every sealed subjective valence without leaking provenance, target, actor, admission, action, or decision-subject fields", async () => {
    const api = await loadCareerOutcomeValenceFeedbackReturnRepresentation();
    for (const valence of ["DESIRABLE", "UNDESIRABLE", "NEUTRAL", "UNRESOLVED"] as const) {
      const value = await createT13CHistoricalFixture(valence);
      const representation = api.createCareerOutcomeValenceFeedbackReturnRepresentation(
        value.careerOutcomeValenceFeedbackTargetRevisionBinding,
        value.representationInput,
      );
      expect(representation.representedFeedback.valence).toBe(valence);
      for (const excluded of [
        "careerOutcomeValenceFeedbackTargetRevisionBindingId", "careerOutcomeValenceFeedbackTargetDeclarationId",
        "careerOutcomeValenceFeedbackAdmissionDeclarationId", "careerOutcomeValenceDeclarationId",
        "careerOutcomeRoleDeclarationId", "careerActionStateChangeAssociationDeclarationId",
        "careerStateChangeDeclarationId", "careerActionOccurrenceId", "careerExecutionContextRevisionId",
        "careerExecutionAuthorityGrantRevisionId", "careerHumanCommitmentId", "careerDecisionActionIntentId",
        "humanDecisionRecordId", "careerDecisionContextRevisionId", "decisionAuthorityGrantRevisionId",
        "recommendationProposalId", "decisionSubjects", "sourceDeclarationClass", "sourceActionIntentClass",
        "operationDescription", "executionAuthorityScope", "executionTarget", "executionChannel", "actionOccurredAt",
        "observedByActorId", "performedByActorId", "associationDeclaredByActorId", "outcomeRoleDeclaredByActorId",
        "outcomeValenceDeclaredByActorId", "admittedByActorId", "admissionState", "admittedAt",
        "targetCareerDecisionContextRevisionId", "targetSelectionEvidenceRefs",
      ]) expect(representation.representedFeedback).not.toHaveProperty(excluded);
    }
  });

  it("makes complete COVFTRB and the exact canonical payload identity-bearing while excluding every audit-only createdAt and detaching all nested state", async () => {
    const api = await loadCareerOutcomeValenceFeedbackReturnRepresentation();
    const value = await createT13CHistoricalFixture();
    const first = api.createCareerOutcomeValenceFeedbackReturnRepresentation(
      value.careerOutcomeValenceFeedbackTargetRevisionBinding,
      value.representationInput,
    );
    const later = api.createCareerOutcomeValenceFeedbackReturnRepresentation(
      structuredClone(value.careerOutcomeValenceFeedbackTargetRevisionBinding),
      { createdAt: "2027-02-11T02:00:00.000Z" },
    );
    expect(later.careerOutcomeValenceFeedbackReturnRepresentationId)
      .toBe(first.careerOutcomeValenceFeedbackReturnRepresentationId);
    expect(api.deriveCareerOutcomeValenceFeedbackReturnRepresentationId({
      careerOutcomeValenceFeedbackTargetRevisionBinding: semantic(first.careerOutcomeValenceFeedbackTargetRevisionBinding),
      representedFeedback: canonical(first.representedFeedback),
      schemaVersion: first.schemaVersion,
    })).toBe(first.careerOutcomeValenceFeedbackReturnRepresentationId);
    const stablePayload = [
      schema,
      canonical(semantic(first.careerOutcomeValenceFeedbackTargetRevisionBinding)),
      canonical(first.representedFeedback),
    ];
    expect(api.stableCareerOutcomeValenceFeedbackReturnRepresentation(stablePayload))
      .toBe(JSON.stringify(stablePayload));

    const pristine = structuredClone(first);
    (value.careerOutcomeValenceFeedbackTargetRevisionBinding.careerOutcomeValenceFeedbackTargetDeclaration
      .stateSubject as { subjectRef: string }).subjectRef = "mutated-caller";
    (first.representedFeedback.stateSubject as { subjectRef: string }).subjectRef = "mutated-representation";
    expect(pristine.representedFeedback.stateSubject.subjectRef).not.toBe("mutated-caller");
    expect(pristine.careerOutcomeValenceFeedbackTargetRevisionBinding
      .careerOutcomeValenceFeedbackTargetDeclaration.stateSubject.subjectRef)
      .not.toBe("mutated-representation");
  });

  it("asserts only the exact canonical projection and stops before reader, repository, readiness, materialization, membership, revision, generic, legacy, or outcome-truth authority", async () => {
    const api = await loadCareerOutcomeValenceFeedbackReturnRepresentation();
    const value = await createT13CHistoricalFixture();
    const representation = api.createCareerOutcomeValenceFeedbackReturnRepresentation(
      value.careerOutcomeValenceFeedbackTargetRevisionBinding,
      value.representationInput,
    );
    api.assertCareerOutcomeValenceFeedbackReturnRepresentation(representation);
    expect(() => api.createCareerOutcomeValenceFeedbackReturnRepresentation({
      ...value.careerOutcomeValenceFeedbackTargetRevisionBinding,
      createdAt: "bad",
    }, value.representationInput)).toThrow(bindingInvalid);
    expect(() => api.assertCareerOutcomeValenceFeedbackReturnRepresentation({
      ...representation,
      representedFeedback: { ...representation.representedFeedback, feedbackKind: "OBSERVATION" },
    })).toThrow(invalid);
    expect(() => api.assertCareerOutcomeValenceFeedbackReturnRepresentation({
      ...representation,
      representedFeedback: { ...representation.representedFeedback, valence: "NEUTRAL" },
    })).toThrow(invalid);
    expect(() => api.assertCareerOutcomeValenceFeedbackReturnRepresentation({
      ...representation,
      careerOutcomeValenceFeedbackReturnRepresentationId: "COVFRR_00000000000000000000000000000000",
    })).toThrow(idMismatch);
    expect(Object.keys(api)).not.toEqual(expect.arrayContaining([
      "getCareerDecisionContextRevisionById", "persistCareerOutcomeValenceFeedbackReturnRepresentation",
      "replayCareerOutcomeValenceFeedbackReturnRepresentation", "createCareerOutcomeValenceFeedbackMaterializationReadiness",
      "materializeCareerOutcomeValenceFeedback", "transitionCareerDecisionContext",
      "resolveCurrentCareerDecisionContextRevision", "createGenericDecisionContextObservationItemProjection",
      "createFeedbackRecord", "createLearningProposal",
    ]));
  });
});
