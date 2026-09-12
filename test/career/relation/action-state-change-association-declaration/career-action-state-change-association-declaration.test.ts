import { describe, expect, it } from "vitest";
import { createT12FHistoricalFixture } from "../state-change-declaration/t12f-historical-fixture";

const loadAssociationDeclaration = () =>
  import("../../../../lib/career/relation/action-state-change-association-declaration") as Promise<any>;
const invalid = "ERR_CAREER_ACTION_STATE_CHANGE_ASSOCIATION_DECLARATION_INVALID";

function fixture() {
  return createT12FHistoricalFixture();
}

function input(value = fixture(), more: Record<string, unknown> = {}) {
  return {
    careerStateChangeDeclarationId: value.stateChangeDeclaration.careerStateChangeDeclarationId,
    declaredByActorId: " ASSOCIATION_DECLARANT_T12G ",
    declaredAt: value.stateChangeDeclaration.observedAt,
    associationEvidenceRefs: [" evidence://association/t12g/b ", "evidence://association/t12g/a"],
    createdAt: "2027-02-04T01:00:02.000Z",
    ...more,
  };
}

function create(api: any, value = fixture(), more: Record<string, unknown> = {}) {
  return api.createCareerActionStateChangeAssociationDeclaration(value.stateChangeDeclaration, input(value, more));
}

