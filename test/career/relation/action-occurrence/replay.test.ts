import { describe, expect, it } from "vitest";
import { createT12EHistoricalFixture, exactRepository } from "./t12e-historical-fixture";

const loadReplay = () =>
  import("../../../../lib/career/relation/action-occurrence/replay") as Promise<any>;
const missing = "AOC_00000000000000000000000000000000";

function graph(overrides: Record<string, any> = {}) {
  const value = createT12EHistoricalFixture();
  const item = (name: string, fallback: any) => Object.hasOwn(overrides, name) ? overrides[name] : fallback;
  const occurrence = item("occurrence", value.occurrence);
  const physicalOccurrenceId = item(
    "physicalOccurrenceId",
    occurrence === null ? null : occurrence.careerActionOccurrenceId,
  );
  const occurrenceCalls: string[] = [];
  return {
    value,
    occurrences: {
      calls: occurrenceCalls,
      async getCareerActionOccurrenceById(id: string) {
        occurrenceCalls.push(id);
        return occurrence !== null && physicalOccurrenceId === id ? structuredClone(occurrence) : null;
      },
    },
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
  api.byteReplayCareerActionOccurrence(value.value.occurrence.careerActionOccurrenceId, value);
const semantic = (api: any, value: ReturnType<typeof graph>) =>
  api.semanticReplayCareerActionOccurrence(value.value.occurrence.careerActionOccurrenceId, value);

describe("T12E CareerActionOccurrence replay RED contract", () => {
  it("constructs canonical RCP -> DAR -> DCTXREV -> DCR -> DAINT -> HCOM -> EAGR -> ECTXREV -> AOC history before replay", () => {
    const value = createT12EHistoricalFixture();
    expect(value.occurrence.careerExecutionContextRevisionId)
      .toBe(value.executionContext.careerExecutionContextRevisionId);
    expect(value.occurrence.performedByActorId).toBe(value.grant.authorizedExecutionActorId);
    expect(value.executionContext.declaredAt < value.occurrence.occurredAt).toBe(true);
    expect(value.occurrence.occurredAt < value.grant.effectiveUntil!).toBe(true);
  });

  it("BYTE_REPLAY returns detached AOC history without semantic-chain traversal and preserves genuine absence", async () => {
    const api = await loadReplay(); const value = graph();
    const first = await byte(api, value); expect(first).toEqual(value.value.occurrence);
    first.executionTarget.targetRef = "local";
    await expect(byte(api, value)).resolves.toEqual(value.value.occurrence);
    expect(value.contexts.calls).toEqual([]); expect(value.grants.calls).toEqual([]);
    const absent = graph({ occurrence: null });
    await expect(api.byteReplayCareerActionOccurrence(missing, absent))
      .rejects.toThrow("ERR_CAREER_ACTION_OCCURRENCE_NOT_FOUND");
  });

  it("SEMANTIC_REPLAY exact-reads AOC -> ECTXREV -> EAGR -> HCOM -> DAINT -> DCR -> DCTXREV -> DAR -> RCP", async () => {
    const api = await loadReplay(); const value = graph();
    await expect(semantic(api, value)).resolves.toEqual(value.value.occurrence);
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

  it("DERIVATION_REPLAY verifies only persisted AOC identity and never regenerates absence", async () => {
    const api = await loadReplay(); const value = graph();
    await expect(api.derivationReplayCareerActionOccurrence(
      value.value.occurrence.careerActionOccurrenceId, value,
    )).resolves.toEqual(value.value.occurrence);
    expect(value.contexts.calls).toEqual([]); expect(value.grants.calls).toEqual([]);
    const absent = graph({ occurrence: null });
    await expect(api.derivationReplayCareerActionOccurrence(missing, absent))
      .rejects.toThrow("ERR_CAREER_ACTION_OCCURRENCE_NOT_FOUND");
  });

  it("distinguishes missing physical root from a found root with a corrupt payload identity", async () => {
    const api = await loadReplay(); const value = createT12EHistoricalFixture();
    const found = graph({
      occurrence: { ...value.occurrence, careerActionOccurrenceId: missing },
      physicalOccurrenceId: value.occurrence.careerActionOccurrenceId,
    });
    await expect(semantic(api, found))
      .rejects.toThrow("ERR_CAREER_ACTION_OCCURRENCE_REPLAY_MISMATCH");
    expect(found.occurrences.calls).toEqual([value.occurrence.careerActionOccurrenceId]);
  });

  it("fails closed for AOC/ECTXREV/EAGR witnesses, performer, target/channel, subjects, evidence, and occurrence time", async () => {
    const api = await loadReplay(); const value = createT12EHistoricalFixture();
    for (const occurrence of [
      { ...value.occurrence, careerExecutionContextRevisionId: "ECTXREV_00000000000000000000000000000000" },
      { ...value.occurrence, careerExecutionAuthorityGrantRevisionId: "EAGR_00000000000000000000000000000000" },
      { ...value.occurrence, careerHumanCommitmentId: "HCOM_00000000000000000000000000000000" },
      { ...value.occurrence, performedByActorId: "OTHER" },
      { ...value.occurrence, decisionSubjects: value.occurrence.decisionSubjects.slice(0, 1) },
      { ...value.occurrence, sourceDeclarationClass: "REQUEST_FURTHER_EVIDENCE" },
      { ...value.occurrence, sourceActionIntentClass: "FURTHER_EVIDENCE_REQUEST_OPERATIONALIZATION" },
      { ...value.occurrence, operationDescription: "tampered" },
      { ...value.occurrence, executionAuthorityScope: "FURTHER_EVIDENCE_REQUEST_EXECUTION" },
      { ...value.occurrence, executionTarget: { targetKind: "SYSTEM", targetRef: "target://other" } },
      { ...value.occurrence, executionChannel: { channelKind: "MESSAGE", channelRef: "channel://other" } },
      { ...value.occurrence, occurredAt: "2027-02-02T23:59:59.999Z" },
      { ...value.occurrence, occurredAt: value.grant.effectiveUntil },
      { ...value.occurrence, occurredAt: "2027-02-04T00:00:00.001Z" },
      { ...value.occurrence, occurrenceEvidenceRefs: ["evidence://other"] },
    ]) await expect(semantic(api, graph({ occurrence })))
      .rejects.toThrow("ERR_CAREER_ACTION_OCCURRENCE_REPLAY_MISMATCH");
  });

  it("fails closed for missing or invalid ECTXREV, EAGR, HCOM, DAINT, DCR, DCTXREV, DAR, and RCP", async () => {
    const api = await loadReplay(); const value = createT12EHistoricalFixture();
    for (const overrides of [
      { executionContext: null }, { executionContext: { ...value.executionContext, declaredByActorId: "OTHER" } },
      { grant: null }, { grant: { ...value.grant, authorizedExecutionActorId: "OTHER" } },
      { commitment: null }, { commitment: { ...value.commitment, operationDescription: "tampered" } },
      { intent: null }, { intent: { ...value.actionIntent, operationDescription: "tampered" } },
      { record: null }, { record: { ...value.decisionRecord, declarantActorId: "OTHER" } },
      { decisionContext: null }, { decisionContext: { ...value.context, authorityScope: "BROKEN" } },
      { authority: null }, { authority: { ...value.authority, authorizedActorId: "OTHER" } },
      { proposal: null }, { proposal: { ...value.proposal, schemaVersion: "RECOMMENDATION_PROPOSAL_V0" } },
    ]) await expect(semantic(api, graph(overrides)))
      .rejects.toThrow("ERR_CAREER_ACTION_OCCURRENCE_REPLAY_MISMATCH");
  });

  it("preserves historical validity before later expiry, never reevaluates DAR at occurrence time, and exposes no regeneration surface", async () => {
    const api = await loadReplay(); const value = graph();
    expect(value.value.occurrence.occurredAt < value.value.grant.effectiveUntil!).toBe(true);
    expect(value.value.grant.declaredAt > value.value.authority.effectiveUntil!).toBe(true);
    await expect(semantic(api, value)).resolves.toEqual(value.value.occurrence);
    expect(Object.keys(api)).not.toEqual(expect.arrayContaining([
      "providerReplayCareerActionOccurrence", "executionReplayCareerActionOccurrence",
      "getCurrentCareerActionOccurrence", "getLatestCareerActionOccurrence",
      "repairCareerActionOccurrence", "replaceCareerActionOccurrence",
      "supersedeCareerActionOccurrence", "regenerateCareerActionOccurrence",
      "createCareerStateChange", "createCareerOutcome",
    ]));
    if ("CAREER_ACTION_OCCURRENCE_REPLAY_MODES" in api) {
      expect(api.CAREER_ACTION_OCCURRENCE_REPLAY_MODES)
        .toEqual(["BYTE_REPLAY", "SEMANTIC_REPLAY", "DERIVATION_REPLAY"]);
    }
  });
});
