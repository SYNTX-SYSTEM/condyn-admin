import { describe, expect, it } from "vitest";
import { createT13AHistoricalFixture } from "./t13a-historical-fixture";

const loadOutcomeValenceFeedbackTargetDeclaration = () =>
  import("../../../../lib/career/relation/outcome-valence-feedback-target-declaration") as Promise<any>;
const invalid = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_DECLARATION_INVALID";

function fixture() {
  return createT13AHistoricalFixture();
}

function input(value = fixture(), more: Record<string, unknown> = {}) {
  return { ...value.outcomeValenceFeedbackTargetDeclarationInput, ...more };
}

function create(api: any, value = fixture(), more: Record<string, unknown> = {}) {
  return api.createCareerOutcomeValenceFeedbackTargetDeclaration(
    value.outcomeValenceFeedbackAdmissionDeclaration,
    input(value, more),
  );
}

const artifactKeys = [
  "careerOutcomeValenceFeedbackTargetDeclarationId",
  "careerOutcomeValenceFeedbackAdmissionDeclarationId",
  "careerOutcomeValenceDeclarationId",
  "careerOutcomeRoleDeclarationId",
  "careerActionStateChangeAssociationDeclarationId",
  "careerStateChangeDeclarationId",
  "careerActionOccurrenceId",
  "careerExecutionContextRevisionId",
  "careerExecutionAuthorityGrantRevisionId",
  "careerHumanCommitmentId",
  "careerDecisionActionIntentId",
  "humanDecisionRecordId",
  "careerDecisionContextRevisionId",
  "decisionAuthorityGrantRevisionId",
  "recommendationProposalId",
  "performedByActorId",
  "observedByActorId",
  "associationDeclaredByActorId",
  "outcomeRoleDeclaredByActorId",
  "outcomeValenceDeclaredByActorId",
  "decisionSubjects",
  "sourceDeclarationClass",
  "sourceActionIntentClass",
  "operationDescription",
  "executionAuthorityScope",
  "executionTarget",
  "executionChannel",
  "actionOccurredAt",
  "stateSubject",
  "stateDimension",
  "beforeObservation",
  "afterObservation",
  "observedAt",
  "associationDeclaredAt",
  "outcomeRoleDeclaredAt",
  "outcomeValenceDeclaredAt",
  "valence",
  "admittedByActorId",
  "admittedAt",
  "admissionState",
  "targetCareerDecisionContextRevisionId",
  "declaredByActorId",
  "declaredAt",
  "targetSelectionEvidenceRefs",
  "schemaVersion",
  "createdAt",
] as const;

const identityPayloadOrder = [
  "CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_DECLARATION_V1",
  "careerOutcomeValenceFeedbackAdmissionDeclarationId",
  "careerOutcomeValenceDeclarationId",
  "careerOutcomeRoleDeclarationId",
  "careerActionStateChangeAssociationDeclarationId",
  "careerStateChangeDeclarationId",
  "careerActionOccurrenceId",
  "careerExecutionContextRevisionId",
  "careerExecutionAuthorityGrantRevisionId",
  "careerHumanCommitmentId",
  "careerDecisionActionIntentId",
  "humanDecisionRecordId",
  "careerDecisionContextRevisionId",
  "decisionAuthorityGrantRevisionId",
  "recommendationProposalId",
  "performedByActorId",
  "observedByActorId",
  "associationDeclaredByActorId",
  "outcomeRoleDeclaredByActorId",
  "outcomeValenceDeclaredByActorId",
  "canonicalDecisionSubjects",
  "sourceDeclarationClass",
  "sourceActionIntentClass",
  "operationDescription",
  "executionAuthorityScope",
  "executionTarget",
  "executionChannel",
  "actionOccurredAt",
  "stateSubject",
  "stateDimension",
  "beforeObservation",
  "afterObservation",
  "observedAt",
  "associationDeclaredAt",
  "outcomeRoleDeclaredAt",
  "outcomeValenceDeclaredAt",
  "valence",
  "admittedByActorId",
  "admittedAt",
  "ADMITTED",
  "targetCareerDecisionContextRevisionId",
  "declaredByActorId",
  "declaredAt",
  "canonicalTargetSelectionEvidenceRefs",
] as const;

