import { describe, expect, it } from "vitest";
import { createT12CHistoricalFixture, exactRepository } from "./t12c-historical-fixture";

const loadReplay = () => import("../../../../lib/career/relation/execution-authority-grant/replay") as Promise<any>;
const missing = "EAGR_00000000000000000000000000000000";

function graph(overrides: Record<string, any> = {}) {
  const value = createT12CHistoricalFixture();
  const item = (name: string, fallback: any) => Object.hasOwn(overrides, name) ? overrides[name] : fallback;
  const grant = item("grant", value.grant);
  const physicalGrantId = item("physicalGrantId", grant === null ? null : grant.careerExecutionAuthorityGrantRevisionId);
  const grantCalls: string[] = [];
  return {
    value,
    grants: {
      calls: grantCalls,
      async getCareerExecutionAuthorityGrantRevisionById(id: string) {
        grantCalls.push(id);
        return grant !== null && physicalGrantId === id ? structuredClone(grant) : null;
      },
    },
    commitments: exactRepository(item("commitment", value.commitment), "careerHumanCommitmentId", "getCareerHumanCommitmentById"),
    intents: exactRepository(item("intent", value.actionIntent), "careerDecisionActionIntentId", "getCareerDecisionActionIntentById"),
    records: exactRepository(item("record", value.decisionRecord), "humanDecisionRecordId", "getHumanDecisionRecordById"),
    contexts: exactRepository(item("context", value.context), "careerDecisionContextRevisionId", "getCareerDecisionContextRevisionById"),
    authorities: exactRepository(item("authority", value.authority), "decisionAuthorityGrantRevisionId", "getDecisionAuthorityGrantRevisionById"),
    proposals: exactRepository(item("proposal", value.proposal), "recommendationProposalId", "getRecommendationProposalById"),
  };
}

function semantic(api: any, value: ReturnType<typeof graph>) {
  return api.semanticReplayCareerExecutionAuthorityGrantRevision(value.value.grant.careerExecutionAuthorityGrantRevisionId, value);
}

