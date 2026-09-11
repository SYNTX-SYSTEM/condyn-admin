import { describe, expect, it } from "vitest";
import { createT12AHistoricalFixture } from "./t12a-historical-fixture";

const loadReplay = () => import("../../../../lib/career/relation/action-intent/replay") as Promise<any>;
const missing = "DAINT_00000000000000000000000000000000";

function exactRepository(value: any | null, idField: string, method: string) {
  const calls: string[] = [];
  return {
    calls,
    async [method](id: string) {
      calls.push(id);
      return value !== null && value[idField] === id ? structuredClone(value) : null;
    },
  };
}

function historicalGraph(overrides: Record<string, any> = {}) {
  const value = createT12AHistoricalFixture();
  const intent = Object.hasOwn(overrides, "intent") ? overrides.intent : value.actionIntent;
  const record = Object.hasOwn(overrides, "record") ? overrides.record : value.decisionRecord;
  const context = Object.hasOwn(overrides, "context") ? overrides.context : value.context;
  const authority = Object.hasOwn(overrides, "authority") ? overrides.authority : value.authority;
  const proposal = Object.hasOwn(overrides, "proposal") ? overrides.proposal : value.proposal;
  return {
    value,
    intents: exactRepository(intent, "careerDecisionActionIntentId", "getCareerDecisionActionIntentById"),
    records: exactRepository(record, "humanDecisionRecordId", "getHumanDecisionRecordById"),
    contexts: exactRepository(context, "careerDecisionContextRevisionId", "getCareerDecisionContextRevisionById"),
    authorities: exactRepository(authority, "decisionAuthorityGrantRevisionId", "getDecisionAuthorityGrantRevisionById"),
    proposals: exactRepository(proposal, "recommendationProposalId", "getRecommendationProposalById"),
  };
}

function semantic(api: any, graph: ReturnType<typeof historicalGraph>) {
  return api.semanticReplayCareerDecisionActionIntent(graph.value.actionIntent.careerDecisionActionIntentId, graph);
}