describe("T13A CareerOutcomeValenceFeedbackTargetDeclaration domain contract", () => {
  it("constructs sealed RCP through COVFAD history before the T13A boundary", () => {
    const value = fixture();
    const admission = value.outcomeValenceFeedbackAdmissionDeclaration;
    expect(admission.careerOutcomeValenceDeclarationId)
      .toBe(value.outcomeValenceDeclaration.careerOutcomeValenceDeclarationId);
    expect(admission.careerOutcomeRoleDeclarationId)
      .toBe(value.outcomeRoleDeclaration.careerOutcomeRoleDeclarationId);
    expect(value.occurrence.occurredAt < value.grant.effectiveUntil!).toBe(true);
    expect(admission.admittedAt > value.grant.effectiveUntil!).toBe(true);
    expect(value.outcomeValenceFeedbackTargetDeclarationInput.declaredAt > admission.admittedAt).toBe(true);
    expect(identityPayloadOrder.filter(item => item === "CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_DECLARATION_V1"))
      .toHaveLength(1);
    // Admission owns ADMITTED; target declaration is existence-only, not a second lifecycle.
    expect(artifactKeys).not.toContain("declarationState");
  });

  it("creates exactly the frozen 46-field target declaration by copying COVFAD witnesses", async () => {
    const api = await loadOutcomeValenceFeedbackTargetDeclaration();
    const value = fixture();
    const admission = value.outcomeValenceFeedbackAdmissionDeclaration;
    const declaration = create(api, value);
    expect(artifactKeys).toHaveLength(46);
    expect(Object.keys(declaration).sort()).toEqual([...artifactKeys].sort());
    expect(declaration).toMatchObject({
      careerOutcomeValenceFeedbackAdmissionDeclarationId:
        admission.careerOutcomeValenceFeedbackAdmissionDeclarationId,
      careerOutcomeValenceDeclarationId: admission.careerOutcomeValenceDeclarationId,
      careerOutcomeRoleDeclarationId: admission.careerOutcomeRoleDeclarationId,
      careerActionStateChangeAssociationDeclarationId:
        admission.careerActionStateChangeAssociationDeclarationId,
      careerStateChangeDeclarationId: admission.careerStateChangeDeclarationId,
      careerActionOccurrenceId: admission.careerActionOccurrenceId,
      careerExecutionContextRevisionId: admission.careerExecutionContextRevisionId,
      careerExecutionAuthorityGrantRevisionId: admission.careerExecutionAuthorityGrantRevisionId,
      careerHumanCommitmentId: admission.careerHumanCommitmentId,
      careerDecisionActionIntentId: admission.careerDecisionActionIntentId,
      humanDecisionRecordId: admission.humanDecisionRecordId,
      careerDecisionContextRevisionId: admission.careerDecisionContextRevisionId,
      decisionAuthorityGrantRevisionId: admission.decisionAuthorityGrantRevisionId,
      recommendationProposalId: admission.recommendationProposalId,
      performedByActorId: admission.performedByActorId,
      observedByActorId: admission.observedByActorId,
      associationDeclaredByActorId: admission.associationDeclaredByActorId,
      outcomeRoleDeclaredByActorId: admission.outcomeRoleDeclaredByActorId,
      outcomeValenceDeclaredByActorId: admission.outcomeValenceDeclaredByActorId,
      decisionSubjects: admission.decisionSubjects,
      sourceDeclarationClass: admission.sourceDeclarationClass,
      sourceActionIntentClass: admission.sourceActionIntentClass,
      operationDescription: admission.operationDescription,
      executionAuthorityScope: admission.executionAuthorityScope,
      executionTarget: admission.executionTarget,
      executionChannel: admission.executionChannel,
      actionOccurredAt: admission.actionOccurredAt,
      stateSubject: admission.stateSubject,
      stateDimension: admission.stateDimension,
      beforeObservation: admission.beforeObservation,
      afterObservation: admission.afterObservation,
      observedAt: admission.observedAt,
      associationDeclaredAt: admission.associationDeclaredAt,
      outcomeRoleDeclaredAt: admission.outcomeRoleDeclaredAt,
      outcomeValenceDeclaredAt: admission.outcomeValenceDeclaredAt,
      valence: admission.valence,
      admittedByActorId: admission.admittedByActorId,
      admittedAt: admission.admittedAt,
      admissionState: "ADMITTED",
      targetCareerDecisionContextRevisionId:
        "DCTXREV_0123456789ABCDEF0123456789ABCDEF",
      declaredByActorId: "OUTCOME_VALENCE_FEEDBACK_TARGET_DECLARING_ACTOR_T13A",
      declaredAt: "2027-02-09T01:00:00.000Z",
      targetSelectionEvidenceRefs: [
        "evidence://outcome-valence-feedback-target/t13a/a",
        "evidence://outcome-valence-feedback-target/t13a/b",
      ],
      schemaVersion: "CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_DECLARATION_V1",
    });
    expect(declaration.careerOutcomeValenceFeedbackTargetDeclarationId)
      .toMatch(/^COVFTD_[0-9A-F]{32}$/);
    expect(declaration).not.toHaveProperty("admissionEvidenceRefs");
    expect(declaration).not.toHaveProperty("admissionCreatedAt");
    expect(declaration).not.toHaveProperty("declarationState");
  });

  it("accepts only exact COVFAD plus the six-field human target reference without target lookup or binding", async () => {
    const api = await loadOutcomeValenceFeedbackTargetDeclaration();
    const value = fixture();
    expect(Object.keys(input(value)).sort()).toEqual([
      "careerOutcomeValenceFeedbackAdmissionDeclarationId",
      "targetCareerDecisionContextRevisionId",
      "declaredByActorId",
      "declaredAt",
      "targetSelectionEvidenceRefs",
      "createdAt",
    ].sort());
    for (const forbidden of [
      "careerOutcomeValenceDeclarationId", "careerOutcomeRoleDeclarationId", "careerDecisionContextRevisionId",
      "admissionEvidenceRefs", "admissionState", "schemaVersion", "declarationState", "rationale", "reason", "comment", "note",
      "targetContextId", "receivingContextId", "receiverActorId", "receiverId", "targetArtifactId", "targetKind", "receiverKind",
      "bindingId", "membershipId", "targetRevision", "targetPayload", "policy", "evaluationFrame",
      "verified", "truth", "effect", "result", "success", "failure", "evaluation", "criteria", "satisfaction", "learning",
      "attribution", "causality", "confidence", "score",
    ]) expect(() => create(api, value, { [forbidden]: "caller-override" })).toThrow(invalid);
    expect(() => create(api, value, {
      careerOutcomeValenceFeedbackAdmissionDeclarationId: "COVFAD_00000000000000000000000000000000",
    })).toThrow(invalid);
    expect(() => create(api, value, { targetCareerDecisionContextRevisionId: "DCTXREV_not-canonical" })).toThrow(invalid);
    expect(create(api, value, {
      targetCareerDecisionContextRevisionId: admissionHistoricalContext(value),
    }).targetCareerDecisionContextRevisionId).toBe(admissionHistoricalContext(value));
  });

  it("requires independent human declaration, chronology, and canonical target-selection evidence", async () => {
    const api = await loadOutcomeValenceFeedbackTargetDeclaration();
    const value = fixture();
    const admission = value.outcomeValenceFeedbackAdmissionDeclaration;
    const declaration = create(api, value);
    expect(declaration.declaredByActorId).not.toBe(admission.admittedByActorId);
    expect(declaration.declaredByActorId).not.toBe(value.outcomeValenceDeclaration.declaredByActorId);
    expect(declaration.declaredByActorId).not.toBe(value.outcomeRoleDeclaration.declaredByActorId);
    expect(declaration.declaredByActorId).not.toBe(value.associationDeclaration.declaredByActorId);
    expect(declaration.declaredByActorId).not.toBe(value.stateChangeDeclaration.observedByActorId);
    expect(declaration.declaredByActorId).not.toBe(value.occurrence.performedByActorId);
    expect(create(api, value, { declaredAt: admission.admittedAt }).declaredAt).toBe(admission.admittedAt);
    for (const more of [
      { declaredByActorId: "" }, { declaredByActorId: " " }, { declaredAt: "not-iso" },
      { declaredAt: "2027-02-08T00:59:59.999Z" }, { targetSelectionEvidenceRefs: [] },
      { targetSelectionEvidenceRefs: [" "] },
      { targetSelectionEvidenceRefs: ["evidence://same", " evidence://same "] },
    ]) expect(() => create(api, value, more)).toThrow(invalid);
  });

  it("derives standalone COVFTD identity from one leading schema sentinel and every semantic field except createdAt", async () => {
    const api = await loadOutcomeValenceFeedbackTargetDeclaration();
    const declaration = create(api);
    const semantic = { ...declaration } as any;
    delete semantic.careerOutcomeValenceFeedbackTargetDeclarationId;
    delete semantic.createdAt;
    expect(api.deriveCareerOutcomeValenceFeedbackTargetDeclarationId(semantic))
      .toBe(declaration.careerOutcomeValenceFeedbackTargetDeclarationId);
    expect(create(api, fixture(), { createdAt: "2030-01-01T00:00:00.000Z" })
      .careerOutcomeValenceFeedbackTargetDeclarationId)
      .toBe(declaration.careerOutcomeValenceFeedbackTargetDeclarationId);
    for (const [field, changed] of [
      ["careerOutcomeValenceFeedbackAdmissionDeclarationId", "COVFAD_00000000000000000000000000000000"],
      ["careerOutcomeValenceDeclarationId", "COVD_00000000000000000000000000000000"],
      ["careerDecisionContextRevisionId", "DCTXREV_00000000000000000000000000000000"],
      ["decisionSubjects", [...declaration.decisionSubjects].reverse()],
      ["admittedByActorId", "OTHER_ADMITTING_ACTOR"], ["admittedAt", "2027-02-08T02:00:00.000Z"],
      ["targetCareerDecisionContextRevisionId", "DCTXREV_11111111111111111111111111111111"],
      ["declaredByActorId", "OTHER_TARGET_DECLARANT"], ["declaredAt", "2027-02-09T02:00:00.000Z"],
      ["targetSelectionEvidenceRefs", ["evidence://other"]],
    ] as const) {
      const changedId = api.deriveCareerOutcomeValenceFeedbackTargetDeclarationId({ ...semantic, [field]: changed });
      expect(changedId).toMatch(/^COVFTD_[0-9A-F]{32}$/);
      expect(changedId).not.toBe(declaration.careerOutcomeValenceFeedbackTargetDeclarationId);
    }
    expect(() => api.deriveCareerOutcomeValenceFeedbackTargetDeclarationId({
      ...semantic,
      admissionState: "REJECTED",
    })).toThrow(invalid);
    expect(identityPayloadOrder.at(-1)).toBe("canonicalTargetSelectionEvidenceRefs");
  });

  it("requires canonical detached standalone state and exposes no receiver, revision, or stronger authority", async () => {
    const api = await loadOutcomeValenceFeedbackTargetDeclaration();
    const value = fixture();
    const declaration = create(api, value);
    for (const mutation of [
      { careerOutcomeValenceFeedbackTargetDeclarationId: "COVFTD_00000000000000000000000000000000" },
      { schemaVersion: "CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_DECLARATION_V0" }, { createdAt: "not-iso" },
      { declaredByActorId: " OUTCOME_VALENCE_FEEDBACK_TARGET_DECLARING_ACTOR_T13A " }, { unknown: "field" },
    ]) expect(() => api.assertCareerOutcomeValenceFeedbackTargetDeclaration({ ...declaration, ...mutation })).toThrow(invalid);
    declaration.decisionSubjects.pop();
    declaration.executionTarget.targetRef = "local";
    declaration.executionChannel.channelRef = "local";
    declaration.stateSubject.subjectRef = "local";
    declaration.beforeObservation.value = "local";
    declaration.afterObservation.value = "local";
    declaration.targetSelectionEvidenceRefs.pop();
    expect(value.outcomeValenceFeedbackAdmissionDeclaration.decisionSubjects).toHaveLength(2);
    expect(value.outcomeValenceFeedbackAdmissionDeclaration.executionTarget.targetRef).not.toBe("local");
    expect(create(api, value).stateSubject.subjectRef)
      .toBe(value.outcomeValenceFeedbackAdmissionDeclaration.stateSubject.subjectRef);
    for (const forbidden of [
      "getCurrentCareerOutcomeValenceFeedbackTargetDeclaration",
      "getLatestCareerOutcomeValenceFeedbackTargetDeclaration",
      "selectTargetAutomatically",
      "bindFeedbackTarget",
      "lookupTargetCareerDecisionContextRevision",
      "createContextRevision",
      "createContextMembership",
      "createLearningSignal",
      "createEvaluation",
      "createSatisfaction",
      "createAttribution",
      "createDecisionContextObservationAdmissionDeclaration",
      "createFeedbackRecord",
    ]) expect(api).not.toHaveProperty(forbidden);
  });
});

function admissionHistoricalContext(value: ReturnType<typeof fixture>) {
  return value.outcomeValenceFeedbackAdmissionDeclaration.careerDecisionContextRevisionId;
}
