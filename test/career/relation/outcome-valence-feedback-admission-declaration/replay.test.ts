import { describe, expect, it } from "vitest";
import { createCareerOutcomeValenceFeedbackAdmissionDeclaration } from "../../../../lib/career/relation/outcome-valence-feedback-admission-declaration";
import { exactRepository } from "../state-change-declaration/t12f-historical-fixture";
import { createT12JHistoricalFixture } from "./t12j-historical-fixture";

const loadReplay = () =>
  import("../../../../lib/career/relation/outcome-valence-feedback-admission-declaration/replay") as Promise<any>;
const missing = "COVFAD_00000000000000000000000000000000";

function graph(overrides: Record<string, any> = {}) {
  const base = createT12JHistoricalFixture();
  const outcomeValenceFeedbackAdmissionDeclaration = createCareerOutcomeValenceFeedbackAdmissionDeclaration(
    base.outcomeValenceDeclaration,
    base.outcomeValenceFeedbackAdmissionDeclarationInput,
  );
  const item = (name: string, fallback: any) => Object.hasOwn(overrides, name) ? overrides[name] : fallback;
  const declaration = item("declaration", outcomeValenceFeedbackAdmissionDeclaration);
  const physicalDeclarationId = item(
    "physicalDeclarationId",
    declaration === null ? null : declaration.careerOutcomeValenceFeedbackAdmissionDeclarationId,
  );
  const declarationCalls: string[] = [];
  return {
    base,
    declaration,
    admissions: {
      calls: declarationCalls,
      async getCareerOutcomeValenceFeedbackAdmissionDeclarationById(id: string) {
        declarationCalls.push(id);
        return declaration !== null && physicalDeclarationId === id ? structuredClone(declaration) : null;
      },
    },
    outcomeValences: exactRepository(item("outcomeValence", base.outcomeValenceDeclaration), "careerOutcomeValenceDeclarationId", "getCareerOutcomeValenceDeclarationById"),
    outcomeRoles: exactRepository(item("outcomeRole", base.outcomeRoleDeclaration), "careerOutcomeRoleDeclarationId", "getCareerOutcomeRoleDeclarationById"),
    associations: exactRepository(item("association", base.associationDeclaration), "careerActionStateChangeAssociationDeclarationId", "getCareerActionStateChangeAssociationDeclarationById"),
    stateChanges: exactRepository(item("stateChange", base.stateChangeDeclaration), "careerStateChangeDeclarationId", "getCareerStateChangeDeclarationById"),
    occurrences: exactRepository(item("occurrence", base.occurrence), "careerActionOccurrenceId", "getCareerActionOccurrenceById"),
    contexts: exactRepository(item("executionContext", base.executionContext), "careerExecutionContextRevisionId", "getCareerExecutionContextRevisionById"),
    grants: exactRepository(item("grant", base.grant), "careerExecutionAuthorityGrantRevisionId", "getCareerExecutionAuthorityGrantRevisionById"),
    commitments: exactRepository(item("commitment", base.commitment), "careerHumanCommitmentId", "getCareerHumanCommitmentById"),
    intents: exactRepository(item("intent", base.actionIntent), "careerDecisionActionIntentId", "getCareerDecisionActionIntentById"),
    records: exactRepository(item("record", base.decisionRecord), "humanDecisionRecordId", "getHumanDecisionRecordById"),
    decisionContexts: exactRepository(item("decisionContext", base.context), "careerDecisionContextRevisionId", "getCareerDecisionContextRevisionById"),
    authorities: exactRepository(item("authority", base.authority), "decisionAuthorityGrantRevisionId", "getDecisionAuthorityGrantRevisionById"),
    proposals: exactRepository(item("proposal", base.proposal), "recommendationProposalId", "getRecommendationProposalById"),
  };
}