describe("T12G CareerActionStateChangeAssociationDeclaration domain RED contract", () => {
  it("constructs one exact canonical SCD fixture before the T12G production boundary", () => {
    const value = fixture();
    expect(value.stateChangeDeclaration.careerActionOccurrenceId)
      .toBe(value.occurrence.careerActionOccurrenceId);
    expect(value.stateChangeDeclaration.actionOccurredAt).toBe(value.occurrence.occurredAt);
    expect(value.stateChangeDeclaration.observedAt).toBe("2027-02-04T01:00:00.000Z");
    expect(value.stateChangeDeclaration.decisionSubjects).toHaveLength(2);
  });

  it("creates exactly the frozen association declaration by copying its sole SCD predecessor witnesses", async () => {
    const api = await loadAssociationDeclaration(); const value = fixture(); const declaration = create(api, value);
    expect(Object.keys(declaration).sort()).toEqual([
      "careerActionStateChangeAssociationDeclarationId", "careerStateChangeDeclarationId", "careerActionOccurrenceId",
      "careerExecutionContextRevisionId", "careerExecutionAuthorityGrantRevisionId", "careerHumanCommitmentId",
      "careerDecisionActionIntentId", "humanDecisionRecordId", "careerDecisionContextRevisionId",
      "decisionAuthorityGrantRevisionId", "recommendationProposalId", "performedByActorId", "observedByActorId",
      "decisionSubjects", "sourceDeclarationClass", "sourceActionIntentClass", "operationDescription",
      "executionAuthorityScope", "executionTarget", "executionChannel", "actionOccurredAt", "stateSubject",
      "stateDimension", "beforeObservation", "afterObservation", "observedAt", "declaredByActorId", "declaredAt",
      "associationEvidenceRefs", "schemaVersion", "createdAt",
    ].sort());
    expect(declaration).toMatchObject({
      careerStateChangeDeclarationId: value.stateChangeDeclaration.careerStateChangeDeclarationId,
      careerActionOccurrenceId: value.occurrence.careerActionOccurrenceId,
      careerExecutionContextRevisionId: value.occurrence.careerExecutionContextRevisionId,
      careerExecutionAuthorityGrantRevisionId: value.occurrence.careerExecutionAuthorityGrantRevisionId,
      careerHumanCommitmentId: value.occurrence.careerHumanCommitmentId,
      careerDecisionActionIntentId: value.occurrence.careerDecisionActionIntentId,
      humanDecisionRecordId: value.occurrence.humanDecisionRecordId,
      careerDecisionContextRevisionId: value.occurrence.careerDecisionContextRevisionId,
      decisionAuthorityGrantRevisionId: value.occurrence.decisionAuthorityGrantRevisionId,
      recommendationProposalId: value.occurrence.recommendationProposalId,
      performedByActorId: value.occurrence.performedByActorId,
      observedByActorId: value.stateChangeDeclaration.observedByActorId,
      decisionSubjects: value.stateChangeDeclaration.decisionSubjects,
      sourceDeclarationClass: value.stateChangeDeclaration.sourceDeclarationClass,
      sourceActionIntentClass: value.stateChangeDeclaration.sourceActionIntentClass,
      operationDescription: value.stateChangeDeclaration.operationDescription,
      executionAuthorityScope: value.stateChangeDeclaration.executionAuthorityScope,
      executionTarget: value.stateChangeDeclaration.executionTarget,
      executionChannel: value.stateChangeDeclaration.executionChannel,
      actionOccurredAt: value.occurrence.occurredAt,
      stateSubject: value.stateChangeDeclaration.stateSubject,
      stateDimension: value.stateChangeDeclaration.stateDimension,
      beforeObservation: value.stateChangeDeclaration.beforeObservation,
      afterObservation: value.stateChangeDeclaration.afterObservation,
      observedAt: value.stateChangeDeclaration.observedAt,
      declaredByActorId: "ASSOCIATION_DECLARANT_T12G",
      declaredAt: value.stateChangeDeclaration.observedAt,
      associationEvidenceRefs: ["evidence://association/t12g/a", "evidence://association/t12g/b"],
      schemaVersion: "CAREER_ACTION_STATE_CHANGE_ASSOCIATION_DECLARATION_V1",
    });
    expect(declaration.careerActionStateChangeAssociationDeclarationId).toMatch(/^ASCAD_[0-9A-F]{32}$/);
  });

  it("accepts only one exact SCD direct operand and rejects caller AOC or copied-witness substitution", async () => {
    const api = await loadAssociationDeclaration(); const value = fixture();
    expect(Object.keys(input(value)).sort()).toEqual([
      "careerStateChangeDeclarationId", "declaredByActorId", "declaredAt", "associationEvidenceRefs", "createdAt",
    ].sort());
    for (const forbidden of [
      "careerActionOccurrenceId", "careerExecutionContextRevisionId", "careerExecutionAuthorityGrantRevisionId",
      "careerHumanCommitmentId", "careerDecisionActionIntentId", "humanDecisionRecordId",
      "careerDecisionContextRevisionId", "decisionAuthorityGrantRevisionId", "recommendationProposalId",
      "performedByActorId", "observedByActorId", "decisionSubjects", "operationDescription", "executionAuthorityScope",
      "executionTarget", "executionChannel", "actionOccurredAt", "stateSubject", "stateDimension", "beforeObservation",
      "afterObservation", "observedAt", "schemaVersion", "outcome", "result", "status", "success", "failure",
      "completion", "satisfaction", "attribution", "causality", "verification", "rationale",
    ]) expect(() => create(api, value, { [forbidden]: "caller-override" })).toThrow(invalid);
    expect(() => create(api, value, { careerStateChangeDeclarationId: "SCD_00000000000000000000000000000000" })).toThrow(invalid);
    expect(() => create(api, { ...value, stateChangeDeclaration: {
      ...value.stateChangeDeclaration, careerActionOccurrenceId: "AOC_00000000000000000000000000000000",
    } })).toThrow(invalid);
  });

  it("requires an explicit human association declarant, declaration chronology, and canonical association evidence", async () => {
    const api = await loadAssociationDeclaration(); const value = fixture();
    const distinct = create(api, value, { declaredByActorId: "OTHER_ASSOCIATION_DECLARANT" });
    expect(distinct.declaredByActorId).toBe("OTHER_ASSOCIATION_DECLARANT");
    expect(distinct.declaredByActorId).not.toBe(value.occurrence.performedByActorId);
    expect(distinct.declaredByActorId).not.toBe(value.stateChangeDeclaration.observedByActorId);
    expect(create(api, value, { declaredAt: "2027-02-04T02:00:00.000Z" }).declaredAt)
      .toBe("2027-02-04T02:00:00.000Z");
    for (const more of [
      { declaredByActorId: "" }, { declaredByActorId: " " }, { declaredAt: "not-iso" },
      { declaredAt: "2027-02-04T00:59:59.999Z" }, { associationEvidenceRefs: [] },
      { associationEvidenceRefs: [" "] }, { associationEvidenceRefs: ["evidence://x", " evidence://x "] },
    ]) expect(() => create(api, value, more)).toThrow(invalid);
    expect(() => api.assertCareerActionStateChangeAssociationDeclaration({
      ...create(api, value), associationEvidenceRefs: ["evidence://association/t12g/b", "evidence://association/t12g/a"],
    })).toThrow(invalid);
  });

  it("derives a standalone deterministic identity from all association semantics except createdAt", async () => {
    const api = await loadAssociationDeclaration(); const declaration = create(api);
    const semantic = { ...declaration } as any;
    delete semantic.careerActionStateChangeAssociationDeclarationId; delete semantic.createdAt;
    expect(api.deriveCareerActionStateChangeAssociationDeclarationId(semantic))
      .toBe(declaration.careerActionStateChangeAssociationDeclarationId);
    expect(create(api, fixture(), { createdAt: "2030-01-01T00:00:00.000Z" }).careerActionStateChangeAssociationDeclarationId)
      .toBe(declaration.careerActionStateChangeAssociationDeclarationId);
    for (const [field, changed] of [
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
      ["decisionSubjects", [...declaration.decisionSubjects].reverse()], ["operationDescription", "other operation"],
      ["executionAuthorityScope", "FURTHER_EVIDENCE_REQUEST_EXECUTION"],
      ["executionTarget", { targetKind: "SYSTEM", targetRef: "target://other" }],
      ["executionChannel", { channelKind: "API", channelRef: "channel://other" }],
      ["actionOccurredAt", "2027-02-03T01:00:01.000Z"],
      ["stateSubject", { subjectKind: "SYSTEM", subjectRef: "state://other" }], ["stateDimension", "other-dimension"],
      ["beforeObservation", { observationState: "OBSERVED", value: "other-before" }],
      ["afterObservation", { observationState: "OBSERVED", value: "other-after" }],
      ["observedAt", "2027-02-04T02:00:00.000Z"], ["declaredByActorId", "OTHER_DECLARANT"],
      ["declaredAt", "2027-02-04T02:00:00.000Z"], ["associationEvidenceRefs", ["evidence://other"]],
    ] as const) {
      const changedId = api.deriveCareerActionStateChangeAssociationDeclarationId({ ...semantic, [field]: changed });
      expect(changedId).toMatch(/^ASCAD_[0-9A-F]{32}$/);
      expect(changedId).not.toBe(declaration.careerActionStateChangeAssociationDeclarationId);
    }
  });

  it("requires canonical standalone state, detaches nested values, and exposes no automatic, verification, outcome, or causal authority", async () => {
    const api = await loadAssociationDeclaration(); const value = fixture(); const declaration = create(api, value);
    for (const mutation of [
      { careerActionStateChangeAssociationDeclarationId: "ASCAD_00000000000000000000000000000000" },
      { schemaVersion: "CAREER_ACTION_STATE_CHANGE_ASSOCIATION_DECLARATION_V0" }, { createdAt: "not-iso" },
      { declaredByActorId: " ASSOCIATION_DECLARANT_T12G " }, { declaredAt: " not-iso " }, { unknown: "field" },
    ]) expect(() => api.assertCareerActionStateChangeAssociationDeclaration({ ...declaration, ...mutation })).toThrow(invalid);
    declaration.decisionSubjects.pop(); declaration.executionTarget.targetRef = "local";
    declaration.executionChannel.channelRef = "local"; declaration.stateSubject.subjectRef = "local";
    declaration.beforeObservation.value = "local"; declaration.afterObservation.value = "local";
    declaration.associationEvidenceRefs.pop();
    expect(value.stateChangeDeclaration.decisionSubjects).toHaveLength(2);
    expect(value.stateChangeDeclaration.executionTarget.targetRef).not.toBe("local");
    expect(create(api, value).stateSubject.subjectRef).toBe(value.stateChangeDeclaration.stateSubject.subjectRef);
    for (const forbidden of [
      "getCurrentCareerActionStateChangeAssociationDeclaration", "getLatestCareerActionStateChangeAssociationDeclaration",
      "regenerateCareerActionStateChangeAssociationDeclaration", "createAutomatically", "repairCareerActionStateChangeAssociationDeclaration",
      "replaceCareerActionStateChangeAssociationDeclaration", "supersedeCareerActionStateChangeAssociationDeclaration",
      "verifyCareerActionStateChangeAssociation", "createCareerOutcome", "createOutcomeAttributionProposal",
      "createStateChangeClaim", "createActionStateChangeAssociationProposal", "createActionOccurrenceClaim",
    ]) expect(api).not.toHaveProperty(forbidden);
  });
});
