import { describe, expect, it } from "vitest";
import { createT12EHistoricalFixture } from "../action-occurrence/t12e-historical-fixture";

const loadStateChangeDeclaration = () =>
  import("../../../../lib/career/relation/state-change-declaration") as Promise<any>;
const invalid = "ERR_CAREER_STATE_CHANGE_DECLARATION_INVALID";

function fixture() {
  return createT12EHistoricalFixture();
}

function input(value = fixture(), more: Record<string, unknown> = {}) {
  return {
    careerActionOccurrenceId: value.occurrence.careerActionOccurrenceId,
    observedByActorId: " OBSERVER_T12F ",
    stateSubject: { subjectKind: "PERSON", subjectRef: " state://person/t12f/1 " },
    stateDimension: " application-status ",
    beforeObservation: { observationState: "OBSERVED", value: " applied " },
    afterObservation: { observationState: "OBSERVED", value: " interview-invited " },
    observedAt: value.occurrence.occurredAt,
    stateChangeEvidenceRefs: [" evidence://state/t12f/b ", "evidence://state/t12f/a"],
    externalStateRef: {
      producerId: " producer-t12f ", authorityContractId: " contract-t12f ",
      artifactId: " artifact-t12f ", locator: " locator-t12f ",
    },
    createdAt: "2027-02-03T01:00:01.000Z",
    ...more,
  };
}

function create(api: any, value = fixture(), more: Record<string, unknown> = {}) {
  return api.createCareerStateChangeDeclaration(value.occurrence, input(value, more));
}