describe("T12J CareerOutcomeValenceFeedbackAdmissionDeclaration replay RED contract", () => {
  it("constructs canonical RCP through COVFAD history before the replay boundary", () => {
    const value = graph();
    expect(value.base.occurrence.occurredAt < value.base.grant.effectiveUntil!).toBe(true);
    expect(value.base.stateChangeDeclaration.observedAt > value.base.grant.effectiveUntil!).toBe(true);
    expect(value.base.associationDeclaration.declaredAt > value.base.grant.effectiveUntil!).toBe(true);
    expect(value.base.outcomeRoleDeclaration.declaredAt > value.base.grant.effectiveUntil!).toBe(true);
    expect(value.base.outcomeValenceDeclaration.declaredAt > value.base.grant.effectiveUntil!).toBe(true);
    expect(value.declaration.admittedAt > value.base.grant.effectiveUntil!).toBe(true);
  });

  it("freezes exactly BYTE_REPLAY, SEMANTIC_REPLAY, and DERIVATION_REPLAY with detached stored reads", async () => {
    const api = await loadReplay();
    const value = graph();
    const id = value.declaration.careerOutcomeValenceFeedbackAdmissionDeclarationId;
    const stored = await api.byteReplayCareerOutcomeValenceFeedbackAdmissionDeclaration(id, value);
    expect(stored.careerOutcomeValenceFeedbackAdmissionDeclarationId).toBe(id);
    stored.stateSubject.subjectRef = "local";
    expect(value.outcomeValences.calls).toEqual([]);
    expect(value.outcomeRoles.calls).toEqual([]);
    await expect(api.byteReplayCareerOutcomeValenceFeedbackAdmissionDeclaration(missing, graph({ declaration: null })))
      .rejects.toThrow("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_ADMISSION_DECLARATION_NOT_FOUND");
  });

  it("freezes SEMANTIC_REPLAY COVFAD -> COVD -> CORD -> ASCAD -> SCD -> AOC -> ECTXREV -> EAGR -> HCOM -> DAINT -> DCR -> DCTXREV -> DAR -> RCP", async () => {
    const api = await loadReplay();
    const value = graph();
    const declaration = createCareerOutcomeValenceFeedbackAdmissionDeclaration(
      value.base.outcomeValenceDeclaration,
      value.base.outcomeValenceFeedbackAdmissionDeclarationInput,
    );
    await expect(api.semanticReplayCareerOutcomeValenceFeedbackAdmissionDeclaration(declaration.careerOutcomeValenceFeedbackAdmissionDeclarationId, value))
      .resolves.toEqual(declaration);
    expect(value.admissions.calls).toEqual([declaration.careerOutcomeValenceFeedbackAdmissionDeclarationId]);
    expect(value.outcomeValences.calls).toEqual([value.base.outcomeValenceDeclaration.careerOutcomeValenceDeclarationId]);
    expect(value.outcomeRoles.calls).toEqual([value.base.outcomeRoleDeclaration.careerOutcomeRoleDeclarationId]);
    expect(value.associations.calls).toEqual([value.base.associationDeclaration.careerActionStateChangeAssociationDeclarationId]);
    expect(value.stateChanges.calls).toEqual([value.base.stateChangeDeclaration.careerStateChangeDeclarationId]);
    expect(value.occurrences.calls).toEqual([value.base.occurrence.careerActionOccurrenceId]);
    expect(value.contexts.calls).toEqual([value.base.executionContext.careerExecutionContextRevisionId]);
    expect(value.grants.calls).toEqual([value.base.grant.careerExecutionAuthorityGrantRevisionId]);
  });

  it("maps found corruption and missing predecessors to replay mismatch while derivation replays only deterministic COVFAD identity", async () => {
    const api = await loadReplay();
    const value = graph();
    const declaration = createCareerOutcomeValenceFeedbackAdmissionDeclaration(
      value.base.outcomeValenceDeclaration,
      value.base.outcomeValenceFeedbackAdmissionDeclarationInput,
    );
    await expect(api.semanticReplayCareerOutcomeValenceFeedbackAdmissionDeclaration(declaration.careerOutcomeValenceFeedbackAdmissionDeclarationId, graph({
      declaration: { ...declaration, outcomeValenceDeclaredAt: "2027-02-07T02:00:00.000Z" },
    }))).rejects.toThrow("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_ADMISSION_DECLARATION_REPLAY_MISMATCH");
    await expect(api.semanticReplayCareerOutcomeValenceFeedbackAdmissionDeclaration(declaration.careerOutcomeValenceFeedbackAdmissionDeclarationId, graph({ outcomeValence: null })))
      .rejects.toThrow("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_ADMISSION_DECLARATION_REPLAY_MISMATCH");
    await expect(api.derivationReplayCareerOutcomeValenceFeedbackAdmissionDeclaration(declaration.careerOutcomeValenceFeedbackAdmissionDeclarationId, value))
      .resolves.toEqual(declaration);
    expect(value.outcomeValences.calls).toEqual([]);
    expect(value.outcomeRoles.calls).toEqual([]);
    expect(value.associations.calls).toEqual([]);
    await expect(api.derivationReplayCareerOutcomeValenceFeedbackAdmissionDeclaration(missing, graph({ declaration: null })))
      .rejects.toThrow("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_ADMISSION_DECLARATION_NOT_FOUND");
  });

  it("preserves historical expiry without inferring target, receiver, delivery, learning, evaluation, satisfaction, truth, effect, success, attribution, causal, provider, or regeneration authority", async () => {
    const api = await loadReplay();
    const value = graph();
    const declaration = createCareerOutcomeValenceFeedbackAdmissionDeclaration(
      value.base.outcomeValenceDeclaration,
      value.base.outcomeValenceFeedbackAdmissionDeclarationInput,
    );
    await expect(api.semanticReplayCareerOutcomeValenceFeedbackAdmissionDeclaration(declaration.careerOutcomeValenceFeedbackAdmissionDeclarationId, value))
      .resolves.toEqual(declaration);
    expect(Object.keys(api)).not.toEqual(expect.arrayContaining([
      "feedbackReplayCareerOutcomeValenceFeedbackAdmissionDeclaration",
      "currentReplayCareerOutcomeValenceFeedbackAdmissionDeclaration",
      "getCurrentCareerOutcomeValenceFeedbackAdmissionDeclaration",
      "getLatestCareerOutcomeValenceFeedbackAdmissionDeclaration",
      "regenerateCareerOutcomeValenceFeedbackAdmissionDeclaration",
      "selectFeedbackTarget", "bindFeedbackTarget", "deliverCareerOutcomeValenceFeedbackAdmission",
      "receiveCareerOutcomeValenceFeedbackAdmission", "createContextRevision", "createLearning",
      "evaluateCareerOutcomeValenceFeedbackAdmission", "satisfyCareerOutcomeValenceFeedbackAdmission",
      "attributeCareerOutcomeValenceFeedbackAdmission",
    ]));
    if ("CAREER_OUTCOME_VALENCE_FEEDBACK_ADMISSION_DECLARATION_REPLAY_MODES" in api) {
      expect(api.CAREER_OUTCOME_VALENCE_FEEDBACK_ADMISSION_DECLARATION_REPLAY_MODES)
        .toEqual(["BYTE_REPLAY", "SEMANTIC_REPLAY", "DERIVATION_REPLAY"]);
    }
  });
});
