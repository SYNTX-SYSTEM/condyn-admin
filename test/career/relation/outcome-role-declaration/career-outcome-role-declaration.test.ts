import { describe, expect, it } from "vitest";
import { createT12HHistoricalFixture } from "./t12h-historical-fixture";

const loadOutcomeRoleDeclaration = () =>
  import("../../../../lib/career/relation/outcome-role-declaration") as Promise<any>;
const invalid = "ERR_CAREER_OUTCOME_ROLE_DECLARATION_INVALID";

function fixture() {
  return createT12HHistoricalFixture();
}

function input(value = fixture(), more: Record<string, unknown> = {}) {
  return { ...value.outcomeRoleDeclarationInput, ...more };
}

function create(api: any, value = fixture(), more: Record<string, unknown> = {}) {
  return api.createCareerOutcomeRoleDeclaration(value.associationDeclaration, input(value, more));
}

const artifactKeys = [
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
  "declaredByActorId",
  "declaredAt",
  "outcomeRoleEvidenceRefs",
  "schemaVersion",
  "createdAt",
] as const;

const identityPayloadOrder = [
  "CAREER_OUTCOME_ROLE_DECLARATION_V1",
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
  "declaredByActorId",
  "declaredAt",
  "canonicalOutcomeRoleEvidenceRefs",
] as const;

