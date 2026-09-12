import { describe, expect, it } from "vitest";
import { createT12GHistoricalFixture, exactRepository } from "./t12g-historical-fixture";

const loadReplay = () =>
  import("../../../../lib/career/relation/action-state-change-association-declaration/replay") as Promise<any>;
const missing = "ASCAD_00000000000000000000000000000000";

function graph(overrides: Record<string, any> = {}) {
  const value = createT12GHistoricalFixture();
  const item = (name: string, fallback: any) => Object.hasOwn(overrides, name) ? overrides[name] : fallback;
  const association = item("association", value.associationDeclaration);
  const physicalAssociationId = item(
    "physicalAssociationId",
    association === null ? null : association.careerActionStateChangeAssociationDeclarationId,
  );
  const associationCalls: string[] = [];
  return {
    value,
    associations: {
      calls: associationCalls,
      async getCareerActionStateChangeAssociationDeclarationById(id: string) {
        associationCalls.push(id);
        return association !== null && physicalAssociationId === id ? structuredClone(association) : null;
      },
    },
    stateChanges: exactRepository(item("stateChange", value.stateChangeDeclaration), "careerStateChangeDeclarationId", "getCareerStateChangeDeclarationById"),
    occurrences: exactRepository(item("occurrence", value.occurrence), "careerActionOccurrenceId", "getCareerActionOccurrenceById"),
    contexts: exactRepository(item("executionContext", value.executionContext), "careerExecutionContextRevisionId", "getCareerExecutionContextRevisionById"),
    grants: exactRepository(item("grant", value.grant), "careerExecutionAuthorityGrantRevisionId", "getCareerExecutionAuthorityGrantRevisionById"),
    commitments: exactRepository(item("commitment", value.commitment), "careerHumanCommitmentId", "getCareerHumanCommitmentById"),
    intents: exactRepository(item("intent", value.actionIntent), "careerDecisionActionIntentId", "getCareerDecisionActionIntentById"),
    records: exactRepository(item("record", value.decisionRecord), "humanDecisionRecordId", "getHumanDecisionRecordById"),
    decisionContexts: exactRepository(item("decisionContext", value.context), "careerDecisionContextRevisionId", "getCareerDecisionContextRevisionById"),
    authorities: exactRepository(item("authority", value.authority), "decisionAuthorityGrantRevisionId", "getDecisionAuthorityGrantRevisionById"),
    proposals: exactRepository(item("proposal", value.proposal), "recommendationProposalId", "getRecommendationProposalById"),
  };
}

const byte = (api: any, value: ReturnType<typeof graph>) =>
  api.byteReplayCareerActionStateChangeAssociationDeclaration(
    value.value.associationDeclaration.careerActionStateChangeAssociationDeclarationId, value,
  );
const semantic = (api: any, value: ReturnType<typeof graph>) =>
  api.semanticReplayCareerActionStateChangeAssociationDeclaration(
    value.value.associationDeclaration.careerActionStateChangeAssociationDeclarationId, value,
  );

