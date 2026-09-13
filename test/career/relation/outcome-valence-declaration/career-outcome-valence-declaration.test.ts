import { describe, expect, it } from "vitest";
import { createT12IHistoricalFixture } from "./t12i-historical-fixture";

const loadOutcomeValenceDeclaration = () =>
  import("../../../../lib/career/relation/outcome-valence-declaration") as Promise<any>;
const invalid = "ERR_CAREER_OUTCOME_VALENCE_DECLARATION_INVALID";

function fixture() {
  return createT12IHistoricalFixture();
}

function input(value = fixture(), more: Record<string, unknown> = {}) {
  return { ...value.outcomeValenceDeclarationInput, ...more };
}

function create(api: any, value = fixture(), more: Record<string, unknown> = {}) {
  return api.createCareerOutcomeValenceDeclaration(value.outcomeRoleDeclaration, input(value, more));
}

const artifactKeys = [
  "careerOutcomeValenceDeclarationId", "careerOutcomeRoleDeclarationId",
  "careerActionStateChangeAssociationDeclarationId", "careerStateChangeDeclarationId",
  "careerActionOccurrenceId", "careerExecutionContextRevisionId",
  "careerExecutionAuthorityGrantRevisionId", "careerHumanCommitmentId",
  "careerDecisionActionIntentId", "humanDecisionRecordId", "careerDecisionContextRevisionId",
  "decisionAuthorityGrantRevisionId", "recommendationProposalId", "performedByActorId",
  "observedByActorId", "associationDeclaredByActorId", "outcomeRoleDeclaredByActorId",
  "decisionSubjects", "sourceDeclarationClass", "sourceActionIntentClass", "operationDescription",
  "executionAuthorityScope", "executionTarget", "executionChannel", "actionOccurredAt",
  "stateSubject", "stateDimension", "beforeObservation", "afterObservation", "observedAt",
  "associationDeclaredAt", "outcomeRoleDeclaredAt", "declaredByActorId", "declaredAt",
  "valence", "valenceEvidenceRefs", "schemaVersion", "createdAt",
] as const;

const identityPayloadOrder = [
  "CAREER_OUTCOME_VALENCE_DECLARATION_V1",
  "careerOutcomeRoleDeclarationId", "careerActionStateChangeAssociationDeclarationId",
  "careerStateChangeDeclarationId", "careerActionOccurrenceId", "careerExecutionContextRevisionId",
  "careerExecutionAuthorityGrantRevisionId", "careerHumanCommitmentId",
  "careerDecisionActionIntentId", "humanDecisionRecordId", "careerDecisionContextRevisionId",
  "decisionAuthorityGrantRevisionId", "recommendationProposalId", "performedByActorId",
  "observedByActorId", "associationDeclaredByActorId", "outcomeRoleDeclaredByActorId",
  "canonicalDecisionSubjects", "sourceDeclarationClass", "sourceActionIntentClass",
  "operationDescription", "executionAuthorityScope", "executionTarget", "executionChannel",
  "actionOccurredAt", "stateSubject", "stateDimension", "beforeObservation", "afterObservation",
  "observedAt", "associationDeclaredAt", "outcomeRoleDeclaredAt", "declaredByActorId", "declaredAt",
  "valence", "canonicalValenceEvidenceRefs",
] as const;

