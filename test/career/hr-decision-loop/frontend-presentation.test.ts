import { describe, expect, it } from "vitest";
import {
  decodeDecisionContextRevisionPresentation,
  decodeHrDecisionLoopPresentation,
  decodeHumanDecisionRecordPresentation,
  HR_DECISION_LOOP_REGION_ORDER,
  walkDecisionContextLineage
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

  it("walks lineage by previousRevisionId only and names its terminal", async () => {
    const revisions: Record<string, unknown> = {
      DREV_C: { artifactKind: "DECISION_CONTEXT_REVISION", schemaVersion: "DECISION_CONTEXT_REVISION_V1", revisionId: "DREV_C", previousRevisionId: "DREV_B", context: { artifactKind: "DECISION_CONTEXT_DRAFT", contextId: "c", decisionQuestionId: "q", validationStatus: "NOT_RUN", sourceStateReferences: [], items: [] } },
      DREV_B: { artifactKind: "DECISION_CONTEXT_REVISION", schemaVersion: "DECISION_CONTEXT_REVISION_V1", revisionId: "DREV_B", previousRevisionId: "DREV_A", context: { artifactKind: "DECISION_CONTEXT_DRAFT", contextId: "b", decisionQuestionId: "q", validationStatus: "NOT_RUN", sourceStateReferences: [], items: [] } },
      DREV_A: { artifactKind: "DECISION_CONTEXT_REVISION", schemaVersion: "DECISION_CONTEXT_REVISION_V1", revisionId: "DREV_A", previousRevisionId: null, context: { artifactKind: "DECISION_CONTEXT_DRAFT", contextId: "a", decisionQuestionId: "q", validationStatus: "NOT_RUN", sourceStateReferences: [], items: [] } }
    };
    const reads: string[] = [];
    const reader = async (id: string) => { reads.push(id); return revisions[id] ?? null; };
    const full = await walkDecisionContextLineage("DREV_C", reader);
    expect(full.revisions.map(revision => revision.revisionId)).toEqual(["DREV_C", "DREV_B", "DREV_A"]);
    expect(full.terminal).toBe("ROOT_REACHED");
    expect(reads).toEqual(["DREV_C", "DREV_B", "DREV_A"]);
    const dangling = await walkDecisionContextLineage("DREV_B", async id => id === "DREV_B" ? revisions.DREV_B : null);
    expect(dangling.revisions.map(revision => revision.revisionId)).toEqual(["DREV_B"]);
    expect(dangling.terminal).toBe("PREDECESSOR_NOT_FOUND");
    const undecodable = await walkDecisionContextLineage("DREV_B", async id => id === "DREV_B" ? revisions.DREV_B : { artifactKind: "OTHER" });
    expect(undecodable.terminal).toBe("PREDECESSOR_UNDECODABLE");
    const cyclic = await walkDecisionContextLineage("DREV_X", async () => ({ ...revisions.DREV_B as object, revisionId: "DREV_X", previousRevisionId: "DREV_X" }));
    expect(cyclic.terminal).toBe("DEPTH_BOUND_REACHED");
    expect(cyclic.revisions).toHaveLength(32);
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
