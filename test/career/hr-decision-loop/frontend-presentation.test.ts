import { describe, expect, it } from "vitest";
import {
  boundDecisionContextRevisionIds,
  decisionRevisionBindingIdsFor,
  decisionRevisionBindingRegionState,
  decodeDecisionContextRevisionPresentation,
  decodeHrDecisionLoopPresentation,
  decodeHumanDecisionRecordPresentation,
  describeDecisionContextLineage,
  HR_DECISION_LOOP_REGION_ORDER,
  walkDecisionContextLineage,
  type DecisionContextLineageRead
} from "../../../lib/career/hr-decision-loop/frontend-presentation";
import { HR_DECISION_LOOP_REGION_NAMES } from "../../../lib/career/hr-decision-loop/read-model";
import { createT12AHistoricalFixture } from "../relation/action-intent/t12a-historical-fixture";

const emptyRegion = { state: "EMPTY", artifactIds: [], artifacts: [] };

function readModel() {
  const fixture = createT12AHistoricalFixture();
  const regions = Object.fromEntries(HR_DECISION_LOOP_REGION_NAMES.map(name => [name, structuredClone(emptyRegion)]));
  return {
    fixture,
    model: {
      schemaVersion: "HR_DECISION_LOOP_READ_MODEL_V1",
      careerDecisionContextRevision: fixture.context,
      decisionAuthorityGrantRevision: fixture.authority,
      recommendationProposal: fixture.proposal,
      ...regions,
      decisions: { state: "AVAILABLE", artifactIds: [fixture.decisionRecord.humanDecisionRecordId], artifacts: [fixture.decisionRecord] },
      actionIntents: { state: "AVAILABLE", artifactIds: [fixture.actionIntent.careerDecisionActionIntentId], artifacts: [fixture.actionIntent] },
      commitments: { state: "NOT_PROVISIONED", artifactIds: [], artifacts: [] },
      outcomeValences: { state: "FAILED", artifactIds: ["COVD_X"], artifacts: [], failureCode: "ERR_CAREER_OUTCOME_VALENCE_DECLARATION_PERSISTENCE_FAILED" }
    } as Record<string, unknown>
  };
}