describe("T12F CareerStateChangeDeclaration domain RED contract", () => {
  it("constructs one exact canonical AOC fixture before the T12F production boundary", () => {
    const value = fixture();
    expect(value.occurrence.careerExecutionContextRevisionId)
      .toBe(value.executionContext.careerExecutionContextRevisionId);
    expect(value.occurrence.performedByActorId).toBe(value.grant.authorizedExecutionActorId);
    expect(value.occurrence.decisionSubjects).toHaveLength(2);
    expect(value.occurrence.occurredAt).toBe("2027-02-03T01:00:00.000Z");
  });

  it("creates exactly the frozen SCD artifact by copying every AOC witness", async () => {
    const api = await loadStateChangeDeclaration(); const value = fixture(); const declaration = create(api, value);
    expect(Object.keys(declaration).sort()).toEqual([
      "careerStateChangeDeclarationId", "careerActionOccurrenceId", "careerExecutionContextRevisionId",
      "careerExecutionAuthorityGrantRevisionId", "careerHumanCommitmentId", "careerDecisionActionIntentId",
      "humanDecisionRecordId", "careerDecisionContextRevisionId", "decisionAuthorityGrantRevisionId",
      "recommendationProposalId", "performedByActorId", "observedByActorId", "decisionSubjects",
      "sourceDeclarationClass", "sourceActionIntentClass", "operationDescription", "executionAuthorityScope",
      "executionTarget", "executionChannel", "actionOccurredAt", "stateSubject", "stateDimension",
      "beforeObservation", "afterObservation", "observedAt", "stateChangeEvidenceRefs", "externalStateRef",
      "schemaVersion", "createdAt",
    ].sort());
    expect(declaration).toMatchObject({
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
      decisionSubjects: value.occurrence.decisionSubjects,
      sourceDeclarationClass: value.occurrence.sourceDeclarationClass,
      sourceActionIntentClass: value.occurrence.sourceActionIntentClass,
      operationDescription: value.occurrence.operationDescription,
      executionAuthorityScope: value.occurrence.executionAuthorityScope,
      executionTarget: value.occurrence.executionTarget,
      executionChannel: value.occurrence.executionChannel,
      actionOccurredAt: value.occurrence.occurredAt,
      observedByActorId: "OBSERVER_T12F",
      stateSubject: { subjectKind: "PERSON", subjectRef: "state://person/t12f/1" },
      stateDimension: "application-status",
      beforeObservation: { observationState: "OBSERVED", value: "applied" },
      afterObservation: { observationState: "OBSERVED", value: "interview-invited" },
      observedAt: value.occurrence.occurredAt,
      stateChangeEvidenceRefs: ["evidence://state/t12f/a", "evidence://state/t12f/b"],
      externalStateRef: {
        producerId: "producer-t12f", authorityContractId: "contract-t12f",
        artifactId: "artifact-t12f", locator: "locator-t12f",
      },
      schemaVersion: "CAREER_STATE_CHANGE_DECLARATION_V1",
    });
    expect(declaration.careerStateChangeDeclarationId).toMatch(/^SCD_[0-9A-F]{32}$/);
  });

  it("accepts only explicit state declaration input and one exact AOC direct operand", async () => {
    const api = await loadStateChangeDeclaration(); const value = fixture();
    expect(Object.keys(input(value)).sort()).toEqual([
      "careerActionOccurrenceId", "observedByActorId", "stateSubject", "stateDimension", "beforeObservation",
      "afterObservation", "observedAt", "stateChangeEvidenceRefs", "externalStateRef", "createdAt",
    ].sort());
    for (const forbidden of [
      "schemaVersion", "careerExecutionContextRevisionId", "careerExecutionAuthorityGrantRevisionId",
      "careerHumanCommitmentId", "careerDecisionActionIntentId", "humanDecisionRecordId",
      "careerDecisionContextRevisionId", "decisionAuthorityGrantRevisionId", "recommendationProposalId",
      "performedByActorId", "decisionSubjects", "operationDescription", "executionAuthorityScope",
      "executionTarget", "executionChannel", "outcome", "result", "status", "success", "failure",
      "causality", "attribution", "rationale", "stateChangeDescription",
    ]) expect(() => create(api, value, { [forbidden]: "caller-override" })).toThrow(invalid);
    expect(() => create(api, value, { careerActionOccurrenceId: "AOC_00000000000000000000000000000000" })).toThrow(invalid);
    expect(() => create(api, { ...value, occurrence: { ...value.occurrence, careerActionOccurrenceId: "AOC_00000000000000000000000000000000" } })).toThrow(invalid);
  });

  it("freezes explicit observer, state subject/dimension, and the OBSERVED structured difference boundary", async () => {
    const api = await loadStateChangeDeclaration(); const value = fixture();
    expect(create(api, value).observedByActorId).toBe("OBSERVER_T12F");
    expect(create(api, value, { observedByActorId: value.occurrence.performedByActorId }).observedByActorId)
      .toBe(value.occurrence.performedByActorId);
    for (const more of [
      { observedByActorId: "" }, { observedByActorId: " " },
      { stateSubject: undefined },
      { stateSubject: { subjectKind: "UNKNOWN", subjectRef: "state://x" } },
      { stateSubject: { subjectKind: "PERSON", subjectRef: " " } },
      { stateDimension: " " },
      { beforeObservation: { observationState: "OBSERVED", value: "same" }, afterObservation: { observationState: "OBSERVED", value: " same " } },
      { beforeObservation: { observationState: "UNKNOWN", value: null } },
      { afterObservation: { observationState: "UNKNOWN", value: null } },
      { beforeObservation: { observationState: "NOT_OBSERVED", value: null } },
      { afterObservation: { observationState: "NOT_OBSERVED", value: null } },
      { beforeObservation: { observationState: "OBSERVATION_FAILED", value: null } },
      { afterObservation: { observationState: "OBSERVATION_FAILED", value: null } },
      { beforeObservation: { observationState: "OBSERVED", value: null } },
      { afterObservation: { observationState: "UNKNOWN", value: "value" } },
    ]) expect(() => create(api, value, more)).toThrow(invalid);
    for (const subjectKind of ["PERSON", "ORGANIZATION", "SYSTEM", "DOCUMENT", "COMMUNICATION_ENDPOINT", "EXTERNAL_RESOURCE"]) {
      expect(create(api, value, { stateSubject: { subjectKind, subjectRef: `state://${subjectKind}` } }).stateSubject.subjectKind)
        .toBe(subjectKind);
    }
  });

  it("enforces observation time, canonical evidence, and opaque external state references", async () => {
    const api = await loadStateChangeDeclaration(); const value = fixture();
    expect(create(api, value, { observedAt: value.occurrence.occurredAt }).observedAt).toBe(value.occurrence.occurredAt);
    expect(create(api, value, { observedAt: "2027-02-03T02:00:00.000Z" }).observedAt).toBe("2027-02-03T02:00:00.000Z");
    expect(create(api, value, { externalStateRef: null }).externalStateRef).toBeNull();
    for (const more of [
      { observedAt: "not-iso" }, { observedAt: "2027-02-03T00:59:59.999Z" },
      { stateChangeEvidenceRefs: [] }, { stateChangeEvidenceRefs: [" "] },
      { stateChangeEvidenceRefs: ["evidence://x", " evidence://x "] },
      { externalStateRef: { producerId: "", authorityContractId: "contract", artifactId: "artifact", locator: "locator" } },
      { externalStateRef: { producerId: "producer", authorityContractId: " ", artifactId: "artifact", locator: "locator" } },
      { externalStateRef: { producerId: "producer", authorityContractId: "contract", artifactId: "", locator: "locator" } },
      { externalStateRef: { producerId: "producer", authorityContractId: "contract", artifactId: "artifact", locator: " " } },
    ]) expect(() => create(api, value, more)).toThrow(invalid);
    const declaration = create(api, value);
    for (const mutation of [
      { stateChangeEvidenceRefs: [...declaration.stateChangeEvidenceRefs].reverse() },
      { externalStateRef: { ...declaration.externalStateRef, locator: " locator-t12f " } },
    ]) expect(() => api.assertCareerStateChangeDeclaration({ ...declaration, ...mutation })).toThrow(invalid);
  });

  it("derives pure deterministic SCD identity from every semantic field except createdAt", async () => {
    const api = await loadStateChangeDeclaration(); const declaration = create(api);
    const semantic = { ...declaration } as any;
    delete semantic.careerStateChangeDeclarationId; delete semantic.createdAt;
    expect(api.deriveCareerStateChangeDeclarationId(semantic)).toBe(declaration.careerStateChangeDeclarationId);
    expect(create(api, fixture(), { createdAt: "2030-01-01T00:00:00.000Z" }).careerStateChangeDeclarationId)
      .toBe(declaration.careerStateChangeDeclarationId);
    for (const [field, changed] of [
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
      ["decisionSubjects", [...declaration.decisionSubjects].reverse()],
      ["operationDescription", "other operation"], ["executionAuthorityScope", "FURTHER_EVIDENCE_REQUEST_EXECUTION"],
      ["executionTarget", { targetKind: "SYSTEM", targetRef: "target://other" }],
      ["executionChannel", { channelKind: "API", channelRef: "channel://other" }],
      ["actionOccurredAt", "2027-02-03T01:00:01.000Z"],
      ["stateSubject", { subjectKind: "SYSTEM", subjectRef: "state://other" }],
      ["stateDimension", "other-dimension"],
      ["beforeObservation", { observationState: "OBSERVED", value: "other-before" }],
      ["afterObservation", { observationState: "OBSERVED", value: "other-after" }],
      ["observedAt", "2027-02-03T02:00:00.000Z"],
      ["stateChangeEvidenceRefs", ["evidence://other"]], ["externalStateRef", null],
    ] as const) {
      const changedPayload = { ...semantic, [field]: changed };
      const changedId = api.deriveCareerStateChangeDeclarationId(changedPayload);
      expect(changedId).toMatch(/^SCD_[0-9A-F]{32}$/); expect(changedId).not.toBe(declaration.careerStateChangeDeclarationId);
      expect(() => api.assertCareerStateChangeDeclaration({ ...declaration, ...changedPayload })).toThrow(invalid);
    }
  });

  it("requires canonical standalone state, returns detached values, and exposes no regeneration, verification, outcome, or causal surface", async () => {
    const api = await loadStateChangeDeclaration(); const value = fixture(); const declaration = create(api, value);
    for (const mutation of [
      { careerStateChangeDeclarationId: "SCD_00000000000000000000000000000000" },
      { schemaVersion: "CAREER_STATE_CHANGE_DECLARATION_V0" }, { createdAt: "not-iso" },
      { observedByActorId: " OBSERVER_T12F " }, { stateDimension: " application-status " },
      { stateSubject: { subjectKind: "PERSON", subjectRef: " state://person/t12f/1 " } },
      { beforeObservation: { observationState: "UNKNOWN", value: null } }, { unknown: "field" },
    ]) expect(() => api.assertCareerStateChangeDeclaration({ ...declaration, ...mutation })).toThrow(invalid);
    declaration.decisionSubjects.pop(); declaration.executionTarget.targetRef = "local";
    declaration.executionChannel.channelRef = "local"; declaration.stateSubject.subjectRef = "local";
    declaration.beforeObservation.value = "local"; declaration.afterObservation.value = "local";
    declaration.stateChangeEvidenceRefs.pop(); declaration.externalStateRef.locator = "local";
    expect(value.occurrence.decisionSubjects).toHaveLength(2);
    expect(value.occurrence.executionTarget.targetRef).not.toBe("local");
    expect(create(api, value).stateSubject.subjectRef).toBe("state://person/t12f/1");
    for (const forbidden of [
      "getCurrentCareerStateChangeDeclaration", "getLatestCareerStateChangeDeclaration",
      "regenerateCareerStateChangeDeclaration", "createAutomatically", "repairCareerStateChangeDeclaration",
      "replaceCareerStateChangeDeclaration", "supersedeCareerStateChangeDeclaration",
      "verifyCareerStateChange", "createCareerOutcome", "createOutcomeAttributionProposal",
      "createStateChangeClaim", "createActionStateChangeAssociationProposal",
    ]) expect(api).not.toHaveProperty(forbidden);
  });
});