describe("T12G CareerActionStateChangeAssociationDeclaration replay RED contract", () => {
  it("constructs canonical RCP -> DAR -> DCTXREV -> DCR -> DAINT -> HCOM -> EAGR -> ECTXREV -> AOC -> SCD -> ASCAD history", () => {
    const value = createT12GHistoricalFixture();
    expect(value.associationDeclaration.careerStateChangeDeclarationId)
      .toBe(value.stateChangeDeclaration.careerStateChangeDeclarationId);
    expect(value.associationDeclaration.declaredByActorId).not.toBe(value.occurrence.performedByActorId);
    expect(value.associationDeclaration.declaredByActorId).not.toBe(value.stateChangeDeclaration.observedByActorId);
    expect(value.occurrence.occurredAt < value.grant.effectiveUntil!).toBe(true);
    expect(value.stateChangeDeclaration.observedAt > value.grant.effectiveUntil!).toBe(true);
    expect(value.associationDeclaration.declaredAt > value.grant.effectiveUntil!).toBe(true);
  });

  it("BYTE_REPLAY returns detached stored ASCAD without predecessor traversal and preserves genuine absence", async () => {
    const api = await loadReplay(); const value = graph();
    const first = await byte(api, value); expect(first).toEqual(value.value.associationDeclaration);
    first.stateSubject.subjectRef = "local";
    await expect(byte(api, value)).resolves.toEqual(value.value.associationDeclaration);
    expect(value.stateChanges.calls).toEqual([]); expect(value.occurrences.calls).toEqual([]); expect(value.grants.calls).toEqual([]);
    const absent = graph({ association: null });
    await expect(api.byteReplayCareerActionStateChangeAssociationDeclaration(missing, absent))
      .rejects.toThrow("ERR_CAREER_ACTION_STATE_CHANGE_ASSOCIATION_DECLARATION_NOT_FOUND");
  });

  it("SEMANTIC_REPLAY exact-reads ASCAD -> SCD -> AOC -> ECTXREV -> EAGR -> HCOM -> DAINT -> DCR -> DCTXREV -> DAR -> RCP", async () => {
    const api = await loadReplay(); const value = graph();
    await expect(semantic(api, value)).resolves.toEqual(value.value.associationDeclaration);
    expect(value.associations.calls).toEqual([value.value.associationDeclaration.careerActionStateChangeAssociationDeclarationId]);
    expect(value.stateChanges.calls).toEqual([value.value.stateChangeDeclaration.careerStateChangeDeclarationId]);
    expect(value.occurrences.calls).toEqual([value.value.occurrence.careerActionOccurrenceId]);
    expect(value.contexts.calls).toEqual([value.value.executionContext.careerExecutionContextRevisionId]);
    expect(value.grants.calls).toEqual([value.value.grant.careerExecutionAuthorityGrantRevisionId]);
    expect(value.commitments.calls).toEqual([value.value.commitment.careerHumanCommitmentId]);
    expect(value.intents.calls).toEqual([value.value.actionIntent.careerDecisionActionIntentId]);
    expect(value.records.calls).toEqual([value.value.decisionRecord.humanDecisionRecordId]);
    expect(value.decisionContexts.calls).toEqual([value.value.context.careerDecisionContextRevisionId]);
    expect(value.authorities.calls).toEqual([value.value.authority.decisionAuthorityGrantRevisionId]);
    expect(value.proposals.calls).toEqual([value.value.proposal.recommendationProposalId]);
  });

  it("DERIVATION_REPLAY recomputes only stored ASCAD identity and never reconstructs absence", async () => {
    const api = await loadReplay(); const value = graph();
    await expect(api.derivationReplayCareerActionStateChangeAssociationDeclaration(
      value.value.associationDeclaration.careerActionStateChangeAssociationDeclarationId, value,
    )).resolves.toEqual(value.value.associationDeclaration);
    expect(value.stateChanges.calls).toEqual([]); expect(value.occurrences.calls).toEqual([]); expect(value.grants.calls).toEqual([]);
    const absent = graph({ association: null });
    await expect(api.derivationReplayCareerActionStateChangeAssociationDeclaration(missing, absent))
      .rejects.toThrow("ERR_CAREER_ACTION_STATE_CHANGE_ASSOCIATION_DECLARATION_NOT_FOUND");
  });

  it("maps a found physical root with corrupt ASCAD identity or copied SCD state to replay mismatch", async () => {
    const api = await loadReplay(); const value = createT12GHistoricalFixture();
    const found = graph({
      association: { ...value.associationDeclaration, careerActionStateChangeAssociationDeclarationId: missing },
      physicalAssociationId: value.associationDeclaration.careerActionStateChangeAssociationDeclarationId,
    });
    await expect(semantic(api, found))
      .rejects.toThrow("ERR_CAREER_ACTION_STATE_CHANGE_ASSOCIATION_DECLARATION_REPLAY_MISMATCH");
    for (const association of [
      { ...value.associationDeclaration, careerStateChangeDeclarationId: "SCD_00000000000000000000000000000000" },
      { ...value.associationDeclaration, careerActionOccurrenceId: "AOC_00000000000000000000000000000000" },
      { ...value.associationDeclaration, performedByActorId: "OTHER" },
      { ...value.associationDeclaration, decisionSubjects: value.associationDeclaration.decisionSubjects.slice(0, 1) },
      { ...value.associationDeclaration, executionTarget: { targetKind: "SYSTEM", targetRef: "target://other" } },
      { ...value.associationDeclaration, declaredAt: "2027-02-04T00:59:59.999Z" },
      { ...value.associationDeclaration, associationEvidenceRefs: ["evidence://other"] },
    ]) await expect(semantic(api, graph({ association })))
      .rejects.toThrow("ERR_CAREER_ACTION_STATE_CHANGE_ASSOCIATION_DECLARATION_REPLAY_MISMATCH");
  });

  it("maps missing or corrupt SCD and all earlier required history to replay mismatch after ASCAD exists", async () => {
    const api = await loadReplay(); const value = createT12GHistoricalFixture();
    for (const overrides of [
      { stateChange: null }, { stateChange: { ...value.stateChangeDeclaration, observedByActorId: "OTHER" } },
      { occurrence: null }, { occurrence: { ...value.occurrence, performedByActorId: "OTHER" } },
      { executionContext: null }, { executionContext: { ...value.executionContext, declaredByActorId: "OTHER" } },
      { grant: null }, { grant: { ...value.grant, authorizedExecutionActorId: "OTHER" } },
      { commitment: null }, { commitment: { ...value.commitment, operationDescription: "tampered" } },
      { intent: null }, { intent: { ...value.actionIntent, operationDescription: "tampered" } },
      { record: null }, { record: { ...value.decisionRecord, declarantActorId: "OTHER" } },
      { decisionContext: null }, { decisionContext: { ...value.context, authorityScope: "BROKEN" } },
      { authority: null }, { authority: { ...value.authority, authorizedActorId: "OTHER" } },
      { proposal: null }, { proposal: { ...value.proposal, schemaVersion: "RECOMMENDATION_PROPOSAL_V0" } },
    ]) await expect(semantic(api, graph(overrides)))
      .rejects.toThrow("ERR_CAREER_ACTION_STATE_CHANGE_ASSOCIATION_DECLARATION_REPLAY_MISMATCH");
  });

  it("preserves post-expiry declaration chronology without relation, effect, outcome, or causal escalation and exposes only frozen modes", async () => {
    const api = await loadReplay(); const value = graph();
    expect(value.value.occurrence.occurredAt < value.value.grant.effectiveUntil!).toBe(true);
    expect(value.value.stateChangeDeclaration.observedAt > value.value.grant.effectiveUntil!).toBe(true);
    expect(value.value.associationDeclaration.declaredAt > value.value.grant.effectiveUntil!).toBe(true);
    await expect(semantic(api, value)).resolves.toEqual(value.value.associationDeclaration);
    expect(Object.keys(api)).not.toEqual(expect.arrayContaining([
      "providerReplayCareerActionStateChangeAssociationDeclaration", "currentReplayCareerActionStateChangeAssociationDeclaration",
      "getCurrentCareerActionStateChangeAssociationDeclaration", "getLatestCareerActionStateChangeAssociationDeclaration",
      "repairCareerActionStateChangeAssociationDeclaration", "replaceCareerActionStateChangeAssociationDeclaration",
      "supersedeCareerActionStateChangeAssociationDeclaration", "regenerateCareerActionStateChangeAssociationDeclaration",
      "createCareerOutcome", "createOutcomeAttributionProposal", "createActionStateChangeAssociationProposal",
    ]));
    if ("CAREER_ACTION_STATE_CHANGE_ASSOCIATION_DECLARATION_REPLAY_MODES" in api) {
      expect(api.CAREER_ACTION_STATE_CHANGE_ASSOCIATION_DECLARATION_REPLAY_MODES)
        .toEqual(["BYTE_REPLAY", "SEMANTIC_REPLAY", "DERIVATION_REPLAY"]);
    }
  });
});