describe("T12C CareerExecutionAuthorityGrantRevision replay RED contract", () => {
  it("starts from an exact canonical RCP -> DAR -> DCTXREV -> DCR -> DAINT -> HCOM -> EAGR fixture", () => {
    const value = createT12CHistoricalFixture();
    expect(value.grant.careerHumanCommitmentId).toBe(value.commitment.careerHumanCommitmentId);
    expect(value.grant.decisionSubjects).toEqual(value.commitment.decisionSubjects);
    expect(value.grant.declaredAt >= value.commitment.committedAt).toBe(true);
  });

  it("BYTE_REPLAY returns detached persisted EAGR and missing physical EAGR is NOT_FOUND without regeneration", async () => {
    const api = await loadReplay(); const value = graph();
    const first = await api.byteReplayCareerExecutionAuthorityGrantRevision(value.value.grant.careerExecutionAuthorityGrantRevisionId, value);
    expect(first).toEqual(value.value.grant); first.operationDescription = "local";
    await expect(api.byteReplayCareerExecutionAuthorityGrantRevision(value.value.grant.careerExecutionAuthorityGrantRevisionId, value)).resolves.toEqual(value.value.grant);
    const absent = graph({ grant: null });
    await expect(api.byteReplayCareerExecutionAuthorityGrantRevision(missing, absent)).rejects.toThrow("ERR_CAREER_EXECUTION_AUTHORITY_GRANT_NOT_FOUND");
    expect(absent.commitments.calls).toEqual([]); expect(absent.intents.calls).toEqual([]);
  });

  it("SEMANTIC_REPLAY exact-reads EAGR -> HCOM -> DAINT -> DCR -> DCTXREV -> DAR -> RCP", async () => {
    const api = await loadReplay(); const value = graph();
    await expect(semantic(api, value)).resolves.toEqual(value.value.grant);
    expect(value.grants.calls).toEqual([value.value.grant.careerExecutionAuthorityGrantRevisionId]);
    expect(value.commitments.calls).toEqual([value.value.commitment.careerHumanCommitmentId]);
    expect(value.intents.calls).toEqual([value.value.actionIntent.careerDecisionActionIntentId]);
    expect(value.records.calls).toEqual([value.value.decisionRecord.humanDecisionRecordId]);
    expect(value.contexts.calls).toEqual([value.value.context.careerDecisionContextRevisionId]);
    expect(value.authorities.calls).toEqual([value.value.authority.decisionAuthorityGrantRevisionId]);
    expect(value.proposals.calls).toEqual([value.value.proposal.recommendationProposalId]);
  });

  it("DERIVATION_REPLAY verifies only persisted EAGR identity and cannot create a missing grant", async () => {
    const api = await loadReplay(); const value = graph();
    await expect(api.derivationReplayCareerExecutionAuthorityGrantRevision(value.value.grant.careerExecutionAuthorityGrantRevisionId, value)).resolves.toEqual(value.value.grant);
    expect(value.commitments.calls).toEqual([]); expect(value.intents.calls).toEqual([]);
    const absent = graph({ grant: null });
    await expect(api.derivationReplayCareerExecutionAuthorityGrantRevision(missing, absent)).rejects.toThrow("ERR_CAREER_EXECUTION_AUTHORITY_GRANT_NOT_FOUND");
  });

  it("distinguishes a missing physical root from a found root with stale EAGR payload identity", async () => {
    const api = await loadReplay(); const value = createT12CHistoricalFixture();
    const found = graph({
      grant: { ...value.grant, careerExecutionAuthorityGrantRevisionId: missing },
      physicalGrantId: value.grant.careerExecutionAuthorityGrantRevisionId,
    });
    await expect(semantic(api, found)).rejects.toThrow("ERR_CAREER_EXECUTION_AUTHORITY_GRANT_REPLAY_MISMATCH");
    expect(found.grants.calls).toEqual([value.grant.careerExecutionAuthorityGrantRevisionId]);
  });

  it("fails closed for EAGR actor, scope, subjects, inventories, operation, time, evidence, and stale semantic witnesses", async () => {
    const api = await loadReplay(); const value = createT12CHistoricalFixture();
    for (const grant of [
      { ...value.grant, grantorActorId: "OTHER" },
      { ...value.grant, authorizedExecutionActorId: "OTHER" },
      { ...value.grant, executionAuthorityScope: "FURTHER_EVIDENCE_REQUEST_EXECUTION" },
      { ...value.grant, decisionSubjects: value.grant.decisionSubjects.slice(0, 1) },
      { ...value.grant, operationDescription: "tampered" },
      { ...value.grant, declaredAt: "2027-02-02T00:00:00.000Z" },
      { ...value.grant, permittedTargetKinds: ["PERSON"] },
      { ...value.grant, permittedChannelKinds: ["API"] },
      { ...value.grant, authorityEvidenceRefs: ["evidence://other"] },
    ]) await expect(semantic(api, graph({ grant }))).rejects.toThrow("ERR_CAREER_EXECUTION_AUTHORITY_GRANT_REPLAY_MISMATCH");
  });

  it("fails closed for invalid or missing HCOM, DAINT, DCR, DCTXREV, DAR, and RCP witnesses", async () => {
    const api = await loadReplay(); const value = createT12CHistoricalFixture();
    for (const overrides of [
      { commitment: null }, { commitment: { ...value.commitment, operationDescription: "tampered" } },
      { intent: null }, { intent: { ...value.actionIntent, operationDescription: "tampered" } },
      { record: null }, { record: { ...value.decisionRecord, declarantActorId: "OTHER" } },
      { context: null }, { context: { ...value.context, authorityScope: "BROKEN" } },
      { authority: null }, { authority: { ...value.authority, authorizedActorId: "OTHER" } },
      { proposal: null }, { proposal: { ...value.proposal, schemaVersion: "RECOMMENDATION_PROPOSAL_V0" } },
    ]) await expect(semantic(api, graph(overrides))).rejects.toThrow("ERR_CAREER_EXECUTION_AUTHORITY_GRANT_REPLAY_MISMATCH");
  });

  it("preserves explicit self/foreign delegation and validates EAGR interval without current or DAR-time reuse", async () => {
    const api = await loadReplay(); const value = graph();
    expect(value.value.decisionRecord.declaredAt < value.value.authority.effectiveUntil!).toBe(true);
    expect(value.value.grant.declaredAt > value.value.authority.effectiveUntil!).toBe(true);
    await expect(semantic(api, value)).resolves.toEqual(value.value.grant);
  });

  it("uses only exact historical repositories and exposes no provider, current, execution, or regeneration surface", async () => {
    const api = await loadReplay(); const value = graph();
    const allowed = new Set(["grants", "commitments", "intents", "records", "contexts", "authorities", "proposals"]);
    const guarded = new Proxy(value, { get(target, property, receiver) { if (typeof property === "string" && !allowed.has(property)) throw new Error(`ERR_UNEXPECTED_REPLAY_DEPENDENCY:${property}`); return Reflect.get(target, property, receiver); } });
    await expect(api.semanticReplayCareerExecutionAuthorityGrantRevision(value.value.grant.careerExecutionAuthorityGrantRevisionId, guarded)).resolves.toEqual(value.value.grant);
    expect(Object.keys(api)).not.toEqual(expect.arrayContaining(["providerAuditCareerExecutionAuthorityGrantRevision", "executionReplayCareerExecutionAuthorityGrantRevision", "getCurrentExecutionAuthority", "repairCareerExecutionAuthorityGrantRevision", "replaceCareerExecutionAuthorityGrantRevision", "supersedeCareerExecutionAuthorityGrantRevision", "createExecutionContext", "createActionOccurrence"]));
    if ("CAREER_EXECUTION_AUTHORITY_GRANT_REPLAY_MODES" in api) expect(api.CAREER_EXECUTION_AUTHORITY_GRANT_REPLAY_MODES).toEqual(["BYTE_REPLAY", "SEMANTIC_REPLAY", "DERIVATION_REPLAY"]);
  });
});