describe("HR Decision Loop frontend presentation", () => {
  it("decodes the documented read model into exact labels without deriving a loop state", () => {
    const { fixture, model } = readModel();
    const presentation = decodeHrDecisionLoopPresentation(model);
    expect(presentation).not.toBeNull();
    expect(presentation!.mode).toBe("HR_DECISION_LOOP_EXACT_CONTEXT");
    expect(presentation!.careerDecisionContextRevisionId).toBe(fixture.context.careerDecisionContextRevisionId);
    expect(presentation!.authorizedActorId).toBe("DECIDER_T12A");
    expect(presentation!.effectiveUntil).toBe("2027-02-01T12:00:00.000Z");
    expect(presentation!.subjects.map(subject => subject.sourceEvolutionInputItemOrdinal)).toEqual([0, 1]);
    expect(presentation!.subjects.every(subject => subject.recommendationDisposition === "PROPOSED")).toBe(true);
    expect(presentation!.regions.map(region => region.name)).toEqual([...HR_DECISION_LOOP_REGION_ORDER]);
    const decisions = presentation!.regions.find(region => region.name === "decisions")!;
    expect(decisions.state).toBe("AVAILABLE");
    expect(decisions.count).toBe(1);
    expect(decisions.rows[0].id).toBe(fixture.decisionRecord.humanDecisionRecordId);
    expect(decisions.rows[0].facts).toEqual([
      { label: "declarationClass", value: "ACCEPT_RECOMMENDATION" },
      { label: "declarantActorId", value: "DECIDER_T12A" },
      { label: "declaredAt", value: "2027-02-01T00:00:00.000Z" }
    ]);
    expect(presentation!.regions.find(region => region.name === "commitments")!.state).toBe("NOT_PROVISIONED");
    const valences = presentation!.regions.find(region => region.name === "outcomeValences")!;
    expect(valences.state).toBe("FAILED");
    expect(valences.failureCode).toBe("ERR_CAREER_OUTCOME_VALENCE_DECLARATION_PERSISTENCE_FAILED");
    expect(valences.count).toBe(0);
    const serialized = JSON.stringify(presentation);
    for (const forbidden of ["\"current\"", "\"head\"", "\"latest\"", "\"accepted\"", "\"loopClosed\"", "\"success\""]) expect(serialized).not.toContain(forbidden);
  });

  it("refuses undocumented shapes instead of repairing them", () => {
    const { model } = readModel();
    expect(decodeHrDecisionLoopPresentation(null)).toBeNull();
    expect(decodeHrDecisionLoopPresentation({ ...model, schemaVersion: "HR_DECISION_LOOP_READ_MODEL_V2" })).toBeNull();
    expect(decodeHrDecisionLoopPresentation({ ...model, decisions: { state: "CURRENT", artifactIds: [], artifacts: [] } })).toBeNull();
    expect(decodeHrDecisionLoopPresentation({ ...model, decisions: { state: "FAILED", artifactIds: [], artifacts: [] } })).toBeNull();
    expect(decodeHrDecisionLoopPresentation({ ...model, decisions: { state: "AVAILABLE", artifactIds: ["a", "b"], artifacts: [] } })).toBeNull();
    const { feedbackContextRevisions: _dropped, ...withoutRegion } = model as Record<string, unknown>;
    expect(decodeHrDecisionLoopPresentation(withoutRegion)).toBeNull();
    const subjectWithoutItem = { ...model, careerDecisionContextRevision: { ...(model.careerDecisionContextRevision as object), decisionSubjects: [{ recommendationProposalId: "RCP_X", sourceEvolutionInputItemOrdinal: 99 }] } };
    expect(decodeHrDecisionLoopPresentation(subjectWithoutItem)).toBeNull();
  });

  it("decodes the frozen Decision Context API v1 revision with exact lineage pointer and provenance", () => {
    const revision = {
      artifactKind: "DECISION_CONTEXT_REVISION",
      schemaVersion: "DECISION_CONTEXT_REVISION_V1",
      revisionId: "DREV_CHILD",
      previousRevisionId: "DREV_ROOT",
      context: {
        artifactKind: "DECISION_CONTEXT_DRAFT",
        schemaVersion: "DECISION_CONTEXT_DRAFT_V1",
        contextId: "DCTX_1",
        validationStatus: "NOT_RUN",
        sourceStateReferences: [{ producerId: "p", authorityContractId: "c", artifactId: "a", locator: "l" }],
        decisionQuestionId: "DQ_1",
        items: [
          { itemId: "I1", role: "DECISION_QUESTION", statement: "Q?", provenance: { origin: "HUMAN_INPUT", actorId: "hr" } },
          { itemId: "I2", role: "OBSERVATION", statement: "Observed", provenance: { origin: "AUTHORITATIVE_STATE", stateReference: { producerId: "p", authorityContractId: "c", artifactId: "COVD_1", locator: "l" } } }
        ]
      },
      validationInput: { expectationValidations: [], consequenceValidations: [] },
      validationAssembly: {}
    };
    const decoded = decodeDecisionContextRevisionPresentation(revision);
    expect(decoded).toEqual({
      revisionId: "DREV_CHILD",
      previousRevisionId: "DREV_ROOT",
      contextId: "DCTX_1",
      decisionQuestionId: "DQ_1",
      validationStatus: "NOT_RUN",
      sourceStateReferences: [{ producerId: "p", authorityContractId: "c", artifactId: "a", locator: "l" }],
      items: [
        { itemId: "I1", role: "DECISION_QUESTION", statement: "Q?", provenanceOrigin: "HUMAN_INPUT", provenanceDetail: "hr" },
        { itemId: "I2", role: "OBSERVATION", statement: "Observed", provenanceOrigin: "AUTHORITATIVE_STATE", provenanceDetail: "c · COVD_1" }
      ]
    });
    expect(decodeDecisionContextRevisionPresentation({ ...revision, previousRevisionId: 7 })).toBeNull();
    expect(decodeDecisionContextRevisionPresentation({ ...revision, context: { ...revision.context, items: [{ itemId: "I", role: "CURRENT", statement: "x", provenance: { origin: "HUMAN_INPUT", actorId: "a" } }] } })).toBeNull();
    expect(decodeDecisionContextRevisionPresentation({ ...revision, artifactKind: "DECISION_CONTEXT_DRAFT" })).toBeNull();
  });

  it("walks lineage by previousRevisionId only and names its terminal, keeping absence and failed reads apart", async () => {
    const revision = (id: string, previous: string | null, references: object[] = [], items: object[] = []) => ({ artifactKind: "DECISION_CONTEXT_REVISION", schemaVersion: "DECISION_CONTEXT_REVISION_V1", revisionId: id, previousRevisionId: previous, context: { artifactKind: "DECISION_CONTEXT_DRAFT", contextId: id.toLowerCase(), decisionQuestionId: "q", validationStatus: "NOT_RUN", sourceStateReferences: references, items } });
    const revisions: Record<string, unknown> = { DREV_C: revision("DREV_C", "DREV_B"), DREV_B: revision("DREV_B", "DREV_A"), DREV_A: revision("DREV_A", null) };
    const reads: string[] = [];
    const reader = async (id: string): Promise<DecisionContextLineageRead> => { reads.push(id); return id in revisions ? { kind: "REVISION", value: revisions[id] } : { kind: "ABSENT" }; };
    const full = await walkDecisionContextLineage("DREV_C", reader);
    expect(full.revisions.map(candidate => candidate.revisionId)).toEqual(["DREV_C", "DREV_B", "DREV_A"]);
    expect(full.terminal).toBe("ROOT_REACHED");
    expect(reads).toEqual(["DREV_C", "DREV_B", "DREV_A"]);
    const dangling = await walkDecisionContextLineage("DREV_B", async id => id === "DREV_B" ? { kind: "REVISION", value: revisions.DREV_B } : { kind: "ABSENT" });
    expect(dangling.revisions.map(candidate => candidate.revisionId)).toEqual(["DREV_B"]);
    expect(dangling.terminal).toBe("PREDECESSOR_NOT_FOUND");
    const failing = await walkDecisionContextLineage("DREV_B", async id => id === "DREV_B" ? { kind: "REVISION", value: revisions.DREV_B } : { kind: "FAILED", code: "ERR_DECISION_API_INTERNAL" });
    expect(failing.revisions.map(candidate => candidate.revisionId)).toEqual(["DREV_B"]);
    expect(failing.terminal).toBe("PREDECESSOR_READ_FAILED");
    expect(failing.failureCode).toBe("ERR_DECISION_API_INTERNAL");
    const undecodable = await walkDecisionContextLineage("DREV_B", async id => id === "DREV_B" ? { kind: "REVISION", value: revisions.DREV_B } : { kind: "REVISION", value: { artifactKind: "OTHER" } });
    expect(undecodable.terminal).toBe("PREDECESSOR_UNDECODABLE");
    const cyclic = await walkDecisionContextLineage("DREV_X", async () => ({ kind: "REVISION", value: revision("DREV_X", "DREV_X") }));
    expect(cyclic.terminal).toBe("DEPTH_BOUND_REACHED");
    expect(cyclic.revisions).toHaveLength(32);
  });

  it("describes each walked revision against its persisted predecessor without claiming governance", async () => {
    const snapshot = { producerId: "p", authorityContractId: "CAPABILITY_PHASE4_VERIFIED_V1", artifactId: "SNAP_1", locator: "k" };
    const covd = { producerId: "CONDYN_CAREER_CANONICAL_CHAIN", authorityContractId: "CAREER_OUTCOME_VALENCE_DECLARATION_V1", artifactId: "COVD_1", locator: "COVD_1" };
    const human = { origin: "HUMAN_INPUT", actorId: "hr" };
    const revision = (id: string, previous: string | null, references: object[], items: object[]) => ({ artifactKind: "DECISION_CONTEXT_REVISION", schemaVersion: "DECISION_CONTEXT_REVISION_V1", revisionId: id, previousRevisionId: previous, context: { artifactKind: "DECISION_CONTEXT_DRAFT", contextId: id, decisionQuestionId: "q", validationStatus: "NOT_RUN", sourceStateReferences: references, items } });
    const root = revision("DREV_ROOT", null, [snapshot], [{ itemId: "I1", role: "DECISION_QUESTION", statement: "Q?", provenance: human }]);
    const direct = revision("DREV_DIRECT", "DREV_ROOT", [snapshot, covd], [{ itemId: "I1", role: "DECISION_QUESTION", statement: "Q?", provenance: human }, { itemId: "I2", role: "OBSERVATION", statement: "obs", provenance: { origin: "AUTHORITATIVE_STATE", stateReference: covd } }]);
    const governed = revision("DREV_GOVERNED", "DREV_ROOT", [snapshot], [{ itemId: "I1", role: "DECISION_QUESTION", statement: "Q?", provenance: human }, { itemId: "I3", role: "OBSERVATION", statement: "obs", provenance: { origin: "AUTHORITATIVE_STATE", stateReference: snapshot } }]);
    const store: Record<string, unknown> = { DREV_ROOT: root, DREV_DIRECT: direct, DREV_GOVERNED: governed };
    const read = async (id: string): Promise<DecisionContextLineageRead> => id in store ? { kind: "REVISION", value: store[id] } : { kind: "ABSENT" };
    const directWalk = await walkDecisionContextLineage("DREV_DIRECT", read);
    expect(describeDecisionContextLineage(directWalk.revisions)).toEqual([
      { revisionId: "DREV_DIRECT", position: "CHILD", returnCharacter: "INVENTORY_EXTENDED", addedSourceStateReferences: [covd], addedItemIds: ["I2"] },
      { revisionId: "DREV_ROOT", position: "ROOT", returnCharacter: "ROOT", addedSourceStateReferences: [], addedItemIds: [] }
    ]);
    const governedWalk = await walkDecisionContextLineage("DREV_GOVERNED", read);
    expect(describeDecisionContextLineage(governedWalk.revisions)[0]).toEqual({ revisionId: "DREV_GOVERNED", position: "CHILD", returnCharacter: "INVENTORY_UNCHANGED", addedSourceStateReferences: [], addedItemIds: ["I3"] });
    const truncated = await walkDecisionContextLineage("DREV_DIRECT", async id => id === "DREV_DIRECT" ? { kind: "REVISION", value: direct } : { kind: "FAILED", code: null });
    expect(describeDecisionContextLineage(truncated.revisions)).toEqual([{ revisionId: "DREV_DIRECT", position: "CHILD", returnCharacter: "PREDECESSOR_NOT_READ", addedSourceStateReferences: [], addedItemIds: [] }]);
    expect(JSON.stringify(describeDecisionContextLineage(directWalk.revisions))).not.toMatch(/governed|current|head|latest|accepted/i);
  });

  it("exposes exact context links and typed bound revision ids on rows, never a selection", () => {
    const { fixture, model } = readModel();
    const otherContext = "DCTXREV_" + "A".repeat(32);
    const binding = { careerDecisionContextDecisionRevisionBindingId: "DCDRB_" + "B".repeat(32), careerDecisionContextRevision: { careerDecisionContextRevisionId: fixture.context.careerDecisionContextRevisionId }, decisionContextRevision: { revisionId: "DREV_" + "C".repeat(24) }, recommendationProposalWitness: { producerId: "x", authorityContractId: "y", artifactId: fixture.proposal.recommendationProposalId, locator: "z" }, schemaVersion: "CAREER_DECISION_CONTEXT_DECISION_REVISION_BINDING_V1", createdAt: "2026-10-08T11:00:00.000Z" };
    const target = { careerOutcomeValenceFeedbackTargetDeclarationId: "COVFTD_" + "D".repeat(32), targetCareerDecisionContextRevisionId: otherContext, declaredByActorId: "a", declaredAt: "2026-10-08T10:00:00.000Z" };
    const feedbackRevision = { careerOutcomeValenceFeedbackContextRevisionId: "COVFCR_" + "E".repeat(32), parent: { parentRevisionKind: "CAREER_DECISION_CONTEXT_REVISION", parentRevisionId: otherContext }, careerOutcomeValenceFeedbackContextTransition: {}, createdAt: "2026-10-08T10:35:00.000Z" };
    const presentation = decodeHrDecisionLoopPresentation({
      ...model,
      decisionRevisionBindings: { state: "AVAILABLE", artifactIds: [binding.careerDecisionContextDecisionRevisionBindingId], artifacts: [binding] },
      feedbackTargets: { state: "AVAILABLE", artifactIds: [target.careerOutcomeValenceFeedbackTargetDeclarationId], artifacts: [target] },
      feedbackContextRevisions: { state: "AVAILABLE", artifactIds: [feedbackRevision.careerOutcomeValenceFeedbackContextRevisionId], artifacts: [feedbackRevision] }
    });
    expect(presentation).not.toBeNull();
    const bindings = presentation!.regions.find(region => region.name === "decisionRevisionBindings")!;
    expect(bindings.rows[0].boundDecisionContextRevisionId).toBe("DREV_" + "C".repeat(24));
    expect(bindings.rows[0].contextLinks).toEqual([{ label: "careerDecisionContextRevisionId", careerDecisionContextRevisionId: fixture.context.careerDecisionContextRevisionId }]);
    expect(boundDecisionContextRevisionIds(presentation!)).toEqual(["DREV_" + "C".repeat(24)]);
    expect(decisionRevisionBindingIdsFor(presentation!, "DREV_" + "C".repeat(24))).toEqual([binding.careerDecisionContextDecisionRevisionBindingId]);
    expect(decisionRevisionBindingIdsFor(presentation!, "DREV_" + "F".repeat(24))).toEqual([]);
    expect(decisionRevisionBindingRegionState(presentation!)!.state).toBe("AVAILABLE");
    expect(presentation!.regions.find(region => region.name === "feedbackTargets")!.rows[0].contextLinks).toEqual([{ label: "targetCareerDecisionContextRevisionId", careerDecisionContextRevisionId: otherContext }]);
    expect(presentation!.regions.find(region => region.name === "feedbackContextRevisions")!.rows[0].contextLinks).toEqual([{ label: "parentRevisionId", careerDecisionContextRevisionId: otherContext }]);
    expect(presentation!.regions.find(region => region.name === "decisions")!.rows[0].contextLinks).toEqual([]);
    expect(presentation!.regions.find(region => region.name === "decisions")!.rows[0].boundDecisionContextRevisionId).toBeUndefined();
    const unprovisioned = decodeHrDecisionLoopPresentation({ ...model, decisionRevisionBindings: { state: "NOT_PROVISIONED", artifactIds: [], artifacts: [] } })!;
    expect(decisionRevisionBindingRegionState(unprovisioned)!.state).toBe("NOT_PROVISIONED");
    expect(boundDecisionContextRevisionIds(unprovisioned)).toEqual([]);
    expect(decisionRevisionBindingIdsFor(unprovisioned, "DREV_" + "C".repeat(24))).toEqual([]);
  });

  it("decodes a human decision record and nothing that merely looks like one", () => {
    const { fixture } = readModel();
    const decoded = decodeHumanDecisionRecordPresentation(fixture.decisionRecord);
    expect(decoded).toEqual({
      humanDecisionRecordId: fixture.decisionRecord.humanDecisionRecordId,
      careerDecisionContextRevisionId: fixture.context.careerDecisionContextRevisionId,
      declarationClass: "ACCEPT_RECOMMENDATION",
      declarantActorId: "DECIDER_T12A",
      declaredAt: "2027-02-01T00:00:00.000Z",
      declarationEvidenceRefs: ["evidence://decision/t12a"]
    });
    expect(decodeHumanDecisionRecordPresentation({ ...fixture.decisionRecord, schemaVersion: "HUMAN_DECISION_RECORD_V2" })).toBeNull();
    expect(decodeHumanDecisionRecordPresentation({ ...fixture.decisionRecord, declarationEvidenceRefs: [1] })).toBeNull();
  });
});
