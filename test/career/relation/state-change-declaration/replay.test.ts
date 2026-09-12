import { describe, expect, it } from "vitest";
import { createT12FHistoricalFixture, exactRepository } from "./t12f-historical-fixture";

const loadReplay = () =>
  import("../../../../lib/career/relation/state-change-declaration/replay") as Promise<any>;
const missing = "SCD_00000000000000000000000000000000";

function graph(overrides: Record<string, any> = {}) {
  const value = createT12FHistoricalFixture();
  const item = (name: string, fallback: any) => Object.hasOwn(overrides, name) ? overrides[name] : fallback;
  const declaration = item("declaration", value.stateChangeDeclaration);
  const physicalDeclarationId = item(
    "physicalDeclarationId",
    declaration === null ? null : declaration.careerStateChangeDeclarationId,
  );
  const declarationCalls: string[] = [];
  return {
    value,
    declarations: {
      calls: declarationCalls,
      async getCareerStateChangeDeclarationById(id: string) {
        declarationCalls.push(id);
        return declaration !== null && physicalDeclarationId === id ? structuredClone(declaration) : null;
      },
    },
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
  api.byteReplayCareerStateChangeDeclaration(value.value.stateChangeDeclaration.careerStateChangeDeclarationId, value);
const semantic = (api: any, value: ReturnType<typeof graph>) =>
  api.semanticReplayCareerStateChangeDeclaration(value.value.stateChangeDeclaration.careerStateChangeDeclarationId, value);

describe("T12F CareerStateChangeDeclaration replay RED contract", () => {
  it("constructs canonical RCP -> DAR -> DCTXREV -> DCR -> DAINT -> HCOM -> EAGR -> ECTXREV -> AOC -> SCD history before replay", () => {
    const value = createT12FHistoricalFixture();
    expect(value.stateChangeDeclaration.careerActionOccurrenceId).toBe(value.occurrence.careerActionOccurrenceId);
    expect(value.stateChangeDeclaration.actionOccurredAt).toBe(value.occurrence.occurredAt);
    expect(value.stateChangeDeclaration.observedAt > value.grant.effectiveUntil!).toBe(true);
  });

  it("BYTE_REPLAY returns detached SCD history without predecessor traversal and preserves genuine absence", async () => {
    const api = await loadReplay(); const value = graph();
    const first = await byte(api, value); expect(first).toEqual(value.value.stateChangeDeclaration);
    first.stateSubject.subjectRef = "local";
    await expect(byte(api, value)).resolves.toEqual(value.value.stateChangeDeclaration);
    expect(value.occurrences.calls).toEqual([]); expect(value.grants.calls).toEqual([]);
    const absent = graph({ declaration: null });
    await expect(api.byteReplayCareerStateChangeDeclaration(missing, absent))
      .rejects.toThrow("ERR_CAREER_STATE_CHANGE_DECLARATION_NOT_FOUND");
  });

  it("SEMANTIC_REPLAY exact-reads SCD -> AOC -> ECTXREV -> EAGR -> HCOM -> DAINT -> DCR -> DCTXREV -> DAR -> RCP", async () => {
    const api = await loadReplay(); const value = graph();
    await expect(semantic(api, value)).resolves.toEqual(value.value.stateChangeDeclaration);
    expect(value.declarations.calls).toEqual([value.value.stateChangeDeclaration.careerStateChangeDeclarationId]);
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

  it("DERIVATION_REPLAY verifies only persisted SCD identity and never reconstructs absence", async () => {
    const api = await loadReplay(); const value = graph();
    await expect(api.derivationReplayCareerStateChangeDeclaration(
      value.value.stateChangeDeclaration.careerStateChangeDeclarationId, value,
    )).resolves.toEqual(value.value.stateChangeDeclaration);
    expect(value.occurrences.calls).toEqual([]); expect(value.grants.calls).toEqual([]);
    const absent = graph({ declaration: null });
    await expect(api.derivationReplayCareerStateChangeDeclaration(missing, absent))
      .rejects.toThrow("ERR_CAREER_STATE_CHANGE_DECLARATION_NOT_FOUND");
  });

  it("distinguishes missing physical root from a found root with corrupt SCD identity", async () => {
    const api = await loadReplay(); const value = createT12FHistoricalFixture();
    const found = graph({
      declaration: { ...value.stateChangeDeclaration, careerStateChangeDeclarationId: missing },
      physicalDeclarationId: value.stateChangeDeclaration.careerStateChangeDeclarationId,
    });
    await expect(semantic(api, found))
      .rejects.toThrow("ERR_CAREER_STATE_CHANGE_DECLARATION_REPLAY_MISMATCH");
    expect(found.declarations.calls).toEqual([value.stateChangeDeclaration.careerStateChangeDeclarationId]);
  });

  it("fails closed for SCD/AOC witnesses, state observations, state subject/dimension, subjects, target/channel, and temporal ordering", async () => {
    const api = await loadReplay(); const value = createT12FHistoricalFixture();
    for (const declaration of [
      { ...value.stateChangeDeclaration, careerActionOccurrenceId: "AOC_00000000000000000000000000000000" },
      { ...value.stateChangeDeclaration, careerExecutionContextRevisionId: "ECTXREV_00000000000000000000000000000000" },
      { ...value.stateChangeDeclaration, performedByActorId: "OTHER" },
      { ...value.stateChangeDeclaration, decisionSubjects: value.stateChangeDeclaration.decisionSubjects.slice(0, 1) },
      { ...value.stateChangeDeclaration, operationDescription: "tampered" },
      { ...value.stateChangeDeclaration, executionTarget: { targetKind: "SYSTEM", targetRef: "target://other" } },
      { ...value.stateChangeDeclaration, executionChannel: { channelKind: "API", channelRef: "channel://other" } },
      { ...value.stateChangeDeclaration, actionOccurredAt: "2027-02-03T01:00:01.000Z" },
      { ...value.stateChangeDeclaration, observedAt: "2027-02-03T00:59:59.999Z" },
      { ...value.stateChangeDeclaration, stateSubject: { subjectKind: "SYSTEM", subjectRef: "state://other" } },
      { ...value.stateChangeDeclaration, stateDimension: "other" },
      { ...value.stateChangeDeclaration, beforeObservation: { observationState: "OBSERVED", value: "interview-invited" } },
      { ...value.stateChangeDeclaration, afterObservation: { observationState: "UNKNOWN", value: null } },
      { ...value.stateChangeDeclaration, stateChangeEvidenceRefs: ["evidence://other"] },
    ]) await expect(semantic(api, graph({ declaration })))
      .rejects.toThrow("ERR_CAREER_STATE_CHANGE_DECLARATION_REPLAY_MISMATCH");
  });

  it("fails closed for missing or corrupt AOC, ECTXREV, EAGR, HCOM, DAINT, DCR, DCTXREV, DAR, and RCP history", async () => {
    const api = await loadReplay(); const value = createT12FHistoricalFixture();
    for (const overrides of [
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
      .rejects.toThrow("ERR_CAREER_STATE_CHANGE_DECLARATION_REPLAY_MISMATCH");
  });

  it("preserves SCD observation after EAGR expiry without causal/outcome escalation and exposes only frozen replay modes", async () => {
    const api = await loadReplay(); const value = graph();
    expect(value.value.occurrence.occurredAt < value.value.grant.effectiveUntil!).toBe(true);
    expect(value.value.stateChangeDeclaration.observedAt > value.value.grant.effectiveUntil!).toBe(true);
    await expect(semantic(api, value)).resolves.toEqual(value.value.stateChangeDeclaration);
    expect(Object.keys(api)).not.toEqual(expect.arrayContaining([
      "providerReplayCareerStateChangeDeclaration", "currentReplayCareerStateChangeDeclaration",
      "getCurrentCareerStateChangeDeclaration", "getLatestCareerStateChangeDeclaration",
      "repairCareerStateChangeDeclaration", "replaceCareerStateChangeDeclaration",
      "supersedeCareerStateChangeDeclaration", "regenerateCareerStateChangeDeclaration",
      "createCareerOutcome", "createActionStateChangeAssociationProposal", "createOutcomeAttributionProposal",
    ]));
    if ("CAREER_STATE_CHANGE_DECLARATION_REPLAY_MODES" in api) {
      expect(api.CAREER_STATE_CHANGE_DECLARATION_REPLAY_MODES)
        .toEqual(["BYTE_REPLAY", "SEMANTIC_REPLAY", "DERIVATION_REPLAY"]);
    }
  });
});