describe("T12H CareerOutcomeRoleDeclaration domain RED contract", () => {
  it("constructs the sealed RCP through ASCAD fixture before the missing T12H boundary", () => {
    const value = fixture();
    expect(value.associationDeclaration.careerStateChangeDeclarationId)
      .toBe(value.stateChangeDeclaration.careerStateChangeDeclarationId);
    expect(value.associationDeclaration.careerActionOccurrenceId)
      .toBe(value.occurrence.careerActionOccurrenceId);
    expect(value.associationDeclaration.actionOccurredAt).toBe(value.occurrence.occurredAt);
    expect(value.associationDeclaration.observedAt).toBe(value.stateChangeDeclaration.observedAt);
    expect(value.associationDeclaration.declaredAt).toBe("2027-02-05T01:00:00.000Z");
    expect(value.outcomeRoleDeclarationInput.declaredAt).toBe("2027-02-06T01:00:00.000Z");
    expect(value.outcomeRoleDeclarationInput.declaredAt > value.associationDeclaration.declaredAt).toBe(true);
    expect(value.associationDeclaration.decisionSubjects).toHaveLength(2);
    expect(identityPayloadOrder.filter((entry) => entry === "CAREER_OUTCOME_ROLE_DECLARATION_V1"))
      .toHaveLength(1);
    expect(identityPayloadOrder.at(-1)).toBe("canonicalOutcomeRoleEvidenceRefs");
  });

  it("creates exactly the frozen 34-field outcome-role declaration by copying only ASCAD history", async () => {
    const api = await loadOutcomeRoleDeclaration(); const value = fixture(); const declaration = create(api, value);
    expect(artifactKeys).toHaveLength(34);
    expect(Object.keys(declaration).sort()).toEqual([...artifactKeys].sort());
    expect(declaration).toMatchObject({
      careerActionStateChangeAssociationDeclarationId:
        value.associationDeclaration.careerActionStateChangeAssociationDeclarationId,
      careerStateChangeDeclarationId: value.associationDeclaration.careerStateChangeDeclarationId,
      careerActionOccurrenceId: value.associationDeclaration.careerActionOccurrenceId,
      careerExecutionContextRevisionId: value.associationDeclaration.careerExecutionContextRevisionId,
      careerExecutionAuthorityGrantRevisionId: value.associationDeclaration.careerExecutionAuthorityGrantRevisionId,
      careerHumanCommitmentId: value.associationDeclaration.careerHumanCommitmentId,
      careerDecisionActionIntentId: value.associationDeclaration.careerDecisionActionIntentId,
      humanDecisionRecordId: value.associationDeclaration.humanDecisionRecordId,
      careerDecisionContextRevisionId: value.associationDeclaration.careerDecisionContextRevisionId,
      decisionAuthorityGrantRevisionId: value.associationDeclaration.decisionAuthorityGrantRevisionId,
      recommendationProposalId: value.associationDeclaration.recommendationProposalId,
      performedByActorId: value.associationDeclaration.performedByActorId,
      observedByActorId: value.associationDeclaration.observedByActorId,
      associationDeclaredByActorId: value.associationDeclaration.declaredByActorId,
      decisionSubjects: value.associationDeclaration.decisionSubjects,
      sourceDeclarationClass: value.associationDeclaration.sourceDeclarationClass,
      sourceActionIntentClass: value.associationDeclaration.sourceActionIntentClass,
      operationDescription: value.associationDeclaration.operationDescription,
      executionAuthorityScope: value.associationDeclaration.executionAuthorityScope,
      executionTarget: value.associationDeclaration.executionTarget,
      executionChannel: value.associationDeclaration.executionChannel,
      actionOccurredAt: value.associationDeclaration.actionOccurredAt,
      stateSubject: value.associationDeclaration.stateSubject,
      stateDimension: value.associationDeclaration.stateDimension,
      beforeObservation: value.associationDeclaration.beforeObservation,
      afterObservation: value.associationDeclaration.afterObservation,
      observedAt: value.associationDeclaration.observedAt,
      associationDeclaredAt: value.associationDeclaration.declaredAt,
      declaredByActorId: "OUTCOME_ROLE_DECLARANT_T12H",
      declaredAt: "2027-02-06T01:00:00.000Z",
      outcomeRoleEvidenceRefs: ["evidence://outcome-role/t12h/a", "evidence://outcome-role/t12h/b"],
      schemaVersion: "CAREER_OUTCOME_ROLE_DECLARATION_V1",
    });
    expect(declaration.careerOutcomeRoleDeclarationId).toMatch(/^CORD_[0-9A-F]{32}$/);
  });

  it("accepts only exact ASCAD plus the five-field human declaration input", async () => {
    const api = await loadOutcomeRoleDeclaration(); const value = fixture();
    expect(Object.keys(input(value)).sort()).toEqual([
      "careerActionStateChangeAssociationDeclarationId", "declaredByActorId", "declaredAt",
      "outcomeRoleEvidenceRefs", "createdAt",
    ].sort());
    for (const forbidden of [
      "careerStateChangeDeclarationId", "careerActionOccurrenceId", "careerExecutionContextRevisionId",
      "careerExecutionAuthorityGrantRevisionId", "careerHumanCommitmentId", "careerDecisionActionIntentId",
      "humanDecisionRecordId", "careerDecisionContextRevisionId", "decisionAuthorityGrantRevisionId",
      "recommendationProposalId", "performedByActorId", "observedByActorId", "associationDeclaredByActorId",
      "decisionSubjects", "sourceDeclarationClass", "sourceActionIntentClass", "operationDescription",
      "executionAuthorityScope", "executionTarget", "executionChannel", "actionOccurredAt", "stateSubject",
      "stateDimension", "beforeObservation", "afterObservation", "observedAt", "associationDeclaredAt",
      "schemaVersion", "rationale", "outcome", "outcomeType", "outcomeClass", "outcomeState", "outcomeValue",
      "status", "satisfaction", "attributionTarget", "causality", "confidence", "score", "verification",
    ]) expect(() => create(api, value, { [forbidden]: "caller-override" })).toThrow(invalid);
    expect(() => create(api, value, {
      careerActionStateChangeAssociationDeclarationId: "ASCAD_00000000000000000000000000000000",
    })).toThrow(invalid);
    expect(() => create(api, {
      ...value,
      associationDeclaration: {
        ...value.associationDeclaration,
        careerStateChangeDeclarationId: "SCD_00000000000000000000000000000000",
      },
    })).toThrow(invalid);
  });

  it("requires explicit human declaration chronology and independent canonical outcome-role evidence", async () => {
    const api = await loadOutcomeRoleDeclaration(); const value = fixture();
    const distinct = create(api, value, { declaredByActorId: "OTHER_OUTCOME_ROLE_DECLARANT" });
    expect(distinct.declaredByActorId).toBe("OTHER_OUTCOME_ROLE_DECLARANT");
    expect(distinct.declaredByActorId).not.toBe(value.occurrence.performedByActorId);
    expect(distinct.declaredByActorId).not.toBe(value.stateChangeDeclaration.observedByActorId);
    expect(distinct.declaredByActorId).not.toBe(value.associationDeclaration.declaredByActorId);
    expect(create(api, value, { declaredAt: value.associationDeclaration.declaredAt }).declaredAt)
      .toBe(value.associationDeclaration.declaredAt);
    expect(create(api, value, { declaredAt: "2027-03-01T01:00:00.000Z" }).declaredAt)
      .toBe("2027-03-01T01:00:00.000Z");
    for (const more of [
      { declaredByActorId: "" }, { declaredByActorId: " " }, { declaredAt: "not-iso" },
      { declaredAt: "2027-02-05T00:59:59.999Z" }, { outcomeRoleEvidenceRefs: [] },
      { outcomeRoleEvidenceRefs: [" "] }, { outcomeRoleEvidenceRefs: ["evidence://x", " evidence://x "] },
    ]) expect(() => create(api, value, more)).toThrow(invalid);
    expect(() => api.assertCareerOutcomeRoleDeclaration({
      ...create(api, value), outcomeRoleEvidenceRefs: ["evidence://outcome-role/t12h/b", "evidence://outcome-role/t12h/a"],
    })).toThrow(invalid);
  });

  it("derives standalone CORD identity from a single leading schema sentinel and every semantic field except createdAt", async () => {
    const api = await loadOutcomeRoleDeclaration(); const declaration = create(api);
    const semantic = { ...declaration } as any;
    delete semantic.careerOutcomeRoleDeclarationId; delete semantic.createdAt;
    expect(api.deriveCareerOutcomeRoleDeclarationId(semantic))
      .toBe(declaration.careerOutcomeRoleDeclarationId);
    expect(create(api, fixture(), { createdAt: "2030-01-01T00:00:00.000Z" }).careerOutcomeRoleDeclarationId)
      .toBe(declaration.careerOutcomeRoleDeclarationId);
    for (const [field, changed] of [
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
      ["decisionSubjects", [...declaration.decisionSubjects].reverse()],
      ["sourceDeclarationClass", "REJECT_RECOMMENDATION"],
      ["sourceActionIntentClass", "FURTHER_EVIDENCE_REQUEST_OPERATIONALIZATION"], ["operationDescription", "other operation"],
      ["executionAuthorityScope", "FURTHER_EVIDENCE_REQUEST_EXECUTION"],
      ["executionTarget", { targetKind: "SYSTEM", targetRef: "target://other" }],
      ["executionChannel", { channelKind: "API", channelRef: "channel://other" }],
      ["actionOccurredAt", "2027-02-03T01:00:01.000Z"],
      ["stateSubject", { subjectKind: "SYSTEM", subjectRef: "state://other" }], ["stateDimension", "other-dimension"],
      ["beforeObservation", { observationState: "OBSERVED", value: "other-before" }],
      ["afterObservation", { observationState: "OBSERVED", value: "other-after" }],
      ["observedAt", "2027-02-04T02:00:00.000Z"], ["associationDeclaredAt", "2027-02-05T02:00:00.000Z"],
      ["declaredByActorId", "OTHER_DECLARANT"], ["declaredAt", "2027-02-06T02:00:00.000Z"],
      ["outcomeRoleEvidenceRefs", ["evidence://other"]],
    ] as const) {
      const changedId = api.deriveCareerOutcomeRoleDeclarationId({ ...semantic, [field]: changed });
      expect(changedId).toMatch(/^CORD_[0-9A-F]{32}$/);
      expect(changedId).not.toBe(declaration.careerOutcomeRoleDeclarationId);
    }
  });

  it("requires canonical detached standalone state and exposes no automatic or stronger outcome authority", async () => {
    const api = await loadOutcomeRoleDeclaration(); const value = fixture(); const declaration = create(api, value);
    for (const mutation of [
      { careerOutcomeRoleDeclarationId: "CORD_00000000000000000000000000000000" },
      { schemaVersion: "CAREER_OUTCOME_ROLE_DECLARATION_V0" }, { createdAt: "not-iso" },
      { declaredByActorId: " OUTCOME_ROLE_DECLARANT_T12H " }, { declaredAt: " not-iso " }, { unknown: "field" },
    ]) expect(() => api.assertCareerOutcomeRoleDeclaration({ ...declaration, ...mutation })).toThrow(invalid);
    declaration.decisionSubjects.pop(); declaration.executionTarget.targetRef = "local";
    declaration.executionChannel.channelRef = "local"; declaration.stateSubject.subjectRef = "local";
    declaration.beforeObservation.value = "local"; declaration.afterObservation.value = "local";
    declaration.outcomeRoleEvidenceRefs.pop();
    expect(value.associationDeclaration.decisionSubjects).toHaveLength(2);
    expect(value.associationDeclaration.executionTarget.targetRef).not.toBe("local");
    expect(create(api, value).stateSubject.subjectRef).toBe(value.associationDeclaration.stateSubject.subjectRef);
    for (const forbidden of [
      "getCurrentCareerOutcomeRoleDeclaration", "getLatestCareerOutcomeRoleDeclaration",
      "regenerateCareerOutcomeRoleDeclaration", "createAutomatically", "repairCareerOutcomeRoleDeclaration",
      "replaceCareerOutcomeRoleDeclaration", "supersedeCareerOutcomeRoleDeclaration",
      "verifyCareerOutcomeRole", "createCareerOutcome", "createOutcomeAttributionProposal",
      "createStateChangeClaim", "createActionStateChangeAssociationProposal", "createActionOccurrenceClaim",
      "createDecisionContextObservationProposal",
    ]) expect(api).not.toHaveProperty(forbidden);
  });
});
