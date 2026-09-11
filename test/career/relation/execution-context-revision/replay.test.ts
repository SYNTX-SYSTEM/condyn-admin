import { describe, expect, it } from "vitest";
import { createT12DHistoricalFixture, exactRepository } from "./t12d-historical-fixture";

const loadReplay = () =>
  import("../../../../lib/career/relation/execution-context-revision/replay") as Promise<any>;
const missing = "ECTXREV_00000000000000000000000000000000";

function graph(overrides: Record<string, any> = {}) {
  const value = createT12DHistoricalFixture();
  const item = (name: string, fallback: any) => Object.hasOwn(overrides, name) ? overrides[name] : fallback;
  const executionContext = item("executionContext", value.executionContext);
  const physicalContextId = item(
    "physicalContextId",
    executionContext === null ? null : executionContext.careerExecutionContextRevisionId,
  );
  const contextCalls: string[] = [];
  return {
    value,
    contexts: {
      calls: contextCalls,
      async getCareerExecutionContextRevisionById(id: string) {
        contextCalls.push(id);
        return executionContext !== null && physicalContextId === id
          ? structuredClone(executionContext)
          : null;
      },
    },
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
  api.byteReplayCareerExecutionContextRevision(
    value.value.executionContext.careerExecutionContextRevisionId, value,
  );
const semantic = (api: any, value: ReturnType<typeof graph>) =>
  api.semanticReplayCareerExecutionContextRevision(
    value.value.executionContext.careerExecutionContextRevisionId, value,
  );

describe("T12D CareerExecutionContextRevision replay RED contract", () => {
  it("constructs a canonical ECTXREV fixture before the missing replay boundary", () => {
    const value = createT12DHistoricalFixture();
    expect(value.executionContext.careerExecutionAuthorityGrantRevisionId)
      .toBe(value.grant.careerExecutionAuthorityGrantRevisionId);
    expect(value.executionContext.declaredByActorId).toBe(value.grant.authorizedExecutionActorId);
    expect(value.executionContext.executionTarget.targetKind).toBe("PERSON");
    expect(value.executionContext.executionChannel.channelKind).toBe("EMAIL");
  });

  it("BYTE_REPLAY returns exact detached history, does not read EAGR, and preserves missing root", async () => {
    const api = await loadReplay(); const value = graph();
    const first = await byte(api, value); expect(first).toEqual(value.value.executionContext);
    first.executionTarget.targetRef = "local";
    await expect(byte(api, value)).resolves.toEqual(value.value.executionContext);
    expect(value.grants.calls).toEqual([]);
    const absent = graph({ executionContext: null });
    await expect(api.byteReplayCareerExecutionContextRevision(missing, absent))
      .rejects.toThrow("ERR_CAREER_EXECUTION_CONTEXT_REVISION_NOT_FOUND");
  });

  it("SEMANTIC_REPLAY exact-reads ECTXREV -> EAGR -> HCOM -> DAINT -> DCR -> DCTXREV -> DAR -> RCP", async () => {
    const api = await loadReplay(); const value = graph();
    await expect(semantic(api, value)).resolves.toEqual(value.value.executionContext);
    expect(value.contexts.calls).toEqual([value.value.executionContext.careerExecutionContextRevisionId]);
    expect(value.grants.calls).toEqual([value.value.grant.careerExecutionAuthorityGrantRevisionId]);
    expect(value.commitments.calls).toEqual([value.value.commitment.careerHumanCommitmentId]);
    expect(value.intents.calls).toEqual([value.value.actionIntent.careerDecisionActionIntentId]);
    expect(value.records.calls).toEqual([value.value.decisionRecord.humanDecisionRecordId]);
    expect(value.decisionContexts.calls).toEqual([value.value.context.careerDecisionContextRevisionId]);
    expect(value.authorities.calls).toEqual([value.value.authority.decisionAuthorityGrantRevisionId]);
    expect(value.proposals.calls).toEqual([value.value.proposal.recommendationProposalId]);
  });

  it("DERIVATION_REPLAY verifies only persisted ECTXREV identity and never creates missing context", async () => {
    const api = await loadReplay(); const value = graph();
    await expect(api.derivationReplayCareerExecutionContextRevision(
      value.value.executionContext.careerExecutionContextRevisionId, value,
    )).resolves.toEqual(value.value.executionContext);
    expect(value.grants.calls).toEqual([]); expect(value.commitments.calls).toEqual([]);
    const absent = graph({ executionContext: null });
    await expect(api.derivationReplayCareerExecutionContextRevision(missing, absent))
      .rejects.toThrow("ERR_CAREER_EXECUTION_CONTEXT_REVISION_NOT_FOUND");
  });

  it("distinguishes missing physical root from a found root with corrupt ECTXREV payload identity", async () => {
    const api = await loadReplay(); const value = createT12DHistoricalFixture();
    const found = graph({
      executionContext: {
        ...value.executionContext,
        careerExecutionContextRevisionId: missing,
      },
      physicalContextId: value.executionContext.careerExecutionContextRevisionId,
    });
    await expect(semantic(api, found))
      .rejects.toThrow("ERR_CAREER_EXECUTION_CONTEXT_REVISION_REPLAY_MISMATCH");
    expect(found.contexts.calls).toEqual([value.executionContext.careerExecutionContextRevisionId]);
  });

  it("fails closed for ECTXREV copied witnesses, actor, target, channel, subjects, evidence, scope, and time", async () => {
    const api = await loadReplay(); const value = createT12DHistoricalFixture();
    for (const executionContext of [
      { ...value.executionContext, careerExecutionAuthorityGrantRevisionId: missing },
      { ...value.executionContext, careerHumanCommitmentId: "HCOM_00000000000000000000000000000000" },
      { ...value.executionContext, declaredByActorId: "OTHER" },
      { ...value.executionContext, decisionSubjects: value.executionContext.decisionSubjects.slice(0, 1) },
      { ...value.executionContext, sourceDeclarationClass: "REQUEST_FURTHER_EVIDENCE" },
      { ...value.executionContext, sourceActionIntentClass: "FURTHER_EVIDENCE_REQUEST_OPERATIONALIZATION" },
      { ...value.executionContext, operationDescription: "tampered" },
      { ...value.executionContext, executionAuthorityScope: "FURTHER_EVIDENCE_REQUEST_EXECUTION" },
      { ...value.executionContext, executionTarget: { targetKind: "ORGANIZATION", targetRef: "target://other" } },
      { ...value.executionContext, executionChannel: { channelKind: "API", channelRef: "channel://other" } },
      { ...value.executionContext, declaredAt: value.grant.effectiveUntil },
      { ...value.executionContext, contextEvidenceRefs: ["evidence://other"] },
    ]) await expect(semantic(api, graph({ executionContext })))
      .rejects.toThrow("ERR_CAREER_EXECUTION_CONTEXT_REVISION_REPLAY_MISMATCH");
  });

  it("fails closed for missing or invalid EAGR, HCOM, DAINT, DCR, DCTXREV, DAR, and RCP history", async () => {
    const api = await loadReplay(); const value = createT12DHistoricalFixture();
    for (const overrides of [
      { grant: null }, { grant: { ...value.grant, authorizedExecutionActorId: "OTHER" } },
      { commitment: null }, { commitment: { ...value.commitment, operationDescription: "tampered" } },
      { intent: null }, { intent: { ...value.actionIntent, operationDescription: "tampered" } },
      { record: null }, { record: { ...value.decisionRecord, declarantActorId: "OTHER" } },
      { decisionContext: null }, { decisionContext: { ...value.context, authorityScope: "BROKEN" } },
      { authority: null }, { authority: { ...value.authority, authorizedActorId: "OTHER" } },
      { proposal: null }, { proposal: { ...value.proposal, schemaVersion: "RECOMMENDATION_PROPOSAL_V0" } },
    ]) await expect(semantic(api, graph(overrides)))
      .rejects.toThrow("ERR_CAREER_EXECUTION_CONTEXT_REVISION_REPLAY_MISMATCH");
  });

  it("preserves historical EAGR applicability without current time or DAR interval re-evaluation", async () => {
    const api = await loadReplay(); const value = graph();
    expect(value.value.executionContext.declaredAt).toBe(value.value.grant.effectiveFrom);
    expect(value.value.executionContext.declaredAt < value.value.grant.effectiveUntil!).toBe(true);
    expect(value.value.grant.declaredAt > value.value.authority.effectiveUntil!).toBe(true);
    await expect(semantic(api, value)).resolves.toEqual(value.value.executionContext);
  });

  it("uses only exact historical repositories and exposes no resolver, provider, occurrence, or regeneration surface", async () => {
    const api = await loadReplay(); const value = graph();
    const allowed = new Set([
      "contexts", "grants", "commitments", "intents", "records", "decisionContexts", "authorities", "proposals",
    ]);
    const guarded = new Proxy(value, {
      get(target, property, receiver) {
        if (typeof property === "string" && !allowed.has(property)) {
          throw new Error(`ERR_UNEXPECTED_REPLAY_DEPENDENCY:${property}`);
        }
        return Reflect.get(target, property, receiver);
      },
    });
    await expect(api.semanticReplayCareerExecutionContextRevision(
      value.value.executionContext.careerExecutionContextRevisionId, guarded,
    )).resolves.toEqual(value.value.executionContext);
    expect(Object.keys(api)).not.toEqual(expect.arrayContaining([
      "providerReplayCareerExecutionContextRevision", "executionReplayCareerExecutionContextRevision",
      "getCurrentCareerExecutionContextRevision", "repairCareerExecutionContextRevision",
      "replaceCareerExecutionContextRevision", "supersedeCareerExecutionContextRevision",
      "createActionOccurrence", "regenerateCareerExecutionContextRevision",
    ]));
    if ("CAREER_EXECUTION_CONTEXT_REVISION_REPLAY_MODES" in api) {
      expect(api.CAREER_EXECUTION_CONTEXT_REVISION_REPLAY_MODES)
        .toEqual(["BYTE_REPLAY", "SEMANTIC_REPLAY", "DERIVATION_REPLAY"]);
    }
  });
});
