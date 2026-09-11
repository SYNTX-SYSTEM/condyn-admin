import { describe, expect, it } from "vitest";
import { createT12BHistoricalFixture, exactRepository } from "./t12b-historical-fixture";

const loadReplay = () => import("../../../../lib/career/relation/human-commitment/replay") as Promise<any>;
const missing = "HCOM_00000000000000000000000000000000";

function graph(overrides: Record<string, any> = {}) {
  const value = createT12BHistoricalFixture();
  const item = (name: string, fallback: any) => Object.hasOwn(overrides, name) ? overrides[name] : fallback;
  const commitment = item("commitment", value.commitment);
  const commitmentPhysicalId = item(
    "commitmentPhysicalId",
    commitment === null ? null : commitment.careerHumanCommitmentId,
  );
  const commitmentCalls: string[] = [];
  return {
    value,
    // A durable root key can remain correct while its JSON payload ID is corrupt.
    commitments: {
      calls: commitmentCalls,
      async getCareerHumanCommitmentById(id: string) {
        commitmentCalls.push(id);
        return commitment !== null && commitmentPhysicalId === id
          ? structuredClone(commitment)
          : null;
      },
    },
    intents: exactRepository(item("intent", value.actionIntent), "careerDecisionActionIntentId", "getCareerDecisionActionIntentById"),
    records: exactRepository(item("record", value.decisionRecord), "humanDecisionRecordId", "getHumanDecisionRecordById"),
    contexts: exactRepository(item("context", value.context), "careerDecisionContextRevisionId", "getCareerDecisionContextRevisionById"),
    authorities: exactRepository(item("authority", value.authority), "decisionAuthorityGrantRevisionId", "getDecisionAuthorityGrantRevisionById"),
    proposals: exactRepository(item("proposal", value.proposal), "recommendationProposalId", "getRecommendationProposalById"),
  };
}

function semantic(api: any, value: ReturnType<typeof graph>) {
  return api.semanticReplayCareerHumanCommitment(value.value.commitment.careerHumanCommitmentId, value);
}

