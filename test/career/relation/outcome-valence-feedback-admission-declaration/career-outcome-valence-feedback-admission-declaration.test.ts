import { describe, expect, it } from "vitest";
import { createT12JHistoricalFixture } from "./t12j-historical-fixture";

const loadOutcomeValenceFeedbackAdmissionDeclaration = () =>
  import("../../../../lib/career/relation/outcome-valence-feedback-admission-declaration") as Promise<any>;
const invalid = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_ADMISSION_DECLARATION_INVALID";

function fixture() {
  return createT12JHistoricalFixture();
}

function input(value = fixture(), more: Record<string, unknown> = {}) {
  return { ...value.outcomeValenceFeedbackAdmissionDeclarationInput, ...more };
}

function create(api: any, value = fixture(), more: Record<string, unknown> = {}) {
  return api.createCareerOutcomeValenceFeedbackAdmissionDeclaration(
    value.outcomeValenceDeclaration,
    input(value, more),
  );
}

const artifactKeys = [
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
  "admissionEvidenceRefs",
  "admissionState",
  "schemaVersion",
  "createdAt",
] as const;

const identityPayloadOrder = [
  "CAREER_OUTCOME_VALENCE_FEEDBACK_ADMISSION_DECLARATION_V1",
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
  "canonicalAdmissionEvidenceRefs",
  "ADMITTED",
] as const;