describe("T12A CareerDecisionActionIntent historical replay RED contract", () => {
  it("starts every replay proof from the sealed valid two-subject historical chain", () => {
    const graph = historicalGraph();
    expect(graph.value.decisionRecord.decisionSubjects).toHaveLength(2);
    expect(graph.value.actionIntent.decisionSubjects).toEqual(graph.value.decisionRecord.decisionSubjects);
    expect(graph.value.actionIntent.declaredAt >= graph.value.decisionRecord.declaredAt).toBe(true);
  });

  it("BYTE_REPLAY returns a detached exact persisted declaration and never consults DCR", async () => {
    const api = await loadReplay();
    const graph = historicalGraph();
    const first = await api.byteReplayCareerDecisionActionIntent(graph.value.actionIntent.careerDecisionActionIntentId, graph);
    expect(first).toEqual(graph.value.actionIntent);
    first.operationDescription = "local mutation";
    await expect(api.byteReplayCareerDecisionActionIntent(graph.value.actionIntent.careerDecisionActionIntentId, graph)).resolves.toEqual(graph.value.actionIntent);
    expect(graph.records.calls).toEqual([]);
    expect(graph.contexts.calls).toEqual([]);
    expect(graph.authorities.calls).toEqual([]);
    expect(graph.proposals.calls).toEqual([]);
  });

  it("BYTE_REPLAY does not regenerate a missing human action intent from an exact historical chain", async () => {
    const api = await loadReplay();
    const graph = historicalGraph({ intent: null });
    await expect(api.byteReplayCareerDecisionActionIntent(missing, graph)).rejects.toThrow("ERR_CAREER_DECISION_ACTION_INTENT_NOT_FOUND");
    expect(graph.records.calls).toEqual([]);
    expect(graph.contexts.calls).toEqual([]);
    expect(graph.authorities.calls).toEqual([]);
    expect(graph.proposals.calls).toEqual([]);
  });

  it("SEMANTIC_REPLAY validates exact DAINT, DCR, DCTXREV, DAR, and RCP historical state", async () => {
    const api = await loadReplay();
    const graph = historicalGraph();
    await expect(semantic(api, graph)).resolves.toEqual(graph.value.actionIntent);
    expect(graph.intents.calls).toEqual([graph.value.actionIntent.careerDecisionActionIntentId]);
    expect(graph.records.calls).toEqual([graph.value.decisionRecord.humanDecisionRecordId]);
    expect(graph.contexts.calls).toEqual([graph.value.context.careerDecisionContextRevisionId]);
    expect(graph.authorities.calls).toEqual([graph.value.authority.decisionAuthorityGrantRevisionId]);
    expect(graph.proposals.calls).toEqual([graph.value.proposal.recommendationProposalId]);
  });

  it("DERIVATION_REPLAY verifies only the persisted declaration identity and does not reconstruct through DCR", async () => {
    const api = await loadReplay();
    const graph = historicalGraph();
    await expect(api.derivationReplayCareerDecisionActionIntent(graph.value.actionIntent.careerDecisionActionIntentId, graph)).resolves.toEqual(graph.value.actionIntent);
    expect(graph.records.calls).toEqual([]);
    expect(graph.contexts.calls).toEqual([]);
    expect(graph.authorities.calls).toEqual([]);
    expect(graph.proposals.calls).toEqual([]);
  });

  it("all replay modes fail NOT_FOUND rather than regenerate a missing DAINT from DCR, DCTXREV, DAR, or RCP", async () => {
    const api = await loadReplay();
    for (const replay of [api.byteReplayCareerDecisionActionIntent, api.semanticReplayCareerDecisionActionIntent, api.derivationReplayCareerDecisionActionIntent]) {
      const graph = historicalGraph({ intent: null });
      await expect(replay(missing, graph)).rejects.toThrow("ERR_CAREER_DECISION_ACTION_INTENT_NOT_FOUND");
      expect(graph.records.calls).toEqual([]);
      expect(graph.contexts.calls).toEqual([]);
      expect(graph.authorities.calls).toEqual([]);
      expect(graph.proposals.calls).toEqual([]);
    }
  });

  it("DERIVATION_REPLAY rejects a persisted semantic DAINT tamper retained under its old identity", async () => {
    const api = await loadReplay();
    const graph = historicalGraph({ intent: { ...createT12AHistoricalFixture().actionIntent, operationDescription: "Tampered operation" } });
    await expect(api.derivationReplayCareerDecisionActionIntent(graph.value.actionIntent.careerDecisionActionIntentId, graph)).rejects.toThrow("ERR_CAREER_DECISION_ACTION_INTENT_REPLAY_MISMATCH");
  });

  it("SEMANTIC_REPLAY rejects DCR actor and source declaration-class disagreement", async () => {
    const api = await loadReplay();
    for (const record of [
      { ...createT12AHistoricalFixture().decisionRecord, declarantActorId: "OTHER_DECIDER" },
      { ...createT12AHistoricalFixture().decisionRecord, declarationClass: "REQUEST_FURTHER_EVIDENCE" },
    ]) await expect(semantic(api, historicalGraph({ record }))).rejects.toThrow("ERR_CAREER_DECISION_ACTION_INTENT_REPLAY_MISMATCH");
  });

  it("SEMANTIC_REPLAY rejects an exact DCR that loses a bound subject", async () => {
    const api = await loadReplay();
    const record = createT12AHistoricalFixture().decisionRecord;
    await expect(semantic(api, historicalGraph({ record: { ...record, decisionSubjects: record.decisionSubjects.slice(0, 1) } }))).rejects.toThrow("ERR_CAREER_DECISION_ACTION_INTENT_REPLAY_MISMATCH");
  });

  it("SEMANTIC_REPLAY rejects an exact DCR that gains an extra subject", async () => {
    const api = await loadReplay();
    const value = createT12AHistoricalFixture();
    const record = { ...value.decisionRecord, decisionSubjects: [...value.decisionRecord.decisionSubjects, { recommendationProposalId: value.proposal.recommendationProposalId, sourceEvolutionInputItemOrdinal: 77 }] };
    await expect(semantic(api, historicalGraph({ record }))).rejects.toThrow("ERR_CAREER_DECISION_ACTION_INTENT_REPLAY_MISMATCH");
  });

  it("SEMANTIC_REPLAY rejects an exact DCR whose bound subject ordinal changes", async () => {
    const api = await loadReplay();
    const record = createT12AHistoricalFixture().decisionRecord;
    const changed = [...record.decisionSubjects];
    changed[1] = { ...changed[1], sourceEvolutionInputItemOrdinal: 77 };
    await expect(semantic(api, historicalGraph({ record: { ...record, decisionSubjects: changed } }))).rejects.toThrow("ERR_CAREER_DECISION_ACTION_INTENT_REPLAY_MISMATCH");
  });

  it("SEMANTIC_REPLAY rejects duplicate and foreign DCR subjects instead of repairing their inventory", async () => {
    const api = await loadReplay();
    const value = createT12AHistoricalFixture();
    const subject = value.decisionRecord.decisionSubjects[0];
    for (const decisionSubjects of [
      [...value.decisionRecord.decisionSubjects, subject],
      [{ ...subject, recommendationProposalId: "RCP_00000000000000000000000000000000" }, value.decisionRecord.decisionSubjects[1]],
    ]) await expect(semantic(api, historicalGraph({ record: { ...value.decisionRecord, decisionSubjects } }))).rejects.toThrow("ERR_CAREER_DECISION_ACTION_INTENT_REPLAY_MISMATCH");
  });

  it("SEMANTIC_REPLAY rejects DCTXREV, DAR, and RCP historical witness disagreement", async () => {
    const api = await loadReplay();
    const value = createT12AHistoricalFixture();
    for (const overrides of [
      { context: { ...value.context, recommendationProposalId: "RCP_00000000000000000000000000000000" } },
      { authority: { ...value.authority, authorizedActorId: "OTHER_DECIDER" } },
      { proposal: { ...value.proposal, schemaVersion: "RECOMMENDATION_PROPOSAL_V0" } },
    ]) await expect(semantic(api, historicalGraph(overrides))).rejects.toThrow("ERR_CAREER_DECISION_ACTION_INTENT_REPLAY_MISMATCH");
  });

  it("SEMANTIC_REPLAY rejects a persisted actor, source class, or action class pairing that is not admissible", async () => {
    const api = await loadReplay();
    const value = createT12AHistoricalFixture();
    for (const intent of [
      { ...value.actionIntent, declaredByActorId: "OTHER_DECIDER" },
      { ...value.actionIntent, sourceDeclarationClass: "REQUEST_FURTHER_EVIDENCE" },
      { ...value.actionIntent, actionIntentClass: "FURTHER_EVIDENCE_REQUEST_OPERATIONALIZATION" },
    ]) await expect(semantic(api, historicalGraph({ intent }))).rejects.toThrow("ERR_CAREER_DECISION_ACTION_INTENT_REPLAY_MISMATCH");
  });

  it("SEMANTIC_REPLAY rejects tampered operation descriptions and evidence inventories without inference or deduplication", async () => {
    const api = await loadReplay();
    const value = createT12AHistoricalFixture();
    for (const intent of [
      { ...value.actionIntent, operationDescription: "Tampered operation" },
      { ...value.actionIntent, actionIntentEvidenceRefs: [] },
      { ...value.actionIntent, actionIntentEvidenceRefs: ["evidence://intent/t12a", "evidence://intent/extra"] },
      { ...value.actionIntent, actionIntentEvidenceRefs: ["evidence://intent/t12a", "evidence://intent/t12a"] },
      { ...value.actionIntent, actionIntentEvidenceRefs: [" "] },
    ]) await expect(semantic(api, historicalGraph({ intent }))).rejects.toThrow("ERR_CAREER_DECISION_ACTION_INTENT_REPLAY_MISMATCH");
  });

  it("SEMANTIC_REPLAY preserves the T12A temporal boundary after DAR effectiveUntil", async () => {
    const api = await loadReplay();
    const graph = historicalGraph();
    expect(graph.value.decisionRecord.declaredAt >= graph.value.authority.effectiveFrom).toBe(true);
    expect(graph.value.decisionRecord.declaredAt < graph.value.authority.effectiveUntil).toBe(true);
    expect(graph.value.actionIntent.declaredAt > graph.value.authority.effectiveUntil).toBe(true);
    expect(graph.value.actionIntent.declaredAt >= graph.value.decisionRecord.declaredAt).toBe(true);
    await expect(semantic(api, graph)).resolves.toEqual(graph.value.actionIntent);
  });

  it("SEMANTIC_REPLAY accesses only exact historical repositories and no current, provider, model, or producer surface", async () => {
    const api = await loadReplay();
    const graph = historicalGraph();
    const permitted = new Set(["intents", "records", "contexts", "authorities", "proposals"]);
    const guarded = new Proxy(graph, { get(target, property, receiver) { if (typeof property === "string" && !permitted.has(property)) throw new Error(`ERR_UNEXPECTED_REPLAY_DEPENDENCY:${property}`); return Reflect.get(target, property, receiver); } });
    await expect(api.semanticReplayCareerDecisionActionIntent(graph.value.actionIntent.careerDecisionActionIntentId, guarded)).resolves.toEqual(graph.value.actionIntent);
  });

  it("exposes only the closed T12A replay modes and no later-layer or mutable-state replay surface", async () => {
    const api = await loadReplay();
    const forbidden = ["current", "latest", "head", "repair", "replace", "supersede", "update", "commitment", "executionAuthority", "executionContext", "actionOccurrence", "outcome", "success", "approved", "authorized"];
    expect(Object.keys(api)).not.toEqual(expect.arrayContaining(["providerAuditCareerDecisionActionIntent", "decisionReplayCareerDecisionActionIntent", "executionReplayCareerDecisionActionIntent", "outcomeReplayCareerDecisionActionIntent"]));
    expect(Object.keys(api).map(key => key.toLowerCase())).not.toEqual(expect.arrayContaining(forbidden.map(value => value.toLowerCase())));
    if ("CAREER_DECISION_ACTION_INTENT_REPLAY_MODES" in api) expect(api.CAREER_DECISION_ACTION_INTENT_REPLAY_MODES).toEqual(["BYTE_REPLAY", "SEMANTIC_REPLAY", "DERIVATION_REPLAY"]);
  });
});
