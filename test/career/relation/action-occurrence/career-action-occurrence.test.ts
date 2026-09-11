import { describe, expect, it } from "vitest";
import { createT12DHistoricalFixture } from "../execution-context-revision/t12d-historical-fixture";

const loadActionOccurrence = () =>
  import("../../../../lib/career/relation/action-occurrence") as Promise<any>;
const invalid = "ERR_CAREER_ACTION_OCCURRENCE_INVALID";

function fixture() {
  return createT12DHistoricalFixture();
}

function input(value = fixture(), more: Record<string, unknown> = {}) {
  return {
    careerExecutionContextRevisionId:
      value.executionContext.careerExecutionContextRevisionId,
    performedByActorId: ` ${value.executionContext.declaredByActorId} `,
    occurredAt: "2027-02-03T01:00:00.000Z",
    occurrenceEvidenceRefs: [
      " evidence://occurrence/t12e/b ",
      "evidence://occurrence/t12e/a",
    ],
    externalOccurrenceRef: " external://occurrence/t12e/1 ",
    createdAt: "2027-02-03T01:00:01.000Z",
    ...more,
  };
}

function create(api: any, value = fixture(), more: Record<string, unknown> = {}) {
  return api.createCareerActionOccurrence(value.executionContext, input(value, more));
}