describe("T12I CareerOutcomeValenceDeclaration domain RED contract", () => {
  it("constructs sealed RCP through CORD history before the missing T12I boundary", () => {
    const value = fixture();
    expect(value.outcomeRoleDeclaration.careerActionStateChangeAssociationDeclarationId)
      .toBe(value.associationDeclaration.careerActionStateChangeAssociationDeclarationId);
    expect(value.outcomeRoleDeclaration.careerStateChangeDeclarationId)
      .toBe(value.stateChangeDeclaration.careerStateChangeDeclarationId);
    expect(value.outcomeRoleDeclaration.careerActionOccurrenceId).toBe(value.occurrence.careerActionOccurrenceId);
    expect(value.occurrence.occurredAt < value.grant.effectiveUntil!).toBe(true);
    expect(value.stateChangeDeclaration.observedAt > value.grant.effectiveUntil!).toBe(true);
    expect(value.associationDeclaration.declaredAt > value.grant.effectiveUntil!).toBe(true);
    expect(value.outcomeRoleDeclaration.declaredAt > value.grant.effectiveUntil!).toBe(true);
    expect(value.outcomeValenceDeclarationInput.declaredAt > value.grant.effectiveUntil!).toBe(true);
    expect(value.outcomeValenceDeclarationInput.declaredAt > value.outcomeRoleDeclaration.declaredAt).toBe(true);
    expect(identityPayloadOrder.filter(item => item === "CAREER_OUTCOME_VALENCE_DECLARATION_V1")).toHaveLength(1);
    expect(identityPayloadOrder.at(-1)).toBe("canonicalValenceEvidenceRefs");
  });

  it("creates exactly the frozen 38-field valence declaration by copying only CORD history", async () => {
    const api = await loadOutcomeValenceDeclaration(); const value = fixture(); const declaration = create(api, value);
    expect(artifactKeys).toHaveLength(38);
    expect(Object.keys(declaration).sort()).toEqual([...artifactKeys].sort());
    expect(declaration).toMatchObject({
      careerOutcomeRoleDeclarationId: value.outcomeRoleDeclaration.careerOutcomeRoleDeclarationId,
      careerActionStateChangeAssociationDeclarationId: value.outcomeRoleDeclaration.careerActionStateChangeAssociationDeclarationId,
      careerStateChangeDeclarationId: value.outcomeRoleDeclaration.careerStateChangeDeclarationId,
      careerActionOccurrenceId: value.outcomeRoleDeclaration.careerActionOccurrenceId,
      careerExecutionContextRevisionId: value.outcomeRoleDeclaration.careerExecutionContextRevisionId,
      careerExecutionAuthorityGrantRevisionId: value.outcomeRoleDeclaration.careerExecutionAuthorityGrantRevisionId,
      careerHumanCommitmentId: value.outcomeRoleDeclaration.careerHumanCommitmentId,
      careerDecisionActionIntentId: value.outcomeRoleDeclaration.careerDecisionActionIntentId,
      humanDecisionRecordId: value.outcomeRoleDeclaration.humanDecisionRecordId,
      careerDecisionContextRevisionId: value.outcomeRoleDeclaration.careerDecisionContextRevisionId,
      decisionAuthorityGrantRevisionId: value.outcomeRoleDeclaration.decisionAuthorityGrantRevisionId,
      recommendationProposalId: value.outcomeRoleDeclaration.recommendationProposalId,
      performedByActorId: value.outcomeRoleDeclaration.performedByActorId,
      observedByActorId: value.outcomeRoleDeclaration.observedByActorId,
      associationDeclaredByActorId: value.outcomeRoleDeclaration.associationDeclaredByActorId,
      outcomeRoleDeclaredByActorId: value.outcomeRoleDeclaration.declaredByActorId,
      decisionSubjects: value.outcomeRoleDeclaration.decisionSubjects,
      sourceDeclarationClass: value.outcomeRoleDeclaration.sourceDeclarationClass,
      sourceActionIntentClass: value.outcomeRoleDeclaration.sourceActionIntentClass,
      operationDescription: value.outcomeRoleDeclaration.operationDescription,
      executionAuthorityScope: value.outcomeRoleDeclaration.executionAuthorityScope,
      executionTarget: value.outcomeRoleDeclaration.executionTarget,
      executionChannel: value.outcomeRoleDeclaration.executionChannel,
      actionOccurredAt: value.outcomeRoleDeclaration.actionOccurredAt,
      stateSubject: value.outcomeRoleDeclaration.stateSubject,
      stateDimension: value.outcomeRoleDeclaration.stateDimension,
      beforeObservation: value.outcomeRoleDeclaration.beforeObservation,
      afterObservation: value.outcomeRoleDeclaration.afterObservation,
      observedAt: value.outcomeRoleDeclaration.observedAt,
      associationDeclaredAt: value.outcomeRoleDeclaration.associationDeclaredAt,
      outcomeRoleDeclaredAt: value.outcomeRoleDeclaration.declaredAt,
      declaredByActorId: "OUTCOME_VALENCE_DECLARANT_T12I",
      declaredAt: "2027-02-07T01:00:00.000Z",
      valence: "DESIRABLE",
      valenceEvidenceRefs: ["evidence://outcome-valence/t12i/a", "evidence://outcome-valence/t12i/b"],
      schemaVersion: "CAREER_OUTCOME_VALENCE_DECLARATION_V1",
    });
    expect(declaration.careerOutcomeValenceDeclarationId).toMatch(/^COVD_[0-9A-F]{32}$/);
    expect(declaration).not.toHaveProperty("outcomeRoleEvidenceRefs");
    expect(declaration).not.toHaveProperty("outcomeRoleCreatedAt");
  });

  it("accepts only exact CORD plus the six-field human valence input", async () => {
    const api = await loadOutcomeValenceDeclaration(); const value = fixture();
    expect(Object.keys(input(value)).sort()).toEqual([
      "careerOutcomeRoleDeclarationId", "declaredByActorId", "declaredAt", "valence", "valenceEvidenceRefs", "createdAt",
    ].sort());
    for (const forbidden of [
      "careerActionStateChangeAssociationDeclarationId", "careerStateChangeDeclarationId", "careerActionOccurrenceId",
      "careerExecutionContextRevisionId", "careerExecutionAuthorityGrantRevisionId", "careerHumanCommitmentId",
      "careerDecisionActionIntentId", "humanDecisionRecordId", "careerDecisionContextRevisionId",
      "decisionAuthorityGrantRevisionId", "recommendationProposalId", "performedByActorId", "observedByActorId",
      "associationDeclaredByActorId", "outcomeRoleDeclaredByActorId", "decisionSubjects", "sourceDeclarationClass",
      "sourceActionIntentClass", "operationDescription", "executionAuthorityScope", "executionTarget",
      "executionChannel", "actionOccurredAt", "stateSubject", "stateDimension", "beforeObservation",
      "afterObservation", "observedAt", "associationDeclaredAt", "outcomeRoleDeclaredAt", "schemaVersion",
      "outcomeRoleEvidenceRefs", "rationale", "verified", "truth", "effect", "result", "consequence",
      "success", "failure", "satisfaction", "attribution", "causality", "feedback", "learning", "confidence", "score",
    ]) expect(() => create(api, value, { [forbidden]: "caller-override" })).toThrow(invalid);
    expect(() => create(api, value, {
      careerOutcomeRoleDeclarationId: "CORD_00000000000000000000000000000000",
    })).toThrow(invalid);
    expect(() => create(api, {
      ...value,
      outcomeRoleDeclaration: {
        ...value.outcomeRoleDeclaration,
        careerStateChangeDeclarationId: "SCD_00000000000000000000000000000000",
      },
    })).toThrow(invalid);
  });

  it("requires actor-relative human valence, chronology, and independent canonical evidence", async () => {
    const api = await loadOutcomeValenceDeclaration(); const value = fixture();
    for (const valence of ["DESIRABLE", "UNDESIRABLE", "NEUTRAL", "UNRESOLVED"] as const) {
      const declaration = create(api, value, { valence });
      expect(declaration.valence).toBe(valence);
      expect(declaration.declaredByActorId).not.toBe(value.occurrence.performedByActorId);
      expect(declaration.declaredByActorId).not.toBe(value.stateChangeDeclaration.observedByActorId);
      expect(declaration.declaredByActorId).not.toBe(value.associationDeclaration.declaredByActorId);
      expect(declaration.declaredByActorId).not.toBe(value.outcomeRoleDeclaration.declaredByActorId);
    }
    expect(create(api, value, { declaredAt: value.outcomeRoleDeclaration.declaredAt }).declaredAt)
      .toBe(value.outcomeRoleDeclaration.declaredAt);
    expect(create(api, value, { declaredAt: "2027-03-01T01:00:00.000Z" }).declaredAt)
      .toBe("2027-03-01T01:00:00.000Z");
    for (const more of [
      { declaredByActorId: "" }, { declaredByActorId: " " }, { declaredAt: "not-iso" },
      { declaredAt: "2027-02-06T00:59:59.999Z" }, { valence: "UNKNOWN" }, { valence: "SUCCESS" },
      { valenceEvidenceRefs: [] }, { valenceEvidenceRefs: [" "] },
      { valenceEvidenceRefs: ["evidence://x", " evidence://x "] },
    ]) expect(() => create(api, value, more)).toThrow(invalid);
    expect(() => api.assertCareerOutcomeValenceDeclaration({
      ...create(api, value), valenceEvidenceRefs: ["evidence://outcome-valence/t12i/b", "evidence://outcome-valence/t12i/a"],
    })).toThrow(invalid);
  });

  it("derives standalone COVD identity from one leading schema sentinel and every semantic field except createdAt", async () => {
    const api = await loadOutcomeValenceDeclaration(); const declaration = create(api);
    const semantic = { ...declaration } as any;
    delete semantic.careerOutcomeValenceDeclarationId; delete semantic.createdAt;
    expect(api.deriveCareerOutcomeValenceDeclarationId(semantic))
      .toBe(declaration.careerOutcomeValenceDeclarationId);
    expect(create(api, fixture(), { createdAt: "2030-01-01T00:00:00.000Z" }).careerOutcomeValenceDeclarationId)
      .toBe(declaration.careerOutcomeValenceDeclarationId);
    for (const [field, changed] of [
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
      ["associationDeclaredByActorId", "OTHER_ASSOCIATION_DECLARANT"], ["outcomeRoleDeclaredByActorId", "OTHER_ROLE_DECLARANT"],
      ["decisionSubjects", [...declaration.decisionSubjects].reverse()],
      ["sourceDeclarationClass", "REJECT_RECOMMENDATION"],
      ["sourceActionIntentClass", "FURTHER_EVIDENCE_REQUEST_OPERATIONALIZATION"],
      ["operationDescription", "other operation"],
      ["executionAuthorityScope", "FURTHER_EVIDENCE_REQUEST_EXECUTION"],
      ["executionTarget", { targetKind: "SYSTEM", targetRef: "target://other" }],
      ["executionChannel", { channelKind: "API", channelRef: "channel://other" }],
      ["actionOccurredAt", "2027-02-03T01:00:01.000Z"],
      ["stateSubject", { subjectKind: "SYSTEM", subjectRef: "state://other" }],
      ["stateDimension", "other-dimension"],
      ["beforeObservation", { observationState: "OBSERVED", value: "other-before" }],
      ["afterObservation", { observationState: "OBSERVED", value: "other-after" }],
      ["observedAt", "2027-02-04T02:00:00.000Z"], ["associationDeclaredAt", "2027-02-05T02:00:00.000Z"],
      ["outcomeRoleDeclaredAt", "2027-02-06T02:00:00.000Z"], ["declaredByActorId", "OTHER_DECLARANT"],
      ["declaredAt", "2027-02-07T02:00:00.000Z"], ["valence", "UNDESIRABLE"],
      ["valenceEvidenceRefs", ["evidence://other"]],
    ] as const) {
      const changedId = api.deriveCareerOutcomeValenceDeclarationId({ ...semantic, [field]: changed });
      expect(changedId).toMatch(/^COVD_[0-9A-F]{32}$/);
      expect(changedId).not.toBe(declaration.careerOutcomeValenceDeclarationId);
    }
  });

  it("requires canonical detached standalone state and exposes no automatic or stronger semantic authority", async () => {
    const api = await loadOutcomeValenceDeclaration(); const value = fixture(); const declaration = create(api, value);
    for (const mutation of [
      { careerOutcomeValenceDeclarationId: "COVD_00000000000000000000000000000000" },
      { schemaVersion: "CAREER_OUTCOME_VALENCE_DECLARATION_V0" }, { createdAt: "not-iso" },
      { declaredByActorId: " OUTCOME_VALENCE_DECLARANT_T12I " }, { declaredAt: " not-iso " }, { unknown: "field" },
    ]) expect(() => api.assertCareerOutcomeValenceDeclaration({ ...declaration, ...mutation })).toThrow(invalid);
    declaration.decisionSubjects.pop(); declaration.executionTarget.targetRef = "local";
    declaration.executionChannel.channelRef = "local"; declaration.stateSubject.subjectRef = "local";
    declaration.beforeObservation.value = "local"; declaration.afterObservation.value = "local";
    declaration.valenceEvidenceRefs.pop();
    expect(value.outcomeRoleDeclaration.decisionSubjects).toHaveLength(2);
    expect(value.outcomeRoleDeclaration.executionTarget.targetRef).not.toBe("local");
    expect(create(api, value).stateSubject.subjectRef).toBe(value.outcomeRoleDeclaration.stateSubject.subjectRef);
    for (const forbidden of [
      "getCurrentCareerOutcomeValenceDeclaration", "getLatestCareerOutcomeValenceDeclaration",
      "regenerateCareerOutcomeValenceDeclaration", "createAutomatically", "repairCareerOutcomeValenceDeclaration",
      "replaceCareerOutcomeValenceDeclaration", "supersedeCareerOutcomeValenceDeclaration",
      "verifyCareerOutcomeValence", "createCareerOutcome", "createFeedback", "createAttribution",
      "createDecisionAssessmentRequest", "createDecisionAssessmentBasis", "createDecisionAssessmentProposal",
      "createStateChangeClaim", "createActionStateChangeAssociationProposal", "createOutcomeAttributionProposal",
      "createDecisionContextObservationProposal",
    ]) expect(api).not.toHaveProperty(forbidden);
  });
});