describe("T12J CareerOutcomeValenceFeedbackAdmissionDeclaration domain contract", () => {
  it("constructs sealed RCP through COVD history before the T12J boundary", () => {
    const value = fixture();
    expect(value.outcomeValenceDeclaration.careerOutcomeRoleDeclarationId)
      .toBe(value.outcomeRoleDeclaration.careerOutcomeRoleDeclarationId);
    expect(value.outcomeValenceDeclaration.careerActionStateChangeAssociationDeclarationId)
      .toBe(value.associationDeclaration.careerActionStateChangeAssociationDeclarationId);
    expect(value.occurrence.occurredAt < value.grant.effectiveUntil!).toBe(true);
    expect(value.stateChangeDeclaration.observedAt > value.grant.effectiveUntil!).toBe(true);
    expect(value.associationDeclaration.declaredAt > value.grant.effectiveUntil!).toBe(true);
    expect(value.outcomeRoleDeclaration.declaredAt > value.grant.effectiveUntil!).toBe(true);
    expect(value.outcomeValenceDeclaration.declaredAt > value.grant.effectiveUntil!).toBe(true);
    expect(value.outcomeValenceFeedbackAdmissionDeclarationInput.admittedAt > value.grant.effectiveUntil!).toBe(true);
    expect(value.outcomeValenceFeedbackAdmissionDeclarationInput.admittedAt > value.outcomeValenceDeclaration.declaredAt).toBe(true);
    expect(identityPayloadOrder.filter(item => item === "CAREER_OUTCOME_VALENCE_FEEDBACK_ADMISSION_DECLARATION_V1")).toHaveLength(1);
    expect(identityPayloadOrder.at(-1)).toBe("ADMITTED");
  });

  it("creates exactly the frozen 42-field positive admission by copying only COVD history", async () => {
    const api = await loadOutcomeValenceFeedbackAdmissionDeclaration();
    const value = fixture();
    const declaration = create(api, value);
    expect(artifactKeys).toHaveLength(42);
    expect(Object.keys(declaration).sort()).toEqual([...artifactKeys].sort());
    expect(declaration).toMatchObject({
      careerOutcomeValenceDeclarationId: value.outcomeValenceDeclaration.careerOutcomeValenceDeclarationId,
      careerOutcomeRoleDeclarationId: value.outcomeValenceDeclaration.careerOutcomeRoleDeclarationId,
      careerActionStateChangeAssociationDeclarationId: value.outcomeValenceDeclaration.careerActionStateChangeAssociationDeclarationId,
      careerStateChangeDeclarationId: value.outcomeValenceDeclaration.careerStateChangeDeclarationId,
      careerActionOccurrenceId: value.outcomeValenceDeclaration.careerActionOccurrenceId,
      careerExecutionContextRevisionId: value.outcomeValenceDeclaration.careerExecutionContextRevisionId,
      careerExecutionAuthorityGrantRevisionId: value.outcomeValenceDeclaration.careerExecutionAuthorityGrantRevisionId,
      careerHumanCommitmentId: value.outcomeValenceDeclaration.careerHumanCommitmentId,
      careerDecisionActionIntentId: value.outcomeValenceDeclaration.careerDecisionActionIntentId,
      humanDecisionRecordId: value.outcomeValenceDeclaration.humanDecisionRecordId,
      careerDecisionContextRevisionId: value.outcomeValenceDeclaration.careerDecisionContextRevisionId,
      decisionAuthorityGrantRevisionId: value.outcomeValenceDeclaration.decisionAuthorityGrantRevisionId,
      recommendationProposalId: value.outcomeValenceDeclaration.recommendationProposalId,
      performedByActorId: value.outcomeValenceDeclaration.performedByActorId,
      observedByActorId: value.outcomeValenceDeclaration.observedByActorId,
      associationDeclaredByActorId: value.outcomeValenceDeclaration.associationDeclaredByActorId,
      outcomeRoleDeclaredByActorId: value.outcomeValenceDeclaration.outcomeRoleDeclaredByActorId,
      outcomeValenceDeclaredByActorId: value.outcomeValenceDeclaration.declaredByActorId,
      decisionSubjects: value.outcomeValenceDeclaration.decisionSubjects,
      sourceDeclarationClass: value.outcomeValenceDeclaration.sourceDeclarationClass,
      sourceActionIntentClass: value.outcomeValenceDeclaration.sourceActionIntentClass,
      operationDescription: value.outcomeValenceDeclaration.operationDescription,
      executionAuthorityScope: value.outcomeValenceDeclaration.executionAuthorityScope,
      executionTarget: value.outcomeValenceDeclaration.executionTarget,
      executionChannel: value.outcomeValenceDeclaration.executionChannel,
      actionOccurredAt: value.outcomeValenceDeclaration.actionOccurredAt,
      stateSubject: value.outcomeValenceDeclaration.stateSubject,
      stateDimension: value.outcomeValenceDeclaration.stateDimension,
      beforeObservation: value.outcomeValenceDeclaration.beforeObservation,
      afterObservation: value.outcomeValenceDeclaration.afterObservation,
      observedAt: value.outcomeValenceDeclaration.observedAt,
      associationDeclaredAt: value.outcomeValenceDeclaration.associationDeclaredAt,
      outcomeRoleDeclaredAt: value.outcomeValenceDeclaration.outcomeRoleDeclaredAt,
      outcomeValenceDeclaredAt: value.outcomeValenceDeclaration.declaredAt,
      valence: value.outcomeValenceDeclaration.valence,
      admittedByActorId: "OUTCOME_VALENCE_ADMITTING_ACTOR_T12J",
      admittedAt: "2027-02-08T01:00:00.000Z",
      admissionEvidenceRefs: [
        "evidence://outcome-valence-feedback-admission/t12j/a",
        "evidence://outcome-valence-feedback-admission/t12j/b",
      ],
      admissionState: "ADMITTED",
      schemaVersion: "CAREER_OUTCOME_VALENCE_FEEDBACK_ADMISSION_DECLARATION_V1",
    });
    expect(declaration.careerOutcomeValenceFeedbackAdmissionDeclarationId).toMatch(/^COVFAD_[0-9A-F]{32}$/);
    expect(declaration).not.toHaveProperty("valenceEvidenceRefs");
    expect(declaration).not.toHaveProperty("outcomeValenceCreatedAt");
  });

  it("accepts only exact COVD plus the five-field positive human admission input", async () => {
    const api = await loadOutcomeValenceFeedbackAdmissionDeclaration();
    const value = fixture();
    expect(Object.keys(input(value)).sort()).toEqual([
      "careerOutcomeValenceDeclarationId", "admittedByActorId", "admittedAt", "admissionEvidenceRefs", "createdAt",
    ].sort());
    for (const forbidden of [
      "careerOutcomeRoleDeclarationId", "careerActionStateChangeAssociationDeclarationId", "careerStateChangeDeclarationId",
      "careerActionOccurrenceId", "careerExecutionContextRevisionId", "careerExecutionAuthorityGrantRevisionId",
      "careerHumanCommitmentId", "careerDecisionActionIntentId", "humanDecisionRecordId", "careerDecisionContextRevisionId",
      "decisionAuthorityGrantRevisionId", "recommendationProposalId", "performedByActorId", "observedByActorId",
      "associationDeclaredByActorId", "outcomeRoleDeclaredByActorId", "outcomeValenceDeclaredByActorId", "decisionSubjects",
      "sourceDeclarationClass", "sourceActionIntentClass", "operationDescription", "executionAuthorityScope", "executionTarget",
      "executionChannel", "actionOccurredAt", "stateSubject", "stateDimension", "beforeObservation", "afterObservation",
      "observedAt", "associationDeclaredAt", "outcomeRoleDeclaredAt", "outcomeValenceDeclaredAt", "valence", "valenceEvidenceRefs",
      "admissionState", "schemaVersion", "rationale", "reason", "comment", "note", "targetDecisionContextRevisionId",
      "targetContextId", "receivingContextId", "receiverActorId", "targetPolicyRevisionId", "bindingId", "membershipId",
      "verified", "truth", "effect", "result", "success", "failure", "evaluation", "satisfaction", "learning",
      "attribution", "causality", "confidence", "score",
    ]) expect(() => create(api, value, { [forbidden]: "caller-override" })).toThrow(invalid);
    expect(() => create(api, value, {
      careerOutcomeValenceDeclarationId: "COVD_00000000000000000000000000000000",
    })).toThrow(invalid);
    expect(() => create(api, {
      ...value,
      outcomeValenceDeclaration: {
        ...value.outcomeValenceDeclaration,
        careerOutcomeRoleDeclarationId: "CORD_00000000000000000000000000000000",
      },
    })).toThrow(invalid);
  });

  it("requires independent human admission, exact ADMITTED state, chronology, and canonical independent evidence", async () => {
    const api = await loadOutcomeValenceFeedbackAdmissionDeclaration();
    const value = fixture();
    const declaration = create(api, value);
    expect(declaration.admissionState).toBe("ADMITTED");
    expect(declaration.admittedByActorId).not.toBe(value.occurrence.performedByActorId);
    expect(declaration.admittedByActorId).not.toBe(value.stateChangeDeclaration.observedByActorId);
    expect(declaration.admittedByActorId).not.toBe(value.associationDeclaration.declaredByActorId);
    expect(declaration.admittedByActorId).not.toBe(value.outcomeRoleDeclaration.declaredByActorId);
    expect(declaration.admittedByActorId).not.toBe(value.outcomeValenceDeclaration.declaredByActorId);
    expect(create(api, value, { admittedAt: value.outcomeValenceDeclaration.declaredAt }).admittedAt)
      .toBe(value.outcomeValenceDeclaration.declaredAt);
    expect(create(api, value, { admittedAt: "2027-03-01T01:00:00.000Z" }).admittedAt)
      .toBe("2027-03-01T01:00:00.000Z");
    for (const more of [
      { admittedByActorId: "" }, { admittedByActorId: " " }, { admittedAt: "not-iso" },
      { admittedAt: "2027-02-07T00:59:59.999Z" }, { admissionEvidenceRefs: [] }, { admissionEvidenceRefs: [" "] },
      { admissionEvidenceRefs: ["evidence://x", " evidence://x "] },
    ]) expect(() => create(api, value, more)).toThrow(invalid);
    expect(() => api.assertCareerOutcomeValenceFeedbackAdmissionDeclaration({
      ...declaration,
      admissionState: "REJECTED",
    })).toThrow(invalid);
    expect(() => api.assertCareerOutcomeValenceFeedbackAdmissionDeclaration({
      ...declaration,
      admissionEvidenceRefs: [
        "evidence://outcome-valence-feedback-admission/t12j/b",
        "evidence://outcome-valence-feedback-admission/t12j/a",
      ],
    })).toThrow(invalid);
  });

  it("derives standalone COVFAD identity from one leading schema sentinel and every semantic field except createdAt", async () => {
    const api = await loadOutcomeValenceFeedbackAdmissionDeclaration();
    const declaration = create(api);
    const semantic = { ...declaration } as any;
    delete semantic.careerOutcomeValenceFeedbackAdmissionDeclarationId;
    delete semantic.createdAt;
    expect(api.deriveCareerOutcomeValenceFeedbackAdmissionDeclarationId(semantic))
      .toBe(declaration.careerOutcomeValenceFeedbackAdmissionDeclarationId);
    expect(create(api, fixture(), { createdAt: "2030-01-01T00:00:00.000Z" }).careerOutcomeValenceFeedbackAdmissionDeclarationId)
      .toBe(declaration.careerOutcomeValenceFeedbackAdmissionDeclarationId);
    for (const [field, changed] of [
      ["careerOutcomeValenceDeclarationId", "COVD_00000000000000000000000000000000"],
      ["careerOutcomeRoleDeclarationId", "CORD_00000000000000000000000000000000"],
      ["careerActionStateChangeAssociationDeclarationId", "ASCAD_00000000000000000000000000000000"],
      ["careerStateChangeDeclarationId", "SCD_00000000000000000000000000000000"],
      ["careerActionOccurrenceId", "AOC_00000000000000000000000000000000"],
      ["careerExecutionContextRevisionId", "ECTXREV_00000000000000000000000000000000"],
      ["careerExecutionAuthorityGrantRevisionId", "EAGR_00000000000000000000000000000000"],
      ["careerHumanCommitmentId", "HCOM_00000000000000000000000000000000"],
      ["careerDecisionActionIntentId", "DAINT_00000000000000000000000000000000"],
      ["humanDecisionRecordId", "DCR_00000000000000000000000000000000"],
      ["careerDecisionContextRevisionId", "DCTXREV_00000000000000000000000000000000"],
      ["decisionAuthorityGrantRevisionId", "DAR_00000000000000000000000000000000"],
      ["recommendationProposalId", "RCP_00000000000000000000000000000000"],
      ["performedByActorId", "OTHER_PERFORMER"], ["observedByActorId", "OTHER_OBSERVER"],
      ["associationDeclaredByActorId", "OTHER_ASSOCIATION_DECLARANT"],
      ["outcomeRoleDeclaredByActorId", "OTHER_ROLE_DECLARANT"], ["outcomeValenceDeclaredByActorId", "OTHER_VALENCE_DECLARANT"],
      ["decisionSubjects", [...declaration.decisionSubjects].reverse()],
      ["sourceDeclarationClass", "REJECT_RECOMMENDATION"],
      ["sourceActionIntentClass", "FURTHER_EVIDENCE_REQUEST_OPERATIONALIZATION"],
      ["operationDescription", "other operation"], ["executionAuthorityScope", "FURTHER_EVIDENCE_REQUEST_EXECUTION"],
      ["executionTarget", { targetKind: "SYSTEM", targetRef: "target://other" }],
      ["executionChannel", { channelKind: "API", channelRef: "channel://other" }],
      ["actionOccurredAt", "2027-02-03T01:00:01.000Z"],
      ["stateSubject", { subjectKind: "SYSTEM", subjectRef: "state://other" }], ["stateDimension", "other-dimension"],
      ["beforeObservation", { observationState: "OBSERVED", value: "other-before" }],
      ["afterObservation", { observationState: "OBSERVED", value: "other-after" }],
      ["observedAt", "2027-02-04T02:00:00.000Z"], ["associationDeclaredAt", "2027-02-05T02:00:00.000Z"],
      ["outcomeRoleDeclaredAt", "2027-02-06T02:00:00.000Z"], ["outcomeValenceDeclaredAt", "2027-02-07T02:00:00.000Z"],
      ["valence", "UNDESIRABLE"], ["admittedByActorId", "OTHER_ADMITTING_ACTOR"],
      ["admittedAt", "2027-02-08T02:00:00.000Z"], ["admissionEvidenceRefs", ["evidence://other"]],
    ] as const) {
      const changedId = api.deriveCareerOutcomeValenceFeedbackAdmissionDeclarationId({ ...semantic, [field]: changed });
      expect(changedId).toMatch(/^COVFAD_[0-9A-F]{32}$/);
      expect(changedId).not.toBe(declaration.careerOutcomeValenceFeedbackAdmissionDeclarationId);
    }
    expect(() => api.deriveCareerOutcomeValenceFeedbackAdmissionDeclarationId({
      ...semantic,
      admissionState: "REJECTED",
    })).toThrow(invalid);
  });

  it("requires canonical detached standalone state and exposes no target, mutation, automatic, or stronger authority", async () => {
    const api = await loadOutcomeValenceFeedbackAdmissionDeclaration();
    const value = fixture();
    const declaration = create(api, value);
    for (const mutation of [
      { careerOutcomeValenceFeedbackAdmissionDeclarationId: "COVFAD_00000000000000000000000000000000" },
      { schemaVersion: "CAREER_OUTCOME_VALENCE_FEEDBACK_ADMISSION_DECLARATION_V0" }, { createdAt: "not-iso" },
      { admittedByActorId: " OUTCOME_VALENCE_ADMITTING_ACTOR_T12J " }, { admittedAt: " not-iso " }, { unknown: "field" },
    ]) expect(() => api.assertCareerOutcomeValenceFeedbackAdmissionDeclaration({ ...declaration, ...mutation })).toThrow(invalid);
    declaration.decisionSubjects.pop();
    declaration.executionTarget.targetRef = "local";
    declaration.executionChannel.channelRef = "local";
    declaration.stateSubject.subjectRef = "local";
    declaration.beforeObservation.value = "local";
    declaration.afterObservation.value = "local";
    declaration.admissionEvidenceRefs.pop();
    expect(value.outcomeValenceDeclaration.decisionSubjects).toHaveLength(2);
    expect(value.outcomeValenceDeclaration.executionTarget.targetRef).not.toBe("local");
    expect(create(api, value).stateSubject.subjectRef).toBe(value.outcomeValenceDeclaration.stateSubject.subjectRef);
    for (const forbidden of [
      "getCurrentCareerOutcomeValenceFeedbackAdmissionDeclaration",
      "getLatestCareerOutcomeValenceFeedbackAdmissionDeclaration",
      "createAutomatically",
      "regenerateCareerOutcomeValenceFeedbackAdmissionDeclaration",
      "repairCareerOutcomeValenceFeedbackAdmissionDeclaration",
      "replaceCareerOutcomeValenceFeedbackAdmissionDeclaration",
      "selectFeedbackTarget",
      "bindFeedbackTarget",
      "createContextRevision",
      "createLearningSignal",
      "createFeedback",
      "createDecisionAssessmentRequest",
      "createDecisionContextObservationAdmissionDeclaration",
      "createOutcomeAttributionProposal",
    ]) expect(api).not.toHaveProperty(forbidden);
  });
});