describe("T12E CareerActionOccurrence domain RED contract", () => {
  it("starts from an exact canonical T12D ECTXREV fixture before the T12E production boundary", () => {
    const value = fixture();
    expect(value.executionContext.careerExecutionAuthorityGrantRevisionId)
      .toBe(value.grant.careerExecutionAuthorityGrantRevisionId);
    expect(value.executionContext.declaredByActorId)
      .toBe(value.grant.authorizedExecutionActorId);
    expect(value.executionContext.decisionSubjects).toEqual(value.grant.decisionSubjects);
    expect(value.executionContext.decisionSubjects).toHaveLength(2);
    expect(value.executionContext.declaredAt).toBe(value.grant.effectiveFrom);
  });

  it("creates exactly the frozen AOC shape by copying every ECTXREV witness", async () => {
    const api = await loadActionOccurrence();
    const value = fixture();
    const occurrence = create(api, value);
    expect(Object.keys(occurrence).sort()).toEqual([
      "careerActionOccurrenceId", "careerExecutionContextRevisionId",
      "careerExecutionAuthorityGrantRevisionId", "careerHumanCommitmentId",
      "careerDecisionActionIntentId", "humanDecisionRecordId",
      "careerDecisionContextRevisionId", "decisionAuthorityGrantRevisionId",
      "recommendationProposalId", "performedByActorId", "decisionSubjects",
      "sourceDeclarationClass", "sourceActionIntentClass", "operationDescription",
      "executionAuthorityScope", "executionTarget", "executionChannel", "occurredAt",
      "occurrenceEvidenceRefs", "externalOccurrenceRef", "schemaVersion", "createdAt",
    ].sort());
    expect(occurrence).toMatchObject({
      careerExecutionContextRevisionId: value.executionContext.careerExecutionContextRevisionId,
      careerExecutionAuthorityGrantRevisionId: value.executionContext.careerExecutionAuthorityGrantRevisionId,
      careerHumanCommitmentId: value.executionContext.careerHumanCommitmentId,
      careerDecisionActionIntentId: value.executionContext.careerDecisionActionIntentId,
      humanDecisionRecordId: value.executionContext.humanDecisionRecordId,
      careerDecisionContextRevisionId: value.executionContext.careerDecisionContextRevisionId,
      decisionAuthorityGrantRevisionId: value.executionContext.decisionAuthorityGrantRevisionId,
      recommendationProposalId: value.executionContext.recommendationProposalId,
      performedByActorId: value.executionContext.declaredByActorId,
      decisionSubjects: value.executionContext.decisionSubjects,
      sourceDeclarationClass: value.executionContext.sourceDeclarationClass,
      sourceActionIntentClass: value.executionContext.sourceActionIntentClass,
      operationDescription: value.executionContext.operationDescription,
      executionAuthorityScope: value.executionContext.executionAuthorityScope,
      executionTarget: value.executionContext.executionTarget,
      executionChannel: value.executionContext.executionChannel,
      occurredAt: "2027-02-03T01:00:00.000Z",
      occurrenceEvidenceRefs: ["evidence://occurrence/t12e/a", "evidence://occurrence/t12e/b"],
      externalOccurrenceRef: "external://occurrence/t12e/1",
      schemaVersion: "CAREER_ACTION_OCCURRENCE_V1",
    });
    expect(occurrence.careerActionOccurrenceId).toMatch(/^AOC_[0-9A-F]{32}$/);
    for (const forbidden of [
      "declaredByActorId", "grantorActorId", "authorizedExecutionActorId",
      "permittedTargetKinds", "permittedChannelKinds", "actionType", "result", "status",
      "completion", "success", "failure", "delivery", "acknowledgement", "response",
      "stateChange", "outcome", "causality", "rationale",
    ]) expect(occurrence).not.toHaveProperty(forbidden);
  });

  it("accepts only the explicit occurrence declaration input and exact ECTXREV operand", async () => {
    const api = await loadActionOccurrence();
    const value = fixture();
    expect(Object.keys(input(value)).sort()).toEqual([
      "careerExecutionContextRevisionId", "performedByActorId", "occurredAt",
      "occurrenceEvidenceRefs", "externalOccurrenceRef", "createdAt",
    ].sort());
    for (const forbidden of [
      "careerExecutionAuthorityGrantRevisionId", "careerHumanCommitmentId",
      "careerDecisionActionIntentId", "humanDecisionRecordId", "careerDecisionContextRevisionId",
      "decisionAuthorityGrantRevisionId", "recommendationProposalId", "decisionSubjects",
      "operationDescription", "executionAuthorityScope", "executionTarget", "executionChannel",
      "sourceDeclarationClass", "sourceActionIntentClass", "schemaVersion", "actionType",
      "result", "status", "completion", "stateChange", "outcome", "rationale",
    ]) expect(() => create(api, value, { [forbidden]: "caller-override" })).toThrow(invalid);
    expect(() => create(api, value, {
      careerExecutionContextRevisionId: "ECTXREV_00000000000000000000000000000000",
    })).toThrow(invalid);
    expect(() => create(api, {
      ...value,
      executionContext: {
        ...value.executionContext,
        careerExecutionContextRevisionId: "ECTXREV_00000000000000000000000000000000",
      },
    })).toThrow(invalid);
  });

  it("enforces actual performer equality and occurrence time only against exact ECTXREV", async () => {
    const api = await loadActionOccurrence();
    const value = fixture();
    const context = value.executionContext;
    expect(create(api, value, { performedByActorId: ` ${context.declaredByActorId} ` })
      .performedByActorId).toBe(context.declaredByActorId);
    expect(create(api, value, { occurredAt: context.declaredAt }).occurredAt)
      .toBe(context.declaredAt);
    expect(create(api, value, { occurredAt: "2027-02-03T12:00:00.000Z" }).occurredAt)
      .toBe("2027-02-03T12:00:00.000Z");
    for (const more of [
      { performedByActorId: "" }, { performedByActorId: " " },
      { performedByActorId: value.grant.grantorActorId },
      { performedByActorId: value.commitment.committedByActorId },
      { performedByActorId: "FOREIGN_PERFORMER" },
      { occurredAt: "not-iso" }, { occurredAt: "2027-02-02T23:59:59.999Z" },
    ]) expect(() => create(api, value, more)).toThrow(invalid);
    const occurrence = create(api, value);
    expect(() => api.assertCareerActionOccurrence({
      ...occurrence, performedByActorId: ` ${context.declaredByActorId} `,
    })).toThrow(invalid);
    // The direct operand has no EAGR interval: the pure domain constructor must not load it.
    expect(occurrence.occurredAt).toBe("2027-02-03T01:00:00.000Z");
  });

  it("copies exact target, channel, operation, and complete subjects without reselection", async () => {
    const api = await loadActionOccurrence();
    const value = fixture();
    const occurrence = create(api, value);
    expect(occurrence.executionTarget).toEqual(value.executionContext.executionTarget);
    expect(occurrence.executionChannel).toEqual(value.executionContext.executionChannel);
    expect(occurrence.operationDescription).toBe(value.executionContext.operationDescription);
    expect(occurrence.decisionSubjects).toEqual(value.executionContext.decisionSubjects);
    expect(occurrence.decisionSubjects).toHaveLength(2);
    for (const callerSelection of [
      { executionTarget: { targetKind: "SYSTEM", targetRef: "target://other" } },
      { executionChannel: { channelKind: "API", channelRef: "channel://other" } },
      { operationDescription: "other operation" },
      { decisionSubjects: value.executionContext.decisionSubjects.slice(0, 1) },
    ]) expect(() => create(api, value, callerSelection)).toThrow(invalid);
    (occurrence.executionTarget as any).targetRef = "target://mutated";
    (occurrence.executionChannel as any).channelRef = "channel://mutated";
    (occurrence.decisionSubjects as any[]).pop();
    expect(value.executionContext.executionTarget.targetRef).toBe("target://person/t12d/1");
    expect(value.executionContext.executionChannel.channelRef).toBe("channel://email/t12d/1");
    expect(value.executionContext.decisionSubjects).toHaveLength(2);
  });

  it("canonicalizes occurrence evidence and external correlation without treating either as proof", async () => {
    const api = await loadActionOccurrence();
    const value = fixture();
    expect(create(api, value, { externalOccurrenceRef: null }).externalOccurrenceRef).toBeNull();
    expect(create(api, value, { externalOccurrenceRef: " external://opaque/2 " })
      .externalOccurrenceRef).toBe("external://opaque/2");
    for (const more of [
      { occurrenceEvidenceRefs: [] }, { occurrenceEvidenceRefs: [" "] },
      { occurrenceEvidenceRefs: ["evidence://a", "evidence://a"] },
      { occurrenceEvidenceRefs: ["evidence://a", " evidence://a "] },
      { externalOccurrenceRef: "" }, { externalOccurrenceRef: " " },
    ]) expect(() => create(api, value, more)).toThrow(invalid);
    const occurrence = create(api, value);
    for (const mutation of [
      { occurrenceEvidenceRefs: [...occurrence.occurrenceEvidenceRefs].reverse() },
      { occurrenceEvidenceRefs: ["evidence://occurrence/t12e/a", "evidence://occurrence/t12e/a"] },
      { externalOccurrenceRef: " external://occurrence/t12e/1 " },
    ]) expect(() => api.assertCareerActionOccurrence({ ...occurrence, ...mutation }))
      .toThrow(invalid);
    (occurrence.occurrenceEvidenceRefs as any[]).pop();
    expect(create(api, value).occurrenceEvidenceRefs).toHaveLength(2);
  });

  it("derives pure deterministic AOC identity from all semantic occurrence fields except createdAt", async () => {
    const api = await loadActionOccurrence();
    const occurrence = create(api);
    const semantic = { ...occurrence } as any;
    delete semantic.careerActionOccurrenceId;
    delete semantic.createdAt;
    expect(api.deriveCareerActionOccurrenceId(semantic)).toBe(occurrence.careerActionOccurrenceId);
    expect(create(api, fixture(), { createdAt: "2030-01-01T00:00:00.000Z" })
      .careerActionOccurrenceId).toBe(occurrence.careerActionOccurrenceId);
    for (const [field, changed] of [
      ["careerExecutionContextRevisionId", "ECTXREV_00000000000000000000000000000000"],
      ["careerExecutionAuthorityGrantRevisionId", "EAGR_00000000000000000000000000000000"],
      ["careerHumanCommitmentId", "HCOM_00000000000000000000000000000000"],
      ["careerDecisionActionIntentId", "DAINT_00000000000000000000000000000000"],
      ["humanDecisionRecordId", "DCR_00000000000000000000000000000000"],
      ["careerDecisionContextRevisionId", "DCTXREV_00000000000000000000000000000000"],
      ["decisionAuthorityGrantRevisionId", "DAR_00000000000000000000000000000000"],
      ["recommendationProposalId", "RCP_00000000000000000000000000000000"],
      ["performedByActorId", "OTHER_PERFORMER"],
      ["decisionSubjects", [...occurrence.decisionSubjects].reverse()],
      ["sourceDeclarationClass", "REQUEST_FURTHER_EVIDENCE"],
      ["sourceActionIntentClass", "FURTHER_EVIDENCE_REQUEST_OPERATIONALIZATION"],
      ["operationDescription", "A different operation"],
      ["executionAuthorityScope", "FURTHER_EVIDENCE_REQUEST_EXECUTION"],
      ["executionTarget", { targetKind: "SYSTEM", targetRef: "target://other" }],
      ["executionChannel", { channelKind: "API", channelRef: "channel://other" }],
      ["occurredAt", "2027-02-03T01:00:01.000Z"],
      ["occurrenceEvidenceRefs", ["evidence://occurrence/t12e/c"]],
      ["externalOccurrenceRef", null],
    ] as const) {
      const changedPayload = { ...semantic, [field]: changed };
      const changedId = api.deriveCareerActionOccurrenceId(changedPayload);
      expect(changedId).toMatch(/^AOC_[0-9A-F]{32}$/);
      expect(changedId).not.toBe(occurrence.careerActionOccurrenceId);
      expect(() => api.assertCareerActionOccurrence({ ...occurrence, ...changedPayload }))
        .toThrow(invalid);
    }
    // Pure derivation has no ECTXREV or EAGR operand and cannot enforce their relational laws.
    expect(api.deriveCareerActionOccurrenceId({
      ...semantic,
      performedByActorId: "UNRELATED_PERFORMER",
      occurredAt: "2030-01-01T00:00:00.000Z",
    })).toMatch(/^AOC_[0-9A-F]{32}$/);
  });

  it("rejects stale standalone state and exposes no regeneration, outcome, or mutable-authority surface", async () => {
    const api = await loadActionOccurrence();
    const occurrence = create(api);
    for (const mutation of [
      { careerActionOccurrenceId: "AOC_00000000000000000000000000000000" },
      { schemaVersion: "CAREER_ACTION_OCCURRENCE_V0" },
      { occurredAt: "not-iso" }, { createdAt: "not-iso" },
      { performedByActorId: " FOREIGN " },
      { externalOccurrenceRef: " external://occurrence/t12e/1 " },
      { unknown: "field" },
    ]) expect(() => api.assertCareerActionOccurrence({ ...occurrence, ...mutation }))
      .toThrow(invalid);
    for (const forbidden of [
      "getCurrentCareerActionOccurrence", "getLatestCareerActionOccurrence",
      "regenerateCareerActionOccurrence", "createAutomatically", "repairCareerActionOccurrence",
      "replaceCareerActionOccurrence", "supersedeCareerActionOccurrence", "createCareerStateChange",
      "createCareerOutcome", "createActionOccurrenceClaim",
    ]) expect(api).not.toHaveProperty(forbidden);
    expect(Object.keys(api).sort()).toEqual([
      "assertCareerActionOccurrence", "createCareerActionOccurrence",
      "deriveCareerActionOccurrenceId", "stableCareerActionOccurrence",
    ].sort());
  });
});