describe("T12B CareerHumanCommitment replay RED contract", () => {
  it("starts from one exact canonical T12A DAINT and explicit non-regenerable HCOM", () => {
    const value = createT12BHistoricalFixture();
    expect(value.commitment.decisionSubjects).toEqual(value.actionIntent.decisionSubjects);
    expect(value.commitment.committedAt >= value.actionIntent.declaredAt).toBe(true);
  });

  it("BYTE_REPLAY returns detached persisted HCOM and never consults DAINT lineage", async () => {
    const api = await loadReplay(); const value = graph();
    const first = await api.byteReplayCareerHumanCommitment(value.value.commitment.careerHumanCommitmentId, value);
    expect(first).toEqual(value.value.commitment); first.operationDescription = "local";
    await expect(api.byteReplayCareerHumanCommitment(value.value.commitment.careerHumanCommitmentId, value)).resolves.toEqual(value.value.commitment);
    expect(value.intents.calls).toEqual([]); expect(value.records.calls).toEqual([]);
  });

  it("all replay modes fail NOT_FOUND rather than infer a missing HCOM from an exact DAINT chain", async () => {
    const api = await loadReplay();
    for (const replay of [api.byteReplayCareerHumanCommitment, api.semanticReplayCareerHumanCommitment, api.derivationReplayCareerHumanCommitment]) {
      const value = graph({ commitment: null });
      await expect(replay(missing, value)).rejects.toThrow("ERR_CAREER_HUMAN_COMMITMENT_NOT_FOUND");
      expect(value.intents.calls).toEqual([]); expect(value.records.calls).toEqual([]); expect(value.contexts.calls).toEqual([]); expect(value.authorities.calls).toEqual([]); expect(value.proposals.calls).toEqual([]);
    }
  });

  it("SEMANTIC_REPLAY exact-reads HCOM then DAINT, DCR, DCTXREV, DAR, and RCP", async () => {
    const api = await loadReplay(); const value = graph();
    await expect(semantic(api, value)).resolves.toEqual(value.value.commitment);
    expect(value.commitments.calls).toEqual([value.value.commitment.careerHumanCommitmentId]);
    expect(value.intents.calls).toEqual([value.value.actionIntent.careerDecisionActionIntentId]);
    expect(value.records.calls).toEqual([value.value.decisionRecord.humanDecisionRecordId]);
    expect(value.contexts.calls).toEqual([value.value.context.careerDecisionContextRevisionId]);
    expect(value.authorities.calls).toEqual([value.value.authority.decisionAuthorityGrantRevisionId]);
    expect(value.proposals.calls).toEqual([value.value.proposal.recommendationProposalId]);
  });

  it("DERIVATION_REPLAY recomputes only persisted HCOM identity and does not fetch DAINT", async () => {
    const api = await loadReplay(); const value = graph();
    await expect(api.derivationReplayCareerHumanCommitment(value.value.commitment.careerHumanCommitmentId, value)).resolves.toEqual(value.value.commitment);
    expect(value.intents.calls).toEqual([]); expect(value.records.calls).toEqual([]); expect(value.contexts.calls).toEqual([]);
  });

  it("rejects a found root row with stale HCOM payload identity and other tampered HCOM witnesses", async () => {
    const api = await loadReplay();
    const value = createT12BHistoricalFixture();
    const physicalId = value.commitment.careerHumanCommitmentId;
    const stalePayload = { ...value.commitment, careerHumanCommitmentId: missing };
    const found = graph({ commitment: stalePayload, commitmentPhysicalId: physicalId });
    await expect(semantic(api, found)).rejects.toThrow("ERR_CAREER_HUMAN_COMMITMENT_REPLAY_MISMATCH");
    expect(found.commitments.calls).toEqual([physicalId]);
    for (const commitment of [
      { ...value.commitment, committedByActorId: "OTHER" },
      { ...value.commitment, sourceDeclarationClass: "REQUEST_FURTHER_EVIDENCE" },
      { ...value.commitment, sourceActionIntentClass: "FURTHER_EVIDENCE_REQUEST_OPERATIONALIZATION" },
      { ...value.commitment, operationDescription: "tampered" },
      { ...value.commitment, committedAt: "2027-02-01T00:00:00.000Z" },
      { ...value.commitment, decisionSubjects: value.commitment.decisionSubjects.slice(0, 1) },
      { ...value.commitment, decisionSubjects: [...value.commitment.decisionSubjects, value.commitment.decisionSubjects[0]] },
      { ...value.commitment, commitmentEvidenceRefs: [] },
      { ...value.commitment, commitmentEvidenceRefs: ["evidence://commitment/t12b", "evidence://commitment/t12b"] },
    ]) await expect(semantic(api, graph({ commitment }))).rejects.toThrow("ERR_CAREER_HUMAN_COMMITMENT_REPLAY_MISMATCH");
  });

  it("rejects missing or tampered DAINT and DCR historical facts", async () => {
    const api = await loadReplay(); const value = createT12BHistoricalFixture();
    for (const overrides of [
      { intent: null },
      { intent: { ...value.actionIntent, operationDescription: "tampered" } },
      { record: null },
      { record: { ...value.decisionRecord, declarantActorId: "OTHER" } },
      { record: { ...value.decisionRecord, decisionSubjects: value.decisionRecord.decisionSubjects.slice(0, 1) } },
    ]) await expect(semantic(api, graph(overrides))).rejects.toThrow("ERR_CAREER_HUMAN_COMMITMENT_REPLAY_MISMATCH");
  });

  it("rejects missing or tampered DCTXREV, DAR, and RCP historical facts", async () => {
    const api = await loadReplay(); const value = createT12BHistoricalFixture();
    for (const overrides of [
      { context: null }, { context: { ...value.context, authorityScope: "BROKEN" } },
      { authority: null }, { authority: { ...value.authority, authorizedActorId: "OTHER" } },
      { proposal: null }, { proposal: { ...value.proposal, schemaVersion: "RECOMMENDATION_PROPOSAL_V0" } },
    ]) await expect(semantic(api, graph(overrides))).rejects.toThrow("ERR_CAREER_HUMAN_COMMITMENT_REPLAY_MISMATCH");
  });

  it("does not re-evaluate DAR applicability at HCOM committedAt", async () => {
    const api = await loadReplay(); const value = graph();
    expect(value.value.decisionRecord.declaredAt < value.value.authority.effectiveUntil!).toBe(true);
    expect(value.value.commitment.committedAt > value.value.authority.effectiveUntil!).toBe(true);
    await expect(semantic(api, value)).resolves.toEqual(value.value.commitment);
  });

  it("uses only exact historical repositories and exposes no provider, producer, execution, or mutable replay surface", async () => {
    const api = await loadReplay(); const value = graph();
    const allowed = new Set(["commitments", "intents", "records", "contexts", "authorities", "proposals"]);
    const guarded = new Proxy(value, { get(target, property, receiver) { if (typeof property === "string" && !allowed.has(property)) throw new Error(`ERR_UNEXPECTED_REPLAY_DEPENDENCY:${property}`); return Reflect.get(target, property, receiver); } });
    await expect(api.semanticReplayCareerHumanCommitment(value.value.commitment.careerHumanCommitmentId, guarded)).resolves.toEqual(value.value.commitment);
    expect(Object.keys(api)).not.toEqual(expect.arrayContaining(["providerAuditCareerHumanCommitment", "executionReplayCareerHumanCommitment", "createExecutionAuthority", "createActionOccurrence", "getCurrentCareerHumanCommitment", "repairCareerHumanCommitment", "replaceCareerHumanCommitment", "supersedeCareerHumanCommitment"]));
    if ("CAREER_HUMAN_COMMITMENT_REPLAY_MODES" in api) expect(api.CAREER_HUMAN_COMMITMENT_REPLAY_MODES).toEqual(["BYTE_REPLAY", "SEMANTIC_REPLAY", "DERIVATION_REPLAY"]);
  });
});
